"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),{execFileSync}=require("node:child_process");
const F=require("../support/active-showdown-fixtures.cjs"),{FakeNode}=require("../support/fake-dom.cjs");
const read=p=>process.env.RIVALRY_TEST_REF?execFileSync("git",["show",`${process.env.RIVALRY_TEST_REF}:${p}`],{encoding:"utf8"}):fs.readFileSync(p,"utf8");
const seasons=[[F.result({championsLeague:true,domesticCup:true}),F.result({leaguePosition:1})],[F.result(),F.result({leaguePosition:1,leaguePoints:101,topScorer:true})]];
const p=F.projection({totalSeasons:3,seasons}),closed=F.projection({totalSeasons:3,seasons:[...seasons,[F.result(),F.result()]]});
class Element extends FakeNode{
  constructor(tag){super(tag);this.style={setProperty(){}};this.events={};}
  get innerHTML(){return this.html||"";}set innerHTML(value){this.html=String(value);this.replaceChildren();}
  querySelectorAll(){return [];}querySelector(){return null;}
  addEventListener(k,fn){this.events[k]=fn;}
}
async function mount(snapshot,input){
  const nodes=new Map(),definitions=new Map(),frames=[],errors=[];let providerReads=0;
  const host=new Element("section");host.id="statistics";
  const document={documentElement:{dataset:{}},createElement:tag=>new Element(tag),getElementById:id=>id==="statistics"?host:nodes.get(id)||null,querySelector:()=>nodes.get("rvRows"),querySelectorAll:()=>[]};
  const c=vm.createContext({console,URLSearchParams,document,setTimeout,clearTimeout,CustomEvent:class{},dispatchEvent(){},addEventListener(){},
    CareerModeCareerScreenSeam:require("../../js/careerScreenSeam.js"),CareerModeSharedHistoryConvergence:require("../../js/sharedHistoryConvergence.js"),CareerModeSharedCareerAnalytics:require("../../js/sharedCareerAnalytics.js"),CareerModeSharedTerminalClose:require("../../js/sharedTerminalClose.js"),CareerModeSharedFinalReconciliation:require("../../js/sharedFinalReconciliation.js"),
    CareerModeOnlinePlayerIdentity:{getState:()=>snapshot.identity},CareerModePersistentNikDanielPair:{getState:()=>snapshot.pair},CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:snapshot.identity.accountId})},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>snapshot.history},CareerModeProductionSharedMultiSeasonProgression:{getState:()=>snapshot.multiSeason},CareerModeProductionSharedTerminalClose:{getState:()=>snapshot.terminalClose},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:snapshot.identity.accountId}},firestoreSdk:{getDoc(){}}})},
    // r80 real vs test: a real account (its career-start marker, nothing hidden); career pages show nothing while it is unknown.
    CareerModeCareerStartMarker:{readMarker:async()=>({status:"ready",hiddenRivalryIds:[]}),hiddenRivalryIds:m=>m.hiddenRivalryIds.slice(),epoch:()=>0},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:async()=>{providerReads++;return {careerInput:input,model:c.CareerModeSharedCareerAnalytics.buildCareerModel(input)};}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),invalidate(){},isMounted:()=>true,async show(id){const def=definitions.get(id);await def.prepare();def.mount(def.frame(),host);frames.push(JSON.parse(JSON.stringify(c.RIVALRY_BOOT.fixtures.frames.LIVE)));return true;}},
    loadRuntimeScript:async()=>{},fetch:async url=>({ok:true,json:async()=>url.endsWith("strings.json")?JSON.parse(fs.readFileSync("visual-assets/v10_1/rivalry-statistics/strings.json","utf8")):{} }),reportApplicationError:(_message,error)=>errors.push(error)
  });c.window=c;
  vm.runInContext(read("js/sharedActiveShowdownAdapter.js"),c);
  vm.runInContext(read("js/rivalryLegacyV10Markup.js"),c);
  for(const m of c.CareerModeRivalryLegacyMarkup.rivalryStatistics.matchAll(/<([\w-]+)([^>]*)>/g)){
    const id=/\bid="([^"]+)"/.exec(m[2]);if(!id)continue;const e=new Element(m[1]);e.id=id[1];e.className=/\bclass="([^"]+)"/.exec(m[2])?.[1]||"";nodes.set(e.id,e);
  }
  vm.runInContext(read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js"),c);
  vm.runInContext(read("js/rivalryLegacyV10.js"),c);
  await c.CareerModeRivalryLegacyV10.mount("rivalryStatistics");
  assert.deepEqual(errors,[]);return {c,nodes,frames,providerReads};
}
function verify(h,projection,label){
  const f=h.frames.at(-1);console.log(`${label}: status=${f.status}, points=${JSON.stringify(f.score)}, seasons=${f.seasons?.length}`);
  assert.equal(f.status,"ready",`${label} must leave Loading rivalry statistics`);
  assert.equal(h.nodes.get("rvReadState").hidden,true);
  for(const [manager,role] of [["daniel","playerOne"],["nik","playerTwo"]]){
    const r=projection.managerRecords[role];assert.equal(f.score[manager],r.totalPoints);
    for(const k of ["seasonWins","seasonDraws","seasonLosses"])assert.equal(f.managerRecords[manager][k],r[k]);
    assert.match(h.nodes.get("rvRows").innerHTML,new RegExp(`>${r.totalPoints}</span>`));
  }
  assert.equal(f.seasons.length,projection.acceptedSeasons);assert.match(h.nodes.get("rvHeadBody").innerHTML,/DRAWS/);
  assert.equal(h.nodes.get("rvProgress").textContent,`${projection.acceptedSeasons} / ${projection.totalSeasons} SEASONS COMPLETED`);
}
(async()=>{
  for(const manager of ["daniel","nik"]){
    const snapshot={identity:F.identity(manager),pair:F.pair(p.rivalryId,{managerId:manager}),multiSeason:{...F.multiFor(p),projection:p},history:null};
    const mid=await mount(snapshot,null);verify(mid,p,`mid-Showdown ${manager}`);assert.equal(mid.providerReads,0,"use committed progression without new reads");
    // Close/reload clears the active local Showdown and the live pair. Older career entries must not leak into this rivalry's totals.
    const older=F.projection({seed:"2",totalSeasons:1,seasons:[[F.result({championsLeague:true}),F.result()]]});
    const input={indexStatus:"ready",showdowns:[older,closed].map(projection=>({rivalryId:projection.rivalryId,classification:"completed",projection,final:F.finalFor(projection)}))};
    const after=await mount({identity:F.identity(manager),pair:F.pair(null,{managerId:manager,status:"unpaired",connectionState:null}),multiSeason:null,history:null,terminalClose:null},input);
    verify(after,closed,`after close ${manager}`);assert.equal(after.frames.at(-1).ui.lifecycle,"completed");assert.equal(after.providerReads,1);
  }
  const unreadable={indexStatus:"ready",showdowns:[{rivalryId:closed.rivalryId,classification:"completed",projection:closed,final:F.finalFor(closed)},{rivalryId:"unreadable-latest",classification:"unavailable"}]};
  const missing=await mount({identity:F.identity(),pair:F.pair(null,{status:"unpaired",connectionState:null})},unreadable);
  assert.equal(missing.frames.at(-1).status,"unavailable","an unreadable latest rivalry cannot show an older rivalry's figures");
  assert.equal(missing.frames.at(-1).score,undefined);
  const c=vm.createContext({console,window:{},loadRuntimeScript:async()=>{},isRouteStateValid:()=>false,document:{getElementById:()=>null}});c.window=c;
  vm.runInContext("let currentShowdown=null;",c);vm.runInContext(read("js/statistics.js"),c);
  vm.runInContext("createStatisticsScreen=()=>{};renderRivalryStatistics=()=>{};showScreen=screen=>{globalThis.opened=screen};openRivalryLegacyV10=()=>{};openRivalryStatistics();",c);
  assert.equal(c.isRouteStateValid("statistics"),true);assert.equal(c.isRouteStateValid("seasonEntry"),false);
  assert.equal(c.opened,"statistics","closed rivalry remains script-routable without a currentShowdown");
  const wire=/function v10Wire\(screen,host\)\{[\s\S]*?\n  \}/.exec(read("js/careerScreensV10.js"))[0];
  const button=new Element("button");c.button=button;c.openRivalryStatistics=()=>{c.clicks=(c.clicks||0)+1;};c.root=c;
  c.UNAVAILABLE={status:"unavailable"};c.routeModel={status:"ready",history:{showdowns:[{status:"completed"}]}};c.getters={careerStatistics:()=>c.routeModel};c.v10Identity=()=>F.identity();c.v10Seam=()=>require("../../js/careerScreenSeam.js");
  const source=/function v10Source\(screen\)\{[\s\S]*?\n  \}/.exec(read("js/careerScreensV10.js"))[0];vm.runInContext(source+"\n"+wire,c);
  for(const active of [true,false]){
    vm.runInContext(`currentShowdown=${active?"{}":"null"};v10Wire('careerStatistics',{querySelector:id=>id==='#careerStatisticsRivalryButton'?button:null});`,c);
    assert.equal(button.classList.contains("hidden"),false);button.events.click();
  }
  assert.equal(c.clicks,2);
  c.routeModel={status:"empty",history:{showdowns:[]}};vm.runInContext("v10Wire('careerStatistics',{querySelector:id=>id==='#careerStatisticsRivalryButton'?button:null});",c);assert.equal(button.classList.contains("hidden"),true);
  console.log("PASS Rivalry Statistics load contracts: both managers render points and W/D/L after two committed seasons and after a legal three-season close, with the latest completed rivalry isolated from older history; classic-scope Career Statistics route works.");
})().catch(error=>{console.error(error);process.exitCode=1;});
