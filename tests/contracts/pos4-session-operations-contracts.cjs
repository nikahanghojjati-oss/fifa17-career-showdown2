const assert=require("node:assert/strict");const path=require("node:path");const {pathToFileURL}=require("node:url");
(async()=>{
 const t=await import(pathToFileURL(path.resolve("scripts/pos4-transition.mjs")));const b=await import(pathToFileURL(path.resolve("scripts/build-recovery-beacon.mjs")));
 const s=o=>({...t.emptySignals(),...o});
 const q=t.assessTransition(s({}));assert.equal(q.status,"CONTINUE");assert.equal(q.percentage,null);assert.equal(q.recoveryBeaconDue,false);
 const processBudget=t.computeDebugBudget(s({failureClass:"PROCESS_DRIFT",unresolvedFailureFamilies:1,failureReproduced:true}));
 const productBudget=t.computeDebugBudget(s({failureClass:"PRODUCT_DEFECT",unresolvedFailureFamilies:3,unresolvedStates:2,failureReproduced:true}));
 assert.ok(processBudget>productBudget);assert.ok(processBudget<=20&&productBudget>=3);
 const flake=t.assessTransition(s({failureClass:"INFRA_FLAKE",unresolvedFailureFamilies:1,failedCorrectionCycles:10,failureReproduced:false}));assert.equal(flake.consumedCorrectionCycles,0);assert.equal(flake.status,"CONTINUE");
 const u=t.assessTransition(s({usageWarning:true,recoveryBeaconFresh:false}));assert.equal(u.status,"TRANSFER_NOW");assert.equal(u.generateResumeCapsule,true);assert.equal(u.recoveryBeaconDue,true);
 const a=t.assessTransition(s({usageWarning:true,atomicOperation:true}));assert.equal(a.status,"TRANSFER_AFTER_ATOMIC");
 const base="PR body";const beacon=b.buildRecoveryBeacon({repository:"owner/repo",branch:"fix/x",pr:215,head:"a".repeat(40),lane:"POS4",blockerClass:"TEST_DEFECT",lastSafeCheckpoint:"safe",nextAction:"next",updatedAt:"2026-09-08T00:00:00Z"});
 const once=b.upsertRecoveryBeacon(base,beacon);const twice=b.upsertRecoveryBeacon(once,beacon);assert.equal((twice.match(/POS4_RB1/g)||[]).length,2);assert.match(twice,/orientationOnly/);assert.match(twice,/recordedHead/);
 console.log("PASS POS v4 session operations: RB-1 is non-Git recovery state, TDS-2 has three categorical states, ADB-3 is failure-aware, and unreproduced infra flakes consume no debug attempt.");
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
