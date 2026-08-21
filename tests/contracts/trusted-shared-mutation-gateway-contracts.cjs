const assert=require("node:assert/strict");
const fs=require("node:fs");
const gateway=require("../../js/trustedSharedMutationGateway.js");

const source=fs.readFileSync("js/trustedSharedMutationGateway.js","utf8");
const rules=fs.readFileSync("firestore.rules","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.equal(gateway.productionRuntimeConnected,false);
assert.equal(gateway.productionProvisioningAuthorized,false);
assert.equal(gateway.browserFirestoreWrites,"deny-all");
assert.equal(gateway.trustedServerOnly,true);
assert.equal(gateway.sharedMutationAuthorityGrantedOnlyPerOperation,true);
assert.equal(gateway.providerTransactionMayRetry,true);
assert.equal(gateway.clientBaseRevisionMayRefreshOnRetry,false);
assert.equal(gateway.directBrowserMutationAuthorityGranted,false);
assert.equal(gateway.sessionAuthorityRequiredOnlyWhenOperationPolicyRequiresIt,true);
assert.deepEqual([...gateway.allowedOperations],["put","delete","restore"]);
assert.deepEqual([...gateway.allowedObjectTypes],["sharedState"]);
assert.ok(Object.isFrozen(gateway));
assert.ok(Object.isFrozen(gateway.allowedOperations));
assert.match(source,/FORBIDDEN_CLIENT_AUTHORITY_FIELDS[\s\S]+accountId[\s\S]+authorizedAccountIds[\s\S]+entitlementState[\s\S]+revision/);
assert.doesNotMatch(source,/\bfetch\s*\(|\blocalStorage\b|firebase-admin|firebase\/app|firebase\/firestore/i);
assert.doesNotMatch(index,/trustedSharedMutationGateway\.js/);
assert.doesNotMatch(optional,/trustedSharedMutationGateway\.js/);
assert.doesNotMatch(worker,/trustedSharedMutationGateway\.js/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while the dormant trusted shared-mutation implementation proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent.");
assert.equal(pkg.dependencies,undefined);

function baseRequest(overrides={}){
  return Object.assign({
    operation:"put",
    objectType:"sharedState",
    objectId:"rivalry_1",
    rivalryId:"rivalry_1",
    deviceId:"device_1",
    installationId:"install_1",
    baseRevision:4,
    idempotencyKey:"idem_1",
    contentHash:"sha256:abc",
    payload:{saveId:"save_1",nested:{season:3}}
  },overrides);
}

function authority(overrides={}){
  return Object.assign({
    objectType:"sharedState",
    objectId:"rivalry_1",
    rivalryId:"rivalry_1",
    revision:4,
    lifecycleState:"live",
    contentHash:"sha256:old",
    priorContentHash:null
  },overrides);
}

function authorization(overrides={}){
  return Object.assign({
    accountStatus:"active",
    deviceState:"active",
    rivalryState:"active",
    entitledAccountIds:["account_1","account_2"],
    operationAuthorized:true,
    sessionRequired:false,
    sessionAuthorized:false
  },overrides);
}

(async()=>{
  const forbidden=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest({accountId:"attacker"}),
    runAtomicSharedMutation:async()=>{throw new Error("must not run");}
  });
  assert.equal(forbidden.ok,false);
  assert.equal(forbidden.code,"TRUSTED_SHARED_MUTATION_CLIENT_AUTHORITY_FORBIDDEN");

  let observedIntent;
  const accepted=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest(),
    runAtomicSharedMutation:async tx=>{
      observedIntent=tx.intent;
      assert.ok(Object.isFrozen(tx));
      assert.ok(Object.isFrozen(tx.intent));
      assert.ok(Object.isFrozen(tx.intent.payload));
      assert.ok(Object.isFrozen(tx.intent.payload.nested));
      assert.equal(tx.intent.baseRevision,4);
      const first=tx.decide({authorization:authorization(),authoritativeState:authority(),idempotencyRecord:null});
      assert.equal(first.ok,true);
      assert.equal(first.action,"commit");
      assert.equal(first.mutation.nextRevision,5);
      assert.equal(first.mutation.nextEnvelope.parentRevision,4);
      assert.equal(first.mutation.nextEnvelope.updatedByAccountId,"account_1");
      assert.equal(first.mutation.nextEnvelope.updatedByDeviceId,"device_1");
      const retryAfterConcurrentAdvance=tx.decide({authorization:authorization(),authoritativeState:authority({revision:5,contentHash:"sha256:peer"}),idempotencyRecord:null});
      assert.equal(retryAfterConcurrentAdvance.ok,false);
      assert.equal(retryAfterConcurrentAdvance.code,"STALE_BASE_REVISION");
      assert.equal(retryAfterConcurrentAdvance.submittedBaseRevision,4);
      assert.equal(tx.intent.baseRevision,4,"provider retry must never refresh client baseRevision");
      return {committed:true,decision:first};
    }
  });
  assert.equal(accepted.ok,true);
  assert.equal(accepted.action,"accepted");
  assert.equal(accepted.acceptedRevision,5);
  assert.equal(accepted.parentRevision,4);
  assert.equal(accepted.mutationPerformed,true);
  assert.equal(observedIntent.baseRevision,4);

  let fingerprint;
  const replayProbe=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest(),
    runAtomicSharedMutation:async tx=>{
      fingerprint=tx.requestFingerprint;
      const replay=tx.decide({
        authorization:authorization(),
        authoritativeState:authority({revision:9,contentHash:"sha256:newer"}),
        idempotencyRecord:{
          requestFingerprint:tx.requestFingerprint,
          baseRevision:4,
          acceptedRevision:5,
          resultContentHash:"sha256:abc",
          resultTombstone:false
        }
      });
      return {committed:false,decision:replay};
    }
  });
  assert.equal(replayProbe.ok,true);
  assert.equal(replayProbe.action,"replayed");
  assert.equal(replayProbe.acceptedRevision,5);
  assert.equal(replayProbe.mutationPerformed,false);
  assert.ok(typeof fingerprint==="string"&&fingerprint.includes('"baseRevision":4'));

  const idemConflict=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest(),
    runAtomicSharedMutation:async tx=>({
      committed:false,
      decision:tx.decide({
        authorization:authorization(),
        authoritativeState:authority(),
        idempotencyRecord:{requestFingerprint:"different",baseRevision:4,acceptedRevision:5,resultContentHash:"sha256:abc",resultTombstone:false}
      })
    })
  });
  assert.equal(idemConflict.ok,false);
  assert.equal(idemConflict.code,"idempotency-conflict");

  for(const [name,auth,expected] of [
    ["disabled account",authorization({accountStatus:"disabled"}),"account-disabled"],
    ["revoked device",authorization({deviceState:"revoked"}),"device-revoked"],
    ["former member",authorization({entitledAccountIds:["account_2"]}),"relationship-revoked"],
    ["revoked rivalry",authorization({rivalryState:"revoked-read-only"}),"relationship-revoked"],
    ["operation denied",authorization({operationAuthorized:false}),"TRUSTED_SHARED_MUTATION_OPERATION_UNAUTHORIZED"],
    ["required session missing",authorization({sessionRequired:true,sessionAuthorized:false}),"TRUSTED_SHARED_MUTATION_SESSION_FORBIDDEN"]
  ]){
    const denied=await gateway.executeTrustedSharedMutation({
      accountId:"account_1",
      request:baseRequest(),
      runAtomicSharedMutation:async tx=>({committed:false,decision:tx.decide({authorization:auth,authoritativeState:authority(),idempotencyRecord:null})})
    });
    assert.equal(denied.ok,false,name);
    assert.equal(denied.code,expected,name);
  }

  const sessionOptional=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest(),
    runAtomicSharedMutation:async tx=>{
      const decision=tx.decide({authorization:authorization({sessionRequired:false,sessionAuthorized:false}),authoritativeState:authority(),idempotencyRecord:null});
      return {committed:true,decision};
    }
  });
  assert.equal(sessionOptional.ok,true,"Connected Rivalry mutation may be authorized without a live Remote Joining session when operation policy does not require one");

  const stale=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest(),
    runAtomicSharedMutation:async tx=>({
      committed:false,
      decision:tx.decide({authorization:authorization(),authoritativeState:authority({revision:6,contentHash:"sha256:peer"}),idempotencyRecord:null})
    })
  });
  assert.equal(stale.ok,false);
  assert.equal(stale.code,"STALE_BASE_REVISION");
  assert.equal(stale.status,"conflict");
  assert.equal(stale.authoritative.revision,6);
  assert.equal(stale.authoritative.contentHash,"sha256:peer");
  assert.equal(Object.prototype.hasOwnProperty.call(stale.authoritative,"payload"),false,"conflict response must not leak full remote payload");

  const deleteAccepted=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest({operation:"delete",contentHash:undefined,payload:undefined}),
    runAtomicSharedMutation:async tx=>{
      const decision=tx.decide({authorization:authorization(),authoritativeState:authority(),idempotencyRecord:null});
      assert.equal(decision.mutation.nextEnvelope.lifecycleState,"tombstoned");
      assert.equal(decision.mutation.nextEnvelope.data,null);
      assert.equal(decision.mutation.nextEnvelope.contentHash,null);
      assert.equal(decision.mutation.nextEnvelope.priorContentHash,"sha256:old");
      return {committed:true,decision};
    }
  });
  assert.equal(deleteAccepted.ok,true);
  assert.equal(deleteAccepted.tombstone,true);

  const putOverTombstone=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest({baseRevision:5}),
    runAtomicSharedMutation:async tx=>({
      committed:false,
      decision:tx.decide({authorization:authorization(),authoritativeState:authority({revision:5,lifecycleState:"tombstoned",contentHash:null,priorContentHash:"sha256:old"}),idempotencyRecord:null})
    })
  });
  assert.equal(putOverTombstone.code,"tombstone-restore-required");

  const restore=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest({operation:"restore",baseRevision:5,idempotencyKey:"idem_restore"}),
    runAtomicSharedMutation:async tx=>{
      const decision=tx.decide({authorization:authorization(),authoritativeState:authority({revision:5,lifecycleState:"tombstoned",contentHash:null,priorContentHash:"sha256:old"}),idempotencyRecord:null});
      assert.equal(decision.ok,true);
      assert.equal(decision.mutation.nextRevision,6);
      assert.equal(decision.mutation.nextEnvelope.lifecycleState,"live");
      return {committed:true,decision};
    }
  });
  assert.equal(restore.ok,true);
  assert.equal(restore.acceptedRevision,6);
  assert.equal(restore.tombstone,false);

  const mismatchCommit=await gateway.executeTrustedSharedMutation({
    accountId:"account_1",
    request:baseRequest(),
    runAtomicSharedMutation:async tx=>({committed:true,decision:tx.decide({authorization:authorization({deviceState:"revoked"}),authoritativeState:authority(),idempotencyRecord:null})})
  });
  assert.equal(mismatchCommit.code,"TRUSTED_SHARED_MUTATION_COMMIT_MISMATCH");

  process.stdout.write("PASS trusted shared mutation gateway: trusted-server-only CAS, immutable retry intent, replay/idempotency, operation-scoped current authorization, optional session gating, tombstones and no browser write authority are protected; historical proof is release-neutral.\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});