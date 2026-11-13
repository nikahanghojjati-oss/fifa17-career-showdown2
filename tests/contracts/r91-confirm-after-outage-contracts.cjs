#!/usr/bin/env node
"use strict";
// W1 (2.4.0 re-check watch row; seen again twice in 5-season CE2PG_OUTAGES runs, 2026-11-13): Nik taps CONFIRM MY RESULT and
// the signal drops as the tap lands. The publish fails offline ("unavailable") at a moment when this phone cannot read its
// Season Results context (the Showdown's setup/season is unreadable offline). The old code then drew nothing: the screen kept
// the CONFIRM button it had drawn as busy (disabled), and before this manager confirms no poll redraws the screen, so the
// button stayed off after the signal came back (CE2PG stop: "back online, the typed result publishes within 60 s").
//   W1-1 once the same context is back the screen is drawn again: CONFIRM MY RESULT on, the failure said, the typed result kept;
//   W1-2 one more tap publishes it once (same reviewed result);
//   W1-3 waiting for the context reads nothing;
//   W1-4 a different season coming back is not drawn with the old draft;
//   W1-5 a failure with the context readable is shown at once, as before;
//   W1-6 the check stops for good once the Season Results screen is not on (Home after END SHOWDOWN, any other screen).
// Real file js/productionSharedSeasonResults.js in a Node vm (the shared-season-results-stale-retry harness). On 64e01891 W1-1 fails.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const FILE="js/productionSharedSeasonResults.js";
const RIVALRY="pair_"+"a".repeat(64);
const SESSION="session_"+"b".repeat(64);
const DEVICE="device_"+"c".repeat(32);
const SAVE="save_"+"d".repeat(24);
const OWN={leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true};
const RIVAL={leaguePosition:1,leaguePoints:90,leagueGoals:85,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false};
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function makeNode(id){
  const classes=new Set();
  const node={id,textContent:"",value:"",checked:false,disabled:false,dataset:{},attributes:{},children:[],
    classList:{toggle(name,force){const on=force===undefined?!classes.has(name):Boolean(force);if(on)classes.add(name);else classes.delete(name);return on;},contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},
    setAttribute(name,value){node.attributes[name]=String(value);},
    closest(selector){return selector==="button"&&node.tagName==="BUTTON"?node:null;},
    append(...items){node.children.push(...items);},
    replaceChildren(...items){node.children=[...items];},
    focus(){}};
  return node;
}
function makeDocument(){
  const nodes=new Map(),listeners=[];
  const document={visibilityState:"visible",
    getElementById(id){if(!nodes.has(id))nodes.set(id,makeNode(id));return nodes.get(id);},
    createElement:tag=>makeNode(`<${tag}>`),
    createDocumentFragment:()=>makeNode("#fragment"),
    querySelector:()=>null,
    addEventListener(type,listener,capture){listeners.push({type,listener,capture});}};
  for(const id of ["completeSeason","confirmSeasonCompletion","editSeasonResults"])document.getElementById(id).tagName="BUTTON";
  const fill=(prefix,value)=>{document.getElementById(`${prefix}LeaguePosition`).value=String(value.leaguePosition);document.getElementById(`${prefix}LeaguePoints`).value=String(value.leaguePoints);document.getElementById(`${prefix}LeagueGoals`).value=String(value.leagueGoals);document.getElementById(`${prefix}DomesticCup`).checked=value.domesticCup;document.getElementById(`${prefix}ChampionsLeague`).checked=value.championsLeague;document.getElementById(`${prefix}TopScorer`).checked=value.topScorer;document.getElementById(`${prefix}TopAssist`).checked=value.topAssist;};
  fill("p1",OWN);
  const click=id=>{const target=document.getElementById(id);for(const entry of listeners)if(entry.type==="click"&&entry.capture===true)entry.listener({target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});};
  return {document,click,listeners};
}

// store: authoritative season document seen by the fake provider; publishScript: one function per expected publish call.
function makeProvider(publishScript){
  const store={revision:0,ownResult:null,rivalPublished:false};
  const reads=[],publishes=[];
  const projection=()=>{const revision=store.revision,ready=revision===2;return {ok:true,authoritative:true,managerRole:"playerOne",seasonNumber:1,revision,
    state:{phase:ready?"RESULTS_READY":"COLLECTING",revision,publishedRoles:[...(store.rivalPublished?["playerTwo"]:[]),...(store.ownResult?["playerOne"]:[])]},
    ownResult:store.ownResult?{...store.ownResult}:null,opponentResult:ready?{...RIVAL}:null,allResults:ready?{playerOne:{...store.ownResult},playerTwo:{...RIVAL}}:null};};
  const provider={
    read:async options=>{reads.push(options);return projection();},
    publishResult:async options=>{
      const index=publishes.length;publishes.push({operationId:options.operationId,baseRevision:options.baseRevision,result:{...options.result}});
      const step=publishScript[index];if(!step)throw new Error(`unexpected publishResult call #${index+1}`);
      return step(options,store,projection);
    }};
  return {provider,store,reads,publishes};
}
const accept=(options,store,projection)=>{assert.equal(options.baseRevision,store.revision,"accepted publish must carry the stored revision");store.ownResult={...options.result};store.revision+=1;return {...projection(),status:"accepted",replayed:false};};
const rivalWinsRace=(_options,store)=>{store.rivalPublished=true;store.revision+=1;return {ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"};};
const ownLandedElsewhere=(options,store)=>{store.ownResult={...options.result};store.revision+=1;return {ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"};};
const staleOnly=()=>({ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"});
const sessionLost=()=>({ok:false,code:"SEASON_RESULTS_ACTIVE_SESSION_REQUIRED"});

function makeProvider(failOnce){
  const store={revision:0,ownResult:null};
  const counts={reads:0,publishes:[]};
  const projection=()=>({ok:true,authoritative:true,managerRole:"playerOne",seasonNumber:1,revision:store.revision,
    state:{phase:"COLLECTING",revision:store.revision,publishedRoles:store.ownResult?["playerOne"]:[]},
    ownResult:store.ownResult?{...store.ownResult}:null,opponentResult:null,allResults:null});
  return {store,counts,provider:{
    read:async()=>{counts.reads+=1;return projection();},
    publishResult:async options=>{if(failOnce.on){failOnce.on=false;const error=new Error("Failed to get document because the client is offline.");error.code="unavailable";throw error;}counts.publishes.push({...options.result});store.ownResult={...options.result};store.revision+=1;return {...projection(),status:"accepted",replayed:false};}}};
}
async function flush(times=40){for(let i=0;i<times;i+=1)await new Promise(resolve=>setImmediate(resolve));}

// offline: "lose" makes the context unreadable (as offline), then the refresh fails "unavailable"; "keep": the write fails
// "unavailable" with the context readable.
async function scenario({offline}){
  const {document,click}=makeDocument();
  const failOnce={on:false},reports=[],fake=makeProvider(failOnce);
  let random=0,transferCalls=0,failNext=false;
  const sandbox={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,
    __showdown:{id:SAVE,currentRound:1,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"A",playerTwo:"B"},sharedJourney:{contractVersion:1,mode:"shared",rivalryId:RIVALRY}},
    document,
    crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i+=1)bytes[i]=(random+i)&255;random+=1;return bytes;}},
    reportApplicationError:(context,error)=>reports.push({context,code:error&&error.code}),
    ensureGameplayModules:async()=>true,
    loadRuntimeScript:async key=>{throw new Error(`unexpected runtime load ${key}`);},
    CareerModeIconGuessStep:{ensure:async()=>true,applies:()=>false,markDone(){}},CareerModeChamberMenStep:{ensure:async()=>true,applies:()=>false,markDone(){}},CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setupUpdatedAtMs:Date.parse("2026-10-01T00:00:00Z")})},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>{transferCalls+=1;if(!failNext||offline!=="lose")return true;failNext=false;
      if(offline==="lose")vm.runInContext("currentShowdown=null",sandbox);
      await sleep(20);const error=new Error("Failed to get document because the client is offline.");error.code="unavailable";throw error;},
      getState:()=>({seasonNumber:1,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
    CareerModeSparkSharedSeasonResults:fake.provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})}};
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${fs.readFileSync(path.join(ROOT,FILE),"utf8")}`,sandbox,{filename:FILE});
  const api=sandbox.CareerModeProductionSharedSeasonResults;
  assert.equal(api.install(),true);
  await api.refresh();
  click("completeSeason");
  assert.equal(document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review","Review must open before publishing");
  const button=()=>{const b=document.getElementById("confirmSeasonCompletion");return {text:b.textContent,disabled:b.disabled===true};};
  const error=()=>document.getElementById("seasonReviewError").textContent||document.getElementById("seasonEntryError").textContent;
  failNext=true;failOnce.on=offline==="keep";
  click("confirmSeasonCompletion");
  await flush();
  return {api,fake,reports,document,click,button,error,sandbox,back:()=>vm.runInContext("currentShowdown=globalThis.__showdown",sandbox),season:n=>{sandbox.__showdown.currentRound=n;}};
}

(async()=>{
  // W1-1 .. W1-3
  {
    const run=await scenario({offline:"lose"});
    await sleep(60);await flush();
    assert.equal(run.button().disabled,true,"fixture: while offline and unreadable the button is still drawn as it was (busy)");
    const readsBefore=run.fake.counts.reads;
    await sleep(2500);await flush();
    assert.equal(run.fake.counts.reads,readsBefore,"W1-3 waiting for the context reads nothing");
    run.back();
    await sleep(1400);await flush();
    const b=run.button();
    assert.equal(b.disabled,false,"W1-1 back online with the same context: CONFIRM MY RESULT is on again (it stayed off on 64e01891)");
    assert.equal(b.text,"CONFIRM MY RESULT");
    assert.match(run.error(),/offline|unavailable|failed/i,"W1-1 the failure is said");
    assert.equal(run.document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review","W1-1 still on the review of the typed result");
    ok("W1-1 the same context back: the screen is drawn again, CONFIRM MY RESULT on, the failure said");
    run.click("confirmSeasonCompletion");
    for(let i=0;i<200&&!run.api.getState()?.ownResult;i+=1)await flush(1);
    await flush();
    assert.equal(run.fake.counts.publishes.length,1,"W1-2 one publish");
    assert.deepEqual(run.fake.counts.publishes[0],OWN,"W1-2 the reviewed result unchanged");
    assert.equal(run.button().text,"RESULT CONFIRMED ✓");
    ok("W1-2 one more tap publishes the typed result once");
    ok("W1-3 waiting for the context reads nothing");
  }
  // W1-4
  {
    const run=await scenario({offline:"lose"});
    await sleep(60);run.season(2);run.back();
    await sleep(1400);await flush();
    assert.equal(run.button().disabled,true,"W1-4 the old season's review is not drawn again (its CONFIRM is not turned on) for another season");
    assert.equal(run.fake.counts.publishes.length,0);
    ok("W1-4 a different season coming back is not drawn with the old draft");
  }
  // W1-6
  {
    const run=await scenario({offline:"lose"});
    await sleep(60);run.document.getElementById("seasonEntry").classList.add("hidden");await sleep(1200);run.back();
    await sleep(1400);await flush();
    assert.equal(run.button().disabled,true,"W1-6 off the Season Results screen the check has stopped: nothing is drawn");
    run.document.getElementById("seasonEntry").classList.remove("hidden");await sleep(1400);await flush();
    assert.equal(run.button().disabled,true,"W1-6 and it does not start again by itself");
    ok("W1-6 the check stops for good once the Season Results screen is not on (never draws over another screen)");
  }
  // W1-5
  {
    const run=await scenario({offline:"keep"});
    await sleep(60);await flush();
    assert.equal(run.button().disabled,false,"W1-5 readable context: the button is on at once");
    assert.match(run.error(),/offline/i,"W1-5 and the failure is said at once");
    assert.equal(run.reports.length,1,"W1-5 reported once, as before");
    ok("W1-5 a failure with the context readable is shown at once, as before");
  }
  console.log(`r91-confirm-after-outage: ${checks} checks passed`);
  process.exit(0);
})().catch(error=>{console.error(error);process.exit(1);});
