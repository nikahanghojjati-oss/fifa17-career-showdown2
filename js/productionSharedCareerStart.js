(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PANEL_ID="productionSharedCareerStartOverlay";
  const CONTROL_ID="continueClubAssignment";
  const POLL_MS=15000;
  // Job 33 (R1): once this manager has acknowledged, read every 3 s for at most 3 minutes while waiting on the rival.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let installed=false,busy=false,pollTimer=null,setupApi=null,provider=null,view=null,lastError="",operationTail=Promise.resolve(),refreshPromise=null,openPromise=null,readyKey="",fastWaitKey="",fastWaitSince=0,autoContinueKey="";

  function pcstCreate(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function pcstReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  async function pcstLoadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function pcstEnsureDependencies(){
    if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-career-start","css/remoteJoining.css");
    await pcstLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pcstLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await pcstLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pcstLoadScript("ssjr-spark-shared-setup","js/sparkSharedShowdownSetup.js",()=>root.CareerModeSparkSharedShowdownSetup);
    await pcstLoadScript("ssjr-career-start-protocol","js/sharedCareerStart.js",()=>root.CareerModeSharedCareerStart);
    await pcstLoadScript("ssjr-career-start-provider","js/sparkSharedCareerStart.js",()=>root.CareerModeSparkSharedCareerStart);
    await pcstLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    await pcstLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;provider=root.CareerModeSparkSharedCareerStart;
    if(!setupApi||typeof setupApi.getState!=="function"||typeof setupApi.refresh!=="function")throw new Error("Shared Setup authority is unavailable for Career Start.");
    if(!provider||typeof provider.read!=="function"||typeof provider.acknowledge!=="function")throw new Error("Shared Career Start provider is unavailable.");
  }
  function pcstSetupState(){try{return setupApi&&setupApi.getState?setupApi.getState():root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function pcstConfirmed(){const state=pcstSetupState();return Boolean(state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pcstReady(){return Boolean(view&&view.state&&view.state.phase==="CAREER_START_READY");}
  function pcstStopPolling(){if(pollTimer!==null&&typeof root.clearInterval==="function"){root.clearInterval(pollTimer);pollTimer=null;}return true;}
  function pcstSerialize(task){const run=operationTail.then(task,task);operationTail=run.then(()=>undefined,()=>undefined);return run;}
  function pcstDeactivateSetupPresentation(){const presentation=root.CareerModeProductionSharedShowdownPresentation;if(presentation&&typeof presentation.deactivate==="function")presentation.deactivate();return true;}
  function pcstLeagueName(id){try{const item=typeof root.getLeagueById==="function"&&root.getLeagueById(id);if(item&&item.name)return item.name;}catch(_error){}return String(id||"").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());}
  function pcstRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `career_start_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup instead of re-reading it.
  async function pcstProviderOptions(light=false){
    await pcstEnsureDependencies();if(!(light===true&&pcstConfirmed()))await setupApi.refresh();const state=setupApi.getState();if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)throw new Error("Both managers must finish Shared Setup before Career Start.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=await runtime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)throw new Error("Connected account services are unavailable.");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,cryptoImpl:root.crypto}};
  }
  function pcstSetupKey(state){return state&&state.ready===true&&state.rivalryId&&state.managerRole&&state.setup?`${state.rivalryId}|${state.managerRole}|${JSON.stringify(state.setup)}`:"";}
  function pcstApplyView(result,state){
    view={...result,setup:state.setup};readyKey=pcstReady()?pcstSetupKey(state):"";lastError="";pcstRender();pcstDecorateControl();if(pcstReady()){pcstStopPolling();pcstScheduleAutoContinue();}return view;
  }
  function pcstPanelOpen(){const overlay=root.document&&root.document.getElementById(PANEL_ID);return Boolean(overlay&&!overlay.classList.contains("hidden"));}
  // Job 33 (R4b): once BOTH managers have attested (CAREER_START_READY), an open Career Start moves on to the Transfer
  // Challenge by itself. Navigation only: each manager's own I STARTED AT tap is still required, and the button stays as a fallback.
  function pcstAutoContinueKey(){return view&&view.state&&view.setup?`${view.setup.rivalryId||pcstSetupState()?.rivalryId||""}|${view.state.revision}`:"";}
  function pcstScheduleAutoContinue(){if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcstAutoContinue(),0);else void pcstAutoContinue();}
  async function pcstAutoContinue(){
    if(busy||!pcstReady()||!pcstPanelOpen())return false;const key=pcstAutoContinueKey();if(!key||key===autoContinueKey)return false;
    autoContinueKey=key;return pcstOpenTransferChallenge();
  }
  function pcstOwnAcknowledged(result){
    const role=result?.managerRole,state=result?.state;
    return Boolean(role&&state&&Array.isArray(state.acknowledgedRoles)&&state.acknowledgedRoles.includes(role));
  }
  // CAREER_START_READY is final for one confirmed Shared Setup, and the Transfer and Season Result providers re-check it inside
  // their own transactions. Transfer and Season Results call this before every read and publish, so re-reading it there only
  // added a request that could fail ("Career Start could not be read.") and block a publish. Reuse it for the same Setup.
  function pcstRefresh(light=false){
    if(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()))return Promise.resolve(view);
    if(refreshPromise)return refreshPromise;
    const run=pcstSerialize(async()=>{const ctx=await pcstProviderOptions(light===true),result=await provider.read(ctx.options);if(!result||result.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:result&&result.code});return pcstApplyView(result,ctx.state);});
    refreshPromise=run.finally(()=>{if(refreshPromise===wrapped)refreshPromise=null;});
    const wrapped=refreshPromise;
    return wrapped;
  }
  async function pcstAcknowledge(){
    if(busy)return false;
    busy=true;lastError="";pcstRender();
    const operationId=pcstRandomOperationId();
    try{
      return await pcstSerialize(async()=>{
        const ctx=await pcstProviderOptions();
        let current=await provider.read(ctx.options);
        if(!current||current.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:current&&current.code});
        if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
        for(let attempt=0;attempt<2;attempt+=1){
          const result=await provider.acknowledge({...ctx.options,operationId,baseRevision:current.revision||0});
          if(result&&result.ok===true){pcstApplyView(result,ctx.state);return true;}
          const code=result&&result.code||"CAREER_START_PROVIDER_FAILED";
          // Job 21: two managers acknowledging at once -> the loser is rejected by the Rules (permission-denied); treat it like a stale revision (re-read, retry once).
          if(["CAREER_START_STALE_BASE_REVISION","CAREER_START_ROLE_ALREADY_ACKNOWLEDGED","CAREER_START_ALREADY_READY","permission-denied","firestore/permission-denied","permission_denied"].includes(code)){
            const refreshed=await provider.read(ctx.options);
            if(!refreshed||refreshed.ok!==true)throw Object.assign(new Error("Career Start could not be reconciled after another acknowledgement."),{code:refreshed&&refreshed.code||code});
            current=refreshed;
            if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
            if((code==="CAREER_START_STALE_BASE_REVISION"||code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied")&&attempt===0)continue;
          }
          throw Object.assign(new Error("Career Start acknowledgement was rejected."),{code});
        }
        throw Object.assign(new Error("Career Start acknowledgement could not be reconciled."),{code:"CAREER_START_ACK_RETRY_EXHAUSTED"});
      });
    }catch(error){
      lastError=`NOT RECORDED · ${error.code||error.message||"Try again."}`;
      pcstReport("Unable to acknowledge Shared Career Start",error);
      return false;
    }finally{
      busy=false;pcstRender();if(pcstReady())pcstScheduleAutoContinue();
    }
  }
  async function pcstOpenTransferChallenge(){
    if(busy||!pcstReady())return false;
    busy=true;pcstRender();
    try{
      await pcstEnsureDependencies();
      const transfer=root.CareerModeProductionSharedTransferChallenge;
      if(!transfer||typeof transfer.install!=="function"||typeof transfer.open!=="function")throw new Error("Shared Transfer Challenge is unavailable.");
      transfer.install();
      const opened=await transfer.open();
      if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
      pcstClosePanel();
      return true;
    }catch(error){
      lastError=`TRANSFER CHALLENGE NOT OPENED · ${error.code||error.message||"Refresh and try again."}`;
      pcstReport("Unable to continue to Shared Transfer Challenge",error);
      return false;
    }finally{
      busy=false;pcstRender();
    }
  }
  function pcstManagerLabel(role){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;const name=showdown&&showdown.managers&&showdown.managers[role];if(name)return name;}catch(_error){}return role==="playerOne"?"PLAYER ONE":"PLAYER TWO";}
  function pcstRow(label,value,state){const item=pcstCreate("div","settingsInfoRow");item.dataset.careerRow=state||"";item.append(pcstCreate("span","",label),pcstCreate("strong","",value));return item;}
  function pcstRender(){
    const overlay=root.document&&root.document.getElementById(PANEL_ID);if(!overlay)return;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return;body.replaceChildren();
    const setup=view&&view.setup||pcstSetupState()?.setup,role=view&&view.managerRole||pcstSetupState()?.managerRole,career=view&&view.state||null,acknowledged=new Set(career&&career.acknowledgedRoles||[]);if(!setup||!role){body.append(pcstCreate("h2","","CAREER START"),pcstCreate("p","","Resolving the confirmed Shared Showdown…"));return;}
    const ownClub=setup.clubs[role],otherRole=role==="playerOne"?"playerTwo":"playerOne",otherClub=setup.clubs[otherRole],ready=career&&career.phase==="CAREER_START_READY",mine=acknowledged.has(role);
    body.append(pcstCreate("span","remoteJoiningEyebrow","SHARED SHOWDOWN · CAREER START"),pcstCreate("h2","","START YOUR FIFA 17 CAREER"),pcstCreate("p","",`Your permanent club is ${ownClub}. Start or load a FIFA 17 Career Mode save with that club. This website cannot inspect FIFA 17, so your acknowledgement is the shared record that you reached your matching career.`));
    const grid=pcstCreate("div","settingsInfoGrid");grid.append(pcstRow("YOU",`${pcstManagerLabel(role)} · ${ownClub}`,mine?"ready":"pending"),pcstRow("RIVAL",`${pcstManagerLabel(otherRole)} · ${otherClub}`,acknowledged.has(otherRole)?"ready":"pending"),pcstRow("LEAGUE",pcstLeagueName(setup.leagueId)),pcstRow("SHOWDOWN LENGTH",`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"}`));body.append(grid);
    const statusText=lastError||(ready?"BOTH MANAGERS STARTED ✓ · Continue to the Shared Transfer Challenge.":mine?"YOUR CAREER IS ACKNOWLEDGED · Waiting for your rival to start their assigned career.":"When your FIFA 17 career is created or loaded at the assigned club, confirm below.");
    const status=pcstCreate("p","remoteJoiningStatus",statusText);status.dataset.careerStatus="true";status.setAttribute("role","status");status.setAttribute("aria-live","polite");body.append(status);
    const actions=pcstCreate("div","remoteJoiningActions");const confirm=pcstCreate("button","compactButton",ready?"CONTINUE TO TRANSFER CHALLENGE":mine?"MY CAREER STARTED ✓":`I STARTED AT ${String(ownClub).toUpperCase()}`);confirm.type="button";confirm.disabled=busy||(!ready&&mine);confirm.addEventListener("click",()=>void (ready?pcstOpenTransferChallenge():pcstAcknowledge()));actions.append(confirm);const refreshButton=pcstCreate("button","compactButton","REFRESH");refreshButton.type="button";refreshButton.disabled=busy;refreshButton.addEventListener("click",()=>void pcstRefresh().catch(error=>pcstReport("Unable to refresh Shared Career Start",error)));actions.append(refreshButton);body.append(actions);
  }
  // r50: opening Career Start loads its protocol, provider and styles on first use. The tapped control
  // shows OPENING… and stays disabled until the panel is up, and overlapping opens share one attempt,
  // so a slow first load never looks like a tap that did nothing.
  function pcstOpenPanel(){
    if(openPromise)return openPromise;
    const run=Promise.resolve().then(pcstOpenPanelNow);openPromise=run;
    run.finally(()=>{if(openPromise===run)openPromise=null;pcstDecorateControl();}).catch(()=>{});
    try{pcstDecorateControl();}catch(_error){}
    return run;
  }
  async function pcstOpenPanelNow(){
    pcstDeactivateSetupPresentation();await pcstEnsureDependencies();let overlay=root.document.getElementById(PANEL_ID);if(!overlay){overlay=pcstCreate("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Career Start");const shell=pcstCreate("div","remoteJoiningShell"),header=pcstCreate("div","remoteJoiningHeader");header.append(pcstCreate("strong","","CAREER MODE SHOWDOWN // 17"));const close=pcstCreate("button","remoteJoiningDismiss","×");close.type="button";close.setAttribute("aria-label","Close Career Start");close.addEventListener("click",pcstClosePanel);header.append(close);const body=pcstCreate("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}overlay.classList.remove("hidden");pcstRender();await pcstRefresh();return true;
  }
  function pcstClosePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
  function pcstPresentationOwnsControl(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function pcstClearControlOwnership(button){if(button&&button.dataset.sharedCareerStart==="true")delete button.dataset.sharedCareerStart;return false;}
  function pcstDecorateControl(){
    const button=root.document&&root.document.getElementById(CONTROL_ID);if(!button)return false;
    if(!pcstConfirmed()||pcstPresentationOwnsControl())return pcstClearControlOwnership(button);
    const opening=Boolean(openPromise),label=opening?"OPENING CAREER START…":"CONTINUE TO CAREER START";
    if(button.textContent!==label)button.textContent=label;
    if(button.disabled!==opening)button.disabled=opening;
    if(opening)button.setAttribute("aria-busy","true");else if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");
    if(button.classList.contains("hidden"))button.classList.remove("hidden");
    if(button.getAttribute("aria-disabled")!==String(opening))button.setAttribute("aria-disabled",String(opening));
    if(button.dataset.sharedCareerStart!=="true")button.dataset.sharedCareerStart="true";
    return true;
  }
  function pcstCapture(event){const button=event.target&&event.target.closest&&event.target.closest(`#${CONTROL_ID}`);if(!button||button.dataset.sharedCareerStart!=="true"||!pcstConfirmed())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pcstOpenPanel().catch(error=>pcstReport("Unable to open Shared Career Start",error));}
  function pcstWaitingKey(){if(!view||!view.state||pcstReady()||!pcstOwnAcknowledged(view)||!pcstPanelOpen())return "";return `${view.managerRole}|${view.state.revision}`;}
  function pcstFastPollDue(){const key=pcstWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  function pcstFastTick(){if(root.document&&root.document.visibilityState==="hidden")return;if(busy||!pcstFastPollDue())return;void pcstTick(true);}
  async function pcstTick(light=false){
    if(root.document&&root.document.visibilityState==="hidden")return false;
    if(pcstReady()){pcstStopPolling();return false;}
    try{if(!setupApi&&root.CareerModeProductionSharedShowdownSetup)setupApi=root.CareerModeProductionSharedShowdownSetup;pcstDecorateControl();const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&pcstConfirmed()&&!busy)await pcstRefresh(light===true);return true;}catch(_error){return false;}
  }
  function pcstInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pcstCapture,true);const observer=new MutationObserver(()=>pcstDecorateControl());observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled","class"]});}if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pcstTick(),POLL_MS);root.setInterval(pcstFastTick,FAST_POLL_MS);}void pcstEnsureDependencies().then(()=>pcstTick()).catch(()=>{});return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-career-start",productionEnabled:true,requiresConfirmedSharedSetup:true,requiresExactActiveSession:true,twoManagerAcknowledgement:true,routesReadyStateToTransferChallenge:true,reconcilesConcurrentAcknowledgement:true,persistentVisibleErrors:true,canonicalStorageMutation:false,billingRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcstWaitingKey()),autoContinuesWhenBothStarted:true,visibilityAwarePolling:true,serializedOperations:true,terminalPollingStops:true,deactivatesSetupPresentation:true,install:pcstInstall,openPanel:pcstOpenPanel,closePanel:pcstClosePanel,refresh:pcstRefresh,openTransferChallenge:pcstOpenTransferChallenge,getState:()=>view});
});
