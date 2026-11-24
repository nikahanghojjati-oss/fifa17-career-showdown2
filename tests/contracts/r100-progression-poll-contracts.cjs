"use strict";
// r100 B4 read cut: Multi Season Progression's 15 s timed check stands down on the setup, Career Start and Transfer War screens
// once this page holds the season for this context (the accepted count only moves on Season Results / Review, and that move
// also arrives as an event). It still runs with no season held, on a changed context, on Results / Review / dashboard /
// summary, and on every other screen; the event wakes and the visibility wake stay.
//   P1 no season held yet: due on a quiet screen
//   P2 season held, Transfer War shown: not due
//   P3 season held, Career Start (club wheel) shown: not due; league wheel, New Showdown and the season-start dashboard too
//   P4 season held, Season Results / Review or the summary shown (even with a quiet screen not hidden): due
//   P5 season held, Home or another screen: due
//   P6 a changed context or another rivalry's season: due
//   P7 the real registration: the timer asks the commit listener first, then pmspPollDue, and only then wakes
//   P8 the event and visibility wakes are registered unchanged
//   P9 a season known to be terminal is always due, on any screen
//   P10 Final Reconciliation (and Terminal Close through it) reads nothing while Multi Season is quiet, before any multi/history refresh
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const code=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedMultiSeasonProgression.js"),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};

const pick=re=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};
const src=[
  pick(/const PMSP_QUIET_SCREENS=[^\n]*\n/),
  pick(/function pmspShown\(id\)\{[^\n]*\}\n/),
  pick(/function pmspPollDue\(\)\{[\s\S]*?\n  \}\n/)
].join("");
function world({shown=[],held=true,key="k1",heldKey="k1",heldRivalry="r1",terminal=false}={}){
  const ctx={
    view:held?{state:{acceptedSeasons:0,terminal},rivalryId:heldRivalry}:null,contextKey:heldKey,
    pmspRequest:()=>({rivalryId:"r1",key}),
    pmspField:id=>({classList:{contains:c=>c==="hidden"&&!shown.includes(id)}})
  };
  vm.runInNewContext(src+";globalThis.due=pmspPollDue;",ctx);return ctx.due();
}
assert.equal(world({held:false,shown:["transferChallenge"]}),true);ok("P1","no season held yet: the check runs on a quiet screen");
assert.equal(world({shown:["transferChallenge"]}),false);ok("P2","season held, Transfer War: the check stands down");
for(const id of ["clubWheelScreen","leagueWheelScreen","createShowdown","dashboard"])assert.equal(world({shown:[id]}),false,id);ok("P3","season held, Career Start / league / New Showdown / season-start dashboard: the check stands down");
for(const id of ["seasonEntry","seasonSummary"])assert.equal(world({shown:[id,"transferChallenge","dashboard"]}),true,id);ok("P4","Season Results / Review and the summary always run the check");
assert.equal(world({shown:["mainMenu"]}),true);assert.equal(world({shown:[]}),true);ok("P5","Home or any other screen runs the check");
assert.equal(world({shown:["transferChallenge"],key:"k2"}),true);assert.equal(world({shown:["transferChallenge"],heldRivalry:"r2"}),true);ok("P6","a changed context or another rivalry's season runs the check");
{
  const registration=pick(/root\.setInterval\([^\n]*?,POLL_MS\)/);
  for(const [healthy,due,woke] of [[false,true,1],[false,false,0],[true,true,0]]){
    let wakes=0,asked=0,timer=null;
    vm.runInNewContext(registration,{POLL_MS:15000,root:{setInterval:(fn,ms)=>{assert.equal(ms,15000);timer=fn;},CareerModeProductionSharedSeasonCommit:{waitingListenerHealthy:()=>healthy}},pmspPollDue:()=>{asked+=1;return due;},pmspWake:()=>{wakes+=1;}});
    timer();assert.equal(wakes,woke,`healthy ${healthy} due ${due}`);if(healthy)assert.equal(asked,0);
  }
  ok("P7","the 15 s timer wakes only when the commit listener is not healthy and the check is due");
}
{
  const install=pick(/function pmspInstall\(\)\{[^\n]*\n/);
  for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-history-convergence-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change"])assert.ok(install.includes(`"${event}"`),event);
  assert.ok(/addEventListener\?\.\(event,pmspWake\)/.test(install)&&/addEventListener\?\.\("visibilitychange",pmspWake\)/.test(install));
  ok("P8","every event wake and the visibility wake still call pmspWake directly");
}
for(const id of ["transferChallenge","dashboard","clubWheelScreen"])assert.equal(world({shown:[id],terminal:true}),true,id);ok("P9","a terminal season is due on every screen");
{
  assert.ok(/quietNow:\(\)=>\{try\{return !pmspPollDue\(\);\}catch\(_error\)\{return false;\}\}/.test(code),"Multi Season exports quietNow = not due (false on any error)");
  const fin=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedFinalReconciliation.js"),"utf8");
  const body=fin.slice(fin.indexOf("async function pfrRefreshNow("),fin.indexOf("function pfrRefresh()"));
  const quiet=body.indexOf("multiApi.quietNow()"),multi=body.indexOf("await multiApi.refresh()"),history=body.indexOf("await historyApi.refresh()");
  assert.ok(quiet>0&&quiet<multi&&multi<history,"the quiet check comes before both refreshes");
  assert.ok(/if\(typeof multiApi\.quietNow==="function"&&multiApi\.quietNow\(\)\)return pfrCurrentView\(\);/.test(body),"quiet keeps the held view and reads nothing");
  const term=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTerminalClose.js"),"utf8");
  assert.ok(/final=finalApi\.getState\(\);if\(!final\|\|final\.phase!=="FINAL_SEASON_RECONCILED"[^;]*\)final=await finalApi\.refresh\(\);/.test(term),"Terminal Close still asks Final (and so inherits the quiet check), and its own terminal read is untouched");
  ok("P10","Final Reconciliation reads nothing while Multi Season is quiet; Terminal Close goes through it");
}
console.log(`PASS r100 progression poll contracts (${n} checks)`);
