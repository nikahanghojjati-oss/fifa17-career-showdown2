"use strict";
// JOB-1611: Daniel and Nik tap PUBLISH MY SEASON RESULT at the same moment. Under Firestore lock contention both
// same-moment commits can fail together: the rival's commit is ABORTED and the SDK quietly retries it a second later,
// while this manager's publish comes back as aborted (SDK retries spent, "Transaction lock timeout") or permission-denied
// (Rules saw a contended read and the provider's bounded re-reads ended before the rival's retried write landed).
// Before the fix the production adapter retried only SEASON_RESULTS_STALE_BASE_REVISION, so that manager was left on
// seasonEntry with "Your shared Season Result could not be published." while the rival converged.
//   P1. aborted, rival lands a moment later -> re-read, publish again with the fresh baseRevision and the same operationId.
//   P2. permission-denied, rival still pending -> retry; the retry loses to the rival (STALE) -> one more re-read -> accepted.
//   P3. every contention spelling (aborted, failed-precondition, permission-denied x3) recovers.
//   P4. an own write that landed although the call reported aborted is bound, never written twice.
//   P5. contention that never clears is surfaced exactly as before after a bounded 1 + 3 publishes; rival stays hidden.
//   P6. refusals that are not contention (session, idempotency, private state) are still surfaced after one publish.
//   P7. the real Spark provider hands an SDK ABORTED through as {ok:false,code:"aborted"}, the code P1 recovers from.
//   P8. the reads inside a publish (before it, and after a STALE) get the same bounded wait; other read refusals do not.
// Node only; no emulator. Scoring, saves, privacy and tap order are untouched.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const FILE="js/productionSharedSeasonResults.js";
const RIVALRY="pair_"+"a".repeat(64);
const SESSION="session_"+"b".repeat(64);
const DEVICE="device_"+"c".repeat(32);
const SAVE="save_"+"d".repeat(24);
const OWN={leaguePosition:3,leaguePoints:70,leagueGoals:66,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const RIVAL={leaguePosition:1,leaguePoints:100,leagueGoals:80,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
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

// The fake provider keeps the authoritative season-2 document. publishScript holds one step per expected publishResult call.
function makeProvider(publishScript,readScript={}){
  const store={revision:0,ownResult:null,rivalPublished:false};
  const reads=[],publishes=[];
  const projection=()=>{const revision=store.revision,ready=revision===2;return {ok:true,authoritative:true,managerRole:"playerOne",seasonNumber:2,revision,
    state:{phase:ready?"RESULTS_READY":revision===1?"COLLECTING":null,revision,publishedRoles:[...(store.rivalPublished?["playerTwo"]:[]),...(store.ownResult?["playerOne"]:[])]},
    ownResult:store.ownResult?{...store.ownResult}:null,opponentResult:ready?{...RIVAL}:null,allResults:ready?{playerOne:{...store.ownResult},playerTwo:{...RIVAL}}:null};};
  const provider={
    read:async options=>{const index=reads.length;reads.push(options);return readScript[index]?readScript[index](store,projection):projection();},
    publishResult:async options=>{
      const index=publishes.length;publishes.push({operationId:options.operationId,baseRevision:options.baseRevision,result:{...options.result}});
      const step=publishScript[index];if(!step)throw new Error(`unexpected publishResult call #${index+1}`);
      return step(options,store,projection);
    }};
  return {provider,store,reads,publishes};
}
const rivalLands=store=>{if(!store.rivalPublished){store.rivalPublished=true;store.revision+=1;}};
// The rival's commit was aborted with ours; its SDK retry lands a moment after our publish call has failed.
const contendedRivalLater=code=>(_options,store)=>{setTimeout(()=>rivalLands(store),50);return {ok:false,code};};
const contendedRivalPending=code=>()=>({ok:false,code});
const rivalWinsRace=(_options,store)=>{rivalLands(store);return {ok:false,code:"SEASON_RESULTS_STALE_BASE_REVISION"};};
const accept=(options,store,projection)=>{assert.equal(options.baseRevision,store.revision,"an accepted publish must carry the stored revision");assert.equal(store.ownResult,null,"an accepted publish must be the first own write");store.ownResult={...options.result};store.revision+=1;return {...projection(),status:"accepted",replayed:false};};
const ownLandedButAborted=(options,store)=>{store.ownResult={...options.result};store.revision+=1;return {ok:false,code:"aborted"};};
const refused=code=>()=>({ok:false,code});

async function scenario(publishScript,{waitMs=8000,readScript={}}={}){
  const {document,click,listeners}=makeDocument();
  const reports=[];
  const fake=makeProvider(publishScript,readScript);
  let random=0;
  const sandbox={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,
    __showdown:{id:SAVE,currentRound:2,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"A",playerTwo:"B"},sharedJourney:{contractVersion:1,mode:"shared",rivalryId:RIVALRY}},
    document,
    crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i+=1)bytes[i]=(random+i)&255;random+=1;return bytes;}},
    reportApplicationError:(context,error)=>reports.push({context,code:error&&error.code,message:error&&error.message}),
    ensureGameplayModules:async()=>true,
    loadRuntimeScript:async key=>{throw new Error(`unexpected runtime load ${key}`);},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE})},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>true,getState:()=>({seasonNumber:2,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
    CareerModeSparkSharedSeasonResults:fake.provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})}};
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${fs.readFileSync(path.join(ROOT,FILE),"utf8")}`,sandbox,{filename:FILE});
  const api=sandbox.CareerModeProductionSharedSeasonResults;
  assert.equal(api.install(),true);
  const initial=await api.refresh();
  assert.equal(initial&&initial.revision,0,"fixture must start from an unpublished season");
  click("completeSeason");
  assert.equal(document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review","Review must open before publishing");
  click("confirmSeasonCompletion");
  const confirm=document.getElementById("confirmSeasonCompletion");
  const started=Date.now();
  // Done when the publish settled: an error was reported or the own result is bound; then let the final render run.
  while(Date.now()-started<waitMs&&!(reports.length||api.getState()?.ownResult))await new Promise(resolve=>setTimeout(resolve,10));
  await new Promise(resolve=>setTimeout(resolve,50));
  return {api,fake,reports,document,confirm,elapsed:Date.now()-started};
}
const errorText=document=>document.getElementById("seasonReviewError").textContent||document.getElementById("seasonEntryError").textContent;

function assertConverged(run,label){
  assert.deepEqual(run.reports,[],`${label}: a recovered same-moment publish must not report an error`);
  assert.equal(errorText(run.document),"",`${label}: no error banner after recovery`);
  assert.deepEqual({...run.api.getState().ownResult},OWN,`${label}: the reviewed result is the published result`);
  for(const entry of run.fake.publishes){
    assert.equal(entry.operationId,run.fake.publishes[0].operationId,`${label}: every retry keeps the reviewed draft operationId`);
    assert.deepEqual(entry.result,OWN,`${label}: every retry publishes the reviewed result unchanged`);
  }
  assert.match(run.fake.publishes[0].operationId,/^season_result_op_[0-9a-f]{32}$/);
}

async function p1AbortedRivalLandsLater(){
  const run=await scenario([contendedRivalLater("aborted"),accept]);
  assert.equal(run.fake.publishes.length,2,"P1 an aborted same-moment publish is published again once the rival landed");
  assert.equal(run.fake.publishes[0].baseRevision,0);
  assert.equal(run.fake.publishes[1].baseRevision,1,"P1 the retry uses the freshly re-read revision");
  assertConverged(run,"P1");
  assert.equal(run.api.getState().state.phase,"RESULTS_READY","P1 both managers published");
  ok("P1 aborted publish + rival landing a moment later -> re-read and one more publish reach RESULTS_READY");
}

async function p2DeniedRivalPending(){
  const run=await scenario([contendedRivalPending("permission-denied"),rivalWinsRace,accept]);
  assert.deepEqual(run.fake.publishes.map(entry=>entry.baseRevision),[0,0,1],"P2 denied, then stale against the landed rival, then accepted at the fresh revision");
  assertConverged(run,"P2");
  assert.equal(run.api.getState().state.phase,"RESULTS_READY");
  ok("P2 permission-denied while the rival's write is still pending -> retry, one STALE re-read, accepted");
}

async function p3EveryContentionSpelling(){
  for(const code of ["aborted","failed-precondition","permission-denied","firestore/permission-denied","permission_denied"]){
    const run=await scenario([contendedRivalLater(code),accept]);
    assert.equal(run.fake.publishes.length,2,`P3 ${code} is retried`);
    assertConverged(run,`P3 ${code}`);
  }
  ok("P3 aborted, failed-precondition and every permission-denied spelling are treated as same-moment contention");
}

async function p4OwnWriteLanded(){
  const run=await scenario([ownLandedButAborted]);
  assert.equal(run.fake.publishes.length,1,"P4 an own result that already landed is bound, never written twice");
  assertConverged(run,"P4");
  assert.equal(run.confirm.textContent,"PUBLISHED ✓","P4 the manager sees the published state");
  ok("P4 an aborted call whose own write landed binds the published result without a second publish");
}

async function p5BoundedThenSurfaced(){
  const run=await scenario([refused("aborted"),refused("aborted"),refused("aborted"),refused("aborted")],{waitMs:12000});
  assert.equal(run.fake.publishes.length,4,"P5 contention retries stay bounded to 1 + 3 publishes");
  assert.equal(run.reports.length,1,"P5 unresolved contention is still reported");
  assert.equal(run.reports[0].code,"aborted");
  assert.equal(errorText(run.document),"Your shared Season Result could not be published.","P5 the same error as before is shown");
  assert.equal(run.api.getState().ownResult,null);
  assert.equal(run.document.getElementById("seasonReviewTwo").classList.contains("hidden"),true,"P5 the rival's card stays hidden before both published");
  assert.equal(JSON.stringify(run.document.getElementById("seasonReviewTwo").children).includes("100"),false,"P5 the rival's result is never rendered");
  assert.equal(run.confirm.disabled,false,"P5 the manager can tap PUBLISH again");
  assert.ok(run.elapsed<10000,`P5 the bounded retries finish quickly (${run.elapsed} ms)`);
  ok("P5 contention that never clears is surfaced unchanged after exactly four publishes, rival still private");
}

async function p6RefusalsNotRetried(){
  for(const code of ["SEASON_RESULTS_ACTIVE_SESSION_REQUIRED","SEASON_RESULTS_IDEMPOTENCY_CONFLICT","SEASON_RESULTS_PRIVATE_STATE_INVALID","SEASON_RESULTS_ROLE_ALREADY_PUBLISHED"]){
    const run=await scenario([refused(code)]);
    assert.equal(run.fake.publishes.length,1,`P6 ${code} is not retried`);
    assert.equal(run.reports.length,1);
    assert.equal(run.reports[0].code,code);
  }
  const twice=await scenario([refused("SEASON_RESULTS_STALE_BASE_REVISION"),refused("SEASON_RESULTS_STALE_BASE_REVISION")]);
  assert.equal(twice.fake.publishes.length,2,"P6 a second stale publish is still surfaced after two attempts");
  assert.equal(twice.reports[0].code,"SEASON_RESULTS_STALE_BASE_REVISION");
  ok("P6 refusals that are not contention are surfaced after one publish; stale stays bounded to two");
}

async function p7ProviderPassesAbortedThrough(){
  const Provider=require(path.join(ROOT,"js/sparkSharedSeasonResults.js"));
  const runtime=fs.readFileSync(path.join(ROOT,"js/productionFirebaseRuntime.js"),"utf8");
  const keys=runtime.match(/firestoreSdk:Object\.freeze\(\{([^}]*)\}\)/)[1].split(",").map(part=>part.split(":")[0].trim()).sort();
  let runs=0;
  // Production-shaped SDK (no getDoc): the league projection preflight succeeds, the publish transaction hits lock contention.
  const sdk={Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({toMillis:()=>2_000_000}),doc:(_db,...parts)=>parts.join("/"),
    runTransaction:async()=>{runs+=1;if(runs===1)return 20;const error=new Error("10 ABORTED: Transaction lock timeout.");error.name="FirebaseError";error.code="aborted";throw error;}};
  assert.deepEqual(Object.keys(sdk).sort(),keys,"P7 the fake SDK has exactly the production bundle's keys");
  const out=await Provider.publishResult({user:{uid:"uid_daniel"},firestore:{},firebaseSdk:sdk,rivalryId:`pair_${"3".repeat(64)}`,sessionId:SESSION,deviceId:DEVICE,seasonNumber:2,operationId:`season_result_op_${"1".repeat(32)}`,baseRevision:0,result:OWN,cryptoImpl:webcrypto,nowEpochMs:2_000_000});
  assert.deepEqual(out,{ok:false,code:"aborted"},"P7 the provider answers the contention code the adapter recovers from");
  assert.equal(runs,2,"P7 preflight plus one publish transaction; the provider itself adds no retry");
  ok("P7 the real Spark provider surfaces SDK lock contention as {ok:false,code:\"aborted\"}");
}

async function p8ContendedReadsInsidePublish(){
  // read #0 is the screen's own refresh; #1 is the read just before publishing.
  let run=await scenario([accept],{readScript:{1:()=>({ok:false,code:"permission-denied"})}});
  assert.equal(run.fake.publishes.length,1,"P8 a contended pre-publish read is retried, then the publish goes through");
  assert.ok(run.fake.reads.length>=3,"P8 the contended read was read again");
  assertConverged(run,"P8 pre-publish read");
  run=await scenario([rivalWinsRace,accept],{readScript:{2:()=>({ok:false,code:"aborted"})}});
  assert.deepEqual(run.fake.publishes.map(entry=>entry.baseRevision),[0,1],"P8 a contended re-read after STALE is retried and the publish uses the fresh revision");
  assertConverged(run,"P8 stale re-read");
  run=await scenario([],{readScript:{1:()=>({ok:false,code:"SEASON_RESULTS_ACTIVE_SESSION_REQUIRED"})}});
  assert.equal(run.fake.publishes.length,0,"P8 a refused pre-publish read never publishes");
  assert.equal(run.fake.reads.length,2,"P8 a refused read is not retried");
  assert.equal(run.reports[0].code,"SEASON_RESULTS_ACTIVE_SESSION_REQUIRED");
  assert.equal(errorText(run.document),"Shared Season Results could not be refreshed before publishing.");
  ok("P8 contended reads inside a publish are retried within the same bound; refused reads surface at once");
}

(async()=>{
  await p1AbortedRivalLandsLater();
  await p2DeniedRivalPending();
  await p3EveryContentionSpelling();
  await p4OwnWriteLanded();
  await p5BoundedThenSurfaced();
  await p6RefusalsNotRetried();
  await p7ProviderPassesAbortedThrough();
  await p8ContendedReadsInsidePublish();
  console.log(`PASS JOB-1611 simultaneous Season Result publish contracts (${checks} checks): contention is re-read and retried with the same operationId, bounded, privacy unchanged.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
