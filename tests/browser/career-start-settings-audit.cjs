// Settings START REAL CAREER row (career start marker). Static server only, no Firebase: the signed-in account and
// the marker provider are in-page fakes; the provider itself is proved by tests/firebase/career-start-marker-emulator.cjs.
//   CMS_TEST_PORT=4190 node tests/support/static-server.cjs   then   CMS_BASE_URL=http://127.0.0.1:4190/ node tests/browser/career-start-settings-audit.cjs
const assert=require("node:assert/strict");
const {installMarbleConfirmAnswers,marbleConfirmMessages}=require("./support/marble-confirm.cjs");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const CONFIRM="Start your real career now? Finished test Showdowns stay saved but are hidden from History, Trophy Room and Legacy. Ask Daniel to press this too.";

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  // r78 (HO-029): START REAL CAREER asks in the shared marble confirm box (no native dialog any more).
  await installMarbleConfirmAnswers(page,{answer:true});
  const setAnswer=value=>page.evaluate(v=>{window.__marbleConfirmDefault=v;},value);
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  let step=0;const ok=label=>console.log(`ok ${++step} ${label}`);
  const openSettings=async()=>{
    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:12000});
    await page.locator(".settingsDataPanel").waitFor({state:"visible",timeout:12000});
  };
  const closeSettings=async()=>{await page.locator(".settingsFooter .menuButton").click();await page.locator("#settingsOverlay").waitFor({state:"hidden",timeout:12000});};
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.locator("#settingsButton").waitFor({state:"visible",timeout:12000});

    await openSettings();
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".settingsStartRealCareer").count(),0,"no START REAL CAREER without a signed-in account");
    assert.equal(await page.locator(".settingsCareerStart").isHidden(),true);
    ok("signed out: the row stays hidden");
    await closeSettings();

    // Fake a signed-in Nik and an in-memory marker provider (the real module is never loaded here).
    await page.evaluate(()=>{
      const real=window.CareerModeSparkConnectedAccount||{};
      window.CareerModeSparkConnectedAccount={...real,getState:()=>({...(real.getState?.()||{}),connected:true,accountId:"acct_nik"})};
      window.CareerModeOnlinePlayerIdentity={...(window.CareerModeOnlinePlayerIdentity||{}),getState:()=>({status:"ready",managerId:"nik",accountId:"acct_nik"})};
      window.__careerStart={marker:{status:"none",active:false,hiddenRivalryIds:[],startedAt:null,revision:null},calls:[]};
      const s=window.__careerStart;
      window.CareerModeCareerStartMarker={
        readCurrentMarker:async()=>{s.calls.push("read");return s.marker;},
        startRealCareer:async()=>{s.calls.push("start");s.marker={status:"ready",active:true,hiddenRivalryIds:["pair_"+"1".repeat(64)],startedAt:Date.UTC(2026,9,16,12),revision:0};return s.marker;},
        setActive:async active=>{s.calls.push("active:"+active);s.marker={...s.marker,active,revision:s.marker.revision+1};return s.marker;},
        hiddenRivalryIds:m=>m.active?m.hiddenRivalryIds:[],epoch:()=>0,getState:()=>({status:s.marker.status})
      };
    });

    await openSettings();
    const start=page.locator(".settingsStartRealCareer");
    await start.waitFor({state:"visible",timeout:12000});
    assert.equal((await start.innerText()).trim(),"START REAL CAREER");
    ok("signed in, no Showdown, no marker: one START REAL CAREER row");

    await setAnswer(false);await start.click();await page.waitForTimeout(200);
    assert.deepEqual(await marbleConfirmMessages(page),[CONFIRM]);
    assert.deepEqual(await page.evaluate(()=>window.__careerStart.calls.filter(c=>c!=="read")),[],"cancel writes nothing");
    assert.equal(await start.isVisible(),true);
    ok("confirm step: the owner text, and Cancel changes nothing");

    await setAnswer(true);await start.click();
    await page.locator(".settingsCareerStartToggleRow").waitFor({state:"visible",timeout:12000});
    assert.equal(await page.locator(".settingsCareerStart .settingsInfoRow").count(),0,"r78: no REAL CAREER STARTED row (Nik 2026-10-17)");
    assert.equal(await page.locator(".settingsStartRealCareer").count(),0);
    const toggle=page.locator(".settingsCareerStartToggle");
    assert.match(await page.locator(".settingsCareerStartToggleRow").innerText(),/SHOW TEST SHOWDOWNS AGAIN/);
    assert.equal(await toggle.getAttribute("aria-checked"),"false");
    assert.deepEqual(await page.evaluate(()=>window.__careerStart.calls.filter(c=>c!=="read")),["start"]);
    ok("after pressing: no REAL CAREER STARTED row, only the SHOW TEST SHOWDOWNS AGAIN switch (off)");

    await toggle.click();
    await page.waitForFunction(()=>document.querySelector(".settingsCareerStartToggle")?.getAttribute("aria-checked")==="true");
    await page.locator(".settingsCareerStartToggle").click();
    await page.waitForFunction(()=>document.querySelector(".settingsCareerStartToggle")?.getAttribute("aria-checked")==="false");
    assert.deepEqual(await page.evaluate(()=>window.__careerStart.calls.filter(c=>c!=="read")),["start","active:false","active:true"]);
    ok("the switch sets active=false, and back to true");

    const overflow=await page.evaluate(()=>{const e=document.scrollingElement;return e.scrollWidth-e.clientWidth;});
    assert.ok(overflow<=0,`no horizontal scroll at phone width (${overflow}px)`);
    await page.locator(".settingsCareerStart").screenshot({path:require("node:path").join(require("node:os").tmpdir(),"cms-career-start-settings.png")});
    ok("phone width: no horizontal overflow");
    await closeSettings();

    // An unfinished Showdown hides the row.
    await page.evaluate(()=>{
      const rivalryId="pair_"+"a".repeat(64);
      window.CareerModePersistentNikDanielPair={...(window.CareerModePersistentNikDanielPair||{}),getState:()=>({status:"paired",initialized:true,rivalryId,connectionState:"active"})};
    });
    await openSettings();
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".settingsCareerStart").isHidden(),true,"hidden while a Showdown is active");
    await closeSettings();
    await page.evaluate(()=>{window.CareerModePersistentNikDanielPair={...window.CareerModePersistentNikDanielPair,getState:()=>({status:"waiting",initialized:true,rivalryId:"pair_"+"b".repeat(64),connectionState:"pending-pair"})};});
    await openSettings();
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".settingsCareerStart").isHidden(),true,"hidden while a connection code waits");
    ok("hidden while a Showdown is active or waiting for the other manager");

    assert.deepEqual(pageErrors,[]);
    console.log(`PASS career start Settings audit: ${step} checks at ${baseUrl.href}`);
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
