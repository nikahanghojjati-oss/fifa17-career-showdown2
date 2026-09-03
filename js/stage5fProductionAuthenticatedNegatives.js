(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStage5fProductionAuthenticatedNegatives=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const FEATURE="stage5f-production-authenticated-negatives";
  const RIVALRY_PATTERN=/^pair_[0-9a-f]{64}$/;
  const DEVICE_PATTERN=/^device_[0-9a-f]{32}$/;
  const POINTER_DB_NAME="careerModeShowdown.connectedRivalry";
  const POINTER_STORE_NAME="bindings";
  let hostVerifiedRivalryId=null;

  function fail(code,message,extra={}){return Object.freeze({ok:false,feature:FEATURE,code,message,...extra});}
  function pass(code,extra={}){return Object.freeze({ok:true,feature:FEATURE,code,...extra});}
  function normalizeUser(user){const uid=user&&typeof user.uid==="string"?user.uid.trim():"";if(!uid)throw Object.assign(new Error("Sign in with Google before running Stage 5F acceptance."),{code:"STAGE5F_AUTH_REQUIRED"});return uid;}
  function normalizeRivalry(value){const rivalryId=typeof value==="string"?value.trim().toLowerCase():"";if(!RIVALRY_PATTERN.test(rivalryId))throw Object.assign(new Error("A valid active Connected Rivalry ID is required."),{code:"STAGE5F_RIVALRY_ID_INVALID"});return rivalryId;}
  function permissionDenied(error){const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";const message=error&&typeof error.message==="string"?error.message:"";return code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied"||/missing or insufficient permissions/i.test(message);}
  function errorCode(error){return error&&error.code?String(error.code):"unknown";}
  function snapshotStorage(storage){if(!storage||typeof storage.length!=="number"||typeof storage.key!=="function"||typeof storage.getItem!=="function")return null;const entries=[];for(let i=0;i<storage.length;i+=1){const key=storage.key(i);entries.push([key,storage.getItem(key)]);}entries.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));return JSON.stringify(entries);}
  function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
  async function fingerprint(value,cryptoImpl=root.crypto){if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")return null;const bytes=new TextEncoder().encode(String(value??""));const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(digest))}`;}
  function validEnvelope(snapshot,objectType,objectId){if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists()||typeof snapshot.data!=="function")return null;const value=snapshot.data();return value&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"?value:null;}
  async function transactionRead(firestore,sdk,reference){return sdk.runTransaction(firestore,async transaction=>transaction.get(reference));}

  async function readCurrentRivalryPointer(options={}){
    const accountId=normalizeUser(options.user);
    const pairing=options.pairingApi;
    if(!pairing||typeof pairing.getOrCreateDeviceIdentity!=="function")return fail("STAGE5F_PAIRING_RUNTIME_UNAVAILABLE","Registered-device runtime is unavailable.");
    const identity=options.identity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl:options.cryptoImpl||root.crypto});
    if(!identity||!DEVICE_PATTERN.test(identity.deviceId||""))return fail("STAGE5F_DEVICE_IDENTITY_INVALID","A stable registered browser identity is required.");
    const indexedDBImpl=options.indexedDBImpl||root.indexedDB;
    if(!indexedDBImpl||typeof indexedDBImpl.open!=="function")return fail("STAGE5F_POINTER_STORAGE_UNAVAILABLE","Connected Rivalry pointer storage is unavailable.");
    let database;
    try{
      database=await new Promise((resolve,reject)=>{const request=indexedDBImpl.open(POINTER_DB_NAME,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Object.assign(new Error("Connected Rivalry pointer storage could not be opened."),{code:"STAGE5F_POINTER_STORAGE_UNAVAILABLE"}));request.onblocked=request.onerror;});
      if(!database.objectStoreNames.contains(POINTER_STORE_NAME))return fail("STAGE5F_RIVALRY_POINTER_NOT_FOUND","No saved Connected Rivalry pointer exists in this browser.");
      const values=await new Promise((resolve,reject)=>{const tx=database.transaction(POINTER_STORE_NAME,"readonly");const request=tx.objectStore(POINTER_STORE_NAME).getAll();request.onsuccess=()=>resolve(Array.isArray(request.result)?request.result:[]);request.onerror=()=>reject(Object.assign(new Error("Connected Rivalry pointers could not be read."),{code:"STAGE5F_POINTER_STORAGE_UNAVAILABLE"}));});
      const candidates=values.filter(value=>value&&value.accountId===accountId&&value.deviceId===identity.deviceId&&RIVALRY_PATTERN.test(value.rivalryId||"")).sort((a,b)=>Number(b.attachedAtEpochMs||0)-Number(a.attachedAtEpochMs||0));
      if(!candidates.length)return fail("STAGE5F_RIVALRY_POINTER_NOT_FOUND","No saved Connected Rivalry pointer matches this signed-in account and registered browser.");
      return pass("STAGE5F_RIVALRY_POINTER_RESOLVED",{rivalryId:candidates[0].rivalryId,deviceId:identity.deviceId});
    }finally{if(database&&typeof database.close==="function")database.close();}
  }

  async function probeRevokedDeviceProviderDenial(options={}){
    let sessionId=null;
    let sessionOpened=false;
    let syntheticIdentity=null;
    let syntheticRegistered=false;
    let syntheticRevoked=false;
    try{
      const accountId=normalizeUser(options.user);
      const rivalryId=normalizeRivalry(options.rivalryId);
      const pairing=options.pairingApi;
      const protocol=options.protocolApi;
      const firestore=options.firestore;
      const sdk=options.firebaseSdk;
      const cryptoImpl=options.cryptoImpl||root.crypto;
      if(!pairing||typeof pairing.getOrCreateDeviceIdentity!=="function"||typeof pairing.generateDeviceIdentity!=="function"||typeof pairing.registerDevice!=="function"||typeof pairing.revokeDevice!=="function")return fail("STAGE5F_PAIRING_RUNTIME_UNAVAILABLE","Registered-device acceptance helpers are unavailable.");
      if(!protocol||typeof protocol.generateSessionId!=="function"||typeof protocol.openSession!=="function"||typeof protocol.readSession!=="function"||typeof protocol.revokeSession!=="function"||typeof protocol.buildEnvelope!=="function")return fail("STAGE5F_SESSION_RUNTIME_UNAVAILABLE","Private-session acceptance helpers are unavailable.");
      if(!firestore||!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function"||!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")return fail("STAGE5F_FIRESTORE_RUNTIME_UNAVAILABLE","Firestore transaction helpers are unavailable.");

      const actorIdentity=options.actorIdentity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl});
      if(!actorIdentity||!DEVICE_PATTERN.test(actorIdentity.deviceId||""))return fail("STAGE5F_DEVICE_IDENTITY_INVALID","A stable registered browser identity is required.");
      const actorDeviceRef=sdk.doc(firestore,"accounts",accountId,"devices",actorIdentity.deviceId);
      const actorSnapshot=await transactionRead(firestore,sdk,actorDeviceRef);
      const actorEnvelope=validEnvelope(actorSnapshot,"device",actorIdentity.deviceId);
      if(!actorEnvelope||!actorEnvelope.data||actorEnvelope.data.state!=="active")return fail("STAGE5F_ACTIVE_DEVICE_REQUIRED","Run this probe from an already active registered browser. No real device will be created or revoked by this acceptance tool.");

      const beforeStorage=snapshotStorage(options.localStorageImpl);
      const nowBase=Number.isFinite(options.nowEpochMs)?Number(options.nowEpochMs):Date.now();
      syntheticIdentity=pairing.generateDeviceIdentity(cryptoImpl,nowBase+1);
      const registration=await pairing.registerDevice({user:options.user,firestore,firebaseSdk:sdk,identity:syntheticIdentity,cryptoImpl,nowEpochMs:nowBase+2});
      if(!registration||registration.ok!==true)return fail("STAGE5F_SYNTHETIC_DEVICE_REGISTRATION_FAILED","The sacrificial test device could not be registered through normal Spark Rules.",{registrationCode:registration&&registration.code||null});
      syntheticRegistered=true;
      const revocation=await pairing.revokeDevice({user:options.user,firestore,firebaseSdk:sdk,identity:actorIdentity,targetDeviceId:syntheticIdentity.deviceId,cryptoImpl,nowEpochMs:nowBase+3});
      if(!revocation||revocation.ok!==true)return fail("STAGE5F_SYNTHETIC_DEVICE_REVOCATION_FAILED","The sacrificial device could not be revoked by the active registered browser.",{revocationCode:revocation&&revocation.code||null});
      syntheticRevoked=true;

      sessionId=protocol.generateSessionId(cryptoImpl);
      const operation={user:options.user,firestore,firebaseSdk:sdk,rivalryId,sessionId,cryptoImpl};
      const opened=await protocol.openSession({...operation,deviceId:actorIdentity.deviceId,nowEpochMs:nowBase+4,ttlMs:5*60*1000});
      if(!opened||opened.ok!==true)return fail("STAGE5F_TEST_SESSION_OPEN_FAILED","A short-lived exact private test session could not be opened by the active manager.",{openCode:opened&&opened.code||null});
      sessionOpened=true;

      const adapterResult=await protocol.revokeSession({...operation,deviceId:syntheticIdentity.deviceId,nowEpochMs:nowBase+5});
      const adapterDenied=Boolean(adapterResult&&adapterResult.ok===false&&(adapterResult.code==="PRIVATE_SESSION_DEVICE_REVOKED"||permissionDenied({code:adapterResult.code,message:adapterResult.message})));

      const sessionRef=sdk.doc(firestore,"rivalries",rivalryId,"sessions",sessionId);
      let providerDenied=false;
      let providerErrorCode=null;
      try{
        await sdk.runTransaction(firestore,async transaction=>{
          const snapshot=await transaction.get(sessionRef);
          const current=validEnvelope(snapshot,"session",sessionId);
          if(!current||!current.data)throw Object.assign(new Error("The exact Stage 5F test session disappeared before the denied mutation."),{code:"STAGE5F_TEST_SESSION_MISSING"});
          const now=sdk.Timestamp.fromMillis(nowBase+6);
          const data={...current.data,state:"revoked",lastActivityAt:now,revokedAt:now};
          const envelope=await protocol.buildEnvelope({sessionId,revision:current.revision+1,parentRevision:current.revision,priorContentHash:current.contentHash,updatedAt:now,accountId,deviceId:syntheticIdentity.deviceId,data,cryptoImpl});
          transaction.set(sessionRef,envelope);
        });
      }catch(error){providerDenied=permissionDenied(error);providerErrorCode=errorCode(error);if(!providerDenied)throw error;}

      const observed=await protocol.readSession({...operation,deviceId:actorIdentity.deviceId,nowEpochMs:nowBase+7});
      const sessionUnchanged=Boolean(providerDenied&&observed&&observed.ok===true&&observed.state==="open"&&observed.revision===opened.revision);
      const cleanupResult=await protocol.revokeSession({...operation,deviceId:actorIdentity.deviceId,nowEpochMs:nowBase+8});
      sessionOpened=false;
      const cleanupTerminal=Boolean(cleanupResult&&cleanupResult.ok===true&&cleanupResult.state==="revoked");
      const afterStorage=snapshotStorage(options.localStorageImpl);
      const localStorageUnchanged=beforeStorage===afterStorage;
      const evidence={
        probe:"revoked-device-provider-mutation-denial",
        accountFingerprint:await fingerprint(accountId,cryptoImpl),
        rivalryFingerprint:await fingerprint(rivalryId,cryptoImpl),
        actorDeviceFingerprint:await fingerprint(actorIdentity.deviceId,cryptoImpl),
        syntheticDeviceFingerprint:await fingerprint(syntheticIdentity.deviceId,cryptoImpl),
        sessionFingerprint:await fingerprint(sessionId,cryptoImpl),
        syntheticDeviceRegistered:syntheticRegistered,
        syntheticDeviceRevoked:syntheticRevoked,
        applicationAdapterDenied:adapterDenied,
        applicationAdapterCode:adapterResult&&adapterResult.code||null,
        providerMutationDenied:providerDenied,
        providerErrorCode,
        deniedMutationCommitted:false,
        sessionUnchangedAfterDeniedMutation:sessionUnchanged,
        cleanupTerminal,
        sacrificialDeviceRetainedRevoked:true,
        localStorageUnchanged,
        billingRequired:false,
        blazeRequired:false,
        firestoreCommittedWritesExpected:4,
        rjrEligibleEvidenceCandidate:adapterDenied&&providerDenied&&sessionUnchanged&&cleanupTerminal&&localStorageUnchanged
      };
      if(!adapterDenied)return fail("STAGE5F_REVOKED_DEVICE_ADAPTER_DENIAL_NOT_PROVEN","The normal session adapter did not reject the revoked sacrificial device.",evidence);
      if(!providerDenied)return fail("STAGE5F_REVOKED_DEVICE_PROVIDER_DENIAL_NOT_PROVEN","Production Firestore unexpectedly accepted a protected session mutation carrying a revoked device ID. The test session was left terminal and no RJR credit is allowed.",evidence);
      if(!sessionUnchanged)return fail("STAGE5F_SESSION_CHANGED_AFTER_DENIAL","The protected session changed despite the expected provider denial.",evidence);
      if(!cleanupTerminal)return fail("STAGE5F_TEST_SESSION_CLEANUP_FAILED","The host could not terminally revoke the short-lived test session after the denied mutation.",evidence);
      if(!localStorageUnchanged)return fail("STAGE5F_LOCAL_STORAGE_CHANGED","The provider-only acceptance probe changed canonical/local browser storage unexpectedly.",evidence);
      return pass("STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED",evidence);
    }catch(error){
      return fail(error&&error.code?error.code:"STAGE5F_REVOKED_DEVICE_PROBE_FAILED",error&&error.message?error.message:"Revoked-device provider acceptance failed.",{syntheticDeviceRegistered:syntheticRegistered,syntheticDeviceRevoked:syntheticRevoked,cleanupAttempted:Boolean(sessionId)});
    }finally{
      if(sessionOpened&&sessionId){
        try{
          const pairing=options.pairingApi;const protocol=options.protocolApi;const actorIdentity=options.actorIdentity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl:options.cryptoImpl||root.crypto});
          await protocol.revokeSession({user:options.user,firestore:options.firestore,firebaseSdk:options.firebaseSdk,deviceId:actorIdentity.deviceId,rivalryId:options.rivalryId,sessionId,cryptoImpl:options.cryptoImpl||root.crypto,nowEpochMs:Date.now()});
        }catch(_error){}
      }
      if(syntheticRegistered&&!syntheticRevoked&&syntheticIdentity){
        try{
          const pairing=options.pairingApi;const actorIdentity=options.actorIdentity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl:options.cryptoImpl||root.crypto});
          await pairing.revokeDevice({user:options.user,firestore:options.firestore,firebaseSdk:options.firebaseSdk,identity:actorIdentity,targetDeviceId:syntheticIdentity.deviceId,cryptoImpl:options.cryptoImpl||root.crypto,nowEpochMs:Date.now()});
        }catch(_error){}
      }
    }
  }

  async function deniedExactRead(firestore,sdk,reference){
    try{await sdk.runTransaction(firestore,async transaction=>{await transaction.get(reference);return true;});return {denied:false,errorCode:null};}
    catch(error){return {denied:permissionDenied(error),errorCode:errorCode(error)};}
  }

  async function probeAnyAuthenticatedThirdAccountDenial(options={}){
    try{
      const accountId=normalizeUser(options.user);
      const rivalryId=normalizeRivalry(options.rivalryId);
      if(options.operatorConfirmedThirdAccount!==true)return fail("STAGE5F_THIRD_ACCOUNT_CONFIRMATION_REQUIRED","Confirm that this signed-in Google account is neither manager in the target rivalry.");
      if(options.hostVerifiedRivalryId!==rivalryId&&options.operatorConfirmedActiveRivalry!==true)return fail("STAGE5F_ACTIVE_RIVALRY_CONFIRMATION_REQUIRED","The target must be the active rivalry already verified by the host acceptance step, or explicitly confirmed active.");
      const firestore=options.firestore,sdk=options.firebaseSdk;
      if(!firestore||!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function")return fail("STAGE5F_FIRESTORE_RUNTIME_UNAVAILABLE","Firestore read helpers are unavailable.");
      const before=snapshotStorage(options.localStorageImpl);
      const rivalryRead=await deniedExactRead(firestore,sdk,sdk.doc(firestore,"rivalries",rivalryId));
      const stateRead=await deniedExactRead(firestore,sdk,sdk.doc(firestore,"rivalries",rivalryId,"state","authoritative"));
      const after=snapshotStorage(options.localStorageImpl);
      const localStorageUnchanged=before===after;
      const providerAuthorizationDenied=rivalryRead.denied&&stateRead.denied;
      const evidence={
        probe:"any-authenticated-third-account-read-denial",
        accountFingerprint:await fingerprint(accountId,options.cryptoImpl||root.crypto),
        rivalryFingerprint:await fingerprint(rivalryId,options.cryptoImpl||root.crypto),
        rivalryReadDenied:rivalryRead.denied,
        rivalryReadErrorCode:rivalryRead.errorCode,
        authoritativeStateReadDenied:stateRead.denied,
        authoritativeStateReadErrorCode:stateRead.errorCode,
        providerAuthorizationDenied,
        existingPrivateAccountRequired:false,
        accountBootstrapAttempted:false,
        firestoreWritesRequested:0,
        localStorageUnchanged,
        billingRequired:false,
        blazeRequired:false,
        rjrEligibleEvidenceCandidate:providerAuthorizationDenied&&localStorageUnchanged
      };
      if(!providerAuthorizationDenied)return fail("STAGE5F_THIRD_ACCOUNT_DENIAL_NOT_PROVEN","Production Rules did not deny both exact private reads for this authenticated third account.",evidence);
      if(!localStorageUnchanged)return fail("STAGE5F_LOCAL_STORAGE_CHANGED","The read-only third-account probe changed browser storage unexpectedly.",evidence);
      return pass("STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED",evidence);
    }catch(error){return fail(error&&error.code?error.code:"STAGE5F_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message?error.message:"Third-account provider acceptance failed.");}
  }

  async function browserServices(){
    const runtime=root.CareerModeProductionFirebaseRuntime;
    const pairing=root.CareerModeSparkPrivatePairing;
    const protocol=root.CareerModeSparkStandardAuthPrivateSession;
    if(!runtime||typeof runtime.ensureAccountServices!=="function")throw Object.assign(new Error("Production Firebase runtime is unavailable."),{code:"STAGE5F_RUNTIME_UNAVAILABLE"});
    if(!pairing)throw Object.assign(new Error("Registered-device runtime is unavailable."),{code:"STAGE5F_PAIRING_RUNTIME_UNAVAILABLE"});
    if(!protocol)throw Object.assign(new Error("Standard Auth private-session runtime is unavailable."),{code:"STAGE5F_SESSION_RUNTIME_UNAVAILABLE"});
    const services=await runtime.ensureAccountServices();
    if(!services||services.ok!==true)throw Object.assign(new Error("Production Firebase account services are unavailable."),{code:"STAGE5F_ACCOUNT_SERVICES_UNAVAILABLE"});
    return {runtime,pairing,protocol,services};
  }
  function setText(id,text){const el=root.document&&root.document.getElementById(id);if(el)el.textContent=text;}
  function setDisabled(id,value){const el=root.document&&root.document.getElementById(id);if(el)el.disabled=Boolean(value);}
  function currentRivalryInput(){return root.document&&root.document.getElementById("authorizationRivalryId");}
  function evidenceRecord(result){return {schemaVersion:1,feature:FEATURE,generatedAt:new Date().toISOString(),applicationVersion:"1.9.0",runtimeRevision:"1.9.0-r5",origin:root.location&&root.location.origin||null,result:result&&result.ok===true?"PASS":"NOT_PROVEN",...result};}
  function render(result){const record=evidenceRecord(result);const output=root.document&&root.document.getElementById("authorizationAcceptanceEvidence");if(output)output.textContent=JSON.stringify(record,null,2);setText("authorizationAcceptanceStatus",record.result==="PASS"?`${record.code} · sanitized Stage 5F candidate evidence ready`:`NOT PROVEN · ${record.message||record.code} · no RJR credit`);return record;}
  async function resolveRivalryFromHost(context){
    const user=context.services.auth.currentUser;if(!user)return fail("STAGE5F_AUTH_REQUIRED","Sign in with the host/manager Google account first.");
    const pointer=await readCurrentRivalryPointer({user,pairingApi:context.pairing,indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
    if(pointer.ok){const input=currentRivalryInput();if(input)input.value=pointer.rivalryId;setText("stage5fRivalryResolution","Current Connected Rivalry loaded from this browser. The exact ID remains only in the input field on this page.");}
    else setText("stage5fRivalryResolution",pointer.message||"Current Connected Rivalry could not be resolved automatically.");
    return pointer;
  }
  async function runRevokedFromPage(){
    setDisabled("stage5fRevokedDeviceProviderProbe",true);setDisabled("stage5fThirdAccountProbe",true);setText("authorizationAcceptanceStatus","Running isolated revoked-device provider denial acceptance…");
    try{
      const context=await browserServices();const user=context.services.auth.currentUser;if(!user)throw Object.assign(new Error("Sign in with the active manager account first."),{code:"STAGE5F_AUTH_REQUIRED"});
      let rivalryId=currentRivalryInput()?.value||"";
      if(!RIVALRY_PATTERN.test(String(rivalryId).trim().toLowerCase())){const pointer=await resolveRivalryFromHost(context);if(pointer.ok)rivalryId=pointer.rivalryId;}
      const actorIdentity=await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
      const result=await probeRevokedDeviceProviderDenial({user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,pairingApi:context.pairing,protocolApi:context.protocol,actorIdentity,rivalryId,localStorageImpl:root.localStorage,indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
      if(result.ok){hostVerifiedRivalryId=normalizeRivalry(rivalryId);setText("stage5fHostProofState","Host boundary verified. Keep this page open, sign out, then sign in with a third Google account to run the zero-write denial below.");}
      return render(result);
    }finally{setDisabled("stage5fRevokedDeviceProviderProbe",false);setDisabled("stage5fThirdAccountProbe",false);}
  }
  async function runThirdFromPage(){
    setDisabled("stage5fRevokedDeviceProviderProbe",true);setDisabled("stage5fThirdAccountProbe",true);setText("authorizationAcceptanceStatus","Running authenticated third-account exact-read denial…");
    try{
      const context=await browserServices();const user=context.services.auth.currentUser;if(!user)throw Object.assign(new Error("Sign in with the third Google account first."),{code:"STAGE5F_AUTH_REQUIRED"});
      const rivalryId=currentRivalryInput()?.value||"";
      const result=await probeAnyAuthenticatedThirdAccountDenial({user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId,hostVerifiedRivalryId,operatorConfirmedThirdAccount:Boolean(root.document.getElementById("authorizationThirdAccountConfirm")?.checked),operatorConfirmedActiveRivalry:Boolean(root.document.getElementById("authorizationActiveRivalryConfirm")?.checked),localStorageImpl:root.localStorage,cryptoImpl:root.crypto});
      return render(result);
    }finally{setDisabled("stage5fRevokedDeviceProviderProbe",false);setDisabled("stage5fThirdAccountProbe",false);}
  }
  async function mount(){
    if(!root.document)return false;
    const load=root.document.getElementById("stage5fLoadCurrentRivalry"),revoked=root.document.getElementById("stage5fRevokedDeviceProviderProbe"),third=root.document.getElementById("stage5fThirdAccountProbe");
    if(!load||!revoked||!third)return false;
    load.addEventListener("click",()=>{void browserServices().then(resolveRivalryFromHost).then(render).catch(error=>render(fail(error&&error.code||"STAGE5F_RIVALRY_POINTER_FAILED",error&&error.message||"Current rivalry could not be loaded.")));});
    revoked.addEventListener("click",()=>{void runRevokedFromPage().catch(error=>render(fail(error&&error.code||"STAGE5F_REVOKED_DEVICE_PROBE_FAILED",error&&error.message||"Revoked-device acceptance failed.")));});
    third.addEventListener("click",()=>{void runThirdFromPage().catch(error=>render(fail(error&&error.code||"STAGE5F_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message||"Third-account acceptance failed.")));});
    return true;
  }
  if(root.document){const start=()=>{void mount();};if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",start,{once:true});else start();}

  return Object.freeze({contractVersion:1,feature:FEATURE,billingRequired:false,blazeRequired:false,cloudFunctionsRequired:false,cloudRunRequired:false,productionMutationScope:"sacrificial-device-register-revoke-plus-short-lived-session-and-denied-mutation",thirdAccountWriteScope:0,readCurrentRivalryPointer,probeRevokedDeviceProviderDenial,probeAnyAuthenticatedThirdAccountDenial,isPermissionDenied:permissionDenied,fingerprint,mount});
});
