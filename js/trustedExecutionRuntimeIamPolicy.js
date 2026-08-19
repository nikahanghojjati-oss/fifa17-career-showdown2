(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedExecutionRuntimeIamPolicy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const STAGE2H_PUBLIC_ORIGIN="https://nikahanghojjati-oss.github.io";
  const STAGE2H_FIREBASE_AUTH_PERMISSION="firebaseauth.users.get";
  const STAGE2H_FIRESTORE_PERMISSIONS=Object.freeze([
    "datastore.databases.get",
    "datastore.entities.get",
    "datastore.entities.create"
  ]);
  const STAGE2H_RUNTIME_PERMISSIONS=Object.freeze([
    STAGE2H_FIREBASE_AUTH_PERMISSION,
    ...STAGE2H_FIRESTORE_PERMISSIONS
  ]);
  const STAGE2H_FORBIDDEN_RUNTIME_ROLES=Object.freeze([
    "roles/owner",
    "roles/editor",
    "roles/viewer",
    "roles/firebase.admin",
    "roles/datastore.owner",
    "roles/datastore.user",
    "roles/iam.serviceAccountUser",
    "roles/iam.serviceAccountTokenCreator"
  ]);
  const STAGE2H_FORBIDDEN_CREDENTIAL_KEYS=Object.freeze([
    "private_key",
    "privateKey",
    "serviceAccountKey",
    "serviceAccountJson",
    "clientSecret",
    "refreshToken",
    "accessToken",
    "credentialJson"
  ]);
  const STAGE2H_PUBLIC_FEATURE_KEYS=Object.freeze([
    "discovery",
    "profiles",
    "matchmaking",
    "community",
    "rankings"
  ]);

  function isStage2HRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function sameStage2HStringSet(actual,expected){
    if(!Array.isArray(actual)||actual.some(value=>typeof value!=="string"))return false;
    const actualSet=new Set(actual);
    const expectedSet=new Set(expected);
    if(actualSet.size!==actual.length||expectedSet.size!==expected.length||actualSet.size!==expectedSet.size)return false;
    for(const value of expectedSet){
      if(!actualSet.has(value))return false;
    }
    return true;
  }

  function containsStage2HCredentialMaterial(value,seen=new Set()){
    if(!value||typeof value!=="object")return false;
    if(seen.has(value))return false;
    seen.add(value);
    for(const [key,nested] of Object.entries(value)){
      if(STAGE2H_FORBIDDEN_CREDENTIAL_KEYS.includes(key))return true;
      if(containsStage2HCredentialMaterial(nested,seen))return true;
    }
    return false;
  }

  function pushStage2HError(errors,code,condition){
    if(condition)errors.push(code);
  }

  function validateStage2HPolicy(candidate){
    if(!isStage2HRecord(candidate))return {ok:false,errors:["INVALID_STAGE2H_POLICY_INPUT"]};

    const errors=[];
    const runtime=isStage2HRecord(candidate.runtime)?candidate.runtime:{};
    const identity=isStage2HRecord(candidate.serviceIdentity)?candidate.serviceIdentity:{};
    const customRole=isStage2HRecord(identity.customRuntimeRole)?identity.customRuntimeRole:{};
    const authentication=isStage2HRecord(candidate.authentication)?candidate.authentication:{};
    const firestore=isStage2HRecord(candidate.firestore)?candidate.firestore:{};
    const authorization=isStage2HRecord(candidate.applicationAuthorization)?candidate.applicationAuthorization:{};
    const production=isStage2HRecord(candidate.production)?candidate.production:{};
    const publicFeatures=isStage2HRecord(candidate.publicFeatures)?candidate.publicFeatures:{};

    pushStage2HError(errors,"RUNTIME_PROVIDER_MISMATCH",runtime.provider!=="google-cloud-run");
    pushStage2HError(errors,"HTTPS_REQUIRED",runtime.transport!=="https");
    pushStage2HError(errors,"DEDICATED_TRUSTED_SERVICE_REQUIRED",runtime.dedicatedService!==true);
    pushStage2HError(errors,"FIREBASE_END_USER_BOUNDARY_REQUIRED",runtime.endUserAuthentication!=="firebase-id-token");
    pushStage2HError(errors,"CLOUD_RUN_IAM_NOT_END_USER_AUTH",runtime.cloudRunIamIsEndUserAuthorization!==false);
    pushStage2HError(errors,"NETWORK_REACHABILITY_NOT_AUTHORIZATION",runtime.networkReachabilityGrantsApplicationAuthority!==false);
    pushStage2HError(errors,"CORS_ORIGIN_POLICY_MISMATCH",!sameStage2HStringSet(runtime.allowedBrowserOrigins,[STAGE2H_PUBLIC_ORIGIN]));
    pushStage2HError(errors,"CORS_NOT_AUTHORIZATION",runtime.corsGrantsApplicationAuthority!==false);
    pushStage2HError(errors,"PREFLIGHT_APPLICATION_OPERATION_FORBIDDEN",runtime.preflightExecutesApplicationOperation!==false);
    pushStage2HError(errors,"PREFLIGHT_PROTECTED_DATA_FORBIDDEN",runtime.preflightReturnsProtectedData!==false);

    pushStage2HError(errors,"USER_MANAGED_SERVICE_IDENTITY_REQUIRED",identity.kind!=="user-managed-service-account");
    pushStage2HError(errors,"DEDICATED_SERVICE_IDENTITY_REQUIRED",identity.dedicatedToTrustedService!==true);
    pushStage2HError(errors,"DEFAULT_SERVICE_ACCOUNT_FORBIDDEN",identity.defaultServiceAccountAllowed!==false);
    pushStage2HError(errors,"CROSS_PROJECT_SERVICE_IDENTITY_FORBIDDEN",identity.crossProjectServiceIdentityAllowed!==false);
    pushStage2HError(errors,"ADC_REQUIRED",identity.applicationDefaultCredentialsRequired!==true);
    pushStage2HError(errors,"EXPORTED_PRIVATE_KEY_FORBIDDEN",identity.exportedPrivateKeyAllowed!==false);
    pushStage2HError(errors,"RUNTIME_CUSTOM_ROLE_REQUIRED",customRole.required!==true);
    pushStage2HError(errors,"RUNTIME_PERMISSION_SET_MISMATCH",!sameStage2HStringSet(customRole.permissions,STAGE2H_RUNTIME_PERMISSIONS));
    pushStage2HError(errors,"PREDEFINED_RUNTIME_ROLE_FORBIDDEN",!Array.isArray(identity.predefinedRuntimeRoles)||identity.predefinedRuntimeRoles.length!==0);
    pushStage2HError(errors,"DEPLOYER_AUTHORITY_MUST_STAY_SEPARATE",identity.deployerAuthorityIncludedInRuntimeRole!==false);
    pushStage2HError(errors,"FORBIDDEN_RUNTIME_ROLE_PRESENT",Array.isArray(identity.runtimeRoles)&&identity.runtimeRoles.some(role=>STAGE2H_FORBIDDEN_RUNTIME_ROLES.includes(role)));

    pushStage2HError(errors,"REVOCATION_AWARE_VERIFICATION_REQUIRED",authentication.verifyIdTokenCheckRevoked!==true);
    pushStage2HError(errors,"VERIFIED_UID_ACCOUNT_ID_REQUIRED",authentication.accountIdSource!=="verified-firebase-uid");
    pushStage2HError(errors,"CLIENT_ACCOUNT_ID_AUTHORITY_FORBIDDEN",authentication.clientSuppliedAccountIdAuthoritative!==false);
    pushStage2HError(errors,"AUTH_RUNTIME_PERMISSION_MISMATCH",!sameStage2HStringSet(authentication.requiredRuntimePermissions,[STAGE2H_FIREBASE_AUTH_PERMISSION]));
    pushStage2HError(errors,"RAW_ID_TOKEN_PERSISTENCE_FORBIDDEN",authentication.rawIdTokenPersistenceAllowed!==false);
    pushStage2HError(errors,"RAW_ID_TOKEN_LOGGING_FORBIDDEN",authentication.rawIdTokenLoggingAllowed!==false);
    pushStage2HError(errors,"RAW_ID_TOKEN_FORWARDING_FORBIDDEN",authentication.rawIdTokenForwardedToBootstrapAdapter!==false);

    pushStage2HError(errors,"FIRESTORE_SERVER_IAM_MODEL_REQUIRED",firestore.serverSecurityModel!=="iam-bypasses-security-rules");
    pushStage2HError(errors,"FIRESTORE_BOOTSTRAP_PERMISSION_MISMATCH",!sameStage2HStringSet(firestore.requiredBootstrapPermissions,STAGE2H_FIRESTORE_PERMISSIONS));
    pushStage2HError(errors,"ACCOUNT_BOOTSTRAP_CREATE_ONLY_REQUIRED",firestore.accountBootstrapWriteMode!=="transactional-create-only");
    pushStage2HError(errors,"CLIENT_FIRESTORE_WRITES_MUST_BE_DENIED",firestore.browserClientWrites!=="deny-all");
    pushStage2HError(errors,"SHARED_MUTATION_AUTHORITY_FORBIDDEN",firestore.sharedMutationAuthorityGranted!==false);

    pushStage2HError(errors,"APPLICATION_AUTHORIZATION_MUST_BE_SEPARATE",authorization.separateFromFirebaseAuthentication!==true||authorization.separateFromRuntimeIam!==true);
    pushStage2HError(errors,"STAGE2G_SCOPE_MISMATCH",authorization.stage2GBootstrapScope!=="same-provider-uid-missing-account-create-only");
    pushStage2HError(errors,"DEVICE_AUTHORITY_FORBIDDEN",authorization.deviceAuthorityGranted!==false);
    pushStage2HError(errors,"PAIRING_AUTHORITY_FORBIDDEN",authorization.pairingAuthorityGranted!==false);
    pushStage2HError(errors,"RIVALRY_AUTHORITY_FORBIDDEN",authorization.rivalryAuthorityGranted!==false);
    pushStage2HError(errors,"SESSION_AUTHORITY_FORBIDDEN",authorization.sessionAuthorityGranted!==false);
    pushStage2HError(errors,"GAMEPLAY_MUTATION_AUTHORITY_FORBIDDEN",authorization.gameplayMutationAuthorityGranted!==false);

    pushStage2HError(errors,"PRODUCTION_PROVISIONING_FORBIDDEN",production.provisioningAuthorized!==false);
    pushStage2HError(errors,"PRODUCTION_RUNTIME_MUST_REMAIN_DISCONNECTED",production.cloudRunDeployed!==false||production.firebaseConnected!==false);
    pushStage2HError(errors,"PRODUCTION_IAM_MUST_REMAIN_UNGRANTED",production.serviceAccountCreated!==false||production.customRoleCreated!==false||production.iamBindingCreated!==false);
    pushStage2HError(errors,"PRODUCTION_BILLING_MUST_REMAIN_UNAUTHORIZED",production.billingAuthorized!==false);
    pushStage2HError(errors,"CREDENTIAL_MATERIAL_FORBIDDEN",containsStage2HCredentialMaterial(candidate));

    for(const key of STAGE2H_PUBLIC_FEATURE_KEYS){
      pushStage2HError(errors,`PUBLIC_${key.toUpperCase()}_FORBIDDEN`,publicFeatures[key]!==false);
    }

    return {ok:errors.length===0,errors};
  }

  function createStage2HSyntheticReadyFixture(){
    return {
      runtime:{
        provider:"google-cloud-run",
        transport:"https",
        dedicatedService:true,
        endUserAuthentication:"firebase-id-token",
        cloudRunIamIsEndUserAuthorization:false,
        networkReachabilityGrantsApplicationAuthority:false,
        allowedBrowserOrigins:[STAGE2H_PUBLIC_ORIGIN],
        corsGrantsApplicationAuthority:false,
        preflightExecutesApplicationOperation:false,
        preflightReturnsProtectedData:false
      },
      serviceIdentity:{
        kind:"user-managed-service-account",
        dedicatedToTrustedService:true,
        defaultServiceAccountAllowed:false,
        crossProjectServiceIdentityAllowed:false,
        applicationDefaultCredentialsRequired:true,
        exportedPrivateKeyAllowed:false,
        customRuntimeRole:{
          required:true,
          permissions:[...STAGE2H_RUNTIME_PERMISSIONS]
        },
        predefinedRuntimeRoles:[],
        runtimeRoles:[],
        deployerAuthorityIncludedInRuntimeRole:false
      },
      authentication:{
        verifyIdTokenCheckRevoked:true,
        accountIdSource:"verified-firebase-uid",
        clientSuppliedAccountIdAuthoritative:false,
        requiredRuntimePermissions:[STAGE2H_FIREBASE_AUTH_PERMISSION],
        rawIdTokenPersistenceAllowed:false,
        rawIdTokenLoggingAllowed:false,
        rawIdTokenForwardedToBootstrapAdapter:false
      },
      firestore:{
        serverSecurityModel:"iam-bypasses-security-rules",
        requiredBootstrapPermissions:[...STAGE2H_FIRESTORE_PERMISSIONS],
        accountBootstrapWriteMode:"transactional-create-only",
        browserClientWrites:"deny-all",
        sharedMutationAuthorityGranted:false
      },
      applicationAuthorization:{
        separateFromFirebaseAuthentication:true,
        separateFromRuntimeIam:true,
        stage2GBootstrapScope:"same-provider-uid-missing-account-create-only",
        deviceAuthorityGranted:false,
        pairingAuthorityGranted:false,
        rivalryAuthorityGranted:false,
        sessionAuthorityGranted:false,
        gameplayMutationAuthorityGranted:false
      },
      production:{
        provisioningAuthorized:false,
        cloudRunDeployed:false,
        firebaseConnected:false,
        serviceAccountCreated:false,
        customRoleCreated:false,
        iamBindingCreated:false,
        billingAuthorized:false
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
    stage:"2H",
    providerDocumentationCheckedAt:"2026-08-18",
    productionRuntimeConnected:false,
    productionProvisioningAuthorized:false,
    trustedRuntime:"google-cloud-run-https",
    serviceIdentity:"dedicated-user-managed-service-account",
    credentialStrategy:"application-default-credentials",
    firebaseAuthRevocationPermission:STAGE2H_FIREBASE_AUTH_PERMISSION,
    firestoreBootstrapPermissions:STAGE2H_FIRESTORE_PERMISSIONS,
    runtimePermissions:STAGE2H_RUNTIME_PERMISSIONS,
    forbiddenRuntimeRoles:STAGE2H_FORBIDDEN_RUNTIME_ROLES,
    browserFirestoreWrites:"deny-all",
    sharedMutationAuthorityGranted:false,
    validate:validateStage2HPolicy,
    createSyntheticReadyFixture:createStage2HSyntheticReadyFixture
  });
});
