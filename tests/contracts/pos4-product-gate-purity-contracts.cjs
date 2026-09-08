const assert = require("node:assert/strict");
const fs = require("node:fs");

const manifest = JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json", "utf8"));
const forbidden = [
  "NEXT_TASK.md",
  "00_CURRENT_HANDOFF.md",
  "WORK_ENVIRONMENT_STATUS.json",
  "WORK_ENVIRONMENT_ARCHIVE",
  "START_NEXT_SESSION",
  "SUCCESSOR_HANDOFF",
  "REMOTE_JOINING_READINESS.json"
];

function executableLikeSource(source) {
  return String(source)
    .split(/\r?\n/)
    .filter(line => !/^\s*(?:\/\/|\/\*|\*|\*\/)/.test(line))
    .join("\n");
}

function dependencyPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:readFileSync|readJson|read|require)\\s*\\([\\s\\S]{0,180}?["'](?:[^"']*/)?${escaped}["']`, "m");
}

const offenders = [];
for (const file of manifest.tests) {
  const source = executableLikeSource(fs.readFileSync(file, "utf8"));
  for (const name of forbidden) {
    if (dependencyPattern(name).test(source)) offenders.push(`${file} -> ${name}`);
  }
}

assert.deepEqual(
  offenders,
  [],
  `GP-1 current product gates must not import process/completed-readiness authority:\n${offenders.join("\n")}`
);

const commentOnly = `// read(\"NEXT_TASK.md\") is forbidden in a blocking product gate\nconst live = read(\"CURRENT_PRODUCT_GUARDS.json\");`;
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableLikeSource(commentOnly)), false, "GP-1 must not treat explanatory comments as executable dependencies.");
const realDependency = `const next = read(\"NEXT_TASK.md\");`;
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableLikeSource(realDependency)), true, "GP-1 must detect a real process-authority dependency.");

console.log(`PASS GP-1 product-gate purity (${manifest.tests.length} blocking tests scanned for actual process-authority imports; explanatory comments ignored).`);
