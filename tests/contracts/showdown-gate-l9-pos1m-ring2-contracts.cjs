'use strict';
// L9 POS1M Ring 2 (r100 Phoenix B1, lead 2026-11-25): POS1M Ring 2 inside the Showdown Gate.
// Proves: four shard jobs of 50 stories each (seeds 200000-200199, every length and Sacked first/middle/last/none), each on the
// Firestore emulator under the composed production Rules (built in the job); they run with the heavy set and whenever POS1M
// changes, fail-closed (any js/data/Rules/unclassified file, a PR into main, every push); a skipped shard passes the seal only
// when the seal's own recompute of the inputs agrees; a red, missing or unverified-skip shard fails it.
const assert=require('node:assert/strict');
const path=require('node:path');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');
const root=path.resolve(__dirname,'../..');

async function run(){
  const S=await import(path.join(root,'scripts/showdown-gate.mjs'));
  const R2=require(path.join(root,'tests/pos1m/ring2.cjs'));
  let checks=0;const ok=()=>{checks+=1;};

  // 1. Shards: four lane records in the one matrix job; 4 x 50 stories cover seeds 200000-200199 once each.
  assert.deepEqual([...S.L9_SHARDS],[1,2,3,4]);
  assert.deepEqual(S.LANE_IDS.filter(S.isL9),['L9-1','L9-2','L9-3','L9-4']);
  const seeds=S.L9_SHARDS.flatMap(shard=>Array.from({length:S.L9_STORIES},(_,i)=>S.l9Seed(shard)+i));
  assert.equal(S.L9_STORIES,50);assert.equal(seeds.length,200);assert.equal(new Set(seeds).size,200);
  assert.equal(Math.min(...seeds),200000);assert.equal(Math.max(...seeds),200199);
  // The sample covers every length and every Sacked spot in each shard (the rotation is 8 long; 50 stories hold it 6 times).
  for(const shard of S.L9_SHARDS){
    const plans=Array.from({length:S.L9_STORIES},(_,i)=>R2.ring2Plan(S.l9Seed(shard)+i));
    assert.deepEqual([...new Set(plans.map(p=>p.totalSeasons))].sort((a,b)=>a-b),[1,3,5,10],`shard ${shard} plays every length`);
    assert.deepEqual([...new Set(plans.map(p=>p.sack===null?'none':p.sack))].sort(),['first','last','middle','none'],`shard ${shard} sacks first, middle, last and never`);
  }
  for(const shard of S.L9_SHARDS){
    const def=S.LANES[S.l9Lane(shard)];
    assert.equal(def.job,'l9-pos1m-ring2');assert.equal(def.shard,shard);
    assert.deepEqual(def.fixed,['POS1M_RING2_RULES_BUILD',`POS1M_RING2_${shard}`]);
    assert.deepEqual(Object.keys(def.steps),['rules','pos1m_ring2']);
    assert.equal(S.laneArgOf(S.l9Lane(shard)),'L9-${{ matrix.shard }}');
  }
  ok();

  // 2. The decision: fail-closed like the L7 heavy set, plus any POS1M change.
  const d=(extra={})=>S.l9Decision({event:'pull_request',baseRef:'gameplay/r100',files:['README.md'],...extra});
  assert.equal(d().l9_run,false,'notes only: skipped');
  assert.equal(d({files:['css/homeV10.css']}).l9_run,false,'look-only: skipped');
  for(const files of [['js/onlineSync.js'],['data/players.json'],['firestore.spark.rules'],['scripts/build-production-firestore-rules.mjs'],['tests/pos1m/rules-model.cjs'],['tests/pos1m/ring2.cjs'],['brand-new/file.txt'],['css/a.css','js/b.js']])
    assert.equal(d({files}).l9_run,true,`${files.join(', ')} runs Ring 2`);
  for(const extra of [{event:'push'},{baseRef:'main'},{baseRef:null},{baseRef:''},{files:null},{files:[1]},{files:['']}])assert.equal(d(extra).l9_run,true,`fail-closed: ${JSON.stringify(extra)}`);
  const route={profile:'L9_CONTRACT',tests:[],proofs:[],operations:false};
  for(const lane of S.LANE_IDS.filter(S.isL9)){assert.deepEqual(S.selectedFor(lane,route),S.LANES[lane].fixed);assert.deepEqual(S.selectedFor(lane,route,{l9Run:false}),[]);}
  ok();

  // 3. Workflow: the exact commands, the route-conditioned steps, the emulator only, the seal waits for it.
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  const job=gate.jobs['l9-pos1m-ring2'];
  assert.deepEqual(job.strategy.matrix.shard,[1,2,3,4]);assert.equal(job.strategy['fail-fast'],false);
  const step=id=>job.steps.find(s=>s.id===id);
  assert.equal(step('route').run,'node scripts/showdown-gate.mjs route --lane L9-${{ matrix.shard }} --out "$RUNNER_TEMP/route.json" --github-output "$GITHUB_OUTPUT"');
  assert.equal(step('rules').run.trim(),'node scripts/build-production-firestore-rules.mjs\nnode scripts/build-production-firestore-rules-with-persistent-pair.mjs');
  assert.equal(step('pos1m_ring2').run,'npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-pos1m-ring2 "node tests/pos1m/ring2.cjs --stories $RING2_STORIES --seed $RING2_SEED --workers 4 --out $RUNNER_TEMP/pos1m-ring2-${{ matrix.shard }}.json"');
  assert.equal(step('pos1m_ring2').env.RING2_SEED,'${{ steps.route.outputs.seed }}');
  assert.equal(step('pos1m_ring2').env.RING2_STORIES,'${{ steps.route.outputs.stories }}');
  for(const id of ['rules','pos1m_ring2'])assert.equal(step(id).if,"steps.route.outputs.l9_run == 'true'",`${id} follows the verified route`);
  assert.ok(job.steps.some(s=>/firebase@12\.17\.1 @firebase\/rules-unit-testing@5\.0\.1 /.test(String(s.run||''))),'Ring 2 needs firebase@12.17.1 and @firebase/rules-unit-testing@5.0.1');
  assert.ok(!job.steps.some(s=>/playwright|chromium/i.test(String(s.run||''))),'Node and the emulator only: no browser');
  assert.ok(!JSON.stringify(job).includes('secrets.'),'never production Firebase');
  assert.ok(gate.jobs.seal.needs.includes('l9-pos1m-ring2'));
  ok();

  // 4. The route step's outputs: each shard's seed and story count, and the decision.
  {
    const {spawnSync}=require('node:child_process');
    const fs=require('node:fs');const os=require('node:os');
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'l9-route-'));
    const out=path.join(dir,'out.txt');
    const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
    const r=spawnSync(process.execPath,['scripts/showdown-gate.mjs','route','--lane','L9-3','--out',path.join(dir,'route.json'),'--github-output',out],{cwd:root,encoding:'utf8',env:{...process.env,GATE_EVENT:'push',GATE_HEAD_SHA:head,GATE_BEFORE_SHA:'0'.repeat(40)}});
    assert.equal(r.status,0,r.stderr);
    const flags=Object.fromEntries(fs.readFileSync(out,'utf8').trim().split('\n').map(line=>line.split('=')));
    assert.equal(flags.seed,'200100');assert.equal(flags.stories,'50');assert.equal(flags.l9_run,'true');
    fs.rmSync(dir,{recursive:true,force:true});
  }
  ok();

  // 5. Seal: green shards pass; a verified skip passes; a red, missing or unverified skip fails closed.
  const head='c'.repeat(40),base='d'.repeat(40),runId=900;
  const look=['README.md'],game=['js/onlineSync.js'];
  const needs=Object.fromEntries(Object.values(S.LANES).map(def=>[def.job,{result:'success'}]));
  const allSteps=lane=>Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
  // A shard's own Ring 2 report (what tests/pos1m/ring2.cjs writes with --out), as finalize reads it.
  const ring2Of=(shard,over={})=>({engine:'POS1M',ring:2,stories:S.L9_STORIES,asked:S.L9_STORIES,firstSeed:S.l9Seed(shard),lastSeed:S.l9Seed(shard)+S.L9_STORIES-1,seedsOk:true,survived:S.L9_STORIES,...over});
  const record=(lane,files,extra={})=>S.buildLaneRecord({lane,headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:allSteps(lane),files,...(S.isL7(lane)?{ironman:{verdict:'PASS',seed:1,seasons:3,attempts:[{exit:0}],replay:'x'}}:{}),...(S.isL9(lane)?{ring2:ring2Of(S.LANES[lane].shard)}:{}),...(lane===S.L10_LANE?{league3d:{verdict:'PASS',runs:S.L10_RUNS.map(name=>({name})),failures:[],chromium:{args:['--use-angle=swiftshader']}}}:{}),...extra});
  const green=files=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,record(lane,files)]));
  const skip=(lanes,files)=>{for(const lane of S.LANE_IDS.filter(S.isL9))lanes[lane]=record(lane,files,{steps:{rules:{outcome:'skipped'},pos1m_ring2:{outcome:'skipped'}},l9Run:false,l9Reason:S.l9Decision({event:'pull_request',baseRef:'gameplay/r100',files}).l9_reason});return lanes;};
  const seal=(files,extra)=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha:base,baseRef:'gameplay/r100',files,prLiveHead:head,route,needs,lanes:green(files),runId,runAttempt:1,...extra});
  assert.equal(seal(game,{}).verdict,'PASS',JSON.stringify(seal(game,{}).failures));
  assert.equal(seal(look,{lanes:skip(green(look),look)}).verdict,'PASS','a verified skip passes');
  assert.equal(skip(green(look),look)['L9-1'].l9_run,false);assert.deepEqual(skip(green(look),look)['L9-1'].selected,[]);
  assert.equal(seal(game,{lanes:skip(green(game),game)}).verdict,'FAIL_TEST','a game change cannot skip Ring 2');
  {const lanes=skip(green(look),look);lanes['L9-2'].files=[...look,'tests/pos1m/world.cjs'];assert.equal(seal([...look,'tests/pos1m/world.cjs'],{lanes}).verdict,'FAIL_TEST','a POS1M change cannot skip Ring 2');}
  for(const extra of [{event:'push'},{baseRef:'main'}])assert.equal(seal(look,{...extra,lanes:skip(green(look),look)}).verdict,'FAIL_TEST',`no skip: ${JSON.stringify(extra)}`);
  for(const flag of [true,undefined,null,'false']){const lanes=skip(green(look),look);lanes['L9-4'].l9_run=flag;assert.equal(seal(look,{lanes}).verdict,'FAIL_TEST','a skip needs an explicit boolean false');}
  {const lanes=skip(green(look),look);lanes['L9-1'].files=[...look,'js/x.js'];assert.equal(seal(look,{lanes}).verdict,'FAIL_TEST','the recorded inputs must be the seal\'s inputs');}
  for(const id of ['rules','pos1m_ring2']){const lanes=green(game);lanes['L9-2']=record('L9-2',game,{jobStatus:'failure',steps:{...allSteps('L9-2'),[id]:{outcome:'failure'}}});assert.equal(seal(game,{lanes}).verdict,'FAIL_TEST',`a red ${id} fails the seal`);}
  {const lanes=green(game);lanes['L9-3']=null;assert.equal(seal(game,{lanes}).verdict,'FAIL_TEST','a missing shard fails the seal');}
  {const lanes=green(game);lanes['L9-3']={...lanes['L9-3'],shard:2};assert.equal(seal(game,{lanes}).verdict,'FAIL_TEST','a shard must carry its own identity');}
  assert.equal(seal(game,{needs:{...needs,'l9-pos1m-ring2':{result:'failure'}}}).verdict,'FAIL_TEST','a red shard makes the matrix job red');
  ok();

  // 6. A shard that ran must have run its own 50 stories (Verify on #1627: "ran, 0 stories" passed the seal; --stories 0 or an
  // empty route output gave zero seeds and a green 0 === 0).
  const ranWith=(over,label)=>{const lanes=green(game);lanes['L9-2']=record('L9-2',game,{ring2:over===null?null:ring2Of(2,over)});const r=seal(game,{lanes});assert.equal(r.verdict,'FAIL_TEST',label);return r;};
  {const r=ranWith({stories:0,asked:0,firstSeed:undefined,lastSeed:undefined,seedsOk:true,survived:0},'ran, 0 stories');assert.ok(r.failures.some(f=>/L9-2: POS1M Ring 2 ran 0 of 0 stories/.test(f)),JSON.stringify(r.failures));}
  ranWith(null,'ran, but no shard report');
  ranWith({stories:49,asked:49,lastSeed:S.l9Seed(2)+48,survived:49},'ran fewer stories than the shard holds');
  ranWith({firstSeed:S.l9Seed(1),lastSeed:S.l9Seed(1)+S.L9_STORIES-1},'ran another shard\'s seeds');
  ranWith({seedsOk:false},'a lost or doubled seed');
  ranWith({survived:S.L9_STORIES-1},'a story that did not survive');
  {const r=seal(game,{});assert.equal(r.verdict,'PASS',JSON.stringify(r.failures));}
  // The finalize step hands the shard report to the lane record; ring2.cjs itself refuses to run zero stories.
  assert.equal(job.steps.find(s=>/showdown-gate\.mjs finalize/.test(String(s.run||''))).run.trim(),'node scripts/showdown-gate.mjs finalize --lane L9-${{ matrix.shard }} --route "$RUNNER_TEMP/route.json" --ring2 "$RUNNER_TEMP/pos1m-ring2-${{ matrix.shard }}.json" --out "$RUNNER_TEMP/lane/lane.json"');
  {
    const {spawnSync}=require('node:child_process');
    for(const argv of [['--stories','0'],['--stories',''],['--stories','-3'],['--stories','2.5'],['--seed','x']]){
      const r=spawnSync(process.execPath,['tests/pos1m/ring2.cjs',...argv],{cwd:root,encoding:'utf8',env:{...process.env,FIRESTORE_EMULATOR_HOST:''}});
      assert.equal(r.status,1,`ring2.cjs ${argv.join(' ')} must fail: ${r.stdout}${r.stderr}`);assert.match(r.stderr,/FAIL POS1M Ring 2: --stories must be/);
    }
  }
  ok();

  console.log(`PASS Showdown Gate L9 POS1M Ring 2: 4 shard jobs x 50 stories (seeds 200000-200199) on the emulator under the composed Rules, heavy set and POS1M changes, fail-closed, verified skips, the seal fails closed on a red, missing, unverified or short shard (${checks} groups).`);
}

module.exports=run;
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
