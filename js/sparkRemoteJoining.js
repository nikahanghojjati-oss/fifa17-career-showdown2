(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkRemoteJoining=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // r87 (2.0.0 plain-words sweep): a provider or JS message reaches the connection panel only when it reads as words.
  function srjPlain(error,fallback){const m=error&&error.message;return m&&!/\b\w+(?:[-_/]\w+)+\b|[(){}]|undefined|null|Error|Firebase|permission|[a-z][A-Z]/.test(m)?m:fallback;}

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
  const srjEndedRivalryIds=new Set();
  // Hunt 1018 (H1018-1): one replacement (end the held session, then host or join) runs at a time; it is taken before any await.
  let srjReplaceAction=null;
  const srjScriptPromises=new Map();
  const srjListeners=new Set();
  let srjState=srjFreeze({status:"idle",open:false,busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,auto:null,waitRetry:false,message:"Not connected yet. Nothing has been sent."});

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
    if(!runtime||typeof runtime.ensureAccountServices!=="function")throw srjError("REMOTE_JOINING_RUNTIME_UNAVAILABLE","Private Firebase runtime is unavailable.");
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
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)throw srjError("REMOTE_JOINING_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable.");
    const user=services.auth.currentUser;
    if(!user||user.uid!==accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_MISMATCH","The current Google account no longer matches the Connected Account authority.");
    if(rivalryState.accountId&&rivalryState.accountId!==user.uid)throw srjError("REMOTE_JOINING_RIVALRY_ACCOUNT_MISMATCH","The attached Connected Rivalry belongs to a different account.");
    if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_MISMATCH","The attached Connected Rivalry belongs to a different registered browser identity.");
    return Object.freeze({protocol,services,user,accountId:user.uid,deviceId:pairingState.deviceId,rivalryId:rivalryState.rivalryId});
  }
  // r87 W3-6 (clock proof lane): the Rules take a session's createdAt and lastActivityAt only inside [server - 5 min,
  // server + 1 min] and its expiresAt only up to server + 4 h, so a phone whose clock ran 2 minutes fast or 5 minutes slow
  // could never host or join (tests/firebase/r87-device-clock-skew-emulator.cjs). Session writes now use server time: this
  // phone's offset from a freshly issued ID token (issuedAtTime is the server's clock), measured at the request midpoint.
  // Date.now()+offset keeps running while the phone sleeps. Re-measured every 10 minutes; if it cannot be measured (offline,
  // no token) the phone's own clock is used, as before. Costs no Firestore read. Reads and expiry checks use the same offset.
  const SRJ_CLOCK_REFRESH_MS=10*60*1000;
  let srjClock={known:false,offsetMs:0,at:0};
  function srjClockNow(){return Date.now()+(srjClock.known?srjClock.offsetMs:0);}
  async function srjServerNow(user){
    if(srjClock.known&&Math.abs(Date.now()-srjClock.at)<SRJ_CLOCK_REFRESH_MS)return srjClockNow();
    try{
      if(user&&typeof user.getIdTokenResult==="function"){
        const sent=Date.now(),token=await user.getIdTokenResult(true),got=Date.now();
        const issued=Date.parse(String(token&&token.issuedAtTime||""));
        if(Number.isFinite(issued)&&issued>0&&got>=sent&&got-sent<30000){
          const server=issued+(issued%1000===0?500:0);
          srjClock={known:true,offsetMs:server-Math.round((sent+got)/2),at:got};
        }
      }
    }catch(_error){}
    return srjClockNow();
  }
  function srjOperationOptions(context,sessionId){
    return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,deviceId:context.deviceId,rivalryId:context.rivalryId,sessionId,nowEpochMs:srjClockNow(),cryptoImpl:root.crypto};
  }
  async function srjWriteOptions(context,sessionId){return {...srjOperationOptions(context,sessionId),nowEpochMs:await srjServerNow(context.user)};}
  function srjFailureMessage(result,fallback){
    if(result&&result.code==="resource-exhausted")return "Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; try again later.";
    if(result&&typeof result.message==="string"&&result.message.trim())return result.message.trim();
    return fallback;
  }
  function srjExpiredByClock(){const expiresAt=Number(srjState.expiresAtEpochMs);return Boolean(srjState.sessionId&&Number.isFinite(expiresAt)&&srjClockNow()>=expiresAt);}
  function srjHasNonterminalSession(){return !!srjState.sessionId&&["open","active"].includes(srjState.sessionState)&&!srjExpiredByClock();}
  function srjSessionBlocksStart(){return srjHasNonterminalSession()||!!srjState.pendingAction||srjState.sessionState==="unresolved";}
  // BH-11 (#1): after a reload the other phone loses its page-memory code while this phone still holds the old session, so
  // HOST and JOIN were dead here. This page may end its OWN confirmed session (close an ACTIVE one, revoke an OPEN one it
  // hosts) and then host or join a fresh one. Unresolved or pending capabilities are never replaced.
  function srjHeldSessionReplaceable(){return srjHasNonterminalSession()&&!srjState.pendingAction&&!srjState.busy&&(srjState.sessionState==="active"||(srjState.sessionState==="open"&&srjState.role==="host"));}
  async function srjEndHeldSession(){
    if(!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"The current connection cannot be replaced right now."};
    let context;
    try{context=await srjResolveContext();}
    catch(error){const message=`${srjPlain(error,"Could not check the connection.")} Your current connection was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REPLACE_FAILED",message};}
    if(!srjPendingContextMatches(context)){const message="The current private session belongs to a different Google account, browser or Showdown, so it was not replaced.";srjSetState({status:"error",busy:false,message});return {ok:false,code:"REMOTE_JOINING_REPLACE_CONTEXT_CHANGED",message};}
    const result=srjState.sessionState==="active"?await srjCloseSession():await srjRevokeSession();
    if(!result||result.ok!==true)return result||{ok:false,code:"REMOTE_JOINING_REPLACE_FAILED",message:"Could not end the connection. Try again."};
    return srjSessionBlocksStart()?{ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Could not end the connection. Try again."}:{ok:true};
  }
  function srjAcceptResult(result,context,role,message){
    return srjSetState({status:"ready",busy:false,sessionId:result.sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role,sessionState:result.state,revision:result.revision,expiresAtEpochMs:result.expiresAtEpochMs,pendingAction:null,capabilityCopyAllowed:true,auto:result.state==="open"?srjState.auto:null,message});
  }
  function srjPendingContextMatches(context){
    return !!context&&context.rivalryId===srjState.rivalryId&&context.accountId===srjState.accountId&&context.deviceId===srjState.deviceId;
  }
  function srjPendingFailure(error,action){
    const message=srjPlain(error,"No answer from the online server.");
    srjSetState({status:"recovery-pending",busy:false,pendingAction:action,capabilityCopyAllowed:false,message:`${message} Tap the RETRY button below to try again. Your Showdown was not changed.`});
    return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_PENDING",message,recoverable:true,pendingAction:action};
  }
  // BH-11 (#10): a host or join write is refused when the phone clock is minutes off server time (the Rules check createdAt and
  // lastActivityAt against request.time), which used to surface as a raw permission error.
  const SRJ_CLOCK_HINT=" If the code is right, check that your phone's date and time are set automatically; a phone clock that is several minutes off is refused.";
  function srjRejectionMessage(error,action){
    if((action==="host"||action==="join")&&srjErrorCode(error)==="permission-denied")return `The connection was refused.${SRJ_CLOCK_HINT}`;
    return srjPlain(error,"The connection was refused. Try again.");
  }
  function srjClearRejectedPending(error,action){
    const message=srjRejectionMessage(error,action);
    if(action==="close"){
      srjSetState({status:"error",busy:false,pendingAction:null,capabilityCopyAllowed:true,message:`${message} You are still connected and your Showdown was not changed.`});
    }else{
      srjSetState({status:"error",busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:`${message} Your Showdown was not changed.`});
    }
    return {ok:false,code:error&&error.code||`REMOTE_JOINING_${String(action).toUpperCase()}_FAILED`,message,recoverable:false};
  }
  async function srjAttemptPending(context){
    const action=srjState.pendingAction;
    const sessionId=srjState.sessionId;
    if(!action||!sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
    if(!srjPendingContextMatches(context)){
      srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:"This sign-in changed since the last try. Close this panel and connect again."});
      return {ok:false,code:"REMOTE_JOINING_RECOVERY_CONTEXT_CHANGED",message:"This sign-in changed since the last try. Close this panel and connect again.",recoverable:true,pendingAction:action};
    }
    srjSetState({status:`retrying-${action}`,busy:true,capabilityCopyAllowed:false,message:"Connecting again…"});
    try{
      let result;
      if(action==="host")result=await context.protocol.openSession({...await srjWriteOptions(context,sessionId),ttlMs:SRJ_HOST_TTL_MS});
      else if(action==="join")result=await context.protocol.joinSession(await srjWriteOptions(context,sessionId));
      else if(action==="close")result=await context.protocol.closeSession(await srjWriteOptions(context,sessionId));
      else throw srjError("REMOTE_JOINING_RECOVERY_ACTION_INVALID","The unresolved private-session action is invalid.");
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_RECOVERY_FAILED",srjFailureMessage(result,"Private-session recovery could not be confirmed."));
      if(action==="host"){srjAcceptResult(result,context,"host",result.replayed?"Private session recovery confirmed the original host capability. No duplicate session was created.":"Private session is open. Share the full code directly with the other paired manager. It is kept only in this page's memory.");srjWatchForJoin(result.sessionId);}
      else if(action==="join")srjAcceptResult(result,context,"peer",result.replayed?"Private session recovery confirmed the original join on the same capability.":"Private session is active with exactly the two paired rivalry accounts.");
      else srjAcceptResult(result,context,srjState.role||"member",result.replayed?"Private session recovery confirmed the original terminal close on the same capability.":"Private session is closed terminally. Its code remains only in page memory until you forget it or reload.");
      return result;
    }catch(error){
      if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,action);
      return srjClearRejectedPending(error,action);
    }
  }
  function srjHostWaitingForJoin(sessionId){return Boolean(sessionId&&srjState.sessionId===sessionId&&srjState.role==="host"&&srjState.sessionState==="open"&&!srjState.pendingAction&&!srjExpiredByClock());}
  function srjWatchForJoin(sessionId,startedAt=Date.now(),generation=srjWaitGeneration){
    if(!root.document||typeof root.setTimeout!=="function"||!srjHostWaitingForJoin(sessionId))return false;
    if(srjJoinWatchTimer!==null){if(srjJoinWatchSessionId===sessionId)return false;if(typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);}
    srjJoinWatchSessionId=sessionId;
    const timer=root.setTimeout(async()=>{
      if(srjJoinWatchTimer!==timer)return;
      srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
      if(generation!==srjWaitGeneration||!srjHostWaitingForJoin(sessionId))return;
      if(Date.now()-startedAt>SRJ_JOIN_WATCH_LIMIT_MS){srjPauseWait();return;}
      if(!srjState.busy&&root.document.visibilityState!=="hidden"){
        await srjCheckForJoin(sessionId,generation);
      }
      if(generation===srjWaitGeneration)srjWatchForJoin(sessionId,startedAt,generation);
    },SRJ_JOIN_WATCH_MS);
    srjJoinWatchTimer=timer;
    return true;
  }
  async function srjCheckForJoin(sessionId,generation){
    try{
      root.CareerModeFirestoreBudget?.wantFresh?.();
      const context=await srjResolveContext();
      if(generation!==srjWaitGeneration||!srjPendingContextMatches(context)||!srjHostWaitingForJoin(sessionId))return;
      const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
      if(generation===srjWaitGeneration&&srjHostWaitingForJoin(sessionId)&&!srjState.busy&&result&&result.ok===true&&result.state!=="open")srjAcceptResult(result,context,"host",result.state==="active"?"The other manager joined. Private session is active with exactly the two paired rivalry accounts.":`Private session refreshed at revision ${result.revision}.`);
    }catch(_error){}
  }
  async function srjRetryPendingOperation(){
    if(srjRetireEnded())return {ok:false,code:"REMOTE_JOINING_SHOWDOWN_ENDED",message:srjState.message};
    if(!srjState.pendingAction||!srjState.sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
    if(srjState.busy)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
    try{return await srjAttemptPending(await srjResolveContext());}
    catch(error){
      if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,srjState.pendingAction);
      srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:`${srjPlain(error,"Could not check the connection.")} Try again in a moment.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_CONTEXT_UNAVAILABLE",message:srjPlain(error,"Could not check the connection."),recoverable:true,pendingAction:srjState.pendingAction};
    }
  }
  function srjReplaceBusy(){return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};}
  function srjReplaceHeld(start){srjReplaceAction=(async()=>{const ended=await srjEndHeldSession();return ended.ok?await start():ended;})().finally(()=>{srjReplaceAction=null;});return srjReplaceAction;}
  async function srjHostSession(options={}){
    if(srjReplaceAction)return srjReplaceBusy();
    if(srjSessionBlocksStart()){
      if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Finish or end the current connection first."};
      return srjReplaceHeld(srjStartHost);
    }
    return srjStartHost();
  }
  async function srjStartHost(){
    srjSetState({status:"hosting",busy:true,message:"Connecting…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.generateSessionId(root.crypto);
      srjSetState({status:"hosting",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"host",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"host",capabilityCopyAllowed:false,message:"Connecting…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="host"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"host");
      if(srjState.pendingAction==="host")return srjClearRejectedPending(error,"host");
      srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not connect. Try again.")} Your Showdown was not changed.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_HOST_FAILED",message:srjPlain(error,"Could not connect. Try again.")};
    }
  }
  async function srjJoinSession(value,options={}){
    if(srjReplaceAction)return srjReplaceBusy();
    if(srjSessionBlocksStart()){
      // BH-11 (#1): only an ACTIVE session may be ended to join a fresh code; an OPEN hosted one keeps the existing guard.
      if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable()||srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Finish or end the current connection first."};
      srjReplaceAction=(async()=>{
        let nextSessionId;
        try{const deps=await srjEnsureDependencies();nextSessionId=deps["standard-auth-session"].normalizeSessionId(value);}
        catch(error){const message=`${srjPlain(error,"That code does not work. Check it and try again.")} Your current connection was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message};}
        if(nextSessionId===srjState.sessionId){const message="This phone is already in that private session.";srjSetState({message});return {ok:false,code:"REMOTE_JOINING_SAME_SESSION",message};}
        const ended=await srjEndHeldSession();return ended.ok?await srjStartJoin(value):ended;
      })().finally(()=>{srjReplaceAction=null;});
      return srjReplaceAction;
    }
    return srjStartJoin(value);
  }
  async function srjStartJoin(value){
    srjSetState({status:"joining",busy:true,message:"Connecting…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.normalizeSessionId(value);
      srjSetState({status:"joining",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"peer",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"join",capabilityCopyAllowed:false,message:"Connecting…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="join"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"join");
      if(srjState.pendingAction==="join")return srjClearRejectedPending(error,"join");
      srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not connect. Try again.")} Your Showdown was not changed.`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message:srjPlain(error,"Could not connect. Try again.")};
    }
  }
  async function srjRefreshSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"There is no code to use yet."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before reading the session."};
    srjSetState({status:"refreshing",busy:true,message:"Checking the connection…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.readSession(srjOperationOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_READ_FAILED",srjFailureMessage(result,"Could not check the connection. Try again."));
      const clockNote=result.expiredByClock?" The provider expiry boundary has passed; no automatic mutation was performed.":"";
      srjAcceptResult(result,context,srjState.role||"member",`Private session refreshed at revision ${result.revision}.${clockNote}`);
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not check the connection. Try again.")}`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_READ_FAILED",message:srjPlain(error,"Could not check the connection. Try again.")};}
  }
  async function srjRevokeSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"There is no code to use yet."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before revoking the session."};
    if(srjState.sessionState!=="open")return {ok:false,code:"REMOTE_JOINING_REVOKE_NOT_OPEN",message:"Only an open host session can be revoked before peer join."};
    srjSetState({status:"revoking",busy:true,message:"Cancelling the code…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.revokeSession(await srjWriteOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_REVOKE_FAILED",srjFailureMessage(result,"Could not cancel the code. Try again."));
      srjAcceptResult(result,context,"host","Private session is revoked terminally. It can no longer be joined; forget the code when ready.");
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not cancel the code. Try again.")} Try again.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REVOKE_FAILED",message:srjPlain(error,"Could not cancel the code. Try again.")};}
  }
  async function srjCloseSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"There is no code to use yet."};
    if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before closing the session."};
    if(srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_CLOSE_NOT_ACTIVE",message:"There is no connection to end."};
    try{
      const context=await srjResolveContext();
      srjSetState({status:"closing",busy:true,accountId:context.accountId,deviceId:context.deviceId,pendingAction:"close",capabilityCopyAllowed:false,message:"Ending the connection…"});
      return await srjAttemptPending(context);
    }catch(error){
      if(srjState.pendingAction==="close"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"close");
      if(srjState.pendingAction==="close")return srjClearRejectedPending(error,"close");
      srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not end the connection. Try again.")}`});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_CLOSE_FAILED",message:srjPlain(error,"Could not end the connection. Try again.")};
    }
  }
  function srjForgetSession(){
    if(srjState.pendingAction||srjState.sessionState==="unresolved")return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Wait for the connection to finish first."};
    return srjSetState({status:"idle",busy:false,auto:null,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"Code cleared. Your Showdown was not changed."});
  }
  async function srjCopySessionCode(){
    if(!srjState.sessionId||srjState.capabilityCopyAllowed!==true||srjState.pendingAction)return false;
    try{if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){await root.navigator.clipboard.writeText(srjState.sessionId);return true;}}catch(_error){}
    return false;
  }
  // Studio Z3: the exact session lives in page memory only, so a refresh (Transfer, setup, anywhere) used to drop this
  // phone on Home and CONTINUE CAREER opened the code screen while the other phone was still in the game. A refreshed or
  // reopened tab now re-attaches through the pair's session pointer below; the session itself is still never stored.
  // Studio Z4: every new game day Daniel had to host and send Nik a long session code to paste. The two paired accounts now
  // share one pointer, rivalries/{rivalryId}/sessionOffers/current, which only they can read (Rules) and only the session's
  // host can point at their own open or active session. Daniel's phone hosts and publishes it; Nik's phone reads it and
  // joins; either phone re-attaches to it after a closed tab. The manual code controls stay behind USE A SESSION CODE
  // for accounts that are not permanently paired (r79 PR3: a paired account has no USE A SESSION CODE path).
  const SRJ_OFFER_POLL_MS=3000,SRJ_OFFER_POLL_LIMIT_MS=10*60*1000,SRJ_OFFER_MIN_LIFE_MS=60*1000;
  let srjAutoPromise=null,srjOfferTimer=null,srjPublishTimer=null,srjPublishRetry=null;
  let srjWaitGeneration=0,srjResumePromise=null;
  function srjOfferRef(context){return context.services.firestoreSdk.doc(context.services.firestore,"rivalries",context.rivalryId,"sessionOffers","current");}
  // r79 gallery (Nik's JOIN after a deleted Showdown): the pointer is what a waiting phone polls for, so the budget layer must
  // not answer it from a copy. With any healthy wait-point listener on the page (the previous Showdown's shared setup kept one)
  // a background check reused documents for 60 s, so Nik read "no offer" for a minute after Daniel had published his session.
  // wantFresh(path) keeps this one document on the 2 s coalescing window: one read per 3 s poll, the cadence it always had.
  function srjOfferFromSnapshot(snapshot){
    if(!snapshot||typeof snapshot.exists!=="function")throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
    const exists=snapshot.exists();
    if(exists===false)return null;
    if(exists!==true)throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
    const data=snapshot.data(),expiresAt=data?.expiresAt?.toMillis?.();
    if(!data||data.schemaVersion!==1||typeof data.sessionId!=="string"||!data.sessionId||typeof data.hostAccountId!=="string"||!data.hostAccountId||!Number.isFinite(expiresAt))throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
    return Object.freeze({sessionId:data.sessionId,hostAccountId:data.hostAccountId,expiresAtEpochMs:expiresAt});
  }
  async function srjReadOffer(context){
    root.CareerModeFirestoreBudget?.wantFresh?.(`rivalries/${context.rivalryId}/sessionOffers/current`);
    const sdk=context.services.firestoreSdk;
    return sdk.runTransaction(context.services.firestore,async transaction=>srjOfferFromSnapshot(await transaction.get(srjOfferRef(context))));
  }
  // Absence, a session this account is not a member of (an older pairing's account), and terminal/expired sessions are
  // positive answers. All other failures keep the pointer unresolved.
  async function srjReadSession(context,sessionId){
    const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
    if(result?.ok===false&&["PRIVATE_SESSION_NOT_FOUND","PRIVATE_SESSION_MEMBER_REQUIRED"].includes(result.code))return null;
    if(!result||result.ok!==true||result.sessionId!==sessionId||!["open","active","closed","revoked","expired"].includes(result.state))throw srjError("REMOTE_JOINING_SESSION_UNREADABLE");
    if(["closed","revoked","expired"].includes(result.state))return null;
    if(!Number.isFinite(result.expiresAtEpochMs))throw srjError("REMOTE_JOINING_SESSION_UNREADABLE");
    return result.expiredByClock===true||result.expiresAtEpochMs<=srjClockNow()?null:result;
  }
  let srjConnectReadPending=false;
  // JOB-1 F1: retry the exact failed read at 0, 3 and 9 seconds. Hidden pages pause for the existing wake/retry path.
  async function srjConnectRead(read){
    for(let attempt=0;attempt<3;attempt++){
      if(root.document?.visibilityState==="hidden")break;
      try{
        const result=await read();
        if(root.document?.visibilityState==="hidden")break;
        return result;
      }catch(_error){
        if(attempt===2||root.document?.visibilityState==="hidden"||typeof root.setTimeout!=="function")break;
        await new Promise(resolve=>root.setTimeout(resolve,3000*(attempt+1)));
      }
    }
    throw srjError("REMOTE_JOINING_READ_UNAVAILABLE");
  }
  async function srjWriteOffer(context){
    if(!srjState.sessionId||srjState.role!=="host"||!["open","active"].includes(srjState.sessionState)||!Number.isFinite(srjState.expiresAtEpochMs))return false;
    try{
      const sessionId=srjState.sessionId,guard=await srjOfferReplacement(context,sessionId);
      return guard.outcome==="ours"||(!guard.outcome&&await srjCommitOffer(context,sessionId,guard.seen)==="written");
    }catch(_error){return false;}
  }
  function srjHostsByDefault(){const identity=root.CareerModeOnlinePlayerIdentity&&typeof root.CareerModeOnlinePlayerIdentity.getState==="function"?root.CareerModeOnlinePlayerIdentity.getState():null;return Boolean(identity&&identity.managerId==="daniel");}
  function srjRivalName(){return srjHostsByDefault()?"NIK":"DANIEL";}
  async function srjAdopt(context,sessionId,role,joinOpen,generation=srjWaitGeneration,retryRead=false){
    const read=()=>srjReadSession(context,sessionId);
    const result=await (retryRead?srjConnectRead(read):read());
    if(generation!==srjWaitGeneration||!result)return null;
    if(result.state==="active"){srjAcceptResult(result,context,role,"Connected to your Showdown again.");return {ok:true,kind:"resumed"};}
    if(result.state!=="open")return null;
    if(role==="host"){srjOfferConfirmed=sessionId;srjAcceptResult(result,context,"host",`Waiting for ${srjRivalName()==="NIK"?"Nik":"Daniel"} to open the game.`);srjSetState({auto:"waiting"});srjWatchForJoin(sessionId);return {ok:true,kind:"hosting"};}
    if(!joinOpen)return null;
    const joined=await srjStartJoin(sessionId);
    return joined&&joined.ok===true?{ok:true,kind:"joined"}:null;
  }
  function srjStopOfferWait(){if(srjOfferTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjOfferTimer);srjOfferTimer=null;}
  function srjPauseWait(message=srjState.message){
    srjSetState({auto:"waiting",waitRetry:true,message});
  }
  async function srjCheckForOffer(generation){
    try{
      const context=await srjResolveContext(),offer=await srjReadOffer(context);
      if(generation===srjWaitGeneration&&offer&&offer.hostAccountId!==context.accountId&&offer.expiresAtEpochMs>srjClockNow()+SRJ_OFFER_MIN_LIFE_MS&&srjState.auto==="waiting"&&!srjState.busy&&!srjHasNonterminalSession()){
        const adopted=await srjAdopt(context,offer.sessionId,"peer",true,generation);
        if(adopted){srjSetState({auto:null,waitRetry:false});return;}
      }
    }catch(_error){}
  }
  function srjWaitForOffer(startedAt=Date.now(),generation=srjWaitGeneration){
    srjStopOfferWait();
    if(typeof root.setTimeout!=="function")return;
    const timer=root.setTimeout(async()=>{
      if(srjOfferTimer!==timer)return;
      srjOfferTimer=null;
      if(generation!==srjWaitGeneration||srjHasNonterminalSession()||srjState.auto!=="waiting")return;
      if(Date.now()-startedAt>SRJ_OFFER_POLL_LIMIT_MS){srjPauseWait();return;}
      if(!srjState.busy&&(!root.document||root.document.visibilityState!=="hidden"))await srjCheckForOffer(generation);
      if(generation===srjWaitGeneration&&!srjHasNonterminalSession()&&srjState.auto==="waiting")srjWaitForOffer(startedAt,generation);
    },SRJ_OFFER_POLL_MS);
    srjOfferTimer=timer;
  }
  // JOB-1 F2: a wake or retry owns one immediate read and a new ten-minute window. Retired callbacks cannot re-arm it.
  // Codex #974: an offer publish retry whose own window ran out while asleep gets a fresh window too.
  function srjResumeWait(){
    if(srjResumePromise)return srjResumePromise;
    if(root.document?.visibilityState==="hidden"||srjState.busy||srjState.pendingAction||srjAutoPromise)return Promise.resolve(false);
    if(srjConnectReadPending)return srjAutoConnect();
    const sessionId=srjHostWaitingForJoin(srjState.sessionId)?srjState.sessionId:null;
    if(!sessionId&&(srjState.auto!=="waiting"||srjHasNonterminalSession()))return Promise.resolve(false);
    const generation=++srjWaitGeneration,startedAt=Date.now();
    srjStopOfferWait();
    if(srjJoinWatchTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);
    srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
    srjSetState({waitRetry:false});
    srjResumePromise=(async()=>{
      if(sessionId){
        await srjCheckForJoin(sessionId,generation);
        if(generation===srjWaitGeneration){srjWatchForJoin(sessionId,startedAt,generation);if(srjHostWaitingForJoin(sessionId)&&srjOfferConfirmed!==sessionId&&(!srjPublishRetry||Date.now()-srjPublishRetry.startedAt>SRJ_OFFER_POLL_LIMIT_MS)&&srjPermanentlyPaired())srjRetryOfferPublish(sessionId);}
      }else{
        await srjCheckForOffer(generation);
        if(generation===srjWaitGeneration&&srjState.auto==="waiting"&&!srjHasNonterminalSession())srjWaitForOffer(startedAt,generation);
      }
      return true;
    })().finally(()=>{srjResumePromise=null;});
    return srjResumePromise;
  }
  // Codex #904 (release review): a permanently paired account has no USE A SESSION CODE path, so when Daniel's session is
  // open but the pointer write fails, "send Nik this session code" was a dead end: Nik's phone only ever reads the pointer.
  // Daniel keeps waiting and this page publishes the pointer again (3 s, doubling to once a minute, visible tab only, 10 min
  // like Nik's own wait, sooner when the browser comes back online) until it lands or the session stops waiting for a join.
  // Codex #920: each try first reads the pointer. Naming this session ends the retry with no write (a write whose answer
  // was lost). Naming another session that the server does not positively report as gone or over
  // means no write (a newer screen of Daniel's may own the game, and Nik must not be sent back to this one); the retry
  // keeps checking in case that session ends. This session must still read OPEN, and a stale or missing pointer is replaced
  // only if it is still the one just read. Reopening the player panel restarts a retry that gave up.
  let srjOfferConfirmed=null;
  // Codex #920: the host's join watch has its own 10 min limit, so it starts afresh whenever the pointer lands or publishing
  // restarts; otherwise Nik could join after it ended and Daniel's screen would stay on WAITING until a reload.
  function srjRewatchForJoin(sessionId){if(srjJoinWatchTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);srjJoinWatchTimer=null;srjJoinWatchSessionId=null;const watching=srjWatchForJoin(sessionId);if(watching)srjSetState({waitRetry:false});return watching;}
  function srjStopPublishRetry(){if(srjPublishTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjPublishTimer);srjPublishTimer=null;srjPublishRetry=null;}
  async function srjOfferReplacement(context,sessionId){
    const seen=await srjReadOffer(context);
    if(seen?.sessionId===sessionId)return {seen,outcome:"ours"};
    // Even a short-lived or stale pointer may name a live session. Only a positive session read permits replacement.
    if(seen&&await srjReadSession(context,seen.sessionId))return {seen,outcome:"taken"};
    return {seen,outcome:null};
  }
  async function srjCommitOffer(context,sessionId,seen){
    if(!srjPendingContextMatches(context)||srjState.sessionId!==sessionId||srjState.role!=="host")return "stop";
    const sdk=context.services.firestoreSdk;
    const value={schemaVersion:1,sessionId,hostAccountId:context.accountId,expiresAt:sdk.Timestamp.fromMillis(srjState.expiresAtEpochMs),updatedAt:sdk.serverTimestamp()};
    root.CareerModeFirestoreBudget?.wantFresh?.(`rivalries/${context.rivalryId}/sessionOffers/current`);
    return sdk.runTransaction(context.services.firestore,async transaction=>{
      const current=srjOfferFromSnapshot(await transaction.get(srjOfferRef(context)));
      if((current?current.sessionId:null)!==(seen?seen.sessionId:null))return "retry";
      transaction.set(srjOfferRef(context),value);return "written";
    });
  }
  async function srjPublishIfStillOurs(context,sessionId){
    const guard=await srjOfferReplacement(context,sessionId);
    if(guard.outcome)return guard.outcome;
    // This session itself must still be open on the server before Nik is pointed at it.
    const own=await srjReadSession(context,sessionId);
    if(!own)return "stop";
    if(own.state==="active"){if(srjHostWaitingForJoin(sessionId))srjAcceptResult(own,context,"host","The other manager joined. Private session is active with exactly the two paired rivalry accounts.");return "stop";}
    if(!(own.expiresAtEpochMs>srjClockNow()+SRJ_OFFER_MIN_LIFE_MS)||!srjHostWaitingForJoin(sessionId))return "stop";
    return srjCommitOffer(context,sessionId,guard.seen);
  }
  function srjRetryOfferPublish(sessionId,startedAt=Date.now(),attempt=0){
    srjStopPublishRetry();
    if(typeof root.setTimeout!=="function")return false;
    srjPublishRetry={sessionId,startedAt};
    const timer=root.setTimeout(async()=>{
      if(srjPublishTimer!==timer)return;
      srjPublishTimer=null;
      if(!srjHostWaitingForJoin(sessionId)){srjPublishRetry=null;return;}
      if(Date.now()-startedAt>SRJ_OFFER_POLL_LIMIT_MS){srjPublishRetry=null;if(srjState.message!=="Your game is open on another screen. Carry on there.")srjSetState({message:"Nik's phone could not be reached. Check your connection, then open the game again."});return;}
      if(!srjState.busy&&(!root.document||root.document.visibilityState!=="hidden")){
        try{
          const context=await srjResolveContext();
          if(srjPublishTimer!==null)return;  // the browser came back online meanwhile and restarted the retry
          if(!srjPendingContextMatches(context)){srjPublishRetry=null;return;}  // another account or Showdown now: not ours to publish
          const outcome=await srjPublishIfStillOurs(context,sessionId);
          if(outcome==="ours"||outcome==="written"){srjOfferConfirmed=sessionId;srjPublishRetry=null;if(srjState.message==="Your game is open on another screen. Carry on there.")srjSetState({message:"Waiting for Nik to open the game."});srjRewatchForJoin(sessionId);return;}
          if(outcome==="taken"){if(srjHostWaitingForJoin(sessionId)&&srjState.message!=="Your game is open on another screen. Carry on there.")srjSetState({message:"Your game is open on another screen. Carry on there."});}
          if(outcome==="stop"){srjPublishRetry=null;return;}
        }catch(_error){}
      }
      if(srjPublishTimer===null&&srjPublishRetry&&srjPublishRetry.sessionId===sessionId)srjRetryOfferPublish(sessionId,startedAt,attempt+1);
    },Math.min(SRJ_OFFER_POLL_MS*2**attempt,60*1000));
    srjPublishTimer=timer;
    return true;
  }
  async function srjAutoConnectOnce(){
    srjRetireEnded();
    if(srjState.busy||srjState.pendingAction||srjReplaceAction)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
    let context;
    try{context=await srjResolveContext();}catch(error){srjSetState({auto:null});return {ok:false,code:error&&error.code||"REMOTE_JOINING_CONTEXT_UNAVAILABLE",message:srjPlain(error,"Connecting is not available right now. Try again.")};}
    if(srjHasNonterminalSession()&&srjPendingContextMatches(context)){
      if(srjState.sessionState==="active")srjSetState({auto:null});
      else if(srjHostWaitingForJoin(srjState.sessionId)&&srjOfferConfirmed!==srjState.sessionId&&!srjPublishRetry&&srjPermanentlyPaired()){srjSetState({auto:"waiting",message:"Waiting for Nik to open the game."});srjRewatchForJoin(srjState.sessionId);srjRetryOfferPublish(srjState.sessionId);return {ok:true,kind:"held-publishing"};}
      if(srjHostWaitingForJoin(srjState.sessionId))srjRewatchForJoin(srjState.sessionId);
      return {ok:true,kind:"held"};
    }
    srjSetState({auto:"connecting",waitRetry:false,message:"Connecting to your Showdown…"});
    const offer=await srjConnectRead(()=>srjReadOffer(context));
    if(offer){
      const mine=offer.hostAccountId===context.accountId;
      const adopted=await srjAdopt(context,offer.sessionId,mine?"host":"peer",!mine,srjWaitGeneration,true);
      if(adopted){srjConnectReadPending=false;if(adopted.kind!=="hosting")srjSetState({auto:null});return adopted;}
    }
    srjConnectReadPending=false;
    if(srjHostsByDefault()){
      const hosted=await srjStartHost();
      if(hosted&&hosted.ok===true&&srjState.role==="host"&&srjState.sessionId){
        const published=await srjWriteOffer(context);
        if(published)srjOfferConfirmed=srjState.sessionId;
        if(published||srjPermanentlyPaired()){
          srjSetState({auto:"waiting",message:"Waiting for Nik to open the game."});
          if(!published)srjRetryOfferPublish(srjState.sessionId);
          return {ok:true,kind:published?"hosted":"hosted-publishing"};
        }
        srjSetState({auto:null,message:"Send Nik this session code to connect."});
        return {ok:true,kind:"hosted-manual"};
      }
      srjSetState({auto:null});
      return hosted||{ok:false,code:"REMOTE_JOINING_HOST_FAILED",message:"Could not connect. Try again."};
    }
    srjSetState({auto:"waiting",message:"Waiting for Daniel to open the game."});
    srjWaitForOffer();
    return {ok:true,kind:"waiting"};
  }
  function srjAutoConnect(){
    if(srjAutoPromise)return srjAutoPromise;
    if(!srjHasNonterminalSession()&&!srjState.busy&&!srjState.pendingAction)srjSetState({auto:"connecting",message:"Connecting to your Showdown…"});
    srjAutoPromise=srjAutoConnectOnce().catch(error=>{
      if(error?.code==="REMOTE_JOINING_READ_UNAVAILABLE"){srjConnectReadPending=true;srjPauseWait("Could not connect. Try again.");}
      else srjSetState({auto:null});
      return {ok:false,code:error&&error.code||"REMOTE_JOINING_AUTO_FAILED",message:srjPlain(error,"Could not connect. Try again.")};
    }).finally(()=>{srjAutoPromise=null;});
    return srjAutoPromise;
  }
  function srjPermanentlyPaired(){try{const partner=root.CareerModePersistentNikDanielPair?.getPartnerState?.(),account=root.CareerModeSparkConnectedAccount?.getState?.();return Boolean(partner&&partner.status==="ready"&&partner.record&&partner.record.active===true&&account&&partner.accountId===account.accountId);}catch(_error){return false;}}
  function srjUseManualCode(){if(srjPermanentlyPaired())return srjState;srjStopOfferWait();return srjSetState({auto:null});}
  function srjRenderAuto(body){
    const waiting=srjState.auto==="waiting",retry=waiting&&srjState.waitRetry;
    const intro=srjCreate("div","remoteJoiningIntro");
    intro.append(srjCreate("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),srjCreate("h2","",waiting?`WAITING FOR ${srjRivalName()}`:"CONNECTING"),srjCreate("p","",retry?srjState.message:waiting?`Your game is ready. It continues by itself as soon as ${srjRivalName()==="NIK"?"Nik":"Daniel"} opens Career Mode Showdown and taps CONTINUE CAREER.`:"Connecting Daniel and Nik to the same game. This takes a moment."));
    body.appendChild(intro);
    if(retry){const actions=srjCreate("div","remoteJoiningActions"),button=srjCreate("button","compactButton","TRY AGAIN");button.type="button";button.disabled=srjState.busy;button.addEventListener("click",()=>{void srjResumeWait();});actions.appendChild(button);body.appendChild(actions);}
    // r79 PR3: a permanently paired account connects through the pair's session pointer only, so the manual USE A SESSION CODE
    // path is gone for it. An account that is not (yet) permanently paired keeps it as the fallback.
    if(!srjPermanentlyPaired()){
      const actions=srjCreate("div","remoteJoiningActions");
      const manual=srjCreate("button","compactButton","USE A SESSION CODE");manual.type="button";manual.disabled=srjState.busy;manual.addEventListener("click",srjUseManualCode);actions.appendChild(manual);
      body.appendChild(actions);
    }
    const note=srjCreate("p","remoteJoiningStatus",srjState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.appendChild(note);
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
    if(srjState.auto){srjRenderAuto(body);return overlay;}
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
      current.append(srjCreate("p","remoteJoiningMeta","If the other phone still shows the game, it takes your new code from NEW CODE on its game banner, or from Home > CONTINUE CAREER > CONNECTED."));
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
  // Codex #904 (P2): an unresolved request (a host, join or close whose answer was lost) belongs to one Showdown. Once the
  // pair layer reports that Showdown ended (deleted on the other phone, or finished and let go on Home), the request is
  // moot: it is retired here so the next Showdown's auto-connect is not blocked as busy until a reload. No read, no write.
  function srjRetireEnded(){if(srjState.busy||!srjState.rivalryId||!srjEndedRivalryIds.has(srjState.rivalryId)||!(srjState.pendingAction||srjState.sessionState==="unresolved"))return false;srjStopPublishRetry();srjSetState({status:"idle",busy:false,auto:null,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"That Showdown has ended, so its unfinished connection was let go. Your Showdown was not changed."});return true;}
  function srjOnPairEnded(event){const rivalryId=String(event&&event.detail&&event.detail.closedRivalryId||"");if(!/^pair_[0-9a-f]{64}$/.test(rivalryId))return;srjEndedRivalryIds.add(rivalryId);if(srjRetireEnded())try{srjRenderPanel();}catch(_error){}}
  if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-permanent-pair-ended",srjOnPairEnded);
  function srjOnOnline(){if(srjState.pendingAction&&!srjState.busy)void srjRetryPendingOperation();if(srjPublishRetry)srjRetryOfferPublish(srjPublishRetry.sessionId,srjPublishRetry.startedAt);void srjResumeWait();}
  if(root&&typeof root.addEventListener==="function")root.addEventListener("online",srjOnOnline);
  if(root.document&&typeof root.document.addEventListener==="function")root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState!=="hidden")void srjResumeWait();});
  // r79 PR3: the partner record can land while this panel is open (Daniel records his first real pairing alongside his
  // auto-continue), so the open panel re-renders and USE A SESSION CODE goes away. No read: render only.
  if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-permanent-pair-change",()=>{try{srjRenderPanel();}catch(_error){}});

  return srjFreeze({
    contractVersion:1,
    feature:"stage5e-production-private-remote-joining-runtime",
    productionRulesPublished:true,
    providerIdentity:"standard-firebase-request-auth-uid",
    authPersistence:"browserSessionPersistence",
    registeredDeviceAuthority:"account-owned-mutation-metadata",
    exactCapabilityBits:256,
    hostSessionTtlMs:SRJ_HOST_TTL_MS,
    clockNow:srjClockNow,
    serverNow:srjServerNow,
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
    autoConnect:srjAutoConnect,
    useManualCode:srjUseManualCode,
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