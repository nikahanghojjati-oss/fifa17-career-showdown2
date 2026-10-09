// gate-yield: lets low-priority workflows (poller, board jobs) step aside while a check is waiting for a
// machine. Prints "yield" when any Showdown Gate or Validate POS20 job is queued, otherwise "proceed".
// Always exits 0 on a decision (callers branch on the output or on the `yield` step output); exits 1 only
// when GitHub cannot be read, so a caller can choose to yield on error too.
//   node scripts/gate-yield.mjs [--repo owner/name]
//   - id: gate
//     run: node scripts/gate-yield.mjs
//   - if: steps.gate.outputs.yield != 'true'
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient} from './gate-watchdog.mjs';

export const PRIORITY_WORKFLOWS=Object.freeze([
  {name:'Showdown Gate',file:'showdown-gate.yml'},
  {name:'Validate POS20',file:'validate-pos10.yml'}
]);

// Pure decision: runs is [{workflow, run, jobs}] for runs that are queued/waiting/in_progress.
export function decideYield(runs){
  const waiting=[];
  for(const {workflow,run,jobs} of runs){
    if(['queued','waiting','pending','requested'].includes(run.status)){waiting.push(`${workflow} run ${run.id} ${run.status}`);continue;}
    for(const job of jobs||[])if(['queued','waiting','pending'].includes(job.status))waiting.push(`${workflow} run ${run.id} job "${job.name}" ${job.status}`);
  }
  return {decision:waiting.length?'yield':'proceed',waiting};
}

export async function gatherPriorityRuns(client,repo){
  const out=[];
  for(const workflow of PRIORITY_WORKFLOWS){
    for(const status of ['queued','in_progress']){
      const runs=(await client.get(`repos/${repo}/actions/workflows/${workflow.file}/runs?status=${status}&per_page=50`))?.workflow_runs||[];
      for(const run of runs){
        const jobs=status==='in_progress'?((await client.get(`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))?.jobs||[]):[];
        out.push({workflow:workflow.name,run,jobs});
      }
    }
  }
  return out;
}

async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;
  for(let i=0;i<argv.length;i++){if(argv[i]==='--repo')repo=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`);}
  if(!repo||!/^[^/\s]+\/[^/\s]+$/.test(repo))throw new Error('--repo owner/name is required');
  const result=decideYield(await gatherPriorityRuns(githubClient(),repo));
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`yield=${result.decision==='yield'}\n`);
  for(const line of result.waiting)process.stderr.write(`${line}\n`);
  console.log(result.decision);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
