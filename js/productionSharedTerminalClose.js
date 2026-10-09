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
  let rivalryWakeRequested=false;
  // JOB-1038: one automatic attempt per exact Showdown, account and device in this runtime.
  // Reloads first read the durable terminal witness; provider idempotency remains the authority.
  const automaticAttempts=new Map();
  function ptcAutomaticKey(context){return `${context.request.key}|${context.accountId}|${context.deviceId}`;}
  function ptcScheduleAutomaticClose(context){
    if(!installed||typeof root.setTimeout!=="function")return;
    const key=ptcAutomaticKey(context);if(automaticAttempts.has(key))return;
    const request=context.request,generation=stateGeneration;
    root.setTimeout(()=>{
      if(!ptcStillCurrent(request,generation)||busy||closePromise||ptcCurrentState()?.phase!=="READY"||automaticAttempts.has(key)||!ptcRemoteActive(context,ptcCurrentState().intent.sessionId))return;
      automaticAttempts.set(key,{failed:false});
      ptcPublish(request,{...ptcCurrentState(),automaticSaving:true,automaticCloseFailed:false});
      void ptcClose(key).then(result=>{
        if(result?.ok===true)return;
        automaticAttempts.set(key,{failed:true});
        if(ptcStillCurrent(request,generation)&&ptcCurrentState()?.phase!=="CLOSED")ptcPublish(request,{...ptcCurrentState(),automaticSaving:false,automaticCloseFailed:true});
      });
    },0);
  }
  // H1017-2: bumped whenever the held state is dropped, so an awaited retry can tell its context was cleared under it.
  let stateGeneration=0;
  // BH-7: throttled, single-flight re-ask of Connected Rivalry (see ptcRetryUnavailableRivalry).
  const RIVALRY_RETRY_MS=30000;
  let rivalryRetryAt=0,rivalryRetryInFlight=false;
  let protocol=null,provider=null,finalApi=null,runtimeApi=null,accountApi=null,pairingApi=null,rivalryApi=null,remoteApi=null;

  function ptcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ptcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ptcFreeze);Object.freeze(value);}return value;}
  function ptcClone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function ptcCode(value){return String(value&&value.code||"").split("/").pop().trim().toLowerCase();}
  function ptcAmbiguous(value){return AMBIGUOUS_CODES.has(ptcCode(value));}
  function ptcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function ptcConfirmedSetupRivalry(){try{const s=root.CareerModeProductionSharedShowdownSetup?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
  function ptcRivalryApi(){return rivalryApi||root.CareerModeSparkConnectedRivalry||null;}
  function ptcAttachedRivalry(saveId,playerOneProfileId,playerTwoProfileId){try{const s=ptcRivalryApi()?.getState?.(),b=s&&s.binding;return s&&s.attached===true&&b&&b.saveId===saveId&&((b.managerRole==="playerOne"&&b.profileId===playerOneProfileId)||(b.managerRole==="playerTwo"&&b.profileId===playerTwoProfileId))&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
  function ptcRequest(){
    const showdown=ptcShowdown();
    if(!showdown||showdown.sharedJourney?.mode!=="shared")return null;
    const saveId=String(showdown.identity?.saveId||"").trim();
    const playerOneProfileId=String(showdown.identity?.managerProfileIds?.playerOne||"").trim();
    const playerTwoProfileId=String(showdown.identity?.managerProfileIds?.playerTwo||"").trim();
    // Shared Setup stops being ready once the session closes, so fall back to the durable Connected Rivalry binding of this exact save and manager (it survives reloads).
    const rivalryId=String(showdown.sharedJourney?.rivalryId||ptcConfirmedSetupRivalry()||ptcAttachedRivalry(saveId,playerOneProfileId,playerTwoProfileId)||"").trim().toLowerCase();
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
    const expiry=Number(remote?.expiresAtEpochMs);
    return Boolean(remote&&remote.sessionState==="active"&&/^session_[0-9a-f]{64}$/.test(String(remote.sessionId||""))&&remote.rivalryId===context.request.rivalryId&&remote.accountId===context.accountId&&remote.deviceId===context.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&(!exactSessionId||remote.sessionId===exactSessionId))?remote:null;
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
    let close=ptcField("sharedTerminalCloseAction");if(!close){close=root.document.createElement("button");close.id="sharedTerminalCloseAction";close.className="menuButton";close.type="button";close.addEventListener("click",()=>{void (ptcCurrentState()?.phase==="RECOVERY_PENDING"?ptcRetry():ptcClose());});actions.appendChild(close);}
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
      ptcText(ui.heading,"TERMINAL CLOSE OUTCOME PENDING");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.automaticSaving?"Saving this Showdown to your career…":current.message||"Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability.");ptcHidden(ui.close,!current.automaticCloseFailed);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHARED SHOWDOWN");ptcHidden(ui.retry,false);ui.retry.disabled=busy;ptcText(ui.retry,"RETRY SAME TERMINAL CLOSE");return true;
    }
    if(current.phase==="BLOCKED"){
      ptcText(ui.heading,"TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.message||"Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close.");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);return true;
    }
    ptcText(ui.heading,"FINAL RESULT READY FOR TERMINAL CLOSE");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.automaticCloseFailed?"This Showdown could not be saved. Tap CLOSE SHARED SHOWDOWN to try again.":"Saving this Showdown to your career…");ptcHidden(ui.close,!current.automaticCloseFailed);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHARED SHOWDOWN");ptcHidden(ui.retry,true);return true;
  }
  function ptcPublish(request,next){
    if(!request||!next){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
    const current=ptcRequest();if(!current||current.key!==request.key)return null;
    state=ptcFreeze(next);stateContextKey=request.key;ptcRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:state.phase,rivalryId:state.rivalryId||request.rivalryId,terminal:state.phase==="CLOSED"}}));}catch(_error){}
    return state;
  }
  function ptcClear(){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
  function ptcStillCurrent(request,generation){return ptcRequest()?.key===request.key&&stateGeneration===generation;}
  function ptcClosedState(request,terminalRead){const witness=protocol.verifyIntent(terminalRead.terminalWitness);return {phase:"CLOSED",rivalryId:request.rivalryId,sessionId:witness.sessionId,rivalryRevision:terminalRead.rivalryRevision,terminal:true,terminalWitness:ptcClone(witness),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
  async function ptcRefreshNow(){
    const request=ptcRequest();if(!request)return ptcClear();
    await ptcEnsureDependencies();const context=await ptcResolveContext(request);if(ptcRequest()?.key!==request.key)return null;
    const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
    if(ptcRequest()?.key!==request.key)return null;
    // H1017-1: an unresolved close holds its exact witness. Only a verified closed read of that same witness resolves it here;
    // an open, mismatched or failed read keeps RECOVERY_PENDING so RETRY SAME TERMINAL CLOSE stays bound to that witness.
    const held=ptcCurrentState();
    if(held?.phase==="RECOVERY_PENDING"&&held.intent){
      if(terminalRead?.ok===true&&terminalRead.terminal===true&&protocol.sameWitness(terminalRead.terminalWitness,held.intent)){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
      return held;
    }
    if(terminalRead?.ok===true&&terminalRead.terminal===true){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
    if(!terminalRead||terminalRead.ok!==true)ptcFail(terminalRead?.code||"TERMINAL_CLOSE_READ_FAILED",terminalRead?.message||"Terminal state could not be verified.");
    let final=finalApi.getState();if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.rivalryId!==request.rivalryId)final=await finalApi.refresh();
    if(ptcRequest()?.key!==request.key)return null;
    if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.finalSeasonReconciled!==true||final.rivalryId!==request.rivalryId)return ptcClear();
    const remote=ptcRemoteActive(context);
    if(!remote)return ptcPublish(request,{phase:"BLOCKED",rivalryId:request.rivalryId,terminal:false,finalReconciliation:ptcClone(final),message:"Final results are preserved, but Terminal Close requires one exact ACTIVE private session for this rivalry.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
    const intent=protocol.prepare(final,{sessionId:remote.sessionId});
    const failed=automaticAttempts.get(ptcAutomaticKey(context))?.failed===true;
    const ready=ptcPublish(request,{phase:"READY",rivalryId:request.rivalryId,sessionId:remote.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:!failed,automaticCloseFailed:failed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
    ptcScheduleAutomaticClose(context);
    return ready;
  }
  function ptcRefresh(){
    if(refreshPromise)return refreshPromise;busy=true;ptcRender();
    const run=ptcRefreshNow().catch(error=>{ptcReport("Unable to refresh Shared Showdown Terminal Close",error);return ptcCurrentState();}).finally(()=>{if(refreshPromise===run)refreshPromise=null;busy=false;ptcRender();});refreshPromise=run;return run;
  }
  // Job 31: when the 4-hour private session ends (or a reload drops it) every shared refresher fails at once. The RECONNECT
  // SESSION banner owns that state, so those failures wake the banner instead of stacking red error toasts.
  function ptcSessionRecoveryOwnsFailure(){
    try{
      if(ptcShowdown()?.sharedJourney?.mode!=="shared")return false;
      const remote=root.CareerModeSparkRemoteJoining?.getState?.();if(!remote)return false;
      const expiry=Number(remote.expiresAtEpochMs);
      if(remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry)return false;
      root.console?.warn?.("[Career Mode Showdown] Shared refresh paused until the private session is reconnected.");
      void root.CareerModeProductionSharedJourneyReconnect?.refresh?.();
      return true;
    }catch(_error){return false;}
  }
  async function ptcReportUnlessClosed(context,error){
    if(ptcSessionRecoveryOwnsFailure())return false;
    // Active-journey refreshers lose read access once the rivalry closes; a verified CLOSED state makes their failure expected, anything else is still reported.
    try{let current=ptcCurrentState();if(current?.phase!=="CLOSED"&&ptcRequest())current=await ptcRefresh();if(current&&current.phase==="CLOSED")return false;}catch(_error){}
    ptcReport(context,error);return true;
  }
  function ptcCloseOptions(context,intent){return {user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:context.request.rivalryId,sessionId:intent.sessionId,deviceId:context.deviceId,intent,nowEpochMs:Date.now(),cryptoImpl:root.crypto};}
  function ptcAccepted(request,intent,result){
    const closed=protocol.closeResult(intent,result);if(ptcRequest()?.key!==request.key)return null;try{remoteApi?.forgetSession?.();}catch(_error){}
    return ptcPublish(request,{phase:"CLOSED",rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryRevision:closed.rivalryRevision,sessionRevision:closed.sessionRevision,terminal:true,terminalWitness:ptcClone(intent),replayed:closed.replayed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
  }
  // BH-7: when both managers tap CLOSE together the loser's write is refused (permission-denied once the winner closed the
  // session/rivalry). Re-read once, like Season Results does; if the rivalry is already CLOSED with this exact witness, show
  // CLOSED quietly. Anything else keeps the existing rejection path.
  const PTC_RACE_CODES=new Set(["permission-denied","permission_denied","terminal_close_session_not_active","terminal_close_rivalry_not_active"]);
  async function ptcClosedByRival(request,context,intent,result,generation){
    if(!PTC_RACE_CODES.has(ptcCode(result)))return null;
    try{
      const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
      if(!ptcStillCurrent(request,generation)||terminalRead?.ok!==true||terminalRead.terminal!==true||!protocol.sameWitness(terminalRead.terminalWitness,intent))return null;
      try{remoteApi?.forgetSession?.();}catch(_error){}
      ptcPublish(request,ptcClosedState(request,terminalRead));
      return {ok:true,status:"replayed",replayed:true,closedByRival:true,rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};
    }catch(_error){return null;}
  }
  async function ptcClose(automaticKey=null){
    if(closePromise)return closePromise;
    const current=ptcCurrentState();if(!current||current.phase!=="READY"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_NOT_READY",message:"Terminal Close is not ready for this exact Shared Showdown."};
    const request=ptcRequest(),intent=protocol.verifyIntent(current.intent),generation=stateGeneration;busy=true;ptcPublish(request,{...current,automaticSaving:true,automaticCloseFailed:false});
    const run=(async()=>{
      try{
        const context=await ptcResolveContext(request);if(!ptcStillCurrent(request,generation)||(automaticKey&&ptcAutomaticKey(context)!==automaticKey))ptcFail("TERMINAL_CLOSE_CONTEXT_CHANGED");
        if(!ptcRemoteActive(context,intent.sessionId))ptcFail("TERMINAL_CLOSE_ACTIVE_SESSION_REQUIRED","The exact private session used by this terminal witness is no longer ACTIVE.");
        const result=await provider.close(ptcCloseOptions(context,intent));
        if(!ptcStillCurrent(request,generation))return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
        if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
        if(ptcAmbiguous(result)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:false,automaticCloseFailed:true,message:"Terminal Close acknowledgement was not received. The exact same terminal witness is retained in page memory for deterministic retry; no replacement session or local-save mutation will be generated.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {...result,recoverable:true};}
        const rivalClosed=await ptcClosedByRival(request,context,intent,result,generation);if(rivalClosed)return rivalClosed;
        ptcPublish(request,{...current,automaticSaving:false,automaticCloseFailed:true,message:result?.message||"Terminal Close was rejected without changing the completed Showdown."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
      }catch(error){
        if(!ptcStillCurrent(request,generation))return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
        if(ptcAmbiguous(error)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:false,automaticCloseFailed:true,message:"Terminal Close acknowledgement was not received. Retry is bound to the exact same witness and session capability.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}
        ptcPublish(request,{...current,automaticSaving:false,automaticCloseFailed:true,message:error.message});
        ptcReport("Shared Showdown Terminal Close failed",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};
      }
    })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();});closePromise=run;return run;
  }
  async function ptcRetry(){
    if(closePromise)return closePromise;
    const current=ptcCurrentState();if(!current||current.phase!=="RECOVERY_PENDING"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_RECOVERY_REQUIRED",message:"No unresolved Terminal Close is waiting for retry."};
    const request=ptcRequest(),intent=protocol.verifyIntent(current.intent),generation=stateGeneration;busy=true;ptcPublish(request,{...current,automaticSaving:true});
    // H1017-2: the request and state generation are re-checked after every await, before any close call or session cleanup.
    const changed={ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
    const run=(async()=>{
      try{
        const context=await ptcResolveContext(request);if(!ptcStillCurrent(request,generation))return changed;
        const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
        if(!ptcStillCurrent(request,generation))return changed;
        if(terminalRead?.ok===true&&terminalRead.terminal===true){if(!protocol.sameWitness(terminalRead.terminalWitness,intent))ptcFail("TERMINAL_CLOSE_REPLAY_CONFLICT");try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcClosedState(request,terminalRead));return {ok:true,status:"replayed",replayed:true,rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};}
        const result=await provider.close(ptcCloseOptions(context,intent));
        if(!ptcStillCurrent(request,generation))return changed;
        if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
        if(ptcAmbiguous(result)){ptcPublish(request,current);return {...result,recoverable:true};}
        const rivalClosed=await ptcClosedByRival(request,context,intent,result,generation);if(rivalClosed)return rivalClosed;
        ptcPublish(request,{...current,message:result?.message||"The same Terminal Close retry was rejected; the exact witness remains held for inspection."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
      }catch(error){if(ptcAmbiguous(error)){ptcPublish(request,current);return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}if(ptcStillCurrent(request,generation))ptcPublish(request,current);ptcReport("Shared Showdown Terminal Close retry failed",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};}
    })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();});closePromise=run;return run;
  }
  // BH-7: the one-shot wake below never asks again when an initialize left Connected Rivalry unattached and "unavailable".
  // Re-ask at most once per 30 s, one attempt at a time (flag cleared in finally), only while no request exists and the page is
  // visible. r52's unthrottled retry re-ran initialize on every wake; each initialize emits a rivalry state-change event that
  // wakes this module again, so it looped and stalled the season-3 publish. The 30 s clock starts before the attempt, so the
  // attempt's own state-change event cannot start another one; it is fire-and-forget and nothing else waits on it.
  function ptcRivalryRetryDue(api){
    if(rivalryRetryInFlight||root.document?.visibilityState==="hidden")return false;
    if(ptcShowdown()?.sharedJourney?.mode!=="shared"||!api||typeof api.initialize!=="function")return false;
    const s=api.getState?.();if(!s||s.initialized!==true||s.attached===true||s.status!=="unavailable"||s.busy===true)return false;
    return !rivalryRetryAt||Date.now()-rivalryRetryAt>=RIVALRY_RETRY_MS;
  }
  function ptcRetryUnavailableRivalry(api){
    if(!ptcRivalryRetryDue(api))return false;
    rivalryRetryAt=Date.now();rivalryRetryInFlight=true;
    void Promise.resolve().then(()=>{const s=api.getState?.();if(s&&s.attached!==true&&s.status==="unavailable"&&!ptcRequest())return api.initialize();return null;}).catch(()=>{}).finally(()=>{rivalryRetryInFlight=false;});
    return true;
  }
  function ptcWake(event){
    if(event?.type==="career-mode-save-library-authority-invalidated")return ptcClear();
    const request=ptcRequest();
    if(!request){
      ptcClear();
      // After a reload the durable rivalry binding is only known once Connected Rivalry initializes; its state-change event wakes this module again.
      const api=ptcRivalryApi();if(!rivalryWakeRequested&&ptcShowdown()?.sharedJourney?.mode==="shared"&&api&&typeof api.initialize==="function"&&api.getState?.()?.initialized!==true){rivalryWakeRequested=true;rivalryRetryAt=Date.now();void Promise.resolve().then(()=>api.initialize()).catch(()=>{});}
      else ptcRetryUnavailableRivalry(api);
      return;
    }
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
    install:ptcInstall,refresh:ptcRefresh,reportUnlessClosed:ptcReportUnlessClosed,close:ptcClose,retry:ptcRetry,getState:ptcCurrentState,isBusy:()=>busy
  });
});
