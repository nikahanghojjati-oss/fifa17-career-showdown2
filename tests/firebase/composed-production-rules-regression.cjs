"use strict";
// JOB-12 (G-12): composed production Rules regression. Run inside ONE emulators:exec (firestore only):
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-composed \
//     "node tests/firebase/composed-production-rules-regression.cjs"
// It (T) proves the artifact every suite reads is byte-identical to what the deploy workflow would publish and
// differs from production main only by the reviewed delta, (S) runs every composed-Rules emulator suite that CI
// and the deploy workflow run, plus two base-Rules suites redirected to the composed artifact and the G-12 gap
// suite, (B) re-runs the Phase-B-ready suites on a temp copy with the career index enforced, (E) applies the
// qualified 1,000-expression gate to every log, and (M) prints the promise matrix. One `ok <n> <id> <label>`
// line per check. Exit 1 on any failure; nothing is skipped.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const Module=require("node:module");
const {spawnSync}=require("node:child_process");
const h=require("../support/composed-production-rules.cjs");

const GAP_SUITE="tests/firebase/composed-rules-gap-emulator.cjs";
const SELF="tests/firebase/composed-production-rules-regression.cjs";
// Base-Rules suites (they read firestore.spark.rules) that hold on the composed artifact unchanged.
// stage3/stage4 pairing suites cannot: their positive cases pair without the persistent-pair witness, which the
// composed Rules deny by design (persistent pair matrix "witness-less create/redeem denial"); the gap suite
// re-proves their denials instead.
const BASE_SUITES=Object.freeze(["tests/firebase/spark-account-bootstrap-emulator.cjs","tests/firebase/stage4-mutation-rate-limit-emulator.cjs"]);
// Suites that must also pass with cmsCareerIndexEnforced() flipped to true in a temp copy (Phase B readiness).
// The career index suite flips in memory itself (CMS_CAREER_INDEX_ENFORCED=1) and is not repeated here.
const PHASE_B_FILES=Object.freeze(new Set([
  "tests/firebase/shared-showdown-setup-production-provider-emulator.cjs",
  "tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs",
  "tests/firebase/shared-terminal-close-production-provider-emulator.cjs",
  "tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs",
  "tests/firebase/two-manager-journey-emulator.cjs",
  "tests/firebase/completed-showdown-read-emulator.cjs",
  "tests/firebase/completed-transfer-history-emulator.cjs",
  GAP_SUITE
]));
const PHASE_B_LIFECYCLE="CMS_SHOWDOWN_LENGTH=1";
// Qualified expression-budget gate: the phrase may appear only right before these denial cases.
const BUDGET_ALLOWED=Object.freeze([{file:"tests/firebase/career-index-emulator.cjs",caseId:"D13",why:"stranger cannot create an index naming a rivalry they are not in (expected denial)"}]);
const LABELS=Object.freeze({
  "tests/firebase/shared-showdown-setup-production-provider-emulator.cjs":"Shared Setup provider matrix",
  "tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs":"Transfer fresh-session recovery",
  "tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs":"Gameplay lifecycle",
  "tests/firebase/shared-terminal-close-production-provider-emulator.cjs":"Terminal Close matrix",
  "tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs":"Persistent Nik and Daniel pair matrix",
  "tests/firebase/two-manager-journey-emulator.cjs":"Two-manager journey",
  "tests/firebase/career-index-emulator.cjs":"Career index matrix",
  "tests/firebase/completed-showdown-read-emulator.cjs":"Completed-only read matrix",
  "tests/firebase/completed-transfer-history-emulator.cjs":"Completed transfer history matrix (G-10)",
  "tests/firebase/closed-showdown-adapter-emulator.cjs":"Closed-Showdown adapter journey (G-9, when merged)",
  "tests/firebase/spark-account-bootstrap-emulator.cjs":"Spark account bootstrap (base suite on composed Rules)",
  "tests/firebase/stage4-mutation-rate-limit-emulator.cjs":"Stage 4 mutation rate limit (base suite on composed Rules)",
  [GAP_SUITE]:"G-12 gap suite (list/delete sweep, private scope, exact ACTIVE)"
});
// Promise matrix: each promise passes only if every evidence item passed. Evidence: suite file (any run of it)
// or a T/B/E check id from this runner.
const PROMISES=Object.freeze([
  ["M1","exactly two managers, Daniel = playerOne, Nik = playerTwo",["tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/shared-showdown-setup-production-provider-emulator.cjs","tests/firebase/shared-terminal-close-production-provider-emulator.cjs",GAP_SUITE]],
  ["M2","private scope: own-account documents, rival's unfinished inputs hidden",[GAP_SUITE,"tests/firebase/spark-account-bootstrap-emulator.cjs","tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/career-index-emulator.cjs","tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs","tests/firebase/completed-showdown-read-emulator.cjs"]],
  ["M3","pairing plus exact ACTIVE before league/club authority",[GAP_SUITE,"tests/firebase/shared-showdown-setup-production-provider-emulator.cjs","tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs"]],
  ["M4","no list, no delete",["T6",GAP_SUITE,"tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/career-index-emulator.cjs","tests/firebase/completed-showdown-read-emulator.cjs"]],
  ["M5","career index: Phase A shipped, Phase B ready",["T7","tests/firebase/career-index-emulator.cjs","B*"]],
  ["M6","completed-only reads",["T8","tests/firebase/completed-transfer-history-emulator.cjs","tests/firebase/completed-showdown-read-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs"]],
  ["M7","abandoned, stranger and forged denials",["tests/firebase/completed-transfer-history-emulator.cjs","tests/firebase/completed-showdown-read-emulator.cjs","tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/shared-terminal-close-production-provider-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs",GAP_SUITE]],
  ["M8","Terminal Close",["tests/firebase/shared-terminal-close-production-provider-emulator.cjs","tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs"]],
  ["M9","1,000-expression budget (qualified gate)",["E1","tests/firebase/shared-terminal-close-production-provider-emulator.cjs","tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"]],
  ["M10","write abuse limits and idempotency",["tests/firebase/stage4-mutation-rate-limit-emulator.cjs","tests/firebase/shared-showdown-setup-production-provider-emulator.cjs","tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs"]],
  ["M11","zero billing, Spark-only deploy path",["T5"]],
  ["M12","exact deploy artifact, reviewed delta from production main",["T1","T2","T3","T4","T8","T9","T10"]]
]);

// Parse every `emulators:exec ... "<cmd>"` in a job's steps into individual {envs, file} node invocations.
function suitesFromSteps(steps,label){
  const out=[];
  for(const step of steps){
    if(!step.run||!/emulators:exec\b/.test(step.run))continue;
    const m=step.run.match(/emulators:exec\b.*?"([^"]+)"\s*$/);
    if(!m)throw new Error(`${label}: cannot parse emulator step "${step.name}"`);
    for(const part of m[1].split("&&").map(s=>s.trim())){
      const p=part.match(/^((?:[A-Z_]+=[^\s]+\s+)*)node (tests\/firebase\/[a-z0-9-]+\.cjs)$/);
      if(!p)throw new Error(`${label}: cannot parse emulator command "${part}" in step "${step.name}"`);
      out.push({envs:p[1].trim(),file:p[2],source:`${label}: ${step.name}`});
    }
  }
  return out;
}
function discoverSuites(){
  const fast=h.parseWorkflow(h.readRepo(h.FAST_WORKFLOW),h.FAST_WORKFLOW);
  if(!fast.jobs["rules-emulator"])throw new Error("validate-gameplay-fast.yml: rules-emulator job missing");
  const deploy=h.deployModel();
  const all=[...suitesFromSteps(fast.jobs["rules-emulator"].steps,"fast CI"),...suitesFromSteps(deploy.job.steps,"deploy")];
  for(const file of BASE_SUITES)all.push({envs:"",file,source:"G-12 base suite on composed Rules",base:true});
  all.push({envs:"",file:GAP_SUITE,source:"G-12 gap suite"});
  const seen=new Map();
  for(const s of all){const key=`${s.envs} ${s.file}`;if(!seen.has(key))seen.set(key,s);}
  // A future deploy step may run this runner; it never runs itself.
  return [...seen.values()].filter(s=>s.file!==SELF);
}

function bash(script,{cwd,env,logFd}){
  return spawnSync("bash",["-e","-o","pipefail","-c",script],{cwd,env,stdio:["ignore",logFd,logFd]});
}
function runSuite(suite,{cwd,logPath}){
  const fd=fs.openSync(logPath,"w");
  const env={...process.env};
  for(const pair of suite.envs.split(/\s+/).filter(Boolean)){const [k,v]=pair.split("=");env[k]=v;}
  const args=suite.base?[path.join(cwd,SELF),"--base-suite",suite.file]:[path.join(cwd,suite.file)];
  const r=spawnSync(process.execPath,args,{cwd,env,stdio:["ignore",fd,fd],timeout:15*60*1000});
  fs.closeSync(fd);
  const text=fs.readFileSync(logPath,"utf8");
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  const pass=[...lines].reverse().find(l=>/^PASS\b/.test(l)||/proof passed/.test(l))||"";
  return {status:r.status,error:r.error,text,pass};
}
function tail(text,count=30){return text.split("\n").slice(-count).join("\n");}

// Qualified gate: every "maximum of 1000 expressions" must be followed (before the next case line) by an
// allowed denial case of the same suite. Suites without numbered cases may never show the phrase.
function budgetFindings(file,text){
  const lines=text.split("\n"),found=[];
  for(let i=0;i<lines.length;i++){
    if(!lines[i].includes("maximum of 1000 expressions"))continue;
    let caseId=null;
    for(let j=i+1;j<lines.length;j++){const m=lines[j].match(/^(?:not )?ok \d+ (\S+)/);if(m){caseId=m[1];break;}}
    const allowed=BUDGET_ALLOWED.some(a=>a.file===file&&a.caseId===caseId);
    found.push({file,caseId,allowed});
  }
  return found;
}

function baseSuiteMode(file){
  const absolute=path.resolve(file);
  const source=fs.readFileSync(absolute,"utf8");
  const seam=/fs\.readFileSync\(["']firestore\.spark\.rules["'],\s*["']utf8["']\)/g;
  assert.equal((source.match(seam)||[]).length,1,`${file} must expose exactly one base-Rules source seam`);
  assert.ok(fs.existsSync(h.ARTIFACT),"composed Rules must exist");
  const child=new Module(absolute,module);
  child.filename=absolute;
  child.paths=Module._nodeModulePaths(path.dirname(absolute));
  child._compile(source.replace(seam,`fs.readFileSync(${JSON.stringify(h.ARTIFACT)},"utf8")`),absolute);
}

async function main(){
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error("run inside firebase emulators:exec --only firestore");
  const mainRef=process.env.CMS_PRODUCTION_MAIN_REF||"origin/main";
  const logDir=fs.mkdtempSync(path.join(os.tmpdir(),"cms-g12-logs-"));
  let n=0;const failures=[];const passed=new Set();const runs=[];
  const emit=(id,label,ok,detail)=>{n+=1;process.stdout.write(`${ok?"ok":"not ok"} ${n} ${id} ${label}${detail?` :: ${detail}`:""}\n`);if(ok)passed.add(id);else failures.push(id);};
  const tcheck=async(id,label,fn)=>{try{const d=await fn();emit(id,label,true,d);}catch(e){emit(id,label,false,String(e&&e.message||e).split("\n")[0]);}};

  // T: artifact identity and provenance.
  let candidate=null;
  await tcheck("T1","deploy workflow steps, env and build commands are the reviewed ones",()=>{
    const m=h.deployModel();
    assert.deepEqual(m.job.steps.map(s=>s.name),[...h.DEPLOY_STEP_NAMES]);
    assert.equal(m.workflow.env.FIREBASE_RULES_FILE,h.ARTIFACT);
    assert.equal(m.workflow.env.FIREBASE_CONFIG_FILE,"firebase.production.rules.json");
    assert.deepEqual(m.buildCommands,["scripts/build-production-firestore-rules.mjs","scripts/build-production-firestore-rules-with-persistent-pair.mjs"]);
    assert.equal(h.stepByName(m.job,h.PUBLISH_STEP,"deploy").run,"node scripts/publish-firestore-rules-zero-billing.mjs");
    return `${m.job.steps.length} steps`;
  });
  await tcheck("T2","temp composition with the deploy workflow's own build commands is deterministic",()=>{
    const a=h.composeCandidate(),b=h.composeCandidate();
    assert.equal(a,b);candidate=a;const id=h.identity(a);
    return `sha256 ${id.sha256} gitBlob ${id.gitBlobSha1} ${id.bytes} bytes`;
  });
  await tcheck("T3","deploy-path replay in this checkout (build, pair build, gate, deploy contracts) leaves the byte-identical artifact",()=>{
    assert.ok(candidate,"T2 must pass first");
    const m=h.deployModel();
    const env={...process.env,...m.workflow.env};
    for(const name of h.REPLAY_STEPS){
      const logPath=path.join(logDir,`replay-${name.replace(/[^a-z0-9]+/gi,"-")}.log`);
      const fd=fs.openSync(logPath,"w");const r=bash(h.stepByName(m.job,name,"deploy").run,{cwd:h.ROOT,env,logFd:fd});fs.closeSync(fd);
      if(r.status!==0)throw new Error(`deploy step "${name}" failed (${r.status}); log ${logPath}:\n${tail(fs.readFileSync(logPath,"utf8"),15)}`);
    }
    const replayed=fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8");
    assert.equal(h.sha256(replayed),h.sha256(candidate),"the deploy path published bytes differ from the fresh composition");
    return `gitBlob ${h.gitBlobSha1(replayed)} (= PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS value at the next deploy)`;
  });
  for(const [id,label,fn] of staticChecksFor(()=>candidate))await tcheck(id,label,fn);
  await tcheck("T9","production main composed with main's own deploy workflow and scripts equals the reviewed pin",()=>{
    assert.ok(candidate,"T2 must pass first");
    if(!h.gitRefExists(mainRef))throw new Error(`${mainRef} missing: git fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main`);
    const delta=h.loadDelta();
    const mainText=h.composeFromRef(mainRef);
    const id=h.identity(mainText);
    assert.equal(id.sha256,delta.productionMain.sha256,`${mainRef} (${h.gitRefCommit(mainRef)}) now composes different Rules than the reviewed pin ${delta.productionMain.commit}: re-review the delta`);
    assert.ok(h.sameHunks(h.diffLines(mainText,candidate),delta.hunks),"live diff from production main differs from the reviewed delta");
    return `${mainRef} ${h.gitRefCommit(mainRef).slice(0,7)} sha256 ${id.sha256.slice(0,12)} gitBlob ${id.gitBlobSha1}`;
  });
  await tcheck("T10","production main's deploy workflow is the one this checkout reviewed (same steps and build commands)",()=>{
    const mainDeploy=h.gitRefReader(mainRef)(h.DEPLOY_WORKFLOW);
    assert.ok(mainDeploy!==null,`${mainRef} deploy workflow unreadable`);
    const m=h.deployModel(mainDeploy);
    assert.deepEqual(m.job.steps.map(s=>s.name),[...h.DEPLOY_STEP_NAMES]);
    assert.deepEqual(m.buildCommands,h.deployModel().buildCommands);
    return mainDeploy===h.readRepo(h.DEPLOY_WORKFLOW)?"byte-identical":"same steps (text differs)";
  });
  if(!candidate){process.stdout.write("FAIL composed production Rules regression: no candidate artifact\n");process.exit(1);}

  // S: every composed suite on the deploy artifact (Phase A, as shipped).
  const suites=discoverSuites();
  let k=0;
  for(const suite of suites){
    k+=1;const id=`S${k}`;
    const label=`${LABELS[suite.file]||`unmapped composed suite ${suite.file}`}${suite.envs?` (${suite.envs})`:""}`;
    const before=h.sha256(fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8"));
    const result=runSuite(suite,{cwd:h.ROOT,logPath:path.join(logDir,`${id}.log`)});
    const after=h.sha256(fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8"));
    const ok=result.status===0&&!result.error&&before===h.sha256(candidate)&&after===before;
    runs.push({id,file:suite.file,phase:"A",ok,text:result.text});
    emit(id,label,ok,ok?result.pass.slice(0,160):`exit ${result.status}${before!==h.sha256(candidate)||after!==before?" ARTIFACT CHANGED":""}\n${tail(result.text)}`);
  }

  // B: Phase B readiness on a temp copy (never the checkout's artifact).
  const copy=fs.mkdtempSync(path.join(os.tmpdir(),"cms-g12-phase-b-"));
  try{
    fs.cpSync(h.ROOT,copy,{recursive:true,filter:src=>!/[\\/](node_modules|\.git)$/.test(src)});
    fs.symlinkSync(path.join(h.ROOT,"node_modules"),path.join(copy,"node_modules"),"dir");
    fs.writeFileSync(path.join(copy,h.ARTIFACT),h.flipToPhaseB(candidate));
    assert.equal(h.careerIndexPhase(fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8")),"A","checkout artifact must stay Phase A");
    let b=0;
    for(const suite of suites.filter(s=>PHASE_B_FILES.has(s.file)||(s.file==="tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"&&s.envs===PHASE_B_LIFECYCLE))){
      b+=1;const id=`B${b}`;
      const result=runSuite(suite,{cwd:copy,logPath:path.join(logDir,`${id}.log`)});
      const ok=result.status===0&&!result.error;
      runs.push({id,file:suite.file,phase:"B",ok,text:result.text});
      emit(id,`Phase B (cmsCareerIndexEnforced() true, temp copy): ${LABELS[suite.file]||suite.file}${suite.envs?` (${suite.envs})`:""}`,ok,ok?result.pass.slice(0,120):`exit ${result.status}\n${tail(result.text)}`);
    }
  }finally{fs.rmSync(copy,{recursive:true,force:true});}

  // E: qualified expression-budget gate over every suite log.
  const findings=runs.flatMap(r=>budgetFindings(r.file,r.text).map(f=>({...f,run:r.id})));
  const bad=findings.filter(f=>!f.allowed);
  emit("E1","qualified 1,000-expression gate: the phrase appears only before allowed denial cases",bad.length===0,
    `${findings.length} occurrence(s): ${findings.map(f=>`${f.run}/${f.caseId||"no-case"}${f.allowed?"":" NOT ALLOWED"}`).join(", ")||"none"}`);

  // M: promise matrix.
  for(const [id,label,evidence] of PROMISES){
    const missing=[];
    for(const e of evidence){
      if(e==="B*"){if(!runs.some(r=>r.phase==="B")||runs.some(r=>r.phase==="B"&&!r.ok))missing.push("B*");continue;}
      if(/^[TE]\d+$/.test(e)){if(!passed.has(e))missing.push(e);continue;}
      const mine=runs.filter(r=>r.file===e);
      if(!mine.length||mine.some(r=>!r.ok))missing.push(path.basename(e));
    }
    emit(id,label,missing.length===0,missing.length?`failed or missing evidence: ${missing.join(", ")}`:`${evidence.length} evidence item(s)`);
  }
  const unmapped=suites.filter(s=>!LABELS[s.file]);
  if(unmapped.length)process.stdout.write(`NOTE unmapped composed suites ran and passed or failed above (add them to LABELS/PROMISES): ${unmapped.map(s=>s.file).join(", ")}\n`);
  process.stdout.write(`LOGS ${logDir}\n`);
  if(failures.length){process.stdout.write(`FAIL composed production Rules regression: ${failures.length} of ${n} numbered checks failed: ${failures.join(", ")}\n`);process.exit(1);}
  process.stdout.write(`PASS composed production Rules regression: ${n} numbered checks (T artifact identity and provenance, S ${suites.length} composed suites on the deploy artifact, B Phase B readiness, E qualified expression budget, M ${PROMISES.length} promises) on sha256 ${h.sha256(candidate)}.\n`);
}

// T4-T8: the offline checks, shared with tests/contracts/composed-production-rules-contracts.cjs.
function staticChecksFor(getCandidate){return require("../contracts/composed-production-rules-contracts.cjs").staticChecks(getCandidate);}

module.exports=Object.freeze({discoverSuites,suitesFromSteps,budgetFindings,BUDGET_ALLOWED,BASE_SUITES,PHASE_B_FILES,PROMISES,LABELS});
if(require.main===module){
  if(process.argv[2]==="--base-suite"){baseSuiteMode(process.argv[3]);}
  else main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
}
