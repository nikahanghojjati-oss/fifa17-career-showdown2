const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const SAVE_KEY="careerModeShowdown.saveLibrary";

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyEntry&&document.getElementById("startSharedShowdown"),null,{timeout:12000});

    // Seed an unrelated local career first. Shared preparation must create a different active shell
    // instead of teaching the peer to use Continue Career against this existing career.
    await page.evaluate(()=>showScreen("createShowdown",false));
    await page.locator("#showdownName").fill("Existing Local Career");
    await page.locator("#managerOne").fill("Old Manager One");
    await page.locator("#managerTwo").fill("Old Manager Two");
    await page.locator("#startShowdown").click();
    await page.waitForFunction(key=>{const raw=localStorage.getItem(key);if(!raw)return false;const library=JSON.parse(raw);return Boolean(library.activeSaveId&&library.saves?.length===1);},SAVE_KEY,{timeout:12000});
    const oldSaveId=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activeSaveId,SAVE_KEY);

    await page.evaluate(()=>showScreen("createShowdown",false));
    await page.locator("#showdownName").fill("Reload Guard Proof");
    await page.locator("#managerOne").fill("Manager One");
    await page.locator("#managerTwo").fill("Manager Two");
    await page.locator("#startSharedShowdown").click();

    await page.waitForFunction(key=>{
      const raw=localStorage.getItem(key);if(!raw)return false;
      const library=JSON.parse(raw);const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return Boolean(entry&&entry.showdown&&entry.showdown.sharedJourney&&entry.showdown.sharedJourney.mode==="shared"&&entry.showdown.sharedJourney.setupPending===true);
    },SAVE_KEY,{timeout:12000});

    const created=await page.evaluate(key=>{
      const library=JSON.parse(localStorage.getItem(key));const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return {activeSaveId:library.activeSaveId,saveIds:library.saves.map(item=>item.saveId),marker:entry.showdown.sharedJourney,selectedLeague:entry.showdown.selectedLeague,clubs:entry.showdown.clubs,rounds:entry.showdown.rounds};
    },SAVE_KEY);
    assert.match(created.activeSaveId,/^save_[a-f0-9]{24}$/);
    assert.notEqual(created.activeSaveId,oldSaveId,"Shared preparation must create a new local shell rather than reuse the unrelated local career.");
    assert.equal(created.saveIds.includes(oldSaveId),true,"Preparing Shared Showdown must preserve the existing local career in Save Library.");
    assert.deepEqual(created.marker,{contractVersion:1,mode:"shared",setupPending:true});
    assert.equal(created.selectedLeague,null);
    assert.deepEqual(created.clubs,{playerOne:null,playerTwo:null});
    assert.deepEqual(created.rounds,[]);
    assert.equal(await page.locator("#startSharedShowdown").textContent(),"PREPARE SHARED SHOWDOWN");
    assert.match(await page.locator("#sharedShowdownOrderingNote").textContent(),/BOTH manager devices before pairing/i);

    // Reproduce the physical peer path without a second code prompt: once the already-paired
    // peer's private-session state becomes ACTIVE, Shared Journey Entry must reclaim the route.
    await page.evaluate(async()=>{
      const listeners=new Set();
      const accountId="account_peer_fixture",deviceId="device_peer_fixture",rivalryId="pair_peer_fixture";
      let state={status:"idle",open:false,busy:false,sessionId:null,rivalryId,accountId,deviceId,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null};
      window.__peerRemoteOpenCount=0;window.__peerRemoteCloseCount=0;
      window.CareerModeProductionFirebaseRuntime={};
      window.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId})};
      window.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId})};
      window.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId,accountId,deviceId,binding:{managerRole:"playerTwo"}})};
      window.CareerModeSparkRemoteJoining={
        getState:()=>state,
        subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
        async openPanel(){window.__peerRemoteOpenCount+=1;state={...state,open:true};for(const listener of listeners)listener(state);return true;},
        closePanel(){window.__peerRemoteCloseCount+=1;state={...state,open:false};return true;}
      };
      window.__activatePeerSession=()=>{state={...state,status:"ready",open:true,role:"peer",sessionState:"active",sessionId:"session_peer_fixture",revision:1,expiresAtEpochMs:Date.now()+600000,pendingAction:null};for(const listener of [...listeners])listener(state);};
      await window.CareerModeProductionSharedJourneyEntry.openPanel();
    });
    const openJoin=page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"OPEN / JOIN PRIVATE SESSION"});
    await openJoin.waitFor({state:"visible",timeout:5000});await openJoin.click();
    await page.waitForFunction(()=>window.__peerRemoteOpenCount===1,null,{timeout:3000});
    await page.evaluate(()=>window.__activatePeerSession());
    await page.waitForFunction(()=>window.__peerRemoteCloseCount===1,null,{timeout:3000});
    await page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"CONTINUE TO LEAGUE WHEEL"}).waitFor({state:"visible",timeout:5000});
    assert.equal(await page.locator("#productionSharedJourneyEntryOverlay").evaluate(node=>!node.classList.contains("hidden")),true,"ACTIVE peer join must return to Shared Journey Entry automatically.");
    assert.equal(await page.locator("#productionSharedJourneyEntryOverlay").textContent().then(text=>/Continue Career/i.test(text)),true,"Shared entry should explicitly explain that Continue Career is local-only.");
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyEntry.peerActiveReturnToSharedEntry),true);
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyEntry.bothDevicesPrepareSharedShell),true);

    await page.evaluate(()=>sessionStorage.clear());
    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyGuard&&typeof window.loadRuntimeScript==="function",null,{timeout:12000});

    await page.evaluate(async()=>{
      await loadRuntimeScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof window.ensureSaveLibraryRuntimeAuthority==="function");
      await ensureSaveLibraryRuntimeAuthority();
      const library=CareerModeSaveLibraryRuntime.getLibrarySnapshot();
      await CareerModeSaveLibraryRuntime.switchActiveSave(library.activeSaveId);
      await ensureGameplayModules();
      showScreen("leagueWheelScreen",false);
    });

    const recovered=await page.evaluate(()=>({
      sessionMarker:sessionStorage.getItem("careerModeShowdown.sharedJourneyPending.v1"),
      pending:CareerModeProductionSharedJourneyGuard.isSharedJourneyPending()
    }));
    assert.equal(recovered.sessionMarker,null,"Reload proof must not rely on sessionStorage.");
    assert.equal(recovered.pending,true,"Durable active Save Library marker must recover shared-mode lock after reload.");

    const capture=await page.evaluate(async()=>{
      const spin=document.getElementById("spinLeague");
      const clubs=document.getElementById("openClubPack");
      if(!spin||!clubs)throw new Error("Local draw controls are unavailable for capture-gate proof.");
      spin.disabled=false;spin.removeAttribute("aria-disabled");delete spin.dataset.sharedJourneyLocked;
      clubs.disabled=false;clubs.removeAttribute("aria-disabled");delete clubs.dataset.sharedJourneyLocked;
      window.__ssjrSpinTargetReached=false;window.__ssjrClubTargetReached=false;
      spin.addEventListener("click",()=>{window.__ssjrSpinTargetReached=true;});
      clubs.addEventListener("click",()=>{window.__ssjrClubTargetReached=true;});
      spin.click();clubs.click();
      await new Promise(resolve=>setTimeout(resolve,120));
      const library=CareerModeSaveLibraryRuntime.getLibrarySnapshot();
      const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return {
        spinTargetReached:window.__ssjrSpinTargetReached,
        clubTargetReached:window.__ssjrClubTargetReached,
        selectedLeague:entry.showdown.selectedLeague,
        clubs:entry.showdown.clubs,
        directSpinResult:window.spinLeagueWheel(),
        directClubResult:window.assignClubs()
      };
    });
    assert.equal(capture.spinTargetReached,false,"Capture-phase guard must stop the actual league button path before target handlers.");
    assert.equal(capture.clubTargetReached,false,"Capture-phase guard must stop the actual club button path before target handlers.");
    assert.equal(capture.selectedLeague,null,"Modified control state must not create a local league draw.");
    assert.deepEqual(capture.clubs,{playerOne:null,playerTwo:null},"Modified control state must not create local clubs.");
    assert.equal(capture.directSpinResult,false,"Direct global league draw call must remain denied.");
    assert.equal(capture.directClubResult,false,"Direct global club draw call must remain denied.");
    assert.deepEqual(pageErrors,[],"Paired-first reload/capture/peer-return proof emitted page errors.");
    process.stdout.write("PASS production paired-first entry: existing local career is preserved, each device prepares a distinct shared shell, ACTIVE peer join returns automatically without Continue Career or a second join code, durable marker survives reload, and local draw paths remain capture-denied.\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});