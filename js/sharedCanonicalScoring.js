(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r11";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const BREAKDOWN_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total","triggers"]);
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","seasonCommitRevision","seasonCommitContentHash","scoring","winner","contentHash"]);
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1});

  function scFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function scExact(value,keys,code="CANONICAL_SCORING_VALUE_INVALID"){if(!scPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))scFail(code);return value;}
  function scClone(value){return JSON.parse(JSON.stringify(value));}
  function scFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scFreeze);Object.freeze(value);}return value;}
  function scCanonical(value){if(Array.isArray(value))return `[${value.map(scCanonical).join(",")}]`;if(scPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function scHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scFail("CANONICAL_SCORING_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function scTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)scFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return value;}
  function scResult(value,teamCount){scExact(value,RESULT_KEYS,"CANONICAL_SCORING_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals);if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>114||!Number.isInteger(goals)||goals<0||goals>300)scFail("CANONICAL_SCORING_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scFail("CANONICAL_SCORING_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist};}
  function scBreakdown(result){
    const hundredLeaguePoints=result.leaguePoints>=100,hundredLeagueGoals=result.leagueGoals>=100,topScorer=result.topScorer,topAssist=result.topAssist;
    const breakdown={
      championsLeague:result.championsLeague?RULES.championsLeague:0,
      leagueTitle:result.leaguePosition===1?RULES.leagueTitle:0,
      domesticCup:result.domesticCup?RULES.domesticCup:0,
      performanceBonus:(hundredLeaguePoints||hundredLeagueGoals)?RULES.performanceBonus:0,
      individualAwardsBonus:(topScorer||topAssist)?RULES.individualAwardsBonus:0,
      total:0,
      triggers:{hundredLeaguePoints,hundredLeagueGoals,topScorer,topAssist}
    };
    breakdown.total=breakdown.championsLeague+breakdown.leagueTitle+breakdown.domesticCup+breakdown.performanceBonus+breakdown.individualAwardsBonus;
    return breakdown;
  }
  function scWinner(results,scoring){
    if(scoring.playerOne.total>scoring.playerTwo.total)return "playerOne";
    if(scoring.playerTwo.total>scoring.playerOne.total)return "playerTwo";
    if(scoring.playerOne.total!==0||scoring.playerTwo.total!==0)return "draw";
    if(results.playerOne.leaguePosition<results.playerTwo.leaguePosition)return "playerOne";
    if(results.playerTwo.leaguePosition<results.playerOne.leaguePosition)return "playerTwo";
    if(results.playerOne.leaguePoints>results.playerTwo.leaguePoints)return "playerOne";
    if(results.playerTwo.leaguePoints>results.playerOne.leaguePoints)return "playerTwo";
    return "draw";
  }
  function scValidateBreakdown(value){scExact(value,BREAKDOWN_KEYS,"CANONICAL_SCORING_STATE_INVALID");scExact(value.triggers,TRIGGER_KEYS,"CANONICAL_SCORING_STATE_INVALID");for(const key of ["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]){if(!Number.isInteger(value[key])||value[key]<0||value[key]>11)scFail("CANONICAL_SCORING_STATE_INVALID");}for(const key of TRIGGER_KEYS){if(typeof value.triggers[key]!=="boolean")scFail("CANONICAL_SCORING_STATE_INVALID");}return value;}

  async function scCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonCommitModule=(typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit)}={}){
    const teams=scTeamCount(teamCount);
    if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")scFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");
    const commitProtocol=await seasonCommitModule.createProtocol({teamCount:teams,cryptoImpl});
    async function acknowledgedCommit(value){let verified;try{verified=await commitProtocol.verifyState(value);}catch(_error){scFail("CANONICAL_SCORING_SEASON_COMMIT_INVALID");}if(verified.phase!=="ACKNOWLEDGED"||verified.revision!==3||!verified.results?.playerOne||!verified.results?.playerTwo)scFail("CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");return verified;}
    async function seal(core){return scFreeze({...scClone(core),contentHash:await scHash(core,cryptoImpl)});}
    async function reconcile({seasonCommit}){
      const committed=await acknowledgedCommit(seasonCommit);
      const results={playerOne:scResult(committed.results.playerOne,teams),playerTwo:scResult(committed.results.playerTwo,teams)};
      const scoring={playerOne:scBreakdown(results.playerOne),playerTwo:scBreakdown(results.playerTwo)};
      const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:committed.seasonNumber,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:committed.revision,seasonCommitContentHash:committed.contentHash,scoring,winner:scWinner(results,scoring)};
      return seal(core);
    }
    async function verifyState(value,{seasonCommit}={}){
      scExact(value,STATE_KEYS,"CANONICAL_SCORING_STATE_INVALID");const core=scClone(value),hash=core.contentHash;delete core.contentHash;
      if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||value.phase!=="SCORING_RECONCILED"||value.revision!==1||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||value.seasonCommitRevision!==3||!HASH.test(value.seasonCommitContentHash)||!HASH.test(hash)||!["playerOne","playerTwo","draw"].includes(value.winner))scFail("CANONICAL_SCORING_STATE_INVALID");
      scExact(value.scoring,ROLES,"CANONICAL_SCORING_STATE_INVALID");ROLES.forEach(role=>scValidateBreakdown(value.scoring[role]));
      if(await scHash(core,cryptoImpl)!==hash)scFail("CANONICAL_SCORING_STATE_HASH_MISMATCH");
      if(seasonCommit){const expected=await reconcile({seasonCommit});if(expected.seasonNumber!==value.seasonNumber||expected.seasonCommitContentHash!==value.seasonCommitContentHash||scCanonical(expected.scoring)!==scCanonical(value.scoring)||expected.winner!==value.winner)scFail("CANONICAL_SCORING_RECOMPUTE_MISMATCH");}
      return scFreeze(scClone(value));
    }
    function projectForRole(state,role){if(!ROLES.includes(role))scFail("CANONICAL_SCORING_ROLE_INVALID");return scFreeze({schemaVersion:state.schemaVersion,runtimeRevision:state.runtimeRevision,seasonNumber:state.seasonNumber,phase:state.phase,revision:state.revision,seasonCommitRevision:state.seasonCommitRevision,seasonCommitContentHash:state.seasonCommitContentHash,managerRole:role,scoring:scClone(state.scoring),winner:state.winner});}
    return scFreeze({contractVersion:1,feature:"ssjr-canonical-scoring",runtimeRevision:RUNTIME_REVISION,roles:ROLES,rules:RULES,reconcile,verifyState,projectForRole,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,zeroScoreOnlyTiebreak:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-canonical-scoring-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,rules:RULES,createProtocol:scCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,zeroScoreOnlyTiebreak:true});
});