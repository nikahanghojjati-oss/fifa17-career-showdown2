"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

// r84 Golden Showdown (owner Nik): a manager who scores 110 Showdown points in a finished 10-season Showdown (11, the most a
// season can score, in every season) earns the Golden Showdown. Each manager is judged on their own total, so both can earn it
// in one Showdown. An ended-early, unfinished or shorter Showdown never earns it. It is read from the completed Showdowns the
// career screens already load (no new reads, writes or documents) and shows in the Trophy Room (a gold case), Career
// Statistics and Rivalry Statistics (a gold line) and Legacy (a gold line and frame on that Showdown's card).
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const {projection,result,finalFor}=require("../support/career-fixture-helpers.cjs");
const Career=require("../../js/sharedCareerAnalytics.js");
const CareerScreens=require("../../js/careerScreensV10.js");
const RivalryLegacy=require("../../js/rivalryLegacyV10.js");

// The seam runs as the browser loads it: a classic script on a window-like global.
function loadSeam(){
  const context={console};context.globalThis=context;vm.createContext(context);
  vm.runInContext(read("js/careerScreenSeam.js"),context,{filename:"js/careerScreenSeam.js"});
  assert.ok(context.CareerModeCareerScreenSeam,"the seam installs on the window");
  return context.CareerModeCareerScreenSeam;
}
const Seam=loadSeam();
const plain=value=>JSON.parse(JSON.stringify(value));

const perfect=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true,topScorer:true});
const ten=()=>result({leaguePosition:1,leaguePoints:101,leagueGoals:90,championsLeague:true,domesticCup:true}); // 10, no award
const plainSeason=()=>result({leaguePosition:4,leaguePoints:70});
function showdown({seed,totalSeasons,seasons}){
  const p=projection({seed,totalSeasons,seasons});
  return {rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)};
}
const career=showdowns=>Career.buildCareerModel({indexStatus:"ready",showdowns});
const frames=model=>({trophyRoom:plain(CareerScreens.toV10Frame(model,"trophyRoom")),careerStatistics:plain(CareerScreens.toV10Frame(model,"careerStatistics")),legacy:plain(RivalryLegacy.toV10Frame(model,"legacy"))});
const rivalry=model=>plain(RivalryLegacy.toV10Frame(model,"rivalryStatistics"));
let checks=0;const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

{
  // Nik wins every season with 11; Daniel scores 0-3 a season.
  const golden=showdown({seed:"a",totalSeasons:10,seasons:Array.from({length:10},()=>[plainSeason(),perfect()])});
  assert.equal(golden.projection.managerRecords.playerTwo.totalPoints,110);
  const model=career([golden]),row=model.history.showdowns[0];
  assert.deepEqual(plain(Seam.goldenShowdownManagers(row)),["nik"]);
  assert.deepEqual(plain(Seam.goldenShowdownCounts(model.history.showdowns)),{daniel:0,nik:1});
  const f=frames(model);
  assert.deepEqual(f.trophyRoom.goldenShowdowns,{daniel:0,nik:1},"Trophy Room counts the gold trophy");
  assert.deepEqual(f.careerStatistics.goldenShowdowns,{daniel:0,nik:1},"Career Statistics mentions it");
  assert.deepEqual(f.legacy.showdowns[0].goldenShowdown,["nik"],"Legacy marks that Showdown's card");
  assert.deepEqual(rivalry(model).goldenShowdown,["nik"],"Rivalry Statistics mentions it for that Showdown");
  // The live Rivalry route (no history; lifecycle from the active Showdown) uses the same rule.
  const live={status:"ready",leagueId:"premier_league",clubs:{daniel:"club_a",nik:"club_b"},totalSeasons:10,score:{daniel:row.totals.daniel,nik:110},managers:model.managers,seasons:row.seasons,lifecycle:"completed"};
  assert.deepEqual(rivalry(live).goldenShowdown,["nik"]);
  assert.equal(rivalry({...live,lifecycle:"completion-pending"}).goldenShowdown,undefined,"an unfinished Showdown never earns it");
  ok("110 points in a finished 10-season Showdown earns the Golden Showdown on every career screen");
}
{
  // One season of 10 instead of 11: 109.
  const near=showdown({seed:"b",totalSeasons:10,seasons:Array.from({length:10},(_,i)=>[plainSeason(),i===6?ten():perfect()])});
  assert.equal(near.projection.managerRecords.playerTwo.totalPoints,109);
  const model=career([near]),f=frames(model);
  assert.deepEqual(plain(Seam.goldenShowdownManagers(model.history.showdowns[0])),[]);
  assert.equal(f.trophyRoom.goldenShowdowns,undefined,"no gold case at 109");
  assert.equal(f.careerStatistics.goldenShowdowns,undefined);
  assert.equal(f.legacy.showdowns[0].goldenShowdown,undefined);
  assert.equal(rivalry(model).goldenShowdown,undefined);
  ok("109 points does not earn it");
}
{
  // A perfect 5-season Showdown tops out at 55; even a row claiming 110 over 5 seasons never earns it.
  const five=showdown({seed:"c",totalSeasons:5,seasons:Array.from({length:5},()=>[plainSeason(),perfect()])});
  assert.equal(five.projection.managerRecords.playerTwo.totalPoints,55,"11 a season is the most, so 5 seasons reach 55");
  const model=career([five]),f=frames(model);
  assert.equal(f.trophyRoom.goldenShowdowns,undefined);assert.equal(f.legacy.showdowns[0].goldenShowdown,undefined);
  const row=plain(model.history.showdowns[0]);
  assert.deepEqual(plain(Seam.goldenShowdownManagers({...row,totals:{daniel:110,nik:110}})),[],"only a 10-season Showdown counts");
  assert.deepEqual(plain(Seam.goldenShowdownManagers({...row,totals:{daniel:0,nik:110},totalSeasons:10,seasonsPlayed:5})),[],"all 10 seasons must be played");
  ok("110 can't happen in a 5-season Showdown, and a shorter Showdown never earns it");
}
{
  // Ended early: listed in Legacy as a status-only row; never counts, whatever it claims.
  const ended={rivalryId:`pair_${"d".repeat(64)}`,classification:"abandoned",ended:{endedAt:Date.parse("2026-10-20T12:00:00Z"),seasonsPlayed:10}};
  const model=career([ended]),f=frames(model);
  assert.equal(model.history.showdowns[0].status,"abandoned");
  assert.deepEqual(plain(Seam.goldenShowdownCounts(model.history.showdowns)),{daniel:0,nik:0});
  assert.equal(f.legacy.showdowns[0].status,"abandoned");assert.equal(f.legacy.showdowns[0].goldenShowdown,undefined);
  assert.equal(f.trophyRoom.goldenShowdowns,undefined);
  for(const status of ["abandoned","in-progress","completion-pending","unavailable"])assert.deepEqual(plain(Seam.goldenShowdownManagers({status,totalSeasons:10,seasonsPlayed:10,totals:{daniel:110,nik:110}})),[],`${status} never earns it`);
  ok("an ended-early (or unfinished) Showdown never earns it");
}
{
  // Both managers on 110 in one Showdown: each earns it. A second golden Showdown for Nik counts again.
  const both=showdown({seed:"e",totalSeasons:10,seasons:Array.from({length:10},()=>[perfect(),perfect()])});
  const again=showdown({seed:"f",totalSeasons:10,seasons:Array.from({length:10},()=>[plainSeason(),perfect()])});
  assert.equal(both.projection.managerRecords.playerOne.totalPoints,110);assert.equal(both.projection.managerRecords.playerTwo.totalPoints,110);
  const model=career([both,again]),f=frames(model);
  assert.deepEqual(f.trophyRoom.goldenShowdowns,{daniel:1,nik:2});
  assert.deepEqual(f.careerStatistics.goldenShowdowns,{daniel:1,nik:2});
  assert.deepEqual(f.legacy.showdowns.map(s=>s.goldenShowdown),[["daniel","nik"],["nik"]]);
  assert.deepEqual(rivalry(career([both])).goldenShowdown,["daniel","nik"]);
  ok("both managers can earn it, each on their own 110");
}
{
  // Renderers, looks, Rule Book and the data boundary.
  const trophy=read("visual-assets/v10_1/trophy-room/trophy-room.js");
  assert.match(trophy,/key: "goldenShowdown"/);assert.match(trophy,/frame\.goldenShowdowns \? \[GOLDEN\] : \[\]/);assert.match(trophy,/data-golden-showdown="true"/);
  const binder=read("js/careerScreensV10.js");
  assert.match(binder,/goldenShowdown:"Golden Showdown"/);
  assert.match(binder,/TROPHY_PLATE_V2_CSS\+GOLDEN_SHOWDOWN_CSS/);assert.match(binder,/CAREER_STATS_1706_CSS\+GOLDEN_SHOWDOWN_CSS/);
  const goldCss=binder.slice(binder.indexOf("const GOLDEN_SHOWDOWN_CSS"),binder.indexOf("`;",binder.indexOf("const GOLDEN_SHOWDOWN_CSS")));
  assert.match(goldCss,/\.trophyShelf\.has-golden:not\(\.is-filtered\) \.trophyGrid \{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)\}/,"six cases fit one row");
  assert.match(goldCss,/var\(--sd-gold-/);assert.match(goldCss,/r78-marble-tile\.webp/);
  assert.doesNotMatch(goldCss,/opacity|grayscale|brightness\(0\.|filter:\s*blur|position:\s*(absolute|fixed)/,"nothing dims or floats over the screen");
  assert.match(read("visual-assets/v10_1/career-statistics/career-statistics.js"),/goldenShowdownNote/);
  assert.match(read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js"),/rv-goldenShowdown/);
  assert.match(read("visual-assets/v10_1/legacy/legacy.js"),/card\.dataset\.golden = "true"/);
  assert.equal(JSON.parse(read("visual-assets/v10_1/legacy/strings.json")).ui.goldenShowdown,"Golden Showdown");
  const css=read("css/rivalryLegacyV10.css");
  assert.match(css,/\.legacyCard\[data-golden="true"\]/);assert.match(css,/\.rv-goldenShowdown/);
  assert.match(read("js/ruleBook.js"),/goldenLabel\.textContent = "GOLDEN SHOWDOWN";[\s\S]*?"Score 110 points in a 10-season Showdown \(11 in every season\) to win the gold trophy\."/,"the Rule Book gives Golden Showdown its own gold line");
  for(const file of ["js/careerScreenSeam.js","js/careerScreensV10.js","js/rivalryLegacyV10.js","visual-assets/v10_1/trophy-room/trophy-room.js","visual-assets/v10_1/career-statistics/career-statistics.js","visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js","visual-assets/v10_1/legacy/legacy.js"]){
    const source=read(file);
    assert.doesNotMatch(source,/localStorage/,`${file} never touches localStorage`);
  }
  const seam=read("js/careerScreenSeam.js");
  assert.doesNotMatch(seam,/getDoc|setDoc|firestore|fetch\(/i,"the rule reads only rows already loaded");
  ok("renderers, gold looks, Rule Book line and the no-new-data boundary are in place");
}
console.log(`PASS r84 Golden Showdown: ${checks} checks (110 in a finished 10-season Showdown earns it, per manager; 109, 5 seasons and ended early never do).`);
