const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=path=>fs.readFileSync(path);
const text=path=>read(path).toString("utf8");
const json=path=>JSON.parse(text(path));

const capsule=json("SESSION_BOOTSTRAP.json");
const readiness=json("REMOTE_JOINING_READINESS.json");
const graph=json("SESSION_CONTEXT_GRAPH.json");
const index=text("index.html");
const pkg=json("package.json");
const sle=text("00_SLE_HANDOFF_PROTOCOL.md");
const rootAuth=text("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const provenance=text("authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");

assert.equal(capsule.schemaVersion,5);
assert.equal(capsule.repository,"nikahanghojjati-oss/fifa17-career-showdown2");
assert.equal(capsule.publicSite,"https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/");
assert.equal(capsule.slePolicy.definition,"Smart Lean Efficient");
assert.equal(capsule.slePolicy.mandatoryForEveryFutureHandoff,true);
assert.equal(capsule.slePolicy.plainChatOnlyHandoffComplete,false);
assert.equal(capsule.slePolicy.requiredAtHandoffProximity100,true);
assert.equal(capsule.slePolicy.recursiveInheritance,true);

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
])assert.ok(fs.existsSync(path),`SLE package is missing ${path}`);

assert.deepEqual(read(handoffRoot),read(handoffMirror),"SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot),read(starterMirror),"SLE starter root and project mirror must remain byte-identical.");
assert.match(starterRoot,new RegExp(`START_NEXT_SESSION_V${capsule.starter.version.replace(/\./g,"\\.")}`));
assert.equal(capsule.starter.ownerInitialDelivery,"give-only-this-file-first");
assert.equal(capsule.starter.fallbackPackNeededByDefault,false);

assert.equal(capsule.remoteJoiningReadiness.authority,"REMOTE_JOINING_READINESS.json");
assert.equal(capsule.remoteJoiningReadiness.model,readiness.modelVersion);
assert.equal(capsule.remoteJoiningReadiness.score,readiness.currentScore);
assert.match(capsule.remoteJoiningReadiness.rule,/capability evidence|genuine/i);
assert.equal(readiness.denominator,100);
assert.ok(Number.isInteger(readiness.currentScore)&&readiness.currentScore>=0&&readiness.currentScore<=100);

const sourceRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const sourceVersion=(sourceRevision&&sourceRevision.match(/^(\d+\.\d+\.\d+)-r\d+$/)||[])[1];
assert.equal(sourceVersion,pkg.version,"Current source package and runtime revision must remain coherent.");
assert.equal(capsule.runtime.applicationVersion,pkg.version);
assert.equal(capsule.runtime.productionRuntimeRevision,sourceRevision);
assert.equal(capsule.runtime.appCheckEnforcement,false);
assert.equal(capsule.runtime.billingRequired,false);
assert.match(capsule.runtime.productionClientFirestore,/memory-only/i);

assert.deepEqual(capsule.criticalLocks.canonicalStorage,[
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);
assert.equal(capsule.criticalLocks.activeShowdownCanonical,false);
assert.equal(capsule.criticalLocks.candidateA,"non-mutating-export");
assert.equal(capsule.criticalLocks.candidateB,"read-only-import-analysis");
assert.equal(capsule.criticalLocks.candidateC,"sole-destructive-import-apply-authority");
assert.equal(capsule.criticalLocks.appCheck,"production-proven-enforcement-off");
assert.equal(capsule.criticalLocks.firestorePersistence,"memory-only");
assert.equal(capsule.criticalLocks.trustedRuntimeIam,"stage2h-reviewed-not-broadened-not-activated");
assert.deepEqual(capsule.criticalLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.equal(capsule.criticalLocks.zeroBilling,true);
assert.equal(capsule.criticalLocks.publicDiscovery,false);
assert.equal(capsule.criticalLocks.publicCommunity,false);
assert.equal(capsule.criticalLocks.publicMatchmaking,false);
assert.equal(capsule.criticalLocks.globalLeaderboardsRankings,false);
assert.equal(capsule.criticalLocks.standingMergeDeployAuthorizedAfterRequiredGates,true);

assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval,true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority,"00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.equal(capsule.ownerStandingAuthorization.provenance,"authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
assert.match(rootAuth,/through completion of the full Career Mode Showdown project/i);
assert.match(provenance,/through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth,/later explicit owner instruction may revoke or narrow/i);
assert.match(provenance,/later explicit owner instructions override/i);

assert.match(sle,/SLE = Smart Lean Efficient/i);
assert.match(sle,/mandatory future-developer rule/i);
assert.match(sle,/plain chat-only successor prompt[\s\S]{0,160}not a complete project handoff/i);
assert.match(sle,/SESSION_BOOTSTRAP\.json/i);
assert.match(sle,/SESSION_CONTEXT_GRAPH\.json/);
assert.match(sle,/Handoff proximity: 100%/i);
assert.match(capsule.wec100PackagingRule,/Smart Lean Efficient/i);
assert.match(capsule.wec100PackagingRule,/stop before the next substantial milestone/i);

const starter=text(starterRoot);
const handoff=text(handoffRoot);
for(const [name,value] of [["starter",starter],["handoff",handoff]]){
  assert.match(value,/SLE = Smart Lean Efficient/i,`${name} must preserve the owner SLE definition.`);
  assert.match(value,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must identify the immediate next task.`);
  assert.match(value,/standing[\s\S]{0,350}merge[\s\S]{0,260}deploy/i,`${name} must preserve standing merge/deploy authorization.`);
  assert.match(value,/required (?:test|tests|gate|gates)/i,`${name} must condition publication on validation.`);
  assert.match(value,/App Check enforcement remains OFF/i,`${name} must preserve the App Check enforcement lock.`);
  assert.match(value,/Remote Joining readiness/i,`${name} must preserve RJR reporting authority.`);
  assert.match(value,/Handoff proximity: X%/i,`${name} must preserve the seven-line progress format.`);
  assert.match(value,/Sidequest check:/i,`${name} must preserve the seven-line progress format.`);
}

assert.equal(graph.schemaVersion,2);
assert.ok(graph.nodes.some(node=>node.type==="immediate-next-product-milestone"),"Context graph must point at the next real product milestone.");
assert.ok(graph.nodes.some(node=>node.id==="rjr1-ledger"&&node.recordedScore===readiness.currentScore),"Context graph RJR pointer must match the current fixed ledger.");
assert.match(graph.retrievalHints.walkDirection,/Stage 3|product work/i);

assert.ok(capsule.minimalReads.includes("00_SLE_HANDOFF_PROTOCOL.md"));
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"));
assert.ok(capsule.targetedReads.includes("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md"));
assert.ok(capsule.targetedReads.includes("js/cloudSyncRemoteContract.js"));
assert.equal(capsule.immediateNextTask.mustStartAsRealProductWork,true);
assert.equal(capsule.immediateNextTask.mustNotInsertGenericPrerequisiteLane,true);

process.stdout.write(`PASS SLE package: live-first Smart Lean Efficient handoff is coherent for ${pkg.version}/${sourceRevision}, RJR ${readiness.currentScore}/100 and the next real product milestone.\n`);
