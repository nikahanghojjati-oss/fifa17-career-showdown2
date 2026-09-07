const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

(async()=>{
  const source=fs.readFileSync("js/productionSharedShowdownSetup.js","utf8");
  const accountId="test-account";
  const deviceId="device_"+"1".repeat(32);
  const rivalryId="pair_"+"2".repeat(64);
  const sessionId="session_"+"3".repeat(64);
  const html=`<!doctype html><html><head><meta name="app-asset-revision" content="1.9.1-r4"></head><body>
<script>
(()=>{
  const accountId=${JSON.stringify(accountId)},deviceId=${JSON.stringify(deviceId)},rivalryId=${JSON.stringify(rivalryId)},sessionId=${JSON.stringify(sessionId)};
  let providerState=null;
  window.captureCareerModeRawBackupInputs=()=>({saveLibrary:"A",legacyShowdowns:"B",preferences:"C"});
  window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk:{}})};
  window.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId})};
  window.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId})};
  window.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId,accountId,deviceId,binding:{managerRole:"playerOne"}})};
  window.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId,rivalryId,accountId,deviceId,role:"host",pendingAction:null,expiresAtEpochMs:Date.now()+600000})};
  window.CareerModeSharedShowdownSetup={};
  window.CareerModeSharedShowdownCatalog={};
  window.CareerModeSparkSharedShowdownSetup={
    read:async()=>providerState?{ok:true,status:"ready",revision:providerState.revision,state:providerState}:{ok:true,status:"empty",revision:0,state:null},
    mutate:async options=>{
      assertForBrowser=options.type;
      if(options.type!=="open")return {ok:false,code:"TEST_ONLY_OPEN"};
      providerState={schemaVersion:1,objectType:"sharedShowdownSetup",rivalryId,revision:1,phase:"SHARED_SETUP_OPEN",coordinatorRole:"playerOne",leagueId:null,clubs:null,clubLeagueIds:null,totalSeasons:null,confirmedRoles:[]};
      return {ok:true,revision:1,state:providerState};
    }
  };
})();
</script><script src="/setup.js"></script></body></html>`;
  const server=http.createServer((request,response)=>{
    if(request.url==="/setup.js"){response.setHeader("content-type","text/javascript");response.end(source);return;}
    response.setHeader("content-type","text/html");response.end(html);
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  let browser;
  try{
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
    const page=await browser.newPage();
    const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:"domcontentloaded"});
    const opened=await page.evaluate(()=>CareerModeProductionSharedShowdownSetup.openPanel());
    assert.equal(opened,true,"Shared Setup openPanel must resolve successfully for an already ACTIVE host session");
    assert.equal(await page.locator("#productionSharedSetupOverlay .remoteJoiningState").textContent(),"EMPTY · REV 0");
    assert.equal(await page.evaluate(()=>document.activeElement&&document.activeElement.classList.contains("remoteJoiningDismiss")),true,"Shared Setup must focus the dismiss button without calling an element as a function");
    await page.getByRole("button",{name:"OPEN SHARED SETUP"}).click();
    await page.waitForFunction(()=>CareerModeProductionSharedShowdownSetup.getState().revision===1);
    const state=await page.evaluate(()=>CareerModeProductionSharedShowdownSetup.getState());
    assert.equal(state.ready,true);
    assert.equal(state.phase,"SHARED_SETUP_OPEN");
    assert.equal(state.managerRole,"playerOne");
    assert.equal(state.remoteRole,"host");
    assert.deepEqual(pageErrors,[],"Shared Setup overlay must not emit the production focus crash");
    console.log("PASS production Shared Setup overlay opens from a paired ACTIVE host session, focuses safely, and advances EMPTY rev0 to SHARED_SETUP_OPEN rev1 without the focus-is-not-a-function crash.");
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
