(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): read every 3 s for at most 3 minutes while waiting for the coordinator's commit or the rival's acknowledge.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  function psscReadTimeoutMs(){const value=Number(root.CMS_COMMIT_READ_TIMEOUT_MS);return Number.isFinite(value)&&value>=1000&&value<=25000?value:25000;}
  const ACTION_ID="sharedSeasonCommitAction";
  let installed=false,busy=false,provider=null,conflictGuard=null,setupApi=null,resultsApi=null,view=null,contextKey="",providerChain=Promise.resolve(),refreshPromise=null,refreshRequestKey="",headingObserver=null,bootstrapObserver=null,errorMessage="",pendingErrorKind="",readError="",readErrorKey="",readGeneration=0,heldReportKey="";

  function psscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function psscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function psscSharedMarker(){const showdown=psscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function psscField(id){return root.document&&root.document.getElementById(id);}
  function psscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function psscDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function psscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function psscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function psscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function psscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await psscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await psscLoadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
    await psscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await psscLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await psscLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await psscLoadScript("ssjr-season-commit-protocol","js/sharedSeasonCommit.js",()=>root.CareerModeSharedSeasonCommit);
    await psscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await psscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    await psscLoadScript("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js",()=>root.CareerModeProductionSharedJourneyConflicts);
    setupApi=root.CareerModeProductionSharedShowdownSetup;resultsApi=root.CareerModeProductionSharedSeasonResults;provider=root.CareerModeSparkSharedSeasonCommit;conflictGuard=root.CareerModeProductionSharedJourneyConflicts;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")psscFail("SEASON_COMMIT_SETUP_UNAVAILABLE");
    if(!resultsApi||typeof resultsApi.refresh!=="function"||typeof resultsApi.getState!=="function")psscFail("SEASON_COMMIT_RESULTS_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.commitSeason!=="function"||typeof provider.acknowledgeSeason!=="function")psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");
    if(!conflictGuard||typeof conflictGuard.execute!=="function")psscFail("JOURNEY_CONFLICT_GUARD_UNAVAILABLE");
  }
  function psscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=psscShowdown()?.currentRound,season=Number(psscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)psscFail("SEASON_COMMIT_SEASON_INVALID");return season;}
  function psscSetupState(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
  function psscResultsState(){try{return (resultsApi||root.CareerModeProductionSharedSeasonResults)?.getState?.()||null;}catch(_error){return null;}}
  function psscRequestContext(){const showdown=psscShowdown(),setup=psscSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=psscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function psscContextMatches(request){const current=psscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function psscResultsPublished(request=psscRequestContext()){const results=psscResultsState();return Boolean(request&&results&&results.state?.phase==="RESULTS_READY"&&results.state?.revision===2&&Number(results.seasonNumber)===request.seasonNumber&&String(results.rivalryId||"")===request.rivalryId);}
  function psscResultsReady(request=psscRequestContext()){const results=psscResultsState();return Boolean(psscResultsPublished(request)&&results.allResults?.playerOne&&results.allResults?.playerTwo);}
  function psscResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The season request was rejected.");error.code=result&&result.code||"SEASON_COMMIT_PROVIDER_FAILED";throw error;}
  function psscWithTimeout(promise,ms,code){let timer=null;const timeout=new Promise((_,reject)=>{timer=root.setTimeout?.(()=>{const error=new Error("The Shared Season Commit check took too long. Check your connection and retry.");error.code=code;reject(error);},ms);});return Promise.race([promise,timeout]).finally(()=>{if(timer!==null)root.clearTimeout?.(timer);});}
  function psscQueue(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  function psscRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")psscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_commit_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the RESULTS_READY Season Results.
  async function psscProviderContext(request=psscRequestContext(),light=false){
    if(!psscSharedMarker())psscFail("SEASON_COMMIT_SHARED_MODE_REQUIRED");
    if(!request||!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    await psscEnsureDependencies();
    if(!psscResultsPublished(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish their Season Results first.");
    if(!(light===true&&psscSetupState()?.ready===true&&psscResultsReady(request))){
      await setupApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
      await resultsApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    }
    if(!psscResultsReady(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish their Season Results first.");
    const setup=psscSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)psscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  function psscEnsureUi(){
    const panel=psscField("seasonReviewPanel"),actions=panel?.querySelector?.(".seasonReviewActions");if(!panel||!actions)return null;
    let status=psscField("sharedSeasonCommitStatus");if(!status){status=root.document.createElement("p");status.id="sharedSeasonCommitStatus";status.className="seasonReviewWarning sharedSeasonCommitStatus";actions.parentNode.insertBefore(status,actions);}
    let action=psscField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton";action.type="button";actions.prepend(action);}
    return {panel,actions,status,action};
  }
  function psscSetError(message=""){
    const node=psscField("seasonReviewError"),value=String(message||"");
    if(!value){if(node&&errorMessage&&node.textContent===errorMessage)node.textContent="";errorMessage="";return;}
    if(node){node.textContent=value;errorMessage=value;}
  }
  // r80 (Nik, 2026-10-19): the two managers play different FIFA saves, so both winning the league (same position), the
  // Champions League or the domestic cup in the same season is normal and is never a clash. Only a same-manager
  // impossibility (one save winning both the Champions League and the Europa League) may ever be listed here; none is yet.
  function psscSeasonResultClash(_results){
    const lines=[];
    return lines;
  }
  function psscClashWarning(who){
    const lines=psscSeasonResultClash(psscResultsState()?.allResults);
    return lines.length?` · CHECK RESULTS: ${lines.join(" ")} ${who} can still lock the season; scores use what was entered.`:"";
  }
  function psscManagerName(role){return psscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let psscWatchedKey=null;
  function psscWatchSync(){let key="";try{key=psscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===psscWatchedKey)return;psscWatchedKey=key;try{psscWatchWait();}catch(_error){}}
  function psscRender(){psscWatchSync();
    const ui=psscEnsureUi();if(!ui)return false;
    const request=psscRequestContext(),ready=Boolean(psscSharedMarker()&&request&&psscResultsPublished(request)),eligible=Boolean(ready&&psscResultsReady(request)&&contextKey===request.key&&view);
    psscHidden(ui.status,!ready);psscHidden(ui.action,!ready);if(!ready)return false;
    if(!eligible){
      psscText(ui.status,readError?`SEASON CHECK FAILED · ${readError} · YOUR RESULTS ARE SAVED`:'CHECKING THE SEASON · YOUR RESULTS ARE SAVED');
      psscText(ui.action,readError?'CHECK AGAIN':'CHECK SEASON');psscDisable(ui.action,busy||Boolean(refreshPromise));return false;
    }
    const role=view.managerRole,coordinator=view.coordinatorRole,phase=view.phase||"RESULTS_READY";
    if(phase==="ACKNOWLEDGED"){
      psscText(ui.status,"SEASON COMMITTED · SCORE BELOW");psscText(ui.action,"SEASON CONFIRMED ✓");psscDisable(ui.action,true);return true;
    }
    if(view.committed){
      if(view.ownAcknowledged){psscText(ui.status,"YOU CONFIRMED THIS SEASON · WAITING FOR YOUR RIVAL");psscText(ui.action,"CONFIRMED ✓ · WAITING FOR RIVAL");psscDisable(ui.action,true);}
      else{psscText(ui.status,"SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT");psscText(ui.action,"CONFIRM SEASON");psscDisable(ui.action,busy);}
      return true;
    }
    if(role===coordinator){psscText(ui.status,`BOTH RESULTS ARE IN · LOCK THE SEASON${psscClashWarning("You")}`);psscText(ui.action,"LOCK & CONFIRM SEASON");psscDisable(ui.action,busy);}
    else{psscText(ui.status,`BOTH RESULTS ARE IN · WAITING FOR ${psscManagerName(coordinator)} TO LOCK THE SEASON${psscClashWarning(psscManagerName(coordinator))}`);psscText(ui.action,`WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()}`);psscDisable(ui.action,true);}
    return true;
  }
  function psscBind(result,ctx,request){if(!psscContextMatches(request))return false;const before=view&&contextKey===request.key?view.phase:null;view={...result,rivalryId:ctx.setup.rivalryId,coordinatorRole:result.coordinatorRole||ctx.setup.setup.coordinatorRole};contextKey=request.key;readError="";readErrorKey="";psscRender();if(before&&before!=="ACKNOWLEDGED"&&view.phase==="ACKNOWLEDGED")psscNudgeHistory();if(view.phase==="ACKNOWLEDGED"){try{root.CareerModeFirestoreBudget?.noteSeasonDone?.(`${view.rivalryId}|${request.seasonNumber}`,Boolean(before&&before!=="ACKNOWLEDGED"));}catch(_error){}}return true;}
  // r75: the moment this page sees the season commit become ACKNOWLEDGED, Canonical Scoring and then Shared History check
  // once, in that order (History needs the reconciled score), instead of each waiting for its next 3 s check: nothing else
  // announces the commit change to them. The next season, the history screens and Final Winner follow from History's event.
  function psscNudgeHistory(){if(typeof root.setTimeout!=="function"||root.document?.visibilityState==="hidden")return;root.setTimeout(()=>{void (async()=>{
    const scoring=root.CareerModeProductionSharedCanonicalScoring,history=root.CareerModeProductionSharedHistoryConvergence;
    try{if(scoring&&typeof scoring.refresh==="function"){let state=await scoring.refresh(true);if(state?.phase!=="SCORING_RECONCILED")state=await scoring.refresh(true);}}catch(_error){}
    try{if(history&&typeof history.refresh==="function"){const state=await history.refresh(true);if(state?.phase!=="HISTORY_CONVERGED")await history.refresh(true);}}catch(_error){}
  })();},0);}
  async function psscRefreshNow(request=psscRequestContext(),generation=0,light=false){
    if(!request)return null;
    if(contextKey&&contextKey!==request.key){psscSetError("");pendingErrorKind="";}
    const ctx=await psscProviderContext(request,light);if(!psscContextMatches(request))return null;const result=psscResultError(await provider.read(ctx.options),"The season could not be checked.");if(!psscContextMatches(request))return null;
    if(generation&&generation!==readGeneration)return null;
    if(pendingErrorKind&&psscSatisfied(pendingErrorKind,result)){psscSetError("");pendingErrorKind="";}
    psscBind(result,ctx,request);return view;
  }
  function psscRefresh(light=false){
    const request=psscRequestContext();if(!request)return Promise.resolve(null);
    // Job 33: an ACKNOWLEDGED commit is immutable (Rules cap it at revision 3), so later callers reuse it instead of re-reading it.
    if(view&&contextKey===request.key&&view.phase==="ACKNOWLEDGED"&&!refreshPromise)return Promise.resolve(view);
    if(refreshPromise&&refreshRequestKey===request.key)return refreshPromise;
    if(contextKey!==request.key){view=null;contextKey="";if(readErrorKey!==request.key){readError="";readErrorKey="";}}
    refreshRequestKey=request.key;
    const generation=++readGeneration;
    const current=psscQueue(()=>psscWithTimeout(psscRefreshNow(request,generation,light===true),psscReadTimeoutMs(),"SEASON_COMMIT_CHECK_TIMEOUT"));refreshPromise=current;psscRender();
    // Job 33: the check failure shows at once (CHECK AGAIN), but it is reported only when the same failure repeats on the
    // next poll, like Shared History and Multi Season; a single aborted read under contention is not an application error.
    current.then(()=>{heldReportKey="";if(refreshPromise===current){refreshPromise=null;psscRender();}},error=>{
      if(error?.code==="SEASON_COMMIT_CHECK_TIMEOUT"&&readGeneration===generation)readGeneration+=1;
      // Job 33: a failed fast (3 s) read keeps the current view and is retried by the next poll; the 15 s poll still reports a real failure.
      if(light===true&&refreshPromise===current&&view&&contextKey===request.key){refreshPromise=null;psscRender();return;}
      if(refreshPromise===current){refreshPromise=null;if(psscContextMatches(request)&&psscResultsPublished(request)&&!/_CONTEXT_STALE$/.test(String(error?.code||""))){const previous=readErrorKey===request.key?readError:"";view=null;contextKey="";readErrorKey=request.key;readError=String(error?.code||"SEASON_COMMIT_CHECK_FAILED").replace(/[^A-Za-z0-9_-]/g,"").slice(0,80);psscRender();const reportKey=request.key+"|"+readError;if(readError!==previous)heldReportKey=reportKey;else if(heldReportKey===reportKey){heldReportKey="";psscReport("Unable to check Shared Season Commit",error);}}}
    });
    return current;
  }
  function psscSatisfied(kind,current){if(kind==="commit")return Boolean(current.committed);return Boolean(current.ownAcknowledged||current.phase==="ACKNOWLEDGED");}
  async function psscWrite(kind,ctx,request,current){
    const operationId=psscRandomOperationId(),method=kind==="commit"?"commitSeason":"acknowledgeSeason";
    if(kind==="commit"&&current.managerRole!==current.coordinatorRole)psscFail("SEASON_COMMIT_COORDINATOR_REQUIRED",`Only ${psscManagerName(current.coordinatorRole)} can lock the season.`);
    for(let attempt=0;attempt<2;attempt+=1){
      const baseRevision=Number(current.revision||0);
      const providerRequest={...ctx.options,operationId,baseRevision};
      const result=await conflictGuard.execute({surface:"season-commit",action:kind==="commit"?"commit-season":"acknowledge-season",operationId,baseRevision,authority:{accountId:ctx.options.user.uid,deviceId:ctx.setup.deviceId,rivalryId:ctx.setup.rivalryId,sessionId:ctx.setup.sessionId,managerRole:ctx.setup.managerRole},intent:{seasonNumber:request.seasonNumber}},()=>provider[method](providerRequest));
      if(result&&result.ok===true)return true;
      if(result?.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0){current=psscResultError(await provider.read(ctx.options));if(psscSatisfied(kind,current))return true;continue;}
      psscResultError(result,kind==="commit"?"The season could not be locked.":"Your season confirmation could not be saved.");
    }
    return false;
  }
  async function psscMutate(kind){
    if(busy)return false;const request=psscRequestContext();if(!request)return false;busy=true;readGeneration+=1;psscSetError("");pendingErrorKind="";psscRender();
    let stage=kind;
    try{
      return await psscQueue(async()=>{
        const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return false;let current=psscResultError(await provider.read(ctx.options));
        if(!psscContextMatches(request))return false;
        if(!psscSatisfied(kind,current)){if(!await psscWrite(kind,ctx,request,current))return false;if(kind==="commit")stage="acknowledge";current=psscResultError(await provider.read(ctx.options));if(!psscContextMatches(request))return false;}
        psscBind(current,ctx,request);
        // One tap for the coordinator: COMMIT & ACKNOWLEDGE records his own acknowledgement right after the commit (each write keeps its own operationId and stale retry).
        // If this second half fails, the committed view shows the existing CONFIRM SEASON button (only this R7 case re-reads
        // at once; a manager's own ACKNOWLEDGE failure keeps its error until the next read, exactly as before).
        if(kind!=="commit"||current.managerRole!==current.coordinatorRole||psscSatisfied("acknowledge",current))return true;
        stage="acknowledge";
        if(!await psscWrite("acknowledge",ctx,request,current))return false;
        try{await psscRefreshNow(request);}catch(_error){psscRefresh().catch(()=>{});}return true;
      });
    }catch(error){if(psscContextMatches(request)){pendingErrorKind=stage;if(stage==="acknowledge"&&view&&contextKey===request.key&&!view.committed)view={...view,committed:true};psscSetError(error.message||error.code||"Shared Season Commit failed.");psscReport("Unable to update Shared Season Commit",error);if(kind==="commit"&&stage==="acknowledge")void psscRefresh().catch(()=>{});}return false;}
    finally{busy=false;if(psscContextMatches(request))psscRender();}
  }
  function psscCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!psscSharedMarker())return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;const request=psscRequestContext();if(!request||contextKey!==request.key||!view||!psscResultsReady(request)){void psscRefresh().catch(()=>{});return;}void psscMutate(view.committed?"acknowledge":"commit");}
  // All three waiting screens share the same season authority; navigation does not end the partner wait.
  function psscWaitScreen(){return ["seasonEntry","mainMenu","standings"].some(id=>{const node=psscField(id);return node&&!node.classList.contains("hidden");});}
  // A Results/Commit listener alone cannot cover Setup, session, later commits or terminal authority.
  // These listeners live only for the wait, share its existing health/fallback cadence, and never poll.
  // A hidden page stops them (keep=true) and the same wait attaches them again when it returns (psscWaitReturn); their first
  // server delivery is the new baseline and answers the return check's reads of the same documents (one read each).
  // An ACKNOWLEDGED revision-3 commit can never change again (Rules), so the next attach leaves it out.
  let waitContext=null,waitReturn=null;const waitSettled=new Set();
  function psscDropWaitContext(keep=false){const held=waitContext,budget=root.CareerModeFirestoreBudget;waitContext=null;if(keep===true&&held&&!held.failed)waitReturn={key:held.key,watching:held.watching};else if(keep!==true||held){waitReturn=null;budget?.returnListen?.([]);}if(!held)return;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();budget?.listened?.();}
  function psscWaitReturn(){const back=waitReturn,request=psscRequestContext();waitReturn=null;if(back&&request&&psscWaitScreen()&&!root.CareerModeFirestoreBudget?.paused?.())psscWaitContext(request,back.watching,back.key);else root.CareerModeFirestoreBudget?.returnListen?.([]);}
  function psscContextWake(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-wait-context-change"));}catch(_error){}}
  function psscWaitContext(request,watching,returnKey){
    const setup=psscSetupState(),runtime=root.CareerModeProductionFirebaseRuntime,budget=root.CareerModeFirestoreBudget;
    const key=`${request.rivalryId}|${setup?.accountId}|${setup?.deviceId}|${setup?.sessionId}`;
    if(returnKey!==undefined&&returnKey!==key){budget?.returnListen?.([]);return false;}
    if(waitContext?.key===key){
      const held=waitContext;
      if(held.failed&&Date.now()>=held.retryAt)psscDropWaitContext();
      else if(watching!==held.watching){
        // One listener per document: the wait listener now watches this one, so its authority listener stops. A document
        // the wait listener stops watching gets its authority listener back (rebuild).
        const old=held.watching;held.watching=watching;
        if(held.paths?.includes(old)&&!waitSettled.has(old))psscDropWaitContext();
        else{const stop=held.stops.get(watching);held.stops.delete(watching);if(stop)try{stop();}catch(_error){}if(held.pending?.delete(watching))held.ready=!held.failed&&held.pending.size===0;return held.ready&&!held.failed;}
      }else return held.ready&&!held.failed;
    }
    if(waitContext)psscDropWaitContext();
    const held={key,watching,stops:new Map(),ready:false,failed:false,retryAt:0,returnUntil:returnKey===undefined?0:Date.now()+10000};waitContext=held;
    const fail=error=>{if(waitContext!==held)return;held.failed=true;held.ready=false;held.retryAt=Date.now()+60000;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();/* r86 red team #19: the context listeners take the rivalry and Session back while these wait to retry. */budget?.returnListen?.([]);budget?.listened?.();budget?.noteError?.(error);};
    Promise.resolve().then(async()=>{
      const services=await runtime?.ensureAccountServices?.();if(waitContext!==held)return;
      if(!services?.ok||!setup?.sessionId||services.auth?.currentUser?.uid!==setup.accountId)throw new Error("Waiting context is unresolved.");
      let sdk=services.firestoreSdk;
      if(typeof sdk?.onSnapshot!=="function"){
        const url=runtime?.firebaseFirestoreModule;
        if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))throw new Error("Waiting listener SDK is unavailable.");
        sdk=await import(url);
      }
      // r85: every delivery of these listeners is counted once by the budget layer's read meter.
      sdk=(budget?.meterSdk||(s=>s))(sdk);
      if(waitContext!==held)return;
      const base=`rivalries/${request.rivalryId}`,paths=[base,`${base}/sharedSetup/authoritative`,`${base}/sessions/${setup.sessionId}`];
      const total=Number(setup.setup?.totalSeasons);
      if([1,3,5,10].includes(total))for(let n=1;n<=total;n++)paths.push(`${base}/seasonCommits/season_${n}`);
      held.paths=paths;
      const pending=held.pending=new Set(paths.filter(path=>path!==held.watching&&!waitSettled.has(path)));let queued=false,sessionChanged=false,dirty=false,notified=false;
      budget?.returnListen?.([...pending]);
      const wake=(changed=false)=>{dirty=dirty||changed;if(queued)return;queued=true;Promise.resolve().then(async()=>{queued=false;if(waitContext!==held||held.failed)return;if(dirty){dirty=false;root.CareerModeFirestoreBudget?.forgetContext?.();}if(sessionChanged){sessionChanged=false;try{await root.CareerModeSparkRemoteJoining?.refreshSession?.();}catch(_error){}}if(waitContext===held&&!held.failed)psscContextWake();});};
      for(const path of pending){
        let serial;
        const stop=sdk.onSnapshot(sdk.doc(services.firestore,path),{includeMetadataChanges:true},snapshot=>{
          if(waitContext!==held||held.failed)return;
          /* r86 red team #18: a cached copy (the SDK delivers one first on a return) no longer hands the waiting reads back to the server: they wait for this listener's server copy (the budget layer gives up after 5 s). */if(snapshot.metadata?.fromCache||snapshot.metadata?.hasPendingWrites){held.ready=false;pending.add(path);return;}
          const value=snapshot.exists()?snapshot.data():null,next=JSON.stringify(value),changed=serial!==undefined&&serial!==next;
          if(serial===undefined)budget?.listened?.(path,snapshot);
          if(/\/seasonCommits\/season_\d+$/.test(path)&&value?.phase==="ACKNOWLEDGED"&&value.revision===3)waitSettled.add(path);/* r86: a confirmed Setup (revision 6) never changes again either, and the budget layer keeps it. */if(/\/sharedSetup\/authoritative$/.test(path)&&value?.revision===6&&value?.phase==="SHOWDOWN_CONFIRMED")waitSettled.add(path);
          if(serial!==undefined&&changed&&(path===base||path===`${base}/sessions/${setup.sessionId}`))sessionChanged=true;
          serial=next;pending.delete(path);held.ready=pending.size===0;
          if(changed)wake(true);
          if(held.ready&&!notified){notified=true;wake();}
        },fail);
        if(held.failed)stop();else held.stops.set(path,stop);
      }
      held.ready=pending.size===0;
    }).catch(fail);
    return false;
  }
  function psscWaitHealthy(){const request=psscRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();const healthy=Boolean(request&&root.document?.visibilityState!=="hidden"&&!root.CareerModeFirestoreBudget?.paused?.()&&live?.watchHealthy&&["seasonResults","seasonCommits"].some(collection=>live.watching===`rivalries/${request.rivalryId}/${collection}/season_${request.seasonNumber}`));if(!healthy){const hidden=root.document?.visibilityState==="hidden";if(!(request&&!hidden&&!root.CareerModeFirestoreBudget?.paused?.()&&waitContext?.returnUntil>Date.now()))psscDropWaitContext(hidden);return false;}return ![root.CareerModeProductionSharedMultiSeasonProgression,root.CareerModeProductionSharedFinalReconciliation,root.CareerModeProductionSharedJourneyReconnect,root.CareerModeProductionSharedTerminalClose].some(api=>api?.productionEnabled===true)||psscWaitContext(request,live.watching);}

  function psscWaitingKey(){
    const screen=psscField("seasonEntry"),request=psscRequestContext();if(!psscWaitScreen()||!view||!request||contextKey!==request.key||!psscResultsReady(request))return "";
    if(!view.committed&&view.managerRole!==view.coordinatorRole)return `${contextKey}|commit`;
    if(view.committed&&view.ownAcknowledged&&view.phase!=="ACKNOWLEDGED")return `${contextKey}|acknowledge`;
    return "";
  }
  function psscFastPollDue(){const key=psscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
  function psscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(psscWaitScreen()&&psscResultsReady()&&view?.phase!=="ACKNOWLEDGED"?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(psscRequestContext()):null);}catch(_error){path=null;}return budget.watchWaitPoint("season-commit",path,psscWaitWake);}
  function psscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void psscTick(true);};inflight.then(again,again);return;}if(!busy){void psscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void psscTick(true);},400);}
  function psscFastTick(){psscWatchWait();if(psscWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!psscFastPollDue())return;void psscTick(true);}
  // r75: the 15 s check of the visible Season Commit screen reads the shared commit from the server (see Transfer).
  // r84: no commit exists before both results are published, so the fresh read starts then (before, it ran every check of the
  // results wait: ~37 billed reads/min for both phones); a healthy listener on the commit replaces it.
  function psscScreenFresh(){try{const request=psscRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)&&psscResultsReady(request)){const path=`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
  async function psscTick(light=false){if(!psscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=psscField("seasonEntry");if(!psscWaitScreen())return;psscRender();if(view?.phase==="ACKNOWLEDGED"&&contextKey===psscRequestContext()?.key)return;if(light!==true)psscScreenFresh();try{await psscRefresh(light===true);}catch(_error){}}
  function psscAttachHeadingObserver(){
    if(!root.MutationObserver||!root.document)return false;const heading=psscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;
    headingObserver=new root.MutationObserver(()=>void psscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;
  }
  function psscInstallObservers(){if(psscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(psscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function psscInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-connected-account-state-change","career-mode-firestore-quota"])root.addEventListener?.(event,()=>psscDropWaitContext());root.addEventListener?.("career-mode-shared-wait-context-change",()=>void psscTick());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")psscDropWaitContext(true);else psscWaitReturn();});if(root.document)root.document.addEventListener("click",psscCapture,true);psscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void psscTick());if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!psscWaitHealthy())void psscTick();},POLL_MS);root.setInterval(psscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void psscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-commit",productionEnabled:true,runtimeRevision:"1.9.1-r10",requiresResultsReady:true,requiresCoordinatorCommit:true,requiresBothAcknowledgements:true,coordinatorCommitAlsoAcknowledges:true,reusesSeasonReview:true,distinctFromLocalConfirm:true,boundedStaleRetry:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,waitingListenerHealthy:psscWaitHealthy,isWaitingForRival:()=>Boolean(psscWaitingKey()),install:psscInstall,refresh:psscRefresh,seasonResultClash:psscSeasonResultClash,getState:()=>view,isActive:psscSharedMarker});
});
