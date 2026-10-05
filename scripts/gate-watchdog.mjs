// Showdown Gate Physio (the check watchdog): classify a completed Showdown Gate, Validate POS20 or
// Validate Gameplay Fast run and re-run only jobs that GitHub never let reach a test (no machine, lost
// runner, setup died). A test step
// that started and did not succeed is a real failure and is never re-run. At most 2 automatic re-runs per
// head (attempt <= 3). Superseded heads get nothing. Any other workflow is refused (IGNORED).
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

// Steps that only prepare a machine. In Validate POS20 / Gameplay Fast (no TEST: prefix) every other
// step counts as a test step: a job with one started non-setup step has started its tests.
export const SETUP_STEP=/^(?:Set up job|Complete job|Post .+|Run actions\/(?:checkout|setup-node|setup-java|cache|upload-artifact|download-artifact)@v\d+|Run npm ci|npm ci|Install locked dependencies|Install pinned Firebase emulator test dependencies|Restore Firebase emulator(?: and npx)? caches?)$/;
export const isTestStep=step=>/^TEST:/.test(String(step?.name||''));
export const isSealStep=step=>/^SEAL:/.test(String(step?.name||''));
export const isNonSetupStep=step=>!SETUP_STEP.test(String(step?.name||''));
export const WATCHED_WORKFLOWS=Object.freeze([
  Object.freeze({name:'Showdown Gate',path:'.github/workflows/showdown-gate.yml',file:'showdown-gate.yml',sealJobName:'seal',testStep:isTestStep,sealStep:isSealStep,anyStartedIsTest:false}),
  Object.freeze({name:'Validate POS20',path:'.github/workflows/validate-pos10.yml',file:'validate-pos10.yml',sealJobName:'POS20 exact-head cognitive seal',testStep:isNonSetupStep,sealStep:isNonSetupStep,anyStartedIsTest:true}),
  Object.freeze({name:'Validate Gameplay Fast',path:'.github/workflows/validate-gameplay-fast.yml',file:'validate-gameplay-fast.yml',sealJobName:null,testStep:isNonSetupStep,sealStep:isNonSetupStep,anyStartedIsTest:true})
]);
export function profileFor(run){
  if(!run)return null;
  const runPath=String(run.path||'').replace(/@.*$/,'');
  return WATCHED_WORKFLOWS.find(profile=>profile.name===run.name&&profile.path===runPath)||null;
}
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
// anyStartedIsTest (POS20 / Gameplay Fast): a failed job with any started non-setup step has started its
// tests and is never re-run unless the runner was lost.
export function classifyJob(job,annotations={},testStep=isTestStep,anyStartedIsTest=false){
  const steps=Array.isArray(job.steps)?job.steps:[];
  const testSteps=steps.filter(testStep).filter(stepStarted);
  if(testSteps.some(step=>step.conclusion==='failure'))return {verdict:'test',reason:`test step failed: ${job.name} / ${testSteps.find(step=>step.conclusion==='failure').name}`};
  const unfinished=testSteps.filter(step=>step.conclusion!=='success');
  if(OK.has(String(job.conclusion))&&!unfinished.length)return {verdict:'ok'};
  if(anyStartedIsTest&&testSteps.length&&!OK.has(String(job.conclusion))&&!unfinished.length&&!runnerLost(job,annotations))return {verdict:'test',reason:`${job.name}: ${job.conclusion} after test steps ran (${testSteps[testSteps.length-1].name})`};
  if(unfinished.length){
    if(runnerLost(job,annotations))return {verdict:'infra',reason:`runner lost during ${job.name} / ${unfinished[0].name}`};
    return {verdict:'test',reason:`test step started and did not succeed: ${job.name} / ${unfinished[0].name} (${unfinished[0].conclusion??unfinished[0].status})`};
  }
  if(OK.has(String(job.conclusion)))return {verdict:'ok'};
  return {verdict:'infra',reason:`${job.name}: ${job.conclusion||job.status} before any test step started${runnerLost(job,annotations)?' (runner not acquired / lost)':''}`};
}

// classifyRun is pure: callers pass the run, its latest-attempt jobs, optional annotations by job id, the
// live head of the run's PR or branch (liveHeadSha; prHeadSha is the same), whether that branch is gone,
// and retries already used on this head across runs of the same workflow. The workflow profile (test-step
// rule and seal job) comes from the run unless given.
export function classifyRun({run,jobs=[],annotations={},liveHeadSha=null,prHeadSha=null,headGone=false,profile=null,sealJobName,testStep,sealStep,maxAttempts=MAX_ATTEMPTS,retriesUsedForHead=0}){
  const p=profile||profileFor(run)||WATCHED_WORKFLOWS[0];
  const seal_=sealJobName===undefined?p.sealJobName:sealJobName;
  const isTest=testStep||p.testStep;const isSeal=sealStep||p.sealStep;
  const live=liveHeadSha||prHeadSha||null;
  const attempt=Number(run?.run_attempt||1);
  const retries=Math.max(attempt-1,Number(retriesUsedForHead||0));
  const base={run_id:run?.id??null,workflow:run?.name??null,head_sha:run?.head_sha??null,run_attempt:attempt,retries_used:retries,action:'none',reasons:[]};
  const done=(classification,extra={})=>({...base,classification,...extra,reasons:[...base.reasons,...(extra.reasons||[])]});
  if(!run||run.status!=='completed')return done('PENDING',{reasons:['run not completed']});
  if(run.conclusion==='success')return done('PASS');
  if(headGone)return done('SUPERSEDED',{reasons:['the run\'s branch no longer exists']});
  if(live&&live!==run.head_sha)return done('SUPERSEDED',{reasons:[`head moved to ${live}`]});
  if(run.event==='pull_request'&&!live)return done('UNKNOWN',{reasons:['live PR head could not be resolved; refusing to act']});
  const lanes=jobs.filter(job=>job.name!==seal_);
  const seal=seal_?jobs.find(job=>job.name===seal_)||null:null;
  if(lanes.length&&lanes.every(job=>job.conclusion==='skipped'))return done('DRAFT',{reasons:['every lane skipped (draft PR)']});
  const anyRunnerLoss=jobs.some(job=>runnerLost(job,annotations));
  if(run.conclusion==='cancelled'&&!anyRunnerLoss)return done('CANCELLED',{reasons:['run cancelled without runner-loss evidence']});
  const verdicts=jobs.map(job=>({job,...classifyJob(job,annotations,isTest,Boolean(p.anyStartedIsTest)&&!testStep)}));
  const tests=verdicts.filter(v=>v.verdict==='test'&&v.job.name!==seal_);
  if(tests.length)return done('TEST_FAILURE',{reasons:tests.map(v=>v.reason),failing_jobs:tests.map(v=>v.job.name)});
  let infra=verdicts.filter(v=>v.verdict==='infra'&&v.job.name!==seal_);
  if(!infra.length&&seal&&!OK.has(String(seal.conclusion))){
    const started=(seal.steps||[]).some(step=>isSeal(step)&&stepStarted(step));
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
export const isWatchedRun=run=>Boolean(profileFor(run));

// User-facing name: the Physio. One line per re-run job, e.g.
//   Physio: re-ran L3 storage visual gameplay (GitHub gave it no machine), attempt 1 of 2
export const PHYSIO_NAME='Showdown Gate Physio';
export function physioLines(result){
  if(!result||result.classification!=='INFRA'||!String(result.action||'').startsWith('rerun-failed-jobs'))return [];
  const attempt=Number(result.retries_used||0)+1;
  return (result.failing_jobs||[]).map(job=>`Physio: re-ran ${job} (GitHub gave it no machine), attempt ${attempt} of ${MAX_AUTOMATIC_RERUNS}`);
}

export function githubClient({token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN,api=process.env.GITHUB_API_URL||'https://api.github.com'}={}){
  if(!token)throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
  async function request(method,endpoint,{allow=[],body}={}){
    const headers={authorization:`Bearer ${token}`,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'showdown-gate-physio'};
    if(body!==undefined)headers['content-type']='application/json';
    const response=await fetch(`${api}/${endpoint.replace(/^\//,'')}`,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
    if(allow.includes(response.status))return {status:response.status,body:null};
    if(!response.ok)throw new Error(`${method} ${endpoint} -> ${response.status} ${await response.text()}`);
    const text=await response.text();
    return {status:response.status,body:text?JSON.parse(text):null};
  }
  return {get:(e,o)=>request('GET',e,o).then(r=>r.body),getRaw:(e,o)=>request('GET',e,o),post:(e,o)=>request('POST',e,o),put:(e,o)=>request('PUT',e,o)};
}

export async function gatherRun(client,repo,runId,knownRun=null){
  const run=knownRun||await client.get(`repos/${repo}/actions/runs/${runId}`);
  const jobs=(await client.get(`repos/${repo}/actions/runs/${runId}/jobs?filter=latest&per_page=100`))?.jobs||[];
  const annotations={};
  for(const job of jobs){
    if(OK.has(String(job.conclusion)))continue;
    try{annotations[job.id]=(await client.get(`repos/${repo}/check-runs/${job.id}/annotations?per_page=50`))||[];}
    catch(error){annotations[job.id]=[];process.stderr.write(`annotations unavailable for job ${job.id}: ${error.message.split('\n')[0]}\n`);}
  }
  let liveHeadSha=null;let headGone=false;
  const sameRepo=run.head_repository?.full_name===repo;
  if(run.event==='pull_request'&&!sameRepo)liveHeadSha=run.pull_requests?.[0]?.head?.sha||null;
  else if(run.head_branch&&sameRepo&&(run.event==='pull_request'||run.head_branch!=='main')){
    // PR heads and non-main pushes (gameplay/**) are superseded when their branch moved on; every main sha keeps its evidence.
    const ref=await client.getRaw(`repos/${repo}/git/ref/heads/${encodeURIComponent(run.head_branch)}`,{allow:[404]});
    if(ref.status===404)headGone=true;else liveHeadSha=ref.body?.object?.sha||null;
  }
  const profile=profileFor(run);
  const sameHead=profile?(await client.get(`repos/${repo}/actions/workflows/${profile.file}/runs?head_sha=${run.head_sha}&per_page=100`))?.workflow_runs||[]:[];
  const retriesUsedForHead=sameHead.reduce((sum,other)=>sum+Math.max(0,Number(other.run_attempt||1)-1),0);
  return {run,jobs,annotations,liveHeadSha,headGone,retriesUsedForHead,profile};
}

export async function handleRun(client,repo,runId,{dryRun=false}={}){
  const run=await client.get(`repos/${repo}/actions/runs/${runId}`);
  if(!isWatchedRun(run))return {run_id:Number(runId),workflow:run?.name??null,classification:'IGNORED',action:'none',reasons:[`not a watched check run (${run?.name} ${run?.path}); the watchdog only acts on ${WATCHED_WORKFLOWS.map(w=>w.name).join(', ')}`]};
  const gathered=await gatherRun(client,repo,runId,run);
  const result=classifyRun(gathered);
  // The PR whose head is exactly this head, from the run object (no extra token scope); for the Physio status.
  result.pr=(run.pull_requests||[]).find(pr=>pr?.head?.sha===run.head_sha)?.number??null;
  if(result.action==='rerun-failed-jobs'&&!dryRun){
    const response=await client.post(`repos/${repo}/actions/runs/${runId}/rerun-failed-jobs`,{allow:[403,409]});
    result.rerun_status=response.status;
    if(response.status!==201)result.reasons.push(`rerun not accepted (HTTP ${response.status}); another attempt may already be running`);
  }
  // "re-ran" is claimed only for a re-run GitHub accepted.
  result.physio=!dryRun&&result.rerun_status===201?physioLines(result):[];
  if(dryRun&&result.action!=='none')result.action=`${result.action} (dry-run)`;
  return result;
}

export async function sweep(client,repo,{sinceMinutes=180,dryRun=false,now=Date.now()}={}){
  const listed=[];
  // A watched workflow file that is not on the default branch (Showdown Gate before its switch, POS20
  // after its archive) answers 404: it has no runs to sweep, and the other workflows are still swept.
  for(const profile of WATCHED_WORKFLOWS){
    const page=await client.getRaw(`repos/${repo}/actions/workflows/${profile.file}/runs?status=completed&per_page=50`,{allow:[404]});
    if(page.status!==404)listed.push(...(page.body?.workflow_runs||[]));
  }
  const recent=listed.filter(run=>run.conclusion!=='success'&&now-Date.parse(run.updated_at)<=sinceMinutes*60000);
  const results=[];
  for(const run of recent)results.push(await handleRun(client,repo,run.id,{dryRun}));
  return results;
}

function report(results){
  for(const result of results)process.stdout.write(`${JSON.stringify({schema:'showdown-gate-watchdog/v1',...result})}\n`);
  const lines=results.flatMap(result=>result.physio||[]);
  for(const line of lines)process.stdout.write(`${line}\n`);
  if(process.env.GITHUB_STEP_SUMMARY){
    if(lines.length)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`${lines.map(line=>`- ${line}`).join('\n')}\n\n`);
    const rows=results.map(r=>`| ${r.run_id} | ${r.workflow??''} | ${r.head_sha?String(r.head_sha).slice(0,10):''} | ${r.run_attempt??''} | ${r.classification} | ${r.action} | ${(r.reasons||[]).join('; ').replace(/\|/g,'/')} |`);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,[`### ${PHYSIO_NAME}`,'','| run | workflow | head | attempt | class | action | reasons |','|---|---|---|---|---|---|---|',...(rows.length?rows:['| - | - | - | - | nothing to do | none | |']),''].join('\n'));
  }
}

async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;let runId=null;let doSweep=false;let dryRun=false;let sinceMinutes=180;let out=null;
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--repo')repo=argv[++i];
    else if(argv[i]==='--out')out=argv[++i];
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
  if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,`${JSON.stringify(results,null,2)}\n`);}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
