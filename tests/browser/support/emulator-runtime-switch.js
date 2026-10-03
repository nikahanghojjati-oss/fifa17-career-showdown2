// TEST-ONLY. Never deployed (GitHub Pages copies index.html, js/, css/, data/, assets/, acceptance/ only).
// Never referenced by any production file. Injected by tests/browser/two-manager-browser-journey.cjs
// through Playwright addInitScript. It activates ONLY when ALL of these hold:
//   location.protocol is http:, location.hostname is exactly "localhost" or "127.0.0.1",
//   query cmsEmulator=1 and cmsEmulatorUser is daniel | nik | stranger.
// Otherwise it does nothing at all, and the production runtime loads as usual.
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const ALLOWED_HOSTS=Object.freeze(["localhost","127.0.0.1"]);
  const EMULATOR_HOST="127.0.0.1";
  const PROJECT_ID="demo-cms-browser-journey";
  const SDK_VERSION="12.17.1";
  const SDK_BASE=`https://www.gstatic.com/firebasejs/${SDK_VERSION}/`;
  const USERS=Object.freeze({
    daniel:Object.freeze({sub:"browser-journey-daniel",email:"daniel@example.test",name:"Daniel"}),
    nik:Object.freeze({sub:"browser-journey-nik",email:"nik@example.test",name:"Nik"}),
    stranger:Object.freeze({sub:"browser-journey-stranger",email:"stranger@example.test",name:"Stranger"})
  });
  const BROWSER_FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state";

  function port(value,fallback){const n=Number(value);return Number.isInteger(n)&&n>=1024&&n<=65535?n:fallback;}

  function decide(location){
    if(!location)return Object.freeze({active:false,reason:"no-location"});
    if(location.protocol!=="http:")return Object.freeze({active:false,reason:"protocol"});
    if(!ALLOWED_HOSTS.includes(location.hostname))return Object.freeze({active:false,reason:"host"});
    let params;
    try{params=new URLSearchParams(location.search||"");}catch(_){return Object.freeze({active:false,reason:"query"});}
    if(params.get("cmsEmulator")!=="1")return Object.freeze({active:false,reason:"flag"});
    const user=params.get("cmsEmulatorUser");
    if(!Object.prototype.hasOwnProperty.call(USERS,user))return Object.freeze({active:false,reason:"user"});
    return Object.freeze({active:true,reason:"localhost-emulator",user,
      authPort:port(params.get("cmsAuthPort"),9099),firestorePort:port(params.get("cmsFirestorePort"),8080)});
  }

  function createRuntime(decision,importImpl){
    let services=null,servicesPromise=null;
    let state=Object.freeze({status:"ready",attempted:true,connected:true,emulator:true,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
    async function ensureAccountServices(){
      if(services)return services;
      if(servicesPromise)return servicesPromise;
      servicesPromise=(async()=>{
        const [appModule,authModule,firestoreModule]=await Promise.all([
          importImpl(`${SDK_BASE}firebase-app.js`),importImpl(`${SDK_BASE}firebase-auth.js`),importImpl(`${SDK_BASE}firebase-firestore.js`)]);
        const app=appModule.initializeApp({apiKey:"demo-api-key",authDomain:`${PROJECT_ID}.firebaseapp.com`,projectId:PROJECT_ID,appId:"demo-app"},`cms-emulator-${decision.user}`);
        const auth=authModule.getAuth(app);
        authModule.connectAuthEmulator(auth,`http://${EMULATOR_HOST}:${decision.authPort}`,{disableWarnings:true});
        const firestore=firestoreModule.initializeFirestore(app,{localCache:firestoreModule.memoryLocalCache()});
        firestoreModule.connectFirestoreEmulator(firestore,EMULATOR_HOST,decision.firestorePort);
        const identity=USERS[decision.user];
        // Test-only stand-in for the Google popup: same provider class, no extra scopes, a google.com credential
        // that only the Auth emulator accepts. Production keeps the real signInWithPopup.
        async function signInWithPopup(authInstance,provider){
          if(!(provider instanceof authModule.GoogleAuthProvider))throw Object.assign(new Error("Google provider required."),{code:"auth/argument-error"});
          const defaultScopes=JSON.stringify(new authModule.GoogleAuthProvider().getScopes());
          if(JSON.stringify(provider.getScopes())!==defaultScopes)throw Object.assign(new Error("Extra Google scopes are not allowed."),{code:"auth/argument-error"});
          const credential=authModule.GoogleAuthProvider.credential(JSON.stringify({sub:identity.sub,email:identity.email,email_verified:true,name:identity.name}));
          return authModule.signInWithCredential(authInstance,credential);
        }
        services=Object.freeze({
          ok:true,auth,firestore,
          authSdk:Object.freeze({GoogleAuthProvider:authModule.GoogleAuthProvider,signInWithPopup,signOut:authModule.signOut,onAuthStateChanged:authModule.onAuthStateChanged,setPersistence:authModule.setPersistence,browserSessionPersistence:authModule.browserSessionPersistence}),
          firestoreSdk:Object.freeze({Timestamp:firestoreModule.Timestamp,serverTimestamp:firestoreModule.serverTimestamp,doc:firestoreModule.doc,runTransaction:firestoreModule.runTransaction}),
          billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
          persistentFirestoreCache:false,authPersistence:"browserSessionPersistence",provider:"google",signInFlow:"popup",
          additionalGoogleScopes:0,writeScope:BROWSER_FIRESTORE_WRITE_SCOPE
        });
        state=Object.freeze({...state,authInitialized:true,firestoreInitialized:true});
        return services;
      })().finally(()=>{servicesPromise=null;});
      return servicesPromise;
    }
    return Object.freeze({
      contractVersion:2,emulatorSwitch:true,emulatorProjectId:PROJECT_ID,
      enforcementEnabled:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
      persistentFirestoreCache:false,authPersistence:"browserSessionPersistence",provider:"google",signInFlow:"popup",additionalGoogleScopes:0,
      browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE,
      classifyContext:()=>"eligible",
      initialize:async()=>state,
      refreshAppCheckToken:async()=>Object.freeze({ok:false,code:"app-check-disabled",state}),
      ensureAccountServices,
      loadConnectedAccount:async()=>root.CareerModeSparkConnectedAccount||null,
      diagnostics:()=>state
    });
  }

  function install(location=root.location,importImpl=url=>import(url)){
    const decision=decide(location);
    if(!decision.active)return decision;
    if(root.CareerModeProductionFirebaseRuntime)return Object.freeze({active:false,reason:"runtime-already-present"});
    Object.defineProperty(root,"CareerModeProductionFirebaseRuntime",{value:createRuntime(decision,importImpl),writable:false,configurable:false});
    root.__cmsEmulatorSwitch=decision;
    return decision;
  }

  return Object.freeze({decide,install,createRuntime,projectId:PROJECT_ID,sdkVersion:SDK_VERSION,allowedHosts:ALLOWED_HOSTS});
});
