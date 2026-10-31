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
  const JOIN_INPUT_ID="sparkPrivatePairingCodeInput";

  let pairingState=Object.freeze({status:"idle",initialized:false,busy:false,connected:false,registered:false,accountId:null,deviceId:null,selectedBindingKey:null,message:"Private pairing is available after your private account and this device are ready.",capability:null,expiresAtEpochMs:null});
  let pairingServices=null;
  let pairingIdentity=null;
  let pairingInitializePromise=null;
  let pairingAccountUnsubscribe=null;
  let pairingJoinDraft="";
  let pairingJoinRenderDeferred=false;
  const DEVICE_REVERIFY_MS=10*60*1000;
  let deviceVerified=null;
  // r75: any denied Firestore read or write (the budget layer's event) ends the 10-minute trust, so a browser revoked from
  // another browser is re-verified on its next check.
  try{if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-firestore-authority-denied",()=>{deviceVerified=null;});}catch(_error){}
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
            if(!validDeviceIdentity(existing)){try{transaction.abort();}catch(_error){}reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_CONFLICT","Stored private device identity is invalid. Remote pairing is disabled. Your Showdowns were not changed."));return;}
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

  // Studio Z10: Forget device revokes the server record and deletes the local record, so the cached identity must go too.
  // The next sign-in then registers a fresh device; the revoked server document is untouched.
  function resetDeviceIdentityCache(){pairingIdentity=null;pairingServices=null;}
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
    if(!/^save_[a-f0-9]{24}$/.test(saveId))throw errorWithCode("PRIVATE_SAVE_ID_REQUIRED","Choose a Showdown with a stable Save Library identity.");
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
    if(opaqueCodes.has(code)||/missing or insufficient permissions/i.test(message))return "This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device. If Daniel and Nik are already connected, go Home and tap CONTINUE CAREER instead. Also check that Nik is signed in with a different Google account than Daniel.";
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
    if(value.data.state==="revoked")throw errorWithCode("PRIVATE_DEVICE_REVOKED","This registered device has been revoked.");
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
    deviceVerified=null;
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
      const durableWitness=options.durableWitness;
      if(durableWitness!==undefined&&durableWitness!==null&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","A valid durable pairing witness is required.");
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
      const durableWitnessResult=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const rivalryData={connectionState:"pending-pair",connectionStateBeforeDeletion:null,managerSlots,authorizedAccountIds:[accountId],createdByAccountId:accountId,createdAt};
        const inviteData={purpose:"rivalry-pairing",slotId:invitedRole,createdByAccountId:accountId,createdAt,expiresAt,state:"open",redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
        const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
        const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        let witness=null;
        if(durableWitness){
          witness=await durableWitness({transaction,binding,capability,accountId,deviceId:identity.deviceId,now:createdAt,nowEpochMs});
          if(!witness||witness.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The durable creator pairing witness could not be committed.");
        }
        transaction.set(rivalryReference,rivalryEnvelope);
        transaction.set(inviteReference,inviteEnvelope);
        return witness;
      });
      return {ok:true,rivalryId:capability,inviteId:capability,capability,slotId:invitedRole,expiresAtEpochMs:nowEpochMs+ttlMs,creatorBinding:binding,durableWitness:durableWitnessResult};
    }catch(error){return asResultError(error,"PAIRING_CREATE_FAILED");}
  }

  function assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs){
    if(!isEnvelope(rivalrySnapshot,"rivalry",capability)||!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
    const rivalry=rivalrySnapshot.data();
    const invite=inviteSnapshot.data();
    if(!invite.data||invite.data.purpose!=="rivalry-pairing")throw errorWithCode("PAIRING_SCOPE_DENIED","This capability is not valid for private rivalry pairing.");
    if(invite.data.createdByAccountId===accountId)throw errorWithCode("PAIRING_CREATOR_CANNOT_REDEEM","This Google account made the code, so it cannot join it. Nik must sign in with a different Google account than Daniel, then paste the code again.");
    if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
    const expiresAt=timestampMillis(invite.data.expiresAt);
    if(!Number.isFinite(expiresAt)||expiresAt<=nowEpochMs)throw errorWithCode("PAIRING_CAPABILITY_EXPIRED","This private pairing code has expired.");
    if(invite.data.slotId!==binding.managerRole)throw errorWithCode("PAIRING_SLOT_MISMATCH",`This code is for ${invite.data.slotId==="playerOne"?"Daniel":"Nik"}. Choose ${invite.data.slotId==="playerOne"?"Daniel":"Nik"} for this phone on Home, then join again.`);
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
    const durableWitness=options.durableWitness;
    if(durableWitness!==undefined&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","The durable pairing witness is invalid.");
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
      let durableWitnessResult=null;
      if(durableWitness){
        durableWitnessResult=await durableWitness({transaction,firestore:options.firestore,firebaseSdk:sdk,accountId,identity,binding,capability,now,nowEpochMs,rivalry,invite});
        if(!durableWitnessResult||durableWitnessResult.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The account pairing witness could not be committed with redemption.");
      }
      const nextSlots=rivalry.data.managerSlots.map(slot=>slot.slotId===invite.data.slotId?{slotId:slot.slotId,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{...slot});
      const rivalryData={...rivalry.data,connectionState:"active",managerSlots:nextSlots,authorizedAccountIds:[invite.data.createdByAccountId,accountId]};
      const inviteData={...invite.data,state:"redeemed",redeemedByAccountId:accountId,redeemedAt:now,revokedAt:null};
      const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:rivalry.revision+1,parentRevision:rivalry.revision,priorContentHash:rivalry.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
      const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
      transaction.set(rivalryReference,rivalryEnvelope);
      transaction.set(inviteReference,inviteEnvelope);
      return {revision:rivalryEnvelope.revision,slotId:invite.data.slotId,durableWitness:durableWitnessResult};
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
    const services=pairingServices&&pairingServices.ok===true?pairingServices:(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
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
      // r75: initialize() runs on many screens; once this page has verified this account+device, re-verify at most every
      // 10 minutes, after an account change or after any registration error, instead of a transaction on every call.
      const verifiedKey=`${context.accountState.accountId}|${context.identity.deviceId}`;
      const recentlyVerified=pairingState.registered===true&&deviceVerified&&deviceVerified.key===verifiedKey&&Date.now()-deviceVerified.at<DEVICE_REVERIFY_MS;
      if(!recentlyVerified){
        deviceVerified=null;
        const result=await registerDevice({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,cryptoImpl:root.crypto});
        if(!result.ok)throw errorWithCode(result.code,result.message);
        deviceVerified={key:verifiedKey,at:Date.now()};
      }
      const preservePairingState=preservePairingStateAtStart||["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
      if(preservePairingState){
        // r75: a re-check that confirms what the panel already shows does not rebuild it (that only replaced the open
        // pairing code and its COPY button under the manager's finger); listeners are still told.
        const next={initialized:true,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId};
        const unchanged=Object.keys(next).every(key=>pairingState[key]===next[key]);
        return setState(next,unchanged?{render:false}:{});
      }
      return setState({status:"ready",initialized:true,busy:false,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId,message:"This browser is privately registered. Pairing only links the two manager identities; gameplay synchronization is still locked."});
    }catch(error){deviceVerified=null;return setState({status:error&&error.code==="PRIVATE_DEVICE_REVOKED"?"revoked":"device-error",initialized:true,busy:false,connected:true,registered:false,message:`${error&&error.message?error.message:"This browser could not be registered."}`});}
  }

  async function initialize(){
    if(pairingInitializePromise)return pairingInitializePromise;
    pairingInitializePromise=(async()=>{
      const account=root.CareerModeSparkConnectedAccount;
      if(!account||typeof account.getState!=="function")return setState({status:"account-unavailable",initialized:true,busy:false,connected:false,registered:false,message:"Private pairing is unavailable right now."});
      if(!pairingAccountUnsubscribe&&typeof account.subscribe==="function"){
        pairingAccountUnsubscribe=account.subscribe(next=>{
          if(!next||next.connected!==true){pairingServices=null;pairingJoinDraft="";setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,selectedBindingKey:null,capability:null,expiresAtEpochMs:null,message:"Sign in above to register this browser and use private pairing."});}
          else if(pairingState.accountId!==next.accountId){pairingServices=null;pairingJoinDraft="";setState({selectedBindingKey:null,capability:null,expiresAtEpochMs:null});void registerCurrentDevice();}
          else if(pairingState.registered!==true){void registerCurrentDevice();}
        });
      }
      const current=account.getState();
      if(!current||current.connected!==true){pairingJoinDraft="";return setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,message:"Sign in above to register this browser and use private pairing."});}
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
  function joinEditorCanStayMounted(){
    const input=root.document&&root.document.getElementById(JOIN_INPUT_ID);
    if(!input||root.document.activeElement!==input||input.readOnly)return false;
    const account=root.CareerModeSparkConnectedAccount&&typeof root.CareerModeSparkConnectedAccount.getState==="function"?root.CareerModeSparkConnectedAccount.getState():null;
    if(!account||account.connected!==true||!account.accountId||account.accountId!==pairingState.accountId)return false;
    if(pairingState.registered!==true)return false;
    if(["paired","revoked","signed-out","account-unavailable","device-error"].includes(pairingState.status))return false;
    return true;
  }
  function flushDeferredJoinRender(){
    if(!pairingJoinRenderDeferred)return;
    pairingJoinRenderDeferred=false;
    root.setTimeout(()=>{
      const active=root.document&&root.document.activeElement;
      if(active&&active.id===JOIN_INPUT_ID)return;
      renderPanel();
    },0);
  }

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
    if(joinEditorCanStayMounted()){
      const input=root.document.getElementById(JOIN_INPUT_ID);pairingJoinDraft=input?input.value:pairingJoinDraft;pairingJoinRenderDeferred=true;
      const liveStatus=panel.querySelector('[role="status"]');if(liveStatus)liveStatus.textContent=pairingState.message;
      return panel;
    }
    pairingJoinRenderDeferred=false;
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
      const codeInput=createElement("input","settingsConnectedAccountInput");codeInput.id=JOIN_INPUT_ID;codeInput.type="text";codeInput.placeholder="Paste private pairing code";codeInput.autocomplete="off";codeInput.spellcheck=false;codeInput.setAttribute("aria-label","Private pairing code");
      if(pairingState.status==="paired"&&pairingState.capability){codeInput.value=pairingState.capability;codeInput.readOnly=true;codeInput.setAttribute("aria-readonly","true");}
      else codeInput.value=pairingJoinDraft;
      codeInput.addEventListener("input",()=>{pairingJoinDraft=codeInput.value;});
      codeInput.addEventListener("blur",flushDeferredJoinRender);
      const joinButton=createElement("button","menuButton settingsConnectedAccountButton","JOIN PRIVATE PAIRING");joinButton.type="button";joinButton.disabled=pairingState.busy||!bindings.length||pairingState.status==="paired";
      createButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        setState({status:"creating-pair",busy:true,selectedBindingKey:bindingKey(binding),capability:null,expiresAtEpochMs:null,message:"Creating a private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);setState({status:"pair-open",busy:false,capability:result.capability,expiresAtEpochMs:result.expiresAtEpochMs,message:"Pairing code created. Share it directly with your friend. Connected Rivalry below is prefilled automatically. After the second manager joins, do not manually attach in the normal flow: return to Save Library or open Private Remote Joining and the same rivalry will verify and attach automatically. The pairing code still expires in 15 minutes and can be used once."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${error&&error.message?error.message:"Private pairing could not be created."} Your Showdowns were not changed.`});}
      });
      joinButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        pairingJoinDraft=codeInput.value;
        setState({status:"joining-pair",busy:true,selectedBindingKey:bindingKey(binding),message:"Redeeming the private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await redeemPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,capability:pairingJoinDraft,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);pairingJoinDraft="";setState({status:"paired",busy:false,capability:result.capability,expiresAtEpochMs:null,message:"Private managers are paired. The one code pasted above is retained as the exact Connected Rivalry ID, and Connected Rivalry below uses that same value automatically; no second copy, paste, or manual Attach is required in the normal flow."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${pairingJoinErrorMessage(error)} Your Showdowns were not changed.`});}
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
    stableJoinEditor:true,
    generateDeviceIdentity,
    validDeviceIdentity,
    getOrCreateDeviceIdentity,
    resetDeviceIdentityCache,
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
// Firestore budget layer (r75). Connected modules wrap the services they get from the runtime with
// CareerModeFirestoreBudget.services(...). Only firestoreSdk.runTransaction changes (plus read metering, r85); every poll keeps its cadence.
// 1. A transaction that only reads ends without a commit RPC, so it no longer sends one "verify" write per document it
//    read (the 2026-10-12 incident counted ~7K such writes in one hour). A transaction that writes commits exactly as before.
// 2. A read-only transaction first runs against recent reads. A document read in the last 2 s is reused, so a burst of
//    refreshes from several screens costs one read per document. When nobody waits (no tap in the last 5 s, no screen
//    waiting on the partner without a healthy listener, no fast check running) the background checks reuse documents for up
//    to 60 s. A check that sees a changed document re-runs on fresh reads only, so it never mixes old and new documents. This
//    account's own account and device documents (only this account can change them) are reused for 5 minutes. A document
//    this page wrote, a page that became visible again and any write all go to the server. Reads of the same document that
//    are in flight together share one request. If the transaction wants to write, it runs as a normal server transaction.
// 3. A "resource-exhausted" answer (the free daily limit) pauses all Firestore traffic from this page for 10 minutes
//    (then 20, 40, 60) and publishes one plain message for the screens that would otherwise show a misleading error.
(function(root){
  "use strict";
  if(!root||root.CareerModeFirestoreBudget)return;
  const FSB_QUOTA_MESSAGE="Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.";
  const FSB_PAUSE_STEPS_MS=Object.freeze([10,20,40,60].map(minutes=>minutes*60000));
  const FSB_COALESCE_MS=2000,FSB_OWN_ACCOUNT_MS=5*60000,FSB_MAX_ENTRIES=200;
  const FSB_LIVE_QUIET_MS=300000;
  // r84: while the only screens watching are open on their own turn (Transfer window/guesses/signings, Season Results entry),
  // and not waiting on the partner, their listener is trusted for 2 min between server checks (30 s while waiting on the partner).
  // A partner's move still arrives at once through the listener, whose delivery forgets every other copy; a tap still reads fresh.
  const FSB_RELAXED_CONFIRM_MS=120000;
  const FSB_QUIET_MS=60000,FSB_INPUT_FRESH_MS=5000,FSB_ASK_MS=7000,FSB_FAST_GAP_MS=6000,FSB_FAST_HOLD_MS=10000;
  // fsbServerNext: documents whose next read must reach the server (no copy, no read already in flight), set by readServerNext.
  const fsbServerNext=new Map();
  const fsbWrapped=new WeakMap(),fsbEntries=new Map(),fsbInflight=new Map(),fsbCadence=new Map(),fsbWaitAsks=new Map(),fsbFreshPaths=new Map();
  const fsbStats={immutableReuses:0,reusedReads:0,quietReuses:0,freshReruns:0,serverReads:0,serverTransactions:0,readOnlyWithoutCommit:0,quotaTrips:0,pausedRefusals:0,brakeTrips:0,brakeSince:0,listenersAttached:0,listenerDeliveries:0,listenerServed:0,listenerFallbacks:0,peekWrites:0,transactionKept:0,contextServed:0,directReads:0,directFailures:0,deniedRefusals:0};
  let fsbPause=null,fsbResumeTimer=null,fsbAccountId=null,fsbFirestore=null,fsbInputAt=0,fsbFreshAskAt=0,fsbChainAt=0;
  // After the listener sees the partner's move (or the page comes back from hidden) every screen re-checks in a short chain
  // (commit -> scoring -> history -> final result). A document read after that moment already reflects it, so for the next
  // 6 s the chain reuses it instead of reading it again for each screen.
  const FSB_CHAIN_MS=6000;
  // r84 read brake and daily count (Nik 2026-10-26: 25 seasons a day must be a real floor). Every server read and listener
  // delivery this page makes is counted, per minute and per Google day (Pacific, resets 3 am Boston). When nobody has
  // tapped for a minute and this page made 150+ reads in the last 5 minutes (normal waiting is 5-30), background checks
  // reuse every copy for at least 15 s until the next tap: an unknown loop costs at most a few reads a minute instead of the day's allowance.
  // Taps, writes, readServerNext and a healthy listener are untouched, so play stays instant; the brake lets go by itself.
  const FSB_BRAKE_WINDOW_MS=5*60000,FSB_BRAKE_READS=150,FSB_BRAKE_IDLE_MS=60000,FSB_BRAKE_REUSE_MS=15000;
  const FSB_DAY_KEY="careerModeFirestoreReadsDay",FSB_DAY_SAVE_EVERY=20,FSB_BILLED_PER_READ=2.8,FSB_FREE_READS_PER_DAY=50000,FSB_DAY_SEASONS=20,FSB_DEFAULT_SEASON_READS=135;
  // r86 reads accuracy (Nik 2026-10-28): what Google bills against the free 50,000 is every document read PLUS every document
  // the Security Rules look up (get()/exists()) to allow a read or a write. r84/r85 multiplied this phone's document reads by
  // 2.8; now each request is priced by its own path from this table, generated from the composed production Rules by
  // tests/browser/support/rules-lookups.cjs (the CE2PG billed meter prices with the same derivation, so phone and test agree):
  //   [path pattern, lookups of a read while the Showdown is live, lookups once it is finished, documents a write may look up].
  // A live Showdown's read stops at its first allow branch (the rivalry); a finished one also checks the signed-in account.
  // A listener's Rules are evaluated when it starts and again each time its results update or it comes back online (Firebase
  // pricing, "Listeners and rules"), so every server delivery is billed its document plus its lookups. A write is priced at
  // every document its create or update rule can reach, once per request (a transaction is one request): an upper bound.
  // tests/contracts/r86-billed-counter-contracts.cjs fails when the Rules change and this table is not regenerated.
  const FSB_RULES_SHA256="4585bc97941abf4b251fbe8dea7d0684850aec62e557369ebcc7242e6aff4c7e";
  // BEGIN generated Rules lookup table (paths are priced here, never read or written by this module).
  const FSB_RULES_LOOKUPS=Object.freeze([
      ["accounts/*",0,0,[]],
      ["accounts/*/profileLinks/*",0,0,[]],
      ["accounts/*/devices/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}"]],
      ["accounts/*/securityEvents/*",0,0,[]],
      ["accounts/*/pairLinks/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current","rivalries/{after.data.rivalryId}","rivalries/{before.data.rivalryId}","rivalries/{before.data.rivalryId}/invites/{before.data.rivalryId}"]],
      ["accounts/*/careerIndex/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current","accounts/{accountId}/careerIndex/{'page_'+stringafter.data.sealedPageCount}","accounts/{accountId}/pairLinks/current","accounts/{before.createdByAccountId}/careerIndex/current","rivalries/{@pair0}","rivalries/{next[prior.size]}"]],
      ["accounts/*/careerStart/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current"]],
      ["accounts/*/partner/*",0,0,["accounts/{@self}","accounts/{accountId}/careerStart/current","rivalries/{after.pairedViaRivalryId}","rivalries/{request.resource.data.pairedViaRivalryId}"]],
      ["accounts/*/partnerInbox/*",0,0,["accounts/{@self}","accounts/{@self}/partner/current","accounts/{accountId}/partner/current","rivalries/{note.rivalryId}","rivalries/{note.rivalryId}/invites/{note.rivalryId}"]],
      ["accounts/*/careerSummary/*",1,1,["accounts/{@self}","rivalries/{rivalryId}"]],
      ["rivalries/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{@self}/pairLinks/current","rivalries/{rivalryId}/invites/{rivalryId}","rivalries/{rivalryId}/seasonCommits/season_1","rivalries/{rivalryId}/seasonCommits/{seasonId}","rivalries/{rivalryId}/sessions/{intent.sessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/state/authoritative",1,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/state/authoritative/idempotency/{receiptKey}"]],
      ["rivalries/*/state/authoritative/idempotency/*",2,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}/state/authoritative"]],
      ["rivalries/*/invites/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
      ["rivalries/*/sharedSetup/authoritative",1,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}"]],
      ["rivalries/*/sharedSetup/leagueProjection",1,1,["accounts/{@self}","rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/careerStart/authoritative",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/transferChallenges/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/careerStart/authoritative","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/transferChallenges/{transferId}/roles/{role}"]],
      ["rivalries/*/transferChallenges/*/roles/*",2,3,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
      ["rivalries/*/seasonResults/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{role}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/leagueProjection"]],
      ["rivalries/*/seasonResults/*/roles/*",2,3,["rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}"]],
      ["rivalries/*/seasonCommits/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerOne'}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerTwo'}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/meters/*",1,2,["rivalries/{rivalryId}"]],
      ["rivalries/*/sessions/*",2,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
      ["rivalries/*/sessionOffers/*",1,1,["accounts/{@pair0}","accounts/{@pair1}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{offer.sessionId}"]]
  ].map(row=>Object.freeze([Object.freeze(row[0].split("/")),row[1],row[2],Object.freeze(row[3])])));
  // END generated Rules lookup table.
  // A query (no single document path) is priced at one lookup per request: the signed-in account.
  const FSB_QUERY_LOOKUPS=1;
  // One season on one phone, game screens only (career pages are counted apart), documents + lookups, waits included: the
  // CE2PG billed measurement (npm run test:budget, 2026-10-29, mid pace, listener lookups on every update) of a 3-season
  // Showdown was 991 + 614 + 773 billed for both phones (first season with Start and Setup, a middle one, the last with
  // Final): about 400 per phone per season. Used until a season has been played on this phone.
  const FSB_DEFAULT_SEASON_BILLED=400;
  const fsbLookupCache=new Map();
  function fsbLookupRow(path){
    if(typeof path!=="string"||!path)return null;
    if(fsbLookupCache.has(path))return fsbLookupCache.get(path);
    const parts=path.replace(/^\/+/,"").split("/");
    const row=FSB_RULES_LOOKUPS.find(([pattern])=>pattern.length===parts.length&&pattern.every((part,index)=>part==="*"||part===parts[index]))||null;
    fsbLookupCache.set(path,row);if(fsbLookupCache.size>FSB_MAX_ENTRIES)fsbLookupCache.delete(fsbLookupCache.keys().next().value);
    return row;
  }
  function fsbReadLookups(path,finished=false){const row=fsbLookupRow(path);return row?row[finished?2:1]:FSB_QUERY_LOOKUPS;}
  // RE-08 (r87): one request is billed each distinct document once. The table's templates are already canonical (root.* is after.*,
  // the written rivalryId is the match's); across the documents of one request the signed-in account is one of the pair's two.
  function fsbWriteLookups(paths){const docs=new Set();for(const path of paths){const row=fsbLookupRow(path);if(row)for(const doc of row[3])docs.add(doc);}if(docs.has("accounts/{@pair0}")||docs.has("accounts/{@pair1}")){docs.delete("accounts/{@self}");docs.delete("accounts/{accountId}");}else if(docs.has("accounts/{@self}"))docs.delete("accounts/{accountId}");return docs.size;}
  // Today's billed reads on this phone, kept apart: game screens (including every write's lookups) and career pages
  // (History, Legacy, Trophy Room, Statistics, Rivalry, Season Final history: the direct gets of finished Showdowns).
  function fsbBill(units,career=false){
    if(!(units>0))return;
    const bill=fsbDayState().bill;
    if(career)bill.career+=units;else bill.game+=units;
    fsbDayUnsaved+=1;if(fsbDayUnsaved>=FSB_DAY_SAVE_EVERY)fsbSaveDay();
  }
  function fsbBillCost(bill){const costs=bill&&Array.isArray(bill.costs)?bill.costs.slice(-3):[];return costs.length?Math.round(costs.reduce((sum,cost)=>sum+cost,0)/costs.length):0;}
  // A season that runs past the Google day keeps its billed reads from before the reset (the new mark starts below 0 by them).
  // r87 (B2): role is this phone's manager role (kept across days: Daniel is always playerOne); setupCosts are the billed game reads
  // before a Showdown's first season starts (RE-05); startKey is the season whose start mark was taken; own and partner are the
  // two shared meter documents of today (fsbShare*).
  function fsbBillNextDay(bill){return {game:0,career:0,markGame:-Math.max(0,bill.game-bill.markGame),costs:[],lastCost:fsbBillCost(bill)||bill.lastCost||0,role:fsbShareRole(bill.role),setupCosts:[],startKey:null,own:null,partner:null};}
  function fsbBillFrom(saved,today){
    const old=saved&&saved.bill&&typeof saved.bill==="object"?saved.bill:null,whole=value=>Number.isFinite(value)?Math.floor(value):0;
    const costs=old&&Array.isArray(old.costs)?old.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS):[];
    const lastCost=Math.max(0,whole(old&&old.lastCost)),role=fsbShareRole(old&&old.role);
    if(!saved)return {game:0,career:0,markGame:0,costs:[],lastCost:0,role:null,setupCosts:[],startKey:null,own:null,partner:null};
    if(saved.day!==today)return fsbBillNextDay({game:Math.max(0,whole(old&&old.game)),markGame:whole(old&&old.markGame),costs,lastCost,role});
    // A day first counted before r86 holds document reads only: they stay priced at the old 2.8 until that day ends.
    const game=old?Math.max(0,whole(old.game)):Math.round(Math.max(0,whole(saved.reads))*FSB_BILLED_PER_READ);
    const setupCosts=old&&Array.isArray(old.setupCosts)?old.setupCosts.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS):[];
    const own=fsbShareClean(old&&old.own),partner=fsbShareClean(old&&old.partner);
    return {game,career:old?Math.max(0,whole(old.career)):0,markGame:old&&whole(old.markGame)<=game?whole(old.markGame):game,costs,lastCost,role,setupCosts,startKey:old&&typeof old.startKey==="string"?old.startKey:null,own:own&&own.day===today?own:null,partner:partner&&partner.day===today?partner:null};
  }
  const fsbReadTimes=[];let fsbDay=null,fsbDayUnsaved=0,fsbDayStoreBroken=false;
  function fsbPacificDay(at){try{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(at));}catch(_error){return new Date(at-8*3600000).toISOString().slice(0,10);}}
  function fsbDayState(at=fsbNow()){
    const day=fsbPacificDay(at);
    if(!fsbDay){fsbDay={day,reads:0,markReads:0,seasons:[],costs:[],lastCost:0,bill:fsbBillFrom(null,day)};try{const saved=JSON.parse((typeof root.readStorageValue==="function"&&root.readStorageValue(FSB_DAY_KEY))||"null");fsbDay.bill=fsbBillFrom(saved,day);if(saved&&Number.isFinite(saved.lastCost)&&saved.lastCost>0)fsbDay.lastCost=Math.floor(saved.lastCost);if(saved&&saved.day!==day){if(fsbSeasonCost(saved))fsbDay.lastCost=fsbSeasonCost(saved);fsbDay.markReads=-fsbCarried(saved);}if(saved&&saved.day===day&&Number.isFinite(saved.reads)&&saved.reads>=0){fsbDay.reads=Math.floor(saved.reads);if(Number.isFinite(saved.markReads)&&saved.markReads<=fsbDay.reads)fsbDay.markReads=Math.floor(saved.markReads);if(Array.isArray(saved.seasons))fsbDay.seasons=saved.seasons.filter(key=>typeof key==="string").slice(-FSB_DAY_SEASONS);if(Array.isArray(saved.costs))fsbDay.costs=saved.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS);}}catch(_error){}}
    if(fsbDay.day!==day){fsbDay={day,reads:0,markReads:-fsbCarried(fsbDay),seasons:[],costs:[],lastCost:fsbSeasonCost(fsbDay)||fsbDay.lastCost||0,bill:fsbBillNextDay(fsbDay.bill)};fsbDayUnsaved=1;}
    return fsbDay;
  }
  // Saved through storage.js (the only module that touches browser storage); a failed write stops further saves so a
  // private window never repeats the storage notice. The count is a per-device convenience, never game state.
  function fsbSaveDay(){if(!fsbDay||!fsbDayUnsaved||fsbDayStoreBroken||typeof root.writeStorageValue!=="function")return;fsbDayUnsaved=0;try{if(root.writeStorageValue(FSB_DAY_KEY,JSON.stringify(fsbDay))===false)fsbDayStoreBroken=true;}catch(_error){fsbDayStoreBroken=true;}}
  // brake=false: the read counts toward today's total only, not the 5-minute brake window (direct career-history gets, r85).
  // lookups: the Rules lookups this request is billed (fsbReadLookups); career: a career-page read (fsbBill).
  function fsbCountRead(count=1,brake=true,lookups=0,career=false){
    if(!(count>0))return;
    const at=fsbNow(),day=fsbDayState(at);
    if(brake)for(let index=0;index<count;index+=1)fsbReadTimes.push(at);
    while(fsbReadTimes.length&&at-fsbReadTimes[0]>FSB_BRAKE_WINDOW_MS)fsbReadTimes.shift();
    if(fsbReadTimes.length>FSB_BRAKE_READS*4)fsbReadTimes.splice(0,fsbReadTimes.length-FSB_BRAKE_READS*4);
    day.reads+=count;fsbDayUnsaved+=count;
    fsbBill(count+(lookups>0?lookups:0),career);
    if(fsbDayUnsaved>=FSB_DAY_SAVE_EVERY)fsbSaveDay();
  }
  function fsbBraking(at=fsbNow()){
    if(at-fsbInputAt<FSB_BRAKE_IDLE_MS){fsbStats.brakeSince=0;return false;}
    // Once on, the brake holds until someone taps, so a loop cannot burst again each time the 5-minute window drains.
    if(fsbStats.brakeSince&&fsbInputAt<fsbStats.brakeSince)return true;
    while(fsbReadTimes.length&&at-fsbReadTimes[0]>FSB_BRAKE_WINDOW_MS)fsbReadTimes.shift();
    const on=fsbReadTimes.length>=FSB_BRAKE_READS;
    if(on&&!fsbStats.brakeSince)fsbStats.brakeTrips+=1;
    fsbStats.brakeSince=on?(fsbStats.brakeSince||at):0;
    return on;
  }
  // r86: thisPhone, game and career are this phone's own billed reads (documents + Rules lookups); billedEstimate is both phones.
  // Red team #9: career pages are never scaled, since only the phone that opens History or Legacy pays for them.
  // r87 (B2): with both phones' meter documents of today for the same season, billedEstimate is their sum, exactly the same number
  // on both phones (shared: the two documents, this phone's and the partner's, as of that season's ACKNOWLEDGED); otherwise it is the
  // B1 role-share estimate (estimated: true): this phone's game reads over its role's share of a season plus its career pages.
  function fsbReadsToday(){
    const day=fsbDayState(),bill=day.bill,here=bill.game+bill.career,shared=fsbShareFrom(bill.own,bill.partner,day.day);
    const mine=shared&&bill.own?fsbShareUsed(bill.own):null,estimate=Math.round(bill.game/fsbRoleShare(bill.role)+bill.career);
    return Object.freeze({day:day.day,reads:day.reads,billedEstimate:shared?shared.used:estimate,estimated:!shared,role:bill.role,
      shared:shared?Object.freeze({used:shared.used,season:shared.season,thisPhone:mine,partner:shared.used-mine,sinceThisPhone:Math.max(0,Math.round(here)-mine)}):null,
      thisPhone:Math.round(here),game:Math.round(bill.game),career:Math.round(bill.career),freeReadsPerDay:FSB_FREE_READS_PER_DAY});
  }
  // r84: seasons left today. Each season this page sees ACKNOWLEDGED records the reads it made since the previous one, so
  // the cost per season follows the pace actually played (a slow season waits longer and costs more). The partner's device
  // is assumed to cost the same. Until a season is finished today, the last day's average (or the r84 measured cost) is used.
  // r85: that measured cost is the r84 check trim's (gameplay/r84/CHECK_TRIM_PLAN.md: about 720-770 billed reads per season for
  // both phones, so about 135 reads per device at the 2.8 billed-per-read rate the composed Rules still give). The pre-trim 450
  // made a fresh device show about a third of the real seasons left.
  // A season that runs past the Google day keeps its reads from before the reset: the new day's mark starts below 0 by them.
  function fsbCarried(day){const reads=Number(day&&day.reads),mark=Number(day&&day.markReads);return Number.isFinite(reads)&&reads>0?Math.max(0,Math.floor(reads-(Number.isFinite(mark)?mark:0))):0;}
  function fsbSeasonCost(day){const costs=day&&Array.isArray(day.costs)?day.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-3):[];return costs.length?Math.round(costs.reduce((sum,cost)=>sum+cost,0)/costs.length):0;}
  // r87 RE-05 / RS-07: a Showdown's first season starts when Career Start is ready on this phone (noteSeasonStart, key
  // "rivalryId|1"). What this phone billed before it (Home, the pair wait and JOIN, setup, Special Player, Career Start, the
  // previous Showdown's tail) goes to setupCosts and never into a season's cost.
  function fsbNoteSeasonStart(key){
    if(typeof key!=="string"||!key)return false;
    const day=fsbDayState(),bill=day.bill;
    if(bill.startKey===key||day.seasons.includes(key))return false;
    const setup=bill.game-bill.markGame;
    if(setup>0){bill.setupCosts.push(setup);if(bill.setupCosts.length>FSB_DAY_SEASONS)bill.setupCosts.shift();}
    bill.startKey=key;bill.markGame=bill.game;fsbDayUnsaved+=1;fsbSaveDay();
    return true;
  }
  // info (r87): {role, season, rivalryId, firestore} from Season Commit. role is kept for the B1 estimate; with firestore this phone
  // writes its meter document and reads the partner's (fsbShareSeason). Without info (an older caller) nothing is written.
  function fsbNoteSeasonDone(key,live,info){
    if(typeof key!=="string"||!key)return false;
    const day=fsbDayState();
    if(day.seasons.includes(key))return false;
    const cost=day.reads-day.markReads;
    day.seasons.push(key);if(day.seasons.length>FSB_DAY_SEASONS)day.seasons.shift();
    // A commit first seen already ACKNOWLEDGED (a reload, an older season) only moves the mark: its cost is unknown.
    if(live===true&&cost>0){day.costs.push(cost);if(day.costs.length>FSB_DAY_SEASONS)day.costs.shift();}
    const bill=day.bill,billed=bill.game-bill.markGame,role=fsbShareRole(info&&info.role);
    const season=Number.isInteger(info&&info.season)?info.season:Number(String(key).split("|").pop());
    if(role)bill.role=role;
    // Season 1 counts only from its start mark; without one (a reload during the season) it only moves the mark.
    const steady=season>1||bill.startKey===key;
    if(live===true&&billed>0&&steady){bill.costs.push(billed);if(bill.costs.length>FSB_DAY_SEASONS)bill.costs.shift();}
    bill.markGame=bill.game;bill.startKey=null;
    day.markReads=day.reads;fsbDayUnsaved+=1;fsbSaveDay();
    try{fsbShareSeason(info,season);}catch(_error){}
    return true;
  }
  // r86: a season's cost is this phone's billed GAME reads between two ACKNOWLEDGED seasons (career pages opened meanwhile are
  // not part of it); what is left is the 50,000 less today's use of both phones.
  // r87 (B2): from both phones' meter documents, a season costs the two phones' recent season costs added up (each phone's average
  // of its last three, fsbShareFrom), the same on both phones. Without them (estimated) it is this phone's cost over its role's share.
  function fsbSeasonsLeftToday(){
    const day=fsbDayState(),bill=day.bill,shared=fsbShareFrom(bill.own,bill.partner,day.day);
    if(shared)return Object.freeze({seasons:fsbPaused()?0:shared.seasons,basis:"shared",estimated:false,season:shared.season,billedPerSeason:shared.perSeason,billedLeft:shared.left,billedToday:shared.used});
    const share=fsbRoleShare(bill.role),measured=fsbBillCost(bill),perPhone=measured||bill.lastCost||FSB_DEFAULT_SEASON_BILLED;
    const perSeason=perPhone/share,used=bill.game/share+bill.career,left=Math.max(0,FSB_FREE_READS_PER_DAY-used);
    return Object.freeze({seasons:fsbPaused()?0:Math.floor(left/perSeason),basis:measured?"today":bill.lastCost?"earlier":"estimate",estimated:true,season:null,billedPerSeason:Math.round(perSeason),billedLeft:Math.round(left),billedToday:Math.round(used)});
  }

  // r87 shared reads meter (B2). Each phone writes ONE small document, rivalries/{rid}/meters/{its role}, once a season when it
  // sees the season commit ACKNOWLEDGED: today's billed game and career reads of this phone (cumulative, Pacific day) and its last
  // three season costs. It reads the partner's document once, 8 s later (the partner sees the same ACKNOWLEDGED within seconds),
  // and once more 45 s later only if that document is not yet at the same season. Both phones then hold the same two documents and
  // compute the same total, cost per season and seasons left from them (fsbShareFrom orders them by role). Cost: one write (1 Rules
  // lookup: the rivalry) and one read (1 document + 1 lookup; 2 once the Showdown is Terminal-Closed, when the final season's read
  // lands) per phone per season, billed as game reads here. A refused first write of the day (Rules not deployed yet) stops the
  // meter for the day; a refused read, or a write refused after one succeeded, skips only that season; the partner's document missing (an older build never writes it), from another day,
  // or behind this phone's season: the B1 estimate, marked estimated. Never part of a game write, never a reason for an error.
  // Reads of the partner's document: 8 s after this phone's write, again 45 s later; a partner whose document exists but is behind
  // (a phone that was locked when the season was acknowledged) is read again at +3 and +10 min, then not again that season. A
  // missing document (an older build, or Rules not deployed) is read twice only.
  // B1 shares of a season's reads, measured on the CE2PG harness (READS_ESTIMATE_CONSISTENCY.md): the coordinator (Daniel, playerOne)
  // starts, locks and commits, so his phone reads about 55%.
  const FSB_ROLE_SHARE=Object.freeze({playerOne:0.55,playerTwo:0.45});
  const FSB_SHARE_READS_MS=Object.freeze([8000,45000,180000,600000]),FSB_SHARE_MISSING_READS=2;
  let fsbShareTimer=null,fsbShareOffDay=null,fsbRawSdk=null;
  function fsbShareRole(role){return role==="playerOne"||role==="playerTwo"?role:null;}
  function fsbRoleShare(role){return FSB_ROLE_SHARE[role]||0.5;}
  function fsbShareWhole(value,max){return Number.isInteger(value)&&value>=0&&value<=max;}
  // A meter document as the Rules allow it (updatedAt aside), or null.
  function fsbShareClean(value){
    if(!value||typeof value!=="object")return null;
    const out={schemaVersion:value.schemaVersion,objectType:value.objectType,rivalryId:value.rivalryId,role:value.role,day:value.day,season:value.season,game:value.game,career:value.career,costs:Array.isArray(value.costs)?value.costs.slice():null};
    if(out.schemaVersion!==1||out.objectType!=="readsMeter"||typeof out.rivalryId!=="string"||!/^pair_[0-9a-f]{64}$/.test(out.rivalryId)||!fsbShareRole(out.role))return null;
    if(typeof out.day!=="string"||!/^20\d{2}-\d{2}-\d{2}$/.test(out.day)||!Number.isInteger(out.season)||out.season<1||out.season>10)return null;
    if(!fsbShareWhole(out.game,1000000)||!fsbShareWhole(out.career,1000000)||!out.costs||out.costs.length>3||!out.costs.every(cost=>Number.isInteger(cost)&&cost>0&&cost<=100000))return null;
    return Object.freeze({...out,costs:Object.freeze(out.costs)});
  }
  function fsbShareUsed(doc){return doc.game+doc.career;}
  function fsbShareCost(doc){return doc.costs.length?Math.round(doc.costs.reduce((sum,cost)=>sum+cost,0)/doc.costs.length):FSB_DEFAULT_SEASON_BILLED;}
  // Pure: the both-phones figures from the two documents, or null when they are not today's documents of the two roles of one
  // rivalry at one season. Ordered by role, so either phone (and either argument order) gives the same answer.
  function fsbShareFrom(a,b,today){
    const x=fsbShareClean(a),y=fsbShareClean(b);
    if(!x||!y||x.role===y.role||x.day!==today||y.day!==today||x.rivalryId!==y.rivalryId||x.season!==y.season)return null;
    const one=x.role==="playerOne"?x:y,two=x.role==="playerOne"?y:x;
    const used=fsbShareUsed(one)+fsbShareUsed(two),perSeason=fsbShareCost(one)+fsbShareCost(two),left=Math.max(0,FSB_FREE_READS_PER_DAY-used);
    return Object.freeze({used,perSeason,left,seasons:Math.floor(left/perSeason),season:one.season,playerOne:fsbShareUsed(one),playerTwo:fsbShareUsed(two)});
  }
  // This phone's document now: its last three season costs, or the cost it carries from an earlier day when none is measured yet.
  function fsbShareDoc(bill,day,rivalryId,season,role){
    const costs=bill.costs.slice(-3).map(cost=>Math.min(100000,Math.round(cost))).filter(cost=>cost>0);
    if(!costs.length&&bill.lastCost>0)costs.push(Math.min(100000,Math.round(bill.lastCost)));
    return fsbShareClean({schemaVersion:1,objectType:"readsMeter",rivalryId,role,day,season,game:Math.min(1000000,Math.round(bill.game)),career:Math.min(1000000,Math.round(bill.career)),costs});
  }
  // The raw (unmetered) getDoc/setDoc: the runtime's SDK when it has them (tests), otherwise the Firestore module the listeners
  // load from the runtime's own URL (one SDK instance). Billed here by hand, as game reads.
  async function fsbShareApi(){
    const usable=api=>api&&typeof api.doc==="function"&&typeof api.getDoc==="function"&&typeof api.setDoc==="function"&&typeof api.serverTimestamp==="function"?api:null;
    if(usable(fsbRawSdk))return fsbRawSdk;
    if(!usable(fsbSnapshotApi))await fsbLoadSnapshotApi();
    return usable(fsbSnapshotApi);
  }
  function fsbShareSeason(info,season){
    if(!info||typeof info!=="object"||!info.firestore||typeof info.rivalryId!=="string")return;
    const day=fsbDayState(),bill=day.bill,role=fsbShareRole(info.role);
    if(!role||fsbShareOffDay===day.day||fsbPaused())return;
    const doc=fsbShareDoc(bill,day.day,info.rivalryId,season,role);
    if(!doc)return;
    void fsbShareWrite(info.firestore,doc).then(written=>{if(written)fsbShareLater(info.firestore,doc,0);},()=>{});
  }
  async function fsbShareWrite(db,doc){
    const api=await fsbShareApi();
    if(!api)return false;
    const path=`rivalries/${doc.rivalryId}/meters/${doc.role}`;
    try{await api.setDoc(api.doc(db,"rivalries",doc.rivalryId,"meters",doc.role),{...doc,costs:[...doc.costs],updatedAt:api.serverTimestamp()});}
    // Refused before any write succeeded today: the Rules are not deployed yet, so the meter is off for the day. Refused after one
    // succeeded (a Showdown closed under this write): only this season is skipped.
    catch(error){if(fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups([path]));const now=fsbDayState();if(fsbIsDeniedError(error)&&!(now.day===doc.day&&now.bill.own))fsbShareOffDay=doc.day;if(fsbIsQuotaError(error))fsbTrip();return false;}
    fsbBill(fsbWriteLookups([path]));
    const day=fsbDayState();if(day.day===doc.day){day.bill.own=doc;fsbDayUnsaved+=1;fsbSaveDay();}
    return true;
  }
  function fsbShareLater(db,own,attempt){
    if(fsbShareTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(fsbShareTimer);
    fsbShareTimer=null;
    if(typeof root.setTimeout!=="function"||attempt>=FSB_SHARE_READS_MS.length)return;
    fsbShareTimer=root.setTimeout(()=>{fsbShareTimer=null;void fsbShareRead(db,own).then(({doc,seen,stop})=>{
      if(stop||(doc&&doc.season===own.season&&doc.rivalryId===own.rivalryId))return;
      if(!seen&&attempt+1>=FSB_SHARE_MISSING_READS)return;
      fsbShareLater(db,own,attempt+1);
    },()=>{});},FSB_SHARE_READS_MS[attempt]);
  }
  async function fsbShareReadPartner(db,own){return (await fsbShareRead(db,own)).doc;}
  // {doc: today's partner document or null, seen: a partner document exists (any day), stop: nothing more to read this season}.
  async function fsbShareRead(db,own){
    const day=fsbDayState();
    if(fsbShareOffDay===day.day||fsbPaused()||!own||day.bill.own!==own)return {doc:null,seen:false,stop:true};
    const api=await fsbShareApi();
    if(!api)return {doc:null,seen:false,stop:true};
    const role=own.role==="playerOne"?"playerTwo":"playerOne",path=`rivalries/${own.rivalryId}/meters/${role}`,lookups=fsbReadLookups(path);
    let snapshot;
    try{snapshot=await api.getDoc(api.doc(db,"rivalries",own.rivalryId,"meters",role));}
    catch(error){fsbCountRead(fsbMeterFailureUnits(error),false,lookups);const denied=fsbIsDeniedError(error),quota=fsbIsQuotaError(error);if(quota)fsbTrip();return {doc:null,seen:false,stop:denied||quota};}
    const units=fsbMeterUnits(snapshot);fsbCountRead(units,false,units?lookups:0);
    let doc=null;try{doc=snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?fsbShareClean(snapshot.data()):null;}catch(_error){doc=null;}
    const now=fsbDayState(),seen=Boolean(doc&&doc.role===role&&doc.rivalryId===own.rivalryId);
    if(seen&&doc.day===now.day){now.bill.partner=doc;fsbDayUnsaved+=1;fsbSaveDay();return {doc,seen,stop:doc.season>own.season};}
    return {doc:null,seen,stop:false};
  }

  // r85 (audit F04): ONE read meter. Before, only this layer's transactions and listener deliveries were counted, while the
  // career marker, the career index, the finished-Showdown reader and the Season Final history called getDoc taken straight
  // from the SDK: a cold career visit of 100 finished Showdowns made 601 gets and left readsToday at 0. Now every route ends
  // in fsbMeterUnits/fsbMeterFailureUnits -> fsbCountRead:
  //  - transactions run through this layer: one per document the server returns to the transaction (unchanged);
  //  - direct getDoc/getDocs/getDocFromServer/getDocsFromServer: services(...) meters them when the runtime hands them out,
  //    and every module that takes them from the Firestore module itself passes them through meterSdk(...) first;
  //  - listeners: this layer's own (wait point, context) and the unowned ones (season-commit wait context, Home JOIN note,
  //    which pass their onSnapshot through meterSdk) count each delivery here.
  // What is counted is REQUESTED SERVER DOCUMENT READS, the unit of the free daily limit:
  //  - a document from the server: 1 (a missing document is still one read);
  //  - a query answer from the server: 1 per returned document, at least 1 (an empty answer is billed one read); a later
  //    delivery of a query listener: 1 per changed document;
  //  - a snapshot served from the local cache (metadata.fromCache) or a listener's echo of this page's own pending write: 0;
  //  - a request the server answered with an error (denied by Rules, invalid, not found...): 1, as Firestore bills it; one that
  //    never got an answer (offline/unavailable, cancelled, deadline, quota) or failed in the page before the SDK sent it: 0.
  // Each function is metered once (fsbMetered), so an SDK object handed through several screens never counts a read twice.
  // Direct gets count toward today's total but not the brake window, so a long cold career visit never slows the live checks.
  // The count stays a per-device estimate: Rules lookups (the 2.8 factor), the partner's phone and other devices are not seen.
  const FSB_ANSWERED_ERRORS=new Set(["permission-denied","unauthenticated","invalid-argument","not-found","failed-precondition","out-of-range","already-exists","internal","data-loss","unimplemented"]);
  const fsbMetered=new WeakSet(),fsbMeteredSdks=new WeakMap();
  function fsbMeterUnits(snapshot,listener=false,later=false){
    if(!snapshot||typeof snapshot!=="object")return 0;
    const meta=snapshot.metadata;
    if(meta&&meta.fromCache===true)return 0;
    if(listener&&meta&&meta.hasPendingWrites===true)return 0;
    if(Array.isArray(snapshot.docs)){
      if(later&&typeof snapshot.docChanges==="function"){try{return snapshot.docChanges().length;}catch(_error){return 0;}}
      return Math.max(1,snapshot.docs.length);
    }
    return 1;
  }
  function fsbMeterFailureUnits(error){
    if(!error||typeof error!=="object"||error.quotaPaused)return 0;
    return FSB_ANSWERED_ERRORS.has(String(error.code||"").toLowerCase().replace(/^firestore\//,"").replace(/_/g,"-"))?1:0;
  }
  // Red team R87-B-06: a direct get (career index, summaries) that hits the daily quota trips the same online-play pause as a
  // transaction, so Home shows the notice and nothing keeps asking.
  function fsbGetFailed(error,lookups){fsbStats.directFailures+=1;fsbCountRead(fsbMeterFailureUnits(error),false,lookups,true);if(fsbIsQuotaError(error))fsbTrip();}
  function fsbMeterGet(get){
    if(typeof get!=="function"||fsbMetered.has(get))return get;
    const metered=function(...args){
      let pending;
      const lookups=fsbReadLookups(fsbPathOf(args[0]),true);
      try{pending=get.apply(this,args);}catch(error){fsbGetFailed(error,lookups);throw error;}
      return Promise.resolve(pending).then(snapshot=>{const units=fsbMeterUnits(snapshot);fsbStats.directReads+=units;fsbCountRead(units,false,lookups,true);return snapshot;},error=>{fsbGetFailed(error,lookups);throw error;});
    };
    fsbMetered.add(metered);
    return metered;
  }
  // onSnapshot(ref, [options], observer | onNext, [onError], [onCompletion]): the callbacks are wrapped, the call is unchanged.
  function fsbMeterListen(listen){
    if(typeof listen!=="function"||fsbMetered.has(listen))return listen;
    const metered=function(ref,...rest){
      let served=false;const path=fsbPathOf(ref);
      const next=fn=>function(snapshot){const units=fsbMeterUnits(snapshot,true,served),first=!served;if(units||snapshot&&snapshot.metadata&&snapshot.metadata.fromCache===false)served=true;fsbCountRead(units,true,first||units?fsbReadLookups(path):0);return fn.apply(this,arguments);};
      const fail=fn=>function(error){fsbCountRead(fsbMeterFailureUnits(error),true,served?0:fsbReadLookups(path));return fn.apply(this,arguments);};
      let functions=0;
      const args=rest.map(arg=>{
        if(typeof arg==="function"){functions+=1;return functions===1?next(arg):functions===2?fail(arg):arg;}
        if(functions===0&&arg&&typeof arg==="object"&&(typeof arg.next==="function"||typeof arg.error==="function")){
          const observer={...arg};if(typeof arg.next==="function")observer.next=next(arg.next.bind(arg));if(typeof arg.error==="function")observer.error=fail(arg.error.bind(arg));if(typeof arg.complete==="function")observer.complete=arg.complete.bind(arg);
          functions=3;return observer;
        }
        return arg;
      });
      return listen.call(this,ref,...args);
    };
    fsbMetered.add(metered);
    return metered;
  }
  // r86: a single setDoc/updateDoc outside this layer's transactions (the career summary a career page saves) is one write
  // request; its Rules lookups count toward today's career-page reads.
  function fsbMeterWrite(write){
    if(typeof write!=="function"||fsbMetered.has(write))return write;
    const metered=function(ref,...rest){
      const path=fsbPathOf(ref);
      return Promise.resolve(write.call(this,ref,...rest)).then(value=>{fsbBill(fsbWriteLookups([path]),true);return value;},error=>{if(fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups([path]),true);throw error;});
    };
    fsbMetered.add(metered);
    return metered;
  }
  const FSB_METERED_GETS=["getDoc","getDocs","getDocFromServer","getDocsFromServer"],FSB_METERED_WRITES=["setDoc","updateDoc"];
  function fsbMeterSdk(sdk){
    if(!sdk||typeof sdk!=="object"&&typeof sdk!=="function")return sdk;
    if(fsbMeteredSdks.has(sdk))return fsbMeteredSdks.get(sdk);
    const names=[...FSB_METERED_GETS,...FSB_METERED_WRITES,"onSnapshot"].filter(name=>typeof sdk[name]==="function"&&!fsbMetered.has(sdk[name]));
    if(!names.length)return sdk;
    const out={...sdk};
    for(const name of names)out[name]=name==="onSnapshot"?fsbMeterListen(sdk[name]):FSB_METERED_WRITES.includes(name)?fsbMeterWrite(sdk[name]):fsbMeterGet(sdk[name]);
    const frozen=Object.freeze(out);
    try{fsbMeteredSdks.set(sdk,frozen);fsbMeteredSdks.set(frozen,frozen);}catch(_error){}
    return frozen;
  }

  function fsbNow(){return Date.now();}
  function fsbPathOf(ref){return ref&&typeof ref.path==="string"?ref.path:"";}
  function fsbIsQuotaError(error){
    for(let item=error,depth=0;item&&typeof item==="object"&&depth<3;item=item.cause,depth+=1){
      const code=String(item.code||"").toLowerCase(),message=String(item.message||"");
      if(code==="resource-exhausted"||code==="resource_exhausted"||/resource[-_ ]exhausted|quota (?:has been )?exceeded/i.test(message))return true;
    }
    return false;
  }
  function fsbIsDeniedError(error){
    for(let item=error,depth=0;item&&typeof item==="object"&&depth<3;item=item.cause,depth+=1){
      const code=String(item.code||"").toLowerCase();
      if(code==="permission-denied"||code==="permission_denied"||code==="unauthenticated")return true;
    }
    return false;
  }
  // A denied read or write means this account or device may have lost its authority (revoked elsewhere): the pairing check
  // re-verifies the device on its next run instead of trusting its 10 minutes. A denied write, or a denied read of this
  // account, this device or the rivalry root, forgets everything this page kept. r86 red team #20: a denied read of any other
  // document (a Session after its Showdown closed, say) still forgets every shared copy and drops the context listeners, so
  // the next reads come from the server (Terminal Close's race check relies on a fresh rivalry read after a refused Session),
  // but keeps this account's and the settled copies, and backs off reading that document for 15 s, then 1 min, then 5 min
  // (a tap reads it again at once). Any shared document seen changed lifts every back-off, so a document the partner's move
  // makes readable is read at once. Before, one document that stayed refused sent every background check to the server on
  // every tick.
  const FSB_DENIED_STEPS_MS=[15000,60000,300000],fsbDenied=new Map();
  function fsbAuthorityPath(path){return !path||fsbOwnAccountPath(path)||/^rivalries\/[^/]+$/.test(path);}
  function fsbAuthorityDenied(error,path){
    if(!fsbIsDeniedError(error))return;
    if(fsbAuthorityPath(path)){fsbEntries.clear();fsbInflight.clear();fsbCtxDetach();}
    else{
      const at=fsbNow(),prev=fsbDenied.get(path),last=FSB_DENIED_STEPS_MS.length-1,step=prev&&at-prev.until<FSB_DENIED_STEPS_MS[last]?Math.min(prev.step+1,last):0;
      fsbDenied.delete(path);fsbDenied.set(path,{until:at+FSB_DENIED_STEPS_MS[step],step,error});
      if(fsbDenied.size>FSB_MAX_ENTRIES)fsbDenied.delete(fsbDenied.keys().next().value);
      fsbEntries.delete(path);if(fsbCtxWatches.has(path))fsbCtxDrop(path,true);
      for(const [other,entry] of fsbEntries)if(!fsbOwnAccountPath(other)&&!entry.immutable)entry.forgotten=true;
      fsbInflight.clear();fsbCtxDetach();
    }
    try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-firestore-authority-denied"));}catch(_error){}
  }
  function fsbPaused(){return Boolean(fsbPause&&fsbNow()<fsbPause.until);}
  function fsbQuotaError(){fsbStats.pausedRefusals+=1;const error=new Error(FSB_QUOTA_MESSAGE);error.code="resource-exhausted";error.quotaPaused=true;return error;}
  function fsbQuotaMessage(error){return fsbPaused()||(error!==undefined&&fsbIsQuotaError(error))?FSB_QUOTA_MESSAGE:null;}
  function fsbState(){const paused=fsbPaused();return Object.freeze({paused,until:fsbPause?fsbPause.until:null,step:fsbPause?fsbPause.step:null,message:paused?FSB_QUOTA_MESSAGE:null});}
  function fsbPublish(){
    const state=fsbState();
    try{const html=root.document&&root.document.documentElement;if(html&&html.dataset){if(state.paused)html.dataset.firestoreQuota="paused";else delete html.dataset.firestoreQuota;}}catch(_error){}
    try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-firestore-quota",{detail:state}));}catch(_error){}
  }
  function fsbTrip(){
    if(fsbPaused())return;
    const at=fsbNow(),recent=fsbPause&&at-fsbPause.until<2*60*60000;
    const step=recent?Math.min(fsbPause.step+1,FSB_PAUSE_STEPS_MS.length-1):0;
    fsbPause=Object.freeze({step,since:at,until:at+FSB_PAUSE_STEPS_MS[step]});
    fsbStats.quotaTrips+=1;
    fsbEntries.clear();
    fsbDetachWait();fsbCtxDetach();
    if(fsbResumeTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(fsbResumeTimer);
    // One timer per pause, only to tell the screens that online play may resume; it reads nothing itself.
    fsbResumeTimer=typeof root.setTimeout==="function"?root.setTimeout(()=>{fsbResumeTimer=null;fsbPublish();},FSB_PAUSE_STEPS_MS[step]+50):null;
    fsbPublish();
  }
  function fsbHidden(){return Boolean(root.document&&root.document.visibilityState==="hidden");}
  // Documents the Rules make immutable once settled are kept: a season's published results (revision 2) and each manager's
  // published result (create-only), and a season commit once ACKNOWLEDGED (revision 3). None of them can be updated or
  // deleted again, so the history of past seasons is read once per page instead of on every check.
  function fsbImmutable(path,snapshot){
    try{
      if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists())return false;
      if(/^rivalries\/[^/]+\/seasonResults\/[^/]+\/roles\/[^/]+$/.test(path))return true;
      const value=snapshot.data();
      if(/^rivalries\/[^/]+\/seasonResults\/[^/]+$/.test(path))return Boolean(value&&value.revision===2);
      if(/^rivalries\/[^/]+\/seasonCommits\/[^/]+$/.test(path))return Boolean(value&&value.phase==="ACKNOWLEDGED"&&value.revision===3);
      // r84: a confirmed setup (revision 6 is the last) and a ready Career Start (revision 2 is the last) never change again.
      if(/^rivalries\/[^/]+\/sharedSetup\/authoritative$/.test(path))return Boolean(value&&value.schemaVersion===1&&value.objectType==="sharedSetupLedger"&&value.revision===6&&value.phase==="SHOWDOWN_CONFIRMED");
      if(/^rivalries\/[^/]+\/careerStart\/authoritative$/.test(path))return Boolean(value&&value.schemaVersion===1&&value.objectType==="sharedCareerStart"&&value.revision===2&&value.phase==="CAREER_START_READY");
      // r86 red team #18: the league projection is create-only, and a COMPLETED season transfer has no further transition
      // (every update needs WINDOW_OPEN, GUESS_ENTRY or SIGNING_ENTRY before it) and cannot be deleted.
      if(/^rivalries\/[^/]+\/sharedSetup\/leagueProjection$/.test(path))return true;
      if(/^rivalries\/[^/]+\/transferChallenges\/[^/]+$/.test(path))return Boolean(value&&value.phase==="COMPLETED");
    }catch(_error){}
    return false;
  }
  // r86 red team #18: this account's own documents (account, this device) keep their 5-minute reuse across a return: a revoked
  // device or account is refused by the Rules on the next shared read, which forgets everything (fsbAuthorityDenied).
  // Before, every phone unlock re-read both, once per module that checks them.
  function fsbForgetAll(){fsbDenied.clear();for(const [path,entry] of [...fsbEntries])if(!entry.immutable&&!fsbOwnAccountPath(path))fsbEntries.delete(path);}
  if(typeof root.addEventListener==="function"){
    try{
      root.addEventListener("online",fsbForgetAll);
      root.addEventListener("pageshow",fsbForgetAll);
      if(root.document&&typeof root.document.addEventListener==="function"){
        // Back from hidden: forget what this page had and wake once every screen that was waiting on the partner when it
        // was hidden, so it catches up with one check now instead of on its next timer (no new timer, no repeated reads).
        root.document.addEventListener("visibilitychange",()=>{if(fsbHidden()){if(fsbCtxWatches.size)fsbCtxReturn=[...fsbCtxWatches.keys()];fsbWaitReturn=fsbWait&&fsbWait.healthy?{path:fsbWait.path,owners:[...fsbWait.owners].map(([owner,info])=>({owner,wake:info.wake,relaxed:info.relaxed}))}:null;fsbDetachWait();fsbCtxDetach();fsbWasHidden=true;return;}fsbForgetAll();fsbChainAt=fsbNow();if(fsbWasHidden){fsbListenReturning();fsbCtxReturning();fsbWaitReturning();}fsbWasHidden=false;fsbWakeReturning();});
        // A tap or key press means someone is acting now: for the next 5 s every check reads fresh (2 s coalescing only).
        for(const type of ["pointerdown","touchstart","keydown"])root.document.addEventListener(type,()=>{fsbInputAt=fsbNow();},{capture:true,passive:true});
        root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState==="hidden")fsbSaveDay();});root.addEventListener?.("pagehide",fsbSaveDay);
      }
    }catch(_error){}
  }
  function fsbOwnAccountPath(path){
    if(!fsbAccountId)return false;
    const prefix=`accounts/${fsbAccountId}`;
    return path===prefix||(path.startsWith(`${prefix}/devices/`)&&path.split("/").length===4);
  }
  // A document asked for again 2-6 s after the previous ask, twice in a row, belongs to a fast check (pairing, joining,
  // history...): it reads fresh for the next 10 s even if that check never told the budget layer it is waiting.
  function fsbNoteAsk(path,at){
    const cadence=fsbCadence.get(path)||{last:0,run:0,fastUntil:0};
    const gap=at-cadence.last;
    if(gap>=FSB_COALESCE_MS){cadence.run=gap<=FSB_FAST_GAP_MS?cadence.run+1:0;cadence.last=at;}
    if(cadence.run>=2)cadence.fastUntil=at+FSB_FAST_HOLD_MS;
    fsbCadence.delete(path);fsbCadence.set(path,cadence);
    if(fsbCadence.size>FSB_MAX_ENTRIES)fsbCadence.delete(fsbCadence.keys().next().value);
    return cadence.fastUntil>at;
  }
  // Quiet reuse is for a settled pair only: a rivalry root that is still pending (or in any state other than active or
  // closed) is read fresh, so a partner's pairing is seen as soon as the screen checks.
  function fsbSettled(path,snapshot){
    if(!/^rivalries\/[^/]+$/.test(path))return true;
    try{const value=snapshot&&snapshot.exists()?snapshot.data():null;const state=value&&value.data&&value.data.connectionState;return state==="active"||state==="closed";}catch(_error){return false;}
  }
  function fsbReuseLimit(path,at,fast,snapshot){
    const limit=fsbReuseLimitNormal(path,at,fast,snapshot);
    return limit<FSB_BRAKE_REUSE_MS&&fsbBraking(at)?FSB_BRAKE_REUSE_MS:limit;
  }
  function fsbReuseLimitNormal(path,at,fast,snapshot){
    if(fsbOwnAccountPath(path))return FSB_OWN_ACCOUNT_MS;
    if(at-fsbInputAt<FSB_INPUT_FRESH_MS||at-fsbFreshAskAt<FSB_ASK_MS||(fsbFreshPaths.get(path)||0)>at||!fsbSettled(path,snapshot))return FSB_COALESCE_MS;
    // A screen waiting on the partner reads its waited document fresh unless the healthy listener watches exactly it.
    // r84: only that document. Every other document keeps the quiet reuse below; a fresh read that shows the waited
    // document changed forgets them all (fsbRemember), as a listener delivery does. Before, a dead listener made every
    // background check read fresh: ~60 reads/min per device for as long as the wait lasted.
    const live=fsbWaitLive();
    for(const [owner,ask] of fsbWaitAsks){
      if(at-ask.at>=FSB_ASK_MS){fsbWaitAsks.delete(owner);continue;}
      if(ask.path===path&&!(live&&fsbWait&&ask.path===fsbWait.path))return FSB_COALESCE_MS;
    }
    // r84: while a healthy listener watches the screen's document, a partner's move reaches this page through it and its
    // delivery forgets every other copy (fsbRemember), so those copies are kept for 5 min instead of 1. Measured on the
    // Transfer screen waiting on the partner, a 2 min reuse re-read the whole context every 2 min: ~40 billed reads/min.
    if(live)return FSB_LIVE_QUIET_MS;
    return fast?FSB_COALESCE_MS:FSB_QUIET_MS;
  }
  // Returns {snapshot,old} or null. old: the copy is older than the 2 s burst window (see fsbProbe's fresh re-run).
  function fsbWaitAskedPath(path,at){for(const ask of fsbWaitAsks.values())if(ask.path===path&&at-ask.at<FSB_ASK_MS)return true;return false;}
  function fsbReusable(path){
    const at=fsbNow(),fast=path?fsbNoteAsk(path,at):false;
    // r80: a listener known to be behind a server read this page already made (lagUntil) never answers: the newer
    // server copy does (or the server). Otherwise a write's bounded stale retry re-read the older copy and failed again.
    if(fsbWait&&path===fsbWait.path&&fsbWaitLive()&&!fsbWait.lagUntil){if(!fsbWaitHealthy())return null;fsbStats.listenerServed+=1;return {snapshot:fsbWait.snapshot,old:false};}
    const watched=fsbCtxServe(path);if(watched){fsbStats.contextServed+=1;return {snapshot:watched,old:false};}
    const entry=fsbEntries.get(path);
    if(entry&&entry.immutable&&!entry.dirty){fsbStats.immutableReuses+=1;return {snapshot:entry.snapshot,old:false};}
    if(!entry||entry.dirty||entry.forgotten)return null;
    const age=at-entry.at;
    // A hidden page renders nothing, so its background checks reuse what it already has; becoming visible forgets it all.
    if(fsbHidden())return {snapshot:entry.snapshot,old:age>FSB_COALESCE_MS};
    // Not for a rivalry that is still pending its pair or close, nor for a document a screen asked to read fresh.
    const chained=fsbChainAt>0&&at-fsbChainAt<FSB_CHAIN_MS&&entry.at>=fsbChainAt&&!((fsbFreshPaths.get(path)||0)>at)&&fsbSettled(path,entry.snapshot);
    if(!chained&&age>fsbReuseLimit(path,at,fast,entry.snapshot))return null;
    const old=!chained&&age>FSB_COALESCE_MS&&!fsbOwnAccountPath(path);
    if(old)fsbStats.quietReuses+=1;
    return {snapshot:entry.snapshot,old};
  }
  function fsbRemember(db,ref,snapshot){
    if(db!==fsbFirestore)return;
    const path=fsbPathOf(ref);
    if(!path)return;
    const before=fsbEntries.get(path);
    fsbEntries.delete(path);
    const entry={snapshot,at:fsbNow(),dirty:false,immutable:fsbImmutable(path,snapshot)};
    fsbEntries.set(path,entry);
    if(before&&!fsbOwnAccountPath(path)&&fsbSerial(before.snapshot)!==fsbSerial(snapshot))fsbDenied.clear();
    if(fsbWait&&path===fsbWait.path)fsbWaitServerRead(snapshot);
    fsbCtxServerRead(path,snapshot);
    // r84: a waited document read fresh (no healthy listener on it) that changed is the partner's move: forget the other
    // copies and start the chain, exactly like fsbWaitDelivery, so no screen acts on a copy older than that move.
    if(before&&!before.dirty&&!(fsbWait&&path===fsbWait.path&&fsbWaitLive())&&fsbWaitAskedPath(path,entry.at)&&fsbSerial(before.snapshot)!==fsbSerial(snapshot)){fsbForgetContext();entry.forgotten=false;fsbChainAt=entry.at;}
    if(fsbEntries.size>FSB_MAX_ENTRIES)fsbEntries.delete(fsbEntries.keys().next().value);
  }
  function fsbMarkWritten(db,paths){if(db!==fsbFirestore)return;for(const path of paths){const entry=fsbEntries.get(path);if(entry)entry.dirty=true;if(fsbWait&&fsbWait.path===path)fsbWait.dirty=true;const watch=fsbCtxWatches.get(path);if(watch)watch.dirty=true;}}

  // r84 trim: context listeners. While a shared Showdown is open (watchContext(rivalryId), asked by Terminal Close), the rivalry
  // root and the Session document this page reads are each watched by one listener instead of being re-read by every check
  // and by the 45 s END SHOWDOWN poll. Both change only a few times per season (a season accepted, a close, a join or expiry),
  // so a change reaches this page at once and costs one read; a check reads them from the listener while the server confirmed
  // the copy in the last 3 min (a delivery or a server read with the same content confirms it), otherwise from the server as before.
  // Hidden page, quota pause, denied read, account or database change: the listeners stop and every read goes to the server.
  const FSB_CTX_CONFIRM_MS=180000,FSB_CTX_RETRY_MS=60000;
  const fsbCtxWatches=new Map(),fsbCtxFailed=new Map(),fsbExternal=new Set();
  let fsbCtxRivalry=null,fsbCtxReturn=[];
  function fsbCtxDrop(path,failed){const watch=fsbCtxWatches.get(path);fsbCtxWatches.delete(path);if(watch&&typeof watch.unsubscribe==="function"){try{watch.unsubscribe();}catch(_error){}}if(watch&&watch.returning)fsbListened(path,null);if(failed){fsbStats.listenerFallbacks+=1;fsbCtxFailed.set(path,fsbNow()+FSB_CTX_RETRY_MS);}}
  function fsbCtxDetach(){for(const path of [...fsbCtxWatches.keys()])fsbCtxDrop(path,false);}
  function fsbCtxWanted(path){
    const rivalryId=fsbCtxRivalry&&fsbCtxRivalry.rivalryId;
    if(!rivalryId||typeof path!=="string")return false;
    const parts=path.split("/");
    return path===`rivalries/${rivalryId}`||(parts.length===4&&parts[0]==="rivalries"&&parts[1]===rivalryId&&parts[2]==="sessions"&&Boolean(parts[3]));
  }
  function fsbCtxServe(path){
    const watch=fsbCtxWatches.get(path);
    if(!watch||!watch.healthy||watch.dirty||!watch.snapshot)return null;
    return fsbNow()-watch.confirmedAt<=FSB_CTX_CONFIRM_MS?watch.snapshot:null;
  }
  function fsbCtxServerRead(path,snapshot){
    const watch=fsbCtxWatches.get(path);
    if(watch){if(watch.healthy&&fsbSerial(snapshot)===watch.serial)watch.confirmedAt=fsbNow();else if(watch.healthy&&!watch.dirty)watch.healthy=false;return;}
    // r86 red team #18: a document a screen's own authority listener already delivers (Season Commit's wait context) gets no
    // second listener: that listener forgets the copies on any change. Before, each return paid for both listeners.
    if(fsbExternal.has(path))return;
    if(fsbCtxSessionPath(path)&&path!==fsbCtxCurrentSession())return;
    fsbCtxAttach(path);
  }
  // The Session to watch is the one this page read most recently: an older Session still in the copies (a new Session was
  // opened without a reload) is never re-attached, so the current Session listener is not dropped and re-made on each wake.
  function fsbCtxSessionPath(path){return typeof path==="string"&&path.split("/").length===4;}
  function fsbCtxCurrentSession(){
    let best=null,at=-1;
    for(const [path,entry] of fsbEntries)if(fsbCtxWanted(path)&&fsbCtxSessionPath(path)&&entry.at>at){best=path;at=entry.at;}
    return best;
  }
  function fsbCtxDelivery(watch,snapshot){
    if(fsbCtxWatches.get(watch.path)!==watch)return;
    if(!snapshot||!snapshot.metadata||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites){watch.healthy=false;return;}
    const serial=fsbSerial(snapshot),known=fsbEntries.get(watch.path);
    const before=watch.serial!==null?watch.serial:(known?fsbSerial(known.snapshot):null);
    watch.snapshot=snapshot;watch.serial=serial;watch.healthy=true;watch.dirty=false;watch.confirmedAt=fsbNow();
    fsbStats.listenerDeliveries+=1;fsbCountRead(fsbMeterUnits(snapshot,true),true,fsbReadLookups(watch.path));watch.priced=true;
    fsbEntries.delete(watch.path);fsbEntries.set(watch.path,{snapshot,at:fsbNow(),dirty:false,immutable:false});
    if(watch.returning){watch.returning=false;const listen=fsbListens.get(watch.path);if(listen){fsbListens.delete(watch.path);fsbStats.listenerServed+=1;listen.resolve(snapshot);}}
    if(before!==null&&before!==serial){fsbDenied.clear();fsbChainAt=fsbNow();const wake=fsbCtxRivalry&&fsbCtxRivalry.wake;if(typeof wake==="function"&&typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake(watch.path);}catch(_error){}},0);}
  }
  function fsbCtxAttach(path){
    // r86 red team #19: a document Season Commit's authority listeners watch (fsbReturnPaths) or deliver (fsbExternal) gets
    // no second listener. Measured on a reload: both listened to the rivalry and the Session, 2 documents + 4 lookups more.
    if(!fsbCtxWanted(path)||fsbCtxWatches.has(path)||fsbReturnPaths.includes(path)||fsbExternal.has(path))return;
    const at=fsbNow();
    if(fsbPaused()||fsbHidden()||!fsbFirestore||(fsbCtxFailed.get(path)||0)>at)return;
    const api=fsbSnapshotApi;
    if(!api){fsbLoadSnapshotApi();return;}
    // One Session listener: a newer Session replaces the older one.
    if(path.split("/").length===4)for(const other of [...fsbCtxWatches.keys()])if(other.split("/").length===4)fsbCtxDrop(other,false);
    const watch={path,snapshot:null,serial:null,healthy:false,dirty:false,confirmedAt:0,unsubscribe:null};
    fsbCtxWatches.set(path,watch);fsbStats.listenersAttached+=1;
    try{
      watch.unsubscribe=api.onSnapshot(api.doc(fsbFirestore,path),{includeMetadataChanges:true},snapshot=>fsbCtxDelivery(watch,snapshot),error=>{fsbCountRead(fsbMeterFailureUnits(error),true,watch.priced?0:fsbReadLookups(path));if(fsbCtxWatches.get(path)!==watch)return;fsbCtxDrop(path,true);if(fsbIsQuotaError(error))fsbTrip();});
    }catch(_error){fsbCtxDrop(path,true);}
  }
  // r86 red team #18: back from hidden, the context listeners this page had are attached again at once, and a read of their
  // documents waits up to 5 s for the first server delivery (one read each) instead of every module reading them from the
  // server and the listener then reading them once more. A document an authority listener will deliver (fsbReturnPaths) is left to it.
  // Terminal Close stops the context watch while the page is hidden and asks for it again on return, so the paths wait for
  // that ask (fsbWatchContext) when the context is not set yet.
  function fsbCtxReturning(){
    if(!fsbCtxRivalry||fsbHidden())return;
    const paths=fsbCtxReturn;fsbCtxReturn=[];
    for(const path of paths){
      if(!fsbCtxWanted(path)||fsbReturnPaths.includes(path)||fsbExternal.has(path)||fsbListens.has(path))continue;
      fsbCtxAttach(path);
      const watch=fsbCtxWatches.get(path);if(!watch)continue;
      watch.returning=true;
      const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(path,listen);
      if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(path,null),5000);
    }
  }
  function fsbWatchContext(rivalryId,wake){
    const id=typeof rivalryId==="string"&&/^pair_[0-9a-f]{64}$/.test(rivalryId)?rivalryId:null;
    if(!id){if(!fsbHidden())fsbCtxReturn=[];else if(fsbCtxWatches.size)fsbCtxReturn=[...fsbCtxWatches.keys()];fsbCtxRivalry=null;fsbCtxDetach();return false;}
    if(!fsbCtxRivalry||fsbCtxRivalry.rivalryId!==id){fsbCtxDetach();fsbCtxRivalry={rivalryId:id,wake};}
    else fsbCtxRivalry.wake=wake;
    if(fsbCtxReturn.length)fsbCtxReturning();
    const rootPath=`rivalries/${id}`;if(fsbEntries.has(rootPath))fsbCtxAttach(rootPath);
    const session=fsbCtxCurrentSession();if(session)fsbCtxAttach(session);
    return Boolean(fsbCtxServe(`rivalries/${id}`));
  }

  // Wait-point listener (r75). While a screen waits on the partner it may watch the one shared document the partner's
  // move changes. One listener per page at most. It is dropped when the page is hidden, the screen stops waiting, online
  // play pauses, or the listener errors or falls behind; the screen's own 3 s check keeps running throughout and simply
  // reads from the server again whenever the listener is not healthy. A change seen by the listener wakes the screen at once.
  const FSB_WAIT_CONFIRM_MS=30000,FSB_WAIT_LAG_MS=5000,FSB_WAIT_RETRY_MS=60000,FSB_WAIT_OWNER_MS=4500;
  const fsbWaitFailed=new Map(),fsbReturnWakes=new Map();
  let fsbWaitReturn=null,fsbWait=null,fsbSnapshotApi=null,fsbSnapshotApiPromise=null;
  function fsbStable(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(typeof value.toJSON==="function")return fsbStable(value.toJSON());
    if(Array.isArray(value))return `[${value.map(fsbStable).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${fsbStable(value[key])}`).join(",")}}`;
  }
  function fsbSerial(snapshot){try{return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?fsbStable(snapshot.data()):"null";}catch(_error){return null;}}
  function fsbVersion(snapshot){try{const time=snapshot&&snapshot._document&&snapshot._document.version&&snapshot._document.version.timestamp;return time&&Number.isFinite(time.seconds)&&Number.isFinite(time.nanoseconds)?[time.seconds,time.nanoseconds]:null;}catch(_error){return null;}}
  function fsbVersionCompare(a,b){if(!a||!b)return 0;return a[0]!==b[0]?a[0]-b[0]:a[1]-b[1];}
  function fsbLoadSnapshotApi(){
    if(fsbSnapshotApi||fsbSnapshotApiPromise)return fsbSnapshotApiPromise;
    const url=root.CareerModeProductionFirebaseRuntime&&root.CareerModeProductionFirebaseRuntime.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url)||!root.document)return null;
    fsbSnapshotApiPromise=Promise.resolve().then(()=>import(url)).then(module=>{fsbSnapshotApi=module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?module:null;},()=>{fsbSnapshotApi=null;});
    return fsbSnapshotApiPromise;
  }
  function fsbWaitLive(){
    const wait=fsbWait;
    if(!wait||!wait.healthy||wait.dirty)return false;
    if(wait.lagUntil&&fsbNow()>wait.lagUntil){fsbWaitFail(wait.path);return false;}
    return true;
  }
  // The watched document itself is served from the listener only if the server confirmed it in the last 30 s.
  function fsbWaitHealthy(){return fsbWaitLive()&&fsbNow()-fsbWait.confirmedAt<=(fsbWaitRelaxed()?FSB_RELAXED_CONFIRM_MS:FSB_WAIT_CONFIRM_MS);}
  function fsbWaitRelaxed(){return Boolean(fsbWait&&fsbWait.owners.size&&[...fsbWait.owners.values()].every(info=>info.relaxed===true));}
  function fsbWaitServerRead(snapshot){
    const wait=fsbWait;
    if(!wait||!wait.healthy)return;
    const version=fsbVersion(snapshot),serial=fsbSerial(snapshot);
    // RS-03 (r87): a server read that returns exactly the listener's copy proves the listener is current, so it may serve again
    // even when this page's own write (or a write that threw) left it dirty without a new delivery.
    if(serial===wait.serial||fsbVersionCompare(version,wait.version)<0){wait.confirmedAt=fsbNow();if(serial===wait.serial)wait.dirty=false;return;}
    // The server has a newer copy than the listener: give the listener a moment to deliver it, otherwise drop it.
    if(!wait.lagUntil){wait.lagUntil=fsbNow()+FSB_WAIT_LAG_MS;wait.lagVersion=version;wait.lagSerial=serial;}
  }
  function fsbDetachWait(){const wait=fsbWait;fsbWait=null;if(wait&&typeof wait.unsubscribe==="function"){try{wait.unsubscribe();}catch(_error){}}if(wait&&wait.returning)fsbListened(wait.path,null);}
  function fsbWaitFail(path){fsbDetachWait();fsbStats.listenerFallbacks+=1;fsbWaitFailed.set(path,fsbNow()+FSB_WAIT_RETRY_MS);}
  // Forgotten copies are never reused, but their content is kept for change detection: a document that is merely forgotten
  // (not changed) must not count as changed, or every later check would re-run on fresh reads and forget again.
  function fsbForgetContext(){fsbDenied.clear();for(const [path,entry] of fsbEntries)if(!fsbOwnAccountPath(path))entry.forgotten=true;}
  function fsbWakeOwners(wait){
    for(const info of wait.owners.values()){
      const wake=info.wake;
      if(typeof wake!=="function")continue;
      if(typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake();}catch(_error){}},0);
      else{try{wake();}catch(_error){}}
    }
  }
  function fsbWakeReturning(){
    for(const wake of fsbReturnWakes.values()){if(typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake();}catch(_error){}},0);}
  }
  function fsbWaitDelivery(wait,snapshot){
    if(fsbWait!==wait)return;
    if(!snapshot||!snapshot.metadata||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites){wait.healthy=false;return;}
    const serial=fsbSerial(snapshot),version=fsbVersion(snapshot);
    const before=wait.serial!==null?wait.serial:fsbSerial(fsbEntries.get(wait.path)&&fsbEntries.get(wait.path).snapshot);
    const changed=before!==null&&before!==serial;
    wait.snapshot=snapshot;wait.serial=serial;wait.version=version;wait.healthy=true;wait.dirty=false;wait.confirmedAt=fsbNow();
    if(wait.lagUntil&&(fsbVersionCompare(version,wait.lagVersion)>=0&&version!==null||serial===wait.lagSerial)){wait.lagUntil=0;wait.lagVersion=null;wait.lagSerial=null;}
    fsbStats.listenerDeliveries+=1;fsbCountRead(fsbMeterUnits(snapshot,true),true,fsbReadLookups(wait.path));wait.priced=true;
    if(wait.returning){wait.returning=false;const listen=fsbListens.get(wait.path);if(listen){fsbListens.delete(wait.path);fsbStats.listenerServed+=1;listen.resolve(snapshot);}}
    // r84 trim: the delivered server copy also becomes this page's copy. Before, a copy marked dirty by this page's own save
    // stayed behind the listener, so the next 30 s server check of the waited document always looked "changed" and re-ran
    // the whole check on fresh reads (about 9 documents) after every lock.
    fsbEntries.delete(wait.path);fsbEntries.set(wait.path,{snapshot,at:fsbNow(),dirty:false,immutable:fsbImmutable(wait.path,snapshot)});
    if(changed){fsbForgetContext();fsbChainAt=fsbNow();fsbWakeOwners(wait);}
  }
  // r86 red team #18: back from hidden, the wait listener the page had is attached again at once for the same screens, and a
  // read of its document waits up to 5 s for its first server delivery, instead of the screen reading it from the server and
  // its next 3 s check attaching the listener (a second read).
  function fsbWaitReturning(){
    const back=fsbWaitReturn;fsbWaitReturn=null;
    if(!back||fsbReturnPaths.includes(back.path)||fsbListens.has(back.path))return;
    for(const info of back.owners)fsbWatchWaitPoint(info.owner,back.path,info.wake,{relaxed:info.relaxed});
    if(!fsbWait||fsbWait.path!==back.path||fsbWait.snapshot)return;
    fsbWait.returning=true;
    const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(back.path,listen);
    if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(back.path,null),5000);
  }
  function fsbWatchWaitPoint(owner,path,wake,options){
    const at=fsbNow(),relaxed=Boolean(options&&options.relaxed===true);
    if(fsbWait){for(const [key,info] of [...fsbWait.owners])if(key!==owner&&at-info.seen>FSB_WAIT_OWNER_MS)fsbWait.owners.delete(key);if(!fsbWait.owners.size)fsbDetachWait();}
    const release=()=>{if(fsbWait&&fsbWait.owners.delete(owner)&&!fsbWait.owners.size)fsbDetachWait();return false;};
    if(typeof path!=="string"||!/^rivalries\/[^/]+(?:\/[^/]+\/[^/]+)+$/.test(path)){fsbWaitAsks.delete(owner);if(!fsbHidden())fsbReturnWakes.delete(owner);return release();}
    fsbWaitAsks.set(owner,{path,at});if(typeof wake==="function")fsbReturnWakes.set(owner,wake);
    if(fsbPaused()||fsbHidden()||!fsbFirestore||(fsbWaitFailed.get(path)||0)>at)return release();
    if(fsbWait&&fsbWait.path===path){fsbWait.owners.set(owner,{wake,seen:at,relaxed});return fsbWaitLive();}
    if(fsbWait&&!(fsbWait.owners.size===1&&fsbWait.owners.has(owner)))return false;
    const api=fsbSnapshotApi;
    if(!api){fsbLoadSnapshotApi();return release();}
    fsbDetachWait();
    const wait={path,owners:new Map([[owner,{wake,seen:at,relaxed}]]),snapshot:null,serial:null,version:null,healthy:false,dirty:false,confirmedAt:0,lagUntil:0,lagVersion:null,lagSerial:null,unsubscribe:null};
    fsbWait=wait;fsbStats.listenersAttached+=1;
    try{
      wait.unsubscribe=api.onSnapshot(api.doc(fsbFirestore,path),{includeMetadataChanges:true},snapshot=>fsbWaitDelivery(wait,snapshot),error=>{fsbCountRead(fsbMeterFailureUnits(error),true,wait.priced?0:fsbReadLookups(path));if(fsbWait!==wait)return;fsbWaitFail(path);if(fsbIsQuotaError(error))fsbTrip();fsbAuthorityDenied(error,path);});
    }catch(_error){if(fsbWait===wait)fsbWaitFail(path);}
    return false;
  }

  // One document, read on the server inside a transaction that ends before commit (one BatchGetDocuments, no write).
  // r76: the waiting screen's authority listeners stop while the page is hidden and start again when it returns. A read
  // of one of their documents that starts before that listener's first server delivery waits for it instead of reading the
  // same document again, so a return costs one read per document. A listener that cannot deliver, or has not delivered within 5 s, hands the read back.
  let fsbReturnPaths=[],fsbWasHidden=false;const fsbListens=new Map();
  function fsbListenReturning(){for(const path of fsbReturnPaths)if(!fsbListens.has(path)){const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(path,listen);if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(path,null),5000);}}
  // Called by Season Commit's authority listeners: their first server delivery of a path (snapshot), or none (no path) when
  // they stop. While they deliver a path, the context listener leaves it to them (fsbExternal).
  function fsbListened(path,snapshot){if(path===undefined){fsbExternal.clear();for(const key of [...fsbListens.keys()])fsbListened(key,null);return;}if(snapshot)fsbExternal.add(path);const listen=fsbListens.get(path);if(!listen)return;fsbListens.delete(path);if(snapshot){fsbStats.listenerServed+=1;fsbRemember(fsbFirestore,{path},snapshot);}listen.resolve(snapshot||null);}
  function fsbReturnListen(paths){fsbReturnPaths=Array.isArray(paths)?paths.filter(path=>typeof path==="string"):[];if(!fsbReturnPaths.length)fsbExternal.clear();for(const path of fsbReturnPaths){const watch=fsbCtxWatches.get(path);if(watch){watch.returning=false;fsbCtxDrop(path,false);}}for(const path of [...fsbListens.keys()])if(!fsbReturnPaths.includes(path))fsbListened(path,null);}
  function fsbTakeServerNext(path){const until=fsbServerNext.get(path)||0;if(until)fsbServerNext.delete(path);return until>fsbNow();}
  function fsbReadOne(sdk,db,ref,serverOnly=false){
    const listen=fsbListens.get(fsbPathOf(ref));if(listen)return listen.promise.then(snapshot=>snapshot||fsbReadOne(sdk,db,ref));
    // A read in flight is shared only within the account that started it; one that lands after a sign-in change is not kept.
    const path=fsbPathOf(ref),account=fsbAccountId,key=path?`${account||""}|${path}`:ref;
    const denied=path?fsbDenied.get(path):null;
    if(denied&&denied.until>fsbNow()&&fsbNow()-fsbInputAt>=FSB_INPUT_FRESH_MS){fsbStats.deniedRefusals+=1;return Promise.reject(denied.error);}
    const running=serverOnly?null:fsbInflight.get(key);
    if(running)return running;
    const found={};
    const request=Promise.resolve().then(()=>sdk.runTransaction(db,transaction=>Promise.resolve(transaction.get(ref)).then(snapshot=>{found.snapshot=snapshot;throw found;}))).then(()=>{throw new Error("Firestore read returned no snapshot.");},error=>{
      if(error===found){fsbStats.serverReads+=1;fsbCountRead(1,true,fsbReadLookups(path));fsbDenied.delete(path);if(fsbAccountId===account)fsbRemember(db,ref,found.snapshot);return found.snapshot;}
      if(fsbIsQuotaError(error))fsbTrip();
      fsbAuthorityDenied(error,path);
      throw error;
    }).finally(()=>{if(fsbInflight.get(key)===request)fsbInflight.delete(key);});
    fsbInflight.set(key,request);
    return request;
  }

  const FSB_PROBE_WRITE={fsbProbe:"write"};
  // fresh=true: no reuse at all (only in-flight sharing). A probe that used an old copy and also read a document that changed
  // (or was not known) runs once more on fresh reads, so a screen never acts on a mix of old and new documents.
  async function fsbProbe(sdk,db,updateFunction,fresh=false){
    // RS-02 (r87): a fresh re-run reads each document once per pass, and keeps what cannot have changed (immutable documents, this
    // account's own within 5 min: what a server transaction keeps too); every other document is still read from the server.
    let write=false,old=false,changed=false;const pass=new Map();
    const refuse=()=>{write=true;throw FSB_PROBE_WRITE;};
    const transaction={
      get:ref=>{
        if(write)return Promise.reject(FSB_PROBE_WRITE);
        if(fsbPaused())return Promise.reject(fsbQuotaError());
        const path=fsbPathOf(ref);
        if(fresh&&pass.has(path))return pass.get(path);
        const serverOnly=fsbTakeServerNext(path),reused=fresh||serverOnly?null:fsbReusable(path);
        if(reused){fsbStats.reusedReads+=1;if(reused.old)old=true;return Promise.resolve(reused.snapshot);}
        const known=fsbEntries.get(path),prior=known?fsbSerial(known.snapshot):null;
        if(fresh&&!serverOnly){const kept=fsbTransactionKept(db,path);if(kept){const reuse=Promise.resolve(kept);pass.set(path,reuse);return reuse;}}
        const read=fsbReadOne(sdk,db,ref,serverOnly).then(snapshot=>{if(prior===null||prior!==fsbSerial(snapshot))changed=true;return snapshot;});
        if(fresh)pass.set(path,read);
        return read;
      },
      set:refuse,update:refuse,delete:refuse
    };
    const again=()=>{fsbStats.freshReruns+=1;fsbForgetContext();return fsbProbe(sdk,db,updateFunction,true);};
    try{
      const value=await updateFunction(transaction);
      if(write)return null;
      if(old&&changed)return again();
      return {value};
    }catch(error){
      if(write)return null;
      if(old&&changed&&error!==FSB_PROBE_WRITE&&!(error&&error.quotaPaused))return again();
      throw error;
    }
  }

  // r84 trim: a save made right after a tap first runs its function once on the copies this page already has (no read at all). When it wants to write,
  // it goes straight to the server transaction, so a save no longer pays every document twice (once in the read-only probe,
  // once in the transaction). When it only reads, or a document has no copy yet, the probe below runs exactly as before.
  const FSB_PEEK_STOP={fsbPeek:"stop"};
  async function fsbPeekWrites(updateFunction){
    let write=false,miss=false;
    const stop=()=>Promise.reject(FSB_PEEK_STOP);
    const wants=()=>{write=true;throw FSB_PEEK_STOP;};
    const transaction={
      get:ref=>{
        if(write||miss)return stop();
        const path=fsbPathOf(ref),entry=path?fsbEntries.get(path):null;
        if(path&&fsbWait&&fsbWait.path===path&&fsbWaitLive()&&fsbWait.snapshot&&!fsbWait.dirty)return Promise.resolve(fsbWait.snapshot);
        if(!entry||entry.dirty){miss=true;return stop();}
        return Promise.resolve(entry.snapshot);
      },
      set:wants,update:wants,delete:wants
    };
    try{await updateFunction(transaction);}catch(_error){}
    if(write)fsbStats.peekWrites+=1;
    return write;
  }
  // r84 trim: inside a writing transaction, a document the Rules never let change again (fsbImmutable: a confirmed setup, a
  // ready Career Start, published results, an acknowledged commit) and this account's own account/device documents (no
  // client can change an account; only this account can change its devices) are taken from this page's copy instead of
  // being read again. Every other document (rivalry, session, the document being saved) is still read in the transaction.
  function fsbTransactionKept(db,path){
    if(db!==fsbFirestore||!path)return null;
    const entry=fsbEntries.get(path);
    if(!entry||entry.dirty)return null;
    if(entry.immutable)return entry.snapshot;
    if(fsbOwnAccountPath(path)&&fsbNow()-entry.at<=FSB_OWN_ACCOUNT_MS)return entry.snapshot;
    return null;
  }
  async function fsbServerTransaction(sdk,db,updateFunction,rest){
    if(fsbPaused())throw fsbQuotaError();
    fsbStats.serverTransactions+=1;
    let wrote=false,written=[];
    const done={};
    try{
      const value=await sdk.runTransaction(db,async transaction=>{
        wrote=false;written=[];
        const proxy={
          get:ref=>{const kept=fsbTransactionKept(db,fsbPathOf(ref));if(kept){fsbStats.transactionKept+=1;return Promise.resolve(kept);}return Promise.resolve(transaction.get(ref)).then(snapshot=>{fsbStats.serverReads+=1;fsbCountRead(1,true,fsbReadLookups(fsbPathOf(ref)));fsbRemember(db,ref,snapshot);return snapshot;});},
          set:(ref,...args)=>{wrote=true;written.push(fsbPathOf(ref));transaction.set(ref,...args);return proxy;},
          update:(ref,...args)=>{wrote=true;written.push(fsbPathOf(ref));transaction.update(ref,...args);return proxy;},
          delete:ref=>{wrote=true;written.push(fsbPathOf(ref));transaction.delete(ref);return proxy;}
        };
        const result=await updateFunction(proxy);
        if(!wrote){done.value=result;throw done;}
        return result;
      },...rest);
      fsbMarkWritten(db,written);fsbBill(fsbWriteLookups(written));
      return value;
    }catch(error){
      if(error===done){fsbStats.readOnlyWithoutCommit+=1;return done.value;}
      // r80: a write that failed (a rival's write may have landed first) is followed by a check of what is stored now:
      // the next read of each document it wrote goes to the server, even if the listener delivers an older copy meanwhile.
      if(wrote&&fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups(written));
      if(wrote){fsbMarkWritten(db,written);for(const path of written)if(path){fsbServerNext.set(path,fsbNow()+FSB_ASK_MS);if(fsbServerNext.size>FSB_MAX_ENTRIES)fsbServerNext.delete(fsbServerNext.keys().next().value);}}
      if(fsbIsQuotaError(error))fsbTrip();
      fsbAuthorityDenied(error);
      throw error;
    }
  }

  async function fsbRunTransaction(services,db,updateFunction,rest){
    if(fsbPaused())throw fsbQuotaError();
    const sdk=services.firestoreSdk;
    if(typeof updateFunction!=="function")return sdk.runTransaction(db,updateFunction,...rest);
    if(db!==fsbFirestore){fsbEntries.clear();fsbCtxDetach();fsbFirestore=db;}
    const uid=services.auth&&services.auth.currentUser&&services.auth.currentUser.uid||null;
    if(uid!==fsbAccountId){fsbEntries.clear();fsbInflight.clear();fsbReturnListen([]);fsbCtxDetach();fsbExternal.clear();fsbCtxReturn=[];fsbWaitReturn=null;fsbDenied.clear();fsbAccountId=uid;}
    // Only within a few seconds of a tap, when a save is likely; a background check, or a later automatic save, keeps the probe
    // path and timing exactly as before (the server transaction still decides every write).
    if(fsbNow()-fsbInputAt<FSB_INPUT_FRESH_MS&&await fsbPeekWrites(updateFunction))return fsbServerTransaction(sdk,db,updateFunction,rest);
    const answer=await fsbProbe(sdk,db,updateFunction);
    if(answer)return answer.value;
    return fsbServerTransaction(sdk,db,updateFunction,rest);
  }

  function fsbWrapServices(services){
    if(!services||typeof services!=="object"||services.ok!==true||!services.firestoreSdk||typeof services.firestoreSdk.runTransaction!=="function")return services;
    if(services.firestoreBudget===true)return services;
    const existing=fsbWrapped.get(services);
    if(existing)return existing;
    const sdk=services.firestoreSdk;
    fsbRawSdk=sdk;
    // A runtime that already hands out onSnapshot (none does today; the contract test does) is used as is; otherwise the
    // listener API is loaded from the same Firestore module URL the runtime uses, so it shares one SDK instance.
    if(!fsbSnapshotApi&&typeof sdk.onSnapshot==="function"&&typeof sdk.doc==="function")fsbSnapshotApi=Object.freeze({onSnapshot:sdk.onSnapshot,doc:sdk.doc});
    const wrapped=Object.freeze({...services,firestoreBudget:true,firestoreSdk:Object.freeze({...fsbMeterSdk(sdk),runTransaction:(db,updateFunction,...rest)=>fsbRunTransaction(services,db,updateFunction,rest)})});
    fsbWrapped.set(services,wrapped);
    return wrapped;
  }

  root.CareerModeFirestoreBudget=Object.freeze({
    contractVersion:1,
    quotaMessageText:FSB_QUOTA_MESSAGE,
    pauseStepsMs:FSB_PAUSE_STEPS_MS,
    coalesceMs:FSB_COALESCE_MS,
    ownAccountReuseMs:FSB_OWN_ACCOUNT_MS,
    services:fsbWrapServices,
    watchWaitPoint:fsbWatchWaitPoint,
    forgetContext:fsbForgetContext,
    returnListen:fsbReturnListen,
    listened:fsbListened,
    // watchContext(rivalryId, wake): watch this rivalry's root and current Session while a shared Showdown is open (null stops);
    // wake(path) runs when either changes. contextHealthy(path): a confirmed context listener serves this document now.
    watchContext:fsbWatchContext,
    contextHealthy:path=>Boolean(fsbCtxServe(path)),
    // watchesHealthy(path): a healthy wait listener watches exactly this document, so a 15 s screen check need not re-read it.
    watchesHealthy:path=>Boolean(typeof path==="string"&&fsbWait&&fsbWait.path===path&&fsbWaitHealthy()),
    // countListenerRead(): a server delivery of a listener this layer does not own (season-commit wait context, Home JOIN note)
    // still counts toward today's reads and the brake window.
    countListenerRead:()=>fsbCountRead(),
    // r85 meterSdk(sdk): the same SDK functions, with getDoc/getDocs/getDocFromServer/getDocsFromServer/onSnapshot counted by
    // the one read meter above (idempotent: an already metered SDK or function is returned as is). meterGet(fn) and
    // meterListen(fn) do the same for a single function. readUnits(snapshot) is what one snapshot counts (contract tests).
    meterSdk:fsbMeterSdk,
    meterGet:fsbMeterGet,
    meterListen:fsbMeterListen,
    readUnits:(snapshot,listener)=>fsbMeterUnits(snapshot,listener===true),
    // r86: the Rules lookups a read (live or finished Showdown) or one write request of these paths is billed, and the Rules
    // text the table was generated from (contract tests).
    rulesLookups:Object.freeze({rulesSha256:FSB_RULES_SHA256,read:(path,finished)=>fsbReadLookups(path,finished===true),write:paths=>fsbWriteLookups(Array.isArray(paths)?paths:[paths])}),
    quietReuseMs:FSB_QUIET_MS,
    inputFreshMs:FSB_INPUT_FRESH_MS,
    // wantFresh(): every read of this page is fresh for the next 7 s; wantFresh(path): only that document.
    wantFresh(path){if(typeof path==="string"&&path){fsbFreshPaths.set(path,fsbNow()+FSB_ASK_MS);if(fsbFreshPaths.size>FSB_MAX_ENTRIES)fsbFreshPaths.delete(fsbFreshPaths.keys().next().value);}else fsbFreshAskAt=fsbNow();},
    // readServerNext(path): the next read of that document goes to the server, even inside the 2 s window (revocation checks).
    readServerNext(path){if(typeof path==="string"&&path){fsbServerNext.set(path,fsbNow()+FSB_ASK_MS);if(fsbServerNext.size>FSB_MAX_ENTRIES)fsbServerNext.delete(fsbServerNext.keys().next().value);}},
    isQuotaError:fsbIsQuotaError,
    paused:fsbPaused,
    quotaMessage:fsbQuotaMessage,
    noteError(error){if(fsbIsQuotaError(error))fsbTrip();return fsbQuotaMessage(error);},
    state:fsbState,
    readsToday:fsbReadsToday,
    noteSeasonStart:fsbNoteSeasonStart,
    noteSeasonDone:fsbNoteSeasonDone,
    seasonsLeftToday:fsbSeasonsLeftToday,
    // r87 shared reads meter: sharedEstimate(a, b, day) is the pure both-phones result from two meter documents (contract tests);
    // meterDocuments() the two documents this phone holds today; readPartnerMeter() reads the partner's now (tests).
    sharedEstimate:(a,b,day)=>fsbShareFrom(a,b,typeof day==="string"?day:fsbDayState().day),
    meterDocuments:()=>{const bill=fsbDayState().bill;return Object.freeze({own:bill.own,partner:bill.partner,off:fsbShareOffDay===fsbDayState().day});},
    readPartnerMeter:db=>{const bill=fsbDayState().bill;return bill.own?fsbShareReadPartner(db||fsbFirestore,bill.own):Promise.resolve(null);},
    roleShare:fsbRoleShare,
    braking:()=>fsbBraking(),
    stats:()=>Object.freeze({...fsbStats,remembered:fsbEntries.size,watching:fsbWait?fsbWait.path:null,watchHealthy:fsbWaitLive()}),
    reset(){fsbDetachWait();fsbCtxRivalry=null;fsbCtxDetach();fsbExternal.clear();fsbCtxReturn=[];fsbWaitReturn=null;fsbDenied.clear();fsbCtxFailed.clear();fsbReturnListen([]);fsbWaitFailed.clear();fsbReturnWakes.clear();fsbEntries.clear();fsbInflight.clear();fsbCadence.clear();fsbWaitAsks.clear();fsbFreshPaths.clear();fsbServerNext.clear();fsbPause=null;fsbInputAt=0;fsbFreshAskAt=0;fsbChainAt=0;fsbPublish();}
  });
})(typeof globalThis!=="undefined"?globalThis:this);
