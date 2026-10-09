(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkCompletedTransferHistoryReader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-10: session-free, read-only transfer history of one Showdown closed by a verified Terminal Close.
  // Exact document gets only (rivalry, setup ledger, transferChallenges/season_1..season_N and both roles);
  // no session, no device, no transaction, no list, no write, no browser storage. Separate availability:
  // a failure here never touches points, seasons or trophies (readCompletedShowdown is independent).
  const cthTerminal=()=>typeof require==="function"?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const MANAGER_KEY=Object.freeze({playerOne:"daniel",playerTwo:"nik"});
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const TRANSFER_RUNTIME="1.9.1-r8";
  const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
  const PROGRESS_KEYS=Object.freeze(["schemaVersion","runtimeRevision","totalSeasons","acceptedThroughSeason","managerTotals","closedSessionRevision"]);
  const PUBLIC_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision","startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles","operationIds","operationTypes","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const PRIVATE_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings","guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"]);
  // JOB-1051: r66 role documents have exactly PRIVATE_KEYS; salted ones add both salt keys (each null or 64 lowercase hex). Nothing else is read.
  const SALT_KEYS=Object.freeze(["guessSalt","signingSalt"]);
  const SALT=/^[0-9a-f]{64}$/;
  const STATUSES=Object.freeze(["completed","abandoned","not-closed","unavailable"]);

  function cthFail(code){const error=new Error(code);error.code=code;throw error;}
  function cthFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(cthFreeze);Object.freeze(value);}return value;}
  function cthPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function cthExact(value,keys,code){if(!cthPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))cthFail(code);return value;}
  function cthClone(value){return JSON.parse(JSON.stringify(value));}
  // Same canonical form as the transfer provider's operation hash (sorted keys, plain objects only).
  function cthSortedCanonical(value){if(Array.isArray(value))return `[${value.map(cthSortedCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${cthSortedCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  // Same canonical form as the rivalry envelope content hash.
  function cthEnvelopeCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(cthEnvelopeCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=cthEnvelopeCanonical(value[key]);return out;}return value;}
  async function cthDigest(text,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")cthFail("TRANSFER_HISTORY_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function cthSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function cthIsTimestamp(value){return Boolean(value)&&typeof value.toMillis==="function"&&Number.isFinite(value.toMillis());}
  function cthCatalog(){
    const leagues=Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES.map(item=>item&&item.id).filter(Boolean):[];
    const nations=Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES.map(item=>item&&item.id).filter(Boolean):[];
    if(leagues.length!==36||nations.length!==164)cthFail("TRANSFER_HISTORY_CATALOG_UNAVAILABLE");
    return {leagueIds:new Set(leagues),nationalityIds:new Set(nations)};
  }

  function cthState(status,fields={}){
    return cthFreeze({status,code:fields.code||null,rivalryId:fields.rivalryId||null,managerRole:fields.managerRole||null,transfers:fields.transfers||null});
  }
  async function cthGet(sdk,db,parts){
    try{return cthSnapshot(await sdk.getDoc(sdk.doc(db,...parts)));}
    catch(error){cthFail(error&&typeof error.code==="string"&&error.code?error.code:"TRANSFER_HISTORY_READ_FAILED");}
  }

  async function cthVerifyRivalry(value,rivalryId,uid,cryptoImpl){
    if(!value||value.schemaVersion!==1||value.objectType!=="rivalry"||value.objectId!==rivalryId||!Number.isInteger(value.revision)||value.revision<0||value.lifecycleState!=="live"||!HASH.test(String(value.contentHash||""))||!cthPlain(value.data)||value.tombstone!==null)cthFail("TRANSFER_HISTORY_RIVALRY_INVALID");
    const expected=await cthDigest(JSON.stringify(cthEnvelopeCanonical({objectType:"rivalry",objectId:rivalryId,revision:value.revision,data:value.data})),cryptoImpl);
    if(expected!==value.contentHash)cthFail("TRANSFER_HISTORY_RIVALRY_INTEGRITY_FAILED");
    const slots=value.data.managerSlots,authorized=value.data.authorizedAccountIds;
    if(!Array.isArray(authorized)||authorized.length!==2||new Set(authorized).size!==2||!authorized.includes(uid)||!Array.isArray(slots)||slots.length!==2)cthFail("TRANSFER_HISTORY_NOT_A_MANAGER");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string"||!authorized.includes(slot.accountId))||ordered[0].accountId===ordered[1].accountId)cthFail("TRANSFER_HISTORY_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)cthFail("TRANSFER_HISTORY_NOT_A_MANAGER");
    return actor.slotId;
  }
  function cthVerifyWitness(data,rivalryId){
    let intent;
    try{intent=cthTerminal().verifyIntent(data.terminalClose);}catch(_error){cthFail("TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");}
    const progress=data.terminalProgress;
    if(!cthPlain(progress)||Object.keys(progress).length!==PROGRESS_KEYS.length||PROGRESS_KEYS.some(key=>!Object.hasOwn(progress,key)))cthFail("TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");
    if(intent.rivalryId!==rivalryId||progress.schemaVersion!==1||progress.runtimeRevision!=="1.9.1-r18"||progress.totalSeasons!==intent.totalSeasons||progress.acceptedThroughSeason!==progress.totalSeasons||!Number.isInteger(progress.closedSessionRevision)||progress.closedSessionRevision<1||!cthPlain(progress.managerTotals)||progress.managerTotals.playerOne!==intent.managerTotals.playerOne||progress.managerTotals.playerTwo!==intent.managerTotals.playerTwo)cthFail("TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");
    return intent.totalSeasons;
  }
  function cthAssertLedger(value,rivalryId,totalSeasons){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||value.totalSeasons!==totalSeasons)cthFail("TRANSFER_HISTORY_SETUP_INVALID");
    return value.coordinatorRole;
  }
  function cthRoleList(value){if(!Array.isArray(value)||value.length!==2||new Set(value).size!==2||!ROLES.every(role=>value.includes(role)))cthFail("TRANSFER_HISTORY_SEASON_INVALID");return value;}
  function cthAssertPublic(value,rivalryId,seasonNumber,coordinatorRole){
    cthExact(value,PUBLIC_KEYS,"TRANSFER_HISTORY_SEASON_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==TRANSFER_RUNTIME||value.coordinatorRole!==coordinatorRole||value.phase!=="COMPLETED"||(value.revision!==6&&value.revision!==7)||!cthIsTimestamp(value.startedAt)||!cthIsTimestamp(value.endedAt))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    cthRoleList(value.guessLockedRoles);cthRoleList(value.signingLockedRoles);
    if(!Array.isArray(value.endRequestedRoles)||value.endRequestedRoles.length>2||value.endRequestedRoles.some(role=>!ROLES.includes(role)))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)cthFail("TRANSFER_HISTORY_SEASON_INVALID");}
    if(new Set(value.operationIds).size!==value.revision||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    if(value.operationTypes[0]!=="start-window"||value.actorRoles[0]!==coordinatorRole||value.operationTypes.slice(1).includes("start-window"))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    const locks={};
    for(const type of ["lock-guesses","lock-signings"]){
      for(const role of ROLES){
        const at=value.operationTypes.map((t,index)=>t===type&&value.actorRoles[index]===role?index:-1).filter(index=>index>=0);
        if(at.length!==1)cthFail("TRANSFER_HISTORY_SEASON_INVALID");
        locks[`${type}:${role}`]=at[0];
      }
    }
    if(value.operationTypes[value.revision-1]!=="lock-signings")cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    return locks;
  }
  function cthGuesses(value,catalog){
    if(!Array.isArray(value)||value.length>3)cthFail("TRANSFER_HISTORY_SEASON_INVALID");const slots=new Set();
    return value.map(item=>{cthExact(item,["slot","type","valueId"],"TRANSFER_HISTORY_SEASON_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot)||(item.type!=="league"&&item.type!=="nationality")||!(item.type==="league"?catalog.leagueIds:catalog.nationalityIds).has(item.valueId))cthFail("TRANSFER_HISTORY_SEASON_INVALID");slots.add(item.slot);return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
  }
  function cthSignings(value,catalog){
    if(!Array.isArray(value)||value.length>3)cthFail("TRANSFER_HISTORY_SEASON_INVALID");const slots=new Set();
    return value.map(item=>{cthExact(item,["slot","name","leagueId","nationalityId"],"TRANSFER_HISTORY_SEASON_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot)||typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))cthFail("TRANSFER_HISTORY_SEASON_INVALID");slots.add(item.slot);return {slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};}).sort((a,b)=>a.slot-b.slot);
  }
  function cthAssertRole(value,rivalryId,seasonNumber,role,catalog){
    const salted=cthPlain(value)&&Object.hasOwn(value,SALT_KEYS[0]);
    cthExact(value,salted?[...PRIVATE_KEYS,...SALT_KEYS]:PRIVATE_KEYS,"TRANSFER_HISTORY_SEASON_INVALID");
    if(salted&&SALT_KEYS.some(key=>value[key]!==null&&(typeof value[key]!=="string"||!SALT.test(value[key]))))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||value.signings===null||!cthIsTimestamp(value.guessLockedAt)||!cthIsTimestamp(value.signingLockedAt))cthFail("TRANSFER_HISTORY_SEASON_INVALID");
    return {guesses:cthGuesses(value.guesses,catalog),signings:cthSignings(value.signings,catalog),guessSalt:salted?value.guessSalt:null,signingSalt:salted?value.signingSalt:null};
  }
  // Provenance: each role's stored guesses and signings must hash to the operation that locked them on the public ledger.
  async function cthAssertProvenance(publicValue,locks,role,inputs,cryptoImpl){
    for(const [type,payload,salt] of [["lock-guesses",{guesses:inputs.guesses},inputs.guessSalt],["lock-signings",{signings:inputs.signings},inputs.signingSalt]]){
      const index=locks[`${type}:${role}`];
      // A role document with a salt proves its lock with the salted commitment; one without (written by r66) with the old unsalted payload hash.
      const hash=await cthDigest(cthSortedCanonical({actorRole:role,type,operationId:publicValue.operationIds[index],baseRevision:publicValue.baseRevisions[index],...payload,...(salt?{salt}:{})}),cryptoImpl);
      if(hash!==publicValue.operationHashes[index])cthFail("TRANSFER_HISTORY_PROVENANCE_MISMATCH");
    }
  }
  // Same verdict as the transfer protocol: a signing is released when the rival guessed its league or nationality.
  function cthVerdict(own,rival){
    const signings=own.signings.map(signing=>{const matchedBy=rival.guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
    const released=signings.filter(signing=>signing.release).length;
    return {guesses:cthClone(own.guesses),signings,released,kept:signings.length-released};
  }

  async function cthRead(options={}){
    let rivalryId=null,managerRole=null;
    try{
      const sdk=options.firebaseSdk,db=options.firestore,cryptoImpl=options.cryptoImpl||root.crypto;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")cthFail("TRANSFER_HISTORY_PROVIDER_UNAVAILABLE");
      const uid=options.user&&typeof options.user.uid==="string"?options.user.uid.trim():"";if(!uid)cthFail("TRANSFER_HISTORY_AUTH_REQUIRED");
      rivalryId=String(options.rivalryId||"").trim().toLowerCase();if(!RIVALRY_ID.test(rivalryId)){rivalryId=null;cthFail("TRANSFER_HISTORY_RIVALRY_INVALID");}
      const value=await cthGet(sdk,db,["rivalries",rivalryId]);if(!value)cthFail("TRANSFER_HISTORY_RIVALRY_MISSING");
      managerRole=await cthVerifyRivalry(value,rivalryId,uid,cryptoImpl);
      const state=value.data.connectionState;
      // Live transfers stay with the session-bound provider (its own COMPLETED rule); nothing below the root is read here.
      if(state==="pending-pair"||state==="active")return cthState("not-closed",{rivalryId,managerRole});
      if(state!=="closed")cthFail("TRANSFER_HISTORY_RIVALRY_INVALID");
      // Abandoned (closed without a Terminal Close witness): no transfer history at all, nothing else is read.
      if(!Object.hasOwn(value.data,"terminalClose"))return cthState("abandoned",{rivalryId,managerRole});
      const total=cthVerifyWitness(value.data,rivalryId);
      const catalog=cthCatalog();
      const coordinatorRole=cthAssertLedger(await cthGet(sdk,db,["rivalries",rivalryId,"sharedSetup","authoritative"]),rivalryId,total);
      const seasons=[];
      for(let seasonNumber=1;seasonNumber<=total;seasonNumber+=1){
        const transferId=`season_${seasonNumber}`;
        const publicValue=await cthGet(sdk,db,["rivalries",rivalryId,"transferChallenges",transferId]);
        const p1=await cthGet(sdk,db,["rivalries",rivalryId,"transferChallenges",transferId,"roles","playerOne"]);
        const p2=await cthGet(sdk,db,["rivalries",rivalryId,"transferChallenges",transferId,"roles","playerTwo"]);
        // A gap is never a shorter history: any missing season makes the whole transfer history unavailable.
        if(!publicValue||!p1||!p2)cthFail("TRANSFER_HISTORY_SEASON_MISSING");
        const locks=cthAssertPublic(publicValue,rivalryId,seasonNumber,coordinatorRole);
        const inputs={playerOne:cthAssertRole(p1,rivalryId,seasonNumber,"playerOne",catalog),playerTwo:cthAssertRole(p2,rivalryId,seasonNumber,"playerTwo",catalog)};
        for(const role of ROLES)await cthAssertProvenance(publicValue,locks,role,inputs[role],cryptoImpl);
        seasons.push({season:seasonNumber,[MANAGER_KEY.playerOne]:cthVerdict(inputs.playerOne,inputs.playerTwo),[MANAGER_KEY.playerTwo]:cthVerdict(inputs.playerTwo,inputs.playerOne)});
      }
      return cthState("completed",{rivalryId,managerRole,transfers:{status:"ready",seasons}});
    }catch(error){
      // Unavailable is never drawn as empty or as 0 signings: seasons stay null.
      return cthState("unavailable",{rivalryId,managerRole,code:error&&typeof error.code==="string"&&error.code?error.code:"TRANSFER_HISTORY_READ_FAILED",transfers:{status:"unavailable",seasons:null}});
    }
  }

  return Object.freeze({contractVersion:1,feature:"cms-completed-transfer-history-reader",statuses:STATUSES,readCompletedTransferHistory:cthRead,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false,sourceAuthorityPaths:Object.freeze(["rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/transferChallenges/season_{N}","rivalries/{rivalryId}/transferChallenges/season_{N}/roles/{playerOne|playerTwo}"])});
});
