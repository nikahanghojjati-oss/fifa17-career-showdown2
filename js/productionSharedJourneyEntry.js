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
  let installed=false,busy=false;

  function revision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content:"1.9.1-r2";}
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
  function persistedPending(){
    const showdown=activeSavedShowdown();
    return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared"&&showdown.sharedJourney.setupPending===true);
  }
  function pending(){
    if(persistedPending())return true;
    try{return root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1";}catch(_error){return false;}
  }
  function setPending(value){try{if(root.sessionStorage){if(value)root.sessionStorage.setItem(PENDING_KEY,"1");else root.sessionStorage.removeItem(PENDING_KEY);}}catch(_error){}applyLocalDrawLock();}
  function currentSaveShell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function persistPendingMarker(){
    const showdown=currentSaveShell();
    if(!showdown||showdown.selectedLeague||showdown.clubs&&((showdown.clubs.playerOne)||(showdown.clubs.playerTwo))||Array.isArray(showdown.rounds)&&showdown.rounds.length){throw new Error("Shared mode marker can be attached only to a pre-draw Save shell.");}
    const runtime=root.CareerModeSaveLibraryRuntime;
    if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.saveCurrentShowdown!=="function")throw new Error("Save Library authority is unavailable for the shared-mode marker.");
    const previous=showdown.sharedJourney;
    showdown.sharedJourney={contractVersion:1,mode:"shared",setupPending:true};
    if(runtime.saveCurrentShowdown()!==true){showdown.sharedJourney=previous;throw new Error("The durable shared-mode marker could not be saved with the pre-draw shell.");}
    if(!persistedPending()){showdown.sharedJourney=previous;runtime.saveCurrentShowdown();throw new Error("The durable shared-mode marker did not round-trip through Save Library authority.");}
    return true;
  }
  function discardUnmarkedShell(){
    try{
      const runtime=root.CareerModeSaveLibraryRuntime;
      if(runtime&&typeof runtime.isReady==="function"&&runtime.isReady()&&typeof runtime.clearActiveShowdown==="function")runtime.clearActiveShowdown();
    }catch(_error){}
  }
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  function report(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else console.error(context,error);}
  async function loadScript(key,path,ready){
    if(ready())return ready();
    if(typeof root.loadRuntimeScript!=="function")throw new Error("Optional runtime loader is unavailable.");
    await root.loadRuntimeScript(key,path,ready);return ready();
  }
  async function loadStyle(){if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-entry","css/remoteJoining.css");}
  function applyLocalDrawLock(){
    const locked=pending();
    for(const id of [LOCAL_SPIN_ID,LOCAL_CLUB_ID]){
      const button=root.document&&root.document.getElementById(id);if(!button)continue;
      if(locked){button.disabled=true;button.dataset.sharedJourneyLocked="true";button.setAttribute("aria-disabled","true");button.title="Shared Showdown requires exact pairing, an ACTIVE private session and authoritative Shared Setup before any league or club selection.";}
      else if(button.dataset.sharedJourneyLocked==="true"){button.disabled=false;delete button.dataset.sharedJourneyLocked;button.removeAttribute("aria-disabled");button.removeAttribute("title");}
    }
    const wheel=root.document&&root.document.querySelector("#leagueWheelScreen .wheelContainer");
    if(wheel){
      let resume=root.document.getElementById(SHARED_CONTINUE_ID);
      if(locked&&!resume){resume=create("button","menuButton", "CONTINUE SHARED SETUP");resume.id=SHARED_CONTINUE_ID;resume.type="button";resume.addEventListener("click",()=>void openPanel());wheel.insertBefore(resume,wheel.querySelector(".backButton")||null);}
      if(!locked&&resume)resume.remove();
      let note=root.document.getElementById("sharedJourneyLeagueLockNote");
      if(locked&&!note){note=create("p","stateNote","SHARED JOURNEY LOCKED · Pairing and the exact ACTIVE private session must come before league or club authority.");note.id="sharedJourneyLeagueLockNote";wheel.insertBefore(note,wheel.firstChild);}
      if(!locked&&note)note.remove();
    }
  }
  async function ensureSaveAuthority(){
    await loadScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");
    await root.ensureSaveLibraryRuntimeAuthority();
    if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay runtime loader is unavailable.");
    await root.ensureGameplayModules();
  }
  async function startShared(){
    if(busy)return false;busy=true;const button=root.document.getElementById(SHARED_START_ID);if(button)button.disabled=true;
    const round=root.document.getElementById("roundAmount");const priorRound=round?round.value:null;let shellCreated=false,markerPersisted=false;
    try{
      await ensureSaveAuthority();setPending(true);
      if(round)round.value="1";
      if(typeof root.createShowdown!=="function")throw new Error("Pre-draw Save shell authority is unavailable.");
      const created=await root.createShowdown();shellCreated=Boolean(created);
      if(!created)throw new Error("The pre-draw Save shell could not be created.");
      persistPendingMarker();markerPersisted=true;
      applyLocalDrawLock();await openPanel();return true;
    }catch(error){
      if(shellCreated&&!markerPersisted)discardUnmarkedShell();
      setPending(false);report("Unable to start paired-first Shared Showdown",error);return false;
    }
    finally{if(round&&priorRound!==null)round.value=priorRound;if(button)button.disabled=false;busy=false;}
  }
  async function openSaveLibrary(){
    closePanel();
    try{
      await loadScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.handleSaveLibraryCutoverAction==="function");
      const button=root.document.getElementById("settingsButton");if(!button)throw new Error("Save Library entry is unavailable.");
      await root.handleSaveLibraryCutoverAction(button);
    }catch(error){report("Unable to open Save Library pairing setup",error);}
  }
  async function remoteState(){
    try{
      await Promise.all([
        loadStyle(),
        loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)
      ]);
      const remote=root.CareerModeSparkRemoteJoining;return remote&&typeof remote.getState==="function"?remote.getState():null;
    }catch(_error){return null;}
  }
  async function openRemote(){
    closePanel();
    try{
      await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);
      await root.CareerModeSparkRemoteJoining.openPanel();
    }catch(error){report("Unable to open exact private session",error);}
  }
  async function openSharedSetup(){
    closePanel();
    try{
      await Promise.all([loadStyle(),loadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup)]);
      await root.CareerModeProductionSharedShowdownSetup.openPanel();
    }catch(error){report("Unable to open authoritative Shared Setup",error);}
  }
  async function statusSnapshot(){
    let account=null,pairing=null,rivalry=null,remote=null;
    try{
      await Promise.all([
        loadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),
        loadScript("spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount)
      ]);
      const connected=root.CareerModeSparkConnectedAccount;if(connected&&typeof connected.initialize==="function")await connected.initialize();account=connected&&connected.getState?connected.getState():null;
      if(account&&account.connected){
        await Promise.all([
          loadScript("pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing),
          loadScript("rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry)
        ]);
        const pairingApi=root.CareerModeSparkPrivatePairing;if(pairingApi&&pairingApi.initialize)await pairingApi.initialize();pairing=pairingApi&&pairingApi.getState?pairingApi.getState():null;
        const rivalryApi=root.CareerModeSparkConnectedRivalry;if(rivalryApi&&rivalryApi.initialize)await rivalryApi.initialize();rivalry=rivalryApi&&rivalryApi.getState?rivalryApi.getState():null;
      }
      remote=await remoteState();
    }catch(_error){}
    const active=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&remote.rivalryId===rivalry.rivalryId&&account&&remote.accountId===account.accountId&&pairing&&remote.deviceId===pairing.deviceId);
    return Object.freeze({accountReady:Boolean(account&&account.connected),deviceReady:Boolean(pairing&&pairing.registered),rivalryReady:Boolean(rivalry&&rivalry.attached&&rivalry.rivalryId),active});
  }
  function row(label,value){const item=create("div","settingsInfoRow");item.append(create("span","",label),create("strong","",value));return item;}
  async function renderPanel(){
    const overlay=root.document.getElementById(PANEL_ID);if(!overlay)return;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return;
    body.replaceChildren();body.append(create("span","remoteJoiningEyebrow","SSJR · PAIRED FIRST"),create("h2","","SHARED SHOWDOWN ENTRY"),create("p","","This shared path deliberately blocks the local league and club wheels. Create the manager/save shell first, pair the exact two managers, activate the exact private session, then enter one authoritative Shared Setup."));
    const status=await statusSnapshot();const grid=create("div","settingsInfoGrid");
    grid.append(row("1 · CONNECTED ACCOUNT",status.accountReady?"READY":"REQUIRED"),row("2 · REGISTERED BROWSER",status.deviceReady?"READY":"REQUIRED"),row("3 · EXACT PAIRED RIVALRY",status.rivalryReady?"READY":"REQUIRED"),row("4 · EXACT PRIVATE SESSION",status.active?"ACTIVE":"REQUIRED"));body.append(grid);
    const actions=create("div","remoteJoiningActions");
    const save=create("button","compactButton",status.rivalryReady?"REVIEW PAIRING / ATTACHMENT":"PAIR MANAGERS / ATTACH RIVALRY");save.type="button";save.addEventListener("click",()=>void openSaveLibrary());actions.append(save);
    const remote=create("button","compactButton",status.active?"PRIVATE SESSION ACTIVE":"OPEN / JOIN PRIVATE SESSION");remote.type="button";remote.disabled=!status.rivalryReady;remote.addEventListener("click",()=>void openRemote());actions.append(remote);
    const setup=create("button","compactButton","OPEN AUTHORITATIVE SHARED SETUP");setup.type="button";setup.disabled=!status.active;setup.addEventListener("click",()=>void openSharedSetup());actions.append(setup);
    const refresh=create("button","compactButton","REFRESH STATUS");refresh.type="button";refresh.addEventListener("click",()=>void renderPanel());actions.append(refresh);body.append(actions);
    const note=create("p","remoteJoiningStatus",status.active?"ACTIVE authority proven. League and club draw controls are now available only inside authoritative Shared Setup.":"No league or club selection is available on this shared path before exact pairing plus ACTIVE session.");note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);
  }
  async function openPanel(){
    await loadStyle();applyLocalDrawLock();let overlay=root.document.getElementById(PANEL_ID);
    if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Showdown paired-first entry");const shell=create("div","remoteJoiningShell");const header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close Shared Showdown entry");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
    overlay.classList.remove("hidden");await renderPanel();return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
  function installStartButton(){
    const local=root.document.getElementById("startShowdown");if(!local||root.document.getElementById(SHARED_START_ID))return false;
    const shared=create("button","menuButton", "START SHARED SHOWDOWN");shared.id=SHARED_START_ID;shared.type="button";shared.addEventListener("click",()=>void startShared());
    const note=create("p","stateNote","Shared mode chooses the 1 / 3 / 5 / 10 season length later, after exact pairing, ACTIVE session, league and clubs. The selector above is used only by local mode.");note.id="sharedShowdownOrderingNote";
    local.insertAdjacentElement("afterend",shared);shared.insertAdjacentElement("afterend",note);return true;
  }
  function install(){if(installed)return true;installed=true;installStartButton();applyLocalDrawLock();
    const observer=new MutationObserver(()=>{installStartButton();applyLocalDrawLock();});observer.observe(root.document.documentElement,{childList:true,subtree:true});
    if(pending())setTimeout(()=>void openPanel(),0);return true;
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-production-paired-first-entry",productionEnabled:true,pairingBeforeLeagueClub:true,activeSessionBeforeLeagueClub:true,persistedSaveMarker:true,canonicalLocalSaveMutationDuringSharedSetup:false,billingRequired:false,install,openPanel,closePanel,isPending:pending});
});