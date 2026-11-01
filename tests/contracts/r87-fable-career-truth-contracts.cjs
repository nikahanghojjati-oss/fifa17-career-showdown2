"use strict";
// r87 Fable job 7 (career truth): each fixed finding, driven through the real modules.
// F7-01 equal-points seasons and finals rebuild as a draw (tamper and unequal mismatches still fail); F7-02 History & Backup
// never shows the current-only model as career points; F7-03 a stalled IndexedDB put never hangs a career load or save;
// F7-07 the old career table ranks by career points only (equal = level).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js"));
const {score,result}=require(path.join(ROOT,"tests/support/career-fixture-helpers.cjs"));
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const clone=value=>JSON.parse(JSON.stringify(value));

// ---- F7-01 ----
const RID="pair_"+"7".repeat(64);
// seasons: [[danielResult, nikResult, storedWinner]]; storedWinner is what the scoring input names for that season.
function build(seasons,totalSeasons=3){
  const hash=n=>"sha256:"+String(n).padStart(64,"0");
  return History.buildProjection({rivalryId:RID,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons,leagueId:"premier_league",clubs:{playerOne:"club_a",playerTwo:"club_b"}},
    managerSlots:[{slotId:"playerOne",accountId:"acct_daniel",profileId:"profile_"+"a".repeat(24),saveId:"save_"+"a".repeat(24),entitlementState:"active"},{slotId:"playerTwo",accountId:"acct_nik",profileId:"profile_"+"b".repeat(24),saveId:"save_"+"b".repeat(24),entitlementState:"active"}],
    seasons:seasons.map(([p1,p2,winner],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner}};})});
}
// A season level on Showdown points (2-2) that the pre-r83 engine gave to Daniel on league position (2nd vs 5th).
const levelP1=result({leaguePosition:2,domesticCup:true,topScorer:true,leaguePoints:70}),levelP2=result({leaguePosition:5,domesticCup:true,topAssist:true});
assert.equal(score(levelP1).total,score(levelP2).total,"fixture: the season is level on Showdown points");
const wonP1=result({leaguePosition:1}),wonP2=result();

{
  const old=build([[levelP1,levelP2,"playerOne"],[wonP1,wonP2,"playerOne"]]);
  assert.equal(old.seasonHistory[0].winner,"draw","an equal-points season with an old tiebreak winner is read as a draw");
  assert.equal(old.seasonHistory[1].winner,"playerOne");
  assert.equal(old.managerRecords.playerOne.seasonDraws,1);assert.equal(old.managerRecords.playerOne.seasonWins,1);
  assert.equal(old.managerRecords.playerTwo.seasonDraws,1);assert.equal(old.managerRecords.playerTwo.seasonLosses,1);
  const fresh=build([[levelP1,levelP2,"draw"],[wonP1,wonP2,"playerOne"]]);
  assert.equal(JSON.stringify(old),JSON.stringify(fresh),"byte-identical to the same Showdown scored with today's rule");
  assert.equal(History.verifyProjection(old),old,"the rebuild is byte-equal, so it verifies");
  ok("F7-01a","a sealed r79-r82 season with a tiebreak winner on equal points rebuilds as a draw, byte-equal to today's");
}
{
  assert.throws(()=>build([[wonP1,wonP2,"playerTwo"]]),error=>error.code==="HISTORY_CONVERGENCE_WINNER_MISMATCH","unequal points, wrong winner");
  assert.throws(()=>build([[wonP1,wonP2,"draw"]]),error=>error.code==="HISTORY_CONVERGENCE_WINNER_MISMATCH","unequal points, called a draw");
  assert.throws(()=>build([[levelP1,levelP2,"nobody"]]),error=>error.code==="HISTORY_CONVERGENCE_SCORING_INVALID","not a winner at all");
  ok("F7-01b","a winner that disagrees with unequal points still fails");
}
{
  const p=build([[levelP1,levelP2,"draw"],[wonP1,wonP2,"playerOne"]]);
  // An equal season with a named winner rebuilds as a draw, so the byte check catches it; a wrong winner on unequal points
  // already fails inside the rebuild. Either way the projection is refused.
  for(const [label,edit,codes] of [["equal season given to Daniel",t=>{t.seasonHistory[0].winner="playerOne";},["HISTORY_CONVERGENCE_PROJECTION_TAMPERED"]],["equal season given to Nik",t=>{t.seasonHistory[0].winner="playerTwo";},["HISTORY_CONVERGENCE_PROJECTION_TAMPERED"]],["won season called a draw",t=>{t.seasonHistory[1].winner="draw";},["HISTORY_CONVERGENCE_WINNER_MISMATCH"]],["won season flipped",t=>{t.seasonHistory[1].winner="playerTwo";},["HISTORY_CONVERGENCE_WINNER_MISMATCH"]],["season draws edited",t=>{t.managerRecords.playerOne.seasonDraws=0;},["HISTORY_CONVERGENCE_PROJECTION_TAMPERED"]]]){
    const tampered=clone(p);edit(tampered);
    assert.throws(()=>History.verifyProjection(tampered),error=>codes.includes(error.code),label);
  }
  ok("F7-01c","a projection carrying a tiebreak (or any wrong) season winner still fails verifyProjection as tampered");
}
{
  // A whole Showdown level on points: two level seasons, each of which the pre-r83 engine gave to one side.
  const p=build([[levelP1,levelP2,"playerOne"],[levelP2,levelP1,"playerTwo"]]);
  const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;assert.equal(a,b);
  const entry=final=>({rivalryId:RID,classification:"completed",projection:p,final});
  for(const winner of ["playerOne","playerTwo","draw"]){
    const model=Career.buildCareerModel({indexStatus:"ready",showdowns:[entry({totals:{playerOne:a,playerTwo:b},winner})]});
    assert.equal(model.status,"ready",`a level final named ${winner} still counts`);
    assert.equal(model.history.showdowns[0].winner,"draw");
    assert.equal(model.managers.daniel.showdowns.draws,1);assert.equal(model.managers.nik.showdowns.draws,1);
    assert.equal(model.managers.daniel.careerPoints,a);
  }
  const bad=Career.buildCareerModel({indexStatus:"ready",showdowns:[entry({totals:{playerOne:a,playerTwo:b},winner:"somebody"})]});
  assert.equal(bad.history.showdowns[0].status,"unavailable","an invalid final winner is still unavailable");
  const won=build([[wonP1,wonP2,"playerOne"]]),wa=won.managerRecords.playerOne.totalPoints,wb=won.managerRecords.playerTwo.totalPoints;
  for(const winner of ["playerTwo","draw"]){
    const model=Career.buildCareerModel({indexStatus:"ready",showdowns:[{rivalryId:RID,classification:"completed",projection:won,final:{totals:{playerOne:wa,playerTwo:wb},winner}}]});
    assert.equal(model.history.showdowns[0].status,"unavailable",`an unequal final named ${winner} still fails`);
  }
  ok("F7-01d","a level Showdown whose final names a winner counts as a DRAW; an unequal mismatch is still unavailable");
}

// ---- F7-02 ----
{
  function legacyPage(model){
    const c={console,Intl,document:{}};c.window=c;
    c.CareerModeRivalryLegacyV10={cachedCareerModel:()=>model,careerModelLoading:()=>false};
    vm.createContext(c);vm.runInContext(read("js/legacy.js")+"\n;globalThis.__career=getLegacyOnlineCareer;",c,{filename:"js/legacy.js"});
    return c.__career();
  }
  const p=build([[wonP1,wonP2,"playerOne"]]);
  const career=Career.buildCareerModel({indexStatus:"ready",showdowns:[{rivalryId:RID,classification:"completed",projection:p,final:{totals:{playerOne:p.managerRecords.playerOne.totalPoints,playerTwo:p.managerRecords.playerTwo.totalPoints},winner:"playerOne"}}]});
  const interim=Career.buildCareerModel({indexStatus:"ready",showdowns:[{rivalryId:RID,classification:"active",projection:p,final:null}],currentShowdownOnly:true});
  assert.ok(interim.interimLabel&&["ready","partial","empty"].includes(interim.status),"fixture: a labelled current-only model");
  assert.ok(interim.managers.daniel.careerPoints>0,"fixture: the interim model carries the live Showdown's points");
  const shown=legacyPage(interim);
  assert.equal(shown.points,null,"no career points from the current-only model");assert.equal(shown.completed,null);
  assert.equal(shown.status,"unavailable");
  const real=legacyPage(career);
  assert.equal(real.status,"ready");assert.deepEqual({...real.points},{daniel:p.managerRecords.playerOne.totalPoints,nik:p.managerRecords.playerTwo.totalPoints});
  ok("F7-02","History & Backup shows dashes, not the live Showdown's points, while only the current-only model is held");
}

// ---- F7-03 ----
async function summaryChecks(){
  const Store=require(path.join(ROOT,"js/careerSummaryStore.js"));Store.forgetPhoneCopies();
  const rid="pair_"+"8".repeat(64),state={status:"abandoned",rivalryId:rid,ended:{endedAt:1,seasonsPlayed:1}};
  const payload=JSON.stringify(state);
  const bytes=new Uint8Array(await webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(payload)));
  const payloadHash="sha256:"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  const doc={schemaVersion:Store.readerVersion,objectType:"careerSummary",rivalryId:rid,status:"abandoned",totalSeasons:null,managerTotals:null,winner:null,payload,payloadHash};
  // Opens and walks its cursor at once, but a readwrite transaction never completes, errors or aborts (WebKit stall).
  const puts=[];
  const db={objectStoreNames:{contains:()=>true},createObjectStore(){},transaction(_store,mode){
    if(mode==="readwrite")return {objectStore:()=>({put:(value,key)=>{puts.push(key);}})};
    return {objectStore:()=>({openCursor(){const request={result:null,onsuccess:null};setImmediate(()=>request.onsuccess?.());return request;}})};
  }};
  const phone={open(){const request={result:db,onsuccess:null};setImmediate(()=>request.onsuccess?.());return request;}};
  let gets=0;const sdk={doc:(...parts)=>parts.slice(1).join("/"),getDoc:async()=>{gets++;return {exists:()=>true,data:()=>doc};},setDoc:async()=>{}};
  const stalled=()=>new Promise(resolve=>setTimeout(()=>resolve("stalled"),3000));
  const first=await Promise.race([Store.loadSummary({firestore:{},firebaseSdk:sdk,uid:"uid-daniel",rivalryId:rid,cryptoImpl:webcrypto,phoneStorage:phone}),stalled()]);
  assert.notEqual(first,"stalled","a Firebase summary load does not wait on the phone-copy put");
  assert.equal(first.source,"firebase");assert.equal(puts.length,1,"the phone copy put was still started");
  const again=await Promise.race([Store.loadSummary({firestore:{},firebaseSdk:sdk,uid:"uid-daniel",rivalryId:rid,cryptoImpl:webcrypto,phoneStorage:phone}),stalled()]);
  assert.equal(again.source,"phone","this page keeps the copy in memory");assert.equal(gets,1,"no second get");
  const other="pair_"+"9".repeat(64),saved=await Promise.race([Store.saveSummary({firestore:{},firebaseSdk:sdk,uid:"uid-daniel",state:{...state,rivalryId:other},cryptoImpl:webcrypto,phoneStorage:phone,writeFirebase:false}),stalled()]);
  assert.notEqual(saved,"stalled","a summary save does not wait on the phone-copy put");assert.equal(saved.ok,true);
  const kept=await Store.loadSummary({firestore:{},firebaseSdk:sdk,uid:"uid-daniel",rivalryId:other,cryptoImpl:webcrypto,phoneStorage:phone});
  assert.equal(kept.source,"phone");assert.equal(gets,1);
  Store.forgetPhoneCopies();
  ok("F7-03","a phone-copy put that never settles hangs neither the career load nor the summary save");
}

// ---- F7-07 ----
{
  const c={console};c.window=c;c.currentShowdown=null;c.loadLegacyShowdowns=()=>[];c.loadSavedShowdown=()=>null;c.getLegacyStorageRevision=()=>0;
  vm.createContext(c);vm.runInContext(read("js/scoring.js"),c);
  vm.runInContext(read("js/analytics.js")+"\n;globalThis.__career=buildCareerAnalytics;",c);
  const A="profile_"+"c".repeat(24),B="profile_"+"d".repeat(24);
  const player=(o)=>({leaguePosition:5,leaguePoints:60,leagueGoals:50,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...o});
  const showdown=(id,rounds,score)=>({id,name:id,status:"Completed",managers:{playerOne:"Daniel",playerTwo:"Nik"},identity:{schemaVersion:1,saveId:"save_"+"1".repeat(24),managerProfileIds:{playerOne:A,playerTwo:B}},clubs:{playerOne:"X",playerTwo:"Y"},selectedLeague:{id:"pl",name:"Premier League"},score,rounds});
  // Daniel: 1 Showdown win, 2 trophies, 4 points. Nik: 1 Showdown win, 1 trophy, 6 points.
  const history=[
    showdown("a",[{roundNumber:1,winner:"playerOne",playerOne:{...player({leaguePosition:1,domesticCup:true}),scoring:{total:4}},playerTwo:{...player(),scoring:{total:0}}}],{playerOne:4,playerTwo:0}),
    showdown("b",[{roundNumber:1,winner:"playerTwo",playerOne:{...player(),scoring:{total:0}},playerTwo:{...player({championsLeague:true,topScorer:true}),scoring:{total:6}}}],{playerOne:0,playerTwo:6})
  ];
  const ranked=c.__career(history);
  assert.deepEqual(clone(ranked.managers.map(m=>m.profileId)),[B,A],"more career points ranks first, whatever the trophies");
  assert.equal(ranked.managers.some(m=>m.level),false);
  const level=c.__career([history[0],showdown("c",[{roundNumber:1,winner:"playerTwo",playerOne:{...player(),scoring:{total:0}},playerTwo:{...player({leaguePosition:1,topScorer:true}),scoring:{total:4}}}],{playerOne:0,playerTwo:4})]);
  assert.equal(level.managers[0].totalPoints,level.managers[1].totalPoints);
  assert.deepEqual(clone(level.managers.map(m=>m.level)),[true,true],"equal career points are level");
  assert.deepEqual(clone(level.managers.map(m=>m.profileId)),[A,B],"level rows keep their order (no tiebreak)");
  ok("F7-07","the old career table ranks by career points only; equal career points are level");
}

summaryChecks().then(()=>console.log(`r87 Fable career truth contracts passed (${checks} checks)`)).catch(error=>{console.error(error);process.exit(1);});
