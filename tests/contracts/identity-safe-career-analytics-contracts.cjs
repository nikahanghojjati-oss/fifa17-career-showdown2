const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const analyticsSource=fs.readFileSync("js/analytics.js","utf8");
const statisticsSource=fs.readFileSync("js/statistics.js","utf8");
const trophySource=fs.readFileSync("js/trophyRoom.js","utf8");

assert.match(analyticsSource,/identity\.managerProfileIds|managerProfileIds/,"Career Analytics must consume stable manager profile references.");
assert.ok(analyticsSource.includes("unresolvedRoleCount"),"Career Analytics must expose unresolved historical identity rather than guessing it.");
assert.ok(analyticsSource.includes("window.getCareerAnalyticsRevisionKey"),"Career Analytics must expose one coherent render/cache revision key.");
assert.ok(analyticsSource.includes("captureCareerModeRawSaveLibraryMigrationSnapshot"),"Career Analytics must be able to read Local Profile presentation labels through the existing exact raw snapshot authority without activating mutation authority.");
assert.ok(analyticsSource.includes("presentation.signature"),"Career Analytics cache identity must include the Local Profile presentation signature it consumes.");
assert.ok(statisticsSource.includes("excluded from longitudinal manager totals and leaderboards"),"Career Statistics must explain unresolved identity exclusions.");
assert.ok(trophySource.includes("excluded from manager cabinets and longitudinal leaderboards"),"Trophy Room must explain unresolved identity exclusions.");
assert.ok(statisticsSource.includes("row.dataset.profileId = manager.profileId"),"Career table rows need stable profile test hooks.");
assert.ok(trophySource.includes("cabinet.dataset.profileId = manager.profileId"),"Trophy cabinets need stable profile test hooks.");

const ids={
  a:"profile_aaaaaaaaaaaaaaaaaaaaaaaa",
  b:"profile_bbbbbbbbbbbbbbbbbbbbbbbb",
  c:"profile_cccccccccccccccccccccccc",
  d:"profile_dddddddddddddddddddddddd"
};

function player(score,{position=2,points=80,goals=80,league=false,cup=false,ucl=false}={}){
  return {
    leaguePosition:league?1:position,
    leaguePoints:points,
    leagueGoals:goals,
    domesticCup:cup,
    championsLeague:ucl,
    topScorer:false,
    topAssist:false,
    scoring:{total:score,performanceBonus:0,individualAwardsBonus:0}
  };
}

function showdown({id,saveId,one,two,oneScore,twoScore,roundOne=oneScore,roundTwo=twoScore}){
  return {
    id,
    name:id,
    status:"Completed",
    managers:{playerOne:"Same Name",playerTwo:"Same Name"},
    identity:{schemaVersion:1,saveId,managerProfileIds:{playerOne:one,playerTwo:two}},
    clubs:{playerOne:`${id}-A`,playerTwo:`${id}-B`},
    selectedLeague:{id:"premier-league",name:"Premier League"},
    score:{playerOne:oneScore,playerTwo:twoScore},
    transferChallenges:[],
    completedAt:"2026-08-14T01:00:00.000Z",
    updatedAt:"2026-08-14T01:00:00.000Z",
    rounds:[{
      roundNumber:1,
      winner:roundOne>roundTwo?"playerOne":roundTwo>roundOne?"playerTwo":"draw",
      playerOne:player(roundOne,{league:roundOne===11}),
      playerTwo:player(roundTwo)
    }]
  };
}

const history=[
  showdown({id:"same-name-a",saveId:"save_111111111111111111111111",one:ids.a,two:ids.b,oneScore:3,twoScore:1}),
  showdown({id:"same-name-b",saveId:"save_222222222222222222222222",one:ids.a,two:ids.c,oneScore:5,twoScore:2}),
  showdown({id:"unresolved-history",saveId:"save_333333333333333333333333",one:null,two:ids.d,oneScore:11,twoScore:0,roundOne:11,roundTwo:0})
];

const context={
  console,
  currentShowdown:null,
  loadLegacyShowdowns:()=>[],
  loadSavedShowdown:()=>null,
  getLegacyStorageRevision:()=>7,
  calculatePlayerSeasonScore:()=>({total:0,performanceBonus:0,individualAwardsBonus:0}),
  CareerModeSaveLibraryRuntime:{
    isReady:()=>true,
    getIdentityMappingSnapshot:()=>({
      ok:true,
      library:{profiles:[
        {profileId:ids.a,displayName:"Canonical Manager"},
        {profileId:ids.b,displayName:"Same Name"},
        {profileId:ids.c,displayName:"Same Name"},
        {profileId:ids.d,displayName:"Same Name"}
      ]}
    })
  }
};
context.window=context;
vm.createContext(context);
vm.runInContext(`${analyticsSource}\n;globalThis.__test={buildCareerAnalytics,getCareerAnalyticsCacheKey};`,context);

const analytics=context.__test.buildCareerAnalytics(history);
assert.equal(analytics.totals.showdowns,3,"Overall completed Showdown totals must remain complete when identity is unresolved.");
assert.equal(analytics.totals.points,22,"Overall points must include unresolved historical roles.");
assert.equal(analytics.managers.length,4,"Same visible names with four authoritative profile IDs must remain four career identities.");
assert.equal(new Set(analytics.managers.map(manager=>manager.profileId)).size,4,"Career rows must be keyed by stable profile identity, never normalized name.");

const reused=analytics.managers.find(manager=>manager.profileId===ids.a);
assert.ok(reused,"Explicitly reused profile must appear in longitudinal Analytics.");
assert.equal(reused.showdowns,2,"One stable profile reused across Saves must aggregate into one longitudinal career row.");
assert.equal(reused.totalPoints,8,"Reused stable profile points did not aggregate correctly.");
assert.equal(reused.name,"Canonical Manager","Local Profile display name should label an identified longitudinal career when available.");

assert.equal(analytics.identity.unresolvedRoleCount,1,"One null historical profile reference must remain explicitly unresolved.");
assert.equal(analytics.identity.unresolvedShowdownCount,1,"Unresolved Showdown count is incorrect.");
assert.equal(analytics.identity.unresolvedRoles[0].showdownId,"unresolved-history");
assert.equal(analytics.identity.unresolvedRoles[0].role,"playerOne");
assert.ok(!analytics.managers.some(manager=>manager.totalPoints===11&&manager.showdowns===1),"Unresolved historical contributions must not contaminate identified manager totals.");
assert.equal(analytics.records.highestSeasonScore.value,11,"Season-scoped records must remain complete even when their manager identity is unresolved.");
assert.equal(analytics.records.highestSeasonScore.holders[0].manager,"Same Name","Season record labels remain historical display labels, not identity keys.");

context.currentShowdown=showdown({id:"active-edge",saveId:"save_444444444444444444444444",one:ids.a,two:ids.b,oneScore:1,twoScore:0});
const before=context.__test.getCareerAnalyticsCacheKey();
context.currentShowdown.identity.managerProfileIds.playerOne=ids.c;
const after=context.__test.getCareerAnalyticsCacheKey();
assert.notEqual(after,before,"Active completed identity remapping must invalidate the Analytics/render cache even when updatedAt is unchanged.");

let rawLibrary={profiles:[
  {profileId:ids.a,displayName:"Snapshot Manager"},
  {profileId:ids.b,displayName:"Same Name"},
  {profileId:ids.c,displayName:"Same Name"},
  {profileId:ids.d,displayName:"Same Name"}
]};
context.CareerModeSaveLibraryRuntime={isReady:()=>false};
context.captureCareerModeRawSaveLibraryMigrationSnapshot=()=>({
  ok:true,
  raw:{
    saveLibrary:JSON.stringify(rawLibrary),
    activeShowdown:null,
    legacyShowdowns:JSON.stringify(history),
    preferences:null
  }
});
const rawPresented=context.__test.buildCareerAnalytics(history);
assert.equal(
  rawPresented.managers.find(manager=>manager.profileId===ids.a).name,
  "Snapshot Manager",
  "Career Analytics must retain Local Profile presentation labels when the canonical Save Library exists but mutation authority has not been activated."
);
const presentationBefore=context.__test.getCareerAnalyticsCacheKey();
rawLibrary={...rawLibrary,profiles:rawLibrary.profiles.map(profile=>profile.profileId===ids.a?{...profile,displayName:"Updated Snapshot Manager"}:profile)};
const presentationAfter=context.__test.getCareerAnalyticsCacheKey();
assert.notEqual(presentationAfter,presentationBefore,"A changed authoritative Local Profile presentation label must invalidate the Analytics/render cache without changing stable identity.");

const rivalry=context.buildRivalryAnalytics(history[0]);
assert.equal(rivalry.playerOne.name,"Same Name","Rivalry Analytics must remain scoped to the Showdown's visible role label.");
assert.equal(rivalry.playerTwo.name,"Same Name","Rivalry Analytics must remain independent from cross-history identity aggregation.");

console.log("Identity-safe Career Analytics contracts passed: same-name profiles separate, explicit reuse aggregates, unresolved history stays excluded from manager totals, season records remain complete, Local Profile labels remain available without activating mutation authority, presentation changes invalidate caches, and identity remapping remains safe.");