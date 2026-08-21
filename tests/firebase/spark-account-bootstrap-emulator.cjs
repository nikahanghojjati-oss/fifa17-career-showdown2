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
  runTransaction,
  setDoc,
  updateDoc
}=require("firebase/firestore");
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");
const spark=require("../../js/sparkAccountBootstrap.js");

const PROJECT_ID="demo-career-mode-showdown-phase1f";
const RULES=fs.readFileSync("firestore.spark.rules","utf8");

function sdk(){
  return {Timestamp,doc,runTransaction};
}

function validEnvelope(uid,overrides={}){
  const now=Timestamp.fromMillis(1_700_900_000_000);
  return {
    schemaVersion:1,
    objectType:"account",
    objectId:uid,
    revision:0,
    parentRevision:null,
    lifecycleState:"live",
    contentHash:`sha256:${"0".repeat(64)}`,
    priorContentHash:null,
    updatedAt:now,
    updatedByAccountId:uid,
    updatedByDeviceId:null,
    data:{status:"active",createdAt:now,deletionRequestedAt:null},
    tombstone:null,
    ...overrides
  };
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await testEnv.clearFirestore();
    const dbA=testEnv.authenticatedContext("acct_spark_a").firestore();
    const dbB=testEnv.authenticatedContext("acct_spark_b").firestore();
    const dbC=testEnv.authenticatedContext("acct_spark_c").firestore();
    const dbD=testEnv.authenticatedContext("acct_spark_d").firestore();
    const anon=testEnv.unauthenticatedContext().firestore();

    const created=await spark.bootstrap({
      user:{uid:"acct_spark_a",email:"ignored@example.test",displayName:"Ignored"},
      firestore:dbA,
      firebaseSdk:sdk(),
      cryptoImpl:crypto.webcrypto
    });
    assert.equal(created.ok,true);
    assert.equal(created.action,"created");
    assert.equal(created.accountId,"acct_spark_a");
    assert.equal(created.revision,0);

    const stored=await assertSucceeds(getDoc(doc(dbA,"accounts","acct_spark_a")));
    assert.equal(stored.exists(),true);
    const data=stored.data();
    assert.equal(data.schemaVersion,1);
    assert.equal(data.objectType,"account");
    assert.equal(data.objectId,"acct_spark_a");
    assert.equal(data.revision,0);
    assert.equal(data.parentRevision,null);
    assert.equal(data.lifecycleState,"live");
    assert.match(data.contentHash,/^sha256:[0-9a-f]{64}$/);
    assert.equal(data.updatedByAccountId,"acct_spark_a");
    assert.equal(data.updatedByDeviceId,null);
    assert.equal(data.data.status,"active");
    assert.equal(data.data.deletionRequestedAt,null);
    assert.equal(Object.hasOwn(data,"email"),false);
    assert.equal(Object.hasOwn(data,"displayName"),false);

    const repeated=await spark.bootstrap({
      user:{uid:"acct_spark_a"},
      firestore:dbA,
      firebaseSdk:sdk(),
      cryptoImpl:crypto.webcrypto
    });
    assert.equal(repeated.ok,true);
    assert.equal(repeated.action,"existing");
    assert.equal(repeated.preserveExisting,true);
    assert.equal(repeated.revision,0);

    await assertFails(setDoc(doc(dbA,"accounts","acct_spark_b"),validEnvelope("acct_spark_b")));
    await assertFails(setDoc(doc(anon,"accounts","acct_spark_anon"),validEnvelope("acct_spark_anon")));
    await assertSucceeds(setDoc(doc(dbC,"accounts","acct_spark_c"),validEnvelope("acct_spark_c")));

    const badSchema=validEnvelope("acct_spark_b",{schemaVersion:2});
    await assertFails(setDoc(doc(dbB,"accounts","acct_spark_b"),badSchema));
    const extraField={...validEnvelope("acct_spark_b"),email:"must-not-be-stored@example.test"};
    await assertFails(setDoc(doc(dbB,"accounts","acct_spark_b"),extraField));
    const wrongActor=validEnvelope("acct_spark_d",{updatedByAccountId:"acct_other"});
    await assertFails(setDoc(doc(dbD,"accounts","acct_spark_d"),wrongActor));

    await assertFails(updateDoc(doc(dbA,"accounts","acct_spark_a"),{"data.status":"disabled"}));
    await assertFails(deleteDoc(doc(dbA,"accounts","acct_spark_a")));
    await assertFails(getDocs(collection(dbA,"accounts")));
    await assertFails(setDoc(doc(dbA,"accounts","acct_spark_a","devices","device_spark_a"),{state:"active"}));
    await assertFails(setDoc(doc(dbA,"rivalries","rivalry_spark_a"),{authorizedAccountIds:["acct_spark_a"]}));

    await testEnv.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"accounts","acct_spark_b"),{broken:true});
    });
    const conflict=await spark.bootstrap({
      user:{uid:"acct_spark_b"},
      firestore:dbB,
      firebaseSdk:sdk(),
      cryptoImpl:crypto.webcrypto
    });
    assert.equal(conflict.ok,false);
    assert.equal(conflict.code,"SPARK_ACCOUNT_DOCUMENT_CONFLICT");

    process.stdout.write("PASS Spark zero-billing authenticated self-account bootstrap and deny-by-default downstream boundary\n");
  }finally{
    try{await testEnv.clearFirestore();}catch(_){}
    await testEnv.cleanup();
  }
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
