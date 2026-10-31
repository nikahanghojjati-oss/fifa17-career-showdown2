(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): while this manager waits on the rival, read every 3 s for at most 3 minutes, then the normal 15 s.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  const TIMER_MS=1000;
  const EXPIRY_RETRY_MS=30000,EXPIRY_MAX_ATTEMPTS=3;
  const CLOCK_REFRESH_MS=5*60*1000;
  const CONTROL_IDS=Object.freeze(["seasonPrimaryAction","startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"]);
  const PHASE_PROGRESS=Object.freeze({NOT_STARTED:"window",WINDOW_OPEN:"window",GUESS_ENTRY:"guess_entry",SIGNING_ENTRY:"signing_entry",COMPLETED:"completed"});
  const REPLAY_PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  // r87 (Nik 2026-10-30): each signing's FIFA 17 position, chosen by his own manager and never guessed (roulette boards).
  const SIGNING_POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  let installed=false,busy=false,provider=null,setupApi=null,careerApi=null,view=null,pollTimer=null,timerLoop=null,openedKey="",expiryAttemptRevision=-1,expiryAttemptAt=0,providerChain=Promise.resolve(),refreshPromise=null,refreshContextKey="",viewContextKey="",replayContextKey="",replayQueue=[],openPromise=null;
  let expiryAttemptContextKey="",expiryAttemptCount=0,expiryPermissionDenied=false,expiryNeedsAuthority=false,refreshExpiryRequest=null;
  let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;
  const witnessedByContext=new Map();
  let fastWaitKey="",fastWaitSince=0;
  let rouletteLoadError=false;
  // r87 RT5-FLOW-02 (Nik 2026-10-31): the shared window waits until both managers have spun this season's roulette. The gate is
  // known where the roulette runs (pstcRouletteFirst): does the roulette apply to this Showdown (confirmed on r87 or later, not
  // switched off)? spinPendingKey: this manager has spun (or his roulette is done on this browser) and his own mark is not on the
  // server yet; the next check writes it again until it lands.
  let rouletteGate={key:"",applies:false},spinPendingKey="",spinRefusedKey="",spinWriting=null;

  function pstcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pstcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pstcSharedMarker(){const showdown=pstcShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pstcReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pstcText(id,value){const node=root.document&&root.document.getElementById(id);if(node)node.textContent=String(value??"");return node;}
  function pstcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pstcDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pstcLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pstcEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pstcLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pstcLoadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
    await pstcLoadScript("ssjr-transfer-protocol","js/sharedTransferChallenge.js",()=>root.CareerModeSharedTransferChallenge);
    await pstcLoadScript("ssjr-transfer-provider","js/sparkSharedTransferChallenge.js",()=>root.CareerModeSparkSharedTransferChallenge);
    await pstcLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;careerApi=root.CareerModeProductionSharedCareerStart;provider=root.CareerModeSparkSharedTransferChallenge;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pstcFail("TRANSFER_SETUP_UNAVAILABLE");
    if(!careerApi||typeof careerApi.refresh!=="function"||typeof careerApi.getState!=="function")pstcFail("TRANSFER_CAREER_START_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.startWindow!=="function"||typeof provider.requestEndWindow!=="function"||typeof provider.advanceExpiredWindow!=="function"||typeof provider.lockGuesses!=="function"||typeof provider.lockSignings!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
  }
  // A restored local shell may have no rivalry id. Shared Setup has already verified it before entry resumes;
  // use that snapshot while this module's dependencies are still cold so the first refresh can bind its request.
  function pstcSetupState(){try{return setupApi?.getState?.()||root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function pstcCareerReady(){try{const career=careerApi?.getState?.();return Boolean(career&&career.state&&career.state.phase==="CAREER_START_READY"&&career.state.revision===2);}catch(_error){return false;}}
  function pstcConfirmedShared(){const state=pstcSetupState();return Boolean(pstcSharedMarker()&&state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pstcSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pstcShowdown()?.currentRound,season=Number(pstcSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pstcFail("TRANSFER_SEASON_INVALID");return season;}
  function pstcLocalContextKey(){const showdown=pstcShowdown(),id=String(showdown?.id||showdown?.saveId||"").trim();let season;try{season=pstcSeason();}catch(_error){return "";}return id&&Number.isInteger(season)&&season>0?`${id}:${season}`:"";}
  function pstcBoundContextKey(rivalryId,season,localContextKey=pstcLocalContextKey()){const local=String(localContextKey||"").trim(),remote=String(rivalryId||"").trim(),round=Number(season);return local&&remote&&Number.isInteger(round)&&round>0?`${local}|${remote}:${round}`:"";}
  function pstcCurrentContextKey(){const showdown=pstcShowdown(),setup=pstcSetupState(),rivalry=showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"";let season;try{season=pstcSeason();}catch(_error){return "";}return pstcBoundContextKey(rivalry,season);}
  function pstcRequestContext(){const showdown=pstcShowdown(),localKey=pstcLocalContextKey(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=pstcSeason();}catch(_error){return null;}const key=pstcBoundContextKey(rivalryId,seasonNumber,localKey);return key?Object.freeze({key,localKey,rivalryId,seasonNumber}):null;}
  function pstcRequestMatches(request,ctx=null){if(!request||pstcCurrentContextKey()!==request.key)return false;if(!ctx)return true;return String(ctx.state?.rivalryId||"").trim()===request.rivalryId&&Number(ctx.options?.seasonNumber)===request.seasonNumber;}
  function pstcBindView(result,ctx,request){if(!pstcRequestMatches(request,ctx))return false;view={...result,setup:ctx.state.setup,rivalryId:ctx.state.rivalryId};viewContextKey=request.key;if(view.state?.phase==="COMPLETED"&&view.verdicts)pstcKeepVerdicts(request.rivalryId,request.seasonNumber,view.verdicts);return true;}
  function pstcResetExpiryAttempts(){expiryAttemptContextKey="";expiryAttemptRevision=-1;expiryAttemptAt=0;expiryAttemptCount=0;expiryPermissionDenied=false;}
  function pstcExpiryPaused(){return root.document?.visibilityState==="hidden"||expiryNeedsAuthority;}
  function pstcExpiryPermissionRefused(error,request){if(["permission-denied","firestore/permission-denied","permission_denied"].includes(error?.code)&&pstcRequestMatches(request)&&view?.state?.phase==="WINDOW_OPEN"){expiryAttemptContextKey=request.key;expiryAttemptRevision=Number(view.revision);expiryPermissionDenied=true;}}
  function pstcClearClock(){clockContextKey="";clockServerEpochMs=0;clockPerformanceMs=0;clockRefreshPerformanceMs=0;}
  function pstcClearCachedContext(){view=null;viewContextKey="";openedKey="";replayContextKey="";replayQueue=[];pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcClearClock();}
  function pstcMonotonicNow(){const value=Number(root.performance&&typeof root.performance.now==="function"?root.performance.now():Number.NaN);if(!Number.isFinite(value)||value<0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","A monotonic browser clock is required for the shared Transfer Challenge.");return value;}
  function pstcClockReady(request){return Boolean(request&&clockContextKey===request.key&&Number.isFinite(clockServerEpochMs)&&clockServerEpochMs>0&&Number.isFinite(clockPerformanceMs));}
  function pstcAuthoritativeNow(request=pstcRequestContext()){if(!pstcClockReady(request))pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Server time has not been established for this shared Transfer Challenge.");return Math.floor(clockServerEpochMs+Math.max(0,pstcMonotonicNow()-clockPerformanceMs));}
  async function pstcEnsureServerClock(user,request){
    if(!request||!pstcRequestMatches(request))return false;
    const monotonicNow=pstcMonotonicNow();
    if(pstcClockReady(request)&&Number.isFinite(clockRefreshPerformanceMs)&&monotonicNow-clockRefreshPerformanceMs<CLOCK_REFRESH_MS)return true;
    if(!user||typeof user.getIdTokenResult!=="function")pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Connected account server time is unavailable.");
    const requestPerformanceMs=pstcMonotonicNow();
    const token=await user.getIdTokenResult(true);
    if(!pstcRequestMatches(request))return false;
    const issuedAtEpochMs=Date.parse(String(token?.issuedAtTime||""));
    if(!Number.isFinite(issuedAtEpochMs)||issuedAtEpochMs<=0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","The connected account did not provide a valid server time anchor.");
    const receiptPerformanceMs=pstcMonotonicNow();
    clockContextKey=request.key;
    clockServerEpochMs=issuedAtEpochMs+(issuedAtEpochMs%1000===0?500:0);
    clockPerformanceMs=(requestPerformanceMs+receiptPerformanceMs)/2;
    clockRefreshPerformanceMs=receiptPerformanceMs;
    return true;
  }
  function pstcCanRoute(){const request=pstcRequestContext();return Boolean(request&&view&&viewContextKey===request.key&&pstcRequestMatches(request)&&pstcConfirmedShared()&&pstcCareerReady()&&String(view.rivalryId||"")===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber);}
  // Browser-only viewing hints. Provider state still owns the phase, private inputs and every action.
  function pstcViewingStorageKey(){const request=pstcRequestContext(),role=view?.managerRole;return request&&viewContextKey===request.key&&role?`cms.transferViews.v1:${request.rivalryId}:${request.seasonNumber}:${role}`:"";}
  function pstcWitnessSet(key){
    const scope=`${key}|${view?.managerRole||""}`;
    if(!witnessedByContext.has(scope)){
      let saved=null;try{const storageKey=pstcViewingStorageKey();if(storageKey)saved=JSON.parse(root.readStorageValue?.(storageKey)||"null");}catch(_error){}
      witnessedByContext.set(scope,new Set(Array.isArray(saved)?saved.filter(phase=>REPLAY_PHASES.includes(phase)||phase==="RESULTS_VIEWED"):[]));
    }
    return witnessedByContext.get(scope);
  }
  function pstcCanResumeResults(){return Boolean(pstcCanRoute()&&view.state?.phase==="COMPLETED"&&!pstcReplayPhase()&&REPLAY_PHASES.every(phase=>pstcWitnessSet(viewContextKey).has(phase))&&pstcWitnessSet(viewContextKey).has("RESULTS_VIEWED"));}
  // Seeing completed verdicts does not mean Results was opened. Keep that navigation hint separate so a
  // reload before the Results tap still follows the normal season dashboard / transfer recovery route.
  function pstcRememberResultsView(){
    if(!pstcCanRoute()||view.state?.phase!=="COMPLETED"||pstcReplayPhase())return false;
    const witnessed=pstcWitnessSet(viewContextKey);if(!REPLAY_PHASES.every(phase=>witnessed.has(phase)))return false;
    if(witnessed.has("RESULTS_VIEWED"))return true;witnessed.add("RESULTS_VIEWED");
    try{const key=pstcViewingStorageKey();if(key)root.writeStorageValue?.(key,JSON.stringify([...witnessed]));}catch(_error){}
    return true;
  }
  function pstcTransferScreenVisible(){const screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(screen&&!screen.classList.contains("hidden"));}
  function pstcReplayPhase(key=viewContextKey){return replayContextKey===key&&replayQueue.length?replayQueue[0]:null;}
  function pstcPrepareReplay(){
    const key=viewContextKey,actual=view?.state?.phase;
    if(!key||!REPLAY_PHASES.includes(actual)){replayContextKey="";replayQueue=[];return false;}
    if(replayContextKey===key&&replayQueue.length)return true;
    const actualIndex=REPLAY_PHASES.indexOf(actual),witnessed=pstcWitnessSet(key),missing=REPLAY_PHASES.slice(0,actualIndex).filter(phase=>!witnessed.has(phase));
    replayContextKey=missing.length?key:"";replayQueue=missing;return missing.length>0;
  }
  function pstcMarkWitness(key,phase){
    if(!key||!REPLAY_PHASES.includes(phase)||!pstcTransferScreenVisible())return;
    const witnessed=pstcWitnessSet(key);if(witnessed.has(phase))return;witnessed.add(phase);
    try{const storageKey=pstcViewingStorageKey();if(storageKey)root.writeStorageValue?.(storageKey,JSON.stringify([...witnessed]));}catch(_error){}
  }
  function pstcAdvanceReplay(){if(!pstcReplayPhase())return false;replayQueue.shift();if(!replayQueue.length){replayContextKey="";pstcPrepareReplay();}pstcRender();return true;}
  function pstcRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pstcFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `transfer_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and Career Start instead of re-reading them.
  async function pstcProviderOptions(request=pstcRequestContext(),light=false,expiryOnly=false){
    if(!pstcSharedMarker())pstcFail("TRANSFER_SHARED_MODE_REQUIRED");
    if(!request||!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    await pstcEnsureDependencies();
    if(expiryOnly&&pstcExpiryPaused())return null;
    const reuse=light===true&&pstcConfirmedShared()&&pstcCareerReady();
    if(!reuse)await setupApi.refresh();
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const state=setupApi.getState();
    if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)pstcFail("TRANSFER_SETUP_NOT_CONFIRMED","Both managers must finish setup before the Transfer Challenge.");
    if(!reuse)await careerApi.refresh();
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const career=careerApi.getState();
    if(!career||!career.state||career.state.phase!=="CAREER_START_READY"||career.state.revision!==2)pstcFail("TRANSFER_CAREER_START_NOT_READY","Both managers must finish Career Start before the Transfer Challenge.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    if(!await pstcEnsureServerClock(services.auth.currentUser,request))pstcFail("TRANSFER_CONTEXT_STALE");
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:pstcAuthoritativeNow(request)}};
  }
  function pstcResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Transfer Challenge request was rejected.");error.code=result&&result.code||"TRANSFER_PROVIDER_FAILED";error.providerResult=true;throw error;}
  function pstcQueueProvider(task){const queued=providerChain.then(task,task);providerChain=queued.catch(()=>{});return queued;}
  async function pstcRefreshNow(request=pstcRequestContext(),light=false,expiryOnly=false){
    if(!request)return null;
    const ctx=await pstcProviderOptions(request,light,expiryOnly);if(!ctx||!pstcRequestMatches(request,ctx)||(expiryOnly&&pstcExpiryPaused()))return null;
    const result=pstcResultError(await provider.read(ctx.options),"The Transfer Challenge could not be loaded.");if(!pstcRequestMatches(request,ctx))return null;
    if(!pstcBindView(result,ctx,request))return null;if(pstcTransferScreenVisible())pstcPrepareReplay();pstcSetError("");pstcRender();pstcDecorateDashboard();return view;
  }
  // Routine polls and concurrent-expiry reconciliation must not replenish the automatic retry budget. A poll that lands while
  // a wake refresh failed still counts as the fresh authority that wake was waiting for, so expiry cannot stay paused forever.
  function pstcRefresh(light=false,rearmExpiry=true){
    const request=pstcRequestContext();if(!request)return Promise.resolve(null);
    if(viewContextKey&&viewContextKey!==request.key)pstcClearCachedContext();
    if(rearmExpiry)expiryNeedsAuthority=true;
    if(refreshPromise&&refreshContextKey===request.key){refreshExpiryRequest.rearm=refreshExpiryRequest.rearm||rearmExpiry;return refreshPromise;}
    const expiryRefresh={rearm:rearmExpiry};refreshExpiryRequest=expiryRefresh;
    const current=pstcQueueProvider(async()=>{
      const fresh=await pstcRefreshNow(request,light===true);
      if(fresh&&pstcRequestMatches(request)&&(expiryRefresh.rearm||expiryNeedsAuthority)){pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcRender();}
      return fresh;
    });
    refreshPromise=current;refreshContextKey=request.key;
    const clear=()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";refreshExpiryRequest=null;}};
    current.then(clear,clear);return current;
  }
  // Job 21: when both managers tap at once the loser's write is rejected by the Rules (permission-denied) or by the provider
  // (stale revision / phase already moved). Re-read once; if the refreshed state already shows the outcome, finish silently,
  // otherwise retry the same method once with a fresh revision and operation id. A real denial surfaces after that one retry.
  const PSTC_RACE_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied","TRANSFER_STALE_BASE_REVISION","TRANSFER_PHASE_INVALID","TRANSFER_END_ALREADY_REQUESTED","TRANSFER_ALREADY_STARTED","TRANSFER_GUESSES_ALREADY_LOCKED","TRANSFER_SIGNINGS_ALREADY_LOCKED"]);
  function pstcOutcomeShown(method,fresh){
    const state=fresh&&fresh.state,role=fresh&&fresh.managerRole;if(!state)return false;
    if(method==="startWindow")return state.phase!=="NOT_STARTED";
    if(method==="requestEndWindow")return state.phase!=="WINDOW_OPEN"||Boolean(state.endRequestedRoles?.includes(role));
    if(method==="advanceExpiredWindow")return state.phase!=="WINDOW_OPEN";
    if(method==="lockGuesses")return state.phase!=="GUESS_ENTRY"||Boolean(state.guessLockedRoles?.includes(role));
    if(method==="lockSignings")return state.phase==="COMPLETED"||Boolean(state.signingLockedRoles?.includes(role));
    return false;
  }
  // BUG-3: the provider rejects a signing name over 80 characters with only a code, so the inputs are capped to the same limit and the known codes read as plain sentences.
  const SIGNING_NAME_MAX=80;
  // Red team R87-B-05: a dropped connection or an expired session reads as what to do next, never as a raw code.
  const PSTC_CONNECTION_TEXT="Could not confirm this step. Check the connection, tap REFRESH CHALLENGE to see if it saved, then try again if it did not.";
  const PSTC_SESSION_TEXT="Your Showdown session has lapsed. Go back to Showdown Home and open the Showdown again; nothing saved is lost.";
  const PLAIN_PROVIDER_CODES=Object.freeze({TRANSFER_ROULETTE_PENDING:"Both managers spin the roulette before the transfer window opens.",TRANSFER_SIGNINGS_INVALID:"Check each signing: a player name (80 characters at most), a previous league and a nationality.",TRANSFER_GUESSES_INVALID:"Check each guess: choose a FIFA 17 league or nationality."});
  function pstcCapSigningNames(){if(!root.document)return;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const input=pstcField(`${prefix}Signing${i}Name`);if(input&&typeof input.setAttribute==="function")input.setAttribute("maxlength",String(SIGNING_NAME_MAX));}}
  function pstcErrorText(error,fallback){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;const code=String(error?.code||""),message=String(error?.message||"");if(error&&error.providerResult!==true&&message&&message!==code)return message;if(PLAIN_PROVIDER_CODES[code])return PLAIN_PROVIDER_CODES[code];if(/unavailable|deadline|offline|network|aborted/i.test(code))return PSTC_CONNECTION_TEXT;if(/permission/i.test(code))return PSTC_SESSION_TEXT;return code||message||fallback;}
  async function pstcMutate(method,payload={}){
    const request=pstcRequestContext();if(!request||busy||pstcReplayPhase()||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;busy=true;pstcSetError("");pstcRender();
    try{
      return await pstcQueueProvider(async()=>{
        for(let attempt=0;;attempt+=1){
          if(!pstcRequestMatches(request)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
          const ctx=await pstcProviderOptions(request,false,method==="advanceExpiredWindow");if(!ctx||!pstcRequestMatches(request,ctx)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
          const current=pstcResultError(await provider.read(ctx.options),"The Transfer Challenge could not be refreshed.");if(!pstcRequestMatches(request,ctx))return false;
          if(method==="advanceExpiredWindow"&&pstcExpiryPaused())return false;
          if(attempt>0&&pstcOutcomeShown(method,current)){if(pstcBindView(current,ctx,request)){pstcSetError("");if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}return true;}
          const options={...ctx.options,nowEpochMs:pstcAuthoritativeNow(request),operationId:pstcRandomOperationId(),baseRevision:Number(current.revision||0),...payload};
          let result;
          try{result=pstcResultError(await provider[method](options),"The Transfer Challenge update was rejected.");}
          catch(error){
            if(!PSTC_RACE_CODES.includes(error&&error.code)||attempt>0)throw error;
            if(method==="advanceExpiredWindow"){try{if(!pstcExpiryPaused())await pstcRefreshNow(request,false,true);}catch(_refreshError){}pstcExpiryPermissionRefused(error,request);return true;}
            continue;
          }
          if(!pstcRequestMatches(request,ctx))return true;
          if(!pstcBindView(result,ctx,request))return true;if(method==="lockSignings")pstcClearSigningDraft(view.managerRole);if(method==="lockGuesses")pstcClearGuessDraft(view.managerRole);pstcSetError("");
          if(result.needsRefresh||result.state?.phase==="COMPLETED")await pstcRefreshNow(request);else{if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}
          return true;
        }
      });
    }catch(error){if(method==="advanceExpiredWindow")pstcExpiryPermissionRefused(error,request);if(pstcRequestMatches(request)){pstcSetError(pstcErrorText(error,"The Transfer Challenge update failed."));pstcReport("Unable to update Shared Transfer Challenge",error);}return false;}
    finally{busy=false;if(pstcRequestMatches(request))pstcRender();}
  }
  function pstcSetError(message=""){const node=root.document&&root.document.getElementById("transferChallengeError");if(node)node.textContent=String(message||"");}
  function pstcRolePrefix(role){return role==="playerOne"?"p1":"p2";}
  function pstcGuessPrefix(role){return role==="playerOne"?"p2":"p1";}
  function pstcManagerName(role){const showdown=pstcShowdown();return showdown?.managers?.[role]|| (role==="playerOne"?"Manager 1":"Manager 2");}
  function pstcClubName(role){const showdown=pstcShowdown();return showdown?.clubs?.[role]||view?.setup?.clubs?.[role]||"Club";}
  function pstcCardFor(id,selector){const node=root.document&&root.document.getElementById(id);return node&&node.closest?node.closest(selector):null;}
  function pstcOwnGuessCard(role){return pstcCardFor(`${pstcGuessPrefix(role)}Guess1Type`,".transferGuessCard");}
  function pstcOtherGuessCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnGuessCard(other);}
  function pstcOwnSigningCard(role){return pstcCardFor(`${pstcRolePrefix(role)}Signing1Name`,".transferManagerCard");}
  function pstcOtherSigningCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnSigningCard(other);}
  function pstcField(id){return root.document&&root.document.getElementById(id);}
  function pstcSetSelector(input,kind,id){if(!input)return;if(typeof root.setTransferSelectorValue==="function")root.setTransferSelectorValue(input,kind,id||"");else input.value=String(id||"");}
  function pstcCanonical(input){return typeof root.getTransferSelectorCanonicalValue==="function"?root.getTransferSelectorCanonicalValue(input):String(input?.dataset?.canonicalId||"");}
  function pstcClearRole(role){
    const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);
    for(let i=1;i<=3;i+=1){
      const name=pstcField(`${signing}Signing${i}Name`),overall=pstcField(`${signing}Signing${i}Overall`),position=pstcField(`${signing}Signing${i}Position`),league=pstcField(`${signing}Signing${i}League`),nationality=pstcField(`${signing}Signing${i}Nationality`),type=pstcField(`${guess}Guess${i}Type`),value=pstcField(`${guess}Guess${i}Value`);
      if(name)name.value="";if(overall)overall.value="";if(position)position.value="";pstcSetSelector(league,"league","");pstcSetSelector(nationality,"nationality","");if(type)type.value="";if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.disabled=true;}
    }
  }
  function pstcResetForContext(key,role){const guessRef=pstcGuessDraftRef(role);if(guessDraftRef&&guessRef&&!pstcSameGuessDraftRef(guessDraftRef,guessRef))pstcRemoveGuessDraft(guessDraftRef);if(guessRef)guessDraftRef=guessRef;const draftKey=pstcSigningDraftKey(role);if(signingDraftKey&&draftKey&&signingDraftKey!==draftKey)pstcRemoveSigningDraft(signingDraftKey);if(draftKey)signingDraftKey=draftKey;if(openedKey===key)return;openedKey=key;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`);if(name&&typeof name.setAttribute==="function")name.setAttribute("maxlength","80");}pstcResetExpiryAttempts();pstcClearRole("playerOne");pstcClearRole("playerTwo");pstcSetError("");}
  const PSTC_MAX_ROWS=3;
  // r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
  // It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
  function pstcAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
  // A lock cannot be undone, so a partly filled form asks first. Cancel (or any confirm failure) means do nothing; no confirm box at all means lock as before.
  async function pstcConfirmPartialLock(filled,noun){
    if(filled>=PSTC_MAX_ROWS)return true;
    return (await pstcAskConfirm(`Lock ${filled} of ${PSTC_MAX_ROWS} ${noun}? You can't change them after locking.`,"primary"))!==false;
  }
  function pstcBuildGuesses(role){
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`),kind=String(type?.value||""),id=pstcCanonical(value),display=String(value?.value||"").trim();if(!kind&&!display)continue;if((kind!=="league"&&kind!=="nationality")||!display||!id)pstcFail("TRANSFER_GUESSES_INVALID",`Complete guess ${i} with a FIFA 17 league or nationality.`);rows.push({slot:i,type:kind,valueId:id});}
    return rows;
  }
  // Red team R87-SP-02 (Rule Book cards 03 and 06): the manager's own Special Player is a free extra signing that a rival's
  // guess can never release, so he is refused as one of the three Transfer War signings. Asked of the season step (which
  // loaded the draw before the window opened), with the Setup confirm time this page already holds: no read, nothing in
  // any protocol document. Without them (older Showdown, draw not loaded) nothing is refused.
  function pstcIsOwnSpecial(role,name){
    try{const step=root.CareerModeRosterRouletteStep,request=pstcRequestContext(),at=pstcSetupState()?.setupUpdatedAtMs;
      return Boolean(step&&typeof step.isOwnSpecial==="function"&&request&&Number.isFinite(at)&&step.isOwnSpecial(request.rivalryId,at,role,name));}
    catch(_error){return false;}
  }
  function pstcBuildSignings(role){
    const prefix=pstcRolePrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`),league=pstcField(`${prefix}Signing${i}League`),nationality=pstcField(`${prefix}Signing${i}Nationality`),player=String(name?.value||"").trim(),ovrText=String(ovr?.value||"").trim(),posText=String(pos?.value||"").trim(),leagueId=pstcCanonical(league),nationalityId=pstcCanonical(nationality),hasAny=Boolean(player||ovrText||posText||String(league?.value||"").trim()||String(nationality?.value||"").trim());if(!hasAny)continue;if(!player||!leagueId||!nationalityId||(ovr&&!/^[3-9][0-9]$/.test(ovrText))||(pos&&!SIGNING_POSITIONS.includes(posText)))pstcFail("TRANSFER_SIGNINGS_INVALID",`Complete signing ${i} with player name, position, overall (30-99), previous league and nationality.`);if(pstcIsOwnSpecial(role,player))pstcFail("TRANSFER_SIGNING_SPECIAL_PLAYER",`Signing ${i} is your Special Player. He is a free extra signing that a guess can never release, so don't enter him here.`);const row={slot:i,name:player,leagueId,nationalityId};if(ovr)row.overall=Number(ovrText);if(pos)row.position=posText;rows.push(row);}
    return rows;
  }
  function pstcSyncGuessValue(type,value,editable){
    if(!value)return;const kind=String(type?.value||""),valid=kind==="league"||kind==="nationality";
    if(valid){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,kind);value.placeholder=kind==="league"?"Search FIFA 17 league":"Search nationality";pstcDisable(value,!editable);return;}
    value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.placeholder="Choose League or Nationality first";pstcDisable(value,true);
  }
  function pstcSyncOwnGuessControls(role,editable){
    const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1)pstcSyncGuessValue(pstcField(`${prefix}Guess${i}Type`),pstcField(`${prefix}Guess${i}Value`),editable);
  }
  function pstcGuessTypeChange(event){
    if(!pstcSharedMarker()||view?.state?.phase!=="GUESS_ENTRY")return;const role=view?.managerRole,target=event.target;if(!role||!target?.id)return;
    const prefix=pstcGuessPrefix(role),match=target.id.match(new RegExp(`^${prefix}Guess([1-3])Type$`));if(!match)return;
    pstcSyncGuessValue(target,pstcField(`${prefix}Guess${match[1]}Value`),!busy&&!view?.state?.guessLockedRoles?.includes(role));
  }
  function pstcPopulateGuesses(role,guesses){const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){const row=(guesses||[]).find(item=>item.slot===i),type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`);if(type)type.value=row?.type||"";if(value&&row){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,row.type);pstcSetSelector(value,row.type,row.valueId);}else if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;}}}
  function pstcPopulateSignings(role,signings){const prefix=pstcRolePrefix(role);for(let i=1;i<=3;i+=1){const row=(signings||[]).find(item=>item.slot===i),name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`);if(name)name.value=row?.name||"";if(ovr)ovr.value=Number.isInteger(row?.overall)?String(row.overall):"";if(pos)pos.value=SIGNING_POSITIONS.includes(row?.position)?row.position:"";pstcSetSelector(pstcField(`${prefix}Signing${i}League`),"league",row?.leagueId||"");pstcSetSelector(pstcField(`${prefix}Signing${i}Nationality`),"nationality",row?.nationalityId||"");}}
  function pstcPopulateRole(role,inputs){if(!inputs)return;if(inputs.guesses)pstcPopulateGuesses(role,inputs.guesses);if(inputs.signings)pstcPopulateSignings(role,inputs.signings);}
  let signingDraftKey="";
  function pstcSigningDraftKey(role){const request=pstcRequestContext();return request&&role?(`cms.signingDraft.v1:${request.rivalryId}:${request.seasonNumber}:${role}`):"";}
  function pstcRemoveSigningDraft(key){if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pstcClearSigningDraft(role){const key=pstcSigningDraftKey(role);pstcRemoveSigningDraft(key);if(signingDraftKey===key)signingDraftKey="";}
  function pstcSaveSigningDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="SIGNING_ENTRY"||state.signingLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase())return false;
    const prefix=pstcRolePrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);rows.push({slot,name:String(name?.value||""),overall:String(ovr?.value||""),position:String(pos?.value||""),leagueId:pstcCanonical(league),league:String(league?.value||""),nationalityId:pstcCanonical(nationality),nationality:String(nationality?.value||"")});}
    const key=pstcSigningDraftKey(role);if(!key||typeof root.writeStorageValue!=="function")return false;if(!root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows})))return false;signingDraftKey=key;return true;
  }
  function pstcRestoreSigningDraft(role,own,force=false){
    const key=pstcSigningDraftKey(role),request=pstcRequestContext(),state=view?.state;
    if(!key||!request||!state||state.phase!=="SIGNING_ENTRY")return false;
    const shared=Array.isArray(own?.signings)?own.signings:[];
    if(state.signingLockedRoles?.includes(role)||shared.length){pstcRemoveSigningDraft(key);return false;}
    let draft;try{draft=JSON.parse((typeof root.readStorageValue==="function"?root.readStorageValue(key):null)||"null");}catch(_error){return false;}
    if(!draft||draft.version!==1||draft.rivalryId!==request.rivalryId||Number(draft.seasonNumber)!==request.seasonNumber||draft.role!==role||!Array.isArray(draft.rows))return false;
    const prefix=pstcRolePrefix(role);
    for(let slot=1;slot<=3;slot+=1){if(shared.some(row=>Number(row.slot)===slot))continue;const row=draft.rows.find(item=>Number(item.slot)===slot);if(!row)continue;const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);const fill=node=>node&&(force||!String(node.value||""));if(fill(name))name.value=String(row.name||"");if(fill(ovr))ovr.value=String(row.overall||"").replace(/\D/g,"").slice(0,2);if(fill(pos)&&(force||SIGNING_POSITIONS.includes(row.position)))pos.value=SIGNING_POSITIONS.includes(row.position)?row.position:"";if(fill(league)){if(row.leagueId)pstcSetSelector(league,"league",row.leagueId);else{league.value=String(row.league||"");delete league.dataset.canonicalId;delete league.dataset.canonicalLabel;}}if(fill(nationality)){if(row.nationalityId)pstcSetSelector(nationality,"nationality",row.nationalityId);else{nationality.value=String(row.nationality||"");delete nationality.dataset.canonicalId;delete nationality.dataset.canonicalLabel;}}}
    signingDraftKey=key;return true;
  }
  // QoL 6: half-typed guesses against the rival survive a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on lock.
  let guessDraftRef=null;
  function pstcGuessDraftRef(role){const request=pstcRequestContext();return request&&role?{rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role}:null;}
  function pstcSameGuessDraftRef(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.seasonNumber===b.seasonNumber&&a.role===b.role);}
  function pstcGuessDraftKey(ref){return ref?`cms.draft.v1:${ref.rivalryId}:${ref.seasonNumber}:${ref.role}:transferGuess`:"";}
  function pstcRemoveGuessDraft(ref){const key=pstcGuessDraftKey(ref);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pstcClearGuessDraft(role){const ref=pstcGuessDraftRef(role);pstcRemoveGuessDraft(ref);if(pstcSameGuessDraftRef(guessDraftRef,ref))guessDraftRef=null;}
  function pstcSaveGuessDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="GUESS_ENTRY"||state.guessLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase()||typeof root.writeStorageValue!=="function")return false;
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`),kind=String(type?.value||""),text=String(value?.value||"");if(!kind&&!text)continue;rows.push({slot,type:kind,valueId:pstcCanonical(value),value:text});}
    if(!rows.length){pstcClearGuessDraft(role);return true;}
    const ref=pstcGuessDraftRef(role);if(root.writeStorageValue(pstcGuessDraftKey(ref),JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows}))!==true)return false;guessDraftRef=ref;return true;
  }
  function pstcRestoreGuessDraft(role,own){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="GUESS_ENTRY"||typeof root.readStorageValue!=="function")return false;
    if(state.guessLockedRoles?.includes(role)||(Array.isArray(own?.guesses)&&own.guesses.length)){pstcClearGuessDraft(role);return false;}
    let saved;try{saved=JSON.parse(root.readStorageValue(pstcGuessDraftKey(pstcGuessDraftRef(role)))||"null");}catch(_error){return false;}
    if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role||!Array.isArray(saved.rows))return false;
    const prefix=pstcGuessPrefix(role);
    for(let slot=1;slot<=3;slot+=1){
      const row=saved.rows.find(item=>Number(item?.slot)===slot),type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`);
      if(!row||!type||!value||String(type.value||"")||String(value.value||""))continue;
      const kind=String(row.type||"");if(kind!=="league"&&kind!=="nationality")continue;
      type.value=kind;pstcSyncGuessValue(type,value,true);
      const text=String(row.value||"").slice(0,120);if(row.valueId||text)pstcSetSelector(value,kind,String(row.valueId||text));
    }
    guessDraftRef=pstcGuessDraftRef(role);return true;
  }
  function pstcGuessDraftChange(event){
    const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!pstcSharedMarker())return;
    const prefix=pstcGuessPrefix(role);if(!new RegExp(`^${prefix}Guess[1-3](Type|Value)$`).test(target.id))return;
    if(view?.state?.phase!=="GUESS_ENTRY"||view.state.guessLockedRoles?.includes(role))return;
    pstcSaveGuessDraft(role);
    // The selector fills its canonical id in its own input handler, which runs after this capture handler; save once more when it has.
    if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(view?.managerRole===role)pstcSaveGuessDraft(role);},0);
  }
  function pstcDisableRole(role,disabled){const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){[`${signing}Signing${i}Name`,`${signing}Signing${i}Overall`,`${signing}Signing${i}Position`,`${signing}Signing${i}League`,`${signing}Signing${i}Nationality`,`${guess}Guess${i}Type`,`${guess}Guess${i}Value`].forEach(id=>pstcDisable(pstcField(id),disabled));}}
  function pstcRenderVerdictCard(role,rows){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;target.append(heading);if(!rows||!rows.length){const empty=root.document.createElement("p");empty.textContent="No signings were entered.";target.append(empty);return;}rows.forEach(row=>{const item=root.document.createElement("p"),name=root.document.createElement("strong"),status=root.document.createElement("span");name.textContent=row.name;status.textContent=row.release?"RELEASE · MATCHED BY RIVAL GUESS":"KEEP · NO RIVAL GUESS MATCH";item.append(name,root.document.createTextNode(" — "),status);target.append(item);});}
  function pstcRenderProgress(phase){
    const localPhase=PHASE_PROGRESS[phase]||"window",order=["window","guess_entry","signing_entry","completed"],index=order.indexOf(localPhase),screen=pstcField("transferChallenge");
    if(screen)screen.dataset.transferPhase=localPhase;
    root.document?.querySelectorAll?.("#transferPhaseNavigator [data-transfer-phase-step]").forEach(step=>{const stepIndex=order.indexOf(step.dataset.transferPhaseStep);step.classList.toggle("active",stepIndex===index);step.classList.toggle("done",stepIndex>=0&&stepIndex<index);});
    const copy={NOT_STARTED:`Transfer Window · ${pstcManagerName(view?.setup?.coordinatorRole||"playerOne")} starts the 15-minute window.`,WINDOW_OPEN:"Transfer Window · you both see the same clock and can agree to end it early.",GUESS_ENTRY:"Guesses · enter your guesses. Your rival can't see them yet.",SIGNING_ENTRY:"Signings · guesses are locked. Enter the signings you made in FIFA 17.",COMPLETED:"Verdicts · both sides are revealed and checked the same way."};
    pstcText("transferPhaseIntro",copy[phase]||copy.NOT_STARTED);
  }
  function pstcRenderTimer(){
    if(pstcExpiryPaused())return;
    const timer=pstcField("transferTimerDisplay"),state=view?.state;if(!timer)return;
    if(pstcReplayPhase()){timer.textContent="REPLAY";return;}
    if(!state||state.phase!=="WINDOW_OPEN"){timer.textContent=state?"00:00":"15:00";return;}
    const request=pstcRequestContext();
    if(!request||!pstcClockReady(request)){timer.textContent="SYNC";return;}
    const now=pstcAuthoritativeNow(request),deadline=Number(state.startedAtEpochMs)+15*60*1000,remaining=Math.max(0,Math.ceil((deadline-now)/1000)),minutes=Math.floor(remaining/60),seconds=remaining%60;timer.textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    const revision=Number(view.revision);
    if(expiryAttemptContextKey!==request.key||expiryAttemptRevision!==revision){pstcResetExpiryAttempts();expiryAttemptContextKey=request.key;expiryAttemptRevision=revision;}
    const retryAllowed=!expiryPermissionDenied&&expiryAttemptCount<EXPIRY_MAX_ATTEMPTS&&(expiryAttemptCount===0||now-expiryAttemptAt>=EXPIRY_RETRY_MS);
    if(remaining===0&&!busy&&retryAllowed){expiryAttemptCount+=1;expiryAttemptAt=now;void pstcMutate("advanceExpiredWindow");}
  }
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pstcWatchedKey=null;
  function pstcWatchSync(){let key="";try{key=pstcWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pstcWatchedKey)return;pstcWatchedKey=key;try{pstcWatchWait();}catch(_error){}}
  function pstcRender(){
    if(!root.document||!pstcSharedMarker())return false;
    pstcCapSigningNames();pstcWatchSync();
    const state=view?.state||null,role=view?.managerRole||pstcSetupState()?.managerRole||null;
    if(!role)return false;
    const key=viewContextKey||pstcBoundContextKey(view?.rivalryId||pstcSetupState()?.rivalryId||"",view?.seasonNumber||pstcSeason());pstcResetForContext(key,role);
    const other=role==="playerOne"?"playerTwo":"playerOne",actualPhase=state?.phase||"NOT_STARTED",replayPhase=pstcReplayPhase(key),phase=replayPhase||actualPhase,isReplay=Boolean(replayPhase),own=view?.ownInputs||null,opponent=view?.opponentInputs||null,screen=pstcField("transferChallenge");
    if(screen){if(isReplay)screen.dataset.sharedTransferReplay=phase;else delete screen.dataset.sharedTransferReplay;}
    pstcRenderProgress(phase);
    pstcText("transferChallengeTitle",`SEASON ${view?.seasonNumber||pstcSeason()} TRANSFER CHALLENGE`);pstcText("transferManagerOne",pstcManagerName("playerOne"));pstcText("transferManagerTwo",pstcManagerName("playerTwo"));pstcText("transferClubOne",pstcClubName("playerOne"));pstcText("transferClubTwo",pstcClubName("playerTwo"));pstcText("guessAgainstOneHeading",`${pstcManagerName("playerTwo")} guesses ${pstcManagerName("playerOne")}'s signings`);pstcText("guessAgainstTwoHeading",`${pstcManagerName("playerOne")} guesses ${pstcManagerName("playerTwo")}'s signings`);
    const start=pstcField("startTransferTimer"),end=pstcField("endTransferTimer"),complete=pstcField("completeTransferChallenge"),continueButton=pstcField("continueFromTransfers"),results=pstcField("transferChallengeResults"),actionBar=pstcField("transferPhaseActionBar"),signingGrid=root.document.querySelector("#transferChallenge .transferManagersGrid"),guessGrid=root.document.querySelector("#transferChallenge .transferGuessesGrid"),privacy=pstcField("transferGuessPrivacyNote"),summary=pstcField("transferPhaseLockSummary");
    if(start)delete start.dataset.rouletteWait;pstcHidden(start,true);pstcHidden(end,true);pstcHidden(complete,true);pstcHidden(actionBar,true);pstcHidden(continueButton,true);pstcHidden(results,true);pstcHidden(signingGrid,true);pstcHidden(guessGrid,true);pstcHidden(privacy,true);pstcHidden(summary,true);pstcHidden(pstcOwnSigningCard(role),false);pstcHidden(pstcOtherSigningCard(role),true);pstcHidden(pstcOwnGuessCard(role),false);pstcHidden(pstcOtherGuessCard(role),true);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);
    if(own)pstcPopulateRole(role,own);if(actualPhase==="SIGNING_ENTRY"&&state?.signingLockedRoles?.includes(role))pstcClearSigningDraft(role);if(actualPhase==="SIGNING_ENTRY"&&!isReplay&&!state?.signingLockedRoles?.includes(role))pstcRestoreSigningDraft(role,own);
    if(actualPhase==="SIGNING_ENTRY"||actualPhase==="COMPLETED"||(actualPhase==="GUESS_ENTRY"&&state?.guessLockedRoles?.includes(role)))pstcClearGuessDraft(role);else if(actualPhase==="GUESS_ENTRY"&&!isReplay)pstcRestoreGuessDraft(role,own);
    if(phase==="NOT_STARTED"){
      pstcText("transferPhaseStatus",role===view?.setup?.coordinatorRole?"READY · YOU START THE WINDOW":`READY · WAITING FOR ${String(pstcManagerName(view?.setup?.coordinatorRole||"playerOne")).toUpperCase()} TO START`);
      if(role===view?.setup?.coordinatorRole){
        pstcHidden(start,false);const missing=isReplay?[]:pstcSpinsMissing();
        // RT5-FLOW-02: until both marks are on the server the button is the waiting line: full gold edge and words (HO-027,
        // never dimmed; css/transfer.css), not tappable, and it turns into START by itself when the partner's mark arrives.
        if(missing.length){const refusedHere=Boolean(spinRefusedKey&&spinRefusedKey===pstcRequestContext()?.key&&missing.includes(view.managerRole));const label=refusedHere?"YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY":missing.includes(other)?`WAITING FOR ${String(pstcManagerName(other)).toUpperCase()} TO SPIN THE ROULETTE`:"SAVING YOUR ROULETTE SPIN…";start.textContent=label;start.dataset.rouletteWait="true";pstcDisable(start,true);pstcText("transferPhaseStatus",`READY · ${label}`);}
        else{delete start.dataset.rouletteWait;start.textContent="START 15-MINUTE WINDOW";pstcDisable(start,busy);}
      }
    }else if(phase==="WINDOW_OPEN"){
      if(isReplay){pstcText("transferPhaseStatus","REPLAY · TRANSFER WINDOW");pstcText("transferTimerDisplay","REPLAY");}
      else{const requested=state.endRequestedRoles?.includes(role);pstcText("transferPhaseStatus",requested?"TRANSFER WINDOW LIVE · YOU ASKED TO END EARLY":"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD");pstcHidden(end,false);end.textContent=requested?"EARLY END REQUESTED ✓":"REQUEST EARLY END";pstcDisable(end,busy||requested);pstcRenderTimer();}
    }else if(phase==="GUESS_ENTRY"){
      const locked=state.guessLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · GUESSES":locked?"GUESSES LOCKED · WAITING FOR YOUR RIVAL":"GUESSES · HIDDEN FROM YOUR RIVAL UNTIL YOU BOTH LOCK");pstcHidden(guessGrid,false);pstcHidden(privacy,false);if(privacy)privacy.textContent=isReplay?"Replay: read-only. Nothing new about your rival is shown.":"Enter your guesses. Your rival can't see them until you both finish.";if(!isReplay&&!locked){const card=pstcOwnGuessCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcSyncOwnGuessControls(role,true);pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY GUESSES";pstcDisable(complete,busy);}
    }else if(phase==="SIGNING_ENTRY"){
      const locked=state.signingLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · SIGNINGS":locked?"SIGNINGS LOCKED · WAITING FOR YOUR RIVAL":"SIGNINGS · ENTER YOUR FIFA 17 TRANSFERS");pstcHidden(signingGrid,false);pstcHidden(summary,false);if(summary)summary.textContent=isReplay?"Replay: your signings are read-only. Nothing here changes the game or your save.":"Both sets of guesses are locked. Enter your own signings; your rival still can't see them.";if(!isReplay&&!locked){const card=pstcOwnSigningCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY SIGNINGS";pstcDisable(complete,busy);}
    }else if(phase==="COMPLETED"){
      pstcText("transferPhaseStatus","TRANSFER CHALLENGE COMPLETE · VERDICTS REVEALED");pstcHidden(signingGrid,false);pstcHidden(guessGrid,false);pstcHidden(results,false);pstcHidden(pstcOtherSigningCard(role),false);pstcHidden(pstcOtherGuessCard(role),false);pstcPopulateRole(role,own);pstcPopulateRole(other,opponent);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);pstcRenderVerdictCard("playerOne",view?.verdicts?.playerOne||[]);pstcRenderVerdictCard("playerTwo",view?.verdicts?.playerTwo||[]);if(continueButton){continueButton.textContent="SEASON RESULTS NEXT";pstcHidden(continueButton,false);pstcDisable(continueButton,true);}
    }
    if(isReplay&&continueButton){continueButton.textContent=`CONTINUE REPLAY · ${phase.replaceAll("_"," ")}`;pstcHidden(actionBar,false);pstcHidden(continueButton,false);pstcDisable(continueButton,false);}
    pstcMarkWitness(key,phase);
    const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
  }
  function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButton";button.type="button";button.textContent="REFRESH CHALLENGE";button.addEventListener("click",event=>{event.preventDefault();if(pstcReplayPhase())return;void pstcRefresh().catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer Challenge could not be refreshed."));pstcReport("Unable to refresh Shared Transfer Challenge",error);});});actions.append(button);return button;}
  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER CHALLENGE…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} TRANSFER CHALLENGE`;status.textContent="Transfer Challenge: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN TRANSFER WINDOW";status.textContent="Transfer Challenge: window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="ENTER GUESSES";status.textContent="Transfer Challenge: guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="ENTER SIGNINGS";status.textContent="Transfer Challenge: signings";}else{button.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer Challenge: complete";}if(rouletteLoadError)status.textContent="The roulette could not load. Check the connection and tap again.";return true;}
  // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
  // r87 Russian Roster Roulette (js/rosterRouletteStep.js): before this season's Transfer Challenge opens, this manager does
  // the season's roulette once (board from season 2, both spins, the release). It decides for itself whether it applies (a
  // Showdown confirmed on r87 or later, not done yet on this browser) and never rejects. false = he went back to Home, or the
  // step itself could not load: the window then stays shut with a TRY AGAIN line on the dashboard (red team R87-B-02).
  // The confirm time comes with the Setup read; only a manager whose Setup state came from his own confirm tap reads it once.
  async function pstcRouletteFirst(request){
    rouletteLoadError=false;
    try{
      if(!view||!view.managerRole||!request)return true;
      let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
      if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
      // No confirm time = a Showdown the roulette never applies to (the step's own rule), so nothing is loaded.
      if(!Number.isFinite(confirmedAtMs)){rouletteGate={key:request.key,applies:false};await pstcAfterSpin(request);return true;}
      const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")},confirmedAtMs,phase:view.state?.phase||"NOT_STARTED",
        verdicts:season=>pstcRouletteVerdicts(request,season)};
      let timer;const step=await Promise.race([pstcLoadScript("roster-roulette-step","js/rosterRouletteStep.js",()=>root.CareerModeRosterRouletteStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
      if(!step){rouletteLoadError=true;return false;}
      rouletteGate={key:request.key,applies:pstcRouletteAppliesTo(confirmedAtMs,step)};
      // Done on this browser before (or the step does not run for this manager): his mark still goes to the server once.
      if(!step.decide(ctx)){await pstcAfterSpin(request);return true;}
      const go=await step.runBeforeTransfers(ctx);
      if(go)await pstcAfterSpin(request);
      return go;
    }catch(_error){rouletteLoadError=true;return false;}
  }
  // r87 roulette boards: each finished season's verdicts (both managers' signings, overall and release) are kept on this
  // phone when the Transfer Challenge shows them, so the next spins build their boards with no read. A season not kept
  // here (another phone, cleared storage) costs one Transfer Challenge read, once.
  const PSTC_ROULETTE_VERDICTS_KEY="careerModeShowdown.rouletteVerdicts.v1",PSTC_ROULETTE_VERDICTS_MAX=40;
  function pstcVerdictRows(rows){return Array.isArray(rows)?rows.map(row=>({slot:row.slot,name:row.name,overall:Number.isInteger(row.overall)?row.overall:null,position:SIGNING_POSITIONS.includes(row.position)?row.position:null,release:row.release===true})):null;}
  function pstcVerdictList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_VERDICTS_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
  function pstcKeptVerdicts(rivalryId,season){const found=pstcVerdictList().find(item=>item[0]===`${rivalryId}|${season}`),value=found&&found[1];return value&&Array.isArray(value.playerOne)&&Array.isArray(value.playerTwo)?value:null;}
  function pstcKeepVerdicts(rivalryId,season,verdicts){
    const value={playerOne:pstcVerdictRows(verdicts?.playerOne),playerTwo:pstcVerdictRows(verdicts?.playerTwo)};if(!rivalryId||!value.playerOne||!value.playerTwo)return null;
    try{const key=`${rivalryId}|${season}`,list=pstcVerdictList().filter(item=>item[0]!==key);list.push([key,value]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_VERDICTS_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
    return value;
  }
  async function pstcRouletteVerdicts(request,season){
    try{
      const kept=pstcKeptVerdicts(request.rivalryId,season);if(kept)return {ok:true,verdicts:kept};
      const provided=await pstcProviderOptions(request,true);if(!provided?.options)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
      const result=await provider.read({...provided.options,seasonNumber:season});
      if(!result||result.ok!==true)return {ok:false,code:result?.code||"TRANSFER_PROVIDER_FAILED"};
      if(result.state?.phase!=="COMPLETED"||!result.verdicts)return {ok:false,code:"TRANSFER_NOT_COMPLETED"};
      const value=pstcKeepVerdicts(request.rivalryId,season,result.verdicts);
      return value?{ok:true,verdicts:value}:{ok:false,code:"TRANSFER_PROVIDER_STATE_INVALID"};
    }catch(error){return {ok:false,code:error?.code||"TRANSFER_PROVIDER_FAILED"};}
  }
  // ---- RT5-FLOW-02: both spins before the shared window ----
  // The roulette applies to a Showdown confirmed at or after the step's RRR_FROM_MS while it is not switched off; any other
  // season (an older Showdown) passes by itself and never writes or waits for a mark.
  // The provider's own eligibility rule (it enforces START with it), so the screen and the provider can never disagree.
  function pstcRouletteAppliesTo(confirmedAtMs,step){return Boolean(step&&typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(confirmedAtMs));}
  // The same answer START gets from the provider: the season is roulette-eligible, or any mark is already stored. The second
  // case covers the roulette being switched off (or the season otherwise turning ineligible) after one manager's mark was
  // saved: the provider still waits for both, so the missing manager's phone writes his own mark when it reaches this step,
  // with no roulette shown (pstcAfterSpin), and the coordinator's START flips through the listener as usual (Codex P2 #1101).
  function pstcRouletteApplies(request=pstcRequestContext()){if(pstcSpunRoles().length>0)return true;if(request&&rouletteGate.key===request.key)return rouletteGate.applies;return Boolean(typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(pstcSetupState()?.setupUpdatedAtMs));}
  function pstcSpunRoles(){return Array.isArray(view?.spunRoles)?view.spunRoles.filter(role=>role==="playerOne"||role==="playerTwo"):[];}
  // The roles whose mark is still missing for this season's window (empty once it opened, or when the roulette does not apply).
  function pstcSpinsMissing(){
    const request=pstcRequestContext();if(!view||view.state||!request||viewContextKey!==request.key||!pstcRouletteApplies(request))return [];
    const spun=pstcSpunRoles();return ["playerOne","playerTwo"].filter(role=>!spun.includes(role));
  }
  const SPIN_WRITE_WAIT_MS=8000;
  async function pstcAfterSpin(request){
    if(!request||!pstcRouletteApplies(request)||view?.state)return;
    spinPendingKey=request.key;
    let timer;await Promise.race([pstcMarkSpun(request),new Promise(resolve=>{timer=root.setTimeout(resolve,SPIN_WRITE_WAIT_MS);})]).finally(()=>root.clearTimeout(timer));
  }
  // One merge write of this manager's own mark (no read); idempotent. On success the view shows it at once. A refused write
  // (Rules on the server that do not know the marks: they must be deployed with or before this client) is not retried on every
  // check; the screen keeps waiting and says to reload, which writes it once more. Any other failure stays pending.
  function pstcMarkSpun(request){
    if(spinWriting)return spinWriting;
    const role=view?.managerRole;
    if(!request||spinPendingKey!==request.key||!role||viewContextKey!==request.key||view.state||pstcSpunRoles().includes(role)){if(view?.state||pstcSpunRoles().includes(role))spinPendingKey="";return Promise.resolve(false);}
    const run=(async()=>{
      const provided=await pstcProviderOptions(request,true);if(!provided?.options||!pstcRequestMatches(request))return false;
      const result=await provider.markSpun({...provided.options,managerRole:role});
      if(!pstcRequestMatches(request))return false;
      if(result&&result.ok===true){
        spinPendingKey="";spinRefusedKey="";
        if(view&&viewContextKey===request.key&&!view.state){const spun=pstcSpunRoles();view={...view,spunRoles:["playerOne","playerTwo"].filter(item=>item===role||spun.includes(item))};}
        pstcRender();return true;
      }
      if(/permission/i.test(String(result?.code||""))&&view&&!view.state){spinPendingKey="";spinRefusedKey=request.key;pstcRender();}
      return false;
    })().catch(()=>false).finally(()=>{if(spinWriting===run)spinWriting=null;});
    spinWriting=run;return run;
  }
  function pstcCloseRoulette(){try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}}
  function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
  async function pstcOpenNow(){if(!pstcSharedMarker())return false;await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");if(!await pstcRouletteFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}const shown=await root.navigateTo("transferChallenge");pstcCloseRoulette();if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
  async function pstcHandleAction(id){
    if(id==="seasonPrimaryAction")return pstcOpen();
    if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
    if(pstcReplayPhase())return false;
    if(id==="startTransferTimer"){if(pstcSpinsMissing().length)return false;return pstcMutate("startWindow");}
    if(id==="endTransferTimer")return pstcMutate("requestEndWindow");
    if(id==="completeTransferChallenge"){
      const phase=view?.state?.phase,role=view?.managerRole;if(phase==="GUESS_ENTRY"){const guesses=pstcBuildGuesses(role);if(!await pstcConfirmPartialLock(guesses.length,"guesses"))return false;return pstcMutate("lockGuesses",{guesses});}if(phase==="SIGNING_ENTRY"){const signings=pstcBuildSignings(role);if(!await pstcConfirmPartialLock(signings.length,"signings"))return false;return pstcMutate("lockSignings",{signings});}pstcFail("TRANSFER_PHASE_INVALID");
    }
    if(id==="continueFromTransfers"){pstcSetError("Season results are not open yet. Tap REFRESH, then try again.");return false;}
    return false;
  }
  function pstcCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pstcSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pstcHandleAction(target.id).catch(error=>{pstcSetError(pstcErrorText(error,"Shared Transfer Challenge failed."));if(!pstcFormMistake(error))pstcReport("Shared Transfer Challenge action failed",error);});}
  // r87: a form mistake caught on this phone is shown on the card only; a second toast covered the signing rows on phones.
  function pstcFormMistake(error){return Boolean(error)&&error.providerResult!==true&&(error.code==="TRANSFER_SIGNINGS_INVALID"||error.code==="TRANSFER_GUESSES_INVALID");}
  async function pstcTick(light=false){
    if(!pstcSharedMarker()||root.document?.visibilityState==="hidden")return;
    const currentKey=pstcCurrentContextKey();if(viewContextKey&&(!currentKey||viewContextKey!==currentKey))pstcClearCachedContext();
    // RS-04 (r87): a COMPLETED view is final, except while this page has neither its verdicts nor a kept copy (a post-lock refresh
    // that failed): then the next check reads it once more, while both managers are still on this screen, instead of the roulette
    // paying a slower read of it next season on one phone only.
    if(view?.state?.phase==="COMPLETED"&&viewContextKey&&currentKey&&viewContextKey===currentKey&&(view.verdicts||pstcKeptVerdicts(view.rivalryId,view.seasonNumber))){pstcDecorateDashboard();return;}
    try{if(!pstcConfirmedShared()||!pstcCareerReady()){await pstcEnsureDependencies();await setupApi.refresh();await careerApi.refresh();}if(pstcConfirmedShared()&&pstcCareerReady()&&!busy){const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden")){if(light!==true)pstcScreenFresh();await pstcRefresh(light===true,false);}else if(!view)await pstcRefresh(false,false);else pstcDecorateDashboard();}
      // RT5-FLOW-02: a mark that did not reach the server is written again (one write, no read) while the window is still shut.
      // On this screen the roulette step is behind him, so a partner's mark arriving while his own is missing (the season turned
      // ineligible after one mark) arms his own one write here as well, unless the server refused it on this page.
      const request=pstcRequestContext();if(request&&!busy&&view&&!view.state&&viewContextKey===request.key&&spinPendingKey!==request.key&&spinRefusedKey!==request.key&&view.managerRole&&pstcSpunRoles().length&&!pstcSpunRoles().includes(view.managerRole))spinPendingKey=request.key;
      if(request&&spinPendingKey===request.key&&!busy&&view&&!view.state)void pstcMarkSpun(request);
    }catch(_error){}
  }
  // Read-only: the fast lane only calls pstcTick (the same provider read as REFRESH CHALLENGE), never a write.
  function pstcWaitingKey(){
    if(!view||!view.managerRole||!pstcTransferScreenVisible()||pstcReplayPhase())return "";
    const state=view.state||{phase:"NOT_STARTED"},role=view.managerRole,other=role==="playerOne"?"playerTwo":"playerOne",has=(list,item)=>Array.isArray(list)&&list.includes(item);
    if((state.phase||"NOT_STARTED")==="NOT_STARTED"&&view.setup?.coordinatorRole&&role!==view.setup.coordinatorRole)return `${viewContextKey}|start`;
    if(state.phase==="WINDOW_OPEN"&&has(state.endRequestedRoles,role)&&!has(state.endRequestedRoles,other))return `${viewContextKey}|end`;
    if(state.phase==="GUESS_ENTRY"&&has(state.guessLockedRoles,role))return `${viewContextKey}|guesses`;
    if(state.phase==="SIGNING_ENTRY"&&has(state.signingLockedRoles,role))return `${viewContextKey}|signings`;
    return "";
  }
  function pstcFastPollDue(){const key=pstcWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  function pstcWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pstcWaitingKey()||pstcLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`:null)(pstcRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pstcWaitingKey()&&pstcLiveScreen());}catch(_error){relaxed=false;}budget.watchWaitPoint("transfer",path,pstcWaitWake,{relaxed});}
  // r75: the 15 s check of the visible Transfer screen always reads the shared challenge from the server, so a partner's
  // lock still shows within one poll on the screen the manager is looking at; checks from other screens reuse recent reads.
  // r84: the listener also watches while the window, guesses or signings are open on screen (not only after this manager's own
  // move): 15 s fresh reads of this document were ~32 billed reads/min for both phones over a 25-40 minute transfer window.
  // r84 trim: also before the window starts (no challenge yet), the most expensive idle: the coordinator's own START screen
  // re-read the context every 15 s; the listener now watches the (still missing) challenge document instead.
  function pstcLiveScreen(){try{return Boolean(view&&view.managerRole&&pstcTransferScreenVisible()&&!pstcReplayPhase()&&(!view.state||["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"].includes(view.state.phase)));}catch(_error){return false;}}
  function pstcScreenFresh(){try{const request=pstcRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
  function pstcWaitWake(){if(!busy){void pstcTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pstcTick(true);},400);}
  // r84 trim: like Results and Commit, the 3 s fallback check stands down while the wait listener on this exact challenge is
  // healthy; the listener's delivery wakes pstcTick at once and the 15 s check still runs. Each fallback check re-ran the
  // read-only transaction (challenge, rivalry, session, own role) about 20 times a minute on the waiting phone.
  function pstcWaitHealthy(){const request=pstcRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`);}
  function pstcFastTick(){pstcWatchWait();if(pstcWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pstcFastPollDue())return;void pstcTick(true);}
  // Listen during bubbling so selector target handlers normalize the ID before the synchronous draft save.
  // Red team R87-B-04: a second tab of the same signing entry saved a newer draft. This tab takes it over before its next
  // autosave, so a stale form never writes over the newer signings (the browser sends this event only to the other tabs).
  function pstcSigningDraftStorage(event){const role=view?.managerRole,key=role&&pstcSigningDraftKey(role);if(!key||event?.key!==key||!event.newValue)return;if(view?.state?.phase!=="SIGNING_ENTRY"||view.state.signingLockedRoles?.includes(role)||pstcReplayPhase())return;pstcRestoreSigningDraft(role,view.ownInputs||null,true);}
  function pstcSigningDraftChange(event){const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!target.id.startsWith(`${pstcRolePrefix(role)}Signing`))return;if(view?.state?.phase==="SIGNING_ENTRY"&&!view.state.signingLockedRoles?.includes(role))pstcSaveSigningDraft(role);}
  function pstcTimerTick(){if(!pstcSharedMarker()||pstcReplayPhase()||pstcExpiryPaused())return;const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden"))pstcRenderTimer();}
  function pstcVisibilityChange(){
    if(!pstcSharedMarker())return;
    if(root.document?.visibilityState==="hidden"){if(view?.state?.phase==="WINDOW_OPEN")expiryNeedsAuthority=true;return;}
    if(view?.state?.phase!=="WINDOW_OPEN"||pstcReplayPhase()){expiryNeedsAuthority=false;void pstcTick();return;}
    // Keep the shared deadline; refresh its clock and authority before expiry may act again.
    pstcClearClock();expiryNeedsAuthority=true;pstcScreenFresh();void pstcRefresh().catch(()=>{});
  }
  function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("input",pstcSigningDraftChange);root.document.addEventListener("change",pstcSigningDraftChange);if(typeof root.addEventListener==="function")root.addEventListener("storage",pstcSigningDraftStorage);root.document.addEventListener("input",pstcGuessDraftChange,true);root.document.addEventListener("change",pstcGuessDraftChange,true);root.document.addEventListener("visibilitychange",pstcVisibilityChange);}root.addEventListener?.("online",pstcVisibilityChange);root.addEventListener?.("career-mode-shared-season-cursor-change",()=>{pstcClearCachedContext();void pstcTick();});if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pstcTick(),POLL_MS);timerLoop=root.setInterval(pstcTimerTick,TIMER_MS);root.setInterval(pstcFastTick,FAST_POLL_MS);}if(pstcSharedMarker())void pstcTick();return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),spinsMissing:()=>[...pstcSpinsMissing()],rouletteAppliesTo:pstcRouletteAppliesTo,install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute,canResumeResults:pstcCanResumeResults,rememberResultsView:pstcRememberResultsView});
});
