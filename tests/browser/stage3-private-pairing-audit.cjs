const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const canonicalKeys=new Set([
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);

async function proveContext(browser,label,contextOptions){
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.addScriptTag({url:new URL("js/sparkPrivatePairing.js",baseUrl).href});

    const first=await page.evaluate(async()=>{
      const api=window.CareerModeSparkPrivatePairing;
      if(!api)throw new Error("Stage 3 pairing runtime did not load.");
      const before={};
      for(let index=0;index<localStorage.length;index+=1){
        const key=localStorage.key(index);
        before[key]=localStorage.getItem(key);
      }
      const one=await api.getOrCreateDeviceIdentity();
      const two=await api.getOrCreateDeviceIdentity();
      const databases=typeof indexedDB.databases==="function"?await indexedDB.databases():[];
      const after={};
      for(let index=0;index<localStorage.length;index+=1){
        const key=localStorage.key(index);
        after[key]=localStorage.getItem(key);
      }
      return {one,two,before,after,databaseNames:databases.map(item=>item&&item.name).filter(Boolean)};
    });

    assert.match(first.one.deviceId,/^device_[0-9a-f]{32}$/);
    assert.match(first.one.installationId,/^installation_[0-9a-f]{32}$/);
    assert.deepEqual(first.two,first.one,`${label}: repeated IndexedDB read changed identity.`);
    assert.deepEqual(first.after,first.before,`${label}: device identity mutated localStorage.`);
    assert.ok(first.databaseNames.includes("careerModeShowdown.privateDevice"),`${label}: private device IndexedDB was not created.`);
    assert.equal(Object.keys(first.after).filter(key=>!canonicalKeys.has(key)).some(key=>/device|pair|remote|firebase/i.test(key)),false,`${label}: Stage 3 introduced a non-canonical localStorage authority.`);

    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.addScriptTag({url:new URL("js/sparkPrivatePairing.js",baseUrl).href});
    const afterReload=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getOrCreateDeviceIdentity());
    assert.deepEqual(afterReload,first.one,`${label}: reload changed the stable device identity.`);

    await context.setOffline(true);
    const offline=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getOrCreateDeviceIdentity());
    assert.deepEqual(offline,first.one,`${label}: offline mode changed or blocked the local device identity.`);
    await context.setOffline(false);

    assert.deepEqual(pageErrors,[],`${label}: Stage 3 browser proof emitted page errors.`);
    process.stdout.write(`PASS Stage 3 ${label} IndexedDB identity persistence, reload, offline, and localStorage isolation\n`);
  }finally{
    await context.close();
  }
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    await proveContext(browser,"desktop",{viewport:{width:1365,height:768},locale:"en-US"});
    await proveContext(browser,"mobile",{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  }finally{
    await browser.close();
  }
})().catch(error=>{
  console.error("STAGE 3 PRIVATE PAIRING BROWSER AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
