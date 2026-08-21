const assert=require("node:assert/strict");
const fs=require("node:fs");
const bootstrap=require("../../js/productionAppCheckBootstrap.js");

const read=file=>fs.readFileSync(file,"utf8");
const index=read("index.html");
const app=read("js/app.js");
const worker=read("service-worker.js");
const manifest=read("manifest.webmanifest");
const runtimeSource=read("js/productionFirebaseRuntime.js");
const placeholderSource=read("firebase.runtime-config.json");
const placeholder=JSON.parse(placeholderSource);
const renderer=read("scripts/render-production-firebase-public-config.mjs");
const historicalRelease=read("RELEASE_V1.4.0_R2.md");

function freshRuntime(){
  const path=require.resolve("../../js/productionFirebaseRuntime.js");
  delete require.cache[path];
  return require(path);
}

const runtime=freshRuntime();
assert.equal(runtime.contractVersion,2);
assert.equal(runtime.productionOrigin,"https://nikahanghojjati-oss.github.io");
assert.equal(runtime.productionPathPrefix,"/fifa17-career-showdown2/");
assert.equal(runtime.firebaseSdkVersion,"12.17.0");
assert.equal(runtime.runtimeConfigPath,"firebase.runtime-config.json");
assert.equal(runtime.bootstrapPath,"js/productionAppCheckBootstrap.js");
assert.equal(runtime.connectedAccountPath,"js/sparkConnectedAccount.js");
assert.equal(runtime.enforcementEnabled,false);
assert.equal(runtime.browserFirestoreWrites,"self-account-create-only");
assert.equal(runtime.authPersistence,"browserSessionPersistence");
assert.equal(runtime.persistentFirestoreCache,false);
assert.equal(runtime.billingRequired,false);
assert.equal(runtime.blazeRequired,false);
assert.equal(runtime.cloudRunRequired,false);
assert.equal(runtime.cloudFunctionsRequired,false);
assert.equal(runtime.provider,"google");
assert.equal(runtime.signInFlow,"popup");
assert.equal(runtime.additionalGoogleScopes,0);
assert.equal(Object.isFrozen(runtime),true);

assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true}),"eligible");
assert.equal(runtime.classifyContext({origin:"http://localhost:8080",pathname:"/fifa17-career-showdown2/",online:true}),"non-production-origin");
assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/other-app/",online:true}),"non-production-path");
assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:false}),"offline");

assert.equal(placeholder.schemaVersion,1);
assert.equal(placeholder.configured,false);
assert.equal(Object.hasOwn(placeholder.firebaseConfig,"apiKey"),false);
assert.equal(placeholder.recaptchaEnterpriseSiteKey,"");
assert.doesNotMatch(placeholderSource,/AIza[0-9A-Za-z_-]{35}/);
assert.match(renderer,/CMS_FIREBASE_WEB_API_KEY/);
assert.match(renderer,/CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
assert.match(renderer,/configured:true/);
assert.match(renderer,/without printing provider-issued values/i);
assert.doesNotMatch(renderer,/console\.log\([^\n]*(?:apiKey|siteKey)/i);

// The immutable 1.4.0-r2 release record remains the production App Check proof baseline.
// PR #126 is a whole-shell hotfix above the merged PR #125 r1 account release; it must
// preserve the same App Check boundary while retaining r1 as immediate rollback.
const currentRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
assert.match(currentRevision,/^1\.5\.0-r2$/,"PR #126 must expose the intended v1.5.0-r2 whole-shell Settings hotfix without rewriting the historical App Check proof.");
for(const path of ["js/storage.js","js/showdown.js","js/scoring.js","js/screens.js","js/menuExperience.js","js/optionalModules.js","js/app.js"]){
  assert.ok(index.includes(`${path}?v=${currentRevision}`),`${path} must use the current candidate shell revision.`);
}
assert.ok(app.includes(`visual-fidelity-r3.css?v=${currentRevision}`));
assert.match(app,/productionFirebaseRuntime\.js\?v=\$\{r\}/);
assert.match(app,/requestAnimationFrame\(\(\)=>\{ra\(\);so\(\);sd\(\);\}\)/,"Firebase must remain post-local-startup/lazy rather than blocking application initialization.");
assert.ok(worker.includes(`const RUNTIME_REVISION = "${currentRevision}";`));
assert.match(worker,/const PREVIOUS_RUNTIME_REVISION = "1\.5\.0-r1";/);
assert.ok(worker.includes('"js/productionFirebaseRuntime.js"'));
assert.doesNotMatch(worker,/productionAppCheckBootstrap\.js/);
assert.ok(manifest.includes(currentRevision),"Manifest must use the current candidate shell revision.");
assert.match(historicalRelease,/Runtime asset revision: `1\.4\.0-r2`/);
assert.match(historicalRelease,/Previous known-good runtime: `1\.4\.0-r1`/);
assert.match(historicalRelease,/App Check enforcement remains OFF/);

assert.match(runtimeSource,/firebase-app\.js/);
assert.match(runtimeSource,/firebase-app-check\.js/);
assert.match(runtimeSource,/firebase-auth\.js/);
assert.match(runtimeSource,/firebase-firestore\.js/);
assert.match(runtimeSource,/getToken\(initialized\.appCheck,false\)/);
assert.match(runtimeSource,/requestIdleCallback/);
assert.match(runtimeSource,/runtime-config-not-configured/);
assert.match(runtimeSource,/local mode remains active/i);
assert.match(runtimeSource,/initializeFirestore\(productionApp,\{localCache:sdk\.memoryLocalCache\(\)\}\)/);
assert.match(runtimeSource,/browserSessionPersistence/);
assert.doesNotMatch(runtimeSource,/firebase-functions|firebase-storage|getFunctions|getStorage/i);
assert.doesNotMatch(runtimeSource,/DebugAppCheckProvider|FIREBASE_APPCHECK_DEBUG_TOKEN/i);

const validRuntimeConfig={
  schemaVersion:1,
  configured:true,
  firebaseConfig:{
    apiKey:"controlled-public-web-config-injection",
    authDomain:"fifa17-career-showdown-prod.firebaseapp.com",
    projectId:"fifa17-career-showdown-prod",
    storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",
    messagingSenderId:"409396353288",
    appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"
  },
  recaptchaEnterpriseSiteKey:"controlled-public-site-key-injection"
};
const eligible={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};

function appCheckSdk(calls){
  class EnterpriseProvider{constructor(siteKey){this.siteKey=siteKey;calls.push(["provider",siteKey]);}}
  return {
    initializeApp(config){calls.push(["initializeApp",config]);return {name:"production-app"};},
    ReCaptchaEnterpriseProvider:EnterpriseProvider,
    initializeAppCheck(appInstance,options){calls.push(["initializeAppCheck",appInstance,options]);return {name:"app-check"};},
    async getToken(appCheck,forceRefresh){calls.push(["getToken",appCheck,forceRefresh]);return {token:"opaque-test-token-never-exposed",expireTimeMillis:1893456000000};}
  };
}

(async()=>{
  const readyRuntime=freshRuntime();
  const baseCalls=[];
  const ready=await readyRuntime.initialize({context:eligible,runtimeConfig:validRuntimeConfig,bootstrap,firebaseSdk:appCheckSdk(baseCalls)});
  assert.equal(ready.status,"ready");
  assert.equal(ready.connected,true);
  assert.equal(ready.tokenObserved,true);
  assert.equal(ready.enforcement,false);
  assert.equal(ready.authInitialized,false);
  assert.equal(ready.firestoreInitialized,false);
  assert.equal(ready.persistentFirestoreCache,false);
  assert.equal(ready.browserFirestoreWrites,"self-account-create-only");
  assert.equal(Object.hasOwn(ready,"token"),false,"Raw App Check token must never enter runtime diagnostics.");
  assert.deepEqual(baseCalls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck","getToken"],"Base initialization must remain App + App Check only.");
  assert.equal(baseCalls[2][2].isTokenAutoRefreshEnabled,true);
  assert.equal(baseCalls[3][2],false);

  const accountCalls=[];
  const sessionPersistence={type:"SESSION"};
  const accountSdk={
    getAuth(appInstance){accountCalls.push(["getAuth",appInstance]);return {name:"auth"};},
    GoogleAuthProvider:function GoogleAuthProvider(){},
    async signInWithPopup(){},
    async signOut(){},
    onAuthStateChanged(){return ()=>{};},
    async setPersistence(){},
    browserSessionPersistence:sessionPersistence,
    initializeFirestore(appInstance,options){accountCalls.push(["initializeFirestore",appInstance,options]);return {name:"firestore"};},
    memoryLocalCache(){accountCalls.push(["memoryLocalCache"]);return {kind:"memory"};},
    Timestamp:{now(){return {seconds:1,nanoseconds:0};}},
    doc(){},
    runTransaction(){}
  };
  const accountServices=await readyRuntime.ensureAccountServices({context:eligible,accountSdk});
  assert.equal(accountServices.ok,true);
  assert.equal(accountServices.authPersistence,"browserSessionPersistence");
  assert.equal(accountServices.persistentFirestoreCache,false);
  assert.equal(accountServices.writeScope,"self-account-create-only");
  assert.equal(accountServices.billingRequired,false);
  assert.equal(accountServices.cloudRunRequired,false);
  assert.deepEqual(accountCalls.map(call=>call[0]),["getAuth","memoryLocalCache","initializeFirestore"],"Auth/Firestore must initialize only after explicit account-service demand, with memory cache.");
  assert.deepEqual(accountCalls[2][2],{localCache:{kind:"memory"}});

  const invalidRuntime=freshRuntime();
  const invalid=await invalidRuntime.initialize({context:eligible,runtimeConfig:{...validRuntimeConfig,firebaseConfig:{...validRuntimeConfig.firebaseConfig,projectId:"wrong-project"}},bootstrap,firebaseSdk:appCheckSdk([])});
  assert.equal(invalid.status,"APP_CHECK_PROJECT_ID_MISMATCH");
  assert.equal(invalid.connected,false);

  const offlineRuntime=freshRuntime();
  const offline=await offlineRuntime.initialize({context:{...eligible,online:false},runtimeConfig:validRuntimeConfig,bootstrap,firebaseSdk:appCheckSdk([])});
  assert.equal(offline.status,"offline");
  assert.equal(offline.attempted,false);
  assert.equal(offline.connected,false);

  const failureRuntime=freshRuntime();
  const failureSdk=appCheckSdk([]);
  failureSdk.getToken=async()=>{throw new Error("synthetic provider outage");};
  const providerFailure=await failureRuntime.initialize({context:eligible,runtimeConfig:validRuntimeConfig,bootstrap,firebaseSdk:failureSdk});
  assert.equal(providerFailure.status,"app-check-runtime-unavailable");
  assert.equal(providerFailure.connected,false);
  assert.equal(providerFailure.tokenObserved,false);

  process.stdout.write("PASS production Firebase runtime keeps the proven App Check boundary local-first while the v1.5 Spark Auth + memory-only Firestore path activates only on explicit connected-account demand\n");
})().catch(error=>{console.error(error);process.exit(1);});