"use strict";
// r90: the old local analytics engine (js/analytics.js) is deleted. Identity safety now means the career screens never fall
// back to local names or totals: they draw only the online model (keyed by the fixed Daniel/Nik roles) or the unavailable state.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const Seam=require("../../js/careerScreenSeam.js");
const Analytics=require("../../js/sharedCareerAnalytics.js");
const {result,projection,finalFor}=require("../support/career-fixture-helpers.cjs");
const read=file=>fs.readFileSync(file,"utf8");

// 1. No model online means unavailable, never local; only an explicit data-tools caller may ask for "local".
for(const identityState of [null,{status:"signed-out"},{status:"ready",profileId:"p1"}]){
  assert.equal(Seam.selectCareerScreenSource({identityState,model:null}),"unavailable");
  assert.equal(Seam.selectCareerScreenSource({identityState,model:undefined}),"unavailable");
}
assert.equal(Seam.selectCareerScreenSource({identityState:null,model:{status:"bogus"}}),"unavailable","a malformed model is unavailable, not local");
// 2. The unavailable view shows Team V's notice and no totals for every career screen.
for(const screen of ["careerStatistics","trophyRoom","rivalryStatistics"]){
  const view=JSON.stringify(Seam.careerScreenView(screen,null));
  assert.ok(view.includes(Seam.TEXT.unavailable),`${screen} shows the unavailable notice`);
}
// 3. The live model is keyed by the two fixed managers, never by a display name, so same-name rows cannot merge or swap.
const entry=p=>({rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)});
const p=projection({seed:"7",totalSeasons:1,seasons:[[result({leaguePosition:1}),result()]]});
const m=Analytics.buildCareerModel({indexStatus:"ready",showdowns:[entry(p)]});
assert.deepEqual(Object.keys(m.managers).sort(),["daniel","nik"]);
assert.equal(m.managers.daniel.showdowns.completed,1);assert.equal(m.managers.nik.showdowns.completed,1);
// 4. An unverified history entry is never counted into a manager's totals.
const forged=JSON.parse(JSON.stringify(p));forged.managerRecords.playerOne.totalPoints+=1;
const mf=Analytics.buildCareerModel({indexStatus:"ready",showdowns:[entry(forged)]});
assert.notEqual(mf.history.showdowns[0]?.status,"completed","a summary that does not verify is not counted as completed");
assert.equal(mf.managers.daniel.careerPoints,0,"an unverified Showdown adds no career points");
// 5. The screens draw through the seam only, and the local engine and its hooks are gone.
for(const file of ["js/statistics.js","js/trophyRoom.js"]){
  const source=read(file);
  assert.ok(source.includes("seam.selectCareerScreenSource(")&&source.includes("seam.careerScreenView("),`${file} draws through the seam`);
  assert.doesNotMatch(source,/buildCareerAnalytics|buildRivalryAnalytics|getCareerAnalyticsRevisionKey|managerCabinet|careerStandingsRow/,`${file} keeps no local analytics path`);
}
assert.equal(fs.existsSync("js/analytics.js"),false);
console.log("PASS identity-safe career screens: online model or unavailable only, fixed manager keys, unverified history never counted, no local engine.");
