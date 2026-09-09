const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const Factory=require('../../js/sharedSeasonResults.js');
require('./shared-season-results-provider-contracts.cjs');

cp.execFileSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{stdio:'pipe'});
const seasonRules=fs.readFileSync('firestore.season-results-production.fragment.rules','utf8');
const generatedRules=fs.readFileSync('firestore.spark.generated.rules','utf8');
for(const required of [
  '// SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN',
  '// SSJR_SEASON_RESULTS_MATCH_BEGIN',
  'match /seasonResults/{seasonId}',
  'match /roles/{managerRole}',
  'allow create: if ssjrSeasonResultValidCreate(rivalryId, seasonId)',
  'allow update: if ssjrSeasonResultValidUpdate(rivalryId, seasonId)',
  'allow create: if ssjrSeasonResultPrivateCreateValid(rivalryId, seasonId, managerRole)',
  'allow list, update, delete: if false',
  "transfer.phase == 'COMPLETED'",
  "transfer.runtimeRevision == '1.9.1-r8'",
  'ssjrSeasonResultPreviousComplete(rivalryId, seasonNumber)',
  "root.runtimeRevision == '1.9.1-r9'",
  'getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(role))',
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED'",
  'value.leaguePosition <= 20',
  'after.submittedAt == request.time',
  'ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)'
])assert.ok(seasonRules.includes(required),`Season Results Rules missing ${required}`);
for(const required of [
  'match /seasonResults/{seasonId}',
  "public.runtimeRevision == '1.9.1-r9'",
  'getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(role))',
  'value.leaguePosition <= 20'
])assert.ok(generatedRules.includes(required),`Generated Rules missing Season Results authority: ${required}`);
assert.equal((generatedRules.match(/match \/seasonResults\/\{seasonId\}/g)||[]).length,1,'generated Rules must contain exactly one Season Results public authority');
assert.equal((generatedRules.match(/match \/roles\/\{managerRole\}/g)||[]).length,2,'generated Rules must contain exactly the Transfer Challenge and Season Results private role matches');
for(const forbidden of [/cloud\s*run/i,/cloud\s*functions/i,/blaze/i,/billingEnabled\s*[:=]\s*true/i])assert.doesNotMatch(seasonRules,forbidden,'Season Results Rules must remain Spark-only and zero-billing.');

const scoringSandbox={};
vm.runInNewContext(`${fs.readFileSync('js/scoring.js','utf8')}\nthis.__scoring={calculatePlayerSeasonScore,determineSeasonWinner};`,scoringSandbox,{filename:'js/scoring.js'});
const LocalScoring=scoringSandbox.__scoring;

const setup={
  phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,
  confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}
};
const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
const transfer=seasonNumber=>({
  phase:'COMPLETED',seasonNumber,
  guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']
});
const op=n=>`season_result_op_${Number(n).toString(16).padStart(32,'0')}`;
const result=(overrides={})=>({
  leaguePosition:2,leaguePoints:85,leagueGoals:77,
  domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,
  ...overrides
});
const command=(n,base,resultValue)=>({type:'submit-result',operationId:op(n),baseRevision:base,result:resultValue});
const rejectsCode=async(promise,code)=>assert.rejects(promise,error=>error&&error.code===code,`expected ${code}`);

(async()=>{
  assert.equal(Factory.feature,'ssjr-shared-season-results-protocol-factory');
  assert.equal(Factory.runtimeRevision,'1.9.1-r9');
  assert.equal(Factory.billingRequired,false);
  assert.equal(Factory.canonicalStorageMutation,false);

  const protocol=await Factory.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  assert.equal(protocol.feature,'ssjr-shared-season-results');
  assert.equal(protocol.runtimeRevision,'1.9.1-r9');
  assert.equal(protocol.teamCount,20);
  assert.equal(protocol.billingRequired,false);
  assert.equal(protocol.canonicalStorageMutation,false);

  const apply=(state,actorRole,cmd,seasonNumber=1,overrides={})=>protocol.apply({
    state,setup:overrides.setup||setup,careerStart:overrides.careerStart||careerStart,
    transferChallenge:overrides.transferChallenge||transfer(seasonNumber),
    previousSeasonComplete:overrides.previousSeasonComplete,
    seasonNumber,actorRole,command:cmd,nowEpochMs:overrides.nowEpochMs||1_000_000
  });

  await rejectsCode(apply(null,'playerOne',command(1,0,result()),2),'SEASON_RESULT_PREVIOUS_SEASON_REQUIRED');
  await rejectsCode(apply(null,'playerOne',command(2,0,result()),2,{previousSeasonComplete:false}),'SEASON_RESULT_PREVIOUS_SEASON_REQUIRED');
  await rejectsCode(apply(null,'playerOne',command(3,0,result()),1,{transferChallenge:{...transfer(1),phase:'SIGNING_ENTRY'}}),'SEASON_RESULT_TRANSFER_NOT_COMPLETE');
  await rejectsCode(apply(null,'playerOne',command(4,0,result()),1,{careerStart:{phase:'ONE_MANAGER_ACKNOWLEDGED',revision:1,acknowledgedRoles:['playerOne']}}),'SEASON_RESULT_CAREER_START_NOT_READY');
  await rejectsCode(apply(null,'playerOne',command(5,0,result({leaguePosition:21})),1),'SEASON_RESULT_POSITION_INVALID');
  await rejectsCode(apply(null,'playerOne',command(6,0,result({leaguePoints:-1})),1),'SEASON_RESULT_POINTS_INVALID');
  await rejectsCode(apply(null,'playerOne',command(7,0,result({leagueGoals:-1})),1),'SEASON_RESULT_GOALS_INVALID');
  await rejectsCode(apply(null,'playerOne',command(8,0,result({domesticCup:1})),1),'SEASON_RESULT_ACHIEVEMENT_INVALID');

  const p1Result=result({leaguePosition:1,leaguePoints:102,leagueGoals:104,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
  let applied=await apply(null,'playerOne',command(10,0,p1Result));
  let state=applied.state;
  assert.equal(state.phase,'RESULT_ENTRY');
  assert.equal(state.revision,1);
  assert.deepEqual(state.submittedRoles,['playerOne']);
  assert.deepEqual(state.results.playerOne,p1Result);
  assert.equal(state.results.playerTwo,null);

  const p1View=protocol.projectForRole(state,'playerOne');
  const p2WaitingView=protocol.projectForRole(state,'playerTwo');
  assert.deepEqual(p1View.ownResult,p1Result);
  assert.equal(p1View.opponentResult,null);
  assert.equal(p2WaitingView.ownResult,null);
  assert.equal(p2WaitingView.opponentResult,null,'opponent result must stay hidden before both managers submit');
  assert.equal(p1View.scoring,null);
  assert.equal(p1View.winner,null);

  const replay=await apply(state,'playerOne',command(10,0,p1Result));
  assert.equal(replay.idempotent,true);
  assert.equal(replay.state.contentHash,state.contentHash);
  await rejectsCode(apply(state,'playerOne',command(11,1,p1Result)),'SEASON_RESULT_ALREADY_SUBMITTED');
  await rejectsCode(apply(state,'playerTwo',command(12,0,result())),'SEASON_RESULT_STALE_BASE_REVISION');

  const p2Result=result({leaguePosition:3,leaguePoints:90,leagueGoals:99,domesticCup:true,topAssist:true});
  applied=await apply(state,'playerTwo',command(13,1,p2Result),1,{nowEpochMs:1_100_000});
  state=applied.state;
  assert.equal(state.phase,'COMPLETED');
  assert.equal(state.revision,2);
  assert.deepEqual(state.submittedRoles,['playerOne','playerTwo']);
  assert.equal(state.completedAtEpochMs,1_100_000);

  const finalP1=protocol.projectForRole(state,'playerOne');
  const finalP2=protocol.projectForRole(state,'playerTwo');
  assert.deepEqual(finalP1.opponentResult,p2Result);
  assert.deepEqual(finalP2.opponentResult,p1Result);
  assert.deepEqual(finalP1.scoring,finalP2.scoring,'both managers must derive identical scoring');
  assert.equal(finalP1.winner,finalP2.winner,'both managers must derive identical winner');

  const finalRecord=protocol.buildFinalRecord(state);
  assert.equal(finalRecord.roundNumber,1);
  assert.equal(finalRecord.transferChallengeSeason,1);
  assert.equal(finalRecord.winner,'playerOne');
  assert.equal(finalRecord.playerOne.scoring.total,11,'5 CL + 3 league + 1 cup + 1 performance + 1 awards');
  assert.equal(finalRecord.playerOne.scoring.performanceBonus,1,'100 points and 100 goals share one capped performance point');
  assert.equal(finalRecord.playerOne.scoring.individualAwardsBonus,1,'Top Scorer and Top Assist share one capped awards point');

  assert.deepEqual(JSON.parse(JSON.stringify(protocol.scoreResult(p1Result))),JSON.parse(JSON.stringify(LocalScoring.calculatePlayerSeasonScore(p1Result))),'shared scoring must match the existing local scoring engine exactly');
  assert.deepEqual(JSON.parse(JSON.stringify(protocol.scoreResult(p2Result))),JSON.parse(JSON.stringify(LocalScoring.calculatePlayerSeasonScore(p2Result))),'shared scoring parity must hold for the rival result');
  const localOne={...p1Result,scoring:LocalScoring.calculatePlayerSeasonScore(p1Result)};
  const localTwo={...p2Result,scoring:LocalScoring.calculatePlayerSeasonScore(p2Result)};
  assert.equal(finalRecord.winner,LocalScoring.determineSeasonWinner(localOne,localTwo),'shared winner semantics must match local Season Results');

  const equalNonzeroOne={...result({domesticCup:true}),scoring:protocol.scoreResult(result({domesticCup:true}))};
  const equalNonzeroTwo={...result({leaguePosition:20,leaguePoints:1,domesticCup:true}),scoring:protocol.scoreResult(result({leaguePosition:20,leaguePoints:1,domesticCup:true}))};
  assert.equal(LocalScoring.determineSeasonWinner(equalNonzeroOne,equalNonzeroTwo),'draw','equal nonzero showdown scores remain a draw');

  const zeroOne=result({leaguePosition:5,leaguePoints:70});
  const zeroTwo=result({leaguePosition:6,leaguePoints:95});
  const zeroOneScored={...zeroOne,scoring:protocol.scoreResult(zeroOne)};
  const zeroTwoScored={...zeroTwo,scoring:protocol.scoreResult(zeroTwo)};
  assert.equal(LocalScoring.determineSeasonWinner(zeroOneScored,zeroTwoScored),'playerOne','league position tiebreak applies only when both showdown scores are zero');

  await rejectsCode(apply(state,'playerOne',command(14,2,p1Result)),'SEASON_RESULT_ALREADY_COMPLETED');
  assert.throws(()=>protocol.buildFinalRecord(replay.state),error=>error&&error.code==='SEASON_RESULT_FINAL_NOT_READY','expected SEASON_RESULT_FINAL_NOT_READY');

  const tampered=JSON.parse(JSON.stringify(state));
  tampered.results.playerOne.leaguePoints=999;
  await rejectsCode(protocol.verifyState(tampered),'SEASON_RESULT_STATE_HASH_MISMATCH');

  let season2=(await apply(null,'playerOne',command(20,0,result({leaguePosition:4})),2,{previousSeasonComplete:true,nowEpochMs:2_000_000})).state;
  season2=(await apply(season2,'playerTwo',command(21,1,result({leaguePosition:5})),2,{previousSeasonComplete:true,nowEpochMs:2_100_000})).state;
  assert.equal(season2.phase,'COMPLETED');
  assert.equal(season2.seasonNumber,2);

  console.log('PASS Shared Season Results: exact Shared Setup, Career Start and completed Transfer Challenge gate entry; later seasons fail closed without a completed predecessor; each bound manager submits exactly one immutable seven-field result; opponent data stays hidden until both submit; generated Spark Rules atomically couple public/private role writes and block opponent reads until completion; CAS/idempotency and malformed input fail closed; r9 scoring and winner semantics match the existing local Season Results engine exactly; completion yields one identical read-only season record without mutating canonical local storage.');
})().catch(error=>{console.error(error);process.exitCode=1;});
