(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedSharedMutationGateway=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const ALLOWED_OPERATIONS=Object.freeze(["put","delete","restore"]);
  const ALLOWED_OBJECT_TYPES=Object.freeze(["sharedState"]);
  const FORBIDDEN_CLIENT_AUTHORITY_FIELDS=Object.freeze([
    "accountId","authorizedAccountIds","entitlementState","revision","parentRevision","updatedByAccountId"
  ]);

  function gatewayIsRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function gatewayDeepFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(gatewayDeepFreeze);
    return value;
  }

  function gatewayClone(value){
    if(value===undefined)return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeString(value){
    return typeof value==="string"&&value.trim().length>0?value.trim():null;
  }

  function gatewayStableStringify(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(gatewayStableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${gatewayStableStringify(value[key])}`).join(",")}}`;
  }

  function reject(code,extra){
    return gatewayDeepFreeze(Object.assign({ok:false,action:"reject",code},extra||{}));
  }

  function validateRequest(request){
    if(!gatewayIsRecord(request))return reject("TRUSTED_SHARED_MUTATION_INVALID_REQUEST");
    for(const field of FORBIDDEN_CLIENT_AUTHORITY_FIELDS){
      if(Object.prototype.hasOwnProperty.call(request,field))return reject("TRUSTED_SHARED_MUTATION_CLIENT_AUTHORITY_FORBIDDEN",{field});
    }
    const operation=normalizeString(request.operation);
    const objectType=normalizeString(request.objectType);
    const objectId=normalizeString(request.objectId);
    const rivalryId=normalizeString(request.rivalryId);
    const deviceId=normalizeString(request.deviceId);
    const idempotencyKey=normalizeString(request.idempotencyKey);
    if(!operation||!ALLOWED_OPERATIONS.includes(operation))return reject("TRUSTED_SHARED_MUTATION_OPERATION_FORBIDDEN");
    if(!objectType||!ALLOWED_OBJECT_TYPES.includes(objectType))return reject("TRUSTED_SHARED_MUTATION_OBJECT_TYPE_FORBIDDEN");
    if(!objectId||!rivalryId||objectId!==rivalryId)return reject("TRUSTED_SHARED_MUTATION_SCOPE_INVALID");
    if(!deviceId||!idempotencyKey)return reject("TRUSTED_SHARED_MUTATION_IDENTITY_REQUIRED");
    if(!Number.isInteger(request.baseRevision)||request.baseRevision<0)return reject("TRUSTED_SHARED_MUTATION_BASE_REVISION_INVALID");
    if((operation==="put"||operation==="restore")&&(!normalizeString(request.contentHash)||!Object.prototype.hasOwnProperty.call(request,"payload"))){
      return reject("TRUSTED_SHARED_MUTATION_PAYLOAD_REQUIRED");
    }
    return gatewayDeepFreeze({
      ok:true,
      operation,
      objectType,
      objectId,
      rivalryId,
      deviceId,
      installationId:normalizeString(request.installationId),
      baseRevision:request.baseRevision,
      idempotencyKey,
      contentHash:normalizeString(request.contentHash),
      payload:gatewayClone(request.payload)
    });
  }

  function createImmutableIntent(validated){
    return gatewayDeepFreeze({
      operation:validated.operation,
      objectType:validated.objectType,
      objectId:validated.objectId,
      rivalryId:validated.rivalryId,
      deviceId:validated.deviceId,
      installationId:validated.installationId,
      baseRevision:validated.baseRevision,
      idempotencyKey:validated.idempotencyKey,
      contentHash:validated.contentHash,
      payload:gatewayClone(validated.payload)
    });
  }

  function requestFingerprint(accountId,intent){
    return gatewayStableStringify({
      accountId,
      operation:intent.operation,
      objectType:intent.objectType,
      objectId:intent.objectId,
      rivalryId:intent.rivalryId,
      deviceId:intent.deviceId,
      installationId:intent.installationId,
      baseRevision:intent.baseRevision,
      contentHash:intent.contentHash,
      payload:intent.payload
    });
  }

  function authorizationSnapshot(input){
    if(!gatewayIsRecord(input))return null;
    const accountStatus=normalizeString(input.accountStatus);
    const deviceState=normalizeString(input.deviceState);
    const rivalryState=normalizeString(input.rivalryState);
    const entitledAccountIds=Array.isArray(input.entitledAccountIds)?input.entitledAccountIds.map(normalizeString).filter(Boolean):[];
    const operationAuthorized=input.operationAuthorized===true;
    const sessionRequired=input.sessionRequired===true;
    const sessionAuthorized=input.sessionAuthorized===true;
    if(!accountStatus||!deviceState||!rivalryState)return null;
    return gatewayDeepFreeze({accountStatus,deviceState,rivalryState,entitledAccountIds,operationAuthorized,sessionRequired,sessionAuthorized});
  }

  function authorize(accountId,snapshot){
    if(!snapshot)return "TRUSTED_SHARED_MUTATION_AUTHORIZATION_INVALID";
    if(snapshot.accountStatus!=="active")return snapshot.accountStatus==="disabled"?"account-disabled":"TRUSTED_SHARED_MUTATION_ACCOUNT_FORBIDDEN";
    if(snapshot.deviceState!=="active")return snapshot.deviceState==="revoked"?"device-revoked":"TRUSTED_SHARED_MUTATION_DEVICE_FORBIDDEN";
    if(!snapshot.entitledAccountIds.includes(accountId))return "relationship-revoked";
    if(snapshot.rivalryState!=="active")return "relationship-revoked";
    if(!snapshot.operationAuthorized)return "TRUSTED_SHARED_MUTATION_OPERATION_UNAUTHORIZED";
    if(snapshot.sessionRequired&&!snapshot.sessionAuthorized)return "TRUSTED_SHARED_MUTATION_SESSION_FORBIDDEN";
    return null;
  }

  function validateAuthorityState(state,intent){
    if(!gatewayIsRecord(state))return reject("TRUSTED_SHARED_MUTATION_AUTHORITY_INVALID");
    if(state.objectType!==intent.objectType||state.objectId!==intent.objectId||state.rivalryId!==intent.rivalryId){
      return reject("TRUSTED_SHARED_MUTATION_AUTHORITY_SCOPE_MISMATCH");
    }
    if(!Number.isInteger(state.revision)||state.revision<0)return reject("TRUSTED_SHARED_MUTATION_AUTHORITY_REVISION_INVALID");
    if(intent.baseRevision!==state.revision){
      return reject("STALE_BASE_REVISION",{
        status:"conflict",
        submittedBaseRevision:intent.baseRevision,
        authoritative:gatewayDeepFreeze({
          objectType:state.objectType,
          objectId:state.objectId,
          revision:state.revision,
          contentHash:normalizeString(state.contentHash),
          tombstone:state.lifecycleState==="tombstoned"
        })
      });
    }
    if(state.lifecycleState==="tombstoned"&&intent.operation==="put")return reject("tombstone-restore-required");
    if(state.lifecycleState!=="tombstoned"&&intent.operation==="restore")return reject("restore-live-object");
    if(state.lifecycleState==="tombstoned"&&intent.operation==="delete")return reject("already-deleted");
    return gatewayDeepFreeze({ok:true});
  }

  function buildMutationSpec(accountId,intent,state,fingerprint){
    const nextRevision=state.revision+1;
    const deleting=intent.operation==="delete";
    return gatewayDeepFreeze({
      accountId,
      operation:intent.operation,
      objectType:intent.objectType,
      objectId:intent.objectId,
      rivalryId:intent.rivalryId,
      deviceId:intent.deviceId,
      installationId:intent.installationId,
      immutableBaseRevision:intent.baseRevision,
      idempotencyKey:intent.idempotencyKey,
      requestFingerprint:fingerprint,
      authoritativeRevisionBefore:state.revision,
      nextRevision,
      nextEnvelope:{
        revision:nextRevision,
        parentRevision:state.revision,
        lifecycleState:deleting?"tombstoned":"live",
        contentHash:deleting?null:intent.contentHash,
        priorContentHash:deleting?(normalizeString(state.contentHash)||normalizeString(state.priorContentHash)):null,
        updatedByAccountId:accountId,
        updatedByDeviceId:intent.deviceId,
        data:deleting?null:gatewayClone(intent.payload),
        tombstone:deleting?{reasonCode:"authorized-delete"}:null
      }
    });
  }

  function replayResult(replay,intent,fingerprint){
    if(!gatewayIsRecord(replay))return null;
    if(replay.requestFingerprint!==fingerprint)return reject("idempotency-conflict");
    if(replay.baseRevision!==intent.baseRevision)return reject("idempotency-conflict");
    if(!Number.isInteger(replay.acceptedRevision)||replay.acceptedRevision<1)return reject("TRUSTED_SHARED_MUTATION_REPLAY_INVALID");
    return gatewayDeepFreeze({
      ok:true,
      action:"replayed",
      status:"replayed",
      acceptedRevision:replay.acceptedRevision,
      contentHash:normalizeString(replay.resultContentHash),
      tombstone:replay.resultTombstone===true,
      mutationPerformed:false
    });
  }

  async function executeTrustedSharedMutation(input){
    if(!gatewayIsRecord(input))return reject("INVALID_TRUSTED_SHARED_MUTATION_INPUT");
    const accountId=normalizeString(input.accountId);
    if(!accountId)return reject("TRUSTED_SHARED_MUTATION_ACCOUNT_REQUIRED");
    const validated=validateRequest(input.request);
    if(!validated.ok)return validated;
    const intent=createImmutableIntent(validated);
    const fingerprint=requestFingerprint(accountId,intent);
    if(typeof input.runAtomicSharedMutation!=="function")return reject("TRUSTED_SHARED_MUTATION_TRANSACTION_UNAVAILABLE");

    let transactionResult;
    try{
      transactionResult=await input.runAtomicSharedMutation(gatewayDeepFreeze({
        accountId,
        intent,
        requestFingerprint:fingerprint,
        decide(context){
          if(!gatewayIsRecord(context))return reject("TRUSTED_SHARED_MUTATION_CONTEXT_INVALID");
          const authError=authorize(accountId,authorizationSnapshot(context.authorization));
          if(authError)return reject(authError);
          const replay=replayResult(context.idempotencyRecord,intent,fingerprint);
          if(replay)return replay;
          const authorityCheck=validateAuthorityState(context.authoritativeState,intent);
          if(!authorityCheck.ok)return authorityCheck;
          return gatewayDeepFreeze({
            ok:true,
            action:"commit",
            mutation:buildMutationSpec(accountId,intent,context.authoritativeState,fingerprint)
          });
        }
      }));
    }catch(_error){
      return reject("TRUSTED_SHARED_MUTATION_TRANSACTION_FAILED");
    }

    if(!gatewayIsRecord(transactionResult)||!gatewayIsRecord(transactionResult.decision)||typeof transactionResult.committed!=="boolean"){
      return reject("TRUSTED_SHARED_MUTATION_TRANSACTION_RESULT_INVALID");
    }
    const decision=transactionResult.decision;
    if(decision.ok!==true){
      if(transactionResult.committed)return reject("TRUSTED_SHARED_MUTATION_COMMIT_MISMATCH");
      return decision;
    }
    if(decision.action==="replayed"){
      if(transactionResult.committed)return reject("TRUSTED_SHARED_MUTATION_COMMIT_MISMATCH");
      return decision;
    }
    if(decision.action!=="commit"||!gatewayIsRecord(decision.mutation)||!transactionResult.committed){
      return reject("TRUSTED_SHARED_MUTATION_COMMIT_MISMATCH");
    }
    const mutation=decision.mutation;
    return gatewayDeepFreeze({
      ok:true,
      action:"accepted",
      status:"accepted",
      objectType:mutation.objectType,
      objectId:mutation.objectId,
      rivalryId:mutation.rivalryId,
      acceptedRevision:mutation.nextRevision,
      parentRevision:mutation.authoritativeRevisionBefore,
      contentHash:mutation.nextEnvelope.contentHash,
      tombstone:mutation.nextEnvelope.lifecycleState==="tombstoned",
      mutationPerformed:true,
      updatedByAccountId:accountId,
      updatedByDeviceId:mutation.deviceId
    });
  }

  return gatewayDeepFreeze({
    contractVersion:1,
    productionRuntimeConnected:false,
    productionProvisioningAuthorized:false,
    browserFirestoreWrites:"deny-all",
    trustedServerOnly:true,
    sharedMutationAuthorityGrantedOnlyPerOperation:true,
    providerTransactionMayRetry:true,
    clientBaseRevisionMayRefreshOnRetry:false,
    directBrowserMutationAuthorityGranted:false,
    sessionAuthorityRequiredOnlyWhenOperationPolicyRequiresIt:true,
    allowedOperations:ALLOWED_OPERATIONS,
    allowedObjectTypes:ALLOWED_OBJECT_TYPES,
    forbiddenClientAuthorityFields:FORBIDDEN_CLIENT_AUTHORITY_FIELDS,
    executeTrustedSharedMutation
  });
});