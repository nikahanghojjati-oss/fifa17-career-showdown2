(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r9";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["COLLECTING","RESULTS_READY"]);
  const OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","publishedRoles","results","receipts","contentHash"]);

  function ssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssrPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function ssrExact(value,keys,code="SEASON_RESULTS_VALUE_INVALID"){if(!ssrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrFail(code);return value;}
  function ssrClone(value){return JSON.parse(JSON.stringify(value));}
  function ssrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrFreeze);Object.freeze(value);}return value;}
  function ssrCanonical(value){if(Array.isArray(value))return `[${value.map(ssrCanonical).join(",")}]`;if(ssrPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function ssrHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function ssrRole(value){if(!ROLES.includes(value))ssrFail("SEASON_RESULTS_ROLE_INVALID");return value;}
  function ssrSeason(value,totalSeasons){if(!Number.isInteger(value)||value<1||value>totalSeasons)ssrFail("SEASON_RESULTS_SEASON_INVALID");return value;}
  function ssrTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)ssrFail("SEASON_RESULTS_TEAM_COUNT_INVALID");return value;}
  function ssrRoleList(value,code="SEASON_RESULTS_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))ssrFail(code);return value;}
  function ssrConfirmedSetup(value){if(!ssrPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||![1,3,5,10].includes(value.totalSeasons))ssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))ssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");return value;}
  function ssrCareerReady(value){if(!ssrPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2||!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))ssrFail("SEASON_RESULTS_CAREER_START_NOT_READY");return value;}
  function ssrTransferComplete(value,seasonNumber){if(!ssrPlain(value)||value.phase!=="COMPLETED"||value.seasonNumber!==seasonNumber||!Number.isInteger(value.revision)||value.revision<1)ssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");return value;}
  function ssrNormalizeResult(value,teamCount){
    ssrExact(value,RESULT_KEYS,"SEASON_RESULTS_PAYLOAD_INVALID");
    const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals);
    if(!Number.isInteger(position)||position<1||position>teamCount)ssrFail("SEASON_RESULTS_POSITION_INVALID");
    if(!Number.isInteger(points)||points<0||points>114)ssrFail("SEASON_RESULTS_POINTS_INVALID");
    if(!Number.isInteger(goals)||goals<0||goals>300)ssrFail("SEASON_RESULTS_GOALS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrFail("SEASON_RESULTS_PAYLOAD_INVALID");}
    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist};
  }
  function ssrReceipt(value){ssrExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_RESULTS_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||value.type!=="publish-result"||!HASH.test(value.commandHash))ssrFail("SEASON_RESULTS_STATE_INVALID");return value;}
  async function ssrVerifyState(value,teamCount,cryptoImpl){
    ssrExact(value,STATE_KEYS,"SEASON_RESULTS_STATE_INVALID");const core=ssrClone(value),hash=core.contentHash;delete core.contentHash;
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>2||!HASH.test(hash))ssrFail("SEASON_RESULTS_STATE_INVALID");
    ssrRoleList(value.publishedRoles);
    ssrExact(value.results,ROLES,"SEASON_RESULTS_STATE_INVALID");
    for(const role of ROLES){const result=value.results[role];if(result!==null)ssrNormalizeResult(result,teamCount);if(value.publishedRoles.includes(role)!==(result!==null))ssrFail("SEASON_RESULTS_STATE_INVALID");}
    if(value.publishedRoles.length!==value.revision)ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(value.phase==="COLLECTING"&&value.publishedRoles.length!==1)ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(value.phase==="RESULTS_READY"&&value.publishedRoles.length!==2)ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)ssrFail("SEASON_RESULTS_STATE_INVALID");value.receipts.forEach(ssrReceipt);
    if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length||value.receipts.some((receipt,index)=>receipt.baseRevision!==index))ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(await ssrHash(core,cryptoImpl)!==hash)ssrFail("SEASON_RESULTS_STATE_HASH_MISMATCH");
    return ssrFreeze(ssrClone(value));
  }
  function ssrCommand(value,teamCount){if(!ssrPlain(value))ssrFail("SEASON_RESULTS_COMMAND_INVALID");ssrExact(value,["type","operationId","baseRevision","result"],"SEASON_RESULTS_COMMAND_INVALID");if(value.type!=="publish-result"||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||value.baseRevision>2)ssrFail("SEASON_RESULTS_COMMAND_INVALID");return {type:value.type,operationId:value.operationId,baseRevision:value.baseRevision,result:ssrNormalizeResult(value.result,teamCount)};}

  async function ssrCreateProtocol({teamCount,cryptoImpl=root.crypto}={}){
    const teams=ssrTeamCount(teamCount);
    async function seal(core){return ssrFreeze({...ssrClone(core),contentHash:await ssrHash(core,cryptoImpl)});}
    async function verifyState(value){return ssrVerifyState(value,teams,cryptoImpl);}
    async function apply({state=null,setup,careerStart,transferChallenge,seasonNumber,actorRole,command}){
      const confirmed=ssrConfirmedSetup(setup);ssrCareerReady(careerStart);const season=ssrSeason(seasonNumber,confirmed.totalSeasons);ssrTransferComplete(transferChallenge,season);const role=ssrRole(actorRole),cmd=ssrCommand(command,teams),current=state?await verifyState(state):null;
      if(current&&current.seasonNumber!==season)ssrFail("SEASON_RESULTS_SEASON_MISMATCH");
      const commandHash=await ssrHash({actorRole:role,...cmd},cryptoImpl);
      if(current){const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);if(prior){if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)ssrFail("SEASON_RESULTS_IDEMPOTENCY_CONFLICT");return ssrFreeze({ok:true,idempotent:true,state:current});}}
      const revision=current?current.revision:0;if(cmd.baseRevision!==revision)ssrFail("SEASON_RESULTS_STALE_BASE_REVISION");if(current&&current.phase==="RESULTS_READY")ssrFail("SEASON_RESULTS_ALREADY_READY");if(current&&current.publishedRoles.includes(role))ssrFail("SEASON_RESULTS_ROLE_ALREADY_PUBLISHED");
      const core=current?ssrClone(current):{schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:season,phase:"COLLECTING",revision:0,publishedRoles:[],results:{playerOne:null,playerTwo:null},receipts:[]};delete core.contentHash;
      core.results[role]=cmd.result;core.publishedRoles.push(role);core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});core.revision=revision+1;if(core.publishedRoles.length===2)core.phase="RESULTS_READY";
      const next=await seal(core);await verifyState(next);return ssrFreeze({ok:true,idempotent:false,state:next});
    }
    function projectForRole(state,role){ssrRole(role);const current=ssrClone(state),opponent=role==="playerOne"?"playerTwo":"playerOne";const ready=current.phase==="RESULTS_READY";return ssrFreeze({schemaVersion:current.schemaVersion,runtimeRevision:current.runtimeRevision,seasonNumber:current.seasonNumber,phase:current.phase,revision:current.revision,publishedRoles:[...current.publishedRoles],managerRole:role,ownResult:current.results[role],opponentResult:ready?current.results[opponent]:null,allResults:ready?current.results:null});}
    return ssrFreeze({contractVersion:1,feature:"ssjr-shared-season-results",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,resultKeys:RESULT_KEYS,teamCount:teams,apply,verifyState,projectForRole,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,privateUntilBothPublished:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-season-results-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,resultKeys:RESULT_KEYS,createProtocol:ssrCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,privateUntilBothPublished:true});
});