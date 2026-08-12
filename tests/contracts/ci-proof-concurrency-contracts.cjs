const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(file){ return fs.readFileSync(file, "utf8"); }

const guardedProofWorkflows = [
  ".github/workflows/validate-stability-lane.yml",
  ".github/workflows/validate-import-analysis.yml",
  ".github/workflows/validate-atomic-restore.yml"
];

const safeCancellationPolicy = "cancel-in-progress: ${{ github.run_attempt == 1 && github.event_name != 'workflow_dispatch' }}";

for(const file of guardedProofWorkflows){
  const source = read(file);
  assert.ok(source.includes("concurrency:"), `${file} must retain an explicit concurrency group.`);
  assert.ok(
    source.includes(safeCancellationPolicy),
    `${file} must allow only fresh first-attempt automatic runs to cancel stale work; reruns/manual dispatches must not cancel an active proof.`
  );
  assert.ok(!source.includes("cancel-in-progress: true"), `${file} must not restore unconditional proof cancellation.`);
}

const stability = read(".github/workflows/validate-stability-lane.yml");
assert.ok(stability.includes("workflow_dispatch:"), "Stability must remain manually repeatable for independent same-SHA proof.");
assert.ok(stability.includes("Run two consecutive complete browser, backup, import, restore, provenance, Home and crop-safe photo audits"), "Stability must retain its two-cycle browser proof.");
assert.ok(stability.includes("Wait for Pages and verify every runtime byte"), "Stability must retain exact deployed-byte verification.");

const burnIn = read(".github/workflows/validate-v110-release-burnin.yml");
assert.ok(burnIn.includes("cancel-in-progress: false"), "Release Burn-In must remain non-cancelling so independent passes/reruns cannot terminate one another.");
assert.ok(burnIn.includes("pass: [1, 2, 3, 4, 5]"), "Release Burn-In must retain all five proof passes.");

process.stdout.write("PASS  CI proof concurrency: reruns/manual proofs cannot cancel active Stability/Candidate B/C evidence; Burn-In remains non-cancelling\n");
