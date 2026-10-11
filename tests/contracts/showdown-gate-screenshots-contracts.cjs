'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');
const root=path.resolve(__dirname,'../..');
const LABELS=['Capture changed screen screenshots','Upload changed screen screenshots'];

// The only non-blocking lane steps are this exact pair of optional evidence steps.
function assertScreenshotEvidence(step,lane){
  assert.equal(lane,'L3B');
  assert.ok(LABELS.includes(step.label));
  assert.equal(step.if,'always()');
  assert.equal(step['continue-on-error'],true);
  assert.equal(step.id,undefined,'evidence must not acquire a recorded proof id');
  if(step.label===LABELS[0]){
    assert.equal(step.run,'node scripts/gate-screenshots.mjs --route "$RUNNER_TEMP/route.json"');
    assert.equal(step['timeout-minutes'],10);
  }else{
    assert.equal(step.uses,'actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9');
    assert.equal(step.with.path,'gate-shots/');
    assert.equal(step.with.name,'showdown-gate-shots-L3B');
    assert.equal(step.with['if-no-files-found'],'ignore');
  }
}

async function run(){
  const shots=await import(path.join(root,'scripts/gate-screenshots.mjs'));
  assert.deepEqual(shots.VIEWPORTS.map(v=>`${v.width}x${v.height}`),['360x640','390x844','768x1024','1366x768','1920x1080']);
  for(const file of fs.readdirSync(path.join(root,'css')).filter(file=>/V10\.css$/.test(file))){
    assert.ok(shots.screensForFiles([`css/${file}`]).length,`${file} must map to at least one screen`);
  }
  for(const file of fs.readdirSync(path.join(root,'js')).filter(file=>/V10.*\.js$/.test(file))){
    assert.ok(shots.screensForFiles([`js/${file}`]).length,`${file} must map to at least one screen`);
  }
  assert.deepEqual(shots.screensForFiles(['css/homeV10.css','js/homeScreensV10.js','README.md']),['mainMenu']);
  assert.deepEqual(shots.screensForFiles(['css/rulesSettingsV10.css']),['ruleBook','settingsOverlay']);
  assert.deepEqual(shots.screensForFiles(['css/rivalryLegacyV10.css','js/rivalryLegacyV10Markup.js']),['legacy','statistics']);
  assert.deepEqual(shots.screensForFiles(['README.md','css/app.css','other/css/homeV10.css']),[]);
  const gate=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  const steps=gate.jobs.l3b.steps;
  const evidence=steps.filter(step=>LABELS.includes(step.label));
  assert.deepEqual(evidence.map(step=>step.label),LABELS);
  for(const step of evidence)assertScreenshotEvidence(step,'L3B');
  assert.ok(steps.indexOf(evidence[0])>steps.findIndex(step=>step.label==='Upload lane record'),'lane result must already be recorded/uploaded');
  const lib=await import(path.join(root,'scripts/showdown-gate.mjs'));
  assert.deepEqual(lib.LANES.L3B.steps,{proof_visual:['@group:VISUAL']},'screenshots never become required proofs');
  const route={profile:'visual',tests:[],proofs:[],operations:false};
  const base={lane:'L3B',headSha:'a'.repeat(40),route,steps:{proof_visual:{outcome:'success'}},jobStatus:'success'};
  assert.deepEqual(lib.buildLaneRecord({...base,steps:{...base.steps,screenshots:{outcome:'failure'}}}),lib.buildLaneRecord(base),'evidence outcomes do not alter lane records');
  const source=fs.readFileSync(path.join(root,'scripts/gate-screenshots.mjs'),'utf8');
  assert.match(source,/serviceWorkers:'block'/);
  assert.match(source,/context\.route\('\*\*\/\*'/);
  assert.match(source,/route\.abort\(\)/,'external HTTP requests stay offline');
  assert.match(source,/routeWebSocket/,'external sockets stay offline');
  const empty=await shots.captureScreenshots({files:['README.md'],out:'work/unused-gate-shots'});
  assert.deepEqual(empty.shots,[],'unrelated diffs do not need Playwright or a server');
  console.log('PASS Showdown Gate screenshot contracts: complete V10 file map, five viewports, offline capture, non-blocking evidence and unchanged lane records');
}
module.exports={run,assertScreenshotEvidence,LABELS};
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
