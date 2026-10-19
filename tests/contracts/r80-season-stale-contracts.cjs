"use strict";
// r80: a new Showdown started after END SHOWDOWN must begin at season 1. The release lane's r79 two-player journey saw
// Daniel's header read "Season 2 / 3" on a brand-new 3-season Showdown (R3) after he ended R2 mid-season 2. Cause: the
// Shared Multi Season cursor and provider view were keyed by the rivalry alone, and a new shell (its marker carries no rivalry
// id) took the rivalry of the Shared Setup still in memory. On the phone that tapped END that Setup is the ended Showdown's
// confirmed Setup (nothing refreshes it), so the new shell resolved the ended Showdown's season 2.
//   S1 the live R2 on season 2 reads Season 2 / 3 (the cursor itself is right).
//   S2 the same save shell reloaded into a new object (the Save Library swaps the reference) keeps its season.
//   S3 after END on this phone (its Setup still holds R2 confirmed), Daniel's new shell reads Season 1 / 3 on Home, every
//      shared consumer resolves season 1, R2's view is not used and the dashboard is not decorated with R2.
//   S4 once R3's own Setup is confirmed the new Showdown reads R3's authority: still season 1, never R2's cursor.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const multiSource=read("js/productionSharedMultiSeasonProgression.js");
const showdownUiSource=read("js/showdownUI.js");
const menuSource=read("js/menuExperience.js");
const R2=`pair_${"2b".repeat(32)}`;
const R3=`pair_${"3c".repeat(32)}`;
const SESSION_R2=`session_${"2d".repeat(32)}`;
const SESSION_R3=`session_${"3e".repeat(32)}`;
const DEVICE=`device_${"ef".repeat(16)}`;

// The two page functions that draw #seasonIndicator from the save shell, taken verbatim from the shipped files.
function slice(source,start,end,label){
  const from=source.indexOf(start),to=source.indexOf(end,from);
  assert.ok(from>=0&&to>from,`${label} is present in the shipped source`);
  return source.slice(from,to);
}
const getShowdownSeasonSource=slice(showdownUiSource,"window.getShowdownSeason = ","\n","js/showdownUI.js getShowdownSeason");
const menuMetaSource=slice(menuSource,"function isPairClosedSave(","function ensureMarcoReusTreatment(","js/menuExperience.js getSavedShowdownMenuMeta");

function confirmedSetup(rivalryId,sessionId){
  return {status:"ready",ready:true,rivalryId,sessionId,deviceId:DEVICE,accountId:"uid_daniel",managerRole:"playerOne",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",totalSeasons:3,clubs:{playerOne:"Club A",playerTwo:"Club B"}}};
}
function shell(id,saveId){
  return {id,name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:3,currentRound:1,status:"Created",rounds:[],identity:{schemaVersion:1,saveId},sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}};
}

function boot(){
  const accepted={[R2]:1,[R3]:0};
  const reads=[];
  const page={setup:confirmedSetup(R2,SESSION_R2),pair:{initialized:true,busy:false,status:"paired",rivalryId:R2,connectionState:"active",closedRivalryId:null,closedProviderSaveId:null}};
  const sandbox={
    console,setTimeout,clearTimeout,Promise,Date,Number,String,Object,Array,Boolean,
    currentShowdown:shell(1700000000001,"save_aaaaaaaaaaaaaaaaaaaaaaaa"),
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    dispatchEvent:()=>true,
    addEventListener(){},
    ensureGameplayModules:async()=>true,
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>page.setup,getState:()=>page.setup},
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>null,getState:()=>null},
    CareerModeSharedMultiSeasonProgression:{},
    CareerModeSparkSharedMultiSeasonProgression:{read:async options=>{
      reads.push(options.rivalryId);
      const n=accepted[options.rivalryId];
      return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId:options.rivalryId,phase:"SEASON_READY",state:{runtimeRevision:"1.9.1-r13",rivalryId:options.rivalryId,acceptedSeasons:n,totalSeasons:3,terminal:false},dashboard:{acceptedSeasons:n,managerTotals:{playerOne:n?9:0,playerTwo:n?3:0},lastSeason:n?{seasonNumber:n,winner:"playerOne",playerOne:{score:9,leaguePosition:1},playerTwo:{score:3,leaguePosition:2}}:null}};
    }},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})},
    CareerModePersistentNikDanielPair:{getState:()=>page.pair},
    CareerModeSaveLibraryRuntime:{getLibrarySnapshot:()=>({activeSaveId:sandbox.currentShowdown?.identity?.saveId||null})}
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(multiSource,sandbox,{filename:"js/productionSharedMultiSeasonProgression.js"});
  vm.runInContext(getShowdownSeasonSource,sandbox,{filename:"js/showdownUI.js"});
  vm.runInContext(menuMetaSource,sandbox,{filename:"js/menuExperience.js"});
  const api=sandbox.CareerModeProductionSharedMultiSeasonProgression;
  assert.ok(api&&typeof api.resolveSeason==="function"&&typeof sandbox.getSavedShowdownMenuMeta==="function","the season resolver and the Home header load in the sandbox");
  return {api,sandbox,page,reads,indicator:()=>sandbox.getSavedShowdownMenuMeta().indicator};
}

(async()=>{
  const t=boot();
  // S1: R2 is live on season 2 (one season accepted; CONTINUE TO SEASON 2 or a resume put the cursor there).
  const resumed=await t.api.resumeFromAuthority();
  assert.equal(resumed&&resumed.season,2,"S1 R2 with one accepted season of three is on season 2");
  assert.equal(t.api.resolveSeason(1),2,"S1 every shared consumer resolves R2's season 2");
  assert.equal(t.indicator(),"Season 2 / 3","S1 the live R2 header reads Season 2 / 3");
  console.log("ok S1 the live R2 reads Season 2 / 3");

  // S2: the same save shell in a new object (same local id) keeps its cursor.
  t.sandbox.currentShowdown=JSON.parse(JSON.stringify(t.sandbox.currentShowdown));
  assert.equal(t.api.resolveSeason(1),2,"S2 the same save shell keeps season 2 when the Save Library swaps the object");
  assert.equal(t.indicator(),"Season 2 / 3","S2 the header still reads Season 2 / 3");
  console.log("ok S2 the same save shell keeps its season");

  // S3: Daniel taps END SHOWDOWN (js/settings.js clears currentShowdown; the pair forgets R2) and starts a new 3-season
  // Showdown. Nothing refreshed this phone's Shared Setup, so it still holds R2's confirmed Setup.
  t.sandbox.currentShowdown=null;
  t.page.pair={initialized:true,busy:false,status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:R2,closedProviderSaveId:"save_aaaaaaaaaaaaaaaaaaaaaaaa"};
  assert.equal(t.indicator(),"No Active Showdown","S3 Home after END has no live Showdown");
  t.sandbox.currentShowdown=shell(1700000000002,"save_bbbbbbbbbbbbbbbbbbbbbbbb");
  t.page.pair={initialized:true,busy:true,status:"waiting",rivalryId:R3,connectionState:"pending-pair",closedRivalryId:R2,closedProviderSaveId:"save_aaaaaaaaaaaaaaaaaaaaaaaa"};
  assert.equal(t.page.setup.rivalryId,R2,"S3 precondition: the ending phone's Setup still holds the ended R2");
  assert.equal(t.indicator(),"Season 1 / 3",`S3 the new Showdown's header reads Season 1 / 3 before its first season, not the ended R2's season (got "${t.indicator()}")`);
  assert.equal(t.api.resolveSeason(1),1,"S3 every shared consumer (Transfer Challenge, Season Results, Commit) resolves season 1 for the new shell");
  assert.equal(t.sandbox.getShowdownSeason(t.sandbox.currentShowdown),1,"S3 getShowdownSeason gives season 1");
  assert.notEqual(t.api.getState()?.rivalryId,R2,"S3 the ended R2's provider view is not kept for the new shell");
  assert.equal(t.api.decorateDashboard(),false,"S3 the dashboard is never decorated with the ended R2's totals");
  console.log("ok S3 after END on this phone the new Showdown reads Season 1 / 3 (the ended Showdown's cursor is not reused)");

  // S4: R3's own Setup is confirmed (both players drew the league and clubs); the new Showdown reads R3's authority.
  t.page.setup=confirmedSetup(R3,SESSION_R3);
  t.page.pair={initialized:true,busy:false,status:"paired",rivalryId:R3,connectionState:"active",closedRivalryId:R2,closedProviderSaveId:"save_aaaaaaaaaaaaaaaaaaaaaaaa"};
  await t.api.refresh();
  assert.equal(t.reads[t.reads.length-1],R3,"S4 the refresh reads R3's progression");
  assert.equal(t.api.getState()?.rivalryId,R3,"S4 the provider view is R3's");
  assert.equal(t.api.resolveSeason(1),1,"S4 R3 with no accepted season is on season 1");
  assert.equal(t.indicator(),"Season 1 / 3","S4 the header reads Season 1 / 3");
  const again=await t.api.resumeFromAuthority();
  assert.equal(again&&again.season,1,"S4 a resume on R3 stays on season 1");
  console.log("ok S4 R3's confirmed Setup reads R3's authority: Season 1 / 3");
  console.log("PASS r80 season-stale contracts");
})().catch(error=>{console.error(error);process.exitCode=1;});
