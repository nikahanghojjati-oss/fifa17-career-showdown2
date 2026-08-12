const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const app = read("js/app.js");
const html = read("index.html");
const version = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/<meta\s+name="app-asset-revision"\s+content="([^"]+)"/i) || [])[1];

assert.ok(version, "Current documentation contract could not derive APP_VERSION.");
assert.ok(revision, "Current documentation contract could not derive runtime revision.");
assert.equal(revision, `${version}-r1`, "Current release revision is not coherent with APP_VERSION.");

const currentDocs = [
  "00_DEVELOPER_START_HERE.md",
  "README.md",
  "PROJECT_STATE.md",
  "NEXT_TASK.md",
  "POST_V1_ROADMAP_EXECUTION.md"
];

for (const file of currentDocs) {
  const text = read(file);
  assert.ok(text.includes(`v${version}`), `${file} does not name current application version v${version}.`);
  assert.ok(text.includes(revision), `${file} does not name current runtime revision ${revision}.`);
}

const releasePath = `RELEASE_V${version}.md`;
assert.ok(fs.existsSync(path.join(root, releasePath)), `Missing current release record ${releasePath}.`);
const release = read(releasePath);
assert.ok(release.includes(`Release tag: \`v${version}\``), `${releasePath} has a stale release tag.`);
assert.ok(release.includes(`Runtime asset revision: \`${revision}\``), `${releasePath} has a stale runtime revision.`);

const changelog = read("CHANGELOG.md");
assert.ok(changelog.startsWith(`# v${version} —`), "CHANGELOG must begin with the current release heading.");
assert.ok(changelog.slice(0, 800).includes(`Runtime asset revision: **\`${revision}\`**`), "CHANGELOG current release revision is stale or missing.");

const bootstrap = read("00_DEVELOPER_START_HERE.md");
const nextTask = read("NEXT_TASK.md");
const projectState = read("PROJECT_STATE.md");
const readme = read("README.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");

for (const [file, text] of [
  ["00_DEVELOPER_START_HERE.md", bootstrap],
  ["NEXT_TASK.md", nextTask],
  ["PROJECT_STATE.md", projectState],
  ["README.md", readme]
]) {
  assert.ok(/transaction-owned|mutation-owned/i.test(text), `${file} must describe v1.1.5 rollback ownership rather than the old affected-key model.`);
  assert.ok(/strict exact raw|strict snapshot|exact raw snapshot/i.test(text), `${file} must preserve exact destructive snapshot authority.`);
  assert.ok(/v1\.2\.0[^\n]*Installable Offline App|Installable Offline App/i.test(text), `${file} must identify the next substantive milestone.`);
}

const staleCurrentFacing = [
  "Current application candidate: `v1.1.1`",
  "Current remaining nontechnical exit condition:",
  "Current substantive task — Candidate C",
  "Candidate C must add dedicated restore contracts/browser evidence",
  "Version identity deliberately remains v1.1.4",
  "v1.1.4 / 1.1.4-r1 Candidate C release candidate"
];
for (const [file, text] of currentDocs.map(file => [file, read(file)])) {
  for (const stale of staleCurrentFacing) {
    assert.ok(!text.includes(stale), `${file} contains stale current-facing phrase: ${stale}`);
  }
}

for (const [file, text] of [
  ["00_DEVELOPER_START_HERE.md", bootstrap],
  ["NEXT_TASK.md", nextTask],
  ["PROJECT_STATE.md", projectState],
  ["README.md", readme]
]) {
  assert.ok(!/roll(?:s|ed|ing)? every affected key/i.test(text), `${file} reintroduced the v1.1.4 over-broad rollback model.`);
}

assert.ok(roadmap.includes("v1.1 Data Safety and Recovery is also functionally complete"), "Roadmap does not mark v1.1 recovery as complete.");
assert.ok(!roadmap.includes("Current remaining nontechnical exit condition:"), "Roadmap still exposes the obsolete r5 visual exit condition as current.");
assert.ok(roadmap.includes("old r5 James/Rashford/Martial acceptance condition is historical"), "Roadmap must explicitly supersede the old r5 visual exit condition.");

const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
for (const term of ["accountId", "profileId", "saveId", "deviceId", "installationId", "baseRevision", "tombstone", "compare-and-swap"]) {
  assert.ok(cloud.includes(term), `Cloud foundation lost required future contract term: ${term}`);
}
assert.ok(/future|not (?:a )?runtime|does not add|no cloud backend/i.test(readme + projectState + nextTask), "Current authority no longer clearly bounds cloud work as future-only.");

assert.ok(bootstrap.includes("00_HANDOFF_GOLDEN_RULE.md"), "Developer bootstrap lost the continuous handoff rule.");
assert.ok(bootstrap.includes("NEXT_TASK.md"), "Developer bootstrap lost NEXT_TASK authority.");
assert.ok(nextTask.includes("14 permanent workflow families"), "NEXT_TASK lost the protected release-family count.");
assert.ok(nextTask.includes("27 protected"), "NEXT_TASK lost the protected workflow-block topology.");

process.stdout.write(`PASS  current documentation coherence (${version} / ${revision})\n`);
