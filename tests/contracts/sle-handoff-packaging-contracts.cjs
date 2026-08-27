const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = path => fs.readFileSync(path);
const text = path => read(path).toString("utf8");
const json = path => JSON.parse(text(path));

const capsule = json("SESSION_BOOTSTRAP.json");
const readiness = json("REMOTE_JOINING_READINESS.json");
const graph = json("SESSION_CONTEXT_GRAPH.json");
const index = text("index.html");
const pkg = json("package.json");
const sle = text("00_SLE_HANDOFF_PROTOCOL.md");
const rootAuth = text("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const provenance = text("authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");

assert.equal(capsule.schemaVersion, 5);
assert.equal(capsule.repository, "nikahanghojjati-oss/fifa17-career-showdown2");
assert.equal(capsule.publicSite, "https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/");
assert.equal(capsule.slePolicy.definition, "Smart Lean Efficient");
assert.equal(capsule.slePolicy.mandatoryForEveryFutureHandoff, true);
assert.equal(capsule.slePolicy.plainChatOnlyHandoffComplete, false);
assert.equal(capsule.slePolicy.requiredAtHandoffProximity100, true);
assert.equal(capsule.slePolicy.recursiveInheritance, true);

const handoffRoot = capsule.currentHandoff.canonical;
const handoffMirror = capsule.currentHandoff.projectMirror;
const starterRoot = capsule.starter.canonical;
const starterMirror = capsule.starter.projectMirror;
const readyToPaste = text("project-documents/START_NEXT_SESSION.md");
for (const path of [
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
]) assert.ok(fs.existsSync(path), `SLE package is missing ${path}`);

assert.deepEqual(read(handoffRoot), read(handoffMirror), "SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot), read(starterMirror), "SLE starter root and project mirror must remain byte-identical.");
assert.match(starterRoot, new RegExp(`START_NEXT_SESSION_V${capsule.starter.version.replace(/\./g, "\\.")}`));
assert.equal(capsule.starter.ownerInitialDelivery, "give-only-this-file-first");
assert.equal(capsule.starter.fallbackPackNeededByDefault, false);
assert.ok(readyToPaste.includes(starterRoot), "Ready-to-paste successor entrypoint must name the capsule's current starter.");
assert.ok(readyToPaste.includes(handoffRoot), "Ready-to-paste successor entrypoint must name the capsule's current deep handoff.");
assert.ok(readyToPaste.includes(`v${pkg.version}`), "Ready-to-paste successor entrypoint must identify the current source application.");
assert.ok(readyToPaste.includes(`${readiness.currentScore}/100`), "Ready-to-paste successor entrypoint must identify the fixed current RJR score.");
assert.doesNotMatch(readyToPaste, /START_NEXT_SESSION_V1\.4\.11_V1\.8\.0_RIVALRY_AUTHORITY_MISMATCH/, "Ready-to-paste successor entrypoint must not route to the superseded pointer-repair starter.");

assert.equal(capsule.remoteJoiningReadiness.authority, "REMOTE_JOINING_READINESS.json");
assert.equal(capsule.remoteJoiningReadiness.model, readiness.modelVersion);
assert.equal(capsule.remoteJoiningReadiness.score, readiness.currentScore);
assert.match(capsule.remoteJoiningReadiness.rule, /capability evidence|genuine/i);
assert.equal(readiness.denominator, 100);
assert.ok(Number.isInteger(readiness.currentScore) && readiness.currentScore >= 0 && readiness.currentScore <= 100);

const sourceRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const sourceVersion = (sourceRevision && sourceRevision.match(/^(\d+\.\d+\.\d+)-r\d+$/) || [])[1];
const productionVersion = (capsule.runtime.productionRuntimeRevision && capsule.runtime.productionRuntimeRevision.match(/^(\d+\.\d+\.\d+)-r\d+$/) || [])[1];
assert.equal(sourceVersion, pkg.version, "Current source package and runtime revision must remain coherent.");
assert.equal(capsule.runtime.applicationVersion, productionVersion, "Production application version must match the production runtime revision.");
assert.match(capsule.runtime.productionStatus, /production-proven/i);

const hasCandidate = Boolean(capsule.runtime.candidateApplicationVersion || capsule.runtime.candidateRuntimeRevision || capsule.runtime.candidateStatus);
if (hasCandidate) {
  assert.equal(capsule.runtime.candidateApplicationVersion, pkg.version, "A source candidate must track package version.");
  assert.equal(capsule.runtime.candidateRuntimeRevision, sourceRevision, "A source candidate must track source runtime revision.");
  assert.match(capsule.runtime.candidateStatus || "", /not-production-proven|release-candidate|production-proven/i, "A source candidate must classify production proof truthfully.");
  const claimsProductionProven = /production-proven/i.test(capsule.runtime.candidateStatus) && !/not-production-proven/i.test(capsule.runtime.candidateStatus);
  if (claimsProductionProven) {
    assert.equal(capsule.runtime.candidateApplicationVersion, capsule.runtime.applicationVersion, "A production-proven candidate must equal production application identity.");
    assert.equal(capsule.runtime.candidateRuntimeRevision, capsule.runtime.productionRuntimeRevision, "A production-proven candidate must equal production runtime identity.");
  }
} else {
  assert.equal(sourceVersion, capsule.runtime.applicationVersion, "With no unmerged candidate, source and production application identities must match.");
  assert.equal(sourceRevision, capsule.runtime.productionRuntimeRevision, "With no unmerged candidate, source and production runtime identities must match exactly.");
  assert.equal(capsule.runtime.candidateRuntimeMergeSha, null, "No-candidate production handoff must not invent a candidate merge SHA.");
}

const productionIsKnownRegressed = /regression|known-bad/i.test(capsule.runtime.productionStatus);
if (productionIsKnownRegressed) {
  assert.equal(capsule.runtime.immediateRecoveryRuntime, capsule.runtime.previousKnownGoodRecoveryRuntime, "Known-bad production must recover to the previous known-good whole shell.");
  assert.notEqual(capsule.runtime.immediateRecoveryRuntime, capsule.runtime.productionRuntimeRevision, "Known-bad production cannot recover to itself.");
} else {
  assert.ok(capsule.runtime.immediateRecoveryRuntime, "Production-proven handoff must retain an explicit recovery runtime.");
  assert.notEqual(capsule.runtime.immediateRecoveryRuntime, capsule.runtime.productionRuntimeRevision, "The recovery target must remain a distinct prior whole shell when one is recorded.");
}
assert.equal(capsule.runtime.appCheckEnforcement, false);
assert.equal(capsule.runtime.billingRequired, false);
assert.match(capsule.runtime.productionClientFirestore, /memory-only/i);

assert.deepEqual(capsule.criticalLocks.canonicalStorage, [
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);
assert.equal(capsule.criticalLocks.activeShowdownCanonical, false);
assert.equal(capsule.criticalLocks.candidateA, "non-mutating-export");
assert.equal(capsule.criticalLocks.candidateB, "read-only-import-analysis");
assert.equal(capsule.criticalLocks.candidateC, "sole-destructive-import-apply-authority");
assert.equal(capsule.criticalLocks.appCheck, "production-proven-enforcement-off");
assert.equal(capsule.criticalLocks.firestorePersistence, "memory-only");
assert.equal(capsule.criticalLocks.trustedRuntimeIam, "stage2h-reviewed-not-broadened-not-activated");
assert.deepEqual(capsule.criticalLocks.stage2hIamPermissions, [
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.equal(capsule.criticalLocks.zeroBilling, true);
assert.equal(capsule.criticalLocks.publicDiscovery, false);
assert.equal(capsule.criticalLocks.publicCommunity, false);
assert.equal(capsule.criticalLocks.publicMatchmaking, false);
assert.equal(capsule.criticalLocks.globalLeaderboardsRankings, false);
assert.equal(capsule.criticalLocks.standingMergeDeployAuthorizedAfterRequiredGates, true);

assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval, true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority, "00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.equal(capsule.ownerStandingAuthorization.provenance, "authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
assert.match(rootAuth, /through completion of the full Career Mode Showdown project/i);
assert.match(provenance, /through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth, /later explicit owner instruction may revoke or narrow/i);
assert.match(provenance, /later explicit owner instructions override/i);

assert.match(sle, /SLE = Smart Lean Efficient/i);
assert.match(sle, /mandatory future-developer rule/i);
assert.match(sle, /plain chat-only successor prompt[\s\S]{0,160}not a complete project handoff/i);
assert.match(sle, /SESSION_BOOTSTRAP\.json/i);
assert.match(sle, /SESSION_CONTEXT_GRAPH\.json/);
assert.match(sle, /Handoff proximity: 100%/i);
assert.match(capsule.wec100PackagingRule, /Smart Lean Efficient/i);
assert.match(capsule.wec100PackagingRule, /stop before the next substantial milestone/i);

const starter = text(starterRoot);
const handoff = text(handoffRoot);
for (const [name, value] of [["starter", starter], ["handoff", handoff]]) {
  assert.match(value, /(?:SLE = Smart Lean Efficient|Smart Lean Efficient \(SLE\))/i, `${name} must preserve the owner SLE definition.`);
  assert.match(value, /IMMEDIATE NEXT TASK AFTER FULL STUDY/i, `${name} must identify the immediate next task.`);
  assert.match(value, /standing[\s\S]{0,350}merge[\s\S]{0,260}deploy/i, `${name} must preserve standing merge/deploy authorization.`);
  assert.match(value, /required (?:test|tests|gate|gates)/i, `${name} must condition publication on validation.`);
  assert.match(value, /App Check enforcement remains OFF/i, `${name} must preserve the App Check enforcement lock.`);
  assert.match(value, /Remote Joining readiness/i, `${name} must preserve RJR reporting authority.`);
  assert.match(value, /Handoff proximity: X%/i, `${name} must preserve the seven-line progress format.`);
  assert.match(value, /Handoff proximity: X%\s*\nRemote Joining readiness: ~Y%/i, `${name} must preserve the exact owner-facing readiness percentage template.`);
  assert.match(value, /Sidequest check:/i, `${name} must preserve the seven-line progress format.`);
}

assert.equal(graph.schemaVersion, 2);
assert.ok(graph.nodes.some(node => node.id === "rjr1-ledger" && node.recordedScore === readiness.currentScore), "Context graph RJR pointer must match the current fixed ledger.");
if (capsule.immediateNextTask.mustStartAsRealProductWork) {
  assert.ok(graph.nodes.some(node => node.type === "immediate-next-product-milestone"), "A product-starting capsule must point at the next real product milestone.");
} else {
  assert.equal(capsule.transition?.contextTransitionRequired, true, "A non-product handoff task is legal only at an explicit context transition.");
  assert.equal(capsule.transition?.handoffCompleteness, 100, "A non-product handoff task is legal only for a complete handoff package.");
  assert.match(capsule.immediateNextTask.name || "", /sle-publication/i, "A transition-only immediate task must be the bounded recursive SLE publication step.");
  assert.ok(graph.nodes.some(node => node.id === "successor-selection"), "Transition package must route successor through fresh-WEC product selection.");
  assert.ok(graph.nodes.some(node => node.id === "stage5-private-remote-joining"), "Transition package must retain the real Remote Joining destination while Stage 5 stays locked.");
}
assert.match(graph.retrievalHints.walkDirection, /product work|Remote Joining/i);

assert.ok(capsule.minimalReads.includes("00_SLE_HANDOFF_PROTOCOL.md"));
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"));
assert.ok(capsule.targetedReads.includes("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md"));
assert.ok(capsule.targetedReads.includes("js/cloudSyncRemoteContract.js"));
assert.equal(capsule.immediateNextTask.mustNotInsertGenericPrerequisiteLane, true);

process.stdout.write(`PASS SLE package: live-first Smart Lean Efficient handoff is coherent for source ${pkg.version}/${sourceRevision}, production ${capsule.runtime.applicationVersion}/${capsule.runtime.productionRuntimeRevision}, RJR ${readiness.currentScore}/100, and ${capsule.immediateNextTask.mustStartAsRealProductWork ? "the next real product milestone" : "a sealed transition-only publication boundary before fresh-WEC product selection"}.\n`);
