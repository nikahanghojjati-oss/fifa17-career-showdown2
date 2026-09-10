const assert=require("node:assert/strict");
const history=require("../../js/sharedHistoryConvergence.js");

const rivalryId=`pair_${"a".repeat(64)}`;
const hash=n=>`sha256:${String(n).repeat(64).slice(0,64)}`;
const managerSlots=[
  {slotId:"playerOne",accountId:"uid-one",profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:"uid-two",profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
];
const setup={rivalryId,phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons:3};
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

assert.equal(history.feature,"ssjr-shared-history-convergence");
assert.equal(history.runtimeRevision,"1.9.1-r12");
assert.equal(history.canonicalStorageMutation,false);
assert.equal(history.providerWriteRequired,false);
assert.equal(history.requiresCanonicalScoring,true);
assert.equal(history.exactSeasonAddressing,true);
assert.equal(history.identitySafe,true);

const projection=history.buildProjection({rivalryId,setup,managerSlots,seasons:[source(1,season1,"playerOne",hash("a")),source(2,season2,"draw",hash("b")),source(3,season3,"playerTwo",hash("c"))]});
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

console.log("PASS Shared History Convergence deterministic core: exact contiguous accepted seasons must cross-check r10 raw commit authority against r11 result revision/hash and canonical scoring; both stable manager identities receive matching season records and trophy attribution; nonzero ties and zero-score tiebreak semantics remain frozen; projection is deeply immutable and performs zero provider or canonical local-save writes.");