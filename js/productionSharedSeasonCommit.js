(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const ACTION_ID="sharedSeasonCommitAction";
  let installed=false,busy=false,provider=null,setupApi=null,resultsApi=null,view=null,contextKey="",providerChain=Promise.resolve(),refreshPromise=null,headingObserver=null,bootstrapObserver=null;

  function psscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function psscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function psscSharedMarker(){const showdown=psscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function psscField(id){return root.document&&root.document.getElementById(id);}
  function psscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function psscDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function psscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function psscReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function psscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function psscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await psscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await psscLoadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
    await psscLoadScript("ssjr-season-commit-protocol","js/sharedSeasonCommit.js",()=>root.CareerModeSharedSeasonCommit);
    await psscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await psscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;resultsApi=root.CareerModeProductionSharedSeasonResults;provider=root.CareerModeSparkSharedSeasonCommit;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")psscFail("SEASON_COMMIT_SETUP_UNAVAILABLE");
    if(!resultsApi||typeof resultsApi.refresh!=="function"||typeof resultsApi.getState!=="function")psscFail("SEASON_COMMIT_RESULTS_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.commitSeason!=="function"||typeof provider.acknowledgeSeason!=="function")psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");
  }
  function psscSeason(){const season=Number(psscShowdown()?.currentRound);if(!Number.isInteger(season)||season<1)psscFail("SEASON_COMMIT_SEASON_INVALID");return season;}
  function psscSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function psscResultsState(){try{return resultsApi?.getState?.()||null;}catch(_error){return null;}}
  function psscRequestContext(){const showdown=psscShowdown(),setup=psscSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=psscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function psscContextMatches(request){const current=psscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function psscResultsReady(request=psscRequestContext()){const results=psscResultsState();return Boolean(request&&results&&results.state?.phase==="RESULTS_READY"&&results.state?.revision===2&&Number(results.seasonNumber)===request.seasonNumber&&String(results.rivalryId||"")===request.rivalryId&&results.allResults?.playerOne&&results.allResults?.playerTwo);}
  function psscResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"Shared Season Commit request was rejected.");error.code=result&&result.code||"SEASON_COMMIT_PROVIDER_FAILED";throw error;}
  function psscQueue(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  function psscRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")psscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_commit_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  async function psscProviderContext(request=psscRequestContext()){
    if(!psscSharedMarker())psscFail("SEASON_COMMIT_SHARED_MODE_REQUIRED");
    if(!request||!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    await psscEnsureDependencies();
    if(!psscResultsReady(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish Shared Season Results before the shared season can be committed.");
    await setupApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    await resultsApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    if(!psscResultsReady(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish Shared Season Results before the shared season can be committed.");
    const setup=psscSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)psscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");
    const services=await root.CareerModeProductionFirebaseRuntime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  function psscEnsureUi(){
    const panel=psscField("seasonReviewPanel"),actions=panel?.querySelector?.(".seasonReviewActions");if(!panel||!actions)return null;
    let status=psscField("sharedSeasonCommitStatus");if(!status){status=root.document.createElement("p");status.id="sharedSeasonCommitStatus";status.className="seasonReviewWarning sharedSeasonCommitStatus";actions.parentNode.insertBefore(status,actions);}
    let action=psscField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton";action.type="button";actions.prepend(action);}
    return {panel,actions,status,action};
  }
  function psscSetError(message=""){const node=psscField("seasonReviewError");if(node)node.textContent=String(message||"");}
  function psscManagerName(role){return psscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function psscRender(){
    const ui=psscEnsureUi();if(!ui)return false;
    const request=psscRequestContext(),eligible=Boolean(psscSharedMarker()&&request&&contextKey===request.key&&view&&psscResultsReady(request));
    psscHidden(ui.status,!eligible);psscHidden(ui.action,!eligible);if(!eligible)return false;
    const role=view.managerRole,coordinator=view.coordinatorRole,phase=view.phase||"RESULTS_READY";
    if(phase==="ACKNOWLEDGED"){
      psscText(ui.status,"SHARED SEASON COMMIT ACKNOWLEDGED BY BOTH MANAGERS · SCORING REMAINS LOCKED FOR THE NEXT CAPABILITY");psscText(ui.action,"SEASON COMMIT ACKNOWLEDGED ✓");psscDisable(ui.action,true);return true;
    }
    if(view.committed){
      if(view.ownAcknowledged){psscText(ui.status,"YOU ACKNOWLEDGED THIS SHARED SEASON · WAITING FOR YOUR RIVAL");psscText(ui.action,"ACKNOWLEDGED ✓ · WAITING FOR RIVAL");psscDisable(ui.action,true);}
      else{psscText(ui.status,"THE SHARED RESULT SNAPSHOT IS COMMITTED · BOTH MANAGERS MUST ACKNOWLEDGE BEFORE SCORING CAN BEGIN");psscText(ui.action,"ACKNOWLEDGE SHARED SEASON");psscDisable(ui.action,busy);}
      return true;
    }
    if(role===coordinator){psscText(ui.status,"BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT");psscText(ui.action,"COMMIT SHARED SEASON");psscDisable(ui.action,busy);}
    else{psscText(ui.status,`BOTH RESULTS ARE READY · WAITING FOR ${psscManagerName(coordinator)} TO COMMIT THE SHARED SEASON`);psscText(ui.action,"WAITING FOR COORDINATOR");psscDisable(ui.action,true);}
    return true;
  }
  function psscBind(result,ctx,request){if(!psscContextMatches(request))return false;view={...result,rivalryId:ctx.setup.rivalryId,coordinatorRole:result.coordinatorRole||ctx.setup.setup.coordinatorRole};contextKey=request.key;psscRender();return true;}
  async function psscRefreshNow(request=psscRequestContext()){
    if(!request)return null;const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return null;const result=psscResultError(await provider.read(ctx.options),"Shared Season Commit could not be read.");if(!psscContextMatches(request))return null;psscBind(result,ctx,request);return view;
  }
  function psscRefresh(){const request=psscRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=psscQueue(()=>psscRefreshNow(request));refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function psscSatisfied(kind,current){if(kind==="commit")return Boolean(current.committed);return Boolean(current.ownAcknowledged||current.phase==="ACKNOWLEDGED");}
  async function psscMutate(kind){
    if(busy)return false;const request=psscRequestContext();if(!request)return false;busy=true;psscSetError("");psscRender();const operationId=psscRandomOperationId();
    try{
      return await psscQueue(async()=>{
        const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return false;let current=psscResultError(await provider.read(ctx.options));
        if(psscSatisfied(kind,current)){psscBind(current,ctx,request);return true;}
        if(kind==="commit"&&current.managerRole!==current.coordinatorRole)psscFail("SEASON_COMMIT_COORDINATOR_REQUIRED","Only the confirmed coordinator can create the shared season commit.");
        const method=kind==="commit"?"commitSeason":"acknowledgeSeason";
        for(let attempt=0;attempt<2;attempt+=1){
          const result=await provider[method]({...ctx.options,operationId,baseRevision:Number(current.revision||0)});
          if(result&&result.ok===true){await psscRefreshNow(request);return true;}
          if(result?.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0){current=psscResultError(await provider.read(ctx.options));if(psscSatisfied(kind,current)){psscBind(current,ctx,request);return true;}continue;}
          psscResultError(result,kind==="commit"?"The shared season could not be committed.":"Your shared season acknowledgement could not be recorded.");
        }
        return false;
      });
    }catch(error){if(psscContextMatches(request)){psscSetError(error.message||error.code||"Shared Season Commit failed.");psscReport("Unable to update Shared Season Commit",error);}return false;}
    finally{busy=false;if(psscContextMatches(request))psscRender();}
  }
  function psscCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!psscSharedMarker())return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;void psscMutate(view?.committed?"acknowledge":"commit");}
  async function psscTick(){if(!psscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;if(view?.phase==="ACKNOWLEDGED"){psscRender();return;}try{await psscRefresh();}catch(_error){}}
  function psscAttachHeadingObserver(){
    if(!root.MutationObserver||!root.document)return false;const heading=psscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;
    headingObserver=new root.MutationObserver(()=>void psscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;
  }
  function psscInstallObservers(){if(psscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(psscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function psscInstall(){if(installed)return true;installed=true;if(root.document)root.document.addEventListener("click",psscCapture,true);psscInstallObservers();if(typeof root.setInterval==="function")root.setInterval(()=>void psscTick(),POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(()=>void psscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-commit",productionEnabled:true,runtimeRevision:"1.9.1-r10",requiresResultsReady:true,requiresCoordinatorCommit:true,requiresBothAcknowledgements:true,reusesSeasonReview:true,distinctFromLocalConfirm:true,boundedStaleRetry:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:psscInstall,refresh:psscRefresh,getState:()=>view,isActive:psscSharedMarker});
});