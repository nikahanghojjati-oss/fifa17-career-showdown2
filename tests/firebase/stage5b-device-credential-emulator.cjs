const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");

process.env.FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099";

const {initializeApp,deleteApp}=require("firebase/app");
const {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  signInWithCustomToken,
  signOut
}=require("firebase/auth");
const {
  initializeFirestore,
  memoryLocalCache,
  connectFirestoreEmulator,
  terminate,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  runTransaction
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const {initializeApp:initializeAdminApp,deleteApp:deleteAdminApp}=require("firebase-admin/app");
const {getAuth:getAdminAuth}=require("firebase-admin/auth");
const session=require("../../js/sparkPrivateSession.js");
const deviceCredential=require("../../js/sparkDeviceCredential.js");

const PROJECT_ID="demo-career-mode-showdown-stage5b";
const AUTH_EMULATOR_URL="http://127.0.0.1:9099";
const RULES=fs.readFileSync("firestore.stage5a.rules","utf8");
const ACCOUNT_ID="acct_stage5b_shared";
const PEER_ACCOUNT_ID="acct_stage5b_peer";
const DEVICE_A=`device_${"a".repeat(32)}`;
const DEVICE_B=`device_${"b".repeat(32)}`;
const DEVICE_C=`device_${"c".repeat(32)}`;
const RIVALRY_ID=`pair_${"d".repeat(64)}`;
const SESSION_ID=`session_${"5".repeat(64)}`;

function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}

function envelope(objectType,objectId,deviceId,data,seed="0"){
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
    updatedByAccountId:ACCOUNT_ID,
    updatedByDeviceId:deviceId,
    data,
    tombstone:null
  };
}

function account(accountId=ACCOUNT_ID){
  const now=Timestamp.fromMillis(Date.now());
  return {
    ...envelope("account",accountId,null,{status:"active",createdAt:now,deletionRequestedAt:null},"1"),
    updatedByAccountId:accountId
  };
}

function device(deviceId,seed){
  const now=Timestamp.fromMillis(Date.now());
  return envelope("device",deviceId,deviceId,{
    deviceId,
    installationId:`installation_${seed.repeat(32).slice(0,32)}`,
    displayLabel:null,
    state:"active",
    registeredAt:now,
    lastSeenAt:now,
    revokedAt:null
  },seed);
}

function rivalry(){
  const now=Timestamp.fromMillis(Date.now());
  return envelope("rivalry",RIVALRY_ID,DEVICE_A,{
    connectionState:"active",
    connectionStateBeforeDeletion:null,
    managerSlots:[
      {slotId:"playerOne",accountId:ACCOUNT_ID,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"1".repeat(24)}`,displayLabel:"Owner",entitlementState:"active",deletionConsent:false},
      {slotId:"playerTwo",accountId:PEER_ACCOUNT_ID,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"2".repeat(24)}`,displayLabel:"Peer",entitlementState:"active",deletionConsent:false}
    ],
    authorizedAccountIds:[ACCOUNT_ID,PEER_ACCOUNT_ID],
    createdByAccountId:ACCOUNT_ID,
    createdAt:now
  },"4");
}

function createClient(name){
  const app=initializeApp({
    apiKey:"stage5b-emulator-only",
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

function options(client,deviceId,nowEpochMs=Date.now()){
  return {
    user:client.user,
    deviceId,
    rivalryId:RIVALRY_ID,
    sessionId:SESSION_ID,
    firestore:client.firestore,
    firebaseSdk:sdk(),
    cryptoImpl:crypto.webcrypto,
    nowEpochMs,
    ttlMs:10*60*1000
  };
}

async function signIn(adminAuth,client,claims){
  const customToken=await adminAuth.createCustomToken(ACCOUNT_ID,claims);
  const result=await signInWithCustomToken(client.auth,customToken);
  client.user=result.user;
  return result.user.getIdTokenResult();
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  const adminApp=initializeAdminApp({projectId:PROJECT_ID},"stage5b-auth-admin");
  const adminAuth=getAdminAuth(adminApp);
  const clients=[
    createClient("stage5b-device-a"),
    createClient("stage5b-device-b"),
    createClient("stage5b-missing-claim"),
    createClient("stage5b-forged-device")
  ];
  const [a,b,missing,forged]=clients;
  let userCreated=false;
  try{
    await testEnv.clearFirestore();
    await adminAuth.createUser({uid:ACCOUNT_ID});
    userCreated=true;
    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",ACCOUNT_ID),account());
      await setDoc(doc(db,"accounts",PEER_ACCOUNT_ID),account(PEER_ACCOUNT_ID));
      await setDoc(doc(db,"accounts",ACCOUNT_ID,"devices",DEVICE_A),device(DEVICE_A,"a"));
      await setDoc(doc(db,"accounts",ACCOUNT_ID,"devices",DEVICE_B),device(DEVICE_B,"b"));
      await setDoc(doc(db,"rivalries",RIVALRY_ID),rivalry());
    });

    const keyA=hash("a");
    const keyB=hash("b");
    const tokenA=await signIn(adminAuth,a,{device_id:DEVICE_A,device_credential_version:1,device_key_sha256:keyA});
    const tokenB=await signIn(adminAuth,b,{device_id:DEVICE_B,device_credential_version:1,device_key_sha256:keyB});
    const tokenMissing=await signIn(adminAuth,missing,{device_credential_version:1,device_key_sha256:hash("e")});
    const tokenForged=await signIn(adminAuth,forged,{device_id:DEVICE_C,device_credential_version:1,device_key_sha256:hash("c")});

    assert.equal(a.user.uid,ACCOUNT_ID);
    assert.equal(b.user.uid,ACCOUNT_ID);
    assert.equal(tokenA.signInProvider,"custom");
    assert.equal(tokenB.signInProvider,"custom");
    assert.equal(tokenA.claims.device_id,DEVICE_A);
    assert.equal(tokenB.claims.device_id,DEVICE_B);
    assert.equal(tokenMissing.claims.device_id,undefined);
    assert.equal(tokenForged.claims.device_id,DEVICE_C);
    assert.deepEqual(deviceCredential.verifyCredentialClaims(tokenA,{deviceId:DEVICE_A,publicKeyFingerprint:keyA}),{
      deviceId:DEVICE_A,
      publicKeyFingerprint:keyA,
      version:1,
      signInProvider:"custom"
    });
    assert.throws(()=>deviceCredential.verifyCredentialClaims(tokenB,{deviceId:DEVICE_A,publicKeyFingerprint:keyA}),/does not match/i);
    assert.throws(()=>deviceCredential.verifyCredentialClaims(tokenA,{deviceId:DEVICE_A,publicKeyFingerprint:keyB}),/different device key/i);

    const opened=await session.openSession(options(a,DEVICE_A));
    assert.equal(opened.ok,true,JSON.stringify(opened));
    assert.equal(opened.state,"open");
    const sessionRefA=doc(a.firestore,"rivalries",RIVALRY_ID,"sessions",SESSION_ID);
    const sessionRefB=doc(b.firestore,"rivalries",RIVALRY_ID,"sessions",SESSION_ID);
    await assertSucceeds(getDoc(sessionRefA));
    await assertSucceeds(getDoc(sessionRefB));

    const observedB=await session.readSession(options(b,DEVICE_B));
    assert.equal(observedB.ok,true,JSON.stringify(observedB));
    assert.equal(observedB.state,"open");
    const missingRead=await session.readSession(options(missing,DEVICE_A));
    assert.equal(missingRead.code,"PRIVATE_SESSION_DEVICE_CREDENTIAL_REQUIRED");
    const forgedRead=await session.readSession(options(forged,DEVICE_C));
    assert.equal(forgedRead.ok,false);
    assert.ok(["permission-denied","PRIVATE_SESSION_DEVICE_NOT_REGISTERED"].includes(forgedRead.code));

    const openValue=(await getDoc(sessionRefA)).data();
    const transitionTime=Timestamp.fromMillis(Date.now());
    await assertFails(setDoc(sessionRefB,{
      ...openValue,
      revision:openValue.revision+1,
      parentRevision:openValue.revision,
      priorContentHash:openValue.contentHash,
      contentHash:hash("9"),
      updatedAt:transitionTime,
      updatedByDeviceId:DEVICE_A,
      data:{...openValue.data,state:"revoked",lastActivityAt:transitionTime,revokedAt:transitionTime}
    }));

    await adminAuth.setCustomUserClaims(ACCOUNT_ID,{device_id:DEVICE_C,global_marker:true});
    const refreshedA=await a.user.getIdTokenResult(true);
    const refreshedB=await b.user.getIdTokenResult(true);
    assert.equal(refreshedA.claims.device_id,DEVICE_A,"Device A claim was replaced by user-wide state during refresh.");
    assert.equal(refreshedB.claims.device_id,DEVICE_B,"Device B claim was replaced by user-wide state during refresh.");
    assert.equal(refreshedA.signInProvider,"custom");
    assert.equal(refreshedB.signInProvider,"custom");
    await assertSucceeds(getDoc(sessionRefA));
    await assertSucceeds(getDoc(sessionRefB));

    const deviceBRef=doc(b.firestore,"accounts",ACCOUNT_ID,"devices",DEVICE_B);
    const deviceBValue=(await getDoc(deviceBRef)).data();
    await testEnv.withSecurityRulesDisabled(async context=>{
      const revokedAt=Timestamp.fromMillis(Date.now());
      await setDoc(doc(context.firestore(),"accounts",ACCOUNT_ID,"devices",DEVICE_B),{
        ...deviceBValue,
        revision:deviceBValue.revision+1,
        parentRevision:deviceBValue.revision,
        priorContentHash:deviceBValue.contentHash,
        contentHash:hash("8"),
        updatedAt:revokedAt,
        updatedByDeviceId:DEVICE_A,
        data:{...deviceBValue.data,state:"revoked",revokedAt}
      });
    });
    await assertFails(getDoc(sessionRefB));
    await assertSucceeds(getDoc(sessionRefA));
    const revokedRead=await session.readSession(options(b,DEVICE_B));
    assert.equal(revokedRead.ok,false);
    assert.ok(["permission-denied","PRIVATE_SESSION_DEVICE_REVOKED"].includes(revokedRead.code));

    process.stdout.write("PASS Stage 5B Auth + Firestore Emulator: simultaneous per-device custom-token claims survive refresh; missing, forged, mismatched and revoked credentials fail closed against candidate session Rules\n");
  }finally{
    for(const client of clients){
      try{await signOut(client.auth);}catch(_error){}
      try{await terminate(client.firestore);}catch(_error){}
      try{await deleteApp(client.app);}catch(_error){}
    }
    if(userCreated){try{await adminAuth.deleteUser(ACCOUNT_ID);}catch(_error){}}
    try{await deleteAdminApp(adminApp);}catch(_error){}
    try{await testEnv.clearFirestore();}catch(_error){}
    await testEnv.cleanup();
  }
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
