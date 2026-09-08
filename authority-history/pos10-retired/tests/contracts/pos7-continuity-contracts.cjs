const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
  const c=await import(pathToFileURL('scripts/pos7-continuity.mjs'));
  const base=c.emptySignals();
  const clean=c.scoreContinuity({...base,failureClass:'TEST_DEFECT'});
  assert.equal(clean.model,'CWS-7'); assert.equal(clean.decision,'CONTINUE');
  const telemetry=c.scoreContinuity({...base,failureClass:'TEST_DEFECT',contextTelemetryAvailable:true,contextRemainingPercent:12,atomicOperation:true});
  assert.equal(telemetry.components.contextSaturation,88); assert.equal(telemetry.decision,'TRANSITION_AFTER_ATOMIC'); assert.equal(telemetry.contextTelemetryUsed,true);
  const fallback=c.scoreContinuity({...base,failureClass:'TEST_DEFECT',compactionEvents:2,stateReconstructionEvents:1,earlierExactDetailLossEvents:1,repeatedRetrievalEvents:2});
  assert.ok(fallback.components.contextSaturation>=70); assert.ok(['TRANSITION_NOW','TRANSITION_AFTER_ATOMIC'].includes(fallback.decision));
  const flake=c.scoreContinuity({...base,failureClass:'INFRA_FLAKE',failureReproduced:false,failedCorrectionCycles:9,unresolvedFailureFamilies:1});
  assert.equal(flake.consumedCorrectionCycles,0,'Unreproduced infrastructure flake must consume zero correction cycles.');
  const owner=c.scoreContinuity({...base,ownerRequestsTransition:true});
  assert.equal(owner.score,100); assert.equal(owner.decision,'TRANSITION_NOW');
  console.log('PASS CWS-7 observable context saturation, ADB-7 accounting, and deterministic transition bands.');
})().catch(error=>{console.error(error);process.exitCode=1;});
