'use strict';
// r87 reads red team, Special Player / Roulette / Transfer War / Career Start slice (READS_SP_ROULETTE.md). No emulator, no network.
//   RS01a Career Start: the wait-point listener watches rivalries/{rid}/careerStart/authoritative (the rivalry id comes from the
//         Shared Setup state; the view never carries it, so before the listener watched nothing and the first manager to tap
//         "I STARTED" read the career document from the server every 3 s for up to 3 minutes).
//   RS01b the 3 s check stands down while that listener is healthy and still runs when it is not.
//   RS01c Career Start READY marks the start of season 1 for the reads meter (RE-05: setup is not a season's cost).
//   RS03  a waited document's listener that delivered this page's own write BEFORE the write's promise resolved (or a write that
//         threw) is healed by the next server read that returns the listener's copy; before, the listener stayed "dirty" and
//         every 3 s check went to the server until the partner moved.
//   RS02  a fresh re-run reads each document once per pass and keeps what cannot have changed (own account, immutable).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const source=read('js/sparkPrivatePairing.js');
const BUDGET_SOURCE=source.slice(source.indexOf('// Firestore budget layer (r75).'));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<10;i+=1)await flush();}
let checks=0;
async function check(label,fn){await fn();checks+=1;console.log(`ok ${checks} ${label}`);}

// ---- Career Start (js/productionSharedCareerStart.js) in a sandbox with a scripted provider and a recording budget layer ----
const RIVALRY='pair_'+'7'.repeat(64),SESSION='session_'+'6'.repeat(64),DEVICE='device_'+'1'.repeat(32);
const SETUP=Object.freeze({phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],contentHash:'sha256:'+'a'.repeat(64)});
const ONE=Object.freeze({phase:'ONE_MANAGER_ACKNOWLEDGED',revision:1,acknowledgedRoles:['playerOne']});
const READY=Object.freeze({phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']});
const CAREER_PATH=`rivalries/${RIVALRY}/careerStart/authoritative`;
function careerStart(){
  const byId=new Map();
  const node=()=>{const classes=new Set();const n={id:'',children:[],dataset:{},className:'',textContent:'',disabled:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(){}},
    setAttribute(){},removeAttribute(){},hasAttribute:()=>false,getAttribute:()=>null,append(...c){n.children.push(...c);for(const x of c)if(x&&x.id)byId.set(x.id,x);},prepend(){},replaceChildren(){n.children=[];},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};return n;};
  const document={visibilityState:'visible',body:node(),documentElement:node(),getElementById:id=>byId.get(id)||null,createElement:()=>node(),addEventListener(){}};
  const intervals=[],calls={read:0},reads=[];
  const setupState={ready:true,setup:SETUP,managerRole:'playerOne',rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE};
  const budget={watches:[],starts:[],stats:{watching:null,watchHealthy:false},
    watchWaitPoint(owner,p){budget.watches.push({owner,path:p});return false;},
    noteSeasonStart(key){budget.starts.push(key);return true;}};
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date,JSON,document,
    setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length;},clearInterval(){},
    MutationObserver:class{observe(){}disconnect(){}},reportApplicationError(){}};
  sandbox.globalThis=sandbox;
  sandbox.CareerModeFirestoreBudget={watchWaitPoint:budget.watchWaitPoint,noteSeasonStart:budget.noteSeasonStart,stats:()=>budget.stats};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>setupState,getState:()=>setupState};
  for(const name of ['CareerModeSharedShowdownSetup','CareerModeSharedShowdownCatalog','CareerModeSparkSharedShowdownSetup','CareerModeSharedCareerStart','CareerModeProductionSharedTransferChallenge'])sandbox[name]={};
  sandbox.CareerModeSparkSharedCareerStart={read:async()=>{calls.read+=1;const next=reads.shift();if(!next)throw new Error('unscripted Career Start read');return next;},acknowledge:async()=>{throw new Error('no acknowledge here');}};
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'daniel'}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);
  vm.runInContext(read('js/productionSharedCareerStart.js'),sandbox,{filename:'productionSharedCareerStart.js'});
  const api=sandbox.CareerModeProductionSharedCareerStart;
  const openPanel=()=>{const overlay=node();overlay.id='productionSharedCareerStartOverlay';document.body.append(overlay);return overlay;};
  const fastTick=()=>{const timer=intervals.find(t=>t.ms===api.fastPollIntervalMs);assert.ok(timer,'the 3 s check is installed');timer.fn();};
  return {api,budget,calls,reads,openPanel,fastTick,intervals};
}
const result=(state,role='playerOne')=>({ok:true,revision:state.revision,state,managerRole:role});

// ---- Budget layer world (as tests/contracts/firestore-budget-contracts.cjs): fake clock, timers and Firestore ----------------
// The fake server delivers a listener update in a microtask queued by the commit, BEFORE the transaction's promise resolves:
// the "delivery before resolve" order of RS-03.
function budgetWorld({now=1_800_000_000_000}={}){
  const clock={now},timers=[];let seq=0;
  const document={visibilityState:'visible',documentElement:{dataset:{}},listeners:{},addEventListener(type,fn){(this.listeners[type]=this.listeners[type]||[]).push(fn);}};
  const sandbox={console,document,addEventListener(){},dispatchEvent(){return true;},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    setTimeout(fn,ms){const id=++seq;timers.push({id,at:clock.now+Math.max(0,Number(ms)||0),fn});return id;},
    clearTimeout(id){const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);}};
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext('Date.now=()=>__clockNow();',Object.assign(sandbox,{__clockNow:()=>clock.now}));
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:'sparkPrivatePairing.js#budget'});
  const budget=sandbox.CareerModeFirestoreBudget;
  const server=new Map(),gets={},listeners=[];let version=1;
  const snapshotOf=p=>{const record=server.get(p);const data=record?JSON.parse(JSON.stringify(record.data)):null;return {id:p.split('/').pop(),ref:{path:p},exists:()=>Boolean(record),data:()=>data?JSON.parse(JSON.stringify(data)):undefined,metadata:{fromCache:false,hasPendingWrites:false},_document:{version:{timestamp:{seconds:record?record.version:0,nanoseconds:0}}}};};
  const write=(p,data)=>{version+=1;server.set(p,{data,version});for(const l of listeners)if(l.active&&l.path===p)Promise.resolve().then(()=>{if(l.active)l.next(snapshotOf(p));});};
  const db={kind:'fake'};
  const sdk={
    async runTransaction(_db,fn){const writes=new Map();const tx={async get(ref){gets[ref.path]=(gets[ref.path]||0)+1;return snapshotOf(ref.path);},set(ref,data){writes.set(ref.path,data);return tx;},update(ref,data){writes.set(ref.path,{...(server.get(ref.path)?.data||{}),...data});return tx;},delete(){return tx;}};
      const value=await fn(tx);for(const [p,data] of writes)write(p,data);return value;},
    doc:(_db,...segments)=>({path:segments.join('/')}),
    onSnapshot(ref,_options,next){const l={path:ref.path,next,active:true};listeners.push(l);Promise.resolve().then(()=>{if(l.active)l.next(snapshotOf(ref.path));});return ()=>{l.active=false;};}
  };
  const services=budget.services({ok:true,firestore:db,firestoreSdk:sdk,auth:{currentUser:{uid:'nik'}}});
  async function advance(ms){const end=clock.now+ms;for(;;){await settle();timers.sort((a,b)=>a.at-b.at||a.id-b.id);const next=timers[0];if(!next||next.at>end)break;timers.shift();clock.now=Math.max(clock.now,next.at);next.fn();}clock.now=end;await settle();}
  const tx=fn=>services.firestoreSdk.runTransaction(db,fn);
  const ref=p=>sdk.doc(db,p);
  return {clock,budget,server,gets,write,advance,tx,ref,document,sandbox};
}

(async()=>{
  await check('RS01a Career Start watches the career document while this manager waits (the rivalry id comes from the Shared Setup state)',async()=>{
    const h=careerStart();h.api.install();h.openPanel();
    h.reads.push(result(ONE));await h.api.refresh();
    assert.equal(h.api.isWaitingForRival(),true,'Daniel acknowledged, Nik not yet: waiting');
    h.fastTick();
    const last=h.budget.watches.filter(w=>w.owner==='career-start').pop();
    assert.ok(last,'the 3 s check asks for the wait-point listener');
    assert.equal(last.path,CAREER_PATH,'it watches the career document, not nothing');
  });

  await check('RS01b the 3 s check stands down while that listener is healthy, and reads when it is not',async()=>{
    const h=careerStart();h.api.install();h.openPanel();
    h.reads.push(result(ONE));await h.api.refresh();
    const base=h.calls.read;
    h.budget.stats={watching:CAREER_PATH,watchHealthy:true};
    for(let i=0;i<5;i+=1){h.fastTick();await settle();}
    assert.equal(h.calls.read,base,'healthy listener on the career document: no 3 s provider read (its delivery wakes the panel)');
    h.budget.stats={watching:'rivalries/other/careerStart/authoritative',watchHealthy:true};
    h.reads.push(result(ONE));h.fastTick();await settle();
    assert.equal(h.calls.read,base+1,'a listener on another document does not count');
    h.budget.stats={watching:CAREER_PATH,watchHealthy:false};
    h.reads.push(result(ONE));h.fastTick();await settle();
    assert.equal(h.calls.read,base+2,'listener down: the 3 s check reads, as before');
  });

  await check('RS01c Career Start READY marks the start of season 1 for the reads meter',async()=>{
    const h=careerStart();h.api.install();h.openPanel();
    h.reads.push(result(READY));await h.api.refresh();
    assert.deepEqual(h.budget.starts,[`${RIVALRY}|1`]);
  });

  await check('RS03 a listener left dirty by this page\'s own write (delivered before the write resolved) heals on the next matching server read',async()=>{
    const w=budgetWorld();
    const W='rivalries/r1/transferChallenges/season_1';
    w.server.set(W,{data:{phase:'GUESS_ENTRY',revision:3},version:1});
    const read=()=>w.tx(async t=>{const s=await t.get(w.ref(W));return s.exists()?s.data():null;});
    await read();
    const watch=()=>w.budget.watchWaitPoint('transfer',W,()=>{});
    watch();await w.advance(1000);
    assert.equal(w.budget.stats().watching,W);assert.equal(w.budget.stats().watchHealthy,true,'listener attached and delivered');
    // This page locks its guesses: the listener delivers the new revision before the transaction's promise resolves.
    await w.tx(async t=>{const s=await t.get(w.ref(W));t.set(w.ref(W),{...s.data(),revision:4});});
    const before=w.gets[W];
    // The screen keeps waiting on the partner: a 3 s check (wait point + read), as the Transfer screen does.
    for(let i=0;i<20;i+=1){watch();await read();await w.advance(3000);}
    const serverReads=w.gets[W]-before;
    assert.equal(w.budget.stats().watchHealthy,true,'the listener serves again');
    assert.ok(serverReads<=3,`server reads of the waited document in 60 s: ${serverReads} (was one every 3 s before RS-03)`);
    // The partner's move still arrives at once through the listener.
    w.write(W,{phase:'GUESS_ENTRY',revision:5});await w.advance(10);
    assert.equal((await read()).revision,5);
  });

  await check('RS02 a fresh re-run reads each document once per pass and keeps this account\'s own document',async()=>{
    const w=budgetWorld();
    const A='accounts/nik',R='rivalries/r1',P='rivalries/r1/transferChallenges/season_1';
    w.server.set(A,{data:{status:'active'},version:1});w.server.set(R,{data:{data:{connectionState:'active'}},version:1});w.server.set(P,{data:{phase:'SIGNING_ENTRY'},version:1});
    await w.tx(async t=>{await t.get(w.ref(A));await t.get(w.ref(R));});
    await w.advance(10000);
    const before={...w.gets};
    // A season read for the first time (roulette history): rivalry reused (10 s old), the season document new -> fresh re-run.
    await w.tx(async t=>{await t.get(w.ref(A));await t.get(w.ref(R));await t.get(w.ref(R));await t.get(w.ref(P));});
    const delta=p=>(w.gets[p]||0)-(before[p]||0);
    assert.equal(w.budget.stats().freshReruns,1,'the re-run happened');
    assert.equal(delta(A),0,'own account kept (5 min), as a server transaction keeps it');
    assert.equal(delta(R),1,'the rivalry once in the fresh pass, although asked twice');
    assert.equal(delta(P),2,'the new document: once in the first pass, once fresh');
  });

  console.log(`PASS r87 reads SP fixes contracts: ${checks} checks`);
})().catch(error=>{console.error(error);process.exit(1);});
