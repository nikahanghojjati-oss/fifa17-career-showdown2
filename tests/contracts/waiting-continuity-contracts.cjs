#!/usr/bin/env node
"use strict";
// Real waiting and background controllers, real protocols and budget layer; only provider responses and presentation are fixtures.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const REF=process.env.WAITING_CONTINUITY_REF;
const read=file=>REF?require("node:child_process").execFileSync("git",["show",`${REF}:${file}`],{cwd:ROOT,encoding:"utf8"}):fs.readFileSync(path.join(ROOT,file),"utf8");
const source=read("js/sparkPrivatePairing.js");
const BUDGET_SOURCE=source.slice(source.indexOf("// Firestore budget layer (r75)."));
function flush(){return new Promise(resolve=>setImmediate(resolve));}
async function settle(){for(let index=0;index<8;index+=1)await flush();}

function createWorld({initialSnapshot=true}={}){
  const clock={now:1_800_000_000_000};
  const timers=[];let timerSeq=0;
  const events=[];
  const docListeners=[];
  const document={visibilityState:"visible",documentElement:{dataset:{}},listeners:{},addEventListener(type,fn){(this.listeners[type]=this.listeners[type]||[]).push(fn);}};
  const sandbox={
    console,
    document,
    windowListeners:{},
    addEventListener(type,fn){(sandbox.windowListeners[type]=sandbox.windowListeners[type]||[]).push(fn);},
    dispatchEvent(event){events.push(event);for(const fn of sandbox.windowListeners[event.type]||[])fn(event);return true;},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    setTimeout(fn,ms){const id=++timerSeq;timers.push({id,at:clock.now+Math.max(0,Number(ms)||0),fn});return id;},
    clearTimeout(id){const index=timers.findIndex(timer=>timer.id===id);if(index>=0)timers.splice(index,1);}
  };
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`Date.now=()=>__clockNow();`,Object.assign(sandbox,{__clockNow:()=>clock.now}));
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:"sparkPrivatePairing.js#budget"});
  const budget=sandbox.CareerModeFirestoreBudget;
  assert.ok(budget&&typeof budget.services==="function","CareerModeFirestoreBudget is published");

  // Fake Firestore server with SDK-like accounting.
  const server=new Map();let version=1;
  const readsByPath=new Map();
  const meter={reads:0,commits:0,docWrites:0,verifyWrites:0,listenerReads:0,transactions:0};
  let quota=false;
  function snapshotOf(pathName,fromCache=false){
    const record=server.get(pathName);
    const data=record?JSON.parse(JSON.stringify(record.data)):null;
    const stamp=record?record.version:0;
    return {id:pathName.split("/").pop(),ref:{path:pathName},exists:()=>Boolean(record),data:()=>data?JSON.parse(JSON.stringify(data)):undefined,
      metadata:{fromCache,hasPendingWrites:false},_document:{version:{timestamp:{seconds:stamp,nanoseconds:0}}}};
  }
  function quotaError(){const error=new Error("Quota exceeded.");error.code="resource-exhausted";error.name="FirebaseError";return error;}
  function serverWrite(pathName,data){
    version+=1;
    if(data===null)server.delete(pathName);else server.set(pathName,{data,version});
    for(const listener of docListeners)if(listener.active&&listener.path===pathName)Promise.resolve().then(()=>{if(listener.active){meter.listenerReads+=1;meter.reads+=1;listener.next(snapshotOf(pathName));}});
  }
  const db={kind:"fake-firestore"};
  const sdk={
    async runTransaction(_db,updateFunction){
      meter.transactions+=1;
      const read=new Set(),writes=new Map();
      const transaction={
        async get(ref){if(quota)throw quotaError();meter.reads+=1;readsByPath.set(ref.path,(readsByPath.get(ref.path)||0)+1);read.add(ref.path);return snapshotOf(ref.path);},
        set(ref,data){writes.set(ref.path,data);return transaction;},
        update(ref,data){writes.set(ref.path,{...(server.get(ref.path)?.data||{}),...data});return transaction;},
        delete(ref){writes.set(ref.path,null);return transaction;}
      };
      const value=await updateFunction(transaction);  // a rejection propagates without a commit, as in the real SDK
      if(quota)throw quotaError();
      meter.commits+=1;
      meter.docWrites+=writes.size;
      for(const pathName of read)if(!writes.has(pathName))meter.verifyWrites+=1;
      for(const [pathName,data] of writes)serverWrite(pathName,data);
      return value;
    },
    doc(_db,...parts){return {path:parts.join("/")};},
    onSnapshot(ref,_options,next,error){
      const listener={path:ref.path,next,error,active:true};
      docListeners.push(listener);
      Promise.resolve().then(()=>{if(!listener.active||!initialSnapshot)return;if(quota){listener.active=false;error(quotaError());return;}meter.listenerReads+=1;meter.reads+=1;next(snapshotOf(ref.path));});
      return ()=>{listener.active=false;};
    }
  };
  const services=budget.services({ok:true,firestore:db,firestoreSdk:sdk,auth:{currentUser:{uid:"nik"}}});

  async function advance(ms){
    const end=clock.now+ms;
    for(;;){
      await settle();
      timers.sort((a,b)=>a.at-b.at||a.id-b.id);
      const next=timers[0];
      if(!next||next.at>end)break;
      timers.shift();
      clock.now=Math.max(clock.now,next.at);
      next.fn();
    }
    clock.now=end;
    await settle();
  }
  function setVisible(visible){
    document.visibilityState=visible?"visible":"hidden";
    for(const fn of document.listeners.visibilitychange||[])fn();
  }
  const activeListeners=()=>docListeners.filter(listener=>listener.active);
  return {clock,budget,readsByPath,services,sdk,db,meter,server,serverWrite,advance,setVisible,events,document,sandbox,activeListeners,
    setQuota(value){quota=value;},failListeners(){for(const listener of docListeners)if(listener.active){listener.active=false;listener.error(new Error("listen stream dropped"));}},
    input(){for(const fn of document.listeners.pointerdown||[])fn();},
    cacheDeliver(pathName){for(const listener of docListeners)if(listener.active&&listener.path===pathName)listener.next(snapshotOf(pathName,true));}};
}

const rivalryId=`pair_${"a".repeat(64)}`,RID=`rivalries/${rivalryId}`;
const sessionId=`session_${"b".repeat(64)}`,deviceId=`device_${"c".repeat(32)}`;
const SETUP=`${RID}/sharedSetup/authoritative`,SESSION=`${RID}/sessions/${sessionId}`;
const COMMIT=n=>`${RID}/seasonCommits/season_${n}`,RESULTS=`${RID}/seasonResults/season_1`;
const slots=["playerOne","playerTwo"].map((slotId,i)=>({slotId,accountId:i?"partner":"nik",profileId:`profile_${String(i+1).repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"}));
const plan={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerTwo",totalSeasons:3,leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"}};
const History=require("../../js/sharedHistoryConvergence.js"),Multi=require("../../js/sharedMultiSeasonProgression.js");
function projection(count){
  if(!count)return null;
  const result={leaguePosition:1,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
  const score={championsLeague:0,leagueTitle:3,domesticCup:0,performanceBonus:0,individualAwardsBonus:0,total:3};
  const seasons=Array.from({length:count},(_,i)=>{const hash=`sha256:${String(i+1).repeat(64)}`,seasonNumber=i+1;return {
    commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,results:{playerOne:result,playerTwo:result}},
    scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,scoring:{playerOne:score,playerTwo:score},winner:"draw"}};});
  return History.buildProjection({rivalryId,setup:plan,managerSlots:slots,seasons});
}
async function world(screen,owner,phase="results",reloaded=false,options={}){
  const w=createWorld(options),s=w.sandbox;
  s.setInterval=(fn,ms)=>{const id={active:true};const tick=()=>{if(id.active){fn();s.setTimeout(tick,ms);}};s.setTimeout(tick,ms);return id;};s.clearInterval=id=>{id.active=false;};
  const nodes=Object.fromEntries(["mainMenu","standings","seasonEntry"].map(id=>[id,{classList:{contains:()=>id!==screen}}]));
  w.document.getElementById=id=>nodes[id]||null;w.document.querySelector=()=>null;
  s.currentShowdown={id:slots[0].saveId,identity:{saveId:slots[0].saveId,managerProfileIds:{playerOne:slots[0].profileId,playerTwo:slots[1].profileId}},currentRound:1,sharedJourney:{mode:"shared",rivalryId}};
  const initial=owner==="final"?2:owner==="progression"?1:0;
  w.serverWrite(RID,{data:{connectionState:"active"}});w.serverWrite(SESSION,{status:"ACTIVE",expires:w.clock.now+3600000});w.serverWrite(SETUP,{...plan,sessionId});
  for(let n=1;n<=3;n++)w.serverWrite(COMMIT(n),{phase:n<=initial?"ACKNOWLEDGED":"RESULTS_READY",accepted:n<=initial,revision:n<=initial?3:1});
  w.serverWrite(RESULTS,{phase:phase==="results"?"COLLECTING":"RESULTS_READY",revision:phase==="results"?1:2});
  let setup={ready:true,rivalryId,sessionId,deviceId,accountId:"nik",managerRole:"playerOne",setup:plan},multi=null,history=null;
  const errors=[];s.reportApplicationError=(label,e)=>errors.push(`${label}: ${e.code||e.message}`);
  const probe=async paths=>w.services.firestoreSdk.runTransaction(w.db,async tx=>{const values=[];for(const pathName of paths)values.push((await tx.get({path:pathName})).data());return values;});
  const accepted=()=>{let count=0;for(let n=1;n<=3;n++){if(w.server.get(COMMIT(n))?.data.accepted)count=n;else break;}return count;};
  const historyView=()=>{const count=accepted();return {ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,throughSeason:count,projection:projection(count)};};
  const multiView=()=>{const state=Multi.createProtocol().derive({rivalryId,setup:plan,history:projection(accepted())});return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",phase:state.phase,rivalryId,state};};
  s.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>{const [root,session,stored]=await probe([RID,SESSION,SETUP]);setup={...setup,sessionId:stored.sessionId,ready:root.data.connectionState==="active"&&session.status==="ACTIVE"&&session.expires>w.clock.now};return setup;}};
  s.CareerModeProductionSharedTransferChallenge={getState:()=>({seasonNumber:1,state:{phase:"COMPLETED"}}),refresh:async()=>probe([SETUP])};
  s.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>w.services};
  for(const name of ["SharedShowdownCatalog","SharedShowdownSetup","SharedSeasonResults","SharedSeasonCommit"])s[`CareerMode${name}`]={};
  s.CareerModeProductionSharedJourneyConflicts={execute:async(_meta,run)=>run()};
  const providerReads={results:0,commit:0};
  const noWrite=async()=>{throw Error("waiting must never write");};
  s.CareerModeSparkSharedSeasonResults={publishResult:noWrite,read:async()=>{providerReads.results++;const [data]=await probe([RESULTS]);return {ok:true,rivalryId,seasonNumber:1,managerRole:"playerOne",ownResult:{leaguePosition:1},allResults:{playerOne:{leaguePosition:1},playerTwo:{leaguePosition:2}},state:data};}};
  s.CareerModeSparkSharedSeasonCommit={commitSeason:noWrite,acknowledgeSeason:noWrite,read:async()=>{providerReads.commit++;const [data]=await probe([COMMIT(1)]);return {ok:true,...data,rivalryId,seasonNumber:1,managerRole:"playerOne",coordinatorRole:"playerTwo",committed:false,ownAcknowledged:false};}};
  s.CareerModeSharedMultiSeasonProgression=Multi;
  s.CareerModeSparkSharedMultiSeasonProgression={read:async()=>{await probe([RID,SESSION,SETUP,...[1,2,3].map(COMMIT)]);return multiView();}};
  s.CareerModeProductionSharedHistoryConvergence={refresh:async()=>{await probe([RID,...[1,2,3].map(COMMIT)]);history=historyView();return history;},getState:()=>history};
  s.CareerModeProductionSharedMultiSeasonProgression={refresh:async()=>{await probe([RID,SESSION,SETUP,...[1,2,3].map(COMMIT)]);multi=multiView();return multi;},getState:()=>multi,resolveSeason:()=>1};
  const local={phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slots[0].saveId,profileId:slots[0].profileId,managerRole:"playerOne"}};
  s.CareerModeSaveLibraryRuntime={isReady:()=>true};
  s.CareerModeProductionSharedLocalReconciliation={refresh:()=>local,getState:()=>local};
  s.CareerModeSharedFinalReconciliation=require("../../js/sharedFinalReconciliation.js");
  s.CareerModeSharedTerminalClose=require("../../js/sharedTerminalClose.js");
  s.CareerModeSharedJourneyReconnect=require("../../js/sharedJourneyReconnect.js");
  s.CareerModeSparkConnectedAccount={getState:()=>({connected:true,accountId:"nik"})};
  s.CareerModeSparkPrivatePairing={getState:()=>({registered:true,deviceId})};
  s.CareerModeSparkConnectedRivalry={getState:()=>({attached:true,rivalryId,binding:local.binding})};
  let remote={sessionState:"active",sessionId,rivalryId,accountId:"nik",deviceId,pendingAction:null,expiresAtEpochMs:w.clock.now+3600000};
  s.CareerModeSparkRemoteJoining={getState:()=>remote,subscribe:()=>()=>{},forgetSession:()=>{remote={...remote,sessionState:"closed"};}};
  const finalProjection={schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId,leagueId:plan.leagueId,totalSeasons:3,acceptedSeasons:3,completedSeason:3,acceptedRevisionKey:"season:3:revision:19",fixedClubs:plan.clubs,managerTotals:{playerOne:9,playerTwo:9},winner:"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};
  s.CareerModeProductionSharedFinalReconciliation={getState:()=>null,refresh:async()=>null};
  s.CareerModeSparkTerminalClose={close:async()=>{throw Error("fixture must not auto-close");},read:async()=>{const [data]=await probe([RID]);return data.data.connectionState==="closed"?{ok:true,terminal:true,rivalryRevision:4,terminalWitness:s.CareerModeSharedTerminalClose.prepare(finalProjection,{sessionId})}:{ok:true,terminal:false};}};
  // Only rendering is substituted; request binding, refresh, state, timer and event code are the production closure.
  function load(file,prefix){let code=read(`js/${file}.js`),at=code.lastIndexOf("  return Object.freeze(");assert.ok(at>0);code=code.slice(0,at)+`  ${prefix}Render=()=>${prefix==="pssr"||prefix==="pssc"?prefix+"WatchSync()":"false"};\n`+code.slice(at);vm.runInContext(code,s,{filename:file});}
  load("productionSharedSeasonResults","pssr");load("productionSharedSeasonCommit","pssc");
  const selected={progression:["MultiSeasonProgression","pmsp"],final:["FinalReconciliation","pfr"],terminal:["TerminalClose","ptc"],session:["JourneyReconnect","pjr"],rivalry:["MultiSeasonProgression","pmsp"]}[owner];
  load(`productionShared${selected[0]}`,selected[1]);const api=s[`CareerModeProductionShared${selected[0]}`];
  await s.CareerModeProductionSharedSeasonResults.refresh();if(phase==="commit")await s.CareerModeProductionSharedSeasonCommit.refresh();
  await s.CareerModeProductionSharedMultiSeasonProgression.refresh();
  if(owner==="session"){
    // The real reconnect controller first observes the disconnected state, then authorizes the same durable plan.
    remote={...remote,sessionState:"expired"};await api.refresh();remote={...remote,sessionState:"active"};await api.refresh();
  }
  const attachStart={reads:w.meter.reads,listeners:w.meter.listenerReads};
  s.CareerModeProductionSharedSeasonResults.install();s.CareerModeProductionSharedSeasonCommit.install();api.install();
  let waitPhase=phase;
  {const attach=()=>w.budget.watchWaitPoint("base-fixture",waitPhase==="results"?RESULTS:COMMIT(1),()=>{});attach();s.setInterval(attach,3000);}
  await w.advance(12000);
  assert.equal(w.budget.stats().watchHealthy,options.initialSnapshot!==false,"A holds a confirmed server listener");
  assert.equal(errors.length,0,errors.join("\n"));
  const original=JSON.stringify(w.server.get(phase==="results"?RESULTS:COMMIT(1)));
  return {...w,s,api,errors,probe,providerReads,setWaitPhase:next=>{waitPhase=next;},attachReads:w.meter.reads-attachStart.reads,attachListenerReads:w.meter.listenerReads-attachStart.listeners,setup:()=>setup,original,reloaded,watched:phase==="results"?RESULTS:COMMIT(1),remote:()=>remote,setRemote:next=>{remote=next;}};
}
const baselinePath=process.env.WAITING_CONTINUITY_BASELINE,base=baselinePath?JSON.parse(fs.readFileSync(baselinePath,"utf8")):null;
const measurements={},failures=[];
async function scenario(screen,owner,phase,reloaded){
  let w=await world(screen,owner,phase);
  if(reloaded){await w.advance(60000);w=await world(screen,owner,phase,true);}// Fresh VM, no retained listener/cache/controller state.
  const label=`${screen}/${owner}/${phase}/${reloaded?"reload":"live"}`,start=w.clock.now;
  let condition;
  if(owner==="progression"){
    // A still displays its old wait while B advances a later season's authority.
    w.serverWrite(COMMIT(2),{phase:"ACKNOWLEDGED",accepted:true,revision:3});
    w.serverWrite(`${RID}/transferChallenges/season_3`,{phase:"GUESS_ENTRY",revision:1});
    condition=()=>w.api.getState()?.state?.acceptedSeasons===2;
  }else if(owner==="final"){
    w.serverWrite(COMMIT(3),{phase:"ACKNOWLEDGED",accepted:true,revision:3});condition=()=>w.api.getState()?.phase==="FINAL_SEASON_RECONCILED";
  }else if(owner==="terminal"){
    w.serverWrite(RID,{data:{connectionState:"closed"}});condition=()=>w.api.getState()?.phase==="CLOSED";
  }else if(owner==="session"){
    w.setRemote({...w.remote(),sessionState:"expired",expiresAtEpochMs:start-1});w.serverWrite(SESSION,{status:"EXPIRED",expires:start-1});
    condition=()=>w.api.getState()?.phase==="FRESH_SESSION_REQUIRED";
  }else{
    w.serverWrite(RID,{data:{connectionState:"abandoned"}});condition=()=>w.setup()?.ready===false;
  }
  let latency=null;
  for(let elapsed=0;elapsed<=90000;elapsed+=100){await w.advance(elapsed?100:0);if(condition()){latency=w.clock.now-start;break;}}
  assert.equal(JSON.stringify(w.server.get(w.watched)),w.original,"B never touches A's watched document");
  measurements[label]=latency;console.log(`MEASURE ${label}: ${latency===null?">90000":latency} ms`);
  const measuredBase=base?.[label]??(["progression","final","session"].includes(owner)?3000:63000);
  const limit=Math.min(measuredBase,measuredBase<=3000?3000:90000);
  assert.ok(latency!==null&&latency<=limit,`partner ${owner} update missed r75 deadline ${limit} ms (actual ${latency})`);
  if(owner==="session"){
    const nextSession=`session_${"d".repeat(64)}`;
    w.setRemote({...w.remote(),sessionState:"active",sessionId:nextSession,expiresAtEpochMs:w.clock.now+3600000});
    w.serverWrite(SESSION,{status:"ACTIVE",expires:w.clock.now+3600000});w.serverWrite(SETUP,{...plan,sessionId:nextSession});
    for(let n=0;n<900;n++){await w.advance(100);if(w.api.getState()?.sessionId===nextSession&&w.api.getState()?.activeAuthorization)break;}
    if(process.env.WAITING_CONTINUITY_DEBUG&&w.api.getState()?.sessionId!==nextSession)console.log("DEBUG",{setup:w.setup(),state:w.api.getState(),errors:w.errors,listeners:w.activeListeners().map(l=>l.path),events:w.events.slice(-15)});
    assert.equal(w.api.getState()?.sessionId,nextSession,"a fresh session is recovered without modifying the watched document");
    assert.equal(w.api.getState()?.activeAuthorization,true);
  }
  assert.equal(w.meter.docWrites+w.meter.verifyWrites,0,"continuity refreshes never write");
}
(async()=>{
  // JOB-1832: expiry comes from the clock, without any server notification.
  for(const screen of ["mainMenu","standings","seasonEntry"])for(const phase of ["results","commit"])for(const reload of [false,true]){
    const label=`clock-only expiry ${screen}/${phase}/${reload?"reload":"live"}`;
    try{
      let w=await world(screen,"session",phase);
      if(reload)w=await world(screen,"session",phase,true);
      const start=w.clock.now,before=w.meter.reads,stored=JSON.stringify([...w.server]);
      w.setRemote({...w.remote(),expiresAtEpochMs:start-1});
      await w.advance(3000);
      assert.equal(w.api.getState()?.phase,"FRESH_SESSION_REQUIRED","clock expiry must expose recovery within 3000 ms");
      assert.equal(w.meter.reads,before,"expired-session clock check reads nothing");
      assert.equal(JSON.stringify([...w.server]),stored,"no server write drives clock expiry");
      console.log(`PASS ${label}: <=3000 ms, zero reads`);
    }catch(e){failures.push(`${label}: ${e.message}`);console.error(`FAIL ${label}: ${e.stack}`);}
  }
  for(const phase of ["results","commit"])for(const screen of ["mainMenu","standings","seasonEntry"]){
    const label=`healthy ${screen}/${phase} first delivery and tab return cost`;
    try{
      const w=await world(screen,"progression",phase);
      // Initial subscription deliveries are billed separately (one per listener: the floor for watching a document);
      // this limit covers reads they trigger.
      const first=w.attachReads-w.attachListenerReads;
      w.setVisible(false);await w.advance(0);const before=w.meter.reads,listening=w.activeListeners().length;
      // 30 s: every listener the return attaches again, and every check it wakes, lands inside the window.
      w.setVisible(true);await w.advance(30000);const returned=w.meter.reads-before;
      console.log(`MEASURE ${label}: ${first} first-delivery refresh reads (+${w.attachListenerReads} subscription reads), ${returned} tab-return reads / 30 s`);
      assert.equal(listening,0,"hidden page holds no listener");
      assert.ok(first<=2,`first delivery triggered ${first} reads (limit 2)`);
      assert.ok(returned<=8,`tab return triggered ${returned} reads (limit 8)`);
      assert.ok(w.s.CareerModeProductionSharedSeasonCommit.waitingListenerHealthy(),"the return restores the healthy wait");
      const paths=w.activeListeners().map(l=>l.path);assert.equal(new Set(paths).size,paths.length,"one listener per document after the return");
      console.log(`PASS ${label}`);
    }catch(e){failures.push(`${label}: ${e.message}`);console.error(`FAIL ${label}: ${e.stack}`);}
    const hiddenLabel=`${screen}/${phase} partner change while hidden arrives on return`;
    try{
      const w=await world(screen,"progression",phase);
      w.setVisible(false);await w.advance(20000);w.serverWrite(COMMIT(2),{phase:"ACKNOWLEDGED",accepted:true,revision:3});await w.advance(20000);
      const before=w.meter.reads;w.setVisible(true);await w.advance(3000);
      assert.equal(w.api.getState()?.state?.acceptedSeasons,2,"the return check sees the partner's change from the server");
      await w.advance(27000);assert.ok(w.meter.reads-before<=8,`return after a hidden change cost ${w.meter.reads-before} reads (limit 8)`);
      console.log(`PASS ${hiddenLabel}: ${w.meter.reads-before} reads / 30 s`);
    }catch(e){failures.push(`${hiddenLabel}: ${e.message}`);console.error(`FAIL ${hiddenLabel}: ${e.stack}`);}
  }
  for(const phase of ["results","commit"]){
    const fastLabel=`unhealthy ${phase} fast window ends`;
    try{
      const w=await world("mainMenu","terminal",phase,false,{initialSnapshot:false});
      const key=phase==="results"?"results":"commit",before=w.providerReads[key];
      await w.advance(3000);assert.ok(w.providerReads[key]>before,"unhealthy wait initially uses 3 s checks");
      await w.advance(180000);const after=w.providerReads[key];
      await w.advance(3000);assert.equal(w.providerReads[key],after,"3 s provider checks stop after FAST_POLL_WINDOW_MS");
      console.log(`PASS ${fastLabel}`);
    }catch(e){failures.push(`${fastLabel}: ${e.message}`);console.error(`FAIL ${fastLabel}: ${e.stack}`);}
  }
  try{
    const w=await world("mainMenu","terminal"),context=w.activeListeners().filter(l=>l.path!==RESULTS);
    w.setWaitPhase("commit");w.serverWrite(RESULTS,{phase:"RESULTS_READY",revision:2});await w.advance(0);
    await w.s.CareerModeProductionSharedSeasonResults.refresh();
    await w.s.CareerModeProductionSharedSeasonCommit.refresh();await w.advance(6000);
    assert.equal(w.budget.stats().watching,COMMIT(1),"Results switches to the Commit wait");
    assert.ok(context.every(l=>l.path===COMMIT(1)||l.active&&w.activeListeners().includes(l)),"Results-to-Commit keeps every authority listener");
    assert.equal(w.activeListeners().filter(l=>l.path===COMMIT(1)).length,1,"the commit document has exactly one listener after the switch");
    // One partner write on the watched commit costs its one listener read, as on a wait that starts on Commit.
    const before=w.meter.reads,serverReads=w.budget.stats().serverReads;
    w.serverWrite(COMMIT(1),{...w.server.get(COMMIT(1)).data,partnerNote:"seen"});await w.advance(6000);
    assert.ok(w.meter.reads-before<=1,`one commit-document write cost ${w.meter.reads-before} reads (limit 1)`);
    assert.equal(w.budget.stats().serverReads,serverReads,"the write starts no refresh wave");
    console.log(`PASS Results-to-Commit keeps authority listeners; commit write ${w.meter.reads-before} read`);
  }catch(e){failures.push(`listener retention: ${e.message}`);console.error(`FAIL listener retention: ${e.stack}`);}
  try{
    const w=await world("mainMenu","terminal");let release,entered=false;
    const gate=new Promise(resolve=>{release=resolve;});
    w.s.CareerModeProductionSharedFinalReconciliation.refresh=async()=>{entered=true;return gate;};
    const inflight=w.api.refresh();await settle();assert.equal(entered,true,"terminal read is held in flight");
    w.serverWrite(RID,{data:{connectionState:"closed"}});await settle();
    release(null);await inflight;await settle();
    assert.equal(w.api.getState()?.phase,"CLOSED","context wake while busy must run after the held refresh");
    console.log("PASS Terminal Close retains a context wake while busy");
  }catch(e){failures.push(`terminal busy wake: ${e.message}`);console.error(`FAIL terminal busy wake: ${e.stack}`);}
  for(const screen of ["mainMenu","standings","seasonEntry"])for(const owner of ["progression","final","terminal","session","rivalry"])for(const phase of ["results","commit"])for(const reload of [false,true]){
    const label=`${screen}/${owner}/${phase}/${reload?"reload":"live"}`;
    if(process.env.WAITING_CONTINUITY_FILTER&&!label.includes(process.env.WAITING_CONTINUITY_FILTER))continue;
    try{await scenario(screen,owner,phase,reload);console.log(`PASS ${label}`);}catch(e){failures.push(`${label}: ${e.message}`);console.error(`FAIL ${label}: ${e.stack}`);}
  }
  if(!REF&&!process.env.WAITING_CONTINUITY_FILTER){
    for(const screen of ["mainMenu","standings","seasonEntry"])for(const owner of ["progression","final","terminal","session","rivalry"]){
      const label=`${screen}/${owner} real-owner idle and hidden cleanup`;
      try{
        const w=await world(screen,owner),before=w.meter.reads;
        await w.advance(600000);const reads=w.meter.reads-before;
        assert.ok(reads<=10,`real owner spent ${reads} reads over ten idle minutes`);
        w.setVisible(false);await w.advance(0);
        assert.equal(w.activeListeners().length,0,"hiding releases primary and authority listeners immediately");
        const hidden=w.meter.reads;await w.advance(60000);assert.equal(w.meter.reads,hidden);
        console.log(`PASS ${label}: ${reads} reads / 10 min`);
      }catch(e){failures.push(`${label}: ${e.message}`);console.error(`FAIL ${label}: ${e.stack}`);}
    }
    for(const screen of ["mainMenu","standings","seasonEntry"]){
      const label=`${screen} authority-listener cache/error fallback, recovery and quota cleanup`;
      try{
        const w=await world(screen,"progression"),dependency=w.activeListeners().find(l=>l.path===COMMIT(2));
        assert.ok(dependency,"the later commit has its own listener");
        dependency.next({exists:()=>true,data:()=>({}),metadata:{fromCache:true,hasPendingWrites:false}});
        dependency.active=false;// A cache-only stream with no following server delivery.
        assert.equal(w.s.CareerModeProductionSharedSeasonCommit.waitingListenerHealthy(),false);
        w.serverWrite(COMMIT(2),{phase:"ACKNOWLEDGED",accepted:true,revision:3});await w.advance(3000);
        assert.equal(w.api.getState()?.state?.acceptedSeasons,2,"unconfirmed authority uses the unchanged r75 timer");
        dependency.error(new Error("context stream dropped"));
        assert.equal(w.s.CareerModeProductionSharedSeasonCommit.waitingListenerHealthy(),false);
        await w.advance(66000);
        assert.equal(w.s.CareerModeProductionSharedSeasonCommit.waitingListenerHealthy(),true,"existing ticks recover the authority listeners");
        const before=w.meter.reads;await w.advance(600000);assert.ok(w.meter.reads-before<=10);
        const live=w.activeListeners().find(l=>l.path===COMMIT(2)),error=new Error("Quota exceeded");error.code="resource-exhausted";live.error(error);
        assert.equal(w.budget.paused(),true);assert.equal(w.activeListeners().filter(l=>l!==live).length,0);
        const paused=w.meter.reads;await w.advance(60000);assert.equal(w.meter.reads,paused,"quota hold performs no reads");
        console.log(`PASS ${label}`);
      }catch(e){failures.push(`${label}: ${e.message}`);console.error(`FAIL ${label}: ${e.stack}`);}
    }
  }
  if(process.env.WAITING_CONTINUITY_OUTPUT)fs.writeFileSync(process.env.WAITING_CONTINUITY_OUTPUT,JSON.stringify(measurements,null,2)+"\n");
  assert.equal(failures.length,0,failures.join("\n"));
  console.log("PASS waiting continuity contracts: real background controllers, all three waiting screens, Results/Commit listeners, partner authority changes and fresh-runtime reload.");
})().catch(error=>{console.error(error);process.exitCode=1;});
