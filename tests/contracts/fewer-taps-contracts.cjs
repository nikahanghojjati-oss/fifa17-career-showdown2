"use strict";
// Job 33 "Fewer taps" (spec: TAP_AUDIT_2026-10-04 reductions R1 to R8; R7 added by Nik's owner decision of 2026-10-04).
// Owner rule: the two-manager game stays smooth and safe; fewer taps, same safety. Every removed tap was a pure navigation or a read.
//   R1 Waiting screens read faster (3 s, pair panel 4 s; the Remote Joining host watch is job 31's) for at most 3 minutes, then the normal interval;
//      read-only, paused while the tab is hidden, and only while this manager is waiting on the rival.
//   R2 CONTINUE TO SEASON N opens the new season's Shared Transfer Challenge (no dashboard hop); it never starts the window.
//   R3 The league reveal moves on to the club packs by itself on both devices (no CONTINUE TO CLUB PACKS tap).
//   R4 The first confirmer opens Career Start by itself; Career Start moves on to the Transfer Challenge once BOTH attested.
//   R5 (R5b) connected players without an ACTIVE session go straight to Remote Joining. R5a is not landed: START A SHOWDOWN keeps
//      GET READY over the locked canonical league screen, which the POS10 stability audit requires.
//   R6 An ACTIVE private session continues into the Showdown by itself (no START CAREER tap); expired sessions never do.
//   R7 Daniel's COMMIT & ACKNOWLEDGE tap commits, then records his own acknowledgement; Nik still acknowledges himself;
//      if the second half fails Daniel gets the existing CONFIRM SEASON button.
//   R8 The duplicate "results are ready" banners are gone; the Shared Season Commit status is the one next-step line.
//   S  Manual taps that must stay manual are still manual (locks, REVIEW + PUBLISH, COMMIT, Nik's ACKNOWLEDGE, CLOSE, pair code, hosting).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_3"+"7".repeat(63),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32),ACCOUNT="account_one";
const FAST=3000,WINDOW=180000;
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,5));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}
const clone=value=>JSON.parse(JSON.stringify(value));

// ------------------------------------------------------------------ shared test doubles
function makeClock(start=1_800_000_000_000){
  const clock={now:start};
  class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock.now]));}static now(){return clock.now;}}
  clock.Date=ClockDate;return clock;
}
function makeTimers(){
  const timeouts=[],intervals=[];let next=0;
  return {timeouts,intervals,
    setTimeout:(fn,ms)=>{const t={id:++next,fn,ms:Number(ms)||0,cleared:false,fired:false};timeouts.push(t);return t.id;},
    clearTimeout:id=>{const t=timeouts.find(item=>item.id===id);if(t)t.cleared=true;},
    setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length;},
    clearInterval(){},
    pending:()=>timeouts.filter(t=>!t.cleared&&!t.fired),
    async fire(t){t.fired=true;t.fn();await settle();},
    async fireAll(filter=()=>true){let fired=0;for(let guard=0;guard<20;guard+=1){const due=timeouts.filter(t=>!t.cleared&&!t.fired&&filter(t));if(!due.length)break;for(const t of due){t.fired=true;t.fn();fired+=1;}await settle();}return fired;}};
}
function createDom(){
  let active=null;
  const toKey=attr=>attr.replace(/^data-/,"").replace(/-([a-z])/g,(_m,c)=>c.toUpperCase());
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this._id="";this.className="";this.ownText="";this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.type="";this.title="";this.value="";this.style={};this.tabIndex=0;
      const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c),toggle:(c,force)=>{const has=self.classList.contains(c),want=force===undefined?!has:Boolean(force);if(want)self.classList.add(c);else self.classList.remove(c);return want;}};}
    get id(){return this._id;}set id(v){this._id=String(v);}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);for(const c of this.children)c.parent=null;this.children=[];}
    set innerHTML(_v){this.textContent="";}
    get isConnected(){let n=this;while(n){if(n===documentElement)return true;n=n.parent;}return false;}
    get parentNode(){return this.parent;}
    get firstChild(){return this.children[0]||null;}
    append(...nodes){for(let n of nodes){if(typeof n==="string"){const t=new El("#text");t.ownText=n;n=t;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    appendChild(n){this.append(n);return n;}
    prepend(n){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.unshift(n);}
    insertBefore(n,ref){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(n);else this.children.splice(i,0,n);return n;}
    insertAdjacentElement(_where,n){(this.parent||this).append(n);return n;}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    removeEventListener(){}
    setAttribute(k,v){this.attributes[k]=String(v);if(k==="id")this.id=v;}
    getAttribute(k){return Object.hasOwn(this.attributes,k)?this.attributes[k]:null;}
    removeAttribute(k){delete this.attributes[k];}
    hasAttribute(k){return Object.hasOwn(this.attributes,k);}
    focus(){active=this;}
    scrollIntoView(){}
    click(){if(this.disabled)return;for(const fn of this.listeners.click||[])fn({target:this,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    matchesSimple(sel){if(sel.startsWith("#"))return this.id===sel.slice(1);if(sel.startsWith("."))return this.classList.contains(sel.slice(1));if(sel.startsWith("["))return Object.hasOwn(this.dataset,toKey(sel.slice(1,-1)));return this.tagName===sel.toUpperCase();}
    matches(selector){return selector.split(",").map(s=>s.trim()).some(sel=>{const parts=sel.split(/\s+/);if(!this.matchesSimple(parts[parts.length-1]))return false;let n=this.parent;for(let i=parts.length-2;i>=0;i-=1){while(n&&!n.matchesSimple(parts[i]))n=n.parent;if(!n)return false;n=n.parent;}return true;});}
    querySelectorAll(selector){return this.all().filter(n=>n.matches(selector));}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    closest(selector){let n=this;while(n){if(n.matches&&n.matches(selector))return n;n=n.parent;}return null;}
    buttons(){return this.all().filter(n=>n.tagName==="BUTTON");}
    button(text){return this.buttons().find(n=>n.textContent===text)||null;}
  }
  const documentElement=new El("html"),head=new El("head"),body=new El("body");documentElement.append(head,body);
  const listeners=[];
  const document={documentElement,head,body,visibilityState:"visible",
    createElement:tag=>new El(tag),createDocumentFragment:()=>new El("#fragment"),
    getElementById:id=>documentElement.all().find(n=>n.id===id)||null,
    querySelector:sel=>documentElement.querySelector(sel),querySelectorAll:sel=>documentElement.querySelectorAll(sel),
    addEventListener(type,fn,capture){listeners.push({type,fn,capture});},removeEventListener(){},
    get activeElement(){return active&&active.isConnected?active:body;}};
  const add=(id,{tag="div",hidden=false,parent=body,className=""}={})=>{const n=new El(tag);n.id=id;if(className)n.className=className;if(hidden)n.classList.add("hidden");parent.append(n);return n;};
  return {El,document,body,add,listeners};
}
const visible=node=>Boolean(node&&!node.classList.contains("hidden"));

// ------------------------------------------------------------------ R1 Transfer Challenge
function transferHarness(initial,{role="playerOne"}={}){
  const server={revision:initial.revision,state:clone(initial.state)};
  const calls={read:0,mutations:[],upstream:0},nodes=new Map(),handlers={},intervals=[];
  function node(id){
    if(!nodes.has(id)){
      const classes=new Set(id==="transferChallenge"?[]:["hidden"]);
      const n={id,value:"",textContent:"",disabled:false,dataset:{},attributes:{},className:"",placeholder:"",
        classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:(c,force)=>{const want=force===undefined?!classes.has(c):Boolean(force);if(want)classes.add(c);else classes.delete(c);return want;}},
        setAttribute(k,v){n.attributes[k]=String(v);},removeAttribute(k){delete n.attributes[k];},hasAttribute:k=>Object.hasOwn(n.attributes,k),addEventListener(){},append(){},replaceChildren(){},
        closest:()=>node(`closest:${id}`),querySelectorAll:()=>[],querySelector:()=>node(`query:${id}`)};
      nodes.set(id,n);
    }
    return nodes.get(id);
  }
  const document={visibilityState:"visible",getElementById:node,querySelector:selector=>node(`sel:${selector}`),querySelectorAll:()=>[],addEventListener(type,fn){handlers[type]=fn;},createElement:()=>node(`created:${nodes.size}`)};
  const projection=()=>({ok:true,revision:server.revision,state:server.state?clone(server.state):null,managerRole:role,seasonNumber:1,ownInputs:null,opponentInputs:null,verdicts:null});
  const provider={read:async()=>{calls.read+=1;return projection();}};
  for(const method of ["startWindow","requestEndWindow","advanceExpiredWindow","lockGuesses","lockSignings"])provider[method]=async options=>{calls.mutations.push({method,baseRevision:options.baseRevision});return {ok:false,code:"UNEXPECTED_WRITE"};};
  const clock=makeClock();
  const sandbox={console,crypto:webcrypto,performance,setTimeout,clearTimeout,Promise,Date:clock.Date,document};
  sandbox.globalThis=sandbox;sandbox.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
  sandbox.currentShowdown={id:"save_1",sharedJourney:{mode:"shared",rivalryId:RIVALRY},currentRound:1};
  const setupState={ready:true,managerRole:role,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",clubs:{playerOne:"A",playerTwo:"B"}}};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>{calls.upstream+=1;return null;},getState:()=>setupState};
  sandbox.CareerModeProductionSharedCareerStart={refresh:async()=>{calls.upstream+=1;return null;},getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})};
  sandbox.CareerModeSharedTransferChallenge={};sandbox.CareerModeSparkSharedTransferChallenge=provider;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{getIdTokenResult:async()=>({issuedAtTime:new Date().toUTCString()})}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedTransferChallenge.js").replace(/^\(function\(root,factory\)\{[\s\S]*?\}\)\(typeof globalThis/,"(function(root,factory){root.CareerModeProductionSharedTransferChallenge=factory(root);})(typeof globalThis"),sandbox,{filename:"productionSharedTransferChallenge.js"});
  const api=sandbox.CareerModeProductionSharedTransferChallenge;
  return {api,server,calls,node,intervals,clock,document,fast:()=>intervals.find(item=>item.ms===FAST)};
}
const transferState=(phase,patch={})=>({revision:3,state:{seasonNumber:1,coordinatorRole:"playerOne",phase,revision:3,startedAtEpochMs:1_800_000_000_000,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],...patch}});
// Both managers watched the earlier phases live, so the harness walks the authority through them (no replay queue).
async function walkTo(h,phase,patch){const order=["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"];for(const step of order.slice(0,order.indexOf(phase))){h.server.state={...h.server.state,phase:step};await h.api.refresh();}h.server.state={...h.server.state,phase,...patch};h.server.revision+=1;await h.api.refresh();}
async function fastReads(h){const before=h.calls.read,upstream=h.calls.upstream;h.fast().fn();await settle();assert.equal(h.calls.upstream,upstream,"a fast read is light: it reuses the confirmed Setup and Career Start (one provider read per poll)");return h.calls.read-before;}

async function r1TransferContracts(){
  {
    const h=transferHarness({revision:0,state:null},{role:"playerTwo"});await h.api.refresh();h.api.install();await settle();
    assert.equal(h.api.fastPollIntervalMs,FAST,"Transfer fast lane is 3 s");assert.equal(h.api.fastPollWindowMs,WINDOW,"Transfer fast lane is capped at 3 minutes");assert.equal(h.api.pollIntervalMs,15000,"the normal Transfer poll stays 15 s");
    assert.ok(h.intervals.some(item=>item.ms===15000),"the normal 15 s poll is still installed");assert.ok(h.fast(),"a 3 s fast lane is installed");
    assert.equal(h.api.isWaitingForRival(),true,"Nik waits for Daniel to start the window");
    assert.equal(await fastReads(h),1,"the fast lane reads the shared challenge while Nik waits for the start");
    assert.deepEqual(h.calls.mutations,[],"the fast lane never writes");
  }
  ok("R1 Transfer: Nik waiting for Daniel's START reads every 3 s (read-only), the 15 s poll is unchanged");
  {
    const h=transferHarness({revision:0,state:null},{role:"playerOne"});await h.api.refresh();h.api.install();await settle();
    assert.equal(h.api.isWaitingForRival(),false,"the coordinator is not waiting: START is his own tap");
    assert.equal(await fastReads(h),0,"no fast read when this manager has the next tap");
    const open=transferHarness(transferState("WINDOW_OPEN"),{role:"playerTwo"});await open.api.refresh();open.api.install();await settle();
    assert.equal(open.api.isWaitingForRival(),false,"an open window nobody asked to end is not a waiting state");
    assert.equal(await fastReads(open),0,"no fast read in the live window");
  }
  ok("R1 Transfer: no fast reads when it is this manager's turn or the window is simply live");
  for(const [phase,patch,label] of [["WINDOW_OPEN",{endRequestedRoles:["playerOne"]},"early end requested"],["GUESS_ENTRY",{guessLockedRoles:["playerOne"]},"guesses locked"],["SIGNING_ENTRY",{guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:["playerOne"]},"signings locked"]]){
    const h=transferHarness(transferState("WINDOW_OPEN"),{role:"playerOne"});await walkTo(h,phase,patch);h.api.install();await settle();
    assert.equal(h.api.isWaitingForRival(),true,`${label}: Daniel waits on Nik`);
    assert.equal(await fastReads(h),1,`${label}: the fast lane reads`);
    h.server.state={...h.server.state,...(phase==="WINDOW_OPEN"?{endRequestedRoles:["playerOne","playerTwo"],phase:"GUESS_ENTRY"}:phase==="GUESS_ENTRY"?{guessLockedRoles:["playerOne","playerTwo"],phase:"SIGNING_ENTRY"}:{signingLockedRoles:["playerOne","playerTwo"],phase:"COMPLETED"})};h.server.revision+=1;
    assert.equal(await fastReads(h),1,`${label}: the rival's step is seen within one fast poll`);
    assert.notEqual(h.api.getState().state.phase,phase,`${label}: the screen advanced without a REFRESH tap`);
    assert.equal(h.api.isWaitingForRival(),false,`${label}: the new phase is this manager's turn again`);
    assert.deepEqual(h.calls.mutations,[],`${label}: no write`);
  }
  ok("R1 Transfer: after early-end / guess lock / signing lock the rival's step arrives by the 3 s read, no REFRESH CHALLENGE tap");
  {
    const h=transferHarness(transferState("WINDOW_OPEN"),{role:"playerOne"});await walkTo(h,"GUESS_ENTRY",{guessLockedRoles:["playerOne"]});h.api.install();await settle();
    assert.equal(await fastReads(h),1);
    h.clock.now+=WINDOW+1000;
    assert.equal(await fastReads(h),0,"after 3 minutes of waiting the fast lane stops (the 15 s poll carries on)");
    const fresh=transferHarness(transferState("WINDOW_OPEN"),{role:"playerOne"});await walkTo(fresh,"GUESS_ENTRY",{guessLockedRoles:["playerOne"]});fresh.api.install();await settle();
    fresh.document.visibilityState="hidden";
    assert.equal(await fastReads(fresh),0,"a hidden tab never fast-polls");
    fresh.document.visibilityState="visible";
    assert.equal(await fastReads(fresh),1,"polling resumes when the tab is visible again");
  }
  ok("R1 Transfer: the fast lane is capped at 3 minutes per waiting state and paused while the tab is hidden");
}

// ------------------------------------------------------------------ R1 + R4b Career Start
function careerStartHarness(states,{role="playerOne"}={}){
  const calls={reads:0,acks:0,transferOpen:0};let index=0;
  const dom=createDom(),clock=makeClock(),intervals=[];
  const setupState={ready:true,managerRole:role,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]}};
  const provider={read:async()=>{calls.reads+=1;const state=states[Math.min(index++,states.length-1)];return {ok:true,revision:state.revision,state,managerRole:role};},acknowledge:async()=>{calls.acks+=1;return {ok:false,code:"UNEXPECTED_WRITE"};}};
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date:clock.Date,document:dom.document,MutationObserver:class{observe(){}}};sandbox.globalThis=sandbox;
  sandbox.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};sandbox.clearInterval=()=>{};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>setupState,getState:()=>setupState};
  sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={};sandbox.CareerModeSparkSharedShowdownSetup={};sandbox.CareerModeSharedCareerStart={};
  sandbox.CareerModeSparkSharedCareerStart=provider;sandbox.CareerModeProductionSharedTransferChallenge={install(){},open:async()=>{calls.transferOpen+=1;return true;}};
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:ACCOUNT}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedCareerStart.js").replace(/^\(function\(root,factory\)\{[\s\S]*?\}\)\(typeof globalThis/,"(function(root,factory){root.CareerModeProductionSharedCareerStart=factory(root);})(typeof globalThis"),sandbox,{filename:"productionSharedCareerStart.js"});
  const api=sandbox.CareerModeProductionSharedCareerStart;
  const overlay=()=>dom.document.getElementById("productionSharedCareerStartOverlay");
  return {api,calls,dom,clock,intervals,overlay,fast:()=>intervals.find(item=>item.ms===FAST)};
}
async function r1r4CareerStartContracts(){
  const waiting={phase:"WAITING_FOR_ACKNOWLEDGEMENTS",revision:1,acknowledgedRoles:["playerOne"]};
  const none={phase:"WAITING_FOR_ACKNOWLEDGEMENTS",revision:0,acknowledgedRoles:[]};
  const rivalOnly={phase:"WAITING_FOR_ACKNOWLEDGEMENTS",revision:1,acknowledgedRoles:["playerTwo"]};
  const ready={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]};
  {
    const h=careerStartHarness([waiting,waiting,ready]);h.api.install();await h.api.openPanel();await settle();
    assert.equal(h.api.fastPollIntervalMs,FAST);assert.equal(h.api.fastPollWindowMs,WINDOW);assert.ok(h.fast(),"Career Start installs the 3 s fast lane");
    assert.equal(h.api.isWaitingForRival(),true,"after MY CAREER STARTED, Daniel waits on Nik");
    const before=h.calls.reads;h.fast().fn();await settle();
    assert.ok(h.calls.reads>before,"the fast lane re-reads Career Start while waiting");
    assert.equal(h.calls.acks,0,"the fast lane never acknowledges for a manager");
    if(h.calls.transferOpen===0){h.fast().fn();await settle();}
    assert.equal(h.calls.transferOpen,1,"R4b: once BOTH attested, Career Start opens the Transfer Challenge by itself");
    assert.equal(visible(h.overlay()),false,"R4b: Career Start closes after handing off");
    h.fast().fn();await settle();
    assert.equal(h.calls.transferOpen,1,"R4b: the hand-off happens exactly once");
  }
  ok("R1 Career Start: after this manager's attestation the rival's attestation arrives by the 3 s read (no REFRESH tap)");
  ok("R4b Career Start: CAREER_START_READY with Career Start open moves on to the Transfer Challenge once, with no acknowledge write");
  {
    const h=careerStartHarness([none]);h.api.install();await h.api.openPanel();await settle();
    assert.equal(h.api.isWaitingForRival(),false,"before attesting, it is this manager's own tap");
    const before=h.calls.reads;h.fast().fn();await settle();assert.equal(h.calls.reads,before,"no fast read before this manager attested");
    const r=careerStartHarness([rivalOnly]);r.api.install();await r.api.openPanel();await settle();
    assert.equal(r.calls.transferOpen,0,"a manager who has not attested is never moved on, even when the rival has");
    assert.ok(r.dom.body.button("I STARTED AT ARSENAL"),"the manager's own I STARTED AT tap is still required");
    assert.equal(r.calls.acks,0,"no acknowledgement is written on the manager's behalf");
  }
  ok("R4b Career Start: a manager who has not tapped I STARTED AT is never moved on and never acknowledged for");
}

// ------------------------------------------------------------------ R1 + R8 Season Results
function resultsHarness({ownPublished,ready}){
  const dom=createDom(),clock=makeClock(),intervals=[];
  const entry=dom.add("seasonEntry");const panel=dom.add("seasonReviewPanel",{parent:entry,className:"seasonReviewPanel"});
  const status=dom.add("seasonReviewStatusRow",{parent:panel,className:"seasonReviewStatus"});dom.add("seasonReviewStatusMeta",{tag:"strong",parent:status});
  for(const id of ["seasonReviewHeading","seasonReviewResult","seasonReviewOne","seasonReviewTwo","seasonReviewError","seasonEntryTitle"])dom.add(id,{parent:panel});
  dom.add("seasonReviewWarningNode",{tag:"p",parent:panel,className:"seasonReviewWarning"});
  const actions=dom.add("seasonReviewActionsRow",{parent:panel,className:"seasonEntryActions"});
  for(const id of ["confirmSeasonCompletion","editSeasonResults","completeSeason"])dom.add(id,{tag:"button",parent:actions});
  for(const p of ["p1","p2"])for(const s of ["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","TopScorer","TopAssist"])dom.add(`${p}${s}`,{tag:"input",parent:entry});
  const OWN={leaguePosition:1,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:true,topScorer:false,topAssist:false},RIVAL={...OWN,leaguePosition:2};
  const calls={reads:0,publishes:0,upstream:0};const server={ready};
  const provider={read:async()=>{calls.reads+=1;const isReady=server.ready;return {ok:true,authoritative:true,managerRole:"playerOne",seasonNumber:1,revision:isReady?2:1,state:{phase:isReady?"RESULTS_READY":"COLLECTING",revision:isReady?2:1},ownResult:ownPublished?OWN:null,opponentResult:isReady?RIVAL:null,allResults:isReady?{playerOne:OWN,playerTwo:RIVAL}:null};},publishResult:async()=>{calls.publishes+=1;return {ok:false,code:"UNEXPECTED_WRITE"};}};
  const sandbox={console,setTimeout,clearTimeout,Promise,Date:clock.Date,document:dom.document,crypto:webcrypto,
    __showdown:{id:"save_1",currentRound:1,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId:RIVALRY}},
    ensureGameplayModules:async()=>true,loadRuntimeScript:async key=>{throw new Error(`unexpected load ${key}`);},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>{calls.upstream+=1;return true;},getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE})},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>{calls.upstream+=1;return true;},getState:()=>({seasonNumber:1,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
    CareerModeSparkSharedSeasonResults:provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})}};
  sandbox.globalThis=sandbox;sandbox.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
  vm.createContext(sandbox);
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${read("js/productionSharedSeasonResults.js")}`,sandbox,{filename:"productionSharedSeasonResults.js"});
  return {api:sandbox.CareerModeProductionSharedSeasonResults,dom,calls,server,clock,intervals,fast:()=>intervals.find(item=>item.ms===FAST),node:id=>dom.document.getElementById(id)};
}
async function r1r8ResultsContracts(){
  {
    const h=resultsHarness({ownPublished:true,ready:false});h.api.install();await h.api.refresh();
    assert.equal(h.api.fastPollIntervalMs,FAST);assert.ok(h.fast(),"Season Results installs the 3 s fast lane");
    assert.equal(h.api.isWaitingForRival(),true,"published and waiting for the rival");
    assert.equal(h.node("seasonReviewHeading").textContent,"YOUR RESULT IS PUBLISHED");
    assert.equal(visible(h.node("seasonReviewWarningNode")),true,"the publishing warning still shows while waiting");
    h.server.ready=true;const before=h.calls.reads,upstream=h.calls.upstream;h.fast().fn();await settle();
    assert.equal(h.calls.reads,before+1,"the rival's publish is read by the fast lane");
    assert.equal(h.calls.upstream,upstream,"the fast read is light: one Season Results read, no Setup / Transfer re-read");
    assert.equal(h.node("seasonReviewHeading").textContent,"BOTH MANAGERS PUBLISHED","the screen advanced without a tap");
    assert.equal(h.api.isWaitingForRival(),false,"RESULTS_READY ends the waiting state");
    assert.equal(h.calls.publishes,0,"no publish is ever made by the poll");
    const unpublished=resultsHarness({ownPublished:false,ready:false});unpublished.api.install();await unpublished.api.refresh();
    assert.equal(unpublished.api.isWaitingForRival(),false,"before REVIEW + PUBLISH it is the manager's own turn");
  }
  ok("R1 Season Results: after PUBLISH the rival's result arrives by the 3 s read; REVIEW and PUBLISH stay manual");
  {
    const h=resultsHarness({ownPublished:true,ready:true});h.api.install();await h.api.refresh();
    assert.equal(h.node("seasonReviewHeading").textContent,"BOTH MANAGERS PUBLISHED","the heading still says both published");
    assert.equal(visible(h.node("seasonReviewWarningNode")),false,"R8: the pink RESULT PUBLICATION COMPLETE banner is hidden");
    assert.doesNotMatch(h.node("seasonReviewWarningNode").textContent,/RESULT PUBLICATION COMPLETE/,"R8: the duplicate banner text is gone");
    assert.equal(visible(h.node("seasonReviewStatusRow")),false,"R8: the RESULTS READY · BOTH PRIVATE SIDES REVEALED meta line is gone");
    assert.equal(h.node("seasonReviewResult").textContent,"Both managers published their FIFA 17 season results.","R8: the 'Continue with the Shared Season Commit below.' sentence is gone");
    assert.equal(visible(h.node("seasonReviewOne")),true);assert.equal(visible(h.node("seasonReviewTwo")),true,"both results are still revealed");
  }
  ok("R8 Season Results: once both published, the duplicate banner, meta line and sentence are gone; heading and both cards stay");
}

// ------------------------------------------------------------------ R1 Season Commit
function commitHarness({role,committed=false,ownAcknowledged=false,phase=null,allResults={playerOne:{leaguePosition:1},playerTwo:{leaguePosition:2}},ackFailures=[]}){
  const nodes=new Map(),handlers={},calls={reads:0,commit:0,acknowledge:0,guard:[],reports:[]},intervals=[],clock=makeClock();
  function node(id){
    if(!nodes.has(id)){
      const classes=new Set(["hidden"]);
      const n={id,textContent:"",disabled:false,attributes:{},className:"",type:"",parentNode:null,
        classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:(c,force)=>{const want=force===undefined?!classes.has(c):Boolean(force);if(want)classes.add(c);else classes.delete(c);return want;}},
        setAttribute(k,v){n.attributes[k]=String(v);},removeAttribute(k){delete n.attributes[k];},addEventListener(){},closest:()=>n,
        insertBefore(child){nodes.set(child.id,child);},prepend(child){nodes.set(child.id,child);},querySelector:()=>null};
      nodes.set(id,n);
    }
    return nodes.get(id);
  }
  const actions=node("actions");actions.parentNode=node("panelParent");
  const panel=node("seasonReviewPanel");panel.querySelector=selector=>selector===".seasonReviewActions"?actions:null;
  node("seasonEntry").classList.remove("hidden");
  const document={visibilityState:"visible",getElementById:id=>nodes.get(id)||(id==="seasonReviewPanel"||id==="seasonEntry"||id==="seasonReviewError"?node(id):null),
    createElement:()=>{const n=node(`created_${nodes.size}`);n.classList.add("hidden");return n;},addEventListener(type,fn){handlers[type]=fn;}};
  const created=new Proxy(document,{get(target,key){if(key==="createElement")return tag=>{const n=target.createElement(tag);let id="";Object.defineProperty(n,"id",{get:()=>id,set:value=>{id=value;nodes.set(value,n);},configurable:true});return n;};return target[key];}});
  const server={committed,ownAcknowledged,phase:phase||(committed?"COMMITTED":"RESULTS_READY"),revision:committed?3:2,ackFailures:[...ackFailures]};
  const provider={
    read:async()=>{calls.reads+=1;if(server.failRead)return {ok:false,code:"aborted"};return {ok:true,revision:server.revision,managerRole:role,coordinatorRole:"playerOne",committed:server.committed,phase:server.phase,ownAcknowledged:server.ownAcknowledged,seasonNumber:1};},
    commitSeason:async o=>{calls.commit+=1;if(o.baseRevision!==server.revision)return {ok:false,code:"SEASON_COMMIT_STALE_BASE_REVISION"};server.committed=true;server.phase="COMMITTED";server.revision+=1;return {ok:true};},
    acknowledgeSeason:async o=>{calls.acknowledge+=1;const failure=server.ackFailures.shift();if(failure==="stale"){server.revision+=1;return {ok:false,code:"SEASON_COMMIT_STALE_BASE_REVISION"};}if(failure)return {ok:false,code:failure};if(o.baseRevision!==server.revision)return {ok:false,code:"SEASON_COMMIT_STALE_BASE_REVISION"};server.ownAcknowledged=true;server.revision+=1;return {ok:true};}
  };
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date:clock.Date,document:created,Uint8Array};
  sandbox.globalThis=sandbox;sandbox.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
  sandbox.currentShowdown={id:"save_1",managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId:RIVALRY},currentRound:1};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>{calls.upstream=(calls.upstream||0)+1;return null;},getState:()=>({ready:true,managerRole:role,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne"}})};
  sandbox.CareerModeProductionSharedSeasonResults={refresh:async()=>{calls.upstream=(calls.upstream||0)+1;return null;},getState:()=>({state:{phase:"RESULTS_READY",revision:2},seasonNumber:1,rivalryId:RIVALRY,allResults})};
  for(const key of ["CareerModeSharedShowdownCatalog","CareerModeSharedShowdownSetup","CareerModeSharedSeasonResults","CareerModeSharedSeasonCommit"])sandbox[key]={};
  sandbox.CareerModeSparkSharedSeasonCommit=provider;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_1"}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(meta,run)=>{calls.guard.push({action:meta.action,operationId:meta.operationId,baseRevision:meta.baseRevision});return run();}};
  sandbox.reportApplicationError=(context,error)=>{calls.reports.push(String(error?.code||error?.message||context));};
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedSeasonCommit.js"),sandbox);
  return {api:sandbox.CareerModeProductionSharedSeasonCommit,calls,server,intervals,clock,fast:()=>intervals.find(item=>item.ms===FAST),action:()=>nodes.get("sharedSeasonCommitAction"),
    status:()=>nodes.get("sharedSeasonCommitStatus").textContent,error:()=>nodes.get("seasonReviewError")?.textContent||"",
    async tap(){await handlers.click({target:nodes.get("sharedSeasonCommitAction"),preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});await settle();}};
}
async function r1CommitContracts(){
  const cases=[
    {role:"playerTwo",committed:false,waiting:true,label:"Nik waits for Daniel's COMMIT"},
    {role:"playerOne",committed:false,waiting:false,label:"Daniel's own COMMIT tap is next"},
    {role:"playerTwo",committed:true,ownAcknowledged:false,waiting:false,label:"Nik's own ACKNOWLEDGE tap is next"},
    {role:"playerOne",committed:true,ownAcknowledged:true,waiting:true,label:"Daniel acknowledged and waits for Nik"}
  ];
  for(const c of cases){
    const h=commitHarness(c);h.api.install();await h.api.refresh();await settle();
    assert.equal(h.api.fastPollIntervalMs,FAST);assert.ok(h.fast(),"Season Commit installs the 3 s fast lane");
    assert.equal(h.api.isWaitingForRival(),c.waiting,c.label);
    const before=h.calls.reads,upstream=h.calls.upstream||0;h.fast().fn();await settle();
    assert.equal(h.calls.reads>before,c.waiting,`${c.label}: fast read only while waiting`);
    assert.equal(h.calls.upstream||0,upstream,`${c.label}: a fast read is light (no Setup / Results re-read)`);
    assert.equal(h.calls.commit+h.calls.acknowledge,0,`${c.label}: the poll never commits or acknowledges`);
  }
  {
    const h=commitHarness({role:"playerTwo",committed:false});h.api.install();await h.api.refresh();await settle();
    h.server.committed=true;h.server.phase="COMMITTED";h.fast().fn();await settle();
    assert.equal(h.action().textContent,"CONFIRM SEASON","Nik's ACKNOWLEDGE appears without a CHECK tap");
    assert.equal(h.calls.acknowledge,0,"and is still Nik's own tap");
    h.clock.now+=WINDOW+1;const k=commitHarness({role:"playerTwo",committed:false});k.api.install();await k.api.refresh();await settle();
    k.fast().fn();await settle();const r0=k.calls.reads;k.clock.now+=WINDOW+1;k.fast().fn();await settle();
    assert.equal(k.calls.reads,r0,"after 3 minutes the fast lane stops (normal 15 s poll remains)");
  }
  {
    const h=commitHarness({role:"playerTwo",committed:false});h.api.install();await h.api.refresh();await settle();
    h.server.failRead=true;
    h.fast().fn();await settle();
    assert.deepEqual(h.calls.reports,[],"a failed fast read is retried by the next poll, not reported");
    assert.equal(h.action().textContent,"WAITING FOR DANIEL","and keeps the current waiting view");
    h.intervals.find(item=>item.ms===15000).fn();await settle();
    assert.equal(h.action().textContent,"CHECK AGAIN","a failed normal poll still shows the failure at once");
    assert.equal(h.calls.reports.length,0,"a single failed read is not yet reported");
    h.intervals.find(item=>item.ms===15000).fn();await settle();
    assert.equal(h.calls.reports.length,1,"the same failure on the next poll is reported");
    h.server.failRead=false;h.intervals.find(item=>item.ms===15000).fn();await settle();
    assert.equal(h.action().textContent,"WAITING FOR DANIEL","a later successful read recovers the waiting view");
  }
  ok("R1 Season Commit: fast reads only while waiting for the coordinator's COMMIT or the rival's ACKNOWLEDGE; COMMIT and each ACKNOWLEDGE stay manual taps");
}


// ------------------------------------------------------------------ R7 Season Commit: Daniel's COMMIT also records his own ACKNOWLEDGE (owner decision 2026-10-04)
async function r7CommitContracts(){
  {
    const bothCup={playerOne:{leaguePosition:2,domesticCup:true},playerTwo:{leaguePosition:4,domesticCup:true}};
    const h=commitHarness({role:"playerOne",allResults:bothCup});h.api.install();await h.api.refresh();await settle();
    assert.equal(h.api.coordinatorCommitAlsoAcknowledges,true);
    assert.equal(h.action().textContent,"LOCK & CONFIRM SEASON","Daniel's one button says it commits and acknowledges");
    assert.match(h.status(),/^BOTH RESULTS ARE IN · LOCK THE SEASON/);
    assert.ok(!/CHECK RESULTS/.test(h.status()),"r80: both managers winning the cup in their own saves never shows CHECK RESULTS before Daniel taps");
    assert.equal(h.action().disabled,false,"both managers winning the cup never disables the combined button");
    assert.equal(h.calls.commit+h.calls.acknowledge,0,"nothing is written before Daniel taps");
    h.fast().fn();await settle();h.clock.now+=20000;h.fast().fn();await settle();
    assert.equal(h.calls.commit+h.calls.acknowledge,0,"no poll ever commits or acknowledges for Daniel");
    await h.tap();
    assert.equal(h.calls.commit,1,"one tap commits once");assert.equal(h.calls.acknowledge,1,"and records Daniel's own acknowledgement once");
    assert.deepEqual(h.calls.guard.map(g=>g.action),["commit-season","acknowledge-season"],"commit first, then acknowledge, each through the conflict guard");
    assert.notEqual(h.calls.guard[0].operationId,h.calls.guard[1].operationId,"each write keeps its own operationId");
    assert.equal(h.calls.guard[1].baseRevision,h.calls.guard[0].baseRevision+1,"the acknowledge is based on the committed revision");
    assert.equal(h.action().textContent,"CONFIRMED ✓ · WAITING FOR RIVAL","Daniel lands on the waiting state after his one tap");
    assert.equal(h.api.isWaitingForRival(),true,"and his fast lane waits for Nik's ACKNOWLEDGE");
    assert.equal(h.server.phase,"COMMITTED","scoring still waits for Nik's own acknowledgement");
  }
  ok("R7 Season Commit: Daniel's one COMMIT & ACKNOWLEDGE tap commits, then records his own acknowledgement (separate operationIds); both managers winning the cup shows no CHECK RESULTS");
  {
    const nik=commitHarness({role:"playerTwo",committed:true});nik.api.install();await nik.api.refresh();await settle();
    assert.equal(nik.action().textContent,"CONFIRM SEASON","Nik still sees his own ACKNOWLEDGE button");
    assert.equal(nik.calls.acknowledge,0,"Nik is never acknowledged for");
    await nik.tap();assert.equal(nik.calls.acknowledge,1,"Nik's own tap acknowledges");assert.equal(nik.calls.commit,0,"Nik never commits");
    const waiting=commitHarness({role:"playerTwo"});waiting.api.install();await waiting.api.refresh();await settle();
    assert.equal(waiting.action().textContent,"WAITING FOR DANIEL");assert.equal(waiting.action().disabled,true,"Nik cannot commit");
    // Only the coordinator's commit-then-acknowledge failure re-reads at once; Nik's own ACKNOWLEDGE failure keeps its error until
    // the next read, exactly as before (an immediate re-read would wipe "could not be recorded" before Nik sees it).
    assert.match(read("js/productionSharedSeasonCommit.js"),/if\(kind==="commit"&&stage==="acknowledge"\)void psscRefresh\(\)/,"only the R7 second half re-reads after a failure");
  }
  ok("R7 Season Commit: Nik still taps his own ACKNOWLEDGE (his failure keeps its error); the combined button exists only for the coordinator");
  {
    const h=commitHarness({role:"playerOne",ackFailures:["stale"]});h.api.install();await h.api.refresh();await settle();
    await h.tap();
    assert.equal(h.calls.commit,1);assert.equal(h.calls.acknowledge,2,"a stale acknowledge is retried once on the fresh revision");
    assert.equal(h.calls.guard[1].operationId,h.calls.guard[2].operationId,"the retry keeps the acknowledge operationId");
    assert.equal(h.action().textContent,"CONFIRMED ✓ · WAITING FOR RIVAL");assert.equal(h.error(),"");
  }
  ok("R7 Season Commit: the acknowledge half keeps the existing stale/race retry");
  {
    const h=commitHarness({role:"playerOne",ackFailures:["permission-denied"]});h.api.install();await h.api.refresh();await settle();
    await h.tap();await settle();
    assert.equal(h.calls.commit,1,"the commit landed");assert.equal(h.server.committed,true);assert.equal(h.server.ownAcknowledged,false,"the acknowledge half failed");
    assert.equal(h.action().textContent,"CONFIRM SEASON","a failed acknowledge half falls back to the CONFIRM SEASON button");
    assert.equal(h.action().disabled,false,"never a stuck state: the button is enabled");
    assert.match(h.error(),/confirmation could not be saved/,"the failure is explained");
    assert.equal(h.api.isWaitingForRival(),false,"Daniel is not shown as waiting");
    await h.tap();
    assert.equal(h.calls.commit,1,"the fallback tap never commits again");assert.equal(h.calls.acknowledge,2,"it acknowledges");
    assert.equal(h.action().textContent,"CONFIRMED ✓ · WAITING FOR RIVAL");
  }
  {
    const h=commitHarness({role:"playerOne",committed:true});h.api.install();await h.api.refresh();await settle();
    assert.equal(h.action().textContent,"CONFIRM SEASON","after a reload with the commit already made, Daniel sees ACKNOWLEDGE");
    await h.tap();assert.equal(h.calls.commit,0);assert.equal(h.calls.acknowledge,1);
  }
  ok("R7 Season Commit: if the acknowledge half fails after the commit, Daniel gets the existing CONFIRM SEASON button (never stuck, never a second commit)");
}

// ------------------------------------------------------------------ R1 Canonical Scoring + Shared History
async function r1ScoringHistoryContracts(){
  {
    const dom=createDom(),clock=makeClock(),intervals=[];
    const entry=dom.add("seasonEntry");const panel=dom.add("seasonReviewPanel",{parent:entry});dom.add("acts",{parent:panel,className:"seasonReviewActions"});dom.add("seasonReviewHeading",{parent:panel});
    const commit={committed:true,ownAcknowledged:true,phase:"COMMITTED",revision:2,seasonNumber:1,rivalryId:RIVALRY};
    let reads=0,upstream=0;
    const setup={ready:true,managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league"}};
    const sandbox={console,setTimeout,clearTimeout,Promise,Date:clock.Date,document:dom.document,crypto:webcrypto,MutationObserver:class{observe(){}disconnect(){}},
      currentShowdown:{id:"save_1",currentRound:1,managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId:RIVALRY}},
      ensureGameplayModules:async()=>true,
      CareerModeProductionSharedShowdownSetup:{refresh:async()=>{upstream+=1;return setup;},getState:()=>setup},
      CareerModeProductionSharedSeasonCommit:{refresh:async()=>{upstream+=1;return commit;},getState:()=>commit},
      CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},CareerModeSparkSharedSeasonCommit:{},CareerModeSharedCanonicalScoring:{},
      CareerModeSparkSharedCanonicalScoring:{read:async()=>{reads+=1;return {ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,seasonNumber:1,winner:"playerOne",scoring:{playerOne:{total:9},playerTwo:{total:3}}};}},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_1"}},firestore:{},firestoreSdk:{}})},
      addEventListener(){}};
    sandbox.globalThis=sandbox;sandbox.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
    vm.createContext(sandbox);vm.runInContext(read("js/productionSharedCanonicalScoring.js"),sandbox);
    const api=sandbox.CareerModeProductionSharedCanonicalScoring;api.install();await settle();
    const fast=intervals.find(item=>item.ms===FAST);assert.ok(fast,"Canonical Scoring installs the 3 s fast lane");
    assert.equal(api.isWaitingForRival(),true,"after this manager's ACKNOWLEDGE, scoring waits for the rival's");
    const before=reads;fast.fn();await settle();assert.equal(reads,before,"no scoring read until the commit is ACKNOWLEDGED by both (cheap wait)");
    Object.assign(commit,{phase:"ACKNOWLEDGED",revision:3});fast.fn();await settle();
    assert.equal(reads,before+1,"the canonical score is read as soon as both acknowledged");
    assert.equal(upstream,0,"the fast read is light: the ACKNOWLEDGED commit is immutable and is not re-read");
    assert.equal(api.isWaitingForRival(),false,"a reconciled score ends the waiting state");
    fast.fn();await settle();assert.equal(reads,before+1,"no further fast reads once reconciled");
    // CONTINUE TO SEASON N can move the cursor while a 15 s scoring read is in flight; that overtaken read is not an error.
    const slow=intervals.find(item=>item.ms===15000);
    slow.fn();await settle();assert.equal(reads,before+1,"a reconciled score is immutable: the 15 s poll stops re-reading it");
    assert.equal(upstream,0,"and does not re-read Setup or the Season Commit either");
    const reports=[];sandbox.reportApplicationError=(context,error)=>reports.push(`${context}: ${error?.code||error?.message}`);
    sandbox.currentShowdown.currentRound=2;Object.assign(commit,{seasonNumber:2});
    sandbox.CareerModeProductionSharedSeasonCommit.refresh=async()=>{sandbox.currentShowdown.currentRound=3;const error=new Error("stale");error.code="SEASON_RESULTS_CONTEXT_STALE";throw error;};
    slow.fn();await settle();
    assert.deepEqual(reports,[],"a read overtaken by the season cursor is not reported as an error");
    sandbox.CareerModeProductionSharedSeasonCommit.refresh=async()=>{const error=new Error("down");error.code="permission-denied";throw error;};
    Object.assign(commit,{seasonNumber:3});slow.fn();await settle();
    assert.equal(reports.length,1,"a real read failure in the current season is still reported");
    sandbox.CareerModeSparkSharedCanonicalScoring.read=async()=>({ok:false,code:"aborted"});
    fast.fn();await settle();
    assert.equal(reports.length,1,"a failed fast (3 s) scoring read is retried by the next poll, not reported");
  }
  ok("R1 Canonical Scoring: after both ACKNOWLEDGE the score appears by the 3 s read, then both lanes stop re-reading the immutable score; a read overtaken by CONTINUE TO SEASON N is not an error");
  {
    const history=read("js/productionSharedHistoryConvergence.js");
    assert.match(history,/const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;/,"Shared History fast lane is 3 s for at most 3 minutes");
    assert.match(history,/function phcWaitingKey\(\)\{const request=phcRequest\(\);if\(!request\|\|!phcSharedMarker\(\)\|\|!phcCachedTerminal\(request\)\)return "";if\(contextKey===request\.key&&view&&view\.phase==="HISTORY_CONVERGED"\)return "";/,"Shared History only fast-polls after the score is reconciled and until history converges");
    assert.match(history,/function phcFastWake\(\)\{if\(root\.document\?\.visibilityState==="hidden"\|\|busy\|\|!phcFastPollDue\(\)\)return;phcWake\(true\);\}/,"Shared History fast lane is paused when hidden and only wakes the read-only refresh");
    assert.match(history,/if\(light!==true\)\{\s*await setupApi\.refresh\(\);[\s\S]*?await scoringApi\.refresh\(\);[^\n]*\n\s*\}/,"the fast history read is light: the immutable commit and reconciled score are not re-read");
    assert.match(history,/root\.setInterval\(phcWake,POLL_MS\);root\.setInterval\(phcFastWake,FAST_POLL_MS\);/,"the 15 s poll stays and the 3 s lane is added");
    assert.match(history,/providerWriteRequired:false/,"Shared History stays read-only");
    assert.match(history,/if\(request&&contextKey===request\.key&&view\?\.phase==="HISTORY_CONVERGED"\)\{phcRender\(\);return;\}void phcRefresh/,"converged history is final: the poll stops re-reading it until the season changes");
  }
  ok("R1 Shared History: 3 s read-only lane only between reconciled score and converged history, paused when hidden");
}

// ------------------------------------------------------------------ R1 persistent pair (Daniel's CHECK STATUS)
function envelope(objectType,objectId,data,revision=1){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision-1,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,data};}
function pairHarness(){
  const dom=createDom();const menu=dom.add("mainMenu");const shell=dom.add("menuShell",{parent:menu,className:"fifaMenuShell"});void shell;
  const connect=dom.add("connectPlayersScreen");dom.add("connectPlayersPairSlot",{parent:connect});
  const timers=makeTimers(),clock=makeClock();
  const rivalry=envelope("rivalry",RIVALRY,{connectionState:"pending-pair",managerSlots:[{accountId:"uid_daniel",slotId:"playerOne",saveId:`save_${"a".repeat(24)}`,profileId:`profile_${"b".repeat(24)}`}]});
  const docs={"accounts/uid_daniel/pairLinks/current":envelope("pairLink","current",{managerRole:"playerOne",managerId:"daniel",rivalryId:RIVALRY}),[`rivalries/${RIVALRY}`]:rivalry};
  const io={gets:0,writes:0};
  const transaction={get:async ref=>{io.gets+=1;const value=docs[ref.path];return {exists:()=>Boolean(value),data:()=>clone(value)};},set:()=>{io.writes+=1;},update:()=>{io.writes+=1;},delete:()=>{io.writes+=1;}};
  const firestoreSdk={doc:(_db,...parts)=>({path:parts.join("/")}),runTransaction:async(_db,fn)=>fn(transaction),getDoc:async ref=>transaction.get(ref),setDoc:async()=>{io.writes+=1;},updateDoc:async()=>{io.writes+=1;}};
  const sandbox={console,TextEncoder,Date:clock.Date,document:dom.document,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,crypto:webcrypto,
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"daniel"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_daniel"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:DEVICE}),localBindingOptions:()=>[]},
    CareerModeCareerStartMarker:{readCurrentMarker:async()=>({status:"none"})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk})},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:null,saves:[]})}};
  vm.createContext(sandbox);vm.runInContext(read("js/persistentNikDanielPair.js"),sandbox,{filename:"js/persistentNikDanielPair.js"});
  return {pair:sandbox.CareerModePersistentNikDanielPair,dom,timers,clock,io,docs,rivalry,panel:()=>dom.document.getElementById("persistentNikDanielPairPanel")};
}
async function r1PairContracts(){
  const h=pairHarness();
  const first=await h.pair.initialize({force:true});
  assert.equal(first.connectionState,"pending-pair","fixture: Daniel's code is waiting for Nik");
  assert.ok(h.panel().button("CHECK STATUS"),"CHECK STATUS stays as a manual fallback");
  assert.equal(h.pair.isWaitingForRival(),true,"Daniel is waiting for Nik to join");
  assert.deepEqual({...h.pair.waitingPoll},{fastMs:4000,slowMs:15000,windowMs:WINDOW},"pair waiting poll: 4 s for 3 minutes, then 15 s");
  let pending=h.timers.pending();assert.equal(pending.length,1,"one waiting-poll timer is armed");assert.equal(pending[0].ms,4000,"the first re-read is due after 4 s");
  const codeNode=h.panel().querySelector("code");
  const gets=h.io.gets;await h.timers.fire(pending[0]);
  assert.ok(h.io.gets>gets,"the timer re-reads the pair link");assert.equal(h.io.writes,0,"the timer never writes");
  assert.equal(h.panel().querySelector("code"),codeNode,"an unchanged pair link does not re-render Daniel's code panel");
  h.clock.now+=WINDOW+1;pending=h.timers.pending();assert.equal(pending.length,1);await h.timers.fire(pending[0]);
  pending=h.timers.pending();assert.equal(pending[0].ms,15000,"after 3 minutes the pair panel falls back to a 15 s read");
  h.dom.document.visibilityState="hidden";const hiddenGets=h.io.gets;await h.timers.fire(pending[0]);
  assert.equal(h.io.gets,hiddenGets,"a hidden tab does not read");h.dom.document.visibilityState="visible";
  h.docs[`rivalries/${RIVALRY}`]={...h.rivalry,revision:2,data:{...h.rivalry.data,connectionState:"active"}};
  pending=h.timers.pending();await h.timers.fire(pending[0]);
  assert.equal(h.pair.getState().connectionState,"active","Nik's join is picked up without a CHECK STATUS tap");
  assert.equal(h.pair.isWaitingForRival(),false);assert.equal(h.timers.pending().length,0,"the waiting poll stops once the pair is active");
  assert.equal(h.io.writes,0,"still no write");
  ok("R1 Pair: Daniel's waiting code panel re-reads every 4 s (15 s after 3 min), read-only, paused when hidden, stops when Nik joins");
}

// R1 Remote Joining host: job 31 (PR #350, srjWatchForJoin in js/sparkRemoteJoining.js) already re-reads the host's open session
// every 4 s and is covered by tests/contracts/ten-season-session-contracts.cjs, so job 33 does not add a second watcher.
function r1RemoteContracts(){
  const remote=read("js/sparkRemoteJoining.js");
  assert.match(remote,/function srjWatchForJoin\(/,"the host watch from job 31 is present");
  assert.doesNotMatch(remote,/srjWaitingPoll|hostWaitingPoll/,"job 33 adds no duplicate host poll");
}

// ------------------------------------------------------------------ R2 Multi Season continue
async function r2MultiSeasonContracts(){
  const dom=createDom();
  const entry=dom.add("seasonEntry");const review=dom.add("seasonReviewPanel",{parent:entry});dom.add("acts",{parent:review,className:"seasonReviewActions"});dom.add("sharedHistoryConvergencePanel",{parent:review});dom.add("dashboard",{hidden:true});
  const navigate=[],transfer={opens:0,installs:0,starts:0};
  const setup={ready:true,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,accountId:"uid_daniel",managerRole:"playerOne",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",totalSeasons:3,clubs:{playerOne:"A",playerTwo:"B"}}};
  const history={authoritative:true,phase:"HISTORY_CONVERGED",throughSeason:1,projection:{acceptedSeasons:1}};
  const sandbox={console,setTimeout,clearTimeout,Promise,Date,document:dom.document,MutationObserver:class{observe(){}disconnect(){}},
    currentShowdown:{id:"save_1",currentRound:1,sharedJourney:{mode:"shared",setupPending:true}},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},dispatchEvent:()=>true,addEventListener(){},
    ensureGameplayModules:async()=>true,
    navigateTo:async name=>{navigate.push(name);return true;},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>history,getState:()=>history},
    CareerModeSharedMultiSeasonProgression:{},
    CareerModeSparkSharedMultiSeasonProgression:{read:async()=>({ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId:RIVALRY,phase:"SEASON_READY",state:{runtimeRevision:"1.9.1-r13",rivalryId:RIVALRY,acceptedSeasons:1,totalSeasons:3,terminal:false},dashboard:null})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})},
    CareerModeProductionSharedTransferChallenge:{install(){transfer.installs+=1;},open:async()=>{transfer.opens+=1;navigate.push("transferChallenge");return true;},startWindow:()=>{transfer.starts+=1;}}};
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedMultiSeasonProgression.js"),sandbox);
  const api=sandbox.CareerModeProductionSharedMultiSeasonProgression;
  await api.refresh();
  assert.equal(api.canContinue(),true,"fixture: season 1 accepted and its history witnessed");
  const advanced=await api.continueToNextSeason();
  assert.equal(advanced,true,"CONTINUE TO SEASON 2 still advances the cursor exactly once");
  assert.equal(api.resolveSeason(1),2,"the cursor moved to season 2");
  assert.deepEqual(navigate,["dashboard","transferChallenge"],"R2: the dashboard is shown and the season-2 Transfer Challenge opens without a dashboard tap");
  assert.equal(transfer.opens,1,"the Transfer Challenge is opened once");assert.equal(transfer.starts,0,"opening never starts the 15-minute window");
  assert.equal(await api.continueToNextSeason(),false,"a second CONTINUE cannot skip another season (history witness gate)");
  // A failed open leaves the manager on the dashboard with its button.
  sandbox.CareerModeProductionSharedTransferChallenge.open=async()=>{throw new Error("offline");};
  ok("R2 Multi Season: CONTINUE TO SEASON N moves the cursor once, then opens the new Transfer Challenge (no START SEASON N tap, no window start)");
  const source=read("js/productionSharedMultiSeasonProgression.js");
  assert.match(source,/try\{const transfer=root\.CareerModeProductionSharedTransferChallenge;if\(transfer&&typeof transfer\.open==="function"\)\{if\(typeof transfer\.install==="function"\)transfer\.install\(\);await transfer\.open\(\);\}\}catch\(_error\)\{\}\s*return true;/,"a failed open keeps the dashboard (its START SEASON button stays the fallback)");
  assert.doesNotMatch(source.match(/async function pmspResumeFromAuthority\(\)\{[\s\S]*?\n  \}/)[0],/CareerModeProductionSharedTransferChallenge/,"reload resume still lands on the dashboard and keeps its button");
  ok("R2 Multi Season: a failed open stays on the dashboard; reload resume keeps the dashboard button");
}

// ------------------------------------------------------------------ R3 + R4a Shared Setup presentation
function presentationHarness({role="playerTwo",setup=null,mutate=null}={}){
  const dom=createDom(),timers=makeTimers();
  const screens={};for(const id of ["mainMenu","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge"]){screens[id]=dom.add(id,{hidden:id!=="mainMenu",className:"screen"});}
  const wheel=dom.add("leagueWheel",{parent:screens.leagueWheelScreen});dom.add("track",{parent:wheel,className:"wheelTrack"});
  for(const id of ["selectedLeague","leagueStateNote"])dom.add(id,{parent:screens.leagueWheelScreen});
  dom.add("spinLeague",{tag:"button",parent:screens.leagueWheelScreen});
  for(const id of ["clubAssignmentLeague","clubPlayerOne","clubPlayerTwo","clubPackStatus","clubCardOne","clubCardTwo","clubNameOne","clubNameTwo","clubCardStateOne","clubCardStateTwo","clubConfirmationShowdown","clubConfirmationMeta","clubConfirmationManagerOne","clubConfirmationManagerTwo","clubConfirmationClubOne","clubConfirmationClubTwo"])dom.add(id,{parent:screens.clubWheelScreen});
  dom.add("clubRivalryConfirmation",{parent:screens.clubWheelScreen,hidden:true});
  for(const id of ["openClubPack","continueClubAssignment","clubAssignmentBack"])dom.add(id,{tag:"button",parent:screens.clubWheelScreen});
  const listeners=new Set(),calls={mutations:[],careerStart:0};
  let current={ready:true,remoteRole:role==="playerOne"?"host":"peer",managerRole:role,rivalryId:RIVALRY,setup};
  const setupApi={refresh:async()=>current,getState:()=>current,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},mutate:async (type,extra)=>{calls.mutations.push(type);if(mutate)return mutate(type,extra,{get:()=>current,set:next=>{current=next;}});return {ok:false,code:"UNEXPECTED_WRITE"};}};
  const sandbox={console,Promise,Date,document:dom.document,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,setInterval:timers.setInterval,clearInterval:timers.clearInterval,
    currentShowdown:{id:"save_1",totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",setupPending:true}},
    ensureGameplayModules:async()=>true,isReducedClubMotionPreferred:()=>true,getLeagueById:id=>({id,name:"Premier League"}),
    CareerModeProductionSharedJourneyEntry:{isPending:()=>true},
    CareerModeProductionSharedShowdownSetup:setupApi,
    CareerModeProductionSharedCareerStart:{install(){},openPanel:async()=>{calls.careerStart+=1;return true;}}};
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedShowdownPresentation.js"),sandbox,{filename:"productionSharedShowdownPresentation.js"});
  const api=sandbox.CareerModeProductionSharedShowdownPresentation;
  async function push(nextSetup,patch={}){current={...current,...patch,setup:nextSetup};for(const fn of listeners)fn(current);await settle();}
  return {api,dom,timers,calls,screens,push,node:id=>dom.document.getElementById(id)};
}
const leagueSetup={phase:"LEAGUE_WHEEL_COMMITTED",revision:2,coordinatorRole:"playerOne",leagueId:"premier_league",confirmedRoles:[]};
const lengthSetup=(roles)=>({phase:"SEASON_LENGTH_COMMITTED",revision:roles.length?5:4,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons:3,confirmedRoles:roles});
// r79 gallery (fix 1): js/productionSharedShowdownSetup.js answers a write that landed with its own ready state (status "ready",
// errorCode "", no "ok"), exactly as the emulator run showed. One SPIN tap by Daniel (open + commit-league) must not leave
// "THAT TAP DID NOT GO THROUGH · Both managers now have the same setup." on his club packs; a refused write still does.
async function galleryFix1SpinContracts(){
  const landed=(type,_extra,store)=>{const cur=store.get();const setup=type==="open"?{phase:"SHARED_SETUP_OPEN",revision:1,coordinatorRole:"playerOne",confirmedRoles:[]}:type==="commit-league"?{...cur.setup,phase:"LEAGUE_WHEEL_COMMITTED",revision:2,leagueId:"premier_league"}:cur.setup;const next={...cur,setup,status:"ready",busy:false,errorCode:"",message:"Both managers now have the same setup."};store.set(next);return next;};
  {
    const h=presentationHarness({role:"playerOne",setup:null,mutate:landed});await h.api.activate();await settle();
    await h.api.handleControlClick("spinLeague");await settle();
    assert.deepEqual(h.calls.mutations,["open","commit-league"],"one SPIN tap opens the setup and commits the league, once each");
    const status=h.node("sharedShowdownPresentationStatus");
    assert.doesNotMatch(status.textContent,/DID NOT GO THROUGH/,"a landed SPIN shows no failure strip");
    assert.equal(status.getAttribute("data-failure-code"),null,"no failure code on a landed SPIN");
  }
  {
    const h=presentationHarness({role:"playerOne",setup:null,mutate:async()=>({ok:false,code:"SHARED_SETUP_TRANSIENT_WRITE_FAILURE"})});await h.api.activate();await settle();
    await h.api.handleControlClick("spinLeague");await settle();
    assert.match(h.node("sharedShowdownPresentationStatus").textContent,/THAT TAP DID NOT GO THROUGH/,"a refused write still says so");
  }
  ok("Gallery fix 1: a landed Shared Setup write (ready state, no ok) is a success; only a refused write shows THAT TAP DID NOT GO THROUGH");
}
async function r3r4aPresentationContracts(){
  {
    const h=presentationHarness({role:"playerTwo",setup:{phase:"SHARED_SETUP_OPEN",revision:1,coordinatorRole:"playerOne",confirmedRoles:[]}});
    await h.api.activate();await settle();
    assert.equal(visible(h.screens.leagueWheelScreen),true,"Nik waits on the league wheel");
    assert.match(h.node("spinLeague").textContent,/WAITING FOR DANIEL/,"Nik still cannot spin");
    await h.push(leagueSetup);
    assert.equal(h.node("selectedLeague").textContent,"SPINNING…","wheel polish: the league name stays hidden while the wheel turns");
    assert.equal(h.node("spinLeague").disabled,true,"wheel polish: Continue is not offered mid-spin");
    await h.timers.fire(h.timers.pending().find(t=>t.ms===4120));await settle();
    assert.equal(h.node("selectedLeague").textContent,"Premier League","Nik sees the authoritative league reveal once the wheel stops");
    assert.equal(visible(h.screens.leagueWheelScreen),true,"the league stays on screen while the wheel animates");
    const forward=h.timers.pending().find(t=>t.ms===6700);assert.ok(forward,"an auto-forward is scheduled after the 4.1 s wheel and the 2.6 s reveal hold");
    await h.timers.fire(forward);
    assert.equal(visible(h.screens.clubWheelScreen),true,"R3: Nik is on the club packs without a CONTINUE TO CLUB PACKS tap");
    assert.equal(visible(h.screens.leagueWheelScreen),false);
    assert.equal(h.api.getState().leagueWitnessed,"premier_league","both managers still count as having witnessed the league");
    assert.match(h.node("openClubPack").textContent,/WAITING FOR DANIEL TO OPEN THE PACKS/,"Nik still cannot open the packs");
    assert.deepEqual(h.calls.mutations,[],"the auto-forward is presentation only (no write, no reroll)");
  }
  {
    const h=presentationHarness({role:"playerOne",setup:leagueSetup});await h.api.activate();await settle();
    h.api.handleControlClick("spinLeague");await settle();
    assert.equal(visible(h.screens.clubWheelScreen),true,"the CONTINUE TO CLUB PACKS button still works as a fallback");
    const forward=h.timers.pending().find(t=>t.ms===6700);await h.timers.fire(forward);
    assert.equal(visible(h.screens.clubWheelScreen),true,"a late auto-forward after a manual tap is a no-op");
    assert.match(h.node("openClubPack").textContent,/OPEN CLUB PACKS/,"OPEN CLUB PACKS stays Daniel's own host tap");
    assert.deepEqual(h.calls.mutations,[],"no draw was made for the host");
  }
  {
    // Codex P1 on #358: a hidden tab never moves on to (and starts) the pack reveals; the forward waits until the manager is back.
    const h=presentationHarness({role:"playerTwo",setup:{phase:"SHARED_SETUP_OPEN",revision:1,coordinatorRole:"playerOne",confirmedRoles:[]}});
    await h.api.activate();await settle();await h.push(leagueSetup);
    h.dom.document.visibilityState="hidden";
    await h.timers.fire(h.timers.pending().find(t=>t.ms===6700));
    assert.equal(visible(h.screens.leagueWheelScreen),true,"R3 hidden: the league reveal stays on screen while the tab is hidden");
    assert.equal(visible(h.screens.clubWheelScreen),false,"R3 hidden: the club packs do not open in a hidden tab");
    assert.equal(h.timers.pending().some(t=>t.ms===6700),false,"no forward is rescheduled while hidden");
    const waiters=h.dom.listeners.filter(l=>l.type==="visibilitychange");assert.ok(waiters.length>=1,"the forward waits for visibilitychange");
    for(const l of waiters)l.fn();await settle();
    assert.equal(visible(h.screens.leagueWheelScreen),true,"R3 hidden: still hidden, so nothing moves");
    h.dom.document.visibilityState="visible";for(const l of h.dom.listeners.filter(l=>l.type==="visibilitychange"))l.fn();await settle();
    assert.equal(visible(h.screens.leagueWheelScreen),true,"R3 back: the revealed league is shown again before moving on");
    const again=h.timers.pending().find(t=>t.ms===2600);assert.ok(again,"R3 back: the full 2.6 s reveal hold starts once visible");
    await h.timers.fire(again);
    assert.equal(visible(h.screens.clubWheelScreen),true,"R3 back: then the club packs open");
    assert.deepEqual(h.calls.mutations,[],"still presentation only");
  }
  ok("R3 Presentation: the league reveal moves both devices to the club packs after the wheel (never while the tab is hidden); host-only draws stay manual taps");
  {
    const h=presentationHarness({role:"playerOne",setup:lengthSetup([])});await h.api.activate();await settle();
    h.dom.document.getElementById("clubWheelScreen");await h.push(lengthSetup([]));
    // Witness the league, then the club screen.
    const forward=h.timers.pending().find(t=>t.ms===6700);if(forward)await h.timers.fire(forward);
    await h.push(lengthSetup(["playerOne"]));
    assert.equal(h.node("continueClubAssignment").textContent,"CONFIRMED · WAITING FOR RIVAL","Daniel confirmed first and waits");
    assert.equal(h.calls.careerStart,0,"Career Start does not open before the rival confirms");
    await h.push({...lengthSetup(["playerOne","playerTwo"]),phase:"SHOWDOWN_CONFIRMED",revision:6});
    assert.equal(h.calls.careerStart,1,"R4a: the first confirmer's Career Start opens by itself once the rival confirms");
    await h.push({...lengthSetup(["playerOne","playerTwo"]),phase:"SHOWDOWN_CONFIRMED",revision:6});
    assert.equal(h.calls.careerStart,1,"it opens exactly once");
    assert.deepEqual(h.calls.mutations,[],"no confirm was written for anyone");
  }
  {
    const h=presentationHarness({role:"playerTwo",setup:lengthSetup([])});await h.api.activate();await settle();
    const forward=h.timers.pending().find(t=>t.ms===6700);if(forward)await h.timers.fire(forward);
    await h.push(lengthSetup(["playerOne"]));
    assert.equal(h.node("continueClubAssignment").textContent,"CONFIRM SHOWDOWN","Nik's own CONFIRM SHOWDOWN tap is still required");
    assert.equal(h.calls.careerStart,0,"a manager who has not confirmed is never moved on");
  }
  ok("R4a Presentation: the first confirmer opens Career Start by itself once both confirmed; CONFIRM SHOWDOWN stays each manager's tap");
}

// ------------------------------------------------------------------ R5 + R6 career entry
const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
// Codex #904 (P1): the Connect Players layer on a cold cache. Its script, stylesheet and plate take a while (40 ms here); once
// prepare() has run them, open() reveals the layer without waiting for any of them again (as js/connectPlayersScreenV10.js).
function coldConnectPlayersLayer(calls){
  const slow=()=>new Promise(resolve=>setTimeout(resolve,40));
  return {
    prepare:async()=>{calls.prepareCalls=(calls.prepareCalls||0)+1;await slow();calls.layerPrepared=true;return true;},
    open:async options=>{if(calls.layerPrepared!==true){await slow();calls.layerPrepared=true;}calls.layerOpen.push(options);calls.layerVisible=true;return true;},
    close:()=>{calls.layerVisible=false;return true;}
  };
}
function entryHarness({rivalryReady=false,active=false,pairState={status:"unpaired",initialized:true,rivalryId:null,connectionState:null},openExperience="presentation",library:startLibrary=null,terminalClose=null,identityStatus="ready",continueResult=null,coldLayer=false}={}){
  const dom=createDom();const menu=dom.add("mainMenu");void menu;const connect=dom.add("connectPlayersScreen");dom.add("connectPlayersPairSlot",{parent:connect});dom.add("roundAmount",{tag:"select"}).value="3";dom.add("startShowdown",{tag:"button"});
  const calls={pairRender:0,startPairing:0,remoteOpen:0,remoteClose:0,presentation:0,careerStart:0,navigate:[],host:0,join:0,create:0,layerOpen:[],screenAtOpen:[],resume:0,continuePair:0,openJoin:0,closeRefresh:0,close:0,closeRetry:0};
  const storage=new Map([[PENDING_KEY,"1"]]);
  const remoteListeners=new Set();
  const remoteState={sessionState:active?"active":null,sessionId:active?SESSION:null,pendingAction:null,rivalryId:RIVALRY,accountId:"uid_daniel",deviceId:DEVICE,expiresAtEpochMs:Date.now()+3_600_000};
  const library=startLibrary||{activeSaveId:null,saves:[]};
  // r79 (Nik, 2026-10-17): the final-screen terminal close, as START reaches it for an ended-but-not-closed Showdown.
  let closeState=terminalClose?{phase:String(terminalClose).replace(/-FAIL$/,""),rivalryId:RIVALRY}:null;
  const closeApi=terminalClose?{install(){},getState:()=>closeState,refresh:async()=>{calls.closeRefresh+=1;return closeState;},
    close:async()=>{calls.close+=1;await new Promise(resolve=>setTimeout(resolve,2));if(terminalClose==="READY"){closeState={phase:"CLOSED",rivalryId:RIVALRY};return{ok:true};}return{ok:false,code:"TERMINAL_CLOSE_FAILED",message:"The Showdown could not be closed. Nothing was changed."};},
    retry:async()=>{calls.closeRetry+=1;closeState={phase:"CLOSED",rivalryId:RIVALRY};return{ok:true};}}:undefined;
  const sandbox={CareerModeProductionSharedTerminalClose:closeApi,console,setTimeout,clearTimeout,Promise,Date,document:dom.document,MutationObserver:class{observe(){}disconnect(){}},
    sessionStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
    loadRuntimeStyle:async()=>true,loadRuntimeScript:async key=>{throw new Error(`unexpected load ${key}`);},
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    // as in screens.js: the wheel is not a valid route before a showdown is loaded, so it falls back to Home
    navigateTo:async name=>{calls.navigate.push(name==="leagueWheelScreen"&&!sandbox.currentShowdown?"mainMenu":name);return true;},
    loadSavedShowdown:()=>{const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);return entry?entry.showdown:null;},
    resumeSavedShowdown:async()=>{calls.resume+=1;const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);sandbox.currentShowdown=entry.showdown;calls.navigate.push("leagueWheelScreen");},
    createShowdown:async()=>{calls.create+=1;await new Promise(resolve=>setTimeout(resolve,2));sandbox.currentShowdown={id:"save_1",totalRounds:3,managers:{}};library.activeSaveId="save_1";library.saves=[{saveId:"save_1",showdown:sandbox.currentShowdown}];
      // as js/showdown.js: the locked league wheel is shown synchronously, at the end of createShowdown(). The next task is the
      // first chance the browser has to paint it; WAITING must already cover it by then.
      if(coldLayer){calls.wheelShown=true;calls.preparedAtRoute=calls.layerPrepared===true;setImmediate(()=>{calls.coveredAtFirstPaint=calls.layerVisible===true;});}
      return true;},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>library,saveCurrentShowdown:()=>true,clearActiveShowdown(){}},
    CareerModeOnlinePlayerIdentity:{getState:()=>(identityStatus==="ready"?{status:"ready",managerId:"daniel",registered:true}:{status:identityStatus}),subscribe:()=>()=>{},syncPair:async()=>pairState,openJoin:async()=>{calls.openJoin+=1;return pairState;}},
    CareerModeConnectPlayersScreenV10:coldLayer?coldConnectPlayersLayer(calls):{open:async options=>{calls.layerOpen.push(options);calls.screenAtOpen.push(calls.navigate[calls.navigate.length-1]||"mainMenu");return true;},close:()=>true},
    CareerModePersistentNikDanielPair:{getState:()=>continueResult||pairState,render:()=>{calls.pairRender+=1;if(!dom.document.getElementById("persistentNikDanielPairPanel"))dom.add("persistentNikDanielPairPanel",{parent:dom.document.getElementById("connectPlayersPairSlot")});},startPairing:async()=>{calls.startPairing+=1;},continuePair:async()=>{calls.continuePair+=1;return continueResult||{...(pairState||{}),status:"paired",busy:false};}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true})},
    CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:"uid_daniel"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:rivalryReady,rivalryId:rivalryReady?RIVALRY:null})},
    CareerModeSparkRemoteJoining:{getState:()=>remoteState,openPanel:async()=>{calls.remoteOpen+=1;return true;},closePanel:()=>{calls.remoteClose+=1;},subscribe:fn=>{remoteListeners.add(fn);return()=>remoteListeners.delete(fn);},hostSession:async()=>{calls.host+=1;},joinSession:async()=>{calls.join+=1;}},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>null,getState:()=>({ready:true,setup:{phase:"SHARED_SETUP_OPEN",revision:1}})},
    CareerModeProductionSharedShowdownPresentation:{activate:async()=>{calls.presentation+=1;if(openExperience==="fail")throw new Error("setup not ready");return true;},isPresentationActive:()=>false},
    reportApplicationError(){}};
  sandbox.currentShowdown=null;
  vm.createContext(sandbox);vm.runInContext(read("js/whichShowdownIsLive.js"),sandbox,{filename:"whichShowdownIsLive.js"});vm.runInContext(read("js/productionSharedJourneyEntry.js"),sandbox,{filename:"productionSharedJourneyEntry.js"});
  const api=sandbox.CareerModeProductionSharedJourneyEntry;
  const overlay=()=>dom.document.getElementById("productionSharedJourneyEntryOverlay");
  async function goActive(expired=false){Object.assign(remoteState,{sessionState:"active",sessionId:SESSION,expiresAtEpochMs:expired?Date.now()-1000:Date.now()+3_600_000});for(const fn of remoteListeners)fn(remoteState);await settle();}
  return {api,dom,calls,overlay,goActive,remoteState,remoteListeners};
}
// Codex #904 (P1): js/ssjr.js itself, run with a pending pre-pair shell and an entry whose reload recovery is still waiting
// (for example the identity restoring for longer than 3 s). The loading screen (careerModeHomeHold) must stay until that
// recovery settles, and only js/app.js's overall cap (15 s from the start of the load) may cut it short.
async function startupHoldContracts(){
  const run=({nowMs=2000}={})=>{
    const timers=[];let release=null;const resume=new Promise(resolve=>{release=resolve;});
    const shell={identity:{saveId:"save_"+"5".repeat(24)},sharedJourney:{mode:"shared",setupPending:true},selectedLeague:null,clubs:{},rounds:[]};
    const sandbox={console:{warn(){},log(){},error(){}},Promise,URLSearchParams,location:{search:""},document:{getElementById:()=>null},
      performance:{now:()=>nowMs},setTimeout:(fn,ms)=>{timers.push({fn,ms:Number(ms)||0,fired:false});return timers.length;},clearTimeout(){},
      readStorageValue:()=>null,currentShowdown:shell,
      loadRuntimeScript:async(key)=>{if(key==="ssjr-production-entry")sandbox.CareerModeProductionSharedJourneyEntry={install(){},startupResume:()=>resume};return true;}};
    vm.createContext(sandbox);vm.runInContext(read("js/ssjr.js"),sandbox,{filename:"js/ssjr.js"});
    const fire=async limit=>{for(let pass=0;pass<4;pass+=1){for(const t of timers)if(!t.fired&&t.ms<=limit){t.fired=true;t.fn();}await settle();}};
    return {sandbox,timers,release,fire,hold:()=>sandbox.careerModeHomeHold};
  };
  {const h=run();await settle();
   assert.equal(h.hold(),1,"the loading screen is held while the reload recovery runs");
   await h.fire(3000);
   assert.equal(h.hold(),1,"3 s later the recovery is still waiting (identity restoring): the loading screen stays, Home does not show");
   assert.ok(h.timers.some(t=>t.ms===13000&&!t.fired),"the only bound left is the overall cap: 15 s from the start of the load (2 s in, 13 s left)");
   h.release(true);await settle();
   assert.equal(h.hold(),0,"once the recovery has settled the loading screen hands over");}
  {const h=run();await settle();await h.fire(13000);
   assert.equal(h.hold(),0,"a recovery that never settles is still cut off at the overall startup cap");}
  {const h=run({nowMs:20000});await settle();await h.fire(0);
   assert.equal(h.hold(),0,"past the cap already: no extra wait at all");}
}
// r79 gallery (fix 2): after Daniel deleted the first Showdown and started a new one, Nik's league wheel still read
// "<league> is locked for both managers." with the wheel turned to the old league before anyone spun (stale page DOM of the deleted
// rivalry; the new rivalry's setup was empty). Before this rivalry's league is drawn the note is hidden and the wheel is at rest.
async function galleryFix2StaleLockContracts(){
  const h=presentationHarness({role:"playerTwo",setup:leagueSetup});await h.api.activate();await settle();
  await h.timers.fire(h.timers.pending().find(t=>t.ms===4120));await settle();
  assert.match(h.node("leagueStateNote").textContent,/is locked for both managers/,"fixture: the first rivalry's league is locked on this page");
  const track=h.node("track");assert.equal(track.dataset.sharedLeagueId,"premier_league","fixture: the wheel turned to the first league");
  await h.push(null,{rivalryId:"pair_4"+"8".repeat(63)});
  assert.match(h.node("spinLeague").textContent,/WAITING FOR DANIEL/,"the new rivalry waits for Daniel's spin");
  assert.equal(h.node("leagueStateNote").textContent,"","no league lock is shown for a rivalry with no league yet");
  assert.equal(visible(h.node("leagueStateNote")),false,"the lock note is hidden");
  assert.equal(track.dataset.sharedLeagueId,undefined,"the wheel no longer belongs to the old league");
  assert.equal(track.style.transform,"rotate(0deg)","the wheel is back at rest");
  await h.push({phase:"SHARED_SETUP_OPEN",revision:1,coordinatorRole:"playerOne",confirmedRoles:[]});
  assert.equal(visible(h.node("leagueStateNote")),false,"an open setup with no league shows no lock either");
  ok("Gallery fix 2: a new rivalry's league wheel shows no lock note or turned wheel from a deleted rivalry before Daniel spins");
}
async function r5r6EntryContracts(){
  {
    const h=entryHarness();h.api.install();await settle();
    // r79 PR2 (R5a lands): START goes straight to WAITING, the Connect Players layer over the locked league wheel, and makes
    // the pair code itself. The POS10 stability rule still holds: START never leaves the canonical league screen.
    const [started,again]=await Promise.all([h.api.preparePairingShell(),h.api.preparePairingShell()]);await settle();
    assert.equal(started,true,"START A SHOWDOWN still prepares the shared shell");
    assert.equal(again,false,"a double tap is refused while the first START runs");
    assert.equal(h.calls.create,1,"a double tap never creates a second shell");
    assert.equal(h.calls.startPairing,1,"the pair code is created automatically, exactly once (no CREATE CODE FOR NIK tap)");
    assert.deepEqual(h.calls.layerOpen.map(options=>options&&options.stayOnScreen),[true],"WAITING opens once, staying on the league wheel");
    assert.equal(visible(h.overlay()),false,"R5a: GET READY is not shown after START A SHOWDOWN");
    assert.equal(h.calls.navigate.includes("mainMenu"),false,"START A SHOWDOWN never leaves the canonical league screen");
  }
  {
    const live=entryHarness({pairState:{status:"paired",initialized:true,rivalryId:RIVALRY,connectionState:"active",managerRole:"playerOne"}});live.api.install();await settle();
    assert.equal(await live.api.preparePairingShell(),false,"over a live pair START creates nothing");
    assert.equal(live.calls.create,0,"no second shell over a live game");assert.equal(live.calls.continuePair,1,"START continues the live game");
    assert.equal(live.calls.startPairing,0,"no second rivalry");
    assert.equal(visible(live.overlay()),false,"a continue that worked opens nothing else");
    // PR #901: continuePair() reports a failure in its returned state; START reopens Connect Players with it and creates nothing.
    for(const status of ["error","recovery-required"]){
      const failed=entryHarness({pairState:{status:"paired",initialized:true,rivalryId:RIVALRY,connectionState:"active",managerRole:"playerOne"},continueResult:{status,busy:false,rivalryId:RIVALRY,connectionState:"active",message:"The career could not be opened."}});
      failed.api.install();await settle();
      assert.equal(await failed.api.followStartDecision({action:"continue",rivalryId:RIVALRY}),false,`${status}: the failed continue is not reported as done`);
      assert.deepEqual(failed.calls.layerOpen.map(options=>options&&options.stayOnScreen),[true],`${status}: Connect Players opens with the failure (TRY CONTINUE AGAIN / RESTORE BACKUP)`);
      assert.ok(failed.calls.pairRender>=1,`${status}: the pair panel renders that state`);
      assert.equal(failed.calls.create+failed.calls.startPairing,0,`${status}: nothing is created`);
    }
    {// PR #901: no pending shell means no extra loading-screen wait (the marker is read before waiting for the entry)
     const ssjr=read("js/ssjr.js");
     assert.ok(ssjr.includes('const resumeGate=async()=>{if(!pendingShell())return;const deadline='),"nothing pending: the startup never waits for the entry");
     assert.ok(ssjr.includes('root.readStorageValue("careerModeShowdown.pairedShell.v1")')&&ssjr.includes('return !(paired&&s.identity&&paired===s.identity.saveId);'),"a shell this device saw paired never holds startup; no Firebase read");
     // behaviour: run the marker check itself against the shapes that matter
     const fn=new Function("root","currentShowdown",ssjr.slice(ssjr.indexOf("const pendingShell="),ssjr.indexOf("const resumeGate="))+"return pendingShell();");
     const SHELL="save_"+"5".repeat(24),OTHER="save_"+"6".repeat(24);
     const shared=(over={})=>({identity:{saveId:SHELL},sharedJourney:{mode:"shared",setupPending:true},selectedLeague:null,clubs:{},rounds:[],...over});
     const world=({flag=null,paired=null,library=null}={})=>({sessionStorage:{getItem:()=>flag},readStorageValue:key=>key==="careerModeShowdown.pairedShell.v1"?paired:null,readSaveLibraryActive:()=>library});
     assert.equal(fn(world(),null),false,"no shell, no tab flag: no wait");
     assert.equal(fn(world(),shared()),true,"pre-pair shared shell: wait");
     // a reload of an ACTIVE paired Showdown: this device remembered its shell as paired -> no hold (its local copy looks untouched)
     assert.equal(fn(world({paired:SHELL}),shared()),false,"ACTIVE paired Showdown reload: no extra loading-screen time");
     assert.equal(fn(world({paired:OTHER}),shared()),true,"another shell's paired mark never skips a fresh pre-pair shell");
     assert.equal(fn(world({flag:"1"}),shared({clubs:{playerOne:"Lazio",playerTwo:"Empoli"}})),false,"a Showdown with clubs never waits, even with the tab flag");
     assert.equal(fn(world(),{sharedJourney:null,clubs:{},rounds:[]}),false,"a local Showdown never waits");
     assert.equal(fn(world({flag:"1",library:shared()}),null),true,"shell not loaded yet: the tab flag reads the active save locally");
     assert.equal(fn(world({flag:"1",library:shared(),paired:SHELL}),null),false,"and skips it when that save is the paired one");
     assert.equal(fn(world({flag:"1",library:null}),null),false,"nothing readable: no wait (smoothness first)");
     const pairSrc=read("js/persistentNikDanielPair.js");
     assert.ok(pairSrc.includes('state=pairFreezeDeep(pairHeldIfEnded({...state,...next}));pairRememberActiveShell();'),"every ACTIVE paired state (init, JOIN, START CAREER, auto-continue) remembers its shell");
     assert.ok(pairSrc.includes('if(state.status!=="paired"||state.connectionState!=="active"||!pairValidSaveId(state.providerSaveId))return;'),"only an ACTIVE paired shell, by saveId only");
     const gate=ssjr.slice(ssjr.indexOf("const pendingShell="),ssjr.indexOf("root.careerModeHomeHold=1;"));
     assert.doesNotMatch(gate,/firestore|getDoc|syncPair|initialize\(/i,"the marker check is local only");}
    // a reload: the code is out, the saved shell is in the Save Library but not loaded yet (currentShowdown null, as a real
    // browser shows it; the wheel route alone would fall back to Home)
    const WAIT_SAVE="save_"+"4".repeat(24);
    const waiting=entryHarness({pairState:{status:"waiting",initialized:true,rivalryId:RIVALRY,connectionState:"pending-pair",managerRole:"playerOne",capability:"CMS17-"+RIVALRY,providerSaveId:WAIT_SAVE},
      library:{activeSaveId:WAIT_SAVE,saves:[{saveId:WAIT_SAVE,showdown:{identity:{saveId:WAIT_SAVE},status:"Created",totalRounds:3,rounds:[],selectedLeague:null,clubs:{playerOne:null,playerTwo:null},sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}}}]}});waiting.api.install();await settle();
    assert.deepEqual(waiting.calls.layerOpen.map(options=>options&&options.stayOnScreen),[true],"a reload with the pending marker reopens WAITING, not GET READY");assert.equal(visible(waiting.overlay()),false,"no GET READY after the reload");
    // PR #901: startup leaves Home active; reload recovery puts WAITING back over the locked league wheel (closing it shows the
    // wheel and its CONTINUE CAREER, not Home), and js/ssjr.js holds the loading screen until this recovery has settled.
    assert.deepEqual(waiting.calls.screenAtOpen,["leagueWheelScreen"],"after a reload WAITING's underlying screen is leagueWheelScreen");
    assert.equal(waiting.calls.resume,1,"the saved shell is resumed first (Home's CONTINUE path), so the wheel route does not fall back to Home");
    assert.equal(await waiting.api.startupResume(),true,"the reload recovery reports when it has settled (Reus Gate hold)");
    assert.equal(entryHarness({pairState:{status:"paired",initialized:true,rivalryId:RIVALRY,connectionState:"active",managerRole:"playerOne"}}).api.startupResume(),null,"no recovery is pending before install");
    await startupHoldContracts();
    {const ssjr=read("js/ssjr.js");
     assert.ok(ssjr.includes('.then(reusGate).catch(error=>root.console?.warn?.("[Career Mode Showdown] Reus Gate could not check Home.",error)).then(resumeGate).catch(()=>null).then(liveGameGate).catch(()=>null).then(()=>{root.careerModeHomeHold=0;});'),"the loading screen is released only after Home is ready AND the reload recovery settled AND (r79 gallery) a live-game reload resume has left Home");
     // r79 gallery (fix 4): the live-game resume (Studio Z3) is held too, until it leaves Home or lets go, under the same cap.
     assert.ok(ssjr.includes('if(!liveGameHeld()||startupCapLeft()<=0||root.careerModeTabResumeLetGo===true)return false;'),"the live-game hold is bounded by the startup cap and released when the resume lets go");
     assert.ok(ssjr.includes('if(typeof root.getActiveScreenName==="function"&&root.getActiveScreenName()!=="mainMenu")return false;'),"the live-game hold ends as soon as the resume has left Home");
     assert.ok(read("js/onlinePlayerIdentity.js").includes('void openCanonicalCareerContinue().then(next=>{if(!next||next.status!=="paired")root.careerModeTabResumeLetGo=true;});'),"a failed resume lets the hold go at once");
     assert.ok(ssjr.includes('const resume=entry&&typeof entry.startupResume==="function"?entry.startupResume():null;if(resume)await Promise.race([Promise.resolve(resume).catch(()=>null),deadline]);'),"one deadline bounds the whole wait");
     // Codex #904 (P1): the old 3 s deadline (pinned here before) let Home show while the identity was still restoring and then
     // jump to the wheel and WAITING. The wait now lasts until the recovery settles, bounded by js/app.js's overall startup cap.
     assert.ok(ssjr.includes('const deadline=new Promise(resolve=>root.setTimeout(resolve,startupCapLeft()));'),"bounded by the overall startup cap only");
     assert.ok(ssjr.includes('const STARTUP_CAP_MS=15e3,')&&!ssjr.includes("setTimeout(resolve,3e3)"),"the cap is js/app.js's 15 s from the start of the load; no shorter deadline");
     assert.ok(read("js/app.js").includes("performance.now()<(window.careerModeHomeHold?15e3:6e3)"),"js/app.js hands over at 15 s from the start of the load, the same cap");
     assert.ok(ssjr.includes('install("ssjr-production-entry","js/productionSharedJourneyEntry.js","CareerModeProductionSharedJourneyEntry").then(api=>{entryInstalled(api);return api;},error=>{entryInstalled(null);throw error;}),'));}
    {const source=read("js/productionSharedJourneyEntry.js");
     assert.ok(source.includes('if(decision&&decision.action==="resume-waiting")await showLockedWheel();'),"Daniel's WAITING reopens over the league wheel");
     assert.ok(source.includes('if(pending())startStartupResume();return true;}'),"only a pending shell holds startup");
     assert.ok(source.includes('return !current||entryIdentityReady()||["idle","connecting","signing-in","saving-manager"].includes(current.status);'),"a signed-out, offline or choosing player never holds the loading screen");}
    {// PR #901 (next to W8): reload recovery uses the same correlated closed check as START. A fresh, code-less shell made after
     // an older closed Showdown reopens WAITING over the wheel and re-makes the code on that same shell; the closed Showdown's
     // own shell does not reopen.
     const OLD_RIVALRY="pair_3"+"9".repeat(63),OLD_SAVE="save_"+"8".repeat(24),FRESH_SAVE="save_"+"7".repeat(24);
     const reload=saveId=>{const t=entryHarness({pairState:{status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null,managerRole:null,closedRivalryId:OLD_RIVALRY,closedProviderSaveId:OLD_SAVE},
       library:{activeSaveId:saveId,saves:[{saveId,showdown:{status:"Created",totalRounds:3,rounds:[],selectedLeague:null,clubs:{playerOne:null,playerTwo:null},sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}}}]}});t.api.install();return t;};
     const fresh=reload(FRESH_SAVE);await fresh.api.startupResume();await settle();
     assert.deepEqual(fresh.calls.layerOpen.map(options=>options&&options.stayOnScreen),[true],"fresh shell after an older closed Showdown: WAITING reopens on reload");
     assert.deepEqual(fresh.calls.screenAtOpen,["leagueWheelScreen"],"over the locked league wheel");
     assert.deepEqual([fresh.calls.startPairing,fresh.calls.create],[1,0],"the code is re-made on the same shell, never a second shell");
     const own=reload(OLD_SAVE);await own.api.startupResume();await settle();
     assert.deepEqual([own.calls.layerOpen.length,own.calls.startPairing,own.calls.create],[0,0,0],"the closed Showdown's own shell stays shut on reload");}
    {// a signed-out player with a pending shell: nothing can reopen on the wheel, so the loading screen is released at once
     // (the recovery itself still waits up to 15 s for a sign-in, but never behind the loading screen)
     const out=entryHarness({identityStatus:"signed-out",pairState:{status:"waiting",initialized:true,rivalryId:RIVALRY,connectionState:"pending-pair",managerRole:"playerOne"}});
     out.api.install();
     const released=await Promise.race([out.api.startupResume(),new Promise(resolve=>setTimeout(()=>resolve("held"),300))]);
     assert.equal(released,true,"signed out: the startup hold ends at once");
     assert.deepEqual(out.calls.layerOpen,[],"and nothing is reopened for a player who is not signed in");}
    assert.equal(await waiting.api.preparePairingShell(),false,"with Daniel's code already out START creates nothing");
    assert.equal(waiting.calls.create+waiting.calls.startPairing,0,"the code already sent stays the code (no new shell, no new code)");
    assert.deepEqual(waiting.calls.layerOpen.map(options=>options&&options.stayOnScreen),[true,true],"START reopens WAITING");
    const unknown=entryHarness({pairState:null});unknown.api.install();await settle();
    assert.equal(await unknown.api.preparePairingShell(),false,"unreadable pair authority fails closed");
    assert.equal(unknown.calls.create+unknown.calls.startPairing+unknown.calls.layerOpen.length,0,"nothing is created or opened when the pair cannot be read");
  }
  {
    // r79 (Nik, 2026-10-17): Daniel's START on a Showdown that ENDED but was never CLOSED closes it through the final-screen
    // terminal close first and only then opens the seasons screen. START never creates a shell while that Showdown exists.
    const SAVE="save_"+"e".repeat(24);
    const endedWorld=terminalClose=>entryHarness({terminalClose,pairState:{status:"paired",initialized:true,rivalryId:RIVALRY,connectionState:"active",managerRole:"playerOne",providerSaveId:SAVE},
      // as in the real two-manager journey: the local save stays "Created"; this page's terminal close knows the Showdown ended
      library:{activeSaveId:SAVE,saves:[{saveId:SAVE,showdown:{status:"Created",totalRounds:3,rounds:[],sharedJourney:{mode:"shared",setupPending:true},clubs:{}}}]}});
    const ready=endedWorld("READY");ready.api.install();await settle();
    const [first,second]=await Promise.all([ready.api.preparePairingShell(),ready.api.preparePairingShell()]);await settle();
    assert.deepEqual([first,second],[false,false],"START over an ended Showdown creates no shell itself");
    assert.equal(ready.calls.close,1,"the ended Showdown is closed once, through the terminal close (a double tap shares it)");
    assert.equal(ready.calls.create+ready.calls.startPairing+ready.calls.continuePair,0,"no shell, no code and no continue while the ended Showdown exists");
    assert.equal(ready.calls.navigate.filter(name=>name==="createShowdown").length,1,"after the close succeeds START opens the seasons screen");
    for(const phase of ["BLOCKED","READY-FAIL"]){
      const stuck=endedWorld(phase);stuck.api.install();await settle();
      assert.equal(await stuck.api.preparePairingShell(),false);
      assert.equal(stuck.calls.create+stuck.calls.startPairing+stuck.calls.continuePair,0,`${phase}: nothing is created when the close does not succeed`);
      assert.equal(stuck.calls.navigate.includes("createShowdown"),false,`${phase}: no seasons screen without a successful close`);
      assert.equal(stuck.calls.close,phase==="BLOCKED"?0:1,`${phase}: the close is attempted only when the terminal close is READY`);
      assert.ok(stuck.calls.layerOpen.length>=1,`${phase}: START stops on Connect Players (CHECK STATUS path)`);
    }
    // A Showdown still in progress keeps continuing; Nik's START never closes anything.
    const playing=entryHarness({pairState:{status:"paired",initialized:true,rivalryId:RIVALRY,connectionState:"active",managerRole:"playerOne",providerSaveId:SAVE},
      library:{activeSaveId:SAVE,saves:[{saveId:SAVE,showdown:{status:"Ready",totalRounds:3,rounds:[{}],sharedJourney:{mode:"shared"},clubs:{}}}]}});playing.api.install();await settle();
    assert.equal(await playing.api.preparePairingShell(),false);
    assert.deepEqual([playing.calls.continuePair,playing.calls.close,playing.calls.create],[1,0,0],"in progress: START continues it, closes nothing, creates nothing");
  }
  {
    // PR #901 P2: CONTINUE CAREER on the locked league wheel (shown after BACK/Escape closes WAITING) reopens WAITING over the
    // wheel, never the GET READY overlay.
    const waiting=entryHarness({pairState:{status:"waiting",initialized:true,rivalryId:RIVALRY,connectionState:"pending-pair",managerRole:"playerOne",capability:"CMS17-"+RIVALRY}});waiting.api.install();await settle();
    const opened=waiting.calls.layerOpen.length;
    await Promise.all([waiting.api.continueFromLockedWheel(),waiting.api.continueFromLockedWheel()]);await settle();
    assert.deepEqual(waiting.calls.layerOpen.slice(opened).map(options=>options&&options.stayOnScreen),[true],"one WAITING reopen, on the same screen");
    assert.equal(visible(waiting.overlay()),false,"no GET READY");assert.equal(waiting.calls.create+waiting.calls.startPairing,0,"the code already out stays the code");
    const source=read("js/productionSharedJourneyEntry.js");
    assert.ok(source.includes('resume.id=SHARED_CONTINUE_ID;resume.type="button";resume.addEventListener("click",()=>void continueFromLockedWheel());'),"the wheel's CONTINUE CAREER goes through the START decision");
    assert.ok(!source.includes('addEventListener("click",()=>void openPanel())'),"no button opens GET READY directly");
  }
  ok("R5a Entry (r79): START A SHOWDOWN opens WAITING over the locked league screen, makes the code once, and over a live pair continues it instead");
  {// Codex #904 (P1): on a cold cache, START used to show the locked league wheel and only then load WAITING's script, stylesheet
   // and plate, so Daniel saw (and could tap) the bare wheel. WAITING is now made ready first and covers the wheel in the same task.
    const h=entryHarness({coldLayer:true});h.api.install();await settle();
    assert.equal(await h.api.preparePairingShell(),true,"START still prepares the shared shell");await settle();
    assert.equal(h.calls.wheelShown,true,"the locked league wheel is shown");
    assert.equal(h.calls.coveredAtFirstPaint,true,"no frame shows the bare locked wheel: WAITING covers it before the first paint");
    assert.equal(h.calls.preparedAtRoute,true,"WAITING (script, stylesheet, plate) is ready before the route to the wheel");
    assert.deepEqual(h.calls.layerOpen.map(options=>options&&options.stayOnScreen),[true],"WAITING opens once, over the wheel");
    assert.deepEqual([h.calls.create,h.calls.startPairing,h.calls.prepareCalls],[1,1,1],"one shell, one code, one preparation");
    const source=read("js/productionSharedJourneyEntry.js");
    assert.ok(source.includes("const waitingReady=prepareWaiting();await ensureSaveAuthority();"),"the preparation runs alongside START's own checks (no extra wait when warm)");
    assert.ok(source.includes("await waitingReady;const created=await root.createShowdown();"),"and is awaited before the route to the wheel");
    const prep=source.slice(source.indexOf("function prepareWaiting(){"),source.indexOf("async function openWaiting("));
    assert.doesNotMatch(prep,/syncPair|initialize\(|readJoinNote|readPartnerRecord|getDoc|runTransaction|setInterval/,"files only: no Firestore read, no polling");
    const layer=read("js/connectPlayersScreenV10.js");
    assert.ok(layer.includes("if(urls.every(url=>decodedPlates.has(url)))return Promise.resolve(true);"),"a plate already decoded answers at once");
    assert.ok(layer.includes("img.decode().then(()=>true,()=>false)")&&layer.includes(".then(ok=>{if(ok)decodedPlates.add(url);return ok;})"),"Codex #911: only a plate that loaded and decoded is remembered; a failed one is tried again");
    assert.doesNotMatch(layer,/urls\.forEach\(url=>decodedPlates\.add\(url\)\)/,"Codex #911: a failed decode is never cached as ready");
    assert.ok(layer.includes("return Object.freeze({open,close,prepare:prepareConnectPlayers});"),"the layer exposes prepare()");}
  ok("Codex #904 P1 Entry: on a cold cache START makes WAITING ready before routing to the locked wheel, so the bare wheel never paints");
  {
    const h=entryHarness({rivalryReady:true,active:false});
    await h.api.openPanel();await settle();
    assert.equal(h.calls.remoteOpen,1,"R5b: connected players without an ACTIVE session go straight to Remote Joining");
    assert.equal(visible(h.overlay()),false,"R5b: GET READY is not shown in between");
    assert.equal(h.calls.host+h.calls.join,0,"hosting and joining stay manual taps");
    const before=entryHarness({rivalryReady:false});await before.api.openPanel();await settle();
    assert.equal(visible(before.overlay()),true,"before pairing GET READY still shows");
    assert.ok(before.overlay().button("CONNECT PLAYERS"),"with CONNECT PLAYERS");assert.equal(before.calls.remoteOpen,0);
    const ready=entryHarness({rivalryReady:true,active:true});await ready.api.openPanel();await settle();
    assert.equal(visible(ready.overlay()),true,"with an ACTIVE session GET READY still shows");assert.ok(ready.overlay().button("START CAREER"),"with START CAREER as before");
  }
  ok("R5b Entry: a connected pair skips GET READY's CONTINUE and opens Remote Joining; GET READY remains before pairing and when ACTIVE");
  {
    const h=entryHarness({rivalryReady:true,active:false});await h.api.openPanel();await settle();
    await h.goActive();
    assert.equal(h.calls.presentation,1,"R6: an ACTIVE session continues into the league wheel without START CAREER");
    assert.ok(h.calls.remoteClose>=1,"the Remote Joining overlay closes");
    assert.equal(visible(h.overlay()),false,"GET READY is not shown");
    const expired=entryHarness({rivalryReady:true,active:false});await expired.api.openPanel();await settle();
    await expired.goActive(true);
    assert.equal(expired.calls.presentation,0,"an expired session never auto-continues");
    const failing=entryHarness({rivalryReady:true,active:false,openExperience:"fail"});await failing.api.openPanel();await settle();
    const remoteOpens=failing.calls.remoteOpen;await failing.goActive();
    assert.equal(failing.calls.presentation,1);
    assert.equal(visible(failing.overlay()),true,"a failed entry falls back to GET READY");
    assert.equal(failing.calls.remoteOpen,remoteOpens,"and does not bounce back into Remote Joining");
  }
  {
    // Codex P1 on #358: an ACTIVE session left in Remote Joining's page memory from another rivalry, account or device never
    // auto-continues (no GET READY loop after a new Showdown without a reload); the bound session still does.
    const h=entryHarness({rivalryReady:true,active:false});await h.api.openPanel();await settle();
    const bound={rivalryId:RIVALRY,accountId:"uid_daniel",deviceId:DEVICE};
    for(const [label,patch] of [["rivalry",{rivalryId:"pair_"+"8".repeat(64)}],["account",{accountId:"uid_other"}],["device",{deviceId:"device_"+"9".repeat(32)}]]){
      Object.assign(h.remoteState,bound,patch);await h.goActive();
      assert.equal(h.calls.presentation,0,`R6: an ACTIVE session bound to another ${label} never auto-continues`);
    }
    Object.assign(h.remoteState,bound);await h.goActive();
    assert.equal(h.calls.presentation,1,"R6: the session bound to the current account, device and rivalry continues");
  }
  ok("R6 Entry: an ACTIVE session bound to this account, device and rivalry continues into the Showdown by itself; foreign or expired sessions never do; a failure shows GET READY without bouncing");
}

// ------------------------------------------------------------------ S. manual taps stay manual; R7 is not built
function safetyContracts(){
  const commit=read("js/productionSharedSeasonCommit.js");
  assert.match(commit,/if\(role===coordinator\)\{[^\n]*psscText\(ui\.action,"LOCK & CONFIRM SEASON"\)/,"COMMIT & ACKNOWLEDGE is the coordinator's own tap (R7)");
  assert.match(commit,/psscText\(ui\.action,"CONFIRM SEASON"\)/,"CONFIRM SEASON stays the rival's own tap and Daniel's fallback");
  assert.match(commit,/if\(kind!=="commit"\|\|current\.managerRole!==current\.coordinatorRole\|\|psscSatisfied\("acknowledge",current\)\)return true;/,"only the coordinator's commit tap also acknowledges, and only his own side");
  assert.match(commit,/void psscMutate\(view\.committed\?"acknowledge":"commit"\);/,"commit/acknowledge are still only reached from the manager's click");
  const results=read("js/productionSharedSeasonResults.js");
  assert.match(results,/if\(target\.id==="completeSeason"\)pssrBeginReview\(\);else if\(target\.id==="editSeasonResults"\)pssrEdit\(\);else void pssrPublish\(\);/,"REVIEW and PUBLISH stay separate manual taps");
  const transfer=read("js/productionSharedTransferChallenge.js");
  for(const [label,fn] of [["Transfer",transfer.match(/function pstcFastTick\(\)\{[^\n]*\}/)[0]],["Career Start",read("js/productionSharedCareerStart.js").match(/function pcstFastTick\(\)\{[^\n]*\}/)[0]],["Results",results.match(/function pssrFastTick\(\)\{[^\n]*\}/)[0]],["Commit",commit.match(/function psscFastTick\(\)\{[^\n]*\}/)[0]]]){
    assert.doesNotMatch(fn,/Mutate|lock|publish|acknowledge|commit|startWindow|requestEnd/i,`${label} fast lane only calls the read-only tick`);
  }
  assert.match(transfer,/if\(id==="completeTransferChallenge"\)\{/,"LOCK MY GUESSES / LOCK MY SIGNINGS stay manual taps");
  const presentation=read("js/productionSharedShowdownPresentation.js");
  const auto=presentation.match(/function ssjpAutoForwardToClubs\(\)\{[\s\S]*?\n  \}\n  function ssjpMaybeAutoOpenCareerStart\(setup\)\{[\s\S]*?\n  \}/)[0];
  assert.doesNotMatch(auto,/ssjpMutate|commit-league|commit-clubs|"confirm"/,"R3/R4a auto steps never draw or confirm");
  assert.match(presentation,/async function ssjpOpenCareerStart\(\)\{\n[^\n]*\n\s*autoCareerStartKey=`\$\{presentationContextKey\}\|\$\{state\.setup\.revision\}`;busy=true;/,"R4a: any Career Start opening marks the revision, so the second confirmer's click path and the auto-open never open it twice");
  const entry=read("js/productionSharedJourneyEntry.js");
  assert.doesNotMatch(entry,/hostSession|joinSession/,"the entry never hosts or joins a session by itself");
  // r79: the code is made in one place only, WAITING right after Daniel's own START (or his reloaded seasons with no code yet).
  assert.equal((entry.match(/startPairing\(/g)||[]).length,1,"the entry makes the pair code in exactly one place");
  assert.match(entry,/if\(options\.createCode===true\)await pair\.startPairing\(\{managerRole:"playerOne"\}\)/,"only for Daniel (Player One), only when asked to");
  const career=read("js/productionSharedCareerStart.js");
  assert.doesNotMatch(career.match(/async function pcstAutoContinue\(\)\{[\s\S]*?\n  \}/)[0],/acknowledge/,"Career Start auto-continue never acknowledges");
  for(const file of ["js/persistentNikDanielPair.js"]){
    const src=read(file),tick=src.match(/async function (pairWaitingPollTick)\(\)\{[\s\S]*?\n  \}/)[0];
    assert.doesNotMatch(tick,/createPairing|redeemPairing|openSession|joinSession|closeSession|revokeSession|pairStartPairing|pairJoinPairing|srjHostSession|srjJoinSession/,`${file} waiting poll is read-only`);
  }
  const html=read("index.html");
  for(const file of ["persistentNikDanielPair","sparkRemoteJoining","productionSharedJourneyEntry","productionSharedShowdownPresentation","productionSharedCareerStart","productionSharedTransferChallenge","productionSharedSeasonResults","productionSharedSeasonCommit","productionSharedCanonicalScoring","productionSharedHistoryConvergence","productionSharedMultiSeasonProgression"])assert.equal(html.includes(`js/${file}.js`),false,`${file} stays a lazy module outside the startup budget`);
}

const watchdog=setTimeout(()=>{console.error("fewer-taps: a promise never settled");process.exit(1);},90000);
(async()=>{
  await galleryFix1SpinContracts();
  await r1TransferContracts();
  await r1r4CareerStartContracts();
  await r1r8ResultsContracts();
  await r1CommitContracts();
  await r7CommitContracts();
  await r1ScoringHistoryContracts();
  await r1PairContracts();
  r1RemoteContracts();ok("R1 Remote Joining: the host's join pickup is job 31's single bounded watch (no duplicate poll)");
  await r2MultiSeasonContracts();
  await r3r4aPresentationContracts();
  await r5r6EntryContracts();
  await galleryFix2StaleLockContracts();
  safetyContracts();ok("S Safety: locks, REVIEW + PUBLISH, COMMIT (+ Daniel's own ACKNOWLEDGE), Nik's ACKNOWLEDGE, pair code and hosting stay manual taps; every fast lane is read-only; all touched modules stay lazy");
  clearTimeout(watchdog);
  console.log(`PASS fewer taps contracts: ${checks} checks (R1 fast read-only waiting polls, R2 season continue opens transfers, R3 league auto-forward, R4 Career Start hand-offs, R5b entry hop, R6 ACTIVE auto-continue, R7 coordinator commit + own acknowledge in one tap, R8 banner cleanup).`);
})().catch(error=>{console.error(error);process.exit(1);});
