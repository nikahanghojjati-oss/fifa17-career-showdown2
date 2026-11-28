"use strict";
// POS1M planted-bug run: every planted bug (tests/pos1m/planted/*.json) must be caught by Ring 1.
//   node tests/pos1m/planted.cjs [--only id,id] [--stories 300] [--workers 4] [--out file.json]
// For each bug a fresh worker installs the change, then plays seeded stories (the same seed list for every bug, whole
// Showdowns first so every length and Sacked position is reached early) until it has CATCHES catching stories or runs
// out. A bug is caught when a story breaks a law or crashes. It also checks the bar "each law has one planted bug that
// only it catches": for each bug, the laws broken in every catching story are recorded. A bug that needs a rare race
// (two phones acting within one round trip) names its own story count ("stories": N), the floor for that bug only.
const os=require("node:os");
const fs=require("node:fs");
const {Worker,isMainThread,parentPort,workerData}=require("node:worker_threads");
// Each tab runs its own copy of the budget layer (tests/pos1m/budget.cjs: one compiled page factory, a fresh page object
// per tab). Those pages are cheap garbage, but V8 lets a worker's old space grow to its default limit (about 4 GB) before
// it collects them, so four workers outgrew a 16 GB runner after ~5,000 stories each. A 1 GB old space keeps a worker
// under ~300 MB (live data is under 100 MB) at no measurable speed cost.
// POS1M_WORKER_HEAP_MB and POS1M_SELFTEST_OOM are for stand-in check 17 only (a starved worker must fail loudly); the
// Gate never sets them.
const WORKER_LIMITS=Object.freeze({maxOldGenerationSizeMb:Number(process.env.POS1M_WORKER_HEAP_MB)||1024});// env: the check that a starved worker fails loudly
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
    const worker=new Worker(__filename,{workerData:{bug,seeds:seedList(Math.max(opt.stories,bug&&bug.stories||0))},resourceLimits:WORKER_LIMITS});
    // A worker that dies (out of memory, a crash, a non-zero exit) or ends without its answer counts as a MISSED bug (or a
    // failed baseline), loudly, never as a pass.
    let answered=false,died=null;
    worker.on("message",m=>{answered=true;results.push(m);});
    worker.on("error",e=>{died=String(e&&(e.code?`${e.code}: ${e.message}`:e.stack||e));});
    worker.on("exit",code=>{
      if(!answered||died||code!==0){
        const id=bug?bug.id:"baseline",error=`worker died: ${died||`exit code ${code}`}`;
        const prior=results.find(r=>r.id===id);
        if(prior){prior.caught=false;prior.error=error;prior.died=true;}
        else results.push({id,law:bug&&bug.law,caught:false,died:true,stories:0,catches:[],error});
      }
      active-=1;next();
    });
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
    const expected=opt.baseline?1:bugs.length;
    if(results.length!==expected||results.some(r=>r.died)){console.log(`FAIL POS1M planted run: ${results.filter(r=>r.died).map(r=>`${r.id} ${r.error}`).join("; ")||`${results.length} of ${expected} answers`}`);process.exitCode=1;return;}
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
      if(String(seed)===process.env.POS1M_SELFTEST_OOM){const hog=[];for(;;)hog.push(new Array(1<<16).fill(seed+0.5));}// self-test: this worker runs out of memory
      let s;
      try{s=await runStory(seed);}catch(error){catches.push({seed,laws:[],error:String(error.message||error).slice(0,300)});if(catches.length>=CATCHES)break;continue;}
      if(s.error||s.violations.length){catches.push({seed,laws:s.violations.map(v=>v.law).sort(),detail:(s.violations[0]&&s.violations[0].detail||s.error||"").slice(0,300)});if(catches.length>=CATCHES)break;}
    }
    parentPort.postMessage({id:bug?bug.id:"baseline",law:bug?bug.law:null,caught:catches.length>0,stories,catches});
  })();
}

module.exports={seedList};
