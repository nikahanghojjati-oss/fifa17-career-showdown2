"use strict";
// POS1M Ring 1 runner: N seeded stories on a pool of worker threads (one per core), optionally one shard of many.
//   node tests/pos1m/run.cjs --stories 50000 --workers 4 --shard 1/3 --seed 1 --out pos1m-ring1.json
// Story seeds are first..first+stories-1; shard k of n takes every n-th seed. Exit 1 on any law violation or crash.
// Each failure is shrunk to a replay file (tests/pos1m/replays/) by tests/pos1m/shrink.cjs, not here.
const os=require("node:os");
const fs=require("node:fs");
const {Worker,isMainThread,parentPort,workerData}=require("node:worker_threads");
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

async function shrinkFailures(failures){
  const {execFileSync}=require("node:child_process");
  const seen=new Set();
  for(const f of failures){
    const law=f.violations&&f.violations[0]?f.violations[0].law:null;
    if(!law||seen.has(law)||seen.size>=5||!Number.isInteger(f.seed))continue;
    seen.add(law);
    try{console.log(execFileSync(process.execPath,[require("node:path").join(__dirname,"shrink.cjs"),"--seed",String(f.seed),"--law",law],{encoding:"utf8",timeout:600_000}));}
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
    console.log(total.failed?`FAIL POS1M Ring 1: ${total.failed} of ${total.stories} stories broke a law`:`PASS POS1M Ring 1: ${total.stories} stories, every law held (${total.cells.size} coverage cells, ${(wallMs/1000).toFixed(0)} s)`);
    process.exitCode=total.failed?1:0;
    // --shrink: the first failure of each law becomes a replay file + memory entry + fix brief (at most 5 per run).
    if(options.shrink&&total.failed)shrinkFailures(total.failures).catch(error=>{console.error(error);process.exitCode=1;});
  };
  for(let w=0;w<options.workers;w+=1){
    const slice=seeds.slice(w*per,(w+1)*per);
    if(!slice.length)continue;
    running+=1;
    const worker=new Worker(__filename,{workerData:{seeds:slice,kind:options.kind}});
    worker.on("message",m=>{
      total.stories+=1;total.kinds[m.kind]=(total.kinds[m.kind]||0)+1;total.playedMs+=m.ms;total.writes+=m.writes;total.transactions+=m.transactions;total.attempts+=m.attempts;
      for(const c of m.coverage)total.cells.add(c);
      if(m.error||m.violations.length){total.failed+=1;if(total.failures.length<FAILURES_KEPT)total.failures.push({seed:m.seed,kind:m.kind,totalSeasons:m.totalSeasons,fromSeason:m.fromSeason,violations:m.violations,error:m.error});if(!options.quiet)console.log(JSON.stringify({seed:m.seed,violations:m.violations,error:m.error}).slice(0,1200));}
    });
    worker.on("error",error=>{total.failed+=1;total.failures.push({worker:w,error:String(error.stack||error)});});
    worker.on("exit",()=>{running-=1;if(!running)done();});
  }
}else{
  const {runStory}=require("./ring1.cjs");
  (async()=>{
    for(const seed of workerData.seeds){
      const t=process.hrtime.bigint();
      let s;
      try{s=await runStory(seed,workerData.kind?{plan:{kind:workerData.kind}}:{});}
      catch(error){parentPort.postMessage({seed,kind:"?",violations:[],error:String(error.stack||error).slice(0,2000),coverage:[],ms:0,writes:0,transactions:0,attempts:0});continue;}
      parentPort.postMessage({seed,kind:s.plan.kind,totalSeasons:s.plan.totalSeasons,fromSeason:s.plan.fromSeason,violations:s.violations,error:s.error?s.error.slice(0,2000):null,coverage:s.coverage,ms:Number(process.hrtime.bigint()-t)/1e6,writes:s.writes,transactions:s.meter?s.meter.transactions:0,attempts:s.meter?s.meter.transactionAttempts:0});
    }
  })();
}
