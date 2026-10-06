'use strict';
// Showdown Gate seal verdicts, lane selection, factory board tick, gate-yield and gate-compare logic, and
// the Showdown Gate cross-checks with the Physio. The Physio itself (watchdog, preempt, physio/v1 status)
// is covered by tests/contracts/showdown-gate-physio-contracts.cjs.
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

  const head='c'.repeat(40);
  // 4. Seal verdicts.
  const route=(await import(path.join(root,'scripts/pos20-impact-router.mjs'))).routeFiles([],{forceFull:true});
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

  console.log(`PASS Showdown Gate watchdog contracts (${checks} groups): the seal fails closed on draft, superseded, foreign-head, missing or narrowed lanes; lane selection covers the route; the board tick yields to the three checks; gate-yield and gate-compare exit criteria; the Physio counts the 16 gates and the six lanes of Showdown Gate.`);
})().catch(error=>{console.error(error);process.exit(1);});
