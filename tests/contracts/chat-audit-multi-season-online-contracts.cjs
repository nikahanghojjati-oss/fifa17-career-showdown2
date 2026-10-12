"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const rivalryId="pair_test",pending=[],events=[];
let reads=0,history=null;
const setup={ready:true,rivalryId,sessionId:"session_test",deviceId:"device_test",accountId:"uid_test",managerRole:"playerOne",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}};
const visible={classList:{contains:()=>false}};
const nodes={seasonEntry:visible,seasonReviewPanel:visible,sharedHistoryConvergencePanel:visible};
const sandbox={
  currentShowdown:{id:"save_test",currentRound:1,sharedJourney:{mode:"shared",rivalryId}},
  document:{getElementById:id=>nodes[id]||null},
  CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
  CareerModeProductionSharedHistoryConvergence:{refresh:async()=>history,getState:()=>history},
  CareerModeSharedMultiSeasonProgression:{},
  CareerModeSparkSharedMultiSeasonProgression:{read:()=>{reads+=1;return new Promise(resolve=>pending.push(resolve));}},
  CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{uid:"uid_test"}},firestore:{},firestoreSdk:{}})},
  CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},
  dispatchEvent:event=>events.push(event),navigateTo:async()=>true
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("js/productionSharedMultiSeasonProgression.js","utf8"),sandbox);
const api=sandbox.CareerModeProductionSharedMultiSeasonProgression;
const result=accepted=>({
  ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId,
  phase:accepted===10?"SHOWDOWN_COMPLETE":"SEASON_READY",
  state:{runtimeRevision:"1.9.1-r13",rivalryId,acceptedSeasons:accepted,totalSeasons:10,terminal:accepted===10},
  dashboard:{acceptedSeasons:accepted,managerTotals:{playerOne:3*accepted,playerTwo:accepted},lastSeason:accepted?{seasonNumber:accepted}:null}
});
const settle=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
  // The first read and the reload/reconnect read overlap before any view is cached.
  const first=api.refresh();await settle();
  assert.equal(pending.length,1);
  const second=api.refresh();await settle();
  if(pending.length===2){
    // An older read arrives after the newly accepted season on a slow connection.
    pending[1](result(1));await second;
    pending[0](result(0));await first;
  }else{
    pending[0](result(1));await Promise.all([first,second]);
  }
  assert.equal(api.getState().state.acceptedSeasons,1,"a late first read must not erase the accepted season");
  assert.equal(api.getState().dashboard.managerTotals.playerOne,3,"accepted season points must carry over");
  assert.equal(reads,1,"overlapping reads for the same Showdown must share one read");

  for(let season=1;season<=10;season+=1){
    if(season>1){
      const next=api.refresh();await settle();
      assert.equal(reads,season,"a settled read must allow the next season refresh");
      pending[season-1](result(season));await next;
    }
    history={authoritative:true,phase:"HISTORY_CONVERGED",throughSeason:season,projection:{acceptedSeasons:season}};
    assert.equal(api.resolveSeason(1),season,"the reviewed season must never skip or repeat");
    assert.equal(api.getState().dashboard.managerTotals.playerOne,3*season);
    assert.equal(api.getState().dashboard.managerTotals.playerTwo,season);
    assert.equal(await api.continueToNextSeason(),season<10);
    assert.equal(await api.continueToNextSeason(),false,"a repeated tap cannot skip a season");
    assert.equal(api.resolveSeason(1),Math.min(season+1,10));
  }
  assert.equal(events.length,9,"a ten season Showdown advances exactly nine times");
  assert.equal(api.getState().state.terminal,true,"season ten ends the Showdown");
  console.log("PASS overlapping shared season reads preserve accepted counts and totals; ten seasons advance once each and stop at ten.");
})().catch(error=>{console.error(error);process.exitCode=1;});
