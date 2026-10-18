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

function createWorld(){
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
    doc(_db,pathName){return {path:pathName};},
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
    const wrapped=["onlinePlayerIdentity","persistentNikDanielPair","productionSharedCanonicalScoring","productionSharedCareerStart","productionSharedHistoryConvergence","productionSharedMultiSeasonProgression","productionSharedSeasonCommit","productionSharedSeasonResults","productionSharedShowdownSetup","productionSharedTerminalClose","productionSharedTransferChallenge","seasonFinalV10","rivalryLegacyV10","sparkConnectedAccount","sparkConnectedRivalry","sparkPrivatePairing","sparkRemoteJoining"];
    for(const name of wrapped){
      const text=fs.readFileSync(path.join(ROOT,"js",`${name}.js`),"utf8");
      assert.match(text,/CareerModeFirestoreBudget\?\.services\|\|\(s=>s\)\)\(await /,`${name}.js wraps its Firestore services`);
    }
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

  console.log(`PASS Firestore budget contracts: ${results.length} checks, measured reads/min ${measured.join(" / ")} (waiting <= ${BUDGET.waitingVisibleReadsPerMinute} reads/min, hidden ${BUDGET.hiddenReadsPerMinute}, idle writes 0, partner update <= ${BUDGET.partnerUpdateMs} ms).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
