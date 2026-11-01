(function(root){
  "use strict";
  const load=root.loadRuntimeScript;
  if(typeof load!=="function")return;
  const install=(id,path,key)=>load(id,path,()=>root[key]).then(()=>{const api=root[key];if(!api||typeof api.install!=="function")throw new Error(`${path} loaded without an installable ${key} API.`);api.install();return api;});
  const prepare=(items)=>items.reduce((chain,[id,path,key])=>chain.then(()=>load(id,path,()=>root[key]).then(()=>{const api=root[key];if(!api)throw new Error(`${path} loaded without its expected ${key} API.`);return api;})),Promise.resolve());
  // Settings > FULL MOTION must win over a device that asks for reduced motion (CSS media rules and direct matchMedia reads, frozen Team V scripts included). Requested before any screen module.
  load("full-motion-honor","js/fullMotionHonor.js",()=>root.CareerModeFullMotionHonor).then(()=>root.CareerModeFullMotionHonor.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Full motion preference honouring unavailable.",error));
  const params=root.location?new URLSearchParams(root.location.search):new URLSearchParams();
  const acceptanceEnabled=params.get("ssjr-acceptance")==="1";
  const witnessEnabled=acceptanceEnabled&&params.get("ssjr-witness")==="1";
  const physicalEnabled=acceptanceEnabled&&!witnessEnabled&&params.get("ssjr-physical")==="1";
  const ssjrTestEnabled=params.get("ssjr")==="1";
  // JOB-24: Team V's screen loader and navigation bar, once the browser is idle (independent of the chain below).
  const v10=()=>load("v10-screens","js/v10Screens.js",()=>root.CareerModeV10Screens).then(()=>root.CareerModeV10Screens.install()).then(()=>load("v10-home-screens","js/homeScreensV10.js",()=>root.CareerModeHomeScreensV10)).then(()=>root.CareerModeHomeScreensV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Team V screens unavailable.",error));
  const resultsV10=()=>load("v10-season-final","js/seasonFinalV10.js",()=>root.CareerModeSeasonFinalV10).then(()=>root.CareerModeSeasonFinalV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Results visuals unavailable.",error));
  // The Reus Gate (r75; owner, 2026-10-13: the old or half-loaded Home flashed for seconds as the Reus loading screen left on a slow
  // or cold start). Home is the first screen, so its Team V look starts loading at once instead of on idle, and js/app.js keeps the
  // loading screen up until Home is really ready, judged by ready signals and never by a fixed time: the Team V Home has mounted
  // (its stylesheets loaded first, js/v10Screens.js), the fonts are ready, every Home picture is decoded and data-v10-pending has
  // cleared. careerModeHomeHold: 1 = Home on its way (set by js/app.js when it requests this file), 0 = ready, or failed (the app's
  // own Home is then never lost). js/app.js keeps its minimum display time and hands over anyway at its safety cap (15 s).
  const checkHome=async()=>{
    const doc=root.document,host=doc&&doc.getElementById("mainMenu"),V=root.CareerModeV10Screens;
    if(!host||typeof root.getActiveScreenName!=="function"||root.getActiveScreenName()!=="mainMenu"||!V||!V.isMounted("mainMenu"))return;
    const settled=node=>new Promise(resolve=>{node.addEventListener("load",resolve,{once:true});node.addEventListener("error",resolve,{once:true});});
    // Home's own sheets (the kit and Home's CSS): one still on its way is waited for; one whose request already ended has nothing to wait for.
    const sheets=[...V.KIT.styles,...(root.CareerModeHomeScreensV10?.HOME_CSS||[])].map(file=>V.BASE+file);
    const done=link=>Boolean(link.sheet)||(typeof root.performance?.getEntriesByName==="function"&&root.performance.getEntriesByName(link.href).length>0);
    await Promise.all([...doc.querySelectorAll("link[data-v10-style]")].filter(link=>sheets.includes(link.getAttribute("data-v10-style"))&&!done(link)).map(settled));
    if(doc.fonts&&doc.fonts.ready)await doc.fonts.ready;
    // Home's plate and phone heroes are CSS backgrounds: each one a shown Home element paints (from an image-set, the one this
    // screen's density picks; Chromium reports its densities as dppx) is decoded too, with the <img> pictures.
    const dpr=root.devicePixelRatio||1,plates=new Set();
    for(const el of [host,...host.querySelectorAll("*")]){
      if(!el.getClientRects().length)continue;
      const bg=root.getComputedStyle(el).backgroundImage;
      if(!bg||!bg.includes("url("))continue;
      const urls=[...bg.matchAll(/url\("?([^")]+)"?\)\s*(?:([\d.]+)(?:x|dppx))?/g)].map(m=>({url:m[1],x:Number(m[2]||0)})).filter(e=>!e.url.startsWith("data:"));
      if(/image-set\(/.test(bg)&&urls.length>1){const set=urls.slice().sort((a,b)=>a.x-b.x);plates.add((set.find(e=>e.x>=dpr)||set[set.length-1]).url);}
      else urls.forEach(e=>plates.add(e.url));
    }
    const decode=img=>typeof img.decode==="function"?img.decode().catch(()=>img.complete?null:settled(img)):null;
    await Promise.all([...[...plates].map(url=>{const img=new root.Image();img.src=url;return decode(img);}),...[...host.querySelectorAll("img")].map(decode)]);
    while(host.hasAttribute("data-v10-pending")&&root.getActiveScreenName()==="mainMenu")await new Promise(resolve=>root.setTimeout(resolve,50));
    // r87: Home's top bar (navigation, account chips and, once the soundtrack has started, its music dock) is part of Home. The
    // bar mounts behind the loading screen (js/v10Screens.js); Home is handed over only once it is there, so it no longer pops in
    // during the crossfade.
    if(typeof V.mountNav==="function")await V.mountNav().catch(()=>null);
    await Promise.resolve(load("v10-music-dock","js/musicDockV10.js",()=>Boolean(root.CareerModeMusicDockV10))).catch(()=>null);
    while(root.CareerModeMusicDockV10?.state?.().started&&!doc.getElementById("cmsMusicDockTop")&&root.getActiveScreenName()==="mainMenu")await new Promise(resolve=>root.setTimeout(resolve,50));
  };
  // The checks are bounded by the same 15 s as js/app.js, so a picture request that never ends cannot hold back what follows Home.
  const reusGate=async()=>Promise.race([checkHome(),new Promise(resolve=>root.setTimeout(resolve,15e3))]);
  // r79 (PR #901): a reload with Daniel's unfinished pre-pair shell keeps the loading screen up until the entry has put WAITING
  // back over the locked league wheel, so neither Home nor the bare wheel flashes first. No pending pre-pair shell: no wait.
  // Codex #904 (P1): the wait lasts until that recovery settles (the entry itself lets go at once for a player who is signed
  // out, offline or still choosing), bounded only by js/app.js's overall startup cap (15 s from the start of the page load). A
  // shorter deadline of its own (it was 3 s) let Home show while the identity was still restoring and then jump to the wheel.
  let entryInstalled=null;const entryReady=new Promise(resolve=>{entryInstalled=resolve;});
  // PR #901: the marker is read first, synchronously and locally (no Firebase read), so a startup with nothing pending never waits
  // for the entry to load. Only a pre-pair shell can resume onto the wheel: the active shared shell's setupPending marker with no
  // league, clubs or seasons on it, and not a shell this device already saw paired (careerModeShowdown.pairedShell.v1, written by
  // js/persistentNikDanielPair.js when the pair went ACTIVE), so a reload mid-Showdown gets no extra time. Before the shell is
  // known, this tab's pending flag reads the active save locally (js/storage.js). One deadline bounds the whole wait.
  const pendingShell=()=>{let s=null;try{s=typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){s=null;}
    if(!s){let flag=false;try{flag=root.sessionStorage?.getItem("careerModeShowdown.sharedJourneyPending.v1")==="1";}catch(_error){flag=false;}if(!flag)return false;try{s=typeof root.readSaveLibraryActive==="function"?root.readSaveLibraryActive():null;}catch(_error){s=null;}if(!s)return false;}
    if(!(s.sharedJourney&&s.sharedJourney.mode==="shared"&&s.sharedJourney.setupPending===true)||s.selectedLeague||(s.clubs&&(s.clubs.playerOne||s.clubs.playerTwo))||(Array.isArray(s.rounds)&&s.rounds.length))return false;
    let paired=null;try{paired=typeof root.readStorageValue==="function"?root.readStorageValue("careerModeShowdown.pairedShell.v1"):null;}catch(_error){paired=null;}
    return !(paired&&s.identity&&paired===s.identity.saveId);};
  const STARTUP_CAP_MS=15e3,startupCapLeft=()=>{let now=0;try{now=root.performance&&typeof root.performance.now==="function"?root.performance.now():0;}catch(_error){now=0;}return Math.max(0,STARTUP_CAP_MS-now);};
  const resumeGate=async()=>{if(!pendingShell())return;const deadline=new Promise(resolve=>root.setTimeout(resolve,startupCapLeft()));const entry=await Promise.race([entryReady,deadline]);const resume=entry&&typeof entry.startupResume==="function"?entry.startupResume():null;if(resume)await Promise.race([Promise.resolve(resume).catch(()=>null),deadline]);};
  // r79 gallery: a reload in a live Showdown (this tab's careerModeShowdown.liveGame.v1 flag, js/productionSharedJourneyEntry.js)
  // is taken back into the game by js/onlinePlayerIdentity.js (Studio Z3) once the identity and the pair are ready. The hold above
  // let go first (that shell is already paired), so Home showed for 0.7-1.0 s, with a Remote Joining flicker, before the league
  // wheel; only the 2.7 s splash minimum hid it without reduced motion. The loading screen now stays until that resume has left
  // Home, the flag is dropped (pair no longer playing), the resume let go (careerModeTabResumeLetGo: failed or gave up), the
  // identity cannot resume (signed out, offline, choosing), or a screen that needs the player is up (GET READY, the identity card,
  // or a Remote Joining card settled on a session that is not active, e.g. hosting for the partner
  // again after the 4-hour session ended; its first, unresolved frame is part of the resume), bounded by js/app.js's 15 s startup cap.
  const liveGameHeld=()=>{try{return root.sessionStorage?.getItem("careerModeShowdown.liveGame.v1")==="1";}catch(_error){return false;}};
  const shownLayer=id=>{const el=root.document&&root.document.getElementById(id);return Boolean(el&&!el.hidden&&!el.classList.contains("hidden"));};
  const liveGameResumeOpen=()=>{
    if(!liveGameHeld()||startupCapLeft()<=0||root.careerModeTabResumeLetGo===true)return false;
    if(typeof root.getActiveScreenName==="function"&&root.getActiveScreenName()!=="mainMenu")return false;
    let current=null;try{current=root.CareerModeOnlinePlayerIdentity?.getState?.()||null;}catch(_error){current=null;}
    if(current&&!["idle","connecting","signing-in","saving-manager","ready"].includes(current.status))return false;
    if(shownLayer("productionSharedJourneyEntryOverlay")||shownLayer("onlinePlayerIdentityOverlay"))return false;
    if(shownLayer("sparkRemoteJoiningOverlay")){let remote=null;try{remote=root.CareerModeSparkRemoteJoining?.getState?.()||null;}catch(_error){remote=null;}if(remote&&remote.busy!==true&&typeof remote.sessionState==="string"&&!["active","unresolved"].includes(remote.sessionState))return false;}
    return true;
  };
  const liveGameGate=async()=>{while(liveGameResumeOpen())await new Promise(resolve=>root.setTimeout(resolve,50));};
  root.careerModeHomeHold=1;
  const home=v10().then(reusGate).catch(error=>root.console?.warn?.("[Career Mode Showdown] Reus Gate could not check Home.",error)).then(resumeGate).catch(()=>null).then(liveGameGate).catch(()=>null).then(()=>{root.careerModeHomeHold=0;});
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(()=>home.then(resultsV10),{timeout:2500});else root.setTimeout?.(()=>home.then(resultsV10),600);
  // JOB-26: Team V's skin for Start/Join, the League wheel and the Club packs, registered with that loader.
  const v10Setup=()=>load("v10-screens","js/v10Screens.js",()=>root.CareerModeV10Screens).then(()=>load("v10-setup","js/v10Setup.js",()=>root.CareerModeV10Setup)).then(()=>root.CareerModeV10Setup.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Team V setup skin unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(v10Setup,{timeout:3000});else root.setTimeout?.(v10Setup,700);
  // JOB-27: Team V's Transfer War skin for the shared Transfer Challenge (registers with the loader above).
  const v10Transfer=()=>load("v10-transfer","js/transferScreenV10.js",()=>root.CareerModeTransferScreenV10).then(()=>root.CareerModeTransferScreenV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Transfer War visuals unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(v10Transfer,{timeout:3000});else root.setTimeout?.(v10Transfer,700);
  // JOB-34: Team V's Club Assignment for the club reveal (registers with the loader above; owns clubWheelScreen).
  const v10Club=()=>load("v10-club","js/clubScreenV10.js",()=>root.CareerModeClubScreenV10).then(()=>root.CareerModeClubScreenV10.install()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Club Assignment visuals unavailable.",error));
  if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(v10Club,{timeout:3000});else root.setTimeout?.(v10Club,700);
  (async()=>{
    const seasonResultsRoute=install("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js","CareerModeProductionSharedSeasonResultsRoute");
    const seasonCommit=install("ssjr-production-season-commit","js/productionSharedSeasonCommit.js","CareerModeProductionSharedSeasonCommit");
    const canonicalScoring=(async()=>{
      await seasonCommit;
      await prepare([
        ["ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js","CareerModeSharedShowdownCatalog"],
        ["ssjr-shared-setup-protocol","js/sharedShowdownSetup.js","CareerModeSharedShowdownSetup"],
        ["ssjr-season-results-protocol","js/sharedSeasonResults.js","CareerModeSharedSeasonResults"],
        ["ssjr-season-commit-protocol","js/sharedSeasonCommit.js","CareerModeSharedSeasonCommit"],
        ["ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js","CareerModeSparkSharedSeasonCommit"],
        ["ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js","CareerModeSharedCanonicalScoring"],
        ["ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js","CareerModeSparkSharedCanonicalScoring"]
      ]);
      return install("ssjr-production-canonical-scoring","js/productionSharedCanonicalScoring.js","CareerModeProductionSharedCanonicalScoring");
    })();
    const historyConvergence=(async()=>{
      await canonicalScoring;
      await prepare([
        ["ssjr-history-convergence-protocol","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],
        ["ssjr-history-convergence-provider","js/sparkSharedHistoryConvergence.js","CareerModeSparkSharedHistoryConvergence"]
      ]);
      return install("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js","CareerModeProductionSharedHistoryConvergence");
    })();
    const multiSeason=(async()=>{
      await historyConvergence;
      await prepare([
        ["ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js","CareerModeSharedMultiSeasonProgression"],
        ["ssjr-multi-season-provider","js/sparkSharedMultiSeasonProgression.js","CareerModeSparkSharedMultiSeasonProgression"]
      ]);
      return install("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js","CareerModeProductionSharedMultiSeasonProgression");
    })();
    const journeyReconnect=(async()=>{
      await multiSeason;
      await prepare([["ssjr-journey-reconnect-protocol","js/sharedJourneyReconnect.js","CareerModeSharedJourneyReconnect"]]);
      return install("ssjr-production-journey-reconnect","js/productionSharedJourneyReconnect.js","CareerModeProductionSharedJourneyReconnect");
    })();
    const journeyConflicts=(async()=>{
      await journeyReconnect;
      await prepare([["ssjr-journey-conflicts-protocol","js/sharedJourneyConflicts.js","CareerModeSharedJourneyConflicts"]]);
      return install("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js","CareerModeProductionSharedJourneyConflicts");
    })();
    const localReconciliation=(async()=>{
      await journeyConflicts;await historyConvergence;
      await prepare([["ssjr-local-reconciliation-protocol","js/sharedLocalReconciliation.js","CareerModeSharedLocalReconciliation"]]);
      return install("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js","CareerModeProductionSharedLocalReconciliation");
    })();
    const finalReconciliation=(async()=>{
      await localReconciliation;await multiSeason;await historyConvergence;
      await prepare([["ssjr-final-reconciliation-protocol","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"]]);
      return install("ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js","CareerModeProductionSharedFinalReconciliation");
    })();
    const terminalClose=(async()=>{
      await finalReconciliation;
      await prepare([
        ["ssjr-terminal-close-protocol","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],
        ["private-session","js/sparkPrivateSession.js","CareerModeSparkPrivateSession"],
        ["ssjr-terminal-close-provider","js/sparkTerminalClose.js","CareerModeSparkTerminalClose"]
      ]);
      return install("ssjr-production-terminal-close","js/productionSharedTerminalClose.js","CareerModeProductionSharedTerminalClose");
    })();
    await Promise.all([
      load("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),
      install("ssjr-production-entry","js/productionSharedJourneyEntry.js","CareerModeProductionSharedJourneyEntry").then(api=>{entryInstalled(api);return api;},error=>{entryInstalled(null);throw error;}),
      install("ssjr-production-guard","js/productionSharedJourneyGuard.js","CareerModeProductionSharedJourneyGuard"),
      install("ssjr-production-career-start","js/productionSharedCareerStart.js","CareerModeProductionSharedCareerStart"),
      install("ssjr-production-season-results","js/productionSharedSeasonResults.js","CareerModeProductionSharedSeasonResults"),
      seasonCommit,canonicalScoring,historyConvergence,multiSeason,journeyReconnect,journeyConflicts,localReconciliation,finalReconciliation,terminalClose,
      (async()=>{await seasonResultsRoute;return install("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js","CareerModeProductionSharedTransferChallenge");})()
    ]);
    // r85: ?ssjr=1 is the simple SSJR test. Only its panel loads: none of the older acceptance tooling or guided aside.
    if(ssjrTestEnabled&&!acceptanceEnabled)return install("ssjr-physical-journey-acceptance","js/ssjrPhysicalJourneyAcceptance.js","CareerModeSSJRPhysicalJourneyAcceptance");
    if(!acceptanceEnabled)return;
    if(!witnessEnabled)await install("ssjr-acceptance-polished-bridge","js/ssjrAcceptancePolishedBridge.js","CareerModeSSJRAcceptancePolishedBridge");
    await load("ssjr-stage5f-negative-probes","js/stage5fProductionAuthenticatedNegatives.js",()=>root.CareerModeStage5fProductionAuthenticatedNegatives);
    if(!witnessEnabled)await load("ssjr-production-negative-probe-runner","js/ssjrProductionNegativeProbeRunner.js",()=>root.CareerModeSSJRProductionNegativeProbeRunner);
    await load("ssjr-production-negative-evidence","js/ssjrProductionNegativeEvidence.js",()=>root.CareerModeSSJRProductionNegativeEvidence);
    if(!witnessEnabled)await install("ssjr-production-acceptance-recorder","js/ssjrProductionAcceptanceRecorder.js","CareerModeSSJRProductionAcceptanceRecorder");
    const actor=root.CareerModeSSJRProductionActorEvidence;
    if(!actor||typeof actor.install!=="function")throw new Error("js/ssjrProductionNegativeEvidence.js loaded without the actor-attributed v2 acceptance sidecar.");
    actor.install();
    if(!witnessEnabled&&root.document){
      const recorder=root.document.getElementById("ssjrProductionAcceptanceRecorder");
      const actorPanel=root.document.getElementById("ssjrActorEvidenceV2");
      if(recorder&&actorPanel){actorPanel.style.cssText="position:static;max-width:100%;max-height:none;overflow:visible;margin:12px 0 0;padding:12px;background:#111;color:#fff;border:1px solid #777;border-radius:8px;font:14px/1.4 system-ui";recorder.append(actorPanel);}
    }
    if(physicalEnabled)await install("ssjr-physical-journey-acceptance","js/ssjrPhysicalJourneyAcceptance.js","CareerModeSSJRPhysicalJourneyAcceptance");
  })().catch(error=>root.console?.warn?.("[Career Mode Showdown] Shared Journey bootstrap unavailable.",error));
})(typeof window!=="undefined"?window:globalThis);