(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeFirebaseProductionPreflight=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const EMULATOR_PROJECT_ID="demo-career-mode-showdown-phase1f";
  const PRODUCTION_HOST="nikahanghojjati-oss.github.io";
  const REQUIRED_WEB_CONFIG_FIELDS=Object.freeze(["apiKey","authDomain","projectId","appId","messagingSenderId"]);
  const FORBIDDEN_CREDENTIAL_KEYS=Object.freeze([
    "private_key","privateKey","privateKeyId","serviceAccount","serviceAccountKey",
    "adminCredential","adminCredentials","clientSecret","refreshToken","idToken"
  ]);
  const PUBLIC_FEATURE_KEYS=Object.freeze(["discovery","profiles","matchmaking","community","rankings"]);

  function isRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function nonEmptyString(value){
    return typeof value==="string"&&value.trim().length>0;
  }

  function containsForbiddenCredentialKey(value,seen=new Set()){
    if(!value||typeof value!=="object")return false;
    if(seen.has(value))return false;
    seen.add(value);
    for(const [key,nested] of Object.entries(value)){
      if(FORBIDDEN_CREDENTIAL_KEYS.includes(key))return true;
      if(containsForbiddenCredentialKey(nested,seen))return true;
    }
    return false;
  }

  function push(errors,code,condition){
    if(condition)errors.push(code);
  }

  function validate(candidate){
    const errors=[];
    if(!isRecord(candidate))return {ok:false,errors:["INVALID_PREFLIGHT_INPUT"]};

    const projectId=nonEmptyString(candidate.projectId)?candidate.projectId.trim():"";
    const web=isRecord(candidate.firebaseWebConfig)?candidate.firebaseWebConfig:{};
    const domains=Array.isArray(candidate.authorizedDomains)?candidate.authorizedDomains.filter(nonEmptyString).map(value=>value.trim().toLowerCase()):[];
    const auth=isRecord(candidate.auth)?candidate.auth:{};
    const location=isRecord(candidate.firestoreLocation)?candidate.firestoreLocation:{};
    const firestore=isRecord(candidate.firestore)?candidate.firestore:{};
    const security=isRecord(candidate.security)?candidate.security:{};
    const publicFeatures=isRecord(candidate.publicFeatures)?candidate.publicFeatures:{};

    push(errors,"ENVIRONMENT_NOT_PRODUCTION",candidate.environment!=="production");
    push(errors,"PROJECT_ID_MISSING",!projectId);
    push(errors,"DEMO_PROJECT_FORBIDDEN",Boolean(projectId)&&(projectId===EMULATOR_PROJECT_ID||projectId.startsWith("demo-")));
    push(errors,"WEB_CONFIG_PROJECT_MISMATCH",!nonEmptyString(web.projectId)||web.projectId.trim()!==projectId);

    for(const field of REQUIRED_WEB_CONFIG_FIELDS){
      push(errors,`WEB_CONFIG_${field.toUpperCase()}_MISSING`,!nonEmptyString(web[field]));
    }

    push(errors,"PRODUCTION_AUTHORIZED_DOMAIN_MISSING",!domains.includes(PRODUCTION_HOST));
    push(errors,"LOCALHOST_AUTHORIZED_DOMAIN_FORBIDDEN",domains.some(domain=>domain==="localhost"||domain==="127.0.0.1"||domain==="::1"));

    push(errors,"AUTH_PROVIDER_POLICY_MISMATCH",auth.provider!=="google"||auth.providerClass!=="GoogleAuthProvider");
    push(errors,"AUTH_FLOW_POLICY_MISMATCH",auth.flow!=="popup"||auth.userGestureRequired!==true);
    push(errors,"AUTH_REDIRECT_NOT_AUTHORIZED",auth.redirectAuthorized!==false);
    push(errors,"AUTH_PERSISTENCE_POLICY_MISMATCH",auth.persistence!=="browserSessionPersistence");
    push(errors,"EXTRA_OAUTH_SCOPES_NOT_AUTHORIZED",!Array.isArray(auth.extraOAuthScopes)||auth.extraOAuthScopes.length!==0);

    push(errors,"FIRESTORE_LOCATION_DECISION_REQUIRED",location.decisionRecorded!==true||!nonEmptyString(location.value));
    push(errors,"FIRESTORE_PERSISTENT_CACHE_FORBIDDEN",firestore.persistentOfflineCache!==false);
    push(errors,"CLIENT_FIRESTORE_WRITES_MUST_BE_DENIED",firestore.clientWrites!=="deny-all");
    push(errors,"TRUSTED_MUTATION_GATEWAY_NOT_AUTHORIZED",firestore.trustedMutationGatewayAuthorized!==false);

    push(errors,"WEB_API_KEY_CLASSIFICATION_INVALID",security.webApiKeyClassification!=="public-project-configuration");
    push(errors,"WEB_API_KEY_MUST_NOT_BE_SECURITY_BOUNDARY",security.webApiKeyIsAuthorizationSecret!==false);
    push(errors,"CREDENTIAL_MATERIAL_FORBIDDEN",containsForbiddenCredentialKey(candidate));

    for(const key of PUBLIC_FEATURE_KEYS){
      push(errors,`PUBLIC_${key.toUpperCase()}_FORBIDDEN`,publicFeatures[key]!==false);
    }

    return {ok:errors.length===0,errors};
  }

  function createSyntheticReadyFixture(){
    const projectId="career-mode-showdown-prod-example";
    return {
      environment:"production",
      projectId,
      firebaseWebConfig:{
        apiKey:"public-web-config-example",
        authDomain:`${projectId}.firebaseapp.com`,
        projectId,
        appId:"1:123456789:web:example",
        messagingSenderId:"123456789"
      },
      authorizedDomains:[PRODUCTION_HOST],
      auth:{
        provider:"google",
        providerClass:"GoogleAuthProvider",
        flow:"popup",
        userGestureRequired:true,
        redirectAuthorized:false,
        persistence:"browserSessionPersistence",
        extraOAuthScopes:[]
      },
      firestoreLocation:{
        decisionRecorded:true,
        value:"synthetic-location-example"
      },
      firestore:{
        persistentOfflineCache:false,
        clientWrites:"deny-all",
        trustedMutationGatewayAuthorized:false
      },
      security:{
        webApiKeyClassification:"public-project-configuration",
        webApiKeyIsAuthorizationSecret:false
      },
      publicFeatures:{
        discovery:false,
        profiles:false,
        matchmaking:false,
        community:false,
        rankings:false
      }
    };
  }

  return Object.freeze({
    contractVersion:1,
    stage:"2D",
    productionRuntimeConnected:false,
    emulatorProjectId:EMULATOR_PROJECT_ID,
    productionHost:PRODUCTION_HOST,
    requiredWebConfigFields:REQUIRED_WEB_CONFIG_FIELDS,
    validate,
    createSyntheticReadyFixture
  });
});
