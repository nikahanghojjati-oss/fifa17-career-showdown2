(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedHistoryConvergence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r12";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PROFILE_ID=/^profile_[0-9a-f]{24}$/;
  const SAVE_ID=/^save_[0-9a-f]{24}$/;
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const SCORE_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]);

  function hcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function hcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function hcClone(value){return JSON.parse(JSON.stringify(value));}
  function hcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcFreeze);Object.freeze(value);}return value;}
  function hcExact(value,keys,code){if(!hcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))hcFail(code);return value;}
  function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
  function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
  function hcResult(value){
    hcExact(value,RESULT_KEYS,"HISTORY_CONVERGENCE_RESULTS_INVALID");
    if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>20||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>114||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");}
    return hcClone(value);
  }
  function hcExpectedScore(result){
    const championsLeague=result.championsLeague?5:0;
    const leagueTitle=result.leaguePosition===1?3:0;
    const domesticCup=result.domesticCup?1:0;
    const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
    const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
    return {championsLeague,leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
  }
  function hcScore(value,result){
    hcExact(value,SCORE_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
    const expected=hcExpectedScore(result);
    for(const key of SCORE_KEYS){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    return hcClone(value);
  }
  function hcSlots(value){
    if(!Array.isArray(value)||value.length!==2)hcFail("HISTORY_CONVERGENCE_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>value.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||!PROFILE_ID.test(String(slot.profileId||""))||!SAVE_ID.test(String(slot.saveId||""))||typeof slot.accountId!=="string"||!slot.accountId.trim()||slot.entitlementState!=="active"))hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId)hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    return ordered.map(slot=>({slotId:slot.slotId,accountId:slot.accountId,profileId:slot.profileId,saveId:slot.saveId}));
  }
  function hcSetup(value,rivalryId){
    if(!hcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!hcPlain(value.clubs)||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)hcFail("HISTORY_CONVERGENCE_SETUP_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return value;
  }
  function hcCommit(value,rivalryId,seasonNumber){
    if(!hcPlain(value)||value.ok!==true||value.committed!==true||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2||value.seasonNumber!==seasonNumber||!HASH.test(String(value.resultsContentHash||""))||!hcPlain(value.results))hcFail("HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return {results:{playerOne:hcResult(value.results.playerOne),playerTwo:hcResult(value.results.playerTwo)},resultsRevision:value.resultsRevision,resultsContentHash:value.resultsContentHash};
  }
  function hcScoring(value,rivalryId,seasonNumber,commit){
    if(!hcPlain(value)||value.ok!==true||value.authoritative!==true||value.phase!=="SCORING_RECONCILED"||value.revision!==1||value.seasonCommitRevision!==3||value.resultsRevision!==commit.resultsRevision||value.resultsContentHash!==commit.resultsContentHash||value.seasonNumber!==seasonNumber||!hcPlain(value.scoring)||!ROLES.includes(value.winner)&&value.winner!=="draw")hcFail("HISTORY_CONVERGENCE_SCORING_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    const scoring={playerOne:hcScore(value.scoring.playerOne,commit.results.playerOne),playerTwo:hcScore(value.scoring.playerTwo,commit.results.playerTwo)};
    const a=scoring.playerOne.total,b=scoring.playerTwo.total;
    const expected=a>b?"playerOne":b>a?"playerTwo":a===0&&b===0?(commit.results.playerOne.leaguePosition<commit.results.playerTwo.leaguePosition?"playerOne":commit.results.playerTwo.leaguePosition<commit.results.playerOne.leaguePosition?"playerTwo":commit.results.playerOne.leaguePoints>commit.results.playerTwo.leaguePoints?"playerOne":commit.results.playerTwo.leaguePoints>commit.results.playerOne.leaguePoints?"playerTwo":"draw"):"draw";
    if(value.winner!==expected)hcFail("HISTORY_CONVERGENCE_WINNER_MISMATCH");
    return {scoring,winner:value.winner};
  }
  function hcManagerBase(slot,club){return {role:slot.slotId,profileId:slot.profileId,saveId:slot.saveId,club,seasons:0,seasonWins:0,seasonLosses:0,seasonDraws:0,totalPoints:0,leagueTitles:0,domesticCups:0,championsLeagues:0,totalTrophies:0,hundredPointSeasons:0,hundredGoalSeasons:0,topScorerSeasons:0,topAssistSeasons:0,perfectSeasons:0,bestLeaguePosition:null,bestLeaguePoints:null,bestLeagueGoals:null,bestSeasonScore:null,averageSeasonScore:0,averageLeaguePoints:0,averageLeagueGoals:0,totalLeaguePoints:0,totalLeagueGoals:0};}
  function hcAccumulate(record,season,role){
    const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score===11)record.perfectSeasons+=1;
    record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
  }
  function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
  function hcBuild({rivalryId,setup,managerSlots,seasons}={}){
    const id=hcRivalry(rivalryId),finalSetup=hcSetup(setup,id),slots=hcSlots(managerSlots);
    if(!Array.isArray(seasons)||seasons.length<1||seasons.length>finalSetup.totalSeasons)hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
    const history=[];
    for(let index=0;index<seasons.length;index+=1){
      const seasonNumber=index+1,source=seasons[index];if(!hcPlain(source))hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
      const commit=hcCommit(source.commit,id,seasonNumber),canonical=hcScoring(source.scoring,id,seasonNumber,commit);
      history.push({roundNumber:seasonNumber,acceptedResultRevision:commit.resultsRevision,acceptedResultContentHash:commit.resultsContentHash,seasonCommitRevision:3,canonicalScoringRevision:1,playerOne:{...commit.results.playerOne,scoring:canonical.scoring.playerOne},playerTwo:{...commit.results.playerTwo,scoring:canonical.scoring.playerTwo},winner:canonical.winner});
    }
    const managerRecords={playerOne:hcManagerBase(slots[0],finalSetup.clubs.playerOne),playerTwo:hcManagerBase(slots[1],finalSetup.clubs.playerTwo)};
    for(const season of history){for(const role of ROLES)hcAccumulate(managerRecords[role],season,role);}
    for(const role of ROLES)hcFinalize(managerRecords[role]);
    const trophyAttribution={playerOne:{profileId:managerRecords.playerOne.profileId,leagueTitles:managerRecords.playerOne.leagueTitles,domesticCups:managerRecords.playerOne.domesticCups,championsLeagues:managerRecords.playerOne.championsLeagues,totalTrophies:managerRecords.playerOne.totalTrophies},playerTwo:{profileId:managerRecords.playerTwo.profileId,leagueTitles:managerRecords.playerTwo.leagueTitles,domesticCups:managerRecords.playerTwo.domesticCups,championsLeagues:managerRecords.playerTwo.championsLeagues,totalTrophies:managerRecords.playerTwo.totalTrophies}};
    const acceptedRevisionKey=history.map(item=>`${item.roundNumber}:${item.acceptedResultRevision}:${item.acceptedResultContentHash}`).join("|");
    return hcFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:"HISTORY_CONVERGED",revision:1,rivalryId:id,setupRevision:6,leagueId:finalSetup.leagueId,totalSeasons:finalSetup.totalSeasons,acceptedSeasons:history.length,acceptedRevisionKey,managerSlots:slots,seasonHistory:history,managerRecords,trophyAttribution,canonicalStorageMutation:false,providerWriteRequired:false});
  }
  function hcVerify(projection){
    if(!hcPlain(projection)||projection.schemaVersion!==1||projection.runtimeRevision!==RUNTIME_REVISION||projection.phase!=="HISTORY_CONVERGED"||projection.revision!==1||projection.canonicalStorageMutation!==false||projection.providerWriteRequired!==false)hcFail("HISTORY_CONVERGENCE_PROJECTION_INVALID");
    const rebuilt=hcBuild({rivalryId:projection.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:projection.totalSeasons,leagueId:projection.leagueId,clubs:{playerOne:projection.managerRecords?.playerOne?.club,playerTwo:projection.managerRecords?.playerTwo?.club}},managerSlots:projection.managerSlots.map(slot=>({...slot,entitlementState:"active"})),seasons:projection.seasonHistory.map(season=>({commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,results:{playerOne:Object.fromEntries(RESULT_KEYS.map(key=>[key,season.playerOne[key]])),playerTwo:Object.fromEntries(RESULT_KEYS.map(key=>[key,season.playerTwo[key]]))}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,scoring:{playerOne:season.playerOne.scoring,playerTwo:season.playerTwo.scoring},winner:season.winner}}))});
    if(JSON.stringify(rebuilt)!==JSON.stringify(projection))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");return projection;
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,buildProjection:hcBuild,verifyProjection:hcVerify,canonicalStorageMutation:false,providerWriteRequired:false,requiresCanonicalScoring:true,exactSeasonAddressing:true,identitySafe:true});
});