"use strict";
// R94-05 scratch driver: runs the R93-08 sweep's flows with the lookup-cap recorder and prints, per kind of write, the
// worst distinct Rules lookups for the whole request (cap 20) and per written document (cap 10).
const fs=require("node:fs");const os=require("node:os");const path=require("node:path");const {spawnSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../../../../..");
const RECORDER=path.join(__dirname,"lookup-recorder.cjs");
const SUITES=[
  ["tests/firebase/two-manager-journey-emulator.cjs",{CMS_SHOWDOWN_LENGTH:process.env.LK_LENGTH||"10"}],
  ["tests/firebase/transfer-lock-budget-emulator.cjs",{LOCK_BUDGET_QUICK:"1"}],
  ["tests/firebase/prime-pack-ten-season-emulator.cjs",{}],
  ["tests/firebase/sacked-rules-emulator.cjs",{}],
  ["tests/firebase/europa-league-rules-emulator.cjs",{}],
  ["tests/firebase/chamber-men-rules-emulator.cjs",{}],
  ["tests/firebase/squad-sheets-rules-emulator.cjs",{}],
  ["tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs",{}],
  ["tests/firebase/shared-terminal-close-production-provider-emulator.cjs",{}],
  ["tests/firebase/career-index-emulator.cjs",{}],
  ["tests/firebase/r94-club-draw-rules-emulator.cjs",{}]
];
const only=process.env.LK_ONLY;
const dir=process.env.LK_OUT_DIR||fs.mkdtempSync(path.join(os.tmpdir(),"lk-sweep-"));fs.mkdirSync(dir,{recursive:true});
const records=[];
for(const [file,env] of SUITES){
  if(only&&!only.split(",").some(o=>file.includes(o)))continue;
  const out=path.join(dir,`${path.basename(file)}.jsonl`);if(fs.existsSync(out))fs.unlinkSync(out);
  const started=Date.now();
  const r=spawnSync(process.execPath,["-r",RECORDER,file],{cwd:ROOT,encoding:"utf8",maxBuffer:256*1024*1024,env:{...process.env,...env,REPO_ROOT:ROOT,RULES_BUDGET_SWEEP_OUT:out,RULES_BUDGET_SWEEP_SUITE:path.basename(file)}});
  console.log(`SUITE ${path.basename(file)} exit=${r.status} ${Math.round((Date.now()-started)/1000)}s`);
  if(r.status!==0)console.log(r.stdout.slice(-1500)+r.stderr.slice(-3000));
  if(fs.existsSync(out))for(const line of fs.readFileSync(out,"utf8").split("\n"))if(line.trim())records.push(JSON.parse(line));
}
const kinds=new Map();
for(const r of records){
  if(r.inSuite!=="accepted")continue;
  if(!kinds.has(r.kind))kinds.set(r.kind,{kind:r.kind,writes:0,total:0,perDoc:{},flags:new Set(),suites:new Set(),nOps:r.nOps});
  const k=kinds.get(r.kind);k.writes++;k.suites.add(r.suite);
  if(r.replayRefused){k.flags.add("REPLAY-REFUSED "+r.replayRefused.slice(-120));continue;}
  if(typeof r.total==="number")k.total=Math.max(k.total,r.total);else k.flags.add(String(r.total));
  for(const [p,v] of Object.entries(r.perDoc||{})){if(typeof v==="number")k.perDoc[p]=Math.max(k.perDoc[p]??0,v);else k.flags.add(`${p}:${v}`);}
  if(r.exprLimited)k.flags.add("exprLimited "+JSON.stringify(r.exprLimited));
  if(r.totalExprAt!==undefined)k.flags.add("totalExprAt "+r.totalExprAt);
  if(r.totalBinds)k.flags.add("totalBinds");
}
const list=[...kinds.values()].sort((a,b)=>(b.total/(b.nOps>1?20:10))-(a.total/(a.nOps>1?20:10)));
for(const k of list){
  const worstDoc=Math.max(0,...Object.values(k.perDoc));
  console.log(`LOOKUPS total=${String(k.total).padStart(2)}/${k.nOps>1?20:10} worstDoc=${worstDoc}/10 writes=${k.writes} :: ${k.kind} :: ${JSON.stringify(k.perDoc)}${k.flags.size?" :: FLAGS "+[...k.flags].join("; "):""}`);
}
fs.writeFileSync(path.join(dir,"lookup-report.json"),JSON.stringify(list.map(k=>({...k,flags:[...k.flags],suites:[...k.suites]})),null,2));
console.log("REPORT "+path.join(dir,"lookup-report.json"));
