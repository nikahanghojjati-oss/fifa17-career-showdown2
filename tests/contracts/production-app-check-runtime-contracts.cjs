const assert=require("node:assert/strict");
const fs=require("node:fs");
const runtime=require("../../js/productionFirebaseRuntime.js");
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
const release=read("RELEASE_V1.4.0_R2.md");

assert.equal(runtime.contractVersion,1);
assert.equal(runtime.productionOrigin,"https://nikahanghojjati-oss.github.io");
assert.equal(runtime.productionPathPrefix,"/fifa17-career-showdown2/");
assert.equal(runtime.firebaseSdkVersion,"12.17.0");
assert.equal(runtime.runtimeConfigPath,"firebase.runtime-config.json");
assert.equal(runtime.bootstrapPath,"js/productionAppCheckBootstrap.js");
assert.equal(runtime.enforcementEnabled,false);
assert.equal(runtime.browserFirestoreWrites,"deny-all");
assert.equal(Object.isFrozen(runtime),true);

assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true}),"eligible");
assert.equal(runtime.classifyContext({origin:"http://localhost:8080",pathname:"/fifa17-career-showdown2/",online:true}),"non-production-origin");
assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/other-app/",online:true}),"non-production-path");
assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:false}),"offline");

assert.equal(placeholder.schemaVersion,1);
assert.equal(placeholder.configured,false);
assert.equal(Object.hasOwn(placeholder.firebaseConfig,"apiKey"),false,"Tracked placeholder must not contain the provider-issued Firebase Web API key.");
assert.equal(placeholder.recaptchaEnterpriseSiteKey,"");
assert.doesNotMatch(placeholderSource,/AIza[0-9A-Za-z_-]{35}/,"Tracked runtime config placeholder must not contain a concrete Firebase Web API key.");
assert.match(renderer,/CMS_FIREBASE_WEB_API_KEY/);
assert.match(renderer,/CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
assert.match(renderer,/configured:true/);
assert.match(renderer,/without printing provider-issued values/i);
assert.doesNotMatch(renderer,/console\.log\([^\n]*(?:apiKey|siteKey)/i,"Renderer must not print provider values.");

assert.match(index,/app-asset-revision" content="1\.4\.0-r2"/);
for(const path of ["js/storage.js","js/showdown.js","js/scoring.js","js/screens.js","js/menuExperience.js","js/optionalModules.js","js/app.js"]){
  assert.ok(index.includes(`${path}?v=1.4.0-r2`),`${path} must use the r2 shell identity.`);
}
assert.match(app,/visual-fidelity-r3\.css\?v=1\.4\.0-r2/);
assert.match(app,/productionFirebaseRuntime\.js\?v=\$\{r\}/);
assert.match(app,/requestAnimationFrame\(\(\)=>\{ra\(\);so\(\);sd\(\);\}\)/,"Production Firebase must remain post-local-startup/lazy rather than blocking application initialization.");
assert.match(worker,/const RUNTIME_REVISION = "1\.4\.0-r2";/);
assert.match(worker,/const PREVIOUS_RUNTIME_REVISION = "1\.4\.0-r1";/);
assert.ok(worker.includes('"js/productionFirebaseRuntime.js"'),"The lazy production runtime must be available in the r2 whole-shell cache.");
assert.doesNotMatch(worker,/productionAppCheckBootstrap\.js/,"The production App Check bootstrap stays online/on-demand rather than becoming an offline startup dependency.");
assert.match(manifest,/1\.4\.0-r2/g);
assert.match(release,/Runtime asset revision: `1\.4\.0-r2`/);
assert.match(release,/Previous known-good runtime: `1\.4\.0-r1`/);
assert.match(release,/App Check enforcement remains OFF/);

assert.match(runtimeSource,/firebase-app\.js/);
assert.match(runtimeSource,/firebase-app-check\.js/);
assert.match(runtimeSource,/getToken\(initialized\.appCheck,false\)/);
assert.match(runtimeSource,/requestIdleCallback/);
assert.match(runtimeSource,/runtime-config-not-configured/);
assert.match(runtimeSource,/Local mode remains active/);
assert.doesNotMatch(runtimeSource,/firebase-firestore|getFirestore|initializeFirestore|firebase-auth|firebase-functions|firebase-storage/i,"This milestone must not initialize another Firebase service.");
assert.doesNotMatch(runtimeSource,/DebugAppCheckProvider|FIREBASE_APPCHECK_DEBUG_TOKEN/i,"Production runtime must not contain an App Check debug-provider path.");

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

const calls=[];
class EnterpriseProvider{
  constructor(siteKey){this.siteKey=siteKey;calls.push(["provider",siteKey]);}
}
const sdk={
  initializeApp(config){calls.push(["initializeApp",config]);return {name:"production-app"};},
  ReCaptchaEnterpriseProvider:EnterpriseProvider,
  initializeAppCheck(appInstance,options){calls.push(["initializeAppCheck",appInstance,options]);return {name:"app-check"};},
  async getToken(appCheck,forceRefresh){calls.push(["getToken",appCheck,forceRefresh]);return {token:"opaque-test-token-never-exposed",expireTimeMillis:1893456000000};}
};

(async()=>{
  const ready=await runtime.initialize({
    context:{origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true},
    runtimeConfig:validRuntimeConfig,
    bootstrap,
    firebaseSdk:sdk
  });
  assert.equal(ready.status,"ready");
  assert.equal(ready.connected,true);
  assert.equal(ready.tokenObserved,true);
  assert.equal(ready.enforcement,false);
  assert.equal(ready.browserFirestoreWrites,"deny-all");
  assert.equal(Object.hasOwn(ready,"token"),false,"Raw App Check token must never enter runtime diagnostics.");
  assert.deepEqual(calls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck","getToken"]);
  assert.equal(calls[2][2].isTokenAutoRefreshEnabled,true);
  assert.equal(calls[3][2],false);

  const invalid=await runtime.initialize({
    context:{origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true},
    runtimeConfig:{...validRuntimeConfig,firebaseConfig:{...validRuntimeConfig.firebaseConfig,projectId:"wrong-project"}},
    bootstrap,
    firebaseSdk:sdk
  });
  assert.equal(invalid.status,"APP_CHECK_PROJECT_ID_MISMATCH");
  assert.equal(invalid.connected,false);

  const offline=await runtime.initialize({
    context:{origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:false},
    runtimeConfig:validRuntimeConfig,
    bootstrap,
    firebaseSdk:sdk
  });
  assert.equal(offline.status,"offline");
  assert.equal(offline.attempted,false);
  assert.equal(offline.connected,false);

  const providerFailure=await runtime.initialize({
    context:{origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true},
    runtimeConfig:validRuntimeConfig,
    bootstrap,
    firebaseSdk:{...sdk,getToken:async()=>{throw new Error("synthetic provider outage");}}
  });
  assert.equal(providerFailure.status,"app-check-runtime-unavailable");
  assert.equal(providerFailure.connected,false);
  assert.equal(providerFailure.tokenObserved,false);

  process.stdout.write("PASS production App Check runtime is exact-origin/path gated, local-first, config-injected, token-observing without token exposure, enforcement-off and free of Firestore/trusted mutation authority\n");
})().catch(error=>{console.error(error);process.exit(1);});
