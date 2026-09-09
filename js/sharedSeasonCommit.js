(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r10";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["COMMITTED","ACKNOWLEDGED"]);
  const OPERATION=/^season_commit_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","resultsRevision","resultsContentHash","results","acknowledgedRoles","receipts","contentHash"]);

  function sscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function sscPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function sscExact(value,keys,code="SEASON_COMMIT_VALUE_INVALID"){if(!sscPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))sscFail(code);return value;}
  function sscClone(value){return JSON.parse(JSON.stringify(value));}
  function sscFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sscFreeze);Object.freeze(value);}return value;}
  function sscCanonical(value){if(Array.isArray(value))return `[${value.map(sscCanonical).join(",")}]`;if(sscPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${sscCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function sscHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")sscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(sscCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function sscRole(value){if(!ROLES.includes(value))sscFail("SEASON_COMMIT_ROLE_INVALID");return value;}
  function sscTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)sscFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return value;}
  function sscSetup(value){if(!sscPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return value;}
  function sscResult(value,teamCount){sscExact(value,RESULT_KEYS,"SEASON_COMMIT_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals);if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>114||!Number.isInteger(goals)||goals<0||goals>300)sscFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")sscFail("SEASON_COMMIT_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist};}
  function sscReceipt(value){sscExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_COMMIT_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||!["commit-season","acknowledge-season"].includes(value.type)||!HASH.test(value.commandHash))sscFail("SEASON_COMMIT_STATE_INVALID");return value;}
  function sscCommand(value){if(!sscPlain(value))sscFail("SEASON_COMMIT_COMMAND_INVALID");sscExact(value,["type","operationId","baseRevision"],"SEASON_COMMIT_COMMAND_INVALID");if(!["commit-season","acknowledge-season"].includes(value.type)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||value.baseRevision>3)sscFail("SEASON_COMMIT_COMMAND_INVALID");return {type:value.type,operationId:value.operationId,baseRevision:value.baseRevision};}

  async function sscCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonResultsModule=(typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults)}={}){
    const teams=sscTeamCount(teamCount);
    if(!seasonResultsModule||typeof seasonResultsModule.createProtocol!=="function")sscFail("SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE");
    const resultsProtocol=await seasonResultsModule.createProtocol({teamCount:teams,cryptoImpl});
    async function seal(core){return sscFreeze({...sscClone(core),contentHash:await sscHash(core,cryptoImpl)});}
    async function readyResults(value,seasonNumber,totalSeasons){
      if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>totalSeasons)sscFail("SEASON_COMMIT_SEASON_INVALID");
      let ready;try{ready=await resultsProtocol.verifyState(value);}catch(_error){sscFail("SEASON_COMMIT_RESULTS_NOT_READY");}
      if(ready.phase!=="RESULTS_READY"||ready.revision!==2||ready.seasonNumber!==seasonNumber||!ready.results||!ready.results.playerOne||!ready.results.playerTwo)sscFail("SEASON_COMMIT_RESULTS_NOT_READY");
      return ready;
    }
    async function sscVerifyState(value){
      sscExact(value,STATE_KEYS,"SEASON_COMMIT_STATE_INVALID");const core=sscClone(value),hash=core.contentHash;delete core.contentHash;
      if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>3||value.resultsRevision!==2||!HASH.test(value.resultsContentHash)||!HASH.test(hash))sscFail("SEASON_COMMIT_STATE_INVALID");
      sscExact(value.results,ROLES,"SEASON_COMMIT_STATE_INVALID");for(const role of ROLES)sscResult(value.results[role],teams);
      if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==value.revision-1||value.acknowledgedRoles.length>2||new Set(value.acknowledgedRoles).size!==value.acknowledgedRoles.length||value.acknowledgedRoles.some(role=>!ROLES.includes(role)))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)sscFail("SEASON_COMMIT_STATE_INVALID");value.receipts.forEach(sscReceipt);
      if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length||value.receipts.some((receipt,index)=>receipt.baseRevision!==index))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(value.receipts[0].type!=="commit-season"||value.receipts.slice(1).some(receipt=>receipt.type!=="acknowledge-season"))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(JSON.stringify(value.acknowledgedRoles)!==JSON.stringify(value.receipts.slice(1).map(receipt=>receipt.actorRole)))sscFail("SEASON_COMMIT_STATE_INVALID");
      if((value.phase==="COMMITTED"&&value.revision===3)||(value.phase==="ACKNOWLEDGED"&&value.revision!==3))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(await sscHash(core,cryptoImpl)!==hash)sscFail("SEASON_COMMIT_STATE_HASH_MISMATCH");
      return sscFreeze(sscClone(value));
    }
    async function sscApply({state=null,setup,seasonResults,seasonNumber,actorRole,command}){
      const confirmed=sscSetup(setup),role=sscRole(actorRole),ready=await readyResults(seasonResults,seasonNumber,confirmed.totalSeasons),cmd=sscCommand(command),current=state?await sscVerifyState(state):null;
      if(current&&current.seasonNumber!==seasonNumber)sscFail("SEASON_COMMIT_SEASON_MISMATCH");
      if(current&&(current.resultsContentHash!==ready.contentHash||current.resultsRevision!==ready.revision))sscFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
      const commandHash=await sscHash({actorRole:role,...cmd},cryptoImpl);
      if(current){const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);if(prior){if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)sscFail("SEASON_COMMIT_IDEMPOTENCY_CONFLICT");return sscFreeze({ok:true,idempotent:true,state:current});}}
      const revision=current?current.revision:0;if(cmd.baseRevision!==revision)sscFail("SEASON_COMMIT_STALE_BASE_REVISION");
      if(cmd.type==="commit-season"){
        if(current)sscFail("SEASON_COMMIT_ALREADY_COMMITTED");
        if(role!==confirmed.coordinatorRole)sscFail("SEASON_COMMIT_COORDINATOR_REQUIRED");
        const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,phase:"COMMITTED",revision:1,resultsRevision:ready.revision,resultsContentHash:ready.contentHash,results:{playerOne:sscResult(ready.results.playerOne,teams),playerTwo:sscResult(ready.results.playerTwo,teams)},acknowledgedRoles:[],receipts:[{operationId:cmd.operationId,baseRevision:0,actorRole:role,type:cmd.type,commandHash}]};
        const next=await seal(core);await sscVerifyState(next);return sscFreeze({ok:true,idempotent:false,state:next});
      }
      if(!current)sscFail("SEASON_COMMIT_NOT_COMMITTED");
      if(current.phase==="ACKNOWLEDGED")sscFail("SEASON_COMMIT_ALREADY_ACKNOWLEDGED");
      if(current.acknowledgedRoles.includes(role))sscFail("SEASON_COMMIT_ROLE_ALREADY_ACKNOWLEDGED");
      const core=sscClone(current);delete core.contentHash;core.acknowledgedRoles.push(role);core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});core.revision=revision+1;if(core.acknowledgedRoles.length===2)core.phase="ACKNOWLEDGED";
      const next=await seal(core);await sscVerifyState(next);return sscFreeze({ok:true,idempotent:false,state:next});
    }
    function projectForRole(state,role){sscRole(role);return sscFreeze({schemaVersion:state.schemaVersion,runtimeRevision:state.runtimeRevision,seasonNumber:state.seasonNumber,phase:state.phase,revision:state.revision,resultsRevision:state.resultsRevision,resultsContentHash:state.resultsContentHash,results:sscClone(state.results),managerRole:role,ownAcknowledged:state.acknowledgedRoles.includes(role),acknowledgedRoles:[...state.acknowledgedRoles]});}
    return sscFreeze({contractVersion:1,feature:"ssjr-shared-season-commit",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,apply:sscApply,verifyState:sscVerifyState,projectForRole,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,requiresResultsReady:true,requiresBothAcknowledgements:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-season-commit-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,createProtocol:sscCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,requiresResultsReady:true,requiresBothAcknowledgements:true});
});