(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedJourneyConflicts=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r15";
  let guard=null,guardPromise=null,lastReceipt=null,installed=false;
  const listeners=new Set();

  function pjcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pjcLoad(){
    if(root.CareerModeSharedJourneyConflicts)return Promise.resolve(root.CareerModeSharedJourneyConflicts);
    if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"JOURNEY_CONFLICT_DEPENDENCY_UNAVAILABLE"}));
    return root.loadRuntimeScript("ssjr-journey-conflicts-protocol","js/sharedJourneyConflicts.js",()=>root.CareerModeSharedJourneyConflicts).then(()=>root.CareerModeSharedJourneyConflicts);
  }
  async function pjcEnsure(){
    if(guard)return guard;
    if(guardPromise)return guardPromise;
    guardPromise=pjcLoad().then(factory=>{
      if(!factory||typeof factory.createGuard!=="function")pjcFail("JOURNEY_CONFLICT_PROTOCOL_UNAVAILABLE");
      const created=factory.createGuard({cryptoImpl:root.crypto});
      if(!created||typeof created.execute!=="function")pjcFail("JOURNEY_CONFLICT_PROTOCOL_UNAVAILABLE");
      guard=created;return guard;
    }).finally(()=>{guardPromise=null;});
    return guardPromise;
  }
  function pjcPublish(receipt){
    lastReceipt=receipt||null;
    for(const listener of listeners){try{listener(lastReceipt);}catch(_error){}}
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-journey-conflict-state-change",{detail:lastReceipt}));}catch(_error){}
    return lastReceipt;
  }
  async function pjcExecute(options,invoke){
    const current=await pjcEnsure();
    try{
      const result=await current.execute(options,invoke);pjcPublish(current.getLastReceipt());return result;
    }catch(error){pjcPublish(current.getLastReceipt());throw error;}
  }
  async function pjcPreflight(options){const current=await pjcEnsure();try{return await current.preflight(options);}catch(error){pjcPublish(current.getLastReceipt());throw error;}}
  async function pjcClearExpired(nowEpochMs){const current=await pjcEnsure();const removed=current.clearExpired(nowEpochMs);pjcPublish(current.getLastReceipt());return removed;}
  async function pjcReset(){const current=await pjcEnsure();current.reset();pjcPublish(null);return true;}
  function pjcSubscribe(listener){if(typeof listener!=="function")return ()=>{};listeners.add(listener);return ()=>listeners.delete(listener);}
  function pjcInstall(){if(installed)return true;installed=true;void pjcEnsure().catch(error=>root.console?.warn?.("[Career Mode Showdown] Journey Conflicts guard unavailable.",error));return true;}

  return Object.freeze({
    contractVersion:1,feature:"ssjr-production-shared-journey-conflicts",productionEnabled:true,runtimeRevision:RUNTIME_REVISION,
    providerAuthorityPreserved:true,nonAuthorizingReceipts:true,boundedStaleRetry:true,alteredReplayPreProviderDenied:true,
    canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
    install:pjcInstall,execute:pjcExecute,preflight:pjcPreflight,clearExpired:pjcClearExpired,reset:pjcReset,getState:()=>lastReceipt,subscribe:pjcSubscribe
  });
});
