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

// Include the regression's deploy replay, provider modules, helpers and fixtures too. Broad families
// deliberately cover new/transitive dependencies rather than silently inheriting an unrelated green run.
export const L5_INPUTS=Object.freeze([
  'firestore*.rules','firestore.*.fragment.rules','firebase*.json',
  'scripts/*firestore*','scripts/*rules*','scripts/inject-persistent-pair-rules.mjs',
  'tests/firebase/**','tests/rules/**','data/transferOptions.js','package.json','package-lock.json',
  '.github/workflows/showdown-gate.yml','scripts/showdown-gate.mjs',
  'scripts/**','tests/**','js/**','data/**','.github/workflows/**','*.json','*.js','index.html','RELEASE*.md'
]);
export function l5Affected(files){
  // Missing/malformed evidence must never authorize a skip.
  if(!Array.isArray(files)||files.some(file=>typeof file!=='string'||!file))return true;
  return files.some(file=>L5_INPUTS.some(glob=>path.matchesGlob(file,glob)));
}
export function l5Decision({event,baseRef,files}){
  if(event!=='pull_request')return {l5_run:true,l5_reason:'event is not pull_request'};
  if(baseRef==='main')return {l5_run:true,l5_reason:'PR targets main'};
  if(typeof baseRef!=='string'||!baseRef.trim())return {l5_run:true,l5_reason:'PR base ref is unknown'};
  if(l5Affected(files))return {l5_run:true,l5_reason:'L5 inputs changed or changed-file evidence is invalid'};
  return {l5_run:false,l5_reason:'non-main PR with no L5 input changes'};
}

// L7 Ironman (Phoenix W10): the fault-injection journey, one job per fault, plus a 3-season CE2PG. It is heavy (a real
// two-phone Showdown per job), so on a PR into a release branch it runs only when something the game or those journeys
// load changed. The rule is fail-closed: a PR skips L7 only when EVERY changed file is plainly outside the game (notes,
// the Story, planning files, Node-only contracts and their JSON registers). Anything else, including a new folder, runs it.
// tapkill (B3's W3 tap-memory proof) runs in the full matrix and by hand; it joins the Gate with W3 (#1592), whose PR adds it here
// and to the l7-ironman matrix, since without tap memory its six shared taps cannot land by themselves.
export const L7_LEGS=Object.freeze(['none','network','lock','evict','reload','tabkill','twotabs','quota','coldoffline','swap','skew','double','listener','lostreply','ce2pg']);
export const L7_SKIP_ONLY=Object.freeze([
  '*.md','**/*.md','chronicle/**','project-documents/**','authority-history/**','docs/**','audit/**','gameplay/**','owner-sns/**',
  'pos10-recovery/**','WORK_ENVIRONMENT_ARCHIVE/**','acceptance/**','tools/**','tests/contracts/**','tests/operations/**',
  'POS10_*.json','POS20_*.json','CURRENT_PRODUCT_*.json','DORMANT_*.json','GATE_COVERAGE.json','MILESTONE_*.json','SESSION_*.json',
  'SHARED_SHOWDOWN_*.json','REMOTE_JOINING_READINESS.json','WORK_ENVIRONMENT_STATUS.json','PROJECT_OPERATING_SYSTEM_*.json'
]);
export function l7Affected(files){
  if(!Array.isArray(files)||files.some(file=>typeof file!=='string'||!file))return true;
  return files.some(file=>!L7_SKIP_ONLY.some(glob=>path.matchesGlob(file,glob)));
}
// The heavy set (Phoenix B1, lead OK 2026-11-24): the epilogue points (home-join, end-showdown, sacked, unpair: two more
// short Showdowns) and the three slowest legs. A PR into a release branch runs them only when it may touch pairing, Home,
// Settings or sync, and that is fail-closed too: the light set is a short list of files known to be look-only (3D scenes,
// styles, art, kits, commentary words) or Node-only. Any other file, invalid evidence, a PR into main and every push or
// manual run (the Ironman full matrix, gameplay/r* pushes) run the heavy set. Nothing is dropped: a skipped heavy leg is a
// verified skip, the same as a skipped L7.
export const L7_HEAVY_LEGS=Object.freeze(['double','twotabs','coldoffline']);
export const L7_LIGHT_ONLY=Object.freeze([
  'css/**','assets/**','visual-assets/**','tests/pos1m/**',
  'js/chamberMenScene3d.js','js/chamberMenStadium3d.js','js/clubDrawScene3d.js','js/leagueRouletteScene3d.js','js/footballVisuals.js',
  'js/fullMotionHonor.js','js/gfxTier.js','js/kits17.js','js/commentaryEngine.js','js/commentaryV3.js','js/iconNames.js',
  'js/visualIdentity.js','js/menuFeedback.js','js/ruleBook.js','js/trophyRoom.js','js/statistics.js'
]);
export function l7Heavy(files){
  if(!Array.isArray(files)||files.some(file=>typeof file!=='string'||!file))return true;
  return files.some(file=>!L7_SKIP_ONLY.some(glob=>path.matchesGlob(file,glob))&&!L7_LIGHT_ONLY.some(glob=>path.matchesGlob(file,glob)));
}
export function l7Decision({event,baseRef,files,leg=null}){
  const heavyLeg=L7_HEAVY_LEGS.includes(leg);
  if(event!=='pull_request')return {l7_run:true,l7_reason:'event is not pull_request',l7_heavy:true};
  if(baseRef==='main')return {l7_run:true,l7_reason:'PR targets main',l7_heavy:true};
  if(typeof baseRef!=='string'||!baseRef.trim())return {l7_run:true,l7_reason:'PR base ref is unknown',l7_heavy:true};
  if(!l7Affected(files))return {l7_run:false,l7_reason:'non-main PR that changes no game or journey file',l7_heavy:false};
  if(l7Heavy(files))return {l7_run:true,l7_reason:'pairing, Home, Settings, sync or unclassified files changed (heavy set: epilogue on'+(heavyLeg?', heavy leg runs)':')'),l7_heavy:true};
  if(heavyLeg)return {l7_run:false,l7_reason:'heavy leg: the PR changes only look-only or Node-only game files (it runs in the full matrix and on PRs into main)',l7_heavy:false};
  return {l7_run:true,l7_reason:'game files changed, all look-only or Node-only (light set: epilogue off)',l7_heavy:false};
}
// The seed every L7 job of one head shares: the first 8 hex digits of the head (a new head explores new fault timings;
// a rerun of the same head replays the same ones). FIJ_SEED / CE2PG run choice in scripts/ironman-leg.mjs.
export function l7Seed(headSha){return sha(headSha)?Number.parseInt(headSha.slice(0,8),16):null;}
export const l7Lane=leg=>`L7-${leg}`;
export const isL7=lane=>typeof lane==='string'&&lane.startsWith('L7-');
const l7Proof=leg=>`IRONMAN_${leg.toUpperCase()}`;
// L8 POS1M Ring 1 (Phoenix B4 + B1): 20,000 seeded two-manager stories against the stand-in Rules model on every PR, 3 shard
// jobs (every 3rd seed each), plus the planted-bug proof in each shard job (the engine must still catch every planted bug; it is short). Node only,
// no emulator, no browser: it always runs (no skip, nothing to verify). The 50,000 and million runs stay manual (B4).
export const L8_SHARDS=Object.freeze([1,2,3]);
export const l8Lane=shard=>`L8-${shard}`;
export const isL8=lane=>typeof lane==='string'&&lane.startsWith('L8-');
// The lane argument a matrix job passes: its matrix value (L7-${{ matrix.leg }}, L8-${{ matrix.shard }}).
export const laneArgOf=lane=>isL7(lane)?'L7-${{ matrix.leg }}':isL8(lane)?'L8-${{ matrix.shard }}':lane;

// Exactly the list `node tests/support/run-selected-product-contracts.cjs --all` executes.
export function registeredContracts(){
  const manifest=readJson('CURRENT_PRODUCT_TEST_MANIFEST.json');
  const supplemental=readJson('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json');
  return [...new Set([...manifest.tests,...supplemental.tests.map(entry=>entry.path)])];
}

// Lane definitions: workflow step id -> ids that step proves when its outcome is success.
// '@contracts' expands to every registered contract; '@group:G' to the routed proofs of group G.
const LANE_DEFS={
  L1:{job:'l1-core',name:'L1 core',groups:['STATIC','INLINE'],fixed:['BENCHMARK','OPERATIONS_AUDIT','CONTRACTS_ALL','RULES_BUILD_ZERO_BILLING'],
    steps:{benchmark:['BENCHMARK'],operations:['OPERATIONS_AUDIT','OPERATIONS'],contracts:['CONTRACTS_ALL','@contracts'],rules:['RULES_BUILD_ZERO_BILLING'],proof_inline:['@group:INLINE'],proof_static:['@group:STATIC']}},
  L2:{job:'l2-browser-full',name:'L2 browser full',groups:['FULL'],fixed:[],steps:{proof_full:['@group:FULL']}},
  L3A:{job:'l3a',name:'L3A storage gameplay',groups:['STORAGE'],
    fixed:['GF_RULES_BUILD_ZERO_BILLING','GF_SHARED_SETUP_PROVIDER','GF_TRANSFER_FRESH_SESSION','GF_LIFECYCLE_1_3','GF_TERMINAL_CLOSE','GF_PERSISTENT_PAIR','GF_TWO_MANAGER_JOURNEY_3_10','GF_CAREER_INDEX','GF_COMPLETED_READ','GF_CLOSED_ADAPTER','GF_COMPLETED_TRANSFER','GF_SEASON_ACK'],
    steps:{proof_storage:['@group:STORAGE'],gf_rules:['GF_RULES_BUILD_ZERO_BILLING'],gf_setup:['GF_SHARED_SETUP_PROVIDER'],gf_transfer:['GF_TRANSFER_FRESH_SESSION'],gf_lifecycle:['GF_LIFECYCLE_1_3'],gf_terminal:['GF_TERMINAL_CLOSE'],gf_pair:['GF_PERSISTENT_PAIR'],gf_journey:['GF_TWO_MANAGER_JOURNEY_3_10'],gf_career_index:['GF_CAREER_INDEX'],gf_completed_read:['GF_COMPLETED_READ'],gf_closed_adapter:['GF_CLOSED_ADAPTER'],gf_completed_transfer:['GF_COMPLETED_TRANSFER'],gf_season_ack:['GF_SEASON_ACK']}},
  L3B:{job:'l3b',name:'L3B visual',groups:['VISUAL'],fixed:[],steps:{proof_visual:['@group:VISUAL']}},
  L4:{job:'l4-remote',name:'L4 remote',groups:['REMOTE'],fixed:[],steps:{proof_remote:['@group:REMOTE'],lifecycle_rules:['LIFECYCLE_COMPOSED_RULES_BUILD'],lifecycle:['LIFECYCLE_COMPOSED_1_3_5_10']}},
  L5:{job:'l5-rules-regression',name:'L5 rules regression',groups:[],fixed:['COMPOSED_RULES_REGRESSION','RULES_BUDGET_SWEEP'],steps:{regression:['COMPOSED_RULES_REGRESSION'],budget_sweep:['RULES_BUDGET_SWEEP']}},
  L6:{job:'l6-browser-journey',name:'L6 browser journey',groups:[],fixed:['JOURNEY_RULES_BUILD_ZERO_BILLING','TWO_MANAGER_BROWSER_JOURNEY','R79_TWO_PLAYER_JOURNEY'],steps:{rules:['JOURNEY_RULES_BUILD_ZERO_BILLING'],journey:['TWO_MANAGER_BROWSER_JOURNEY'],r79_journey:['R79_TWO_PLAYER_JOURNEY']}}
};
// L7 is one matrix job (l7-ironman); each leg is its own lane record (showdown-gate-lane-L7-<leg>), checked like a lane.
for(const leg of L7_LEGS)LANE_DEFS[l7Lane(leg)]={job:'l7-ironman',name:'L7 Ironman',leg,groups:[],fixed:[l7Proof(leg)],steps:{ironman:[l7Proof(leg)]}};
for(const shard of L8_SHARDS)LANE_DEFS[l8Lane(shard)]={job:'l8-pos1m',name:'L8 POS1M',shard,groups:[],fixed:['POS1M_STANDIN',`POS1M_RING1_${shard}`,'POS1M_PLANTED'],
  steps:{pos1m_standin:['POS1M_STANDIN'],pos1m_ring1:[`POS1M_RING1_${shard}`],pos1m_planted:['POS1M_PLANTED']}};
export const LANES=Object.freeze(LANE_DEFS);
export const LANE_IDS=Object.freeze(Object.keys(LANES));
export const ALL_GROUPS=Object.freeze([...new Set(Object.values(graph.proofBundleGroups))].sort());

const routedProofs=(route,groups)=>(route.proofs||[]).filter(id=>groups.includes(groupOf(id)));
export function laneFlags(route){
  const groups=new Set((route.proofs||[]).map(groupOf));
  return Object.fromEntries([...ALL_GROUPS.map(group=>[`has_${group.toLowerCase()}`,groups.has(group)]),['lifecycle_routed',(route.proofs||[]).includes(LIFECYCLE_PROOF)]]);
}
// What a lane is responsible for on this route.
export function selectedFor(lane,route,{l5Run=true,l7Run=true}={}){
  const def=LANES[lane];if(!def)throw new Error(`Unknown lane ${lane}`);
  if(lane==='L5'&&l5Run===false)return [];
  if(isL7(lane)&&l7Run===false)return [];
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
  // A rename away from an input still changes that input. Keep both paths in the diff evidence.
  if(args[0]==='diff')args=[...args,'--no-renames'];
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
// The finalize steps set no GATE_EVENT, so fall back to the runner's own GITHUB_EVENT_NAME: lanes and the
// seal must bind the same base (pull_request.base.sha, never the previous PR head in payload.before).
export function baseFromEnv(env=process.env){
  let payload={};
  if(env.GITHUB_EVENT_PATH)payload=JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH,'utf8'));
  const event=env.GATE_EVENT||env.GITHUB_EVENT_NAME||null;
  return event==='pull_request'?(env.GATE_BASE_SHA||payload.pull_request?.base?.sha||null):(env.GATE_BEFORE_SHA||payload.before||null);
}
export function baseRefFromEnv(env=process.env){
  let payload={};
  if(env.GITHUB_EVENT_PATH)payload=JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH,'utf8'));
  return env.GATE_BASE_REF||payload.pull_request?.base?.ref||null;
}

export function buildLaneRecord({lane,headSha,baseSha,runId,runAttempt,route,steps,jobStatus,l5Run=true,l5Reason=null,l7Run=true,l7Reason=null,l7Heavy=null,files=null,ironman=null}){
  const selected=route?selectedFor(lane,route,{l5Run,l7Run}):[];
  const ran=route?ranFor(lane,route,steps):[];
  // An L7 leg also carries its seed, its attempts and whether it only passed on the rerun (FLAKY: filed and fixed, never skipped).
  const l7=isL7(lane)?{leg:LANES[lane].leg,l7_run:l7Run,l7_reason:l7Reason,l7_heavy:l7Heavy===true?true:l7Heavy===false?false:null,files,ironman:ironman&&typeof ironman==='object'?{verdict:ironman.verdict??null,seed:ironman.seed??null,seasons:ironman.seasons??null,epilogue:typeof ironman.epilogue==='boolean'?ironman.epilogue:null,attempts:Array.isArray(ironman.attempts)?ironman.attempts.length:null,replay:ironman.replay??null}:null}:{};
  return {schema:LANE_SCHEMA,lane,job:LANES[lane].job,head_sha:headSha,base_sha:baseSha??null,run_id:runId==null?null:Number(runId),run_attempt:runAttempt==null?null:Number(runAttempt),route_profile:route?.profile??null,route_digest:routeDigest(route),selected,ran,missing:selected.filter(id=>!ran.includes(id)),result:jobStatus||'unknown',...(lane==='L5'?{l5_run:l5Run,l5_reason:l5Reason,files}: {}),...l7};
}

// Pure seal evaluation. needs: {jobId:{result}}; lanes: {L1:laneRecord|null}; classification: classifyRun output or null.
export function evaluateSeal({event,draft,headSha,baseSha=null,baseRef=null,files=null,prLiveHead=null,route,needs,lanes,classification=null,runAttempt=null,runId=null}){
  const failures=[];
  const laneSummary={};
  for(const lane of LANE_IDS){
    const job=LANES[lane].job;
    laneSummary[lane]={job,result:needs?.[job]?.result??'missing',selected:lanes?.[lane]?.selected?.length??0,ran:lanes?.[lane]?.ran?.length??0};
  }
  const flaky=[];
  const ranIds=()=>[...new Set(LANE_IDS.flatMap(lane=>Array.isArray(lanes?.[lane]?.ran)?lanes[lane].ran:[]))].sort();
  const summary=verdict=>({schema:SCHEMA,verdict,head_sha:headSha,base_sha:baseSha,event,run_id:runId,run_attempt:runAttempt,retries_used:positiveInteger(runAttempt)?runAttempt-1:null,route_profile:route?.profile??null,route_digest:routeDigest(route),lanes:laneSummary,failures,flaky,ran_ids:ranIds()});
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
    let l5Skip=false;
    if(lane==='L5'&&!record.ran.includes('COMPOSED_RULES_REGRESSION')){
      l5Skip=record.l5_run===false&&l5Decision({event,baseRef,files}).l5_run===false&&
        Array.isArray(record.files)&&JSON.stringify(record.files)===JSON.stringify(files);
      if(!l5Skip)failures.push('L5: regression did not pass and the independent input recompute did not verify the recorded skip');
    }
    let l7Skip=false;
    if(isL7(lane)){
      if(record.leg!==LANES[lane].leg)failures.push(`${lane}: leg identity ${record.leg} != ${LANES[lane].leg}`);
      if(!record.ran.includes(LANES[lane].fixed[0])){
        l7Skip=record.l7_run===false&&l7Decision({event,baseRef,files,leg:LANES[lane].leg}).l7_run===false&&
          Array.isArray(record.files)&&JSON.stringify(record.files)===JSON.stringify(files);
        if(!l7Skip)failures.push(`${lane}: the Ironman leg did not pass and the independent input recompute did not verify the recorded skip`);
      }else{
        // A leg that ran without the epilogue is only good when the independent recompute agrees it was the light set.
        if(LANES[lane].leg!=='ce2pg'&&record.ironman?.epilogue===false&&l7Decision({event,baseRef,files,leg:LANES[lane].leg}).l7_heavy!==false)failures.push(`${lane}: the leg ran without the epilogue but the independent recompute selects the heavy set`);
      }
      if(record.ran.includes(LANES[lane].fixed[0])&&record.ironman?.verdict==='FLAKY')flaky.push(`${lane}: passed only on the rerun (seed ${record.ironman.seed}); replay: ${record.ironman.replay}`);
    }
    const expected=selectedFor(lane,route,{l5Run:!l5Skip,l7Run:!l7Skip});
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
  const l5=l5Decision({event,baseRef:baseRefFromEnv(),files});
  const l7=l7Decision({event,baseRef:baseRefFromEnv(),files,leg:isL7(lane)?LANES[lane].leg:null});
  const record={schema:'showdown-gate-route/v1',event,head_sha:process.env.GATE_HEAD_SHA,base_sha:baseFromEnv(),files,route,...l5,...l7};
  if(opts.out)fs.writeFileSync(opts.out,`${JSON.stringify(record,null,2)}\n`);
  const flags={...laneFlags(route),...(lane==='L5'?l5:{}),...(isL7(lane)?{...l7,seed:l7Seed(process.env.GATE_HEAD_SHA)}:{})};
  writeOutputs(opts['github-output'],{profile:route.profile,proofs_csv:route.proofs.join(','),...flags});
  console.log(`Showdown Gate route ${route.profile}: ${route.testCount} tests, ${route.proofCount} proofs, groups ${JSON.stringify(route.proofGroups||[])}${lane?`; ${lane} selects ${selectedFor(lane,route,{l5Run:l5.l5_run,l7Run:l7.l7_run}).length} ids`:''}${isL7(lane)?` (${l7.l7_reason})`:''}`);
  console.log(JSON.stringify({files,profile:route.profile,proofs:route.proofs,flags}));
}
function readRouteRecord(file){
  if(!file||!fs.existsSync(file))return null;
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
async function cmdFinalize(opts){
  const lane=opts.lane;if(!LANES[lane])throw new Error(`Unknown lane ${lane}`);
  let steps={};
  try{steps=JSON.parse(process.env.GATE_STEPS_JSON||'{}');}catch{steps={};}
  const routeRecord=readRouteRecord(opts.route);
  let ironman=null;
  if(isL7(lane)&&opts.ironman&&fs.existsSync(opts.ironman)){try{ironman=JSON.parse(fs.readFileSync(opts.ironman,'utf8'));}catch{ironman=null;}}
  const record=buildLaneRecord({lane,headSha:process.env.GATE_HEAD_SHA,baseSha:baseFromEnv(),runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GATE_RUN_ATTEMPT,route:routeRecord?.route,steps,jobStatus:process.env.GATE_JOB_STATUS,l5Run:routeRecord?.l5_run===false?false:true,l5Reason:routeRecord?.l5_reason,l7Run:routeRecord?.l7_run===false?false:true,l7Reason:routeRecord?.l7_reason,l7Heavy:routeRecord?.l7_heavy,files:routeRecord?.files,ironman});
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
  let route=null;let files=null;
  try{const record=readRouteRecord(opts.route);route=record?.route;files=record?.files??null;}catch(error){console.error(`route unreadable: ${error.message}`);}
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
  const summary=evaluateSeal({event,draft,headSha,baseSha:baseFromEnv(env),baseRef:baseRefFromEnv(env),files,prLiveHead,route,needs,lanes,classification,runAttempt,runId:env.GITHUB_RUN_ID?Number(env.GITHUB_RUN_ID):null});
  summary.generated_at=new Date().toISOString();
  const out=opts.out||'gate-summary.json';
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
  fs.writeFileSync(out,`${JSON.stringify(summary,null,2)}\n`);
  console.log(`SHOWDOWN_GATE_SUMMARY ${JSON.stringify(summary)}`);
  if(env.GITHUB_STEP_SUMMARY){
    const rows=LANE_IDS.map(lane=>`| ${lane} | ${summary.lanes[lane].job} | ${summary.lanes[lane].result} | ${summary.lanes[lane].selected} | ${summary.lanes[lane].ran} |`);
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY,[`### Showdown Gate seal: ${summary.verdict}`,'',`Head \`${headSha}\`, route \`${summary.route_profile}\`, attempt ${summary.run_attempt}, retries used ${summary.retries_used}.`,'','| lane | job | result | selected | ran |','|---|---|---|---|---|',...rows,'',...(summary.failures.length?['**Failures**','',...summary.failures.map(f=>`- ${f}`),'']:[]),...(summary.flaky.length?['**Flaky (passed on the rerun with the same seed: file it and fix it)**','',...summary.flaky.map(f=>`- ${f}`),'']:[]),'```json',JSON.stringify(summary,null,2),'```',''].join('\n'));
  }
  if(summary.verdict!=='PASS'){console.error(`Showdown Gate seal ${summary.verdict}: ${summary.failures.join(' | ')}`);process.exitCode=1;}
  else console.log('PASS Showdown Gate seal: every lane passed on this exact head and every routed id ran.');
  for(const line of summary.flaky)console.log(`::warning title=Ironman FLAKY::${line}`);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,...rest]=process.argv.slice(2);
  const commands={route:cmdRoute,finalize:cmdFinalize,seal:cmdSeal};
  if(!commands[command]){console.error('usage: showdown-gate.mjs route|finalize|seal [--lane Ln] [--out file] [--route file] [--lanes-dir dir] [--github-output file]');process.exitCode=2;}
  else commands[command](args(rest)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
