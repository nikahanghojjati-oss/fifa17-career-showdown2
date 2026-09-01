const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const {
  Timestamp,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const pairing=require("../../js/sparkPrivatePairing.js");
const privateSession=require("../../js/sparkPrivateSession.js");

const PROJECT_ID="demo-career-mode-showdown-stage5a";
const RULES=fs.readFileSync("firestore.stage5a.rules","utf8");
const ACCOUNT_A="acct_stage5a_a";
const ACCOUNT_B="acct_stage5a_b";
const ACCOUNT_C="acct_stage5a_c";

function sdk(){
  const firestore=require("firebase/firestore");
  return {Timestamp,doc,runTransaction:firestore.runTransaction};
}

function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}

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

function credentialFingerprint(identityValue){
  return hash(identityValue.deviceId.slice("device_".length,"device_".length+1));
}

function credentialClaims(identityValue){
  return {
    device_id:identityValue.deviceId,
    device_credential_version:1,
    device_key_sha256:credentialFingerprint(identityValue)
  };
}

function credentialEnvelope(accountId,identityValue,now){
  return {
    schemaVersion:1,
    objectType:"deviceCredential",
    objectId:identityValue.deviceId,
    revision:0,
    parentRevision:null,
    lifecycleState:"live",
    contentHash:credentialFingerprint(identityValue),
    priorContentHash:null,
    updatedAt:now,
    updatedByAccountId:accountId,
    updatedByDeviceId:identityValue.deviceId,
    data:{
      deviceId:identityValue.deviceId,
      state:"active",
      credentialVersion:1,
      publicKeyFingerprint:credentialFingerprint(identityValue),
      enrolledAt:now,
      lastIssuedAt:now,
      revokedAt:null
    },
    tombstone:null
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

function sessionOptions({db,accountId,identityValue,rivalryId,sessionId,nowEpochMs=Date.now(),ttlMs}){
  const options={
    user:{
      uid:accountId,
      async getIdTokenResult(){return {claims:credentialClaims(identityValue)};}
    },
    firestore:db,
    firebaseSdk:sdk(),
    deviceId:identityValue.deviceId,
    rivalryId,
    sessionId,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs
  };
  if(ttlMs!==undefined)options.ttlMs=ttlMs;
  return options;
}

function nextEnvelope(before,{accountId,deviceId,data,seed="f",nowEpochMs=Date.now()}){
  return {
    ...before,
    revision:before.revision+1,
    parentRevision:before.revision,
    priorContentHash:before.contentHash,
    contentHash:hash(seed),
    updatedAt:Timestamp.fromMillis(nowEpochMs),
    updatedByAccountId:accountId,
    updatedByDeviceId:deviceId,
    data
  };
}

async function snapshotData(reference){
  const snapshot=await assertSucceeds(getDoc(reference));
  assert.equal(snapshot.exists(),true);
  return snapshot.data();
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const aIdentity=identity("a");
    const bIdentity=identity("b");
    const cIdentity=identity("c");
    const bSecondIdentity=identity("e");
    const neverRegisteredIdentity=identity("f");
    const dbA=testEnv.authenticatedContext(ACCOUNT_A,credentialClaims(aIdentity)).firestore();
    const dbB=testEnv.authenticatedContext(ACCOUNT_B,credentialClaims(bIdentity)).firestore();
    const dbC=testEnv.authenticatedContext(ACCOUNT_C,credentialClaims(cIdentity)).firestore();
    const dbANoDeviceCredential=testEnv.authenticatedContext(ACCOUNT_A).firestore();
    const dbANeverRegistered=testEnv.authenticatedContext(ACCOUNT_A,credentialClaims(neverRegisteredIdentity)).firestore();
    const dbAnon=testEnv.unauthenticatedContext().firestore();
    const initialNow=Date.now();

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(initialNow);
      await setDoc(doc(db,"accounts",ACCOUNT_A),accountEnvelope(ACCOUNT_A,time));
      await setDoc(doc(db,"accounts",ACCOUNT_B),accountEnvelope(ACCOUNT_B,time));
      await setDoc(doc(db,"accounts",ACCOUNT_C),accountEnvelope(ACCOUNT_C,time));
    });

    for(const [db,accountId,identityValue] of [
      [dbA,ACCOUNT_A,aIdentity],
      [dbB,ACCOUNT_B,bIdentity],
      [dbC,ACCOUNT_C,cIdentity]
    ]){
      const registered=await pairing.registerDevice({
        user:{uid:accountId},firestore:db,firebaseSdk:sdk(),identity:identityValue,
        cryptoImpl:crypto.webcrypto,nowEpochMs:initialNow
      });
      assert.equal(registered.ok,true,JSON.stringify(registered));
    }
    const registeredBSecond=await pairing.registerDevice({
      user:{uid:ACCOUNT_B},firestore:dbB,firebaseSdk:sdk(),identity:bSecondIdentity,
      cryptoImpl:crypto.webcrypto,nowEpochMs:initialNow
    });
    assert.equal(registeredBSecond.ok,true,JSON.stringify(registeredBSecond));

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      const time=Timestamp.fromMillis(initialNow);
      for(const [accountId,identityValue] of [
        [ACCOUNT_A,aIdentity],
        [ACCOUNT_B,bIdentity],
        [ACCOUNT_C,cIdentity]
      ]){
        await setDoc(
          doc(db,"accounts",accountId,"deviceCredentials",identityValue.deviceId),
          credentialEnvelope(accountId,identityValue,time)
        );
      }
    });

    const rivalryId=`pair_${"d".repeat(64)}`;
    const createdPairing=await pairing.createPairing({
      user:{uid:ACCOUNT_A},firestore:dbA,firebaseSdk:sdk(),identity:aIdentity,
      binding:binding("playerOne","1","Host"),capability:rivalryId,
      cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(createdPairing.ok,true,JSON.stringify(createdPairing));
    const redeemedPairing=await pairing.redeemPairing({
      user:{uid:ACCOUNT_B},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      binding:binding("playerTwo","2","Peer"),capability:rivalryId,
      cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(redeemedPairing.ok,true,JSON.stringify(redeemedPairing));

    const sessionId=`session_${"1".repeat(64)}`;
    const sessionRefA=doc(dbA,"rivalries",rivalryId,"sessions",sessionId);
    const sessionRefB=doc(dbB,"rivalries",rivalryId,"sessions",sessionId);
    const sessionRefC=doc(dbC,"rivalries",rivalryId,"sessions",sessionId);
    const sessionRefANoDeviceCredential=doc(dbANoDeviceCredential,"rivalries",rivalryId,"sessions",sessionId);
    const sessionRefANeverRegistered=doc(dbANeverRegistered,"rivalries",rivalryId,"sessions",sessionId);
    const sessionRefAnon=doc(dbAnon,"rivalries",rivalryId,"sessions",sessionId);

    const opened=await privateSession.openSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId
    }));
    assert.equal(opened.ok,true,JSON.stringify(opened));
    assert.equal(opened.state,"open");
    assert.equal(opened.revision,0);
    assert.equal(opened.replayed,false);

    const replayedOpen=await privateSession.openSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId,
      nowEpochMs:Date.now()+1000,ttlMs:30*60*1000
    }));
    assert.equal(replayedOpen.ok,true,JSON.stringify(replayedOpen));
    assert.equal(replayedOpen.replayed,true);
    assert.equal(replayedOpen.expiresAtEpochMs,opened.expiresAtEpochMs);
    assert.equal(replayedOpen.revision,0);

    const conflictingHost=await privateSession.openSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(conflictingHost.ok,false);
    assert.equal(conflictingHost.code,"PRIVATE_SESSION_CONFLICT");

    const hostSelfJoin=await privateSession.joinSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId
    }));
    assert.equal(hostSelfJoin.ok,false);
    assert.equal(hostSelfJoin.code,"PRIVATE_SESSION_HOST_CANNOT_JOIN");

    const observedByPeer=await privateSession.readSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(observedByPeer.ok,true,JSON.stringify(observedByPeer));
    assert.equal(observedByPeer.state,"open");
    await assertSucceeds(getDoc(sessionRefA));
    await assertSucceeds(getDoc(sessionRefB));
    await assertFails(getDoc(sessionRefANoDeviceCredential));
    await assertFails(getDoc(sessionRefANeverRegistered));
    await assertFails(getDoc(sessionRefC));
    await assertFails(getDoc(sessionRefAnon));
    await assertFails(getDocs(collection(dbA,"rivalries",rivalryId,"sessions")));
    await assertFails(getDocs(collection(dbB,"rivalries",rivalryId,"sessions")));
    await assertFails(getDocs(collectionGroup(dbA,"sessions")));

    const thirdJoin=await privateSession.joinSession(sessionOptions({
      db:dbC,accountId:ACCOUNT_C,identityValue:cIdentity,rivalryId,sessionId
    }));
    assert.equal(thirdJoin.ok,false);
    assert.equal(thirdJoin.code,"permission-denied");
    assert.equal((await snapshotData(sessionRefA)).revision,0);

    const openEnvelope=await snapshotData(sessionRefA);
    const transitionTime=Date.now()+1000;
    const otherwiseValidActive={
      ...openEnvelope.data,
      memberAccountIds:[ACCOUNT_A,ACCOUNT_B],
      state:"active",
      lastActivityAt:Timestamp.fromMillis(transitionTime),
      revokedAt:null
    };
    await assertFails(setDoc(sessionRefB,nextEnvelope(openEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bIdentity.deviceId,
      data:{...otherwiseValidActive,hostAccountId:ACCOUNT_B},
      seed:"1",
      nowEpochMs:transitionTime
    })));
    await assertFails(setDoc(sessionRefB,nextEnvelope(openEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bIdentity.deviceId,
      data:{...otherwiseValidActive,memberAccountIds:[ACCOUNT_A,ACCOUNT_C]},
      seed:"2",
      nowEpochMs:transitionTime
    })));
    await assertFails(setDoc(sessionRefB,nextEnvelope(openEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bIdentity.deviceId,
      data:{...otherwiseValidActive,expiresAt:Timestamp.fromMillis(opened.expiresAtEpochMs+1000)},
      seed:"3",
      nowEpochMs:transitionTime
    })));
    await assertFails(setDoc(sessionRefB,nextEnvelope(openEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bSecondIdentity.deviceId,
      data:otherwiseValidActive,
      seed:"8",
      nowEpochMs:transitionTime
    })));

    const joined=await privateSession.joinSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(joined.ok,true,JSON.stringify(joined));
    assert.equal(joined.state,"active");
    assert.equal(joined.revision,1);
    assert.deepEqual(joined.memberAccountIds,[ACCOUNT_A,ACCOUNT_B]);
    const replayedJoin=await privateSession.joinSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(replayedJoin.ok,true,JSON.stringify(replayedJoin));
    assert.equal(replayedJoin.replayed,true);
    assert.equal(replayedJoin.revision,1);

    const joinedEnvelope=await snapshotData(sessionRefA);
    await assertFails(deleteDoc(sessionRefA));
    const closed=await privateSession.closeSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(closed.ok,true,JSON.stringify(closed));
    assert.equal(closed.state,"closed");
    assert.equal(closed.revision,2);
    const replayedClose=await privateSession.closeSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(replayedClose.ok,true,JSON.stringify(replayedClose));
    assert.equal(replayedClose.replayed,true);
    assert.equal(replayedClose.revision,2);
    const joinAfterClose=await privateSession.joinSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId
    }));
    assert.equal(joinAfterClose.ok,false);
    assert.equal(joinAfterClose.code,"PRIVATE_SESSION_NOT_JOINABLE");
    const closedEnvelope=await snapshotData(sessionRefA);
    await assertFails(setDoc(sessionRefB,nextEnvelope(closedEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bIdentity.deviceId,
      data:{...closedEnvelope.data,state:"active",lastActivityAt:Timestamp.fromMillis(Date.now())},
      seed:"4"
    })));
    assert.equal(joinedEnvelope.data.expiresAt.toMillis(),closedEnvelope.data.expiresAt.toMillis());

    const revokedSessionId=`session_${"2".repeat(64)}`;
    const revokedOptionsA=sessionOptions({db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId:revokedSessionId});
    const revokedOptionsB=sessionOptions({db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId:revokedSessionId});
    assert.equal((await privateSession.openSession(revokedOptionsA)).ok,true);
    assert.equal((await privateSession.joinSession(revokedOptionsB)).ok,true);
    const peerRevoke=await privateSession.revokeSession(revokedOptionsB);
    assert.equal(peerRevoke.ok,false);
    assert.equal(peerRevoke.code,"PRIVATE_SESSION_HOST_REQUIRED");
    const revoked=await privateSession.revokeSession(revokedOptionsA);
    assert.equal(revoked.ok,true,JSON.stringify(revoked));
    assert.equal(revoked.state,"revoked");
    assert.equal(revoked.revision,2);
    const replayedRevoke=await privateSession.revokeSession(revokedOptionsA);
    assert.equal(replayedRevoke.ok,true,JSON.stringify(replayedRevoke));
    assert.equal(replayedRevoke.replayed,true);
    assert.equal(replayedRevoke.revision,2);
    const revokeTerminalJoin=await privateSession.joinSession(revokedOptionsB);
    assert.equal(revokeTerminalJoin.ok,false);
    assert.equal(revokeTerminalJoin.code,"PRIVATE_SESSION_NOT_JOINABLE");

    const expiringSessionId=`session_${"3".repeat(64)}`;
    const expiringOptions=sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,
      sessionId:expiringSessionId,ttlMs:1000
    });
    const expiringOpen=await privateSession.openSession(expiringOptions);
    assert.equal(expiringOpen.ok,true,JSON.stringify(expiringOpen));
    const prematureExpiry=await privateSession.expireSession({...expiringOptions,nowEpochMs:Date.now()});
    assert.equal(prematureExpiry.ok,false);
    assert.equal(prematureExpiry.code,"PRIVATE_SESSION_NOT_EXPIRED");
    await new Promise(resolve=>setTimeout(resolve,1100));
    const expired=await privateSession.expireSession({...expiringOptions,nowEpochMs:Date.now()});
    assert.equal(expired.ok,true,JSON.stringify(expired));
    assert.equal(expired.state,"expired");
    assert.equal(expired.revision,1);
    const replayedExpiry=await privateSession.expireSession({...expiringOptions,nowEpochMs:Date.now()});
    assert.equal(replayedExpiry.ok,true,JSON.stringify(replayedExpiry));
    assert.equal(replayedExpiry.replayed,true);

    const invalidSessionId="session_short";
    const invalidNow=Timestamp.fromMillis(Date.now());
    const invalidEnvelope=await privateSession.buildEnvelope({
      sessionId:invalidSessionId,
      revision:0,
      parentRevision:null,
      priorContentHash:null,
      updatedAt:invalidNow,
      accountId:ACCOUNT_A,
      deviceId:aIdentity.deviceId,
      data:{
        rivalryId,
        hostAccountId:ACCOUNT_A,
        memberAccountIds:[ACCOUNT_A],
        state:"open",
        createdAt:invalidNow,
        expiresAt:Timestamp.fromMillis(Date.now()+60*1000),
        lastActivityAt:null,
        revokedAt:null
      },
      cryptoImpl:crypto.webcrypto
    });
    await assertFails(setDoc(doc(dbA,"rivalries",rivalryId,"sessions",invalidSessionId),invalidEnvelope));

    const thirdSessionId=`session_${"4".repeat(64)}`;
    const thirdNow=Timestamp.fromMillis(Date.now());
    const thirdEnvelope=await privateSession.buildEnvelope({
      sessionId:thirdSessionId,
      revision:0,
      parentRevision:null,
      priorContentHash:null,
      updatedAt:thirdNow,
      accountId:ACCOUNT_C,
      deviceId:cIdentity.deviceId,
      data:{
        rivalryId,
        hostAccountId:ACCOUNT_C,
        memberAccountIds:[ACCOUNT_C],
        state:"open",
        createdAt:thirdNow,
        expiresAt:Timestamp.fromMillis(Date.now()+60*1000),
        lastActivityAt:null,
        revokedAt:null
      },
      cryptoImpl:crypto.webcrypto
    });
    await assertFails(setDoc(doc(dbC,"rivalries",rivalryId,"sessions",thirdSessionId),thirdEnvelope));

    const deviceGuardSessionId=`session_${"5".repeat(64)}`;
    const deviceGuardRefA=doc(dbA,"rivalries",rivalryId,"sessions",deviceGuardSessionId);
    assert.equal((await privateSession.openSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId:deviceGuardSessionId
    }))).ok,true);
    const originalDeviceB=await snapshotData(doc(dbB,"accounts",ACCOUNT_B,"devices",bIdentity.deviceId));
    const revokedDevice=await pairing.revokeDevice({
      user:{uid:ACCOUNT_B},firestore:dbB,firebaseSdk:sdk(),identity:bIdentity,
      targetDeviceId:bIdentity.deviceId,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()
    });
    assert.equal(revokedDevice.ok,true,JSON.stringify(revokedDevice));
    const revokedDeviceJoin=await privateSession.joinSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId:deviceGuardSessionId
    }));
    assert.equal(revokedDeviceJoin.ok,false);
    assert.equal(revokedDeviceJoin.code,"PRIVATE_SESSION_DEVICE_REVOKED");
    await assertFails(getDoc(doc(dbB,"rivalries",rivalryId,"sessions",deviceGuardSessionId)));
    const deviceGuardEnvelope=await snapshotData(deviceGuardRefA);
    const deviceGuardTime=Date.now();
    await assertFails(setDoc(doc(dbB,"rivalries",rivalryId,"sessions",deviceGuardSessionId),nextEnvelope(deviceGuardEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bIdentity.deviceId,
      data:{...deviceGuardEnvelope.data,memberAccountIds:[ACCOUNT_A,ACCOUNT_B],state:"active",lastActivityAt:Timestamp.fromMillis(deviceGuardTime)},
      seed:"5",
      nowEpochMs:deviceGuardTime
    })));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",ACCOUNT_B,"devices",bIdentity.deviceId),originalDeviceB);
    });

    const accountGuardSessionId=`session_${"6".repeat(64)}`;
    const accountGuardRefA=doc(dbA,"rivalries",rivalryId,"sessions",accountGuardSessionId);
    assert.equal((await privateSession.openSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId:accountGuardSessionId
    }))).ok,true);
    const accountGuardEnvelope=await snapshotData(accountGuardRefA);
    const accountRefA=doc(dbA,"accounts",ACCOUNT_A);
    const originalAccountA=await snapshotData(accountRefA);
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",ACCOUNT_A),{
        ...originalAccountA,
        data:{...originalAccountA.data,status:"disabled"}
      });
    });
    const inactiveAccountRevoke=await privateSession.revokeSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId:accountGuardSessionId
    }));
    assert.equal(inactiveAccountRevoke.ok,false);
    assert.equal(inactiveAccountRevoke.code,"PRIVATE_SESSION_ACCOUNT_INACTIVE");
    const accountGuardTime=Date.now();
    await assertFails(setDoc(accountGuardRefA,nextEnvelope(accountGuardEnvelope,{
      accountId:ACCOUNT_A,
      deviceId:aIdentity.deviceId,
      data:{...accountGuardEnvelope.data,state:"revoked",lastActivityAt:Timestamp.fromMillis(accountGuardTime),revokedAt:Timestamp.fromMillis(accountGuardTime)},
      seed:"6",
      nowEpochMs:accountGuardTime
    })));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",ACCOUNT_A),originalAccountA);
    });

    const entitlementGuardSessionId=`session_${"7".repeat(64)}`;
    const entitlementGuardRefA=doc(dbA,"rivalries",rivalryId,"sessions",entitlementGuardSessionId);
    assert.equal((await privateSession.openSession(sessionOptions({
      db:dbA,accountId:ACCOUNT_A,identityValue:aIdentity,rivalryId,sessionId:entitlementGuardSessionId
    }))).ok,true);
    const rivalryRefA=doc(dbA,"rivalries",rivalryId);
    const originalRivalry=await snapshotData(rivalryRefA);
    const entitlementEnvelope=await snapshotData(entitlementGuardRefA);
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",rivalryId),{
        ...originalRivalry,
        data:{...originalRivalry.data,authorizedAccountIds:[ACCOUNT_A]}
      });
    });
    const lostEntitlementJoin=await privateSession.joinSession(sessionOptions({
      db:dbB,accountId:ACCOUNT_B,identityValue:bIdentity,rivalryId,sessionId:entitlementGuardSessionId
    }));
    assert.equal(lostEntitlementJoin.ok,false);
    assert.equal(lostEntitlementJoin.code,"permission-denied");
    const entitlementTime=Date.now();
    await assertFails(setDoc(doc(dbB,"rivalries",rivalryId,"sessions",entitlementGuardSessionId),nextEnvelope(entitlementEnvelope,{
      accountId:ACCOUNT_B,
      deviceId:bIdentity.deviceId,
      data:{...entitlementEnvelope.data,memberAccountIds:[ACCOUNT_A,ACCOUNT_B],state:"active",lastActivityAt:Timestamp.fromMillis(entitlementTime)},
      seed:"7",
      nowEpochMs:entitlementTime
    })));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",rivalryId),originalRivalry);
    });

    process.stdout.write("PASS Stage 5A candidate emulator: provider-verifiable active-device credential on reads and writes, exact capability get/no-list authority, host-open and peer-join, deterministic replay, immutable pair/lifecycle/expiry, terminal no-resurrection, and account/device/entitlement denial; emulator identities earn no RJR credit\n");
  }finally{
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{process.stderr.write(`${error&&error.stack?error.stack:error}\n`);process.exit(1);});
