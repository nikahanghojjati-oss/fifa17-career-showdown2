const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const keys={
  active:"careerModeShowdown.activeShowdown",
  legacy:"careerModeShowdown.legacyShowdowns",
  preferences:"careerModeShowdown.preferences"
};
const pass=message=>process.stdout.write(`PASS  ${message}\n`);

async function waitApp(page){
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
  await page.locator("#newShowdown").waitFor({state:"visible",timeout:15000});
  await page.waitForFunction(()=>typeof window.getOfflineAppDiagnostics==="function",null,{timeout:15000});
  await page.waitForFunction(()=>window.getOfflineAppDiagnostics().offlineReady===true,null,{timeout:30000});
}

const storage=page=>page.evaluate(storageKeys=>({
  active:localStorage.getItem(storageKeys.active),
  legacy:localStorage.getItem(storageKeys.legacy),
  preferences:localStorage.getItem(storageKeys.preferences)
}),keys);

async function run(){
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({
    executablePath:runtime.executablePath,
    args:runtime.args,
    headless:true
  });
  const context=await browser.newContext({
    viewport:{width:390,height:844},
    deviceScaleFactor:2,
    isMobile:true,
    hasTouch:true
  });
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));

  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await waitApp(page);

    let diagnostics=await page.evaluate(()=>window.getOfflineAppDiagnostics());
    assert.equal(diagnostics.supported,true);
    assert.equal(diagnostics.registration,true);
    assert.equal(diagnostics.offlineReady,true);
    assert.ok(diagnostics.installGuidance);
    assert.equal(
      await page.locator("#offlineAppRail,#offlineAppPanel,#offlineInstallAction").count(),
      0,
      "Global install UI must not exist."
    );

    const manifest=await page.evaluate(async()=>{
      const link=document.querySelector('link[rel="manifest"]');
      if(!link)return null;
      const response=await fetch(link.href);
      return {
        ok:response.ok,
        type:response.headers.get("content-type")||"",
        body:await response.json()
      };
    });
    assert.ok(manifest?.ok);
    assert.match(manifest.type,/manifest\+json|application\/json/i);
    assert.equal(manifest.body.display,"standalone");
    assert.ok(
      manifest.body.icons.some(icon=>icon.sizes==="192x192")
      &&manifest.body.icons.some(icon=>icon.sizes==="512x512")
    );

    const worker=await page.evaluate(()=>new Promise((resolve,reject)=>{
      const active=navigator.serviceWorker.controller;
      if(!active)return reject(new Error("No controlling worker"));
      const channel=new MessageChannel();
      const timeout=setTimeout(()=>reject(new Error("status timeout")),5000);
      channel.port1.onmessage=event=>{
        clearTimeout(timeout);
        resolve(event.data);
      };
      active.postMessage({type:"CMS_GET_CACHE_STATUS"},[channel.port2]);
    }));
    const revision=await page.locator('meta[name="app-asset-revision"]').getAttribute("content");
    assert.equal(worker.current.ok,true);
    assert.equal(worker.current.missing.length,0);
    assert.equal(worker.current.revision,revision);
    pass("online install shell and runtime identity verified without global install UI");

    const fixture={
      active:'{"schemaVersion":2,"id":"offline-boundary"}',
      legacy:"[]",
      preferences:'{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
    };
    await page.evaluate(({storageKeys,values})=>{
      localStorage.setItem(storageKeys.active,values.active);
      localStorage.setItem(storageKeys.legacy,values.legacy);
      localStorage.setItem(storageKeys.preferences,values.preferences);
    },{storageKeys:keys,values:fixture});
    assert.deepEqual(await storage(page),fixture);

    await page.emulateMedia({reducedMotion:"reduce"});
    await context.setOffline(true);
    await page.reload({waitUntil:"domcontentloaded"});
    await waitApp(page);

    diagnostics=await page.evaluate(()=>window.getOfflineAppDiagnostics());
    assert.equal(diagnostics.connectivity,"offline");
    assert.equal(diagnostics.offlineReady,true);
    assert.equal(await page.locator("#menuMusicToggle").isDisabled(),true);
    assert.match(await page.locator("#menuMusicStatus").innerText(),/OFFLINE.*YOUTUBE/i);
    assert.deepEqual(await storage(page),fixture);
    assert.equal(await page.locator("#offlineAppRail,#offlineAppPanel,#offlineInstallAction").count(),0);

    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
    const panel=page.locator("#settingsOverlay .settingsOfflinePanel");
    await panel.waitFor({state:"visible"});
    assert.equal(await panel.locator(".settingsOfflineInstallButton").count(),1);
    assert.equal(
      await page.locator(".settingsOfflineInstallButton").evaluateAll(nodes=>nodes.every(node=>Boolean(node.closest("#settingsOverlay")))),
      true
    );
    assert.match(await panel.innerText(),/OFFLINE APP/i);
    assert.match(await panel.innerText(),/OFFLINE SHELL/i);
    assert.match(await panel.innerText(),/CONNECTIVITY/i);
    await page.locator("#settingsClose").click();
    await page.locator("#settingsOverlay").waitFor({state:"hidden"});
    pass("offline mode preserves canonical raw bytes and keeps install control inside Settings");

    await page.locator("#newShowdown").click();
    const identityGate=page.locator("#onlinePlayerIdentityOverlay");
    await identityGate.waitFor({state:"visible",timeout:15000});
    assert.equal(await page.locator("#mainMenu").isVisible(),true,"Offline gameplay denial must leave the user on Home.");
    assert.equal(await page.locator("#createShowdown").isHidden(),true,"Offline normal Showdown setup must remain closed.");
    assert.equal(await page.locator("#onlinePlayerIdentityTitle").textContent(),"CONNECTION REQUIRED");
    assert.match(await identityGate.innerText(),/Career Mode Showdown is online-only/i);
    assert.equal((await page.evaluate(()=>window.getOfflineUpdateBoundaryStatus())).safe,true);
    assert.deepEqual(await storage(page),fixture,"Denied offline gameplay entry must not mutate storage.");
    await identityGate.locator('[aria-label="Close online sign-in"]').click();
    await identityGate.waitFor({state:"hidden"});
    pass("offline normal gameplay stays closed behind a clear connection gate");

    await page.locator("#legacyButton").click();
    await page.locator("#legacy").waitFor({state:"visible",timeout:20000});
    assert.deepEqual(await page.evaluate(()=>({
      backup:typeof window.createCareerModeBackupEnvelope,
      analyze:typeof window.analyzeCareerModeBackupFile,
      plan:typeof window.createCareerModeRestorePlan,
      apply:typeof window.applyCareerModeRestore,
      transaction:typeof window.runCareerModeRawStorageTransaction
    })),{
      backup:"function",
      analyze:"function",
      plan:"function",
      apply:"function",
      transaction:"function"
    });
    assert.deepEqual(await storage(page),fixture);

    await context.setOffline(false);
    await page.reload({waitUntil:"domcontentloaded"});
    await waitApp(page);
    await page.waitForFunction(()=>{
      const identity=window.CareerModeOnlinePlayerIdentity?.getState?.();
      return Boolean(identity&&identity.online===true&&identity.status!=="offline");
    },null,{timeout:15000});
    assert.deepEqual(await storage(page),fixture);

    await page.locator("#newShowdown").click();
    await identityGate.waitFor({state:"visible",timeout:15000});
    assert.notEqual(await page.locator("#onlinePlayerIdentityTitle").textContent(),"CONNECTION REQUIRED");
    assert.equal(await page.locator("#createShowdown").isHidden(),true,"Reconnect must return through online identity before gameplay.");
    assert.deepEqual(await storage(page),fixture,"Reconnect identity routing must remain non-mutating.");
    assert.deepEqual(errors,[]);
    pass("recovery tools remain available offline and reconnect returns to online identity without storage mutation");
    console.log("Offline public-boundary audit passed.");
  }finally{
    await context.close();
    await browser.close();
  }
}

run().catch(error=>{
  console.error(error?.stack||error);
  process.exitCode=1;
});
