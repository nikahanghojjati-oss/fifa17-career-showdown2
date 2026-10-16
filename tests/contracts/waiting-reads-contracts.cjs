#!/usr/bin/env node
"use strict";
// Actual Results/Commit timers and the background timer registrations run in a VM against the real budget layer.
// Only presentation rendering and provider responses are faked; no production timer or listener-health decision is replaced.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
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
    dispatchEvent(event){events.push(event);return true;},
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
    doc(_db,pathName){return {path:pathName};},
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

const RID="rivalries/r1",RESULTS=`${RID}/seasonResults/season_1`,COMMIT=`${RID}/seasonCommits/season_1`;
const BACKGROUND=[
  ["productionSharedCanonicalScoring","pcscTick"],
  ["productionSharedMultiSeasonProgression","pmspWake"],
  ["productionSharedFinalReconciliation","pfrWake"],
  ["productionSharedTerminalClose","ptcWake"],
  ["productionSharedJourneyReconnect","pjrWake"]
];
async function screenWorld(screen,role,phase,options){
  const w=createWorld(options),s=w.sandbox;
  const intervalIds=new Set();
  s.setInterval=(fn,ms)=>{const id={active:true};intervalIds.add(id);const loop=()=>{if(!id.active)return;fn();s.setTimeout(loop,ms);};s.setTimeout(loop,ms);return id;};
  s.clearInterval=id=>{id.active=false;};
  s.currentShowdown={id:"save_1",currentRound:1,sharedJourney:{mode:"shared",rivalryId:"r1"}};
  const nodes=Object.fromEntries(["mainMenu","standings","seasonEntry"].map(id=>[id,{classList:{contains:()=>id!==screen}}]));
  w.document.getElementById=id=>nodes[id]||null;
  w.document.querySelector=()=>null;
  w.document.documentElement={dataset:{}};
  const setup={ready:true,managerRole:role,accountId:"nik",rivalryId:"r1",sessionId:"s1",deviceId:"d1",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne"}};
  w.serverWrite(RID,{data:{connectionState:"active"}});
  w.serverWrite(`${RID}/sessions/s1`,{status:"ACTIVE"});
  w.serverWrite(RESULTS,{phase:phase==="results"?"COLLECTING":"RESULTS_READY",revision:phase==="results"?1:2});
  w.serverWrite(COMMIT,{phase:"RESULTS_READY",committed:false});
  let providerCalls=0,forbiddenWrites=0;
  const probe=async watched=>{
    providerCalls++;
    return w.services.firestoreSdk.runTransaction(w.db,async tx=>{
      const snap=await tx.get({path:watched});
      await tx.get({path:RID});await tx.get({path:`${RID}/sessions/s1`});
      return snap.data();
    });
  };
  const resultView=(data=w.server.get(RESULTS).data)=>({ok:true,rivalryId:"r1",seasonNumber:1,managerRole:role,ownResult:{leaguePosition:1},state:{phase:data.phase,revision:data.revision},allResults:{playerOne:{leaguePosition:1},playerTwo:{leaguePosition:2}}});
  s.CareerModeProductionSharedShowdownSetup={refresh:()=>probe(RID),getState:()=>setup};
  s.CareerModeProductionSharedTransferChallenge={refresh:()=>probe(RID),getState:()=>({seasonNumber:1,state:{phase:"COMPLETED"}})};
  s.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>w.services};
  for(const name of ["SharedShowdownCatalog","SharedShowdownSetup","SharedSeasonResults","SharedSeasonCommit"])s[`CareerMode${name}`]={};
  s.CareerModeProductionSharedJourneyConflicts={execute:async(_meta,run)=>run()};
  const noWrite=async()=>{forbiddenWrites++;throw Error("waiting must never write");};
  s.CareerModeSparkSharedSeasonResults={read:async()=>resultView(await probe(RESULTS)),publishResult:noWrite};
  s.CareerModeSparkSharedSeasonCommit={read:async()=>({ok:true,...await probe(COMMIT),rivalryId:"r1",seasonNumber:1,managerRole:role,coordinatorRole:"playerOne",ownAcknowledged:false}),commitSeason:noWrite,acknowledgeSeason:noWrite};
  // Render-only substitution avoids building forms; watch synchronization still uses the real closure and real state.
  function load(file,prefix){let code=read(`js/${file}.js`);const at=code.lastIndexOf('  return Object.freeze(');assert.ok(at>0);code=code.slice(0,at)+`  ${prefix}Render=()=>${prefix}WatchSync();\n`+code.slice(at);vm.runInContext(code,s,{filename:file});}
  load("productionSharedSeasonResults","pssr");load("productionSharedSeasonCommit","pssc");
  await s.CareerModeProductionSharedSeasonResults.refresh();
  if(phase==="commit")await s.CareerModeProductionSharedSeasonCommit.refresh();
  s.CareerModeProductionSharedSeasonResults.install();s.CareerModeProductionSharedSeasonCommit.install();
  // Exercise the actual 15 s registration from each background owner with a counting provider boundary.
  for(const [file,wake] of BACKGROUND){
    const code=read(`js/${file}.js`),registration=code.match(/root\.setInterval\([^\n]*?,POLL_MS\)/);
    assert.ok(registration,`${file} keeps its existing timer`);
    vm.runInNewContext(registration[0],{root:s,POLL_MS:15000,[wake]:()=>{if(w.document.visibilityState!=="hidden")void probe(RID);}});
  }
  await w.advance(9000);
  return {...w,s,probe,calls:()=>providerCalls,forbidden:()=>forbiddenWrites};
}
const failures=[];
async function check(label,fn){try{await fn();console.log(`PASS ${label}`);}catch(e){failures.push(`${label}: ${e.message}`);console.error(`FAIL ${label}: ${e.message}`);}}
(async()=>{
  for(const screen of ["mainMenu","standings","seasonEntry"]){
    for(const role of ["playerOne","playerTwo"]){
      for(const phase of ["results","commit"]){
        await check(`${screen}/${role}/${phase} healthy ten-minute wait and listener recovery`,async()=>{
          const w=await screenWorld(screen,role,phase),watched=phase==="results"?RESULTS:COMMIT;
          assert.equal(w.budget.stats().watching,watched,"this screen attaches the exact document awaited");
          assert.equal(w.budget.stats().watchHealthy,true,"first server snapshot establishes health");
          const before={...w.meter},calls=w.calls();await w.advance(600000);
          const reads=w.meter.reads-before.reads;
          console.log(`MEASURE ${screen}/${role}/${phase}: ${reads} reads / 10 min, ${w.meter.transactions-before.transactions} server transactions`);
          assert.ok(reads<=10,`healthy wait read ${reads} documents; maximum 10`);
          assert.equal(w.meter.transactions-before.transactions,0,"healthy wait never repeats a server transaction");
          assert.equal(w.calls(),calls,"healthy wait does not re-enter provider chains");
          // Use a genuine server delivery, including the initial non-cache snapshot, through the real budget listener.
          const next=phase==="results"?{phase:"COLLECTING",revision:1,partnerTouched:true}:{phase:"COMMITTED",committed:true};
          const delivered=w.calls(),watchedReads=w.readsByPath.get(watched)||0;w.serverWrite(watched,next);await w.advance(1000);
          assert.equal(w.readsByPath.get(watched)||0,watchedReads,"the update uses the listener snapshot instead of re-reading its document");
          assert.ok(w.calls()>delivered,"listener delivery wakes the provider immediately");
          if(phase==="commit")assert.equal(w.s.CareerModeProductionSharedSeasonCommit.getState().committed,true,"partner commit reaches the screen within one second");
          // Keep a genuine partner-wait state for the backup test after the delivery.
          if(phase==="commit"){w.serverWrite(COMMIT,{phase:"RESULTS_READY",committed:false});await w.s.CareerModeProductionSharedSeasonCommit.refresh(true);await w.advance(3000);}
          w.failListeners();const failedCalls=w.calls();await w.advance(3000);
          if(role==="playerTwo"||phase==="results")assert.ok(w.calls()>failedCalls,"3 s backup runs even after ten minutes waiting");
          await w.advance(66000);assert.equal(w.budget.stats().watchHealthy,true,"existing retry reattaches and recovers");
          const recovered=w.calls(),readAfter=w.meter.reads;await w.advance(600000);
          assert.equal(w.calls(),recovered,"recovered listener stops backup provider checks");
          assert.ok(w.meter.reads-readAfter<=10,"recovery restores the idle read budget");
          const writes=w.meter.docWrites+w.meter.verifyWrites;w.setVisible(false);const hidden=w.meter.reads;await w.advance(60000);
          assert.equal(w.meter.reads,hidden,"hidden tab reads zero");assert.equal(w.meter.docWrites+w.meter.verifyWrites,writes,"idle writes stay zero");assert.equal(w.forbidden(),0);
        });
      }
    }
  }
  for(const phase of ["results","commit"]){
    await check(`${phase}: no first server snapshot and cache-only delivery keep backup active`,async()=>{
      const w=await screenWorld("seasonEntry","playerTwo",phase,{initialSnapshot:false});
      assert.equal(w.budget.stats().watchHealthy,false);
      const before=w.calls();await w.advance(3000);assert.ok(w.calls()>before,"unconfirmed listener does not suppress the backup");
      const watched=phase==="results"?RESULTS:COMMIT,listener=w.activeListeners()[0];
      const snapshot={exists:()=>true,data:()=>w.server.get(watched).data,metadata:{fromCache:false,hasPendingWrites:false}};
      listener.next(snapshot);await w.advance(3000);assert.equal(w.budget.stats().watchHealthy,true);
      const confirmed=w.calls();await w.advance(30000);assert.equal(w.calls(),confirmed);
      w.cacheDeliver(watched);assert.equal(w.budget.stats().watchHealthy,false);
      const cached=w.calls();await w.advance(3000);assert.ok(w.calls()>cached,"cache-only delivery resumes backup");
      listener.next(snapshot);await w.advance(3000);
      w.s.currentShowdown.currentRound=2;
      assert.equal(w.s.CareerModeProductionSharedSeasonCommit.waitingListenerHealthy(),false,"another season's listener cannot suppress reads");
      w.s.currentShowdown.currentRound=1;w.s.currentShowdown.sharedJourney.rivalryId="r2";
      assert.equal(w.s.CareerModeProductionSharedSeasonCommit.waitingListenerHealthy(),false,"another rivalry's listener cannot suppress reads");
    });
  }
  assert.equal(failures.length,0,failures.join("\n"));
  console.log("PASS waiting reads contracts: all three screens, both managers, publication/commit waits, listener delivery/error/recovery, no repeated healthy transactions, hidden-tab pause.");
})().catch(error=>{console.error(error);process.exitCode=1;});
