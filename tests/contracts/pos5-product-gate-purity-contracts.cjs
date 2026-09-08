const assert = require("node:assert/strict");
const fs = require("node:fs");
const manifest = JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json", "utf8"));
const forbidden = ["NEXT_TASK.md", "00_CURRENT_HANDOFF.md", "WORK_ENVIRONMENT_STATUS.json", "WORK_ENVIRONMENT_ARCHIVE", "START_NEXT_SESSION", "SUCCESSOR_HANDOFF", "REMOTE_JOINING_READINESS.json", "PROJECT_OPERATING_SYSTEM_V5.md"];
function executableLikeSource(source) {
  return String(source).split(/\r?\n/).filter(line => !/^\s*(?:\/\/|\/\*|\*|\*\/)/.test(line)).join("\n");
}
function dependencyPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:readFileSync|readJson|read|require)\\s*\\([\\s\\S]{0,180}?["'](?:[^"']*/)?${escaped}["']`, "m");
}
const offenders = [];
for (const file of manifest.tests) {
  const source = executableLikeSource(fs.readFileSync(file, "utf8"));
  for (const name of forbidden) if (dependencyPattern(name).test(source)) offenders.push(`${file} -> ${name}`);
}
assert.deepEqual(offenders, [], `GP-2 active product gates must not import process/history authority:\n${offenders.join("\n")}`);
const commentOnly = `// read("NEXT_TASK.md") documents a forbidden dependency\nconst live = read("CURRENT_PRODUCT_GUARDS.json");`;
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableLikeSource(commentOnly)), false);
assert.equal(dependencyPattern("NEXT_TASK.md").test(executableLikeSource(`const next = read("NEXT_TASK.md");`)), true);
console.log(`PASS GP-2 product-gate purity (${manifest.tests.length} blocking tests scanned for executable process/history imports).`);
