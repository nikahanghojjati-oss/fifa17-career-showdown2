const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const policy = read("PROJECT_OPERATING_SYSTEM_V3.md");
const model = JSON.parse(read("PROJECT_OPERATING_SYSTEM_V3.json"));
const taxonomy = JSON.parse(read("PROJECT_OPERATING_SYSTEM_V3_FAILURE_TAXONOMY.json"));
const guards = JSON.parse(read("CURRENT_PRODUCT_GUARDS.json"));
const manifest = JSON.parse(read("CURRENT_PRODUCT_TEST_MANIFEST.json"));
const dormant = JSON.parse(read("DORMANT_ARCHITECTURE_TEST_MANIFEST.json"));
const opsRunner = read("tests/support/run-operations-audit.cjs");
const productRunner = read("tests/support/run-current-product-contracts.cjs");
const cloudFoundation = read("tests/contracts/cloud-foundation-runtime-contracts.cjs");
const pkg = JSON.parse(read("package.json"));
const next = read("NEXT_TASK.md");

assert.equal(model.operatingSystem, "POS-3");
assert.equal(model.status, "current");
assert.deepEqual(model.startupLoadSet, ["PROJECT_OPERATING_SYSTEM_V3.md","CURRENT_PRODUCT_GUARDS.json","NEXT_TASK.md"]);
assert.equal(model.session.transferDecisionModel, "TDS-1");
assert.equal(model.session.percentageScore, false);
assert.equal(model.resumeCapsule.model, "RCP-1");
assert.equal(model.resumeCapsule.repositoryCommitRequired, false);
assert.equal(model.resumeCapsule.continuityOnlyPullRequestAllowed, false);
assert.equal(model.resumeCapsule.mirrorsRequired, false);
assert.equal(model.resumeCapsule.successorMustReverifyLiveAuthority, true);
assert.equal(model.legacy["SHP-2"], "RETIRED_PERCENTAGE");
assert.equal(model.legacy["HTR-1"], "RETIRED_SCORE_CHECKS_FOLDED_INTO_RCP");
assert.equal(model.legacy.WEC, "LEGACY_RECOVERY_PROVENANCE_ONLY");
assert.equal(model.legacy.SNS, "SUPERSEDED_FOR_NEW_TRANSFERS");
assert.equal(model.ci.historicalNarrationMayBlockProductCI, false);
assert.equal(model.ci.exactWorkflowCountMayBlock, false);
assert.equal(model.ci.coherentChangeShouldPreferOneTestedCommit, true);

assert.match(policy, /TDS-1 Transfer Decision Signal/);
assert.match(policy, /CONTINUE[\s\S]+CHECKPOINT_SOON[\s\S]+FINISH_ATOMIC_THEN_TRANSFER[\s\S]+TRANSFER_NOW/);
assert.match(policy, /does not need to ask for SNS/i);
assert.match(policy, /external transfer artifact/i);
assert.match(policy, /MUST NOT be committed merely to publish the handoff/i);
assert.match(policy, /continuity-only PRs:\s*prohibited/i);
assert.match(policy, /A single interruption[\s\S]+not themselves handoff reasons/i);
assert.match(policy, /elapsed time, message count, reads, successful commands and commit count/i);

assert.equal(taxonomy.operatingSystem, "POS-3");
for (const id of [
  "STATE_CONVERGENCE_RECOVERY",
  "ACCEPTANCE_RUNTIME_REALITY",
  "DEPLOYMENT_ARTIFACT_COMPLETENESS",
  "TWO_MANAGER_PRESENTATION_AUTHORITY",
  "SECURITY_PRIVACY_PROVIDER",
  "ATOMIC_LOCAL_RECOVERY",
  "PROCESS_PROVENANCE_DRIFT",
  "DORMANT_ARCHITECTURE",
  "TOPOLOGY_MAGIC_NUMBER",
  "TEXT_SELF_REFERENCE_FALSE_POSITIVE"
]) assert.ok(taxonomy.classes.some(item => item.id === id), `Missing POS3 failure class ${id}.`);

assert.equal(guards.provider.billingEnabled, false);
assert.equal(guards.provider.firebasePlan, "Spark");
assert.equal(guards.provider.cloudRunAllowed, false);
assert.equal(guards.provider.cloudFunctionsAllowed, false);
assert.equal(guards.product.managerCount, 2);
assert.equal(guards.product.pairingAndExactActiveBeforeLeagueOrClubs, true);
assert.equal(guards.product.candidateCOnlyDestructiveRemoteToLocalApply, true);
assert.equal(guards.privacy.publicMatchmaking, false);

assert.ok(Array.isArray(manifest.tests) && manifest.tests.length > 0);
assert.equal(dormant.automaticCI, false);
for (const archived of dormant.tests) assert.ok(!manifest.tests.includes(archived), `${archived} must not return to current product CI.`);

assert.match(opsRunner, /project-operating-system-v3-contracts\.cjs/);
assert.match(opsRunner, /pos3-session-operations-contracts\.cjs/);
assert.doesNotMatch(opsRunner, /project-operating-system-v2-contracts|pos2-session-operations-contracts/);
assert.doesNotMatch(productRunner, /manifest\.operatingSystem\s*!==\s*["']POS-2["']/,
  "The current product runner must not fail merely because the process operating-system label changes.");
assert.doesNotMatch(cloudFoundation, /guards\.operatingSystem/,
  "A product/provider gate must not couple product correctness to the process operating-system version.");

assert.equal(pkg.scripts["work:transition"], "node scripts/pos3-transition.mjs");
assert.equal(pkg.scripts["work:resume-capsule"], "node scripts/build-resume-capsule.mjs");
assert.match(next, /PROJECT_OPERATING_SYSTEM_V3\.md/);
assert.match(next, /TDS-1/);
assert.match(next, /RCP-1/);

process.stdout.write("PASS POS v3 policy: product gates remain behavior-based, transfer is categorical, routine SNS/continuity PRs are retired, and one external Resume Capsule carries only genuine transfer state.\n");
