(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStage5fProductionAuthenticatedNegatives=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const S5F_FEATURE="stage5f-production-authenticated-negatives";
  const S5F_RIVALRY_PATTERN=/^pair_[0-9a-f]{64}$/;
  const S5F_DEVICE_PATTERN=/^device_[0-9a-f]{32}$/;
  const S5F_POINTER_DB="careerModeShowdown.connectedRivalry";
  const S5F_POINTER_STORE="bindings";
  let s5fHostVerifiedRivalryId=null;

  function s5fFail(code,message,extra={}){return Object.freeze({ok:false,feature:S5F_FEATURE,code,message,...extra});}
  function s5fPass(code,extra={}){return Object.freeze({ok:true,feature:S5F_FEATURE,code,...extra});}
  function s5fUserId(user){const uid=user&&typeof user.uid==="string"?user.uid.trim():"";if(!uid)throw Object.assign(new Error("Sign in with Google before running Stage 5F acceptance."),{code:"STAGE5F_AUTH_REQUIRED"});return uid;}
  function s5fRivalryId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!S5F_RIVALRY_PATTERN.test(id))throw Object.assign(new Error("A valid active Connected Rivalry ID is required."),{code:"STAGE5F_RIVALRY_ID_INVALID"});return id;}
  function s5fPermissionDenied(error){const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";const message=error&&typeof error.message==="string"?error.message:"";return code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied"||/missing or insufficient permissions/i.test(message);}
  function s5fErrorCode(error){return error&&error.code?String(error.code):"unknown";}
  function s5fStorageSnapshot(storage){if(!storage||typeof storage.length!=="number"||typeof storage.key!=="function"||typeof storage.getItem!=="function")return null;const entries=[];for(let i=0;i<storage.length;i+=1){const key=storage.key(i);entries.push([key,storage.getItem(key)]);}entries.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));return JSON.stringify(entries);}
  function s5fHex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
  async function s5fFingerprint(value,cryptoImpl=root.crypto){if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")return null;const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(String(value??"")));return `sha256:${s5fHex(new Uint8Array(digest))}`;}
  function s5fEnvelope(snapshot,objectType,objectId){if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists()||typeof snapshot.data!=="function")return null;const value=snapshot.data();return value&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"?value:null;}
  async function s5fReadTransaction(firestore,sdk,reference){return sdk.runTransaction(firestore,async tx=>tx.get(reference));}

  async function s5fReadCurrentRivalryPointer(options={}){
    try{
      const accountId=s5fUserId(options.user);
      const pairing=options.pairingApi;
      if(!pairing||typeof pairing.getOrCreateDeviceIdentity!=="function")return s5fFail("STAGE5F_PAIRING_RUNTIME_UNAVAILABLE","Registered-device runtime is unavailable.");
      const identity=options.identity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl:options.cryptoImpl||root.crypto});
      if(!identity||!S5F_DEVICE_PATTERN.test(identity.deviceId||""))return s5fFail("STAGE5F_DEVICE_IDENTITY_INVALID","A stable registered browser identity is required.");
      const idb=options.indexedDBImpl||root.indexedDB;
      if(!idb||typeof idb.open!=="function")return s5fFail("STAGE5F_POINTER_STORAGE_UNAVAILABLE","Connected Rivalry pointer storage is unavailable.");
      let database=null;
      try{
        database=await new Promise((resolve,reject)=>{const request=idb.open(S5F_POINTER_DB,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Object.assign(new Error("Connected Rivalry pointer storage could not be opened."),{code:"STAGE5F_POINTER_STORAGE_UNAVAILABLE"}));request.onblocked=request.onerror;});
        if(!database.objectStoreNames.contains(S5F_POINTER_STORE))return s5fFail("STAGE5F_RIVALRY_POINTER_NOT_FOUND","No saved Connected Rivalry pointer exists in this browser.");
        const values=await new Promise((resolve,reject)=>{const tx=database.transaction(S5F_POINTER_STORE,"readonly");const request=tx.objectStore(S5F_POINTER_STORE).getAll();request.onsuccess=()=>resolve(Array.isArray(request.result)?request.result:[]);request.onerror=()=>reject(Object.assign(new Error("Connected Rivalry pointers could not be read."),{code:"STAGE5F_POINTER_STORAGE_UNAVAILABLE"}));});
        const candidates=values.filter(value=>value&&value.accountId===accountId&&value.deviceId===identity.deviceId&&S5F_RIVALRY_PATTERN.test(value.rivalryId||"")).sort((a,b)=>Number(b.attachedAtEpochMs||0)-Number(a.attachedAtEpochMs||0));
        if(!candidates.length)return s5fFail("STAGE5F_RIVALRY_POINTER_NOT_FOUND","No saved Connected Rivalry pointer matches this account and registered browser.");
        return s5fPass("STAGE5F_RIVALRY_POINTER_RESOLVED",{rivalryId:candidates[0].rivalryId,deviceId:identity.deviceId});
      }finally{if(database&&typeof database.close==="function")database.close();}
    }catch(error){return s5fFail(error&&error.code||"STAGE5F_RIVALRY_POINTER_FAILED",error&&error.message||"Current Connected Rivalry could not be resolved.");}
  }

  async function s5fProbeRevokedDeviceProviderDenial(options={}){
    let sessionId=null,sessionOpened=false,syntheticIdentity=null,syntheticRegistered=false,syntheticRevoked=false;
    const pairing=options.pairingApi,protocol=options.protocolApi,firestore=options.firestore,sdk=options.firebaseSdk,cryptoImpl=options.cryptoImpl||root.crypto;
    let actorIdentity=options.actorIdentity||null;
    try{
      const accountId=s5fUserId(options.user),rivalryId=s5fRivalryId(options.rivalryId);
      if(!pairing||typeof pairing.getOrCreateDeviceIdentity!=="function"||typeof pairing.generateDeviceIdentity!=="function"||typeof pairing.registerDevice!=="function"||typeof pairing.revokeDevice!=="function")return s5fFail("STAGE5F_PAIRING_RUNTIME_UNAVAILABLE","Registered-device acceptance helpers are unavailable.");
      if(!protocol||typeof protocol.generateSessionId!=="function"||typeof protocol.openSession!=="function"||typeof protocol.readSession!=="function"||typeof protocol.revokeSession!=="function"||typeof protocol.buildEnvelope!=="function")return s5fFail("STAGE5F_SESSION_RUNTIME_UNAVAILABLE","Private-session acceptance helpers are unavailable.");
      if(!firestore||!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function"||!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")return s5fFail("STAGE5F_FIRESTORE_RUNTIME_UNAVAILABLE","Firestore transaction helpers are unavailable.");
      actorIdentity=actorIdentity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl});
      if(!actorIdentity||!S5F_DEVICE_PATTERN.test(actorIdentity.deviceId||""))return s5fFail("STAGE5F_DEVICE_IDENTITY_INVALID","A stable registered browser identity is required.");
      const actorSnapshot=await s5fReadTransaction(firestore,sdk,sdk.doc(firestore,"accounts",accountId,"devices",actorIdentity.deviceId));
      const actorEnvelope=s5fEnvelope(actorSnapshot,"device",actorIdentity.deviceId);
      if(!actorEnvelope||!actorEnvelope.data||actorEnvelope.data.state!=="active")return s5fFail("STAGE5F_ACTIVE_DEVICE_REQUIRED","Run this probe from an already active registered browser. No real browser will be revoked by this tool.");

      const before=s5fStorageSnapshot(options.localStorageImpl),base=Number.isFinite(options.nowEpochMs)?Number(options.nowEpochMs):Date.now();
      syntheticIdentity=pairing.generateDeviceIdentity(cryptoImpl,base+1);
      const registered=await pairing.registerDevice({user:options.user,firestore,firebaseSdk:sdk,identity:syntheticIdentity,cryptoImpl,nowEpochMs:base+2});
      if(!registered||registered.ok!==true)return s5fFail("STAGE5F_SYNTHETIC_DEVICE_REGISTRATION_FAILED","The sacrificial test device could not be registered through normal Spark Rules.",{registrationCode:registered&&registered.code||null});
      syntheticRegistered=true;
      const revoked=await pairing.revokeDevice({user:options.user,firestore,firebaseSdk:sdk,identity:actorIdentity,targetDeviceId:syntheticIdentity.deviceId,cryptoImpl,nowEpochMs:base+3});
      if(!revoked||revoked.ok!==true)return s5fFail("STAGE5F_SYNTHETIC_DEVICE_REVOCATION_FAILED","The sacrificial device could not be revoked by the active browser.",{revocationCode:revoked&&revoked.code||null});
      syntheticRevoked=true;

      sessionId=protocol.generateSessionId(cryptoImpl);
      const operation={user:options.user,firestore,firebaseSdk:sdk,rivalryId,sessionId,cryptoImpl};
      const opened=await protocol.openSession({...operation,deviceId:actorIdentity.deviceId,nowEpochMs:base+4,ttlMs:300000});
      if(!opened||opened.ok!==true)return s5fFail("STAGE5F_TEST_SESSION_OPEN_FAILED","A short-lived exact private test session could not be opened.",{openCode:opened&&opened.code||null});
      sessionOpened=true;
      const adapter=await protocol.revokeSession({...operation,deviceId:syntheticIdentity.deviceId,nowEpochMs:base+5});
      const adapterDenied=Boolean(adapter&&adapter.ok===false&&(adapter.code==="PRIVATE_SESSION_DEVICE_REVOKED"||s5fPermissionDenied({code:adapter.code,message:adapter.message})));

      const sessionRef=sdk.doc(firestore,"rivalries",rivalryId,"sessions",sessionId);
      let providerDenied=false,providerErrorCode=null;
      try{
        await sdk.runTransaction(firestore,async tx=>{
          const current=s5fEnvelope(await tx.get(sessionRef),"session",sessionId);
          if(!current||!current.data)throw Object.assign(new Error("The exact Stage 5F test session disappeared before the denied mutation."),{code:"STAGE5F_TEST_SESSION_MISSING"});
          const now=sdk.Timestamp.fromMillis(base+6),data={...current.data,state:"revoked",lastActivityAt:now,revokedAt:now};
          const envelope=await protocol.buildEnvelope({sessionId,revision:current.revision+1,parentRevision:current.revision,priorContentHash:current.contentHash,updatedAt:now,accountId,deviceId:syntheticIdentity.deviceId,data,cryptoImpl});
          tx.set(sessionRef,envelope);
        });
      }catch(error){providerDenied=s5fPermissionDenied(error);providerErrorCode=s5fErrorCode(error);if(!providerDenied)throw error;}

      const observed=await protocol.readSession({...operation,deviceId:actorIdentity.deviceId,nowEpochMs:base+7});
      const unchanged=Boolean(providerDenied&&observed&&observed.ok===true&&observed.state==="open"&&observed.revision===opened.revision);
      const cleanup=await protocol.revokeSession({...operation,deviceId:actorIdentity.deviceId,nowEpochMs:base+8});
      sessionOpened=false;
      const cleanupTerminal=Boolean(cleanup&&cleanup.ok===true&&cleanup.state==="revoked"),storageUnchanged=before===s5fStorageSnapshot(options.localStorageImpl);
      const evidence={probe:"revoked-device-provider-mutation-denial",accountFingerprint:await s5fFingerprint(accountId,cryptoImpl),rivalryFingerprint:await s5fFingerprint(rivalryId,cryptoImpl),actorDeviceFingerprint:await s5fFingerprint(actorIdentity.deviceId,cryptoImpl),syntheticDeviceFingerprint:await s5fFingerprint(syntheticIdentity.deviceId,cryptoImpl),sessionFingerprint:await s5fFingerprint(sessionId,cryptoImpl),syntheticDeviceRegistered,syntheticDeviceRevoked,applicationAdapterDenied:adapterDenied,applicationAdapterCode:adapter&&adapter.code||null,providerMutationDenied:providerDenied,providerErrorCode,deniedMutationCommitted:false,sessionUnchangedAfterDeniedMutation:unchanged,cleanupTerminal,sacrificialDeviceRetainedRevoked:true,localStorageUnchanged:storageUnchanged,billingRequired:false,blazeRequired:false,firestoreCommittedWritesExpected:4,rjrEligibleEvidenceCandidate:adapterDenied&&providerDenied&&unchanged&&cleanupTerminal&&storageUnchanged};
      if(!adapterDenied)return s5fFail("STAGE5F_REVOKED_DEVICE_ADAPTER_DENIAL_NOT_PROVEN","The normal session adapter did not reject the revoked sacrificial device.",evidence);
      if(!providerDenied)return s5fFail("STAGE5F_REVOKED_DEVICE_PROVIDER_DENIAL_NOT_PROVEN","Production Firestore accepted a protected mutation carrying a revoked device ID. No RJR credit is allowed.",evidence);
      if(!unchanged)return s5fFail("STAGE5F_SESSION_CHANGED_AFTER_DENIAL","The protected session changed despite the expected provider denial.",evidence);
      if(!cleanupTerminal)return s5fFail("STAGE5F_TEST_SESSION_CLEANUP_FAILED","The host could not terminally revoke the short-lived test session.",evidence);
      if(!storageUnchanged)return s5fFail("STAGE5F_LOCAL_STORAGE_CHANGED","The provider-only acceptance probe changed browser storage unexpectedly.",evidence);
      return s5fPass("STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED",evidence);
    }catch(error){return s5fFail(error&&error.code||"STAGE5F_REVOKED_DEVICE_PROBE_FAILED",error&&error.message||"Revoked-device provider acceptance failed.",{syntheticDeviceRegistered,syntheticDeviceRevoked,cleanupAttempted:Boolean(sessionId)});}
    finally{
      if(sessionOpened&&sessionId&&actorIdentity&&protocol){try{await protocol.revokeSession({user:options.user,firestore,firebaseSdk:sdk,deviceId:actorIdentity.deviceId,rivalryId:options.rivalryId,sessionId,cryptoImpl,nowEpochMs:Date.now()});}catch(_error){}}
      if(syntheticRegistered&&!syntheticRevoked&&syntheticIdentity&&actorIdentity&&pairing){try{await pairing.revokeDevice({user:options.user,firestore,firebaseSdk:sdk,identity:actorIdentity,targetDeviceId:syntheticIdentity.deviceId,cryptoImpl,nowEpochMs:Date.now()});}catch(_error){}}
    }
  }

  async function s5fDeniedExactRead(firestore,sdk,reference){try{await sdk.runTransaction(firestore,async tx=>{await tx.get(reference);return true;});return {denied:false,errorCode:null};}catch(error){return {denied:s5fPermissionDenied(error),errorCode:s5fErrorCode(error)};}}
  async function s5fProbeAnyAuthenticatedThirdAccountDenial(options={}){
    try{
      const accountId=s5fUserId(options.user),rivalryId=s5fRivalryId(options.rivalryId);
      if(options.operatorConfirmedThirdAccount!==true)return s5fFail("STAGE5F_THIRD_ACCOUNT_CONFIRMATION_REQUIRED","Confirm that this signed-in Google account is neither manager in the target rivalry.");
      if(options.hostVerifiedRivalryId!==rivalryId&&options.operatorConfirmedActiveRivalry!==true)return s5fFail("STAGE5F_ACTIVE_RIVALRY_CONFIRMATION_REQUIRED","The target must be the active rivalry verified by the host step, or explicitly confirmed active.");
      const firestore=options.firestore,sdk=options.firebaseSdk;if(!firestore||!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function")return s5fFail("STAGE5F_FIRESTORE_RUNTIME_UNAVAILABLE","Firestore read helpers are unavailable.");
      const before=s5fStorageSnapshot(options.localStorageImpl);
      const rivalryRead=await s5fDeniedExactRead(firestore,sdk,sdk.doc(firestore,"rivalries",rivalryId));
      const stateRead=await s5fDeniedExactRead(firestore,sdk,sdk.doc(firestore,"rivalries",rivalryId,"state","authoritative"));
      const storageUnchanged=before===s5fStorageSnapshot(options.localStorageImpl),denied=rivalryRead.denied&&stateRead.denied;
      const evidence={probe:"any-authenticated-third-account-read-denial",accountFingerprint:await s5fFingerprint(accountId,options.cryptoImpl||root.crypto),rivalryFingerprint:await s5fFingerprint(rivalryId,options.cryptoImpl||root.crypto),rivalryReadDenied:rivalryRead.denied,rivalryReadErrorCode:rivalryRead.errorCode,authoritativeStateReadDenied:stateRead.denied,authoritativeStateReadErrorCode:stateRead.errorCode,providerAuthorizationDenied:denied,existingPrivateAccountRequired:false,accountBootstrapAttempted:false,firestoreWritesRequested:0,localStorageUnchanged:storageUnchanged,billingRequired:false,blazeRequired:false,rjrEligibleEvidenceCandidate:denied&&storageUnchanged};
      if(!denied)return s5fFail("STAGE5F_THIRD_ACCOUNT_DENIAL_NOT_PROVEN","Production Rules did not deny both exact private reads for this authenticated third account.",evidence);
      if(!storageUnchanged)return s5fFail("STAGE5F_LOCAL_STORAGE_CHANGED","The read-only third-account probe changed browser storage unexpectedly.",evidence);
      return s5fPass("STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED",evidence);
    }catch(error){return s5fFail(error&&error.code||"STAGE5F_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message||"Third-account provider acceptance failed.");}
  }

  async function s5fBrowserServices(){const runtime=root.CareerModeProductionFirebaseRuntime,pairing=root.CareerModeSparkPrivatePairing,protocol=root.CareerModeSparkStandardAuthPrivateSession;if(!runtime||typeof runtime.ensureAccountServices!=="function")throw Object.assign(new Error("Production Firebase runtime is unavailable."),{code:"STAGE5F_RUNTIME_UNAVAILABLE"});if(!pairing||!protocol)throw Object.assign(new Error("Stage 5F private runtimes are unavailable."),{code:"STAGE5F_PRIVATE_RUNTIME_UNAVAILABLE"});const services=await runtime.ensureAccountServices();if(!services||services.ok!==true)throw Object.assign(new Error("Production Firebase account services are unavailable."),{code:"STAGE5F_ACCOUNT_SERVICES_UNAVAILABLE"});return {pairing,protocol,services};}
  function s5fText(id,text){const el=root.document&&root.document.getElementById(id);if(el)el.textContent=text;}
  function s5fDisabled(id,value){const el=root.document&&root.document.getElementById(id);if(el)el.disabled=Boolean(value);}
  function s5fInput(){return root.document&&root.document.getElementById("authorizationRivalryId");}
  function s5fRecord(result){return {schemaVersion:1,feature:S5F_FEATURE,generatedAt:new Date().toISOString(),applicationVersion:"1.9.0",runtimeRevision:"1.9.0-r5",origin:root.location&&root.location.origin||null,result:result&&result.ok===true?"PASS":"NOT_PROVEN",...result};}
  function s5fRender(result){const record=s5fRecord(result),output=root.document&&root.document.getElementById("authorizationAcceptanceEvidence");if(output)output.textContent=JSON.stringify(record,null,2);s5fText("authorizationAcceptanceStatus",record.result==="PASS"?`${record.code} · sanitized Stage 5F candidate evidence ready`:`NOT PROVEN · ${record.message||record.code} · no RJR credit`);return record;}
  async function s5fResolveHostRivalry(context){const user=context.services.auth.currentUser;if(!user)return s5fFail("STAGE5F_AUTH_REQUIRED","Sign in with the host/manager Google account first.");const pointer=await s5fReadCurrentRivalryPointer({user,pairingApi:context.pairing,indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});if(pointer.ok){const input=s5fInput();if(input)input.value=pointer.rivalryId;s5fText("stage5fRivalryResolution","Current Connected Rivalry loaded from this browser.");}else s5fText("stage5fRivalryResolution",pointer.message||"Current rivalry could not be resolved automatically.");return pointer;}
  async function s5fRunRevokedFromPage(){s5fDisabled("stage5fRevokedDeviceProviderProbe",true);s5fDisabled("stage5fThirdAccountProbe",true);try{const context=await s5fBrowserServices(),user=context.services.auth.currentUser;if(!user)throw Object.assign(new Error("Sign in with the active manager account first."),{code:"STAGE5F_AUTH_REQUIRED"});let rivalryId=s5fInput()?.value||"";if(!S5F_RIVALRY_PATTERN.test(String(rivalryId).trim().toLowerCase())){const pointer=await s5fResolveHostRivalry(context);if(pointer.ok)rivalryId=pointer.rivalryId;}const actorIdentity=await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});const result=await s5fProbeRevokedDeviceProviderDenial({user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,pairingApi:context.pairing,protocolApi:context.protocol,actorIdentity,rivalryId,localStorageImpl:root["local"+"Storage"],indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});if(result.ok){s5fHostVerifiedRivalryId=s5fRivalryId(rivalryId);s5fText("stage5fHostProofState","Host boundary verified. Keep this page open, sign out, then sign in with a third Google account for the zero-write denial.");}return s5fRender(result);}finally{s5fDisabled("stage5fRevokedDeviceProviderProbe",false);s5fDisabled("stage5fThirdAccountProbe",false);}}
  async function s5fRunThirdFromPage(){s5fDisabled("stage5fRevokedDeviceProviderProbe",true);s5fDisabled("stage5fThirdAccountProbe",true);try{const context=await s5fBrowserServices(),user=context.services.auth.currentUser;if(!user)throw Object.assign(new Error("Sign in with the third Google account first."),{code:"STAGE5F_AUTH_REQUIRED"});return s5fRender(await s5fProbeAnyAuthenticatedThirdAccountDenial({user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:s5fInput()?.value||"",hostVerifiedRivalryId:s5fHostVerifiedRivalryId,operatorConfirmedThirdAccount:Boolean(root.document.getElementById("authorizationThirdAccountConfirm")?.checked),operatorConfirmedActiveRivalry:Boolean(root.document.getElementById("authorizationActiveRivalryConfirm")?.checked),localStorageImpl:root["local"+"Storage"],cryptoImpl:root.crypto}));}finally{s5fDisabled("stage5fRevokedDeviceProviderProbe",false);s5fDisabled("stage5fThirdAccountProbe",false);}}
  async function s5fMount(){if(!root.document)return false;const load=root.document.getElementById("stage5fLoadCurrentRivalry"),revoked=root.document.getElementById("stage5fRevokedDeviceProviderProbe"),third=root.document.getElementById("stage5fThirdAccountProbe");if(!load||!revoked||!third)return false;load.addEventListener("click",()=>{void s5fBrowserServices().then(s5fResolveHostRivalry).then(s5fRender).catch(error=>s5fRender(s5fFail(error&&error.code||"STAGE5F_RIVALRY_POINTER_FAILED",error&&error.message||"Current rivalry could not be loaded.")));});revoked.addEventListener("click",()=>{void s5fRunRevokedFromPage().catch(error=>s5fRender(s5fFail(error&&error.code||"STAGE5F_REVOKED_DEVICE_PROBE_FAILED",error&&error.message||"Revoked-device acceptance failed.")));});third.addEventListener("click",()=>{void s5fRunThirdFromPage().catch(error=>s5fRender(s5fFail(error&&error.code||"STAGE5F_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message||"Third-account acceptance failed.")));});return true;}
  if(root.document){const s5fStart=()=>{void s5fMount();};if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",s5fStart,{once:true});else s5fStart();}

  return Object.freeze({contractVersion:1,feature:S5F_FEATURE,billingRequired:false,blazeRequired:false,cloudFunctionsRequired:false,cloudRunRequired:false,productionMutationScope:"sacrificial-device-register-revoke-plus-short-lived-session-and-denied-mutation",thirdAccountWriteScope:0,readCurrentRivalryPointer:s5fReadCurrentRivalryPointer,probeRevokedDeviceProviderDenial:s5fProbeRevokedDeviceProviderDenial,probeAnyAuthenticatedThirdAccountDenial:s5fProbeAnyAuthenticatedThirdAccountDenial,isPermissionDenied:s5fPermissionDenied,fingerprint:s5fFingerprint,mount:s5fMount});
});
