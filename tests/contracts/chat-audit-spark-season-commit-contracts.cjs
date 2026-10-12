const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');

// A saved season must still load when Firestore returns identical score fields in another order.
const rivalryId='pair_'+'a'.repeat(64);
const sessionId='session_'+'b'.repeat(64);
const deviceId='device_'+'1'.repeat(32);
const uid1='manager_one',uid2='manager_two';
const hash='sha256:'+'f'.repeat(64);
const resultOp=n=>'season_result_op_'+String(n).repeat(32);
const commitOp='season_commit_op_'+'c'.repeat(32);
const score1={leaguePosition:1,leaguePoints:6,leagueGoals:8,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const score2={leaguePosition:2,leaguePoints:3,leagueGoals:4,domesticCup:false,championsLeague:false,topScorer:false,topAssist:true};
const store=new Map();
const key=(...parts)=>parts.join('/');
const put=(parts,data)=>store.set(key(...parts),data);
const base=['rivalries',rivalryId];
put(['accounts',uid1],{objectType:'account',objectId:uid1,lifecycleState:'live',data:{status:'active'}});
put(['accounts',uid1,'devices',deviceId],{objectType:'device',objectId:deviceId,lifecycleState:'live',data:{deviceId,state:'active'}});
const slots=[{slotId:'playerOne',accountId:uid1,profileId:'profile_'+'1'.repeat(24),saveId:'save_'+'1'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:uid2,profileId:'profile_'+'2'.repeat(24),saveId:'save_'+'2'.repeat(24),entitlementState:'active'}];
put(base,{objectType:'rivalry',objectId:rivalryId,lifecycleState:'live',data:{connectionState:'active',managerSlots:slots,authorizedAccountIds:[uid1,uid2]}});
put([...base,'sessions',sessionId],{objectType:'session',objectId:sessionId,lifecycleState:'live',data:{rivalryId,state:'active',memberAccountIds:[uid1,uid2],hostAccountId:uid1,expiresAt:{millis:10000000}}});
put([...base,'sharedSetup','authoritative'],{schemaVersion:1,objectType:'sharedSetupLedger',rivalryId,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',operationIds:['a','b','c','d','e','f'],operationTypes:['open','commit-league','commit-clubs','commit-length','confirm','confirm'],baseRevisions:[0,1,2,3,4,5],actorRoles:['playerOne','playerOne','playerOne','playerOne','playerOne','playerTwo'],totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],activeSessionId:sessionId,updatedAt:null,updatedByDeviceId:deviceId});
put([...base,'seasonResults','season_1'],{schemaVersion:1,objectType:'sharedSeasonResults',rivalryId,seasonNumber:1,runtimeRevision:'1.9.1-r9',phase:'RESULTS_READY',revision:2,publishedRoles:['playerOne','playerTwo'],operationIds:[resultOp(1),resultOp(2)],operationHashes:[hash,hash],baseRevisions:[0,1],actorRoles:['playerOne','playerTwo']});
for(const [role,op,score] of [['playerOne',resultOp(1),score1],['playerTwo',resultOp(2),score2]]){
  put([...base,'seasonResults','season_1','roles',role],{schemaVersion:1,objectType:'sharedSeasonResultRole',rivalryId,seasonNumber:1,managerRole:role,operationId:op,commandHash:hash,result:score});
}
const commitPath=key(...base,'seasonCommits','season_1');
store.set(commitPath,{schemaVersion:1,objectType:'sharedSeasonCommit',rivalryId,seasonNumber:1,runtimeRevision:'1.9.1-r10',phase:'COMMITTED',revision:1,resultsRevision:2,results:{playerOne:score1,playerTwo:score2},acknowledgedRoles:[],operationIds:[commitOp],operationHashes:[hash],baseRevisions:[0],actorRoles:['playerOne'],activeSessionId:sessionId,updatedAt:null,updatedByDeviceId:deviceId});

const sandbox={TextEncoder,crypto:webcrypto,console};
sandbox.CareerModeSharedShowdownCatalog={catalog:{test_league:['Club A','Club B']}};
sandbox.CareerModeSharedShowdownSetup={createProtocol:async()=>({
  prepareDraw:async({type,operationId})=>({type,operationId}),
  confirmationHash:async()=>hash,
  apply:async({state})=>{const revision=(state?.revision||0)+1;return {ok:true,state:{revision,phase:revision===6?'SHOWDOWN_CONFIRMED':'OPEN',leagueId:'test_league',coordinatorRole:'playerOne'}};}
})};
sandbox.CareerModeSharedSeasonResults={createProtocol:async()=>({verifyState:async state=>state})};
sandbox.CareerModeSharedSeasonCommit={createProtocol:async()=>({verifyState:async state=>state,projectForRole:(state,role)=>({...state,managerRole:role})})};
vm.createContext(sandbox);
const sdk={
  doc:(_db,...parts)=>key(...parts),
  serverTimestamp:()=>null,
  runTransaction:async(_db,handler)=>handler({
    get:async ref=>({exists:()=>store.has(ref),data:()=>{
      // Real Firestore objects belong to the same JS realm as the provider.
      const value=vm.runInContext('('+JSON.stringify(store.get(ref))+')',sandbox);
      if(value?.objectType==='session')value.data.expiresAt.toMillis=()=>value.data.expiresAt.millis;
      return value;
    }}),
    set:()=>{throw Error('read should not write');}
  })
};
sandbox.CareerModeSparkSharedSeasonCommit=undefined;
vm.runInContext(fs.readFileSync('js/sparkSharedSeasonCommit.js','utf8'),sandbox,{filename:'sparkSharedSeasonCommit.js'});
const provider=sandbox.CareerModeSparkSharedSeasonCommit;
const options={firebaseSdk:sdk,firestore:{},cryptoImpl:webcrypto,user:{uid:uid1},rivalryId,sessionId,deviceId,seasonNumber:1,nowEpochMs:1000};
(async()=>{
  const baseline=await provider.read(options);
  assert.equal(baseline.ok,true,'normal saved results must load first: '+JSON.stringify(baseline));
  const saved=store.get(commitPath);
  saved.results={playerOne:Object.fromEntries(Object.entries(score1).reverse()),playerTwo:Object.fromEntries(Object.entries(score2).reverse())};
  const afterRefresh=await provider.read(options);
  assert.equal(afterRefresh.ok,true,'identical saved scores in a different field order must not block the finished season: '+JSON.stringify(afterRefresh));
  assert.equal(afterRefresh.committed,true);
  assert.deepEqual(JSON.parse(JSON.stringify(afterRefresh.results)),{playerOne:score1,playerTwo:score2});
  console.log('PASS season commit remains readable when identical stored score fields are reordered.');
})().catch(error=>{console.error(error);process.exitCode=1;});
