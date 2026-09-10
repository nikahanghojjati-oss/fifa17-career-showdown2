(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedHistoryConvergence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const PANEL_ID="sharedHistoryConvergencePanel";
  let installed=false,busy=false,provider=null,setupApi=null,commitApi=null,scoringApi=null,view=null,contextKey="",refreshPromise=null;

  function phcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function phcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function phcSharedMarker(){const showdown=phcShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function phcField(id){return root.document&&root.document.getElementById(id);}
  function phcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function phcText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function phcReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function phcLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function phcEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await phcLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await phcLoadScript("ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit);
    await phcLoadScript("ssjr-production-canonical-scoring","js/productionSharedCanonicalScoring.js",()=>root.CareerModeProductionSharedCanonicalScoring);
    await phcLoadScript("ssjr-history-convergence-protocol","js/sharedHistoryConvergence.js",()=>root.CareerModeSharedHistoryConvergence);
    await phcLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await phcLoadScript("ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js",()=>root.CareerModeSharedCanonicalScoring);
    await phcLoadScript("ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js",()=>root.CareerModeSparkSharedCanonicalScoring);
    await phcLoadScript("ssjr-history-convergence-provider","js/sparkSharedHistoryConvergence.js",()=>root.CareerModeSparkSharedHistoryConvergence);
    await phcLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;commitApi=root.CareerModeProductionSharedSeasonCommit;scoringApi=root.CareerModeProductionSharedCanonicalScoring;provider=root.CareerModeSparkSharedHistoryConvergence;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")phcFail("HISTORY_CONVERGENCE_SETUP_UNAVAILABLE");
    if(!commitApi||typeof commitApi.refresh!=="function"||typeof commitApi.getState!=="function")phcFail("HISTORY_CONVERGENCE_COMMIT_UNAVAILABLE");
    if(!scoringApi||typeof scoringApi.refresh!=="function"||typeof scoringApi.getState!=="function")phcFail("HISTORY_CONVERGENCE_SCORING_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function")phcFail("HISTORY_CONVERGENCE_PROVIDER_UNAVAILABLE");
  }
  function phcSeason(){const season=Number(phcShowdown()?.currentRound);if(!Number.isInteger(season)||season<1||season>10)return null;return season;}
  function phcSetup(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function phcCommit(){try{return commitApi?.getState?.()||null;}catch(_error){return null;}}
  function phcScoring(){try{return scoringApi?.getState?.()||null;}catch(_error){return null;}}
  function phcRequest(){
    const showdown=phcShowdown(),setup=phcSetup(),throughSeason=phcSeason(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim(),saveId=String(showdown?.id||showdown?.saveId||"").trim();
    if(!rivalryId||!throughSeason)return null;return Object.freeze({rivalryId,throughSeason,key:`${saveId||"shared"}|${rivalryId}|history:${throughSeason}`});
  }
  function phcContextMatches(request){const current=phcRequest();return Boolean(request&&current&&request.key===current.key);}
  function phcCachedTerminal(request){
    const setup=phcSetup(),commit=phcCommit(),scoring=phcScoring();
    return Boolean(request&&setup&&setup.ready===true&&setup.setup?.phase==="SHOWDOWN_CONFIRMED"&&setup.setup?.revision===6&&Number(setup.setup?.totalSeasons)>=request.throughSeason&&String(setup.rivalryId||"")===request.rivalryId&&commit&&commit.committed===true&&commit.phase==="ACKNOWLEDGED"&&commit.revision===3&&Number(commit.seasonNumber)===request.throughSeason&&scoring&&scoring.authoritative===true&&scoring.phase==="SCORING_RECONCILED"&&scoring.revision===1&&Number(scoring.seasonNumber)===request.throughSeason&&Number(scoring.seasonCommitRevision)===3&&Number(scoring.resultsRevision)===Number(commit.resultsRevision)&&String(scoring.resultsContentHash||"")===String(commit.resultsContentHash||""));
  }
  async function phcProviderOptions(request){
    const setup=phcSetup();if(!request||!setup||!phcContextMatches(request))phcFail("HISTORY_CONVERGENCE_CONTEXT_STALE");
    if(!setup.sessionId||!setup.deviceId||!setup.accountId||!setup.managerRole)phcFail("HISTORY_CONVERGENCE_SETUP_AUTHORITY_INVALID");
    const services=await root.CareerModeProductionFirebaseRuntime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)phcFail("HISTORY_CONVERGENCE_PROVIDER_UNAVAILABLE");
    if(setup.accountId&&services.auth.currentUser.uid!==setup.accountId)phcFail("HISTORY_CONVERGENCE_AUTHORITY_MISMATCH");
    return Object.freeze({user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,throughSeason:request.throughSeason,nowEpochMs:Date.now()});
  }
  function phcManagerName(role){return String(phcShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function phcEnsureUi(){
    if(!root.document)return null;const review=phcField("seasonReviewPanel");if(!review)return null;
    let panel=phcField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedHistoryConvergencePanel hidden";const scoring=phcField("sharedCanonicalScoringPanel");if(scoring?.parentNode)scoring.insertAdjacentElement("afterend",panel);else review.appendChild(panel);}
    let heading=phcField("sharedHistoryConvergenceHeading");if(!heading){heading=root.document.createElement("h3");heading.id="sharedHistoryConvergenceHeading";panel.appendChild(heading);}
    let summary=phcField("sharedHistoryConvergenceSummary");if(!summary){summary=root.document.createElement("p");summary.id="sharedHistoryConvergenceSummary";panel.appendChild(summary);}
    let records=phcField("sharedHistoryConvergenceRecords");if(!records){records=root.document.createElement("p");records.id="sharedHistoryConvergenceRecords";panel.appendChild(records);}
    let trophies=phcField("sharedHistoryConvergenceTrophies");if(!trophies){trophies=root.document.createElement("p");trophies.id="sharedHistoryConvergenceTrophies";panel.appendChild(trophies);}
    return {panel,heading,summary,records,trophies};
  }
  function phcRecordLine(role,record){return `${phcManagerName(role)} · ${record.club} · ${record.seasonWins}W ${record.seasonDraws}D ${record.seasonLosses}L · ${record.totalPoints} showdown pts`;}
  function phcTrophyLine(role,item){return `${phcManagerName(role)} ${item.totalTrophies} trophies (${item.leagueTitles} league, ${item.domesticCups} cup, ${item.championsLeagues} Champions League)`;}
  function phcRender(){
    const ui=phcEnsureUi();if(!ui)return false;const request=phcRequest(),active=Boolean(request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="HISTORY_CONVERGED"&&view.projection);
    phcHidden(ui.panel,!active);if(!active)return false;const projection=view.projection;
    phcText(ui.heading,"SHARED HISTORY CONVERGED");
    phcText(ui.summary,`${projection.acceptedSeasons} of ${projection.totalSeasons} season${projection.totalSeasons===1?"":"s"} accepted · ${String(projection.leagueId||"").replace(/_/g," ").toUpperCase()}`);
    phcText(ui.records,`${phcRecordLine("playerOne",projection.managerRecords.playerOne)} · ${phcRecordLine("playerTwo",projection.managerRecords.playerTwo)}`);
    phcText(ui.trophies,`${phcTrophyLine("playerOne",projection.trophyAttribution.playerOne)} · ${phcTrophyLine("playerTwo",projection.trophyAttribution.playerTwo)}`);
    return true;
  }
  function phcClear(request=null){view=null;contextKey=request?.key||"";phcRender();return null;}
  async function phcRefreshNow(request){
    if(!request||!phcSharedMarker())return phcClear(request);await phcEnsureDependencies();if(!phcContextMatches(request))return null;
    if(!phcCachedTerminal(request))return phcClear(request);
    await setupApi.refresh();if(!phcContextMatches(request)||!phcCachedTerminal(request))return phcClear(request);
    await commitApi.refresh();if(!phcContextMatches(request)||!phcCachedTerminal(request))return phcClear(request);
    await scoringApi.refresh();if(!phcContextMatches(request)||!phcCachedTerminal(request))return phcClear(request);
    const result=await provider.read(await phcProviderOptions(request));if(!phcContextMatches(request))return null;
    if(!result||result.ok!==true||result.authoritative!==true||result.phase!=="HISTORY_CONVERGED"||result.revision!==1||result.throughSeason!==request.throughSeason||String(result.rivalryId||"")!==request.rivalryId||!result.projection||result.projection.phase!=="HISTORY_CONVERGED"||result.projection.acceptedSeasons!==request.throughSeason)phcFail(result?.code||"HISTORY_CONVERGENCE_PROVIDER_INVALID");
    view=result;contextKey=request.key;phcRender();try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-history-convergence-state-change",{detail:{phase:view.phase,throughSeason:view.throughSeason,acceptedRevisionKey:view.acceptedRevisionKey||view.projection.acceptedRevisionKey}}));}catch(_error){}return view;
  }
  function phcRefresh(){
    const request=phcRequest();if(!request||!phcSharedMarker())return Promise.resolve(phcClear(request));if(refreshPromise)return refreshPromise;busy=true;const current=phcRefreshNow(request).catch(error=>{if(phcContextMatches(request)){phcClear(request);phcReport("Unable to converge Shared History",error);}return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;});refreshPromise=current;return current;
  }
  function phcWake(){if(busy||root.document?.visibilityState==="hidden")return;void phcRefresh();}
  function phcInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-shared-canonical-scoring-state-change","career-mode-shared-season-commit-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change"]){root.addEventListener?.(event,phcWake);}root.document?.addEventListener?.("visibilitychange",phcWake);if(typeof root.setInterval==="function")root.setInterval(phcWake,POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(phcWake,0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-history-convergence",productionEnabled:true,runtimeRevision:"1.9.1-r12",requiresAcknowledgedSeasonCommit:true,requiresCanonicalScoring:true,providerEnforcedSource:true,readOnlyDerivedProjection:true,identitySafe:true,exactSeasonAddressing:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:phcInstall,refresh:phcRefresh,getState:()=>view,isActive:phcSharedMarker});
});
