(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkPrivateSession=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SESSION_ID_BYTES=32;
  const DEFAULT_SESSION_TTL_MS=15*60*1000;
  const MAX_SESSION_TTL_MS=30*60*1000;
  const MIN_SESSION_TTL_MS=1000;
  const SESSION_STATES=Object.freeze(["open","active","revoked","expired","closed"]);
  const TERMINAL_SESSION_STATES=Object.freeze(["revoked","expired","closed"]);
  const SESSION_DATA_FIELDS=Object.freeze([
    "createdAt",
    "expiresAt",
    "hostAccountId",
    "lastActivityAt",
    "memberAccountIds",
    "revokedAt",
    "rivalryId",
    "state"
  ]);

  function freezeSessionValue(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeSessionValue);
    return value;
  }

  function sessionError(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function sessionResultError(error,fallbackCode="PRIVATE_SESSION_FAILED"){
    return {
      ok:false,
      code:error&&typeof error.code==="string"?error.code:fallbackCode,
      message:error&&error.message?error.message:"The private session operation could not be completed."
    };
  }

  function hex(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
  }

  function generateSessionId(cryptoImpl=root.crypto){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function"){
      throw sessionError("PRIVATE_SESSION_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    }
    const bytes=new Uint8Array(SESSION_ID_BYTES);
    cryptoImpl.getRandomValues(bytes);
    return `session_${hex(bytes)}`;
  }

  function normalizeSessionId(value){
    const sessionId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^session_[0-9a-f]{64}$/.test(sessionId)){
      throw sessionError("PRIVATE_SESSION_ID_INVALID","The exact private session code is invalid.");
    }
    return sessionId;
  }

  function normalizeRivalryId(value){
    const rivalryId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^pair_[0-9a-f]{64}$/.test(rivalryId)){
      throw sessionError("PRIVATE_SESSION_RIVALRY_ID_INVALID","The exact paired rivalry code is invalid.");
    }
    return rivalryId;
  }

  function normalizeSessionAccountId(user){
    const accountId=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!accountId)throw sessionError("PRIVATE_SESSION_AUTH_REQUIRED","A ready private account is required.");
    return accountId;
  }

  function normalizeDeviceId(value){
    const deviceId=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^device_[0-9a-f]{32}$/.test(deviceId)){
      throw sessionError("PRIVATE_SESSION_DEVICE_NOT_REGISTERED","A current registered private device is required.");
    }
    return deviceId;
  }

  function normalizeNow(value){
    const nowEpochMs=value===undefined?Date.now():Number(value);
    if(!Number.isFinite(nowEpochMs)||nowEpochMs<=0){
      throw sessionError("PRIVATE_SESSION_TIME_INVALID","A valid current time is required.");
    }
    return nowEpochMs;
  }

  function normalizeTtl(value){
    const ttlMs=value===undefined?DEFAULT_SESSION_TTL_MS:Number(value);
    if(!Number.isFinite(ttlMs)||ttlMs<MIN_SESSION_TTL_MS||ttlMs>MAX_SESSION_TTL_MS){
      throw sessionError("PRIVATE_SESSION_TTL_INVALID","Private sessions must expire between one second and thirty minutes after creation.");
    }
    return ttlMs;
  }

  function validateSdk(firestore,firebaseSdk){
    if(!firestore)throw sessionError("PRIVATE_SESSION_PROVIDER_UNAVAILABLE","Private Firestore services are unavailable.");
    for(const name of ["doc","runTransaction"]){
      if(!firebaseSdk||typeof firebaseSdk[name]!=="function"){
        throw sessionError("PRIVATE_SESSION_PROVIDER_UNAVAILABLE",`Private Firestore SDK method unavailable: ${name}.`);
      }
    }
    if(!firebaseSdk.Timestamp||typeof firebaseSdk.Timestamp.fromMillis!=="function"){
      throw sessionError("PRIVATE_SESSION_PROVIDER_UNAVAILABLE","Firestore Timestamp support is unavailable.");
    }
  }

  function canonicalizeSessionValue(value){
    if(value===undefined)return null;
    if(value===null)return null;
    if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
    if(value instanceof Date)return {$timestamp:value.getTime()};
    if(Array.isArray(value))return value.map(canonicalizeSessionValue);
    if(typeof value==="object"){
      const output={};
      for(const key of Object.keys(value).sort())output[key]=canonicalizeSessionValue(value[key]);
      return output;
    }
    return value;
  }

  async function sha256SessionValue(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function"){
      throw sessionError("PRIVATE_SESSION_CRYPTO_UNAVAILABLE","Secure SHA-256 support is unavailable.");
    }
    const bytes=new TextEncoder().encode(JSON.stringify(canonicalizeSessionValue(value)));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${hex(new Uint8Array(digest))}`;
  }

  async function buildSessionEnvelope({sessionId,revision,parentRevision,priorContentHash,updatedAt,accountId,deviceId,data,cryptoImpl=root.crypto}){
    const contentHash=await sha256SessionValue({objectType:"session",objectId:sessionId,revision,data},cryptoImpl);
    return {
      schemaVersion:1,
      objectType:"session",
      objectId:sessionId,
      revision,
      parentRevision,
      lifecycleState:"live",
      contentHash,
      priorContentHash,
      updatedAt,
      updatedByAccountId:accountId,
      updatedByDeviceId:deviceId,
      data,
      tombstone:null
    };
  }

  function sessionTimestampMillis(value){
    if(value&&typeof value.toMillis==="function")return value.toMillis();
    if(value instanceof Date)return value.getTime();
    return Number.NaN;
  }

  function snapshotValue(snapshot){
    return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;
  }

  function isSessionEnvelopeShape(value,objectType,objectId){
    return Boolean(
      value
      && value.schemaVersion===1
      && value.objectType===objectType
      && value.objectId===objectId
      && Number.isInteger(value.revision)
      && value.revision>=0
      && value.lifecycleState==="live"
      && typeof value.contentHash==="string"
      && /^sha256:[0-9a-f]{64}$/.test(value.contentHash)
      && value.data&&typeof value.data==="object"
      && value.tombstone===null
    );
  }

  function assertActiveAccount(value,accountId){
    if(!isSessionEnvelopeShape(value,"account",accountId)||!value.data||value.data.status!=="active"){
      throw sessionError("PRIVATE_SESSION_ACCOUNT_INACTIVE","The current private account is not active.");
    }
    return value;
  }

  function assertActiveDevice(value,deviceId){
    if(!isSessionEnvelopeShape(value,"device",deviceId)||!value.data||value.data.deviceId!==deviceId){
      throw sessionError("PRIVATE_SESSION_DEVICE_NOT_REGISTERED","This browser is not a registered private device.");
    }
    if(value.data.state==="revoked"){
      throw sessionError("PRIVATE_SESSION_DEVICE_REVOKED","This registered device has been revoked.");
    }
    if(value.data.state!=="active"){
      throw sessionError("PRIVATE_SESSION_DEVICE_INACTIVE","This registered device is not active.");
    }
    return value;
  }

  function assertActiveRivalry(value,rivalryId,accountId){
    if(!isSessionEnvelopeShape(value,"rivalry",rivalryId)||!value.data||value.data.connectionState!=="active"){
      throw sessionError("PRIVATE_SESSION_RIVALRY_INACTIVE","The exact paired rivalry is not active.");
    }
    const authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[];
    if(authorized.length!==2||authorized[0]===authorized[1]||authorized.some(id=>typeof id!=="string")){
      throw sessionError("PRIVATE_SESSION_RIVALRY_INVALID","The rivalry does not have exactly two distinct entitled accounts.");
    }
    if(!authorized.includes(accountId)){
      throw sessionError("PRIVATE_SESSION_RIVALRY_NOT_ENTITLED","The current account is not entitled to this rivalry.");
    }
    if(
      slots.length!==2
      || slots.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")
      || !authorized.every(id=>slots.some(slot=>slot.accountId===id))
    ){
      throw sessionError("PRIVATE_SESSION_RIVALRY_INVALID","The rivalry manager authority is incomplete.");
    }
    return Object.freeze({value,authorizedAccountIds:Object.freeze([...authorized])});
  }

  function assertSessionShape(value,rivalryId,sessionId){
    if(!isSessionEnvelopeShape(value,"session",sessionId)){
      throw sessionError("PRIVATE_SESSION_INVALID","Private session authority is invalid.");
    }
    const data=value.data;
    if(JSON.stringify(Object.keys(data).sort())!==JSON.stringify(SESSION_DATA_FIELDS)){
      throw sessionError("PRIVATE_SESSION_INVALID","Private session fields are invalid.");
    }
    const members=Array.isArray(data.memberAccountIds)?data.memberAccountIds:[];
    const createdAtEpochMs=sessionTimestampMillis(data.createdAt);
    const expiresAtEpochMs=sessionTimestampMillis(data.expiresAt);
    const lastActivityEpochMs=data.lastActivityAt===null?null:sessionTimestampMillis(data.lastActivityAt);
    const revokedAtEpochMs=data.revokedAt===null?null:sessionTimestampMillis(data.revokedAt);
    if(
      data.rivalryId!==rivalryId
      || typeof data.hostAccountId!=="string"
      || !SESSION_STATES.includes(data.state)
      || members.length<1
      || members.length>2
      || new Set(members).size!==members.length
      || members.some(id=>typeof id!=="string")
      || !members.includes(data.hostAccountId)
      || !Number.isFinite(createdAtEpochMs)
      || !Number.isFinite(expiresAtEpochMs)
      || expiresAtEpochMs<=createdAtEpochMs
      || (lastActivityEpochMs!==null&&!Number.isFinite(lastActivityEpochMs))
      || (revokedAtEpochMs!==null&&!Number.isFinite(revokedAtEpochMs))
      || (data.state==="open"&&(members.length!==1||lastActivityEpochMs!==null||revokedAtEpochMs!==null))
      || (data.state==="active"&&(members.length!==2||lastActivityEpochMs===null||revokedAtEpochMs!==null))
      || (data.state==="revoked"&&(lastActivityEpochMs===null||revokedAtEpochMs===null))
      || ((data.state==="expired"||data.state==="closed")&&(lastActivityEpochMs===null||revokedAtEpochMs!==null))
    ){
      throw sessionError("PRIVATE_SESSION_INVALID","Private session lifecycle authority is invalid.");
    }
    return Object.freeze({value,data,members:Object.freeze([...members]),createdAtEpochMs,expiresAtEpochMs,lastActivityEpochMs,revokedAtEpochMs});
  }

  async function verifySession(value,rivalryId,sessionId,cryptoImpl=root.crypto){
    const session=assertSessionShape(value,rivalryId,sessionId);
    const expected=await sha256SessionValue({objectType:"session",objectId:sessionId,revision:value.revision,data:value.data},cryptoImpl);
    if(expected!==value.contentHash){
      throw sessionError("PRIVATE_SESSION_INTEGRITY_FAILED","Private session integrity verification failed.");
    }
    return session;
  }

  function normalizeOperation(options={}){
    validateSdk(options.firestore,options.firebaseSdk);
    return Object.freeze({
      firestore:options.firestore,
      firebaseSdk:options.firebaseSdk,
      accountId:normalizeSessionAccountId(options.user),
      deviceId:normalizeDeviceId(options.deviceId),
      rivalryId:normalizeRivalryId(options.rivalryId),
      sessionId:normalizeSessionId(options.sessionId),
      nowEpochMs:normalizeNow(options.nowEpochMs),
      cryptoImpl:options.cryptoImpl||root.crypto
    });
  }

  function references(operation){
    const sdk=operation.firebaseSdk;
    const db=operation.firestore;
    return Object.freeze({
      account:sdk.doc(db,"accounts",operation.accountId),
      device:sdk.doc(db,"accounts",operation.accountId,"devices",operation.deviceId),
      rivalry:sdk.doc(db,"rivalries",operation.rivalryId),
      session:sdk.doc(db,"rivalries",operation.rivalryId,"sessions",operation.sessionId)
    });
  }

  async function readAuthority(transaction,operation,refs){
    const accountSnapshot=await transaction.get(refs.account);
    assertActiveAccount(snapshotValue(accountSnapshot),operation.accountId);
    const deviceSnapshot=await transaction.get(refs.device);
    assertActiveDevice(snapshotValue(deviceSnapshot),operation.deviceId);
    const rivalrySnapshot=await transaction.get(refs.rivalry);
    const rivalry=assertActiveRivalry(snapshotValue(rivalrySnapshot),operation.rivalryId,operation.accountId);
    const sessionSnapshot=await transaction.get(refs.session);
    return Object.freeze({rivalry,sessionValue:snapshotValue(sessionSnapshot)});
  }

  function resultFromSession(sessionId,status,replayed,value){
    const session=assertSessionShape(value,value.data.rivalryId,sessionId);
    return {
      ok:true,
      status,
      replayed:Boolean(replayed),
      sessionId,
      rivalryId:session.data.rivalryId,
      state:session.data.state,
      revision:value.revision,
      contentHash:value.contentHash,
      hostAccountId:session.data.hostAccountId,
      memberAccountIds:[...session.members],
      createdAtEpochMs:session.createdAtEpochMs,
      expiresAtEpochMs:session.expiresAtEpochMs,
      lastActivityAtEpochMs:session.lastActivityEpochMs,
      revokedAtEpochMs:session.revokedAtEpochMs
    };
  }

  async function openSession(options={}){
    try{
      const operation=normalizeOperation(options);
      const ttlMs=normalizeTtl(options.ttlMs);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(authority.sessionValue){
          const existing=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
          if(existing.data.hostAccountId!==operation.accountId){
            throw sessionError("PRIVATE_SESSION_CONFLICT","This private session code is already bound to different host authority.");
          }
          return resultFromSession(operation.sessionId,"replayed",true,authority.sessionValue);
        }
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const expiresAt=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs+ttlMs);
        const data={
          rivalryId:operation.rivalryId,
          hostAccountId:operation.accountId,
          memberAccountIds:[operation.accountId],
          state:"open",
          createdAt:now,
          expiresAt,
          lastActivityAt:null,
          revokedAt:null
        };
        const envelope=await buildSessionEnvelope({
          sessionId:operation.sessionId,
          revision:0,
          parentRevision:null,
          priorContentHash:null,
          updatedAt:now,
          accountId:operation.accountId,
          deviceId:operation.deviceId,
          data,
          cryptoImpl:operation.cryptoImpl
        });
        transaction.set(refs.session,envelope);
        return resultFromSession(operation.sessionId,"accepted",false,envelope);
      });
    }catch(error){
      return sessionResultError(error,"PRIVATE_SESSION_OPEN_FAILED");
    }
  }

  async function joinSession(options={}){
    try{
      const operation=normalizeOperation(options);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(!authority.sessionValue)throw sessionError("PRIVATE_SESSION_NOT_FOUND","The exact private session is unavailable.");
        const session=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        if(session.data.hostAccountId===operation.accountId){
          throw sessionError("PRIVATE_SESSION_HOST_CANNOT_JOIN","The host account cannot join its own private session as the peer.");
        }
        if(session.data.state==="active"){
          if(session.members.length===2&&session.members.includes(operation.accountId)){
            return resultFromSession(operation.sessionId,"replayed",true,authority.sessionValue);
          }
          throw sessionError("PRIVATE_SESSION_CONFLICT","Active private session membership conflicts with this account.");
        }
        if(session.data.state!=="open"){
          throw sessionError("PRIVATE_SESSION_NOT_JOINABLE","This private session is no longer open.");
        }
        if(operation.nowEpochMs>=session.expiresAtEpochMs){
          throw sessionError("PRIVATE_SESSION_EXPIRED","This private session has expired.");
        }
        const expectedMembers=new Set(authority.rivalry.authorizedAccountIds);
        if(!expectedMembers.has(session.data.hostAccountId)||!expectedMembers.has(operation.accountId)||expectedMembers.size!==2){
          throw sessionError("PRIVATE_SESSION_RIVALRY_INVALID","Session membership does not match the paired rivalry.");
        }
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const data={
          ...session.data,
          memberAccountIds:[session.data.hostAccountId,operation.accountId],
          state:"active",
          lastActivityAt:now,
          revokedAt:null
        };
        const envelope=await buildSessionEnvelope({
          sessionId:operation.sessionId,
          revision:authority.sessionValue.revision+1,
          parentRevision:authority.sessionValue.revision,
          priorContentHash:authority.sessionValue.contentHash,
          updatedAt:now,
          accountId:operation.accountId,
          deviceId:operation.deviceId,
          data,
          cryptoImpl:operation.cryptoImpl
        });
        transaction.set(refs.session,envelope);
        return resultFromSession(operation.sessionId,"accepted",false,envelope);
      });
    }catch(error){
      return sessionResultError(error,"PRIVATE_SESSION_JOIN_FAILED");
    }
  }

  async function readSession(options={}){
    try{
      const operation=normalizeOperation(options);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(!authority.sessionValue)throw sessionError("PRIVATE_SESSION_NOT_FOUND","The exact private session is unavailable.");
        const session=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        if(session.data.state!=="open"&&!session.members.includes(operation.accountId)){
          throw sessionError("PRIVATE_SESSION_MEMBER_REQUIRED","The current account is not a member of this private session.");
        }
        const result=resultFromSession(operation.sessionId,"observed",false,authority.sessionValue);
        result.expiredByClock=(session.data.state==="open"||session.data.state==="active")&&operation.nowEpochMs>=session.expiresAtEpochMs;
        return result;
      });
    }catch(error){
      return sessionResultError(error,"PRIVATE_SESSION_READ_FAILED");
    }
  }

  async function transitionSession(options,targetState){
    try{
      const operation=normalizeOperation(options);
      const refs=references(operation);
      return await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const authority=await readAuthority(transaction,operation,refs);
        if(!authority.sessionValue)throw sessionError("PRIVATE_SESSION_NOT_FOUND","The exact private session is unavailable.");
        const session=await verifySession(authority.sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);
        const isHost=session.data.hostAccountId===operation.accountId;
        const isMember=session.members.includes(operation.accountId);
        if(targetState==="revoked"&&!isHost){
          throw sessionError("PRIVATE_SESSION_HOST_REQUIRED","Only the current host may revoke this private session.");
        }
        if((targetState==="closed"||targetState==="expired")&&!isMember){
          throw sessionError("PRIVATE_SESSION_MEMBER_REQUIRED","Current private-session membership is required.");
        }
        if(session.data.state===targetState){
          return resultFromSession(operation.sessionId,"replayed",true,authority.sessionValue);
        }
        if(TERMINAL_SESSION_STATES.includes(session.data.state)){
          throw sessionError("PRIVATE_SESSION_TERMINAL","A terminal private session cannot transition again.");
        }
        if(targetState!=="expired"&&operation.nowEpochMs>=session.expiresAtEpochMs){
          throw sessionError("PRIVATE_SESSION_EXPIRED","This private session must expire rather than transition to another state.");
        }
        if(targetState==="closed"&&session.data.state!=="active"){
          throw sessionError("PRIVATE_SESSION_CLOSE_NOT_ALLOWED","Only an active private session may close.");
        }
        if(targetState==="expired"&&operation.nowEpochMs<session.expiresAtEpochMs){
          throw sessionError("PRIVATE_SESSION_NOT_EXPIRED","The private session expiry boundary has not been reached.");
        }
        if(targetState==="expired"&&session.data.state==="open"&&!isHost){
          throw sessionError("PRIVATE_SESSION_HOST_REQUIRED","Only the open-session host may record expiry before peer membership exists.");
        }
        const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs);
        const data={
          ...session.data,
          state:targetState,
          lastActivityAt:now,
          revokedAt:targetState==="revoked"?now:null
        };
        const envelope=await buildSessionEnvelope({
          sessionId:operation.sessionId,
          revision:authority.sessionValue.revision+1,
          parentRevision:authority.sessionValue.revision,
          priorContentHash:authority.sessionValue.contentHash,
          updatedAt:now,
          accountId:operation.accountId,
          deviceId:operation.deviceId,
          data,
          cryptoImpl:operation.cryptoImpl
        });
        transaction.set(refs.session,envelope);
        return resultFromSession(operation.sessionId,"accepted",false,envelope);
      });
    }catch(error){
      return sessionResultError(error,`PRIVATE_SESSION_${String(targetState||"transition").toUpperCase()}_FAILED`);
    }
  }

  const api={
    contractVersion:1,
    feature:"stage5a-private-session-protocol",
    protocolState:"candidate-emulator-boundary",
    memoryOnly:true,
    persistentFirestoreCache:false,
    publicDiscovery:false,
    collectionListing:false,
    exactCapabilityBits:SESSION_ID_BYTES*8,
    defaultSessionTtlMs:DEFAULT_SESSION_TTL_MS,
    maxSessionTtlMs:MAX_SESSION_TTL_MS,
    sessionStates:SESSION_STATES,
    productionRulesPublished:false,
    hostJoinUxExposed:false,
    gameplayMutation:false,
    canonicalStorageMutation:false,
    candidateCInvolved:false,
    billingRequired:false,
    generateSessionId,
    normalizeSessionId,
    normalizeRivalryId,
    buildEnvelope:buildSessionEnvelope,
    verifySession,
    openSession,
    joinSession,
    readSession,
    revokeSession:options=>transitionSession(options,"revoked"),
    expireSession:options=>transitionSession(options,"expired"),
    closeSession:options=>transitionSession(options,"closed")
  };

  return freezeSessionValue(api);
});
