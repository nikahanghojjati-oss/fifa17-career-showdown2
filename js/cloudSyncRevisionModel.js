(function(){
  const syncHasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const syncValidId=value=>typeof value==="string"&&value.trim().length>0;
  const syncClone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  function syncStableStringify(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(syncStableStringify).join(",")}]`;
    const keys=Object.keys(value).sort();
    return `{${keys.map(key=>`${JSON.stringify(key)}:${syncStableStringify(value[key])}`).join(",")}}`;
  }
  function createCloudSyncAuthority(input){
    if(!input||!syncValidId(input.accountId)||!syncValidId(input.objectType)||!syncValidId(input.objectId)){
      return {ok:false,status:"invalid-authority",state:null,ledger:{}};
    }
    const revision=Number.isInteger(input.revision)&&input.revision>=0?input.revision:0;
    const tombstone=input.tombstone===true;
    const state={
      accountId:input.accountId,
      objectType:input.objectType,
      objectId:input.objectId,
      revision,
      parentRevision:revision>0&&Number.isInteger(input.parentRevision)?input.parentRevision:null,
      contentHash:tombstone?null:(syncValidId(input.contentHash)?input.contentHash:null),
      priorContentHash:tombstone&&syncValidId(input.priorContentHash)?input.priorContentHash:null,
      content:tombstone?null:syncClone(syncHasOwn(input,"content")?input.content:null),
      tombstone,
      updatedByDeviceId:syncValidId(input.updatedByDeviceId)?input.updatedByDeviceId:null
    };
    return {ok:true,status:"ready",state,ledger:{}};
  }
  function createCloudSyncRequestFingerprint(request){
    return syncStableStringify({
      operation:request.operation,
      accountId:request.accountId,
      objectType:request.objectType,
      objectId:request.objectId,
      deviceId:request.deviceId,
      baseRevision:request.baseRevision,
      contentHash:syncHasOwn(request,"contentHash")?request.contentHash:null,
      content:syncHasOwn(request,"content")?request.content:null
    });
  }
  function createCloudSyncResponse(status,state,ledger,extra={}){
    return Object.assign({ok:false,status,state:syncClone(state),ledger:syncClone(ledger||{})},extra);
  }
  function isValidCloudSyncRequest(request){
    if(!request||typeof request!=="object"||Array.isArray(request))return false;
    if(!["put","delete","restore"].includes(request.operation))return false;
    if(!syncValidId(request.accountId)||!syncValidId(request.objectType)||!syncValidId(request.objectId))return false;
    if(!syncValidId(request.deviceId)||!syncValidId(request.idempotencyKey))return false;
    if(!Number.isInteger(request.baseRevision)||request.baseRevision<0)return false;
    if((request.operation==="put"||request.operation==="restore")&&(!syncValidId(request.contentHash)||!syncHasOwn(request,"content")))return false;
    return true;
  }
  function createCloudSyncConflictRecord(state,request){
    return {
      kind:"stale-base",
      accountId:state.accountId,
      objectType:state.objectType,
      objectId:state.objectId,
      requestedBaseRevision:request.baseRevision,
      remoteRevision:state.revision,
      remoteContentHash:state.contentHash,
      remoteTombstone:state.tombstone,
      proposedOperation:request.operation,
      proposedContentHash:syncValidId(request.contentHash)?request.contentHash:null,
      proposedByDeviceId:request.deviceId
    };
  }
  function applyCloudSyncMutation(state,ledger,request){
    if(!state||typeof state!=="object"||!Number.isInteger(state.revision)||state.revision<0){
      return createCloudSyncResponse("invalid-authority",state,ledger,{failurePhase:"authority"});
    }
    const safeLedger=ledger&&typeof ledger==="object"&&!Array.isArray(ledger)?ledger:{};
    if(!isValidCloudSyncRequest(request))return createCloudSyncResponse("invalid-request",state,safeLedger,{failurePhase:"request"});
    if(request.accountId!==state.accountId||request.objectType!==state.objectType||request.objectId!==state.objectId){
      return createCloudSyncResponse("scope-mismatch",state,safeLedger,{failurePhase:"authorization-scope"});
    }

    const requestFingerprint=createCloudSyncRequestFingerprint(request);
    const replay=safeLedger[request.idempotencyKey];
    if(replay){
      if(replay.fingerprint!==requestFingerprint){
        return createCloudSyncResponse("idempotency-conflict",state,safeLedger,{failurePhase:"replay",acceptedRevision:replay.acceptedRevision});
      }
      return Object.assign(createCloudSyncResponse("replayed",state,safeLedger,{acceptedRevision:replay.acceptedRevision}),{ok:true,replayed:true});
    }

    if(request.baseRevision!==state.revision){
      return createCloudSyncResponse("conflict",state,safeLedger,{failurePhase:"compare-and-swap",conflict:createCloudSyncConflictRecord(state,request)});
    }

    if(state.tombstone&&request.operation==="put"){
      return createCloudSyncResponse("tombstone-restore-required",state,safeLedger,{failurePhase:"tombstone"});
    }
    if(!state.tombstone&&request.operation==="restore"){
      return createCloudSyncResponse("restore-live-object",state,safeLedger,{failurePhase:"tombstone"});
    }
    if(state.tombstone&&request.operation==="delete"){
      return createCloudSyncResponse("already-deleted",state,safeLedger,{failurePhase:"tombstone"});
    }

    const nextRevision=state.revision+1;
    const nextState={
      accountId:state.accountId,
      objectType:state.objectType,
      objectId:state.objectId,
      revision:nextRevision,
      parentRevision:state.revision,
      contentHash:null,
      priorContentHash:null,
      content:null,
      tombstone:request.operation==="delete",
      updatedByDeviceId:request.deviceId
    };
    if(request.operation==="delete"){
      nextState.priorContentHash=state.contentHash||state.priorContentHash||null;
    }else{
      nextState.contentHash=request.contentHash;
      nextState.content=syncClone(request.content);
    }

    const nextLedger=Object.assign({},safeLedger,{
      [request.idempotencyKey]:{
        fingerprint:requestFingerprint,
        acceptedRevision:nextRevision,
        operation:request.operation
      }
    });
    return {
      ok:true,
      status:"accepted",
      state:syncClone(nextState),
      ledger:syncClone(nextLedger),
      acceptedRevision:nextRevision,
      replayed:false
    };
  }
  window.CareerModeSyncRevisionModel=Object.freeze({
    createAuthority:createCloudSyncAuthority,
    applyMutation:applyCloudSyncMutation,
    stableStringify:syncStableStringify
  });
})();
