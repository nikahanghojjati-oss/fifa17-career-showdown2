const assert = require("node:assert/strict");
const fs = require("node:fs");

function read(path){ return fs.readFileSync(path, "utf8"); }
function occurrences(text, needle){ return text.split(needle).length - 1; }
function timeoutForJob(text, jobName){
  const match = text.match(new RegExp(`\\n  ${jobName}:[\\s\\S]*?timeout-minutes:\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

const guards = JSON.parse(read("CURRENT_PRODUCT_GUARDS.json"));
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
function assertMarkdownOnlySkip(text, label){
  assert.match(text, /paths-ignore:\s*\n\s*-\s*["']\*\*\/\*\.md["']/, `${label} must ignore Markdown-only changes so documentation sealing cannot launch a heavy browser proof.`);
}
function assertArtifactFollowsSuccessfulBrowser(text, label){
  assert.match(text, /if:\s*success\(\)/, `${label} evidence upload must run only after a successful browser proof.`);
  assert.doesNotMatch(text, /if:\s*always\(\)/, `${label} must not create a competing artifact failure after cancellation or browser failure.`);
  assert.match(text, /if-no-files-found:\s*error/, `${label} successful browser proof must still require its evidence artifact.`);
}

assertRerunSafeConcurrency(stability, "Stability");
assertRerunSafeConcurrency(candidateB, "Candidate B");
assertRerunSafeConcurrency(candidateC, "Candidate C");
assertRerunSafeConcurrency(burnin, "Burn-In");
assertMarkdownOnlySkip(stability, "Stability");
assertMarkdownOnlySkip(candidateB, "Candidate B");
assertMarkdownOnlySkip(candidateC, "Candidate C");
assertMarkdownOnlySkip(burnin, "Burn-In");
assertArtifactFollowsSuccessfulBrowser(candidateB, "Candidate B");
assertArtifactFollowsSuccessfulBrowser(candidateC, "Candidate C");

const localStability = stability.split(/\n\s{2}deployed-site-smoke:/)[0];
assert.equal(occurrences(localStability, "npm run test:runtime-boundary"), 1, "Local Stability must run runtime provenance exactly once.");
assert.equal(occurrences(localStability, "npm run test:browser"), 1, "Local Stability must run the complete integration journey exactly once.");
for(const redundant of ["test:home-visual", "test:football-visual", "test:backup-browser", "test:import-browser", "test:restore-browser"]){
  assert.equal(occurrences(localStability, `npm run ${redundant}`), 0, `Local Stability must not duplicate specialized ${redundant} ownership.`);
}
assert.doesNotMatch(localStability, /for attempt in 1 2/, "Local Stability must not hide a second full matrix inside one job.");
const chromiumTimeout = timeoutForJob(stability, "chromium-stability");
assert.ok(Number.isInteger(chromiumTimeout) && chromiumTimeout >= 8 && chromiumTimeout <= 30, "Canonical Chromium Stability must keep a practical bounded timeout without pinning one historical value.");

assert.equal(guards.provider.cloudRunAllowed, false);
assert.equal(guards.provider.cloudFunctionsAllowed, false);
assert.doesNotMatch(localStability, /trusted-runtime\/Dockerfile|career-mode-showdown-trusted-runtime|firebaseAdminProvider|docker build|docker run/, "Normal Stability must not build or smoke the archived trusted Cloud Run runtime while current authority forbids Cloud Run.");

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
const candidateBTimeout = timeoutForJob(candidateB, "import-browser");
assert.ok(Number.isInteger(candidateBTimeout) && candidateBTimeout > 0 && candidateBTimeout <= 20, "Candidate B browser proof must stay time-bounded without pinning one historical timeout.");

assert.equal(occurrences(candidateC, "npm run test:restore-browser"), 1, "Candidate C must have one authoritative browser execution per workflow attempt.");
assert.doesNotMatch(candidateC, /for attempt in 1 2/, "Candidate C repetition must use GitHub rerun attempts, not an internal duplicate loop.");
const candidateCTimeout = timeoutForJob(candidateC, "restore-browser");
assert.ok(Number.isInteger(candidateCTimeout) && candidateCTimeout > 0 && candidateCTimeout <= 24, "Candidate C browser proof must stay time-bounded without pinning one historical timeout.");

assert.doesNotMatch(burnin, /\n\s*pull_request\s*:/, "Burn-In must not run automatically on every PR commit.");
assert.match(burnin, /pass:\s*\[1, 2\]/, "Release Burn-In remains two focused integration passes rather than repeated complete matrices.");
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

process.stdout.write("PASS POS-2 CI orchestration: current product ownership is single-run and bounded, stale work is cancelled safely, specialist evidence remains authoritative, deployed release proof stays complete, and dormant Cloud Run compute is excluded.\n");
