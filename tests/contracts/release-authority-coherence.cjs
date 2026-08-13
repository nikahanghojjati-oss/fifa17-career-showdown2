const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file){ return fs.readFileSync(file, "utf8"); }

const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const app = read("js/app.js");
const menu = read("js/menuExperience.js");
const shell = read("index.html");
const version = pkg.version;
const revision = `${version}-r1`;
const releasePath = `RELEASE_V${version}.md`;
const handoffPath = `CAREER_MODE_SHOWDOWN_V${version}_MAINTENANCE_HANDOFF.md`;

assert.match(version, /^\d+\.\d+\.\d+$/, "package.json must expose a semantic release version.");
assert.equal(lock.version, version, "package-lock root version must match package.json.");
assert.equal(lock.packages?.[""]?.version, version, "package-lock root package version must match package.json.");
assert.ok(app.includes(`const APP_VERSION = "${version}";`), "APP_VERSION must match package identity.");
assert.ok(app.includes(`css/visual-fidelity-r3.css?v=${revision}`), "Visual-fidelity cache identity must match current runtime revision.");
assert.ok(shell.includes(`name="app-asset-revision" content="${revision}"`), "Shell runtime-revision meta must match package identity.");
assert.ok(shell.includes(`v${version} · Stable`), "Visible footer must show current candidate/release identity.");
assert.ok(menu.includes(`thumbnail: "assets/marco-reus-2015-cc-by.webp?v=${revision}"`), "Home Reus portrait cache identity must match the shell revision.");

const startupRefs = [...shell.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)(?:\?v=([^"#]+))?/g)]
  .map(match => ({ file: match[1], revision: match[2] || "" }));
assert.equal(startupRefs.filter(ref => ref.file.startsWith("js/")).length, 7, "Protected eager shell must remain seven scripts.");
assert.deepEqual(startupRefs.filter(ref => ref.revision !== revision), [], "Every eager JS/CSS runtime reference must use the current revision.");
assert.ok(shell.includes(`assets/marco-reus-2015-cc-by.webp?v=${revision}`), "Protected Reus startup portrait must use the current runtime revision.");

assert.ok(fs.existsSync(releasePath), `${releasePath} must exist for the current release candidate.`);
assert.ok(fs.existsSync(handoffPath), `${handoffPath} must exist for the current release candidate.`);
const release = read(releasePath);
const maintenanceHandoff = read(handoffPath);
const releaseCandidate = /Status:\s*RELEASE CANDIDATE/i.test(release);
assert.ok(release.includes(`Release tag: \`v${version}\``), `${releasePath} has a stale release tag.`);
assert.ok(release.includes(`Runtime asset revision: \`${revision}\``), `${releasePath} has a stale runtime revision.`);
assert.ok(maintenanceHandoff.includes(`v${version}`) && maintenanceHandoff.includes(revision), `${handoffPath} must identify the current candidate and runtime revision.`);

const startHere = read("00_DEVELOPER_START_HERE.md");
const nextTask = read("NEXT_TASK.md");
const readme = read("README.md");
const projectState = read("PROJECT_STATE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const changelog = read("CHANGELOG.md");

for(const [file, text] of [["NEXT_TASK.md", nextTask], ["PROJECT_STATE.md", projectState]]){
  assert.ok(text.includes(`v${version}`), `${file} must identify the current release candidate.`);
  assert.ok(text.includes(revision), `${file} must identify the current runtime revision.`);
}

if(releaseCandidate){
  assert.ok(/v1\.1\.5/.test(readme) && /production-proven|production proven/i.test(readme), "README must keep the last deployed production truth while v1.2 is a PR candidate.");
  assert.ok(changelog.trimStart().startsWith("# v1.1.5 —"), "CHANGELOG must remain on the last promoted production release while v1.2 is a PR candidate.");
  assert.ok(changelog.slice(0, 900).includes("Runtime asset revision: **`1.1.5-r1`**"), "Candidate-stage CHANGELOG must retain the last production runtime revision.");
  assert.ok(startHere.includes("NEXT_TASK.md"), "Developer bootstrap must route candidate work through current NEXT_TASK authority.");
  assert.ok(/v1\.1\.5/.test(startHere), "Developer bootstrap must keep the last production-proven baseline visible during candidate work.");
  assert.ok(roadmap.includes("v1.2.0 — Installable Offline App") || roadmap.includes("v1.2.0 Installable Offline App"), "Roadmap must preserve the current v1.2 milestone during candidate validation.");
}else{
  const promotedDocs = [
    ["00_DEVELOPER_START_HERE.md", startHere],
    ["NEXT_TASK.md", nextTask],
    ["README.md", readme],
    ["PROJECT_STATE.md", projectState],
    ["POST_V1_ROADMAP_EXECUTION.md", roadmap]
  ];
  for(const [file, text] of promotedDocs){
    assert.ok(text.includes(`v${version}`) || text.includes(version), `${file} must acknowledge promoted release ${version}.`);
    assert.ok(text.includes(revision), `${file} must acknowledge promoted runtime revision ${revision}.`);
  }
  assert.ok(changelog.trimStart().startsWith(`# v${version} —`), "CHANGELOG must begin with the promoted release heading.");
  assert.ok(changelog.slice(0, 900).includes(`Runtime asset revision: **\`${revision}\`**`), "Promoted CHANGELOG runtime revision is stale or missing.");
}

for(const [file, text] of [
  ["00_DEVELOPER_START_HERE.md", startHere],
  ["NEXT_TASK.md", nextTask],
  ["PROJECT_STATE.md", projectState],
  ["README.md", readme],
  [handoffPath, maintenanceHandoff]
]){
  assert.ok(/transaction-owned|mutation-owned/i.test(text), `${file} must describe rollback ownership rather than the old affected-key model.`);
  assert.ok(/strict exact raw|strict snapshot|exact raw snapshot/i.test(text), `${file} must preserve exact destructive snapshot authority.`);
  assert.ok(/Installable Offline App/i.test(text), `${file} must preserve the v1.2 Installable Offline App milestone.`);
  assert.ok(!/roll(?:s|ed|ing)? every affected key/i.test(text), `${file} reintroduced the v1.1.4 over-broad rollback model.`);
}

const staleCurrentFacing = [
  "Current application candidate: `v1.1.1`",
  "Current remaining nontechnical exit condition:",
  "Current substantive task — Candidate C",
  "Candidate C must add dedicated restore contracts/browser evidence",
  "Version identity deliberately remains v1.1.4",
  "v1.1.4 / 1.1.4-r1 Candidate C release candidate"
];
for(const [file, text] of [["NEXT_TASK.md", nextTask], ["PROJECT_STATE.md", projectState], ["00_DEVELOPER_START_HERE.md", startHere], ["README.md", readme], ["POST_V1_ROADMAP_EXECUTION.md", roadmap]]){
  for(const stale of staleCurrentFacing){
    assert.ok(!text.includes(stale), `${file} contains stale current-facing phrase: ${stale}`);
  }
}

assert.ok(roadmap.includes("v1.1 Data Safety and Recovery is also functionally complete"), "Roadmap must mark v1.1 recovery as functionally complete.");
assert.ok(!roadmap.includes("Current remaining nontechnical exit condition:"), "Roadmap still exposes the obsolete r5 visual exit condition as current.");
assert.ok(roadmap.includes("old r5 James/Rashford/Martial acceptance condition is historical"), "Roadmap must explicitly supersede the old r5 visual exit condition.");
assert.ok(roadmap.includes("Candidate A/B/C are now complete; it is not the current task list."), "Historical v1.1 roadmap section must be marked as history.");

const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
for(const term of ["accountId", "profileId", "saveId", "deviceId", "installationId", "baseRevision", "tombstone", "compare-and-swap"]){
  assert.ok(cloud.includes(term), `Cloud foundation lost required future contract term: ${term}`);
}
assert.ok(cloud.includes("v1.2.0 Installable Offline App"), "Cloud foundation must keep v1.2 ahead of cloud implementation.");
assert.match(cloud, /future architecture contract only/i, "Cloud foundation must remain explicitly non-runtime at this milestone.");
assert.match(cloud, /No future cloud module may call localStorage directly/i, "Future sync must remain behind canonical storage authority.");
assert.ok(/future|no cloud backend|no cloud runtime|does not add/i.test(readme + projectState + nextTask), "Current authority no longer clearly bounds cloud work as future-only.");

assert.ok(startHere.includes("00_HANDOFF_GOLDEN_RULE.md"), "Developer bootstrap lost the continuous handoff rule.");
assert.ok(startHere.includes("NEXT_TASK.md"), "Developer bootstrap lost NEXT_TASK authority.");
assert.ok(nextTask.includes("14 permanent workflow families"), "NEXT_TASK lost the protected release-family count.");
assert.ok(nextTask.includes("27 protected"), "NEXT_TASK lost the protected workflow-block topology.");

const workflowDir = ".github/workflows";
const temporaryHelpers = fs.readdirSync(workflowDir)
  .filter(name => /v115|temporary/i.test(name))
  .filter(name => /\.ya?ml$/i.test(name));
assert.deepEqual(temporaryHelpers, [], `Temporary v1.1.5 workflow helpers must not enter the frozen candidate: ${temporaryHelpers.join(", ")}`);

const topologyRunner = read("tests/support/run-workflow-blocks.cjs");
assert.ok(topologyRunner.includes('name.endsWith(".yml") && name !== "validate-stability-lane.yml"'), "Authoritative topology runner must keep its permanent-workflow scope explicit.");
assert.ok(topologyRunner.includes('assert.equal(executed, 27'), "Authoritative topology runner must retain the protected 27-block invariant.");

process.stdout.write(`PASS  release authority coherence for v${version} / ${revision}; candidate-vs-production publication truth, runtime identity, Home Reus cache, rollback semantics, roadmap, cloud boundary and authoritative 27-block topology guard agree\n`);