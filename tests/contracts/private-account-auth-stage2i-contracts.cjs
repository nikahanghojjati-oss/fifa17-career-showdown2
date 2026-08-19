const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const modulePath=path.resolve(__dirname,"../../js/trustedAppAttestationRequest.js");
const source=fs.readFileSync(modulePath,"utf8");
const stage2i=require(modulePath);

const EXPECTED=Object.freeze({
  appId:"1:1234567890:web:stage2i-synthetic",
  projectNumber:"1234567890",
  projectId:"career-mode-showdown-stage2i-synthetic"
});
const APP_CHECK_TOKEN="stage2i-app-check-token-secret";
const ID_TOKEN="stage2i-firebase-id-token-secret";
const UID="stage2i_account_uid";

function decodedAppCheck(overrides={}){
  return {
    app_id:EXPECTED.appId,
    sub:EXPECTED.appId,
    aud:[EXPECTED.projectNumber,EXPECTED.projectId],
    ...overrides
  };
}

function makeRequest(overrides={}){
  const calls=[];
  return {
    calls,
    request:{
      method:"POST",
      origin:"https://nikahanghojjati-oss.github.io",
      headers:{"X-Firebase-AppCheck":APP_CHECK_TOKEN},
      expectedAppCheckIdentity:EXPECTED,
      idToken:ID_TOKEN,
      operation:"account-bootstrap",
      payload:{requestId:"stage2i-synthetic-request"},
      async verifyAppCheckToken(token){
        calls.push(["app-check",token,arguments.length]);
        return decodedAppCheck();
      },
      async verifyIdToken(token,checkRevoked){
        calls.push(["firebase-auth",token,checkRevoked]);
        return {uid:UID,sub:UID};
      },
      async authorizeApplicationOperation(context){
        calls.push(["application-authorization",context]);
        return {authorized:true,authorizationScope:"account-bootstrap-only"};
      },
      async executeTrustedOperation(context){
        calls.push(["trusted-operation",context]);
        return {action:"existing",revision:0};
      },
      ...overrides
    }
  };
}

(async()=>{
  assert.equal(stage2i.stage,"2I");
  assert.equal(stage2i.productionRuntimeConnected,false);
  assert.equal(stage2i.productionProvisioningAuthorized,false);
  assert.equal(stage2i.appCheckProvider,"firebase-app-check-recaptcha-enterprise");
  assert.equal(stage2i.appCheckHeader,"X-Firebase-AppCheck");
  assert.deepEqual([...stage2i.allowedBrowserOrigins],["https://nikahanghojjati-oss.github.io"]);
  assert.equal(stage2i.recaptchaEnterpriseDefaultRiskThreshold,0.5);
  assert.equal(stage2i.appCheckDefaultTokenTtlSeconds,3600);
  assert.equal(stage2i.debugProviderProductionAllowed,false);
  assert.equal(stage2i.productionRecaptchaLocalhostAllowed,false);
  assert.equal(stage2i.limitedUseTokenConsumptionRequired,false);
  assert.equal(stage2i.optionalReplayPermission,"firebaseappcheck.appCheckTokens.verify");
  assert.equal(stage2i.optionalReplayRole,"roles/firebaseappcheck.tokenVerifier");
  assert.deepEqual([...stage2i.stage2HRuntimePermissions],[
    "firebaseauth.users.get",
    "datastore.databases.get",
    "datastore.entities.get",
    "datastore.entities.create"
  ]);
  assert.equal(stage2i.stage2HRuntimePermissions.includes(stage2i.optionalReplayPermission),false);
  assert.equal(stage2i.appCheckGrantsUserIdentity,false);
  assert.equal(stage2i.appCheckGrantsApplicationAuthorization,false);
  assert.equal(stage2i.appCheckGrantsTrustedOperationAuthority,false);
  assert.equal(stage2i.browserFirestoreWrites,"deny-all");
  assert.equal(stage2i.sharedMutationAuthorityGranted,false);

  {
    const {request,calls}=makeRequest();
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.ok,true);
    assert.equal(result.action,"executed");
    assert.equal(result.accountId,UID);
    assert.equal(result.authorizationScope,"account-bootstrap-only");
    assert.equal(result.appAttestationVerified,true);
    assert.equal(result.revocationChecked,true);
    assert.equal(result.applicationAuthorizationGranted,true);
    assert.deepEqual(result.result,{action:"existing",revision:0});
    assert.deepEqual(calls.map(call=>call[0]),[
      "app-check",
      "firebase-auth",
      "application-authorization",
      "trusted-operation"
    ]);
    assert.deepEqual(calls[0],["app-check",APP_CHECK_TOKEN,1],"App Check verification must not opt into token consumption by default.");
    assert.deepEqual(calls[1],["firebase-auth",ID_TOKEN,true],"Stage 2F revocation-aware verification must remain mandatory.");
    const authorizationInput=calls[2][1];
    const operationInput=calls[3][1];
    assert.equal(authorizationInput.accountId,UID);
    assert.equal(operationInput.accountId,UID);
    assert.equal(operationInput.authorizationScope,"account-bootstrap-only");
    assert.equal(Object.prototype.hasOwnProperty.call(authorizationInput,"idToken"),false);
    assert.equal(Object.prototype.hasOwnProperty.call(authorizationInput,"appCheckToken"),false);
    assert.equal(Object.prototype.hasOwnProperty.call(operationInput,"idToken"),false);
    assert.equal(Object.prototype.hasOwnProperty.call(operationInput,"appCheckToken"),false);
    assert.equal(JSON.stringify(result).includes(APP_CHECK_TOKEN),false);
    assert.equal(JSON.stringify(result).includes(ID_TOKEN),false);
  }

  {
    const {request,calls}=makeRequest({method:"OPTIONS",headers:{}});
    const result=await stage2i.executeProtectedRequest(request);
    assert.deepEqual(result,{
      ok:true,
      action:"preflight",
      allowedOrigin:"https://nikahanghojjati-oss.github.io",
      protectedOperationExecuted:false,
      protectedDataReturned:false,
      applicationAuthorizationGranted:false
    });
    assert.deepEqual(calls,[]);
  }

  {
    const {request,calls}=makeRequest({origin:"https://example.invalid"});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_ORIGIN_FORBIDDEN");
    assert.deepEqual(calls,[]);
  }

  {
    const {request,calls}=makeRequest({headers:{}});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_APP_CHECK_TOKEN_REQUIRED");
    assert.deepEqual(calls,[]);
  }

  {
    const {request,calls}=makeRequest({headers:{"x-firebase-appcheck":APP_CHECK_TOKEN}});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.ok,true,"App Check header matching should be case-insensitive.");
    assert.equal(calls[0][0],"app-check");
  }

  {
    const {request,calls}=makeRequest({headers:{"X-Firebase-AppCheck":APP_CHECK_TOKEN,"x-firebase-appcheck":APP_CHECK_TOKEN}});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_APP_CHECK_TOKEN_REQUIRED","Ambiguous duplicate App Check header keys must fail closed.");
    assert.deepEqual(calls,[]);
  }

  {
    const {request,calls}=makeRequest();
    request.verifyAppCheckToken=async token=>{calls.push(["app-check",token]);throw Object.assign(new Error("provider detail must not escape"),{code:"app-check/invalid-token"});};
    const result=await stage2i.executeProtectedRequest(request);
    assert.deepEqual(result,{ok:false,action:"reject",code:"STAGE2I_APP_CHECK_VERIFICATION_FAILED"});
    assert.deepEqual(calls.map(call=>call[0]),["app-check"]);
    assert.equal(JSON.stringify(result).includes("provider detail"),false);
  }

  for(const [name,decoded,code] of [
    ["missing decoded identity",{},"STAGE2I_APP_CHECK_IDENTITY_INVALID"],
    ["subject mismatch",decodedAppCheck({sub:"different-app"}),"STAGE2I_APP_CHECK_IDENTITY_INVALID"],
    ["wrong app",decodedAppCheck({app_id:"1:1234567890:web:wrong",sub:"1:1234567890:web:wrong"}),"STAGE2I_APP_CHECK_APP_MISMATCH"],
    ["wrong project number",decodedAppCheck({aud:["999",EXPECTED.projectId]}),"STAGE2I_APP_CHECK_PROJECT_MISMATCH"],
    ["wrong project id",decodedAppCheck({aud:[EXPECTED.projectNumber,"wrong-project"]}),"STAGE2I_APP_CHECK_PROJECT_MISMATCH"],
    ["missing project audience",decodedAppCheck({aud:[EXPECTED.projectNumber]}),"STAGE2I_APP_CHECK_PROJECT_MISMATCH"],
    ["extra project audience",decodedAppCheck({aud:[EXPECTED.projectNumber,EXPECTED.projectId,"unexpected-audience"]}),"STAGE2I_APP_CHECK_PROJECT_MISMATCH"]
  ]){
    const {request,calls}=makeRequest();
    request.verifyAppCheckToken=async token=>{calls.push(["app-check",token]);return decoded;};
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,code,name);
    assert.deepEqual(calls.map(call=>call[0]),["app-check"],`${name} must fail before Firebase user authentication.`);
  }

  {
    const {request,calls}=makeRequest({expectedAppCheckIdentity:{}});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_EXPECTED_APP_CHECK_IDENTITY_REQUIRED");
    assert.deepEqual(calls,[]);
  }

  {
    const {request,calls}=makeRequest();
    request.verifyIdToken=async(token,checkRevoked)=>{calls.push(["firebase-auth",token,checkRevoked]);throw {code:"auth/id-token-revoked"};};
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"PROVIDER_TOKEN_REVOKED");
    assert.deepEqual(calls.map(call=>call[0]),["app-check","firebase-auth"]);
  }

  {
    const {request,calls}=makeRequest();
    request.authorizeApplicationOperation=async context=>{calls.push(["application-authorization",context]);return {authorized:false};};
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_APPLICATION_AUTHORIZATION_DENIED");
    assert.deepEqual(calls.map(call=>call[0]),["app-check","firebase-auth","application-authorization"]);
  }

  {
    const {request,calls}=makeRequest();
    request.authorizeApplicationOperation=async context=>{calls.push(["application-authorization",context]);return {authorized:true};};
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_APPLICATION_AUTHORIZATION_INVALID");
    assert.deepEqual(calls.map(call=>call[0]),["app-check","firebase-auth","application-authorization"]);
  }

  {
    const {request,calls}=makeRequest();
    request.executeTrustedOperation=async context=>{calls.push(["trusted-operation",context]);throw new Error("provider/database detail must not escape");};
    const result=await stage2i.executeProtectedRequest(request);
    assert.deepEqual(result,{ok:false,action:"reject",code:"STAGE2I_TRUSTED_OPERATION_FAILED"});
    assert.equal(JSON.stringify(result).includes("database detail"),false);
  }

  for(const payload of [
    {appCheckToken:APP_CHECK_TOKEN},
    {nested:{idToken:ID_TOKEN}},
    {nested:{arbitrary:APP_CHECK_TOKEN}},
    {authorization:`Bearer ${ID_TOKEN}`},
    {"X-Firebase-AppCheck":"not-even-the-real-token"}
  ]){
    const {request,calls}=makeRequest({payload});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN");
    assert.deepEqual(calls,[]);
  }

  for(const query of [
    {appCheckToken:"query-copy"},
    {nested:{idToken:"query-copy"}},
    {nested:{value:APP_CHECK_TOKEN}}
  ]){
    const {request,calls}=makeRequest({query});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN","Query credential material must fail closed.");
    assert.deepEqual(calls,[]);
  }

  {
    const {request,calls}=makeRequest({url:`https://trusted.example/protected?appCheck=${encodeURIComponent(APP_CHECK_TOKEN)}`});
    const result=await stage2i.executeProtectedRequest(request);
    assert.equal(result.code,"STAGE2I_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN","Raw App Check material in URLs must fail closed.");
    assert.deepEqual(calls,[]);
  }

  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|console\.|analytics|fetch\s*\(/i);
  assert.match(source,/verifyAppCheckToken\(appCheckToken\)/);
  assert.match(source,/decoded\.aud\.length!==2/);
  assert.match(source,/containsStage2ITransientCredential\(input\.query/);
  assert.match(source,/urlContainsStage2ITransientCredential\(input\.url/);
  assert.match(source,/verifyTrustedRequestPrincipal[\s\S]+authorizeApplicationOperation[\s\S]+executeTrustedOperation/);
  assert.match(source,/applicationAuthorizationGranted:false/);

  process.stdout.write("PASS Stage 2I app-attestation protected-request contracts\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
