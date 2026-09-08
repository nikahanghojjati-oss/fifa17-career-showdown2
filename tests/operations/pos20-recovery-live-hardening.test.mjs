import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLiveContinuity,resolveLiveCandidateValidation,validateCurrentState} from '../../scripts/pos20-recovery.mjs';

const main='b'.repeat(40);
const head='a'.repeat(40);
const next='d'.repeat(40);
const other='c'.repeat(40);
const authority=()=>({operatingSystem:'POS20',objective:'Advance product',continuityState:'READY',liveFactsMustBeResolved:true,observedHeads:{main,candidate:head,recovery:head},candidateBranch:'ops/pos20',recoveryBranch:'recovery/pos20',cognitiveDecision:'EXECUTE',selectedAction:'Continue bounded work',evidenceDebt:{count:0},exactBlocker:'No blocker',nextVerification:'Verify live transaction'});
const continuity=()=>({repository:'o/r',ownerRequestsTransfer:false,openAtomicUnits:1,unpublishedPackets:0});
function check(name,status='completed',conclusion='success',id=1){return {id,name,head_sha:next,status,conclusion,started_at:`2026-09-08T18:0${id}:00Z`,completed_at:status==='completed'?`2026-09-08T18:0${id}:30Z`:null};}
function fakeClient(options={}){return {rest(endpoint){
  if(endpoint==='repos/o/r/git/ref/heads/main')return {object:{sha:options.mainHead||main}};
  if(endpoint==='repos/o/r/git/ref/heads/ops%2Fpos20')return {object:{sha:options.candidateHead||head}};
  if(endpoint==='repos/o/r/git/ref/heads/recovery%2Fpos20')return {object:{sha:options.recoveryHead||head}};
  if(endpoint.startsWith('repos/o/r/pulls?'))return options.pulls||[];
  if(endpoint.includes('/check-runs?')){const runs=options.checkRuns||[];return {total_count:options.totalCount??runs.length,check_runs:runs};}
  if(endpoint.includes('/compare/')){
    const pair=endpoint.split('/compare/')[1];
    if(options.compares?.[pair])return options.compares[pair];
    const [base,target]=pair.split('...');
    if(base===target)return {status:'identical',ahead_by:0,behind_by:0,merge_base_commit:{sha:base}};
    if(base===head&&target===next)return {status:'ahead',ahead_by:1,behind_by:0,merge_base_commit:{sha:head}};
    return {status:'diverged',ahead_by:1,behind_by:1,merge_base_commit:{sha:other}};
  }
  throw new Error(`unexpected REST endpoint ${endpoint}`);
}};}
function publishedClient(checkRuns=[check('POS20 exact selector','in_progress',null,2)]){return fakeClient({candidateHead:next,recoveryHead:next,pulls:[{number:7,state:'open',base:{ref:'main'},head:{ref:'ops/pos20',sha:next}}],checkRuns});}

test('unchanged unpublished transaction permits bounded recovery work from durable authority',()=>{const d=resolveLiveContinuity(continuity(),authority(),fakeClient());assert.equal(d.action,'EXECUTE_SELECTED_ACTION');assert.equal(d.live.candidateValidation,'NOT_PUBLISHED');});
test('caller cannot supply expected heads checkpoint candidate validation or continuity as authority',()=>{for(const [key,value] of [['expectedCandidateHead',next],['checkpointHead',next],['candidateValidation','NOT_PUBLISHED'],['headsMatchExpectation',true],['continuityState','READY']])assert.throws(()=>resolveLiveContinuity({...continuity(),[key]:value},authority(),fakeClient()),/Caller-controlled live authority field forbidden/);});
test('durable non-ready continuity cannot be overridden and forces recovery',()=>{for(const continuityState of ['STALE','BLOCKED']){const durable={...authority(),continuityState};const d=resolveLiveContinuity(continuity(),durable,fakeClient());assert.equal(d.action,'REFRESH_RECOVERY');assert.equal(d.decision,'TRANSITION');assert.equal(d.live.durableContinuityState,continuityState);}});
test('both refs moving together without live publication requires reconciliation',()=>{const d=resolveLiveContinuity(continuity(),authority(),fakeClient({candidateHead:next,recoveryHead:next}));assert.equal(d.action,'RECONCILE_HEADS');assert.equal(d.live.headsMatchExpectation,false);});
test('one bounded recovery-only commit remains recoverable before publication',()=>{const d=resolveLiveContinuity(continuity(),authority(),fakeClient({recoveryHead:next}));assert.equal(d.action,'EXECUTE_SELECTED_ACTION');assert.equal(d.live.durableCheckpoint,true);});
test('live pending validation overrides any stale saved notion and freezes candidate mutation',()=>{const d=resolveLiveContinuity(continuity(),authority(),publishedClient());assert.equal(d.action,'WAIT_VALIDATION');assert.equal(d.live.candidateValidation,'PENDING');});
test('live failed exact-head validation routes to failure inspection',()=>{const d=resolveLiveContinuity(continuity(),authority(),publishedClient([check('POS20 operations authority','completed','failure',2)]));assert.equal(d.action,'INSPECT_EXACT_FAILURES');assert.equal(d.live.candidateValidation,'FAILED');});
test('live exact-head cognitive seal success derives GREEN',()=>{const d=resolveLiveContinuity(continuity(),authority(),publishedClient([check('POS20 exact selector','completed','success',1),check('POS20 exact-head cognitive seal','completed','success',2)]));assert.equal(d.action,'RECHECK_REVIEWS');assert.equal(d.live.candidateValidation,'GREEN');});
test('incomplete check-run evidence fails closed',()=>{assert.throws(()=>resolveLiveCandidateValidation('o/r','ops/pos20',next,fakeClient({pulls:[{number:7,state:'open',base:{ref:'main'},head:{ref:'ops/pos20',sha:next}}],checkRuns:[check('POS20 exact selector','completed','success',1)],totalCount:2})),/incomplete/);});
test('a second candidate generation beyond durable anchor is rejected even if published',()=>{const newer='e'.repeat(40);const client=fakeClient({candidateHead:newer,recoveryHead:newer,pulls:[{number:7,state:'open',base:{ref:'main'},head:{ref:'ops/pos20',sha:newer}}],checkRuns:[{...check('POS20 exact selector','in_progress',null,2),head_sha:newer}],compares:{[`${head}...${newer}`]:{status:'ahead',ahead_by:2,behind_by:0,merge_base_commit:{sha:head}},[`${newer}...${newer}`]:{status:'identical',ahead_by:0,behind_by:0,merge_base_commit:{sha:newer}}}});const d=resolveLiveContinuity(continuity(),authority(),client);assert.notEqual(d.action,'EXECUTE_SELECTED_ACTION');assert.equal(d.decision,'TRANSITION');});
test('current state still rejects every retired and unknown field',()=>{const state=authority();assert.equal(validateCurrentState(state).operatingSystem,'POS20');for(const key of ['handoffProximity','handoffPercentage','estimatedFocusedSessions'])assert.throws(()=>validateCurrentState({...state,[key]:25}),/Retired state field forbidden/);assert.throws(()=>validateCurrentState({...state,futureUnknownAuthority:'x'}),/Unknown current-state field/);});
