const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(file){ return fs.readFileSync(file, "utf8"); }

const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const app = read("js/app.js");
const shell = read("index.html");
const version = pkg.version;
const revision = `${version}-r1`;

assert.match(version, /^\d+\.\d+\.\d+$/, "package.json must expose a semantic release version.");
assert.equal(lock.version, version, "package-lock root version must match package.json.");
assert.equal(lock.packages?.[""]?.version, version, "package-lock root package version must match package.json.");
assert.ok(app.includes(`const APP_VERSION = "${version}";`), "APP_VERSION must match package identity.");
assert.ok(app.includes(`css/visual-fidelity-r3.css?v=${revision}`), "Visual-fidelity cache identity must match current runtime revision.");
assert.ok(shell.includes(`name="app-asset-revision" content="${revision}"`), "Shell runtime-revision meta must match package identity.");
assert.ok(shell.includes(`v${version} · Stable`), "Visible footer must show current release identity.");

const startupRefs = [...shell.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)(?:\?v=([^"#]+))?/g)]
  .map(match => ({ file: match[1], revision: match[2] || "" }));
assert.equal(startupRefs.filter(ref => ref.file.startsWith("js/")).length, 7, "Protected eager shell must remain seven scripts.");
assert.deepEqual(startupRefs.filter(ref => ref.revision !== revision), [], "Every eager JS/CSS runtime reference must use the current revision.");
assert.ok(shell.includes(`assets/reus-homescreen-v2.webp?v=${revision}`), "Protected Reus startup portrait must use the current runtime revision.");

const currentAuthority = [
  "00_DEVELOPER_START_HERE.md",
  "NEXT_TASK.md",
  "README.md",
  "PROJECT_STATE.md",
  `RELEASE_V${version}.md`,
  "POST_V1_ROADMAP_EXECUTION.md",
  `CAREER_MODE_SHOWDOWN_V${version}_MAINTENANCE_HANDOFF.md`
];
for(const file of currentAuthority){
  assert.ok(fs.existsSync(file), `${file} must exist for the current release.`);
  const text = read(file);
  assert.ok(text.includes(`v${version}`) || text.includes(version), `${file} must acknowledge the current release version ${version}.`);
  assert.ok(text.includes("v1.2.0") || file === `RELEASE_V${version}.md`, `${file} must preserve or defer to the v1.2 dependency boundary.`);
}

const startHere = read("00_DEVELOPER_START_HERE.md");
const nextTask = read("NEXT_TASK.md");
assert.ok(startHere.includes(`Release candidate application: \`v${version}\``) || startHere.includes(`Application version: \`v${version}\``), "Developer bootstrap must begin from the current release identity.");
assert.ok(nextTask.includes(`Release-candidate application: \`v${version}\``) || nextTask.includes(`Application version: v${version}`), "NEXT_TASK must begin from the current release identity.");
assert.ok(!startHere.includes("Current substantive task — Candidate C"), "Bootstrap must not tell a new developer to reimplement completed Candidate C.");
assert.ok(!nextTask.includes("Current baseline: v1.1.4 Stable / Candidate C Complete"), "NEXT_TASK must not regress to the superseded pre-maintenance baseline.");

const changelog = read("CHANGELOG.md");
assert.ok(changelog.trimStart().startsWith(`## v${version} —`), "CHANGELOG must begin with the current release entry.");

const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
assert.ok(cloud.includes("v1.2.0 Installable Offline App"), "Cloud foundation must keep v1.2 ahead of cloud implementation.");
assert.match(cloud, /future architecture contract only/i, "Cloud foundation must remain explicitly non-runtime at this milestone.");
assert.match(cloud, /No future cloud module may call localStorage directly/i, "Future sync must remain behind canonical storage authority.");

const workflowDir = ".github/workflows";
const temporaryHelpers = fs.readdirSync(workflowDir)
  .filter(name => /v115|temporary/i.test(name))
  .filter(name => /\.ya?ml$/i.test(name));
assert.deepEqual(temporaryHelpers, [], `Temporary v1.1.5 workflow helpers must not enter the frozen candidate: ${temporaryHelpers.join(", ")}`);

const permanentYml = fs.readdirSync(workflowDir).filter(name => name.endsWith(".yml"));
let blocks = 0;
for(const name of permanentYml){
  const text = read(path.join(workflowDir, name));
  blocks += (text.match(/node\s+-\s+<<'NODE'/g) || []).length;
}
assert.equal(blocks, 27, "Permanent workflow executable-block topology must remain exactly 27 unless intentionally migrated with its guard.");

process.stdout.write(`PASS  release authority coherence for v${version} / ${revision}; current docs, lockfile, shell, roadmap and helper-free CI agree\n`);
