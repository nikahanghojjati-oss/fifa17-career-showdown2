(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedJourneyEntry=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
  const PANEL_ID="productionSharedJourneyEntryOverlay";
  const SHARED_START_ID="startSharedShowdown";
  const SHARED_CONTINUE_ID="continueSharedSetupGate";
  const LOCAL_SPIN_ID="spinLeague";
  const LOCAL_CLUB_ID="openClubPack";
  let installed=false,busy=false,remoteUnsubscribe=null,identityUnsubscribe=null,remoteReturnBusy=false,renderGeneration=0;

  function activeSavedShowdown(){
    try{
      const runtime=root.CareerModeSaveLibraryRuntime;
      if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return null;
      const library=runtime.getLibrarySnapshot();
      if(!library||!library.activeSaveId||!Array.isArray(library.saves))return null;
      const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return entry&&entry.showdown||null;
    }catch(_error){return null;}
  }
  function persistedPending(){const showdown=activeSavedShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared"&&showdown.sharedJourney.setupPending===true);}
  function pending(){if(persistedPending())return true;try{return root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1";}catch(_error){return false;}}
  function presentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function setPending(value){try{if(root.sessionStorage){if(value)root.sessionStorage.setItem(PENDING_KEY,"1");else root.sessionStorage.removeItem(PENDING_KEY);}}catch(_error){}applyLocalDrawLock();}
  function currentSaveShell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function normalizeCanonicalPlayers(){const showdown=currentSaveShell();if(!showdown)throw new Error("The prepared Showdown is unavailable.");showdown.name="Daniel vs Nik";showdown.managers={...(showdown.managers&&typeof showdown.managers==="object"?showdown.managers:{}),playerOne:"Daniel",playerTwo:"Nik"};return showdown;}
  function persistPendingMarker(){
    const showdown=currentSaveShell();
    if(!showdown||showdown.selectedLeague||showdown.clubs&&((showdown.clubs.playerOne)||(showdown.clubs.playerTwo))||Array.isArray(showdown.rounds)&&showdown.rounds.length)throw new Error("Career setup can be attached only before league and club selection.");
    const runtime=root.CareerModeSaveLibraryRuntime;
    if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.saveCurrentShowdown!=="function")throw new Error("Career storage is unavailable.");
    const previous=showdown.sharedJourney;showdown.sharedJourney={contractVersion:1,mode:"shared",setupPending:true};
    if(runtime.saveCurrentShowdown()!==true){showdown.sharedJourney=previous;throw new Error("Career setup could not be saved.");}
    if(!persistedPending()){showdown.sharedJourney=previous;runtime.saveCurrentShowdown();throw new Error("Career setup could not be verified.");}
    return true;
  }
  function discardUnmarkedShell(){try{const runtime=root.CareerModeSaveLibraryRuntime;if(runtime&&typeof runtime.isReady==="function"&&runtime.isReady()&&typeof runtime.clearActiveShowdown==="function")runtime.clearActiveShowdown();}catch(_error){}}
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  function report(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else console.error(context,error);}
  function entryIdentity(){return root.CareerModeOnlinePlayerIdentity||null;}
  function entryIdentityState(){try{return entryIdentity()?.getState?.()||null;}catch(_error){return null;}}
  function entryIdentityReady(){const current=entryIdentityState();return Boolean(current&&current.status==="ready"&&current.managerId&&current.registered);}
  function syncStartButtonIdentity(){
    const start=root.document&&root.document.getElementById("startShowdown");if(!start)return false;const current=entryIdentityState(),ready=entryIdentityReady();
    const label=ready?"START A SHOWDOWN":current?.status==="choose-manager"?"CHOOSE PLAYER TO START":current?.status==="offline"?"RECONNECT TO START":current?.status==="signed-out"?"SIGN IN TO START":"CONNECT TO START";
    if(start.textContent!==label)start.textContent=label;start.title=ready?"":"Sign in and choose Daniel or Nik before starting a Showdown.";return ready;
  }
  async function loadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Required runtime is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function loadStyle(){if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-entry","css/remoteJoining.css");}
  function applyLocalDrawLock(){
    const locked=pending(),presentationOwns=locked&&presentationActive();
    for(const id of [LOCAL_SPIN_ID,LOCAL_CLUB_ID]){
      const button=root.document&&root.document.getElementById(id);if(!button)continue;
      if(locked&&!presentationOwns){button.disabled=true;button.dataset.sharedJourneyLocked="true";button.setAttribute("aria-disabled","true");button.title="Both players must be connected before this step.";}
      else if(button.dataset.sharedJourneyLocked==="true"){button.disabled=false;delete button.dataset.sharedJourneyLocked;button.removeAttribute("aria-disabled");button.removeAttribute("title");}
    }
    const wheel=root.document&&root.document.querySelector("#leagueWheelScreen .wheelContainer");
    if(wheel){
      let resume=root.document.getElementById(SHARED_CONTINUE_ID);
      if(locked&&!presentationOwns&&!resume){resume=create("button","menuButton","CONTINUE CAREER");resume.id=SHARED_CONTINUE_ID;resume.type="button";resume.addEventListener("click",()=>void openPanel());wheel.insertBefore(resume,wheel.querySelector(".backButton")||null);}
      if((!locked||presentationOwns)&&resume)resume.remove();
      let note=root.document.getElementById("sharedJourneyLeagueLockNote");
      if(locked&&!presentationOwns&&!note){note=create("p","stateNote","Daniel and Nik must both be connected before league selection.");note.id="sharedJourneyLeagueLockNote";wheel.insertBefore(note,wheel.firstChild);}
      if((!locked||presentationOwns)&&note)note.remove();
    }
  }
  async function ensureSaveAuthority(){
    await loadScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");
    await root.ensureSaveLibraryRuntimeAuthority();
    if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay runtime is unavailable.");
    await root.ensureGameplayModules();
  }
  async function provisionJoinerShell(totalRounds){
    const rounds=Number(totalRounds);
    if(![1,3,5,10].includes(rounds))throw new Error("Daniel's connection code does not contain a valid season length.");
    await ensureSaveAuthority();
    const runtime=root.CareerModeSaveLibraryRuntime;
    if(!runtime?.isReady?.())throw new Error("Career storage is unavailable.");

    const existing=activeSavedShowdown();
    const existingIsEmptyShared=Boolean(
      existing
      && existing.sharedJourney?.mode==="shared"
      && existing.sharedJourney?.setupPending===true
      && !existing.selectedLeague
      && !existing.clubs?.playerOne
      && !existing.clubs?.playerTwo
      && (!Array.isArray(existing.rounds)||existing.rounds.length===0)
    );
    if(existingIsEmptyShared&&Number(existing.totalRounds)===rounds){
      setPending(true);
      applyLocalDrawLock();
      return true;
    }
    if(existing){
      throw new Error("This browser already has a different current Showdown. Delete the old Showdown first, then paste Daniel's code again.");
    }

    const round=root.document?.getElementById("roundAmount");
    if(!round)throw new Error("Season setup is unavailable.");
    const prior=round.value;
    let created=false,marked=false;
    try{
      round.value=String(rounds);
      setPending(true);
      if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
      created=Boolean(await root.createShowdown());
      if(!created)throw new Error("Nik's local career copy could not be prepared.");
      normalizeCanonicalPlayers();
      persistPendingMarker();
      marked=true;
      if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);
      applyLocalDrawLock();
      return true;
    }catch(error){
      if(created&&!marked)discardUnmarkedShell();
      setPending(false);
      throw error;
    }finally{
      round.value=prior;
    }
  }

  async function currentPairStateForFreshStart(){
    const identity=root.CareerModeOnlinePlayerIdentity;
    if(!identity||typeof identity.syncPair!=="function")throw new Error("The current Showdown connection service is unavailable.");
    const first=await identity.syncPair();
    const next=!first||first.status==="unavailable"?await identity.syncPair():first;
    if(!next)throw new Error("The current Showdown connection could not be verified.");
    return next;
  }
  async function prepareFreshStart(){
    const pairState=await currentPairStateForFreshStart();
    if(pairState&&pairState.status==="unavailable")throw new Error("The current Showdown connection could not be verified. Try again before starting a new Showdown.");
    const hasLivePair=Boolean(pairState&&pairState.rivalryId&&["active","pending-pair"].includes(pairState.connectionState));
    if(!hasLivePair)return true;

    const confirmed=root.confirm?.(
      "Start a new Showdown? This will close the current Daniel vs Nik Showdown for both players. Your player identity, registered device, Legacy history, app settings and existing local recovery data will be kept."
    );
    if(confirmed===false)return false;

    const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
    if(!pair||typeof pair.abandonCurrentShowdown!=="function")throw new Error("Safe Showdown restart is unavailable in this build.");
    const closed=await pair.abandonCurrentShowdown({expectedRivalryId:pairState.rivalryId});
    if(!closed||closed.ok!==true)throw new Error("The current Showdown could not be closed safely. No new Showdown was created.");

    setPending(false);
    root.stopTransferTimerLoop?.();
    root.resetTransientSelectionOperations?.();
    return true;
  }
  async function startShared(){
    if(busy)return false;
    if(!entryIdentityReady()){
      const identity=entryIdentity();syncStartButtonIdentity();
      if(identity&&typeof identity.openGate==="function"){identity.openGate();return false;}
      root.showAppNotice?.("Sign in and choose Daniel or Nik before starting a Showdown.","error",6000);return false;
    }
    busy=true;const button=root.document.getElementById(SHARED_START_ID)||root.document.getElementById("startShowdown");if(button)button.disabled=true;
    const round=root.document.getElementById("roundAmount"),priorRound=round?round.value:null;let shellCreated=false,markerPersisted=false;
    try{
      await ensureSaveAuthority();
      const freshStartReady=await prepareFreshStart();
      if(!freshStartReady)return false;
      setPending(true);
      if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
      const created=await root.createShowdown();shellCreated=Boolean(created);if(!created)throw new Error("The Showdown could not be prepared.");
      normalizeCanonicalPlayers();persistPendingMarker();markerPersisted=true;applyLocalDrawLock();await openPanel();return true;
    }catch(error){if(shellCreated&&!markerPersisted)discardUnmarkedShell();setPending(false);report("Unable to prepare Showdown",error);return false;}
    finally{if(round&&priorRound!==null)round.value=priorRound;if(button)button.disabled=false;busy=false;syncStartButtonIdentity();}
  }
  async function openPersistentPairControls(){
    closePanel();
    try{
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair),identity=root.CareerModeOnlinePlayerIdentity;
      if(!pair||typeof pair.render!=="function"||!identity||typeof identity.syncPair!=="function")throw new Error("Player connection controls are unavailable.");
      if(typeof root.navigateTo==="function")await root.navigateTo("mainMenu",{addToHistory:false,allowCanonicalFallback:true});else if(typeof root.showScreen==="function")await root.showScreen("mainMenu",false);
      const first=await identity.syncPair(),next=!first||first.status==="unavailable"?await identity.syncPair():first;
      if(!next||next.status==="unavailable")throw new Error("Player connection controls are temporarily unavailable.");
      pair.render();
      const panel=root.document.getElementById("persistentNikDanielPairPanel");if(!panel)throw new Error("Player connection controls could not be opened.");
      panel.scrollIntoView?.({block:"center"});panel.querySelector("button,input")?.focus?.();
    }catch(error){report("Unable to open player connection setup",error);}
  }
  async function remoteState(){
    try{await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);const remote=root.CareerModeSparkRemoteJoining;return remote&&typeof remote.getState==="function"?remote.getState():null;}catch(_error){return null;}
  }
  function disarmRemoteReturn(){if(typeof remoteUnsubscribe==="function")remoteUnsubscribe();remoteUnsubscribe=null;}
  function armRemoteReturn(remote){
    disarmRemoteReturn();if(!remote||typeof remote.subscribe!=="function"||!pending())return false;
    const onState=next=>{
      if(!pending()||remoteReturnBusy||!next||next.sessionState!=="active"||next.pendingAction!=null)return;
      remoteReturnBusy=true;disarmRemoteReturn();
      Promise.resolve().then(async()=>{if(typeof remote.closePanel==="function")remote.closePanel();await openPanel();}).catch(error=>report("Unable to return to career entry after connection",error)).finally(()=>{remoteReturnBusy=false;});
    };
    remoteUnsubscribe=remote.subscribe(onState);if(typeof remote.getState==="function")onState(remote.getState());return true;
  }
  async function openRemote(){
    closePanel();
    try{
      await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);
      const remote=root.CareerModeSparkRemoteJoining;if(!remote||typeof remote.openPanel!=="function")throw new Error("Player connection is unavailable.");
      await remote.openPanel();armRemoteReturn(remote);
    }catch(error){disarmRemoteReturn();report("Unable to connect the players",error);}
  }
  async function confirmedSetupSnapshot(){
    try{
      await loadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
      const setup=root.CareerModeProductionSharedShowdownSetup;
      if(!setup||typeof setup.refresh!=="function"||typeof setup.getState!=="function")return null;
      await setup.refresh();const snapshot=setup.getState();
      return snapshot&&snapshot.ready===true&&snapshot.setup&&snapshot.setup.phase==="SHOWDOWN_CONFIRMED"&&snapshot.setup.revision===6?snapshot:null;
    }catch(_error){return null;}
  }
  async function openCareerStart(){
    await loadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
    const career=root.CareerModeProductionSharedCareerStart;if(!career||typeof career.openPanel!=="function")throw new Error("Career Start is unavailable.");
    await career.openPanel();return true;
  }
  async function openSharedExperience(){
    closePanel();
    try{
      await ensureSaveAuthority();
      const confirmed=await confirmedSetupSnapshot();
      if(confirmed){await openCareerStart();applyLocalDrawLock();return true;}
      await loadScript("ssjr-polished-presentation","js/productionSharedShowdownPresentation.js",()=>root.CareerModeProductionSharedShowdownPresentation);
      const presentation=root.CareerModeProductionSharedShowdownPresentation;if(!presentation||typeof presentation.activate!=="function")throw new Error("Showdown presentation is unavailable.");
      await presentation.activate();applyLocalDrawLock();return true;
    }catch(error){report("Unable to enter the Showdown",error);await openPanel();return false;}
  }
  async function statusSnapshot(){
    let account=null,pairing=null,rivalry=null,remote=null;
    try{
      await Promise.all([loadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),loadScript("spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount)]);
      const connected=root.CareerModeSparkConnectedAccount;if(connected&&typeof connected.initialize==="function")await connected.initialize();account=connected&&connected.getState?connected.getState():null;
      if(account&&account.connected){
        await Promise.all([loadScript("pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing),loadScript("rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry)]);
        const pairingApi=root.CareerModeSparkPrivatePairing;if(pairingApi&&pairingApi.initialize)await pairingApi.initialize();pairing=pairingApi&&pairingApi.getState?pairingApi.getState():null;
        const rivalryApi=root.CareerModeSparkConnectedRivalry;if(rivalryApi&&rivalryApi.initialize)await rivalryApi.initialize();rivalry=rivalryApi&&rivalryApi.getState?rivalryApi.getState():null;
      }
      remote=await remoteState();
    }catch(_error){}
    const active=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&remote.rivalryId===rivalry.rivalryId&&account&&remote.accountId===account.accountId&&pairing&&remote.deviceId===pairing.deviceId&&Number.isFinite(remote.expiresAtEpochMs)&&Date.now()<remote.expiresAtEpochMs);
    return Object.freeze({accountReady:Boolean(account&&account.connected),deviceReady:Boolean(pairing&&pairing.registered),rivalryReady:Boolean(rivalry&&rivalry.attached&&rivalry.rivalryId),active});
  }
  function row(label,value){const item=create("div","settingsInfoRow");item.append(create("span","",label),create("strong","",value));return item;}
  async function renderPanel(){
    const generation=++renderGeneration,overlay=root.document.getElementById(PANEL_ID);if(!overlay)return false;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return false;
    const status=await statusSnapshot();if(generation!==renderGeneration)return false;
    const confirmed=status.active?await confirmedSetupSnapshot():null;if(generation!==renderGeneration)return false;
    body.replaceChildren();body.append(create("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),create("h2","","GET READY"),create("p","","Daniel and Nik must both be connected before the career begins."));
    const grid=create("div","settingsInfoGrid");
    grid.append(row("ACCOUNT",status.accountReady?"READY":"REQUIRED"),row("THIS BROWSER",status.deviceReady?"READY":"REQUIRED"),row("DANIEL + NIK",status.rivalryReady?"CONNECTED":"CONNECT"),row("CAREER",status.active?"READY":"WAITING"));body.append(grid);
    const actions=create("div","remoteJoiningActions");
    const save=create("button","compactButton",status.rivalryReady?"REVIEW CONNECTION":"CONNECT PLAYERS");save.type="button";save.addEventListener("click",()=>void openPersistentPairControls());actions.append(save);
    const remote=create("button","compactButton",status.active?"CONNECTED":"CONTINUE");remote.type="button";remote.disabled=!status.rivalryReady;remote.addEventListener("click",()=>void openRemote());actions.append(remote);
    const setup=create("button","compactButton",status.active?"START CAREER":"WAITING FOR BOTH PLAYERS");setup.type="button";setup.disabled=!status.active;setup.addEventListener("click",()=>void openSharedExperience());actions.append(setup);
    const refresh=create("button","compactButton","REFRESH");refresh.type="button";refresh.addEventListener("click",()=>void renderPanel());actions.append(refresh);body.append(actions);
    const note=create("p","remoteJoiningStatus",status.active?(confirmed?"Ready. Continue to Career Start.":"Ready. Continue when both players are set."):"Both players must be connected before league and club selection.");note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);return true;
  }
  async function openPanel(){
    await loadStyle();applyLocalDrawLock();let overlay=root.document.getElementById(PANEL_ID);
    if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Career Mode Showdown entry");const shell=create("div","remoteJoiningShell"),header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close career entry");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
    overlay.classList.remove("hidden");await renderPanel();return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
  function installStartButton(){
    const start=root.document.getElementById("startShowdown");if(!start)return false;
    syncStartButtonIdentity();
    if(start.dataset.canonicalShowdownStart==="true")return true;
    start.dataset.canonicalShowdownStart="true";
    start.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();void startShared();},true);
    const duplicate=root.document.getElementById(SHARED_START_ID);if(duplicate)duplicate.remove();
    const note=root.document.getElementById("sharedShowdownOrderingNote");if(note)note.remove();
    return true;
  }
  function install(){if(installed)return true;installed=true;installStartButton();applyLocalDrawLock();const identity=entryIdentity();if(identity&&typeof identity.subscribe==="function")identityUnsubscribe=identity.subscribe(()=>syncStartButtonIdentity());const observer=new MutationObserver(()=>{installStartButton();applyLocalDrawLock();});observer.observe(root.document.documentElement,{childList:true,subtree:true});if(pending())setTimeout(()=>void openPanel(),0);return true;}

  return Object.freeze({contractVersion:6,feature:"ssjr-production-paired-first-entry",productionEnabled:true,singleProductEntry:true,pairingBeforeLeagueClub:true,activeSessionBeforeLeagueClub:true,peerActiveReturnToSharedEntry:true,bothDevicesPrepareSharedShell:true,joinerShellProvisionedAutomatically:true,continueCareerUsesPairedAuthority:true,polishedLeagueWheelAfterAuthority:true,polishedClubPacksAfterAuthority:true,confirmedSetupResumesAtCareerStart:true,engineeringSetupPanelPlayerFacing:false,persistedSaveMarker:true,canonicalLocalSaveMutationDuringSharedSetup:false,billingRequired:false,install,preparePairingShell:startShared,provisionJoinerShell,openPanel,closePanel,openSharedExperience,isPending:pending});
});