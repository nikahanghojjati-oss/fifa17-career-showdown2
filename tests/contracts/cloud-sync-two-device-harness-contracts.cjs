const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const revisionSource=fs.readFileSync("js/cloudSyncRevisionModel.js","utf8");
const transactionSource=fs.readFileSync("js/storageTransaction.js","utf8");
const harnessSource=fs.readFileSync("js/cloudSyncTwoDeviceHarness.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.doesNotMatch(harnessSource,/\blocalStorage\b/);
assert.doesNotMatch(harnessSource,/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
assert.doesNotMatch(harnessSource,/firebase|firestore/i);
assert.doesNotMatch(index,/cloudSyncTwoDeviceHarness\.js/);
assert.doesNotMatch(optional,/cloudSyncTwoDeviceHarness\.js/);
assert.doesNotMatch(worker,/cloudSyncTwoDeviceHarness\.js/);
assert.equal(pkg.version,"1.4.0","Dormant Phase 1E proof must not bump production application version.");
assert.match(index,/app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker,/RUNTIME_REVISION = "1\.4\.0-r1"/);

const window={};window.window=window;
const context=vm.createContext({window,console,JSON,Object,Array,String,Number,Boolean,Set,Map,Error});
vm.runInContext(revisionSource,context,{filename:"js/cloudSyncRevisionModel.js"});
vm.runInContext(transactionSource,context,{filename:"js/storageTransaction.js"});
vm.runInContext(harnessSource,context,{filename:"js/cloudSyncTwoDeviceHarness.js"});
const H=window.CareerModeTwoDeviceSyncHarness;
assert.equal(H.contractVersion,1);
assert.equal(H.providerNeutral,true);
assert.deepEqual(Array.from(H.canonicalLocalKeys),["saveLibrary","legacyShowdowns","preferences"]);

const hash=char=>`sha256:${char.repeat(64)}`;
const payload=(value,version=1)=>({payloadFormatVersion:version,value});
const rawSeed={
  saveLibrary:'{"schemaVersion":2,"saves":[]}',
  legacyShowdowns:'[]',
  preferences:'{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
};
function build(){
  const created=H.createHarness({
    rivalryId:"rivalry_1",
    accounts:{acct_a:{state:"active"},acct_b:{state:"active"}},
    devices:{
      device_a:{accountId:"acct_a",online:true,localRaw:rawSeed},
      device_b:{accountId:"acct_b",online:true,localRaw:rawSeed}
    },
    initialAuthority:{revision:0,contentHash:hash("0"),content:payload("seed")},
    supportedPayloadFormatVersions:[1]
  });
  assert.equal(created.ok,true);
  return created;
}

// 1-5: two devices share one base, accepted A, stale B, exact replay, mismatched replay.
const h=build();
let snap=h.snapshot();
assert.equal(snap.devices.device_a.observedRevision,0);
assert.equal(snap.devices.device_b.observedRevision,0);
const a1=h.createIntent("device_a",{operation:"put",idempotencyKey:"key_a1",contentHash:hash("a"),payload:payload("A1")});
const b1=h.createIntent("device_b",{operation:"put",idempotencyKey:"key_b1",contentHash:hash("b"),payload:payload("B1")});
assert.equal(a1.intent.baseRevision,0);assert.equal(b1.intent.baseRevision,0);
const acceptedA=h.submitIntent(a1.intent);
assert.equal(acceptedA.status,"accepted");assert.equal(acceptedA.authoritativeRevision,1);
const staleB=h.submitIntent(b1.intent);
assert.equal(staleB.status,"conflict");assert.equal(staleB.conflict.requestedBaseRevision,0);assert.equal(staleB.conflict.remoteRevision,1);
const replayA=h.submitIntent(a1.intent);
assert.equal(replayA.status,"replayed");assert.equal(replayA.authoritativeRevision,1);assert.equal(h.authority().revision,1);
const changedReplay={...a1.intent,contentHash:hash("c"),content:payload("changed")};
const replayConflict=h.submitIntent(changedReplay);
assert.equal(replayConflict.status,"idempotency-conflict");assert.equal(h.authority().revision,1);

// 6-8: tombstone, long-offline anti-resurrection, explicit restore is separate.
assert.equal(h.reconnect("device_b").observedRevision,1);
h.setDeviceOnline("device_b",false);
const staleOfflinePut=h.createIntent("device_b",{operation:"put",idempotencyKey:"key_offline_old",contentHash:hash("d"),payload:payload("offline-old")});
assert.equal(staleOfflinePut.intent.baseRevision,1);
const deleteA=h.createIntent("device_a",{operation:"delete",idempotencyKey:"key_delete"});
const deleted=h.submitIntent(deleteA.intent);
assert.equal(deleted.status,"accepted");assert.equal(h.authority().revision,2);assert.equal(h.authority().tombstone,true);
h.setDeviceOnline("device_b",true);
const reconnectAfterDelete=h.reconnect("device_b");
assert.equal(reconnectAfterDelete.observedRevision,2);assert.equal(reconnectAfterDelete.observedTombstone,true);
assert.equal(staleOfflinePut.intent.baseRevision,1,"Offline intent must retain its original base after reconnect.");
const resurrectionAttempt=h.submitIntent(staleOfflinePut.intent);
assert.equal(resurrectionAttempt.status,"conflict");assert.equal(resurrectionAttempt.conflict.remoteTombstone,true);
const restoreB=h.createIntent("device_b",{operation:"restore",idempotencyKey:"key_restore",contentHash:hash("e"),payload:payload("restored")});
assert.equal(restoreB.intent.baseRevision,2);
const restored=h.submitIntent(restoreB.intent);
assert.equal(restored.status,"accepted");assert.equal(h.authority().revision,3);assert.equal(h.authority().tombstone,false);

// 9-12: interrupted/provider-style retry and offline intent never silently rebase; reconnect refreshes observation only.
h.reconnect("device_a");h.reconnect("device_b");
const retryOriginal=h.createIntent("device_a",{operation:"put",idempotencyKey:"key_retry_a",contentHash:hash("f"),payload:payload("retry-A")});
const retryIntervening=h.createIntent("device_b",{operation:"put",idempotencyKey:"key_retry_b",contentHash:hash("1"),payload:payload("retry-B")});
assert.equal(retryOriginal.intent.baseRevision,3);assert.equal(retryIntervening.intent.baseRevision,3);
const retry=h.simulateProviderRetry(retryOriginal.intent,{interveningIntent:retryIntervening.intent});
assert.equal(retry.interveningResult.status,"accepted");
assert.equal(retry.firstReadRevision,3);assert.equal(retry.retryReadRevision,4);
assert.equal(retry.originalBaseRevision,3);assert.equal(retry.retryBaseRevision,3);
assert.equal(retry.status,"conflict");assert.equal(retry.result.conflict.requestedBaseRevision,3);

h.reconnect("device_a");
h.setDeviceOnline("device_a",false);
const queuedA=h.createIntent("device_a",{operation:"put",idempotencyKey:"key_queued",contentHash:hash("2"),payload:payload("queued")});
assert.equal(queuedA.intent.baseRevision,4);
h.reconnect("device_b");
const bNext=h.createIntent("device_b",{operation:"put",idempotencyKey:"key_b_next",contentHash:hash("3"),payload:payload("B-next")});
assert.equal(h.submitIntent(bNext.intent).status,"accepted");assert.equal(h.authority().revision,5);
h.setDeviceOnline("device_a",true);
const reconnectedA=h.reconnect("device_a");
assert.equal(reconnectedA.previousObservedRevision,4);assert.equal(reconnectedA.observedRevision,5);
assert.equal(queuedA.intent.baseRevision,4,"Reconnect must not rewrite queued intent baseRevision.");
assert.equal(h.submitIntent(queuedA.intent).status,"conflict");

// 13-17: revocation/disable/membership authority and invalid payloads reject before remote mutation.
const beforeInvalid=h.authority().revision;
const unsupported=h.createIntent("device_b",{operation:"put",idempotencyKey:"unsupported",contentHash:hash("4"),payload:payload("future",2)});
assert.equal(unsupported.status,"unsupported-payload");assert.equal(h.authority().revision,beforeInvalid);
const malformed=h.createIntent("device_b",{operation:"put",idempotencyKey:"malformed",contentHash:"not-a-hash",payload:payload("bad")});
assert.equal(malformed.status,"invalid-request");assert.equal(h.authority().revision,beforeInvalid);

h.reconnect("device_a");
const revokedIntent=h.createIntent("device_a",{operation:"put",idempotencyKey:"revoked",contentHash:hash("5"),payload:payload("revoked")});
h.revokeDevice("device_a");
assert.equal(h.submitIntent(revokedIntent.intent).status,"device-revoked");assert.equal(h.authority().revision,beforeInvalid);

h.setAccountState("acct_b","disabled");
const disabledIntent=h.createIntent("device_b",{operation:"put",idempotencyKey:"disabled",contentHash:hash("6"),payload:payload("disabled")});
assert.equal(h.submitIntent(disabledIntent.intent).status,"account-disabled");assert.equal(h.authority().revision,beforeInvalid);
h.setAccountState("acct_b","active");
h.setMembershipState("acct_b","relinquished");
const staleMembershipIntent=h.createIntent("device_b",{operation:"put",idempotencyKey:"member-old",contentHash:hash("7"),payload:payload("member-old")});
assert.equal(h.submitIntent(staleMembershipIntent.intent).status,"relationship-revoked");assert.equal(h.authority().revision,beforeInvalid);

// 18-19: local preview movement and rollback ownership failure cannot clobber newer local bytes.
const local=build();
const preview=local.previewLocalApply("device_a",{
  legacyShowdowns:'[{"id":"candidate"}]',
  preferences:'{"schemaVersion":2,"reducedMotion":true,"menuFeedback":true}'
});
assert.equal(preview.ok,true);
local.mutateLocalRaw("device_a","preferences",'{"schemaVersion":2,"reducedMotion":false,"menuFeedback":false}');
const staleApply=local.applyLocalPreview(preview.preview);
assert.equal(staleApply.status,"stale-precondition");
assert.equal(staleApply.transaction.failurePhase,"precondition");
assert.equal(staleApply.localRaw.legacyShowdowns,'[]',"Stale preview must abort before candidate writes.");

const ownership=build();
const ownershipPreview=ownership.previewLocalApply("device_a",{
  legacyShowdowns:'[{"id":"candidate"}]',
  preferences:'{"schemaVersion":2,"reducedMotion":true,"menuFeedback":true}'
});
const newerLegacy='[{"id":"newer-local"}]';
const failedApply=ownership.applyLocalPreview(ownershipPreview.preview,{
  failCommitKey:"preferences",
  concurrentMutationOnFailure:{key:"legacyShowdowns",value:newerLegacy}
});
assert.equal(failedApply.status,"rollback-failed-critical");
assert.ok(Array.from(failedApply.transaction.rollbackOwnershipConflicts).includes("legacyShowdowns"));
assert.equal(failedApply.localRaw.legacyShowdowns,newerLegacy,"Rollback must not clobber bytes it no longer owns.");

// 20-24: cloud disable preserves local-only Save Library and recovery authorities; no provider/network dependency.
const disabled=build();
disabled.setRemoteEnabled(false);
const capabilities=disabled.localCapabilities();
assert.equal(capabilities.localSaveLibraryUsable,true);
assert.equal(capabilities.candidateAExport,"available-non-mutating");
assert.equal(capabilities.candidateBAnalysis,"read-only");
assert.equal(capabilities.candidateCApply,"exclusive-destructive-authority");
assert.deepEqual(Array.from(capabilities.canonicalStorageKeys),["saveLibrary","legacyShowdowns","preferences"]);
const remoteDisabledIntent=disabled.createIntent("device_a",{operation:"put",idempotencyKey:"remote-off",contentHash:hash("8"),payload:payload("local-only")});
assert.equal(disabled.submitIntent(remoteDisabledIntent.intent).status,"remote-disabled");assert.equal(disabled.authority().revision,0);

// 25: repeated equivalent executions produce an identical deterministic final state.
function deterministicRun(){
  const x=build();
  const i1=x.createIntent("device_a",{operation:"put",idempotencyKey:"det-a",contentHash:hash("9"),payload:payload("A")});
  const i2=x.createIntent("device_b",{operation:"put",idempotencyKey:"det-b",contentHash:hash("a"),payload:payload("B")});
  assert.equal(x.submitIntent(i1.intent).status,"accepted");
  assert.equal(x.submitIntent(i2.intent).status,"conflict");
  x.reconnect("device_b");
  const del=x.createIntent("device_b",{operation:"delete",idempotencyKey:"det-del"});
  assert.equal(x.submitIntent(del.intent).status,"accepted");
  x.reconnect("device_a");
  const restore=x.createIntent("device_a",{operation:"restore",idempotencyKey:"det-restore",contentHash:hash("b"),payload:payload("restored")});
  assert.equal(x.submitIntent(restore.intent).status,"accepted");
  return x.snapshot();
}
assert.deepEqual(deterministicRun(),deterministicRun());

process.stdout.write("PASS Phase 1E deterministic two-device/offline/reconnect synchronization harness contracts\n");
