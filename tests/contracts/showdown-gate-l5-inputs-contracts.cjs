'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {readWorkflow}=require('../support/gha-workflow-parse.cjs');
const root=path.resolve(__dirname,'../..');

async function run(){
  const S=await import(path.join(root,'scripts/showdown-gate.mjs'));
  const css=['css/app.css','visual-assets/home/home.css'];
  const inputs=[
    'firestore.rules','firestore.spark.rules','firestore.new.fragment.rules','firebase.json','firebase.production.rules.json',
    'scripts/build-production-firestore-rules.mjs','scripts/check-rules.mjs','scripts/inject-persistent-pair-rules.mjs',
    'tests/firebase/new-emulator.cjs','tests/firebase/nested/matrix.cjs','tests/rules/new-contract.cjs',
    'data/transferOptions.js','package.json','package-lock.json','.github/workflows/showdown-gate.yml','scripts/showdown-gate.mjs',
    'tests/support/composed-production-rules.cjs','tests/fixtures/composed-production-rules/main-delta.json',
    '.github/workflows/deploy-firestore-rules-zero-billing.yml','.github/workflows/validate-gameplay-fast.yml',
    'js/sparkSharedSeasonCommit.js','tests/contracts/shared-career-start-contracts.cjs','service-worker.js','RELEASE_V1.9.1_R51.md'
  ];
  for(const glob of ['firestore*.rules','firestore.*.fragment.rules','firebase*.json','scripts/*firestore*','scripts/*rules*','scripts/inject-persistent-pair-rules.mjs','tests/firebase/**','tests/rules/**','data/transferOptions.js','package.json','package-lock.json','.github/workflows/showdown-gate.yml','scripts/showdown-gate.mjs'])assert.ok(S.L5_INPUTS.includes(glob),`required input glob: ${glob}`);
  assert.equal(S.l5Affected(css),false,'CSS-only diff does not feed L5');
  assert.equal(S.l5Affected([]),false);
  for(const file of inputs)assert.equal(S.l5Affected([...css,file]),true,`input family: ${file}`);
  for(const files of [null,undefined,'css/app.css',[null],['']])assert.equal(S.l5Affected(files),true,'unknown inputs fail closed');
  const decision=extra=>S.l5Decision({event:'pull_request',baseRef:'gameplay/bug-list-1',files:css,...extra});
  assert.equal(decision({}).l5_run,false);
  assert.match(decision({}).l5_reason,/non-main PR.*no L5 input changes/);
  for(const event of ['push','workflow_dispatch',undefined])assert.equal(decision({event}).l5_run,true);
  assert.equal(decision({baseRef:'main'}).l5_run,true);
  assert.equal(decision({baseRef:null}).l5_run,true);
  assert.equal(decision({files:inputs}).l5_run,true);

  const head='c'.repeat(40),base='b'.repeat(40),runId=100;
  const route={profile:'L5_INPUTS_CONTRACT',tests:[],proofs:[],operations:false};
  const needs=Object.fromEntries(Object.values(S.LANES).map(def=>[def.job,{result:'success'}]));
  const lanes=()=>Object.fromEntries(S.LANE_IDS.map(lane=>[lane,S.buildLaneRecord({lane,headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:Object.fromEntries(Object.keys(S.LANES[lane].steps).map(id=>[id,{outcome:'success'}]))})]));
  const skipped=()=>({...lanes(),L5:S.buildLaneRecord({lane:'L5',headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:{regression:{outcome:'skipped'}},l5Run:false,l5Reason:decision({}).l5_reason,files:css})});
  const seal=extra=>S.evaluateSeal({event:'pull_request',draft:false,headSha:head,baseSha:base,baseRef:'gameplay/bug-list-1',files:css,prLiveHead:head,route,needs,lanes:skipped(),runId,runAttempt:1,...extra});
  assert.deepEqual(skipped().L5.selected,[]);
  assert.deepEqual(skipped().L5.ran,[]);
  assert.deepEqual(skipped().L5.missing,[]);
  assert.equal(seal({}).verdict,'PASS','independently verified skip passes');
  assert.equal(seal({runAttempt:2}).verdict,'PASS','verified skip may carry within the same run');
  for(const files of inputs.map(file=>[file])){
    const records=skipped();records.L5.files=files;
    assert.equal(seal({files,lanes:records}).verdict,'FAIL_TEST',`seal rejects skipped input: ${files[0]}`);
  }
  for(const extra of [{event:'push'},{baseRef:'main'},{baseRef:null},{files:null},{files:[]},{lanes:{...skipped(),L5:null}},{needs:{...needs,'l5-rules-regression':{result:'skipped'}}}])assert.equal(seal(extra).verdict,'FAIL_TEST');
  for(const flag of [true,undefined,null,'false']){
    const records=skipped();records.L5.l5_run=flag;
    assert.equal(seal({lanes:records}).verdict,'FAIL_TEST','skip requires explicit boolean false');
  }
  for(const outcome of ['failure','cancelled','skipped']){
    const records=lanes();records.L5=S.buildLaneRecord({lane:'L5',headSha:head,baseSha:base,runId,runAttempt:1,route,jobStatus:'success',steps:{regression:{outcome}}});
    assert.equal(seal({lanes:records}).verdict,'FAIL_TEST',`${outcome} regression without a verified skip fails`);
  }
  assert.equal(seal({event:'push',files:inputs,lanes:lanes()}).verdict,'PASS','passed regression remains mandatory on push');
  assert.equal(seal({baseRef:'main',files:inputs,lanes:lanes()}).verdict,'PASS','passed regression works on main PRs');
  const foreign=skipped();foreign.L5.head_sha='d'.repeat(40);
  assert.equal(seal({lanes:foreign}).verdict,'FAIL_TEST','skip still binds exact head');

  const workflow=readWorkflow(root,'.github/workflows/showdown-gate.yml');
  const job=workflow.jobs['l5-rules-regression'];
  for(const step of job.steps.filter(step=>/setup-java|actions\/cache/.test(step.uses||'')||/^(?:Install |Fetch production main)/.test(step.label)||step.id==='regression'))assert.equal(step.if,"steps.route.outputs.l5_run == 'true'",`${step.label} uses the L5 decision`);
  assert.equal(job.steps.find(step=>step.id==='route').env.GATE_BASE_REF,'${{ github.event.pull_request.base.ref }}');
  for(const label of ['Record lane result','Upload lane record'])assert.equal(job.steps.find(step=>step.label===label).if,'always()');
  for(const step of workflow.jobs.seal.steps.filter(step=>/showdown-gate.mjs (?:route|seal)/.test(step.run||'')))assert.equal(step.env.GATE_BASE_REF,'${{ github.event.pull_request.base.ref }}');

  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gate-l5-contract-'));
  try{
    // Build unreferenced git trees with a scratch index; neither refs nor checkout files change.
    const gitEnv={...process.env,GIT_INDEX_FILE:path.join(temp,'index'),GIT_AUTHOR_NAME:'L5 contract',GIT_AUTHOR_EMAIL:'l5@example.invalid',GIT_COMMITTER_NAME:'L5 contract',GIT_COMMITTER_EMAIL:'l5@example.invalid'};
    const git=(args,input)=>{
      const result=spawnSync('git',args,{cwd:root,env:gitEnv,input,encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);return result.stdout.trim();
    };
    const blob=git(['hash-object','-w','--stdin'],'identical renamed input\n');
    const commit=file=>{
      git(['read-tree','--empty']);git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`]);
      return git(['commit-tree',git(['write-tree'])],'L5 diff fixture\n');
    };
    const rulesCommit=commit('firestore.rules'),cssCommit=commit('css/renamed.css');
    const renamed=S.changedFiles({event:'pull_request',baseSha:rulesCommit,headSha:cssCommit});
    assert.deepEqual(renamed,['css/renamed.css','firestore.rules']);
    assert.equal(S.l5Affected(renamed),true,'rename away from a Rules input still runs L5');
    assert.deepEqual(S.changedFiles({event:'push',beforeSha:rulesCommit,sha:cssCommit}),renamed);
    const actualHead=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
    const out=path.join(temp,'route.json'),outputs=path.join(temp,'outputs.txt'),laneOut=path.join(temp,'lane.json');
    const eventFile=path.join(temp,'event.json');
    fs.writeFileSync(eventFile,JSON.stringify({pull_request:{base:{ref:'gameplay/bug-list-1',sha:actualHead}}}));
    const env={...process.env,GITHUB_EVENT_PATH:eventFile,GATE_EVENT:'pull_request',GATE_BASE_SHA:actualHead,GATE_HEAD_SHA:actualHead,GATE_BASE_REF:'gameplay/bug-list-1',GATE_BEFORE_SHA:actualHead};
    for(const extra of [{},{GATE_EVENT:'push'},{GATE_BASE_REF:'main'}]){
      fs.writeFileSync(outputs,'');
      const r=spawnSync(process.execPath,['scripts/showdown-gate.mjs','route','--lane','L5','--out',out,'--github-output',outputs],{cwd:root,env:{...env,...extra},encoding:'utf8'});
      assert.equal(r.status,0,r.stderr);
      const expected=Object.keys(extra).length>0;
      assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).l5_run,expected);
      assert.match(fs.readFileSync(outputs,'utf8'),new RegExp(`^l5_run=${expected}$`,'m'));
      assert.match(fs.readFileSync(outputs,'utf8'),/^l5_reason=.+$/m);
      const f=spawnSync(process.execPath,['scripts/showdown-gate.mjs','finalize','--lane','L5','--route',out,'--out',laneOut],{cwd:root,env:{...env,GATE_JOB_STATUS:'success',GITHUB_RUN_ID:String(runId),GATE_RUN_ATTEMPT:'1',GATE_STEPS_JSON:JSON.stringify({regression:{outcome:expected?'success':'skipped'}})},encoding:'utf8'});
      assert.equal(f.status,0,f.stderr);
      const record=JSON.parse(fs.readFileSync(laneOut,'utf8'));
      assert.equal(record.l5_run,expected);assert.deepEqual(record.files,[]);assert.deepEqual(record.missing,[]);
      assert.equal(record.ran.includes('COMPOSED_RULES_REGRESSION'),expected);
    }
    assert.equal(S.baseRefFromEnv({GITHUB_EVENT_PATH:eventFile}),'gameplay/bug-list-1');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
  console.log(`PASS Showdown Gate L5 inputs: CSS-only skip, ${inputs.length} input examples, mandatory push/main runs, independent fail-closed seal, route/finalize CLI and workflow conditions.`);
}
module.exports=run;
if(require.main===module)run().catch(error=>{console.error(error);process.exit(1);});
