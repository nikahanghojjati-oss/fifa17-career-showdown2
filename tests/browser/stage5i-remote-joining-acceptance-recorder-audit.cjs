const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const capability="session_dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
const rawAccount="stage5i-secret-account";
const rawDevice="stage5i-secret-device";
const rawRivalry="stage5i-secret-rivalry";
const canonicalKeys=["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"];

async function load(browser,acceptance){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  if(acceptance){
    await page.addInitScript(({capability,rawAccount,rawDevice,rawRivalry})=>{
      const listeners=new Set();
      let state={status:"idle",open:false,busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,pendingAction:null,capabilityCopyAllowed:false};
      window.CareerModeSparkRemoteJoining={
        billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
        getState(){return Object.freeze({...state});},
        subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
        openPanel(){state={...state,open:true};for(const listener of listeners)listener(Object.freeze({...state}));return true;}
      };
      window.__stage5iSetRemoteState=next=>{state={...state,...next};for(const listener of listeners)listener(Object.freeze({...state}));};
      window.__stage5iSecrets={capability,rawAccount,rawDevice,rawRivalry};
    },{capability,rawAccount,rawDevice,rawRivalry});
  }
  const url=new URL(baseUrl.href);if(acceptance)url.searchParams.set("rjr-acceptance","1");
  await page.goto(url.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  return {context,page,pageErrors};
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    const normal=await load(browser,false);
    try{
      await normal.page.waitForTimeout(550);
      assert.equal(await normal.page.locator("#remoteJoiningAcceptanceRecorder").count(),0,"normal production mode must not expose the acceptance recorder");
      assert.equal(await normal.page.evaluate(()=>Boolean(window.CareerModeRemoteJoiningAcceptance)),false,"normal production mode must not load acceptance code");
      const helperRequests=await normal.page.evaluate(()=>performance.getEntriesByType("resource").filter(entry=>entry.name.includes("remoteJoiningAcceptance.js")).map(entry=>entry.name));
      assert.deepEqual(helperRequests,[],"normal production mode must not request the acceptance recorder asset");
      assert.deepEqual(normal.pageErrors,[]);
      console.log("PASS Stage 5I recorder remains unloaded and invisible without the explicit acceptance query parameter");
    }finally{await normal.context.close();}

    const acceptance=await load(browser,true);
    try{
      await acceptance.page.locator("#remoteJoiningAcceptanceRecorder").waitFor({state:"visible",timeout:5000});
      const before=await acceptance.page.evaluate(keys=>keys.map(key=>[key,localStorage.getItem(key)]),canonicalKeys);
      const contract=await acceptance.page.evaluate(()=>({
        enabled:window.CareerModeRemoteJoiningAcceptance.enabled,
        pageMemoryOnly:window.CareerModeRemoteJoiningAcceptance.pageMemoryOnly,
        rawCapabilityExported:window.CareerModeRemoteJoiningAcceptance.rawCapabilityExported,
        rawAuthorityIdsExported:window.CareerModeRemoteJoiningAcceptance.rawAuthorityIdsExported,
        networkRequests:window.CareerModeRemoteJoiningAcceptance.networkRequests
      }));
      assert.deepEqual(contract,{enabled:true,pageMemoryOnly:true,rawCapabilityExported:false,rawAuthorityIdsExported:false,networkRequests:false});
      const recorderResource=await acceptance.page.evaluate(()=>performance.getEntriesByType("resource").find(entry=>entry.name.includes("remoteJoiningAcceptance.js"))?.name||"");
      assert.match(recorderResource,/remoteJoiningAcceptance\.js\?v=1\.9\.1-r2$/,"acceptance recorder must load through the exact release-owned r2 loader");

      await acceptance.page.evaluate(async()=>{
        const api=window.CareerModeRemoteJoiningAcceptance;
        api.setLabels("Chromebook host","Home Wi-Fi");
        await api.openRemoteJoining();
        const secrets=window.__stage5iSecrets;
        window.__stage5iSetRemoteState({status:"ready",busy:false,sessionId:secrets.capability,rivalryId:secrets.rawRivalry,accountId:secrets.rawAccount,deviceId:secrets.rawDevice,role:"host",sessionState:"open",revision:0,pendingAction:null,capabilityCopyAllowed:true});
        await api.recordCheckpoint();
      });

      await acceptance.context.setOffline(true);
      await acceptance.page.waitForFunction(()=>navigator.onLine===false,{timeout:5000});
      await acceptance.page.waitForTimeout(50);
      await acceptance.context.setOffline(false);
      await acceptance.page.waitForFunction(()=>navigator.onLine===true,{timeout:5000});
      await acceptance.page.waitForTimeout(50);

      await acceptance.page.evaluate(()=>{
        const secrets=window.__stage5iSecrets;
        window.__stage5iSetRemoteState({status:"ready",sessionId:secrets.capability,rivalryId:secrets.rawRivalry,accountId:secrets.rawAccount,deviceId:secrets.rawDevice,role:"host",sessionState:"active",revision:1,pendingAction:null,capabilityCopyAllowed:true});
      });
      const evidence=await acceptance.page.evaluate(()=>window.CareerModeRemoteJoiningAcceptance.getEvidence());
      const serialized=JSON.stringify(evidence);
      assert.equal(evidence.schema,"career-mode-showdown.remote-joining-physical-acceptance.v1");
      assert.equal(evidence.acceptanceMode,true);
      assert.equal(evidence.recorderStorage,"page-memory-only");
      assert.equal(evidence.recorderNetworkRequests,false);
      assert.equal(evidence.rawCapabilityIncluded,false);
      assert.equal(evidence.rawAccountIdIncluded,false);
      assert.equal(evidence.rawDeviceIdIncluded,false);
      assert.equal(evidence.rawRivalryIdIncluded,false);
      assert.equal(evidence.runtimeRevision,"1.9.1-r2");
      assert.equal(evidence.deviceLabel,"Chromebook host");
      assert.equal(evidence.networkLabel,"Home Wi-Fi");
      assert.ok(evidence.records.length>=6,"acceptance recorder should capture startup, labels, remote state, network transitions and export checkpoint");
      assert.ok(evidence.records.some(record=>record.type==="browser-offline"&&record.online===false),"real browser offline event must be recorded");
      assert.ok(evidence.records.some(record=>record.type==="browser-online"&&record.online===true),"real browser online event must be recorded");
      assert.ok(evidence.records.some(record=>record.sessionState==="active"&&record.revision===1),"active revision 1 checkpoint must be represented");
      const fingerprints=evidence.records.map(record=>record.capabilityFingerprint).filter(Boolean);
      assert.ok(fingerprints.length>=2,"session-bearing checkpoints must include a one-way capability fingerprint");
      fingerprints.forEach(value=>assert.match(value,/^[a-f0-9]{64}$/));
      assert.equal(new Set(fingerprints).size,1,"one physical acceptance session must keep one stable fingerprint");
      for(const secret of [capability,rawAccount,rawDevice,rawRivalry])assert.equal(serialized.includes(secret),false,`acceptance evidence leaked raw secret: ${secret}`);
      for(const record of evidence.records){
        assert.equal(Object.prototype.hasOwnProperty.call(record,"sessionId"),false);
        assert.equal(Object.prototype.hasOwnProperty.call(record,"accountId"),false);
        assert.equal(Object.prototype.hasOwnProperty.call(record,"deviceId"),false);
        assert.equal(Object.prototype.hasOwnProperty.call(record,"rivalryId"),false);
      }
      const after=await acceptance.page.evaluate(keys=>keys.map(key=>[key,localStorage.getItem(key)]),canonicalKeys);
      assert.deepEqual(after,before,"acceptance recorder must not mutate canonical local save storage");
      assert.deepEqual(acceptance.pageErrors,[]);
      console.log("PASS Stage 5I recorder captures real offline/online lifecycle while exporting only a one-way capability fingerprint");
      console.log("PASS Stage 5I evidence excludes raw capability/account/device/rivalry identifiers and preserves canonical local storage");
    }finally{await acceptance.context.close();}
  }finally{if(browser.isConnected())await browser.close();}
})().catch(error=>{console.error("STAGE 5I REMOTE JOINING ACCEPTANCE RECORDER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
