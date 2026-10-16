"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const {projection,result,finalFor}=require(path.join(ROOT,"tests/support/career-fixture-helpers.cjs"));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const history=p=>({authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:p.rivalryId,projection:p});
function fixture(totalSeasons){
  const seasons=Array.from({length:totalSeasons},(_,i)=>[result({leaguePosition:1,domesticCup:true,championsLeague:i===totalSeasons-1}),result({leaguePosition:2})]);
  const p=projection({totalSeasons,seasons}),last=p.seasonHistory.at(-1),final=finalFor(p);
  const reconciliation={phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,rivalryId:p.rivalryId,acceptedRevisionKey:p.acceptedRevisionKey,acceptedSeasons:totalSeasons,totalSeasons,completedSeason:totalSeasons,winner:final.winner,managerTotals:final.totals};
  const terminal={phase:"CLOSED",terminal:true,rivalryId:p.rivalryId,terminalWitness:{...reconciliation}};
  const old=projection({totalSeasons,seasons:seasons.slice(0,-1)});
  return {p,last,reconciliation,terminal,old};
}
// Run the production event listeners and registered frame source, without exposing private helpers.
async function source(f,{initialHistory=null,initialTerminal=null,initialFinal=null,readCompleted}={}){
  const defs={},listeners=new Map(),tasks=[],frames=[];
  const snapshots={history:initialHistory,terminal:initialTerminal,final:initialFinal};
  let reads=0;
  const env={console,document:{addEventListener(){}},getActiveScreenName:()=>"seasonEntry",
    setTimeout:fn=>tasks.push(fn),addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list);},
    CareerModeSharedHistoryConvergence:History,
    CareerModeProductionSharedHistoryConvergence:{getState:()=>snapshots.history},
    CareerModeProductionSharedFinalReconciliation:{getState:()=>snapshots.final},
    CareerModeProductionSharedTerminalClose:{getState:()=>snapshots.terminal},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"daniel"})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"daniel"}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkCompletedShowdownReader:{async readCompletedShowdown(options){reads++;assert.equal(options.rivalryId,f.p.rivalryId);return readCompleted();}},
    CareerModeV10Screens:{install(){return this;},register(id,def){defs[id]=def;},setNavRoute(){},invalidate(){},async show(id){if(defs[id])frames.push(defs[id].frame().final);return true;}}
  };
  vm.runInNewContext(read("js/seasonFinalV10.js"),env,{filename:"js/seasonFinalV10.js"});
  await env.CareerModeSeasonFinalV10.install();
  const flush=()=>{let count=0;while(tasks.length){assert.ok(++count<50,"event work must remain bounded");tasks.shift()();}};
  flush();
  return {snapshots,frames,flush,frame:()=>defs.seasonEntry.frame().final,reads:()=>reads,
    emit(type){for(const fn of listeners.get(type)||[])fn({type});}};
}
// Render the real frozen Champion script to check player-facing cell text as well as the frame.
function cells(frame){
  const nodes=new Map(),el=()=>({textContent:"",dataset:{},classList:{add(){},remove(){},contains:()=>false},style:{},setAttribute(){},removeAttribute(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},getBoundingClientRect:()=>({})});
  const document={getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},dispatchEvent(){}};
  const window={document,FINAL_WINNER_APP:true,FINAL_WINNER_ROOT:el(),FINAL_WINNER_FIXTURES:{strings:JSON.parse(read("visual-assets/v10_1/final-winner/app-strings.json")).strings,frames:{LIVE:frame}},setTimeout(){}};
  window.window=window;
  vm.runInNewContext(read("visual-assets/v10_1/final-winner/final-winner.js"),{window,document,location:{search:""},URLSearchParams,console,CustomEvent:function(){},fetch:()=>new Promise(()=>{})});
  window.ShowdownFinalWinnerBoot();
  return id=>document.getElementById(id).textContent;
}
function ready(frame,f){
  assert.equal(frame.status,"ready");
  assert.deepEqual(JSON.parse(JSON.stringify(frame.lastSeason)),{season:f.p.totalSeasons,daniel:f.last.playerOne.scoring.total,nik:f.last.playerTwo.scoring.total,winner:"daniel"});
  const text=cells(frame);
  assert.equal(text("panelLastSeasonLabel"),`FINAL SEASON ${f.p.totalSeasons}`);
  assert.equal(text("panelLastSeasonDaniel"),String(f.last.playerOne.scoring.total));
  assert.equal(text("panelLastSeasonNik"),String(f.last.playerTwo.scoring.total));
  assert.equal(frame.trophies.daniel.total,f.p.managerRecords.playerOne.totalTrophies);
  assert.equal(frame.trophies.nik.total,f.p.managerRecords.playerTwo.totalTrophies);
  for(const [name,role] of [["Daniel","playerOne"],["Nik","playerTwo"]])for(const [cell,field] of [["Continental","championsLeagues"],["League","leagueTitles"],["Cup","domesticCups"],["Trophies","totalTrophies"]])assert.equal(text(`panel${name}${cell}`),String(f.p.managerRecords[role][field]));
}
async function liveHistoryArrives(f){
  const s=await source(f,{initialFinal:f.reconciliation,initialHistory:history(f.old),readCompleted:()=>{throw Error("open Showdown must not read completed history");}});
  assert.equal(s.frame().status,"partial");
  assert.equal(cells(s.frame())("panelLastSeasonDaniel"),"—");
  const before=s.frames.length;
  s.snapshots.history=history(f.p);s.emit("career-mode-shared-history-convergence-state-change");s.flush();
  assert.ok(s.frames.length>before,"late History event redraws the Champion frame");ready(s.frames.at(-1),f);assert.equal(s.reads(),0);
  s.snapshots.final=null;s.snapshots.history=null;s.snapshots.terminal=f.terminal;
  s.emit("career-mode-shared-terminal-close-state-change");s.flush();
  ready(s.frames.at(-1),f);await tick();assert.equal(s.reads(),0,"complete retained history needs no extra read");
}
async function closedBeforeFinalHistory(f,retain){
  let release;const pending=new Promise(resolve=>{release=resolve;});
  const s=await source(f,{initialHistory:history(f.old),initialTerminal:retain?null:f.terminal,readCompleted:()=>pending});
  if(retain){s.snapshots.history=null;s.snapshots.terminal=f.terminal;s.emit("career-mode-shared-terminal-close-state-change");s.flush();}
  assert.equal(s.frame().status,"partial","closed winner stays visible while final data is missing");
  for(let i=0;i<5;i++)s.frame();
  await tick();
  assert.equal(s.reads(),1,`${retain?"retained":"live"} previous-season history must not suppress the completed read`);
  const before=s.frames.length;
  release({status:"completed",rivalryId:f.p.rivalryId,projection:f.p});await tick();s.flush();
  assert.ok(s.frames.length>before,"completed-data promise redraws on arrival");ready(s.frames.at(-1),f);
  for(let i=0;i<5;i++){s.frame();s.emit("career-mode-shared-terminal-close-state-change");s.flush();}
  await tick();assert.equal(s.reads(),1,"no poll or repeated provider read");
}
async function reconciliationLateData(f){
  const {FakeNode}=require(path.join(ROOT,"tests/support/fake-dom.cjs"));
  const body=new FakeNode("body"),review=new FakeNode("section");review.id="seasonReviewPanel";body.appendChild(review);
  const document={visibilityState:"visible",getElementById:id=>body.all().find(node=>node.id===id)||null,createElement:tag=>new FakeNode(tag),addEventListener(){}};
  const slot=f.p.managerSlots[0],local={phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:slot.slotId}};
  const multi={ok:true,authoritative:true,phase:"SHOWDOWN_COMPLETE",rivalryId:f.p.rivalryId,state:require(path.join(ROOT,"js/sharedMultiSeasonProgression.js")).createProtocol().derive({rivalryId:f.p.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:f.p.totalSeasons,leagueId:f.p.leagueId,clubs:{playerOne:"club_a",playerTwo:"club_b"}},history:f.p})};
  const tasks=[],listeners=new Map();let release,calls=0,late=false;
  const env={console,document,setTimeout:fn=>tasks.push(fn),setInterval(){},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},addEventListener:(type,fn)=>listeners.set(type,fn),dispatchEvent(){},
    currentShowdown:{identity:{saveId:slot.saveId,managerProfileIds:{playerOne:slot.profileId,playerTwo:f.p.managerSlots[1].profileId}},managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId:f.p.rivalryId}},
    CareerModeSaveLibraryRuntime:{isReady:()=>true},CareerModeSharedHistoryConvergence:History,
    CareerModeProductionSharedMultiSeasonProgression:{refresh(){calls++;return calls===1?new Promise(resolve=>{release=()=>resolve({rivalryId:f.p.rivalryId,phase:"SEASON_ACCEPTED"});}):Promise.resolve(multi);},getState:()=>multi},
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>history(late?f.p:f.old),getState:()=>history(late?f.p:f.old)},
    CareerModeProductionSharedLocalReconciliation:{refresh:()=>local,getState:()=>local}
  };
  vm.createContext(env);
  for(const file of ["js/sharedFinalReconciliation.js","js/productionSharedFinalReconciliation.js"])vm.runInContext(read(file),env,{filename:file});
  const api=env.CareerModeProductionSharedFinalReconciliation;api.install();
  while(tasks.length)tasks.shift()();await tick();
  const first=api.refresh();await tick();assert.equal(typeof release,"function");
  late=true;listeners.get("career-mode-shared-history-convergence-state-change")({type:"career-mode-shared-history-convergence-state-change",detail:{phase:"HISTORY_CONVERGED",throughSeason:f.p.totalSeasons,acceptedRevisionKey:f.p.acceptedRevisionKey}});
  release();await first;
  assert.equal(tasks.length,1,"only the in-flight data event may queue this follow-up wake");
  while(tasks.length)tasks.shift()();await tick();
  assert.equal(api.getState().phase,"FINAL_SEASON_RECONCILED","a data-arrival event during refresh must be replayed after the old refresh finishes");
  assert.equal(document.getElementById("sharedFinalReconciliationPanel").classList.contains("hidden"),false);
  assert.equal(document.getElementById("sharedFinalReconciliationHeading").textContent,"SHOWDOWN FINAL RESULT");
  assert.equal(document.getElementById("sharedFinalReconciliationWinner").textContent,`Daniel ${f.reconciliation.managerTotals.playerOne} · Nik ${f.reconciliation.managerTotals.playerTwo} · Daniel WINS`);
  console.log("PASS Final Reconciliation late-data event during an in-flight refresh populates the live panel");
}
async function rejectedCompletedData(f){
  const tampered=JSON.parse(JSON.stringify(f.p));tampered.managerRecords.playerOne.totalTrophies++;
  for(const [label,readCompleted] of [["tampered projection",()=>({status:"completed",rivalryId:f.p.rivalryId,projection:tampered})],["other rivalry",()=>({status:"completed",rivalryId:"pair_"+"2".repeat(64),projection:f.p})],["unavailable",()=>({status:"unavailable"})]]){
    const s=await source(f,{initialTerminal:f.terminal,readCompleted});await tick();s.flush();
    assert.equal(s.frame().status,"partial",label);assert.equal(s.frame().lastSeason,undefined,label);assert.equal(cells(s.frame())("panelLastSeasonDaniel"),"—",label);
    s.emit("career-mode-shared-terminal-close-state-change");s.flush();await tick();assert.equal(s.reads(),1,`${label}: no retry or poll`);
  }
  console.log("PASS completed-reader failures, tampered projections and other rivalries leave cells unavailable without repeated reads");
}
(async()=>{
  await reconciliationLateData(fixture(3));
  await rejectedCompletedData(fixture(3));
  for(const n of [3,5]){const f=fixture(n);await liveHistoryArrives(f);console.log(`PASS ${n}-season late live History event and complete retained History`);await closedBeforeFinalHistory(f,false);await closedBeforeFinalHistory(f,true);console.log(`PASS ${n}-season close before final History: live/retained stale snapshots, one read, arrival redraw and populated cells`);}
  console.log("PASS final-cells-late-data-contracts");
})().catch(error=>{console.error(error);process.exitCode=1;});
