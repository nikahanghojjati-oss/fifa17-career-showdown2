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
  // R94-02 club draw ("spin and stop"). A setup opened with draw 2 deals each manager three candidate clubs
  // (six distinct, hash-derived, no write) and his club is the section of his ball where it came to rest:
  // one integer 0..359 per manager, carried inside his own confirm. The marker is the ledger key `stops`;
  // a ledger without it replays exactly as before R94-02 (same keys, same hashes, same clubs).
  const DRAW_STATE_KEYS = [...STATE_KEYS.slice(0, -1), "candidates", "stops", "contentHash"];
  const DRAW_CANDIDATES = 3;
  const STOP_SECTION_DEGREES = 120;
  // R95-01 Ball Game (draw 3, Nik 2026-11-17): the same spin and stop with SIX candidates per ball (twelve distinct
  // clubs from the drawn league), so each club holds a 60 degree slice and his club is candidates[floor(stop / 60)].
  // The marker is one more ledger key, `draw` (always the integer 3), written at open beside `stops` and never changed.
  // Draw 1 ledgers (no `stops`) and draw 2 ledgers (`stops`, no `draw`) keep their exact keys, hashes and clubs.
  const DRAW3_STATE_KEYS = [...STATE_KEYS.slice(0, -1), "candidates", "stops", "draw", "contentHash"];
  const DRAW3_CANDIDATES = 6;
  const DRAW3_SECTION_DEGREES = 60;
  const LEDGER_KEYS = Object.freeze(["schemaVersion", "objectType", "rivalryId", "revision", "phase", "coordinatorRole", "operationIds", "operationTypes", "baseRevisions", "actorRoles", "totalSeasons", "confirmedRoles", "activeSessionId", "updatedAt", "updatedByDeviceId"]);
  const DRAW_LEDGER_KEYS = Object.freeze([...LEDGER_KEYS, "stops"]);
  const DRAW3_LEDGER_KEYS = Object.freeze([...DRAW_LEDGER_KEYS, "draw"]);
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
  function validStop(value){ return Number.isInteger(value) && value >= 0 && value < 360; }
  // Stored ledgers can come from another realm (the browser SDK, a test sandbox), so ledger checks only ask for
  // a non-array object; protocol state and commands keep the strict plain-object checks.
  function record(value){ return !!value && typeof value === "object" && !Array.isArray(value); }
  function isDrawState(value){ return plain(value) && Object.hasOwn(value, "stops"); }
  // The draw a setup was opened with: 1 (no `stops`), 2 (`stops`) or 3 (`stops` and `draw: 3`).
  function drawOf(value){ return !record(value) || !Object.hasOwn(value, "stops") ? 1 : Object.hasOwn(value, "draw") ? value.draw : 2; }
  function candidatesFor(draw){ return draw === 3 ? DRAW3_CANDIDATES : DRAW_CANDIDATES; }
  // His club is the candidate on the section of his ball facing him at rest: three 120 degree sections on a
  // draw 2 ball, six 60 degree slices on a draw 3 ball.
  function clubForStop(candidates, stop){
    if(!Array.isArray(candidates) || (candidates.length !== DRAW_CANDIDATES && candidates.length !== DRAW3_CANDIDATES) || !validStop(stop)) ssjFail("SETUP_STOP_INVALID");
    return candidates[Math.floor(stop / (candidates.length === DRAW3_CANDIDATES ? DRAW3_SECTION_DEGREES : STOP_SECTION_DEGREES))];
  }
  // The ledger keys a stored setup document must have: the 15 of every Showdown before R94-02, or those plus
  // `stops` (one integer 0..359 per confirmed manager, in confirmedRoles order). Used by every reader that
  // checks the stored ledger, so old and new Showdowns are recognised in one place.
  // R95-01: a draw 3 ledger also carries `draw` (3).
  function ledgerKeys(value){ return record(value) && Object.hasOwn(value, "stops") ? (Object.hasOwn(value, "draw") ? DRAW3_LEDGER_KEYS : DRAW_LEDGER_KEYS) : LEDGER_KEYS; }
  function ledgerStopsValid(value){
    if(record(value) && Object.hasOwn(value, "draw") && (!Object.hasOwn(value, "stops") || value.draw !== 3)) return false;
    if(!record(value) || !Object.hasOwn(value, "stops")) return true;
    return Array.isArray(value.stops) && Array.isArray(value.confirmedRoles) && value.stops.length === value.confirmedRoles.length && value.stops.every(validStop);
  }
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
  // Draw 2 command shapes: open may carry draw:2 (or draw:3, R95-01), commit-clubs carries candidates instead of
  // clubs (three or six per manager), and confirm carries the manager's stop. Every older command shape is unchanged.
  function commandFields(value){
    if(value.type === "open" && Object.hasOwn(value, "draw")) return ["draw"];
    if(value.type === "commit-clubs" && Object.hasOwn(value, "candidates")) return ["candidates"];
    if(value.type === "confirm" && Object.hasOwn(value, "stop")) return ["setupHash", "stop"];
    return COMMAND_FIELDS[value.type];
  }
  function commandSnapshot(value){
    if(!plain(value) || !Object.hasOwn(COMMAND_FIELDS, value.type)) ssjFail("SETUP_COMMAND_INVALID");
    exact(value, ["type", "operationId", "baseRevision", ...commandFields(value)], "SETUP_COMMAND_INVALID");
    if(!validId(value.operationId, /^setup_op_[0-9a-f]{32}$/) || !Number.isSafeInteger(value.baseRevision) || value.baseRevision < 0) ssjFail("SETUP_COMMAND_INVALID");
    if(value.type === "commit-league" && !LEAGUES.includes(value.leagueId)) ssjFail("SETUP_LEAGUE_INVALID");
    if(value.type === "open" && Object.hasOwn(value, "draw") && value.draw !== 2 && value.draw !== 3) ssjFail("SETUP_COMMAND_INVALID");
    if(value.type === "commit-clubs" && Object.hasOwn(value, "candidates")){
      exact(value.candidates, ROLES, "SETUP_CLUBS_INVALID");
      const size = Array.isArray(value.candidates.playerOne) ? value.candidates.playerOne.length : -1;
      if((size !== DRAW_CANDIDATES && size !== DRAW3_CANDIDATES) || ROLES.some(role => !Array.isArray(value.candidates[role]) || value.candidates[role].length !== size || value.candidates[role].some(club => typeof club !== "string"))) ssjFail("SETUP_CLUBS_INVALID");
    }else if(value.type === "commit-clubs"){
      exact(value.clubs, ROLES, "SETUP_CLUBS_INVALID");
      if(ROLES.some(role => typeof value.clubs[role] !== "string")) ssjFail("SETUP_CLUBS_INVALID");
    }
    if(value.type === "commit-length" && !LENGTHS.includes(value.totalSeasons)) ssjFail("SETUP_LENGTH_INVALID");
    if(value.type === "confirm" && !validId(value.setupHash, HASH)) ssjFail("SETUP_CONFIRMATION_INVALID");
    if(value.type === "confirm" && Object.hasOwn(value, "stop") && !validStop(value.stop)) ssjFail("SETUP_STOP_INVALID");
    return freeze({...value, ...(value.clubs ? {clubs:{...value.clubs}} : {}), ...(value.candidates ? {candidates:{playerOne:[...value.candidates.playerOne], playerTwo:[...value.candidates.playerTwo]}} : {})});
  }
  function setupValue(state){
    const value = {schemaVersion:1, bindingHash:state.bindingHash, catalogHash:state.catalogHash, coordinatorRole:state.coordinatorRole, leagueId:state.leagueId, clubs:state.clubs, totalSeasons:state.totalSeasons};
    // Draw 2: a manager confirms the league, the length and the six candidates; his stop rides on the
    // confirm itself. Older setups keep the exact value (and hash) they always had.
    return isDrawState(state) ? {...value, drawVersion:drawOf(state), candidates:state.candidates} : value;
  }
  // R95-01 (Nik 2026-11-17, hard rule): the two balls never share a club. Both managers are dealt from ONE pool of the
  // drawn league's clubs, without replacement (each pick is spliced out), alternating playerOne, playerTwo, ... So every
  // draw holds count x 2 distinct clubs of that league BY CONSTRUCTION, whatever indices `pick` returns; a pick outside
  // the pool fails instead of reusing a club. Draw 2 deals exactly as in 2.7.0 (same picks, same order).
  async function dealCandidates(pool, count, pick){
    const available = [...pool];
    if(available.length < count * ROLES.length) ssjFail("SETUP_DRAW_NOT_AVAILABLE");
    const candidates = {playerOne:[], playerTwo:[]};
    for(let index = 0; index < count * ROLES.length; index++){
      const at = await pick(index, available.length);
      if(!Number.isSafeInteger(at) || at < 0 || at >= available.length) ssjFail("SETUP_DRAW_NOT_AVAILABLE");
      candidates[ROLES[index % ROLES.length]].push(available.splice(at, 1)[0]);
    }
    return candidates;
  }
  function validCandidates(candidates, leagueId, catalog, count){
    exact(candidates, ROLES, "SETUP_CLUBS_INVALID");
    const all = ROLES.flatMap(role => Array.isArray(candidates[role]) && candidates[role].length === count ? candidates[role] : ssjFail("SETUP_CLUBS_INVALID"));
    if(new Set(all).size !== all.length || !catalog[leagueId] || !all.every(club => catalog[leagueId].includes(club))) ssjFail("SETUP_CLUBS_INVALID");
  }
  function drawnClubs(state){
    const clubs = {};
    state.confirmedRoles.forEach((role, index) => { clubs[role] = clubForStop(state.candidates[role], state.stops[index]); });
    return clubs;
  }
  function validClubPair(clubs, leagueId, catalog){
    exact(clubs, ROLES, "SETUP_CLUBS_INVALID");
    if(clubs.playerOne === clubs.playerTwo || !catalog[leagueId] || !ROLES.every(role => catalog[leagueId].includes(clubs[role]))) ssjFail("SETUP_CLUBS_INVALID");
  }

  async function createProtocol({catalog, cryptoImpl = root.crypto} = {}){
    const clubsByLeague = catalogSnapshot(catalog);
    const catalogHash = await hash(clubsByLeague, cryptoImpl);
    async function verifyState(value){
      const draw = isDrawState(value), version = drawOf(value);
      exact(value, version === 3 ? DRAW3_STATE_KEYS : draw ? DRAW_STATE_KEYS : STATE_KEYS, "SETUP_STATE_INVALID");
      if(Object.hasOwn(value, "draw") && value.draw !== 3) ssjFail("SETUP_STATE_INVALID");
      // Copy before the first await so an async digest cannot validate one value
      // and later return a caller-mutated value.
      const state = JSON.parse(JSON.stringify(value));
      const {contentHash, ...core} = state;
      if(state.schemaVersion !== 1 || !validId(contentHash, HASH) || !validId(state.bindingHash, HASH) || state.catalogHash !== catalogHash || !ROLES.includes(state.coordinatorRole) || !PHASES.includes(state.phase)) ssjFail("SETUP_STATE_INVALID");
      if(!Number.isInteger(state.revision) || state.revision < 1 || state.revision > 6 || !Array.isArray(state.receipts) || state.receipts.length !== state.revision) ssjFail("SETUP_STATE_INVALID");
      if(!Array.isArray(state.confirmedRoles) || state.confirmedRoles.length > 2 || new Set(state.confirmedRoles).size !== state.confirmedRoles.length || state.confirmedRoles.some(role => !ROLES.includes(role))) ssjFail("SETUP_STATE_INVALID");
      const phaseIndex = PHASES.indexOf(state.phase);
      if(phaseIndex === 0 ? state.leagueId !== null : !LEAGUES.includes(state.leagueId)) ssjFail("SETUP_STATE_INVALID");
      if(draw){
        // Draw 2: candidates from commit-clubs on; clubs only once both managers have stopped.
        if(phaseIndex < 2){ if(state.candidates !== null) ssjFail("SETUP_STATE_INVALID"); }
        else validCandidates(state.candidates, state.leagueId, clubsByLeague, candidatesFor(version));
        if(!Array.isArray(state.stops) || state.stops.length !== state.confirmedRoles.length || !state.stops.every(validStop)) ssjFail("SETUP_STATE_INVALID");
        if(phaseIndex < 4){ if(state.clubs !== null) ssjFail("SETUP_STATE_INVALID"); }
        else{
          validClubPair(state.clubs, state.leagueId, clubsByLeague);
          const expected = drawnClubs(state);
          if(ROLES.some(role => state.clubs[role] !== expected[role])) ssjFail("SETUP_STATE_INVALID");
        }
      }else if(phaseIndex < 2){ if(state.clubs !== null) ssjFail("SETUP_STATE_INVALID"); }
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

    async function boundIndex(state, purpose, length){
      const bound = Math.floor(0x100000000 / length) * length;
      for(let counter = 0; counter < 128; counter++){
        // The seed is provider-bound state, not caller-selected operation data.
        // This makes every valid rivalry state map to one immutable draw outcome.
        const digest = await hash({domain:"shared-showdown-draw-v1", bindingHash:state.bindingHash, catalogHash:state.catalogHash, leagueId:state.leagueId, purpose, counter}, cryptoImpl);
        const value = Number.parseInt(digest.slice(7, 15), 16);
        if(value < bound) return value % length;
      }
      ssjFail("SETUP_RANDOMNESS_UNAVAILABLE");
    }
    async function boundDraw(state, type){
      if(type === "commit-league" && state.phase === "SHARED_SETUP_OPEN"){
        return {leagueId:LEAGUES[await boundIndex(state, "league", LEAGUES.length)]};
      }
      if(type === "commit-clubs" && state.phase === "LEAGUE_WHEEL_COMMITTED" && isDrawState(state)){
        // Six (draw 3: twelve) distinct candidates from the drawn league, dealt playerOne, playerTwo, playerOne, ...
        // Section k of a manager's ball carries his candidate k. Draw 3 continues the same purposes (candidate-6..11),
        // so its first six candidates are the ones a draw 2 setup of the same rivalry and league would get.
        const candidates = await dealCandidates(clubsByLeague[state.leagueId], candidatesFor(drawOf(state)), (index, length) => boundIndex(state, `candidate-${index}`, length));
        return {candidates};
      }
      if(type === "commit-clubs" && state.phase === "LEAGUE_WHEEL_COMMITTED"){
        const available = [...clubsByLeague[state.leagueId]];
        const playerOne = available.splice(await boundIndex(state, "club-player-one", available.length), 1)[0];
        const playerTwo = available[await boundIndex(state, "club-player-two", available.length)];
        return {clubs:{playerOne, playerTwo}};
      }
      ssjFail("SETUP_DRAW_NOT_AVAILABLE");
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
        const draw = request.type === "open" ? request.draw === 2 || request.draw === 3 : isDrawState(prior);
        const version = request.type === "open" ? (draw ? request.draw : 1) : drawOf(prior);
        // A command must use the shapes of the draw its setup was opened with.
        if(request.type === "commit-clubs" && Object.hasOwn(request, "candidates") !== draw) ssjFail("SETUP_DRAW_VERSION_MISMATCH");
        if(request.type === "confirm" && Object.hasOwn(request, "stop") !== draw) ssjFail("SETUP_DRAW_VERSION_MISMATCH");
        const next = prior ? JSON.parse(JSON.stringify(prior)) : {
          schemaVersion:1, bindingHash, catalogHash, coordinatorRole:context.role,
          phase:"SHARED_SETUP_OPEN", revision:0, leagueId:null, clubs:null,
          totalSeasons:null, confirmedRoles:[], receipts:[],
          ...(draw ? {candidates:null, stops:[]} : {}),
          ...(version === 3 ? {draw:3} : {})
        };
        if(request.type === "commit-league"){
          if(prior.phase !== "SHARED_SETUP_OPEN") ssjFail("SETUP_TRANSITION_INVALID");
          const expected = await boundDraw(prior, request.type);
          if(request.leagueId !== expected.leagueId) ssjFail("SETUP_DRAW_MISMATCH");
          next.leagueId = request.leagueId; next.phase = "LEAGUE_WHEEL_COMMITTED";
        }else if(request.type === "commit-clubs" && draw){
          if(prior.phase !== "LEAGUE_WHEEL_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
          validCandidates(request.candidates, prior.leagueId, clubsByLeague, candidatesFor(version));
          const expected = await boundDraw(prior, request.type);
          if(ROLES.some(role => expected.candidates[role].some((club, index) => request.candidates[role][index] !== club))) ssjFail("SETUP_DRAW_MISMATCH");
          next.candidates = {playerOne:[...request.candidates.playerOne], playerTwo:[...request.candidates.playerTwo]};
          next.phase = "CLUB_ASSIGNMENTS_COMMITTED";
        }else if(request.type === "commit-clubs"){
          if(prior.phase !== "LEAGUE_WHEEL_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
          validClubPair(request.clubs, prior.leagueId, clubsByLeague);
          const expected = await boundDraw(prior, request.type);
          if(ROLES.some(role => request.clubs[role] !== expected.clubs[role])) ssjFail("SETUP_DRAW_MISMATCH");
          next.clubs = {...request.clubs}; next.phase = "CLUB_ASSIGNMENTS_COMMITTED";
        }else if(request.type === "commit-length"){
          if(prior.phase !== "CLUB_ASSIGNMENTS_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
          next.totalSeasons = request.totalSeasons; next.phase = "SEASON_LENGTH_COMMITTED";
        }else if(request.type === "confirm"){
          if(prior.phase !== "SEASON_LENGTH_COMMITTED" || prior.confirmedRoles.includes(context.role)) ssjFail("SETUP_CONFIRMATION_NOT_AVAILABLE");
          if(request.setupHash !== await hash(setupValue(prior), cryptoImpl)) ssjFail("SETUP_CONFIRMATION_CHANGED");
          next.confirmedRoles.push(context.role);
          if(draw) next.stops.push(request.stop);
          if(next.confirmedRoles.length === 2){
            next.phase = "SHOWDOWN_CONFIRMED";
            if(draw) next.clubs = drawnClubs(next);
          }
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

    async function prepareDraw({state, type, operationId}){
      const prior = await verifyState(state);
      const payload = await boundDraw(prior, type);
      return commandSnapshot({type, operationId, baseRevision:prior.revision, ...payload});
    }
    async function confirmationHash(state){ return hash(setupValue(await verifyState(state)), cryptoImpl); }
    // The one place that turns stored ledger step `index` back into its protocol command. Every reader that
    // replays a stored setup (setup screen, Season Results, Season Commit, finished-Showdown History) uses it,
    // so old ledgers replay exactly as before and draw 2 ledgers carry their stops.
    async function ledgerCommand({state, ledger, index}){
      if(!record(ledger) || !Array.isArray(ledger.operationTypes) || !Number.isInteger(index) || index < 0 || index >= ledger.operationTypes.length || !ledgerStopsValid(ledger)) ssjFail("SETUP_STATE_INVALID");
      const type = ledger.operationTypes[index], operationId = ledger.operationIds[index], baseRevision = ledger.baseRevisions[index];
      const draw = Object.hasOwn(ledger, "stops");
      if(type === "open") return draw ? {type, operationId, baseRevision, draw:drawOf(ledger)} : {type, operationId, baseRevision};
      if(type === "commit-league" || type === "commit-clubs") return prepareDraw({state, type, operationId});
      if(type === "commit-length") return {type, operationId, baseRevision, totalSeasons:ledger.totalSeasons};
      if(type === "confirm"){
        const command = {type, operationId, baseRevision, setupHash:await confirmationHash(state)};
        if(draw) command.stop = ledger.stops[index - 4];
        return command;
      }
      ssjFail("SETUP_STATE_INVALID");
    }
    return freeze({apply, verifyState, prepareDraw, confirmationHash, ledgerCommand, catalogHash});
  }
  return freeze({contractVersion:1, implementationState:"candidate-provider-neutral", productionEnabled:false, canonicalStorageMutation:false, billingRequired:false, roles:ROLES, leagueIds:LEAGUES, allowedSeasonLengths:LENGTHS, phases:PHASES, drawCandidates:DRAW_CANDIDATES, stopSectionDegrees:STOP_SECTION_DEGREES, draw3Candidates:DRAW3_CANDIDATES, draw3SectionDegrees:DRAW3_SECTION_DEGREES, drawOf, dealCandidates, ledgerKeys, ledgerStopsValid, clubForStop, createProtocol});
});
