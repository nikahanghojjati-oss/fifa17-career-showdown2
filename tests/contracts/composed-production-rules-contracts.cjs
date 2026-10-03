'use strict';
// JOB-12 (G-12): offline contract for the composed production Rules. No Firebase, no emulator, no network,
// no write to the checkout (every composition runs in a temp dir). The emulator half is
// tests/firebase/composed-production-rules-regression.cjs, which reuses staticChecks() below.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const h=require('../support/composed-production-rules.cjs');
const zeroBilling=import('../../scripts/assert-firestore-zero-billing-boundary.mjs');

const RUNNER='tests/firebase/composed-production-rules-regression.cjs';
const GAP='tests/firebase/composed-rules-gap-emulator.cjs';
const ALLOWED_HOSTS=new Set(['https://oauth2.googleapis.com','https://www.googleapis.com','https://firebaserules.googleapis.com']);

function staticChecks(getCandidate){
  const artifact=()=>{const c=getCandidate();assert.ok(c,'candidate artifact missing');return c;};
  return [
    ['T4','the deploy gate ("Refuse generated Rules ...", every grep -Fq line) holds on the artifact',()=>{
      const m=h.deployModel();
      const needles=h.deployGateNeedles(m);
      const greps=(h.stepByName(m.job,h.GATE_STEP,'deploy').run.match(/^grep -Fq /gm)||[]).length;
      assert.equal(needles.length,greps,'every grep -Fq line must be parsed');
      assert.ok(needles.length>=40,`only ${needles.length} gate needles`);
      const text=artifact();
      for(const needle of needles)assert.ok(text.includes(needle),`deploy gate needle missing: ${needle}`);
      return `${needles.length} needles`;
    }],
    ['T5','zero billing and a Spark-only deploy path (deploy validators, billing-token census, publish hosts, config)',async()=>{
      const zb=await zeroBilling;
      const text=artifact();
      zb.assertRepositoryZeroBillingBoundary({root:h.ROOT});
      zb.assertTerminalCloseZeroBillingSource(text,'composed artifact');
      zb.assertStrictZeroBillingSource(h.readRepo(h.PAIR_FRAGMENT),h.PAIR_FRAGMENT);
      for(const [name,re] of h.BILLING_STRICT)assert.ok(!re.test(text),`artifact mentions ${name}`);
      const tokens=text.match(/[A-Za-z_]*billing[A-Za-z_]*/gi)||[];
      assert.ok(tokens.length>0&&tokens.every(t=>t==='billingRequired'),`billing tokens other than billingRequired: ${tokens.join(', ')}`);
      assert.ok(!/billingRequired\s*==\s*true/.test(text),'billingRequired == true');
      const hosts=new Set(h.readRepo('scripts/publish-firestore-rules-zero-billing.mjs').match(/https:\/\/[a-z0-9.-]+/g));
      for(const host of hosts)assert.ok(ALLOWED_HOSTS.has(host),`publish helper calls ${host}`);
      const cfg=JSON.parse(h.readRepo('firebase.production.rules.json'));
      assert.deepEqual(Object.keys(cfg).filter(k=>k!=='$schema'),['firestore']);
      assert.deepEqual(cfg.firestore,{rules:'firestore.spark.rules'});
      const deployText=h.readRepo(h.DEPLOY_WORKFLOW).split('\n').filter(l=>!/^\s*#/.test(l)).join('\n');
      for(const re of [/cloudfunctions/i,/run\.googleapis/i,/cloudbilling/i,/firebase deploy/i,/gcloud /i,/functions:/i])assert.ok(!re.test(deployText),`deploy workflow uses ${re}`);
      return `${tokens.length} billingRequired token(s), hosts ${[...hosts].join(' ')}`;
    }],
    ['T6','no broad grant: every list/delete/read/write is "if false", nothing is unconditional, deny-all closes the Rules',()=>`${h.assertNoBroadGrants(artifact(),'composed artifact')} allow statements`],
    ['T7','career index Phase A is shipped; Phase B is exactly a one-line constant flip',()=>{
      const text=artifact();
      assert.equal(h.careerIndexPhase(text),'A');
      const b=h.flipToPhaseB(text);
      assert.equal(h.careerIndexPhase(b),'B');
      const mark='/*CMS_CAREER_INDEX_ENFORCED*/';
      assert.equal(text.replace(/function cmsCareerIndexEnforced\(\) \{\s*return false;\s*\}/,mark),b.replace('function cmsCareerIndexEnforced() { return true; }',mark),'Phase B differs from Phase A only in the constant');
      return 'Phase A';
    }],
    ['T8','completed-only grant is get-only on exactly four lines, and candidate minus the reviewed delta is production main',()=>{
      const text=artifact();
      assert.equal((text.match(/cmsCompletedShowdownReadable\(rivalryId\)/g)||[]).length,3);
      assert.equal((text.match(/cmsCompletedSeasonReadable\(rivalryId, seasonId\)/g)||[]).length,4);
      for(const s of h.allowStatements(text)){
        if(/cmsCompleted/.test(s.condition))assert.deepEqual(s.methods,['get'],`completed grant on ${s.methods.join(',')}`);
        if(/cmsCareerIndex/.test(s.condition))assert.ok(s.methods.every(x=>['get','create','update'].includes(x)),`career index grant on ${s.methods.join(',')}`);
      }
      const delta=h.loadDelta();
      assert.equal(delta.schemaVersion,1);
      const cand=h.identity(text);
      assert.equal(cand.sha256,delta.candidate.sha256,'composed artifact changed since the delta was reviewed: regenerate with --print-main-delta and review');
      const main=h.identity(h.reverseApply(text,delta.hunks));
      assert.deepEqual({sha256:main.sha256,gitBlobSha1:main.gitBlobSha1,bytes:main.bytes},{sha256:delta.productionMain.sha256,gitBlobSha1:delta.productionMain.gitBlobSha1,bytes:delta.productionMain.bytes});
      let last=0;
      for(const hunk of delta.hunks){
        assert.ok(delta.allowedOwners.includes(hunk.owner),`hunk owner ${hunk.owner}`);
        assert.ok(typeof hunk.why==='string'&&hunk.why.length>20,'every hunk says why');
        assert.ok(hunk.candidateLine>last,'hunks ascend');last=hunk.candidateLine+hunk.added.length-1;
        for(const line of hunk.removed)assert.ok(!/allow\s+(create|update|list|delete|read|write)/.test(line),`delta removes a non-get rule: ${line}`);
        for(const line of hunk.added){
          for(const [name,re] of h.BILLING_STRICT)assert.ok(!re.test(line),`delta adds ${name}`);
          assert.ok(!/billing/i.test(line),'delta adds a billing token');
          const m=line.match(/allow\s+([a-z, ]+?)\s*:/);
          if(!m)continue;
          const methods=m[1].split(',').map(x=>x.trim());
          if(methods.some(x=>['list','delete','read','write'].includes(x)))assert.ok(/:\s*if false;\s*$/.test(line),`delta adds a list/delete grant: ${line}`);
          if(methods.some(x=>['create','update'].includes(x)))assert.ok(hunk.owner.split('+').includes('G-7'),`only the reviewed G-7 career index block may add write rules: ${line}`);
        }
      }
      return `${delta.hunks.length} hunks, -${delta.hunks.reduce((a,x)=>a+x.removed.length,0)} +${delta.hunks.reduce((a,x)=>a+x.added.length,0)} lines vs main ${delta.productionMain.commit.slice(0,7)}`;
    }]
  ];
}
module.exports=Object.freeze({staticChecks});

async function run(){
  let n=0;
  const ok=(id,label,detail)=>{n+=1;process.stdout.write(`ok ${n} ${id} ${label}${detail?` :: ${detail}`:''}\n`);};
  let candidate=null;
  const m=h.deployModel();
  assert.deepEqual(m.job.steps.map(s=>s.name),[...h.DEPLOY_STEP_NAMES],'deploy workflow steps changed: review before updating DEPLOY_STEP_NAMES');
  assert.equal(m.workflow.env.FIREBASE_RULES_FILE,h.ARTIFACT);
  assert.equal(m.workflow.env.FIREBASE_CONFIG_FILE,'firebase.production.rules.json');
  assert.deepEqual(m.buildCommands,['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']);
  assert.equal(h.stepByName(m.job,h.PUBLISH_STEP,'deploy').run,'node scripts/publish-firestore-rules-zero-billing.mjs');
  ok('T1','deploy workflow steps, env and build commands are the reviewed ones',`${m.job.steps.length} steps`);
  const before=fs.existsSync(path.join(h.ROOT,h.ARTIFACT))?fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),'utf8'):null;
  const a=h.composeCandidate(),b=h.composeCandidate();
  assert.equal(a,b,'composition must be deterministic');
  const after=fs.existsSync(path.join(h.ROOT,h.ARTIFACT))?fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),'utf8'):null;
  assert.equal(after,before,'the contract must not touch the checkout artifact');
  candidate=a;
  const id=h.identity(a);
  ok('T2','temp composition with the deploy workflow\'s own build commands is deterministic',`sha256 ${id.sha256} gitBlob ${id.gitBlobSha1} ${id.bytes} bytes`);
  for(const [cid,label,fn] of staticChecks(()=>candidate))ok(cid,label,await fn());

  const fast=h.parseWorkflow(h.readRepo(h.FAST_WORKFLOW),h.FAST_WORKFLOW);
  const rules=fast.jobs['rules-emulator'];
  assert.ok(rules,'rules-emulator job');
  const buildIdx=rules.steps.findIndex(s=>s.name==='Build the composed production Rules');
  const firstEmu=rules.steps.findIndex(s=>/emulators:exec/.test(s.run||''));
  assert.ok(buildIdx>=0&&buildIdx<firstEmu,'rules-emulator builds before its first emulator step');
  assert.deepEqual(rules.steps[buildIdx].run.split('\n').filter(l=>/^node scripts\/build-/.test(l)),m.buildCommands.map(c=>`node ${c}`));
  ok('C1','fast CI rules-emulator composes with exactly the deploy workflow\'s build commands before any emulator step');

  const job=fast.jobs['composed-rules-regression'];
  assert.ok(job,'validate-gameplay-fast.yml needs the composed-rules-regression job');
  const runs=job.steps.map(s=>s.run||'').join('\n');
  assert.ok(/git fetch --no-tags --depth=1 origin \+refs\/heads\/main:refs\/remotes\/origin\/main/.test(runs),'job fetches production main');
  const emu=job.steps.filter(s=>/emulators:exec/.test(s.run||''));
  assert.equal(emu.length,1,'one emulators:exec runs the whole matrix');
  assert.ok(emu[0].run.endsWith(`"node ${RUNNER}"`),`the step runs ${RUNNER}`);
  ok('C2','fast CI has one composed-rules-regression job: fetch main, run the whole matrix in one emulators:exec');

  const runner=require(`../../${RUNNER}`);
  const suites=runner.discoverSuites();
  const files=new Set(suites.map(s=>`${s.envs} ${s.file}`.trim()));
  const deploySuites=runner.suitesFromSteps(m.job.steps,'deploy');
  const fastSuites=runner.suitesFromSteps(rules.steps,'fast CI');
  assert.ok(deploySuites.length>=5&&fastSuites.length>=8,'suite discovery parsed the workflows');
  for(const s of [...deploySuites,...fastSuites])assert.ok(files.has(`${s.envs} ${s.file}`.trim()),`regression must run ${s.envs} ${s.file}`);
  assert.ok(suites.some(s=>s.file===GAP),'gap suite runs');
  for(const base of runner.BASE_SUITES){
    const src=h.readRepo(base);
    assert.equal((src.match(/fs\.readFileSync\(["']firestore\.spark\.rules["'],\s*["']utf8["']\)/g)||[]).length,1,`${base} exposes one base-Rules seam`);
  }
  assert.deepEqual(runner.BUDGET_ALLOWED.map(x=>`${x.file}#${x.caseId}`),['tests/firebase/career-index-emulator.cjs#D13']);
  ok('C3','the regression runs every deploy and fast-CI emulator proof, both base suites and the gap suite',`${suites.length} suites`);

  process.stdout.write(`PASS composed production Rules contracts: ${n} numbered checks (deploy workflow, deterministic composition ${id.sha256.slice(0,12)}, deploy gate, zero billing, no broad grants, career index Phase A, reviewed delta from production main, CI wiring).\n`);
}
if(require.main===module)run().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
