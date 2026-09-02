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
  const srjScriptPromises=new Map();
  const srjListeners=new Set();
  let srjState=srjFreeze({status:"idle",open:false,busy:false,sessionId:null,rivalryId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,message:"Remote Joining is private and action-only. No session request has been sent."});

  function srjFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(srjFreeze);
    return value;
  }
  function srjError(code,message){const error=new Error(message||code);error.code=code;return error;}
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
    if(!accountState||accountState.connected!==true||!accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_REQUIRED","Sign in with Google from Save Library before starting or joining a private session.");
    if(!pairing||typeof pairing.initialize!=="function"||typeof pairing.getState!=="function")throw srjError("REMOTE_JOINING_DEVICE_UNAVAILABLE","Registered-device authority is unavailable.");
    await pairing.initialize();
    const pairingState=pairing.getState();
    if(!pairingState||pairingState.registered!==true||!pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_REQUIRED","Register this browser from Save Library before using Remote Joining.");
    if(!rivalry||typeof rivalry.initialize!=="function"||typeof rivalry.getState!=="function")throw srjError("REMOTE_JOINING_RIVALRY_UNAVAILABLE","Connected Rivalry authority is unavailable.");
    await rivalry.initialize();
    const rivalryState=rivalry.getState();
    if(!rivalryState||rivalryState.attached!==true||!rivalryState.rivalryId)throw srjError("REMOTE_JOINING_RIVALRY_REQUIRED","Attach the exact paired Connected Rivalry from Save Library before using Remote Joining.");
    const services=await runtime.ensureAccountServices();
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)throw srjError("REMOTE_JOINING_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable. Local Career Mode remains available.");
    const user=services.auth.currentUser;
    if(!user||user.uid!==accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_MISMATCH","The current Google account no longer matches the Connected Account authority.");
    if(rivalryState.accountId&&rivalryState.accountId!==user.uid)throw srjError("REMOTE_JOINING_RIVALRY_ACCOUNT_MISMATCH","The attached Connected Rivalry belongs to a different account.");
    if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_MISMATCH","The attached Connected Rivalry belongs to a different registered browser identity.");
    return Object.freeze({protocol,services,user,deviceId:pairingState.deviceId,rivalryId:rivalryState.rivalryId});
  }
  function srjOperationOptions(context,sessionId){
    return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,deviceId:context.deviceId,rivalryId:context.rivalryId,sessionId,nowEpochMs:Date.now(),cryptoImpl:root.crypto};
  }
  function srjFailureMessage(result,fallback){
    if(result&&result.code==="resource-exhausted")return "Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; local Career Mode remains available.";
    if(result&&typeof result.message==="string"&&result.message.trim())return result.message.trim();
    return fallback;
  }
  function srjHasNonterminalSession(){return !!srjState.sessionId&&["open","active"].includes(srjState.sessionState);}
  function srjAcceptResult(result,context,role,message){
    return srjSetState({status:"ready",busy:false,sessionId:result.sessionId,rivalryId:context.rivalryId,role,sessionState:result.state,revision:result.revision,expiresAtEpochMs:result.expiresAtEpochMs,message});
  }
  async function srjHostSession(){
    if(srjHasNonterminalSession())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Revoke or close the current private session before hosting another."};
    srjSetState({status:"hosting",busy:true,message:"Creating an exact private session capability…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.generateSessionId(root.crypto);
      const result=await context.protocol.openSession(srjOperationOptions(context,sessionId));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_HOST_FAILED",srjFailureMessage(result,"Private session could not be opened."));
      srjAcceptResult(result,context,"host","Private session is open. Share the full code directly with the other paired manager. It is kept only in this page's memory.");
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be opened."} No local save was changed.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_HOST_FAILED",message:error&&error.message||"Private session could not be opened."};}
  }
  async function srjJoinSession(value){
    if(srjHasNonterminalSession())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Revoke or close the current private session before joining another."};
    srjSetState({status:"joining",busy:true,message:"Joining the exact private session…"});
    try{
      const context=await srjResolveContext();
      const sessionId=context.protocol.normalizeSessionId(value);
      const result=await context.protocol.joinSession(srjOperationOptions(context,sessionId));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_JOIN_FAILED",srjFailureMessage(result,"Private session could not be joined."));
      srjAcceptResult(result,context,"peer","Private session is active with exactly the two paired rivalry accounts. Local gameplay remains unchanged.");
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be joined."} No local save was changed.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message:error&&error.message||"Private session could not be joined."};}
  }
  async function srjRefreshSession(){
    const remembered=srjState.sessionId;
    if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"No private session code is held in page memory."};
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
    srjSetState({status:"closing",busy:true,message:"Closing the exact active private session…"});
    try{
      const context=await srjResolveContext();
      const result=await context.protocol.closeSession(srjOperationOptions(context,remembered));
      if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_CLOSE_FAILED",srjFailureMessage(result,"Private session could not be closed."));
      srjAcceptResult(result,context,srjState.role||"member","Private session is closed terminally. Its code remains only in page memory until you forget it or reload.");
      return result;
    }catch(error){srjSetState({status:"error",busy:false,message:`${error&&error.message?error.message:"Private session could not be closed."} Local Career Mode remains available.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_CLOSE_FAILED",message:error&&error.message||"Private session could not be closed."};}
  }
  function srjForgetSession(){return srjSetState({status:"idle",busy:false,sessionId:null,rivalryId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,message:"Private session code forgotten from page memory. No provider state was changed."});}
  async function srjCopySessionCode(){
    if(!srjState.sessionId)return false;
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
    intro.append(srjCreate("span","remoteJoiningEyebrow","PRIVATE SESSION · EXACT CAPABILITY ONLY"),srjCreate("h2","","REMOTE JOINING"),srjCreate("p","","No lobby, listing or public discovery. Session services resolve only when you press Host, Join, Refresh or Close. The exact session code is memory-only and disappears on reload."));
    body.appendChild(intro);
    const grid=srjCreate("div","remoteJoiningGrid");
    const host=srjCreate("section","remoteJoiningCard");
    host.append(srjCreate("span","remoteJoiningStep","01 · HOST"),srjCreate("h3","","OPEN PRIVATE SESSION"),srjCreate("p","","Creates a fresh 256-bit capability for the currently attached two-manager Connected Rivalry."));
    const hostButton=srjCreate("button","menuButton","HOST PRIVATE SESSION");hostButton.type="button";hostButton.disabled=srjState.busy||srjHasNonterminalSession();hostButton.addEventListener("click",()=>{void srjHostSession();});host.appendChild(hostButton);
    const join=srjCreate("section","remoteJoiningCard");
    join.append(srjCreate("span","remoteJoiningStep","02 · JOIN"),srjCreate("h3","","JOIN EXACT SESSION"),srjCreate("p","","Paste the full code shared directly by the other already-paired manager."));
    const input=srjCreate("input","remoteJoiningInput");input.type="text";input.placeholder="session_…";input.autocomplete="off";input.autocapitalize="none";input.spellcheck=false;input.setAttribute("aria-label","Exact private session code");
    const joinButton=srjCreate("button","menuButton","JOIN PRIVATE SESSION");joinButton.type="button";joinButton.disabled=srjState.busy||srjHasNonterminalSession();joinButton.addEventListener("click",()=>{void srjJoinSession(input.value);});join.append(input,joinButton);grid.append(host,join);body.appendChild(grid);
    const current=srjCreate("section","remoteJoiningCurrent");
    current.append(srjCreate("span","remoteJoiningEyebrow","CURRENT PAGE-MEMORY SESSION"));
    if(srjState.sessionId){
      current.append(srjCreate("strong","remoteJoiningState",`${String(srjState.sessionState||"unknown").toUpperCase()} · REV ${Number.isInteger(srjState.revision)?srjState.revision:"—"} · ${srjState.role||"member"}`));
      const code=srjCreate("code","remoteJoiningCode",srjState.sessionId);current.appendChild(code);
      const meta=srjCreate("p","remoteJoiningMeta",`Rivalry ${srjShort(srjState.rivalryId)}${Number.isFinite(srjState.expiresAtEpochMs)?` · expires ${new Date(srjState.expiresAtEpochMs).toLocaleTimeString()}`:""}`);current.appendChild(meta);
      const actions=srjCreate("div","remoteJoiningActions");
      const copy=srjCreate("button","compactButton","COPY CODE");copy.type="button";copy.disabled=srjState.busy;copy.addEventListener("click",async()=>{copy.textContent=await srjCopySessionCode()?"COPIED":"COPY MANUALLY";});
      const refresh=srjCreate("button","compactButton","REFRESH / READ");refresh.type="button";refresh.disabled=srjState.busy;refresh.addEventListener("click",()=>{void srjRefreshSession();});
      const revoke=srjCreate("button","compactButton","REVOKE OPEN SESSION");revoke.type="button";revoke.disabled=srjState.busy||srjState.sessionState!=="open";revoke.addEventListener("click",()=>{void srjRevokeSession();});
      const close=srjCreate("button","compactButton","CLOSE SESSION");close.type="button";close.disabled=srjState.busy||srjState.sessionState!=="active";close.addEventListener("click",()=>{void srjCloseSession();});
      const forget=srjCreate("button","compactButton","FORGET CODE");forget.type="button";forget.disabled=srjState.busy||srjHasNonterminalSession();forget.addEventListener("click",srjForgetSession);actions.append(copy,refresh,revoke,close,forget);current.appendChild(actions);
    }else current.append(srjCreate("p","remoteJoiningEmpty","No session capability is held in page memory."));
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

  return srjFreeze({
    contractVersion:1,
    feature:"stage5e-production-private-remote-joining-runtime",
    productionRulesPublished:true,
    providerIdentity:"standard-firebase-request-auth-uid",
    authPersistence:"browserSessionPersistence",
    registeredDeviceAuthority:"account-owned-mutation-metadata",
    exactCapabilityBits:256,
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
    hostSession:srjHostSession,
    joinSession:srjJoinSession,
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
