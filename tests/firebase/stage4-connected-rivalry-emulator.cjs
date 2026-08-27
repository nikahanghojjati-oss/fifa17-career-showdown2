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
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const pairing=require("../../js/sparkPrivatePairing.js");
const connected=require("../../js/sparkConnectedRivalry.js");

const PROJECT_ID="demo-career-mode-showdown-stage4";
const RULES=fs.readFileSync("firestore.spark.rules","utf8");

function sdk(){
  const firestore=require("firebase/firestore");
  return {Timestamp,serverTimestamp:firestore.serverTimestamp,doc,runTransaction:firestore.runTransaction};
}

function wait(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}

function accountEnvelope(uid,now,status="active"){
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
    data:{status,createdAt:now,deletionRequestedAt:null},
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

function saveRuntime(localBinding,label="baseline"){
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
  return {
    isReady:()=>true,
    getLibrarySnapshot:()=>structuredClone(snapshot)
  };
}

function rawKeyHash(value){
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext("acct_stage4_a").firestore();
    const dbB=testEnv.authenticatedContext("acct_stage4_b").firestore();
    const dbC=testEnv.authenticatedContext("acct_stage4_c").firestore();
    const dbAnon=testEnv.unauthenticatedContext().firestore();
    const aIdentity=identity("a");
    const bIdentity=identity("b");
    const cIdentity=identity("c");
    const aBinding=binding("playerOne","1","Hawk");
    const bBinding=binding("playerTwo","2","Rival");
    const cBinding=binding("playerTwo","5","Third");
    const now=Date.now();

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(now);
      await setDoc(doc(db,"accounts","acct_stage4_a"),accountEnvelope("acct_stage4_a",time));
      await setDoc(doc(db,"accounts","acct_stage4_b"),accountEnvelope("acct_stage4_b",time));
      await setDoc(doc(db,"accounts","acct_stage4_c"),accountEnvelope("acct_stage4_c",time));
    });

    for(const [uid,db,device] of [
      ["acct_stage4_a",dbA,aIdentity],
      ["acct_stage4_b",dbB,bIdentity],
      ["acct_stage4_c",dbC,cIdentity]
    ]){
      const result=await pairing.registerDevice({
        user:{uid},firestore:db,firebaseSdk:sdk(),identity:device,
        cryptoImpl:crypto.webcrypto,nowEpochMs:now
      });
      assert.equal(result.ok,true,JSON.stringify(result));
    }

    const rivalryId=`pair_${"d".repeat(64)}`;
    const created=await pairing.createPairing({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:aBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000
    });
    assert.equal(created.ok,true,JSON.stringify(created));
    const joined=await pairing.redeemPairing({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:bBinding,capability:rivalryId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+2000
    });
    assert.equal(joined.ok,true,JSON.stringify(joined));

    const attachA=await connected.attachRivalry({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,persistPointer:false,cryptoImpl:crypto.webcrypto,nowEpochMs:now+3000
    });
    const attachB=await connected.attachRivalry({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,persistPointer:false,cryptoImpl:crypto.webcrypto,nowEpochMs:now+3000
    });
    assert.equal(attachA.ok,true,JSON.stringify(attachA));
    assert.equal(attachB.ok,true,JSON.stringify(attachB));

    const wrongBinding=await connected.attachRivalry({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:{...bBinding,managerRole:"playerOne"},rivalryId,persistPointer:false
    });
    assert.equal(wrongBinding.ok,false);
    assert.equal(wrongBinding.code,"CONNECTED_RIVALRY_BINDING_MISMATCH");

    const thirdAccount=await connected.attachRivalry({
      user:{uid:"acct_stage4_c"},firestore:dbC,firebaseSdk:sdk(),deviceId:cIdentity.deviceId,
      binding:cBinding,rivalryId,persistPointer:false
    });
    assert.equal(thirdAccount.ok,false);
    assert.equal(thirdAccount.code,"permission-denied");

    const stateRefA=doc(dbA,"rivalries",rivalryId,"state","authoritative");
    const stateRefB=doc(dbB,"rivalries",rivalryId,"state","authoritative");
    const stateRefC=doc(dbC,"rivalries",rivalryId,"state","authoritative");
    const empty=await connected.readSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId
    });
    assert.equal(empty.ok,true,JSON.stringify(empty));
    assert.equal(empty.exists,false);
    await assertFails(getDoc(stateRefC));
    await assertFails(getDoc(doc(dbAnon,"rivalries",rivalryId,"state","authoritative")));

    const createKey="stage4-create-fixed-key";
    const first=await connected.publishSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:createKey,
      saveRuntime:saveRuntime(aBinding,"a-create"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+4000
    });
    assert.equal(first.ok,true,JSON.stringify(first));
    assert.equal(first.status,"accepted");
    assert.equal(first.revision,0);
    const state0=(await assertSucceeds(getDoc(stateRefA))).data();
    assert.equal(state0.revision,0);
    assert.equal(state0.data.saveId,aBinding.saveId,"Creator save identity must be the stable shared remote saveId.");
    assert.deepEqual(state0.data.managerBindings,[
      {slotId:"playerOne",profileId:aBinding.profileId},
      {slotId:"playerTwo",profileId:bBinding.profileId}
    ]);
    assert.equal(state0.data.payload.identity.saveId,aBinding.saveId);
    assert.equal(state0.data.payload.identity.managerProfileIds.playerTwo,bBinding.profileId);

    const receiptHash=rawKeyHash(createKey);
    const receiptRefA=doc(dbA,"rivalries",rivalryId,"state","authoritative","idempotency",receiptHash);
    const receiptRefB=doc(dbB,"rivalries",rivalryId,"state","authoritative","idempotency",receiptHash);
    await assertSucceeds(getDoc(receiptRefA));
    await assertFails(getDoc(receiptRefB));
    await assertFails(getDocs(collection(dbA,"rivalries",rivalryId,"state","authoritative","idempotency")));

    const replay=await connected.publishSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:false,baseRevision:0,idempotencyKey:createKey,
      saveRuntime:saveRuntime(aBinding,"a-create"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+5000
    });
    assert.equal(replay.ok,true,JSON.stringify(replay));
    assert.equal(replay.status,"replayed");
    assert.equal(replay.revision,0);
    assert.equal((await assertSucceeds(getDoc(stateRefA))).data().revision,0,"Exact replay must not increment revision.");

    const keyReuse=await connected.publishSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:createKey,
      saveRuntime:saveRuntime(aBinding,"different-payload"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+6000
    });
    assert.equal(keyReuse.ok,false);
    assert.equal(keyReuse.code,"IDEMPOTENCY_CONFLICT");
    assert.equal((await assertSucceeds(getDoc(stateRefA))).data().revision,0);

    const bRead0=await connected.readSharedState({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId
    });
    assert.equal(bRead0.ok,true,JSON.stringify(bRead0));
    assert.equal(bRead0.revision,0);

    await wait(2100);
    const aUpdate=await connected.publishSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:"stage4-a-update-1",
      saveRuntime:saveRuntime(aBinding,"a-update-1"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+7000
    });
    assert.equal(aUpdate.ok,true,JSON.stringify(aUpdate));
    assert.equal(aUpdate.revision,1);

    const bStale=await connected.publishSharedState({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:0,idempotencyKey:"stage4-b-stale",
      saveRuntime:saveRuntime(bBinding,"b-stale"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+8000
    });
    assert.equal(bStale.ok,false,JSON.stringify(bStale));
    assert.equal(bStale.code,"STALE_BASE_REVISION");
    assert.equal(bStale.authoritativeRevision,1);
    assert.equal((await assertSucceeds(getDoc(stateRefB))).data().revision,1);

    const bRefresh=await connected.readSharedState({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId
    });
    assert.equal(bRefresh.ok,true,JSON.stringify(bRefresh));
    assert.equal(bRefresh.revision,1);
    await wait(2100);
    const bUpdate=await connected.publishSharedState({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:1,idempotencyKey:"stage4-b-update-2",
      saveRuntime:saveRuntime(bBinding,"b-update-2"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+9000
    });
    assert.equal(bUpdate.ok,true,JSON.stringify(bUpdate));
    assert.equal(bUpdate.revision,2);
    const state2=(await assertSucceeds(getDoc(stateRefA))).data();
    assert.equal(state2.revision,2);
    assert.equal(state2.data.saveId,aBinding.saveId,"Peer publication must preserve creator shared save identity.");
    assert.equal(state2.data.payload.identity.saveId,aBinding.saveId);

    await assertFails(setDoc(stateRefA,{revision:99}));
    await assertFails(setDoc(doc(dbA,"rivalries",rivalryId,"sessions","session_forbidden"),{state:"active"}));
    await assertFails(getDocs(collection(dbA,"rivalries")));

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const accountA=(await getDoc(doc(db,"accounts","acct_stage4_a"))).data();
      await setDoc(doc(db,"accounts","acct_stage4_a"),{
        ...accountA,
        revision:accountA.revision+1,
        parentRevision:accountA.revision,
        priorContentHash:accountA.contentHash,
        contentHash:hash("b"),
        updatedAt:Timestamp.fromMillis(now+10000),
        data:{...accountA.data,status:"disabled"}
      });
    });
    const frozenByOtherAccount=await connected.publishSharedState({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:2,idempotencyKey:"stage4-b-while-a-disabled",
      saveRuntime:saveRuntime(bBinding,"b-frozen"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+11000
    });
    assert.equal(frozenByOtherAccount.ok,false,JSON.stringify(frozenByOtherAccount));
    assert.equal(frozenByOtherAccount.code,"permission-denied");
    assert.equal((await assertSucceeds(getDoc(stateRefB))).data().revision,2,"Required-account disablement must freeze shared mutation.");

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const accountA=(await getDoc(doc(db,"accounts","acct_stage4_a"))).data();
      await setDoc(doc(db,"accounts","acct_stage4_a"),{
        ...accountA,
        revision:accountA.revision+1,
        parentRevision:accountA.revision,
        priorContentHash:accountA.contentHash,
        contentHash:hash("c"),
        updatedAt:Timestamp.fromMillis(now+12000),
        data:{...accountA.data,status:"active"}
      });
    });

    const revoked=await pairing.revokeDevice({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      targetDeviceId:bIdentity.deviceId,cryptoImpl:crypto.webcrypto,nowEpochMs:now+13000
    });
    assert.equal(revoked.ok,true,JSON.stringify(revoked));
    const revokedPublish=await connected.publishSharedState({
      user:{uid:"acct_stage4_b"},firestore:dbB,firebaseSdk:sdk(),deviceId:bIdentity.deviceId,
      binding:bBinding,rivalryId,expectedStateExists:true,baseRevision:2,idempotencyKey:"stage4-b-revoked",
      saveRuntime:saveRuntime(bBinding,"b-revoked"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+14000
    });
    assert.equal(revokedPublish.ok,false,JSON.stringify(revokedPublish));
    assert.equal(revokedPublish.code,"CONNECTED_RIVALRY_DEVICE_REVOKED");
    assert.equal((await assertSucceeds(getDoc(stateRefA))).data().revision,2);

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"rivalries",rivalryId,"state","authoritative"),{
        schemaVersion:1,
        objectType:"sharedState",
        objectId:rivalryId,
        revision:3,
        parentRevision:2,
        lifecycleState:"tombstoned",
        contentHash:null,
        priorContentHash:state2.contentHash,
        updatedAt:Timestamp.fromMillis(now+15000),
        updatedByAccountId:"acct_stage4_a",
        updatedByDeviceId:aIdentity.deviceId,
        data:null,
        tombstone:{
          deletedAt:Timestamp.fromMillis(now+15000),
          deletedByAccountId:"acct_stage4_a",
          reasonCode:"test-only",
          restorableByAccountIds:["acct_stage4_a","acct_stage4_b"]
        }
      });
    });
    const tombstoneRead=await connected.readSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId
    });
    assert.equal(tombstoneRead.ok,true,JSON.stringify(tombstoneRead));
    assert.equal(tombstoneRead.tombstoned,true);
    assert.equal(tombstoneRead.revision,3);
    const resurrection=await connected.publishSharedState({
      user:{uid:"acct_stage4_a"},firestore:dbA,firebaseSdk:sdk(),deviceId:aIdentity.deviceId,
      binding:aBinding,rivalryId,expectedStateExists:true,baseRevision:3,idempotencyKey:"stage4-resurrection-forbidden",
      saveRuntime:saveRuntime(aBinding,"resurrection"),cryptoImpl:crypto.webcrypto,nowEpochMs:now+16000
    });
    assert.equal(resurrection.ok,false,JSON.stringify(resurrection));
    assert.equal(resurrection.code,"TOMBSTONE_RESTORE_REQUIRED");
    const tombstoneAfter=(await assertSucceeds(getDoc(stateRefA))).data();
    assert.equal(tombstoneAfter.lifecycleState,"tombstoned");
    assert.equal(tombstoneAfter.data,null);

    process.stdout.write("PASS Stage 4 Connected Rivalry emulator: exact private attachment, two-account state, atomic replay, stale CAS, isolation, account/device revocation freeze, tombstone anti-resurrection, and Stage 5 write lock\n");
  }finally{
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{process.stderr.write(`${error&&error.stack?error.stack:error}\n`);process.exit(1);});