const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const source=fs.readFileSync("js/cloudSyncRemoteContract.js","utf8");
const phase1a=fs.readFileSync("js/cloudSyncRevisionModel.js","utf8");
const contract=fs.readFileSync("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md","utf8");
const privacy=fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md","utf8");
const provider=fs.readFileSync("CLOUD_PROVIDER_DECISION_2026-08-17.md","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.doesNotMatch(source,/\blocalStorage\b/);
assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|WebSocket/);
assert.doesNotMatch(index,/cloudSyncRemoteContract\.js/);
assert.doesNotMatch(optional,/cloudSyncRemoteContract\.js/);
assert.doesNotMatch(worker,/cloudSyncRemoteContract\.js/);
assert.equal(pkg.version,"1.4.0","Architecture-only Phase 1D must not bump production app version.");
assert.match(index,/app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker,/RUNTIME_REVISION = "1\.4\.0-r1"/);
assert.doesNotMatch(index,/firebase|firestore/i,"Phase 1D must not connect Firebase in production shell.");
assert.doesNotMatch(optional,/firebase|firestore/i,"Phase 1D must not connect Firebase through optional modules.");

const window={};window.window=window;
vm.runInContext(source,vm.createContext({window,console,JSON,Object,Array,String,Number,Boolean}),{filename:"js/cloudSyncRemoteContract.js"});
const c=window.CareerModeRemoteContract;
assert.equal(c.contractVersion,1);
assert.equal(c.provider,"Firebase Authentication + Cloud Firestore candidate");
assert.equal(c.persistentOfflineCache,false);
assert.equal(c.publicDiscovery,false);
assert.equal(c.validateAuthorizationMatrix(),true,"Every object class must define create/read/update/delete/restore/invite/join/revoke authority.");

const expectedPaths={
  account:"accounts/{accountId}",
  profileLink:"accounts/{accountId}/profileLinks/{profileId}",
  device:"accounts/{accountId}/devices/{deviceId}",
  rivalry:"rivalries/{rivalryId}",
  sharedState:"rivalries/{rivalryId}/state/authoritative",
  invite:"rivalries/{rivalryId}/invites/{inviteId}",
  session:"rivalries/{rivalryId}/sessions/{sessionId}",
  idempotency:"rivalries/{rivalryId}/state/authoritative/idempotency/{idempotencyKeyHash}",
  securityEvent:"accounts/{accountId}/securityEvents/{eventId}"
};
for(const [key,path] of Object.entries(expectedPaths))assert.equal(c.paths[key],path,`Unexpected remote path for ${key}`);
for(const kind of ["account","profileLink","device","rivalry","sharedState","invite","session","idempotency","tombstone","securityEvent"]){
  assert.ok(c.schemas[kind],`Missing exact schema for ${kind}`);
  assert.ok(c.authorization[kind],`Missing authorization matrix for ${kind}`);
  for(const op of ["create","read","update","delete","restore","invite","join","revoke"]){
    assert.equal(typeof c.authorization[kind][op],"string",`${kind}.${op} authorization missing`);
  }
}
for(const field of ["schemaVersion","objectType","objectId","revision","parentRevision","lifecycleState","contentHash","priorContentHash","updatedByAccountId","updatedByDeviceId","data","tombstone"]){
  assert.ok(Array.from(c.envelopeFields).includes(field),`Missing revision envelope field ${field}`);
}
for(const field of ["slotId","accountId","profileId","displayLabel","entitlementState","deletionConsent"]){
  assert.ok(Array.from(c.schemas.rivalry.managerSlotFields).includes(field),`Missing manager slot field ${field}`);
}
for(const field of ["saveId","managerBindings","seasonIds","activeSeasonId","payloadFormatVersion","payload"]){
  assert.ok(Array.from(c.schemas.sharedState.dataFields).includes(field),`Missing shared state field ${field}`);
}

assert.deepEqual(Array.from(c.mutationPipeline),[
  "authenticate",
  "authorize",
  "read-authoritative-object",
  "compare-immutable-client-baseRevision",
  "reject-mismatch-explicitly",
  "verify-and-reserve-idempotency-replay-state",
  "perform-exactly-one-authorized-logical-mutation",
  "advance-to-exactly-next-monotonic-revision",
  "update-tombstone-state-when-applicable",
  "return-deterministic-success-or-explicit-conflict"
]);
const valid=c.validateMutationRequest({operation:"put",objectType:"sharedState",objectId:"rivalry_1",deviceId:"device_1",installationId:"installation_1",baseRevision:4,idempotencyKey:"key_1",payload:{}});
assert.equal(valid.ok,true);
const forged=c.validateMutationRequest({operation:"put",objectType:"sharedState",objectId:"rivalry_1",deviceId:"device_1",baseRevision:4,idempotencyKey:"key_1",accountId:"attacker"});
assert.equal(forged.ok,false);assert.equal(forged.code,"untrusted-account-field");
assert.ok(Array.from(c.request.immutableAcrossProviderRetries).includes("baseRevision"));
assert.match(c.replay.exactAcceptedReplay,/without-mutation-or-revision-increment/);
assert.match(c.replay.reusedKeyDifferentFingerprint,/idempotency-conflict/);

const conflict=c.conflictEnvelope({objectType:"sharedState",objectId:"rivalry_1",revision:9,contentHash:"sha256:abc",lifecycleState:"tombstoned"},4);
assert.deepEqual(JSON.parse(JSON.stringify(conflict)),{
  status:"conflict",code:"STALE_BASE_REVISION",baseRevision:4,
  authoritative:{objectType:"sharedState",objectId:"rivalry_1",revision:9,contentHash:"sha256:abc",tombstone:true}
});
assert.doesNotMatch(JSON.stringify(conflict),/payload|content\"/i,"Conflict authority must not leak full remote content.");

assert.equal(c.governance.exactlyTwoManagerSlots,true);
assert.match(c.governance.oneAccountDeletesItself,/remaining owner becomes retained read-only/);
assert.match(c.governance.oneAccountLeaves,/no shared gameplay deletion/);
assert.match(c.governance.oneAccountRevokesRelationship,/both entitled owners retain read\/export access/);
assert.match(c.governance.oneDeletionRequest,/do not delete while another entitled slot has not consented/);
assert.match(c.governance.bothDeletionRequests,/atomically tombstone/);
assert.match(c.governance.oneAccountDisabled,/preserve entitlement and never transfer ownership/);
assert.match(c.governance.staleDeviceReconnect,/cached membership never grants authority/);
assert.match(c.governance.ownershipTransfer,/unsupported; never inferred/);
assert.match(c.governance.soleRemainingOwnerDelete,/sole remaining entitled owner may explicitly consent/);
assert.equal(c.retention.inviteTerminalDays,7);
assert.equal(c.retention.idempotencyDays,7);
assert.equal(c.retention.securityEventDays,30);
assert.match(c.retention.tombstone,/lifetime-of-owning-account-or-connected-namespace/);
assert.match(Array.from(c.providerOwnership.neverDuplicate).join(" "),/refresh-tokens/);
assert.equal(Array.from(c.accountDeletionCascade).length,8);

for(const term of ["accountId","profileId","saveId","seasonId","deviceId","installationId","rivalryId","sessionId","inviteId","baseRevision","idempotency","tombstone"]){
  assert.ok(contract.includes(term),`Phase 1D document lost required term ${term}`);
}
for(const path of Object.values(expectedPaths))assert.ok(contract.includes(path),`Phase 1D document missing path ${path}`);
assert.match(contract,/deny-by-default/i);
assert.match(contract,/Every collection\/client `list` or broad query is denied/i);
assert.match(contract,/Display labels are presentation only/i);
assert.match(contract,/may never replace or refresh the original client's `baseRevision`/i);
assert.match(contract,/exact accepted replay[\s\S]+does not increment revision/i);
assert.match(contract,/One account deletes its account while the second remains[\s\S]+do not destroy shared gameplay data/i);
assert.match(contract,/One account revokes the relationship[\s\S]+retained read-only access/i);
assert.match(contract,/Both currently entitled managers request rivalry deletion[\s\S]+tombstone/i);
assert.match(contract,/One account is disabled[\s\S]+does not relinquish its entitlement/i);
assert.match(contract,/A stale registered device reconnects later[\s\S]+cannot resurrect/i);
assert.match(contract,/There is no ownership-transfer operation in Phase 1D/i);
assert.match(contract,/Firebase Authentication owns:[\s\S]+credentials[\s\S]+Application Firestore collections/i);
assert.match(contract,/Phase 1E: deterministic two-device plus offline\/reconnect synchronization harness/i);
assert.match(contract,/Firebase provider connection\/emulator\/Security Rules remains Phase 1F/i);
assert.match(contract,/This document does not authorize Cloud Functions, Blaze billing or any server deployment/i);
assert.match(contract,/Firestore persistent offline cache remains disabled/i);
assert.match(contract,/Public community|public community/i);
assert.match(contract,/global ranking/i);
assert.match(contract,/Candidate A export[\s\S]+Candidate B analysis[\s\S]+Candidate C recovery/i);

// Preserve Phase 1A's accepted replay semantics while Phase 1D defines the first-seen mutation pipeline.
assert.ok(phase1a.indexOf("const replay=safeLedger[request.idempotencyKey]")<phase1a.indexOf("if(request.baseRevision!==state.revision)"),"Phase 1A exact replay must remain a non-mutating preflight before stale-base rejection.");
assert.match(privacy,/shared two-owner rivalry when only one account requests deletion[\s\S]+Phase 1D/i);
assert.match(provider,/Firebase Authentication \+ Cloud Firestore/i);
assert.match(provider,/persistent offline cache[\s\S]+disabled/i);

process.stdout.write("PASS Phase 1D Firebase-compatible remote schema, API, authorization, replay and two-owner deletion contract\n");
