(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): after publishing, read every 3 s for at most 3 minutes while the rival has not published yet.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  const CONTROL_IDS=Object.freeze(["completeSeason","confirmSeasonCompletion","editSeasonResults"]);
  // r80: EuropaLeague is a check like the others (index >= 3). One manager plays the Champions League or the Europa League in a
  // season, never both: ticking one unticks the other (pssrContinental), and the read refuses both. The two managers play different
  // FIFA saves, so nothing is ever compared across them.
  const RESULT_SUFFIXES=Object.freeze(["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","EuropaLeague","TopScorer","TopAssist"]);
  let formContextKey="",installed=false,busy=false,provider=null,setupApi=null,transferApi=null,catalogApi=null,view=null,draft=null,pollTimer=null,providerChain=Promise.resolve(),refreshPromise=null,contextKey="",renderedContextKey="",errorNode=null,errorMessage="";

  function pssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pssrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pssrSharedMarker(){const showdown=pssrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pssrReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
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
    await pssrLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pssrLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await pssrLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await pssrLoadScript("ssjr-season-results-provider","js/sparkSharedSeasonResults.js",()=>root.CareerModeSparkSharedSeasonResults);
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
  function pssrResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Season Results request was rejected.");error.code=result&&result.code||"SEASON_RESULTS_PROVIDER_FAILED";throw error;}
  // JOB-1611: provider codes that mean "contended", not "refused": Firestore lock contention after the SDK's own retries.
  const PSSR_CONTENTION_CODES=Object.freeze(["aborted","failed-precondition","permission-denied","firestore/permission-denied","permission_denied"]);
  const PSSR_CONTENTION_RETRY_MS=Object.freeze([500,1000,1500]);
  function pssrWait(ms){return new Promise(resolve=>{const timer=typeof root.setTimeout==="function"?root.setTimeout:setTimeout;timer(resolve,ms);});}
  // JOB-1611: the reads inside a publish meet the same contention; they get the same bounded wait before failing as before.
  async function pssrPublishRead(ctx,request){let read=await provider.read(ctx.options);for(let retry=0;read?.ok!==true&&PSSR_CONTENTION_CODES.includes(read?.code)&&retry<PSSR_CONTENTION_RETRY_MS.length&&pssrContextMatches(request);retry+=1){await pssrWait(PSSR_CONTENTION_RETRY_MS[retry]);read=await provider.read(ctx.options);}return pssrResultError(read,"Season Results could not be refreshed before publishing.");}
  function pssrQueueProvider(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the COMPLETED Transfer Challenge.
  async function pssrProviderContext(request=pssrRequestContext(),light=false){
    if(!pssrSharedMarker())pssrFail("SEASON_RESULTS_SHARED_MODE_REQUIRED");
    if(!request||!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    await pssrEnsureDependencies();
    if(!(light===true&&pssrSetupState()?.ready===true&&pssrTransferComplete(request))){
      await setupApi.refresh();if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
      try{await transferApi.refresh();}catch(error){if(!(pssrContextMatches(request)&&pssrTransferComplete(request)))throw error;}if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    }
    if(!pssrTransferComplete(request))pssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE","Finish the Transfer Challenge before publishing Season Results.");
    const setup=pssrSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  async function pssrRefreshNow(request=pssrRequestContext(),light=false){
    if(!request)return null;
    const ctx=await pssrProviderContext(request,light);if(!pssrContextMatches(request))return null;
    const result=pssrResultError(await provider.read(ctx.options),"Season Results could not be loaded.");if(!pssrContextMatches(request))return null;
    view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;pssrRender();
    if(result.ownResult||result.state?.phase==="RESULTS_READY")pssrSetError("");
    return view;
  }
  function pssrRefresh(light=false){const request=pssrRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pssrQueueProvider(()=>pssrRefreshNow(request,light===true));refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function pssrRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_result_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function pssrTeamCount(){const stateCount=view?.state?.teamCount;if(Number.isInteger(stateCount)&&stateCount>=2&&stateCount<=20)return stateCount;const leagueId=view?.setup?.leagueId||pssrSetupState()?.setup?.leagueId,catalog=catalogApi?.catalog;const clubs=catalog&&leagueId?catalog[leagueId]:null;return Array.isArray(clubs)&&clubs.length>=2&&clubs.length<=20?clubs.length:20;}
  function pssrReadForm(role){
    const prefix=pssrRolePrefix(role),position=pssrField(`${prefix}LeaguePosition`),points=pssrField(`${prefix}LeaguePoints`),goals=pssrField(`${prefix}LeagueGoals`);
    if(!position||!points||!goals||position.value===""||points.value===""||goals.value==="")pssrFail("SEASON_RESULTS_FORM_INCOMPLETE",`Enter league position, league points and league goals for ${pssrManagerName(role)}.`);
    const result={leaguePosition:Number(position.value),leaguePoints:Number(points.value),leagueGoals:Number(goals.value),domesticCup:Boolean(pssrField(`${prefix}DomesticCup`)?.checked),championsLeague:Boolean(pssrField(`${prefix}ChampionsLeague`)?.checked),topScorer:Boolean(pssrField(`${prefix}TopScorer`)?.checked),topAssist:Boolean(pssrField(`${prefix}TopAssist`)?.checked)};
    // The stored result carries europaLeague only when it is true (the sparse key; an unticked box leaves the 7-key r79 shape).
    if(pssrField(`${prefix}EuropaLeague`)?.checked===true){if(result.championsLeague)pssrFail("SEASON_RESULTS_CONTINENTAL_CONFLICT",`${pssrManagerName(role)}: pick Champions League or Europa League, not both.`);result.europaLeague=true;}
    const teamCount=pssrTeamCount(),maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(result.leaguePosition)||result.leaguePosition<1||result.leaguePosition>teamCount)pssrFail("SEASON_RESULTS_POSITION_INVALID",`${pssrManagerName(role)}'s league position must be a whole number from 1 to ${teamCount}.`);
    if(!Number.isInteger(result.leaguePoints)||result.leaguePoints<0||result.leaguePoints>maxPoints)pssrFail("SEASON_RESULTS_POINTS_INVALID",`${pssrManagerName(role)}'s league points must be a whole number from 0 to ${maxPoints}.`);
    if(!Number.isInteger(result.leagueGoals)||result.leagueGoals<0||result.leagueGoals>300)pssrFail("SEASON_RESULTS_GOALS_INVALID",`${pssrManagerName(role)}'s league goals must be a whole number from 0 to 300.`);
    return Object.freeze(result);
  }
  function pssrFingerprint(result){return JSON.stringify({leaguePosition:Number(result.leaguePosition),leaguePoints:Number(result.leaguePoints),leagueGoals:Number(result.leagueGoals),domesticCup:Boolean(result.domesticCup),championsLeague:Boolean(result.championsLeague),topScorer:Boolean(result.topScorer),topAssist:Boolean(result.topAssist),europaLeague:result.europaLeague===true});}
  function pssrPopulate(role,result){if(!result)return;const prefix=pssrRolePrefix(role);pssrField(`${prefix}LeaguePosition`).value=String(result.leaguePosition);pssrField(`${prefix}LeaguePoints`).value=String(result.leaguePoints);pssrField(`${prefix}LeagueGoals`).value=String(result.leagueGoals);for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["EuropaLeague","europaLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]]){const input=pssrField(`${prefix}${suffix}`);if(input)input.checked=result[key]===true;}}
  function pssrDisableRole(role,disabled){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach(suffix=>pssrDisable(pssrField(`${prefix}${suffix}`),disabled));}
  // QoL 3: a half-typed result survives a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on publish.
  function pssrDraftFieldIds(role){const prefix=pssrRolePrefix(role);return RESULT_SUFFIXES.map(suffix=>`${prefix}${suffix}`);}
  function pssrDraftKey(role,request=pssrRequestContext()){return request&&(role==="playerOne"||role==="playerTwo")?`cms.draft.v1:${request.rivalryId}:${request.seasonNumber}:${role}:seasonResult`:"";}
  function pssrDraftClear(role,request=pssrRequestContext()){const key=pssrDraftKey(role,request);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pssrDraftSave(){
    const request=pssrRequestContext(),role=view?.managerRole;
    const key=pssrDraftKey(role,request);if(!key||contextKey!==request.key||view.ownResult||view.state?.phase==="RESULTS_READY"||typeof root.writeStorageValue!=="function")return false;
    const prefix=pssrRolePrefix(role),values={},checks={};let any=false;
    RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){values[suffix]=String(input.value||"");if(values[suffix])any=true;}else if(suffix!=="EuropaLeague"||input.checked){checks[suffix]=Boolean(input.checked);if(checks[suffix])any=true;}});
    if(!any){pssrDraftClear(role,request);return true;}
    return root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,values,checks}))===true;
  }
  function pssrDraftRestore(role){
    const request=pssrRequestContext(),key=pssrDraftKey(role,request);if(!key||typeof root.readStorageValue!=="function")return false;
    let saved;try{saved=JSON.parse(root.readStorageValue(key)||"null");}catch(_error){return false;}
    if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role)return false;
    const prefix=pssrRolePrefix(role),values=saved.values&&typeof saved.values==="object"?saved.values:{},checks=saved.checks&&typeof saved.checks==="object"?saved.checks:{};
    RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){if(input.value===""&&typeof values[suffix]==="string")input.value=values[suffix].slice(0,12);}else if(!input.checked&&checks[suffix]===true)input.checked=true;});
    return true;
  }
  function pssrContinental(id){const match=/^(p[12])(ChampionsLeague|EuropaLeague)$/.exec(String(id||""));if(!match||pssrField(id)?.checked!==true)return;const other=pssrField(`${match[1]}${match[2]==="ChampionsLeague"?"EuropaLeague":"ChampionsLeague"}`);if(other?.checked)other.checked=false;}
  function pssrDraftChange(event){const role=view?.managerRole,id=event?.target?.id;pssrContinental(id);if(!role||!id||!pssrSharedMarker()||!pssrDraftFieldIds(role).includes(id))return;pssrDraftSave();}
  function pssrCard(role){const input=pssrField(`${pssrRolePrefix(role)}LeaguePosition`);return input&&input.closest?input.closest(".seasonResultCard"):null;}
  function pssrSetError(message=""){
    const value=String(message||"");
    if(!value){if(errorNode&&errorNode.textContent===errorMessage)errorNode.textContent="";errorNode=null;errorMessage="";return;}
    const panel=pssrField("seasonReviewPanel"),target=panel&&!panel.classList.contains("hidden")?pssrField("seasonReviewError"):pssrField("seasonEntryError");
    if(target){target.textContent=value;errorNode=target;errorMessage=value;}
  }
  function pssrAppendLine(container,label,value){const row=root.document.createElement("div"),name=root.document.createElement("span"),data=root.document.createElement("strong");row.className="summaryLine seasonReviewLine";name.textContent=label;data.textContent=String(value);row.append(name,data);container.append(row);}
  // r86: the published card shows the manager's Special Player under the name, as the entry card does (none before r86).
  function pssrSpecialPlayerSlot(role){try{const api=root.CareerModeSpecialPlayerChip,sp=api?.live?.(),chip=sp?api.element(root.document,sp[role==="playerOne"?"daniel":"nik"]):null;if(!chip)return null;const slot=root.document.createElement("span");slot.className="seasonSpecialPlayer";slot.appendChild(chip);return slot;}catch(_error){return null;}}
  function pssrRenderReviewCard(container,role,result){if(!container||!result)return;const fragment=root.document.createDocumentFragment(),heading=root.document.createElement("h3"),club=root.document.createElement("p"),special=pssrSpecialPlayerSlot(role);heading.textContent=pssrManagerName(role);club.className="summaryClub";club.textContent=pssrClubName(role);fragment.append(heading);if(special)fragment.append(special);fragment.append(club);pssrAppendLine(fragment,"League Position",result.leaguePosition);pssrAppendLine(fragment,"League Points",result.leaguePoints);pssrAppendLine(fragment,"League Goals",result.leagueGoals);const achievements=root.document.createElement("div");achievements.className="seasonReviewAchievements";[["Champions League",result.championsLeague],["Europa League",result.europaLeague===true],["Domestic Cup",result.domesticCup],["Top Scorer",result.topScorer],["Top Assist",result.topAssist]].forEach(([label,active])=>{const item=root.document.createElement("span");item.className=active?"isEarned":"isNotEarned";item.textContent=`${active?"✓":"—"} ${label}`;achievements.append(item);});fragment.append(achievements);container.replaceChildren(fragment);}
  function pssrEntryMode(reviewing){const panel=pssrField("seasonReviewPanel"),grid=root.document?.querySelector?.("#seasonEntry .seasonEntryGrid"),hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint"),actions=pssrField("completeSeason")?.closest?.(".seasonEntryActions");pssrHidden(panel,!reviewing);pssrHidden(grid,reviewing);pssrHidden(hint,reviewing);pssrHidden(actions,reviewing);if(pssrField("seasonEntry"))pssrField("seasonEntry").dataset.sharedSeasonResults=reviewing?"review":"entry";}
  function pssrRenderReview(result,{waiting=false,ready=false}={}){
    const role=view?.managerRole,other=pssrOtherRole(role),one=pssrField("seasonReviewOne"),two=pssrField("seasonReviewTwo"),ownCard=role==="playerOne"?one:two,otherCard=role==="playerOne"?two:one,confirm=pssrField("confirmSeasonCompletion"),edit=pssrField("editSeasonResults"),overall=pssrField("seasonReviewOverallScore")?.closest?.(".seasonReviewOverall"),warning=root.document?.querySelector?.("#seasonReviewPanel .seasonReviewWarning");
    pssrEntryMode(true);pssrHidden(overall,true);pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonReviewHeading",ready?"BOTH MANAGERS PUBLISHED":waiting?"YOUR RESULT IS PUBLISHED":"REVIEW YOUR SEASON RESULT");pssrText("seasonReviewStatusMeta",ready?"":waiting?"PUBLISHED · WAITING FOR YOUR RIVAL":"NOT PUBLISHED YET");pssrHidden(pssrField("seasonReviewStatusMeta")?.closest?.(".seasonReviewStatus"),ready);
    pssrRenderReviewCard(ownCard,role,result);pssrHidden(ownCard,false);
    if(ready&&view?.opponentResult){pssrRenderReviewCard(otherCard,other,view.opponentResult);pssrHidden(otherCard,false);pssrText("seasonReviewResult","Both managers published their FIFA 17 season results.");}
    else{pssrHidden(otherCard,true);pssrText("seasonReviewResult",waiting?"Your rival sees this only after publishing theirs. This screen updates by itself.":"Check your results. Once published, they are final.");}
    // Job 33 (R8): once both published, the Shared Season Commit status below is the one banner that says what to tap next.
    if(warning){pssrHidden(warning,ready);if(!ready)warning.textContent="PUBLISHING IS FINAL";}
    if(confirm){pssrHidden(confirm,ready);pssrDisable(confirm,busy||waiting);confirm.textContent=waiting?"PUBLISHED ✓":"PUBLISH MY SEASON RESULT";}
    if(edit){pssrHidden(edit,ready||waiting);pssrDisable(edit,busy);edit.textContent="EDIT MY RESULT";}
  }
  function pssrRenderEntry(){
    const role=view?.managerRole;if(!role)return;const other=pssrOtherRole(role),own=view?.ownResult||null,ready=view?.state?.phase==="RESULTS_READY";
    pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonManagerOne",pssrManagerName("playerOne"));pssrText("seasonManagerTwo",pssrManagerName("playerTwo"));pssrText("seasonClubOne",pssrClubName("playerOne"));pssrText("seasonClubTwo",pssrClubName("playerTwo"));
    if(own)pssrPopulate(role,own);if(ready&&view?.opponentResult)pssrPopulate(other,view.opponentResult);
    if(own||ready){pssrDraftClear(role);pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(own||view?.allResults?.[role],{waiting:!ready,ready});return;}
    if(draft&&draft.contextKey===contextKey&&draft.seasonNumber===view.seasonNumber&&draft.managerRole===role){pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(draft.result);return;}
    pssrEntryMode(false);pssrHidden(pssrCard(role),false);pssrHidden(pssrCard(other),true);pssrDraftRestore(role);pssrDisableRole(role,false);pssrDisableRole(other,true);const complete=pssrField("completeSeason");if(complete){complete.textContent="REVIEW MY SEASON RESULT";pssrDisable(complete,busy);}const hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint");if(hint)hint.textContent=`Enter ${pssrManagerName(role)}'s FIFA 17 season result. Your rival enters theirs on their own device.`;
  }
  // H1017-4: a new shared season or manager role starts from an empty form for both managers. Same-context polls keep typed input.
  // formContextKey is the last context the form was rendered for; the tick's context reset leaves it alone so the change is still seen.
  function pssrClearForm(){for(const role of ["playerOne","playerTwo"]){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3)input.value="";else input.checked=false;});}}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pssrWatchedKey=null;
  function pssrWatchSync(){let key="";try{key=pssrWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pssrWatchedKey)return;pssrWatchedKey=key;try{pssrWatchWait();}catch(_error){}}
  function pssrRender(){pssrWatchSync();if(!root.document||!pssrSharedMarker()||!view)return false;const request=pssrRequestContext();if(!request||contextKey!==request.key)return false;if(renderedContextKey!==request.key){renderedContextKey=request.key;draft=null;}const formKey=`${request.key}|${view.managerRole||""}`;if(formContextKey&&formContextKey!==formKey){draft=null;pssrClearForm();}formContextKey=formKey;pssrRenderEntry();return true;}
  function pssrBeginReview(){
    if(!view||!view.managerRole)return false;if(view.ownResult){root.CareerModeSeasonFinalV10?.reviewFinalSeason?.();pssrRender();return true;}
    try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrSetError("");pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
  }
  function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrSetError("");pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
  async function pssrPublish(){
    if(busy||!draft||!view?.managerRole)return false;
    if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("The shared season context changed. Review your result again.");draft=null;return false;}
    let currentResult;try{currentResult=pssrReadForm(view.managerRole);}catch(error){pssrSetError(error.message||error.code);return false;}
    if(pssrFingerprint(currentResult)!==draft.fingerprint){pssrSetError("Your season result changed after review. Choose Edit My Result and review it again before publishing.");return false;}
    const request=pssrRequestContext();if(!request||!pssrContextMatches(request))return false;busy=true;pssrSetError("");const publishRole=view.managerRole;pssrRender();
    try{
      return await pssrQueueProvider(async()=>{
        const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return false;
        let current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;
        let staleRetried=false,contentionRetries=0;
        for(;;){
          if(current.ownResult){pssrDraftClear(publishRole,request);view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
          draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
          const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:draft.result});
          if(published?.code==="SEASON_RESULTS_STALE_BASE_REVISION"&&!staleRetried){staleRetried=true;current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;continue;}
          // JOB-1611: two same-moment publishes can both lose to lock contention instead of one losing to the other's write.
          // One manager then gets aborted (SDK retries spent) or permission-denied (the rival's retried write had not landed
          // by the provider's last re-read) while the rival quietly retries and wins. Wait, re-read and publish again with
          // the same operationId (an own write that did land is bound, never written twice); bounded, then surfaced as before.
          if(PSSR_CONTENTION_CODES.includes(published?.code)&&contentionRetries<PSSR_CONTENTION_RETRY_MS.length){await pssrWait(PSSR_CONTENTION_RETRY_MS[contentionRetries]);contentionRetries+=1;if(!pssrContextMatches(request))return false;const fresh=await provider.read(ctx.options);if(!pssrContextMatches(request))return false;if(fresh?.ok===true)current=fresh;continue;}
          const result=pssrResultError(published,"Your Season Result could not be published.");if(!pssrContextMatches(request))return true;
          pssrDraftClear(publishRole,request);view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;try{await pssrRefreshNow(request);}catch(_error){pssrRefresh().catch(()=>{});}return true;
        }
      });
    }catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Shared Season Result publication failed.");pssrReport("Unable to publish Shared Season Result",error);}return false;}
    finally{busy=false;if(pssrContextMatches(request))pssrRender();}
  }
  async function pssrOpen(){
    const navAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;
    if(!pssrSharedMarker())return false;await pssrEnsureDependencies();const request=pssrRequestContext();if(!request)return false;const result=await pssrRefresh();if(!result||!pssrContextMatches(request)||contextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pssrFail("SEASON_RESULTS_NAVIGATION_UNAVAILABLE");if(navAtTap!==null&&root.getNavigationRevision()!==navAtTap)return false;const shown=await root.navigateTo("seasonEntry");if(shown===false||!pssrContextMatches(request))return false;pssrRender();return true;
  }
  function pssrCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pssrSharedMarker())return;const active=pssrField("seasonEntry");if(!active||active.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="completeSeason")pssrBeginReview();else if(target.id==="editSeasonResults")pssrEdit();else void pssrPublish();}
  function pssrWaitingKey(){const active=["seasonEntry","mainMenu","standings"].some(id=>{const node=pssrField(id);return node&&!node.classList.contains("hidden");});if(!view||contextKey!==pssrRequestContext()?.key||!view.ownResult||view.state?.phase==="RESULTS_READY"||!active)return "";return `${contextKey}|publish`;}
  function pssrFastPollDue(){const key=pssrWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
  function pssrWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pssrWaitingKey()||pssrLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`:null)(pssrRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pssrWaitingKey()&&pssrLiveScreen());}catch(_error){relaxed=false;}return budget.watchWaitPoint("season-results",path,pssrWaitWake,{relaxed});}
  function pssrWaitWake(){if(!busy){void pssrTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pssrTick(true);},400);}
  function pssrWaitHealthy(){const request=pssrRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`);}
  function pssrFastTick(){pssrWatchWait();if(pssrWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pssrFastPollDue())return;void pssrTick(true);}
  // r75: the 15 s check of the visible Season Results screen reads the shared results from the server (see Transfer).
  // r84: the listener also watches while Season Results is open and not yet RESULTS_READY (not only after this manager publishes):
  // 15 s fresh reads here were ~32 billed reads/min for both phones over a 30-90 minute results wait.
  function pssrLiveScreen(){const active=pssrField("seasonEntry");return Boolean(view&&contextKey===pssrRequestContext()?.key&&view.state?.phase!=="RESULTS_READY"&&active&&!active.classList.contains("hidden"));}
  function pssrScreenFresh(request){if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}
  async function pssrTick(light=false){if(!pssrSharedMarker()||root.document?.visibilityState==="hidden"||busy)return;const request=pssrRequestContext();if(!request)return;if(contextKey&&contextKey!==request.key){view=null;draft=null;contextKey="";renderedContextKey="";}if(view?.state?.phase==="RESULTS_READY"&&view.allResults?.playerOne&&view.allResults?.playerTwo)return;const active=pssrField("seasonEntry");if(view||active&&!active.classList.contains("hidden")){if(light!==true&&active&&!active.classList.contains("hidden"))pssrScreenFresh(request);try{await pssrRefresh(light===true);}catch(_error){}}}
  function pssrInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pssrCapture,true);root.document.addEventListener("input",pssrDraftChange,true);root.document.addEventListener("change",pssrDraftChange,true);}root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pssrTick());if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pssrTick();},POLL_MS);root.setInterval(pssrFastTick,FAST_POLL_MS);}return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results",productionEnabled:true,requiresCompletedSharedTransfer:true,privateUntilBothPublished:true,reusesSeasonEntry:true,interceptsLocalSeasonPersistence:true,authoritativeScoring:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pssrWaitingKey()),install:pssrInstall,open:pssrOpen,refresh:pssrRefresh,getState:()=>view,isActive:pssrSharedMarker,canRoute:pssrCanRoute});
});
