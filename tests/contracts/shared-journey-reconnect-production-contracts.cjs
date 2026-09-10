const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');

const production=read('js/productionSharedJourneyReconnect.js');
const coreSource=read('js/sharedJourneyReconnect.js');
const multiSource=read('js/sharedMultiSeasonProgression.js');
const entry=read('js/productionSharedJourneyEntry.js');
const bootstrap=read('js/ssjr.js');
const serviceWorker=read('service-worker.js');

assert.match(production,/runtimeRevision:"1\.9\.1-r14"/);
assert.match(production,/js\/sharedMultiSeasonProgression\.js/);
assert.match(production,/js\/sharedJourneyReconnect\.js/);
assert.ok(production.indexOf('js/sharedMultiSeasonProgression.js')<production.indexOf('js/sharedJourneyReconnect.js'),'r13 Multi Season verifier must load before r14 protocol capture.');
assert.match(production,/factory\.createProtocol\(\{multiSeasonModule:resolved\["ssjr-multi-season-protocol"\]\}\)/);
assert.match(production,/js\/productionSharedShowdownSetup\.js/);
assert.match(production,/js\/productionSharedMultiSeasonProgression\.js/);
assert.match(production,/js\/sparkRemoteJoining\.js/);
assert.match(production,/setupApi\.refresh\(\)/);
assert.match(production,/multiApi\.refresh\(\)/);
assert.match(production,/remoteApi\?\.getState/);
assert.match(production,/Number\.isFinite\(remoteExpiry\)&&now<remoteExpiry/,'r14 must require exact finite unexpired Remote Joining authority.');
assert.match(production,/if\(!pjrOnline\(\)\)return pjrOfflineHold\(\)/,'offline recovery must stop before provider Shared Setup/progression reads.');
assert.ok(production.indexOf('if(!pjrOnline())return pjrOfflineHold()')<production.indexOf('const setupResult=await setupApi.refresh()'),'offline hold must precede provider setup refresh.');
assert.match(production,/FRESH_SESSION_REQUIRED/);
assert.match(production,/ACTIVE_RECOVERED/);
assert.match(production,/TERMINAL_RECOVERED/);
assert.match(production,/sharedJourneyReconnectStatus/);
assert.match(production,/career-mode-shared-journey-reconnect-state-change/);
assert.match(production,/sessionAuthorityReplaceable:true/);
assert.match(production,/durableRivalryStatePreserved:true/);
assert.match(production,/expiredSessionNeverActive:true/);
assert.match(production,/offlineNeverAuthoritative:true/);
assert.match(production,/freshRuntimeRequiresReauthorization:true/);
assert.match(production,/dualManagerStatusVisible:true/);
assert.doesNotMatch(production,/\blocalStorage\b/);
assert.doesNotMatch(production,/saveCurrentShowdown|saveShowdown|careerModeShowdown\.saveLibrary/);
for(const lock of ['canonicalStorageMutation:false','providerWriteRequired:false','listPermissionRequired:false','billingRequired:false','blazeRequired:false','cloudRunRequired:false','cloudFunctionsRequired:false'])assert.ok(production.includes(lock),lock);

assert.match(entry,/Number\.isFinite\(remote\.expiresAtEpochMs\)&&Date\.now\(\)<remote\.expiresAtEpochMs/,'Shared Journey Entry must reject missing and nonfinite expiry.');
assert.doesNotMatch(entry,/!Number\.isFinite\(remote\.expiresAtEpochMs\)\|\|Date\.now\(\)<remote\.expiresAtEpochMs/,'the old permissive unknown-expiry ACTIVE condition must not return.');

assert.match(bootstrap,/ssjr-production-history-convergence/);
assert.match(bootstrap,/ssjr-production-multi-season/);
assert.match(bootstrap,/ssjr-journey-reconnect-protocol/);
assert.match(bootstrap,/ssjr-production-journey-reconnect/);
assert.ok(bootstrap.indexOf('ssjr-production-history-convergence')<bootstrap.indexOf('ssjr-production-multi-season'),'History Convergence must precede Multi Season.');
assert.ok(bootstrap.indexOf('ssjr-production-multi-season')<bootstrap.indexOf('ssjr-production-journey-reconnect'),'Multi Season must precede Journey Reconnect.');
assert.match(serviceWorker,/js\/sharedJourneyReconnect\.js/,'r14 protocol must survive reload/offline service-worker control.');
assert.match(serviceWorker,/js\/productionSharedJourneyReconnect\.js/,'r14 production adapter must survive reload/offline service-worker control.');

assert.match(coreSource,/RUNTIME_REVISION="1\.9\.1-r14"/);
assert.match(coreSource,/canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false/);
assert.match(multiSource,/RUNTIME_REVISION="1\.9\.1-r13"/);
const core=require('../../js/sharedJourneyReconnect.js');
const multi=require('../../js/sharedMultiSeasonProgression.js');
assert.equal(core.runtimeRevision,'1.9.1-r14');
assert.equal(core.providerWriteRequired,false);
assert.equal(core.listPermissionRequired,false);
assert.equal(core.billingRequired,false);
const protocol=core.createProtocol({multiSeasonModule:multi});
assert.equal(protocol.runtimeRevision,'1.9.1-r14');
assert.equal(protocol.providerWriteRequired,false);
assert.equal(protocol.listPermissionRequired,false);
assert.equal(protocol.billingRequired,false);

console.log('PASS Journey Reconnect production contract: strict finite ACTIVE session authority, ordered r12→r13→r14 bootstrap, read-only durable recovery, visible dual-manager status and permanent Spark zero-billing boundary.');
