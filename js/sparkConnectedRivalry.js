(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkConnectedRivalry=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const CR_POINTER_DB_NAME="careerModeShowdown.connectedRivalry";
  const CR_POINTER_DB_VERSION=1;
  const CR_POINTER_STORE_NAME="bindings";
  const CR_POINTER_SCHEMA_VERSION=1;
  const CR_IDEMPOTENCY_TTL_MS=7*24*60*60*1000;
  const CR_PANEL_ID="sparkConnectedRivalryPanel";
  const CR_SETTINGS_CONTENT_ID="settingsContent";
  const CR_SETTINGS_OVERLAY_ID="settingsOverlay";
  const CR_MANAGER_ROLES=Object.freeze(["playerOne","playerTwo"]);
  const CR_CANONICAL_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);

  let crState=Object.freeze({
    status:"idle",
    initialized:false,
    busy:false,
    connected:false,
    attached:false,
    rivalryId:null,
    accountId:null,
    deviceId:null,
    binding:null,
    observedExists:false,
    observedRevision:null,
    observedContentHash:null,
    observedEnvelope:null,
    observedTombstone:false,
    reconciliationPreviewReady:false,
    previewRevision:null,
    previewContentHash:null,
    previewSaveId:null,
    localCommitRevision:null,
    localCommitContentHash:null,
    localCommitSaveId:null,
    message:"Connected Rivalry is available after private pairing. Local saves remain the recovery authority."
  });
  let crInitializePromise=null;
  let crSettingsObserver=null;
  let crAccountUnsubscribe=null;
  let crPairingUnsubscribe=null;
  let crReconciliationIntent=null;
  const crListeners=new Set();

  function crFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(crFreeze);
    return value;
  }

  function crSetState(next){
    crState=crFreeze({...crState,...next});
    for(const listener of crListeners){try{listener(crState);}catch(_error){}}
    crRenderPanel();
    return crState;
  }

  function crError(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function crResultError(error,fallbackCode="CONNECTED_RIVALRY_FAILED"){
    return {
      ok:false,
      code:error&&typeof error.code==="string"?error.code:fallbackCode,
      message:error&&error.message?error.message:"The Connected Rivalry operation could not be completed."
    };
  }

  function crClone(value){
    if(value===undefined)return undefined;
    if(typeof structuredClone==="function"){
      try{return structuredClone(value);}catch(_error){}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function crCanonicalize(value){
    if(value===undefined)return null;
    if(value===null)return null;
    if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
    if(value instanceof Date)return {$timestamp:value.getTime()};
    if(Array.isArray(value))return value.map(crCanonicalize);
    if(typeof value==="object"){
      const output={};
      for(const key of Object.keys(value).sort())output[key]=crCanonicalize(value[key]);
      return output;
    }
    return value;
  }

  function crHex(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
  }

  async function crSha256(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function"){
      throw crError("CONNECTED_RIVALRY_CRYPTO_UNAVAILABLE","Secure SHA-256 support is unavailable.");
    }
    const bytes=new TextEncoder().encode(JSON.stringify(crCanonicalize(value)));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${crHex(new Uint8Array(digest))}`;
  }

  async function crSha256Raw(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function"){
      throw crError("CONNECTED_RIVALRY_CRYPTO_UNAVAILABLE","Secure SHA-256 support is unavailable.");
    }
    const bytes=new TextEncoder().encode(String(value));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return crHex(new Uint8Array(digest));
  }

  function crRandomKey(cryptoImpl=root.crypto){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function"){
      throw crError("CONNECTED_RIVALRY_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    }
    const bytes=new Uint8Array(32);
    cryptoImpl.getRandomValues(bytes);
    return `mutation_${crHex(bytes)}`;
  }

  function crNormalizeRivalryId(value){
    const rivalryId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^pair_[0-9a-f]{64}$/.test(rivalryId)){
      throw crError("CONNECTED_RIVALRY_ID_INVALID","Enter the exact private rivalry code created during pairing.");
    }
    return rivalryId;
  }

  function crNormalizeBinding(binding){
    const source=binding&&typeof binding==="object"?binding:{};
    const saveId=typeof source.saveId==="string"?source.saveId.trim():"";
    const profileId=typeof source.profileId==="string"?source.profileId.trim():"";
    const managerRole=typeof source.managerRole==="string"?source.managerRole.trim():"";
    const displayLabel=typeof source.displayLabel==="string"?source.displayLabel.trim().slice(0,80):"";
    if(!/^save_[0-9a-f]{24}$/.test(saveId))throw crError("CONNECTED_RIVALRY_SAVE_REQUIRED","Choose a local Showdown with a stable Save Library identity.");
    if(!/^profile_[0-9a-f]{24}$/.test(profileId))throw crError("CONNECTED_RIVALRY_PROFILE_REQUIRED","Choose a manager with a stable Local Profile identity.");
    if(!CR_MANAGER_ROLES.includes(managerRole))throw crError("CONNECTED_RIVALRY_ROLE_REQUIRED","Choose Player One or Player Two.");
    return Object.freeze({saveId,profileId,managerRole,displayLabel:displayLabel||null});
  }

  function crNormalizeAccountId(user){
    const accountId=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!accountId)throw crError("CONNECTED_RIVALRY_AUTH_REQUIRED","Sign in to the paired private account first.");
    return accountId;
  }

  function crValidateSdk(firestore,firebaseSdk){
    if(!firestore)throw crError("CONNECTED_RIVALRY_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    for(const name of ["doc","runTransaction"]){
      if(!firebaseSdk||typeof firebaseSdk[name]!=="function"){
        throw crError("CONNECTED_RIVALRY_FIRESTORE_UNAVAILABLE",`Private Firestore SDK method unavailable: ${name}.`);
      }
    }
    if(!firebaseSdk.Timestamp||typeof firebaseSdk.Timestamp.fromMillis!=="function"){
      throw crError("CONNECTED_RIVALRY_FIRESTORE_UNAVAILABLE","Firestore Timestamp support is unavailable.");
    }
  }

  function crPointerKey(accountId,binding){
    return `${accountId}|${binding.saveId}|${binding.managerRole}`;
  }

  function crValidPointer(value){
    return Boolean(
      value
      && value.schemaVersion===CR_POINTER_SCHEMA_VERSION
      && typeof value.accountId==="string"
      && /^pair_[0-9a-f]{64}$/.test(value.rivalryId||"")
      && /^save_[0-9a-f]{24}$/.test(value.saveId||"")
      && /^profile_[0-9a-f]{24}$/.test(value.profileId||"")
      && CR_MANAGER_ROLES.includes(value.managerRole)
      && /^device_[0-9a-f]{32}$/.test(value.deviceId||"")
      && Number.isFinite(value.attachedAtEpochMs)
      && value.attachedAtEpochMs>0
    );
  }

  function crOpenPointerDb(indexedDBImpl=root.indexedDB){
    if(!indexedDBImpl||typeof indexedDBImpl.open!=="function"){
      return Promise.reject(crError("CONNECTED_RIVALRY_POINTER_UNAVAILABLE","Private connected-rivalry pointer storage is unavailable in this browser."));
    }
    return new Promise((resolve,reject)=>{
      const request=indexedDBImpl.open(CR_POINTER_DB_NAME,CR_POINTER_DB_VERSION);
      request.onupgradeneeded=()=>{
        const database=request.result;
        if(!database.objectStoreNames.contains(CR_POINTER_STORE_NAME))database.createObjectStore(CR_POINTER_STORE_NAME);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(crError("CONNECTED_RIVALRY_POINTER_UNAVAILABLE","Private connected-rivalry pointer storage could not be opened."));
      request.onblocked=()=>reject(crError("CONNECTED_RIVALRY_POINTER_UNAVAILABLE","Private connected-rivalry pointer storage is blocked by another browser context."));
    });
  }

  async function crStorePointer(pointer,indexedDBImpl=root.indexedDB){
    if(!crValidPointer(pointer))throw crError("CONNECTED_RIVALRY_POINTER_INVALID","Refusing to store an invalid Connected Rivalry pointer.");
    let database;
    try{
      database=await crOpenPointerDb(indexedDBImpl);
      await new Promise((resolve,reject)=>{
        const transaction=database.transaction(CR_POINTER_STORE_NAME,"readwrite");
        transaction.objectStore(CR_POINTER_STORE_NAME).put({...pointer},crPointerKey(pointer.accountId,pointer));
        transaction.oncomplete=()=>resolve();
        transaction.onerror=()=>reject(crError("CONNECTED_RIVALRY_POINTER_UNAVAILABLE","Private Connected Rivalry pointer could not be stored."));
        transaction.onabort=()=>reject(crError("CONNECTED_RIVALRY_POINTER_UNAVAILABLE","Private Connected Rivalry pointer storage was aborted."));
      });
      return Object.freeze({...pointer});
    }finally{
      if(database&&typeof database.close==="function")database.close();
    }
  }

  async function crLoadPointer(accountId,binding,indexedDBImpl=root.indexedDB){
    let database;
    try{
      database=await crOpenPointerDb(indexedDBImpl);
      const result=await new Promise((resolve,reject)=>{
        const transaction=database.transaction(CR_POINTER_STORE_NAME,"readonly");
        const request=transaction.objectStore(CR_POINTER_STORE_NAME).get(crPointerKey(accountId,binding));
        request.onsuccess=()=>resolve(request.result===undefined?null:request.result);
        request.onerror=()=>reject(crError("CONNECTED_RIVALRY_POINTER_UNAVAILABLE","Private Connected Rivalry pointer could not be read."));
      });
      if(result===null)return null;
      if(!crValidPointer(result))throw crError("CONNECTED_RIVALRY_POINTER_INVALID","Stored Connected Rivalry metadata is invalid and will not grant authority.");
      return Object.freeze({...result});
    }finally{
      if(database&&typeof database.close==="function")database.close();
    }
  }

  function crIsEnvelopeValue(value,objectType,objectId){
    return Boolean(
      value
      && value.schemaVersion===1
      && value.objectType===objectType
      && value.objectId===objectId
      && Number.isInteger(value.revision)
      && value.revision>=0
      && typeof value.lifecycleState==="string"
    );
  }

  function crAssertActiveDeviceValue(value,deviceId){
    if(!crIsEnvelopeValue(value,"device",deviceId))throw crError("CONNECTED_RIVALRY_DEVICE_NOT_REGISTERED","This browser is not a registered private device.");
    if(!value.data||value.data.deviceId!==deviceId)throw crError("CONNECTED_RIVALRY_DEVICE_CONFLICT","Registered device identity does not match this browser.");
    if(value.data.state==="revoked")throw crError("CONNECTED_RIVALRY_DEVICE_REVOKED","This registered device has been revoked. Local Career Mode remains available.");
    if(value.data.state!=="active")throw crError("CONNECTED_RIVALRY_DEVICE_CONFLICT","Registered device state is invalid.");
    return value;
  }

  function crAssertActiveRivalryValue(value,rivalryId,accountId,binding){
    if(!crIsEnvelopeValue(value,"rivalry",rivalryId)||value.lifecycleState!=="live"){
      throw crError("CONNECTED_RIVALRY_NOT_FOUND","The exact private rivalry is unavailable.");
    }
    const data=value.data||{};
    const slots=Array.isArray(data.managerSlots)?data.managerSlots:[];
    const authorized=Array.isArray(data.authorizedAccountIds)?data.authorizedAccountIds:[];
    if(data.connectionState!=="active"||slots.length!==2||authorized.length!==2||!authorized.includes(accountId)){
      throw crError("CONNECTED_RIVALRY_NOT_ACTIVE","This private rivalry is not an active exactly-two-manager connection.");
    }
    const slot=slots.find(item=>item&&item.slotId===binding.managerRole);
    if(!slot||slot.accountId!==accountId||slot.profileId!==binding.profileId||slot.saveId!==binding.saveId||slot.entitlementState!=="active"){
      throw crError("CONNECTED_RIVALRY_BINDING_MISMATCH","The selected local manager identity does not match this paired rivalry.");
    }
    return value;
  }

  function crRemoteManagerBindings(rivalryValue){
    const slots=rivalryValue&&rivalryValue.data&&Array.isArray(rivalryValue.data.managerSlots)?rivalryValue.data.managerSlots:[];
    if(slots.length!==2)throw crError("CONNECTED_RIVALRY_BINDING_INVALID","The paired rivalry does not contain exactly two manager slots.");
    const ordered=CR_MANAGER_ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||typeof slot.profileId!=="string"))throw crError("CONNECTED_RIVALRY_BINDING_INVALID","Paired manager identities are incomplete.");
    return ordered.map(slot=>Object.freeze({slotId:slot.slotId,profileId:slot.profileId}));
  }

  function crRemoteSaveId(rivalryValue){
    const data=rivalryValue&&rivalryValue.data?rivalryValue.data:{};
    const slots=Array.isArray(data.managerSlots)?data.managerSlots:[];
    const creator=slots.find(slot=>slot&&slot.accountId===data.createdByAccountId);
    if(!creator||!/^save_[0-9a-f]{24}$/.test(creator.saveId||"")){
      throw crError("CONNECTED_RIVALRY_SHARED_SAVE_INVALID","The paired rivalry has no valid shared Save identity.");
    }
    return creator.saveId;
  }

  function crFindActiveSave(binding,saveRuntime=root.CareerModeSaveLibraryRuntime){
    if(!saveRuntime||typeof saveRuntime.getLibrarySnapshot!=="function"||typeof saveRuntime.isReady!=="function"||saveRuntime.isReady()!==true){
      throw crError("CONNECTED_RIVALRY_SAVE_LIBRARY_UNAVAILABLE","Save Library is not ready.");
    }
    const library=saveRuntime.getLibrarySnapshot();
    if(!library||library.activeSaveId!==binding.saveId||!Array.isArray(library.saves)){
      throw crError("CONNECTED_RIVALRY_ACTIVE_SAVE_REQUIRED","Select the same active local Showdown that is paired to this manager.");
    }
    const entry=library.saves.find(item=>item&&item.saveId===binding.saveId);
    if(!entry||!entry.showdown)throw crError("CONNECTED_RIVALRY_ACTIVE_SAVE_REQUIRED","The paired local Showdown is unavailable.");
    return {library,entry};
  }

  function crBuildProjection(rivalryValue,binding,saveRuntime=root.CareerModeSaveLibraryRuntime){
    const {entry}=crFindActiveSave(binding,saveRuntime);
    const payload=crClone(entry.showdown);
    const sharedSaveId=crRemoteSaveId(rivalryValue);
    const managerBindings=crRemoteManagerBindings(rivalryValue);
    const managerProfileIds=Object.fromEntries(managerBindings.map(item=>[item.slotId,item.profileId]));
    payload.identity={
      ...(payload&&payload.identity&&typeof payload.identity==="object"?payload.identity:{}),
      schemaVersion:1,
      saveId:sharedSaveId,
      managerProfileIds
    };
    const rounds=Array.isArray(payload.rounds)?payload.rounds:[];
    const seasonIds=rounds
      .map(round=>round&&typeof round.seasonId==="string"?round.seasonId.trim():"")
      .filter(value=>/^season_[0-9a-f]{24}$/.test(value));
    const currentRound=Number(payload.currentRound);
    const activeRound=rounds.find(round=>round&&Number(round.roundNumber)===currentRound);
    const activeSeasonId=activeRound&&typeof activeRound.seasonId==="string"&&/^season_[0-9a-f]{24}$/.test(activeRound.seasonId)
      ? activeRound.seasonId
      : null;
    return {
      saveId:sharedSaveId,
      managerBindings,
      seasonIds,
      activeSeasonId,
      payloadFormatVersion:1,
      payload
    };
  }

  async function crBuildEnvelope({objectType,objectId,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){
    const contentHash=await crSha256({objectType,objectId,revision,data},cryptoImpl);
    return {
      schemaVersion:1,
      objectType,
      objectId,
      revision,
      parentRevision,
      lifecycleState:"live",
      contentHash,
      priorContentHash,
      updatedAt,
      updatedByAccountId,
      updatedByDeviceId,
      data,
      tombstone:null
    };
  }

  async function crAssertLiveSharedStateIntegrity(value,rivalryId,cryptoImpl=root.crypto){
    if(!crIsEnvelopeValue(value,"sharedState",rivalryId)||value.lifecycleState!=="live"||typeof value.contentHash!=="string"||!/^sha256:[0-9a-f]{64}$/.test(value.contentHash)){
      throw crError("CONNECTED_RIVALRY_STATE_INVALID","Authoritative shared gameplay state is invalid.");
    }
    const expected=await crSha256({objectType:"sharedState",objectId:rivalryId,revision:value.revision,data:value.data},cryptoImpl);
    if(expected!==value.contentHash)throw crError("CONNECTED_RIVALRY_STATE_INTEGRITY_FAILED","Authoritative shared gameplay state failed SHA-256 integrity verification.");
    return value;
  }

  async function crBuildMutationPlan({rivalryId,rivalryValue,binding,accountId,deviceId,expectedStateExists,baseRevision,idempotencyKey,saveRuntime,cryptoImpl=root.crypto}){
    const normalizedRivalryId=crNormalizeRivalryId(rivalryId);
    const normalizedBinding=crNormalizeBinding(binding);
    const expected=Boolean(expectedStateExists);
    if(!Number.isInteger(baseRevision)||baseRevision<0)throw crError("CONNECTED_RIVALRY_BASE_REVISION_INVALID","A non-negative immutable base revision is required.");
    if(!expected&&baseRevision!==0)throw crError("CONNECTED_RIVALRY_BASE_REVISION_INVALID","Initial shared-state publication must use base revision 0.");
    const projection=crBuildProjection(rivalryValue,normalizedBinding,saveRuntime);
    const operation=expected?"update":"create";
    const rawKey=typeof idempotencyKey==="string"&&idempotencyKey.trim()?idempotencyKey.trim():crRandomKey(cryptoImpl);
    const idempotencyKeyHash=await crSha256Raw(rawKey,cryptoImpl);
    const requestFingerprint=await crSha256({
      operation,
      objectType:"sharedState",
      objectId:normalizedRivalryId,
      deviceId,
      baseRevision,
      payload:projection
    },cryptoImpl);
    return crFreeze({
      rivalryId:normalizedRivalryId,
      binding:normalizedBinding,
      accountId,
      deviceId,
      expectedStateExists:expected,
      baseRevision,
      operation,
      idempotencyKey:rawKey,
      idempotencyKeyHash,
      requestFingerprint,
      projection
    });
  }

  async function crResolveContext(options={}){
    const account=options.accountRuntime||root.CareerModeSparkConnectedAccount;
    const pairing=options.pairingRuntime||root.CareerModeSparkPrivatePairing;
    const runtime=options.runtime||root.CareerModeProductionFirebaseRuntime;
    if(!account||typeof account.getState!=="function"||!runtime||typeof runtime.ensureAccountServices!=="function"){
      throw crError("CONNECTED_RIVALRY_ACCOUNT_UNAVAILABLE","Connected account runtime is unavailable.");
    }
    if(typeof account.initialize==="function")await account.initialize();
    if(pairing&&typeof pairing.initialize==="function")await pairing.initialize();
    const accountState=account.getState();
    const pairingState=pairing&&typeof pairing.getState==="function"?pairing.getState():null;
    if(!accountState||accountState.connected!==true||!accountState.accountId){
      throw crError("CONNECTED_RIVALRY_AUTH_REQUIRED","Sign in to the paired private account first.");
    }
    if(!pairingState||pairingState.registered!==true||!pairingState.deviceId){
      throw crError("CONNECTED_RIVALRY_DEVICE_NOT_REGISTERED","Register this browser privately before using Connected Rivalry.");
    }
    const services=options.services||await runtime.ensureAccountServices();
    if(!services||services.ok!==true)throw crError("CONNECTED_RIVALRY_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    const user=options.user||services.auth.currentUser;
    const accountId=crNormalizeAccountId(user);
    if(accountId!==accountState.accountId)throw crError("CONNECTED_RIVALRY_AUTH_CONFLICT","Connected account identity changed.");
    return {accountState,pairingState,services,user,accountId,deviceId:pairingState.deviceId};
  }

  async function crAttachRivalry(options={}){
    try{
      const binding=crNormalizeBinding(options.binding);
      const rivalryId=crNormalizeRivalryId(options.rivalryId);
      const accountId=crNormalizeAccountId(options.user);
      const deviceId=String(options.deviceId||"");
      if(!/^device_[0-9a-f]{32}$/.test(deviceId))throw crError("CONNECTED_RIVALRY_DEVICE_NOT_REGISTERED","A registered private device is required.");
      crValidateSdk(options.firestore,options.firebaseSdk);
      const deviceRef=options.firebaseSdk.doc(options.firestore,"accounts",accountId,"devices",deviceId);
      const rivalryRef=options.firebaseSdk.doc(options.firestore,"rivalries",rivalryId);
      await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceRef);
        const rivalrySnapshot=await transaction.get(rivalryRef);
        crAssertActiveDeviceValue(deviceSnapshot.exists()?deviceSnapshot.data():null,deviceId);
        crAssertActiveRivalryValue(rivalrySnapshot.exists()?rivalrySnapshot.data():null,rivalryId,accountId,binding);
      });
      const pointer=Object.freeze({
        schemaVersion:CR_POINTER_SCHEMA_VERSION,
        accountId,
        rivalryId,
        saveId:binding.saveId,
        profileId:binding.profileId,
        managerRole:binding.managerRole,
        deviceId,
        attachedAtEpochMs:Number(options.nowEpochMs===undefined?Date.now():options.nowEpochMs)
      });
      if(options.persistPointer!==false)await crStorePointer(pointer,options.indexedDBImpl||root.indexedDB);
      return {ok:true,status:"attached",rivalryId,pointer};
    }catch(error){
      return crResultError(error,"CONNECTED_RIVALRY_ATTACH_FAILED");
    }
  }

  async function crReadSharedState(options={}){
    try{
      const binding=crNormalizeBinding(options.binding);
      const rivalryId=crNormalizeRivalryId(options.rivalryId);
      const accountId=crNormalizeAccountId(options.user);
      const deviceId=String(options.deviceId||"");
      crValidateSdk(options.firestore,options.firebaseSdk);
      const deviceRef=options.firebaseSdk.doc(options.firestore,"accounts",accountId,"devices",deviceId);
      const rivalryRef=options.firebaseSdk.doc(options.firestore,"rivalries",rivalryId);
      const stateRef=options.firebaseSdk.doc(options.firestore,"rivalries",rivalryId,"state","authoritative");
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceRef);
        const rivalrySnapshot=await transaction.get(rivalryRef);
        const stateSnapshot=await transaction.get(stateRef);
        crAssertActiveDeviceValue(deviceSnapshot.exists()?deviceSnapshot.data():null,deviceId);
        const rivalryValue=crAssertActiveRivalryValue(rivalrySnapshot.exists()?rivalrySnapshot.data():null,rivalryId,accountId,binding);
        if(!stateSnapshot.exists())return {ok:true,status:"empty",exists:false,tombstoned:false,revision:null,contentHash:null,rivalryValue};
        const stateValue=stateSnapshot.data();
        if(stateValue&&stateValue.lifecycleState==="tombstoned"){
          return {ok:true,status:"tombstoned",exists:true,tombstoned:true,revision:Number.isInteger(stateValue.revision)?stateValue.revision:null,contentHash:null,rivalryValue};
        }
        await crAssertLiveSharedStateIntegrity(stateValue,rivalryId,options.cryptoImpl||root.crypto);
        return {ok:true,status:"live",exists:true,tombstoned:false,revision:stateValue.revision,contentHash:stateValue.contentHash,envelope:crClone(stateValue),rivalryValue};
      });
    }catch(error){
      return crResultError(error,"CONNECTED_RIVALRY_READ_FAILED");
    }
  }

  async function crPublishSharedState(options={}){
    try{
      const binding=crNormalizeBinding(options.binding);
      const rivalryId=crNormalizeRivalryId(options.rivalryId);
      const accountId=crNormalizeAccountId(options.user);
      const deviceId=String(options.deviceId||"");
      if(!/^device_[0-9a-f]{32}$/.test(deviceId))throw crError("CONNECTED_RIVALRY_DEVICE_NOT_REGISTERED","A registered private device is required.");
      crValidateSdk(options.firestore,options.firebaseSdk);
      const deviceRef=options.firebaseSdk.doc(options.firestore,"accounts",accountId,"devices",deviceId);
      const rivalryRef=options.firebaseSdk.doc(options.firestore,"rivalries",rivalryId);
      const stateRef=options.firebaseSdk.doc(options.firestore,"rivalries",rivalryId,"state","authoritative");

      const preflight=await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceRef);
        const rivalrySnapshot=await transaction.get(rivalryRef);
        crAssertActiveDeviceValue(deviceSnapshot.exists()?deviceSnapshot.data():null,deviceId);
        return crAssertActiveRivalryValue(rivalrySnapshot.exists()?rivalrySnapshot.data():null,rivalryId,accountId,binding);
      });

      const plan=await crBuildMutationPlan({
        rivalryId,
        rivalryValue:preflight,
        binding,
        accountId,
        deviceId,
        expectedStateExists:options.expectedStateExists,
        baseRevision:options.baseRevision,
        idempotencyKey:options.idempotencyKey,
        saveRuntime:options.saveRuntime,
        cryptoImpl:options.cryptoImpl||root.crypto
      });
      const receiptRef=options.firebaseSdk.doc(options.firestore,"rivalries",rivalryId,"state","authoritative","idempotency",plan.idempotencyKeyHash);

      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceRef);
        const rivalrySnapshot=await transaction.get(rivalryRef);
        const receiptSnapshot=await transaction.get(receiptRef);
        const stateSnapshot=await transaction.get(stateRef);
        crAssertActiveDeviceValue(deviceSnapshot.exists()?deviceSnapshot.data():null,deviceId);
        crAssertActiveRivalryValue(rivalrySnapshot.exists()?rivalrySnapshot.data():null,rivalryId,accountId,binding);

        if(receiptSnapshot.exists()){
          const receiptValue=receiptSnapshot.data();
          const data=receiptValue&&receiptValue.data?receiptValue.data:{};
          if(
            crIsEnvelopeValue(receiptValue,"idempotency",plan.idempotencyKeyHash)
            && data.requestFingerprint===plan.requestFingerprint
            && data.baseRevision===plan.baseRevision
            && data.actorAccountId===accountId
            && data.deviceId===deviceId
            && data.resultStatus==="accepted"
          ){
            return {
              ok:true,
              status:"replayed",
              replayed:true,
              revision:data.acceptedRevision,
              contentHash:data.resultContentHash,
              idempotencyKey:plan.idempotencyKey
            };
          }
          throw crError("IDEMPOTENCY_CONFLICT","This mutation key was already used for a different request.");
        }

        const stateExists=stateSnapshot.exists();
        if(stateExists!==plan.expectedStateExists){
          const current=stateExists?stateSnapshot.data():null;
          const error=crError("STALE_BASE_REVISION","Authoritative shared gameplay state changed. Refresh before publishing again.");
          error.authoritativeRevision=current&&Number.isInteger(current.revision)?current.revision:null;
          throw error;
        }

        const before=stateExists?stateSnapshot.data():null;
        if(before&&before.lifecycleState==="tombstoned"){
          throw crError("TOMBSTONE_RESTORE_REQUIRED","This rivalry was deleted remotely and cannot be resurrected by a normal publish.");
        }
        if(stateExists)await crAssertLiveSharedStateIntegrity(before,rivalryId,options.cryptoImpl||root.crypto);
        if(stateExists&&before.revision!==plan.baseRevision){
          const error=crError("STALE_BASE_REVISION","Authoritative shared gameplay state changed. Refresh before publishing again.");
          error.authoritativeRevision=before.revision;
          throw error;
        }

        const acceptedRevision=stateExists?plan.baseRevision+1:0;
        const nowEpochMs=Number(options.nowEpochMs===undefined?Date.now():options.nowEpochMs);
        const now=options.firebaseSdk.Timestamp.fromMillis(nowEpochMs);
        const expiresAt=options.firebaseSdk.Timestamp.fromMillis(nowEpochMs+CR_IDEMPOTENCY_TTL_MS);
        const stateData={
          ...crClone(plan.projection),
          mutationReceipt:{
            idempotencyKeyHash:plan.idempotencyKeyHash,
            requestFingerprint:plan.requestFingerprint,
            baseRevision:plan.baseRevision
          }
        };
        const stateEnvelope=await crBuildEnvelope({
          objectType:"sharedState",
          objectId:rivalryId,
          revision:acceptedRevision,
          parentRevision:stateExists?before.revision:null,
          priorContentHash:stateExists?before.contentHash:null,
          updatedAt:now,
          updatedByAccountId:accountId,
          updatedByDeviceId:deviceId,
          data:stateData,
          cryptoImpl:options.cryptoImpl||root.crypto
        });
        const receiptData={
          requestFingerprint:plan.requestFingerprint,
          baseRevision:plan.baseRevision,
          acceptedRevision,
          resultStatus:"accepted",
          resultContentHash:stateEnvelope.contentHash,
          resultTombstone:false,
          actorAccountId:accountId,
          deviceId,
          createdAt:now,
          expiresAt
        };
        const receiptEnvelope=await crBuildEnvelope({
          objectType:"idempotency",
          objectId:plan.idempotencyKeyHash,
          revision:0,
          parentRevision:null,
          priorContentHash:null,
          updatedAt:now,
          updatedByAccountId:accountId,
          updatedByDeviceId:deviceId,
          data:receiptData,
          cryptoImpl:options.cryptoImpl||root.crypto
        });
        transaction.set(stateRef,stateEnvelope);
        transaction.set(receiptRef,receiptEnvelope);
        return {
          ok:true,
          status:"accepted",
          replayed:false,
          revision:acceptedRevision,
          contentHash:stateEnvelope.contentHash,
          idempotencyKey:plan.idempotencyKey
        };
      });
    }catch(error){
      const result=crResultError(error,"CONNECTED_RIVALRY_PUBLISH_FAILED");
      if(error&&Object.prototype.hasOwnProperty.call(error,"authoritativeRevision"))result.authoritativeRevision=error.authoritativeRevision;
      return result;
    }
  }

  function crBindingOptions(){
    const pairing=root.CareerModeSparkPrivatePairing;
    return pairing&&typeof pairing.localBindingOptions==="function"?pairing.localBindingOptions():[];
  }

  async function crLoadSavedPointerForBinding(accountId,deviceId,binding){
    try{
      const pointer=await crLoadPointer(accountId,binding);
      if(!pointer||pointer.deviceId!==deviceId)return null;
      return pointer;
    }catch(_error){
      return null;
    }
  }

  async function crInitialize(options={}){
    if(crInitializePromise)return crInitializePromise;
    crInitializePromise=(async()=>{
      try{
        const context=await crResolveContext(options);
        const bindings=crBindingOptions();
        const binding=bindings[0]||null;
        const pointer=binding?await crLoadSavedPointerForBinding(context.accountId,context.deviceId,binding):null;
        return crSetState({
          status:pointer?"saved-link":"ready",
          initialized:true,
          busy:false,
          connected:true,
          attached:Boolean(pointer),
          rivalryId:pointer?pointer.rivalryId:null,
          accountId:context.accountId,
          deviceId:context.deviceId,
          binding:binding||null,
          observedExists:false,
          observedRevision:null,
          observedContentHash:null,
          observedEnvelope:null,
          observedTombstone:false,
          ...crClearReconciliationPreview(),
          localCommitRevision:null,
          localCommitContentHash:null,
          localCommitSaveId:null,
          message:pointer
            ?"A private Connected Rivalry link is saved on this browser. Refresh verifies current remote authority before any publish."
            :"Connected Rivalry is ready. Attach the exact private rivalry code once; this does not repeat pairing."
        });
      }catch(error){
        return crSetState({
          status:"unavailable",
          initialized:true,
          busy:false,
          connected:false,
          attached:false,
          rivalryId:null,
          observedEnvelope:null,
          ...crClearReconciliationPreview(),
          message:`${error&&error.message?error.message:"Connected Rivalry is unavailable."} Local Career Mode remains unchanged.`
        });
      }
    })().finally(()=>{crInitializePromise=null;});
    return crInitializePromise;
  }

  function crShort(value){
    return typeof value!=="string"||!value?"—":value.length<=18?value:`${value.slice(0,11)}…${value.slice(-5)}`;
  }

  function crCreate(tag,className,text){
    const element=root.document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined&&text!==null)element.textContent=String(text);
    return element;
  }

  function crBindingLabel(binding){
    return `${binding.managerRole==="playerOne"?"Player One":"Player Two"} · ${binding.displayLabel||crShort(binding.profileId)}`;
  }

  function crClearReconciliationPreview(){
    crReconciliationIntent=null;
    return {
      reconciliationPreviewReady:false,
      previewRevision:null,
      previewContentHash:null,
      previewSaveId:null
    };
  }

  async function crHandleAttach(binding,rivalryInput){
    crSetState({status:"attaching",busy:true,message:"Verifying the exact paired rivalry and this manager identity…"});
    try{
      const context=await crResolveContext();
      const result=await crAttachRivalry({
        user:context.user,
        firestore:context.services.firestore,
        firebaseSdk:context.services.firestoreSdk,
        deviceId:context.deviceId,
        binding,
        rivalryId:rivalryInput,
        indexedDBImpl:root.indexedDB
      });
      if(!result.ok)throw crError(result.code,result.message);
      crSetState({
        status:"attached",
        busy:false,
        connected:true,
        attached:true,
        rivalryId:result.rivalryId,
        accountId:context.accountId,
        deviceId:context.deviceId,
        binding,
        observedExists:false,
        observedRevision:null,
        observedContentHash:null,
        observedEnvelope:null,
        observedTombstone:false,
        ...crClearReconciliationPreview(),
        localCommitRevision:null,
        localCommitContentHash:null,
        localCommitSaveId:null,
        message:"Connected Rivalry attached privately. Refresh shared state before publishing; local saves were not changed."
      });
    }catch(error){
      crSetState({status:"attach-error",busy:false,message:`${error&&error.message?error.message:"Connected Rivalry could not be attached."} Local saves were not changed.`});
    }
  }

  async function crHandleRefresh(binding){
    if(!crState.rivalryId)return;
    crSetState({status:"refreshing",busy:true,message:"Reading authoritative shared gameplay state…"});
    try{
      const context=await crResolveContext();
      const result=await crReadSharedState({
        user:context.user,
        firestore:context.services.firestore,
        firebaseSdk:context.services.firestoreSdk,
        deviceId:context.deviceId,
        binding,
        rivalryId:crState.rivalryId
      });
      if(!result.ok)throw crError(result.code,result.message);
      crSetState({
        status:result.tombstoned?"tombstoned":"refreshed",
        busy:false,
        attached:true,
        binding,
        observedExists:result.exists,
        observedRevision:result.revision,
        observedContentHash:result.contentHash||null,
        observedEnvelope:result.envelope?crClone(result.envelope):null,
        observedTombstone:Boolean(result.tombstoned),
        ...crClearReconciliationPreview(),
        message:result.tombstoned
          ?"This Connected Rivalry is tombstoned. Normal publishing is locked; local saves remain available."
          :result.exists
            ?`Authoritative shared state refreshed at revision ${result.revision}. No local save was overwritten.`
            :"No authoritative shared state exists yet. The first publish will create revision 0."
      });
    }catch(error){
      crSetState({status:"refresh-error",busy:false,message:`${error&&error.message?error.message:"Shared state could not be refreshed."} Local saves remain available.`});
    }
  }

  async function crHandlePublish(binding){
    if(!crState.rivalryId||crState.observedTombstone)return;
    crSetState({status:"publishing",busy:true,message:"Publishing this local Showdown projection with deterministic revision and replay protection…"});
    try{
      const context=await crResolveContext();
      const result=await crPublishSharedState({
        user:context.user,
        firestore:context.services.firestore,
        firebaseSdk:context.services.firestoreSdk,
        deviceId:context.deviceId,
        binding,
        rivalryId:crState.rivalryId,
        expectedStateExists:crState.observedExists,
        baseRevision:crState.observedExists?crState.observedRevision:0,
        saveRuntime:root.CareerModeSaveLibraryRuntime,
        cryptoImpl:root.crypto
      });
      if(!result.ok)throw crError(result.code,result.code==="STALE_BASE_REVISION"
        ?"The shared rivalry changed on the other device. Refresh before publishing again."
        :result.message);
      crSetState({
        status:result.replayed?"replayed":"published",
        busy:false,
        observedExists:true,
        observedRevision:result.revision,
        observedContentHash:result.contentHash,
        observedEnvelope:null,
        observedTombstone:false,
        ...crClearReconciliationPreview(),
        message:result.replayed
          ?`The accepted mutation was replayed safely at revision ${result.revision}; no duplicate revision was created.`
          :`Shared gameplay projection published at revision ${result.revision}. Local Save Library remains unchanged.`
      });
    }catch(error){
      crSetState({status:error&&error.code==="STALE_BASE_REVISION"?"conflict":"publish-error",busy:false,message:`${error&&error.message?error.message:"Shared gameplay state could not be published."} Local saves were not changed.`});
    }
  }

  async function crHandleReconciliationPreview(binding){
    if(!crState.rivalryId||!crState.observedEnvelope)return;
    crSetState({status:"reconciliation-previewing",busy:true,...crClearReconciliationPreview(),message:"Building a non-mutating preview for this exact remote revision and local Save target…"});
    try{
      if(typeof root.ensureCareerModeCandidateCAuthority!=="function")throw crError("CONNECTED_RIVALRY_CANDIDATE_C_UNAVAILABLE","Candidate C recovery authority cannot be loaded.");
      await root.ensureCareerModeCandidateCAuthority();
      if(typeof root.prepareCareerModeRemoteReconciliationIntent!=="function")throw crError("CONNECTED_RIVALRY_CANDIDATE_C_UNAVAILABLE","Candidate C reconciliation preview authority is unavailable.");
      const result=await root.prepareCareerModeRemoteReconciliationIntent({
        rivalryId:crState.rivalryId,
        envelope:crState.observedEnvelope,
        target:binding
      });
      if(!result||result.ok!==true)throw crError("CONNECTED_RIVALRY_RECONCILIATION_PREVIEW_FAILED",result&&Array.isArray(result.errors)?result.errors.join(" "):"Remote-to-local preview could not be prepared.");
      crReconciliationIntent=result.intent;
      crSetState({
        status:"reconciliation-preview-ready",
        busy:false,
        binding,
        reconciliationPreviewReady:true,
        previewRevision:result.preview.remoteRevision,
        previewContentHash:result.preview.remoteContentHash,
        previewSaveId:result.preview.localSaveId,
        message:result.preview.changesLocalSave
          ?`Preview ready. Remote revision ${result.preview.remoteRevision} is observed only and has not changed local Save ${crShort(result.preview.localSaveId)}.`
          :`Preview ready. Remote revision ${result.preview.remoteRevision} already matches the identity-safe local gameplay candidate; explicit Apply still records the reviewed commit boundary.`
      });
    }catch(error){
      crSetState({status:"reconciliation-preview-error",busy:false,...crClearReconciliationPreview(),message:`${error&&error.message?error.message:"Remote-to-local preview could not be prepared."} Local saves were not changed.`});
    }
  }

  async function crHandleReconciliationApply(binding){
    const intent=crReconciliationIntent;
    if(!intent||!crState.reconciliationPreviewReady)return;
    if(binding.saveId!==intent.target.saveId||binding.profileId!==intent.target.profileId||binding.managerRole!==intent.target.managerRole){
      crSetState({status:"reconciliation-target-changed",busy:false,...crClearReconciliationPreview(),message:"The selected local target changed after preview. Review the exact remote revision and local Save again."});
      return;
    }
    crSetState({status:"reconciliation-applying",busy:true,message:"Candidate C is verifying the remote base, completing a canonical backup and guarding the exact local commit…"});
    try{
      const context=await crResolveContext();
      if(typeof root.applyCareerModeRemoteReconciliation!=="function")throw crError("CONNECTED_RIVALRY_CANDIDATE_C_UNAVAILABLE","Candidate C reconciliation Apply authority is unavailable.");
      const verifyRemote=()=>crReadSharedState({
        user:context.user,
        firestore:context.services.firestore,
        firebaseSdk:context.services.firestoreSdk,
        deviceId:context.deviceId,
        binding,
        rivalryId:intent.rivalryId,
        cryptoImpl:root.crypto
      });
      const result=await root.applyCareerModeRemoteReconciliation(intent,{
        confirmed:true,
        confirmationFingerprint:intent.confirmationFingerprint,
        verifyRemote
      });
      if(!result||result.ok!==true){
        const detail=result&&Array.isArray(result.errors)&&result.errors.length?result.errors.join(" "):"Remote gameplay was not committed locally.";
        const backupNote=result&&result.backup?" The pre-Apply backup was completed.":"";
        crSetState({status:"reconciliation-apply-error",busy:false,...crClearReconciliationPreview(),message:`${detail}${backupNote} Review current remote and local state before trying again.`});
        return;
      }
      crSetState({
        status:"reconciliation-applied",
        busy:false,
        ...crClearReconciliationPreview(),
        localCommitRevision:result.remoteRevision,
        localCommitContentHash:result.remoteContentHash,
        localCommitSaveId:result.localSaveId,
        message:`Local commit complete: remote revision ${result.remoteRevision} was applied to ${crShort(result.localSaveId)} only after a verified backup and exact Candidate C transaction.`
      });
    }catch(error){
      crSetState({status:"reconciliation-apply-error",busy:false,...crClearReconciliationPreview(),message:`${error&&error.message?error.message:"Remote gameplay was not committed locally."} Review current remote and local state before trying again.`});
    }
  }

  function crRenderPanel(){
    if(!root.document)return null;
    const content=root.document.getElementById(CR_SETTINGS_CONTENT_ID);
    const overlay=root.document.getElementById(CR_SETTINGS_OVERLAY_ID);
    if(!content||!overlay||overlay.classList.contains("hidden"))return null;
    let panel=root.document.getElementById(CR_PANEL_ID);
    if(!panel){
      panel=crCreate("section","settingsPanel settingsConnectedAccountPanel settingsPrivatePairingPanel");
      panel.id=CR_PANEL_ID;
      const pairingPanel=root.document.getElementById("sparkPrivatePairingPanel");
      if(pairingPanel&&pairingPanel.parentNode===content&&pairingPanel.nextSibling)content.insertBefore(panel,pairingPanel.nextSibling);
      else content.appendChild(panel);
    }
    panel.replaceChildren();
    const heading=crCreate("div","settingsPanelHeading");
    heading.append(
      crCreate("span","settingsPanelEyebrow","CONNECTED RIVALRY"),
      crCreate("h3","","OBSERVE REMOTE · COMMIT LOCAL EXPLICITLY"),
      crCreate("p","","Refresh and preview are read-only. Local gameplay changes only after exact confirmation, a verified backup and Candidate C Apply. Remote Joining sessions remain locked.")
    );
    const info=crCreate("div","settingsInfoGrid");
    const revisionLabel=crState.observedTombstone
      ?"Tombstoned"
      :crState.observedExists&&Number.isInteger(crState.observedRevision)
        ?`Revision ${crState.observedRevision}`
        :"Not published";
    const targetLabel=crState.binding
      ?`${crState.binding.managerRole==="playerOne"?"Player One":"Player Two"} · ${crShort(crState.binding.saveId)}`
      :"No exact local target";
    const localCommitLabel=Number.isInteger(crState.localCommitRevision)&&crState.localCommitSaveId
      ?`Revision ${crState.localCommitRevision} · ${crShort(crState.localCommitSaveId)}`
      :"Not applied this session";
    for(const [label,value] of [
      ["RIVALRY",crState.attached?crShort(crState.rivalryId):"Not attached"],
      ["REMOTE OBSERVED",revisionLabel],
      ["LOCAL TARGET",targetLabel],
      ["LOCAL COMMIT",localCommitLabel],
      ["CONFLICT MODEL","Immutable base revision · no silent rebase"],
      ["REMOTE JOINING","Stage 5 · still locked"],
      ["BILLING","Firebase Spark · no billing"]
    ]){
      const row=crCreate("div","settingsInfoRow");
      row.append(crCreate("span","",label),crCreate("strong","",value));
      info.appendChild(row);
    }
    panel.append(heading,info);

    if(crState.connected){
      const bindings=crBindingOptions();
      const actions=crCreate("div","settingsOfflineActions settingsConnectedAccountActions");
      const select=crCreate("select","menuButton settingsConnectedAccountButton");
      select.setAttribute("aria-label","Local manager identity for Connected Rivalry");
      if(!bindings.length){
        const option=crCreate("option","","No active paired Save Library manager identity");
        option.value="";
        select.appendChild(option);
        select.disabled=true;
      }else{
        bindings.forEach((binding,index)=>{
          const option=crCreate("option","",crBindingLabel(binding));
          option.value=String(index);
          if(crState.binding&&binding.saveId===crState.binding.saveId&&binding.managerRole===crState.binding.managerRole)option.selected=true;
          select.appendChild(option);
        });
      }
      const code=crCreate("input","settingsConnectedAccountInput");
      code.type="text";
      code.value=crState.rivalryId||"";
      code.placeholder=crState.rivalryId?"Saved rivalry ID":"Paste exact private rivalry code";
      code.autocomplete="off";
      code.autocapitalize="none";
      code.spellcheck=false;
      code.setAttribute("aria-label","Exact private rivalry code for Connected Rivalry");

      let rivalryIdBlock=null;
      let copyRivalryId=null;
      if(crState.rivalryId){
        rivalryIdBlock=crCreate("div","settingsDataNote settingsConnectedRivalryIdBlock");
        rivalryIdBlock.setAttribute("aria-label","Full Connected Rivalry ID");
        rivalryIdBlock.style.userSelect="text";
        rivalryIdBlock.style.webkitUserSelect="text";
        rivalryIdBlock.style.overflowWrap="anywhere";
        rivalryIdBlock.style.wordBreak="break-all";
        const rivalryIdLabel=crCreate("span","settingsPanelEyebrow","FULL RIVALRY ID");
        const rivalryIdText=crCreate("code","settingsConnectedRivalryIdText",crState.rivalryId);
        rivalryIdText.style.display="block";
        rivalryIdText.style.marginTop="0.4rem";
        rivalryIdText.style.fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        rivalryIdText.style.fontSize="0.82rem";
        rivalryIdText.style.lineHeight="1.45";
        rivalryIdText.style.whiteSpace="normal";
        rivalryIdText.style.userSelect="text";
        rivalryIdText.style.webkitUserSelect="text";
        rivalryIdText.style.overflowWrap="anywhere";
        rivalryIdText.style.wordBreak="break-all";
        rivalryIdBlock.append(rivalryIdLabel,rivalryIdText);

        copyRivalryId=crCreate("button","menuButton settingsConnectedAccountButton","COPY RIVALRY ID");
        copyRivalryId.type="button";
        copyRivalryId.disabled=Boolean(crState.busy);
        copyRivalryId.addEventListener("click",async()=>{
          const rivalryId=crState.rivalryId;
          if(!rivalryId)return;
          let copied=false;
          try{
            if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){
              await root.navigator.clipboard.writeText(rivalryId);
              copied=true;
            }
          }catch(_error){}
          if(!copied){
            try{
              code.focus();
              code.select();
              code.setSelectionRange(0,code.value.length);
              copied=Boolean(root.document&&typeof root.document.execCommand==="function"&&root.document.execCommand("copy"));
            }catch(_error){}
          }
          if(copied){
            copyRivalryId.textContent="COPIED";
            root.setTimeout(()=>{if(copyRivalryId&&copyRivalryId.isConnected)copyRivalryId.textContent="COPY RIVALRY ID";},1600);
          }else{
            code.focus();
            code.select();
            try{code.setSelectionRange(0,code.value.length);}catch(_error){}
            copyRivalryId.textContent="SELECTED — USE COPY";
          }
        });
      }

      const attach=crCreate("button","menuButton settingsConnectedAccountButton",crState.attached?"VERIFY / REATTACH":"ATTACH CONNECTED RIVALRY");
      attach.type="button";
      attach.disabled=crState.busy||!bindings.length;
      attach.addEventListener("click",()=>{
        const binding=bindings[Number(select.value)||0];
        const rivalryValue=(code.value||crState.rivalryId||"").trim();
        if(binding&&rivalryValue)void crHandleAttach(binding,rivalryValue);
      });
      const refresh=crCreate("button","menuButton settingsConnectedAccountButton","REFRESH SHARED STATE");
      refresh.type="button";
      refresh.disabled=crState.busy||!crState.attached||!bindings.length;
      refresh.addEventListener("click",()=>{
        const binding=bindings[Number(select.value)||0];
        if(binding)void crHandleRefresh(binding);
      });
      const publish=crCreate("button","menuButton settingsConnectedAccountButton","PUBLISH LOCAL SAVE");
      publish.type="button";
      publish.disabled=crState.busy||!crState.attached||crState.observedTombstone||!bindings.length;
      publish.addEventListener("click",()=>{
        const binding=bindings[Number(select.value)||0];
        if(binding)void crHandlePublish(binding);
      });
      const preview=crCreate("button","menuButton settingsConnectedAccountButton","PREVIEW REMOTE → LOCAL");
      preview.type="button";
      preview.disabled=crState.busy||!crState.attached||crState.observedTombstone||!crState.observedEnvelope||!bindings.length;
      preview.addEventListener("click",()=>{
        const binding=bindings[Number(select.value)||0];
        if(binding)void crHandleReconciliationPreview(binding);
      });
      actions.append(select);
      if(rivalryIdBlock)actions.append(rivalryIdBlock);
      actions.append(code);
      if(copyRivalryId)actions.append(copyRivalryId);
      actions.append(attach,refresh,publish,preview);
      panel.appendChild(actions);
      if(crState.reconciliationPreviewReady&&crReconciliationIntent){
        const confirmation=crCreate("div","settingsConnectedRivalryConfirmation");
        confirmation.append(
          crCreate("span","settingsPanelEyebrow","NON-MUTATING PREVIEW"),
          crCreate("p","settingsConnectedRivalryPreviewSummary",`Remote observed: revision ${crReconciliationIntent.remote.revision} · ${crReconciliationIntent.remote.contentHash}`),
          crCreate("p","settingsConnectedRivalryPreviewSummary",`Local target: ${crReconciliationIntent.target.saveId} · ${crReconciliationIntent.target.managerRole} · ${crReconciliationIntent.target.profileId}`)
        );
        const label=crCreate("label","settingsConnectedRivalryConfirmLabel");
        const checkbox=crCreate("input","settingsConnectedRivalryConfirmInput");
        checkbox.type="checkbox";
        checkbox.checked=false;
        const confirmationText=crCreate("span","",crReconciliationIntent.confirmationText);
        label.append(checkbox,confirmationText);
        const apply=crCreate("button","menuButton settingsConnectedAccountButton settingsConnectedRivalryApply","BACK UP + APPLY EXACT REVISION");
        apply.type="button";
        apply.disabled=true;
        checkbox.addEventListener("change",()=>{apply.disabled=crState.busy||checkbox.checked!==true;});
        apply.addEventListener("click",()=>{
          const binding=bindings[Number(select.value)||0];
          if(binding&&checkbox.checked===true)void crHandleReconciliationApply(binding);
        });
        confirmation.append(label,apply);
        panel.appendChild(confirmation);
      }
    }

    const note=crCreate("p","settingsDataNote",crState.message);
    note.setAttribute("role","status");
    note.setAttribute("aria-live","polite");
    panel.appendChild(note);
    return panel;
  }

  function crEnsureObserver(){
    if(crSettingsObserver||!root.document||typeof root.MutationObserver!=="function")return;
    const content=root.document.getElementById(CR_SETTINGS_CONTENT_ID);
    if(!content)return;
    crSettingsObserver=new root.MutationObserver(()=>{
      const overlay=root.document.getElementById(CR_SETTINGS_OVERLAY_ID);
      if(overlay&&!overlay.classList.contains("hidden")&&!root.document.getElementById(CR_PANEL_ID)){
        root.queueMicrotask?root.queueMicrotask(crRenderPanel):root.setTimeout(crRenderPanel,0);
      }
    });
    crSettingsObserver.observe(content,{childList:true});
  }

  function crMountWhenSettingsReady(){
    if(!root.document)return Promise.resolve(false);
    return new Promise(resolve=>{
      let attempts=0;
      const tryMount=()=>{
        attempts+=1;
        const content=root.document.getElementById(CR_SETTINGS_CONTENT_ID);
        const overlay=root.document.getElementById(CR_SETTINGS_OVERLAY_ID);
        if(content&&overlay&&!overlay.classList.contains("hidden")){
          crRenderPanel();
          crEnsureObserver();
          void crInitialize();
          resolve(true);
          return;
        }
        if(attempts>=40){resolve(false);return;}
        root.setTimeout(tryMount,50);
      };
      tryMount();
    });
  }

  function crInstallSubscriptions(){
    const account=root.CareerModeSparkConnectedAccount;
    const pairing=root.CareerModeSparkPrivatePairing;
    if(!crAccountUnsubscribe&&account&&typeof account.subscribe==="function"){
      crAccountUnsubscribe=account.subscribe(next=>{
        if(!next||next.connected!==true){
          crSetState({
            status:"signed-out",
            initialized:true,
            busy:false,
            connected:false,
            attached:false,
            rivalryId:null,
            accountId:null,
            deviceId:null,
            observedExists:false,
            observedRevision:null,
            observedContentHash:null,
            observedEnvelope:null,
            observedTombstone:false,
            ...crClearReconciliationPreview(),
            localCommitRevision:null,
            localCommitContentHash:null,
            localCommitSaveId:null,
            message:"Sign in above to use Connected Rivalry. Local Career Mode remains available."
          });
        }else if(crState.accountId!==next.accountId){
          void crInitialize();
        }
      });
    }
    if(!crPairingUnsubscribe&&pairing&&typeof pairing.subscribe==="function"){
      crPairingUnsubscribe=pairing.subscribe(next=>{
        if(next&&next.registered===true&&next.deviceId!==crState.deviceId)void crInitialize();
      });
    }
  }

  function crSubscribe(listener){
    if(typeof listener!=="function")return ()=>{};
    crListeners.add(listener);
    return ()=>crListeners.delete(listener);
  }

  crInstallSubscriptions();
  if(root.document){
    root.document.addEventListener("click",event=>{
      const target=event&&event.target&&typeof event.target.closest==="function"
        ?event.target.closest("#settingsButton")
        :null;
      if(!target)return;
      root.setTimeout(()=>{void crMountWhenSettingsReady();},0);
    },true);
    crMountWhenSettingsReady().catch(()=>false);
  }

  return crFreeze({
    contractVersion:2,
    feature:"connected-rivalry-remote-to-local-reconciliation",
    pointerStorage:"indexeddb-private-convenience-only",
    canonicalStorageKeys:CR_CANONICAL_KEYS,
    idempotencyRetentionMs:CR_IDEMPOTENCY_TTL_MS,
    persistentFirestoreCache:false,
    publicDiscovery:false,
    gameplaySync:true,
    localApply:true,
    automaticLocalApply:false,
    localApplyAuthority:"candidate-c-explicit-confirmed-only",
    remoteJoiningSessions:false,
    billingRequired:false,
    normalizeRivalryId:crNormalizeRivalryId,
    normalizeBinding:crNormalizeBinding,
    validPointer:crValidPointer,
    storePointer:crStorePointer,
    loadPointer:crLoadPointer,
    buildProjection:crBuildProjection,
    buildMutationPlan:crBuildMutationPlan,
    attachRivalry:crAttachRivalry,
    readSharedState:crReadSharedState,
    publishSharedState:crPublishSharedState,
    verifyLiveSharedStateIntegrity:crAssertLiveSharedStateIntegrity,
    initialize:crInitialize,
    mountWhenSettingsReady:crMountWhenSettingsReady,
    subscribe:crSubscribe,
    getState:()=>crState
  });
});
