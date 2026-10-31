"use strict";
// r87 RT5-FLOW-02 (Nik 2026-10-31): the shared transfer window waits until both managers have spun this season's Russian Roster
// Roulette. Part A drives the real Spark provider (js/sparkSharedTransferChallenge.js) on an in-memory Firestore with merge
// writes; part B runs the real production Transfer Challenge module (js/productionSharedTransferChallenge.js) in a VM with a
// fake page, a fake provider and a fake roulette step, and checks the coordinator's START panel and taps.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
global.window=globalThis;
require("../../data/transferOptions.js");
const Provider=require("../../js/sparkSharedTransferChallenge.js");
const Step=require("../../js/rosterRouletteStep.js");

const rivalryId="pair_"+"a".repeat(64),sessionId="session_"+"b".repeat(64);
const device1="device_"+"1".repeat(32),device2="device_"+"2".repeat(32),uid1="manager_one",uid2="manager_two";
const op=n=>`transfer_op_${Number(n).toString(16).padStart(32,"0")}`;
const ts=millis=>({toMillis:()=>millis});
const PUBLIC_KEYS=["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision","startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles","operationIds","operationTypes","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"];
function clone(value){
  if(value===undefined)return undefined;
  const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==="function"?{__millis:item.toMillis()}:item);
  return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);
}
const plain=value=>value&&typeof value==="object"&&!Array.isArray(value)&&typeof value.toMillis!=="function";
function merge(base,patch){const out=plain(base)?{...base}:{};for(const [key,value] of Object.entries(patch))out[key]=plain(value)&&plain(out[key])?merge(out[key],value):value;return out;}

function createHarness(setupUpdatedAtMs){
  const store=new Map(),getLog=[],writes=[];
  const key=(...parts)=>parts.join("/"),put=(p,value)=>store.set(p,clone(value));
  put(key("accounts",uid1),{objectType:"account",objectId:uid1,lifecycleState:"live",data:{status:"active"}});
  put(key("accounts",uid2),{objectType:"account",objectId:uid2,lifecycleState:"live",data:{status:"active"}});
  put(key("accounts",uid1,"devices",device1),{objectType:"device",objectId:device1,lifecycleState:"live",data:{deviceId:device1,state:"active"}});
  put(key("accounts",uid2,"devices",device2),{objectType:"device",objectId:device2,lifecycleState:"live",data:{deviceId:device2,state:"active"}});
  put(key("rivalries",rivalryId),{objectType:"rivalry",objectId:rivalryId,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:"playerOne",accountId:uid1,entitlementState:"active"},{slotId:"playerTwo",accountId:uid2,entitlementState:"active"}]}});
  put(key("rivalries",rivalryId,"sessions",sessionId),{objectType:"session",objectId:sessionId,lifecycleState:"live",data:{rivalryId,state:"active",memberAccountIds:[uid1,uid2],expiresAt:ts(10_000_000)}});
  put(key("rivalries",rivalryId,"sharedSetup","authoritative"),{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],...(Number.isFinite(setupUpdatedAtMs)?{updatedAt:ts(setupUpdatedAtMs)}:{})});
  put(key("rivalries",rivalryId,"careerStart","authoritative"),{schemaVersion:1,objectType:"sharedCareerStart",rivalryId,setupRevision:6,totalSeasons:3,revision:2,phase:"CAREER_START_READY",acknowledgedRoles:["playerOne","playerTwo"]});
  let serverNow=0;
  const sdk={
    doc:(_db,...parts)=>key(...parts),Timestamp:{fromMillis:millis=>ts(millis)},serverTimestamp:()=>ts(serverNow),
    runTransaction:async(_db,callback)=>{
      const pending=[];
      const result=await callback({get:async ref=>{getLog.push(ref);return {exists:()=>store.has(ref),data:()=>clone(store.get(ref))};},set:(ref,value,options)=>pending.push([ref,clone(value),options&&options.merge===true])});
      for(const [ref,value,isMerge] of pending){writes.push(ref);store.set(ref,isMerge?merge(store.get(ref),value):value);}
      return result;
    }
  };
  const options=(role,nowEpochMs,extra={})=>{serverNow=nowEpochMs;return {user:{uid:role==="playerOne"?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==="playerOne"?device1:device2,seasonNumber:1,cryptoImpl:webcrypto,nowEpochMs,...extra};};
  return {store,getLog,writes,options,publicPath:key("rivalries",rivalryId,"transferChallenges","season_1")};
}

async function partA(){
  assert.equal(typeof Provider.markSpun,"function","the provider writes a manager's own spun mark");

  assert.equal(Provider.rouletteFromMs,Step.fromMs,"the provider and the roulette step share RRR_FROM_MS");
  const ELIGIBLE=Step.fromMs+60_000,BEFORE=Step.fromMs-60_000;

  // A0 (Codex P2 on #1101): in a roulette-eligible season a START with no flag and no mark is refused by the provider itself.
  const bare=createHarness(ELIGIBLE);
  let result=await Provider.startWindow({...bare.options("playerOne",1_000_000),operationId:op(9),baseRevision:0});
  assert.equal(result.ok,false);assert.equal(result.code,"TRANSFER_ROULETTE_PENDING","an eligible season never opens without both marks, whoever calls START");
  assert.equal(bare.store.has(bare.publicPath),false,"nothing was written");
  result=await Provider.startWindow({...bare.options("playerOne",1_000_001),operationId:op(10),baseRevision:0,requireSpins:false});
  assert.equal(result.code,"TRANSFER_ROULETTE_PENDING","no caller flag can switch the check off");

  // A1: one mark is not enough.
  const h=createHarness(ELIGIBLE);
  const reads=h.getLog.length;
  result=await Provider.markSpun({...h.options("playerOne",1_000_000),managerRole:"playerOne"});
  assert.equal(result.ok,true);assert.equal(h.getLog.length,reads,"the mark costs no read");assert.deepEqual(h.writes,[h.publicPath],"the mark is one write of the season's public document");
  assert.deepEqual(Object.keys(h.store.get(h.publicPath)).sort(),["objectType","phase","rivalryId","schemaVersion","seasonNumber","spins","updatedAt"]);
  let view=await Provider.read(h.options("playerOne",1_000_010));
  assert.equal(view.ok,true);assert.equal(view.state,null,"a mark document is not a started window");assert.deepEqual([...view.spunRoles],["playerOne"]);
  result=await Provider.startWindow({...h.options("playerOne",1_000_020),operationId:op(1),baseRevision:0});
  assert.equal(result.ok,false);assert.equal(result.code,"TRANSFER_ROULETTE_PENDING","START waits for Nik's spin");
  // ...and a season with a mark waits for both even when its Setup carries no confirm time.
  const marked=createHarness();await Provider.markSpun({...marked.options("playerOne",1_000_025),managerRole:"playerOne"});
  result=await Provider.startWindow({...marked.options("playerOne",1_000_030),operationId:op(2),baseRevision:0});
  assert.equal(result.ok,false);assert.equal(result.code,"TRANSFER_ROULETTE_PENDING","a season with a mark waits for both");
  assert.equal(h.store.get(h.publicPath).phase,"NOT_STARTED");

  // A2: the window cannot expire before it opened.
  result=await Provider.advanceExpiredWindow({...h.options("playerTwo",9_000_000),operationId:op(3),baseRevision:0});
  assert.equal(result.ok,false);assert.equal(result.code,"TRANSFER_NOT_STARTED");assert.equal(h.store.get(h.publicPath).phase,"NOT_STARTED");

  // A3: reload keeps the mark (it is on the server); writing it again changes nothing; the partner's mark adds his role only.
  view=await Provider.read(h.options("playerTwo",1_000_040));
  assert.deepEqual([...view.spunRoles],["playerOne"],"another phone and a reloaded page see the same mark");
  result=await Provider.markSpun({...h.options("playerOne",1_000_050),managerRole:"playerOne"});
  assert.equal(result.ok,true);assert.deepEqual(h.store.get(h.publicPath).spins,{playerOne:true},"a second write of the same mark is idempotent");
  result=await Provider.markSpun({...h.options("playerTwo",1_000_060),managerRole:"playerTwo"});
  assert.equal(result.ok,true);assert.deepEqual(h.store.get(h.publicPath).spins,{playerOne:true,playerTwo:true});
  view=await Provider.read(h.options("playerOne",1_000_070));
  assert.deepEqual([...view.spunRoles],["playerOne","playerTwo"]);

  // A4: with both marks START opens the window, and the ledger has exactly its old keys (no other reader changes).
  result=await Provider.startWindow({...h.options("playerOne",1_000_080),operationId:op(4),baseRevision:0});
  assert.equal(result.ok,true);assert.equal(result.state.phase,"WINDOW_OPEN");
  assert.deepEqual(Object.keys(h.store.get(h.publicPath)).sort(),[...PUBLIC_KEYS].sort(),"the started ledger replaces the mark document");
  view=await Provider.read(h.options("playerTwo",1_000_090));
  assert.equal(view.state.phase,"WINDOW_OPEN");assert.equal(view.spunRoles,null);

  // A5: an old Showdown (confirmed before RRR_FROM_MS), one with no confirm time, and the switched-off roulette: no marks, opens at once.
  for(const [label,at,off] of [["old Showdown",BEFORE,false],["no confirm time",undefined,false],["roulette off",ELIGIBLE,true]]){
    const old=createHarness(at);if(off)globalThis.CMS_ROSTER_ROULETTE="off";
    try{result=await Provider.startWindow({...old.options("playerOne",2_000_000),operationId:op(5),baseRevision:0});}finally{delete globalThis.CMS_ROSTER_ROULETTE;}
    assert.equal(result.ok,true,`${label}: a season the roulette does not apply to never blocks`);assert.equal(result.state.phase,"WINDOW_OPEN");
  }
  // A5b: the roulette is switched off after one mark: START still waits for both; the partner's own mark (allowed with the
  // roulette off) then lets START open the window.
  {const flip=createHarness(ELIGIBLE);await Provider.markSpun({...flip.options("playerOne",3_000_000),managerRole:"playerOne"});globalThis.CMS_ROSTER_ROULETTE="off";
    try{
      result=await Provider.startWindow({...flip.options("playerOne",3_000_010),operationId:op(11),baseRevision:0});
      assert.equal(result.code,"TRANSFER_ROULETTE_PENDING","a stored mark keeps START waiting for both after the switch");
      assert.equal((await Provider.markSpun({...flip.options("playerTwo",3_000_020),managerRole:"playerTwo"})).ok,true);
      result=await Provider.startWindow({...flip.options("playerOne",3_000_030),operationId:op(12),baseRevision:0});
      assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.state.phase,"WINDOW_OPEN");
    }finally{delete globalThis.CMS_ROSTER_ROULETTE;}}
  assert.equal(Provider.rouletteEligible(Step.fromMs),true);assert.equal(Provider.rouletteEligible(Step.fromMs-1),false);assert.equal(Provider.rouletteEligible(Number.NaN),false);

  // A6: the mark names only a real role and a valid season.
  result=await Provider.markSpun({...createHarness().options("playerOne",1),managerRole:"referee"});
  assert.equal(result.ok,false);assert.equal(result.code,"TRANSFER_ROLE_INVALID");
}

// ---------- part B: the production module ----------
const {FakeNode}=require("../support/fake-dom.cjs");
const SOURCE=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTransferChallenge.js"),"utf8");
function fakePage(){
  const byId=new Map(),listeners=[];
  const doc={
    visibilityState:"visible",
    getElementById(id){if(!byId.has(id)){const node=new FakeNode("div");node.id=id;node.hasAttribute=k=>Object.prototype.hasOwnProperty.call(node.attributes,k);node.removeAttribute=k=>{delete node.attributes[k];};if(id==="transferChallenge")node.classList.add("hidden");byId.set(id,node);}return byId.get(id);},
    querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new FakeNode(tag),
    addEventListener(type,fn,capture){listeners.push({type,fn,capture});}
  };
  const tap=id=>{const target=doc.getElementById(id);for(const l of listeners.filter(item=>item.type==="click"))l.fn({target:{closest:()=>target},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});};
  return {doc,tap};
}
function fakeProvider(store,eligible){
  const calls={markSpun:[],startWindow:[],read:0};
  const projection=role=>store.state?{ok:true,revision:store.state.revision,state:store.state,managerRole:role,seasonNumber:1,spunRoles:null,ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null}:{ok:true,revision:0,state:null,managerRole:role,seasonNumber:1,spunRoles:[...store.spins],ownInputs:null,opponentInputs:null,verdicts:null};
  return {calls,api:{
    rouletteEligible:eligible,
    read:async options=>{calls.read+=1;return projection(options.user.uid===uid1?"playerOne":"playerTwo");},
    markSpun:async options=>{calls.markSpun.push(options.managerRole);if(store.refuseMarks)return {ok:false,code:"permission-denied"};if(!store.spins.includes(options.managerRole))store.spins=["playerOne","playerTwo"].filter(r=>r===options.managerRole||store.spins.includes(r));return {ok:true};},
    startWindow:async options=>{calls.startWindow.push(Object.keys(options).includes("requireSpins")?"flag":"plain");store.state={phase:"WINDOW_OPEN",revision:1,startedAtEpochMs:options.nowEpochMs,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]};return {ok:true,status:"accepted",revision:1,state:store.state,managerRole:"playerOne",seasonNumber:1,needsRefresh:false};},
    requestEndWindow:async()=>({ok:false}),advanceExpiredWindow:async()=>({ok:false}),lockGuesses:async()=>({ok:false}),lockSignings:async()=>({ok:false})
  }};
}
async function settle(){for(let i=0;i<30;i+=1)await new Promise(resolve=>setImmediate(resolve));}
// One phone: the real module, a fake page, the given role and confirm time, a roulette step that is already done on this browser.
async function phone({role,confirmedAtMs,store,killSwitch=false,step=null,awaitOpen=true}){
  const page=fakePage(),intervals=[];let sandbox=null;
  const provider=fakeProvider(store,ms=>Number.isFinite(ms)&&ms>=Provider.rouletteFromMs&&sandbox.CMS_ROSTER_ROULETTE!=="off");
  sandbox={
    console,Date,Promise,JSON,Math,Number,String,Array,Object,Set,Map,Error,Boolean,RegExp,Uint8Array,
    setTimeout:(fn,ms)=>ms>=1000?0:setTimeout(fn,ms),clearTimeout:()=>{},setInterval:fn=>{intervals.push(fn);return 0;},clearInterval:()=>{},
    performance:{now:()=>Date.now()},crypto:webcrypto,document:page.doc,addEventListener(){},
    currentShowdown:{id:"save_1",currentRound:1,sharedJourney:{mode:"shared",rivalryId},managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"}},
    navigateTo:async id=>{page.doc.getElementById(id).classList.remove("hidden");return true;},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>null,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"}},managerRole:role,rivalryId,sessionId,deviceId:role==="playerOne"?device1:device2,setupUpdatedAtMs:confirmedAtMs})},
    CareerModeProductionSharedCareerStart:{refresh:async()=>null,getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})},
    CareerModeSharedTransferChallenge:{},CareerModeSparkSharedTransferChallenge:provider.api,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role==="playerOne"?uid1:uid2,getIdTokenResult:async()=>({issuedAtTime:new Date().toISOString()})}},firestore:{},firestoreSdk:{}})},
    CareerModeRosterRouletteStep:step||{fromMs:Step.fromMs,decide:()=>false,runBeforeTransfers:async()=>true,close(){}}
  };
  if(killSwitch)sandbox.CMS_ROSTER_ROULETTE="off";
  sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(SOURCE,sandbox,{filename:"productionSharedTransferChallenge.js"});
  const api=sandbox.CareerModeProductionSharedTransferChallenge;api.install();await settle();
  if(awaitOpen){assert.equal(await api.open(),true,`${role} reaches the Transfer Challenge`);await settle();}else{void api.open();await settle();}
  const tick=async()=>{for(const fn of intervals)fn();await settle();};
  const start=page.doc.getElementById("startTransferTimer");
  return {api,page,provider,start,tick,status:()=>page.doc.getElementById("transferPhaseStatus").textContent};
}

async function partB(){
  const R87=Step.fromMs+60_000,OLD=Step.fromMs-60_000;

  // B1: Daniel has spun, Nik has not: his own mark is written once, START is the waiting line (shown, gold, not tappable).
  const store={spins:[],state:null};
  const daniel=await phone({role:"playerOne",confirmedAtMs:R87,store});
  assert.deepEqual(daniel.provider.calls.markSpun,["playerOne"],"Daniel's mark is written when his roulette is done");
  assert.deepEqual(store.spins,["playerOne"]);
  assert.equal(daniel.start.classList.contains("hidden"),false,"the START panel stays on screen");
  assert.equal(daniel.start.textContent,"WAITING FOR NIK TO SPIN THE ROULETTE","the waiting line names the partner");
  assert.equal(daniel.start.dataset.rouletteWait,"true","the waiting look (gold edge, never dimmed: css/transfer.css)");
  assert.equal(daniel.start.disabled,true);assert.match(daniel.status(),/WAITING FOR NIK TO SPIN THE ROULETTE/);
  assert.deepEqual(Array.from(daniel.api.spinsMissing()),["playerTwo"]);
  daniel.page.tap("startTransferTimer");await settle();
  assert.equal(daniel.provider.calls.startWindow.length,0,"a tap while Nik has not spun never starts the window");

  // B2: Nik's mark arrives (the wait listener wakes the screen's refresh): START turns on by itself and starts with the gate.
  store.spins=["playerOne","playerTwo"];
  await daniel.api.refresh();await settle();
  assert.equal(daniel.start.textContent,"START 15-MINUTE WINDOW");assert.equal(daniel.start.disabled,false);assert.equal(daniel.start.dataset.rouletteWait,undefined);
  daniel.page.tap("startTransferTimer");await settle();
  assert.deepEqual(daniel.provider.calls.startWindow,["plain"],"START goes to the provider, which checks the marks itself (no opt-in flag)");

  // B3: reload: a new page with the marks already on the server writes nothing again and does not wait.
  const reload={spins:["playerOne","playerTwo"],state:null};
  const again=await phone({role:"playerOne",confirmedAtMs:R87,store:reload});
  assert.deepEqual(again.provider.calls.markSpun,[],"a mark on the server survives a reload and is not written twice");
  assert.equal(again.start.textContent,"START 15-MINUTE WINDOW");assert.equal(again.start.disabled,false);
  // ...and a reload with only Daniel's mark still waits for Nik.
  const half=await phone({role:"playerOne",confirmedAtMs:R87,store:{spins:["playerOne"],state:null}});
  assert.deepEqual(half.provider.calls.markSpun,[]);assert.equal(half.start.textContent,"WAITING FOR NIK TO SPIN THE ROULETTE");

  // B4: Nik's phone writes his own mark (never Daniel's) and keeps the normal non-coordinator panel.
  const nikStore={spins:["playerOne"],state:null};
  const nik=await phone({role:"playerTwo",confirmedAtMs:R87,store:nikStore});
  assert.deepEqual(nik.provider.calls.markSpun,["playerTwo"]);assert.deepEqual(nikStore.spins,["playerOne","playerTwo"]);
  assert.equal(nik.start.classList.contains("hidden"),true,"Nik never sees START");

  // B5: an old Showdown (confirmed before the roulette) and the switched-off roulette pass by themselves: no mark, no wait.
  for(const [label,options] of [["old Showdown",{confirmedAtMs:OLD}],["no confirm time",{confirmedAtMs:undefined}],["roulette off",{confirmedAtMs:R87,killSwitch:true}]]){
    const s={spins:[],state:null},p=await phone({role:"playerOne",store:s,...options});
    assert.deepEqual(p.provider.calls.markSpun,[],`${label}: no mark is written`);
    assert.equal(p.start.textContent,"START 15-MINUTE WINDOW",`${label}: START is ready at once`);assert.equal(p.start.disabled,false);
    p.page.tap("startTransferTimer");await settle();
    assert.deepEqual(p.provider.calls.startWindow,["plain"],`${label}: START goes straight to the provider`);
  }

  // B6: Rules on the server that do not know the marks (refused write): the window stays shut (the provider would refuse START),
  // the refused write is not retried on every check, and the line says to reload.
  const refused=await phone({role:"playerOne",confirmedAtMs:R87,store:{spins:[],state:null,refuseMarks:true}});
  assert.equal(refused.start.textContent,"YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY");assert.equal(refused.start.disabled,true);assert.equal(refused.start.dataset.rouletteWait,"true");
  await refused.api.refresh();await settle();
  assert.deepEqual(refused.provider.calls.markSpun,["playerOne"],"a refused mark is written once per page, not on every check");
  refused.page.tap("startTransferTimer");await settle();assert.equal(refused.provider.calls.startWindow.length,0);

  // B7: the gate helper follows RRR_FROM_MS exactly.
  const applies=daniel.api.rouletteAppliesTo;
  assert.equal(applies(Step.fromMs,Step),true);assert.equal(applies(Step.fromMs-1,Step),false);assert.equal(applies(Number.NaN,Step),false);

  // B8 (Codex P2 #1101, comment 4431577474): the roulette is switched off after Daniel's mark was saved. The provider still waits
  // for both (a mark exists), so Daniel's START keeps waiting, Nik's phone writes his own mark on reaching the step with no
  // roulette shown, and Daniel's START then opens the window.
  const flipped={spins:["playerOne"],state:null};
  const danielOff=await phone({role:"playerOne",confirmedAtMs:R87,store:flipped,killSwitch:true});
  assert.deepEqual(danielOff.provider.calls.markSpun,[],"Daniel's mark is already stored");
  assert.equal(danielOff.start.textContent,"WAITING FOR NIK TO SPIN THE ROULETTE","with a stored mark START still waits, as the provider does");
  danielOff.page.tap("startTransferTimer");await settle();assert.equal(danielOff.provider.calls.startWindow.length,0);
  const nikOff=await phone({role:"playerTwo",confirmedAtMs:R87,store:flipped,killSwitch:true});
  assert.deepEqual(nikOff.provider.calls.markSpun,["playerTwo"],"Nik's phone writes his own mark automatically (the roulette is off, so none is shown)");
  assert.deepEqual(flipped.spins,["playerOne","playerTwo"]);
  await danielOff.api.refresh();await settle();
  assert.equal(danielOff.start.textContent,"START 15-MINUTE WINDOW");assert.equal(danielOff.start.disabled,false);
  danielOff.page.tap("startTransferTimer");await settle();
  assert.deepEqual(danielOff.provider.calls.startWindow,["plain"],"START succeeds once Nik's automatic mark landed");

  // B9 (Codex P1 #1101, comment 4431666801): only Daniel has marked; Nik's phone is installed with the roulette on and his roulette
  // showing but not spun. The partner's mark alone never counts as his: no playerTwo write from install, refresh or any check.
  const unspun={spins:["playerOne"],state:null};
  const spinning={fromMs:Step.fromMs,decide:()=>true,runBeforeTransfers:()=>new Promise(()=>{}),close(){}};
  const nikSpinning=await phone({role:"playerTwo",confirmedAtMs:R87,store:unspun,step:spinning,awaitOpen:false});
  await nikSpinning.api.refresh();await settle();await nikSpinning.tick();await nikSpinning.tick();
  assert.deepEqual(nikSpinning.provider.calls.markSpun,[],"no mark for Nik before his own roulette is done");
  assert.deepEqual(unspun.spins,["playerOne"]);
}

// ---------- part C: reads. The partner's mark wakes the waiting screen on the listener's copy (no context re-read) ----------
// The budget layer (js/sparkPrivatePairing.js) on a fake clock and a fake Firestore, as tests/contracts/r87-reads-sp-fixes-contracts.cjs.
async function partC(){
  const pairing=fs.readFileSync(path.resolve(__dirname,"../../js/sparkPrivatePairing.js"),"utf8");
  const BUDGET_SOURCE=pairing.slice(pairing.indexOf("// Firestore budget layer (r75)."));
  const clock={now:1_800_000_000_000},timers=[];let seq=0;
  const sandbox={console,document:{visibilityState:"visible",documentElement:{dataset:{}},addEventListener(){}},addEventListener(){},dispatchEvent(){return true;},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    setTimeout(fn,ms){const id=++seq;timers.push({id,at:clock.now+Math.max(0,Number(ms)||0),fn});return id;},clearTimeout(id){const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext("Date.now=()=>__clockNow();",Object.assign(sandbox,{__clockNow:()=>clock.now}));
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:"sparkPrivatePairing.js#budget"});
  const budget=sandbox.CareerModeFirestoreBudget,server=new Map(),gets={},listeners=[];let version=1;
  const snapshotOf=p=>{const record=server.get(p);const data=record?JSON.parse(JSON.stringify(record.data)):null;return {id:p.split("/").pop(),ref:{path:p},exists:()=>Boolean(record),data:()=>data?JSON.parse(JSON.stringify(data)):undefined,metadata:{fromCache:false,hasPendingWrites:false},_document:{version:{timestamp:{seconds:record?record.version:0,nanoseconds:0}}}};};
  const write=(p,data)=>{version+=1;server.set(p,{data,version});for(const l of listeners)if(l.active&&l.path===p)Promise.resolve().then(()=>{if(l.active)l.next(snapshotOf(p));});};
  const db={kind:"fake"};
  const sdk={async runTransaction(_db,fn){const tx={async get(ref){gets[ref.path]=(gets[ref.path]||0)+1;return snapshotOf(ref.path);},set(){return tx;},update(){return tx;},delete(){return tx;}};return fn(tx);},
    doc:(_db,...segments)=>({path:segments.join("/")}),
    onSnapshot(ref,_options,next){const l={path:ref.path,next,active:true};listeners.push(l);Promise.resolve().then(()=>{if(l.active)l.next(snapshotOf(ref.path));});return ()=>{l.active=false;};}};
  const services=budget.services({ok:true,firestore:db,firestoreSdk:sdk,auth:{currentUser:{uid:"daniel"}}});
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  async function advance(ms){const end=clock.now+ms;for(;;){for(let i=0;i<10;i+=1)await flush();timers.sort((a,b)=>a.at-b.at||a.id-b.id);const next=timers[0];if(!next||next.at>end)break;timers.shift();clock.now=Math.max(clock.now,next.at);next.fn();}clock.now=end;for(let i=0;i<10;i+=1)await flush();}
  const RV=`rivalries/${rivalryId}`,SS=`${RV}/sessions/${sessionId}`,P=`${RV}/transferChallenges/season_1`;
  server.set(RV,{data:{data:{connectionState:"active"}},version:1});server.set(SS,{data:{data:{state:"active"}},version:1});
  // The START screen's check: rivalry, session and the season's public document, as the provider's read does.
  const check=()=>services.firestoreSdk.runTransaction(db,async t=>{await t.get({path:RV});await t.get({path:SS});const s=await t.get({path:P});return s.exists()?s.data():null;});
  write(P,{phase:"NOT_STARTED",spins:{playerOne:true}});
  await check();let wakes=0;
  budget.watchWaitPoint("transfer",P,()=>{wakes+=1;},{relaxed:true});await advance(1000);
  assert.equal(budget.stats().watchHealthy,true,"the START screen's listener watches the season document");
  const before={rv:gets[RV],ss:gets[SS],p:gets[P]||0};
  write(P,{phase:"NOT_STARTED",spins:{playerOne:true,playerTwo:true}});await advance(500);
  assert.equal(wakes,1,"Nik's mark wakes Daniel's screen through the listener");
  const seen=await check();
  assert.deepEqual(seen.spins,{playerOne:true,playerTwo:true},"the woken check sees both marks");
  assert.deepEqual({rv:gets[RV],ss:gets[SS],p:gets[P]||0},before,"no document is read again for a mark: the listener's copy serves the season document, the rest is kept");
  // The window opening is a real change of the waited document: it forgets the context, as every other partner move does.
  write(P,{phase:"WINDOW_OPEN",revision:1});await advance(500);
  assert.equal(wakes,2);await check();
  assert.equal(gets[RV],before.rv+1,"after the window opened the context is read again");
}

(async()=>{
  await partA();
  await partB();
  await partC();
  console.log("PASS r87 RT5-FLOW-02 wait for both spins: one mark is not enough, two open the window, an old or roulette-less season passes, a mark survives a reload, the window cannot expire before it opened, the coordinator's START panel waits with the partner's name and flips by itself, and the partner's mark costs the waiting phone no context re-read.");
})().catch(error=>{console.error(error);process.exitCode=1;});
