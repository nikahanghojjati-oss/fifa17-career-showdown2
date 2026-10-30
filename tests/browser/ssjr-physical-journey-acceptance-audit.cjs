const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

// r85: the simple SSJR test panel (?ssjr=1) in a real browser page, with the game's modules stubbed: one tap for the network,
// in-game offline/reconnect/reload checks, the automatic close, and the closed Showdown confirmed after one more reload.
const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const raw={account:"physical_account_a",device:"device_"+"1".repeat(32),rivalry:"pair_"+"2".repeat(64),other:"pair_"+"4".repeat(64),session:"session_"+"3".repeat(64)};
const API="window.CareerModeSSJRPhysicalJourneyAcceptance";

async function openCase(browser,enabled=true){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"en-US",serviceWorkers:"block"});
  const page=await context.newPage(),errors=[];page.on("pageerror",error=>errors.push(error.stack||error.message));
  await page.route("**/js/ssjr.js*",route=>route.abort());
  await load(page,enabled);
  return {context,page,errors};
}
async function load(page,enabled=true){
  const url=new URL(baseUrl.href);if(enabled)url.searchParams.set("ssjr","1");
  if(page.url()==="about:blank")await page.goto(url.href,{waitUntil:"domcontentloaded"});else await page.reload({waitUntil:"domcontentloaded"});
  // js/ssjr.js is blocked, so Home never reports ready and the app hands over at its 15 s safety cap.
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:25000});
  await page.evaluate(()=>{
    window.__ssjr={};window.__previews=0;
    const names={remote:"CareerModeSparkRemoteJoining",setup:"CareerModeProductionSharedShowdownSetup",career:"CareerModeProductionSharedCareerStart",transfer:"CareerModeProductionSharedTransferChallenge",results:"CareerModeProductionSharedSeasonResults",commit:"CareerModeProductionSharedSeasonCommit",scoring:"CareerModeProductionSharedCanonicalScoring",history:"CareerModeProductionSharedHistoryConvergence",multi:"CareerModeProductionSharedMultiSeasonProgression",reconnect:"CareerModeProductionSharedJourneyReconnect",local:"CareerModeProductionSharedLocalReconciliation",final:"CareerModeProductionSharedFinalReconciliation",terminal:"CareerModeProductionSharedTerminalClose"};
    for(const [key,name] of Object.entries(names))window[name]={getState:()=>window.__ssjr[key]??null};
    // The read-only Local Reconciliation preview brackets itself with the recorder's storage proof, as the real module does.
    window.CareerModeProductionSharedLocalReconciliation.preview=async()=>{window.__previews+=1;const recorder=window.CareerModeSSJRPhysicalJourneyAcceptance;await recorder.captureLocalReconciliationBaseline();window.__ssjr.local={phase:"PREVIEW_READY"};await recorder.verifyLocalReconciliationPreview();return window.__ssjr.local;};
    window.captureCareerModeRawBackupInputs=()=>({saveLibrary:JSON.stringify({fixture:window.__storage||"career"}),legacyShowdowns:"[]",preferences:"{}"});
  });
  await page.addScriptTag({url:new URL("js/ssjrPhysicalJourneyAcceptance.js",baseUrl).href});
}
async function setState(page,patch){await page.evaluate(patch=>{for(const [key,value] of Object.entries(patch)){if(value===null)delete window.__ssjr[key];else window.__ssjr[key]=value;}},patch);}
const observe=page=>page.evaluate(`${API}.observe()`);
const state=page=>page.evaluate(`${API}.getState()`);
const next=page=>page.locator(".ssjrTestNext").innerText();
function live({rivalry=raw.rivalry,total=3}={}){
  return {remote:{sessionState:"active",pendingAction:null,revision:1,role:"host",accountId:raw.account,deviceId:raw.device,rivalryId:rivalry,sessionId:raw.session},
    setup:{managerRole:"playerOne",remoteRole:"host",accountId:raw.account,deviceId:raw.device,rivalryId:rivalry,sessionId:raw.session,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:total}},
    career:{state:{phase:"CAREER_START_READY",revision:2}}};
}
function season(n,total=3){
  const done=n===total;
  return {transfer:{state:{phase:"COMPLETED",revision:5},seasonNumber:n},results:{phase:"RESULTS_READY",revision:2,seasonNumber:n},commit:{phase:"ACKNOWLEDGED",revision:3,seasonNumber:n},scoring:{phase:"SCORING_RECONCILED",revision:1,seasonNumber:n},history:{phase:"HISTORY_CONVERGED",revision:1,throughSeason:n},
    multi:{phase:done?"SHOWDOWN_COMPLETE":"SEASON_READY",state:{totalSeasons:total,acceptedSeasons:n,terminal:done}}};
}

(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});let normal=null,run=null,mutated=null,retry=null;
  try{
    normal=await openCase(browser,false);await normal.page.evaluate(`${API}.install()`);
    assert.equal(await normal.page.evaluate(`${API}.enabled`),false);assert.equal(await normal.page.locator("#ssjrPhysicalJourneyAcceptance").count(),0,"no panel without ?ssjr=1");

    run=await openCase(browser);const p=run.page;
    await p.evaluate(`${API}.install()`);
    assert.equal(await p.evaluate(()=>{const panel=document.getElementById("ssjrPhysicalJourneyAcceptance"),b=panel.getBoundingClientRect(),top=document.elementFromPoint(b.left+b.width/2,b.top+8);return getComputedStyle(panel).position==="fixed"&&panel.contains(top);}),true,"r85: the panel floats above every screen (full-bleed game screens hid the old strip)");
    assert.equal(await p.locator("#ssjrPhysicalJourneyAcceptance input").count(),0,"nothing to type");
    assert.match(await next(p),/Tap how this device is online/);
    await p.getByRole("button",{name:"WI-FI"}).click();assert.equal((await state(p)).networkLabel,"Wi-Fi");
    assert.equal(await p.locator(".ssjrTestNetwork").isVisible(),false,"the network choice goes away once tapped");

    await setState(p,{...live(),career:null});await observe(p);
    // A signal drop before the career starts is not the offline check.
    await run.context.setOffline(true);await p.waitForTimeout(100);await run.context.setOffline(false);await p.waitForTimeout(100);
    assert.equal((await state(p)).offlineObserved,false,"before the career starts a drop does not count");
    await setState(p,live());await setState(p,season(1));await observe(p);
    await p.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().conflictGuardProven===true,null,{timeout:5000});
    assert.match(await next(p),/turn the internet off/);

    // A reconnect counts only after the game held its state offline.
    await setState(p,{reconnect:{phase:"ACTIVE_RECOVERED",activeSeason:2}});
    await run.context.setOffline(true);await p.waitForTimeout(100);await observe(p);
    assert.equal((await state(p)).onlineRecovered,false,"a stale RECOVERED state from before the drop is not a reconnect");
    await setState(p,{reconnect:{phase:"OFFLINE_HOLD"}});await observe(p);
    await run.context.setOffline(false);await p.waitForTimeout(100);await setState(p,{reconnect:{phase:"ACTIVE_RECOVERED",activeSeason:2}});await observe(p);
    await p.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().onlineRecovered===true,null,{timeout:3000});
    assert.match(await next(p),/reload this page once/);
    assert.equal(await p.locator("#ssjrPhysicalJourneyAcceptance .ssjrTestReload").isVisible(),true,"r86: a RELOAD NOW button on the reload step");

    await load(p);await setState(p,{...live(),...season(1),reconnect:{phase:"ACTIVE_RECOVERED",activeSeason:2}});await p.evaluate(`${API}.install()`);await observe(p);
    await p.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().reloadResumed===true,null,{timeout:3000});
    assert.match(await next(p),/Play on: season 2 of 3/);
    assert.equal(await p.locator("#ssjrPhysicalJourneyAcceptance .ssjrTestReload").isVisible(),false,"the button goes away once the reload counted");
    await setState(p,season(2));await observe(p);await setState(p,season(3));await setState(p,{local:{phase:"REMOTE_OBSERVED"}});await observe(p);await observe(p);
    await p.waitForFunction(()=>window.__previews===1&&window.CareerModeSSJRPhysicalJourneyAcceptance.getState().canonicalStorageProofReady===true,null,{timeout:3000});
    await setState(p,{final:{phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,completedSeason:3},terminal:{phase:"CLOSED",terminal:true,rivalryRevision:7}});await observe(p);
    assert.match(await next(p),/Showdown saved\. Reload this page once more/);
    assert.equal(await p.locator("#ssjrPhysicalJourneyAcceptance .ssjrTestReload").isVisible(),true,"and again for the reload after the close");
    assert.equal(await p.locator(".ssjrTestSave").isVisible(),true,"SAVE RESULT FILE shows once the Showdown is saved");

    // After the reload the closed Showdown is not current any more (Home shows a new start); it is confirmed by a read-only check.
    await load(p);
    await p.evaluate(raw=>{
      window.__reads=[];
      // Like production: the services SDK has no getDoc, so the recorder must import it (Codex #1014).
      window.CareerModeProductionFirebaseRuntime={firebaseFirestoreModule:"data:text/javascript,export const getDoc=async()=>null;",ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:raw.account}},firestore:{},firestoreSdk:{doc(){}}})};
      window.CareerModePersistentNikDanielPair={readCareerIndex:async options=>{window.__reads.push("index");if(typeof options?.firebaseSdk?.getDoc!=="function"||!options.firestore||!options.accountId)return {status:"unavailable",code:"CAREER_INDEX_UNAVAILABLE"};return {status:"ready",rivalryIds:[raw.other,raw.rivalry]};}};
      window.CareerModeSparkCompletedShowdownReader={readCompletedShowdown:async options=>{window.__reads.push(options.rivalryId);return {status:options.rivalryId===raw.rivalry?"completed":"not-closed"};}};
    },raw);
    await setState(p,{setup:{managerRole:"playerOne",remoteRole:"host",accountId:raw.account,deviceId:raw.device,rivalryId:raw.other,sessionId:null}});
    await p.evaluate(`${API}.install()`);await observe(p);
    await p.waitForFunction(()=>window.CareerModeSSJRPhysicalJourneyAcceptance.getState().terminalReloadVerified===true,null,{timeout:5000});
    assert.deepEqual(await p.evaluate(()=>window.__reads),["index",raw.rivalry],"one index read and one exact read of the recorded Showdown");
    const done=await p.evaluate(`${API}.getEvidence()`);
    assert.equal(done.completed,true,JSON.stringify(await state(p)));assert.equal(done.authorityViolation,false,"a new Showdown on Home after the close is not an authority change");
    assert.equal(done.startupCount,3);assert.match(done.deviceLabel,/^Daniel · /);assert.equal(done.networkLabel,"Wi-Fi");assert.equal(done.recorderNetworkWrites,false);
    assert.match(await next(p),/^Done\./);
    const order=done.milestones.map(item=>item.stage);
    assert.ok(order.indexOf("reload-resumed")<order.indexOf("showdown-complete"),"the checks happened during the game");
    const {validatePhysicalJourneyPair}=await import(require("node:url").pathToFileURL(require("node:path").resolve(__dirname,"../../scripts/validate-ssjr-physical-journey-evidence.mjs")).href);
    const rival=structuredClone(done);Object.assign(rival,{managerRole:"playerTwo",remoteRole:"peer",accountFingerprint:"sha256:"+"9".repeat(64),deviceFingerprint:"sha256:"+"8".repeat(64),deviceLabel:"Nik · iPhone 390x844",networkLabel:"Mobile data",device:{...done.device,userAgent:"iPhone Safari",platform:"iPhone"}});
    const verdict=validatePhysicalJourneyPair(done,rival,{expectedAppVersion:done.appVersion,expectedRuntimeRevision:done.runtimeRevision});
    assert.equal(verdict.valid,true,`the real recorder's 3-season export must satisfy the validator: ${JSON.stringify(verdict.issues)}`);assert.equal(verdict.summary.totalSeasons,3);
    assert.deepEqual(run.errors,[]);

    mutated=await openCase(browser);const m=mutated.page;await m.evaluate(`${API}.install()`);
    await m.evaluate(`${API}.captureLocalReconciliationBaseline()`);await m.evaluate(()=>{window.__storage="changed";});await m.evaluate(`${API}.verifyLocalReconciliationPreview()`);
    const bad=await m.evaluate(`${API}.getEvidence()`);assert.equal(bad.canonicalStorageViolation,true);assert.equal(bad.completed,false);

    // A different Showdown on the same tab before the recorded one closed is a new try: the record starts again, no reset button.
    retry=await openCase(browser);const r=retry.page;await r.evaluate(`${API}.install()`);await r.getByRole("button",{name:"MOBILE DATA"}).click();
    await setState(r,{...live(),...season(1)});await observe(r);assert.ok((await state(r)).milestones>5);
    await setState(r,{...live({rivalry:raw.other}),transfer:null,results:null,commit:null,scoring:null,history:null,multi:null});await observe(r);
    const fresh=await state(r);assert.equal(fresh.authorityViolation,false);assert.ok(fresh.milestones<=4,`the record restarted (${fresh.milestones} milestones)`);assert.equal(fresh.networkLabel,"Mobile data","the network tap is kept");
    // Codex #1014: a Showdown that closed before its checks passed does not end the test. Home's post-close screen leaves the
    // record alone; a new Showdown that really starts (its Shared Setup opens again) restarts it.
    await setState(r,{...live(),...season(1,1),terminal:{phase:"CLOSED",terminal:true,rivalryRevision:3}});await observe(r);
    const failed=await state(r);assert.ok(failed.milestones>5,"the closed, unfinished run is recorded");
    await setState(r,{transfer:null,results:null,commit:null,scoring:null,history:null,multi:null,terminal:null,career:null});await observe(r);
    assert.equal((await state(r)).milestones,failed.milestones,"Home after the close keeps the record");
    await setState(r,{setup:{...live().setup,setup:{phase:"SETUP_OPEN",revision:1,totalSeasons:3}}});await observe(r);
    const again=await state(r);assert.ok(again.milestones<=2,`a new Showdown restarts the record (${again.milestones} milestones)`);assert.equal(again.networkLabel,"Mobile data");
    // r86 (Nik's iPhone, 2026-10-29): right after that restart the other modules still showed the old Showdown's season 1 and its
    // close; none of it counts before the new Showdown's setup is confirmed, so the new record keeps the real order.
    await setState(r,{...season(1),career:{state:{phase:"CAREER_START_READY",revision:2}},terminal:{phase:"CLOSED",terminal:true,rivalryRevision:3}});await observe(r);
    const early=await r.evaluate(`${API}.getEvidence()`);
    assert.deepEqual(early.milestones.map(item=>item.stage).filter(stage=>!["remote-active","conflict-guard-proven"].includes(stage)),[],"stale stages from the old Showdown are not recorded");
    await setState(r,{...live(),terminal:null,...season(1)});await observe(r);
    const newOrder=(await r.evaluate(`${API}.getEvidence()`)).milestones.map(item=>item.stage);
    assert.ok(newOrder.indexOf("setup-confirmed")>=0&&newOrder.indexOf("setup-confirmed")<newOrder.indexOf("career-start-ready")&&newOrder.indexOf("career-start-ready")<newOrder.indexOf("results-ready"),`the new record is in order: ${newOrder.join(",")}`);

    console.log("PASS r85 SSJR test panel: one link, one tap, in-game offline (after the game held its state) and reload checks, the read-only preview asked once at the end, the automatic close confirmed after reload by one index read and one exact read, a new try restarts the record, and its 3-season export satisfies the validator");
  }finally{for(const entry of [retry,mutated,run,normal])if(entry)await entry.context.close().catch(()=>{});await browser.close().catch(()=>{});}
})().catch(error=>{console.error("SSJR PHYSICAL JOURNEY BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
