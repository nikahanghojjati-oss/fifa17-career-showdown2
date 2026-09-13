const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const raw={account:"physical_account_a",device:"device_"+"1".repeat(32),rivalry:"pair_"+"2".repeat(64),session:"session_"+"3".repeat(64)};

async function openCase(browser,physical=true){
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true,locale:"en-US",serviceWorkers:"block"});
  const page=await context.newPage(),errors=[];page.on("pageerror",error=>errors.push(error.stack||error.message));
  await page.route("**/js/ssjr.js*",route=>route.abort());
  const url=new URL(baseUrl.href);if(physical){url.searchParams.set("ssjr-acceptance","1");url.searchParams.set("ssjr-physical","1");}
  await page.goto(url.href,{waitUntil:"domcontentloaded"});await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});
  return {context,page,errors};
}
async function closeCase(entry){if(entry)await entry.context.close().catch(()=>{});}
async function setCanonical(page,value){await page.evaluate(value=>{window.captureCareerModeRawBackupInputs=()=>({saveLibrary:JSON.stringify({fixture:value}),legacyShowdowns:"[]",preferences:'{"mode":"test"}'});},value);}
async function expose(page,stage,{storage="gameplay",localPhase="PREVIEW_READY"}={}){
  await page.evaluate(({raw,stage,storage,localPhase})=>{
    const remote={sessionState:"active",pendingAction:null,revision:1,role:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.rivalry,sessionId:raw.session};
    const setup={ready:true,managerRole:"playerOne",remoteRole:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.rivalry,sessionId:raw.session,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:1}};
    const all={remote,setup,career:{state:{phase:"CAREER_START_READY",revision:2}},transfer:{state:{phase:"COMPLETED",revision:5,seasonNumber:1}},results:{phase:"RESULTS_READY",revision:2,seasonNumber:1},commit:{phase:"ACKNOWLEDGED",revision:3,seasonNumber:1},scoring:{phase:"SCORING_RECONCILED",revision:1,seasonNumber:1},history:{phase:"HISTORY_CONVERGED",revision:1,throughSeason:1},reconnect:{phase:"ACTIVE_RECOVERED",activeSeason:1},local:{phase:localPhase,canonicalStorageMutation:localPhase==="APPLIED",providerWriteRequired:localPhase==="APPLIED",automaticLocalApply:false,candidateCOnly:true},final:{phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,completedSeason:1},terminal:{phase:"CLOSED",terminal:true,rivalryRevision:7}};
    const enabled={history:["remote","setup","career","transfer","results","commit","scoring","history"],recovered:["remote","setup","career","transfer","results","commit","scoring","history","reconnect"],terminal:["remote","setup","career","transfer","results","commit","scoring","history","reconnect","local","final","terminal"]}[stage]||[];
    const bind=(key,name)=>{window[name]={getState:()=>enabled.includes(key)?all[key]:null};};
    bind("remote","CareerModeSparkRemoteJoining");bind("setup","CareerModeProductionSharedShowdownSetup");bind("career","CareerModeProductionSharedCareerStart");bind("transfer","CareerModeProductionSharedTransferChallenge");bind("results","CareerModeProductionSharedSeasonResults");bind("commit","CareerModeProductionSharedSeasonCommit");bind("scoring","CareerModeProductionSharedCanonicalScoring");bind("history","CareerModeProductionSharedHistoryConvergence");bind("reconnect","CareerModeProductionSharedJourneyReconnect");bind("local","CareerModeProductionSharedLocalReconciliation");bind("final","CareerModeProductionSharedFinalReconciliation");bind("terminal","CareerModeProductionSharedTerminalClose");
    window.CareerModeSparkConnectedAccount={getState:()=>({connected:true,accountId:raw.account})};window.CareerModeSparkPrivatePairing={getState:()=>({registered:true,deviceId:raw.device})};window.CareerModeSparkConnectedRivalry={getState:()=>({attached:true,rivalryId:raw.rivalry,accountId:raw.account,deviceId:raw.device,binding:{managerRole:"playerOne"}})};
    window.captureCareerModeRawBackupInputs=()=>({saveLibrary:JSON.stringify({fixture:storage}),legacyShowdowns:"[]",preferences:'{"mode":"test"}'});
  },{raw,stage,storage,localPhase});
}
async function reinstall(page,stage,storage){
  await page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});await expose(page,stage,{storage});
  await page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());await page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
}

(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});let normal=null,scoped=null,mutated=null;
  try{
    normal=await openCase(browser,false);await normal.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());assert.equal(await normal.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.enabled),false);assert.equal(await normal.page.locator("#ssjrPhysicalJourneyAcceptance").count(),0);await closeCase(normal);normal=null;

    scoped=await openCase(browser,true);await setCanonical(scoped.page,"old-local-career");await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());
    await setCanonical(scoped.page,"legitimate-shared-gameplay");await expose(scoped.page,"history",{storage:"legitimate-shared-gameplay"});await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    const beforeScope=await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(beforeScope.canonicalStorageBeforeHash,null,"legitimate setup/gameplay changes must not be compared to app-start storage");assert.equal(beforeScope.canonicalStorageViolation,false);
    await scoped.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().conflictGuardProven===true,null,{timeout:5000});

    await scoped.context.setOffline(true);await scoped.page.waitForTimeout(120);await expose(scoped.page,"recovered",{storage:"legitimate-shared-gameplay"});await scoped.context.setOffline(false);await scoped.page.waitForTimeout(120);await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    await scoped.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().onlineRecovered===true,null,{timeout:3000});
    await scoped.page.reload({waitUntil:"domcontentloaded"});await scoped.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});await reinstall(scoped.page,"recovered","legitimate-shared-gameplay");await scoped.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().reloadResumed===true,null,{timeout:3000});

    await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.captureLocalReconciliationBaseline());
    await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.verifyLocalReconciliationPreview());
    await expose(scoped.page,"terminal",{storage:"legitimate-shared-gameplay",localPhase:"PREVIEW_READY"});await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    const terminalDraft=await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());
    assert.equal(terminalDraft.canonicalStorageProofScope,"local-reconciliation-preview");assert.equal(terminalDraft.canonicalStorageViolation,false);assert.equal(terminalDraft.canonicalStorageBeforeHash,terminalDraft.canonicalStorageAfterHash);assert.ok(terminalDraft.milestones.some(item=>item.stage==="local-reconciliation-storage-baseline"&&item.phase==="CAPTURED"));assert.ok(terminalDraft.milestones.some(item=>item.stage==="local-reconciliation-storage-verified"&&item.phase==="UNCHANGED"));assert.ok(terminalDraft.milestones.some(item=>item.stage==="local-reconciliation-safe"&&item.phase==="PREVIEW_READY"));assert.equal(terminalDraft.terminalReloadVerified,false);

    await scoped.page.reload({waitUntil:"domcontentloaded"});await scoped.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});await reinstall(scoped.page,"terminal","legitimate-shared-gameplay");await scoped.page.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().terminalReloadVerified===true,null,{timeout:3000});
    const final=await scoped.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(final.completed,true);assert.equal(final.startupCount,3);assert.equal(final.authorityViolation,false);assert.equal(final.candidateCApplied,false);assert.equal(final.canonicalStorageViolation,false);assert.equal(final.canonicalStorageBeforeHash,final.canonicalStorageAfterHash);assert.deepEqual(scoped.errors,[]);await closeCase(scoped);scoped=null;

    mutated=await openCase(browser,true);await setCanonical(mutated.page,"preview-before");await mutated.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());await mutated.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.captureLocalReconciliationBaseline());await setCanonical(mutated.page,"preview-mutated");await mutated.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.verifyLocalReconciliationPreview());
    const bad=await mutated.page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());assert.equal(bad.canonicalStorageViolation,true);assert.notEqual(bad.canonicalStorageBeforeHash,bad.canonicalStorageAfterHash);assert.ok(bad.milestones.some(item=>item.stage==="local-reconciliation-storage-verified"&&item.phase==="CHANGED"));assert.equal(bad.completed,false);assert.deepEqual(mutated.errors,[]);

    console.log("PASS r20 Physical Journey recorder ignores legitimate career mutations before reconciliation, proves unchanged canonical storage only around PREVIEW, persists ordered recovery/reload evidence, and rejects mutation inside the protected preview window");
  }finally{await closeCase(mutated);await closeCase(scoped);await closeCase(normal);await browser.close().catch(()=>{});}
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY R20 BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});