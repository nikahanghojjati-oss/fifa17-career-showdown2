"use strict";
// r100 H2-3 (H2 hunt, 3 of 3 on b9a16258, seed 2811282, FIJ reload at season-ack): after an app reopen mid-Showdown,
// Career Statistics hid CURRENT RIVALRY STATISTICS on a pair with no finished Showdown yet, because the button followed
// only the in-memory currentShowdown (empty until CONTINUE) or a completed Showdown in the career. Its empty text sends the
// player to Rivalry Statistics. Now the pair (read on Home) naming an active Showdown shows the button too. That is the
// same gate Standings and Rivalry Statistics trust for THIS SHOWDOWN (js/seasonFinalV10.js sfKeptView), and it reads nothing.
// Checks, on the real js/careerScreensV10.js v10Wire, js/rivalryLegacyV10.js and js/seasonFinalV10.js blocks in node:vm:
//   K1 a reopen mid-Showdown with no finished Showdown: the button shows, and its tap opens Rivalry Statistics
//   K2 no Showdown at all (unpaired, no pair yet, pending, closed, Terminal-Closed, a malformed id): hidden, as before
//   K3 the tap lands on THIS SHOWDOWN live: the kept copy after its one check, 5 - 5 in season 2 of 3 on its own frame
//   K4 the button costs nothing: no read, no storage, no new tap or warning; the earlier rules still show it
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const F=require("../support/active-showdown-fixtures.cjs");
const A=require("../../js/sharedActiveShowdownAdapter.js");
const RL=require("../../js/rivalryLegacyV10.js");
const J=x=>JSON.parse(JSON.stringify(x));
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const CSRC=read("js/careerScreensV10.js"),RSRC=read("js/rivalryLegacyV10.js"),SSRC=read("js/seasonFinalV10.js");
const WIRE=/function v10Wire\(screen,host\)\{[\s\S]*?\n  \}/.exec(CSRC)[0];
const RBLOCK=(()=>{const a=RSRC.indexOf("  // r100 H2-1 PR C"),b=RSRC.indexOf("  // r87 H4 (Reus Gate, Nik)");assert.ok(a>0&&b>a);return RSRC.slice(a,b);})();
const SBLOCK=(()=>{const a=SSRC.indexOf("  const state=name=>"),b=SSRC.indexOf("  // A supplied model first, then the provider-backed career model");assert.ok(a>0&&b>a);return SSRC.slice(a,b);})();

class Button{constructor(){this.classes=new Set();this.events={};this.classList={toggle:(c,on)=>{if(on)this.classes.add(c);else this.classes.delete(c);},contains:c=>this.classes.has(c)};}addEventListener(type,fn){this.events[type]=fn;}}
function careerScreen({pair=null,close=null,current=null,model={status:"empty",history:{showdowns:[]}}}={}){
  const button=new Button(),touched=[];let opened=0;
  const watch=name=>new Proxy({},{get:(_t,k)=>{touched.push(`${name}.${String(k)}`);return undefined;}});
  const c=vm.createContext({console,RegExp,String,Promise});c.root=c;c.window=c;
  c.CareerModePersistentNikDanielPair={getState:()=>pair};c.CareerModeProductionSharedTerminalClose={getState:()=>close};
  c.openRivalryStatistics=()=>{opened+=1;};c.openOptionalModule=()=>{};c.document={addEventListener(){}};
  c.readStorageValue=()=>{touched.push("readStorageValue");return null;};c.CareerModeProductionFirebaseRuntime=watch("firebase");
  c.v10Source=()=>model;
  vm.runInContext(`var currentShowdown=${JSON.stringify(current)};\n${WIRE}\nv10Wire("careerStatistics",{querySelector:id=>id==="#careerStatisticsRivalryButton"?globalThis.__button:null});`,Object.assign(c,{__button:button}));
  return {shown:!button.classList.contains("hidden"),tap:()=>{button.events.click?.();return opened;},touched};
}

(async()=>{
  const p=F.projection({totalSeasons:3,seasons:[[F.result({championsLeague:true}),F.result({championsLeague:true})]]});
  const RID=p.rivalryId;

  // K1
  {const s=careerScreen({pair:F.pair(RID)});assert.equal(s.shown,true,"a reopen mid-Showdown, no finished Showdown: the button shows (hidden before H2-3)");assert.equal(s.tap(),1,"and its tap opens Rivalry Statistics");
    const nik=careerScreen({pair:F.pair(RID,{managerId:"nik"})});assert.equal(nik.shown,true,"on either phone");}
  ok("K1","a reopen mid-Showdown with no finished Showdown: CURRENT RIVALRY STATISTICS shows and opens");

  // K2
  {const cases=[["no pair yet",null],["pair not read yet",F.pair(RID,{initialized:false})],["unpaired",F.pair(null,{status:"unpaired",connectionState:null})],["pending pair",F.pair(RID,{connectionState:"pending-pair"})],["closed",F.pair(RID,{status:"waiting",connectionState:"closed"})],["a malformed id",F.pair("pair_x")]];
    for(const [label,pair] of cases){const s=careerScreen({pair});assert.equal(s.shown,false,`${label}: hidden, as before`);assert.equal(s.tap(),0,`${label}: a tap opens nothing`);}
    const ended=careerScreen({pair:F.pair(RID),close:{phase:"CLOSED",rivalryId:RID}});assert.equal(ended.shown,false,"Terminal-Closed and not yet in the career: hidden, as before");
    const other=careerScreen({pair:F.pair(RID),close:{phase:"CLOSED",rivalryId:F.projection({seed:"9",totalSeasons:3,seasons:[[F.result(),F.result()]]}).rivalryId}});assert.equal(other.shown,true,"an older Showdown's close does not hide the active one");
    const broken=careerScreen({pair:F.pair(RID)});assert.equal(broken.shown,true);
    const c=vm.createContext({console,RegExp,String});c.root=c;c.CareerModePersistentNikDanielPair={getState(){throw new Error("x");}};c.v10Source=()=>({status:"empty",history:{showdowns:[]}});c.document={addEventListener(){}};const b=new Button();c.__button=b;
    vm.runInContext(`var currentShowdown=null;\n${WIRE}\nv10Wire("careerStatistics",{querySelector:()=>globalThis.__button});`,c);assert.equal(b.classList.contains("hidden"),true,"a pair state that throws: hidden, never an error");}
  ok("K2","no active Showdown (no pair, unpaired, pending, closed, Terminal-Closed, malformed, a throw): hidden as before");

  // K3: the tap lands on THIS SHOWDOWN live (Rivalry Statistics after the reopen: the kept copy after its one check)
  {const KEY="cms.liveStandings.v1",storage=new Map([[KEY,JSON.stringify({schemaVersion:1,rivalryId:RID,history:J(F.history(p))})]]),reads=[];
    const sdk={doc:(_db,...parts)=>parts.join("/"),runTransaction:async(_db,fn)=>fn({get:async ref=>{reads.push(ref);return {exists:()=>true,data:()=>({phase:"COMMITTED",revision:2,seasonNumber:2})};}})};
    const sroot={CareerModeSharedActiveShowdownAdapter:A,readStorageValue:k=>storage.get(k)??null,writeStorageValue:(k,v)=>{storage.set(k,v);return true;},setTimeout:(fn,ms)=>{if(ms<6000)setImmediate(fn);return 0;},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},CareerModeProductionSharedShowdownSetup:{getState:()=>null}};
    const snap={CareerModeOnlinePlayerIdentity:F.identity(),CareerModePersistentNikDanielPair:F.pair(RID),CareerModeProductionSharedMultiSeasonProgression:null,CareerModeProductionSharedHistoryConvergence:null,CareerModeProductionSharedFinalReconciliation:null,CareerModeProductionSharedTerminalClose:null};
    for(const [k,v] of Object.entries(snap))sroot[k]={getState:()=>v};sroot.CareerModeProductionSharedHistoryConvergence.isActive=()=>false;
    const sctx={root:sroot,Date,JSON,Promise,Number,String,Boolean,Object,Array,RegExp,Error,console};vm.createContext(sctx);
    vm.runInContext(`let signature="";function wake(){}\n${SBLOCK}\nglobalThis.api={sfKeptShowdownView};`,sctx);
    const rroot={CareerModeSeasonFinalV10:{keptShowdownView:sctx.api.sfKeptShowdownView},loadRuntimeScript:async()=>{throw new Error("already loaded");}};
    const rctx={root:rroot,Promise,Object,Error,console};vm.createContext(rctx);
    vm.runInContext(`const load=()=>Promise.reject(new Error("no load"));function rlLiveCanArrive(){return false;}let ctxKey="k";function context(){return ctxKey;}\n${RBLOCK}\nglobalThis.api={rlLiveOrContinue};`,rctx);
    const active=A.buildActiveShowdownViews({identity:F.identity(),pair:F.pair(RID),multiSeason:null,history:null,terminalClose:null});
    assert.equal(active.classification,"loading","after the reopen the providers have not started: the adapter has no numbers");
    const model=J(await rctx.api.rlLiveOrContinue({...active.rivalry,lifecycle:active.classification},"open"));
    assert.equal(model.status,"ready");assert.equal(model.lifecycle,"active");
    const frame=J(RL.toV10Frame(model,"rivalryStatistics"));assert.equal(frame.status,"ready");assert.deepEqual(frame.score,{daniel:5,nik:5},"THIS SHOWDOWN live: 5 - 5");assert.equal(model.season,2,"season 2");assert.equal(frame.totalSeasons,3);
    assert.deepEqual(reads,[`rivalries/${RID}/seasonCommits/season_2`],"with a kept copy: its one check, nothing more");}
  ok("K3","the tap lands on THIS SHOWDOWN live: 5 - 5 in season 2 of 3, after the kept copy's one check");

  // K4
  {const s=careerScreen({pair:F.pair(RID)});assert.equal(s.touched.length,0,"the button reads nothing (no Firebase, no storage)");
    assert.doesNotMatch(WIRE,/getDoc|runTransaction|onSnapshot|readStorageValue|writeStorageValue|confirm\(|alert\(/,"no read, write, confirm or warning in the wiring");
    assert.equal(careerScreen({current:{}}).shown,true,"a Showdown in memory: shown, as before");
    assert.equal(careerScreen({model:{status:"ready",history:{showdowns:[{status:"completed"}]}}}).shown,true,"a finished Showdown in the career: shown, as before");
    assert.equal(careerScreen({}).shown,false,"nothing: hidden, as before");
    assert.match(read("visual-assets/v10_1/career-statistics/career-statistics.js"),/This Showdown's numbers are on Standings and Rivalry Statistics\./,"the empty text is unchanged");}
  ok("K4","no read, no storage, no new tap or warning; the earlier rules and the empty text are unchanged");
  console.log(`PASS r100 Rivalry Statistics button after an app reopen (${n} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
