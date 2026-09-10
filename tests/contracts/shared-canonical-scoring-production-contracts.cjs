const assert=require("node:assert/strict");
const fs=require("node:fs");
const production=require("../../js/productionSharedCanonicalScoring.js");

assert.equal(production.feature,"ssjr-production-shared-canonical-scoring");
assert.equal(production.productionEnabled,true);assert.equal(production.runtimeRevision,"1.9.1-r11");
assert.equal(production.requiresAcknowledgedSeasonCommit,true);assert.equal(production.providerEnforcedSource,true);assert.equal(production.readOnlyDerivedProjection,true);
assert.equal(production.reusesSeasonReview,true);assert.equal(production.canonicalStorageMutation,false);assert.equal(production.authoritativeScoring,true);assert.equal(production.trustsSubmittedTotals,false);
assert.equal(production.billingRequired,false);assert.equal(production.blazeRequired,false);assert.equal(production.cloudRunRequired,false);assert.equal(production.cloudFunctionsRequired,false);
assert.equal(production.pollIntervalMs,15000);assert.equal(typeof production.install,"function");assert.equal(typeof production.refresh,"function");assert.equal(typeof production.getState,"function");

const source=fs.readFileSync("js/productionSharedCanonicalScoring.js","utf8");
const bootstrap=fs.readFileSync("js/ssjr.js","utf8");
assert.match(source,/productionSharedSeasonCommit\.js/);assert.match(source,/sparkSharedCanonicalScoring\.js/);assert.match(source,/productionFirebaseRuntime\.js/);
assert.match(source,/commitApi\.refresh\(\)/);assert.match(source,/state\.phase==="ACKNOWLEDGED"/);assert.match(source,/state\.revision===3/);assert.match(source,/provider\.read\(await pcscProviderOptions\(request\)\)/);
assert.match(source,/ensureAccountServices\(\)/);assert.match(source,/setup\.sessionId/);assert.match(source,/setup\.deviceId/);assert.match(source,/nowEpochMs:Date\.now\(\)/);
assert.match(source,/sharedCanonicalScoringPanel/);assert.match(source,/SHARED CANONICAL SCORE/);assert.match(source,/Champions League/);assert.match(source,/League Title/);assert.match(source,/Domestic Cup/);assert.match(source,/Performance Bonus/);assert.match(source,/Awards Bonus/);assert.match(source,/Season winner:/);
assert.match(bootstrap,/install\("ssjr-production-canonical-scoring","js\/productionSharedCanonicalScoring\.js","CareerModeProductionSharedCanonicalScoring"\)/);
assert.doesNotMatch(source,/calculatePlayerSeasonScore|determineSeasonWinner|saveCurrentShowdown|persistCompletedSeason|localStorage\.setItem|sessionStorage\.setItem/);
assert.doesNotMatch(source,/runTransaction|\.set\(|\.update\(|\.delete\(/);
assert.match(source,/billingRequired:false/);assert.match(source,/blazeRequired:false/);assert.match(source,/cloudRunRequired:false/);assert.match(source,/cloudFunctionsRequired:false/);
process.stdout.write("PASS Shared Canonical Scoring production contracts: r11 installs in the Shared Journey bootstrap, waits for provider-verified r10 ACKNOWLEDGED revision 3, refreshes exact account/device/rivalry/ACTIVE-session authority, renders both managers' canonical score breakdown and winner in the existing Season Review, and remains read-only with zero canonical local-save mutation and Spark-only zero billing.\n");
