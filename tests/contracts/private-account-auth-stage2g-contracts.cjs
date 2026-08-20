const assert=require("node:assert/strict");
const fs=require("node:fs");

const execution=require("../../js/trustedAccountBootstrapExecution.js");
const source=fs.readFileSync("js/trustedAccountBootstrapExecution.js","utf8");
const document=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2G.md","utf8");
const stage2e=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2E.md","utf8");
const stage2f=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2F.md","utf8");
const rules=fs.readFileSync("firestore.rules","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.equal(execution.contractVersion,1);
assert.equal(execution.stage,"2G");
assert.equal(execution.productionRuntimeConnected,false);
assert.equal(execution.productionIamSelected,false);
assert.equal(execution.trustedExecutionBoundary,"injected-atomic-account-transaction");
assert.equal(execution.bootstrapAuthorizationScope,"same-provider-uid-missing-account-create-only");
assert.equal(execution.initialBootstrapDeviceAttribution,null);
assert.equal(execution.sharedMutationAuthorityGranted,false);
assert.equal(typeof execution.executeTrustedAccountBootstrap,"function");

assert.doesNotMatch(source,/\blocalStorage\b|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
assert.doesNotMatch(source,/firebase-admin|firebase\/auth|firebase\/firestore|initializeApp|serviceAccount|private_key/i,"Dormant execution policy must not import or initialize a production Firebase runtime.");
assert.doesNotMatch(index,/trustedAccountBootstrapExecution\.js|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(optional,/trustedAccountBootstrapExecution\.js|firebase-admin|firebase\/auth|firebase\/firestore/i);
assert.doesNotMatch(worker,/trustedAccountBootstrapExecution\.js|firebase-admin|firebase-auth|firebase\/auth|firebase-firestore|firebase\/firestore/i);
assert.equal(pkg.version,"1.4.0");
assert.equal(pkg.dependencies,undefined,"Stage 2G must not add production package dependencies.");
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
assert.match(indexRevision,/^1\.4\.0-r[1-9]\d*$/,"Historical Stage 2G execution proof must not freeze later legitimate v1.4.0 runtime revisions.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");

function accountEnvelope(accountId,status="active",deletionRequestedAt=null){
  return {
    schemaVersion:1,
    objectType:"account",
    objectId:accountId,
    revision:4,
    parentRevision:3,
    lifecycleState:"live",
    contentHash:"sha256:stage2g-fixture",
    priorContentHash:null,
    updatedAt:"trusted-time",
    updatedByAccountId:accountId,
    updatedByDeviceId:null,
    data:{
      status,
      createdAt:"trusted-created-time",
      deletionRequestedAt
    },
    tombstone:null
  };
}

function verifierFor(uid,expectedToken,callLog){
  return async (token,checkRevoked)=>{
    callLog.push({tokenMatches:token===expectedToken,checkRevoked});
    return {uid,sub:uid};
  };
}

(async()=>{
  const uid="stage2g_account_uid";
  const rawToken="stage2g-transient-id-token-secret";
  const verificationCalls=[];
  let adapterRequest=null;

  const created=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    accountId:"client-spoofed-account",
    email:"untrusted@example.test",
    verifyIdToken:verifierFor(uid,rawToken,verificationCalls),
    runAtomicAccountBootstrap:async request=>{
      adapterRequest=request;
      assert.equal(request.accountId,uid);
      assert.equal(request.documentPath,`accounts/${uid}`);
      assert.equal(request.createSpec.objectId,uid);
      assert.equal(request.createSpec.updatedByAccountId,uid);
      assert.equal(request.createSpec.updatedByDeviceId,null);
      assert.equal(request.createSpec.revision,0);
      assert.equal(request.createSpec.parentRevision,null);
      assert.equal(request.createSpec.data.status,"active");
      assert.equal(request.createSpec.data.deletionRequestedAt,null);
      assert.deepEqual(Array.from(request.createSpec.trustedMaterialization.serverTimestampFields),["data.createdAt","updatedAt"]);
      assert.equal(request.createSpec.trustedMaterialization.canonicalContentHashRequired,true);
      assert.equal(JSON.stringify(request).includes(rawToken),false,"Raw Firebase ID token must never cross into the trusted account transaction adapter.");
      const decision=request.decide(null);
      return {committed:true,decision};
    }
  });

  assert.deepEqual(verificationCalls,[{tokenMatches:true,checkRevoked:true}]);
  assert.equal(created.ok,true);
  assert.equal(created.action,"created");
  assert.equal(created.accountId,uid);
  assert.equal(created.documentPath,`accounts/${uid}`);
  assert.equal(created.revision,0);
  assert.equal(created.applicationAuthorizationGranted,"account-bootstrap-only");
  assert.equal(JSON.stringify(created).includes(rawToken),false);
  assert.ok(adapterRequest);
  assert.equal(adapterRequest.accountId,"stage2g_account_uid");
  assert.notEqual(adapterRequest.accountId,"client-spoofed-account");

  const existingFixture=accountEnvelope(uid,"active",null);
  const existing=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[]),
    runAtomicAccountBootstrap:async request=>({committed:false,decision:request.decide(existingFixture)})
  });
  assert.equal(existing.ok,true);
  assert.equal(existing.action,"existing");
  assert.equal(existing.status,"active");
  assert.equal(existing.revision,4);
  assert.equal(existing.preserveExisting,true);

  for(const [status,deletionRequestedAt] of [["disabled",null],["deletion-pending","trusted-delete-time"]]){
    const outcome=await execution.executeTrustedAccountBootstrap({
      idToken:rawToken,
      verifyIdToken:verifierFor(uid,rawToken,[]),
      runAtomicAccountBootstrap:async request=>({
        committed:false,
        decision:request.decide(accountEnvelope(uid,status,deletionRequestedAt))
      })
    });
    assert.equal(outcome.ok,true);
    assert.equal(outcome.action,"existing");
    assert.equal(outcome.status,status);
    assert.equal(outcome.preserveExisting,true);
  }

  const conflicting=accountEnvelope("different_stored_identity","active",null);
  const conflict=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[]),
    runAtomicAccountBootstrap:async request=>({committed:false,decision:request.decide(conflicting)})
  });
  assert.equal(conflict.ok,false);
  assert.equal(conflict.code,"ACCOUNT_DOCUMENT_IDENTITY_CONFLICT");

  const missingAdapter=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[])
  });
  assert.equal(missingAdapter.ok,false);
  assert.equal(missingAdapter.code,"TRUSTED_ACCOUNT_TRANSACTION_UNAVAILABLE");

  const transactionFailure=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[]),
    runAtomicAccountBootstrap:async()=>{throw new Error(`provider diagnostic ${rawToken}`);}
  });
  assert.equal(transactionFailure.ok,false);
  assert.equal(transactionFailure.code,"TRUSTED_ACCOUNT_TRANSACTION_FAILED");
  assert.equal(JSON.stringify(transactionFailure).includes(rawToken),false);
  assert.equal(JSON.stringify(transactionFailure).includes("provider diagnostic"),false);

  const invalidResult=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[]),
    runAtomicAccountBootstrap:async()=>({committed:false})
  });
  assert.equal(invalidResult.code,"TRUSTED_ACCOUNT_TRANSACTION_RESULT_INVALID");

  const commitMismatch=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[]),
    runAtomicAccountBootstrap:async request=>({committed:false,decision:request.decide(null)})
  });
  assert.equal(commitMismatch.code,"TRUSTED_ACCOUNT_TRANSACTION_COMMIT_MISMATCH");

  const identityMismatch=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:verifierFor(uid,rawToken,[]),
    runAtomicAccountBootstrap:async()=>({
      committed:true,
      decision:{ok:true,action:"create",accountId:"other_uid",documentPath:"accounts/other_uid"}
    })
  });
  assert.equal(identityMismatch.code,"TRUSTED_ACCOUNT_TRANSACTION_IDENTITY_MISMATCH");

  const providerDisabled=await execution.executeTrustedAccountBootstrap({
    idToken:rawToken,
    verifyIdToken:async()=>{const error=new Error("do not leak provider detail");error.code="auth/user-disabled";throw error;},
    runAtomicAccountBootstrap:async()=>{throw new Error("must not run");}
  });
  assert.equal(providerDisabled.code,"PROVIDER_ACCOUNT_DISABLED");
  assert.equal(JSON.stringify(providerDisabled).includes("do not leak"),false);

  assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
  assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);

  assert.match(document,/read the authoritative account document inside the same atomic transaction/i);
  assert.match(document,/at most one initial account create may commit/i);
  assert.match(document,/updatedByDeviceId` is exactly `null`/i);
  assert.match(document,/no registered application device exists yet/i);
  assert.match(document,/account-bootstrap-only/);
  assert.match(document,/server client libraries bypass Firestore Security Rules and are secured through IAM/i);
  assert.match(document,/does not select or authorize a production service identity/i);
  assert.match(document,/Every application-client Firestore create, update and delete remains denied/i);
  assert.match(document,/global rankings/i);
  assert.match(document,/Candidate A remains non-mutating export[\s\S]+Candidate B remains strictly read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
  assert.match(document,/Stage 3[\s\S]+BLOCKED/i);
  assert.match(document,/Private Remote Joining[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i);
  assert.match(stage2e,/Status: DONE \/ MERGED \/ PROVEN/);
  assert.match(stage2f,/Trusted Request Authentication & ID Token Revocation Boundary/);

  process.stdout.write("PASS Stage 2G trusted atomic account-bootstrap execution boundary contracts\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
