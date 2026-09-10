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
assert.match(source,/productionSharedSeasonCommit\.js/);assert.match(source,/sparkSharedSeasonCommit\.js/);assert.match(source,/sparkSharedCanonicalScoring\.js/);assert.match(source,/productionFirebaseRuntime\.js/);
assert.ok(source.indexOf('js/sparkSharedSeasonCommit.js')<source.indexOf('js/sparkSharedCanonicalScoring.js'),"r10 Season Commit provider must load before the r11 Canonical Scoring provider factory initializes.");
const firstReadyGate=source.indexOf('if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}');
const commitRefresh=source.indexOf('await commitApi.refresh()');
assert.ok(firstReadyGate>=0&&commitRefresh>firstReadyGate,"r11 must remain dormant until cached r10 ACKNOWLEDGED authority exists before refreshing the Season Commit provider.");
assert.match(source,/commitApi\.refresh\(\)/);assert.match(source,/state\.phase==="ACKNOWLEDGED"/);assert.match(source,/state\.revision===3/);assert.match(source,/provider\.read\(await pcscProviderOptions\(request\)\)/);
assert.match(source,/ensureAccountServices\(\)/);assert.match(source,/setup\.sessionId/);assert.match(source,/setup\.deviceId/);assert.match(source,/nowEpochMs:Date\.now\(\)/);
assert.match(source,/sharedCanonicalScoringPanel/);assert.match(source,/SHARED CANONICAL SCORE/);assert.match(source,/Champions League/);assert.match(source,/League Title/);assert.match(source,/Domestic Cup/);assert.match(source,/Performance Bonus/);assert.match(source,/Awards Bonus/);assert.match(source,/Season winner:/);
assert.match(bootstrap,/const seasonCommit=install\("ssjr-production-season-commit","js\/productionSharedSeasonCommit\.js","CareerModeProductionSharedSeasonCommit"\)/,'Shared Journey bootstrap must keep one explicit r10 Season Commit installation promise');
assert.match(bootstrap,/const canonicalScoring=\(async\(\)=>\{await seasonCommit;return install\("ssjr-production-canonical-scoring","js\/productionSharedCanonicalScoring\.js","CareerModeProductionSharedCanonicalScoring"\);\}\)\(\)/,'r11 Canonical Scoring must not install before the r10 Season Commit production adapter is installed');
assert.match(bootstrap,/const historyConvergence=\(async\(\)=>\{await canonicalScoring;return install\("ssjr-production-history-convergence","js\/productionSharedHistoryConvergence\.js","CareerModeProductionSharedHistoryConvergence"\);\}\)\(\)/,'r12 History Convergence must install only after r11 Canonical Scoring is installed');
assert.doesNotMatch(source,/calculatePlayerSeasonScore|determineSeasonWinner|saveCurrentShowdown|persistCompletedSeason|localStorage\.setItem|sessionStorage\.setItem/);
assert.doesNotMatch(source,/runTransaction|\.set\(|\.update\(|\.delete\(/);
assert.match(source,/billingRequired:false/);assert.match(source,/blazeRequired:false/);assert.match(source,/cloudRunRequired:false/);assert.match(source,/cloudFunctionsRequired:false/);
process.stdout.write("PASS Shared Canonical Scoring production contracts: r11 installs only after the r10 Season Commit production adapter, and r12 History Convergence installs only after r11; the scoring adapter loads its r10 provider prerequisite before the scoring provider factory, stays dormant until cached r10 ACKNOWLEDGED revision 3 exists, then refreshes exact provider authority, renders both managers' canonical score breakdown and winner in the existing Season Review, and remains read-only with zero canonical local-save mutation and Spark-only zero billing.\n");
