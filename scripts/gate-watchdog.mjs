// Showdown Gate watchdog: classify a completed Showdown Gate run and re-run only jobs that GitHub
// never let reach a test (no machine, lost runner, setup died). A started TEST: step that did not
// succeed is a real failure and is never re-run. At most 2 automatic re-runs per head (attempt <= 3).
// Shadow phase: this script refuses to act on any workflow other than Showdown Gate.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const GATE_WORKFLOW_NAME='Showdown Gate';
export const GATE_WORKFLOW_PATH='.github/workflows/showdown-gate.yml';
export const GATE_WORKFLOW_FILE='showdown-gate.yml';
export const SEAL_JOB_NAME='seal';
export const MAX_ATTEMPTS=3;
export const MAX_AUTOMATIC_RERUNS=MAX_ATTEMPTS-1;
export const RUNNER_LOSS=/was not acquired by Runner|lost communication with the server|lost communication/i;
const OK=new Set(['success','skipped','neutral']);

export const isTestStep=step=>/^TEST:/.test(String(step?.name||''));
export const isSealStep=step=>/^SEAL:/.test(String(step?.name||''));
export function stepStarted(step){
  if(!step)return false;
  if(step.status==='in_progress')return true;
  if(step.status!=='completed')return false;
  if(step.conclusion==='skipped'||step.conclusion===null||step.conclusion===undefined)return false;
  return Boolean(step.started_at)||step.conclusion==='success'||step.conclusion==='failure';
}
function runnerLost(job,annotations){
  const notes=(annotations&&annotations[job.id])||[];
  return notes.some(note=>RUNNER_LOSS.test(String(note?.message??note)));
}
// Per-job verdict: 'ok' | 'test' | 'infra'.
export function classifyJob(job,annotations={}){
  const steps=Array.isArray(job.steps)?job.steps:[];
  const testSteps=steps.filter(isTestStep).filter(stepStarted);
  if(testSteps.some(step=>step.conclusion==='failure'))return {verdict:'test',reason:`TEST step failed: ${testSteps.find(step=>step.conclusion==='failure').name}`};
  const unfinished=testSteps.filter(step=>step.conclusion!=='success');
  if(OK.has(String(job.conclusion))&&!unfinished.length)return {verdict:'ok'};
  if(unfinished.length){
    if(runnerLost(job,annotations))return {verdict:'infra',reason:`runner lost during ${unfinished[0].name}`};
    return {verdict:'test',reason:`TEST step started and did not succeed: ${unfinished[0].name} (${unfinished[0].conclusion??unfinished[0].status})`};
  }
  if(OK.has(String(job.conclusion)))return {verdict:'ok'};
  return {verdict:'infra',reason:`${job.name}: ${job.conclusion||job.status} before any TEST step started${runnerLost(job,annotations)?' (runner not acquired / lost)':''}`};
}

// classifyRun is pure: callers pass the run, its latest-attempt jobs, optional annotations by job id,
// the live PR head (null for push runs), and retries already used on this head across runs.
export function classifyRun({run,jobs=[],annotations={},prHeadSha=null,headGone=false,sealJobName=SEAL_JOB_NAME,maxAttempts=MAX_ATTEMPTS,retriesUsedForHead=0}){
  const attempt=Number(run?.run_attempt||1);
  const retries=Math.max(attempt-1,Number(retriesUsedForHead||0));
  const base={run_id:run?.id??null,head_sha:run?.head_sha??null,run_attempt:attempt,retries_used:retries,action:'none',reasons:[]};
  const done=(classification,extra={})=>({...base,classification,...extra,reasons:[...base.reasons,...(extra.reasons||[])]});
  if(!run||run.status!=='completed')return done('PENDING',{reasons:['run not completed']});
  if(run.conclusion==='success')return done('PASS');
  if(run.event==='pull_request'){
    if(headGone)return done('SUPERSEDED',{reasons:['PR branch no longer exists']});
    if(prHeadSha&&prHeadSha!==run.head_sha)return done('SUPERSEDED',{reasons:[`PR head is ${prHeadSha}`]});
    if(!prHeadSha)return done('UNKNOWN',{reasons:['live PR head could not be resolved; refusing to act']});
  }
  const lanes=jobs.filter(job=>job.name!==sealJobName);
  const seal=jobs.find(job=>job.name===sealJobName)||null;
  if(lanes.length&&lanes.every(job=>job.conclusion==='skipped'))return done('DRAFT',{reasons:['every lane skipped (draft PR)']});
  const anyRunnerLoss=jobs.some(job=>runnerLost(job,annotations));
  if(run.conclusion==='cancelled'&&!anyRunnerLoss)return done('CANCELLED',{reasons:['run cancelled without runner-loss evidence']});
  const verdicts=jobs.map(job=>({job,...classifyJob(job,annotations)}));
  const tests=verdicts.filter(v=>v.verdict==='test'&&v.job.name!==sealJobName);
  if(tests.length)return done('TEST_FAILURE',{reasons:tests.map(v=>v.reason),failing_jobs:tests.map(v=>v.job.name)});
  const laneInfra=verdicts.filter(v=>v.verdict==='infra'&&v.job.name!==sealJobName);
  let infra=laneInfra;
  if(!infra.length&&seal&&!OK.has(String(seal.conclusion))){
    const started=(seal.steps||[]).some(step=>isSealStep(step)&&stepStarted(step));
    if(started&&!runnerLost(seal,annotations))return done('TEST_FAILURE',{reasons:['seal verification failed with every lane green'],failing_jobs:[seal.name]});
    infra=[{job:seal,reason:`seal ${seal.conclusion||seal.status} before verification started`}];
  }
  if(!infra.length)return done('UNKNOWN',{reasons:[`run ${run.conclusion} without a classifiable failing job`]});
  const reasons=infra.map(v=>v.reason);
  if(retries>=maxAttempts-1)return done('INFRA_EXHAUSTED',{reasons,failing_jobs:infra.map(v=>v.job.name)});
  return done('INFRA',{action:'rerun-failed-jobs',reasons,failing_jobs:infra.map(v=>v.job.name)});
}

export function isGateRun(run){
  return Boolean(run)&&run.name===GATE_WORKFLOW_NAME&&String(run.path||'').replace(/@.*$/,'')===GATE_WORKFLOW_PATH;
}

export function githubClient({token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN,api=process.env.GITHUB_API_URL||'https://api.github.com'}={}){
  if(!token)throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
  async function request(method,endpoint,{allow=[]}={}){
    const response=await fetch(`${api}/${endpoint.replace(/^\//,'')}`,{method,headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'showdown-gate-watchdog'}});
    if(allow.includes(response.status))return {status:response.status,body:null};
    if(!response.ok)throw new Error(`${method} ${endpoint} -> ${response.status} ${await response.text()}`);
    const text=await response.text();
    return {status:response.status,body:text?JSON.parse(text):null};
  }
  return {get:(e,o)=>request('GET',e,o).then(r=>r.body),getRaw:(e,o)=>request('GET',e,o),post:(e,o)=>request('POST',e,o)};
}

export async function gatherRun(client,repo,runId){
  const run=await client.get(`repos/${repo}/actions/runs/${runId}`);
  const jobs=(await client.get(`repos/${repo}/actions/runs/${runId}/jobs?filter=latest&per_page=100`))?.jobs||[];
  const annotations={};
  for(const job of jobs){
    if(OK.has(String(job.conclusion)))continue;
    try{annotations[job.id]=(await client.get(`repos/${repo}/check-runs/${job.id}/annotations?per_page=50`))||[];}
    catch(error){annotations[job.id]=[];process.stderr.write(`annotations unavailable for job ${job.id}: ${error.message.split('\n')[0]}\n`);}
  }
  let prHeadSha=null;let headGone=false;
  if(run.event==='pull_request'){
    if(run.head_repository?.full_name===repo&&run.head_branch){
      const ref=await client.getRaw(`repos/${repo}/git/ref/heads/${encodeURIComponent(run.head_branch)}`,{allow:[404]});
      if(ref.status===404)headGone=true;else prHeadSha=ref.body?.object?.sha||null;
    }else prHeadSha=run.pull_requests?.[0]?.head?.sha||null;
  }
  const sameHead=(await client.get(`repos/${repo}/actions/workflows/${GATE_WORKFLOW_FILE}/runs?head_sha=${run.head_sha}&per_page=100`))?.workflow_runs||[];
  const retriesUsedForHead=sameHead.reduce((sum,other)=>sum+Math.max(0,Number(other.run_attempt||1)-1),0);
  return {run,jobs,annotations,prHeadSha,headGone,retriesUsedForHead};
}

export async function handleRun(client,repo,runId,{dryRun=false}={}){
  const gathered=await gatherRun(client,repo,runId);
  if(!isGateRun(gathered.run))return {run_id:Number(runId),classification:'IGNORED',action:'none',reasons:[`not a ${GATE_WORKFLOW_NAME} run (${gathered.run?.name} ${gathered.run?.path}); the shadow watchdog never acts on other workflows`]};
  const result=classifyRun(gathered);
  if(result.action==='rerun-failed-jobs'&&!dryRun){
    const response=await client.post(`repos/${repo}/actions/runs/${runId}/rerun-failed-jobs`,{allow:[403,409]});
    result.rerun_status=response.status;
    if(response.status!==201)result.reasons.push(`rerun not accepted (HTTP ${response.status}); another attempt may already be running`);
  }
  if(dryRun&&result.action!=='none')result.action=`${result.action} (dry-run)`;
  return result;
}

export async function sweep(client,repo,{sinceMinutes=180,dryRun=false,now=Date.now()}={}){
  const listed=(await client.get(`repos/${repo}/actions/workflows/${GATE_WORKFLOW_FILE}/runs?status=completed&per_page=50`))?.workflow_runs||[];
  const recent=listed.filter(run=>run.conclusion!=='success'&&now-Date.parse(run.updated_at)<=sinceMinutes*60000);
  const results=[];
  for(const run of recent)results.push(await handleRun(client,repo,run.id,{dryRun}));
  return results;
}

function report(results){
  for(const result of results)process.stdout.write(`${JSON.stringify({schema:'showdown-gate-watchdog/v1',...result})}\n`);
  if(process.env.GITHUB_STEP_SUMMARY){
    const rows=results.map(r=>`| ${r.run_id} | ${r.head_sha?String(r.head_sha).slice(0,10):''} | ${r.run_attempt??''} | ${r.classification} | ${r.action} | ${(r.reasons||[]).join('; ').replace(/\|/g,'/')} |`);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,['### Showdown Gate watchdog','','| run | head | attempt | class | action | reasons |','|---|---|---|---|---|---|',...(rows.length?rows:['| - | - | - | nothing to do | none | |']),''].join('\n'));
  }
}

async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;let runId=null;let doSweep=false;let dryRun=false;let sinceMinutes=180;
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--repo')repo=argv[++i];
    else if(argv[i]==='--run-id')runId=argv[++i];
    else if(argv[i]==='--sweep')doSweep=true;
    else if(argv[i]==='--dry-run')dryRun=true;
    else if(argv[i]==='--since-minutes')sinceMinutes=Number(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if(!repo||!/^[^/\s]+\/[^/\s]+$/.test(repo))throw new Error('--repo owner/name is required');
  if(!runId&&!doSweep)throw new Error('--run-id or --sweep is required');
  const client=githubClient();
  const results=runId?[await handleRun(client,repo,runId,{dryRun})]:await sweep(client,repo,{sinceMinutes,dryRun});
  report(results);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
