const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const raw={account:"physical_account_a",device:"device_"+"1".repeat(32),rivalry:"pair_"+"2".repeat(64),session:"session_"+"3".repeat(64)};

async function loadDirect(browser,physical){
  // This audit intentionally exercises the recorder in isolation. Blocking service workers
  // keeps the real lazy SSJR bootstrap from bypassing page.route on reload and installing a
  // second recorder instance; offline-shell retention is proven separately by publication contracts.
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true,locale:"en-US",serviceWorkers:"block"});
  const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.stack||error.message));
  await page.route("**/js/ssjr.js*",route=>route.abort());
  const url=new URL(baseUrl.href);if(physical){url.searchParams.set("ssjr-acceptance","1");url.searchParams.set("ssjr-physical","1");}
  await page.goto(url.href,{waitUntil:"domcontentloaded"});await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});
  await page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());
  return {context,page,errors};
}
async function launchCase(runtime,physical){const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});try{return {browser,...await loadDirect(browser,physical)};}catch(error){if(browser.isConnected())await browser.close().catch(()=>{});throw error;}}
async function closeCase(entry){if(!entry)return;await entry.context.close().catch(()=>{});if(entry.browser.isConnected())await entry.browser.close().catch(()=>{});}
async function setCanonical(page,storageValue="baseline"){
  await page.evaluate(storageValue=>{window.captureCareerModeRawBackupInputs=()=>({saveLibrary:JSON.stringify({fixture:storageValue}),legacyShowdowns:"[]",preferences:'{"mode":"test"}'});},storageValue);
}

async function installFixture(page,stage="history",{storageValue="baseline",localPhase="PREVIEW_READY"}={}){
  await page.evaluate(({raw,stage,storageValue,localPhase})=>{
    const remote={sessionState:"active",pendingAction:null,revision:1,role:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.rivalry,sessionId:raw.session};
    const setup={ready:true,managerRole:"playerOne",remoteRole:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.rivalry,sessionId:raw.session,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:1}};
    const states={remote,setup,career:{state:{phase:"CAREER_START_READY",revision:2}},transfer:{state:{phase:"COMPLETED",revision:5,seasonNumber:1}},results:{phase:"RESULTS_READY",revision:2,seasonNumber:1},commit:{phase:"ACKNOWLEDGED",revision:3,seasonNumber:1},scoring:{phase:"SCORING_RECONCILED",revision:1,seasonNumber:1},history:{phase:"HISTORY_CONVERGED",revision:1,throughSeason:1},reconnect:{phase:"ACTIVE_RECOVERED",activeSeason:1},local:{phase:localPhase,canonicalStorageMutation:localPhase==="APPLIED",providerWriteRequired:localPhase==="APPLIED",automaticLocalApply:false,candidateCOnly:true},finalState:{phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,completedSeason:1},terminal:{phase:"CLOSED",terminal:true,rivalryRevision:7}};
    const enabled={history:["remote","setup","career","transfer","results","commit","scoring","history"],recovered:["remote","setup","career","transfer","results","commit","scoring","history","reconnect"],terminal:["remote","setup","career","transfer","results","commit","scoring","history","reconnect","local","finalState","terminal"]}[stage]||[];
    const expose=(key,name)=>{window[name]={getState:()=>enabled.includes(key)?states[key]:null};};
    expose("remote","CareerModeSparkRemoteJoining");expose("setup","CareerModeProductionSharedShowdownSetup");expose("career","CareerModeProductionSharedCareerStart");expose("transfer","CareerModeProductionSharedTransferChallenge");expose("results","CareerModeProductionSharedSeasonResults");expose("commit","CareerModeProductionSharedSeasonCommit");expose("scoring","CareerModeProductionSharedCanonicalScoring");expose("history","CareerModeProductionSharedHistoryConvergence");expose("reconnect","CareerModeProductionSharedJourneyReconnect");expose("local","CareerModeProductionSharedLocalReconciliation");expose("finalState","CareerModeProductionSharedFinalReconciliation");expose("terminal","CareerModeProductionSharedTerminalClose");
    window.CareerModeSparkConnectedAccount={getState:()=>({connected:true,accountId:raw.account})};window.CareerModeSparkPrivatePairing={getState:()=>({registered:true,deviceId:raw.device})};window.CareerModeSparkConnectedRivalry={getState:()=>({attached:true,rivalryId:raw.rivalry,accountId:raw.account,deviceId:raw.device,binding:{managerRole:"playerOne"}})};
    window.captureCareerModeRawBackupInputs=()=>({saveLibrary:JSON.stringify({fixture:storageValue}),legacyShowdowns:"[]",preferences:'{"mode":"test"}'});
  },{raw,stage,storageValue,localPhase});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();let normal=null,integrity=null,candidate=null,physical=null;
  try{
    normal=await launchCase(runtime,false);assert.equal(await normal.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.enabled),false);assert.equal(await normal.page.locator("#ssjrPhysicalJourneyAcceptance").count(),0);assert.deepEqual(normal.errors,[]);await closeCase(normal);normal=null;

    // Prove the immutable canonical baseline can be captured before any private identity exists.
    integrity=await launchCase(runtime,true);await setCanonical(integrity.page,"baseline");await integrity.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    await installFixture(integrity.page,"history",{storageValue:"changed-before-identity"});await integrity.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    const earlyMutation=await integrity.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.notEqual(earlyMutation.canonicalStorageBeforeHash,earlyMutation.canonicalStorageAfterHash);assert.equal(earlyMutation.canonicalStorageViolation,true,"mutation after recorder baseline but before identity binding must be detected");await closeCase(integrity);integrity=null;

    // Prove Candidate C Apply is permanently disqualifying even if a later preview reappears.
    candidate=await launchCase(runtime,true);await setCanonical(candidate.page,"baseline");await candidate.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());await installFixture(candidate.page,"terminal",{localPhase:"PREVIEW_READY"});await candidate.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());await installFixture(candidate.page,"terminal",{localPhase:"APPLIED"});await candidate.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());await installFixture(candidate.page,"terminal",{localPhase:"PREVIEW_READY"});await candidate.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    const appliedEvidence=await candidate.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(appliedEvidence.candidateCApplied,true,"Candidate C Apply must remain sticky after a later preview");assert.equal(appliedEvidence.completed,false);assert.ok(appliedEvidence.milestones.some(item=>item.stage==="local-reconciliation-safe"&&item.phase==="APPLIED"));await closeCase(candidate);candidate=null;

    physical=await launchCase(runtime,true);assert.equal(await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.enabled),true);await physical.page.locator("#ssjrPhysicalJourneyAcceptance").waitFor({state:"visible",timeout:4000});
    await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.setLabels("iPhone acceptance","Cellular"));await setCanonical(physical.page,"baseline");await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    await installFixture(physical.page,"history");await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    await physical.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().conflictGuardProven===true,null,{timeout:5000});
    const beforeOffline=await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(beforeOffline.rawAuthorityIncluded,false);assert.equal(beforeOffline.canonicalRawIncluded,false);assert.equal(beforeOffline.recorderNetworkRequests,false);assert.equal(beforeOffline.candidateCApplied,false);assert.ok(beforeOffline.milestones.some(item=>item.stage==="history-converged"));
    const serialized=JSON.stringify(beforeOffline);for(const value of Object.values(raw))assert.equal(serialized.includes(value),false,"raw authority must not appear in browser evidence");

    await physical.context.setOffline(true);await physical.page.waitForTimeout(120);await physical.context.setOffline(false);await physical.page.waitForTimeout(120);await installFixture(physical.page,"recovered");await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    await physical.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().onlineRecovered===true,null,{timeout:3000});

    await physical.page.reload({waitUntil:"domcontentloaded"});await physical.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});await physical.page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});await installFixture(physical.page,"recovered");await physical.page.evaluate(()=>{window.CareerModeSSJRPhysicalJourneyAcceptance.install();return window.CareerModeSSJRPhysicalJourneyAcceptance.observe();});await physical.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().reloadResumed===true,null,{timeout:3000});

    await installFixture(physical.page,"terminal");await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());await physical.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().milestones>=16,null,{timeout:3000});
    const terminalDraft=await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(terminalDraft.terminalReloadVerified,false,"terminal reload requires a later startup");assert.ok(terminalDraft.milestones.some(item=>item.stage==="reload-resumed"));assert.ok(terminalDraft.milestones.find(item=>item.stage==="reload-resumed").sequence<terminalDraft.milestones.find(item=>item.stage==="terminal-closed").sequence);assert.ok(terminalDraft.milestones.some(item=>item.stage==="terminal-closed"));

    await physical.page.reload({waitUntil:"domcontentloaded"});await physical.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});await physical.page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});await installFixture(physical.page,"terminal");await physical.page.evaluate(()=>{window.CareerModeSSJRPhysicalJourneyAcceptance.install();return window.CareerModeSSJRPhysicalJourneyAcceptance.observe();});await physical.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().terminalReloadVerified===true,null,{timeout:3000});
    const final=await physical.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(final.completed,true);assert.equal(final.startupCount,3);assert.equal(final.canonicalStorageViolation,false);assert.equal(final.canonicalStorageBeforeHash,final.canonicalStorageAfterHash);assert.equal(final.candidateCApplied,false);assert.ok(final.milestones.some(item=>item.stage==="network-offline"));assert.ok(final.milestones.some(item=>item.stage==="reconnect-recovered"));assert.ok(final.milestones.some(item=>item.stage==="terminal-reload-verified"));assert.deepEqual(physical.errors,[]);

    console.log("PASS Physical Journey recorder is disabled outside the explicit acceptance query and exposes no panel");
    console.log("PASS Physical Journey recorder captures canonical baseline before identity and detects early canonical mutation");
    console.log("PASS Physical Journey Candidate C Apply evidence is sticky and cannot be erased by a later safe preview");
    console.log("PASS Physical Journey browser observer persists sanitized evidence across real offline/online plus distinct pre-terminal/post-terminal reload boundaries");
  }finally{await closeCase(physical);await closeCase(candidate);await closeCase(integrity);await closeCase(normal);}
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY ACCEPTANCE BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});