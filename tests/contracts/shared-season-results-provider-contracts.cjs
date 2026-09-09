const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const Provider=require('../../js/sparkSharedSeasonResults.js');

const rivalryId='pair_'+('a'.repeat(64));
const sessionId='session_'+('b'.repeat(64));
const device1='device_'+('1'.repeat(32));
const device2='device_'+('2'.repeat(32));
const uid1='manager_one';
const uid2='manager_two';
const profile1='profile_'+('1'.repeat(24));
const profile2='profile_'+('2'.repeat(24));
const save1='save_'+('3'.repeat(24));
const save2='save_'+('4'.repeat(24));
const setupOp=n=>`setup_op_${Number(n).toString(16).padStart(32,'0')}`;
const transferOp=n=>`transfer_op_${Number(n).toString(16).padStart(32,'0')}`;
const resultOp=n=>`season_result_op_${Number(n).toString(16).padStart(32,'0')}`;
const hash=n=>`sha256:${Number(n).toString(16).padStart(64,'0')}`;
const ts=millis=>({toMillis:()=>millis});
const p1Result={leaguePosition:1,leaguePoints:100,leagueGoals:120,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const p2Result={leaguePosition:2,leaguePoints:98,leagueGoals:111,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};

function clone(value){
  if(value===undefined)return undefined;
  const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item);
  return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);
}
function createHarness({transferRevision=6}={}){
  const store=new Map(),getLog=[];
  const key=(...parts)=>parts.join('/');
  const put=(path,value)=>store.set(path,clone(value));
  const setupOperationIds=[1,2,3,4,5,6].map(setupOp);
  put(key('accounts',uid1),{objectType:'account',objectId:uid1,lifecycleState:'live',data:{status:'active'}});
  put(key('accounts',uid2),{objectType:'account',objectId:uid2,lifecycleState:'live',data:{status:'active'}});
  put(key('accounts',uid1,'devices',device1),{objectType:'device',objectId:device1,lifecycleState:'live',data:{deviceId:device1,state:'active'}});
  put(key('accounts',uid2,'devices',device2),{objectType:'device',objectId:device2,lifecycleState:'live',data:{deviceId:device2,state:'active'}});
  put(key('rivalries',rivalryId),{objectType:'rivalry',objectId:rivalryId,lifecycleState:'live',data:{connectionState:'active',authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:'playerOne',accountId:uid1,profileId:profile1,saveId:save1,entitlementState:'active'},{slotId:'playerTwo',accountId:uid2,profileId:profile2,saveId:save2,entitlementState:'active'}]}});
  put(key('rivalries',rivalryId,'sessions',sessionId),{objectType:'session',objectId:sessionId,lifecycleState:'live',data:{rivalryId,state:'active',hostAccountId:uid1,memberAccountIds:[uid1,uid2],expiresAt:ts(10_000_000)}});
  put(key('rivalries',rivalryId,'sharedSetup','authoritative'),{schemaVersion:1,objectType:'sharedSetupLedger',rivalryId,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',operationIds:setupOperationIds,operationTypes:['open','commit-league','commit-clubs','commit-length','confirm','confirm'],baseRevisions:[0,1,2,3,4,5],actorRoles:['playerOne','playerOne','playerOne','playerOne','playerOne','playerTwo'],totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],activeSessionId:sessionId,updatedAt:ts(900_000),updatedByDeviceId:device2});
  put(key('rivalries',rivalryId,'careerStart','authoritative'),{schemaVersion:1,objectType:'sharedCareerStart',rivalryId,setupRevision:6,setupOperationIds:[...setupOperationIds],totalSeasons:3,revision:2,phase:'CAREER_START_READY',acknowledgedRoles:['playerOne','playerTwo']});
  const timeout=transferRevision===6;
  const transferTypes=timeout?['start-window','advance-expired-window','lock-guesses','lock-guesses','lock-signings','lock-signings']:['start-window','request-end-window','request-end-window','lock-guesses','lock-guesses','lock-signings','lock-signings'];
  const transferActors=timeout?['playerOne','playerTwo','playerOne','playerTwo','playerOne','playerTwo']:['playerOne','playerOne','playerTwo','playerOne','playerTwo','playerOne','playerTwo'];
  put(key('rivalries',rivalryId,'transferChallenges','season_1'),{schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId,seasonNumber:1,runtimeRevision:'1.9.1-r8',coordinatorRole:'playerOne',phase:'COMPLETED',revision:transferRevision,startedAt:ts(1_000_000),endedAt:ts(1_900_000),endRequestedRoles:timeout?[]:['playerOne','playerTwo'],guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo'],operationIds:Array.from({length:transferRevision},(_,i)=>transferOp(i+1)),operationTypes:transferTypes,operationHashes:Array.from({length:transferRevision},(_,i)=>hash(i+1)),baseRevisions:Array.from({length:transferRevision},(_,i)=>i),actorRoles:transferActors,activeSessionId:sessionId,updatedAt:ts(1_904_000),updatedByDeviceId:device2});
  let serverNow=0;
  const sdk={
    doc:(_db,...parts)=>key(...parts),
    serverTimestamp:()=>ts(serverNow),
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
  const options=(role,now=2_000_000)=>{serverNow=now;return {user:{uid:role==='playerOne'?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==='playerOne'?device1:device2,seasonNumber:1,cryptoImpl:webcrypto,nowEpochMs:now};};
  return {store,getLog,key,options};
}

(async()=>{
  assert.equal(Provider.feature,'ssjr-spark-shared-season-results');
  assert.equal(Provider.runtimeRevision,'1.9.1-r9');
  assert.equal(Provider.billingRequired,false);
  assert.equal(Provider.blazeRequired,false);
  assert.equal(Provider.cloudRunRequired,false);
  assert.equal(Provider.cloudFunctionsRequired,false);
  assert.equal(Provider.canonicalStorageMutation,false);
  assert.equal(Provider.authoritativeScoring,false);
  assert.equal(Provider.privateInputsSplit,true);
  assert.equal(Provider.privateCommandHash,true);
  assert.equal(Provider.publicResultHash,false);
  assert.equal(Provider.repositorySetupCatalog,true);
  assert.equal(Provider.callerTeamCountOverride,false);

  const h=createHarness({transferRevision:6});
  const publicPath=h.key('rivalries',rivalryId,'seasonResults','season_1');
  const p1Path=h.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerOne');
  const p2Path=h.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerTwo');

  let result=await Provider.publishResult({...h.options('playerOne'),operationId:resultOp(1),baseRevision:0,result:p1Result,teamCount:2});
  assert.equal(result.ok,true);assert.equal(result.revision,1);assert.equal(result.state.phase,'COLLECTING');
  assert.equal(h.store.get(publicPath).result,undefined,'public document must never contain manager result payload');
  assert.equal(h.store.get(publicPath).commandHash,undefined,'public document must not leak result-dependent hashes before reveal');
  assert.equal(h.store.get(p1Path).commandHash.startsWith('sha256:'),true);assert.deepEqual(h.store.get(p1Path).result,p1Result);assert.equal(h.store.has(p2Path),false);

  const beforeP2Read=h.getLog.length;
  result=await Provider.read(h.options('playerTwo',2_000_010));
  assert.equal(result.ok,true);assert.equal(result.ownResult,null);assert.equal(result.opponentResult,null);assert.equal(result.allResults,null);
  assert.equal(h.getLog.slice(beforeP2Read).includes(p1Path),false,'opponent private result must not be fetched before both publish');

  const stale=await Provider.publishResult({...h.options('playerTwo',2_000_020),operationId:resultOp(2),baseRevision:0,result:p2Result});
  assert.equal(stale.ok,false);assert.equal(stale.code,'SEASON_RESULTS_STALE_BASE_REVISION');
  const duplicateRole=await Provider.publishResult({...h.options('playerOne',2_000_030),operationId:resultOp(3),baseRevision:1,result:p1Result});
  assert.equal(duplicateRole.ok,false);assert.equal(duplicateRole.code,'SEASON_RESULTS_ROLE_ALREADY_PUBLISHED');
  const replay=await Provider.publishResult({...h.options('playerOne',2_000_040),operationId:resultOp(1),baseRevision:0,result:p1Result});
  assert.equal(replay.ok,true);assert.equal(replay.replayed,true);assert.equal(replay.revision,1);
  const conflict=await Provider.publishResult({...h.options('playerTwo',2_000_050),operationId:resultOp(1),baseRevision:0,result:p2Result});
  assert.equal(conflict.ok,false);assert.equal(conflict.code,'SEASON_RESULTS_IDEMPOTENCY_CONFLICT');

  result=await Provider.publishResult({...h.options('playerTwo',2_000_060),operationId:resultOp(2),baseRevision:1,result:p2Result});
  assert.equal(result.ok,true);assert.equal(result.revision,2);assert.equal(result.state.phase,'RESULTS_READY');assert.equal(result.needsRefresh,true);
  const beforeReadyRead=h.getLog.length;
  const p1View=await Provider.read(h.options('playerOne',2_000_070));
  assert.equal(p1View.ok,true);assert.deepEqual(p1View.ownResult,p1Result);assert.deepEqual(p1View.opponentResult,p2Result);assert.deepEqual(p1View.allResults,{playerOne:p1Result,playerTwo:p2Result});
  assert.equal(h.getLog.slice(beforeReadyRead).includes(p2Path),true,'opponent private result is fetched only after RESULTS_READY');
  const p2View=await Provider.read(h.options('playerTwo',2_000_080));
  assert.deepEqual(p2View.allResults,{playerTwo:p2Result,playerOne:p1Result});

  const forgedCount=createHarness({transferRevision:7});
  const invalidPosition=await Provider.publishResult({...forgedCount.options('playerOne'),operationId:resultOp(10),baseRevision:0,result:{...p1Result,leaguePosition:21},teamCount:30});
  assert.equal(invalidPosition.ok,false);assert.equal(invalidPosition.code,'SEASON_RESULTS_POSITION_INVALID','caller teamCount override must not widen repository league authority');

  const inactive=createHarness();
  inactive.store.set(inactive.key('accounts',uid1,'devices',device1),{objectType:'device',objectId:device1,lifecycleState:'live',data:{deviceId:device1,state:'revoked'}});
  const denied=await Provider.publishResult({...inactive.options('playerOne'),operationId:resultOp(11),baseRevision:0,result:p1Result});
  assert.equal(denied.ok,false);assert.equal(denied.code,'SEASON_RESULTS_DEVICE_INACTIVE');

  const incomplete=createHarness();
  const transferPath=incomplete.key('rivalries',rivalryId,'transferChallenges','season_1');
  incomplete.store.set(transferPath,{...incomplete.store.get(transferPath),phase:'SIGNING_ENTRY',signingLockedRoles:['playerOne']});
  const blocked=await Provider.publishResult({...incomplete.options('playerOne'),operationId:resultOp(12),baseRevision:0,result:p1Result});
  assert.equal(blocked.ok,false);assert.equal(blocked.code,'SEASON_RESULTS_TRANSFER_NOT_COMPLETE');

  const tampered=createHarness({transferRevision:7});
  await Provider.publishResult({...tampered.options('playerOne'),operationId:resultOp(20),baseRevision:0,result:p1Result});
  const tamperedPath=tampered.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerOne');
  tampered.store.get(tamperedPath).result.leagueGoals=121;
  const tamperedRead=await Provider.read(tampered.options('playerOne',2_000_100));
  assert.equal(tamperedRead.ok,false);assert.equal(tamperedRead.code,'SEASON_RESULTS_PRIVATE_STATE_INVALID','private command hash must bind the stored seven-field result even when a tampered value is individually in range');

  console.log('PASS Shared Season Results Spark provider: exact account/device/rivalry/ACTIVE-session/setup/Career Start/completed Transfer Challenge prerequisites, repository-derived league team count, split public/private result storage, result-dependent hashes kept private until reveal, pre-ready opponent-read denial, role-owned immutable publication, CAS/idempotency, timeout and early-end transfer completion compatibility, private payload integrity, Spark-only zero billing and zero canonical Save mutation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
