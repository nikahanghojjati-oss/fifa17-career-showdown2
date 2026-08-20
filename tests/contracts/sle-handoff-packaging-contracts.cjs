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
  handoffRoot,
  handoffMirror,
  starterRoot,
  starterMirror,
  "00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md",
  "authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md"
]){
  assert.ok(fs.existsSync(path),`SLE package is missing ${path}`);
}

assert.deepEqual(read(handoffRoot),read(handoffMirror),"SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot),read(starterMirror),"SLE starter root and project mirror must remain byte-identical.");

assert.equal(capsule.schemaVersion,5);
assert.equal(capsule.currentPullRequest.number,115);
assert.equal(capsule.currentPullRequest.branch,"agent/production-app-check-runtime");
assert.equal(capsule.currentPullRequest.base,"main");
assert.equal(capsule.currentPullRequest.baseSha,"7944b87a20cf793c659077d7518c4446f178e32c");
assert.equal(capsule.currentPullRequest.prePackagingValidatedCandidateHead,"36debe7511bd4001a17be03b5e3d787559fd032a");
assert.equal(capsule.currentPullRequest.prePackagingWorkflowFamiliesGreen,13);
assert.equal(capsule.currentPullRequest.reviewsCleanAtPrePackagingHead,true);
assert.equal(capsule.currentPullRequest.threadsCleanAtPrePackagingHead,true);
assert.equal(capsule.currentPullRequest.mergeableAtPrePackagingHead,true);
assert.equal(capsule.currentPullRequest.mergeAuthorized,true,"Standing owner authorization must remain active for PR #115 after all required gates pass.");
assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval,true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority,"00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.equal(capsule.ownerStandingAuthorization.provenance,"authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
assert.equal(capsule.starter.version,"1.3.1");
assert.equal(starterRoot,"START_NEXT_SESSION_V1.3.1_PR115.md");
assert.equal(starterMirror,"project-documents/session-starts/START_NEXT_SESSION_V1.3.1_PR115.md");
assert.equal(handoffRoot,"SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md");
assert.equal(handoffMirror,"project-documents/handoffs/SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md");
assert.equal(capsule.runtime.applicationVersion,"1.4.0");
assert.equal(capsule.runtime.productionRuntimeRevision,"1.4.0-r1");
assert.equal(capsule.runtime.candidateRuntimeRevision,"1.4.0-r2");
assert.equal(capsule.runtime.productionAppCheckTrafficProven,false);
assert.equal(capsule.runtime.appCheckEnforcement,false);
assert.equal(capsule.remoteJoiningReadiness.score,59);
assert.equal(capsule.criticalLocks.applicationClientFirestoreWrites,"deny-all");
assert.equal(capsule.criticalLocks.stage3Pairing,"blocked-until-genuine-stage2-production-operational-activation-complete");
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"),"Standing owner authorization must be a Tier-0 successor read.");
assert.match(capsule.wec100PackagingRule,/final transition-prepared WEC seal as the last PR-branch mutation/i);
assert.match(capsule.wec100PackagingRule,/validate that sealed exact head/i);

const starter=text(starterRoot);
const handoff=text(handoffRoot);
const rootAuth=text("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const provenance=text("authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");

for(const [name,value] of [["starter",starter],["handoff",handoff],["root authorization",rootAuth],["authorization provenance",provenance]]){
  assert.match(value,/standing[\s\S]{0,260}merge[\s\S]{0,180}deploy/i,`${name} must preserve standing merge/deploy authorization.`);
  assert.match(value,/required (?:test|tests|repository test|repository tests|gate|gates)/i,`${name} must keep merge/deploy conditional on required validation.`);
}

assert.match(starter,/all 13 normal workflow families[\s\S]{0,100}(completed successfully|green)/i);
assert.match(starter,/submitted reviews[\s\S]{0,80}(empty|clean)/i);
assert.match(starter,/inline review threads[\s\S]{0,80}(empty|clean)/i);
assert.match(starter,/mergeable/i);
assert.match(starter,/expected-head/i);
assert.match(starter,/Stage 3[\s\S]{0,180}(blocked|Do not begin)/i);
assert.match(handoff,/all 13 normal PR workflow families[\s\S]{0,100}(success|green)/i);
assert.match(handoff,/final transition-prepared WEC seal is the last PR-branch mutation/i);
assert.match(handoff,/Do not merge\/deploy/i,"Predecessor handoff must stop before successor-owned publication after WEC=100.");
assert.match(handoff,/legitimate production App Check token traffic[\s\S]{0,120}enforcement remains OFF/i);
assert.match(handoff,/application-client Firestore create\/update\/delete remains deny-all/i);
assert.match(rootAuth,/through completion of the full Career Mode Showdown project/i);
assert.match(provenance,/through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth,/later explicit owner instruction may revoke or narrow/i);
assert.match(provenance,/later explicit owner instructions override/i);

process.stdout.write("PASS SLE package: PR #115 handoff/starter mirrors, capsule pointers, pre-packaging proof, immutable-seal rule, RJR/security locks and standing owner merge/deploy authorization are protected.\n");
