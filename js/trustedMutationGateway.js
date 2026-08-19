(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedMutationGateway=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const GATEWAY_STAGE="remaining-stage2-trusted-mutation-gateway";
  const RESPONSE_STATUSES=Object.freeze([
    "accepted","replayed","conflict","forbidden","invalid-request","idempotency-conflict"
  ]);
  const STAGE2H_RUNTIME_PERMISSIONS=Object.freeze([
    "firebaseauth.users.get",
    "datastore.databases.get",
    "datastore.entities.get",
    "datastore.entities.create"
  ]);

  function isRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function deepFreeze(value,seen=new Set()){
    if(!value||typeof value!=="object"||Object.isFrozen(value)||seen.has(value))return value;
    seen.add(value);
    Object.freeze(value);
    Object.values(value).forEach(nested=>deepFreeze(nested,seen));
    return value;
  }

  function normalizeString(value){
    return typeof value==="string"&&value.trim().length>0?value.trim():null;
  }

  function reject(code,status="invalid-request"){
    return deepFreeze({ok:false,action:"reject",status,code});
  }

  function canonicalize(value,seen=new Set()){
    if(value===null)return "null";
    if(typeof value==="string")return JSON.stringify(value);
    if(typeof value==="boolean")return value?"true":"false";
    if(typeof value==="number")return Number.isFinite(value)?JSON.stringify(value):null;
    if(typeof value!=="object")return null;
    if(seen.has(value))return null;
    seen.add(value);
    let result;
    if(Array.isArray(value)){
      const parts=[];
      for(const entry of value){
        const encoded=canonicalize(entry,seen);
        if(encoded===null){seen.delete(value);return null;}
        parts.push(encoded);
      }
      result=`[${parts.join(",")}]`;
    }else{
      const parts=[];
      for(const key of Object.keys(value).sort()){
        const nested=value[key];
        if(nested===undefined||typeof nested==="function"||typeof nested==="symbol"){
          seen.delete(value);
          return null;
        }
        const encoded=canonicalize(nested,seen);
        if(encoded===null){seen.delete(value);return null;}
        parts.push(`${JSON.stringify(key)}:${encoded}`);
      }
      result=`{${parts.join(",")}}`;
    }
    seen.delete(value);
    return result;
  }

  function hasForbiddenTopLevelAuthority(request){
    return ["accountId","revision","authorizedAccountIds","entitlementState","appCheckToken","idToken","firebaseIdToken","authorization"].some(
      key=>Object.prototype.hasOwnProperty.call(request,key)
    );
  }

  function normalizeRequest(inputOperation,request){
    if(!isRecord(request)||hasForbiddenTopLevelAuthority(request))return null;
    const operation=normalizeString(request.operation);
    const objectType=normalizeString(request.objectType);
    const objectId=normalizeString(request.objectId);
    const deviceId=normalizeString(request.deviceId);
    const installationId=request.installationId==null?null:normalizeString(request.installationId);
    const idempotencyKey=normalizeString(request.idempotencyKey);
    if(!operation||operation!==inputOperation||!objectType||!objectId||!deviceId||!idempotencyKey)return null;
    if(request.installationId!=null&&!installationId)return null;
    if(!Number.isInteger(request.baseRevision)||request.baseRevision<0)return null;
    const payload=Object.prototype.hasOwnProperty.call(request,"payload")?request.payload:null;
    const immutableIntent={
      operation,
      objectType,
      objectId,
      deviceId,
      installationId,
      baseRevision:request.baseRevision,
      payload
    };
    if(canonicalize(immutableIntent)===null)return null;
    return {idempotencyKey,immutableIntent:deepFreeze(immutableIntent)};
  }

  async function trustedSha256(adapter,value){
    if(typeof adapter!=="function")return null;
    let digest;
    try{digest=await adapter(value);}catch(_error){return null;}
    const normalized=normalizeString(digest);
    return normalized&&/^sha256:[0-9a-f]{64}$/.test(normalized)?normalized:null;
  }

  function normalizeAuthority(authority,intent){
    if(!isRecord(authority))return null;
    if(authority.objectType!==intent.objectType||authority.objectId!==intent.objectId)return null;
    if(!Number.isInteger(authority.revision)||authority.revision<0)return null;
    const lifecycleState=normalizeString(authority.lifecycleState);
    if(lifecycleState!=="live"&&lifecycleState!=="tombstoned")return null;
    const contentHash=authority.contentHash==null?null:normalizeString(authority.contentHash);
    if(authority.contentHash!=null&&!contentHash)return null;
    return deepFreeze({
      objectType:authority.objectType,
      objectId:authority.objectId,
      revision:authority.revision,
      lifecycleState,
      contentHash
    });
  }

  function normalizeReceipt(receipt){
    if(!isRecord(receipt))return null;
    const requestFingerprint=normalizeString(receipt.requestFingerprint);
    const actorAccountId=normalizeString(receipt.actorAccountId);
    const deviceId=normalizeString(receipt.deviceId);
    const resultStatus=normalizeString(receipt.resultStatus);
    if(!requestFingerprint||!actorAccountId||!deviceId||resultStatus!=="accepted")return null;
    if(!Number.isInteger(receipt.baseRevision)||receipt.baseRevision<0)return null;
    if(!Number.isInteger(receipt.acceptedRevision)||receipt.acceptedRevision!==receipt.baseRevision+1)return null;
    const resultContentHash=receipt.resultContentHash==null?null:normalizeString(receipt.resultContentHash);
    if(receipt.resultContentHash!=null&&!resultContentHash)return null;
    if(typeof receipt.resultTombstone!=="boolean")return null;
    return deepFreeze({
      requestFingerprint,
      baseRevision:receipt.baseRevision,
      acceptedRevision:receipt.acceptedRevision,
      resultStatus,
      resultContentHash,
      resultTombstone:receipt.resultTombstone,
      actorAccountId,
      deviceId
    });
  }

  function replayDecision(intent,idempotencyKeyHash,requestFingerprint,accountId,receipt){
    const normalized=normalizeReceipt(receipt);
    if(!normalized)return reject("TRUSTED_MUTATION_RECEIPT_INVALID");
    if(
      normalized.requestFingerprint!==requestFingerprint
      ||normalized.actorAccountId!==accountId
      ||normalized.deviceId!==intent.deviceId
      ||normalized.baseRevision!==intent.baseRevision
    ){
      return deepFreeze({
        ok:false,
        action:"no-commit",
        status:"idempotency-conflict",
        code:"IDEMPOTENCY_CONFLICT",
        idempotencyKeyHash
      });
    }
    return deepFreeze({
      ok:true,
      action:"no-commit",
      status:"replayed",
      objectType:intent.objectType,
      objectId:intent.objectId,
      revision:normalized.acceptedRevision,
      parentRevision:normalized.baseRevision,
      contentHash:normalized.resultContentHash,
      tombstone:normalized.resultTombstone,
      idempotencyKeyHash
    });
  }

  function validatePlannedMutation(plan,intent,accountId){
    if(!isRecord(plan)||!isRecord(plan.mutation))return null;
    const mutation=plan.mutation;
    if(mutation.objectType!==intent.objectType||mutation.objectId!==intent.objectId)return null;
    if(mutation.revision!==intent.baseRevision+1||mutation.parentRevision!==intent.baseRevision)return null;
    if(mutation.updatedByAccountId!==accountId||mutation.updatedByDeviceId!==intent.deviceId)return null;
    if(mutation.lifecycleState!=="live"&&mutation.lifecycleState!=="tombstoned")return null;
    const contentHash=mutation.contentHash==null?null:normalizeString(mutation.contentHash);
    if(mutation.lifecycleState==="tombstoned"&&contentHash!==null)return null;
    if(mutation.contentHash!=null&&!contentHash)return null;
    if(canonicalize(mutation)===null)return null;
    return deepFreeze({mutation:deepFreeze(mutation),contentHash,tombstone:mutation.lifecycleState==="tombstoned"});
  }

  function boundedConflict(intent,authority,idempotencyKeyHash){
    return deepFreeze({
      ok:false,
      action:"no-commit",
      status:"conflict",
      code:"STALE_BASE_REVISION",
      baseRevision:intent.baseRevision,
      authoritative:{
        objectType:authority.objectType,
        objectId:authority.objectId,
        revision:authority.revision,
        contentHash:authority.contentHash,
        tombstone:authority.lifecycleState==="tombstoned"
      },
      idempotencyKeyHash
    });
  }

  function decisionFingerprint(value){
    return canonicalize(value);
  }

  async function executeTrustedMutation(input){
    if(!isRecord(input))return reject("INVALID_TRUSTED_MUTATION_INPUT");
    const accountId=normalizeString(input.accountId);
    const operation=normalizeString(input.operation);
    const authorizationScope=normalizeString(input.authorizationScope);
    if(!accountId||!operation||!authorizationScope)return reject("TRUSTED_MUTATION_VERIFIED_CONTEXT_REQUIRED");
    if(Object.prototype.hasOwnProperty.call(input,"idToken")||Object.prototype.hasOwnProperty.call(input,"appCheckToken")){
      return reject("TRUSTED_MUTATION_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN");
    }

    const normalizedRequest=normalizeRequest(operation,input.request);
    if(!normalizedRequest)return reject("TRUSTED_MUTATION_REQUEST_INVALID");
    const intent=normalizedRequest.immutableIntent;
    const fingerprintCanonical=canonicalize(intent);
    const requestFingerprint=await trustedSha256(input.trustedSha256,fingerprintCanonical);
    const idempotencyKeyHash=await trustedSha256(input.trustedSha256,normalizedRequest.idempotencyKey);
    if(!requestFingerprint||!idempotencyKeyHash)return reject("TRUSTED_MUTATION_HASHING_FAILED");

    if(typeof input.runAtomicMutation!=="function")return reject("TRUSTED_MUTATION_TRANSACTION_UNAVAILABLE");
    if(typeof input.authorizeCurrentMutation!=="function")return reject("TRUSTED_MUTATION_CURRENT_AUTHORIZER_UNAVAILABLE");
    if(typeof input.planMutation!=="function")return reject("TRUSTED_MUTATION_PLANNER_UNAVAILABLE");

    let lastDecision=null;
    const actor=deepFreeze({accountId,providerPrincipal:input.providerPrincipal||null});
    let transactionResult;
    try{
      transactionResult=await input.runAtomicMutation(deepFreeze({
        actor,
        operation,
        authorizationScope,
        immutableIntent:intent,
        idempotencyKeyHash,
        requestFingerprint,
        async decide(snapshot){
          if(!isRecord(snapshot)){
            lastDecision=reject("TRUSTED_MUTATION_TRANSACTION_SNAPSHOT_INVALID");
            return lastDecision;
          }

          if(snapshot.existingReceipt!=null){
            lastDecision=replayDecision(intent,idempotencyKeyHash,requestFingerprint,accountId,snapshot.existingReceipt);
            return lastDecision;
          }

          const authority=normalizeAuthority(snapshot.authority,intent);
          if(!authority){
            lastDecision=reject("TRUSTED_MUTATION_AUTHORITY_INVALID");
            return lastDecision;
          }

          let authorization;
          try{
            authorization=await input.authorizeCurrentMutation(deepFreeze({
              actor,
              operation,
              authorizationScope,
              immutableIntent:intent,
              authority,
              authorizationContext:snapshot.authorizationContext||null
            }));
          }catch(_error){
            lastDecision=deepFreeze({ok:false,action:"no-commit",status:"forbidden",code:"TRUSTED_MUTATION_CURRENT_AUTHORIZATION_FAILED"});
            return lastDecision;
          }
          if(!isRecord(authorization)||authorization.authorized!==true){
            lastDecision=deepFreeze({ok:false,action:"no-commit",status:"forbidden",code:"TRUSTED_MUTATION_CURRENT_AUTHORIZATION_DENIED"});
            return lastDecision;
          }

          if(authority.revision!==intent.baseRevision){
            lastDecision=boundedConflict(intent,authority,idempotencyKeyHash);
            return lastDecision;
          }

          let planned;
          try{
            planned=await input.planMutation(deepFreeze({
              actor,
              operation,
              authorizationScope,
              immutableIntent:intent,
              authority,
              authorizationContext:snapshot.authorizationContext||null
            }));
          }catch(_error){
            lastDecision=reject("TRUSTED_MUTATION_PLANNER_FAILED");
            return lastDecision;
          }
          const validatedPlan=validatePlannedMutation(planned,intent,accountId);
          if(!validatedPlan){
            lastDecision=reject("TRUSTED_MUTATION_PLAN_INVALID");
            return lastDecision;
          }

          const receipt=deepFreeze({
            requestFingerprint,
            baseRevision:intent.baseRevision,
            acceptedRevision:intent.baseRevision+1,
            resultStatus:"accepted",
            resultContentHash:validatedPlan.contentHash,
            resultTombstone:validatedPlan.tombstone,
            actorAccountId:accountId,
            deviceId:intent.deviceId,
            trustedMaterialization:{serverTimestampFields:["createdAt","expiresAt"]}
          });
          const response=deepFreeze({
            status:"accepted",
            objectType:intent.objectType,
            objectId:intent.objectId,
            revision:intent.baseRevision+1,
            parentRevision:intent.baseRevision,
            contentHash:validatedPlan.contentHash,
            tombstone:validatedPlan.tombstone,
            idempotencyKeyHash
          });
          lastDecision=deepFreeze({
            ok:true,
            action:"commit",
            status:"accepted",
            mutation:validatedPlan.mutation,
            receipt,
            response
          });
          return lastDecision;
        }
      }));
    }catch(_error){
      return reject("TRUSTED_MUTATION_TRANSACTION_FAILED");
    }

    if(!isRecord(transactionResult)||typeof transactionResult.committed!=="boolean"||!isRecord(transactionResult.decision)||!lastDecision){
      return reject("TRUSTED_MUTATION_TRANSACTION_RESULT_INVALID");
    }
    if(decisionFingerprint(transactionResult.decision)!==decisionFingerprint(lastDecision)){
      return reject("TRUSTED_MUTATION_TRANSACTION_DECISION_MISMATCH");
    }
    const shouldCommit=lastDecision.ok===true&&lastDecision.action==="commit";
    if(transactionResult.committed!==shouldCommit){
      return reject("TRUSTED_MUTATION_TRANSACTION_COMMIT_MISMATCH");
    }
    if(shouldCommit)return lastDecision.response;
    return lastDecision;
  }

  return deepFreeze({
    contractVersion:1,
    stage:GATEWAY_STAGE,
    productionRuntimeConnected:false,
    productionProvisioningAuthorized:false,
    browserFirestoreWrites:"deny-all",
    sharedMutationMechanismProven:true,
    sharedMutationOperationAuthorized:false,
    stage3OperationAuthorized:false,
    stage2HRuntimePermissions:STAGE2H_RUNTIME_PERMISSIONS,
    responseStatuses:RESPONSE_STATUSES,
    canonicalize,
    executeTrustedMutation
  });
});
