(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkDeviceCredential=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const DB_NAME="careerModeShowdown.deviceCredential";
  const DB_VERSION=1;
  const STORE_NAME="credential";
  const PRIMARY_KEY="primary";
  const SCHEMA_VERSION=1;
  const PROTOCOL="career-mode-showdown-device-credential-v1";
  const PURPOSE="firebase-custom-token-device-credential";
  const DEVICE_CREDENTIAL_VERSION=1;
  const CANONICAL_LOCAL_STORAGE_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);

  function dcFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(dcFreeze);
    return value;
  }

  function credentialError(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function dcNormalizeDeviceId(value){
    const deviceId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^device_[0-9a-f]{32}$/.test(deviceId)){
      throw credentialError("DEVICE_CREDENTIAL_DEVICE_INVALID","A valid registered private device is required.");
    }
    return deviceId;
  }

  function dcBase64Url(bytes){
    let binary="";
    for(const byte of bytes)binary+=String.fromCharCode(byte);
    const encoded=typeof btoa==="function"
      ?btoa(binary)
      :Buffer.from(bytes).toString("base64");
    return encoded.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  }

  function normalizePublicJwk(value){
    if(!value||typeof value!=="object"||Array.isArray(value)){
      throw credentialError("DEVICE_CREDENTIAL_PUBLIC_KEY_INVALID","The device credential public key is invalid.");
    }
    const normalized={
      crv:value.crv,
      kty:value.kty,
      x:value.x,
      y:value.y
    };
    if(
      normalized.kty!=="EC"
      ||normalized.crv!=="P-256"
      ||typeof normalized.x!=="string"
      ||typeof normalized.y!=="string"
      ||!/^[A-Za-z0-9_-]{43}$/.test(normalized.x)
      ||!/^[A-Za-z0-9_-]{43}$/.test(normalized.y)
      ||Object.prototype.hasOwnProperty.call(value,"d")
    ){
      throw credentialError("DEVICE_CREDENTIAL_PUBLIC_KEY_INVALID","The device credential public key must be a P-256 public key.");
    }
    return dcFreeze(normalized);
  }

  function dcHex(bytes){
    return Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");
  }

  async function fingerprintPublicJwk(publicKeyJwk,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function"){
      throw credentialError("DEVICE_CREDENTIAL_CRYPTO_UNAVAILABLE","Secure browser cryptography is unavailable.");
    }
    const normalized=normalizePublicJwk(publicKeyJwk);
    const bytes=new TextEncoder().encode(JSON.stringify(normalized));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${dcHex(new Uint8Array(digest))}`;
  }

  function validPrivateKey(key){
    return Boolean(
      key
      &&key.type==="private"
      &&key.extractable===false
      &&Array.isArray(key.usages)
      &&key.usages.length===1
      &&key.usages[0]==="sign"
      &&key.algorithm
      &&key.algorithm.name==="ECDSA"
      &&key.algorithm.namedCurve==="P-256"
    );
  }

  function validCredentialRecord(value,deviceId){
    return Boolean(
      value
      &&value.schemaVersion===SCHEMA_VERSION
      &&value.deviceId===deviceId
      &&validPrivateKey(value.privateKey)
      &&/^sha256:[0-9a-f]{64}$/.test(value.publicKeyFingerprint||"")
      &&Number.isFinite(value.createdAtEpochMs)
      &&value.createdAtEpochMs>0
    );
  }

  async function generateCredentialRecord(deviceId,options={}){
    const normalizedDeviceId=dcNormalizeDeviceId(deviceId);
    const cryptoImpl=options.cryptoImpl||root.crypto;
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.generateKey!=="function"){
      throw credentialError("DEVICE_CREDENTIAL_CRYPTO_UNAVAILABLE","Secure browser cryptography is unavailable.");
    }
    const keyPair=await cryptoImpl.subtle.generateKey(
      {name:"ECDSA",namedCurve:"P-256"},
      false,
      ["sign","verify"]
    );
    if(!validPrivateKey(keyPair.privateKey)){
      throw credentialError("DEVICE_CREDENTIAL_PRIVATE_KEY_EXPORTABLE","The browser did not create a non-extractable device private key.");
    }
    let exported;
    try{exported=await cryptoImpl.subtle.exportKey("jwk",keyPair.publicKey);}
    catch(_error){throw credentialError("DEVICE_CREDENTIAL_PUBLIC_KEY_INVALID","The device credential public key could not be exported.");}
    const publicKeyJwk=normalizePublicJwk(exported);
    const publicKeyFingerprint=await fingerprintPublicJwk(publicKeyJwk,cryptoImpl);
    return {
      schemaVersion:SCHEMA_VERSION,
      deviceId:normalizedDeviceId,
      privateKey:keyPair.privateKey,
      publicKeyJwk,
      publicKeyFingerprint,
      createdAtEpochMs:options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs)
    };
  }

  function openDatabase(indexedDBImpl=root.indexedDB){
    if(!indexedDBImpl||typeof indexedDBImpl.open!=="function"){
      return Promise.reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage is unavailable."));
    }
    return new Promise((resolve,reject)=>{
      const request=indexedDBImpl.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const database=request.result;
        if(!database.objectStoreNames.contains(STORE_NAME))database.createObjectStore(STORE_NAME);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage could not be opened."));
      request.onblocked=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage is blocked."));
    });
  }

  function readStoredCredential(database){
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction(STORE_NAME,"readonly");
      const request=transaction.objectStore(STORE_NAME).get(PRIMARY_KEY);
      let value;
      request.onsuccess=()=>{value=request.result;};
      request.onerror=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage could not be read."));
      transaction.oncomplete=()=>resolve(value);
      transaction.onerror=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage read failed."));
      transaction.onabort=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage read was aborted."));
    });
  }

  function addStoredCredential(database,record){
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction(STORE_NAME,"readwrite");
      const request=transaction.objectStore(STORE_NAME).add(record,PRIMARY_KEY);
      request.onerror=event=>{
        if(request.error&&request.error.name==="ConstraintError"){
          event.preventDefault();
          event.stopPropagation();
          reject(credentialError("DEVICE_CREDENTIAL_STORAGE_RACE","Another browser context created the device credential first."));
        }
      };
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage could not be committed."));
      transaction.onabort=()=>reject(credentialError("DEVICE_CREDENTIAL_STORAGE_UNAVAILABLE","Private device credential storage write was aborted."));
    });
  }

  async function validateStoredCredential(value,deviceId,cryptoImpl){
    if(!validCredentialRecord(value,deviceId)){
      throw credentialError("DEVICE_CREDENTIAL_STORAGE_CONFLICT","Stored device credential authority is invalid or belongs to another device.");
    }
    const publicKeyJwk=normalizePublicJwk(value.publicKeyJwk);
    const fingerprint=await fingerprintPublicJwk(publicKeyJwk,cryptoImpl);
    if(fingerprint!==value.publicKeyFingerprint){
      throw credentialError("DEVICE_CREDENTIAL_STORAGE_CONFLICT","Stored device credential public-key authority is inconsistent.");
    }
    return dcFreeze({...value,publicKeyJwk});
  }

  async function getOrCreateCredential(deviceId,options={}){
    const normalizedDeviceId=dcNormalizeDeviceId(deviceId);
    const indexedDBImpl=options.indexedDBImpl||root.indexedDB;
    const cryptoImpl=options.cryptoImpl||root.crypto;
    let database;
    try{
      database=await openDatabase(indexedDBImpl);
      const existing=await readStoredCredential(database);
      if(existing!==undefined)return validateStoredCredential(existing,normalizedDeviceId,cryptoImpl);
      const generated=await generateCredentialRecord(normalizedDeviceId,{...options,cryptoImpl});
      try{
        await addStoredCredential(database,generated);
        return dcFreeze({...generated});
      }catch(error){
        if(!error||error.code!=="DEVICE_CREDENTIAL_STORAGE_RACE")throw error;
        const winner=await readStoredCredential(database);
        return validateStoredCredential(winner,normalizedDeviceId,cryptoImpl);
      }
    }finally{if(database&&typeof database.close==="function")database.close();}
  }

  function normalizeChallenge(value,nowEpochMs=Date.now()){
    if(!value||typeof value!=="object"||Array.isArray(value)){
      throw credentialError("DEVICE_CREDENTIAL_CHALLENGE_INVALID","The trusted device challenge is invalid.");
    }
    const challenge={
      protocol:value.protocol,
      purpose:value.purpose,
      challengeId:value.challengeId,
      challengeNonce:value.challengeNonce,
      accountId:value.accountId,
      deviceId:dcNormalizeDeviceId(value.deviceId),
      publicKeyFingerprint:value.publicKeyFingerprint,
      expiresAtEpochMs:Number(value.expiresAtEpochMs)
    };
    if(
      challenge.protocol!==PROTOCOL
      ||challenge.purpose!==PURPOSE
      ||typeof challenge.accountId!=="string"
      ||!challenge.accountId.trim()
      ||!/^credential_challenge_[0-9a-f]{64}$/.test(challenge.challengeId||"")
      ||!/^[A-Za-z0-9_-]{43}$/.test(challenge.challengeNonce||"")
      ||!/^sha256:[0-9a-f]{64}$/.test(challenge.publicKeyFingerprint||"")
      ||!Number.isFinite(challenge.expiresAtEpochMs)
      ||challenge.expiresAtEpochMs<=Number(nowEpochMs)
    ){
      throw credentialError("DEVICE_CREDENTIAL_CHALLENGE_INVALID","The trusted device challenge is invalid or expired.");
    }
    challenge.accountId=challenge.accountId.trim();
    return dcFreeze(challenge);
  }

  function canonicalChallengePayload(challenge){
    const normalized=normalizeChallenge(challenge,0);
    return JSON.stringify({
      accountId:normalized.accountId,
      challengeId:normalized.challengeId,
      challengeNonce:normalized.challengeNonce,
      deviceId:normalized.deviceId,
      expiresAtEpochMs:normalized.expiresAtEpochMs,
      protocol:normalized.protocol,
      publicKeyFingerprint:normalized.publicKeyFingerprint,
      purpose:normalized.purpose
    });
  }

  async function signChallenge(credential,challenge,options={}){
    const cryptoImpl=options.cryptoImpl||root.crypto;
    const normalizedChallenge=normalizeChallenge(challenge,options.nowEpochMs===undefined?Date.now():options.nowEpochMs);
    if(!validCredentialRecord(credential,normalizedChallenge.deviceId)){
      throw credentialError("DEVICE_CREDENTIAL_STORAGE_CONFLICT","The local device credential does not match this challenge.");
    }
    if(credential.publicKeyFingerprint!==normalizedChallenge.publicKeyFingerprint){
      throw credentialError("DEVICE_CREDENTIAL_KEY_MISMATCH","The trusted challenge names a different device key.");
    }
    const payload=new TextEncoder().encode(canonicalChallengePayload(normalizedChallenge));
    const signature=await cryptoImpl.subtle.sign({name:"ECDSA",hash:"SHA-256"},credential.privateKey,payload);
    return dcFreeze({
      challengeId:normalizedChallenge.challengeId,
      publicKeyJwk:normalizePublicJwk(credential.publicKeyJwk),
      publicKeyFingerprint:credential.publicKeyFingerprint,
      signature:dcBase64Url(new Uint8Array(signature))
    });
  }

  function verifyCredentialClaims(tokenResult,credential,nowEpochMs=Date.now()){
    if(!credential||typeof credential!=="object"||Array.isArray(credential)){
      throw credentialError("DEVICE_CREDENTIAL_STORAGE_CONFLICT","The local device credential is required to verify provider claims.");
    }
    const expectedDeviceId=dcNormalizeDeviceId(credential.deviceId);
    const expectedPublicKeyFingerprint=credential.publicKeyFingerprint;
    if(!/^sha256:[0-9a-f]{64}$/.test(expectedPublicKeyFingerprint||"")){
      throw credentialError("DEVICE_CREDENTIAL_STORAGE_CONFLICT","The local device credential fingerprint is invalid.");
    }
    const claims=tokenResult&&tokenResult.claims&&typeof tokenResult.claims==="object"?tokenResult.claims:{};
    const firebase=claims.firebase&&typeof claims.firebase==="object"?claims.firebase:{};
    if(firebase.sign_in_provider!=="custom"){
      throw credentialError("DEVICE_CREDENTIAL_PROVIDER_INVALID","The provider session is not a device-bound custom credential.");
    }
    if(claims.device_id!==expectedDeviceId){
      throw credentialError("DEVICE_CREDENTIAL_CLAIM_MISMATCH","The provider credential does not match this registered device.");
    }
    if(claims.device_credential_version!==DEVICE_CREDENTIAL_VERSION){
      throw credentialError("DEVICE_CREDENTIAL_VERSION_INVALID","The provider device credential version is invalid.");
    }
    if(!/^sha256:[0-9a-f]{64}$/.test(claims.device_key_sha256||"")){
      throw credentialError("DEVICE_CREDENTIAL_KEY_CLAIM_INVALID","The provider device-key claim is invalid.");
    }
    if(claims.device_key_sha256!==expectedPublicKeyFingerprint){
      throw credentialError("DEVICE_CREDENTIAL_KEY_CLAIM_MISMATCH","The provider credential names a different device key.");
    }
    const expirationSeconds=Number(tokenResult.expirationTime?Date.parse(tokenResult.expirationTime)/1000:claims.exp);
    if(!Number.isFinite(expirationSeconds)||expirationSeconds*1000<=Number(nowEpochMs)){
      throw credentialError("DEVICE_CREDENTIAL_PROVIDER_EXPIRED","The provider device credential has expired.");
    }
    return dcFreeze({
      deviceId:expectedDeviceId,
      publicKeyFingerprint:claims.device_key_sha256,
      version:claims.device_credential_version,
      signInProvider:firebase.sign_in_provider
    });
  }

  return dcFreeze({
    contractVersion:1,
    feature:"stage5b-device-credential-foundation",
    protocol:PROTOCOL,
    purpose:PURPOSE,
    protocolState:"dormant-candidate",
    credentialVersion:DEVICE_CREDENTIAL_VERSION,
    storage:"indexeddb-non-extractable-private-key",
    privateKeyExtractable:false,
    algorithm:"ECDSA-P256-SHA256",
    primaryGoogleSessionReplaced:false,
    productionRuntimeLoaded:false,
    productionCredentialIssued:false,
    canonicalLocalStorageMutation:false,
    canonicalLocalStorageKeys:CANONICAL_LOCAL_STORAGE_KEYS,
    normalizeDeviceId:dcNormalizeDeviceId,
    normalizePublicJwk,
    fingerprintPublicJwk,
    generateCredentialRecord,
    getOrCreateCredential,
    normalizeChallenge,
    canonicalChallengePayload,
    signChallenge,
    verifyCredentialClaims
  });
});
