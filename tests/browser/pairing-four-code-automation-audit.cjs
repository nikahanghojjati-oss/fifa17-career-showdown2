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

async function preparePage(browser,accountId,iteration){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  await context.grantPermissions(["clipboard-read","clipboard-write"],{origin:baseUrl.origin});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.setContent('<div id="settingsOverlay"><div id="settingsContent"></div></div>');
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
  await page.waitForFunction(()=>window.CareerModeSparkPrivatePairing.getState().registered===true);
  return {context,page,pageErrors};
}

async function provePlayerOne(browser,iteration){
  const accountA=`acct_browser_p1_${iteration}`;
  const accountB=`acct_browser_p2_${iteration}`;
  const {context,page,pageErrors}=await preparePage(browser,accountA,iteration);
  try{
    const selector=page.getByLabel("Local manager identity for private pairing");
    await selector.selectOption({label:"Player One · Nik"});
    await page.getByRole("button",{name:"CREATE PAIRING CODE"}).click();
    await page.waitForTimeout(500);
    const createState=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState());
    assert.equal(createState.status,"pair-open",`iteration ${iteration}: Player One create did not reach pair-open: ${JSON.stringify(createState)}`);
    const generated=createState.capability;
    assert.match(generated,CAPABILITY_PATTERN,`iteration ${iteration}: Player One generated malformed capability`);

    const generatedDisplay=await page.locator("#sparkPrivatePairingPanel .settingsDataNote code").first().textContent();
    assert.equal(generatedDisplay,generated,`iteration ${iteration}: generated display differs from provider capability`);
    const copyButton=page.getByRole("button",{name:"COPY PAIRING CODE"});
    await copyButton.waitFor({state:"visible"});
    const capabilityBox=page.locator("#sparkPrivatePairingPanel .settingsDataNote").filter({hasText:"PRIVATE PAIRING CODE · COPY ONCE:"});
    assert.equal(await capabilityBox.count(),1,`iteration ${iteration}: generated capability label missing`);
    const boxY=(await capabilityBox.boundingBox()).y;
    const copyY=(await copyButton.boundingBox()).y;
    assert.ok(copyY>=boxY,`iteration ${iteration}: copy button is not rendered under the generated code`);
    await copyButton.click();
    const copied=await page.evaluate(()=>navigator.clipboard.readText());
    assert.equal(copied,generated,`iteration ${iteration}: copy button changed/truncated the capability`);

    await page.waitForFunction(expected=>window.CareerModeSparkConnectedRivalry.getState().prefillRivalryId===expected,generated);
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

    await page.evaluate(()=>window.CareerModeSparkConnectedRivalry.initialize());
    await page.waitForFunction(expected=>{
      const state=window.CareerModeSparkConnectedRivalry.getState();
      return state.attached===true&&state.rivalryId===expected;
    },generated);
    const p1After=await page.evaluate(()=>window.CareerModeSparkConnectedRivalry.getState());
    assert.equal(p1After.rivalryId,generated,`iteration ${iteration}: Player One normal re-entry did not auto-attach exact rivalry`);
    assert.match(p1After.message,/attached automatically|saved on this browser/i,`iteration ${iteration}: Player One did not reach durable auto-attached state`);
    assert.deepEqual(pageErrors,[],`iteration ${iteration}: Player One automation emitted page errors`);
    return generated;
  }finally{await context.close();}
}

async function provePlayerTwo(browser,iteration){
  const accountA=`acct_browser_creator_${iteration}`;
  const accountB=`acct_browser_joiner_${iteration}`;
  const {context,page,pageErrors}=await preparePage(browser,accountB,100+iteration);
  try{
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
    await page.waitForFunction(()=>["paired","pair-error"].includes(window.CareerModeSparkPrivatePairing.getState().status));
    const joinState=await page.evaluate(()=>window.CareerModeSparkPrivatePairing.getState());
    assert.equal(joinState.status,"paired",`iteration ${iteration}: Player Two join did not reach paired: ${JSON.stringify(joinState)}`);
    const joinInput=page.getByLabel("Private pairing code");
    assert.equal(await joinInput.inputValue(),capability,`iteration ${iteration}: successful join erased or transformed the one pasted code`);
    assert.equal(await joinInput.isEditable(),false,`iteration ${iteration}: successful join field must become readonly`);
    assert.equal(await page.getByRole("button",{name:"JOIN PRIVATE PAIRING"}).isDisabled(),true,`iteration ${iteration}: joined capability must not be submitted twice`);

    await page.waitForFunction(expected=>{
      const state=window.CareerModeSparkConnectedRivalry.getState();
      return state.attached===true&&state.rivalryId===expected;
    },capability);
    const p2Connected=await page.evaluate(()=>window.CareerModeSparkConnectedRivalry.getState().rivalryId);
    assert.equal(p2Connected,capability,`iteration ${iteration}: Player Two Connected Rivalry differs from the one pasted code`);
    const pairedDisplay=await page.locator("#sparkPrivatePairingPanel .settingsDataNote code").first().textContent();
    assert.equal(pairedDisplay,capability,`iteration ${iteration}: Player Two paired display differs from the one pasted code`);
    assert.equal(await page.evaluate(()=>window.__pairingPasteCount),1,`iteration ${iteration}: automation introduced a hidden second paste`);
    assert.deepEqual(pageErrors,[],`iteration ${iteration}: Player Two automation emitted page errors`);
    return {capability,p2Connected};
  }finally{await context.close();}
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    const iterations=3;
    for(let iteration=0;iteration<iterations;iteration+=1){
      await provePlayerOne(browser,iteration);
      await provePlayerTwo(browser,iteration);
    }
    process.stdout.write(`PASS pairing automation Chromium ultra-audit: ${iterations} fresh Player One and ${iterations} fresh Player Two browser contexts, exact copy, P1 prefill/postjoin auto-attach, one-paste retained P2 input, and exact Connected Rivalry equality\n`);
  }finally{await browser.close();}
})().catch(error=>{console.error("PAIRING FOUR-CODE AUTOMATION BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});