const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

// A terminal close must remove the pre-close prompt instead of leaving two contradictory results.
function node(tag="div"){
  const classes=new Set();
  return {tag,id:"",textContent:"",children:[],classList:{
    toggle(name,on){if(on)classes.add(name);else classes.delete(name);},
    contains(name){return classes.has(name);}
  },appendChild(child){this.children.push(child);return child;}};
}
const review=node("section");review.id="seasonReviewPanel";
const find=(parent,id)=>parent.id===id?parent:parent.children.map(child=>find(child,id)).find(Boolean)||null;
const document={visibilityState:"visible",getElementById:id=>find(review,id),createElement:node,addEventListener(){}};
const listeners=new Map();
const rivalryId=`pair_${"a".repeat(64)}`,saveId=`save_${"b".repeat(24)}`;
const profileOne=`profile_${"c".repeat(24)}`,profileTwo=`profile_${"d".repeat(24)}`;
const terminal={phase:"READY"};
const local={phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId,profileId:profileOne,managerRole:"playerOne"}};
const multi={rivalryId},history={rivalryId};
const finalResult={phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,acceptedSeasons:1,totalSeasons:1,managerTotals:{playerOne:5,playerTwo:5},winner:"draw"};
const context={
  console,document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  currentShowdown:{identity:{saveId,managerProfileIds:{playerOne:profileOne,playerTwo:profileTwo}},managers:{playerOne:"Manager 1",playerTwo:"Manager 2"},sharedJourney:{mode:"shared",rivalryId}},
  CareerModeSaveLibraryRuntime:{isReady:()=>true},
  CareerModeSharedFinalReconciliation:{reconcile:()=>finalResult},
  CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>multi,getState:()=>multi},
  CareerModeProductionSharedHistoryConvergence:{refresh:async()=>history,getState:()=>history},
  CareerModeProductionSharedLocalReconciliation:{refresh:()=>local,getState:()=>local},
  CareerModeProductionSharedTerminalClose:{getState:()=>terminal},
  addEventListener(type,fn){listeners.set(type,fn);},
  dispatchEvent(event){listeners.get(event.type)?.(event);},
  setInterval(){},setTimeout(){}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("js/productionSharedFinalReconciliation.js","utf8"),context);
(async()=>{
  const api=context.CareerModeProductionSharedFinalReconciliation;
  api.install();
  const first=await api.refresh();
  assert.equal(first.winner,"draw");
  assert.equal(api.getState().winner,"draw");
  assert.equal(document.getElementById("sharedFinalReconciliationPanel").classList.contains("hidden"),false);
  assert.match(document.getElementById("sharedFinalReconciliationWinner").textContent,/DRAW/);
  assert.match(document.getElementById("sharedFinalReconciliationClose").textContent,/CLOSE THE SHOWDOWN WHEN READY/);

  // This is the event dispatched by productionSharedTerminalClose.js after its state becomes CLOSED.
  terminal.phase="CLOSED";
  context.dispatchEvent(new context.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:"CLOSED",rivalryId,terminal:true}}));
  assert.equal(api.getState(),null,"A completed close invalidates the pre-close final view immediately.");
  assert.equal(document.getElementById("sharedFinalReconciliationPanel").classList.contains("hidden"),true,"The outdated close prompt cannot remain visible beside CLOSED.");
  assert.equal(await api.refresh(),null,"The 15-second refresh must not resurrect a pre-close panel.");
  assert.equal(document.getElementById("sharedFinalReconciliationPanel").classList.contains("hidden"),true);
  process.stdout.write("PASS Final Reconciliation hides the obsolete pre-close panel immediately after Terminal Close, including on later refreshes; tied totals display DRAW before close.\\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
