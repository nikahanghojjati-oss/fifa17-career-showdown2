import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {recoveryStates,generatePackage,checkPackage,checkLiveFacts,sourceFingerprint,assessRecovery,validateIntent,validateManifest,validateIndex,validateFinishedResponse,assertPrivacySafe} from '../../scripts/pos10-recovery.mjs';

const a='a'.repeat(40), b='b'.repeat(40), c='c'.repeat(40);
export const state=()=>({recoveryState:'RECOVERY_READY',liveAuthorityResolved:true,successorDurable:true,candidateHead:a,expectedCandidateHead:a,recoveryHead:b,recoveryBranches:['recovery/unit'],recoveryDescendsFromCandidate:true,openAtomicUnits:1,localUnpublishedPackets:0,candidateValidation:'NOT_PUBLISHED',validationHead:null,targetedValidationHead:null,coherent:false,platformWarning:false,severeContextDamage:false,ownerRequestsTransfer:false,merged:false,postMergeMainResolved:false});
const intent=()=>({generatedAt:'2026-09-08T06:00:00Z',observedHeads:{main:a,candidate:a,recovery:b},candidateBranch:'ops/unit',recoveryBranch:'recovery/unit',atomicWorkUnit:'A bounded product change',lastSafeCheckpoint:'Source reviewed and durably recorded',nextExactAction:'Verify the next required product invariant',phase:'IMPLEMENTING',decision:'CONTINUE'});
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cms-pos10-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  execFileSync('git',['init','-q'],{cwd:dir});
  fs.writeFileSync(path.join(dir,'app.js'),'export const value=1;\n');
  execFileSync('git',['add','app.js'],{cwd:dir});
  return dir;
}

test('three exact recovery states; stale, blocked and unavailable authority prevent continuation',()=>{
  assert.deepEqual(recoveryStates,['RECOVERY_READY','RECOVERY_STALE','RECOVERY_BLOCKED']);
  assert.equal(assessRecovery(state()).decision,'CONTINUE');
  for(const recoveryState of recoveryStates.slice(1))assert.equal(assessRecovery({...state(),recoveryState}).decision,'TRANSITION');
  for(const overrides of [{liveAuthorityResolved:false},{successorDurable:false},{merged:true,postMergeMainResolved:false}])assert.equal(assessRecovery({...state(),...overrides}).decision,'TRANSITION');
});
test('one recovery branch, work unit and unpublished packet are enforced',()=>{
  for(const overrides of [{recoveryBranches:[]},{recoveryBranches:['recovery/a','recovery/b']},{openAtomicUnits:2},{localUnpublishedPackets:2}])assert.equal(assessRecovery({...state(),...overrides}).decision,'TRANSITION');
});
test('real warnings and owner requests transition without hidden quota predictors',()=>{
  for(const key of ['platformWarning','severeContextDamage','ownerRequestsTransfer'])assert.equal(assessRecovery({...state(),[key]:true}).decision,'TRANSITION');
  const registry=JSON.parse(fs.readFileSync('POS10_RETIRED_CONCEPTS.json','utf8'));
  for(const key of registry.forbiddenStateFields)assert.throws(()=>assessRecovery({...state(),[key]:1}),/unknown field/);
});
test('unexpected head movement or mixed-head evidence requires reconciliation',()=>{
  for(const overrides of [{candidateHead:c},{recoveryDescendsFromCandidate:false},{candidateValidation:'GREEN',validationHead:c}])assert.equal(assessRecovery({...state(),...overrides}).decision,'TRANSITION');
});
test('pending validation locks candidate; promotion requires exact targeted proof and no volatile packet',()=>{
  const ready={...state(),coherent:true,targetedValidationHead:b};
  assert.equal(assessRecovery(ready).action,'PROMOTE_ONCE_NONFORCED');
  for(const overrides of [{targetedValidationHead:c},{localUnpublishedPackets:1},{openAtomicUnits:0},{coherent:false}])assert.notEqual(assessRecovery({...ready,...overrides}).action,'PROMOTE_ONCE_NONFORCED');
  assert.equal(assessRecovery({...ready,candidateValidation:'PENDING',validationHead:a}).action,'WAIT_WITHOUT_CANDIDATE_MUTATION');
  assert.equal(assessRecovery({...ready,candidateValidation:'FAILED',validationHead:a}).action,'INSPECT_EXACT_FAILURES');
});
test('source changes become stale; one immutable successor is activated with linked history',t=>{
  const dir=fixture(t);const first=generatePackage(dir,intent());
  assert.equal(first.recoveryState,'RECOVERY_READY');
  const original=fs.readFileSync(path.join(dir,first.index.currentSuccessor),'utf8');
  fs.appendFileSync(path.join(dir,'app.js'),'export const next=2;\n');
  assert.equal(checkPackage(dir).recoveryState,'RECOVERY_STALE');
  const second=generatePackage(dir,{...intent(),lastSafeCheckpoint:'Second durable checkpoint'});
  assert.equal(second.recoveryState,'RECOVERY_READY');
  assert.notEqual(first.index.currentSuccessor,second.index.currentSuccessor);
  assert.equal(fs.readFileSync(path.join(dir,first.index.currentSuccessor),'utf8'),original);
  assert.equal(second.index.artifacts.filter(a=>a.role==='successor-transfer'&&a.status==='active').length,1);
  assert.equal(second.manifest.supersedes,first.index.currentRecoveryManifest);
  assert.equal(second.manifest.liveFactsMustBeResolved,true);
});
test('main or candidate movement makes recorded transaction facts stale even when source is unchanged',t=>{
  const dir=fixture(t);const packet=generatePackage(dir,intent());
  assert.equal(checkLiveFacts(packet,{main:a,candidate:a}).recoveryState,'RECOVERY_READY');
  for(const heads of [{main:c,candidate:a},{main:a,candidate:c}])assert.equal(checkLiveFacts(packet,heads).recoveryState,'RECOVERY_STALE');
});
test('fingerprint is deterministic and covers new files, deletions and executable mode',t=>{
  const dir=fixture(t);const before=sourceFingerprint(dir);
  assert.equal(sourceFingerprint(dir),before);
  fs.chmodSync(path.join(dir,'app.js'),0o755);assert.notEqual(sourceFingerprint(dir),before);
  fs.chmodSync(path.join(dir,'app.js'),0o644);assert.equal(sourceFingerprint(dir),before);
  fs.writeFileSync(path.join(dir,'new.js'),'new source');assert.notEqual(sourceFingerprint(dir),before);
  fs.unlinkSync(path.join(dir,'new.js'));fs.unlinkSync(path.join(dir,'app.js'));assert.notEqual(sourceFingerprint(dir),before);
});
test('partial generation cannot activate two successors or prevent bounded regeneration',t=>{
  const dir=fixture(t);const first=generatePackage(dir,intent());
  const orphan=first.index.currentRecoveryManifest.replace('000001','000002');
  fs.writeFileSync(path.join(dir,orphan),'interrupted packet');
  assert.equal(checkPackage(dir).recoveryState,'RECOVERY_READY');
  const next=generatePackage(dir,intent());
  assert.equal(next.recoveryState,'RECOVERY_READY');
  assert.match(next.index.currentSuccessor,/000003/);
  assert.equal(fs.readFileSync(path.join(dir,orphan),'utf8'),'interrupted packet');
});
test('tampering, ambiguous current index and invalid lineage fail closed',t=>{
  const dir=fixture(t);let result=generatePackage(dir,intent());
  const index=structuredClone(result.index);index.artifacts.push({...index.artifacts[1],path:'pos10-recovery/second.md'});
  assert.throws(()=>validateIndex(index),/Exactly one active/);
  fs.appendFileSync(path.join(dir,result.index.currentSuccessor),'tampered');
  assert.equal(checkPackage(dir).recoveryState,'RECOVERY_BLOCKED');
  const wrong=structuredClone(result.index);wrong.currentAuthority='elsewhere.json';assert.throws(()=>validateIndex(wrong),/authority pointers/);
  result=generatePackage(dir,intent());const cycle=structuredClone(result.index);cycle.artifacts[0].supersedes=cycle.artifacts[0].path;assert.throws(()=>validateIndex(cycle),/lineage/);
});
test('every required filing field is validated, including version and observed heads',t=>{
  const dir=fixture(t);const result=generatePackage(dir,intent());
  for(const field of Object.keys(result.manifest)){const invalid={...result.manifest};delete invalid[field];assert.throws(()=>validateManifest(invalid),undefined,field);}
  assert.throws(()=>validateManifest({...result.manifest,filingVersion:'2026-09-08'}));
  assert.throws(()=>validateIntent({...intent(),observedHeads:{main:'main',candidate:a,recovery:b}}));
});
test('private nested fields, credential strings, raw identifiers and disguised save payloads are rejected',()=>{
  for(const value of [{nested:{accountId:'private'}},{nested:[{token:'private'}]},'Bearer credential','person@example.com','pair_123456789secret'])assert.throws(()=>assertPrivacySafe(value));
  for(const nextExactAction of ['pair_123456789secret','token=private','{"saveLibrary":[1,2]}','A'.repeat(100)])assert.throws(()=>validateIntent({...intent(),nextExactAction}));
  assert.throws(()=>validateIntent({...intent(),nested:{payload:'private'}}));
});
test('finished response has exactly one final operational decision; obsolete reporting is rejected',()=>{
  assert.equal(validateFinishedResponse('Recovery readiness: RECOVERY_READY\nSSJR: 0/100\nMDP: 39.00/100\nDecision: CONTINUE\n'),true);
  for(const response of ['No final decision','Decision: CONTINUE\nMore text','Decision: CONTINUE\nDecision: TRANSITION','Decision: MAYBE'])assert.throws(()=>validateFinishedResponse(response));
  const registry=JSON.parse(fs.readFileSync('POS10_RETIRED_CONCEPTS.json','utf8'));
  const forbidden=registry.forbiddenPatterns.find(p=>/^[a-z ]+$/.test(p));
  assert.throws(()=>validateFinishedResponse(`${forbidden}: 10\nDecision: CONTINUE`));
  assert.throws(()=>validateFinishedResponse('Recovery readiness: RECOVERY_STALE\nDecision: CONTINUE'));
});
