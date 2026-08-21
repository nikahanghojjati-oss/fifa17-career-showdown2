"use strict";

const trustedAppAttestationRequest=require("../js/trustedAppAttestationRequest.js");
const trustedAccountBootstrapExecution=require("../js/trustedAccountBootstrapExecution.js");

const PRODUCTION_ORIGIN="https://nikahanghojjati-oss.github.io";
const PRODUCTION_APP_CHECK_IDENTITY=Object.freeze({
  appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd",
  projectNumber:"409396353288",
  projectId:"fifa17-career-showdown-prod"
});
const ACCOUNT_BOOTSTRAP_OPERATION="account-bootstrap";
const ACCOUNT_BOOTSTRAP_SCOPE="account-bootstrap-only";

function isRecord(value){
  return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
}

function deepFreeze(value){
  if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function reject(code){
  return deepFreeze({ok:false,action:"reject",code});
}

function readSingleHeader(headers,name){
  if(!isRecord(headers))return null;
  const target=name.toLowerCase();
  let found=null;
  for(const [key,value] of Object.entries(headers)){
    if(String(key).toLowerCase()!==target)continue;
    if(Array.isArray(value)){
      if(value.length!==1||typeof value[0]!=="string"||!value[0].trim())return null;
      if(found!==null)return null;
      found=value[0].trim();
      continue;
    }
    if(typeof value!=="string"||!value.trim()||found!==null)return null;
    found=value.trim();
  }
  return found;
}

function readBearerIdToken(headers){
  const authorization=readSingleHeader(headers,"authorization");
  if(!authorization)return null;
  const match=authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match&&match[1]?match[1]:null;
}

function validateProvider(provider){
  return isRecord(provider)
    &&typeof provider.verifyAppCheckToken==="function"
    &&typeof provider.verifyIdToken==="function"
    &&typeof provider.runAtomicAccountBootstrap==="function";
}

async function executeProductionTrustedRequest(input){
  if(!isRecord(input))return reject("PRODUCTION_TRUSTED_RUNTIME_INVALID_REQUEST");
  if(!validateProvider(input.provider))return reject("PRODUCTION_TRUSTED_RUNTIME_PROVIDER_UNAVAILABLE");

  const method=typeof input.method==="string"?input.method.trim().toUpperCase():"";
  const origin=typeof input.origin==="string"?input.origin.trim():"";
  const headers=isRecord(input.headers)?input.headers:{};
  if(!method)return reject("PRODUCTION_TRUSTED_RUNTIME_METHOD_REQUIRED");

  const idToken=method==="OPTIONS"?null:readBearerIdToken(headers);
  if(method!=="OPTIONS"&&!idToken)return reject("PRODUCTION_TRUSTED_RUNTIME_BEARER_TOKEN_REQUIRED");

  const protectedResult=await trustedAppAttestationRequest.executeProtectedRequest({
    method,
    origin,
    url:typeof input.url==="string"?input.url:null,
    headers,
    idToken,
    payload:null,
    query:null,
    operation:ACCOUNT_BOOTSTRAP_OPERATION,
    expectedAppCheckIdentity:PRODUCTION_APP_CHECK_IDENTITY,
    verifyAppCheckToken:input.provider.verifyAppCheckToken,
    verifyIdToken:input.provider.verifyIdToken,
    authorizeApplicationOperation:async authorizationInput=>deepFreeze({
      authorized:Boolean(
        authorizationInput
        &&authorizationInput.operation===ACCOUNT_BOOTSTRAP_OPERATION
        &&authorizationInput.accountId
        &&authorizationInput.providerPrincipal
        &&authorizationInput.providerPrincipal.uid===authorizationInput.accountId
      ),
      authorizationScope:ACCOUNT_BOOTSTRAP_SCOPE
    }),
    executeTrustedOperation:async operationInput=>{
      if(!operationInput||operationInput.operation!==ACCOUNT_BOOTSTRAP_OPERATION||operationInput.authorizationScope!==ACCOUNT_BOOTSTRAP_SCOPE){
        return reject("PRODUCTION_TRUSTED_RUNTIME_OPERATION_SCOPE_INVALID");
      }
      return trustedAccountBootstrapExecution.executeAuthorizedAccountBootstrap({
        accountId:operationInput.accountId,
        providerPrincipal:operationInput.providerPrincipal,
        applicationAuthorizationGranted:ACCOUNT_BOOTSTRAP_SCOPE,
        runAtomicAccountBootstrap:input.provider.runAtomicAccountBootstrap
      });
    }
  });

  if(!protectedResult||protectedResult.ok!==true)return protectedResult;
  if(protectedResult.action==="preflight")return protectedResult;
  if(!protectedResult.result||protectedResult.result.ok!==true)return protectedResult.result||reject("PRODUCTION_TRUSTED_RUNTIME_OPERATION_FAILED");

  return deepFreeze({
    ok:true,
    action:protectedResult.result.action,
    accountId:protectedResult.accountId,
    documentPath:protectedResult.result.documentPath,
    revision:protectedResult.result.revision,
    status:protectedResult.result.status||null,
    preserveExisting:protectedResult.result.preserveExisting===true,
    appAttestationVerified:true,
    revocationChecked:true,
    applicationAuthorizationGranted:ACCOUNT_BOOTSTRAP_SCOPE
  });
}

module.exports=deepFreeze({
  contractVersion:1,
  productionRuntimeTarget:"google-cloud-run-https",
  productionProjectId:"fifa17-career-showdown-prod",
  allowedOrigin:PRODUCTION_ORIGIN,
  expectedAppCheckIdentity:PRODUCTION_APP_CHECK_IDENTITY,
  operation:ACCOUNT_BOOTSTRAP_OPERATION,
  authorizationScope:ACCOUNT_BOOTSTRAP_SCOPE,
  appCheckEnforcementForFirebaseProducts:false,
  browserFirestoreWrites:"deny-all",
  directBrowserTrustedMutationAuthority:false,
  executeProductionTrustedRequest
});
