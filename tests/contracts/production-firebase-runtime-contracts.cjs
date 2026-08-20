const assert=require("node:assert/strict");
const fs=require("node:fs");

const runtime=require("../../js/productionFirebaseRuntime.js");
const template=JSON.parse(fs.readFileSync("firebase.runtime-config.json","utf8"));
const runtimeSource=fs.readFileSync("js/productionFirebaseRuntime.js","utf8");
const rendererSource=fs.readFileSync("scripts/render-production-firebase-public-config.mjs","utf8");
const appSource=fs.readFileSync("js/app.js","utf8");
const html=fs.readFileSync("index.html","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const manifest=fs.readFileSync("manifest.webmanifest","utf8");

assert.equal(runtime.contractVersion,1);
assert.equal(runtime.productionOrigin,"https://nikahanghojjati-oss.github.io");
assert.equal(runtime.productionPathPrefix,"/fifa17-career-showdown2/");
assert.equal(runtime.firebaseSdkVersion,"12.17.0");
assert.match(runtime.firebaseAppModule,/firebase-app\.js$/);
assert.match(runtime.firebaseAppCheckModule,/firebase-app-check\.js$/);
assert.equal(runtime.enforcementEnabled,false);
assert.equal(runtime.browserFirestoreWrites,"deny-all");

assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true}),"eligible");
assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/other/",online:true}),"non-production-path");
assert.equal(runtime.classifyContext({origin:"http://localhost:8080",pathname:"/fifa17-career-showdown2/",online:true}),"non-production-origin");
assert.equal(runtime.classifyContext({origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:false}),"offline");

assert.equal(template.schemaVersion,1);
assert.equal(template.configured,false,"Committed runtime config must stay fail-closed until controlled deployment injection occurs.");
assert.equal(Object.hasOwn(template.firebaseConfig,"apiKey"),false,"Concrete Firebase Web API key must not be committed in the safe template.");
assert.equal(template.recaptchaEnterpriseSiteKey,"");

assert.match(rendererSource,/CMS_FIREBASE_WEB_API_KEY/);
assert.match(rendererSource,/CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
assert.match(rendererSource,/configured:true/);
assert.doesNotMatch(rendererSource,/console\.log\s*\(\s*apiKey|console\.log\s*\(\s*siteKey|process\.stdout\.write\([^)]*(?:apiKey|siteKey)/,"Renderer must never print provider-issued public configuration values.");
assert.doesNotMatch(rendererSource,/AIza[0-9A-Za-z_-]{35}/,"Renderer source must not contain a concrete Firebase Web API key.");

assert.match(appSource,/productionFirebaseRuntime\.js/,"The shipped application must lazily load the production Firebase runtime after local startup.");
assert.match(appSource,/Local mode remains active/,"Runtime loader failure must preserve local operation.");
assert.match(runtimeSource,/getToken\(initialized\.appCheck,false\)/,"Production integration must explicitly obtain one App Check token so legitimate attestation traffic can be observed before enforcement.");
assert.match(runtimeSource,/isTokenAutoRefreshEnabled:true|tokenAutoRefresh/);
assert.doesNotMatch(runtimeSource,/firebase-firestore|initializeFirestore|getFirestore|firebase\/firestore/i,"This milestone must not initialize Firestore.");
assert.doesNotMatch(runtimeSource,/firebase-auth|GoogleAuthProvider|getAuth\(/i,"This milestone must not silently activate Authentication.");
assert.doesNotMatch(runtimeSource,/DebugAppCheckProvider|FIREBASE_APPCHECK_DEBUG_TOKEN/i,"Production runtime must not contain a debug App Check path.");

const eligibleContext={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
const injectedConfig={
  schemaVersion:1,
  configured:true,
  firebaseConfig:{
    apiKey:"controlled-public-web-config",
    authDomain:"fifa17-career-showdown-prod.firebaseapp.com",
    projectId:"fifa17-career-showdown-prod",
    storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",
    messagingSenderId:"409396353288",
    appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"
  },
  recaptchaEnterpriseSiteKey:"controlled-public-recaptcha-enterprise-site-key"
};
const calls=[];
const fakeBootstrap={
  createPlan(input){
    calls.push(["plan",input]);
    return {ok:true};
  },
  initialize(input){
    calls.push(["initialize",input]);
    return {ok:true,app:{name:"production-app"},appCheck:{name:"production-app-check"}};
  }
};
const fakeSdk={
  async getToken(appCheck,forceRefresh){
    calls.push(["getToken",appCheck,forceRefresh]);
    return {token:"attested-token",expireTimeMillis:4102444800000};
  }
};

(async()=>{
  const nonProduction=await runtime.initialize({context:{origin:"http://localhost:8080",pathname:"/fifa17-career-showdown2/",online:true},runtimeConfig:injectedConfig,bootstrap:fakeBootstrap,firebaseSdk:fakeSdk});
  assert.equal(nonProduction.connected,false);
  assert.equal(nonProduction.attempted,false);

  const result=await runtime.initialize({context:eligibleContext,runtimeConfig:injectedConfig,bootstrap:fakeBootstrap,firebaseSdk:fakeSdk});
  assert.equal(result.status,"ready");
  assert.equal(result.connected,true);
  assert.equal(result.tokenObserved,true);
  assert.equal(result.enforcement,false);
  assert.equal(result.browserFirestoreWrites,"deny-all");
  assert.deepEqual(calls.map(call=>call[0]),["plan","initialize","getToken"]);
  assert.equal(calls[2][2],false,"Initial production traffic proof should use the normal cached/refresh semantics, not force-refresh looping.");

  assert.match(html,/app-asset-revision" content="1\.4\.0-r2"/);
  assert.doesNotMatch(html,/\?v=1\.4\.0-r1/);
  assert.match(worker,/RUNTIME_REVISION = "1\.4\.0-r2"/);
  assert.match(worker,/PREVIOUS_RUNTIME_REVISION = "1\.4\.0-r1"/);
  assert.match(worker,/"js\/productionFirebaseRuntime\.js"/);
  assert.doesNotMatch(worker,/firebase\.runtime-config\.json/,"Deployment-injected runtime config must never be frozen into the offline shell cache.");
  assert.match(manifest,/1\.4\.0-r2/);

  process.stdout.write("PASS production Firebase/App Check runtime is production-only, local-fallback-safe, config-injected, token-observing, enforcement-off and Firestore-disconnected at runtime r2\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
