const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));

  try{
    await page.addInitScript(()=>{
      window.requestIdleCallback=callback=>window.setTimeout(()=>callback({didTimeout:false,timeRemaining:()=>50}),4200);
    });
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.locator("#settingsButton").waitFor({state:"visible",timeout:12000});

    // Reproduce the production race seen on the installed mobile app: Settings opens
    // before the deliberately deferred production Firebase runtime installs its bridge.
    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:12000});
    await page.locator("#saveLibraryProductPanel").waitFor({state:"visible",timeout:12000});
    await page.locator("#sparkConnectedAccountPanel").waitFor({state:"visible",timeout:12000});

    assert.match(await page.locator("#sparkConnectedAccountPanel").innerText(),/CONNECTED ACCOUNT/);
    assert.equal(await page.locator("#sparkConnectedAccountPanel .settingsConnectedAccountButton").count(),1);
    assert.deepEqual(pageErrors,[],"Connected Account Settings regression audit emitted page errors.");
    process.stdout.write(`PASS Connected Account Settings survives late Firebase runtime installation at ${baseUrl.href}\n`);
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{
  console.error("CONNECTED ACCOUNT SETTINGS AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
