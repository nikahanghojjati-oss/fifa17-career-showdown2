(function(root, factory){
  const api = factory(root);
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CareerModeSharedShowdownSetup = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(root){
  "use strict";

  // Candidate protocol only. A provider adapter must derive authority inside the
  // same transaction as the write. Caller-supplied authority is not authentication.
  const ROLES = Object.freeze(["playerOne", "playerTwo"]);
  const LEAGUES = Object.freeze(["premier_league", "laliga", "bundesliga", "serie_a", "ligue_1"]);
  const LENGTHS = Object.freeze([1, 3, 5, 10]);
  const PHASES = Object.freeze(["SHARED_SETUP_OPEN", "LEAGUE_WHEEL_COMMITTED", "CLUB_ASSIGNMENTS_COMMITTED", "SEASON_LENGTH_COMMITTED", "SHOWDOWN_CONFIRMED"]);
  const HASH = /^sha256:[0-9a-f]{64}$/;
  const STATE_KEYS = ["schemaVersion", "bindingHash", "catalogHash", "coordinatorRole", "phase", "revision", "leagueId", "clubs", "totalSeasons", "confirmedRoles", "receipts", "contentHash"];
  const COMMAND_FIELDS = Object.freeze({
    open: [],
    "commit-league": ["leagueId"],
    "commit-clubs": ["clubs"],
    "commit-length": ["totalSeasons"],
    confirm: ["setupHash"]
  });

  function ssjFail(code){ const error = new Error(code); error.code = code; throw error; }
  function plain(value){ return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
  function exact(value, keys, code){
    if(!plain(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) ssjFail(code);
  }
  function freeze(value){
    if(value && typeof value === "object" && !Object.isFrozen(value)){
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  }
  function ssjCanonical(value){
    if(Array.isArray(value)) return `[${value.map(ssjCanonical).join(",")}]`;
    if(plain(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${ssjCanonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  async function hash(value, cryptoImpl){
    if(!cryptoImpl || !cryptoImpl.subtle) ssjFail("SETUP_CRYPTO_UNAVAILABLE");
    const bytes = await cryptoImpl.subtle.digest("SHA-256", new TextEncoder().encode(ssjCanonical(value)));
    return `sha256:${Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  function validId(value, pattern){ return typeof value === "string" && pattern.test(value); }
  function validAccount(value){ return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value); }

  function authoritySnapshot(value){
    exact(value, ["rivalryId", "connectionState", "managerSlots", "actor", "session", "nowEpochMs"], "SETUP_AUTHORITY_INVALID");
    if(!validId(value.rivalryId, /^pair_[0-9a-f]{64}$/) || value.connectionState !== "active") ssjFail("SETUP_RIVALRY_INACTIVE");
    if(!Number.isSafeInteger(value.nowEpochMs) || value.nowEpochMs < 0) ssjFail("SETUP_CLOCK_INVALID");
    if(!Array.isArray(value.managerSlots) || value.managerSlots.length !== 2) ssjFail("SETUP_TWO_MANAGERS_REQUIRED");
    const slots = ROLES.map(role => {
      const slot = value.managerSlots.find(item => item && item.slotId === role);
      exact(slot, ["slotId", "accountId", "profileId", "saveId", "accountState", "entitlementState"], "SETUP_BINDING_INVALID");
      if(!validAccount(slot.accountId) || !validId(slot.profileId, /^profile_[0-9a-f]{24}$/) || !validId(slot.saveId, /^save_[0-9a-f]{24}$/)) ssjFail("SETUP_BINDING_INVALID");
      if(slot.accountState !== "active" || slot.entitlementState !== "active") ssjFail("SETUP_MANAGER_INACTIVE");
      return {...slot};
    });
    if(slots[0].accountId === slots[1].accountId) ssjFail("SETUP_TWO_MANAGERS_REQUIRED");
    const actor = value.actor;
    exact(actor, ["accountId", "deviceId", "deviceState", "managerRole", "profileId", "saveId"], "SETUP_ACTOR_INVALID");
    if(!validId(actor.deviceId, /^device_[0-9a-f]{32}$/) || actor.deviceState !== "active") ssjFail("SETUP_DEVICE_INACTIVE");
    const slot = slots.find(item => item.slotId === actor.managerRole);
    if(!slot || ["accountId", "profileId", "saveId"].some(key => slot[key] !== actor[key])) ssjFail("SETUP_ACTOR_NOT_ENTITLED");
    const session = value.session;
    exact(session, ["sessionId", "rivalryId", "state", "hostAccountId", "memberAccountIds", "expiresAtEpochMs"], "SETUP_SESSION_INVALID");
    if(!validId(session.sessionId, /^session_[0-9a-f]{64}$/) || session.rivalryId !== value.rivalryId) ssjFail("SETUP_SESSION_MISMATCH");
    if(session.state !== "active" || !Number.isSafeInteger(session.expiresAtEpochMs) || value.nowEpochMs >= session.expiresAtEpochMs) ssjFail("SETUP_ACTIVE_SESSION_REQUIRED");
    if(!Array.isArray(session.memberAccountIds) || session.memberAccountIds.length !== 2 || new Set(session.memberAccountIds).size !== 2 || !slots.every(item => session.memberAccountIds.includes(item.accountId))) ssjFail("SETUP_SESSION_MEMBERS_MISMATCH");
    const host = slots.find(item => item.accountId === session.hostAccountId);
    if(!host) ssjFail("SETUP_SESSION_MEMBERS_MISMATCH");
    return freeze({rivalryId:value.rivalryId, slots, role:slot.slotId, hostRole:host.slotId});
  }

  function catalogSnapshot(value){
    exact(value, LEAGUES, "SETUP_CATALOG_INVALID");
    const snapshot = {};
    for(const id of LEAGUES){
      const clubs = value[id];
      if(!Array.isArray(clubs) || clubs.length < 2 || clubs.length > 20 || new Set(clubs).size !== clubs.length || clubs.some(club => typeof club !== "string" || !club.trim() || club !== club.trim() || club.length > 80)) ssjFail("SETUP_CATALOG_INVALID");
      snapshot[id] = [...clubs];
    }
    return freeze(snapshot);
  }
  function commandSnapshot(value){
    if(!plain(value) || !Object.hasOwn(COMMAND_FIELDS, value.type)) ssjFail("SETUP_COMMAND_INVALID");
    exact(value, ["type", "operationId", "baseRevision", ...COMMAND_FIELDS[value.type]], "SETUP_COMMAND_INVALID");
    if(!validId(value.operationId, /^setup_op_[0-9a-f]{32}$/) || !Number.isSafeInteger(value.baseRevision) || value.baseRevision < 0) ssjFail("SETUP_COMMAND_INVALID");
    if(value.type === "commit-league" && !LEAGUES.includes(value.leagueId)) ssjFail("SETUP_LEAGUE_INVALID");
    if(value.type === "commit-clubs"){
      exact(value.clubs, ROLES, "SETUP_CLUBS_INVALID");
      if(ROLES.some(role => typeof value.clubs[role] !== "string")) ssjFail("SETUP_CLUBS_INVALID");
    }
    if(value.type === "commit-length" && !LENGTHS.includes(value.totalSeasons)) ssjFail("SETUP_LENGTH_INVALID");
    if(value.type === "confirm" && !validId(value.setupHash, HASH)) ssjFail("SETUP_CONFIRMATION_INVALID");
    return freeze({...value, ...(value.clubs ? {clubs:{...value.clubs}} : {})});
  }
  function setupValue(state){
    return {schemaVersion:1, bindingHash:state.bindingHash, catalogHash:state.catalogHash, coordinatorRole:state.coordinatorRole, leagueId:state.leagueId, clubs:state.clubs, totalSeasons:state.totalSeasons};
  }
  function validClubPair(clubs, leagueId, catalog){
    exact(clubs, ROLES, "SETUP_CLUBS_INVALID");
    if(clubs.playerOne === clubs.playerTwo || !catalog[leagueId] || !ROLES.every(role => catalog[leagueId].includes(clubs[role]))) ssjFail("SETUP_CLUBS_INVALID");
  }

  async function createProtocol({catalog, cryptoImpl = root.crypto} = {}){
    const clubsByLeague = catalogSnapshot(catalog);
    const catalogHash = await hash(clubsByLeague, cryptoImpl);
    async function verifyState(value){
      exact(value, STATE_KEYS, "SETUP_STATE_INVALID");
      // Copy before the first await so an async digest cannot validate one value
      // and later return a caller-mutated value.
      const state = JSON.parse(JSON.stringify(value));
      const {contentHash, ...core} = state;
      if(state.schemaVersion !== 1 || !validId(contentHash, HASH) || !validId(state.bindingHash, HASH) || state.catalogHash !== catalogHash || !ROLES.includes(state.coordinatorRole) || !PHASES.includes(state.phase)) ssjFail("SETUP_STATE_INVALID");
      if(!Number.isInteger(state.revision) || state.revision < 1 || state.revision > 6 || !Array.isArray(state.receipts) || state.receipts.length !== state.revision) ssjFail("SETUP_STATE_INVALID");
      if(!Array.isArray(state.confirmedRoles) || state.confirmedRoles.length > 2 || new Set(state.confirmedRoles).size !== state.confirmedRoles.length || state.confirmedRoles.some(role => !ROLES.includes(role))) ssjFail("SETUP_STATE_INVALID");
      const phaseIndex = PHASES.indexOf(state.phase);
      if(phaseIndex === 0 ? state.leagueId !== null : !LEAGUES.includes(state.leagueId)) ssjFail("SETUP_STATE_INVALID");
      if(phaseIndex < 2){ if(state.clubs !== null) ssjFail("SETUP_STATE_INVALID"); }
      else validClubPair(state.clubs, state.leagueId, clubsByLeague);
      if(phaseIndex < 3 ? state.totalSeasons !== null : !LENGTHS.includes(state.totalSeasons)) ssjFail("SETUP_STATE_INVALID");
      if(phaseIndex < 3 && state.confirmedRoles.length !== 0) ssjFail("SETUP_STATE_INVALID");
      if(phaseIndex === 3 && state.confirmedRoles.length > 1) ssjFail("SETUP_STATE_INVALID");
      if(phaseIndex === 4 && state.confirmedRoles.length !== 2) ssjFail("SETUP_STATE_INVALID");
      if(state.revision !== Math.min(phaseIndex + 1, 4) + state.confirmedRoles.length) ssjFail("SETUP_STATE_INVALID");
      const operations = new Set();
      for(const [index, receipt] of state.receipts.entries()){
        exact(receipt, ["operationHash", "requestHash", "acceptedRevision", "actorRole", "type"], "SETUP_RECEIPT_INVALID");
        if(!validId(receipt.operationHash, HASH) || !validId(receipt.requestHash, HASH) || receipt.acceptedRevision !== index + 1 || !ROLES.includes(receipt.actorRole) || operations.has(receipt.operationHash)) ssjFail("SETUP_RECEIPT_INVALID");
        operations.add(receipt.operationHash);
        const type = ["open", "commit-league", "commit-clubs", "commit-length", "confirm", "confirm"][index];
        if(receipt.type !== type || (index < 4 && receipt.actorRole !== state.coordinatorRole) || (index >= 4 && receipt.actorRole !== state.confirmedRoles[index - 4])) ssjFail("SETUP_RECEIPT_INVALID");
      }
      if(await hash(core, cryptoImpl) !== contentHash) ssjFail("SETUP_INTEGRITY_FAILED");
      return freeze(state);
    }

    async function apply({state = null, authority, command} = {}){
      try{
        // All external snapshots are captured before any asynchronous boundary.
        const context = authoritySnapshot(authority);
        const request = commandSnapshot(command);
        const priorPromise = state === null ? Promise.resolve(null) : verifyState(state);
        const [bindingHash, prior] = await Promise.all([
          hash({rivalryId:context.rivalryId, managerSlots:context.slots.map(({slotId, accountId, profileId, saveId}) => ({slotId, accountId, profileId, saveId}))}, cryptoImpl),
          priorPromise
        ]);
        if(prior && prior.bindingHash !== bindingHash) ssjFail("SETUP_BINDING_CHANGED");
        const operationHash = await hash(request.operationId, cryptoImpl);
        const requestHash = await hash({bindingHash, actorRole:context.role, command:request}, cryptoImpl);
        const receipt = prior && prior.receipts.find(item => item.operationHash === operationHash);
        if(receipt){
          if(receipt.requestHash !== requestHash) ssjFail("SETUP_IDEMPOTENCY_CONFLICT");
          return freeze({ok:true, status:"replayed", acceptedRevision:receipt.acceptedRevision, state:prior});
        }
        if(request.baseRevision !== (prior ? prior.revision : 0)) ssjFail("SETUP_STALE_BASE_REVISION");
        if(prior && prior.phase === "SHOWDOWN_CONFIRMED") ssjFail("SETUP_ALREADY_CONFIRMED");
        if(request.type === "open"){
          if(prior) ssjFail("SETUP_ALREADY_OPEN");
          if(context.role !== context.hostRole) ssjFail("SETUP_COORDINATOR_REQUIRED");
        }else{
          if(!prior) ssjFail("SETUP_NOT_OPEN");
          if(request.type !== "confirm" && context.role !== prior.coordinatorRole) ssjFail("SETUP_COORDINATOR_REQUIRED");
        }
        const next = prior ? JSON.parse(JSON.stringify(prior)) : {
          schemaVersion:1, bindingHash, catalogHash, coordinatorRole:context.role,
          phase:"SHARED_SETUP_OPEN", revision:0, leagueId:null, clubs:null,
          totalSeasons:null, confirmedRoles:[], receipts:[]
        };
        if(request.type === "commit-league"){
          if(prior.phase !== "SHARED_SETUP_OPEN") ssjFail("SETUP_TRANSITION_INVALID");
          next.leagueId = request.leagueId; next.phase = "LEAGUE_WHEEL_COMMITTED";
        }else if(request.type === "commit-clubs"){
          if(prior.phase !== "LEAGUE_WHEEL_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
          validClubPair(request.clubs, prior.leagueId, clubsByLeague);
          next.clubs = {...request.clubs}; next.phase = "CLUB_ASSIGNMENTS_COMMITTED";
        }else if(request.type === "commit-length"){
          if(prior.phase !== "CLUB_ASSIGNMENTS_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
          next.totalSeasons = request.totalSeasons; next.phase = "SEASON_LENGTH_COMMITTED";
        }else if(request.type === "confirm"){
          if(prior.phase !== "SEASON_LENGTH_COMMITTED" || prior.confirmedRoles.includes(context.role)) ssjFail("SETUP_CONFIRMATION_NOT_AVAILABLE");
          if(request.setupHash !== await hash(setupValue(prior), cryptoImpl)) ssjFail("SETUP_CONFIRMATION_CHANGED");
          next.confirmedRoles.push(context.role);
          if(next.confirmedRoles.length === 2) next.phase = "SHOWDOWN_CONFIRMED";
        }
        next.revision += 1;
        next.receipts.push({operationHash, requestHash, acceptedRevision:next.revision, actorRole:context.role, type:request.type});
        delete next.contentHash;
        next.contentHash = await hash(next, cryptoImpl);
        return freeze({ok:true, status:"accepted", acceptedRevision:next.revision, state:next});
      }catch(error){
        // Never echo provider authority, commands or private capabilities.
        return freeze({ok:false, code:typeof error.code === "string" && error.code.startsWith("SETUP_") ? error.code : "SETUP_INVALID_INPUT"});
      }
    }

    function pickIndex(length){
      if(!cryptoImpl || typeof cryptoImpl.getRandomValues !== "function") ssjFail("SETUP_CRYPTO_UNAVAILABLE");
      const bound = Math.floor(0x100000000 / length) * length;
      for(let attempts = 0; attempts < 128; attempts++){
        const value = cryptoImpl.getRandomValues(new Uint32Array(1))[0];
        if(value < bound) return value % length;
      }
      ssjFail("SETUP_RANDOMNESS_UNAVAILABLE");
    }
    async function prepareDraw({state, type, operationId}){
      const prior = await verifyState(state);
      if(type === "commit-league" && prior.phase === "SHARED_SETUP_OPEN") return commandSnapshot({type, operationId, baseRevision:prior.revision, leagueId:LEAGUES[pickIndex(LEAGUES.length)]});
      if(type === "commit-clubs" && prior.phase === "LEAGUE_WHEEL_COMMITTED"){
        const available = [...clubsByLeague[prior.leagueId]];
        const playerOne = available.splice(pickIndex(available.length), 1)[0];
        return commandSnapshot({type, operationId, baseRevision:prior.revision, clubs:{playerOne, playerTwo:available[pickIndex(available.length)]}});
      }
      ssjFail("SETUP_DRAW_NOT_AVAILABLE");
    }
    async function confirmationHash(state){ return hash(setupValue(await verifyState(state)), cryptoImpl); }
    return freeze({apply, verifyState, prepareDraw, confirmationHash, catalogHash});
  }
  return freeze({contractVersion:1, implementationState:"candidate-provider-neutral", productionEnabled:false, canonicalStorageMutation:false, billingRequired:false, roles:ROLES, leagueIds:LEAGUES, allowedSeasonLengths:LENGTHS, phases:PHASES, createProtocol});
});
