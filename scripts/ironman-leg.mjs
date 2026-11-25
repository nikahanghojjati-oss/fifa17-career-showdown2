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
export const FIJ_FAULTS=Object.freeze(['none','network','lock','evict','reload','tabkill','twotabs','quota','coldoffline','swap','skew','double','listener','lostreply','tapkill']);
export const LEGS=Object.freeze([...FIJ_FAULTS,'ce2pg']);
export const SEASONS=Object.freeze([3,10]);

// epilogue=false (Showdown Gate on a PR that changes no pairing, Home, Settings or sync file) stops the journey after the
// Showdown it plays: the epilogue points (home-join, end-showdown, sacked, unpair) run in the full matrix and on such PRs.
export function legPlan({leg,seed,seasons=3,epilogue=true}){
  if(!LEGS.includes(leg))throw new Error(`unknown Ironman leg ${leg} (one of ${LEGS.join(', ')})`);
  if(!Number.isSafeInteger(seed)||seed<0)throw new Error(`the seed must be a whole number 0 or more (got ${seed})`);
  if(!SEASONS.includes(seasons))throw new Error(`seasons must be ${SEASONS.join(' or ')} (got ${seasons})`);
  if(leg==='ce2pg'){
    const run=1+(seed%3);
    const env={CE2PG_PLAN:'single',CE2PG_SEASONS:String(seasons),CE2PG_RUN:String(run)};
    return {leg,seed,seasons,script:'tests/browser/ce2pg-journey.cjs',env,replay:`CE2PG_PLAN=single CE2PG_SEASONS=${seasons} CE2PG_RUN=${run} node tests/browser/ce2pg-journey.cjs`};
  }
  if(typeof epilogue!=='boolean')throw new Error(`epilogue must be true or false (got ${epilogue})`);
  const env={FIJ_FAULT:leg,FIJ_SEED:String(seed),FIJ_SEASONS:String(seasons),...(epilogue?{}:{FIJ_EPILOGUE:'0'})};
  return {leg,seed,seasons,epilogue,script:'tests/browser/fault-injection-journey.cjs',env,replay:`${fijPrefix({leg,seed,seasons,epilogue})} node tests/browser/fault-injection-journey.cjs`};
}
const fijPrefix=({leg,seed,seasons,epilogue=true,only=null})=>`${epilogue?'':'FIJ_EPILOGUE=0 '}FIJ_FAULT=${leg} FIJ_SEED=${seed} FIJ_SEASONS=${seasons}${only?` FIJ_ONLY=${only}`:''}`;
export function fijReplay(o){return `${fijPrefix(o)} node tests/browser/fault-injection-journey.cjs`;
}

// The failed points of the last attempt's journey report, each with a one-command replay of that point alone (FIJ_ONLY keeps
// every other point fault-free; the seed keeps the phone, the timings and the picks of that point).
export function failuresOf({leg,seed,seasons,outDir,epilogue=true}){
  let names=[];try{names=fs.readdirSync(outDir).filter(name=>name.startsWith(`fij-${leg}-`)&&name.endsWith('.json')&&!name.endsWith('.emulators.json'));}catch{return [];}
  const out=[];
  for(const name of names){
    let report=null;try{report=JSON.parse(fs.readFileSync(path.join(outDir,name),'utf8'));}catch{continue;}
    for(const p of report?.points||[])if(!p.pass)out.push({point:p.point,phone:p.phone,checks:(p.checks||[]).filter(c=>!c.pass).map(c=>c.id),replay:fijReplay({leg,seed,seasons,epilogue,only:p.point})});
    if(report?.fatal&&!out.some(f=>f.point===report.fatal.point))out.push({point:report.fatal.point||'?',phone:'-',checks:['fatal'],replay:fijReplay({leg,seed,seasons,epilogue})});
    const end=(report?.endChecks||[]).filter(c=>!c.pass).map(c=>c.id);
    if(end.length)out.push({point:'end',phone:'-',checks:end,replay:fijReplay({leg,seed,seasons,epilogue})});
  }
  return out;
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

export function runLeg({leg,seed,seasons=3,epilogue=true,out=null,command=null,env=process.env,log=console.log,outDir=path.join(root,'test-results')}){
  const plan=legPlan({leg,seed,seasons,epilogue});
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
  // A FLAKY leg's points are the failed first attempt's (its reports moved to attempt-1/; Codex on #1579), so the finding
  // names the point, its owner and its own replay; a FAIL leg's are the last attempt's.
  const failures=leg==='ce2pg'?[]:verdict==='FLAKY'?failuresOf({leg,seed,seasons,outDir:path.join(outDir,'attempt-1'),epilogue}).map(f=>({...f,attempt:1})):failuresOf({leg,seed,seasons,outDir,epilogue});
  const record={schema:'ironman-leg/v1',leg,seed,seasons,epilogue:leg==='ce2pg'?null:epilogue,verdict,attempts,replay:plan.replay,failures,finishedAt:new Date().toISOString()};
  if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,`${JSON.stringify(record,null,2)}\n`);}
  const failureLines=failures.map(f=>`- ${f.point} (${f.phone}): ${f.checks.join(', ')}. Replay: \`${f.replay}\``);
  if(env.GITHUB_STEP_SUMMARY)fs.appendFileSync(env.GITHUB_STEP_SUMMARY,`### Ironman ${leg}: ${verdict}\n\nSeed ${seed}, ${seasons} seasons${leg==='ce2pg'?'':epilogue?', with the epilogue':', epilogue off (no pairing, Home, Settings or sync file changed)'}, ${attempts.length} attempt(s).\n\nReplay: \`${plan.replay}\`\n\n${failureLines.length?`Failed points (${verdict==='FLAKY'?'first attempt, passed on the rerun':'last attempt'}):\n\n${failureLines.join('\n')}\n\n`:''}`);
  for(const line of failureLines)log(`IRONMAN ${leg} failed point ${line.slice(2)}`);
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
    // --epilogue true|false (the Gate route's l7_heavy); anything else is refused, and leaving it out keeps the epilogue.
    const epilogue=opts.epilogue===undefined?true:opts.epilogue==='true'?true:opts.epilogue==='false'?false:(()=>{throw new Error(`--epilogue must be true or false (got ${opts.epilogue})`);})();
    const record=runLeg({leg:String(opts.leg||''),seed,seasons:Number(opts.seasons||3),epilogue,out:opts.out||null});
    process.exitCode=record.verdict==='FAIL'?1:0;
  }catch(error){console.error(error.message);process.exitCode=2;}
}
