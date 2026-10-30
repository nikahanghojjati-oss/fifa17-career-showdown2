#!/usr/bin/env node
"use strict";
// r75 Firestore budget guard (2026-10-12 incident: production hit the Spark daily limit after ~1.5 h of two-player play,
// and the screens hid the cause). Deterministic proxy, no emulator: the budget layer at the end of js/sparkPrivatePairing.js
// runs in a sandbox with a fake clock, fake timers and a fake Firestore that counts reads, commit RPCs, document writes and
// "verify" writes the way the web SDK does. Screen models make the same calls the connected modules make (a 3 s fast check
// that also asks for the wait-point listener, and a 15 s slow poll). The test FAILS when a screen goes over its read or
// write budget, visible or hidden, idle or waiting, or when a partner update stops reaching a waiting screen quickly.
// Budgets come from the r75 measurements with headroom (see gameplay/r75/FIRESTORE_BUDGET.md).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/sparkPrivatePairing.js"),"utf8");
const MARK="// Firestore budget layer (r75).";
const start=source.indexOf(MARK);
assert.ok(start>0,"the Firestore budget layer lives at the end of js/sparkPrivatePairing.js");
const BUDGET_SOURCE=source.slice(start);
const QUOTA_TEXT="Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.";

// Budgets (per browser). Measured with this proxy on r75: waiting with the listener 3.4/min, waiting with the listener
// down 60/min (today's 3 s cadence, kept as the fallback), a screen with only the 15 s poll 1.8/min, hidden 0, idle writes 0.
// The limits sit just above those numbers, so any drift back toward polling (one more document per check, a shorter reuse
// window, a check that ignores the listener) fails here.
const BUDGET=Object.freeze({
  waitingVisibleReadsPerMinute:5,       // was 72/min before r75 (3 documents every 3 s plus the 15 s poll)
  waitingFallbackReadsPerMinute:66,     // listener down: the 3 s check must keep working, never above today's cadence
  idleVisibleReadsPerMinute:3,          // a screen with only the 15 s poll (3 documents): was 12/min before r75
  hiddenReadsPerMinute:0,
  idleWritesPerMinute:0,
  partnerUpdateMs:1000                  // listener delivery -> waiting screen has the new data
});

function flush(){return new Promise(resolve=>setImmediate(resolve));}
async function settle(){for(let index=0;index<8;index+=1)await flush();}

function createWorld({storage=null,now=1_800_000_000_000}={}){
  const clock={now};
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
    clearTimeout(id){const index=timers.findIndex(timer=>timer.id===id);if(index>=0)timers.splice(index,1);},
    ...(storage?{readStorageValue:key=>storage.has(key)?storage.get(key):null,writeStorageValue:(key,value)=>{storage.set(key,String(value));return true;}}:{})
  };
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`Date.now=()=>__clockNow();`,Object.assign(sandbox,{__clockNow:()=>clock.now}));
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:"sparkPrivatePairing.js#budget"});
  const budget=sandbox.CareerModeFirestoreBudget;
  assert.ok(budget&&typeof budget.services==="function","CareerModeFirestoreBudget is published");

  // Fake Firestore server with SDK-like accounting.
  const server=new Map();let version=1;
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
        async get(ref){if(quota)throw quotaError();meter.reads+=1;read.add(ref.path);return snapshotOf(ref.path);},
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
    doc(_db,...segments){return {path:segments.join("/")};},
    onSnapshot(ref,_options,next,error){
      const listener={path:ref.path,next,error,active:true};
      docListeners.push(listener);
      Promise.resolve().then(()=>{if(!listener.active)return;if(quota){listener.active=false;error(quotaError());return;}meter.listenerReads+=1;meter.reads+=1;next(snapshotOf(ref.path));});
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
  return {clock,budget,services,sdk,db,meter,server,serverWrite,advance,setVisible,events,document,sandbox,activeListeners,
    setQuota(value){quota=value;},failListeners(){for(const listener of docListeners)if(listener.active){listener.active=false;listener.error(new Error("listen stream dropped"));}},
    input(){for(const fn of document.listeners.pointerdown||[])fn();},
    cacheDeliver(pathName){for(const listener of docListeners)if(listener.active&&listener.path===pathName)listener.next(snapshotOf(pathName,true));}};
}

// A connected screen model: the 3 s fast check (asks for the wait-point listener first, skips when hidden) and the 15 s
// slow poll, each one read-only transaction over the screen's documents.
function createScreen(world,{owner,watched,context,fast=true,slow=true,waiting=()=>true}){
  const screen={seen:null,ticks:0,busy:false,intervals:[],stopped:false};
  const {sdk,db}=world.services.firestoreSdk?{sdk:world.services.firestoreSdk,db:world.db}:{};
  async function tick(){
    if(screen.busy||screen.stopped)return;
    screen.busy=true;
    try{
      screen.seen=await sdk.runTransaction(db,async transaction=>{
        const watchedSnapshot=await transaction.get(world.sdk.doc(db,watched));
        for(const pathName of context)await transaction.get(world.sdk.doc(db,pathName));
        return watchedSnapshot.exists()?watchedSnapshot.data():null;
      });
      screen.ticks+=1;
    }catch(_error){}finally{screen.busy=false;}
  }
  function wake(){void tick();}
  function fastTick(){
    world.budget.watchWaitPoint(owner,world.document.visibilityState==="hidden"||!waiting()?null:watched,wake);
    if(world.document.visibilityState==="hidden"||!waiting())return;
    void tick();
  }
  function every(ms,fn){const loop=()=>{if(screen.stopped)return;fn();world.sandbox.setTimeout(loop,ms);};world.sandbox.setTimeout(loop,ms);}
  screen.start=()=>{void tick();if(fast)every(3000,fastTick);if(slow)every(15000,()=>{void tick();});if(fast)fastTick();};
  screen.stop=()=>{screen.stopped=true;world.budget.watchWaitPoint(owner,null,wake);};
  screen.tick=tick;
  return screen;
}

const RIVALRY="rivalries/r1";
const TRANSFER=`${RIVALRY}/transferChallenges/season_1`;
const RESULTS=`${RIVALRY}/seasonResults/season_1`;
const SESSION=`${RIVALRY}/sessions/s1`;
function seed(world){
  world.serverWrite(RIVALRY,{status:"ACTIVE",data:{connectionState:"active"}});
  world.serverWrite(SESSION,{status:"ACTIVE"});
  world.serverWrite(TRANSFER,{phase:"window",requests:{}});
  world.serverWrite(RESULTS,{published:{}});
  world.serverWrite("accounts/nik",{uid:"nik"});
}
const measured=[];
async function perMinute(world,minutes,fn){
  const reads=world.meter.reads,writes=world.meter.docWrites+world.meter.verifyWrites,commits=world.meter.commits;
  await fn?.();
  await world.advance(minutes*60000);
  const rate={reads:(world.meter.reads-reads)/minutes,writes:(world.meter.docWrites+world.meter.verifyWrites-writes)/minutes,commits:(world.meter.commits-commits)/minutes};
  measured.push(rate.reads.toFixed(1));
  return rate;
}

const results=[];
async function check(id,label,fn){await fn();results.push(id);console.log(`ok ${results.length} ${id} ${label}`);}

(async()=>{
  await check("FB1","a read-only transaction ends without a commit RPC (no verify writes); a writing one commits once",async()=>{
    const world=createWorld();seed(world);
    const before={...world.meter};
    const value=await world.services.firestoreSdk.runTransaction(world.db,async tx=>{const a=await tx.get({path:RIVALRY});const b=await tx.get({path:SESSION});return [a.data().status,b.data().status];});
    assert.deepEqual(value,["ACTIVE","ACTIVE"]);
    assert.equal(world.meter.commits-before.commits,0,"no commit RPC for a read-only transaction");
    assert.equal(world.meter.verifyWrites-before.verifyWrites,0,"no verify writes for a read-only transaction");
    assert.equal(world.meter.reads-before.reads,2,"two documents cost two reads");
    await world.advance(2500);
    const mid={...world.meter};
    await world.services.firestoreSdk.runTransaction(world.db,async tx=>{const snap=await tx.get({path:TRANSFER});tx.update({path:TRANSFER},{phase:snap.data().phase==="window"?"guess_entry":"window"});});
    assert.equal(world.meter.commits-mid.commits,1,"a writing transaction commits exactly once");
    assert.equal(world.meter.docWrites-mid.docWrites,1);
    assert.equal(world.server.get(TRANSFER).data.phase,"guess_entry","the write reached the server");
    // The next read of a document this page wrote goes to the server, never to the reuse cache.
    const afterWrite={...world.meter};
    const phase=await world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:TRANSFER})).data().phase);
    assert.equal(phase,"guess_entry");
    assert.equal(world.meter.reads-afterWrite.reads,1,"a written document is read again from the server");
    // An error thrown by the screen's own code still rejects with that error and commits nothing.
    const failing=new Error("Complete guess 1.");
    const commits=world.meter.commits;
    await assert.rejects(world.services.firestoreSdk.runTransaction(world.db,async tx=>{await tx.get({path:RIVALRY});throw failing;}),error=>error===failing);
    assert.equal(world.meter.commits,commits);
  });

  await check("FB2","refreshes of the same document within 2 s cost one read; concurrent reads share one request; quiet checks reuse up to 60 s; taps, waits and fast checks read fresh",async()=>{
    const world=createWorld();seed(world);
    const read=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:SESSION})).data().status);
    const before=world.meter.reads;
    await Promise.all([read(),read(),read()]);
    assert.equal(world.meter.reads-before,1,"three concurrent refreshes cost one read");
    await world.advance(1500);await read();
    assert.equal(world.meter.reads-before,1,"a refresh 1.5 s later reuses the read");
    // Nobody waits and nobody tapped: background checks reuse the copy for up to 60 s.
    await world.advance(1600);await read();
    assert.equal(world.meter.reads-before,1,"a quiet background check 3 s later reuses the copy");
    await world.advance(55000);await read();
    assert.equal(world.meter.reads-before,1,"still reused at 58 s");
    await world.advance(3000);await read();
    assert.equal(world.meter.reads-before,2,"after 60 s the check reads the server again");
    // A tap makes every check read fresh for 5 s (2 s coalescing only).
    await world.advance(2500);world.input();await read();
    assert.equal(world.meter.reads-before,3,"right after a tap the check reads the server");
    // A screen that says it waits on the partner (and has no healthy listener) reads fresh on every 3 s check.
    world.budget.wantFresh();await world.advance(2500);await read();
    assert.equal(world.meter.reads-before,4,"a fast check that asked for fresh reads gets them");
    // A screen can ask for one document fresh (Terminal Close while the partner may close): only that document is re-read.
    await world.advance(10000);
    const both=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>{await tx.get({path:SESSION});await tx.get({path:RIVALRY});});
    await both();const scoped=world.meter.reads;
    await world.advance(15000);world.budget.wantFresh(RIVALRY);await both();
    assert.equal(world.meter.reads-scoped,1,"wantFresh(path) re-reads that document only");
    // An unknown fast check (same document every 3 s) is detected after two short gaps and then reads fresh.
    await world.advance(70000);
    const fastStart=world.meter.reads;
    for(let index=0;index<6;index+=1){await read();await world.advance(3000);}
    assert.ok(world.meter.reads-fastStart>=4,`a 3 s check of the same document reads fresh once detected (${world.meter.reads-fastStart} reads in 6 checks)`);
    // The account's own document is reused for 5 minutes; a different account forgets everything.
    const own=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:"accounts/nik"})).exists());
    const ownBefore=world.meter.reads;
    await own();await world.advance(4*60000);await own();
    assert.equal(world.meter.reads-ownBefore,1,"own account document reused within 5 minutes");
    await world.advance(61000);await own();
    assert.equal(world.meter.reads-ownBefore,2,"own account document re-read after 5 minutes");
  });

  await check("FB2b","a check that sees a changed document after reusing an old copy re-runs on fresh reads (never a mix of old and new)",async()=>{
    const world=createWorld();seed(world);
    const pair=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>{const a=(await tx.get({path:RIVALRY})).data();const b=(await tx.get({path:SESSION})).data();return [a.status,b.status];});
    await world.services.firestoreSdk.runTransaction(world.db,async tx=>tx.get({path:RIVALRY}));
    await world.advance(30000);
    await world.services.firestoreSdk.runTransaction(world.db,async tx=>tx.get({path:SESSION}));
    // The partner changes both documents together.
    world.serverWrite(RIVALRY,{status:"CLOSED",data:{connectionState:"closed"}});world.serverWrite(SESSION,{status:"CLOSED"});
    await world.advance(31000);  // rivalry copy is now 61 s old (read fresh), session copy 31 s old (reusable)
    const reruns=world.budget.stats().freshReruns;
    assert.deepEqual(await pair(),["CLOSED","CLOSED"],"both documents come from the server together");
    assert.equal(world.budget.stats().freshReruns,reruns+1,"exactly one fresh re-run");
    // Unchanged documents keep their cheap reuse (no re-run).
    await world.advance(20000);
    assert.deepEqual(await pair(),["CLOSED","CLOSED"]);
    assert.equal(world.budget.stats().freshReruns,reruns+1);
  });

  await check("FB2d","a fresh re-run does not start a cascade: another screen's forgotten but unchanged documents do not count as changed",async()=>{
    const world=createWorld();seed(world);
    const screenA=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>[(await tx.get({path:TRANSFER})).data().phase,(await tx.get({path:SESSION})).data().status]);
    const screenB=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>[(await tx.get({path:SESSION})).data().status,Object.keys((await tx.get({path:RESULTS})).data().published).length]);
    await screenA();await screenB();
    await world.advance(20000);
    world.serverWrite(TRANSFER,{phase:"guess_entry",requests:{}});
    const reruns=world.budget.stats().freshReruns;
    world.budget.wantFresh(TRANSFER);  // the visible screen's 15 s check reads its own document fresh
    assert.deepEqual(await screenA(),["guess_entry","ACTIVE"]);
    assert.equal(world.budget.stats().freshReruns,reruns+1,"the changed document causes one fresh re-run");
    for(let tick=0;tick<4;tick+=1){
      await world.advance(5000);await screenB();
      await world.advance(10000);world.budget.wantFresh(TRANSFER);await screenA();
    }
    assert.equal(world.budget.stats().freshReruns,reruns+1,"no further re-runs while nothing changes");
  });

  await check("FB2f","season documents the Rules make immutable (published results, ACKNOWLEDGED commits) are read once per page",async()=>{
    const world=createWorld();seed(world);
    const COMMIT=`${RIVALRY}/seasonCommits/season_1`,ROLE=`${RESULTS}/roles/playerOne`;
    world.serverWrite(RESULTS,{revision:2,published:{daniel:true,nik:true}});
    world.serverWrite(ROLE,{total:9});
    world.serverWrite(COMMIT,{phase:"ACKNOWLEDGED",revision:3});
    const history=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>{for(const p of [RESULTS,ROLE,COMMIT])await tx.get({path:p});return true;});
    await history();
    const before=world.meter.reads;
    await world.advance(10*60000);world.budget.wantFresh();await history();
    world.setVisible(false);world.setVisible(true);await history();
    assert.equal(world.meter.reads-before,0,"immutable season documents are not read again (10 minutes later, after a fresh ask, after the tab returns)");
    // A commit that is still COMMITTED (or results at revision 1) can change, so it is read again as before.
    world.serverWrite(COMMIT,{phase:"COMMITTED",revision:2});world.budget.reset();
    const mutable=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:COMMIT})).data().phase);
    await mutable();const mark=world.meter.reads;
    await world.advance(70000);await mutable();
    assert.equal(world.meter.reads-mark,1,"a commit that is not yet ACKNOWLEDGED is re-read after the reuse window");
  });

  await check("FB2c","a rivalry that is still pending its pair is read fresh on every check, so the partner's join shows at once",async()=>{
    const world=createWorld();seed(world);
    world.serverWrite(RIVALRY,{status:"PENDING",data:{connectionState:"pending-pair"}});
    const read=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:RIVALRY})).data().data.connectionState);
    assert.equal(await read(),"pending-pair");
    await world.advance(3000);
    world.serverWrite(RIVALRY,{status:"ACTIVE",data:{connectionState:"active"}});
    assert.equal(await read(),"active","a quiet check 3 s later already sees the partner's join");
    const before=world.meter.reads;
    await world.advance(15000);await read();
    assert.equal(world.meter.reads,before,"once the pair is active the root document is reused quietly again (next 15 s poll)");
  });

  await check("FB3","Transfer waiting screen, both visible: <= budget reads/min with the listener, 0 writes, and a partner move reaches it within 1 s",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"transfer",watched:TRANSFER,context:[RIVALRY,SESSION]});
    screen.start();
    await world.advance(10000);
    assert.equal(world.activeListeners().length,1,"one wait-point listener attached while the screen waits");
    assert.equal(world.activeListeners()[0].path,TRANSFER);
    const rate=await perMinute(world,5);
    assert.ok(rate.reads<=BUDGET.waitingVisibleReadsPerMinute,`waiting Transfer screen reads ${rate.reads}/min (budget ${BUDGET.waitingVisibleReadsPerMinute})`);
    assert.equal(rate.writes,BUDGET.idleWritesPerMinute,"a waiting screen writes nothing");
    assert.equal(rate.commits,0,"a waiting screen sends no commit RPC");
    // Partner taps (another browser writes the shared document).
    world.serverWrite(TRANSFER,{phase:"guess_entry",requests:{daniel:true,nik:true}});
    const tapAt=world.clock.now;
    let seenAt=null;
    for(let step=0;step<40&&seenAt===null;step+=1){await world.advance(50);if(screen.seen&&screen.seen.phase==="guess_entry")seenAt=world.clock.now;}
    assert.ok(seenAt!==null,"the waiting screen saw the partner's move");
    assert.ok(seenAt-tapAt<=BUDGET.partnerUpdateMs,`partner update reached the waiting screen in ${seenAt-tapAt} ms`);
    // The context documents of the wait (rivalry/session) are read fresh after the change, never stale.
    world.serverWrite(SESSION,{status:"ACTIVE",note:"changed with the move"});
    world.serverWrite(TRANSFER,{phase:"signing_entry",requests:{}});
    let freshSession=false;
    for(let step=0;step<40&&!freshSession;step+=1){await world.advance(50);freshSession=screen.seen&&screen.seen.phase==="signing_entry";}
    assert.ok(freshSession,"second partner move also reached the screen within 2 s");
    screen.stop();
    await world.advance(8000);
    assert.equal(world.activeListeners().length,0,"leaving the waiting screen detaches the listener");
  });

  await check("FB4","a hidden tab reads nothing and drops its listener; returning re-reads once and re-attaches",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"season-results",watched:RESULTS,context:[RIVALRY,SESSION]});
    screen.start();
    await world.advance(20000);
    assert.equal(world.activeListeners().length,1);
    world.setVisible(false);
    assert.equal(world.activeListeners().length,0,"hiding the tab detaches the listener at once");
    const hidden=await perMinute(world,10);
    assert.equal(hidden.reads,BUDGET.hiddenReadsPerMinute,`hidden tab reads ${hidden.reads}/min`);
    assert.equal(hidden.writes,0,"hidden tab writes nothing");
    // The partner publishes while this tab is hidden.
    world.serverWrite(RESULTS,{published:{daniel:true}});
    world.setVisible(true);
    const before=world.meter.reads;
    await world.advance(3100);
    assert.deepEqual(screen.seen,{published:{daniel:true}},"returning to the tab shows the partner's update from a fresh read");
    assert.ok(world.meter.reads-before>=1,"returning re-reads from the server");
    assert.equal(world.activeListeners().length,1,"returning re-attaches the listener");
    screen.stop();
  });

  await check("FB4b","a screen that was waiting when the tab was hidden catches up with one check the moment it is visible again",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"season-commit",watched:RESULTS,context:[RIVALRY,SESSION]});
    screen.start();
    await world.advance(20000);
    world.setVisible(false);
    await world.advance(5*60000);
    world.serverWrite(RESULTS,{published:{daniel:true,nik:true}});
    const before=world.meter.reads;
    world.setVisible(true);
    await world.advance(200);  // well before the screen's next 3 s check
    assert.deepEqual(screen.seen,{published:{daniel:true,nik:true}},"the waiting screen shows the partner's move right after the tab is visible again");
    assert.ok(world.meter.reads-before<=3,`one catch-up check reads each of its 3 documents at most once (read ${world.meter.reads-before})`);
    const after=await perMinute(world,2);
    assert.ok(after.reads<=BUDGET.waitingVisibleReadsPerMinute,`after the catch-up the screen is back within the waiting budget (${after.reads}/min)`);
    screen.stop();
  });

  await check("FB4c","after the listener sees the partner's move, the follow-on checks of other screens reuse what the chain just read",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"season-commit",watched:RESULTS,context:[RIVALRY,SESSION]});
    screen.start();
    await world.advance(20000);
    world.budget.wantFresh();  // as in a fast lane: without the chain window every read below would go to the server
    world.serverWrite(RESULTS,{published:{daniel:true,nik:true}});
    await world.advance(300);
    assert.deepEqual(screen.seen,{published:{daniel:true,nik:true}},"the listener wakes the waiting screen");
    const before=world.meter.reads;
    const follow=()=>world.services.firestoreSdk.runTransaction(world.db,async tx=>{await tx.get({path:RIVALRY});await tx.get({path:SESSION});return true;});
    for(const gap of [800,2200,2400]){await world.advance(gap);await follow();}
    assert.equal(world.meter.reads-before,0,`scoring, history and the final result reuse the chain's fresh reads (read ${world.meter.reads-before})`);
    await world.advance(7000);world.budget.wantFresh();await follow();
    assert.equal(world.meter.reads-before,2,"after the 6 s chain window a fresh check reads again");
    screen.stop();
  });

  await check("FB5","a screen with only the 15 s poll stays within the idle budget; nothing writes while idle",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"home",watched:SESSION,context:[RIVALRY,"accounts/nik"],fast:false});
    screen.start();
    await world.advance(30000);
    const rate=await perMinute(world,10);
    assert.ok(rate.reads<=BUDGET.idleVisibleReadsPerMinute,`idle screen reads ${rate.reads}/min (budget ${BUDGET.idleVisibleReadsPerMinute})`);
    assert.equal(rate.writes,0);assert.equal(rate.commits,0);
    assert.equal(world.activeListeners().length,0,"a screen that is not waiting holds no listener");
    screen.stop();
  });

  await check("FB6","listener drops or errors: the 3 s check takes over within one tick, stays within today's cadence, and no stale data is served",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"transfer",watched:TRANSFER,context:[RIVALRY,SESSION]});
    screen.start();
    await world.advance(10000);
    world.failListeners();
    assert.equal(world.budget.stats().listenerFallbacks,1);
    world.serverWrite(TRANSFER,{phase:"completed",requests:{}});
    const at=world.clock.now;
    let seenAt=null;
    for(let step=0;step<80&&seenAt===null;step+=1){await world.advance(50);if(screen.seen&&screen.seen.phase==="completed")seenAt=world.clock.now;}
    assert.ok(seenAt!==null&&seenAt-at<=3100,`after a dropped listener the 3 s check still delivers the update (${seenAt-at} ms)`);
    const rate=await perMinute(world,0.9);
    assert.ok(rate.reads<=BUDGET.waitingFallbackReadsPerMinute,`fallback reads ${rate.reads}/min (budget ${BUDGET.waitingFallbackReadsPerMinute})`);
    assert.equal(world.activeListeners().length,0,"no re-attach inside the 60 s back-off");
    await world.advance(15000);
    assert.equal(world.activeListeners().length,1,"the listener comes back after the back-off");
    // A cached (offline) delivery never serves the watched document.
    world.cacheDeliver(TRANSFER);
    world.serverWrite(TRANSFER,{phase:"window",requests:{}});
    await world.advance(3100);
    assert.equal(screen.seen.phase,"window");
    screen.stop();
  });

  await check("FB6b","r84: listener down, 15 s checks of a waiting screen re-read only the waited document; the partner's move still refreshes the rest",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"results",watched:TRANSFER,context:[RIVALRY,SESSION],fast:false,slow:false});
    const ask=()=>world.budget.watchWaitPoint("results",TRANSFER,()=>{});
    await screen.tick();
    for(let index=0;index<4;index+=1){ask();await world.advance(2500);}
    world.failListeners();
    assert.equal(world.budget.stats().listenerFallbacks,1,"the wait listener was attached and dropped");
    await screen.tick();
    // The waiting module asks every 3 s but (past its fast window) reads only on its 15 s poll.
    const before=world.meter.reads;
    for(let second=3;second<=45;second+=3){await world.advance(3000);ask();if(second%15===0)await screen.tick();}
    assert.ok(world.meter.reads-before>=3,"the waited document is read fresh on every 15 s check");
    assert.ok(world.meter.reads-before<=4,`the other documents keep their quiet copies (${world.meter.reads-before} reads for 3 checks; was 9)`);
    // The partner's move changes the waited document and another one. The waiting check reads only its document; another
    // screen that reads only the other document must not get its old quiet copy afterwards.
    world.serverWrite(TRANSFER,{phase:"completed",requests:{}});world.serverWrite(SESSION,{status:"CLOSING"});
    await world.advance(3000);ask();
    const phase=await world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:TRANSFER})).data().phase);
    assert.equal(phase,"completed");
    const session=await world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path:SESSION})).data().status);
    assert.equal(session,"CLOSING","no screen acts on a copy older than the partner's move");
    screen.stop();
  });

  await check("FB16","r84 read brake: an idle page whose checks loop is slowed to one read per document per 15 s; a tap, writes and the listener stay instant; the day count persists and resets at the Google day",async()=>{
    const storage=new Map();
    const world=createWorld({storage});seed(world);
    // An unknown loop: one background check re-reads the same documents every 500 ms, nobody taps.
    const loopFor=async ms=>{for(const end=world.clock.now+ms;world.clock.now<end;){world.budget.wantFresh();await world.services.firestoreSdk.runTransaction(world.db,async tx=>{await tx.get({path:RIVALRY});await tx.get({path:SESSION});});await world.advance(500);}};
    await loopFor(5*60000);
    assert.ok(world.budget.braking(),"the brake is on after the loop has read far above normal with nobody tapping");
    const braked=world.meter.reads;
    await loopFor(60000);
    assert.ok(world.meter.reads-braked<=10,`braked loop reads ${world.meter.reads-braked}/min (two documents, one read each per 15 s at most)`);
    assert.ok(world.budget.stats().brakeTrips>=1);
    // A tap releases the brake at once: the next check reads fresh.
    world.input();const tapped=world.meter.reads;
    await world.services.firestoreSdk.runTransaction(world.db,async tx=>{await tx.get({path:SESSION});});
    assert.equal(world.meter.reads-tapped,1,"right after a tap the check reads the server even while the loop history is heavy");
    assert.equal(world.budget.braking(),false,"no brake within a minute of a tap");
    // The day count: every server read is counted and saved; a reload on the same Google day keeps it; a new day starts at 0.
    let today=world.budget.readsToday();
    assert.ok(today.reads>=world.budget.stats().serverReads,"every server read counts toward today");
    assert.equal(today.freeReadsPerDay,50000);
    // Codex #994: listeners outside this layer (season-commit wait context, Home JOIN note) report their server deliveries.
    world.budget.countListenerRead();world.budget.countListenerRead();
    assert.equal(world.budget.readsToday().reads,today.reads+2,"outside listener deliveries count toward today");
    today=world.budget.readsToday();
    world.setVisible(false);
    const saved=JSON.parse(storage.get("careerModeFirestoreReadsDay"));
    assert.equal(saved.reads,today.reads,"hiding the page saves today's count");
    const reloaded=createWorld({storage,now:world.clock.now});
    assert.equal(reloaded.budget.readsToday().reads,today.reads,"a reload on the same day keeps the count");
    const tomorrow=createWorld({storage,now:world.clock.now+24*3600000});
    assert.equal(tomorrow.budget.readsToday().reads,0,"the next Google day starts at 0");
  });

  await check("FB16b","r84 read brake never slows a partner move seen by a healthy wait listener",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"transfer",watched:TRANSFER,context:[RIVALRY,SESSION]});
    screen.start();
    // Heavy unrelated reading with nobody tapping trips the brake while the listener is healthy.
    for(let index=0;index<200;index+=1){world.budget.wantFresh();await world.services.firestoreSdk.runTransaction(world.db,async tx=>{await tx.get({path:`${RIVALRY}/noise/n${index}`});});}
    await world.advance(61000);
    assert.ok(world.budget.braking(),"brake on");
    world.serverWrite(TRANSFER,{phase:"completed",requests:{}});
    const at=world.clock.now;let seenAt=null;
    for(let step=0;step<40&&seenAt===null;step+=1){await world.advance(50);if(screen.seen&&screen.seen.phase==="completed")seenAt=world.clock.now;}
    assert.ok(seenAt!==null&&seenAt-at<=1000,`the listener still delivers the partner's move at once (${seenAt===null?"never":seenAt-at+" ms"})`);
    screen.stop();
  });
  await check("FB16c","r86 seasons left today: each season seen ACKNOWLEDGED records its billed game reads, the estimate follows that cost for both devices, a reload or an old season never counts twice, and the next day starts from the last day's cost",async()=>{
    const DEFAULT=Number(/FSB_DEFAULT_SEASON_BILLED=(\d+);/.exec(require("fs").readFileSync(require("path").join(__dirname,"..","..","js","sparkPrivatePairing.js"),"utf8"))[1]);
    const storage=new Map();
    const world=createWorld({storage});seed(world);
    const before=world.budget.seasonsLeftToday();
    assert.equal(before.basis,"estimate","before any season is played the CE2PG measured cost is used");
    assert.equal(before.billedPerSeason,DEFAULT*2,"the measured cost of one season on one device, for both devices");
    assert.equal(before.seasons,Math.floor(50000/(DEFAULT*2)));
    // countListenerRead(): one outside listener delivery is one document read and no lookups.
    for(let i=0;i<100;i++)world.budget.countListenerRead();
    assert.equal(world.budget.noteSeasonDone("pair_x|1",true),true);
    let left=world.budget.seasonsLeftToday();
    assert.equal(left.basis,"today");
    assert.equal(left.billedPerSeason,100*2,"one season's billed reads on this device, for both devices");
    assert.equal(left.seasons,Math.floor((50000-left.billedToday)/(100*2)));
    assert.equal(world.budget.noteSeasonDone("pair_x|1",true),false,"the same season never counts twice");
    for(let i=0;i<300;i++)world.budget.countListenerRead();
    assert.equal(world.budget.noteSeasonDone("pair_x|0",false),true,"a commit first seen already ACKNOWLEDGED only moves the mark");
    assert.equal(world.budget.seasonsLeftToday().billedPerSeason,100*2,"its unknown cost is not recorded");
    for(let i=0;i<200;i++)world.budget.countListenerRead();
    world.budget.noteSeasonDone("pair_x|2",true);
    left=world.budget.seasonsLeftToday();
    assert.equal(left.billedPerSeason,150*2,"the cost is the average of the seasons played (100 and 200 billed)");
    assert.equal(left.billedToday,world.budget.readsToday().billedEstimate,"today's use counts both devices, every read of the day");
    const reloaded=createWorld({storage,now:world.clock.now});
    assert.equal(reloaded.budget.noteSeasonDone("pair_x|2",true),false,"a reload remembers the seasons already counted");
    assert.equal(reloaded.budget.seasonsLeftToday().billedPerSeason,left.billedPerSeason);
    const tomorrow=createWorld({storage,now:world.clock.now+24*3600000});
    const next=tomorrow.budget.seasonsLeftToday();
    assert.equal(next.basis,"earlier","the next day starts from the last day's cost");
    assert.equal(next.billedPerSeason,left.billedPerSeason);
    assert.equal(next.seasons,Math.floor(50000/left.billedPerSeason));
    // Codex #999: a season that runs past the Google day keeps its reads from before the reset.
    const split=new Map();const lateDay=createWorld({storage:split});seed(lateDay);
    lateDay.budget.noteSeasonDone("pair_y|1",false);
    for(let i=0;i<699;i++)lateDay.budget.countListenerRead();
    lateDay.setVisible(false);
    const after=createWorld({storage:split,now:lateDay.clock.now+24*3600000});
    after.budget.countListenerRead();
    after.budget.noteSeasonDone("pair_y|2",true);
    assert.equal(after.budget.seasonsLeftToday().billedPerSeason,700*2,"the whole season's billed reads count, before and after the reset");
  });

  await check("FB7","a listener that falls behind the server is dropped within 5 s and the screen reads the server",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"season-commit",watched:RESULTS,context:[RIVALRY]});
    screen.start();
    await world.advance(10000);
    assert.equal(world.activeListeners().length,1);
    // Silence the listener (no deliveries), then change the server.
    const listener=world.activeListeners()[0];listener.next=()=>{};
    world.serverWrite(RESULTS,{published:{daniel:true,nik:true}});
    await world.advance(40000);  // the 30 s confirm read sees the newer server copy; 5 s later the listener is dropped
    assert.deepEqual(screen.seen,{published:{daniel:true,nik:true}},"the screen got the server copy");
    assert.ok(world.budget.stats().listenerFallbacks>=1,"the lagging listener was dropped");
    screen.stop();
  });

  await check("FB8","at most one listener per page; the other waiting screen keeps fresh 3 s checks and gets the listener once the first lets go",async()=>{
    const world=createWorld();seed(world);
    const transfer=createScreen(world,{owner:"transfer",watched:TRANSFER,context:[]});
    const results=createScreen(world,{owner:"season-results",watched:RESULTS,context:[]});
    transfer.start();results.start();
    await world.advance(12000);
    assert.equal(world.activeListeners().length,1,"only one listener at a time");
    const held=world.activeListeners()[0].path;
    // The screen that did not get the listener keeps its fresh 3 s check: a partner move on its document shows within 3 s.
    const other=held===TRANSFER?{path:RESULTS,screen:results,data:{published:{daniel:true,nik:true}}}:{path:TRANSFER,screen:transfer,data:{phase:"completed",requests:{}}};
    world.serverWrite(other.path,other.data);
    const at=world.clock.now;let seenAt=null;
    for(let step=0;step<80&&seenAt===null;step+=1){await world.advance(50);if(JSON.stringify(other.screen.seen)===JSON.stringify(other.data))seenAt=world.clock.now;}
    assert.ok(seenAt!==null&&seenAt-at<=3100,`a waiting screen without the listener still sees the partner within 3 s (${seenAt===null?"never":seenAt-at+" ms"})`);
    (held===TRANSFER?transfer:results).stop();
    await world.advance(10000);
    assert.equal(world.activeListeners().length,1);
    assert.notEqual(world.activeListeners()[0].path,held,"the other wait point attaches after the first one leaves");
    transfer.stop();results.stop();
  });

  await check("FB9","resource-exhausted pauses all traffic (10, then 20 min), shows the exact message once, and wakes the screens after",async()=>{
    const world=createWorld();seed(world);
    const screen=createScreen(world,{owner:"transfer",watched:TRANSFER,context:[RIVALRY,SESSION]});
    screen.start();
    await world.advance(10000);
    world.setQuota(true);
    world.failListeners();
    await world.advance(3100);
    assert.equal(world.budget.paused(),true,"quota error pauses the page");
    assert.equal(world.budget.quotaMessage(),QUOTA_TEXT);
    assert.equal(world.budget.quotaMessageText,QUOTA_TEXT);
    assert.equal(world.document.documentElement.dataset.firestoreQuota,"paused");
    assert.ok(world.events.some(event=>event.type==="career-mode-firestore-quota"&&event.detail.paused===true&&event.detail.message===QUOTA_TEXT));
    assert.ok(!/upgrade|billing|blaze|pay/i.test(QUOTA_TEXT),"the message never suggests upgrading or paying");
    const reads=world.meter.reads,transactions=world.meter.transactions;
    await world.advance(9*60000);
    assert.equal(world.meter.reads,reads,"no reads while paused");
    assert.equal(world.meter.transactions,transactions,"no server transactions (no retry loop) while paused");
    assert.equal(world.activeListeners().length,0,"no listener while paused");
    await assert.rejects(world.services.firestoreSdk.runTransaction(world.db,async tx=>tx.get({path:RIVALRY})),error=>error.code==="resource-exhausted"&&error.message===QUOTA_TEXT);
    world.setQuota(false);
    await world.advance(61000+50);
    assert.equal(world.budget.paused(),false,"the pause ends after 10 minutes");
    assert.ok(world.events.some(event=>event.type==="career-mode-firestore-quota"&&event.detail.paused===false),"screens are told to resume");
    assert.equal(world.document.documentElement.dataset.firestoreQuota,undefined);
    await world.advance(6000);
    assert.ok(world.meter.reads>reads,"the waiting screen reads again after the pause");
    world.setQuota(true);
    await world.advance(31000);  // the next server read (context documents, or the 30 s confirm of the watched one) trips again
    assert.equal(world.budget.state().step,1,"a second trip within 2 h pauses for 20 minutes");
    assert.ok(world.budget.state().until-world.clock.now>19*60000);
    screen.stop();
  });

  await check("FB10","every connected module goes through the budget layer; wait points ask for the listener; device re-checks are capped",async()=>{
    const wrapped=["persistentNikDanielPair","productionSharedCanonicalScoring","productionSharedCareerStart","productionSharedHistoryConvergence","productionSharedMultiSeasonProgression","productionSharedSeasonCommit","productionSharedSeasonResults","productionSharedShowdownSetup","productionSharedTerminalClose","productionSharedTransferChallenge","seasonFinalV10","rivalryLegacyV10","sparkConnectedAccount","sparkConnectedRivalry","sparkPrivatePairing","sparkRemoteJoining"];
    for(const name of wrapped){
      const text=fs.readFileSync(path.join(ROOT,"js",`${name}.js`),"utf8");
      assert.match(text,/CareerModeFirestoreBudget\?\.services\|\|\(s=>s\)\)\(await /,`${name}.js wraps its Firestore services`);
    }
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT,"js/onlinePlayerIdentity.js"),"utf8"),/revokeDevice|firebaseSdk\.|runTransaction|getDoc\(/,"identity no longer performs Firestore IO after removal of test-only Forget Device");
    const waitPoints={productionSharedTransferChallenge:"pstc",productionSharedSeasonResults:"pssr",productionSharedSeasonCommit:"pssc",productionSharedCanonicalScoring:"pcsc",productionSharedCareerStart:"pcst"};
    for(const [name,prefix] of Object.entries(waitPoints)){
      const text=fs.readFileSync(path.join(ROOT,"js",`${name}.js`),"utf8");
      assert.match(text,new RegExp(`function ${prefix}FastTick\\(\\)\\{${prefix}WatchWait\\(\\);`),`${name}.js asks for the wait-point listener on every fast check`);
      assert.match(text,/visibilityState==="hidden"\?null/,`${name}.js releases the listener when hidden`);
      assert.match(text,/FAST_POLL_MS=3000/,`${name}.js keeps the 3 s fast check as the fallback`);
    }
    assert.match(source,/const DEVICE_REVERIFY_MS=10\*60\*1000;/,"device registration is re-verified at most every 10 minutes");
    assert.ok(!/setInterval\(/.test(BUDGET_SOURCE),"the budget layer starts no interval of its own");
  });

  // r79 PR3: Nik's pair module in the budget sandbox, paired as playerTwo; serverReads counts reads that reached the server.
  async function nikPairWorld(){
    // The pair module runs in the same sandbox as the budget layer, so its reads go through the real budget wrapper.
    const world=createWorld(),{sandbox}=world,inbox="accounts/nik/partnerInbox/current",partner="accounts/nik/partner/current";
    const revive=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value),(_key,item)=>item&&typeof item==="object"&&"__ms" in item?{toMillis:()=>item.__ms}:item);
    const serverReads={};
    const listeners={active:0,max:0,attached:0};
    const onSnapshot=(ref,options,next,error)=>{listeners.active+=1;listeners.attached+=1;listeners.max=Math.max(listeners.max,listeners.active);let open=true;
      const off=world.sdk.onSnapshot(ref,options,snapshot=>{if(!open)return;serverReads[ref.path]=(serverReads[ref.path]||0)+1;next({...snapshot,data:()=>revive(snapshot.data())});},error);
      return()=>{if(open){open=false;listeners.active-=1;}off();};};
    const sdk={...world.sdk,onSnapshot,doc:(_db,...segments)=>({path:segments.join("/")}),serverTimestamp:()=>({__serverTimestamp:true}),Timestamp:{fromMillis:ms=>({__ms:ms})},runTransaction:(db,fn)=>world.sdk.runTransaction(db,transaction=>fn({get:async ref=>{const snapshot=await transaction.get(ref);serverReads[ref.path]=(serverReads[ref.path]||0)+1;return{...snapshot,data:()=>revive(snapshot.data())};},set:(ref,value)=>transaction.set(ref,value)}))};
    // No Connect Players screen on Home: the panel render finds nothing and draws nothing.
    Object.assign(world.document,{querySelector:()=>null,getElementById:()=>null,querySelectorAll:()=>[],dispatchEvent:()=>true});
    Object.assign(sandbox,{TextEncoder,crypto:require("node:crypto").webcrypto,
      CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
      CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"nik"})},
      CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"})},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,firestore:world.db,firestoreSdk:sdk,auth:{currentUser:{uid:"nik"}}})}});
    vm.runInContext(fs.readFileSync(path.join(ROOT,"js/persistentNikDanielPair.js"),"utf8"),sandbox,{filename:"js/persistentNikDanielPair.js"});
    const pair=sandbox.CareerModePersistentNikDanielPair;
    world.serverWrite(partner,{schemaVersion:1,partnerAccountId:"daniel",myRole:"playerTwo",pairedViaRivalryId:`pair_1${"0".repeat(63)}`,pairedAt:{__ms:1},active:true,updatedAt:{__ms:1}});
    await pair.initialize();  // as on page load: no Showdown link yet
    return {world,pair,serverReads,inbox,partner,listeners};
  }
  await check("FB11","r79 PR3 JOIN note: Nik's Home reads it at most once per 30 s (fresh, never cached past a write), never while hidden; the partner record once per page",async()=>{
    const {world,pair,serverReads,inbox,partner}=await nikPairWorld();
    for(let i=0;i<5;i+=1)await pair.readPartnerRecord();
    assert.equal(serverReads[partner],1,"the partner record is read once per page");
    // Home shown (screen changes, tab returns, taps) every 5 s for 10 minutes while visible: one note read per 30 s at most.
    const homeShown=async minutes=>{for(let t=0;t<minutes*60000;t+=5000){void pair.readJoinNote();await world.advance(5000);}};
    await homeShown(10);
    assert.ok(serverReads[inbox]>=19&&serverReads[inbox]<=21,`10 visible minutes of Home: ${serverReads[inbox]} note reads (budget: one per 30 s)`);
    // Daniel's START writes the note: the next memo-expired Home shown reads it fresh (the budget layer never serves an old copy).
    const rivalryId=`pair_3${"1".repeat(63)}`;
    world.serverWrite(inbox,{schemaVersion:1,rivalryId,totalSeasons:3,fromAccountId:"daniel",createdAt:{__ms:world.clock.now},expiresAt:{__ms:world.clock.now+20*60000}});
    const before=serverReads[inbox];let seenAfter=null;
    for(let t=0;t<=30000&&seenAfter===null;t+=5000){await pair.readJoinNote();if(pair.getJoinNoteState(world.clock.now).note?.rivalryId===rivalryId)seenAfter=t;else await world.advance(5000);}
    assert.ok(seenAfter!==null&&seenAfter<=30000,`Daniel's note reaches Nik's Home within one memo window (${seenAfter} ms)`);
    assert.equal(serverReads[inbox]-before,1,"one read found it");
    // hidden: nothing is read however often the app asks
    world.setVisible(false);const hidden=serverReads[inbox];
    for(let t=0;t<5*60000;t+=5000){await pair.readJoinNote();await world.advance(5000);}
    assert.equal(serverReads[inbox],hidden,"a hidden tab reads no note");
    world.setVisible(true);
    assert.equal(serverReads[partner],1,"still one partner read for the whole page");
    assert.equal(world.meter.docWrites,0,"reading the note writes nothing");
  });

  await check("FB11b","Nik 2026-10-18 (check by itself): ONE note listener while Home is shown and visible; reads only on attach and on change; none hidden or off Home; JOIN with no tap; 10 minutes per visit; errors fall back to the 30 s memo",async()=>{
    const {world,pair,serverReads,inbox,listeners}=await nikPairWorld();let home=true;const isHomeShown=()=>home;
    const reads=()=>serverReads[inbox]||0;
    await pair.readPartnerRecord();
    // Home shown: attach. Its first delivery IS the read; taps / tab returns every 5 s on Home cost nothing more.
    assert.equal(await pair.watchJoinNote({isHomeShown}),true,"the listener delivered the note from the server");
    assert.equal(reads(),1,"attach costs one read");
    for(let t=0;t<9*60000;t+=5000){await pair.watchJoinNote({isHomeShown});await pair.readJoinNote();await world.advance(5000);}
    assert.equal(listeners.max,1,"never more than one listener");
    assert.equal(listeners.attached,1,"Home shown again and again keeps the same listener");
    assert.equal(reads(),1,"9 quiet minutes on Home: no further reads (nothing changed)");
    // after 10 minutes from the last Home visit the listener detaches
    await world.advance(11*60000);
    assert.equal(listeners.active,0,"the listener detaches 10 minutes after the Home visit");
    // a new Home visit re-attaches; hiding the tab detaches at once and nothing is read while hidden
    await pair.watchJoinNote({isHomeShown});assert.equal(listeners.active,1);let before=reads();
    world.setVisible(false);assert.equal(listeners.active,0,"hidden: detached at once");
    world.serverWrite(inbox,null);await world.advance(5*60000);
    for(let i=0;i<5;i+=1){await pair.readJoinNote();await pair.watchJoinNote({isHomeShown});}
    assert.equal(reads(),before,"hidden: no note reads at all");assert.equal(listeners.active,0);
    world.setVisible(true);await pair.watchJoinNote({isHomeShown});assert.equal(listeners.active,1,"tab visible again: re-attached");
    // leaving Home detaches; nothing is read off Home
    pair.stopJoinNoteWatch();home=false;before=reads();
    for(let i=0;i<5;i+=1)await pair.watchJoinNote({isHomeShown});await world.advance(5*60000);
    assert.equal(listeners.active,0,"off Home: no listener");assert.equal(reads(),before,"off Home: no reads");
    // Daniel's START writes the note while Nik sits on Home: JOIN with no tap, no tab event; then the listener detaches.
    home=true;await pair.watchJoinNote({isHomeShown});await world.advance(60000);before=reads();
    const rivalryId=`pair_3${"2".repeat(63)}`,writtenAt=world.clock.now;
    world.serverWrite(inbox,{schemaVersion:1,rivalryId,totalSeasons:3,fromAccountId:"daniel",createdAt:{__ms:writtenAt},expiresAt:{__ms:writtenAt+20*60000}});
    await world.advance(0);
    assert.equal(pair.getJoinNoteState(world.clock.now).note?.rivalryId,rivalryId,"JOIN shows as soon as the note is written");
    assert.equal(reads()-before,1,"the change costs one delivery");
    assert.equal(listeners.active,0,"JOIN showing: the listener detaches");
    await world.advance(5*60000);assert.equal(reads()-before,1,"nothing more is read while JOIN shows");
    assert.equal(world.meter.docWrites,0,"watching writes nothing");
  });

  await check("FB11c","a note listener that errors falls back to the memoised read: at most once per 30 s, same stop rules, never a second listener",async()=>{
    const {world,pair,serverReads,inbox,listeners}=await nikPairWorld();let home=true;const isHomeShown=()=>home;
    const reads=()=>serverReads[inbox]||0;
    await pair.readPartnerRecord();
    assert.equal(await pair.watchJoinNote({isHomeShown}),true);
    // the listen stream drops (as a denied or broken stream would): the one listener is gone and the memoised read takes over
    world.failListeners();await world.advance(0);
    assert.equal(listeners.active,0,"the failed listener is detached");
    assert.equal(pair.getJoinNoteWatch().mode,"fallback");
    assert.equal(await pair.watchJoinNote({isHomeShown}),false,"no live listener: the caller uses the memoised read");
    for(let t=0;t<9*60000;t+=5000){await pair.watchJoinNote({isHomeShown});await pair.readJoinNote();await world.advance(5000);}
    assert.ok(reads()<=20,`fallback: at most one read per 30 s over 9 minutes (${reads()})`);
    assert.ok(listeners.max<=1,"never a second listener");
    world.setVisible(false);const before=reads();await world.advance(5*60000);assert.equal(reads(),before,"fallback: none while hidden");world.setVisible(true);
    pair.stopJoinNoteWatch();home=false;const off=reads();await world.advance(5*60000);assert.equal(reads(),off,"fallback: none off Home");
  });

  await check("FB11d","Codex #903: a miss the listener delivered is never served as the 30 s memo once the listener is gone (Daniel may write right after)",async()=>{
    const {world,pair,serverReads,inbox}=await nikPairWorld();let home=true;const isHomeShown=()=>home;
    const reads=()=>serverReads[inbox]||0;
    await pair.readPartnerRecord();
    assert.equal(await pair.watchJoinNote({isHomeShown}),true);assert.equal(reads(),1);
    assert.equal(pair.getJoinNoteState().note,null,"the listener delivered a miss");
    pair.stopJoinNoteWatch();home=false;           // Nik leaves Home
    const rivalryId=`pair_3${"4".repeat(63)}`;
    world.serverWrite(inbox,{schemaVersion:1,rivalryId,totalSeasons:3,fromAccountId:"daniel",createdAt:{__ms:world.clock.now},expiresAt:{__ms:world.clock.now+20*60000}});
    await world.advance(1000);home=true;
    await pair.readJoinNote();                      // the next Home moment, 1 s later, without a listener
    assert.equal(reads(),2,"the listener's miss was not reused: one server read");
    assert.equal(pair.getJoinNoteState(world.clock.now).note?.rivalryId,rivalryId,"so Daniel's note shows JOIN");
  });

  await check("FB11e","Codex #904: switching apps (tab hidden -> visible) costs at most one note read per 30 s and never extends a running 10-minute Home visit",async()=>{
    const {world,pair,serverReads,inbox,listeners}=await nikPairWorld();let home=true;const isHomeShown=()=>home;
    const reads=()=>serverReads[inbox]||0;
    await pair.readPartnerRecord();
    assert.equal(await pair.watchJoinNote({isHomeShown}),true);assert.equal(reads(),1,"the Home visit attaches once");
    // 20 quick app switches inside 25 s: page memory answers, nothing is read, no listener piles up
    for(let i=0;i<20;i+=1){world.setVisible(false);await world.advance(500);world.setVisible(true);assert.notEqual(await pair.watchJoinNote({isHomeShown,resume:true}),false,"a quick return never falls back to a read");await world.advance(750);}
    assert.equal(reads(),1,"quick app switches inside 30 s read nothing");
    assert.ok(listeners.max<=1,"never a second listener");
    // still visible at the 30 s mark: the one deferred listener attaches (one read)
    await world.advance(30000);
    assert.equal(listeners.active,1,"re-attached once at the 30 s mark");assert.equal(reads(),2,"one read for that attach");
    // Codex #907: a tap (or a new Home visit) during a deferred return attaches at once and sees a note Daniel wrote meanwhile
    world.setVisible(false);await world.advance(1000);
    const tapId=`pair_3${"6".repeat(63)}`;world.serverWrite(inbox,{schemaVersion:1,rivalryId:tapId,totalSeasons:3,fromAccountId:"daniel",createdAt:{__ms:world.clock.now},expiresAt:{__ms:world.clock.now+20*60000}});
    world.setVisible(true);assert.equal(await pair.watchJoinNote({isHomeShown,resume:true}),"deferred","the quick return defers");
    assert.equal(await pair.watchJoinNote({isHomeShown}),true,"the tap attaches at once instead of waiting");
    assert.equal(pair.getJoinNoteState(world.clock.now).note?.rivalryId,tapId,"and sees Daniel's new note");
    assert.ok(listeners.max<=1,"still never a second listener");
    // JOIN is showing, so the listener has detached; start a fresh visit for the window check below
    world.serverWrite(inbox,null);await pair.readJoinNote({fresh:true});await world.advance(31000);await pair.watchJoinNote({isHomeShown});
    // the visit window is not restarted by tab returns: switching at 9:30 still ends the listener at 10:00 after the visit began
    await world.advance(9*60000);world.setVisible(false);world.setVisible(true);await pair.watchJoinNote({isHomeShown,resume:true});
    await world.advance(90000);
    assert.equal(listeners.active,0,"the 10-minute Home visit ends on time despite tab returns");
    const before=reads();for(let i=0;i<5;i+=1){world.setVisible(false);world.setVisible(true);await pair.watchJoinNote({isHomeShown,resume:true});await world.advance(1000);}
    assert.ok(reads()-before<=1,`after the visit ended, a tab return may start a new visit but 5 returns in 5 s cost at most one read (${reads()-before})`);
    assert.ok(listeners.max<=1,"never a second listener");
  });
  await check("FB12","r79 PR4 modes: the partner-side read is one get per page, only while this account's own record is active; the mode's marker read is one memoised get, only without a partner record; nothing is timed",async()=>{
    const revive=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value),(_key,item)=>item&&typeof item==="object"&&"__ms" in item?{toMillis:()=>item.__ms}:item);
    const record=(partnerAccountId,myRole,active)=>({schemaVersion:1,partnerAccountId,myRole,pairedViaRivalryId:`pair_1${"0".repeat(63)}`,pairedAt:{__ms:1},active,updatedAt:{__ms:1}});
    const MINE="accounts/nik/partner/current",THEIRS="accounts/daniel/partner/current",MARKER="accounts/nik/careerStart/current";
    async function page({mine,theirs,laterTheirs,laterOffline}){
      const world=createWorld(),{sandbox}=world,serverReads={},freshAsks=[];let offline=false;const count=p=>{serverReads[p]=(serverReads[p]||0)+1;};
      const sdk={...world.sdk,doc:(_db,...segments)=>({path:segments.join("/")}),serverTimestamp:()=>({__serverTimestamp:true}),Timestamp:{fromMillis:ms=>({__ms:ms})},
        runTransaction:(db,fn)=>world.sdk.runTransaction(db,transaction=>fn({get:async ref=>{if(offline&&ref.path===THEIRS)throw Object.assign(new Error("offline"),{code:"unavailable"});const snapshot=await transaction.get(ref);count(ref.path);return{...snapshot,data:()=>revive(snapshot.data())};},set:(ref,value)=>transaction.set(ref,value)})),
        getDoc:async ref=>{count(ref.path);const entry=world.server.get(ref.path);return{exists:()=>Boolean(entry),data:()=>entry?revive(entry.data):undefined};}};
      Object.assign(world.document,{querySelector:()=>null,getElementById:()=>null,querySelectorAll:()=>[],dispatchEvent:()=>true});
      Object.assign(sandbox,{TextEncoder,crypto:require("node:crypto").webcrypto,loadRuntimeScript:async()=>true,CareerModeFirestoreBudget:{wantFresh:p=>freshAsks.push(p),readServerNext:p=>freshAsks.push(p)},
        CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",registered:true,accountId:"nik",managerId:"nik"})},
        CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"nik"})},
        CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"})},
        CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,firestore:world.db,firestoreSdk:sdk,auth:{currentUser:{uid:"nik"}}})}});
      for(const file of ["js/persistentNikDanielPair.js","js/careerStartMarker.js","js/showdownModes.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,file),"utf8"),sandbox,{filename:file});
      if(mine)world.serverWrite(MINE,mine);if(theirs)world.serverWrite(THEIRS,theirs);
      const pair=sandbox.CareerModePersistentNikDanielPair,modes=sandbox.CareerModeShowdownModes;
      await pair.initialize();modes.install();
      // Page load, Settings opened twice, START pressed twice: the same memoised questions.
      for(let i=0;i<5;i+=1){await modes.resolve();await pair.readPartnerSide();}
      const first={...serverReads};
      // Ten visible minutes on Home with screen changes: no timer reads anything.
      for(let t=0;t<10*60000;t+=5000){const event={type:"career-mode-screen-shown",detail:{screen:t%10000?"mainMenu":"settings"}};for(const fn of world.document.listeners[event.type]||[])fn(event);await world.advance(5000);}
      assert.ok((world.document.listeners["career-mode-screen-shown"]||[]).length>=1,"the modes module listens to screen changes");
      assert.deepEqual({...serverReads},first,"no read happens without a page load or a user action");
      assert.equal(world.meter.docWrites,0,"reading the mode writes nothing");
      const view=modes.getView(),side=pair.getPartnerSideState();
      // Codex #904: the partner unpairs on their phone after this page loaded. The memo keeps its answer; Daniel's START tap
      // (options.fresh) reads the partner's record once more and sees it.
      let later=null;if(laterTheirs){world.serverWrite(THEIRS,laterTheirs);const memo=(await pair.readPartnerSide()).status,memoReads=serverReads[THEIRS]||0;const fresh=(await pair.readPartnerSide({fresh:true})).status;later={memo,memoReads,fresh,freshReads:serverReads[THEIRS]||0,freshAsks:freshAsks.filter(p=>p===THEIRS).length};}
      if(laterOffline){offline=true;later={fresh:(await pair.readPartnerSide({fresh:true})).status};}
      return {reads:first,view,side,later};
    }
    const paired=await page({mine:record("daniel","playerTwo",true),theirs:record("nik","playerOne",true)});
    assert.equal(paired.reads[MINE],1,"own partner record: once per page");assert.equal(paired.reads[THEIRS],1,"partner side: once per page");
    assert.equal(paired.reads[MARKER]||0,0,"an active partner record proves real mode: no marker read");
    assert.equal(paired.view.mode,"real");assert.equal(paired.view.pairing,"paired");assert.equal(paired.side.status,"mutual");
    const unpairedLater=await page({mine:record("daniel","playerTwo",true),theirs:record("nik","playerOne",true),laterTheirs:record("nik","playerOne",false)});
    assert.deepEqual(unpairedLater.later,{memo:"mutual",memoReads:1,fresh:"unpaired",freshReads:2,freshAsks:1},"a later UNPAIR on the other phone: the memo stays one read, a START tap's fresh read is exactly one more, skips the budget's shared snapshot of that document, and sees it");
    const offlineLater=await page({mine:record("daniel","playerTwo",true),theirs:record("nik","playerOne",true),laterOffline:true});
    assert.equal(offlineLater.later.fresh,"unavailable","a START tap that cannot read the partner side says so instead of keeping the old answer");
    const startSource=fs.readFileSync(path.join(ROOT,"js/onlinePlayerIdentity.js"),"utf8");
    assert.match(startSource,/if\(state\.managerId==="daniel"&&typeof root\.CareerModePersistentNikDanielPair\?\.readPartnerSide==="function"\)\{const pair=root\.CareerModePersistentNikDanielPair;await pair\.readPartnerRecord\?\.\(\);await pair\.readPartnerSide\(\{fresh:true\}\);\}let decision=await which\.read\(root\);/,"Daniel's START tap reads the partner side fresh before deciding");
    assert.match(startSource,/if\(\(decision\.action==="new"\|\|decision\.action==="resume-waiting"&&!decision\.rivalryId\)&&state\.managerId==="daniel"&&typeof root\.CareerModePersistentNikDanielPair\?\.getPartnerSideState==="function"&&!\["mutual","not-paired"\]\.includes\(root\.CareerModePersistentNikDanielPair\.getPartnerSideState\(\)\?\.status\)\)throw new Error\(/,"Codex #915: an unanswered pairing check never starts a code, new or resumed code-less shell (fail closed)");
    const oneSided=await page({mine:record("daniel","playerTwo",true),theirs:record("nik","playerOne",false)});
    assert.equal(oneSided.reads[THEIRS],1);assert.equal(oneSided.view.pairing,"partner-unpaired");assert.equal(oneSided.side.status,"unpaired");
    const gone=await page({mine:record("daniel","playerTwo",true),theirs:null});
    assert.equal(gone.reads[THEIRS],1);assert.equal(gone.view.pairing,"partner-unpaired","a missing partner record (the Rules deny it) is unpaired");
    const unpaired=await page({mine:record("daniel","playerTwo",false),theirs:record("nik","playerOne",true)});
    assert.equal(unpaired.reads[THEIRS]||0,0,"my own record inactive: the partner side is never read");assert.equal(unpaired.reads[MARKER]||0,0,"an unpaired record still proves real mode: no marker read");
    assert.equal(unpaired.view.mode,"real");assert.equal(unpaired.view.pairing,"unpaired");
    const test=await page({mine:null,theirs:null});
    assert.equal(test.reads[THEIRS]||0,0,"no record: the partner side is never read");assert.equal(test.reads[MARKER],1,"the marker: one get per page, memoised across five asks");
    assert.equal(test.view.mode,"real");assert.equal(test.view.careerStarted,false);
  });

  await check("FB13","Codex #918: readServerNext(path) sends the next read of that document to the server, inside the 2 s window and past a read already in flight; once only, and other documents keep their copies",async()=>{
    const world=createWorld();seed(world);
    const read=path=>world.services.firestoreSdk.runTransaction(world.db,async tx=>(await tx.get({path})).data());
    await read(SESSION);await read(RIVALRY);const start=world.meter.reads;
    await world.advance(500);world.budget.readServerNext(SESSION);await read(SESSION);
    assert.equal(world.meter.reads-start,1,"inside the 2 s window the asked document still reads the server");
    await read(SESSION);await read(RIVALRY);
    assert.equal(world.meter.reads-start,1,"once only: the next reads of it, and other documents, reuse the copy");
    await world.advance(61000);const flight=world.meter.reads;
    const running=read(SESSION);world.budget.readServerNext(SESSION);const own=read(SESSION);await Promise.all([running,own]);
    assert.equal(world.meter.reads-flight,2,"a read already in flight is not shared with the asked read");
  });

  await check("FB14","r79 gallery: Nik waiting for Daniel's session pointer reads it fresh every 3 s even while another wait-point listener is healthy, and joins within one poll of Daniel publishing",async()=>{
    const world=createWorld();seed(world);
    // The previous Showdown's shared-setup screen keeps a healthy listener on this page (any listener puts the budget layer in
    // its 60 s quiet-reuse mode for documents the listener does not watch).
    const OLD_SETUP="rivalries/r0/sharedSetup/authoritative";world.serverWrite(OLD_SETUP,{phase:"LEAGUE_WHEEL_OPEN"});
    const setupScreen=createScreen(world,{owner:"shared-setup",watched:OLD_SETUP,context:[],slow:false});setupScreen.start();
    await world.advance(10000);
    assert.equal(world.budget.stats().watchHealthy,true,"the other screen's listener is healthy");
    const RIVAL="pair_"+"a".repeat(64),OFFER=`rivalries/${RIVAL}/sessionOffers/current`,SESSION_ID="session_"+"b".repeat(64),DEVICE="device_"+"c".repeat(32);
    // Remote Joining as Nik, on the same budget layer; the SDK hands out Timestamps (toMillis) like the web SDK.
    const stamp=value=>value&&typeof value==="object"&&Number.isFinite(value.epochMs)?{toMillis:()=>value.epochMs}:value;
    const rawSdk={...world.sdk,runTransaction:(db,fn)=>world.sdk.runTransaction(db,tx=>fn({...tx,get:async ref=>{const snapshot=await tx.get(ref);return {...snapshot,data:()=>{const data=snapshot.data();return data&&Object.fromEntries(Object.entries(data).map(([key,value])=>[key,stamp(value)]));}};}}))};
    const rawServices={ok:true,firestore:world.db,firestoreSdk:rawSdk,auth:{currentUser:{uid:"nik"}}};
    const joins=[];
    Object.assign(world.sandbox,{
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>rawServices},
      CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:"nik"})},
      CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
      CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:RIVAL,accountId:"nik",deviceId:DEVICE})},
      CareerModeSparkPrivateSession:{},
      CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
      CareerModeSparkStandardAuthPrivateSession:{
        normalizeSessionId:value=>value,
        readSession:async options=>({ok:true,sessionId:options.sessionId,state:"open",revision:0,expiresAtEpochMs:world.clock.now+4*3600000}),
        joinSession:async options=>{joins.push(world.clock.now);return {ok:true,sessionId:options.sessionId,state:"active",revision:1,expiresAtEpochMs:world.clock.now+4*3600000};}
      }
    });
    vm.runInContext(fs.readFileSync(path.join(ROOT,"js/sparkRemoteJoining.js"),"utf8"),world.sandbox,{filename:"sparkRemoteJoining.js"});
    const remote=world.sandbox.CareerModeSparkRemoteJoining;
    const readsBefore=world.meter.reads;
    await remote.autoConnect();
    assert.equal(remote.getState().auto,"waiting","no pointer yet: Nik waits for Daniel");
    await world.advance(7000);  // past the 5 s window a tap gives; Daniel's phone is still noticing the pairing
    const published=world.clock.now,waitingReads=world.meter.reads-readsBefore;
    world.serverWrite(OFFER,{schemaVersion:1,sessionId:SESSION_ID,hostAccountId:"daniel",expiresAt:{epochMs:published+4*3600000}});
    await world.advance(3500);
    assert.equal(joins.length,1,"Nik's next 3 s poll sees the pointer and joins (it was served a 60 s old copy before)");
    assert.ok(joins[0]-published<=3500,`joined ${joins[0]-published} ms after Daniel published`);
    assert.equal(remote.getState().sessionState,"active");
    assert.equal(remote.getState().auto,null,"the waiting state ends with the join");
    // Cost: while waiting, the pointer is read once per 3 s poll (the cadence it always had), never more.
    assert.ok(waitingReads<=4,`${waitingReads} reads in 7 s of waiting (autoConnect + two polls)`);
    setupScreen.stop();
  });

  await check("FB15","Codex #904 release review: a paired Daniel whose session pointer write fails keeps WAITING and publishes it again (3 s doubling to 60 s, visible tab only, sooner back online, 10 min) so Nik still joins; an unpaired Daniel keeps the session-code fallback. Codex #920: never over a newer live session, no rewrite after a lost answer, and reopening the panel restarts a retry that gave up",async()=>{
    const RIVAL="pair_"+"a".repeat(64),OFFER=`rivalries/${RIVAL}/sessionOffers/current`,SESSION_ID="session_"+"d".repeat(64),DEVICE="device_"+"e".repeat(32);
    // Remote Joining as Daniel (the host) on the budget layer; writes of the pointer fail `fail` times, then land.
    const daniel=({paired,fail,lost=0})=>{
      const world=createWorld();seed(world);
      let failures=fail,lostAnswers=lost;const offerWrites=[];const sessions={[SESSION_ID]:"open"};
      const rawSdk={...world.sdk,Timestamp:{fromMillis:ms=>({epochMs:ms})},serverTimestamp:()=>({serverTimestamp:true}),
        runTransaction:(db,fn)=>world.sdk.runTransaction(db,tx=>fn({...tx,get:async ref=>{const snapshot=await tx.get(ref);return {...snapshot,data:()=>{const data=snapshot.data();return data&&Object.fromEntries(Object.entries(data).map(([key,value])=>[key,value&&typeof value==="object"&&Number.isFinite(value.epochMs)?{toMillis:()=>value.epochMs}:value]));}};},set:(ref,data)=>{if(ref.path===OFFER){offerWrites.push(world.clock.now);if(failures>0){failures-=1;throw Object.assign(new Error("Failed to get document because the client is offline."),{code:"unavailable"});}}tx.set(ref,data);}})).then(value=>{if(lostAnswers>0&&offerWrites.length&&world.server.get(OFFER)){lostAnswers-=1;throw Object.assign(new Error("Deadline exceeded."),{code:"deadline-exceeded"});}return value;})};
      const rawServices={ok:true,firestore:world.db,firestoreSdk:rawSdk,auth:{currentUser:{uid:"daniel"}}};
      Object.assign(world.sandbox,{
        CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>rawServices},
        CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:"daniel"})},
        CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
        CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:RIVAL,accountId:"daniel",deviceId:DEVICE})},
        CareerModeSparkPrivateSession:{},
        CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"daniel"})},
        CareerModePersistentNikDanielPair:{getPartnerState:()=>paired?{status:"ready",accountId:"daniel",record:{active:true,partnerAccountId:"nik"}}:{status:"none"}},
        CareerModeSparkStandardAuthPrivateSession:{
          normalizeSessionId:value=>value,generateSessionId:()=>SESSION_ID,
          openSession:async options=>({ok:true,sessionId:options.sessionId,state:"open",revision:0,expiresAtEpochMs:world.clock.now+4*3600000}),
          readSession:async options=>{const known=sessions[options.sessionId];return known&&typeof known==="object"?known:{ok:true,sessionId:options.sessionId,state:known||"closed",revision:0,expiresAtEpochMs:world.clock.now+4*3600000};}
        }
      });
      vm.runInContext(fs.readFileSync(path.join(ROOT,"js/sparkRemoteJoining.js"),"utf8"),world.sandbox,{filename:"sparkRemoteJoining.js"});
      return {world,remote:world.sandbox.CareerModeSparkRemoteJoining,offerWrites,sessions,online:()=>{for(const fn of world.sandbox.windowListeners.online||[])fn();}};
    };
    const published=world=>world.server.get(OFFER)?.data?.sessionId===SESSION_ID;

    // A: two failed writes, then the third (3 s + 6 s later) lands; nothing more is written after that.
    {const {world,remote,offerWrites}=daniel({paired:true,fail:2});
      const result=await remote.autoConnect();
      assert.equal(result.kind,"hosted-publishing");
      assert.equal(remote.getState().auto,"waiting","Daniel keeps WAITING FOR NIK, never the dead-end session code");
      assert.doesNotMatch(remote.getState().message,/session code/i);
      assert.equal(published(world),false);
      await world.advance(3000);assert.equal(offerWrites.length,2,"second try 3 s later");assert.equal(published(world),false);
      await world.advance(6000);assert.equal(offerWrites.length,3,"third try 6 s after that");assert.equal(published(world),true,"the pointer lands, so Nik's 3 s poll finds it");
      await world.advance(20*60000);assert.equal(offerWrites.length,3,"no write once it has landed");
      assert.equal(remote.useManualCode().auto,"waiting","a paired account still has no session-code path");}

    // B: it never lands: at most one write per minute after the first minute, nothing past 10 min, and Daniel is told why.
    {const {world,remote,offerWrites}=daniel({paired:true,fail:Infinity});
      await remote.autoConnect();
      await world.advance(11*60000);
      assert.ok(offerWrites.length<=15,`${offerWrites.length} pointer writes in 11 min`);
      const count=offerWrites.length;await world.advance(30*60000);assert.equal(offerWrites.length,count,"the retry stops after 10 min");
      assert.equal(remote.getState().auto,"waiting");
      assert.match(remote.getState().message,/could not be reached[\s\S]*open the game again/);}

    // C: a hidden tab writes nothing; back on screen the retry continues.
    {const {world,remote,offerWrites}=daniel({paired:true,fail:1});
      await remote.autoConnect();world.setVisible(false);
      await world.advance(5*60000);assert.equal(offerWrites.length,1,"hidden: no writes");assert.equal(published(world),false);
      world.setVisible(true);await world.advance(60000);
      assert.equal(offerWrites.length,2);assert.equal(published(world),true);}

    // D: back online restarts the wait at 3 s instead of waiting out the 60 s step.
    {const {world,remote,offerWrites,online}=daniel({paired:true,fail:6});
      await remote.autoConnect();
      await world.advance(3000+6000+12000+24000+48000);assert.equal(offerWrites.length,6,"five retries, the next one a minute away");
      online();await world.advance(3000);
      assert.equal(offerWrites.length,7,"the online event tries again 3 s later");assert.equal(published(world),true);}

    // E: an account that is not permanently paired keeps today's fallback: Nik can still paste the code.
    {const {world,remote,offerWrites}=daniel({paired:false,fail:1});
      const result=await remote.autoConnect();
      assert.equal(result.kind,"hosted-manual");
      assert.equal(remote.getState().auto,null);assert.match(remote.getState().message,/Send Nik this session code/);
      await world.advance(5*60000);assert.equal(offerWrites.length,1,"no retry: the session code is the way in");}

    // F (Codex #920): after the 10 min give-up, reopening the player panel (autoConnect on the held session) starts again.
    {const {world,remote,offerWrites}=daniel({paired:true,fail:15});
      await remote.autoConnect();await world.advance(11*60000);
      assert.match(remote.getState().message,/could not be reached/);const before=offerWrites.length;
      const again=await remote.autoConnect();
      assert.equal(again.kind,"held-publishing","the held session publishes again instead of staying stuck");
      assert.equal(remote.getState().auto,"waiting");assert.doesNotMatch(remote.getState().message,/could not be reached/);
      await world.advance(10*60000);assert.ok(offerWrites.length>before);assert.equal(published(world),true,"it lands once the connection is back");
      const landed=offerWrites.length;assert.equal((await remote.autoConnect()).kind,"held","once it has landed, reopening costs nothing");
      await world.advance(5*60000);assert.equal(offerWrites.length,landed);}

    // J (Codex #920): the pointer lands after Daniel's 10 min join watch would have ended (and again after a reopen): the
    // watch starts afresh when it lands, so Nik joining later still moves Daniel's screen on, with no reload.
    for(const reopen of [false,true]){const {world,remote,sessions}=daniel({paired:true,fail:reopen?15:13});
      await remote.autoConnect();
      if(reopen){await world.advance(11*60000);await remote.autoConnect();}
      await world.advance(10*60000);
      assert.equal(published(world),true,"it landed");
      sessions[SESSION_ID]="active";  // Nik joins well after the first 10 minutes
      await world.advance(4100);
      assert.equal(remote.getState().sessionState,"active",`Daniel sees Nik join (${reopen?"after a reopen":"late landing"})`);}

    // G (Codex #920): a newer screen of Daniel's published live session B meanwhile: the retry for A never writes over it.
    {const {world,remote,offerWrites,sessions}=daniel({paired:true,fail:1});
      await remote.autoConnect();
      const B="session_"+"f".repeat(64);sessions[B]="open";
      world.serverWrite(OFFER,{schemaVersion:1,sessionId:B,hostAccountId:"daniel",expiresAt:{epochMs:world.clock.now+4*3600000}});
      await world.advance(20*60000);
      assert.equal(world.server.get(OFFER).data.sessionId,B,"Nik is still sent to the newer session");
      assert.equal(offerWrites.length,1,"no write after the first failure");
      assert.match(remote.getState().message,/open on another screen/,"the 10 min end keeps the right note");}

    // G2: the other screen's session ends while this one still waits: this session is published after all.
    {const {world,remote,offerWrites,sessions}=daniel({paired:true,fail:1});
      await remote.autoConnect();
      const B="session_"+"c".repeat(64);sessions[B]="open";
      world.serverWrite(OFFER,{schemaVersion:1,sessionId:B,hostAccountId:"daniel",expiresAt:{epochMs:world.clock.now+4*3600000}});
      await world.advance(60000);assert.match(remote.getState().message,/open on another screen/);
      sessions[B]="revoked";await world.advance(61000);
      assert.equal(published(world),true,"once B has ended, Nik is pointed at this session");assert.equal(offerWrites.length,2);
      assert.match(remote.getState().message,/Waiting for Nik/);}

    // K (Codex #920): the newer session's read is refused (this device was revoked): it is never overwritten.
    {const {world,remote,offerWrites,sessions}=daniel({paired:true,fail:1});
      await remote.autoConnect();
      const B="session_"+"e".repeat(64);sessions[B]={ok:false,code:"PRIVATE_SESSION_DEVICE_REVOKED",message:"revoked"};
      world.serverWrite(OFFER,{schemaVersion:1,sessionId:B,hostAccountId:"daniel",expiresAt:{epochMs:world.clock.now+4*3600000}});
      await world.advance(20*60000);
      assert.equal(world.server.get(OFFER).data.sessionId,B);assert.equal(offerWrites.length,1);}

    // N (JOB-1 F1): even a pointer with a minute or less left must preserve its still-live session.
    {const {world,remote,offerWrites,sessions}=daniel({paired:true,fail:1});
      const SHORT="session_"+"7".repeat(64);sessions[SHORT]="open";
      world.serverWrite(OFFER,{schemaVersion:1,sessionId:SHORT,hostAccountId:"daniel",expiresAt:{epochMs:world.clock.now+30000}});
      await remote.autoConnect();await world.advance(3000);
      assert.equal(offerWrites.length,0,"a live session is resumed without rewriting its short-lived pointer");
      assert.equal(world.server.get(OFFER).data.sessionId,SHORT);assert.equal(remote.getState().sessionId,SHORT);
      assert.doesNotMatch(remote.getState().message,/another screen/);}

    // L: a pointer to a session the server reports as not found is replaced.
    {const {world,remote,offerWrites,sessions}=daniel({paired:true,fail:1});
      const GONE="session_"+"9".repeat(64);sessions[GONE]={ok:false,code:"PRIVATE_SESSION_NOT_FOUND",message:"gone"};
      world.serverWrite(OFFER,{schemaVersion:1,sessionId:GONE,hostAccountId:"daniel",expiresAt:{epochMs:world.clock.now+4*3600000}});
      await remote.autoConnect();await world.advance(3000);
      assert.equal(offerWrites.length,2);assert.equal(published(world),true);}

    // M: this session itself no longer reads OPEN (ended elsewhere, or Nik already joined it): nothing is published.
    for(const state of ["revoked","active"]){const {world,remote,offerWrites,sessions}=daniel({paired:true,fail:1});
      await remote.autoConnect();sessions[SESSION_ID]=state;
      await world.advance(20*60000);
      assert.equal(offerWrites.length,1,`no write once the session is ${state}`);assert.equal(published(world),false);
      if(state==="active")assert.equal(remote.getState().sessionState,"active","a join seen by the retry moves Daniel on");}

    // H: a stale pointer (an old session that has ended) is replaced.
    {const {world,offerWrites,remote}=daniel({paired:true,fail:1});
      const OLD="session_"+"0".repeat(64);  // not open: readSession answers closed
      world.serverWrite(OFFER,{schemaVersion:1,sessionId:OLD,hostAccountId:"daniel",expiresAt:{epochMs:world.clock.now+4*3600000}});
      await remote.autoConnect();await world.advance(3000);
      assert.equal(offerWrites.length,2);assert.equal(published(world),true,"the ended session's pointer is replaced");}

    // I: the write landed but its answer was lost: the next try reads the pointer, sees this session and writes nothing.
    {const {world,remote,offerWrites}=daniel({paired:true,fail:0,lost:1});
      const result=await remote.autoConnect();
      assert.equal(result.kind,"hosted-publishing");assert.equal(published(world),true);
      await world.advance(10*60000);assert.equal(offerWrites.length,1,"no second write");}
    // O (Codex #904 P2): a host open whose answer was lost leaves an unresolved request; once that Showdown is reported ended
    // (another rivalry's end changes nothing) the request is let go, so the next auto-connect is not blocked as busy.
    {const {world,remote}=daniel({paired:true,fail:0});
      const api=world.sandbox.CareerModeSparkStandardAuthPrivateSession,open=api.openSession;let drop=1;
      api.openSession=async options=>{if(drop>0){drop-=1;throw Object.assign(new Error("Failed to get document because the client is offline."),{code:"unavailable"});}return open(options);};
      const ended=rivalryId=>{for(const fn of world.sandbox.windowListeners["career-mode-permanent-pair-ended"]||[])fn({detail:{closedRivalryId:rivalryId}});};
      await remote.autoConnect();
      assert.equal(remote.getState().pendingAction,"host","the lost answer leaves an unresolved host request");
      assert.equal((await remote.autoConnect()).code,"REMOTE_JOINING_BUSY","before: the next auto-connect is blocked");
      ended("pair_"+"b".repeat(64));
      assert.equal(remote.getState().pendingAction,"host","another Showdown's end leaves this request alone");
      ended(RIVAL);
      assert.equal(remote.getState().pendingAction,null,"the ended Showdown's request is let go");
      assert.equal(remote.getState().sessionId,null);
      const next=await remote.autoConnect();
      assert.equal(next.kind,"hosted",JSON.stringify(next));assert.equal(remote.getState().auto,"waiting");assert.equal(published(world),true);}
  });

  await check("FB-CTX1","context listeners watch the rivalry root and only the current Session; repeated wakes attach nothing new (Codex #1006 P2)",async()=>{
    const world=createWorld();
    const ID="pair_"+"f".repeat(64),ROOT=`rivalries/${ID}`,OLD=`${ROOT}/sessions/session_${"1".repeat(64)}`,NEW=`${ROOT}/sessions/session_${"2".repeat(64)}`;
    world.serverWrite(ROOT,{status:"ACTIVE"});world.serverWrite(OLD,{state:"closed"});world.serverWrite(NEW,{state:"active"});
    const sdk=world.services.firestoreSdk,read=async paths=>sdk.runTransaction(world.db,async tx=>{for(const path of paths)await tx.get({path});});
    await read([ROOT,OLD]);await world.advance(1000);
    await read([NEW]);  // a new Session opened without a reload: both Session copies are kept
    world.budget.watchContext(ID,()=>{});await world.advance(1000);
    const attached=world.budget.stats().listenersAttached;
    const watched=()=>world.activeListeners().map(listener=>listener.path).sort();
    assert.deepEqual(watched(),[ROOT,NEW].sort(),"the rivalry root and the newest Session are watched, never the older Session");
    for(let wake=0;wake<6;wake+=1){world.budget.watchContext(ID,()=>{});await world.advance(15000);}
    assert.equal(world.budget.stats().listenersAttached,attached,"six unchanged wakes attach no new listener");
    assert.deepEqual(watched(),[ROOT,NEW].sort(),"the current Session listener stays attached");
    assert.equal(world.budget.contextHealthy(NEW),true,"the current Session is served by its listener");
  });

  console.log(`PASS Firestore budget contracts: ${results.length} checks, measured reads/min ${measured.join(" / ")} (waiting <= ${BUDGET.waitingVisibleReadsPerMinute} reads/min, hidden ${BUDGET.hiddenReadsPerMinute}, idle writes 0, partner update <= ${BUDGET.partnerUpdateMs} ms).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
