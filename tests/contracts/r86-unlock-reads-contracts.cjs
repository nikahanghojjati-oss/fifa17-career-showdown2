#!/usr/bin/env node
"use strict";
// r86 red team #18 and #20 (2026-10-29). #18: every phone unlock during a game cost about 35 billed reads per phone
// (measured on the emulator: 22 on Transfer, 31-35 on Results waiting). On return the page re-read this account and device,
// read the rivalry root and Session from the server and then once more through the context listener it re-attached, and
// Season Commit's authority listeners handed the waiting reads back to the server on the SDK's first (cached) copy.
// #20: one refused read forgot every copy and nothing backed off. Deterministic: the budget layer of js/sparkPrivatePairing.js
// runs in a sandbox with a fake clock, timers and Firestore (the same harness as firestore-budget-contracts.cjs).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const source=read("js/sparkPrivatePairing.js");
const BUDGET_SOURCE=source.slice(source.indexOf("// Firestore budget layer (r75)."));
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
  let quota=false,holdInitial=false;const denied=new Set(),readsByPath=new Map();
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
        async get(ref){if(quota)throw quotaError();meter.reads+=1;readsByPath.set(ref.path,(readsByPath.get(ref.path)||0)+1);if(denied.has(ref.path)){const error=new Error("Missing or insufficient permissions.");error.code="permission-denied";throw error;}read.add(ref.path);return snapshotOf(ref.path);},
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
      Promise.resolve().then(()=>{if(!listener.active||holdInitial)return;if(quota){listener.active=false;error(quotaError());return;}meter.listenerReads+=1;meter.reads+=1;next(snapshotOf(ref.path));});
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
  return {clock,budget,services,sdk,db,meter,server,serverWrite,advance,setVisible,events,document,sandbox,activeListeners,denied,readsByPath,
    setQuota(value){quota=value;},hold(value){holdInitial=value;},failListeners(){for(const listener of docListeners)if(listener.active){listener.active=false;listener.error(new Error("listen stream dropped"));}},
    input(){for(const fn of document.listeners.pointerdown||[])fn();},
    cacheDeliver(pathName){for(const listener of docListeners)if(listener.active&&listener.path===pathName)listener.next(snapshotOf(pathName,true));}};
}


const ID="pair_"+"a".repeat(64),RIVALRY=`rivalries/${ID}`,SESSION=`${RIVALRY}/sessions/session_${"b".repeat(64)}`;
const ACCOUNT="accounts/nik",DEVICE="accounts/nik/devices/device_"+"c".repeat(32);
const PROJECTION=`${RIVALRY}/sharedSetup/leagueProjection`,TRANSFER=`${RIVALRY}/transferChallenges/season_1`,RESULTS=`${RIVALRY}/seasonResults/season_1`;
function seed(world){
  world.serverWrite(RIVALRY,{data:{connectionState:"active"}});world.serverWrite(SESSION,{status:"ACTIVE"});
  world.serverWrite(ACCOUNT,{uid:"nik"});world.serverWrite(DEVICE,{state:"active"});
  world.serverWrite(PROJECTION,{objectType:"sharedLeagueProjection",teamCount:20});world.serverWrite(TRANSFER,{phase:"COMPLETED",revision:6});
  world.serverWrite(RESULTS,{phase:"COLLECTING",revision:1});
}
const reader=world=>async paths=>world.services.firestoreSdk.runTransaction(world.db,async tx=>{const out=[];for(const p of paths)out.push((await tx.get({path:p})).data());return out;});
const txReads=(world,p)=>world.readsByPath.get(p)||0;
async function unlock(world,hiddenMs=20000){world.setVisible(false);await world.advance(hiddenMs);world.setVisible(true);}
const results=[];
async function check(id,label,fn){await fn();results.push(id);console.log(`ok ${results.length} ${id} ${label}`);}

(async()=>{
  await check("U1","this account and this device are not read again after an unlock (they keep their 5-minute reuse)",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([ACCOUNT,DEVICE,RESULTS]);await world.advance(30000);
    await unlock(world);await get([ACCOUNT,DEVICE,RESULTS]);
    assert.equal(txReads(world,ACCOUNT),1,"account read once");assert.equal(txReads(world,DEVICE),1,"device read once");
    assert.equal(txReads(world,RESULTS),2,"a shared document that may have changed while hidden is read again");
  });

  await check("U2","the context listeners come back at once on return, and reads of the rivalry and Session wait for their first delivery: one read each",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY,SESSION]);world.budget.watchContext(ID,()=>{});await world.advance(2000);
    assert.deepEqual(world.activeListeners().map(l=>l.path).sort(),[RIVALRY,SESSION].sort(),"both context listeners attached");
    const before=world.meter.reads;
    await unlock(world);
    assert.deepEqual(world.activeListeners().map(l=>l.path).sort(),[RIVALRY,SESSION].sort(),"both listeners are attached again before any module reads");
    await Promise.all([get([RIVALRY,SESSION]),get([RIVALRY,SESSION]),get([RIVALRY])]);await world.advance(1000);
    assert.equal(world.meter.reads-before,2,"three modules reading both documents after an unlock cost 2 reads (was a server read plus a listener read each)");
    assert.equal(txReads(world,RIVALRY),1,"the rivalry root is not read from the server again");assert.equal(txReads(world,SESSION),1,"nor the Session");
  });

  await check("U2b","the same when Terminal Close stops the context watch on hide and asks for it again on return (as in the game)",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    world.document.addEventListener("visibilitychange",()=>world.budget.watchContext(world.document.visibilityState==="hidden"?null:ID,()=>{}));
    await get([RIVALRY,SESSION]);world.budget.watchContext(ID,()=>{});await world.advance(2000);
    const before=world.meter.reads;
    await unlock(world);
    assert.deepEqual(world.activeListeners().map(l=>l.path).sort(),[RIVALRY,SESSION].sort(),"both listeners are attached again on return");
    await Promise.all([get([RIVALRY,SESSION]),get([RIVALRY])]);await world.advance(1000);
    assert.equal(world.meter.reads-before,2,"2 reads for the return");
    await unlock(world);await get([RIVALRY,SESSION]);await world.advance(1000);
    assert.equal(world.meter.reads-before,4,"and 2 again for a second unlock");
  });

  await check("U2c","the wait listener of a screen waiting on the partner is back at once on return: one read for its document",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    let wakes=0;const wake=()=>{wakes+=1;};
    await get([RESULTS]);world.budget.watchWaitPoint("results-screen",RESULTS,wake);await world.advance(2000);
    assert.equal(world.budget.stats().watchHealthy,true,"the wait listener is healthy");
    const before=world.meter.reads;
    await unlock(world);
    assert.ok(world.activeListeners().some(l=>l.path===RESULTS),"the wait listener is attached again on return");
    await Promise.all([get([RESULTS]),get([RESULTS])]);await world.advance(1000);
    assert.equal(world.meter.reads-before,1,"the waited document costs one read on return (was a server read plus the listener)");
    assert.equal(txReads(world,RESULTS),1,"no server read");
    world.serverWrite(RESULTS,{phase:"RESULTS_READY",revision:2});await world.advance(500);
    assert.ok(wakes>=1,"the partner's move still wakes the screen through the listener");
  });

  await check("U3","a cached first copy does not release the waiting reads; the server copy does, and a listener that never delivers gives them back after 5 s",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY,SESSION]);world.budget.watchContext(ID,()=>{});await world.advance(2000);
    world.setVisible(false);await world.advance(5000);
    world.hold(true);world.setVisible(true);await world.advance(100);
    world.cacheDeliver(RIVALRY);
    let done=false;const pending=get([RIVALRY]).then(()=>{done=true;});await world.advance(1000);
    assert.equal(done,false,"a read of the rivalry still waits after the cached copy");
    assert.equal(txReads(world,RIVALRY),1,"and has not gone to the server");
    await world.advance(5000);await pending;
    assert.equal(done,true,"after 5 s without a server copy the read goes to the server");
    assert.equal(txReads(world,RIVALRY),2,"one server read");
  });

  await check("U4","a document Season Commit's authority listener delivers gets no second (context) listener",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY,SESSION]);world.budget.watchContext(ID,()=>{});await world.advance(2000);
    world.budget.returnListen([RIVALRY,SESSION]);
    world.setVisible(false);world.budget.listened();await world.advance(5000);world.setVisible(true);
    assert.equal(world.activeListeners().length,0,"the context listeners leave the rivalry and Session to the authority listeners on return");
    const snap=p=>({exists:()=>true,data:()=>world.server.get(p).data,metadata:{fromCache:false,hasPendingWrites:false},_document:{version:{timestamp:{seconds:9,nanoseconds:0}}}});
    const reading=Promise.all([get([RIVALRY,SESSION]),get([RIVALRY])]);
    world.budget.listened(RIVALRY,snap(RIVALRY));world.budget.listened(SESSION,snap(SESSION));
    await reading;await world.advance(1000);
    assert.equal(world.activeListeners().length,0,"still no context listener after their deliveries");
    assert.equal(txReads(world,RIVALRY)+txReads(world,SESSION),2,"and no server read of either after the unlock");
    world.budget.listened();await world.advance(61000);await get([RIVALRY]);await world.advance(1000);
    assert.ok(world.activeListeners().some(l=>l.path===RIVALRY),"once the authority listeners stop, the context listener watches the rivalry again");
  });

  await check("U5","the create-only league projection and a COMPLETED transfer are kept across an unlock",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([PROJECTION,TRANSFER]);await unlock(world,60000);await get([PROJECTION,TRANSFER]);
    assert.equal(txReads(world,PROJECTION),1);assert.equal(txReads(world,TRANSFER),1);
    world.serverWrite(TRANSFER,{phase:"SIGNING_ENTRY",revision:5});const fresh=createWorld();seed(fresh);fresh.serverWrite(TRANSFER,{phase:"SIGNING_ENTRY",revision:5});
    const g=reader(fresh);await g([TRANSFER]);await unlock(fresh);await g([TRANSFER]);
    assert.equal(txReads(fresh,TRANSFER),2,"a transfer still in progress is read again");
  });

  await check("U6","red team #20: a refused Session read backs off 15 s, 1 min, 5 min and forgets the shared copies once; a tap reads it at once",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY,RESULTS]);world.denied.add(SESSION);
    await assert.rejects(get([SESSION]),error=>error.code==="permission-denied");
    assert.equal(txReads(world,SESSION),1);
    for(let i=0;i<5;i+=1)await assert.rejects(get([SESSION]),error=>error.code==="permission-denied");
    assert.equal(txReads(world,SESSION),1,"five more checks inside 15 s do not reach the server");
    await get([RIVALRY,RESULTS]);
    assert.equal(txReads(world,RIVALRY),2,"the shared copies are read again once after the refusal (the partner may have moved)");assert.equal(txReads(world,RESULTS),2);
    await get([RIVALRY,RESULTS]);assert.equal(txReads(world,RIVALRY),2,"the refused checks inside the back-off forget nothing more");
    await world.advance(15000);await assert.rejects(get([SESSION]));assert.equal(txReads(world,SESSION),2,"after 15 s one more server read");
    await world.advance(15000);await assert.rejects(get([SESSION]));assert.equal(txReads(world,SESSION),2,"the next wait is 1 minute");
    await world.advance(46000);await assert.rejects(get([SESSION]));assert.equal(txReads(world,SESSION),3);
    world.input();await assert.rejects(get([SESSION]));assert.equal(txReads(world,SESSION),4,"a tap reads it at once");
    world.denied.delete(SESSION);await world.advance(6000);world.input();await get([SESSION]);assert.equal(txReads(world,SESSION),5);
    await world.advance(10000);await get([SESSION]);assert.equal(txReads(world,SESSION),5,"once allowed again it is reused normally");
    assert.ok(world.events.some(e=>e.type==="career-mode-firestore-authority-denied"),"the pairing check is still told");
  });

  await check("U9","a shared document seen changed lifts the back-off at once (a document the partner's move makes readable)",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY]);world.denied.add(SESSION);
    await assert.rejects(get([SESSION]));await assert.rejects(get([SESSION]));assert.equal(txReads(world,SESSION),1);
    world.denied.delete(SESSION);world.serverWrite(RIVALRY,{connectionState:"active",revision:99});
    await world.advance(6000);world.budget.wantFresh(RIVALRY);await get([RIVALRY]);
    await get([SESSION]);assert.equal(txReads(world,SESSION),2,"the Session is read again at once after the rivalry changed");
  });

  await check("U10","when the screen's own authority listeners end, the context listener takes the rivalry back",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY,SESSION]);world.budget.watchContext(ID,()=>{});await world.advance(2000);
    world.budget.returnListen([RIVALRY,SESSION]);
    world.setVisible(false);await world.advance(5000);world.setVisible(true);
    const snap=p=>({exists:()=>true,data:()=>world.server.get(p).data,metadata:{fromCache:false,hasPendingWrites:false},_document:{version:{timestamp:{seconds:9,nanoseconds:0}}}});
    const reading=get([RIVALRY,SESSION]);world.budget.listened(RIVALRY,snap(RIVALRY));world.budget.listened(SESSION,snap(SESSION));await reading;
    assert.equal(world.activeListeners().length,0,"while the authority listeners deliver, no context listener");
    world.budget.returnListen([]);await world.advance(61000);await get([RIVALRY]);await world.advance(1000);
    assert.ok(world.activeListeners().some(l=>l.path===RIVALRY),"a normal end (returnListen([])) hands the rivalry back to the context listener");
  });

  await check("U11","after a refused read (the Session after a close, say) the rivalry is read from the server, not the context listener (Terminal Close's race check)",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RIVALRY,SESSION]);world.budget.watchContext(ID,()=>{});await world.advance(2000);
    assert.ok(world.activeListeners().some(l=>l.path===RIVALRY),"the context listener watches the rivalry");
    const before=txReads(world,RIVALRY);await get([RIVALRY]);assert.equal(txReads(world,RIVALRY),before,"served by the listener");
    world.denied.add(RESULTS);await assert.rejects(get([RESULTS]));
    await get([RIVALRY]);assert.equal(txReads(world,RIVALRY),before+1,"the next rivalry read goes to the server");
  });

  await check("U7","a refused read of the rivalry root (authority) still forgets every copy",async()=>{
    const world=createWorld();seed(world);const get=reader(world);
    await get([RESULTS,SESSION]);world.denied.add(RIVALRY);
    await assert.rejects(get([RIVALRY]));world.denied.delete(RIVALRY);
    await get([RESULTS,SESSION]);
    assert.equal(txReads(world,RESULTS),2,"copies are read again after an authority refusal");
  });

  await check("U8","Season Commit's authority listeners keep the reads waiting on a cached copy and settle a confirmed Setup",async()=>{
    const pssc=read("js/productionSharedSeasonCommit.js");
    assert.ok(!/fromCache\|\|snapshot\.metadata\?\.hasPendingWrites\)\{if\(serial===undefined\)budget\?\.listened\?\.\(path,null\)/.test(pssc),"a cached copy no longer calls listened(path,null)");
    assert.match(pssc,/\\\/sharedSetup\\\/authoritative\$\/\.test\(path\)&&value\?\.revision===6&&value\?\.phase==="SHOWDOWN_CONFIRMED"\)waitSettled\.add\(path\)/);
  });

  console.log(`PASS r86 unlock reads contracts: ${results.length} checks (own account kept, context listeners back on return, cached copy waits, no double listener, settled documents kept, refused reads back off).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
