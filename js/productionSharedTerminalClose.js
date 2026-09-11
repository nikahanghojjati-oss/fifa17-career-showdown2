(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedTerminalClose=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const PANEL_ID="sharedTerminalClosePanel";
  const AMBIGUOUS_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","network-request-failed"]);
  let installed=false,busy=false,state=null,stateContextKey="",refreshPromise=null,closePromise=null,unsubscribeRemote=null;
  let protocol=null,provider=null,finalApi=null,runtimeApi=null,accountApi=null,pairingApi=null,rivalryApi=null,remoteApi=null;

  function ptcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ptcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ptcFreeze);Object.freeze(value);}return value;}
  function ptcClone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function ptcCode(value){return String(value&&value.code||"").split("/").pop().trim().toLowerCase();}
  function ptcAmbiguous(value){return AMBIGUOUS_CODES.has(ptcCode(value));}
  function ptcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function ptcRequest(){
    const showdown=ptcShowdown();
    if(!showdown||showdown.sharedJourney?.mode!=="shared")return null;
    const rivalryId=String(showdown.sharedJourney?.rivalryId||"").trim().toLowerCase();
    const saveId=String(showdown.identity?.saveId||"").trim();
    const playerOneProfileId=String(showdown.identity?.managerProfileIds?.playerOne||"").trim();
    const playerTwoProfileId=String(showdown.identity?.managerProfileIds?.playerTwo||"").trim();
    if(!/^pair_[0-9a-f]{64}$/.test(rivalryId)||!/^save_[0-9a-f]{24}$/.test(saveId)||!/^profile_[0-9a-f]{24}$/.test(playerOneProfileId)||!/^profile_[0-9a-f]{24}$/.test(playerTwoProfileId))return null;
    return Object.freeze({rivalryId,saveId,playerOneProfileId,playerTwoProfileId,key:`${saveId}|${rivalryId}|${playerOneProfileId}|${playerTwoProfileId}|terminal-close`});
  }
  function ptcCurrentState(){const request=ptcRequest();return request&&state&&stateContextKey===request.key?state:null;}
  function ptcReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function ptcLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)ptcFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
  async function ptcEnsureDependencies(){
    const resolved={};
    for(const [key,path,ready] of [
      ["ssjr-terminal-close-protocol","js/sharedTerminalClose.js",()=>root.CareerModeSharedTerminalClose],
      ["ssjr-terminal-close-provider","js/sparkTerminalClose.js",()=>root.CareerModeSparkTerminalClose],
      ["ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js",()=>root.CareerModeProductionSharedFinalReconciliation],
      ["firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
      ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
      ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
      ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
      ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining]
    ])resolved[key]=await ptcLoad(key,path,ready);
    protocol=resolved["ssjr-terminal-close-protocol"];provider=resolved["ssjr-terminal-close-provider"];finalApi=resolved["ssjr-production-final-reconciliation"];runtimeApi=resolved["firebase-runtime"];accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;remoteApi=resolved.rj;
    if(typeof protocol?.prepare!=="function"||typeof protocol?.closeResult!=="function"||typeof provider?.close!=="function"||typeof provider?.read!=="function"||typeof finalApi?.refresh!=="function"||typeof finalApi?.getState!=="function"||typeof runtimeApi?.ensureAccountServices!=="function")ptcFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");
    return true;
  }
  async function ptcResolveContext(request=ptcRequest()){
    if(!request)ptcFail("TERMINAL_CLOSE_SHARED_CONTEXT_REQUIRED","An exact active Shared Showdown is required.");
    if(typeof accountApi?.initialize==="function")await accountApi.initialize();
    if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
    if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
    const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
    const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),attachedRivalry=String(rivalry?.rivalryId||"").trim().toLowerCase();
    if(account?.connected!==true||!accountId)ptcFail("TERMINAL_CLOSE_AUTH_REQUIRED","Reconnect the exact private account before closing this Shared Showdown.");
    if(device?.registered!==true||!/^device_[0-9a-f]{32}$/.test(deviceId))ptcFail("TERMINAL_CLOSE_DEVICE_REQUIRED","This browser must remain an active registered device.");
    if(rivalry?.attached!==true||attachedRivalry!==request.rivalryId)ptcFail("TERMINAL_CLOSE_RIVALRY_REQUIRED","Attach the exact completed Connected Rivalry before Terminal Close.");
    if(rivalry.accountId&&rivalry.accountId!==accountId)ptcFail("TERMINAL_CLOSE_RIVALRY_ACCOUNT_MISMATCH");
    if(rivalry.deviceId&&rivalry.deviceId!==deviceId)ptcFail("TERMINAL_CLOSE_RIVALRY_DEVICE_MISMATCH");
    const services=await runtimeApi.ensureAccountServices();
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)ptcFail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable. No terminal state was changed.");
    const user=services.auth.currentUser;if(!user||user.uid!==accountId)ptcFail("TERMINAL_CLOSE_AUTH_MISMATCH","The current Firebase account no longer matches Connected Account authority.");
    return Object.freeze({request,accountId,deviceId,user,services});
  }
  function ptcRemoteActive(context,exactSessionId=null){
    const remote=remoteApi?.getState?.();
    const expiry=Number(remote?.expiresAtEpochMs),now=Date.now();
    return Boolean(remote&&remote.sessionState==="active"&&/^session_[0-9a-f]{64}$/.test(String(remote.sessionId||""))&&remote.rivalryId===context.request.rivalryId&&remote.accountId===context.accountId&&remote.deviceId===context.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&now<expiry&&(!exactSessionId||remote.sessionId===exactSessionId))?remote:null;
  }
  function ptcField(id){return root.document&&root.document.getElementById(id);}
  function ptcText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function ptcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function ptcManagerName(role){return String(ptcShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function ptcEnsureUi(){
    if(!root.document)return null;const review=ptcField("seasonReviewPanel");if(!review)return null;
    let panel=ptcField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedTerminalClosePanel hidden";panel.dataset.sharedTerminalClose="true";review.appendChild(panel);}
    const ensure=(id,tag,className="")=>{let node=ptcField(id);if(!node){node=root.document.createElement(tag);node.id=id;if(className)node.className=className;panel.appendChild(node);}return node;};
    const heading=ensure("sharedTerminalCloseHeading","h3");
    const summary=ensure("sharedTerminalCloseSummary","p");
    const status=ensure("sharedTerminalCloseStatus","p","stateNote");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
    const actions=ensure("sharedTerminalCloseActions","div","seasonReviewActions");
    let close=ptcField("sharedTerminalCloseAction");if(!close){close=root.document.createElement("button");close.id="sharedTerminalCloseAction";close.className="menuButton";close.type="button";close.addEventListener("click",()=>{void ptcClose();});actions.appendChild(close);}
    let retry=ptcField("sharedTerminalCloseRetry");if(!retry){retry=root.document.createElement("button");retry.id="sharedTerminalCloseRetry";retry.className="compactButton hidden";retry.type="button";retry.addEventListener("click",()=>{void ptcRetry();});actions.appendChild(retry);}
    return {panel,heading,summary,status,actions,close,retry};
  }
  function ptcWinnerText(witness){if(!witness)return "";const winner=witness.winner==="draw"?"DRAW":`${ptcManagerName(witness.winner)} WINS`;return `${ptcManagerName("playerOne")} ${witness.managerTotals.playerOne} · ${ptcManagerName("playerTwo")} ${witness.managerTotals.playerTwo} · ${winner}`;}
  function ptcRender(){
    const ui=ptcEnsureUi();if(!ui)return false;const current=ptcCurrentState();
    const visible=Boolean(current&&["READY","RECOVERY_PENDING","CLOSED","BLOCKED"].includes(current.phase));ptcHidden(ui.panel,!visible);if(!visible)return false;
    const witness=current.terminalWitness||current.intent||current.finalReconciliation||null;
    if(current.phase==="CLOSED"){
      ptcText(ui.heading,"SHARED SHOWDOWN CLOSED");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,"TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);ui.panel.dataset.terminal="true";return true;
    }
    ui.panel.dataset.terminal="false";
    if(current.phase==="RECOVERY_PENDING"){
      ptcText(ui.heading,"TERMINAL CLOSE OUTCOME PENDING");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.message||"Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability.");ptcHidden(ui.close,true);ptcHidden(ui.retry,false);ui.retry.disabled=busy;ptcText(ui.retry,"RETRY SAME TERMINAL CLOSE");return true;
    }
    if(current.phase==="BLOCKED"){
      ptcText(ui.heading,"TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.message||"Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close.");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);return true;
    }
    ptcText(ui.heading,"FINAL RESULT READY FOR TERMINAL CLOSE");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,"This permanently closes the shared rivalry and exact active private session. Final results remain readable; another season or replacement session cannot resurrect this Showdown.");ptcHidden(ui.close,false);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHARED SHOWDOWN");ptcHidden(ui.retry,true);return true;
  }
  function ptcPublish(request,next){
    if(!request||!next){state=null;stateContextKey="";ptcRender();return null;}
    const current=ptcRequest();if(!current||current.key!==request.key)return null;
    state=ptcFreeze(next);stateContextKey=request.key;ptcRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:state.phase,rivalryId:state.rivalryId||request.rivalryId,terminal:state.phase==="CLOSED"}}));}catch(_error){}
    return state;
  }
  function ptcClear(){state=null;stateContextKey="";ptcRender();return null;}
  function ptcClosedState(request,terminalRead){const witness=protocol.verifyIntent(terminalRead.terminalWitness);return {phase:"CLOSED",rivalryId:request.rivalryId,sessionId:witness.sessionId,rivalryRevision:terminalRead.rivalryRevision,terminal:true,terminalWitness:ptcClone(witness),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
  async function ptcRefreshNow(){
    const request=ptcRequest();if(!request)return ptcClear();
    await ptcEnsureDependencies();const context=await ptcResolveContext(request);if(ptcRequest()?.key!==request.key)return null;
    const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
    if(ptcRequest()?.key!==request.key)return null;
    if(terminalRead?.ok===true&&terminalRead.terminal===true){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
    if(!terminalRead||terminalRead.ok!==true)ptcFail(terminalRead?.code||"TERMINAL_CLOSE_READ_FAILED",terminalRead?.message||"Terminal state could not be verified.");
    let final=finalApi.getState();if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.rivalryId!==request.rivalryId)final=await finalApi.refresh();
    if(ptcRequest()?.key!==request.key)return null;
    if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.finalSeasonReconciled!==true||final.rivalryId!==request.rivalryId)return ptcClear();
    const remote=ptcRemoteActive(context);
    if(!remote)return ptcPublish(request,{phase:"BLOCKED",rivalryId:request.rivalryId,terminal:false,finalReconciliation:ptcClone(final),message:"Final results are preserved, but Terminal Close requires one exact unexpired ACTIVE private session for this rivalry. Open or join a fresh private session, then Terminal Close can finish.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
    const intent=protocol.prepare(final,{sessionId:remote.sessionId});
    return ptcPublish(request,{phase:"READY",rivalryId:request.rivalryId,sessionId:remote.sessionId,terminal:false,intent:ptcClone(intent),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
  }
  function ptcRefresh(){
    if(refreshPromise)return refreshPromise;busy=true;ptcRender();
    const run=ptcRefreshNow().catch(error=>{ptcReport("Unable to refresh Shared Showdown Terminal Close",error);return ptcCurrentState();}).finally(()=>{if(refreshPromise===run)refreshPromise=null;busy=false;ptcRender();});refreshPromise=run;return run;
  }
  function ptcCloseOptions(context,intent){return {user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:context.request.rivalryId,sessionId:intent.sessionId,deviceId:context.deviceId,intent,nowEpochMs:Date.now(),cryptoImpl:root.crypto};}
  function ptcAccepted(request,intent,result){
    const closed=protocol.closeResult(intent,result);try{remoteApi?.forgetSession?.();}catch(_error){}
    return ptcPublish(request,{phase:"CLOSED",rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryRevision:closed.rivalryRevision,sessionRevision:closed.sessionRevision,terminal:true,terminalWitness:ptcClone(intent),replayed:closed.replayed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
  }
  async function ptcClose(){
    if(closePromise)return closePromise;
    const current=ptcCurrentState();if(!current||current.phase!=="READY"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_NOT_READY",message:"Terminal Close is not ready for this exact Shared Showdown."};
    const request=ptcRequest(),intent=protocol.verifyIntent(current.intent);busy=true;ptcRender();
    const run=(async()=>{
      try{
        const context=await ptcResolveContext(request);if(ptcRequest()?.key!==request.key)ptcFail("TERMINAL_CLOSE_CONTEXT_CHANGED");
        if(!ptcRemoteActive(context,intent.sessionId))ptcFail("TERMINAL_CLOSE_ACTIVE_SESSION_REQUIRED","The exact private session used by this terminal witness is no longer ACTIVE.");
        const result=await provider.close(ptcCloseOptions(context,intent));
        if(ptcRequest()?.key!==request.key)return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
        if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
        if(ptcAmbiguous(result)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),message:"Terminal Close acknowledgement was not received. The exact same terminal witness is retained in page memory for deterministic retry; no replacement session or local-save mutation will be generated.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {...result,recoverable:true};}
        ptcPublish(request,{...current,message:result?.message||"Terminal Close was rejected without changing the completed Showdown."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
      }catch(error){
        if(ptcAmbiguous(error)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),message:"Terminal Close acknowledgement was not received. Retry is bound to the exact same witness and session capability.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}
        ptcReport("Shared Showdown Terminal Close failed",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};
      }
    })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();});closePromise=run;return run;
  }
  async function ptcRetry(){
    if(closePromise)return closePromise;
    const current=ptcCurrentState();if(!current||current.phase!=="RECOVERY_PENDING"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_RECOVERY_REQUIRED",message:"No unresolved Terminal Close is waiting for retry."};
    const request=ptcRequest(),intent=protocol.verifyIntent(current.intent);busy=true;ptcRender();
    const run=(async()=>{
      try{
        const context=await ptcResolveContext(request);if(ptcRequest()?.key!==request.key)ptcFail("TERMINAL_CLOSE_CONTEXT_CHANGED");
        const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
        if(terminalRead?.ok===true&&terminalRead.terminal===true){if(!protocol.sameWitness(terminalRead.terminalWitness,intent))ptcFail("TERMINAL_CLOSE_REPLAY_CONFLICT");try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcClosedState(request,terminalRead));return {ok:true,status:"replayed",replayed:true,rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};}
        const result=await provider.close(ptcCloseOptions(context,intent));
        if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
        if(ptcAmbiguous(result)){ptcPublish(request,current);return {...result,recoverable:true};}
        ptcPublish(request,{...current,message:result?.message||"The same Terminal Close retry was rejected; the exact witness remains held for inspection."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
      }catch(error){if(ptcAmbiguous(error)){ptcPublish(request,current);return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}ptcReport("Shared Showdown Terminal Close retry failed",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};}
    })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();});closePromise=run;return run;
  }
  function ptcWake(event){
    if(event?.type==="career-mode-save-library-authority-invalidated")return ptcClear();
    const request=ptcRequest();if(!request){ptcClear();return;}
    if(stateContextKey&&stateContextKey!==request.key)ptcClear();
    if(busy||root.document?.visibilityState==="hidden")return;
    void ptcRefresh();
  }
  function ptcInstall(){
    if(installed)return true;installed=true;
    void ptcEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>ptcWake());ptcWake();}).catch(error=>ptcReport("Shared Showdown Terminal Close bootstrap unavailable",error));
    for(const event of ["career-mode-shared-final-reconciliation-state-change","career-mode-connected-account-state-change","career-mode-connected-rivalry-state-change","career-mode-active-save-changed","career-mode-save-library-authority-invalidated","career-mode-showdown-state-change"]){root.addEventListener?.(event,ptcWake);}
    root.document?.addEventListener?.("visibilitychange",ptcWake);
    if(typeof root.setInterval==="function")root.setInterval(ptcWake,POLL_MS);
    if(typeof root.setTimeout==="function")root.setTimeout(ptcWake,0);
    return true;
  }

  return Object.freeze({
    contractVersion:1,feature:"ssjr-production-shared-terminal-close",productionEnabled:true,runtimeRevision:"1.9.1-r18",pollIntervalMs:POLL_MS,
    requiresFinalReconciliation:true,requiresExactActiveSessionToClose:true,sameWitnessRetry:true,terminalReadAfterReload:true,terminalSessionResurrection:false,
    canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
    install:ptcInstall,refresh:ptcRefresh,close:ptcClose,retry:ptcRetry,getState:ptcCurrentState,isBusy:()=>busy
  });
});
