"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const Seam=require("../../js/careerScreenSeam.js");
const {buildCareerModel}=require("../../js/sharedCareerAnalytics.js");
const {result,projection,finalFor}=require("../support/career-fixture-helpers.cjs");
const {createFakeDocument}=require("../support/fake-dom.cjs");
const clone=value=>JSON.parse(JSON.stringify(value));
const source=file=>fs.readFileSync(file,"utf8");
const online={status:"ready",registered:true,managerId:"nik"};
const entry=(p,classification="completed")=>({rivalryId:p.rivalryId,classification,projection:p,final:finalFor(p)});
const model=(entries=[],extra={})=>buildCareerModel({indexStatus:"ready",showdowns:entries,...extra});
const perfect=result({leaguePosition:1,leaguePoints:101,leagueGoals:110,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});
const p=projection({totalSeasons:1,seasons:[[result({domesticCup:true}),perfect]]});
const ready=model([entry(p)]);
const sourceByScreen={careerStatistics:"js/statistics.js",trophyRoom:"js/trophyRoom.js",legacy:"js/legacy.js",rivalryStatistics:"js/statistics.js"};
const format=value=>value===null?"-":Number.isInteger(value)?String(value):value.toFixed(1);
const careerFields=[["Career points","careerPoints"],["Seasons played","seasons"],["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"]];
const showdownFields=[["Showdowns completed","completed"],["Showdown wins","wins"],["Showdown draws","draws"],["Showdown losses","losses"]];
const recordFields=[["Best season score","bestSeasonScore"],["Best league points","bestLeaguePoints"],["Best league goals","bestLeagueGoals"],["Best league position","bestLeaguePosition"],["Average season score","averageSeasonScore"],["Average league points","averageLeaguePoints"],["Average league goals","averageLeagueGoals"],["Perfect seasons","perfectSeasons"],["100-point seasons","hundredPointSeasons"],["100-goal seasons","hundredGoalSeasons"],["Top scorer seasons","topScorerSeasons"],["Top assist seasons","topAssistSeasons"],["Performance bonuses","performanceBonuses"],["Awards bonuses","awardsBonuses"]];
const cabinetFields=[["Champions Leagues","championsLeagues"],["League titles","leagueTitles"],["Domestic cups","domesticCups"],["Total trophies","totalTrophies"]];
const rivalryFields=[["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"],...cabinetFields,["Perfect seasons","perfectSeasons"],["Best season score","bestSeasonScore"]];
function comparisonRows(fields,records){return fields.map(([label,key])=>({label,daniel:format(records.daniel[key]),nik:format(records.nik[key])}));}
function frozenTree(value){if(value&&typeof value==="object"){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozenTree);}}
function harness(identityState=online,{late=false,poison=false}={}){
  const doc=createFakeDocument();
  ["careerStatisticsContent","trophyRoomContent","rivalryStatisticsContent","careerStatisticsRivalryButton","careerStatistics","trophyRoom","statistics"].forEach(id=>doc.register(id));
  const legacy=doc.registerSelector("#legacy .legacyBox");doc.registerSelector("main");
  const counts={buildCareerAnalytics:0,buildRivalryAnalytics:0,loadLegacyShowdowns:0,loadSavedShowdown:0,archive:0,importPanel:0,backup:0};
  const local={totals:{showdowns:0,seasons:0,points:0,trophies:0},managers:[],identity:{unresolvedRoleCount:0},records:{}};
  const context={document:doc,currentShowdown:null,console,
    buildCareerAnalytics:()=>{counts.buildCareerAnalytics++;return local;},
    buildRivalryAnalytics:()=>{counts.buildRivalryAnalytics++;return null;},
    loadLegacyShowdowns:()=>{counts.loadLegacyShowdowns++;return [];},
    loadSavedShowdown:()=>{counts.loadSavedShowdown++;return null;},
    archiveLegacyShowdown:()=>{counts.archive++;},
    getCareerAnalyticsRevisionKey:()=>"test",getLegacyStorageRevision:()=>1,
    showScreen:screen=>{context.shown=screen;},
    getCareerModeBackupSummary:()=>{counts.backup++;return null;},
    mountCareerModeImportAnalysisPanel:()=>{counts.importPanel++;},
    CareerModeOnlinePlayerIdentity:{getState:()=>identityState},
    CareerModeCareerScreenSeam:late?undefined:Seam
  };
  context.window=context;vm.createContext(context);
  ["js/statistics.js","js/trophyRoom.js","js/legacy.js"].forEach(file=>vm.runInContext(source(file),context,{filename:file}));
  if(poison)Object.defineProperty(context,"currentShowdown",{get(){throw new Error("online read currentShowdown");}});
  return {context,doc,legacy,counts};
}
let cases=0;
const seamOnly=process.argv.includes("--seam-only");
async function check(name,fn){if(seamOnly&&Number.parseInt(name,10)>=11&&Number.parseInt(name,10)<=16)return;try{await fn();cases++;}catch(error){error.message=name+": "+error.message;throw error;}}
async function run(){
await check("1. Request normalising",()=>{
  for(const arg of [undefined,null,false])assert.deepEqual(Seam.normalizeRenderRequest(arg),{force:false,hasModel:false,model:null});
  for(const arg of [true,{force:true}])assert.deepEqual(Seam.normalizeRenderRequest(arg),{force:true,hasModel:false,model:null});
  assert.deepEqual(Seam.normalizeRenderRequest({model:ready}),{force:false,hasModel:true,model:ready});
  assert.deepEqual(Seam.normalizeRenderRequest({model:null}),{force:false,hasModel:true,model:null});
  assert.deepEqual(Seam.normalizeRenderRequest({model:undefined,force:1}),{force:false,hasModel:true,model:null});
  assert.deepEqual(Seam.normalizeRenderRequest({force:false}),{force:false,hasModel:false,model:null});
  for(const arg of [3,"x",[],new Date()])assert.throws(()=>Seam.normalizeRenderRequest(arg),/CAREER_SCREEN_REQUEST_INVALID/);
  assert.ok(Object.isFrozen(Seam.normalizeRenderRequest({model:ready})));
});
await check("2. Online route",()=>{
  for(const managerId of ["daniel","nik"])for(const status of ["ready","offline"])assert.equal(Seam.isOnlineCareerRoute({registered:true,managerId,status}),true);
  for(const identity of [null,{}, {registered:false,managerId:"nik"},{registered:true,managerId:"alex"},{registered:1,managerId:"daniel"}])assert.equal(Seam.isOnlineCareerRoute(identity),false);
});
await check("3. Source table",()=>{
  for(const identityState of [online,null]){
    // r61: signed in or not, no model means Team V's unavailable state; only Legacy's data tools ask for the local page.
    assert.equal(Seam.selectCareerScreenSource({identityState,model:null}),"unavailable");
    assert.equal(Seam.selectCareerScreenSource({identityState,model:null,dataTools:true}),"local");
    assert.equal(Seam.selectCareerScreenSource({identityState,model:ready,dataTools:true}),"model");
    assert.equal(Seam.selectCareerScreenSource({identityState,model:ready}),"model");
    assert.equal(Seam.selectCareerScreenSource({identityState,model:{}}),"unavailable");
    assert.equal(Seam.selectCareerScreenSource({identityState,model:false}),"unavailable");
    for(const status of Seam.STATUSES)assert.equal(Seam.selectCareerScreenSource({identityState,model:{status}}),"model");
  }
});
await check("4. Empty only when empty",()=>{
  for(const screen of Seam.SCREENS){
    const empty=Seam.careerScreenView(screen,model());
    assert.equal(empty.status,"empty");assert.equal(empty.message,Seam.TEXT.empty[screen]);assert.deepEqual(empty.sections,[]);
    assert.ok(source(sourceByScreen[screen]).includes(Seam.TEXT.empty[screen]));
    for(const m of [null,ready,{...ready,status:"loading"},{...ready,status:"unavailable"},{...ready,status:"partial"}])assert.notEqual(Seam.careerScreenView(screen,m).message,Seam.TEXT.empty[screen]);
    assert.equal(Seam.careerScreenView(screen,{status:"loading"}).message,"Loading career history.");
  }
});
await check("5. Partial and interim",()=>{
  const partial=model([entry(p),{rivalryId:"pair_"+"2".repeat(64),classification:"unavailable"}]);
  const interim=model([entry(p)],{currentShowdownOnly:true});
  for(const screen of ["careerStatistics","trophyRoom","legacy"]){
    const view=Seam.careerScreenView(screen,partial);
    assert.equal(view.message,"Showing 1 of 2 Showdowns. Some Showdowns could not be read, so these are not complete career totals.");
    assert.ok(view.sections.length);
  }
  for(const screen of Seam.SCREENS){
    assert.equal(Seam.careerScreenView(screen,interim).interimLabel,"Current Showdown only. Career history is not yet available.");
    assert.equal(Seam.careerScreenView(screen,{...interim,status:"unavailable"}).interimLabel,null);
  }
});
await check("6. Left and right with all row mappings",()=>{
  assert.ok(ready.managers.nik.careerPoints>ready.managers.daniel.careerPoints);
  const career=Seam.careerScreenView("careerStatistics",ready);
  assert.deepEqual(career.sections.map(s=>s.heading),["CAREER TABLE","SEASON RECORDS"]);
  assert.deepEqual(career.sections[0].rows,[...comparisonRows(careerFields,ready.managers),...comparisonRows(showdownFields,{daniel:ready.managers.daniel.showdowns,nik:ready.managers.nik.showdowns}),{label:"Biggest Showdown win",value:"Nik by 10"}]);
  assert.deepEqual(career.sections[1].rows,comparisonRows(recordFields,ready.managers));
  const trophy=Seam.careerScreenView("trophyRoom",ready);
  assert.deepEqual(trophy.sections.map(s=>s.heading),["MANAGER CABINETS","CAREER TABLE","ALL-TIME RECORDS"]);
  assert.deepEqual(trophy.sections[0].rows,comparisonRows(cabinetFields,ready.trophyRoom.cabinet));
  assert.deepEqual(trophy.sections[1].rows,[{label:"1. Nik",value:"11 points, 1 season wins"},{label:"2. Daniel",value:"1 points, 0 season wins"}]);
  assert.deepEqual(trophy.sections[2].rows,ready.trophyRoom.records.map(r=>({label:r.label,value:r.value===null?"-":(r.manager==="daniel"?"Daniel":r.manager==="nik"?"Nik":"Shared")+" · "+format(r.value)})));
  const rivalry=Seam.careerScreenView("rivalryStatistics",ready);
  assert.deepEqual(rivalry.sections.map(s=>s.heading),["HEAD TO HEAD","SEASONS"]);
  assert.deepEqual(rivalry.sections[0].rows,[{label:"Showdown points",daniel:"1",nik:"11"},...comparisonRows(rivalryFields,ready.managers)]);
  assert.deepEqual(rivalry.sections[1].rows,[{label:"Season 1",daniel:"1",nik:"11"}]);
  const decimal=clone(ready);decimal.managers.daniel.averageLeaguePoints=60.25;decimal.managers.nik.bestLeagueGoals=null;
  const records=Seam.careerScreenView("careerStatistics",decimal).sections[1].rows;
  assert.equal(records.find(r=>r.label==="Average league points").daniel,"60.3");assert.equal(records.find(r=>r.label==="Best league goals").nik,"-");
  const tied=model([entry(projection({totalSeasons:1,seasons:[[result(),result()]]}))]);
  const table=Seam.careerScreenView("trophyRoom",tied).sections[1].rows;
  assert.deepEqual(table.map(r=>r.label),["1. Daniel (level)","2. Nik (level)"]);
  assert.equal(Seam.careerScreenView("careerStatistics",tied).sections[0].rows.at(-1).value,"-");
  const daniel=model([entry(projection({totalSeasons:1,seasons:[[perfect,result()]]}))]);
  assert.equal(Seam.careerScreenView("careerStatistics",daniel).sections[0].rows.at(-1).value,"Daniel by 11");
  for(const screen of Seam.SCREENS){
    const view=Seam.careerScreenView(screen,ready),doc=createFakeDocument(),paint=Seam.paintCareerScreenView(doc,view),root=paint.firstChild;
    assert.equal(paint.isFragment,true);assert.equal(root.className,"careerScreenView");
    assert.equal(root.getAttribute("data-career-screen"),screen);assert.equal(root.getAttribute("data-career-status"),"ready");
    const headers=paint.findByClass("careerScreenNames");
    for(const header of headers)assert.deepEqual(header.children.map(n=>n.textContent),["DANIEL","","NIK"]);
    for(const row of paint.findByClass("comparisonRow").filter(n=>!n.classList.contains("careerScreenNames")))assert.deepEqual(row.children.map(n=>n.tagName),["STRONG","SPAN","STRONG"]);
    assert.equal(headers.length,view.sections.filter(s=>s.rows.some(r=>"daniel" in r)).length);
  }
});
await check("7. Abandoned and unavailable are status only",()=>{
  for(const status of ["abandoned","unavailable"]){
    const forged=clone(ready);forged.history.showdowns[0].status=status;
    assert.deepEqual(Seam.careerScreenView("legacy",forged).sections[0].rows,[{label:"SHOWDOWN 1",value:status==="abandoned"?"Abandoned":"Unavailable"}]);
  }
  assert.deepEqual(Seam.careerScreenView("legacy",ready).sections[0].rows,[{label:"SHOWDOWN 1",value:"Completed · Daniel 1 - Nik 11 · Nik won"}]);
  for(const [status,text] of [["in-progress","In progress"],["completion-pending","Final result, completion pending"]]){
    const changed=clone(ready);Object.assign(changed.history.showdowns[0],{status,winner:null});
    assert.equal(Seam.careerScreenView("legacy",changed).sections[0].rows[0].value,text+" · Daniel 1 - Nik 11");
  }
});
await check("8. Rivalry needs one Showdown",()=>{
  const multi=model([entry(p),entry(projection({seed:"2",totalSeasons:1,seasons:[[result(),perfect]]}))]);
  for(const m of [multi,{...multi,status:"partial"},{...ready,history:{showdowns:[]}}]){
    const view=Seam.careerScreenView("rivalryStatistics",m);assert.equal(view.status,"unavailable");assert.deepEqual(view.sections,[]);assert.equal(view.message,Seam.TEXT.unavailable);
  }
});
await check("9. No ids or private inputs on screen",()=>{
  const contaminated=clone(ready);contaminated.guesses="session_private";contaminated.signings="acct_secret";
  for(const screen of Seam.SCREENS){
    const paint=Seam.paintCareerScreenView(createFakeDocument(),Seam.careerScreenView(screen,contaminated));
    for(const token of ["pair_","acct_","profile_","save_","session_"])assert.equal(paint.textContent.includes(token),false,screen+" "+token);
  }
});
await check("10. Malformed models",()=>{
  for(const screen of Seam.SCREENS)for(const m of [{},{status:"weird"},null]){
    const view=Seam.careerScreenView(screen,m);assert.equal(view.status,"unavailable");assert.equal(view.message,Seam.TEXT.unavailable);assert.equal(view.interimLabel,null);assert.deepEqual(view.sections,[]);
  }
  assert.throws(()=>Seam.careerScreenView("unknown",ready),/CAREER_SCREEN_UNKNOWN/);
});
await check("11. Online or signed out never runs the local path",()=>{
  for(const identity of [online,{...online,managerId:"daniel"},{...online,status:"offline"},null,{status:"signed-out",registered:false}]){
    const h=harness(identity,{poison:true});
    for(const method of ["renderCareerStatistics","renderTrophyRoom","renderLegacy","renderRivalryStatistics","openCareerStatistics","openTrophyRoom"])h.context[method]();
    assert.ok(Object.values(h.counts).every(n=>n===0),JSON.stringify(h.counts));
    for(const id of ["careerStatisticsContent","trophyRoomContent","rivalryStatisticsContent"])assert.equal(h.doc.getElementById(id).textContent,Seam.TEXT.unavailable);
    assert.equal(h.legacy.textContent,Seam.TEXT.unavailable);assert.equal(h.legacy.findByClass("legacyDataControls").length,0);
  }
});
await check("12. Legacy data tools keep the local page",()=>{
  const h=harness(null);h.context.careerModeLegacyDataTools=true;h.context.renderCareerStatistics();h.context.renderTrophyRoom();h.context.renderLegacy();
  assert.equal(h.counts.buildCareerAnalytics,0);assert.equal(h.counts.loadLegacyShowdowns,1);assert.equal(h.counts.loadSavedShowdown,1);assert.equal(h.counts.importPanel,1);
  assert.equal(h.legacy.findByClass("legacyDataControls").length,1);
});
await check("13. Model given and remembered",()=>{
  const h=harness();
  for(const [open,render,container,heading] of [["openCareerStatistics","renderCareerStatistics",h.doc.getElementById("careerStatisticsContent"),"CAREER TABLE"],["openTrophyRoom","renderTrophyRoom",h.doc.getElementById("trophyRoomContent"),"MANAGER CABINETS"],["renderLegacy","renderLegacy",h.legacy,"SHOWDOWNS"],["openRivalryStatistics","renderRivalryStatistics",h.doc.getElementById("rivalryStatisticsContent"),"HEAD TO HEAD"]]){
    h.context[open]({model:ready});assert.ok(container.textContent.includes(heading));const text=container.textContent;
    h.context[render]();assert.equal(container.textContent,text);
    h.context[render]({model:null});assert.equal(container.textContent,Seam.TEXT.unavailable);
    h.context[render]({model:{}});assert.equal(container.textContent,Seam.TEXT.unavailable);
  }
  assert.ok(Object.values(h.counts).every(n=>n===0));
});
await check("14. Open functions forward",()=>{
  const h=harness();h.context.openRivalryStatistics({model:ready});
  assert.ok(h.doc.getElementById("rivalryStatisticsContent").textContent.includes("HEAD TO HEAD"));assert.equal(h.context.shown,"statistics");
  h.doc.getElementById("rivalryStatisticsContent").textContent="sentinel";h.context.shown=null;h.context.openRivalryStatistics();
  assert.equal(h.doc.getElementById("rivalryStatisticsContent").textContent,"sentinel");assert.equal(h.context.shown,null);
});
await check("15. Seam loaded late",async()=>{
  for(const [render,containerId] of [["renderCareerStatistics","careerStatisticsContent"],["renderTrophyRoom","trophyRoomContent"],["renderRivalryStatistics","rivalryStatisticsContent"],["renderLegacy",null]]){
    const h=harness(online,{late:true}),calls=[];
    h.context.loadRuntimeScript=(...args)=>{calls.push(args);return Promise.resolve().then(()=>{h.context.CareerModeCareerScreenSeam=Seam;});};
    const container=containerId?h.doc.getElementById(containerId):h.legacy;
    h.context[render]();assert.equal(container.textContent,"");assert.equal(calls.length,1);
    assert.equal(calls[0][0],"career-screen-seam");assert.equal(calls[0][1],"js/careerScreenSeam.js");assert.equal(typeof calls[0][2],"function");
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(calls[0][2](),true);assert.equal(container.textContent,Seam.TEXT.unavailable);assert.ok(Object.values(h.counts).every(n=>n===0));
  }
});
await check("16. Internal containment retained; History and Statistics reachable (job 28)",()=>{
  const identity=source("js/onlinePlayerIdentity.js");
  assert.ok(identity.includes("display:none!important"));
  for(const id of ["#legacyButton", "#rivalryStatisticsButton"])assert.equal(identity.includes(id),false,id+" is reachable online");
  // JOB-28 completes the remaining Statistics/History containment removals.
  assert.equal(identity.includes("#careerStatisticsButton"),false,"Career Statistics is reachable online");
  assert.equal(source("index.html").includes("trophyRoomButton"),false);
  assert.ok(source("service-worker.js").includes('    "js/analytics.js",\n    "js/careerScreenSeam.js",'));
});
await check("17. Pure and frozen",()=>{
  frozenTree(Seam);assert.equal(Seam.contractVersion,1);
  assert.deepEqual(Seam.SCREENS,["careerStatistics","trophyRoom","legacy","rivalryStatistics"]);assert.deepEqual(Seam.STATUSES,["loading","empty","unavailable","partial","ready"]);
  const before=JSON.stringify(ready);
  for(const screen of Seam.SCREENS){
    const view=Seam.careerScreenView(screen,ready);frozenTree(view);assert.deepEqual(view,Seam.careerScreenView(screen,ready));
  }
  assert.equal(JSON.stringify(ready),before);
  for(const forbidden of ["localStorage","sessionStorage","indexedDB","window","document","currentShowdown","Date.now","Math.random"])assert.equal(source("js/careerScreenSeam.js").includes(forbidden),false,forbidden);
  const browser={};vm.createContext(browser);vm.runInContext(source("js/careerScreenSeam.js"),browser);
  for(const screen of Seam.SCREENS)assert.deepEqual(clone(browser.CareerModeCareerScreenSeam.careerScreenView(screen,ready)),clone(Seam.careerScreenView(screen,ready)));
});
assert.equal(cases,seamOnly?11:17);
console.log(seamOnly?"PASS Career screen seam pure contracts (11/11 cases: 1-10 and 17).":"PASS Career screen seam contracts (17/17 cases): frozen pure views, exact row mapping, privacy, no online local fallback and deferred renderer loading.");
}
run().catch(error=>{console.error(error);process.exitCode=1;});
