"use strict";
// Phoenix 3.0 W2 F3 (B3, swap fault): a manager whose phone dies at the last CONFIRM SEASON signs in on another device. That
// device holds no due note (cms.championPending.v1 lives on the old phone) and never showed this Showdown's Champion, so Home
// showed and the Showdown Champion never appeared for him. The lead's call (option 2): on such a device only, one Terminal
// Close read, judged by the close's server-checked time; Final Winner shows as today when the close is at most 10 minutes old.
// Never on a phone that showed the Champion (cms.championShown.v1), never once the page left Home, never twice on a page, and
// Home always stays when anything is off (old close, ended early, another save, a failed read).
// In 3.0 (Nik 2026-11-24 "Put that fix in"): a truly fresh device holds no save at all, so FD11/FD12 add the rebuild: the closed
// pair's exact slot rebuilds the shell (as a live Showdown's does), Connected Rivalry points this device at the closed rivalry
// (read-only check, local pointer; allowClosed only on that call), then the same Terminal Close read and Final Winner.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const ENTRY=read("js/productionSharedJourneyEntry.js");
const R="pair_"+"d".repeat(64),OTHER="pair_"+"e".repeat(64),SAVE="save_"+"1".repeat(24);
const NOW=1_800_000_000_000;
let passed=0;const ok=(id,label)=>{passed++;console.log(`ok   ${id} ${label}`);};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function settle(){for(let i=0;i<14;i++)await tick();}

// One fresh page on Home, signed in. tc = Terminal Close's answer; closedAgoMs = how long ago the close landed (server time).
function page({tc="CLOSED",closedAgoMs=60_000,storage:seed={},activeSaveId=SAVE,serverOffsetMs=0}={}){
  const calls={nav:[],refresh:0,errors:[]};
  const listeners={doc:new Map(),win:new Map()};
  const on=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn);};
  const pairListeners=new Set();let pairState={initialized:true,status:"unpaired",busy:false,rivalryId:null,connectionState:null,closedRivalryId:null,closedProviderSaveId:null};
  let tcState=null,active="mainMenu";const storage=new Map(Object.entries(seed));
  const ctx={console,setTimeout,clearTimeout,Promise,Set,Map,JSON,Object,Error,Number,String,Boolean,
    Date:{now:()=>NOW},
    document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),documentElement:{},addEventListener:(t,f)=>on(listeners.doc,t,f)},
    MutationObserver:class{observe(){}},
    addEventListener:(t,f)=>on(listeners.win,t,f),
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    readStorageValue:key=>storage.has(key)?storage.get(key):null,removeStorageValue:key=>storage.delete(key),writeStorageValue:(k,v)=>{storage.set(k,v);return true;},
    getActiveScreenName:()=>active,
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId,saves:[]})},
    loadSavedShowdown:()=>({sharedJourney:{mode:"shared",rivalryId:R}}),
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:R})},
    CareerModeProductionSharedSeasonResults:{},
    CareerModeSparkRemoteJoining:{closePanel:()=>true,clockNow:()=>NOW+serverOffsetMs},
    CareerModeConnectPlayersScreenV10:{close:()=>true},
    CareerModePersistentNikDanielPair:{subscribe:fn=>{pairListeners.add(fn);return()=>pairListeners.delete(fn);},getState:()=>pairState},
    CareerModeProductionSharedTerminalClose:{install(){},getState:()=>tcState,refresh:async()=>{calls.refresh++;
      if(tc==="FAIL")throw new Error("offline");
      tcState=tc==="CLOSED"?{phase:"CLOSED",terminal:true,rivalryId:R,closedAtMs:closedAgoMs===null?null:NOW+serverOffsetMs-closedAgoMs}:tc==="DELETED"?{phase:"DELETED",terminal:false,deleted:true,rivalryId:R}:null;return tcState;}},
    navigateTo:async id=>{calls.nav.push(id);active=id;for(const f of listeners.doc.get("career-mode-screen-shown")||[])f();return true;},
    reportApplicationError:(c,e)=>calls.errors.push(`${c}: ${e&&e.message}`)};
  ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext("var currentShowdown=null;",ctx);
  vm.runInContext(ENTRY,ctx,{filename:"productionSharedJourneyEntry.js"});
  const entry=ctx.CareerModeProductionSharedJourneyEntry;entry.install();
  return {calls,entry,storage,
    pair(next){pairState={...pairState,...next};for(const f of [...pairListeners])f(pairState);},
    tcEvent(state){tcState=state;for(const f of listeners.win.get("career-mode-shared-terminal-close-state-change")||[])f({detail:{phase:state.phase,rivalryId:state.rivalryId}});},
    show(id){active=id;for(const f of listeners.doc.get("career-mode-screen-shown")||[])f();}};
}
const closedPair={status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:R,closedProviderSaveId:SAVE};
const SHOWN="cms.championShown.v1",DUE="cms.championPending.v1";

(async()=>{
  // FD1 the swapped phone: closed a minute ago, nothing on this device: one read, Final Winner, noted as shown.
  {
    const p=page();p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"]);assert.equal(p.calls.refresh,1);assert.equal(p.storage.get(SHOWN),R);
    p.show("mainMenu");p.pair({...closedPair});await settle();
    assert.equal(p.calls.refresh,1,"never a second read on this page");assert.deepEqual(p.calls.nav,["seasonEntry"]);
    ok("FD1","a fresh device right after the close shows the Showdown Champion once, with one Terminal Close read");
  }
  // FD2 the close is older than 10 minutes by server time: Home stays, settled (never read again on this device).
  {
    const p=page({closedAgoMs:11*60_000});p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,1);assert.equal(p.storage.get(SHOWN),R);
    const again=page({closedAgoMs:11*60_000,storage:{[SHOWN]:R}});again.pair(closedPair);await settle();
    assert.equal(again.calls.refresh,0);assert.deepEqual(again.calls.nav,[]);
    ok("FD2","an old close keeps Home and is never read again on that device");
  }
  // FD3 server time decides, not the device clock: a device clock 20 min behind still sees a 1-minute-old close as fresh,
  // and a missing close time keeps Home.
  {
    const p=page({serverOffsetMs:20*60_000});p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"]);
    const q=page({closedAgoMs:null});q.pair(closedPair);await settle();
    assert.deepEqual(q.calls.nav,[]);assert.equal(q.calls.refresh,1);
    ok("FD3","judged by the server clock; no close time means Home");
  }
  // FD4 a phone that showed this Showdown's Champion (it played to the end here) never reads.
  {
    const p=page({storage:{[SHOWN]:R}});p.pair(closedPair);await settle();
    assert.equal(p.calls.refresh,0);assert.deepEqual(p.calls.nav,[]);
    ok("FD4","a device that showed the Champion never takes this path (normal paths read nothing new)");
  }
  // FD5 a phone due to crown it (the F1 note) keeps F1's path: one read and one Champion screen in all.
  {
    const p=page({storage:{[DUE]:R}});p.pair(closedPair);await settle();
    assert.ok(p.calls.refresh<=1);assert.ok(p.calls.nav.filter(n=>n==="seasonEntry").length<=1);
    assert.equal(p.entry.championAfterClose(closedPair),true);await settle();
    assert.equal(p.calls.refresh,1);assert.deepEqual(p.calls.nav,["seasonEntry"]);
    ok("FD5","the due-note path is unchanged and never doubled by the fresh-device path");
  }
  // FD6 the page left Home first (the manager went elsewhere): nothing taken over, no read.
  {
    const p=page();p.show("standings");p.pair(closedPair);await settle();
    assert.equal(p.calls.refresh,0);assert.deepEqual(p.calls.nav,[]);
    ok("FD6","only a page still on Home");
  }
  // FD7 ended early (DELETED), another save active, a failed read: Home stays (and a failed read is tried once per page).
  {
    const d=page({tc:"DELETED"});d.pair(closedPair);await settle();
    assert.deepEqual(d.calls.nav,[]);assert.equal(d.storage.get(SHOWN),R);
    const s=page({activeSaveId:"save_"+"2".repeat(24)});s.pair(closedPair);await settle();
    assert.deepEqual(s.calls.nav,[]);assert.equal(s.calls.refresh,0);assert.equal(s.storage.get(SHOWN),R);
    const f=page({tc:"FAIL"});f.pair(closedPair);await settle();f.pair({...closedPair});await settle();
    assert.deepEqual(f.calls.nav,[]);assert.equal(f.calls.refresh,1);assert.equal(f.storage.has(SHOWN),false,"a failed read is not settled");
    ok("FD7","ended early, another save or a failed read: Home, nothing made up");
  }
  // FD8 a live pair, or another Showdown's close, is never followed here.
  {
    const p=page();p.pair({status:"paired",rivalryId:OTHER,connectionState:"active",closedRivalryId:null});await settle();
    assert.equal(p.calls.refresh,0);
    const q=page({storage:{[SHOWN]:R}});q.pair({...closedPair,closedRivalryId:OTHER});await settle();
    assert.equal(q.calls.refresh,1,"a newer closed Showdown is its own question");
    ok("FD8","only a closed Showdown this device has not settled");
  }
  // FD9 the phone that played to the end notes the Champion as shown when it is on screen.
  {
    const p=page();p.storage.set(SHOWN,OTHER);
    p.show("seasonEntry");p.tcEvent({phase:"CLOSED",terminal:true,rivalryId:R});p.show("seasonEntry");
    assert.equal(p.storage.get(SHOWN),R);
    ok("FD9","the Champion screen on the playing phone marks it shown");
  }
  // FD10 no write to Firebase, and the Terminal Close read result carries the close time from the same read.
  {
    assert.doesNotMatch(ENTRY,/\b(?:setDoc|updateDoc|addDoc|runTransaction|writeBatch)\b/);
    const spark=read("js/sparkTerminalClose.js");
    assert.match(spark,/closedAtMs:stcMillis\(rivalry\.updatedAt\)/);
    assert.match(read("js/productionSharedTerminalClose.js"),/closedAtMs:Number\.isFinite\(terminalRead\.closedAtMs\)/);
    assert.match(ENTRY,/const FRESH_CHAMPION_MS=10\*60\*1000;/);
    ok("FD10","no write to Firebase; the close time comes from the same Terminal Close read");
  }
  // FD11 Connected Rivalry: a closed rivalry is accepted only when the caller asks (attachRivalry allowClosed), with the same
  // exact slot check; never a deleted, ended or other-account rivalry. Run for real on the function body.
  {
    const cr=read("js/sparkConnectedRivalry.js");
    const start=cr.indexOf("  function crAssertActiveRivalryValue(");const end=cr.indexOf("\n  function crRemoteManagerBindings(");
    assert.ok(start>0&&end>start);
    const sandbox={};vm.createContext(sandbox);
    vm.runInContext(`function crIsEnvelopeValue(v,kind,id){return Boolean(v&&v.kind===kind&&v.id===id);}function crError(code,message){return Object.assign(new Error(message||code),{code});}\n${cr.slice(start,end)}\nglobalThis.check=crAssertActiveRivalryValue;`,sandbox);
    const ACC="acc_1",binding={managerRole:"playerOne",profileId:"profile_"+"a".repeat(24),saveId:SAVE};
    const value=(connectionState,extra={})=>({kind:"rivalry",id:R,lifecycleState:"live",...extra,data:{connectionState,authorizedAccountIds:[ACC,"acc_2"],managerSlots:[{slotId:"playerOne",accountId:ACC,profileId:binding.profileId,saveId:SAVE,entitlementState:"active"},{slotId:"playerTwo",accountId:"acc_2",profileId:"profile_"+"b".repeat(24),saveId:"save_"+"2".repeat(24),entitlementState:"active"}]}});
    const code=fn=>{try{fn();return "ok";}catch(error){return error.code;}};
    assert.equal(code(()=>sandbox.check(value("active"),R,ACC,binding)),"ok");
    assert.equal(code(()=>sandbox.check(value("closed"),R,ACC,binding)),"CONNECTED_RIVALRY_NOT_ACTIVE","closed refused by default");
    assert.equal(code(()=>sandbox.check(value("closed"),R,ACC,binding,{allowClosed:true})),"ok","closed accepted only when asked");
    assert.equal(code(()=>sandbox.check(value("closed",{lifecycleState:"deleted"}),R,ACC,binding,{allowClosed:true})),"CONNECTED_RIVALRY_NOT_FOUND");
    assert.equal(code(()=>sandbox.check(value("pending-pair"),R,ACC,binding,{allowClosed:true})),"CONNECTED_RIVALRY_NOT_ACTIVE");
    assert.equal(code(()=>sandbox.check(value("closed"),R,"acc_3",binding,{allowClosed:true})),"CONNECTED_RIVALRY_NOT_ACTIVE","another account");
    assert.equal(code(()=>sandbox.check(value("closed"),R,ACC,{...binding,saveId:"save_"+"9".repeat(24)},{allowClosed:true})),"CONNECTED_RIVALRY_BINDING_MISMATCH","another save");
    assert.match(cr,/crAssertActiveRivalryValue\(rivalrySnapshot\.exists\(\)\?rivalrySnapshot\.data\(\):null,rivalryId,accountId,binding,\{allowClosed:options\.allowClosed===true\}\);/);
    assert.equal((cr.match(/allowClosed/g)||[]).length,5,"allowClosed lives only in the attach path");
    ok("FD11","Connected Rivalry attaches a closed rivalry only when asked, with the same exact slot check");
  }
  // FD12 the rebuild: only on the fresh-device path, only with no active save, the closed pair's own exact ids, then the attach.
  {
    const pair=read("js/persistentNikDanielPair.js");
    const fn=pair.slice(pair.indexOf("async function pairAdoptClosedShowdownShell"),pair.indexOf("\n",pair.indexOf("async function pairAdoptClosedShowdownShell")));
    assert.match(fn,/if\(state\.rivalryId\|\|state\.busy\|\|/,"never while a Showdown is live");
    assert.match(fn,/if\(!pairHasExactShowdownShell\(role,saveId,profileId\)\)\{if\(runtime\.getLibrarySnapshot\?\.\(\)\?\.activeSaveId\|\|/,"rebuilt only on a device with no active save; an exact shell is reused");
    assert.match(fn,/runtime\.adoptOnlineEntry\(\{saveId,profileId,role,totalRounds\}\)/);
    assert.match(fn,/pairAttachRecoveryPointer\(context,binding,rivalryId,\{allowClosed:true\}\)\)\.ok===true;\}$/);
    assert.doesNotMatch(fn,/setDoc|updateDoc|transaction\.set|transaction\.update|deleteDoc/,"nothing written to Firebase");
    assert.match(pair,/pairLastClosedProviderProfileId=pairValidProfileId\(slot\.profileId\)\?slot\.profileId:null;pairLastClosedManagerRole=link\.managerRole;/,"the closed slot's own ids, from the pair read already made");
    assert.match(ENTRY,/if\(recentOnly\)await adoptClosedShell\(rivalryId,pair\);/,"only on the fresh-device path (a close at most 10 minutes old)");
    const adopt=ENTRY.slice(ENTRY.indexOf("async function adoptClosedShell"),ENTRY.indexOf("async function championForClosedRivalry"));
    assert.match(adopt,/pair\?\.closedRivalryId!==rivalryId\)return false;/);assert.match(adopt,/if\(before\?\.activeSaveId\)return false;/);
    ok("FD12","the closed Showdown's shell is rebuilt only on a device with no save, from the closed slot's ids, then pointed at");
  }
  console.log(`PASS r100 fresh-device Champion contracts (${passed})`);
})().catch(error=>{console.error(error);process.exit(1);});
