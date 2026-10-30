"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const Analytics=require("../../js/sharedCareerAnalytics.js");
const History=require("../../js/sharedHistoryConvergence.js");
const {result,projection,finalFor}=require("../support/career-fixture-helpers.cjs");
const clone=value=>JSON.parse(JSON.stringify(value));
const entry=(p,classification="completed",final=finalFor(p))=>({rivalryId:p.rivalryId,classification,projection:p,final});
const model=(showdowns,extra={})=>Analytics.buildCareerModel({indexStatus:"ready",showdowns,...extra});
const perfect=result({leaguePosition:1,leaguePoints:101,leagueGoals:101,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});
const record=(m,label)=>m.trophyRoom.records.find(row=>row.label===label);
const labels=["Highest season score","Highest league points","Highest league goals","Biggest Showdown win","Most perfect seasons"];
let cases=0;
function check(name,fn){try{fn();cases+=1;}catch(error){error.message=name+": "+error.message;throw error;}}

check("1. Bonus caps",()=>{
  const p=projection({totalSeasons:1,seasons:[[perfect,result()]]}),m=model([entry(p)]);
  assert.equal(m.managers.daniel.performanceBonuses,1,"both thresholds award one bonus");
  assert.equal(m.managers.daniel.awardsBonuses,1,"both awards award one bonus");
  assert.equal(m.history.showdowns[0].seasons[0].score.daniel,11,"maximum score is eleven");
  assert.equal(m.managers.daniel.careerPoints,11);
  assert.equal(m.managers.daniel.perfectSeasons,1);
  assert.equal(m.managers.daniel.hundredPointSeasons,1);
  assert.equal(m.managers.daniel.hundredGoalSeasons,1);
  assert.equal(m.managers.daniel.topScorerSeasons,1);
  assert.equal(m.managers.daniel.topAssistSeasons,1);
});
check("2. Trophy is not points",()=>{
  const p=projection({totalSeasons:1,seasons:[[result({championsLeague:true}),result()]]}),m=model([entry(p)]);
  assert.equal(m.managers.daniel.championsLeagues,1);
  assert.equal(m.managers.daniel.totalTrophies,1);
  assert.equal(m.managers.daniel.careerPoints,5);
  assert.deepEqual(m.trophyRoom.cabinet.daniel,{championsLeagues:1,europaLeagues:0,leagueTitles:0,domesticCups:0,totalTrophies:1});
});
check("2b. r80 Europa League: +3, a trophy, never a perfect season; both managers may win it in one season",()=>{
  const el=o=>result({europaLeague:true,...o});
  const p=projection({totalSeasons:3,seasons:[[el({leaguePosition:1,leaguePoints:100,domesticCup:true,topScorer:true}),el()],[result({championsLeague:true}),el()],[result(),result()]]}),m=model([entry(p)]);
  assert.equal(m.history.showdowns[0].seasons[0].score.daniel,9,"an Europa League season scores at most 9");
  assert.equal(m.history.showdowns[0].seasons[0].score.nik,3);
  assert.equal(m.managers.daniel.europaLeagues,1);assert.equal(m.managers.nik.europaLeagues,2);
  assert.equal(m.managers.daniel.championsLeagues,1);assert.equal(m.managers.nik.championsLeagues,0);
  assert.equal(m.managers.daniel.totalTrophies,1+1+1+1,"EL + CL + league title + cup");
  assert.equal(m.managers.nik.totalTrophies,2);
  assert.equal(m.managers.daniel.perfectSeasons,0,"a perfect (11-point) season stays Champions League only");
  assert.deepEqual(m.trophyRoom.cabinet.nik,{championsLeagues:0,europaLeagues:2,leagueTitles:0,domesticCups:0,totalTrophies:2});
  assert.equal(m.managers.daniel.careerPoints,9+5);assert.equal(m.managers.nik.careerPoints,3+3);
  // An old (7-key) history counts no Europa League and keeps its totals.
  const old=model([entry(projection({totalSeasons:1,seasons:[[result({championsLeague:true}),result()]]}))]);
  assert.equal(old.managers.daniel.europaLeagues,0);assert.equal(old.managers.daniel.totalTrophies,1);
});
check("3. Season tiebreaks",()=>{
  const seasons=[[result({domesticCup:true}),result()],[result({leaguePosition:2}),result({leaguePosition:3})],[result({leaguePoints:61}),result()],[result(),result()]];
  const p=projection({totalSeasons:5,seasons}),m=model([entry(p,"active",null)]);
  // r83 (Nik 2026-10-23): no tiebreak. Equal Showdown points is a draw whatever the league table says.
  assert.deepEqual(p.seasonHistory.map(Analytics.seasonTiebreak),["none","draw","draw","draw"]);
  assert.deepEqual(m.history.showdowns[0].seasons.map(s=>s.tiebreak),["none","draw","draw","draw"]);
  assert.deepEqual(m.history.showdowns[0].seasons.map(s=>s.winner),["daniel","draw","draw","draw"]);
});
check("4. Final is totals only",()=>{
  const p=projection({seasons:[[result({domesticCup:true}),result()],[result(),result({domesticCup:true})],[result({leaguePosition:2}),result({leaguePosition:3})]]}),m=model([entry(p)]);
  // r83: season 3 (equal points, better league position) is now a draw, not a Daniel win.
  assert.equal(m.managers.daniel.seasonWins,1);
  assert.equal(m.managers.nik.seasonWins,1);
  assert.equal(m.managers.daniel.seasonDraws,1);
  assert.equal(m.history.showdowns[0].winner,"draw");
  for(const manager of Object.values(m.managers))assert.deepEqual(manager.showdowns,{completed:1,wins:0,draws:1,losses:0});
  const invalid=entry(p,"completed",{...finalFor(p),winner:"playerOne"});
  assert.equal(model([invalid]).status,"partial","season wins cannot break a final draw");
});
check("5. Once only",()=>{
  const p=projection({totalSeasons:1,seasons:[[perfect,result()]]}),e=entry(p),m=model([e,clone(e)]);
  assert.equal(m.managers.daniel.seasons,1);
  assert.equal(m.managers.daniel.careerPoints,11);
  assert.equal(m.managers.daniel.showdowns.completed,1);
  assert.deepEqual(m.coverage,{readable:1,indexed:1});
  assert.equal(m.history.showdowns.length,1);
});
check("6. Conflict is integrity failure",()=>{
  const p=projection({totalSeasons:1,seasons:[[result(),result()]]});
  const conflict=projection({totalSeasons:1,seasons:[[perfect,result()]]});
  const m=model([entry(p),entry(conflict)]);
  assert.equal(m.status,"partial");
  assert.deepEqual(m.coverage,{readable:0,indexed:1});
  assert.equal(m.managers.daniel.seasons,0);
  assert.equal(m.history.showdowns[0].status,"unavailable");
  assert.deepEqual(m.history.showdowns[0].seasons,[]);
  const tampered=clone(p);tampered.managerRecords.playerOne.totalPoints=11;
  assert.equal(model([entry(tampered)]).status,"partial","verifyProjection rejects aggregate tampering");
  assert.equal(model([{...entry(p),rivalryId:"pair_"+"f".repeat(64)}]).status,"partial","entry and projection identity must agree");
});
check("7. Abandoned removal",()=>{
  const a=projection({totalSeasons:1,seasons:[[result({domesticCup:true}),result({leaguePoints:70,leagueGoals:80,topAssist:true})]]});
  const b=projection({seed:"2",totalSeasons:1,seasons:[[result(),result({...perfect,leaguePoints:114})]]});
  const m=model([entry(a),entry(b,"abandoned",null)]),only=model([entry(a)]);
  assert.deepEqual(m.managers,only.managers,"abandoned seasons change no career statistic");
  assert.deepEqual(m.trophyRoom,only.trophyRoom,"abandoned seasons change no record or trophy");
  assert.equal(m.managers.nik.bestSeasonScore,1);
  assert.equal(m.managers.nik.bestLeaguePoints,70);
  assert.equal(m.managers.nik.perfectSeasons,0);
  assert.equal(m.managers.nik.averageLeaguePoints,70);
  assert.deepEqual(m.history.showdowns[1],{number:2,rivalryId:b.rivalryId,status:"abandoned",leagueId:null,clubs:null,seasonsPlayed:null,totalSeasons:null,totals:null,winner:null,seasons:[],setupConfirmedAt:null});
  assert.deepEqual(m.coverage,{readable:2,indexed:2});
  assert.equal(record(m,"Highest season score").value,1);
});
check("8. Completion pending",()=>{
  const p=projection({totalSeasons:1,seasons:[[perfect,result()]]}),m=model([entry(p,"completion-pending")]);
  // r83 (JOB-4 F1): career totals count finished Showdowns only; the pending row still shows its totals.
  assert.equal(m.managers.daniel.seasons,0);
  assert.equal(m.managers.daniel.showdowns.completed,0);
  assert.equal(m.history.showdowns[0].status,"completion-pending");
  assert.deepEqual(m.history.showdowns[0].totals,{daniel:11,nik:0});
  assert.equal(m.history.showdowns[0].winner,"daniel");
  assert.equal(m.biggestShowdownWin,null);
});
check("9. Active",()=>{
  const p=projection({seasons:[[result(),perfect]]}),m=model([entry(p,"active",null)]),row=m.history.showdowns[0];
  assert.equal(m.managers.nik.careerPoints,0,"r83: an unfinished Showdown adds nothing to career totals");
  assert.equal(m.managers.nik.showdowns.completed,0);
  assert.equal(row.winner,null);
  assert.equal(row.status,"in-progress");
  assert.equal(row.seasonsPlayed,1);
  assert.equal(row.totalSeasons,3);
  assert.deepEqual(row.totals,{daniel:0,nik:11});
  assert.equal(m.biggestShowdownWin,null);
});
check("10. Final mismatch",()=>{
  const p=projection({totalSeasons:1,seasons:[[result(),perfect]]});
  const good=projection({seed:"2",totalSeasons:1,seasons:[[result(),result()]]});
  const bad={totals:{playerOne:11,playerTwo:11},winner:"draw"};
  const m=model([entry(good),entry(p,"completed",bad)]);
  assert.equal(m.status,"partial");
  assert.deepEqual(m.coverage,{readable:1,indexed:2});
  assert.equal(m.managers.nik.careerPoints,0);
  assert.equal(m.managers.nik.seasons,1);
  assert.equal(m.history.showdowns[1].totals,null);
  assert.equal(model([entry(p,"completion-pending",bad)]).status,"partial");
  assert.equal(model([entry(p,"completed",null)]).status,"partial");
  assert.equal(model([entry(p,"completed",{...finalFor(p),winner:"playerOne"})]).status,"partial");
});
check("11. Combined averages",()=>{
  const ten=result({...perfect,domesticCup:false}),two=result({domesticCup:true,topScorer:true});
  const a=projection({totalSeasons:1,seasons:[[ten,result()]]});
  const b=projection({seed:"2",seasons:[[two,result()],[two,result()],[two,result()]]});
  const m=model([entry(a),entry(b)]);
  assert.equal(m.managers.daniel.careerPoints,16);
  assert.equal(m.managers.daniel.seasons,4);
  assert.equal(m.managers.daniel.averageSeasonScore,4,"combined sums and counts, not mean of means");
  assert.equal(m.managers.daniel.averageLeaguePoints,(101+60*3)/4);
  assert.equal(m.managers.daniel.averageLeagueGoals,(101+55*3)/4);
});
check("12. Status",()=>{
  const p=projection({totalSeasons:1,seasons:[[perfect,result()]]});
  for(const indexStatus of ["loading","unavailable"]){
    const m=model([entry(p)],{indexStatus});
    assert.equal(m.status,indexStatus);
    function allNull(value){if(value&&typeof value==="object")for(const v of Object.values(value))allNull(v);else assert.equal(value,null);}
    allNull(m.managers);allNull(m.coverage);allNull(m.trophyRoom.cabinet);
    assert.deepEqual(m.history.showdowns,[]);assert.deepEqual(m.trophyRoom.standings,[]);assert.deepEqual(m.trophyRoom.records,[]);
    assert.equal(m.biggestShowdownWin,null);
  }
  const empty=model([]);
  assert.equal(empty.status,"empty");
  assert.deepEqual(empty.coverage,{readable:0,indexed:0});
  assert.equal(empty.managers.daniel.seasons,0);
  assert.equal(empty.managers.daniel.averageSeasonScore,null);
  assert.equal(empty.managers.daniel.bestLeaguePosition,null);
  assert.equal(record(empty,"Highest season score").value,null);
  assert.equal(record(empty,"Most perfect seasons").value,null,"no data is unknown, not a zero record");
  assert.equal(model([{rivalryId:p.rivalryId,classification:"pending",projection:null,final:null}]).status,"empty");
  const m=model([{rivalryId:p.rivalryId,classification:"unavailable",projection:null,final:null}]);
  assert.equal(m.status,"partial");assert.deepEqual(m.coverage,{readable:0,indexed:1});
  assert.equal(m.history.showdowns[0].leagueId,null);assert.deepEqual(m.history.showdowns[0].seasons,[]);
});
check("13. Left/right",()=>{
  const p=projection({totalSeasons:1,seasons:[[result(),perfect]]}),m=model([entry(p)]);
  assert.deepEqual(Object.keys(m.managers),["daniel","nik"]);
  assert.equal(m.managers.daniel.careerPoints,0);assert.equal(m.managers.nik.careerPoints,11);
  assert.equal(m.managers.daniel.showdowns.losses,1);assert.equal(m.managers.nik.showdowns.wins,1);
  assert.deepEqual(m.history.showdowns[0].clubs,{daniel:"club_a",nik:"club_b"});
  assert.deepEqual(m.history.showdowns[0].seasons[0],{season:1,score:{daniel:0,nik:11},winner:"nik",tiebreak:"none",leaguePosition:{daniel:5,nik:1},leaguePoints:{daniel:60,nik:101},leagueGoals:{daniel:55,nik:101}});
  assert.deepEqual(m.biggestShowdownWin,{manager:"nik",margin:11,showdownRef:p.rivalryId});
  assert.equal(m.trophyRoom.standings[0].manager,"nik");
  assert.equal(record(m,"Highest season score").manager,"nik");
});
check("14. Records and standings",()=>{
  const a=projection({totalSeasons:1,seasons:[[perfect,perfect]]}),tie=model([entry(a)]);
  assert.deepEqual(tie.trophyRoom.records.map(r=>r.label),labels);
  for(const row of tie.trophyRoom.records)assert.equal(row.manager,"shared");
  assert.deepEqual(tie.trophyRoom.standings,[{manager:"daniel",careerPoints:11,seasonWins:0,level:true},{manager:"nik",careerPoints:11,seasonWins:0,level:true}]);
  assert.deepEqual(record(tie,"Highest season score").ref,{rivalryId:a.rivalryId,season:1});
  const b=projection({seed:"2",totalSeasons:1,seasons:[[perfect,perfect]]});
  assert.equal(record(model([entry(a),entry(b)]),"Highest season score").ref,null,"tied across different places has no single ref");
  const c=projection({seed:"3",totalSeasons:1,seasons:[[result(),result({domesticCup:true})]]});
  const d=projection({seed:"4",totalSeasons:1,seasons:[[perfect,result()]]});
  const m=model([entry(a),entry(c),entry(d,"active",null),entry(d,"completion-pending")]);
  // Use separate ids for different classifications; duplicate contradictions are tested below.
  const active=projection({seed:"5",totalSeasons:1,seasons:[[perfect,result()]]});
  const valid=model([entry(a),entry(c),entry(d,"completion-pending"),entry(active,"active",null)]);
  assert.deepEqual(valid.biggestShowdownWin,{manager:"nik",margin:1,showdownRef:c.rivalryId});
  assert.deepEqual(record(valid,"Biggest Showdown win"),{label:labels[3],manager:"nik",value:1,ref:{rivalryId:c.rivalryId}});
  assert.equal(m.status,"partial","contradictory duplicate lifecycle states are fail-closed");
  const equalTotals=projection({seed:"6",seasons:[[result({domesticCup:true}),result()],[result(),result({domesticCup:true})],[result({leaguePosition:3}),result({leaguePosition:2})]]});
  const ranked=model([entry(equalTotals)]);
  // r83 (Nik 2026-10-23): season wins no longer break a career points tie; equal points are level, like a drawn Showdown.
  assert.equal(ranked.managers.nik.seasonDraws,1,"the league-position season is a draw (no tiebreak)");
  assert.ok(ranked.trophyRoom.standings.every(r=>r.level===true),"equal career points are level whatever the season wins");
  const sameMargin=projection({seed:"7",totalSeasons:1,seasons:[[result({domesticCup:true}),result()]]});
  assert.deepEqual(record(model([entry(c),entry(sameMargin)]),"Biggest Showdown win"),{label:labels[3],manager:"shared",value:1,ref:null});
});
check("15. Interim label",()=>{
  assert.equal(model([],{currentShowdownOnly:true}).interimLabel,"Current Showdown only. Career history is not yet available.");
  assert.equal(model([]).interimLabel,null);
});
check("16. Pure and frozen",()=>{
  const p=projection({totalSeasons:1,seasons:[[perfect,result()]]}),input={indexStatus:"ready",showdowns:[entry(clone(p))]},before=clone(input);
  const m=Analytics.buildCareerModel(input);
  function frozen(value){if(value&&typeof value==="object"){assert.ok(Object.isFrozen(value),"each nested output object is frozen");Object.values(value).forEach(frozen);}}
  frozen(m);assert.deepEqual(Analytics.buildCareerModel(input),m);assert.deepEqual(input,before,"caller input stays unchanged");
  assert.ok(!Object.isFrozen(input.showdowns[0].projection),"must not freeze caller objects");
  const source=fs.readFileSync("js/sharedCareerAnalytics.js","utf8");
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|document\.|currentShowdown|Date\.now|Math\.random/);
  const previous=Object.getOwnPropertyDescriptor(globalThis,"localStorage");
  try{Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{careerPoints:999999}});assert.deepEqual(Analytics.buildCareerModel(input),m);}
  finally{if(previous)Object.defineProperty(globalThis,"localStorage",previous);else delete globalThis.localStorage;}
  const context=vm.createContext({CareerModeSharedHistoryConvergence:History});
  vm.runInContext(source,context);
  assert.equal(typeof context.CareerModeSharedCareerAnalytics.buildCareerModel,"function","browser module export exists");
  assert.deepEqual(clone(context.CareerModeSharedCareerAnalytics.buildCareerModel(input)),m,"browser and node math agree");
  frozen(model([]));frozen(model([],{indexStatus:"unavailable"}));
});

check("17. Agreement with sharedHistoryConvergence",()=>{
  const p=projection({seasons:[[perfect,result({leaguePosition:2,leaguePoints:100,leagueGoals:100,topAssist:true})],[result(),result({leaguePosition:3,championsLeague:true})],[result({leaguePoints:70,domesticCup:true}),result({leaguePoints:70,domesticCup:true})]]});
  History.verifyProjection(p);
  const m=model([entry(p)]);
  const sharedFields=["seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore","bestLeaguePoints","bestLeagueGoals","bestLeaguePosition"];
  for(const [role,manager] of [["playerOne","daniel"],["playerTwo","nik"]]){
    for(const field of sharedFields)assert.equal(m.managers[manager][field],p.managerRecords[role][field],`${manager}.${field} agrees with verified history`);
    assert.equal(m.managers[manager].careerPoints,p.managerRecords[role].totalPoints,`${manager}.careerPoints equals totalPoints`);
  }
});

console.log(`PASS Shared Career Analytics contracts (${cases}/18 cases): capped scoring, verified deduplication, lifecycle exclusion, final integrity, weighted averages, role mapping, records, status, pure frozen outputs and history agreement.`);
