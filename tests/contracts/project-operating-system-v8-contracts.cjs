const assert=require('node:assert/strict');
const fs=require('node:fs');

const os=JSON.parse(fs.readFileSync('PROJECT_OPERATING_SYSTEM_V8.json','utf8'));
const recovery=JSON.parse(fs.readFileSync('POS8_RECOVERY_MODEL.json','utf8'));
const guards=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_GUARDS.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const agents=fs.readFileSync('AGENTS.md','utf8');
const next=fs.readFileSync('NEXT_TASK.md','utf8');

assert.equal(os.operatingSystem,'POS-8');
assert.equal(os.impactSelectionModel,'IMPACT-7');
assert.equal(os.recoveryModel,'TX-8');
assert.equal(os.shadowRecoveryModel,'SRB-8');
assert.equal(os.productCredit,0);
assert.equal(os.failClosed,true);
assert.equal(os.externalCrashTriggerClaim,'unknown-without-platform-telemetry');
assert.equal(recovery.limits.maxOpenAtomicUnits,1);
assert.equal(recovery.limits.maxLocalUnpublishedPackets,1);
assert.equal(recovery.limits.prRecoveryBlockMaxBytes,4096);
assert.equal(recovery.candidateCiRule.includes('shadow recovery branch'),true);
assert.equal(manifest.tests.length,60);
assert.equal(manifest.automaticOwner,'tests/support/run-selected-product-contracts.cjs');
assert.equal(pkg.scripts['work:transition'],'node scripts/pos8-crash-shield.mjs');
assert.equal(pkg.scripts['work:crash-shield'],'node scripts/pos8-crash-shield.mjs');
assert.match(agents,/PROJECT_OPERATING_SYSTEM_V8\.md/);
assert.match(agents,/shadow recovery branch/i);
assert.match(next,/POS8/i);
assert.match(next,/Shared Setup/i);

assert.equal(guards.provider.billingEnabled,false);
assert.equal(guards.provider.firebasePlan,'Spark');
assert.equal(guards.provider.blazeAllowed,false);
assert.equal(guards.provider.cloudRunAllowed,false);
assert.equal(guards.provider.cloudFunctionsAllowed,false);
assert.equal(guards.provider.appCheckEnforcement,false);
assert.equal(guards.product.managerCount,2);
assert.equal(guards.product.pairingAndExactActiveBeforeLeagueOrClubs,true);
assert.equal(guards.product.candidateCOnlyDestructiveRemoteToLocalApply,true);
assert.equal(guards.privacy.publicMatchmaking,false);
assert.equal(guards.privacy.durableRawPrivateIdentifiersAllowed,false);

console.log('PASS POS8 authority, TX-8/SRB-8 recovery locks, IMPACT-7 retention, and permanent product safety guards.');
