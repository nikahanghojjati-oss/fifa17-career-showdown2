"use strict";
// r80 Europa League PR 3b (Nik): the Europa League on the career pages. A manager may win the Champions League in one season
// and the Europa League in another and both count, so a career with Daniel CL x1 + EL x1 and Nik CL x1 + EL x2 must show
// those counts everywhere a Champions League win is shown, with Team V's own Europa trophy picture.
//   E1 the career model counts both cups per manager, Total Trophies includes the Europa League, and a season row names its
//      Europa League winners only when one was won (old seasons keep the r79 row shape).
//   E2 the seam's Trophy Room and Rivalry views carry a Europa Leagues row next to Champions Leagues.
//   E3 Trophy Room: a fifth case and a sixth tab EUROPA LEAGUE using TRO_EUROPA_V1, and every layout fits 5 cases + 6 tabs.
//   E4 Rivalry Statistics: a Europa Leagues row (seven rows) and a fifth trophy in the Trophies grid.
//   E5 Career Statistics: EUROPA LEAGUE WINS in the comparison panel, mapped to europaLeagues.
//   E6 History / Legacy: a season line says "Europa League winner" for the manager who won it; the old local screens count it.
//   E7 CONNECT PLAYERS title is Team V's wordmark picture; the words stay as visually hidden text (never display:none).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {createHash}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const Seam=require(path.join(ROOT,"js/careerScreenSeam.js"));
const Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js"));
const {result,projection,finalFor}=require(path.join(ROOT,"tests/support/career-fixture-helpers.cjs"));
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

// Daniel: CL in season 1, EL in season 2. Nik: EL in seasons 1 and 2, CL in season 3. Season 3 has no Europa League winner.
const p=projection({totalSeasons:3,seasons:[
  [result({leaguePosition:1,leaguePoints:101,leagueGoals:102,championsLeague:true,domesticCup:true,topScorer:true}),result({leaguePosition:3,leaguePoints:80,europaLeague:true})],
  [result({leaguePosition:2,leaguePoints:88,europaLeague:true,domesticCup:true}),result({leaguePosition:1,leaguePoints:94,leagueGoals:105,europaLeague:true})],
  [result({leaguePosition:1,leaguePoints:98,domesticCup:true}),result({leaguePosition:2,leaguePoints:86,championsLeague:true})]
]});
const model=Career.buildCareerModel({indexStatus:"ready",showdowns:[{rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)}]});

{
  const {daniel,nik}=model.managers;
  assert.equal(daniel.championsLeagues,1);assert.equal(daniel.europaLeagues,1,"Daniel's CL (season 1) and EL (season 2) both count");
  assert.equal(nik.championsLeagues,1);assert.equal(nik.europaLeagues,2);
  assert.equal(daniel.totalTrophies,daniel.championsLeagues+daniel.europaLeagues+daniel.leagueTitles+daniel.domesticCups,"Total Trophies includes the Europa League");
  assert.equal(nik.totalTrophies,nik.championsLeagues+nik.europaLeagues+nik.leagueTitles+nik.domesticCups);
  assert.equal(model.trophyRoom.cabinet.daniel.europaLeagues,1);assert.equal(model.trophyRoom.cabinet.nik.europaLeagues,2);
  const rows=model.history.showdowns[0].seasons;
  assert.deepEqual(rows[0].europaLeague,{daniel:false,nik:true});
  assert.deepEqual(rows[1].europaLeague,{daniel:true,nik:true},"both managers may win the same trophy in one season");
  assert.equal(Object.hasOwn(rows[2],"europaLeague"),false,"a season without a Europa League winner keeps the r79 row shape");
  ok("E1 the career model counts CL and EL per manager, Total Trophies includes the EL, and season rows name EL winners sparsely");
}
{
  const labels=view=>view.sections[0].rows.map(r=>r.label);
  const trophy=Seam.careerScreenView("trophyRoom",model);
  assert.deepEqual(labels(trophy),["Champions Leagues","Europa Leagues","League titles","Domestic cups","Total trophies"]);
  assert.deepEqual(trophy.sections[0].rows[1],{label:"Europa Leagues",daniel:"1",nik:"2"});
  const rivalry=Seam.careerScreenView("rivalryStatistics",model);
  const el=rivalry.sections[0].rows.find(r=>r.label==="Europa Leagues");
  assert.deepEqual(el,{label:"Europa Leagues",daniel:"1",nik:"2"});
  ok("E2 the seam's Trophy Room and Rivalry views carry Europa Leagues next to Champions Leagues");
}
{
  const assets=["visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_512.webp","visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_1536.webp"];
  for(const file of assets){const bytes=fs.readFileSync(path.join(ROOT,file));assert.equal(bytes.subarray(0,4).toString(),"RIFF");assert.equal(bytes.subarray(8,12).toString(),"WEBP",`${file} is a webp`);}
  const foundation=read("tests/contracts/v10-foundation-contracts.cjs");
  for(const file of assets){const hash=createHash("sha256").update(fs.readFileSync(path.join(ROOT,file))).digest("hex");assert.ok(foundation.includes(hash),`${file} is pinned by hash in the foundation contract`);}
  const renderer=read("visual-assets/v10_1/trophy-room/trophy-room.js");
  assert.match(renderer,/key: "europaLeague", category: "EUROPA LEAGUE", asset: BASE \+ "\.\.\/shared\/trophies\/TRO_EUROPA_V1_512\.webp"/);
  assert.match(renderer,/europaLeagues/);
  const css=read("visual-assets/v10_1/trophy-room/trophy-room.css");
  assert.match(css,/\.trophyTabs\{[^}]*grid-template-columns:repeat\(6,1fr\)/,"six tabs on one row");
  assert.match(css,/\.trophyGrid\{[^}]*grid-template-columns:repeat\(5,1fr\)/,"five cases on one row");
  assert.match(css,/\.trophyTab:hover:not\(:disabled\):not\(\.is-active\)/,"a sticky phone hover never dims the active tab");
  const binder=read("js/careerScreensV10.js");
  assert.match(binder,/"EUROPA LEAGUE"/);assert.match(binder,/europaLeague:\s*"Europa League"|europaLeague:"Europa League"/);
  assert.match(binder,/\[data-trophy="europaLeague"\] \.trophyCardPicture \{background-image:url\("visual-assets\/v10_1\/shared\/trophies\/TRO_EUROPA_V1_1536\.webp"\)\}/);
  assert.doesNotMatch(binder,/#trophyRoom \.trophyTabs \{[^}]*repeat\(5,/,"no layout keeps a five-tab row");
  assert.doesNotMatch(binder,/#trophyRoom \.trophyGrid \{[^}]*repeat\(4,/,"no layout keeps a four-case row");
  ok("E3 Trophy Room has the EUROPA LEAGUE tab and case with TRO_EUROPA_V1, and its layouts fit 6 tabs and 5 cases");
}
{
  const renderer=read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js");
  assert.match(renderer,/"Europa Leagues":"europaLeagues"/);
  assert.match(renderer,/TRO_EUROPA_V1_512\.webp/);
  assert.match(renderer,/a\.europaLeagues\?\?"—",b\.europaLeagues\?\?"—"/);
  const strings=JSON.parse(read("visual-assets/v10_1/rivalry-statistics/strings.json"));
  assert.ok(JSON.stringify(strings).includes("Europa Leagues"),"strings list the Europa Leagues row");
  const css=read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css");
  assert.match(css,/\.rv-rows\{[^}]*grid-template-rows:repeat\(7,1fr\)/,"seven comparison rows");
  assert.match(css,/\.rv-trophyGrid\{[^}]*grid-template-columns:repeat\(5,1fr\)/,"five trophies");
  ok("E4 Rivalry Statistics shows a Europa Leagues row and a fifth trophy");
}
{
  const renderer=read("visual-assets/v10_1/career-statistics/career-statistics.js");
  assert.match(renderer,/\[fx\.strings\.comparisonRows\[3\],"europaLeagues"\]/);
  const binder=read("js/careerScreensV10.js");
  assert.match(binder,/"CHAMPIONS LEAGUE WINS","EUROPA LEAGUE WINS"/);
  assert.match(binder,/"europaLeagues"/);
  ok("E5 Career Statistics compares EUROPA LEAGUE WINS");
}
{
  const legacy=read("visual-assets/v10_1/legacy/legacy.js");
  assert.match(legacy,/season\.europaLeague && season\.europaLeague\[manager\] === true/);
  assert.match(legacy,/strings\.ui\.europaLeague \|\| "Europa League winner"/);
  assert.equal(JSON.parse(read("visual-assets/v10_1/legacy/strings.json")).ui.europaLeague,"Europa League winner");
  assert.match(read("js/statistics.js"),/\["Europa Leagues", one\.europaLeagues \|\| 0, two\.europaLeagues \|\| 0\]/);
  assert.match(read("js/trophyRoom.js"),/createTrophyCount\("Europa League", manager\.europaLeagues \|\| 0/);
  assert.match(read("js/legacy.js"),/player\.europaLeague === true/);
  ok("E6 History marks each Europa League winner and the old local screens count the Europa League");
}
{
  const screen=read("js/connectPlayersScreenV10.js").replace(/\\"/g,"\"");
  assert.match(screen,/<h2 id="connectPlayersTitle"><img class="connectPlayersWordmark" src="visual-assets\/v10_1\/shared\/wordmarks\/TITLE_CONNECT_PLAYERS_V1\.webp" alt="" aria-hidden="true"[^>]*><span class="connectPlayersTitleText">CONNECT PLAYERS<\/span><\/h2>/);
  const bytes=fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V1.webp"));
  assert.equal(bytes.subarray(8,12).toString(),"WEBP");
  const css=read("css/connectPlayersV10.css");
  const hidden=/\.connectPlayersTitleText\{([^}]*)\}/.exec(css);
  assert.ok(hidden,"the title words have a rule");
  assert.match(hidden[1],/clip-path:inset\(50%\)/);assert.match(hidden[1],/width:1px/);
  assert.doesNotMatch(hidden[1],/display:none|visibility:hidden/,"the words stay readable by assistive technology");
  ok("E7 CONNECT PLAYERS uses Team V's wordmark picture with visually hidden title words");
}
console.log(`r80 Europa League career pages contracts passed (${checks} checks)`);
