'use strict';
// Showdown Gate Physio: the check watchdog (scripts/gate-watchdog.mjs), helper preemption
// (scripts/gate-preempt.mjs) and the physio/v1 status (scripts/physio-status.mjs), against recorded and
// synthetic GitHub API fixtures. Independent of the Showdown Gate workflow: it ships on its own.
// A started test step that did not succeed is never re-run; infra-only failures of Showdown Gate, Validate
// POS20 and Validate Gameplay Fast are re-run at most twice per head; nothing else is ever touched.
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
  // POS20 runs are watched with their own profile (no TEST: prefix): seal = POS20 exact-head cognitive seal.
  assert.equal(W.isGateRun(recorded.run),false);assert.equal(W.profileFor(recorded.run).name,'Validate POS20');
  assert.equal(W.classifyRun({...recorded,liveHeadSha:recorded.run.head_sha}).classification,'INFRA','profile is taken from the run');
  const posts=[];const comments=[];// comments must stay empty: the Physio has no PR-comment scope.
  const fakeClient=(gathered)=>({
    get:async endpoint=>{
      if(endpoint.endsWith(`/actions/runs/${gathered.run.id}`))return gathered.run;
      if(endpoint.includes(`/actions/runs/${gathered.run.id}/jobs`))return {jobs:gathered.jobs};
      if(endpoint.includes('/check-runs/'))return gathered.annotations[endpoint.split('/check-runs/')[1].split('/')[0]]||[];
      if(/\/workflows\/(?:showdown-gate|validate-pos10|validate-gameplay-fast)\.yml\/runs\?head_sha=/.test(endpoint))return {workflow_runs:[gathered.run]};
      throw new Error(`unexpected GET ${endpoint}`);
    },
    getRaw:async endpoint=>{if(endpoint.includes('/git/ref/heads/'))return {status:200,body:{object:{sha:gathered.run.head_sha}}};throw new Error(`unexpected raw GET ${endpoint}`);},
    post:async (endpoint,options={})=>{if(endpoint.includes('/comments')){comments.push({endpoint,body:options.body?.body});return {status:201,body:null};}posts.push(endpoint);return {status:201,body:null};}
  });
  // Run 37364865245 as live data: re-run exactly once.
  const recordedLive=clone(recorded);recordedLive.run.head_repository={full_name:'o/r'};
  recordedLive.run.pull_requests=[{number:78,head:{sha:'0'.repeat(40)}},{number:77,head:{sha:recorded.run.head_sha}}];
  const pos20Rerun=await W.handleRun(fakeClient(recordedLive),'o/r',recordedLive.run.id);
  assert.equal(pos20Rerun.classification,'INFRA');assert.deepEqual(posts,[`repos/o/r/actions/runs/${recorded.run.id}/rerun-failed-jobs`]);
  assert.equal(pos20Rerun.pr,77,'the PR is the one whose head is exactly this head');
  // The Physio reports the re-run in the step summary.
  assert.deepEqual(pos20Rerun.physio,['Physio: re-ran POS20 exact selector (GitHub gave it no machine), attempt 2 of 2']);
  assert.equal(W.PHYSIO_NAME,'Showdown Gate Physio');
  const firstAttempt=clone(recordedLive);firstAttempt.run.run_attempt=1;
  assert.deepEqual(W.physioLines(W.classifyRun({...firstAttempt,liveHeadSha:firstAttempt.run.head_sha})),['Physio: re-ran POS20 exact selector (GitHub gave it no machine), attempt 1 of 2']);
  // A dry run or a refused re-run claims nothing.
  posts.length=0;
  assert.deepEqual((await W.handleRun(fakeClient(firstAttempt),'o/r',firstAttempt.run.id,{dryRun:true})).physio,[]);assert.deepEqual(posts,[]);
  const refused={...fakeClient(firstAttempt),post:async endpoint=>{posts.push(endpoint);return {status:409,body:null};}};
  const refusedResult=await W.handleRun(refused,'o/r',firstAttempt.run.id);
  assert.deepEqual(refusedResult.physio,[]);assert.equal(posts.length,1);assert.deepEqual(comments,[]);
  posts.length=0;
  const exhaustedLive=clone(recordedLive);exhaustedLive.run.run_attempt=3;
  assert.equal((await W.handleRun(fakeClient(exhaustedLive),'o/r',exhaustedLive.run.id)).classification,'INFRA_EXHAUSTED');assert.deepEqual(posts,[]);
  // Anything outside the three checks is refused before any API call that could act on it.
  for(const [name,file] of [['Deploy GitHub Pages','deploy-github-pages.yml'],['leads-relay-ping','leads-relay-ping.yml'],['Factory board tick','factory-board-tick.yml'],['Validate POS20','validate-stability-lane.yml']]){
    const foreign=clone(recordedLive);foreign.run.name=name;foreign.run.path=`.github/workflows/${file}`;
    const ignored=await W.handleRun(fakeClient(foreign),'o/r',foreign.run.id);
    assert.equal(ignored.classification,'IGNORED',`${name} must be ignored`);
  }
  assert.deepEqual(posts,[],'never re-runs a workflow outside the allowlist');assert.deepEqual(comments,[]);
  assert.deepEqual(W.WATCHED_WORKFLOWS.map(w=>[w.name,w.path]),[['Showdown Gate','.github/workflows/showdown-gate.yml'],['Validate POS20','.github/workflows/validate-pos10.yml'],['Validate Gameplay Fast','.github/workflows/validate-gameplay-fast.yml']]);
  ok('watchdog acts only on the three checks');
  // A POS20 run whose proof step failed is never re-run, even though another proof job was never acquired.
  const pos20Fail=fixture('pos20-run-proof-step-failed.json');
  const pos20FailResult=W.classifyRun({...pos20Fail,liveHeadSha:pos20Fail.run.head_sha});
  assert.equal(pos20FailResult.classification,'TEST_FAILURE');assert.deepEqual(pos20FailResult.failing_jobs,['POS20 proof REMOTE']);
  assert.equal((await W.handleRun(fakeClient(pos20Fail),'o/r',pos20Fail.run.id)).classification,'TEST_FAILURE');assert.deepEqual(posts,[]);
  // POS20: a job that completed a non-setup step and then failed in cleanup has started its tests: never re-run.
  const cleanup=clone(pos20Fail);const remote=cleanup.jobs.find(j=>j.name==='POS20 proof REMOTE');remote.steps.find(st=>st.name==='Run selected inherited heavy proofs').conclusion='success';remote.steps.find(st=>st.name==='Post Run actions/setup-node@v5').conclusion='failure';
  cleanup.jobs=cleanup.jobs.filter(j=>j.name!=='POS20 proof STORAGE');
  assert.equal(W.classifyRun({...cleanup,liveHeadSha:cleanup.run.head_sha}).classification,'TEST_FAILURE');
  // POS20: npm ci died before any non-setup step: infra.
  const npm=clone(pos20Fail);const r2=npm.jobs.find(j=>j.name==='POS20 proof REMOTE');r2.steps=r2.steps.slice(0,5);r2.steps[4].conclusion='failure';npm.jobs=npm.jobs.filter(j=>j.name!=='POS20 proof STORAGE');
  assert.equal(W.classifyRun({...npm,liveHeadSha:npm.run.head_sha}).classification,'INFRA');
  // Draft POS20: the selector is skipped, so every lane is skipped: nothing to do.
  const draftPos20=clone(pos20Fail);for(const j of draftPos20.jobs)if(j.name!=='POS20 exact-head cognitive seal'){j.conclusion='skipped';j.steps=[];}
  assert.equal(W.classifyRun({...draftPos20,liveHeadSha:draftPos20.run.head_sha}).classification,'DRAFT');
  // Gameplay Fast (push to gameplay/**): no seal; not-acquired rules job is infra; a moved branch is superseded.
  const fast={run:{id:6161,name:'Validate Gameplay Fast',path:'.github/workflows/validate-gameplay-fast.yml',event:'push',status:'completed',conclusion:'failure',head_sha:'1'.repeat(40),head_branch:'gameplay/recovery-v1',run_attempt:1,head_repository:{full_name:'o/r'}},
    jobs:[{id:61,name:'Gameplay contracts',status:'completed',conclusion:'success',steps:[{name:'Product contracts',status:'completed',conclusion:'success',started_at:'x'}]},{id:62,name:'Composed Rules on the emulator',status:'completed',conclusion:'cancelled',steps:[]}],annotations:{}};
  assert.equal(W.classifyRun({...fast,liveHeadSha:fast.run.head_sha}).classification,'INFRA');
  assert.equal(W.classifyRun({...fast,liveHeadSha:'2'.repeat(40)}).classification,'SUPERSEDED');
  assert.equal(W.classifyRun({...fast,headGone:true}).classification,'SUPERSEDED');
  const fastFail=clone(fast);fastFail.jobs[1]={id:62,name:'Composed Rules on the emulator',status:'completed',conclusion:'failure',steps:[{name:'Set up job',status:'completed',conclusion:'success',started_at:'x'},{name:'Run npm ci',status:'completed',conclusion:'success',started_at:'x'},{name:'Terminal Close matrix',status:'completed',conclusion:'failure',started_at:'x'}]};
  assert.equal(W.classifyRun({...fastFail,liveHeadSha:fastFail.run.head_sha}).classification,'TEST_FAILURE');
  ok('POS20 and Gameplay Fast profiles');
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

  // 5. Workflow shape of the watchdog: least privilege, Showdown Gate only.
  const wd=readWorkflow(root,'.github/workflows/gate-watchdog.yml');
  assert.equal(wd.name,'Showdown Gate Physio');assert.equal(wd.jobs.watchdog.name,'Showdown Gate Physio');
  assert.deepEqual(wd.permissions,{actions:'write',contents:'write','pull-requests':'read'},'the Physio holds exactly actions: write, contents: write and read-only pull-requests');
  for(const job of Object.values(wd.jobs))assert.ok(!('permissions' in job));
  assert.ok(!('pull_request' in wd.on)&&!('pull_request_target' in wd.on)&&!('issue_comment' in wd.on)&&!('push' in wd.on),'the Physio never runs PR or branch code');
  const wdSteps=wd.jobs.watchdog.steps;
  assert.equal(wdSteps[0].with['persist-credentials'],false);assert.equal(wdSteps[0].with.ref,undefined,'checks out the default branch only');
  assert.ok(!wdSteps.some(st=>/git (?:push|commit)/.test(st.run||'')),'the status is written through the contents API only');
  const statusStep=wdSteps.find(st=>st.name==='Write Physio status');
  assert.equal(statusStep.if,'always()');assert.match(statusStep.run,/^node scripts\/physio-status\.mjs --repo "\$GITHUB_REPOSITORY" --results "\$RUNNER_TEMP\/physio\/results\.json" --preempt "\$RUNNER_TEMP\/physio\/preempt\.json" --out "\$RUNNER_TEMP\/physio\/physio-status\.json" --publish$/);
  const upload=wdSteps.find(st=>st.uses==='actions/upload-artifact@v7');
  assert.equal(upload.if,'always()');assert.equal(upload.with.name,'physio-status');assert.equal(upload.with.path,'${{ runner.temp }}/physio/physio-status.json');
  assert.deepEqual(wd.on.workflow_run,{workflows:['Showdown Gate','Validate POS20','Validate Gameplay Fast'],types:['completed']});
  const sweepSteps=wd.jobs.watchdog.steps.map(st=>st.run||'');
  assert.ok(sweepSteps.some(r=>r==='node scripts/gate-preempt.mjs --repo "$GITHUB_REPOSITORY" --out "$RUNNER_TEMP/physio/preempt.json"'),'the sweep also preempts helpers');
  assert.deepEqual(wd.on.schedule,[{cron:'*/10 * * * *'}]);
  assert.ok(!('pull_request' in wd.on)&&!('pull_request_target' in wd.on));
  assert.equal(wd.jobs.watchdog.if,"github.event_name != 'workflow_run' || github.event.workflow_run.conclusion != 'success'",'green gate runs take no watchdog machine');
  assert.equal(W.MAX_ATTEMPTS,3);
  assert.deepEqual(wd.on.workflow_run.workflows,W.WATCHED_WORKFLOWS.map(w=>w.name),'workflow_run covers exactly the watched checks');
  ok('watchdog workflow');

  // 5c. gate-preempt: checks get machines first; only the allowlisted helpers are ever cancelled.
  const P=await import(path.join(root,'scripts/gate-preempt.mjs'));
  assert.deepEqual(P.HELPER_ALLOWLIST,['Gameplay factory progress poller','Factory board tick','Gameplay factory board auto-update']);
  assert.ok(P.NEVER_CANCEL.includes('leads-relay-ping'));assert.equal(P.STARVED_AFTER_MS,60000);
  const now=Date.parse('2026-10-05T22:30:00Z');const ago=sec=>new Date(now-sec*1000).toISOString();
  let nextId=1;const r=(name,status,extra={})=>({run:{id:nextId++,name,status,created_at:ago(status==='queued'?30:300),...extra},jobs:[]});
  const others=['leads-relay-ping','Validate POS20','Validate Gameplay Fast','Showdown Gate','Showdown Gate watchdog','Deploy GitHub Pages','Deploy Firestore Rules (zero billing)','Validate Stability Lane','gameplay factory progress poller','Factory board tick (copy)',''];
  const helpers=P.HELPER_ALLOWLIST.map(name=>r(name,'in_progress'));
  const universe=[...helpers,...P.HELPER_ALLOWLIST.map(name=>r(name,'queued')),...others.map(name=>r(name,'in_progress')),...others.map(name=>r(name,'queued'))];
  const starvedCheck={run:{id:999,name:'Showdown Gate',status:'in_progress',created_at:ago(400)},jobs:[{name:'L3 storage visual gameplay',status:'queued',created_at:ago(61)}]};
  let decision=P.decidePreempt([...universe,starvedCheck],now);
  assert.ok(decision.starved.length>0);
  assert.deepEqual(decision.cancel.map(c=>c.id).sort((a,b)=>a-b),helpers.map(h=>h.run.id),'cancels exactly the in-progress allowlisted helpers');
  for(const c of decision.cancel)assert.ok(P.HELPER_ALLOWLIST.includes(c.name)&&c.name!=='leads-relay-ping');
  // Fuzz: random names and statuses never yield a target outside the allowlist.
  const statuses=['in_progress','queued','completed','waiting'];
  for(let i=0;i<500;i++){
    const pool=[...others,...P.HELPER_ALLOWLIST,`helper-${i}`,'Leads relay ping','leads-relay-ping '];
    const runs=Array.from({length:12},(_,k)=>r(pool[(i*7+k*13)%pool.length],statuses[(i+k)%statuses.length]));
    for(const t of P.decidePreempt([...runs,starvedCheck],now).cancel)assert.ok(P.HELPER_ALLOWLIST.includes(t.name),`fuzz cancelled ${t.name}`);
  }
  // No starvation (queued under 60 s, or nothing queued): nothing is cancelled.
  assert.deepEqual(P.decidePreempt([...universe,{run:{id:998,name:'Validate POS20',status:'in_progress',created_at:ago(400)},jobs:[{name:'x',status:'queued',created_at:ago(59)}]}],now).cancel,[]);
  assert.deepEqual(P.decidePreempt(universe.filter(u=>!['Validate POS20','Validate Gameplay Fast','Showdown Gate'].includes(u.run.name)),now).cancel,[]);
  assert.equal(P.decidePreempt([{run:{id:997,name:'Validate Gameplay Fast',status:'queued',created_at:ago(61)},jobs:[]},helpers[0]],now).cancel.length,1,'a queued check run counts as starved');
  // preempt() posts cancel only for allowlisted helper ids.
  const cancelPosts=[];
  const pc={get:async endpoint=>{
      if(endpoint.includes('actions/runs?status=queued'))return {workflow_runs:universe.filter(u=>u.run.status==='queued').map(u=>u.run)};
      if(endpoint.includes('actions/runs?status=in_progress'))return {workflow_runs:[...universe.filter(u=>u.run.status==='in_progress').map(u=>u.run),starvedCheck.run]};
      if(endpoint.includes(`/actions/runs/${starvedCheck.run.id}/jobs`))return {jobs:starvedCheck.jobs};
      if(/\/actions\/runs\/\d+\/jobs/.test(endpoint))return {jobs:[]};
      throw new Error(`unexpected GET ${endpoint}`);},post:async endpoint=>{cancelPosts.push(endpoint);return {status:202};}};
  const preempted=await P.preempt(pc,'o/r',{now});
  assert.deepEqual(cancelPosts.sort(),helpers.map(h=>`repos/o/r/actions/runs/${h.run.id}/cancel`).sort());
  assert.equal(preempted.cancelled.length,P.HELPER_ALLOWLIST.length);
  // Mid-push: a helper with a Commit/Push step in progress (or unobserved jobs) is skipped this sweep.
  const pushing=r('Factory board tick','in_progress');pushing.jobs=[{name:'tick',status:'in_progress',steps:[{name:'Set up job',status:'completed',conclusion:'success'},{name:'Render the boards and commit when a row changed',status:'in_progress'}]}];
  const pushingPoller=r('Gameplay factory progress poller','in_progress');pushingPoller.jobs=[{name:'poll',status:'in_progress',steps:[{name:'Push board',status:'in_progress'}]}];
  const unobserved=r('Gameplay factory board auto-update','in_progress');unobserved.jobs=undefined;
  const idle=r('Gameplay factory board auto-update','in_progress');idle.jobs=[{name:'update',status:'in_progress',steps:[{name:'Commit board',status:'completed',conclusion:'success'},{name:'Wait',status:'in_progress'}]}];
  decision=P.decidePreempt([pushing,pushingPoller,unobserved,idle,starvedCheck],now);
  assert.deepEqual(decision.cancel,[{id:idle.run.id,name:idle.run.name}],'only the helper that is not mid-push is cancelled');
  assert.deepEqual(decision.skipped.map(s=>s.id).sort((a,b)=>a-b),[pushing.run.id,pushingPoller.run.id,unobserved.run.id]);
  for(const s of decision.skipped)assert.match(s.reason,/mid-push, left for the next sweep/);
  assert.equal(P.midPush([{name:'j',status:'in_progress',steps:[{name:'git push origin',status:'in_progress'}]}]).busy,true);
  assert.equal(P.midPush([{name:'j',status:'in_progress',steps:[{name:'Commit and push',status:'queued'}]}]).busy,false);
  // At the point of action the jobs are re-read: a helper that began pushing since the sweep is left alone.
  cancelPosts.length=0;let reads=0;
  const racing={get:async endpoint=>{
      if(endpoint.includes('actions/runs?status=queued'))return {workflow_runs:[]};
      if(endpoint.includes('actions/runs?status=in_progress'))return {workflow_runs:[idle.run,{...pushing.run,id:4040,name:'leads-relay-ping'},starvedCheck.run]};
      if(endpoint.includes(`/actions/runs/${starvedCheck.run.id}/jobs`))return {jobs:starvedCheck.jobs};
      if(endpoint.includes(`/actions/runs/${idle.run.id}/jobs`))return {jobs:reads++===0?idle.jobs:pushing.jobs};
      throw new Error(`unexpected GET ${endpoint}`);},post:async endpoint=>{cancelPosts.push(endpoint);return {status:202};}};
  const raced=await P.preempt(racing,'o/r',{now});
  assert.deepEqual(cancelPosts,[]);assert.deepEqual(raced.cancelled,[]);assert.equal(raced.skipped.length,1);
  ok('gate-preempt allowlist and mid-push skip');

  // 5d. Physio status (physio/v1): stable schema, states, best-effort push on change or after 10 minutes.
  const PS=await import(path.join(root,'scripts/physio-status.mjs'));
  assert.equal(PS.PHYSIO_SCHEMA,'physio/v1');assert.deepEqual(PS.PHYSIO_STATES,['ALL_CLEAR','BARKING','STUCK']);assert.deepEqual(PS.PHYSIO_ACTIONS,['none','rerun','preempted_helpers']);
  assert.equal(PS.PHYSIO_BRANCH,'factory/gameplay-v1');assert.equal(PS.PHYSIO_BOARD_PATH,'project-documents/gameplay-factory/physio-status.json');assert.equal(PS.PHYSIO_REFRESH_MS,600000);
  const keys=status=>{assert.deepEqual(Object.keys(status),['schema','at','state','checks','helpers_paused','gate','pos20']);for(const c of status.checks){assert.deepEqual(Object.keys(c),['workflow','head_sha','pr','queued_minutes','action','attempt','max_attempts']);assert.ok(PS.PHYSIO_ACTIONS.includes(c.action));assert.equal(c.max_attempts,2);assert.ok(c.attempt>=0&&c.attempt<=2);}assert.ok(PS.PHYSIO_STATES.includes(status.state));assert.equal(status.at,new Date(Date.parse(status.at)).toISOString());return status;};
  const clear=keys(PS.buildPhysioStatus({now,active:[{run:{id:1,name:'Showdown Gate',status:'in_progress',head_sha:'a'.repeat(40),created_at:ago(600)},jobs:[{name:'L1 core',status:'in_progress',created_at:ago(500)},{name:'L2',status:'queued',created_at:ago(30)}]}],results:[{classification:'TEST_FAILURE',workflow:'Showdown Gate'}],preempt:{cancelled:[]}}));
  assert.equal(clear.state,'ALL_CLEAR');assert.deepEqual(clear.checks,[]);assert.deepEqual(clear.helpers_paused,[]);
  const waitingPos20={run:{id:2,name:'Validate POS20',status:'queued',head_sha:'b'.repeat(40),run_attempt:2,created_at:ago(360),pull_requests:[{number:9,head:{sha:'b'.repeat(40)}}]},jobs:[]};
  const barking=keys(PS.buildPhysioStatus({now,active:[waitingPos20,{run:{id:3,name:'leads-relay-ping',status:'queued',created_at:ago(900)},jobs:[]}],preempt:{cancelled:[{id:5,name:'Factory board tick',status:202},{id:6,name:'Factory board tick',status:202},{id:7,name:'Gameplay factory progress poller',status:'dry-run'}]}}));
  assert.equal(barking.state,'BARKING');assert.deepEqual(barking.helpers_paused,['Factory board tick']);
  assert.deepEqual(barking.checks,[{workflow:'Validate POS20',head_sha:'b'.repeat(40),pr:9,queued_minutes:6,action:'preempted_helpers',attempt:1,max_attempts:2}]);
  const rerunStatus=keys(PS.buildPhysioStatus({now,results:[{...pos20Rerun}]}));
  assert.equal(rerunStatus.state,'BARKING');assert.deepEqual(rerunStatus.checks,[{workflow:'Validate POS20',head_sha:recorded.run.head_sha,pr:77,queued_minutes:0,action:'rerun',attempt:2,max_attempts:2}]);
  assert.equal(PS.buildPhysioStatus({now,results:[refusedResult]}).state,'ALL_CLEAR','a refused re-run is not reported as a re-run');
  const exhaustedResult=W.classifyRun({...exhaustedLive,liveHeadSha:exhaustedLive.run.head_sha});
  const stuck=keys(PS.buildPhysioStatus({now,active:[waitingPos20],results:[exhaustedResult]}));
  assert.equal(stuck.state,'STUCK');assert.equal(stuck.checks.find(c=>c.action==='none'&&c.queued_minutes===0).attempt,2);
  assert.equal(PS.buildPhysioStatus({now,results:[{...exhaustedResult,workflow:'Deploy GitHub Pages'}]}).state,'ALL_CLEAR','only the three checks are reported');
  // Push only on change or when the last push is over 10 minutes old; one attempt; failures never throw.
  const later=now+5*60000;
  assert.equal(PS.shouldPublish(null,barking,now).write,true);
  assert.equal(PS.shouldPublish(barking,{...barking,at:new Date(later).toISOString()},later).write,false);
  assert.equal(PS.shouldPublish(barking,{...barking,at:new Date(now+11*60000).toISOString()},now+11*60000).write,true);
  assert.equal(PS.shouldPublish(barking,{...clear,at:new Date(later).toISOString()},later).write,true);
  const puts=[];const branchFile=status=>({status:200,body:{sha:'blob1',content:Buffer.from(JSON.stringify(status)).toString('base64')}});
  const statusClient=(current,putStatus=201)=>({getRaw:async endpoint=>{assert.equal(endpoint,'repos/o/r/contents/project-documents/gameplay-factory/physio-status.json?ref=factory%2Fgameplay-v1');return current;},put:async (endpoint,options)=>{puts.push({endpoint,...options.body});return {status:putStatus,body:{commit:{sha:'c1'}}};}});
  let pushed=await PS.publishPhysio(statusClient({status:404,body:null}),'o/r',barking,{now});
  assert.equal(pushed.published,true);assert.equal(puts.length,1);assert.equal(puts[0].branch,'factory/gameplay-v1');assert.equal(puts[0].sha,undefined);
  assert.deepEqual(JSON.parse(Buffer.from(puts[0].content,'base64').toString('utf8')),barking);assert.doesNotMatch(puts[0].message,/skip ci/i);
  puts.length=0;pushed=await PS.publishPhysio(statusClient(branchFile(barking)),'o/r',{...barking,at:new Date(later).toISOString()},{now:later});
  assert.equal(pushed.published,false);assert.deepEqual(puts,[]);
  pushed=await PS.publishPhysio(statusClient(branchFile(barking)),'o/r',{...clear,at:new Date(later).toISOString()},{now:later});
  assert.equal(pushed.published,true);assert.equal(puts[0].sha,'blob1','compare-and-swap on the current blob');
  puts.length=0;pushed=await PS.publishPhysio(statusClient(branchFile(barking),409),'o/r',clear,{now:later});
  assert.equal(pushed.published,false);assert.equal(puts.length,1,'one attempt only');
  pushed=await PS.publishPhysio({getRaw:async()=>{throw new Error('network down');},put:async()=>{throw new Error('unreachable');}},'o/r',clear,{now});
  assert.equal(pushed.published,false);assert.match(pushed.reason,/network down/);
  // checks: one entry per workflow and head; the check that sets the state comes first, with its action.
  const reranWaiting=keys(PS.buildPhysioStatus({now,active:[{run:{id:11,name:'Showdown Gate',status:'queued',head_sha:'c'.repeat(40),run_attempt:2,created_at:ago(120)},jobs:[]},waitingPos20],results:[{classification:'INFRA',rerun_status:201,workflow:'Showdown Gate',head_sha:'c'.repeat(40),retries_used:0,pr:12}],preempt:{cancelled:[{id:5,name:'Factory board tick',status:202}]}}));
  assert.equal(reranWaiting.state,'BARKING');assert.equal(reranWaiting.checks.length,2,'a re-run check that is waiting again is one entry');
  assert.deepEqual(reranWaiting.checks[0],{workflow:'Validate POS20',head_sha:'b'.repeat(40),pr:9,queued_minutes:6,action:'preempted_helpers',attempt:1,max_attempts:2},'longest-waiting check first');
  assert.deepEqual(reranWaiting.checks[1],{workflow:'Showdown Gate',head_sha:'c'.repeat(40),pr:12,queued_minutes:2,action:'rerun',attempt:1,max_attempts:2});
  assert.equal(stuck.checks[0].action,'none');assert.equal(stuck.checks[0].queued_minutes,0);assert.equal(stuck.checks[0].attempt,2,'under STUCK the exhausted check comes first');
  // gate / pos20: the newest open non-draft PR into main, null when there is none.
  assert.deepEqual(PS.GATE_LANES,['L1 core','L2 browser full','L3 storage visual gameplay','L4 remote','L5 rules regression','L6 browser journey']);
  assert.deepEqual(PS.GATE_SEALS,['PASS','FAIL_TEST','INFRA_RETRYING','INFRA_EXHAUSTED','PENDING','DRAFT','SUPERSEDED']);
  assert.equal(PS.POS20_GATE_NAMES.length,PS.POS20_TOTAL_GATES);
  const H='d'.repeat(40);
  const pulls=[{number:20,state:'open',draft:true,base:{ref:'main'},head:{sha:'e'.repeat(40)},updated_at:ago(10)},{number:21,state:'open',draft:false,base:{ref:'gameplay/recovery-v1'},head:{sha:'f'.repeat(40)},updated_at:ago(5)},{number:22,state:'open',draft:false,base:{ref:'main'},head:{sha:H},updated_at:ago(60)},{number:19,state:'open',draft:false,base:{ref:'main'},head:{sha:'9'.repeat(40)},updated_at:ago(3600)}];
  assert.equal(PS.focusPullRequest(pulls).number,22,'newest open non-draft PR into main');
  assert.equal(PS.focusPullRequest(pulls.filter(p=>p.number!==22&&p.number!==19)),null);
  assert.equal(keys(PS.buildPhysioStatus({now,focus:null})).gate,null);assert.equal(PS.buildPhysioStatus({now,focus:null}).pos20,null);
  const pr22=pulls[2];
  const laneJob=(name,status,conclusion=null)=>({name,status,conclusion,steps:[]});
  const gateRunning={id:31,name:'Showdown Gate',path:'.github/workflows/showdown-gate.yml',event:'pull_request',status:'in_progress',conclusion:null,head_sha:H,run_attempt:1,head_repository:{full_name:'o/r'}};
  const runningJobs=[laneJob('L1 core','completed','success'),laneJob('L2 browser full','completed','skipped'),laneJob('L3 storage visual gameplay','in_progress'),laneJob('L4 remote','completed','failure'),laneJob('L5 rules regression','queued'),laneJob('seal','queued')];
  const focus={pr:pr22,gateRun:gateRunning,gateJobs:runningJobs,gateNames:PS.POS20_GATE_NAMES,pos20Run:{id:41,name:'Validate POS20',status:'in_progress',conclusion:null,head_sha:H},pos20Jobs:[{name:'POS20 exact selector',status:'completed',conclusion:'success'},{name:'POS20 proof FULL',status:'completed',conclusion:'skipped'},{name:'POS20 cognitive benchmark',status:'in_progress',conclusion:null}],fastRun:null,fastJobs:[],pos20Archived:false};
  const withFocus=keys(PS.buildPhysioStatus({now,focus}));
  assert.deepEqual(withFocus.gate,{pr:22,head_sha:H,lanes:[{name:'L1 core',state:'pass'},{name:'L2 browser full',state:'skipped'},{name:'L3 storage visual gameplay',state:'running'},{name:'L4 remote',state:'fail'},{name:'L5 rules regression',state:'queued'},{name:'L6 browser journey',state:'queued'}],seal:'PENDING'});
  assert.deepEqual(withFocus.pos20,{pr:22,passed:2,total:16,state:'running'});
  const gateSealOf=(run,jobs)=>PS.buildGateView({pr:pr22,gateRun:run,gateJobs:jobs}).seal;
  // No Showdown Gate run on this head yet (or no Showdown Gate workflow at all): gate is null, pos20 still filled.
  assert.equal(PS.buildGateView({pr:pr22,gateRun:null,gateJobs:[]}),null);
  assert.equal(PS.buildGateView({pr:pr22,gateRun:{...gateRunning,head_sha:'0'.repeat(40)},gateJobs:runningJobs}),null,'a run on an older head says nothing about this head');
  const noGate=keys(PS.buildPhysioStatus({now,focus:{...focus,gateRun:null,gateJobs:[]}}));
  assert.equal(noGate.gate,null);assert.deepEqual(noGate.pos20,{pr:22,passed:2,total:16,state:'running'});
  assert.equal(gateSealOf({...gateRunning,run_attempt:2},runningJobs),'INFRA_RETRYING');
  const doneRun=(conclusion,extra={})=>({...gateRunning,status:'completed',conclusion,...extra});
  const lanesGreen=PS.GATE_LANES.map(name=>laneJob(name,'completed','success'));
  assert.equal(gateSealOf(doneRun('success'),[...lanesGreen,laneJob('seal','completed','success')]),'PASS');
  const testFail=[...lanesGreen.slice(1),{name:'L1 core',status:'completed',conclusion:'failure',steps:[{name:'TEST: Product contracts (every registered contract)',status:'completed',conclusion:'failure',started_at:'x'}]},laneJob('seal','completed','failure')];
  assert.equal(gateSealOf(doneRun('failure'),testFail),'FAIL_TEST');
  const noMachine=[...lanesGreen.slice(1),laneJob('L1 core','completed','cancelled'),laneJob('seal','completed','failure')];
  assert.equal(gateSealOf(doneRun('failure'),noMachine),'INFRA_RETRYING');assert.equal(gateSealOf(doneRun('failure',{run_attempt:3}),noMachine),'INFRA_EXHAUSTED');
  assert.equal(gateSealOf(doneRun('failure'),[...PS.GATE_LANES.map(name=>laneJob(name,'completed','skipped')),laneJob('seal','completed','failure')]),'DRAFT');
  assert.equal(PS.buildGateView({pr:{...pr22,head:{sha:'1'.repeat(40)}},gateRun:{...doneRun('failure'),head_sha:'1'.repeat(40)},gateJobs:noMachine}).seal,'INFRA_RETRYING');
  // POS20 view: 16 gates; green = success or route-skipped; pass only when every run on the head succeeded.
  const allPos20=PS.POS20_GATE_NAMES.filter(n=>!/^(?:Gameplay contracts|Composed Rules on the emulator|Two-manager browser journey|Composed production Rules regression)$/.test(n)).map(name=>({name,status:'completed',conclusion:'success'}));
  const fastJobs=PS.POS20_GATE_NAMES.filter(n=>!allPos20.some(j=>j.name===n)).map(name=>({name,status:'completed',conclusion:'success'}));
  assert.equal(allPos20.length,12);assert.equal(fastJobs.length,4);
  assert.deepEqual(PS.buildPos20View({pr:pr22,gateNames:PS.POS20_GATE_NAMES,pos20Run:{status:'completed',conclusion:'success',head_sha:H},pos20Jobs:allPos20,fastRun:{status:'completed',conclusion:'success',head_sha:H},fastJobs}),{pr:22,passed:16,total:16,state:'pass'});
  assert.deepEqual(PS.buildPos20View({pr:pr22,gateNames:PS.POS20_GATE_NAMES,pos20Run:{status:'completed',conclusion:'success',head_sha:H},pos20Jobs:allPos20}),{pr:22,passed:12,total:16,state:'pass'},'no Gameplay Fast run on a non-gameplay head');
  assert.equal(PS.buildPos20View({pr:pr22,gateNames:PS.POS20_GATE_NAMES,pos20Run:{status:'completed',conclusion:'failure',head_sha:H},pos20Jobs:allPos20}).state,'fail');
  assert.equal(PS.buildPos20View({pr:pr22,gateNames:PS.POS20_GATE_NAMES,pos20Run:{status:'completed',conclusion:'success',head_sha:'0'.repeat(40)},pos20Jobs:allPos20}).state,'running','no POS20 run on this head yet');
  assert.equal(PS.buildPos20View({pr:pr22,gateNames:PS.POS20_GATE_NAMES,pos20Archived:true}),null);
  // gatherFocus reads only: pulls, runs by head and jobs; an archived workflow (404) is tolerated.
  const focusReads=[];
  const focusClient={get:async endpoint=>{focusReads.push(endpoint);if(endpoint.startsWith('repos/o/r/pulls?state=open&base=main'))return pulls;if(endpoint.includes('/actions/runs/31/jobs'))return {jobs:runningJobs};throw new Error(`unexpected GET ${endpoint}`);},
    getRaw:async(endpoint,options)=>{focusReads.push(endpoint);assert.deepEqual(options.allow,[404]);assert.ok(endpoint.endsWith(`runs?head_sha=${H}&per_page=20`));if(endpoint.includes('showdown-gate.yml'))return {status:200,body:{workflow_runs:[{...gateRunning,id:30,created_at:ago(900)},{...gateRunning,created_at:ago(100)}]}};if(endpoint.includes('validate-pos10.yml'))return {status:404,body:null};return {status:200,body:{workflow_runs:[]}};},
    post:async()=>{throw new Error('gatherFocus must not write');},put:async()=>{throw new Error('gatherFocus must not write');}};
  const gathered=await PS.gatherFocus(focusClient,'o/r');
  assert.equal(gathered.pr.number,22);assert.equal(gathered.gateRun.id,31,'newest gate run on the head');assert.equal(gathered.pos20Archived,true);assert.ok(!("gateNames" in gathered));
  assert.equal(PS.buildPhysioStatus({now,focus:gathered}).pos20,null);
  ok('physio status');

  assert.equal(W.GATE_WORKFLOW_NAME,'Showdown Gate');assert.equal(W.SEAL_JOB_NAME,'seal');
  ok('physio constants');

  console.log(`PASS Showdown Gate Physio contracts (${checks} groups): recorded not-acquired selector is INFRA and re-run at most twice per head, a started test failure is never re-run, only Showdown Gate, Validate POS20 and Validate Gameplay Fast are re-run, helpers are preempted only from the allowlist and never mid-push, physio/v1 status with gate and pos20 is pushed best effort.`);
})().catch(error=>{console.error(error);process.exit(1);});
