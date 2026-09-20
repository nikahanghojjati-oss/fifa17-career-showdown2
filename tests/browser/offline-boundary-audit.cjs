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
    await panel.waitFor({state:"attached",timeout:15000});
    assert.equal(await panel.getAttribute("data-product-surface"),"internal","Offline/install capability must remain classified as internal recovery architecture.");
    assert.equal(await panel.isHidden(),true,"Offline/install controls must not reappear in normal player-facing Settings.");
    assert.equal(await panel.locator(".settingsOfflineInstallButton").count(),1,"Internal install capability must remain available to the recovery architecture.");
    assert.equal(
      await page.locator(".settingsOfflineInstallButton").evaluateAll(nodes=>nodes.every(node=>Boolean(node.closest("#settingsOverlay")))),
      true,
      "Internal install controls must remain owned by Settings rather than becoming global UI."
    );
    const internalText=await panel.textContent();
    assert.match(internalText||"",/OFFLINE APP/i);
    assert.match(internalText||"",/OFFLINE SHELL/i);
    assert.match(internalText||"",/CONNECTIVITY/i);
    await page.locator("#settingsClose").click();
    await page.locator("#settingsOverlay").waitFor({state:"hidden"});
    pass("offline mode preserves canonical raw bytes while install/offline capability stays internal");

    await page.locator("#newShowdown").click();
    const identityGate=page.locator("#onlinePlayerIdentityOverlay");
    await identityGate.waitFor({state:"visible",timeout:15000});
    assert.equal(await page.locator("#mainMenu").isVisible(),true,"Offline gameplay denial must leave the user on Home.");
    assert.equal(await page.locator("#createShowdown").isHidden(),true,"Offline normal Showdown setup must remain closed.");
    assert.equal(await page.locator("#onlinePlayerIdentityTitle").textContent(),"CONNECTION REQUIRED");
    assert.match(await identityGate.innerText(),/Connection required|Reconnect to continue/i,"Offline player copy must explain the connection requirement without exposing implementation-mode terminology.");
    assert.doesNotMatch(await identityGate.innerText(),/online-only|local-only|Shared Showdown|Private Remote Joining/i,"Offline denial must not expose retired architecture labels.");
    assert.equal((await page.evaluate(()=>window.getOfflineUpdateBoundaryStatus())).safe,true);
    assert.deepEqual(await storage(page),fixture,"Denied offline gameplay entry must not mutate storage.");
    await identityGate.locator('[aria-label="Close sign-in"]').click();
    await identityGate.waitFor({state:"hidden"});
    pass("offline normal gameplay stays closed behind a clear connection gate");

    await page.locator("#legacyButton").evaluate(button=>button.dataset.testSurface="internal-audit");
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
    const reconnectedIdentity=await page.evaluate(async()=>{
      await window.loadRuntimeScript("online-player-identity","js/onlinePlayerIdentity.js",()=>Boolean(window.CareerModeOnlinePlayerIdentity));
      const current=window.CareerModeOnlinePlayerIdentity.getState();
      return current.online===true&&current.status!=="offline"
        ? current
        : window.CareerModeOnlinePlayerIdentity.initialize(true);
    });
    assert.equal(reconnectedIdentity.online,true);
    assert.notEqual(reconnectedIdentity.status,"offline");
    assert.deepEqual(await storage(page),fixture);

    await page.locator("#newShowdown").click();
    await identityGate.waitFor({state:"visible",timeout:15000});
    assert.notEqual(await page.locator("#onlinePlayerIdentityTitle").textContent(),"CONNECTION REQUIRED");
    assert.equal(await page.locator("#createShowdown").isHidden(),true,"Reconnect must return through online identity before gameplay.");
    assert.deepEqual(await storage(page),fixture,"Reconnect identity routing must remain non-mutating.");
    assert.deepEqual(errors,[]);
    pass("recovery tools remain available offline and reconnect returns to online identity without storage mutation");
    console.log("Offline public-boundary audit passed with internal recovery capability containment.");
  }finally{
    await context.close();
    await browser.close();
  }
}

run().catch(error=>{
  console.error(error?.stack||error);
  process.exitCode=1;
});
