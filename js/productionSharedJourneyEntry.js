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
  function pending(){if(activeSavedShowdown())return persistedPending();try{return root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1";}catch(_error){return false;}}
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
  function report(context,error){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota){context="Online play is paused for today";error=Object.assign(new Error(quota),{code:"resource-exhausted"});}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else console.error(context,error);}
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
      if(locked&&!presentationOwns&&!resume){resume=create("button","menuButton","CONTINUE CAREER");resume.id=SHARED_CONTINUE_ID;resume.type="button";resume.addEventListener("click",()=>void continueFromLockedWheel());wheel.insertBefore(resume,wheel.querySelector(".backButton")||null);}
      if((!locked||presentationOwns)&&resume)resume.remove();
      let note=root.document.getElementById("sharedJourneyLeagueLockNote");
      if(locked&&!presentationOwns&&!note){note=create("p","stateNote","Connect Daniel and Nik to pick the league.");note.id="sharedJourneyLeagueLockNote";wheel.insertBefore(note,wheel.firstChild);}
      if((!locked||presentationOwns)&&note)note.remove();
    }
  }
  async function ensureSaveAuthority(){
    await loadScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");
    await root.ensureSaveLibraryRuntimeAuthority();
    if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay runtime is unavailable.");
    await root.ensureGameplayModules();
  }
  // r79: the pair names the Showdown it last saw CLOSED (finished, or deleted on Daniel's phone) and that Showdown's save.
  function activeSaveIsClosedShowdown(runtime){
    try{
      const pair=root.CareerModePersistentNikDanielPair?.getState?.(),closed=pair&&pair.closedProviderSaveId;
      if(!pair||pair.rivalryId||!/^pair_[0-9a-f]{64}$/.test(String(pair.closedRivalryId||""))||typeof closed!=="string"||!/^save_[0-9a-f]{24}$/.test(closed))return false;
      return runtime.getLibrarySnapshot?.()?.activeSaveId===closed;
    }catch(_error){return false;}
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
    // r79: the save of a Showdown that is already closed (the pair names it: finished, or deleted on Daniel's phone) never blocks
    // Nik's next JOIN. The new shell is made beside it, exactly as Daniel's next START does; that save is kept, never rewritten.
    if(existing&&!activeSaveIsClosedShowdown(runtime)){
      throw new Error("You already have a different current Showdown. End it in Settings (END SHOWDOWN), then paste Daniel's code again.");
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
      if(!created)throw new Error("Nik's career could not be prepared.");
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
  // r79: START never offers to close a live Showdown (closing stays in Settings). It asks whichShowdownIsLive instead: a live
  // game continues, Daniel's code already out (or his seasons chosen with no code yet) reopens WAITING, a fresh start creates the
  // shell, and Nik is never given a shell of his own here (he JOINs). Pair authority that cannot be read fails closed.
  async function whichShowdownIsLive(pairState=null){
    const which=await loadScript("which-showdown","js/whichShowdownIsLive.js",()=>root.CareerModeWhichShowdownIsLive);
    if(!which||typeof which.read!=="function")throw new Error("Showdown start is unavailable.");
    const decision=await which.read(root,pairState?{pair:pairState}:{});
    if(decision.reason==="pair-unknown")throw new Error("The current Showdown connection could not be verified. Try again before starting a new Showdown.");
    return decision;
  }
  // Codex #904 (P1): createShowdown() shows the locked league wheel at once, so on a cold cache WAITING's script, stylesheet and
  // plate are made ready first (alongside START's own checks, while the seasons screen and its disabled START stay up); openWaiting
  // then covers the wheel in the same task as the route change. Files only, no Firestore read. A failure here is left to
  // openWaiting, which reports it as before.
  function prepareWaiting(){
    return (async()=>{
      await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
      const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);
      if(layer&&typeof layer.prepare==="function")await layer.prepare();
      return true;
    })().catch(()=>false);
  }
  // WAITING: the Connect Players layer over the locked league wheel (no trip back to Home). With createCode the pair code is made
  // here, once, from the shell START just prepared; Daniel no longer taps CREATE CODE FOR NIK. A layer that cannot open falls back
  // to GET READY.
  async function openWaiting(options={}){
    closePanel();
    try{
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
      const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);
      if(!pair||typeof pair.startPairing!=="function"||!layer||typeof layer.open!=="function")throw new Error("Player connection is unavailable.");
      // A new code that replaces an older open one is begun while the layer
      // opens, so WAITING shows "Preparing your Showdown…" and then the new code, never the old code in between.
      const opening=layer.open({sync:false,stayOnScreen:true});Promise.resolve(opening).catch(()=>{});
      if(!(options.createCode===true&&pair.getState?.()?.connectionState==="pending-pair"))await opening;
      if(options.createCode===true)await pair.startPairing({managerRole:"playerOne"});
      await opening;
      pair.render?.();
      return true;
    }catch(error){report("Unable to open the waiting screen",error);await openPanel({routeToRemote:false});return false;}
  }
  // PR #901 P2: CONTINUE CAREER on the locked league wheel (shown once WAITING is closed with BACK or Escape) asks the same
  // question START asks, so it reopens WAITING over the wheel (same stayOnScreen path) instead of the old GET READY overlay.
  let lockedWheelContinuePromise=null;
  function continueFromLockedWheel(){
    if(lockedWheelContinuePromise)return lockedWheelContinuePromise;
    lockedWheelContinuePromise=(async()=>{
      try{const decision=await whichShowdownIsLive();if(decision.action==="new")return openWaiting({createCode:false});return await followStartDecision(decision);}
      catch(error){report("Unable to continue the Showdown",error);return openWaiting({createCode:false});}
    })().finally(()=>{lockedWheelContinuePromise=null;});
    return lockedWheelContinuePromise;
  }
  // Nik's call (2026-10-17): Daniel's START on a Showdown that has ENDED but was never CLOSED closes it for both managers through
  // exactly the final-screen terminal close (it requires the final reconciliation, i.e. history saved first, and one exact ACTIVE
  // private session; same writes, same guards), then opens the seasons screen. Nothing is created unless the close succeeded; a
  // close that cannot happen stops on the existing Connect Players / CHECK STATUS path with the reason.
  // r87 Rematch (js/onlinePlayerIdentity.js openRematch): followStartDecision(decision,{openSeasons:false}) does everything up to the
  // seasons screen and answers "seasons" instead of opening it; the caller then opens that screen with the length preset.
  let seasonsHandOff=false;
  let closeEndedPromise=null;
  function closeEndedThenNew(){
    if(closeEndedPromise)return closeEndedPromise;
    closeEndedPromise=(async()=>{
      let state=null,result=null;
      let pair=null;
      try{
        // Loaded first so its CLOSED listener hears this close (Codex #904: it is let go right after, below).
        pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
        const close=await loadScript("ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose);
        if(!close||typeof close.refresh!=="function"||typeof close.close!=="function")throw new Error("Showdown close is unavailable.");
        close.install?.();
        state=close.getState?.()||null;
        if(!state||state.phase!=="CLOSED")state=await close.refresh();
        if(state&&state.phase==="READY")result=await close.close();
        else if(state&&state.phase==="RECOVERY_PENDING"&&typeof close.retry==="function")result=await close.retry();
        if(close.getState?.()?.phase!=="CLOSED"&&result?.ok!==true){
          throw new Error(state&&state.phase==="BLOCKED"
            ?"This Showdown has ended. It closes when Daniel and Nik are both connected; nothing new was started."
            :(result&&result.message)||"This Showdown has ended but could not be closed. Nothing new was started.");
        }
      }catch(error){report("Unable to close the ended Showdown",error);await openPersistentPairControls();return false;}
      // Codex #904 (P2): the pair keeps a CLOSED rivalry until Home is shown (the final screen still runs on it). This path leaves
      // for the seasons screen instead, so it lets the closed Showdown go now; otherwise START there would find it live again and
      // reopen the same screen. No read, no write.
      try{pair?.settleOnHome?.();}catch(_error){}
      const opened=seasonsHandOff?"seasons":typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");
      return opened==="seasons"?opened:opened!==false;
    })().finally(()=>{closeEndedPromise=null;});
    return closeEndedPromise;
  }
  // Markerless waiting codes belong to the retired path. A real START closes them before writing the boundary.
  async function needsCareerStart(decision){
    if(!decision||decision.action!=="resume-waiting"||entryIdentityState()?.managerId!=="daniel")return false;
    try{
      const modes=await loadScript("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);
      modes?.install?.();return (await modes?.resolve?.())?.careerStarted===false;
    }catch(_error){return false;}
  }
  async function openSeasonsForRealStart(){
    closePanel();
    const opened=seasonsHandOff?"seasons":typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");
    return opened==="seasons"?opened:opened!==false;
  }
  async function followStartDecision(decision,options){
    if(options&&options.openSeasons===false){seasonsHandOff=true;try{return await followStartDecision(decision);}finally{seasonsHandOff=false;}}
    if(!decision)return false;
    if(decision.action==="resume-waiting"&&await needsCareerStart(decision))return openSeasonsForRealStart();
    if(decision.action==="close-then-new")return closeEndedThenNew();
    if(decision.action==="continue"){
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
      if(!pair||typeof pair.continuePair!=="function")throw new Error("Career continue is unavailable.");
      // PR #901: continuePair() reports a failure in its returned state (error / recovery-required) instead of rejecting, so a
      // failed continue reopens Connect Players with that state (TRY CONTINUE AGAIN / RESTORE BACKUP) like the auto-continue
      // fallback does, instead of rendering into a hidden panel. Nothing is created.
      const next=await pair.continuePair();
      if(next&&next.busy!==true&&next.status!=="paired"){
        report("Unable to continue the Showdown",Object.assign(new Error(next.message||"The career could not be opened."),{code:next.status}));
        try{const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer?.open?.({sync:false,stayOnScreen:true});pair.render?.();}
        catch(_error){await openPersistentPairControls();}
        return false;
      }
      return true;
    }
    if(decision.action==="resume-waiting")return openWaiting({createCode:!decision.rivalryId});
    const identity=entryIdentity();
    if(identity&&typeof identity.openJoin==="function"){await identity.openJoin({pair:decision.pair||null,decision});return true;}
    await openPersistentPairControls();return true;
  }
  async function startShared(options={}){
    if(busy)return false;
    if(!entryIdentityReady()){
      const identity=entryIdentity();syncStartButtonIdentity();
      if(identity&&typeof identity.openGate==="function"){identity.openGate();return false;}
      root.showAppNotice?.("Sign in and choose Daniel or Nik before starting a Showdown.","error",6000);return false;
    }
    busy=true;const button=root.document.getElementById(SHARED_START_ID)||root.document.getElementById("startShowdown");if(button)button.disabled=true;
    const round=root.document.getElementById("roundAmount"),priorRound=round?round.value:null;let shellCreated=false,markerPersisted=false;
    try{
      const waitingReady=prepareWaiting();await ensureSaveAuthority();
      const decision=await whichShowdownIsLive(),realStart=await needsCareerStart(decision);
      if(decision.action!=="new"&&!realStart){await followStartDecision(decision);return false;}
      // Persist the career boundary before a new Showdown; a refusal creates nothing.
      if(options&&typeof options.beforeCreate==="function"&&await options.beforeCreate()!==true)return false;
      setPending(true);
      if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
      await waitingReady;const created=await root.createShowdown();shellCreated=Boolean(created);if(!created)throw new Error("The Showdown could not be prepared.");
      normalizeCanonicalPlayers();persistPendingMarker();markerPersisted=true;applyLocalDrawLock();await openWaiting({createCode:true});return true;
    }catch(error){if(shellCreated&&!markerPersisted)discardUnmarkedShell();setPending(false);report("Unable to prepare Showdown",error);return false;}
    finally{if(round&&priorRound!==null)round.value=priorRound;if(button)button.disabled=false;busy=false;syncStartButtonIdentity();}
  }
  async function openPersistentPairControls(){
    closePanel();
    try{
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair),identity=root.CareerModeOnlinePlayerIdentity;
      if(!pair||typeof pair.render!=="function"||!identity||typeof identity.syncPair!=="function")throw new Error("Player connection controls are unavailable.");
      const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer.open({sync:false});
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
      // Job 33 (R6): an ACTIVE private session continues straight into the Showdown (league wheel, Career Start or the
      // current season); openSharedExperience shows GET READY again if that fails. An expired session never auto-continues.
      // Codex P1 on #358: Remote Joining keeps its last ACTIVE session in page memory, so after a new Showdown (no reload) it can
      // still belong to the previous rivalry. Only a session bound to the current account, device and rivalry auto-continues.
      if(!remoteBoundToAuthority(next,root.CareerModeSparkConnectedAccount?.getState?.(),root.CareerModeSparkPrivatePairing?.getState?.(),root.CareerModeSparkConnectedRivalry?.getState?.()))return;
      remoteReturnBusy=true;disarmRemoteReturn();
      Promise.resolve().then(async()=>{if(typeof remote.closePanel==="function")remote.closePanel();await openSharedExperience();}).catch(error=>report("Unable to continue the Showdown after connection",error)).finally(()=>{remoteReturnBusy=false;});
    };
    remoteUnsubscribe=remote.subscribe(onState);if(typeof remote.getState==="function")onState(remote.getState());return true;
  }
  // Studio Z3: a one-bit "this tab is in a game" flag (never the session itself). After a refresh the identity module sees
  // it and taps CONTINUE CAREER for the player, which re-attaches through the pair's session pointer.
  const LIVE_GAME_KEY="careerModeShowdown.liveGame.v1";let liveGameWatch=null;
  function markLiveGame(remote){
    if(liveGameWatch||!remote||typeof remote.subscribe!=="function")return;
    const apply=next=>{try{if(!root.sessionStorage||!next)return;if(["open","active"].includes(next.sessionState))root.sessionStorage.setItem(LIVE_GAME_KEY,"1");else if(["closed","revoked","expired"].includes(next.sessionState))root.sessionStorage.removeItem(LIVE_GAME_KEY);}catch(_error){}};
    liveGameWatch=remote.subscribe(apply);apply(typeof remote.getState==="function"?remote.getState():null);
  }
  async function openRemote(){
    closePanel();
    try{
      await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);
      const remote=root.CareerModeSparkRemoteJoining;if(!remote||typeof remote.openPanel!=="function")throw new Error("Player connection is unavailable.");
      // Studio Z3/Z4: connect by itself (this tab's session after a refresh, else the pair's shared session); no typed code.
      const auto=typeof remote.autoConnect==="function"?remote.autoConnect():null;await remote.openPanel();armRemoteReturn(remote);markLiveGame(remote);if(auto)void auto;
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
  // Job 19: a fresh runtime (reload) re-establishes the exact ACTIVE session and then resumes at the
  // provider-authoritative active season instead of replaying Career Start and season 1.
  async function resumeSeasonResults(resumed){
    const confirmed=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(!confirmed||confirmed.ready!==true)return false;
    const season=Number(resumed.season),role=confirmed.managerRole,rivalryId=confirmed.rivalryId;
    if(resumed.terminal===true||!rivalryId||!role||!Number.isInteger(season)||season<1)return false;
    // A hint selects a possible route, never gameplay authority. Missing/unavailable storage keeps the full-screen fallback.
    let hint=null;try{hint=root.readStorageValue?.(`cms.transferViews.v1:${rivalryId}:${season}:${role}`);}catch(_error){}
    if(!hint)return false;
    await loadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    const transfer=root.CareerModeProductionSharedTransferChallenge;await transfer.refresh();
    if(!transfer.canResumeResults())return false;
    transfer.install();
    await loadScript("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js",()=>root.CareerModeProductionSharedSeasonResultsRoute);
    const route=root.CareerModeProductionSharedSeasonResultsRoute;route.install();return route.open();
  }
  async function resumeAcceptedSeason(){
    await loadScript("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
    const progression=root.CareerModeProductionSharedMultiSeasonProgression;
    if(!progression||typeof progression.resumeFromAuthority!=="function")return false;
    progression.install?.();
    const resumed=await progression.resumeFromAuthority();
    if(!resumed||!Number.isInteger(resumed.acceptedSeasons)||resumed.acceptedSeasons<0)return false;
    // The Results route is a nicer landing, never a new way to fail: any error here keeps the existing fallback.
    let routed=false;try{routed=await resumeSeasonResults(resumed);}catch(_error){}
    if(routed)return true;
    if(resumed.acceptedSeasons<1)return false;
    if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false,allowCanonicalFallback:true});else if(typeof root.showScreen==="function")await root.showScreen("dashboard",false);
    progression.decorateDashboard?.();
    return true;
  }
  async function openSharedExperience(){
    closePanel();
    try{
      await ensureSaveAuthority();
      const confirmed=await confirmedSetupSnapshot();
      if(confirmed&&await resumeAcceptedSeason()){applyLocalDrawLock();return true;}
      if(confirmed){await openCareerStart();applyLocalDrawLock();return true;}
      await loadScript("ssjr-polished-presentation","js/productionSharedShowdownPresentation.js",()=>root.CareerModeProductionSharedShowdownPresentation);
      const presentation=root.CareerModeProductionSharedShowdownPresentation;if(!presentation||typeof presentation.activate!=="function")throw new Error("Showdown presentation is unavailable.");
      await presentation.activate();applyLocalDrawLock();return true;
    }catch(error){report("Unable to enter the Showdown",error);await openPanel({routeToRemote:false});return false;}
  }
  function remoteBoundToAuthority(remote,account,pairing,rivalry){return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&rivalry.rivalryId&&remote.rivalryId===rivalry.rivalryId&&account&&account.accountId&&remote.accountId===account.accountId&&pairing&&pairing.deviceId&&remote.deviceId===pairing.deviceId&&Number.isFinite(remote.expiresAtEpochMs)&&Date.now()<remote.expiresAtEpochMs);}
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
  async function renderPanel(options={}){
    const generation=++renderGeneration,overlay=root.document.getElementById(PANEL_ID);if(!overlay)return false;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return false;
    const status=options.status||await statusSnapshot();if(generation!==renderGeneration)return false;
    if(routesToRemote(status,options)){await openRemote();return false;}
    const confirmed=status.active?await confirmedSetupSnapshot():null;if(generation!==renderGeneration)return false;
    body.replaceChildren();body.append(create("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),create("h2","","GET READY"),create("p","","Connect Daniel and Nik before the career starts."));
    const grid=create("div","settingsInfoGrid");
    grid.append(row("ACCOUNT",status.accountReady?"READY":"REQUIRED"),row("THIS BROWSER",status.deviceReady?"READY":"REQUIRED"),row("DANIEL + NIK",status.rivalryReady?"CONNECTED":"CONNECT"),row("CAREER",status.active?"READY":"WAITING"));body.append(grid);
    const actions=create("div","remoteJoiningActions");
    const save=create("button","compactButton",status.rivalryReady?"REVIEW CONNECTION":"CONNECT PLAYERS");save.type="button";save.addEventListener("click",()=>void openPersistentPairControls());actions.append(save);
    const remote=create("button","compactButton",status.active?"CONNECTED":"CONTINUE");remote.type="button";remote.disabled=!status.rivalryReady;remote.addEventListener("click",()=>void openRemote());actions.append(remote);
    const setup=create("button","compactButton",status.active?"START CAREER":"WAITING FOR BOTH PLAYERS");setup.type="button";setup.disabled=!status.active;setup.addEventListener("click",()=>void openSharedExperience());actions.append(setup);
    const refresh=create("button","compactButton","REFRESH");refresh.type="button";refresh.addEventListener("click",()=>void renderPanel());actions.append(refresh);body.append(actions);
    const note=create("p","remoteJoiningStatus",status.active?(confirmed?"Ready. Continue to Career Start.":"Ready. Continue when both players are set."):"Both players must be connected before league and club selection.");note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);return true;
  }
  // Job 33 (R5b): connected players without an ACTIVE private session go straight to Remote Joining instead of
  // waiting on GET READY for a CONTINUE tap. GET READY still shows before pairing, once the session is ACTIVE, and
  // after a failed Showdown entry (routeToRemote:false), so it never bounces between the two overlays.
  function routesToRemote(status,options){return Boolean(options.routeToRemote!==false&&status&&status.rivalryReady&&!status.active);}
  async function openPanel(options={}){
    await loadStyle();applyLocalDrawLock();
    const status=options.routeToRemote===false?null:await statusSnapshot();
    if(routesToRemote(status,options)){await openRemote();return true;}
    // r80 resume (G7): continuing a Showdown whose private session this page already holds ACTIVE (Home START / CONTINUE CAREER
    // after going Home from the game) enters the game exactly as a reload does once Remote Joining is ACTIVE again
    // (armRemoteReturn: openSharedExperience), instead of GET READY, whose START CAREER replayed Career Start. GET READY stays
    // the fallback when that entry fails (routeToRemote:false) and for every other caller.
    if(options.resumeActive===true&&status&&status.active){closePanel();await openSharedExperience();return true;}
    let overlay=root.document.getElementById(PANEL_ID);
    if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Career Mode Showdown entry");const shell=create("div","remoteJoiningShell"),header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close career entry");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
    // JOB-1015: the entry card replaces an open Connect Players layer instead of opening underneath it.
    root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});
    overlay.classList.remove("hidden");await renderPanel({...options,status});return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
  async function seasonsStartGate(){
    try{
      const modes=await loadScript("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);
      if(modes&&typeof modes.beforeSeasonsStart==="function"){modes.install?.();return await modes.beforeSeasonsStart()===true;}
    }catch(_error){}
    report("Unable to start the Showdown",new Error("Your career could not be checked, so nothing was started. Check your internet, then press START again."));
    return false;
  }
  function installStartButton(){
    const start=root.document.getElementById("startShowdown");if(!start)return false;
    syncStartButtonIdentity();
    if(start.dataset.canonicalShowdownStart==="true")return true;
    start.dataset.canonicalShowdownStart="true";
    // The fallback START uses the same real-career gate as the identity entry.
    start.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();void startShared({beforeCreate:seasonsStartGate});},true);
    const duplicate=root.document.getElementById(SHARED_START_ID);if(duplicate)duplicate.remove();
    const note=root.document.getElementById("sharedShowdownOrderingNote");if(note)note.remove();
    return true;
  }
  // Job 19: the shared marker is a permanent local-draw lock, so it cannot decide alone whether GET READY
  // should open after a reload. Durable pair authority decides: a pre-pair shell still opens GET READY;
  // an ACTIVE pair resumes through the single CONTINUE CAREER action; a CLOSED Showdown never re-opens it.
  const AUTO_OPEN_IDENTITY_WAIT_MS=15000;
  function settledIdentity(){
    if(entryIdentityReady())return Promise.resolve(true);
    const identity=entryIdentity();if(!identity||typeof identity.subscribe!=="function")return Promise.resolve(false);
    return new Promise(resolve=>{let done=false,unsubscribe=null;const finish=value=>{if(done)return;done=true;try{unsubscribe?.();}catch(_error){}resolve(value);};unsubscribe=identity.subscribe(()=>{if(entryIdentityReady())finish(true);});setTimeout(()=>finish(entryIdentityReady()),AUTO_OPEN_IDENTITY_WAIT_MS);if(entryIdentityReady())finish(true);});
  }
  function pairAlreadyEstablished(pairState){if(!pairState)return false;if(pairState.rivalryId&&(pairState.connectionState==="active"||pairState.connectionState==="closed"))return true;return Boolean(pairState.status==="unpaired"&&!pairState.rivalryId&&/^pair_[0-9a-f]{64}$/.test(String(pairState.closedRivalryId||""))&&closedRivalryOwnsActiveShell(pairState));}
  // PR #901 (as whichShowdownIsLive): a closed rivalry only counts against the save it was bound to, so a fresh shell made after an
  // older closed Showdown still reopens WAITING over the wheel on reload; only the closed Showdown's own shell stays shut.
  function closedRivalryOwnsActiveShell(pairState){
    const closed=pairState&&pairState.closedProviderSaveId;if(typeof closed!=="string"||!/^save_[0-9a-f]{24}$/.test(closed))return false;
    try{const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return Boolean(library&&library.activeSaveId===closed);}catch(_error){return false;}
  }
  async function autoOpenAfterLoad(){
    if(!pending())return false;
    let pairState=null;
    try{if(await settledIdentity()){const known=root.CareerModePersistentNikDanielPair?.getState?.();pairState=known&&known.initialized===true&&known.busy!==true&&(known.rivalryId||known.closedRivalryId)?known:await currentPairStateForFreshStart();}}catch(_error){pairState=null;}
    // Only a positively observed pre-pair state reopens anything; unresolved authority (offline, timeout, error) keeps it closed.
    if(!pairState||!["unpaired","waiting"].includes(pairState.status)||pairAlreadyEstablished(pairState))return false;
    if(!pending())return false;
    // r79: a pending pre-pair shell reopens WAITING for Daniel (his code, or the code made now from his chosen seasons) and JOIN
    // for Nik. GET READY stays only as the fallback when neither applies or the decision cannot be made.
    let decision=null;try{decision=await whichShowdownIsLive(pairState);}catch(_error){decision=null;}
    // An older closed Showdown is remembered: only Daniel's fresh code-less shell (resume-waiting) reopens; nothing else (no GET READY).
    if(/^pair_[0-9a-f]{64}$/.test(String(pairState.closedRivalryId||""))&&!pairState.rivalryId&&!(decision&&decision.action==="resume-waiting"))return false;
    // PR #901: reload recovery puts Daniel's WAITING back over the locked league wheel (startup leaves Home active), so closing it
    // shows the wheel and its CONTINUE CAREER, not Home. The loading screen is held until this settles (js/ssjr.js, Reus Gate).
    // A markerless old code waits for an explicit real START.
    if(decision&&decision.action==="resume-waiting"&&await needsCareerStart(decision))return false;
    if(decision&&decision.action==="resume-waiting")await showLockedWheel();
    if(decision&&["resume-waiting","join","wait-for-daniel"].includes(decision.action))return followStartDecision(decision);
    return openPanel();
  }
  // Right after a reload the saved shell is not loaded yet (currentShowdown is null) and the wheel route falls back to Home (seen
  // in a real browser), so the saved shell is resumed first, exactly as Home's CONTINUE does: its canonical route is the wheel.
  function loadedShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  async function showLockedWheel(){
    try{
      if(!loadedShowdown()&&typeof root.resumeSavedShowdown==="function"){await ensureSaveAuthority();if(typeof root.loadSavedShowdown==="function"&&root.loadSavedShowdown())await root.resumeSavedShowdown();}
      if(root.getActiveScreenName?.()!=="leagueWheelScreen"){if(typeof root.navigateTo==="function")await root.navigateTo("leagueWheelScreen",{addToHistory:false});else root.showScreen?.("leagueWheelScreen");}
    }catch(error){report("Unable to reopen the league screen",error);}
    applyLocalDrawLock();
  }
  // The startup hold is kept only while this recovery can still end on the wheel: a player who is signed out, offline or still
  // choosing (anything but a restoring or ready identity) releases it at once, and js/ssjr.js bounds it anyway.
  let startupResumePromise=null,releaseStartupHold=null;
  function startupHoldWorthKeeping(){const current=entryIdentityState();return !current||entryIdentityReady()||["idle","connecting","signing-in","saving-manager"].includes(current.status);}
  function startStartupResume(){
    startupResumePromise=new Promise(resolve=>{releaseStartupHold=()=>resolve(true);});
    const identity=entryIdentity();let unsubscribe=null;const watch=()=>{if(!startupHoldWorthKeeping())releaseStartupHold();};
    try{unsubscribe=typeof identity?.subscribe==="function"?identity.subscribe(watch):null;}catch(_error){unsubscribe=null;}watch();
    setTimeout(()=>void autoOpenAfterLoad().catch(error=>report("Unable to open career entry",error)).finally(()=>{releaseStartupHold();try{unsubscribe?.();}catch(_error){}}),0);
  }
  function install(){if(installed)return true;installed=true;installStartButton();applyLocalDrawLock();const identity=entryIdentity();if(identity&&typeof identity.subscribe==="function")identityUnsubscribe=identity.subscribe(()=>syncStartButtonIdentity());const observer=new MutationObserver(()=>{installStartButton();applyLocalDrawLock();});observer.observe(root.document.documentElement,{childList:true,subtree:true});if(pending())startStartupResume();return true;}

  return Object.freeze({contractVersion:7,feature:"ssjr-production-paired-first-entry",startOpensWaitingOverLeagueWheel:true,startNeverOffersToCloseLiveShowdown:true,connectedPairOpensRemoteJoiningDirectly:true,activeSessionContinuesIntoShowdown:true,productionEnabled:true,singleProductEntry:true,pairingBeforeLeagueClub:true,activeSessionBeforeLeagueClub:true,peerActiveReturnToSharedEntry:true,bothDevicesPrepareSharedShell:true,joinerShellProvisionedAutomatically:true,continueCareerUsesPairedAuthority:true,polishedLeagueWheelAfterAuthority:true,polishedClubPacksAfterAuthority:true,confirmedSetupResumesAtCareerStart:true,acceptedSeasonResumesAtActiveSeason:true,establishedPairNeverAutoOpensEntry:true,closedShowdownNeverReopensEntry:true,engineeringSetupPanelPlayerFacing:false,persistedSaveMarker:true,canonicalLocalSaveMutationDuringSharedSetup:false,billingRequired:false,install,preparePairingShell:startShared,provisionJoinerShell,openWaiting,followStartDecision,closeEndedThenNew,continueFromLockedWheel,startupResume:()=>startupResumePromise,openPanel,closePanel,openSharedExperience,isPending:pending});
});
