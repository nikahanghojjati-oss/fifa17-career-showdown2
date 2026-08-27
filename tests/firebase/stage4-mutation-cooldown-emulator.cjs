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
const COOLDOWN_WAIT_MS=2100;

function sdk(){
  const firestore=require("firebase/firestore");
  return {
    Timestamp,
    serverTimestamp:firestore.serverTimestamp,
    doc,
    runTransaction:firestore.runTransaction
  };
}

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}
function rawKeyHash(value){return crypto.createHash("sha256").update(String(value)).digest("hex");}

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
  const peerProfile=peerRole==="playerOne"?`profile_${"1".repeat(24)}`:`profile_${"2".repeat(24)}`;
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
  return {
    isReady:()=>true,
    getLibrarySnapshot:()=>structuredClone(snapshot),
    inspect:()=>structuredClone(snapshot)
  };
}

async function adminState(testEnv,rivalryId){
  let value=null;
  await testEnv.withSecurityRulesDisabled(async context=>{
    const snapshot=await getDoc(doc(context.firestore(),"rivalries",rivalryId,"state","authoritative"));
    value=snapshot.exists()?snapshot.data():null;
  });
  return value;
}

async function adminReceiptIds(testEnv,rivalryId){
  let ids=[];
  await testEnv.withSecurityRulesDisabled(async context=>{
    const snapshot=await getDocs(collection(context.firestore(),"rivalries",rivalryId,"state","authoritative","idempotency"));
    ids=snapshot.docs.map(item=>item.id).sort();
  });
  return ids;
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext("acct_cooldown_a").firestore();
    const dbB=testEnv.authenticatedContext("acct_cooldown_b").firestore();
    const aIdentity=identity("a");
    const bIdentity=identity("b");
    const aBinding=binding("playerOne","1","Hawk");
    const bBinding=binding("playerTwo","2","Rival");
    const now=Date.now();

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(now);
      await setDoc(doc(db,"accounts","acct_cooldown_a"),accountEnvelope("acct_cooldown_a",time));
      await setDoc(doc(db,"accounts","acct_cooldown_b"),accountEnvelope("acct_cooldown_b",time));
    });

    for(const [uid,db,device] of [
      ["acct_cooldown_a",dbA,aIdentity],
      ["acct_cooldown_b",dbB,bIdentity]
    ]){
      const registered=await pairing.registerDevice({
        user:{uid},firestore:db,firebaseSdk:sdk(),identity:device,
        cryptoImpl:crypto.webcrypto,nowEpochMs:now
      });
      assert.equal(registered.ok,true,JSON.stringify(registered));
    }

    const rivalryId=`pair_${"c".repeat(64)}`;
    const created=await pairing.createPairing({
      user:{uid:"acct_cooldown_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:aBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000
    });
    assert.equal(created.ok,true,JSON.stringify(created));
    const joined=await pairing.redeemPairing({
      user:{uid:"acct_cooldown_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:bBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+2000
    });
    assert.equal(joined.ok,true,JSON.stringify(joined));

    const createKey="stage4-cooldown-create";
    const createRuntime=trackedSaveRuntime(aBinding,"cooldown-create");
    const createdState=await connected.publishSharedState({
      user:{uid:"acct_cooldown_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:createKey,
      saveRuntime:createRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+3000
    });
    assert.equal(createdState.ok,true,JSON.stringify(createdState));
    assert.equal(createdState.status,"accepted");
    assert.equal(createdState.revision,0);

    const state0=await adminState(testEnv,rivalryId);
    const receipts0=await adminReceiptIds(testEnv,rivalryId);
    assert.equal(state0.updatedAt instanceof Timestamp,true,"Authoritative mutation time must resolve to a Firestore server timestamp.");
    assert.equal(receipts0.length,1);

    const bFastRuntime=trackedSaveRuntime(bBinding,"too-fast-peer-update");
    const bFastLocal=bFastRuntime.inspect();
    const bFastKey="stage4-cooldown-peer-fast";
    const tooFastPeer=await connected.publishSharedState({
      user:{uid:"acct_cooldown_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:bFastKey,
      saveRuntime:bFastRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+4000
    });
    assert.equal(tooFastPeer.ok,false,JSON.stringify(tooFastPeer));
    assert.equal(tooFastPeer.code,"permission-denied","A distinct entitled owner must not bypass the rivalry-wide mutation cooldown.");
    assert.deepEqual(await adminState(testEnv,rivalryId),state0,"Denied rapid mutation must leave authoritative state unchanged.");
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),receipts0,"Denied rapid mutation must allocate no idempotency receipt.");
    assert.deepEqual(bFastRuntime.inspect(),bFastLocal,"Denied rapid mutation must not alter canonical local saves.");

    const replayDuringCooldown=await connected.publishSharedState({
      user:{uid:"acct_cooldown_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:createKey,
      saveRuntime:createRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+5000
    });
    assert.equal(replayDuringCooldown.ok,true,JSON.stringify(replayDuringCooldown));
    assert.equal(replayDuringCooldown.status,"replayed");
    assert.equal(replayDuringCooldown.revision,0);
    assert.deepEqual(await adminState(testEnv,rivalryId),state0,"Exact accepted-result replay must remain non-mutating during cooldown.");
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),receipts0,"Exact replay must not duplicate receipts during cooldown.");

    await wait(COOLDOWN_WAIT_MS);
    const acceptedAfterCooldown=await connected.publishSharedState({
      user:{uid:"acct_cooldown_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:bFastKey,
      saveRuntime:bFastRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+6000
    });
    assert.equal(acceptedAfterCooldown.ok,true,JSON.stringify(acceptedAfterCooldown));
    assert.equal(acceptedAfterCooldown.status,"accepted");
    assert.equal(acceptedAfterCooldown.revision,1);

    const state1=await adminState(testEnv,rivalryId);
    const receipts1=await adminReceiptIds(testEnv,rivalryId);
    assert.equal(state1.revision,1);
    assert.equal(state1.updatedAt instanceof Timestamp,true);
    assert.equal(state1.updatedAt.toMillis()>=state0.updatedAt.toMillis()+2000,true,"Accepted revision must be separated from prior server mutation time by at least two seconds.");
    assert.deepEqual(receipts1.sort(),[rawKeyHash(createKey),rawKeyHash(bFastKey)].sort());

    const aFastRuntime=trackedSaveRuntime(aBinding,"too-fast-return-update");
    const aFastLocal=aFastRuntime.inspect();
    const tooFastReturn=await connected.publishSharedState({
      user:{uid:"acct_cooldown_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:true,baseRevision:1,idempotencyKey:"stage4-cooldown-return-fast",
      saveRuntime:aFastRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+7000
    });
    assert.equal(tooFastReturn.ok,false,JSON.stringify(tooFastReturn));
    assert.equal(tooFastReturn.code,"permission-denied");
    assert.deepEqual(await adminState(testEnv,rivalryId),state1,"Alternating owners must not bypass the cooldown after revision advancement.");
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),receipts1,"Rejected alternating-owner write must allocate no receipt.");
    assert.deepEqual(aFastRuntime.inspect(),aFastLocal,"Rejected alternating-owner write must not mutate canonical local saves.");

    const replayAcceptedUpdate=await connected.publishSharedState({
      user:{uid:"acct_cooldown_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:bFastKey,
      saveRuntime:bFastRuntime,cryptoImpl:crypto.webcrypto,nowEpochMs:now+8000
    });
    assert.equal(replayAcceptedUpdate.ok,true,JSON.stringify(replayAcceptedUpdate));
    assert.equal(replayAcceptedUpdate.status,"replayed");
    assert.equal(replayAcceptedUpdate.revision,1);
    assert.equal(replayAcceptedUpdate.contentHash,state1.contentHash);
    assert.deepEqual(await adminState(testEnv,rivalryId),state1);
    assert.deepEqual(await adminReceiptIds(testEnv,rivalryId),receipts1);

    await assertSucceeds(getDoc(doc(dbA,"rivalries",rivalryId,"state","authoritative")));
    process.stdout.write("PASS Stage 4 mutation cooldown: server-owned authoritative timestamps enforce a rivalry-wide two-second minimum between distinct accepted revisions, alternating owners cannot bypass it, denied writes allocate no state/receipt/local mutation, and exact replay remains available\n");
  }finally{
    await testEnv.cleanup();
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});