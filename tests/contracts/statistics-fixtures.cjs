"use strict";
// r90: the old local engine (js/analytics.js) is deleted; these fixtures now pin the live Career Statistics, Trophy Room and
// Rivalry Statistics model (js/sharedCareerAnalytics.js) that every career screen draws from finished-Showdown history.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const Analytics=require("../../js/sharedCareerAnalytics.js");
const {result,projection,finalFor}=require("../support/career-fixture-helpers.cjs");

const entry=p=>({rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)});
const model=showdowns=>Analytics.buildCareerModel({indexStatus:"ready",showdowns});

// Showdown 1: Daniel wins (league + Champions League in S1); Nik takes a cup in S2; S3 is level.
const first=projection({seed:"1",totalSeasons:3,seasons:[[result({leaguePosition:1,championsLeague:true}),result()],[result(),result({domesticCup:true})],[result(),result()]]});
// Showdown 2: Nik wins with a league title and 100-point season; Daniel takes a cup.
const second=projection({seed:"2",totalSeasons:3,seasons:[[result(),result({leaguePosition:1,leaguePoints:100})],[result({domesticCup:true}),result()],[result(),result({championsLeague:true})]]});
// Showdown 3: both managers finish level: a DRAW, never a tiebreak.
const level=projection({seed:"3",totalSeasons:1,seasons:[[result({domesticCup:true}),result({domesticCup:true})]]});

const m=model([entry(first),entry(second),entry(level)]);
const totals=s=>m.history.showdowns.find(row=>row.rivalryId===s.rivalryId).totals;
assert.equal(m.status,"ready");
assert.equal(m.history.showdowns.length,3,"each finished Showdown is listed once");
assert.equal(m.managers.daniel.showdowns.completed,3,"completed Showdowns are counted once per manager");
assert.equal(m.managers.daniel.seasons,7,"seasons are counted once, not once per manager");
assert.equal(m.managers.nik.seasons,7);
for(const manager of ["daniel","nik"]){
  const role=manager==="daniel"?"daniel":"nik";
  const sum=[first,second,level].reduce((n,s)=>n+totals(s)[role],0);
  assert.equal(m.managers[manager].careerPoints,sum,`${manager} career points are the sum of their final Showdown points`);
}
assert.deepEqual(m.managers.daniel.showdowns,{completed:3,wins:1,draws:1,losses:1});
assert.deepEqual(m.managers.nik.showdowns,{completed:3,wins:1,draws:1,losses:1});
assert.equal(m.history.showdowns.find(row=>row.rivalryId===level.rivalryId).winner,"draw","equal points are a DRAW (no tiebreak)");
// Trophy accumulation: league titles, domestic cups and Champions League across every Showdown.
assert.deepEqual(m.trophyRoom.cabinet.daniel,{championsLeagues:1,europaLeagues:0,leagueTitles:1,domesticCups:2,totalTrophies:4});
assert.deepEqual(m.trophyRoom.cabinet.nik,{championsLeagues:1,europaLeagues:0,leagueTitles:1,domesticCups:2,totalTrophies:4});
assert.equal(m.managers.nik.hundredPointSeasons,1);
// Standings are ranked by career points only.
const standings=m.trophyRoom.standings;
assert.equal(standings.length,2);
assert.ok(standings[0].careerPoints>=standings[1].careerPoints,"standings are ranked by career points");
// Rivalry rows: per-season scores and winners, with a level season shown as a draw.
const rivalry=m.history.showdowns.find(row=>row.rivalryId===first.rivalryId);
assert.deepEqual(rivalry.seasons.map(row=>row.winner),["daniel","nik","draw"]);
assert.equal(rivalry.winner,"daniel");
assert.equal(rivalry.seasons[2].tiebreak,"draw");
// The live screens draw from this model, not a local engine.
assert.equal(fs.existsSync("js/analytics.js"),false,"the retired local engine stays deleted");
for(const file of ["js/statistics.js","js/trophyRoom.js"])assert.ok(fs.readFileSync(file,"utf8").includes("seam.careerScreenView("),`${file} draws through the career-screen seam`);
console.log("Career totals, trophy accumulation, points-only standings, DRAW on level totals and Rivalry Statistics fixtures passed (live sharedCareerAnalytics model).");
