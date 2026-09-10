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

const seasonCommitInstall=bootstrap.indexOf('const seasonCommit=install("ssjr-production-season-commit"');
const seasonProtocolPrepare=bootstrap.indexOf('["ssjr-season-commit-protocol","js/sharedSeasonCommit.js","CareerModeSharedSeasonCommit"]');
const seasonProviderPrepare=bootstrap.indexOf('["ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js","CareerModeSparkSharedSeasonCommit"]');
const scoringProtocolPrepare=bootstrap.indexOf('["ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js","CareerModeSharedCanonicalScoring"]');
const scoringProviderPrepare=bootstrap.indexOf('["ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js","CareerModeSparkSharedCanonicalScoring"]');
const scoringInstall=bootstrap.indexOf('return install("ssjr-production-canonical-scoring"');
const historyProtocolPrepare=bootstrap.indexOf('["ssjr-history-convergence-protocol","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"]');
const historyProviderPrepare=bootstrap.indexOf('["ssjr-history-convergence-provider","js/sparkSharedHistoryConvergence.js","CareerModeSparkSharedHistoryConvergence"]');
const historyInstall=bootstrap.indexOf('return install("ssjr-production-history-convergence"');
assert.ok(seasonCommitInstall>=0,"Shared Journey bootstrap must keep one explicit r10 Season Commit production installation promise.");
assert.ok(seasonProtocolPrepare>seasonCommitInstall&&seasonProviderPrepare>seasonProtocolPrepare,"r10 protocol and provider prerequisites must be explicitly prepared after the r10 production wrapper is installed.");
assert.ok(scoringProtocolPrepare>seasonProviderPrepare&&scoringProviderPrepare>scoringProtocolPrepare&&scoringInstall>scoringProviderPrepare,"r11 protocol/provider factories must be prepared before the r11 production adapter is installed.");
assert.ok(historyProtocolPrepare>scoringInstall&&historyProviderPrepare>historyProtocolPrepare&&historyInstall>historyProviderPrepare,"r12 protocol/provider factories must be prepared after r11 and before the r12 production adapter is installed.");
assert.match(bootstrap,/await seasonCommit;/,"r11 preparation must wait for the r10 production adapter install promise.");
assert.match(bootstrap,/await canonicalScoring;/,"r12 preparation must wait for the r11 production adapter install promise.");

assert.doesNotMatch(source,/calculatePlayerSeasonScore|determineSeasonWinner|saveCurrentShowdown|persistCompletedSeason|localStorage\.setItem|sessionStorage\.setItem/);
assert.doesNotMatch(source,/runTransaction|\.set\(|\.update\(|\.delete\(/);
assert.match(source,/billingRequired:false/);assert.match(source,/blazeRequired:false/);assert.match(source,/cloudRunRequired:false/);assert.match(source,/cloudFunctionsRequired:false/);
process.stdout.write("PASS Shared Canonical Scoring production contracts: Shared Journey bootstrap deterministically prepares r10 protocol/provider factories before r11 installation and r11 protocol/provider factories before r12 installation; scoring stays dormant until cached r10 ACKNOWLEDGED revision 3 exists, refreshes exact provider authority, renders both managers' canonical score breakdown and winner in the existing Season Review, and remains read-only with zero canonical local-save mutation and Spark-only zero billing.\n");
