const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const guards = JSON.parse(read("CURRENT_PRODUCT_GUARDS.json"));
const manifest = JSON.parse(read("CURRENT_PRODUCT_TEST_MANIFEST.json"));
const legacySuite = read("tests/support/run-legacy-provenance-audit.cjs");
const staticWorkflow = read(".github/workflows/validate-static-app.yml");
const securityWorkflow = read(".github/workflows/validate-stage5f-authenticated-negatives.yml");
const policy = read("PROJECT_OPERATING_SYSTEM_V2.md");

assert.equal(guards.operatingSystem, "POS-2");
assert.equal(manifest.operatingSystem, "POS-2");
assert.equal(guards.provider.billingEnabled, false);
assert.equal(guards.provider.firebasePlan, "Spark");
assert.equal(guards.product.managerCount, 2);
assert.equal(guards.product.pairingAndExactActiveBeforeLeagueOrClubs, true);
assert.equal(guards.product.candidateCOnlyDestructiveRemoteToLocalApply, true);
assert.equal(guards.privacy.publicMatchmaking, false);
assert.equal(guards.testing.historicalWordingMayBlock, false);
assert.equal(guards.testing.exactWorkflowCountMayBlock, false);

for (const processOnly of [
  "tests/contracts/work-environment-continuity-runtime-contracts.cjs",
  "tests/contracts/session-handoff-proximity-contracts.cjs",
  "tests/contracts/work-environment-forward-progress-contracts.cjs"
]) {
  assert.ok(!manifest.tests.includes(processOnly), `${processOnly} must not block the current product suite.`);
}

for (const historical of [
  "remote-joining-readiness-contracts.cjs",
  "rjr-reporting-authority-contracts.cjs",
  "cloud-foundation-contracts.cjs",
  "sle-handoff-packaging-contracts.cjs"
]) {
  assert.match(legacySuite, new RegExp(historical.replaceAll(".", "\\.")), `${historical} must remain preserved in the manual historical audit.`);
}

assert.equal((staticWorkflow.match(/npm run test:contracts/g) || []).length, 0, "Static App must not duplicate the full product suite.");
assert.doesNotMatch(staticWorkflow, /literalBlocks|expected 35 literal blocks|workflow block topology/i, "Workflow-count topology must not be a product gate.");
assert.equal((securityWorkflow.match(/npm run test:contracts/g) || []).length, 0, "Specialist authenticated-negative CI must not duplicate the full product suite.");
assert.doesNotMatch(securityWorkflow, /handoff-immediate-next-task|sle-handoff-packaging|WORK_ENVIRONMENT_STATUS/, "Specialist security CI must not trigger from continuity-only files.");

assert.match(policy, /SSJR[\s\S]+KEEP ACTIVE/i);
assert.match(policy, /MDP[\s\S]+KEEP ACTIVE/i);
assert.match(policy, /RJR-1[\s\S]+FREEZE AND ARCHIVE/i);
assert.match(policy, /ADB-1[\s\S]+KEEP ACTIVE/i);
assert.match(policy, /HTR-1[\s\S]+ARCHIVE THE SCORE/i);
assert.match(policy, /SLE[\s\S]+NOT A GATE/i);
assert.match(policy, /SNS[\s\S]+REMODEL/i);

process.stdout.write("PASS POS v2 operations policy: product, operations and historical gates are separated; permanent guards remain machine-readable; duplicated suite execution and workflow-count gating are forbidden.\n");
