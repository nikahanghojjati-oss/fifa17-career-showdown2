'use strict';
// L10 League Roulette 3D (r100 Phoenix B1, lead 2026-11-26): the real 3D League Roulette in the Showdown Gate, WebGL on.
// Proves: one job (never a matrix); WebGL on for this audit ONLY (the shared Chromium runtime keeps --disable-webgl for every
// other lane); the same fail-closed route as the L7 legs; a skip passes the seal only when the seal's own recompute of the
// inputs agrees; a lane that ran must carry the audit's own report: both runs (Wooden and Graphite), WebGL on, no failure.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');
const root=path.resolve(__dirname,'../..');

async function run(){
  const S=await import(path.join(root,'scripts/showdown-gate.mjs'));
  const A=require(path.join(root,'tests/browser/r100-league-roulette-webgl-audit.cjs'));
  let checks=0;const ok=()=>{checks+=1;};

  // 1. The lane and the audit's two runs.
  assert.equal(S.L10_LANE,'L10');assert.ok(S.LANE_IDS.includes('L10'));
  assert.deepEqual(S.LANES.L10.fixed,['LEAGUE_ROULETTE_WEBGL']);assert.deepEqual(Object.keys(S.LANES.L10.steps),['league3d']);
  assert.equal(S.LANES.L10.job,'l10-league-3d');assert.equal(S.laneArgOf('L10'),'L10');
  assert.deepEqual(A.RUNS.map(r=>r.name),[...S.L10_RUNS]);
  assert.deepEqual(A.RUNS.map(r=>r.label),['Wooden','Graphite']);
  assert.deepEqual(A.RUNS.map(r=>r.clubhouse),['','matte'],'Graphite is the matte clubhouse key');
  const sizes=A.RUNS.flatMap(r=>[r.sizes.daniel,r.sizes.nik].map(v=>`${v.width}x${v.height}`));
  assert.deepEqual([...new Set(sizes)].sort(),['1920x866','390x844']);
  assert.notDeepEqual(A.RUNS[0].sizes.daniel,A.RUNS[1].sizes.daniel,'each manager plays both sizes across the two runs');
  ok();

  // 2. WebGL on for this audit only.
  const base=['--no-sandbox','--disable-webgl','--use-gl=disabled','--single-process','--disable-gpu','--use-angle=default','--font-render-hinting=none'];
  const on=A.webglArgs(base);
  assert.ok(!on.includes('--disable-webgl')&&!on.includes('--use-gl=disabled')&&!on.includes('--single-process')&&!on.includes('--disable-gpu')&&!on.includes('--use-angle=default'));
  for(const a of ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])assert.ok(on.includes(a),a);
  assert.ok(on.includes('--no-sandbox')&&on.includes('--font-render-hinting=none'),'the rest of the runtime args stay');
  const runtime=fs.readFileSync(path.join(root,'tests/support/chromium-runtime.cjs'),'utf8');
  assert.match(runtime,/chromiumBundle\.setGraphicsMode = false;/,'the shared runtime keeps WebGL off for every other lane');
  assert.ok(!/swiftshader"|use-angle/.test(runtime.replace(/swiftshader\.tar\.br/g,'')),'the shared runtime adds no GL switch');
  const audit=fs.readFileSync(path.join(root,'tests/browser/r100-league-roulette-webgl-audit.cjs'),'utf8');
  for(const kind of ['2d-wheel','old-plate','no-background','loading-back','blank','empty-board','no-webgl2','ctxloss.rebuild','ctxloss.restore','ctxloss.dead','ctxlost.never','ctxlost.dead'])assert.ok(audit.includes(`"${kind}"`),`the audit fails on ${kind}`);
  for(const beat of ['waiting','late-join','reload','ctxloss','ctxlost','ball4'])assert.ok(audit.includes(`beatNow="${beat}"`),`the audit plays the ${beat} beat`);
  assert.match(audit,/ENV_BOX_\[A-Z0-9_\]\*_V3/,'any ENV_BOX_*_V3 plate fails');
  // Run 45952036900: a frame while the HTML parser has made <body> but not yet the loading screen is not a blank screen; the
  // rules start once the loading screen is in the document or the HTML is parsed (never later).
  assert.ok(audit.includes('if(document.readyState==="loading"&&!document.getElementById("loadingScreen"))return;'),'the sampler starts at the loading screen or the end of parsing');
  ok();

  // 3. The route: the L7 legs' fail-closed rule.
  const d=(extra={})=>S.l10Decision({event:'pull_request',baseRef:'gameplay/r100',files:['README.md'],...extra});
  assert.equal(d().l10_run,false,'notes only: skipped');
  for(const files of [['tests/contracts/a-contracts.cjs'],['chronicle/v.html'],['gameplay/r100/x.md']])assert.equal(d({files}).l10_run,false,`${files[0]}: skipped`);
  for(const files of [['css/homeV10.css'],['js/leagueRouletteStep.js'],['js/leagueRouletteScene3d.js'],['visual-assets/v10_1/plates-hc/matte/x.webp'],['index.html'],['tests/browser/r100-league-roulette-webgl-audit.cjs'],['scripts/showdown-gate.mjs'],['brand-new/file.txt']])
    assert.equal(d({files}).l10_run,true,`${files[0]} runs L10`);
  for(const extra of [{event:'push'},{baseRef:'main'},{baseRef:null},{baseRef:''},{files:null},{files:[1]},{files:['']}])assert.equal(d(extra).l10_run,true,`fail-closed: ${JSON.stringify(extra)}`);
  const route={profile:'L10_CONTRACT',tests:[],proofs:[],operations:false};
  assert.deepEqual(S.selectedFor('L10',route),['LEAGUE_ROULETTE_WEBGL']);assert.deepEqual(S.selectedFor('L10',route,{l10Run:false}),[]);
  ok();

  // 4. Workflow: one job, route-conditioned steps, the audit's report handed to the lane record, the seal waits for it.
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  const job=gate.jobs['l10-league-3d'];
  assert.ok(job&&!job.strategy,'one job, never a matrix');assert.equal(job.name,'L10 League Roulette 3D');
  const step=id=>job.steps.find(s=>s.id===id);
  assert.equal(step('route').run,'node scripts/showdown-gate.mjs route --lane L10 --out "$RUNNER_TEMP/route.json" --github-output "$GITHUB_OUTPUT"');
  assert.equal(step('league3d').run,'node tests/browser/r100-league-roulette-webgl-audit.cjs');
  assert.equal(step('league3d').if,"steps.route.outputs.l10_run == 'true'");
  assert.equal(step('league3d').env.CMS_CHROMIUM_MULTI_CONTEXT,'1');
  assert.equal(job.steps.find(s=>/showdown-gate\.mjs finalize/.test(String(s.run||''))).run.trim(),'node scripts/showdown-gate.mjs finalize --lane L10 --route "$RUNNER_TEMP/route.json" --league3d test-results/r100-league-roulette-webgl.json --out "$RUNNER_TEMP/lane/lane.json"');
  assert.ok(!JSON.stringify(job).includes('secrets.'),'never production Firebase');
  assert.ok(!JSON.stringify(job).includes('CMS_CHROMIUM_PATH'),'the Gate\'s pinned Chromium, never another browser');
  assert.ok(gate.jobs.seal.needs.includes('l10-league-3d'));
  // No other lane turns WebGL on.
  for(const [id,other] of Object.entries(gate.jobs))if(id!=='l10-league-3d')assert.ok(!/r100-league-roulette-webgl-audit|use-angle=swiftshader/.test(JSON.stringify(other)),`${id} keeps WebGL off`);
  ok();

  // 5. Seal: a green run with its report passes; a verified skip passes; red, missing, unverified skip or a bad report fails.
  const head='c'.repeat(40),baseSha='d'.repeat(40),runId=901;
  const look=['README.md'],game=['js/leagueRouletteStep.js'];
  const needs=Object.fromEntries(Object.values(S.LANES).map(def=>[def.job,{result:'success'}]));
  const allSteps=lane=>Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]));
  const ring2Of=shard=>({stories:S.L9_STORIES,asked:S.L9_STORIES,firstSeed:S.l9Seed(shard),lastSeed:S.l9Seed(shard)+S.L9_STORIES-1,seedsOk:true,survived:S.L9_STORIES});
  const report=(over={})=>({verdict:'PASS',runs:S.L10_RUNS.map(name=>({name})),failures:[],chromium:{args:A.webglArgs(['--no-sandbox','--disable-webgl'])},...over});
  const record=(lane,files,extra={})=>S.buildLaneRecord({lane,headSha:head,baseSha,runId,runAttempt:1,route,jobStatus:'success',steps:allSteps(lane),files,
    ...(S.isL7(lane)?{ironman:{verdict:'PASS',seed:1,seasons:3,attempts:[{exit:0}],replay:'x'}}:{}),...(S.isL9(lane)?{ring2:ring2Of(S.LANES[lane].shard)}:{}),...(lane==='L10'?{league3d:report()}:{}),...extra});
  const green=files=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,record(lane,files)]));
  const seal=(files,extra)=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha,baseRef:'gameplay/r100',files,prLiveHead:head,route,needs,lanes:green(files),runId,runAttempt:1,...extra});
  {const r=seal(game,{});assert.equal(r.verdict,'PASS',JSON.stringify(r.failures));}
  // a verified skip (the other skipping lanes skip too on a notes-only PR)
  const skipAll=files=>{const lanes=green(files);
    for(const lane of S.LANE_IDS){
      if(lane==='L5')lanes[lane]=record(lane,files,{steps:{regression:{outcome:'skipped'},budget_sweep:{outcome:'skipped'}},l5Run:false,l5Reason:'x'});
      if(S.isL7(lane))lanes[lane]=record(lane,files,{steps:{ironman:{outcome:'skipped'},ring3:{outcome:'skipped'}},l7Run:false,l7Reason:'x',l7Heavy:false,ironman:null});
      if(S.isL9(lane))lanes[lane]=record(lane,files,{steps:{rules:{outcome:'skipped'},pos1m_ring2:{outcome:'skipped'}},l9Run:false,l9Reason:'x',ring2:null});
      if(lane==='L10')lanes[lane]=record(lane,files,{steps:{league3d:{outcome:'skipped'}},l10Run:false,l10Reason:S.l10Decision({event:'pull_request',baseRef:'gameplay/r100',files}).l10_reason,league3d:null});
    }return lanes;};
  {const r=seal(look,{lanes:skipAll(look)});assert.ok(!r.failures.some(f=>/^L10/.test(f)),JSON.stringify(r.failures));}
  {const lanes=green(game);lanes.L10=record('L10',game,{steps:{league3d:{outcome:'skipped'}},l10Run:false,l10Reason:'x',league3d:null});assert.equal(seal(game,{lanes}).verdict,'FAIL_TEST','a game change cannot skip L10');}
  for(const flag of [true,undefined,null,'false']){const lanes=skipAll(look);lanes.L10.l10_run=flag;const r=seal(look,{lanes});assert.ok(r.failures.some(f=>/^L10: the League Roulette 3D audit did not pass/.test(f)),`a skip needs an explicit boolean false (${flag})`);}
  {const lanes=skipAll(look);lanes.L10.files=[...look,'js/x.js'];const r=seal(look,{lanes});assert.ok(r.failures.some(f=>/^L10/.test(f)),'the recorded inputs must be the seal\'s inputs');}
  {const lanes=green(game);lanes.L10=record('L10',game,{jobStatus:'failure',steps:{league3d:{outcome:'failure'}}});assert.equal(seal(game,{lanes}).verdict,'FAIL_TEST','a red audit fails the seal');}
  {const lanes=green(game);lanes.L10=null;assert.equal(seal(game,{lanes}).verdict,'FAIL_TEST','a missing L10 record fails the seal');}
  assert.equal(seal(game,{needs:{...needs,'l10-league-3d':{result:'failure'}}}).verdict,'FAIL_TEST','a red job fails the seal');
  // a step that went green without the audit's own clean report proves nothing
  const bad=(league3d,label,pattern)=>{const lanes=green(game);lanes.L10=record('L10',game,{league3d});const r=seal(game,{lanes});assert.equal(r.verdict,'FAIL_TEST',label);if(pattern)assert.ok(r.failures.some(f=>pattern.test(f)),`${label}: ${JSON.stringify(r.failures)}`);};
  bad(null,'ran, no report',/no report/);
  bad(report({verdict:'FAIL'}),'a FAIL verdict',/verdict is FAIL/);
  bad(report({runs:[{name:'wooden'}]}),'only one run',/the lane needs/);
  bad(report({runs:[]}),'no run',/the lane needs/);
  bad(report({failures:[{id:'2d-wheel'}]}),'a failure in the report',/1 failure/);
  bad(report({chromium:{args:['--disable-webgl']}}),'WebGL off',/WebGL on/);
  bad(report({chromium:null}),'no runtime record',/WebGL on/);
  ok();

  console.log(`PASS Showdown Gate L10 League Roulette 3D: one job with WebGL on (SwiftShader) for this audit only, Wooden and Graphite at 1920x866 and 390x844, the L7 fail-closed route, verified skips, and the seal requires the audit's own clean report (${checks} groups).`);
}

module.exports=run;
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
