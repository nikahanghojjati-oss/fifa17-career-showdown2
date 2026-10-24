"use strict";
// Audit #965 F2: the partner closes while this phone sleeps, then its first detail read fails.
// Exercise the installed production frame/listeners and the real Final Winner cell renderer.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const History=require("../../js/sharedHistoryConvergence.js");
const {projection,result,finalFor}=require("../support/career-fixture-helpers.cjs");
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
  const seasons=Array.from({length:3},(_,i)=>[result({leaguePosition:1,domesticCup:true,championsLeague:i===2}),result({leaguePosition:2})]);
  const p=projection({totalSeasons:3,seasons}),final=finalFor(p);
  return {p,old:projection({totalSeasons:3,seasons:seasons.slice(0,-1)}),terminal:{phase:"CLOSED",terminal:true,rivalryId:p.rivalryId,terminalWitness:{rivalryId:p.rivalryId,totalSeasons:3,completedSeason:3,winner:final.winner,managerTotals:final.totals}}};
}
function cells(frame){
  const nodes=new Map(),el=()=>({textContent:"",dataset:{},classList:{add(){},remove(){},contains:()=>false},style:{},setAttribute(){},removeAttribute(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},getBoundingClientRect:()=>({})});
  const document={getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},createElement:el,addEventListener(){},dispatchEvent(){}};
  const window={document,FINAL_WINNER_APP:true,FINAL_WINNER_ROOT:el(),FINAL_WINNER_FIXTURES:{strings:JSON.parse(read("visual-assets/v10_1/final-winner/app-strings.json")).strings,frames:{LIVE:frame}},setTimeout(){}};
  window.window=window;
  vm.runInNewContext(read("visual-assets/v10_1/final-winner/final-winner.js"),{window,document,location:{search:""},URLSearchParams,console,CustomEvent:function(){},fetch:()=>new Promise(()=>{})});
  window.ShowdownFinalWinnerBoot();return id=>document.getElementById(id).textContent;
}
async function phone(f,role,failure){
  const listeners=new Map(),timers=new Map(),defs={},rendered=[];
  let now=0,serial=0,reads=0,healthy=false,servicesReady=true,screen="seasonEntry",terminal=null,release;
  const emit=type=>{for(const fn of listeners.get(type)||[])fn({type});};
  const listen=(type,fn)=>listeners.set(type,[...(listeners.get(type)||[]),fn]);
  const document={visibilityState:"visible",addEventListener:listen};
  const uid=role==="playerOne"?"daniel":"nik";
  const env={console,document,navigator:{onLine:true},Date:class extends Date{static now(){return now;}},
    setTimeout(fn,delay=0){const id=++serial;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),addEventListener:listen,getActiveScreenName:()=>screen,
    CareerModeSharedHistoryConvergence:History,
    CareerModeProductionSharedHistoryConvergence:{getState:()=>({authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:f.p.rivalryId,projection:f.old})},
    CareerModeProductionSharedTerminalClose:{getState:()=>terminal},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:uid})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:servicesReady,auth:{currentUser:{uid}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkCompletedShowdownReader:{async readCompletedShowdown(options){
      reads++;assert.equal(options.rivalryId,f.p.rivalryId);assert.equal(options.user.uid,uid);
      if(!healthy){if(failure==="pending")return new Promise(resolve=>{release=()=>resolve({status:"unavailable"});});if(failure==="rejected")throw Error("connection interrupted");return {status:"unavailable",code:"unavailable"};}
      return {status:"completed",rivalryId:f.p.rivalryId,projection:f.p};
    }},
    CareerModeV10Screens:{install(){return this;},register(id,def){defs[id]=def;},setNavRoute(){},invalidate(){},async show(id){if(defs[id])rendered.push(defs[id].frame().final);return true;}}
  };
  vm.runInNewContext(read("js/seasonFinalV10.js"),env,{filename:"js/seasonFinalV10.js"});
  await env.CareerModeSeasonFinalV10.install();
  async function advance(ms=0){
    const end=now+ms;let work=0;
    for(;;){
      await tick();
      const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;
      assert.ok(++work<100,"recovery must not spin");now=next[1].at;timers.delete(next[0]);next[1].fn();
    }
    now=end;await tick();
  }
  await advance();
  return {env,emit,advance,rendered,frame:()=>defs.seasonEntry.frame().final,reads:()=>reads,
    close(){terminal=f.terminal;emit("career-mode-shared-terminal-close-state-change");},
    healthy(){healthy=true;servicesReady=true;},release:()=>release(),notReady(){servicesReady=false;},screen(value){screen=value;}};
}
function ready(frame,f){
  assert.equal(frame.status,"ready","reconnection must repopulate Final Winner without a reload");
  const text=cells(frame),last=f.p.seasonHistory.at(-1);
  assert.equal(text("panelLastSeasonDaniel"),String(last.playerOne.scoring.total));
  assert.equal(text("panelLastSeasonNik"),String(last.playerTwo.scoring.total));
  for(const [name,role] of [["Daniel","playerOne"],["Nik","playerTwo"]])assert.equal(text(`panel${name}Trophies`),String(f.p.managerRecords[role].totalTrophies));
  assert.equal(frame.message,"");
}
async function recovery(role,failure,trigger){
  const f=fixture(),s=await phone(f,role,failure);
  // An older converged prefix is all this phone had before sleeping; the closed root arrives on wake.
  s.env.document.visibilityState="hidden";
  if(failure==="services")s.notReady();
  s.close();s.env.document.visibilityState="visible";
  s.emit("visibilitychange");await s.advance();
  const partial=s.frame(),text=cells(partial);
  assert.equal(partial.status,"partial");assert.equal(text("panelLastSeasonDaniel"),"—");assert.equal(text("panelDanielTrophies"),"—");
  assert.equal(partial.message,"Trophy attribution is unavailable right now.");
  assert.equal(partial.totals.daniel,f.terminal.terminalWitness.managerTotals.playerOne);
  assert.equal(partial.winner,"daniel");assert.equal(s.reads(),failure==="services"?0:1);
  // Ordinary redraws and repeated notifications must not cause a burst of reads.
  for(let i=0;i<10;i++){s.frame();s.emit("career-mode-shared-terminal-close-state-change");}
  await s.advance();assert.equal(s.reads(),failure==="services"?0:1);
  s.env.navigator.onLine=false;s.emit("offline");await s.advance(100);
  s.healthy();s.env.navigator.onLine=true;
  if(trigger==="online")for(let i=0;i<10;i++)s.emit("online");
  else {s.env.document.visibilityState="hidden";s.emit("visibilitychange");s.env.document.visibilityState="visible";s.emit("visibilitychange");}
  await s.advance(30000);
  ready(s.rendered.at(-1),f);ready(s.frame(),f);
  assert.equal(s.reads(),failure==="services"?1:2,"one recovery read, coalesced across events and redraws");
  for(let i=0;i<10;i++){s.emit("online");s.emit("visibilitychange");s.emit("career-mode-shared-history-convergence-state-change");s.frame();}
  await s.advance(60000);assert.equal(s.reads(),failure==="services"?1:2,"successful immutable history stays cached");
  console.log(`PASS ${role}: ${failure} detail read recovers on ${trigger}, cells redraw and success stays cached`);
}
async function hiddenRecovery(){
  const f=fixture(),s=await phone(f,"playerTwo","unavailable");s.close();await s.advance();
  s.env.document.visibilityState="hidden";s.healthy();s.emit("online");s.emit("visibilitychange");await s.advance(60000);
  assert.equal(s.reads(),1,"hidden phone must not retry details");
  s.env.document.visibilityState="visible";s.emit("visibilitychange");await s.advance(30000);ready(s.frame(),f);
  console.log("PASS hidden recovery waits for visible return");
}
async function recoveryDuringRead(){
  const f=fixture(),s=await phone(f,"playerTwo","pending");s.close();await s.advance();
  assert.equal(s.reads(),1);
  s.emit("online");s.emit("visibilitychange");s.healthy();s.release();await s.advance(30000);
  ready(s.rendered.at(-1),f);assert.equal(s.reads(),2,"recovery during an in-flight failure must not be lost");
  console.log("PASS recovery arriving during the failed read is replayed");
}
async function boundedFailures(){
  const f=fixture(),s=await phone(f,"playerOne","unavailable");s.close();await s.advance();
  for(let i=0;i<20;i++){s.emit("online");s.emit("visibilitychange");s.frame();}
  await s.advance(100);assert.equal(s.reads(),1,"failed reads must back off across event bursts");
  await s.advance(30000);assert.equal(s.reads(),2,"events coalesce to one retry even when it also fails");
  assert.equal(s.rendered.at(-1).status,"partial");assert.equal(cells(s.rendered.at(-1))("panelDanielTrophies"),"—");
  s.screen("mainMenu");s.healthy();s.emit("online");await s.advance(60000);
  assert.equal(s.reads(),2,"details recovery must not read after leaving Final Winner");
  s.screen("seasonEntry");s.emit("visibilitychange");await s.advance(30000);ready(s.rendered.at(-1),f);
  assert.equal(s.reads(),3);
  console.log("PASS repeated failures stay partial, back off and wait for Final Winner return");
}
(async()=>{
  for(const role of ["playerOne","playerTwo"])for(const failure of ["unavailable","rejected","services"])for(const trigger of ["online","visible"])await recovery(role,failure,trigger);
  await hiddenRecovery();
  await recoveryDuringRead();await boundedFailures();
})().catch(error=>{console.error(error);process.exitCode=1;});
