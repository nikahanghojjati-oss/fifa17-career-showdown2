(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedJourneyReconnect=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const STATUS_ID="sharedJourneyReconnectStatus";
  const ACTION_ID="sharedJourneyReconnectAction";
  const NEW_CODE_ACTION_ID="sharedJourneyReconnectNewCode";
  const DEPENDENCIES=Object.freeze([
    ["ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression],
    ["ssjr-journey-reconnect-protocol","js/sharedJourneyReconnect.js",()=>root.CareerModeSharedJourneyReconnect],
    ["ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup],
    ["ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression],
    ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining],
    ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry]
  ]);
  let installed=false,busy=false,state=null,protocol=null,setupApi=null,multiApi=null,remoteApi=null,accountApi=null,pairingApi=null,rivalryApi=null,unsubscribeRemote=null,refreshPromise=null,contextKey="";
  let lastReportedCode="";
  // A progression read can be denied for one poll right after a fresh session or a close while the
  // rivalry catches up; that check retries itself, so it is reported only if the same failure repeats.
  let heldTransientCode="";
  // Hunt 1018 (H1018-4): going offline bumps the generation, so a refresh still awaiting its reads cannot publish over OFFLINE_HOLD.
  let pjrGeneration=0;

  function pjrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pjrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pjrSharedMarker(){const showdown=pjrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pjrMarkerRivalry(){return String(pjrShowdown()?.sharedJourney?.rivalryId||"").trim();}
  function pjrSetupPending(){const journey=pjrShowdown()?.sharedJourney;return Boolean(journey&&journey.mode==="shared"&&journey.setupPending===true);}
  function pjrPrePairShell(){return Boolean(pjrSetupPending()&&!pjrMarkerRivalry());}
  function pjrSetupPresentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function pjrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pjrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)pjrFail("JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
  async function pjrEnsureDependencies(){
    const resolved={};for(const [key,path,ready] of DEPENDENCIES)resolved[key]=await pjrLoad(key,path,ready);
    const factory=resolved["ssjr-journey-reconnect-protocol"];
    if(!factory||typeof factory.createProtocol!=="function")pjrFail("JOURNEY_RECONNECT_PROTOCOL_UNAVAILABLE");
    protocol=protocol||factory.createProtocol({multiSeasonModule:resolved["ssjr-multi-season-protocol"]});
    setupApi=resolved["ssjr-production-setup"];multiApi=resolved["ssjr-production-multi-season"];remoteApi=resolved.rj;accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;
    if(typeof setupApi?.refresh!=="function"||typeof setupApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SETUP_UNAVAILABLE");
    if(typeof multiApi?.refresh!=="function"||typeof multiApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_PROGRESSION_UNAVAILABLE");
    if(typeof remoteApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UNAVAILABLE");
    return true;
  }
  function pjrCurrentIdentity(){
    const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
    const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),rivalryId=String(rivalry?.rivalryId||"").trim(),managerRole=rivalry?.binding?.managerRole;
    if(!account?.connected||!accountId)pjrFail("JOURNEY_RECONNECT_AUTH_REQUIRED");
    if(!device?.registered||!deviceId)pjrFail("JOURNEY_RECONNECT_DEVICE_REQUIRED");
    if(!rivalry?.attached||!rivalryId||!rivalry?.binding)pjrFail("JOURNEY_RECONNECT_RIVALRY_REQUIRED");
    if(managerRole!=="playerOne"&&managerRole!=="playerTwo")pjrFail("JOURNEY_RECONNECT_ROLE_INVALID");
    const marker=pjrMarkerRivalry();if(marker&&marker!==rivalryId)pjrFail("JOURNEY_RECONNECT_RIVALRY_MISMATCH");
    return Object.freeze({rivalryId,accountId,deviceId,managerRole});
  }
  async function pjrResolveIdentity(){
    if(typeof accountApi?.initialize==="function")await accountApi.initialize();
    if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
    if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
    if(pjrPrePairShell()&&!rivalryApi?.getState?.()?.attached)return null;
    return pjrCurrentIdentity();
  }
  function pjrSameAuthority(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.accountId===b.accountId&&a.deviceId===b.deviceId&&a.managerRole===b.managerRole);}
  function pjrExactActive(remote,authority,now){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&now<expiry);}
  // Hunt 1018 (H1018-4): after each awaited read, a refresh that went offline or whose account, device or rivalry changed stops.
  function pjrAssertCurrent(generation,authority){if(generation!==pjrGeneration||!pjrOnline())pjrFail("JOURNEY_RECONNECT_SUPERSEDED");if(!pjrSameAuthority(pjrCurrentIdentity(),authority))pjrFail("JOURNEY_RECONNECT_CONTEXT_CHANGED");}
  function pjrPreviousFor(authority){
    if(!state)return null;
    if(state.rivalryId!==authority.rivalryId||state.accountId!==authority.accountId||state.deviceId!==authority.deviceId||state.managerRole!==authority.managerRole){state=null;contextKey="";return null;}
    return state;
  }
  function pjrRemoteSnapshot(){const remote=remoteApi?.getState?.();return remote&&typeof remote==="object"?remote:null;}
  function pjrStatusElement(){
    if(!root.document)return null;let node=root.document.getElementById(STATUS_ID);if(node)return node;
    const app=root.document.getElementById("app");if(!app)return null;
    node=root.document.createElement("div");node.id=STATUS_ID;node.className="stateNote hidden";node.setAttribute("role","status");node.setAttribute("aria-live","polite");node.dataset.sharedJourneyReconnect="true";
    const header=root.document.getElementById("topHeader");if(header?.parentNode===app)header.insertAdjacentElement("afterend",node);else app.prepend(node);return node;
  }
  // Job 31: say who does what, in the order Daniel and Nik actually reconnect (the first manager hosts, the second joins).
  function pjrManagerName(role){const name=pjrShowdown()?.managers?.[role];return String(name||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function pjrReconnectStep(role){return role==="playerTwo"?`Tap RECONNECT SESSION, paste the new code from ${pjrManagerName("playerOne")} and tap JOIN PRIVATE SESSION.`:`Tap RECONNECT SESSION, then HOST PRIVATE SESSION and send the new code to ${pjrManagerName("playerTwo")}.`;}
  // BH-11 (#1): a reload drops the page-memory session code, so this phone simply has no session. That is not an ended
  // session; say so plainly. Kept about as short as the ended-session line so the banner does not reflow the game screens;
  // where the other phone takes the new code is said in the Remote Joining panel.
  function pjrNotConnectedStep(role){const other=pjrManagerName(role==="playerTwo"?"playerOne":"playerTwo");return `Tap RECONNECT SESSION, then HOST and send the code to ${other}, or JOIN ${other}'s new code.`;}
  function pjrShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_){return false;}}
  function pjrMessage(value){
    if(!value)return "";
    if(value.phase==="FRESH_SESSION_REQUIRED"&&pjrShowdownClosed())return "SHOWDOWN COMPLETE · Open the Final Winner or History from Home.";
    if(value.phase==="OFFLINE_HOLD")return "OFFLINE · Reconnect before continuing this shared Showdown.";
    if(value.phase==="RECOVERY_PENDING")return "RECONNECTING · Finish reconnecting both players before continuing.";
    if(value.phase==="FRESH_SESSION_REQUIRED"&&!value.sessionId)return `NOT CONNECTED ON THIS PHONE · A reload ends the session. ${pjrNotConnectedStep(value.managerRole)}`;
    if(value.phase==="FRESH_SESSION_REQUIRED")return `NEW CONNECTION NEEDED · ${value.resumable?"Your Showdown is saved; the connection ended":"The connection ended"} (sessions last up to 4 hours). ${pjrReconnectStep(value.managerRole)}`;
    if(value.phase==="TERMINAL_RECOVERED")return `SHARED JOURNEY RECOVERED · ALL ${value.totalSeasons} SEASONS STAY COMPLETE · Reconnecting cannot add another season.`;
    if(value.phase==="ACTIVE_RECOVERED")return `SHARED JOURNEY RECOVERED · SEASON ${value.activeSeason} OF ${value.totalSeasons} · League, clubs and accepted history resumed without reset or redraw.`;
    return "SHARED JOURNEY RECOVERY STATE UNAVAILABLE";
  }
  // Job 31: after RECONNECT SESSION the Remote Joining panel stayed open over the game once the fresh session was ACTIVE.
  // It now closes itself as soon as this page holds an exact unexpired ACTIVE session, and the banner re-checks at once.
  let recoveryReturnUnsubscribe=null;
  function pjrRemoteExactActive(remote){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry);}
  function pjrArmRecoveryReturn(exceptSessionId=null){
    if(typeof recoveryReturnUnsubscribe==="function")recoveryReturnUnsubscribe();recoveryReturnUnsubscribe=null;
    if(typeof remoteApi?.subscribe!=="function")return false;
    recoveryReturnUnsubscribe=remoteApi.subscribe(next=>{
      if(!pjrRemoteExactActive(next)||(exceptSessionId&&next.sessionId===exceptSessionId))return;
      const stop=recoveryReturnUnsubscribe;recoveryReturnUnsubscribe=null;if(typeof stop==="function")stop();
      try{remoteApi.closePanel?.();}catch(_error){}
      void pjrRefresh();
    });
    return true;
  }
  async function pjrOpenSessionRecovery(){
    try{await pjrEnsureDependencies();if(typeof remoteApi?.openPanel!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Private session recovery is unavailable.");if(!pjrRemoteExactActive(pjrRemoteSnapshot()))pjrArmRecoveryReturn();await remoteApi.openPanel();return true;}catch(error){pjrReport("Unable to open private session recovery",error);return false;}
  }
  // BH-11 (#1): open Remote Joining from a phone that still holds an ACTIVE session; the panel closes once a different
  // (fresh) session is ACTIVE, never because the old one still is.
  async function pjrOpenFreshSessionCode(){
    try{await pjrEnsureDependencies();if(typeof remoteApi?.openPanel!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Private session recovery is unavailable.");const held=pjrRemoteSnapshot();pjrArmRecoveryReturn(pjrRemoteExactActive(held)?held.sessionId:null);await remoteApi.openPanel();return true;}catch(error){pjrReport("Unable to open private session recovery",error);return false;}
  }
  function pjrRender(){
    const node=pjrStatusElement();if(!node)return false;const visible=pjrSharedMarker()&&Boolean(state);node.classList.toggle("hidden",!visible);if(!visible){node.replaceChildren();return false;}const text=pjrMessage(state);node.replaceChildren(root.document.createTextNode(text));if((state.phase==="FRESH_SESSION_REQUIRED"&&!pjrShowdownClosed())||state.phase==="RECOVERY_PENDING"){const action=root.document.createElement("button");action.id=ACTION_ID;action.type="button";action.className="compactButton";action.textContent=state.phase==="FRESH_SESSION_REQUIRED"?"RECONNECT SESSION":"RESOLVE SESSION";action.disabled=busy;action.addEventListener("click",()=>{void pjrOpenSessionRecovery();});node.append(root.document.createTextNode(" "),action);}else if(state.phase==="ACTIVE_RECOVERED"){/* BH-11 (#1): this phone may still hold the session the other phone lost; let it take the other phone's new code. */const fresh=root.document.createElement("button");fresh.id=NEW_CODE_ACTION_ID;fresh.type="button";fresh.className="compactButton";fresh.textContent="NEW SESSION CODE";fresh.disabled=busy;fresh.addEventListener("click",()=>{void pjrOpenFreshSessionCode();});node.append(root.document.createTextNode(" "),fresh);}node.dataset.recoveryPhase=state.phase;node.dataset.authoritative=state.activeAuthorization?"true":"false";return true;
  }
  function pjrPublish(next){
    state=next||null;contextKey=state?`${state.accountId}|${state.deviceId}|${state.rivalryId}`:"";pjrRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-journey-reconnect-state-change",{detail:state?{phase:state.phase,rivalryId:state.rivalryId,managerRole:state.managerRole,activeAuthorization:state.activeAuthorization,resumable:state.resumable,recovered:state.recovered,acceptedSeasons:state.acceptedSeasons,activeSeason:state.activeSeason,totalSeasons:state.totalSeasons,terminal:state.terminal,sessionChanged:state.sessionChanged}:null}));}catch(_error){}
    return state;
  }
  function pjrOnline(){return !root.navigator||root.navigator.onLine!==false;}
  function pjrOfflineHold(){
    pjrGeneration+=1;
    if(!state||!protocol)return pjrPublish(null);
    try{
      const authority={rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole};
      return pjrPublish(protocol.observe({authority,previous:state,nowEpochMs:Date.now(),networkOnline:false,remote:null}));
    }catch(error){pjrReport("Unable to hold Shared Journey offline",error);return pjrPublish(null);}
  }
  // Hunt 1018 (H1018-3): losing account, device or rivalry authority after recovery keeps the durable plan and history but
  // publishes a non-authoritative state (recovered and activeAuthorization false) until the identity is verified again.
  function pjrDropAuthority(){
    if(!state?.activeAuthorization||!protocol)return state;
    try{return pjrPublish(protocol.observe({authority:{rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole},previous:state,nowEpochMs:Date.now(),networkOnline:pjrOnline(),remote:null}));}
    catch(error){pjrReport("Unable to drop Shared Journey authority",error);return pjrPublish(null);}
  }
  async function pjrRefreshNow(){
    const generation=pjrGeneration;
    if(!pjrSharedMarker())return pjrPublish(null);
    if(pjrSetupPending()&&pjrSetupPresentationActive())return pjrPublish(null);
    await pjrEnsureDependencies();
    if(!pjrOnline())return pjrOfflineHold();
    const authority=await pjrResolveIdentity();if(!authority)return pjrPublish(null);const previous=pjrPreviousFor(authority),remote=pjrRemoteSnapshot();
    const now=Date.now(),base={authority,previous,nowEpochMs:now,networkOnline:true,remote};
    const remoteExpiry=Number(remote?.expiresAtEpochMs);
    const exactActive=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(remoteExpiry)&&now<remoteExpiry);
    if(!exactActive)return pjrPublish(protocol.observe(base));
    if(!previous)return pjrPublish(null);
    const setupResult=await setupApi.refresh(),setupState=setupApi.getState();
    pjrAssertCurrent(generation,authority);
    const sameSetupContext=Boolean(setupResult&&setupState&&setupState.ready===true&&setupState.rivalryId===authority.rivalryId&&setupState.sessionId===remote.sessionId);
    if(sameSetupContext&&pjrSetupPending()&&(!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"))return pjrPublish(null);
    if(!sameSetupContext||!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"||setupState.setup.revision!==6)pjrFail("JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED");
    const progressionResult=await multiApi.refresh(),progressionView=multiApi.getState();
    pjrAssertCurrent(generation,authority);
    if(!progressionResult||!progressionView||progressionView.authoritative!==true||progressionView.rivalryId!==authority.rivalryId||!progressionView.state){const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now(),latestExpiry=Number(latestRemote?.expiresAtEpochMs),latestExactActive=Boolean(latestRemote&&latestRemote.sessionState==="active"&&latestRemote.sessionId&&latestRemote.rivalryId===authority.rivalryId&&latestRemote.accountId===authority.accountId&&latestRemote.deviceId===authority.deviceId&&latestRemote.pendingAction==null&&Number.isFinite(latestExpiry)&&latestNow<latestExpiry);if(!latestExactActive)return pjrPublish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));pjrFail("JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE",`Shared Journey recovery could not verify season progress (${String(multiApi?.lastError?.()||"NO_PROGRESSION_VIEW")}). The private session is active; this check retries automatically.`);}
    // Hunt 1018 (H1018-5): recovered authority is claimed only for the same exact session, still unexpired after the reads.
    const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now();
    if(!pjrExactActive(latestRemote,authority,latestNow))return pjrPublish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));
    if(latestRemote.sessionId!==remote.sessionId)return state;
    return pjrPublish(protocol.observe({...base,nowEpochMs:latestNow,remote:latestRemote,setup:setupState.setup,progression:progressionView.state}));
  }
  // A new Showdown setup or a lagging progression read can fail for one poll; report only when the same failure repeats.
  const PJR_HELD_CODES=Object.freeze(["JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE","JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED"]);
  // Account, device or rivalry authority not resolved yet (reload, startup, provider transition) is a quiet pending state:
  // the banner cannot speak for an unresolved identity, and the next poll or wake re-checks. Role/rivalry mismatches still report.
  const PJR_PENDING_AUTHORITY_CODES=Object.freeze(["JOURNEY_RECONNECT_AUTH_REQUIRED","JOURNEY_RECONNECT_DEVICE_REQUIRED","JOURNEY_RECONNECT_RIVALRY_REQUIRED"]);
  function pjrRefresh(){
    if(refreshPromise)return refreshPromise;busy=true;
    const run=pjrRefreshNow().then(value=>{lastReportedCode="";heldTransientCode="";return value;},error=>{if(error?.code==="JOURNEY_RECONNECT_SUPERSEDED"){heldTransientCode="";return pjrOnline()?state:pjrOfflineHold();}if(PJR_PENDING_AUTHORITY_CODES.includes(error?.code)||error?.code==="JOURNEY_RECONNECT_CONTEXT_CHANGED"){heldTransientCode="";return pjrDropAuthority();}const code=`${String(accountApi?.getState?.()?.accountId||"")}|${String(pairingApi?.getState?.()?.deviceId||"")}|${String(pjrMarkerRivalry()||"")}|${String(error?.code||"JOURNEY_RECONNECT_FAILED")}|${String(multiApi?.lastError?.()||"")}`;if(PJR_HELD_CODES.includes(error?.code)&&code!==heldTransientCode&&code!==lastReportedCode){heldTransientCode=code;return state;}heldTransientCode="";if(code!==lastReportedCode)pjrReport("Unable to refresh Shared Journey recovery",error);lastReportedCode=code;return state;}).finally(()=>{busy=false;if(refreshPromise===run)refreshPromise=null;pjrRender();});refreshPromise=run;return run;
  }
  function pjrWake(){if(busy||!pjrSharedMarker()||root.document?.visibilityState==="hidden")return;void pjrRefresh();}
  function pjrInstall(){
    if(installed)return true;installed=true;void pjrEnsureDependencies().then(()=>{
      if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>pjrWake());
      pjrWake();
    }).catch(error=>pjrReport("Shared Journey recovery bootstrap unavailable",error));
    root.addEventListener?.("online",pjrWake);
    root.addEventListener?.("offline",()=>pjrOfflineHold());
    root.addEventListener?.("career-mode-shared-setup-state-change",pjrWake);
    root.addEventListener?.("career-mode-shared-season-cursor-change",pjrWake);
    root.addEventListener?.("career-mode-connected-account-state-change",pjrWake);
    root.document?.addEventListener?.("visibilitychange",pjrWake);
    if(typeof root.setInterval==="function")root.setInterval(pjrWake,POLL_MS);
    if(typeof root.setTimeout==="function")root.setTimeout(pjrWake,0);
    return true;
  }

  return Object.freeze({
    contractVersion:1,feature:"ssjr-production-shared-journey-reconnect",productionEnabled:true,runtimeRevision:"1.9.1-r14",pollIntervalMs:POLL_MS,
    sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,freshRuntimeRequiresReauthorization:true,
    dualManagerStatusVisible:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
    install:pjrInstall,refresh:pjrRefresh,openSessionRecovery:pjrOpenSessionRecovery,openFreshSessionCode:pjrOpenFreshSessionCode,getState:()=>state,isRecovered:()=>Boolean(state?.recovered&&state?.activeAuthorization),isBusy:()=>busy
  });
});