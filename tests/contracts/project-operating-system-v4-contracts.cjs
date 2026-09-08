const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = file => fs.readFileSync(file, "utf8");

const policy = read("PROJECT_OPERATING_SYSTEM_V4.md");
const model = JSON.parse(read("PROJECT_OPERATING_SYSTEM_V4.json"));
const pkg = JSON.parse(read("package.json"));
const runner = read("tests/support/run-current-product-contracts.cjs");
const topRunner = read("tests/support/run-pos4-product-suite.cjs");
const next = read("NEXT_TASK.md");

assert.equal(model.operatingSystem, "POS-4");
assert.equal(model.continuity.recoveryBeacon, "RB-1");
assert.equal(model.continuity.transferDecision, "TDS-2");
assert.equal(model.continuity.resumeCapsule, "RCP-2");
assert.equal(model.debugging.adaptiveBudget, "ADB-3");
assert.equal(model.testing.failureCensus, "FC-1");
assert.equal(model.testing.gatePurity, "GP-1");

for (const concept of ["Recovery Beacon", "Failure Census", "Product Gate Purity", "TRANSFER_AFTER_ATOMIC", "TRANSFER_NOW"]) {
  assert.ok(policy.includes(concept), `POS-4 policy must define ${concept}.`);
}
assert.match(policy, /owner does not need to ask for SNS/i);
assert.match(policy, /execute every current blocking contract[\s\S]+all failures/i);

assert.ok(runner.includes("manifest.tests"), "FC-1 runner must use the current product manifest.");
assert.ok(runner.includes("failures.push"), "FC-1 runner must accumulate failures.");
assert.ok(runner.includes("FC-1 FAILURE CENSUS"), "FC-1 runner must emit the complete failure census.");
assert.ok(runner.includes("process.exitCode = 1"), "FC-1 runner must fail only after census completion.");
assert.doesNotMatch(runner, /if\s*\(result\.status\s*!==\s*0[^}]*process\.exit\(/s, "FC-1 must not exit immediately on the first child failure.");
assert.ok(topRunner.includes("failures.push"), "Top-level POS-4 suite must also collect independent entrypoint failures.");

assert.equal(pkg.scripts["work:transition"], "node scripts/pos4-transition.mjs");
assert.equal(pkg.scripts["work:recovery-beacon"], "node scripts/build-recovery-beacon.mjs");
assert.equal(pkg.scripts["test:contracts"], "node tests/support/run-pos4-product-suite.cjs");
assert.ok(next.includes("PROJECT_OPERATING_SYSTEM_V4.md"));
assert.ok(next.includes("RB-1"));
assert.ok(next.includes("FC-1"));

console.log("PASS POS v4 policy: non-mutating recovery, three-state transfer, failure-aware debugging, full failure census and pure product gates are current operating authority without formatting-sensitive assertions.");
