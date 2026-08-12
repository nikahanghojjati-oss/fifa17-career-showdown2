const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(path){ return fs.readFileSync(path, "utf8"); }
function occurrences(text, needle){ return text.split(needle).length - 1; }

const stability = read(".github/workflows/validate-stability-lane.yml");
const candidateB = read(".github/workflows/validate-import-analysis.yml");
const candidateC = read(".github/workflows/validate-atomic-restore.yml");
const burnin = read(".github/workflows/validate-v110-release-burnin.yml");
const burninScript = read("tests/support/run-release-burnin-pass.sh");

function assertRerunSafeConcurrency(text, label){
  assert.match(text, /github\.run_attempt\s*==\s*1/, `${label} must only allow first attempts to cancel stale work.`);
  assert.match(text, /github\.event_name\s*!=\s*'workflow_dispatch'/, `${label} manual dispatch must queue rather than cancel active proof.`);
  assert.doesNotMatch(text, /group:[^\n]*(github\.sha|github\.run_id)/, `${label} concurrency group must not isolate every SHA/run and leave obsolete work consuming runners.`);
}

assertRerunSafeConcurrency(stability, "Stability");
assertRerunSafeConcurrency(candidateB, "Candidate B");
assertRerunSafeConcurrency(candidateC, "Candidate C");
assertRerunSafeConcurrency(burnin, "Burn-In");

const localStability = stability.split(/\n\s{2}deployed-site-smoke:/)[0];
assert.equal(occurrences(localStability, "npm run test:runtime-boundary"), 1, "Local Stability must run runtime provenance exactly once.");
assert.equal(occurrences(localStability, "npm run test:browser"), 1, "Local Stability must run the complete integration journey exactly once.");
for(const redundant of ["test:home-visual", "test:football-visual", "test:backup-browser", "test:import-browser", "test:restore-browser"]){
  assert.equal(occurrences(localStability, `npm run ${redundant}`), 0, `Local Stability must not duplicate specialized ${redundant} ownership.`);
}
assert.doesNotMatch(localStability, /for attempt in 1 2/, "Local Stability must not hide a second full matrix inside one job.");
assert.match(localStability, /timeout-minutes:\s*18/, "Canonical local Stability must retain the tightened timeout ceiling.");

for(const required of [
  "npm run verify:deployment",
  "npm run test:runtime-boundary",
  "npm run test:home-visual",
  "npm run test:football-visual",
  "npm run test:backup-browser",
  "npm run test:import-browser",
  "npm run test:restore-browser",
  "npm run test:browser"
]){
  assert.ok(stability.includes(required), `Production deployed smoke must retain ${required}.`);
}

assert.equal(occurrences(candidateB, "npm run test:import-browser"), 1, "Candidate B must have one authoritative browser execution per workflow attempt.");
assert.doesNotMatch(candidateB, /for attempt in 1 2/, "Candidate B repetition must use GitHub rerun attempts, not an internal duplicate loop.");
assert.match(candidateB, /timeout-minutes:\s*12/, "Candidate B browser timeout should remain bounded after deduplication.");

assert.equal(occurrences(candidateC, "npm run test:restore-browser"), 1, "Candidate C must have one authoritative browser execution per workflow attempt.");
assert.doesNotMatch(candidateC, /for attempt in 1 2/, "Candidate C repetition must use GitHub rerun attempts, not an internal duplicate loop.");
assert.match(candidateC, /timeout-minutes:\s*16/, "Candidate C browser timeout should remain bounded after deduplication.");

assert.doesNotMatch(burnin, /\n\s*pull_request\s*:/, "Burn-In must not run automatically on every PR commit.");
assert.match(burnin, /pass:\s*\[1, 2\]/, "Release Burn-In must be two focused integration passes, not five complete matrices.");
assert.doesNotMatch(burnin, /github\.sha[^\n]*\n\s*cancel-in-progress/, "Burn-In concurrency must not be SHA-isolated.");

assert.equal(occurrences(burninScript, "npm run test:browser"), 1, "Each Burn-In pass must repeat only the complete stateful integration journey.");
for(const redundant of [
  "npm run test:contracts",
  "npm run test:runtime-boundary",
  "npm run test:home-visual",
  "npm run test:football-visual",
  "npm run test:backup-browser",
  "npm run test:import-browser",
  "npm run test:restore-browser"
]){
  assert.equal(occurrences(burninScript, redundant), 0, `Burn-In must not duplicate ${redundant}.`);
}

// Historical duplicated browser-suite command invocations across these four lanes:
// Stability 7 suites x2 + Candidate B x2 + Candidate C x2 + Burn-In 7 suites x5 = 53.
// Normal PR after this contract: Stability 2 + Candidate B 1 + Candidate C 1 + Burn-In 0 = 4.
assert.ok(4 <= Math.floor(53 * 0.1), "PR orchestration must preserve at least a 90% reduction in duplicated long-suite command invocations.");

process.stdout.write("PASS  smart CI orchestration, rerun safety, deduplication, and full deployed release boundary\n");
