(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionAuthorizationAcceptance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const FEATURE="production-authorization-negative-acceptance";
  const FIREBASE_SDK_VERSION="12.17.0";
  const RIVALRY_PATTERN=/^pair_[0-9a-f]{64}$/;
  const DEVICE_PATTERN=/^device_[0-9a-f]{32}$/;
  const CANONICAL_LOCAL_STORAGE_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);

  function authorizationAcceptanceFail(code,message,extra={}){
    return Object.freeze({ok:false,feature:FEATURE,code,message,...extra});
  }

  function authorizationAcceptancePass(code,extra={}){
    return Object.freeze({ok:true,feature:FEATURE,code,...extra});
  }

  function authorizationAcceptanceNormalizeRivalryId(value){
    const rivalryId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!RIVALRY_PATTERN.test(rivalryId))throw Object.assign(new Error("Enter the exact active private rivalry ID (pair_ followed by 64 lowercase hex characters)."),{code:"ACCEPTANCE_RIVALRY_ID_INVALID"});
    return rivalryId;
  }

  function authorizationAcceptanceNormalizeUser(user){
    const uid=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!uid)throw Object.assign(new Error("A connected authenticated account is required."),{code:"ACCEPTANCE_AUTH_REQUIRED"});
    return uid;
  }

  function authorizationAcceptanceIsPermissionDenied(error){
    const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";
    const message=error&&typeof error.message==="string"?error.message:"";
    return code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied"||/missing or insufficient permissions/i.test(message);
  }

  function authorizationAcceptanceHex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}

  async function authorizationAcceptanceFingerprint(value,cryptoImpl=root.crypto){
    const text=typeof value==="string"?value:String(value??"");
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")return null;
    const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));
    return `sha256:${authorizationAcceptanceHex(new Uint8Array(digest))}`;
  }

  function authorizationAcceptanceSnapshotStorage(storage){
    if(!storage||typeof storage.length!=="number"||typeof storage.key!=="function"||typeof storage.getItem!=="function")return null;
    const entries=[];
    for(let index=0;index<storage.length;index+=1){
      const key=storage.key(index);
      entries.push([key,storage.getItem(key)]);
    }
    entries.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
    return JSON.stringify(entries);
  }

  function authorizationAcceptanceStorageUnchanged(before,after){return before===after;}

  async function authorizationAcceptanceDeniedRead(getDocImpl,reference){
    try{
      await getDocImpl(reference);
      return {denied:false,errorCode:null};
    }catch(error){
      return {denied:authorizationAcceptanceIsPermissionDenied(error),errorCode:error&&error.code?String(error.code):"unknown"};
    }
  }

  async function authorizationAcceptanceProbeThirdAccountReadDenial(options={}){
    try{
      const accountId=authorizationAcceptanceNormalizeUser(options.user);
      const rivalryId=authorizationAcceptanceNormalizeRivalryId(options.rivalryId);
      if(options.operatorConfirmedThirdAccount!==true)return authorizationAcceptanceFail("ACCEPTANCE_THIRD_ACCOUNT_CONFIRMATION_REQUIRED","Confirm that the signed-in existing private account is not either manager in the target rivalry.");
      if(options.operatorConfirmedActivePairedRivalry!==true)return authorizationAcceptanceFail("ACCEPTANCE_ACTIVE_RIVALRY_CONFIRMATION_REQUIRED","Confirm that the target is an existing active paired rivalry, not an open pairing capability.");
      if(typeof options.docImpl!=="function"||typeof options.getDocImpl!=="function")return authorizationAcceptanceFail("ACCEPTANCE_FIRESTORE_READ_UNAVAILABLE","Firestore read helpers are unavailable.");
      const rivalryRef=options.docImpl(options.firestore,"rivalries",rivalryId);
      const stateRef=options.docImpl(options.firestore,"rivalries",rivalryId,"state","authoritative");
      const before=authorizationAcceptanceSnapshotStorage(options.localStorageImpl);
      const rivalryRead=await authorizationAcceptanceDeniedRead(options.getDocImpl,rivalryRef);
      const stateRead=await authorizationAcceptanceDeniedRead(options.getDocImpl,stateRef);
      const after=authorizationAcceptanceSnapshotStorage(options.localStorageImpl);
      const localStorageUnchanged=authorizationAcceptanceStorageUnchanged(before,after);
      const accountFingerprint=await authorizationAcceptanceFingerprint(accountId,options.cryptoImpl||root.crypto);
      const rivalryFingerprint=await authorizationAcceptanceFingerprint(rivalryId,options.cryptoImpl||root.crypto);
      const providerAuthorizationDenied=rivalryRead.denied&&stateRead.denied;
      const evidence={
        probe:"third-account-read-denial",
        accountFingerprint,
        rivalryFingerprint,
        rivalryReadDenied:rivalryRead.denied,
        authoritativeStateReadDenied:stateRead.denied,
        localStorageUnchanged,
        firestoreWritesRequested:0,
        operatorConfirmedThirdAccount:true,
        operatorConfirmedActivePairedRivalry:true,
        providerAuthorizationDenied,
        rjrEligibleEvidenceCandidate:providerAuthorizationDenied&&localStorageUnchanged
      };
      if(!rivalryRead.denied||!stateRead.denied){
        return authorizationAcceptanceFail("ACCEPTANCE_THIRD_ACCOUNT_DENIAL_NOT_PROVEN","Read denial was not proven for both private rivalry boundaries. This account may be entitled, the target may be unsuitable, or provider authorization may differ from the expected policy.",evidence);
      }
      if(!localStorageUnchanged)return authorizationAcceptanceFail("ACCEPTANCE_LOCAL_STORAGE_CHANGED","The read-only probe observed an unexpected browser-storage change.",evidence);
      return authorizationAcceptancePass("ACCEPTANCE_THIRD_ACCOUNT_DENIED",evidence);
    }catch(error){
      return authorizationAcceptanceFail(error&&error.code?error.code:"ACCEPTANCE_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message?error.message:"Third-account authorization probe failed.");
    }
  }

  function authorizationAcceptanceSnapshotData(snapshot){
    if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists()||typeof snapshot.data!=="function")return null;
    return snapshot.data();
  }

  async function authorizationAcceptanceProbeRevokedDevicePrerequisite(options={}){
    try{
      const accountId=authorizationAcceptanceNormalizeUser(options.user);
      if(options.operatorConfirmedLegitimateRevocation!==true)return authorizationAcceptanceFail("ACCEPTANCE_REVOKED_DEVICE_CONFIRMATION_REQUIRED","Confirm that this exact browser/device identity was deliberately revoked using another legitimate active registered device.");
      const pairingApi=options.pairingApi;
      if(!pairingApi||typeof pairingApi.getOrCreateDeviceIdentity!=="function"||typeof pairingApi.registerDevice!=="function")return authorizationAcceptanceFail("ACCEPTANCE_PAIRING_RUNTIME_UNAVAILABLE","Registered-device runtime is unavailable.");
      if(typeof options.docImpl!=="function"||typeof options.getDocImpl!=="function")return authorizationAcceptanceFail("ACCEPTANCE_FIRESTORE_READ_UNAVAILABLE","Firestore read helpers are unavailable.");
      const identity=options.identity||await pairingApi.getOrCreateDeviceIdentity();
      if(!identity||!DEVICE_PATTERN.test(identity.deviceId||""))return authorizationAcceptanceFail("ACCEPTANCE_DEVICE_IDENTITY_INVALID","A stable browser device identity is required.");
      const deviceRef=options.docImpl(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const deviceSnapshot=await options.getDocImpl(deviceRef);
      const envelope=authorizationAcceptanceSnapshotData(deviceSnapshot);
      if(!envelope||!envelope.data)return authorizationAcceptanceFail("ACCEPTANCE_DEVICE_NOT_REGISTERED","This browser does not have an existing registered-device envelope for the signed-in account.");
      if(envelope.data.deviceId!==identity.deviceId)return authorizationAcceptanceFail("ACCEPTANCE_DEVICE_IDENTITY_CONFLICT","The provider device envelope does not match this browser identity.");
      const deviceFingerprint=await authorizationAcceptanceFingerprint(identity.deviceId,options.cryptoImpl||root.crypto);
      const accountFingerprint=await authorizationAcceptanceFingerprint(accountId,options.cryptoImpl||root.crypto);
      if(envelope.data.state!=="revoked"){
        return authorizationAcceptanceFail("ACCEPTANCE_DEVICE_NOT_REVOKED","This device is not revoked. No registration transaction was attempted.",{probe:"revoked-device-registration-guard",accountFingerprint,deviceFingerprint,providerDeviceState:envelope.data.state||null,registrationGuardInvoked:false,firestoreWriteCommitRequested:false});
      }
      const before=authorizationAcceptanceSnapshotStorage(options.localStorageImpl);
      const registration=await pairingApi.registerDevice({
        user:options.user,
        firestore:options.firestore,
        firebaseSdk:options.firebaseSdk,
        identity,
        cryptoImpl:options.cryptoImpl||root.crypto
      });
      const after=authorizationAcceptanceSnapshotStorage(options.localStorageImpl);
      const localStorageUnchanged=authorizationAcceptanceStorageUnchanged(before,after);
      const evidence={
        probe:"revoked-device-registration-guard",
        accountFingerprint,
        deviceFingerprint,
        providerDeviceState:envelope.data.state,
        registrationGuardCode:registration&&registration.code?registration.code:null,
        registrationGuardInvoked:true,
        localStorageUnchanged,
        firestoreWriteCommitRequested:false,
        operatorConfirmedLegitimateRevocation:true
      };
      if(!registration||registration.ok!==false||registration.code!=="PRIVATE_DEVICE_REVOKED")return authorizationAcceptanceFail("ACCEPTANCE_REVOKED_DEVICE_DENIAL_NOT_PROVEN","The existing runtime did not return the required PRIVATE_DEVICE_REVOKED guard result.",evidence);
      if(!localStorageUnchanged)return authorizationAcceptanceFail("ACCEPTANCE_LOCAL_STORAGE_CHANGED","The revoked-device probe observed an unexpected browser storage change.",evidence);
      return authorizationAcceptancePass("ACCEPTANCE_REVOKED_DEVICE_PREREQUISITE_CONFIRMED",{...evidence,providerAuthorizationDenied:false,rjrEligibleEvidence:false});
    }catch(error){
      return authorizationAcceptanceFail(error&&error.code?error.code:"ACCEPTANCE_REVOKED_DEVICE_PROBE_FAILED",error&&error.message?error.message:"Revoked-device authorization probe failed.");
    }
  }

  function authorizationAcceptanceEvidenceRecord(result,meta={}){
    return Object.freeze({
      schemaVersion:1,
      feature:FEATURE,
      generatedAt:new Date().toISOString(),
      applicationVersion:meta.applicationVersion||"1.8.1",
      runtimeRevision:meta.runtimeRevision||null,
      origin:meta.origin||null,
      result:result&&result.ok===true?"PASS":"NOT_PROVEN",
      ...result
    });
  }

  async function authorizationAcceptanceBrowserServices(){
    const runtime=root.CareerModeProductionFirebaseRuntime;
    const pairing=root.CareerModeSparkPrivatePairing;
    if(!runtime||typeof runtime.ensureAccountServices!=="function")throw Object.assign(new Error("Production Firebase runtime is unavailable."),{code:"ACCEPTANCE_RUNTIME_UNAVAILABLE"});
    if(!pairing)throw Object.assign(new Error("Registered-device runtime is unavailable."),{code:"ACCEPTANCE_PAIRING_RUNTIME_UNAVAILABLE"});
    const services=await runtime.ensureAccountServices();
    if(!services||services.ok!==true)throw Object.assign(new Error("Firebase account services are unavailable."),{code:"ACCEPTANCE_ACCOUNT_SERVICES_UNAVAILABLE"});
    const moduleUrl=runtime.firebaseFirestoreModule||`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`;
    const firestoreModule=await import(moduleUrl);
    if(typeof firestoreModule.getDoc!=="function")throw Object.assign(new Error("Firestore getDoc is unavailable."),{code:"ACCEPTANCE_FIRESTORE_READ_UNAVAILABLE"});
    return {runtime,pairing,services,getDocImpl:firestoreModule.getDoc};
  }

  async function authorizationAcceptanceExistingActiveAccount(context,user){
    const accountId=authorizationAcceptanceNormalizeUser(user);
    const accountRef=context.services.firestoreSdk.doc(context.services.firestore,"accounts",accountId);
    const snapshot=await context.getDocImpl(accountRef);
    const envelope=authorizationAcceptanceSnapshotData(snapshot);
    const active=Boolean(envelope&&envelope.objectType==="account"&&envelope.objectId===accountId&&envelope.lifecycleState==="live"&&envelope.data&&envelope.data.status==="active");
    return {active,accountId};
  }

  async function authorizationAcceptanceRequireExistingActiveAccount(context){
    const user=context.services.auth&&context.services.auth.currentUser;
    if(!user)throw Object.assign(new Error("Sign in with an existing legitimate Connected Account first."),{code:"ACCEPTANCE_AUTH_REQUIRED"});
    const account=await authorizationAcceptanceExistingActiveAccount(context,user);
    if(!account.active)throw Object.assign(new Error("This authenticated identity is not an existing active private account. The acceptance tool will not bootstrap or create account state for a test."),{code:"ACCEPTANCE_EXISTING_ACTIVE_ACCOUNT_REQUIRED"});
    return user;
  }

  let pageServicesPromise=null;
  let authorizationAcceptanceAuthControlLockGeneration=0;
  let authorizationAcceptanceActiveAuthControlLockToken=null;

  function authorizationAcceptanceSetText(id,text){const element=root.document&&root.document.getElementById(id);if(element)element.textContent=text;}
  function authorizationAcceptanceSetDisabled(id,value){const element=root.document&&root.document.getElementById(id);if(element)element.disabled=Boolean(value);}
  function authorizationAcceptanceApplyAuthControlState(user){
    const locked=authorizationAcceptanceActiveAuthControlLockToken!==null;
    authorizationAcceptanceSetDisabled("authorizationSignIn",locked||Boolean(user));
    authorizationAcceptanceSetDisabled("authorizationSignOut",locked||!user);
  }
  function authorizationAcceptanceAcquireAuthControlsLock(){
    if(authorizationAcceptanceActiveAuthControlLockToken!==null)throw Object.assign(new Error("Authentication controls are already locked by another acceptance operation."),{code:"ACCEPTANCE_AUTH_CONTROLS_ALREADY_LOCKED"});
    authorizationAcceptanceAuthControlLockGeneration+=1;
    const token=`acceptance-auth-lock-${authorizationAcceptanceAuthControlLockGeneration}`;
    authorizationAcceptanceActiveAuthControlLockToken=token;
    authorizationAcceptanceApplyAuthControlState(null);
    return token;
  }
  function authorizationAcceptanceIsAuthControlsLockHeld(token){
    return typeof token==="string"&&token.length>0&&authorizationAcceptanceActiveAuthControlLockToken===token;
  }
  function authorizationAcceptanceReleaseAuthControlsLock(token,user=null){
    if(!authorizationAcceptanceIsAuthControlsLockHeld(token))return false;
    authorizationAcceptanceActiveAuthControlLockToken=null;
    authorizationAcceptanceApplyAuthControlState(user);
    return true;
  }
  function authorizationAcceptanceRequireAuthControlsUnlocked(){
    if(authorizationAcceptanceActiveAuthControlLockToken!==null)throw Object.assign(new Error("Authentication controls are locked while an acceptance probe is running."),{code:"ACCEPTANCE_AUTH_CONTROLS_LOCKED"});
  }

  async function authorizationAcceptanceInitializePageAuth(){
    if(pageServicesPromise)return pageServicesPromise;
    pageServicesPromise=(async()=>{
      const context=await authorizationAcceptanceBrowserServices();
      const authSdk=context.services.authSdk;
      await authSdk.setPersistence(context.services.auth,authSdk.browserSessionPersistence);
      authSdk.onAuthStateChanged(context.services.auth,user=>{
        authorizationAcceptanceSetText("authorizationAcceptanceAccountState",user?"Authenticated · checking existing private account on next probe":"Signed out · no Firestore app data will be created");
        authorizationAcceptanceApplyAuthControlState(user);
      });
      const user=context.services.auth.currentUser;
      authorizationAcceptanceSetText("authorizationAcceptanceAccountState",user?"Authenticated · checking existing private account on next probe":"Signed out · no Firestore app data will be created");
      authorizationAcceptanceApplyAuthControlState(user);
      return context;
    })().catch(error=>{pageServicesPromise=null;throw error;});
    return pageServicesPromise;
  }

  async function authorizationAcceptanceSignInFromPage(){
    authorizationAcceptanceRequireAuthControlsUnlocked();
    const context=await authorizationAcceptanceInitializePageAuth();
    authorizationAcceptanceRequireAuthControlsUnlocked();
    const authSdk=context.services.authSdk;
    const provider=new authSdk.GoogleAuthProvider();
    await authSdk.signInWithPopup(context.services.auth,provider);
    const account=await authorizationAcceptanceExistingActiveAccount(context,context.services.auth.currentUser);
    if(!account.active){
      authorizationAcceptanceSetText("authorizationAcceptanceStatus","AUTHENTICATED BUT BLOCKED · this identity is not an existing active private account; no Firestore private account was created by this tool");
      return false;
    }
    authorizationAcceptanceSetText("authorizationAcceptanceStatus","Existing active private account confirmed. Choose only the probe that matches legitimate pre-existing test state.");
    return true;
  }

  async function authorizationAcceptanceSignOutFromPage(){
    authorizationAcceptanceRequireAuthControlsUnlocked();
    const context=await authorizationAcceptanceInitializePageAuth();
    authorizationAcceptanceRequireAuthControlsUnlocked();
    await context.services.authSdk.signOut(context.services.auth);
    authorizationAcceptanceSetText("authorizationAcceptanceStatus","Signed out. No acceptance result is active.");
    return true;
  }

  function authorizationAcceptanceRuntimeRevision(){
    const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():null;
  }

  function authorizationAcceptanceRenderResult(result){
    const record=authorizationAcceptanceEvidenceRecord(result,{runtimeRevision:authorizationAcceptanceRuntimeRevision(),origin:root.location&&root.location.origin?root.location.origin:null});
    const output=root.document&&root.document.getElementById("authorizationAcceptanceEvidence");
    if(output)output.textContent=JSON.stringify(record,null,2);
    authorizationAcceptanceSetText("authorizationAcceptanceStatus",record.result==="PASS"?(record.code==="ACCEPTANCE_REVOKED_DEVICE_PREREQUISITE_CONFIRMED"?"PREREQUISITE CONFIRMED · revoked device state is real, but provider mutation denial is not yet proven":"PASS · third-account provider read denial proven without changing local saves"):"NOT PROVEN · no RJR credit should be awarded from this result");
    return record;
  }

  async function authorizationAcceptanceRunThirdAccountFromPage(){
    authorizationAcceptanceSetDisabled("authorizationThirdAccountProbe",true);authorizationAcceptanceSetDisabled("authorizationRevokedDeviceProbe",true);
    authorizationAcceptanceSetText("authorizationAcceptanceStatus","Checking private rivalry read denial…");
    try{
      const context=await authorizationAcceptanceInitializePageAuth();
      const user=await authorizationAcceptanceRequireExistingActiveAccount(context);
      const rivalryInput=root.document.getElementById("authorizationRivalryId");
      const result=await authorizationAcceptanceProbeThirdAccountReadDenial({
        user,
        firestore:context.services.firestore,
        docImpl:context.services.firestoreSdk.doc,
        getDocImpl:context.getDocImpl,
        rivalryId:rivalryInput?rivalryInput.value:"",
        operatorConfirmedThirdAccount:Boolean(root.document.getElementById("authorizationThirdAccountConfirm")?.checked),
        operatorConfirmedActivePairedRivalry:Boolean(root.document.getElementById("authorizationActiveRivalryConfirm")?.checked),
        localStorageImpl:root["local"+"Storage"],
        cryptoImpl:root.crypto
      });
      return authorizationAcceptanceRenderResult(result);
    }finally{authorizationAcceptanceSetDisabled("authorizationThirdAccountProbe",false);authorizationAcceptanceSetDisabled("authorizationRevokedDeviceProbe",false);}
  }

  async function authorizationAcceptanceRunRevokedDeviceFromPage(){
    authorizationAcceptanceSetDisabled("authorizationThirdAccountProbe",true);authorizationAcceptanceSetDisabled("authorizationRevokedDeviceProbe",true);
    authorizationAcceptanceSetText("authorizationAcceptanceStatus","Checking this browser's registered-device revocation state…");
    try{
      const context=await authorizationAcceptanceInitializePageAuth();
      const user=await authorizationAcceptanceRequireExistingActiveAccount(context);
      const result=await authorizationAcceptanceProbeRevokedDevicePrerequisite({
        user,
        firestore:context.services.firestore,
        firebaseSdk:context.services.firestoreSdk,
        docImpl:context.services.firestoreSdk.doc,
        getDocImpl:context.getDocImpl,
        pairingApi:context.pairing,
        operatorConfirmedLegitimateRevocation:Boolean(root.document.getElementById("authorizationRevokedDeviceConfirm")?.checked),
        localStorageImpl:root["local"+"Storage"],
        cryptoImpl:root.crypto
      });
      return authorizationAcceptanceRenderResult(result);
    }finally{authorizationAcceptanceSetDisabled("authorizationThirdAccountProbe",false);authorizationAcceptanceSetDisabled("authorizationRevokedDeviceProbe",false);}
  }

  async function authorizationAcceptanceMountPage(){
    if(!root.document)return false;
    const third=root.document.getElementById("authorizationThirdAccountProbe");
    const revoked=root.document.getElementById("authorizationRevokedDeviceProbe");
    const signIn=root.document.getElementById("authorizationSignIn");
    const signOut=root.document.getElementById("authorizationSignOut");
    const copy=root.document.getElementById("authorizationCopyEvidence");
    if(!third||!revoked||!signIn||!signOut)return false;
    signIn.addEventListener("click",()=>{void authorizationAcceptanceSignInFromPage().catch(error=>authorizationAcceptanceSetText("authorizationAcceptanceStatus",error&&error.message?error.message:"Sign-in failed."));});
    signOut.addEventListener("click",()=>{void authorizationAcceptanceSignOutFromPage().catch(error=>authorizationAcceptanceSetText("authorizationAcceptanceStatus",error&&error.message?error.message:"Sign-out failed."));});
    third.addEventListener("click",()=>{void authorizationAcceptanceRunThirdAccountFromPage().catch(error=>authorizationAcceptanceRenderResult(authorizationAcceptanceFail(error&&error.code?error.code:"ACCEPTANCE_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message?error.message:"Third-account probe failed.")));});
    revoked.addEventListener("click",()=>{void authorizationAcceptanceRunRevokedDeviceFromPage().catch(error=>authorizationAcceptanceRenderResult(authorizationAcceptanceFail(error&&error.code?error.code:"ACCEPTANCE_REVOKED_DEVICE_PROBE_FAILED",error&&error.message?error.message:"Revoked-device probe failed.")));});
    if(copy)copy.addEventListener("click",async()=>{
      const output=root.document.getElementById("authorizationAcceptanceEvidence");
      const text=output?output.textContent:"";
      if(text&&root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){
        await root.navigator.clipboard.writeText(text);
        authorizationAcceptanceSetText("authorizationAcceptanceStatus","Evidence JSON copied. Review it before sharing.");
      }
    });
    try{await authorizationAcceptanceInitializePageAuth();}catch(error){authorizationAcceptanceSetText("authorizationAcceptanceStatus",error&&error.message?error.message:"Production account services are unavailable.");}
    return true;
  }

  if(root.document){
    const start=()=>{void authorizationAcceptanceMountPage();};
    if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  }

  return Object.freeze({
    contractVersion:1,
    feature:FEATURE,
    productionMutationPolicy:"read-only-third-account-plus-revoked-device-prerequisite-confirmation",
    rjrCreditOnImplementation:false,
    accountBootstrapAllowed:false,
    providerWriteCreationAllowed:false,
    canonicalLocalStorageKeys:CANONICAL_LOCAL_STORAGE_KEYS,
    normalizeRivalryId:authorizationAcceptanceNormalizeRivalryId,
    isPermissionDenied:authorizationAcceptanceIsPermissionDenied,
    fingerprint:authorizationAcceptanceFingerprint,
    snapshotStorage:authorizationAcceptanceSnapshotStorage,
    probeThirdAccountReadDenial:authorizationAcceptanceProbeThirdAccountReadDenial,
    probeRevokedDeviceDenial:authorizationAcceptanceProbeRevokedDevicePrerequisite,
    evidenceRecord:authorizationAcceptanceEvidenceRecord,
    existingActiveAccount:authorizationAcceptanceExistingActiveAccount,
    acquireAuthControlsLock:authorizationAcceptanceAcquireAuthControlsLock,
    isAuthControlsLockHeld:authorizationAcceptanceIsAuthControlsLockHeld,
    releaseAuthControlsLock:authorizationAcceptanceReleaseAuthControlsLock,
    mountAcceptancePage:authorizationAcceptanceMountPage
  });
});