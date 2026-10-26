const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

// r84 (live quota hit 2026-10-25): between seasons ("CONTINUE TO SEASON 2") Local Reconciliation stays WAITING_REMOTE, so
// every Final Reconciliation refresh is discarded and no view exists. Its own refresh refreshes Shared History and Local
// Reconciliation, which announce every refresh even when nothing changed. Those unchanged announcements woke the next refresh
// at once, forever: ~145 Firestore reads/min per device until someone tapped CONTINUE. Unchanged announcements must not wake
// a refresh while no view exists; a changed one still does.
function run(){
  const document={visibilityState:"visible",getElementById:()=>null,createElement:()=>({classList:{toggle(){},contains(){return false;}},appendChild(){}}),addEventListener(){}};
  const listeners=new Map();
  const rivalryId=`pair_${"a".repeat(64)}`,saveId=`save_${"b".repeat(24)}`;
  const profileOne=`profile_${"c".repeat(24)}`,profileTwo=`profile_${"d".repeat(24)}`;
  const refreshes={multi:0,history:0};
  let historyDetail={phase:"HISTORY_CONVERGED",throughSeason:1,acceptedRevisionKey:"1:2:sha256:x"};
  const local={phase:"WAITING_REMOTE",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,reason:"remote-not-observed",binding:{saveId,profileId:profileTwo,managerRole:"playerTwo"}};
  const context={
    console,document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
    currentShowdown:{identity:{saveId,managerProfileIds:{playerOne:profileOne,playerTwo:profileTwo}},managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared"}},
    CareerModeSaveLibraryRuntime:{isReady:()=>true},
    CareerModeProductionSharedShowdownSetup:{getState:()=>({ready:true,rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}})},
    CareerModeSharedFinalReconciliation:{reconcile:()=>{throw new Error("a WAITING_REMOTE local state must never reconcile");}},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>{refreshes.multi+=1;return {rivalryId,phase:"SEASON_READY"};},getState:()=>({rivalryId})},
    // Like the real modules: every refresh announces itself, changed or not.
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>{refreshes.history+=1;context.dispatchEvent(new context.CustomEvent("career-mode-shared-history-convergence-state-change",{detail:{...historyDetail}}));return {rivalryId,...historyDetail};},getState:()=>({rivalryId})},
    CareerModeProductionSharedLocalReconciliation:{refresh:()=>{context.dispatchEvent(new context.CustomEvent("career-mode-shared-local-reconciliation-state-change",{detail:{...local}}));return local;},getState:()=>local},
    CareerModeProductionSharedTerminalClose:{getState:()=>null},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},
    setInterval(){},setTimeout:(fn,ms)=>setTimeout(fn,ms)
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("js/productionSharedFinalReconciliation.js","utf8"),context);
  const api=context.CareerModeProductionSharedFinalReconciliation;
  return {api,context,refreshes,changeHistory(){historyDetail={...historyDetail,throughSeason:historyDetail.throughSeason+1};}};
}
const settle=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  const s=run();
  s.api.install();
  await settle(400);
  assert.equal(s.api.getState(),null,"mid-Showdown there is no reconciled view");
  assert.ok(s.refreshes.multi>=1,"the first wake still refreshes");
  assert.ok(s.refreshes.multi<=3,`unchanged announcements must not chain refreshes (got ${s.refreshes.multi} in 400 ms)`);
  const settled=s.refreshes.multi;
  await settle(400);
  assert.equal(s.refreshes.multi,settled,"once settled, nothing refreshes again without a change");

  // A real change (the partner's season lands) still wakes a refresh at once.
  s.changeHistory();
  s.context.dispatchEvent(new s.context.CustomEvent("career-mode-shared-history-convergence-state-change",{detail:{phase:"HISTORY_CONVERGED",throughSeason:2,acceptedRevisionKey:"1:2:sha256:x"}}));
  await settle(400);
  assert.ok(s.refreshes.multi>settled,"a changed announcement still wakes a refresh");
  assert.ok(s.refreshes.multi<=settled+3,`a change costs a bounded number of refreshes (got ${s.refreshes.multi-settled})`);
  process.stdout.write("PASS r84 Final Reconciliation: between seasons (no view, local WAITING_REMOTE) unchanged announcements no longer chain refreshes; a changed one still wakes at once.\n");
})().catch(error=>{console.error(error);process.exit(1);});
