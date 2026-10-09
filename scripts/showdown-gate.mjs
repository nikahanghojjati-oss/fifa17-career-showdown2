// Showdown Gate lane and seal helper (phase 1 shadow; not a merge authority).
// Every lane computes its own route by calling the unchanged POS20 router CLI with the same inputs as
// Validate POS20 (exact PR base..head diff; --force-full on push), records what it selected and what it
// ran in lane.json, and the seal recomputes the route and requires every lane green on the exact head
// with every routed id executed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {classifyRun,githubClient,SEAL_JOB_NAME,MAX_ATTEMPTS} from './gate-watchdog.mjs';

export const SCHEMA='showdown-gate/v1';
export const LANE_SCHEMA='showdown-gate-lane/v1';
export const ROUTER='scripts/pos20-impact-router.mjs';
export const VERDICTS=Object.freeze(['PASS','FAIL_TEST','INFRA_RETRYING','INFRA_EXHAUSTED','DRAFT','SUPERSEDED','HEAD_UNKNOWN']);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const graph=readJson('POS10_IMPACT_GRAPH.json');
const proofGroup=new Map();
for(const [bundle,ids] of Object.entries(graph.proofBundles))for(const id of ids)proofGroup.set(id,graph.proofBundleGroups[bundle]);
export const groupOf=id=>proofGroup.get(id)||null;
export const LIFECYCLE_PROOF='SHARED_GAMEPLAY_PROVIDER_LIFECYCLE_EMULATOR';

// Exactly the list `node tests/support/run-selected-product-contracts.cjs --all` executes.
export function registeredContracts(){
  const manifest=readJson('CURRENT_PRODUCT_TEST_MANIFEST.json');
  const supplemental=readJson('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json');
  return [...new Set([...manifest.tests,...supplemental.tests.map(entry=>entry.path)])];
}

// Lane definitions: workflow step id -> ids that step proves when its outcome is success.
// '@contracts' expands to every registered contract; '@group:G' to the routed proofs of group G.
export const LANES=Object.freeze({
  L1:{job:'l1-core',name:'L1 core',groups:['STATIC','INLINE'],fixed:['BENCHMARK','OPERATIONS_AUDIT','CONTRACTS_ALL','RULES_BUILD_ZERO_BILLING'],
    steps:{benchmark:['BENCHMARK'],operations:['OPERATIONS_AUDIT','OPERATIONS'],contracts:['CONTRACTS_ALL','@contracts'],rules:['RULES_BUILD_ZERO_BILLING'],proof_inline:['@group:INLINE'],proof_static:['@group:STATIC']}},
  L2:{job:'l2-browser-full',name:'L2 browser full',groups:['FULL'],fixed:[],steps:{proof_full:['@group:FULL']}},
  L3:{job:'l3-storage-visual-gameplay',name:'L3 storage visual gameplay',groups:['STORAGE','VISUAL'],
    fixed:['GF_RULES_BUILD_ZERO_BILLING','GF_SHARED_SETUP_PROVIDER','GF_TRANSFER_FRESH_SESSION','GF_LIFECYCLE_1_3','GF_TERMINAL_CLOSE','GF_PERSISTENT_PAIR','GF_TWO_MANAGER_JOURNEY_3_10','GF_CAREER_INDEX','GF_COMPLETED_READ','GF_CLOSED_ADAPTER','GF_COMPLETED_TRANSFER','GF_SEASON_ACK'],
    steps:{proof_storage:['@group:STORAGE'],proof_visual:['@group:VISUAL'],gf_rules:['GF_RULES_BUILD_ZERO_BILLING'],gf_setup:['GF_SHARED_SETUP_PROVIDER'],gf_transfer:['GF_TRANSFER_FRESH_SESSION'],gf_lifecycle:['GF_LIFECYCLE_1_3'],gf_terminal:['GF_TERMINAL_CLOSE'],gf_pair:['GF_PERSISTENT_PAIR'],gf_journey:['GF_TWO_MANAGER_JOURNEY_3_10'],gf_career_index:['GF_CAREER_INDEX'],gf_completed_read:['GF_COMPLETED_READ'],gf_closed_adapter:['GF_CLOSED_ADAPTER'],gf_completed_transfer:['GF_COMPLETED_TRANSFER'],gf_season_ack:['GF_SEASON_ACK']}},
  L4:{job:'l4-remote',name:'L4 remote',groups:['REMOTE'],fixed:[],steps:{proof_remote:['@group:REMOTE'],lifecycle_rules:['LIFECYCLE_COMPOSED_RULES_BUILD'],lifecycle:['LIFECYCLE_COMPOSED_1_3_5_10']}},
  L5:{job:'l5-rules-regression',name:'L5 rules regression',groups:[],fixed:['COMPOSED_RULES_REGRESSION'],steps:{regression:['COMPOSED_RULES_REGRESSION']}},
  L6:{job:'l6-browser-journey',name:'L6 browser journey',groups:[],fixed:['JOURNEY_RULES_BUILD_ZERO_BILLING','TWO_MANAGER_BROWSER_JOURNEY'],steps:{rules:['JOURNEY_RULES_BUILD_ZERO_BILLING'],journey:['TWO_MANAGER_BROWSER_JOURNEY']}}
});
export const LANE_IDS=Object.freeze(Object.keys(LANES));
export const ALL_GROUPS=Object.freeze([...new Set(Object.values(graph.proofBundleGroups))].sort());

const routedProofs=(route,groups)=>(route.proofs||[]).filter(id=>groups.includes(groupOf(id)));
export function laneFlags(route){
  const groups=new Set((route.proofs||[]).map(groupOf));
  return Object.fromEntries([...ALL_GROUPS.map(group=>[`has_${group.toLowerCase()}`,groups.has(group)]),['lifecycle_routed',(route.proofs||[]).includes(LIFECYCLE_PROOF)]]);
}
// What a lane is responsible for on this route.
export function selectedFor(lane,route){
  const def=LANES[lane];if(!def)throw new Error(`Unknown lane ${lane}`);
  const ids=[...def.fixed,...routedProofs(route,def.groups)];
  if(lane==='L1'){ids.push(...(route.tests||[]));if(route.operations)ids.push('OPERATIONS');}
  if(lane==='L4'&&(route.proofs||[]).includes(LIFECYCLE_PROOF))ids.push('LIFECYCLE_COMPOSED_RULES_BUILD','LIFECYCLE_COMPOSED_1_3_5_10');
  return [...new Set(ids)];
}
// What a lane actually ran, from its steps context (only steps whose outcome is success count).
export function ranFor(lane,route,steps){
  const def=LANES[lane];if(!def)throw new Error(`Unknown lane ${lane}`);
  const ran=[];
  for(const [stepId,tokens] of Object.entries(def.steps)){
    if(steps?.[stepId]?.outcome!=='success')continue;
    for(const token of tokens){
      if(token==='@contracts')ran.push(...registeredContracts());
      else if(token.startsWith('@group:'))ran.push(...routedProofs(route,[token.slice(7)]));
      else ran.push(token);
    }
  }
  return [...new Set(ran)];
}
// Every id the route demands somewhere in the gate.
export function routedIds(route){
  return [...new Set([...(route.tests||[]),...(route.proofs||[]),...(route.operations?['OPERATIONS']:[]),'BENCHMARK'])];
}

function git(args){
  const result=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
  if(result.status!==0)throw new Error(`git ${args.join(' ')} failed: ${result.stderr||result.error?.message}`);
  return result.stdout;
}
// Same changed-file resolution as Validate POS20's "Resolve exact changed artifacts" step.
export function changedFiles({event,baseSha,headSha,beforeSha,sha}){
  let out='';
  if(event==='pull_request')out=git(['diff','--name-only',baseSha,headSha]);
  else if(event==='push'&&beforeSha&&!/^0+$/.test(beforeSha))out=git(['diff','--name-only',beforeSha,sha]);
  return [...new Set(out.split(/\r?\n/).filter(Boolean))].sort();
}
// Calls the unchanged POS20 router CLI exactly as Validate POS20 does (--force-full on push).
export function computeRoute({files,forceFull}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'showdown-gate-'));
  const filesFile=path.join(dir,'changed-files.txt');
  fs.writeFileSync(filesFile,files.length?`${files.join('\n')}\n`:'');
  const args=[ROUTER,'--files-file',filesFile,...(forceFull?['--force-full']:[]),'--json'];
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
  fs.rmSync(dir,{recursive:true,force:true});
  if(result.status!==0)throw new Error(`POS20 router failed closed: ${result.stderr||result.error?.message}`);
  return JSON.parse(result.stdout);
}
export function routeFromEnv(env=process.env){
  const event=env.GATE_EVENT;
  if(!['pull_request','push'].includes(event))throw new Error(`Unsupported Showdown Gate event: ${event}`);
  const files=changedFiles({event,baseSha:env.GATE_BASE_SHA,headSha:env.GATE_HEAD_SHA,beforeSha:env.GATE_BEFORE_SHA,sha:env.GATE_HEAD_SHA});
  return {event,files,route:computeRoute({files,forceFull:event==='push'})};
}

// Sort object keys recursively; array order remains part of the route's identity.
export function routeDigest(route){
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
  return route?createHash('sha256').update(JSON.stringify(canonical(route))).digest('hex'):null;
}
const positiveInteger=value=>Number.isSafeInteger(value)&&value>0;
const sha=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value);
const validRoute=route=>route&&typeof route.profile==='string'&&route.profile.trim().length>0&&
  ['tests','proofs'].every(key=>Array.isArray(route[key])&&route[key].every(id=>typeof id==='string'&&id.length>0))&&typeof route.operations==='boolean';
export function baseFromEnv(env=process.env){
  let payload={};
  if(env.GITHUB_EVENT_PATH)payload=JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH,'utf8'));
  return env.GATE_EVENT==='pull_request'?(env.GATE_BASE_SHA||payload.pull_request?.base?.sha||null):(env.GATE_BEFORE_SHA||payload.before||null);
}

export function buildLaneRecord({lane,headSha,baseSha,runId,runAttempt,route,steps,jobStatus}){
  const selected=route?selectedFor(lane,route):[];
  const ran=route?ranFor(lane,route,steps):[];
  return {schema:LANE_SCHEMA,lane,job:LANES[lane].job,head_sha:headSha,base_sha:baseSha??null,run_id:runId==null?null:Number(runId),run_attempt:runAttempt==null?null:Number(runAttempt),route_profile:route?.profile??null,route_digest:routeDigest(route),selected,ran,missing:selected.filter(id=>!ran.includes(id)),result:jobStatus||'unknown'};
}

// Pure seal evaluation. needs: {jobId:{result}}; lanes: {L1:laneRecord|null}; classification: classifyRun output or null.
export function evaluateSeal({event,draft,headSha,baseSha=null,prLiveHead=null,route,needs,lanes,classification=null,runAttempt=null,runId=null}){
  const failures=[];
  const laneSummary={};
  for(const lane of LANE_IDS){
    const job=LANES[lane].job;
    laneSummary[lane]={job,result:needs?.[job]?.result??'missing',selected:lanes?.[lane]?.selected?.length??0,ran:lanes?.[lane]?.ran?.length??0};
  }
  const ranIds=()=>[...new Set(LANE_IDS.flatMap(lane=>Array.isArray(lanes?.[lane]?.ran)?lanes[lane].ran:[]))].sort();
  const summary=verdict=>({schema:SCHEMA,verdict,head_sha:headSha,base_sha:baseSha,event,run_id:runId,run_attempt:runAttempt,retries_used:positiveInteger(runAttempt)?runAttempt-1:null,route_profile:route?.profile??null,route_digest:routeDigest(route),lanes:laneSummary,failures,ran_ids:ranIds()});
  if(event==='pull_request'&&draft){failures.push('draft: Showdown Gate does not run on draft pull requests');return summary('DRAFT');}
  if(event==='pull_request'&&!sha(prLiveHead)){failures.push('live PR head could not be resolved; refusing to seal');return summary('HEAD_UNKNOWN');}
  if(event==='pull_request'&&prLiveHead!==headSha){failures.push(`superseded: PR head moved to ${prLiveHead}`);return summary('SUPERSEDED');}
  if(!['pull_request','push'].includes(event)||!sha(headSha)||!sha(baseSha)||!positiveInteger(runId)||!positiveInteger(runAttempt)){
    failures.push('seal event, head, base, run id or attempt is missing or invalid');return summary('FAIL_TEST');
  }
  if(!validRoute(route)){failures.push('seal could not recompute a complete route');return summary('FAIL_TEST');}
  const red=LANE_IDS.filter(lane=>laneSummary[lane].result!=='success');
  if(red.length){
    for(const lane of red)failures.push(`${lane} (${LANES[lane].job}) ${laneSummary[lane].result}`);
    if(classification&&['INFRA','INFRA_EXHAUSTED'].includes(classification.classification)){
      failures.push(...classification.reasons);
      return summary(classification.classification==='INFRA'&&runAttempt<MAX_ATTEMPTS?'INFRA_RETRYING':'INFRA_EXHAUSTED');
    }
    if(classification)failures.push(...(classification.reasons||[]));
    return summary('FAIL_TEST');
  }
  const ranAll=new Set();
  for(const lane of LANE_IDS){
    const record=lanes?.[lane];
    if(!record){failures.push(`${lane}: lane.json missing`);continue;}
    if(record.schema!==LANE_SCHEMA)failures.push(`${lane}: unexpected lane schema ${record.schema}`);
    if(record.lane!==lane)failures.push(`${lane}: lane identity ${record.lane} != ${lane}`);
    if(record.job!==LANES[lane].job)failures.push(`${lane}: job identity ${record.job} != ${LANES[lane].job}`);
    if(record.head_sha!==headSha)failures.push(`${lane}: lane ran on ${record.head_sha}, not ${headSha}`);
    if(record.base_sha!==baseSha)failures.push(`${lane}: base ${record.base_sha} != ${baseSha}`);
    if(record.run_id!==runId)failures.push(`${lane}: run id ${record.run_id} != ${runId}`);
    if(!positiveInteger(record.run_attempt)||record.run_attempt>runAttempt)failures.push(`${lane}: invalid lane attempt ${record.run_attempt} for current attempt ${runAttempt}`);
    if(record.route_profile!==route.profile)failures.push(`${lane}: route profile ${record.route_profile} != ${route.profile}`);
    if(record.route_digest!==routeDigest(route))failures.push(`${lane}: route digest does not match the seal route`);
    if(record.result!=='success')failures.push(`${lane}: lane.json result ${record.result}`);
    if(!Array.isArray(record.selected)||!Array.isArray(record.ran)){failures.push(`${lane}: selected or ran ids are missing or invalid`);continue;}
    const expected=selectedFor(lane,route);
    const missingSelection=expected.filter(id=>!(record.selected||[]).includes(id));
    if(missingSelection.length)failures.push(`${lane}: lane selected fewer ids than the route requires: ${missingSelection.join(', ')}`);
    const notRun=expected.filter(id=>!(record.ran||[]).includes(id));
    if(notRun.length)failures.push(`${lane}: selected but not run: ${notRun.join(', ')}`);
    for(const id of record.ran||[])ranAll.add(id);
  }
  const unrun=routedIds(route).filter(id=>!ranAll.has(id));
  if(unrun.length)failures.push(`routed ids that no lane ran: ${unrun.join(', ')}`);
  return summary(failures.length?'FAIL_TEST':'PASS');
}

async function fetchLaneRecords(client,repo,runId,laneIds){
  const out={};
  const listed=(await client.get(`repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`))?.artifacts||[];
  for(const lane of laneIds){
    const artifact=listed.filter(item=>item.name===`showdown-gate-lane-${lane}`&&!item.expired).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
    if(!artifact)continue;
    const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN;
    const response=await fetch(artifact.archive_download_url,{headers:{authorization:`Bearer ${token}`,accept:'application/vnd.github+json','user-agent':'showdown-gate-seal'}});
    if(!response.ok)throw new Error(`artifact ${artifact.name} download -> ${response.status}`);
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'showdown-gate-lane-'));
    const zip=path.join(dir,'lane.zip');
    fs.writeFileSync(zip,Buffer.from(await response.arrayBuffer()));
    const unzip=spawnSync('unzip',['-p',zip,'lane.json'],{encoding:'utf8'});
    fs.rmSync(dir,{recursive:true,force:true});
    if(unzip.status!==0)throw new Error(`artifact ${artifact.name} unzip failed`);
    out[lane]=JSON.parse(unzip.stdout);
  }
  return out;
}

function writeOutputs(file,entries){
  if(!file)return;
  fs.appendFileSync(file,`${Object.entries(entries).map(([key,value])=>`${key}=${value}`).join('\n')}\n`);
}
function args(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--'))throw new Error(`Unexpected argument: ${argv[i]}`);
    out[argv[i].slice(2)]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;
  }
  return out;
}

async function cmdRoute(opts){
  const lane=opts.lane;
  if(lane&&!LANES[lane])throw new Error(`Unknown lane ${lane}`);
  const {event,files,route}=routeFromEnv();
  const record={schema:'showdown-gate-route/v1',event,head_sha:process.env.GATE_HEAD_SHA,base_sha:baseFromEnv(),files,route};
  if(opts.out)fs.writeFileSync(opts.out,`${JSON.stringify(record,null,2)}\n`);
  const flags=laneFlags(route);
  writeOutputs(opts['github-output'],{profile:route.profile,proofs_csv:route.proofs.join(','),...flags});
  console.log(`Showdown Gate route ${route.profile}: ${route.testCount} tests, ${route.proofCount} proofs, groups ${JSON.stringify(route.proofGroups||[])}${lane?`; ${lane} selects ${selectedFor(lane,route).length} ids`:''}`);
  console.log(JSON.stringify({files,profile:route.profile,proofs:route.proofs,flags}));
}
function readRoute(file){
  if(!file||!fs.existsSync(file))return null;
  return JSON.parse(fs.readFileSync(file,'utf8')).route;
}
async function cmdFinalize(opts){
  const lane=opts.lane;if(!LANES[lane])throw new Error(`Unknown lane ${lane}`);
  let steps={};
  try{steps=JSON.parse(process.env.GATE_STEPS_JSON||'{}');}catch{steps={};}
  const record=buildLaneRecord({lane,headSha:process.env.GATE_HEAD_SHA,baseSha:baseFromEnv(),runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GATE_RUN_ATTEMPT,route:readRoute(opts.route),steps,jobStatus:process.env.GATE_JOB_STATUS});
  const out=opts.out||'lane.json';
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
  fs.writeFileSync(out,`${JSON.stringify(record,null,2)}\n`);
  console.log(`${lane}: selected ${record.selected.length}, ran ${record.ran.length}, missing ${record.missing.length}, result ${record.result}`);
}
async function cmdSeal(opts){
  const env=process.env;
  const event=env.GATE_EVENT;const headSha=env.GATE_HEAD_SHA;const runAttempt=Number(env.GATE_RUN_ATTEMPT);const repo=env.GITHUB_REPOSITORY;
  const draft=env.GATE_DRAFT==='true';
  let needs={};try{needs=JSON.parse(env.GATE_NEEDS_JSON||'{}');}catch{needs={};}
  const lanes={};
  for(const lane of LANE_IDS){
    const file=path.join(opts['lanes-dir']||'lanes',`showdown-gate-lane-${lane}`,'lane.json');
    lanes[lane]=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
  }
  if(!draft&&repo&&env.GITHUB_RUN_ID&&(env.GITHUB_TOKEN||env.GH_TOKEN)&&LANE_IDS.some(lane=>!lanes[lane])){
    // A lane that passed in an earlier attempt keeps its artifact on the run; read it through the API.
    try{Object.assign(lanes,await fetchLaneRecords(githubClient(),repo,env.GITHUB_RUN_ID,LANE_IDS.filter(lane=>!lanes[lane])));}
    catch(error){console.error(`lane artifacts unavailable through the API: ${error.message.split('\n')[0]}`);}
  }
  let route=null;
  try{route=readRoute(opts.route);}catch(error){console.error(`route unreadable: ${error.message}`);}
  let prLiveHead=null;let classification=null;
  const anyRed=LANE_IDS.some(lane=>needs?.[LANES[lane].job]?.result!=='success');
  if(!draft&&repo&&(env.GITHUB_TOKEN||env.GH_TOKEN)){
    const client=githubClient();
    if(event==='pull_request'&&env.GATE_PR_NUMBER){
      try{prLiveHead=(await client.get(`repos/${repo}/pulls/${env.GATE_PR_NUMBER}`))?.head?.sha||null;}catch(error){console.error(`PR head unavailable: ${error.message.split('\n')[0]}`);}
    }
    if(anyRed&&env.GITHUB_RUN_ID){
      try{
        const jobs=((await client.get(`repos/${repo}/actions/runs/${env.GITHUB_RUN_ID}/jobs?filter=latest&per_page=100`))?.jobs||[]).filter(job=>job.name!==SEAL_JOB_NAME);
        const annotations={};
        for(const job of jobs){if(job.conclusion==='success'||job.conclusion==='skipped')continue;try{annotations[job.id]=(await client.get(`repos/${repo}/check-runs/${job.id}/annotations?per_page=50`))||[];}catch{annotations[job.id]=[];}}
        classification=classifyRun({run:{id:Number(env.GITHUB_RUN_ID),status:'completed',conclusion:'failure',event:'push',head_sha:headSha,run_attempt:runAttempt},jobs,annotations});
      }catch(error){console.error(`job classification unavailable: ${error.message.split('\n')[0]}`);}
    }
  }
  const summary=evaluateSeal({event,draft,headSha,baseSha:baseFromEnv(env),prLiveHead,route,needs,lanes,classification,runAttempt,runId:env.GITHUB_RUN_ID?Number(env.GITHUB_RUN_ID):null});
  summary.generated_at=new Date().toISOString();
  const out=opts.out||'gate-summary.json';
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
  fs.writeFileSync(out,`${JSON.stringify(summary,null,2)}\n`);
  console.log(`SHOWDOWN_GATE_SUMMARY ${JSON.stringify(summary)}`);
  if(env.GITHUB_STEP_SUMMARY){
    const rows=LANE_IDS.map(lane=>`| ${lane} | ${summary.lanes[lane].job} | ${summary.lanes[lane].result} | ${summary.lanes[lane].selected} | ${summary.lanes[lane].ran} |`);
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY,[`### Showdown Gate seal: ${summary.verdict}`,'',`Head \`${headSha}\`, route \`${summary.route_profile}\`, attempt ${summary.run_attempt}, retries used ${summary.retries_used}.`,'','| lane | job | result | selected | ran |','|---|---|---|---|---|',...rows,'',...(summary.failures.length?['**Failures**','',...summary.failures.map(f=>`- ${f}`),'']:[]),'```json',JSON.stringify(summary,null,2),'```',''].join('\n'));
  }
  if(summary.verdict!=='PASS'){console.error(`Showdown Gate seal ${summary.verdict}: ${summary.failures.join(' | ')}`);process.exitCode=1;}
  else console.log('PASS Showdown Gate seal: every lane passed on this exact head and every routed id ran.');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,...rest]=process.argv.slice(2);
  const commands={route:cmdRoute,finalize:cmdFinalize,seal:cmdSeal};
  if(!commands[command]){console.error('usage: showdown-gate.mjs route|finalize|seal [--lane Ln] [--out file] [--route file] [--lanes-dir dir] [--github-output file]');process.exitCode=2;}
  else commands[command](args(rest)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
