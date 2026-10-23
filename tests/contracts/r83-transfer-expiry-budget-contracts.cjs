"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const source=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTransferChallenge.js"),"utf8");
const clone=value=>JSON.parse(JSON.stringify(value));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};

// Run the installed production adapter, including its real render, poll, clock,
// mutation and concurrent-expiry reconciliation. Only browser/provider IO is fake.
function harness(role="playerOne"){
  let now=0,mode="unavailable",readGate=null,setupGate=null;
  const epoch=Date.UTC(2026,9,22,12),nodes=new Map(),handlers={},intervals=[],calls={reads:0,mutations:0,advances:0,setup:0,career:0,events:[]};
  const state={seasonNumber:1,coordinatorRole:"playerOne",phase:"WINDOW_OPEN",revision:2,startedAtEpochMs:epoch,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]};
  function node(id){
    if(!nodes.has(id)){
      const classes=new Set();
      nodes.set(id,{id,value:"",textContent:"",disabled:false,dataset:{},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);}},setAttribute(){},hasAttribute:()=>true,removeAttribute(){},addEventListener(){},append(){},replaceChildren(){},closest:()=>null,querySelectorAll:()=>[]});
    }
    return nodes.get(id);
  }
  const document={visibilityState:"visible",getElementById:node,querySelector:node,querySelectorAll:()=>[],createElement:()=>node(`new:${nodes.size}`),addEventListener(type,fn){handlers[type]=fn;}};
  const projection=()=>({ok:true,revision:state.revision,state:clone(state),managerRole:role,seasonNumber:1});
  const provider={async read(){calls.reads++;calls.events.push("read");if(readGate){const gate=readGate;readGate=null;await gate.promise;}return projection();},async advanceExpiredWindow(){
    calls.mutations++;calls.events.push("mutate");
    if(mode==="race"){state.phase="GUESS_ENTRY";state.revision++;return {ok:false,code:"permission-denied"};}
    if(mode!=="success")return {ok:false,code:mode};
    calls.advances++;state.phase="GUESS_ENTRY";state.revision++;return projection();
  },startWindow:async()=>{},requestEndWindow:async()=>{},lockGuesses:async()=>{},lockSignings:async()=>{}};
  class FakeDate extends Date{static now(){return epoch+now;}}
  const sandbox={document,crypto:webcrypto,performance:{now:()=>now},Date:FakeDate,console,reportApplicationError(){},setInterval(fn,ms){intervals.push({fn,ms,next:now+ms});return intervals.length;},addEventListener(type,fn){handlers[type]=fn;},currentShowdown:{id:"save_1",currentRound:1,sharedJourney:{mode:"shared",rivalryId:"pair_1"}},CareerModeSharedTransferChallenge:{},CareerModeSparkSharedTransferChallenge:provider,
    CareerModeProductionSharedShowdownSetup:{async refresh(){calls.setup++;if(setupGate){const gate=setupGate;setupGate=null;await gate.promise;}},getState:()=>({ready:true,managerRole:role,rivalryId:"pair_1",sessionId:"session_1",deviceId:"device_1",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne"}})},
    CareerModeProductionSharedCareerStart:{async refresh(){calls.career++;},getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{getIdTokenResult:async()=>({issuedAtTime:new Date(epoch+now).toISOString()})}},firestore:{},firestoreSdk:{}})}};
  vm.runInNewContext(source,sandbox,{filename:"productionSharedTransferChallenge.js"});
  const api=sandbox.CareerModeProductionSharedTransferChallenge;
  async function advance(ms){const end=now+ms;while(true){const next=Math.min(...intervals.map(i=>i.next));if(next>end)break;now=next;for(const interval of intervals){if(interval.next===now){interval.next+=interval.ms;interval.fn();}}await settle();}now=end;await settle();}
  async function visibility(value){document.visibilityState=value;handlers.visibilitychange();await settle();}
  return {api,calls,state,document,advance,visibility,gateSetup:()=>{setupGate=deferred();return setupGate;},mode:value=>{mode=value;},gateRead:()=>{readGate=deferred();return readGate;},online:async()=>{handlers.online?.();await settle();}};
}

(async()=>{
  for(const role of ["playerOne","playerTwo"]){
    const h=harness(role);h.api.install();await settle();
    assert.equal(h.api.getState().state.phase,"WINDOW_OPEN");
    await h.advance(14*60*1000);await h.visibility("hidden");
    const hiddenCalls=clone(h.calls);
    await h.advance(61*60*1000);
    assert.equal(h.calls.mutations,0,`${role}: no expiry mutation while hidden`);
    assert.equal(h.calls.reads,hiddenCalls.reads,"hidden timers and polls do no network work");
    assert.equal(h.calls.setup,hiddenCalls.setup);assert.equal(h.calls.career,hiddenCalls.career);

    const gate=h.gateRead(),before=h.calls.reads;
    await h.visibility("visible");await h.advance(20_000);
    assert.equal(h.calls.reads,before+1,"visible return starts exactly one authority refresh");
    assert.equal(h.calls.mutations,0,"expiry waits for that refresh to resolve");
    gate.resolve();await settle();
    assert.equal(h.calls.mutations,1,"the original absolute deadline expired during sleep");
    await h.advance(29_000);assert.equal(h.calls.mutations,1,"retain the 30-second retry spacing");
    await h.advance(3_600_000);
    assert.equal(h.calls.mutations,3,"same context/revision stops at three attempts, even with ordinary polls");
    assert.equal(h.state.phase,"WINDOW_OPEN");

    h.mode("success");await h.api.refresh();await settle();await h.advance(60_000);
    assert.equal(h.calls.mutations,4,"an existing explicit refresh rearms a stopped expiry");
    assert.equal(h.calls.advances,1,"successful expiry advances once");
    assert.equal(h.state.phase,"GUESS_ENTRY");
    await h.visibility("hidden");await h.visibility("visible");await h.advance(120_000);
    assert.equal(h.calls.advances,1,"later timers and returns cannot advance it again");
  }
  {
    const h=harness();h.state.startedAtEpochMs+=10_000;h.api.install();await settle();
    await h.advance(909_000);
    const gate=h.gateSetup(),before=clone(h.calls);await h.advance(1000);
    assert.equal(h.calls.setup,before.setup+1,"expiry starts its authority work while visible");
    await h.visibility("hidden");gate.resolve();await settle();await h.advance(60_000);
    assert.equal(h.calls.career,before.career,"hiding during a pending expiry read prevents follow-up authority work");
    assert.equal(h.calls.reads,before.reads);assert.equal(h.calls.mutations,0);
    h.mode("success");await h.visibility("visible");await h.advance(60_000);
    assert.equal(h.calls.advances,1,"return refresh recovers an expiry interrupted by hiding");
  }
  for(const code of ["permission-denied","firestore/permission-denied","permission_denied"]){
    const h=harness();h.api.install();await settle();h.mode(code);await h.advance(16*60*1000);
    assert.equal(h.calls.mutations,1,`${code}: genuine refusal stops after the existing reconciliation read`);
    h.mode("success");await h.online();await h.advance(60_000);
    assert.equal(h.calls.advances,1,"reconnection refresh rearms permission refusal");
  }
  {
    const h=harness();h.api.install();await settle();h.mode("race");await h.advance(16*60*1000);
    assert.equal(h.calls.mutations,1,"concurrent expiry remains a single write attempt plus reconciliation");
    assert.equal(h.api.getState().state.phase,"GUESS_ENTRY");
  }
  console.log("PASS r83 transfer expiry: hidden IO pauses, return refresh precedes bounded retries, permission refusal stops, recovery rearms, and expiry advances once for either manager.");
})().catch(error=>{console.error(error);process.exitCode=1;});
