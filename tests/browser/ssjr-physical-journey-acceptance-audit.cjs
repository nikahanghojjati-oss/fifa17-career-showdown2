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
async function expose(page,stage,{storage="gameplay",localPhase="PREVIEW_READY",season=1,total=1,accepted=null}={}){
  await page.evaluate(({raw,stage,storage,localPhase,season,total,accepted})=>{
    const remote={sessionState:"active",pendingAction:null,revision:1,role:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.rivalry,sessionId:raw.session};
    const setup={ready:true,managerRole:"playerOne",remoteRole:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.rivalry,sessionId:raw.session,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:total}};
    const done=accepted??season,terminalPlan=done===total;
    const all={remote,setup,career:{state:{phase:"CAREER_START_READY",revision:2}},transfer:{state:{phase:"COMPLETED",revision:5},seasonNumber:season},results:{phase:"RESULTS_READY",revision:2,seasonNumber:season},commit:{phase:"ACKNOWLEDGED",revision:3,seasonNumber:season},scoring:{phase:"SCORING_RECONCILED",revision:1,seasonNumber:season},history:{phase:"HISTORY_CONVERGED",revision:1,throughSeason:season},multi:{phase:terminalPlan?"SHOWDOWN_COMPLETE":"SEASON_READY",revision:done,state:{phase:terminalPlan?"SHOWDOWN_COMPLETE":"SEASON_READY",totalSeasons:total,acceptedSeasons:done,activeSeason:terminalPlan?null:done+1,terminal:terminalPlan}},reconnect:{phase:"ACTIVE_RECOVERED",activeSeason:season},local:{phase:localPhase,canonicalStorageMutation:localPhase==="APPLIED",providerWriteRequired:localPhase==="APPLIED",automaticLocalApply:false,candidateCOnly:true},final:{phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,completedSeason:season},terminal:{phase:"CLOSED",terminal:true,rivalryRevision:7}};
    const enabled={history:["remote","setup","career","transfer","results","commit","scoring","history","multi"],recovered:["remote","setup","career","transfer","results","commit","scoring","history","multi","reconnect"],terminal:["remote","setup","career","transfer","results","commit","scoring","history","multi","reconnect","local","final","terminal"]}[stage]||[];
    const bind=(key,name)=>{window[name]={getState:()=>enabled.includes(key)?all[key]:null};};
    bind("remote","CareerModeSparkRemoteJoining");bind("setup","CareerModeProductionSharedShowdownSetup");bind("career","CareerModeProductionSharedCareerStart");bind("transfer","CareerModeProductionSharedTransferChallenge");bind("results","CareerModeProductionSharedSeasonResults");bind("commit","CareerModeProductionSharedSeasonCommit");bind("scoring","CareerModeProductionSharedCanonicalScoring");bind("history","CareerModeProductionSharedHistoryConvergence");bind("multi","CareerModeProductionSharedMultiSeasonProgression");bind("reconnect","CareerModeProductionSharedJourneyReconnect");bind("local","CareerModeProductionSharedLocalReconciliation");bind("final","CareerModeProductionSharedFinalReconciliation");bind("terminal","CareerModeProductionSharedTerminalClose");
    window.CareerModeSparkConnectedAccount={getState:()=>({connected:true,accountId:raw.account})};window.CareerModeSparkPrivatePairing={getState:()=>({registered:true,deviceId:raw.device})};window.CareerModeSparkConnectedRivalry={getState:()=>({attached:true,rivalryId:raw.rivalry,accountId:raw.account,deviceId:raw.device,binding:{managerRole:"playerOne"}})};
    window.captureCareerModeRawBackupInputs=()=>({saveLibrary:JSON.stringify({fixture:storage}),legacyShowdowns:"[]",preferences:'{"mode":"test"}'});
  },{raw,stage,storage,localPhase,season,total,accepted});
}
async function reinstall(page,stage,storage,plan={}){
  await page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});await expose(page,stage,{storage,...plan});
  await page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());await page.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
}

(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});let normal=null,scoped=null,mutated=null,multi=null;
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

    await closeCase(mutated);mutated=null;

    // r51: one 3-season run records every season in order, the completed plan, and becomes exportable only then.
    multi=await openCase(browser,true);const mp=multi.page;await setCanonical(mp,"three-season");await mp.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.install());
    const observe=()=>mp.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.observe());
    for(let season=1;season<=3;season+=1){await expose(mp,"history",{storage:"three-season",season,total:3,accepted:season});await observe();await observe();}
    await mp.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().conflictGuardProven===true,null,{timeout:5000});
    const plan={season:3,total:3,accepted:3};
    await multi.context.setOffline(true);await mp.waitForTimeout(120);await expose(mp,"recovered",{storage:"three-season",...plan});await multi.context.setOffline(false);await mp.waitForTimeout(120);await observe();
    await mp.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().onlineRecovered===true,null,{timeout:3000});
    await mp.reload({waitUntil:"domcontentloaded"});await mp.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});await reinstall(mp,"recovered","three-season",plan);await mp.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().reloadResumed===true,null,{timeout:3000});
    await mp.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.captureLocalReconciliationBaseline());await mp.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.verifyLocalReconciliationPreview());
    await expose(mp,"terminal",{storage:"three-season",...plan});await observe();
    await mp.reload({waitUntil:"domcontentloaded"});await mp.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});await reinstall(mp,"terminal","three-season",plan);await mp.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().terminalReloadVerified===true,null,{timeout:3000});
    const three=await mp.evaluate(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getEvidence());
    for(const stage of ["transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged"])assert.deepEqual(three.milestones.filter(item=>item.stage===stage).map(item=>item.seasonNumber),[1,2,3],`${stage} must be recorded exactly once per season`);
    assert.deepEqual(three.milestones.filter(item=>item.stage==="showdown-complete").map(item=>[item.seasonNumber,item.totalSeasons]),[[3,3]],"the completed plan is recorded once, only when all seasons are accepted");
    assert.equal(three.milestones.find(item=>item.stage==="final-season-reconciled").seasonNumber,3);assert.equal(three.completed,true,"a complete 3-season run is exportable");
    assert.match(await mp.locator("#ssjrPhysicalJourneyAcceptance").innerText(),/✓ SEASONS 3\/3/);
    const {validatePhysicalJourneyPair}=await import(require("node:url").pathToFileURL(require("node:path").resolve(__dirname,"../../scripts/validate-ssjr-physical-journey-evidence.mjs")).href);
    const rival=structuredClone(three);Object.assign(rival,{managerRole:"playerTwo",remoteRole:"peer",accountFingerprint:"sha256:"+"9".repeat(64),deviceFingerprint:"sha256:"+"8".repeat(64),deviceLabel:"iPhone peer",networkLabel:"Cellular",device:{...three.device,userAgent:"iPhone Safari",platform:"iPhone"}});
    const labelled={...three,deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi"};
    const verdict=validatePhysicalJourneyPair(labelled,rival,{expectedRuntimeRevision:three.runtimeRevision});
    assert.equal(verdict.valid,true,`the real recorder's 3-season export must satisfy the validator: ${JSON.stringify(verdict.issues)}`);assert.equal(verdict.summary.totalSeasons,3);
    assert.deepEqual(multi.errors,[]);

    console.log("PASS r51 Physical Journey recorder records every season of a 3-season plan exactly once and in order, records the completed plan, and its export satisfies the validator");
    console.log("PASS r20 Physical Journey recorder ignores legitimate career mutations before reconciliation, proves unchanged canonical storage only around PREVIEW, persists ordered recovery/reload evidence, and rejects mutation inside the protected preview window");
  }finally{await closeCase(multi);await closeCase(mutated);await closeCase(scoped);await closeCase(normal);await browser.close().catch(()=>{});}
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY R20 BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});