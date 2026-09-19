const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const rivalryId=`pair_5${"c".repeat(63)}`;
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
  page.on("console",message=>{if(message.type()!=="error")return;const text=message.text();if(/^Failed to load resource/.test(text))return;if(baseUrl.origin==="https://nikahanghojjati-oss.github.io"&&text==="requestStorageAccess: Permission denied.")return;consoleErrors.push(text);});
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
      window.__localDeleteCount=0;
      const envelope=(objectType,objectId,data)=>({schemaVersion:1,objectType,objectId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:"sha256:fixture",priorContentHash:null,updatedAt:{},updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null});
      const pairEnvelope=()=>envelope("pairLink","current",{rivalryId,managerRole:"playerTwo",managerId:"nik",linkedAt:{},lastConfirmedAt:{}});
      const rivalryEnvelope=(connectionState="active")=>envelope("rivalry",rivalryId,{connectionState,managerSlots:[{slotId:"playerOne",accountId:"account_daniel_fixture",saveId,profileId:playerOneProfileId},{slotId:"playerTwo",accountId,saveId,profileId}]});
      const snapshot=value=>({exists:()=>value!==null,data:()=>value});
      const deviceEnvelope=()=>envelope("device",deviceId,{deviceId,state:"active"});
      const firestoreSdk={
        doc:(_firestore,...parts)=>parts.join("/"),
        Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
        runTransaction:async(_firestore,fn)=>fn({
          get:async ref=>{
            const key=String(ref);
            if(key.endsWith(`devices/${deviceId}`))return snapshot(deviceEnvelope());
            if(window.__pairProviderMode==="active-recovery"){
              if(key.endsWith("pairLinks/current"))return snapshot(pairEnvelope());
              if(key===`rivalries/${rivalryId}`)return snapshot(rivalryEnvelope("active"));
            }
            if(window.__pairProviderMode==="pending-nik"){
              if(key.endsWith("pairLinks/current"))return snapshot(pairEnvelope());
              if(key===`rivalries/${rivalryId}`)return snapshot(rivalryEnvelope("pending-pair"));
            }
            return snapshot(null);
          },
          set:(ref,value)=>{
            if(String(ref)===`rivalries/${rivalryId}`&&value?.data?.connectionState==="closed"){
              window.__pairProviderMode="unpaired";
              window.__providerAbandonCount=(window.__providerAbandonCount||0)+1;
            }
          }
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
        switchActiveSave:async requested=>{if(requested!==saveId)throw new Error("Unexpected Save hydration target.");currentShowdown=preparedShowdown();return currentShowdown;},
        deleteSave:requested=>{
          if(requested!==saveId)throw new Error("Unexpected stale-shell deletion target.");
          if(!window.__localRecoveryReady)throw new Error("Stale-shell deletion must target the existing prepared shell exactly once.");
          window.__localRecoveryReady=false;
          window.__localDeleteCount+=1;
          currentShowdown=null;
          return{ok:true,deletedSaveId:saveId,activeSaveId:null,library:{activeSaveId:null,saves:[]}};
        }
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
      const bindings=[
        {saveId,profileId:playerOneProfileId,managerRole:"playerOne"},
        {saveId,profileId,managerRole:"playerTwo"}
      ];
      window.CareerModeSparkPrivatePairing={
        initialize:async()=>true,
        getState:()=>({registered:true,deviceId}),
        localBindingOptions:()=>bindings,
        getOrCreateDeviceIdentity:async()=>({deviceId}),
        pairingJoinErrorMessage:error=>error?.message||"The code could not be joined.",
        createPairing:async({binding})=>{
          const role=binding.managerRole,managerId=role==="playerOne"?"daniel":"nik",managerLabel=role==="playerOne"?"Daniel":"Nik";
          return{ok:true,rivalryId,capability:rivalryId,durableWitness:{ok:true,rivalryId,managerRole:role,managerId,managerLabel,connectionState:"pending-pair",providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:0}};
        },
        redeemPairing:async({binding})=>{
          const role=binding.managerRole,managerId=role==="playerOne"?"daniel":"nik",managerLabel=role==="playerOne"?"Daniel":"Nik";
          return{ok:true,rivalryId,durableWitness:{ok:true,rivalryId,managerRole:role,managerId,managerLabel,connectionState:"active",providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:0}};
        }
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
    await page.locator("#persistentNikDanielPairCode").waitFor({state:"visible"});
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"JOIN DANIEL'S SHOWDOWN"}).waitFor({state:"visible"});
    assert.equal(await page.locator("#persistentNikDanielPairPanel button",{hasText:"CREATE CODE FOR NIK"}).count(),0,"Nik must not be shown Daniel's host action.");
    assert.match(await panel.innerText(),/NIK ENTERS THE CODE DANIEL SENDS/,"Nik's surface must explain the one action required on the second device.");
    assert.doesNotMatch((await panel.innerText()),/Save Library|Private Remote Joining|Shared Journey/i,"The player connection panel must not expose retired architecture concepts.");

    // Historical Player Two pending-pair state must never expose a host code in the current Daniel-hosted product.
    await page.evaluate(async()=>{
      window.__pairProviderMode="pending-nik";
      window.__routeManagerId="nik";
      window.__providerAbandonCount=0;
      await window.CareerModePersistentNikDanielPair.initialize({force:true});
      window.CareerModePersistentNikDanielPair.render();
    });
    await page.locator("#persistentNikDanielPairPanel",{hasText:"OLD CONNECTION FOUND"}).waitFor({state:"visible",timeout:5000});
    assert.equal(await panel.locator("code").count(),0,"Nik must not see or copy an old host capability.");
    assert.equal(await page.locator("#persistentNikDanielPairPanel button",{hasText:"COPY CODE"}).count(),0,"Nik must not receive a host COPY CODE action from stale provider state.");
    assert.equal(await page.locator("#persistentNikDanielPairPanel button",{hasText:"NEW CODE"}).count(),0,"Nik must not create a replacement host code.");
    const discardOld=page.locator("#persistentNikDanielPairPanel button",{hasText:"DELETE OLD CONNECTION & START FRESH"});
    await discardOld.waitFor({state:"visible"});
    page.once("dialog",dialog=>void dialog.accept());
    await discardOld.click();
    await page.locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:5000});
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"JOIN DANIEL'S SHOWDOWN"}).waitFor({state:"visible",timeout:5000});
    const stalePendingReset=await page.evaluate(()=>({providerMode:window.__pairProviderMode,abandonCount:window.__providerAbandonCount,localDeleteCount:window.__localDeleteCount,localRecoveryReady:window.__localRecoveryReady,state:window.CareerModePersistentNikDanielPair.getState()}));
    assert.equal(stalePendingReset.providerMode,"unpaired","Deleting Nik's stale pending connection must close that exact remote rivalry.");
    assert.equal(stalePendingReset.abandonCount,1,"Nik stale-pair cleanup must close exactly one provider rivalry.");
    assert.equal(stalePendingReset.localDeleteCount,1,"Nik stale-pair cleanup must delete exactly the provider-bound unfinished local Showdown shell.");
    assert.equal(stalePendingReset.localRecoveryReady,false,"The stale local shell must be gone before Nik is offered Daniel's new Join flow.");
    assert.equal(stalePendingReset.state.status,"unpaired");
    assert.match(stalePendingReset.state.message,/Old connection and unfinished test Showdown deleted\. Paste the new code Daniel sends\./i);

    await page.evaluate(async()=>{window.__localRecoveryReady=true;window.__routeManagerId="daniel";window.__pairProviderMode="unpaired";await window.CareerModePersistentNikDanielPair.initialize({force:true});});
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CREATE CODE FOR NIK"}).waitFor({state:"visible"});
    assert.equal(await page.locator("#persistentNikDanielPairCode").count(),0,"Daniel must not be shown Nik's join-code input.");
    assert.match(await panel.innerText(),/DANIEL STARTS THE SHOWDOWN AND SENDS THIS CODE TO NIK/,"Daniel's surface must make the host action explicit.");

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
    await page.evaluate(async()=>{window.__pairProviderMode="unpaired";window.__routeManagerId="daniel";window.__identitySyncTransientFailures=0;await window.CareerModePersistentNikDanielPair.initialize({force:true});});

    // Daniel CREATE CODE must transition the real panel into a complete waiting state with all recovery controls.
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CREATE CODE FOR NIK"}).click();
    await page.locator("#persistentNikDanielPairPanel",{hasText:"WAITING FOR THE OTHER PLAYER"}).waitFor({state:"visible",timeout:5000});
    assert.match(await panel.innerText(),new RegExp(rivalryId));
    const playerJoinCode=(await panel.locator("code").textContent()).trim();
    assert.equal(playerJoinCode,`CMS17-${rivalryId}`,"Daniel's one-use code must wrap the exact season-bound provider rivalry id.");
    for(const label of ["COPY CODE","CHECK STATUS","NEW CODE"])await page.locator("#persistentNikDanielPairPanel button",{hasText:label}).waitFor({state:"visible"});

    // Simulate Nik on a fresh browser with no local Showdown: JOIN must provision the local shell invisibly from Daniel's code.
    await page.evaluate(async()=>{
      window.__pairProviderMode="unpaired";
      window.__routeManagerId="nik";
      window.__localRecoveryReady=false;
      window.__joinerProvisionRounds=null;
      const originalEntry=window.CareerModeProductionSharedJourneyEntry;
      window.CareerModeProductionSharedJourneyEntry={
        ...originalEntry,
        provisionJoinerShell:async totalRounds=>{
          window.__joinerProvisionRounds=totalRounds;
          window.__localRecoveryReady=true;
          return true;
        }
      };
      await window.CareerModePersistentNikDanielPair.initialize({force:true});
    });
    await page.locator("#persistentNikDanielPairCode").fill(playerJoinCode);
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"JOIN DANIEL'S SHOWDOWN"}).click();
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});
    assert.match(playerJoinCode,/^CMS17-pair_5[0-9a-f]{63}$/i,"The five-season plan must be bound into the exact provider capability itself.");
    assert.equal(await page.evaluate(()=>window.__joinerProvisionRounds),5,"Nik Join must automatically provision the same season length Daniel selected.");
    assert.match(await panel.innerText(),/Nik joined Daniel's Showdown/i,"Nik must receive a single successful Join outcome, not another Start Showdown instruction.");
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

    // Fresh-browser active-pair recovery must expose a real backup path and one-click remote deletion escape.
    await page.evaluate(async()=>{window.__pairProviderMode="active-recovery";window.__localRecoveryReady=false;window.__providerAbandonCount=0;await window.CareerModePersistentNikDanielPair.initialize({force:true});});
    await page.locator("#persistentNikDanielPairPanel",{hasText:"OLD SHOWDOWN FOUND"}).waitFor({state:"visible",timeout:5000});
    const recovery=page.locator("#persistentNikDanielPairPanel button",{hasText:"RESTORE BACKUP"});
    await recovery.waitFor({state:"visible"});
    const startOver=page.locator("#persistentNikDanielPairPanel button",{hasText:"DELETE OLD SHOWDOWN & START OVER"});
    await startOver.waitFor({state:"visible"});
    assert.match(await panel.innerText(),/old online Showdown is still connected, but this browser no longer has its local career data/i,"Fresh-browser recovery must explain the real local/server split.");
    await recovery.click();
    await page.waitForFunction(()=>window.__recoveryOpened===1,null,{timeout:3000});
    await page.locator("#careerModeRestorePanel input[type=file]").waitFor({state:"attached",timeout:3000});
    assert.equal(await page.locator("#careerModeRestorePanel input[type=file]").evaluate(input=>document.activeElement===input),true,"Recovery routing must focus the verified restore input.");
    await page.evaluate(async()=>{window.showScreen("mainMenu",false);window.__pairProviderMode="active-recovery";window.__localRecoveryReady=false;await window.CareerModePersistentNikDanielPair.initialize({force:true});window.CareerModePersistentNikDanielPair.render();});
    const staleStartOver=page.locator("#persistentNikDanielPairPanel button",{hasText:"DELETE OLD SHOWDOWN & START OVER"});
    await staleStartOver.waitFor({state:"visible"});

    // If backup restore completed but the old button is still visible, destructive start-over must revalidate and cancel deletion.
    await page.evaluate(()=>{window.__localRecoveryReady=true;});
    await staleStartOver.click();
    await page.locator("#persistentNikDanielPairPanel",{hasText:"CAREER READY"}).waitFor({state:"visible",timeout:5000});
    const restoredProof=await page.evaluate(()=>({providerMode:window.__pairProviderMode,abandonCount:window.__providerAbandonCount,pairStatus:window.CareerModePersistentNikDanielPair.getState().status}));
    assert.equal(restoredProof.providerMode,"active-recovery","A successfully restored career must keep the provider Showdown active.");
    assert.equal(restoredProof.abandonCount,0,"A stale delete button must never abandon the provider Showdown after local recovery becomes valid.");
    assert.equal(restoredProof.pairStatus,"paired","Fresh recovery revalidation must promote the restored browser to CAREER READY.");
    await page.locator("#persistentNikDanielPairPanel button",{hasText:"CONTINUE CAREER"}).waitFor({state:"visible",timeout:5000});

    // With recovery still genuinely missing, the same action may close exactly one old provider Showdown and route to fresh season selection.
    await page.evaluate(async()=>{window.__localRecoveryReady=false;window.__pairProviderMode="active-recovery";await window.CareerModePersistentNikDanielPair.initialize({force:true});window.CareerModePersistentNikDanielPair.render();});
    const startOverAgain=page.locator("#persistentNikDanielPairPanel button",{hasText:"DELETE OLD SHOWDOWN & START OVER"});
    await startOverAgain.waitFor({state:"visible"});
    page.once("dialog",dialog=>void dialog.accept());
    await startOverAgain.click();
    await page.locator("#createShowdown").waitFor({state:"visible",timeout:5000});
    const resetProof=await page.evaluate(()=>({providerMode:window.__pairProviderMode,abandonCount:window.__providerAbandonCount,pairStatus:window.CareerModePersistentNikDanielPair.getState().status}));
    assert.equal(resetProof.providerMode,"unpaired","Start Over must close the stale remote Showdown before routing to new season selection.");
    assert.equal(resetProof.abandonCount,1,"Start Over must perform exactly one provider abandonment.");
    assert.equal(resetProof.pairStatus,"unpaired","The closed old Showdown must immediately become fresh-start eligible.");
    assert.match(await page.locator("#startShowdown").innerText(),/START A SHOWDOWN/,"Start Over must land on explicit season selection instead of the Legacy dead end.");

    assert.deepEqual(pageErrors,[],"User-facing routing audit emitted page errors.");
    assert.deepEqual(consoleErrors,[],"User-facing routing audit emitted unexpected console errors.");
    process.stdout.write("PASS real user-facing routing: CONNECT PLAYERS reaches the real persistent-pair panel, stale Nik pending host-state resets safely to JOIN DANIEL'S SHOWDOWN, transient pair reads reconcile stale roles, Daniel CREATE CODE carries the season setup, Nik JOIN auto-provisions its local shell, and CONTINUE CAREER, RESTORE BACKUP and DELETE OLD SHOWDOWN & START OVER remain actionable on their intended surfaces.\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});