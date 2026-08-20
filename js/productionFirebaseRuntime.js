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
  const FALLBACK_RUNTIME_REVISION="1.4.0-r2";
  const FIREBASE_APP_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`;
  const FIREBASE_APP_CHECK_MODULE=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-check.js`;

  let runtimeState=Object.freeze({status:"idle",attempted:false,connected:false,tokenObserved:false});
  let runtimePromise=null;

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

  function buildConfigUrl(){
    if(!root.document||!root.location)return null;
    const url=new URL(CONFIG_PATH,root.document.baseURI||root.location.href);
    url.searchParams.set("v",getRuntimeRevision());
    return url.href;
  }

  async function readRuntimeConfig(fetchImpl=root.fetch){
    if(typeof fetchImpl!=="function")return {ok:false,code:"runtime-config-fetch-unavailable"};
    const url=buildConfigUrl();
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

  async function initializeProductionFirebaseRuntime(options={}){
    if(runtimePromise)return runtimePromise;
    runtimePromise=(async()=>{
      const contextCode=classifyRuntimeContext(options.context||getRuntimeContext());
      if(contextCode!=="eligible"){
        return setRuntimeState({status:contextCode,attempted:false,connected:false,tokenObserved:false});
      }

      setRuntimeState({status:"initializing",attempted:true,connected:false,tokenObserved:false});
      const runtimeConfig=options.runtimeConfig
        ? {ok:true,config:options.runtimeConfig}
        : await readRuntimeConfig(options.fetchImpl||root.fetch);
      if(!runtimeConfig.ok){
        return setRuntimeState({status:runtimeConfig.code,attempted:true,connected:false,tokenObserved:false});
      }

      const bootstrap=options.bootstrap||getBootstrap();
      if(!bootstrap||typeof bootstrap.createPlan!=="function"||typeof bootstrap.initialize!=="function"){
        return setRuntimeState({status:"app-check-bootstrap-unavailable",attempted:true,connected:false,tokenObserved:false});
      }

      const bootstrapInput=buildBootstrapInput(runtimeConfig.config);
      const plan=bootstrap.createPlan(bootstrapInput);
      if(!plan||plan.ok!==true){
        return setRuntimeState({status:plan&&plan.code?plan.code:"runtime-config-invalid",attempted:true,connected:false,tokenObserved:false});
      }

      try{
        const sdk=options.firebaseSdk||await loadFirebaseSdk(options.importImpl);
        if(typeof sdk.getToken!=="function")throw new Error("Firebase App Check getToken is unavailable.");
        const initialized=bootstrap.initialize({...bootstrapInput,firebaseSdk:sdk});
        if(!initialized||initialized.ok!==true){
          return setRuntimeState({status:initialized&&initialized.code?initialized.code:"app-check-initialization-failed",attempted:true,connected:false,tokenObserved:false});
        }
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
          browserFirestoreWrites:"deny-all"
        });
      }catch(error){
        if(root.console&&typeof root.console.warn==="function"){
          root.console.warn("[Career Mode Showdown] Production App Check is temporarily unavailable; local mode remains active.",error);
        }
        return setRuntimeState({status:"app-check-runtime-unavailable",attempted:true,connected:false,tokenObserved:false});
      }
    })().finally(()=>{runtimePromise=null;});
    return runtimePromise;
  }

  function getProductionFirebaseRuntimeDiagnostics(){
    return runtimeState;
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

  scheduleProductionFirebaseRuntime();

  return freezeRuntimeState({
    contractVersion:1,
    productionOrigin:PRODUCTION_ORIGIN,
    productionPathPrefix:PRODUCTION_PATH_PREFIX,
    firebaseSdkVersion:FIREBASE_SDK_VERSION,
    firebaseAppModule:FIREBASE_APP_MODULE,
    firebaseAppCheckModule:FIREBASE_APP_CHECK_MODULE,
    runtimeConfigPath:CONFIG_PATH,
    enforcementEnabled:false,
    browserFirestoreWrites:"deny-all",
    classifyContext:classifyRuntimeContext,
    readRuntimeConfig,
    initialize:initializeProductionFirebaseRuntime,
    diagnostics:getProductionFirebaseRuntimeDiagnostics
  });
});
