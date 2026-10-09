"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const A=require("../../js/sharedActiveShowdownAdapter.js"),Career=require("../../js/sharedCareerAnalytics.js");
const History=require("../../js/sharedHistoryConvergence.js"),Terminal=require("../../js/sharedTerminalClose.js"),Final=require("../../js/sharedFinalReconciliation.js");
const F=require("../support/active-showdown-fixtures.cjs");
const {result:R,projection:P}=F;
const clone=x=>JSON.parse(JSON.stringify(x));
const fields=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"];
const perfect=R({leaguePosition:1,leaguePoints:101,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
const snap=(p,extra={})=>({identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:F.multiFor(p),history:F.history(p),finalReconciliation:null,terminalClose:null,seasonResults:F.seasonResults({rivalryId:p.rivalryId,seasonNumber:p.acceptedSeasons}),...extra});
const cp=()=>P({seasons:[[R({championsLeague:true}),R()],[R({domesticCup:true}),R()],[R(),R({leaguePosition:1})]]});
const career=s=>Career.buildCareerModel(A.careerInput(s));
const mapRole=r=>r==="playerOne"?"daniel":r==="playerTwo"?"nik":"draw";
const clubs={daniel:"club_a",nik:"club_b"};
function frozen(x,borrowed=null){if(x===borrowed)return;if(x&&typeof x==="object"){assert.ok(Object.isFrozen(x),"every output object is frozen");Object.values(x).forEach(y=>frozen(y,borrowed));}}
function noLeak(x){if(x&&typeof x==="object"){for(const key of Object.keys(x))assert.ok(!["opponentResult","allResults","publishedRoles","operationIds","accountId","profileId","saveId"].includes(key),"private key "+key);Object.values(x).forEach(noLeak);}else assert.notEqual(x,287,"unrevealed rival sentinel");}
function contains(x,v){return x===v||Boolean(x&&typeof x==="object"&&Object.values(x).some(y=>contains(y,v)));}
// careerInput deliberately preserves the verified projection, whose internal ids are not screen fields.
function screenViews(s){const {careerInput,...views}=A.buildActiveShowdownViews(s);return views;}
let cases=0;function check(name,fn){try{fn();cases++;}catch(e){e.message=name+": "+e.message;throw e;}}
check("1. Left/right",()=>{
 const p=P({totalSeasons:1,seasons:[[R({championsLeague:true,leaguePosition:1}),R({leaguePosition:1})]]}),s=snap(p,{terminalClose:F.closed(p)}),v=A.buildActiveShowdownViews(s);
 assert.deepEqual(v.home.continue.score,{daniel:8,nik:3});assert.deepEqual(v.rivalry.score,{daniel:8,nik:3});assert.equal(v.seasonResults.breakdown.daniel.total,8);assert.deepEqual(v.finalWinner.totals,{daniel:8,nik:3});assert.equal(v.finalWinner.winner,"daniel");
 const n=A.buildActiveShowdownViews({...s,identity:F.identity("nik"),pair:F.pair(p.rivalryId,{managerId:"nik"}),seasonResults:F.seasonResults({rivalryId:p.rivalryId,seasonNumber:1,managerRole:"playerTwo"})});
 assert.equal(n.home.viewerRole,"nik");assert.equal(n.seasonResults.viewerRole,"nik");const normalized=clone(n);normalized.home.viewerRole="daniel";normalized.seasonResults.viewerRole="daniel";assert.deepEqual(normalized,clone(v),"same left/right numbers for both viewers");
});
check("2. Rivalry provider fields",()=>{
 const p=P({seasons:[[perfect,R()],[R(),R({leaguePosition:1})]]}),s=snap(p),v=A.rivalryView(s);assert.equal(v.status,"ready");assert.equal(v.season,3);assert.equal(v.totalSeasons,3);assert.equal(v.leagueId,p.leagueId);assert.deepEqual(v.clubs,clubs);assert.deepEqual(v.score,{daniel:11,nik:3});
 for(const [role,id] of [["playerOne","daniel"],["playerTwo","nik"]]){assert.deepEqual(Object.keys(v.managers[id]).sort(),fields.slice().sort());for(const key of fields)assert.equal(v.managers[id][key],p.managerRecords[role][key],id+" "+key);}
 assert.deepEqual(v.seasons,career(s).history.showdowns[0].seasons.map(({tiebreak,...row})=>row));assert.deepEqual(Object.keys(v).sort(),["status","leagueId","clubs","season","totalSeasons","score","managers","seasons","transfers"].sort());assert.deepEqual(v.transfers,{status:"unavailable"});
});
check("3. Rivalry states",()=>{
 const p=cp(),s=snap(p);assert.equal(A.rivalryView({...s,pair:{initialized:false}}).status,"loading");
 const zero={...s,history:null,multiSeason:F.multi({rivalryId:p.rivalryId})},z=A.rivalryView(zero);assert.equal(z.status,"empty");assert.deepEqual(z.seasons,[]);assert.deepEqual(z.score,{daniel:0,nik:0});assert.equal(z.managers.nik.bestSeasonScore,null);for(const key of fields.filter(k=>k!=="bestSeasonScore"))assert.equal(z.managers.nik[key],0);
 const pending=A.rivalryView({...s,pair:F.pair(p.rivalryId,{status:"waiting",connectionState:"pending-pair"})});assert.equal(pending.status,"empty");assert.equal(pending.score,null);
 const bad=clone(p);bad.managerRecords.playerOne.totalPoints++;assert.equal(A.rivalryView({...s,history:F.history(bad)}).status,"unavailable");
});
check("4. Stale and lagging",()=>{
 const p=P({seasons:[[R(),R()]]}),s=snap(p),other=P({seed:"2",seasons:[[R(),R()]]});assert.equal(A.rivalryView({...s,history:F.history(other)}).status,"loading");
 const two=P({seasons:[[R(),R()],[R(),R()]]});assert.equal(A.rivalryView({...s,multiSeason:F.multiFor(two)}).status,"loading");
 const multi=clone(s.multiSeason);multi.state.acceptedRevisionKey="different";assert.equal(A.classifyCurrentShowdown({...s,multiSeason:multi}),"unavailable");
 for(const [key,value] of [["leagueId","laliga"],["totalSeasons",5],["fixedClubs",{playerOne:"other",playerTwo:"club_b"}]]){const m=clone(s.multiSeason);m.state[key]=value;assert.equal(A.classifyCurrentShowdown({...s,multiSeason:m}),"unavailable",key+" disagreement");}
});
check("5. Home Continue",()=>{
 const p=P({totalSeasons:5,seasons:[[R({championsLeague:true,domesticCup:true}),R({leaguePosition:1,domesticCup:true})]]}),s=snap(p);
 assert.deepEqual(A.homeView(s),{status:"ready",viewerRole:"daniel",continue:{state:"paired",leagueId:p.leagueId,clubs,season:2,totalSeasons:5,score:{daniel:6,nik:4}}});
 for(const status of ["waiting","recovery-required","unpaired"]){const x={...s,pair:F.pair(p.rivalryId,{status,connectionState:status==="waiting"?"pending-pair":status==="unpaired"?null:"active"})},v=A.homeView(x);assert.equal(v.continue.state,status);assert.equal(v.continue.leagueId,status==="recovery-required"?p.leagueId:null);assert.deepEqual(v.continue.clubs,status==="recovery-required"?clubs:null);assert.equal(v.continue.season,status==="recovery-required"?2:null);}
 for(const status of ["idle","starting","joining","continuing","retrying-link","abandoning","pair-link-retry"]){const v=A.homeView({...s,pair:F.pair(p.rivalryId,{status})});assert.equal(v.status,"loading",status);assert.equal(v.continue.state,null,status);}
 for(const status of ["signed-out","unavailable","error","save-required"])assert.equal(A.homeView({...s,pair:F.pair(p.rivalryId,{status})}).status,"unavailable",status);
 assert.equal(A.homeView({...s,identity:F.identity("nik")}).status,"unavailable");
});
check("6. Season Results phases",()=>{
 const p=P({seasons:[[R({domesticCup:true}),R()]]}),base=snap(p),own=R({leagueGoals:99}),opponent=R({leaguePoints:77});
 const sr=o=>F.seasonResults({rivalryId:p.rivalryId,seasonNumber:2,...o}),view=o=>A.seasonResultsView({...base,seasonResults:sr(o)});
 let v=view({});assert.equal(v.phase,"entering");assert.deepEqual(v.inputs,{daniel:null,nik:null});
 v=view({phase:"COLLECTING",published:["playerOne"],own});assert.equal(v.phase,"waiting-for-rival");assert.deepEqual(v.inputs,{daniel:own,nik:null});
 v=view({phase:"RESULTS_READY",published:["playerOne","playerTwo"],own,opponent});assert.equal(v.phase,"results-ready");assert.deepEqual(v.inputs,{daniel:own,nik:opponent});assert.equal(v.breakdown,null);assert.equal(v.winner,null);assert.equal(v.tiebreak,null);
 v=A.seasonResultsView(base,{season:1});assert.equal(v.phase,"committed");assert.equal(v.breakdown.daniel.total,1);assert.equal(v.breakdown.nik.total,0);assert.equal(v.breakdown.daniel.awardsBonus,0);assert.ok(!Object.hasOwn(v.breakdown.daniel,"individualAwardsBonus"));
 assert.equal(view({managerRole:"playerTwo"}).status,"unavailable");
});
check("7. Tiebreak",()=>{
 const p=P({totalSeasons:5,seasons:[[R({domesticCup:true}),R()],[R({leaguePosition:2}),R({leaguePosition:3})],[R({leaguePoints:80}),R({leaguePoints:78})],[R(),R()]]}),s=snap(p),expected=["none","league-position","league-points","draw"];
 for(let i=0;i<4;i++){const v=A.seasonResultsView(s,{season:i+1});assert.equal(v.tiebreak,expected[i]);assert.equal(v.tiebreak,Career.seasonTiebreak(p.seasonHistory[i]));assert.equal(v.winner,mapRole(p.seasonHistory[i].winner));}
});
check("8. No rival leak",()=>{
 const p=P({seasons:[[R(),R()]]});for(const id of ["daniel","nik"]){const role=id==="daniel"?"playerOne":"playerTwo",other=role==="playerOne"?"playerTwo":"playerOne",s=snap(p,{identity:F.identity(id),pair:F.pair(p.rivalryId,{managerId:id})}),own=R(),rival=R({leagueGoals:287});
 const sr=o=>F.seasonResults({rivalryId:p.rivalryId,seasonNumber:2,managerRole:role,own,opponent:rival,...o});
 for(const state of [sr({phase:"COLLECTING",published:[role]}),{...sr({phase:"COLLECTING",published:[role]}),allResults:{[role]:own,[other]:rival}},sr({}),sr({managerRole:other,own:rival})]){const x={...s,seasonResults:state};noLeak(screenViews(x));noLeak(A.seasonResultsView(x));assert.equal(contains(A.buildActiveShowdownViews(x),287),false,"no unrevealed sentinel even in career input");if(state.managerRole!==role)assert.equal(A.seasonResultsView(x).status,"unavailable");}
 const ready={...s,seasonResults:sr({phase:"RESULTS_READY",published:[role,other]})};assert.ok(contains(screenViews(ready),287));assert.ok(contains(A.seasonResultsView(ready),287));
 }
});
check("9. Completion pending",()=>{
 const p=cp(),base=snap(p),expected={status:"ready",state:"completion-pending",totals:{daniel:6,nik:3},winner:"daniel",margin:3,seasonsPlayed:3,trophies:{daniel:{championsLeague:1,leagueTitles:0,domesticCups:1,total:2},nik:{championsLeague:0,leagueTitles:1,domesticCups:0,total:1}}};
 for(const extra of [{},{finalReconciliation:F.finalReconciliation(p)},... ["READY","BLOCKED","RECOVERY_PENDING"].map(phase=>({terminalClose:{phase,rivalryId:p.rivalryId}}))]){const s={...base,...extra};assert.equal(A.classifyCurrentShowdown(s),"completion-pending");assert.deepEqual(A.finalWinnerView(s),expected);assert.equal(career(s).managers.daniel.showdowns.completed,0);assert.equal(career(s).history.showdowns[0].status,"completion-pending");}
 assert.equal(A.classifyCurrentShowdown({...base,finalReconciliation:F.finalReconciliation(p,{playerOne:1,playerTwo:0})}),"unavailable");
});
check("10. Completed",()=>{
 const p=cp(),s=snap(p,{terminalClose:F.closed(p)});assert.equal(A.classifyCurrentShowdown(s),"completed");assert.equal(A.finalWinnerView(s).state,"completed");for(const id of ["daniel","nik"])assert.equal(career(s).managers[id].showdowns.completed,1);
 const bad={...s,terminalClose:F.closed(p,{playerOne:1,playerTwo:0})};const v=A.buildActiveShowdownViews(bad);assert.equal(v.classification,"unavailable");for(const key of ["home","rivalry","seasonResults","finalWinner"])assert.equal(v[key].status,"unavailable",key);assert.equal(career(bad).status,"unavailable");
 // Job 3 maps indexStatus unavailable to unavailable, not partial; no unverifiable score is admitted.
 const other=P({seed:"2",totalSeasons:1,seasons:[[R(),R()]]});assert.equal(A.classifyCurrentShowdown({...s,terminalClose:F.closed(other)}),"completion-pending");
 for(const terminalClose of [{...F.closed(p),terminal:false},{...F.closed(p),terminalWitness:{}},{...F.closed(p),terminalWitness:{...F.closed(p).terminalWitness,rivalryId:other.rivalryId}}])assert.equal(A.classifyCurrentShowdown({...s,terminalClose}),"unavailable");
});
check("11. Final totals only",()=>{
 const tie=P({seasons:[[R({domesticCup:true}),R()],[R({domesticCup:true}),R()],[R(),R({domesticCup:true,topScorer:true})]]});let v=A.finalWinnerView(snap(tie));assert.equal(v.winner,"draw");assert.equal(v.margin,0);
 const ahead=P({seasons:[[R({domesticCup:true}),R()],[R({domesticCup:true}),R()],[R(),R({championsLeague:true,domesticCup:true})]]});v=A.finalWinnerView(snap(ahead));assert.equal(v.winner,"nik");assert.equal(v.margin,4);
});
check("12. Witness only",()=>{
 const p=cp(),s=snap(p,{history:null,terminalClose:F.closed(p)}),v=A.finalWinnerView(s);assert.equal(v.status,"partial");assert.equal(v.state,"completed");assert.deepEqual(v.totals,{daniel:6,nik:3});assert.equal(v.winner,"daniel");assert.equal(v.margin,3);assert.equal(v.seasonsPlayed,3);assert.equal(v.trophies,null);assert.equal(A.rivalryView(s).status,"unavailable");assert.deepEqual(A.careerInput(s).showdowns,[{rivalryId:p.rivalryId,classification:"unavailable",projection:null,final:null}]);
});
check("13. Trophies",()=>{
 const p=P({seasons:[[R(),R({championsLeague:true})],[R(),R({leaguePosition:1})],[R(),R()]]}),s=snap(p);assert.deepEqual(A.finalWinnerView(s).trophies.nik,{championsLeague:1,leagueTitles:1,domesticCups:0,total:2});assert.equal(A.rivalryView(s).score.nik,8);
});
check("14. Abandoned",()=>{
 const p=P({seasons:[[R(),perfect]]}),s=snap(p,{pair:F.pair(p.rivalryId,{connectionState:"closed"})});assert.equal(A.classifyCurrentShowdown(s),"abandoned");assert.deepEqual(A.careerInput(s).showdowns,[{rivalryId:p.rivalryId,classification:"abandoned",projection:null,final:null}]);assert.equal(A.rivalryView(s).status,"empty");assert.equal(A.finalWinnerView(s).status,"empty");assert.equal(career(s).managers.nik.bestSeasonScore,null);
 for(const status of ["waiting","paired"])assert.equal(A.homeView(snap(p,{pair:F.pair(p.rivalryId,{status,connectionState:"closed"})})).continue.state,"unpaired","a closed pair is no live pair: Home offers a fresh start");
 assert.equal(A.homeView(snap(p,{pair:F.pair(p.rivalryId,{status:"waiting",connectionState:"closed"}),terminalClose:F.closed(p)})).continue.state,"unpaired");
});
check("15. Career input",()=>{
 const p=P({seasons:[[R(),R()]]}),s=snap(p),end=cp(),pending={...s,pair:F.pair(p.rivalryId,{status:"waiting",connectionState:"pending-pair"})};
 for(const [x,indexStatus,showdowns] of [[{},"loading",[]],[{...s,pair:F.pair(p.rivalryId,{status:"error"})},"unavailable",[]],[{...s,pair:F.pair(null,{status:"unpaired"})},"ready",[]],[pending,"ready",[{rivalryId:p.rivalryId,classification:"pending",projection:null,final:null}]],[{...s,history:null,multiSeason:F.multi({rivalryId:p.rivalryId})},"ready",[]],[s,"ready",[{rivalryId:p.rivalryId,classification:"active",projection:p,final:null}]],[snap(end),"ready",[{rivalryId:end.rivalryId,classification:"completion-pending",projection:end,final:F.finalFor(end)}]],[snap(end,{terminalClose:F.closed(end)}),"ready",[{rivalryId:end.rivalryId,classification:"completed",projection:end,final:F.finalFor(end)}]]]){assert.deepEqual(A.careerInput(x),{indexStatus,showdowns,currentShowdownOnly:true,...(indexStatus!=="ready"&&x.pair?.rivalryId?{currentRivalryId:x.pair.rivalryId}:{})});assert.equal(career(x).interimLabel,"Current Showdown only. Career history is not yet available.");if(showdowns[0]?.projection)assert.equal(A.careerInput(x).showdowns[0].projection,showdowns[0].projection);}
});
check("16. Scoring unchanged",()=>{
 const p=P({totalSeasons:1,seasons:[[perfect,R()]]});assert.deepEqual(A.seasonResultsView(snap(p)).breakdown.daniel,{championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,awardsBonus:1,total:11});
});
check("17. Never throws",()=>{
 for(const s of [undefined,{}, {pair:"x"},{pair:{initialized:true,status:"paired",rivalryId:7}},snap(cp(),{history:{...F.history(cp()),projection:{}}})]){const v=A.buildActiveShowdownViews(s);frozen(v);assert.ok(["loading","unavailable"].includes(v.home.status),"malformed snapshot is not ready");}
});
check("18. Pure frozen browser and Node",()=>{
 const p=cp();frozen(A.buildActiveShowdownViews(snap(p,{terminalClose:F.closed(p)})));const s=clone(snap(p,{terminalClose:F.closed(p)})),before=clone(s),v=A.buildActiveShowdownViews(s);frozen(v,s.history.projection);assert.deepEqual(A.buildActiveShowdownViews(s),v);assert.deepEqual(s,before);assert.equal(Object.isFrozen(s),false);assert.equal(Object.isFrozen(s.history.projection),false,"caller projection is never frozen");
 const source=fs.readFileSync(require.resolve("../../js/sharedActiveShowdownAdapter.js"),"utf8");assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|document\.|\bwindow\b|\bcurrentShowdown\b|getState\s*\(|addEventListener|setInterval|setTimeout|Date\.now|Math\.random/);
 const oldStorage=globalThis.localStorage,oldShowdown=globalThis.currentShowdown;try{globalThis.localStorage={getItem:()=>"conflict"};globalThis.currentShowdown={playerOne:{score:999}};assert.deepEqual(A.buildActiveShowdownViews(s),v);}finally{if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;if(oldShowdown===undefined)delete globalThis.currentShowdown;else globalThis.currentShowdown=oldShowdown;}
 const context=vm.createContext({CareerModeSharedHistoryConvergence:History,CareerModeSharedCareerAnalytics:Career,CareerModeSharedTerminalClose:Terminal,CareerModeSharedFinalReconciliation:Final});vm.runInContext(source,context);assert.ok(context.CareerModeSharedActiveShowdownAdapter);assert.deepEqual(clone(context.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(s)),clone(v));
});
check("19. Agreement with job 3",()=>{
 const p=P({totalSeasons:5,seasons:[[perfect,R({championsLeague:true})],[R({leaguePosition:2}),R({leaguePosition:3})],[R({leaguePoints:80}),R({leaguePoints:80})]]}),s=snap(p),r=A.rivalryView(s),m=career(s);
 assert.equal(A.classifyCurrentShowdown(s),"active");assert.equal(p.acceptedSeasons,3);
 for(const id of ["daniel","nik"]){for(const key of fields)assert.equal(r.managers[id][key],m.managers[id][key],id+" "+key+" agrees with career");assert.equal(r.score[id],m.managers[id].careerPoints,id+" points agree");}
});
console.log("PASS Shared Active Showdown Adapter contracts ("+cases+"/"+cases+" cases): provider authority, fixed manager roles, private inputs, lifecycle, capped scoring, tiebreaks and pure frozen views.");
