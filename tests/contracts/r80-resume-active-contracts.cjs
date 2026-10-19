"use strict";
// r80 resume (G7, Home items 5 and 6). Failing first on claude-gameplay/r80-real-vs-test dc08a9c (emulator proof,
// tests/browser/r80-resume-active-audit.cjs): a page that already held the ACTIVE private session answered Home START /
// CONTINUE CAREER with GET READY, whose START CAREER reopened Career Start for a game still in season 1; Career Start's
// automatic move to the Transfer Challenge fires once per page, so the player stayed on Career Start until a reload.
//   RA1 continuing with an ACTIVE session (resumeActive) enters the game as a reload does once Remote Joining is ACTIVE again
//       (openSharedExperience): the league wheel / setup presentation, never a frame of GET READY.
//   RA2 the same with a confirmed Setup and no accepted season: Career Start's own open (which goes on by itself), no GET READY.
//   RA3 other callers keep their routes: openPanel() with an ACTIVE session still shows GET READY; a connected pair without an
//       ACTIVE session still goes to Remote Joining; a failed entry still falls back to GET READY.
//   RA4 the pair's continue (Home START, CONTINUE CAREER, the reload's tab resume) asks for resumeActive.
//   RA5 Career Start opened again on a page where it is already READY (its automatic continue already used): straight to the
//       Transfer Challenge, no panel frame, no provider read; the first open still shows the panel and continues by itself.
//   RA6 Home item 5: Daniel's open code shows WAITING FOR NIK only once the mode is known real (loading until this page has
//       asked the mode; a test code shows START), and the tile follows the mode when it is learnt later.
//   RA7 Home item 6: the season chip on Home shows only for a current Showdown (live, or Daniel's open real code).
//   RA8 Home item 3: while a continue runs the START tile keeps the live wording (never START A SHOWDOWN or JOIN).
//   RA9 Home item 2: the CONTINUE CAREER line never describes a saved Showdown that is not current (a leftover test code).
// Run: node tests/contracts/r80-resume-active-contracts.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_3"+"7".repeat(63),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32);
let passed=0;
async function check(name,f){await f();passed+=1;console.log(`ok ${passed} ${name}`);}
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,5));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}

// A small DOM: ids are registered when a node joins the document; querySelector finds a descendant by class or id.
function createDom(){
  const byId=new Map();
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this._id="";this.className="";this.textContent="";this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.type="";this.style={};
      const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c)};}
    get id(){return this._id;}set id(v){this._id=String(v);if(this.connected())byId.set(this._id,this);}
    connected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    register(){if(this._id)byId.set(this._id,this);for(const c of this.children)c.register();}
    append(...nodes){for(const n of nodes){if(typeof n==="string")continue;n.parent=this;this.children.push(n);if(this.connected())n.register();}}
    replaceChildren(...nodes){this.children=[];this.append(...nodes);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;if(byId.get(this._id)===this)byId.delete(this._id);}
    insertBefore(n){this.append(n);return n;}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attributes,k)?this.attributes[k]:null;}
    removeAttribute(k){delete this.attributes[k];}hasAttribute(k){return Object.hasOwn(this.attributes,k);}
    querySelector(selector){const m=/^([.#])([\w-]+)$/.exec(selector);if(!m)return null;const hit=n=>m[1]==="."?n.classList.contains(m[2]):n._id===m[2];const walk=n=>{for(const c of n.children){if(hit(c))return c;const deep=walk(c);if(deep)return deep;}return null;};return walk(this);}
    get innerText(){return [this.textContent,...this.children.map(c=>c.innerText)].filter(Boolean).join(" ");}
  }
  const body=new El("body");
  const document={visibilityState:"visible",body,documentElement:body,createElement:tag=>new El(tag),getElementById:id=>byId.get(id)||null,querySelector:selector=>body.querySelector(selector),addEventListener(){}};
  return {document,shown:id=>{const n=byId.get(id);return Boolean(n&&n.connected()&&!n.classList.contains("hidden"));}};
}

// js/productionSharedJourneyEntry.js with the services it asks (as tests/contracts/fewer-taps-contracts.cjs entryHarness).
function entryHarness({active=true,rivalryReady=true,setupPhase="SHARED_SETUP_OPEN",acceptedSeasons=0,presentationFails=false}={}){
  const dom=createDom();
  const calls={presentation:0,careerStart:0,resumeFromAuthority:0,remoteOpen:0,navigate:[],errors:[]};
  const remoteState={sessionState:active?"active":null,sessionId:active?SESSION:null,pendingAction:null,rivalryId:RIVALRY,accountId:"uid_daniel",deviceId:DEVICE,expiresAtEpochMs:Date.now()+3_600_000};
  const setupState={ready:true,setup:{phase:setupPhase,revision:setupPhase==="SHOWDOWN_CONFIRMED"?6:1}};
  const sandbox={console,setTimeout,clearTimeout,Promise,Date,document:dom.document,MutationObserver:class{observe(){}disconnect(){}},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    loadRuntimeStyle:async()=>true,loadRuntimeScript:async key=>{throw new Error(`unexpected load ${key}`);},
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    navigateTo:async name=>{calls.navigate.push(name);return true;},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:null,saves:[]}),saveCurrentShowdown:()=>true,clearActiveShowdown(){}},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"daniel",registered:true}),subscribe:()=>()=>{}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true})},
    CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:"uid_daniel"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:rivalryReady,rivalryId:rivalryReady?RIVALRY:null})},
    CareerModeSparkRemoteJoining:{getState:()=>remoteState,openPanel:async()=>{calls.remoteOpen+=1;return true;},closePanel(){},subscribe:()=>()=>{}},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setupState,getState:()=>setupState},
    CareerModeProductionSharedMultiSeasonProgression:{install(){},resumeFromAuthority:async()=>{calls.resumeFromAuthority+=1;return {acceptedSeasons};},decorateDashboard(){}},
    CareerModeProductionSharedCareerStart:{openPanel:async()=>{calls.careerStart+=1;return true;}},
    CareerModeProductionSharedShowdownPresentation:{activate:async()=>{calls.presentation+=1;if(presentationFails)throw new Error("setup not ready");return true;},isPresentationActive:()=>false},
    reportApplicationError:(context)=>{calls.errors.push(context);}};
  sandbox.globalThis=sandbox;sandbox.currentShowdown=null;
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedJourneyEntry.js"),sandbox,{filename:"productionSharedJourneyEntry.js"});
  const api=sandbox.CareerModeProductionSharedJourneyEntry;
  assert.ok(api&&typeof api.openPanel==="function","the entry loads in the harness");
  return {api,calls,getReady:()=>dom.shown("productionSharedJourneyEntryOverlay"),entryText:()=>dom.document.getElementById("productionSharedJourneyEntryOverlay")?.innerText||""};
}

// js/productionSharedCareerStart.js with a fake provider and Transfer Challenge (as career-start-ready-reuse-contracts.cjs).
function careerStartHarness(){
  const dom=createDom();
  const calls={read:0,transferOpen:0,panelShownAtTransfer:[]};
  const SETUP={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],contentHash:"sha256:"+"a".repeat(64)};
  const READY={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]};
  const setupState={ready:true,setup:SETUP,managerRole:"playerTwo",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE};
  const panel=()=>dom.shown("productionSharedCareerStartOverlay");
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date,JSON,document:dom.document,reportApplicationError(){}};
  sandbox.globalThis=sandbox;
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>setupState,getState:()=>setupState};
  for(const name of ["CareerModeSharedShowdownSetup","CareerModeSharedShowdownCatalog","CareerModeSparkSharedShowdownSetup","CareerModeSharedCareerStart"])sandbox[name]={};
  sandbox.CareerModeSparkSharedCareerStart={read:async()=>{calls.read+=1;return {ok:true,revision:READY.revision,state:READY,managerRole:"playerTwo"};},acknowledge:async()=>{throw new Error("no acknowledge expected");}};
  sandbox.CareerModeProductionSharedTransferChallenge={install(){},open:async()=>{calls.transferOpen+=1;calls.panelShownAtTransfer.push(panel());return true;}};
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"nik"}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedCareerStart.js"),sandbox,{filename:"productionSharedCareerStart.js"});
  const api=sandbox.CareerModeProductionSharedCareerStart;
  assert.ok(api&&typeof api.openPanel==="function","Career Start loads in the harness");
  // Every state the panel takes from now on (shown or not), to prove no frame of it on the way to the Transfer Challenge.
  const seen=[];const track=()=>{const overlay=dom.document.getElementById("productionSharedCareerStartOverlay");if(overlay&&!overlay.__tracked){overlay.__tracked=true;const remove=overlay.classList.remove;overlay.classList.remove=(...c)=>{remove(...c);seen.push(panel());};}};
  return {api,calls,panel,seen,track};
}

async function main(){
  await check("RA1 Home continue with an ACTIVE session enters the game (setup presentation) with no GET READY",async()=>{
    const h=entryHarness({active:true});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.equal(h.calls.presentation,1,"the game is entered as after a reload (openSharedExperience -> presentation)");
    assert.equal(h.getReady(),false,`no GET READY: ${h.entryText()}`);
    assert.equal(h.calls.remoteOpen,0,"no Remote Joining for a session already ACTIVE");
  });
  await check("RA2 a confirmed Setup in season 1 opens Career Start's own entry (it goes on by itself); season 2+ the dashboard",async()=>{
    const h=entryHarness({active:true,setupPhase:"SHOWDOWN_CONFIRMED"});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.equal(h.calls.careerStart,1,"Career Start's open (RA5: straight on when it is READY here)");
    assert.equal(h.getReady(),false,"no GET READY");
    const later=entryHarness({active:true,setupPhase:"SHOWDOWN_CONFIRMED",acceptedSeasons:1});
    await later.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([later.calls.careerStart,later.calls.navigate],[0,["dashboard"]],"an accepted season resumes on the season dashboard, as a reload");
    assert.equal(later.getReady(),false,"no GET READY");
  });
  await check("RA3 other callers keep GET READY / Remote Joining; a failed entry falls back to GET READY",async()=>{
    const plain=entryHarness({active:true});
    await plain.api.openPanel();await settle();
    assert.equal(plain.getReady(),true,"openPanel() without resumeActive still renders GET READY");
    assert.match(plain.entryText(),/GET READY/);assert.equal(plain.calls.presentation,0);
    const notActive=entryHarness({active:false});
    await notActive.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([notActive.calls.remoteOpen,notActive.calls.presentation,notActive.getReady()],[1,0,false],"no ACTIVE session: Remote Joining as before (its ACTIVE return enters the game)");
    const failing=entryHarness({active:true,presentationFails:true});
    await failing.api.openPanel({resumeActive:true});await settle();
    assert.equal(failing.calls.presentation,1);
    assert.equal(failing.getReady(),true,"an entry that fails shows GET READY (with the reason reported), never a blank Home");
    assert.ok(failing.calls.errors.includes("Unable to enter the Showdown"));
  });
  await check("RA4 the pair's continue asks the entry to resume an ACTIVE session",async()=>{
    const src=read("js/persistentNikDanielPair.js");
    const body=src.slice(src.indexOf("async function pairContinueOnlineShowdown("),src.indexOf("\n",src.indexOf("async function pairContinueOnlineShowdown(")));
    assert.match(body,/await entry\.openPanel\(\{resumeActive:true\}\);return pairSetState\(\{status:"paired"/,"continuePair -> openPanel({resumeActive:true})");
    assert.doesNotMatch(body,/await entry\.openPanel\(\);/,"no bare openPanel() (GET READY) from the continue");
  });
  await check("RA5 Career Start already READY on this page: a later open goes straight to the Transfer Challenge, no panel frame, no read",async()=>{
    const h=careerStartHarness();
    // First entry on the page (the game as both managers started it, or a reload): the panel shows, reads READY and goes on.
    const first=h.api.openPanel();h.track();await first;await settle();
    assert.equal(h.calls.read,1,"the first open reads Career Start once");
    assert.equal(h.calls.transferOpen,1,"and continues to the Transfer Challenge by itself");
    assert.equal(h.panel(),false,"the panel is closed on the Transfer Challenge");
    // Home -> START: Career Start is opened again on the same page (its automatic continue was already used for this revision).
    h.seen.length=0;
    await h.api.openPanel();await settle();
    assert.equal(h.calls.transferOpen,2,"the second open lands on the Transfer Challenge again (was: stuck on Career Start)");
    assert.equal(h.calls.panelShownAtTransfer[1],false,"the panel was not up when the Transfer Challenge opened");
    assert.deepEqual(h.seen,[],"no frame of the Career Start panel on the way");
    assert.equal(h.panel(),false,"Career Start is not left on screen");
    assert.equal(h.calls.read,1,"no Firestore read: READY is final for this Setup");
    await h.api.openPanel();await settle();
    assert.deepEqual([h.calls.transferOpen,h.calls.read,h.panel()],[3,1,false],"every later open does the same");
  });
  await check("RA6 Home item 5: Daniel's open code says WAITING FOR NIK only once the mode is known (loading until then)",async()=>{
    const src=read("js/onlinePlayerIdentity.js");
    const tile=src.slice(src.indexOf("function liveHomeTile("),src.indexOf("\n",src.indexOf("function liveHomeTile(")));
    const loading=tile.indexOf('p.managerRole==="playerOne"&&homeModeLoading())return["NEW","CHECKING…","Checking…"];');
    assert.ok(loading>0,"Daniel's open code with the mode not asked yet: the tile is loading");
    assert.ok(loading<tile.indexOf('return["WAIT","WAITING FOR NIK","Tap to see your code"]'),"loading is decided before WAITING (never a WAITING frame first)");
    const ask=src.slice(src.indexOf("function homeModeLoading("),src.indexOf("\n",src.indexOf("function homeModeLoading(")));
    assert.match(ask,/if\(mode==="test"\|\|mode==="real"\|\|homeModeAskedFor===state\.accountId\)return false;/,"a known mode, or a mode already asked on this page for this account, is never loading");
    assert.match(ask,/await \(await loadShowdownModes\(\)\)\?\.resolve\?\.\(\);\}catch\(_\)\{\}\}\)\(\)\.finally\(\(\)=>\{[^}]*homeModeAskedFor=accountId;configureOnlineProductSurface\(\);\}\)/,"the question is asked (once per account) and, answered or not, the tile is drawn again: never stuck loading");
    assert.match(src,/refreshHome:configureOnlineProductSurface/,"the identity module lets the mode redraw Home");
    const modes=read("js/showdownModes.js");
    const refresh=modes.slice(modes.indexOf("function smRefresh("),modes.indexOf("function smInstall("));
    assert.match(refresh,/CareerModeOnlinePlayerIdentity\?\.refreshHome\?\.\(\)/,"a mode learnt after Home was drawn redraws the tile (was: WAITING kept until the next tap)");
  });
  await check("RA7 Home item 6: the season chip on Home only for a current Showdown",async()=>{
    const src=read("js/onlinePlayerIdentity.js");
    const current=src.slice(src.indexOf("function homeShowdownCurrent("),src.indexOf("\n",src.indexOf("function homeShowdownCurrent(")));
    assert.match(current,/if\(p\.connectionState==="active"\)return true;/,"a live Showdown");
    assert.match(current,/p\.connectionState==="pending-pair"&&p\.managerRole==="playerOne"&&root\.CareerModeShowdownModes\?\.getView\?\.\(\)\?\.mode==="real"/,"Daniel's open code only when the mode is real");
    assert.match(src,/const chip=d\.getElementById\("seasonIndicator"\);if\(chip\)\{if\(homeShowdownCurrent\(\)\)\{if\(chip\.dataset\.homeShowdown!=="current"\)chip\.dataset\.homeShowdown="current";\}else if\(chip\.dataset\.homeShowdown\)delete chip\.dataset\.homeShowdown;\}/,"drawn with the START tile");
    const css=read("css/homeV10.css");
    assert.ok(css.includes('#app:has(#mainMenu.v10Home:not(.hidden)) #topHeader #seasonIndicator:not([data-home-showdown="current"]) { display: none !important; }'),"hidden on Home unless marked (also before the pair is read: no frame of a stale chip)");
    assert.ok(!/data-home-showdown/.test(read("css/app.css"))&&!/homeShowdown/.test(read("js/menuExperience.js")),"nothing added to the startup bundle");
  });
  await check("RA8 Home item 3: a continue in flight keeps the live tile (never START or JOIN), and LOAD SHOWDOWN while retrying a rebuild",async()=>{
    const src=read("js/onlinePlayerIdentity.js");
    const tile=src.slice(src.indexOf("function liveHomeTile("),src.indexOf("\n",src.indexOf("function liveHomeTile(")));
    assert.match(tile,/if\(p\.connectionState==="active"&&\(p\.status==="paired"\|\|p\.status==="continuing"\)\)\{lastLiveTile=\{rivalryId:p\.rivalryId,status:"paired"\};return\["LIVE","CONTINUE SHOWDOWN"/,"continuing reads CONTINUE SHOWDOWN (was: START A SHOWDOWN / JOIN until the continue ended)");
    const keep=tile.indexOf('p.status==="continuing"&&lastLiveTile&&lastLiveTile.rivalryId===p.rivalryId&&lastLiveTile.status==="recovery-required")return["LIVE","LOAD SHOWDOWN"');
    assert.ok(keep>0&&keep<tile.indexOf('return["LIVE","CONTINUE SHOWDOWN"'),"a retry of a Showdown this page could not load keeps LOAD SHOWDOWN (no CONTINUE flash)");
  });
  await check("RA9 Home item 2: the CONTINUE CAREER line describes a saved Showdown only while it is current",async()=>{
    const css=read("css/homeV10.css");
    assert.ok(css.includes('#app:has(#mainMenu.v10Home:not(.hidden)):has(#seasonIndicator:not([data-home-showdown="current"])) #mainMenu.v10Home #continueCareer:not(:disabled) .menuTileMeta { visibility: hidden !important; }'),"the line is hidden (in place) on Home unless the chip's marking says current");
    assert.ok(!/data-home-showdown/.test(read("js/menuExperience.js")+read("css/app.css")),"no startup-bundle change");
  });
  console.log(`PASS r80 resume-active contracts: ${passed} checks`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
