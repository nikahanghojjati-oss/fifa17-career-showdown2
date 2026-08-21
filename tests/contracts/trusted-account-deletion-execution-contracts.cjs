const assert=require("node:assert/strict");
const fs=require("node:fs");
const deletion=require("../../js/trustedAccountDeletionExecution.js");

const source=fs.readFileSync("js/trustedAccountDeletionExecution.js","utf8");
const rules=fs.readFileSync("firestore.rules","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.equal(deletion.productionRuntimeConnected,false);
assert.equal(deletion.productionProvisioningAuthorized,false);
assert.equal(deletion.trustedServerOnly,true);
assert.equal(deletion.browserFirestoreWrites,"deny-all");
assert.equal(deletion.accountIdentitySource,"verified Firebase UID only");
assert.equal(deletion.selfDeletionRequiresActiveAccount,true);
assert.equal(deletion.deletionPendingDeniesNewMutationAuthority,true);
assert.equal(deletion.providerDeleteAfterApplicationCleanup,true);
assert.equal(deletion.finalApplicationAccountRemovalAfterProviderDelete,true);
assert.equal(deletion.accountDeletionMayDestroySurvivorSharedGameplay,false);
assert.ok(Object.isFrozen(deletion));
assert.ok(Object.isFrozen(deletion.requiredCleanupProofFields));
assert.doesNotMatch(source,/\bfetch\s*\(|\blocalStorage\b|firebase-admin|firebase\/app|firebase\/firestore/i);
assert.doesNotMatch(index,/trustedAccountDeletionExecution\.js/);
assert.doesNotMatch(optional,/trustedAccountDeletionExecution\.js/);
assert.doesNotMatch(worker,/trustedAccountDeletionExecution\.js/);
assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while the dormant account-deletion implementation proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent.");
assert.equal(pkg.dependencies,undefined);

function account(status="active",revision=3){
  return {
    schemaVersion:1,
    objectType:"account",
    objectId:"account_1",
    revision,
    parentRevision:revision===0?null:revision-1,
    lifecycleState:"live",
    contentHash:"sha256:account",
    priorContentHash:null,
    updatedAt:"server-time",
    updatedByAccountId:"account_1",
    updatedByDeviceId:null,
    data:{status,createdAt:"created",deletionRequestedAt:status==="deletion-pending"?"requested":null},
    tombstone:null
  };
}

function cleanupProof(overrides={}){
  return Object.assign({
    accountId:"account_1",
    devicesRevoked:true,
    invitesRevoked:true,
    sessionsClosed:true,
    rivalriesProcessed:true,
    profileLinksDetached:true,
    presentationLabelsMinimized:true,
    tombstoneRestorationAuthorityRemoved:true,
    boundedMetadataHandled:true,
    survivingOwnerEntitlementsPreserved:true,
    sharedGameplayDestroyedWithoutRequiredConsent:false
  },overrides);
}

function adapters(overrides={}){
  return Object.assign({
    loadState:async()=>({account:account(),providerPrincipalState:"present"}),
    beginDeletion:async intent=>({committed:true,accountId:intent.accountId,status:"deletion-pending",revision:intent.expectedRevision+1}),
    cleanupApplicationData:async()=>cleanupProof(),
    deleteProviderPrincipal:async intent=>({accountId:intent.accountId,status:"deleted"}),
    finalizeApplicationAccount:async intent=>({accountId:intent.accountId,status:"deleted"})
  },overrides);
}

(async()=>{
  const order=[];
  const result=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",
    operationAuthorizationGranted:true
  },adapters({
    loadState:async()=>{order.push("load");return {account:account(),providerPrincipalState:"present"};},
    beginDeletion:async intent=>{order.push("begin");assert.ok(Object.isFrozen(intent));assert.equal(intent.expectedRevision,3);return {committed:true,accountId:"account_1",status:"deletion-pending",revision:4};},
    cleanupApplicationData:async intent=>{order.push("cleanup");assert.ok(Object.isFrozen(intent));assert.equal(intent.deletionRevision,4);return cleanupProof();},
    deleteProviderPrincipal:async()=>{order.push("provider-delete");return {accountId:"account_1",status:"deleted"};},
    finalizeApplicationAccount:async()=>{order.push("finalize");return {accountId:"account_1",status:"deleted"};}
  })));
  assert.equal(result.ok,true);
  assert.equal(result.status,"completed");
  assert.equal(result.deletionRevision,4);
  assert.equal(result.beganDeletion,true);
  assert.deepEqual(order,["load","begin","cleanup","provider-delete","finalize"]);
  assert.ok(Object.isFrozen(result));

  let called=false;
  const unauthenticated=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"",operationAuthorizationGranted:true
  },adapters({loadState:async()=>{called=true;}})));
  assert.equal(unauthenticated.code,"UNAUTHENTICATED_PROVIDER");
  assert.equal(called,false);

  const unauthorized=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:false
  },adapters()));
  assert.equal(unauthorized.code,"ACCOUNT_DELETION_OPERATION_UNAUTHORIZED");

  const disabled=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadState:async()=>({account:account("disabled"),providerPrincipalState:"present"})})));
  assert.equal(disabled.code,"ACCOUNT_DISABLED_SELF_DELETION_FORBIDDEN");

  const completeReplayOrder=[];
  const alreadyComplete=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({
    loadState:async()=>{completeReplayOrder.push("load");return {account:null,providerPrincipalState:"absent"};},
    beginDeletion:async()=>{completeReplayOrder.push("begin");},
    cleanupApplicationData:async()=>{completeReplayOrder.push("cleanup");},
    deleteProviderPrincipal:async()=>{completeReplayOrder.push("provider-delete");},
    finalizeApplicationAccount:async()=>{completeReplayOrder.push("finalize");}
  })));
  assert.equal(alreadyComplete.ok,true);
  assert.equal(alreadyComplete.action,"already-complete");
  assert.equal(alreadyComplete.mutationPerformed,false);
  assert.deepEqual(completeReplayOrder,["load"]);

  const inconsistent=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({loadState:async()=>({account:null,providerPrincipalState:"present"})})));
  assert.equal(inconsistent.code,"ACCOUNT_DOCUMENT_MISSING_WITH_PROVIDER_PRINCIPAL");

  let providerCalled=false;
  const incompleteCleanup=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({
    cleanupApplicationData:async()=>cleanupProof({survivingOwnerEntitlementsPreserved:false}),
    deleteProviderPrincipal:async()=>{providerCalled=true;return {accountId:"account_1",status:"deleted"};}
  })));
  assert.equal(incompleteCleanup.code,"ACCOUNT_DELETION_CLEANUP_INCOMPLETE");
  assert.equal(incompleteCleanup.status,"retryable");
  assert.equal(providerCalled,false);

  let finalized=false;
  const providerFailure=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({
    deleteProviderPrincipal:async()=>{throw new Error("provider unavailable");},
    finalizeApplicationAccount:async()=>{finalized=true;}
  })));
  assert.equal(providerFailure.code,"ACCOUNT_DELETION_PROVIDER_DELETE_FAILED");
  assert.equal(providerFailure.status,"retryable");
  assert.equal(providerFailure.deletionPending,true);
  assert.equal(providerFailure.cleanupComplete,true);
  assert.equal(finalized,false);

  const retryOrder=[];
  const resumeAfterProviderDelete=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({
    loadState:async()=>{retryOrder.push("load");return {account:account("deletion-pending",4),providerPrincipalState:"absent"};},
    beginDeletion:async()=>{retryOrder.push("begin");throw new Error("must not begin twice");},
    cleanupApplicationData:async()=>{retryOrder.push("cleanup");return cleanupProof();},
    deleteProviderPrincipal:async()=>{retryOrder.push("provider-delete");throw new Error("must not delete absent principal");},
    finalizeApplicationAccount:async()=>{retryOrder.push("finalize");return {accountId:"account_1",status:"deleted"};}
  })));
  assert.equal(resumeAfterProviderDelete.ok,true);
  assert.equal(resumeAfterProviderDelete.beganDeletion,false);
  assert.deepEqual(retryOrder,["load","cleanup","finalize"]);

  let destructiveProviderCall=false;
  const unsafeSharedDelete=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({
    cleanupApplicationData:async()=>cleanupProof({sharedGameplayDestroyedWithoutRequiredConsent:true}),
    deleteProviderPrincipal:async()=>{destructiveProviderCall=true;return {accountId:"account_1",status:"deleted"};}
  })));
  assert.equal(unsafeSharedDelete.code,"ACCOUNT_DELETION_CLEANUP_INCOMPLETE");
  assert.equal(destructiveProviderCall,false);

  let cleanupCalled=false;
  const beginMismatch=await deletion.executeTrustedAccountDeletion(Object.assign({
    verifiedUid:"account_1",operationAuthorizationGranted:true
  },adapters({
    beginDeletion:async()=>({committed:true,accountId:"account_1",status:"deletion-pending",revision:99}),
    cleanupApplicationData:async()=>{cleanupCalled=true;return cleanupProof();}
  })));
  assert.equal(beginMismatch.code,"ACCOUNT_DELETION_BEGIN_COMMIT_MISMATCH");
  assert.equal(cleanupCalled,false);

  process.stdout.write("PASS trusted account deletion execution: deletion-pending-first, survivor preservation, provider-delete ordering, retry safety and fail-closed cleanup proof are protected; historical proof is release-neutral.\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});