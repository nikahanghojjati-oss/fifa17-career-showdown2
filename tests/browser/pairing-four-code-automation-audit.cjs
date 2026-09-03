const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const CAPABILITY_PATTERN=/^pair_[0-9a-f]{64}$/;
const SAVE_ID=`save_${"a".repeat(24)}`;
const P1_PROFILE=`profile_${"1".repeat(24)}`;
const P2_PROFILE=`profile_${"2".repeat(24)}`;
const P1_BINDING={saveId:SAVE_ID,profileId:P1_PROFILE,managerRole:"playerOne",displayLabel:"Nik"};
const P2_BINDING={saveId:SAVE_ID,profileId:P2_PROFILE,managerRole:"playerTwo",displayLabel:"Gop"};

async function boundedInitialize(page,apiName,timeoutMs=5000){
  return page.evaluate(async({apiName,timeoutMs})=>{
    const api=window[apiName];
    let timer=null;
    try{
      return await Promise.race([
        api.initialize().then(state=>({ok:true,state})),
        new Promise(resolve=>{timer=setTimeout(()=>resolve({ok:false,state:api.getState()}),timeoutMs);})
      ]);
    }finally{
      if(timer!==null)clearTimeout(timer);
    }
  },{apiName,timeoutMs});
}

async function preparePage(browser,accountId,iteration){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  await context.grantPermissions(["clipboard-read","clipboard-write"],{origin:baseUrl.origin});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.setContent('<div id="settingsOverlay" class="settingsOverlay"><div class="settingsDialog"><header class="settingsHeader"><div class="settingsHeading"><span class="settingsEyebrow">SAVE LIBRARY</span><h2>SETTINGS</h2></div></header><div id="settingsContent" class="settingsContent"></div><footer class="settingsFooter"></footer></div></div>');
  await page.addStyleTag({url:new URL("css/app.css",baseUrl).href});
  await page.addStyleTag({url:new URL("css/settings.css",baseUrl).href});
  await page.evaluate(({accountId,saveId,p1,p2,iteration})=>{
    delete window.CareerModeSparkPrivatePairing;
    delete window.CareerModeSparkConnectedRivalry;
    const docs=new Map();
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
    const accountState={connected:true,accountId};
    const services={ok:true,auth:{currentUser:{uid:accountId}},firestore:{name:`memory-${iteration}`},firestoreSdk};
    window.__fourCodeHarness={docs,firestoreSdk,services,accountState,iteration};
    window.CareerModeSparkConnectedAccount={getState:()=>accountState,subscribe:()=>()=>{}};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>services};
    window.CareerModeSaveLibraryRuntime={
      isReady:()=>true,
      getLibrarySnapshot:()=>({
        activeSaveId:saveId,
        saves:[{saveId,showdown:{identity:{managerProfileIds:{playerOne:p1,playerTwo:p2}}}}],
        profiles:[{profileId:p1,displayName:"Nik"},{profileId:p2,displayName:"Gop"}]
      })
    };
  },{accountId,saveId:SAVE_ID,p1:P1_PROFILE,p2:P2_PROFILE,iteration});
  await page.addScriptTag({url:new URL("js/sparkPrivatePairing.js",baseUrl).href});
  await page.addScriptTag({url:new URL("js/sparkConnectedRivalry.js",baseUrl).href});
  await page.evaluate(async()=>{
    await window.CareerModeSparkPrivatePairing.mountWhenSettingsReady();
    await window.CareerModeSparkConnectedRivalry.mountWhenSettingsReady();
  });
  await page.waitForFunction(()=>window.CareerModeSparkPrivatePairing.getState().registered===true,undefined,{timeout:5000});
  await page.waitForFunction(()=>window.CareerModeSparkConnectedRivalry.getState().initialized===true,undefined,{timeout:5000});
  return {context,page,pageErrors};
}

async function seedDurablePointer(page,binding,rivalryId,stamp){
  return page.evaluate(async({binding,rivalryId,stamp})=>{
    const connected=window.CareerModeSparkConnectedRivalry;
    const pairing=window.CareerModeSparkPrivatePairing;
    const h=window.__fourCodeHarness;
    if(!window.__connectedManualReattachCounterInstalled){
      window.__connectedManualReattachClicks=0;
      document.addEventListener("click",event=>{
        const button=event&&event.target&&typeof event.target.closest==="function"?event.target.closest("button"):null;
        if(button&&/VERIFY \/ REATTACH|VERIFY AUTO LINK|ATTACH CONNECTED RIVALRY/.test(button.textContent||""))window.__connectedManualReattachClicks+=1;
      },true);
      window.__connectedManualReattachCounterInstalled=true;
    }
    const pairingState=pairing.getState();
    const pointer={schemaVersion:1,accountId:h.accountState.accountId,rivalryId,saveId:binding.saveId,profileId:binding.profileId,managerRole:binding.managerRole,deviceId:pairingState.deviceId,attachedAtEpochMs:stamp};
    await connected.storePointer(pointer);
    const initialized=await connected.initialize();
    const loaded=await connected.loadPointer(h.accountState.accountId,binding);
    return {initialized,loaded};
  },{binding,rivalryId,stamp});
}

async function canonicalSnapshot(page){
  return page.evaluate(()=>Object.fromEntries([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ].map(key=>[key,localStorage.getItem(key)])));
}

async function provePlayerOne(browser,iteration){
  const accountA=`acct_browser_p1_${iteration}`;
  const accountB=`acct_browser_p2_${iteration}`;
  const {context,page,pageErrors}=await preparePage(browser,accountA,iteration);
  try{
    const selector=page.getByLabel("Local manager identity for private pairing");
    await selector.selectOption({label:"Player One · Nik"});
    const canonicalBefore=await canonicalSnapshot(page);
    const staleCapability=`pair_${"f".repeat(64)}`;
    const seeded=await seedDurablePointer(page,P1_BINDING,staleCapability,1700300000000+iteration);
    assert.equal(seeded.initialized.attached,true,`iteration ${iteration}: stale Player One pointer was not restored for setup`);
    assert.equal(seeded.initialized.rivalryId,staleCapability,`iteration ${iteration}: stale Player One pointer setup drifted`);
    assert.equal(seeded.loaded.rivalryId,staleCapability,`iteration ${iteration}: stale Player One pointer was not durable`);
    await page.getByRole("button",{name:"CREATE PAIRING CODE"}).click();
    await page.waitForTimeout(500);
    const createState=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState());
    assert.equal(createState.status,"pair-open",`iteration ${iteration}: Player One create did not reach pair-open: ${JSON.stringify(createState)}`);
    const generated=createState.capability;
    assert.match(generated,CAPABILITY_PATTERN,`iteration ${iteration}: Player One generated malformed capability`);
    assert.notEqual(generated,staleCapability,`iteration ${iteration}: fresh pairing unexpectedly matched stale pointer`);

    const pendingCandidate=await boundedInitialize(page,"CareerModeSparkConnectedRivalry");
    assert.equal(pendingCandidate.ok,true,`iteration ${iteration}: pending candidate reinitialize timed out`);
    assert.equal(pendingCandidate.state.rivalryId,staleCapability,`iteration ${iteration}: pending B displaced durable A`);
    const durableAfterPending=await page.evaluate(async binding=>window.CareerModeSparkConnectedRivalry.loadPointer(window.__fourCodeHarness.accountState.accountId,binding),P1_BINDING);
    assert.equal(durableAfterPending.rivalryId,staleCapability,`iteration ${iteration}: pending B overwrote durable A`);

    await page.evaluate(capability=>{
      const h=window.__fourCodeHarness;
      const path=`rivalries/${capability}`;
      h.__candidateOriginal=h.docs.get(path);
      const original=h.__candidateOriginal;
      h.docs.set(path,{...original,data:{...(original&&original.data||{}),connectionState:"active",authorizedAccountIds:["acct_foreign_a","acct_foreign_b"]}});
    },generated);
    const mismatchedCandidate=await boundedInitialize(page,"CareerModeSparkConnectedRivalry");
    assert.equal(mismatchedCandidate.ok,true,`iteration ${iteration}: mismatched candidate reinitialize timed out`);
    assert.equal(mismatchedCandidate.state.rivalryId,staleCapability,`iteration ${iteration}: mismatched B displaced durable A`);
    await page.evaluate(capability=>{const h=window.__fourCodeHarness;h.docs.set(`rivalries/${capability}`,h.__candidateOriginal);delete h.__candidateOriginal;},generated);

    await page.evaluate(capability=>{
      const h=window.__fourCodeHarness;
      const path=`rivalries/${capability}`;
      h.__candidateOriginal=h.docs.get(path);
      const original=h.__candidateOriginal;
      h.docs.set(path,{...original,data:{...(original&&original.data||{}),connectionState:"expired"}});
    },generated);
    const expiredCandidate=await boundedInitialize(page,"CareerModeSparkConnectedRivalry");
    assert.equal(expiredCandidate.ok,true,`iteration ${iteration}: expired candidate reinitialize timed out`);
    assert.equal(expiredCandidate.state.rivalryId,staleCapability,`iteration ${iteration}: expired B displaced durable A`);
    await page.evaluate(capability=>{const h=window.__fourCodeHarness;h.docs.set(`rivalries/${capability}`,h.__candidateOriginal);delete h.__candidateOriginal;},generated);

    const pairingReinit=await boundedInitialize(page,"CareerModeSparkPrivatePairing");
    assert.equal(pairingReinit.ok,true,`iteration ${iteration}: Player One private-pairing reinitialize timed out: ${JSON.stringify(pairingReinit.state)}`);
    assert.equal(pairingReinit.state.status,"pair-open",`iteration ${iteration}: late registration/reinitialize clobbered Player One pair-open state: ${JSON.stringify(pairingReinit.state)}`);
    assert.equal(pairingReinit.state.capability,generated,`iteration ${iteration}: late registration/reinitialize changed Player One capability`);

    const generatedDisplay=await page.locator("#sparkPrivatePairingPanel .settingsDataNote code").first().textContent();
    assert.equal(generatedDisplay,generated,`iteration ${iteration}: generated display differs from provider capability`);
    const copyButton=page.getByRole("button",{name:"COPY PAIRING CODE"});
    await copyButton.waitFor({state:"visible"});
    const capabilityBox=page.locator("#sparkPrivatePairingPanel .settingsDataNote").filter({hasText:"PRIVATE PAIRING CODE · COPY ONCE:"});
    assert.equal(await capabilityBox.count(),1,`iteration ${iteration}: generated capability label missing`);
    const boxY=(await capabilityBox.boundingBox()).y;
    const copyY=(await copyButton.boundingBox()).y;
    assert.ok(copyY>=boxY,`iteration ${iteration}: copy button is not rendered under the generated code`);
    await copyButton.scrollIntoViewIfNeeded();
    await copyButton.click({timeout:5000});
    const copied=await page.evaluate(()=>navigator.clipboard.readText());
    assert.equal(copied,generated,`iteration ${iteration}: copy button changed/truncated the capability`);

    await page.waitForFunction(expected=>window.CareerModeSparkConnectedRivalry.getState().prefillRivalryId===expected,generated,{timeout:5000});
    const p1Connected=await page.evaluate(()=>window.CareerModeSparkConnectedRivalry.getState().prefillRivalryId);
    assert.equal(p1Connected,generated,`iteration ${iteration}: Player One Connected Rivalry did not auto-prefill exact generated code`);

    const simulatedPlayerTwo=await page.evaluate(async({accountB,binding,iteration,capability})=>{
      const pairing=window.CareerModeSparkPrivatePairing;
      const h=window.__fourCodeHarness;
      const hex=((iteration+8)%16).toString(16);
      const identity={schemaVersion:1,installationId:`installation_${hex.repeat(32)}`,deviceId:`device_${hex.repeat(32)}`,createdAtEpochMs:1700000000000+iteration};
      const user={uid:accountB};
      const registration=await pairing.registerDevice({user,firestore:h.services.firestore,firebaseSdk:h.firestoreSdk,identity,cryptoImpl:window.crypto});
      if(!registration.ok)return registration;
      return pairing.redeemPairing({user,firestore:h.services.firestore,firebaseSdk:h.firestoreSdk,identity,binding,capability,cryptoImpl:window.crypto});
    },{accountB,binding:P2_BINDING,iteration,capability:generated});
    assert.equal(simulatedPlayerTwo.ok,true,`iteration ${iteration}: simulated Player Two provider join failed: ${JSON.stringify(simulatedPlayerTwo)}`);

    const rivalryReinit=await boundedInitialize(page,"CareerModeSparkConnectedRivalry");
    assert.equal(rivalryReinit.ok,true,`iteration ${iteration}: Player One Connected Rivalry reinitialize timed out after Player Two join: ${JSON.stringify(rivalryReinit.state)}`);
    await page.waitForFunction(expected=>{
      const state=window.CareerModeSparkConnectedRivalry.getState();
      return state.attached===true&&state.rivalryId===expected;
    },generated,{timeout:5000});
    const p1After=await page.evaluate(()=>window.CareerModeSparkConnectedRivalry.getState());
    assert.equal(p1After.rivalryId,generated,`iteration ${iteration}: Player One normal re-entry did not auto-attach exact rivalry`);
    assert.match(p1After.message,/attached automatically|saved on this browser/i,`iteration ${iteration}: Player One did not reach durable auto-attached state`);
    const p1DurableB=await page.evaluate(async binding=>window.CareerModeSparkConnectedRivalry.loadPointer(window.__fourCodeHarness.accountState.accountId,binding),P1_BINDING);
    assert.equal(p1DurableB.rivalryId,generated,`iteration ${iteration}: exact provider-active B was not persisted over stale A`);
    assert.deepEqual(await canonicalSnapshot(page),canonicalBefore,`iteration ${iteration}: Player One convergence mutated canonical localStorage`);
    assert.equal(await page.evaluate(()=>window.__connectedManualReattachClicks||0),0,`iteration ${iteration}: Player One required manual Verify/Reattach`);
    assert.deepEqual(pageErrors,[],`iteration ${iteration}: Player One automation emitted page errors`);
    return generated;
  }finally{await context.close();}
}

async function provePlayerTwo(browser,iteration){
  const accountA=`acct_browser_creator_${iteration}`;
  const accountB=`acct_browser_joiner_${iteration}`;
  const {context,page,pageErrors}=await preparePage(browser,accountB,100+iteration);
  try{
    const canonicalBefore=await canonicalSnapshot(page);
    const staleCapability=`pair_${"d".repeat(64)}`;
    const seeded=await seedDurablePointer(page,P2_BINDING,staleCapability,1700400000000+iteration);
    assert.equal(seeded.initialized.rivalryId,staleCapability,`iteration ${iteration}: stale Player Two pointer setup drifted`);
    const capability=`pair_${(iteration+1).toString(16).padStart(2,"0").repeat(32)}`;
    const opened=await page.evaluate(async({accountA,binding,iteration,capability})=>{
      const pairing=window.CareerModeSparkPrivatePairing;
      const h=window.__fourCodeHarness;
      const hex=((iteration+2)%16).toString(16);
      const identity={schemaVersion:1,installationId:`installation_${hex.repeat(32)}`,deviceId:`device_${hex.repeat(32)}`,createdAtEpochMs:1700100000000+iteration};
      const user={uid:accountA};
      const registration=await pairing.registerDevice({user,firestore:h.services.firestore,firebaseSdk:h.firestoreSdk,identity,cryptoImpl:window.crypto});
      if(!registration.ok)return registration;
      return pairing.createPairing({user,firestore:h.services.firestore,firebaseSdk:h.firestoreSdk,identity,binding,capability,cryptoImpl:window.crypto});
    },{accountA,binding:P1_BINDING,iteration,capability});
    assert.equal(opened.ok,true,`iteration ${iteration}: setup creator failed: ${JSON.stringify(opened)}`);
    assert.equal(opened.capability,capability);

    const selector=page.getByLabel("Local manager identity for private pairing");
    await selector.selectOption({label:"Player Two · Gop"});
    await page.evaluate(capability=>{
      const input=document.querySelector('input[aria-label="Private pairing code"]');
      window.__pairingPasteCount=0;
      input.addEventListener("paste",event=>{
        window.__pairingPasteCount+=1;
        event.preventDefault();
        input.value=event.clipboardData.getData("text/plain");
        input.dispatchEvent(new Event("input",{bubbles:true}));
      });
      const event=new Event("paste",{bubbles:true,cancelable:true});
      Object.defineProperty(event,"clipboardData",{value:{getData:type=>type==="text/plain"?capability:""}});
      input.dispatchEvent(event);
    },capability);
    assert.equal(await page.evaluate(()=>window.__pairingPasteCount),1,`iteration ${iteration}: Player Two performed more than one paste`);
    assert.equal(await page.getByLabel("Private pairing code").inputValue(),capability,`iteration ${iteration}: pasted join field changed the exact code`);

    await page.getByRole("button",{name:"JOIN PRIVATE PAIRING"}).click();
    await page.waitForFunction(()=>["paired","pair-error"].includes(window.CareerModeSparkPrivatePairing.getState().status),undefined,{timeout:5000});
    const joinState=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState());
    assert.equal(joinState.status,"paired",`iteration ${iteration}: Player Two join did not reach paired: ${JSON.stringify(joinState)}`);
    const joinInput=page.getByLabel("Private pairing code");
    assert.equal(await joinInput.inputValue(),capability,`iteration ${iteration}: successful join erased or transformed the one pasted code`);
    assert.equal(await joinInput.isEditable(),false,`iteration ${iteration}: successful join field must become readonly`);
    assert.equal(await page.getByRole("button",{name:"JOIN PRIVATE PAIRING"}).isDisabled(),true,`iteration ${iteration}: joined capability must not be submitted twice`);

    const pairingReinit=await boundedInitialize(page,"CareerModeSparkPrivatePairing");
    assert.equal(pairingReinit.ok,true,`iteration ${iteration}: Player Two private-pairing reinitialize timed out: ${JSON.stringify(pairingReinit.state)}`);
    assert.equal(pairingReinit.state.status,"paired",`iteration ${iteration}: late registration/reinitialize clobbered Player Two paired state: ${JSON.stringify(pairingReinit.state)}`);
    assert.equal(pairingReinit.state.capability,capability,`iteration ${iteration}: late registration/reinitialize changed Player Two exact code`);

    await page.waitForFunction(expected=>{
      const state=window.CareerModeSparkConnectedRivalry.getState();
      return state.attached===true&&state.rivalryId===expected;
    },capability,{timeout:5000});
    const p2Connected=await page.evaluate(()=>window.CareerModeSparkConnectedRivalry.getState().rivalryId);
    assert.equal(p2Connected,capability,`iteration ${iteration}: Player Two Connected Rivalry differs from the one pasted code`);
    const p2DurableB=await page.evaluate(async binding=>window.CareerModeSparkConnectedRivalry.loadPointer(window.__fourCodeHarness.accountState.accountId,binding),P2_BINDING);
    assert.equal(p2DurableB.rivalryId,capability,`iteration ${iteration}: Player Two did not persist exact current B over stale A`);
    assert.deepEqual(await canonicalSnapshot(page),canonicalBefore,`iteration ${iteration}: Player Two convergence mutated canonical localStorage`);
    assert.equal(await page.evaluate(()=>window.__connectedManualReattachClicks||0),0,`iteration ${iteration}: Player Two required manual Verify/Reattach`);
    const pairedDisplay=await page.locator("#sparkPrivatePairingPanel .settingsDataNote code").first().textContent();
    assert.equal(pairedDisplay,capability,`iteration ${iteration}: Player Two paired display differs from the one pasted code`);
    assert.equal(await page.evaluate(()=>window.__pairingPasteCount),1,`iteration ${iteration}: automation introduced a hidden second paste`);
    assert.deepEqual(pageErrors,[],`iteration ${iteration}: Player Two automation emitted page errors`);
    return {capability,p2Connected};
  }finally{await context.close();}
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const iterations=3;
  for(let iteration=0;iteration<iterations;iteration+=1){
    for(const scenario of [provePlayerOne,provePlayerTwo]){
      const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
      try{await scenario(browser,iteration);}
      finally{await browser.close().catch(()=>{});}
    }
  }
  process.stdout.write(`PASS pairing automation Chromium ultra-audit: ${iterations} fresh Player One and ${iterations} fresh Player Two isolated Chromium processes, exact copy, late-registration state preservation, P1 prefill/postjoin auto-attach, one-paste retained P2 input, and exact Connected Rivalry equality\n`);
})().catch(error=>{console.error("PAIRING FOUR-CODE AUTOMATION BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
