"use strict";
// r100 H2-1 PR C (lead 2026-11-27): Rivalry Statistics had the same gap as Standings: reopened mid-Showdown it said "load
// once you continue it from Home" (js/rivalryLegacyV10.js rlLiveOrContinue, r87 C-01). Out of the game it now asks
// js/seasonFinalV10.js for the same THIS SHOWDOWN view Standings shows (keptShowdownView: the kept verified copy after one
// check, or with no copy the one session-free verified read, at most 6 s); anything else is the notice, as before.
// Checks:
//   R1 out of the game with a verified view: Rivalry Statistics' own frame carries its score, season, clubs and records
//   R2 nothing verified (null, a throw, a loading or unavailable answer, seasonFinalV10 not loadable): the notice
//   R3 in the game, or a Showdown that is not loading: the live path is untouched and nothing is asked
//   R4 seasonFinalV10's keptShowdownView (real code): one open, the kept copy after one check; no copy and no reader: null
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const F=require("../support/active-showdown-fixtures.cjs");
const A=require("../../js/sharedActiveShowdownAdapter.js");
const RL=require("../../js/rivalryLegacyV10.js");
const J=x=>JSON.parse(JSON.stringify(x));
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const RSRC=read("js/rivalryLegacyV10.js"),SSRC=read("js/seasonFinalV10.js");
const RBLOCK=(()=>{const a=RSRC.indexOf("  // r100 H2-1 PR C"),b=RSRC.indexOf("  // r87 H4 (Reus Gate, Nik)");assert.ok(a>0&&b>a,"Rivalry Statistics' live-or-continue block is where it was");return RSRC.slice(a,b);})();
const SBLOCK=(()=>{const a=SSRC.indexOf("  const state=name=>"),b=SSRC.indexOf("  // A supplied model first, then the provider-backed career model");assert.ok(a>0&&b>a);return SSRC.slice(a,b);})();

function rivalryPage({live=false,sf}){
  const loads=[];let asked=0;
  const root={loadRuntimeScript:async(key,file,ready)=>{loads.push(key);if(sf!==undefined&&sf!=="unloadable")root.CareerModeSeasonFinalV10=sf;if(sf==="unloadable")throw new Error("offline");return ready();}};
  if(sf&&sf!=="unloadable"&&sf.preloaded)root.CareerModeSeasonFinalV10=sf;
  const ctx={root,Promise,Object,Error,console};vm.createContext(ctx);
  vm.runInContext(`const load=(key,file,global)=>root.loadRuntimeScript(key,file,()=>Boolean(root[global]));function rlLiveCanArrive(){return ${live};}\n${RBLOCK}\nglobalThis.api={rlLiveOrContinue};`,ctx);
  if(sf&&typeof sf.keptShowdownView==="function"){const inner=sf.keptShowdownView;sf.keptShowdownView=async()=>{asked++;return inner();};}
  return {api:ctx.api,loads,asked:()=>asked};
}

(async()=>{
  const seasons=[[F.result({championsLeague:true}),F.result({leaguePosition:1})],[F.result({domesticCup:true}),F.result({leaguePosition:2,leaguePoints:95})]];
  const p2=F.projection({totalSeasons:3,seasons});
  const view=J(A.rivalryView({identity:F.identity(),pair:F.pair(p2.rivalryId),multiSeason:null,history:F.history(p2)}));
  assert.equal(view.status,"ready");
  const loading={status:"loading",lifecycle:"loading"};

  // R1
  {const pg=rivalryPage({sf:{keptShowdownView:async()=>view}});const model=J(await pg.api.rlLiveOrContinue(loading));
    assert.equal(model.status,"ready");assert.equal(model.lifecycle,"active");assert.deepEqual(model.score,view.score);
    assert.deepEqual(pg.loads,["v10-season-final"],"seasonFinalV10 is loaded when it is not yet");assert.equal(pg.asked(),1);
    const frame=J(RL.toV10Frame(model,"rivalryStatistics"));assert.equal(frame.status,"ready");assert.deepEqual(frame.score,{daniel:p2.managerRecords.playerOne.totalPoints,nik:p2.managerRecords.playerTwo.totalPoints},"Rivalry Statistics' own frame carries the score");
    assert.equal(frame.totalSeasons,3);assert.deepEqual(frame.clubs,view.clubs);
    const pre=rivalryPage({sf:{preloaded:true,keptShowdownView:async()=>view}});await pre.api.rlLiveOrContinue(loading);assert.deepEqual(pre.loads,[],"already loaded: nothing loaded again");}
  ok("R1","out of the game with a verified view: Rivalry Statistics shows THIS SHOWDOWN's score, clubs and records");

  // R2
  {const NOTICE={...loading,status:"unavailable",notice:"continue"};
    for(const [label,sf] of [["null",{keptShowdownView:async()=>null}],["a throw",{keptShowdownView:async()=>{throw new Error("x");}}],["loading",{keptShowdownView:async()=>({status:"loading"})}],["unavailable",{keptShowdownView:async()=>({status:"unavailable",notice:"continue"})}],["no such function",{}],["not loadable","unloadable"]]){
      const pg=rivalryPage({sf});const model=J(await pg.api.rlLiveOrContinue(loading));assert.deepEqual(model,NOTICE,`${label}: the notice, as before`);
      assert.deepEqual(J(RL.toV10Frame(model,"rivalryStatistics")),J({...RL.toV10Frame({status:"unavailable"},"rivalryStatistics"),notice:"continue"}),`${label}: the frame carries the notice`);}}
  ok("R2","nothing verified, a failure, or seasonFinalV10 not loadable: the notice, exactly as before");

  // R3
  {const pg=rivalryPage({live:true,sf:{keptShowdownView:async()=>view}});assert.deepEqual(J(await pg.api.rlLiveOrContinue(loading)),loading,"in the game: still waits for the providers");assert.equal(pg.asked(),0);assert.deepEqual(pg.loads,[]);
    const ready=rivalryPage({sf:{keptShowdownView:async()=>view}});const live={...view,lifecycle:"active",live:true};assert.deepEqual(J(await ready.api.rlLiveOrContinue(live)),J(live),"a Showdown already on show is untouched");assert.equal(ready.asked(),0);}
  ok("R3","in the game, or with live numbers on show: untouched, nothing asked");

  // R4
  {const KEY="cms.liveStandings.v1";
    const make=({copy=null,commit=null})=>{let now=1_000_000;const storage=new Map();if(copy)storage.set(KEY,JSON.stringify(copy));const reads=[];
      const sdk={doc:(_db,...parts)=>parts.join("/"),runTransaction:async(_db,fn)=>fn({get:async ref=>{reads.push(ref);return {exists:()=>Boolean(commit),data:()=>commit};}})};
      const snap=home=>({CareerModeOnlinePlayerIdentity:F.identity(),CareerModePersistentNikDanielPair:F.pair(p2.rivalryId),CareerModeProductionSharedMultiSeasonProgression:null,CareerModeProductionSharedHistoryConvergence:null,CareerModeProductionSharedFinalReconciliation:null,CareerModeProductionSharedTerminalClose:null});
      const root={CareerModeSharedActiveShowdownAdapter:A,readStorageValue:k=>storage.get(k)??null,writeStorageValue:(k,v)=>{storage.set(k,v);return true;},setTimeout:(fn,ms)=>{if(ms>=6000)return 0;setImmediate(fn);return 0;},
        CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},CareerModeProductionSharedShowdownSetup:{getState:()=>null}};
      for(const [k,v] of Object.entries(snap()))root[k]={getState:()=>v};root.CareerModeProductionSharedHistoryConvergence.isActive=()=>false;
      const ctx={root,Date:{now:()=>now},JSON,Promise,Number,String,Boolean,Object,Array,RegExp,Error,console};vm.createContext(ctx);
      vm.runInContext(`let signature="";function wake(){}\n${SBLOCK}\nglobalThis.api={sfKeptShowdownView,sfStandingsShown};`,ctx);return {api:ctx.api,reads};};
    const kept=make({copy:{schemaVersion:1,rivalryId:p2.rivalryId,history:J(F.history(p2))},commit:{phase:"COMMITTED",revision:2,seasonNumber:3}});
    const v=J(await kept.api.sfKeptShowdownView());assert.equal(v.status,"ready");assert.deepEqual(v.score,view.score);assert.deepEqual(kept.reads,[`rivalries/${p2.rivalryId}/seasonCommits/season_3`],"one check, the one Standings makes");
    const behind=make({copy:{schemaVersion:1,rivalryId:p2.rivalryId,history:J(F.history(p2))},commit:{phase:"ACKNOWLEDGED",revision:3,seasonNumber:3}});assert.equal(await behind.api.sfKeptShowdownView(),null,"a copy behind: nothing (the notice)");
    const none=make({});assert.equal(await none.api.sfKeptShowdownView(),null,"no copy and no reader: nothing (the notice)");
    await kept.api.sfKeptShowdownView();assert.equal(kept.reads.length,2,"each Rivalry Statistics load: its own one check");
    kept.api.sfStandingsShown("standings");await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));assert.equal(kept.reads.length,3,"and Standings entered next starts its own (no open left behind)");
    assert.match(SSRC,/return Object\.freeze\(\{keptShowdownView:sfKeptShowdownView,/,"seasonFinalV10 offers it");}
  ok("R4","seasonFinalV10's keptShowdownView: the kept copy after its one check, else nothing");
  console.log(`PASS r100 Rivalry Statistics after an app reopen (${n} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
