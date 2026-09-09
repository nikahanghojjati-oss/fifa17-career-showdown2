(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r8";
  const WINDOW_MS=15*60*1000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const STATE_KEYS=Object.freeze([
    "schemaVersion","runtimeRevision","seasonNumber","coordinatorRole","phase","revision",
    "startedAtEpochMs","endedAtEpochMs","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "inputs","receipts","contentHash"
  ]);

  function stcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stcPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function stcExact(value,keys,code="TRANSFER_VALUE_INVALID"){
    if(!stcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stcFail(code);
  }
  function stcClone(value){return JSON.parse(JSON.stringify(value));}
  function stcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stcFreeze);Object.freeze(value);}return value;}
  function stcCanonical(value){
    if(Array.isArray(value))return `[${value.map(stcCanonical).join(",")}]`;
    if(stcPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stcCanonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  async function stcHash(value,cryptoImpl){
    if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stcFail("TRANSFER_CRYPTO_UNAVAILABLE");
    const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stcCanonical(value)));
    return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }
  function stcRole(value){if(!ROLES.includes(value))stcFail("TRANSFER_ROLE_INVALID");return value;}
  function stcEpoch(value){if(!Number.isSafeInteger(value)||value<0)stcFail("TRANSFER_CLOCK_INVALID");return value;}
  function stcRoleList(value,code){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stcFail(code);return value;}
  function stcCatalogIds(values,code){
    if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length||values.some(value=>typeof value!=="string"||!value||value!==value.trim()))stcFail(code);
    return new Set(values);
  }
  function stcConfirmedSetup(value){
    if(!stcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6)stcFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stcFail("TRANSFER_SETUP_INVALID");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stcFail("TRANSFER_SETUP_INVALID");
    if(!value.clubs||typeof value.clubs.playerOne!=="string"||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerOne||!value.clubs.playerTwo||value.clubs.playerOne===value.clubs.playerTwo)stcFail("TRANSFER_SETUP_INVALID");
    return value;
  }
  function stcCareerReady(value){
    if(!stcPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2)stcFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stcFail("TRANSFER_CAREER_START_NOT_READY");
    return value;
  }
  function stcNormalizeGuesses(value,leagueIds,nationalityIds){
    if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_GUESSES_INVALID");
    const seen=new Set();
    return value.map(item=>{
      stcExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");
      if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_GUESSES_INVALID");
      seen.add(item.slot);
      if(item.type!=="league"&&item.type!=="nationality")stcFail("TRANSFER_GUESSES_INVALID");
      const catalog=item.type==="league"?leagueIds:nationalityIds;
      if(!catalog.has(item.valueId))stcFail("TRANSFER_GUESSES_INVALID");
      return {slot:item.slot,type:item.type,valueId:item.valueId};
    }).sort((a,b)=>a.slot-b.slot);
  }
  function stcNormalizeSignings(value,leagueIds,nationalityIds){
    if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_SIGNINGS_INVALID");
    const seen=new Set();
    return value.map(item=>{
      stcExact(item,["slot","name","leagueId","nationalityId"],"TRANSFER_SIGNINGS_INVALID");
      if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_SIGNINGS_INVALID");
      seen.add(item.slot);
      const name=String(item.name||"").trim();
      if(!name||name.length>80||name!==item.name)stcFail("TRANSFER_SIGNINGS_INVALID");
      if(!leagueIds.has(item.leagueId)||!nationalityIds.has(item.nationalityId))stcFail("TRANSFER_SIGNINGS_INVALID");
      return {slot:item.slot,name,leagueId:item.leagueId,nationalityId:item.nationalityId};
    }).sort((a,b)=>a.slot-b.slot);
  }
  function stcInputs(value){
    stcExact(value,ROLES,"TRANSFER_STATE_INVALID");
    for(const role of ROLES){
      stcExact(value[role],["guesses","signings"],"TRANSFER_STATE_INVALID");
      if(value[role].guesses!==null&&!Array.isArray(value[role].guesses))stcFail("TRANSFER_STATE_INVALID");
      if(value[role].signings!==null&&!Array.isArray(value[role].signings))stcFail("TRANSFER_STATE_INVALID");
    }
    return value;
  }
  function stcReceipt(value){
    stcExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"TRANSFER_STATE_INVALID");
    if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||typeof value.type!=="string"||!HASH.test(value.commandHash))stcFail("TRANSFER_STATE_INVALID");
    return value;
  }
  async function stcVerifyState(value,leagueIds,nationalityIds,cryptoImpl){
    stcExact(value,STATE_KEYS,"TRANSFER_STATE_INVALID");
    const state=stcClone(value),hash=state.contentHash;delete state.contentHash;
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!ROLES.includes(value.coordinatorRole)||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||!HASH.test(hash))stcFail("TRANSFER_STATE_INVALID");
    stcEpoch(value.startedAtEpochMs);
    if(value.endedAtEpochMs!==null)stcEpoch(value.endedAtEpochMs);
    stcRoleList(value.endRequestedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.guessLockedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.signingLockedRoles,"TRANSFER_STATE_INVALID");
    stcInputs(value.inputs);
    if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)stcFail("TRANSFER_STATE_INVALID");
    value.receipts.forEach(stcReceipt);
    if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length)stcFail("TRANSFER_STATE_INVALID");
    if(value.receipts.some((receipt,index)=>receipt.baseRevision!==index))stcFail("TRANSFER_STATE_INVALID");
    for(const role of ROLES){
      const roleInput=value.inputs[role];
      if(roleInput.guesses!==null)stcNormalizeGuesses(roleInput.guesses,leagueIds,nationalityIds);
      if(roleInput.signings!==null)stcNormalizeSignings(roleInput.signings,leagueIds,nationalityIds);
      if(value.guessLockedRoles.includes(role)!==(roleInput.guesses!==null))stcFail("TRANSFER_STATE_INVALID");
      if(value.signingLockedRoles.includes(role)!==(roleInput.signings!==null))stcFail("TRANSFER_STATE_INVALID");
    }
    if(value.phase==="WINDOW_OPEN"&&(value.guessLockedRoles.length||value.signingLockedRoles.length||value.endedAtEpochMs!==null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.signingLockedRoles.length||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(await stcHash(state,cryptoImpl)!==hash)stcFail("TRANSFER_STATE_HASH_MISMATCH");
    return stcFreeze(stcClone(value));
  }
  function stcCommand(value,leagueIds,nationalityIds){
    if(!stcPlain(value)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||typeof value.type!=="string")stcFail("TRANSFER_COMMAND_INVALID");
    const common=["type","operationId","baseRevision"];
    if(value.type==="start-window"||value.type==="request-end-window"||value.type==="advance-expired-window")stcExact(value,common,"TRANSFER_COMMAND_INVALID");
    else if(value.type==="lock-guesses"){stcExact(value,[...common,"guesses"],"TRANSFER_COMMAND_INVALID");return {...value,guesses:stcNormalizeGuesses(value.guesses,leagueIds,nationalityIds)};}
    else if(value.type==="lock-signings"){stcExact(value,[...common,"signings"],"TRANSFER_COMMAND_INVALID");return {...value,signings:stcNormalizeSignings(value.signings,leagueIds,nationalityIds)};}
    else stcFail("TRANSFER_COMMAND_INVALID");
    return {...value};
  }
  function stcEvaluateRole(role,state){
    stcRole(role);
    if(state.phase!=="COMPLETED")stcFail("TRANSFER_VERDICT_NOT_READY");
    const opponent=role==="playerOne"?"playerTwo":"playerOne";
    const guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{
      const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));
      return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};
    });
  }

  async function stcCreateProtocol({leagueIds,nationalityIds,cryptoImpl=root.crypto}={}){
    const leagues=stcCatalogIds(leagueIds,"TRANSFER_LEAGUE_CATALOG_INVALID"),nationalities=stcCatalogIds(nationalityIds,"TRANSFER_NATIONALITY_CATALOG_INVALID");
    async function stcSeal(core){return stcFreeze({...stcClone(core),contentHash:await stcHash(core,cryptoImpl)});}
    async function stcVerifyProtocolState(value){return stcVerifyState(value,leagues,nationalities,cryptoImpl);}
    async function stcApply({state=null,setup,careerStart,seasonNumber,actorRole,command,nowEpochMs}){
      const confirmed=stcConfirmedSetup(setup);stcCareerReady(careerStart);const role=stcRole(actorRole),now=stcEpoch(nowEpochMs),cmd=stcCommand(command,leagues,nationalities);
      if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>confirmed.totalSeasons)stcFail("TRANSFER_SEASON_INVALID");
      const current=state?await stcVerifyProtocolState(state):null;
      if(current&&current.seasonNumber!==seasonNumber)stcFail("TRANSFER_SEASON_MISMATCH");
      if(current&&current.coordinatorRole!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_MISMATCH");
      const commandHash=await stcHash({actorRole:role,...cmd},cryptoImpl);
      if(current){
        const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);
        if(prior){
          if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)stcFail("TRANSFER_IDEMPOTENCY_CONFLICT");
          return stcFreeze({ok:true,idempotent:true,state:current});
        }
      }
      const revision=current?current.revision:0;
      if(cmd.baseRevision!==revision)stcFail("TRANSFER_STALE_BASE_REVISION");
      if(!current&&cmd.type!=="start-window")stcFail("TRANSFER_NOT_STARTED");
      if(current&&cmd.type==="start-window")stcFail("TRANSFER_ALREADY_STARTED");
      if(current&&current.phase==="COMPLETED")stcFail("TRANSFER_ALREADY_COMPLETED");
      let core=current?stcClone(current):{
        schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,coordinatorRole:confirmed.coordinatorRole,
        phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],
        inputs:{playerOne:{guesses:null,signings:null},playerTwo:{guesses:null,signings:null}},receipts:[]
      };
      delete core.contentHash;
      if(cmd.type==="start-window"){
        if(role!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_REQUIRED");
        core.startedAtEpochMs=now;
      }else if(cmd.type==="request-end-window"){
        if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
        if(core.endRequestedRoles.includes(role))stcFail("TRANSFER_END_ALREADY_REQUESTED");
        core.endRequestedRoles.push(role);
        if(core.endRequestedRoles.length===2){core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;}
      }else if(cmd.type==="advance-expired-window"){
        if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
        if(now<core.startedAtEpochMs+WINDOW_MS)stcFail("TRANSFER_WINDOW_STILL_OPEN");
        core.phase="GUESS_ENTRY";core.endedAtEpochMs=core.startedAtEpochMs+WINDOW_MS;
      }else if(cmd.type==="lock-guesses"){
        if(core.phase!=="GUESS_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
        if(core.guessLockedRoles.includes(role))stcFail("TRANSFER_GUESSES_ALREADY_LOCKED");
        core.inputs[role].guesses=cmd.guesses;core.guessLockedRoles.push(role);
        if(core.guessLockedRoles.length===2)core.phase="SIGNING_ENTRY";
      }else if(cmd.type==="lock-signings"){
        if(core.phase!=="SIGNING_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
        if(core.signingLockedRoles.includes(role))stcFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");
        core.inputs[role].signings=cmd.signings;core.signingLockedRoles.push(role);
        if(core.signingLockedRoles.length===2)core.phase="COMPLETED";
      }
      core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});
      core.revision=revision+1;
      const next=await stcSeal(core);await stcVerifyProtocolState(next);
      return stcFreeze({ok:true,idempotent:false,state:next});
    }
    function stcProjectForRole(state,role){
      stcRole(role);const current=stcClone(state),opponent=role==="playerOne"?"playerTwo":"playerOne";
      if(current.phase!=="COMPLETED")current.inputs[opponent]={guesses:null,signings:null};
      const projection={
        schemaVersion:current.schemaVersion,runtimeRevision:current.runtimeRevision,seasonNumber:current.seasonNumber,coordinatorRole:current.coordinatorRole,
        phase:current.phase,revision:current.revision,startedAtEpochMs:current.startedAtEpochMs,endedAtEpochMs:current.endedAtEpochMs,
        endRequestedRoles:[...current.endRequestedRoles],guessLockedRoles:[...current.guessLockedRoles],signingLockedRoles:[...current.signingLockedRoles],
        managerRole:role,inputs:current.inputs,verdicts:current.phase==="COMPLETED"?{playerOne:stcEvaluateRole("playerOne",current),playerTwo:stcEvaluateRole("playerTwo",current)}:null
      };
      return stcFreeze(projection);
    }
    return stcFreeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,apply:stcApply,verifyState:stcVerifyProtocolState,projectForRole:stcProjectForRole,evaluateRole:(role,state)=>stcFreeze(stcEvaluateRole(role,state)),billingRequired:false,canonicalStorageMutation:false});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge-protocol-factory",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,createProtocol:stcCreateProtocol,billingRequired:false,canonicalStorageMutation:false});
});
