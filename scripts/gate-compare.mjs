// Shadow comparison for one head: Validate POS20 + Validate Gameplay Fast versus Showdown Gate.
// Prints one JSON line. Not wired into any required check.
//   node scripts/gate-compare.mjs --head <sha> [--repo owner/name]
//   node scripts/gate-compare.mjs --summary [--limit 50] [--canary-heads sha,sha] [--infra-runs runId]   (exit criteria)
// Checks: same route profile, the gate ran a superset of what the old gates ran, and verdicts agree.
// The disagreement that blocks leaving shadow is gate_pass_old_fail.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient,classifyRun} from './gate-watchdog.mjs';
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
  const comparable=!['PENDING','ABSENT','INFRA'].includes(oldVerdict)&&!['PENDING','ABSENT','INFRA_RETRYING','INFRA_EXHAUSTED','DRAFT','SUPERSEDED'].includes(gateVerdict);
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
  const real=comparisons.filter(c=>c.comparable);
  const disagreements=real.filter(c=>c.gate_pass_old_fail);
  const canaryOk=canaries.filter(c=>c.gate?.verdict==='FAIL_TEST'&&Number(c.gate?.run_attempt)===1);
  const infraOk=infraRuns.filter(r=>r.run_attempt===2&&r.watchdog_reruns===1);
  const criteria={
    heads:{have:real.length,need:EXIT_CRITERIA.minHeads,ok:real.length>=EXIT_CRITERIA.minHeads},
    full_seals:{have:real.filter(c=>c.full_seal).length,need:EXIT_CRITERIA.minFullSeals,ok:real.filter(c=>c.full_seal).length>=EXIT_CRITERIA.minFullSeals},
    disagreements:{have:disagreements.length,heads:disagreements.map(c=>c.head),ok:disagreements.length<=EXIT_CRITERIA.maxDisagreements},
    gate_ran_superset:{missing_heads:real.filter(c=>!c.gate_ran_superset).map(c=>c.head),ok:real.every(c=>c.gate_ran_superset)},
    canaries:{have:canaryOk.length,need:EXIT_CRITERIA.canaries,ok:canaryOk.length>=EXIT_CRITERIA.canaries},
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
// Old-side verdicts that failed only for infra (no machine, lost runner) are reported as INFRA.
async function oldInfra(client,repo,run,jobs,sealJobName){
  if(!run||run.status!=='completed'||run.conclusion==='success')return false;
  const annotations={};
  for(const job of jobs||[])if(!['success','skipped','neutral'].includes(String(job.conclusion))){try{annotations[job.id]=await client.get(`repos/${repo}/check-runs/${job.id}/annotations?per_page=50`)||[];}catch{annotations[job.id]=[];}}
  const c=classifyRun({run:{...run,event:'push'},jobs:jobs||[],annotations,sealJobName});
  return ['INFRA','INFRA_EXHAUSTED'].includes(c.classification);
}
export async function compareLive(client,repo,head,coverage){
  const runs=(await client.get(`repos/${repo}/actions/runs?head_sha=${head}&per_page=100`))?.workflow_runs||[];
  const latest=p=>runs.filter(run=>String(run.path||'').replace(/@.*$/,'')===p).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0]||null;
  const jobsOf=async run=>run?((await client.get(`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))?.jobs||[]):null;
  const pos20Run=latest(POS20_PATH);const pos20Jobs=await jobsOf(pos20Run);
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
  for(const sha of heads){const c=await compareLive(client,repo,sha,coverage);comparisons.push(c);console.log(JSON.stringify(c));}
  const canaries=[];for(const sha of canaryHeads)canaries.push(await compareLive(client,repo,sha,coverage));
  const infra=[];
  for(const id of infraRuns){const run=await client.get(`repos/${repo}/actions/runs/${id}`);infra.push({run_id:Number(id),run_attempt:Number(run.run_attempt),watchdog_reruns:Math.max(0,Number(run.run_attempt)-1),conclusion:run.conclusion});}
  console.log(JSON.stringify({...evaluateExitCriteria({comparisons,canaries,infraRuns:infra}),canaries:canaries.map(c=>({head:c.head,gate:c.gate})),infra_runs:infra}));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
