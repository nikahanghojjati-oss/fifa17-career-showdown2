const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
// BH-8 (owner decision 2026-10-05, "Show automatically"): once the last season is committed each phone runs the read-only
// observe/preview by itself on its normal poll, so the final winner and CLOSE appear without a tap. Apply is never automatic.
const protocolSource=fs.readFileSync("js/sharedLocalReconciliation.js","utf8");
const productionSource=fs.readFileSync("js/productionSharedLocalReconciliation.js","utf8");
const hex=(c,n)=>c.repeat(n);
const rivalryId=`pair_${hex("a",64)}`,binding={saveId:`save_${hex("b",24)}`,profileId:`profile_${hex("c",24)}`,managerRole:"playerOne"};
const envelope={revision:0,contentHash:`sha256:${hex("d",64)}`,lifecycleState:"live"};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<20;i+=1)await tick();}

function harness({terminal=false,remoteExists=false,history=true,attached=true}={}){
  const listeners=new Map(),intervals=[],calls=[];
  const clock={now:1_000_000};
  const fail={refresh:0,preview:0};let gate=null;
  let published=remoteExists,multiTerminal=terminal,terminalPhase=null;
  let cr={connected:true,attached,rivalryId,binding,status:attached?"saved-link":"unavailable",observedExists:false,observedEnvelope:null,observedTombstone:false};
  const connected={
    getState:()=>cr,subscribe:()=>()=>{},
    initialize:async()=>{calls.push("initialize");cr={...cr,connected:true,attached:true,status:"saved-link"};},
    refreshAttachedSharedState:async()=>{calls.push("refresh");if(gate)await gate;if(fail.refresh>0){fail.refresh-=1;cr={...cr,status:"refresh-error"};return;}cr={...cr,status:"refreshed",observedExists:published,observedEnvelope:published?envelope:null,reconciliationPreviewReady:false};},
    publishAttachedSharedState:async()=>{calls.push("publish");published=true;cr={...cr,status:"published",observedExists:true,observedEnvelope:null};},
    previewLocalReconciliation:async b=>{calls.push("preview");if(fail.preview>0){fail.preview-=1;throw Object.assign(new Error("Simulated lost preview response"),{code:"SIMULATED_PREVIEW_FAILURE"});}cr={...cr,status:"reconciliation-preview-ready",reconciliationPreviewReady:true,previewRevision:envelope.revision,previewContentHash:envelope.contentHash,previewSaveId:b.saveId};},
    applyLocalReconciliation:async()=>{calls.push("apply");throw new Error("Apply must never be called automatically");}
  };
  const nodes=new Map();
  const element=tag=>{const classes=new Set();return {tagName:tag,id:"",textContent:"",className:"",disabled:false,children:[],classList:{toggle(name,force){if(force)classes.add(name);else classes.delete(name);},contains:name=>classes.has(name)},appendChild(child){this.children.push(child);if(child.id)nodes.set(child.id,child);},addEventListener(){},setAttribute(){}};};
  const review=element("section");review.id="seasonReviewPanel";nodes.set(review.id,review);
  const document={visibilityState:"visible",getElementById:id=>nodes.get(id)||null,createElement:element};
  const context={
    console,navigator:{onLine:true},document,
    Date:{now:()=>clock.now},
    currentShowdown:{id:"s",sharedJourney:{mode:"shared",rivalryId}},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    dispatchEvent(){},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    setInterval(fn,ms){intervals.push({fn,ms});return intervals.length;},clearInterval(){},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>history?{authoritative:true,phase:"HISTORY_CONVERGED",rivalryId}:null},
    CareerModeProductionSharedMultiSeasonProgression:{getState:()=>({ok:true,authoritative:true,phase:multiTerminal?"SHOWDOWN_COMPLETE":"SEASON_ACTIVE",state:{terminal:multiTerminal}}),refresh:async()=>{calls.push("multi-refresh");}},
    CareerModeProductionSharedTerminalClose:{getState:()=>terminalPhase?{phase:terminalPhase}:null},
    CareerModeSparkConnectedRivalry:connected
  };
  context.window=context;context.globalThis=context;vm.createContext(context);
  vm.runInContext(protocolSource,context,{filename:"sharedLocalReconciliation.js"});
  vm.runInContext(productionSource,context,{filename:"productionSharedLocalReconciliation.js"});
  const api=context.CareerModeProductionSharedLocalReconciliation;
  const fire=type=>{for(const fn of listeners.get(type)||[])fn({type});};
  const poll=()=>{for(const {fn} of intervals)fn();};
  const status=()=>nodes.get("sharedLocalReconciliationStatus")?.textContent||"";
  return {api,calls,clock,fail,intervals,fire,poll,status,document,
    setTerminal:value=>{multiTerminal=value;},setTerminalPhase:value=>{terminalPhase=value;},
    setGate:value=>{gate=value;},count:name=>calls.filter(c=>c===name).length};
}

(async()=>{
  assert.match(productionSource,/autoFinalCheck:true/);assert.match(productionSource,/automaticLocalApply:false/);
  assert.doesNotMatch(productionSource.slice(productionSource.indexOf("function lrAutoCheck("),productionSource.indexOf("function lrPoll(")),/lrApply|applyLocalReconciliation/,"the automatic check never reaches Apply");

  // 1. Before the Showdown is terminal nothing runs automatically: no initialize, read, publish or preview, however often it polls.
  let h=harness({terminal:false});
  h.api.install();assert.equal(h.intervals.length,1);assert.equal(h.intervals[0].ms,15000,"the auto-check rides the existing 15 s poll");
  for(let i=0;i<4;i+=1){h.clock.now+=15000;h.poll();h.fire("career-mode-shared-multi-season-state-change");h.fire("career-mode-shared-history-convergence-state-change");await settle();}
  assert.deepEqual(h.calls,[],"no automatic observe before Multi Season reads SHOWDOWN_COMPLETE");
  assert.equal(h.api.getState().phase,"WAITING_REMOTE");
  assert.equal(h.status(),"Waiting for your partner to finish the last season. The final result shows here by itself.","plain waiting copy, no remote-snapshot jargon");
  // 2. Once terminal, the Multi Season wake runs the same observe/preview once: missing snapshot is published once, read back, previewed.
  h.setTerminal(true);h.fire("career-mode-shared-multi-season-state-change");await settle();
  assert.deepEqual(h.calls,["initialize","refresh","publish","refresh","preview"],"terminal auto-check publishes the missing snapshot once and previews it");
  assert.equal(h.api.getState().phase,"PREVIEW_READY");assert.match(h.status(),/PREVIEW READY/);
  // 3. It stops at PREVIEW_READY: later polls and wakes do nothing, and Apply is never called.
  for(let i=0;i<4;i+=1){h.clock.now+=15000;h.poll();h.fire("career-mode-shared-multi-season-state-change");await settle();}
  assert.equal(h.calls.length,5,"no further automatic work after PREVIEW_READY");
  assert.equal(h.count("apply"),0,"Apply is never automatic");
  process.stdout.write("PASS BH-8 auto final check: nothing before terminal; after terminal one publish-once observe + preview, then stops at PREVIEW_READY and never applies\n");

  // 4. Single flight and throttle: a burst of wakes while a check is in flight starts nothing new; later wakes inside the poll gap are ignored.
  h=harness({terminal:true,remoteExists:true});
  let release;h.setGate(new Promise(resolve=>{release=resolve;}));
  h.api.install();
  for(let i=0;i<10;i+=1){h.fire("career-mode-shared-multi-season-state-change");h.fire("career-mode-shared-history-convergence-state-change");h.fire("career-mode-showdown-state-change");h.fire("online");h.poll();}
  await settle();
  assert.equal(h.count("refresh"),1,"single flight: one read in flight however many wakes arrive");
  // A manual PREVIEW tap during the automatic check shares it instead of starting a second read.
  const manual=h.api.previewFromUi();await settle();assert.equal(h.count("refresh"),1,"a PREVIEW tap joins the in-flight check");
  h.setGate(null);release();assert.equal(await manual,true);await settle();
  assert.deepEqual(h.calls,["initialize","refresh","preview"],"an existing snapshot is only read, never republished");
  assert.equal(h.api.getState().phase,"PREVIEW_READY");
  // Throttle: after a quiet failure, wakes inside the poll gap do not retry; the next poll does.
  h=harness({terminal:true,remoteExists:true});h.fail.refresh=1;h.api.install();await settle();
  assert.equal(h.count("refresh"),1);assert.equal(h.api.getState().phase,"WAITING_REMOTE");
  assert.equal(h.status(),"Last season committed. Getting the final result; this updates by itself.","a transient failure stays quiet: plain copy, no error text");
  for(let i=0;i<10;i+=1){h.clock.now+=1000;h.fire("career-mode-shared-multi-season-state-change");h.fire("career-mode-shared-history-convergence-state-change");await settle();}
  assert.equal(h.count("refresh"),1,"wakes inside the poll gap never retry (no every-wake loop)");
  assert.ok(h.api.autoCheckMinGapMs>=14000&&h.api.autoCheckMinGapMs<=15000,"the gap matches the 15 s poll cadence");
  process.stdout.write("PASS BH-8 auto final check is single-flight (a PREVIEW tap joins it) and throttled to the poll cadence, so a wake burst cannot loop\n");

  // 5. Retry after a transient failure: quiet (no error text), retried on the next poll, and succeeds.
  h.clock.now+=15000;h.poll();await settle();
  assert.equal(h.count("refresh"),2,"the next poll retries after a transient read failure");
  assert.equal(h.api.getState().phase,"PREVIEW_READY");
  h=harness({terminal:true,remoteExists:true});h.fail.preview=1;
  h.api.install();await settle();
  assert.equal(h.count("preview"),1);assert.notEqual(h.api.getState().phase,"PREVIEW_READY");
  h.clock.now+=15000;h.poll();await settle();
  assert.equal(h.count("preview"),2,"a failed preview is retried on the next poll");assert.equal(h.api.getState().phase,"PREVIEW_READY");
  assert.equal(h.count("apply"),0);assert.doesNotMatch(h.status(),/FAILED|NOT READY/);
  process.stdout.write("PASS BH-8 auto final check retries quietly on the next poll after a transient read or preview failure\n");

  // 6. Stops when the Showdown is CLOSED or tombstoned, even if the preview never became ready.
  h=harness({terminal:true,remoteExists:true});h.fail.refresh=1;h.api.install();await settle();assert.equal(h.count("refresh"),1);
  h.setTerminalPhase("CLOSED");
  for(let i=0;i<4;i+=1){h.clock.now+=15000;h.poll();await settle();}
  assert.equal(h.count("refresh"),1,"no automatic work after Terminal Close reads CLOSED");
  // Non-authoritative history, offline or a hidden page also stay quiet.
  h=harness({terminal:true,remoteExists:true,history:false});h.api.install();h.clock.now+=15000;h.poll();await settle();
  assert.deepEqual(h.calls,[],"no automatic work before Shared History is authoritative");
  h=harness({terminal:true,remoteExists:true});h.document.visibilityState="hidden";h.api.install();h.clock.now+=15000;h.poll();await settle();
  assert.deepEqual(h.calls,[],"no automatic work while the page is hidden");
  h.document.visibilityState="visible";h.clock.now+=15000;h.poll();await settle();assert.equal(h.api.getState().phase,"PREVIEW_READY","resumes on the next visible poll");
  process.stdout.write("PASS BH-8 auto final check stops once the Showdown is CLOSED and stays idle until Shared History is authoritative and the page is visible\n");

  // 7. After a reload the Connected Rivalry is not yet attached: the terminal auto-check attaches it through the same initialize path.
  h=harness({terminal:true,remoteExists:true,attached:false});h.api.install();await settle();
  assert.deepEqual(h.calls,["initialize","refresh","preview"]);assert.equal(h.api.getState().phase,"PREVIEW_READY");
  process.stdout.write("PASS BH-8 auto final check attaches an unattached Connected Rivalry after reload and still never applies\n");
})().catch(error=>{console.error(error);process.exit(1);});
