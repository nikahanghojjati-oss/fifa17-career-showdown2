#!/usr/bin/env node
"use strict";
// r93 R93-10 (O1, HUNT_AREAS_1_2, Nik's pick 2026-11-15 "Show VIEW TRANSFER VERDICTS"): a manager whose phone reloads, or whose
// app is reopened, once the Transfer War is complete never saw the verdicts: the Season Results route took the dashboard button
// (js/productionSharedSeasonResultsRoute.js routeReady + routeDecorate) and replaced the Transfer War's own VIEW TRANSFER VERDICTS
// (js/productionSharedTransferChallenge.js pstcDecorateDashboard) with ENTER SEASON RESULTS.
// Checks:
//   V1 the real route module in a fake DOM: while this phone has not shown the completed Transfer War, the dashboard button keeps
//      VIEW TRANSFER VERDICTS and a tap on it is left to the Transfer War (not captured); CONTINUE TO SEASON RESULTS on the Transfer
//      War screen is still the route's
//   V2 once the verdicts were on screen (or for a manager who saw them before the reload) everything is as before: ENTER SEASON
//      RESULTS / VIEW MY CONFIRMED RESULT / VIEW SEASON RESULTS and the tap opens Season Results
//   V3 the Transfer War's "unseen" answer (real function bodies): COMPLETED and not yet witnessed on this phone; the witness is the
//      replay's browser-only viewing hint, written when the COMPLETED screen is drawn visible (and kept in localStorage by
//      rivalry, season and role), so the reload after seeing them changes nothing and the rival's phone is untouched
//   V4 nothing new is read or written: no provider call in the new code, the witness is the existing one
// ROUTE_TEST_REF=<git ref> runs V1/V2 against another build's route module (used to prove the old code fails).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),{execFileSync}=require("node:child_process");
const {FakeNode,createFakeDocument}=require("../support/fake-dom.cjs");
const ROOT=path.resolve(__dirname,"../..");
const REF=process.env.ROUTE_TEST_REF||null;
const read=p=>REF?execFileSync("git",["show",`${REF}:${p}`],{cwd:ROOT,encoding:"utf8"}):fs.readFileSync(path.join(ROOT,p),"utf8");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// ---- the route module with a fake Transfer War and Season Results state
function harness({unseen,results=null}){
  const doc=createFakeDocument(),listeners={};
  doc.addEventListener=(k,fn)=>{(listeners[k]??=[]).push(fn);};
  doc.head=new FakeNode("head");
  const dashboard=doc.register("seasonPrimaryAction",new FakeNode("button")),status=doc.register("dashboardTransferStatus"),cont=doc.register("continueFromTransfers",new FakeNode("button")),transferScreen=doc.register("transferChallenge");
  for(const b of [dashboard,cont]){b.disabled=false;b.hasAttribute=k=>Object.prototype.hasOwnProperty.call(b.attributes,k);b.removeAttribute=k=>{delete b.attributes[k];};b.closest=()=>b;}
  const transfer={state:{unseen},getState:()=>({state:{phase:"COMPLETED"}}),verdictsUnseen(){return transfer.state.unseen;},squadError:()=>"",squadAfterTransfers:async()=>true,rememberResultsView(){}};
  // what pstcDecorateDashboard writes for a completed Transfer War
  dashboard.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer War: complete";cont.textContent="SEASON RESULTS NEXT";cont.disabled=true;
  const opened=[];
  const ctx={document:doc,console,Promise,currentShowdown:{sharedJourney:{mode:"shared"}},CareerModeProductionSharedTransferChallenge:transfer,
    CareerModeProductionSharedSeasonResults:results?{getState:()=>results}:undefined,
    loadRuntimeScript:async(key)=>{opened.push(key);return true;},reportApplicationError:()=>{}};
  ctx.globalThis=ctx;
  vm.runInNewContext(read("js/productionSharedSeasonResultsRoute.js"),ctx);
  const route=ctx.CareerModeProductionSharedSeasonResultsRoute;route.install();
  const tap=button=>{let captured=false;const e={target:{closest:()=>button},preventDefault(){captured=true;},stopPropagation(){},stopImmediatePropagation(){}};for(const fn of listeners.click||[])fn(e);return captured;};
  return {route,dashboard,status,cont,transfer,tap,opened};
}

{
  const h=harness({unseen:true});
  assert.equal(h.dashboard.textContent,"VIEW TRANSFER VERDICTS","after a reload with the verdicts unseen, the dashboard offers them first");
  assert.equal(h.status.textContent,"Transfer War: complete");
  assert.equal(h.tap(h.dashboard),false,"the tap is left to the Transfer War, which opens its verdicts screen");
  assert.equal(h.cont.textContent,"CONTINUE TO SEASON RESULTS","the Transfer War screen still continues to Season Results");
  assert.equal(h.tap(h.cont),true,"CONTINUE TO SEASON RESULTS stays the route's");
  ok("V1","verdicts unseen on this phone: the dashboard keeps VIEW TRANSFER VERDICTS and its tap goes to the Transfer War; CONTINUE TO SEASON RESULTS is unchanged");
}
{
  const cases=[[null,"ENTER SEASON RESULTS"],[{state:{phase:"COLLECTING"},ownResult:{leaguePosition:1}},"VIEW MY CONFIRMED RESULT"],[{state:{phase:"RESULTS_READY"},ownResult:{}},"VIEW SEASON RESULTS"]];
  for(const [results,label] of cases){
    const h=harness({unseen:false,results});
    assert.equal(h.dashboard.textContent,label,`verdicts seen: the dashboard reads ${label} as before`);
    assert.equal(h.tap(h.dashboard),true,"the tap opens Season Results as before");
  }
  // The same phone after the verdicts were shown: the next decoration hands the button to Season Results.
  const h=harness({unseen:true});h.transfer.state.unseen=false;h.route.decorate();
  assert.equal(h.dashboard.textContent,"ENTER SEASON RESULTS","once the verdicts were on screen, back on the dashboard the button is Season Results");
  ok("V2","verdicts seen (before the reload, or after VIEW TRANSFER VERDICTS): ENTER SEASON RESULTS / VIEW MY CONFIRMED RESULT / VIEW SEASON RESULTS and the tap opens Season Results, as before");
}

// ---- V3/V4: the Transfer War's own answer, from the real function bodies
if(!REF){
  const src=fs.readFileSync(path.join(ROOT,"js/productionSharedTransferChallenge.js"),"utf8");
  const fn=name=>{const m=new RegExp(`function ${name}\\([^)]*\\)\\{`).exec(src);assert.ok(m,`${name} exists`);let i=m.index+m[0].length,d=1;while(d&&i<src.length){const c=src[i++];if(c==="{")d++;else if(c==="}")d--;}return src.slice(m.index,i);};
  const store=new Map();
  const sandbox={REPLAY_PHASES:["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"],witnessedByContext:new Map(),viewContextKey:"ctx-s2",view:{managerRole:"playerTwo",state:{phase:"COMPLETED"}},visible:false,canRoute:true,
    root:{readStorageValue:k=>store.get(k)??null,writeStorageValue:(k,v)=>{store.set(k,v);return true;}}};
  vm.runInNewContext(`${fn("pstcWitnessSet")}\n${fn("pstcMarkWitness")}\n${fn("pstcVerdictsUnseen")}
    function pstcCanRoute(){return canRoute;}function pstcTransferScreenVisible(){return visible;}function pstcViewingStorageKey(){return "cms.transferViews.v1:pair_x:2:"+view.managerRole;}
    globalThis.api={unseen:pstcVerdictsUnseen,mark:pstcMarkWitness,reset(){witnessedByContext.clear();}};`,sandbox);
  const {api}=sandbox;
  // Nik saw the window, guesses and signings, then reloaded right after the lock that completed the Transfer War.
  store.set("cms.transferViews.v1:pair_x:2:playerTwo",JSON.stringify(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"]));
  assert.equal(api.unseen(),true,"COMPLETED not yet on this phone: unseen");
  api.mark("ctx-s2","COMPLETED");assert.equal(api.unseen(),true,"a hidden Transfer War screen does not count as seen");
  sandbox.visible=true;api.mark("ctx-s2","COMPLETED");assert.equal(api.unseen(),false,"drawn visible: seen");
  assert.deepEqual(JSON.parse(store.get("cms.transferViews.v1:pair_x:2:playerTwo")),["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"],"kept in the browser for this rivalry, season and role");
  api.reset();assert.equal(api.unseen(),false,"after a reload or app reopen the stored hint still says seen: no change for a manager who saw them");
  sandbox.view.state.phase="SIGNING_ENTRY";assert.equal(api.unseen(),false,"only a completed Transfer War");
  sandbox.view.state.phase="COMPLETED";sandbox.canRoute=false;assert.equal(api.unseen(),false,"only this phone's current Showdown and season (pstcCanRoute)");
  // The rival's phone keeps its own hint (key by role): Daniel's phone that saw them is untouched.
  sandbox.canRoute=true;sandbox.view.managerRole="playerOne";api.reset();store.set("cms.transferViews.v1:pair_x:2:playerOne",JSON.stringify(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]));
  assert.equal(api.unseen(),false,"the rival's phone that saw the verdicts goes on to Season Results as before");
  ok("V3","unseen = COMPLETED and not drawn visible on this phone (the replay's own viewing hint, by rivalry, season and role); a reload after seeing them changes nothing; each phone keeps its own");
  const unseen=fn("pstcVerdictsUnseen"),routeSrc=fs.readFileSync(path.join(ROOT,"js/productionSharedSeasonResultsRoute.js"),"utf8"),first=/function routeVerdictsFirst\(\)\{[^\n]*\}/.exec(routeSrc)?.[0]||"";
  assert.ok(first,"the route asks the Transfer War");
  for(const code of [unseen,first])assert.doesNotMatch(code,/getDoc|onSnapshot|setDoc|runTransaction|pstcRefresh|pstcProviderOptions|writeStorageValue|setTimeout|setInterval/,"no read, write, poll or timer in the new code");
  assert.match(src,/verdictsUnseen:pstcVerdictsUnseen/,"the Transfer War exports it");
  assert.match(src,/button\.textContent="VIEW TRANSFER VERDICTS"/,"the Transfer War's own label is the one kept");
  ok("V4","the new code reads, writes and polls nothing; the label and the open are the Transfer War's existing ones");
}
console.log(`PASS r93 transfer verdicts after a reload contracts (${checks} checks)${REF?` against ${REF}`:""}`);
