// Shadow comparison for one head: Validate POS20 + Validate Gameplay Fast versus Showdown Gate.
// Prints one JSON line. Not wired into any required check.
//   node scripts/gate-compare.mjs --head <sha> [--repo owner/name]
//   node scripts/gate-compare.mjs --summary [--limit 50] [--canary-heads sha,sha] [--infra-runs runId]   (exit criteria)
// Checks: same route profile, the gate ran a superset of what the old gates ran, and verdicts agree.
// The disagreement that blocks leaving shadow is gate_pass_old_fail.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient,classifyRun,PHYSIO_NAME} from './gate-watchdog.mjs';
import {groupOf,LIFECYCLE_PROOF} from './showdown-gate.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const POS20_PATH='.github/workflows/validate-pos10.yml';
export const GAMEPLAY_FAST_PATH='.github/workflows/validate-gameplay-fast.yml';
export const GATE_PATH='.github/workflows/showdown-gate.yml';

// Pure comparison. Each side: {verdict:'PASS'|'FAIL'|'PENDING'|'ABSENT', profile?, ran:[ids]}.
export function compareHead({head,pos20,gameplayFast,gate}){
  const old=[pos20,gameplayFast].filter(side=>side&&side.verdict!=='ABSENT');
  const oldVerdict=!old.length?'ABSENT':old.some(side=>side.verdict==='PENDING')?'PENDING':old.every(side=>side.verdict==='PASS')?'PASS':old.some(side=>side.verdict==='FAIL')?'FAIL':'INFRA';
  const gateVerdict=gate?.verdict||'ABSENT';
  const gateRan=new Set(gate?.ran||[]);
  const oldRan=[...new Set(old.flatMap(side=>side.ran||[]))];
  const missing=oldRan.filter(id=>!gateRan.has(id)).sort();
  // Infra failures on either side are excluded from agreement (they say nothing about the code).
  const comparable=['PASS','FAIL'].includes(oldVerdict)&&['PASS','FAIL','FAIL_TEST'].includes(gateVerdict);
  const gatePass=gateVerdict==='PASS';
  return {
    schema:'showdown-gate-compare/v1',head,
    old_verdict:oldVerdict,
    pos20:{verdict:pos20?.verdict||'ABSENT',profile:pos20?.profile??null,ran:(pos20?.ran||[]).length},
    gameplay_fast:{verdict:gameplayFast?.verdict||'ABSENT',ran:(gameplayFast?.ran||[]).length},
    gate:{verdict:gateVerdict,profile:gate?.profile??null,ran:gateRan.size,run_attempt:gate?.run_attempt??null},
    full_seal:/FULL_SEAL$/.test(String(gate?.profile||pos20?.profile||'')),
    comparable,
    same_route_profile:Boolean(pos20?.profile)&&pos20?.profile===gate?.profile,
    gate_ran_superset:missing.length===0,
    missing_in_gate:missing,
    verdicts_agree:comparable?(oldVerdict==='PASS')===gatePass:null,
    gate_pass_old_fail:comparable&&gatePass&&oldVerdict!=='PASS'
  };
}

// Shadow exit criteria (Nik, 2026-10-05): >=10 real PR heads incl. >=2 full seals, zero disagreements
// (gate PASS while POS20 or Gameplay Fast FAIL, infra excluded), both canaries FAIL_TEST and never re-run,
// one simulated infra failure re-run exactly once.
export const EXIT_CRITERIA=Object.freeze({minHeads:10,minFullSeals:2,maxDisagreements:0,canaries:2});
export function evaluateExitCriteria({comparisons=[],canaries=[],infraRuns=[]}){
  const head=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value);
  const profile=value=>typeof value==='string'&&value.trim().length>0;
  const complete=c=>head(c?.head)&&['PASS','FAIL','INFRA'].includes(c.pos20?.verdict)&&profile(c.pos20?.profile)&&
    ['PASS','FAIL','FAIL_TEST','INFRA_RETRYING','INFRA_EXHAUSTED','DRAFT','SUPERSEDED'].includes(c.gate?.verdict)&&profile(c.gate?.profile)&&
    ['PASS','FAIL','INFRA'].includes(c.old_verdict)&&typeof c.comparable==='boolean'&&typeof c.same_route_profile==='boolean'&&
    typeof c.gate_ran_superset==='boolean'&&typeof c.gate_pass_old_fail==='boolean';
  const records=comparisons.filter(complete);
  const real=records.filter(c=>c.comparable===true&&['PASS','FAIL'].includes(c.pos20.verdict)&&['PASS','FAIL'].includes(c.old_verdict)&&['PASS','FAIL','FAIL_TEST'].includes(c.gate.verdict));
  const heads=[...new Set(real.map(c=>c.head))];
  const disagreements=real.filter(c=>c.gate_pass_old_fail===true||c.gate.verdict==='PASS'&&(c.old_verdict!=='PASS'||c.pos20.verdict!=='PASS'));
  const fullHeads=heads.filter(h=>real.filter(c=>c.head===h).every(c=>c.full_seal===true&&/FULL_SEAL$/.test(c.gate.profile)&&c.gate.verdict==='PASS'&&c.old_verdict==='PASS'&&c.pos20.verdict==='PASS'));
  const canaryHeads=[...new Set(canaries.filter(c=>head(c?.head)).map(c=>c.head))];
  const canaryOk=canaryHeads.filter(h=>canaries.filter(c=>c.head===h).every(c=>c.gate?.verdict==='FAIL_TEST'&&c.gate?.run_attempt===1));
  const infraOk=infraRuns.filter(r=>r?.conclusion==='success'&&r.run_attempt===2&&r.watchdog_reruns===1);
  const criteria={
    complete_comparisons:{incomplete_heads:comparisons.filter(c=>!complete(c)).map(c=>c?.head??null),ok:records.length===comparisons.length},
    heads:{have:heads.length,need:EXIT_CRITERIA.minHeads,ok:heads.length>=EXIT_CRITERIA.minHeads},
    same_route:{mismatched_heads:[...new Set(real.filter(c=>c.same_route_profile!==true||c.pos20.profile!==c.gate.profile).map(c=>c.head))],ok:real.every(c=>c.same_route_profile===true&&c.pos20.profile===c.gate.profile)},
    full_seals:{have:fullHeads.length,need:EXIT_CRITERIA.minFullSeals,ok:fullHeads.length>=EXIT_CRITERIA.minFullSeals},
    disagreements:{have:disagreements.length,heads:disagreements.map(c=>c.head),ok:disagreements.length<=EXIT_CRITERIA.maxDisagreements},
    gate_ran_superset:{missing_heads:real.filter(c=>!c.gate_ran_superset).map(c=>c.head),ok:real.every(c=>c.gate_ran_superset)},
    canaries:{have:canaryOk.length,need:EXIT_CRITERIA.canaries,ok:canaryOk.length>=EXIT_CRITERIA.canaries&&canaries.every(c=>head(c?.head)&&c.gate?.verdict==='FAIL_TEST'&&c.gate?.run_attempt===1)},
    infra_rerun_once:{have:infraOk.length,need:1,ok:infraOk.length>=1}
  };
  return {schema:'showdown-gate-exit/v1',ready:Object.values(criteria).every(c=>c.ok),criteria};
}

// Parse the router JSON that Validate POS20's selector prints into its log.
export function parsePos20SelectorLog(text){
  const clean=String(text||'').split('\n').map(line=>line.replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z\s?/,'')).join('\n');
  const profile=(clean.match(/"profile":\s*"([^"]+)"/)||[])[1]||null;
  const list=key=>{const m=clean.match(new RegExp(`"${key}":\\s*\\[([\\s\\S]*?)\\]`));return m?[...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]):[];};
  return {profile,tests:list('tests'),proofs:list('proofs'),operations:/"operations":\s*true/.test(clean)};
}
export function pos20Side(jobs,selector){
  if(!jobs)return {verdict:'ABSENT',ran:[]};
  const byName=new Map(jobs.map(job=>[job.name,job]));
  const ok=name=>byName.get(name)?.conclusion==='success';
  const seal=byName.get('POS20 exact-head cognitive seal');
  const verdict=!seal||seal.status!=='completed'?'PENDING':seal.conclusion==='success'?'PASS':'FAIL';
  const ran=[];
  if(ok('POS20 cognitive benchmark'))ran.push('BENCHMARK');
  if(ok('POS20 operations authority'))ran.push('OPERATIONS');
  if(ok('POS20 selected deterministic census'))ran.push(...selector.tests);
  for(const id of selector.proofs)if(ok(`POS20 proof ${groupOf(id)}`))ran.push(id);
  if(ok('POS20 gameplay lifecycle 1/3/5/10')&&selector.proofs.includes(LIFECYCLE_PROOF))ran.push('LIFECYCLE_COMPOSED_RULES_BUILD','LIFECYCLE_COMPOSED_1_3_5_10');
  return {verdict,profile:selector.profile,ran};
}
export function gameplayFastSide(jobs,coverage){
  if(!jobs)return {verdict:'ABSENT',ran:[]};
  const verdict=jobs.some(job=>job.status!=='completed')?'PENDING':jobs.every(job=>job.conclusion==='success')?'PASS':'FAIL';
  const ran=[];
  for(const mapping of coverage.mappings.filter(m=>m.workflow===GAMEPLAY_FAST_PATH)){
    const job=jobs.find(j=>j.name===coverage.oldJobNames[`${GAMEPLAY_FAST_PATH}#${mapping.job}`]);
    const step=(job?.steps||[]).find(s=>s.name===mapping.step);
    if(step?.conclusion==='success')ran.push(...(mapping.ids||[]));
  }
  return {verdict,ran};
}
export function parseGateSummaryLog(text){
  const line=String(text||'').split('\n').find(l=>l.includes('SHOWDOWN_GATE_SUMMARY {'));
  return line?JSON.parse(line.slice(line.indexOf('{'))):null;
}

async function jobLog(repo,jobId){
  const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN;
  const response=await fetch(`${process.env.GITHUB_API_URL||'https://api.github.com'}/repos/${repo}/actions/jobs/${jobId}/logs`,{headers:{authorization:`Bearer ${token}`,'user-agent':'showdown-gate-compare'}});
  if(!response.ok)throw new Error(`job ${jobId} log -> ${response.status}`);
  return response.text();
}

// The watchdog records accepted re-runs as structured JSON in its job log. physio/v1's board view
// groups by head and omits run ids, so it cannot attribute a specific recovery. Never infer attribution
// from the recovered run's attempt number, and never read results from a pull-request workflow.
export function parsePhysioResults(log){
  const results=[];
  for(const line of String(log||'').split('\n')){
    const start=line.indexOf('{');if(start<0)continue;
    try{const value=JSON.parse(line.slice(start));if(value?.schema==='showdown-gate-watchdog/v1')results.push(value);}catch{/* Non-result log lines are not evidence. */}
  }
  return results;
}
export const PHYSIO_WINDOW_MS=24*60*60*1000;
export const PHYSIO_SLACK_MS=10*60*1000;
export async function readPhysioReruns(client,repo,run,{log=jobLog}={}){
  const accepted=[];
  try{
    // Paginate until the target run's creation time; older Physio runs cannot have re-run it.
    const created=Date.parse(run.created_at);if(!Number.isFinite(created))return null;
    // A re-run is requested before the recovered attempt finishes, so only Physio runs created between the
    // target's creation and its last update (plus slack) can hold it. Reading every newer Physio run's logs
    // exhausted the token's hourly request budget and returned null for real evidence.
    const updated=Date.parse(run.updated_at);
    const until=(Number.isFinite(updated)?Math.max(updated,created):created+PHYSIO_WINDOW_MS)+PHYSIO_SLACK_MS;
    for(let page=1;;page++){
      const runs=(await client.get(`repos/${repo}/actions/workflows/gate-watchdog.yml/runs?status=completed&per_page=100&page=${page}`))?.workflow_runs;
      if(!Array.isArray(runs))return null;
      for(const physio of runs){
        if(Date.parse(physio.created_at)<created||Date.parse(physio.created_at)>until)continue;
        if(physio.name!==PHYSIO_NAME||String(physio.path||'').replace(/@.*$/,'')!=='.github/workflows/gate-watchdog.yml'||physio.head_branch!=='main'||!['workflow_run','schedule','workflow_dispatch'].includes(physio.event))continue;
        const jobs=(await client.get(`repos/${repo}/actions/runs/${physio.id}/jobs?filter=all&per_page=100`))?.jobs;
        if(!Array.isArray(jobs))return null;
        for(const job of jobs){
          if(job.conclusion==='skipped')continue; // A skipped job ran nothing, so it holds no result.
          for(const result of parsePhysioResults(await log(repo,job.id))){
            if(result.run_id===run.id&&result.head_sha===run.head_sha&&result.workflow==='Showdown Gate'&&result.classification==='INFRA'&&result.action==='rerun-failed-jobs'&&result.rerun_status===201&&result.run_attempt===1&&result.retries_used===0){
              accepted.push({physio_run_id:physio.id,job_id:job.id,run_id:result.run_id,head_sha:result.head_sha,run_attempt:result.run_attempt});
            }
          }
        }
      }
      if(runs.length<100||runs.every(p=>Date.parse(p.created_at)<created))break;
    }
  }catch{return null;}
  return [...new Map(accepted.map(result=>[`${result.physio_run_id}:${result.job_id}`,result])).values()];
}
// Old-side verdicts that failed only for infra (no machine, lost runner) are reported as INFRA.
async function oldInfra(client,repo,run,jobs,sealJobName){
  if(!run||run.status!=='completed'||run.conclusion==='success')return false;
  const annotations={};
  for(const job of jobs||[])if(!['success','skipped','neutral'].includes(String(job.conclusion))){try{annotations[job.id]=await client.get(`repos/${repo}/check-runs/${job.id}/annotations?per_page=50`)||[];}catch{annotations[job.id]=[];}}
  const c=classifyRun({run:{...run,event:'push'},jobs:jobs||[],annotations,sealJobName});
  return ['INFRA','INFRA_EXHAUSTED'].includes(c.classification);
}
// A head is superseded when its Gate run and its POS20 run were both cancelled and the PR's live head is a
// different commit (a newer push cancelled them). It carries no verdict, so the exit report lists it apart
// instead of counting it as incomplete evidence. Any doubt (no PR, unknown live head) is not superseded.
export function isSupersededHead({head,gateRun,pos20Run,prHeadSha}){
  const sha=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value);
  return sha(head)&&gateRun?.conclusion==='cancelled'&&pos20Run?.conclusion==='cancelled'&&sha(prHeadSha)&&prHeadSha!==head;
}
export async function compareLive(client,repo,head,coverage){
  const runs=(await client.get(`repos/${repo}/actions/runs?head_sha=${head}&per_page=100`))?.workflow_runs||[];
  const latest=p=>runs.filter(run=>String(run.path||'').replace(/@.*$/,'')===p).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0]||null;
  const jobsOf=async run=>run?((await client.get(`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))?.jobs||[]):null;
  const pos20Run=latest(POS20_PATH);
  const gateRunForHead=latest(GATE_PATH);
  if(gateRunForHead?.conclusion==='cancelled'&&pos20Run?.conclusion==='cancelled'){
    const pr=gateRunForHead.pull_requests?.[0]?.number;
    let prHeadSha=null;
    if(Number.isInteger(pr)){try{prHeadSha=(await client.get(`repos/${repo}/pulls/${pr}`))?.head?.sha??null;}catch{prHeadSha=null;}}
    if(isSupersededHead({head,gateRun:gateRunForHead,pos20Run,prHeadSha}))return {schema:'showdown-gate-compare/v1',head,superseded:true,pr,pr_head:prHeadSha};
  }
  const pos20Jobs=await jobsOf(pos20Run);
  let selector={profile:null,tests:[],proofs:[]};
  const selectorJob=pos20Jobs?.find(job=>job.name==='POS20 exact selector'&&job.conclusion==='success');
  if(selectorJob)selector=parsePos20SelectorLog(await jobLog(repo,selectorJob.id));
  const pos20=pos20Side(pos20Jobs,selector);
  if(pos20.verdict==='FAIL'&&await oldInfra(client,repo,pos20Run,pos20Jobs,'POS20 exact-head cognitive seal'))pos20.verdict='INFRA';
  const fastRun=latest(GAMEPLAY_FAST_PATH);const fastJobs=await jobsOf(fastRun);
  const gameplayFast=gameplayFastSide(fastJobs,coverage);
  if(gameplayFast.verdict==='FAIL'&&await oldInfra(client,repo,fastRun,fastJobs,'__no_seal__'))gameplayFast.verdict='INFRA';
  const gateRun=latest(GATE_PATH);const gateJobs=await jobsOf(gateRun);
  let gate={verdict:'ABSENT',ran:[]};
  if(gateJobs){
    const seal=gateJobs.find(job=>job.name==='seal');
    if(!seal||seal.status!=='completed')gate={verdict:'PENDING',ran:[],run_attempt:gateRun.run_attempt};
    else{
      const summary=seal.conclusion==='skipped'?null:parseGateSummaryLog(await jobLog(repo,seal.id).catch(()=>''));
      gate={verdict:summary?.verdict==='PASS'&&seal.conclusion==='success'?'PASS':summary?.verdict||'FAIL',profile:summary?.route_profile??null,ran:summary?.ran_ids||[],run_attempt:gateRun.run_attempt};
    }
  }
  return compareHead({head,pos20,gameplayFast,gate});
}
async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;let head=null;let summary=false;let limit=50;let canaryHeads=[];let infraRuns=[];
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--repo')repo=argv[++i];
    else if(argv[i]==='--head')head=argv[++i];
    else if(argv[i]==='--summary')summary=true;
    else if(argv[i]==='--limit')limit=Number(argv[++i]);
    else if(argv[i]==='--canary-heads')canaryHeads=argv[++i].split(',').filter(Boolean);
    else if(argv[i]==='--infra-runs')infraRuns=argv[++i].split(',').filter(Boolean);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if(!repo||!/^[^/\s]+\/[^/\s]+$/.test(repo))throw new Error('--repo owner/name is required');
  const client=githubClient();
  const coverage=JSON.parse(fs.readFileSync(path.join(root,'GATE_COVERAGE.json'),'utf8'));
  if(!summary){
    if(!/^[0-9a-f]{40}$/.test(head||''))throw new Error('--head <40-hex sha> is required (or use --summary)');
    console.log(JSON.stringify(await compareLive(client,repo,head,coverage)));
    return;
  }
  // Exit-criteria report over the most recent real PR heads the gate saw (canary heads excluded).
  const gateRuns=(await client.get(`repos/${repo}/actions/workflows/showdown-gate.yml/runs?event=pull_request&per_page=100`))?.workflow_runs||[];
  const heads=[...new Set(gateRuns.map(run=>run.head_sha))].filter(sha=>!canaryHeads.includes(sha)).slice(0,limit);
  const comparisons=[];
  const superseded=[];
  for(const sha of heads){const c=await compareLive(client,repo,sha,coverage);(c.superseded===true?superseded:comparisons).push(c);console.log(JSON.stringify(c));}
  const canaries=[];for(const sha of canaryHeads)canaries.push(await compareLive(client,repo,sha,coverage));
  const infra=[];
  for(const id of infraRuns){
    const run=await client.get(`repos/${repo}/actions/runs/${id}`);
    const attribution=run.name==='Showdown Gate'&&String(run.path||'').replace(/@.*$/,'')===GATE_PATH?await readPhysioReruns(client,repo,run):null;
    infra.push({run_id:Number(id),run_attempt:Number(run.run_attempt),watchdog_reruns:attribution?.length??null,physio_reruns:attribution,conclusion:run.conclusion});
  }
  console.log(JSON.stringify({...evaluateExitCriteria({comparisons,canaries,infraRuns:infra}),superseded_heads:superseded.map(c=>c.head),canaries:canaries.map(c=>({head:c.head,gate:c.gate})),infra_runs:infra}));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
