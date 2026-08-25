const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const canonicalKeys=new Set([
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);

async function proveContext(runtime,label,contextOptions){
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
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
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
}

async function proveBindingSelectionAndDeniedRedemption(runtime){
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.setContent('<div id="settingsOverlay"><div id="settingsContent"></div></div>');
    await page.evaluate(()=>{
      delete window.CareerModeSparkPrivatePairing;
      const docs=new Map();
      let denyTransactions=false;
      class FakeTimestamp{
        constructor(ms){this.ms=ms;}
        toMillis(){return this.ms;}
        static fromMillis(ms){return new FakeTimestamp(ms);}
      }
      const snapshot=value=>({exists:()=>value!==undefined,data:()=>value});
      const firestoreSdk={
        Timestamp:FakeTimestamp,
        doc(_firestore,...parts){return {path:parts.join("/")};},
        async runTransaction(_firestore,callback){
          if(denyTransactions){const error=new Error("Missing or insufficient permissions.");error.code="permission-denied";throw error;}
          const staged=new Map();
          const transaction={
            async get(reference){return snapshot(staged.has(reference.path)?staged.get(reference.path):docs.get(reference.path));},
            set(reference,value){staged.set(reference.path,value);}
          };
          const result=await callback(transaction);
          for(const [path,value] of staged)docs.set(path,value);
          return result;
        }
      };
      const accountState={connected:true,accountId:"acct_stage3_browser"};
      const services={ok:true,auth:{currentUser:{uid:accountState.accountId}},firestore:{name:"memory"},firestoreSdk};
      window.__pairingAuditHarness={deny(){denyTransactions=true;}};
      window.CareerModeSparkConnectedAccount={getState:()=>accountState,subscribe:()=>()=>{}};
      window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>services};
      const saveId=`save_${"a".repeat(24)}`;
      const playerOneProfileId=`profile_${"1".repeat(24)}`;
      const playerTwoProfileId=`profile_${"2".repeat(24)}`;
      window.CareerModeSaveLibraryRuntime={
        isReady:()=>true,
        getLibrarySnapshot:()=>({
          activeSaveId:saveId,
          saves:[{saveId,showdown:{identity:{managerProfileIds:{playerOne:playerOneProfileId,playerTwo:playerTwoProfileId}}}}],
          profiles:[{profileId:playerOneProfileId,displayName:"Nik"},{profileId:playerTwoProfileId,displayName:"Gop"}]
        })
      };
    });
    await page.addScriptTag({url:new URL("js/sparkPrivatePairing.js",baseUrl).href});
    await page.evaluate(()=>window.CareerModeSparkPrivatePairing.mountWhenSettingsReady());
    await page.waitForFunction(()=>window.CareerModeSparkPrivatePairing.getState().registered===true);

    const selector=page.getByLabel("Local manager identity for private pairing");
    await page.getByLabel("Private pairing code").fill(`pair_${"e".repeat(64)}`);
    await selector.selectOption({label:"Player Two · Gop"});
    assert.equal(await page.getByLabel("Private pairing code").inputValue(),`pair_${"e".repeat(64)}`,"manager selection rerendered and erased the pasted pairing code");
    const playerTwoKey=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState().selectedBindingKey);
    assert.match(playerTwoKey,/^playerTwo:profile_2{24}:save_a{24}$/);

    await page.getByRole("button",{name:"CREATE PAIRING CODE"}).click();
    await page.waitForFunction(()=>window.CareerModeSparkPrivatePairing.getState().status==="pair-open");
    assert.equal(await selector.locator("option:checked").textContent(),"Player Two · Gop","successful rerender reset the selected local manager identity");
    assert.equal(await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState().selectedBindingKey),playerTwoKey);

    await page.getByLabel("Private pairing code").fill(`pair_${"f".repeat(64)}`);
    await page.evaluate(()=>window.__pairingAuditHarness.deny());
    await page.getByRole("button",{name:"JOIN PRIVATE PAIRING"}).click();
    await page.waitForFunction(()=>window.CareerModeSparkPrivatePairing.getState().status==="pair-error");
    const deniedMessage=await page.locator("#sparkPrivatePairingPanel [role='status']").textContent();
    assert.match(deniedMessage,/expired, already used, or unavailable to this account/i);
    assert.match(deniedMessage,/create a new code on the other device/i);
    assert.doesNotMatch(deniedMessage,/missing or insufficient permissions/i);
    assert.equal(await selector.locator("option:checked").textContent(),"Player Two · Gop","denied redemption rerender reset the selected local manager identity");
    assert.equal(await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState().selectedBindingKey),playerTwoKey);
    assert.deepEqual(pageErrors,[],"pairing selector/error browser proof emitted page errors");
    process.stdout.write("PASS Stage 3 mobile selector persistence and safe denied-redemption guidance\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  await proveContext(runtime,"desktop",{viewport:{width:1365,height:768},locale:"en-US"});
  await proveContext(runtime,"mobile",{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  await proveBindingSelectionAndDeniedRedemption(runtime);
})().catch(error=>{
  console.error("STAGE 3 PRIVATE PAIRING BROWSER AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
