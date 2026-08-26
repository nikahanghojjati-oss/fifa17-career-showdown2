const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const connected=require("../../js/sparkConnectedRivalry.js");

function snapshot(value){
  return {exists:()=>value!==null&&value!==undefined,data:()=>structuredClone(value)};
}

function fixture(){
  const rivalryId=`pair_${"e".repeat(64)}`;
  const deviceId=`device_${"d".repeat(32)}`;
  const saveId="save_222222222222222222222222";
  const creatorSaveId="save_111111111111111111111111";
  const p1="profile_aaaaaaaaaaaaaaaaaaaaaaaa";
  const p2="profile_bbbbbbbbbbbbbbbbbbbbbbbb";
  const binding={saveId,profileId:p2,managerRole:"playerTwo",displayLabel:"Rival"};
  const device={
    schemaVersion:1,objectType:"device",objectId:deviceId,revision:0,parentRevision:null,lifecycleState:"live",
    contentHash:`sha256:${"2".repeat(64)}`,priorContentHash:null,updatedAt:null,updatedByAccountId:"acct_b",updatedByDeviceId:deviceId,
    data:{deviceId,state:"active"},tombstone:null
  };
  const rivalry={
    schemaVersion:1,objectType:"rivalry",objectId:rivalryId,revision:1,parentRevision:0,lifecycleState:"live",
    contentHash:`sha256:${"3".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:null,updatedByAccountId:"acct_b",updatedByDeviceId:deviceId,
    data:{
      connectionState:"active",
      managerSlots:[
        {slotId:"playerOne",accountId:"acct_a",profileId:p1,saveId:creatorSaveId,displayLabel:"Hawk",entitlementState:"active",deletionConsent:false},
        {slotId:"playerTwo",accountId:"acct_b",profileId:p2,saveId,displayLabel:"Rival",entitlementState:"active",deletionConsent:false}
      ],
      authorizedAccountIds:["acct_a","acct_b"],
      createdByAccountId:"acct_a",
      createdAt:null
    },
    tombstone:null
  };
  const library={
    schemaVersion:1,
    activeSaveId:saveId,
    profiles:[{schemaVersion:1,profileId:p1,displayName:"Hawk"},{schemaVersion:1,profileId:p2,displayName:"Rival"}],
    saves:[{
      saveId,
      showdown:{
        id:"local-network-fixture",status:"Ready",currentRound:2,totalRounds:3,
        managers:{playerOne:"Hawk",playerTwo:"Rival"},
        identity:{schemaVersion:1,saveId,managerProfileIds:{playerOne:p1,playerTwo:p2}},
        rounds:[
          {roundNumber:1,seasonId:"season_111111111111111111111111",winner:"playerOne"},
          {roundNumber:2,seasonId:"season_222222222222222222222222",winner:null}
        ]
      }
    }]
  };
  const saveRuntime={isReady:()=>true,getLibrarySnapshot:()=>library};
  return {rivalryId,deviceId,binding,device,rivalry,library,saveRuntime};
}

function networkError(){
  const error=new Error("Synthetic adverse network outage");
  error.code="unavailable";
  return error;
}

function sdk(runTransaction){
  return {
    Timestamp:{fromMillis(value){return {toMillis:()=>value};}},
    doc(_firestore,...parts){return {path:parts.join("/")};},
    runTransaction
  };
}

(async()=>{
  const f=fixture();
  const common={
    user:{uid:"acct_b"},
    firestore:{name:"memory-only-firestore"},
    binding:f.binding,
    rivalryId:f.rivalryId,
    deviceId:f.deviceId,
    cryptoImpl:crypto.webcrypto
  };

  const immediateSdk=sdk(async()=>{throw networkError();});
  const read=await connected.readSharedState({...common,firebaseSdk:immediateSdk});
  assert.equal(read.ok,false);
  assert.equal(read.code,"unavailable","Provider network errors must remain distinguishable from authorization/conflict errors.");

  const attach=await connected.attachRivalry({...common,firebaseSdk:immediateSdk,indexedDBImpl:null});
  assert.equal(attach.ok,false);
  assert.equal(attach.code,"unavailable");

  const before=JSON.stringify(f.library);
  let transactionCalls=0;
  const publishSdk=sdk(async(_firestore,callback)=>{
    transactionCalls+=1;
    if(transactionCalls===1){
      return callback({
        async get(ref){
          if(ref.path===`accounts/acct_b/devices/${f.deviceId}`)return snapshot(f.device);
          if(ref.path===`rivalries/${f.rivalryId}`)return snapshot(f.rivalry);
          throw new Error(`Unexpected preflight read ${ref.path}`);
        }
      });
    }
    throw networkError();
  });

  const publish=await connected.publishSharedState({
    ...common,
    firebaseSdk:publishSdk,
    expectedStateExists:false,
    baseRevision:0,
    idempotencyKey:"adverse-network-first-publish",
    saveRuntime:f.saveRuntime
  });
  assert.equal(transactionCalls,2,"Adverse-network proof must fail after legitimate device/rivalry preflight and immutable local projection planning, not before authorization is exercised.");
  assert.equal(publish.ok,false);
  assert.equal(publish.code,"unavailable");
  assert.equal(JSON.stringify(f.library),before,"A provider failure after publish preflight must not mutate the canonical local Save Library snapshot.");

  const source=require("node:fs").readFileSync("js/sparkConnectedRivalry.js","utf8");
  assert.match(source,/status:\"refresh-error\"[\s\S]*Local saves remain available/);
  assert.match(source,/status:error&&error\.code===\"STALE_BASE_REVISION\"\?\"conflict\":\"publish-error\"[\s\S]*Local saves were not changed/);

  process.stdout.write("PASS Stage 4 adverse-network safety: attach/read fail bounded, publish can lose provider connectivity after authorized preflight without mutating canonical local saves, and retry-visible UI preserves local-first recovery authority\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
