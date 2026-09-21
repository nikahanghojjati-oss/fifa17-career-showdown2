const assert=require("node:assert/strict");
const fs=require("node:fs");
const runtimeSource=fs.readFileSync("js/productionFirebaseRuntime.js","utf8");
const placeholder=JSON.parse(fs.readFileSync("firebase.runtime-config.json","utf8"));
const renderer=fs.readFileSync("scripts/render-production-firebase-public-config.mjs","utf8");

function freshRuntime(){
  const path=require.resolve("../../js/productionFirebaseRuntime.js");
  delete require.cache[path];
  return require(path);
}
const eligible={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
const validRuntimeConfig={schemaVersion:1,configured:true,firebaseConfig:{
  apiKey:"controlled-public-web-config-injection",
  authDomain:"fifa17-career-showdown-prod.firebaseapp.com",
  projectId:"fifa17-career-showdown-prod",
  storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",
  messagingSenderId:"409396353288",
  appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"
}};
function accountSdk(calls){
  return {
    getAuth(app){calls.push(["getAuth",app]);return {name:"auth"};},
    GoogleAuthProvider:function GoogleAuthProvider(){},
    async signInWithPopup(){},async signOut(){},onAuthStateChanged(){return()=>{};},async setPersistence(){},
    browserSessionPersistence:{type:"SESSION"},
    initializeFirestore(app,options){calls.push(["initializeFirestore",app,options]);return {name:"firestore"};},
    memoryLocalCache(){calls.push(["memoryLocalCache"]);return {kind:"memory"};},
    Timestamp:{now(){return {seconds:1,nanoseconds:0};}},serverTimestamp(){return {kind:"server-timestamp"};},doc(){},runTransaction(){}
  };
}
(async()=>{
  const runtime=freshRuntime();
  assert.equal(runtime.contractVersion,2);
  assert.equal(runtime.enforcementEnabled,false);
  assert.equal(runtime.firebaseAppCheckModule,null);
  assert.equal(runtime.persistentFirestoreCache,false);
  assert.equal(runtime.authPersistence,"browserSessionPersistence");
  assert.equal(runtime.billingRequired,false);
  assert.equal(runtime.blazeRequired,false);
  assert.equal(runtime.cloudRunRequired,false);
  assert.equal(runtime.cloudFunctionsRequired,false);
  assert.equal(placeholder.recaptchaEnterpriseSiteKey,undefined);
  assert.doesNotMatch(renderer,/CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
  assert.doesNotMatch(runtimeSource,/importImpl\(FIREBASE_APP_CHECK_MODULE\)/);
  assert.doesNotMatch(runtimeSource,/new\s+sdk\.ReCaptchaEnterpriseProvider|sdk\.getToken\(initialized\.appCheck|initializeAppCheck\(/);
  assert.match(runtimeSource,/appCheckDisabled:true/);

  const calls=[];
  const initialized=await runtime.initialize({
    context:eligible,
    runtimeConfig:validRuntimeConfig,
    firebaseSdk:{initializeApp(config){calls.push(["initializeApp",config]);return {name:"production-app"};}}
  });
  assert.equal(initialized.status,"ready");
  assert.equal(initialized.connected,true);
  assert.equal(initialized.appCheckDisabled,true);
  assert.equal(initialized.tokenObserved,false);
  assert.deepEqual(calls.map(x=>x[0]),["initializeApp"]);

  const accountCalls=[];
  const services=await runtime.ensureAccountServices({context:eligible,accountSdk:accountSdk(accountCalls)});
  assert.equal(services.ok,true);
  assert.equal(services.authPersistence,"browserSessionPersistence");
  assert.equal(services.persistentFirestoreCache,false);
  assert.deepEqual(accountCalls.map(x=>x[0]),["getAuth","memoryLocalCache","initializeFirestore"]);

  const refresh=await runtime.refreshAppCheckToken({context:eligible});
  assert.equal(refresh.ok,false);
  assert.equal(refresh.code,"app-check-disabled");
  assert.equal(refresh.state.connected,true);
  console.log("PASS production Firebase runtime uses Firebase App + Auth + Firestore with App Check/reCAPTCHA disabled and zero billing.");
})().catch(error=>{console.error(error?.stack||error);process.exit(1);});
