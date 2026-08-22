const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=file=>fs.readFileSync(file,"utf8");
const runtime=require("../../js/productionFirebaseRuntime.js");
const controllerSource=read("js/sparkConnectedAccount.js");
const runtimeSource=read("js/productionFirebaseRuntime.js");
const sparkRules=read("firestore.spark.rules");
const FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state";

assert.equal(runtime.contractVersion,2);
assert.equal(runtime.provider,"google");
assert.equal(runtime.signInFlow,"popup");
assert.equal(runtime.authPersistence,"browserSessionPersistence");
assert.equal(runtime.persistentFirestoreCache,false);
assert.equal(runtime.billingRequired,false);
assert.equal(runtime.blazeRequired,false);
assert.equal(runtime.cloudRunRequired,false);
assert.equal(runtime.cloudFunctionsRequired,false);
assert.equal(runtime.browserFirestoreWrites,FIRESTORE_WRITE_SCOPE);
assert.equal(runtime.additionalGoogleScopes,0);
assert.match(runtimeSource,/firebase-auth\.js/);
assert.match(runtimeSource,/firebase-firestore\.js/);
assert.match(runtimeSource,/browserSessionPersistence/);
assert.match(runtimeSource,/memoryLocalCache/);
assert.match(runtimeSource,/signInWithPopup/);
assert.match(runtimeSource,/function connectedAccountSettingsOpen\(\)/);
assert.match(runtimeSource,/function mountConnectedAccountSettings\(\)/);
assert.match(runtimeSource,/new root\.MutationObserver/);
assert.match(runtimeSource,/target\.id==="settingsOverlay"/);
assert.match(runtimeSource,/requestMount\(\);/);
assert.match(runtimeSource,/BROWSER_FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state"/);
assert.doesNotMatch(runtimeSource,/signInWithRedirect|firebase-functions|firebase-storage|getFunctions|getStorage/);

assert.match(controllerSource,/new sparkConnectedServices\.authSdk\.GoogleAuthProvider\(\)/);
assert.match(controllerSource,/signInWithPopup\(sparkConnectedServices\.auth,provider\)/);
assert.match(controllerSource,/setPersistence\(sparkConnectedServices\.auth,authSdk\.browserSessionPersistence\)/);
assert.match(controllerSource,/CareerModeSparkAccountBootstrap/);
assert.match(controllerSource,/Remote Joining is still locked|REMOTE JOINING","Locked/);
assert.match(controllerSource,/Firebase Spark · no billing/);
assert.doesNotMatch(controllerSource,/addScope\(|signInWithRedirect|credentialFromResult|getIdToken|getIdTokenResult|refreshToken/);
assert.doesNotMatch(controllerSource,/localStorage|sessionStorage|indexedDB/);
assert.match(sparkRules,/allow create: if validSelfAccountBootstrap\(accountId\)/);
assert.match(sparkRules,/match \/devices\/\{deviceId\}[\s\S]*?allow create: if validDeviceCreate\(accountId, deviceId\)[\s\S]*?allow update: if validDeviceRevoke\(accountId, deviceId\)[\s\S]*?allow list, delete: if false/);
assert.match(sparkRules,/match \/rivalries\/\{rivalryId\}[\s\S]*?allow create: if validInitialRivalryCreate\(rivalryId\)[\s\S]*?allow update: if validRivalryRedeem\(rivalryId\)[\s\S]*?allow list, delete: if false/);
assert.match(sparkRules,/match \/state\/authoritative[\s\S]*?allow create: if validSharedStateCreate\(rivalryId\)[\s\S]*?allow update: if validSharedStateUpdate\(rivalryId\)[\s\S]*?allow list, delete: if false/);
assert.match(sparkRules,/match \/sessions\/\{sessionId\}[\s\S]*?allow list, create, update, delete: if false/);

const calls=[];
global.CareerModeSparkAccountBootstrap={
  async bootstrap(input){
    calls.push(["bootstrap",input.user.uid]);
    return {ok:true,action:"created",accountId:input.user.uid,revision:0,status:"active"};
  }
};
delete require.cache[require.resolve("../../js/sparkConnectedAccount.js")];
const account=require("../../js/sparkConnectedAccount.js");

assert.equal(account.provider,"google");
assert.equal(account.signInFlow,"popup");
assert.equal(account.authPersistence,"browserSessionPersistence");
assert.equal(account.firestorePersistence,"memory-only");
assert.equal(account.billingRequired,false);
assert.equal(account.blazeRequired,false);
assert.equal(account.cloudRunRequired,false);
assert.equal(account.cloudFunctionsRequired,false);
assert.equal(account.additionalGoogleScopes,0);
assert.equal(account.writeScope,"self-account-create-only","Connected Account controller itself remains limited to self-account bootstrap; pairing and Connected Rivalry are separate modules behind Security Rules.");

const auth={currentUser:null};
class GoogleProvider{constructor(){calls.push(["provider"]);}}
const services={
  ok:true,
  auth,
  firestore:{name:"memory-firestore"},
  authSdk:{
    GoogleAuthProvider:GoogleProvider,
    browserSessionPersistence:{type:"SESSION"},
    async setPersistence(target,persistence){assert.equal(target,auth);calls.push(["setPersistence",persistence.type]);},
    onAuthStateChanged(target){assert.equal(target,auth);calls.push(["onAuthStateChanged"]);return ()=>{};},
    async signInWithPopup(target,provider){assert.equal(target,auth);assert.ok(provider instanceof GoogleProvider);calls.push(["signInWithPopup"]);return {user:{uid:"acct_production_spark",displayName:"Player One",email:"player@example.test"}};},
    async signOut(target){assert.equal(target,auth);calls.push(["signOut"]);}
  },
  firestoreSdk:{Timestamp:{now(){return {seconds:1,nanoseconds:0};}},doc(){},runTransaction(){}}
};
const mockRuntime={async ensureAccountServices(){calls.push(["ensureAccountServices"]);return services;}};

(async()=>{
  const initialized=await account.initialize({runtime:mockRuntime});
  assert.equal(initialized.status,"signed-out");
  assert.deepEqual(calls.slice(0,3).map(call=>call[0]),["ensureAccountServices","setPersistence","onAuthStateChanged"]);

  const signedIn=await account.signIn();
  assert.equal(signedIn.status,"ready");
  assert.equal(signedIn.signedIn,true);
  assert.equal(signedIn.connected,true);
  assert.equal(signedIn.accountId,"acct_production_spark");
  assert.ok(calls.find(call=>call[0]==="signInWithPopup"));
  assert.deepEqual(calls.find(call=>call[0]==="bootstrap"),["bootstrap","acct_production_spark"]);
  assert.ok(calls.findIndex(call=>call[0]==="setPersistence")<calls.findIndex(call=>call[0]==="signInWithPopup"),"browserSessionPersistence must be set before popup sign-in.");

  const signedOut=await account.signOut();
  assert.equal(signedOut.status,"signed-out");
  assert.equal(signedOut.signedIn,false);
  assert.equal(signedOut.connected,false);
  assert.equal(signedOut.accountId,null);

  process.stdout.write("PASS Spark production connected-account policy: Google popup, session-only Auth, memory-only Firestore, bounded private Rules authority, durable Settings mount and zero-billing boundary\n");
})().catch(error=>{console.error(error);process.exit(1);});
