const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=file=>fs.readFileSync(file,"utf8");
const policy=require("../../js/trustedExecutionRuntimeIamPolicy.js");
const source=read("js/trustedExecutionRuntimeIamPolicy.js");
const stage2h=read("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md");
const stage2f=read("PRIVATE_ACCOUNT_AUTH_STAGE_2F.md");
const stage2g=read("PRIVATE_ACCOUNT_AUTH_STAGE_2G.md");
const rules=read("firestore.rules");
const index=read("index.html");
const optional=read("js/optionalModules.js");
const worker=read("service-worker.js");
const pkg=JSON.parse(read("package.json"));
const lock=read("package-lock.json");

const clone=value=>JSON.parse(JSON.stringify(value));
const expectError=(mutate,code)=>{
  const candidate=clone(policy.createSyntheticReadyFixture());
  mutate(candidate);
  const result=policy.validate(candidate);
  assert.equal(result.ok,false,`${code} fixture must fail closed.`);
  assert.ok(result.errors.includes(code),`${code} must be reported; got ${result.errors.join(", ")}`);
};

assert.equal(policy.contractVersion,1);
assert.equal(policy.stage,"2H");
assert.equal(policy.providerDocumentationCheckedAt,"2026-08-18");
assert.equal(policy.productionRuntimeConnected,false);
assert.equal(policy.productionProvisioningAuthorized,false);
assert.equal(policy.trustedRuntime,"google-cloud-run-https");
assert.equal(policy.serviceIdentity,"dedicated-user-managed-service-account");
assert.equal(policy.credentialStrategy,"application-default-credentials");
assert.equal(policy.firebaseAuthRevocationPermission,"firebaseauth.users.get");
assert.deepEqual(Array.from(policy.firestoreBootstrapPermissions),[
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.deepEqual(Array.from(policy.runtimePermissions),[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/owner"));
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/editor"));
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/viewer"));
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/firebase.admin"));
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/datastore.user"));
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/iam.serviceAccountUser"));
assert.ok(policy.forbiddenRuntimeRoles.includes("roles/iam.serviceAccountTokenCreator"));
assert.equal(policy.browserFirestoreWrites,"deny-all");
assert.equal(policy.sharedMutationAuthorityGranted,false);
assert.equal(typeof policy.validate,"function");

const ready=policy.createSyntheticReadyFixture();
assert.deepEqual(policy.validate(ready),{ok:true,errors:[]});

expectError(candidate=>{candidate.runtime.provider="cloud-functions";},"RUNTIME_PROVIDER_MISMATCH");
expectError(candidate=>{candidate.runtime.transport="http";},"HTTPS_REQUIRED");
expectError(candidate=>{candidate.runtime.dedicatedService=false;},"DEDICATED_TRUSTED_SERVICE_REQUIRED");
expectError(candidate=>{candidate.runtime.endUserAuthentication="cloud-run-iam";},"FIREBASE_END_USER_BOUNDARY_REQUIRED");
expectError(candidate=>{candidate.runtime.cloudRunIamIsEndUserAuthorization=true;},"CLOUD_RUN_IAM_NOT_END_USER_AUTH");
expectError(candidate=>{candidate.runtime.networkReachabilityGrantsApplicationAuthority=true;},"NETWORK_REACHABILITY_NOT_AUTHORIZATION");
expectError(candidate=>{candidate.runtime.allowedBrowserOrigins=["https://example.test"];},"CORS_ORIGIN_POLICY_MISMATCH");
expectError(candidate=>{candidate.runtime.allowedBrowserOrigins.push("https://attacker.example");},"CORS_ORIGIN_POLICY_MISMATCH");
expectError(candidate=>{candidate.runtime.corsGrantsApplicationAuthority=true;},"CORS_NOT_AUTHORIZATION");
expectError(candidate=>{candidate.runtime.preflightExecutesApplicationOperation=true;},"PREFLIGHT_APPLICATION_OPERATION_FORBIDDEN");
expectError(candidate=>{candidate.runtime.preflightReturnsProtectedData=true;},"PREFLIGHT_PROTECTED_DATA_FORBIDDEN");

expectError(candidate=>{candidate.serviceIdentity.kind="default-compute-service-account";},"USER_MANAGED_SERVICE_IDENTITY_REQUIRED");
expectError(candidate=>{candidate.serviceIdentity.dedicatedToTrustedService=false;},"DEDICATED_SERVICE_IDENTITY_REQUIRED");
expectError(candidate=>{candidate.serviceIdentity.defaultServiceAccountAllowed=true;},"DEFAULT_SERVICE_ACCOUNT_FORBIDDEN");
expectError(candidate=>{candidate.serviceIdentity.crossProjectServiceIdentityAllowed=true;},"CROSS_PROJECT_SERVICE_IDENTITY_FORBIDDEN");
expectError(candidate=>{candidate.serviceIdentity.applicationDefaultCredentialsRequired=false;},"ADC_REQUIRED");
expectError(candidate=>{candidate.serviceIdentity.exportedPrivateKeyAllowed=true;},"EXPORTED_PRIVATE_KEY_FORBIDDEN");
expectError(candidate=>{candidate.serviceIdentity.customRuntimeRole.required=false;},"RUNTIME_CUSTOM_ROLE_REQUIRED");
expectError(candidate=>{candidate.serviceIdentity.customRuntimeRole.permissions.pop();},"RUNTIME_PERMISSION_SET_MISMATCH");
expectError(candidate=>{candidate.serviceIdentity.customRuntimeRole.permissions.push("datastore.entities.update");},"RUNTIME_PERMISSION_SET_MISMATCH");
expectError(candidate=>{candidate.serviceIdentity.predefinedRuntimeRoles=["roles/datastore.user"];},"PREDEFINED_RUNTIME_ROLE_FORBIDDEN");
expectError(candidate=>{candidate.serviceIdentity.runtimeRoles=["roles/owner"];},"FORBIDDEN_RUNTIME_ROLE_PRESENT");
expectError(candidate=>{candidate.serviceIdentity.runtimeRoles=["roles/firebase.admin"];},"FORBIDDEN_RUNTIME_ROLE_PRESENT");
expectError(candidate=>{candidate.serviceIdentity.runtimeRoles=["roles/iam.serviceAccountUser"];},"FORBIDDEN_RUNTIME_ROLE_PRESENT");
expectError(candidate=>{candidate.serviceIdentity.deployerAuthorityIncludedInRuntimeRole=true;},"DEPLOYER_AUTHORITY_MUST_STAY_SEPARATE");

expectError(candidate=>{candidate.authentication.verifyIdTokenCheckRevoked=false;},"REVOCATION_AWARE_VERIFICATION_REQUIRED");
expectError(candidate=>{candidate.authentication.accountIdSource="request-body-account-id";},"VERIFIED_UID_ACCOUNT_ID_REQUIRED");
expectError(candidate=>{candidate.authentication.clientSuppliedAccountIdAuthoritative=true;},"CLIENT_ACCOUNT_ID_AUTHORITY_FORBIDDEN");
expectError(candidate=>{candidate.authentication.requiredRuntimePermissions=[];},"AUTH_RUNTIME_PERMISSION_MISMATCH");
expectError(candidate=>{candidate.authentication.rawIdTokenPersistenceAllowed=true;},"RAW_ID_TOKEN_PERSISTENCE_FORBIDDEN");
expectError(candidate=>{candidate.authentication.rawIdTokenLoggingAllowed=true;},"RAW_ID_TOKEN_LOGGING_FORBIDDEN");
expectError(candidate=>{candidate.authentication.rawIdTokenForwardedToBootstrapAdapter=true;},"RAW_ID_TOKEN_FORWARDING_FORBIDDEN");

expectError(candidate=>{candidate.firestore.serverSecurityModel="security-rules";},"FIRESTORE_SERVER_IAM_MODEL_REQUIRED");
expectError(candidate=>{candidate.firestore.requiredBootstrapPermissions.push("datastore.entities.update");},"FIRESTORE_BOOTSTRAP_PERMISSION_MISMATCH");
expectError(candidate=>{candidate.firestore.accountBootstrapWriteMode="read-then-update";},"ACCOUNT_BOOTSTRAP_CREATE_ONLY_REQUIRED");
expectError(candidate=>{candidate.firestore.browserClientWrites="allow-account-create";},"CLIENT_FIRESTORE_WRITES_MUST_BE_DENIED");
expectError(candidate=>{candidate.firestore.sharedMutationAuthorityGranted=true;},"SHARED_MUTATION_AUTHORITY_FORBIDDEN");

expectError(candidate=>{candidate.applicationAuthorization.separateFromFirebaseAuthentication=false;},"APPLICATION_AUTHORIZATION_MUST_BE_SEPARATE");
expectError(candidate=>{candidate.applicationAuthorization.separateFromRuntimeIam=false;},"APPLICATION_AUTHORIZATION_MUST_BE_SEPARATE");
expectError(candidate=>{candidate.applicationAuthorization.stage2GBootstrapScope="general-account-write";},"STAGE2G_SCOPE_MISMATCH");
expectError(candidate=>{candidate.applicationAuthorization.deviceAuthorityGranted=true;},"DEVICE_AUTHORITY_FORBIDDEN");
expectError(candidate=>{candidate.applicationAuthorization.pairingAuthorityGranted=true;},"PAIRING_AUTHORITY_FORBIDDEN");
expectError(candidate=>{candidate.applicationAuthorization.rivalryAuthorityGranted=true;},"RIVALRY_AUTHORITY_FORBIDDEN");
expectError(candidate=>{candidate.applicationAuthorization.sessionAuthorityGranted=true;},"SESSION_AUTHORITY_FORBIDDEN");
expectError(candidate=>{candidate.applicationAuthorization.gameplayMutationAuthorityGranted=true;},"GAMEPLAY_MUTATION_AUTHORITY_FORBIDDEN");

expectError(candidate=>{candidate.production.provisioningAuthorized=true;},"PRODUCTION_PROVISIONING_FORBIDDEN");
expectError(candidate=>{candidate.production.cloudRunDeployed=true;},"PRODUCTION_RUNTIME_MUST_REMAIN_DISCONNECTED");
expectError(candidate=>{candidate.production.firebaseConnected=true;},"PRODUCTION_RUNTIME_MUST_REMAIN_DISCONNECTED");
expectError(candidate=>{candidate.production.serviceAccountCreated=true;},"PRODUCTION_IAM_MUST_REMAIN_UNGRANTED");
expectError(candidate=>{candidate.production.customRoleCreated=true;},"PRODUCTION_IAM_MUST_REMAIN_UNGRANTED");
expectError(candidate=>{candidate.production.iamBindingCreated=true;},"PRODUCTION_IAM_MUST_REMAIN_UNGRANTED");
expectError(candidate=>{candidate.production.billingAuthorized=true;},"PRODUCTION_BILLING_MUST_REMAIN_UNAUTHORIZED");
expectError(candidate=>{candidate.privateKey="forbidden";},"CREDENTIAL_MATERIAL_FORBIDDEN");
expectError(candidate=>{candidate.nested={serviceAccountJson:{private_key:"forbidden"}};},"CREDENTIAL_MATERIAL_FORBIDDEN");

for(const key of ["discovery","profiles","matchmaking","community","rankings"]){
  expectError(candidate=>{candidate.publicFeatures[key]=true;},`PUBLIC_${key.toUpperCase()}_FORBIDDEN`);
}

assert.doesNotMatch(source,/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
assert.doesNotMatch(source,/firebase-admin|firebase\/auth|firebase\/firestore|initializeApp|applicationDefault\s*\(/i,"Stage 2H policy proof must not initialize or import a production provider runtime.");
assert.doesNotMatch(index,/trustedExecutionRuntimeIamPolicy\.js|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(optional,/trustedExecutionRuntimeIamPolicy\.js|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(worker,/trustedExecutionRuntimeIamPolicy\.js|firebase-admin|firebase-auth|firebase\/auth|firebase-firestore|firebase\/firestore/i);

assert.equal(pkg.dependencies,undefined,"Stage 2H must not add production dependencies.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies||{},"firebase-admin"),false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies||{},"firebase"),false);
assert.doesNotMatch(lock.slice(0,1800),/"firebase-admin"|"firebase"|"@google-cloud\/firestore"/);
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2H IAM proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/rivalries\/\{rivalryId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.doesNotMatch(rules,/allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

assert.match(stage2h,/Google Cloud Run HTTPS service/i);
assert.match(stage2h,/dedicated user-managed service account/i);
assert.match(stage2h,/Application Default Credentials/i);
assert.match(stage2h,/firebaseauth\.users\.get/i);
assert.match(stage2h,/datastore\.databases\.get/i);
assert.match(stage2h,/datastore\.entities\.get/i);
assert.match(stage2h,/datastore\.entities\.create/i);
assert.match(stage2h,/custom role/i);
assert.match(stage2h,/roles\/datastore\.user/i);
assert.match(stage2h,/roles\/iam\.serviceAccountUser/i);
assert.match(stage2h,/deployer/i);
assert.match(stage2h,/cross-project/i);
assert.match(stage2h,/verifyIdToken\(idToken, true\)/i);
assert.match(stage2h,/network reachability grants zero application authority/i);
assert.match(stage2h,/Every application-client Firestore create, update and delete remains denied/i);
assert.match(stage2h,/shared[- ]mutation/i);
assert.match(stage2h,/Stage 3[\s\S]+BLOCKED/i);
assert.match(stage2h,/Private Remote Joining[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(stage2f,/verifyIdToken\(idToken, true\)/i);
assert.match(stage2g,/account-bootstrap-only/i);
assert.match(stage2g,/does not select or authorize a production service identity/i);

process.stdout.write("PASS Private Account/Auth Stage 2H trusted Cloud Run runtime and least-privilege IAM contracts with exact permission lock preserved and historical proof version-neutral\n");