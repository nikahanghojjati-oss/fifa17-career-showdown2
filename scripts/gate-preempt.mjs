// gate-preempt: checks get machines first. When any Validate POS20, Validate Gameplay Fast or Showdown
// Gate job has waited for a machine for more than 60 seconds, cancel in-progress runs of the low-priority
// helper workflows on the explicit allowlist below, and nothing else. leads-relay-ping is never cancelled
// (it would drop wake-ups). A helper that is mid-push (a step named like Commit or Push in progress, or its
// jobs unknown) is skipped this sweep; the next sweep catches it. Never fails its caller: errors are logged
// and the script exits 0.
//   node scripts/gate-preempt.mjs [--repo owner/name] [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient} from './gate-watchdog.mjs';

export const CHECK_WORKFLOWS=Object.freeze(['Validate POS20','Validate Gameplay Fast','Showdown Gate']);
export const HELPER_ALLOWLIST=Object.freeze(['Gameplay factory progress poller','Factory board tick','Gameplay factory board auto-update']);
export const NEVER_CANCEL=Object.freeze(['leads-relay-ping']);
export const STARVED_AFTER_MS=60*1000;
const WAITING=new Set(['queued','waiting','pending','requested']);
// A step whose name says it commits or pushes. While one is in progress the helper may be writing a ref.
export const MID_PUSH_STEP=/\b(?:commit|push)/i;
// jobs undefined/null = not observed: treated as mid-push (fail safe, skip this sweep).
export function midPush(jobs){
  if(!Array.isArray(jobs))return {busy:true,reason:'jobs not observed'};
  for(const job of jobs){
    if(MID_PUSH_STEP.test(String(job?.name||''))&&job?.status==='in_progress'&&!(job.steps||[]).length)return {busy:true,reason:`job "${job.name}" in progress`};
    for(const step of job?.steps||[])if(step?.status==='in_progress'&&MID_PUSH_STEP.test(String(step.name||'')))return {busy:true,reason:`step "${job.name} / ${step.name}" in progress`};
  }
  return {busy:false};
}

// runs: [{run, jobs}] for queued and in-progress runs. Returns the check jobs/runs starved > 60 s.
export function starvedChecks(runs,now=Date.now()){
  const starved=[];
  for(const {run,jobs} of runs){
    if(!CHECK_WORKFLOWS.includes(run.name))continue;
    if(WAITING.has(run.status)&&now-Date.parse(run.created_at)>STARVED_AFTER_MS){starved.push(`${run.name} run ${run.id} ${run.status} since ${run.created_at}`);continue;}
    for(const job of jobs||[]){
      const since=job.created_at||job.started_at;
      if(WAITING.has(job.status)&&since&&now-Date.parse(since)>STARVED_AFTER_MS)starved.push(`${run.name} run ${run.id} job "${job.name}" ${job.status} since ${since}`);
    }
  }
  return starved;
}
const allowlisted=run=>run.status==='in_progress'&&HELPER_ALLOWLIST.includes(run.name)&&!NEVER_CANCEL.includes(run.name)&&!CHECK_WORKFLOWS.includes(run.name);
// Only in-progress runs whose workflow name is on the allowlist and that are not mid-push; never a check,
// never leads-relay-ping.
export function helpersToCancel(runs){
  return runs.filter(({run,jobs})=>allowlisted(run)&&!midPush(jobs).busy).map(({run})=>run);
}
export function decidePreempt(runs,now=Date.now()){
  const starved=starvedChecks(runs,now);
  if(!starved.length)return {starved,cancel:[],skipped:[]};
  const skipped=runs.filter(({run})=>allowlisted(run)).map(({run,jobs})=>({id:run.id,name:run.name,...midPush(jobs)})).filter(h=>h.busy).map(({id,name,reason})=>({id,name,reason:`mid-push, left for the next sweep: ${reason}`}));
  return {starved,cancel:helpersToCancel(runs).map(run=>({id:run.id,name:run.name})),skipped};
}
const jobsOf=async(client,repo,id)=>(await client.get(`repos/${repo}/actions/runs/${id}/jobs?filter=latest&per_page=100`))?.jobs;

export async function gatherActiveRuns(client,repo){
  const out=[];
  for(const status of ['queued','in_progress']){
    const runs=(await client.get(`repos/${repo}/actions/runs?status=${status}&per_page=100`))?.workflow_runs||[];
    for(const run of runs){
      let jobs=[];
      if(status==='in_progress'&&CHECK_WORKFLOWS.includes(run.name))jobs=(await jobsOf(client,repo,run.id))||[];
      else if(allowlisted(run)){try{jobs=await jobsOf(client,repo,run.id);}catch{jobs=undefined;}}
      out.push({run,jobs});
    }
  }
  return out;
}

export async function preempt(client,repo,{dryRun=false,now=Date.now()}={}){
  const decision=decidePreempt(await gatherActiveRuns(client,repo),now);
  const cancelled=[];
  for(const target of decision.cancel){
    // Re-assert the allowlist at the point of action.
    if(!HELPER_ALLOWLIST.includes(target.name)||NEVER_CANCEL.includes(target.name))continue;
    // Look again right before cancelling: a helper that started committing or pushing meanwhile is skipped.
    let fresh;try{fresh=await jobsOf(client,repo,target.id);}catch{fresh=undefined;}
    const busy=midPush(fresh);
    if(busy.busy){decision.skipped.push({...target,reason:`mid-push, left for the next sweep: ${busy.reason}`});continue;}
    if(dryRun){cancelled.push({...target,status:'dry-run'});continue;}
    const response=await client.post(`repos/${repo}/actions/runs/${target.id}/cancel`,{allow:[409]});
    cancelled.push({...target,status:response.status});
  }
  return {schema:'showdown-gate-preempt/v1',starved:decision.starved,cancelled,skipped:decision.skipped};
}

async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;let dryRun=false;let out=null;
  for(let i=0;i<argv.length;i++){if(argv[i]==='--repo')repo=argv[++i];else if(argv[i]==='--dry-run')dryRun=true;else if(argv[i]==='--out')out=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`);}
  if(!repo||!/^[^/\s]+\/[^/\s]+$/.test(repo))throw new Error('--repo owner/name is required');
  const result=await preempt(githubClient(),repo,{dryRun});
  console.log(JSON.stringify(result));
  if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,`${JSON.stringify(result,null,2)}\n`);}
  if(process.env.GITHUB_STEP_SUMMARY&&result.cancelled.length)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`### Helpers preempted for starved checks\n\n${result.cancelled.map(c=>`- ${c.name} run ${c.id} (${c.status})`).join('\n')}\n`);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(`gate-preempt skipped: ${error.message}`);process.exitCode=0;});
}
