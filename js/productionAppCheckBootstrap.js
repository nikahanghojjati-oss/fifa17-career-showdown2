(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionAppCheckBootstrap=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const PRODUCTION_ORIGIN="https://nikahanghojjati-oss.github.io";
  const PRODUCTION_PROJECT_ID="fifa17-career-showdown-prod";
  const PRODUCTION_AUTH_DOMAIN="fifa17-career-showdown-prod.firebaseapp.com";
  const PRODUCTION_STORAGE_BUCKET="fifa17-career-showdown-prod.firebasestorage.app";
  const PRODUCTION_MESSAGING_SENDER_ID="409396353288";
  const PRODUCTION_APP_ID="1:409396353288:web:1d3a2a5d6921de6ccbb4bd";
  const APP_CHECK_PROVIDER="recaptcha-enterprise";
  const APP_CHECK_TOKEN_TTL_SECONDS=3600;
  const APP_CHECK_RISK_THRESHOLD=0.5;

  function deepFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function isRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function stringValue(value){
    return typeof value==="string"&&value.trim()?value.trim():null;
  }

  function reject(code){
    return deepFreeze({ok:false,code});
  }

  function validateFirebaseConfig(config){
    if(!isRecord(config))return "APP_CHECK_FIREBASE_CONFIG_REQUIRED";
    if(!stringValue(config.apiKey))return "APP_CHECK_FIREBASE_API_KEY_REQUIRED";
    if(config.projectId!==PRODUCTION_PROJECT_ID)return "APP_CHECK_PROJECT_ID_MISMATCH";
    if(config.authDomain!==PRODUCTION_AUTH_DOMAIN)return "APP_CHECK_AUTH_DOMAIN_MISMATCH";
    if(config.storageBucket!==PRODUCTION_STORAGE_BUCKET)return "APP_CHECK_STORAGE_BUCKET_MISMATCH";
    if(String(config.messagingSenderId||"")!==PRODUCTION_MESSAGING_SENDER_ID)return "APP_CHECK_MESSAGING_SENDER_MISMATCH";
    if(config.appId!==PRODUCTION_APP_ID)return "APP_CHECK_APP_ID_MISMATCH";
    return null;
  }

  function createPlan(input){
    if(!isRecord(input))return reject("APP_CHECK_BOOTSTRAP_INPUT_REQUIRED");
    if(stringValue(input.origin)!==PRODUCTION_ORIGIN)return reject("APP_CHECK_PRODUCTION_ORIGIN_REQUIRED");
    if(input.debug===true)return reject("APP_CHECK_DEBUG_FORBIDDEN_IN_PRODUCTION");
    if(input.enforcement===true)return reject("APP_CHECK_PREMATURE_ENFORCEMENT_FORBIDDEN");
    const configError=validateFirebaseConfig(input.firebaseConfig);
    if(configError)return reject(configError);
    const siteKey=stringValue(input.recaptchaEnterpriseSiteKey);
    if(!siteKey)return reject("APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY_REQUIRED");
    return deepFreeze({
      ok:true,
      provider:APP_CHECK_PROVIDER,
      productionOrigin:PRODUCTION_ORIGIN,
      projectId:PRODUCTION_PROJECT_ID,
      appId:PRODUCTION_APP_ID,
      tokenTtlSeconds:APP_CHECK_TOKEN_TTL_SECONDS,
      riskThreshold:APP_CHECK_RISK_THRESHOLD,
      tokenAutoRefresh:true,
      enforcement:false,
      debug:false,
      browserFirestoreWrites:"deny-all",
      trustedMutationAuthorityGranted:false,
      firebaseConfig:{...input.firebaseConfig},
      recaptchaEnterpriseSiteKey:siteKey
    });
  }

  function initialize(input){
    const plan=createPlan(input);
    if(!plan.ok)return plan;
    const sdk=input.firebaseSdk;
    if(!isRecord(sdk))return reject("APP_CHECK_FIREBASE_SDK_REQUIRED");
    if(typeof sdk.initializeApp!=="function")return reject("APP_CHECK_INITIALIZE_APP_REQUIRED");
    if(typeof sdk.initializeAppCheck!=="function")return reject("APP_CHECK_INITIALIZE_APP_CHECK_REQUIRED");
    if(typeof sdk.ReCaptchaEnterpriseProvider!=="function")return reject("APP_CHECK_ENTERPRISE_PROVIDER_REQUIRED");

    let app;
    let appCheck;
    try{
      app=sdk.initializeApp(plan.firebaseConfig);
      const provider=new sdk.ReCaptchaEnterpriseProvider(plan.recaptchaEnterpriseSiteKey);
      appCheck=sdk.initializeAppCheck(app,{
        provider,
        isTokenAutoRefreshEnabled:true
      });
    }catch(_error){
      return reject("APP_CHECK_INITIALIZATION_FAILED");
    }

    return deepFreeze({
      ok:true,
      app,
      appCheck,
      provider:plan.provider,
      tokenAutoRefresh:true,
      enforcement:false,
      browserFirestoreWrites:"deny-all",
      trustedMutationAuthorityGranted:false
    });
  }

  return deepFreeze({
    contractVersion:1,
    productionRuntimeConnected:false,
    productionOrigin:PRODUCTION_ORIGIN,
    productionProjectId:PRODUCTION_PROJECT_ID,
    productionAppId:PRODUCTION_APP_ID,
    appCheckProvider:APP_CHECK_PROVIDER,
    appCheckTokenTtlSeconds:APP_CHECK_TOKEN_TTL_SECONDS,
    appCheckRiskThreshold:APP_CHECK_RISK_THRESHOLD,
    debugProviderProductionAllowed:false,
    enforcementEnabled:false,
    tokenAutoRefreshRequired:true,
    browserFirestoreWrites:"deny-all",
    trustedMutationAuthorityGranted:false,
    createPlan,
    initialize
  });
});
