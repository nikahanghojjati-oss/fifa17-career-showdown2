const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const gateway=require("../../js/trustedMutationGateway.js");

function sha256(value){
  return `sha256:${crypto.createHash("sha256").update(String(value)).digest("hex")}`;
}

function liveAuthority(revision=4){
  return {
    objectType:"rivalry",
    objectId:"rivalry-proof",
    revision,
    lifecycleState:"live",
    contentHash:`sha256:${"a".repeat(64)}`
  };
}

function baseInput(overrides={}){
  return {
    accountId:"account-proof-a",
    providerPrincipal:{uid:"account-proof-a"},
    operation:"synthetic-proof-mutation",
    authorizationScope:"synthetic-proof-only",
    request:{
      operation:"synthetic-proof-mutation",
      objectType:"rivalry",
      objectId:"rivalry-proof",
      deviceId:"device-proof-a",
      installationId:"installation-proof-a",
      baseRevision:4,
      idempotencyKey:"raw-idempotency-secret-never-store",
      payload:{z:2,a:1}
    },
    trustedSha256:sha256,
    authorizeCurrentMutation:async()=>({authorized:true}),
    planMutation:async({immutableIntent,actor})=>({
      mutation:{
        schemaVersion:1,
        objectType:immutableIntent.objectType,
        objectId:immutableIntent.objectId,
        revision:immutableIntent.baseRevision+1,
        parentRevision:immutableIntent.baseRevision,
        lifecycleState:"live",
        contentHash:`sha256:${"b".repeat(64)}`,
        priorContentHash:null,
        updatedByAccountId:actor.accountId,
        updatedByDeviceId:immutableIntent.deviceId,
        data:{proof:true},
        tombstone:null
      }
    }),
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({authority:liveAuthority(),authorizationContext:{current:true}});
      return {committed:decision.action==="commit",decision};
    },
    ...overrides
  };
}

assert.equal(gateway.contractVersion,1);
assert.equal(gateway.stage,"remaining-stage2-trusted-mutation-gateway");
assert.equal(gateway.productionRuntimeConnected,false);
assert.equal(gateway.productionProvisioningAuthorized,false);
assert.equal(gateway.browserFirestoreWrites,"deny-all");
assert.equal(gateway.sharedMutationMechanismProven,true);
assert.equal(gateway.sharedMutationOperationAuthorized,false);
assert.equal(gateway.stage3OperationAuthorized,false);
assert.deepEqual(gateway.stage2HRuntimePermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.deepEqual(gateway.responseStatuses,[
  "accepted","replayed","conflict","forbidden","invalid-request","idempotency-conflict"
]);

assert.equal(gateway.canonicalize({z:2,a:{y:2,x:1}}),'{"a":{"x":1,"y":2},"z":2}');
const cycle={};cycle.self=cycle;
assert.equal(gateway.canonicalize(cycle),null);

(async()=>{
  let transactionSeen=null;
  let order=[];
  const accepted=await gateway.executeTrustedMutation(baseInput({
    authorizeCurrentMutation:async context=>{
      order.push("authorize-current");
      assert.equal(context.actor.accountId,"account-proof-a");
      assert.equal(context.authority.revision,4);
      assert.equal(context.immutableIntent.baseRevision,4);
      assert.equal(Object.isFrozen(context.immutableIntent),true);
      return {authorized:true};
    },
    planMutation:async context=>{
      order.push("plan");
      return baseInput().planMutation(context);
    },
    runAtomicMutation:async transaction=>{
      transactionSeen=transaction;
      assert.equal(Object.isFrozen(transaction),true);
      assert.equal(Object.isFrozen(transaction.immutableIntent),true);
      assert.equal(transaction.immutableIntent.baseRevision,4);
      const serialized=JSON.stringify(transaction);
      assert.doesNotMatch(serialized,/raw-idempotency-secret-never-store/);
      assert.doesNotMatch(serialized,/idToken|appCheckToken/i);
      assert.match(transaction.idempotencyKeyHash,/^sha256:[0-9a-f]{64}$/);
      assert.match(transaction.requestFingerprint,/^sha256:[0-9a-f]{64}$/);
      const decision=await transaction.decide({authority:liveAuthority(),authorizationContext:{current:true}});
      order.push("adapter-commit");
      return {committed:true,decision};
    }
  }));
  assert.deepEqual(order,["authorize-current","plan","adapter-commit"]);
  assert.ok(transactionSeen);
  assert.equal(accepted.status,"accepted");
  assert.equal(accepted.objectType,"rivalry");
  assert.equal(accepted.objectId,"rivalry-proof");
  assert.equal(accepted.revision,5);
  assert.equal(accepted.parentRevision,4);
  assert.equal(accepted.contentHash,`sha256:${"b".repeat(64)}`);
  assert.equal(accepted.tombstone,false);
  assert.match(accepted.idempotencyKeyHash,/^sha256:[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(accepted),/raw-idempotency-secret-never-store/);

  let plannerCalled=false;
  const replayed=await gateway.executeTrustedMutation(baseInput({
    planMutation:async()=>{plannerCalled=true;throw new Error("must not plan replay");},
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({
        authority:liveAuthority(99),
        existingReceipt:{
          requestFingerprint:transaction.requestFingerprint,
          baseRevision:4,
          acceptedRevision:5,
          resultStatus:"accepted",
          resultContentHash:`sha256:${"b".repeat(64)}`,
          resultTombstone:false,
          actorAccountId:"account-proof-a",
          deviceId:"device-proof-a"
        }
      });
      return {committed:false,decision};
    }
  }));
  assert.equal(plannerCalled,false);
  assert.equal(replayed.status,"replayed");
  assert.equal(replayed.revision,5);
  assert.equal(replayed.parentRevision,4);

  const idempotencyConflict=await gateway.executeTrustedMutation(baseInput({
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({
        authority:liveAuthority(4),
        existingReceipt:{
          requestFingerprint:`sha256:${"c".repeat(64)}`,
          baseRevision:4,
          acceptedRevision:5,
          resultStatus:"accepted",
          resultContentHash:null,
          resultTombstone:false,
          actorAccountId:"account-proof-a",
          deviceId:"device-proof-a"
        }
      });
      return {committed:false,decision};
    }
  }));
  assert.equal(idempotencyConflict.status,"idempotency-conflict");
  assert.equal(idempotencyConflict.code,"IDEMPOTENCY_CONFLICT");

  let stalePlannerCalled=false;
  const stale=await gateway.executeTrustedMutation(baseInput({
    planMutation:async()=>{stalePlannerCalled=true;throw new Error("stale must not plan");},
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({authority:liveAuthority(5),authorizationContext:{current:true}});
      return {committed:false,decision};
    }
  }));
  assert.equal(stalePlannerCalled,false);
  assert.equal(stale.status,"conflict");
  assert.equal(stale.code,"STALE_BASE_REVISION");
  assert.equal(stale.baseRevision,4);
  assert.deepEqual(stale.authoritative,{
    objectType:"rivalry",
    objectId:"rivalry-proof",
    revision:5,
    contentHash:`sha256:${"a".repeat(64)}`,
    tombstone:false
  });
  assert.equal(Object.prototype.hasOwnProperty.call(stale.authoritative,"data"),false);

  let deniedPlannerCalled=false;
  const denied=await gateway.executeTrustedMutation(baseInput({
    authorizeCurrentMutation:async()=>({authorized:false}),
    planMutation:async()=>{deniedPlannerCalled=true;throw new Error("denied must not plan");},
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({authority:liveAuthority(),authorizationContext:{deviceState:"revoked"}});
      return {committed:false,decision};
    }
  }));
  assert.equal(deniedPlannerCalled,false);
  assert.equal(denied.status,"forbidden");
  assert.equal(denied.code,"TRUSTED_MUTATION_CURRENT_AUTHORIZATION_DENIED");

  const retrySnapshots=[];
  const retried=await gateway.executeTrustedMutation(baseInput({
    runAtomicMutation:async transaction=>{
      retrySnapshots.push(transaction.immutableIntent);
      const first=await transaction.decide({authority:liveAuthority(4),authorizationContext:{attempt:1}});
      assert.equal(first.action,"commit");
      retrySnapshots.push(transaction.immutableIntent);
      const final=await transaction.decide({authority:liveAuthority(5),authorizationContext:{attempt:2}});
      return {committed:false,decision:final};
    }
  }));
  assert.strictEqual(retrySnapshots[0],retrySnapshots[1]);
  assert.equal(retrySnapshots[1].baseRevision,4);
  assert.equal(retried.status,"conflict");
  assert.equal(retried.baseRevision,4);

  const badRevisionPlan=await gateway.executeTrustedMutation(baseInput({
    planMutation:async({immutableIntent,actor})=>({mutation:{
      objectType:immutableIntent.objectType,
      objectId:immutableIntent.objectId,
      revision:immutableIntent.baseRevision+2,
      parentRevision:immutableIntent.baseRevision,
      lifecycleState:"live",
      contentHash:`sha256:${"d".repeat(64)}`,
      updatedByAccountId:actor.accountId,
      updatedByDeviceId:immutableIntent.deviceId
    }}),
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({authority:liveAuthority(),authorizationContext:{current:true}});
      return {committed:false,decision};
    }
  }));
  assert.equal(badRevisionPlan.code,"TRUSTED_MUTATION_PLAN_INVALID");

  const badActorPlan=await gateway.executeTrustedMutation(baseInput({
    planMutation:async({immutableIntent})=>({mutation:{
      objectType:immutableIntent.objectType,
      objectId:immutableIntent.objectId,
      revision:immutableIntent.baseRevision+1,
      parentRevision:immutableIntent.baseRevision,
      lifecycleState:"live",
      contentHash:`sha256:${"e".repeat(64)}`,
      updatedByAccountId:"client-spoofed-account",
      updatedByDeviceId:immutableIntent.deviceId
    }}),
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({authority:liveAuthority(),authorizationContext:{current:true}});
      return {committed:false,decision};
    }
  }));
  assert.equal(badActorPlan.code,"TRUSTED_MUTATION_PLAN_INVALID");

  const commitMismatch=await gateway.executeTrustedMutation(baseInput({
    runAtomicMutation:async transaction=>{
      const decision=await transaction.decide({authority:liveAuthority(),authorizationContext:{current:true}});
      return {committed:false,decision};
    }
  }));
  assert.equal(commitMismatch.code,"TRUSTED_MUTATION_TRANSACTION_COMMIT_MISMATCH");

  const decisionMismatch=await gateway.executeTrustedMutation(baseInput({
    runAtomicMutation:async transaction=>{
      await transaction.decide({authority:liveAuthority(),authorizationContext:{current:true}});
      return {committed:false,decision:{ok:false,action:"no-commit",status:"forbidden",code:"FORGED_ADAPTER_DECISION"}};
    }
  }));
  assert.equal(decisionMismatch.code,"TRUSTED_MUTATION_TRANSACTION_DECISION_MISMATCH");

  const clientAccountField=baseInput();
  clientAccountField.request={...clientAccountField.request,accountId:"spoofed"};
  const untrustedAccount=await gateway.executeTrustedMutation(clientAccountField);
  assert.equal(untrustedAccount.code,"TRUSTED_MUTATION_REQUEST_INVALID");

  const credentialForwarding=await gateway.executeTrustedMutation({...baseInput(),idToken:"must-not-enter-gateway"});
  assert.equal(credentialForwarding.code,"TRUSTED_MUTATION_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN");

  const badHash=await gateway.executeTrustedMutation(baseInput({trustedSha256:async()=>"not-a-sha"}));
  assert.equal(badHash.code,"TRUSTED_MUTATION_HASHING_FAILED");

  process.stdout.write("PASS Trusted Mutation Gateway: immutable intent, trusted hashing, transaction-current authorization, replay/idempotency, stale conflict, exact-next revision, atomic receipt ownership, bounded responses, unchanged IAM and no Stage 3 authorization are proven.\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
