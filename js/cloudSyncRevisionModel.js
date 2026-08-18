(function(){
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const validId=value=>typeof value==="string"&&value.trim().length>0;
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  function stableStringify(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(stableStringify).join(",")}]`;
    const keys=Object.keys(value).sort();
    return `{${keys.map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  function createAuthority(input){
    if(!input||!validId(input.accountId)||!validId(input.objectType)||!validId(input.objectId)){
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
      contentHash:tombstone?null:(validId(input.contentHash)?input.contentHash:null),
      priorContentHash:tombstone&&validId(input.priorContentHash)?input.priorContentHash:null,
      content:tombstone?null:clone(has(input,"content")?input.content:null),
      tombstone,
      updatedByDeviceId:validId(input.updatedByDeviceId)?input.updatedByDeviceId:null
    };
    return {ok:true,status:"ready",state,ledger:{}};
  }
  function fingerprint(request){
    return stableStringify({
      operation:request.operation,
      accountId:request.accountId,
      objectType:request.objectType,
      objectId:request.objectId,
      deviceId:request.deviceId,
      baseRevision:request.baseRevision,
      contentHash:has(request,"contentHash")?request.contentHash:null,
      content:has(request,"content")?request.content:null
    });
  }
  function response(status,state,ledger,extra={}){
    return Object.assign({ok:false,status,state:clone(state),ledger:clone(ledger||{})},extra);
  }
  function validRequest(request){
    if(!request||typeof request!=="object"||Array.isArray(request))return false;
    if(!["put","delete","restore"].includes(request.operation))return false;
    if(!validId(request.accountId)||!validId(request.objectType)||!validId(request.objectId))return false;
    if(!validId(request.deviceId)||!validId(request.idempotencyKey))return false;
    if(!Number.isInteger(request.baseRevision)||request.baseRevision<0)return false;
    if((request.operation==="put"||request.operation==="restore")&&(!validId(request.contentHash)||!has(request,"content")))return false;
    return true;
  }
  function conflictRecord(state,request){
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
      proposedContentHash:validId(request.contentHash)?request.contentHash:null,
      proposedByDeviceId:request.deviceId
    };
  }
  function applyMutation(state,ledger,request){
    if(!state||typeof state!=="object"||!Number.isInteger(state.revision)||state.revision<0){
      return response("invalid-authority",state,ledger,{failurePhase:"authority"});
    }
    const safeLedger=ledger&&typeof ledger==="object"&&!Array.isArray(ledger)?ledger:{};
    if(!validRequest(request))return response("invalid-request",state,safeLedger,{failurePhase:"request"});
    if(request.accountId!==state.accountId||request.objectType!==state.objectType||request.objectId!==state.objectId){
      return response("scope-mismatch",state,safeLedger,{failurePhase:"authorization-scope"});
    }

    const requestFingerprint=fingerprint(request);
    const replay=safeLedger[request.idempotencyKey];
    if(replay){
      if(replay.fingerprint!==requestFingerprint){
        return response("idempotency-conflict",state,safeLedger,{failurePhase:"replay",acceptedRevision:replay.acceptedRevision});
      }
      return Object.assign(response("replayed",state,safeLedger,{acceptedRevision:replay.acceptedRevision}),{ok:true,replayed:true});
    }

    if(request.baseRevision!==state.revision){
      return response("conflict",state,safeLedger,{failurePhase:"compare-and-swap",conflict:conflictRecord(state,request)});
    }

    if(state.tombstone&&request.operation==="put"){
      return response("tombstone-restore-required",state,safeLedger,{failurePhase:"tombstone"});
    }
    if(!state.tombstone&&request.operation==="restore"){
      return response("restore-live-object",state,safeLedger,{failurePhase:"tombstone"});
    }
    if(state.tombstone&&request.operation==="delete"){
      return response("already-deleted",state,safeLedger,{failurePhase:"tombstone"});
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
      nextState.content=clone(request.content);
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
      state:clone(nextState),
      ledger:clone(nextLedger),
      acceptedRevision:nextRevision,
      replayed:false
    };
  }
  window.CareerModeSyncRevisionModel=Object.freeze({createAuthority,applyMutation,stableStringify});
})();
