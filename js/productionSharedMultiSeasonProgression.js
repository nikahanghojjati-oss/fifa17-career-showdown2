(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedMultiSeasonProgression=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const ACTION_ID="sharedMultiSeasonContinueAction";
  const STATUS_ID="sharedMultiSeasonProgressionStatus";
  let installed=false,busy=false,provider=null,setupApi=null,historyApi=null,view=null,contextKey="",refreshPromise=null,exposedRivalryId="",exposedSeason=0;

  function pmspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pmspShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pmspSharedMarker(){const showdown=pmspShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pmspField(id){return root.document&&root.document.getElementById(id);}
  function pmspText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pmspHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pmspDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pmspReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pmspLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pmspEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pmspLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pmspLoadScript("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence);
    await pmspLoadScript("ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression);
    await pmspLoadScript("ssjr-multi-season-provider","js/sparkSharedMultiSeasonProgression.js",()=>root.CareerModeSparkSharedMultiSeasonProgression);
    await pmspLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;historyApi=root.CareerModeProductionSharedHistoryConvergence;provider=root.CareerModeSparkSharedMultiSeasonProgression;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pmspFail("MULTI_SEASON_SETUP_UNAVAILABLE");
    if(!historyApi||typeof historyApi.refresh!=="function"||typeof historyApi.getState!=="function")pmspFail("MULTI_SEASON_HISTORY_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function")pmspFail("MULTI_SEASON_PROVIDER_UNAVAILABLE");
  }
  function pmspSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function pmspRivalryId(){const showdown=pmspShowdown(),setup=pmspSetupState();return String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();}
  function pmspEnsureCursor(){
    if(!pmspSharedMarker())return null;
    const rivalryId=pmspRivalryId();if(!rivalryId)return null;
    if(exposedRivalryId!==rivalryId){exposedRivalryId=rivalryId;exposedSeason=1;view=null;contextKey="";}
    if(!Number.isInteger(exposedSeason)||exposedSeason<1)exposedSeason=1;
    return exposedSeason;
  }
  function pmspFallbackSeason(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=10?n:null;}
  function pmspResolveSeason(fallback=null){
    const local=pmspFallbackSeason(fallback??pmspShowdown()?.currentRound);if(!pmspSharedMarker())return local;
    const rivalryId=pmspRivalryId(),authoritative=Boolean(view&&view.ok===true&&view.authoritative===true&&view.state&&String(view.rivalryId||"")===rivalryId);
    return authoritative?(pmspEnsureCursor()||local):local;
  }
  function pmspRequest(){
    const showdown=pmspShowdown(),rivalryId=pmspRivalryId(),saveId=String(showdown?.id||showdown?.saveId||"").trim();
    if(!pmspSharedMarker()||!rivalryId)return null;pmspEnsureCursor();return Object.freeze({rivalryId,key:`${saveId||"shared"}|${rivalryId}|multi-season`});
  }
  function pmspContextMatches(request){const current=pmspRequest();return Boolean(request&&current&&request.key===current.key);}
  async function pmspProviderOptions(request){
    if(!request||!pmspContextMatches(request))pmspFail("MULTI_SEASON_CONTEXT_STALE");
    const setup=pmspSetupState();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId||!setup.accountId||!setup.managerRole)pmspFail("MULTI_SEASON_SETUP_NOT_CONFIRMED");
    if(String(setup.rivalryId)!==request.rivalryId)pmspFail("MULTI_SEASON_RIVALRY_MISMATCH");
    const services=await root.CareerModeProductionFirebaseRuntime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pmspFail("MULTI_SEASON_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    if(services.auth.currentUser.uid!==setup.accountId)pmspFail("MULTI_SEASON_AUTHORITY_MISMATCH");
    return Object.freeze({user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,nowEpochMs:Date.now()});
  }
  function pmspResult(result){if(result&&result.ok===true&&result.authoritative===true&&result.state)return result;const error=new Error("Shared Multi Season progression could not be verified.");error.code=result?.code||"MULTI_SEASON_PROVIDER_FAILED";throw error;}
  function pmspScreenVisible(){const screen=pmspField("seasonEntry"),review=pmspField("seasonReviewPanel");return Boolean(screen&&!screen.classList.contains("hidden")&&review&&!review.classList.contains("hidden"));}
  function pmspHistoryWitnessed(){
    if(!pmspScreenVisible())return false;const season=pmspEnsureCursor(),history=historyApi?.getState?.(),panel=pmspField("sharedHistoryConvergencePanel");
    return Boolean(season&&history&&history.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&Number(history.throughSeason)===season&&history.projection?.acceptedSeasons===season&&panel&&!panel.classList.contains("hidden"));
  }
  function pmspCanContinue(){
    const season=pmspEnsureCursor(),state=view?.state;if(!season||!state||state.terminal||!pmspHistoryWitnessed())return false;
    return Number.isInteger(state.acceptedSeasons)&&state.acceptedSeasons>=season&&season<state.totalSeasons;
  }
  function pmspTerminalWitnessed(){const season=pmspEnsureCursor(),state=view?.state;return Boolean(season&&state?.terminal===true&&state.acceptedSeasons===state.totalSeasons&&season===state.totalSeasons&&pmspHistoryWitnessed());}
  function pmspEnsureUi(){
    const review=pmspField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
    let status=pmspField(STATUS_ID);if(!status){status=root.document.createElement("p");status.id=STATUS_ID;status.className="seasonReviewWarning sharedMultiSeasonProgressionStatus hidden";actions.parentNode.insertBefore(status,actions);}
    let action=pmspField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton hidden";action.type="button";actions.prepend(action);}
    return {status,action};
  }
  function pmspRender(){
    const ui=pmspEnsureUi();if(!ui)return false;const season=pmspEnsureCursor(),state=view?.state,visible=Boolean(pmspSharedMarker()&&season&&state&&pmspScreenVisible()&&Number.isInteger(state.acceptedSeasons)&&state.acceptedSeasons>=season);
    pmspHidden(ui.status,!visible);pmspHidden(ui.action,!visible);if(!visible)return false;
    if(pmspTerminalWitnessed()){
      pmspText(ui.status,`ALL ${state.totalSeasons} SEASONS ARE AUTHORITIVELY ACCEPTED · FINAL RECONCILIATION REMAINS A SEPARATE STEP`);pmspText(ui.action,"SEASON PLAN COMPLETE ✓");pmspDisable(ui.action,true);return true;
    }
    if(pmspHistoryWitnessed()){
      const next=season+1;pmspText(ui.status,`SEASON ${season} HISTORY IS CONVERGED ON THIS DEVICE · CONTINUE ONCE TO SEASON ${next}`);pmspText(ui.action,`CONTINUE TO SEASON ${next}`);pmspDisable(ui.action,!pmspCanContinue());return true;
    }
    pmspText(ui.status,`SEASON ${season} IS ACCEPTED · SHARED HISTORY REVIEW MUST BE VISIBLE BEFORE ADVANCING`);pmspText(ui.action,"WAITING FOR SHARED HISTORY REVIEW");pmspDisable(ui.action,true);return true;
  }
  async function pmspRefreshNow(request=pmspRequest()){
    if(!request||!pmspSharedMarker())return null;await pmspEnsureDependencies();if(!pmspContextMatches(request))return null;
    await setupApi.refresh();if(!pmspContextMatches(request))return null;
    const result=pmspResult(await provider.read(await pmspProviderOptions(request)));if(!pmspContextMatches(request))return null;
    if(result.runtimeRevision!=="1.9.1-r13"||String(result.rivalryId)!==request.rivalryId||!["SEASON_READY","SHOWDOWN_COMPLETE"].includes(result.phase)||result.state.runtimeRevision!=="1.9.1-r13"||result.state.rivalryId!==request.rivalryId)pmspFail("MULTI_SEASON_PROJECTION_INVALID");
    view=result;contextKey=request.key;const cursor=pmspEnsureCursor();if(cursor>result.state.acceptedSeasons+1)pmspFail("MULTI_SEASON_CURSOR_AHEAD_OF_AUTHORITY");pmspRender();return view;
  }
  function pmspRefresh(){const request=pmspRequest();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;busy=true;const current=pmspRefreshNow(request).catch(error=>{if(pmspContextMatches(request))pmspReport("Unable to refresh Shared Multi Season progression",error);return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;pmspRender();});refreshPromise=current;return current;}
  async function pmspAdvance(){
    if(busy||!pmspCanContinue())return false;const request=pmspRequest();if(!request)return false;const state=view.state,season=pmspEnsureCursor();
    if(season>=state.totalSeasons)return false;exposedSeason=season+1;pmspRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-season-cursor-change",{detail:{rivalryId:request.rivalryId,previousSeason:season,activeSeason:exposedSeason,acceptedSeasons:state.acceptedSeasons}}));}catch(_error){}
    if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false});return true;
  }
  function pmspCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!pmspSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;void pmspAdvance();}
  function pmspWake(){if(busy||!pmspSharedMarker()||root.document?.visibilityState==="hidden")return;void pmspRefresh();}
  function pmspInstall(){if(installed)return true;installed=true;if(root.document)root.document.addEventListener("click",pmspCapture,true);for(const event of ["career-mode-shared-history-convergence-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change"]){root.addEventListener?.(event,pmspWake);}root.document?.addEventListener?.("visibilitychange",pmspWake);if(typeof root.setInterval==="function")root.setInterval(pmspWake,POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pmspWake,0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-multi-season-progression",productionEnabled:true,runtimeRevision:"1.9.1-r13",supportedLengths:Object.freeze([1,3,5,10]),requiresHistoryConvergence:true,requiresVisibleHistoryWitnessBeforeAdvance:true,exactOnceLocalCursor:true,replaysAcceptedSeasonsFromOneOnFreshRuntime:true,fixedClubs:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:pmspInstall,refresh:pmspRefresh,getState:()=>view,resolveSeason:pmspResolveSeason,canContinue:pmspCanContinue,continueToNextSeason:pmspAdvance,isActive:pmspSharedMarker});
});
