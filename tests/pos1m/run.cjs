"use strict";
// POS1M Ring 1 runner: N seeded stories on a pool of worker threads (one per core), optionally one shard of many.
//   node tests/pos1m/run.cjs --stories 50000 --workers 4 --shard 1/3 --seed 1 --out pos1m-ring1.json
// Story seeds are first..first+stories-1; shard k of n takes every n-th seed. Exit 1 on any law violation or crash.
// Each failure is shrunk to a replay file (tests/pos1m/replays/) by tests/pos1m/shrink.cjs, not here.
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
const FAILURES_KEPT=200;// a report keeps the first 200 failing stories (every one is still counted in failed)

function args(argv){
  const out={stories:200,workers:Math.max(1,Math.min(os.availableParallelism?os.availableParallelism():os.cpus().length,8)),shard:"1/1",seed:1,out:null,kind:null,quiet:false,shrink:false};
  for(let i=0;i<argv.length;i+=1){
    const key=argv[i].replace(/^--/,""),value=argv[i+1];
    if(key==="quiet"){out.quiet=true;continue;}
    if(key==="shrink"){out.shrink=true;continue;}
    if(!(key in out))throw new Error(`unknown option ${argv[i]}`);
    out[key]=["stories","workers","seed"].includes(key)?Number(value):value;i+=1;
  }
  const [k,n]=String(out.shard).split("/").map(Number);
  if(!(n>=1&&k>=1&&k<=n))throw new Error(`bad --shard ${out.shard}`);
  out.shardIndex=k;out.shardCount=n;
  return out;
}

async function shrinkFailures(failures,kind=null){
  const {execFileSync}=require("node:child_process");
  const seen=new Set();
  for(const f of failures){
    const law=f.violations&&f.violations[0]?f.violations[0].law:null;
    if(!law||seen.has(law)||seen.size>=5||!Number.isInteger(f.seed))continue;
    seen.add(law);
    try{console.log(execFileSync(process.execPath,[require("node:path").join(__dirname,"shrink.cjs"),"--seed",String(f.seed),"--law",law,...(kind?["--kind",kind]:[])],{encoding:"utf8",timeout:600_000}));}
    catch(error){console.log(`shrink of seed ${f.seed} (${law}) failed: ${String(error.stdout||error.message).slice(-400)}`);}
  }
}

if(isMainThread){
  const options=args(process.argv.slice(2));
  const seeds=[];
  for(let s=options.seed;s<options.seed+options.stories;s+=1)if((s-options.seed)%options.shardCount===options.shardIndex-1)seeds.push(s);
  const started=Date.now();
  const total={stories:0,failed:0,kinds:{},cells:new Set(),failures:[],playedMs:0,writes:0,transactions:0,attempts:0};
  let running=0;
  const per=Math.ceil(seeds.length/options.workers);
  const done=()=>{
    const wallMs=Date.now()-started;
    const report={engine:"POS1M",ring:1,shard:options.shard,firstSeed:options.seed,stories:total.stories,failed:total.failed,kinds:total.kinds,coverageCells:total.cells.size,cells:[...total.cells].sort(),failures:total.failures,wallMs,msPerStoryPerCore:Number((total.playedMs/Math.max(1,total.stories)).toFixed(1)),workers:options.workers,transactions:total.transactions,transactionAttempts:total.attempts,writes:total.writes};
    if(options.out)fs.writeFileSync(options.out,JSON.stringify(report,null,1));
    const {cells,...brief}=report;void cells;
    console.log(JSON.stringify({...brief,failures:brief.failures.slice(0,20)}));
    const dead=total.failures.filter(f=>f.worker!==undefined),unplayed=dead.reduce((n,f)=>n+(f.unplayed||0),0);
    if(dead.length)console.log(`FAIL POS1M Ring 1: ${dead.length} worker(s) died, ${unplayed} of ${seeds.length} stories never played (${dead.map(f=>`seeds ${f.seeds}`).join(", ")})`);
    console.log(total.failed?`FAIL POS1M Ring 1: ${total.failed-dead.length} of ${total.stories} played stories broke a law${dead.length?`, plus ${dead.length} dead worker(s)`:""}`:`PASS POS1M Ring 1: ${total.stories} stories, every law held (${total.cells.size} coverage cells, ${(wallMs/1000).toFixed(0)} s)`);
    process.exitCode=total.failed?1:0;
    // --shrink: the first failure of each law becomes a replay file + memory entry + fix brief (at most 5 per run).
    if(options.shrink&&total.failed)shrinkFailures(total.failures,options.kind).catch(error=>{console.error(error);process.exitCode=1;});
  };
  for(let w=0;w<options.workers;w+=1){
    const slice=seeds.slice(w*per,(w+1)*per);
    if(!slice.length)continue;
    running+=1;
    const worker=new Worker(__filename,{workerData:{seeds:slice,kind:options.kind},resourceLimits:WORKER_LIMITS});
    const mine={reported:0,error:null};
    worker.on("message",m=>{
      mine.reported+=1;total.stories+=1;total.kinds[m.kind]=(total.kinds[m.kind]||0)+1;total.playedMs+=m.ms;total.writes+=m.writes;total.transactions+=m.transactions;total.attempts+=m.attempts;
      for(const c of m.coverage)total.cells.add(c);
      if(m.error||m.violations.length){total.failed+=1;if(total.failures.length<FAILURES_KEPT)total.failures.push({seed:m.seed,kind:m.kind,totalSeasons:m.totalSeasons,fromSeason:m.fromSeason,violations:m.violations,error:m.error});if(!options.quiet)console.log(JSON.stringify({seed:m.seed,violations:m.violations,error:m.error}).slice(0,1200));}
    });
    // A worker that dies (out of memory: ERR_WORKER_OUT_OF_MEMORY, a crash, a non-zero exit) or ends without reporting every
    // story fails the run loudly and names the seeds it never played; its stories are never counted as passing.
    worker.on("error",error=>{mine.error=String(error&&(error.code?`${error.code}: ${error.message}`:error.stack||error));});
    worker.on("exit",code=>{
      if(code!==0||mine.error||mine.reported<slice.length){
        const missing=slice.slice(mine.reported);
        total.failed+=1;
        const failure={worker:w,seeds:`${slice[0]}..${slice[slice.length-1]}`,unplayed:missing.length,firstUnplayed:missing[0]??null,exitCode:code,error:mine.error||`worker exited with code ${code} after ${mine.reported} of ${slice.length} stories`};
        total.failures.unshift(failure);
        console.log(`FAIL POS1M worker ${w} (seeds ${failure.seeds}) died: ${failure.error}; ${missing.length} stories never played, from seed ${failure.firstUnplayed}`);
      }
      running-=1;if(!running)done();
    });
  }
}else{
  const {runStory}=require("./ring1.cjs");
  (async()=>{
    for(const seed of workerData.seeds){
      if(String(seed)===process.env.POS1M_SELFTEST_OOM){const hog=[];for(;;)hog.push(new Array(1<<16).fill(seed+0.5));}// self-test: this worker runs out of memory
      const t=process.hrtime.bigint();
      let s;
      try{s=await runStory(seed,workerData.kind?{plan:{kind:workerData.kind}}:{});}
      catch(error){parentPort.postMessage({seed,kind:"?",violations:[],error:String(error.stack||error).slice(0,2000),coverage:[],ms:0,writes:0,transactions:0,attempts:0});continue;}
      parentPort.postMessage({seed,kind:s.plan.kind,totalSeasons:s.plan.totalSeasons,fromSeason:s.plan.fromSeason,violations:s.violations,error:s.error?s.error.slice(0,2000):null,coverage:s.coverage,ms:Number(process.hrtime.bigint()-t)/1e6,writes:s.writes,transactions:s.meter?s.meter.transactions:0,attempts:s.meter?s.meter.transactionAttempts:0});
    }
  })();
}
