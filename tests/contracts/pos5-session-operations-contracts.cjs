const assert=require("node:assert/strict");
const {pathToFileURL}=require("node:url");
(async()=>{
  const session=await import(pathToFileURL("scripts/pos5-session-control.mjs"));
  const relay=await import(pathToFileURL("scripts/build-developer-relay.mjs"));
  const beacon=await import(pathToFileURL("scripts/build-recovery-beacon.mjs"));

  const clean=session.emptySignals();
  let r=session.assessRelay(clean);
  assert.equal(r.status,"CONTINUE");
  assert.equal(r.crashLossBudget,"1_AWU");

  r=session.assessRelay({...clean,uncheckpointedAtomicUnits:2});
  assert.equal(r.status,"RELAY_NOW");
  assert.match(r.reason,/CLB-1/);

  r=session.assessRelay({...clean,ownerReportedUsageWarning:true,atomicOperation:true});
  assert.equal(r.status,"RELAY_AFTER_ATOMIC");

  const high=session.computeDebugBudget({...clean,failureClass:"PROCESS_DRIFT"});
  const low=session.computeDebugBudget({...clean,failureClass:"PRODUCT_DEFECT",unresolvedFailureFamilies:4,unresolvedStates:4,contextDamageEvents:2,hardStateReconstruction:true,activeMutationLanes:2});
  assert.ok(high>low);
  assert.ok(high<=20&&low>=3);

  const drf=relay.buildDeveloperRelay({repository:"owner/repo",branch:"feature/x",pr:216,head:"abc",lane:"POS5",atomicWorkUnit:"AWU",lastSafeCheckpoint:"commit",validationSummary:"targeted green",unresolvedFailureClasses:["TEST_DEFECT"],nextAction:"reverify live head",relayReason:"usage warning"});
  assert.ok(Buffer.byteLength(drf,"utf8")<=relay.maxBytes);
  assert.match(drf,/Live verification first/);
  assert.doesNotMatch(drf,/START_NEXT_SESSION|SUCCESSOR_HANDOFF/);

  const b=beacon.buildRecoveryBeacon({repository:"owner/repo",branch:"feature/x",pr:216,head:"abc",lane:"POS5",atomicWorkUnit:"AWU",blockerClass:"TEST_DEFECT",lastSafeCheckpoint:"commit",nextAction:"reverify",validationSummary:"green"});
  assert.match(b,/POS5_RB2/);
  const twice=beacon.upsertRecoveryBeacon(beacon.upsertRecoveryBeacon("body",b),b);
  assert.equal((twice.match(/POS5_RB2/g)||[]).length,2,"one RB-2 block should contain exactly opening and closing markers after idempotent upsert");

  console.log("PASS POS5 session operations: one-AWU crash-loss budget, adaptive debugging, non-mutating RB-2 and bounded DRF-1 relay file.");
})().catch(e=>{console.error(e);process.exitCode=1;});
