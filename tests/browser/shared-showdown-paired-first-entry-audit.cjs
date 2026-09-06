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
      return {activeSaveId:library.activeSaveId,marker:entry.showdown.sharedJourney,selectedLeague:entry.showdown.selectedLeague,clubs:entry.showdown.clubs,rounds:entry.showdown.rounds};
    },SAVE_KEY);
    assert.match(created.activeSaveId,/^save_[a-f0-9]{24}$/);
    assert.deepEqual(created.marker,{contractVersion:1,mode:"shared",setupPending:true});
    assert.equal(created.selectedLeague,null);
    assert.deepEqual(created.clubs,{playerOne:null,playerTwo:null});
    assert.deepEqual(created.rounds,[]);

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
    assert.deepEqual(pageErrors,[],"Paired-first reload/capture proof emitted page errors.");
    process.stdout.write("PASS production paired-first entry: durable Save Library shared marker survives sessionStorage-cleared reload, actual lexical-bound league/club click paths are capture-denied after modified-client re-enable, direct draw aliases remain denied, and no local league/club mutation occurs.\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});