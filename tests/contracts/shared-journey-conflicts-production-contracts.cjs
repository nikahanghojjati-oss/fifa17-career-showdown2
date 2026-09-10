const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');

const coreSource=read('js/sharedJourneyConflicts.js');
const productionSource=read('js/productionSharedJourneyConflicts.js');
const setupProduction=read('js/productionSharedShowdownSetup.js');
const seasonProduction=read('js/productionSharedSeasonCommit.js');
const setupProvider=read('js/sparkSharedShowdownSetup.js');
const seasonProvider=read('js/sparkSharedSeasonCommit.js');
const bootstrap=read('js/ssjr.js');
const serviceWorker=read('service-worker.js');
const packageSource=read('package.json');

assert.match(coreSource,/RUNTIME_REVISION="1\.9\.1-r15"/);
assert.match(coreSource,/nonAuthorizingReceipts:true/);
assert.match(coreSource,/providerAuthorityPreserved:true/);
assert.match(coreSource,/alteredReplayPreProviderDenied:true/);
assert.match(coreSource,/boundedStaleRetry:true/);
assert.match(coreSource,/JOURNEY_CONFLICT_REPLAY_ALTERED/);
assert.match(coreSource,/JOURNEY_CONFLICT_RECEIPT_EXPIRED/);
assert.match(coreSource,/RESOURCE_EXHAUSTED/);
assert.match(coreSource,/PERMISSION_DENIED/);
assert.doesNotMatch(coreSource,/\blocalStorage\b/);
assert.doesNotMatch(coreSource,/firebase\/firestore|runTransaction|firebaseSdk|serverTimestamp|transaction\.(?:set|update|delete)\(|sdk\.(?:set|update|delete)\(/);

assert.match(productionSource,/runtimeRevision:RUNTIME_REVISION/);
assert.match(productionSource,/career-mode-shared-journey-conflict-state-change/);
assert.match(productionSource,/providerAuthorityPreserved:true/);
assert.match(productionSource,/nonAuthorizingReceipts:true/);
for(const lock of ['canonicalStorageMutation:false','providerWriteRequired:false','listPermissionRequired:false','billingRequired:false','blazeRequired:false','cloudRunRequired:false','cloudFunctionsRequired:false'])assert.ok(productionSource.includes(lock),lock);
assert.doesNotMatch(productionSource,/\blocalStorage\b/);
assert.doesNotMatch(productionSource,/firebase\/firestore|runTransaction|firebaseSdk|serverTimestamp|transaction\.(?:set|update|delete)\(|sdk\.(?:set|update|delete)\(/);

assert.match(setupProduction,/js\/productionSharedJourneyConflicts\.js/,'Shared Setup must load the r15 conflict guard at its existing production mutation surface.');
assert.match(setupProduction,/context\.conflicts\.execute\(/,'Shared Setup provider mutation must pass through r15 without moving provider authority.');
assert.match(setupProduction,/surface:"shared-setup"/);
assert.match(setupProduction,/authority:\{accountId:context\.accountId,deviceId:context\.deviceId,rivalryId:context\.rivalryId,sessionId:context\.sessionId,managerRole:context\.managerRole\}/);

assert.match(seasonProduction,/js\/productionSharedJourneyConflicts\.js/,'Season Commit must load the r15 conflict guard at its existing production mutation surface.');
assert.match(seasonProduction,/conflictGuard\.execute\(/,'Season Commit provider mutation must pass through r15.');
assert.match(seasonProduction,/surface:"season-commit"/);
assert.match(seasonProduction,/action:kind==="commit"\?"commit-season":"acknowledge-season"/);
assert.match(seasonProduction,/operationId,baseRevision/);
assert.match(seasonProduction,/SEASON_COMMIT_STALE_BASE_REVISION/,'existing bounded stale-CAS retry remains the provider-facing retry mechanism.');

// Existing provider modules remain the sole write/authorization authority inside Firestore transactions.
for(const source of [setupProvider,seasonProvider])assert.match(source,/runTransaction/);
for(const token of ['assertAccount','assertDevice','assertRivalry','assertSession'])assert.ok(setupProvider.includes(token),`Shared Setup provider missing ${token}`);
for(const token of ['scpAssertAccount','scpAssertDevice','scpAssertRivalry','scpAssertSession'])assert.ok(seasonProvider.includes(token),`Season Commit provider missing ${token}`);
assert.match(setupProvider,/error&&typeof error\.code==="string"\?error\.code:"SETUP_PROVIDER_FAILED"/,'Shared Setup must preserve provider error codes such as resource-exhausted.');
assert.match(seasonProvider,/error&&typeof error\.code==="string"\?error\.code:"SEASON_COMMIT_PROVIDER_FAILED"/,'Season Commit must preserve provider error codes such as resource-exhausted.');

assert.match(bootstrap,/ssjr-production-journey-reconnect/);
assert.match(bootstrap,/ssjr-production-journey-conflicts/);
assert.ok(bootstrap.indexOf('ssjr-production-journey-reconnect')<bootstrap.indexOf('ssjr-production-journey-conflicts'),'r14 recovery must bootstrap before r15 conflict observation.');
assert.match(serviceWorker,/js\/sharedJourneyConflicts\.js/);
assert.match(serviceWorker,/js\/productionSharedJourneyConflicts\.js/);
assert.match(packageSource,/test:ssjr:journey-conflicts/);
assert.match(packageSource,/shared-journey-conflicts-audit\.cjs/);

const production=require('../../js/productionSharedJourneyConflicts.js');
assert.equal(production.runtimeRevision,'1.9.1-r15');
assert.equal(production.providerAuthorityPreserved,true);
assert.equal(production.nonAuthorizingReceipts,true);
assert.equal(production.providerWriteRequired,false);
assert.equal(production.listPermissionRequired,false);
assert.equal(production.billingRequired,false);

console.log('PASS Journey Conflicts production contract: r15 wraps existing Shared Setup and Season Commit mutation surfaces, preserves transaction-derived provider authority/error codes, adds no write/list/local-save authority, and is retained in the reload shell after r14 recovery.');
