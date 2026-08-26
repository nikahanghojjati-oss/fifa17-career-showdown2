const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds}=require("@firebase/rules-unit-testing");
const pairing=require("../../js/sparkPrivatePairing.js");
const connected=require("../../js/sparkConnectedRivalry.js");

const PROJECT_ID="demo-career-mode-showdown-stage4";
const RULES=fs.readFileSync("firestore.spark.rules","utf8");
const CANONICAL_KEYS=Object.freeze([
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);

function sdk(){
  const firestore=require("firebase/firestore");
  return {Timestamp,doc,runTransaction:firestore.runTransaction};
}

function hash(seed="0"){
  return `sha256:${seed.repeat(64).slice(0,64)}`;
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

function trackedSaveRuntime(localBinding,label){
  const peerRole=localBinding.managerRole==="playerOne"?"playerTwo":"playerOne";
  const peerProfile=peerRole==="playerOne"
    ?`profile_${"1".repeat(24)}`
    :`profile_${"2".repeat(24)}`;
  const managerProfileIds={
    playerOne:localBinding.managerRole==="playerOne"?localBinding.profileId:peerProfile,
    playerTwo:localBinding.managerRole==="playerTwo"?localBinding.profileId:peerProfile
  };
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
        currentRound:2,
        totalRounds:3,
        managers:{playerOne:"Hawk",playerTwo:"Rival"},
        identity:{schemaVersion:1,saveId:localBinding.saveId,managerProfileIds},
        rounds:[
          {roundNumber:1,seasonId:`season_${"3".repeat(24)}`,winner:"playerOne"},
          {roundNumber:2,seasonId:`season_${"4".repeat(24)}`,winner:null}
        ]
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

function rawKeyHash(value){
  return crypto.createHash("sha256").update(String(value)).digest("hex");
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

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext("acct_replay_a").firestore();
    const dbB=testEnv.authenticatedContext("acct_replay_b").firestore();
    const aIdentity=identity("a");
    const bIdentity=identity("b");
    const aBinding=binding("playerOne","1","Hawk");
    const bBinding=binding("playerTwo","2","Rival");
    const now=Date.now();

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(now);
      await setDoc(doc(db,"accounts","acct_replay_a"),accountEnvelope("acct_replay_a",time));
      await setDoc(doc(db,"accounts","acct_replay_b"),accountEnvelope("acct_replay_b",time));
    });

    for(const [uid,db,device] of [
      ["acct_replay_a",dbA,aIdentity],
      ["acct_replay_b",dbB,bIdentity]
    ]){
      const registered=await pairing.registerDevice({
        user:{uid},firestore:db,firebaseSdk:sdk(),identity:device,
        cryptoImpl:crypto.webcrypto,nowEpochMs:now
      });
      assert.equal(registered.ok,true,JSON.stringify(registered));
    }

    const rivalryId=`pair_${"e".repeat(64)}`;
    const created=await pairing.createPairing({
      user:{uid:"acct_replay_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:aBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000
    });
    assert.equal(created.ok,true,JSON.stringify(created));
    const joined=await pairing.redeemPairing({
      user:{uid:"acct_replay_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:bBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+2000
    });
    assert.equal(joined.ok,true,JSON.stringify(joined));

    assert.deepEqual(connected.canonicalStorageKeys,CANONICAL_KEYS);
    const stateRefA=doc(dbA,"rivalries",rivalryId,"state","authoritative");
    const acceptedKey="stage4-exact-accepted-result";
    const acceptedReceiptHash=rawKeyHash(acceptedKey);
    const acceptedReceiptRefA=doc(
      dbA,"rivalries",rivalryId,"state","authoritative","idempotency",acceptedReceiptHash
    );
    const initialRuntime=trackedSaveRuntime(aBinding,"accepted-zero");

    const accepted=await connected.publishSharedState({
      user:{uid:"acct_replay_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:acceptedKey,
      saveRuntime:initialRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+3000
    });
    assert.equal(accepted.ok,true,JSON.stringify(accepted));
    assert.equal(accepted.status,"accepted");
    assert.equal(accepted.revision,0);
    assert.match(accepted.contentHash,/^sha256:[0-9a-f]{64}$/);

    const acceptedReceipt=(await assertSucceeds(getDoc(acceptedReceiptRefA))).data();
    assert.equal(acceptedReceipt.data.requestFingerprint.length>0,true);
    assert.equal(acceptedReceipt.data.acceptedRevision,accepted.revision);
    assert.equal(acceptedReceipt.data.resultStatus,"accepted");
    assert.equal(acceptedReceipt.data.resultContentHash,accepted.contentHash);
    assert.equal(acceptedReceipt.data.actorAccountId,"acct_replay_a");
    assert.equal(acceptedReceipt.data.deviceId,aIdentity.deviceId);

    const advanced=await connected.publishSharedState({
      user:{uid:"acct_replay_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:"stage4-advance-after-accepted",
      saveRuntime:trackedSaveRuntime(aBinding,"advanced-one"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+4000
    });
    assert.equal(advanced.ok,true,JSON.stringify(advanced));
    assert.equal(advanced.status,"accepted");
    assert.equal(advanced.revision,1);
    assert.notEqual(advanced.contentHash,accepted.contentHash);

    const authoritativeBeforeReplay=(await assertSucceeds(getDoc(stateRefA))).data();
    const receiptBeforeReplay=(await assertSucceeds(getDoc(acceptedReceiptRefA))).data();
    const receiptIdsBeforeReplay=await adminReceiptIds(testEnv,rivalryId);
    const localBeforeReplay=initialRuntime.inspect();
    const runtimeReadsBeforeReplay=initialRuntime.readCount();
    assert.equal(authoritativeBeforeReplay.revision,1);
    assert.equal(receiptIdsBeforeReplay.length,2,"The accepted mutation and later logical mutation must own exactly two receipts.");

    const replayed=await connected.publishSharedState({
      user:{uid:"acct_replay_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:acceptedKey,
      saveRuntime:initialRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+5000
    });
    assert.equal(replayed.ok,true,JSON.stringify(replayed));
    assert.equal(replayed.status,"replayed");
    assert.equal(replayed.replayed,true);
    assert.equal(replayed.revision,accepted.revision,"Replay must return the original accepted revision even after authority advanced.");
    assert.equal(replayed.contentHash,accepted.contentHash,"Replay must return the original accepted content hash.");
    assert.equal(replayed.idempotencyKey,acceptedKey);
    assert.equal(initialRuntime.readCount(),runtimeReadsBeforeReplay+1,"Replay may rebuild the immutable request fingerprint but must not mutate local state.");
    assert.deepEqual(initialRuntime.inspect(),localBeforeReplay,"Exact replay must not mutate canonical local Save Library state.");

    const authoritativeAfterReplay=(await assertSucceeds(getDoc(stateRefA))).data();
    const receiptAfterReplay=(await assertSucceeds(getDoc(acceptedReceiptRefA))).data();
    const receiptIdsAfterReplay=await adminReceiptIds(testEnv,rivalryId);
    assert.deepEqual(authoritativeAfterReplay,authoritativeBeforeReplay,"Exact replay must not create a second authoritative mutation effect.");
    assert.deepEqual(receiptAfterReplay,receiptBeforeReplay,"Accepted receipt must remain logically identical after replay.");
    assert.deepEqual(receiptIdsAfterReplay,receiptIdsBeforeReplay,"Exact replay must not create or duplicate a receipt.");
    assert.equal(authoritativeAfterReplay.revision,1,"Replay must not increment the current authoritative revision.");
    assert.equal(authoritativeAfterReplay.contentHash,advanced.contentHash,"Replay must not replace the current authoritative content/hash.");

    const differentFingerprint=await connected.publishSharedState({
      user:{uid:"acct_replay_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:true,baseRevision:1,idempotencyKey:acceptedKey,
      saveRuntime:trackedSaveRuntime(aBinding,"different-request"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+6000
    });
    assert.equal(differentFingerprint.ok,false,JSON.stringify(differentFingerprint));
    assert.equal(differentFingerprint.code,"IDEMPOTENCY_CONFLICT","The same key must never authorize a different logical request.");

    const crossOwnerReplay=await connected.publishSharedState({
      user:{uid:"acct_replay_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:acceptedKey,
      saveRuntime:trackedSaveRuntime(bBinding,"cross-owner"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+7000
    });
    assert.equal(crossOwnerReplay.ok,false,JSON.stringify(crossOwnerReplay));
    assert.equal(crossOwnerReplay.code,"permission-denied","Replay receipt authority must remain scoped to the authenticated accepting actor.");

    const staleNewMutation=await connected.publishSharedState({
      user:{uid:"acct_replay_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:"stage4-stale-after-replay",
      saveRuntime:trackedSaveRuntime(bBinding,"stale-after-replay"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+8000
    });
    assert.equal(staleNewMutation.ok,false,JSON.stringify(staleNewMutation));
    assert.equal(staleNewMutation.code,"STALE_BASE_REVISION","Exact replay must not weaken immutable-base compare-and-swap for a new mutation key.");
    assert.equal(staleNewMutation.authoritativeRevision,1);

    const finalAuthority=(await assertSucceeds(getDoc(stateRefA))).data();
    const finalReceipt=(await assertSucceeds(getDoc(acceptedReceiptRefA))).data();
    const finalReceiptIds=await adminReceiptIds(testEnv,rivalryId);
    assert.deepEqual(finalAuthority,authoritativeBeforeReplay,"Rejected key reuse, cross-owner replay and stale mutation must leave authority unchanged.");
    assert.deepEqual(finalReceipt,receiptBeforeReplay,"Rejected attempts must leave the accepted receipt immutable.");
    assert.deepEqual(finalReceiptIds,receiptIdsBeforeReplay,"Rejected attempts must not add mutation receipts.");

    process.stdout.write("PASS stage4 exact accepted-result idempotency replay emulator proof\n");
  }finally{
    await testEnv.cleanup();
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
