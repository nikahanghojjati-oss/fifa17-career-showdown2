const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch
}=require("firebase/firestore");
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");
const pairing=require("../../js/sparkPrivatePairing.js");
const connected=require("../../js/sparkConnectedRivalry.js");

const PROJECT_ID="demo-career-mode-showdown-stage4";
const RULES=fs.readFileSync("firestore.spark.rules","utf8");

function sdk(){
  const firestore=require("firebase/firestore");
  return {Timestamp,doc,runTransaction:firestore.runTransaction};
}

function hash(seed="0"){
  return `sha256:${seed.repeat(64).slice(0,64)}`;
}

function canonicalize(value){
  if(value===undefined)return null;
  if(value===null)return null;
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

function rawKeyHash(value){
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function accountEnvelope(uid,now){
  return {
    schemaVersion:1,
    objectType:"account",
    objectId:uid,
    revision:0,
    parentRevision:null,
    lifecycleState:"live",
    contentHash:hash("a"),
    priorContentHash:null,
    updatedAt:now,
    updatedByAccountId:uid,
    updatedByDeviceId:null,
    data:{status:"active",createdAt:now,deletionRequestedAt:null},
    tombstone:null
  };
}

function identity(seed){
  return {
    schemaVersion:1,
    installationId:`installation_${seed.repeat(32).slice(0,32)}`,
    deviceId:`device_${seed.repeat(32).slice(0,32)}`,
    createdAtEpochMs:Date.now()
  };
}

function binding(role,seed,label){
  return {
    saveId:`save_${seed.repeat(24).slice(0,24)}`,
    profileId:`profile_${seed.repeat(24).slice(0,24)}`,
    managerRole:role,
    displayLabel:label
  };
}

function trackedSaveRuntime(localBinding,label,seasonCount){
  const peerRole=localBinding.managerRole==="playerOne"?"playerTwo":"playerOne";
  const peerProfile=peerRole==="playerOne"
    ?`profile_${"1".repeat(24)}`
    :`profile_${"2".repeat(24)}`;
  const managerProfileIds={
    playerOne:localBinding.managerRole==="playerOne"?localBinding.profileId:peerProfile,
    playerTwo:localBinding.managerRole==="playerTwo"?localBinding.profileId:peerProfile
  };
  const rounds=Array.from({length:seasonCount},(_,index)=>({
    roundNumber:index+1,
    seasonId:`season_${((index+1)%16).toString(16).repeat(24)}`,
    winner:null
  }));
  const snapshot={
    schemaVersion:1,
    activeSaveId:localBinding.saveId,
    profiles:[
      {schemaVersion:1,profileId:managerProfileIds.playerOne,displayName:"Hawk"},
      {schemaVersion:1,profileId:managerProfileIds.playerTwo,displayName:"Rival"}
    ],
    saves:[{
      saveId:localBinding.saveId,
      showdown:{
        id:`local-${label}`,
        status:label,
        currentRound:1,
        totalRounds:seasonCount,
        managers:{playerOne:"Hawk",playerTwo:"Rival"},
        identity:{schemaVersion:1,saveId:localBinding.saveId,managerProfileIds},
        rounds
      }
    }]
  };
  let reads=0;
  return {
    isReady:()=>true,
    getLibrarySnapshot:()=>{
      reads+=1;
      return structuredClone(snapshot);
    },
    inspect:()=>structuredClone(snapshot),
    readCount:()=>reads
  };
}

async function adminReceiptIds(testEnv,rivalryId){
  let ids=[];
  await testEnv.withSecurityRulesDisabled(async context=>{
    const snap=await getDocs(collection(
      context.firestore(),
      "rivalries",rivalryId,"state","authoritative","idempotency"
    ));
    ids=snap.docs.map(item=>item.id).sort();
  });
  return ids;
}

async function adminState(testEnv,rivalryId){
  let value=null;
  await testEnv.withSecurityRulesDisabled(async context=>{
    const snap=await getDoc(doc(context.firestore(),"rivalries",rivalryId,"state","authoritative"));
    value=snap.exists()?snap.data():null;
  });
  return value;
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext("acct_abuse_a").firestore();
    const dbB=testEnv.authenticatedContext("acct_abuse_b").firestore();
    const aIdentity=identity("a");
    const bIdentity=identity("b");
    const aBinding=binding("playerOne","1","Hawk");
    const bBinding=binding("playerTwo","2","Rival");
    const now=Date.now();

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(now);
      await setDoc(doc(db,"accounts","acct_abuse_a"),accountEnvelope("acct_abuse_a",time));
      await setDoc(doc(db,"accounts","acct_abuse_b"),accountEnvelope("acct_abuse_b",time));
    });

    for(const [uid,db,device] of [
      ["acct_abuse_a",dbA,aIdentity],
      ["acct_abuse_b",dbB,bIdentity]
    ]){
      const registered=await pairing.registerDevice({
        user:{uid},firestore:db,firebaseSdk:sdk(),identity:device,
        cryptoImpl:crypto.webcrypto,nowEpochMs:now
      });
      assert.equal(registered.ok,true,JSON.stringify(registered));
    }

    const rivalryId=`pair_${"d".repeat(64)}`;
    const created=await pairing.createPairing({
      user:{uid:"acct_abuse_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:aBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000
    });
    assert.equal(created.ok,true,JSON.stringify(created));
    const joined=await pairing.redeemPairing({
      user:{uid:"acct_abuse_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:bBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+2000
    });
    assert.equal(joined.ok,true,JSON.stringify(joined));

    await assertFails(getDocs(collection(dbA,"rivalries")));
    await assertFails(getDocs(collection(dbB,"rivalries")));

    const oversizedCreateRuntime=trackedSaveRuntime(aBinding,"oversized-create",11);
    const oversizedCreateLocal=oversizedCreateRuntime.inspect();
    const oversizedCreate=await connected.publishSharedState({
      user:{uid:"acct_abuse_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,
      idempotencyKey:"stage4-abuse-oversized-create",saveRuntime:oversizedCreateRuntime,
      cryptoImpl:crypto.webcrypto,nowEpochMs:now+3000
    });
    assert.equal(oversizedCreate.ok,false,JSON.stringify(oversizedCreate));
    assert.equal(oversizedCreate.code,"permission-denied","An authorized modified client must not allocate authoritative state with more than ten season identities.");
    assert.deepEqual(oversizedCreateRuntime.inspect(),oversizedCreateLocal,"Denied oversized create must not mutate canonical local saves.");
    assert.equal(await adminState(testEnv,rivalryId),null,"Denied oversized create must allocate no authoritative state document.");
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),[],"Denied oversized create must allocate no idempotency receipt.");

    const maxBoundaryRuntime=trackedSaveRuntime(aBinding,"max-ten",10);
    const accepted=await connected.publishSharedState({
      user:{uid:"acct_abuse_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,
      idempotencyKey:"stage4-abuse-max-ten",saveRuntime:maxBoundaryRuntime,
      cryptoImpl:crypto.webcrypto,nowEpochMs:now+4000
    });
    assert.equal(accepted.ok,true,JSON.stringify(accepted));
    assert.equal(accepted.status,"accepted");
    assert.equal(accepted.revision,0);
    const acceptedState=await adminState(testEnv,rivalryId);
    const acceptedReceiptIds=await adminReceiptIds(testEnv,rivalryId);
    assert.equal(acceptedState.data.seasonIds.length,10,"The exact ten-season product boundary must remain accepted.");
    assert.equal(acceptedState.data.payload.rounds.length,10,"The accepted payload must carry the same exact ten rounds declared by seasonIds.");
    assert.equal(acceptedReceiptIds.length,1);

    // Model a genuinely modified client rather than calling the production projection builder:
    // retain ten declared seasonIds but hand-forge eleven payload rounds plus the matching
    // authoritative/idempotency envelopes so the Rules themselves must reject the inconsistency.
    const forgedRawKey="stage4-abuse-forged-hidden-eleventh-round";
    const forgedKeyHash=rawKeyHash(forgedRawKey);
    const forgedFingerprint=sha256({case:"hidden-eleventh-round",rivalryId});
    const forgedAt=Timestamp.fromMillis(now+4500);
    const forgedExpiresAt=Timestamp.fromMillis(now+4500+7*24*60*60*1000);
    const forgedData={
      ...acceptedState.data,
      seasonIds:[...acceptedState.data.seasonIds],
      payload:{
        ...acceptedState.data.payload,
        rounds:[
          ...acceptedState.data.payload.rounds,
          {roundNumber:11,seasonId:`season_${"b".repeat(24)}`,winner:null}
        ]
      },
      mutationReceipt:{
        idempotencyKeyHash:forgedKeyHash,
        requestFingerprint:forgedFingerprint,
        baseRevision:0
      }
    };
    const forgedState={
      ...acceptedState,
      revision:1,
      parentRevision:0,
      priorContentHash:acceptedState.contentHash,
      updatedAt:forgedAt,
      updatedByAccountId:"acct_abuse_a",
      updatedByDeviceId:aIdentity.deviceId,
      data:forgedData
    };
    forgedState.contentHash=sha256({objectType:"sharedState",objectId:rivalryId,revision:1,data:forgedData});
    const forgedReceiptData={
      requestFingerprint:forgedFingerprint,
      baseRevision:0,
      acceptedRevision:1,
      resultStatus:"accepted",
      resultContentHash:forgedState.contentHash,
      resultTombstone:false,
      actorAccountId:"acct_abuse_a",
      deviceId:aIdentity.deviceId,
      createdAt:forgedAt,
      expiresAt:forgedExpiresAt
    };
    const forgedReceipt={
      schemaVersion:1,
      objectType:"idempotency",
      objectId:forgedKeyHash,
      revision:0,
      parentRevision:null,
      lifecycleState:"live",
      contentHash:sha256({objectType:"idempotency",objectId:forgedKeyHash,revision:0,data:forgedReceiptData}),
      priorContentHash:null,
      updatedAt:forgedAt,
      updatedByAccountId:"acct_abuse_a",
      updatedByDeviceId:aIdentity.deviceId,
      data:forgedReceiptData,
      tombstone:null
    };
    const forgedBatch=writeBatch(dbA);
    forgedBatch.set(doc(dbA,"rivalries",rivalryId,"state","authoritative"),forgedState);
    forgedBatch.set(doc(dbA,"rivalries",rivalryId,"state","authoritative","idempotency",forgedKeyHash),forgedReceipt);
    await assertFails(forgedBatch.commit());
    assert.deepEqual(await adminState(testEnv,rivalryId),acceptedState,"A forged hidden eleventh payload round must leave authoritative state unchanged.");
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),acceptedReceiptIds,"A forged hidden eleventh payload round must allocate no idempotency receipt.");
    assert.deepEqual(maxBoundaryRuntime.inspect(),maxBoundaryRuntime.inspect(),"Raw forged remote denial does not mutate canonical local saves.");

    const oversizedUpdateRuntime=trackedSaveRuntime(bBinding,"oversized-update",11);
    const oversizedUpdateLocal=oversizedUpdateRuntime.inspect();
    const oversizedUpdate=await connected.publishSharedState({
      user:{uid:"acct_abuse_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:0,
      idempotencyKey:"stage4-abuse-oversized-update",saveRuntime:oversizedUpdateRuntime,
      cryptoImpl:crypto.webcrypto,nowEpochMs:now+5000
    });
    assert.equal(oversizedUpdate.ok,false,JSON.stringify(oversizedUpdate));
    assert.equal(oversizedUpdate.code,"permission-denied","An authorized modified client must not expand an existing authoritative state beyond ten season identities.");
    assert.deepEqual(oversizedUpdateRuntime.inspect(),oversizedUpdateLocal,"Denied oversized update must not mutate canonical local saves.");
    assert.deepEqual(await adminState(testEnv,rivalryId),acceptedState,"Denied oversized update must leave accepted authoritative state byte-logically unchanged.");
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),acceptedReceiptIds,"Denied oversized update must allocate no additional idempotency receipt.");

    await assertSucceeds(getDoc(doc(dbA,"rivalries",rivalryId)));
    await assertSucceeds(getDoc(doc(dbB,"rivalries",rivalryId)));

    process.stdout.write("PASS Stage 4 structural abuse hardening: rivalry enumeration is denied, Rules bind payload rounds to declared seasonIds at the exact ten-season boundary, and oversized or hand-forged authorized writes allocate no remote authority/receipts and mutate no local saves\n");
  }finally{
    await testEnv.cleanup();
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});