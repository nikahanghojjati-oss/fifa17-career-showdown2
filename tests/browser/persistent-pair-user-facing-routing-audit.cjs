const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const rivalryId=`pair_${"c".repeat(64)}`;
const saveId=`save_${"a".repeat(24)}`;
const profileId=`profile_${"b".repeat(24)}`;
const playerOneProfileId=`profile_${"d".repeat(24)}`;

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  const pageErrors=[],consoleErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  page.on("console",message=>{if(message.type()==="error"&&!/^Failed to load resource/.test(message.text()))consoleErrors.push(message.text());});
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.waitForFunction(()=>typeof window.loadRuntimeScript==="function"&&window.CareerModeProductionSharedJourneyEntry,null,{timeout:12000});

    await page.evaluate(({rivalryId,saveId,profileId,playerOneProfileId})=>{
      const accountId="account_user_route_fixture",deviceId="device_user_route_fixture";
      window.__pairProviderMode="unpaired";
      window.__localRecoveryReady=true;
      window.__continueOpened=0;
      window.__recoveryOpened=0;
      const envelope=(objectType,objectId,data)=>({schemaVersion:1,objectType,objectId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:"sha256:fixture",priorContentHash:null,updatedAt:{},updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null});
      const pairEnvelope=()=>envelope("pairLink","current",{rivalryId,managerRole:"playerTwo",managerId:"nik",linkedAt:{},lastConfirmedAt:{}});
      const rivalryEnvelope=()=>envelope("rivalry",rivalryId,{connectionState:"active",managerSlots:[{slotId:"playerOne",accountId:"account_daniel_fixture",saveId,profileId:playerOneProfileId},{slotId:"playerTwo",accountId,saveId,profileId}]});
      const snapshot=value=>({exists:()=>value!==null,data:()=>value});
      const firestoreSdk={
        doc:(_firestore,...parts)=>parts.join("/"),
        Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
        runTransaction:async(_firestore,fn)=>fn({
          get:async ref=>{
            if(window.__pairProviderMode==="active-recovery"){
              if(String(ref).endsWith("pairLinks/current"))return snapshot(pairEnvelope());
              if(String(ref)===`rivalries/${rivalryId}`)return snapshot(rivalryEnvelope());
            }
            return snapshot(null);
          },
          set:()=>{}
        })
      };
      const preparedShowdown=()=>({
        name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:5,currentRound:1,status:"Created",selectedLeague:null,
        clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],
        sharedJourney:{contractVersion:1,mode:"shared",setupPending:true},
        identity:{managerProfileIds:{playerOne:playerOneProfileId,playerTwo:profileId}}
      });
      window.CareerModeSaveLibraryRuntime={
        isReady:()=>true,
        getLibrarySnapshot:()=>window.__localRecoveryReady?{activeSaveId:saveId,saves:[{saveId,showdown:preparedShowdown()}]}:{activeSaveId:null,saves:[]},
        switchActiveSave:async()=>true
      };
      window.CareerModeOnlinePlayerIdentity={getState:()=>({status:"ready",accountId,managerId:"nik",managerLabel:"Nik",deviceId,registered:true})};
      window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk})};
      window.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId})};
      const binding={saveId,profileId,managerRole:"playerTwo"};
      window.CareerModeSparkPrivatePairing={
        initialize:async()=>true,
        getState:()=>({registered:true,deviceId}),
        localBindingOptions:()=>[binding],
        getOrCreateDeviceIdentity:async()=>({deviceId}),
        pairingJoinErrorMessage:error=>error?.message||"The code could not be joined.",
        createPairing:async()=>({ok:true,rivalryId,capability:rivalryId,durableWitness:{ok:true,rivalryId,managerRole:"playerTwo",managerId:"nik",managerLabel:"Nik",connectionState:"pending-pair",providerSaveId:saveId,providerProfileId:profileId,revision:0}}),
        redeemPairing:async()=>({ok:true,rivalryId,durableWitness:{ok:true,rivalryId,managerRole:"playerTwo",managerId:"nik",managerLabel:"Nik",connectionState:"active",providerSaveId:saveId,providerProfileId:profileId,revision:0}})
      };
      window.CareerModeSparkConnectedRivalry={
        initialize:async()=>true,
        getState:()=>({attached:false,rivalryId:null,binding:null}),
        attachRivalry:async()=>({ok:true})
      };
      window.CareerModeSparkRemoteJoining={getState:()=>({sessionState:null}),subscribe:()=>()=>{}};
      window.openOptionalModule=async key=>{
        if(key!=="legacy")return false;
        window.__recoveryOpened+=1;
        let panel=document.getElementById("careerModeRestorePanel");
        if(!panel){panel=document.createElement("section");panel.id="careerModeRestorePanel";const input=document.createElement("input");input.type="file";panel.append(input);document.body.append(panel);}return true;
      };
    },{rivalryId,saveId,profileId,playerOneProfileId});

    // Real entry overlay -> real routing -> real persistent-pair DOM.
    await page.evaluate(async()=>{await window.CareerModeProductionSharedJourneyEntry.openPanel();});
    const connect=page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"CONNECT PLAYERS"});
    await connect.waitFor({state:"visible",timeout:5000});
    assert.equal(await connect.isDisabled(),false,"CONNECT PLAYERS must be actionable before pairing.");
    await connect.click();
    await page.locator("#mainMenu").waitFor({state:"visible",timeout:5000});
    const panel=page.locator("#persistentNikDanielPairPanel");
    await panel.waitFor({state:"visible",timeout:5000});
    assert.equal(await panel.evaluate(node=>Boolean(node.closest("#mainMenu"))),true,"Connection controls must land on the visible Home shell.");
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CREATE CODE"}).waitFor({state:"visible"});
    await page.locator("#persistentNikDanielPairCode").waitFor({state:"visible"});
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"JOIN"}).waitFor({state:"visible"});
    assert.doesNotMatch((await panel.innerText()),/Save Library|Private Remote Joining|Shared Journey/i,"The player connection panel must not expose retired architecture concepts.");

    // CREATE CODE must transition the real panel into a complete waiting state with all recovery controls.
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CREATE CODE"}).click();
    await page.locator("#persistentNikDanielPairPanel",{hasText:"WAITING FOR THE OTHER PLAYER"}).waitFor({state:"visible",timeout:5000});
    assert.match(await panel.innerText(),new RegExp(rivalryId));
    for(const label of ["COPY CODE","CHECK STATUS","NEW CODE"])await page.locator("#persistentNikDanielPairPanel button",{hasText:label}).waitFor({state:"visible"});

    // Reinitialize provider-unpaired state and prove JOIN -> CAREER READY -> CONTINUE CAREER routing.
    await page.evaluate(async()=>{window.__pairProviderMode="unpaired";await window.CareerModePersistentNikDanielPair.initialize({force:true});});
    await page.locator("#persistentNikDanielPairCode").fill(rivalryId);
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"JOIN"}).click();
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});
    const continueButton=page.locator("#persistentNikDanielPairPanel button",{hasText:"CONTINUE CAREER"});
    await continueButton.waitFor({state:"visible"});
    await page.evaluate(()=>{window.CareerModeProductionSharedJourneyEntry={install(){},openPanel:async()=>{window.__continueOpened+=1;return true;}};});
    await continueButton.click();
    await page.waitForFunction(()=>window.__continueOpened===1,null,{timeout:3000});

    // Fresh-browser active-pair recovery must expose and route a real OPEN RECOVERY control.
    await page.evaluate(async()=>{window.__pairProviderMode="active-recovery";window.__localRecoveryReady=false;await window.CareerModePersistentNikDanielPair.initialize({force:true});});
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).waitFor({state:"visible",timeout:5000});
    const recovery=page.locator("#persistentNikDanielPairPanel button",{hasText:"OPEN RECOVERY"});
    await recovery.waitFor({state:"visible"});
    await recovery.click();
    await page.waitForFunction(()=>window.__recoveryOpened===1,null,{timeout:3000});
    await page.locator("#careerModeRestorePanel input[type=file]").waitFor({state:"attached",timeout:3000});
    assert.equal(await page.locator("#careerModeRestorePanel input[type=file]").evaluate(input=>document.activeElement===input),true,"Recovery routing must focus the verified restore input.");

    assert.deepEqual(pageErrors,[],"User-facing routing audit emitted page errors.");
    assert.deepEqual(consoleErrors,[],"User-facing routing audit emitted unexpected console errors.");
    process.stdout.write("PASS real user-facing routing: CONNECT PLAYERS reaches the real persistent-pair panel; CREATE CODE, JOIN, CONTINUE CAREER and OPEN RECOVERY are visible, actionable and route to their intended surfaces.\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
