const assert=require("node:assert/strict");
const fs=require("node:fs");
const history=require("../../js/sharedHistoryConvergence.js");
const providerModule=require("../../js/sparkSharedHistoryConvergence.js");

const rivalryId=`pair_${"a".repeat(64)}`;
const hash=n=>`sha256:${String(n).repeat(64).slice(0,64)}`;
const managerSlots=[
  {slotId:"playerOne",accountId:"uid-one",profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:"uid-two",profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
];
const setup={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons:3};
const score=result=>{
  const championsLeague=result.championsLeague?5:0,leagueTitle=result.leaguePosition===1?3:0,domesticCup=result.domesticCup?1:0,performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0,individualAwardsBonus=result.topScorer||result.topAssist?1:0;
  return {championsLeague,leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
};
const source=(seasonNumber,results,winner,hashValue)=>({
  commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hashValue,seasonNumber,rivalryId,results},
  scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hashValue,seasonNumber,rivalryId,scoring:{playerOne:score(results.playerOne),playerTwo:score(results.playerTwo)},winner}
});
const season1={playerOne:{leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true},playerTwo:{leaguePosition:2,leaguePoints:80,leagueGoals:90,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}};
const season2={playerOne:{leaguePosition:4,leaguePoints:76,leagueGoals:75,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false},playerTwo:{leaguePosition:3,leaguePoints:78,leagueGoals:79,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false}};
const season3={playerOne:{leaguePosition:5,leaguePoints:70,leagueGoals:72,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false},playerTwo:{leaguePosition:2,leaguePoints:88,leagueGoals:95,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}};
const sources=[source(1,season1,"playerOne",hash("a")),source(2,season2,"draw",hash("b")),source(3,season3,"playerTwo",hash("c"))];

(async()=>{
  assert.equal(history.feature,"ssjr-shared-history-convergence");
  assert.equal(history.runtimeRevision,"1.9.1-r12");
  assert.equal(history.canonicalStorageMutation,false);
  assert.equal(history.providerWriteRequired,false);
  assert.equal(history.requiresCanonicalScoring,true);
  assert.equal(history.exactSeasonAddressing,true);
  assert.equal(history.identitySafe,true);

  const projection=history.buildProjection({rivalryId,setup,managerSlots,seasons:sources});
  assert.equal(projection.phase,"HISTORY_CONVERGED");
  assert.equal(projection.revision,1);
  assert.equal(projection.acceptedSeasons,3);
  assert.equal(projection.seasonHistory.length,3);
  assert.match(projection.acceptedRevisionKey,/^1:2:sha256:a{64}\|2:2:sha256:b{64}\|3:2:sha256:c{64}$/);
  assert.equal(projection.seasonHistory[0].playerOne.scoring.total,11,"the shared history must preserve canonical r11 scoring rather than recomputing a different policy");
  assert.equal(projection.seasonHistory[1].winner,"draw","a nonzero canonical score tie remains a draw even when league positions differ");
  assert.equal(projection.seasonHistory[2].winner,"playerTwo","only the zero-score tie uses league position and then league points");
  assert.equal(projection.managerRecords.playerOne.profileId,managerSlots[0].profileId);
  assert.equal(projection.managerRecords.playerTwo.profileId,managerSlots[1].profileId);
  assert.equal(projection.managerRecords.playerOne.saveId,managerSlots[0].saveId);
  assert.equal(projection.managerRecords.playerTwo.saveId,managerSlots[1].saveId);
  assert.equal(projection.managerRecords.playerOne.seasons,3);
  assert.equal(projection.managerRecords.playerOne.seasonWins,1);
  assert.equal(projection.managerRecords.playerOne.seasonDraws,1);
  assert.equal(projection.managerRecords.playerOne.seasonLosses,1);
  assert.equal(projection.managerRecords.playerOne.totalPoints,12);
  assert.equal(projection.managerRecords.playerTwo.totalPoints,1);
  assert.equal(projection.managerRecords.playerOne.leagueTitles,1);
  assert.equal(projection.managerRecords.playerOne.domesticCups,2);
  assert.equal(projection.managerRecords.playerOne.championsLeagues,1);
  assert.equal(projection.managerRecords.playerOne.totalTrophies,4);
  assert.equal(projection.trophyAttribution.playerOne.totalTrophies,4);
  assert.equal(projection.trophyAttribution.playerTwo.totalTrophies,0);
  assert.equal(projection.managerRecords.playerOne.bestLeaguePosition,1);
  assert.equal(projection.managerRecords.playerTwo.bestLeaguePosition,2);
  assert.equal(projection.managerRecords.playerOne.perfectSeasons,1);
  assert.equal(projection.managerRecords.playerOne.averageSeasonScore,4);
  assert.ok(Object.isFrozen(projection)&&Object.isFrozen(projection.seasonHistory)&&Object.isFrozen(projection.managerRecords.playerOne),"the convergence projection must be deeply immutable");
  assert.equal(history.verifyProjection(projection),projection);

  const badHash=JSON.parse(JSON.stringify(projection));badHash.seasonHistory[1].acceptedResultContentHash=hash("d");
  assert.throws(()=>history.verifyProjection(badHash),/HISTORY_CONVERGENCE_PROJECTION_TAMPERED|HISTORY_CONVERGENCE/);
  const scoreMismatch=source(1,season1,"playerOne",hash("e"));scoreMismatch.scoring.scoring.playerOne.total=10;
  assert.throws(()=>history.buildProjection({rivalryId,setup,managerSlots,seasons:[scoreMismatch]}),/HISTORY_CONVERGENCE_SCORE_MISMATCH/);
  const revisionMismatch=source(1,season1,"playerOne",hash("f"));revisionMismatch.scoring.resultsRevision=1;
  assert.throws(()=>history.buildProjection({rivalryId,setup,managerSlots,seasons:[revisionMismatch]}),/HISTORY_CONVERGENCE_SCORING_INVALID/);
  const identityCollision=managerSlots.map(item=>({...item}));identityCollision[1].profileId=identityCollision[0].profileId;
  assert.throws(()=>history.buildProjection({rivalryId,setup,managerSlots:identityCollision,seasons:[source(1,season1,"playerOne",hash("1"))]}),/HISTORY_CONVERGENCE_BINDING_INVALID/);
  const skippedFirst=source(2,season2,"draw",hash("2"));
  assert.throws(()=>history.buildProjection({rivalryId,setup,managerSlots,seasons:[skippedFirst]}),/HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED/);

  assert.equal(providerModule.feature,"ssjr-spark-shared-history-convergence");
  assert.equal(providerModule.runtimeRevision,"1.9.1-r12");
  assert.equal(providerModule.providerWriteRequired,false);
  assert.equal(providerModule.listPermissionRequired,false);
  assert.equal(providerModule.billingRequired,false);
  assert.equal(providerModule.blazeRequired,false);
  assert.equal(providerModule.cloudRunRequired,false);
  assert.equal(providerModule.cloudFunctionsRequired,false);
  const commitReads=[],scoringReads=[],authorityReads=[];
  const provider=providerModule.createProvider({
    historyModule:history,
    authorityReader:async(options,uid,id,throughSeason)=>{authorityReads.push({uid,id,throughSeason});return {managerSlots,setup};},
    commitProvider:{read:async options=>{commitReads.push({...options});return sources[options.seasonNumber-1].commit;}},
    scoringProvider:{read:async options=>{scoringReads.push({...options});return sources[options.seasonNumber-1].scoring;}}
  });
  const providerResult=await provider.read({firestore:{},firebaseSdk:{doc(){},runTransaction(){}},user:{uid:"uid-one"},rivalryId,sessionId:`session_${"5".repeat(64)}`,deviceId:`device_${"6".repeat(32)}`,throughSeason:3,cryptoImpl:{}});
  assert.equal(providerResult.ok,true);
  assert.equal(providerResult.authoritative,true);
  assert.equal(providerResult.managerRole,"playerOne");
  assert.equal(providerResult.throughSeason,3);
  assert.equal(providerResult.acceptedRevisionKey,projection.acceptedRevisionKey);
  assert.deepEqual(providerResult.projection,projection);
  assert.deepEqual(authorityReads,[{uid:"uid-one",id:rivalryId,throughSeason:3}]);
  assert.deepEqual(commitReads.map(item=>item.seasonNumber),[1,2,3]);
  assert.deepEqual(scoringReads.map(item=>item.seasonNumber),[1,2,3]);
  assert.ok(commitReads.every(item=>item.rivalryId===rivalryId&&item.teamCount===20&&!Object.hasOwn(item,"throughSeason")));
  assert.ok(scoringReads.every(item=>item.rivalryId===rivalryId&&item.teamCount===20&&!Object.hasOwn(item,"throughSeason")));

  const deniedProvider=providerModule.createProvider({historyModule:history,authorityReader:async()=>({managerSlots,setup}),commitProvider:{read:async()=>({ok:false,code:"SEASON_COMMIT_ACTIVE_SESSION_REQUIRED"})},scoringProvider:{read:async()=>sources[0].scoring}});
  const denied=await deniedProvider.read({firestore:{},firebaseSdk:{doc(){},runTransaction(){}},user:{uid:"uid-one"},rivalryId,sessionId:`session_${"5".repeat(64)}`,deviceId:`device_${"6".repeat(32)}`,throughSeason:1});
  assert.deepEqual(denied,{ok:false,code:"SEASON_COMMIT_ACTIVE_SESSION_REQUIRED"},"upstream active-session denial must propagate fail-closed");

  const providerSource=fs.readFileSync("js/sparkSharedHistoryConvergence.js","utf8");
  assert.match(providerSource,/"rivalries",rivalryId/);
  assert.match(providerSource,/"sharedSetup","authoritative"/);
  assert.match(providerSource,/for\(let seasonNumber=1;seasonNumber<=throughSeason;seasonNumber\+=1\)/);
  assert.match(providerSource,/commitProvider\.read\(shared\)/);
  assert.match(providerSource,/scoringProvider\.read\(shared\)/);
  assert.doesNotMatch(providerSource,/\bcollection\s*\(|\bgetDocs\s*\(|\bquery\s*\(/,"History Convergence must use exact season addressing, never collection listing");
  assert.doesNotMatch(providerSource,/\bsetDoc\s*\(|\bupdateDoc\s*\(|\bdeleteDoc\s*\(|\.set\s*\(|\.update\s*\(|\.delete\s*\(/,"History Convergence provider must remain read-only");

  console.log("PASS Shared History Convergence core + provider: exact contiguous accepted seasons cross-check r10 raw commit authority against r11 result revision/hash and canonical scoring; stable manager profile/save identities receive matching history, records and trophies; provider reads only exact rivalry/setup/season authority, propagates upstream denials, requires no list permission or writes, and remains Spark-only with zero canonical local-save mutation.");
})().catch(error=>{console.error(error);process.exitCode=1;});