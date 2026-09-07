const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const raw={
  account:"ssjr-private-account-a",
  device:"device_11111111111111111111111111111111",
  rivalry:"pair_"+"2".repeat(64),
  initialSession:"session_"+"3".repeat(64),
  freshSession:"session_"+"4".repeat(64),
  canonical:"PRIVATE_CANONICAL_SAVE_BYTES"
};
const finalSetup={
  schemaVersion:1,
  objectType:"sharedShowdownSetup",
  rivalryId:raw.rivalry,
  revision:6,
  phase:"SHOWDOWN_CONFIRMED",
  coordinatorRole:"playerOne",
  leagueId:"premier-league",
  clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},
  clubLeagueIds:{playerOne:"premier-league",playerTwo:"premier-league"},
  totalSeasons:1,
  confirmedRoles:["playerOne","playerTwo"]
};
const seedSetup={...finalSetup,revision:4,phase:"SEASON_LENGTH_COMMITTED",confirmedRoles:[]};

async function openCase(browser,acceptance,mode="ready"){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  await page.addInitScript(({raw,finalSetup,seedSetup,mode})=>{
    const listeners=new Set();
    let restoredFinal=false;
    try{restoredFinal=sessionStorage.getItem("__ssjrRecorderTestMode")==="final";}catch(_error){}
    let state=mode==="active-locked"
      ? {status:"locked",open:false,busy:false,ready:false,revision:0,phase:null,rivalryId:null,sessionId:null,accountId:null,deviceId:null,managerRole:null,remoteRole:null,setup:null,message:"Registered browser authority is unavailable."}
      : restoredFinal
        ? {status:"ready",open:false,busy:false,ready:true,revision:6,phase:"SHOWDOWN_CONFIRMED",rivalryId:raw.rivalry,sessionId:raw.initialSession,accountId:raw.account,deviceId:raw.device,managerRole:"playerOne",remoteRole:"host",setup:structuredClone(finalSetup),message:"test-reload"}
        : {status:"ready",open:false,busy:false,ready:true,revision:0,phase:null,rivalryId:raw.rivalry,sessionId:raw.initialSession,accountId:raw.account,deviceId:raw.device,managerRole:"playerOne",remoteRole:"host",setup:null,message:"test"};
    const emit=()=>{for(const listener of listeners)listener(Object.freeze({...state}));};
    window.__ssjrSetupPanelOpens=0;
    window.__ssjrRemotePanelOpens=0;
    window.CareerModeProductionSharedShowdownSetup={
      getState(){return Object.freeze({...state});},
      subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
      async refresh(){emit();return Object.freeze({ok:state.ready===true});},
      async openPanel(){window.__ssjrSetupPanelOpens+=1;state={...state,open:true};emit();return true;}
    };
    window.CareerModeSparkRemoteJoining={
      openPanel(){window.__ssjrRemotePanelOpens+=1;return true;},
      getState(){return Object.freeze({sessionState:"active",sessionId:raw.initialSession,pendingAction:null,role:"host"});}
    };
    window.__ssjrRecorderSetSeed=()=>{state={...state,revision:4,phase:"SEASON_LENGTH_COMMITTED",setup:structuredClone(seedSetup)};emit();};
    window.__ssjrRecorderSetFinal=()=>{state={...state,revision:6,phase:"SHOWDOWN_CONFIRMED",setup:structuredClone(finalSetup)};emit();};
    window.__ssjrRecorderPrepareReload=()=>{sessionStorage.setItem("__ssjrRecorderTestMode","final");};
    window.__ssjrRecorderSetFresh=()=>{state={...state,sessionId:raw.freshSession,revision:6,phase:"SHOWDOWN_CONFIRMED",setup:structuredClone(finalSetup)};emit();};
    const canonicalLibrary={schemaVersion:1,activeSaveId:null,profiles:[],saves:[],migration:{fixtureMarker:raw.canonical}};
    localStorage.setItem("careerModeShowdown.saveLibrary",JSON.stringify(canonicalLibrary));
    localStorage.setItem("careerModeShowdown.legacyShowdowns",JSON.stringify([]));
    localStorage.setItem("careerModeShowdown.preferences",JSON.stringify({private:"value"}));
  },{raw,finalSetup,seedSetup,mode});
  const url=new URL(baseUrl.href);if(acceptance)url.searchParams.set("ssjr-acceptance","1");
  await page.goto(url.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  return {context,page,pageErrors};
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  let normal=null,acceptance=null,activeLocked=null;
  try{
    normal=await openCase(browser,false);
    await normal.page.waitForTimeout(1800);
    assert.equal(await normal.page.locator("#ssjrProductionAcceptanceRecorder").count(),0,"normal production mode must not expose the SSJR recorder");
    assert.equal(await normal.page.evaluate(()=>Boolean(window.CareerModeSSJRProductionAcceptanceRecorder)),false,"normal production mode must not load the SSJR recorder API");
    const normalRequests=await normal.page.evaluate(()=>performance.getEntriesByType("resource").filter(entry=>entry.name.includes("ssjrProductionAcceptanceRecorder.js")).map(entry=>entry.name));
    assert.deepEqual(normalRequests,[],"normal production mode must not request the SSJR recorder asset");

    activeLocked=await openCase(browser,true,"active-locked");
    await activeLocked.page.locator("#ssjrProductionAcceptanceRecorder").waitFor({state:"visible",timeout:7000});
    await activeLocked.page.waitForFunction(()=>window.CareerModeSSJRProductionAcceptanceRecorder.getState().remoteSessionActive===true,{timeout:5000});
    assert.match(await activeLocked.page.locator(".ssjrPrimary").textContent(),/CHECK SHARED SETUP/,"an already ACTIVE private session must never loop the owner back to OPEN PRIVATE SESSION");
    const lockedGuidance=await activeLocked.page.locator(".ssjrNext").textContent();
    assert.match(lockedGuidance,/Private session is ACTIVE/,"simple mode must acknowledge the already ACTIVE session");
    assert.match(lockedGuidance,/Registered browser authority is unavailable/,"simple mode must surface the Shared Setup blocker instead of hiding it");
    await activeLocked.page.locator(".ssjrPrimary").click();
    assert.equal(await activeLocked.page.evaluate(()=>window.__ssjrSetupPanelOpens),1,"ACTIVE-session guidance must route the primary action to Shared Setup diagnostics");
    assert.equal(await activeLocked.page.evaluate(()=>window.__ssjrRemotePanelOpens),0,"ACTIVE-session guidance must not reopen Private Remote Joining");
    assert.deepEqual(activeLocked.pageErrors,[]);

    acceptance=await openCase(browser,true);
    await acceptance.page.locator("#ssjrProductionAcceptanceRecorder").waitFor({state:"visible",timeout:7000});
    assert.equal(await acceptance.page.locator("#ssjrProductionAcceptanceRecorder .ssjrPrimary").count(),1,"acceptance mode must expose one primary NEXT STEP control");
    assert.equal(await acceptance.page.locator("#ssjrProductionAcceptanceRecorder details.ssjrAdvanced").count(),1,"fallback controls must remain collapsed behind MORE CONTROLS");
    const contract=await acceptance.page.evaluate(()=>({
      enabled:window.CareerModeSSJRProductionAcceptanceRecorder.enabled,
      productionEnabled:window.CareerModeSSJRProductionAcceptanceRecorder.productionEnabled,
      rawPersistence:window.CareerModeSSJRProductionAcceptanceRecorder.pageRawAuthorityPersistence,
      sanitizedOnly:window.CareerModeSSJRProductionAcceptanceRecorder.sanitizedSessionStorageOnly,
      canonicalMutation:window.CareerModeSSJRProductionAcceptanceRecorder.canonicalStorageMutation,
      billing:window.CareerModeSSJRProductionAcceptanceRecorder.billingRequired,
      blaze:window.CareerModeSSJRProductionAcceptanceRecorder.blazeRequired,
      appCheck:window.CareerModeSSJRProductionAcceptanceRecorder.appCheckEnforcementRequired
    }));
    assert.deepEqual(contract,{enabled:true,productionEnabled:true,rawPersistence:false,sanitizedOnly:true,canonicalMutation:false,billing:false,blaze:false,appCheck:false});

    await acceptance.page.waitForFunction(()=>window.CareerModeSSJRProductionAcceptanceRecorder.getState().statusRows[0].passed===true,{timeout:5000});
    assert.match(await acceptance.page.locator(".ssjrPrimary").textContent(),/OPEN SHARED SETUP/,"simple mode should advance the one primary control after ACTIVE is captured");
    await acceptance.page.evaluate(()=>window.__ssjrRecorderSetSeed());
    await acceptance.page.waitForFunction(()=>window.CareerModeSSJRProductionAcceptanceRecorder.getState().statusRows[1].passed===true,{timeout:5000});
    await acceptance.page.evaluate(()=>window.__ssjrRecorderSetFinal());
    await acceptance.page.waitForFunction(()=>window.CareerModeSSJRProductionAcceptanceRecorder.getState().statusRows[2].passed===true,{timeout:5000});
    assert.match(await acceptance.page.locator(".ssjrPrimary").textContent(),/RELOAD & VERIFY/,"simple mode should turn the primary control into reload proof after revision 6");

    await acceptance.page.evaluate(()=>window.__ssjrRecorderPrepareReload());
    await Promise.all([
      acceptance.page.waitForNavigation({waitUntil:"domcontentloaded"}),
      acceptance.page.evaluate(()=>window.CareerModeSSJRProductionAcceptanceRecorder.armReload(true))
    ]);
    await acceptance.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await acceptance.page.locator("#ssjrProductionAcceptanceRecorder").waitFor({state:"visible",timeout:7000});
    await acceptance.page.waitForFunction(()=>window.CareerModeSSJRProductionAcceptanceRecorder.getState().statusRows[4].passed===true,{timeout:5000});
    assert.match(await acceptance.page.locator(".ssjrPrimary").textContent(),/OPEN FRESH SESSION/,"simple mode should request only a fresh session after reload proof");

    await acceptance.page.evaluate(()=>window.__ssjrRecorderSetFresh());
    await acceptance.page.waitForFunction(()=>window.CareerModeSSJRProductionAcceptanceRecorder.getState().completed===true,{timeout:5000});
    assert.match(await acceptance.page.locator(".ssjrPrimary").textContent(),/DOWNLOAD SAFE RESULT/,"completed simple mode should reduce the final action to one safe download");

    const result=await acceptance.page.evaluate(()=>({state:window.CareerModeSSJRProductionAcceptanceRecorder.getState(),draft:window.CareerModeSSJRProductionAcceptanceRecorder.getDraftEvidence(),stored:sessionStorage.getItem("careerModeShowdown.ssjrAcceptance.safe.v1")}));
    assert.equal(result.state.completed,true,"guided positive recorder should complete after a real reload and fresh-session resume");
    assert.equal(result.draft.evidenceType,"SSJR-1.1-production-shared-setup-guided-positive-draft");
    assert.equal(result.draft.privacySafe,true);
    assert.equal(result.draft.rawAuthorityIncluded,false);
    assert.equal(result.draft.canonicalStorageRawIncluded,false);
    assert.equal(result.draft.canonicalStorageViolation,false);
    assert.match(result.draft.accountFingerprint,/^sha256:[a-f0-9]{64}$/);
    assert.match(result.draft.deviceFingerprint,/^sha256:[a-f0-9]{64}$/);
    assert.match(result.draft.rivalryFingerprint,/^sha256:[a-f0-9]{64}$/);
    assert.match(result.draft.pairedActiveBeforeSetup.sessionFingerprint,/^sha256:[a-f0-9]{64}$/);
    assert.match(result.draft.freshActiveSessionResume.sessionFingerprint,/^sha256:[a-f0-9]{64}$/);
    assert.notEqual(result.draft.pairedActiveBeforeSetup.sessionFingerprint,result.draft.freshActiveSessionResume.sessionFingerprint);
    assert.equal(result.draft.canonicalStorageBeforeHash,result.draft.canonicalStorageAfterHash,"canonical storage must remain byte-identical through positive acceptance");
    assert.equal(result.draft.finalSetup.clubLeagueIds.playerOne,"premier-league");
    assert.equal(result.draft.finalSetup.clubLeagueIds.playerTwo,"premier-league");
    for(const secret of Object.values(raw)){
      assert.equal(JSON.stringify(result.draft).includes(secret),false,`safe draft leaked raw private value: ${secret}`);
      assert.equal(String(result.stored||"").includes(secret),false,`sanitized session storage leaked raw private value: ${secret}`);
    }
    assert.deepEqual(acceptance.pageErrors,[]);
    console.log("PASS SSJR recorder is query-gated and absent from normal production mode");
    console.log("PASS SSJR recorder routes an already ACTIVE session to Shared Setup diagnostics instead of looping Private Remote Joining");
    console.log("PASS SSJR recorder simple mode exposes one context-aware NEXT STEP control while fallback controls stay collapsed");
    console.log("PASS SSJR recorder auto-captures paired-first, rev4, rev6, a real browser reload and fresh-session positive checkpoints");
    console.log("PASS SSJR recorder persists only sanitized SHA-256 evidence and preserves canonical local save bytes");
  }finally{
    if(normal)await normal.context.close().catch(()=>{});
    if(activeLocked)await activeLocked.context.close().catch(()=>{});
    if(acceptance)await acceptance.context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error("SSJR PRODUCTION ACCEPTANCE RECORDER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});