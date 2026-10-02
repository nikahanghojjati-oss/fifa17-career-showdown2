const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const Provider=require('../../js/sparkSharedSeasonResults.js');

const rivalryId='pair_'+('a'.repeat(64));
const sessionId='session_'+('b'.repeat(64));
const deviceId='device_'+('1'.repeat(32));
const resultOp=n=>`season_result_op_${Number(n).toString(16).padStart(32,'0')}`;
const result={leaguePosition:1,leaguePoints:100,leagueGoals:120,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const publicPath=`rivalries/${rivalryId}/seasonResults/season_1`;

function snapshot(value){
  return {exists:()=>value!==null&&value!==undefined,data:()=>value};
}

function scriptedSdk({deniedCode='permission-denied',publicDoc=null,rereadError=null,retryResult=null}={}){
  let runCalls=0;
  let getDocCalls=0;
  const sdk={
    doc:(_db,...parts)=>parts.join('/'),
    serverTimestamp:()=>({toMillis:()=>2_000_000}),
    runTransaction:async()=>{
      runCalls+=1;
      if(runCalls===1)return 18; // league-projection preflight
      if(runCalls===2)throw {code:deniedCode};
      if(runCalls===3){
        if(retryResult===null)throw new Error('unexpected transaction retry');
        return retryResult;
      }
      throw new Error('transaction retried more than once');
    },
    getDoc:async ref=>{
      getDocCalls+=1;
      assert.equal(ref,publicPath);
      if(rereadError)throw rereadError;
      return snapshot(publicDoc);
    }
  };
  return {sdk,counts:()=>({runCalls,getDocCalls})};
}

function options(sdk,{uid='manager_one',operationId=resultOp(1),baseRevision=0}={}){
  return {
    user:{uid},
    firestore:{},
    firebaseSdk:sdk,
    rivalryId,
    sessionId,
    deviceId,
    seasonNumber:1,
    operationId,
    baseRevision,
    result,
    cryptoImpl:webcrypto,
    nowEpochMs:2_000_000
  };
}

(async()=>{
  const winnerOp=resultOp(90);
  const loserOp=resultOp(91);
  const race=scriptedSdk({
    deniedCode:'permission-denied',
    publicDoc:{revision:1,operationIds:[winnerOp]}
  });
  let out=await Provider.publishResult(options(race.sdk,{operationId:loserOp,baseRevision:0}));
  assert.deepEqual(out,{ok:false,code:'SEASON_RESULTS_STALE_BASE_REVISION'});
  assert.deepEqual(race.counts(),{runCalls:2,getDocCalls:1},'race loser must re-read once and must not retry the write');

  const stranger=scriptedSdk({
    deniedCode:'firestore/permission-denied',
    publicDoc:null,
    rereadError:{code:'permission-denied'}
  });
  out=await Provider.publishResult(options(stranger.sdk,{uid:'stranger',operationId:resultOp(92),baseRevision:0}));
  assert.deepEqual(out,{ok:false,code:'firestore/permission-denied'});
  assert.deepEqual(stranger.counts(),{runCalls:2,getDocCalls:1},'denied stranger must stay denied after one failed public re-read');

  const ownOp=resultOp(93);
  const replayResult=Object.freeze({ok:true,status:'accepted',replayed:true,revision:1,marker:'existing-idempotent-path'});
  const replay=scriptedSdk({
    deniedCode:'permission-denied',
    publicDoc:{revision:1,operationIds:[ownOp]},
    retryResult:replayResult
  });
  out=await Provider.publishResult(options(replay.sdk,{operationId:ownOp,baseRevision:0}));
  assert.strictEqual(out,replayResult,'own operation must be answered by the existing transaction replay path');
  assert.deepEqual(replay.counts(),{runCalls:3,getDocCalls:1},'own operation may retry the transaction exactly once');

  console.log('PASS shared season results race contracts: stale loser, denied stranger, idempotent replay.');
})().catch(error=>{console.error(error);process.exitCode=1;});
