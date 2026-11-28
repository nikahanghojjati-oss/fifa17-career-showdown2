"use strict";
// r100 H1 F5 (P2, lead 2026-11-27): with a half-up connection (Firestore requests hang with no error while the phone says
// online) Standings CAREER sat on "Loading standings." for the whole hang (40 s in H1's CDP hold): refreshStandingsCareer
// awaited loadCareerModel() with no deadline and currentCareer said loading while that load was out.
// The fix (js/seasonFinalV10.js SF_CAREER_WAIT_MS, visual-assets/v10_1/standings/standings.js):
//   - CAREER waits for the read at most 12 s; after that it shows the last career numbers this page loaded with an honest
//     "still updating" line (no spinner), or, with none, says the career did not load in time with TRY AGAIN
//   - the read is not cut: its late answer still updates the screen
//   - TRY AGAIN (the player's tap) is the only new read; no automatic retry; a career that loads in time makes no extra read
// Checks, on the real code in node:vm (the career block) and Team V's real Standings renderer on its frozen shell:
//   C1 a career that loads in time: loading, then the new numbers; one read, nothing more after the deadline passes
//   C2 the read hangs, nothing kept: loading until 12 s, then the retry message; Standings shows the words and TRY AGAIN
//   C3 the read hangs, numbers kept from an earlier load: those numbers with the "still updating" line, no spinner
//   C4 the late answer lands after the deadline: the new numbers, the line gone, the screen woken
//   C5 TRY AGAIN: one new read per tap and only after the deadline; no read on its own over 10 minutes; a stale answer of the
//      first read cannot clear the new one
//   C6 the wiring: TRY AGAIN sends career-mode-standings-retry and seasonFinalV10 listens for it; THIS SHOWDOWN is untouched
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const {FakeNode}=require("../support/fake-dom.cjs");
const S=require("../../js/seasonFinalV10.js");
const J=x=>JSON.parse(JSON.stringify(x));
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const SRC=read("js/seasonFinalV10.js");
const BLOCK=(()=>{const a=SRC.indexOf("  // r100 H1 F5 (half-up connection"),b=SRC.indexOf("  // HO-068: Team V's markup still names");assert.ok(a>0&&b>a,"the Standings career block is where it was");return SRC.slice(a,b);})();
const WAIT=12000;
const STRINGS=JSON.parse(read("visual-assets/v10_1/standings/app-strings.json")).strings;
const COUNT=["seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"];
// A career model as the career analytics hand it to Standings: one finished Showdown.
const careerModel=(dan,nik)=>({status:"ready",
  managers:{daniel:{...Object.fromEntries(COUNT.map((k,i)=>[k,i])),showdowns:{completed:1}},nik:{...Object.fromEntries(COUNT.map((k,i)=>[k,i+1])),showdowns:{completed:1}}},
  trophyRoom:{standings:[{manager:"daniel",careerPoints:dan,seasonWins:1},{manager:"nik",careerPoints:nik,seasonWins:2}]},history:{showdowns:[]}});

// A page: the real block with a clock, the career module and the player's identity.
function page({kept=null}={}){
  let now=0;const timers=[];const loads=[];let cache=kept;let wakes=0;
  const legacy={loadCareerModel(){let resolve,reject;const p=new Promise((a,b)=>{resolve=a;reject=b;});const seq=loads.length+1;
      loads.push({resolve:model=>{if(seq===loads.length)cache=model;resolve(model);},reject});return p;},
    cachedCareerModel:()=>cache};
  const root={CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:"daniel"})},CareerModeRivalryLegacyV10:legacy,
    loadRuntimeScript:async()=>true,setTimeout:(fn,ms)=>{timers.push({at:now+ms,fn});return timers.length;}};
  const ctx={root,Promise,JSON,Object,Array,console};vm.createContext(ctx);
  vm.runInContext(`let signature="x";function wake(){globalThis.__wakes=(globalThis.__wakes||0)+1;}const state=name=>{try{return root[name]?.getState?.()||null;}catch(_){return null;}};\n${BLOCK}\nglobalThis.api={refreshStandingsCareer,sfRetryStandingsCareer,currentCareer};`,ctx);
  const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();await new Promise(r=>setImmediate(r));for(let i=0;i<20;i++)await Promise.resolve();};
  const advance=async ms=>{const end=now+ms;for(;;){const t=timers.filter(t=>!t.done&&t.at<=end).sort((a,b)=>a.at-b.at)[0];if(!t)break;now=t.at;t.done=true;t.fn();await flush();}now=end;await flush();};
  return {api:ctx.api,loads,advance,flush,wakes:()=>ctx.__wakes||0,career:()=>J(ctx.api.currentCareer()),frame:()=>S.standingsFrames({status:"empty"},ctx.api.currentCareer()).CAREER.model};
}
// Team V's frozen shell and real renderer, on CAREER.
class Node extends FakeNode{
  constructor(tag){super(tag);this.listeners={};this.disabled=false;}
  addEventListener(event,fn){(this.listeners[event]||=[]).push(fn);}
  click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({target:this});}
  setAttribute(k,v){super.setAttribute(k,v);if(k==="id")this.id=v;if(k==="class")this.className=v;if(k.startsWith("data-"))this.dataset[k.slice(5)]=v;}
}
function render(careerFrame){
  const document={createElement:tag=>new Node(tag)},body=new Node("body"),stack=[body];
  for(const m of read("visual-assets/v10_1/standings/app-shell.html").matchAll(/<\/?[^>]+>|[^<]+/g)){
    const token=m[0];if(token.startsWith("</")){stack.pop();continue;}
    if(token.startsWith("<")){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const node=document.createElement(tag);
      for(const attr of token.matchAll(/([\w:-]+)="([^"]*)"/g))node.setAttribute(attr[1],attr[2]);
      node.hidden=/\shidden(?:\s|>)/.test(token);stack.at(-1).appendChild(node);if(!["source","img","input","br","hr"].includes(tag))stack.push(node);}
    else{const node=new Node("#text");node.textContent=token;stack.at(-1).appendChild(node);}
  }
  document.documentElement=new Node("html");document.getElementById=id=>body.all().find(node=>node.id===id)||null;
  const sent=[];
  const frames={CAREER:{view:"career",previewLabel:"",model:careerFrame}};
  const env={document,console,URLSearchParams,location:{search:""},STANDINGS_APP:true,STANDINGS_ROOT:document.getElementById("stage-root"),STANDINGS_FIXTURES:{strings:STRINGS,frames},
    CustomEvent:class{constructor(type){this.type=type;}},dispatchEvent:e=>{sent.push(e.type);return true;},fetch(){throw Error("Standings must not fetch");}};
  env.window=env;vm.runInNewContext(read("visual-assets/v10_1/standings/standings.js"),env);env.ShowdownStandingsBoot();
  const st=document.getElementById("sdgState"),rows=document.getElementById("sdgRows");
  return {state:st,text:st.hidden?"":st.ownText,rows:rows.hidden?0:rows.children.length,buttons:st.children.filter(c=>c.tagName==="BUTTON"),sent};
}

(async()=>{
  assert.ok(STRINGS.careerUpdating&&STRINGS.careerRetry&&STRINGS.careerRetryAction,"Standings has the still-updating, retry and TRY AGAIN words");
  // C1
  {const pg=page();pg.api.refreshStandingsCareer();await pg.flush();
    assert.equal(pg.loads.length,1);assert.equal(pg.career().status,"loading","the read is out: loading, as before");
    await pg.advance(3000);const m=careerModel(7,9);pg.loads[0].resolve(m);await pg.flush();
    assert.deepEqual(pg.career(),J(m),"the new numbers, with no still-updating mark");
    await pg.advance(WAIT*2);assert.deepEqual(pg.career(),J(m),"the deadline passing later changes nothing");
    pg.api.sfRetryStandingsCareer();await pg.advance(600000);assert.equal(pg.loads.length,1,"one read, no retry of a load that landed, none on its own");
    ok("C1","a career that loads in time: loading, then its numbers; one read and nothing after");}
  // C2
  {const pg=page();pg.api.refreshStandingsCareer();await pg.flush();
    await pg.advance(WAIT-1);assert.equal(pg.career().status,"loading","loading until the wait is over");
    const w=pg.wakes();await pg.advance(1);
    assert.deepEqual(pg.career(),{status:"unavailable",notice:"retry"},"after 12 s: the retry message, never loading");assert.ok(pg.wakes()>w,"the screen is woken at the deadline");
    const f=pg.frame();assert.deepEqual(J(f),{status:"unavailable",notice:"retry"},"Standings' own CAREER frame carries the retry notice");
    const r=render(f);assert.equal(r.text,STRINGS.careerRetry,"the words: did not load in time, try again");assert.equal(r.rows,0);
    assert.equal(r.buttons.length,1);assert.equal(r.buttons[0].textContent,STRINGS.careerRetryAction);
    r.buttons[0].click();assert.deepEqual(r.sent,["career-mode-standings-retry"],"TRY AGAIN asks seasonFinalV10 for one more read");
    assert.equal(render({status:"unavailable"}).buttons.length,0,"plain unavailable has no TRY AGAIN");
    assert.equal(render({status:"loading"}).text,STRINGS.loading);
    ok("C2","the read hangs with nothing kept: loading for 12 s at most, then the retry message with TRY AGAIN");}
  // C3
  {const kept=careerModel(4,6);const pg=page({kept});pg.api.refreshStandingsCareer();await pg.flush();
    assert.equal(pg.career().status,"loading");await pg.advance(WAIT);
    assert.deepEqual(pg.career(),{...J(kept),updating:true},"the kept numbers, marked still updating");
    const f=pg.frame();assert.equal(f.status,"ready");assert.equal(f.updating,true);assert.deepEqual(J(f.standings.daniel).careerPoints,4);assert.equal(f.standings.nik.careerPoints,6);
    const r=render(f);assert.equal(r.text,STRINGS.careerUpdating,"the still-updating line");assert.ok(r.rows>=8,"with the numbers on the board");assert.equal(r.buttons.length,0);
    const plain=render(S.standingsFrames({status:"empty"},kept).CAREER.model);assert.equal(plain.text,"","numbers that are current carry no line");
    assert.equal(S.standingsFrames({status:"empty"},{status:"empty",updating:true}).CAREER.model.updating,true,"an empty career kept is marked too");
    ok("C3","the read hangs with numbers kept: those numbers with the still-updating line, no spinner");}
  // C4
  {for(const kept of [null,careerModel(4,6)]){const pg=page({kept});pg.api.refreshStandingsCareer();await pg.flush();await pg.advance(WAIT+20000);
    const w=pg.wakes();const m=careerModel(10,12);pg.loads[0].resolve(m);await pg.flush();
    assert.deepEqual(pg.career(),J(m),"the late answer is the career now, with no still-updating mark");assert.ok(pg.wakes()>w,"and wakes the screen");
    assert.equal(render(pg.frame()).text,"");
    pg.api.refreshStandingsCareer();await pg.flush();assert.equal(pg.loads.length,2,"the next open reads again, as before the fix");}
    ok("C4","the late answer still lands on the screen and clears the line");}
  // C5
  {const pg=page();pg.api.refreshStandingsCareer();await pg.flush();
    pg.api.sfRetryStandingsCareer();await pg.flush();assert.equal(pg.loads.length,1,"no extra read before the deadline");
    await pg.advance(600000);assert.equal(pg.loads.length,1,"10 minutes on a hung read: still one read, no automatic retry");
    pg.api.sfRetryStandingsCareer();await pg.flush();assert.equal(pg.loads.length,2,"TRY AGAIN: one new read");
    assert.equal(pg.career().status,"loading","and loading again while it is out");
    pg.api.sfRetryStandingsCareer();await pg.flush();assert.equal(pg.loads.length,2,"a second tap while the new read is in its wait adds nothing");
    pg.loads[0].resolve(careerModel(1,1));await pg.flush();assert.equal(pg.career().status,"loading","the first read's stale answer neither publishes nor ends the new wait");
    await pg.advance(WAIT);assert.deepEqual(pg.career(),{status:"unavailable",notice:"retry"},"the new read gets its own 12 s");
    const m=careerModel(3,5);pg.loads[1].resolve(m);await pg.flush();assert.deepEqual(pg.career(),J(m));
    pg.api.refreshStandingsCareer();await pg.flush();assert.equal(pg.loads.length,3);pg.loads[2].reject(new Error("offline"));await pg.flush();assert.deepEqual(pg.career(),J(m),"a failed read keeps what the page holds");
    ok("C5","TRY AGAIN makes one read per tap after the deadline; nothing reads on its own; stale answers stay out");}
  // C6
  {const sf=SRC,sd=read("visual-assets/v10_1/standings/standings.js");
    assert.match(sf,/root\.addEventListener\?\.\("career-mode-standings-retry",sfRetryStandingsCareer\)/,"seasonFinalV10 listens for TRY AGAIN");
    assert.match(sd,/new CustomEvent\("career-mode-standings-retry"\)/,"Standings sends it");
    assert.equal((sf.match(/sfRetryStandingsCareer\b/g)||[]).length,2,"retry runs only from that listener (its definition and the listener, nowhere else)");
    const sh=S.standingsFrames({status:"unavailable",notice:"continue"},{status:"unavailable",notice:"retry"});
    assert.deepEqual(J(sh.SHOWDOWN.model),{status:"unavailable",notice:"continue"},"THIS SHOWDOWN keeps its own notice");
    ok("C6","TRY AGAIN is wired through one event; THIS SHOWDOWN is untouched");}
  console.log(`PASS r100 Standings career deadline: ${n} checks (CAREER never sits on Loading past 12 s; kept numbers say still updating, none kept offers TRY AGAIN; late answers land; retry only on a tap).`);
})().catch(error=>{console.error(error);process.exit(1);});
