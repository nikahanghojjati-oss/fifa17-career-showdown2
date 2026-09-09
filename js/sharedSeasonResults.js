(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r9";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze([
    "leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"
  ]);
  const STATE_KEYS=Object.freeze([
    "schemaVersion","runtimeRevision","seasonNumber","phase","revision","submittedRoles","results","receipts","completedAtEpochMs","contentHash"
  ]);
  const SCORING_RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1});

  function ssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssrPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function ssrExact(value,keys,code="SEASON_RESULT_INVALID"){if(!ssrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrFail(code);}
  function ssrClone(value){return JSON.parse(JSON.stringify(value));}
  function ssrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrFreeze);Object.freeze(value);}return value;}
  function ssrCanonical(value){
    if(Array.isArray(value))return `[${value.map(ssrCanonical).join(",")}]`;
    if(ssrPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrCanonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  async function ssrHash(value,cryptoImpl){
    if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrFail("SEASON_RESULT_CRYPTO_UNAVAILABLE");
    const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrCanonical(value)));
    return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }
  function ssrRole(value){if(!ROLES.includes(value))ssrFail("SEASON_RESULT_ROLE_INVALID");return value;}
  function ssrEpoch(value){if(!Number.isSafeInteger(value)||value<0)ssrFail("SEASON_RESULT_CLOCK_INVALID");return value;}
  function ssrTeamCount(value){if(!Number.isInteger(value)||value<2||value>30)ssrFail("SEASON_RESULT_TEAM_COUNT_INVALID");return value;}
  function ssrRoleList(value){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))ssrFail("SEASON_RESULT_STATE_INVALID");return value;}
  function ssrConfirmedSetup(value,seasonNumber){
    if(!ssrPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6)ssrFail("SEASON_RESULT_SETUP_NOT_CONFIRMED");
    if(!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||seasonNumber<1||seasonNumber>value.totalSeasons)ssrFail("SEASON_RESULT_SETUP_INVALID");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))ssrFail("SEASON_RESULT_SETUP_INVALID");
    if(!value.clubs||typeof value.clubs.playerOne!=="string"||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerOne||!value.clubs.playerTwo||value.clubs.playerOne===value.clubs.playerTwo)ssrFail("SEASON_RESULT_SETUP_INVALID");
    return value;
  }
  function ssrCareerReady(value){
    if(!ssrPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2)ssrFail("SEASON_RESULT_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))ssrFail("SEASON_RESULT_CAREER_START_NOT_READY");
    return value;
  }
  function ssrTransferComplete(value,seasonNumber){
    if(!ssrPlain(value)||value.phase!=="COMPLETED"||Number(value.seasonNumber)!==seasonNumber)ssrFail("SEASON_RESULT_TRANSFER_NOT_COMPLETE");
    if(!Array.isArray(value.guessLockedRoles)||value.guessLockedRoles.length!==2||!ROLES.every(role=>value.guessLockedRoles.includes(role)))ssrFail("SEASON_RESULT_TRANSFER_NOT_COMPLETE");
    if(!Array.isArray(value.signingLockedRoles)||value.signingLockedRoles.length!==2||!ROLES.every(role=>value.signingLockedRoles.includes(role)))ssrFail("SEASON_RESULT_TRANSFER_NOT_COMPLETE");
    return value;
  }
  function ssrNormalizeResult(value,teamCount){
    ssrExact(value,RESULT_KEYS,"SEASON_RESULT_INVALID");
    const leaguePosition=Number(value.leaguePosition),leaguePoints=Number(value.leaguePoints),leagueGoals=Number(value.leagueGoals);
    if(!Number.isInteger(leaguePosition)||leaguePosition<1||leaguePosition>teamCount)ssrFail("SEASON_RESULT_POSITION_INVALID");
    if(!Number.isSafeInteger(leaguePoints)||leaguePoints<0)ssrFail("SEASON_RESULT_POINTS_INVALID");
    if(!Number.isSafeInteger(leagueGoals)||leagueGoals<0)ssrFail("SEASON_RESULT_GOALS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrFail("SEASON_RESULT_ACHIEVEMENT_INVALID");}
    return {leaguePosition,leaguePoints,leagueGoals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist};
  }
  function ssrScore(result){
    const hundredLeaguePoints=result.leaguePoints>=100,hundredLeagueGoals=result.leagueGoals>=100,topScorer=Boolean(result.topScorer),topAssist=Boolean(result.topAssist);
    const scoring={
      championsLeague:result.championsLeague?SCORING_RULES.championsLeague:0,
      leagueTitle:result.leaguePosition===1?SCORING_RULES.leagueTitle:0,
      domesticCup:result.domesticCup?SCORING_RULES.domesticCup:0,
      performanceBonus:(hundredLeaguePoints||hundredLeagueGoals)?SCORING_RULES.performanceBonus:0,
      individualAwardsBonus:(topScorer||topAssist)?SCORING_RULES.individualAwardsBonus:0,
      triggers:{hundredLeaguePoints,hundredLeagueGoals,topScorer,topAssist}
    };
    scoring.awardsBonus=scoring.individualAwardsBonus;
    scoring.total=scoring.championsLeague+scoring.leagueTitle+scoring.domesticCup+scoring.performanceBonus+scoring.individualAwardsBonus;
    return scoring;
  }
  function ssrWinner(playerOne,playerTwo){
    if(playerOne.scoring.total>playerTwo.scoring.total)return "playerOne";
    if(playerTwo.scoring.total>playerOne.scoring.total)return "playerTwo";
    if(playerOne.scoring.total!==0||playerTwo.scoring.total!==0)return "draw";
    if(playerOne.leaguePosition<playerTwo.leaguePosition)return "playerOne";
    if(playerTwo.leaguePosition<playerOne.leaguePosition)return "playerTwo";
    if(playerOne.leaguePoints>playerTwo.leaguePoints)return "playerOne";
    if(playerTwo.leaguePoints>playerOne.leaguePoints)return "playerTwo";
    return "draw";
  }
  function ssrReceipt(value){
    ssrExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_RESULT_STATE_INVALID");
    if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||value.type!=="submit-result"||!HASH.test(value.commandHash))ssrFail("SEASON_RESULT_STATE_INVALID");
    return value;
  }
  async function ssrVerifyState(value,teamCount,cryptoImpl){
    ssrExact(value,STATE_KEYS,"SEASON_RESULT_STATE_INVALID");
    const state=ssrClone(value),hash=state.contentHash;delete state.contentHash;
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!(["RESULT_ENTRY","COMPLETED"].includes(value.phase))||!Number.isInteger(value.revision)||value.revision<1||value.revision>2||!HASH.test(hash))ssrFail("SEASON_RESULT_STATE_INVALID");
    ssrRoleList(value.submittedRoles);
    ssrExact(value.results,ROLES,"SEASON_RESULT_STATE_INVALID");
    if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision||value.submittedRoles.length!==value.revision)ssrFail("SEASON_RESULT_STATE_INVALID");
    value.receipts.forEach(ssrReceipt);
    if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length)ssrFail("SEASON_RESULT_STATE_INVALID");
    value.receipts.forEach((receipt,index)=>{if(receipt.baseRevision!==index||receipt.actorRole!==value.submittedRoles[index])ssrFail("SEASON_RESULT_STATE_INVALID");});
    for(const role of ROLES){
      const submitted=value.submittedRoles.includes(role),result=value.results[role];
      if(submitted){ssrNormalizeResult(result,teamCount);}else if(result!==null)ssrFail("SEASON_RESULT_STATE_INVALID");
    }
    if(value.phase==="RESULT_ENTRY"&&(value.revision!==1||value.submittedRoles.length!==1||value.completedAtEpochMs!==null))ssrFail("SEASON_RESULT_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.revision!==2||value.submittedRoles.length!==2))ssrFail("SEASON_RESULT_STATE_INVALID");
    if(value.phase==="COMPLETED")ssrEpoch(value.completedAtEpochMs);else if(value.completedAtEpochMs!==null)ssrFail("SEASON_RESULT_STATE_INVALID");
    if(await ssrHash(state,cryptoImpl)!==hash)ssrFail("SEASON_RESULT_STATE_HASH_MISMATCH");
    return ssrFreeze(ssrClone(value));
  }
  function ssrCommand(value,teamCount){
    if(!ssrPlain(value)||value.type!=="submit-result"||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0)ssrFail("SEASON_RESULT_COMMAND_INVALID");
    ssrExact(value,["type","operationId","baseRevision","result"],"SEASON_RESULT_COMMAND_INVALID");
    return {...value,result:ssrNormalizeResult(value.result,teamCount)};
  }

  async function createProtocol({teamCount,cryptoImpl=root.crypto}={}){
    const teams=ssrTeamCount(teamCount);
    async function seal(core){return ssrFreeze({...ssrClone(core),contentHash:await ssrHash(core,cryptoImpl)});}
    async function verifyState(value){return ssrVerifyState(value,teams,cryptoImpl);}
    async function apply({state=null,setup,careerStart,transferChallenge,previousSeasonComplete=true,seasonNumber,actorRole,command,nowEpochMs}){
      if(!Number.isInteger(seasonNumber)||seasonNumber<1)ssrFail("SEASON_RESULT_SEASON_INVALID");
      ssrConfirmedSetup(setup,seasonNumber);ssrCareerReady(careerStart);ssrTransferComplete(transferChallenge,seasonNumber);
      if(seasonNumber>1&&previousSeasonComplete!==true)ssrFail("SEASON_RESULT_PREVIOUS_SEASON_REQUIRED");
      const role=ssrRole(actorRole),now=ssrEpoch(nowEpochMs),cmd=ssrCommand(command,teams),current=state?await verifyState(state):null;
      if(current&&current.seasonNumber!==seasonNumber)ssrFail("SEASON_RESULT_SEASON_MISMATCH");
      const commandHash=await ssrHash({actorRole:role,...cmd},cryptoImpl);
      if(current){
        const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);
        if(prior){
          if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)ssrFail("SEASON_RESULT_IDEMPOTENCY_CONFLICT");
          return ssrFreeze({ok:true,idempotent:true,state:current});
        }
      }
      const revision=current?current.revision:0;
      if(cmd.baseRevision!==revision)ssrFail("SEASON_RESULT_STALE_BASE_REVISION");
      if(current&&current.phase==="COMPLETED")ssrFail("SEASON_RESULT_ALREADY_COMPLETED");
      if(current&&current.submittedRoles.includes(role))ssrFail("SEASON_RESULT_ALREADY_SUBMITTED");
      const core=current?ssrClone(current):{
        schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,phase:"RESULT_ENTRY",revision:0,
        submittedRoles:[],results:{playerOne:null,playerTwo:null},receipts:[],completedAtEpochMs:null
      };
      delete core.contentHash;
      core.results[role]=cmd.result;
      core.submittedRoles.push(role);
      core.receipts.push({operationId:cmd.operationId,baseRevision:cmd.baseRevision,actorRole:role,type:cmd.type,commandHash});
      core.revision+=1;
      if(core.submittedRoles.length===2){core.phase="COMPLETED";core.completedAtEpochMs=now;}
      return ssrFreeze({ok:true,idempotent:false,state:await seal(core)});
    }
    function projectForRole(state,actorRole){
      const role=ssrRole(actorRole),other=role==="playerOne"?"playerTwo":"playerOne",completed=state&&state.phase==="COMPLETED";
      if(!state) return ssrFreeze({phase:"NOT_STARTED",revision:0,seasonNumber:null,managerRole:role,submittedRoles:[],ownResult:null,opponentResult:null,completed:false,scoring:null,winner:null});
      const own=state.results[role]?ssrClone(state.results[role]):null,opponent=completed&&state.results[other]?ssrClone(state.results[other]):null;
      let scoring=null,winner=null;
      if(completed){
        const one={...ssrClone(state.results.playerOne),scoring:ssrScore(state.results.playerOne)},two={...ssrClone(state.results.playerTwo),scoring:ssrScore(state.results.playerTwo)};
        scoring={playerOne:one.scoring,playerTwo:two.scoring};winner=ssrWinner(one,two);
      }
      return ssrFreeze({phase:state.phase,revision:state.revision,seasonNumber:state.seasonNumber,managerRole:role,submittedRoles:ssrClone(state.submittedRoles),ownResult:own,opponentResult:opponent,completed,scoring,winner});
    }
    function buildFinalRecord(state){
      if(!state||state.phase!=="COMPLETED")ssrFail("SEASON_RESULT_FINAL_NOT_READY");
      const playerOne={...ssrClone(state.results.playerOne),scoring:ssrScore(state.results.playerOne)};
      const playerTwo={...ssrClone(state.results.playerTwo),scoring:ssrScore(state.results.playerTwo)};
      return ssrFreeze({roundNumber:state.seasonNumber,transferChallengeSeason:state.seasonNumber,completedAtEpochMs:state.completedAtEpochMs,playerOne,playerTwo,winner:ssrWinner(playerOne,playerTwo)});
    }
    return Object.freeze({contractVersion:1,feature:"ssjr-shared-season-results",runtimeRevision:RUNTIME_REVISION,teamCount:teams,billingRequired:false,canonicalStorageMutation:false,apply,verifyState,projectForRole,buildFinalRecord,scoreResult:result=>ssrFreeze(ssrScore(ssrNormalizeResult(result,teams))),scoringRules:SCORING_RULES});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-season-results-protocol-factory",runtimeRevision:RUNTIME_REVISION,billingRequired:false,canonicalStorageMutation:false,createProtocol});
});
