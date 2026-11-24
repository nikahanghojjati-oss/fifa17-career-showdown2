'use strict';
// L7 Ironman (r100 Phoenix W10): the fault-injection journey and a 3-season CE2PG inside the Showdown Gate.
// Proves: the fail-closed route (a PR into a release branch skips L7 only when every changed file is outside the game),
// the seal's independent skip check, one lane record per leg, the shared head seed, and the leg runner's one rerun with
// the same seed (PASS, FLAKY = passed on the rerun and listed by the seal, FAIL = failed twice).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');
const root=path.resolve(__dirname,'../..');

async function run(){
  const S=await import(path.join(root,'scripts/showdown-gate.mjs'));
  const L=await import(path.join(root,'scripts/ironman-leg.mjs'));
  let checks=0;const ok=()=>{checks+=1;};

  // 1. Legs: the eight faults, the fault-free baseline and CE2PG; one lane record each, all in the one matrix job.
  assert.deepEqual([...S.L7_LEGS],['none','network','lock','evict','reload','tabkill','twotabs','quota','coldoffline','ce2pg']);
  assert.deepEqual([...L.LEGS],[...S.L7_LEGS],'the leg runner knows exactly the Gate legs');
  for(const leg of S.L7_LEGS){const def=S.LANES[S.l7Lane(leg)];assert.equal(def.job,'l7-ironman');assert.equal(def.leg,leg);assert.deepEqual(def.fixed,[`IRONMAN_${leg.toUpperCase()}`]);}
  const fij=fs.readFileSync(path.join(root,'tests/browser/fault-injection-journey.cjs'),'utf8');
  const faults=JSON.parse(fij.match(/const ALL_FAULTS=(\[[^\]]+\])/)[1]);
  assert.deepEqual(S.L7_LEGS.filter(leg=>!['none','ce2pg'].includes(leg)),faults,'L7 has one leg per fault of the journey');
  ok();

  // 2. Route: fail-closed, skipping only when every file is plainly outside the game.
  const outside=['README.md','gameplay/r100/notes.md','chronicle/volume-27.html','project-documents/x.json','tests/contracts/a-contracts.cjs','tests/operations/b.test.mjs','POS20_CURRENT_STATE.json','CURRENT_PRODUCT_TEST_MANIFEST.json','GATE_COVERAGE.json','tools/check_job.py'];
  const inside=['js/productionSharedSeasonCommit.js','css/app.css','data/clubs.js','index.html','service-worker.js','assets/kits/a.png','visual-assets/home/home.css','firestore.rules','firebase.json','package.json','package-lock.json','tests/browser/fault-injection-journey.cjs','tests/browser/ce2pg-journey.cjs','tests/browser/support/club-draw.cjs','tests/support/static-server.cjs','scripts/ironman-leg.mjs','scripts/showdown-gate.mjs','.github/workflows/showdown-gate.yml','manifest.webmanifest','new-folder/thing.js'];
  assert.equal(S.l7Affected(outside),false,'notes, Story, plans and Node-only contracts do not feed L7');
  assert.equal(S.l7Affected([]),false);
  for(const file of inside)assert.equal(S.l7Affected([...outside,file]),true,`game or journey file: ${file}`);
  for(const files of [null,undefined,'js/a.js',[null],['']])assert.equal(S.l7Affected(files),true,'unknown inputs fail closed');
  const decision=extra=>S.l7Decision({event:'pull_request',baseRef:'gameplay/r100',files:outside,...extra});
  assert.equal(decision({}).l7_run,false);
  for(const event of ['push','workflow_dispatch',undefined])assert.equal(decision({event}).l7_run,true,`${event} always runs L7`);
  assert.equal(decision({baseRef:'main'}).l7_run,true,'a PR into main always runs L7');
  assert.equal(decision({baseRef:null}).l7_run,true);
  assert.equal(decision({files:inside}).l7_run,true);
  ok();

  // 3. Seed: one per head, the same for every leg and every rerun of that head.
  const head='a1b2c3d4'+'e'.repeat(32),base='b'.repeat(40),runId=700;
  assert.equal(S.l7Seed(head),0xa1b2c3d4);assert.equal(S.l7Seed(head),S.l7Seed(head));
  assert.equal(S.l7Seed('nope'),null);
  ok();

  // 4. Seal: a verified skip passes; a skip the seal cannot verify, a failed leg, or a missing leg record fails closed.
  const route={profile:'L7_CONTRACT',tests:[],proofs:[],operations:false};
  const needs=Object.fromEntries(Object.values(S.LANES).map(def=>[def.job,{result:'success'}]));
  const allSteps=lane=>Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
  const green=(extra={})=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,S.buildLaneRecord({lane,headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:allSteps(lane),...(S.isL7(lane)?{files:outside,ironman:{verdict:'PASS',seed:S.l7Seed(head),seasons:3,attempts:[{exit:0}],replay:'x'}}:{}),...extra})]));
  const skipped=()=>{const lanes=green();for(const leg of S.L7_LEGS){const lane=S.l7Lane(leg);lanes[lane]=S.buildLaneRecord({lane,headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:{ironman:{outcome:'skipped'}},l7Run:false,l7Reason:decision({}).l7_reason,files:outside});}return lanes;};
  const seal=extra=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha:base,baseRef:'gameplay/r100',files:outside,prLiveHead:head,route,needs,lanes:green(),runId,runAttempt:1,...extra});
  assert.equal(seal({}).verdict,'PASS','every leg ran and passed');
  assert.equal(seal({lanes:skipped()}).verdict,'PASS','an independently verified skip passes');
  for(const leg of S.L7_LEGS){const lane=S.l7Lane(leg);assert.deepEqual(skipped()[lane].selected,[]);assert.deepEqual(green()[lane].selected,[`IRONMAN_${leg.toUpperCase()}`]);}
  for(const file of inside){const lanes=skipped();for(const leg of S.L7_LEGS)lanes[S.l7Lane(leg)].files=[...outside,file];assert.equal(seal({files:[...outside,file],lanes}).verdict,'FAIL_TEST',`seal refuses a skip with ${file}`);}
  for(const extra of [{event:'push'},{baseRef:'main'},{baseRef:null},{files:null}])assert.equal(seal({...extra,lanes:skipped()}).verdict,'FAIL_TEST',`no skip: ${JSON.stringify(extra)}`);
  for(const flag of [true,undefined,null,'false']){const lanes=skipped();lanes['L7-lock'].l7_run=flag;assert.equal(seal({lanes}).verdict,'FAIL_TEST','a skip needs an explicit boolean false');}
  for(const outcome of ['failure','cancelled','skipped']){const lanes=green();lanes['L7-reload']=S.buildLaneRecord({lane:'L7-reload',headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:{ironman:{outcome}},files:outside});assert.equal(seal({lanes}).verdict,'FAIL_TEST',`${outcome} leg without a verified skip fails`);}
  {const lanes=green();lanes['L7-quota']=null;assert.equal(seal({lanes}).verdict,'FAIL_TEST','a missing leg record fails');}
  {const lanes=green();lanes['L7-evict'].leg='lock';assert.ok(seal({lanes}).failures.some(f=>/leg identity/.test(f)),'a record for another leg fails');}
  assert.equal(seal({needs:{...needs,'l7-ironman':{result:'failure'}}}).verdict,'FAIL_TEST','a red leg makes the matrix job red');
  {const lanes=green();lanes['L7-tabkill'].ironman={verdict:'FLAKY',seed:7,seasons:3,attempts:2,replay:'FIJ_FAULT=tabkill FIJ_SEED=7 FIJ_SEASONS=3 node tests/browser/fault-injection-journey.cjs'};const s=seal({lanes});assert.equal(s.verdict,'PASS','a pass on the rerun keeps the Gate green');assert.equal(s.flaky.length,1);assert.match(s.flaky[0],/L7-tabkill.*seed 7.*FIJ_FAULT=tabkill FIJ_SEED=7/);}
  assert.deepEqual(seal({}).flaky,[]);
  ok();

  // 5. Workflow: the matrix runs the leg runner under the route, and records every leg.
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  // Ironman full matrix runner slots (lead 2026-11-24): at most 4 jobs at once; a newer push cancels an older head's run,
  // a manual run never.
  {const full=readWorkflow(root,'.github/workflows/ironman-full-matrix.yml');
    assert.equal(full.jobs.leg.strategy['max-parallel'],4,'the full matrix holds at most 4 runner slots');
    assert.equal(full.concurrency.group,'ironman-full-matrix-${{ github.ref }}-${{ github.event_name }}','manual runs have their own group');
    assert.equal(full.concurrency['cancel-in-progress'],"${{ github.event_name == 'push' }}",'the newest pushed head wins; a manual run is never cancelled');
    assert.ok(full.on.workflow_dispatch&&full.on.push,'push and manual runs both stay');
    const legStep=full.jobs.leg.steps.find(st=>/ironman-leg\.mjs/.test(String(st.run||'')));
    assert.equal(legStep.env.IRONMAN_SEASONS,"${{ github.event_name == 'workflow_dispatch' && (github.event.inputs.seasons || '10') || '3' }}",'pushes play 3 seasons, manual runs 10 by default');}
  const job=gate.jobs['l7-ironman'];
  const step=job.steps.find(s=>s.id==='ironman');
  assert.equal(step.if,"steps.route.outputs.l7_run == 'true'");
  assert.match(step.run,/^node scripts\/ironman-leg\.mjs --leg \$\{\{ matrix\.leg \}\} --seed "\$IRONMAN_SEED" --seasons 3 --out "test-results\/ironman-\$\{\{ matrix\.leg \}\}\.json"$/);
  assert.equal(step.env?.IRONMAN_SEED,'${{ steps.route.outputs.seed }}');
  assert.equal(step.env?.CMS_CHROMIUM_MULTI_CONTEXT,'1');
  assert.ok(job.steps.some(s=>/firebase@12\.17\.0 /.test(String(s.run||''))),'L7 pins firebase@12.17.0 (12.17.1 breaks emulator sign-in in CE2PG)');
  assert.ok(gate.jobs.seal.needs.includes('l7-ironman'));
  ok();

  // 6. Leg runner: the plan per leg, and one rerun with the same seed.
  assert.deepEqual(L.legPlan({leg:'network',seed:42}).env,{FIJ_FAULT:'network',FIJ_SEED:'42',FIJ_SEASONS:'3'});
  assert.equal(L.legPlan({leg:'network',seed:42}).replay,'FIJ_FAULT=network FIJ_SEED=42 FIJ_SEASONS=3 node tests/browser/fault-injection-journey.cjs');
  assert.deepEqual(L.legPlan({leg:'ce2pg',seed:4,seasons:10}).env,{CE2PG_PLAN:'single',CE2PG_SEASONS:'10',CE2PG_RUN:'2'});
  for(const bad of [{leg:'meteor',seed:1},{leg:'none',seed:-1},{leg:'none',seed:1.5},{leg:'none',seed:1,seasons:4}])assert.throws(()=>L.legPlan(bad));
  assert.equal(L.verdictOf([0]),'PASS');assert.equal(L.verdictOf([1,0]),'FLAKY');assert.equal(L.verdictOf([1,1]),'FAIL');assert.equal(L.verdictOf([]),'FAIL');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ironman-leg-contract-'));
  try{
    const counter=path.join(tmp,'count'),outDir=path.join(tmp,'test-results');
    // The fake leg fails on the first call when FAIL_FIRST is set, always when FAIL_ALWAYS is set; it checks the seed it was given.
    const fake=[process.execPath,'-e',`const fs=require('fs');const f=${JSON.stringify(counter)};const n=fs.existsSync(f)?Number(fs.readFileSync(f,'utf8')):0;fs.writeFileSync(f,String(n+1));fs.mkdirSync(${JSON.stringify(outDir)},{recursive:true});fs.writeFileSync(require('path').join(${JSON.stringify(outDir)},'fij-lock-alt.json'),'{"n":'+n+'}');if(process.env.FIJ_SEED!=='9')process.exit(3);process.exit(process.env.FAIL_ALWAYS||(process.env.FAIL_FIRST&&n===0)?1:0);`];
    const quiet=()=>{};
    const runFake=env=>{fs.rmSync(counter,{force:true});fs.rmSync(outDir,{recursive:true,force:true});return L.runLeg({leg:'lock',seed:9,command:fake,env:{...process.env,GITHUB_STEP_SUMMARY:'',...env},log:quiet,outDir,out:path.join(tmp,'result.json')});};
    let r=runFake({});assert.equal(r.verdict,'PASS');assert.equal(r.attempts.length,1);
    r=runFake({FAIL_FIRST:'1'});assert.equal(r.verdict,'FLAKY');assert.equal(r.attempts.length,2);
    assert.equal(JSON.parse(fs.readFileSync(path.join(outDir,'attempt-1','fij-lock-alt.json'),'utf8')).n,0,'the first attempt\'s report is kept in attempt-1/');
    assert.equal(JSON.parse(fs.readFileSync(path.join(outDir,'fij-lock-alt.json'),'utf8')).n,1,'the rerun writes its own report');
    r=runFake({FAIL_ALWAYS:'1'});assert.equal(r.verdict,'FAIL');assert.equal(r.attempts.length,2,'a failure reruns exactly once');
    const saved=JSON.parse(fs.readFileSync(path.join(tmp,'result.json'),'utf8'));
    assert.equal(saved.schema,'ironman-leg/v1');assert.equal(saved.seed,9);assert.equal(saved.replay,'FIJ_FAULT=lock FIJ_SEED=9 FIJ_SEASONS=3 node tests/browser/fault-injection-journey.cjs');
    const cli=spawnSync(process.execPath,['scripts/ironman-leg.mjs','--leg','meteor','--seed','1'],{cwd:root,encoding:'utf8'});
    assert.equal(cli.status,2,'an unknown leg is refused before anything runs');
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
  ok();

  // 7. The journey refuses a bad seed or season count before it starts anything (no emulators, no browser).
  for(const env of [{FIJ_SEED:'abc'},{FIJ_SEASONS:'4'}]){
    const r=spawnSync(process.execPath,['tests/browser/fault-injection-journey.cjs'],{cwd:root,encoding:'utf8',env:{...process.env,FIJ_FAULT:'none',...env},timeout:30000});
    assert.equal(r.status,2,`${JSON.stringify(env)} is refused: ${r.stderr}`);
  }
  assert.match(fij,/const NETWORK_S=RAND\?Array\.from\(\{length:13\},\(\)=>pickInt\(5,30\)\)/,'with a seed the offline seconds stay 5-30');
  assert.match(fij,/const LOCK_S=RAND\?Array\.from\(\{length:12\},\(\)=>pickInt\(8,20\)\)/,'with a seed the locked seconds stay 8-20');
  ok();

  console.log(`PASS Showdown Gate L7 Ironman: ${S.L7_LEGS.length} legs in one matrix job, fail-closed route and verified skips, one seed per head, one rerun with the same seed (PASS / FLAKY listed by the seal / FAIL) (${checks} groups).`);
}

module.exports=run;
if(require.main===module)run().catch(error=>{console.error(error);process.exit(1);});
