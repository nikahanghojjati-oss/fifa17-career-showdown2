const assert=require("node:assert/strict");
const fs=require("node:fs");
const bootstrap=require("../../js/productionAppCheckBootstrap.js");

const read=file=>fs.readFileSync(file,"utf8");
const index=read("index.html");
const app=read("js/app.js");
const ssjrBootstrap=read("js/ssjr.js");
const worker=read("service-worker.js");
const manifest=read("manifest.webmanifest");
const runtimeSource=read("js/productionFirebaseRuntime.js");
const productionAuditSource=read("tests/browser/production-app-check-runtime-audit.cjs");
const placeholderSource=read("firebase.runtime-config.json");
const placeholder=JSON.parse(placeholderSource);
const renderer=read("scripts/render-production-firebase-public-config.mjs");
const pkg=JSON.parse(read("package.json"));
const historicalAppCheckRelease=read("RELEASE_V1.4.0_R2.md");
const historicalConnectedAccountHotfix=read("RELEASE_V1.5.0_R2.md");
const candidateRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const candidateGeneration=Number((candidateRevision&&candidateRevision.match(/-r(\d+)$/)||[])[1]);
const currentRelease=read(candidateGeneration===1?`RELEASE_V${pkg.version}.md`:`RELEASE_V${pkg.version}_R${candidateGeneration}.md`);
const FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state";

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
assert.equal(runtime.browserFirestoreWrites,FIRESTORE_WRITE_SCOPE);
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

// Historical proof remains pinned to the releases that actually established it.
// Current source may advance to later product releases as long as the same local-first
// App Check/Auth/Firestore boundary and coherent whole-shell revision discipline remain intact.
const currentRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const currentAppVersion=(app.match(/const APP_VERSION = "([^"]+)"/)||[])[1];
assert.ok(currentAppVersion,"Current APP_VERSION is missing.");
assert.equal(currentAppVersion,pkg.version,"Current APP_VERSION must match package release identity.");
assert.match(currentRevision,new RegExp(`^${currentAppVersion.replace(/\./g,"\\.")}-r[1-9]\\d*$`),"Current shell revision must advance coherently with APP_VERSION instead of being frozen to PR #126.");
for(const path of ["js/storage.js","js/showdown.js","js/scoring.js","js/screens.js","js/menuExperience.js","js/optionalModules.js","js/app.js"]){
  assert.ok(index.includes(`${path}?v=${currentRevision}`),`${path} must use the current candidate shell revision.`);
}
assert.ok(app.includes(`visual-fidelity-r3.css?v=${currentRevision}`));
assert.match(app,/f\.src=`js\/ssjr\.js\?v=\$\{r\}`/,"Protected startup shell must version-load the SSJR bootstrap instead of directly loading production Firebase.");
assert.doesNotMatch(app,/productionFirebaseRuntime\.js\?v=\$\{r\}/,"Production Firebase must remain behind the lazy SSJR bootstrap to preserve startup budget.");
assert.match(ssjrBootstrap,/load\("firebase-runtime","js\/productionFirebaseRuntime\.js"/,"SSJR bootstrap must retain the production Firebase runtime behind the existing version-aware runtime loader.");
assert.match(app,/requestAnimationFrame\(\(\)=>\{ra\(\);so\(\);sd\(\);\}\)/,"Firebase must remain post-local-startup/lazy rather than blocking application initialization.");
assert.ok(worker.includes(`const RUNTIME_REVISION = "${currentRevision}";`));
const previousKnownGood=(currentRelease.match(/Previous known-good runtime:\s*`([^`]+)`/i)||[])[1];
assert.ok(previousKnownGood,"Current release must name its previous known-good whole-shell runtime.");
assert.ok(worker.includes(`const PREVIOUS_RUNTIME_REVISION = "${previousKnownGood}";`),"Service Worker rollback target must match the current release record.");
assert.ok(worker.includes('"js/productionFirebaseRuntime.js"'));
const workerShellStart=worker.indexOf("const SHELL_PATHS");
const workerShellEnd=worker.indexOf("]);",workerShellStart);
assert.ok(workerShellStart>=0&&workerShellEnd>workerShellStart,"Service worker must expose a bounded SHELL_PATHS list.");
assert.doesNotMatch(worker.slice(workerShellStart,workerShellEnd),/productionAppCheckBootstrap\.js/,"Lazy App Check bootstrap must remain outside the offline shell dependency.");
assert.match(worker,/const APP_CHECK_BOOTSTRAP_PATH = "js\/productionAppCheckBootstrap\.js";/,"Service worker must identify the optional bootstrap separately from the shell.");
assert.match(worker,/if\(path===APP_CHECK_BOOTSTRAP_PATH\)\{return;\}/,"Optional production bootstrap must bypass shell-only interception.");
assert.ok(manifest.includes(currentRevision),"Manifest must use the current candidate shell revision.");

// Immutable App Check proof baseline.
assert.match(historicalAppCheckRelease,/Runtime asset revision: `1\.4\.0-r2`/);
assert.match(historicalAppCheckRelease,/Previous known-good runtime: `1\.4\.0-r1`/);
assert.match(historicalAppCheckRelease,/App Check enforcement remains OFF/);
// Immutable PR #126 Connected Account hotfix provenance.
assert.match(historicalConnectedAccountHotfix,/Runtime asset revision: `1\.5\.0-r2`/);
assert.match(historicalConnectedAccountHotfix,/Previous known-good runtime: `1\.5\.0-r1`/);
assert.match(historicalConnectedAccountHotfix,/production runtime hotfix/i);

assert.match(runtimeSource,/firebase-app\.js/);
assert.match(runtimeSource,/firebase-app-check\.js/);
assert.match(runtimeSource,/firebase-auth\.js/);
assert.match(runtimeSource,/firebase-firestore\.js/);
assert.match(runtimeSource,/getToken\(initialized\.appCheck,false\)/);
assert.match(runtimeSource,/ready-app-check-degraded/);
assert.match(runtimeSource,/enforcement is off, so Connected Account remains available/i);
assert.doesNotMatch(runtimeSource,/requestIdleCallback|setTimeout\(run,900\)/,"Production Firebase must not add a second idle delay after the post-startup loader.");
assert.match(runtimeSource,/const launch=\(\)=>\{initializeProductionFirebaseRuntime\(\)\.catch\(\(\)=>undefined\);\}/,"Production Firebase should initialize promptly once its already-lazy runtime script executes.");
assert.match(runtimeSource,/runtime-config-not-configured/);
assert.match(runtimeSource,/local mode remains active/i);
assert.match(runtimeSource,/initializeFirestore\(productionApp,\{localCache:sdk\.memoryLocalCache\(\)\}\)/);
assert.match(runtimeSource,/browserSessionPersistence/);
assert.match(runtimeSource,/BROWSER_FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state"/);
assert.doesNotMatch(runtimeSource,/firebase-functions|firebase-storage|getFunctions|getStorage/i);
assert.doesNotMatch(runtimeSource,/DebugAppCheckProvider|FIREBASE_APPCHECK_DEBUG_TOKEN/i);
assert.match(productionAuditSource,/expectedBrowserFirestoreWriteScope = "spark-private-account-device-pairing-connected-rivalry-state"/);
assert.match(productionAuditSource,/appCheckDependencyFailures/);
assert.match(productionAuditSource,/appCheckRuntimeMessages/);
assert.match(productionAuditSource,/Redacted evidence/);
assert.match(productionAuditSource,/redacted-browser-key/);
assert.doesNotMatch(productionAuditSource,/diagnostics\.browserFirestoreWrites, "deny-all"/);

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

function accountSdk(calls){
  const sessionPersistence={type:"SESSION"};
  return {
    getAuth(appInstance){calls.push(["getAuth",appInstance]);return {name:"auth"};},
    GoogleAuthProvider:function GoogleAuthProvider(){},
    async signInWithPopup(){},
    async signOut(){},
    onAuthStateChanged(){return ()=>{};},
    async setPersistence(){},
    browserSessionPersistence:sessionPersistence,
    initializeFirestore(appInstance,options){calls.push(["initializeFirestore",appInstance,options]);return {name:"firestore"};},
    memoryLocalCache(){calls.push(["memoryLocalCache"]);return {kind:"memory"};},
    Timestamp:{now(){return {seconds:1,nanoseconds:0};}},
    serverTimestamp(){return {kind:"server-timestamp"};},
    doc(){},
    runTransaction(){}
  };
}

(async()=>{
  const readyRuntime=freshRuntime();
  const baseCalls=[];
  const ready=await readyRuntime.initialize({context:eligible,runtimeConfig:validRuntimeConfig,bootstrap,firebaseSdk:appCheckSdk(baseCalls)});
  assert.equal(ready.status,"ready");
  assert.equal(ready.connected,true);
  assert.equal(ready.tokenObserved,true);
  assert.equal(ready.appCheckDegraded,false);
  assert.equal(ready.enforcement,false);
  assert.equal(ready.authInitialized,false);
  assert.equal(ready.firestoreInitialized,false);
  assert.equal(ready.persistentFirestoreCache,false);
  assert.equal(ready.browserFirestoreWrites,FIRESTORE_WRITE_SCOPE);
  assert.equal(Object.hasOwn(ready,"token"),false,"Raw App Check token must never enter runtime diagnostics.");
  assert.deepEqual(baseCalls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck","getToken"],"Base initialization must remain App + App Check only.");
  assert.equal(baseCalls[2][2].isTokenAutoRefreshEnabled,true);
  assert.equal(baseCalls[3][2],false);

  const accountCalls=[];
  const accountServices=await readyRuntime.ensureAccountServices({context:eligible,accountSdk:accountSdk(accountCalls)});
  assert.equal(accountServices.ok,true);
  assert.equal(accountServices.authPersistence,"browserSessionPersistence");
  assert.equal(accountServices.persistentFirestoreCache,false);
  assert.equal(accountServices.writeScope,FIRESTORE_WRITE_SCOPE);
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
  assert.equal(providerFailure.status,"ready-app-check-degraded");
  assert.equal(providerFailure.connected,true);
  assert.equal(providerFailure.tokenObserved,false);
  assert.equal(providerFailure.appCheckDegraded,true);
  assert.equal(providerFailure.enforcement,false);
  assert.equal(Object.hasOwn(providerFailure,"token"),false,"Degraded diagnostics must not expose a raw App Check token.");

  const degradedAccountCalls=[];
  const degradedAccountServices=await failureRuntime.ensureAccountServices({context:eligible,accountSdk:accountSdk(degradedAccountCalls)});
  assert.equal(degradedAccountServices.ok,true,"An unenforced App Check token outage must not disable Connected Account.");
  assert.equal(degradedAccountServices.authPersistence,"browserSessionPersistence");
  assert.equal(degradedAccountServices.persistentFirestoreCache,false);
  assert.equal(degradedAccountServices.writeScope,FIRESTORE_WRITE_SCOPE);
  assert.deepEqual(degradedAccountCalls.map(call=>call[0]),["getAuth","memoryLocalCache","initializeFirestore"]);
  const degradedDiagnostics=failureRuntime.diagnostics();
  assert.equal(degradedDiagnostics.status,"ready-app-check-degraded");
  assert.equal(degradedDiagnostics.connected,true);
  assert.equal(degradedDiagnostics.tokenObserved,false);
  assert.equal(degradedDiagnostics.appCheckDegraded,true);
  assert.equal(degradedDiagnostics.authInitialized,true);
  assert.equal(degradedDiagnostics.firestoreInitialized,true);

  const initFailureRuntime=freshRuntime();
  const initFailureSdk=appCheckSdk([]);
  initFailureSdk.initializeAppCheck=()=>{throw new Error("synthetic App Check initialization failure");};
  const initFailure=await initFailureRuntime.initialize({context:eligible,runtimeConfig:validRuntimeConfig,bootstrap,firebaseSdk:initFailureSdk});
  assert.equal(initFailure.status,"APP_CHECK_INITIALIZATION_FAILED");
  assert.equal(initFailure.connected,false,"App/App Check initialization failure must remain fatal and fail closed.");
  assert.equal(initFailure.tokenObserved,false);

  process.stdout.write(`PASS production Firebase runtime keeps historical App Check and PR #126 proof immutable while current ${currentAppVersion}/${currentRevision} tolerates unenforced attestation observation outages without weakening account boundaries\n`);
})().catch(error=>{console.error(error);process.exit(1);});
