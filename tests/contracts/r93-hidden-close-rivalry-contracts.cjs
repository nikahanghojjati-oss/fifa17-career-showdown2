#!/usr/bin/env node
"use strict";
// r93 R93-09 (U1, HUNT_AREAS_3_5, P2, live in 2.5.x): a phone hidden (screen off, other app or tab) when the FINAL season is
// locked keeps its season view one season behind: js/productionSharedMultiSeasonProgression.js does not refresh while hidden,
// and once the Showdown is closed it cannot refresh at all. The close witness says N seasons, the stale view N-1, so
// js/sharedActiveShowdownAdapter.js threw CLOSE_AUTHORITY_MISMATCH, classified "unavailable", and Rivalry Statistics said
// "Rivalry statistics are unavailable right now." with DANIEL CLUB / NIK CLUB until the app was reopened.
// Checks:
//   HC1 the real case, built from the real protocols (History, Multi Season, Final, Terminal Close): 3 seasons, Golden 10
//       seasons, and a sacking after season 2 of 3. The hidden phone's views are exactly what an app reopen gives (the
//       stale view and projection are dropped, completed from the witness, finished career read for the rest)
//   HC2 every integrity check stays: a projection level with or AHEAD of the witness that differs, another Showdown, another
//       length, a total above the witness, a projection that already ended (sacked) before the witness's season, a stale view
//       that disagrees with its projection, an invalid History cache or a tampered witness all still fail closed ("unavailable")
//   HC3 the real Rivalry Statistics page (js/rivalryLegacyV10.js in a fake DOM) on the hidden phone: one finished-career read,
//       the final numbers, lifecycle completed; before the fix it showed "unavailable" and read nothing
//   HC4 no new read during play: a live (not closed) Showdown with the same stale view is untouched, and the fix adds no
//       provider call, poll or listener to the adapter; the page keeps its own retry when shown again (A-08)
// RIVALRY_TEST_REF=<git ref> runs HC1-HC3 against another build's adapter and page (used to prove the old pin fails).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),{execFileSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const REF=process.env.RIVALRY_TEST_REF||null;
const read=p=>REF?execFileSync("git",["show",`${REF}:${p}`],{cwd:ROOT,encoding:"utf8"}):fs.readFileSync(path.join(ROOT,p),"utf8");
const F=require("../support/active-showdown-fixtures.cjs"),{FakeNode}=require("../support/fake-dom.cjs");
const History=require("../../js/sharedHistoryConvergence.js");
const Multi=require("../../js/sharedMultiSeasonProgression.js").createProtocol();
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
function loadAdapter(){
  if(!REF)return require("../../js/sharedActiveShowdownAdapter.js");
  const m={exports:{}};vm.runInNewContext(read("js/sharedActiveShowdownAdapter.js"),{module:m,require:name=>require(path.join(ROOT,"js",path.basename(name))),globalThis:{}});return m.exports;
}
const Adapter=loadAdapter();
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const r=F.result,SESSION=F.SESSION;
const setupOf=p=>({phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:p.totalSeasons,leagueId:p.leagueId,clubs:{playerOne:"club_a",playerTwo:"club_b"}});
const derive=p=>Multi.derive({rivalryId:p.rivalryId,setup:setupOf(p),history:p});
// CareerModeProductionSharedMultiSeasonProgression.getState(): the verified state and the projection it read.
const progressOf=p=>{const state=derive(p);return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",phase:state.phase,revision:state.revision,rivalryId:p.rivalryId,managerRole:"playerTwo",state,projection:p,dashboard:null};};
const slot=role=>({saveId:"save_"+(role==="playerOne"?"a":"b").repeat(24),profileId:"profile_"+(role==="playerOne"?"a":"b").repeat(24),managerRole:role});
function finalOf(p){const state=derive(p);return Final.reconcile({sharedActive:true,multiSeason:{ok:true,authoritative:true,phase:state.phase,rivalryId:p.rivalryId,state},history:{ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:p.rivalryId,projection:p},localReconciliation:{phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:slot("playerOne")}});}
// CareerModeProductionSharedTerminalClose.getState() after the other phone closed the Showdown.
function closeOf(p,witness=Terminal.prepare(finalOf(p),{sessionId:SESSION})){return {phase:"CLOSED",rivalryId:p.rivalryId,sessionId:SESSION,rivalryRevision:9,sessionRevision:4,terminal:true,terminalWitness:JSON.parse(JSON.stringify(witness)),replayed:false,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
const viewer="nik";
// The hidden phone: the pair is closed, the progression and History screen cache stopped one season short, the close is CLOSED.
function hidden(stale,full,{history=true,multi=progressOf(stale),close=closeOf(full)}={}){return {identity:F.identity(viewer),pair:F.pair(full.rivalryId,{managerId:viewer,status:"waiting",connectionState:"closed"}),multiSeason:multi,history:history?F.history(stale):null,finalReconciliation:null,terminalClose:close};}
// The same phone after an app reopen: no season view, no History cache, only the close.
function reopened(full){return {identity:F.identity(viewer),pair:F.pair(full.rivalryId,{managerId:viewer,status:"waiting",connectionState:"closed"}),multiSeason:null,history:null,finalReconciliation:null,terminalClose:closeOf(full)};}
const plain=v=>JSON.parse(JSON.stringify(v));

const three=[[r({championsLeague:true,domesticCup:true}),r({leaguePosition:1})],[r(),r({leaguePosition:1,leaguePoints:101,topScorer:true})],[r({leaguePosition:2}),r({europaLeague:true})]];
const golden=Array.from({length:10},(_,i)=>[r(i===0?{domesticCup:true}:{}),r({leaguePosition:1,leaguePoints:101,championsLeague:true,domesticCup:true,topScorer:true,primePack:4})]);
const games=[
  {label:"3 seasons",seed:"3",totalSeasons:3,seasons:three},
  {label:"Golden 10 seasons (Nik 150)",seed:"a",totalSeasons:10,seasons:golden},
  {label:"sacked after season 2 of 3",seed:"5",totalSeasons:3,seasons:[three[0],[r(),r({leaguePosition:1,sacked:true})]]},
];
// The hidden phone's projection is the same Showdown one season short; the witness is built from the full one.
for(const g of games){g.full=F.projection(g);g.stale=F.projection({...g,seasons:g.seasons.slice(0,-1)});}
// Sanity of the fixtures themselves (not of the fix): real verified projections, witnesses and the failing pre-condition.
for(const g of games){
  assert.equal(History.verifyProjection(g.stale).acceptedSeasons,g.full.acceptedSeasons-1,g.label);
  const w=Terminal.verifyIntent(closeOf(g.full).terminalWitness);assert.equal(w.completedSeason,g.full.acceptedSeasons,g.label);
}
assert.equal(games[1].full.managerRecords.playerTwo.totalPoints,150,"the Golden fixture is 150 points");
assert.equal(Terminal.verifyIntent(closeOf(games[2].full).terminalWitness).endedBy,"sacked","the sacked fixture ends after season 2 of 3");

// HC1
for(const g of games){
  for(const history of [true,false]){
    const s=hidden(g.stale,g.full,{history}),views=Adapter.buildActiveShowdownViews(s),reopen=Adapter.buildActiveShowdownViews(reopened(g.full));
    assert.equal(views.classification,"completed",`${g.label}${history?"":" (no History cache)"}: the hidden phone is completed, not unavailable`);
    assert.deepEqual(plain(views),plain(reopen),`${g.label}: the hidden phone sees exactly what an app reopen shows`);
    assert.equal(views.finalWinner.state,"completed");
    assert.deepEqual(views.finalWinner.totals,{daniel:g.full.managerRecords.playerOne.totalPoints,nik:g.full.managerRecords.playerTwo.totalPoints},`${g.label}: final totals come from the witness`);
    assert.deepEqual(plain(views.careerInput),{indexStatus:"ready",showdowns:[{rivalryId:g.full.rivalryId,classification:"unavailable",projection:null,final:null}],currentShowdownOnly:true},`${g.label}: the finished career read supplies the Showdown`);
  }
  // A phone that was not hidden (view and History at N) is unchanged: completed with its live projection.
  const awake={...hidden(g.full,g.full),multiSeason:progressOf(g.full),history:F.history(g.full)},live=Adapter.buildActiveShowdownViews(awake);
  assert.equal(live.classification,"completed");assert.equal(live.rivalry.status,"ready",`${g.label}: the awake phone keeps its live Rivalry Statistics`);
  assert.equal(live.rivalry.score.nik,g.full.managerRecords.playerTwo.totalPoints);
}
ok("HC1","3 seasons, Golden 10 seasons and a sacking after season 2 of 3: the phone hidden at the final lock classifies completed and shows exactly what an app reopen shows (with or without its History cache); the awake phone keeps its live view");

// HC2
{
  const g=games[0],{full,stale}=g,cls=s=>Adapter.classifyCurrentShowdown(s);
  // Level with the witness but different (a projection of the same length with other points).
  const other=F.projection({seed:"3",totalSeasons:3,seasons:[three[0],three[1],[r({leaguePosition:1,championsLeague:true}),r()]]});
  assert.equal(cls(hidden(other,full)),"unavailable","a level projection that differs from the witness fails closed");
  // AHEAD of the witness: the witness says season 2 (sacked), the projection holds 3 seasons.
  const sackedFull=games[2].full,ahead=F.projection({seed:"5",totalSeasons:3,seasons:[three[0],[r(),r({leaguePosition:1})],three[2]]});
  assert.equal(cls(hidden(ahead,sackedFull)),"unavailable","a projection ahead of the witness fails closed");
  // Another length (a 5-season projection of the same rivalry against a 3-season witness).
  const longer=F.projection({seed:"3",totalSeasons:5,seasons:three.slice(0,2)});
  assert.equal(cls(hidden(longer,full)),"unavailable","another length fails closed");
  // A stale total above the witness (points never go down).
  const rich=F.projection({seed:"3",totalSeasons:3,seasons:[[r({championsLeague:true,domesticCup:true,leaguePosition:1,topScorer:true,primePack:4}),r({leaguePosition:1,championsLeague:true,domesticCup:true,topScorer:true,primePack:4})],[r({championsLeague:true,leaguePosition:1,domesticCup:true,topAssist:true,primePack:4}),r({leaguePosition:1,championsLeague:true,domesticCup:true,topScorer:true,primePack:4})]]});
  assert.ok(rich.managerRecords.playerOne.totalPoints>Terminal.verifyIntent(closeOf(full).terminalWitness).managerTotals.playerOne);
  assert.equal(cls(hidden(rich,full)),"unavailable","a stale total above the witness fails closed");
  // A projection that already ended (sacked in season 1) cannot be behind a witness of season 3.
  const ended=F.projection({seed:"3",totalSeasons:3,seasons:[[r(),r({sacked:true})]]});
  assert.equal(cls(hidden(ended,full)),"unavailable","a projection that already ended fails closed");
  // The stale season view disagrees with the projection it carries (no History cache).
  const torn=progressOf(stale);torn.projection=F.projection({seed:"3",totalSeasons:3,seasons:three.slice(0,1)});
  assert.equal(cls(hidden(stale,full,{history:false,multi:torn})),"unavailable","a season view that disagrees with its own projection fails closed");
  // An invalid History cache, a tampered witness, a witness of another Showdown.
  const bad=hidden(stale,full);bad.history={...bad.history,projection:{...bad.history.projection,acceptedSeasons:7}};
  assert.equal(cls(bad),"unavailable","an invalid History cache fails closed");
  const tampered=closeOf(full);tampered.terminalWitness.winner=tampered.terminalWitness.winner==="playerOne"?"playerTwo":"playerOne";
  assert.equal(cls(hidden(stale,full,{close:tampered})),"unavailable","a witness that fails validation fails closed");
  const foreign=closeOf(full);foreign.terminalWitness.rivalryId="pair_"+"9".repeat(64);
  assert.equal(cls(hidden(stale,full,{close:foreign})),"unavailable","a witness of another Showdown fails closed");
  const notTerminal={...closeOf(full),terminal:false};
  assert.equal(cls(hidden(stale,full,{close:notTerminal})),"unavailable","a close that is not terminal fails closed");
  ok("HC2","a level-but-different or ahead projection, another length, a higher stale total, an already-ended projection, a season view that disagrees with its projection, an invalid History cache, a tampered, foreign or non-terminal witness all still fail closed");
}

// HC3: the real page in a fake DOM (same harness as tests/contracts/rivalry-statistics-load-contracts.cjs).
class Element extends FakeNode{
  constructor(tag){super(tag);this.style={setProperty(){}};this.events={};}
  get innerHTML(){return this.html||"";}set innerHTML(value){this.html=String(value);this.replaceChildren();}
  querySelectorAll(){return [];}querySelector(){return null;}
  addEventListener(k,fn){this.events[k]=fn;}
}
async function mount(snapshot,input){
  const nodes=new Map(),definitions=new Map(),frames=[],errors=[],listeners={};let providerReads=0;
  const host=new Element("section");host.id="statistics";
  const document={documentElement:{dataset:{}},visibilityState:"visible",createElement:tag=>new Element(tag),getElementById:id=>id==="statistics"?host:nodes.get(id)||null,querySelector:()=>nodes.get("rvRows"),querySelectorAll:()=>[],addEventListener(k,fn){(listeners[k]??=[]).push(fn);}};
  const c=vm.createContext({console,URLSearchParams,document,setTimeout,clearTimeout,CustomEvent:class{},dispatchEvent(){},addEventListener(k,fn){(listeners[k]??=[]).push(fn);},
    CareerModeCareerScreenSeam:require("../../js/careerScreenSeam.js"),CareerModeSharedHistoryConvergence:History,CareerModeSharedCareerAnalytics:require("../../js/sharedCareerAnalytics.js"),CareerModeSharedTerminalClose:Terminal,CareerModeSharedFinalReconciliation:Final,
    CareerModeOnlinePlayerIdentity:{getState:()=>snapshot.identity},CareerModePersistentNikDanielPair:{getState:()=>snapshot.pair},CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:snapshot.identity.accountId})},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>snapshot.history},CareerModeProductionSharedMultiSeasonProgression:{getState:()=>snapshot.multiSeason},CareerModeProductionSharedFinalReconciliation:{getState:()=>snapshot.finalReconciliation},CareerModeProductionSharedTerminalClose:{getState:()=>snapshot.terminalClose},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:snapshot.identity.accountId}},firestoreSdk:{getDoc(){}}})},
    CareerModeCareerStartMarker:{readMarker:async()=>({status:"ready",hiddenRivalryIds:[]}),hiddenRivalryIds:m=>m.hiddenRivalryIds.slice(),epoch:()=>0},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:async()=>{providerReads++;return {careerInput:input,model:c.CareerModeSharedCareerAnalytics.buildCareerModel(input)};}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),invalidate(){},isMounted:()=>true,async show(id){const def=definitions.get(id);await def.prepare();def.mount(def.frame(),host);frames.push(JSON.parse(JSON.stringify(c.RIVALRY_BOOT.fixtures.frames.LIVE)));return true;}},
    loadRuntimeScript:async()=>{},fetch:async url=>({ok:true,json:async()=>url.endsWith("strings.json")?JSON.parse(fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/rivalry-statistics/strings.json"),"utf8")):{} }),reportApplicationError:(_message,error)=>errors.push(error)
  });c.window=c;
  vm.runInContext(read("js/sharedActiveShowdownAdapter.js"),c);
  vm.runInContext(read("js/rivalryLegacyV10Markup.js"),c);
  for(const m of c.CareerModeRivalryLegacyMarkup.rivalryStatistics.matchAll(/<([\w-]+)([^>]*)>/g)){
    const id=/\bid="([^"]+)"/.exec(m[2]);if(!id)continue;const e=new Element(m[1]);e.id=id[1];e.className=/\bclass="([^"]+)"/.exec(m[2])?.[1]||"";nodes.set(e.id,e);
  }
  vm.runInContext(read("visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js"),c);
  vm.runInContext(read("js/rivalryLegacyV10.js"),c);
  await c.CareerModeRivalryLegacyV10.mount("rivalryStatistics");
  assert.deepEqual(errors,[]);return {nodes,frames,providerReads:()=>providerReads,listeners};
}
(async()=>{
  for(const g of games){
    const older=F.projection({seed:"2",totalSeasons:1,seasons:[[r({championsLeague:true}),r()]]});
    const input={indexStatus:"ready",showdowns:[older,g.full].map(projection=>({rivalryId:projection.rivalryId,classification:"completed",projection,final:F.finalFor(projection)}))};
    const h=await mount(hidden(g.stale,g.full),input),f=h.frames.at(-1);
    console.log(`  ${g.label}: status=${f.status}, lifecycle=${f.ui?.lifecycle}, points=${JSON.stringify(f.score)}, reads=${h.providerReads()}`);
    assert.equal(f.status,"ready",`${g.label}: Rivalry Statistics on the hidden phone is not "unavailable"`);
    assert.equal(f.ui.lifecycle,"completed");assert.equal(h.nodes.get("rvReadState").hidden,true);
    assert.deepEqual(f.score,{daniel:g.full.managerRecords.playerOne.totalPoints,nik:g.full.managerRecords.playerTwo.totalPoints},`${g.label}: the final numbers, never the stale ones`);
    assert.equal(f.seasons.length,g.full.acceptedSeasons);
    assert.equal(h.providerReads(),1,`${g.label}: exactly one finished-career read, as after an app reopen`);
    assert.ok((h.listeners.visibilitychange||[]).length>=1,"the page keeps its retry when it is shown again (A-08)");
  }
  ok("HC3","the real Rivalry Statistics page on the hidden phone shows the finished Showdown (3 seasons, Golden 10, sacked after 2 of 3) from one career read, lifecycle completed");

  if(!REF){
    // HC4: during play nothing changes (no close yet), and the adapter stays pure.
    const g=games[0],live={identity:F.identity(viewer),pair:F.pair(g.full.rivalryId,{managerId:viewer}),multiSeason:progressOf(g.stale),history:F.history(g.stale),finalReconciliation:null,terminalClose:null};
    const v=Adapter.buildActiveShowdownViews(live);
    assert.equal(v.classification,"active");assert.equal(v.rivalry.status,"ready");assert.equal(v.rivalry.season,3);
    const src=fs.readFileSync(path.join(ROOT,"js/sharedActiveShowdownAdapter.js"),"utf8");
    assert.doesNotMatch(src,/getDoc|onSnapshot|setTimeout|setInterval|addEventListener|fetch\(/,"the adapter reads nothing and polls nothing");
    assert.match(src,/r93 U1 \(HUNT_AREAS_3_5\)/,"the fix is documented where it lives");
    ok("HC4","a live Showdown with the same view is unchanged (active, season 3), and the adapter makes no read, poll or listener: no new reads during play");
  }
  console.log(`PASS r93 hidden-close Rivalry Statistics contracts (${checks} checks)${REF?` against ${REF}`:""}`);
})().catch(error=>{console.error(error);process.exitCode=1;});
