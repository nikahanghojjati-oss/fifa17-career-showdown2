const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({
    executablePath:runtime.executablePath,
    headless:true,
    args:runtime.args
  });
  const context=await browser.newContext({
    viewport:{width:390,height:844},
    deviceScaleFactor:2,
    isMobile:true,
    hasTouch:true,
    locale:"en-US"
  });
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.stack||error.message));

  try{
    await page.addInitScript(()=>{
      window.requestIdleCallback=callback=>window.setTimeout(()=>callback({
        didTimeout:false,
        timeRemaining:()=>50
      }),4200);
      const accountState={
        status:"connected",
        initialized:true,
        signedIn:true,
        connected:true,
        busy:false,
        accountId:"account_nik_stage5e",
        displayName:"Nik",
        email:null,
        accountStatus:"active",
        message:"Connected."
      };
      const pairingState={
        status:"registered",
        initialized:true,
        registered:true,
        busy:false,
        deviceId:"device_nik_stage5e"
      };
      window.CareerModeSparkConnectedAccount={
        getState:()=>accountState,
        initialize:async()=>accountState,
        subscribe:()=>()=>{},
        mountWhenSettingsReady:async()=>true
      };
      window.CareerModeSparkPrivatePairing={
        getState:()=>pairingState,
        initialize:async()=>pairingState,
        subscribe:()=>()=>{}
      };
    });

    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.locator("#remoteJoiningButton").waitFor({state:"attached",timeout:12000});
    const identityStatus=await page.evaluate(async()=>{
      await window.loadRuntimeScript("online-player-identity","js/onlinePlayerIdentity.js",()=>Boolean(window.CareerModeOnlinePlayerIdentity));
      return (await window.CareerModeOnlinePlayerIdentity.initialize()).status;
    });
    assert.ok(identityStatus==="choose-manager"||identityStatus==="ready",`Unexpected online identity state: ${identityStatus}`);
    if(identityStatus==="choose-manager")await page.evaluate(()=>window.CareerModeOnlinePlayerIdentity.chooseManager("nik"));
    await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity?.getState?.().status==="ready",null,{timeout:15000});

    assert.equal(await page.locator('script[data-runtime-script="rj"]').count(),0,"Remote Joining runtime loaded during ordinary startup.");
    assert.equal(await page.locator("script[data-srj-dependency]").count(),0,"Remote Joining provider dependencies loaded during ordinary startup.");

    const before=await page.evaluate(()=>[
      "careerModeShowdown.saveLibrary",
      "careerModeShowdown.legacyShowdowns",
      "careerModeShowdown.preferences"
    ].map(key=>[key,localStorage.getItem(key)]));

    // This verifies the retired surface stays lazy and inert behind the normal
    // online identity boundary; ordinary players enter through Shared Showdown.
    await page.evaluate(()=>document.getElementById("remoteJoiningButton").click());
    await page.locator("#sparkRemoteJoiningOverlay").waitFor({state:"visible",timeout:12000});
    assert.equal(await page.locator('script[data-runtime-script="rj"]').count(),1);
    assert.equal(await page.locator("script[data-srj-dependency]").count(),0,"Opening the Remote Joining panel must not initialize provider dependencies before Host/Join/Read/Close.");
    assert.match(await page.locator("#sparkRemoteJoiningOverlay").innerText(),/REMOTE JOINING/);
    assert.match(await page.locator("#sparkRemoteJoiningOverlay").innerText(),/HOST PRIVATE SESSION/);
    assert.match(await page.locator("#sparkRemoteJoiningOverlay").innerText(),/JOIN PRIVATE SESSION/);

    const after=await page.evaluate(()=>[
      "careerModeShowdown.saveLibrary",
      "careerModeShowdown.legacyShowdowns",
      "careerModeShowdown.preferences"
    ].map(key=>[key,localStorage.getItem(key)]));
    assert.deepEqual(after,before,"Opening Stage 5E changed canonical local storage.");
    assert.deepEqual(errors,[],"Stage 5E rendered browser audit emitted page errors.");
    console.log(`PASS Stage 5E browser-inert Remote Joining surface behind the Nik/Daniel identity boundary at ${baseUrl.href}`);
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{
  console.error("STAGE 5E REMOTE JOINING AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
