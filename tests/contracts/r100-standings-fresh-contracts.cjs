"use strict";
// r100 H2-1 PR B (lead 2026-11-27, design approved with no cap; Nik: "Standings opened in the middle of a Showdown must
// always show the scores"). A phone with no kept copy of this Showdown's numbers (a new phone, or site data cleared) made
// THIS SHOWDOWN say "load once you continue it from Home". Now, once per Standings open and only on such a phone, it makes the
// session-free verified read History and Final Winner use for finished Showdowns (js/sparkCompletedShowdownReader.js
// readActiveShowdown): the rivalry, the setup ledger, then each accepted season's commit, public results and both role
// results, stopping at the first commit that is not ACKNOWLEDGED. Verified there and again by the adapter, then kept, so the
// next open is PR A's one-read check. No listener, no retry; at most 6 s behind the loading screen, then the notice; any
// failure is the notice, never a partial or unverified score.
// Checks, on the real Standings block in node:vm with the real adapter and real projections (the reader stubbed), and on the
// real reader with exact-get fakes:
//   B1 no copy: one verified read, the scores and season; kept as a History copy; the next open reads once (PR A's check)
//   B2 no season accepted yet: 0 - 0 in season 1, exactly as the progression's own zero view shows it; kept
//   B3 the reader says unavailable, not active, another Showdown, throws, or hands back numbers that fail the adapter's
//      check: the notice, nothing kept
//   B4 the read hangs: loading at most 6 s, then the notice; its late answer still shows, and is kept
//   B5 once per open: redraws and a second open while it runs make no second read; a failed open's next open tries once more
//   B6 a phone with a copy, or in the game: no verified read at all
//   B7 the real reader: an ACTIVE root only (closed, pending, test or Terminal-Closed roots read nothing more), managers bound,
//      the setup ledger required; exact gets only, never a session, transaction, list, write or browser storage
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const F=require("../support/active-showdown-fixtures.cjs");
const A=require("../../js/sharedActiveShowdownAdapter.js"),S=require("../../js/seasonFinalV10.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");
const J=x=>JSON.parse(JSON.stringify(x));
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const SRC=read("js/seasonFinalV10.js");
const BLOCK=(()=>{const a=SRC.indexOf("  const state=name=>"),b=SRC.indexOf("  // A supplied model first, then the provider-backed career model");assert.ok(a>0&&b>a,"the Standings rivalry block is where it was");return SRC.slice(a,b);})();
const KEY="cms.liveStandings.v1",READ=6000;

function page({snapshot,copy=null,commit=null,reader=null,liveCanArrive=false}){
  let now=1_000_000;const timers=[];const storage=new Map();if(copy)storage.set(KEY,typeof copy==="string"?copy:JSON.stringify(copy));
  const reads=[],calls=[];
  const sdk={doc:(_db,...parts)=>parts.join("/"),getDoc:async()=>{throw new Error("the stubbed reader makes the gets");},runTransaction:async(_db,fn)=>fn({get:async ref=>{reads.push(ref);return {exists:()=>Boolean(commit),data:()=>commit};}})};
  const states={CareerModeOnlinePlayerIdentity:snapshot.identity,CareerModePersistentNikDanielPair:snapshot.pair,CareerModeProductionSharedMultiSeasonProgression:snapshot.multiSeason||null,CareerModeProductionSharedHistoryConvergence:snapshot.history||null,CareerModeProductionSharedFinalReconciliation:null,CareerModeProductionSharedTerminalClose:snapshot.terminalClose||null};
  const root={CareerModeSharedActiveShowdownAdapter:A,
    readStorageValue:key=>storage.has(key)?storage.get(key):null,writeStorageValue:(key,value)=>{storage.set(key,value);return true;},
    setTimeout:(fn,ms)=>{timers.push({at:now+ms,fn});return timers.length;},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},
    CareerModeProductionSharedShowdownSetup:{getState:()=>liveCanArrive?{sessionId:F.SESSION}:null}};
  if(reader)root.CareerModeSparkCompletedShowdownReader={readActiveShowdown:options=>{calls.push(options.rivalryId);return reader(options);}};
  for(const [k,v] of Object.entries(states))root[k]={...(root[k]||{}),getState:()=>v};
  root.CareerModeProductionSharedHistoryConvergence.isActive=()=>liveCanArrive;
  const ctx={root,Date:{now:()=>now},JSON,Promise,Number,String,Boolean,Object,Array,RegExp,Error,console};
  vm.createContext(ctx);
  vm.runInContext(`let signature="";function wake(){globalThis.__wakes=(globalThis.__wakes||0)+1;}\n${BLOCK}\nglobalThis.api={currentRivalry,sfPrepareKeptStandings,sfStandingsShown};`,ctx);
  const flush=async()=>{for(let k=0;k<3;k++){for(let i=0;i<20;i++)await Promise.resolve();await new Promise(r=>setImmediate(r));}};
  const advance=async ms=>{now+=ms;for(const t of timers.filter(t=>t.at<=now&&!t.done)){t.done=true;t.fn();}await flush();};
  // one entry to Standings: another screen was shown before it (each entry is its own open, PR A S11)
  const open=async()=>{ctx.api.sfStandingsShown("mainMenu");await ctx.api.sfPrepareKeptStandings();await flush();return J(ctx.api.currentRivalry());};
  return {api:ctx.api,reads,calls,storage,flush,advance,open,wakes:()=>ctx.__wakes||0,kept:()=>storage.has(KEY)?JSON.parse(storage.get(KEY)):null};
}
const home=p=>({identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:null,history:null,terminalClose:null});
const active=(p,setup)=>async()=>({status:"active",code:null,rivalryId:p.rivalryId,managerRole:"playerOne",acceptedSeasons:p.acceptedSeasons,projection:J(p),setup});
const NOTICE={status:"unavailable",notice:"continue"};

(async()=>{
  const seasons=[[F.result({championsLeague:true}),F.result({leaguePosition:1})],[F.result({domesticCup:true}),F.result({leaguePosition:2,leaguePoints:95})],[F.result(),F.result()]];
  const p1=F.projection({totalSeasons:3,seasons:seasons.slice(0,1)}),p2=F.projection({totalSeasons:3,seasons:seasons.slice(0,2)});
  const setup={leagueId:p1.leagueId,totalSeasons:3,clubs:{playerOne:p1.managerRecords.playerOne.club,playerTwo:p1.managerRecords.playerTwo.club}};
  const score=p=>({daniel:p.managerRecords.playerOne.totalPoints,nik:p.managerRecords.playerTwo.totalPoints});
  // The same Showdown read live (progression + History in the game): what the verified read must equal.
  const liveView=p=>J(A.rivalryView({identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:F.multiFor(p),history:F.history(p)}));

  // B1
  {const pg=page({snapshot:home(p2),reader:active(p2,setup),commit:{phase:"COMMITTED",revision:2,seasonNumber:3}});
    assert.equal(pg.api.currentRivalry().status,"loading","reading: loading (behind the loading screen)");
    const v=await pg.open();assert.equal(pg.calls.length,1,"one verified read");assert.equal(pg.reads.length,0,"and no second check this open");
    assert.equal(v.status,"ready");assert.deepEqual(v.score,score(p2));assert.equal(v.season,3);assert.equal(v.totalSeasons,3);
    const live=liveView(p2);for(const k of ["score","season","totalSeasons","leagueId","clubs","managers","seasons"])assert.deepEqual(v[k],live[k],`${k} as the live numbers show it`);
    const f=S.standingsFrames(v,null);assert.equal(f.SHOWDOWN.model.status,"ready");assert.deepEqual(f.SHOWDOWN.model.score,score(p2));
    const kept=pg.kept();assert.equal(kept.schemaVersion,1);assert.equal(kept.rivalryId,p2.rivalryId);assert.equal(kept.history.phase,"HISTORY_CONVERGED");assert.equal(kept.history.projection.acceptedSeasons,2);
    for(let i=0;i<5;i++)pg.api.currentRivalry();assert.equal(pg.calls.length,1,"redraws read nothing");
    const again=await pg.open();assert.equal(again.status,"ready");assert.equal(pg.calls.length,1,"the next open does not read it all again");
    assert.deepEqual(pg.reads,[`rivalries/${p2.rivalryId}/seasonCommits/season_3`],"it makes PR A's one check of the next season's commit");}
  ok("B1","no copy: one verified read shows the scores and season exactly as live; kept, so the next open is one read");

  // B2
  {const p0=F.projection({totalSeasons:3,seasons:seasons.slice(0,1)});
    const pg=page({snapshot:home(p0),reader:async()=>({status:"active",code:null,rivalryId:p0.rivalryId,managerRole:"playerOne",acceptedSeasons:0,projection:null,setup}),commit:null});
    const v=await pg.open();assert.equal(v.status,"empty");assert.deepEqual(v.score,{daniel:0,nik:0});assert.equal(v.season,1);assert.equal(v.totalSeasons,3);
    const progressionZero=J(A.rivalryView({identity:F.identity(),pair:F.pair(p0.rivalryId),multiSeason:F.multi({rivalryId:p0.rivalryId,leagueId:setup.leagueId,totalSeasons:3,clubs:setup.clubs,acceptedSeasons:0}),history:null}));
    assert.deepEqual(v,progressionZero,"the same view the progression's own zero view gives");
    assert.equal(pg.kept().view.state.acceptedSeasons,0,"kept as a zero view");
    await pg.open();assert.deepEqual(pg.reads,[`rivalries/${p0.rivalryId}/seasonCommits/season_1`],"next open: season 1's commit is the one check");}
  ok("B2","no season accepted yet: 0 - 0 in season 1, exactly the progression's zero view; kept");

  // B3
  {const other=F.projection({seed:"9",totalSeasons:3,seasons:seasons.slice(0,1)});
    const tampered=J(p1);tampered.managerRecords.playerOne.totalPoints+=5;
    const cases=[["unavailable",async()=>({status:"unavailable",code:"COMPLETED_SEASON_INVALID",rivalryId:p1.rivalryId,projection:null,setup:null})],
      ["not active",async()=>({status:"not-active",code:null,rivalryId:p1.rivalryId,projection:null,setup:null})],
      ["another Showdown",active(other,setup)],["a throw",async()=>{throw new Error("offline");}],
      ["altered numbers",async()=>({status:"active",code:null,rivalryId:p1.rivalryId,managerRole:"playerOne",acceptedSeasons:1,projection:tampered,setup})],
      ["a zero view with no setup",async()=>({status:"active",code:null,rivalryId:p1.rivalryId,managerRole:"playerOne",acceptedSeasons:0,projection:null,setup:null})]];
    for(const [label,reader] of cases){const pg=page({snapshot:home(p1),reader});const v=await pg.open();assert.deepEqual(v,NOTICE,`${label}: the notice`);assert.equal(pg.kept(),null,`${label}: nothing kept`);assert.equal(pg.calls.length,1);}
    const none=page({snapshot:home(p1)});assert.deepEqual(await none.open(),NOTICE,"the reader cannot load: the notice");}
  ok("B3","unavailable, not active, another Showdown, a throw or numbers that fail the adapter: the notice, nothing kept");

  // B4
  {let answer;const pg=page({snapshot:home(p1),reader:()=>new Promise(r=>{answer=r;})});
    const prep=pg.api.sfPrepareKeptStandings();let settled=false;prep.then(()=>{settled=true;});await pg.flush();
    assert.equal(pg.api.currentRivalry().status,"loading");await pg.advance(READ-1);assert.equal(settled,false);assert.equal(pg.api.currentRivalry().status,"loading");
    await pg.advance(1);assert.equal(settled,true,"the loading screen lets go after 6 s");assert.deepEqual(J(pg.api.currentRivalry()),NOTICE,"then the notice, not loading");
    const w=pg.wakes();answer({status:"active",code:null,rivalryId:p1.rivalryId,managerRole:"playerOne",acceptedSeasons:1,projection:J(p1),setup});await pg.flush();
    assert.ok(pg.wakes()>w,"the late answer wakes the screen");const v=J(pg.api.currentRivalry());assert.equal(v.status,"ready");assert.deepEqual(v.score,score(p1));assert.ok(pg.kept(),"and is kept");}
  ok("B4","the read hangs: loading for 6 s at most, then the notice; the late verified answer still shows and is kept");

  // B5
  {let answer;const pg=page({snapshot:home(p1),reader:()=>new Promise(r=>{answer=r;})});pg.api.sfPrepareKeptStandings();await pg.flush();
    for(let i=0;i<5;i++)pg.api.currentRivalry();pg.api.sfStandingsShown("standings");pg.api.sfStandingsShown("mainMenu");pg.api.sfStandingsShown("standings");await pg.flush();assert.equal(pg.calls.length,1,"redraws, and a second entry while it runs: still one read (taken over)");
    answer({status:"active",code:null,rivalryId:p1.rivalryId,managerRole:"playerOne",acceptedSeasons:1,projection:J(p1),setup});await pg.flush();assert.equal(pg.api.currentRivalry().status,"ready");}
  {let fail=true;const pg=page({snapshot:home(p1),reader:async o=>{if(fail)throw new Error("offline");return active(p1,setup)(o);},commit:null});
    assert.deepEqual(await pg.open(),NOTICE);for(let i=0;i<5;i++)pg.api.currentRivalry();await pg.advance(600000);assert.equal(pg.calls.length,1,"no retry on its own, even after 10 minutes");
    fail=false;const v=await pg.open();assert.equal(pg.calls.length,2,"the next open tries once more");assert.equal(v.status,"ready");}
  ok("B5","once per open: no second read while it runs, no retry on its own; the next open tries once more");

  // B6
  {const copy={schemaVersion:1,rivalryId:p1.rivalryId,history:J(F.history(p1))};
    const pg=page({snapshot:home(p1),copy,commit:null,reader:active(p1,setup)});const v=await pg.open();assert.equal(v.status,"ready");assert.equal(pg.calls.length,0,"a kept copy: PR A's one check, never the full read");assert.equal(pg.reads.length,1);
    const behind=page({snapshot:home(p1),copy,commit:{phase:"ACKNOWLEDGED",revision:3,seasonNumber:2},reader:active(p2,setup)});assert.deepEqual(await behind.open(),NOTICE,"a copy behind keeps the notice (PR A)");assert.equal(behind.calls.length,0);
    const live={identity:F.identity(),pair:F.pair(p1.rivalryId),multiSeason:F.multiFor(p1),history:F.history(p1),terminalClose:null};
    const game=page({snapshot:live,reader:active(p1,setup),liveCanArrive:true});assert.equal((await game.open()).status,"ready");assert.equal(game.calls.length,0,"in the game: no verified read");
    const closed=page({snapshot:{...home(p1),pair:F.pair(p1.rivalryId,{status:"waiting",connectionState:"closed"})},reader:active(p1,setup)});await closed.open();assert.equal(closed.calls.length,0,"a pair that is not active: no read");}
  ok("B6","a phone with a kept copy, a pair not active, or the game itself: no verified read");

  // B7
  {const RID=p1.rivalryId,A1="acct_daniel",B1="acct_nik";
    const canonical=v=>{if(v===undefined||v===null)return null;if(v&&typeof v.toMillis==="function")return {$timestamp:v.toMillis()};if(Array.isArray(v))return v.map(canonical);if(typeof v==="object"){const out={};for(const k of Object.keys(v).sort())out[k]=canonical(v[k]);return out;}return v;};
    const sha=v=>"sha256:"+crypto.createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");
    const rivalryDoc=data=>({schemaVersion:1,objectType:"rivalry",objectId:RID,revision:4,parentRevision:3,lifecycleState:"live",contentHash:sha({objectType:"rivalry",objectId:RID,revision:4,data}),priorContentHash:`sha256:${"0".repeat(64)}`,updatedAt:{toMillis:()=>1},data,tombstone:null});
    const slots=[{slotId:"playerOne",accountId:A1,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},{slotId:"playerTwo",accountId:B1,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}];
    const data=(state,extra={})=>({connectionState:state,managerSlots:slots,authorizedAccountIds:[A1,B1],createdByAccountId:A1,...extra});
    const run=async(docs,uid=A1)=>{const log=[];const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};}};
      return {r:await Reader.readActiveShowdown({firestore:{},firebaseSdk:sdk,user:{uid},rivalryId:RID,cryptoImpl:crypto.webcrypto}),log};};
    const root0=`rivalries/${RID}`;
    assert.equal(typeof Reader.readActiveShowdown,"function");assert.equal(Object.isFrozen(Reader),true);
    for(const [label,d] of [["closed",data("closed")],["pending",data("pending-pair")],["test",data("active",{mode:"test"})],["terminal-closed",data("active",{terminalClose:{}})]]){
      const {r,log}=await run({[root0]:rivalryDoc(d)});assert.equal(r.status,"not-active",label);assert.equal(r.projection,null);assert.deepEqual(log,[root0],`${label}: nothing read below the root`);}
    {const {r,log}=await run({[root0]:rivalryDoc(data("active"))});assert.equal(r.status,"unavailable");assert.equal(r.code,"COMPLETED_SETUP_INVALID","no setup ledger: unavailable");assert.deepEqual(log,[root0,`${root0}/sharedSetup/authoritative`]);}
    {const {r,log}=await run({[root0]:rivalryDoc(data("active"))},"acct_stranger");assert.equal(r.code,"COMPLETED_NOT_A_MANAGER");assert.deepEqual(log,[root0]);}
    {const v=rivalryDoc(data("active"));v.data={...v.data,managerSlots:[slots[0],slots[0]]};const {r}=await run({[root0]:v});assert.equal(r.code,"COMPLETED_RIVALRY_INTEGRITY_FAILED","a root that does not match its hash");}
    {const {r}=await run({});assert.equal(r.status,"unavailable");assert.equal(r.code,"COMPLETED_RIVALRY_MISSING");assert.equal(Object.isFrozen(r),true);}
    const src=read("js/sparkCompletedShowdownReader.js"),fn=src.slice(src.indexOf("async function csrReadActive"),src.indexOf("// r86 (red team #7)"));
    for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/setDoc|updateDoc|deleteDoc|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"/,/onSnapshot/])assert.doesNotMatch(fn,banned,String(banned));
    assert.equal((fn.match(/csrGet\(/g)||[]).length,6,"exact gets: the root, the ledger, then per season the commit and its three results");
    assert.match(fn,/if\(!commitDoc\|\|commitDoc\.phase!=="ACKNOWLEDGED"\)break;/,"it stops at the first season whose commit is not ACKNOWLEDGED");
    assert.match(fn,/csrModules\.history\.verifyProjection\(projection\)/,"the projection is verified");
    assert.equal((SRC.match(/readActiveShowdown\(/g)||[]).length,1,"Standings is its only caller");}
  ok("B7","the real reader: ACTIVE roots only, managers bound, the setup ledger required, exact gets only, stops at the first non-ACKNOWLEDGED commit");
  console.log(`PASS r100 Standings on a phone with no kept copy (${n} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
