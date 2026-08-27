const assert=require("node:assert/strict");
const fs=require("node:fs");
const bootstrap=require("../../js/productionAppCheckBootstrap.js");

const runtimeSource=fs.readFileSync("js/productionFirebaseRuntime.js","utf8");
const bootstrapSource=fs.readFileSync("js/productionAppCheckBootstrap.js","utf8");

function freshRuntime(){
  const path=require.resolve("../../js/productionFirebaseRuntime.js");
  delete require.cache[path];
  return require(path);
}

const eligible={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
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

function lifecycleSdk(calls,state){
  class EnterpriseProvider{constructor(siteKey){calls.push(["provider",siteKey]);}}
  return {
    initializeApp(config){calls.push(["initializeApp",config]);return {name:"production-app"};},
    ReCaptchaEnterpriseProvider:EnterpriseProvider,
    initializeAppCheck(appInstance,options){calls.push(["initializeAppCheck",appInstance,options]);return {name:"app-check"};},
    async getToken(appCheck,forceRefresh){
      calls.push(["getToken",appCheck,forceRefresh]);
      if(forceRefresh&&state.failRefresh)throw Object.assign(new Error("synthetic refresh outage"),{code:"appCheck/refresh-unavailable"});
      if(forceRefresh)return {token:"opaque-forced-refresh-token-never-exposed",expireTimeMillis:1893463200000};
      return {token:"opaque-initial-token-never-exposed",expireTimeMillis:1893456000000};
    },
    onTokenChanged(appCheck,observer){
      calls.push(["onTokenChanged",appCheck]);
      state.observer=observer;
      return ()=>{state.unsubscribed=true;};
    }
  };
}

function accountSdk(calls){
  return {
    getAuth(appInstance){calls.push(["getAuth",appInstance]);return {name:"auth"};},
    GoogleAuthProvider:function GoogleAuthProvider(){},
    async signInWithPopup(){},
    async signOut(){},
    onAuthStateChanged(){return ()=>{};},
    async setPersistence(){},
    browserSessionPersistence:{type:"SESSION"},
    initializeFirestore(appInstance,options){calls.push(["initializeFirestore",appInstance,options]);return {name:"firestore"};},
    memoryLocalCache(){calls.push(["memoryLocalCache"]);return {kind:"memory"};},
    Timestamp:{now(){return {seconds:1,nanoseconds:0};}},
    doc(){},
    runTransaction(){}
  };
}

(async()=>{
  assert.match(bootstrapSource,/isTokenAutoRefreshEnabled:true/,"Firebase SDK auto refresh must remain the scheduling authority.");
  assert.match(runtimeSource,/onTokenChanged:appCheckModule\.onTokenChanged/);
  assert.match(runtimeSource,/productionAppCheckGetToken\(productionAppCheck,true\)/,"The deterministic refresh probe must use Firebase forceRefresh rather than a custom timer.");
  assert.doesNotMatch(runtimeSource,/setInterval|tokenRefreshTimer|refreshInterval/i,"Token lifecycle hardening must not invent a custom refresh scheduler.");

  const runtime=freshRuntime();
  const lifecycleState={observer:null,failRefresh:false,unsubscribed:false};
  const appCheckCalls=[];
  const sdk=lifecycleSdk(appCheckCalls,lifecycleState);
  const initial=await runtime.initialize({context:eligible,runtimeConfig:validRuntimeConfig,bootstrap,firebaseSdk:sdk});

  assert.equal(initial.status,"ready");
  assert.equal(initial.connected,true);
  assert.equal(initial.tokenObserved,true);
  assert.equal(initial.tokenExpireTimeMillis,1893456000000);
  assert.equal(initial.tokenLifecycleObserved,false);
  assert.equal(initial.tokenRefreshCount,0);
  assert.equal(initial.appCheckTokenObserverInstalled,true);
  assert.equal(initial.appCheckTokenObserverHealthy,true);
  assert.equal(initial.enforcement,false);
  assert.equal(typeof lifecycleState.observer?.next,"function","Production lifecycle observer must be registered through Firebase onTokenChanged.");
  assert.equal(Object.hasOwn(initial,"token"),false,"Initial diagnostics must never expose raw App Check token material.");
  assert.deepEqual(appCheckCalls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck","getToken","onTokenChanged"]);
  assert.equal(appCheckCalls[3][2],false,"Initial observation must remain non-forced.");

  const accountCalls=[];
  const accountBefore=await runtime.ensureAccountServices({context:eligible,accountSdk:accountSdk(accountCalls)});
  assert.equal(accountBefore.ok,true);
  assert.equal(accountBefore.authPersistence,"browserSessionPersistence");
  assert.equal(accountBefore.persistentFirestoreCache,false);
  assert.equal(accountBefore.writeScope,"spark-private-account-device-pairing-connected-rivalry-state");

  const canonicalLocalLibrary={
    schemaVersion:1,
    activeSaveId:"save_222222222222222222222222",
    profiles:[{profileId:"profile_aaaaaaaaaaaaaaaaaaaaaaaa",displayName:"Hawk"},{profileId:"profile_bbbbbbbbbbbbbbbbbbbbbbbb",displayName:"Rival"}],
    saves:[{saveId:"save_222222222222222222222222",showdown:{id:"token-lifecycle-fixture",status:"Ready",currentRound:2,totalRounds:3}}]
  };
  const localBefore=JSON.stringify(canonicalLocalLibrary);
  const connectedRivalryProjection={rivalryId:`pair_${"e".repeat(64)}`,revision:4,managerAccountIds:["acct_a","acct_b"],state:"active"};
  const rivalryBefore=JSON.stringify(connectedRivalryProjection);

  lifecycleState.observer.next({token:"opaque-auto-refresh-token-never-exposed",expireTimeMillis:1893459600000});
  const observed=runtime.diagnostics();
  assert.equal(observed.status,"ready");
  assert.equal(observed.connected,true);
  assert.equal(observed.tokenObserved,true);
  assert.equal(observed.tokenExpireTimeMillis,1893459600000);
  assert.equal(observed.tokenLifecycleObserved,true,"A later SDK expiry must become explicit lifecycle evidence.");
  assert.equal(observed.tokenRefreshCount,1);
  assert.equal(observed.lastTokenTransition,"sdk-token-changed");
  assert.equal(observed.authInitialized,true);
  assert.equal(observed.firestoreInitialized,true);
  assert.equal(Object.hasOwn(observed,"token"),false);
  assert.doesNotMatch(JSON.stringify(observed),/opaque-auto-refresh-token-never-exposed/);
  assert.strictEqual(await runtime.ensureAccountServices({context:eligible,accountSdk:accountSdk([])}),accountBefore,"Token change must not recreate or replace Connected Account/Firestore services.");
  assert.equal(JSON.stringify(canonicalLocalLibrary),localBefore,"SDK token change must not mutate canonical local Save Library state.");
  assert.equal(JSON.stringify(connectedRivalryProjection),rivalryBefore,"SDK token change must not mutate Connected Rivalry authority.");

  lifecycleState.observer.next({token:"opaque-same-expiry-token-never-exposed",expireTimeMillis:1893459600000});
  assert.equal(runtime.diagnostics().tokenRefreshCount,1,"Duplicate same-expiry token notifications must not fabricate another lifecycle transition.");

  const forced=await runtime.refreshAppCheckToken({context:eligible});
  assert.equal(forced.ok,true);
  assert.equal(forced.transitioned,true);
  assert.equal(forced.state.status,"ready");
  assert.equal(forced.state.connected,true);
  assert.equal(forced.state.tokenExpireTimeMillis,1893463200000);
  assert.equal(forced.state.tokenRefreshCount,2);
  assert.equal(forced.state.tokenRefreshSuccessCount,1);
  assert.equal(forced.state.lastTokenRefreshStatus,"success");
  assert.equal(forced.state.enforcement,false);
  assert.equal(Object.hasOwn(forced.state,"token"),false);
  assert.ok(appCheckCalls.some(call=>call[0]==="getToken"&&call[2]===true),"Bounded deterministic refresh proof must issue one Firebase forceRefresh request.");
  assert.strictEqual(await runtime.ensureAccountServices({context:eligible,accountSdk:accountSdk([])}),accountBefore);
  assert.equal(JSON.stringify(canonicalLocalLibrary),localBefore);
  assert.equal(JSON.stringify(connectedRivalryProjection),rivalryBefore);

  lifecycleState.failRefresh=true;
  const failed=await runtime.refreshAppCheckToken({context:eligible});
  assert.equal(failed.ok,false);
  assert.equal(failed.code,"app-check-refresh-unavailable");
  assert.equal(failed.state.status,"ready-app-check-degraded");
  assert.equal(failed.state.connected,true,"Unenforced refresh observation failure must not disconnect the Firebase App.");
  assert.equal(failed.state.tokenObserved,true,"The last successfully observed token remains evidence even when a later refresh probe fails.");
  assert.equal(failed.state.appCheckDegraded,true);
  assert.equal(failed.state.tokenExpireTimeMillis,1893463200000,"Refresh failure must preserve the last successful expiry rather than fabricate a token transition.");
  assert.equal(failed.state.tokenRefreshCount,2);
  assert.equal(failed.state.tokenRefreshFailureCount,1);
  assert.equal(failed.state.lastTokenRefreshStatus,"failed");
  assert.equal(failed.state.authInitialized,true);
  assert.equal(failed.state.firestoreInitialized,true);
  assert.equal(failed.state.enforcement,false);
  assert.strictEqual(await runtime.ensureAccountServices({context:eligible,accountSdk:accountSdk([])}),accountBefore,"Refresh failure must preserve existing Connected Account services.");
  assert.equal(JSON.stringify(canonicalLocalLibrary),localBefore,"Refresh failure must not mutate canonical local saves.");
  assert.equal(JSON.stringify(connectedRivalryProjection),rivalryBefore,"Refresh failure must not mutate Connected Rivalry authority.");
  assert.doesNotMatch(JSON.stringify(failed.state),/opaque-/,"No raw token may enter degraded diagnostics.");

  lifecycleState.observer.error(new Error("synthetic observer callback error"));
  const observerError=runtime.diagnostics();
  assert.equal(observerError.connected,true);
  assert.equal(observerError.authInitialized,true);
  assert.equal(observerError.firestoreInitialized,true);
  assert.equal(observerError.appCheckTokenObserverInstalled,true);
  assert.equal(observerError.appCheckTokenObserverHealthy,false);
  assert.equal(observerError.lastTokenLifecycleError,"observer-callback-error");
  assert.equal(JSON.stringify(canonicalLocalLibrary),localBefore);
  assert.equal(JSON.stringify(connectedRivalryProjection),rivalryBefore);
  assert.deepEqual(accountCalls.map(call=>call[0]),["getAuth","memoryLocalCache","initializeFirestore"],"Token lifecycle transitions must not reinitialize account or Firestore services.");

  process.stdout.write("PASS Stage 4 token lifecycle: Firebase-owned auto refresh is observable across a later expiry, deterministic force-refresh success/failure is bounded, raw tokens stay redacted, and Connected Account/Rivalry plus canonical local saves remain unchanged\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
