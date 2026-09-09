const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');

const resolvedSetup={
  phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,
  confirmedRoles:['playerOne','playerTwo'],leagueId:'bundesliga',
  clubs:{playerOne:'Bayern Munich',playerTwo:'Borussia Dortmund'}
};
const setupModulePath=require.resolve('../../js/sparkSharedShowdownSetup.js');
require(setupModulePath);
const setupCache=require.cache[setupModulePath];
const realSetupExports=setupCache.exports;
setupCache.exports={read:async()=>({ok:true,state:resolvedSetup})};
const Provider=require('../../js/sparkSharedSeasonResults.js');
setupCache.exports=realSetupExports;

const rivalryId='pair_'+('c'.repeat(64));
const sessionId='session_'+('d'.repeat(64));
const device1='device_'+('3'.repeat(32));
const device2='device_'+('4'.repeat(32));
const uid1='season_manager_one';
const uid2='season_manager_two';
const op=n=>`season_result_op_${Number(n).toString(16).padStart(32,'0')}`;
const ts=millis=>({toMillis:()=>millis});
const result=(overrides={})=>({
  leaguePosition:2,leaguePoints:85,leagueGoals:77,
  domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,
  ...overrides
});
function clone(value){
  if(value===undefined)return undefined;
  const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item);
  return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);
}

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
  put(key('rivalries',rivalryId,'sharedSetup','authoritative'),{schemaVersion:1,objectType:'sharedSetupLedger',rivalryId,revision:6,phase:'SHOWDOWN_CONFIRMED',totalSeasons:3,confirmedRoles:['playerOne','playerTwo']});
  put(key('rivalries',rivalryId,'careerStart','authoritative'),{schemaVersion:1,objectType:'sharedCareerStart',rivalryId,setupRevision:6,totalSeasons:3,revision:2,phase:'CAREER_START_READY',acknowledgedRoles:['playerOne','playerTwo']});
  const putTransfer=seasonNumber=>put(key('rivalries',rivalryId,'transferChallenges',`season_${seasonNumber}`),{schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId,seasonNumber,runtimeRevision:'1.9.1-r8',phase:'COMPLETED',guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']});
  putTransfer(1);
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
      const output=await callback(transaction);
      pending.forEach(([ref,value])=>store.set(ref,value));
      return output;
    }
  };
  const options=(role,seasonNumber=1,nowEpochMs=1_000_000)=>{
    nowForServerTimestamp=nowEpochMs;
    return {user:{uid:role==='playerOne'?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==='playerOne'?device1:device2,seasonNumber,cryptoImpl:webcrypto,nowEpochMs};
  };
  return {store,getLog,key,put,putTransfer,options};
}

(async()=>{
  assert.equal(Provider.feature,'ssjr-spark-shared-season-results');
  assert.equal(Provider.runtimeRevision,'1.9.1-r9');
  assert.equal(Provider.billingRequired,false);
  assert.equal(Provider.blazeRequired,false);
  assert.equal(Provider.cloudRunRequired,false);
  assert.equal(Provider.cloudFunctionsRequired,false);
  assert.equal(Provider.canonicalStorageMutation,false);
  assert.equal(Provider.privateResultsSplit,true);
  assert.equal(Provider.repositoryTeamCount,true);
  assert.equal(Provider.callerTeamCountOverride,false);

  const h=createHarness();
  const publicPath=h.key('rivalries',rivalryId,'seasonResults','season_1');
  const p1Path=h.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerOne');
  const p2Path=h.key('rivalries',rivalryId,'seasonResults','season_1','roles','playerTwo');

  const forgedTeamCount=await Provider.submit({...h.options('playerOne',1,1_000_000),operationId:op(1),baseRevision:0,teamCount:20,result:result({leaguePosition:19})});
  assert.equal(forgedTeamCount.ok,false);
  assert.equal(forgedTeamCount.code,'SEASON_RESULT_POSITION_INVALID','Bundesliga team count must come from the repository catalog, not caller override');
  assert.equal(h.store.has(publicPath),false);
  assert.equal(h.store.has(p1Path),false);

  const p1Result=result({leaguePosition:1,leaguePoints:101,leagueGoals:103,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
  let accepted=await Provider.submit({...h.options('playerOne',1,1_010_000),operationId:op(2),baseRevision:0,result:p1Result});
  assert.equal(accepted.ok,true);assert.equal(accepted.replayed,false);assert.equal(accepted.revision,1);assert.equal(accepted.state.phase,'RESULT_ENTRY');
  assert.deepEqual(h.store.get(p1Path).result,p1Result);
  assert.equal(h.store.has(p2Path),false);
  const firstPublic=h.store.get(publicPath);
  assert.equal(firstPublic.phase,'RESULT_ENTRY');assert.deepEqual(firstPublic.submittedRoles,['playerOne']);
  assert.equal(Object.hasOwn(firstPublic,'result'),false,'public Season Results ledger must not contain raw manager results');

  const beforePeerRead=h.getLog.length;
  const waiting=await Provider.read(h.options('playerTwo',1,1_010_100));
  assert.equal(waiting.ok,true);assert.equal(waiting.revision,1);assert.equal(waiting.ownResult,null);assert.equal(waiting.opponentResult,null);assert.equal(waiting.scoring,null);assert.equal(waiting.winner,null);
  assert.equal(h.getLog.slice(beforePeerRead).includes(p1Path),false,'pre-completion peer read must not fetch opponent private result');

  const replay=await Provider.submit({...h.options('playerOne',1,1_010_200),operationId:op(2),baseRevision:0,result:p1Result});
  assert.equal(replay.ok,true);assert.equal(replay.replayed,true);assert.equal(replay.revision,1);
  const duplicateRole=await Provider.submit({...h.options('playerOne',1,1_010_300),operationId:op(3),baseRevision:1,result:p1Result});
  assert.equal(duplicateRole.ok,false);assert.equal(duplicateRole.code,'SEASON_RESULT_ALREADY_SUBMITTED');
  const stale=await Provider.submit({...h.options('playerTwo',1,1_010_400),operationId:op(4),baseRevision:0,result:result()});
  assert.equal(stale.ok,false);assert.equal(stale.code,'SEASON_RESULT_STALE_BASE_REVISION');

  const p2Result=result({leaguePosition:3,leaguePoints:90,leagueGoals:95,domesticCup:true,topAssist:true});
  accepted=await Provider.submit({...h.options('playerTwo',1,1_020_000),operationId:op(5),baseRevision:1,result:p2Result});
  assert.equal(accepted.ok,true);assert.equal(accepted.revision,2);assert.equal(accepted.state.phase,'COMPLETED');assert.equal(accepted.needsRefresh,true);
  assert.deepEqual(h.store.get(p2Path).result,p2Result);
  const completedPublic=h.store.get(publicPath);
  assert.equal(completedPublic.phase,'COMPLETED');assert.deepEqual(completedPublic.submittedRoles,['playerOne','playerTwo']);assert.equal(Object.hasOwn(completedPublic,'results'),false);

  const beforeCompletedRead=h.getLog.length;
  const p1View=await Provider.read(h.options('playerOne',1,1_020_100));
  assert.equal(p1View.ok,true);assert.deepEqual(p1View.ownResult,p1Result);assert.deepEqual(p1View.opponentResult,p2Result);assert.equal(p1View.winner,'playerOne');assert.equal(p1View.finalRecord.playerOne.scoring.total,11);
  assert.equal(h.getLog.slice(beforeCompletedRead).includes(p2Path),true,'completed read must fetch opponent private result');
  const p2View=await Provider.read(h.options('playerTwo',1,1_020_200));
  assert.deepEqual(p2View.scoring,p1View.scoring,'both managers must derive identical completed scoring');
  assert.equal(p2View.winner,p1View.winner,'both managers must derive identical completed winner');
  assert.deepEqual(p2View.finalRecord,p1View.finalRecord,'both managers must derive one identical final season record');

  const incomplete=createHarness();
  incomplete.put(incomplete.key('rivalries',rivalryId,'transferChallenges','season_1'),{schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId,seasonNumber:1,runtimeRevision:'1.9.1-r8',phase:'SIGNING_ENTRY',guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne']});
  const blockedTransfer=await Provider.submit({...incomplete.options('playerOne',1,2_000_000),operationId:op(10),baseRevision:0,result:result()});
  assert.equal(blockedTransfer.ok,false);assert.equal(blockedTransfer.code,'SEASON_RESULT_TRANSFER_NOT_COMPLETE');

  const expired=createHarness();
  expired.put(expired.key('rivalries',rivalryId,'sessions',sessionId),{objectType:'session',objectId:sessionId,lifecycleState:'live',data:{rivalryId,state:'active',memberAccountIds:[uid1,uid2],expiresAt:ts(100)}});
  const blockedSession=await Provider.submit({...expired.options('playerOne',1,200),operationId:op(11),baseRevision:0,result:result()});
  assert.equal(blockedSession.ok,false);assert.equal(blockedSession.code,'SEASON_RESULT_ACTIVE_SESSION_REQUIRED');

  const later=createHarness();
  later.putTransfer(2);
  let laterAttempt=await Provider.submit({...later.options('playerOne',2,3_000_000),operationId:op(20),baseRevision:0,result:result({leaguePosition:4})});
  assert.equal(laterAttempt.ok,false);assert.equal(laterAttempt.code,'SEASON_RESULT_PREVIOUS_SEASON_REQUIRED');
  later.put(later.key('rivalries',rivalryId,'seasonResults','season_1'),{schemaVersion:1,objectType:'sharedSeasonResults',rivalryId,seasonNumber:1,runtimeRevision:'1.9.1-r9',phase:'COMPLETED',revision:2});
  laterAttempt=await Provider.submit({...later.options('playerOne',2,3_010_000),operationId:op(21),baseRevision:0,result:result({leaguePosition:4})});
  assert.equal(laterAttempt.ok,true);assert.equal(laterAttempt.revision,1);assert.equal(laterAttempt.seasonNumber,2);
  const beyond=await Provider.submit({...later.options('playerTwo',4,3_020_000),operationId:op(22),baseRevision:0,result:result()});
  assert.equal(beyond.ok,false);assert.equal(beyond.code,'SEASON_RESULT_SEASON_INVALID');

  console.log('PASS Shared Season Results Spark provider: exact account/device/rivalry/ACTIVE-session plus confirmed setup, Career Start, completed Transfer Challenge and prior-season prerequisites; repository-derived league team count rejects caller widening; each manager writes one role-private seven-field result; pre-completion opponent reads are denied; public ledger contains metadata only; CAS/replay and immutable submissions fail closed; both managers derive identical completed scoring and final season record with zero billing and zero canonical local-save mutation.');
})().catch(error=>{console.error(error);process.exitCode=1;});