const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

// r76 CE2PG final.live.reconciliation: with the automatic Terminal Close, the partner's close reaches this manager through the
// waiting listener (rivalry root) within a second. The closed session also ends Shared Setup readiness, the only source of the
// rivalry id for Final Reconciliation (production never stores sharedJourney.rivalryId), so it can no longer reconcile, and
// Terminal Close (which falls back to the Connected Rivalry binding) publishes CLOSED from its terminal read without this
// manager ever holding a reconciled view. Nothing may reconcile after CLOSED, so the final result lines stayed empty for good. They must carry the verified close witness's locked totals and winner, with no Firestore read,
// while the pre-close panel stays hidden and getState/refresh stay null.
function node(tag="div"){
  const classes=new Set();
  return {tag,id:"",textContent:"",children:[],classList:{
    toggle(name,on){if(on)classes.add(name);else classes.delete(name);},
    contains(name){return classes.has(name);}
  },appendChild(child){this.children.push(child);return child;}};
}
function run({winner,totals,witnessRivalry}){
  const review=node("section");review.id="seasonReviewPanel";
  const find=(parent,id)=>parent.id===id?parent:parent.children.map(child=>find(child,id)).find(Boolean)||null;
  const document={visibilityState:"visible",getElementById:id=>find(review,id),createElement:node,addEventListener(){}};
  const listeners=new Map();
  const rivalryId=`pair_${"a".repeat(64)}`,saveId=`save_${"b".repeat(24)}`;
  const profileOne=`profile_${"c".repeat(24)}`,profileTwo=`profile_${"d".repeat(24)}`;
  const reads={multi:0,history:0};
  // The partner closed first: this manager's Terminal Close is CLOSED straight from its terminal read (ptcClosedState).
  const terminal={phase:"CLOSED",rivalryId,terminal:true,terminalWitness:{phase:"CLOSED",rivalryId:witnessRivalry||rivalryId,totalSeasons:3,winner,managerTotals:totals}};
  const local={phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId,profileId:profileTwo,managerRole:"playerTwo"}};
  const context={
    console,document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
    currentShowdown:{identity:{saveId,managerProfileIds:{playerOne:profileOne,playerTwo:profileTwo}},managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared"}},
    CareerModeSaveLibraryRuntime:{isReady:()=>true},
    // The partner's close ended the session: Shared Setup is no longer SHOWDOWN_CONFIRMED-ready.
    CareerModeProductionSharedShowdownSetup:{getState:()=>({ready:false,rivalryId,setup:null})},
    CareerModeSharedFinalReconciliation:{reconcile:()=>{throw new Error("must not reconcile after CLOSED");}},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>{reads.multi+=1;return {rivalryId};},getState:()=>({rivalryId})},
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>{reads.history+=1;return {rivalryId};},getState:()=>({rivalryId})},
    CareerModeProductionSharedLocalReconciliation:{refresh:()=>local,getState:()=>local},
    CareerModeProductionSharedTerminalClose:{getState:()=>terminal},
    addEventListener(type,fn){listeners.set(type,fn);},
    dispatchEvent(event){listeners.get(event.type)?.(event);},
    setInterval(){},setTimeout(){}
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/productionSharedFinalReconciliation.js","utf8"),context);
  const api=context.CareerModeProductionSharedFinalReconciliation;
  api.install();
  context.dispatchEvent(new context.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:"CLOSED",rivalryId,terminal:true}}));
  const text=id=>document.getElementById(id)?.textContent||"";
  return {api,reads,text,panelHidden:()=>document.getElementById("sharedFinalReconciliationPanel")?.classList.contains("hidden")};
}
(async()=>{
  const nikWins=run({winner:"playerTwo",totals:{playerOne:9,playerTwo:14}});
  assert.equal(nikWins.text("sharedFinalReconciliationHeading"),"SHOWDOWN FINAL RESULT","the partner's close must not leave the final result heading empty");
  assert.equal(nikWins.text("sharedFinalReconciliationWinner"),"Daniel 9 · Nik 14 · Nik WINS","the final result line must carry the verified close witness");
  assert.equal(nikWins.text("sharedFinalReconciliationSummary"),"3 OF 3 SEASONS PLAYED");
  assert.equal(nikWins.text("sharedFinalReconciliationClose"),"","no pre-close prompt is written after CLOSED");
  assert.equal(nikWins.panelHidden(),true,"the pre-close panel stays hidden beside CLOSED");
  assert.equal(nikWins.api.getState(),null);
  assert.equal(await nikWins.api.refresh(),null,"nothing reconciles after CLOSED");
  assert.equal(nikWins.text("sharedFinalReconciliationWinner"),"Daniel 9 · Nik 14 · Nik WINS");
  assert.deepEqual({...nikWins.reads},{multi:0,history:0},"the closed final result costs no Firestore read");
  assert.equal(nikWins.text("sharedFinalReconciliationHeading"),"SHOWDOWN FINAL RESULT");

  const draw=run({winner:"draw",totals:{playerOne:5,playerTwo:5}});
  assert.equal(draw.text("sharedFinalReconciliationWinner"),"Daniel 5 · Nik 5 · DRAW");

  const other=run({winner:"playerOne",totals:{playerOne:4,playerTwo:1},witnessRivalry:`pair_${"e".repeat(64)}`});
  assert.equal(other.text("sharedFinalReconciliationWinner"),"","a witness of another rivalry is never shown");
  assert.equal(other.text("sharedFinalReconciliationHeading"),"");

  process.stdout.write("PASS Final Reconciliation shows the locked final result from the verified close witness when the partner's Terminal Close lands first; no read, panel stays hidden, nothing reconciles after CLOSED.\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
