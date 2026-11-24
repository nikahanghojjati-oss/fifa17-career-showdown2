"use strict";
// The fault x write point table of the fault-injection journey (tests/browser/fault-injection-journey.cjs), and its reads rule:
// a fault run may not cost more than 2.5 x the fault-free run with the same phone order (+100), and no point more than
// 3 x its fault-free reads (+60). Used by the journey's own orchestrator (every fault in one process tree) and by the Ironman
// full matrix workflow (scripts/ironman-matrix.mjs), where every fault ran in its own job.
const fs=require("node:fs");
const path=require("node:path");

// results: [{fault, phone, code}] (exit codes); each report is read from <outDir>/fij-<fault>-<phone>.json unless given as r.report.
function buildMatrix({results,outDir,points,log=()=>{},write=true}){
  const matrix={};
  for(const r of results){
    let rep=r.report||null;
    if(!rep){const file=path.join(outDir,`fij-${r.fault}-${r.phone}.json`);try{rep=JSON.parse(fs.readFileSync(file,"utf8"));}catch(_e){}}
    matrix[`${r.fault}/${r.phone}`]={exit:r.code,verdict:rep?.verdict||"NO REPORT",seed:rep?.seed??null,seasons:rep?.seasons??null,points:rep?.points||[],end:rep?.endChecks||[],fatal:rep?.fatal||null,reads:rep?.readsTotal??null};
  }
  const head=`| fault | ${points.join(" | ")} | end |`;
  log(`\nFAULT x WRITE POINT (phone in brackets)\n${head}\n|${"---|".repeat(points.length+2)}`);
  for(const [key,v] of Object.entries(matrix)){
    const cell=p=>{const x=v.points.find(q=>q.point===p);return x?`${x.pass?"PASS":"FAIL"} (${x.phone[0].toUpperCase()})`:"-";};
    log(`| ${key} | ${points.map(cell).join(" | ")} | ${v.verdict==="PASS"?"PASS":v.end.filter(e=>!e.pass).length?"FAIL":v.verdict} |`);
  }
  // Reads: a fault run may not cost more than 2.5 x the fault-free run (the same phone order), point by point and in total.
  for(const [key,v] of Object.entries(matrix)){
    const base=matrix[`none/${key.split("/")[1]}`];if(!base||key.startsWith("none/"))continue;
    v.readsVsBaseline={total:v.reads,baseline:base.reads};
    if(base.reads&&v.reads>2.5*base.reads+100){v.verdict="FAIL";v.end.push({id:"reads.vsBaseline",pass:false,detail:`${v.reads} reads vs ${base.reads} without faults`});}
    for(const p of v.points){const b=base.points.find(q=>q.point===p.point);if(b&&p.readsPoint>3*b.readsPoint+60){p.pass=false;p.checks.push({id:"reads.vsBaseline",pass:false,detail:`${p.readsPoint} reads at this point vs ${b.readsPoint} without faults`});v.verdict="FAIL";}}
  }
  if(write){fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,"fij-matrix.json"),JSON.stringify(matrix,null,2));}
  const bad=Object.values(matrix).filter(v=>v.verdict!=="PASS");
  log(`\n${bad.length?"FAIL":"PASS"} fault-injection journey: ${Object.keys(matrix).length-bad.length}/${Object.keys(matrix).length} runs pass -> ${path.join(path.basename(outDir),"fij-matrix.json")}`);
  return {matrix,bad};
}

module.exports={buildMatrix};
