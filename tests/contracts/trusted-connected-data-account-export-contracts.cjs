const assert=require("node:assert/strict");
const fs=require("node:fs");
const connectedExport=require("../../js/trustedConnectedDataAccountExport.js");

const source=fs.readFileSync("js/trustedConnectedDataAccountExport.js","utf8");
const rules=fs.readFileSync("firestore.rules","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.equal(connectedExport.productionRuntimeConnected,false);
assert.equal(connectedExport.productionProvisioningAuthorized,false);
assert.equal(connectedExport.trustedServerOnly,true);
assert.equal(connectedExport.browserFirestoreWrites,"deny-all");
assert.equal(connectedExport.accountIdentitySource,"verified Firebase UID only");
assert.equal(connectedExport.exportRequiresActiveAccount,true);
assert.equal(connectedExport.exportIsNonMutating,true);
assert.equal(connectedExport.localCandidateAReplaced,false);
assert.equal(connectedExport.peerAccountIdentifiersMinimized,true);
assert.equal(connectedExport.peerSecretsExported,false);
assert.equal(connectedExport.peerSecurityLogsExported,false);
assert.equal(connectedExport.inviteCapabilitiesExported,false);
assert.equal(connectedExport.ownershipTransferGranted,false);
assert.equal(connectedExport.sharedMutationAuthorityGranted,false);
assert.ok(Object.isFrozen(connectedExport));
assert.ok(Object.isFrozen(connectedExport.excludedOperationalData));
assert.deepEqual(connectedExport.excludedOperationalData,[
  "provider-authentication-secrets",
  "raw-device-secrets",
  "invite-capabilities",
  "private-session-operational-records",
  "idempotency-replay-records",
  "application-security-events",
  "provider-security-logs"
]);
assert.doesNotMatch(source,/\bfetch\s*\(|\blocalStorage\b|firebase-admin|firebase\/app|firebase\/firestore/i);
assert.doesNotMatch(index,/trustedConnectedDataAccountExport\.js/);
assert.doesNotMatch(optional,/trustedConnectedDataAccountExport\.js/);
assert.doesNotMatch(worker,/trustedConnectedDataAccountExport\.js/);
assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.equal(pkg.version,"1.4.0");
assert.equal(pkg.dependencies,undefined);

function account(status="active",revision=5){
  return {
    schemaVersion:1,
    objectType:"account",
    objectId:"account_1",
    revision,
    parentRevision:revision===0?null:revision-1,
    lifecycleState:"live",
    contentHash:"sha256:account",
    priorContentHash:null,
    updatedAt:"account-updated",
    updatedByAccountId:"account_1",
    updatedByDeviceId:null,
    data:{status,createdAt:"account-created",deletionRequestedAt:status==="deletion-pending"?"delete-requested":null},
    tombstone:null
  };
}

function governance({connectionState="active",requesterEntitlement="active",peerEntitlement="active"}={}){
  return {
    schemaVersion:1,
    objectType:"rivalry",
    objectId:"rivalry_1",
    revision:7,
    parentRevision:6,
    lifecycleState:"live",
    contentHash:"sha256:governance",
    priorContentHash:null,
    updatedAt:"governance-updated",
    updatedByAccountId:"account_peer",
    updatedByDeviceId:"device_peer",
    data:{
      connectionState,
      connectionStateBeforeDeletion:null,
      managerSlots:[
        {slotId:"manager-1",accountId:"account_1",profileId:"profile_1",displayLabel:"Requester",entitlementState:requesterEntitlement,deletionConsent:false},
        {slotId:"manager-2",accountId:"account_peer",profileId:"profile_peer",displayLabel:"Rival",entitlementState:peerEntitlement,deletionConsent:false}
      ],
      authorizedAccountIds:["account_1","account_peer"],
      createdByAccountId:"account_peer",
      createdAt:"rivalry-created"
    },
    tombstone:null
  };
}

function sharedState(overrides={}){
  return Object.assign({
    schemaVersion:1,
    objectType:"sharedState",
    objectId:"rivalry_1",
    revision:12,
    parentRevision:11,
    lifecycleState:"live",
    contentHash:"sha256:shared",
    priorContentHash:null,
    updatedAt:"shared-updated",
    updatedByAccountId:"account_peer",
    updatedByDeviceId:"device_peer",
    data:{
      saveId:"save_1",
      managerBindings:[
        {slotId:"manager-1",profileId:"profile_1"},
        {slotId:"manager-2",profileId:"profile_peer"}
      ],
      seasonIds:["season_1"],
      activeSeasonId:"season_1",
      payloadFormatVersion:2,
      payload:{showdownName:"Private Rivalry",rounds:3}
    },
    tombstone:null
  },overrides);
}

function inventory(overrides={}){
  return Object.assign({
    profileLinks:[{accountId:"account_1",profileId:"profile_1",displayLabel:"Requester",linkState:"active",createdAt:"link-created"}],
    devices:[{accountId:"account_1",deviceId:"device_1",installationId:"installation_1",displayLabel:"Chromebook",state:"active",registeredAt:"device-created",lastSeenAt:"device-seen",revokedAt:null}],
    rivalries:[{rivalryId:"rivalry_1",governance:governance(),authoritativeState:sharedState()}]
  },overrides);
}

function adapters(overrides={}){
  return Object.assign({
    loadAccount:async()=>account(),
    loadExportInventory:async()=>inventory()
  },overrides);
}

(async()=>{
  let inventoryIntent;
  const result=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:" account_1 ",
    operationAuthorizationGranted:true
  },adapters({
    loadExportInventory:async intent=>{inventoryIntent=intent;return inventory();}
  })));

  assert.equal(result.ok,true);
  assert.equal(result.status,"completed");
  assert.equal(result.exportType,"connected-data-account-export");
  assert.equal(result.formatVersion,1);
  assert.equal(result.account.accountId,"account_1");
  assert.equal(result.account.status,"active");
  assert.equal(result.account.revision,5);
  assert.equal(result.mutationPerformed,false);
  assert.equal(result.ownershipTransferGranted,false);
  assert.equal(result.sharedMutationAuthorityGranted,false);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.rivalries));
  assert.ok(Object.isFrozen(result.rivalries[0].governance.managerSlots));
  assert.ok(Object.isFrozen(inventoryIntent));
  assert.deepEqual(inventoryIntent,{accountId:"account_1"});

  assert.deepEqual(result.profileLinks,[{
    profileId:"profile_1",displayLabel:"Requester",linkState:"active",createdAt:"link-created"
  }]);
  assert.deepEqual(result.devices,[{
    deviceId:"device_1",installationId:"installation_1",displayLabel:"Chromebook",state:"active",registeredAt:"device-created",lastSeenAt:"device-seen",revokedAt:null
  }]);
  assert.equal(result.rivalries[0].governance.createdByRequester,false);
  assert.equal(result.rivalries[0].governance.managerSlots[0].requester,true);
  assert.equal(result.rivalries[0].governance.managerSlots[1].requester,false);
  assert.equal(result.rivalries[0].authoritativeState.updatedByRequester,false);
  assert.equal(Object.hasOwn(result.rivalries[0].governance,"authorizedAccountIds"),false);
  assert.equal(Object.hasOwn(result.rivalries[0].governance.managerSlots[0],"accountId"),false);
  assert.equal(Object.hasOwn(result.rivalries[0].governance.managerSlots[1],"accountId"),false);
  assert.equal(Object.hasOwn(result.rivalries[0].authoritativeState,"updatedByAccountId"),false);
  const serialized=JSON.stringify(result);
  assert.doesNotMatch(serialized,/account_peer/);
  assert.doesNotMatch(serialized,/device_peer/);

  let called=false;
  const unauthenticated=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"",operationAuthorizationGranted:true
  },adapters({loadAccount:async()=>{called=true;return account();}})));
  assert.equal(unauthenticated.code,"UNAUTHENTICATED_PROVIDER");
  assert.equal(called,false);

  const unauthorized=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:false
  },adapters()));
  assert.equal(unauthorized.code,"ACCOUNT_EXPORT_OPERATION_UNAUTHORIZED");

  const disabled=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadAccount:async()=>account("disabled")})));
  assert.equal(disabled.code,"ACCOUNT_EXPORT_ACCOUNT_DISABLED");

  const deleting=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadAccount:async()=>account("deletion-pending")})));
  assert.equal(deleting.code,"ACCOUNT_EXPORT_DELETION_PENDING");

  const extraInventoryClass=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>inventory({invites:[]})})));
  assert.equal(extraInventoryClass.code,"ACCOUNT_EXPORT_INVENTORY_INVALID");

  const crossAccountProfile=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>inventory({profileLinks:[{accountId:"account_peer",profileId:"profile_peer",linkState:"active"}]})})));
  assert.equal(crossAccountProfile.code,"ACCOUNT_EXPORT_PROFILE_LINK_SCOPE_VIOLATION");

  const crossAccountDevice=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>inventory({devices:[{accountId:"account_peer",deviceId:"device_peer",state:"active"}]})})));
  assert.equal(crossAccountDevice.code,"ACCOUNT_EXPORT_DEVICE_SCOPE_VIOLATION");

  const relinquished=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>inventory({rivalries:[{
    rivalryId:"rivalry_1",
    governance:governance({connectionState:"single-owner-retained",requesterEntitlement:"relinquished"}),
    authoritativeState:sharedState()
  }]})})));
  assert.equal(relinquished.code,"ACCOUNT_EXPORT_RIVALRY_SCOPE_VIOLATION");

  const retained=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>inventory({rivalries:[{
    rivalryId:"rivalry_1",
    governance:governance({connectionState:"revoked-read-only",requesterEntitlement:"retained",peerEntitlement:"retained"}),
    authoritativeState:sharedState()
  }]})})));
  assert.equal(retained.ok,true);
  assert.equal(retained.rivalries[0].governance.connectionState,"revoked-read-only");
  assert.equal(retained.rivalries[0].governance.managerSlots[0].entitlementState,"retained");

  const tombstonedState=sharedState({
    lifecycleState:"tombstoned",
    contentHash:null,
    priorContentHash:"sha256:prior-shared",
    data:null,
    tombstone:{
      deletedAt:"deleted-at",
      deletedByAccountId:"account_peer",
      reasonCode:"owner-consent",
      restorableByAccountIds:["account_1","account_peer"]
    }
  });
  const tombstoneExport=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>inventory({rivalries:[{
    rivalryId:"rivalry_1",governance:governance(),authoritativeState:tombstonedState
  }]})})));
  assert.equal(tombstoneExport.ok,true);
  assert.equal(tombstoneExport.rivalries[0].authoritativeState.lifecycleState,"tombstoned");
  assert.equal(tombstoneExport.rivalries[0].authoritativeState.tombstone.deletedByRequester,false);
  assert.equal(tombstoneExport.rivalries[0].authoritativeState.tombstone.restorableByRequester,true);
  assert.doesNotMatch(JSON.stringify(tombstoneExport),/account_peer/);

  const inventoryOutage=await connectedExport.executeTrustedConnectedDataAccountExport(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadExportInventory:async()=>{throw new Error("provider unavailable");}})));
  assert.equal(inventoryOutage.code,"ACCOUNT_EXPORT_INVENTORY_UNAVAILABLE");
  assert.equal(inventoryOutage.status,"retryable");

  process.stdout.write("PASS trusted connected data account export: active-account authorization, exact data-class scope, peer-identity minimization, retained two-owner entitlement, tombstone minimization and non-mutating production isolation are protected.\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});