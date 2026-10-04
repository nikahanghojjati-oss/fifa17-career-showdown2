"use strict";
// Job 33 "Fewer taps" (spec: TAP_AUDIT_2026-10-04 reductions R1 to R8; R7 added by Nik's owner decision of 2026-10-04).
// Owner rule: the two-manager game stays smooth and safe; fewer taps, same safety. Every removed tap was a pure navigation or a read.
//   R1 Waiting screens read faster (3 s, pair panel 4 s; the Remote Joining host watch is job 31's) for at most 3 minutes, then the normal interval;
//      read-only, paused while the tab is hidden, and only while this manager is waiting on the rival.
//   R2 CONTINUE TO SEASON N opens the new season's Shared Transfer Challenge (no dashboard hop); it never starts the window.
//   R3 The league reveal moves on to the club packs by itself on both devices (no CONTINUE TO CLUB PACKS tap).
//   R4 The first confirmer opens Career Start by itself; Career Start moves on to the Transfer Challenge once BOTH attested.
//   R5 START A SHOWDOWN opens the pair panel directly; connected players without an ACTIVE session go straight to Remote Joining.
//   R6 An ACTIVE private session continues into the Showdown by itself (no START CAREER tap); expired sessions never do.
//   R7 Daniel's COMMIT & ACKNOWLEDGE tap commits, then records his own acknowledgement; Nik still acknowledges himself;
//      if the second half fails Daniel gets the existing ACKNOWLEDGE SHARED SEASON button.
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
  ok("R1 Transfer: after early-end / guess lock / signing lock the rival's step arrives by the 3 s read, no REFRESH SHARED CHALLENGE tap");
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
    assert.equal(h.node("seasonReviewResult").textContent,"Both managers published their reviewed FIFA 17 season results.","R8: the 'Continue with the Shared Season Commit below.' sentence is gone");
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
    assert.equal(h.action().textContent,"ACKNOWLEDGE SHARED SEASON","Nik's ACKNOWLEDGE appears without a CHECK tap");
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
    assert.equal(h.action().textContent,"WAITING FOR COORDINATOR","and keeps the current waiting view");
    h.intervals.find(item=>item.ms===15000).fn();await settle();
    assert.equal(h.calls.reports.length,1,"the normal 15 s poll still reports a real read failure");
  }
  ok("R1 Season Commit: fast reads only while waiting for the coordinator's COMMIT or the rival's ACKNOWLEDGE; COMMIT and each ACKNOWLEDGE stay manual taps");
}


// ------------------------------------------------------------------ R7 Season Commit: Daniel's COMMIT also records his own ACKNOWLEDGE (owner decision 2026-10-04)
async function r7CommitContracts(){
  {
    const clash={playerOne:{leaguePosition:2,domesticCup:true},playerTwo:{leaguePosition:4,domesticCup:true}};
    const h=commitHarness({role:"playerOne",allResults:clash});h.api.install();await h.api.refresh();await settle();
    assert.equal(h.api.coordinatorCommitAlsoAcknowledges,true);
    assert.equal(h.action().textContent,"COMMIT & ACKNOWLEDGE SHARED SEASON","Daniel's one button says it commits and acknowledges");
    assert.match(h.status(),/^BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT/);
    assert.match(h.status(),/CHECK RESULTS: Both managers ticked Domestic Cup\. You can still commit; scores use what was entered\./,"the CHECK RESULTS clash warning shows before Daniel taps");
    assert.equal(h.action().disabled,false,"a clash never disables the combined button");
    assert.equal(h.calls.commit+h.calls.acknowledge,0,"nothing is written before Daniel taps");
    h.fast().fn();await settle();h.clock.now+=20000;h.fast().fn();await settle();
    assert.equal(h.calls.commit+h.calls.acknowledge,0,"no poll ever commits or acknowledges for Daniel");
    await h.tap();
    assert.equal(h.calls.commit,1,"one tap commits once");assert.equal(h.calls.acknowledge,1,"and records Daniel's own acknowledgement once");
    assert.deepEqual(h.calls.guard.map(g=>g.action),["commit-season","acknowledge-season"],"commit first, then acknowledge, each through the conflict guard");
    assert.notEqual(h.calls.guard[0].operationId,h.calls.guard[1].operationId,"each write keeps its own operationId");
    assert.equal(h.calls.guard[1].baseRevision,h.calls.guard[0].baseRevision+1,"the acknowledge is based on the committed revision");
    assert.equal(h.action().textContent,"ACKNOWLEDGED ✓ · WAITING FOR RIVAL","Daniel lands on the waiting state after his one tap");
    assert.equal(h.api.isWaitingForRival(),true,"and his fast lane waits for Nik's ACKNOWLEDGE");
    assert.equal(h.server.phase,"COMMITTED","scoring still waits for Nik's own acknowledgement");
  }
  ok("R7 Season Commit: Daniel's one COMMIT & ACKNOWLEDGE tap commits, then records his own acknowledgement (separate operationIds); the clash warning shows first");
  {
    const nik=commitHarness({role:"playerTwo",committed:true});nik.api.install();await nik.api.refresh();await settle();
    assert.equal(nik.action().textContent,"ACKNOWLEDGE SHARED SEASON","Nik still sees his own ACKNOWLEDGE button");
    assert.equal(nik.calls.acknowledge,0,"Nik is never acknowledged for");
    await nik.tap();assert.equal(nik.calls.acknowledge,1,"Nik's own tap acknowledges");assert.equal(nik.calls.commit,0,"Nik never commits");
    const waiting=commitHarness({role:"playerTwo"});waiting.api.install();await waiting.api.refresh();await settle();
    assert.equal(waiting.action().textContent,"WAITING FOR COORDINATOR");assert.equal(waiting.action().disabled,true,"Nik cannot commit");
  }
  ok("R7 Season Commit: Nik still taps his own ACKNOWLEDGE; the combined button exists only for the coordinator");
  {
    const h=commitHarness({role:"playerOne",ackFailures:["stale"]});h.api.install();await h.api.refresh();await settle();
    await h.tap();
    assert.equal(h.calls.commit,1);assert.equal(h.calls.acknowledge,2,"a stale acknowledge is retried once on the fresh revision");
    assert.equal(h.calls.guard[1].operationId,h.calls.guard[2].operationId,"the retry keeps the acknowledge operationId");
    assert.equal(h.action().textContent,"ACKNOWLEDGED ✓ · WAITING FOR RIVAL");assert.equal(h.error(),"");
  }
  ok("R7 Season Commit: the acknowledge half keeps the existing stale/race retry");
  {
    const h=commitHarness({role:"playerOne",ackFailures:["permission-denied"]});h.api.install();await h.api.refresh();await settle();
    await h.tap();await settle();
    assert.equal(h.calls.commit,1,"the commit landed");assert.equal(h.server.committed,true);assert.equal(h.server.ownAcknowledged,false,"the acknowledge half failed");
    assert.equal(h.action().textContent,"ACKNOWLEDGE SHARED SEASON","a failed acknowledge half falls back to the ACKNOWLEDGE SHARED SEASON button");
    assert.equal(h.action().disabled,false,"never a stuck state: the button is enabled");
    assert.match(h.error(),/acknowledgement could not be recorded/,"the failure is explained");
    assert.equal(h.api.isWaitingForRival(),false,"Daniel is not shown as waiting");
    await h.tap();
    assert.equal(h.calls.commit,1,"the fallback tap never commits again");assert.equal(h.calls.acknowledge,2,"it acknowledges");
    assert.equal(h.action().textContent,"ACKNOWLEDGED ✓ · WAITING FOR RIVAL");
  }
  {
    const h=commitHarness({role:"playerOne",committed:true});h.api.install();await h.api.refresh();await settle();
    assert.equal(h.action().textContent,"ACKNOWLEDGE SHARED SEASON","after a reload with the commit already made, Daniel sees ACKNOWLEDGE");
    await h.tap();assert.equal(h.calls.commit,0);assert.equal(h.calls.acknowledge,1);
  }
  ok("R7 Season Commit: if the acknowledge half fails after the commit, Daniel gets the existing ACKNOWLEDGE SHARED SEASON button (never stuck, never a second commit)");
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
function presentationHarness({role="playerTwo",setup=null}={}){
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
  const setupApi={refresh:async()=>current,getState:()=>current,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},mutate:async type=>{calls.mutations.push(type);return {ok:false,code:"UNEXPECTED_WRITE"};}};
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
async function r3r4aPresentationContracts(){
  {
    const h=presentationHarness({role:"playerTwo",setup:{phase:"SHARED_SETUP_OPEN",revision:1,coordinatorRole:"playerOne",confirmedRoles:[]}});
    await h.api.activate();await settle();
    assert.equal(visible(h.screens.leagueWheelScreen),true,"Nik waits on the league wheel");
    assert.match(h.node("spinLeague").textContent,/WAITING FOR HOST/,"Nik still cannot spin");
    await h.push(leagueSetup);
    assert.equal(h.node("selectedLeague").textContent,"Premier League","Nik sees the authoritative league reveal");
    assert.equal(visible(h.screens.leagueWheelScreen),true,"the league stays on screen while the wheel animates");
    const forward=h.timers.pending().find(t=>t.ms===4200);assert.ok(forward,"an auto-forward is scheduled after the 4.1 s wheel");
    await h.timers.fire(forward);
    assert.equal(visible(h.screens.clubWheelScreen),true,"R3: Nik is on the club packs without a CONTINUE TO CLUB PACKS tap");
    assert.equal(visible(h.screens.leagueWheelScreen),false);
    assert.equal(h.api.getState().leagueWitnessed,"premier_league","both managers still count as having witnessed the league");
    assert.match(h.node("openClubPack").textContent,/WAITING FOR HOST PACK REVEAL/,"Nik still cannot open the packs");
    assert.deepEqual(h.calls.mutations,[],"the auto-forward is presentation only (no write, no reroll)");
  }
  {
    const h=presentationHarness({role:"playerOne",setup:leagueSetup});await h.api.activate();await settle();
    h.api.handleControlClick("spinLeague");await settle();
    assert.equal(visible(h.screens.clubWheelScreen),true,"the CONTINUE TO CLUB PACKS button still works as a fallback");
    const forward=h.timers.pending().find(t=>t.ms===4200);await h.timers.fire(forward);
    assert.equal(visible(h.screens.clubWheelScreen),true,"a late auto-forward after a manual tap is a no-op");
    assert.match(h.node("openClubPack").textContent,/OPEN SHOWDOWN PACKS/,"OPEN SHOWDOWN PACKS stays Daniel's own host tap");
    assert.deepEqual(h.calls.mutations,[],"no draw was made for the host");
  }
  ok("R3 Presentation: the league reveal moves both devices to the club packs after the wheel; host-only draws stay manual taps");
  {
    const h=presentationHarness({role:"playerOne",setup:lengthSetup([])});await h.api.activate();await settle();
    h.dom.document.getElementById("clubWheelScreen");await h.push(lengthSetup([]));
    // Witness the league, then the club screen.
    const forward=h.timers.pending().find(t=>t.ms===4200);if(forward)await h.timers.fire(forward);
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
    const forward=h.timers.pending().find(t=>t.ms===4200);if(forward)await h.timers.fire(forward);
    await h.push(lengthSetup(["playerOne"]));
    assert.equal(h.node("continueClubAssignment").textContent,"CONFIRM SHARED SHOWDOWN","Nik's own CONFIRM SHARED SHOWDOWN tap is still required");
    assert.equal(h.calls.careerStart,0,"a manager who has not confirmed is never moved on");
  }
  ok("R4a Presentation: the first confirmer opens Career Start by itself once both confirmed; CONFIRM SHARED SHOWDOWN stays each manager's tap");
}

// ------------------------------------------------------------------ R5 + R6 career entry
const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
function entryHarness({rivalryReady=false,active=false,pairState={status:"unpaired",rivalryId:null,connectionState:null},openExperience="presentation"}={}){
  const dom=createDom();const menu=dom.add("mainMenu");void menu;dom.add("roundAmount",{tag:"select"}).value="3";dom.add("startShowdown",{tag:"button"});
  const calls={pairRender:0,startPairing:0,remoteOpen:0,remoteClose:0,presentation:0,careerStart:0,navigate:[],host:0,join:0};
  const storage=new Map([[PENDING_KEY,"1"]]);
  const remoteListeners=new Set();
  const remoteState={sessionState:active?"active":null,sessionId:active?SESSION:null,pendingAction:null,rivalryId:RIVALRY,accountId:"uid_daniel",deviceId:DEVICE,expiresAtEpochMs:Date.now()+3_600_000};
  const library={activeSaveId:null,saves:[]};
  const sandbox={console,setTimeout,clearTimeout,Promise,Date,document:dom.document,MutationObserver:class{observe(){}disconnect(){}},
    sessionStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
    loadRuntimeStyle:async()=>true,loadRuntimeScript:async key=>{throw new Error(`unexpected load ${key}`);},
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    navigateTo:async name=>{calls.navigate.push(name);return true;},
    createShowdown:async()=>{sandbox.currentShowdown={id:"save_1",totalRounds:3,managers:{}};library.activeSaveId="save_1";library.saves=[{saveId:"save_1",showdown:sandbox.currentShowdown}];return true;},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>library,saveCurrentShowdown:()=>true,clearActiveShowdown(){}},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"daniel",registered:true}),subscribe:()=>()=>{},syncPair:async()=>pairState},
    CareerModePersistentNikDanielPair:{getState:()=>pairState,render:()=>{calls.pairRender+=1;if(!dom.document.getElementById("persistentNikDanielPairPanel"))dom.add("persistentNikDanielPairPanel",{parent:dom.document.getElementById("mainMenu")});},startPairing:async()=>{calls.startPairing+=1;}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true})},
    CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:"uid_daniel"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:rivalryReady,rivalryId:rivalryReady?RIVALRY:null})},
    CareerModeSparkRemoteJoining:{getState:()=>remoteState,openPanel:async()=>{calls.remoteOpen+=1;return true;},closePanel:()=>{calls.remoteClose+=1;},subscribe:fn=>{remoteListeners.add(fn);return()=>remoteListeners.delete(fn);},hostSession:async()=>{calls.host+=1;},joinSession:async()=>{calls.join+=1;}},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>null,getState:()=>({ready:true,setup:{phase:"SHARED_SETUP_OPEN",revision:1}})},
    CareerModeProductionSharedShowdownPresentation:{activate:async()=>{calls.presentation+=1;if(openExperience==="fail")throw new Error("setup not ready");return true;},isPresentationActive:()=>false},
    reportApplicationError(){}};
  sandbox.currentShowdown=null;
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedJourneyEntry.js"),sandbox,{filename:"productionSharedJourneyEntry.js"});
  const api=sandbox.CareerModeProductionSharedJourneyEntry;
  const overlay=()=>dom.document.getElementById("productionSharedJourneyEntryOverlay");
  async function goActive(expired=false){Object.assign(remoteState,{sessionState:"active",sessionId:SESSION,expiresAtEpochMs:expired?Date.now()-1000:Date.now()+3_600_000});for(const fn of remoteListeners)fn(remoteState);await settle();}
  return {api,dom,calls,overlay,goActive,remoteState,remoteListeners};
}
async function r5r6EntryContracts(){
  {
    const h=entryHarness();h.api.install();await settle();
    const started=await h.api.preparePairingShell();await settle();
    assert.equal(started,true,"START A SHOWDOWN still prepares the shared shell");
    assert.equal(visible(h.overlay()),false,"R5a: no GET READY overlay after START A SHOWDOWN");
    assert.ok(h.calls.pairRender>=1&&h.dom.document.getElementById("persistentNikDanielPairPanel"),"R5a: the pair panel (CREATE CODE FOR NIK) opens directly");
    assert.ok(h.calls.navigate.includes("mainMenu"),"the pair panel lives on Home");
    assert.equal(h.calls.startPairing,0,"the pair code is NOT created automatically (still Daniel's CREATE CODE FOR NIK tap)");
  }
  ok("R5a Entry: START A SHOWDOWN opens the pair panel directly (no CONNECT PLAYERS tap) and never creates the code by itself");
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
  ok("R6 Entry: an ACTIVE session continues into the Showdown by itself; expired sessions never do; a failure shows GET READY without bouncing");
}

// ------------------------------------------------------------------ S. manual taps stay manual; R7 is not built
function safetyContracts(){
  const commit=read("js/productionSharedSeasonCommit.js");
  assert.match(commit,/if\(role===coordinator\)\{[^\n]*psscText\(ui\.action,"COMMIT & ACKNOWLEDGE SHARED SEASON"\)/,"COMMIT & ACKNOWLEDGE is the coordinator's own tap (R7)");
  assert.match(commit,/psscText\(ui\.action,"ACKNOWLEDGE SHARED SEASON"\)/,"ACKNOWLEDGE SHARED SEASON stays the rival's own tap and Daniel's fallback");
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
  assert.doesNotMatch(entry,/startPairing|hostSession|joinSession/,"the entry never creates a pair code or hosts/joins a session by itself");
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
  safetyContracts();ok("S Safety: locks, REVIEW + PUBLISH, COMMIT (+ Daniel's own ACKNOWLEDGE), Nik's ACKNOWLEDGE, pair code and hosting stay manual taps; every fast lane is read-only; all touched modules stay lazy");
  clearTimeout(watchdog);
  console.log(`PASS fewer taps contracts: ${checks} checks (R1 fast read-only waiting polls, R2 season continue opens transfers, R3 league auto-forward, R4 Career Start hand-offs, R5 entry hops, R6 ACTIVE auto-continue, R7 coordinator commit + own acknowledge in one tap, R8 banner cleanup).`);
})().catch(error=>{console.error(error);process.exit(1);});
