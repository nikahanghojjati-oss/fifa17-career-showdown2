"use strict";
// Regression: when both managers publish their Season Result at the same moment, the loser of the
// Firestore CAS gets SEASON_RESULTS_STALE_BASE_REVISION. The production adapter must re-read once and
// retry once with the fresh baseRevision (same operationId), bind an already-published own result without
// a second write, and surface a second stale or any other error exactly as before. Node only; no emulator.
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

async function flush(times=40){for(let i=0;i<times;i+=1)await new Promise(resolve=>setImmediate(resolve));}

async function scenario(publishScript){
  const {document,click,listeners}=makeDocument();
  const reports=[];
  const fake=makeProvider(publishScript);
  let random=0;
  const sandbox={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,
    __showdown:{id:SAVE,currentRound:1,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"A",playerTwo:"B"},sharedJourney:{contractVersion:1,mode:"shared",rivalryId:RIVALRY}},
    document,
    crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i+=1)bytes[i]=(random+i)&255;random+=1;return bytes;}},
    reportApplicationError:(context,error)=>reports.push({context,code:error&&error.code,message:error&&error.message}),
    ensureGameplayModules:async()=>true,
    loadRuntimeScript:async key=>{throw new Error(`unexpected runtime load ${key}`);},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE})},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>true,getState:()=>({seasonNumber:1,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
    CareerModeSparkSharedSeasonResults:fake.provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})}};
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${fs.readFileSync(path.join(ROOT,FILE),"utf8")}`,sandbox,{filename:FILE});
  const api=sandbox.CareerModeProductionSharedSeasonResults;
  assert.equal(api.install(),true);
  assert.equal(listeners.filter(entry=>entry.type==="click"&&entry.capture===true).length,1,"adapter must install one capture click listener");
  const initial=await api.refresh();
  assert.equal(initial&&initial.revision,0,"fixture must start from an unpublished season");
  click("completeSeason");
  assert.equal(document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review","Review must open before publishing");
  click("confirmSeasonCompletion");
  for(let i=0;i<200&&!(reports.length||api.getState()?.ownResult);i+=1)await flush(1);
  await flush();
  return {api,fake,reports,document};
}

(async()=>{
  // (1) rival wins the race: one bounded retry with the fresh revision and the same operationId succeeds.
  let run=await scenario([rivalWinsRace,accept]);
  assert.equal(run.fake.publishes.length,2,"a stale first publish must be retried exactly once");
  assert.equal(run.fake.publishes[0].baseRevision,0);
  assert.equal(run.fake.publishes[1].baseRevision,1,"retry must use the freshly read revision");
  assert.equal(run.fake.publishes[1].operationId,run.fake.publishes[0].operationId,"retry must keep the reviewed draft operationId");
  assert.match(run.fake.publishes[0].operationId,/^season_result_op_[0-9a-f]{32}$/);
  assert.deepEqual(run.fake.publishes[1].result,OWN,"retry must publish the reviewed result unchanged");
  assert.deepEqual(run.reports,[],"a recovered race must not report an error");
  assert.equal(run.api.getState().state.phase,"RESULTS_READY");
  assert.deepEqual({...run.api.getState().ownResult},OWN);
  assert.equal(run.document.getElementById("seasonReviewError").textContent,"");
  ok("stale publish is re-read and retried once with the fresh baseRevision and the same operationId");

  // (2) re-read shows this manager's result already published: bind it, no second write.
  run=await scenario([ownLandedElsewhere]);
  assert.equal(run.fake.publishes.length,1,"an already-published own result must not be written again");
  assert.deepEqual(run.reports,[]);
  assert.deepEqual({...run.api.getState().ownResult},OWN);
  assert.equal(run.document.getElementById("confirmSeasonCompletion").textContent,"PUBLISHED ✓");
  ok("stale publish whose re-read shows the own result binds it without a second publish");

  // (3) stale twice: the bounded retry gives up and surfaces the stale error.
  run=await scenario([staleOnly,staleOnly]);
  assert.equal(run.fake.publishes.length,2,"retry must stay bounded to two publish attempts");
  assert.equal(run.reports.length,1);
  assert.equal(run.reports[0].code,"SEASON_RESULTS_STALE_BASE_REVISION");
  assert.equal(run.api.getState().ownResult,null);
  assert.equal(run.document.getElementById("seasonReviewError").textContent||run.document.getElementById("seasonEntryError").textContent,"Your shared Season Result could not be published.");
  ok("second stale publish surfaces SEASON_RESULTS_STALE_BASE_REVISION after exactly two attempts");

  // (4) a non-stale rejection is never retried.
  run=await scenario([sessionLost]);
  assert.equal(run.fake.publishes.length,1,"non-stale rejections must not be retried");
  assert.equal(run.reports.length,1);
  assert.equal(run.reports[0].code,"SEASON_RESULTS_ACTIVE_SESSION_REQUIRED");
  assert.equal(run.api.getState().ownResult,null);
  ok("non-stale publish rejection surfaces after exactly one attempt");

  console.log(`PASS shared Season Results stale-base retry contracts (${checks} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
