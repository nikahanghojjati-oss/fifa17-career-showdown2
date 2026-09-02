(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkPrivatePairing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const IDENTITY_DB_NAME="careerModeShowdown.privateDevice";
  const IDENTITY_DB_VERSION=1;
  const IDENTITY_STORE_NAME="identity";
  const IDENTITY_PRIMARY_KEY="primary";
  const IDENTITY_SCHEMA_VERSION=1;
  const DEVICE_ID_BYTES=16;
  const INSTALLATION_ID_BYTES=16;
  const PAIRING_CAPABILITY_BYTES=32;
  const PAIRING_TTL_MS=15*60*1000;
  const MAX_PAIRING_TTL_MS=30*60*1000;
  const PANEL_ID="sparkPrivatePairingPanel";
  const SETTINGS_CONTENT_ID="settingsContent";
  const SETTINGS_OVERLAY_ID="settingsOverlay";
  const MANAGER_ROLES=Object.freeze(["playerOne","playerTwo"]);

  let pairingState=Object.freeze({status:"idle",initialized:false,busy:false,connected:false,registered:false,accountId:null,deviceId:null,selectedBindingKey:null,message:"Private pairing is available after your private account and this device are ready.",capability:null,expiresAtEpochMs:null});
  let pairingServices=null;
  let pairingIdentity=null;
  let pairingInitializePromise=null;
  let pairingAccountUnsubscribe=null;
  const pairingListeners=new Set();

  function freezeDeep(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
    return value;
  }

  function setState(next,options={}){
    pairingState=freezeDeep({...pairingState,...next});
    for(const listener of pairingListeners){try{listener(pairingState);}catch(_error){}}
    if(options.render!==false)renderPanel();
    return pairingState;
  }

  function errorWithCode(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function asResultError(error,fallbackCode){
    return {ok:false,code:error&&typeof error.code==="string"?error.code:fallbackCode,message:error&&error.message?error.message:"The private operation could not be completed."};
  }

  function hexFromBytes(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
  }

  function randomId(prefix,byteLength,cryptoImpl=root.crypto){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")throw errorWithCode("PRIVATE_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    const bytes=new Uint8Array(byteLength);
    cryptoImpl.getRandomValues(bytes);
    return `${prefix}${hexFromBytes(bytes)}`;
  }

  function generateDeviceIdentity(cryptoImpl=root.crypto,nowEpochMs=Date.now()){
    return Object.freeze({schemaVersion:IDENTITY_SCHEMA_VERSION,installationId:randomId("installation_",INSTALLATION_ID_BYTES,cryptoImpl),deviceId:randomId("device_",DEVICE_ID_BYTES,cryptoImpl),createdAtEpochMs:Number(nowEpochMs)});
  }

  function validDeviceIdentity(value){
    return Boolean(value&&value.schemaVersion===IDENTITY_SCHEMA_VERSION&&typeof value.installationId==="string"&&/^installation_[0-9a-f]{32}$/.test(value.installationId)&&typeof value.deviceId==="string"&&/^device_[0-9a-f]{32}$/.test(value.deviceId)&&Number.isFinite(value.createdAtEpochMs)&&value.createdAtEpochMs>0);
  }

  function openIdentityDatabase(indexedDBImpl=root.indexedDB){
    if(!indexedDBImpl||typeof indexedDBImpl.open!=="function")return Promise.reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage is unavailable in this browser."));
    return new Promise((resolve,reject)=>{
      const request=indexedDBImpl.open(IDENTITY_DB_NAME,IDENTITY_DB_VERSION);
      request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains(IDENTITY_STORE_NAME))database.createObjectStore(IDENTITY_STORE_NAME);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage could not be opened."));
      request.onblocked=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage is blocked by another browser context."));
    });
  }

  async function getOrCreateDeviceIdentity(options={}){
    const indexedDBImpl=options.indexedDBImpl||root.indexedDB;
    const cryptoImpl=options.cryptoImpl||root.crypto;
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
    let database;
    try{
      database=await openIdentityDatabase(indexedDBImpl);
      return await new Promise((resolve,reject)=>{
        const transaction=database.transaction(IDENTITY_STORE_NAME,"readwrite");
        const store=transaction.objectStore(IDENTITY_STORE_NAME);
        const read=store.get(IDENTITY_PRIMARY_KEY);
        let resolvedIdentity=null;
        read.onsuccess=()=>{
          const existing=read.result;
          if(existing!==undefined){
            if(!validDeviceIdentity(existing)){try{transaction.abort();}catch(_error){}reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_CONFLICT","Stored private device identity is invalid. Remote pairing is disabled without touching local saves."));return;}
            resolvedIdentity=Object.freeze({...existing});
            return;
          }
          try{resolvedIdentity=generateDeviceIdentity(cryptoImpl,nowEpochMs);store.add({...resolvedIdentity},IDENTITY_PRIMARY_KEY);}catch(error){try{transaction.abort();}catch(_error){}reject(error);}
        };
        read.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity could not be read."));
        transaction.oncomplete=()=>resolve(resolvedIdentity);
        transaction.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity could not be committed."));
        transaction.onabort=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity transaction was aborted."));
      });
    }finally{if(database&&typeof database.close==="function")database.close();}
  }

  function canonicalize(value){
    if(value===null||value===undefined)return value===undefined?null:value;
    if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
    if(Array.isArray(value))return value.map(canonicalize);
    if(typeof value==="object"){const result={};for(const key of Object.keys(value).sort())result[key]=canonicalize(value[key]);return result;}
    return value;
  }

  async function sha256(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")throw errorWithCode("PRIVATE_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");
    const bytes=new TextEncoder().encode(JSON.stringify(canonicalize(value)));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${hexFromBytes(new Uint8Array(digest))}`;
  }

  async function buildEnvelope({objectType,objectId,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){
    const contentHash=await sha256({objectType,objectId,revision,data},cryptoImpl);
    return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,tombstone:null};
  }

  function timestampMillis(value){
    if(value&&typeof value.toMillis==="function")return value.toMillis();
    if(value instanceof Date)return value.getTime();
    return Number.NaN;
  }

  function normalizeAccountId(user){
    const uid=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!uid)throw errorWithCode("PRIVATE_AUTH_REQUIRED","A ready private account is required.");
    return uid;
  }

  function normalizeLocalBinding(binding){
    const source=binding&&typeof binding==="object"?binding:{};
    const saveId=typeof source.saveId==="string"?source.saveId.trim():"";
    const profileId=typeof source.profileId==="string"?source.profileId.trim():"";
    const managerRole=typeof source.managerRole==="string"?source.managerRole.trim():"";
    const displayLabel=typeof source.displayLabel==="string"?source.displayLabel.trim().slice(0,80):"";
    if(!/^save_[a-f0-9]{24}$/.test(saveId))throw errorWithCode("PRIVATE_SAVE_ID_REQUIRED","Choose a local Showdown with a stable Save Library identity.");
    if(!/^profile_[a-f0-9]{24}$/.test(profileId))throw errorWithCode("PRIVATE_PROFILE_ID_REQUIRED","Choose a manager with a stable Local Profile identity.");
    if(!MANAGER_ROLES.includes(managerRole))throw errorWithCode("PRIVATE_MANAGER_ROLE_REQUIRED","Choose Player One or Player Two for this private rivalry.");
    return Object.freeze({saveId,profileId,managerRole,displayLabel:displayLabel||null});
  }

  function bindingKey(binding){
    const normalized=normalizeLocalBinding(binding);
    return `${normalized.managerRole}:${normalized.profileId}:${normalized.saveId}`;
  }

  function pairingJoinErrorMessage(error){
    const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";
    const message=error&&typeof error.message==="string"?error.message.trim():"";
    const opaqueCodes=new Set(["permission-denied","firestore/permission-denied","permission_denied","pairing_capability_not_found","pairing_scope_denied","pairing_capability_already_used","pairing_capability_expired","pairing_rivalry_not_joinable"]);
    if(opaqueCodes.has(code)||/missing or insufficient permissions/i.test(message))return "This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device, or use Connected Rivalry below if these managers are already paired.";
    return message||"Private pairing could not be joined.";
  }

  function normalizeCapability(value){
    const capability=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^pair_[0-9a-f]{64}$/.test(capability))throw errorWithCode("PAIRING_CAPABILITY_INVALID","The private pairing code is invalid.");
    return capability;
  }

  function oppositeManagerRole(role){
    if(role==="playerOne")return "playerTwo";
    if(role==="playerTwo")return "playerOne";
    throw errorWithCode("PRIVATE_MANAGER_ROLE_REQUIRED","A valid manager role is required.");
  }

  function validateFirestoreInputs({firestore,firebaseSdk}){
    if(!firestore)throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    for(const name of ["doc","runTransaction"]){if(!firebaseSdk||typeof firebaseSdk[name]!=="function")throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE",`Private Firestore SDK method unavailable: ${name}.`);}
    if(!firebaseSdk.Timestamp||typeof firebaseSdk.Timestamp.fromMillis!=="function")throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Firestore Timestamp support is unavailable.");
  }

  function isEnvelope(snapshot,objectType,objectId){
    if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists())return false;
    const value=snapshot.data();
    return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");
  }

  function assertActiveDeviceSnapshot(snapshot,deviceId){
    if(!isEnvelope(snapshot,"device",deviceId))throw errorWithCode("PRIVATE_DEVICE_NOT_REGISTERED","This browser is not registered to the signed-in private account.");
    const value=snapshot.data();
    if(!value.data||value.data.deviceId!==deviceId)throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device identity does not match this browser.");
    if(value.data.state==="revoked")throw errorWithCode("PRIVATE_DEVICE_REVOKED","This registered device has been revoked. Local Career Mode remains available.");
    if(value.data.state!=="active")throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device state is invalid.");
    return value;
  }

  async function registerDevice(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable private device identity is required.");
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const now=sdk.Timestamp.fromMillis(nowEpochMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const existing=await transaction.get(deviceReference);
        if(existing.exists()){
          const stored=assertActiveDeviceSnapshot(existing,identity.deviceId);
          if(stored.data.installationId!==identity.installationId)throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device belongs to a different private installation identity.");
          return {action:"existing",revision:stored.revision};
        }
        const data={deviceId:identity.deviceId,installationId:identity.installationId,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null};
        const envelope=await buildEnvelope({objectType:"device",objectId:identity.deviceId,revision:0,parentRevision:null,priorContentHash:null,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(deviceReference,envelope);
        return {action:"created",revision:0};
      });
      return {ok:true,accountId,deviceId:identity.deviceId,installationId:identity.installationId,...result};
    }catch(error){return asResultError(error,"PRIVATE_DEVICE_REGISTRATION_FAILED");}
  }

  async function revokeRegisteredDevice(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable private device identity is required.");
      const targetDeviceId=typeof options.targetDeviceId==="string"?options.targetDeviceId.trim():identity.deviceId;
      if(!/^device_[0-9a-f]{32}$/.test(targetDeviceId))throw errorWithCode("PRIVATE_DEVICE_ID_INVALID","A valid registered device identity is required.");
      const sdk=options.firebaseSdk;
      const now=sdk.Timestamp.fromMillis(options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs));
      const actorReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const targetReference=sdk.doc(options.firestore,"accounts",accountId,"devices",targetDeviceId);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const actorSnapshot=await transaction.get(actorReference);
        assertActiveDeviceSnapshot(actorSnapshot,identity.deviceId);
        const targetSnapshot=targetDeviceId===identity.deviceId?actorSnapshot:await transaction.get(targetReference);
        const stored=assertActiveDeviceSnapshot(targetSnapshot,targetDeviceId);
        const data={...stored.data,state:"revoked",revokedAt:now,lastSeenAt:stored.data.lastSeenAt};
        const envelope=await buildEnvelope({objectType:"device",objectId:targetDeviceId,revision:stored.revision+1,parentRevision:stored.revision,priorContentHash:stored.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(targetReference,envelope);
        return {revision:envelope.revision};
      });
      return {ok:true,accountId,targetDeviceId,...result};
    }catch(error){return asResultError(error,"PRIVATE_DEVICE_REVOCATION_FAILED");}
  }

  function buildManagerSlots(accountId,binding){
    const creatorRole=binding.managerRole;
    const invitedRole=oppositeManagerRole(creatorRole);
    const slotFor=role=>role===creatorRole?{slotId:role,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{slotId:role,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:"open",deletionConsent:false};
    return {managerSlots:[slotFor("playerOne"),slotFor("playerTwo")],invitedRole};
  }

  async function createPairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const binding=normalizeLocalBinding(options.binding);
      const ttlMs=options.ttlMs===undefined?PAIRING_TTL_MS:Number(options.ttlMs);
      if(!Number.isFinite(ttlMs)||ttlMs<=0||ttlMs>MAX_PAIRING_TTL_MS)throw errorWithCode("PAIRING_TTL_INVALID","Private pairing expiry must be within 30 minutes.");
      const capability=normalizeCapability(options.capability||randomId("pair_",PAIRING_CAPABILITY_BYTES,options.cryptoImpl||root.crypto));
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const createdAt=sdk.Timestamp.fromMillis(nowEpochMs);
      const expiresAt=sdk.Timestamp.fromMillis(nowEpochMs+ttlMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const {managerSlots,invitedRole}=buildManagerSlots(accountId,binding);
      await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const rivalryData={connectionState:"pending-pair",connectionStateBeforeDeletion:null,managerSlots,authorizedAccountIds:[accountId],createdByAccountId:accountId,createdAt};
        const inviteData={purpose:"rivalry-pairing",slotId:invitedRole,createdByAccountId:accountId,createdAt,expiresAt,state:"open",redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
        const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
        const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(rivalryReference,rivalryEnvelope);
        transaction.set(inviteReference,inviteEnvelope);
      });
      return {ok:true,rivalryId:capability,inviteId:capability,capability,slotId:invitedRole,expiresAtEpochMs:nowEpochMs+ttlMs,creatorBinding:binding};
    }catch(error){return asResultError(error,"PAIRING_CREATE_FAILED");}
  }

  function assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs){
    if(!isEnvelope(rivalrySnapshot,"rivalry",capability)||!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
    const rivalry=rivalrySnapshot.data();
    const invite=inviteSnapshot.data();
    if(!invite.data||invite.data.purpose!=="rivalry-pairing")throw errorWithCode("PAIRING_SCOPE_DENIED","This capability is not valid for private rivalry pairing.");
    if(invite.data.createdByAccountId===accountId)throw errorWithCode("PAIRING_CREATOR_CANNOT_REDEEM","The account that created a private pairing code cannot redeem it.");
    if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
    const expiresAt=timestampMillis(invite.data.expiresAt);
    if(!Number.isFinite(expiresAt)||expiresAt<=nowEpochMs)throw errorWithCode("PAIRING_CAPABILITY_EXPIRED","This private pairing code has expired.");
    if(invite.data.slotId!==binding.managerRole)throw errorWithCode("PAIRING_SLOT_MISMATCH",`Choose ${invite.data.slotId==="playerOne"?"Player One":"Player Two"} on your local Showdown to join this rivalry.`);
    const data=rivalry.data;
    if(!data||data.connectionState!=="pending-pair"||!Array.isArray(data.managerSlots)||data.managerSlots.length!==2)throw errorWithCode("PAIRING_RIVALRY_NOT_JOINABLE","This private rivalry is not waiting for exactly one manager.");
    if(!Array.isArray(data.authorizedAccountIds)||data.authorizedAccountIds.length!==1||data.authorizedAccountIds[0]!==invite.data.createdByAccountId)throw errorWithCode("PAIRING_RIVALRY_CONFLICT","Private rivalry ownership is inconsistent.");
    const target=data.managerSlots.find(slot=>slot&&slot.slotId===invite.data.slotId);
    const creator=data.managerSlots.find(slot=>slot&&slot.accountId===invite.data.createdByAccountId);
    if(!target||target.accountId!==null||target.profileId!==null||target.saveId!==null||target.entitlementState!=="open")throw errorWithCode("PAIRING_TWO_MANAGER_LIMIT","The second manager slot is no longer open.");
    if(!creator||creator.entitlementState!=="active"||typeof creator.profileId!=="string"||typeof creator.saveId!=="string")throw errorWithCode("PAIRING_RIVALRY_CONFLICT","The creator manager binding is invalid.");
    return {rivalry,invite,target};
  }

  async function redeemPairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const binding=normalizeLocalBinding(options.binding);
      const capability=normalizeCapability(options.capability);
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const now=sdk.Timestamp.fromMillis(nowEpochMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const rivalrySnapshot=await transaction.get(rivalryReference);
        const inviteSnapshot=await transaction.get(inviteReference);
        const {rivalry,invite}=assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs);
        const nextSlots=rivalry.data.managerSlots.map(slot=>slot.slotId===invite.data.slotId?{slotId:slot.slotId,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{...slot});
        const rivalryData={...rivalry.data,connectionState:"active",managerSlots:nextSlots,authorizedAccountIds:[invite.data.createdByAccountId,accountId]};
        const inviteData={...invite.data,state:"redeemed",redeemedByAccountId:accountId,redeemedAt:now,revokedAt:null};
        const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:rivalry.revision+1,parentRevision:rivalry.revision,priorContentHash:rivalry.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
        const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(rivalryReference,rivalryEnvelope);
        transaction.set(inviteReference,inviteEnvelope);
        return {revision:rivalryEnvelope.revision,slotId:invite.data.slotId};
      });
      return {ok:true,rivalryId:capability,capability,accountId,binding,...result};
    }catch(error){return asResultError(error,"PAIRING_REDEEM_FAILED");}
  }

  async function revokePairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const capability=normalizeCapability(options.capability);
      const sdk=options.firebaseSdk;
      const now=sdk.Timestamp.fromMillis(options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs));
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const inviteSnapshot=await transaction.get(inviteReference);
        if(!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
        const invite=inviteSnapshot.data();
        if(!invite.data||invite.data.createdByAccountId!==accountId)throw errorWithCode("PAIRING_REVOKE_DENIED","Only the account that created this pairing code can revoke it.");
        if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
        const inviteData={...invite.data,state:"revoked",revokedAt:now,redeemedByAccountId:null,redeemedAt:null};
        const envelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(inviteReference,envelope);
        return {revision:envelope.revision};
      });
      return {ok:true,capability,...result};
    }catch(error){return asResultError(error,"PAIRING_REVOKE_FAILED");}
  }

  function localBindingOptions(saveRuntime=root.CareerModeSaveLibraryRuntime){
    if(!saveRuntime||typeof saveRuntime.getLibrarySnapshot!=="function"||typeof saveRuntime.isReady!=="function"||saveRuntime.isReady()!==true)return [];
    const library=saveRuntime.getLibrarySnapshot();
    if(!library||typeof library.activeSaveId!=="string"||!Array.isArray(library.saves))return [];
    const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
    const refs=entry&&entry.showdown&&entry.showdown.identity&&entry.showdown.identity.managerProfileIds;
    if(!entry||!refs)return [];
    const profiles=Array.isArray(library.profiles)?library.profiles:[];
    return MANAGER_ROLES.flatMap(managerRole=>{
      const profileId=refs[managerRole];
      if(typeof profileId!=="string")return [];
      const profile=profiles.find(item=>item&&item.profileId===profileId);
      const displayLabel=profile&&typeof profile.displayName==="string"&&profile.displayName.trim()?profile.displayName.trim():managerRole==="playerOne"?"Player One":"Player Two";
      try{return [normalizeLocalBinding({saveId:entry.saveId,profileId,managerRole,displayLabel})];}catch(_error){return [];}
    });
  }

  async function resolveConnectedContext(){
    const account=root.CareerModeSparkConnectedAccount;
    const runtime=root.CareerModeProductionFirebaseRuntime;
    if(!account||typeof account.getState!=="function"||!runtime||typeof runtime.ensureAccountServices!=="function")throw errorWithCode("PRIVATE_ACCOUNT_UNAVAILABLE","Connected account runtime is unavailable.");
    const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)throw errorWithCode("PRIVATE_AUTH_REQUIRED","Sign in to your private account first.");
    const services=pairingServices&&pairingServices.ok===true?pairingServices:await runtime.ensureAccountServices();
    if(!services||services.ok!==true)throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    pairingServices=services;
    if(!pairingIdentity)pairingIdentity=await getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
    return {accountState,services,user:services.auth.currentUser,identity:pairingIdentity};
  }

  async function registerCurrentDevice(){
    const preservePairingStateAtStart=["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
    if(!preservePairingStateAtStart)setState({status:"registering",busy:true,message:"Registering this browser privately…"});
    try{
      const context=await resolveConnectedContext();
      const result=await registerDevice({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,cryptoImpl:root.crypto});
      if(!result.ok)throw errorWithCode(result.code,result.message);
      const preservePairingState=preservePairingStateAtStart||["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
      if(preservePairingState)return setState({initialized:true,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId});
      return setState({status:"ready",initialized:true,busy:false,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId,message:"This browser is privately registered. Pairing only links the two manager identities; gameplay synchronization is still locked."});
    }catch(error){return setState({status:error&&error.code==="PRIVATE_DEVICE_REVOKED"?"revoked":"device-error",initialized:true,busy:false,connected:true,registered:false,message:`${error&&error.message?error.message:"This browser could not be registered."} Local Career Mode remains unchanged.`});}
  }

  async function initialize(){
    if(pairingInitializePromise)return pairingInitializePromise;
    pairingInitializePromise=(async()=>{
      const account=root.CareerModeSparkConnectedAccount;
      if(!account||typeof account.getState!=="function")return setState({status:"account-unavailable",initialized:true,busy:false,connected:false,registered:false,message:"Private pairing is unavailable, but local Career Mode remains available."});
      if(!pairingAccountUnsubscribe&&typeof account.subscribe==="function"){
        pairingAccountUnsubscribe=account.subscribe(next=>{
          if(!next||next.connected!==true){pairingServices=null;setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,selectedBindingKey:null,capability:null,expiresAtEpochMs:null,message:"Sign in above to register this browser and use private pairing."});}
          else if(pairingState.accountId!==next.accountId){pairingServices=null;setState({selectedBindingKey:null,capability:null,expiresAtEpochMs:null});void registerCurrentDevice();}
          else if(pairingState.registered!==true){void registerCurrentDevice();}
        });
      }
      const current=account.getState();
      if(!current||current.connected!==true)return setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,message:"Sign in above to register this browser and use private pairing."});
      return registerCurrentDevice();
    })().finally(()=>{pairingInitializePromise=null;});
    return pairingInitializePromise;
  }

  function createElement(tag,className,text){
    const element=root.document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined&&text!==null)element.textContent=String(text);
    return element;
  }

  function shortId(value){return typeof value!=="string"||!value?"—":value.length<=16?value:`${value.slice(0,10)}…${value.slice(-4)}`;}
  function bindingLabel(binding){return `${binding.managerRole==="playerOne"?"Player One":"Player Two"} · ${binding.displayLabel||shortId(binding.profileId)}`;}

  function renderPanel(){
    if(!root.document)return null;
    const content=root.document.getElementById(SETTINGS_CONTENT_ID);
    const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
    if(!content||!overlay||overlay.classList.contains("hidden"))return null;
    let panel=root.document.getElementById(PANEL_ID);
    if(!panel){
      panel=createElement("section","settingsPanel settingsConnectedAccountPanel settingsPrivatePairingPanel");
      panel.id=PANEL_ID;
      const accountPanel=root.document.getElementById("sparkConnectedAccountPanel");
      if(accountPanel&&accountPanel.parentNode===content&&accountPanel.nextSibling)content.insertBefore(panel,accountPanel.nextSibling);else content.appendChild(panel);
    }
    panel.replaceChildren();
    const heading=createElement("div","settingsPanelHeading");
    heading.append(createElement("span","settingsPanelEyebrow","PRIVATE RIVALRY"),createElement("h3","","REGISTERED DEVICE & PAIRING"),createElement("p","","Link exactly two private manager identities. This stage does not synchronize gameplay or start a Remote Joining session."));
    const info=createElement("div","settingsInfoGrid");
    for(const [label,value] of [["DEVICE",pairingState.registered?`Registered · ${shortId(pairingState.deviceId)}`:pairingState.connected?"Not registered":"Sign in required"],["PAIRING","One use · 15 minute private capability"],["MANAGERS","Exactly two stable account/profile/save identities"],["GAMEPLAY SYNC","Explicit actions only in Connected Rivalry below"],["BILLING","Firebase Spark · no billing"]]){
      const row=createElement("div","settingsInfoRow");row.append(createElement("span","",label),createElement("strong","",value));info.appendChild(row);
    }
    panel.append(heading,info);
    if(pairingState.registered){
      const bindings=localBindingOptions();
      const form=createElement("div","settingsOfflineActions settingsConnectedAccountActions");
      const select=createElement("select","menuButton settingsConnectedAccountButton");
      select.setAttribute("aria-label","Local manager identity for private pairing");
      const bindingEntries=bindings.map(binding=>({binding,key:bindingKey(binding)}));
      const selectedEntry=bindingEntries.find(entry=>entry.key===pairingState.selectedBindingKey)||bindingEntries[0]||null;
      if(!bindingEntries.length){const option=createElement("option","","No active Save Library manager identity");option.value="";select.appendChild(option);select.disabled=true;}
      else bindingEntries.forEach(entry=>{const option=createElement("option","",bindingLabel(entry.binding));option.value=entry.key;option.selected=entry.key===selectedEntry.key;select.appendChild(option);});
      select.disabled=select.disabled||pairingState.busy||Boolean(pairingState.capability);
      select.addEventListener("change",()=>{if(pairingState.busy||pairingState.capability){if(selectedEntry)select.value=selectedEntry.key;return;}if(bindingEntries.some(entry=>entry.key===select.value))setState({selectedBindingKey:select.value},{render:false});});
      const selectedBinding=()=>{const entry=bindingEntries.find(candidate=>candidate.key===select.value)||selectedEntry;return entry?entry.binding:null;};
      const createButton=createElement("button","menuButton settingsConnectedAccountButton","CREATE PAIRING CODE");createButton.type="button";createButton.disabled=pairingState.busy||!bindings.length;
      const codeInput=createElement("input","settingsConnectedAccountInput");codeInput.type="text";codeInput.placeholder="Paste private pairing code";codeInput.autocomplete="off";codeInput.spellcheck=false;codeInput.setAttribute("aria-label","Private pairing code");
      if(pairingState.status==="paired"&&pairingState.capability){codeInput.value=pairingState.capability;codeInput.readOnly=true;codeInput.setAttribute("aria-readonly","true");}
      const joinButton=createElement("button","menuButton settingsConnectedAccountButton","JOIN PRIVATE PAIRING");joinButton.type="button";joinButton.disabled=pairingState.busy||!bindings.length||pairingState.status==="paired";
      createButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        setState({status:"creating-pair",busy:true,selectedBindingKey:bindingKey(binding),capability:null,expiresAtEpochMs:null,message:"Creating a private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);setState({status:"pair-open",busy:false,capability:result.capability,expiresAtEpochMs:result.expiresAtEpochMs,message:"Pairing code created. Share it directly with your friend. Connected Rivalry below is prefilled automatically on this browser. After the second manager joins, do not manually attach in the normal flow: return to Save Library or open Private Remote Joining and the same rivalry will verify and attach automatically. The pairing code still expires in 15 minutes and can be used once."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${error&&error.message?error.message:"Private pairing could not be created."} Local saves were not changed.`});}
      });
      joinButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        setState({status:"joining-pair",busy:true,selectedBindingKey:bindingKey(binding),message:"Redeeming the private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await redeemPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,capability:codeInput.value,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);setState({status:"paired",busy:false,capability:result.capability,expiresAtEpochMs:null,message:"Private managers are paired. The one code pasted above is retained as the exact Connected Rivalry ID, and Connected Rivalry below uses that same value automatically; no second copy, paste, or manual Attach is required in the normal flow."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${pairingJoinErrorMessage(error)} Local saves were not changed.`});}
      });
      form.append(select,createButton,codeInput,joinButton);panel.appendChild(form);
      if(pairingState.capability){
        const capabilityBox=createElement("div","settingsDataNote");
        const capabilityText=createElement("code","",pairingState.capability);
        capabilityBox.append(createElement("strong","",pairingState.status==="paired"?"CONNECTED RIVALRY ID · ONE PASTE CONFIRMED: ":"PRIVATE PAIRING CODE · COPY ONCE: "),capabilityText);
        panel.appendChild(capabilityBox);
        if(pairingState.status==="pair-open"){
          const copyButton=createElement("button","menuButton settingsConnectedAccountButton","COPY PAIRING CODE");
          copyButton.type="button";
          copyButton.addEventListener("click",async()=>{
            const capability=pairingState.capability;
            if(!capability)return;
            let copied=false;
            if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){try{await root.navigator.clipboard.writeText(capability);copied=true;}catch(_error){copied=false;}}
            if(!copied){
              const fallbackCopy=createElement("textarea","settingsConnectedAccountInput");fallbackCopy.value=capability;fallbackCopy.readOnly=true;fallbackCopy.setAttribute("aria-hidden","true");fallbackCopy.style.position="fixed";fallbackCopy.style.opacity="0";fallbackCopy.style.pointerEvents="none";root.document.body.appendChild(fallbackCopy);fallbackCopy.focus();fallbackCopy.setSelectionRange(0,capability.length);try{copied=Boolean(root.document.execCommand&&root.document.execCommand("copy"));}catch(_error){copied=false;}fallbackCopy.remove();
            }
            if(copied){setState({message:"Pairing code copied. Paste it exactly once into Player Two's Join Private Pairing field; Player One and Player Two Connected Rivalry will use the same ID automatically."});return;}
            if(root.getSelection&&root.document.createRange){const selection=root.getSelection();const range=root.document.createRange();range.selectNodeContents(capabilityText);selection.removeAllRanges();selection.addRange(range);}
            const status=panel.querySelector('[role="status"]');if(status)status.textContent="Automatic clipboard copy was unavailable. The full pairing code is selected; use your browser Copy command. The code itself was not changed.";
          });
          panel.appendChild(copyButton);
        }
      }
    }
    const note=createElement("p","settingsDataNote",pairingState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");panel.appendChild(note);
    return panel;
  }

  function mountWhenSettingsReady(){
    if(!root.document)return Promise.resolve(false);
    return new Promise(resolve=>{
      let attempts=0;
      const tryMount=()=>{
        attempts+=1;
        const content=root.document.getElementById(SETTINGS_CONTENT_ID);
        const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
        if(content&&overlay&&!overlay.classList.contains("hidden")){renderPanel();void initialize();resolve(true);return;}
        if(attempts>=40){resolve(false);return;}
        root.setTimeout(tryMount,50);
      };
      tryMount();
    });
  }

  function subscribe(listener){if(typeof listener!=="function")return ()=>{};pairingListeners.add(listener);return ()=>pairingListeners.delete(listener);}

  return freezeDeep({
    contractVersion:1,
    feature:"registered-devices-private-pairing",
    identityStorage:"indexeddb-private-device-only",
    canonicalLocalStorageKeys:Object.freeze(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]),
    pairingCapabilityBits:PAIRING_CAPABILITY_BYTES*8,
    pairingTtlMs:PAIRING_TTL_MS,
    maxPairingTtlMs:MAX_PAIRING_TTL_MS,
    publicDiscovery:false,
    gameplaySync:false,
    remoteJoiningSessions:false,
    billingRequired:false,
    generateDeviceIdentity,
    validDeviceIdentity,
    getOrCreateDeviceIdentity,
    normalizeLocalBinding,
    bindingKey,
    pairingJoinErrorMessage,
    normalizeCapability,
    localBindingOptions,
    registerDevice,
    revokeRegisteredDevice,
    revokeDevice:revokeRegisteredDevice,
    createPairing,
    redeemPairing,
    revokePairing,
    initialize,
    mountWhenSettingsReady,
    subscribe,
    getState:()=>pairingState
  });
});