// Physio status: after each Showdown Gate Physio run, one small JSON in the stable physio/v1 schema:
//   {schema:"physio/v1", at, state:"ALL_CLEAR"|"BARKING"|"STUCK",
//    checks:[{workflow, head_sha, pr, queued_minutes, action:"none"|"rerun"|"preempted_helpers", attempt, max_attempts}],
//    helpers_paused:[names]}
// It goes to the job summary, to the run artifact "physio-status" (physio-status.json), and, best effort,
// to project-documents/gameplay-factory/physio-status.json on factory/gameplay-v1 (only when the content
// changed or the last push is more than 10 minutes old; one read + one write attempt; a failure is logged
// and the run still succeeds). Reading checks is read-only: this script never re-runs or cancels anything.
//
// attempt / max_attempts count the Physio's automatic re-runs on that head, as in "attempt N of 2":
// 0 = none used yet, max_attempts is always 2.
// STUCK:     a check has used both re-runs and GitHub still gave it no machine (INFRA_EXHAUSTED).
// BARKING:   a check has waited more than 60 s for a machine, or this run re-ran a check or paused helpers.
// ALL_CLEAR: otherwise.
//   node scripts/physio-status.mjs [--repo owner/name] [--results F] [--preempt F] [--out F] [--publish] [--offline]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient,MAX_AUTOMATIC_RERUNS} from './gate-watchdog.mjs';
import {CHECK_WORKFLOWS,STARVED_AFTER_MS} from './gate-preempt.mjs';

export const PHYSIO_SCHEMA='physio/v1';
export const PHYSIO_STATES=Object.freeze(['ALL_CLEAR','BARKING','STUCK']);
export const PHYSIO_ACTIONS=Object.freeze(['none','rerun','preempted_helpers']);
export const PHYSIO_ARTIFACT='physio-status';
export const PHYSIO_FILE='physio-status.json';
export const PHYSIO_BRANCH='factory/gameplay-v1';
export const PHYSIO_BOARD_PATH='project-documents/gameplay-factory/physio-status.json';
export const PHYSIO_REFRESH_MS=10*60*1000;
const WAITING=new Set(['queued','waiting','pending','requested']);

// How long a check run has waited for a machine (ms), or 0.
export function waitingMs({run,jobs},now){
  if(WAITING.has(run?.status))return Math.max(0,now-Date.parse(run.created_at));
  let longest=0;
  for(const job of jobs||[]){
    const since=job.created_at||job.started_at;
    if(WAITING.has(job.status)&&since)longest=Math.max(longest,now-Date.parse(since));
  }
  return longest;
}

const minutes=ms=>Math.round(ms/6000)/10;
// The PR whose head is exactly this run's head, from the run object itself (no extra token scope).
export const prOf=run=>(run?.pull_requests||[]).find(pr=>pr?.head?.sha===run?.head_sha)?.number??null;

// Pure. active: [{run, jobs}] queued/in-progress runs; results: gate-watchdog results; preempt: gate-preempt result.
export function buildPhysioStatus({now=Date.now(),active=[],results=[],preempt=null}={}){
  const paused=[...new Set((preempt?.cancelled||[]).filter(c=>c.status===202).map(c=>c.name))];
  const checks=[];let stuck=false;
  for(const item of active){
    const {run}=item;
    if(!run||!CHECK_WORKFLOWS.includes(run.name))continue;
    const waited=waitingMs(item,now);
    if(waited<=STARVED_AFTER_MS)continue;
    checks.push({workflow:run.name,head_sha:run.head_sha??null,pr:prOf(run),queued_minutes:minutes(waited),
      action:paused.length?'preempted_helpers':'none',attempt:Math.min(MAX_AUTOMATIC_RERUNS,Math.max(0,Number(run.run_attempt||1)-1)),max_attempts:MAX_AUTOMATIC_RERUNS});
  }
  for(const result of results||[]){
    const rerun=result?.classification==='INFRA'&&result.rerun_status===201;
    const exhausted=result?.classification==='INFRA_EXHAUSTED';
    if(!rerun&&!exhausted||!CHECK_WORKFLOWS.includes(result.workflow))continue;
    if(exhausted)stuck=true;
    const used=Number(result.retries_used||0);
    checks.push({workflow:result.workflow,head_sha:result.head_sha??null,pr:result.pr??null,queued_minutes:0,
      action:rerun?'rerun':'none',attempt:Math.min(MAX_AUTOMATIC_RERUNS,rerun?used+1:MAX_AUTOMATIC_RERUNS),max_attempts:MAX_AUTOMATIC_RERUNS});
  }
  const state=stuck?'STUCK':(checks.length||paused.length)?'BARKING':'ALL_CLEAR';
  return {schema:PHYSIO_SCHEMA,at:new Date(now).toISOString(),state,checks,helpers_paused:paused};
}

export function physioSummary(status){
  const lines=[`### Showdown Gate Physio: ${status.state}`,''];
  for(const c of status.checks)lines.push(`- ${c.workflow} ${String(c.head_sha||'').slice(0,10)}${c.pr?` (PR #${c.pr})`:''}: ${c.action}${c.queued_minutes?`, waiting ${c.queued_minutes} min`:''}, re-runs ${c.attempt} of ${c.max_attempts}`);
  if(status.helpers_paused.length)lines.push(`- helpers paused: ${status.helpers_paused.join(', ')}`);
  if(!status.checks.length&&!status.helpers_paused.length)lines.push('- every check has a machine; nothing to do');
  lines.push('','```json',JSON.stringify(status,null,2),'```','');
  return lines.join('\n');
}

const withoutTime=status=>JSON.stringify({...status,at:null});
// Write when the content (ignoring "at") changed, or the last push is older than 10 minutes.
export function shouldPublish(previous,status,now=Date.now()){
  if(!previous||typeof previous!=='object')return {write:true,reason:'no previous physio-status.json on the branch'};
  if(withoutTime(previous)!==withoutTime(status))return {write:true,reason:'content changed'};
  const last=Date.parse(previous.at);
  if(!Number.isFinite(last)||now-last>PHYSIO_REFRESH_MS)return {write:true,reason:'last push older than 10 minutes'};
  return {write:false,reason:'unchanged and pushed within 10 minutes'};
}

// Best effort, one attempt: read the current file on the branch, then one contents-API commit to that
// branch (compare-and-swap on the blob sha). Never throws.
export async function publishPhysio(client,repo,status,{now=Date.now(),branch=PHYSIO_BRANCH,file=PHYSIO_BOARD_PATH}={}){
  try{
    const current=await client.getRaw(`repos/${repo}/contents/${file}?ref=${encodeURIComponent(branch)}`,{allow:[404]});
    let previous=null;let sha;
    if(current.status!==404&&current.body){sha=current.body.sha;try{previous=JSON.parse(Buffer.from(current.body.content||'','base64').toString('utf8'));}catch{previous=null;}}
    const decision=shouldPublish(previous,status,now);
    if(!decision.write)return {published:false,reason:decision.reason};
    const body={message:`Showdown Gate Physio: ${status.state}`,content:Buffer.from(`${JSON.stringify(status,null,2)}\n`).toString('base64'),branch,...(sha?{sha}:{})};
    const response=await client.put(`repos/${repo}/contents/${file}`,{allow:[403,404,409,422],body});
    if(response.status!==200&&response.status!==201)return {published:false,reason:`write refused (HTTP ${response.status})`};
    return {published:true,reason:decision.reason,commit:response.body?.commit?.sha??null};
  }catch(error){return {published:false,reason:`write failed: ${String(error.message).split('\n')[0]}`};}
}

// Read-only: queued and in-progress check runs with their jobs.
export async function gatherActiveChecks(client,repo){
  const out=[];
  for(const status of ['queued','in_progress']){
    const runs=(await client.get(`repos/${repo}/actions/runs?status=${status}&per_page=100`))?.workflow_runs||[];
    for(const run of runs.filter(r=>CHECK_WORKFLOWS.includes(r.name))){
      const jobs=status==='in_progress'?((await client.get(`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))?.jobs||[]):[];
      out.push({run,jobs});
    }
  }
  return out;
}

const readJson=(file,fallback)=>{try{return file?JSON.parse(fs.readFileSync(file,'utf8')):fallback;}catch{return fallback;}};

async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;let resultsFile=null;let preemptFile=null;let out=null;let offline=false;let publish=false;
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--repo')repo=argv[++i];
    else if(argv[i]==='--results')resultsFile=argv[++i];
    else if(argv[i]==='--preempt')preemptFile=argv[++i];
    else if(argv[i]==='--out')out=argv[++i];
    else if(argv[i]==='--publish')publish=true;
    else if(argv[i]==='--offline')offline=true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  const validRepo=Boolean(repo)&&/^[^/\s]+\/[^/\s]+$/.test(repo);
  let client=null;
  if(!offline){try{if(!validRepo)throw new Error('--repo owner/name is required');client=githubClient();}catch(error){console.error(`physio-status: GitHub unavailable: ${error.message}`);}}
  // A status built from partial evidence is still summarized and uploaded, but never pushed to the board:
  // a false ALL_CLEAR there would hide a stuck check.
  const gaps=[];
  let active=[];
  if(client){try{active=await gatherActiveChecks(client,repo);}catch(error){gaps.push('active checks unavailable');console.error(`physio-status: active checks unavailable: ${error.message.split('\n')[0]}`);}}
  else gaps.push('no GitHub client');
  const results=readJson(resultsFile,null);
  if(resultsFile&&!Array.isArray(results))gaps.push('Physio results missing (the classify or sweep step failed)');
  const status=buildPhysioStatus({active,results:Array.isArray(results)?results:[],preempt:readJson(preemptFile,null)});
  console.log(JSON.stringify(status));
  if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,`${JSON.stringify(status,null,2)}\n`);}
  let published=null;
  if(publish&&gaps.length){published={published:false,reason:`not pushed, evidence incomplete: ${gaps.join('; ')}`};console.log(published.reason);}
  else if(publish&&client){published=await publishPhysio(client,repo,status);console.log(`${PHYSIO_BOARD_PATH} on ${PHYSIO_BRANCH}: ${published.published?'written':'not written'} (${published.reason})`);}
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`${physioSummary(status)}${published?`\n${PHYSIO_BOARD_PATH} on ${PHYSIO_BRANCH}: ${published.published?'written':'not written'} (${published.reason})\n`:''}`);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  // The status is best effort: it never fails the Physio run.
  main(process.argv.slice(2)).catch(error=>{console.error(`physio-status failed: ${error.message}`);process.exitCode=0;});
}
