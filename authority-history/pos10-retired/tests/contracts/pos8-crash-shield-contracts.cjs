const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

(async()=>{
  const mod=await import(pathToFileURL(path.resolve('scripts/pos8-crash-shield.mjs')).href);
  const shaA='a'.repeat(40),shaB='b'.repeat(40);
  const base={
    intentDurable:true,candidateHead:shaA,intentCandidateHead:shaA,recoveryHead:shaA,
    recoveryDescendsFromCandidate:true,candidateMovedSinceIntent:false,openAtomicUnits:1,
    localUnpublishedPackets:0,mutationPlanned:true,atomicReady:false,targetedValidationGreen:false,
    candidatePublished:false,exactHeadSealGreen:false,merged:false,platformWarning:false,
    severeContextDamage:false,liveAuthorityUnavailable:false
  };

  assert.equal(mod.assessRecovery({...base,intentDurable:false,intentCandidateHead:''}).action,'RECORD_INTENT');
  assert.equal(mod.assessRecovery(base).action,'WRITE_SHADOW');
  assert.equal(mod.assessRecovery({...base,recoveryHead:shaB}).action,'CONTINUE_SHADOW');
  assert.equal(mod.assessRecovery({...base,recoveryHead:shaB,atomicReady:true,targetedValidationGreen:true}).action,'PROMOTE_CANDIDATE');
  assert.equal(mod.assessRecovery({...base,candidatePublished:true}).action,'WAIT_EXACT_HEAD_SEAL');
  assert.equal(mod.assessRecovery({...base,candidatePublished:true,exactHeadSealGreen:true}).action,'MERGE_READY');
  assert.equal(mod.assessRecovery({...base,candidateMovedSinceIntent:true}).action,'RECONCILE_HEADS');
  assert.equal(mod.assessRecovery({...base,recoveryDescendsFromCandidate:false}).action,'RECONCILE_HEADS');
  assert.equal(mod.assessRecovery({...base,localUnpublishedPackets:2}).action,'HALT_AND_CHECKPOINT');
  assert.equal(mod.assessRecovery({...base,openAtomicUnits:2}).action,'HALT_AND_CHECKPOINT');
  assert.equal(mod.assessRecovery({...base,platformWarning:true,localUnpublishedPackets:1}).action,'CHECKPOINT_SHADOW_THEN_TRANSITION');
  assert.equal(mod.assessRecovery({...base,platformWarning:true}).action,'TRANSITION_NOW_RECOVERABLE');

  const block=mod.buildRecoveryBlock({schemaVersion:1,state:'INTENT_DURABLE',candidateBranch:'ops/example',recoveryBranch:'recovery/pr1-example',candidateHead:shaA,recoveryHead:shaA,nextAction:'continue'});
  assert.ok(Buffer.byteLength(block,'utf8')<=4096);
  assert.match(block,/POS8_RECOVERY_V1/);
  assert.throws(()=>mod.buildRecoveryBlock({token:'do-not-store'}),/sensitive key/i);
  assert.throws(()=>mod.buildRecoveryBlock({nested:{sessionId:'raw'}}),/sensitive key/i);

  console.log('PASS TX-8 crash shield: write-ahead intent, shadow recovery, single promotion, bounded volatile loss, and privacy-safe metadata.');
})().catch(error=>{console.error(error);process.exitCode=1;});
