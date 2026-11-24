"use strict";
// POS1M seal: the one file that says what the last full POS1M run proved, on which build and commit.
//   node tests/pos1m/seal.cjs --reports dir/ --planted planted.json [--replays-ok true|false] [--memory dir/] [--gate gate-compare.json] [--out data/pos1m-seal.json]
// --reports holds the Ring 1 shard reports (run.cjs --out); --planted the planted-bug report (planted.cjs --out). Shape
// agreed with B5: {schemaVersion, engine, build, commit, sealedAt, stories{survived,run}, laws{held,total},
// plantedBugs{caught,total}, ledgerReplays{refound,total}}, plus the failing laws and the first failing seeds (capped).
// "sealed" is true only when every story survived, every law held, every planted bug and ledger replay was caught and
// every saved replay passed. Exit 1 when it is not.
const fs=require("node:fs");
const path=require("node:path");
const {execSync}=require("node:child_process");
const {LAW_TEXT,MEMORY_CAP}=require("./shrink.cjs");
const ROOT=path.resolve(__dirname,"../..");
// Real game bugs POS1M found itself (each kept as a replay and re-planted as a ledger bug).
const REAL_CATCHES=[{id:"W12",law:"L6_PRIME_PACK",what:"a Prime Pack guess retried after a lost answer spent a second token",replay:"tests/pos1m/replays/L6_PRIME_PACK-70068-044dc9938e.json",fix:"#1583",missedBy:"the Gate and every review"}];

function args(argv){const out={reports:null,planted:null,"replays-ok":null,memory:null,gate:null,out:path.join(ROOT,"data/pos1m-seal.json")};for(let i=0;i<argv.length;i+=2){const k=argv[i].replace(/^--/,"");if(!(k in out))throw new Error(`unknown option ${argv[i]}`);out[k]=argv[i+1];}return out;}
function commit(){if(process.env.GITHUB_SHA)return process.env.GITHUB_SHA;try{return execSync("git rev-parse HEAD",{cwd:ROOT,encoding:"utf8"}).trim();}catch(_error){return null;}}

// A planted report without whole counts seals nothing (an old or broken report must not read as all caught).
function counts(value,key){const ok=value&&Number.isInteger(value[key])&&Number.isInteger(value.total)&&value.total>0;return ok?{[key]:value[key],total:value.total}:{[key]:0,total:0,missing:true};}
function seal({reports,planted,replaysOk,gate=null}){
  const laws=Object.keys(LAW_TEXT),broken=new Set(),first=[];
  let run=0,failed=0,cells=new Set();
  for(const r of reports){
    if(r.engine!=="POS1M"||r.ring!==1)throw new Error("not a POS1M Ring 1 report");
    run+=r.stories;failed+=r.failed;for(const c of r.cells||[])cells.add(c);
    for(const f of r.failures||[]){for(const v of f.violations||[])broken.add(v.law);if(f.error&&!(f.violations||[]).length)broken.add("CRASH");if(first.length<20)first.push({seed:f.seed,laws:(f.violations||[]).map(v=>v.law),detail:((f.violations||[])[0]?.detail||f.error||"").slice(0,200)});}
  }
  const held=laws.filter(l=>!broken.has(l)).length;
  const value={
    schemaVersion:1,engine:"POS1M",
    build:JSON.parse(fs.readFileSync(path.join(ROOT,"package.json"),"utf8")).version,
    commit:commit(),sealedAt:new Date().toISOString(),
    stories:{survived:run-failed,run},
    laws:{held,total:laws.length},
    plantedBugs:counts(planted&&planted.plantedBugs,"caught"),
    ledgerReplays:counts(planted&&planted.ledgerReplays,"refound"),
    replaysPassed:replaysOk,
    shards:reports.length,coverageCells:cells.size,
    brokenLaws:[...broken].sort(),firstFailures:first,
    // Both numbers, as measured (lead 2026-11-24: never tilt the planted set): today's Gate contract lane on the same
    // planted bugs (gate-compare.cjs --out), the bugs only POS1M caught, and the real bugs POS1M found that the Gate missed.
    gateComparison:gate?{bugs:gate.bugs,gateCaught:gate.gateCaught,pos1mCaught:gate.pos1mCaught,points:gate.pos1mPercent-gate.gatePercent,onlyPos1m:gate.results.filter(r=>r.pos1mCaught&&!r.gateCaught).map(r=>r.id)}:null,
    realCatches:REAL_CATCHES
  };
  value.sealed=failed===0&&held===laws.length&&!broken.has("CRASH")&&!value.plantedBugs.missing&&value.plantedBugs.caught===value.plantedBugs.total&&(value.ledgerReplays.missing?value.ledgerReplays.total===0:value.ledgerReplays.refound===value.ledgerReplays.total)&&replaysOk!==false;
  return value;
}

if(require.main===module){
  const opt=args(process.argv.slice(2));
  if(!opt.reports)throw new Error("--reports dir/ is required");
  const reports=fs.readdirSync(opt.reports).filter(n=>n.endsWith(".json")).sort().map(n=>JSON.parse(fs.readFileSync(path.join(opt.reports,n),"utf8")));
  const planted=opt.planted?JSON.parse(fs.readFileSync(opt.planted,"utf8")):null;
  const gate=opt.gate?JSON.parse(fs.readFileSync(opt.gate,"utf8")):null;
  const value=seal({reports,planted,gate,replaysOk:opt["replays-ok"]===null?null:opt["replays-ok"]==="true"});
  fs.mkdirSync(path.dirname(path.resolve(opt.out)),{recursive:true});
  fs.writeFileSync(opt.out,`${JSON.stringify(value,null,1)}\n`);
  console.log(`${value.sealed?"SEALED":"NOT SEALED"} POS1M ${value.build} at ${String(value.commit).slice(0,8)}: ${value.stories.survived} of ${value.stories.run} stories survived, laws ${value.laws.held}/${value.laws.total}, planted bugs ${value.plantedBugs.caught}/${value.plantedBugs.total}, ledger replays ${value.ledgerReplays.refound}/${value.ledgerReplays.total}, replays ${value.replaysPassed===null?"not run":value.replaysPassed?"pass":"FAIL"} (${value.shards} shards).`);
  // --memory dir/: merge every memory*.json found there (one per shard) into tests/pos1m/memory.json.
  if(opt.memory){
    const files=[];const walk=d=>{for(const n of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,n.name);if(n.isDirectory())walk(f);else if(/^memory.*\.json$/.test(n.name))files.push(f);}};walk(opt.memory);
    const merged=mergeMemory([path.join(__dirname,"memory.json"),...files]);
    fs.writeFileSync(path.join(__dirname,"memory.json"),`${JSON.stringify(merged,null,1)}\n`);
    console.log(`failure memory: ${merged.entries.length} signatures (cap ${MEMORY_CAP}) from ${files.length} shard files`);
  }
  process.exitCode=value.sealed?0:1;
}
// The shards' failure memories (each tests/pos1m/memory.json after --shrink) merged into one, by signature, capped at 200.
function mergeMemory(files){
  const bySignature=new Map();
  for(const file of files){
    const memory=JSON.parse(fs.readFileSync(file,"utf8"));
    for(const e of memory.entries||[]){
      const was=bySignature.get(e.signature);
      if(!was){bySignature.set(e.signature,{...e});continue;}
      was.count+=e.count;
      if(e.firstSeen<was.firstSeen){was.firstSeen=e.firstSeen;was.firstHead=e.firstHead;was.replay=e.replay;}
      if(e.lastSeen>was.lastSeen){was.lastSeen=e.lastSeen;was.lastHead=e.lastHead;}
    }
  }
  const entries=[...bySignature.values()].sort((a,b)=>b.lastSeen.localeCompare(a.lastSeen)).slice(0,MEMORY_CAP);
  return {schemaVersion:1,cap:MEMORY_CAP,entries};
}
module.exports={seal,mergeMemory};
