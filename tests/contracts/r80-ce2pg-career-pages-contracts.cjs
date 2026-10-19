#!/usr/bin/env node
"use strict";
// r80 CE2PG (real career play shows on every career page): the three mismatches the two-player journey
// (tests/browser/ce2pg-journey.cjs, npm run test:ce2pg) found, each pinned here with plain node:assert and no Firebase.
// C1  The shared career cache key names the closed Showdown: a career read after Showdown A finished is not served after
//     Showdown B finished (both leave the pair with no live rivalry id; only closedRivalryId tells them apart).
// C2  Standings refreshes the shared career model once per open: opened first it no longer says "unavailable", and it never
//     shows an older career; the Career view says Loading until the read lands; one read per open, none on other screens.
// C3  Settings follows the pair state Home's LIVE tile reads: END SHOWDOWN and CURRENT SHOWDOWN only while a Showdown is
//     live (active or waiting), never for the local save a finished or ended Showdown leaves behind; with no pair state
//     yet the local save decides, as before.
// C5  Standings THIS SHOWDOWN: once the pair has let a finished Showdown go, it shows no active Showdown on the phone that
//     played it too (the Terminal Close kept for the Final Winner screen no longer stands in for a live Showdown).
// C4  Settings HISTORY online counts the completed Showdowns of the shared career model (one refresh per open, Loading
//     until it lands, updated in place); off the online route the local list still counts.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {FakeNode}=require("../support/fake-dom.cjs");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const settle=async()=>{for(let i=0;i<30;i++)await new Promise(resolve=>setImmediate(resolve));};
const career=titles=>{const value=JSON.parse(read("tests/fixtures/data-contract-v1/multi-showdown-career.json")).career;value.managers.daniel.leagueTitles=titles;return value;};
let checks=0,failures=0;
async function check(name,run){try{await run();console.log(`ok ${++checks} ${name}`);}catch(error){failures+=1;console.error(`FAIL ${name}: ${error.stack}`);}}

// ---------- C1: js/rivalryLegacyV10.js with the real cache and stubbed provider modules ----------
function legacyHarness(){
  let pair={initialized:true,rivalryId:null,closedRivalryId:"rivalry_a"},next=career(1),loads=0;
  const listeners=new Map();
  const ctx={console,document:{getElementById:()=>null},
    CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:"daniel"})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"uid-daniel"})},
    CareerModePersistentNikDanielPair:{getState:()=>pair},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid-daniel"}},firestore:{},firestoreSdk:{doc(){},getDoc(){}}})},
    // r80 real vs test: a real account (its career-start marker, nothing hidden); career pages show nothing while it is unknown.
    CareerModeCareerStartMarker:{readMarker:async()=>({status:"ready",hiddenRivalryIds:[]}),hiddenRivalryIds:m=>m.hiddenRivalryIds.slice(),epoch:()=>0},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:null})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:async()=>{loads+=1;return {model:next};}},
    CustomEvent:class{constructor(type){this.type=type;}},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);return true;}};
  for(const name of ["CareerModeSharedHistoryConvergence","CareerModeSharedFinalReconciliation","CareerModeSharedTerminalClose","CareerModeSharedCareerAnalytics","CareerModeSharedClosedShowdownAdapter","CareerModeSparkCompletedShowdownReader","CareerModeCareerScreenSeam"])ctx[name]={};
  ctx.window=ctx;vm.createContext(ctx);
  ctx.loadRuntimeScript=async(key,file,ready)=>{if(!ready())vm.runInContext(read(file),ctx);assert.ok(ready(),file);};
  vm.runInContext(read("js/rivalryLegacyV10.js"),ctx);
  return {ctx,legacy:()=>ctx.CareerModeRivalryLegacyV10,setPair(value){pair=value;},setNext(value){next=value;},loads:()=>loads};
}

// ---------- C2: js/seasonFinalV10.js installed against a stubbed Team V loader ----------
function standingsHarness({cached=null,online=true,pair=null,terminalClose=null}={}){
  const registrations=new Map(),docListeners=new Map(),winListeners=new Map(),drawn=new Map();
  let active="mainMenu",model=cached,pending=null,loads=0;
  const legacy={cachedCareerModel:()=>model,loadCareerModel(){loads+=1;return new Promise(resolve=>{pending=value=>{model=value;resolve(value);ctx.dispatchEvent({type:"career-mode-online-career-model-change"});};});}};
  const loader={register(id,def){registrations.set(id,def);},async show(id){if(id!==active)return false;drawn.set(id,registrations.get(id).frame());return true;},invalidate(id){drawn.delete(id);}};
  const ctx={console,
    document:{addEventListener(type,fn){if(!docListeners.has(type))docListeners.set(type,[]);docListeners.get(type).push(fn);},getElementById:()=>null,querySelector:()=>null},
    setTimeout:(fn)=>setImmediate(fn),
    getActiveScreenName:()=>active,
    CareerModeOnlinePlayerIdentity:{getState:()=>online?{registered:true,managerId:"nik"}:{registered:false,managerId:null}},
    CareerModeRivalryLegacyV10:legacy,
    CareerModePersistentNikDanielPair:{getState:()=>pair},
    CareerModeProductionSharedTerminalClose:{getState:()=>terminalClose},
    // Stub of the active adapter: a CLOSED Terminal Close in the snapshot means the finished Showdown is shown.
    CareerModeSharedActiveShowdownAdapter:{rivalryView:snapshot=>snapshot.terminalClose?.phase==="CLOSED"?{status:"ready",score:{daniel:50,nik:45},managers:null}:{status:"empty"}},
    CareerModeV10Screens:{install:()=>loader,setNavRoute(){},invalidate:id=>loader.invalidate(id),show:id=>loader.show(id)},
    addEventListener(type,fn){if(!winListeners.has(type))winListeners.set(type,[]);winListeners.get(type).push(fn);},
    dispatchEvent(event){for(const fn of winListeners.get(event.type)||[])fn(event);return true;},
    CustomEvent:class{constructor(type){this.type=type;}}};
  ctx.window=ctx;vm.createContext(ctx);
  ctx.loadRuntimeScript=async(key,file,ready)=>{assert.ok(ready(),`${file} is stubbed in this harness`);};
  vm.runInContext(read("js/seasonFinalV10.js"),ctx);
  ctx.CareerModeSeasonFinalV10.install();
  return {
    async open(screen){active=screen;for(const fn of docListeners.get("career-mode-screen-shown")||[])fn({detail:{screen}});await settle();},
    careerView:()=>drawn.get("standings")?.CAREER?.model,
    showdownView:()=>drawn.get("standings")?.SHOWDOWN?.model,
    finish(value){assert.ok(pending,"a career read is in flight");const done=pending;pending=null;done(value);},
    loads:()=>loads
  };
}

// ---------- C3/C4: js/settings.js createDataPanel with the pair, identity and career model stubbed ----------
class SettingsNode extends FakeNode{
  querySelector(selector){const name=selector.replace(/^\./,"");return this.all().find(node=>node.className.split(/\s+/).includes(name))||null;}
}
function settingsHarness({pair=null,local={name:"Daniel vs Nik",status:"Created",identity:{saveId:"save_a"}},online=true,cached=null,legacyHistory=[]}={}){
  let model=cached,pending=null,loads=0;
  const ctx={console,
    document:{documentElement:{dataset:{}},addEventListener(){},createElement:tag=>new SettingsNode(tag),createDocumentFragment:()=>new SettingsNode("#fragment",true),querySelector:()=>null,getElementById:()=>null},
    addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),
    currentShowdown:local,
    loadLegacyShowdowns:()=>legacyHistory,
    CareerModePersistentNikDanielPair:pair?{getState:()=>pair}:undefined,
    CareerModeOnlinePlayerIdentity:{getState:()=>online?{registered:true,managerId:"daniel"}:{registered:false,managerId:null}},
    CareerModeRivalryLegacyV10:{cachedCareerModel:()=>model,loadCareerModel(){loads+=1;return new Promise(resolve=>{pending=value=>{model=value;resolve(value);};});}},
    loadRuntimeScript:async()=>{}};
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(read("js/settings.js"),ctx,{filename:"js/settings.js"});
  const content=new SettingsNode("div");
  vm.runInContext("settingsContent = __content;",Object.assign(ctx,{__content:content}));
  const panel=()=>{const node=vm.runInContext("createDataPanel()",ctx);content.replaceChildren(node);return node;};
  const rows=node=>Object.fromEntries(node.findByClass("settingsInfoRow").map(row=>[row.children[0].textContent,row.children[1].textContent]));
  const buttons=node=>node.all().filter(n=>n.tagName==="BUTTON").map(n=>n.textContent);
  return {ctx,panel,rows,buttons,
    refresh:()=>vm.runInContext("refreshSettingsOnlineHistory()",ctx),
    finish(value){assert.ok(pending,"a career read is in flight");const done=pending;pending=null;done(value);},
    loads:()=>loads};
}
const PAIR={
  active:{initialized:true,rivalryId:"rivalry_b",connectionState:"active",status:"paired",closedRivalryId:null},
  waiting:{initialized:true,rivalryId:"rivalry_b",connectionState:"pending-pair",status:"waiting",closedRivalryId:null},
  finished:{initialized:true,rivalryId:null,connectionState:null,status:"unpaired",closedRivalryId:"rivalry_a"},
  notReady:{initialized:false,rivalryId:null,connectionState:null,status:"idle",closedRivalryId:null}
};

(async()=>{
  await check("C1 a career read after Showdown A finished is not served after Showdown B finished",async()=>{
    const h=legacyHarness(),first=career(1);h.setNext(first);
    await h.legacy().loadCareerModel();
    assert.equal(h.legacy().cachedCareerModel(),first,"A's career is cached after A");
    h.setPair({initialized:true,rivalryId:"rivalry_b",connectionState:"active",closedRivalryId:null});
    assert.equal(h.legacy().cachedCareerModel(),null,"not served while B is live");
    h.setPair({initialized:true,rivalryId:null,connectionState:null,closedRivalryId:"rivalry_b"});
    assert.equal(h.legacy().cachedCareerModel(),null,"A's career must not be served once B has finished");
    const second=career(2);h.setNext(second);await h.legacy().loadCareerModel();
    assert.equal(h.legacy().cachedCareerModel(),second);
    assert.equal(h.loads(),2);
  });
  await check("C2 Standings opened first loads the career (Loading, then the figures), never \"unavailable\"",async()=>{
    const h=standingsHarness();
    await h.open("standings");
    assert.equal(h.loads(),1,"one career read when Standings opens");
    assert.equal(h.careerView()?.status,"loading","the Career view says Loading while the read is in flight");
    h.finish(career(3));await settle();
    assert.equal(h.careerView()?.status,"ready");
    assert.equal(h.careerView().standings.daniel.leagueTitles,3);
    assert.equal(h.loads(),1,"the model-change event does not read again");
  });
  await check("C2 Standings never shows an older cached career: each open refreshes once",async()=>{
    const h=standingsHarness({cached:career(1)});
    await h.open("standings");
    assert.equal(h.loads(),1);
    assert.equal(h.careerView()?.status,"loading","the older cached career is not shown while the fresh read is in flight");
    h.finish(career(4));await settle();
    assert.equal(h.careerView().standings.daniel.leagueTitles,4);
    await h.open("standings");await h.open("standings");
    assert.equal(h.loads(),2,"a second open (and a repeat shown event while it is in flight) reads once");
    h.finish(career(5));await settle();
    assert.equal(h.careerView().standings.daniel.leagueTitles,5);
  });
  await check("C2 no career read for other screens or off the online route",async()=>{
    const h=standingsHarness();
    for(const screen of ["mainMenu","dashboard","seasonEntry","settings"])await h.open(screen);
    assert.equal(h.loads(),0);
    const offline=standingsHarness({online:false});await offline.open("standings");
    assert.equal(offline.loads(),0);
  });
  await check("C5 Standings THIS SHOWDOWN: a finished Showdown the pair has let go is not this Showdown (as after a reload)",async()=>{
    const closed={phase:"CLOSED",rivalryId:"rivalry_a",terminal:true};
    const released=standingsHarness({pair:{initialized:true,status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:"rivalry_a"},terminalClose:closed});
    await released.open("standings");
    assert.equal(released.showdownView()?.status,"empty","THIS SHOWDOWN says no active Showdown once Home has let the finished one go");
    const held=standingsHarness({pair:{initialized:true,status:"paired",rivalryId:"rivalry_a",connectionState:"active"},terminalClose:closed});
    await held.open("standings");
    assert.notEqual(held.showdownView()?.status,"empty","while the pair still holds it (Final Winner, before Home) the finished Showdown still shows");
    const loading=standingsHarness({pair:{initialized:false,status:"idle",rivalryId:null},terminalClose:closed});
    await loading.open("standings");
    assert.notEqual(loading.showdownView()?.status,"empty","a pair that has not loaded yet changes nothing");
  });
  await check("C3 after a finished (or ended) Showdown Settings shows no END SHOWDOWN and CURRENT SHOWDOWN None",async()=>{
    const h=settingsHarness({pair:PAIR.finished,cached:career(1)});const node=h.panel();
    assert.equal(h.buttons(node).includes("END SHOWDOWN"),false,"the stale local save is not a live Showdown");
    assert.equal(h.rows(node)["CURRENT SHOWDOWN"],"None");
  });
  await check("C3 while a Showdown is live (or waiting) Settings offers END SHOWDOWN and names it",async()=>{
    for(const [pair,label] of [[PAIR.active,"Live"],[PAIR.waiting,"Waiting to join"]]){
      const h=settingsHarness({pair,cached:career(1)});const node=h.panel();
      assert.equal(h.buttons(node).includes("END SHOWDOWN"),true);
      assert.equal(h.rows(node)["CURRENT SHOWDOWN"],`Daniel vs Nik · ${label}`);
    }
    const none=settingsHarness({pair:PAIR.active,local:null});
    assert.equal(none.buttons(none.panel()).includes("END SHOWDOWN"),false,"END still needs the local save it ends");
  });
  await check("C3 with no pair state yet the local save decides, as before",async()=>{
    for(const pair of [null,PAIR.notReady]){
      const h=settingsHarness({pair});const node=h.panel();
      assert.equal(h.buttons(node).includes("END SHOWDOWN"),true);
      assert.equal(h.rows(node)["CURRENT SHOWDOWN"],"Daniel vs Nik · Created");
    }
  });
  await check("C3 a transient unavailable pair state is unknown: the local save decides, END SHOWDOWN stays (Codex #935)",async()=>{
    const h=settingsHarness({pair:{initialized:true,rivalryId:null,connectionState:null,status:"unavailable",closedRivalryId:null}});const node=h.panel();
    assert.equal(h.buttons(node).includes("END SHOWDOWN"),true);
    assert.equal(h.rows(node)["CURRENT SHOWDOWN"],"Daniel vs Nik · Created");
  });
  await check("C3 END never ends locally on an outage: only a pair read (paired/unpaired) may skip the online close (Codex #937)",async()=>{
    for(const status of ["unavailable","error","signed-out","idle"]){
      const h=settingsHarness();
      h.ctx.ensureSettingsPersistentPairAuthority=async()=>({getState:()=>({initialized:true,status,rivalryId:null,connectionState:null})});
      vm.runInContext("ensureSettingsPersistentPairAuthority=window.ensureSettingsPersistentPairAuthority;",h.ctx);
      await assert.rejects(()=>h.ctx.releaseSettingsCurrentShowdownConnection({id:"s1",identity:{saveId:"save_a"}}),/could not be checked/,status);
    }
    const h=settingsHarness();
    h.ctx.ensureSettingsPersistentPairAuthority=async()=>({getState:()=>({initialized:true,status:"unpaired",rivalryId:null,connectionState:null})});
    vm.runInContext("ensureSettingsPersistentPairAuthority=window.ensureSettingsPersistentPairAuthority;",h.ctx);
    assert.equal((await h.ctx.releaseSettingsCurrentShowdownConnection({id:"s1",identity:{saveId:"save_a"}})).status,"unpaired");
  });
  await check("C4 a partial career's HISTORY count is a floor, never the total (Codex #935)",async()=>{
    const partial={...career(1),status:"partial",coverage:{readable:2,indexed:3}};
    const h=settingsHarness({pair:PAIR.finished,cached:partial});
    assert.equal(h.rows(h.panel()).HISTORY,"At least 2 completed showdowns");
  });
  await check("C4 Settings HISTORY online counts the shared career's completed Showdowns",async()=>{
    const h=settingsHarness({pair:PAIR.finished,cached:career(1)});
    assert.equal(h.rows(h.panel()).HISTORY,"2 completed showdowns","the fixture career has 2 completed and 1 ended-early Showdown");
  });
  await check("C4 Settings HISTORY reads once per open: Loading, then the count in place",async()=>{
    const h=settingsHarness({pair:PAIR.finished});
    h.refresh();h.refresh();
    const node=h.panel();
    assert.equal(h.rows(node).HISTORY,"Loading…");
    await settle();
    assert.equal(h.loads(),1,"a second refresh while one is in flight joins it");
    const one=career(1);one.history.showdowns=one.history.showdowns.filter(row=>row.status!=="completed").concat([{...one.history.showdowns[0]}]);
    h.finish(one);await settle();
    assert.equal(h.rows(node).HISTORY,"1 completed showdown");
  });
  await check("C4 off the online route the local list still counts",async()=>{
    const h=settingsHarness({online:false,legacyHistory:[{},{},{}]});
    assert.equal(h.rows(h.panel()).HISTORY,"3 completed showdowns");
  });
  await check("C2/C4 sources: Standings and Settings name the CE2PG refresh; the END flow itself is unchanged",async()=>{
    const settings=read("js/settings.js"),season=read("js/seasonFinalV10.js");
    assert.match(settings,/if\(isSettingsOnlineCareer\(\)\)\{ refreshSettingsOnlineHistory\(\); \}\n    renderSettings\(\);/);
    assert.match(season,/if\(root\.getActiveScreenName\?\.\(\)==="standings"\)refreshStandingsCareer\(\);/);
    assert.doesNotMatch(season,/Standings itself adds no provider read/);
  });
  if(failures){console.error(`FAIL r80 CE2PG career pages contracts: ${failures} failed`);process.exit(1);}
  console.log(`PASS r80 CE2PG career pages contracts: ${checks} checks (career cache keyed by the closed Showdown; Standings refreshes once per open; Settings END/CURRENT follow the live pair; HISTORY counts the shared career; THIS SHOWDOWN drops a released finished Showdown).`);
})().catch(error=>{console.error(error);process.exit(1);});
