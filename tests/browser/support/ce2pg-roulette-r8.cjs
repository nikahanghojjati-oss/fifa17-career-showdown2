"use strict";
// R8 for the CE2PG roulette observer report: per season, the shared transfer window is first seen open (WINDOW_OPEN) only after
// both phones' roulette (stage or panel) is gone. Usage: node tests/browser/support/ce2pg-roulette-r8.cjs test-results/<tag>-roulette.json
// The last season is not covered: its samples come after the last waitForTransfer pull.
const r=require(require("node:path").resolve(process.argv[2]));let bad=0;
const ep={};
for(const [role,v] of Object.entries(r.byRole)){const s=v.samples.slice().sort((a,b)=>a.t-b.t);const out=[];let spinEnd=null,inOpen=false;
 for(const x of s){if(x.stage||x.panel){spinEnd=x.t;inOpen=false;}
  if(x.phase==="WINDOW_OPEN"&&!inOpen){out.push({open:x.t,spinEnd,season:x.season});inOpen=true;}
  if(x.phase==="COMPLETED")inOpen=false;}
 ep[role]=out;}
const n=Math.max(...Object.values(ep).map(e=>e.length));
for(let i=0;i<n;i++){const a=ep.playerOne[i],b=ep.playerTwo[i];const firstOpen=Math.min(a?.open??Infinity,b?.open??Infinity),lastSpin=Math.max(a?.spinEnd??0,b?.spinEnd??0);
 console.log(`season ${i+1}: last spin panel gone by ${new Date(lastSpin).toISOString().slice(11,23)}, window first seen open ${new Date(firstOpen).toISOString().slice(11,23)} -> ${firstOpen>=lastSpin?"OK":"OPENED BEFORE BOTH SPINS"}`);if(firstOpen<lastSpin)bad+=1;}
process.exitCode=bad?1:0;
