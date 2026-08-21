const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const pairing=require("../../js/sparkPrivatePairing.js");

const PROJECT_ID="demo-career-mode-showdown-stage3";
const RULES=fs.readFileSync("firestore.spark.rules","utf8");

function sdk(){
  const firestore=require("firebase/firestore");
  return {Timestamp,doc,runTransaction:firestore.runTransaction};
}

function hash(){return `sha256:${"0".repeat(64)}`;}

function accountEnvelope(uid,now){
  return {
    schemaVersion:1,
    objectType:"account",
    objectId:uid,
    revision:0,
    parentRevision:null,
    lifecycleState:"live",
    contentHash:hash(),
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

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext("acct_stage3_a").firestore();
    const dbB=testEnv.authenticatedContext("acct_stage3_b").firestore();
    const dbC=testEnv.authenticatedContext("acct_stage3_c").firestore();
    const dbAnon=testEnv.unauthenticatedContext().firestore();
    const aIdentity=identity("a");
    const bIdentity=identity("b");
    const cIdentity=identity("c");
    const now=Date.now();

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(now);
      await setDoc(doc(db,"accounts","acct_stage3_a"),accountEnvelope("acct_stage3_a",time));
      await setDoc(doc(db,"accounts","acct_stage3_b"),accountEnvelope("acct_stage3_b",time));
      await setDoc(doc(db,"accounts","acct_stage3_c"),accountEnvelope("acct_stage3_c",time));
    });

    const regA=await pairing.registerDevice({user:{uid:"acct_stage3_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
    const regB=await pairing.registerDevice({user:{uid:"acct_stage3_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
    const regC=await pairing.registerDevice({user:{uid:"acct_stage3_c"},firestore:dbC,firebaseSdk:sdk(),identity:cIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
    assert.equal(regA.ok,true,JSON.stringify(regA));
    assert.equal(regB.ok,true,JSON.stringify(regB));
    assert.equal(regC.ok,true,JSON.stringify(regC));

    await assertSucceeds(getDoc(doc(dbA,"accounts","acct_stage3_a","devices",aIdentity.deviceId)));
    await assertFails(getDoc(doc(dbA,"accounts","acct_stage3_b","devices",bIdentity.deviceId)));
    await assertFails(getDocs(collection(dbA,"accounts","acct_stage3_a","devices")));
    await assertFails(deleteDoc(doc(dbA,"accounts","acct_stage3_a","devices",aIdentity.deviceId)));
    await assertFails(getDoc(doc(dbAnon,"accounts","acct_stage3_a","devices",aIdentity.deviceId)));

    const capability=`pair_${"d".repeat(64)}`;
    const created=await pairing.createPairing({
      user:{uid:"acct_stage3_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:binding("playerOne","1","Hawk"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(created.ok,true,JSON.stringify(created));

    const rivalryRefA=doc(dbA,"rivalries",capability);
    const rivalryRefB=doc(dbB,"rivalries",capability);
    const rivalryRefC=doc(dbC,"rivalries",capability);
    const inviteRefA=doc(dbA,"rivalries",capability,"invites",capability);
    const inviteRefB=doc(dbB,"rivalries",capability,"invites",capability);

    await assertSucceeds(getDoc(rivalryRefA));
    await assertSucceeds(getDoc(rivalryRefB));
    await assertSucceeds(getDoc(inviteRefB));
    await assertFails(getDocs(collection(dbB,"rivalries")));
    await assertFails(getDocs(collection(dbB,"rivalries",capability,"invites")));

    const wrongSlot=await pairing.redeemPairing({
      user:{uid:"acct_stage3_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:binding("playerOne","2","Rival"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(wrongSlot.ok,false);
    assert.equal(wrongSlot.code,"PAIRING_SLOT_MISMATCH");

    const creatorReplay=await pairing.redeemPairing({
      user:{uid:"acct_stage3_a"},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:binding("playerTwo","9","Creator"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(creatorReplay.ok,false);
    assert.equal(creatorReplay.code,"PAIRING_CREATOR_CANNOT_REDEEM");

    const joined=await pairing.redeemPairing({
      user:{uid:"acct_stage3_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:binding("playerTwo","2","Rival"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(joined.ok,true,JSON.stringify(joined));

    const joinedRoot=(await assertSucceeds(getDoc(rivalryRefB))).data();
    assert.equal(joinedRoot.data.connectionState,"active");
    assert.equal(joinedRoot.data.managerSlots.length,2);
    assert.deepEqual(joinedRoot.data.authorizedAccountIds,["acct_stage3_a","acct_stage3_b"]);
    assert.equal(joinedRoot.data.managerSlots[1].accountId,"acct_stage3_b");
    assert.match(joinedRoot.data.managerSlots[1].profileId,/^profile_[0-9a-f]{24}$/);
    assert.match(joinedRoot.data.managerSlots[1].saveId,/^save_[0-9a-f]{24}$/);
    await assertFails(getDoc(rivalryRefC));
    await assertFails(getDoc(inviteRefB));
    await assertSucceeds(getDoc(inviteRefA));

    const replay=await pairing.redeemPairing({
      user:{uid:"acct_stage3_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:binding("playerTwo","2","Rival"),capability,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(replay.ok,false);
    assert.equal(replay.code,"PAIRING_CAPABILITY_ALREADY_USED");
    await assertFails(updateDoc(inviteRefB,{"data.state":"redeemed"}));

    await assertFails(setDoc(doc(dbA,"rivalries",capability,"state","authoritative"),{revision:1}));
    await assertFails(setDoc(doc(dbA,"rivalries",capability,"sessions","session_forbidden"),{state:"active"}));

    const revoked=await pairing.revokeDevice({
      user:{uid:"acct_stage3_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      targetDeviceId:bIdentity.deviceId,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(revoked.ok,true,JSON.stringify(revoked));
    const revokedDevice=(await assertSucceeds(getDoc(doc(dbB,"accounts","acct_stage3_b","devices",bIdentity.deviceId)))).data();
    assert.equal(revokedDevice.data.state,"revoked");
    const reregister=await pairing.registerDevice({user:{uid:"acct_stage3_b"},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()});
    assert.equal(reregister.ok,false);
    assert.equal(reregister.code,"PRIVATE_DEVICE_REVOKED");

    const expiredCapability=`pair_${"e".repeat(64)}`;
    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"rivalries",expiredCapability),{data:{connectionState:"pending-pair",authorizedAccountIds:["acct_stage3_a"]}});
      await setDoc(doc(db,"rivalries",expiredCapability,"invites",expiredCapability),{data:{purpose:"rivalry-pairing",state:"open",createdByAccountId:"acct_stage3_a",expiresAt:Timestamp.fromMillis(Date.now()-1000)}});
    });
    await assertFails(getDoc(doc(dbC,"rivalries",expiredCapability)));
    await assertFails(getDoc(doc(dbC,"rivalries",expiredCapability,"invites",expiredCapability)));

    process.stdout.write("PASS Stage 3 Spark emulator: private devices, one-use pairing, isolation, expiry, revocation, and downstream write locks\n");
  }finally{
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{process.stderr.write(`${error&&error.stack?error.stack:error}\n`);process.exit(1);});
