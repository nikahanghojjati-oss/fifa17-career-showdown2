import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePublication,requiredChecks} from '../../scripts/pos10-publication.mjs';
import {routeFiles} from '../../scripts/pos10-impact-router.mjs';

const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
const state=()=>({recoveryState:'RECOVERY_READY',liveAuthorityResolved:true,successorDurable:true,candidateHead:a,expectedCandidateHead:a,recoveryHead:b,recoveryBranches:['recovery/unit'],recoveryDescendsFromCandidate:true,openAtomicUnits:1,localUnpublishedPackets:0,candidateValidation:'NOT_PUBLISHED',validationHead:null,targetedValidationHead:b,coherent:true,platformWarning:false,severeContextDamage:false,ownerRequestsTransfer:false,merged:false,postMergeMainResolved:false});
const route=routeFiles(['package.json']);
const promotion=()=>({action:'PROMOTE',liveState:state(),request:{expectedHead:a,targetHead:b,force:false},targetedValidation:{head:b,sourceFingerprint:'d'.repeat(64),passed:true}});
const merge=()=>({action:'MERGE',liveState:{...state(),candidateValidation:'GREEN',validationHead:a},request:{expectedHead:a,targetHead:a,force:false},checkRuns:requiredChecks(route).map(name=>({name,head:a,status:'completed',conclusion:'success'})),reviews:{head:a,observedAt:'2026-09-08T06:00:00Z',changeRequests:0,unresolvedThreads:0,commentsReviewed:true}});

test('promotion is one coherent nonforced exact recovery head with expected candidate protection',()=>{
  const allowed=evaluatePublication(promotion(),route);
  assert.equal(allowed.action,'PROMOTE');assert.equal(allowed.expectedHead,a);assert.equal(allowed.targetHead,b);assert.equal(allowed.force,false);
  for(const mutate of [p=>p.request.force=true,p=>p.request.expectedHead=c,p=>p.request.targetHead=c,p=>p.targetedValidation.head=c,p=>p.targetedValidation.passed=false,p=>p.liveState.coherent=false,p=>p.liveState.localUnpublishedPackets=1,p=>p.liveState.recoveryDescendsFromCandidate=false]){const invalid=promotion();mutate(invalid);assert.throws(()=>evaluatePublication(invalid,route));}
});
test('pending candidate validation rejects publication regardless of ready recovery work',()=>{
  const p=promotion();p.liveState.candidateValidation='PENDING';p.liveState.validationHead=a;assert.throws(()=>evaluatePublication(p,route));
});
test('merge requires all selected exact-head checks and protected merge request',()=>{
  const allowed=evaluatePublication(merge(),route);assert.equal(allowed.expected_head_sha,a);
  for(const mutate of [m=>m.request.expectedHead=c,m=>m.checkRuns.pop(),m=>m.checkRuns[0].head=c,m=>m.checkRuns[0].status='in_progress',m=>m.checkRuns[0].conclusion='skipped',m=>m.checkRuns.push({...m.checkRuns[0]}),m=>m.reviews.head=c,m=>m.reviews.changeRequests=1,m=>m.reviews.unresolvedThreads=1,m=>m.reviews.commentsReviewed=false]){const invalid=merge();mutate(invalid);assert.throws(()=>evaluatePublication(invalid,route));}
});
test('full seal contains every product proof group and operations check',()=>{
  const required=requiredChecks(route);
  for(const group of route.proofGroups)assert.ok(required.includes(`POS10 proof ${group}`));
  assert.ok(required.includes('POS10 operations authority'));
  assert.ok(required.includes('POS10 selected deterministic census'));
  assert.ok(required.includes('POS10 exact-head seal'));
});
