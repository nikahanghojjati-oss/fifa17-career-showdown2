(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStage5fProductionAuthenticatedNegatives=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const S5F_FEATURE="stage5f-production-authenticated-negatives";
  const S5F_RIVALRY=/^pair_[0-9a-f]{64}$/;
  const S5F_DEVICE=/^device_[0-9a-f]{32}$/;
  const S5F_POINTER_DB="careerModeShowdown.connectedRivalry";
  const S5F_POINTER_STORE="bindings";
  let s5fVerifiedRivalry=null;

  function s5fFailure(code,message,extra={}){return Object.freeze({ok:false,feature:S5F_FEATURE,code,message,...extra});}
  function s5fSuccess(code,extra={}){return Object.freeze({ok:true,feature:S5F_FEATURE,code,...extra});}
  function s5fAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)throw Object.assign(new Error("Sign in with Google before running Stage 5F acceptance."),{code:"STAGE5F_AUTH_REQUIRED"});return id;}
  function s5fNormalizeRivalry(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!S5F_RIVALRY.test(id))throw Object.assign(new Error("A valid active Connected Rivalry ID is required."),{code:"STAGE5F_RIVALRY_ID_INVALID"});return id;}
  function s5fDenied(error){const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"",message=error&&typeof error.message==="string"?error.message:"";return code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied"||/missing or insufficient permissions/i.test(message);}
  function s5fStorage(storage){if(!storage||typeof storage.length!=="number"||typeof storage.key!=="function"||typeof storage.getItem!=="function")return null;const rows=[];for(let i=0;i<storage.length;i+=1){const key=storage.key(i);rows.push([key,storage.getItem(key)]);}rows.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));return JSON.stringify(rows);}
  function s5fHex(bytes){return Array.from(bytes,v=>v.toString(16).padStart(2,"0")).join("");}
  async function s5fHash(value,cryptoImpl=root.crypto){if(!cryptoImpl||!cryptoImpl.subtle)return null;const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(String(value??"")));return `sha256:${s5fHex(new Uint8Array(digest))}`;}
  function s5fLiveEnvelope(snapshot,type,id){if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists()||typeof snapshot.data!=="function")return null;const value=snapshot.data();return value&&value.objectType===type&&value.objectId===id&&value.lifecycleState==="live"?value:null;}

  async function s5fReadCurrentRivalryPointer(options={}){
    try{
      const accountId=s5fAccountId(options.user),pairing=options.pairingApi;
      if(!pairing||typeof pairing.getOrCreateDeviceIdentity!=="function")return s5fFailure("STAGE5F_PAIRING_RUNTIME_UNAVAILABLE","Registered-device runtime is unavailable.");
      const identity=options.identity||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl:options.cryptoImpl||root.crypto});
      if(!identity||!S5F_DEVICE.test(identity.deviceId||""))return s5fFailure("STAGE5F_DEVICE_IDENTITY_INVALID","A stable registered browser identity is required.");
      const idb=options.indexedDBImpl||root.indexedDB;if(!idb||typeof idb.open!=="function")return s5fFailure("STAGE5F_POINTER_STORAGE_UNAVAILABLE","Connected Rivalry pointer storage is unavailable.");
      let db=null;
      try{
        db=await new Promise((resolve,reject)=>{const request=idb.open(S5F_POINTER_DB,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Object.assign(new Error("Connected Rivalry pointer storage could not be opened."),{code:"STAGE5F_POINTER_STORAGE_UNAVAILABLE"}));request.onblocked=request.onerror;});
        if(!db.objectStoreNames.contains(S5F_POINTER_STORE))return s5fFailure("STAGE5F_RIVALRY_POINTER_NOT_FOUND","No saved Connected Rivalry pointer exists in this browser.");
        const values=await new Promise((resolve,reject)=>{const request=db.transaction(S5F_POINTER_STORE,"readonly").objectStore(S5F_POINTER_STORE).getAll();request.onsuccess=()=>resolve(Array.isArray(request.result)?request.result:[]);request.onerror=()=>reject(Object.assign(new Error("Connected Rivalry pointers could not be read."),{code:"STAGE5F_POINTER_STORAGE_UNAVAILABLE"}));});
        const matches=values.filter(v=>v&&v.accountId===accountId&&v.deviceId===identity.deviceId&&S5F_RIVALRY.test(v.rivalryId||"")).sort((a,b)=>Number(b.attachedAtEpochMs||0)-Number(a.attachedAtEpochMs||0));
        return matches.length?s5fSuccess("STAGE5F_RIVALRY_POINTER_RESOLVED",{rivalryId:matches[0].rivalryId,deviceId:identity.deviceId}):s5fFailure("STAGE5F_RIVALRY_POINTER_NOT_FOUND","No saved Connected Rivalry pointer matches this account and registered browser.");
      }finally{if(db&&typeof db.close==="function")db.close();}
    }catch(error){return s5fFailure(error&&error.code||"STAGE5F_RIVALRY_POINTER_FAILED",error&&error.message||"Current rivalry could not be resolved.");}
  }

  async function s5fProbeRevoked(options={}){
    const pairing=options.pairingApi,protocol=options.protocolApi,firestore=options.firestore,sdk=options.firebaseSdk,cryptoImpl=options.cryptoImpl||root.crypto;
    let actor=options.actorIdentity||null,synthetic=null,syntheticRegistered=false,syntheticRevoked=false,sessionId=null,sessionOpen=false;
    try{
      const accountId=s5fAccountId(options.user),rivalryId=s5fNormalizeRivalry(options.rivalryId);
      if(!pairing||typeof pairing.getOrCreateDeviceIdentity!=="function"||typeof pairing.generateDeviceIdentity!=="function"||typeof pairing.registerDevice!=="function"||typeof pairing.revokeDevice!=="function")return s5fFailure("STAGE5F_PAIRING_RUNTIME_UNAVAILABLE","Registered-device acceptance helpers are unavailable.");
      if(!protocol||typeof protocol.generateSessionId!=="function"||typeof protocol.openSession!=="function"||typeof protocol.readSession!=="function"||typeof protocol.revokeSession!=="function"||typeof protocol.buildEnvelope!=="function")return s5fFailure("STAGE5F_SESSION_RUNTIME_UNAVAILABLE","Private-session acceptance helpers are unavailable.");
      if(!firestore||!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function"||!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")return s5fFailure("STAGE5F_FIRESTORE_RUNTIME_UNAVAILABLE","Firestore transaction helpers are unavailable.");
      actor=actor||await pairing.getOrCreateDeviceIdentity({indexedDBImpl:options.indexedDBImpl||root.indexedDB,cryptoImpl});
      if(!actor||!S5F_DEVICE.test(actor.deviceId||""))return s5fFailure("STAGE5F_DEVICE_IDENTITY_INVALID","A stable registered browser identity is required.");
      const actorRef=sdk.doc(firestore,"accounts",accountId,"devices",actor.deviceId);
      const actorSnapshot=await sdk.runTransaction(firestore,async tx=>tx.get(actorRef));
      const actorEnvelope=s5fLiveEnvelope(actorSnapshot,"device",actor.deviceId);
      if(!actorEnvelope||!actorEnvelope.data||actorEnvelope.data.state!=="active")return s5fFailure("STAGE5F_ACTIVE_DEVICE_REQUIRED","Run this probe from an already active registered browser. No real browser is revoked by this tool.");

      const before=s5fStorage(options.localStorageImpl),base=Number.isFinite(options.nowEpochMs)?Number(options.nowEpochMs):Date.now();
      synthetic=pairing.generateDeviceIdentity(cryptoImpl,base+1);
      const registration=await pairing.registerDevice({user:options.user,firestore,firebaseSdk:sdk,identity:synthetic,cryptoImpl,nowEpochMs:base+2});
      if(!registration||registration.ok!==true)return s5fFailure("STAGE5F_SYNTHETIC_DEVICE_REGISTRATION_FAILED","The sacrificial test device could not be registered through normal Spark Rules.",{registrationCode:registration&&registration.code||null});
      syntheticRegistered=true;
      const revocation=await pairing.revokeDevice({user:options.user,firestore,firebaseSdk:sdk,identity:actor,targetDeviceId:synthetic.deviceId,cryptoImpl,nowEpochMs:base+3});
      if(!revocation||revocation.ok!==true)return s5fFailure("STAGE5F_SYNTHETIC_DEVICE_REVOCATION_FAILED","The sacrificial device could not be revoked by the active browser.",{revocationCode:revocation&&revocation.code||null});
      syntheticRevoked=true;

      sessionId=protocol.generateSessionId(cryptoImpl);
      const common={user:options.user,firestore,firebaseSdk:sdk,rivalryId,sessionId,cryptoImpl};
      const opened=await protocol.openSession({...common,deviceId:actor.deviceId,nowEpochMs:base+4,ttlMs:300000});
      if(!opened||opened.ok!==true)return s5fFailure("STAGE5F_TEST_SESSION_OPEN_FAILED","A short-lived exact private test session could not be opened.",{openCode:opened&&opened.code||null});
      sessionOpen=true;
      const adapter=await protocol.revokeSession({...common,deviceId:synthetic.deviceId,nowEpochMs:base+5});
      const adapterDenied=Boolean(adapter&&adapter.ok===false&&(adapter.code==="PRIVATE_SESSION_DEVICE_REVOKED"||s5fDenied({code:adapter.code,message:adapter.message})));
      const sessionRef=sdk.doc(firestore,"rivalries",rivalryId,"sessions",sessionId);
      let providerDenied=false,providerErrorCode=null;
      try{
        await sdk.runTransaction(firestore,async tx=>{
          const current=s5fLiveEnvelope(await tx.get(sessionRef),"session",sessionId);
          if(!current||!current.data)throw Object.assign(new Error("The exact Stage 5F test session disappeared."),{code:"STAGE5F_TEST_SESSION_MISSING"});
          const now=sdk.Timestamp.fromMillis(base+6),data={...current.data,state:"revoked",lastActivityAt:now,revokedAt:now};
          const next=await protocol.buildEnvelope({sessionId,revision:current.revision+1,parentRevision:current.revision,priorContentHash:current.contentHash,updatedAt:now,accountId,deviceId:synthetic.deviceId,data,cryptoImpl});
          tx.set(sessionRef,next);
        });
      }catch(error){providerDenied=s5fDenied(error);providerErrorCode=error&&error.code?String(error.code):"unknown";if(!providerDenied)throw error;}
      const observed=await protocol.readSession({...common,deviceId:actor.deviceId,nowEpochMs:base+7});
      const unchanged=Boolean(providerDenied&&observed&&observed.ok===true&&observed.state==="open"&&observed.revision===opened.revision);
      const cleanup=await protocol.revokeSession({...common,deviceId:actor.deviceId,nowEpochMs:base+8});sessionOpen=false;
      const cleanupTerminal=Boolean(cleanup&&cleanup.ok===true&&cleanup.state==="revoked"),storageUnchanged=before===s5fStorage(options.localStorageImpl);
      const evidence={probe:"revoked-device-provider-mutation-denial",accountFingerprint:await s5fHash(accountId,cryptoImpl),rivalryFingerprint:await s5fHash(rivalryId,cryptoImpl),actorDeviceFingerprint:await s5fHash(actor.deviceId,cryptoImpl),syntheticDeviceFingerprint:await s5fHash(synthetic.deviceId,cryptoImpl),sessionFingerprint:await s5fHash(sessionId,cryptoImpl),syntheticDeviceRegistered:syntheticRegistered,syntheticDeviceRevoked:syntheticRevoked,applicationAdapterDenied:adapterDenied,applicationAdapterCode:adapter&&adapter.code||null,providerMutationDenied:providerDenied,providerErrorCode,deniedMutationCommitted:false,sessionUnchangedAfterDeniedMutation:unchanged,cleanupTerminal,sacrificialDeviceRetainedRevoked:true,localStorageUnchanged:storageUnchanged,billingRequired:false,blazeRequired:false,firestoreCommittedWritesExpected:4,rjrEligibleEvidenceCandidate:adapterDenied&&providerDenied&&unchanged&&cleanupTerminal&&storageUnchanged};
      if(!adapterDenied)return s5fFailure("STAGE5F_REVOKED_DEVICE_ADAPTER_DENIAL_NOT_PROVEN","The normal session adapter did not reject the revoked sacrificial device.",evidence);
      if(!providerDenied)return s5fFailure("STAGE5F_REVOKED_DEVICE_PROVIDER_DENIAL_NOT_PROVEN","Production Firestore accepted a protected mutation carrying a revoked device ID.",evidence);
      if(!unchanged)return s5fFailure("STAGE5F_SESSION_CHANGED_AFTER_DENIAL","The protected session changed despite the expected provider denial.",evidence);
      if(!cleanupTerminal)return s5fFailure("STAGE5F_TEST_SESSION_CLEANUP_FAILED","The test session could not be terminally revoked after the negative check.",evidence);
      if(!storageUnchanged)return s5fFailure("STAGE5F_LOCAL_STORAGE_CHANGED","The provider-only acceptance probe changed browser storage unexpectedly.",evidence);
      return s5fSuccess("STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED",evidence);
    }catch(error){return s5fFailure(error&&error.code||"STAGE5F_REVOKED_DEVICE_PROBE_FAILED",error&&error.message||"Revoked-device provider acceptance failed.",{syntheticDeviceRegistered:syntheticRegistered,syntheticDeviceRevoked:syntheticRevoked,cleanupAttempted:Boolean(sessionId)});}
    finally{
      if(sessionOpen&&sessionId&&actor&&protocol){try{await protocol.revokeSession({user:options.user,firestore,firebaseSdk:sdk,deviceId:actor.deviceId,rivalryId:options.rivalryId,sessionId,cryptoImpl,nowEpochMs:Date.now()});}catch(_error){}}
      if(syntheticRegistered&&!syntheticRevoked&&synthetic&&actor&&pairing){try{await pairing.revokeDevice({user:options.user,firestore,firebaseSdk:sdk,identity:actor,targetDeviceId:synthetic.deviceId,cryptoImpl,nowEpochMs:Date.now()});}catch(_error){}}
    }
  }

  async function s5fExactDeniedRead(firestore,sdk,ref){try{await sdk.runTransaction(firestore,async tx=>{await tx.get(ref);});return {denied:false,errorCode:null};}catch(error){return {denied:s5fDenied(error),errorCode:error&&error.code?String(error.code):"unknown"};}}
  async function s5fProbeThird(options={}){
    try{
      const accountId=s5fAccountId(options.user),rivalryId=s5fNormalizeRivalry(options.rivalryId);
      if(options.operatorConfirmedThirdAccount!==true)return s5fFailure("STAGE5F_THIRD_ACCOUNT_CONFIRMATION_REQUIRED","Confirm that this signed-in Google account is neither manager in the target rivalry.");
      if(options.hostVerifiedRivalryId!==rivalryId&&options.operatorConfirmedActiveRivalry!==true)return s5fFailure("STAGE5F_ACTIVE_RIVALRY_CONFIRMATION_REQUIRED","The target must be the active rivalry verified by the host step, or explicitly confirmed active.");
      const firestore=options.firestore,sdk=options.firebaseSdk;if(!firestore||!sdk||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function")return s5fFailure("STAGE5F_FIRESTORE_RUNTIME_UNAVAILABLE","Firestore read helpers are unavailable.");
      const before=s5fStorage(options.localStorageImpl),rivalryRead=await s5fExactDeniedRead(firestore,sdk,sdk.doc(firestore,"rivalries",rivalryId)),stateRead=await s5fExactDeniedRead(firestore,sdk,sdk.doc(firestore,"rivalries",rivalryId,"state","authoritative")),storageUnchanged=before===s5fStorage(options.localStorageImpl),denied=rivalryRead.denied&&stateRead.denied;
      const evidence={probe:"any-authenticated-third-account-read-denial",accountFingerprint:await s5fHash(accountId,options.cryptoImpl||root.crypto),rivalryFingerprint:await s5fHash(rivalryId,options.cryptoImpl||root.crypto),rivalryReadDenied:rivalryRead.denied,rivalryReadErrorCode:rivalryRead.errorCode,authoritativeStateReadDenied:stateRead.denied,authoritativeStateReadErrorCode:stateRead.errorCode,providerAuthorizationDenied:denied,existingPrivateAccountRequired:false,accountBootstrapAttempted:false,firestoreWritesRequested:0,localStorageUnchanged:storageUnchanged,billingRequired:false,blazeRequired:false,rjrEligibleEvidenceCandidate:denied&&storageUnchanged};
      if(!denied)return s5fFailure("STAGE5F_THIRD_ACCOUNT_DENIAL_NOT_PROVEN","Production Rules did not deny both exact private reads for this authenticated third account.",evidence);
      if(!storageUnchanged)return s5fFailure("STAGE5F_LOCAL_STORAGE_CHANGED","The read-only third-account probe changed browser storage unexpectedly.",evidence);
      return s5fSuccess("STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED",evidence);
    }catch(error){return s5fFailure(error&&error.code||"STAGE5F_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message||"Third-account provider acceptance failed.");}
  }

  async function s5fServices(){const runtime=root.CareerModeProductionFirebaseRuntime,pairing=root.CareerModeSparkPrivatePairing,protocol=root.CareerModeSparkStandardAuthPrivateSession;if(!runtime||typeof runtime.ensureAccountServices!=="function")throw Object.assign(new Error("Production Firebase runtime is unavailable."),{code:"STAGE5F_RUNTIME_UNAVAILABLE"});if(!pairing||!protocol)throw Object.assign(new Error("Stage 5F private runtimes are unavailable."),{code:"STAGE5F_PRIVATE_RUNTIME_UNAVAILABLE"});const services=await runtime.ensureAccountServices();if(!services||services.ok!==true)throw Object.assign(new Error("Production Firebase account services are unavailable."),{code:"STAGE5F_ACCOUNT_SERVICES_UNAVAILABLE"});return {pairing,protocol,services};}
  function s5fSetText(id,text){const el=root.document&&root.document.getElementById(id);if(el)el.textContent=text;}
  function s5fSetDisabled(id,value){const el=root.document&&root.document.getElementById(id);if(el)el.disabled=Boolean(value);}
  function s5fRivalryInput(){return root.document&&root.document.getElementById("authorizationRivalryId");}
  function s5fRender(result){const record={schemaVersion:1,feature:S5F_FEATURE,generatedAt:new Date().toISOString(),applicationVersion:"1.9.0",runtimeRevision:"1.9.0-r5",origin:root.location&&root.location.origin||null,result:result&&result.ok===true?"PASS":"NOT_PROVEN",...result},output=root.document&&root.document.getElementById("authorizationAcceptanceEvidence");if(output)output.textContent=JSON.stringify(record,null,2);s5fSetText("authorizationAcceptanceStatus",record.result==="PASS"?`${record.code} · sanitized Stage 5F candidate evidence ready`:`NOT PROVEN · ${record.message||record.code} · no RJR credit`);return record;}
  async function s5fResolve(context){const user=context.services.auth.currentUser;if(!user)return s5fFailure("STAGE5F_AUTH_REQUIRED","Sign in with the manager account first.");const pointer=await s5fReadCurrentRivalryPointer({user,pairingApi:context.pairing,indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});if(pointer.ok){const input=s5fRivalryInput();if(input)input.value=pointer.rivalryId;s5fSetText("stage5fRivalryResolution","Current Connected Rivalry loaded from this browser.");}else s5fSetText("stage5fRivalryResolution",pointer.message||"Current rivalry could not be resolved automatically.");return pointer;}
  async function s5fRunRevoked(){s5fSetDisabled("stage5fRevokedDeviceProviderProbe",true);s5fSetDisabled("stage5fThirdAccountProbe",true);try{const context=await s5fServices(),user=context.services.auth.currentUser;if(!user)throw Object.assign(new Error("Sign in with the active manager account first."),{code:"STAGE5F_AUTH_REQUIRED"});let rivalryId=s5fRivalryInput()?.value||"";if(!S5F_RIVALRY.test(String(rivalryId).trim().toLowerCase())){const pointer=await s5fResolve(context);if(pointer.ok)rivalryId=pointer.rivalryId;}const actor=await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});const result=await s5fProbeRevoked({user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,pairingApi:context.pairing,protocolApi:context.protocol,actorIdentity:actor,rivalryId,localStorageImpl:root["local"+"Storage"],indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});if(result.ok){s5fVerifiedRivalry=s5fNormalizeRivalry(rivalryId);s5fSetText("stage5fHostProofState","Host boundary verified. Keep this page open, sign out, then sign in with a third Google account.");}return s5fRender(result);}finally{s5fSetDisabled("stage5fRevokedDeviceProviderProbe",false);s5fSetDisabled("stage5fThirdAccountProbe",false);}}
  async function s5fRunThird(){s5fSetDisabled("stage5fRevokedDeviceProviderProbe",true);s5fSetDisabled("stage5fThirdAccountProbe",true);try{const context=await s5fServices(),user=context.services.auth.currentUser;if(!user)throw Object.assign(new Error("Sign in with the third Google account first."),{code:"STAGE5F_AUTH_REQUIRED"});return s5fRender(await s5fProbeThird({user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:s5fRivalryInput()?.value||"",hostVerifiedRivalryId:s5fVerifiedRivalry,operatorConfirmedThirdAccount:Boolean(root.document.getElementById("authorizationThirdAccountConfirm")?.checked),operatorConfirmedActiveRivalry:Boolean(root.document.getElementById("authorizationActiveRivalryConfirm")?.checked),localStorageImpl:root["local"+"Storage"],cryptoImpl:root.crypto}));}finally{s5fSetDisabled("stage5fRevokedDeviceProviderProbe",false);s5fSetDisabled("stage5fThirdAccountProbe",false);}}
  async function s5fMount(){if(!root.document)return false;const load=root.document.getElementById("stage5fLoadCurrentRivalry"),revoked=root.document.getElementById("stage5fRevokedDeviceProviderProbe"),third=root.document.getElementById("stage5fThirdAccountProbe");if(!load||!revoked||!third)return false;load.addEventListener("click",()=>{void s5fServices().then(s5fResolve).then(s5fRender).catch(error=>s5fRender(s5fFailure(error&&error.code||"STAGE5F_RIVALRY_POINTER_FAILED",error&&error.message||"Current rivalry could not be loaded.")));});revoked.addEventListener("click",()=>{void s5fRunRevoked().catch(error=>s5fRender(s5fFailure(error&&error.code||"STAGE5F_REVOKED_DEVICE_PROBE_FAILED",error&&error.message||"Revoked-device acceptance failed.")));});third.addEventListener("click",()=>{void s5fRunThird().catch(error=>s5fRender(s5fFailure(error&&error.code||"STAGE5F_THIRD_ACCOUNT_PROBE_FAILED",error&&error.message||"Third-account acceptance failed.")));});return true;}
  if(root.document){const s5fBoot=()=>{void s5fMount();};if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",s5fBoot,{once:true});else s5fBoot();}

  return Object.freeze({contractVersion:1,feature:S5F_FEATURE,billingRequired:false,blazeRequired:false,cloudFunctionsRequired:false,cloudRunRequired:false,productionMutationScope:"sacrificial-device-register-revoke-plus-short-lived-session-and-denied-mutation",thirdAccountWriteScope:0,readCurrentRivalryPointer:s5fReadCurrentRivalryPointer,probeRevokedDeviceProviderDenial:s5fProbeRevoked,probeAnyAuthenticatedThirdAccountDenial:s5fProbeThird,isPermissionDenied:s5fDenied,fingerprint:s5fHash,mount:s5fMount});
});
