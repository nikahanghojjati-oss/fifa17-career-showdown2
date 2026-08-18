(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedRequestAuthentication=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const TRUSTED_REQUEST_AUTH_ERROR_CODES=Object.freeze({
    "auth/id-token-revoked":"PROVIDER_TOKEN_REVOKED",
    "auth/user-disabled":"PROVIDER_ACCOUNT_DISABLED",
    "auth/id-token-expired":"PROVIDER_TOKEN_EXPIRED",
    "auth/user-not-found":"PROVIDER_ACCOUNT_UNAVAILABLE",
    "auth/invalid-id-token":"INVALID_PROVIDER_TOKEN",
    "auth/argument-error":"INVALID_PROVIDER_TOKEN"
  });

  function isTrustedRequestAuthRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function deepFreezeTrustedRequestAuth(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreezeTrustedRequestAuth);
    return value;
  }

  function normalizeTrustedRequestAuthToken(value){
    return typeof value==="string"&&value.trim().length>0?value.trim():null;
  }

  function normalizeTrustedRequestAuthUid(decodedToken){
    if(!isTrustedRequestAuthRecord(decodedToken)||typeof decodedToken.uid!=="string"||decodedToken.uid.trim().length===0){
      return null;
    }
    const uid=decodedToken.uid.trim();
    if(typeof decodedToken.sub==="string"&&decodedToken.sub.trim().length>0&&decodedToken.sub.trim()!==uid){
      return null;
    }
    return uid;
  }

  function mapTrustedRequestAuthError(error){
    const code=isTrustedRequestAuthRecord(error)&&typeof error.code==="string"?error.code:"";
    return TRUSTED_REQUEST_AUTH_ERROR_CODES[code]||"TRUSTED_PROVIDER_VERIFICATION_FAILED";
  }

  async function verifyTrustedRequestPrincipal(input){
    if(!isTrustedRequestAuthRecord(input)){
      return deepFreezeTrustedRequestAuth({ok:false,action:"reject",code:"INVALID_TRUSTED_REQUEST_INPUT"});
    }

    const idToken=normalizeTrustedRequestAuthToken(input.idToken);
    if(!idToken){
      return deepFreezeTrustedRequestAuth({ok:false,action:"reject",code:"UNAUTHENTICATED_PROVIDER"});
    }
    if(typeof input.verifyIdToken!=="function"){
      return deepFreezeTrustedRequestAuth({ok:false,action:"reject",code:"TRUSTED_VERIFIER_UNAVAILABLE"});
    }

    let decodedToken;
    try{
      decodedToken=await input.verifyIdToken(idToken,true);
    }catch(error){
      return deepFreezeTrustedRequestAuth({ok:false,action:"reject",code:mapTrustedRequestAuthError(error)});
    }

    const uid=normalizeTrustedRequestAuthUid(decodedToken);
    if(!uid){
      return deepFreezeTrustedRequestAuth({ok:false,action:"reject",code:"VERIFIED_PROVIDER_IDENTITY_INVALID"});
    }

    return deepFreezeTrustedRequestAuth({
      ok:true,
      action:"authenticated",
      accountId:uid,
      providerPrincipal:{uid},
      revocationChecked:true,
      applicationAuthorizationGranted:false
    });
  }

  return deepFreezeTrustedRequestAuth({
    contractVersion:1,
    stage:"2F",
    productionRuntimeConnected:false,
    verificationBoundary:"trusted-server-adapter-required",
    providerIdentitySource:"Firebase Auth uid returned by trusted verifyIdToken(idToken, true)",
    revocationCheckRequired:true,
    applicationAuthorizationSeparate:true,
    errorCodes:TRUSTED_REQUEST_AUTH_ERROR_CODES,
    verifyTrustedRequestPrincipal
  });
});
