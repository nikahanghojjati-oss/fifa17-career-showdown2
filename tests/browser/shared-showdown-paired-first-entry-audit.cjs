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
    await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&document.getElementById("newShowdown")&&document.getElementById("startShowdown"),null,{timeout:12000});
    assert.equal(await page.locator("#startSharedShowdown").count(),0,"The retired duplicate Shared Showdown entry must not return.");

    // Preserve an unrelated recovery Save so canonical start proves that player entry creates a
    // distinct shared shell without deleting internal recovery data.
    await page.evaluate(async()=>{
      await loadRuntimeScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof window.ensureSaveLibraryRuntimeAuthority==="function");
      await ensureSaveLibraryRuntimeAuthority();
      const now=new Date().toISOString();
      const old={schemaVersion:2,integrityWarnings:[],id:"paired-first-existing-local",name:"Existing Recovery Career",managers:{playerOne:"Old Manager One",playerTwo:"Old Manager Two"},totalRounds:3,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:now,updatedAt:now,completedAt:null,archivedAt:null};
      const created=await CareerModeSaveLibraryRuntime.createShowdown(old);
      if(!created?.identity?.saveId)throw new Error("Storage fixture did not receive stable Save identity.");
    });
    await page.waitForFunction(key=>{const raw=localStorage.getItem(key);if(!raw)return false;const library=JSON.parse(raw);return Boolean(library.activeSaveId&&library.saves?.length===1);},SAVE_KEY,{timeout:12000});
    const oldSaveId=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activeSaveId,SAVE_KEY);

    // Signed-out users must be routed into identity instead of receiving a misleading
    // "connection service unavailable" error or creating a partial Showdown shell.
    await page.evaluate(()=>{
      window.__identityGateOpens=0;
      window.CareerModeOnlinePlayerIdentity={
        getState:()=>({status:"signed-out",initialized:true,online:true,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false}),
        openGate:()=>{window.__identityGateOpens+=1;return true;},
        syncPair:async()=>null
      };
      document.getElementById("startShowdown").textContent="";
    });
    await page.waitForFunction(()=>document.getElementById("startShowdown")?.textContent==="SIGN IN TO START",null,{timeout:4000});
    await page.locator("#newShowdown").click();
    await page.locator("#createShowdown").waitFor({state:"visible",timeout:5000});
    await page.locator("#startShowdown").click();
    assert.equal(await page.evaluate(()=>window.__identityGateOpens),1,"signed-out Start must open the player identity gate exactly once");
    assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).activeSaveId,key),oldSaveId,"signed-out Start must not create or replace a Showdown shell");

    // Simulate Daniel's host browser. In the unified r25 flow, only Daniel enters season
    // selection and starts the Showdown; Nik joins later from the Home join action.
    await page.evaluate(()=>{
      const staleRivalryId="pair_"+("e".repeat(64));
      window.__freshStartPairState="active";
      window.__freshStartAbandonCount=0;
      window.__freshStartRivalryId=staleRivalryId;
      window.confirm=()=>true;
      window.CareerModePersistentNikDanielPair={
        abandonCurrentShowdown:async({expectedRivalryId}={})=>{
          if(expectedRivalryId!==staleRivalryId)throw new Error("Fresh-start abandonment targeted the wrong rivalry.");
          window.__freshStartAbandonCount+=1;
          window.__freshStartPairState="closed";
          return{ok:true,status:"closed",rivalryId:staleRivalryId};
        }
      };
      window.CareerModeOnlinePlayerIdentity={
        getState:()=>({status:"ready",initialized:true,online:true,accountId:"account_daniel_fixture",managerId:"daniel",managerLabel:"Daniel",deviceId:"device_daniel_fixture",registered:true}),
        openGate:()=>false,
        syncPair:async()=>window.__freshStartPairState==="active"
          ?{status:"recovery-required",connectionState:"active",rivalryId:staleRivalryId,providerSaveId:"save_"+("f".repeat(24))}
          :{status:"unpaired",connectionState:null,rivalryId:null}
      };
    });
    await page.evaluate(()=>{window.CareerModeOnlinePlayerIdentity?.getState?.();document.getElementById("startShowdown").textContent="";});
    await page.waitForFunction(()=>document.getElementById("startShowdown")?.textContent==="START A SHOWDOWN",null,{timeout:4000});
    await page.locator("#createShowdown").waitFor({state:"visible",timeout:5000});
    assert.equal(await page.locator("#managerOne").inputValue(),"Daniel");
    assert.equal(await page.locator("#managerTwo").inputValue(),"Nik");
    assert.equal(await page.locator("#startShowdown").textContent(),"START A SHOWDOWN");
    await page.locator("#roundAmount").selectOption("5");
    await page.locator("#startShowdown").click();

    await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyEntry?.singleProductEntry===true,null,{timeout:12000});
    await page.waitForFunction(key=>{
      const raw=localStorage.getItem(key);if(!raw)return false;
      const library=JSON.parse(raw);const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return Boolean(entry&&entry.showdown&&entry.showdown.sharedJourney?.mode==="shared"&&entry.showdown.sharedJourney.setupPending===true);
    },SAVE_KEY,{timeout:12000});

    const created=await page.evaluate(key=>{
      const library=JSON.parse(localStorage.getItem(key));const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return {activeSaveId:library.activeSaveId,saveIds:library.saves.map(item=>item.saveId),name:entry.showdown.name,managers:entry.showdown.managers,totalRounds:entry.showdown.totalRounds,marker:entry.showdown.sharedJourney,selectedLeague:entry.showdown.selectedLeague,clubs:entry.showdown.clubs,rounds:entry.showdown.rounds};
    },SAVE_KEY);
    assert.match(created.activeSaveId,/^save_[a-f0-9]{24}$/);
    assert.notEqual(created.activeSaveId,oldSaveId,"Canonical start must create a new shared shell rather than reuse unrelated recovery data.");
    assert.equal(created.saveIds.includes(oldSaveId),true,"Canonical start must preserve unrelated recovery data.");
    assert.equal(created.name,"Daniel vs Nik");
    assert.deepEqual(created.managers,{playerOne:"Daniel",playerTwo:"Nik"});
    assert.equal(created.totalRounds,5,"Paired-first shell must preserve the selected 1/3/5/10 season count.");
    assert.deepEqual(created.marker,{contractVersion:1,mode:"shared",setupPending:true});
    assert.equal(created.selectedLeague,null);
    assert.deepEqual(created.clubs,{playerOne:null,playerTwo:null});
    assert.deepEqual(created.rounds,[]);
    const freshStart=await page.evaluate(()=>({abandonCount:window.__freshStartAbandonCount,pairState:window.__freshStartPairState}));
    assert.deepEqual(freshStart,{abandonCount:1,pairState:"closed"},"START A SHOWDOWN must close one stale provider pair before creating the fresh local shell instead of looping into CAREER RECOVERY NEEDED.");

    // Reproduce the already-paired peer path: once the private session becomes ACTIVE, player
    // entry returns automatically and exposes the cleaned START CAREER action.
    await page.evaluate(async()=>{
      const listeners=new Set();
      const accountId="account_peer_fixture",deviceId="device_peer_fixture",rivalryId="pair_peer_fixture";
      let state={status:"idle",open:false,busy:false,sessionId:null,rivalryId,accountId,deviceId,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null};
      window.__peerRemoteOpenCount=0;window.__peerRemoteCloseCount=0;window.__pairControlsOpenCount=0;
      window.CareerModeProductionFirebaseRuntime={};
      window.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId})};
      window.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId})};
      window.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId,accountId,deviceId,binding:{managerRole:"playerTwo"}})};
      window.CareerModePersistentNikDanielPair={initialize:async()=>{window.__pairControlsOpenCount+=1;return {status:"paired"};},render:()=>{let panel=document.getElementById("persistentNikDanielPairPanel");if(!panel){panel=document.createElement("section");panel.id="persistentNikDanielPairPanel";panel.textContent="CAREER READY";document.body.appendChild(panel);}return panel;}};
      window.CareerModeOnlinePlayerIdentity={...window.CareerModeOnlinePlayerIdentity,syncPair:async()=>window.CareerModePersistentNikDanielPair.initialize({force:true})};
      window.CareerModeSparkRemoteJoining={
        getState:()=>state,
        subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
        async openPanel(){window.__peerRemoteOpenCount+=1;state={...state,open:true};for(const listener of listeners)listener(state);return true;},
        closePanel(){window.__peerRemoteCloseCount+=1;state={...state,open:false};return true;}
      };
      window.__activatePeerSession=()=>{state={...state,status:"ready",open:true,role:"peer",sessionState:"active",sessionId:"session_peer_fixture",revision:1,expiresAtEpochMs:Date.now()+600000,pendingAction:null};for(const listener of [...listeners])listener(state);};
      await window.CareerModeProductionSharedJourneyEntry.openPanel();
    });
    const connection=page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"REVIEW CONNECTION"});
    await connection.waitFor({state:"visible",timeout:5000});await connection.click();
    await page.waitForFunction(()=>window.__pairControlsOpenCount===1,null,{timeout:3000});
    await page.locator("#persistentNikDanielPairPanel").waitFor({state:"visible",timeout:3000});
    await page.evaluate(()=>window.CareerModeProductionSharedJourneyEntry.openPanel());
    const openJoin=page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"CONTINUE"});
    await openJoin.waitFor({state:"visible",timeout:5000});await openJoin.click();
    await page.waitForFunction(()=>window.__peerRemoteOpenCount===1,null,{timeout:3000});
    await page.evaluate(()=>window.__activatePeerSession());
    await page.waitForFunction(()=>window.__peerRemoteCloseCount===1,null,{timeout:3000});
    await page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"START CAREER"}).waitFor({state:"visible",timeout:5000});
    const entryText=await page.locator("#productionSharedJourneyEntryOverlay").textContent();
    assert.equal(/Private Remote Joining|Shared Journey/i.test(entryText||""),false,"Player entry must not expose retired architecture labels.");
    assert.match(entryText||"",/DANIEL \+ NIK/i);
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyEntry.peerActiveReturnToSharedEntry),true);
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyEntry.bothDevicesPrepareSharedShell),true);
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyEntry.continueCareerUsesPairedAuthority),true);

    // Durable setup authority must survive reload without depending on sessionStorage.
    await page.evaluate(()=>sessionStorage.clear());
    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.waitForFunction(()=>typeof window.loadRuntimeScript==="function",null,{timeout:12000});
    await page.evaluate(async()=>{
      await loadRuntimeScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof window.ensureSaveLibraryRuntimeAuthority==="function");
      await ensureSaveLibraryRuntimeAuthority();
      const library=CareerModeSaveLibraryRuntime.getLibrarySnapshot();
      await CareerModeSaveLibraryRuntime.switchActiveSave(library.activeSaveId);
      await ensureGameplayModules();
      showScreen("leagueWheelScreen",false);
    });
    await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyGuard,null,{timeout:12000});
    const recovered=await page.evaluate(()=>({sessionMarker:sessionStorage.getItem("careerModeShowdown.sharedJourneyPending.v1"),pending:CareerModeProductionSharedJourneyGuard.isSharedJourneyPending()}));
    assert.equal(recovered.sessionMarker,null,"Reload proof must not rely on sessionStorage.");
    assert.equal(recovered.pending,true,"Durable active Save Library marker must recover paired-first lock after reload.");

    const capture=await page.evaluate(async()=>{
      const spin=document.getElementById("spinLeague"),clubs=document.getElementById("openClubPack");
      if(!spin||!clubs)throw new Error("Draw controls are unavailable for capture-gate proof.");
      spin.disabled=false;spin.removeAttribute("aria-disabled");delete spin.dataset.sharedJourneyLocked;
      clubs.disabled=false;clubs.removeAttribute("aria-disabled");delete clubs.dataset.sharedJourneyLocked;
      window.__ssjrSpinTargetReached=false;window.__ssjrClubTargetReached=false;
      spin.addEventListener("click",()=>{window.__ssjrSpinTargetReached=true;});
      clubs.addEventListener("click",()=>{window.__ssjrClubTargetReached=true;});
      spin.click();clubs.click();await new Promise(resolve=>setTimeout(resolve,120));
      const library=CareerModeSaveLibraryRuntime.getLibrarySnapshot();const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return {spinTargetReached:window.__ssjrSpinTargetReached,clubTargetReached:window.__ssjrClubTargetReached,selectedLeague:entry.showdown.selectedLeague,clubs:entry.showdown.clubs,directSpinResult:window.spinLeagueWheel(),directClubResult:window.assignClubs()};
    });
    assert.equal(capture.spinTargetReached,false,"Pairing-first guard must stop league selection before target handlers.");
    assert.equal(capture.clubTargetReached,false,"Pairing-first guard must stop club selection before target handlers.");
    assert.equal(capture.selectedLeague,null);
    assert.deepEqual(capture.clubs,{playerOne:null,playerTwo:null});
    assert.equal(capture.directSpinResult,false);
    assert.equal(capture.directClubResult,false);
    assert.deepEqual(pageErrors,[],"Canonical paired-first browser proof emitted page errors.");
    process.stdout.write("PASS canonical paired-first entry: real Start a Showdown ownership reaches the shared shell, Daniel/P1 and Nik/P2 stay canonical, recovery data is preserved, ACTIVE peer return is automatic, durable lock survives reload, and league/club selection cannot bypass connection authority.\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
