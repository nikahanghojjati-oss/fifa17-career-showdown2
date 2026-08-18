const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");

process.env.FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST="127.0.0.1:8080";

const {initializeApp,deleteApp}=require("firebase/app");
const {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut
}=require("firebase/auth");
const {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  setDoc,
  terminate,
  updateDoc
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const {initializeApp:initializeAdminApp,deleteApp:deleteAdminApp}=require("firebase-admin/app");
const {getAuth:getAdminAuth}=require("firebase-admin/auth");
const {getFirestore:getAdminFirestore,Timestamp}=require("firebase-admin/firestore");
const execution=require("../../js/trustedAccountBootstrapExecution.js");

const PROJECT_ID="demo-career-mode-showdown-phase1f";
const AUTH_EMULATOR_URL="http://127.0.0.1:9099";
const FIRESTORE_EMULATOR_HOST="127.0.0.1";
const FIRESTORE_EMULATOR_PORT=8080;
const RULES=fs.readFileSync("firestore.rules","utf8");
const FIXED_TIME_MILLIS=1_700_700_000_000;

function runtimeCredential(){
  return `Gg7!${crypto.randomBytes(24).toString("base64url")}`;
}

function createEmulatorClient(name){
  const app=initializeApp({
    apiKey:"stage2g-emulator-only",
    authDomain:`${PROJECT_ID}.firebaseapp.com`,
    projectId:PROJECT_ID
  },name);
  const auth=initializeAuth(app,{persistence:inMemoryPersistence});
  connectAuthEmulator(auth,AUTH_EMULATOR_URL,{disableWarnings:true});
  const db=getFirestore(app);
  connectFirestoreEmulator(db,FIRESTORE_EMULATOR_HOST,FIRESTORE_EMULATOR_PORT);
  return {app,auth,db};
}

function normalizeForHash(value){
  if(value instanceof Timestamp)return {seconds:value.seconds,nanoseconds:value.nanoseconds};
  if(Array.isArray(value))return value.map(normalizeForHash);
  if(value&&typeof value==="object"){
    return Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalizeForHash(value[key])]));
  }
  return value;
}

function canonicalHash(value){
  const canonical=JSON.stringify(normalizeForHash(value));
  return `sha256:${crypto.createHash("sha256").update(canonical).digest("hex")}`;
}

function materializeCreateSpec(createSpec){
  assert.equal(createSpec.schemaVersion,1);
  assert.equal(createSpec.objectType,"account");
  assert.equal(createSpec.revision,0);
  assert.equal(createSpec.parentRevision,null);
  assert.equal(createSpec.lifecycleState,"live");
  assert.equal(createSpec.updatedByAccountId,createSpec.objectId);
  assert.equal(createSpec.updatedByDeviceId,null,"Revision-0 bootstrap must not fabricate a Stage 3 registered device identity.");
  assert.equal(createSpec.trustedMaterialization.canonicalContentHashRequired,true);
  assert.deepEqual(Array.from(createSpec.trustedMaterialization.serverTimestampFields),["data.createdAt","updatedAt"]);

  const trustedTime=Timestamp.fromMillis(FIXED_TIME_MILLIS);
  const data={
    status:createSpec.data.status,
    createdAt:trustedTime,
    deletionRequestedAt:createSpec.data.deletionRequestedAt
  };
  return {
    schemaVersion:createSpec.schemaVersion,
    objectType:createSpec.objectType,
    objectId:createSpec.objectId,
    revision:createSpec.revision,
    parentRevision:createSpec.parentRevision,
    lifecycleState:createSpec.lifecycleState,
    contentHash:canonicalHash(data),
    priorContentHash:createSpec.priorContentHash,
    updatedAt:trustedTime,
    updatedByAccountId:createSpec.updatedByAccountId,
    updatedByDeviceId:createSpec.updatedByDeviceId,
    data,
    tombstone:createSpec.tombstone
  };
}

function makeAtomicAdapter(adminDb,observations){
  return async request=>{
    observations.push({
      accountId:request.accountId,
      documentPath:request.documentPath,
      updatedByDeviceId:request.createSpec.updatedByDeviceId,
      leakedToken:Object.values(request).some(value=>typeof value==="string"&&value.includes("eyJ"))
    });
    const accountRef=adminDb.doc(request.documentPath);
    return adminDb.runTransaction(async transaction=>{
      const snapshot=await transaction.get(accountRef);
      const existing=snapshot.exists?snapshot.data():null;
      const decision=request.decide(existing);
      if(!decision.ok||decision.action!=="create")return {committed:false,decision};
      transaction.create(accountRef,materializeCreateSpec(request.createSpec));
      return {committed:true,decision};
    });
  };
}

async function readAdmin(adminDb,accountId){
  const snapshot=await adminDb.doc(`accounts/${accountId}`).get();
  return snapshot.exists?snapshot.data():null;
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  const clients=[];
  const adminApp=initializeAdminApp({projectId:PROJECT_ID},"stage2g-trusted-admin");
  const adminAuth=getAdminAuth(adminApp);
  const adminDb=getAdminFirestore(adminApp);
  const createdUids=[];

  try{
    await testEnv.clearFirestore();
    assert.equal(execution.stage,"2G");
    assert.equal(execution.productionRuntimeConnected,false);
    assert.equal(execution.productionIamSelected,false);
    assert.equal(execution.sharedMutationAuthorityGranted,false);
    assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,"127.0.0.1:9099");
    assert.equal(process.env.FIRESTORE_EMULATOR_HOST,"127.0.0.1:8080");

    const client=createEmulatorClient("stage2g-auth-client");
    clients.push(client);
    const email=`stage2g-${crypto.randomBytes(8).toString("hex")}@example.test`;
    const password=runtimeCredential();
    const created=await createUserWithEmailAndPassword(client.auth,email,password);
    const uid=created.user.uid;
    createdUids.push(uid);
    const transientIdToken=await created.user.getIdToken(true);

    const verifierCalls=[];
    const verifier=async(idToken,checkRevoked)=>{
      verifierCalls.push({sameToken:idToken===transientIdToken,checkRevoked});
      return adminAuth.verifyIdToken(idToken,checkRevoked);
    };

    const clientAccountRef=doc(client.db,"accounts",uid);
    await assertFails(setDoc(clientAccountRef,{objectType:"account",objectId:uid}));
    assert.equal(await readAdmin(adminDb,uid),null,"Browser client must not create its own account metadata.");

    const observations=[];
    const adapter=makeAtomicAdapter(adminDb,observations);
    const first=await execution.executeTrustedAccountBootstrap({
      idToken:transientIdToken,
      accountId:"client_spoofed_account",
      deviceId:"client_spoofed_device",
      verifyIdToken:verifier,
      runAtomicAccountBootstrap:adapter
    });
    assert.equal(first.ok,true);
    assert.equal(first.action,"created");
    assert.equal(first.accountId,uid);
    assert.equal(first.documentPath,`accounts/${uid}`);
    assert.equal(first.applicationAuthorizationGranted,"account-bootstrap-only");
    assert.deepEqual(verifierCalls,[{sameToken:true,checkRevoked:true}]);
    assert.equal(JSON.stringify(first).includes(transientIdToken),false);
    assert.equal(observations[0].accountId,uid);
    assert.notEqual(observations[0].accountId,"client_spoofed_account");
    assert.equal(observations[0].updatedByDeviceId,null);
    assert.equal(observations[0].leakedToken,false);

    const stored=await readAdmin(adminDb,uid);
    assert.equal(stored.schemaVersion,1);
    assert.equal(stored.objectType,"account");
    assert.equal(stored.objectId,uid);
    assert.equal(stored.revision,0);
    assert.equal(stored.parentRevision,null);
    assert.equal(stored.lifecycleState,"live");
    assert.match(stored.contentHash,/^sha256:[a-f0-9]{64}$/);
    assert.equal(stored.updatedByAccountId,uid);
    assert.equal(stored.updatedByDeviceId,null);
    assert.equal(stored.data.status,"active");
    assert.equal(stored.data.deletionRequestedAt,null);
    assert.equal(stored.data.createdAt.toMillis(),FIXED_TIME_MILLIS);
    assert.equal(stored.updatedAt.toMillis(),FIXED_TIME_MILLIS);

    await assertSucceeds(getDocFromServer(clientAccountRef));
    await assertFails(updateDoc(clientAccountRef,{"data.status":"disabled"}));
    await assertFails(deleteDoc(clientAccountRef));

    const beforeRepeat=await readAdmin(adminDb,uid);
    const repeated=await execution.executeTrustedAccountBootstrap({
      idToken:transientIdToken,
      verifyIdToken:verifier,
      runAtomicAccountBootstrap:adapter
    });
    assert.equal(repeated.ok,true);
    assert.equal(repeated.action,"existing");
    assert.equal(repeated.preserveExisting,true);
    const afterRepeat=await readAdmin(adminDb,uid);
    assert.equal(afterRepeat.revision,beforeRepeat.revision);
    assert.equal(afterRepeat.data.status,beforeRepeat.data.status);
    assert.equal(afterRepeat.data.createdAt.toMillis(),beforeRepeat.data.createdAt.toMillis());
    assert.equal(afterRepeat.updatedAt.toMillis(),beforeRepeat.updatedAt.toMillis());
    assert.equal(afterRepeat.contentHash,beforeRepeat.contentHash);

    await adminDb.doc(`accounts/${uid}`).update({"data.status":"disabled"});
    const disabledBefore=await readAdmin(adminDb,uid);
    const disabled=await execution.executeTrustedAccountBootstrap({idToken:transientIdToken,verifyIdToken:verifier,runAtomicAccountBootstrap:adapter});
    assert.equal(disabled.action,"existing");
    assert.equal(disabled.status,"disabled");
    const disabledAfter=await readAdmin(adminDb,uid);
    assert.equal(disabledAfter.data.status,"disabled");
    assert.equal(disabledAfter.updatedAt.toMillis(),disabledBefore.updatedAt.toMillis());

    const deletionTime=Timestamp.fromMillis(FIXED_TIME_MILLIS+60_000);
    await adminDb.doc(`accounts/${uid}`).update({"data.status":"deletion-pending","data.deletionRequestedAt":deletionTime});
    const deletionBefore=await readAdmin(adminDb,uid);
    const deletion=await execution.executeTrustedAccountBootstrap({idToken:transientIdToken,verifyIdToken:verifier,runAtomicAccountBootstrap:adapter});
    assert.equal(deletion.action,"existing");
    assert.equal(deletion.status,"deletion-pending");
    const deletionAfter=await readAdmin(adminDb,uid);
    assert.equal(deletionAfter.data.status,"deletion-pending");
    assert.equal(deletionAfter.data.deletionRequestedAt.toMillis(),deletionBefore.data.deletionRequestedAt.toMillis());

    await adminDb.doc(`accounts/${uid}`).delete();
    const concurrentVerifier=(idToken,checkRevoked)=>adminAuth.verifyIdToken(idToken,checkRevoked);
    const concurrencyObservations=[];
    const concurrentAdapter=makeAtomicAdapter(adminDb,concurrencyObservations);
    const concurrentResults=await Promise.all([
      execution.executeTrustedAccountBootstrap({idToken:transientIdToken,verifyIdToken:concurrentVerifier,runAtomicAccountBootstrap:concurrentAdapter}),
      execution.executeTrustedAccountBootstrap({idToken:transientIdToken,verifyIdToken:concurrentVerifier,runAtomicAccountBootstrap:concurrentAdapter})
    ]);
    assert.deepEqual(concurrentResults.map(result=>result.action).sort(),["created","existing"],"Two racing bootstrap requests must converge on one create and one existing/no-write result.");
    const afterConcurrent=await readAdmin(adminDb,uid);
    assert.equal(afterConcurrent.objectId,uid);
    assert.equal(afterConcurrent.revision,0);
    assert.equal(afterConcurrent.updatedByDeviceId,null);

    const conflicting={...afterConcurrent,objectId:"conflicting_stored_account"};
    await adminDb.doc(`accounts/${uid}`).set(conflicting);
    const conflictBefore=await readAdmin(adminDb,uid);
    const conflict=await execution.executeTrustedAccountBootstrap({idToken:transientIdToken,verifyIdToken:concurrentVerifier,runAtomicAccountBootstrap:concurrentAdapter});
    assert.equal(conflict.ok,false);
    assert.equal(conflict.code,"ACCOUNT_DOCUMENT_IDENTITY_CONFLICT");
    const conflictAfter=await readAdmin(adminDb,uid);
    assert.equal(conflictAfter.objectId,"conflicting_stored_account","Conflicting stored identity must never be repaired by overwrite.");
    assert.equal(conflictAfter.contentHash,conflictBefore.contentHash);

    const transactionFailure=await execution.executeTrustedAccountBootstrap({
      idToken:transientIdToken,
      verifyIdToken:concurrentVerifier,
      runAtomicAccountBootstrap:async()=>{throw new Error(`sensitive provider diagnostic ${transientIdToken}`);}
    });
    assert.equal(transactionFailure.code,"TRUSTED_ACCOUNT_TRANSACTION_FAILED");
    assert.equal(JSON.stringify(transactionFailure).includes(transientIdToken),false);
    assert.equal(JSON.stringify(transactionFailure).includes("sensitive provider diagnostic"),false);

    const invalidResult=await execution.executeTrustedAccountBootstrap({
      idToken:transientIdToken,
      verifyIdToken:concurrentVerifier,
      runAtomicAccountBootstrap:async()=>({committed:false})
    });
    assert.equal(invalidResult.code,"TRUSTED_ACCOUNT_TRANSACTION_RESULT_INVALID");

    await adminDb.doc(`accounts/${uid}`).delete();
    const commitMismatch=await execution.executeTrustedAccountBootstrap({
      idToken:transientIdToken,
      verifyIdToken:concurrentVerifier,
      runAtomicAccountBootstrap:async request=>({committed:false,decision:request.decide(null)})
    });
    assert.equal(commitMismatch.code,"TRUSTED_ACCOUNT_TRANSACTION_COMMIT_MISMATCH");
    assert.equal(await readAdmin(adminDb,uid),null);

    const adminObserved=await adminAuth.getUser(uid);
    assert.equal(adminObserved.uid,uid);
    assert.notEqual(uid,"profile_stage2g_fixture");
    assert.notEqual(uid,"device_stage2g_fixture");
    assert.notEqual(uid,"rivalry_stage2g_fixture");
    assert.notEqual(uid,"session_stage2g_fixture");

    process.stdout.write("PASS Stage 2G trusted revocation-aware atomic account-bootstrap execution and client-write denial proof\n");
  }finally{
    for(const client of clients){
      try{await signOut(client.auth);}catch(_){}
      try{await terminate(client.db);}catch(_){}
      try{await deleteApp(client.app);}catch(_){}
    }
    for(const uid of createdUids){
      try{await adminAuth.deleteUser(uid);}catch(_){}
    }
    try{await deleteAdminApp(adminApp);}catch(_){}
    try{await testEnv.clearFirestore();}catch(_){}
    await testEnv.cleanup();
  }
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
