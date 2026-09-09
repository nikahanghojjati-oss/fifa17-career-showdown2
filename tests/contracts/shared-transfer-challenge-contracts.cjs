const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const Factory=require('../../js/sharedTransferChallenge.js');
const ProductionAdapter=require('../../js/productionSharedTransferChallenge.js');
require('./shared-transfer-challenge-provider-contracts.cjs');

cp.execFileSync(process.execPath,['scripts/build-production-firestore-rules.mjs'],{stdio:'pipe'});
const transferRules=fs.readFileSync('firestore.transfer-challenge-production.fragment.rules','utf8');
const generatedRules=fs.readFileSync('firestore.spark.generated.rules','utf8');
const productionSource=fs.readFileSync('js/productionSharedTransferChallenge.js','utf8');
const providerSource=fs.readFileSync('js/sparkSharedTransferChallenge.js','utf8');
const catalogSandbox={window:{}};
vm.runInNewContext(fs.readFileSync('data/transferOptions.js','utf8'),catalogSandbox,{filename:'data/transferOptions.js'});
const canonicalLeagueIds=catalogSandbox.window.FIFA17_TRANSFER_LEAGUES.map(item=>item.id);
const canonicalNationalityIds=catalogSandbox.window.FIFA17_TRANSFER_NATIONALITIES.map(item=>item.id);
function generatedMembership(functionName){
  const match=generatedRules.match(new RegExp(`function ${functionName}\\(value\\) \\{ return value in \\[([^\\]]*)\\]; \\}`));
  assert.ok(match,`generated Rules missing ${functionName}`);
  return [...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]);
}
assert.equal(canonicalLeagueIds.length,36);
assert.equal(canonicalNationalityIds.length,164);
assert.deepEqual(generatedMembership('ssjrTransferValidLeagueId'),canonicalLeagueIds,'Firestore league authority must exactly match the repository FIFA 17 Transfer catalog');
assert.deepEqual(generatedMembership('ssjrTransferValidNationalityId'),canonicalNationalityIds,'Firestore nationality authority must exactly match the repository FIFA 17 Transfer catalog');
assert.equal(generatedRules.includes("'invented-league'"),false);
assert.equal(generatedRules.includes("'invented-nationality'"),false);
for(const required of [
  '// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_BEGIN',
  '// SSJR_TRANSFER_CHALLENGE_MATCH_BEGIN',
  'match /transferChallenges/{transferId}',
  'match /roles/{managerRole}',
  'allow list, delete: if false',
  'after.startedAt == request.time',
  "request.time >= before.startedAt + duration.value(15, 'm')",
  "after.endedAt == before.startedAt + duration.value(15, 'm')",
  'getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)/roles/$(role))',
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED'",
  "public.operationTypes[i] == 'lock-guesses'",
  "public.operationTypes[i] == 'lock-signings'",
  'ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)'
])assert.ok(transferRules.includes(required),`Transfer Challenge Rules missing ${required}`);
for(const required of ['function ssjrTransferValidLeagueId(value)','function ssjrTransferValidNationalityId(value)','ssjrTransferValidLeagueId(value.leagueId)','ssjrTransferValidNationalityId(value.nationalityId)'])assert.ok(generatedRules.includes(required),`Generated Transfer Challenge Rules missing canonical catalog boundary: ${required}`);
for(const forbidden of [/cloud\s*run/i,/cloud\s*functions/i,/blaze/i,/billingEnabled\s*[:=]\s*true/i])assert.doesNotMatch(transferRules,forbidden,'Transfer Challenge Rules must remain Spark-only and zero-billing.');

assert.equal(ProductionAdapter.feature,'ssjr-production-shared-transfer-challenge');
assert.equal(ProductionAdapter.productionEnabled,true);
assert.equal(ProductionAdapter.requiresCareerStartReady,true);
assert.equal(ProductionAdapter.requiresExactActiveSession,true);
assert.equal(ProductionAdapter.privateUntilCompleted,true);
assert.equal(ProductionAdapter.serverClockAuthoritative,true);
assert.equal(ProductionAdapter.canonicalStorageMutation,false);
assert.equal(ProductionAdapter.billingRequired,false);
assert.equal(ProductionAdapter.blazeRequired,false);
for(const required of [
  'CONTROL_IDS=Object.freeze(["seasonPrimaryAction","startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"])',
  'root.document.addEventListener("click",pstcCapture,true)',
  'event.stopImmediatePropagation()',
  'provider.read(ctx.options)',
  'provider[method](options)',
  'return pstcMutate("lockGuesses",{guesses:pstcBuildGuesses(role)})',
  'return pstcMutate("lockSignings",{signings:pstcBuildSignings(role)})',
  'root.navigateTo("transferChallenge")',
  'view?.opponentInputs||null',
  'phase==="COMPLETED"',
  'SHARED SEASON RESULTS COMING NEXT',
  'will not fall through to local-only season authority',
  'POLL_MS=7000',
  'advanceExpiredWindow',
  'root.getTransferSelectorCanonicalValue',
  'root.setTransferSelectorValue'
])assert.ok(productionSource.includes(required),`Shared Transfer Challenge screen adapter missing ${required}`);
assert.doesNotMatch(productionSource,/localStorage|sessionStorage|saveCurrentShowdown\s*\(|openTransferChallenge\s*\(/,'Shared Transfer Challenge screen adapter must not mutate or invoke local Transfer Challenge authority.');
for(const required of ['repositoryCatalogAuthority:true','callerCatalogOverrides:false','TRANSFER_LEAGUE_IDS','TRANSFER_NATIONALITY_IDS'])assert.ok(providerSource.includes(required),`Shared Transfer provider missing repository catalog authority lock: ${required}`);
assert.doesNotMatch(providerSource,/options\.leagueIds|options\.nationalityIds/,'production provider must never accept caller-supplied transfer catalog authority');

const setup={
  phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,
  confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}
};
const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
const leagueIds=['england-premier-league','spain-primera-division','italy-serie-a'];
const nationalityIds=['england','spain','italy','brazil'];
const op=n=>`transfer_op_${Number(n).toString(16).padStart(32,'0')}`;
const command=(type,n,base,extra={})=>({type,operationId:op(n),baseRevision:base,...extra});
const run=(protocol,state,actorRole,cmd,nowEpochMs=1_000_000,seasonNumber=1,overrides={})=>protocol.apply({
  state,setup:overrides.setup||setup,careerStart:overrides.careerStart||careerStart,
  seasonNumber,actorRole,command:cmd,nowEpochMs
});
const rejectsCode=async(promise,code)=>assert.rejects(promise,error=>error&&error.code===code,`expected ${code}`);

(async()=>{
  const protocol=await Factory.createProtocol({leagueIds,nationalityIds,cryptoImpl:webcrypto});
  assert.equal(Factory.feature,'ssjr-shared-transfer-challenge-protocol-factory');
  assert.equal(protocol.feature,'ssjr-shared-transfer-challenge');
  assert.equal(protocol.runtimeRevision,'1.9.1-r8');
  assert.equal(protocol.windowMs,15*60*1000);
  assert.equal(protocol.billingRequired,false);
  assert.equal(protocol.canonicalStorageMutation,false);

  await rejectsCode(run(protocol,null,'playerTwo',command('start-window',1,0)),'TRANSFER_COORDINATOR_REQUIRED');
  await rejectsCode(run(protocol,null,'playerOne',command('lock-guesses',2,0,{guesses:[]})),'TRANSFER_NOT_STARTED');
  await rejectsCode(run(protocol,null,'playerOne',command('start-window',3,0),1_000_000,4),'TRANSFER_SEASON_INVALID');
  await rejectsCode(run(protocol,null,'playerOne',command('start-window',4,0),1_000_000,1,{careerStart:{phase:'ONE_MANAGER_ACKNOWLEDGED',revision:1,acknowledgedRoles:['playerOne']}}),'TRANSFER_CAREER_START_NOT_READY');

  let result=await run(protocol,null,'playerOne',command('start-window',10,0),1_000_000);
  let state=result.state;
  assert.equal(state.phase,'WINDOW_OPEN');
  assert.equal(state.revision,1);
  assert.equal(state.startedAtEpochMs,1_000_000);
  assert.deepEqual(state.endRequestedRoles,[]);

  const replay=await run(protocol,state,'playerOne',command('start-window',10,0),1_000_010);
  assert.equal(replay.idempotent,true);
  assert.equal(replay.state.contentHash,state.contentHash);
  await rejectsCode(run(protocol,state,'playerTwo',command('start-window',10,0),1_000_010),'TRANSFER_IDEMPOTENCY_CONFLICT');
  await rejectsCode(run(protocol,state,'playerOne',command('request-end-window',11,0),1_000_010),'TRANSFER_STALE_BASE_REVISION');
  await rejectsCode(run(protocol,state,'playerTwo',command('advance-expired-window',12,1),1_899_999),'TRANSFER_WINDOW_STILL_OPEN');

  result=await run(protocol,state,'playerOne',command('request-end-window',13,1),1_100_000);
  state=result.state;
  assert.equal(state.phase,'WINDOW_OPEN');
  assert.deepEqual(state.endRequestedRoles,['playerOne']);
  await rejectsCode(run(protocol,state,'playerOne',command('request-end-window',14,2),1_100_001),'TRANSFER_END_ALREADY_REQUESTED');

  result=await run(protocol,state,'playerTwo',command('request-end-window',15,2),1_100_500);
  state=result.state;
  assert.equal(state.phase,'GUESS_ENTRY');
  assert.equal(state.endedAtEpochMs,1_100_500);
  assert.deepEqual(state.endRequestedRoles,['playerOne','playerTwo']);

  const p1Guesses=[
    {slot:1,type:'league',valueId:'spain-primera-division'},
    {slot:2,type:'nationality',valueId:'brazil'}
  ];
  result=await run(protocol,state,'playerOne',command('lock-guesses',16,3,{guesses:p1Guesses}),1_101_000);
  state=result.state;
  assert.equal(state.phase,'GUESS_ENTRY');
  assert.deepEqual(state.guessLockedRoles,['playerOne']);
  const p2Before=protocol.projectForRole(state,'playerTwo');
  assert.deepEqual(p2Before.inputs.playerOne,{guesses:null,signings:null},'opponent guesses must remain private before completion');
  assert.deepEqual(protocol.projectForRole(state,'playerOne').inputs.playerOne.guesses,p1Guesses);
  await rejectsCode(run(protocol,state,'playerOne',command('lock-guesses',17,4,{guesses:p1Guesses}),1_101_001),'TRANSFER_GUESSES_ALREADY_LOCKED');
  await rejectsCode(run(protocol,state,'playerTwo',command('lock-guesses',18,4,{guesses:[{slot:1,type:'league',valueId:'invented-league'}]}),1_101_001),'TRANSFER_GUESSES_INVALID');

  const p2Guesses=[
    {slot:1,type:'league',valueId:'england-premier-league'},
    {slot:2,type:'nationality',valueId:'brazil'}
  ];
  result=await run(protocol,state,'playerTwo',command('lock-guesses',19,4,{guesses:p2Guesses}),1_102_000);
  state=result.state;
  assert.equal(state.phase,'SIGNING_ENTRY');
  assert.deepEqual(state.guessLockedRoles,['playerOne','playerTwo']);
  assert.equal(protocol.projectForRole(state,'playerOne').inputs.playerTwo.guesses,null,'locked opponent guesses stay hidden during signing entry');

  const p1Signings=[
    {slot:1,name:'Player A',leagueId:'england-premier-league',nationalityId:'spain'},
    {slot:2,name:'Player B',leagueId:'italy-serie-a',nationalityId:'brazil'}
  ];
  result=await run(protocol,state,'playerOne',command('lock-signings',20,5,{signings:p1Signings}),1_103_000);
  state=result.state;
  assert.equal(state.phase,'SIGNING_ENTRY');
  assert.deepEqual(state.signingLockedRoles,['playerOne']);
  assert.equal(protocol.projectForRole(state,'playerTwo').inputs.playerOne.signings,null,'opponent signings must remain private before completion');
  await rejectsCode(run(protocol,state,'playerTwo',command('lock-signings',21,6,{signings:[{slot:1,name:'Bad',leagueId:'bad-league',nationalityId:'england'}]}),1_103_001),'TRANSFER_SIGNINGS_INVALID');

  const p2Signings=[
    {slot:1,name:'Player C',leagueId:'spain-primera-division',nationalityId:'england'},
    {slot:2,name:'Player D',leagueId:'italy-serie-a',nationalityId:'italy'}
  ];
  result=await run(protocol,state,'playerTwo',command('lock-signings',22,6,{signings:p2Signings}),1_104_000);
  state=result.state;
  assert.equal(state.phase,'COMPLETED');
  assert.deepEqual(state.signingLockedRoles,['playerOne','playerTwo']);

  const p1View=protocol.projectForRole(state,'playerOne');
  const p2View=protocol.projectForRole(state,'playerTwo');
  assert.deepEqual(p1View.inputs.playerTwo.guesses,p2Guesses);
  assert.deepEqual(p2View.inputs.playerOne.guesses,p1Guesses);
  assert.deepEqual(p1View.inputs.playerTwo.signings,p2Signings);
  assert.deepEqual(p2View.inputs.playerOne.signings,p1Signings);
  assert.deepEqual(p1View.verdicts,p2View.verdicts,'both managers must derive the same verdict projection');
  assert.equal(p1View.verdicts.playerOne[0].release,true,'Player One signing must be released when Player Two guessed its previous league');
  assert.equal(p1View.verdicts.playerOne[1].release,true,'Player One signing must be released when Player Two guessed its nationality');
  assert.equal(p1View.verdicts.playerTwo[0].release,true,'Player Two signing must be released when Player One guessed its previous league');
  assert.equal(p1View.verdicts.playerTwo[1].release,false,'unmatched Player Two signing must survive');
  await rejectsCode(run(protocol,state,'playerOne',command('lock-signings',23,7,{signings:p1Signings}),1_104_001),'TRANSFER_ALREADY_COMPLETED');

  const timeoutProtocol=await Factory.createProtocol({leagueIds,nationalityIds,cryptoImpl:webcrypto});
  let timeout=(await run(timeoutProtocol,null,'playerOne',command('start-window',30,0),2_000_000,2)).state;
  timeout=(await run(timeoutProtocol,timeout,'playerTwo',command('advance-expired-window',31,1),2_900_000,2)).state;
  assert.equal(timeout.phase,'GUESS_ENTRY');
  assert.equal(timeout.endedAtEpochMs,2_900_000,'natural expiry must close at the exact 15 minute deadline');

  const tampered=JSON.parse(JSON.stringify(state));
  tampered.receipts=null;
  await assert.rejects(protocol.verifyState(tampered),'malformed receipt collections must fail closed');

  console.log('PASS Shared Transfer Challenge: confirmed Career Start gates entry; coordinator starts one 15-minute shared window; early end needs both roles; expiry is deterministic; guesses and signings are role-owned and private until completion; exact repository-owned FIFA 17 Transfer catalog IDs are enforced by provider and generated Firestore Rules; CAS/replay, season bounds and terminal completion fail closed; both managers derive identical verdicts; the production screen adapter reuses existing controls without local-save authority; Rules pin server time, atomic role payloads and pre-completion privacy before production promotion.');
})().catch(error=>{console.error(error);process.exitCode=1;});