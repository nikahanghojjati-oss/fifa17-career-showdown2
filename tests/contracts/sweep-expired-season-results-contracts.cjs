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

// The store/transaction harness above mirrors the existing provider contract.
// No network, clock timers, or canonical local storage are involved.
(async()=>{
  const expiry=10_000_000;
  const outcomes=[];
  for(const role of ['playerOne','playerTwo']){
    for(const now of [expiry-1,expiry,expiry+1]){
      const h=createHarness();
      const before=JSON.stringify([...h.store],(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item);
      const result=await Provider.read(h.options(role,now));
      outcomes.push({action:'read',role,now,result});
      assert.equal(JSON.stringify([...h.store],(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item),before,'reading Results must not mutate the store');
    }
    for(const now of [expiry-1,expiry,expiry+1]){
      const h=createHarness();
      const before=JSON.stringify([...h.store],(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item);
      const result=await Provider.publishResult({...h.options(role,now),operationId:resultOp(1),baseRevision:0,result:role==='playerOne'?p1Result:p2Result});
      outcomes.push({action:'publish',role,now,result,h,before});
    }
  }
  console.log('Session expiry observations:',JSON.stringify(outcomes.map(({action,role,now,result})=>({action,role,now,ok:result.ok,code:result.code||null}))));
  for(const {action,role,now,result,h,before} of outcomes){
    const label=`${action} ${role} at ${now}`;
    if(now<expiry){
      assert.equal(result.ok,true,`${label}: the session is still authorized immediately before expiry`);
      if(action==='publish'){
        assert.equal(result.revision,1);
        assert.equal(h.store.has(h.key('rivalries',rivalryId,'seasonResults','season_1')),true);
        assert.equal(h.store.has(h.key('rivalries',rivalryId,'seasonResults','season_1','roles',role)),true);
      }
    }else{
      assert.deepEqual(result,{ok:false,code:'SEASON_RESULTS_ACTIVE_SESSION_REQUIRED'},`${label}: at/after expiry must deny Results authority`);
      if(action==='publish'){
        assert.equal(h.store.has(h.key('rivalries',rivalryId,'seasonResults','season_1')),false,'expired publish must not create public Results');
        assert.equal(h.store.has(h.key('rivalries',rivalryId,'seasonResults','season_1','roles',role)),false,'expired publish must not create a private result');
        assert.equal(h.store.has(h.key('rivalries',rivalryId,'sharedSetup','leagueProjection')),false,'expired preflight must not create a league projection');
        assert.equal(JSON.stringify([...h.store],(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item),before,'expired publish must leave every document unchanged');
      }
    }
  }
  console.log('PASS Expired Season Results session: both managers can read/publish just before expiry; at/after expiry both paths require an active session and create no public/private/projection documents.');
})().catch(error=>{console.error(error);process.exitCode=1;});
