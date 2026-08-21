(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkAccountBootstrap=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  function isRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function deepFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function reject(code){
    return deepFreeze({ok:false,action:"reject",code});
  }

  function normalizeUid(user){
    if(!isRecord(user)||typeof user.uid!=="string"||!user.uid.trim())return null;
    return user.uid.trim();
  }

  function stableStringify(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }

  function canonicalTimestamp(timestamp){
    return {
      "@type":"firestore-timestamp",
      seconds:Number(timestamp.seconds),
      nanoseconds:Number(timestamp.nanoseconds)
    };
  }

  async function sha256AccountData(data,cryptoImpl){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function"){
      throw new Error("SPARK_ACCOUNT_CRYPTO_UNAVAILABLE");
    }
    const canonical=stableStringify({
      createdAt:canonicalTimestamp(data.createdAt),
      deletionRequestedAt:null,
      status:"active"
    });
    const Encoder=typeof TextEncoder!=="undefined"?TextEncoder:root&&root.TextEncoder;
    if(typeof Encoder!=="function")throw new Error("SPARK_ACCOUNT_TEXT_ENCODER_UNAVAILABLE");
    const digest=await cryptoImpl.subtle.digest("SHA-256",new Encoder().encode(canonical));
    return `sha256:${Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }

  function validateExistingAccount(uid,value){
    return isRecord(value)
      && value.schemaVersion===1
      && value.objectType==="account"
      && value.objectId===uid
      && Number.isInteger(value.revision)
      && value.revision>=0
      && value.lifecycleState==="live"
      && isRecord(value.data)
      && ["active","disabled","deletion-pending"].includes(value.data.status);
  }

  async function createInitialEnvelope(uid,Timestamp,cryptoImpl){
    if(!Timestamp||typeof Timestamp.now!=="function")throw new Error("SPARK_ACCOUNT_TIMESTAMP_UNAVAILABLE");
    const now=Timestamp.now();
    const data={status:"active",createdAt:now,deletionRequestedAt:null};
    const contentHash=await sha256AccountData(data,cryptoImpl);
    return {
      schemaVersion:1,
      objectType:"account",
      objectId:uid,
      revision:0,
      parentRevision:null,
      lifecycleState:"live",
      contentHash,
      priorContentHash:null,
      updatedAt:now,
      updatedByAccountId:uid,
      updatedByDeviceId:null,
      data,
      tombstone:null
    };
  }

  async function bootstrapSparkAccount(input){
    if(!isRecord(input))return reject("SPARK_ACCOUNT_INPUT_REQUIRED");
    const uid=normalizeUid(input.user);
    if(!uid)return reject("SPARK_ACCOUNT_AUTH_REQUIRED");
    if(!input.firestore)return reject("SPARK_ACCOUNT_FIRESTORE_REQUIRED");
    const sdk=input.firebaseSdk;
    if(!isRecord(sdk)||typeof sdk.doc!=="function"||typeof sdk.runTransaction!=="function"){
      return reject("SPARK_ACCOUNT_FIRESTORE_SDK_REQUIRED");
    }

    let envelope;
    try{
      envelope=await createInitialEnvelope(uid,sdk.Timestamp,input.cryptoImpl||(root&&root.crypto));
    }catch(_error){
      return reject("SPARK_ACCOUNT_ENVELOPE_FAILED");
    }

    try{
      const accountRef=sdk.doc(input.firestore,"accounts",uid);
      return await sdk.runTransaction(input.firestore,async transaction=>{
        const snapshot=await transaction.get(accountRef);
        if(snapshot.exists()){
          const existing=snapshot.data();
          if(!validateExistingAccount(uid,existing))return reject("SPARK_ACCOUNT_DOCUMENT_CONFLICT");
          return deepFreeze({
            ok:true,
            action:"existing",
            accountId:uid,
            documentPath:`accounts/${uid}`,
            status:existing.data.status,
            revision:existing.revision,
            preserveExisting:true
          });
        }
        transaction.set(accountRef,envelope);
        return deepFreeze({
          ok:true,
          action:"created",
          accountId:uid,
          documentPath:`accounts/${uid}`,
          revision:0,
          preserveExisting:false
        });
      });
    }catch(_error){
      return reject("SPARK_ACCOUNT_BOOTSTRAP_FAILED");
    }
  }

  return deepFreeze({
    contractVersion:1,
    providerMode:"firebase-spark-client",
    billingRequired:false,
    blazeRequired:false,
    cloudRunRequired:false,
    cloudFunctionsRequired:false,
    accountPath:"accounts/{uid}",
    writeScope:"self-account-create-only",
    storesSensitiveProfileData:false,
    productionActivated:false,
    remoteJoiningReadinessCredit:false,
    bootstrap:bootstrapSparkAccount
  });
});
