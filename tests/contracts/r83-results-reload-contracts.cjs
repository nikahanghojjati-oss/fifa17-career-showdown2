"use strict";
// F4: finish Transfer, open Results, then reload/reopen and CONTINUE on the same browser.
// New VM per page; only device storage and provider facts survive. No source-string oracle.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const {FakeNode}=require("../support/fake-dom.cjs");
const ROOT=path.resolve(__dirname,"../..");
const RID="pair_"+"a".repeat(64),SID="session_"+"b".repeat(64),DEVICE="device_"+"c".repeat(32);
const PHASES=["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"];
const FACTS={leaguePosition:2,leaguePoints:80,leagueGoals:65,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const settle=async()=>{for(let i=0;i<60;i++)await new Promise(resolve=>setImmediate(resolve));};
function page({storage,role,season=1,rivalry=RID,stage="entry",phase="COMPLETED",deny=false,storageFails=false,shellRivalry=true}){
  const nodes=new Map(),listeners=new Map(),navigation=[],errors=[],writes=[];
  let currentPhase=phase,currentStage=stage;
  function node(id){
    if(!nodes.has(id)){
      const n=new FakeNode("button");n.id=id;n.value="";n.disabled=false;
      n.querySelector=()=>null;n.querySelectorAll=()=>[];
      n.closest=selector=>selector==="button"?n:null;
      n.hasAttribute=k=>Object.hasOwn(n.attributes,k);n.removeAttribute=k=>{delete n.attributes[k];};
      nodes.set(id,n);
    }
    return nodes.get(id);
  }
  const screens=["transferChallenge","seasonEntry","dashboard","mainMenu"];
  screens.forEach(id=>node(id).classList.add("hidden"));node("mainMenu").classList.remove("hidden");
  const actions=new FakeNode("div");node("seasonReviewPanel").querySelector=selector=>selector===".seasonReviewActions"?actions:null;
  const doc={visibilityState:"visible",body:new FakeNode("body"),head:new FakeNode("head"),documentElement:new FakeNode("html"),
    getElementById:id=>node(id),createElement:tag=>new FakeNode(tag),createDocumentFragment:()=>new FakeNode("fragment",true),
    querySelector:()=>null,querySelectorAll:()=>[],addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);}};
  // Fable F2-05: a Setup read always carries the confirm time (here a Showdown from before the roulette).
  const setup={ready:true,managerRole:role,rivalryId:rivalry,sessionId:SID,deviceId:DEVICE,setupUpdatedAtMs:Date.parse("2026-09-01T00:00:00Z"),
    setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:3,leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"}}};
  const remote={sessionState:"active",sessionId:SID,pendingAction:null,rivalryId:rivalry,accountId:role,deviceId:DEVICE,expiresAtEpochMs:Date.now()+3600000};
  const forbidden=async()=>{writes.push("unexpected mutation");throw Error("resume must be read-only");};
  const s={console,Date,Promise,crypto:webcrypto,performance:{now:()=>1000},setTimeout,clearTimeout,
    document:doc,MutationObserver:class{observe(){}disconnect(){}},
    currentShowdown:{id:"local-save",currentRound:season,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",...(shellRivalry?{rivalryId:rivalry}:{})}},
    readStorageValue:key=>{if(storageFails)throw Error("storage unavailable");return storage.get(key)||null;},
    writeStorageValue:(key,value)=>{if(storageFails)throw Error("storage unavailable");storage.set(key,value);return true;},removeStorageValue:key=>storage.delete(key),
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,loadRuntimeStyle:async()=>true,
    navigateTo:async name=>{navigation.push(name);screens.forEach(id=>node(id).classList.toggle("hidden",id!==name));return true;},
    reportApplicationError:(where,error)=>errors.push([where,error.message]),
    CareerModeSaveLibraryRuntime:{isReady:()=>true},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:role==="playerOne"?"daniel":"nik",registered:true})},
    CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:role})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:rivalry})},
    CareerModeSparkRemoteJoining:{getState:()=>remote,subscribe:()=>()=>{}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role,getIdTokenResult:async()=>({issuedAtTime:new Date().toISOString()})}},firestore:{},firestoreSdk:{}})},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
    CareerModeRosterRouletteStep:{decide:()=>false,runBeforeTransfers:async()=>true,close(){},ensureDraw:async()=>true},
    CareerModeProductionSharedCareerStart:{refresh:async()=>true,getState:()=>({state:{phase:"CAREER_START_READY",revision:2}}),openPanel:async()=>{s.CareerModeProductionSharedTransferChallenge.install();return s.CareerModeProductionSharedTransferChallenge.open();}},
    CareerModeProductionSharedMultiSeasonProgression:{install(){},resolveSeason:()=>season,resumeFromAuthority:async()=>({acceptedSeasons:season-1,season,rivalryId:rivalry}),decorateDashboard(){}},
    CareerModeSparkSharedTransferChallenge:{read:async()=>deny?{ok:false,code:"permission-denied"}:{ok:true,managerRole:role,seasonNumber:season,revision:8,state:{phase:currentPhase,guessLockedRoles:[],signingLockedRoles:[]},ownInputs:{guesses:[],signings:[]},opponentInputs:{guesses:[],signings:[]}},startWindow:forbidden,requestEndWindow:forbidden,advanceExpiredWindow:forbidden,lockGuesses:forbidden,lockSignings:forbidden},
    CareerModeSparkSharedSeasonResults:{read:async()=>({ok:true,managerRole:role,seasonNumber:season,revision:currentStage==="entry"?0:currentStage==="published"?1:2,state:{phase:["entry","published"].includes(currentStage)?"COLLECTING":"RESULTS_READY",revision:currentStage==="entry"?0:currentStage==="published"?1:2},ownResult:currentStage==="entry"?null:FACTS,opponentResult:["entry","published"].includes(currentStage)?null:FACTS,allResults:["entry","published"].includes(currentStage)?null:{playerOne:FACTS,playerTwo:FACTS}}),publishResult:forbidden},
    CareerModeSparkSharedSeasonCommit:{read:async()=>({ok:true,managerRole:role,seasonNumber:season,phase:currentStage==="ready"?"NOT_COMMITTED":"COMMITTED",committed:currentStage!=="ready",ownAcknowledged:currentStage==="acknowledged",coordinatorRole:"playerOne",revision:currentStage==="ready"?0:1}),commitSeason:forbidden,acknowledgeSeason:forbidden},
    CareerModeProductionSharedJourneyConflicts:{execute:forbidden},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedTransferChallenge:{},CareerModeSharedSeasonResults:{},CareerModeSharedSeasonCommit:{},CareerModeSharedLocalReconciliation:{}};
  for(const name of ["CanonicalScoring","HistoryConvergence","JourneyReconnect","LocalReconciliation","FinalReconciliation","TerminalClose"])s["CareerModeProductionShared"+name]={install(){}};
  vm.createContext(s);
  function load(file){vm.runInContext(fs.readFileSync(path.join(ROOT,file),"utf8"),s,{filename:file});}
  s.loadRuntimeScript=async(_key,file,ready)=>{if(!ready?.())load(file);return true;};
  for(const file of ["productionSharedTransferChallenge","productionSharedSeasonResults","productionSharedSeasonResultsRoute","productionSharedSeasonCommit","productionSharedJourneyEntry"])load("js/"+file+".js");
  // Same capture order as production: the Results route handles a completed Transfer's continue first.
  s.CareerModeProductionSharedSeasonResultsRoute.install();
  function click(id){let stopped=false;const event={target:node(id),preventDefault(){},stopPropagation(){},stopImmediatePropagation(){stopped=true;}};for(const fn of listeners.get("click")||[]){fn(event);if(stopped)break;}}
  return {s,node,navigation,errors,writes,click,phase:value=>{currentPhase=value;},stage:value=>{currentStage=value;},
    continue:async()=>{await s.CareerModeProductionSharedJourneyEntry.openPanel({resumeActive:true});await settle();},
    location:()=>screens.find(id=>!node(id).classList.contains("hidden"))};
}
async function finishTransfer(options){
  const p=page({...options,stage:"entry",phase:"WINDOW_OPEN"});p.s.CareerModeProductionSharedTransferChallenge.install();await settle();
  await p.s.CareerModeProductionSharedTransferChallenge.open();
  for(const phase of PHASES.slice(1)){p.phase(phase);await p.s.CareerModeProductionSharedTransferChallenge.refresh();}
  assert.equal(p.node("transferChallenge").dataset.sharedTransferReplay,undefined,"normal play witnessed every transfer phase");
  assert.equal(await p.s.CareerModeProductionSharedSeasonResultsRoute.open(),true);
  assert.equal(p.location(),"seasonEntry");
  p.stage(options.stage||"entry");await p.s.CareerModeProductionSharedSeasonResults.refresh();
  if(!["entry","published"].includes(options.stage||"entry"))await p.s.CareerModeProductionSharedSeasonCommit.refresh();
  assert.deepEqual(p.errors,[]);return p;
}
(async()=>{
  let checks=0;
  for(const role of ["playerOne","playerTwo"])for(const season of [1,2])for(const stage of ["entry","published","ready","acknowledge","acknowledged"]){
    const storage=new Map(),options={storage,role,season,stage};
    await finishTransfer(options);
    for(const reopen of ["reload","close/reopen","cold-shell reload"]){
      // Cold saved shells rely on the confirmed Setup snapshot for their rivalry; keep the bound-shell case too.
      const p=page({...options,shellRivalry:reopen!=="cold-shell reload"});await settle();await p.continue();
      assert.equal(p.location(),"seasonEntry",`${role} season ${season} ${stage} ${reopen}: continue must restore Results directly`);
      assert.ok(!p.navigation.includes("transferChallenge"),"no completed-window replay frame");
      assert.deepEqual(p.errors,[]);assert.deepEqual(p.writes,[],"resume never republishes or acknowledges");
      if(stage==="entry")assert.equal(p.node("seasonEntry").dataset.sharedSeasonResults,"entry");
      if(stage==="published"){assert.equal(p.node("confirmSeasonCompletion").textContent,"PUBLISHED ✓");assert.equal(p.node("confirmSeasonCompletion").disabled,true);}
      if(stage==="ready")assert.equal(p.node("sharedSeasonCommitAction").textContent,role==="playerOne"?"LOCK & CONFIRM SEASON":"WAITING FOR DANIEL");
      if(stage==="acknowledge")assert.equal(p.node("sharedSeasonCommitAction").textContent,"CONFIRM SEASON");
      if(stage==="acknowledged"){assert.equal(p.node("sharedSeasonCommitAction").textContent,"CONFIRMED ✓ · WAITING FOR RIVAL");assert.equal(p.node("sharedSeasonCommitAction").disabled,true);}
      checks++;
    }
  }
  // Completed verdicts without a Results tap retain the original recovery landing (L6's season-2 dashboard).
  for(const role of ["playerOne","playerTwo"])for(const season of [1,2]){
    const storage=new Map(),p=page({storage,role,season,phase:"WINDOW_OPEN"});
    p.s.CareerModeProductionSharedTransferChallenge.install();await settle();await p.s.CareerModeProductionSharedTransferChallenge.open();
    for(const phase of PHASES.slice(1)){p.phase(phase);await p.s.CareerModeProductionSharedTransferChallenge.refresh();}
    assert.equal(p.s.CareerModeProductionSharedTransferChallenge.canResumeResults(),false,"verdicts alone do not mark Results as viewed");
    const fresh=page({storage,role,season,shellRivalry:false});await fresh.continue();
    assert.equal(fresh.location(),season===1?"transferChallenge":"dashboard","reload before opening Results keeps its existing landing");
    assert.deepEqual(fresh.writes,[]);assert.deepEqual(fresh.errors,[]);checks++;
  }
  // Hints belong only to this browser, manager, rivalry and season; unseen full-screen steps stay required.
  const storage=new Map();await finishTransfer({storage,role:"playerOne"});
  for(const options of [{storage:new Map(),role:"playerOne"},{storage,role:"playerTwo"},{storage,role:"playerOne",season:2},{storage,role:"playerOne",rivalry:"pair_"+"e".repeat(64)}]){
    const p=page(options);p.s.CareerModeProductionSharedTransferChallenge.install();await settle();await p.s.CareerModeProductionSharedTransferChallenge.open();
    assert.equal(p.node("transferChallenge").dataset.sharedTransferReplay,"WINDOW_OPEN");
    for(const expected of ["GUESS_ENTRY","SIGNING_ENTRY",undefined]){p.click("continueFromTransfers");await settle();assert.equal(p.node("transferChallenge").dataset.sharedTransferReplay,expected);}
    assert.deepEqual(p.writes,[]);checks++;
  }
  const partialStorage=new Map(),partial=page({storage:partialStorage,role:"playerOne",phase:"WINDOW_OPEN"});
  partial.s.CareerModeProductionSharedTransferChallenge.install();await settle();await partial.s.CareerModeProductionSharedTransferChallenge.open();
  for(const phase of ["GUESS_ENTRY","SIGNING_ENTRY"]){partial.phase(phase);await partial.s.CareerModeProductionSharedTransferChallenge.refresh();}
  const unseenVerdict=page({storage:partialStorage,role:"playerOne"});await settle();await unseenVerdict.continue();
  assert.equal(unseenVerdict.location(),"transferChallenge","an unseen verdict must still be presented full screen");
  assert.equal(unseenVerdict.node("transferChallenge").dataset.transferPhase,"completed","already-viewed earlier phases do not replay");checks++;
  const unavailableStorage=page({storage,role:"playerOne",storageFails:true});await settle();await unavailableStorage.s.CareerModeProductionSharedTransferChallenge.open();
  assert.equal(unavailableStorage.node("transferChallenge").dataset.sharedTransferReplay,"WINDOW_OPEN","storage failure safely falls back to replay");checks++;
  const incomplete=page({storage,role:"playerOne",phase:"SIGNING_ENTRY"});await settle();await incomplete.continue();
  assert.notEqual(incomplete.location(),"seasonEntry","hints cannot overrule an incomplete provider transfer");checks++;
  const denied=page({storage,role:"playerOne",deny:true});await settle();await denied.continue();
  assert.notEqual(denied.location(),"seasonEntry","hints cannot authorize a denied provider read");assert.deepEqual(denied.writes,[]);checks++;
  console.log(`PASS r83 Results reload: ${checks} behavioral checks (both managers, first/later season, fresh pages).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
