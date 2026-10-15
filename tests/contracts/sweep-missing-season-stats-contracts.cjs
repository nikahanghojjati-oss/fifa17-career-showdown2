// CARD-HUNT-A15-1: standalone copy of the existing in-memory provider fixture.
const assert=require('node:assert/strict');
const test=require('node:test');
const Factory=require('../../js/sharedSeasonResults.js');
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

const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,totalSeasons:1,confirmedRoles:['playerOne','playerTwo']};
const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
const transferChallenge={phase:'COMPLETED',seasonNumber:1,revision:7};
const result=(overrides={})=>({...p1Result,...overrides});
const command=(n,resultValue)=>({type:'publish-result',operationId:resultOp(n),baseRevision:0,result:resultValue});
const run=(protocol,n,resultValue)=>protocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:'playerOne',command:command(n,resultValue)});
const zeroResult=result({leaguePoints:0,leagueGoals:0});
const paths=h=>({
  public:h.key('rivalries',rivalryId,'seasonResults','season_1'),
  own:h.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerOne'),
  opponent:h.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerTwo')
});

for(const [field,code] of [['leaguePoints','SEASON_RESULTS_POINTS_INVALID'],['leagueGoals','SEASON_RESULTS_GOALS_INVALID']]){
  for(const value of [null,'']){
    const label=`${field}=${JSON.stringify(value)}`;
    test(`protocol rejects absent ${label}`,async()=>{
      const protocol=await Factory.createProtocol({teamCount:20,cryptoImpl:webcrypto});
      await assert.rejects(run(protocol,90,result({[field]:value})),error=>error?.code===code,`${label} must not become zero`);
    });
    test(`provider rejects absent ${label} without writing Season Results`,async()=>{
      const h=createHarness(),p=paths(h);
      const published=await Provider.publishResult({...h.options('playerOne'),operationId:resultOp(91),baseRevision:0,result:result({[field]:value})});
      // Check persisted documents first: accepting an absent stat must never create authority.
      assert.equal(h.store.has(p.public),false,`${label} must not write a public Season Result`);
      assert.equal(h.store.has(p.own),false,`${label} must not write a private Season Result`);
      assert.equal(h.store.has(p.opponent),false);
      assert.equal(published.ok,false);
      assert.equal(published.code,code);
    });
    test(`private reader rejects persisted ${label} even with a hash-valid zero`,async()=>{
      const h=createHarness(),p=paths(h);
      const published=await Provider.publishResult({...h.options('playerOne'),operationId:resultOp(92),baseRevision:0,result:zeroResult});
      assert.equal(published.ok,true,'numeric zero fixture must publish');
      assert.deepEqual((await Provider.read(h.options('playerOne'))).ownResult,zeroResult);
      const stored=h.store.get(p.own),originalHash=stored.commandHash;
      stored.result[field]=value;
      assert.equal(stored.commandHash,originalHash,'retain the real numeric-zero command hash');
      const read=await Provider.read(h.options('playerOne'));
      assert.equal(read.ok,false,`${label} must not be accepted as hash-valid zero`);
      assert.equal(read.code,'SEASON_RESULTS_PRIVATE_STATE_INVALID');
    });
  }
}

test('protocol preserves explicit numeric zeros and 20-club maxima',async()=>{
  const protocol=await Factory.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  for(const [n,stats] of [[100,{leaguePoints:0,leagueGoals:0}],[101,{leaguePoints:114,leagueGoals:300}]]){
    const applied=await run(protocol,n,result(stats));
    assert.equal(applied.ok,true);
    assert.equal(applied.state.phase,'COLLECTING');
    assert.deepEqual(applied.state.results.playerOne,result(stats));
  }
});

test('provider preserves numeric zero, private opponent results, and two-manager reveal',async()=>{
  const h=createHarness(),p=paths(h);
  const published=await Provider.publishResult({...h.options('playerOne'),operationId:resultOp(102),baseRevision:0,result:zeroResult});
  assert.equal(published.ok,true);
  assert.equal(published.state.phase,'COLLECTING');
  assert.deepEqual(h.store.get(p.own).result,zeroResult);
  assert.equal(h.store.get(p.public).result,undefined);
  assert.equal(h.store.get(p.public).commandHash,undefined);
  const before=h.getLog.length;
  const waiting=await Provider.read(h.options('playerTwo'));
  assert.equal(waiting.ok,true);
  assert.equal(waiting.ownResult,null);
  assert.equal(waiting.opponentResult,null);
  assert.equal(waiting.allResults,null);
  assert.equal(h.getLog.slice(before).includes(p.own),false,'no opponent private fetch before both publish');
  const second=await Provider.publishResult({...h.options('playerTwo'),operationId:resultOp(103),baseRevision:1,result:p2Result});
  assert.equal(second.ok,true);
  assert.equal(second.state.phase,'RESULTS_READY');
  for(const role of ['playerOne','playerTwo']){
    const ready=await Provider.read(h.options(role));
    assert.equal(ready.ok,true);
    assert.deepEqual(ready.allResults,{playerOne:zeroResult,playerTwo:p2Result});
  }
});

