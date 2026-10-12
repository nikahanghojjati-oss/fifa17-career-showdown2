"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedSeasonResultsRoute.js"),"utf8");

function createRouteHarness(){
  let navigationRevision=4,openCalls=0,releaseLoader,loaderStarted;
  const loading=new Promise(resolve=>{releaseLoader=resolve;});
  const started=new Promise(resolve=>{loaderStarted=resolve;});
  const sandbox={
    console,
    currentShowdown:{sharedJourney:{mode:"shared"}},
    document:{getElementById:id=>id==="transferChallenge"?{dataset:{}}:null},
    getNavigationRevision:()=>navigationRevision,
    CareerModeProductionSharedTransferChallenge:{getState:()=>({state:{phase:"COMPLETED"}})},
    CareerModeProductionSharedSeasonResults:{
      install:()=>true,
      open:async()=>{openCalls+=1;return true;},
      getState:()=>({state:{phase:"RESULTS_ENTRY"}})
    },
    CareerModeSharedLocalReconciliation:{}
  };
  for(const name of [
    "CareerModeProductionSharedSeasonCommit",
    "CareerModeProductionSharedCanonicalScoring",
    "CareerModeProductionSharedHistoryConvergence",
    "CareerModeProductionSharedMultiSeasonProgression",
    "CareerModeProductionSharedJourneyReconnect",
    "CareerModeProductionSharedLocalReconciliation",
    "CareerModeProductionSharedFinalReconciliation",
    "CareerModeProductionSharedTerminalClose"
  ])sandbox[name]={install:()=>true};
  sandbox.loadRuntimeScript=async key=>{
    if(key==="ssjr-production-season-results"){loaderStarted();await loading;}
    return true;
  };
  sandbox.globalThis=sandbox;
  vm.runInNewContext(source,sandbox,{filename:"productionSharedSeasonResultsRoute.js"});
  return {
    route:sandbox.CareerModeProductionSharedSeasonResultsRoute,
    started,
    release:()=>releaseLoader(),
    moveAway:()=>{navigationRevision+=1;},
    openCalls:()=>openCalls
  };
}

(async()=>{
  // A back/home tap during the script download must win over the old Results request.
  const changed=createRouteHarness();
  const lateOpen=changed.route.open();
  await changed.started;
  changed.moveAway();
  changed.release();
  assert.equal(await lateOpen,false,"later navigation must cancel the delayed Season Results route");
  assert.equal(changed.openCalls(),0,"a cancelled route must not call the Results adapter open");

  // No newer navigation: the same delayed script should still open Results once.
  const unchanged=createRouteHarness();
  const normalOpen=unchanged.route.open();
  await unchanged.started;
  unchanged.release();
  assert.equal(await normalOpen,true,"unchanged navigation must continue into Season Results");
  assert.equal(unchanged.openCalls(),1,"unchanged navigation should open Results exactly once");

  console.log("PASS Season Results route: a newer navigation during script loading wins without blocking normal opens.");
})().catch(error=>{console.error(error);process.exitCode=1;});
