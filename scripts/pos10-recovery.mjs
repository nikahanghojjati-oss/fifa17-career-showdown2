import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const operatingSystem = 'POS10';
export const filingVersion = 'v1.0.0';
export const recoveryStates = Object.freeze(['RECOVERY_READY', 'RECOVERY_STALE', 'RECOVERY_BLOCKED']);
export const indexFile = 'POS10_CURRENT_FILE_INDEX.json';
export const repository = 'nikahanghojjati-oss/fifa17-career-showdown2';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shaPattern = /^[a-f0-9]{40}$/;
const fingerprintPattern = /^[a-f0-9]{64}$/;
const packetDirectory = 'pos10-recovery/';
const sensitiveKey = /password|token|secret|rawcapability|accountid|deviceid|rivalryid|sessionid|pairingcode|fullsave|payload/i;
const sensitiveText = /(?:bearer\s+\S+|-----BEGIN [^-]*PRIVATE KEY|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|\b(?:pair|rivalry|session|device|account|invite)_[A-Za-z0-9_-]{8,}|\b(?:password|token|secret|accountId|deviceId|rivalryId|sessionId|pairingCode)\s*[=:]\s*\S+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

function ensure(ok, message) { if (!ok) throw new Error(message); }
function object(value, keys, label) {
  ensure(value && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  for (const key of Object.keys(value)) ensure(keys.includes(key), `${label}: unknown field ${key}`);
}
function textValue(value, label, max = 700) {
  ensure(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\r\n\x00]/.test(value), `${label}: bounded single-line text required`);
  ensure(!sensitiveText.test(value), `${label}: private material forbidden`);
  ensure(!/[{}\[\]`]/.test(value) && !/[A-Za-z0-9+/]{80,}={0,2}/.test(value), `${label}: structured or opaque data forbidden`);
}
export function assertPrivacySafe(value) {
  if (typeof value === 'string') ensure(!sensitiveText.test(value), 'Private material forbidden');
  else if (Array.isArray(value)) value.forEach(assertPrivacySafe);
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    ensure(!sensitiveKey.test(key), `Private field forbidden: ${key}`);
    assertPrivacySafe(child);
  }
}
function safePath(value) {
  ensure(typeof value === 'string' && /^[A-Za-z0-9_./-]+$/.test(value) && !value.startsWith('/') && !value.split('/').includes('..'), 'Unsafe artifact path');
  return value;
}
export function git(cwd, args) { return execFileSync('git', args, {cwd, encoding:'utf8', maxBuffer:16*1024*1024, timeout:60000}).trim(); }
export function sourceFingerprint(cwd = root) {
  const files = [...new Set(execFileSync('git', ['ls-files','-z','--cached','--others','--exclude-standard'], {cwd, encoding:'utf8', maxBuffer:16*1024*1024}).split('\0').filter(Boolean))].sort();
  const digest = crypto.createHash('sha256');
  for (const file of files) {
    if (file === indexFile || file.startsWith(packetDirectory)) continue;
    const absolute = path.join(cwd,file);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.lstatSync(absolute);
    ensure(stat.isFile() || stat.isSymbolicLink(), `Unsupported source artifact: ${file}`);
    const data = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(absolute)) : fs.readFileSync(absolute);
    digest.update(`${file}\0${stat.isSymbolicLink()?'link':(stat.mode&0o111)?'executable':'file'}\0${data.length}\0`).update(data).update('\0');
  }
  return digest.digest('hex');
}

const intentKeys = ['generatedAt','observedHeads','candidateBranch','recoveryBranch','atomicWorkUnit','lastSafeCheckpoint','nextExactAction','phase','decision'];
const phases = ['IMPLEMENTING','READY_TO_PROMOTE','VALIDATING','CORRECTING','MERGED'];
export function validateIntent(intent) {
  object(intent,intentKeys,'intent');
  for (const field of ['atomicWorkUnit','lastSafeCheckpoint','nextExactAction']) textValue(intent[field],field);
  for (const field of ['candidateBranch','recoveryBranch']) {
    textValue(intent[field],field,160);
    ensure(/^[A-Za-z0-9][A-Za-z0-9_./-]+$/.test(intent[field]) && !intent[field].includes('..') && !intent[field].endsWith('.lock'), `Invalid ${field}`);
  }
  ensure(intent.candidateBranch !== intent.recoveryBranch && intent.recoveryBranch.startsWith('recovery/'), 'Exactly one separate recovery branch required');
  object(intent.observedHeads,['main','candidate','recovery'],'observedHeads');
  for (const field of ['main','candidate','recovery']) ensure(shaPattern.test(intent.observedHeads[field]), `${field}: exact observed Git head required`);
  ensure(phases.includes(intent.phase), 'Invalid work phase');
  ensure(['CONTINUE','TRANSITION'].includes(intent.decision), 'Final operational decision required');
  if(intent.generatedAt) ensure(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(intent.generatedAt) && Number.isFinite(Date.parse(intent.generatedAt)), 'UTC generatedAt required');
  assertPrivacySafe(intent);
  return intent;
}

const manifestKeys = ['operatingSystem','filingVersion','generatedAt','repository','artifactRole','recoveryState','liveFactsMustBeResolved','observedHeads','candidateBranch','recoveryBranch','atomicWorkUnit','lastSafeCheckpoint','nextExactAction','phase','decision','sourceFingerprint','supersedes'];
export function validateManifest(manifest) {
  object(manifest,manifestKeys,'manifest');
  for(const key of manifestKeys) ensure(Object.hasOwn(manifest,key),`manifest: missing ${key}`);
  ensure(typeof manifest.generatedAt==='string','manifest: generatedAt required');
  validateIntent(Object.fromEntries(intentKeys.map(k=>[k,manifest[k]])));
  ensure(manifest.operatingSystem === operatingSystem && manifest.filingVersion === filingVersion, 'Unsupported POS10 filing contract');
  ensure(manifest.repository === repository && manifest.artifactRole === 'recovery-manifest', 'Recovery artifact identity mismatch');
  ensure(manifest.recoveryState === 'RECOVERY_READY' && manifest.liveFactsMustBeResolved === true, 'A generated checkpoint must be ready and require live re-resolution');
  ensure(fingerprintPattern.test(manifest.sourceFingerprint), 'Source fingerprint required');
  ensure(manifest.supersedes === null || (safePath(manifest.supersedes).startsWith(packetDirectory) && manifest.supersedes.endsWith('.json')), 'Invalid recovery lineage');
  return manifest;
}
export function renderSuccessor(manifest) {
  validateManifest(manifest);
  return `# Career Mode Showdown POS10 transfer\n\nfilingVersion: ${manifest.filingVersion}\nGenerated: ${manifest.generatedAt}\nRepository: ${manifest.repository}\nArtifact role: successor-transfer\nRecovery readiness: ${manifest.recoveryState}\nLive facts must be re-resolved: true\nSupersedes: ${manifest.supersedes || 'initial versioned checkpoint'}\n\nRead POS10_CURRENT_FILE_INDEX.json, PROJECT_OPERATING_SYSTEM_POS10.md, CURRENT_PRODUCT_GUARDS.json and NEXT_TASK.md. Resolve live main, open PRs, candidate/recovery refs, exact-head workflows and reviews/comments/threads before mutation. Resolve deployed runtime/provider authority when the product task requires it. Recorded heads are observations only.\n\nCandidate branch: ${manifest.candidateBranch}\nRecovery branch: ${manifest.recoveryBranch}\nObserved main: ${manifest.observedHeads.main}\nObserved candidate: ${manifest.observedHeads.candidate}\nObserved recovery before this packet: ${manifest.observedHeads.recovery}\nSource fingerprint: ${manifest.sourceFingerprint}\n\nWork phase: ${manifest.phase}\nAtomic work unit: ${manifest.atomicWorkUnit}\nLast safe checkpoint: ${manifest.lastSafeCheckpoint}\nExact next action: ${manifest.nextExactAction}\n\nKeep one work unit, one unpublished packet and this one recovery branch. Run work:recovery after live resolution; refresh stale recovery before widening work. Promote a coherent targeted-test-green unit once, pause candidate mutation during validation, require all selected evidence on that exact head and merge with expected-head protection. Re-resolve main and refresh recovery after merge.\n\nBilling stays OFF; Firebase Spark only. App Check enforcement OFF; memory-only Firestore; popup-only browserSessionPersistence and no extra scopes. Exactly two private managers; pairing plus exact ACTIVE precedes league/club authority. Candidate C alone may destructively Apply to local gameplay, with transaction-owned exact rollback. Canonical storage: careerModeShowdown.saveLibrary, careerModeShowdown.legacyShowdowns, careerModeShowdown.preferences. No public discovery, listing, lobby, matchmaking, community or rankings. SSJR-DUAL-FULL-SCREEN-1 is permanent.\n\nRead SSJR and MDP from their current ledgers. POS10 earns zero product credit. After its verified merge, continue production two-account Shared Setup evidence.\n\nDecision: ${manifest.decision}\n`;
}

const indexKeys = ['operatingSystem','filingVersion','generatedAt','repository','artifactRole','liveFactsMustBeResolved','recoveryState','nextExactAction','decision','currentAuthority','currentProductTask','currentRecoveryManifest','currentSuccessor','artifacts'];
export function validateIndex(index) {
  object(index,indexKeys,'current index');
  for(const key of indexKeys) ensure(Object.hasOwn(index,key),`current index: missing ${key}`);
  ensure(index.operatingSystem === operatingSystem && index.filingVersion === filingVersion, 'Unsupported current index');
  ensure(index.repository === repository && index.artifactRole === 'current-file-index' && index.liveFactsMustBeResolved === true, 'Index identity mismatch');
  ensure(index.currentAuthority === 'PROJECT_OPERATING_SYSTEM_POS10.json' && index.currentProductTask === 'NEXT_TASK.md', 'Current authority pointers invalid');
  ensure(Array.isArray(index.artifacts) && index.artifacts.length >= 2, 'Artifact lineage required');
  const seen = new Set();
  for (const artifact of index.artifacts) {
    object(artifact,['path','role','status','sha256','supersedes'],'index artifact');
    ensure(safePath(artifact.path).startsWith(packetDirectory) && !seen.has(artifact.path), 'Duplicate or invalid indexed artifact');
    seen.add(artifact.path);
    ensure(['successor-transfer','recovery-manifest'].includes(artifact.role) && ['active','historical'].includes(artifact.status) && fingerprintPattern.test(artifact.sha256), 'Invalid artifact role/status/fingerprint');
    if (artifact.supersedes !== null) ensure(index.artifacts.slice(0,index.artifacts.indexOf(artifact)).some(a=>a.path===artifact.supersedes && a.role===artifact.role && a.status==='historical'), 'Broken supersession lineage');
  }
  for (const [role,pointer] of [['successor-transfer','currentSuccessor'],['recovery-manifest','currentRecoveryManifest']]) {
    const active = index.artifacts.filter(a=>a.role===role && a.status==='active');
    ensure(active.length === 1 && active[0].path === index[pointer], `Exactly one active ${role} required`);
  }
  return index;
}
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
export function checkPackage(cwd = root) {
  try {
    const index = validateIndex(JSON.parse(fs.readFileSync(path.join(cwd,indexFile),'utf8')));
    for (const artifact of index.artifacts.filter(a=>a.status==='active')) ensure(hash(fs.readFileSync(path.join(cwd,artifact.path)))===artifact.sha256,'Indexed artifact fingerprint mismatch');
    const manifest = validateManifest(JSON.parse(fs.readFileSync(path.join(cwd,index.currentRecoveryManifest),'utf8')));
    ensure(fs.readFileSync(path.join(cwd,index.currentSuccessor),'utf8')===renderSuccessor(manifest), 'Successor content differs from manifest');
    for (const key of ['generatedAt','nextExactAction','decision','recoveryState']) ensure(index[key]===manifest[key], `Index/manifest ${key} differs`);
    const current = sourceFingerprint(cwd);
    return {recoveryState:current===manifest.sourceFingerprint?'RECOVERY_READY':'RECOVERY_STALE',manifest,index,reason:current===manifest.sourceFingerprint?'Source and successor agree':'Durable source facts changed; refresh before widening work'};
  } catch (error) { return {recoveryState:'RECOVERY_BLOCKED',reason:error.message}; }
}

export function checkLiveFacts(packet, heads) {
  if(packet.recoveryState!=='RECOVERY_READY')return packet;
  for(const key of ['main','candidate']){
    ensure(shaPattern.test(heads?.[key]),`Live ${key} head required`);
    if(heads[key]!==packet.manifest.observedHeads[key])return {...packet,recoveryState:'RECOVERY_STALE',reason:`Live ${key} moved; refresh recorded transaction facts before widening work`};
  }
  return packet;
}

export function generatePackage(cwd, input) {
  const intent = validateIntent(input);
  const old = fs.existsSync(path.join(cwd,indexFile)) ? validateIndex(JSON.parse(fs.readFileSync(path.join(cwd,indexFile),'utf8'))) : null;
  const generatedAt = intent.generatedAt || new Date().toISOString();
  const existing=fs.existsSync(path.join(cwd,packetDirectory))?fs.readdirSync(path.join(cwd,packetDirectory)):[];
  const highest=Math.max(0,...existing.map(name=>Number(name.match(/_(\d{6})\.(?:json|md)$/)?.[1]||0)));
  const sequence = String(Math.max(highest,old?.artifacts.filter(a=>a.role==='successor-transfer').length || 0)+1).padStart(6,'0');
  const suffix = `${filingVersion}_${generatedAt.slice(0,10)}_${sequence}`;
  const recoveryPath = `${packetDirectory}POS10_RECOVERY_${suffix}.json`;
  const successorPath = `${packetDirectory}START_NEXT_DEVELOPER_POS10_TRANSFER_${suffix}.md`;
  const manifest = {...intent,operatingSystem,filingVersion,generatedAt,repository,artifactRole:'recovery-manifest',recoveryState:'RECOVERY_READY',liveFactsMustBeResolved:true,sourceFingerprint:sourceFingerprint(cwd),supersedes:old?.currentRecoveryManifest || null};
  const recoveryData = `${JSON.stringify(validateManifest(manifest),null,2)}\n`;
  const successorData = renderSuccessor(manifest);
  const artifacts = (old?.artifacts || []).map(a=>({...a,status:'historical'}));
  for(const [artifactPath,role,data,supersedes] of [[recoveryPath,'recovery-manifest',recoveryData,old?.currentRecoveryManifest || null],[successorPath,'successor-transfer',successorData,old?.currentSuccessor || null]]) artifacts.push({path:artifactPath,role,status:'active',sha256:hash(data),supersedes});
  const index = validateIndex({operatingSystem,filingVersion,generatedAt,repository,artifactRole:'current-file-index',liveFactsMustBeResolved:true,recoveryState:manifest.recoveryState,nextExactAction:manifest.nextExactAction,decision:manifest.decision,currentAuthority:'PROJECT_OPERATING_SYSTEM_POS10.json',currentProductTask:'NEXT_TASK.md',currentRecoveryManifest:recoveryPath,currentSuccessor:successorPath,artifacts});
  fs.mkdirSync(path.join(cwd,packetDirectory),{recursive:true});
  // Immutable artifacts first. The atomic index rename is the sole activation point.
  fs.writeFileSync(path.join(cwd,recoveryPath),recoveryData,{flag:'wx'});
  fs.writeFileSync(path.join(cwd,successorPath),successorData,{flag:'wx'});
  const temporary = path.join(cwd,packetDirectory,'index.pending');
  fs.writeFileSync(temporary,`${JSON.stringify(index,null,2)}\n`);
  fs.renameSync(temporary,path.join(cwd,indexFile));
  return checkPackage(cwd);
}

const stateKeys = ['recoveryState','liveAuthorityResolved','successorDurable','candidateHead','expectedCandidateHead','recoveryHead','recoveryBranches','recoveryDescendsFromCandidate','openAtomicUnits','localUnpublishedPackets','candidateValidation','validationHead','targetedValidationHead','coherent','platformWarning','severeContextDamage','ownerRequestsTransfer','merged','postMergeMainResolved'];
export function assessRecovery(input) {
  object(input,stateKeys,'recovery state');
  ensure(recoveryStates.includes(input.recoveryState),'Invalid recovery state');
  for(const k of ['liveAuthorityResolved','successorDurable','recoveryDescendsFromCandidate','coherent','platformWarning','severeContextDamage','ownerRequestsTransfer','merged','postMergeMainResolved']) ensure(typeof input[k]==='boolean',`${k}: boolean required`);
  for(const k of ['openAtomicUnits','localUnpublishedPackets']) ensure(Number.isInteger(input[k]) && input[k]>=0,`${k}: nonnegative integer required`);
  for(const k of ['candidateHead','expectedCandidateHead','recoveryHead']) ensure(shaPattern.test(input[k]),`${k}: exact Git head required`);
  for(const k of ['validationHead','targetedValidationHead']) ensure(input[k]===null || shaPattern.test(input[k]),`${k}: exact Git head or null required`);
  ensure(['NOT_PUBLISHED','PENDING','GREEN','FAILED'].includes(input.candidateValidation),'Invalid validation state');
  ensure(Array.isArray(input.recoveryBranches),'Recovery branch list required');
  const result=(recoveryState,action,decision,reason)=>({operatingSystem,filingVersion,recoveryState,action,decision,reason});
  const blocked=(action,reason)=>result('RECOVERY_BLOCKED',action,'TRANSITION',reason);
  if(!input.liveAuthorityResolved) return blocked('RESOLVE_LIVE_AUTHORITY','Required live authority unavailable');
  if(input.platformWarning || input.severeContextDamage || input.ownerRequestsTransfer) return result(input.recoveryState,'CHECKPOINT_AND_TRANSFER','TRANSITION','Observable transition signal');
  if(input.recoveryState!=='RECOVERY_READY' || !input.successorDurable) return result(input.recoveryState==='RECOVERY_READY'?'RECOVERY_BLOCKED':input.recoveryState,'REFRESH_RECOVERY','TRANSITION','Current durable successor required before substantive continuation');
  if(input.recoveryBranches.length!==1 || input.openAtomicUnits>1 || input.localUnpublishedPackets>1) return blocked('CHECKPOINT_AND_RECONCILE','Single recovery branch/work unit/packet invariant violated');
  if(input.candidateHead!==input.expectedCandidateHead || !input.recoveryDescendsFromCandidate) return blocked('RECONCILE_HEADS','Live refs differ from expected transaction');
  if(input.merged) return input.postMergeMainResolved?result('RECOVERY_READY','RESUME_PRODUCT','CONTINUE','Merged main resolved and successor refreshed'):blocked('RESOLVE_MERGED_MAIN','Post-merge live authority required');
  if(input.candidateValidation!=='NOT_PUBLISHED' && input.validationHead!==input.candidateHead) return blocked('RESOLVE_EXACT_HEAD_EVIDENCE','Validation belongs to a different head');
  if(input.candidateValidation==='PENDING') return result('RECOVERY_READY','WAIT_WITHOUT_CANDIDATE_MUTATION','CONTINUE','Published candidate validation pending');
  if(input.candidateValidation==='FAILED') return result('RECOVERY_READY','INSPECT_EXACT_FAILURES','CONTINUE','Collect coherent failure set before a correction packet');
  if(input.candidateValidation==='GREEN') return result('RECOVERY_READY','RECHECK_REVIEWS_AND_MERGE_EXPECTED_HEAD','CONTINUE','Exact published candidate green');
  if(input.coherent && input.targetedValidationHead===input.recoveryHead && input.openAtomicUnits===1 && input.localUnpublishedPackets===0) return result('RECOVERY_READY','PROMOTE_ONCE_NONFORCED','CONTINUE','Coherent durable unit passed targeted validation');
  return result('RECOVERY_READY','CONTINUE_RECOVERY_BRANCH','CONTINUE','Exact next action is safely recoverable');
}

export function validateFinishedResponse(response) {
  const lines=String(response).trimEnd().split(/\r?\n/);
  const decisions=lines.filter(line=>/^Decision:/.test(line));
  ensure(decisions.length===1 && /^Decision: (CONTINUE|TRANSITION)$/.test(lines.at(-1)), 'Exactly one final operational decision line required');
  if(lines.at(-1)==='Decision: CONTINUE')ensure(!/Recovery readiness: RECOVERY_(?:STALE|BLOCKED)/.test(response),'Continuation requires ready recovery');
  const registry=JSON.parse(fs.readFileSync(path.join(root,'POS10_RETIRED_CONCEPTS.json'),'utf8'));
  for(const pattern of registry.forbiddenPatterns) ensure(!new RegExp(pattern,'i').test(response),'Retired reporting is forbidden');
  return true;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const [command,...args]=process.argv.slice(2);
    if(command==='generate' && args.length===1) {
      const result=generatePackage(root,JSON.parse(fs.readFileSync(path.resolve(args[0]),'utf8')));
      ensure(result.recoveryState==='RECOVERY_READY',result.reason);
      console.log(`${result.index.currentSuccessor}\nRecovery readiness: ${result.recoveryState}\nDecision: ${result.manifest.decision}`);
    } else if(command==='check' && args.length===0) {
      const result=checkPackage(root);
      console.log(`${JSON.stringify({recoveryState:result.recoveryState,reason:result.reason},null,2)}\nDecision: TRANSITION`);
      // Local freshness alone is not permission to continue without live authority.
      if(result.recoveryState!=='RECOVERY_READY') process.exitCode=1;
    } else if(command==='assess' && args.length===1) {
      const state=JSON.parse(fs.readFileSync(path.resolve(args[0]),'utf8'));
      let packet=checkPackage(root);
      ensure(packet.manifest,packet.reason);
      const names=['main',packet.manifest.candidateBranch,packet.manifest.recoveryBranch];
      const remote=git(root,['ls-remote','origin',...names.map(b=>`refs/heads/${b}`)]);
      const refs=Object.fromEntries(remote.split('\n').map(line=>{const [head,ref]=line.split(/\s+/);return [ref,head];}));
      const candidate=refs[`refs/heads/${packet.manifest.candidateBranch}`],recovery=refs[`refs/heads/${packet.manifest.recoveryBranch}`];
      ensure(candidate===state.candidateHead && recovery===state.recoveryHead,'Live transaction refs differ from input; reconcile first');
      packet=checkLiveFacts(packet,{main:refs['refs/heads/main'],candidate});
      const durableIndex=git(root,['show',`${recovery}:${indexFile}`]);
      const successorDurable=durableIndex===fs.readFileSync(path.join(root,indexFile),'utf8').trim();
      const result=assessRecovery({...state,successorDurable:state.successorDurable&&successorDurable,recoveryState:packet.recoveryState});
      console.log(`${JSON.stringify(result,null,2)}\nDecision: ${result.decision}`);
      if(result.decision==='TRANSITION') process.exitCode=1;
    } else if(command==='response' && args.length===1) {
      validateFinishedResponse(fs.readFileSync(path.resolve(args[0]),'utf8'));
      console.log('PASS POS10 response contract');
    } else throw new Error('Usage: pos10-recovery.mjs generate INTENT.json | check | assess LIVE_STATE.json | response RESPONSE.txt');
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
