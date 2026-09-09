const assert=require("node:assert/strict");
const fs=require("node:fs");
const {webcrypto}=require("node:crypto");
const resultsModule=require("../../js/sharedSeasonResults.js");
const commitModule=require("../../js/sharedSeasonCommit.js");

(async()=>{
  const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};
  const careerStart={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]};
  const transferChallenge={phase:"COMPLETED",seasonNumber:1,revision:7};
  const resultsProtocol=await resultsModule.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  const commitProtocol=await commitModule.createProtocol({teamCount:20,cryptoImpl:webcrypto,seasonResultsModule:resultsModule});
  const p1={leaguePosition:1,leaguePoints:96,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
  const p2={leaguePosition:3,leaguePoints:84,leagueGoals:79,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};
  const resultOp1="season_result_op_"+("1".repeat(32)),resultOp2="season_result_op_"+("2".repeat(32));
  const commitOp="season_commit_op_"+("a".repeat(32)),ack2="season_commit_op_"+("b".repeat(32)),ack1="season_commit_op_"+("c".repeat(32));

  let resultState=(await resultsProtocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerOne",command:{type:"publish-result",operationId:resultOp1,baseRevision:0,result:p1}})).state;
  await assert.rejects(
    commitProtocol.apply({state:null,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerOne",command:{type:"commit-season",operationId:commitOp,baseRevision:0}}),
    error=>error.code==="SEASON_COMMIT_RESULTS_NOT_READY"
  );
  resultState=(await resultsProtocol.apply({state:resultState,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerTwo",command:{type:"publish-result",operationId:resultOp2,baseRevision:1,result:p2}})).state;
  assert.equal(resultState.phase,"RESULTS_READY");assert.equal(resultState.revision,2);

  await assert.rejects(
    commitProtocol.apply({state:null,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerTwo",command:{type:"commit-season",operationId:commitOp,baseRevision:0}}),
    error=>error.code==="SEASON_COMMIT_COORDINATOR_REQUIRED"
  );
  let committed=(await commitProtocol.apply({state:null,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerOne",command:{type:"commit-season",operationId:commitOp,baseRevision:0}})).state;
  assert.equal(committed.phase,"COMMITTED");assert.equal(committed.revision,1);assert.equal(committed.resultsRevision,2);assert.equal(committed.resultsContentHash,resultState.contentHash);
  assert.deepEqual(committed.results,{playerOne:p1,playerTwo:p2});assert.deepEqual(committed.acknowledgedRoles,[]);

  const replay=await commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerOne",command:{type:"commit-season",operationId:commitOp,baseRevision:0}});
  assert.equal(replay.idempotent,true);assert.deepEqual(replay.state,committed);
  await assert.rejects(
    commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerOne",command:{type:"commit-season",operationId:"season_commit_op_"+("d".repeat(32)),baseRevision:1}}),
    error=>error.code==="SEASON_COMMIT_ALREADY_COMMITTED"
  );
  await assert.rejects(
    commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerTwo",command:{type:"acknowledge-season",operationId:ack2,baseRevision:0}}),
    error=>error.code==="SEASON_COMMIT_STALE_BASE_REVISION"
  );

  committed=(await commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerTwo",command:{type:"acknowledge-season",operationId:ack2,baseRevision:1}})).state;
  assert.equal(committed.phase,"COMMITTED");assert.equal(committed.revision,2);assert.deepEqual(committed.acknowledgedRoles,["playerTwo"]);
  const ackReplay=await commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerTwo",command:{type:"acknowledge-season",operationId:ack2,baseRevision:1}});
  assert.equal(ackReplay.idempotent,true);
  await assert.rejects(
    commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerTwo",command:{type:"acknowledge-season",operationId:"season_commit_op_"+("e".repeat(32)),baseRevision:2}}),
    error=>error.code==="SEASON_COMMIT_ROLE_ALREADY_ACKNOWLEDGED"
  );

  committed=(await commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerOne",command:{type:"acknowledge-season",operationId:ack1,baseRevision:2}})).state;
  assert.equal(committed.phase,"ACKNOWLEDGED");assert.equal(committed.revision,3);assert.deepEqual(committed.acknowledgedRoles,["playerTwo","playerOne"]);
  await assert.rejects(
    commitProtocol.apply({state:committed,setup,seasonResults:resultState,seasonNumber:1,actorRole:"playerOne",command:{type:"acknowledge-season",operationId:"season_commit_op_"+("f".repeat(32)),baseRevision:3}}),
    error=>error.code==="SEASON_COMMIT_ALREADY_ACKNOWLEDGED"
  );

  const verified=await commitProtocol.verifyState(committed);assert.deepEqual(verified,committed);
  const projection=commitProtocol.projectForRole(committed,"playerOne");
  assert.equal(projection.ownAcknowledged,true);assert.equal(projection.phase,"ACKNOWLEDGED");assert.deepEqual(projection.results,{playerOne:p1,playerTwo:p2});

  let alternate=(await resultsProtocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerOne",command:{type:"publish-result",operationId:"season_result_op_"+("3".repeat(32)),baseRevision:0,result:{...p1,leaguePoints:95}}})).state;
  alternate=(await resultsProtocol.apply({state:alternate,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerTwo",command:{type:"publish-result",operationId:"season_result_op_"+("4".repeat(32)),baseRevision:1,result:p2}})).state;
  await assert.rejects(
    commitProtocol.apply({state:committed,setup,seasonResults:alternate,seasonNumber:1,actorRole:"playerOne",command:{type:"acknowledge-season",operationId:"season_commit_op_"+("9".repeat(32)),baseRevision:3}}),
    error=>error.code==="SEASON_COMMIT_RESULTS_REVISION_MISMATCH"
  );

  const source=fs.readFileSync("js/sharedSeasonCommit.js","utf8");
  assert.match(source,/requiresResultsReady:true/);assert.match(source,/requiresBothAcknowledgements:true/);
  assert.match(source,/authoritativeScoring:false/);assert.match(source,/canonicalStorageMutation:false/);assert.match(source,/billingRequired:false/);
  assert.doesNotMatch(source,/calculatePlayerSeasonScore|determineSeasonWinner|saveCurrentShowdown|persistCompletedSeason/);
  process.stdout.write("PASS Shared Season Commit deterministic core: only authoritative RESULTS_READY can be atomically snapshotted by the setup coordinator, stale/duplicate/conflicting commands fail closed, both distinct managers must acknowledge, terminal state is immutable, results drift is rejected, and scoring/local Save authority remains separate.\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
