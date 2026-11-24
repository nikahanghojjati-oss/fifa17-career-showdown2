// Ironman leg (Phoenix W10): runs one L7 job of the Showdown Gate, or one job of the Ironman full matrix, with a seed.
//   node scripts/ironman-leg.mjs --leg <fault|ce2pg> --seed <n> [--seasons 3|10] [--out result.json]
// A leg is one fault of tests/browser/fault-injection-journey.cjs (FIJ_FAULT=<leg>, FIJ_SEED, FIJ_SEASONS) or the CE2PG
// journey (CE2PG_PLAN=single CE2PG_SEASONS=<seasons>, the seed picks CE2PG_RUN 1-3). A failure runs the same leg again ONCE
// with the same seed:
//   PASS   the first run passed
//   FLAKY  the first run failed and the rerun passed: the leg is green, but it is listed by the seal and must be filed and
//          fixed (never skipped)
//   FAIL   both runs failed: red
// The first attempt's reports move to test-results/attempt-1/ so both stay in the uploaded artifact. The result file holds
// the seed and a one-command replay. Test database only (each run starts its own emulators); never touches production.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const FIJ_FAULTS=Object.freeze(['none','network','lock','evict','reload','tabkill','twotabs','quota','coldoffline']);
export const LEGS=Object.freeze([...FIJ_FAULTS,'ce2pg']);
export const SEASONS=Object.freeze([3,10]);

export function legPlan({leg,seed,seasons=3}){
  if(!LEGS.includes(leg))throw new Error(`unknown Ironman leg ${leg} (one of ${LEGS.join(', ')})`);
  if(!Number.isSafeInteger(seed)||seed<0)throw new Error(`the seed must be a whole number 0 or more (got ${seed})`);
  if(!SEASONS.includes(seasons))throw new Error(`seasons must be ${SEASONS.join(' or ')} (got ${seasons})`);
  if(leg==='ce2pg'){
    const run=1+(seed%3);
    const env={CE2PG_PLAN:'single',CE2PG_SEASONS:String(seasons),CE2PG_RUN:String(run)};
    return {leg,seed,seasons,script:'tests/browser/ce2pg-journey.cjs',env,replay:`CE2PG_PLAN=single CE2PG_SEASONS=${seasons} CE2PG_RUN=${run} node tests/browser/ce2pg-journey.cjs`};
  }
  const env={FIJ_FAULT:leg,FIJ_SEED:String(seed),FIJ_SEASONS:String(seasons)};
  return {leg,seed,seasons,script:'tests/browser/fault-injection-journey.cjs',env,replay:`FIJ_FAULT=${leg} FIJ_SEED=${seed} FIJ_SEASONS=${seasons} node tests/browser/fault-injection-journey.cjs`};
}

// verdict from the exit codes of the attempts (at most two).
export function verdictOf(exits){
  if(!exits.length)return 'FAIL';
  if(exits[0]===0)return 'PASS';
  return exits.length>1&&exits[1]===0?'FLAKY':'FAIL';
}

function moveAttempt(outDir,attempt){
  const target=path.join(outDir,`attempt-${attempt}`);
  if(!fs.existsSync(outDir))return;
  fs.mkdirSync(target,{recursive:true});
  for(const name of fs.readdirSync(outDir)){if(/^attempt-\d+$/.test(name))continue;fs.renameSync(path.join(outDir,name),path.join(target,name));}
}

export function runLeg({leg,seed,seasons=3,out=null,command=null,env=process.env,log=console.log,outDir=path.join(root,'test-results')}){
  const plan=legPlan({leg,seed,seasons});
  const attempts=[];
  for(let attempt=1;attempt<=2;attempt+=1){
    const started=Date.now();
    log(`IRONMAN ${leg} attempt ${attempt}: ${plan.replay}`);
    const [bin,...args]=command||[process.execPath,plan.script];
    const result=spawnSync(bin,args,{cwd:root,stdio:'inherit',env:{...env,...plan.env}});
    const exit=result.status===null?1:result.status;
    attempts.push({attempt,exit,ms:Date.now()-started});
    log(`IRONMAN ${leg} attempt ${attempt}: exit ${exit} in ${Math.round((Date.now()-started)/1000)} s`);
    if(exit===0)break;
    if(attempt===1)moveAttempt(outDir,1);
  }
  const verdict=verdictOf(attempts.map(a=>a.exit));
  const record={schema:'ironman-leg/v1',leg,seed,seasons,verdict,attempts,replay:plan.replay,finishedAt:new Date().toISOString()};
  if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,`${JSON.stringify(record,null,2)}\n`);}
  if(env.GITHUB_STEP_SUMMARY)fs.appendFileSync(env.GITHUB_STEP_SUMMARY,`### Ironman ${leg}: ${verdict}\n\nSeed ${seed}, ${seasons} seasons, ${attempts.length} attempt(s).\n\nReplay: \`${plan.replay}\`\n\n`);
  if(verdict==='FLAKY')log(`::warning title=Ironman FLAKY ${leg}::passed only on the rerun with seed ${seed}. File it and fix it. Replay: ${plan.replay}`);
  if(verdict==='FAIL')log(`::error title=Ironman FAIL ${leg}::failed twice with seed ${seed}. Replay: ${plan.replay}`);
  log(`IRONMAN ${leg}: ${verdict} (seed ${seed}, ${seasons} seasons) -> replay: ${plan.replay}`);
  return record;
}

function args(argv){
  const outArgs={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--'))throw new Error(`Unexpected argument: ${argv[i]}`);
    outArgs[argv[i].slice(2)]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;
  }
  return outArgs;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const opts=args(process.argv.slice(2));
    const seed=Number(opts.seed);
    const record=runLeg({leg:String(opts.leg||''),seed,seasons:Number(opts.seasons||3),out:opts.out||null});
    process.exitCode=record.verdict==='FAIL'?1:0;
  }catch(error){console.error(error.message);process.exitCode=2;}
}
