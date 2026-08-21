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
  "authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md"
]){
  assert.ok(fs.existsSync(path),`SLE package is missing ${path}`);
}

assert.deepEqual(read(handoffRoot),read(handoffMirror),"SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot),read(starterMirror),"SLE starter root and project mirror must remain byte-identical.");

assert.equal(capsule.schemaVersion,5);
assert.equal(capsule.lastVerifiedMainSha,"ab48ecec7f9560378f79eee30150d39a90834c35");
assert.equal(capsule.latestGovernanceMerge.pullRequest,121);
assert.equal(capsule.latestGovernanceMerge.mergeSha,"ab48ecec7f9560378f79eee30150d39a90834c35");
assert.equal(capsule.latestGovernanceMerge.runtimeChanged,false);
assert.equal(capsule.currentPullRequest.number,119);
assert.equal(capsule.currentPullRequest.state,"merged");
assert.equal(capsule.currentPullRequest.mergeSha,"3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516");
assert.equal(capsule.currentPullRequest.workflowFamiliesGreenAtFinalSeal,13);
assert.equal(capsule.currentPullRequest.reviewsCleanAtFinalSeal,true);
assert.equal(capsule.currentPullRequest.threadsCleanAtFinalSeal,true);
assert.equal(capsule.currentPullRequest.mergeableAtFinalSeal,true);
assert.equal(capsule.currentPullRequest.mergeAuthorized,true);
assert.equal(capsule.currentPullRequest.postMergeProductionProof.workflow,"Validate Stability Lane");
assert.equal(capsule.currentPullRequest.postMergeProductionProof.runNumber,1230);
assert.equal(capsule.currentPullRequest.postMergeProductionProof.runId,32439162225);
assert.equal(capsule.currentPullRequest.postMergeProductionProof.headSha,"3d2ebefec683e0b3bf6b2beac08d54f1c3d9e516");
assert.equal(capsule.currentPullRequest.postMergeProductionProof.conclusion,"success");
assert.equal(capsule.currentPullRequest.postMergeProductionProof.deployedSiteSmoke,"success");
assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval,true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority,"00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.equal(capsule.ownerStandingAuthorization.provenance,"authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
assert.equal(capsule.slePolicy.authority,"00_SLE_HANDOFF_PROTOCOL.md");
assert.equal(capsule.slePolicy.definition,"Smart Lean Efficient");
assert.equal(capsule.slePolicy.mandatoryForEveryFutureHandoff,true);
assert.equal(capsule.slePolicy.plainChatOnlyHandoffComplete,false);
assert.equal(capsule.slePolicy.requiredAtHandoffProximity100,true);
assert.equal(capsule.slePolicy.recursiveInheritance,true);
assert.equal(capsule.starter.version,"1.4.0");
assert.equal(starterRoot,"START_NEXT_SESSION_V1.4.0_PR119.md");
assert.equal(starterMirror,"project-documents/session-starts/START_NEXT_SESSION_V1.4.0_PR119.md");
assert.equal(handoffRoot,"SUCCESSOR_HANDOFF_PR119_APP_CHECK_PRODUCTION_PROOF_SLE_2026-08-20.md");
assert.equal(handoffMirror,"project-documents/handoffs/SUCCESSOR_HANDOFF_PR119_APP_CHECK_PRODUCTION_PROOF_SLE_2026-08-20.md");
assert.equal(capsule.runtime.applicationVersion,"1.4.0");
assert.equal(capsule.runtime.productionRuntimeRevision,"1.4.0-r2");
assert.equal(capsule.runtime.productionRuntimeFirebaseConnected,true);
assert.equal(capsule.runtime.productionAppCheckTrafficProven,true);
assert.equal(capsule.runtime.appCheckEnforcement,false);
assert.equal(capsule.runtime.browserFirestoreWrites,"deny-all");
assert.equal(capsule.runtime.clientAuthInitialized,false);
assert.equal(capsule.runtime.clientFirestoreInitialized,false);
assert.equal(capsule.runtime.clientStorageInitialized,false);
assert.equal(capsule.runtime.clientFunctionsInitialized,false);
assert.equal(capsule.runtime.knownGoodFallbackRuntime,"1.4.0-r1");
assert.equal(capsule.remoteJoiningReadiness.score,61);
assert.equal(capsule.criticalLocks.applicationClientFirestoreWrites,"deny-all");
assert.equal(capsule.criticalLocks.trustedRuntimeIam,"stage2h-reviewed-not-broadened-not-activated");
assert.deepEqual(capsule.criticalLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.ok(capsule.minimalReads.includes("00_SLE_HANDOFF_PROTOCOL.md"),"Permanent SLE policy must be a Tier-0 successor read.");
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"),"Standing owner authorization must be a Tier-0 successor read.");
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

assert.match(starter,/SLE[\s\S]{0,200}every future handoff boundary/i);
assert.match(starter,/Validate Stability Lane #1230/i);
assert.match(starter,/run ID `32439162225`/i);
assert.match(starter,/production runtime: `1\.4\.0-r2`/i);
assert.match(starter,/App Check enforcement remains `OFF`/i);
assert.match(starter,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(starter,/At Handoff proximity 100%[\s\S]{0,220}complete SLE packaging/i);

assert.match(handoff,/DONE \/ MERGED \/ PROVEN/i);
assert.match(handoff,/Validate Stability Lane/i);
assert.match(handoff,/run ID: `32439162225`/i);
assert.match(handoff,/legitimate production App Check token traffic is proven/i);
assert.match(handoff,/App Check enforcement remains `OFF`/i);
assert.match(handoff,/application-client Firestore create\/update\/delete remains `deny-all`/i);
assert.match(handoff,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
assert.match(handoff,/Mandatory recursive SLE rule/i);
assert.match(handoff,/Every successor must carry this rule forward/i);
assert.match(rootAuth,/through completion of the full Career Mode Showdown project/i);
assert.match(provenance,/through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth,/later explicit owner instruction may revoke or narrow/i);
assert.match(provenance,/later explicit owner instructions override/i);

process.stdout.write("PASS SLE package: live main and PR121 governance boundary, PR119 production proof package, Smart Lean Efficient definition, RJR/security locks and standing owner merge/deploy authorization are protected.\n");
