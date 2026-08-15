const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const read = file => fs.readFileSync(file, "utf8");
const requiredFiles = [
  "AGENTS.md",
  "00_WORK_ENVIRONMENT_CONTINUITY.md",
  "WORK_ENVIRONMENT_STATUS.json",
  "WORK_ENVIRONMENT_HISTORY.md",
  "scripts/work-environment-continuity.mjs"
];

for(const file of requiredFiles){
  assert.ok(fs.existsSync(file), `Continuity system is missing ${file}.`);
}

const status = JSON.parse(read("WORK_ENVIRONMENT_STATUS.json"));
const agents = read("AGENTS.md");
const protocol = read("00_WORK_ENVIRONMENT_CONTINUITY.md");
const history = read("WORK_ENVIRONMENT_HISTORY.md");
const golden = read("00_HANDOFF_GOLDEN_RULE.md");
const start = read("00_DEVELOPER_START_HERE.md");
const current = read("00_CURRENT_HANDOFF.md");
const project = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const readme = read("README.md");
const pkg = JSON.parse(read("package.json"));

assert.equal(pkg.scripts["work:assess"], "node scripts/work-environment-continuity.mjs assess");
assert.equal(pkg.scripts["work:handoff"], "node scripts/work-environment-continuity.mjs handoff");
assert.equal(pkg.scripts["work:continuity:validate"], "node scripts/work-environment-continuity.mjs validate");

assert.match(agents, /Mandatory Work Environment Continuity loop/i);
assert.match(agents, /npm run work:continuity:validate[\s\S]+npm run work:assess/i);
const inheritedValidationIndex = agents.indexOf("Validate the inherited status record");
const successorInitializationIndex = agents.indexOf("append its final facts to `WORK_ENVIRONMENT_HISTORY.md`");
const successorAssessmentIndex = agents.indexOf("Only after the current environment owns `WORK_ENVIRONMENT_STATUS.json`");
assert.ok(inheritedValidationIndex >= 0, "AGENTS.md must validate the inherited record explicitly.");
assert.ok(successorInitializationIndex > inheritedValidationIndex, "AGENTS.md must archive and replace the inherited record after validation.");
assert.ok(successorAssessmentIndex > successorInitializationIndex, "AGENTS.md must assess only after the successor owns its fresh status record.");
assert.match(agents, /Never treat the predecessor's transition decision as the successor's starting decision/i);
assert.match(agents, /Never guess an exact hidden context-token or account-usage value/i);
assert.match(agents, /HANDOFF_AT_CHECKPOINT[\s\S]+run `npm run work:handoff`/i);
assert.match(agents, /development infrastructure[\s\S]+Do not add it to the Career Mode Showdown website runtime/i);

assert.match(protocol, /Unknown usage is omitted from the weighted mean rather than estimated/i);
assert.match(protocol, /Transition cost models the understanding lost when moving to a fresh environment/i);
assert.match(protocol, /FINISH_SAFE_BOUNDARY[\s\S]+minimum operation needed for coherence/i);
assert.match(protocol, /Change them only in a separately reviewed repository update with scenario tests/i);
assert.match(history, /append-only record/i);
assert.match(history, /we-2026-08-15-continuity-bootstrap[\s\S]+HANDOFF_AT_CHECKPOINT/i);

for(const [name, text] of [
  ["00_HANDOFF_GOLDEN_RULE.md", golden],
  ["00_DEVELOPER_START_HERE.md", start],
  ["00_CURRENT_HANDOFF.md", current],
  ["PROJECT_STATE.md", project],
  ["NEXT_TASK.md", next],
  ["README.md", readme]
]){
  assert.match(text, /Work Environment Continuity/i, `${name} must route future environments into the continuity system.`);
}

const cleanRepository = {
  branch: "agent/continuity-contract",
  head: "a".repeat(40),
  originMain: "b".repeat(40),
  behindOriginMain: 0,
  aheadOfOriginMain: 1,
  dirty: false,
  changedFiles: [],
  missingContinuityFiles: []
};

(async () => {
  const moduleUrl = pathToFileURL(path.resolve("scripts/work-environment-continuity.mjs")).href;
  const {
    assessState,
    buildHandoffPrompt,
    decisions,
    parseGitStatusPaths,
    requiredContinuityFiles,
    validateState,
    withOverrides
  } = await import(moduleUrl);

  assert.doesNotThrow(() => validateState(structuredClone(status)));
  assert.deepEqual(requiredContinuityFiles.filter(file => !fs.existsSync(file)), []);
  assert.deepEqual(
    parseGitStatusPaths(" M 00_CURRENT_HANDOFF.md\n?? AGENTS.md\n"),
    ["00_CURRENT_HANDOFF.md", "AGENTS.md"],
    "Git porcelain parsing must preserve the first filename character and both status columns."
  );

  const quiet = structuredClone(status);
  quiet.lifecycle = "active";
  Object.assign(quiet.signals, {
    contextComplexity: "low",
    projectComplexity: "low",
    compactionCount: 0,
    majorPhasesCompleted: 0,
    largeEvidenceEvents: 0,
    toolRoutingErrors: 0,
    correctedFailures: 0,
    repeatedMistakes: 0,
    staleFactCorrections: 0,
    unresolvedFailures: 0,
    newMilestoneNext: false,
    usageRemainingPercent: null,
    usageSource: "unavailable",
    usageWarning: false,
    handoffCompleteness: 100,
    unrecordedDecisions: 0,
    atomicOperation: false
  });

  const quietAssessment = assessState(quiet, cleanRepository);
  assert.equal(quietAssessment.decision, decisions.CONTINUE, "A low-risk coherent environment should continue.");
  assert.equal(quietAssessment.scores.quotaRisk, null, "Unknown usage must stay unknown instead of being estimated.");

  const dense = structuredClone(quiet);
  dense.lifecycle = "transition-prepared";
  Object.assign(dense.signals, {
    contextComplexity: "very-high",
    projectComplexity: "very-high",
    compactionCount: 1,
    majorPhasesCompleted: 5,
    largeEvidenceEvents: 11,
    toolRoutingErrors: 2,
    correctedFailures: 3,
    repeatedMistakes: 0,
    staleFactCorrections: 0,
    unresolvedFailures: 0,
    newMilestoneNext: true,
    usageRemainingPercent: null,
    usageSource: "unavailable",
    usageWarning: false,
    handoffCompleteness: 99,
    unrecordedDecisions: 0,
    atomicOperation: false
  });

  const denseAssessment = assessState(dense, cleanRepository);
  assert.equal(denseAssessment.decision, decisions.HANDOFF_AT_CHECKPOINT, "A dense environment with a strong handoff and separate next milestone should transition at its checkpoint.");
  assert.ok(denseAssessment.scores.transitionAdvantage >= 25);

  const lowUsage = withOverrides(quiet, { usageRemainingPercent: 8, usageSource: "cli-status" });
  assert.equal(assessState(lowUsage, cleanRepository).decision, decisions.HANDOFF_NOW, "Reported usage at or below ten percent must trigger immediate coherent handoff.");

  const explicitWarning = withOverrides(quiet, { usageWarning: true });
  assert.equal(assessState(explicitWarning, cleanRepository).decision, decisions.HANDOFF_NOW, "An explicit usage warning must trigger immediate coherent handoff even without a percentage.");

  const atomic = structuredClone(dense);
  atomic.signals.atomicOperation = true;
  assert.equal(assessState(atomic, { ...cleanRepository, dirty: true }).decision, decisions.FINISH_SAFE_BOUNDARY, "An atomic operation must be made coherent before transition.");

  const incompleteRepository = { ...cleanRepository, missingContinuityFiles: ["AGENTS.md"] };
  assert.equal(
    assessState(dense, incompleteRepository).scores.handoffReadiness,
    denseAssessment.scores.handoffReadiness - 25,
    "Missing continuity authority must increase transition cost by lowering handoff readiness."
  );

  const invalidUsage = structuredClone(quiet);
  invalidUsage.signals.usageSource = "cli-status";
  assert.throws(() => validateState(invalidUsage), /Unknown usage must use usageSource unavailable/);

  const prompt = buildHandoffPrompt(dense, denseAssessment);
  assert.match(prompt, /Treat this handoff as orientation, never as implementation authority/i);
  assert.match(prompt, /fetch live main, recent commits, tags, releases, open pull requests and active branches/i);
  assert.match(prompt, /npm run work:continuity:validate[\s\S]+npm run work:assess/i);
  const promptValidationIndex = prompt.indexOf("Run npm run work:continuity:validate against the inherited status record");
  const promptInitializationIndex = prompt.indexOf("archive its final facts, replace it with a new unique environment ID");
  const promptAssessmentIndex = prompt.indexOf("Only after the current environment owns WORK_ENVIRONMENT_STATUS.json, run npm run work:assess");
  assert.ok(promptValidationIndex >= 0, "Generated handoffs must validate the inherited record explicitly.");
  assert.ok(promptInitializationIndex > promptValidationIndex, "Generated handoffs must archive and replace the inherited record after validation.");
  assert.ok(promptAssessmentIndex > promptInitializationIndex, "Generated handoffs must assess only after successor initialization.");
  assert.match(prompt, /Never treat the predecessor's transition decision as the successor's starting decision/i);
  assert.match(prompt, /IMMEDIATE NEXT TASK AFTER FULL STUDY/i);
  assert.match(prompt, /Do not invent an exact usage percentage/i);
  assert.match(prompt, /Maintain the same continuity system recursively/i);

  process.stdout.write("PASS Work Environment Continuity contracts: source-first bootstrap, honest usage handling, deterministic transition thresholds, atomic safety and recursive handoff generation are protected.\n");
})().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
