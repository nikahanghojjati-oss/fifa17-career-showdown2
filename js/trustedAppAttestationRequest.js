(function(root,factory){
  const api=factory(
    typeof module!=="undefined"&&module.exports?require("./trustedRequestAuthentication.js"):root.CareerModeTrustedRequestAuthentication
  );
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedAppAttestationRequest=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(trustedRequestAuthentication){
  "use strict";

  const STAGE2I_PUBLIC_ORIGIN="https://nikahanghojjati-oss.github.io";
  const STAGE2I_APP_CHECK_HEADER="X-Firebase-AppCheck";
  const STAGE2I_PROVIDER="firebase-app-check-recaptcha-enterprise";
  const STAGE2I_DEFAULT_RISK_THRESHOLD=0.5;
  const STAGE2I_DEFAULT_TOKEN_TTL_SECONDS=3600;
  const STAGE2I_OPTIONAL_REPLAY_PERMISSION="firebaseappcheck.appCheckTokens.verify";
  const STAGE2I_OPTIONAL_REPLAY_ROLE="roles/firebaseappcheck.tokenVerifier";
  const STAGE2I_STAGE2H_RUNTIME_PERMISSIONS=Object.freeze([
    "firebaseauth.users.get",
    "datastore.databases.get",
    "datastore.entities.get",
    "datastore.entities.create"
  ]);

  function isStage2IRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function deepFreezeStage2I(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreezeStage2I);
    return value;
  }

  function rejectStage2I(code){
    return deepFreezeStage2I({ok:false,action:"reject",code});
  }

  function normalizeStage2IString(value){
    return typeof value==="string"&&value.trim().length>0?value.trim():null;
  }

  function readStage2IHeader(headers,name){
    if(!isStage2IRecord(headers))return null;
    const target=name.toLowerCase();
    let matched=null;
    for(const [key,value] of Object.entries(headers)){
      if(typeof key!=="string"||key.toLowerCase()!==target)continue;
      const normalized=normalizeStage2IString(value);
      if(!normalized||matched!==null)return null;
      matched=normalized;
    }
    return matched;
  }

  function normalizeStage2IExpectedIdentity(value){
    if(!isStage2IRecord(value))return null;
    const appId=normalizeStage2IString(value.appId);
    const projectNumber=normalizeStage2IString(value.projectNumber);
    const projectId=normalizeStage2IString(value.projectId);
    if(!appId||!projectNumber||!projectId)return null;
    return deepFreezeStage2I({appId,projectNumber,projectId});
  }

  function containsStage2ITransientCredential(value,secrets,seen=new Set()){
    if(typeof value==="string")return secrets.has(value.trim());
    if(!value||typeof value!=="object")return false;
    if(seen.has(value))return false;
    seen.add(value);
    const reservedKeys=new Set(["appchecktoken","idtoken","firebaseidtoken","authorization","x-firebase-appcheck"]);
    for(const [key,nested] of Object.entries(value)){
      if(reservedKeys.has(String(key).toLowerCase()))return true;
      if(containsStage2ITransientCredential(nested,secrets,seen))return true;
    }
    return false;
  }

  function urlContainsStage2ITransientCredential(value,secrets){
    const url=normalizeStage2IString(value);
    if(!url)return false;
    for(const secret of secrets){
      if(url.includes(secret))return true;
    }
    return false;
  }

  function validateStage2IDecodedAppCheckIdentity(decoded,expected){
    if(!isStage2IRecord(decoded))return "STAGE2I_APP_CHECK_IDENTITY_INVALID";
    const appId=normalizeStage2IString(decoded.app_id);
    const subject=normalizeStage2IString(decoded.sub);
    if(!appId||!subject||appId!==subject)return "STAGE2I_APP_CHECK_IDENTITY_INVALID";
    if(appId!==expected.appId)return "STAGE2I_APP_CHECK_APP_MISMATCH";
    if(!Array.isArray(decoded.aud)||decoded.aud.length!==2)return "STAGE2I_APP_CHECK_PROJECT_MISMATCH";
    if(String(decoded.aud[0])!==expected.projectNumber||String(decoded.aud[1])!==expected.projectId){
      return "STAGE2I_APP_CHECK_PROJECT_MISMATCH";
    }
    return null;
  }

  async function executeStage2IProtectedRequest(input){
    if(!isStage2IRecord(input))return rejectStage2I("INVALID_STAGE2I_REQUEST");

    const method=normalizeStage2IString(input.method);
    const origin=normalizeStage2IString(input.origin);
    if(!method)return rejectStage2I("STAGE2I_METHOD_REQUIRED");
    if(origin!==STAGE2I_PUBLIC_ORIGIN)return rejectStage2I("STAGE2I_ORIGIN_FORBIDDEN");

    if(method.toUpperCase()==="OPTIONS"){
      return deepFreezeStage2I({
        ok:true,
        action:"preflight",
        allowedOrigin:STAGE2I_PUBLIC_ORIGIN,
        protectedOperationExecuted:false,
        protectedDataReturned:false,
        applicationAuthorizationGranted:false
      });
    }

    const expectedIdentity=normalizeStage2IExpectedIdentity(input.expectedAppCheckIdentity);
    if(!expectedIdentity)return rejectStage2I("STAGE2I_EXPECTED_APP_CHECK_IDENTITY_REQUIRED");

    const appCheckToken=readStage2IHeader(input.headers,STAGE2I_APP_CHECK_HEADER);
    if(!appCheckToken)return rejectStage2I("STAGE2I_APP_CHECK_TOKEN_REQUIRED");
    const idToken=normalizeStage2IString(input.idToken);
    const transientSecrets=new Set([appCheckToken]);
    if(idToken)transientSecrets.add(idToken);
    if(
      containsStage2ITransientCredential(input.payload,transientSecrets)
      ||containsStage2ITransientCredential(input.query,transientSecrets)
      ||urlContainsStage2ITransientCredential(input.url,transientSecrets)
    ){
      return rejectStage2I("STAGE2I_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN");
    }
    if(typeof input.verifyAppCheckToken!=="function")return rejectStage2I("STAGE2I_APP_CHECK_VERIFIER_UNAVAILABLE");

    let decodedAppCheck;
    try{
      decodedAppCheck=await input.verifyAppCheckToken(appCheckToken);
    }catch(_error){
      return rejectStage2I("STAGE2I_APP_CHECK_VERIFICATION_FAILED");
    }

    const appCheckIdentityError=validateStage2IDecodedAppCheckIdentity(decodedAppCheck,expectedIdentity);
    if(appCheckIdentityError)return rejectStage2I(appCheckIdentityError);

    if(!trustedRequestAuthentication||typeof trustedRequestAuthentication.verifyTrustedRequestPrincipal!=="function"){
      return rejectStage2I("STAGE2I_TRUSTED_AUTHENTICATION_UNAVAILABLE");
    }

    const principal=await trustedRequestAuthentication.verifyTrustedRequestPrincipal({
      idToken:input.idToken,
      verifyIdToken:input.verifyIdToken
    });
    if(!principal.ok)return principal;

    if(typeof input.authorizeApplicationOperation!=="function"){
      return rejectStage2I("STAGE2I_APPLICATION_AUTHORIZER_UNAVAILABLE");
    }

    const operation=normalizeStage2IString(input.operation);
    if(!operation)return rejectStage2I("STAGE2I_OPERATION_REQUIRED");

    let authorization;
    try{
      authorization=await input.authorizeApplicationOperation(deepFreezeStage2I({
        accountId:principal.accountId,
        providerPrincipal:principal.providerPrincipal,
        operation
      }));
    }catch(_error){
      return rejectStage2I("STAGE2I_APPLICATION_AUTHORIZATION_FAILED");
    }

    if(!isStage2IRecord(authorization)||authorization.authorized!==true){
      return rejectStage2I("STAGE2I_APPLICATION_AUTHORIZATION_DENIED");
    }
    const authorizationScope=normalizeStage2IString(authorization.authorizationScope);
    if(!authorizationScope)return rejectStage2I("STAGE2I_APPLICATION_AUTHORIZATION_INVALID");

    if(typeof input.executeTrustedOperation!=="function"){
      return rejectStage2I("STAGE2I_TRUSTED_OPERATION_UNAVAILABLE");
    }

    let result;
    try{
      result=await input.executeTrustedOperation(deepFreezeStage2I({
        accountId:principal.accountId,
        providerPrincipal:principal.providerPrincipal,
        operation,
        authorizationScope,
        payload:input.payload
      }));
    }catch(_error){
      return rejectStage2I("STAGE2I_TRUSTED_OPERATION_FAILED");
    }

    return deepFreezeStage2I({
      ok:true,
      action:"executed",
      accountId:principal.accountId,
      operation,
      authorizationScope,
      appAttestationVerified:true,
      revocationChecked:true,
      applicationAuthorizationGranted:true,
      result
    });
  }

  return deepFreezeStage2I({
    contractVersion:1,
    stage:"2I",
    providerDocumentationCheckedAt:"2026-08-19",
    productionRuntimeConnected:false,
    productionProvisioningAuthorized:false,
    appCheckProvider:STAGE2I_PROVIDER,
    appCheckHeader:STAGE2I_APP_CHECK_HEADER,
    allowedBrowserOrigins:Object.freeze([STAGE2I_PUBLIC_ORIGIN]),
    recaptchaEnterpriseDefaultRiskThreshold:STAGE2I_DEFAULT_RISK_THRESHOLD,
    appCheckDefaultTokenTtlSeconds:STAGE2I_DEFAULT_TOKEN_TTL_SECONDS,
    debugProviderProductionAllowed:false,
    productionRecaptchaLocalhostAllowed:false,
    limitedUseTokenConsumptionRequired:false,
    optionalReplayPermission:STAGE2I_OPTIONAL_REPLAY_PERMISSION,
    optionalReplayRole:STAGE2I_OPTIONAL_REPLAY_ROLE,
    stage2HRuntimePermissions:STAGE2I_STAGE2H_RUNTIME_PERMISSIONS,
    appCheckGrantsUserIdentity:false,
    appCheckGrantsApplicationAuthorization:false,
    appCheckGrantsTrustedOperationAuthority:false,
    browserFirestoreWrites:"deny-all",
    sharedMutationAuthorityGranted:false,
    executeProtectedRequest:executeStage2IProtectedRequest
  });
});
