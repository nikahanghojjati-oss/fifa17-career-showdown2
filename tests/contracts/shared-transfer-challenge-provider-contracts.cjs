const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const Provider=require('../../js/sparkSharedTransferChallenge.js');

const rivalryId='pair_'+('a'.repeat(64));
const sessionId='session_'+('b'.repeat(64));
const device1='device_'+('1'.repeat(32));
const device2='device_'+('2'.repeat(32));
const uid1='manager_one';
const uid2='manager_two';
const leagueIds=['england-premier-league','spain-primera-division','italy-serie-a'];
const nationalityIds=['england','spain','italy','brazil'];
const op=n=>`transfer_op_${Number(n).toString(16).padStart(32,'0')}`;
const ts=millis=>({toMillis:()=>millis});
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value,(key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item),(key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item));

function createHarness(){
  const store=new Map(),getLog=[];
  const key=(...parts)=>parts.join('/');
  const put=(path,value)=>store.set(path,clone(value));
  put(key('accounts',uid1),{objectType:'account',objectId:uid1,lifecycleState:'live',data:{status:'active'}});
  put(key('accounts',uid2),{objectType:'account',objectId:uid2,lifecycleState:'live',data:{status:'active'}});
  put(key('accounts',uid1,'devices',device1),{objectType:'device',objectId:device1,lifecycleState:'live',data:{deviceId:device1,state:'active'}});
  put(key('accounts',uid2,'devices',device2),{objectType:'device',objectId:device2,lifecycleState:'live',data:{deviceId:device2,state:'active'}});
  put(key('rivalries',rivalryId),{objectType:'rivalry',objectId:rivalryId,lifecycleState:'live',data:{connectionState:'active',authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:'playerOne',accountId:uid1,entitlementState:'active'},{slotId:'playerTwo',accountId:uid2,entitlementState:'active'}]}});
  put(key('rivalries',rivalryId,'sessions',sessionId),{objectType:'session',objectId:sessionId,lifecycleState:'live',data:{rivalryId,state:'active',memberAccountIds:[uid1,uid2],expiresAt:ts(10_000_000)}});
  put(key('rivalries',rivalryId,'sharedSetup','authoritative'),{schemaVersion:1,objectType:'sharedSetupLedger',rivalryId,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo']});
  put(key('rivalries',rivalryId,'careerStart','authoritative'),{schemaVersion:1,objectType:'sharedCareerStart',rivalryId,setupRevision:6,totalSeasons:3,revision:2,phase:'CAREER_START_READY',acknowledgedRoles:['playerOne','playerTwo']});
  let nowForServerTimestamp=0;
  const sdk={
    doc:(_db,...parts)=>key(...parts),
    Timestamp:{fromMillis:millis=>ts(millis)},
    serverTimestamp:()=>ts(nowForServerTimestamp),
    runTransaction:async(_db,callback)=>{
      const pending=[];
      const transaction={
        get:async ref=>{getLog.push(ref);return {exists:()=>store.has(ref),data:()=>clone(store.get(ref))};},
        set:(ref,value)=>pending.push([ref,clone(value)])
      };
      const result=await callback(transaction);
      pending.forEach(([ref,value])=>store.set(ref,value));
      return result;
    }
  };
  const options=(role,nowEpochMs)=>{nowForServerTimestamp=nowEpochMs;return {user:{uid:role==='playerOne'?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==='playerOne'?device1:device2,seasonNumber:1,leagueIds,nationalityIds,cryptoImpl:webcrypto,nowEpochMs};};
  return {store,getLog,options,key};
}

(async()=>{
  assert.equal(Provider.feature,'ssjr-spark-shared-transfer-challenge');
  assert.equal(Provider.runtimeRevision,'1.9.1-r8');
  assert.equal(Provider.billingRequired,false);
  assert.equal(Provider.blazeRequired,false);
  assert.equal(Provider.cloudRunRequired,false);
  assert.equal(Provider.cloudFunctionsRequired,false);
  assert.equal(Provider.canonicalStorageMutation,false);
  assert.equal(Provider.privateInputsSplit,true);

  const h=createHarness();
  let result=await Provider.startWindow({...h.options('playerOne',1_000_000),operationId:op(1),baseRevision:0});
  assert.equal(result.ok,true);assert.equal(result.state.phase,'WINDOW_OPEN');assert.equal(result.revision,1);
  const transferPath=h.key('rivalries',rivalryId,'transferChallenges','season_1');
  const p1Path=h.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerOne');
  const p2Path=h.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerTwo');
  assert.equal(h.store.has(p1Path),false);assert.equal(h.store.has(p2Path),false);

  const beforePeerRead=h.getLog.length;
  result=await Provider.read(h.options('playerTwo',1_000_010));
  assert.equal(result.ok,true);assert.equal(result.state.phase,'WINDOW_OPEN');assert.equal(result.opponentInputs,null);
  assert.equal(h.getLog.slice(beforePeerRead).includes(p1Path),false,'pre-completion peer read must never request opponent private inputs');

  result=await Provider.requestEndWindow({...h.options('playerOne',1_100_000),operationId:op(2),baseRevision:1});
  assert.equal(result.state.phase,'WINDOW_OPEN');
  result=await Provider.requestEndWindow({...h.options('playerTwo',1_100_500),operationId:op(3),baseRevision:2});
  assert.equal(result.state.phase,'GUESS_ENTRY');

  const p1Guesses=[{slot:1,type:'league',valueId:'spain-primera-division'},{slot:2,type:'nationality',valueId:'brazil'}];
  const p2Guesses=[{slot:1,type:'league',valueId:'england-premier-league'},{slot:2,type:'nationality',valueId:'brazil'}];
  result=await Provider.lockGuesses({...h.options('playerOne',1_101_000),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(result.state.phase,'GUESS_ENTRY');assert.deepEqual(h.store.get(p1Path).guesses,p1Guesses);
  result=await Provider.lockGuesses({...h.options('playerTwo',1_102_000),operationId:op(5),baseRevision:4,guesses:p2Guesses});
  assert.equal(result.state.phase,'SIGNING_ENTRY');assert.deepEqual(h.store.get(p2Path).guesses,p2Guesses);

  const beforeSigningRead=h.getLog.length;
  result=await Provider.read(h.options('playerOne',1_102_100));
  assert.equal(result.ok,true);assert.equal(result.state.phase,'SIGNING_ENTRY');assert.equal(result.opponentInputs,null);
  assert.equal(h.getLog.slice(beforeSigningRead).includes(p2Path),false,'signing phase must not fetch opponent guesses');

  const p1Signings=[{slot:1,name:'Player A',leagueId:'england-premier-league',nationalityId:'spain'},{slot:2,name:'Player B',leagueId:'italy-serie-a',nationalityId:'brazil'}];
  const p2Signings=[{slot:1,name:'Player C',leagueId:'spain-primera-division',nationalityId:'england'},{slot:2,name:'Player D',leagueId:'italy-serie-a',nationalityId:'italy'}];
  result=await Provider.lockSignings({...h.options('playerOne',1_103_000),operationId:op(6),baseRevision:5,signings:p1Signings});
  assert.equal(result.state.phase,'SIGNING_ENTRY');assert.deepEqual(h.store.get(p1Path).signings,p1Signings);
  result=await Provider.lockSignings({...h.options('playerTwo',1_104_000),operationId:op(7),baseRevision:6,signings:p2Signings});
  assert.equal(result.state.phase,'COMPLETED');assert.equal(result.needsRefresh,true);assert.deepEqual(h.store.get(p2Path).signings,p2Signings);

  const beforeCompletedRead=h.getLog.length;
  const p1View=await Provider.read(h.options('playerOne',1_104_010));
  assert.equal(p1View.ok,true);assert.equal(p1View.state.phase,'COMPLETED');assert.deepEqual(p1View.opponentInputs.guesses,p2Guesses);assert.deepEqual(p1View.opponentInputs.signings,p2Signings);
  assert.equal(h.getLog.slice(beforeCompletedRead).includes(p2Path),true,'completed read must fetch opponent private inputs for verdicts');
  assert.equal(p1View.verdicts.playerOne[0].release,true);assert.equal(p1View.verdicts.playerOne[1].release,true);assert.equal(p1View.verdicts.playerTwo[0].release,true);assert.equal(p1View.verdicts.playerTwo[1].release,false);
  const p2View=await Provider.read(h.options('playerTwo',1_104_020));
  assert.deepEqual(p2View.verdicts,p1View.verdicts,'both managers must derive identical completed verdicts');

  const stale=await Provider.requestEndWindow({...h.options('playerOne',1_104_030),operationId:op(8),baseRevision:1});
  assert.equal(stale.ok,false);assert.equal(stale.code,'TRANSFER_ALREADY_COMPLETED');
  const publicLedger=h.store.get(transferPath);assert.equal(publicLedger.revision,7);assert.equal(publicLedger.phase,'COMPLETED');assert.deepEqual(publicLedger.actorRoles,['playerOne','playerOne','playerTwo','playerOne','playerTwo','playerOne','playerTwo']);

  const timeout=createHarness();
  let timeoutResult=await Provider.startWindow({...timeout.options('playerOne',2_000_000),operationId:op(20),baseRevision:0});
  timeoutResult=await Provider.advanceExpiredWindow({...timeout.options('playerTwo',2_900_000),operationId:op(21),baseRevision:1});
  assert.equal(timeoutResult.state.phase,'GUESS_ENTRY');assert.equal(timeoutResult.state.endedAtEpochMs,2_900_000);
  const tooEarly=createHarness();
  await Provider.startWindow({...tooEarly.options('playerOne',3_000_000),operationId:op(30),baseRevision:0});
  const early=await Provider.advanceExpiredWindow({...tooEarly.options('playerTwo',3_899_999),operationId:op(31),baseRevision:1});
  assert.equal(early.ok,false);assert.equal(early.code,'TRANSFER_WINDOW_STILL_OPEN');

  console.log('PASS Shared Transfer Challenge Spark provider: exact account/device/rivalry/ACTIVE-session and Career Start prerequisites, split public/private storage, pre-completion opponent-read denial, role-owned writes, 15-minute expiry, CAS and identical post-completion verdicts stay Spark-only with zero local-save mutation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
