"use strict";
// R94-05 scratch: writes tests/browser/ce2pg-r94-idle.cjs (untracked, never committed to gameplay/r94), a copy of ce2pg-journey.cjs
// with idle probes: at chosen wait points both phones' screens go off for R94_IDLE_MIN minutes, and after the last Showdown the
// phones sit on the final screen and then on Home, screen on and screen off. Billed reads (documents + Rules lookups) per hour.
//   R94_IDLE_MIN=3  R94_IDLE_POINTS=wait:results-entry,wait:transfer-window,wait:continue,end:final,end:home  R94_IDLE_SEASONS=2
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../../../../..");
let src=fs.readFileSync(path.join(root,"tests/browser/ce2pg-journey.cjs"),"utf8");
const rep=(find,put)=>{if(src.split(find).length!==2)throw new Error("needle must exist once: "+find.slice(0,80));src=src.replace(find,put);};
rep(`const unlockRuns=[];`,`const unlockRuns=[];
const R94_MIN=Number(process.env.R94_IDLE_MIN||0),R94_POINTS=(process.env.R94_IDLE_POINTS||"").split(",").filter(Boolean),R94_SEASONS=(process.env.R94_IDLE_SEASONS||"").split(",").filter(Boolean).map(Number);
const R94_ON=Number(process.env.R94_IDLE_ON||0);
const r94Rows=[];
async function r94Idle(label){
  if(!R94_MIN||!R94_POINTS.includes(label))return;
  if(label.startsWith("wait:")&&R94_SEASONS.length&&!R94_SEASONS.includes(seasonNow))return;
  const {daniel,nik}=ctxRef;
  const stat=async m=>m.page.evaluate(()=>{try{const b=window.CareerModeFirestoreBudget?.stats?.();return b?{brakeSince:b.brakeSince||0,trips:b.brakeTrips||0,listeners:b.listenersAttached||0}:null;}catch(_e){return null;}}).catch(()=>null);
  const win=async(state,ms)=>{const a=Date.now();await daniel.page.waitForTimeout(ms);const b=Date.now();const p=priceWindow(a,b);
    const row={label,season:seasonNow,state,min:Math.round((b-a)/600)/100,billed:p.billed,docReads:p.docReads,writes:p.writes,perHour:Math.round(p.billed/((b-a)/3600000)),daniel:p.byUser.daniel.billed,nik:p.byUser.nik.billed,top:billedMeter.top(p.byPath,5),modules:billedMeter.top(p.byModule,4),brake:{daniel:await stat(daniel),nik:await stat(nik)}};
    r94Rows.push(row);report.r94Idle=r94Rows;console.log("R94IDLE "+JSON.stringify(row));};
  // R94_IDLE_ON=N: N screen-on windows in a row and nothing else (used with a shortened session life to watch an idle
  // visible phone cross the session expiry).
  if(R94_ON){for(let i=1;i<=R94_ON;i++)await win("screen-on-"+i,R94_MIN*60000);return;}
  if(label.startsWith("end:"))await win("screen-on",R94_MIN*60000);
  await setHidden(daniel,true);await setHidden(nik,true);
  await win("screen-off",R94_MIN*60000);
  await setHidden(daniel,false);await setHidden(nik,false);
  await win("back-on-first-45s",45000);
}`);
rep(`  await unlockProbe(point);\n}`,`  await unlockProbe(point);\n  await r94Idle("wait:"+point);\n}`);
rep(`    showdownNow="end";seasonNow=0;`,`    showdownNow="end";seasonNow=0;
    if(R94_MIN){await r94Idle("end:final");for(const m of [daniel,nik])await backToShowdownHome(m).catch(()=>{});await r94Idle("end:home");}`);
const out=process.argv[2]||"tests/browser/ce2pg-r94-idle.cjs";
fs.writeFileSync(path.join(root,out),src);
console.log("WROTE "+out);
