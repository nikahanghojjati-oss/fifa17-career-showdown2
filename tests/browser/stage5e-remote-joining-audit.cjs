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

    // Stage 5E's engineering overlay is retired from normal play. The clean product
  // surface is the persistent Nik/Daniel pair sidecar loaded behind identity.
  await page.waitForFunction(()=>Boolean(window.CareerModePersistentNikDanielPair),null,{timeout:15000});
  await page.locator("#persistentNikDanielPairPanel").waitFor({state:"visible",timeout:12000});
  assert.equal(await page.locator("#remoteJoiningButton").isHidden(),true,"Engineering Remote Joining entry must stay hidden from normal play.");
  assert.equal(await page.locator('script[data-runtime-script="rj"]').count(),0,"Retired Remote Joining runtime must remain unloaded on the clean player surface.");
  assert.equal(await page.locator("script[data-srj-dependency]").count(),0,"Retired provider session dependencies must remain unloaded on the clean player surface.");
  const pairText=await page.locator("#persistentNikDanielPairPanel").innerText();
  assert.doesNotMatch(pairText,/HOST PRIVATE SESSION|JOIN PRIVATE SESSION/);

  const after=await page.evaluate(()=>[
      "careerModeShowdown.saveLibrary",
      "careerModeShowdown.legacyShowdowns",
      "careerModeShowdown.preferences"
    ].map(key=>[key,localStorage.getItem(key)]));
    assert.deepEqual(after,before,"Opening the clean persistent pair surface changed canonical local storage.");
    assert.deepEqual(errors,[],"Stage 5E rendered browser audit emitted page errors.");
    console.log(`PASS Stage 5E migration audit: retired Remote Joining stays hidden/unloaded while the clean persistent Nik/Daniel pair surface is browser-inert at ${baseUrl.href}`);
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{
  console.error("STAGE 5E REMOTE JOINING AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
