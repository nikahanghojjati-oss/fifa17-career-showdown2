const assert=require("node:assert/strict");
const fs=require("node:fs");

const runtime=require("../../trusted-runtime/productionTrustedRuntime.js");
const stage2g=require("../../js/trustedAccountBootstrapExecution.js");
const rootPackage=JSON.parse(fs.readFileSync("package.json","utf8"));
const runtimePackage=JSON.parse(fs.readFileSync("trusted-runtime/package.json","utf8"));
const providerSource=fs.readFileSync("trusted-runtime/firebaseAdminProvider.mjs","utf8");
const serverSource=fs.readFileSync("trusted-runtime/server.mjs","utf8");
const dockerfile=fs.readFileSync("trusted-runtime/Dockerfile","utf8");
const cloudBuild=fs.readFileSync("trusted-runtime/cloudbuild.yaml","utf8");
const roleDefinition=fs.readFileSync("trusted-runtime/runtime-role.yaml","utf8");
const activationScript=fs.readFileSync("trusted-runtime/activate-production.sh","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const stage2h=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
const environment=JSON.parse(fs.readFileSync("firebase.production.environment.json","utf8"));

const exactRuntimePermissions=[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
];

assert.equal(runtime.contractVersion,1);
assert.equal(runtime.productionRuntimeTarget,"google-cloud-run-https");
assert.equal(runtime.productionProjectId,"fifa17-career-showdown-prod");
assert.equal(runtime.allowedOrigin,"https://nikahanghojjati-oss.github.io");
assert.deepEqual(runtime.expectedAppCheckIdentity,{
  appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd",
  projectNumber:"409396353288",
  projectId:"fifa17-career-showdown-prod"
});
assert.equal(runtime.operation,"account-bootstrap");
assert.equal(runtime.authorizationScope,"account-bootstrap-only");
assert.equal(runtime.appCheckEnforcementForFirebaseProducts,false);
assert.equal(runtime.browserFirestoreWrites,"deny-all");
assert.equal(runtime.directBrowserTrustedMutationAuthority,false);
assert.equal(typeof stage2g.executeAuthorizedAccountBootstrap,"function");

assert.equal(rootPackage.version,"1.4.0");
assert.equal(rootPackage.dependencies,undefined,"Trusted runtime dependencies must remain isolated from the GitHub Pages package.");
assert.equal(runtimePackage.type,"commonjs");
assert.equal(runtimePackage.dependencies["firebase-admin"],"14.3.0");
assert.equal(runtimePackage.engines.node,">=24");

assert.match(providerSource,/applicationDefault\(\)/);
assert.match(providerSource,/getAppCheck\(app\)/);
assert.match(providerSource,/verifyToken\(token\)/);
assert.match(providerSource,/verifyIdToken\(token,checkRevoked\)/);
assert.match(providerSource,/getFirestore\(app\)/);
assert.match(providerSource,/runTransaction\(async transaction/);
assert.match(providerSource,/await transaction\.get\(accountRef\)/);
assert.match(providerSource,/transaction\.create\(accountRef,/);
assert.doesNotMatch(providerSource,/transaction\.(?:update|delete)\(/,"Production account bootstrap must remain create-only.");
assert.doesNotMatch(providerSource,/\.collection\([^\n]+\)\.get\(|\.listDocuments\(|getCollections\(/,"Production account bootstrap must not list/query collections.");
assert.match(providerSource,/GOOGLE_APPLICATION_CREDENTIALS/);
assert.match(providerSource,/PRODUCTION_EXPORTED_SERVICE_ACCOUNT_CREDENTIAL_FORBIDDEN/);
assert.doesNotMatch(providerSource,/private_key|serviceAccountJson|cert\s*\(/i,"No exported service-account credential material may enter the runtime adapter.");
assert.match(providerSource,/sha256:/);
assert.match(providerSource,/Object\.keys\(value\)\.sort\(\)/);
assert.match(providerSource,/firestore-timestamp/);

assert.match(serverSource,/X-Firebase-AppCheck/);
assert.match(serverSource,/Authorization/);
assert.match(serverSource,/\/v1\/account\/bootstrap/);
assert.match(serverSource,/\/healthz/);
assert.doesNotMatch(serverSource,/console\.log\(request|console\.log\(.*token|process\.stdout\.write\(.*token/i,"Transient credentials must not be logged.");
assert.doesNotMatch(index,/trusted-runtime|firebase-admin/i);
assert.doesNotMatch(optional,/trusted-runtime|firebase-admin/i);
assert.doesNotMatch(worker,/trusted-runtime|firebase-admin/i);

assert.match(dockerfile,/FROM node:24-bookworm-slim/);
assert.match(dockerfile,/USER node/);
assert.match(dockerfile,/COPY js\/trustedRequestAuthentication\.js/);
assert.match(dockerfile,/COPY js\/trustedAppAttestationRequest\.js/);
assert.doesNotMatch(dockerfile,/COPY \. \.|COPY \. \/app/,"Trusted runtime image must copy only its reviewed runtime files rather than the full repository.");

assert.match(cloudBuild,/trusted-runtime\/Dockerfile/);
assert.match(cloudBuild,/_REGION: us-east4/);
assert.match(cloudBuild,/_REPOSITORY: cms-trusted-runtime/);
assert.match(cloudBuild,/career-mode-showdown-trusted-runtime/);

for(const permission of exactRuntimePermissions){
  assert.match(roleDefinition,new RegExp(permission.replace(/\./g,"\\.")));
}
const rolePermissionLines=roleDefinition.split(/\r?\n/).filter(line=>/^\s*-\s+(?:firebaseauth|datastore)\./.test(line));
assert.equal(rolePermissionLines.length,4,"The production runtime custom role must contain exactly four provider permissions.");
assert.doesNotMatch(roleDefinition,/datastore\.entities\.(?:update|delete|list)|roles\/datastore|firebase\.admin/i);

assert.match(activationScript,/PROJECT_ID="fifa17-career-showdown-prod"/);
assert.match(activationScript,/REGION="us-east4"/);
assert.match(activationScript,/SERVICE_ACCOUNT_ID="cms-trusted-runtime"/);
assert.match(activationScript,/ROLE_ID="careerModeShowdownAccountBootstrap"/);
assert.match(activationScript,/gcloud iam roles create[\s\S]+--file="\$ROLE_FILE"/);
assert.match(activationScript,/gcloud projects add-iam-policy-binding[\s\S]+--role="\$ROLE_NAME"/);
assert.match(activationScript,/gcloud run deploy[\s\S]+--service-account="\$SERVICE_ACCOUNT"[\s\S]+--allow-unauthenticated/);
assert.match(activationScript,/--max-instances=2/);
assert.match(activationScript,/GOOGLE_APPLICATION_CREDENTIALS is set/);
assert.match(activationScript,/protected account-bootstrap endpoint did not fail closed without credentials/i);
assert.match(activationScript,/Do not award RJR production-auth\/IAM points until a legitimate App Check \+ Firebase Auth request/i);
assert.doesNotMatch(activationScript,/service-accounts keys create|private[-_ ]key|roles\/owner|roles\/editor|roles\/datastore\.user|roles\/firebase\.admin/i);

assert.equal(environment.activation.appCheckEnforcement,false);
assert.equal(environment.securityLocks.applicationClientFirestoreWrites,"deny-all");
assert.equal(environment.securityLocks.clientAuthInitialized,false);
assert.equal(environment.securityLocks.clientFirestoreInitialized,false);
assert.equal(environment.securityLocks.clientStorageInitialized,false);
assert.equal(environment.securityLocks.clientFunctionsInitialized,false);
assert.deepEqual(environment.securityLocks.stage2hIamPermissions,exactRuntimePermissions);
assert.match(stage2h,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);

(async()=>{
  const idToken="transient-id-token-secret";
  const appCheckToken="transient-app-check-secret";
  const uid="production_runtime_test_uid";
  const callOrder=[];
  let verifyIdTokenCount=0;

  const provider={
    verifyAppCheckToken:async token=>{
      callOrder.push("app-check");
      assert.equal(token,appCheckToken);
      return {token:{
        app_id:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd",
        sub:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd",
        aud:["409396353288","fifa17-career-showdown-prod"]
      }};
    },
    verifyIdToken:async(token,checkRevoked)=>{
      callOrder.push("auth");
      verifyIdTokenCount+=1;
      assert.equal(token,idToken);
      assert.equal(checkRevoked,true);
      return {uid,sub:uid};
    },
    runAtomicAccountBootstrap:async request=>{
      callOrder.push("transaction");
      assert.equal(request.accountId,uid);
      assert.equal(request.documentPath,`accounts/${uid}`);
      assert.equal(JSON.stringify(request).includes(idToken),false);
      assert.equal(JSON.stringify(request).includes(appCheckToken),false);
      return {committed:true,decision:request.decide(null)};
    }
  };

  const created=await runtime.executeProductionTrustedRequest({
    method:"POST",
    origin:"https://nikahanghojjati-oss.github.io",
    url:"/v1/account/bootstrap",
    headers:{
      authorization:`Bearer ${idToken}`,
      "x-firebase-appcheck":appCheckToken
    },
    provider
  });
  assert.equal(created.ok,true);
  assert.equal(created.action,"created");
  assert.equal(created.accountId,uid);
  assert.equal(created.documentPath,`accounts/${uid}`);
  assert.equal(created.revision,0);
  assert.equal(created.appAttestationVerified,true);
  assert.equal(created.revocationChecked,true);
  assert.equal(created.applicationAuthorizationGranted,"account-bootstrap-only");
  assert.deepEqual(callOrder,["app-check","auth","transaction"]);
  assert.equal(verifyIdTokenCount,1,"Stage 2I + Stage 2G production composition must verify the ID token exactly once.");
  assert.equal(JSON.stringify(created).includes(idToken),false);
  assert.equal(JSON.stringify(created).includes(appCheckToken),false);

  const preflightCalls=[];
  const preflight=await runtime.executeProductionTrustedRequest({
    method:"OPTIONS",
    origin:"https://nikahanghojjati-oss.github.io",
    url:"/v1/account/bootstrap",
    headers:{},
    provider:{
      verifyAppCheckToken:async()=>{preflightCalls.push("app-check");},
      verifyIdToken:async()=>{preflightCalls.push("auth");},
      runAtomicAccountBootstrap:async()=>{preflightCalls.push("transaction");}
    }
  });
  assert.equal(preflight.ok,true);
  assert.equal(preflight.action,"preflight");
  assert.deepEqual(preflightCalls,[]);

  const missingAppCheckCalls=[];
  const missingAppCheck=await runtime.executeProductionTrustedRequest({
    method:"POST",
    origin:"https://nikahanghojjati-oss.github.io",
    url:"/v1/account/bootstrap",
    headers:{authorization:`Bearer ${idToken}`},
    provider:{
      verifyAppCheckToken:async()=>{missingAppCheckCalls.push("app-check");},
      verifyIdToken:async()=>{missingAppCheckCalls.push("auth");},
      runAtomicAccountBootstrap:async()=>{missingAppCheckCalls.push("transaction");}
    }
  });
  assert.equal(missingAppCheck.ok,false);
  assert.equal(missingAppCheck.code,"STAGE2I_APP_CHECK_TOKEN_REQUIRED");
  assert.deepEqual(missingAppCheckCalls,[]);

  const mismatchOrder=[];
  const mismatch=await runtime.executeProductionTrustedRequest({
    method:"POST",
    origin:"https://nikahanghojjati-oss.github.io",
    url:"/v1/account/bootstrap",
    headers:{authorization:`Bearer ${idToken}`,"x-firebase-appcheck":appCheckToken},
    provider:{
      verifyAppCheckToken:async()=>{
        mismatchOrder.push("app-check");
        return {token:{app_id:"wrong",sub:"wrong",aud:["409396353288","fifa17-career-showdown-prod"]}};
      },
      verifyIdToken:async()=>{mismatchOrder.push("auth");return {uid,sub:uid};},
      runAtomicAccountBootstrap:async()=>{mismatchOrder.push("transaction");}
    }
  });
  assert.equal(mismatch.ok,false);
  assert.equal(mismatch.code,"STAGE2I_APP_CHECK_APP_MISMATCH");
  assert.deepEqual(mismatchOrder,["app-check"]);

  const revokedOrder=[];
  const revoked=await runtime.executeProductionTrustedRequest({
    method:"POST",
    origin:"https://nikahanghojjati-oss.github.io",
    url:"/v1/account/bootstrap",
    headers:{authorization:`Bearer ${idToken}`,"x-firebase-appcheck":appCheckToken},
    provider:{
      verifyAppCheckToken:async()=>{
        revokedOrder.push("app-check");
        return {token:{
          app_id:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd",
          sub:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd",
          aud:["409396353288","fifa17-career-showdown-prod"]
        }};
      },
      verifyIdToken:async()=>{
        revokedOrder.push("auth");
        const error=new Error("secret provider detail");
        error.code="auth/id-token-revoked";
        throw error;
      },
      runAtomicAccountBootstrap:async()=>{revokedOrder.push("transaction");}
    }
  });
  assert.equal(revoked.ok,false);
  assert.equal(revoked.code,"PROVIDER_TOKEN_REVOKED");
  assert.deepEqual(revokedOrder,["app-check","auth"]);
  assert.equal(JSON.stringify(revoked).includes("secret provider detail"),false);

  const unauthorized=await stage2g.executeAuthorizedAccountBootstrap({
    accountId:uid,
    providerPrincipal:{uid},
    applicationAuthorizationGranted:false,
    runAtomicAccountBootstrap:async()=>{throw new Error("must not run");}
  });
  assert.equal(unauthorized.ok,false);
  assert.equal(unauthorized.code,"TRUSTED_ACCOUNT_APPLICATION_AUTHORIZATION_REQUIRED");

  process.stdout.write("PASS production trusted runtime composition and activation infrastructure: exact App Check -> revoked-user verification -> application authorization -> create-only transaction, exact four-permission IAM, us-east4 deployment and browser locks protected.\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
