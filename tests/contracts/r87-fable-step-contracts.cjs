"use strict";
// r87 Fable job 2 (roulette step and flow): each fixed finding is driven through the real module. Part A runs the real season
// step (js/rosterRouletteStep.js) in a VM with a small page; part B runs the real production Transfer Challenge module
// (js/productionSharedTransferChallenge.js) with a fake page, provider and step, as tests/contracts/r87-wait-both-spins-contracts.cjs.
// Nik's rule for the step: the roulette is never skipped and never run twice; no silent pass on a null plan or a missing
// confirm time; the true reason in plain words with a way back to Home; the roulette DOM always comes down; the Reus Gate
// loading screen holds from START until a card or the scene is ready; nothing dims or covers.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
global.window=globalThis;
require("../../data/transferOptions.js");
const Provider=require("../../js/sparkSharedTransferChallenge.js");
const Step=require("../../js/rosterRouletteStep.js");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const STEP_SOURCE=read("js/rosterRouletteStep.js"),PSTC_SOURCE=read("js/productionSharedTransferChallenge.js");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${id} ${label}`);};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test,label,tries=400){for(let i=0;i<tries;i+=1){const value=test();if(value)return value;await wait(5);}assert.fail(`timed out waiting for ${label}`);}

// ---------- part A: the season step ----------
class El{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.style={};this.textContent="";this.parent=null;this.hidden=false;this.classes=new Set();this.id="";this.offsetWidth=1;
    this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c)};
    if(tag==="iframe")this.contentWindow={posted:[],postMessage(m){this.posted.push(m);},location:{href:"x"},THREE:{}};}
  set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this.classes].join(" ");}
  append(...nodes){for(const n of nodes){if(n.parent)n.remove();n.parent=this;this.children.push(n);}}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
  addEventListener(t,fn){(this.listeners[t]||=[]).push(fn);}focus(){}
  all(){return [this,...this.children.flatMap(c=>c.all())];}
  querySelector(sel){return sel==="button"?this.all().slice(1).find(n=>n.tagName==="button")||null:null;}
}
const CTX={rivalryId:"pair_"+"c".repeat(64),managerRole:"playerOne",season:1,clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},confirmedAtMs:Date.parse("2026-11-01T00:00:00Z"),phase:"NOT_STARTED"};
const SAFE_PLAN={boards:{playerOne:[{pos:"GK",positions:["GK"],name:"Keeper",rating:80}],playerTwo:[{pos:"GK",positions:["GK"],name:"Other",rating:80}]},formations:{playerOne:"x",playerTwo:"y"},
  turns:[{role:"playerOne",fired:false,player:null,bulletChamber:1,stopChamber:4,hitSlot:null,aimSlot:0},{role:"playerTwo",fired:false,player:null,bulletChamber:2,stopChamber:5,hitSlot:null,aimSlot:0}]};
function stepWorld({forSeason=()=>SAFE_PLAN,clubs={Arsenal:{},Liverpool:{}},loadGate=null,loads=()=>true}={}){
  const body=new El("body"),doc={body,createElement:tag=>new El(tag),getElementById:id=>body.all().find(n=>n.id===id)||null};
  const loading=new El("div");loading.id="loadingScreen";loading.hidden=true;loading.classList.add("hidden");loading.setAttribute("aria-hidden","true");
  const text=new El("p");text.id="loadingText";text.textContent="LOADING";loading.append(text);body.append(loading);
  const handlers=[],store=new Map(),calls={forSeason:0,navigate:[],loads:[]};let attempt=0;
  const sandbox={document:doc,setTimeout:(fn,ms)=>setTimeout(fn,Math.ceil((ms||0)/100)),clearTimeout,location:{origin:"x"},
    addEventListener:(t,fn)=>{if(t==="message")handlers.push(fn);},removeEventListener(){},
    readStorageValue:k=>store.get(k)||null,writeStorageValue:(k,v)=>{store.set(k,v);return true;},
    navigateTo:async id=>{calls.navigate.push(id);return true;},
    loadRuntimeScript:async key=>{calls.loads.push(key);if(loadGate)await loadGate;if(key==="fifa17-players"){attempt+=1;if(!loads(attempt))throw new Error("network unavailable");}
      sandbox.CareerModeFifa17Players={clubs};sandbox.CareerModeRosterSquads={};sandbox.CareerModeMarqueePlayers={};sandbox.CareerModeMarqueePlayer={forShowdown:()=>null};
      sandbox.CareerModeRosterRoulette={board:club=>club==="Atlantis FC"?null:[{}],forSeason:(...args)=>{calls.forSeason+=1;return forSeason(...args);}};return true;}};
  vm.createContext(sandbox);vm.runInContext(STEP_SOURCE,sandbox,{filename:"rosterRouletteStep.js"});
  const step=sandbox.CareerModeRosterRouletteStep;
  const panel=()=>doc.getElementById(step.panelId),stage=()=>doc.getElementById(step.stageId);
  const title=()=>panel()?.all().find(n=>n.className==="rrStepTitle")?.textContent||null;
  const lines=()=>panel()?panel().all().filter(n=>n.className==="rrStepLine"||n.className==="rrStepNote").map(n=>n.textContent):[];
  const button=label=>panel()?.all().find(n=>n.tagName==="button"&&n.textContent===label)||null;
  const press=async label=>{const b=await until(()=>button(label),"button "+label);const shown=title();b.listeners.click[0]();await wait(5);return shown;};
  const frame=()=>body.all().find(n=>n.tagName==="iframe")||null;
  const pageSays=type=>{for(const h of handlers)h({source:frame().contentWindow,origin:"x",data:{type}});};
  const loadingUp=()=>!loading.hidden&&!loading.classList.contains("hidden")&&!loading.classList.contains("is-exiting")&&loading.getAttribute("aria-busy")==="true";
  return {step,store,calls,panel,stage,title,lines,button,press,frame,pageSays,loading,loadingUp};
}

async function partA(){
  // F2-03: a TRY AGAIN card from a failed history read never stays over the scene: once the revolver shows, the card is gone.
  {
    let reads=0;const w=stepWorld();
    const ctx={...CTX,season:2,verdicts:async()=>{reads+=1;return reads===1?{ok:false,code:"unavailable"}:{ok:true,verdicts:{playerOne:[],playerTwo:[]}};}};
    const run=w.step.runBeforeTransfers(ctx);
    assert.equal(await w.press("TRY AGAIN"),"Building the boards");
    await until(()=>w.frame(),"the roulette page");
    w.pageSays("cms-rr-ready");w.pageSays("cms-rr-armed");
    await until(()=>w.stage()&&w.stage().style.visibility==="visible","the stage to show");
    assert.equal(w.panel(),null,"no stale TRY AGAIN card over the scene");
    assert.equal(w.loadingUp(),false,"the loading screen made way for the scene");
    w.pageSays("cms-rr-continue");
    assert.equal(await w.press("GO TO THE TRANSFER WINDOW"),"Your squad is safe","the spin's CONTINUE reaches the result");
    assert.equal(await run,true);
    ok("F2-03","a TRY AGAIN card is removed before the scene shows; the spin's CONTINUE reaches the result card");
  }
  // F2-04 + S4: no plan is never marked done and never opens the window; the card names the true reason, with BACK to Home.
  {
    const w=stepWorld({clubs:{Arsenal:{}}});// a club in the squads file that the players file does not have (S4)
    const ctx={...CTX,verdicts:async()=>({ok:false})};
    const run=w.step.runBeforeTransfers(ctx);
    await until(()=>w.title()==="No roulette board","the no-board card");
    assert.ok(w.lines().some(line=>/no FIFA 17 squad for Liverpool/.test(line)),"the card names the club");
    assert.equal(w.calls.forSeason,0,"the engine is not run on a club it would throw on (S4)");
    assert.equal(w.button("TRY AGAIN"),null,"a data gap is not retried in a loop");
    assert.equal(await w.press("BACK TO SHOWDOWN HOME"),"No roulette board");
    assert.equal(await run,false,"the window stays shut");assert.equal(w.step.decide(ctx),true,"nothing is marked done");
    assert.deepEqual(w.calls.navigate,["mainMenu"],"BACK goes to Showdown Home");
    assert.equal(w.stage(),null);assert.equal(w.panel(),null);assert.equal(w.loadingUp(),false,"everything comes down");
  }
  for(const [label,forSeason] of [["null plan",()=>null],["fired with no player",()=>({...SAFE_PLAN,turns:[{...SAFE_PLAN.turns[0],fired:true,player:null},SAFE_PLAN.turns[1]]})]]){
    const w=stepWorld({forSeason});const ctx={...CTX,verdicts:async()=>({ok:false})};
    const run=w.step.runBeforeTransfers(ctx);
    await until(()=>w.title()==="No roulette board",label);
    assert.ok(w.lines().some(line=>/Nothing was spun or saved/.test(line)),label);
    await w.press("BACK TO SHOWDOWN HOME");
    assert.equal(await run,false,`${label}: never a silent pass`);assert.equal(w.step.decide(ctx),true,`${label}: no DONE mark`);
    assert.equal(w.store.get(w.step.doneKey)||null,null);
  }
  assert.ok(!/rrsMark\(DONE_KEY,key\);return true;\}/.test(STEP_SOURCE),"no early DONE mark anywhere in the step");
  ok("F2-04","a null plan (or a hit with no player) is never marked done: a card says why, BACK goes Home, nothing stays up; S4 club gap named");

  // F2-09: the history read's true reason, never "check the connection" for an answer that is not the connection.
  for(const [code,expect] of [["TRANSFER_NOT_COMPLETED",/Season 1's Transfer War never reached its verdicts/],["TRANSFER_CONTEXT_STALE",/moved on while this screen was open/],["permission-denied",/not open here/],["unavailable",/the connection dropped/],["TRANSFER_SOMETHING_ELSE",/\(TRANSFER_SOMETHING_ELSE\)/]]){
    const w=stepWorld();const ctx={...CTX,season:2,verdicts:async()=>({ok:false,code})};
    const run=w.step.runBeforeTransfers(ctx);
    await until(()=>w.title()==="Building the boards",code);
    assert.match(w.lines()[0],expect,code);
    if(code!=="unavailable")assert.doesNotMatch(w.lines()[0],/connection/i,`${code}: not blamed on the connection`);
    await w.press("BACK TO SHOWDOWN HOME");assert.equal(await run,false);
  }
  {
    const w=stepWorld({forSeason:()=>{throw new Error("boom");}});const ctx={...CTX,verdicts:async()=>({ok:false})};
    const run=w.step.runBeforeTransfers(ctx);
    await until(()=>w.title()==="The roulette hit a problem","the guarded card");
    assert.doesNotMatch(w.lines()[0],/connection/i,"an engine error is not blamed on the connection");
    await w.press("BACK TO SHOWDOWN HOME");assert.equal(await run,false);
  }
  ok("F2-09","history read and engine failures show their true reason (not finished, moved on, not open, offline, code) with BACK");

  // F2-13: the loading screen holds from START (the files and reads before the scene), then hands over to the card.
  {
    let release;const gate=new Promise(resolve=>{release=resolve;});
    const w=stepWorld({loadGate:gate});const ctx={...CTX,verdicts:async()=>({ok:false})};
    w.store.set(w.step.watchedKey,JSON.stringify([`${ctx.rivalryId}|1|playerOne`]));
    const run=w.step.runBeforeTransfers(ctx);await wait(5);
    assert.equal(w.loadingUp(),true,"the loading screen is up while the roulette's files load");
    assert.equal(w.panel(),null);
    release();
    await until(()=>w.title()==="Your squad is safe","the result card");
    assert.equal(w.loadingUp(),false,"the result card takes over from the loading screen");
    // F2-17: the roulette counts as on screen from START until close(), across the release save and the navigation.
    await w.press("GO TO THE TRANSFER WINDOW");assert.equal(await run,true);
    assert.equal(w.step.active(),true,"still on screen after GO, until the Transfer Challenge closes it");
    assert.ok(w.panel(),"the card stays until close() (nothing shows between it and the next screen)");
    w.step.close();
    assert.equal(w.step.active(),false);assert.equal(w.panel(),null);assert.equal(w.stage(),null);
    ok("F2-13","the Reus Gate loading screen holds from START until the card or scene is ready");
    ok("F2-17","the step counts as active from START until close(), so Career Start's 25 s timeout cannot fire under the release save and navigation");
  }
  {
    const w=stepWorld({loads:n=>n>1});const ctx={...CTX,verdicts:async()=>({ok:false})};
    const run=w.step.runBeforeTransfers(ctx);
    assert.equal(await w.press("TRY AGAIN"),"Loading the roulette");
    assert.equal(w.loadingUp(),true,"TRY AGAIN brings the loading screen back over the card");
    await w.press("BACK TO SHOWDOWN HOME");
    assert.equal(await run,false);assert.equal(w.loadingUp(),false,"BACK takes the loading screen down");assert.equal(w.panel(),null);
  }
  // F2-06: the Special Player draw loads by itself, also when this season's roulette is already done on this browser.
  {
    const w=stepWorld();const ctx={...CTX,verdicts:async()=>({ok:false})};
    w.store.set(w.step.doneKey,JSON.stringify([`${ctx.rivalryId}|1|playerOne`]));
    assert.equal(w.step.decide(ctx),false,"done here");
    assert.equal(typeof w.step.ensureDraw,"function");assert.equal(await w.step.ensureDraw(),true);
    assert.ok(w.calls.loads.includes("marquee-player-list")&&w.calls.loads.every(key=>/^marquee-player/.test(key)),"only the draw's files load");
  }
  // F2-11: forgetHome clears an earlier BACK.
  {
    const w=stepWorld({loads:()=>false});const ctx={...CTX,verdicts:async()=>({ok:false})};
    const run=w.step.runBeforeTransfers(ctx);await w.press("BACK TO SHOWDOWN HOME");await run;
    assert.equal(w.step.wentHome(),true);w.step.forgetHome();assert.equal(w.step.wentHome(),false);
  }
}

// ---------- part B: the production Transfer Challenge module ----------
const {FakeNode}=require("../support/fake-dom.cjs");
const rivalryId="pair_"+"a".repeat(64),sessionId="session_"+"b".repeat(64),device1="device_"+"1".repeat(32),uid1="manager_one";
function fakePage(){
  const byId=new Map();
  const doc={visibilityState:"visible",
    getElementById(id){if(!byId.has(id)){const node=new FakeNode("div");node.id=id;node.hasAttribute=k=>Object.prototype.hasOwnProperty.call(node.attributes,k);node.removeAttribute=k=>{delete node.attributes[k];};if(id==="transferChallenge")node.classList.add("hidden");byId.set(id,node);}return byId.get(id);},
    querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new FakeNode(tag),addEventListener(){}};
  return {doc};
}
async function settle(){for(let i=0;i<30;i+=1)await new Promise(resolve=>setImmediate(resolve));}
async function phone({confirmedAtMs,step,state=null,navigateTo=null,readFails=false}){
  const page=fakePage(),calls={markSpun:[],read:0};let sandbox=null;
  const projection=()=>state?{ok:true,revision:state.revision,state,managerRole:"playerOne",seasonNumber:1,spunRoles:null,ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null}:{ok:true,revision:0,state:null,managerRole:"playerOne",seasonNumber:1,spunRoles:["playerOne","playerTwo"],ownInputs:null,opponentInputs:null,verdicts:null};
  const provider={rouletteEligible:ms=>Number.isFinite(ms)&&ms>=Provider.rouletteFromMs,
    read:async()=>{calls.read+=1;if(readFails)return {ok:false,code:"unavailable"};return projection();},
    markSpun:async options=>{calls.markSpun.push(options.managerRole);return {ok:true};},
    startWindow:async()=>({ok:false}),requestEndWindow:async()=>({ok:false}),advanceExpiredWindow:async()=>({ok:false}),lockGuesses:async()=>({ok:false}),lockSignings:async()=>({ok:false})};
  sandbox={
    console,Date,Promise,JSON,Math,Number,String,Array,Object,Set,Map,Error,Boolean,RegExp,Uint8Array,
    setTimeout:(fn,ms)=>ms>=1000?0:setTimeout(fn,ms),clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
    performance:{now:()=>Date.now()},crypto:webcrypto,document:page.doc,addEventListener(){},
    currentShowdown:{id:"save_1",currentRound:1,sharedJourney:{mode:"shared",rivalryId},managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"}},
    navigateTo:navigateTo||(async id=>{page.doc.getElementById(id).classList.remove("hidden");return true;}),
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>null,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"}},managerRole:"playerOne",rivalryId,sessionId,deviceId:device1,setupUpdatedAtMs:confirmedAtMs})},
    CareerModeProductionSharedCareerStart:{refresh:async()=>null,getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})},
    CareerModeSharedTransferChallenge:{},CareerModeSparkSharedTransferChallenge:provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:uid1,getIdTokenResult:async()=>({issuedAtTime:new Date().toISOString()})}},firestore:{},firestoreSdk:{}})},
    CareerModeRosterRouletteStep:step
  };
  sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(PSTC_SOURCE,sandbox,{filename:"productionSharedTransferChallenge.js"});
  const api=sandbox.CareerModeProductionSharedTransferChallenge;api.install();await settle();
  return {api,page,calls,sandbox};
}
function fakeStep(extra={}){
  const calls={close:0,forget:0,draw:0,decide:0};
  return {calls,step:{fromMs:Step.fromMs,decide:()=>{calls.decide+=1;return false;},runBeforeTransfers:async()=>true,close(){calls.close+=1;},forgetHome(){calls.forget+=1;},ensureDraw:async()=>{calls.draw+=1;return true;},...extra}};
}

async function partB(){
  const R87=Step.fromMs+60_000;
  // F2-01: a navigation to the transfer screen that fails still takes the roulette's card and stage down.
  {
    const s=fakeStep();
    const p=await phone({confirmedAtMs:R87,step:s.step,navigateTo:async()=>{throw new Error("transfer skin failed");}});
    await assert.rejects(()=>p.api.open(),/transfer skin failed/);
    assert.equal(s.calls.close,1,"the roulette DOM comes down on a failed navigation");
    ok("F2-01","a rejected navigateTo(transferChallenge) still closes the roulette panel and stage");
  }
  // F2-05: no confirm time after the Setup refresh = the Setup could not be read: never a silent pass, the true reason shows.
  {
    const s=fakeStep();
    const p=await phone({confirmedAtMs:undefined,step:s.step});
    assert.equal(await p.api.open(),false,"the window stays shut");
    assert.equal(p.page.doc.getElementById("transferChallenge").classList.contains("hidden"),true);
    assert.match(p.api.rouletteError(),/confirmed Setup, and it could not be read just now/);
    assert.doesNotMatch(p.api.rouletteError(),/connection/i);
    assert.deepEqual(p.calls.markSpun,[],"no mark without the roulette");
    assert.equal(s.calls.decide,0,"the step is never asked to pass a season it cannot date");
    assert.equal(p.page.doc.getElementById("dashboardTransferStatus").textContent,p.api.rouletteError(),"the dashboard says why");
    const cs=read("js/productionSharedCareerStart.js");
    assert.match(cs,/const reason=opened!==true&&typeof transfer\.rouletteError==="function"\?transfer\.rouletteError\(\):"";\s*if\(reason\)\{lastError=reason;return false;\}/,"Career Start shows the same reason");
    ok("F2-05","a missing confirm time keeps the window shut with the Setup reason on the dashboard and Career Start; no mark");
  }
  // F2-06: the Special Player draw is ensured before every window, also when the roulette is already done here.
  {
    const s=fakeStep();const p=await phone({confirmedAtMs:R87,step:s.step});
    assert.equal(await p.api.open(),true);assert.equal(s.calls.draw,1,"the draw is loaded although decide() is false");
    const f=fakeStep({ensureDraw:async()=>false});const q=await phone({confirmedAtMs:R87,step:f.step});
    assert.equal(await q.api.open(),false,"no draw, no window (the R87-SP-02 refusal needs it)");
    assert.match(q.api.rouletteError(),/Special Player list could not load/);
    ok("F2-06","the Special Player draw loads before every window (R87-SP-02 holds after a reload); a failed load keeps it shut");
  }
  // F2-11: every open forgets an earlier BACK first, so a read failure is never taken for "went home".
  {
    const s=fakeStep();const p=await phone({confirmedAtMs:R87,step:s.step,readFails:true});
    const opened=await p.api.open().catch(()=>false);
    assert.notEqual(opened,true);assert.equal(s.calls.forget,1,"forgetHome() runs at the start of every open");
    ok("F2-11","each open clears an earlier BACK, so Career Start reports a later failure instead of closing silently");
  }
  // F2-14: phases this phone did not see are set to replay before the transfer screen shows (no live frame first).
  {
    let replayAtShow="unset";const s=fakeStep();
    const state={phase:"SIGNING_ENTRY",revision:3,startedAtEpochMs:Date.now()-120000,endedAtEpochMs:Date.now()-60000,endRequestedRoles:[],guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:[]};
    let doc=null;
    const p=await phone({confirmedAtMs:R87,step:s.step,state,navigateTo:async id=>{const screen=doc.getElementById(id);replayAtShow=screen.dataset.sharedTransferReplay;screen.classList.remove("hidden");return true;}});
    doc=p.page.doc;
    assert.equal(await p.api.open(),true);
    assert.equal(replayAtShow,"WINDOW_OPEN","the screen is already in REPLAY when it shows");
    ok("F2-14","the replay is prepared and rendered before navigateTo, so the transfer screen never flashes the live phase");
  }
  // F2-18: Escape never closes the Career Start stage under a running roulette.
  assert.match(read("js/productionSharedCareerStart.js"),/watch\.escape=event=>\{if\(event\.key==="Escape"&&!event\.defaultPrevented&&pcstPanelOpen\(\)&&!root\.CareerModeRosterRouletteStep\?\.active\?\.\(\)\)/);
  ok("F2-18","Escape is ignored while the roulette is on screen");
}

(async()=>{
  await partA();
  await partB();
  console.log(`r87 Fable step contracts: ${checks} groups passed`);
})().catch(error=>{console.error(error);process.exitCode=1;});
