const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=path=>fs.readFileSync(path);
const text=path=>read(path).toString("utf8");
const capsule=JSON.parse(text("SESSION_BOOTSTRAP.json"));

const handoffRoot=capsule.currentHandoff.canonical;
const handoffMirror=capsule.currentHandoff.projectMirror;
const starterRoot=capsule.starter.canonical;
const starterMirror=capsule.starter.projectMirror;

for(const path of [
  "00_SLE_HANDOFF_PROTOCOL.md",
  "00_SESSION_BOOTSTRAP.md",
  handoffRoot,
  handoffMirror,
  starterRoot,
  starterMirror,
  "SESSION_CONTEXT_GRAPH.json",
  "SESSION_CONTEXT_MODEL.json",
  "SESSION_CONTEXT_LEARNING.json",
  "00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md",
  "authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md",
  "firestore.spark.rules"
]){
  assert.ok(fs.existsSync(path),`SLE package is missing ${path}`);
}

assert.deepEqual(read(handoffRoot),read(handoffMirror),"SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot),read(starterMirror),"SLE starter root and project mirror must remain byte-identical.");

assert.equal(capsule.schemaVersion,5);
assert.equal(capsule.lastVerifiedMainSha,"82413e36cd70bb10e332cb2aaa137ad350f2d241");
assert.equal(capsule.latestGovernanceMerge.pullRequest,121);
assert.equal(capsule.latestGovernanceMerge.mergeSha,"ab48ecec7f9560378f79eee30150d39a90834c35");
assert.equal(capsule.latestGovernanceMerge.runtimeChanged,false);
assert.equal(capsule.latestMainMerge.pullRequest,124);
assert.equal(capsule.latestMainMerge.mergeSha,"82413e36cd70bb10e332cb2aaa137ad350f2d241");
assert.equal(capsule.latestMainMerge.productionRulesPublished,false);

assert.equal(capsule.currentPullRequest.number,125);
assert.equal(capsule.currentPullRequest.state,"open");
assert.equal(capsule.currentPullRequest.branch,"agent/spark-production-account-runtime");
assert.equal(capsule.currentPullRequest.sourceValidationSealedHead,"d83a33066b271d7d89bf932f1066d9e1369b3f6d");
assert.equal(capsule.currentPullRequest.workflowFamiliesGreenAtSourceSeal,13);
assert.equal(capsule.currentPullRequest.reviewsCleanAtSourceSeal,true);
assert.equal(capsule.currentPullRequest.threadsCleanAtSourceSeal,true);
assert.equal(capsule.currentPullRequest.mergeableAtSourceSeal,true);
assert.equal(capsule.currentPullRequest.mergeAuthorized,true);
assert.equal(capsule.currentPullRequest.sourceValidation.staticAppRunId,32502859032);
assert.equal(capsule.currentPullRequest.sourceValidation.stabilityRunId,32502858761);
assert.equal(capsule.currentPullRequest.sourceValidation.candidateCRunId,32502858786);
assert.equal(capsule.currentPullRequest.sourceValidation.stabilityContracts,"success");
assert.equal(capsule.currentPullRequest.sourceValidation.chromiumStability,"success");
assert.equal(capsule.currentPullRequest.sourceValidation.deployedSiteSmoke,"skipped-on-pull-request");
assert.equal(capsule.currentPullRequest.sourceValidation.productionProof,false);
assert.equal(capsule.currentPullRequest.mandatoryPublicationGate.rulesFile,"firestore.spark.rules");
assert.equal(capsule.currentPullRequest.mandatoryPublicationGate.published,false);
assert.equal(capsule.currentPullRequest.mandatoryPublicationGate.verified,false);
assert.equal(capsule.currentPullRequest.mandatoryPublicationGate.mustCompleteBeforeMerge,true);
assert.equal(capsule.currentPullRequest.mergeSha,null);
assert.equal(capsule.currentPullRequest.postMergeProductionProof,null);

assert.equal(capsule.latestProductionProof.pullRequest,119);
assert.equal(capsule.latestProductionProof.workflow,"Validate Stability Lane");
assert.equal(capsule.latestProductionProof.runNumber,1230);
assert.equal(capsule.latestProductionProof.runId,32439162225);
assert.equal(capsule.latestProductionProof.headSha,"3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516");
assert.equal(capsule.latestProductionProof.conclusion,"success");
assert.equal(capsule.latestProductionProof.deployedSiteSmoke,"success");
assert.equal(capsule.latestProductionProof.runtimeRevision,"1.4.0-r2");

assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval,true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority,"00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.equal(capsule.ownerStandingAuthorization.provenance,"authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
assert.equal(capsule.slePolicy.authority,"00_SLE_HANDOFF_PROTOCOL.md");
assert.equal(capsule.slePolicy.definition,"Smart Lean Efficient");
assert.equal(capsule.slePolicy.mandatoryForEveryFutureHandoff,true);
assert.equal(capsule.slePolicy.plainChatOnlyHandoffComplete,false);
assert.equal(capsule.slePolicy.requiredAtHandoffProximity100,true);
assert.equal(capsule.slePolicy.recursiveInheritance,true);

assert.equal(capsule.starter.version,"1.4.1");
assert.equal(starterRoot,"START_NEXT_SESSION_V1.4.1_PR125.md");
assert.equal(starterMirror,"project-documents/session-starts/START_NEXT_SESSION_V1.4.1_PR125.md");
assert.equal(handoffRoot,"SUCCESSOR_HANDOFF_PR125_SPARK_CONNECTED_ACCOUNT_SOURCE_SEAL_SLE_2026-08-21.md");
assert.equal(handoffMirror,"project-documents/handoffs/SUCCESSOR_HANDOFF_PR125_SPARK_CONNECTED_ACCOUNT_SOURCE_SEAL_SLE_2026-08-21.md");

assert.equal(capsule.runtime.applicationVersion,"1.4.0");
assert.equal(capsule.runtime.productionRuntimeRevision,"1.4.0-r2");
assert.equal(capsule.runtime.candidateApplicationVersion,"1.5.0");
assert.equal(capsule.runtime.candidateRuntimeRevision,"1.5.0-r1");
assert.equal(capsule.runtime.candidateStatus,"release-candidate-not-production-proven");
assert.equal(capsule.runtime.candidateImmediateRecoveryRuntime,"1.4.0-r2");
assert.equal(capsule.runtime.productionRuntimeFirebaseConnected,true);
assert.equal(capsule.runtime.productionAppCheckTrafficProven,true);
assert.equal(capsule.runtime.appCheckEnforcement,false);
assert.equal(capsule.runtime.publishedBrowserFirestoreWrites,"deny-all");
assert.equal(capsule.runtime.productionClientAuthInitialized,false);
assert.equal(capsule.runtime.productionClientFirestoreInitialized,false);
assert.equal(capsule.runtime.productionClientStorageInitialized,false);
assert.equal(capsule.runtime.productionClientFunctionsInitialized,false);
assert.equal(capsule.runtime.candidateLazyAuth,true);
assert.equal(capsule.runtime.candidateLazyFirestoreMemoryOnly,true);
assert.equal(capsule.runtime.candidateOnlyProposedBrowserWrite,"strict-authenticated-self-account-revision-0-create");
assert.equal(capsule.runtime.candidateRulesFile,"firestore.spark.rules");
assert.equal(capsule.runtime.candidateRulesPublished,false);
assert.equal(capsule.runtime.knownGoodFallbackRuntime,"1.4.0-r1");

assert.equal(capsule.remoteJoiningReadiness.score,61);
assert.equal(capsule.criticalLocks.publishedApplicationClientFirestoreWrites,"deny-all");
assert.equal(capsule.criticalLocks.candidateRulesFile,"firestore.spark.rules");
assert.equal(capsule.criticalLocks.candidateOnlyNewWrite,"strict-authenticated-self-account-revision-0-create");
assert.equal(capsule.criticalLocks.downstreamRemoteMutations,"denied");
assert.equal(capsule.criticalLocks.trustedRuntimeIam,"stage2h-reviewed-not-broadened-not-activated");
assert.deepEqual(capsule.criticalLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.ok(capsule.minimalReads.includes("00_SLE_HANDOFF_PROTOCOL.md"),"Permanent SLE policy must be a Tier-0 successor read.");
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"),"Standing owner authorization must be a Tier-0 successor read.");
assert.ok(capsule.minimalReads.includes("firestore.spark.rules"),"Exact Spark Rules candidate must be a Tier-0 successor read at the publication handoff.");
assert.match(capsule.wec100PackagingRule,/Smart Lean Efficient/i);
assert.match(capsule.wec100PackagingRule,/mandatory[\s\S]*SLE packaging/i);
assert.match(capsule.wec100PackagingRule,/byte-identical project mirror/i);
assert.match(capsule.wec100PackagingRule,/stop before the next substantial milestone/i);

const starter=text(starterRoot);
const handoff=text(handoffRoot);
const sle=text("00_SLE_HANDOFF_PROTOCOL.md");
const rootAuth=text("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const provenance=text("authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");

for(const [name,value] of [["starter",starter],["handoff",handoff],["root authorization",rootAuth],["authorization provenance",provenance]]){
  assert.match(value,/standing[\s\S]{0,300}merge[\s\S]{0,220}deploy/i,`${name} must preserve standing merge/deploy authorization.`);
  assert.match(value,/required (?:test|tests|repository test|repository tests|gate|gates)/i,`${name} must keep merge/deploy conditional on required validation.`);
}

assert.match(sle,/SLE = Smart Lean Efficient/i);
assert.match(sle,/mandatory future-developer rule/i);
assert.match(sle,/Every future developer[\s\S]{0,220}handoff boundary[\s\S]{0,220}SLE/i);
assert.match(sle,/plain chat-only successor prompt[\s\S]{0,160}not a complete project handoff/i);
assert.match(sle,/root[\s\S]{0,100}project mirror/i);
assert.match(sle,/SESSION_BOOTSTRAP\.json/i);
assert.match(sle,/SESSION_CONTEXT_GRAPH\.json/);
assert.match(sle,/SESSION_CONTEXT_MODEL\.json/);
assert.match(sle,/SESSION_CONTEXT_LEARNING\.json/);
assert.match(sle,/recursive/i);
assert.match(sle,/Handoff proximity: 100%/i);

assert.match(starter,/SLE = Smart Lean Efficient/i);
assert.match(starter,/mandatory at every future handoff boundary/i);
assert.match(starter,/Validate Stability Lane #1230/i);
assert.match(starter,/run ID `32439162225`/i);
assert.match(starter,/Current production runtime: `1\.4\.0-r2`/i);
assert.match(starter,/App Check enforcement remains `OFF`/i);
assert.match(starter,/d83a33066b271d7d89bf932f1066d9e1369b3f6d/i);
assert.match(starter,/firestore\.spark\.rules/i);
assert.match(starter,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(starter,/At Handoff proximity 100%[\s\S]{0,320}complete SLE packaging/i);

assert.match(handoff,/DONE \/ MERGED \/ PROVEN/i);
assert.match(handoff,/Validate Stability Lane/i);
assert.match(handoff,/run ID `32439162225`/i);
assert.match(handoff,/Legitimate production App Check token traffic is proven/i);
assert.match(handoff,/App Check enforcement remains `OFF`/i);
assert.match(handoff,/application-client Firestore create\/update\/delete remains `deny-all`/i);
assert.match(handoff,/d83a33066b271d7d89bf932f1066d9e1369b3f6d/i);
assert.match(handoff,/all 13 normal pull-request workflow families succeeded/i);
assert.match(handoff,/firestore\.spark\.rules/i);
assert.match(handoff,/NOT yet published to production/i);
assert.match(handoff,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(handoff,/Mandatory recursive SLE rule/i);
assert.match(handoff,/Every successor must carry this rule forward/i);

assert.match(rootAuth,/through completion of the full Career Mode Showdown project/i);
assert.match(provenance,/through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth,/later explicit owner instruction may revoke or narrow/i);
assert.match(provenance,/later explicit owner instructions override/i);

process.stdout.write("PASS SLE package: PR125 source seal, PR119 production proof, v1.5 candidate/publication boundary, Smart Lean Efficient definition, RJR/security locks and standing owner merge/deploy authorization are protected.\n");
