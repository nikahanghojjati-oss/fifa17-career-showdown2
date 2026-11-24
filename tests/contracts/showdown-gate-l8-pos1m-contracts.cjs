'use strict';
// L8 POS1M (r100 Phoenix B1 + B4): POS1M Ring 1 inside the Showdown Gate, on every PR.
// Proves: three shard jobs (every 3rd story seed each) that together play 20,000 seeded stories, the stand-in's own
// harshness contracts and the planted-bug proof in each shard job, one lane record per shard, no route skip (Node only,
// so there is nothing to skip and nothing for the seal to verify), and the seal fails closed on a red or missing shard.
const assert=require('node:assert/strict');
const path=require('node:path');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');
const root=path.resolve(__dirname,'../..');

async function run(){
  const S=await import(path.join(root,'scripts/showdown-gate.mjs'));
  let checks=0;const ok=()=>{checks+=1;};

  // 1. Shards: three lane records in the one matrix job, each with the same three proofs.
  assert.deepEqual([...S.L8_SHARDS],[1,2,3]);
  assert.deepEqual(S.LANE_IDS.filter(S.isL8),['L8-1','L8-2','L8-3']);
  for(const shard of S.L8_SHARDS){
    const def=S.LANES[S.l8Lane(shard)];
    assert.equal(def.job,'l8-pos1m');assert.equal(def.shard,shard);
    assert.deepEqual(def.fixed,['POS1M_STANDIN',`POS1M_RING1_${shard}`,'POS1M_PLANTED']);
    assert.deepEqual(Object.keys(def.steps),['pos1m_standin','pos1m_ring1','pos1m_planted']);
    assert.equal(S.laneArgOf(S.l8Lane(shard)),'L8-${{ matrix.shard }}');
  }
  ok();

  // 2. Never skipped: every route selects all three proofs of every shard.
  for(const route of [{profile:'X',tests:[],proofs:[],operations:false},{profile:'Y',tests:['a'],proofs:['P'],operations:true}])
    for(const lane of S.LANE_IDS.filter(S.isL8))assert.deepEqual(S.selectedFor(lane,route),S.LANES[lane].fixed);
  ok();

  // 3. Workflow: the exact commands (B4's slice: 20,000 stories from seed 1, shard K/3, 4 workers; planted 240 stories).
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  const job=gate.jobs['l8-pos1m'];
  assert.deepEqual(job.strategy.matrix.shard,[1,2,3]);assert.equal(job.strategy['fail-fast'],false);
  const step=id=>job.steps.find(s=>s.id===id);
  assert.equal(step('pos1m_standin').run,'node tests/pos1m/standin-contracts.cjs');
  assert.equal(step('pos1m_ring1').run,'node tests/pos1m/run.cjs --stories 20000 --seed 1 --shard ${{ matrix.shard }}/3 --workers 4 --quiet --out "$RUNNER_TEMP/pos1m-ring1-${{ matrix.shard }}.json"');
  assert.equal(step('pos1m_planted').run,'node tests/pos1m/planted.cjs --stories 240 --workers 4 --out "$RUNNER_TEMP/pos1m-planted-${{ matrix.shard }}.json"');
  for(const id of ['pos1m_standin','pos1m_ring1','pos1m_planted'])assert.ok(!step(id).if,`${id} always runs`);
  assert.ok(!job.steps.some(s=>/emulators|firebase|playwright|npm ci/i.test(String(s.run||''))),'Node only: no emulator, browser or install');
  assert.ok(gate.jobs.seal.needs.includes('l8-pos1m'));
  ok();

  // 4. Seal: green shards pass; a red, failed-step or missing shard fails closed.
  const head='c'.repeat(40),base='d'.repeat(40),runId=800;
  const route={profile:'L8_CONTRACT',tests:[],proofs:[],operations:false};
  const files=['README.md'];
  const needs=Object.fromEntries(Object.values(S.LANES).map(def=>[def.job,{result:'success'}]));
  const allSteps=lane=>Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
  const green=()=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,S.buildLaneRecord({lane,headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:allSteps(lane),...(S.isL7(lane)?{files,ironman:{verdict:'PASS',seed:1,seasons:3,attempts:[{exit:0}],replay:'x'}}:{})})]));
  const seal=extra=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha:base,baseRef:'gameplay/r100',files,prLiveHead:head,route,needs,lanes:green(),runId,runAttempt:1,...extra});
  assert.equal(seal({}).verdict,'PASS',JSON.stringify(seal({}).failures));
  for(const id of ['pos1m_standin','pos1m_ring1','pos1m_planted']){const lanes=green();lanes['L8-2']=S.buildLaneRecord({lane:'L8-2',headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'failure',steps:{...allSteps('L8-2'),[id]:{outcome:'failure'}}});assert.equal(seal({lanes}).verdict,'FAIL_TEST',`a red ${id} fails the seal`);}
  {const lanes=green();lanes['L8-3']=null;assert.equal(seal({lanes}).verdict,'FAIL_TEST','a missing shard fails the seal');}
  assert.equal(seal({needs:{...needs,'l8-pos1m':{result:'failure'}}}).verdict,'FAIL_TEST','a red shard makes the matrix job red');
  ok();

  console.log(`PASS Showdown Gate L8 POS1M: 3 shard jobs (20,000 stories), stand-in contracts and planted bugs in each, never skipped, the seal fails closed on a red or missing shard (${checks} groups).`);
}

module.exports=run;
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
