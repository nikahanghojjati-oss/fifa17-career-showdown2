const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const gateway=require("../../js/trustedMutationGateway.js");

const sha256=value=>`sha256:${crypto.createHash("sha256").update(String(value)).digest("hex")}`;

function inputWithPayload(payload){
  let transactionCalled=false;
  return {
    input:{
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
        payload
      },
      trustedSha256:sha256,
      authorizeCurrentMutation:async()=>({authorized:true}),
      planMutation:async()=>{throw new Error("credential-bearing requests must never reach planner");},
      runAtomicMutation:async()=>{transactionCalled=true;throw new Error("credential-bearing requests must never reach transaction");}
    },
    transactionCalled:()=>transactionCalled
  };
}

(async()=>{
  const credentialPayloads=[
    {idToken:"nested-id-token"},
    {meta:{appCheckToken:"nested-app-check-token"}},
    {meta:[{firebaseIdToken:"nested-firebase-id-token"}]},
    {nested:{authorization:"Bearer nested-secret"}},
    {nested:{"X-Firebase-AppCheck":"nested-app-check-header"}}
  ];

  for(const payload of credentialPayloads){
    const fixture=inputWithPayload(payload);
    const result=await gateway.executeTrustedMutation(fixture.input);
    assert.equal(result.ok,false);
    assert.equal(result.status,"invalid-request");
    assert.equal(result.code,"TRUSTED_MUTATION_REQUEST_INVALID");
    assert.equal(fixture.transactionCalled(),false,"Nested credential material must be rejected before provider transaction entry.");
  }

  const clean=inputWithPayload({proof:{value:1}});
  clean.input.planMutation=async({immutableIntent,actor})=>({mutation:{
    objectType:immutableIntent.objectType,
    objectId:immutableIntent.objectId,
    revision:immutableIntent.baseRevision+1,
    parentRevision:immutableIntent.baseRevision,
    lifecycleState:"live",
    contentHash:`sha256:${"b".repeat(64)}`,
    updatedByAccountId:actor.accountId,
    updatedByDeviceId:immutableIntent.deviceId
  }});
  clean.input.runAtomicMutation=async transaction=>{
    const decision=await transaction.decide({
      authority:{
        objectType:"rivalry",
        objectId:"rivalry-proof",
        revision:4,
        lifecycleState:"live",
        contentHash:`sha256:${"a".repeat(64)}`
      },
      authorizationContext:{current:true}
    });
    return {committed:decision.action==="commit",decision};
  };
  const accepted=await gateway.executeTrustedMutation(clean.input);
  assert.equal(accepted.status,"accepted","Credential defense must not block a clean reviewed payload.");

  process.stdout.write("PASS Trusted Mutation Gateway nested credential defense: reserved transient credential keys are rejected recursively before transaction entry while clean payloads remain accepted.\n");
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
