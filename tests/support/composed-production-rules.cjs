'use strict';
// JOB-12 (G-12): shared helpers for the composed production Rules regression.
// Read-only: every composition here happens in a fresh temporary directory, never in the checkout.
// Used by tests/contracts/composed-production-rules-contracts.cjs (offline) and
// tests/firebase/composed-production-rules-regression.cjs (emulator matrix + deploy-path replay).
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');

const ROOT=path.resolve(__dirname,'../..');
const DEPLOY_WORKFLOW='.github/workflows/deploy-firestore-rules-zero-billing.yml';
const FAST_WORKFLOW='.github/workflows/validate-gameplay-fast.yml';
const ARTIFACT='firestore.spark.generated.rules';
const DELTA_FIXTURE='tests/fixtures/composed-production-rules/main-delta.json';
const PAIR_FRAGMENT='firestore.persistent-pair-production.fragment.rules';
// Read by build-production-firestore-rules.mjs but (correctly) not a deploy trigger: it only validates the catalog shape.
const EXTRA_COMPOSITION_INPUTS=Object.freeze(['data/transferOptions.js']);
// The deploy job's steps, in order. Any inserted, removed or reordered step must be reviewed here first,
// because a step between the build and the publish could change the bytes that reach the provider.
const DEPLOY_STEP_NAMES=Object.freeze([
  'Check out exact main source',
  'Set up Node.js 24',
  'Set up Java 21 for local Firestore emulator proof',
  'Assert permanent zero-billing deployment boundary',
  'Build reviewed Shared Journey Rules source',
  'Add bounded persistent pair Rules authority',
  'Refuse generated Rules that weaken the permanent Spark boundary',
  'Install locked repository dependencies',
  'Install pinned Firebase emulator test dependencies',
  'Prove reviewed production Rules contracts',
  'Reprove generated production Shared Setup Rules with adversarial provider matrix',
  'Prove Shared Transfer fresh-session timeout recovery',
  'Prove full shared gameplay provider lifecycle',
  'Prove r18 Terminal Close Rules with adversarial provider matrix',
  'Prove persistent Nik and Daniel pair Rules with adversarial provider matrix',
  'Authenticate permanent Firebase Rules service account',
  'Refuse missing permanent ADC credential file',
  'Compile, publish and independently read back exact Firestore Rules source'
]);
const BUILD_STEPS=Object.freeze(['Build reviewed Shared Journey Rules source','Add bounded persistent pair Rules authority']);
const GATE_STEP='Refuse generated Rules that weaken the permanent Spark boundary';
const CONTRACT_STEP='Prove reviewed production Rules contracts';
const PUBLISH_STEP='Compile, publish and independently read back exact Firestore Rules source';
// Steps the deploy-path replay executes in the checkout (environment installs and provider steps excluded).
const REPLAY_STEPS=Object.freeze([...BUILD_STEPS,GATE_STEP,CONTRACT_STEP]);

function readRepo(relative){return fs.readFileSync(path.join(ROOT,relative),'utf8');}
function sha256(text){return crypto.createHash('sha256').update(Buffer.from(text,'utf8')).digest('hex');}
// Same blob hash the publish helper prints as PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS.
function gitBlobSha1(text){
  const bytes=Buffer.from(text,'utf8');
  return crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`,'utf8')).update(bytes).digest('hex');
}
function identity(text){return {sha256:sha256(text),gitBlobSha1:gitBlobSha1(text),bytes:Buffer.byteLength(text,'utf8')};}

// Minimal parser for the two workflow files this job reads (GitHub Actions YAML subset: top-level env,
// on.push.paths, jobs.<id>.steps with name/run/uses). It throws on anything it does not understand.
function parseWorkflow(text,label){
  const lines=text.replace(/\r\n/g,'\n').split('\n');
  const result={env:{},paths:[],jobs:{}};
  let section=null,job=null,inSteps=false,stepIndent=-1,step=null,inPaths=false;
  const finishStep=()=>{if(step){job.steps.push(step);step=null;}};
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(/^\s*(#.*)?$/.test(line))continue;
    const indent=line.match(/^ */)[0].length;
    if(indent===0){finishStep();section=line.replace(/:.*$/,'').trim();job=null;inSteps=false;inPaths=false;continue;}
    if(section==='env'&&indent===2){const m=line.match(/^  ([A-Z0-9_]+):\s*(.*)$/);if(!m)throw new Error(`${label}: unparsed env line ${i+1}`);result.env[m[1]]=m[2].trim();continue;}
    if(section==='on'){
      if(/^\s+paths:\s*$/.test(line)){inPaths=true;continue;}
      if(inPaths){const m=line.match(/^\s+-\s+(.+)$/);if(m){result.paths.push(m[1].trim().replace(/^['"]|['"]$/g,''));continue;}inPaths=false;}
      continue;
    }
    if(section!=='jobs')continue;
    if(indent===2){finishStep();const m=line.match(/^  ([A-Za-z0-9_-]+):\s*$/);if(!m)throw new Error(`${label}: unparsed job line ${i+1}`);job={id:m[1],steps:[]};result.jobs[m[1]]=job;inSteps=false;continue;}
    if(!job)continue;
    if(indent===4){finishStep();inSteps=/^    steps:\s*$/.test(line);stepIndent=-1;continue;}
    if(!inSteps)continue;
    const dash=line.match(/^( *)- (.*)$/);
    if(dash&&(stepIndent<0||dash[1].length===stepIndent)){
      finishStep();stepIndent=dash[1].length;step={name:null,run:null,uses:null,line:i+1};
      i=readStepKey(lines,i,stepIndent+2,dash[2],step,label);continue;
    }
    if(step&&indent===stepIndent+2){i=readStepKey(lines,i,stepIndent+2,line.slice(indent),step,label);continue;}
    if(step&&indent>stepIndent+2)continue; // nested with:/env: values
    throw new Error(`${label}: unparsed step line ${i+1}: ${line}`);
  }
  finishStep();
  return result;
}
function readStepKey(lines,i,keyIndent,text,step,label){
  const m=text.match(/^([A-Za-z_-]+):\s*(.*)$/);
  if(!m)throw new Error(`${label}: unparsed step key at line ${i+1}`);
  const [,key,rest]=m;
  if(key==='run'&&/^[|>][-+]?\s*$/.test(rest)){
    const block=[];let j=i+1;
    for(;j<lines.length;j++){
      const l=lines[j];
      if(l.trim()===''){block.push('');continue;}
      if(l.match(/^ */)[0].length<=keyIndent)break;
      block.push(l);
    }
    const strip=Math.min(...block.filter(Boolean).map(l=>l.match(/^ */)[0].length));
    step.run=block.map(l=>l.slice(strip)).join('\n').replace(/\n+$/,'');
    return j-1;
  }
  const value=rest.trim().replace(/^(['"])(.*)\1$/,'$2');
  if(key==='name')step.name=value;
  else if(key==='run')step.run=value;
  else if(key==='uses')step.uses=value;
  return i;
}
function stepByName(job,name,label){
  const found=job.steps.filter(s=>s.name===name);
  if(found.length!==1)throw new Error(`${label}: expected exactly one step named "${name}", found ${found.length}`);
  return found[0];
}
function deployModel(text=readRepo(DEPLOY_WORKFLOW)){
  const wf=parseWorkflow(text,DEPLOY_WORKFLOW);
  const job=wf.jobs['deploy-firestore-rules'];
  if(!job)throw new Error('deploy workflow: job deploy-firestore-rules missing');
  const buildCommands=BUILD_STEPS.map(name=>{
    const run=stepByName(job,name,DEPLOY_WORKFLOW).run;
    const m=String(run).match(/^node (scripts\/[a-z0-9-]+\.mjs)$/);
    if(!m)throw new Error(`deploy workflow: build step "${name}" must be one node command, got: ${run}`);
    return m[1];
  });
  return {workflow:wf,job,buildCommands};
}

// Copy the Rules inputs (deploy trigger paths that exist + the catalog) from a source reader into a fresh
// temp dir and run the given build scripts there. Returns the artifact text. Throws if any input is missing.
function composeInTemp({readFile,inputs,buildCommands,label}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cms-g12-compose-'));
  try{
    for(const rel of inputs){
      const text=readFile(rel);
      if(text===null)continue;
      fs.mkdirSync(path.dirname(path.join(dir,rel)),{recursive:true});
      fs.writeFileSync(path.join(dir,rel),text);
    }
    if(fs.existsSync(path.join(dir,ARTIFACT)))throw new Error(`${label}: artifact must not pre-exist in the temp composition`);
    for(const script of buildCommands){
      const r=spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8'});
      if(r.status!==0)throw new Error(`${label}: ${script} failed (${r.status}): ${r.stderr||r.stdout}`);
    }
    return fs.readFileSync(path.join(dir,ARTIFACT),'utf8');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
function compositionInputs(deployPaths){
  const inputs=[...new Set([...deployPaths.filter(p=>!p.startsWith('ops/')),...EXTRA_COMPOSITION_INPUTS])];
  for(const required of ['firestore.spark.rules',PAIR_FRAGMENT,'scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs','scripts/inject-persistent-pair-rules.mjs']){
    if(!inputs.includes(required))throw new Error(`deploy trigger paths no longer include ${required}`);
  }
  return inputs;
}
function workingTreeReader(rel){const p=path.join(ROOT,rel);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;}
function gitRefReader(ref){
  return rel=>{
    const r=spawnSync('git',['show',`${ref}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
    return r.status===0?r.stdout:null;
  };
}
function gitRefExists(ref){return spawnSync('git',['rev-parse','--verify','--quiet',`${ref}^{commit}`],{cwd:ROOT,encoding:'utf8'}).status===0;}
function gitRefCommit(ref){const r=spawnSync('git',['rev-parse',`${ref}^{commit}`],{cwd:ROOT,encoding:'utf8'});return r.status===0?r.stdout.trim():null;}

// Compose the candidate exactly as the deploy workflow in this checkout would, in a temp dir.
function composeCandidate(){
  const {workflow,buildCommands}=deployModel();
  return composeInTemp({readFile:workingTreeReader,inputs:compositionInputs(workflow.paths),buildCommands,label:'candidate'});
}
// Compose production main with main's own deploy workflow, scripts and Rules sources.
function composeFromRef(ref){
  const read=gitRefReader(ref);
  const deployText=read(DEPLOY_WORKFLOW);
  if(deployText===null)throw new Error(`${ref}: deploy workflow not readable`);
  const {workflow,buildCommands}=deployModel(deployText);
  return composeInTemp({readFile:read,inputs:compositionInputs(workflow.paths),buildCommands,label:ref});
}

// The deploy job's "Refuse generated Rules..." gate, applied to an artifact: every grep -Fq "<needle>" line.
function deployGateNeedles(model=deployModel()){
  const run=stepByName(model.job,GATE_STEP,DEPLOY_WORKFLOW).run;
  const needles=[];
  for(const line of run.split('\n')){
    const m=line.match(/^grep -Fq "(.*)" "\$\{FIREBASE_RULES_FILE\}"$/);
    if(m)needles.push(m[1].replace(/\\(["\\$`])/g,'$1'));
  }
  return needles;
}

// Line diff (common prefix/suffix trimmed, LCS on the middle). Hunks are 1-based line numbers.
function diffLines(aText,bText){
  const a=aText.split('\n'),b=bText.split('\n');
  let start=0;while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  let endA=a.length,endB=b.length;while(endA>start&&endB>start&&a[endA-1]===b[endB-1]){endA--;endB--;}
  const A=a.slice(start,endA),B=b.slice(start,endB),n=A.length,m=B.length;
  if(n*m>40000000)throw new Error('diff too large to review: the composed Rules changed far beyond the allowlist');
  const L=new Uint32Array((n+1)*(m+1)),w=m+1;
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i*w+j]=A[i]===B[j]?L[(i+1)*w+j+1]+1:Math.max(L[(i+1)*w+j],L[i*w+j+1]);
  const hunks=[];let i=0,j=0,cur=null;
  const flush=()=>{if(cur){hunks.push(cur);cur=null;}};
  while(i<n||j<m){
    if(i<n&&j<m&&A[i]===B[j]){flush();i++;j++;continue;}
    if(!cur)cur={mainLine:start+i+1,candidateLine:start+j+1,removed:[],added:[]};
    if(j<m&&(i>=n||L[i*w+j+1]>=L[(i+1)*w+j])){cur.added.push(B[j]);j++;}
    else{cur.removed.push(A[i]);i++;}
  }
  flush();
  return hunks;
}
// Undo the reviewed delta on the candidate. Throws if any hunk does not match the candidate exactly.
function reverseApply(candidateText,hunks){
  const lines=candidateText.split('\n');
  for(const h of [...hunks].sort((x,y)=>y.candidateLine-x.candidateLine)){
    const at=h.candidateLine-1;
    const actual=lines.slice(at,at+h.added.length);
    if(actual.length!==h.added.length||actual.some((l,k)=>l!==h.added[k]))throw new Error(`reviewed delta hunk at candidate line ${h.candidateLine} (${h.owner}) does not match the composed artifact`);
    lines.splice(at,h.added.length,...h.removed);
  }
  return lines.join('\n');
}
function loadDelta(){return JSON.parse(readRepo(DELTA_FIXTURE));}
function sameHunks(x,y){
  if(x.length!==y.length)return false;
  return x.every((h,k)=>h.mainLine===y[k].mainLine&&h.candidateLine===y[k].candidateLine&&JSON.stringify(h.removed)===JSON.stringify(y[k].removed)&&JSON.stringify(h.added)===JSON.stringify(y[k].added));
}

// Static checks on one artifact. Returns an array of [id,label] that passed; throws on the first failure.
const BILLING_STRICT=[['Cloud Run',/cloud[\s_-]*run/i],['Cloud Functions',/cloud[\s_-]*functions/i],['Cloud Billing',/cloud[\s_-]*billing/i],['Blaze',/blaze/i],['payment',/payment/i],['purchased credits',/purchased[\s_-]*credits/i]];
function allowStatements(text){
  const out=[];const re=/allow\s+([a-z, ]+?)\s*:\s*if\s+([\s\S]*?);/g;let m;
  while((m=re.exec(text)))out.push({methods:m[1].split(',').map(s=>s.trim()),condition:m[2].replace(/\s+/g,' ').trim(),index:m.index});
  return out;
}
function assertNoBroadGrants(text,label){
  const statements=allowStatements(text);
  if(statements.length<40)throw new Error(`${label}: only ${statements.length} allow statements parsed`);
  for(const s of statements){
    if(s.methods.some(x=>['list','delete','read','write'].includes(x))&&s.condition!=='false')throw new Error(`${label}: broad or list/delete grant "${s.methods.join(', ')}: if ${s.condition}"`);
    if(/^true\b|\|\|\s*true\b/.test(s.condition))throw new Error(`${label}: unconditional grant "${s.methods.join(', ')}"`);
  }
  const last=statements[statements.length-1];
  if(!(last.methods.join(',')==='read,write'&&last.condition==='false'))throw new Error(`${label}: the last statement must be the deny-all catch-all`);
  if(!/match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}\s*\}\s*\}\s*$/.test(text))throw new Error(`${label}: catch-all deny must close the Rules`);
  return statements.length;
}
function careerIndexPhase(text){
  const off=(text.match(/function cmsCareerIndexEnforced\(\) \{\s*return false;\s*\}/g)||[]).length;
  const on=(text.match(/function cmsCareerIndexEnforced\(\) \{\s*return true;\s*\}/g)||[]).length;
  const any=(text.match(/function cmsCareerIndexEnforced\(\)/g)||[]).length;
  if(any!==1)throw new Error(`expected exactly one cmsCareerIndexEnforced(), found ${any}`);
  return off===1?'A':on===1?'B':'unknown';
}
function flipToPhaseB(text){
  const re=/function cmsCareerIndexEnforced\(\) \{\s*return false;\s*\}/g;
  if((text.match(re)||[]).length!==1)throw new Error('Phase B flip needs exactly one shipped Phase A constant');
  return text.replace(re,'function cmsCareerIndexEnforced() { return true; }');
}

module.exports=Object.freeze({
  ROOT,DEPLOY_WORKFLOW,FAST_WORKFLOW,ARTIFACT,DELTA_FIXTURE,PAIR_FRAGMENT,DEPLOY_STEP_NAMES,BUILD_STEPS,GATE_STEP,CONTRACT_STEP,PUBLISH_STEP,REPLAY_STEPS,BILLING_STRICT,
  readRepo,sha256,gitBlobSha1,identity,parseWorkflow,stepByName,deployModel,composeInTemp,compositionInputs,workingTreeReader,gitRefReader,gitRefExists,gitRefCommit,
  composeCandidate,composeFromRef,deployGateNeedles,diffLines,reverseApply,loadDelta,sameHunks,allowStatements,assertNoBroadGrants,careerIndexPhase,flipToPhaseB
});

// Lead/worker tool: node tests/support/composed-production-rules.cjs --print-main-delta <ref>
// prints the delta between <ref>'s composition and this checkout's, for review before updating the fixture.
if(require.main===module){
  const [flag,ref]=process.argv.slice(2);
  if(flag!=='--print-main-delta'||!ref){console.error('usage: --print-main-delta <git ref of production main>');process.exit(2);}
  const main=composeFromRef(ref),cand=composeCandidate();
  process.stdout.write(JSON.stringify({productionMain:{commit:gitRefCommit(ref),...identity(main)},candidate:identity(cand),hunks:diffLines(main,cand)},null,2)+'\n');
}
