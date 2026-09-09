const assert=require("node:assert/strict");
const fs=require("node:fs");
const {webcrypto}=require("node:crypto");
const resultsModule=require("../../js/sharedSeasonResults.js");
const commitModule=require("../../js/sharedSeasonCommit.js");
const scoringModule=require("../../js/sharedCanonicalScoring.js");

const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};
const careerStart={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]};
const transferChallenge={phase:"COMPLETED",seasonNumber:1,revision:7};
let serial=0;
function op(prefix){serial+=1;return prefix+serial.toString(16).padStart(32,"0");}

(async()=>{
  const resultsProtocol=await resultsModule.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  const commitProtocol=await commitModule.createProtocol({teamCount:20,cryptoImpl:webcrypto,seasonResultsModule:resultsModule});
  const scoringProtocol=await scoringModule.createProtocol({teamCount:20,cryptoImpl:webcrypto,seasonCommitModule:commitModule});

  async function buildCommit(p1,p2,{fullyAcknowledge=true}={}){
    let results=(await resultsProtocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerOne",command:{type:"publish-result",operationId:op("season_result_op_"),baseRevision:0,result:p1}})).state;
    results=(await resultsProtocol.apply({state:results,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerTwo",command:{type:"publish-result",operationId:op("season_result_op_"),baseRevision:1,result:p2}})).state;
    let commit=(await commitProtocol.apply({state:null,setup,seasonResults:results,seasonNumber:1,actorRole:"playerOne",command:{type:"commit-season",operationId:op("season_commit_op_"),baseRevision:0}})).state;
    if(!fullyAcknowledge)return commit;
    commit=(await commitProtocol.apply({state:commit,setup,seasonResults:results,seasonNumber:1,actorRole:"playerOne",command:{type:"acknowledge-season",operationId:op("season_commit_op_"),baseRevision:1}})).state;
    commit=(await commitProtocol.apply({state:commit,setup,seasonResults:results,seasonNumber:1,actorRole:"playerTwo",command:{type:"acknowledge-season",operationId:op("season_commit_op_"),baseRevision:2}})).state;
    return commit;
  }

  const max={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
  const none={leaguePosition:2,leaguePoints:99,leagueGoals:99,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
  const maxCommit=await buildCommit(max,none);
  const maxState=await scoringProtocol.reconcile({seasonCommit:maxCommit});
  assert.equal(maxState.phase,"SCORING_RECONCILED");assert.equal(maxState.revision,1);assert.equal(maxState.seasonCommitRevision,3);assert.equal(maxState.seasonCommitContentHash,maxCommit.contentHash);
  assert.deepEqual(maxState.scoring.playerOne,{championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,total:11,triggers:{hundredLeaguePoints:true,hundredLeagueGoals:true,topScorer:true,topAssist:true}});
  assert.equal(maxState.scoring.playerTwo.total,0);assert.equal(maxState.winner,"playerOne");
  assert.equal(maxState.scoring.playerOne.performanceBonus,1,"100 points + 100 goals must remain one capped point");
  assert.equal(maxState.scoring.playerOne.individualAwardsBonus,1,"Top Scorer + Top Assist must remain one capped point");
  assert.deepEqual(await scoringProtocol.verifyState(maxState,{seasonCommit:maxCommit}),maxState);
  assert.equal(scoringProtocol.projectForRole(maxState,"playerTwo").winner,"playerOne");

  const tiedOne={leaguePosition:1,leaguePoints:108,leagueGoals:80,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
  const tiedTwo={leaguePosition:8,leaguePoints:50,leagueGoals:40,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false};
  const nonZeroTie=await scoringProtocol.reconcile({seasonCommit:await buildCommit(tiedOne,tiedTwo)});
  assert.equal(nonZeroTie.scoring.playerOne.total,4);assert.equal(nonZeroTie.scoring.playerTwo.total,1);
  const onePointA={leaguePosition:2,leaguePoints:70,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
  const onePointB={leaguePosition:15,leaguePoints:25,leagueGoals:25,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false};
  const exactNonZeroTie=await scoringProtocol.reconcile({seasonCommit:await buildCommit(onePointA,onePointB)});
  assert.equal(exactNonZeroTie.scoring.playerOne.total,1);assert.equal(exactNonZeroTie.scoring.playerTwo.total,1);assert.equal(exactNonZeroTie.winner,"draw","non-zero scoring ties must not use league tiebreakers");

  const zeroA={leaguePosition:4,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
  const zeroB={leaguePosition:6,leaguePoints:75,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
  const positionTieBreak=await scoringProtocol.reconcile({seasonCommit:await buildCommit(zeroA,zeroB)});
  assert.equal(positionTieBreak.scoring.playerOne.total,0);assert.equal(positionTieBreak.scoring.playerTwo.total,0);assert.equal(positionTieBreak.winner,"playerOne","league position is the first zero-score-only tiebreaker");
  const pointsA={...zeroA,leaguePosition:5,leaguePoints:72},pointsB={...zeroB,leaguePosition:5,leaguePoints:71};
  const pointsTieBreak=await scoringProtocol.reconcile({seasonCommit:await buildCommit(pointsA,pointsB)});
  assert.equal(pointsTieBreak.winner,"playerOne","league points are the second zero-score-only tiebreaker");
  const zeroDraw=await scoringProtocol.reconcile({seasonCommit:await buildCommit(pointsA,{...pointsB,leaguePoints:72})});assert.equal(zeroDraw.winner,"draw");

  const incomplete=await buildCommit(max,none,{fullyAcknowledge:false});
  await assert.rejects(scoringProtocol.reconcile({seasonCommit:incomplete}),error=>error.code==="CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");
  const tampered=JSON.parse(JSON.stringify(maxState));tampered.scoring.playerOne.total=999;
  await assert.rejects(scoringProtocol.verifyState(tampered,{seasonCommit:maxCommit}),error=>["CANONICAL_SCORING_STATE_INVALID","CANONICAL_SCORING_STATE_HASH_MISMATCH","CANONICAL_SCORING_RECOMPUTE_MISMATCH"].includes(error.code));

  const source=fs.readFileSync("js/sharedCanonicalScoring.js","utf8");
  assert.match(source,/championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1/);
  assert.match(source,/trustsSubmittedTotals:false/);assert.match(source,/requiresAcknowledgedSeasonCommit:true/);assert.match(source,/zeroScoreOnlyTiebreak:true/);assert.match(source,/authoritativeScoring:true/);
  assert.match(source,/canonicalStorageMutation:false/);assert.match(source,/billingRequired:false/);
  assert.doesNotMatch(source,/saveCurrentShowdown|persistCompletedSeason|localStorage\.setItem/);
  process.stdout.write("PASS Shared Canonical Scoring deterministic core: r10 ACKNOWLEDGED commit is mandatory, canonical 5/3/1 scoring and both one-point bonus caps are recomputed from supported raw results, submitted totals are not trusted, non-zero ties remain draws, zero-score-only position/points tiebreakers are preserved, and local Save authority remains untouched.\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
