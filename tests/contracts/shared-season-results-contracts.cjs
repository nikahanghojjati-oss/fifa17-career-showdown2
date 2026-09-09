const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const Factory=require('../../js/sharedSeasonResults.js');

const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,totalSeasons:3,confirmedRoles:['playerOne','playerTwo']};
const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
const transfer=seasonNumber=>({phase:'COMPLETED',seasonNumber,revision:7});
const op=n=>`season_result_op_${Number(n).toString(16).padStart(32,'0')}`;
const result=(overrides={})=>({leaguePosition:1,leaguePoints:100,leagueGoals:120,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false,...overrides});
const command=(n,base,resultValue=result())=>({type:'publish-result',operationId:op(n),baseRevision:base,result:resultValue});
const run=(protocol,state,actorRole,cmd,seasonNumber=1,overrides={})=>protocol.apply({state,setup:overrides.setup||setup,careerStart:overrides.careerStart||careerStart,transferChallenge:overrides.transferChallenge||transfer(seasonNumber),seasonNumber,actorRole,command:cmd});
const rejectsCode=async(promise,code)=>assert.rejects(promise,error=>error&&error.code===code,`expected ${code}`);

(async()=>{
  assert.equal(Factory.feature,'ssjr-shared-season-results-protocol-factory');
  assert.equal(Factory.runtimeRevision,'1.9.1-r9');
  assert.deepEqual([...Factory.resultKeys],['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist']);
  assert.equal(Factory.billingRequired,false);
  assert.equal(Factory.canonicalStorageMutation,false);
  assert.equal(Factory.authoritativeScoring,false);
  assert.equal(Factory.privateUntilBothPublished,true);

  const protocol=await Factory.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  assert.equal(protocol.feature,'ssjr-shared-season-results');
  assert.equal(protocol.runtimeRevision,'1.9.1-r9');
  assert.deepEqual([...protocol.roles],['playerOne','playerTwo']);
  assert.deepEqual([...protocol.phases],['COLLECTING','RESULTS_READY']);
  assert.equal(protocol.teamCount,20);
  assert.equal(protocol.billingRequired,false);
  assert.equal(protocol.canonicalStorageMutation,false);
  assert.equal(protocol.authoritativeScoring,false);

  await rejectsCode(run(protocol,null,'playerOne',command(1,0),1,{setup:{...setup,phase:'CLUB_SELECTION'}}),'SEASON_RESULTS_SETUP_NOT_CONFIRMED');
  await rejectsCode(run(protocol,null,'playerOne',command(2,0),1,{careerStart:{phase:'ONE_MANAGER_ACKNOWLEDGED',revision:1,acknowledgedRoles:['playerOne']}}),'SEASON_RESULTS_CAREER_START_NOT_READY');
  await rejectsCode(run(protocol,null,'playerOne',command(3,0),1,{transferChallenge:{phase:'SIGNING_ENTRY',seasonNumber:1,revision:6}}),'SEASON_RESULTS_TRANSFER_NOT_COMPLETE');
  await rejectsCode(run(protocol,null,'playerOne',command(4,0),2,{transferChallenge:transfer(1)}),'SEASON_RESULTS_TRANSFER_NOT_COMPLETE');
  await rejectsCode(run(protocol,null,'playerOne',command(5,0),4),'SEASON_RESULTS_SEASON_INVALID');

  let state=(await run(protocol,null,'playerOne',command(10,0))).state;
  assert.equal(state.phase,'COLLECTING');
  assert.equal(state.revision,1);
  assert.deepEqual(state.publishedRoles,['playerOne']);
  assert.deepEqual(state.results.playerOne,result());
  assert.equal(state.results.playerTwo,null);
  assert.ok(Object.isFrozen(state));
  assert.ok(Object.isFrozen(state.results));
  assert.ok(Object.isFrozen(state.results.playerOne));
  const p2Waiting=protocol.projectForRole(state,'playerTwo');
  assert.equal(p2Waiting.ownResult,null);
  assert.equal(p2Waiting.opponentResult,null,'first published result must remain hidden from opponent');
  assert.equal(p2Waiting.allResults,null);
  const p1Waiting=protocol.projectForRole(state,'playerOne');
  assert.deepEqual(p1Waiting.ownResult,result());
  assert.equal(p1Waiting.opponentResult,null);

  const replay=await run(protocol,state,'playerOne',command(10,0));
  assert.equal(replay.idempotent,true);
  assert.equal(replay.state.contentHash,state.contentHash);
  await rejectsCode(run(protocol,state,'playerTwo',command(10,0)),'SEASON_RESULTS_IDEMPOTENCY_CONFLICT');
  await rejectsCode(run(protocol,state,'playerTwo',command(11,0)),'SEASON_RESULTS_STALE_BASE_REVISION');
  await rejectsCode(run(protocol,state,'playerOne',command(12,1)),'SEASON_RESULTS_ROLE_ALREADY_PUBLISHED');

  const p2Result=result({leaguePosition:2,leaguePoints:98,leagueGoals:111,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true});
  state=(await run(protocol,state,'playerTwo',command(13,1,p2Result))).state;
  assert.equal(state.phase,'RESULTS_READY');
  assert.equal(state.revision,2);
  assert.deepEqual(state.publishedRoles,['playerOne','playerTwo']);
  const p1Ready=protocol.projectForRole(state,'playerOne');
  const p2Ready=protocol.projectForRole(state,'playerTwo');
  assert.deepEqual(p1Ready.opponentResult,p2Result);
  assert.deepEqual(p2Ready.opponentResult,result());
  assert.deepEqual(p1Ready.allResults,state.results);
  assert.deepEqual(p2Ready.allResults,state.results);
  await rejectsCode(run(protocol,state,'playerOne',command(14,2)),'SEASON_RESULTS_ALREADY_READY');

  const boundaryProtocol=await Factory.createProtocol({teamCount:2,cryptoImpl:webcrypto});
  let boundary=(await run(boundaryProtocol,null,'playerOne',command(20,0,result({leaguePosition:1,leaguePoints:0,leagueGoals:0})))).state;
  boundary=(await run(boundaryProtocol,boundary,'playerTwo',command(21,1,result({leaguePosition:2,leaguePoints:114,leagueGoals:300})))).state;
  assert.equal(boundary.phase,'RESULTS_READY');

  let invalidOp=30;
  for(const [patch,code] of [
    [{leaguePosition:0},'SEASON_RESULTS_POSITION_INVALID'],
    [{leaguePosition:21},'SEASON_RESULTS_POSITION_INVALID'],
    [{leaguePoints:-1},'SEASON_RESULTS_POINTS_INVALID'],
    [{leaguePoints:115},'SEASON_RESULTS_POINTS_INVALID'],
    [{leagueGoals:-1},'SEASON_RESULTS_GOALS_INVALID'],
    [{leagueGoals:301},'SEASON_RESULTS_GOALS_INVALID']
  ])await rejectsCode(run(protocol,null,'playerOne',command(invalidOp++,0,result(patch))),code);

  for(const key of ['domesticCup','championsLeague','topScorer','topAssist']){
    await rejectsCode(run(protocol,null,'playerOne',{type:'publish-result',operationId:op(40+['domesticCup','championsLeague','topScorer','topAssist'].indexOf(key)),baseRevision:0,result:result({[key]:1})}),'SEASON_RESULTS_PAYLOAD_INVALID');
  }
  await rejectsCode(run(protocol,null,'playerOne',{type:'publish-result',operationId:op(50),baseRevision:0,result:{...result(),extra:true}}),'SEASON_RESULTS_PAYLOAD_INVALID');

  const tampered=JSON.parse(JSON.stringify(state));
  tampered.results.playerOne.leagueGoals=299;
  await rejectsCode(protocol.verifyState(tampered),'SEASON_RESULTS_STATE_HASH_MISMATCH');
  const malformed=JSON.parse(JSON.stringify(state));
  malformed.receipts[1].baseRevision=0;
  await rejectsCode(protocol.verifyState(malformed),'SEASON_RESULTS_STATE_INVALID');

  const verified=await protocol.verifyState(state);
  assert.ok(Object.isFrozen(verified));
  assert.ok(Object.isFrozen(verified.receipts));
  assert.ok(Object.isFrozen(verified.results.playerTwo));

  console.log('PASS Shared Season Results deterministic contracts: exact seven-field reviewed result payload, confirmed setup/Career Start/completed same-season Transfer Challenge gates, one immutable publication per manager, opponent privacy until both publish, CAS/idempotency, numeric and boolean boundaries, state-hash tamper rejection, and deeply frozen returned authority all stay zero-billing with no canonical Save mutation or authoritative scoring.');
})().catch(error=>{console.error(error);process.exitCode=1;});
