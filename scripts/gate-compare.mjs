// Shadow comparison for one head: Validate POS20 + Validate Gameplay Fast versus Showdown Gate.
// Prints one JSON line. Not wired into any required check.
//   node scripts/gate-compare.mjs --head <sha> [--repo owner/name]
// Checks: same route profile, the gate ran a superset of what the old gates ran, and verdicts agree.
// The disagreement that blocks leaving shadow is gate_pass_old_fail.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {githubClient} from './gate-watchdog.mjs';
import {groupOf,LIFECYCLE_PROOF} from './showdown-gate.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const POS20_PATH='.github/workflows/validate-pos10.yml';
export const GAMEPLAY_FAST_PATH='.github/workflows/validate-gameplay-fast.yml';
export const GATE_PATH='.github/workflows/showdown-gate.yml';

// Pure comparison. Each side: {verdict:'PASS'|'FAIL'|'PENDING'|'ABSENT', profile?, ran:[ids]}.
export function compareHead({head,pos20,gameplayFast,gate}){
  const old=[pos20,gameplayFast].filter(side=>side&&side.verdict!=='ABSENT');
  const oldVerdict=!old.length?'ABSENT':old.some(side=>side.verdict==='PENDING')?'PENDING':old.every(side=>side.verdict==='PASS')?'PASS':'FAIL';
  const gateVerdict=gate?.verdict||'ABSENT';
  const gateRan=new Set(gate?.ran||[]);
  const oldRan=[...new Set(old.flatMap(side=>side.ran||[]))];
  const missing=oldRan.filter(id=>!gateRan.has(id)).sort();
  const comparable=!['PENDING','ABSENT'].includes(oldVerdict)&&!['PENDING','ABSENT','INFRA_RETRYING','DRAFT','SUPERSEDED'].includes(gateVerdict);
  const gatePass=gateVerdict==='PASS';
  return {
    schema:'showdown-gate-compare/v1',head,
    pos20:{verdict:pos20?.verdict||'ABSENT',profile:pos20?.profile??null,ran:(pos20?.ran||[]).length},
    gameplay_fast:{verdict:gameplayFast?.verdict||'ABSENT',ran:(gameplayFast?.ran||[]).length},
    gate:{verdict:gateVerdict,profile:gate?.profile??null,ran:gateRan.size},
    comparable,
    same_route_profile:Boolean(pos20?.profile)&&pos20?.profile===gate?.profile,
    gate_ran_superset:missing.length===0,
    missing_in_gate:missing,
    verdicts_agree:comparable?(oldVerdict==='PASS')===gatePass:null,
    gate_pass_old_fail:comparable&&gatePass&&oldVerdict!=='PASS'
  };
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
async function main(argv){
  let repo=process.env.GITHUB_REPOSITORY||null;let head=null;
  for(let i=0;i<argv.length;i++){if(argv[i]==='--repo')repo=argv[++i];else if(argv[i]==='--head')head=argv[++i];else throw new Error(`Unknown argument: ${argv[i]}`);}
  if(!repo||!/^[0-9a-f]{40}$/.test(head||''))throw new Error('--repo owner/name and --head <40-hex sha> are required');
  const client=githubClient();
  const coverage=JSON.parse(fs.readFileSync(path.join(root,'GATE_COVERAGE.json'),'utf8'));
  const runs=(await client.get(`repos/${repo}/actions/runs?head_sha=${head}&per_page=100`))?.workflow_runs||[];
  const latest=p=>runs.filter(run=>String(run.path||'').replace(/@.*$/,'')===p).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0]||null;
  const jobsOf=async run=>run?((await client.get(`repos/${repo}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`))?.jobs||[]):null;
  const pos20Jobs=await jobsOf(latest(POS20_PATH));
  let selector={profile:null,tests:[],proofs:[]};
  const selectorJob=pos20Jobs?.find(job=>job.name==='POS20 exact selector'&&job.conclusion==='success');
  if(selectorJob)selector=parsePos20SelectorLog(await jobLog(repo,selectorJob.id));
  const gateJobs=await jobsOf(latest(GATE_PATH));
  let gate={verdict:'ABSENT',ran:[]};
  if(gateJobs){
    const seal=gateJobs.find(job=>job.name==='seal');
    if(!seal||seal.status!=='completed')gate={verdict:'PENDING',ran:[]};
    else{
      const summary=seal.conclusion==='skipped'?null:parseGateSummaryLog(await jobLog(repo,seal.id).catch(()=>''));
      gate={verdict:summary?.verdict==='PASS'&&seal.conclusion==='success'?'PASS':summary?.verdict||'FAIL',profile:summary?.route_profile??null,ran:summary?.ran_ids||[]};
    }
  }
  const result=compareHead({head,pos20:pos20Side(pos20Jobs,selector),gameplayFast:gameplayFastSide(await jobsOf(latest(GAMEPLAY_FAST_PATH)),coverage),gate});
  console.log(JSON.stringify(result));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
