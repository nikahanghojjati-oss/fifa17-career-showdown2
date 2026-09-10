(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  let installed=false,busy=false,view=null,contextKey="",setupApi=null,commitApi=null,provider=null,refreshPromise=null,headingObserver=null,bootstrapObserver=null;

  function pcscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pcscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pcscSharedMarker(){const showdown=pcscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pcscField(id){return root.document&&root.document.getElementById(id);}
  function pcscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pcscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pcscReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pcscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pcscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pcscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pcscLoadScript("ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit);
    await pcscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await pcscLoadScript("ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js",()=>root.CareerModeSharedCanonicalScoring);
    await pcscLoadScript("ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js",()=>root.CareerModeSparkSharedCanonicalScoring);
    await pcscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;commitApi=root.CareerModeProductionSharedSeasonCommit;provider=root.CareerModeSparkSharedCanonicalScoring;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pcscFail("CANONICAL_SCORING_SETUP_UNAVAILABLE");
    if(!commitApi||typeof commitApi.refresh!=="function"||typeof commitApi.getState!=="function")pcscFail("CANONICAL_SCORING_SEASON_COMMIT_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function")pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE");
  }
  function pcscSeason(){const season=Number(pcscShowdown()?.currentRound);if(!Number.isInteger(season)||season<1)pcscFail("CANONICAL_SCORING_SEASON_INVALID");return season;}
  function pcscRequestContext(){const showdown=pcscShowdown(),rivalryId=String(showdown?.sharedJourney?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=pcscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function pcscContextMatches(request){const current=pcscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function pcscCommitReady(request=pcscRequestContext()){const state=commitApi?.getState?.();return Boolean(request&&state&&state.committed===true&&state.phase==="ACKNOWLEDGED"&&state.revision===3&&Number(state.seasonNumber)===request.seasonNumber&&String(state.rivalryId||"")===request.rivalryId);}
  function pcscResult(result){if(result&&result.ok===true)return result;const error=new Error("Shared canonical scoring could not be verified.");error.code=result&&result.code||"CANONICAL_SCORING_PROVIDER_FAILED";throw error;}
  function pcscManagerName(role){return pcscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function pcscEnsureUi(){
    const review=pcscField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
    let panel=pcscField("sharedCanonicalScoringPanel");if(!panel){panel=root.document.createElement("section");panel.id="sharedCanonicalScoringPanel";panel.className="seasonReviewBreakdown sharedCanonicalScoringPanel hidden";panel.setAttribute("aria-live","polite");panel.innerHTML='<h3 id="sharedCanonicalScoringHeading">SHARED CANONICAL SCORE</h3><p id="sharedCanonicalScoringTotals"></p><p id="sharedCanonicalScoringBreakdown"></p><p id="sharedCanonicalScoringWinner"></p>';actions.parentNode.insertBefore(panel,actions);}
    return {panel,totals:pcscField("sharedCanonicalScoringTotals"),breakdown:pcscField("sharedCanonicalScoringBreakdown"),winner:pcscField("sharedCanonicalScoringWinner")};
  }
  function pcscRender(){
    const ui=pcscEnsureUi();if(!ui)return false;const request=pcscRequestContext(),eligible=Boolean(pcscSharedMarker()&&request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="SCORING_RECONCILED");pcscHidden(ui.panel,!eligible);if(!eligible)return false;
    const p1=view.scoring.playerOne,p2=view.scoring.playerTwo,n1=pcscManagerName("playerOne"),n2=pcscManagerName("playerTwo");
    pcscText(ui.totals,`${n1}: ${p1.total} · ${n2}: ${p2.total}`);
    pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.domesticCup}–${p2.domesticCup} · Performance Bonus ${p1.performanceBonus}–${p2.performanceBonus} · Awards Bonus ${p1.individualAwardsBonus}–${p2.individualAwardsBonus}`);
    pcscText(ui.winner,view.winner==="draw"?"Season result: Draw":`Season winner: ${pcscManagerName(view.winner)}`);return true;
  }
  async function pcscProviderOptions(request){
    const setup=setupApi?.getState?.();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pcscFail("CANONICAL_SCORING_SETUP_NOT_CONFIRMED");
    const services=await root.CareerModeProductionFirebaseRuntime.ensureAccountServices();if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,teamCount:20,cryptoImpl:root.crypto,nowEpochMs:Date.now()};
  }
  async function pcscRefreshNow(request=pcscRequestContext()){
    if(!request||!pcscSharedMarker())return null;await pcscEnsureDependencies();if(!pcscContextMatches(request))return null;
    await setupApi.refresh();if(!pcscContextMatches(request))return null;await commitApi.refresh();if(!pcscContextMatches(request))return null;
    if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
    const result=pcscResult(await provider.read(await pcscProviderOptions(request)));if(!pcscContextMatches(request))return null;
    if(result.phase!=="SCORING_RECONCILED"||result.revision!==1||result.seasonCommitRevision!==3||Number(result.seasonNumber)!==request.seasonNumber)pcscFail("CANONICAL_SCORING_PROJECTION_INVALID");
    view={...result,rivalryId:request.rivalryId};contextKey=request.key;pcscRender();return view;
  }
  function pcscRefresh(){const request=pcscRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pcscRefreshNow(request);refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  async function pcscTick(){if(!pcscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=pcscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;busy=true;try{await pcscRefresh();}catch(error){view=null;pcscRender();pcscReport("Unable to refresh Shared Canonical Scoring",error);}finally{busy=false;}}
  function pcscAttachHeadingObserver(){if(!root.MutationObserver||!root.document)return false;const heading=pcscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;headingObserver=new root.MutationObserver(()=>void pcscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;}
  function pcscInstallObservers(){if(pcscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(pcscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function pcscInstall(){if(installed)return true;installed=true;pcscInstallObservers();if(typeof root.setInterval==="function")root.setInterval(()=>void pcscTick(),POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-canonical-scoring",productionEnabled:true,runtimeRevision:"1.9.1-r11",requiresAcknowledgedSeasonCommit:true,providerEnforcedSource:true,readOnlyDerivedProjection:true,reusesSeasonReview:true,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:pcscInstall,refresh:pcscRefresh,getState:()=>view,isActive:pcscSharedMarker});
});