import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLiveContinuity,validateCurrentState} from '../../scripts/pos20-recovery.mjs';

const main='b'.repeat(40);
const head='a'.repeat(40);
const other='c'.repeat(40);
const authority=()=>({
  operatingSystem:'POS20',objective:'Advance product',continuityState:'READY',liveFactsMustBeResolved:true,
  observedHeads:{main,candidate:head,recovery:head},candidateBranch:'ops/pos20',recoveryBranch:'recovery/pos20',
  cognitiveDecision:'EXECUTE',selectedAction:'Continue bounded work',evidenceDebt:{count:0},exactBlocker:'No blocker',nextVerification:'Verify live transaction'
});
const continuity=()=>({
  repository:'o/r',continuityState:'READY',ownerRequestsTransfer:false,
  liveAuthorityResolved:true,durableCheckpoint:true,headsMatchExpectation:true,recoveryDescendsFromCandidate:true,
  openAtomicUnits:1,unpublishedPackets:0,candidateValidation:'NOT_PUBLISHED',
  expectedMainHead:main,expectedCandidateHead:head,expectedRecoveryHead:head,checkpointHead:head
});
function fakeClient(options={}){
  return {rest(endpoint){
    if(endpoint==='repos/o/r/git/ref/heads/main')return {object:{sha:options.mainHead||main}};
    if(endpoint==='repos/o/r/git/ref/heads/ops%2Fpos20')return {object:{sha:options.candidateHead||head}};
    if(endpoint==='repos/o/r/git/ref/heads/recovery%2Fpos20')return {object:{sha:options.recoveryHead||head}};
    if(endpoint.includes('/compare/'))return {status:options.compareStatus||'identical',merge_base_commit:{sha:options.mergeBase||head}};
    throw new Error(`unexpected REST endpoint ${endpoint}`);
  }};
}

test('live recovery entrypoint recomputes refs ancestry and checkpoint before continuing',()=>{
  const decision=resolveLiveContinuity(continuity(),authority(),fakeClient());
  assert.equal(decision.action,'EXECUTE_SELECTED_ACTION');
  assert.equal(decision.live.candidateHead,head);
  assert.equal(decision.live.recoveryHead,head);
  assert.equal(decision.live.durableCheckpoint,true);
  assert.equal(decision.live.recoveryDescendsFromCandidate,true);
});

test('saved true booleans cannot authorize continuation after a recovery ref moves',()=>{
  const decision=resolveLiveContinuity(continuity(),authority(),fakeClient({recoveryHead:other}));
  assert.equal(decision.decision,'TRANSITION');
  assert.equal(decision.action,'REFRESH_RECOVERY');
  assert.equal(decision.live.recoveryHead,other);
});

test('live recovery entrypoint blocks stale checkpoint main drift and broken ancestry',()=>{
  assert.equal(resolveLiveContinuity({...continuity(),checkpointHead:other},authority(),fakeClient()).action,'REFRESH_RECOVERY');
  assert.equal(resolveLiveContinuity(continuity(),authority(),fakeClient({mainHead:other})).action,'RECONCILE_HEADS');
  assert.equal(resolveLiveContinuity(continuity(),authority(),fakeClient({mergeBase:other,compareStatus:'ahead'})).action,'RECONCILE_HEADS');
});

test('live recovery metadata is exact and fail closed',()=>{
  assert.throws(()=>resolveLiveContinuity({...continuity(),expectedCandidateHead:'bad'},authority(),fakeClient()),/exact commit SHA/);
  assert.throws(()=>resolveLiveContinuity({...continuity(),repository:'not-a-repo'},authority(),fakeClient()),/owner\/name/);
});

test('current state rejects every registry-retired progress field and unknown fields',()=>{
  const state=authority();
  assert.equal(validateCurrentState(state).operatingSystem,'POS20');
  for(const key of ['handoffProximity','handoffPercentage','estimatedFocusedSessions'])assert.throws(()=>validateCurrentState({...state,[key]:25}),/Retired state field forbidden/);
  assert.throws(()=>validateCurrentState({...state,futureUnknownAuthority:'x'}),/Unknown current-state field/);
});

test('retired fields are rejected recursively rather than only as top-level spellings',()=>{
  const state=authority();
  assert.throws(()=>validateCurrentState({...state,evidenceDebt:{count:0,handoffPercentage:50}}),/Retired state field forbidden/);
});
