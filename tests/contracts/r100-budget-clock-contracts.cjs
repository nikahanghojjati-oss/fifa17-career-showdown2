"use strict";
// Phoenix B2 (r100, B1's quota leg with the clock put back, gameplay/r100 seed 4181106201): Daniel's quota pause (10 min) was
// ended by his page clock jumping 11 min ahead at season-results ("the next day with the page kept open"); the clock was then
// put back 11 min. The budget measured the pause on Date.now(), so the finished pause came back for ten more minutes: every read
// was refused, and Season Commit's CHECK AGAIN changed nothing while Nik waited. Now the budget's clock (fsbNow) runs on the
// page's monotonic clock, follows a clock that jumps ahead, and never runs backwards.
//   C1 the timing: a pause ended by the jump ahead stays ended when the clock is put back (no refused read, no quota message)
//   C2 a clock put back during a pause does not make it longer: it ends after its own 10 min
//   C3 a phone woken the next day (wall clock ahead, monotonic clock stood still) follows the wall clock: the pause ends and the
//      Pacific day turns, as before
//   C4 the clock never runs backwards; without performance.now it falls back to the wall clock, still never backwards
//   C5 nothing in the budget's page-memory windows reads Date.now() directly any more: every one goes through fsbNow
//   C6 a refused read under a pause that came back is what kept CHECK AGAIN dead: the budget refuses reads only while paused
//   C7 the resume timer can lag a clock that jumped ahead: the first check that finds the pause over tells the screens once
//      (the page mark and the quota event); the late timer then adds nothing
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const code=fs.readFileSync(path.resolve(__dirname,"../../js/sparkPrivatePairing.js"),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const pick=re=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};
const now=pick(/  let fsbClockBase=null;\n  function fsbNow\(\)\{[\s\S]*?\n  \}\n/);
const paused=pick(/  let fsbShownPaused=false;\n  function fsbPaused\(\)\{[^\n]*\}\n/);
const publish=pick(/  function fsbState\(\)\{[^\n]*\}\n  function fsbPublish\(\)\{[\s\S]*?\n  \}\n/);
const trip=pick(/  function fsbTrip\(\)\{[\s\S]*?\n  \}\n/);
const steps=pick(/  const FSB_PAUSE_STEPS_MS=[^\n]*\n/);
const day=pick(/  function fsbPacificDay\(at\)\{[^\n]*\}\n/),next=pick(/  function fsbNextPacificDayAt\(at\)\{[\s\S]*?\n  \}\n/);
const MIN=60000,START=Date.UTC(2026,10,25,21,0,0);

function page({perf=true}={}){
  const w={wall:START,mono:5000,timers:[],published:0};
  const ctx={
    Date:Object.assign(function(...a){return new Date(...a);},{now:()=>w.wall,UTC:Date.UTC}),Intl,Number,Math,Object,
    root:{performance:perf?{now:()=>w.mono}:undefined,setTimeout:(f,ms)=>{w.timers.push({f,at:w.mono+ms});return w.timers.length;},clearTimeout:()=>{}},
    fsbPause:null,fsbStats:{quotaTrips:0},fsbEntries:new Map(),fsbDetachWait:()=>{},fsbCtxDetach:()=>{},fsbResumeTimer:null,FSB_QUOTA_MESSAGE:"limit"
  };
  ctx.root.document={documentElement:{dataset:{}}};ctx.root.CustomEvent=function(type,init){this.type=type;this.detail=init.detail;};
  ctx.root.dispatchEvent=e=>{w.published+=1;w.events.push(e.detail.paused);};w.events=[];
  vm.runInNewContext(steps.replace(/^  const /,"var ")+now.replace(/^  let /,"var ")+paused.replace(/^  let /,"var ")+publish+trip+day+next+";globalThis.now=fsbNow;globalThis.paused=fsbPaused;globalThis.trip=fsbTrip;",ctx);
  w.mark=()=>ctx.root.document.documentElement.dataset.firestoreQuota||null;
  w.ctx=ctx;
  // Playwright's fastForward: both clocks move on and timers due run; setSystemTime: only the wall clock moves.
  w.run=()=>{const due=w.timers.filter(t=>t.at<=w.mono);w.timers=w.timers.filter(t=>t.at>w.mono);due.forEach(t=>t.f());};
  w.ahead=ms=>{w.wall+=ms;w.mono+=ms;w.run();};
  // A clock that jumps ahead while the page's timers lag (they were set on the real clock before it moved).
  w.jump=ms=>{w.wall+=ms;w.mono+=ms;w.timers.forEach(t=>{t.at+=ms;});};
  w.setWall=ms=>{w.wall+=ms;};
  w.sleep=ms=>{w.wall+=ms;};
  return w;
}

{
  const w=page();w.ctx.trip();assert.equal(w.ctx.paused(),true,"quota: paused");
  w.ahead(11*MIN);assert.equal(w.ctx.paused(),false,"the jump ahead ends the pause");assert.deepEqual(w.events,[true,false],"the resume was told once");
  w.setWall(-11*MIN);assert.equal(w.ctx.paused(),false,"put back: the pause stays ended");
  for(let i=0;i<20;i+=1){w.ahead(30000);assert.equal(w.ctx.paused(),false);}
  ok("C1","a pause ended by the clock jumping ahead stays ended when the clock is put back");
}
{
  const w=page();w.ctx.trip();w.ahead(5*MIN);w.setWall(-11*MIN);assert.equal(w.ctx.paused(),true);
  w.ahead(5*MIN-1000);assert.equal(w.ctx.paused(),true,"still inside its 10 min");w.ahead(2000);assert.equal(w.ctx.paused(),false,"ends after its own 10 min");
  ok("C2","a clock put back during a pause does not make the pause longer");
}
{
  const w=page();w.ctx.trip();const before=w.ctx.now();w.sleep(12*60*MIN);const after=w.ctx.now();
  assert.equal(after,w.wall,"follows the wall clock ahead");assert.equal(w.ctx.paused(),false);
  assert.notEqual(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles"}).format(new Date(before)),new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles"}).format(new Date(after)),"the Pacific day turned");
  w.ahead(1000);assert.equal(w.ctx.now(),w.wall,"and runs on from there");
  ok("C3","a phone woken the next day follows the wall clock: the pause ends and the day turns");
}
{
  const w=page();let last=w.ctx.now();
  for(const move of [()=>w.ahead(1000),()=>w.setWall(-30*MIN),()=>w.ahead(500),()=>w.sleep(2*MIN),()=>w.setWall(-1),()=>w.ahead(1)]){move();const t=w.ctx.now();assert.ok(t>=last,`never backwards (${t} < ${last})`);last=t;}
  const p=page({perf:false});let l=p.ctx.now();p.setWall(-5*MIN);assert.ok(p.ctx.now()>=l);p.ahead(MIN);assert.equal(p.ctx.now(),l,"held until the wall clock passes it");p.ahead(5*MIN);assert.equal(p.ctx.now(),p.wall,"then follows it");
  ok("C4","the clock never runs backwards, with or without performance.now");
}
{
  const start=code.indexOf("const FSB_PAUSE_STEPS_MS"),end=code.lastIndexOf("CareerModeFirestoreBudget");assert.ok(start>0&&end>start);
  const budget=code.slice(start,end),direct=(budget.match(/Date\.now\(\)/g)||[]).length;
  assert.equal(direct,1,"only fsbNow itself reads Date.now()");
  assert.ok(/const wall=Date\.now\(\);/.test(now));
  for(const use of ["const paused=Boolean(fsbPause&&fsbNow()<fsbPause.until);","if(fsbNow()<fsbFlightRetryAt)return;","fsbFlightRetryAt=fsbNow()+60000"])assert.ok(code.includes(use),use);
  ok("C5","every pause and window the budget holds in page memory is measured on fsbNow");
}
{
  assert.ok(/if\(fsbPaused\(\)\)return Promise\.reject\(fsbQuotaError\(\)\);/.test(code),"reads are refused only while paused");
  assert.ok(/function fsbQuotaMessage\(error\)\{return fsbPaused\(\)\|\|/.test(code),"the quota line shows only while paused (or for a quota error)");
  ok("C6","reads are refused, and the quota line shows, only while the pause really runs");
}
{
  const w=page();w.ctx.trip();assert.equal(w.mark(),"paused");assert.deepEqual(w.events,[true]);
  w.jump(11*MIN);assert.equal(w.mark(),"paused","the timer has not run");
  assert.equal(w.ctx.paused(),false);w.run();assert.equal(w.mark(),null,"the first check that finds the pause over clears the mark");assert.deepEqual(w.events,[true,false],"and tells the screens once");
  w.ctx.paused();w.run();w.ahead(11*MIN);w.run();assert.deepEqual(w.events,[true,false],"the late timer and later checks add nothing");
  const n2=page();n2.ctx.trip();n2.ahead(10*MIN+100);assert.deepEqual(n2.events,[true,false],"a pause that ends on time is told once, by its timer");n2.ctx.paused();n2.run();assert.deepEqual(n2.events,[true,false]);
  ok("C7","a lagging resume timer: the first check that finds the pause over tells the screens once");
}
console.log(`PASS r100 budget clock contracts (${n} checks)`);
