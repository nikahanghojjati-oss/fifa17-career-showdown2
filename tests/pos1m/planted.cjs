"use strict";
// POS1M planted-bug run: every planted bug (tests/pos1m/planted/*.json) must be caught by Ring 1.
//   node tests/pos1m/planted.cjs [--only id,id] [--stories 300] [--workers 4] [--out file.json]
// For each bug a fresh worker installs the change, then plays seeded stories (the same seed list for every bug, whole
// Showdowns first so every length and Sacked position is reached early) until it has CATCHES catching stories or runs
// out. A bug is caught when a story breaks a law or crashes. It also checks the bar "each law has one planted bug that
// only it catches": for each bug, the laws broken in every catching story are recorded.
const os=require("node:os");
const fs=require("node:fs");
const {Worker,isMainThread,parentPort,workerData}=require("node:worker_threads");
const CATCHES=3;

function seedList(count){
  // Whole Showdowns (seed % 20 === 0 rotates lengths and Sacked) interleaved with chapters.
  const fulls=Array.from({length:16},(_,i)=>(i+1)*20+40_000);
  const out=[];let chapter=40_001;
  for(let i=0;out.length<count;i+=1){if(i%4===0&&fulls.length)out.push(fulls.shift());else{while(chapter%20===0)chapter+=1;out.push(chapter++);}}
  return out;
}

if(isMainThread){
  const argv=process.argv.slice(2),opt={only:null,stories:300,workers:Math.min(8,os.availableParallelism?os.availableParallelism():os.cpus().length),out:null,baseline:false};
  for(let i=0;i<argv.length;i+=1){const k=argv[i].replace(/^--/,"");if(k==="baseline"){opt.baseline=true;continue;}opt[k]=k==="only"?argv[i+1].split(","):["stories","workers"].includes(k)?Number(argv[i+1]):argv[i+1];i+=1;}
  const Mutant=require("./mutant.cjs");
  let bugs=Mutant.list();
  if(opt.only)bugs=bugs.filter(b=>opt.only.includes(b.id));
  for(const bug of bugs)Mutant.mutatedFiles(bug);// every planted bug still applies at this head
  const queue=opt.baseline?[null]:[...bugs],results=[],ledgerIds=new Set(bugs.filter(b=>b.ledger).map(b=>b.id));
  let active=0;const started=Date.now();
  const next=()=>{
    if(!queue.length){if(!active)finish();return;}
    const bug=queue.shift();active+=1;
    const worker=new Worker(__filename,{workerData:{bug,seeds:seedList(opt.stories)}});
    worker.on("message",m=>results.push(m));
    worker.on("error",e=>results.push({id:bug?bug.id:"baseline",law:bug&&bug.law,caught:false,error:String(e.stack||e)}));
    worker.on("exit",()=>{active-=1;next();});
  };
  const finish=()=>{
    results.sort((a,b)=>a.id.localeCompare(b.id));
    for(const r of results)console.log(`${r.caught?"CAUGHT":"MISSED"} ${r.id} (${r.law}) after ${r.stories} stories: ${r.catches.map(c=>`seed ${c.seed} ${c.laws.join("+")||"crash"}`).join("; ")||r.error||"no law broke"}`);
    // Laws justified: a law is justified by a bug whose every catch names that law alone.
    const sole=new Map();
    for(const r of results)if(r.caught){const sets=r.catches.map(c=>c.laws);const only=sets.every(s=>s.length===1&&s[0]===sets[0][0])?sets[0][0]:null;if(only&&!sole.has(only))sole.set(only,r.id);}
    const caught=results.filter(r=>r.caught).length;
    // Ledger replays (a "ledger" key: a confirmed Fable/Sol fix reverted) are counted on their own for the seal.
    const ledger=results.filter(r=>ledgerIds.has(r.id));
    const report={engine:"POS1M",kind:opt.baseline?"baseline":"planted",total:results.length,caught,plantedBugs:{caught:caught-ledger.filter(r=>r.caught).length,total:results.length-ledger.length},ledgerReplays:{refound:ledger.filter(r=>r.caught).length,total:ledger.length},results,soleCatchers:Object.fromEntries(sole),wallMs:Date.now()-started};
    if(!opt.baseline)console.log(`ledger replays re-found: ${report.ledgerReplays.refound} of ${report.ledgerReplays.total}`);
    if(opt.out)fs.writeFileSync(opt.out,JSON.stringify(report,null,1));
    console.log(`laws with a planted bug only they catch: ${[...sole.keys()].sort().join(", ")||"none"}`);
    if(opt.baseline){const r=results[0];console.log(r&&!r.caught?`PASS POS1M baseline: the unchanged game breaks no law in ${r.stories} stories`:`FAIL POS1M baseline: the unchanged game broke a law`);process.exitCode=r&&!r.caught?0:1;return;}
    console.log(caught===results.length?`PASS POS1M planted bugs: ${caught} of ${results.length} caught`:`FAIL POS1M planted bugs: ${caught} of ${results.length} caught`);
    process.exitCode=caught===results.length?0:1;
  };
  for(let i=0;i<opt.workers;i+=1)next();
}else{
  const {bug,seeds}=workerData;
  if(bug)require("./mutant.cjs").install(bug);
  const {runStory}=require("./ring1.cjs");
  (async()=>{
    const catches=[];let stories=0;
    for(const seed of seeds){
      stories+=1;
      let s;
      try{s=await runStory(seed);}catch(error){catches.push({seed,laws:[],error:String(error.message||error).slice(0,300)});if(catches.length>=CATCHES)break;continue;}
      if(s.error||s.violations.length){catches.push({seed,laws:s.violations.map(v=>v.law).sort(),detail:(s.violations[0]&&s.violations[0].detail||s.error||"").slice(0,300)});if(catches.length>=CATCHES)break;}
    }
    parentPort.postMessage({id:bug?bug.id:"baseline",law:bug?bug.law:null,caught:catches.length>0,stories,catches});
  })();
}

module.exports={seedList};
