const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const Career=require("../../js/sharedCareerStart.js");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const rivalryId="pair_"+("a".repeat(64));
const sessionId="session_"+("b".repeat(64));
const accountByRole={playerOne:"account_daniel",playerTwo:"account_nik"};
const deviceByRole={playerOne:"device_"+("1".repeat(32)),playerTwo:"device_"+("2".repeat(32))};
const setup={
  schemaVersion:1,
  runtimeRevision:"1.9.1-r7",
  rivalryId,
  revision:6,
  phase:"SHOWDOWN_CONFIRMED",
  coordinatorRole:"playerOne",
  leagueId:"bundesliga",
  clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"},
  totalSeasons:1,
  confirmedRoles:["playerOne","playerTwo"]
};

function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}

async function proveLateSparkSetupResolution(page){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.addScriptTag({url:new URL("js/sharedCareerStart.js",baseUrl).href});
  await page.evaluate(()=>{delete window.CareerModeSparkSharedShowdownSetup;});
  await page.addScriptTag({url:new URL("js/sparkSharedCareerStart.js",baseUrl).href});

  const result=await page.evaluate(async({setup,rivalryId,sessionId,accountId,deviceId})=>{
    const setupLedger={
      schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",
      operationIds:["setup_op_1","setup_op_2","setup_op_3","setup_op_4","setup_op_5","setup_op_6"],
      totalSeasons:setup.totalSeasons,confirmedRoles:["playerOne","playerTwo"]
    };
    const values=new Map();
    values.set(`accounts/${accountId}`,{objectType:"account",objectId:accountId,lifecycleState:"live",data:{status:"active"}});
    values.set(`accounts/${accountId}/devices/${deviceId}`,{objectType:"device",objectId:deviceId,lifecycleState:"live",data:{deviceId,state:"active"}});
    values.set(`rivalries/${rivalryId}`,{
      objectType:"rivalry",objectId:rivalryId,lifecycleState:"live",
      data:{connectionState:"active",authorizedAccountIds:["account_daniel","account_nik"],managerSlots:[
        {slotId:"playerOne",accountId:"account_daniel",entitlementState:"active"},
        {slotId:"playerTwo",accountId:"account_nik",entitlementState:"active"}
      ]}
    });
    values.set(`rivalries/${rivalryId}/sessions/${sessionId}`,{
      objectType:"session",objectId:sessionId,lifecycleState:"live",
      data:{rivalryId,state:"active",memberAccountIds:["account_daniel","account_nik"],expiresAt:{toMillis:()=>Date.now()+60000}}
    });
    values.set(`rivalries/${rivalryId}/sharedSetup/authoritative`,setupLedger);
    values.set(`rivalries/${rivalryId}/careerStart/authoritative`,null);

    window.CareerModeSparkSharedShowdownSetup={async read(){return {ok:true,state:setup};}};
    const sdk={
      doc(_db,...parts){return parts.join("/");},
      serverTimestamp(){return {server:true};},
      async runTransaction(_db,callback){
        const tx={
          async get(ref){const value=values.get(ref);return {exists:()=>value!=null,data:()=>value};},
          set(ref,value){values.set(ref,value);}
        };
        return callback(tx);
      }
    };
    return window.CareerModeSparkSharedCareerStart.read({
      user:{uid:accountId},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId,nowEpochMs:Date.now()
    });
  },{setup,rivalryId,sessionId,accountId:accountByRole.playerOne,deviceId:deviceByRole.playerOne});

  assert.equal(result.ok,true,"Career Start provider must recover when Shared Setup provider appears after module evaluation.");
  assert.equal(result.managerRole,"playerOne");
  assert.deepEqual(result.assignment,{managerRole:"playerOne",club:"SC Freiburg",leagueId:"bundesliga",totalSeasons:1});
  assert.equal(result.state,null);
}

async function prepareCareerPage(page,role,shared){
  const errors=[];
  page.on("pageerror",error=>errors.push(error.stack||error.message));
  await page.exposeFunction("__careerReadBridge",async requestedRole=>{
    const state=clone(shared.state);
    return {
      ok:true,
      revision:state?.revision||0,
      state,
      setup:clone(setup),
      managerRole:requestedRole,
      assignment:Career.localAssignment(setup,requestedRole)
    };
  });
  await page.exposeFunction("__careerAckBridge",async(requestedRole,operationId,baseRevision)=>{
    try{
      const applied=Career.apply({state:shared.state,setup,actorRole:requestedRole,command:{type:"acknowledge-career-start",operationId,baseRevision}});
      shared.state=clone(applied.state);
      return {
        ok:true,status:"accepted",replayed:Boolean(applied.idempotent),revision:shared.state.revision,
        state:clone(shared.state),setup:clone(setup),managerRole:requestedRole,
        assignment:Career.localAssignment(setup,requestedRole)
      };
    }catch(error){
      return {ok:false,code:error.code||"CAREER_START_PROVIDER_FAILED"};
    }
  });

  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.evaluate(()=>document.getElementById("onlinePlayerIdentityOverlay")?.remove());
  await page.addScriptTag({url:new URL("js/sharedCareerStart.js",baseUrl).href});
  await page.evaluate(({role,setup,rivalryId,sessionId,accountId,deviceId})=>{
    window.__careerRole=role;
    window.__transferOpenCount=0;
    const setupState={
      ready:true,status:"ready",open:false,busy:false,
      rivalryId,sessionId,accountId,deviceId,managerRole:role,
      remoteRole:role==="playerOne"?"host":"peer",
      setup
    };
    window.CareerModeProductionSharedShowdownSetup={
      getState:()=>setupState,
      async refresh(){return {ok:true};}
    };
    window.CareerModeSharedShowdownSetup={feature:"test-shared-setup"};
    window.CareerModeSparkSharedShowdownSetup={async read(){return {ok:true,state:setup};}};
    window.CareerModeSparkSharedCareerStart={
      async read(){return window.__careerReadBridge(role);},
      async acknowledge(options){return window.__careerAckBridge(role,options.operationId,options.baseRevision);}
    };
    window.CareerModeProductionSharedTransferChallenge={
      install(){return true;},
      async open(){window.__transferOpenCount+=1;return true;}
    };
    window.CareerModeProductionFirebaseRuntime={
      async ensureAccountServices(){return {ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk:{}};}
    };
  },{role,setup,rivalryId,sessionId,accountId:accountByRole[role],deviceId:deviceByRole[role]});
  await page.addScriptTag({url:new URL("js/productionSharedCareerStart.js",baseUrl).href});
  await page.evaluate(()=>window.CareerModeProductionSharedCareerStart.install());
  await page.evaluate(()=>window.CareerModeProductionSharedCareerStart.openPanel());
  await page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:5000});
  return errors;
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const probeContext=await browser.newContext({viewport:{width:1000,height:760},serviceWorkers:"block"});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:"block"});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:"block"});
  const probe=await probeContext.newPage(),host=await hostContext.newPage(),peer=await peerContext.newPage();
  const shared={state:null};
  try{
    await proveLateSparkSetupResolution(probe);

    const hostErrors=await prepareCareerPage(host,"playerOne",shared);
    const peerErrors=await prepareCareerPage(peer,"playerTwo",shared);

    assert.match(await host.locator("#productionSharedCareerStartOverlay").innerText(),/Daniel · SC Freiburg/i);
    assert.match(await peer.locator("#productionSharedCareerStartOverlay").innerText(),/Nik · Hertha BSC/i);

    const hostStart=host.getByRole("button",{name:"I STARTED AT SC FREIBURG"});
    await hostStart.click();
    await host.getByRole("button",{name:"MY CAREER STARTED ✓"}).waitFor({state:"visible",timeout:5000});
    assert.equal(shared.state.revision,1);
    assert.deepEqual(shared.state.acknowledgedRoles,["playerOne"]);

    const peerStart=peer.getByRole("button",{name:"I STARTED AT HERTHA BSC"});
    await peerStart.click();
    await peer.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE"}).waitFor({state:"visible",timeout:5000});
    assert.equal(shared.state.revision,2);
    assert.equal(shared.state.phase,"CAREER_START_READY");
    assert.deepEqual(shared.state.acknowledgedRoles,["playerOne","playerTwo"]);

    await host.getByRole("button",{name:"REFRESH"}).click();
    await host.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE"}).waitFor({state:"visible",timeout:5000});

    await Promise.all([
      host.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE"}).click(),
      peer.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE"}).click()
    ]);
    await host.waitForFunction(()=>window.__transferOpenCount===1,null,{timeout:3000});
    await peer.waitForFunction(()=>window.__transferOpenCount===1,null,{timeout:3000});

    assert.equal(await host.evaluate(()=>window.CareerModeProductionSharedCareerStart.getState().state.phase),"CAREER_START_READY");
    assert.equal(await peer.evaluate(()=>window.CareerModeProductionSharedCareerStart.getState().state.phase),"CAREER_START_READY");
    assert.deepEqual(hostErrors,[],"Desktop Career Start emitted page errors.");
    assert.deepEqual(peerErrors,[],"Mobile Career Start emitted page errors.");

    process.stdout.write("PASS r33 Career Start gameplay seam: the real Spark Career Start provider resolves a Shared Setup provider loaded after it, Daniel desktop and Nik mobile each acknowledge the same confirmed Showdown exactly once, both converge on CAREER_START_READY, and the real Career Start UI hands each device into Transfer Challenge without reset or redraw.\n");
  }finally{
    await probeContext.close().catch(()=>{});
    await hostContext.close().catch(()=>{});
    await peerContext.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error("R33 CAREER START GAMEPLAY SEAM AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
