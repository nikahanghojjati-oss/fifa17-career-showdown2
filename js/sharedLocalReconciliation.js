(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedLocalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RUNTIME_REVISION="1.9.1-r16";
  const RIVALRY=/^pair_[0-9a-f]{64}$/;
  const SAVE=/^save_[0-9a-f]{24}$/;
  const PROFILE=/^profile_[0-9a-f]{24}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const ROLES=new Set(["playerOne","playerTwo"]);
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  function freeze(v){if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
  function validBinding(v){return Boolean(v&&SAVE.test(String(v.saveId||""))&&PROFILE.test(String(v.profileId||""))&&ROLES.has(v.managerRole));}
  function observed(v){return Boolean(v&&Number.isInteger(v.revision)&&v.revision>=0&&HASH.test(String(v.contentHash||""))&&v.lifecycleState==="live");}
  function base(phase,extra={}){return freeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,...extra});}
  function project({sharedActive=false,history=null,connected=null,online=true}={}){
    if(!sharedActive)return base("INACTIVE",{previewAllowed:false,applyAllowed:false,reason:"local-journey"});
    if(!history||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||!RIVALRY.test(String(history.rivalryId||"")))return base("BLOCKED",{previewAllowed:false,applyAllowed:false,reason:"history-not-authoritative"});
    if(!connected||connected.connected!==true||connected.attached!==true||String(connected.rivalryId||"")!==String(history.rivalryId)||!validBinding(connected.binding))return base("BLOCKED",{previewAllowed:false,applyAllowed:false,reason:"connected-rivalry-not-exact"});
    const binding=freeze(clone(connected.binding));
    const envelope=connected.observedEnvelope;
    if(connected.status==="reconciliation-applied"&&Number.isInteger(connected.localCommitRevision)&&HASH.test(String(connected.localCommitContentHash||""))&&connected.localCommitSaveId===binding.saveId){
      return base("APPLIED",{previewAllowed:Boolean(observed(envelope)),applyAllowed:false,reason:null,binding,remoteRevision:connected.localCommitRevision,remoteContentHash:connected.localCommitContentHash});
    }
    if(connected.reconciliationPreviewReady===true&&Number.isInteger(connected.previewRevision)&&HASH.test(String(connected.previewContentHash||""))&&connected.previewSaveId===binding.saveId){
      return base(online?"PREVIEW_READY":"OFFLINE_FALLBACK",{previewAllowed:Boolean(observed(envelope)),applyAllowed:Boolean(online),reason:online?null:"offline-apply-denied",binding,remoteRevision:connected.previewRevision,remoteContentHash:connected.previewContentHash});
    }
    if(observed(envelope))return base(online?"REMOTE_OBSERVED":"OFFLINE_FALLBACK",{previewAllowed:true,applyAllowed:false,reason:online?null:"offline-preview-only",binding,remoteRevision:envelope.revision,remoteContentHash:envelope.contentHash});
    return base(online?"WAITING_REMOTE":"OFFLINE_FALLBACK",{previewAllowed:false,applyAllowed:false,reason:online?"remote-not-observed":"offline-no-observed-remote",binding,remoteRevision:null,remoteContentHash:null});
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-shared-local-reconciliation",runtimeRevision:RUNTIME_REVISION,project,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true});
});
