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
  const FALLBACK_RUNTIME_REVISION="1.9.0-r1";
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
  let productionAppCheck=null;
  let productionAppCheckGetToken=null;
  let appCheckTokenObserverUnsubscribe=null;
  let accountServices=null;
  let accountServicesPromise=null;
  let tokenRefreshPromise=null;

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
      const response=await fetchImpl(url,{cache:"force-cache",credentials:"same-origin"});
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
    const appModule=await importImpl(FIREBASE_APP_MODULE);
    return {initializeApp:appModule.initializeApp};
  }
  function appCheckTokenObserved(tokenResult){
    return Boolean(tokenResult&&typeof tokenResult.token==="string"&&tokenResult.token.length>0);
  }

  function appCheckTokenExpiry(tokenResult){
    return Number.isFinite(tokenResult&&tokenResult.expireTimeMillis)?tokenResult.expireTimeMillis:null;
  }

  function recordAppCheckTokenObservation(tokenResult,source){
    const observed=appCheckTokenObserved(tokenResult);
    const nextExpiry=appCheckTokenExpiry(tokenResult);
    const previousExpiry=Number.isFinite(runtimeState.tokenExpireTimeMillis)?runtimeState.tokenExpireTimeMillis:null;
    const transitioned=Boolean(observed&&nextExpiry!==null&&previousExpiry!==null&&nextExpiry!==previousExpiry);
    const tokenRefreshCount=(runtimeState.tokenRefreshCount||0)+(transitioned?1:0);
    return setRuntimeState({
      ...runtimeState,
      status:observed?"ready":"ready-app-check-degraded",
      connected:true,
      tokenObserved:observed,
      appCheckDegraded:!observed,
      tokenExpireTimeMillis:nextExpiry!==null?nextExpiry:previousExpiry,
      tokenLifecycleObserved:runtimeState.tokenLifecycleObserved===true||transitioned,
      tokenRefreshCount,
      lastTokenTransition:transitioned?source:(runtimeState.lastTokenTransition||"initial"),
      appCheckTokenObserverHealthy:runtimeState.appCheckTokenObserverInstalled===true?true:runtimeState.appCheckTokenObserverHealthy
    });
  }

  function installAppCheckTokenLifecycleObserver(appCheck,sdk){
    if(typeof sdk.onTokenChanged!=="function"){
      setRuntimeState({...runtimeState,appCheckTokenObserverInstalled:false,appCheckTokenObserverHealthy:null});
      return false;
    }
    if(typeof appCheckTokenObserverUnsubscribe==="function"){
      try{appCheckTokenObserverUnsubscribe();}catch(_error){}
      appCheckTokenObserverUnsubscribe=null;
    }
    try{
      const unsubscribe=sdk.onTokenChanged(appCheck,{
        next(tokenResult){
          recordAppCheckTokenObservation(tokenResult,"sdk-token-changed");
        },
        error(error){
          setRuntimeState({...runtimeState,appCheckTokenObserverInstalled:true,appCheckTokenObserverHealthy:false,lastTokenLifecycleError:"observer-callback-error"});
          if(root.console&&typeof root.console.warn==="function"){
            root.console.warn("[Career Mode Showdown] App Check token lifecycle observation reported an error; connected and local state remain unchanged.",error);
          }
        }
      });
      appCheckTokenObserverUnsubscribe=typeof unsubscribe==="function"?unsubscribe:null;
      setRuntimeState({...runtimeState,appCheckTokenObserverInstalled:true,appCheckTokenObserverHealthy:true});
      return true;
    }catch(error){
      setRuntimeState({...runtimeState,appCheckTokenObserverInstalled:false,appCheckTokenObserverHealthy:false,lastTokenLifecycleError:"observer-registration-failed"});
      if(root.console&&typeof root.console.warn==="function"){
        root.console.warn("[Career Mode Showdown] App Check token lifecycle observer is unavailable; SDK auto-refresh remains enabled and local mode is unaffected.",error);
      }
      return false;
    }
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
      serverTimestamp:firestoreModule.serverTimestamp,
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
        return setRuntimeState({status:contextCode,attempted:false,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
      }

      setRuntimeState({status:"initializing",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
      const runtimeConfig=options.runtimeConfig
        ? {ok:true,config:options.runtimeConfig}
        : await readRuntimeConfig(options.fetchImpl||root.fetch);
      if(!runtimeConfig.ok){
        return setRuntimeState({status:runtimeConfig.code,attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
      }
      const config=runtimeConfig.config;
      if(!config||config.schemaVersion!==1||config.configured!==true||!config.firebaseConfig||config.firebaseConfig.projectId!=="fifa17-career-showdown-prod"){
        return setRuntimeState({status:"runtime-config-invalid",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
      }

      try{
        const sdk=options.firebaseSdk||await loadFirebaseSdk(options.importImpl);
        if(typeof sdk.initializeApp!=="function")throw new Error("Firebase initializeApp is unavailable.");
        productionApp=sdk.initializeApp(config.firebaseConfig);
        productionAppCheck=null;
        productionAppCheckGetToken=null;
        setRuntimeState({
          status:"ready",
          attempted:true,
          connected:true,
          tokenObserved:false,
          appCheckDegraded:false,
          appCheckDisabled:true,
          tokenExpireTimeMillis:null,
          tokenLifecycleObserved:false,
          tokenRefreshCount:0,
          tokenRefreshSuccessCount:0,
          tokenRefreshFailureCount:0,
          tokenRefreshAttempted:false,
          lastTokenRefreshStatus:"disabled",
          lastTokenTransition:"disabled",
          appCheckTokenObserverInstalled:false,
          appCheckTokenObserverHealthy:null,
          provider:"firebase-auth-firestore",
          sdkVersion:FIREBASE_SDK_VERSION,
          enforcement:false,
          authInitialized:false,
          firestoreInitialized:false,
          persistentFirestoreCache:false,
          authPersistence:"browserSessionPersistence",
          browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE
        });
        return runtimeState;
      }catch(error){
        productionApp=null;
        productionAppCheck=null;
        productionAppCheckGetToken=null;
        if(root.console&&typeof root.console.warn==="function"){
          root.console.warn("[Career Mode Showdown] Production Firebase initialization is unavailable.",error);
        }
        return setRuntimeState({status:"firebase-runtime-unavailable",attempted:true,connected:false,tokenObserved:false,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
      }
    })().finally(()=>{runtimePromise=null;});
    return runtimePromise;
  }
  async function refreshProductionAppCheckToken(){
    return Object.freeze({ok:false,code:"app-check-disabled",state:runtimeState});
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
        for(const name of ["getAuth","GoogleAuthProvider","signInWithPopup","signOut","onAuthStateChanged","setPersistence","initializeFirestore","memoryLocalCache","serverTimestamp","doc","runTransaction"]){
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
          firestoreSdk:Object.freeze({Timestamp:sdk.Timestamp,serverTimestamp:sdk.serverTimestamp,doc:sdk.doc,runTransaction:sdk.runTransaction}),
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
    const launch=()=>{initializeProductionFirebaseRuntime().catch(()=>undefined);};
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
    firebaseAppCheckModule:null,
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
    refreshAppCheckToken:refreshProductionAppCheckToken,
    ensureAccountServices:ensureSparkAccountServices,
    loadConnectedAccount:loadConnectedAccountScript,
    diagnostics:getProductionFirebaseRuntimeDiagnostics
  });
});