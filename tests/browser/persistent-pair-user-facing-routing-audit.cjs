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
      window.__routeManagerId="nik";
      window.__identitySyncCalls=0;
      window.__identitySyncTransientFailures=0;
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
        identity:{saveId,managerProfileIds:{playerOne:playerOneProfileId,playerTwo:profileId}}
      });
      window.CareerModeSaveLibraryRuntime={
        isReady:()=>true,
        getLibrarySnapshot:()=>window.__localRecoveryReady?{activeSaveId:saveId,saves:[{saveId,showdown:preparedShowdown()}]}:{activeSaveId:null,saves:[]},
        switchActiveSave:async requested=>{if(requested!==saveId)throw new Error("Unexpected Save hydration target.");currentShowdown=preparedShowdown();return currentShowdown;}
      };
      window.CareerModeOnlinePlayerIdentity={
        getState:()=>({status:"ready",accountId,managerId:window.__routeManagerId,managerLabel:window.__routeManagerId==="nik"?"Nik":"Daniel",deviceId,registered:true}),
        syncPair:async()=>{
          window.__identitySyncCalls+=1;
          if(window.__identitySyncTransientFailures>0){window.__identitySyncTransientFailures-=1;return{status:"unavailable"};}
          return window.CareerModePersistentNikDanielPair.initialize({force:true,reconcileIdentity:async authoritativeManagerId=>{window.__routeManagerId=authoritativeManagerId;}});
        }
      };
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

    // CONNECT PLAYERS must share the identity sidecar's one bounded retry and stale-role reconciliation instead of callback-free pair initialization.
    await page.evaluate(async()=>{
      window.__pairProviderMode="active-recovery";
      window.__localRecoveryReady=true;
      window.__routeManagerId="daniel";
      window.__identitySyncCalls=0;
      window.__identitySyncTransientFailures=1;
      await window.CareerModeProductionSharedJourneyEntry.openPanel();
    });
    const reconnect=page.locator("#productionSharedJourneyEntryOverlay button",{hasText:"CONNECT PLAYERS"});
    await reconnect.waitFor({state:"visible",timeout:5000});
    await reconnect.click();
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});
    const connectReconciliation=await page.evaluate(()=>({managerId:window.__routeManagerId,syncCalls:window.__identitySyncCalls,status:window.CareerModePersistentNikDanielPair.getState().status,role:window.CareerModePersistentNikDanielPair.getState().managerRole}));
    assert.deepEqual(connectReconciliation,{managerId:"nik",syncCalls:2,status:"paired",role:"playerTwo"},"CONNECT PLAYERS must retry one transient sidecar failure, reconcile stale Daniel to provider-authoritative Nik, and reach paired state.");
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CONTINUE CAREER"}).waitFor({state:"visible",timeout:5000});
    assert.equal(await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).count(),0,"Successful stale-role reconciliation must not dead-end into recovery or unavailable controls.");
    await page.evaluate(async()=>{window.__pairProviderMode="unpaired";window.__routeManagerId="nik";window.__identitySyncTransientFailures=0;await window.CareerModePersistentNikDanielPair.initialize({force:true});});

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

    // A stale opposite role on another registered browser must be repaired from validated durable pair authority before mismatch rejection.
    const staleRoleRepair=await page.evaluate(async()=>{
      window.__pairProviderMode="active-recovery";window.__localRecoveryReady=true;
      const originalIdentity=window.CareerModeOnlinePlayerIdentity;let managerId="daniel";
      window.CareerModeOnlinePlayerIdentity={getState:()=>({status:"ready",accountId:"account_user_route_fixture",managerId,managerLabel:managerId==="nik"?"Nik":"Daniel",deviceId:"device_user_route_fixture",registered:true})};
      try{
        const next=await window.CareerModePersistentNikDanielPair.initialize({force:true,reconcileIdentity:async authoritativeManagerId=>{managerId=authoritativeManagerId;}});
        return{status:next.status,localManagerId:managerId,pairManagerId:next.managerId,role:next.managerRole};
      }finally{window.CareerModeOnlinePlayerIdentity=originalIdentity;}
    });
    assert.deepEqual(staleRoleRepair,{status:"paired",localManagerId:"nik",pairManagerId:"nik",role:"playerTwo"},"A stale Daniel role on Nik's registered browser must reconcile from durable pair authority before the mismatch guard runs.");

    // A remembered ACTIVE pair on a normal browser reload must activate lazy Save Library authority before classifying local recovery.
    const reloadAuthority=await page.evaluate(async({saveId,profileId,playerOneProfileId})=>{
      window.__pairProviderMode="active-recovery";
      const originalLoader=window.loadRuntimeScript,originalSaveRuntime=window.CareerModeSaveLibraryRuntime,originalEnsure=window.ensureSaveLibraryRuntimeAuthority,originalCurrentShowdown=currentShowdown;
      delete window.CareerModeSaveLibraryRuntime;
      delete window.ensureSaveLibraryRuntimeAuthority;
      let ready=false,activationCount=0,switchCount=0;
      const prepared=()=>({name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:5,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],sharedJourney:{contractVersion:1,mode:"shared",setupPending:false},identity:{saveId,managerProfileIds:{playerOne:playerOneProfileId,playerTwo:profileId}}});
      window.loadRuntimeScript=async(key,path,check)=>{
        if(key!=="save-library-cutover")return originalLoader(key,path,check);
        window.CareerModeSaveLibraryRuntime={isReady:()=>ready,getLibrarySnapshot:()=>ready?{activeSaveId:saveId,saves:[{saveId,showdown:prepared()}]}:null,switchActiveSave:async requested=>{if(requested!==saveId)throw new Error("Unexpected cold-reload hydration target.");switchCount+=1;currentShowdown=prepared();return currentShowdown;}};
        window.ensureSaveLibraryRuntimeAuthority=async()=>{activationCount+=1;ready=true;return true;};
        return true;
      };
      try{
        const next=await window.CareerModePersistentNikDanielPair.initialize({force:true});
        currentShowdown=null;
        const continueBefore=window.__continueOpened;
        const continued=await window.CareerModePersistentNikDanielPair.continuePair();
        const hydrated=currentShowdown;
        return{status:next.status,continuedStatus:continued.status,activationCount,switchCount,hydratedSaveId:hydrated?.identity?.saveId||null,hydratedMode:hydrated?.sharedJourney?.mode||null,hydratedSeasons:hydrated?.totalRounds||null,continueOpened:window.__continueOpened-continueBefore,recoveryReady:next.status==="paired"};
      }finally{
        currentShowdown=originalCurrentShowdown;
        window.loadRuntimeScript=originalLoader;
        window.CareerModeSaveLibraryRuntime=originalSaveRuntime;
        if(originalEnsure===undefined)delete window.ensureSaveLibraryRuntimeAuthority;else window.ensureSaveLibraryRuntimeAuthority=originalEnsure;
      }
    },{saveId,profileId,playerOneProfileId});
    assert.deepEqual(reloadAuthority,{status:"paired",continuedStatus:"paired",activationCount:1,switchCount:1,hydratedSaveId:saveId,hydratedMode:"shared",hydratedSeasons:5,continueOpened:1,recoveryReady:true},"A normal paired-browser reload must activate storage, hydrate the already-active canonical Save, and open Continue Career without false recovery.");
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CONTINUE CAREER"}).waitFor({state:"visible"});
    assert.equal(await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).count(),0,"A valid local paired reload must not show false recovery UI.");

    // If another tab invalidates Save Library after ACTIVE pair state is already rendered, the panel Continue action must reactivate authority before checking recovery.
    const panelAuthorityReactivation=await page.evaluate(async({saveId,profileId,playerOneProfileId})=>{
      window.__pairProviderMode="active-recovery";window.__localRecoveryReady=true;
      const originalLoader=window.loadRuntimeScript,originalSaveRuntime=window.CareerModeSaveLibraryRuntime,originalEnsure=window.ensureSaveLibraryRuntimeAuthority,originalCurrentShowdown=currentShowdown;
      let ready=true,activationCount=0,switchCount=0;
      const prepared=()=>({name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:5,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],sharedJourney:{contractVersion:1,mode:"shared",setupPending:false},identity:{saveId,managerProfileIds:{playerOne:playerOneProfileId,playerTwo:profileId}}});
      window.CareerModeSaveLibraryRuntime={isReady:()=>ready,getLibrarySnapshot:()=>ready?{activeSaveId:saveId,saves:[{saveId,showdown:prepared()}]}:null,switchActiveSave:async requested=>{if(requested!==saveId)throw new Error("Unexpected invalidated-authority hydration target.");switchCount+=1;currentShowdown=prepared();return currentShowdown;}};
      window.ensureSaveLibraryRuntimeAuthority=async()=>{activationCount+=1;ready=true;return true;};
      window.loadRuntimeScript=async(key,path,check)=>key==="save-library-cutover"?true:originalLoader(key,path,check);
      try{
        const initialized=await window.CareerModePersistentNikDanielPair.initialize({force:true});
        if(initialized.status!=="paired")throw new Error(`Expected paired state before invalidation, got ${initialized.status}`);
        ready=false;currentShowdown=null;
        const before=window.__continueOpened;
        const continued=await window.CareerModePersistentNikDanielPair.continuePair();
        return{continuedStatus:continued.status,activationCount,switchCount,continueOpened:window.__continueOpened-before,hydratedSaveId:currentShowdown?.identity?.saveId||null};
      }finally{
        currentShowdown=originalCurrentShowdown;window.loadRuntimeScript=originalLoader;window.CareerModeSaveLibraryRuntime=originalSaveRuntime;
        if(originalEnsure===undefined)delete window.ensureSaveLibraryRuntimeAuthority;else window.ensureSaveLibraryRuntimeAuthority=originalEnsure;
      }
    },{saveId,profileId,playerOneProfileId});
    assert.deepEqual(panelAuthorityReactivation,{continuedStatus:"paired",activationCount:1,switchCount:1,continueOpened:1,hydratedSaveId:saveId},"Panel Continue must reactivate invalidated Save Library authority and hydrate the exact provider-linked Save instead of showing false recovery.");
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});
    assert.equal(await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).count(),0,"Storage invalidation alone must not replace a still-valid ACTIVE pair with recovery UI.");

    // Fresh-browser active-pair recovery must expose and route a real OPEN RECOVERY control.
    await page.evaluate(async()=>{window.__pairProviderMode="active-recovery";window.__localRecoveryReady=false;await window.CareerModePersistentNikDanielPair.initialize({force:true});});
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER RECOVERY NEEDED"}).waitFor({state:"visible",timeout:5000});
    const recovery=page.locator("#persistentNikDanielPairPanel button",{hasText:"OPEN BACKUP RESTORE"});
    await recovery.waitFor({state:"visible"});
    const startOver=page.locator("#persistentNikDanielPairPanel button",{hasText:"START OVER"});
    await startOver.waitFor({state:"visible"});
    await recovery.click();
    await page.waitForFunction(()=>window.__recoveryOpened===1,null,{timeout:3000});
    await page.locator("#careerModeRestorePanel input[type=file]").waitFor({state:"attached",timeout:3000});
    assert.equal(await page.locator("#careerModeRestorePanel input[type=file]").evaluate(input=>document.activeElement===input),true,"Recovery routing must focus the verified restore input.");
    await page.evaluate(async()=>{window.__pairProviderMode="active-recovery";window.__localRecoveryReady=false;await window.CareerModePersistentNikDanielPair.initialize({force:true});window.CareerModePersistentNikDanielPair.render();});
    const startOverAgain=page.locator("#persistentNikDanielPairPanel button",{hasText:"START OVER"});
    await startOverAgain.waitFor({state:"visible"});
    await startOverAgain.click();
    await page.locator("#createShowdown").waitFor({state:"visible",timeout:3000});
    assert.match(await page.locator("#startShowdown").innerText(),/START A SHOWDOWN/,"Recovery START OVER must route to explicit season selection instead of the Legacy dead end.");

    assert.deepEqual(pageErrors,[],"User-facing routing audit emitted page errors.");
    assert.deepEqual(consoleErrors,[],"User-facing routing audit emitted unexpected console errors.");
    process.stdout.write("PASS real user-facing routing: CONNECT PLAYERS reaches the real persistent-pair panel, retries transient pair reads with stale-role reconciliation, and CREATE CODE, JOIN, CONTINUE CAREER, OPEN BACKUP RESTORE and START OVER remain actionable on their intended surfaces.\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});