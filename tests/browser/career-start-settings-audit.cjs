// Settings and the career start marker (r79 PR4: the START REAL CAREER row and the SHOW TEST SHOWDOWNS AGAIN switch are
// gone). Static server only, no Firebase: the signed-in account and the marker provider are in-page fakes; the provider
// itself is proved by tests/firebase/career-start-marker-emulator.cjs.
//   CMS_TEST_PORT=4190 node tests/support/static-server.cjs   then   CMS_BASE_URL=http://127.0.0.1:4190/ node tests/browser/career-start-settings-audit.cjs
const assert=require("node:assert/strict");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  // Any confirm box Settings might open answers Cancel (none should open here).
  await installMarbleConfirmAnswers(page,{answer:false});
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
    assert.equal(await page.locator(".settingsCareerStart").count(),0);
    ok("signed out: no row");
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

    // r79 PR4 (Nik, 2026-10-17): the START REAL CAREER row and the SHOW TEST SHOWDOWNS AGAIN switch are gone from Settings.
    // The first real START writes the marker (the one-time checkmark on the seasons screen, tests/browser/r79-modes-settings-audit.cjs);
    // old test games stay stored and are never shown. This audit used to drive the row and the switch; it now proves they never appear.
    const gone=async label=>{
      await page.waitForTimeout(400);
      for(const selector of [".settingsStartRealCareer",".settingsCareerStart",".settingsCareerStartToggle",".settingsCareerStartToggleRow"])assert.equal(await page.locator(selector).count(),0,`${label}: no ${selector}`);
      const text=await page.locator("#settingsContent").innerText();
      assert.doesNotMatch(text,/START REAL CAREER|SHOW TEST SHOWDOWNS AGAIN/,`${label}: neither text in Settings`);
      assert.deepEqual(await page.evaluate(()=>window.__careerStart.calls.filter(c=>c!=="read")),[],`${label}: Settings never writes the marker`);
    };
    await openSettings();
    await gone("signed in, no Showdown, no marker");
    ok("signed in, no Showdown, no marker: no START REAL CAREER row");
    await closeSettings();

    await page.evaluate(()=>{window.__careerStart.marker={status:"ready",active:false,hiddenRivalryIds:["pair_"+"1".repeat(64)],startedAt:Date.UTC(2026,9,16,12),revision:1};});
    await openSettings();
    await gone("marker switched off by an older build");
    ok("a marker the old switch turned off: still no SHOW TEST SHOWDOWNS AGAIN switch");

    const overflow=await page.evaluate(()=>{const e=document.scrollingElement;return e.scrollWidth-e.clientWidth;});
    assert.ok(overflow<=0,`no horizontal scroll at phone width (${overflow}px)`);
    await page.locator("#settingsContent").screenshot({path:require("node:path").join(require("node:os").tmpdir(),"cms-career-start-settings.png")});
    ok("phone width: no horizontal overflow");
    await closeSettings();

    // An unfinished Showdown: still nothing, and END SHOWDOWN is the Settings control for it.
    await page.evaluate(()=>{
      const rivalryId="pair_"+"a".repeat(64);
      window.CareerModePersistentNikDanielPair={...(window.CareerModePersistentNikDanielPair||{}),getState:()=>({status:"paired",initialized:true,rivalryId,connectionState:"active"})};
    });
    await openSettings();
    await gone("a Showdown is active");
    await closeSettings();
    await page.evaluate(()=>{window.CareerModePersistentNikDanielPair={...window.CareerModePersistentNikDanielPair,getState:()=>({status:"waiting",initialized:true,rivalryId:"pair_"+"b".repeat(64),connectionState:"pending-pair"})};});
    await openSettings();
    await gone("a connection code waits");
    ok("nothing while a Showdown is active or waiting for the other manager");

    assert.deepEqual(pageErrors,[]);
    console.log(`PASS career start Settings audit: ${step} checks at ${baseUrl.href}`);
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
