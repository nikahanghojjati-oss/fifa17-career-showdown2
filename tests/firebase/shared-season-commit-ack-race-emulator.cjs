"use strict";

// r80 regression: a manager taps ACKNOWLEDGE before the rival's acknowledgement has reached his page.
// Two "pages" (one per manager) each run the REAL production Season Commit adapter
// (js/productionSharedSeasonCommit.js), the REAL Firestore budget layer of that page (js/sparkPrivatePairing.js:
// cached reads and the wait-point listener) and the REAL Journey Conflicts guard, over the REAL Spark provider,
// against the generated production Rules in the Firestore emulator. Only the DOM is a stub, and each page's
// Firestore listener can be held back so the rival's write has landed on the server but not yet on that page.
//
// Before the fix: the tap read the commit from the listener (revision 1), its transaction met revision 2 on the
// server and returned STALE, and the one bounded re-read was again answered by the listener that the page already
// knew was behind the server, so the retry repeated the same stale base and the page showed
// "Your shared season acknowledgement could not be recorded" with ACKNOWLEDGE back on screen.
// After: any order, any timing, both acknowledgements are recorded once, no error, no ACKNOWLEDGE flash.
//
// A1 Daniel (coordinator) taps COMMIT & ACKNOWLEDGE; Nik taps ACKNOWLEDGE before Daniel's acknowledgement reaches him.
// A2 mirror: Nik acknowledges first; Daniel taps ACKNOWLEDGE before Nik's acknowledgement reaches him.
// A3 both tap ACKNOWLEDGE in the same instant, neither page having seen the other (repeated).
// A4 Nik taps ACKNOWLEDGE the moment the commit shows, while Daniel's COMMIT & ACKNOWLEDGE is still writing (repeated).

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp,onSnapshot}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const ROOT=path.resolve(__dirname,"../..");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const CommitProtocol=require("../../js/sharedSeasonCommit.js");
const ResultsProtocol=require("../../js/sharedSeasonResults.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-gameplay-fast-season-ack";
const RULES=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
const PAIRING_SOURCE=fs.readFileSync(path.join(ROOT,"js/sparkPrivatePairing.js"),"utf8");
const BUDGET_MARK="// Firestore budget layer (r75).";
assert.ok(PAIRING_SOURCE.indexOf(BUDGET_MARK)>0,"the Firestore budget layer lives at the end of js/sparkPrivatePairing.js");
const BUDGET_SOURCE=PAIRING_SOURCE.slice(PAIRING_SOURCE.indexOf(BUDGET_MARK));
const ADAPTER_SOURCE=fs.readFileSync(path.join(ROOT,"js/productionSharedSeasonCommit.js"),"utf8");
const CONFLICTS_SOURCE=fs.readFileSync(path.join(ROOT,"js/productionSharedJourneyConflicts.js"),"utf8");
const GUARD_SOURCE=fs.readFileSync(path.join(ROOT,"js/sharedJourneyConflicts.js"),"utf8");
const A="acct_ackrace_daniel",B="acct_ackrace_nik";
const R=`pair_${"5".repeat(64)}`;
const S=`session_${"8".repeat(64)}`;
const DA=`device_${"c".repeat(32)}`,DB=`device_${"d".repeat(32)}`;
const PA=`profile_${"5".repeat(24)}`,PB=`profile_${"6".repeat(24)}`;
const SA=`save_${"7".repeat(24)}`,SB=`save_${"8".repeat(24)}`;
const COMMIT_PATH=`rivalries/${R}/seasonCommits/season_1`;
// CMS_ACK_RACE_ROUNDS repeats the timing scenarios more often for a local soak (default 3).
const ROUNDS=Math.max(1,Number(process.env.CMS_ACK_RACE_ROUNDS)||3);
const ACK_LABEL="CONFIRM SEASON",FAILED="Your season confirmation could not be saved.";

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
]}};}
function session(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function result(role){return role==="playerOne"
  ?{leaguePosition:1,leaguePoints:102,leagueGoals:89,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false}
  :{leaguePosition:3,leaguePoints:88,leagueGoals:85,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check,label,timeoutMs=15000){const until=Date.now()+timeoutMs;for(;;){const value=await check();if(value)return value;if(Date.now()>until)throw new Error(`timed out waiting for ${label}`);await sleep(5);}}

// The real providers through the real generated Rules up to RESULTS_READY for season 1 (Daniel = playerOne = coordinator).
async function prepareResultsReady(env){
  await env.clearFirestore();
  const now=Date.now();
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",R),rivalry());await setDoc(doc(db,"rivalries",R,"sessions",S),session(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const base=(db,uid,deviceId,t)=>({user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId,nowEpochMs:now+t,cryptoImpl:crypto.webcrypto});
  const a=t=>base(dbA,A,DA,t),b=t=>base(dbB,B,DB,t);
  const expectOk=(value,label)=>{assert.equal(value.ok,true,`${label} failed: ${JSON.stringify(value)}`);return value;};
  const setupOps=[["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:3}]];
  for(const [type,baseRevision,n,extra] of setupOps)expectOk(await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}),`Setup ${type}`);
  expectOk(await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}),"Setup confirm A");
  const confirmed=expectOk(await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}),"Setup confirm B");
  assert.equal(confirmed.state.phase,"SHOWDOWN_CONFIRMED");
  expectOk(await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}),"Career A");
  expectOk(await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}),"Career B");
  const s=1,o=10_000;
  expectOk(await startAfterSpins({...a(o+100),seasonNumber:s,operationId:op("transfer_op_",11),baseRevision:0},{...b(o+100),seasonNumber:s}),"Transfer start");
  expectOk(await Transfer.requestEndWindow({...a(o+200),seasonNumber:s,operationId:op("transfer_op_",12),baseRevision:1}),"Transfer end A");
  expectOk(await Transfer.requestEndWindow({...b(o+300),seasonNumber:s,operationId:op("transfer_op_",13),baseRevision:2}),"Transfer end B");
  expectOk(await Transfer.lockGuesses({...a(o+400),seasonNumber:s,operationId:op("transfer_op_",14),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"},{slot:3,type:"league",valueId:"germany-bundesliga"}]}),"Guesses A");
  expectOk(await Transfer.lockGuesses({...b(o+500),seasonNumber:s,operationId:op("transfer_op_",15),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"},{slot:3,type:"nationality",valueId:"albania"}]}),"Guesses B");
  expectOk(await Transfer.lockSignings({...a(o+600),seasonNumber:s,operationId:op("transfer_op_",16),baseRevision:5,signings:[{slot:1,name:"Daniel A",leagueId:"spain-primera-division",nationalityId:"england"},{slot:2,name:"Daniel B",leagueId:"australia-a-league",nationalityId:"albania"},{slot:3,name:"Daniel C",leagueId:"germany-bundesliga",nationalityId:"france"}]}),"Signings A");
  const done=expectOk(await Transfer.lockSignings({...b(o+700),seasonNumber:s,operationId:op("transfer_op_",17),baseRevision:6,signings:[{slot:1,name:"Nik A",leagueId:"england-premier-league",nationalityId:"brazil"},{slot:2,name:"Nik B",leagueId:"italy-serie-a",nationalityId:"germany"},{slot:3,name:"Nik C",leagueId:"france-ligue-1",nationalityId:"albania"}]}),"Signings B");
  assert.equal(done.state.phase,"COMPLETED");
  expectOk(await Results.publishResult({...a(o+800),seasonNumber:s,operationId:op("season_result_op_",11),baseRevision:0,result:result("playerOne")}),"Result A");
  const ready=expectOk(await Results.publishResult({...b(o+900),seasonNumber:s,operationId:op("season_result_op_",12),baseRevision:1,result:result("playerTwo")}),"Result B");
  assert.equal(ready.state.phase,"RESULTS_READY");
  // A coordinator commit without its acknowledgement half (the R7 state the adapter already supports).
  const commitOnly=async()=>expectOk(await Commit.commitSeason({...a(o+1000),seasonNumber:s,operationId:op("season_commit_op_",11),baseRevision:0}),"Coordinator commit");
  return {commitOnly};
}
async function storedCommit(env){let value=null;await env.withSecurityRulesDisabled(async context=>{const snap=await getDoc(doc(context.firestore(),COMMIT_PATH));value=snap.exists()?snap.data():null;});return value;}

// ---- one page: stub DOM + the real budget layer, conflict guard and Season Commit adapter -------------------------
class StubNode{
  constructor(page,tag,id=""){this.page=page;this.tag=tag;this.id=id;this._text="";this._disabled=false;this.hiddenSet=new Set();this.parentNode=null;
    this.classList={toggle:(name,force)=>{const on=force===undefined?!this.hiddenSet.has(name):Boolean(force);if(on)this.hiddenSet.add(name);else this.hiddenSet.delete(name);return on;},contains:name=>this.hiddenSet.has(name),add:name=>this.hiddenSet.add(name),remove:name=>this.hiddenSet.delete(name)};}
  get textContent(){return this._text;}
  set textContent(value){this._text=String(value);this.page.trace(this,"text");}
  get disabled(){return this._disabled;}
  set disabled(value){this._disabled=Boolean(value);this.page.trace(this,"disabled");}
  setAttribute(){}
  closest(selector){return selector==="button"&&this.tag==="button"?this:null;}
  insertBefore(child){child.parentNode=this;this.page.adopt(child);return child;}
  prepend(child){child.parentNode=this;this.page.adopt(child);}
  querySelector(selector){return selector===".seasonReviewActions"?this.page.actions:null;}
}
function createPage(env,{name,uid,deviceId,role}){
  const db=env.authenticatedContext(uid).firestore();
  const elements=new Map(),listeners={click:[]},intervals=[],trail=[],reports=[];
  const gate={maxRevision:Infinity,held:[]};
  const page={name,role,gate,trail,reports,intervals,errors:[],tapAt:null,stops:[]};
  page.adopt=node=>{if(node.id)elements.set(node.id,node);};
  page.trace=(node,kind)=>{
    if(node.id==="seasonReviewError"&&kind==="text"&&node._text)page.errors.push(node._text);
    if(node.id==="sharedSeasonCommitAction")trail.push({at:Date.now(),text:node._text,disabled:node._disabled});
  };
  const panel=new StubNode(page,"section","seasonReviewPanel"),actions=new StubNode(page,"div","");actions.parentNode=panel;page.actions=actions;
  for(const node of [new StubNode(page,"section","seasonEntry"),panel,new StubNode(page,"p","seasonReviewError")])elements.set(node.id,node);
  const document={visibilityState:"visible",documentElement:{dataset:{}},
    getElementById:id=>elements.get(id)||null,
    createElement:tag=>new StubNode(page,tag),
    addEventListener:(type,fn)=>{(listeners[type]=listeners[type]||[]).push(fn);}};
  // The page's Firestore listener: deliveries of a commit revision above gate.maxRevision are held back (and every
  // later one, in order) until release(): the rival's write is on the server but has not reached this page yet.
  const gatedOnSnapshot=(ref,options,next,error)=>{
    const deliver=snapshot=>{
      if(ref.path===COMMIT_PATH&&!snapshot.metadata.fromCache){const revision=snapshot.exists()?Number(snapshot.data().revision||0):0;if(gate.held.length||revision>gate.maxRevision){gate.held.push(()=>next(snapshot));return;}}
      next(snapshot);
    };
    const stop=onSnapshot(ref,options,deliver,error);page.stops.push(stop);return stop;
  };
  const services={ok:true,auth:{currentUser:{uid}},firestore:db,firestoreSdk:{doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp,Timestamp,onSnapshot:gatedOnSnapshot}};
  const showdown={id:`shell_${name}`,currentRound:1,sharedJourney:{mode:"shared",rivalryId:R},managers:{playerOne:"Daniel",playerTwo:"Nik"}};
  const setupState={ready:true,rivalryId:R,sessionId:S,deviceId,accountId:uid,managerRole:role,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:3}};
  const resultsState={rivalryId:R,seasonNumber:1,state:{phase:"RESULTS_READY",revision:2},allResults:{playerOne:result("playerOne"),playerTwo:result("playerTwo")}};
  const sandbox={
    console,document,crypto:crypto.webcrypto,TextEncoder,Uint8Array,
    setTimeout,clearTimeout,setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length;},clearInterval(){},
    addEventListener(){},dispatchEvent(){return true;},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    reportApplicationError:(context,error)=>reports.push(`${context}: ${error&&(error.code||error.message)}`),
    currentShowdown:showdown,
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setupState,getState:()=>setupState},
    CareerModeProductionSharedSeasonResults:{refresh:async()=>resultsState,getState:()=>resultsState},
    CareerModeSharedShowdownCatalog:{},CareerModeSharedShowdownSetup:{},
    CareerModeSharedSeasonResults:ResultsProtocol,CareerModeSharedSeasonCommit:CommitProtocol,
    CareerModeSparkSharedSeasonCommit:Commit,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>services}
  };
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:"js/sparkPrivatePairing.js#budget"});
  // The guard checks plain objects by prototype, so it runs in the page's own realm like in the browser.
  vm.runInContext(GUARD_SOURCE,sandbox,{filename:"js/sharedJourneyConflicts.js"});
  vm.runInContext(CONFLICTS_SOURCE,sandbox,{filename:"js/productionSharedJourneyConflicts.js"});
  vm.runInContext(ADAPTER_SOURCE,sandbox,{filename:"js/productionSharedSeasonCommit.js"});
  const api=sandbox.CareerModeProductionSharedSeasonCommit,budget=sandbox.CareerModeFirestoreBudget;
  assert.ok(api&&budget&&sandbox.CareerModeProductionSharedJourneyConflicts,"adapter, budget layer and conflict guard load");
  page.api=api;page.budget=budget;
  page.button=()=>elements.get("sharedSeasonCommitAction")||null;
  page.view=()=>api.getState();
  page.release=()=>{gate.maxRevision=Infinity;const held=gate.held.splice(0);for(const deliver of held)deliver();};
  // The 3 s waiting check (attaches the wait-point listener exactly as the page's own timer does).
  page.fastTick=()=>{for(const timer of intervals)if(timer.ms===3000)timer.fn();};
  page.tap=()=>{
    const button=page.button();assert.ok(button,`${name}: the Season Commit button is on screen`);
    assert.equal(button.disabled,false,`${name}: the button is enabled when tapped ("${button.textContent}")`);
    page.tapAt=Date.now();page.tapTrail=trail.length;
    const event={target:button,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
    for(const fn of listeners.click)fn(event);
  };
  page.watching=async()=>{
    await waitFor(()=>{page.fastTick();const stats=budget.stats();return stats.watching===COMMIT_PATH&&stats.watchHealthy;},`${name}: wait-point listener on the season commit`);
  };
  page.close=()=>{try{budget.reset();}catch(_error){}for(const stop of page.stops.splice(0))try{stop();}catch(_error){}};
  api.install();
  return page;
}
// The tap's outcome: settled when the page shows its acknowledgement (or an error).
async function settled(page){
  await waitFor(()=>{const view=page.view();return page.errors.length>0||(view&&(view.ownAcknowledged||view.phase==="ACKNOWLEDGED")&&page.button()?.textContent!==ACK_LABEL);},`${page.name}: acknowledgement recorded`);
  await sleep(50);
}
function assertSmooth(page){
  assert.deepEqual(page.errors,[],`${page.name}: no Season Commit error (${page.errors.join(" | ")}; reported: ${page.reports.join(" | ")})`);
  assert.equal(page.reports.filter(line=>/Season Commit/.test(line)).length,0,`${page.name}: nothing reported (${page.reports.join(" | ")})`);
  const after=page.trail.slice(page.tapTrail);
  const flash=after.find(entry=>entry.text===ACK_LABEL&&entry.disabled===false);
  assert.equal(flash,undefined,`${page.name}: ACKNOWLEDGE never comes back on screen after the tap`);
}
async function assertConverged(env,pages){
  const stored=await storedCommit(env);
  assert.equal(stored.phase,"ACKNOWLEDGED");assert.equal(stored.revision,3);
  assert.deepEqual([...stored.acknowledgedRoles].sort(),["playerOne","playerTwo"],"each manager acknowledged exactly once");
  assert.equal(stored.actorRoles[0],"playerOne");assert.equal(new Set(stored.operationIds).size,3);
  for(const page of pages)page.release();
  for(const page of pages)await waitFor(async()=>{const view=page.view();if(view&&view.phase==="ACKNOWLEDGED")return true;await page.api.refresh();return page.view()?.phase==="ACKNOWLEDGED";},`${page.name}: ACKNOWLEDGED on screen`);
  for(const page of pages)assert.equal(page.button().textContent,"SEASON CONFIRMED ✓");
  return stored;
}
async function openPages(env){
  const daniel=createPage(env,{name:"Daniel",uid:A,deviceId:DA,role:"playerOne"}),nik=createPage(env,{name:"Nik",uid:B,deviceId:DB,role:"playerTwo"});
  return {daniel,nik,close:()=>{daniel.close();nik.close();}};
}
async function showsAck(page){
  await waitFor(async()=>{const view=page.view();if(view&&view.committed&&!view.ownAcknowledged&&page.button()?.textContent===ACK_LABEL&&!page.button().disabled)return true;await page.api.refresh();return false;},`${page.name}: ACKNOWLEDGE on screen`);
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  let failures=0;
  const scenario=async(label,run)=>{try{await run();process.stdout.write(`ok ${label}\n`);}catch(error){failures+=1;process.stdout.write(`FAIL ${label}\n  ${String(error&&error.stack||error).split("\n").slice(0,3).join("\n  ")}\n`);}};
  try{
    await scenario("A1 Daniel's COMMIT & ACKNOWLEDGE lands, Nik taps ACKNOWLEDGE before it reaches his page: recorded, no error, no flash",async()=>{
      await prepareResultsReady(env);const {daniel,nik,close}=await openPages(env);
      try{
        await daniel.api.refresh();await nik.api.refresh();
        await daniel.watching();await nik.watching();
        nik.gate.maxRevision=1;daniel.tap();
        await settled(daniel);assertSmooth(daniel);
        await waitFor(async()=>(await storedCommit(env))?.revision===2,"Daniel's acknowledgement on the server");
        await showsAck(nik);
        assert.equal(nik.gate.held.length>0||nik.view().revision===1,true,"Nik's page has not seen Daniel's acknowledgement");
        nik.tap();await settled(nik);assertSmooth(nik);
        await assertConverged(env,[daniel,nik]);
      }finally{close();}
    });
    await scenario("A2 Nik acknowledges first, Daniel taps ACKNOWLEDGE before it reaches his page: recorded, no error, no flash",async()=>{
      const {commitOnly}=await prepareResultsReady(env);await commitOnly();const {daniel,nik,close}=await openPages(env);
      try{
        await showsAck(daniel);await showsAck(nik);await daniel.watching();await nik.watching();
        daniel.gate.maxRevision=1;
        nik.tap();await settled(nik);assertSmooth(nik);
        await waitFor(async()=>(await storedCommit(env))?.revision===2,"Nik's acknowledgement on the server");
        assert.equal(daniel.view().revision,1,"Daniel's page has not seen Nik's acknowledgement");
        daniel.tap();await settled(daniel);assertSmooth(daniel);
        await assertConverged(env,[daniel,nik]);
      }finally{close();}
    });
    for(let round=1;round<=ROUNDS+1;round+=1)await scenario(`A3.${round} both tap ACKNOWLEDGE in the same instant, neither page having seen the other: both recorded once`,async()=>{
      const {commitOnly}=await prepareResultsReady(env);await commitOnly();const {daniel,nik,close}=await openPages(env);
      try{
        await showsAck(daniel);await showsAck(nik);await daniel.watching();await nik.watching();
        daniel.gate.maxRevision=1;nik.gate.maxRevision=1;
        if(round%2){daniel.tap();nik.tap();}else{nik.tap();daniel.tap();}
        await settled(daniel);await settled(nik);assertSmooth(daniel);assertSmooth(nik);
        await assertConverged(env,[daniel,nik]);
      }finally{close();}
    });
    for(let round=1;round<=ROUNDS;round+=1)await scenario(`A4.${round} Nik taps ACKNOWLEDGE the moment the commit shows, while Daniel's COMMIT & ACKNOWLEDGE is still writing`,async()=>{
      await prepareResultsReady(env);const {daniel,nik,close}=await openPages(env);
      try{
        await daniel.api.refresh();await nik.api.refresh();await daniel.watching();await nik.watching();
        daniel.gate.maxRevision=1;nik.gate.maxRevision=1;
        daniel.tap();
        await waitFor(async()=>{const view=nik.view();if(view&&view.committed&&nik.button()?.textContent===ACK_LABEL&&!nik.button().disabled)return true;if((await storedCommit(env))?.revision>=1)await nik.api.refresh();return false;},"Nik sees the commit");
        nik.tap();
        await settled(daniel);await settled(nik);assertSmooth(daniel);assertSmooth(nik);
        await assertConverged(env,[daniel,nik]);
      }finally{close();}
    });
  }finally{
    // Leave the shared emulator clean and let its listen streams wind down before the next proof clears it.
    try{await env.clearFirestore();}catch(_error){}
    await env.cleanup();await sleep(500);
  }
  if(failures){process.stdout.write(`FAIL Season Commit acknowledgement race: ${failures} scenario(s) failed\n`);process.exit(1);}
  process.stdout.write("PASS Season Commit acknowledgement race: an acknowledgement tapped before the rival's has reached this page, in either order or in the same instant, is recorded once for each manager with no error and no ACKNOWLEDGE flash, and the season converges to ACKNOWLEDGED on both pages.\n");
  process.exit(0);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
