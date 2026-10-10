'use strict';
// Showdown Gate seal verdicts, lane selection, factory board tick, gate-yield and gate-compare logic, and
// the Showdown Gate cross-checks with the Physio. The Physio itself (watchdog, preempt, physio/v1 status)
// is covered by tests/contracts/showdown-gate-physio-contracts.cjs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync,execFile}=require('node:child_process');
const http=require('node:http');
const {promisify}=require('node:util');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');

const root=path.resolve(__dirname,'../..');
const fixture=name=>JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/showdown-gate',name),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
let checks=0;const ok=label=>{checks++;void label;};

(async()=>{
  const W=await import(path.join(root,'scripts/gate-watchdog.mjs'));
  const S=await import(path.join(root,'scripts/showdown-gate.mjs'));
  const Y=await import(path.join(root,'scripts/gate-yield.mjs'));
  const C=await import(path.join(root,'scripts/gate-compare.mjs'));

  const head='c'.repeat(40);
  const base='b'.repeat(40);const runId=100;
  // 4. Seal verdicts.
  const route=(await import(path.join(root,'scripts/pos20-impact-router.mjs'))).routeFiles([],{forceFull:true});
  const needs=result=>Object.fromEntries(Object.values(S.LANES).map(l=>[l.job,{result}]));
  const fullSteps=lane=>Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
  const lanes=()=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,S.buildLaneRecord({lane,headSha:head,baseSha:base,runId,runAttempt:1,route,steps:fullSteps(lane),jobStatus:'success'})]));
  const sealOf=extra=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha:base,prLiveHead:head,route,needs:needs('success'),lanes:lanes(),runId,runAttempt:1,...extra});
  assert.equal(sealOf({}).verdict,'PASS');
  for(const id of S.routedIds(route))assert.ok(sealOf({}).ran_ids.includes(id),`full route id ran: ${id}`);
  assert.equal(sealOf({draft:true}).verdict,'DRAFT');assert.match(sealOf({draft:true}).failures[0],/draft/);
  assert.equal(sealOf({prLiveHead:'d'.repeat(40)}).verdict,'SUPERSEDED');
  const dropped=lanes();dropped.L2.ran=dropped.L2.ran.slice(1);
  assert.equal(sealOf({lanes:dropped}).verdict,'FAIL_TEST','a routed id that did not run fails the seal');
  const wrongHead=lanes();wrongHead.L5.head_sha='e'.repeat(40);
  assert.equal(sealOf({lanes:wrongHead}).verdict,'FAIL_TEST','a lane from another head fails the seal');
  const missing=lanes();missing.L6=null;
  assert.equal(sealOf({lanes:missing}).verdict,'FAIL_TEST');
  const narrowed=lanes();narrowed.L1.selected=narrowed.L1.selected.filter(id=>!id.startsWith('tests/contracts/'));
  assert.equal(sealOf({lanes:narrowed}).verdict,'FAIL_TEST','a lane may not select less than the route');
  const red={...needs('success'),'l3-storage-visual-gameplay':{result:'failure'}};
  assert.equal(sealOf({needs:red,classification:{classification:'TEST_FAILURE',reasons:['x']}}).verdict,'FAIL_TEST');
  assert.equal(sealOf({needs:red,classification:{classification:'INFRA',reasons:['x']}}).verdict,'INFRA_RETRYING');
  assert.equal(sealOf({needs:red,classification:{classification:'INFRA_EXHAUSTED',reasons:['x']}}).verdict,'INFRA_EXHAUSTED');
  assert.equal(sealOf({needs:red,classification:{classification:'INFRA',reasons:['x']},runAttempt:3}).verdict,'INFRA_EXHAUSTED');
  assert.equal(sealOf({needs:red}).verdict,'FAIL_TEST','without job evidence a failed lane is treated as a test failure');
  const s=sealOf({});for(const key of ['schema','verdict','lanes','failures','retries_used'])assert.ok(key in s);assert.equal(s.schema,'showdown-gate/v1');
  assert.ok(S.VERDICTS.includes(s.verdict));
  ok('seal verdicts');
  assert.equal(sealOf({prLiveHead:null}).verdict,'HEAD_UNKNOWN');
  assert.match(sealOf({prLiveHead:null}).failures.join(' '),/live PR head could not be resolved/);
  assert.ok(S.VERDICTS.includes('HEAD_UNKNOWN'));
  for(const [field,value] of [['lane','WRONG'],['job','WRONG'],['base_sha','d'.repeat(40)],['run_id',101],['run_attempt',99],['run_attempt',0],['run_attempt',1.5],['route_digest','0'.repeat(64)]]){
    const invalid=lanes();invalid.L1[field]=value;
    assert.equal(sealOf({lanes:invalid}).verdict,'FAIL_TEST',`invalid ${field} fails the seal`);
  }
  for(const field of ['schema','head_sha','lane','job','base_sha','run_id','run_attempt','route_profile','route_digest','selected','ran','result']){
    const incomplete=lanes();delete incomplete.L1[field];
    assert.equal(sealOf({lanes:incomplete}).verdict,'FAIL_TEST',`missing lane ${field} fails the seal`);
  }
  for(const [field,value] of [['runId',null],['runAttempt',0],['runAttempt',undefined],['baseSha',null],['event','unknown']])assert.equal(sealOf({[field]:value}).verdict,'FAIL_TEST',`missing seal ${field} fails closed`);
  const missingAttempt=lanes();missingAttempt.L1=S.buildLaneRecord({lane:'L1',headSha:head,baseSha:base,runId,route,steps:fullSteps('L1'),jobStatus:'success'});
  assert.equal(missingAttempt.L1.run_attempt,null);assert.equal(sealOf({lanes:missingAttempt}).verdict,'FAIL_TEST','record generation never invents a missing attempt');
  for(const incomplete of [null,{}, {...route,profile:null},{...route,tests:null},{...route,proofs:null},{...route,operations:undefined}])assert.equal(sealOf({route:incomplete}).verdict,'FAIL_TEST','incomplete seal route fails closed');
  assert.equal(sealOf({runAttempt:2}).verdict,'PASS','a successful lane from attempt 1 carries within the same run, head, base and route');
  const current=lanes();current.L1.run_attempt=2;
  assert.equal(sealOf({runAttempt:2,lanes:current}).verdict,'PASS','a re-run can mix carried and current successful lanes');
  assert.equal(sealOf({runAttempt:2,needs:{...needs('success'),'l1-core':{result:'failure'}}}).verdict,'FAIL_TEST','a red current job cannot carry its earlier artifact');
  assert.equal(sealOf({event:'push',prLiveHead:null}).verdict,'PASS','pushes do not need a live PR head');
  const changedRoute={...route,operations:!route.operations};
  assert.equal(sealOf({route:changedRoute}).verdict,'FAIL_TEST','same profile with different route contents fails');
  assert.match(S.routeDigest(route),/^[a-f0-9]{64}$/);
  assert.equal(S.routeDigest(route),S.routeDigest(Object.fromEntries(Object.entries(route).reverse())),'key order is canonical');
  assert.equal(S.routeDigest({nested:{b:2,a:1},tests:['a','b']}),S.routeDigest({tests:['a','b'],nested:{a:1,b:2}}),'nested keys are canonical');
  assert.notEqual(S.routeDigest({tests:['a','b']}),S.routeDigest({tests:['b','a']}),'array order remains bound');
  const attackRoute={profile:'POS20_FULL_SEAL',tests:[],proofs:[],operations:false};
  const attackLanes=Object.fromEntries(S.LANE_IDS.map(l=>[l,{schema:'showdown-gate-lane/v1',head_sha:head,lane:'WRONG',job:'WRONG',run_attempt:99,route_profile:attackRoute.profile,result:'success',selected:S.selectedFor(l,attackRoute),ran:S.selectedFor(l,attackRoute)}]));
  assert.notEqual(S.evaluateSeal({event:'pull_request',draft:false,headSha:head,prLiveHead:null,route:attackRoute,needs:needs('success'),lanes:attackLanes,runAttempt:1,runId}).verdict,'PASS','ticket F3 reproduction');
  assert.notEqual(sealOf({lanes:attackLanes,route:attackRoute}).verdict,'PASS','lane identity checks still reject F3 with a known PR head');
  const runnerLoss='runner lost during L3 storage visual gameplay / TEST: Proof group STORAGE';
  const infraSeal=sealOf({needs:red,classification:{classification:'INFRA',reasons:[runnerLoss]}});
  assert.ok(infraSeal.failures.includes(runnerLoss),'seal displays the classified cause');
  const physio=W.physioLines({classification:'INFRA',action:'rerun-failed-jobs',retries_used:0,failing_jobs:['L3 storage visual gameplay'],reasons:[runnerLoss]});
  assert.ok(physio[0].includes(runnerLoss));assert.doesNotMatch(physio[0],/GitHub gave it no machine/);
  ok('seal evidence binding and classified causes');

  // Exercise finalize and seal with the workflow's unchanged env contract: GITHUB_EVENT_PATH supplies
  // base.sha in these steps, while route selection receives GATE_BASE_SHA separately.
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gate-evidence-contract-'));
  try{
    const eventFile=path.join(temp,'event.json');const routeFile=path.join(temp,'route.json');const lanesDir=path.join(temp,'lanes');
    fs.writeFileSync(eventFile,JSON.stringify({pull_request:{base:{sha:base},head:{sha:head}},before:base}));
    fs.writeFileSync(routeFile,JSON.stringify({route}));
    const env={...process.env,GATE_EVENT:'pull_request',GATE_HEAD_SHA:head,GATE_RUN_ATTEMPT:'1',GITHUB_RUN_ID:String(runId),GITHUB_EVENT_PATH:eventFile,GATE_JOB_STATUS:'success',GATE_DRAFT:'false',GATE_NEEDS_JSON:JSON.stringify(needs('success'))};
    // No live GitHub credential/PR lookup: this CLI seal must fail closed without making network calls.
    delete env.GITHUB_TOKEN;delete env.GH_TOKEN;delete env.GATE_BASE_SHA;delete env.GATE_BEFORE_SHA;delete env.GATE_PR_NUMBER;
    for(const lane of S.LANE_IDS){
      const out=path.join(lanesDir,`showdown-gate-lane-${lane}`,'lane.json');
      const result=spawnSync(process.execPath,['scripts/showdown-gate.mjs','finalize','--lane',lane,'--route',routeFile,'--out',out],{cwd:root,env:{...env,GATE_STEPS_JSON:JSON.stringify(fullSteps(lane))},encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);
      const record=JSON.parse(fs.readFileSync(out,'utf8'));
      assert.equal(record.run_id,runId);assert.equal(record.base_sha,base);assert.equal(record.route_digest,S.routeDigest(route));
    }
    const out=path.join(temp,'summary.json');
    const sealed=spawnSync(process.execPath,['scripts/showdown-gate.mjs','seal','--route',routeFile,'--lanes-dir',lanesDir,'--out',out],{cwd:root,env,encoding:'utf8'});
    assert.equal(sealed.status,1);assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).verdict,'HEAD_UNKNOWN');
    const pushed=spawnSync(process.execPath,['scripts/showdown-gate.mjs','seal','--route',routeFile,'--lanes-dir',lanesDir,'--out',out],{cwd:root,env:{...env,GATE_EVENT:'push'},encoding:'utf8'});
    assert.equal(pushed.status,0,pushed.stderr);assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).verdict,'PASS');
    assert.equal(S.baseFromEnv({GATE_EVENT:'pull_request',GITHUB_EVENT_PATH:eventFile}),base);
    assert.equal(S.baseFromEnv({GATE_EVENT:'push',GITHUB_EVENT_PATH:eventFile}),base);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
  ok('CLI evidence binding and unavailable PR lookup');
  // The workflow's finalize steps set no GATE_EVENT: a synchronize payload's `before` is the previous PR
  // head and an opened payload has none, so the lanes must still bind pull_request.base.sha like the seal.
  const realTemp=fs.mkdtempSync(path.join(os.tmpdir(),'gate-finalize-env-contract-'));
  try{
    const previousHead='c'.repeat(40);
    for(const payload of [{action:'synchronize',before:previousHead,pull_request:{base:{sha:base},head:{sha:head}}},{action:'opened',pull_request:{base:{sha:base},head:{sha:head}}}]){
      const eventFile=path.join(realTemp,`${payload.action}.json`);fs.writeFileSync(eventFile,JSON.stringify(payload));
      const finalizeBase=S.baseFromEnv({GITHUB_EVENT_NAME:'pull_request',GITHUB_EVENT_PATH:eventFile});
      const sealBase=S.baseFromEnv({GITHUB_EVENT_NAME:'pull_request',GATE_EVENT:'pull_request',GITHUB_EVENT_PATH:eventFile});
      assert.equal(finalizeBase,base,`${payload.action}: finalize binds the PR base, not payload.before`);
      assert.equal(finalizeBase,sealBase,`${payload.action}: lane and seal bases agree`);
      const runLanes=Object.fromEntries(S.LANE_IDS.map(lane=>[lane,S.buildLaneRecord({lane,headSha:head,baseSha:finalizeBase,runId,runAttempt:1,route,steps:fullSteps(lane),jobStatus:'success'})]));
      assert.equal(S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha:sealBase,prLiveHead:head,route,needs:needs('success'),lanes:runLanes,runId,runAttempt:1}).verdict,'PASS',`${payload.action}: a clean PR run seals`);
    }
    const pushFile=path.join(realTemp,'push.json');fs.writeFileSync(pushFile,JSON.stringify({before:previousHead,after:head}));
    assert.equal(S.baseFromEnv({GITHUB_EVENT_NAME:'push',GITHUB_EVENT_PATH:pushFile}),previousHead);
    const finalizeSteps=Object.values(readWorkflow(root,'.github/workflows/showdown-gate.yml').jobs).flatMap(job=>job.steps||[]).filter(step=>/showdown-gate\.mjs finalize/.test(String(step.run||'')));
    assert.equal(finalizeSteps.length,S.LANE_IDS.length,'every lane records its result');
    for(const step of finalizeSteps){
      const env=step.env||{};
      assert.ok(!('GITHUB_EVENT_NAME' in env),'finalize keeps the runner-provided GITHUB_EVENT_NAME');
      assert.ok(!('GATE_EVENT' in env)||/github\.event_name/.test(String(env.GATE_EVENT)),'a finalize GATE_EVENT can only be the run event');
      assert.ok(!('GATE_BEFORE_SHA' in env)||'GATE_EVENT' in env,'finalize cannot bind payload.before without knowing the event');
    }
  }finally{fs.rmSync(realTemp,{recursive:true,force:true});}
  ok('finalize binds the PR base under the workflow env');
  // Lane selection never narrows the route.
  for(const files of [['README.md'],['css/app.css'],['js/stage4ConnectedRivalry.js'],[]]){
    const r=(await import(path.join(root,'scripts/pos20-impact-router.mjs'))).routeFiles(files);
    const union=new Set(S.LANE_IDS.flatMap(lane=>S.selectedFor(lane,r)));
    for(const id of S.routedIds(r))assert.ok(union.has(id),`${files}: ${id} has a lane`);
  }
  ok('lane selection covers the route');

  // Showdown Gate cross-checks with the Physio (whose own contract is showdown-gate-physio-contracts.cjs).
  const PS=await import(path.join(root,'scripts/physio-status.mjs'));
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  assert.equal(gate.name,W.GATE_WORKFLOW_NAME);assert.ok(gate.jobs.seal&&gate.jobs.seal.name===W.SEAL_JOB_NAME);
  PS.GATE_LANES.forEach((name,i)=>assert.ok(name.startsWith(`L${i+1} `),name));
  assert.deepEqual(Object.values(gate.jobs).filter(j=>j.name!=='seal').map(j=>j.name),PS.GATE_LANES,'lane names are the gate job names');
  const coverageGates=JSON.parse(fs.readFileSync(path.join(root,'GATE_COVERAGE.json'),'utf8')).gates.map(g=>g.name);
  assert.deepEqual(PS.POS20_GATE_NAMES,coverageGates,'the Physio counts exactly the 16 gates of GATE_COVERAGE.json');
  assert.equal(W.MAX_ATTEMPTS,3);
  ok('gate cross-checks with the Physio');

  // 5b. Factory board tick: yields to queued checks and never holds a machine for long.
  const tick=readWorkflow(root,'.github/workflows/factory-board-tick.yml');
  assert.equal(tick.name,'Factory board tick');
  assert.deepEqual(tick.on,{schedule:[{cron:'*/5 * * * *'}],workflow_dispatch:null});
  assert.deepEqual(tick.permissions,{contents:'write',actions:'read','pull-requests':'read',checks:'read',issues:'read'});
  assert.deepEqual(tick.concurrency,{group:'factory-board-tick','cancel-in-progress':true});
  const tickJob=Object.values(tick.jobs)[0];
  assert.equal(tickJob['runs-on'],'ubuntu-24.04');assert.equal(tickJob['timeout-minutes'],3);
  assert.equal(tickJob.steps[0].id,'yield');assert.ok(tickJob.steps[0].run.includes('test("^(Validate POS20|Validate Gameplay Fast|Showdown Gate)$")'),'tick yields to exactly the three checks');
  for(const step of tickJob.steps.slice(1))assert.equal(step.if,"steps.yield.outputs.skip != '1'",`tick step "${step.label}" must yield`);
  assert.doesNotMatch(JSON.stringify(tick),/sleep |gh workflow run/,'one round per tick: no sleep, no self-dispatch');
  ok('factory board tick');

  // 6. gate-yield: yield when any Showdown Gate / Validate POS20 run or job is queued.
  assert.deepEqual(Y.PRIORITY_WORKFLOWS.map(w=>w.name),['Showdown Gate','Validate POS20']);
  assert.equal(Y.decideYield([]).decision,'proceed');
  assert.equal(Y.decideYield([{workflow:'Showdown Gate',run:{id:1,status:'queued'},jobs:[]}]).decision,'yield');
  assert.equal(Y.decideYield([{workflow:'Validate POS20',run:{id:2,status:'in_progress'},jobs:[{name:'x',status:'in_progress'},{name:'y',status:'queued'}]}]).decision,'yield');
  assert.equal(Y.decideYield([{workflow:'Showdown Gate',run:{id:3,status:'in_progress'},jobs:[{name:'x',status:'in_progress'},{name:'y',status:'completed'}]}]).decision,'proceed');
  ok('gate-yield');

  // 7. gate-compare.
  const same={verdict:'PASS',profile:'COGNITIVE_FULL_SEAL',ran:['a','b']};
  let cmp=C.compareHead({head,pos20:same,gameplayFast:{verdict:'ABSENT',ran:[]},gate:{verdict:'PASS',profile:'COGNITIVE_FULL_SEAL',ran:['a','b','c']}});
  assert.equal(cmp.same_route_profile,true);assert.equal(cmp.gate_ran_superset,true);assert.equal(cmp.verdicts_agree,true);assert.equal(cmp.gate_pass_old_fail,false);
  cmp=C.compareHead({head,pos20:{...same,verdict:'FAIL'},gameplayFast:{verdict:'ABSENT',ran:[]},gate:{verdict:'PASS',profile:'COGNITIVE_FULL_SEAL',ran:['a']}});
  assert.equal(cmp.gate_pass_old_fail,true);assert.equal(cmp.gate_ran_superset,false);assert.deepEqual(cmp.missing_in_gate,['b']);
  const log='2026-10-05T20:00:00.0000000Z {\n2026-10-05T20:00:00.0000000Z   "profile": "POS20_DOC_ONLY",\n2026-10-05T20:00:00.0000000Z   "tests": [\n2026-10-05T20:00:00.0000000Z     "tests/contracts/x.cjs"\n2026-10-05T20:00:00.0000000Z   ],\n2026-10-05T20:00:00.0000000Z   "proofs": []\n';
  assert.deepEqual(C.parsePos20SelectorLog(log),{profile:'POS20_DOC_ONLY',tests:['tests/contracts/x.cjs'],proofs:[],operations:false});
  assert.equal(C.compareHead({head,pos20:{...same,verdict:'INFRA'},gameplayFast:{verdict:'ABSENT',ran:[]},gate:{verdict:'PASS',profile:'COGNITIVE_FULL_SEAL',ran:['a','b']}}).comparable,false,'old-side infra failures are excluded from agreement');
  const heads=n=>Array.from({length:n},(_,i)=>C.compareHead({head:(i+1).toString(16).padStart(40,'0'),pos20:{...same,profile:i<2?'COGNITIVE_FULL_SEAL':'POS20_DOC_ONLY'},gate:{verdict:'PASS',profile:i<2?'COGNITIVE_FULL_SEAL':'POS20_DOC_ONLY',ran:same.ran}}));
  const canaries=[{head:'a'.repeat(40),gate:{verdict:'FAIL_TEST',run_attempt:1}},{head:'b'.repeat(40),gate:{verdict:'FAIL_TEST',run_attempt:1}}];
  const infraOnce=[{run_attempt:2,watchdog_reruns:1,conclusion:'success'}];
  assert.equal(C.evaluateExitCriteria({comparisons:heads(10),canaries,infraRuns:infraOnce}).ready,true);
  assert.equal(C.evaluateExitCriteria({comparisons:heads(9),canaries,infraRuns:infraOnce}).ready,false,'needs 10 real heads');
  const oneFull=heads(10).map((c,i)=>({...c,full_seal:i===0}));
  assert.equal(C.evaluateExitCriteria({comparisons:oneFull,canaries,infraRuns:infraOnce}).ready,false,'needs 2 full seals');
  const disagree=heads(10);disagree[3].gate_pass_old_fail=true;
  assert.equal(C.evaluateExitCriteria({comparisons:disagree,canaries,infraRuns:infraOnce}).ready,false,'any gate-pass/old-fail blocks the exit');
  assert.equal(C.evaluateExitCriteria({comparisons:heads(10),canaries:[canaries[0],{gate:{verdict:'FAIL_TEST',run_attempt:2}}],infraRuns:infraOnce}).ready,false,'a re-run canary does not count');
  assert.equal(C.evaluateExitCriteria({comparisons:heads(10),canaries,infraRuns:[{run_attempt:3,watchdog_reruns:2}]}).ready,false,'infra must be re-run exactly once');
  const exitOf=extra=>C.evaluateExitCriteria({comparisons:heads(10),canaries,infraRuns:infraOnce,...extra});
  assert.equal(exitOf({comparisons:Array(10).fill(heads(10)[0])}).ready,false,'duplicate heads count once');
  assert.equal(exitOf({canaries:[canaries[0],canaries[0]]}).ready,false,'duplicate canaries count once');
  assert.equal(exitOf({comparisons:[...heads(10),heads(10)[0]]}).criteria.heads.have,10,'duplicates do not inflate the head census');
  const mismatched=heads(10);mismatched[5]=C.compareHead({head:mismatched[5].head,pos20:same,gate:{...same,profile:'OTHER_FULL_SEAL'}});
  assert.equal(exitOf({comparisons:mismatched}).ready,false,'mismatched profiles block exit');
  assert.equal(exitOf({comparisons:mismatched}).criteria.same_route.ok,false);
  const failedFull=heads(10);failedFull[0]=C.compareHead({head:failedFull[0].head,pos20:{...same,verdict:'FAIL'},gate:{...same,verdict:'FAIL_TEST'}});
  assert.equal(exitOf({comparisons:failedFull}).ready,false,'a failed full seal cannot earn full-seal credit');
  assert.equal(exitOf({comparisons:failedFull}).criteria.full_seals.have,1);
  for(const remove of [c=>delete c.head,c=>delete c.pos20,c=>delete c.gate,c=>delete c.pos20.verdict,c=>delete c.gate.verdict,c=>delete c.pos20.profile,c=>delete c.gate.profile,c=>delete c.old_verdict,c=>delete c.same_route_profile]){
    const incomplete=heads(10);remove(incomplete[7]);
    assert.equal(exitOf({comparisons:incomplete}).ready,false,'incomplete comparison cannot count');
    assert.equal(exitOf({comparisons:[...heads(10),incomplete[7]]}).ready,false,'unknown extra evidence blocks readiness even with ten complete heads');
  }
  for(const verdict of ['HEAD_UNKNOWN','PENDING','UNRECOGNIZED']){
    const unknown=heads(10);unknown[7]=C.compareHead({head:unknown[7].head,pos20:same,gate:{...same,verdict}});
    assert.equal(unknown[7].comparable,false);assert.equal(exitOf({comparisons:unknown}).ready,false,'unknown or pending verdict fails closed');
  }
  assert.equal(exitOf({infraRuns:[{...infraOnce[0],conclusion:'failure'}]}).ready,false,'failed infra run is not recovered');
  assert.equal(exitOf({infraRuns:[{run_attempt:2,conclusion:'success'}]}).ready,false,'manual retry has no Physio attribution');
  assert.equal(exitOf({infraRuns:[{...infraOnce[0],watchdog_reruns:null}]}).ready,false,'unavailable attribution fails closed');
  const ticketComparison=C.compareHead({head:'a'.repeat(40),pos20:{verdict:'PASS',profile:'POS20_FULL_SEAL',ran:['x']},gate:{verdict:'PASS',profile:'OTHER_FULL_SEAL',ran:['x']}});
  assert.equal(C.evaluateExitCriteria({comparisons:Array(10).fill(ticketComparison),canaries:[canaries[0],canaries[0]],infraRuns:[{run_attempt:2,watchdog_reruns:1,conclusion:'failure'}]}).ready,false,'ticket F2 reproduction');
  const positive=exitOf({});assert.equal(positive.ready,true);assert.equal(positive.criteria.heads.have,10);assert.equal(positive.criteria.full_seals.have,2);assert.equal(positive.criteria.canaries.have,2);assert.equal(positive.criteria.infra_rerun_once.have,1);assert.equal(positive.criteria.same_route.ok,true);
  ok('exit evidence rejects duplicates, incomplete records and failed recovery');

  const recovered={id:501,name:'Showdown Gate',path:C.GATE_PATH,head_sha:head,run_attempt:2,conclusion:'success',created_at:'2026-10-09T10:00:00Z'};
  const physioRun={id:601,name:W.PHYSIO_NAME,path:'.github/workflows/gate-watchdog.yml',event:'workflow_run',head_branch:'main',created_at:'2026-10-09T10:10:00Z'};
  const resultRecord={schema:'showdown-gate-watchdog/v1',run_id:501,workflow:'Showdown Gate',head_sha:head,run_attempt:1,retries_used:0,classification:'INFRA',action:'rerun-failed-jobs',rerun_status:201};
  const attributionClient=(runs=[physioRun])=>({get:async endpoint=>{
    if(endpoint.includes('/workflows/gate-watchdog.yml/runs?'))return {workflow_runs:runs};
    if(endpoint.includes('/actions/runs/601/jobs?'))return {jobs:[{id:701}]};
    throw new Error(`unexpected attribution endpoint: ${endpoint}`);
  }});
  const logOf=record=>async(repo,id)=>{assert.equal(repo,'o/r');assert.equal(id,701);return `noise\n2026-10-09T10:10:00Z ${JSON.stringify(record)}\nmalformed {\n`;};
  const attributed=await C.readPhysioReruns(attributionClient(),'o/r',recovered,{log:logOf(resultRecord)});
  assert.deepEqual(attributed,[{physio_run_id:601,job_id:701,run_id:501,head_sha:head,run_attempt:1}]);
  assert.equal(exitOf({infraRuns:[{...recovered,watchdog_reruns:attributed.length}]}).ready,true);
  assert.deepEqual(C.parsePhysioResults(`not JSON\n${JSON.stringify(resultRecord)}\n${JSON.stringify({schema:'physio/v1',checks:[{action:'rerun'}]})}`),[resultRecord],'only watchdog results carry run-level attribution');
  for(const patch of [{run_id:502},{head_sha:'d'.repeat(40)},{workflow:'Validate POS20'},{classification:'TEST_FAILURE'},{action:'rerun-failed-jobs (dry-run)'},{rerun_status:409},{run_attempt:2},{retries_used:1},{schema:'physio/v1'}]){
    assert.deepEqual(await C.readPhysioReruns(attributionClient(),'o/r',recovered,{log:logOf({...resultRecord,...patch})}),[],`refuses unrelated or unaccepted Physio evidence: ${JSON.stringify(patch)}`);
  }
  for(const patch of [{name:'untrusted'},{head_branch:'feature'},{event:'pull_request'},{path:'.github/workflows/untrusted.yml'}])assert.deepEqual(await C.readPhysioReruns(attributionClient([{...physioRun,...patch}]),'o/r',recovered,{log:async()=>{throw new Error('must not read an untrusted workflow');}}),[]);
  assert.equal(await C.readPhysioReruns(attributionClient(),'o/r',recovered,{log:async()=>{throw new Error('logs unavailable');}}),null);
  assert.equal(await C.readPhysioReruns({get:async()=>{throw new Error('lookup unavailable');}},'o/r',recovered),null);
  assert.deepEqual(await C.readPhysioReruns(attributionClient([]),'o/r',recovered),[],'a manual retry does not synthesize attribution from run_attempt');
  assert.deepEqual(await C.readPhysioReruns(attributionClient(),'o/r',recovered,{log:async()=>`${JSON.stringify(resultRecord)}\n${JSON.stringify(resultRecord)}`}),attributed,'one logged result is not counted twice');
  let page=0;
  const pagedClient={get:async endpoint=>{
    if(endpoint.includes('/workflows/')){page++;assert.ok(endpoint.endsWith(`page=${page}`));return {workflow_runs:page===1?Array.from({length:100},(_,i)=>({...physioRun,id:800+i,name:'unrelated'})):[physioRun]};}
    return {jobs:[{id:701}]};
  }};
  assert.deepEqual(await C.readPhysioReruns(pagedClient,'o/r',recovered,{log:logOf(resultRecord)}),attributed);assert.equal(page,2,'attribution beyond the first page is read');
  ok('Physio attribution is bound to accepted recorded results');
  // JOB-1059: the lookup is bounded to the window in which the target could have been re-run, and skipped
  // Physio jobs are never read, so a long Physio history cannot exhaust the token and null real evidence.
  const lateRun={...physioRun,id:602,created_at:'2026-10-10T10:11:00Z'};
  const neverRead=async()=>{throw new Error('a Physio run outside the window must not be read');};
  assert.deepEqual(await C.readPhysioReruns(attributionClient([lateRun]),'o/r',recovered,{log:neverRead}),[],'no updated_at: runs after 24 h + slack are outside the window');
  const finished={...recovered,updated_at:'2026-10-09T10:30:00Z'};
  assert.deepEqual(await C.readPhysioReruns(attributionClient([{...physioRun,created_at:'2026-10-09T10:41:00Z'}]),'o/r',finished,{log:neverRead}),[],'runs after the last update + slack are outside the window');
  assert.deepEqual(await C.readPhysioReruns(attributionClient(),'o/r',finished,{log:logOf(resultRecord)}),attributed,'the run that re-ran the target is inside the window');
  const skippedClient={get:async endpoint=>endpoint.includes('/workflows/')?{workflow_runs:[physioRun]}:{jobs:[{id:701,conclusion:'skipped'}]}};
  assert.deepEqual(await C.readPhysioReruns(skippedClient,'o/r',recovered,{log:async()=>{throw new Error('a skipped job has no result to read');}}),[],'skipped Physio jobs are not read');
  assert.equal(await C.readPhysioReruns(attributionClient(),'o/r',finished,{log:async()=>{throw new Error('logs unavailable');}}),null,'unavailable logs inside the window still fail closed');
  ok('Physio attribution reads only the re-run window');

  // JOB-1059: a head whose Gate and POS20 runs were both cancelled by a newer push is superseded, not incomplete.
  const cancelled={conclusion:'cancelled'};const newer='e'.repeat(40);
  assert.equal(C.isSupersededHead({head,gateRun:cancelled,pos20Run:cancelled,prHeadSha:newer}),true);
  assert.equal(C.isSupersededHead({head,gateRun:cancelled,pos20Run:cancelled,prHeadSha:head}),false,'the live head itself is never superseded');
  assert.equal(C.isSupersededHead({head,gateRun:cancelled,pos20Run:cancelled,prHeadSha:null}),false,'unknown live head fails closed');
  assert.equal(C.isSupersededHead({head,gateRun:{conclusion:'failure'},pos20Run:cancelled,prHeadSha:newer}),false,'a Gate that ran is never superseded');
  assert.equal(C.isSupersededHead({head,gateRun:cancelled,pos20Run:{conclusion:"success"},prHeadSha:newer}),false,'a POS20 verdict is never superseded');
  assert.equal(C.isSupersededHead({head,gateRun:cancelled,pos20Run:null,prHeadSha:newer}),false,'a missing POS20 run is not superseded');
  ok('superseded heads need both runs cancelled and a newer live PR head');
  // The live lookup finds the PR by head branch, because a superseded run's pull_requests list is empty.
  const cancelledRun=(path,id)=>({id,path,head_sha:head,head_branch:'gameplay/job-x',head_repository:{full_name:'o/r'},conclusion:'cancelled',created_at:'2026-10-09T10:00:00Z',pull_requests:[]});
  const liveClient=(pulls,repoName='o/r')=>({get:async endpoint=>{
    if(endpoint.startsWith('repos/o/r/actions/runs?head_sha='))return {workflow_runs:[cancelledRun(C.GATE_PATH,1),cancelledRun(C.POS20_PATH,2)].map(r=>({...r,head_repository:{full_name:repoName}}))};
    if(endpoint.startsWith('repos/o/r/pulls?state=all&head=o%3Agameplay%2Fjob-x'))return pulls;
    throw new Error(`not superseded, so the comparison reads: ${endpoint}`);
  }});
  const sup=await C.compareLive(liveClient([{number:7,created_at:'2026-10-09T09:00:00Z',head:{sha:newer}}]),'o/r',head,{mappings:[],oldJobNames:{}});
  assert.deepEqual(sup,{schema:'showdown-gate-compare/v1',head,superseded:true,pr:7,pr_head:newer});
  await assert.rejects(C.compareLive(liveClient([{number:7,created_at:'2026-10-09T09:00:00Z',head:{sha:head}}]),'o/r',head,{mappings:[],oldJobNames:{}}),/not superseded/,'a cancelled live head is still compared');
  await assert.rejects(C.compareLive(liveClient([]),'o/r',head,{mappings:[],oldJobNames:{}}),/not superseded/,'no PR found is still compared');
  await assert.rejects(C.compareLive(liveClient([{number:7,head:{sha:newer}}],'fork/r'),'o/r',head,{mappings:[],oldJobNames:{}}),/not superseded/,'a fork branch is never looked up');
  ok('the live comparison marks superseded heads from the PR found by branch');

  // The real --summary CLI reads Physio results, not run_attempt - 1, including when log access fails.
  let servedRecord=resultRecord;let logsAvailable=true;let prStatus=500;let prHead=null;
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;res.setHeader('Content-Type','application/json');
    if(pathname.endsWith('/pulls/99')){res.statusCode=prStatus;return res.end(JSON.stringify({head:{sha:prHead}}));}
    if(pathname.endsWith('/workflows/showdown-gate.yml/runs'))return res.end(JSON.stringify({workflow_runs:[]}));
    if(pathname.endsWith('/actions/runs/501'))return res.end(JSON.stringify(recovered));
    if(pathname.endsWith('/workflows/gate-watchdog.yml/runs'))return res.end(JSON.stringify({workflow_runs:[physioRun]}));
    if(pathname.endsWith('/actions/runs/601/jobs'))return res.end(JSON.stringify({jobs:[{id:701}]}));
    if(pathname.endsWith('/actions/jobs/701/logs')){if(!logsAvailable){res.statusCode=403;return res.end('{}');}return res.end(JSON.stringify(servedRecord));}
    res.statusCode=404;res.end('{}');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const summaryCli=async()=>{
      const {stdout}=await promisify(execFile)(process.execPath,['scripts/gate-compare.mjs','--summary','--repo','o/r','--infra-runs','501'],{cwd:root,env:{...process.env,GITHUB_TOKEN:'local-contract-only',GITHUB_API_URL:`http://127.0.0.1:${server.address().port}`}});
      return JSON.parse(stdout.trim().split('\n').at(-1));
    };
    let report=await summaryCli();assert.equal(report.infra_runs[0].watchdog_reruns,1);assert.deepEqual(report.infra_runs[0].physio_reruns,attributed);assert.equal(report.criteria.infra_rerun_once.ok,true);
    servedRecord={...resultRecord,run_id:502};report=await summaryCli();assert.equal(report.infra_runs[0].watchdog_reruns,0);assert.equal(report.criteria.infra_rerun_once.ok,false,'manual retry remains unattributed in --summary');
    logsAvailable=false;report=await summaryCli();assert.equal(report.infra_runs[0].watchdog_reruns,null);assert.equal(report.criteria.infra_rerun_once.ok,false,'unavailable log does not grant recovery credit');
    const sealTemp=fs.mkdtempSync(path.join(os.tmpdir(),'gate-head-lookup-contract-'));
    try{
      const routeFile=path.join(sealTemp,'route.json');const lanesDir=path.join(sealTemp,'lanes');const out=path.join(sealTemp,'summary.json');
      fs.writeFileSync(routeFile,JSON.stringify({route}));
      for(const [lane,record] of Object.entries(lanes())){
        const dir=path.join(lanesDir,`showdown-gate-lane-${lane}`);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'lane.json'),JSON.stringify(record));
      }
      const sealCli=async()=>{
        const env={...process.env,GITHUB_TOKEN:'local-contract-only',GITHUB_REPOSITORY:'o/r',GITHUB_API_URL:`http://127.0.0.1:${server.address().port}`,GATE_EVENT:'pull_request',GATE_HEAD_SHA:head,GATE_BASE_SHA:base,GATE_DRAFT:'false',GATE_PR_NUMBER:'99',GATE_RUN_ATTEMPT:'1',GITHUB_RUN_ID:String(runId),GATE_NEEDS_JSON:JSON.stringify(needs('success'))};
        delete env.GITHUB_EVENT_PATH;
        try{await promisify(execFile)(process.execPath,['scripts/showdown-gate.mjs','seal','--route',routeFile,'--lanes-dir',lanesDir,'--out',out],{cwd:root,env});}
        catch(error){assert.equal(error.code,1,'unavailable PR head makes the CLI fail');}
        return JSON.parse(fs.readFileSync(out,'utf8'));
      };
      assert.equal((await sealCli()).verdict,'HEAD_UNKNOWN','lookup error cannot PASS');
      prStatus=200;assert.equal((await sealCli()).verdict,'HEAD_UNKNOWN','null live head cannot PASS');
      prHead=head;assert.equal((await sealCli()).verdict,'PASS','exact live head with complete lane evidence passes');
    }finally{fs.rmSync(sealTemp,{recursive:true,force:true});}
  }finally{await new Promise(resolve=>server.close(resolve));}
  ok('summary CLI requires actual Physio attribution');
  ok('gate-compare');

  console.log(`PASS Showdown Gate watchdog contracts (${checks} groups): the seal fails closed on draft, superseded, foreign-head, missing or narrowed lanes; lane selection covers the route; the board tick yields to the three checks; gate-yield and gate-compare exit criteria; the Physio counts the 16 gates and the six lanes of Showdown Gate.`);
})().catch(error=>{console.error(error);process.exit(1);});
