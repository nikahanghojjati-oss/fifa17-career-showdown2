const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");

process.env.FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099";

const {initializeApp,deleteApp}=require("firebase/app");
const {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut
}=require("firebase/auth");
const {
  initializeFirestore,
  memoryLocalCache,
  connectFirestoreEmulator,
  terminate,
  Timestamp,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const {initializeApp:initializeAdminApp,deleteApp:deleteAdminApp}=require("firebase-admin/app");
const {getAuth:getAdminAuth}=require("firebase-admin/auth");
const session=require("../../js/sparkStandardAuthPrivateSession.js");

const PROJECT_ID="demo-career-mode-showdown-stage5c";
const AUTH_EMULATOR_URL="http://127.0.0.1:9099";
const RULES=fs.readFileSync("firestore.stage5c.rules","utf8");
const RIVALRY_ID=`pair_${"d".repeat(64)}`;
const DEVICE_A=`device_${"a".repeat(32)}`;
const DEVICE_B=`device_${"b".repeat(32)}`;
const DEVICE_C=`device_${"c".repeat(32)}`;
const UNKNOWN_DEVICE=`device_${"e".repeat(32)}`;

function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}
function password(){return `S5c!${crypto.randomBytes(24).toString("base64url")}`;}

function envelope(objectType,objectId,accountId,deviceId,data,seed="0"){
  const now=Timestamp.fromMillis(Date.now());
  return {
    schemaVersion:1,
    objectType,
    objectId,
    revision:0,
    parentRevision:null,
    lifecycleState:"live",
    contentHash:hash(seed),
    priorContentHash:null,
    updatedAt:now,
    updatedByAccountId:accountId,
    updatedByDeviceId:deviceId,
    data,
    tombstone:null
  };
}

function accountEnvelope(accountId,seed,status="active"){
  const now=Timestamp.fromMillis(Date.now());
  return envelope("account",accountId,accountId,null,{
    status,createdAt:now,deletionRequestedAt:null
  },seed);
}

function deviceEnvelope(accountId,deviceId,seed,state="active"){
  const now=Timestamp.fromMillis(Date.now());
  return envelope("device",deviceId,accountId,deviceId,{
    deviceId,
    installationId:`installation_${seed.repeat(32).slice(0,32)}`,
    displayLabel:null,
    state,
    registeredAt:now,
    lastSeenAt:now,
    revokedAt:state==="revoked"?now:null
  },seed);
}

function rivalryEnvelope(accountA,accountB){
  const now=Timestamp.fromMillis(Date.now());
  return envelope("rivalry",RIVALRY_ID,accountA,DEVICE_A,{
    connectionState:"active",
    connectionStateBeforeDeletion:null,
    managerSlots:[
      {slotId:"playerOne",accountId:accountA,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"1".repeat(24)}`,displayLabel:"Host",entitlementState:"active",deletionConsent:false},
      {slotId:"playerTwo",accountId:accountB,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"2".repeat(24)}`,displayLabel:"Peer",entitlementState:"active",deletionConsent:false}
    ],
    authorizedAccountIds:[accountA,accountB],
    createdByAccountId:accountA,
    createdAt:now
  },"d");
}

function createClient(name){
  const app=initializeApp({
    apiKey:"stage5c-emulator-only",
    authDomain:`${PROJECT_ID}.firebaseapp.com`,
    projectId:PROJECT_ID
  },name);
  const auth=initializeAuth(app,{persistence:inMemoryPersistence});
  connectAuthEmulator(auth,AUTH_EMULATOR_URL,{disableWarnings:true});
  const firestore=initializeFirestore(app,{localCache:memoryLocalCache()});
  connectFirestoreEmulator(firestore,"127.0.0.1",8080);
  return {app,auth,firestore,user:null};
}

function sdk(){return {Timestamp,doc,runTransaction};}

function options(client,deviceId,sessionId,nowEpochMs=Date.now(),ttlMs){
  const value={
    user:client.user,
    deviceId,
    rivalryId:RIVALRY_ID,
    sessionId,
    firestore:client.firestore,
    firebaseSdk:sdk(),
    cryptoImpl:crypto.webcrypto,
    nowEpochMs
  };
  if(ttlMs!==undefined)value.ttlMs=ttlMs;
  return value;
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
  const adminApp=initializeAdminApp({projectId:PROJECT_ID},"stage5c-auth-admin");
  const adminAuth=getAdminAuth(adminApp);
  const clients=[
    createClient("stage5c-host"),
    createClient("stage5c-peer"),
    createClient("stage5c-third"),
    createClient("stage5c-anonymous")
  ];
  const [host,peer,third,anonymous]=clients;
  const createdUids=[];
  try{
    await testEnv.clearFirestore();
    for(const [client,label] of [[host,"host"],[peer,"peer"],[third,"third"]]){
      const created=await createUserWithEmailAndPassword(
        client.auth,
        `stage5c-${label}-${crypto.randomBytes(8).toString("hex")}@example.test`,
        password()
      );
      client.user=created.user;
      createdUids.push(created.user.uid);
    }
    const [accountA,accountB,accountC]=createdUids;
    assert.notEqual(accountA,accountB);
    assert.notEqual(accountA,accountC);
    const tokenA=await host.user.getIdTokenResult(true);
    const tokenB=await peer.user.getIdTokenResult(true);
    assert.equal(tokenA.signInProvider,"password","The Auth Emulator uses a standard test provider; production Google-only policy is separately locked.");
    assert.equal(tokenB.signInProvider,"password");
    for(const token of [tokenA,tokenB]){
      assert.equal(token.claims.device_id,undefined);
      assert.equal(token.claims.device_credential_version,undefined);
      assert.equal(token.claims.device_key_sha256,undefined);
      assert.equal(token.claims.user_id===token.claims.sub,true);
    }
    for(const uid of createdUids){
      const observed=await adminAuth.getUser(uid);
      assert.equal(observed.uid,uid);
      assert.equal(observed.disabled,false);
    }

    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",accountA),accountEnvelope(accountA,"a"));
      await setDoc(doc(db,"accounts",accountB),accountEnvelope(accountB,"b"));
      await setDoc(doc(db,"accounts",accountC),accountEnvelope(accountC,"c"));
      await setDoc(doc(db,"accounts",accountA,"devices",DEVICE_A),deviceEnvelope(accountA,DEVICE_A,"a"));
      await setDoc(doc(db,"accounts",accountB,"devices",DEVICE_B),deviceEnvelope(accountB,DEVICE_B,"b"));
      await setDoc(doc(db,"accounts",accountC,"devices",DEVICE_C),deviceEnvelope(accountC,DEVICE_C,"c"));
      await setDoc(doc(db,"rivalries",RIVALRY_ID),rivalryEnvelope(accountA,accountB));
    });

    const sessionId=`session_${"1".repeat(64)}`;
    const refA=doc(host.firestore,"rivalries",RIVALRY_ID,"sessions",sessionId);
    const refB=doc(peer.firestore,"rivalries",RIVALRY_ID,"sessions",sessionId);
    const refC=doc(third.firestore,"rivalries",RIVALRY_ID,"sessions",sessionId);
    const refAnon=doc(anonymous.firestore,"rivalries",RIVALRY_ID,"sessions",sessionId);

    const opened=await session.openSession(options(host,DEVICE_A,sessionId,Date.now(),60_000));
    assert.equal(opened.ok,true,JSON.stringify(opened));
    assert.equal(opened.state,"open");
    assert.equal(opened.revision,0);
    await assertSucceeds(getDoc(refA));
    await assertSucceeds(getDoc(refB));
    await assertFails(getDoc(refC));
    await assertFails(getDoc(refAnon));
    await assertFails(getDocs(collection(host.firestore,"rivalries",RIVALRY_ID,"sessions")));
    await assertFails(getDocs(collection(peer.firestore,"rivalries",RIVALRY_ID,"sessions")));
    await assertFails(getDocs(collectionGroup(host.firestore,"sessions")));

    const missingAuthClient=await session.readSession({
      ...options(anonymous,DEVICE_A,sessionId),user:null
    });
    assert.equal(missingAuthClient.ok,false);
    assert.equal(missingAuthClient.code,"PRIVATE_SESSION_AUTH_REQUIRED");
    const thirdJoin=await session.joinSession(options(third,DEVICE_C,sessionId));
    assert.equal(thirdJoin.ok,false);
    assert.ok(["permission-denied","PRIVATE_SESSION_RIVALRY_NOT_ENTITLED"].includes(thirdJoin.code));
    assert.equal((await snapshotData(refA)).revision,0);

    const originalAccountB=await snapshotData(doc(peer.firestore,"accounts",accountB));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",accountB),{
        ...originalAccountB,
        data:{...originalAccountB.data,status:"disabled"}
      });
    });
    await assertFails(getDoc(refB));
    const inactiveRead=await session.readSession(options(peer,DEVICE_B,sessionId));
    assert.equal(inactiveRead.ok,false);
    assert.ok(["permission-denied","PRIVATE_SESSION_ACCOUNT_INACTIVE"].includes(inactiveRead.code));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",accountB),originalAccountB);
    });

    const originalDeviceB=await snapshotData(doc(peer.firestore,"accounts",accountB,"devices",DEVICE_B));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",accountB,"devices",DEVICE_B),
        deviceEnvelope(accountB,DEVICE_B,"b","revoked"));
    });
    await assertSucceeds(getDoc(refB));
    const revokedDeviceJoin=await session.joinSession(options(peer,DEVICE_B,sessionId));
    assert.equal(revokedDeviceJoin.ok,false);
    assert.ok(["permission-denied","PRIVATE_SESSION_DEVICE_REVOKED"].includes(revokedDeviceJoin.code));
    const missingDeviceJoin=await session.joinSession(options(peer,UNKNOWN_DEVICE,sessionId));
    assert.equal(missingDeviceJoin.ok,false);
    assert.ok(["permission-denied","PRIVATE_SESSION_DEVICE_NOT_REGISTERED"].includes(missingDeviceJoin.code));

    const openValue=await snapshotData(refA);
    const invalidDeviceTime=Date.now();
    const otherwiseValidActive={
      ...openValue.data,
      memberAccountIds:[accountA,accountB],
      state:"active",
      lastActivityAt:Timestamp.fromMillis(invalidDeviceTime),
      revokedAt:null
    };
    await assertFails(setDoc(refB,nextEnvelope(openValue,{
      accountId:accountB,
      deviceId:DEVICE_B,
      data:otherwiseValidActive,
      seed:"5",
      nowEpochMs:invalidDeviceTime
    })));
    await assertFails(setDoc(refB,nextEnvelope(openValue,{
      accountId:accountB,
      deviceId:UNKNOWN_DEVICE,
      data:otherwiseValidActive,
      seed:"6",
      nowEpochMs:invalidDeviceTime
    })));
    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts",accountB,"devices",DEVICE_B),originalDeviceB);
    });

    const joined=await session.joinSession(options(peer,DEVICE_B,sessionId));
    assert.equal(joined.ok,true,JSON.stringify(joined));
    assert.equal(joined.state,"active");
    assert.equal(joined.revision,1);
    const joinedValue=await snapshotData(refA);
    const staleTime=Date.now();
    await assertFails(setDoc(refB,nextEnvelope(openValue,{
      accountId:accountB,
      deviceId:DEVICE_B,
      data:{...otherwiseValidActive,lastActivityAt:Timestamp.fromMillis(staleTime)},
      seed:"7",
      nowEpochMs:staleTime
    })));
    assert.equal((await snapshotData(refA)).revision,joinedValue.revision);

    await assertFails(deleteDoc(refA));
    const closed=await session.closeSession(options(peer,DEVICE_B,sessionId,Date.now()+1000));
    assert.equal(closed.ok,true,JSON.stringify(closed));
    assert.equal(closed.state,"closed");
    assert.equal(closed.revision,2);
    const closeRetry=await session.closeSession(options(peer,DEVICE_B,sessionId,Date.now()+2000));
    assert.equal(closeRetry.ok,true);
    assert.equal(closeRetry.replayed,true);
    const resurrection=await session.joinSession(options(peer,DEVICE_B,sessionId,Date.now()+3000));
    assert.equal(resurrection.ok,false);
    assert.equal(resurrection.code,"PRIVATE_SESSION_NOT_JOINABLE");
    const closedValue=await snapshotData(refA);
    await assertFails(setDoc(refB,nextEnvelope(closedValue,{
      accountId:accountB,
      deviceId:DEVICE_B,
      data:{...closedValue.data,state:"active",lastActivityAt:Timestamp.fromMillis(Date.now())},
      seed:"8"
    })));

    const expiringId=`session_${"2".repeat(64)}`;
    const expiringOptions=options(host,DEVICE_A,expiringId,Date.now(),1000);
    assert.equal((await session.openSession(expiringOptions)).ok,true);
    const premature=await session.expireSession({...expiringOptions,nowEpochMs:Date.now()});
    assert.equal(premature.ok,false);
    assert.equal(premature.code,"PRIVATE_SESSION_NOT_EXPIRED");
    await new Promise(resolve=>setTimeout(resolve,1100));
    const expired=await session.expireSession({...expiringOptions,nowEpochMs:Date.now()});
    assert.equal(expired.ok,true,JSON.stringify(expired));
    assert.equal(expired.state,"expired");
    const expiredJoin=await session.joinSession(options(peer,DEVICE_B,expiringId,Date.now()));
    assert.equal(expiredJoin.ok,false);
    assert.equal(expiredJoin.code,"permission-denied",
      "A peer that never joined an open session loses exact-get authority once host-only expiry makes it terminal.");

    process.stdout.write("PASS Stage 5C Auth + Firestore Emulator: standard Firebase uid tokens with no custom device claims, exact capability/no-list, two-account lifecycle, missing/wrong/inactive identity denial, mutation-only registered-device metadata checks, stale CAS, expiry and terminal no-resurrection; emulator users earn no RJR credit.\n");
  }finally{
    for(const client of clients){
      try{await signOut(client.auth);}catch(_error){}
      try{await terminate(client.firestore);}catch(_error){}
      try{await deleteApp(client.app);}catch(_error){}
    }
    for(const uid of createdUids){try{await adminAuth.deleteUser(uid);}catch(_error){}}
    try{await deleteAdminApp(adminApp);}catch(_error){}
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
