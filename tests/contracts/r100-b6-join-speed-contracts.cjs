"use strict";
// r100 B6 JOIN speed (B4's proposal, lead OK 2026-11-25): the JOIN waits wake from the budget layer's one wait listener
// (CareerModeFirestoreBudget.watchWaitPoint) instead of their 3-4 s timed checks: Daniel's code waiting on Nik's JOIN (the
// rivalry document), Nik waiting on Daniel's session offer, and Daniel's session waiting on Nik to join. The timed checks
// stay as the fallback and stand down only while that listener is healthy (a backstop check still runs every 30 s), so a
// wait costs no more reads than before. No new onSnapshot. Two small helpers keep the reads level now that League Roulette
// opens sooner: the first wait of a page attaches as soon as the listener module loads, and the shared setup screen asks
// Terminal Close for its context listener (rivalry root + Session) on each check instead of waiting for its 15 s wake.
// JS-1..4 run the real pairing, budget and permanent-pair modules (Home JOIN fixture); JS-5..7 and JS-10..14 run the real Remote Joining
// module against a recording budget; JS-8 runs the real budget layer with a fake listener module.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const {world,settle}=require("../support/home-join-window-fixture.cjs");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const PAIR_LINK="accounts/daniel/pairLinks/current";

async function danielWaiting(){
  const w=world(),daniel=w.page("daniel");await daniel.init();
  const waiting=await daniel.pair.startPairing({managerRole:"playerOne"});assert.equal(waiting.connectionState,"pending-pair",waiting.message);await settle();
  const budget=daniel.s.CareerModeFirestoreBudget,rid=waiting.rivalryId;
  const checks=()=>w.reads.filter(p=>p===PAIR_LINK).length;
  const live=()=>[...w.listeners].filter(l=>l.ref.path===`rivalries/${rid}`);
  return {w,daniel,budget,rid,checks,live};
}
const cacheCopy=(w,l)=>l.next({metadata:{fromCache:true},exists:()=>true,data:()=>w.docs.get(l.ref.path)});

test("JS-1: Daniel's waiting code is watched by the one wait listener on the rivalry document; other paths are refused",async()=>{
  const {w,budget,rid,live}=await danielWaiting();
  await w.advance(4000);
  assert.equal(live().length,1,"one listener on the rivalry document while the code waits on Home");
  assert.equal(budget.stats().watching,`rivalries/${rid}`);assert.equal(budget.stats().watchHealthy,true);
  for(const bad of ["accounts/daniel/pairLinks/current","rivalries","rivalries/x/sessions"])assert.equal(budget.watchWaitPoint("other",bad,()=>{}),false,`${bad} is not a wait path`);
  assert.equal(budget.stats().watching,`rivalries/${rid}`,"a refused ask leaves the pair wait as it was");
  assert.equal([...w.listeners].length,1,"no second listener");
});

test("JS-2: while the listener is healthy the 4 s checks stand down (one backstop check every 30 s) and Nik's JOIN reaches Daniel at once",async()=>{
  const {w,daniel,checks}=await danielWaiting();
  const start=checks();
  await w.advance(28000);
  assert.equal(checks()-start,1,"one check after the code was made, then none while the listener is healthy (before: one every 4 s)");
  await w.advance(4000);
  assert.equal(checks()-start,2,"the 30 s backstop check still runs");
  const nik=w.page("nik");await nik.init();await nik.tap();
  assert.equal(nik.pair.getState().connectionState,"active");
  await w.advance(0);
  assert.equal(daniel.pair.getState().connectionState,"active","the listener's wake runs Daniel's check at once, not on the next timed check");
  assert.equal(daniel.pair.getState().status,"paired");
});

test("JS-3: a listener on a cached copy is not trusted: the 4 s checks run again and still see the JOIN",async()=>{
  const {w,daniel,budget,checks,live}=await danielWaiting();
  await w.advance(8000);
  cacheCopy(w,live()[0]);
  assert.equal(budget.stats().watchHealthy,false,"a cached copy makes the wait listener unhealthy at once");
  const from=checks();
  await w.advance(12000);
  assert.equal(checks()-from,3,"the timed checks read again every 4 s");
  // Nik's JOIN lands while the listener stays silent: the timed check finds it.
  for(const l of [...w.listeners])w.listeners.delete(l);
  const nik=w.page("nik");await nik.init();await nik.tap();
  await w.advance(4000);
  assert.equal(daniel.pair.getState().connectionState,"active","the timed check sees the JOIN within 4 s");
});

test("JS-3b: a dropped stream: the checks read again at once, the listener is rebuilt, and Nik's JOIN still wakes Daniel",async()=>{
  const {w,daniel,budget,checks,live}=await danielWaiting();
  await w.advance(8000);
  w.failListener();
  assert.equal(budget.stats().watchHealthy,false);
  const from=checks();
  await w.advance(2000);
  assert.ok(checks()-from>=1,"the next timed check reads the server");
  await w.advance(4000);
  assert.equal(live().length,1,"the wait listener is attached again");assert.equal(budget.stats().watchHealthy,true);
  const nik=w.page("nik");await nik.init();await nik.tap();
  await w.advance(0);
  assert.equal(daniel.pair.getState().connectionState,"active","the rebuilt listener wakes Daniel at once");
});

test("JS-4: a hidden page keeps no wait listener and reads nothing",async()=>{
  const {w,daniel,checks,live}=await danielWaiting();
  await daniel.visibility(false);await w.advance(0);
  assert.equal(live().length,0,"hidden: the listener is gone");
  const from=checks();await w.advance(60000);
  assert.equal(checks()-from,0,"hidden: no check");
});

// Remote Joining against a recording budget: what each wait asks for, when its timed checks stand down, what a wake does.
const RIVALRY="pair_"+"a".repeat(64),FRESH="session_"+"c".repeat(64);
const OFFER=`rivalries/${RIVALRY}/sessionOffers/current`,SESSION=`rivalries/${RIVALRY}/sessions/${FRESH}`;
async function drain(){for(let i=0;i<300;i++)await Promise.resolve();}
function remoteGame(){
  let now=1800000000000,offer=null,gate=null;const sessions=new Map(),offerReads={count:0,inFlight:0,most:0};
  function player(role,{sessionId=FRESH,locks=null,AbortSignal:abortSignal=null,joinFails=0}={}){
    const uid=role==="playerOne"?"daniel":"nik",deviceId="device_"+(role==="playerOne"?"d":"e").repeat(32),timers=new Map();let timerId=0,healthy=false;
    const calls={hosts:0,joins:0,sessionReads:0};const asks=[];
    class E{constructor(){this.children=[];this.dataset={};this.classList={add(){},remove(){},toggle(){}};}append(...n){this.children.push(...n);}appendChild(n){this.children.push(n);return n;}prepend(...n){this.children.unshift(...n);}replaceChildren(...n){this.children=n;}setAttribute(){}focus(){}addEventListener(){}querySelector(){return null;}}
    const events={};const document={visibilityState:"visible",body:new E(),createElement:()=>new E(),createTextNode:()=>new E(),getElementById:()=>null,querySelector:()=>null,addEventListener(){}};
    const budget={
      watchWaitPoint(owner,waitPath,wake){asks.push({owner,path:waitPath,wake});return false;},
      stats(){const last=asks[asks.length-1];return {watching:last?.path||null,watchHealthy:healthy&&Boolean(last?.path)};},wantFresh(){}
    };
    const result=id=>{const s=sessions.get(id);return {ok:true,sessionId:id,state:s.state,revision:s.state==="active"?1:0,expiresAtEpochMs:s.expiry};};
    const sdk={doc:(_db,...parts)=>parts.join("/"),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({}),
      runTransaction:async(_db,fn)=>fn({get:async ref=>{if(ref===OFFER){offerReads.count++;offerReads.inFlight++;offerReads.most=Math.max(offerReads.most,offerReads.inFlight);try{if(gate){const held=gate;if(held.once)gate=null;await held.promise;}}finally{offerReads.inFlight--;}}return {exists:()=>ref===OFFER&&Boolean(offer),data:()=>offer};},set:(ref,value)=>{if(ref===OFFER)offer=value;}})};
    const root=vm.createContext({console,URL,TextEncoder,crypto:webcrypto,Promise,Date:class extends Date{static now(){return now;}},document,navigator:locks?{onLine:true,locks}:{onLine:true},AbortSignal:abortSignal||undefined,
      setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),addEventListener(type,fn){events[type]=fn;},dispatchEvent(){},CustomEvent:class{},
      reportApplicationError:()=>{},CareerModeFirestoreBudget:budget,
      currentShowdown:{sharedJourney:{mode:"shared",rivalryId:RIVALRY},managers:{playerOne:"Daniel",playerTwo:"Nik"},rounds:[]},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})},
      CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:uid})},
      CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId})},
      CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>({attached:true,rivalryId:RIVALRY,accountId:uid,deviceId,binding:{managerRole:role}})},
      CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:uid})},
      CareerModePersistentNikDanielPair:{getPartnerState:()=>({status:"ready",accountId:uid,record:{active:true}})},
      CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:{generateSessionId:()=>sessionId,normalizeSessionId:v=>v,
        readSession:async({sessionId})=>{calls.sessionReads++;return result(sessionId);},
        openSession:async({sessionId,ttlMs})=>{calls.hosts++;sessions.set(sessionId,{state:"open",expiry:now+ttlMs});return result(sessionId);},
        joinSession:async({sessionId})=>{if(joinFails>0){joinFails--;return {ok:false,code:"PRIVATE_SESSION_STATE_CONFLICT",message:"The session already changed."};}calls.joins++;sessions.get(sessionId).state="active";return result(sessionId);}}
    });
    vm.runInContext(read("js/sparkRemoteJoining.js"),root,{filename:"sparkRemoteJoining.js"});
    return {remote:root.CareerModeSparkRemoteJoining,calls,asks,setHealthy(value){healthy=value;},
      ask:owner=>[...asks].reverse().find(a=>a.owner===owner),
      async online(){await events.online();await drain();},
      async tick(){const due=[...timers];timers.clear();for(const [,timer] of due)await timer.fn();await drain();}};
  }
  return {player,offerReads,sessions,offer:()=>offer,advance:ms=>{now+=ms;},hold(once=false){let open;const held={once,promise:new Promise(resolve=>{open=resolve;})};gate=held;return ()=>{if(gate===held)gate=null;open();};}};
}

test("JS-5: Nik waiting for Daniel's offer: the listener watches the offer pointer, timed checks stand down while healthy, a wake joins at once",async()=>{
  const g=remoteGame(),nik=g.player("playerTwo"),daniel=g.player("playerOne");
  assert.equal((await nik.remote.autoConnect()).kind,"waiting");
  assert.equal(nik.ask("remote-join-offer")?.path,OFFER,"the wait asks for the exact offer pointer Daniel writes");
  // No healthy listener: every 3 s check reads the pointer, as before.
  let from=g.offerReads.count;for(let i=0;i<3;i++){g.advance(3000);await nik.tick();}
  assert.equal(g.offerReads.count-from,3,"unhealthy: one read per 3 s check");
  // Healthy: the checks stand down until the 30 s backstop.
  nik.setHealthy(true);from=g.offerReads.count;
  for(let i=0;i<9;i++){g.advance(3000);await nik.tick();}
  assert.equal(g.offerReads.count-from,0,"healthy: no timed read within 30 s of the last check");
  g.advance(3000);await nik.tick();
  assert.equal(g.offerReads.count-from,1,"the 30 s backstop check reads once");
  // Daniel opens and publishes; the listener's wake runs Nik's check at once.
  assert.equal((await daniel.remote.autoConnect()).kind,"hosted");
  from=g.offerReads.count;nik.ask("remote-join-offer").wake();await drain();
  assert.equal(nik.calls.joins,1,"the wake joins Daniel's session without waiting for a timed check");
  assert.equal(nik.remote.getState().sessionState,"active");
  assert.equal(g.offerReads.count-from,1,"the wake costs one read of the pointer");
  assert.equal(nik.ask("remote-join-offer").path,null,"the wait gives the listener back once it ends");
});

test("JS-6: Daniel's session waiting for Nik: the listener watches that session, a wake finds the join at once, the wait then lets go",async()=>{
  const g=remoteGame(),daniel=g.player("playerOne"),nik=g.player("playerTwo");
  assert.equal((await daniel.remote.autoConnect()).kind,"hosted");
  assert.equal(daniel.ask("remote-join-session")?.path,SESSION,"the host wait asks for its own session document");
  daniel.setHealthy(true);
  const reads=daniel.calls.sessionReads;for(let i=0;i<5;i++){g.advance(3000);await daniel.tick();}
  assert.ok(daniel.calls.sessionReads-reads<=1,"healthy: the timed join checks stand down (at most the first check)");
  assert.equal((await nik.remote.autoConnect()).ok,true);assert.equal(nik.calls.joins,1);
  const before=daniel.calls.sessionReads;daniel.ask("remote-join-session").wake();await drain();
  assert.equal(daniel.remote.getState().sessionState,"active","the wake sees Nik's join at once");
  assert.equal(daniel.calls.sessionReads-before,1,"one read of the session");
  assert.equal(daniel.ask("remote-join-session").path,null,"the host wait gives the listener back once Nik joined");
});

test("JS-7: one offer check at a time: wakes and timed checks during a check never run a second join",async()=>{
  const g=remoteGame(),nik=g.player("playerTwo"),daniel=g.player("playerOne");
  assert.equal((await nik.remote.autoConnect()).kind,"waiting");
  assert.equal((await daniel.remote.autoConnect()).kind,"hosted");
  const open=g.hold();g.offerReads.most=0;
  const wake=nik.ask("remote-join-offer").wake;
  wake();wake();g.advance(3000);const ticking=nik.tick();wake();await drain();
  assert.equal(g.offerReads.most,1,"never two offer reads at once");
  open();await ticking;await drain();
  assert.equal(nik.calls.joins,1,"exactly one join");
  assert.equal(nik.remote.getState().sessionState,"active");
});

// A browser's Web Locks, shared by the tabs of one site: one holder per name, the rest queue; a signal abort drops a queued ask.
function webLocks(){
  const held=new Map();
  return {request(name,options,callback){
    return new Promise((resolve,reject)=>{
      const queue=held.get(name)||[];held.set(name,queue);
      const entry={start(){Promise.resolve().then(callback).then(resolve,reject).finally(()=>{queue.shift();if(queue[0])queue[0].start();});}};
      options?.signal?.addEventListener("abort",()=>{const at=queue.indexOf(entry);if(at>0){queue.splice(at,1);reject(Object.assign(new Error("aborted"),{name:"AbortError"}));}});
      queue.push(entry);if(queue.length===1)entry.start();
    });
  }};
}
function timedSignals(){const made=[];return {made,AbortSignal:{timeout(ms){const listeners=[];const signal={ms,addEventListener:(_type,fn)=>listeners.push(fn),abort:()=>listeners.forEach(fn=>fn())};made.push(signal);return signal;}}};}

test("JS-10: two tabs of Daniel's phone that connect at the same moment end on the one session Nik joins",async()=>{
  const g=remoteGame(),locks=webLocks(),signals=timedSignals();
  const tab1=g.player("playerOne",{sessionId:"session_"+"1".repeat(64),locks,AbortSignal:signals.AbortSignal});
  const tab2=g.player("playerOne",{sessionId:"session_"+"2".repeat(64),locks,AbortSignal:signals.AbortSignal});
  const [one,two]=await Promise.all([tab1.remote.autoConnect(),tab2.remote.autoConnect()]);
  assert.equal(one.kind,"hosted","the first tab opens and publishes its session");
  assert.equal(two.kind,"hosting","the second tab reads the offer the first tab wrote and hosts that same session");
  assert.equal(tab2.calls.hosts,0,"the second tab opens no session of its own");
  assert.equal(tab2.remote.getState().sessionId,tab1.remote.getState().sessionId);
  assert.equal(g.offer().sessionId,tab1.remote.getState().sessionId);
  assert.ok(signals.made.every(signal=>signal.ms===10000),"each wait for the other tab is bounded at 10 s");
  // Without the lock the same moment opens two sessions (the race the lock removes).
  const h=remoteGame(),a=h.player("playerOne",{sessionId:"session_"+"3".repeat(64)}),b=h.player("playerOne",{sessionId:"session_"+"4".repeat(64)});
  await Promise.all([a.remote.autoConnect(),b.remote.autoConnect()]);
  assert.equal(a.calls.hosts+b.calls.hosts,2,"no lock: both tabs open a session");
});

test("JS-11: a tab never waits for good on the other tab: after the bounded wait it connects as before",async()=>{
  const g=remoteGame(),locks=webLocks(),signals=timedSignals();
  let release;locks.request("cms-remote-join-connect",{},()=>new Promise(resolve=>{release=resolve;}));await drain();
  const tab=g.player("playerOne",{sessionId:"session_"+"5".repeat(64),locks,AbortSignal:signals.AbortSignal});
  const connecting=tab.remote.autoConnect();await drain();
  assert.equal(tab.calls.hosts,0,"waits while the other tab connects");
  signals.made[signals.made.length-1].abort();
  assert.equal((await connecting).kind,"hosted","the wait ran out: this tab connects by itself");
  release();
});

test("JS-12: a check that could not act lets no timed check stand down: Nik's second tab, beaten to the join, tries again in 3 s",async()=>{
  const g=remoteGame(),daniel=g.player("playerOne"),nikA=g.player("playerTwo"),nikB=g.player("playerTwo",{joinFails:1});
  assert.equal((await nikA.remote.autoConnect()).kind,"waiting");assert.equal((await nikB.remote.autoConnect()).kind,"waiting");
  assert.equal((await daniel.remote.autoConnect()).kind,"hosted");
  nikA.setHealthy(true);nikB.setHealthy(true);
  nikA.ask("remote-join-offer").wake();nikB.ask("remote-join-offer").wake();await drain();
  assert.equal(nikA.remote.getState().sessionState,"active","the first tab joined");
  assert.notEqual(nikB.remote.getState().sessionState,"active","the second tab's join was refused");
  const reads=g.offerReads.count;g.advance(3000);await nikB.tick();
  assert.equal(g.offerReads.count-reads,1,"its next 3 s check reads the offer again although the listener is healthy");
  assert.equal(nikB.remote.getState().sessionState,"active","and finds the session it belongs to");
});

test("JS-8: the first wait of a page attaches as soon as the listener module loads, only for a wait still asked",async()=>{
  const source=read("js/sparkPrivatePairing.js"),budgetSource=source.slice(source.indexOf("// Firestore budget layer (r75)."));
  assert.equal((budgetSource.match(/import\(url\)/g)||[]).length,1,"one listener module import");
  async function page(){
    let now=1_800_000_000_000,load=null;const listeners=[];
    const api={doc:(_db,p)=>({path:p}),onSnapshot(ref,_o,next){const l={path:ref.path,active:true,next};listeners.push(l);return()=>{l.active=false;};}};
    const sandbox={console,document:{visibilityState:"visible",addEventListener(){},documentElement:{dataset:{}}},addEventListener(){},dispatchEvent(){},CustomEvent:class{},
      setTimeout(){return 0;},clearTimeout(){},CareerModeProductionFirebaseRuntime:{firebaseFirestoreModule:"https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js"},
      __import:()=>new Promise(resolve=>{load=()=>resolve(api);})};
    sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext("Date.now=()=>__now();",Object.assign(sandbox,{__now:()=>now}));
    vm.runInContext(budgetSource.replace("import(url)","__import(url)"),sandbox,{filename:"sparkPrivatePairing.js#budget"});
    const budget=sandbox.CareerModeFirestoreBudget;
    const services=budget.services({ok:true,firestore:{},firestoreSdk:{runTransaction:async(_db,fn)=>fn({get:async()=>({exists:()=>false,data:()=>undefined,metadata:{fromCache:false}})})},auth:{currentUser:{uid:"nik"}}});
    await services.firestoreSdk.runTransaction(services.firestore,async tx=>tx.get({path:"rivalries/pair_x"}));
    const loaded=async()=>{for(let i=0;i<20&&!load;i++)await new Promise(resolve=>setImmediate(resolve));load();for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));};
    return {budget,listeners,loaded,jump:ms=>{now+=ms;},active:()=>listeners.filter(l=>l.active).map(l=>l.path)};
  }
  const P="rivalries/pair_x/sessionOffers/current";
  let p=await page();
  assert.equal(p.budget.watchWaitPoint("remote-join-offer",P,()=>{}),false);assert.deepEqual(p.active(),[],"nothing attaches before the module is there");
  await p.loaded();
  assert.deepEqual(p.active(),[P],"attached the moment the module loaded, not on the screen's next timed check");
  p=await page();
  p.budget.watchWaitPoint("remote-join-offer",P,()=>{});p.budget.watchWaitPoint("remote-join-offer",null,()=>{});
  await p.loaded();assert.deepEqual(p.active(),[],"a wait that ended while the module loaded attaches nothing");
  p=await page();
  p.budget.watchWaitPoint("remote-join-offer",P,()=>{});p.jump(5000);
  await p.loaded();assert.deepEqual(p.active(),[],"an ask older than the owner window (4.5 s) attaches nothing");
});

test("JS-13: a wake's read left over from a retired wait never silences the new wait's timed checks",async()=>{
  const g=remoteGame(),nik=g.player("playerTwo"),daniel=g.player("playerOne");
  assert.equal((await nik.remote.autoConnect()).kind,"waiting");
  // The listener wakes Nik and that read hangs (a dying connection); the phone comes back online: a new wait window starts.
  const open=g.hold(true);nik.ask("remote-join-offer").wake();await drain();
  await nik.online();
  // The listener is not healthy; Daniel publishes. The new wait's next 3 s check must find the offer and join.
  assert.equal((await daniel.remote.autoConnect()).kind,"hosted");
  g.advance(3000);await nik.tick();
  assert.equal(nik.calls.joins,1,"the new wait's timed check joins although the old read still hangs");
  assert.equal(nik.remote.getState().sessionState,"active");
  open();await drain();
  assert.equal(nik.calls.joins,1,"the old read, when it ends, joins nothing");
});

test("JS-14: when the ten-minute offer wait runs out the listener is let go, a late wake does nothing, and TRY AGAIN watches again",async()=>{
  const g=remoteGame(),nik=g.player("playerTwo"),daniel=g.player("playerOne");
  assert.equal((await nik.remote.autoConnect()).kind,"waiting");
  nik.setHealthy(true);const wake=nik.ask("remote-join-offer").wake;
  g.advance(10*60*1000+1);await nik.tick();
  assert.equal(nik.remote.getState().waitRetry,true,"the wait paused (TRY AGAIN)");
  assert.equal(nik.ask("remote-join-offer").path,null,"a paused wait keeps no listener");
  assert.equal((await daniel.remote.autoConnect()).kind,"hosted");
  const reads=g.offerReads.count;wake();await drain();
  assert.equal(g.offerReads.count-reads,0,"a late wake of the paused wait reads nothing");
  assert.equal(nik.calls.joins,0,"and joins nothing");
  await nik.online();
  assert.equal(nik.calls.joins,1,"the resumed wait checks at once and joins");
});

test("JS-9: the code says what the tests above rely on",()=>{
  const pair=read("js/persistentNikDanielPair.js"),remote=read("js/sparkRemoteJoining.js"),budget=read("js/sparkPrivatePairing.js");
  const close=read("js/productionSharedTerminalClose.js"),setup=read("js/productionSharedShowdownPresentation.js");
  // No new listener: all three waits use the census-listed budget wait listener.
  assert.equal((remote.match(/onSnapshot/g)||[]).length,0,"Remote Joining keeps no listener of its own");
  assert.match(pair,/budget\.watchWaitPoint\("pair-wait",path,pairWaitWake\)/);
  assert.match(remote,/budget\.watchWaitPoint\("remote-join-offer",path,/);assert.match(remote,/budget\.watchWaitPoint\("remote-join-session",path,/);
  // Stand down only while the listener on that exact path is healthy and the last check is under 30 s old.
  assert.match(pair,/function pairWaitHealthy\(\)\{[^\n]*live\?\.watchHealthy===true&&live\.watching===path\)/);
  assert.match(pair,/const standDown=!woken&&Date\.now\(\)<pairWaitStopAt\(\)&&Date\.now\(\)-pairWaitCheckedAt<PAIR_WAIT_BACKSTOP_MS&&pairWaitHealthy\(\);/);
  assert.match(pair,/const PAIR_WAIT_BACKSTOP_MS=30000;/);
  assert.match(remote,/function srjWatchHealthy\(path\)\{[^\n]*live\?\.watchHealthy===true&&live\.watching===path\)/);
  assert.match(remote,/standDown=Date\.now\(\)-srjOfferCheckedAt<SRJ_WAIT_BACKSTOP_MS&&srjWatchHealthy\(watched\)/);
  assert.match(remote,/standDown=Date\.now\(\)-srjJoinCheckedAt<SRJ_WAIT_BACKSTOP_MS&&srjWatchHealthy\(watched\)/);
  assert.match(remote,/const SRJ_WAIT_BACKSTOP_MS=30000;/);
  // A wake's in-flight flag belongs to its own wait generation; a paused wait asks for no listener.
  assert.match(remote,/srjOfferWaking=generation;/);assert.match(remote,/srjJoinWaking=generation;/);
  assert.match(remote,/!srjState\.busy&&srjOfferWaking!==generation&&/);assert.match(remote,/!srjState\.busy&&srjJoinWaking!==generation&&/);
  assert.match(remote,/srjState\.auto==="waiting"&&!srjState\.waitRetry&&!srjHasNonterminalSession\(\)&&root\.document\?\.visibilityState!=="hidden"\?`rivalries/);
  assert.match(remote,/function srjJoinWaitPath\(sessionId\)\{return srjHostWaitingForJoin\(sessionId\)&&!srjState\.waitRetry&&/);
  // The rivalry document itself may be a wait path.
  assert.match(budget,/\/\^rivalries\\\/\[\^\/\]\+\(\?:\\\/\[\^\/\]\+\\\/\[\^\/\]\+\)\*\$\/\.test\(path\)/);
  // Terminal Close's early watch only attaches the context listener; the setup screen asks for it only while its setup is pending.
  assert.match(close,/function ptcWatchEarly\(\)\{if\(contextWatchKey\|\|root\.document\?\.visibilityState==="hidden"\)return false;let request=null;try\{request=ptcRequest\(\);\}catch\(_error\)\{request=null;\}if\(!request\)return false;ptcWatchContext\(request\);return Boolean\(contextWatchKey\);\}/);
  assert.match(close,/install:ptcInstall,watchContextEarly:ptcWatchEarly,/);
  assert.match(setup,/function ssjpWatchContext\(\)\{if\(!active\|\|!ssjpPending\(\)\)return;try\{root\.CareerModeProductionSharedTerminalClose\?\.watchContextEarly\?\.\(\);\}catch\(_error\)\{\}\}/);
  assert.match(setup,/async function ssjpPoll\(\)\{ssjpWatchWait\(\);ssjpWatchContext\(\);/);
});
