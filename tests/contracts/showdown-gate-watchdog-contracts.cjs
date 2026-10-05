'use strict';
// Showdown Gate watchdog, seal verdict, gate-yield and gate-compare logic, against recorded and synthetic
// GitHub API fixtures. A started TEST: step that did not succeed is never re-run; infra-only failures are
// re-run at most twice per head; the watchdog never acts on any workflow other than Showdown Gate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
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

  // 1. Recorded run 37364865245: selector cancelled with no steps, "not acquired by Runner" -> INFRA.
  const recorded=fixture('run-37364865245-selector-not-acquired.json');
  assert.equal(recorded.run.id,37364865245);
  const selector=recorded.jobs.find(job=>job.name==='POS20 exact selector');
  assert.equal(selector.conclusion,'cancelled');assert.deepEqual(selector.steps,[]);
  assert.match(recorded.annotations[selector.id][0].message,/The job was not acquired by Runner of type hosted even after multiple attempts/);
  const asPos20={...recorded,prHeadSha:recorded.run.head_sha,sealJobName:'POS20 exact-head cognitive seal'};
  const infra=W.classifyRun(asPos20);
  assert.equal(infra.classification,'INFRA');assert.equal(infra.action,'rerun-failed-jobs');assert.deepEqual(infra.failing_jobs,['POS20 exact selector']);
  ok('recorded not-acquired selector is infra');
  const third=clone(asPos20);third.run.run_attempt=3;
  assert.equal(W.classifyRun(third).classification,'INFRA_EXHAUSTED');assert.equal(W.classifyRun(third).action,'none');
  const viaHead=clone(asPos20);viaHead.run.run_attempt=1;viaHead.retriesUsedForHead=2;
  assert.equal(W.classifyRun(viaHead).classification,'INFRA_EXHAUSTED','retries across runs of one head count toward the cap');
  const noNotes=clone(asPos20);noNotes.annotations={};
  assert.equal(W.classifyRun(noNotes).classification,'INFRA','a job cancelled before any step on a failed run is infra even without annotations');
  ok('re-run budget is two per head');
  // The shadow watchdog refuses this run: it is Validate POS20, not Showdown Gate.
  assert.equal(W.isGateRun(recorded.run),false);
  const posts=[];
  const fakeClient=(gathered)=>({
    get:async endpoint=>{
      if(endpoint.endsWith(`/actions/runs/${gathered.run.id}`))return gathered.run;
      if(endpoint.includes(`/actions/runs/${gathered.run.id}/jobs`))return {jobs:gathered.jobs};
      if(endpoint.includes('/check-runs/'))return gathered.annotations[endpoint.split('/check-runs/')[1].split('/')[0]]||[];
      if(endpoint.includes('/workflows/showdown-gate.yml/runs?head_sha='))return {workflow_runs:[gathered.run]};
      throw new Error(`unexpected GET ${endpoint}`);
    },
    getRaw:async endpoint=>{if(endpoint.includes('/git/ref/heads/'))return {status:200,body:{object:{sha:gathered.run.head_sha}}};throw new Error(`unexpected raw GET ${endpoint}`);},
    post:async endpoint=>{posts.push(endpoint);return {status:201,body:null};}
  });
  const ignored=await W.handleRun(fakeClient(recorded),'o/r',recorded.run.id);
  assert.equal(ignored.classification,'IGNORED');assert.deepEqual(posts,[],'never re-runs Validate POS20');
  ok('shadow watchdog ignores other workflows');
  // The same failure shape on a Showdown Gate run is re-run exactly once per decision.
  const asGate=clone(recorded);asGate.run.name='Showdown Gate';asGate.run.path='.github/workflows/showdown-gate.yml';asGate.run.run_attempt=1;asGate.run.head_repository={full_name:'o/r'};
  for(const job of asGate.jobs)if(job.name==='POS20 exact-head cognitive seal')job.name='seal';
  const rerun=await W.handleRun(fakeClient(asGate),'o/r',asGate.run.id);
  assert.equal(rerun.classification,'INFRA');assert.deepEqual(posts,[`repos/o/r/actions/runs/${asGate.run.id}/rerun-failed-jobs`]);
  ok('gate infra failure posts one rerun-failed-jobs');

  // 2. A TEST: step failed in one lane while another lane was never acquired -> TEST_FAILURE, never re-run.
  const mixed=fixture('gate-run-test-failure-plus-infra.json');
  const mixedResult=W.classifyRun({...mixed,prHeadSha:mixed.run.head_sha});
  assert.equal(mixedResult.classification,'TEST_FAILURE');assert.equal(mixedResult.action,'none');
  assert.deepEqual(mixedResult.failing_jobs,['L3 storage visual gameplay']);
  posts.length=0;
  const mixedHandled=await W.handleRun(fakeClient(mixed),'o/r',mixed.run.id);
  assert.equal(mixedHandled.classification,'TEST_FAILURE');assert.deepEqual(posts,[],'a real test failure is never re-run');
  ok('test failure wins over infra');

  // 3. Other classes.
  const base=()=>clone(mixed);
  const fixAllGreen=f=>{for(const job of f.jobs){job.conclusion='success';for(const s of job.steps)if(s.conclusion==='failure')s.conclusion='success';}return f;};
  const pass=fixAllGreen(base());pass.run.conclusion='success';
  assert.equal(W.classifyRun({...pass,prHeadSha:pass.run.head_sha}).classification,'PASS');
  const pending=base();pending.run.status='in_progress';assert.equal(W.classifyRun({...pending,prHeadSha:pending.run.head_sha}).classification,'PENDING');
  assert.equal(W.classifyRun({...base(),prHeadSha:'b'.repeat(40)}).classification,'SUPERSEDED');
  assert.equal(W.classifyRun({...base(),headGone:true}).classification,'SUPERSEDED');
  assert.equal(W.classifyRun({...base()}).classification,'UNKNOWN','no live PR head: refuse to act');
  const draft=base();for(const job of draft.jobs)if(job.name!=='seal'){job.conclusion='skipped';job.steps=[];}
  assert.equal(W.classifyRun({...draft,prHeadSha:draft.run.head_sha}).classification,'DRAFT');
  const cancelled=base();cancelled.run.conclusion='cancelled';cancelled.annotations={};
  for(const job of cancelled.jobs){job.conclusion=job.conclusion==='failure'?'cancelled':job.conclusion;for(const s of job.steps)if(s.conclusion==='failure')s.conclusion='success';}
  assert.equal(W.classifyRun({...cancelled,prHeadSha:cancelled.run.head_sha}).classification,'CANCELLED','manual cancel is not re-run');
  // Seal verification failed while every lane is green: deterministic, never re-run.
  const sealOnly=fixAllGreen(base());sealOnly.jobs.find(j=>j.name==='seal').conclusion='failure';sealOnly.jobs.find(j=>j.name==='seal').steps[2].conclusion='failure';sealOnly.annotations={};
  assert.equal(W.classifyRun({...sealOnly,prHeadSha:sealOnly.run.head_sha}).classification,'TEST_FAILURE');
  // Seal never acquired with every lane green: infra.
  const sealLost=fixAllGreen(base());Object.assign(sealLost.jobs.find(j=>j.name==='seal'),{conclusion:'cancelled',steps:[]});sealLost.run.conclusion='failure';
  assert.equal(W.classifyRun({...sealLost,prHeadSha:sealLost.run.head_sha}).classification,'INFRA');
  // A TEST step cut off by lost communication is infra; cut off by a timeout is a real failure.
  const lost=fixAllGreen(base());const l3=lost.jobs.find(j=>j.name==='L3 storage visual gameplay');l3.conclusion='failure';l3.steps.find(s=>s.name==='TEST: Terminal Close matrix').conclusion='cancelled';
  lost.annotations={[l3.id]:[{message:'The self-hosted runner: GitHub Actions 3 lost communication with the server.'}]};lost.run.conclusion='failure';
  assert.equal(W.classifyRun({...lost,prHeadSha:lost.run.head_sha}).classification,'INFRA');
  lost.annotations={};
  assert.equal(W.classifyRun({...lost,prHeadSha:lost.run.head_sha}).classification,'TEST_FAILURE','a TEST step that started and never finished without runner-loss evidence is a real failure');
  // Setup died before any TEST step (npm ci network error): infra.
  const setup=fixAllGreen(base());const l2=setup.jobs.find(j=>j.name==='L2 browser full');l2.conclusion='failure';l2.steps=[{name:'Set up job',status:'completed',conclusion:'success',started_at:'x'},{name:'Install locked dependencies',status:'completed',conclusion:'failure',started_at:'x'},{name:'TEST: Proof group FULL',status:'completed',conclusion:'skipped',started_at:null}];setup.annotations={};setup.run.conclusion='failure';
  assert.equal(W.classifyRun({...setup,prHeadSha:setup.run.head_sha}).classification,'INFRA');
  // Push to main has no PR head and is never superseded.
  const push=clone(setup);push.run.event='push';
  assert.equal(W.classifyRun(push).classification,'INFRA');
  ok('classification table');

  // 4. Seal verdicts.
  const route=(await import(path.join(root,'scripts/pos20-impact-router.mjs'))).routeFiles([],{forceFull:true});
  const head='c'.repeat(40);
  const needs=result=>Object.fromEntries(Object.values(S.LANES).map(l=>[l.job,{result}]));
  const fullSteps=lane=>Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
  const lanes=()=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,S.buildLaneRecord({lane,headSha:head,runAttempt:1,route,steps:fullSteps(lane),jobStatus:'success'})]));
  const sealOf=extra=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,prLiveHead:head,route,needs:needs('success'),lanes:lanes(),runAttempt:1,...extra});
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
  // Lane selection never narrows the route.
  for(const files of [['README.md'],['css/app.css'],['js/stage4ConnectedRivalry.js'],[]]){
    const r=(await import(path.join(root,'scripts/pos20-impact-router.mjs'))).routeFiles(files);
    const union=new Set(S.LANE_IDS.flatMap(lane=>S.selectedFor(lane,r)));
    for(const id of S.routedIds(r))assert.ok(union.has(id),`${files}: ${id} has a lane`);
  }
  ok('lane selection covers the route');

  // 5. Workflow shape of the watchdog: least privilege, Showdown Gate only.
  const wd=readWorkflow(root,'.github/workflows/gate-watchdog.yml');
  assert.deepEqual(wd.permissions,{actions:'write',contents:'read'});
  assert.deepEqual(wd.on.workflow_run,{workflows:['Showdown Gate'],types:['completed']});
  assert.deepEqual(wd.on.schedule,[{cron:'*/10 * * * *'}]);
  assert.ok(!('pull_request' in wd.on)&&!('pull_request_target' in wd.on));
  assert.equal(wd.jobs.watchdog.if,"github.event_name != 'workflow_run' || github.event.workflow_run.conclusion != 'success'",'green gate runs take no watchdog machine');
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  assert.equal(gate.name,W.GATE_WORKFLOW_NAME);assert.ok(gate.jobs.seal&&gate.jobs.seal.name===W.SEAL_JOB_NAME);
  assert.equal(W.MAX_ATTEMPTS,3);
  const wdText=fs.readFileSync(path.join(root,'scripts/gate-watchdog.mjs'),'utf8');
  assert.doesNotMatch(wdText,/validate-pos10\.yml|validate-gameplay-fast\.yml/,'the watchdog never names the old workflows');
  ok('watchdog workflow');

  // 5b. Factory board tick: yields to queued checks and never holds a machine for long.
  const tick=readWorkflow(root,'.github/workflows/factory-board-tick.yml');
  assert.equal(tick.name,'Factory board tick');
  assert.deepEqual(tick.on,{schedule:[{cron:'*/5 * * * *'}],workflow_dispatch:null});
  assert.deepEqual(tick.permissions,{contents:'write',actions:'read','pull-requests':'read',checks:'read',issues:'read'});
  assert.deepEqual(tick.concurrency,{group:'factory-board-tick','cancel-in-progress':true});
  const tickJob=Object.values(tick.jobs)[0];
  assert.equal(tickJob['runs-on'],'ubuntu-24.04');assert.equal(tickJob['timeout-minutes'],3);
  assert.equal(tickJob.steps[0].id,'yield');assert.match(tickJob.steps[0].run,/Validate POS20\|Validate Gameplay Fast\|Showdown Gate/);
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
  const heads=n=>Array.from({length:n},(_,i)=>({head:String(i),comparable:true,full_seal:i<2,gate_ran_superset:true,gate_pass_old_fail:false}));
  const canaries=[{gate:{verdict:'FAIL_TEST',run_attempt:1}},{gate:{verdict:'FAIL_TEST',run_attempt:1}}];
  const infraOnce=[{run_attempt:2,watchdog_reruns:1}];
  assert.equal(C.evaluateExitCriteria({comparisons:heads(10),canaries,infraRuns:infraOnce}).ready,true);
  assert.equal(C.evaluateExitCriteria({comparisons:heads(9),canaries,infraRuns:infraOnce}).ready,false,'needs 10 real heads');
  const oneFull=heads(10).map((c,i)=>({...c,full_seal:i===0}));
  assert.equal(C.evaluateExitCriteria({comparisons:oneFull,canaries,infraRuns:infraOnce}).ready,false,'needs 2 full seals');
  const disagree=heads(10);disagree[3].gate_pass_old_fail=true;
  assert.equal(C.evaluateExitCriteria({comparisons:disagree,canaries,infraRuns:infraOnce}).ready,false,'any gate-pass/old-fail blocks the exit');
  assert.equal(C.evaluateExitCriteria({comparisons:heads(10),canaries:[canaries[0],{gate:{verdict:'FAIL_TEST',run_attempt:2}}],infraRuns:infraOnce}).ready,false,'a re-run canary does not count');
  assert.equal(C.evaluateExitCriteria({comparisons:heads(10),canaries,infraRuns:[{run_attempt:3,watchdog_reruns:2}]}).ready,false,'infra must be re-run exactly once');
  ok('gate-compare');

  console.log(`PASS Showdown Gate watchdog contracts (${checks} groups): recorded not-acquired selector is INFRA and re-run at most twice per head, a started TEST: failure is never re-run, only Showdown Gate is touched, the seal fails closed on draft, superseded, foreign-head, missing or narrowed lanes.`);
})().catch(error=>{console.error(error);process.exit(1);});
