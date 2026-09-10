(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedJourneyConflicts=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r15";
  const DEFAULT_TTL_MS=120000;
  const MAX_TTL_MS=600000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const SURFACES=Object.freeze({
    "shared-setup":Object.freeze(["open","commit-league","commit-clubs","commit-length","confirm"]),
    "season-commit":Object.freeze(["commit-season","acknowledge-season"])
  });
  const RIVALRY=/^pair_[0-9a-f]{64}$/;
  const SESSION=/^session_[0-9a-f]{64}$/;
  const DEVICE=/^device_[0-9a-f]{32}$/;
  const OPERATION=/^(?:setup_op|season_commit_op)_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RECEIPT_KEYS=Object.freeze([
    "schemaVersion","runtimeRevision","surface","action","operationId","baseRevision","attemptHash","staticHash","authorityKey",
    "classification","providerCode","ok","providerInvoked","observedAtEpochMs","expiresAtEpochMs","retryCount","authoritative",
    "canonicalStorageMutation","providerWriteRequired","listPermissionRequired","billingRequired"
  ]);

  function jcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function jcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function jcExact(value,keys,code){if(!jcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))jcFail(code);return value;}
  function jcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(jcFreeze);Object.freeze(value);}return value;}
  function jcClone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function jcCanonical(value){if(Array.isArray(value))return `[${value.map(jcCanonical).join(",")}]`;if(jcPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${jcCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function jcHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")jcFail("JOURNEY_CONFLICT_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(jcCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function jcEpoch(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<0)jcFail("JOURNEY_CONFLICT_CLOCK_INVALID");return n;}
  function jcTtl(value){const n=Number(value??DEFAULT_TTL_MS);if(!Number.isSafeInteger(n)||n<1000||n>MAX_TTL_MS)jcFail("JOURNEY_CONFLICT_TTL_INVALID");return n;}
  function jcAccount(value){const id=String(value||"").trim();if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))jcFail("JOURNEY_CONFLICT_ACCOUNT_INVALID");return id;}
  function jcId(value,pattern,code){const id=String(value||"").trim();if(!pattern.test(id))jcFail(code);return id;}
  function jcRole(value){if(!ROLES.includes(value))jcFail("JOURNEY_CONFLICT_ROLE_INVALID");return value;}
  function jcSurface(value){const surface=String(value||"");if(!Object.hasOwn(SURFACES,surface))jcFail("JOURNEY_CONFLICT_SURFACE_INVALID");return surface;}
  function jcAction(surface,value){const action=String(value||"");if(!SURFACES[surface].includes(action))jcFail("JOURNEY_CONFLICT_ACTION_INVALID");return action;}
  function jcBase(value){const n=Number(value);if(!Number.isInteger(n)||n<0||n>100)jcFail("JOURNEY_CONFLICT_BASE_INVALID");return n;}
  function jcIntent(value){if(value===undefined||value===null)return {};if(!jcPlain(value))jcFail("JOURNEY_CONFLICT_INTENT_INVALID");const clone=jcClone(value);const encoded=JSON.stringify(clone);if(encoded.length>2048)jcFail("JOURNEY_CONFLICT_INTENT_INVALID");return clone;}
  function jcAuthority(value){
    jcExact(value,["accountId","deviceId","rivalryId","sessionId","managerRole"],"JOURNEY_CONFLICT_AUTHORITY_INVALID");
    return jcFreeze({
      accountId:jcAccount(value.accountId),
      deviceId:jcId(value.deviceId,DEVICE,"JOURNEY_CONFLICT_DEVICE_INVALID"),
      rivalryId:jcId(value.rivalryId,RIVALRY,"JOURNEY_CONFLICT_RIVALRY_INVALID"),
      sessionId:jcId(value.sessionId,SESSION,"JOURNEY_CONFLICT_SESSION_INVALID"),
      managerRole:jcRole(value.managerRole)
    });
  }
  function jcNormalizeCode(value){return String(value||"").trim().toUpperCase().replace(/-/g,"_");}
  function jcClassification(result){
    if(result&&result.ok===true)return "ACCEPTED";
    const code=jcNormalizeCode(result?.code||"PROVIDER_FAILED");
    if(code.includes("JOURNEY_CONFLICT_RECEIPT_EXPIRED"))return "RECEIPT_EXPIRED";
    if(code.includes("IDEMPOTENCY_CONFLICT")||code.includes("REPLAY_ALTERED")||code.includes("HISTORY_REWRITE")||code.includes("INTEGRITY")||code.includes("HASH_MISMATCH"))return "REPLAY_ALTERED";
    if(code.includes("STALE")||code==="ABORTED")return "STALE";
    if(code.includes("RESOURCE_EXHAUSTED")||code.includes("QUOTA")||code.includes("TOO_MANY_REQUESTS"))return "QUOTA";
    if(code.includes("PERMISSION_DENIED")||code.includes("UNAUTHENTICATED")||code.includes("AUTH_REQUIRED")||code.includes("AUTHORITY_MISMATCH")||code.includes("ACTOR_NOT_ENTITLED")||code.includes("COORDINATOR_REQUIRED")||code.includes("MANAGER_INACTIVE")||code.includes("DEVICE_INACTIVE")||code.includes("RIVALRY_INACTIVE")||code.includes("ACTIVE_SESSION_REQUIRED")||code.includes("SESSION_MISMATCH")||code.includes("SESSION_MEMBERS_MISMATCH"))return "UNAUTHORIZED";
    if(code.includes("UNAVAILABLE")||code.includes("DEADLINE_EXCEEDED")||code.includes("NETWORK")||code.includes("FAILED_PRECONDITION"))return "TRANSIENT";
    return "DENIED";
  }
  function jcVerifyReceipt(value){
    jcExact(value,RECEIPT_KEYS,"JOURNEY_CONFLICT_RECEIPT_INVALID");
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Object.hasOwn(SURFACES,value.surface)||!SURFACES[value.surface].includes(value.action)||!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!HASH.test(value.attemptHash)||!HASH.test(value.staticHash)||typeof value.authorityKey!=="string"||!value.authorityKey||!["ACCEPTED","STALE","REPLAY_ALTERED","UNAUTHORIZED","QUOTA","TRANSIENT","DENIED","RECEIPT_EXPIRED"].includes(value.classification)||!(value.providerCode===null||typeof value.providerCode==="string")||typeof value.ok!=="boolean"||typeof value.providerInvoked!=="boolean"||!Number.isSafeInteger(value.observedAtEpochMs)||!Number.isSafeInteger(value.expiresAtEpochMs)||value.expiresAtEpochMs<=value.observedAtEpochMs||!Number.isInteger(value.retryCount)||value.retryCount<0||value.retryCount>1||value.authoritative!==false||value.canonicalStorageMutation!==false||value.providerWriteRequired!==false||value.listPermissionRequired!==false||value.billingRequired!==false)jcFail("JOURNEY_CONFLICT_RECEIPT_INVALID");
    if(value.ok!==(value.classification==="ACCEPTED"))jcFail("JOURNEY_CONFLICT_RECEIPT_INVALID");
    return jcFreeze(jcClone(value));
  }

  function createGuard({cryptoImpl=root.crypto,receiptTtlMs=DEFAULT_TTL_MS}={}){
    const ttl=jcTtl(receiptTtlMs),receipts=new Map();let lastReceipt=null;
    async function normalizeAttempt(options){
      if(!jcPlain(options))jcFail("JOURNEY_CONFLICT_ATTEMPT_INVALID");
      const surface=jcSurface(options.surface),action=jcAction(surface,options.action),operationId=jcId(options.operationId,OPERATION,"JOURNEY_CONFLICT_OPERATION_INVALID"),baseRevision=jcBase(options.baseRevision),authority=jcAuthority(options.authority),intent=jcIntent(options.intent),nowEpochMs=jcEpoch(options.nowEpochMs===undefined?Date.now():options.nowEpochMs);
      const authorityKey=`${authority.accountId}|${authority.deviceId}|${authority.rivalryId}|${authority.sessionId}|${authority.managerRole}`;
      const staticHash=await jcHash({surface,action,operationId,authority,intent},cryptoImpl),attemptHash=await jcHash({surface,action,operationId,authority,intent,baseRevision},cryptoImpl);
      return jcFreeze({surface,action,operationId,baseRevision,authority,intent,authorityKey,staticHash,attemptHash,nowEpochMs});
    }
    function key(attempt){return `${attempt.surface}|${attempt.operationId}`;}
    function receiptFor(attempt){return receipts.get(key(attempt))||null;}
    function makeReceipt(attempt,{classification,providerCode=null,providerInvoked,retryCount=0}){
      const receipt={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,surface:attempt.surface,action:attempt.action,operationId:attempt.operationId,baseRevision:attempt.baseRevision,attemptHash:attempt.attemptHash,staticHash:attempt.staticHash,authorityKey:attempt.authorityKey,classification,providerCode,ok:classification==="ACCEPTED",providerInvoked:Boolean(providerInvoked),observedAtEpochMs:attempt.nowEpochMs,expiresAtEpochMs:attempt.nowEpochMs+ttl,retryCount,authoritative:false,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};
      const verified=jcVerifyReceipt(receipt);receipts.set(key(attempt),verified);lastReceipt=verified;return verified;
    }
    async function preflight(options){
      const attempt=await normalizeAttempt(options),prior=receiptFor(attempt);
      if(!prior)return jcFreeze({attempt,prior:null,staleRetry:false});
      if(attempt.nowEpochMs>=prior.expiresAtEpochMs){makeReceipt(attempt,{classification:"RECEIPT_EXPIRED",providerCode:"JOURNEY_CONFLICT_RECEIPT_EXPIRED",providerInvoked:false,retryCount:prior.retryCount});jcFail("JOURNEY_CONFLICT_RECEIPT_EXPIRED");}
      if(prior.staticHash!==attempt.staticHash){makeReceipt(attempt,{classification:"REPLAY_ALTERED",providerCode:"JOURNEY_CONFLICT_REPLAY_ALTERED",providerInvoked:false,retryCount:prior.retryCount});jcFail("JOURNEY_CONFLICT_REPLAY_ALTERED");}
      if(prior.attemptHash===attempt.attemptHash)return jcFreeze({attempt,prior,staleRetry:false});
      const staleRetry=prior.classification==="STALE"&&prior.retryCount===0&&attempt.baseRevision>prior.baseRevision;
      if(!staleRetry){makeReceipt(attempt,{classification:"REPLAY_ALTERED",providerCode:"JOURNEY_CONFLICT_REPLAY_ALTERED",providerInvoked:false,retryCount:prior.retryCount});jcFail("JOURNEY_CONFLICT_REPLAY_ALTERED");}
      return jcFreeze({attempt,prior,staleRetry:true});
    }
    async function execute(options,invoke){
      if(typeof invoke!=="function")jcFail("JOURNEY_CONFLICT_PROVIDER_CALL_INVALID");
      const flight=await preflight(options),attempt=flight.attempt,retryCount=flight.prior?flight.prior.retryCount+(flight.staleRetry?1:0):0;
      try{
        const result=await invoke();
        const classification=jcClassification(result),providerCode=result&&result.ok===true?null:String(result?.code||"PROVIDER_FAILED");
        makeReceipt(attempt,{classification,providerCode,providerInvoked:true,retryCount});
        return result;
      }catch(error){
        const providerCode=String(error&&error.code||"PROVIDER_THROWN"),classification=jcClassification({ok:false,code:providerCode});
        makeReceipt(attempt,{classification,providerCode,providerInvoked:true,retryCount});throw error;
      }
    }
    function getReceipt(surface,operationId){return receipts.get(`${surface}|${operationId}`)||null;}
    function clearExpired(nowEpochMs=Date.now()){const now=jcEpoch(nowEpochMs);let removed=0;for(const [entryKey,receipt] of receipts){if(now>=receipt.expiresAtEpochMs){receipts.delete(entryKey);removed+=1;}}if(lastReceipt&&now>=lastReceipt.expiresAtEpochMs)lastReceipt=null;return removed;}
    function reset(){receipts.clear();lastReceipt=null;return true;}
    return jcFreeze({contractVersion:1,feature:"ssjr-shared-journey-conflicts",runtimeRevision:RUNTIME_REVISION,receiptTtlMs:ttl,execute,preflight,verifyReceipt:jcVerifyReceipt,getReceipt,getLastReceipt:()=>lastReceipt,clearExpired,reset,classify:jcClassification,providerAuthorityPreserved:true,nonAuthorizingReceipts:true,boundedStaleRetry:true,alteredReplayPreProviderDenied:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-journey-conflicts-protocol-factory",runtimeRevision:RUNTIME_REVISION,defaultReceiptTtlMs:DEFAULT_TTL_MS,maxReceiptTtlMs:MAX_TTL_MS,roles:ROLES,surfaces:SURFACES,createGuard,classify:jcClassification,verifyReceipt:jcVerifyReceipt,providerAuthorityPreserved:true,nonAuthorizingReceipts:true,boundedStaleRetry:true,alteredReplayPreProviderDenied:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
});
