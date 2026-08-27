const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc
}=require("firebase/firestore");
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
const connected=require("../../js/sparkConnectedRivalry.js");

const PROJECT_ID="demo-career-mode-showdown-stage4";
const RULES=fs.readFileSync("firestore.spark.rules","utf8");
const ACCOUNT_A="acct_rate_a";
const ACCOUNT_B="acct_rate_b";
const DEVICE_A=`device_${"a".repeat(32)}`;
const INSTALL_A=`installation_${"a".repeat(32)}`;
const RIVALRY_ID=`pair_${"f".repeat(64)}`;
const A_BINDING=Object.freeze({
  saveId:`save_${"1".repeat(24)}`,
  profileId:`profile_${"1".repeat(24)}`,
  managerRole:"playerOne",
  displayLabel:"Hawk"
});
const B_BINDING=Object.freeze({
  saveId:`save_${"2".repeat(24)}`,
  profileId:`profile_${"2".repeat(24)}`,
  managerRole:"playerTwo",
  displayLabel:"Rival"
});

function sdk(){return {Timestamp,serverTimestamp,doc,runTransaction};}
function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}
function rawKeyHash(value){return crypto.createHash("sha256").update(String(value)).digest("hex");}
function canonicalize(value){
  if(value===undefined||value===null)return null;
  if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
  if(value instanceof Date)return {$timestamp:value.getTime()};
  if(Array.isArray(value))return value.map(canonicalize);
  if(typeof value==="object"){
    const output={};
    for(const key of Object.keys(value).sort())output[key]=canonicalize(value[key]);
    return output;
  }
  return value;
}
function sha256(value){
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex")}`;
}
function rootEnvelope({objectType,objectId,revision=0,parentRevision=null,priorContentHash=null,updatedAt,updatedByAccountId,updatedByDeviceId,data,contentHash=hash("a")}){
  return {
    schemaVersion:1,
    objectType,
    objectId,
    revision,
    parentRevision,
    lifecycleState:"live",
    contentHash,
    priorContentHash,
    updatedAt,
    updatedByAccountId,
    updatedByDeviceId,
    data,
    tombstone:null
  };
}
function accountEnvelope(uid,now){
  return rootEnvelope({
    objectType:"account",objectId:uid,updatedAt:now,updatedByAccountId:uid,updatedByDeviceId:null,
    data:{status:"active",createdAt:now,deletionRequestedAt:null}
  });
}
function deviceEnvelope(now){
  return rootEnvelope({
    objectType:"device",objectId:DEVICE_A,updatedAt:now,updatedByAccountId:ACCOUNT_A,updatedByDeviceId:DEVICE_A,
    data:{deviceId:DEVICE_A,installationId:INSTALL_A,displayLabel:"Rate limit proof",state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null}
  });
}
function rivalryEnvelope(now){
  return rootEnvelope({
    objectType:"rivalry",objectId:RIVALRY_ID,revision:1,parentRevision:0,priorContentHash:hash("b"),updatedAt:now,updatedByAccountId:ACCOUNT_B,updatedByDeviceId:DEVICE_A,
    data:{
      connectionState:"active",
      connectionStateBeforeDeletion:null,
      managerSlots:[
        {slotId:"playerOne",accountId:ACCOUNT_A,profileId:A_BINDING.profileId,saveId:A_BINDING.saveId,displayLabel:"Hawk",entitlementState:"active",deletionConsent:false},
        {slotId:"playerTwo",accountId:ACCOUNT_B,profileId:B_BINDING.profileId,saveId:B_BINDING.saveId,displayLabel:"Rival",entitlementState:"active",deletionConsent:false}
      ],
      authorizedAccountIds:[ACCOUNT_A,ACCOUNT_B],
      createdByAccountId:ACCOUNT_A,
      createdAt:now
    }
  });
}
function trackedSaveRuntime(){
  const snapshot={
    schemaVersion:1,
    activeSaveId:A_BINDING.saveId,
    profiles:[
      {schemaVersion:1,profileId:A_BINDING.profileId,displayName:"Hawk"},
      {schemaVersion:1,profileId:B_BINDING.profileId,displayName:"Rival"}
    ],
    saves:[{
      saveId:A_BINDING.saveId,
      showdown:{
        id:"rate-limit-local",
        status:"Ready",
        currentRound:1,
        totalRounds:1,
        managers:{playerOne:"Hawk",playerTwo:"Rival"},
        identity:{schemaVersion:1,saveId:A_BINDING.saveId,managerProfileIds:{playerOne:A_BINDING.profileId,playerTwo:B_BINDING.profileId}},
        rounds:[{roundNumber:1,seasonId:`season_${"3".repeat(24)}`,winner:null}]
      }
    }]
  };
  return {
    isReady:()=>true,
    getLibrarySnapshot:()=>structuredClone(snapshot),
    inspect:()=>structuredClone(snapshot)
  };
}
async function adminState(testEnv){
  let value=null;
  await testEnv.withSecurityRulesDisabled(async context=>{
    const snap=await getDoc(doc(context.firestore(),"rivalries",RIVALRY_ID,"state","authoritative"));
    value=snap.exists()?snap.data():null;
  });
  return value;
}
async function adminSetStateTime(testEnv,millis){
  await testEnv.withSecurityRulesDisabled(async context=>{
    const ref=doc(context.firestore(),"rivalries",RIVALRY_ID,"state","authoritative");
    const snap=await getDoc(ref);
    assert.equal(snap.exists(),true);
    await setDoc(ref,{...snap.data(),updatedAt:Timestamp.fromMillis(millis)});
  });
}
async function adminReceiptIds(testEnv){
  let ids=[];
  await testEnv.withSecurityRulesDisabled(async context=>{
    const snap=await getDocs(collection(context.firestore(),"rivalries",RIVALRY_ID,"state","authoritative","idempotency"));
    ids=snap.docs.map(item=>item.id).sort();
  });
  return ids;
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext(ACCOUNT_A).firestore();
    const now=Date.now();
    const rivalry=rivalryEnvelope(Timestamp.fromMillis(now-10000));
    const localRuntime=trackedSaveRuntime();
    const localBefore=localRuntime.inspect();
    const projection=connected.buildProjection(rivalry,A_BINDING,localRuntime);
    const seededData={
      ...projection,
      mutationReceipt:{idempotencyKeyHash:"0".repeat(64),requestFingerprint:hash("c"),baseRevision:2}
    };
    const futureAnchor=Timestamp.fromMillis(now+60000);
    const seededState=rootEnvelope({
      objectType:"sharedState",
      objectId:RIVALRY_ID,
      revision:3,
      parentRevision:2,
      priorContentHash:hash("d"),
      updatedAt:futureAnchor,
      updatedByAccountId:ACCOUNT_A,
      updatedByDeviceId:DEVICE_A,
      data:seededData,
      contentHash:sha256({objectType:"sharedState",objectId:RIVALRY_ID,revision:3,data:seededData})
    });

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const stamp=Timestamp.fromMillis(now-10000);
      await setDoc(doc(db,"accounts",ACCOUNT_A),accountEnvelope(ACCOUNT_A,stamp));
      await setDoc(doc(db,"accounts",ACCOUNT_B),accountEnvelope(ACCOUNT_B,stamp));
      await setDoc(doc(db,"accounts",ACCOUNT_A,"devices",DEVICE_A),deviceEnvelope(stamp));
      await setDoc(doc(db,"rivalries",RIVALRY_ID),rivalry);
      await setDoc(doc(db,"rivalries",RIVALRY_ID,"state","authoritative"),seededState);
    });

    const blockedKey="stage4-rate-limit-blocked-before-window";
    const blocked=await connected.publishSharedState({
      user:{uid:ACCOUNT_A},firestore:dbA,firebaseSdk:sdk(),deviceId:DEVICE_A,
      binding:A_BINDING,rivalryId:RIVALRY_ID,expectedStateExists:true,baseRevision:3,
      idempotencyKey:blockedKey,saveRuntime:localRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now
    });
    assert.equal(blocked.ok,false,JSON.stringify(blocked));
    assert.equal(blocked.code,"permission-denied","A sustained distinct revision must be denied while the server-time cooldown is closed.");
    assert.equal((await adminState(testEnv)).revision,3);
    assert.deepEqual(await adminReceiptIds(testEnv),[],"Denied rate-limited mutation must allocate no receipt.");
    assert.deepEqual(localRuntime.inspect(),localBefore,"Denied remote mutation must not mutate canonical local Save Library state.");

    await adminSetStateTime(testEnv,Date.now()-5000);
    const acceptedKey="stage4-rate-limit-accepted-after-window";
    const clientClock=Date.now()-60000;
    const accepted=await connected.publishSharedState({
      user:{uid:ACCOUNT_A},firestore:dbA,firebaseSdk:sdk(),deviceId:DEVICE_A,
      binding:A_BINDING,rivalryId:RIVALRY_ID,expectedStateExists:true,baseRevision:3,
      idempotencyKey:acceptedKey,saveRuntime:localRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:clientClock
    });
    assert.equal(accepted.ok,true,JSON.stringify(accepted));
    assert.equal(accepted.status,"accepted");
    assert.equal(accepted.revision,4);
    const state4=await adminState(testEnv);
    assert.equal(state4.revision,4);
    const serverMillis=state4.updatedAt.toMillis();
    assert.ok(Math.abs(serverMillis-Date.now())<15000,"Accepted sustained revision must store Firestore server commit time.");
    assert.ok(serverMillis>clientClock+30000,"Authoritative cooldown anchor must not trust the caller clock.");
    assert.deepEqual(localRuntime.inspect(),localBefore,"Accepted remote publication must not mutate canonical local saves.");
    assert.deepEqual(await adminReceiptIds(testEnv),[rawKeyHash(acceptedKey)]);

    await adminSetStateTime(testEnv,Date.now()+60000);
    const replayed=await connected.publishSharedState({
      user:{uid:ACCOUNT_A},firestore:dbA,firebaseSdk:sdk(),deviceId:DEVICE_A,
      binding:A_BINDING,rivalryId:RIVALRY_ID,expectedStateExists:true,baseRevision:3,
      idempotencyKey:acceptedKey,saveRuntime:localRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(replayed.ok,true,JSON.stringify(replayed));
    assert.equal(replayed.status,"replayed","Exact accepted-result replay must remain available even while a new revision is rate-limited.");
    assert.equal(replayed.revision,4);
    assert.equal((await adminState(testEnv)).revision,4,"Replay must not create another revision.");
    assert.deepEqual(await adminReceiptIds(testEnv),[rawKeyHash(acceptedKey)],"Replay must not duplicate receipts.");

    const retryKey="stage4-rate-limit-retry-after-window";
    const blockedAgain=await connected.publishSharedState({
      user:{uid:ACCOUNT_A},firestore:dbA,firebaseSdk:sdk(),deviceId:DEVICE_A,
      binding:A_BINDING,rivalryId:RIVALRY_ID,expectedStateExists:true,baseRevision:4,
      idempotencyKey:retryKey,saveRuntime:localRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(blockedAgain.ok,false,JSON.stringify(blockedAgain));
    assert.equal(blockedAgain.code,"permission-denied");
    assert.equal((await adminState(testEnv)).revision,4);
    assert.deepEqual(await adminReceiptIds(testEnv),[rawKeyHash(acceptedKey)],"Blocked distinct retry must not allocate a receipt.");

    await adminSetStateTime(testEnv,Date.now()-5000);
    const retried=await connected.publishSharedState({
      user:{uid:ACCOUNT_A},firestore:dbA,firebaseSdk:sdk(),deviceId:DEVICE_A,
      binding:A_BINDING,rivalryId:RIVALRY_ID,expectedStateExists:true,baseRevision:4,
      idempotencyKey:retryKey,saveRuntime:localRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(retried.ok,true,JSON.stringify(retried));
    assert.equal(retried.status,"accepted");
    assert.equal(retried.revision,5,"The same previously denied logical mutation may advance exactly once after the cooldown opens.");
    const finalState=await adminState(testEnv);
    assert.equal(finalState.revision,5);
    assert.deepEqual(await adminReceiptIds(testEnv),[rawKeyHash(acceptedKey),rawKeyHash(retryKey)].sort());
    assert.deepEqual(localRuntime.inspect(),localBefore,"Rate-limit denial, replay and later acceptance must leave canonical local saves byte-logically unchanged.");

    process.stdout.write("PASS Stage 4 sustained mutation-frequency emulator proof: forged caller time cannot bypass the post-warmup two-second server-time cooldown, denied writes allocate no authority/receipt, exact replay remains idempotent during cooldown, and the same distinct mutation advances exactly once after the window opens.\n");
  }finally{
    await testEnv.cleanup();
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
