"use strict";
// POS1M Ring 3 meter contracts: synthetic phone timelines through tests/browser/support/ring3-meter.cjs summarize().
//   T1 a screen change made under the Reus Gate is ready when the gate clears (A -> tap -> B/loading -> B/ready)
//   T2 a screen that shows and then has the gate rise on it within 300 ms is ready only when that gate clears
//   T3 a plain change with no gate is timed from the tap
//   T4 a change with no own tap is timed from the rival's last tap
//   T5 step costs use only the play windows and price a listener attached on one step and delivered on the next once
//   T6 the CONTINUE of season k counts for season k+1 in the minutes outside FIFA
//   T7 a slow transition (31 s) is kept at its full duration, so a slower step can never improve the p90
//   T9 a CONTINUE before a season that is never played (Showdown ended early) counts on the season before, not as a season
//   T8 timing budgets cover only the play windows: page-check transitions outside them do not dilute the p90
const assert=require("node:assert/strict");
const path=require("node:path");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const ring3=require("../browser/support/ring3-meter.cjs");
const billed=require("../browser/support/billed-meter.cjs");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};

const st=(user,t,screen,loading=false)=>({k:"state",user,t,screen,loading});
const tap=(user,t,screen)=>({k:"tap",user,t,id:"x",screen});
const boot=(user,t)=>({k:"boot",user,t});

{
  const ev=[boot("daniel",0),st("daniel",10,"A"),tap("daniel",5000,"A"),st("daniel",5040,"B",true),st("daniel",5900,"B",false)];
  const r=ring3.summarize({events:ev});
  assert.deepEqual(r.tapToReady["A -> B"],{n:1,median:900,p90:900,max:900});
  assert.equal(r.reusHold.B.median,860);
  ok("T1","a change made under the gate is ready when the gate clears (900 ms)");
}
{
  const ev=[boot("daniel",0),st("daniel",10,"A"),tap("daniel",5000,"A"),st("daniel",5050,"B"),st("daniel",5100,"B",true),st("daniel",6200,"B")];
  const r=ring3.summarize({events:ev});
  assert.deepEqual(r.tapToReady["A -> B"],{n:1,median:1200,p90:1200,max:1200});
  ok("T2","a screen whose gate rises within 300 ms is ready when that gate clears (1200 ms, not 50 ms)");
}
{
  const ev=[boot("daniel",0),st("daniel",10,"A"),tap("daniel",5000,"A"),st("daniel",5080,"C")];
  const r=ring3.summarize({events:ev});
  assert.deepEqual(r.tapToReady["A -> C"],{n:1,median:80,p90:80,max:80});
  ok("T3","a plain change is timed from the tap");
}
{
  const ev=[boot("daniel",0),boot("nik",0),st("daniel",10,"A"),st("nik",10,"A"),tap("daniel",5000,"A"),st("daniel",5100,"B"),st("nik",5700,"B")];
  const r=ring3.summarize({events:ev});
  assert.deepEqual(r.rivalToScreen.B,{n:1,median:700,p90:700,max:700});
  ok("T4","a move the rival's tap carried is timed from that tap (700 ms)");
}
{
  // The billed model reads the composed production Rules; build them first when this tree has none (a fresh checkout).
  if(!fs.existsSync(billed.RULES_FILE))for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,encoding:"utf8"});assert.equal(built.status,0,`${script} failed: ${built.stderr}`);}
  const model=billed.loadModel();
  const rid=`pair_${"1".repeat(64)}`,p=`rivalries/${rid}/careerStart/authoritative`;
  const ev=[boot("daniel",0),st("daniel",10,"A"),tap("daniel",5000,"A"),st("daniel",5100,"B")];
  const meterEvents=[
    {k:"read",op:"tx",path:p,n:1,t:100,user:"daniel"},// sign-in time: outside the play window
    {k:"listener",path:p,t:4000,user:"daniel"},// attached on A
    {k:"read",op:"listen",path:p,n:1,t:5200,user:"daniel"}// first delivery on B
  ];
  const attribute=(evs,all,key)=>billed.attribute(model,evs,all,key);
  const r=ring3.summarize({events:ev,meterEvents,playWindows:[[1000,9000]],meterEntries:[{billed:{measured:{billed:0,docReads:0,rulesReads:0,rulesOnWrites:0,writes:0}}}],attribute});
  const whole=billed.price(model,meterEvents.slice(1));
  const sum=Object.values(r.steps).reduce((a,s)=>a+s.billedPerSeason,0);
  assert.equal(sum,whole.billed,`steps ${JSON.stringify(r.steps)} vs one stream ${whole.billed}`);
  ok("T5",`step costs keep to the play windows and price the listener once (${sum} billed, as one stream)`);
}
{
  const phases=[{phase:"S-start",ms:60000},{phase:"S-setup",ms:60000},{phase:"S-S1-transfers",ms:60000},{phase:"S-S1-continue",ms:120000},{phase:"S-S2-results",ms:60000},{phase:"pages-S.S1",ms:600000}];
  assert.deepEqual(ring3.seasonMinutes(phases),[{season:"S/S1",minutes:3},{season:"S/S2",minutes:3}]);
  ok("T6","season k's CONTINUE counts for season k+1; page checks are left out");
}
{
  const ev=[boot("daniel",0),st("daniel",10,"A"),tap("daniel",5000,"A"),st("daniel",36000,"B"),tap("daniel",40000,"B"),st("daniel",40050,"C")];
  const r=ring3.summarize({events:ev});
  assert.deepEqual(r.tapToReady["A -> B"],{n:1,median:31000,p90:31000,max:31000});
  assert.equal(r.all.tapToReady.max,31000);
  ok("T7","a 31 s transition is kept at 31 s (p90 31,000 ms, not dropped)");
}
{
  const ev=[boot("daniel",0),st("daniel",10,"A"),tap("daniel",5000,"A"),st("daniel",6000,"B")];
  let t=20000;for(let i=0;i<19;i++){ev.push(tap("daniel",t,i%2?"C":"B"),st("daniel",t+10,i%2?"B":"C"));t+=1000;}
  const r=ring3.summarize({events:ev,playWindows:[[4000,10000]]});
  assert.deepEqual(r.all.tapToReady,{n:1,median:1000,p90:1000,max:1000});
  assert.equal(r.samples.tapToReady.length,20);
  ok("T8","the play-window budget sees the one 1,000 ms game transition, not 19 page-check ones (all samples kept in the report)");
}
{
  const phases=[{phase:"C-setup",ms:60000},{phase:"C-S1-transfers",ms:60000},{phase:"C-S1-continue",ms:60000},{phase:"C-end-showdown",ms:60000}];
  assert.deepEqual(ring3.seasonMinutes(phases),[{season:"C/S1",minutes:3}]);
  ok("T9","an early-ended Showdown's last CONTINUE counts on season 1; no unplayed season 2 in the average");
}
console.log(`PASS POS1M Ring 3 meter contracts (${n} checks)`);
