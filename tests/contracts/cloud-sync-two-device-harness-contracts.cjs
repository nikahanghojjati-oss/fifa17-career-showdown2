const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const revisionSource=fs.readFileSync("js/cloudSyncRevisionModel.js","utf8");
const transactionSource=fs.readFileSync("js/storageTransaction.js","utf8");
const harnessSource=fs.readFileSync("js/cloudSyncTwoDeviceHarness.js","utf8");
const phase1e=fs.readFileSync("CLOUD_SYNC_READINESS_PHASE_1E.md","utf8");
const next=fs.readFileSync("NEXT_TASK.md","utf8");
const historicalStage5a=fs.readFileSync("START_NEXT_SESSION_V1.4.30_PR172_RJR87_STAGE5A_PRIVATE_SESSION_PROTOCOL.md","utf8");
const historicalNext=fs.readFileSync("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md","utf8");
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
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must stay coherent while dormant provider-neutral Phase 1E remains version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent while the provider-neutral Phase 1E harness stays dormant.");
assert.match(phase1e,/recursively frozen/i);
assert.match(phase1e,/Phase 1F[\s\S]+remains blocked/i);
assert.match(historicalNext,/CURRENT SUCCESSOR AUTHORITY — POST-PR #99 REMOTE JOINING RESTART/i,"Archived post-PR100/pre-gateway authority must retain its actual post-PR #99 successor heading as provenance.");
assert.match(historicalNext,/Stage 1 — Cloud \/ Sync Readiness Phase 1A through 1F — DONE \/ MERGED \/ PROTECTED/i,"Archived post-PR #99 authority must preserve completed Stage 1 Cloud/Sync truth.");
assert.match(next,/^# CURRENT TASK — SSJR-1\.1 PAIRED-FIRST PRODUCTION SHARED SETUP$/im,"Current NEXT_TASK must remain beyond historical Phase 1E/Stage5G and the already-published SSJR setup/provider candidate milestones, routing to paired-first production Shared Setup after verified PR201 closure.");
assert.match(next,/PR #201[\s\S]+production-two-account/i,"Current NEXT_TASK must preserve PR201 provider-candidate closure and require the still-missing production two-account layer before SSJR credit.");
assert.match(next,/PR #198[\s\S]+100\/100/i,"Current NEXT_TASK must identify the exact accepted RJR100 publication checkpoint.");
assert.match(next,/Shared Showdown Journey Readiness|SSJR-1/i,"Current NEXT_TASK must route the successor toward the post-RJR100 shared-journey program after clean handoff.");
assert.match(next,/Connected Rivalry[\s\S]+ACTIVE[\s\S]+league/i,"Current NEXT_TASK must preserve pairing plus exact ACTIVE session before any league selection.");
assert.doesNotMatch(next,/Phase 1E[\s\S]{0,160}CURRENT BOUNDED CANDIDATE/i,"Current NEXT_TASK must not revive historical Phase 1E as active product authority.");
assert.match(historicalStage5a,/^# START NEXT SESSION — v1\.4\.30 \/ PR #172 \/ RJR87 \/ Stage 5A Private Session Protocol$/im,"The immutable Stage 5A starter must preserve its exact PR172 / RJR87 / Stage 5A identity as historical provenance.");
assert.match(historicalStage5a,/PR #171 exact final head:[\s\S]{0,120}`d5c8549924244ee177065559043e0697d0c810c3`/i,"The immutable Stage 5A starter must preserve exact PR171 closure provenance.");
assert.match(historicalStage5a,/Stage 5 is no longer locked/i,"The immutable Stage 5A starter must preserve the explicit Stage 5 activation gate while dormant Phase 1E provenance stays archived.");

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
  assert.equal(Object.prototype.hasOwnProperty.call(created.authority(),"accountId"),false,"Internal Phase 1A compatibility scope must never escape as an authenticated account identity.");
  return created;
}

const h=build();
let snap=h.snapshot();
assert.equal(snap.devices.device_a.observedRevision,0);
assert.equal(snap.devices.device_b.observedRevision,0);
const a1=h.createIntent("device_a",{operation:"put",idempotencyKey:"key_a1",contentHash:hash("a"),payload:payload("A1")});
const b1=h.createIntent("device_b",{operation:"put",idempotencyKey:"key_b1",contentHash:hash("b"),payload:payload("B1")});
assert.equal(a1.intent.baseRevision,0);assert.equal(b1.intent.baseRevision,0);
assert.equal(Object.isFrozen(a1.intent),true,"Queued intent envelope must be immutable.");
assert.equal(Object.isFrozen(a1.intent.content),true,"Queued payload must be recursively immutable across retry/reconnect.");
const acceptedA=h.submitIntent(a1.intent);
assert.equal(acceptedA.status,"accepted");assert.equal(acceptedA.authoritativeRevision,1);
const staleB=h.submitIntent(b1.intent);
assert.equal(staleB.status,"conflict");assert.equal(staleB.conflict.requestedBaseRevision,0);assert.equal(staleB.conflict.remoteRevision,1);
const replayA=h.submitIntent(a1.intent);
assert.equal(replayA.status,"replayed");assert.equal(replayA.authoritativeRevision,1);assert.equal(h.authority().revision,1);
const changedReplay={...a1.intent,contentHash:hash("c"),content:payload("changed")};
const replayConflict=h.submitIntent(changedReplay);
assert.equal(replayConflict.status,"idempotency-conflict");assert.equal(h.authority().revision,1);

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
assert.equal(disabledIntent.status,"account-disabled");assert.equal(h.authority().revision,beforeInvalid);
h.setAccountState("acct_b","active");
const staleRelationshipIntent=h.createIntent("device_b",{operation:"put",idempotencyKey:"relationship-old",contentHash:hash("6"),payload:payload("relationship-old")});
h.setRelationshipState("revoked-read-only");
assert.equal(h.submitIntent(staleRelationshipIntent.intent).status,"relationship-revoked");assert.equal(h.authority().revision,beforeInvalid);
h.setRelationshipState("active");
h.setMembershipState("acct_b","relinquished");
const staleMembershipIntent=h.createIntent("device_b",{operation:"put",idempotencyKey:"member-old",contentHash:hash("7"),payload:payload("member-old")});
assert.equal(h.submitIntent(staleMembershipIntent.intent).status,"relationship-revoked");assert.equal(h.authority().revision,beforeInvalid);

const governance=build();
governance.setAccountState("acct_b","disabled");
let peerIntent=governance.createIntent("device_a",{operation:"put",idempotencyKey:"peer-disabled",contentHash:hash("c"),payload:payload("peer-disabled")});
let peerResult=governance.submitIntent(peerIntent.intent);
assert.equal(peerResult.status,"forbidden");assert.equal(peerResult.code,"REQUIRED_ACCOUNT_NOT_ACTIVE");assert.equal(governance.authority().revision,0);
governance.setAccountState("acct_b","active");
governance.setMembershipState("acct_b","retained");
peerIntent=governance.createIntent("device_a",{operation:"put",idempotencyKey:"peer-retained",contentHash:hash("d"),payload:payload("peer-retained")});
peerResult=governance.submitIntent(peerIntent.intent);
assert.equal(peerResult.status,"relationship-revoked");assert.equal(peerResult.code,"RIVALRY_MUTATION_FROZEN");assert.equal(governance.authority().revision,0);

const local=build();
const preview=local.previewLocalApply("device_a",{legacyShowdowns:'[{"id":"candidate"}]'});
assert.equal(preview.ok,true);
assert.equal(Object.isFrozen(preview.preview),true);assert.equal(Object.isFrozen(preview.preview.expectedRaw),true);assert.equal(Object.isFrozen(preview.preview.candidateRaw),true);
local.mutateLocalRaw("device_a","saveLibrary",'{"schemaVersion":2,"saves":[{"id":"newer"}]}');
const staleApply=local.applyLocalPreview(preview.preview);
assert.equal(staleApply.status,"stale-precondition");
assert.equal(staleApply.transaction.failurePhase,"precondition");
assert.equal(staleApply.localRaw.legacyShowdowns,'[]',"Movement in any reviewed canonical key must abort before candidate writes.");

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

process.stdout.write("PASS Phase 1E deterministic two-device/offline/reconnect synchronization harness contracts; historical dormant PR171/RJR87/Stage5A proof remains version-neutral while current RJR100/PR198 provenance stays coherent and NEXT_TASK advances beyond PR201 into paired-first production Shared Setup\n");