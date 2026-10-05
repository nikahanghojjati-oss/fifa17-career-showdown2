// Physio status: after each Showdown Gate Physio run, one small JSON in the stable physio/v1 schema:
//   {schema:"physio/v1", at, state:"ALL_CLEAR"|"BARKING"|"STUCK",
//    checks:[{workflow, head_sha, pr, queued_minutes, action:"none"|"rerun"|"preempted_helpers", attempt, max_attempts}],
//    helpers_paused:[names],
//    gate:{pr, head_sha, lanes:[{name:"L1 core", state:"pass|fail|running|queued|skipped"}, ... "L6 browser journey"],
//          seal:"PASS|FAIL_TEST|INFRA_RETRYING|INFRA_EXHAUSTED|PENDING|DRAFT|SUPERSEDED"} | null,
//    pos20:{pr, passed, total:16, state:"running|pass|fail"} | null}
// gate and pos20 describe the newest open non-draft PR into main (most recently updated); both are null
// when there is none. gate is null until a Showdown Gate run exists on that PR's head; pos20 is null once
// Validate POS20 is archived. Lane names start "L1 ".."L6 ".
// It goes to the job summary, to the run artifact "physio-status" (physio-status.json), and, best effort,
// to project-documents/gameplay-factory/physio-status.json on factory/gameplay-v1 (only when the content
// changed or the last push is more than 10 minutes old; one read + one write attempt; a failure is logged
// and the run still succeeds). Reading checks is read-only: this script never re-runs or cancels anything.
//
// attempt / max_attempts count the Physio's automatic re-runs on that head, as in "attempt N of 2":
// 0 = none used yet, max_attempts is always 2.
// STUCK:     a check has used both re-runs and GitHub still gave it no machine (INFRA_EXHAUSTED).
// BARKING:   a check has waited more than 60 s for a machine, or this run re-ran a check or paused helpers.
// ALL_CLEAR: otherwise. checks[0] is the check that sets the state (the stuck one, else the longest wait).
//   node scripts/physio-status.mjs [--repo owner/name] [--results F] [--preempt F] [--out F] [--publish] [--offline]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient,classifyRun,MAX_AUTOMATIC_RERUNS} from './gate-watchdog.mjs';
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

// The newest open non-draft PR into main, shown next to the Physio on the bottom bar.
export const GATE_LANES=Object.freeze(['L1 core','L2 browser full','L3 storage visual gameplay','L4 remote','L5 rules regression','L6 browser journey']);
export const GATE_SEALS=Object.freeze(['PASS','FAIL_TEST','INFRA_RETRYING','INFRA_EXHAUSTED','PENDING','DRAFT','SUPERSEDED']);
export const LANE_STATES=Object.freeze(['pass','fail','running','queued','skipped']);
// The 16 current gates: every Validate POS20 job (proof matrix expanded per group) and the four Validate
// Gameplay Fast jobs, by check name (the same list as GATE_COVERAGE.json's gates).
export const POS20_GATE_NAMES=Object.freeze(["POS20 exact selector", "POS20 cognitive benchmark", "POS20 operations authority", "POS20 selected deterministic census", "POS20 gameplay lifecycle 1/3/5/10", "POS20 proof FULL", "POS20 proof INLINE", "POS20 proof REMOTE", "POS20 proof STATIC", "POS20 proof STORAGE", "POS20 proof VISUAL", "POS20 exact-head cognitive seal", "Gameplay contracts", "Composed Rules on the emulator", "Two-manager browser journey", "Composed production Rules regression"]);
export const POS20_TOTAL_GATES=16;
export const POS20_STATES=Object.freeze(['running','pass','fail']);
export function focusPullRequest(pulls){
  return [...(pulls||[])].filter(pr=>pr&&pr.state==='open'&&pr.draft!==true&&pr.base?.ref==='main')
    .sort((a,b)=>Date.parse(b.updated_at||0)-Date.parse(a.updated_at||0)||Number(b.number)-Number(a.number))[0]||null;
}
export function laneState(job){
  if(!job)return 'queued';
  if(job.status==='in_progress')return 'running';
  if(job.status!=='completed')return 'queued';
  if(job.conclusion==='success')return 'pass';
  if(job.conclusion==='skipped')return 'skipped';
  return 'fail';
}
const SEAL_OF={PASS:'PASS',TEST_FAILURE:'FAIL_TEST',INFRA:'INFRA_RETRYING',INFRA_EXHAUSTED:'INFRA_EXHAUSTED',DRAFT:'DRAFT',SUPERSEDED:'SUPERSEDED'};
// gateRun: the newest Showdown Gate run on the PR head (or null); gateJobs: its latest-attempt jobs.
// No Showdown Gate run on this head yet (or no Showdown Gate workflow at all) -> null.
export function buildGateView({pr,gateRun=null,gateJobs=[]}){
  if(!pr)return null;
  const head=pr.head?.sha??null;
  const run=gateRun&&gateRun.head_sha===head?gateRun:null;
  if(!run)return null;
  const jobs=gateJobs||[];
  const lanes=GATE_LANES.map(name=>({name,state:laneState(jobs.find(job=>job.name===name))}));
  let seal='PENDING';
  if(run.status!=='completed')seal=Number(run.run_attempt||1)>1?'INFRA_RETRYING':'PENDING';
  else seal=SEAL_OF[classifyRun({run,jobs,liveHeadSha:head}).classification]||'PENDING';
  return {pr:pr.number??null,head_sha:head,lanes,seal};
}
// The 16 old gates (POS20_GATE_NAMES): every Validate POS20 job with the proof matrix expanded, plus the
// four Validate Gameplay Fast jobs. A gate is green when its job on this head succeeded or was skipped by
// the route. Gameplay Fast only runs on gameplay/** pushes, so on other heads its 4 gates stay ungreen.
// pos20Archived: Validate POS20 no longer exists (after the switch) -> null.
export function buildPos20View({pr,gateNames=POS20_GATE_NAMES,pos20Run=null,pos20Jobs=[],fastRun=null,fastJobs=[],pos20Archived=false}){
  if(!pr||pos20Archived)return null;
  const head=pr.head?.sha??null;
  const runs=[pos20Run,fastRun].filter(run=>run&&run.head_sha===head);
  const jobs=[...(pos20Run?.head_sha===head?pos20Jobs:[]),...(fastRun?.head_sha===head?fastJobs:[])];
  const passed=(gateNames||[]).filter(name=>jobs.some(job=>job.name===name&&job.status==='completed'&&['success','skipped'].includes(job.conclusion))).length;
  let state;
  if(!pos20Run||pos20Run.head_sha!==head||runs.some(run=>run.status!=='completed'))state='running';
  else state=runs.every(run=>run.conclusion==='success')?'pass':'fail';
  return {pr:pr.number??null,passed,total:POS20_TOTAL_GATES,state};
}

// Pure. active: [{run, jobs}] queued/in-progress runs; results: gate-watchdog results; preempt: gate-preempt
// result; focus: the gathered focus PR and its runs (or null).
// Checks are one entry per workflow and head. The check that sets the state comes first: under STUCK the
// exhausted check, under BARKING the check that has waited longest for a machine (then a re-run one).
export function buildPhysioStatus({now=Date.now(),active=[],results=[],preempt=null,focus=null}={}){
  const paused=[...new Set((preempt?.cancelled||[]).filter(c=>c.status===202).map(c=>c.name))];
  const entries=new Map();
  const entry=(workflow,head)=>{
    const key=`${workflow}\u0000${head??''}`;
    if(!entries.has(key))entries.set(key,{check:{workflow,head_sha:head??null,pr:null,queued_minutes:0,action:'none',attempt:0,max_attempts:MAX_AUTOMATIC_RERUNS},rerun:false,stuck:false,waiting:false});
    return entries.get(key);
  };
  for(const item of active){
    const {run}=item;
    if(!run||!CHECK_WORKFLOWS.includes(run.name))continue;
    const waited=waitingMs(item,now);
    if(waited<=STARVED_AFTER_MS)continue;
    const e=entry(run.name,run.head_sha);e.waiting=true;
    e.check.pr=e.check.pr??prOf(run);
    e.check.queued_minutes=Math.max(e.check.queued_minutes,minutes(waited));
    e.check.attempt=Math.max(e.check.attempt,Math.min(MAX_AUTOMATIC_RERUNS,Math.max(0,Number(run.run_attempt||1)-1)));
  }
  for(const result of results||[]){
    const rerun=result?.classification==='INFRA'&&result.rerun_status===201;
    const exhausted=result?.classification==='INFRA_EXHAUSTED';
    if(!rerun&&!exhausted||!CHECK_WORKFLOWS.includes(result.workflow))continue;
    const e=entry(result.workflow,result.head_sha);
    e.check.pr=e.check.pr??result.pr??null;
    const used=Number(result.retries_used||0);
    e.check.attempt=Math.max(e.check.attempt,Math.min(MAX_AUTOMATIC_RERUNS,rerun?used+1:MAX_AUTOMATIC_RERUNS));
    if(rerun)e.rerun=true;if(exhausted)e.stuck=true;
  }
  for(const e of entries.values())e.check.action=e.rerun?'rerun':(e.waiting&&paused.length)?'preempted_helpers':'none';
  const ordered=[...entries.values()].sort((a,b)=>Number(b.stuck)-Number(a.stuck)||Number(b.waiting)-Number(a.waiting)||b.check.queued_minutes-a.check.queued_minutes||Number(b.rerun)-Number(a.rerun));
  const checks=ordered.map(e=>e.check);
  const state=ordered.some(e=>e.stuck)?'STUCK':(checks.length||paused.length)?'BARKING':'ALL_CLEAR';
  const pr=focus?.pr||null;
  return {schema:PHYSIO_SCHEMA,at:new Date(now).toISOString(),state,checks,helpers_paused:paused,
    gate:pr?buildGateView({pr,gateRun:focus.gateRun,gateJobs:focus.gateJobs}):null,
    pos20:pr?buildPos20View({pr,pos20Run:focus.pos20Run,pos20Jobs:focus.pos20Jobs,fastRun:focus.fastRun,fastJobs:focus.fastJobs,pos20Archived:focus.pos20Archived}):null};
}

export function physioSummary(status){
  const lines=[`### Showdown Gate Physio: ${status.state}`,''];
  for(const c of status.checks)lines.push(`- ${c.workflow} ${String(c.head_sha||'').slice(0,10)}${c.pr?` (PR #${c.pr})`:''}: ${c.action}${c.queued_minutes?`, waiting ${c.queued_minutes} min`:''}, re-runs ${c.attempt} of ${c.max_attempts}`);
  if(status.helpers_paused.length)lines.push(`- helpers paused: ${status.helpers_paused.join(', ')}`);
  if(!status.checks.length&&!status.helpers_paused.length)lines.push('- every check has a machine; nothing to do');
  if(status.gate)lines.push(`- Showdown Gate PR #${status.gate.pr} ${String(status.gate.head_sha).slice(0,10)}: ${status.gate.seal}; ${status.gate.lanes.map(l=>`${l.name.split(' ')[0]} ${l.state}`).join(', ')}`);
  if(status.pos20)lines.push(`- POS20 PR #${status.pos20.pr}: ${status.pos20.state}, ${status.pos20.passed}/${status.pos20.total} gates green`);
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

// Read-only: the focus PR (newest open non-draft PR into main) and the newest Showdown Gate, Validate POS20
// and Validate Gameplay Fast runs on its head.
export async function gatherFocus(client,repo){
  const pulls=(await client.get(`repos/${repo}/pulls?state=open&base=main&sort=updated&direction=desc&per_page=30`))||[];
  const pr=focusPullRequest(pulls);
  if(!pr)return null;
  const head=pr.head.sha;
  const newest=async file=>{
    const page=await client.getRaw(`repos/${repo}/actions/workflows/${file}/runs?head_sha=${head}&per_page=20`,{allow:[404]});
    if(page.status===404)return {missing:true,run:null,jobs:[]};
    const run=(page.body?.workflow_runs||[]).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0))[0]||null;
    const jobs=run?((await client.get(`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))?.jobs||[]):[];
    return {missing:false,run,jobs};
  };
  const gate=await newest('showdown-gate.yml');const pos20=await newest('validate-pos10.yml');const fast=await newest('validate-gameplay-fast.yml');
  return {pr,gateRun:gate.run,gateJobs:gate.jobs,pos20Run:pos20.run,pos20Jobs:pos20.jobs,fastRun:fast.run,fastJobs:fast.jobs,pos20Archived:pos20.missing};
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
  // gate / pos20 are best effort: when the focus PR cannot be read they are null and the rest still ships.
  let focus=null;
  if(client){try{focus=await gatherFocus(client,repo);}catch(error){console.error(`physio-status: focus PR unavailable: ${error.message.split('\n')[0]}`);}}
  const status=buildPhysioStatus({active,results:Array.isArray(results)?results:[],preempt:readJson(preemptFile,null),focus});
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
