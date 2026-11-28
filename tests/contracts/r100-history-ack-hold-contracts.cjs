"use strict";
// r100 H1 F7 (Verify on 1758b305): right after this phone's season commit, psscNudgeHistory calls History's refresh twice.
// The provider re-reads each season's commit, and the budget layer can serve a copy from before the ACK (a listener copy,
// or one under 2 s old), so the read says HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED while the page already holds the
// ACKNOWLEDGED commit (rev 3). The first miss was held and the second reported. That put "Could not bring History up to
// date" on Season Results for 10 s and an error in the console. Nothing was lost; the next 3 s fast poll caught up.
// Now that miss is held quietly, keeping the view, while the page holds the ACKNOWLEDGED commit and the wait is inside
// FAST_POLL_WINDOW_MS. After the window it is reported exactly as before.
// Checks, on the real js/productionSharedHistoryConvergence.js in node:vm:
//   A1 inside the window: two refreshes back to back, both not acknowledged: 0 reports, the converged view is kept
//   A2 the next read converges: the view, still 0 reports, no added read
//   A3 after the window: the same miss again is reported exactly as before (the first held, the second reported once)
//   A4 any other failure is unchanged (the first held, the second reported); the page not holding the ACK reads nothing
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const SRC=fs.readFileSync(path.join(ROOT,"js/productionSharedHistoryConvergence.js"),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};

function page(){
  let now=1_000_000;const reads=[],reports=[];let answer="ok";
  const setup={ready:true,rivalryId:"R1",sessionId:"session-R1",deviceId:"device-1",accountId:"uid-1",managerRole:"playerOne",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:3}};
  const state={commit:{rivalryId:"R1",committed:true,phase:"ACKNOWLEDGED",revision:3,seasonNumber:2,resultsRevision:2,resultsContentHash:"h"},scoring:{rivalryId:"R1",authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonNumber:2,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:"h"}};
  const sandbox={console,Promise,Error,Object,String,Number,Boolean,Date:{now:()=>now},
    currentShowdown:{id:"save-r1",currentRound:2,sharedJourney:{mode:"shared",rivalryId:"R1"}},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
    CareerModeProductionSharedSeasonCommit:{refresh:async()=>state.commit,getState:()=>state.commit},
    CareerModeProductionSharedCanonicalScoring:{refresh:async()=>state.scoring,getState:()=>state.scoring},
    CareerModeSharedHistoryConvergence:{},CareerModeSharedShowdownCatalog:{},CareerModeSparkSharedSeasonCommit:{},CareerModeSharedCanonicalScoring:{},CareerModeSparkSharedCanonicalScoring:{},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{uid:"uid-1"}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkSharedHistoryConvergence:{read:async options=>{
      reads.push(options.throughSeason);
      if(answer!=="ok"){const error=new Error(answer);error.code=answer;throw error;}
      return {ok:true,authoritative:true,phase:"HISTORY_CONVERGED",revision:1,rivalryId:"R1",throughSeason:options.throughSeason,acceptedRevisionKey:`k${options.throughSeason}`,projection:{phase:"HISTORY_CONVERGED",acceptedSeasons:options.throughSeason}};
    }},
    reportApplicationError:(context,error)=>reports.push(`${context}: ${error?.code||error?.message||error}`)};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(SRC,sandbox,{filename:"productionSharedHistoryConvergence.js"});
  return {h:sandbox.CareerModeProductionSharedHistoryConvergence,reads,reports,state,set:a=>{answer=a;},advance:ms=>{now+=ms;}};
}
const NOT_ACKED="HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED";

(async()=>{
  const WINDOW=require("../../js/productionSharedHistoryConvergence.js").fastPollWindowMs;assert.equal(WINDOW,180000);

  // A1 + A2
  {const pg=page();const first=await pg.h.refresh();assert.equal(first?.phase,"HISTORY_CONVERGED");
    pg.set(NOT_ACKED);
    const a=await pg.h.refresh(true),b=await pg.h.refresh(true);
    assert.deepEqual(pg.reports,[],"the commit nudge's two back-to-back misses: no \"Could not bring History up to date\"");
    assert.equal(a,first,"the converged view is kept");assert.equal(b,first);assert.equal(pg.h.getState(),first);
    pg.advance(3000);assert.equal(await pg.h.refresh(true),first);pg.advance(WINDOW-10000);assert.equal(await pg.h.refresh(true),first);assert.deepEqual(pg.reports,[],"still quiet just inside the window");
    pg.set("ok");const v=await pg.h.refresh(true);assert.equal(v.phase,"HISTORY_CONVERGED");assert.deepEqual(pg.reports,[]);assert.equal(pg.reads.length,6,"one read per refresh, nothing added");}
  {const pg=page();pg.set(NOT_ACKED);
    assert.equal(await pg.h.refresh(true),null);assert.equal(await pg.h.refresh(true),null);assert.deepEqual(pg.reports,[],"no view yet: still quiet, nothing reported");
    pg.set("ok");assert.equal((await pg.h.refresh(true)).phase,"HISTORY_CONVERGED","the next read converges");assert.deepEqual(pg.reports,[]);}
  ok("A1","inside the window: the not-acknowledged misses are held quietly, the view kept");
  ok("A2","the next read converges: 0 reports, one read per refresh");

  // A3
  {const pg=page();await pg.h.refresh();pg.set(NOT_ACKED);
    await pg.h.refresh(true);pg.advance(WINDOW);
    await pg.h.refresh(true);assert.deepEqual(pg.reports,[],"the first miss after the window is held, as before");
    await pg.h.refresh(true);assert.equal(pg.reports.length,1,"the second is reported once, as before");assert.match(pg.reports[0],/^Could not bring History up to date: HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED/);
    pg.set("ok");await pg.h.refresh(true);pg.set(NOT_ACKED);await pg.h.refresh(true);await pg.h.refresh(true);assert.equal(pg.reports.length,1,"a converged read starts a fresh window");}
  ok("A3","after the window: reported exactly as before (the first held, the second reported once)");

  // A4
  {const pg=page();await pg.h.refresh();pg.set("HISTORY_CONVERGENCE_SCORING_INVALID");await pg.h.refresh(true);assert.deepEqual(pg.reports,[]);await pg.h.refresh(true);assert.equal(pg.reports.length,1,"another failure: the first held, the second reported, as before");}
  {const pg=page();pg.state.commit={...pg.state.commit,phase:"COMMITTED",revision:2};pg.set(NOT_ACKED);assert.equal(await pg.h.refresh(true),null);assert.deepEqual(pg.reads,[],"the page not holding the ACK reads nothing (unchanged)");assert.deepEqual(pg.reports,[]);}
  assert.doesNotMatch(SRC,/runTransaction|\.set\(|\.update\(|\.delete\(/,"no write");
  ok("A4","any other failure unchanged; nothing read while the page does not hold the ACK");
  console.log(`PASS r100 History after this phone's season commit (${n} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
