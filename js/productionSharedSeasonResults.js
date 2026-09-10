(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const CONTROL_IDS=Object.freeze(["completeSeason","confirmSeasonCompletion","editSeasonResults"]);
  const RESULT_SUFFIXES=Object.freeze(["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","TopScorer","TopAssist"]);
  let installed=false,busy=false,provider=null,setupApi=null,transferApi=null,catalogApi=null,view=null,draft=null,pollTimer=null,providerChain=Promise.resolve(),refreshPromise=null,contextKey="",renderedContextKey="";

  function pssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pssrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pssrSharedMarker(){const showdown=pssrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pssrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pssrField(id){return root.document&&root.document.getElementById(id);}
  function pssrText(id,value){const node=pssrField(id);if(node)node.textContent=String(value??"");return node;}
  function pssrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pssrDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pssrLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pssrEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pssrLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pssrLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    await pssrLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await pssrLoadScript("ssjr-season-results-provider","js/sparkSharedSeasonResults.js",()=>root.CareerModeSparkSharedSeasonResults);
    await pssrLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pssrLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;transferApi=root.CareerModeProductionSharedTransferChallenge;provider=root.CareerModeSparkSharedSeasonResults;catalogApi=root.CareerModeSharedShowdownCatalog;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pssrFail("SEASON_RESULTS_SETUP_UNAVAILABLE");
    if(!transferApi||typeof transferApi.refresh!=="function"||typeof transferApi.getState!=="function")pssrFail("SEASON_RESULTS_TRANSFER_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.publishResult!=="function")pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
  }
  function pssrSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pssrShowdown()?.currentRound,season=Number(pssrSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pssrFail("SEASON_RESULTS_SEASON_INVALID");return season;}
  function pssrRolePrefix(role){return role==="playerOne"?"p1":"p2";}
  function pssrOtherRole(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function pssrManagerName(role){const showdown=pssrShowdown();return showdown?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function pssrSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function pssrTransferState(){try{return transferApi?.getState?.()||null;}catch(_error){return null;}}
  function pssrClubName(role){const setup=pssrSetupState()?.setup||pssrTransferState()?.setup;return setup?.clubs?.[role]||pssrShowdown()?.clubs?.[role]||"Club";}
  function pssrRequestContext(){
    const showdown=pssrShowdown(),setup=pssrSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;
    try{seasonNumber=pssrSeason();}catch(_error){return null;}
    const saveId=String(showdown?.id||showdown?.saveId||"").trim();
    const key=rivalryId&&seasonNumber?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";
    return key?Object.freeze({key,rivalryId,seasonNumber}):null;
  }
  function pssrContextMatches(request){const current=pssrRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function pssrTransferComplete(request){const transfer=pssrTransferState();return Boolean(request&&transfer&&Number(transfer.seasonNumber)===request.seasonNumber&&transfer.state&&transfer.state.phase==="COMPLETED");}
  function pssrCanRoute(){const request=pssrRequestContext();return Boolean(pssrSharedMarker()&&request&&contextKey===request.key&&view&&view.managerRole&&view.rivalryId===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber&&pssrTransferComplete(request));}
  function pssrResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"Shared Season Results request was rejected.");error.code=result&&result.code||"SEASON_RESULTS_PROVIDER_FAILED";throw error;}
  function pssrQueueProvider(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  async function pssrProviderContext(request=pssrRequestContext()){
    if(!pssrSharedMarker())pssrFail("SEASON_RESULTS_SHARED_MODE_REQUIRED");
    if(!request||!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    await pssrEnsureDependencies();
    await setupApi.refresh();if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    await transferApi.refresh();if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    if(!pssrTransferComplete(request))pssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE","Finish the shared Transfer Challenge before publishing Season Results.");
    const setup=pssrSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=await runtime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  async function pssrRefreshNow(request=pssrRequestContext()){
    if(!request)return null;
    const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return null;
    const result=pssrResultError(await provider.read(ctx.options),"Shared Season Results could not be read.");if(!pssrContextMatches(request))return null;
    view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;pssrRender();return view;
  }
  function pssrRefresh(){const request=pssrRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pssrQueueProvider(()=>pssrRefreshNow(request));refreshPromise=current;current.finally(()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function pssrRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_result_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function pssrTeamCount(){const leagueId=view?.setup?.leagueId||pssrSetupState()?.setup?.leagueId,catalog=catalogApi?.catalog;const clubs=catalog&&leagueId?catalog[leagueId]:null;return Array.isArray(clubs)?clubs.length:20;}
  function pssrReadForm(role){
    const prefix=pssrRolePrefix(role),position=pssrField(`${prefix}LeaguePosition`),points=pssrField(`${prefix}LeaguePoints`),goals=pssrField(`${prefix}LeagueGoals`);
    if(!position||!points||!goals||position.value===""||points.value===""||goals.value==="")pssrFail("SEASON_RESULTS_FORM_INCOMPLETE",`Enter league position, league points and league goals for ${pssrManagerName(role)}.`);
    const result={leaguePosition:Number(position.value),leaguePoints:Number(points.value),leagueGoals:Number(goals.value),domesticCup:Boolean(pssrField(`${prefix}DomesticCup`)?.checked),championsLeague:Boolean(pssrField(`${prefix}ChampionsLeague`)?.checked),topScorer:Boolean(pssrField(`${prefix}TopScorer`)?.checked),topAssist:Boolean(pssrField(`${prefix}TopAssist`)?.checked)};
    const teamCount=pssrTeamCount();
    if(!Number.isInteger(result.leaguePosition)||result.leaguePosition<1||result.leaguePosition>teamCount)pssrFail("SEASON_RESULTS_POSITION_INVALID",`${pssrManagerName(role)}'s league position must be a whole number from 1 to ${teamCount}.`);
    if(!Number.isInteger(result.leaguePoints)||result.leaguePoints<0||result.leaguePoints>114)pssrFail("SEASON_RESULTS_POINTS_INVALID",`${pssrManagerName(role)}'s league points must be a whole number from 0 to 114.`);
    if(!Number.isInteger(result.leagueGoals)||result.leagueGoals<0||result.leagueGoals>300)pssrFail("SEASON_RESULTS_GOALS_INVALID",`${pssrManagerName(role)}'s league goals must be a whole number from 0 to 300.`);
    return Object.freeze(result);
  }
  function pssrFingerprint(result){return JSON.stringify({leaguePosition:Number(result.leaguePosition),leaguePoints:Number(result.leaguePoints),leagueGoals:Number(result.leagueGoals),domesticCup:Boolean(result.domesticCup),championsLeague:Boolean(result.championsLeague),topScorer:Boolean(result.topScorer),topAssist:Boolean(result.topAssist)});}
  function pssrPopulate(role,result){if(!result)return;const prefix=pssrRolePrefix(role);pssrField(`${prefix}LeaguePosition`).value=String(result.leaguePosition);pssrField(`${prefix}LeaguePoints`).value=String(result.leaguePoints);pssrField(`${prefix}LeagueGoals`).value=String(result.leagueGoals);for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]]){const input=pssrField(`${prefix}${suffix}`);if(input)input.checked=Boolean(result[key]);}}
  function pssrDisableRole(role,disabled){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach(suffix=>pssrDisable(pssrField(`${prefix}${suffix}`),disabled));}
  function pssrCard(role){const input=pssrField(`${pssrRolePrefix(role)}LeaguePosition`);return input&&input.closest?input.closest(".seasonResultCard"):null;}
  function pssrSetError(message=""){const target=pssrField("seasonReviewPanel")&&!pssrField("seasonReviewPanel").classList.contains("hidden")?pssrField("seasonReviewError"):pssrField("seasonEntryError");if(target)target.textContent=String(message||"");}
  function pssrAppendLine(container,label,value){const row=root.document.createElement("div"),name=root.document.createElement("span"),data=root.document.createElement("strong");row.className="summaryLine seasonReviewLine";name.textContent=label;data.textContent=String(value);row.append(name,data);container.append(row);}
  function pssrRenderReviewCard(container,role,result){if(!container||!result)return;const fragment=root.document.createDocumentFragment(),heading=root.document.createElement("h3"),club=root.document.createElement("p");heading.textContent=pssrManagerName(role);club.className="summaryClub";club.textContent=pssrClubName(role);fragment.append(heading,club);pssrAppendLine(fragment,"League Position",result.leaguePosition);pssrAppendLine(fragment,"League Points",result.leaguePoints);pssrAppendLine(fragment,"League Goals",result.leagueGoals);const achievements=root.document.createElement("div");achievements.className="seasonReviewAchievements";[["Domestic Cup",result.domesticCup],["Champions League",result.championsLeague],["Top Scorer",result.topScorer],["Top Assist",result.topAssist]].forEach(([label,active])=>{const item=root.document.createElement("span");item.className=active?"isEarned":"isNotEarned";item.textContent=`${active?"✓":"—"} ${label}`;achievements.append(item);});fragment.append(achievements);container.replaceChildren(fragment);}
  function pssrEntryMode(reviewing){const panel=pssrField("seasonReviewPanel"),grid=root.document?.querySelector?.("#seasonEntry .seasonEntryGrid"),hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint"),actions=pssrField("completeSeason")?.closest?.(".seasonEntryActions");pssrHidden(panel,!reviewing);pssrHidden(grid,reviewing);pssrHidden(hint,reviewing);pssrHidden(actions,reviewing);if(pssrField("seasonEntry"))pssrField("seasonEntry").dataset.sharedSeasonResults=reviewing?"review":"entry";}
  function pssrRenderReview(result,{waiting=false,ready=false}={}){
    const role=view?.managerRole,other=pssrOtherRole(role),one=pssrField("seasonReviewOne"),two=pssrField("seasonReviewTwo"),ownCard=role==="playerOne"?one:two,otherCard=role==="playerOne"?two:one,confirm=pssrField("confirmSeasonCompletion"),edit=pssrField("editSeasonResults"),overall=pssrField("seasonReviewOverallScore")?.closest?.(".seasonReviewOverall"),warning=root.document?.querySelector?.("#seasonReviewPanel .seasonReviewWarning");
    pssrEntryMode(true);pssrHidden(overall,true);pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} SHARED RESULTS`);pssrText("seasonReviewHeading",ready?"BOTH MANAGERS PUBLISHED":waiting?"YOUR RESULT IS PUBLISHED":"REVIEW YOUR SEASON RESULT");pssrText("seasonReviewStatusMeta",ready?"RESULTS READY · BOTH PRIVATE SIDES REVEALED":waiting?"PUBLISHED · WAITING FOR YOUR RIVAL":"NOT PUBLISHED YET");
    pssrRenderReviewCard(ownCard,role,result);pssrHidden(ownCard,false);
    if(ready&&view?.opponentResult){pssrRenderReviewCard(otherCard,other,view.opponentResult);pssrHidden(otherCard,false);pssrText("seasonReviewResult","Both managers published their reviewed FIFA 17 season results. Shared scoring is intentionally not authoritative in this r9 publication step.");}
    else{pssrHidden(otherCard,true);pssrText("seasonReviewResult",waiting?"Your rival cannot see this result until they publish their own. This screen refreshes automatically.":"Check your seven season facts carefully. Publishing is immutable for this manager and season.");}
    if(warning)warning.textContent=ready?"RESULT PUBLICATION COMPLETE · SHARED SCORING REMAINS A SEPARATE CAPABILITY":"PUBLISHING IS FINAL FOR YOUR MANAGER · CANONICAL LOCAL SAVE IS NOT MODIFIED";
    if(confirm){pssrHidden(confirm,ready);pssrDisable(confirm,busy||waiting);confirm.textContent=waiting?"PUBLISHED ✓":"PUBLISH MY SEASON RESULT";}
    if(edit){pssrHidden(edit,ready||waiting);pssrDisable(edit,busy);edit.textContent="EDIT MY RESULT";}
    pssrSetError("");
  }
  function pssrRenderEntry(){
    const role=view?.managerRole;if(!role)return;const other=pssrOtherRole(role),own=view?.ownResult||null,ready=view?.state?.phase==="RESULTS_READY";
    pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} SHARED RESULTS`);pssrText("seasonManagerOne",pssrManagerName("playerOne"));pssrText("seasonManagerTwo",pssrManagerName("playerTwo"));pssrText("seasonClubOne",pssrClubName("playerOne"));pssrText("seasonClubTwo",pssrClubName("playerTwo"));
    if(own)pssrPopulate(role,own);if(ready&&view?.opponentResult)pssrPopulate(other,view.opponentResult);
    if(own||ready){pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(own||view?.allResults?.[role],{waiting:!ready,ready});return;}
    pssrEntryMode(false);pssrHidden(pssrCard(role),false);pssrHidden(pssrCard(other),true);pssrDisableRole(role,false);pssrDisableRole(other,true);const complete=pssrField("completeSeason");if(complete){complete.textContent="REVIEW MY SEASON RESULT";pssrDisable(complete,busy);}const hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint");if(hint)hint.textContent=`Enter only ${pssrManagerName(role)}'s FIFA 17 season result. Your rival enters their own result privately on their device. Nothing on this screen writes to the canonical local Save.`;pssrSetError("");
  }
  function pssrRender(){if(!root.document||!pssrSharedMarker()||!view)return false;const request=pssrRequestContext();if(!request||contextKey!==request.key)return false;if(renderedContextKey!==request.key){renderedContextKey=request.key;draft=null;}pssrRenderEntry();return true;}
  function pssrBeginReview(){
    if(!view||!view.managerRole)return false;if(view.ownResult){pssrRender();return true;}
    try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
  }
  function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
  async function pssrPublish(){
    if(busy||!draft||!view?.managerRole)return false;
    if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("The shared season context changed. Review your result again.");draft=null;return false;}
    let currentResult;try{currentResult=pssrReadForm(view.managerRole);}catch(error){pssrSetError(error.message||error.code);return false;}
    if(pssrFingerprint(currentResult)!==draft.fingerprint){pssrSetError("Your season result changed after review. Choose Edit My Result and review it again before publishing.");return false;}
    const request=pssrRequestContext();if(!request||!pssrContextMatches(request))return false;busy=true;pssrSetError("");pssrRender();
    try{
      return await pssrQueueProvider(async()=>{
        const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return false;
        const current=pssrResultError(await provider.read(ctx.options),"Shared Season Results could not be refreshed before publishing.");if(!pssrContextMatches(request))return false;
        if(current.ownResult){view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
        draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
        const result=pssrResultError(await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:draft.result}),"Your shared Season Result could not be published.");if(!pssrContextMatches(request))return true;
        view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;await pssrRefreshNow(request);return true;
      });
    }catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Shared Season Result publication failed.");pssrReport("Unable to publish Shared Season Result",error);}return false;}
    finally{busy=false;if(pssrContextMatches(request))pssrRender();}
  }
  async function pssrOpen(){
    if(!pssrSharedMarker())return false;await pssrEnsureDependencies();const request=pssrRequestContext();if(!request)return false;const result=await pssrRefresh();if(!result||!pssrContextMatches(request)||contextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pssrFail("SEASON_RESULTS_NAVIGATION_UNAVAILABLE");const shown=await root.navigateTo("seasonEntry");if(shown===false||!pssrContextMatches(request))return false;pssrRender();return true;
  }
  function pssrCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pssrSharedMarker())return;const active=pssrField("seasonEntry");if(!active||active.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="completeSeason")pssrBeginReview();else if(target.id==="editSeasonResults")pssrEdit();else void pssrPublish();}
  async function pssrTick(){if(!pssrSharedMarker()||root.document?.visibilityState==="hidden"||busy)return;const request=pssrRequestContext();if(!request)return;if(contextKey&&contextKey!==request.key){view=null;draft=null;contextKey="";renderedContextKey="";}if(view?.state?.phase==="RESULTS_READY")return;const active=pssrField("seasonEntry");if(view||active&&!active.classList.contains("hidden")){try{await pssrRefresh();}catch(_error){}}}
  function pssrInstall(){if(installed)return true;installed=true;if(root.document)root.document.addEventListener("click",pssrCapture,true);root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pssrTick());if(typeof root.setInterval==="function")pollTimer=root.setInterval(()=>void pssrTick(),POLL_MS);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results",productionEnabled:true,requiresCompletedSharedTransfer:true,privateUntilBothPublished:true,reusesSeasonEntry:true,interceptsLocalSeasonPersistence:true,authoritativeScoring:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:pssrInstall,open:pssrOpen,refresh:pssrRefresh,getState:()=>view,isActive:pssrSharedMarker,canRoute:pssrCanRoute});
});
