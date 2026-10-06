(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkRemoteJoining=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SRJ_PANEL_ID="sparkRemoteJoiningOverlay";
  const SRJ_DEPENDENCIES=Object.freeze([
    ["production-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
    ["connected-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["private-pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
    ["private-session","js/sparkPrivateSession.js",()=>root.CareerModeSparkPrivateSession],
    ["standard-auth-session","js/sparkStandardAuthPrivateSession.js",()=>root.CareerModeSparkStandardAuthPrivateSession]
  ]);
  const SRJ_CANONICAL_KEYS=Object.freeze(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);
  const SRJ_AMBIGUOUS_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","network-request-failed"]);
  // Job 31: the Rules cap a session at request.time + 4h with no clock slack, so a host whose clock ran even a second fast was
  // refused. Hosting asks for 4h minus one minute (the same one-minute slack the Rules give createdAt).
  const SRJ_HOST_TTL_MS=4*60*60*1000-60*1000;
  // Job 31: the host page stayed OPEN after the other manager joined until someone tapped REFRESH / READ, so a mid-game
  // reconnect looked stuck on the host. While this page holds its own OPEN hosted session it reads it quietly every few
  // seconds (for at most ten minutes, never while hidden) and picks up the join by itself.
  const SRJ_JOIN_WATCH_MS=4000,SRJ_JOIN_WATCH_LIMIT_MS=10*60*1000;
  // Hunt 1018 (H1018-2): the watcher belongs to one sessionId, so hosting a replacement cancels the old session's timer.
  let srjJoinWatchTimer=null,srjJoinWatchSessionId=null;
  // Hunt 1018 (H1018-1): one replacement (end the held session, then host or join) runs at a time; it is taken before any await.
  let srjReplaceAction=null;
  const srjScriptPromises=new Map();
  const srjListeners=new Set();
  let srjState=srjFreeze({status:"idle",open:false,busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"Remote Joining is private and action-only. No session request has been sent."});

  function srjFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(srjFreeze);
    return value;
  }
  function srjError(code,message){const error=new Error(message||code);error.code=code;return error;}
  function srjErrorCode(error){return String(error&&error.code||"").split("/").pop().trim().toLowerCase();}
  function srjIsAmbiguousFailure(error){return SRJ_AMBIGUOUS_CODES.has(srjErrorCode(error));}
  function srjSetState(next){
    srjState=srjFreeze({...srjState,...next});
    for(const listener of srjListeners){try{listener(srjState);}catch(_error){}}
    srjRenderPanel();
    return srjState;
  }
  function srjRevision(){
    if(!root.document)return "1.9.0-r3";
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim()||"1.9.0-r3":"1.9.0-r3";
  }
  function srjVersionedUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);
    url.searchParams.set("v",srjRevision());
    return url.href;
  }
  function srjLoadScript(key,path,ready){
    const current=ready();
    if(current)return Promise.resolve(current);
    if(srjScriptPromises.has(key))return srjScriptPromises.get(key);
    if(!root.document)return Promise.reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`Required private runtime is unavailable: ${path}.`));
    const promise=new Promise((resolve,reject)=>{
      const script=root.document.createElement("script");
      script.src=srjVersionedUrl(path);
      script.async=false;
      script.dataset.srjDependency=key;
      script.addEventListener("load",()=>{const api=ready();api?resolve(api):reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`${path} did not expose its expected API.`));},{once:true});
      script.addEventListener("error",()=>reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`Unable to load ${path}.`)),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>{srjScriptPromises.delete(key);});
    srjScriptPromises.set(key,promise);
    return promise;
  }
  async function srjEnsureDependencies(){
    const resolved={};
    for(const [key,path,ready] of SRJ_DEPENDENCIES)resolved[key]=await srjLoadScript(key,path,ready);
    return Object.freeze(resolved);
  }
  async function srjResolveContext(){
    const deps=await srjEnsureDependencies();
    const runtime=deps["production-runtime"];
    const account=deps["connected-account"];
    const pairing=deps["private-pairing"];
    const rivalry=deps["connected-rivalry"];
    const protocol=deps["standard-auth-session"];
    if(!runtime||typeof runtime.ensureAccountServices!=="function")throw srjError("REMOTE_JOINING_RUNTIME_UNAVAILABLE","Private Firebase runtime is unavailable. Local Career Mode remains available.");
    if(!account||typeof account.initialize!=="function"||typeof account.getState!=="function")throw srjError("REMOTE_JOINING_ACCOUNT_UNAVAILABLE","Connected Account is unavailable.");
    await account.initialize();
    const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_REQUIRED","Sign in with Google on Home before starting or joining a private session.");
    if(!pairing||typeof pairing.initialize!=="function"||typeof pairing.getState!=="function")throw srjError("REMOTE_JOINING_DEVICE_UNAVAILABLE","Registered-device authority is unavailable.");
    await pairing.initialize();
    const pairingState=pairing.getState();
    if(!pairingState||pairingState.registered!==true||!pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_REQUIRED","This phone is not set up yet. Go Home, sign in again and choose Daniel or Nik, then try again.");
    if(!rivalry||typeof rivalry.initialize!=="function"||typeof rivalry.getState!=="function")throw srjError("REMOTE_JOINING_RIVALRY_UNAVAILABLE","Connected Rivalry authority is unavailable.");
    await rivalry.initialize();
    const rivalryState=rivalry.getState();
    if(!rivalryState||rivalryState.attached!==true||!rivalryState.rivalryId)throw srjError("REMOTE_JOINING_RIVALRY_REQUIRED","Daniel and Nik are not connected on this phone yet. Go Home and tap CONTINUE CAREER first.");
    const services=await runtime.ensureAccountServices();
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)throw srjError("REMOTE_JOINING_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable. Local Career Mode remains available.");
    const user=services.auth.currentUser;
    if(!user||user.uid!==accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_MISMATCH","The current Google account no longer matches the Connected Account authority.");
    if(rivalryState.accountId&&rivalryState.accountId!==user.uid)throw srjError("REMOTE_JOINING_RIVALRY_ACCOUNT_MISMATCH","The attached Connected Rivalry belongs to a different account.");
    if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_MISMATCH","The attached Connected Rivalry belongs to a different registered browser identity.");
    return Object.freeze({protocol,services,user,accountId:user.uid,deviceId:pairingState.deviceId,rivalryId:rivalryState.rivalryId});
  }
  function srjOperationOptions(context,sessionId){
    return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,deviceId:context.deviceId,rivalryId:context.rivalryId,sessionId,nowEpochMs:Date.now(),cryptoImpl:root.crypto};
  }
  function srjFailureMessage(result,fallback){
    if(result&&result.code==="resource-exhausted")return "Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; local Career Mode remains available.";
    if(result&&typeof result.message==="string"&&result.message.trim())return result.message.trim();
    return fallback;
  }
  function srjExpiredByClock(){const expiresAt=Number(srjState.expiresAtEpochMs);return Boolean(srjState.sessionId&&Number.isFinite(expiresAt)&&Date.now()>=expiresAt);}
  function srjHasNonterminalSession(){return !!srjState.sessionId&&["open","active"].includes(srjState.sessionState)&&!srjExpiredByClock();}
  function srjSessionBlocksStart(){return srjHasNonterminalSession()||!!srjState.pendingAction||srjState.sessionState==="unresolved";}
  // BH-11 (#1): after a reload the other phone loses its page-memory code while this phone still holds the old session, so
  // HOST and JOIN were dead here. This page may end its OWN confirmed session (close an ACTIVE one, revoke an OPEN one it
  // hosts) and then host or join a fresh one. Unresolved or pending capabilities are never replaced.
  function srjHeldSessionReplaceable(){return srjHasNonterminalSession()&&!srjState.pendingAction&&!srjState.busy&&(srjState.sessionState==="active"||(srjState.sessionState==="open"&&srjState.role==="host"));}
  async function srjEndHeldSession(){
    if(!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"The current private session cannot be replaced right now."};
    let context;
    try{context=await srjResolveContext();}
    catch(error){const message=`${error&&error.message?error.message:"Current private authority could not be resolved."} The current private session was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REPLACE_FAILED",message};}
    if(!srjPendingContextMatches(context)){const message="The current private session belongs to a different Google account, browser or Showdown, so it was not replaced.";srjSetState({status:"error",busy:false,message});return {ok:false,code:"REMOTE_JOINING_REPLACE_CONTEXT_CHANGED",message};}
    const result=srjState.sessionState==="active"?await srjCloseSession():await srjRevokeSession();
    if(!result||result.ok!==true)return result||{ok:false,code:"REMOTE_JOINING_REPLACE_FAILED",message:"The current private session could not be ended."};
    return srjSessionBlocksStart()?{ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"The current private session could not be ended."}:{ok:true};
  }
  function srjAcceptResult(result,context,role,message){
    return srjSetState({status:"ready",busy:false,sessionId:result.sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role,sessionState:result.state,revision:result.revision,expiresAtEpochMs:result.expiresAtEpochMs,pendingAction:null,capabilityCopyAllowed:true,message});
  }
  function srjPendingContextMatches(context){
    return !!context&&context.rivalryId===srjState.rivalryId&&context.accountId===srjState.accountId&&context.deviceId===srjState.deviceId;
  }
  function srjPendingFailure(error,action){
    const message=error&&error.message?error.message:"The provider acknowledgement was not received.";
    srjSetState({status:"recovery-pending",busy:false,pendingAction:action,capabilityCopyAllowed:false,message:`${message} The outcome is unresolved. The exact same page-memory capability is retained for deterministic retry; no new session will be generated and no local save was changed.`});
    return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_PENDING",message,recoverable:true,pendingAction:action};
  }
  // BH-11 (#10): a host or join write is refused when the phone clock is minutes off server time (the Rules check createdAt and
  // lastActivityAt against request.time), which used to surface as a raw permission error.
  const SRJ_CLOCK_HINT=" If the code is right, check that your phone's date and time are set automatically; a phone clock that is several minutes off is refused.";
  function srjRejectionMessage(error,action){
    if((action==="host"||action==="join")&&srjErrorCode(error)==="permission-denied")return `The private session was refused.${SRJ_CLOCK_HINT}`;
    return error&&error.message?error.message:"Private session request was rejected.";
  }
  function srjClearRejectedPending(error,action){
    const message=srjRejectionMessage(error,action);
    if(action==="close"){
      srjSetState({status:"error",busy:false,pendingAction:null,capabilityCopyAllowed:true,message:`${message} The last confirmed active session remains held in page memory; no local save was changed.`});
    }else{
      srjSetState({status:"error",busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:`${message} No unresolved capability is exposed and no local save was changed.`});
    }
    return {ok:false,code:error&&error.code||`REMOTE_JOINING_${String(action).toUpperCase()}_FAILED`,message,recoverable:false};
  }
  async function srjAttemptPending(context){
    const action=srjState.pendingAction;
    const sessionId=srjState.sessionId;
    if(!action||!sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
    if(!srjPendingContextMatches(context)){
      srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:"The current account, registered browser or Connected Rivalry no longer matches the unresolved request. Retry is blocked so the capability cannot cross authority contexts."});
      return {ok:false,code:"REMOTE_JOINING_RECOVERY_CONTEXT_CHANGED",message:"The unresolved request belongs to a different current authority context.",recoverable:true,pendingAction:action};
    }
    srjSetState({status:`retrying-${action}`,busy:true,capabilityCopyAllowed:false,message:`Retrying the exact same ${action} capability. No replacement session will be generated…`});
    try{
      let result;
      if(action==="host")result=await context.protocol.openSession({...srjOperationOptions(context,sessionId),ttlMs:SRJ_HOST_TTL_MS});
      else if(action==="join")result=await context.protocol.joinSession(srjOperationOptions(context,sessionId));
      else if(action==="close")result=await context.protocol.closeSession(srjOperationOptions(context,sessionId));
      else throw srjError("REMOTE_JOINING_RECOVERY_ACTION_INVALID","The unresolved private-session action is invalid.");
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_RECOVERY_FAILED",srjFailureMessage(result,"Private-session recovery could not be confirmed."));
      if(action==="host"){srjAcceptResult(result,context,"host",result.replayed?"Private session recovery confirmed the original host capability. No duplicate session was created.":"Private session is open. Share the full code directly with the other paired manager. It is kept only in this page's memory.");srjWatchForJoin(result.sessionId);}
      else if(action==="join")srjAcceptResult(result,context,"peer",result.replayed?"Private session recovery confirmed the original join on the same capability.":"Private session is active with exactly the two paired rivalry accounts. Local gameplay remains unchanged.");
      else srjAcceptResult(result,context,srjState.role||"member",result.replayed?"Private session recovery confirmed the original terminal close on the same capability.":"Private session is closed terminally. Its code remains only in page memory until you forget it or reload.");
      return result;
    }catch(error){
      if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,action);
      return srjClearRejectedPending(error,action);
    }
  }
  function srjHostWaitingForJoin(sessionId){return Boolean(sessionId&&srjState.sessionId===sessionId&&srjState.role==="host"&&srjState.sessionState==="open"&&!srjState.pendingAction&&!srjExpiredByClock());}
  function srjWatchForJoin(sessionId,startedAt=Date.now()){
    if(!root.document||typeof root.setTimeout!=="function"||!srjHostWaitingForJoin(sessionId))return false;
    if(srjJoinWatchTimer!==null){if(srjJoinWatchSessionId===sessionId)return false;if(typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);}
    srjJoinWatchSessionId=sessionId;
    const timer=root.setTimeout(async()=>{
      if(srjJoinWatchTimer!==timer)return;
      srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
      if(!srjHostWaitingForJoin(sessionId)||Date.now()-startedAt>SRJ_JOIN_WATCH_LIMIT_MS)return;
      if(!srjState.busy&&root.document.visibilityState!=="hidden"){
        try{
          const context=await srjResolveContext();
          const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
          if(srjHostWaitingForJoin(sessionId)&&!srjState.busy&&result&&result.ok===true&&result.state!=="open")srjAcceptResult(result,context,"host",result.state==="active"?"The other manager joined. Private session is active with exactly the two paired rivalry accounts.":`Private session refreshed at revision ${result.revision}.`);
        }catch(_error){}
      }
      srjWatchForJoin(sessionId,startedAt);
    },SRJ_JOIN_WATCH_MS);
    srjJoinWatchTimer=timer;
    return true;
  }
  async function srjRetryPendingOperation(){
    if(!srjState.pendingAction||!srjState.sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
    if(srjState.busy)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
    try{return await srjAttemptPending(await srjResolveContext());}
    catch(error){
      if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,srjState.pendingAction);
      srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:`${error&&error.message?error.message:"Current private authority could not be resolved."} The unresolved capability remains memory-only and will not be copied or replaced.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_CONTEXT_UNAVAILABLE",message:error&&error.message||"Current private authority could not be resolved.",recoverable:true,pendingAction:srjState.pendingAction};
    }
  }
  function srjReplaceBusy(){return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};}
  function srjReplaceHeld(start){srjReplaceAction=(async()=>{const ended=await srjEndHeldSession();return ended.ok?await start():ended;})().finally(()=>{srjReplaceAction=null;});return srjReplaceAction;}
  async function srjHostSession(options={}){
    if(srjReplaceAction)return srjReplaceBusy();
    if(srjSessionBlocksStart()){
      if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Resolve, revoke or close the current private session before hosting another."};
      return srjReplaceHeld(srjStartHost);
    }
    return srjStartHost();
  }
  async function srjStartHost(){
    srjSetState({status:"hosting",busy:true,message:"Creating an exact private session capability…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.generateSessionId(root.crypto);
      srjSetState({status:"hosting",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"host",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"host",capabilityCopyAllowed:false,message:"Opening the exact private session. Its full capability is hidden until provider acknowledgement is confirmed…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="host"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"host");
      if(srjState.pendingAction==="host")return srjClearRejectedPending(error,"host");
      srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be opened."} No local save was changed.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_HOST_FAILED",message:error&&error.message||"Private session could not be opened."};
    }
  }
  async function srjJoinSession(value,options={}){
    if(srjReplaceAction)return srjReplaceBusy();
    if(srjSessionBlocksStart()){
      // BH-11 (#1): only an ACTIVE session may be ended to join a fresh code; an OPEN hosted one keeps the existing guard.
      if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable()||srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Resolve, revoke or close the current private session before joining another."};
      srjReplaceAction=(async()=>{
        let nextSessionId;
        try{const deps=await srjEnsureDependencies();nextSessionId=deps["standard-auth-session"].normalizeSessionId(value);}
        catch(error){const message=`${error&&error.message?error.message:"That private session code is invalid."} The current private session was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message};}
        if(nextSessionId===srjState.sessionId){const message="This phone is already in that private session.";srjSetState({message});return {ok:false,code:"REMOTE_JOINING_SAME_SESSION",message};}
        const ended=await srjEndHeldSession();return ended.ok?await srjStartJoin(value):ended;
      })().finally(()=>{srjReplaceAction=null;});
      return srjReplaceAction;
    }
    return srjStartJoin(value);
  }
  async function srjStartJoin(value){
    srjSetState({status:"joining",busy:true,message:"Joining the exact private session…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.normalizeSessionId(value);
      srjSetState({status:"joining",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"peer",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"join",capabilityCopyAllowed:false,message:"Joining the exact capability. Its full value remains hidden while provider acknowledgement is unresolved…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="join"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"join");
      if(srjState.pendingAction==="join")return srjClearRejectedPending(error,"join");
      srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be joined."} No local save was changed.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message:error&&error.message||"Private session could not be joined."};
    }
  }
  async function srjRefreshSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before reading the session."};
    srjSetState({status:"refreshing",busy:true,message:"Reading exact private-session authority…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.readSession(srjOperationOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_READ_FAILED",srjFailureMessage(result,"Private session could not be read."));
      const clockNote=result.expiredByClock?" The provider expiry boundary has passed; no automatic mutation was performed.":"";
      srjAcceptResult(result,context,srjState.role||"member",`Private session refreshed at revision ${result.revision}.${clockNote}`);
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be read."} Local Career Mode remains available.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_READ_FAILED",message:error&&error.message||"Private session could not be read."};}
  }
  async function srjRevokeSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before revoking the session."};
    if(srjState.sessionState!=="open")return {ok:false,code:"REMOTE_JOINING_REVOKE_NOT_OPEN",message:"Only an open host session can be revoked before peer join."};
    srjSetState({status:"revoking",busy:true,message:"Revoking the exact open private session…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.revokeSession(srjOperationOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_REVOKE_FAILED",srjFailureMessage(result,"Private session could not be revoked."));
      srjAcceptResult(result,context,"host","Private session is revoked terminally. It can no longer be joined; forget the code when ready.");
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be revoked."} The capability remains held in page memory.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REVOKE_FAILED",message:error&&error.message||"Private session could not be revoked."};}
  }
  async function srjCloseSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before closing the session."};
    if(srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_CLOSE_NOT_ACTIVE",message:"Only an active private session can be closed."};
    try{
      const context=await srjResolveContext();
      srjSetState({status:"closing",busy:true,accountId:context.accountId,deviceId:context.deviceId,pendingAction:"close",capabilityCopyAllowed:false,message:"Closing the exact active private session. Copy is disabled until provider acknowledgement is confirmed…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="close"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"close");
      if(srjState.pendingAction==="close")return srjClearRejectedPending(error,"close");
      srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be closed."} Local Career Mode remains available.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_CLOSE_FAILED",message:error&&error.message||"Private session could not be closed."};
    }
  }
  function srjForgetSession(){
    if(srjState.pendingAction||srjState.sessionState==="unresolved")return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending provider outcome before forgetting this page-memory capability."};
    return srjSetState({status:"idle",busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"Private session code forgotten from page memory. No provider state was changed."});
  }
  async function srjCopySessionCode(){
    if(!srjState.sessionId||srjState.capabilityCopyAllowed!==true||srjState.pendingAction)return false;
    try{if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){await root.navigator.clipboard.writeText(srjState.sessionId);return true;}}catch(_error){}
    return false;
  }
  function srjCreate(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined&&text!==null)element.textContent=String(text);return element;}
  function srjShort(value){return typeof value!=="string"||!value?"—":value.length<=20?value:`${value.slice(0,12)}…${value.slice(-6)}`;}
  function srjRenderPanel(){
    if(!root.document||srjState.open!==true)return null;
    const overlay=root.document.getElementById(SRJ_PANEL_ID);
    if(!overlay)return null;
    const body=overlay.querySelector(".remoteJoiningBody");
    if(!body)return overlay;
    body.replaceChildren();
    const intro=srjCreate("div","remoteJoiningIntro");
    intro.append(srjCreate("span","remoteJoiningEyebrow","PRIVATE CONNECTION"),srjCreate("h2","","REMOTE JOINING"),srjCreate("p","","This connection is only for Daniel and Nik. If the network drops, retry the same code instead of creating another one."));
    body.appendChild(intro);
    const grid=srjCreate("div","remoteJoiningGrid");
    const host=srjCreate("section","remoteJoiningCard");
    host.append(srjCreate("span","remoteJoiningStep","01 · HOST"),srjCreate("h3","","CREATE CONNECTION CODE"),srjCreate("p","","Creates one fresh code for this Showdown."));
    const replaceable=srjHeldSessionReplaceable(),joinReplaces=replaceable&&srjState.sessionState==="active";
    const hostButton=srjCreate("button","menuButton",replaceable?"HOST NEW SESSION (REPLACES CURRENT)":"HOST PRIVATE SESSION");hostButton.type="button";hostButton.disabled=srjState.busy||(srjSessionBlocksStart()&&!replaceable);hostButton.addEventListener("click",()=>{void srjHostSession(replaceable?{replaceCurrent:true}:{});});host.appendChild(hostButton);
    const join=srjCreate("section","remoteJoiningCard");
    join.append(srjCreate("span","remoteJoiningStep","02 · JOIN"),srjCreate("h3","","JOIN CONNECTION"),srjCreate("p","","Paste the full code shared directly by the other already-paired manager."));
    const input=srjCreate("input","remoteJoiningInput");input.type="text";input.placeholder="session_…";input.autocomplete="off";input.autocapitalize="none";input.spellcheck=false;input.setAttribute("aria-label","Connection code");
    const joinButton=srjCreate("button","menuButton",joinReplaces?"JOIN NEW SESSION (ENDS CURRENT)":"JOIN PRIVATE SESSION");joinButton.type="button";joinButton.disabled=srjState.busy||(srjSessionBlocksStart()&&!joinReplaces);joinButton.addEventListener("click",()=>{void srjJoinSession(input.value,joinReplaces?{replaceCurrent:true}:{});});join.append(input,joinButton);grid.append(host,join);body.appendChild(grid);
    const current=srjCreate("section","remoteJoiningCurrent");
    current.append(srjCreate("span","remoteJoiningEyebrow","CURRENT CONNECTION"));
    if(srjState.sessionId){
      const expiredByClock=srjExpiredByClock();current.append(srjCreate("strong","remoteJoiningState",`${expiredByClock?"EXPIRED":String(srjState.sessionState||"unknown").toUpperCase()} · REV ${Number.isInteger(srjState.revision)?srjState.revision:"—"} · ${srjState.role||"member"}`));
      const visibleCode=srjState.capabilityCopyAllowed===true&&!srjState.pendingAction?srjState.sessionId:srjShort(srjState.sessionId);
      const code=srjCreate("code","remoteJoiningCode",visibleCode);current.appendChild(code);
      const meta=srjCreate("p","remoteJoiningMeta",`Rivalry ${srjShort(srjState.rivalryId)}${Number.isFinite(srjState.expiresAtEpochMs)?` · expires ${new Date(srjState.expiresAtEpochMs).toLocaleTimeString()}`:""}`);current.appendChild(meta);
      if(joinReplaces)current.appendChild(srjCreate("p","remoteJoiningMeta","If the other phone lost this session (for example after a reload), start a fresh one: host a new session here and send the code, or paste their new code above and join it. Either one ends this session first."));
      const actions=srjCreate("div","remoteJoiningActions");
      if(srjState.pendingAction){const retry=srjCreate("button","compactButton",`RETRY SAME ${srjState.pendingAction.toUpperCase()}`);retry.type="button";retry.disabled=srjState.busy;retry.addEventListener("click",()=>{void srjRetryPendingOperation();});actions.appendChild(retry);}
      const copy=srjCreate("button","compactButton","COPY CODE");copy.type="button";copy.disabled=srjState.busy||expiredByClock||srjState.capabilityCopyAllowed!==true||!!srjState.pendingAction;copy.addEventListener("click",async()=>{copy.textContent=await srjCopySessionCode()?"COPIED":"COPY UNAVAILABLE";});
      const refresh=srjCreate("button","compactButton","REFRESH / READ");refresh.type="button";refresh.disabled=srjState.busy||!!srjState.pendingAction;refresh.addEventListener("click",()=>{void srjRefreshSession();});
      const revoke=srjCreate("button","compactButton","REVOKE OPEN SESSION");revoke.type="button";revoke.disabled=srjState.busy||expiredByClock||!!srjState.pendingAction||srjState.sessionState!=="open";revoke.addEventListener("click",()=>{void srjRevokeSession();});
      const close=srjCreate("button","compactButton","CLOSE SESSION");close.type="button";close.disabled=srjState.busy||expiredByClock||!!srjState.pendingAction||srjState.sessionState!=="active";close.addEventListener("click",()=>{void srjCloseSession();});
      const forget=srjCreate("button","compactButton","FORGET CODE");forget.type="button";forget.disabled=srjState.busy||!!srjState.pendingAction||srjHasNonterminalSession()||srjState.sessionState==="unresolved";forget.addEventListener("click",srjForgetSession);actions.append(copy,refresh,revoke,close,forget);current.appendChild(actions);
    }else{
      current.append(srjCreate("p","remoteJoiningEmpty","No session capability is held in page memory."));
      // BH-11 (#1): after a reload the other phone may still show the game with the old session; say where it takes the new code.
      current.append(srjCreate("p","remoteJoiningMeta","If the other phone still shows the game, it takes your new code from NEW SESSION CODE on its game banner, or from Home > CONTINUE CAREER > CONNECTED."));
    }
    body.appendChild(current);
    const note=srjCreate("p","remoteJoiningStatus",srjState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.appendChild(note);
    return overlay;
  }
  function srjOpenPanel(){
    if(!root.document)return false;
    let overlay=root.document.getElementById(SRJ_PANEL_ID);
    if(!overlay){
      overlay=srjCreate("div","remoteJoiningOverlay");overlay.id=SRJ_PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Private Remote Joining");
      const shell=srjCreate("div","remoteJoiningShell");const header=srjCreate("div","remoteJoiningHeader");header.append(srjCreate("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=srjCreate("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close Private Remote Joining");dismiss.addEventListener("click",srjClosePanel);header.appendChild(dismiss);const body=srjCreate("div","remoteJoiningBody");shell.append(header,body);overlay.appendChild(shell);root.document.body.appendChild(overlay);
    }
    overlay.classList.remove("hidden");srjSetState({open:true});const focus=overlay.querySelector("button");if(focus)focus.focus();return true;
  }
  function srjClosePanel(){const overlay=root.document&&root.document.getElementById(SRJ_PANEL_ID);if(overlay)overlay.classList.add("hidden");srjState=srjFreeze({...srjState,open:false});return true;}
  function srjSubscribe(listener){if(typeof listener!=="function")return()=>{};srjListeners.add(listener);return()=>srjListeners.delete(listener);}
  function srjOnOnline(){if(srjState.pendingAction&&!srjState.busy)void srjRetryPendingOperation();}
  if(root&&typeof root.addEventListener==="function")root.addEventListener("online",srjOnOnline);

  return srjFreeze({
    contractVersion:1,
    feature:"stage5e-production-private-remote-joining-runtime",
    productionRulesPublished:true,
    providerIdentity:"standard-firebase-request-auth-uid",
    authPersistence:"browserSessionPersistence",
    registeredDeviceAuthority:"account-owned-mutation-metadata",
    exactCapabilityBits:256,
    hostSessionTtlMs:SRJ_HOST_TTL_MS,
    sessionCapabilityStorage:"page-memory-only",
    persistentFirestoreCache:false,
    publicDiscovery:false,
    collectionListing:false,
    exactlyTwoAccounts:true,
    gameplayMutation:false,
    canonicalStorageMutation:false,
    canonicalStorageKeys:SRJ_CANONICAL_KEYS,
    candidateCInvolved:false,
    billingRequired:false,
    blazeRequired:false,
    cloudRunRequired:false,
    cloudFunctionsRequired:false,
    appCheckEnforcementRequired:false,
    hostJoinUxExposed:true,
    sameCapabilityReconnect:true,
    unresolvedCapabilityCopyBlocked:true,
    onlineRetryBounded:true,
    hostSession:srjHostSession,
    joinSession:srjJoinSession,
    retryPendingOperation:srjRetryPendingOperation,
    refreshSession:srjRefreshSession,
    revokeSession:srjRevokeSession,
    closeSession:srjCloseSession,
    forgetSession:srjForgetSession,
    openPanel:srjOpenPanel,
    closePanel:srjClosePanel,
    subscribe:srjSubscribe,
    getState:()=>srjState
  });
});