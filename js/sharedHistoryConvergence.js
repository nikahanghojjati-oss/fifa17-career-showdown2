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
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  // r80 Europa League: a result may carry the sparse 8th key europaLeague (exactly true, never with championsLeague true; checked per
  // manager only), and its score then carries europaLeague:3. A result without it is the unchanged r79 shape and scores as before.
  const EUROPA_LEAGUE="europaLeague";
  const LEAGUE_TEAM_COUNTS=Object.freeze({premier_league:20,laliga:20,bundesliga:18,serie_a:20,ligue_1:20});

  function hcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function hcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function hcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcFreeze);Object.freeze(value);}return value;}
  function hcExact(value,keys,code){if(!hcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))hcFail(code);return value;}
  function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
  function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
  function hcTeamCount(leagueId){const n=LEAGUE_TEAM_COUNTS[String(leagueId||"").trim()];if(!Number.isInteger(n))hcFail("HISTORY_CONVERGENCE_LEAGUE_INVALID");return n;}
  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,hcResultKeys(value),"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");if(Object.hasOwn(value,"sacked")&&value.sacked!==true)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");return won;}
  function hcResultKeys(value){return [...RESULT_KEYS,...(Object.hasOwn(value,EUROPA_LEAGUE)?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[]),...(Object.hasOwn(value,"sacked")?["sacked"]:[])];}
  function hcResult(value,teamCount){
    hcEuropaLeague(value);
    const maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");}
    // The 7 keys in their fixed order, then europaLeague only when present (the order every normalizer writes), so the tamper rebuild matches.
    return Object.fromEntries(hcResultKeys(value).map(key=>[key,value[key]]));
  }
  function hcExpectedScore(result){
    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0,primePack=Number.isInteger(result.primePack)?result.primePack:0;
    const leagueTitle=result.leaguePosition===1?3:0;
    const domesticCup=result.domesticCup?1:0;
    const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
    const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
    return {championsLeague,...(europaLeague?{europaLeague}:{}),...(primePack?{primePack}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+primePack+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
  }
  function hcScore(value,result){
    if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE),hasPrimePack=Object.hasOwn(value,"primePack");
    // r87 Prime Pack: the sparse primePack breakdown key (1 to 4) sits beside the others exactly when the result carries it.
    const scoreKeys=[...SCORE_KEYS,...(hasEuropaLeague?[EUROPA_LEAGUE]:[]),...(hasPrimePack?["primePack"]:[])],allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
    if(keys.length!==allowed.length||allowed.some(key=>!Object.hasOwn(value,key)))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const expected=hcExpectedScore(result);
    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE)||hasPrimePack!==Object.hasOwn(expected,"primePack"))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
    for(const key of scoreKeys){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    if(hasTriggers){
      hcExact(value.triggers,TRIGGER_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
      const expectedTriggers={
        hundredLeaguePoints:result.leaguePoints>=100,
        hundredLeagueGoals:result.leagueGoals>=100,
        topScorer:result.topScorer,
        topAssist:result.topAssist
      };
      for(const key of TRIGGER_KEYS){if(value.triggers[key]!==expectedTriggers[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    }
    return Object.fromEntries(Object.keys(expected).map(key=>[key,value[key]]));
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
  function hcCommit(value,rivalryId,seasonNumber,teamCount){
    if(!hcPlain(value)||value.ok!==true||value.committed!==true||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2||value.seasonNumber!==seasonNumber||!HASH.test(String(value.resultsContentHash||""))||!hcPlain(value.results))hcFail("HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return {results:{playerOne:hcResult(value.results.playerOne,teamCount),playerTwo:hcResult(value.results.playerTwo,teamCount)},resultsRevision:value.resultsRevision,resultsContentHash:value.resultsContentHash};
  }
  function hcScoring(value,rivalryId,seasonNumber,commit){
    if(!hcPlain(value)||value.ok!==true||value.authoritative!==true||value.phase!=="SCORING_RECONCILED"||value.revision!==1||value.seasonCommitRevision!==3||value.resultsRevision!==commit.resultsRevision||value.resultsContentHash!==commit.resultsContentHash||value.seasonNumber!==seasonNumber||!hcPlain(value.scoring)||!ROLES.includes(value.winner)&&value.winner!=="draw")hcFail("HISTORY_CONVERGENCE_SCORING_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    const scoring={playerOne:hcScore(value.scoring.playerOne,commit.results.playerOne),playerTwo:hcScore(value.scoring.playerTwo,commit.results.playerTwo)};
    const a=scoring.playerOne.total,b=scoring.playerTwo.total;
    // r83: no tiebreak. Equal Showdown points is a draw.
    const expected=a>b?"playerOne":b>a?"playerTwo":"draw";
    // r87 Fable F7-01: a season scored before r83 could name a league-position winner on equal points. Equal points is a
    // draw, so such a winner is read as "draw" (the stored results and their hashes are untouched). A winner that
    // disagrees with unequal points is still an integrity failure, and a projection whose seasonHistory keeps the old
    // winner still fails verifyProjection (its rebuild says "draw").
    if(value.winner!==expected&&a!==b)hcFail("HISTORY_CONVERGENCE_WINNER_MISMATCH");
    return {scoring,winner:expected};
  }
  function hcManagerBase(slot,club){return {role:slot.slotId,profileId:slot.profileId,saveId:slot.saveId,club,seasons:0,seasonWins:0,seasonLosses:0,seasonDraws:0,totalPoints:0,leagueTitles:0,domesticCups:0,championsLeagues:0,europaLeagues:0,totalTrophies:0,hundredPointSeasons:0,hundredGoalSeasons:0,topScorerSeasons:0,topAssistSeasons:0,perfectSeasons:0,bestLeaguePosition:null,bestLeaguePoints:null,bestLeagueGoals:null,bestSeasonScore:null,averageSeasonScore:0,averageLeaguePoints:0,averageLeagueGoals:0,totalLeaguePoints:0,totalLeagueGoals:0};}
  // Nik 2026-11-01 18:32 UTC: a perfect season is 15, the season maximum, in every Showdown (no 11 anywhere).
  const PERFECT_SEASON=15;
  function hcAccumulate(record,season,role){
    const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score===PERFECT_SEASON)record.perfectSeasons+=1;
    record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
  }
  function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues+record.europaLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
  function hcBuild({rivalryId,setup,managerSlots,seasons}={}){
    const id=hcRivalry(rivalryId),finalSetup=hcSetup(setup,id),teamCount=hcTeamCount(finalSetup.leagueId),slots=hcSlots(managerSlots);
    if(!Array.isArray(seasons)||seasons.length<1||seasons.length>finalSetup.totalSeasons)hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
    const history=[];
    for(let index=0;index<seasons.length;index+=1){
      const seasonNumber=index+1,source=seasons[index];if(!hcPlain(source))hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
      const commit=hcCommit(source.commit,id,seasonNumber,teamCount),canonical=hcScoring(source.scoring,id,seasonNumber,commit);
      history.push({roundNumber:seasonNumber,acceptedResultRevision:commit.resultsRevision,acceptedResultContentHash:commit.resultsContentHash,seasonCommitRevision:3,canonicalScoringRevision:1,playerOne:{...commit.results.playerOne,scoring:canonical.scoring.playerOne},playerTwo:{...commit.results.playerTwo,scoring:canonical.scoring.playerTwo},winner:canonical.winner});
    }
    // r89 Sacked: a sacked season is the Showdown's last; a history that goes on past one is invalid.
    if(sackedBeforeLast(history))hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
    const managerRecords={playerOne:hcManagerBase(slots[0],finalSetup.clubs.playerOne),playerTwo:hcManagerBase(slots[1],finalSetup.clubs.playerTwo)};
    for(const season of history){for(const role of ROLES)hcAccumulate(managerRecords[role],season,role);}
    for(const role of ROLES)hcFinalize(managerRecords[role]);
    const trophyAttribution={playerOne:{profileId:managerRecords.playerOne.profileId,leagueTitles:managerRecords.playerOne.leagueTitles,domesticCups:managerRecords.playerOne.domesticCups,championsLeagues:managerRecords.playerOne.championsLeagues,europaLeagues:managerRecords.playerOne.europaLeagues,totalTrophies:managerRecords.playerOne.totalTrophies},playerTwo:{profileId:managerRecords.playerTwo.profileId,leagueTitles:managerRecords.playerTwo.leagueTitles,domesticCups:managerRecords.playerTwo.domesticCups,championsLeagues:managerRecords.playerTwo.championsLeagues,europaLeagues:managerRecords.playerTwo.europaLeagues,totalTrophies:managerRecords.playerTwo.totalTrophies}};
    const acceptedRevisionKey=history.map(item=>`${item.roundNumber}:${item.acceptedResultRevision}:${item.acceptedResultContentHash}`).join("|");
    return hcFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:"HISTORY_CONVERGED",revision:1,rivalryId:id,setupRevision:6,leagueId:finalSetup.leagueId,totalSeasons:finalSetup.totalSeasons,acceptedSeasons:history.length,acceptedRevisionKey,managerSlots:slots,seasonHistory:history,managerRecords,trophyAttribution,canonicalStorageMutation:false,providerWriteRequired:false});
  }
  // r89 Sacked (Nik 2026-11-03): each manager may tick "I was sacked" on his own Season Results card. Any sacking ends the
  // Showdown after that season: the points so far decide (equal = DRAW) and it is a COMPLETED Showdown on every career
  // screen, never the hidden "ended early" kind. The fact is the sparse result key sacked:true; everything else is derived
  // here from the verified history, so every screen agrees on one number, the final season:
  //   finalSeason = the first season with any sacked result, else totalSeasons.
  // totalSeasons keeps its meaning (the planned length: "X of N", REMATCH, Golden Showdown).
  const NONE=Object.freeze({playerOne:false,playerTwo:false});
  function seFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(seFreeze);Object.freeze(value);}return value;}
  function sackedIn(season){const s={playerOne:season?.playerOne?.sacked===true,playerTwo:season?.playerTwo?.sacked===true};return s.playerOne||s.playerTwo?s:null;}
  // seasonHistory: [{playerOne:{...result},playerTwo:{...result}}, ...] in season order (the shared history projection rows,
  // the season commits' results, or the career rows: anything whose playerOne/playerTwo carry the result keys).
  function hcEndOf(seasonHistory,totalSeasons){
    const list=Array.isArray(seasonHistory)?seasonHistory:[];
    for(let index=0;index<list.length;index+=1){const sacked=sackedIn(list[index]);if(sacked)return seFreeze({finalSeason:index+1,endedBy:"sacked",sackedSeason:index+1,sacked,fullLength:index+1===totalSeasons});}
    return seFreeze({finalSeason:totalSeasons,endedBy:"full",sackedSeason:null,sacked:{...NONE},fullLength:true});
  }
  function ofProjection(projection){return hcEndOf(projection?.seasonHistory,projection?.totalSeasons);}
  // A sacked season must be the last one: a history with a season after a sacked one is not a valid Showdown.
  function sackedBeforeLast(seasonHistory){const list=Array.isArray(seasonHistory)?seasonHistory:[];return list.slice(0,-1).some(season=>sackedIn(season)!==null);}
  // The Terminal Close witness (rivalries/{rid}.data.terminalClose): endedBy:'sacked' + sacked:{playerOne,playerTwo} only for a
  // sacked Showdown; completedSeason is the seasons actually played (equal to totalSeasons for a full-length one).
  function ofWitness(witness){
    if(!witness||typeof witness!=="object")return null;
    const sacked=witness.endedBy==="sacked"&&witness.sacked&&typeof witness.sacked==="object"?{playerOne:witness.sacked.playerOne===true,playerTwo:witness.sacked.playerTwo===true}:null;
    const played=Number.isInteger(witness.completedSeason)?witness.completedSeason:witness.totalSeasons;
    return seFreeze(sacked?{finalSeason:played,endedBy:"sacked",sackedSeason:played,sacked,fullLength:played===witness.totalSeasons}:{finalSeason:played,endedBy:"full",sackedSeason:null,sacked:{...NONE},fullLength:true});
  }
  function sackedRoles(end){return end&&end.endedBy==="sacked"?ROLES.filter(role=>end.sacked[role]===true):[];}
  const SHOWDOWN_END=Object.freeze({contractVersion:1,feature:"r89-showdown-end",endOf:hcEndOf,ofProjection,ofWitness,sackedIn,sackedBeforeLast,sackedRoles});
  if(root&&typeof root==="object"&&!root.CareerModeShowdownEnd)root.CareerModeShowdownEnd=SHOWDOWN_END;
  function hcVerify(projection){
    if(!hcPlain(projection)||projection.schemaVersion!==1||projection.runtimeRevision!==RUNTIME_REVISION||projection.phase!=="HISTORY_CONVERGED"||projection.revision!==1||projection.canonicalStorageMutation!==false||projection.providerWriteRequired!==false)hcFail("HISTORY_CONVERGENCE_PROJECTION_INVALID");
    const rebuilt=hcBuild({rivalryId:projection.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:projection.totalSeasons,leagueId:projection.leagueId,clubs:{playerOne:projection.managerRecords?.playerOne?.club,playerTwo:projection.managerRecords?.playerTwo?.club}},managerSlots:projection.managerSlots.map(slot=>({...slot,entitlementState:"active"})),seasons:projection.seasonHistory.map(season=>({commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,results:{playerOne:Object.fromEntries(hcResultKeys(season.playerOne).map(key=>[key,season.playerOne[key]])),playerTwo:Object.fromEntries(hcResultKeys(season.playerTwo).map(key=>[key,season.playerTwo[key]]))}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,scoring:{playerOne:season.playerOne.scoring,playerTwo:season.playerTwo.scoring},winner:season.winner}}))});
    if(JSON.stringify(rebuilt)===JSON.stringify(projection))return projection;
    // A projection saved before 2.0.0 (a Firebase careerSummary is create-only, and a phone keeps a copy) counted any season
    // of 11 or more as perfect. That counter is derived from the seasons, so a projection that differs from its rebuild in
    // the two perfectSeasons counters and nothing else is the same verified history: the rebuild, which counts 15s, is
    // returned. Any other difference is still tampering.
    const recounted={...projection,managerRecords:Object.fromEntries(Object.entries(hcPlain(projection.managerRecords)?projection.managerRecords:{}).map(([role,record])=>[role,hcPlain(record)&&Object.hasOwn(record,"perfectSeasons")&&hcPlain(rebuilt.managerRecords[role])?{...record,perfectSeasons:rebuilt.managerRecords[role].perfectSeasons}:record]))};
    if(JSON.stringify(rebuilt)!==JSON.stringify(recounted))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");
    return rebuilt;
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,buildProjection:hcBuild,verifyProjection:hcVerify,showdownEnd:SHOWDOWN_END,canonicalStorageMutation:false,providerWriteRequired:false,requiresCanonicalScoring:true,exactSeasonAddressing:true,identitySafe:true});
});