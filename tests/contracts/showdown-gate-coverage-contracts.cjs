'use strict';
// Showdown Gate coverage: every step of the 16 current gates (Validate POS20 incl. its 6 proof groups,
// and Validate Gameplay Fast) must be run by a mapped Showdown Gate step. Nothing may be dropped.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {readWorkflow,commandLines}=require('../support/gha-workflow-parse.cjs');

const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const coverage=json('GATE_COVERAGE.json');
const graph=json('POS10_IMPACT_GRAPH.json');
const pkg=json('package.json');
const HEAD_REF='${{ github.event.pull_request.head.sha || github.sha }}';
const GATE='.github/workflows/showdown-gate.yml';
const POS20='.github/workflows/validate-pos10.yml';
const FAST='.github/workflows/validate-gameplay-fast.yml';
// Verified upstream tag commits: preserve the old action/version while pinning its implementation.
const ACTION_PINS={
  'actions/checkout@v5':'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
  'actions/setup-node@v5':'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
  'actions/setup-java@v5':'actions/setup-java@b6effb05e454b25005698d916606bdc6ffcbf961',
  'actions/cache@v5':'actions/cache@caa296126883cff596d87d8935842f9db880ef25',
  'actions/upload-artifact@v7':'actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9',
  'actions/download-artifact@v7':'actions/download-artifact@37930b1c2abaa49bbe596cd826c3c89aef350131',
};
const pinnedAction=ref=>{assert.ok(Object.hasOwn(ACTION_PINS,ref),`unverified old action: ${ref}`);return ACTION_PINS[ref];};
function assertPinnedUses(node,where){
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
    if(key==='uses')assert.match(value,/@[0-9a-f]{40}$/i,`${where}.uses must use a full commit SHA`);
    else assertPinnedUses(value,`${where}.${key}`);
  }
}
const groups=[...new Set(Object.values(graph.proofBundleGroups))].sort();
let checks=0;const ok=()=>{checks++;};

(async()=>{
  assert.equal(coverage.schema,'showdown-gate-coverage/v1');
  assert.equal(coverage.gateWorkflow,GATE);
  assert.deepEqual(coverage.oldWorkflows,[POS20,FAST]);
  const gate=readWorkflow(root,GATE);
  assertPinnedUses(gate,GATE);ok();
  const old=Object.fromEntries(coverage.oldWorkflows.map(file=>[file,readWorkflow(root,file)]));
  const gateJob=id=>{const job=gate.jobs[id];assert.ok(job,`Showdown Gate job missing: ${id}`);return job;};
  const gateStep=(jobId,label)=>{const found=gateJob(jobId).steps.filter(step=>step.label===label);assert.equal(found.length,1,`Showdown Gate ${jobId} must have exactly one step "${label}" (found ${found.length})`);return found[0];};

  // 1. The 16 gates: every old job (proof matrix expanded per POS10 group) is listed, and nothing else.
  const expectedGates=[];
  for(const file of coverage.oldWorkflows)for(const [id,job] of Object.entries(old[file].jobs)){
    if(job.strategy?.matrix?.group){assert.match(String(job.strategy.matrix.group),/proof_groups_json/,`${file} ${id} matrix must stay the routed proof groups`);for(const group of groups)expectedGates.push(`${file}#${id}#${group}`);}
    else expectedGates.push(`${file}#${id}`);
  }
  const listedGates=coverage.gates.map(g=>`${g.workflow}#${g.job}${g.matrixGroup?`#${g.matrixGroup}`:''}`);
  assert.deepEqual([...listedGates].sort(),[...expectedGates].sort(),'GATE_COVERAGE.gates must list exactly the current old gates');
  assert.equal(listedGates.length,16,'today there are 16 gates');
  for(const g of coverage.gates){for(const lane of g.lanes)gateJob(lane);ok();}

  // 2. Every old step mapped exactly once; no stale mappings; every target exists.
  const oldSteps=[];
  for(const file of coverage.oldWorkflows)for(const [id,job] of Object.entries(old[file].jobs))for(const step of job.steps)oldSteps.push({file,job:id,step});
  const key=(file,job,label)=>`${file}#${job}#${label}`;
  const mappingByKey=new Map();
  for(const mapping of coverage.mappings){
    const k=key(mapping.workflow,mapping.job,mapping.step);
    assert.ok(!mappingByKey.has(k),`duplicate mapping ${k}`);
    mappingByKey.set(k,mapping);
    assert.ok(coverage.modes[mapping.mode],`unknown mode ${mapping.mode} for ${k}`);
    assert.ok(Array.isArray(mapping.targets)&&mapping.targets.length,`${k} must map to at least one Showdown Gate step`);
    for(const target of mapping.targets)gateStep(target.job,target.step);
  }
  for(const {file,job,step} of oldSteps){
    const k=key(file,job,step.label);
    assert.ok(mappingByKey.has(k),`old gate step is not mapped to Showdown Gate: ${k}`);
    ok();
  }
  const oldKeys=new Set(oldSteps.map(({file,job,step})=>key(file,job,step.label)));
  for(const k of mappingByKey.keys())assert.ok(oldKeys.has(k),`stale mapping (no such old step): ${k}`);

  // 3. Mode verification: the mapped step runs the old command.
  const oldStep=(mapping)=>oldSteps.find(s=>s.file===mapping.workflow&&s.job===mapping.job&&s.step.label===mapping.step).step;
  for(const mapping of coverage.mappings){
    const before=oldStep(mapping);
    const targets=mapping.targets.map(t=>gateStep(t.job,t.step));
    const where=`${mapping.workflow} ${mapping.job} "${mapping.step}"`;
    if(mapping.mode==='checkout'){
      for(const step of targets){assert.equal(step.uses,pinnedAction(before.uses),`${where}: same checkout action`);assert.equal(step.with?.ref,HEAD_REF,`${where}: Showdown Gate must check out the exact head`);}
    }else if(mapping.mode==='setup'){
      for(const step of targets){
        assert.equal(step.uses,pinnedAction(before.uses),`${where}: same action`);
        for(const [k,v] of Object.entries(before.with||{}))if(k!=='cache')assert.equal(step.with?.[k],v,`${where}: with.${k} must be identical`);
      }
    }else if(mapping.mode==='exact'){
      const lines=commandLines(before.run);
      assert.ok(lines.length,`${where}: exact mode needs an old run block`);
      for(const step of targets){
        const have=commandLines(step.run);
        for(const line of lines)assert.ok(have.includes(line),`${where}: Showdown Gate step "${step.label}" does not run: ${line}`);
        for(const [k,v] of Object.entries(before.env||{}))assert.equal(step.env?.[k],v,`${where}: env ${k} must be identical`);
      }
    }else if(mapping.mode==='contracts-all'){
      assert.match(before.run,/node tests\/support\/run-selected-product-contracts\.cjs --tests/);
      assert.equal(pkg.scripts['test:contracts'],'node tests/support/run-selected-product-contracts.cjs --all','test:contracts must run every registered contract');
      for(const step of targets)assert.deepEqual(commandLines(step.run),['npm run test:contracts'],`${where}: must run npm run test:contracts`);
    }else if(mapping.mode==='proof-groups'){
      const oldLines=commandLines(before.run);
      assert.deepEqual(oldLines,['node scripts/pos10-proof-runner.mjs --proofs "$POS20_SELECTED_PROOFS" --group "$POS20_PROOF_GROUP"']);
      const seen=[];
      for(const step of targets){
        assert.deepEqual(commandLines(step.run),oldLines,`${where}: "${step.label}" must run the identical proof-runner command`);
        assert.equal(step.env?.POS20_SELECTED_PROOFS,'${{ steps.route.outputs.proofs_csv }}',`${where}: "${step.label}" must pass the full routed proof list`);
        assert.ok(groups.includes(step.env?.POS20_PROOF_GROUP),`${where}: unknown group ${step.env?.POS20_PROOF_GROUP}`);
        assert.equal(step.label,`TEST: Proof group ${step.env.POS20_PROOF_GROUP}`);
        seen.push(step.env.POS20_PROOF_GROUP);
      }
      assert.deepEqual(seen.sort(),groups,'every POS10 proof group runs exactly once in Showdown Gate');
    }else if(mapping.mode==='route'){
      for(const step of targets){
        if(step.label==='Fetch exact diff base'){assert.match(step.run,/git fetch --no-tags --depth=1 origin "\$base"/);continue;}
        assert.match(step.run,/^node scripts\/showdown-gate\.mjs route\b/,`${where}: "${step.label}" must compute the route with scripts/showdown-gate.mjs`);
        assert.equal(step.env?.GATE_EVENT,'${{ github.event_name }}');
        assert.equal(step.env?.GATE_BASE_SHA,'${{ github.event.pull_request.base.sha }}');
        assert.equal(step.env?.GATE_HEAD_SHA,HEAD_REF);
        assert.equal(step.env?.GATE_BEFORE_SHA,'${{ github.event.before }}');
      }
    }else if(mapping.mode==='seal'){
      assert.match(before.run,/Required POS20 lane did not pass/);
      for(const step of targets)assert.match(step.run,/^node scripts\/showdown-gate\.mjs seal\b/);
    }else if(mapping.mode==='cache'){
      for(const step of targets){assert.equal(step.uses,pinnedAction('actions/cache@v5'));assert.ok(String(step.with?.path).split('\n').includes('~/.cache/firebase/emulators'),`${where}: must cache the Firebase emulators`);}
    }else if(mapping.mode==='artifact'){
      for(const step of targets){assert.equal(step.uses,pinnedAction(before.uses));assert.equal(step.if,before.if);for(const [k,v] of Object.entries(before.with||{}))assert.equal(step.with?.[k],v,`${where}: with.${k}`);}
    }else assert.fail(`unhandled mode ${mapping.mode}`);
    ok();
  }

  // 4. The route the lanes compute is the POS20 router's own answer, on PRs and on main pushes.
  const gateLib=await import(path.join(root,'scripts/showdown-gate.mjs'));
  const router=await import(path.join(root,'scripts/pos20-impact-router.mjs'));
  for(const [files,forceFull] of [[['README.md'],false],[['css/app.css','scripts/pos10-recovery.mjs'],false],[['js/stage4ConnectedRivalry.js'],false],[[],false],[['README.md'],true]]){
    const viaGate=gateLib.computeRoute({files,forceFull});
    const direct=router.routeFiles(files,forceFull?{forceFull:true}:{});
    assert.deepEqual(viaGate,JSON.parse(JSON.stringify(direct)),`gate route for ${JSON.stringify(files)} forceFull=${forceFull} must equal the POS20 router`);
    ok();
  }
  const gateSource=read('scripts/showdown-gate.mjs');
  assert.ok(gateSource.includes("git(['diff','--name-only',baseSha,headSha])"),'PR route uses base..head diff');
  assert.ok(gateSource.includes("git(['diff','--name-only',beforeSha,sha])")&&gateSource.includes('/^0+$/.test(beforeSha)'),'push route uses before..sha diff');
  assert.ok(gateSource.includes("forceFull:event==='push'"),'main push forces the full seal');
  const pos20Route=old[POS20].jobs.route.steps.find(s=>s.id==='route').run;
  assert.match(pos20Route,/--force-full/);assert.match(pos20Route,/--files-file \/tmp\/pos20-changed-files\.txt/);
  // Registered contracts the lane records are exactly what --all runs.
  const manifest=json('CURRENT_PRODUCT_TEST_MANIFEST.json');const supplemental=json('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json');
  assert.deepEqual(gateLib.registeredContracts(),[...new Set([...manifest.tests,...supplemental.tests.map(e=>e.path)])]);
  assert.ok(gateLib.registeredContracts().length>=131,'the census keeps the 129 floor plus the Showdown Gate contracts');
  ok();

  // 5. Lane structure, TEST: naming, step ids that record ran ids, runner pin, no POS20-named checks.
  const laneJobs=Object.values(gateLib.LANES).map(l=>l.job);
  assert.deepEqual(Object.keys(gate.jobs),[...laneJobs,'seal'],'Showdown Gate has exactly seven lanes and the seal');
  const TEST_COMMAND=/npm run (?:test:|work:benchmark)|node tests\/|emulators:exec|pos10-proof-runner|assert-firestore-zero-billing|build-production-firestore-rules|pos20-impact-router|showdown-gate\.mjs route/;
  for(const [laneId,def] of Object.entries(gateLib.LANES)){
    const job=gateJob(def.job);
    assert.equal(job.name,def.name);
    assert.equal(job['runs-on'],'ubuntu-24.04',`${def.job} runs-on must be pinned`);
    assert.equal(job.if,"${{ github.event_name != 'pull_request' || github.event.pull_request.draft == false }}",`${def.job} must skip draft PRs`);
    assert.ok(!('needs' in job),`${def.job} must not depend on another job (no shared selector)`);
    const ids=new Set(job.steps.map(s=>s.id).filter(Boolean));
    for(const stepId of Object.keys(def.steps)){assert.ok(ids.has(stepId),`${def.job} lacks step id ${stepId}`);assert.match(job.steps.find(s=>s.id===stepId).label,/^TEST: /);}
    for(const step of job.steps){
      if(commandLines(step.run).filter(line=>!/^(?:pkill|pgrep|for) /.test(line)).some(line=>TEST_COMMAND.test(line)))assert.match(step.label,/^TEST: /,`${def.job} step running tests must be named TEST: (${step.label})`);
      if(/^TEST: /.test(step.label)&&step.id!=='route')assert.ok(def.steps[step.id],`${def.job} TEST step "${step.label}" must record its ids in scripts/showdown-gate.mjs LANES`);
      if(laneId==='L5'&&step.id==='regression')assert.equal(step.if,"steps.route.outputs.l5_run == 'true'",'L5 regression must use its independently verified input route');
      else if(/^TEST: /.test(step.label)&&step.if)assert.match(step.if,/^(?:steps\.route\.outputs\.(?:has_[a-z]+|lifecycle_routed) == 'true')(?: \|\| steps\.route\.outputs\.(?:has_[a-z]+|lifecycle_routed) == 'true')*$/,`${def.job} TEST step "${step.label}" may only be conditioned on the route`);
      assert.ok(!('continue-on-error' in step),`${def.job} "${step.label}" must not continue on error`);
    }
    const route=job.steps.find(s=>s.id==='route');
    assert.ok(route&&route.run.includes(`--lane ${laneId}`),`${def.job} computes its own route`);
    const record=job.steps.find(s=>s.label==='Record lane result');
    assert.ok(record&&record.if==='always()'&&record.run.includes(`finalize --lane ${laneId}`),`${def.job} records lane.json`);
    const upload=job.steps.find(s=>s.label==='Upload lane record');
    assert.equal(upload?.with?.name,`showdown-gate-lane-${laneId}`);
    ok();
  }
  const seal=gateJob('seal');
  assert.equal(seal.name,'seal');assert.equal(seal.if,'${{ !cancelled() }}');assert.equal(seal['runs-on'],'ubuntu-24.04');
  assert.deepEqual(seal.needs,laneJobs,'seal needs every lane');
  for(const job of Object.values(gate.jobs))assert.doesNotMatch(String(job.name),/^POS20\b/,'Showdown Gate checks must never look like POS20 evidence');
  // Triggers, concurrency, permissions.
  assert.deepEqual(gate.on,{pull_request:{types:['opened','synchronize','reopened','ready_for_review']},push:{branches:['main']}});
  assert.equal(gate.concurrency['cancel-in-progress'],"${{ github.event_name == 'pull_request' && github.run_attempt == 1 }}",'main push is never cancelled');
  assert.match(gate.concurrency.group,/format\('push-\{0\}-\{1\}', github\.ref_name, github\.sha\)/,'each main push has its own concurrency group');
  assert.deepEqual(gate.permissions,{contents:'read',actions:'read','pull-requests':'read'},'Showdown Gate is read-only');
  // Pull-request code never holds a write token: no job elevates, none preempts or cancels runs (that is the
  // trusted Physio's job), and no checkout leaves the token in .git/config.
  for(const [id,job] of Object.entries(gate.jobs)){
    assert.ok(!('permissions' in job),`${id} must inherit the read-only token`);
    assert.ok(!job.steps.some(step=>/gate-preempt|actions\/runs\/[^\s]*\/cancel/.test(step.run||'')),`${id} must not preempt or cancel runs`);
    for(const step of job.steps.filter(step=>/^actions\/checkout@/.test(step.uses||'')))assert.strictEqual(step.with?.['persist-credentials'],false,`${id} checkout must set persist-credentials: false`);
  }
  assert.doesNotMatch(read(GATE),/:\s*write\b|gate-preempt/,'Showdown Gate holds no write permission and never runs gate-preempt');
  assert.doesNotMatch(read(GATE),/pull_request_target|secrets\./);
  ok();

  // 6. Freeze the former L3 responsibility independently of the new lane definitions. The split must
  // preserve its entire selection, including the gameplay gates that always ran on visual-only PRs.
  const oldL3Fixed=['GF_RULES_BUILD_ZERO_BILLING','GF_SHARED_SETUP_PROVIDER','GF_TRANSFER_FRESH_SESSION','GF_LIFECYCLE_1_3','GF_TERMINAL_CLOSE','GF_PERSISTENT_PAIR','GF_TWO_MANAGER_JOURNEY_3_10','GF_CAREER_INDEX','GF_COMPLETED_READ','GF_CLOSED_ADAPTER','GF_COMPLETED_TRANSFER','GF_SEASON_ACK'];
  const splitRoutes=[['full',gateLib.computeRoute({files:[],forceFull:true})],['visual-only',gateLib.computeRoute({files:['css/homeV10.css'],forceFull:false})]];
  assert.deepEqual(splitRoutes[1][1].proofGroups,['VISUAL'],'the visual-only example must actually select only VISUAL proofs');
  assert.deepEqual(gateLib.LANE_IDS,['L1','L2','L3A','L3B','L4','L5','L6']);
  assert.deepEqual(gateLib.LANES.L3A.groups,['STORAGE']);
  assert.deepEqual(gateLib.LANES.L3B.groups,['VISUAL']);
  assert.deepEqual(gateLib.LANES.L3A.fixed,oldL3Fixed);
  assert.deepEqual(gateLib.LANES.L3B.fixed,[]);
  for(const [label,route] of splitRoutes){
    const oldIds=[...new Set([...oldL3Fixed,...route.proofs.filter(id=>['STORAGE','VISUAL'].includes(gateLib.groupOf(id)))])].sort();
    const a=gateLib.selectedFor('L3A',route),b=gateLib.selectedFor('L3B',route);
    assert.deepEqual([...new Set([...a,...b])].sort(),oldIds,`${label}: L3A + L3B must equal the old L3 set`);
    assert.deepEqual(a.filter(id=>b.includes(id)),[],`${label}: no proof id belongs to both split lanes`);
    for(const lane of ['L3A','L3B']){
      const steps=Object.fromEntries(Object.keys(gateLib.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
      assert.deepEqual(gateLib.ranFor(lane,route,steps).sort(),gateLib.selectedFor(lane,route).sort(),`${label}: ${lane} steps execute exactly its selected ids`);
    }
    ok();
  }

  // 7. Cache both Playwright's download directory and the bundled Chromium runtime the audits use.
  // Versioned exact keys prevent restoring another browser/tool version; keep cold-cache installs.
  for(const lane of ['L2','L3A','L3B','L4','L6']){
    const job=gateJob(gateLib.LANES[lane].job);
    const cache=job.steps.find(step=>step.label==='Restore Playwright and Chromium browser caches');
    assert.ok(cache,`${lane}: browser downloads must be cached`);
    assert.equal(cache.uses,pinnedAction('actions/cache@v5'));
    assert.deepEqual(String(cache.with.path).trim().split('\n'),['~/.cache/ms-playwright','/tmp/cms-chromium-runtime']);
    assert.ok(cache.with.key.includes(`playwright-${pkg.devDependencies.playwright}`));
    assert.ok(cache.with.key.includes(`chromium-${pkg.devDependencies['@sparticuz/chromium']}`));
    assert.ok(job.steps.indexOf(cache)<job.steps.findIndex(step=>step.label==='Install locked dependencies'));
    assert.ok(!cache.with['restore-keys'],'browser caches must not fall back to another version');
    ok();
  }
  for(const lane of ['L1','L3A','L4','L5','L6']){
    const job=gateJob(gateLib.LANES[lane].job);
    const cache=job.steps.find(step=>step.label==='Restore Firebase emulator and npx caches');
    assert.ok(cache,`${lane}: firebase-tools downloads must be cached`);
    assert.equal(cache.uses,pinnedAction('actions/cache@v5'));
    assert.ok(String(cache.with.path).trim().split('\n').includes('~/.npm/_npx'));
    for(const version of ['15.27.0','15.28.1'])assert.ok(cache.with.key.includes(version),`${lane}: Firebase cache key includes pinned ${version}`);
    assert.ok(job.steps.indexOf(cache)<job.steps.findIndex(step=>step.label==='Install locked dependencies'));
    assert.ok(!cache.with['restore-keys'],'Firebase caches must not fall back to another version');
    ok();
  }

  // 8. Sandbox canaries exercise route, finalize and seal CLI inputs, without touching proof sources.
  // Each started proof failure must fail the seal, even if the lane/job success flags are forged.
  fs.mkdirSync(path.join(root,'work'),{recursive:true});
  const sandbox=fs.mkdtempSync(path.join(root,'work','job-1581-canary-'));
  try{
    const git=args=>{const result=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout.trim();};
    // An empty push diff still forces all proofs, and needs no parent history in a depth-1 CI checkout.
    const head=git(['rev-parse','HEAD']);
    const env={...process.env,GATE_EVENT:'push',GATE_HEAD_SHA:head,GATE_BEFORE_SHA:head,GATE_RUN_ATTEMPT:'1',GITHUB_RUN_ID:'1581',GATE_DRAFT:'false'};
    for(const key of ['GITHUB_TOKEN','GH_TOKEN','GITHUB_REPOSITORY','GITHUB_EVENT_PATH','GITHUB_STEP_SUMMARY','GATE_BASE_SHA'])delete env[key];
    const canaryRoute=gateLib.computeRoute({files:gateLib.changedFiles({event:'push',beforeSha:env.GATE_BEFORE_SHA,sha:env.GATE_HEAD_SHA}),forceFull:true});
    const cli=args=>spawnSync(process.execPath,['scripts/showdown-gate.mjs',...args],{cwd:root,env,encoding:'utf8'});
    const routeFile=path.join(sandbox,'route.json'),lanesDir=path.join(sandbox,'lanes'),summaryFile=path.join(sandbox,'summary.json');
    for(const lane of ['L3A','L3B']){
      const output=path.join(sandbox,`${lane}-outputs.txt`);
      const routed=cli(['route','--lane',lane,'--out',routeFile,'--github-output',output]);
      assert.equal(routed.status,0,routed.stderr);assert.match(readFile(output),/has_visual=true/);
      assert.deepEqual(JSON.parse(readFile(routeFile)).route,canaryRoute,`${lane} computes its own full route`);
    }
    const needs=Object.fromEntries(Object.values(gateLib.LANES).map(def=>[def.job,{result:'success'}]));
    const finalize=(lane,failedStep=null,jobStatus='success')=>{
      env.GATE_JOB_STATUS=jobStatus;
      env.GATE_STEPS_JSON=JSON.stringify(Object.fromEntries(Object.keys(gateLib.LANES[lane].steps).map(id=>[id,{outcome:id===failedStep?'failure':'success'}])));
      const result=cli(['finalize','--lane',lane,'--route',routeFile,'--out',path.join(lanesDir,`showdown-gate-lane-${lane}`,'lane.json')]);
      assert.equal(result.status,0,result.stderr);
    };
    const seal=()=>{env.GATE_NEEDS_JSON=JSON.stringify(needs);return cli(['seal','--route',routeFile,'--lanes-dir',lanesDir,'--out',summaryFile]);};
    for(const lane of gateLib.LANE_IDS)finalize(lane);
    const clean=seal();assert.equal(clean.status,0,clean.stderr);assert.equal(JSON.parse(readFile(summaryFile)).verdict,'PASS');
    for(const [lane,step,proof] of [['L3A','gf_transfer','GF_TRANSFER_FRESH_SESSION'],['L3B','proof_visual','HOME_VISUAL']]){
      finalize(lane,step,'failure');needs[gateLib.LANES[lane].job].result='failure';
      const failed=seal();assert.equal(failed.status,1);assert.equal(JSON.parse(readFile(summaryFile)).verdict,'FAIL_TEST');assert.ok(failed.stderr.includes(lane));
      // Retain the missing proof, but claim the job passed: independent proof coverage still vetoes it.
      finalize(lane,step);needs[gateLib.LANES[lane].job].result='success';
      const forged=seal();assert.equal(forged.status,1);
      const summary=JSON.parse(readFile(summaryFile));assert.equal(summary.verdict,'FAIL_TEST');
      assert.ok(summary.failures.some(failure=>failure.includes(`${lane}: selected but not run:`)&&failure.includes(proof)));
      console.log(`PASS JOB-1581 canary ${lane}: ${proof} failure -> seal FAIL_TEST (exit 1); forged green with missing proof -> FAIL_TEST (exit 1).`);
      finalize(lane);
      ok();
    }
    const restored=seal();assert.equal(restored.status,0,restored.stderr);
    for(const lane of ['L3A','L3B']){
      const file=path.join(lanesDir,`showdown-gate-lane-${lane}`,'lane.json'),record=readFile(file);
      fs.unlinkSync(file);
      const absent=seal();assert.equal(absent.status,1);assert.ok(JSON.parse(readFile(summaryFile)).failures.includes(`${lane}: lane.json missing`));
      fs.writeFileSync(file,record);
    }
    ok();
  }finally{fs.rmSync(sandbox,{recursive:true,force:true});}

  console.log(`PASS Showdown Gate coverage: ${listedGates.length} gates, ${oldSteps.length} old steps mapped, ${coverage.mappings.length} mappings verified, every POS10 proof group runs once, route equals the POS20 router (${checks} checks).`);
})().catch(error=>{console.error(error);process.exit(1);});

function readFile(file){return fs.readFileSync(file,'utf8');}
