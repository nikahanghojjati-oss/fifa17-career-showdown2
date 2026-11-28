"use strict";
// r100 H2-1 (P1, lead 2026-11-27; Nik: "Standings opened in the middle of a Showdown must always show the scores and
// everything, and never sit stuck loading"). After an app reopen mid-Showdown (signed in on Home, STANDINGS straight away),
// THIS SHOWDOWN showed "This Showdown's live numbers load once you continue it from Home" instead of the scores: the live
// providers only start with CONTINUE, so the adapter said loading and r87 C-01 turned that into the notice. A provider that is
// half up (History active and a session known, but no numbers) left "Loading standings." with no end.
// The fix (js/seasonFinalV10.js currentRivalry, js/productionSharedMultiSeasonProgression.js pmspKeepForStandings):
//   - every authoritative Multi Season read keeps its view on the phone (cms.liveStandings.v1, the newest Showdown only)
//   - Standings out of the game uses that copy only when the pair (read on Home) still names the Showdown as active and ONE
//     read of the next season's commit shows it is not ACKNOWLEDGED (so the copy holds every accepted season); a finished
//     last season needs no read; the adapter verifies the projection exactly as for live numbers
//   - the read is made once per Standings open (no listener, no retry), waited for behind the loading screen, and gives up
//     after 6 s; a copy behind, unread or for another Showdown keeps the notice; live numbers that do not come within 8 s
//     take the same path, so no path stays on "Loading standings."
// Checks, on the real code in node:vm with the real adapter and a real provider view:
//   S1 tip case, no copy: the notice, no read
//   S2 copy current: one read (season n+1, a read-only transaction), the copy's scores and season, Standings' own frame
//   S3 copy behind (season n+1 ACKNOWLEDGED since): the notice, never the older standing
//   S4 the read fails or never answers: the notice after 6 s at most; never loading after that
//   S5 a copy for another Showdown, a pair not active (closed, pending, unpaired) or a broken copy: no read, the notice
//   S6 all seasons accepted (or terminal): the copy with no read; none accepted yet: 0 - 0, season 1, after one read
//   S7 half-up providers: loading for at most 8 s, then the copy (one read) or the notice
//   S8 in the game (live numbers ready): the live view, no read, the copy is not looked at
//   S9 every open makes its own single read (no cached verdict from an earlier open), and CAREER is not touched
//   S10 the progression keeps the copy on every authoritative read; the Showdown reset leaves storage alone
//   S11 through the real loader (prepare runs once per page): every entry to Standings makes its own one read (Codex P2)
//   S12 in the game with the live numbers late: "Live numbers are on their way. Nothing is lost." and CHECK AGAIN (Verify F2)
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const F=require("../support/active-showdown-fixtures.cjs");
const A=require("../../js/sharedActiveShowdownAdapter.js"),S=require("../../js/seasonFinalV10.js");
const Provider=require("../../js/sparkSharedMultiSeasonProgression.js");
const J=x=>JSON.parse(JSON.stringify(x));
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const SRC=read("js/seasonFinalV10.js");
const BLOCK=(()=>{const a=SRC.indexOf("  const state=name=>"),b=SRC.indexOf("  // A supplied model first, then the provider-backed career model");assert.ok(a>0&&b>a,"the Standings rivalry block is where it was");return SRC.slice(a,b);})();
const KEY="cms.liveStandings.v1",WAIT=8000,READ=6000;

async function providerView(p,setup){
  const provider=Provider.createProvider({authorityReader:async()=>({setup,managerRole:"playerOne",acceptedSeasons:p.acceptedSeasons}),historyProvider:{read:async()=>F.history(p)}});
  const v=await provider.read({user:{uid:"acct_daniel"},rivalryId:p.rivalryId,sessionId:F.SESSION,deviceId:"device_"+"d".repeat(32),firestore:{},firebaseSdk:{doc(){},runTransaction(){}},nowEpochMs:1000});
  assert.equal(v.ok,true,"a real provider view");return JSON.parse(JSON.stringify(v));
}
// A page: the real block, a clock, storage, the services and the providers' states.
function page({snapshot,copy=null,commit=null,readFails=false,readHangs=false,liveCanArrive=false}){
  let now=1_000_000;const timers=[];const storage=new Map();if(copy!==undefined&&copy!==null)storage.set(KEY,typeof copy==="string"?copy:JSON.stringify(copy));
  const reads=[];let wakes=0;
  const sdk={doc:(_db,...parts)=>parts.join("/"),runTransaction:async(_db,fn)=>fn({get:async ref=>{reads.push(ref);if(readFails)throw new Error("unavailable");if(readHangs)return new Promise(()=>{});return {exists:()=>Boolean(commit),data:()=>commit};}})};
  const states={CareerModeOnlinePlayerIdentity:snapshot.identity,CareerModePersistentNikDanielPair:snapshot.pair,CareerModeProductionSharedMultiSeasonProgression:snapshot.multiSeason||null,CareerModeProductionSharedHistoryConvergence:snapshot.history||null,CareerModeProductionSharedFinalReconciliation:null,CareerModeProductionSharedTerminalClose:snapshot.terminalClose||null};
  const root={CareerModeSharedActiveShowdownAdapter:A,
    readStorageValue:key=>storage.has(key)?storage.get(key):null,
    setTimeout:(fn,ms)=>{timers.push({at:now+ms,fn});return timers.length;},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},
    CareerModeProductionSharedShowdownSetup:{getState:()=>liveCanArrive?{sessionId:F.SESSION}:null}};
  for(const [k,v] of Object.entries(states))root[k]={...(root[k]||{}),getState:()=>v};
  root.CareerModeProductionSharedHistoryConvergence.isActive=()=>liveCanArrive;
  const ctx={root,Date:{now:()=>now},JSON,Promise,Number,String,Boolean,Object,Array,RegExp,Error,console};
  vm.createContext(ctx);
  vm.runInContext(`let signature="";function wake(){globalThis.__wakes=(globalThis.__wakes||0)+1;}\n${BLOCK}\nglobalThis.api={currentRivalry,sfPrepareKeptStandings,sfStandingsShown,sfStandingsCheckAgain};`,ctx);
  const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();await new Promise(r=>setImmediate(r));for(let i=0;i<20;i++)await Promise.resolve();};
  const advance=async ms=>{now+=ms;for(const t of timers.filter(t=>t.at<=now&&!t.done)){t.done=true;t.fn();}await flush();};
  return {api:ctx.api,reads,storage,flush,advance,wakes:()=>ctx.__wakes||0,frames:()=>S.standingsFrames(ctx.api.currentRivalry(),null)};
}
// The Showdown a reopened Daniel sees on Home: the pair read, nothing else.
const home=p=>({identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:null,history:null,terminalClose:null});

(async()=>{
  const seasons=[[F.result({championsLeague:true}),F.result({leaguePosition:1})],[F.result({domesticCup:true}),F.result({leaguePosition:2,leaguePoints:95})],[F.result(),F.result()]];
  const p1=F.projection({totalSeasons:3,seasons:seasons.slice(0,1)}),p2=F.projection({totalSeasons:3,seasons:seasons.slice(0,2)}),p3=F.projection({totalSeasons:3,seasons});
  const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:p1.leagueId,totalSeasons:3,clubs:{playerOne:p1.managerRecords.playerOne.club,playerTwo:p1.managerRecords.playerTwo.club}};
  const v1=await providerView(p1,setup),v3=await providerView(p3,setup);
  const copy1={schemaVersion:1,rivalryId:p1.rivalryId,view:v1},copy3={schemaVersion:1,rivalryId:p3.rivalryId,view:v3};
  const pending={phase:"COMMITTED",revision:2,seasonNumber:2},acked={phase:"ACKNOWLEDGED",revision:3,seasonNumber:2};
  const score1={daniel:p1.managerRecords.playerOne.totalPoints,nik:p1.managerRecords.playerTwo.totalPoints};

  // S1
  {const pg=page({snapshot:home(p1)});await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.deepEqual(J(pg.api.currentRivalry()),{status:"unavailable",notice:"continue"},"no copy on this phone: the notice, as on the tip");assert.equal(pg.reads.length,0,"and no read");}
  ok("S1","no copy on this phone (a fresh device): the 'continue it from Home' notice, no read");

  // S2
  {const pg=page({snapshot:home(p1),copy:copy1,commit:pending});
    const before=pg.api.currentRivalry();assert.equal(before.status,"loading","checking: loading (behind the loading screen)");
    await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.deepEqual(pg.reads,[`rivalries/${p1.rivalryId}/seasonCommits/season_2`],"exactly one read: the next season's commit");
    const v=pg.api.currentRivalry();assert.equal(v.status,"ready");assert.deepEqual(v.score,score1,"the copy's scores");assert.equal(v.season,2,"season 2 is the one being played");assert.equal(v.totalSeasons,3);
    const f=pg.frames();assert.equal(f.SHOWDOWN.model.status,"ready");assert.deepEqual(f.SHOWDOWN.model.score,score1,"Standings' own frame carries the scores");
    for(let i=0;i<5;i++)pg.api.currentRivalry();assert.equal(pg.reads.length,1,"redraws make no more reads");}
  ok("S2","copy current: one read of season 2's commit, then THIS SHOWDOWN shows the copy's scores and season");

  // S3
  {const pg=page({snapshot:home(p1),copy:copy1,commit:acked});await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.equal(pg.reads.length,1);assert.deepEqual(J(pg.api.currentRivalry()),{status:"unavailable",notice:"continue"},"a season accepted since: never the older standing");}
  ok("S3","copy behind (season 2 ACKNOWLEDGED since): the notice, never the older standing");

  // S4
  {const pg=page({snapshot:home(p1),copy:copy1,readFails:true});await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.deepEqual(J(pg.api.currentRivalry()),{status:"unavailable",notice:"continue"},"a failed read: the notice");}
  {const pg=page({snapshot:home(p1),copy:copy1,readHangs:true});const prep=pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.equal(pg.api.currentRivalry().status,"loading","no answer yet: loading");
    let settled=false;prep.then(()=>{settled=true;});await pg.advance(READ-1);assert.equal(settled,false);assert.equal(pg.api.currentRivalry().status,"loading");
    await pg.advance(1);assert.equal(settled,true,"the loading screen lets go after 6 s");
    assert.deepEqual(J(pg.api.currentRivalry()),{status:"unavailable",notice:"continue"},"no answer in 6 s: the notice, not loading");assert.ok(pg.wakes()>=1,"and the screen is drawn again");assert.equal(pg.reads.length,1);}
  ok("S4","the read fails or never answers: the notice after 6 s at most, never loading after that");

  // S5
  {const other=F.projection({seed:"9",totalSeasons:3,seasons:seasons.slice(0,1)});assert.notEqual(other.rivalryId,p1.rivalryId);
    const cases=[["another Showdown's copy",home(other),copy1],["a closed pair",{...home(p1),pair:F.pair(p1.rivalryId,{status:"waiting",connectionState:"closed"})},copy1],["a code still waiting to be joined",{...home(p1),pair:F.pair(p1.rivalryId,{connectionState:"pending-pair"})},copy1],["a broken copy",home(p1),"{not json"],["a copy from another version",home(p1),{...copy1,schemaVersion:2}],["a copy that is not authoritative",home(p1),{...copy1,view:{...v1,authoritative:false}}]];
    for(const [label,snapshot,copy] of cases){const pg=page({snapshot,copy,commit:pending});await pg.api.sfPrepareKeptStandings();await pg.flush();const v=pg.api.currentRivalry();
      assert.notEqual(v.status,"ready",`${label}: never shown`);assert.notEqual(v.status,"loading",`${label}: not loading`);assert.equal(pg.reads.length,0,`${label}: no read`);}
    const tampered=JSON.parse(JSON.stringify(copy1));tampered.view.projection.managerRecords.playerOne.totalPoints+=5;
    const pg=page({snapshot:home(p1),copy:tampered,commit:pending});await pg.api.sfPrepareKeptStandings();await pg.flush();assert.notEqual(pg.api.currentRivalry().status,"ready","a copy whose numbers were changed fails the adapter's own check");}
  ok("S5","a copy for another Showdown, a pair not active, or a broken, foreign-version or altered copy: never shown, no read for the first ones");

  // S6
  {const pg=page({snapshot:home(p3),copy:copy3,commit:null});await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.equal(pg.reads.length,0,"every season accepted: nothing later to check");const v=pg.api.currentRivalry();assert.equal(v.status,"ready");assert.equal(v.season,3);
    assert.deepEqual(v.score,{daniel:p3.managerRecords.playerOne.totalPoints,nik:p3.managerRecords.playerTwo.totalPoints});}
  {const p0=F.projection({totalSeasons:3,seasons:seasons.slice(0,1)}),v0=JSON.parse(JSON.stringify(F.multi({rivalryId:p0.rivalryId,leagueId:p0.leagueId,totalSeasons:3,clubs:{playerOne:p0.managerRecords.playerOne.club,playerTwo:p0.managerRecords.playerTwo.club},acceptedSeasons:0})));
    const pg=page({snapshot:home(p0),copy:{schemaVersion:1,rivalryId:p0.rivalryId,view:v0},commit:null});await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.deepEqual(pg.reads,[`rivalries/${p0.rivalryId}/seasonCommits/season_1`],"no season accepted yet: season 1's commit is the one read");
    const v=pg.api.currentRivalry();assert.equal(v.status,"empty");assert.deepEqual(J(v.score),{daniel:0,nik:0});assert.equal(v.season,1);}
  ok("S6","all seasons accepted: the copy with no read; no season accepted yet: 0 - 0 in season 1 after one read");

  // S7
  {const half={...home(p1),history:{ok:false,rivalryId:p1.rivalryId}};
    const pg=page({snapshot:{...half,history:null},copy:copy1,commit:pending,liveCanArrive:true});await pg.api.sfPrepareKeptStandings();await pg.flush();
    assert.equal(pg.api.currentRivalry().status,"loading","the live numbers may still come: loading");assert.equal(pg.reads.length,0,"no read while they may come");
    await pg.advance(WAIT-1);assert.equal(pg.api.currentRivalry().status,"loading");
    await pg.advance(51);assert.ok(pg.wakes()>=1,"the screen is woken when the wait ends");pg.api.currentRivalry();await pg.flush();
    const v=pg.api.currentRivalry();assert.equal(v.status,"ready","after 8 s: the checked copy");assert.deepEqual(v.score,score1);assert.equal(pg.reads.length,1);}
  {const pg=page({snapshot:home(p1),liveCanArrive:true});await pg.api.sfPrepareKeptStandings();assert.equal(pg.api.currentRivalry().status,"loading");await pg.advance(WAIT+100);pg.api.currentRivalry();await pg.flush();assert.deepEqual(J(pg.api.currentRivalry()),{status:"unavailable",notice:"onTheWay"},"no copy, in the game (and here no verified read can be made): 'on their way' after 8 s (Verify F2: never 'continue from Home'), not loading forever");assert.equal(pg.reads.length,0);}
  ok("S7","half-up providers: loading for at most 8 s, then the checked copy or the notice");

  // S8
  {const live={identity:F.identity(),pair:F.pair(p1.rivalryId),multiSeason:F.multiFor(p1),history:F.history(p1),terminalClose:null};
    const pg=page({snapshot:live,copy:"{never read",commit:acked,liveCanArrive:true});await pg.api.sfPrepareKeptStandings();await pg.flush();
    const v=pg.api.currentRivalry();assert.equal(v.status,"ready");assert.deepEqual(v.score,score1);assert.equal(pg.reads.length,0,"in the game: no read");}
  ok("S8","in the game the live view stands: no read, the copy is not looked at");

  // S9
  {const pg=page({snapshot:home(p1),copy:copy1,commit:pending});for(let open=1;open<=3;open++){await pg.api.sfPrepareKeptStandings();await pg.flush();assert.equal(pg.api.currentRivalry().status,"ready");assert.equal(pg.reads.length,open,`open ${open}: its own single read`);pg.api.sfStandingsShown("standings");await pg.flush();assert.equal(pg.reads.length,open,"the same entry's shown signal adds no read");pg.api.sfStandingsShown("mainMenu");}}
  assert.ok(!/sfKept|sfCopy/.test(SRC.slice(SRC.indexOf("function currentCareer"),SRC.indexOf("function currentCareer")+600)),"CAREER's model is not touched");
  assert.equal((SRC.match(/sfKeptView\(/g)||[]).length,4,"the copy is used by THIS SHOWDOWN only (currentRivalry and the Standings prepare, twice: a copy found behind goes on to the verified read)");
  assert.equal((SRC.match(/sfFreshView\(/g)||[]).length,3,"the verified read for a phone with no copy starts only from sfKeptView (tests/contracts/r100-standings-fresh-contracts.cjs)");
  assert.ok(SRC.includes('prepare:()=>Promise.all([prepare("standings"),standingsModules(),sfEnsureChip(),sfPrepareKeptStandings()])'),"Standings' loader waits for the one read behind the loading screen");
  ok("S9","each Standings open makes its own single read; CAREER is not touched");

  // S10
  const P=read("js/productionSharedMultiSeasonProgression.js");
  assert.match(P,/view=result;contextKey=request\.key;pmspNoteLiveSeason\(request\.rivalryId,Number\(result\.state\.acceptedSeasons\)\);pmspKeepForStandings\(request\.rivalryId,result\);/,"every authoritative read keeps its view");
  assert.ok(P.includes('const PMSP_STANDINGS_KEY="cms.liveStandings.v1";')&&P.includes("JSON.stringify({schemaVersion:1,rivalryId,view:result})"),"the copy's key and shape match what Standings reads");
  assert.ok(!/\["multi-season"\]=\(\)=>\{[^}]*PMSP_STANDINGS_KEY/.test(P),"the Showdown reset leaves storage alone (a new Showdown's copy simply replaces it)");
  {const sandbox={root:{writeStorageValue:(k,v)=>{sandbox.written=[k,v];return true;}},JSON};vm.createContext(sandbox);
    const fn=P.match(/  let pmspKeptKey="";\n  function pmspKeepForStandings\(rivalryId,result\)\{[^\n]*\n/)[0];let writes=0;sandbox.root.writeStorageValue=(k,v)=>{writes+=1;sandbox.written=[k,v];return true;};
    vm.runInContext(`const PMSP_STANDINGS_KEY="cms.liveStandings.v1";${fn};for(let i=0;i<3;i++)pmspKeepForStandings(${JSON.stringify(p1.rivalryId)},${JSON.stringify(v1)});`,sandbox);
    assert.equal(writes,1,"the same view three polls running is written once");assert.equal(sandbox.written[0],KEY);const pg=page({snapshot:home(p1),copy:sandbox.written[1],commit:pending});await pg.api.sfPrepareKeptStandings();await pg.flush();assert.deepEqual(pg.api.currentRivalry().score,score1,"what the progression keeps is what Standings shows");}
  ok("S10","the progression keeps the copy on every authoritative read (newest Showdown only); the reset leaves storage alone");
  // S11 (Codex P2 + Verify F1 on #1649): through the real loader. js/v10Screens.js runs a screen's prepare once per page
  // (screenLoads), so each entry to Standings must start its own open from career-mode-screen-shown: unread on the first
  // entry, the connection back, a second entry checks again and the copy shows. The real seasonFinalV10.js, installed.
  {const V=read("js/v10Screens.js");assert.match(V,/function vsLoadScreen\(id\)\{\n    if\(!screenLoads\.has\(id\)\)\{/,"the loader caches each screen's load (and prepare) once per page");
    const storage=new Map([[KEY,JSON.stringify(copy1)]]);let fail=true,active="mainMenu";const reads=[],listeners={doc:{},win:{}},defs=new Map();
    const sdk={doc:(_db,...parts)=>parts.join("/"),runTransaction:async(_db,fn)=>fn({get:async ref=>{reads.push(ref);if(fail)throw new Error("unavailable");return {exists:()=>true,data:()=>pending};}})};
    const snap=home(p1);
    const c={console,setTimeout,clearTimeout,setInterval:()=>0,readStorageValue:k=>storage.get(k)??null,writeStorageValue:(k,v)=>{storage.set(k,v);return true;},
      CareerModeV10Screens:new Proxy({install(){return {register:(id,d)=>defs.set(id,d)};}},{get:(t,k)=>k in t?t[k]:()=>Promise.resolve(false)}),
      CareerModeSharedActiveShowdownAdapter:A,
      CareerModeOnlinePlayerIdentity:{getState:()=>snap.identity},CareerModePersistentNikDanielPair:{getState:()=>snap.pair},
      CareerModeProductionSharedMultiSeasonProgression:{getState:()=>null},CareerModeProductionSharedHistoryConvergence:{getState:()=>null,isActive:()=>false},
      CareerModeProductionSharedShowdownSetup:{getState:()=>null},CareerModeProductionSharedFinalReconciliation:{getState:()=>null},CareerModeProductionSharedTerminalClose:{getState:()=>null},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},
      getActiveScreenName:()=>active,loadRuntimeScript:()=>new Promise(()=>{}),
      document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(t,fn){(listeners.doc[t]||=[]).push(fn);},createElement:()=>({style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(){},addEventListener(){}})},
      addEventListener(t,fn){(listeners.win[t]||=[]).push(fn);},dispatchEvent(){},CustomEvent:class{}};
    c.window=c;c.globalThis=c;vm.createContext(c);vm.runInContext(read("js/seasonFinalV10.js"),c,{filename:"js/seasonFinalV10.js"});
    await c.CareerModeSeasonFinalV10.install();
    const def=defs.get("standings");let prepared=null;
    const settle=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));};
    // a real entry: showScreen fires career-mode-screen-shown; the loader runs prepare on the first entry only
    const enter=async()=>{active="standings";for(const fn of listeners.doc["career-mode-screen-shown"]||[])fn({detail:{screen:"standings"}});if(!prepared){prepared=def.prepare().catch(()=>{});}await prepared;await settle();return J(def.frame().SHOWDOWN.model);};
    const leave=async()=>{active="mainMenu";for(const fn of listeners.doc["career-mode-screen-shown"]||[])fn({detail:{screen:"mainMenu"}});await settle();};
    const first=await enter();assert.deepEqual(first,{status:"unavailable",notice:"continue"},"first entry, the read fails: the notice");assert.equal(reads.length,1,"one read for the entry (shown and prepare are the same open)");
    for(let i=0;i<5;i++)def.frame();await settle();assert.equal(reads.length,1,"redraws: no read");
    await leave();fail=false;
    const second=await enter();assert.equal(reads.length,2,"the second entry checks again (no prepare runs for it)");assert.equal(second.status,"ready","the connection is back: the copy shows");assert.deepEqual(second.score,score1);
    await leave();const third=await enter();assert.equal(reads.length,3,"every entry: its own single read");assert.equal(third.status,"ready");}
  ok("S11","through the real loader: each Standings entry makes its own one read (unread, then back: the copy shows)");

  // S12 (Verify F2): in the game, live numbers late and no checked copy: honest in-game words, never "continue it from Home";
  // CHECK AGAIN waits for them once more, on the tap only.
  {const strings=JSON.parse(read("visual-assets/v10_1/standings/app-strings.json")).strings;
    assert.equal(strings.liveOnTheWay,"Live numbers are on their way. Nothing is lost.");assert.equal(strings.liveCheckAgain,"CHECK AGAIN");assert.doesNotMatch(strings.liveOnTheWay,/continue|Home/i);
    const sd=read("visual-assets/v10_1/standings/standings.js");
    assert.match(sd,/m\.notice === "onTheWay" \? \(S\.liveOnTheWay/,"Standings prints the in-game line");assert.match(sd,/new CustomEvent\("career-mode-standings-check-again"\)/,"CHECK AGAIN sends one event");
    assert.match(SRC,/root\.addEventListener\?\.\("career-mode-standings-check-again",sfStandingsCheckAgain\)/);
    assert.deepEqual(J(S.standingsFrames({status:"unavailable",notice:"onTheWay"},null).SHOWDOWN.model),{status:"unavailable",notice:"onTheWay"},"the frame carries it");
    const pg=page({snapshot:home(p1),copy:copy1,commit:acked,liveCanArrive:true});await pg.api.sfPrepareKeptStandings();pg.api.currentRivalry();await pg.advance(WAIT+100);pg.api.currentRivalry();await pg.flush();pg.api.currentRivalry();await pg.flush();
    assert.deepEqual(J(pg.api.currentRivalry()),{status:"unavailable",notice:"onTheWay"},"in the game, the copy behind and no verified read: on their way");assert.equal(pg.reads.length,1);
    await pg.advance(600000);pg.api.currentRivalry();await pg.flush();assert.equal(pg.reads.length,1,"no read on its own, even after 10 minutes");
    const ctx2=page({snapshot:home(p1),copy:copy1,commit:acked,liveCanArrive:true});await ctx2.api.sfPrepareKeptStandings();ctx2.api.currentRivalry();await ctx2.advance(WAIT+100);ctx2.api.currentRivalry();await ctx2.flush();ctx2.api.currentRivalry();await ctx2.flush();
    assert.deepEqual(J(ctx2.api.currentRivalry()),{status:"unavailable",notice:"onTheWay"});ctx2.api.sfStandingsCheckAgain();assert.equal(ctx2.api.currentRivalry().status,"loading","CHECK AGAIN: the live numbers are waited for once more");await ctx2.advance(WAIT+100);ctx2.api.currentRivalry();await ctx2.flush();assert.equal(ctx2.reads.length,2,"then one more check of the copy");}
  ok("S12","in the game: 'Live numbers are on their way. Nothing is lost.' with CHECK AGAIN on the tap, never 'continue from Home', no loop");
  console.log(`PASS r100 Standings after an app reopen (${n} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
