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
  const EXPIRY_RETRY_MS=30000;
  const CLOCK_REFRESH_MS=5*60*1000;
  const CONTROL_IDS=Object.freeze(["seasonPrimaryAction","startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"]);
  const PHASE_PROGRESS=Object.freeze({NOT_STARTED:"window",WINDOW_OPEN:"window",GUESS_ENTRY:"guess_entry",SIGNING_ENTRY:"signing_entry",COMPLETED:"completed"});
  const REPLAY_PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  let installed=false,busy=false,provider=null,setupApi=null,careerApi=null,view=null,pollTimer=null,timerLoop=null,openedKey="",expiryAttemptRevision=-1,expiryAttemptAt=0,providerChain=Promise.resolve(),refreshPromise=null,refreshContextKey="",viewContextKey="",replayContextKey="",replayQueue=[],openPromise=null;
  let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;
  const witnessedByContext=new Map();
  let fastWaitKey="",fastWaitSince=0;

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
  function pstcSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function pstcCareerReady(){try{const career=careerApi?.getState?.();return Boolean(career&&career.state&&career.state.phase==="CAREER_START_READY"&&career.state.revision===2);}catch(_error){return false;}}
  function pstcConfirmedShared(){const state=pstcSetupState();return Boolean(pstcSharedMarker()&&state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pstcSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pstcShowdown()?.currentRound,season=Number(pstcSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pstcFail("TRANSFER_SEASON_INVALID");return season;}
  function pstcLocalContextKey(){const showdown=pstcShowdown(),id=String(showdown?.id||showdown?.saveId||"").trim();let season;try{season=pstcSeason();}catch(_error){return "";}return id&&Number.isInteger(season)&&season>0?`${id}:${season}`:"";}
  function pstcBoundContextKey(rivalryId,season,localContextKey=pstcLocalContextKey()){const local=String(localContextKey||"").trim(),remote=String(rivalryId||"").trim(),round=Number(season);return local&&remote&&Number.isInteger(round)&&round>0?`${local}|${remote}:${round}`:"";}
  function pstcCurrentContextKey(){const showdown=pstcShowdown(),setup=pstcSetupState(),rivalry=showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"";let season;try{season=pstcSeason();}catch(_error){return "";}return pstcBoundContextKey(rivalry,season);}
  function pstcRequestContext(){const showdown=pstcShowdown(),localKey=pstcLocalContextKey(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=pstcSeason();}catch(_error){return null;}const key=pstcBoundContextKey(rivalryId,seasonNumber,localKey);return key?Object.freeze({key,localKey,rivalryId,seasonNumber}):null;}
  function pstcRequestMatches(request,ctx=null){if(!request||pstcCurrentContextKey()!==request.key)return false;if(!ctx)return true;return String(ctx.state?.rivalryId||"").trim()===request.rivalryId&&Number(ctx.options?.seasonNumber)===request.seasonNumber;}
  function pstcBindView(result,ctx,request){if(!pstcRequestMatches(request,ctx))return false;view={...result,setup:ctx.state.setup,rivalryId:ctx.state.rivalryId};viewContextKey=request.key;return true;}
  function pstcClearClock(){clockContextKey="";clockServerEpochMs=0;clockPerformanceMs=0;clockRefreshPerformanceMs=0;}
  function pstcClearCachedContext(){view=null;viewContextKey="";openedKey="";replayContextKey="";replayQueue=[];expiryAttemptRevision=-1;expiryAttemptAt=0;pstcClearClock();}
  function pstcMonotonicNow(){const value=Number(root.performance&&typeof root.performance.now==="function"?root.performance.now():Number.NaN);if(!Number.isFinite(value)||value<0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","A monotonic browser clock is required for the shared Transfer Challenge.");return value;}
  function pstcClockReady(request){return Boolean(request&&clockContextKey===request.key&&Number.isFinite(clockServerEpochMs)&&clockServerEpochMs>0&&Number.isFinite(clockPerformanceMs));}
  function pstcAuthoritativeNow(request=pstcRequestContext()){if(!pstcClockReady(request))pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Server time has not been established for this shared Transfer Challenge.");return Math.floor(clockServerEpochMs+Math.max(0,pstcMonotonicNow()-clockPerformanceMs));}
  async function pstcEnsureServerClock(user,request){
    if(!request||!pstcRequestMatches(request))return false;
    const monotonicNow=pstcMonotonicNow();
    if(pstcClockReady(request)&&Number.isFinite(clockRefreshPerformanceMs)&&monotonicNow-clockRefreshPerformanceMs<CLOCK_REFRESH_MS)return true;
    if(!user||typeof user.getIdTokenResult!=="function")pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Connected account server time is unavailable.");
    const token=await user.getIdTokenResult(true);
    if(!pstcRequestMatches(request))return false;
    const issuedAtEpochMs=Date.parse(String(token?.issuedAtTime||""));
    if(!Number.isFinite(issuedAtEpochMs)||issuedAtEpochMs<=0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","The connected account did not provide a valid server time anchor.");
    const receiptPerformanceMs=pstcMonotonicNow();
    clockContextKey=request.key;
    clockServerEpochMs=issuedAtEpochMs;
    clockPerformanceMs=receiptPerformanceMs;
    clockRefreshPerformanceMs=receiptPerformanceMs;
    return true;
  }
  function pstcCanRoute(){const request=pstcRequestContext();return Boolean(request&&view&&viewContextKey===request.key&&pstcRequestMatches(request)&&pstcConfirmedShared()&&pstcCareerReady()&&String(view.rivalryId||"")===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber);}
  function pstcWitnessSet(key){if(!witnessedByContext.has(key))witnessedByContext.set(key,new Set());return witnessedByContext.get(key);}
  function pstcTransferScreenVisible(){const screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(screen&&!screen.classList.contains("hidden"));}
  function pstcReplayPhase(key=viewContextKey){return replayContextKey===key&&replayQueue.length?replayQueue[0]:null;}
  function pstcPrepareReplay(){
    const key=viewContextKey,actual=view?.state?.phase;
    if(!key||!REPLAY_PHASES.includes(actual)){replayContextKey="";replayQueue=[];return false;}
    if(replayContextKey===key&&replayQueue.length)return true;
    const actualIndex=REPLAY_PHASES.indexOf(actual),witnessed=pstcWitnessSet(key),missing=REPLAY_PHASES.slice(0,actualIndex).filter(phase=>!witnessed.has(phase));
    replayContextKey=missing.length?key:"";replayQueue=missing;return missing.length>0;
  }
  function pstcMarkWitness(key,phase){if(key&&REPLAY_PHASES.includes(phase)&&pstcTransferScreenVisible())pstcWitnessSet(key).add(phase);}
  function pstcAdvanceReplay(){if(!pstcReplayPhase())return false;replayQueue.shift();if(!replayQueue.length){replayContextKey="";pstcPrepareReplay();}pstcRender();return true;}
  function pstcRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pstcFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `transfer_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and Career Start instead of re-reading them.
  async function pstcProviderOptions(request=pstcRequestContext(),light=false){
    if(!pstcSharedMarker())pstcFail("TRANSFER_SHARED_MODE_REQUIRED");
    if(!request||!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    await pstcEnsureDependencies();
    const reuse=light===true&&pstcConfirmedShared()&&pstcCareerReady();
    if(!reuse)await setupApi.refresh();
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const state=setupApi.getState();
    if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)pstcFail("TRANSFER_SETUP_NOT_CONFIRMED","Both managers must finish Shared Setup before the Transfer Challenge.");
    if(!reuse)await careerApi.refresh();
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const career=careerApi.getState();
    if(!career||!career.state||career.state.phase!=="CAREER_START_READY"||career.state.revision!==2)pstcFail("TRANSFER_CAREER_START_NOT_READY","Both managers must finish Career Start before the Transfer Challenge.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=await runtime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    if(!await pstcEnsureServerClock(services.auth.currentUser,request))pstcFail("TRANSFER_CONTEXT_STALE");
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:pstcAuthoritativeNow(request)}};
  }
  function pstcResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The shared Transfer Challenge request was rejected.");error.code=result&&result.code||"TRANSFER_PROVIDER_FAILED";error.providerResult=true;throw error;}
  function pstcQueueProvider(task){const queued=providerChain.then(task,task);providerChain=queued.catch(()=>{});return queued;}
  async function pstcRefreshNow(request=pstcRequestContext(),light=false){
    if(!request)return null;
    const ctx=await pstcProviderOptions(request,light);if(!pstcRequestMatches(request,ctx))return null;
    const result=pstcResultError(await provider.read(ctx.options),"The shared Transfer Challenge could not be read.");if(!pstcRequestMatches(request,ctx))return null;
    if(!pstcBindView(result,ctx,request))return null;if(pstcTransferScreenVisible())pstcPrepareReplay();pstcSetError("");pstcRender();pstcDecorateDashboard();return view;
  }
  function pstcRefresh(light=false){const request=pstcRequestContext();if(!request)return Promise.resolve(null);if(viewContextKey&&viewContextKey!==request.key)pstcClearCachedContext();if(refreshPromise&&refreshContextKey===request.key)return refreshPromise;const current=pstcQueueProvider(()=>pstcRefreshNow(request,light===true));refreshPromise=current;refreshContextKey=request.key;current.then(()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";}},()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";}});return current;}
  // Job 21: when both managers tap at once the loser's write is rejected by the Rules (permission-denied) or by the provider
  // (stale revision / phase already moved). Re-read once; if the refreshed state already shows the outcome, finish silently,
  // otherwise retry the same method once with a fresh revision and operation id. A real denial surfaces after that one retry.
  const PSTC_RACE_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied","TRANSFER_STALE_BASE_REVISION","TRANSFER_PHASE_INVALID","TRANSFER_END_ALREADY_REQUESTED","TRANSFER_ALREADY_STARTED","TRANSFER_GUESSES_ALREADY_LOCKED","TRANSFER_SIGNINGS_ALREADY_LOCKED"]);
  function pstcOutcomeShown(method,fresh){
    const state=fresh&&fresh.state,role=fresh&&fresh.managerRole;if(!state)return false;
    if(method==="startWindow")return true;
    if(method==="requestEndWindow")return state.phase!=="WINDOW_OPEN"||Boolean(state.endRequestedRoles?.includes(role));
    if(method==="advanceExpiredWindow")return state.phase!=="WINDOW_OPEN";
    if(method==="lockGuesses")return state.phase!=="GUESS_ENTRY"||Boolean(state.guessLockedRoles?.includes(role));
    if(method==="lockSignings")return state.phase==="COMPLETED"||Boolean(state.signingLockedRoles?.includes(role));
    return false;
  }
  // BUG-3: the provider rejects a signing name over 80 characters with only a code, so the inputs are capped to the same limit and the known codes read as plain sentences.
  const SIGNING_NAME_MAX=80;
  const PLAIN_PROVIDER_CODES=Object.freeze({TRANSFER_SIGNINGS_INVALID:"Check each signing: a player name (80 characters at most), a previous league and a nationality.",TRANSFER_GUESSES_INVALID:"Check each guess: choose a FIFA 17 league or nationality."});
  function pstcCapSigningNames(){if(!root.document)return;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const input=pstcField(`${prefix}Signing${i}Name`);if(input&&typeof input.setAttribute==="function")input.setAttribute("maxlength",String(SIGNING_NAME_MAX));}}
  function pstcErrorText(error,fallback){const code=String(error?.code||""),message=String(error?.message||"");if(error&&error.providerResult!==true&&message&&message!==code)return message;if(PLAIN_PROVIDER_CODES[code])return PLAIN_PROVIDER_CODES[code];return code||message||fallback;}
  async function pstcMutate(method,payload={}){
    const request=pstcRequestContext();if(!request||busy||pstcReplayPhase())return false;busy=true;pstcSetError("");pstcRender();
    try{
      return await pstcQueueProvider(async()=>{
        for(let attempt=0;;attempt+=1){
          if(!pstcRequestMatches(request))return false;
          const ctx=await pstcProviderOptions(request);if(!pstcRequestMatches(request,ctx))return false;
          const current=pstcResultError(await provider.read(ctx.options),"The shared Transfer Challenge could not be refreshed.");if(!pstcRequestMatches(request,ctx))return false;
          if(attempt>0&&pstcOutcomeShown(method,current)){if(pstcBindView(current,ctx,request)){pstcSetError("");if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}return true;}
          const options={...ctx.options,nowEpochMs:pstcAuthoritativeNow(request),operationId:pstcRandomOperationId(),baseRevision:Number(current.revision||0),...payload};
          let result;
          try{result=pstcResultError(await provider[method](options),"The shared Transfer Challenge update was rejected.");}
          catch(error){
            if(!PSTC_RACE_CODES.includes(error&&error.code)||attempt>0)throw error;
            if(method==="advanceExpiredWindow"){try{await pstcRefreshNow(request);}catch(_refreshError){}return true;}
            continue;
          }
          if(!pstcRequestMatches(request,ctx))return true;
          if(!pstcBindView(result,ctx,request))return true;if(method==="lockSignings")pstcClearSigningDraft(view.managerRole);pstcSetError("");
          if(result.needsRefresh||result.state?.phase==="COMPLETED")await pstcRefreshNow(request);else{if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}
          return true;
        }
      });
    }catch(error){if(pstcRequestMatches(request)){pstcSetError(pstcErrorText(error,"The shared Transfer Challenge update failed."));pstcReport("Unable to update Shared Transfer Challenge",error);}return false;}
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
      const name=pstcField(`${signing}Signing${i}Name`),league=pstcField(`${signing}Signing${i}League`),nationality=pstcField(`${signing}Signing${i}Nationality`),type=pstcField(`${guess}Guess${i}Type`),value=pstcField(`${guess}Guess${i}Value`);
      if(name)name.value="";pstcSetSelector(league,"league","");pstcSetSelector(nationality,"nationality","");if(type)type.value="";if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.disabled=true;}
    }
  }
  function pstcResetForContext(key,role){const draftKey=pstcSigningDraftKey(role);if(signingDraftKey&&draftKey&&signingDraftKey!==draftKey)pstcRemoveSigningDraft(signingDraftKey);if(draftKey)signingDraftKey=draftKey;if(openedKey===key)return;openedKey=key;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`);if(name&&typeof name.setAttribute==="function")name.setAttribute("maxlength","80");}expiryAttemptRevision=-1;expiryAttemptAt=0;pstcClearRole("playerOne");pstcClearRole("playerTwo");pstcSetError("");}
  const PSTC_MAX_ROWS=3;
  // A lock cannot be undone, so a partly filled form asks first. Cancel (or any confirm failure) means do nothing; no confirm function means lock as before.
  function pstcConfirmPartialLock(filled,noun){
    if(filled>=PSTC_MAX_ROWS||typeof root.confirm!=="function")return true;
    return root.confirm(`Lock ${filled} of ${PSTC_MAX_ROWS} ${noun}? You can't change them after locking.`)!==false;
  }
  function pstcBuildGuesses(role){
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`),kind=String(type?.value||""),id=pstcCanonical(value),display=String(value?.value||"").trim();if(!kind&&!display)continue;if((kind!=="league"&&kind!=="nationality")||!display||!id)pstcFail("TRANSFER_GUESSES_INVALID",`Complete guess ${i} with a FIFA 17 league or nationality.`);rows.push({slot:i,type:kind,valueId:id});}
    return rows;
  }
  function pstcBuildSignings(role){
    const prefix=pstcRolePrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`),league=pstcField(`${prefix}Signing${i}League`),nationality=pstcField(`${prefix}Signing${i}Nationality`),player=String(name?.value||"").trim(),leagueId=pstcCanonical(league),nationalityId=pstcCanonical(nationality),hasAny=Boolean(player||String(league?.value||"").trim()||String(nationality?.value||"").trim());if(!hasAny)continue;if(!player||!leagueId||!nationalityId)pstcFail("TRANSFER_SIGNINGS_INVALID",`Complete signing ${i} with player name, previous league and nationality.`);rows.push({slot:i,name:player,leagueId,nationalityId});}
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
  function pstcPopulateSignings(role,signings){const prefix=pstcRolePrefix(role);for(let i=1;i<=3;i+=1){const row=(signings||[]).find(item=>item.slot===i),name=pstcField(`${prefix}Signing${i}Name`);if(name)name.value=row?.name||"";pstcSetSelector(pstcField(`${prefix}Signing${i}League`),"league",row?.leagueId||"");pstcSetSelector(pstcField(`${prefix}Signing${i}Nationality`),"nationality",row?.nationalityId||"");}}
  function pstcPopulateRole(role,inputs){if(!inputs)return;if(inputs.guesses)pstcPopulateGuesses(role,inputs.guesses);if(inputs.signings)pstcPopulateSignings(role,inputs.signings);}
  let signingDraftKey="";
  function pstcSigningDraftKey(role){const request=pstcRequestContext();return request&&role?(`cms.signingDraft.v1:${request.rivalryId}:${request.seasonNumber}:${role}`):"";}
  function pstcRemoveSigningDraft(key){try{if(key&&root.localStorage)root.localStorage.removeItem(key);}catch(_error){}}
  function pstcClearSigningDraft(role){const key=pstcSigningDraftKey(role);pstcRemoveSigningDraft(key);if(signingDraftKey===key)signingDraftKey="";}
  function pstcSaveSigningDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="SIGNING_ENTRY"||state.signingLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase())return false;
    const prefix=pstcRolePrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const name=pstcField(`${prefix}Signing${slot}Name`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);rows.push({slot,name:String(name?.value||""),leagueId:pstcCanonical(league),league:String(league?.value||""),nationalityId:pstcCanonical(nationality),nationality:String(nationality?.value||"")});}
    try{const key=pstcSigningDraftKey(role);if(!key||!root.localStorage)return false;root.localStorage.setItem(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows}));signingDraftKey=key;return true;}catch(_error){return false;}
  }
  function pstcRestoreSigningDraft(role,own){
    const key=pstcSigningDraftKey(role),request=pstcRequestContext(),state=view?.state;
    if(!key||!request||!state||state.phase!=="SIGNING_ENTRY")return false;
    const shared=Array.isArray(own?.signings)?own.signings:[];
    if(state.signingLockedRoles?.includes(role)||shared.length){pstcRemoveSigningDraft(key);return false;}
    let draft;try{draft=JSON.parse(root.localStorage?.getItem(key)||"null");}catch(_error){return false;}
    if(!draft||draft.version!==1||draft.rivalryId!==request.rivalryId||Number(draft.seasonNumber)!==request.seasonNumber||draft.role!==role||!Array.isArray(draft.rows))return false;
    const prefix=pstcRolePrefix(role);
    for(let slot=1;slot<=3;slot+=1){if(shared.some(row=>Number(row.slot)===slot))continue;const row=draft.rows.find(item=>Number(item.slot)===slot);if(!row)continue;const name=pstcField(`${prefix}Signing${slot}Name`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);if(name&&!String(name.value||""))name.value=String(row.name||"");if(league&&!String(league.value||"")){if(row.leagueId)pstcSetSelector(league,"league",row.leagueId);else league.value=String(row.league||"");}if(nationality&&!String(nationality.value||"")){if(row.nationalityId)pstcSetSelector(nationality,"nationality",row.nationalityId);else nationality.value=String(row.nationality||"");}}
    signingDraftKey=key;return true;
  }
  function pstcDisableRole(role,disabled){const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){[`${signing}Signing${i}Name`,`${signing}Signing${i}League`,`${signing}Signing${i}Nationality`,`${guess}Guess${i}Type`,`${guess}Guess${i}Value`].forEach(id=>pstcDisable(pstcField(id),disabled));}}
  function pstcRenderVerdictCard(role,rows){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;target.append(heading);if(!rows||!rows.length){const empty=root.document.createElement("p");empty.textContent="No signings were entered.";target.append(empty);return;}rows.forEach(row=>{const item=root.document.createElement("p"),name=root.document.createElement("strong"),status=root.document.createElement("span");name.textContent=row.name;status.textContent=row.release?"RELEASE · MATCHED BY RIVAL GUESS":"KEEP · NO RIVAL GUESS MATCH";item.append(name,root.document.createTextNode(" — "),status);target.append(item);});}
  function pstcRenderProgress(phase){
    const localPhase=PHASE_PROGRESS[phase]||"window",order=["window","guess_entry","signing_entry","completed"],index=order.indexOf(localPhase),screen=pstcField("transferChallenge");
    if(screen)screen.dataset.transferPhase=localPhase;
    root.document?.querySelectorAll?.("#transferPhaseNavigator [data-transfer-phase-step]").forEach(step=>{const stepIndex=order.indexOf(step.dataset.transferPhaseStep);step.classList.toggle("active",stepIndex===index);step.classList.toggle("done",stepIndex>=0&&stepIndex<index);});
    const copy={NOT_STARTED:"Shared Transfer Window · the coordinator starts one shared 15-minute window.",WINDOW_OPEN:"Shared Transfer Window · both managers see the same clock and may jointly end it early.",GUESS_ENTRY:"Private Guess Entry · enter only your guesses; your rival cannot read them yet.",SIGNING_ENTRY:"Private Signing Entry · guesses are locked; enter only your completed FIFA 17 signings.",COMPLETED:"Shared Transfer Verdicts · both private sides are now revealed and evaluated identically."};
    pstcText("transferPhaseIntro",copy[phase]||copy.NOT_STARTED);
  }
  function pstcRenderTimer(){
    const timer=pstcField("transferTimerDisplay"),state=view?.state;if(!timer)return;
    if(pstcReplayPhase()){timer.textContent="REPLAY";return;}
    if(!state||state.phase!=="WINDOW_OPEN"){timer.textContent=state?"00:00":"15:00";return;}
    const request=pstcRequestContext();
    if(!request||!pstcClockReady(request)){timer.textContent="SYNC";return;}
    const now=pstcAuthoritativeNow(request),deadline=Number(state.startedAtEpochMs)+15*60*1000,remaining=Math.max(0,Math.ceil((deadline-now)/1000)),minutes=Math.floor(remaining/60),seconds=remaining%60;timer.textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    const revision=Number(view.revision),retryAllowed=revision!==expiryAttemptRevision||now-expiryAttemptAt>=EXPIRY_RETRY_MS;
    if(remaining===0&&!busy&&retryAllowed){expiryAttemptRevision=revision;expiryAttemptAt=now;void pstcMutate("advanceExpiredWindow");}
  }
  function pstcRender(){
    if(!root.document||!pstcSharedMarker())return false;
    pstcCapSigningNames();
    const state=view?.state||null,role=view?.managerRole||pstcSetupState()?.managerRole||null;
    if(!role)return false;
    const key=viewContextKey||pstcBoundContextKey(view?.rivalryId||pstcSetupState()?.rivalryId||"",view?.seasonNumber||pstcSeason());pstcResetForContext(key,role);
    const other=role==="playerOne"?"playerTwo":"playerOne",actualPhase=state?.phase||"NOT_STARTED",replayPhase=pstcReplayPhase(key),phase=replayPhase||actualPhase,isReplay=Boolean(replayPhase),own=view?.ownInputs||null,opponent=view?.opponentInputs||null,screen=pstcField("transferChallenge");
    if(screen){if(isReplay)screen.dataset.sharedTransferReplay=phase;else delete screen.dataset.sharedTransferReplay;}
    pstcRenderProgress(phase);
    pstcText("transferChallengeTitle",`SEASON ${view?.seasonNumber||pstcSeason()} SHARED TRANSFER CHALLENGE`);pstcText("transferManagerOne",pstcManagerName("playerOne"));pstcText("transferManagerTwo",pstcManagerName("playerTwo"));pstcText("transferClubOne",pstcClubName("playerOne"));pstcText("transferClubTwo",pstcClubName("playerTwo"));pstcText("guessAgainstOneHeading",`${pstcManagerName("playerTwo")} guesses ${pstcManagerName("playerOne")}'s signings`);pstcText("guessAgainstTwoHeading",`${pstcManagerName("playerOne")} guesses ${pstcManagerName("playerTwo")}'s signings`);
    const start=pstcField("startTransferTimer"),end=pstcField("endTransferTimer"),complete=pstcField("completeTransferChallenge"),continueButton=pstcField("continueFromTransfers"),results=pstcField("transferChallengeResults"),actionBar=pstcField("transferPhaseActionBar"),signingGrid=root.document.querySelector("#transferChallenge .transferManagersGrid"),guessGrid=root.document.querySelector("#transferChallenge .transferGuessesGrid"),privacy=pstcField("transferGuessPrivacyNote"),summary=pstcField("transferPhaseLockSummary");
    pstcHidden(start,true);pstcHidden(end,true);pstcHidden(complete,true);pstcHidden(actionBar,true);pstcHidden(continueButton,true);pstcHidden(results,true);pstcHidden(signingGrid,true);pstcHidden(guessGrid,true);pstcHidden(privacy,true);pstcHidden(summary,true);pstcHidden(pstcOwnSigningCard(role),false);pstcHidden(pstcOtherSigningCard(role),true);pstcHidden(pstcOwnGuessCard(role),false);pstcHidden(pstcOtherGuessCard(role),true);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);
    if(own)pstcPopulateRole(role,own);if(actualPhase==="SIGNING_ENTRY"&&state?.signingLockedRoles?.includes(role))pstcClearSigningDraft(role);if(actualPhase==="SIGNING_ENTRY"&&!isReplay&&!state?.signingLockedRoles?.includes(role))pstcRestoreSigningDraft(role,own);
    if(phase==="NOT_STARTED"){
      pstcText("transferPhaseStatus",role===view?.setup?.coordinatorRole?"READY · YOU ARE THE SHARED WINDOW COORDINATOR":"READY · WAITING FOR THE COORDINATOR TO START");
      if(role===view?.setup?.coordinatorRole){pstcHidden(start,false);start.textContent="START SHARED 15-MINUTE WINDOW";pstcDisable(start,busy);}
    }else if(phase==="WINDOW_OPEN"){
      if(isReplay){pstcText("transferPhaseStatus","HISTORICAL REPLAY · SHARED TRANSFER WINDOW");pstcText("transferTimerDisplay","REPLAY");}
      else{const requested=state.endRequestedRoles?.includes(role);pstcText("transferPhaseStatus",requested?"TRANSFER WINDOW LIVE · YOUR EARLY-END REQUEST IS LOCKED":"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD");pstcHidden(end,false);end.textContent=requested?"EARLY END REQUESTED ✓":"REQUEST EARLY END";pstcDisable(end,busy||requested);pstcRenderTimer();}
    }else if(phase==="GUESS_ENTRY"){
      const locked=state.guessLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"HISTORICAL REPLAY · PRIVATE GUESS ENTRY":locked?"YOUR GUESSES ARE LOCKED · WAITING FOR YOUR RIVAL":"GUESS ENTRY · YOUR RIVAL CANNOT SEE THESE BEFORE COMPLETION");pstcHidden(guessGrid,false);pstcHidden(privacy,false);if(privacy)privacy.textContent=isReplay?"Historical replay: this read-only screen does not reveal opponent information that has not already been revealed.":"Shared privacy: enter only your guesses. Your rival cannot read them until both managers complete the challenge.";if(!isReplay&&!locked){const card=pstcOwnGuessCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcSyncOwnGuessControls(role,true);pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY GUESSES";pstcDisable(complete,busy);}
    }else if(phase==="SIGNING_ENTRY"){
      const locked=state.signingLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"HISTORICAL REPLAY · PRIVATE SIGNING ENTRY":locked?"YOUR SIGNINGS ARE LOCKED · WAITING FOR YOUR RIVAL":"SIGNING ENTRY · RECORD YOUR COMPLETED FIFA 17 TRANSFERS");pstcHidden(signingGrid,false);pstcHidden(summary,false);if(summary)summary.textContent=isReplay?"Historical replay: your saved signings are read-only and cannot change the shared game or your local save.":"Both managers locked their private guesses. Enter only your own completed signings; your rival still cannot see your inputs.";if(!isReplay&&!locked){const card=pstcOwnSigningCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY SIGNINGS";pstcDisable(complete,busy);}
    }else if(phase==="COMPLETED"){
      pstcText("transferPhaseStatus","SHARED TRANSFER CHALLENGE COMPLETE · VERDICTS REVEALED TO BOTH MANAGERS");pstcHidden(signingGrid,false);pstcHidden(guessGrid,false);pstcHidden(results,false);pstcHidden(pstcOtherSigningCard(role),false);pstcHidden(pstcOtherGuessCard(role),false);pstcPopulateRole(role,own);pstcPopulateRole(other,opponent);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);pstcRenderVerdictCard("playerOne",view?.verdicts?.playerOne||[]);pstcRenderVerdictCard("playerTwo",view?.verdicts?.playerTwo||[]);if(continueButton){continueButton.textContent="SHARED SEASON RESULTS COMING NEXT";pstcHidden(continueButton,false);pstcDisable(continueButton,true);}
    }
    if(isReplay&&continueButton){continueButton.textContent=`CONTINUE REPLAY · ${phase.replaceAll("_"," ")}`;pstcHidden(actionBar,false);pstcHidden(continueButton,false);pstcDisable(continueButton,false);}
    pstcMarkWitness(key,phase);
    const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
  }
  function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButton";button.type="button";button.textContent="REFRESH SHARED CHALLENGE";button.addEventListener("click",event=>{event.preventDefault();if(pstcReplayPhase())return;void pstcRefresh().catch(error=>{pstcSetError(pstcErrorText(error,"The shared Transfer Challenge could not be refreshed."));pstcReport("Unable to refresh Shared Transfer Challenge",error);});});actions.append(button);return button;}
  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER CHALLENGE…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} SHARED TRANSFER CHALLENGE`;status.textContent="Shared transfer challenge: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN SHARED TRANSFER WINDOW";status.textContent="Shared transfer challenge: transfer window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="OPEN SHARED GUESS ENTRY";status.textContent="Shared transfer challenge: private guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="OPEN SHARED SIGNING ENTRY";status.textContent="Shared transfer challenge: private signings";}else{button.textContent="VIEW SHARED TRANSFER VERDICTS";status.textContent="Shared transfer challenge: completed";}return true;}
  // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
  function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
  async function pstcOpenNow(){if(!pstcSharedMarker())return false;await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");const shown=await root.navigateTo("transferChallenge");if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
  async function pstcHandleAction(id){
    if(id==="seasonPrimaryAction")return pstcOpen();
    if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
    if(pstcReplayPhase())return false;
    if(id==="startTransferTimer")return pstcMutate("startWindow");
    if(id==="endTransferTimer")return pstcMutate("requestEndWindow");
    if(id==="completeTransferChallenge"){
      const phase=view?.state?.phase,role=view?.managerRole;if(phase==="GUESS_ENTRY"){const guesses=pstcBuildGuesses(role);if(!pstcConfirmPartialLock(guesses.length,"guesses"))return false;return pstcMutate("lockGuesses",{guesses});}if(phase==="SIGNING_ENTRY"){const signings=pstcBuildSignings(role);if(!pstcConfirmPartialLock(signings.length,"signings"))return false;return pstcMutate("lockSignings",{signings});}pstcFail("TRANSFER_PHASE_INVALID");
    }
    if(id==="continueFromTransfers"){pstcSetError("Season results are not open yet. Tap REFRESH, then try again.");return false;}
    return false;
  }
  function pstcCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pstcSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pstcHandleAction(target.id).catch(error=>{pstcSetError(pstcErrorText(error,"Shared Transfer Challenge failed."));pstcReport("Shared Transfer Challenge action failed",error);});}
  async function pstcTick(light=false){
    if(!pstcSharedMarker()||root.document?.visibilityState==="hidden")return;
    const currentKey=pstcCurrentContextKey();if(viewContextKey&&(!currentKey||viewContextKey!==currentKey))pstcClearCachedContext();
    if(view?.state?.phase==="COMPLETED"&&viewContextKey&&currentKey&&viewContextKey===currentKey){pstcDecorateDashboard();return;}
    try{if(!pstcConfirmedShared()||!pstcCareerReady()){await pstcEnsureDependencies();await setupApi.refresh();await careerApi.refresh();}if(pstcConfirmedShared()&&pstcCareerReady()&&!busy){const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden"))await pstcRefresh(light===true);else if(!view)await pstcRefresh();else pstcDecorateDashboard();}}catch(_error){}
  }
  // Read-only: the fast lane only calls pstcTick (the same provider read as REFRESH SHARED CHALLENGE), never a write.
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
  function pstcFastTick(){if(root.document?.visibilityState==="hidden"||busy||!pstcFastPollDue())return;void pstcTick(true);}
  function pstcSigningDraftChange(event){const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!target.id.startsWith(`${pstcRolePrefix(role)}Signing`))return;if(view?.state?.phase==="SIGNING_ENTRY"&&!view.state.signingLockedRoles?.includes(role))pstcSaveSigningDraft(role);}
  function pstcTimerTick(){if(!pstcSharedMarker()||pstcReplayPhase())return;const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden"))pstcRenderTimer();}
  function pstcVisibilityChange(){if(root.document?.visibilityState==="hidden")return;if(view?.state?.phase==="WINDOW_OPEN"&&!pstcReplayPhase())pstcClearClock();void pstcTick();}
  function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("input",pstcSigningDraftChange,true);root.document.addEventListener("change",pstcSigningDraftChange,true);root.document.addEventListener("visibilitychange",pstcVisibilityChange);}root.addEventListener?.("career-mode-shared-season-cursor-change",()=>{pstcClearCachedContext();void pstcTick();});if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pstcTick(),POLL_MS);timerLoop=root.setInterval(pstcTimerTick,TIMER_MS);root.setInterval(pstcFastTick,FAST_POLL_MS);}if(pstcSharedMarker())void pstcTick();return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:true,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute});
});
