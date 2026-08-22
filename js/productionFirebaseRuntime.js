(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionFirebaseRuntime=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PRODUCTION_ORIGIN="https://nikahanghojjati-oss.github.io";
  const PRODUCTION_PATH_PREFIX="/fifa17-career-showdown2/";
  const FIREBASE_SDK_VERSION="12.17.0";
  const CONFIG_PATH="firebase.runtime-config.json";
  const BOOTSTRAP_PATH="js/productionAppCheckBootstrap.js";
  const CONNECTED_ACCOUNT_PATH="js/sparkConnectedAccount.js";
  const FALLBACK_RUNTIME_REVISION="1.7.0-r2";
  const BROWSER_FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state";
  const FIREBASE_APP_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`;
  const FIREBASE_APP_CHECK_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-check.js`;
  const FIREBASE_AUTH_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`;
  const FIREBASE_FIRESTORE_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`;

  let runtimeState=Object.freeze({status:"idle",attempted:false,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
  let runtimePromise=null;
  let bootstrapPromise=null;
  let connectedAccountPromise=null;
  let connectedAccountBridgeObserver=null;
  let productionApp=null;
  let accountServices=null;
  let accountServicesPromise=null;

  function freezeRuntimeState(value){
    return Object.freeze({...value});
  }

  function setRuntimeState(next){
    runtimeState=freezeRuntimeState(next);
    return runtimeState;
  }

  function getRuntimeRevision(){
    if(!root.document)return FALLBACK_RUNTIME_REVISION;
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    const revision=meta&&typeof meta.content==="string"?meta.content.trim():"";
    return revision||FALLBACK_RUNTIME_REVISION;
  }

  function getRuntimeContext(){
    const location=root.location;
    return {
      origin:location&&typeof location.origin==="string"?location.origin:"",
      pathname:location&&typeof location.pathname==="string"?location.pathname:"",
      online:!root.navigator||root.navigator.onLine!==false
    };
  }

  function classifyRuntimeContext(context=getRuntimeContext()){
    if(context.origin!==PRODUCTION_ORIGIN)return "non-production-origin";
    if(!context.pathname.startsWith(PRODUCTION_PATH_PREFIX))return "non-production-path";
    if(context.online===false)return "offline";
    return "eligible";
  }

  function buildVersionedLocalUrl(path){
    if(!root.document||!root.location)return null;
    const url=new URL(path,root.document.baseURI||root.location.href);
    url.searchParams.set("v",getRuntimeRevision());
    return url.href;
  }

  async function readRuntimeConfig(fetchImpl=root.fetch){
    if(typeof fetchImpl!=="function")return {ok:false,code:"runtime-config-fetch-unavailable"};
    const url=buildVersionedLocalUrl(CONFIG_PATH);
    if(!url)return {ok:false,code:"runtime-config-url-unavailable"};
    try{
      const response=await fetchImpl(url,{cache:"no-store",credentials:"same-origin"});
      if(!response||!response.ok)return {ok:false,code:"runtime-config-unavailable"};
      const config=await response.json();
      if(!config||config.schemaVersion!==1||config.configured!==true){
        return {ok:false,code:"runtime-config-not-configured"};
      }
      return {ok:true,config};
    }catch(_error){
      return {ok:false,code:"runtime-config-unavailable"};
    }
  }

  function getBootstrap(){
    return root.CareerModeProductionAppCheckBootstrap||null;
  }

  async function loadBootstrapScript(){
    const existing=getBootstrap();
    if(existing)return existing;
    if(bootstrapPromise)return bootstrapPromise;
    if(!root.document)return null;
    bootstrapPromise=new Promise(resolve=>{
      const script=root.document.createElement("script");
      script.src=buildVersionedLocalUrl(BOOTSTRAP_PATH);
      script.async=false;
      script.dataset.productionAppCheckBootstrap="true";
      script.addEventListener("load",()=>resolve(getBootstrap()),{once:true});
      script.addEventListener("error",()=>resolve(null),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>{bootstrapPromise=null;});
    return bootstrapPromise;
  }

  function getConnectedAccount(){
    return root.CareerModeSparkConnectedAccount||null;
  }

  async function loadConnectedAccountScript(){
    const existing=getConnectedAccount();
    if(existing)return existing;
    if(connectedAccountPromise)return connectedAccountPromise;
    if(!root.document)return null;
    connectedAccountPromise=new Promise(resolve=>{
      const script=root.document.createElement("script");
      script.src=buildVersionedLocalUrl(CONNECTED_ACCOUNT_PATH);
      script.async=false;
      script.dataset.sparkConnectedAccount="true";
      script.addEventListener("load",()=>resolve(getConnectedAccount()),{once:true});
      script.addEventListener("error",()=>resolve(null),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>{connectedAccountPromise=null;});
    return connectedAccountPromise;
  }

  function buildBootstrapInput(config){
    return {
      origin:PRODUCTION_ORIGIN,
      firebaseConfig:config.firebaseConfig,
      recaptchaEnterpriseSiteKey:config.recaptchaEnterpriseSiteKey,
      debug:false,
      enforcement:false
    };
  }

  async function loadFirebaseSdk(importImpl=url=>import(url)){
    const [appModule,appCheckModule]=await Promise.all([
      importImpl(FIREBASE_APP_MODULE),
      importImpl(FIREBASE_APP_CHECK_MODULE)
    ]);
    return {
      initializeApp:appModule.initializeApp,
      initializeAppCheck:appCheckModule.initializeAppCheck,
      ReCaptchaEnterpriseProvider:appCheckModule.ReCaptchaEnterpriseProvider,
      getToken:appCheckModule.getToken
    };
  }

  async function loadAccountFirebaseSdk(importImpl=url=>import(url)){
    const [authModule,firestoreModule]=await Promise.all([
      importImpl(FIREBASE_AUTH_MODULE),
      importImpl(FIREBASE_FIRESTORE_MODULE)
    ]);
    return {
      getAuth:authModule.getAuth,
      GoogleAuthProvider:authModule.GoogleAuthProvider,
      signInWithPopup:authModule.signInWithPopup,
      signOut:authModule.signOut,
      onAuthStateChanged:authModule.onAuthStateChanged,
      setPersistence:authModule.setPersistence,
      browserSessionPersistence:authModule.browserSessionPersistence,
      initializeFirestore:firestoreModule.initializeFirestore,
      memoryLocalCache:firestoreModule.memoryLocalCache,
      Timestamp:firestoreModule.Timestamp,
      doc:firestoreModule.doc,
      runTransaction:firestoreModule.runTransaction
    };
  }

  async function initializeProductionFirebaseRuntime(options={}){
    if(runtimePromise)return runtimePromise;
    if(productionApp&&runtimeState.connected)return runtimeState;
    runtimePromise=(async()=>{
      const contextCode=classifyRuntimeContext(options.context||getRuntimeContext());
      if(contextCode!=="eligible"){
        return setRuntimeState({status:contextCode,attempted:false,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
      }

      setRuntimeState({status:"initializing",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
      const runtimeConfig=options.runtimeConfig
        ? {ok:true,config:options.runtimeConfig}
        : await readRuntimeConfig(options.fetchImpl||root.fetch);
      if(!runtimeConfig.ok){
        return setRuntimeState({status:runtimeConfig.code,attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
      }

      const bootstrap=options.bootstrap||getBootstrap()||await loadBootstrapScript();
      if(!bootstrap||typeof bootstrap.createPlan!=="function"||typeof bootstrap.initialize!=="function"){
        return setRuntimeState({status:"app-check-bootstrap-unavailable",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
      }

      const bootstrapInput=buildBootstrapInput(runtimeConfig.config);
      const plan=bootstrap.createPlan(bootstrapInput);
      if(!plan||plan.ok!==true){
        return setRuntimeState({status:plan&&plan.code?plan.code:"runtime-config-invalid",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
      }

      try{
        const sdk=options.firebaseSdk||await loadFirebaseSdk(options.importImpl);
        if(typeof sdk.getToken!=="function")throw new Error("Firebase App Check getToken is unavailable.");
        const initialized=bootstrap.initialize({...bootstrapInput,firebaseSdk:sdk});
        if(!initialized||initialized.ok!==true){
          return setRuntimeState({status:initialized&&initialized.code?initialized.code:"app-check-initialization-failed",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
        }
        productionApp=initialized.app;
        const tokenResult=await sdk.getToken(initialized.appCheck,false);
        const tokenObserved=Boolean(tokenResult&&typeof tokenResult.token==="string"&&tokenResult.token.length>0);
        return setRuntimeState({
          status:tokenObserved?"ready":"token-unavailable",
          attempted:true,
          connected:true,
          tokenObserved,
          tokenExpireTimeMillis:Number.isFinite(tokenResult&&tokenResult.expireTimeMillis)?tokenResult.expireTimeMillis:null,
          provider:"recaptcha-enterprise",
          sdkVersion:FIREBASE_SDK_VERSION,
          enforcement:false,
          authInitialized:false,
          firestoreInitialized:false,
          persistentFirestoreCache:false,
          authPersistence:"browserSessionPersistence",
          browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE
        });
      }catch(error){
        productionApp=null;
        if(root.console&&typeof root.console.warn==="function"){
          root.console.warn("[Career Mode Showdown] Production App Check is temporarily unavailable; local mode remains active.",error);
        }
        return setRuntimeState({status:"app-check-runtime-unavailable",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false});
      }
    })().finally(()=>{runtimePromise=null;});
    return runtimePromise;
  }

  async function ensureSparkAccountServices(options={}){
    if(accountServices)return accountServices;
    if(accountServicesPromise)return accountServicesPromise;
    accountServicesPromise=(async()=>{
      const contextCode=classifyRuntimeContext(options.context||getRuntimeContext());
      if(contextCode!=="eligible")return Object.freeze({ok:false,code:contextCode});

      if(!productionApp){
        const base=await initializeProductionFirebaseRuntime(options.baseRuntimeOptions||options);
        if(!base||base.connected!==true||!productionApp){
          return Object.freeze({ok:false,code:base&&base.status?base.status:"firebase-runtime-unavailable"});
        }
      }

      try{
        const sdk=options.accountSdk||await loadAccountFirebaseSdk(options.importImpl);
        for(const name of ["getAuth","GoogleAuthProvider","signInWithPopup","signOut","onAuthStateChanged","setPersistence","initializeFirestore","memoryLocalCache","doc","runTransaction"]){
          if(typeof sdk[name]!=="function")throw new Error(`Firebase account SDK method unavailable: ${name}`);
        }
        if(!sdk.browserSessionPersistence)throw new Error("Firebase browserSessionPersistence is unavailable.");
        if(!sdk.Timestamp)throw new Error("Firebase Timestamp support is unavailable.");
        const auth=sdk.getAuth(productionApp);
        const firestore=sdk.initializeFirestore(productionApp,{localCache:sdk.memoryLocalCache()});
        accountServices=Object.freeze({
          ok:true,
          auth,
          firestore,
          authSdk:Object.freeze({
            GoogleAuthProvider:sdk.GoogleAuthProvider,
            signInWithPopup:sdk.signInWithPopup,
            signOut:sdk.signOut,
            onAuthStateChanged:sdk.onAuthStateChanged,
            setPersistence:sdk.setPersistence,
            browserSessionPersistence:sdk.browserSessionPersistence
          }),
          firestoreSdk:Object.freeze({Timestamp:sdk.Timestamp,doc:sdk.doc,runTransaction:sdk.runTransaction}),
          billingRequired:false,
          blazeRequired:false,
          cloudRunRequired:false,
          cloudFunctionsRequired:false,
          persistentFirestoreCache:false,
          authPersistence:"browserSessionPersistence",
          provider:"google",
          signInFlow:"popup",
          additionalGoogleScopes:0,
          writeScope:BROWSER_FIRESTORE_WRITE_SCOPE
        });
        setRuntimeState({...runtimeState,authInitialized:true,firestoreInitialized:true,persistentFirestoreCache:false,authPersistence:"browserSessionPersistence",browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE});
        return accountServices;
      }catch(error){
        if(root.console&&typeof root.console.warn==="function"){
          root.console.warn("[Career Mode Showdown] Optional connected account services are unavailable; local mode remains active.",error);
        }
        return Object.freeze({ok:false,code:"spark-account-services-unavailable"});
      }
    })().finally(()=>{accountServicesPromise=null;});
    return accountServicesPromise;
  }

  function getProductionFirebaseRuntimeDiagnostics(){
    return runtimeState;
  }

  function connectedAccountSettingsOpen(){
    if(!root.document)return false;
    const overlay=root.document.getElementById("settingsOverlay");
    return Boolean(overlay&&!overlay.classList.contains("hidden"));
  }

  function mountConnectedAccountSettings(){
    if(!connectedAccountSettingsOpen())return Promise.resolve(false);
    return loadConnectedAccountScript().then(account=>{
      if(account&&typeof account.mountWhenSettingsReady==="function")return account.mountWhenSettingsReady();
      return false;
    }).catch(()=>false);
  }

  function installConnectedAccountSettingsBridge(){
    if(!root.document||!root.document.addEventListener)return;
    const marker=root.document.documentElement;
    if(marker&&marker.dataset&&marker.dataset.sparkAccountBridge==="true")return;
    if(marker&&marker.dataset)marker.dataset.sparkAccountBridge="true";

    const requestMount=()=>{void mountConnectedAccountSettings();};
    root.document.addEventListener("click",event=>{
      const target=event&&event.target&&typeof event.target.closest==="function"
        ? event.target.closest("#settingsButton")
        : null;
      if(!target)return;
      root.setTimeout(requestMount,0);
    },true);

    if(typeof root.MutationObserver==="function"){
      connectedAccountBridgeObserver=new root.MutationObserver(records=>{
        const settingsChanged=records.some(record=>{
          const target=record.target;
          if(record.type==="attributes"&&target&&target.id==="settingsOverlay")return true;
          if(record.type!=="childList")return false;
          return Array.from(record.addedNodes||[]).some(node=>node&&node.id==="settingsOverlay");
        });
        if(settingsChanged&&connectedAccountSettingsOpen())requestMount();
      });
      connectedAccountBridgeObserver.observe(root.document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    }

    requestMount();
  }

  function scheduleProductionFirebaseRuntime(){
    if(!root.document||!root.location)return;
    const launch=()=>{
      const run=()=>initializeProductionFirebaseRuntime().catch(()=>undefined);
      if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(run,{timeout:2500});
      else root.setTimeout(run,900);
    };
    if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",launch,{once:true});
    else launch();
  }

  installConnectedAccountSettingsBridge();
  scheduleProductionFirebaseRuntime();

  return Object.freeze({
    contractVersion:2,
    productionOrigin:PRODUCTION_ORIGIN,
    productionPathPrefix:PRODUCTION_PATH_PREFIX,
    firebaseSdkVersion:FIREBASE_SDK_VERSION,
    firebaseAppModule:FIREBASE_APP_MODULE,
    firebaseAppCheckModule:FIREBASE_APP_CHECK_MODULE,
    firebaseAuthModule:FIREBASE_AUTH_MODULE,
    firebaseFirestoreModule:FIREBASE_FIRESTORE_MODULE,
    runtimeConfigPath:CONFIG_PATH,
    bootstrapPath:BOOTSTRAP_PATH,
    connectedAccountPath:CONNECTED_ACCOUNT_PATH,
    enforcementEnabled:false,
    billingRequired:false,
    blazeRequired:false,
    cloudRunRequired:false,
    cloudFunctionsRequired:false,
    persistentFirestoreCache:false,
    authPersistence:"browserSessionPersistence",
    provider:"google",
    signInFlow:"popup",
    additionalGoogleScopes:0,
    browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE,
    classifyContext:classifyRuntimeContext,
    readRuntimeConfig,
    initialize:initializeProductionFirebaseRuntime,
    ensureAccountServices:ensureSparkAccountServices,
    loadConnectedAccount:loadConnectedAccountScript,
    diagnostics:getProductionFirebaseRuntimeDiagnostics
  });
});
