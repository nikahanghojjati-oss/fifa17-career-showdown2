const A = require("node:assert/strict");
const fs = require("node:fs");
const read = file => fs.readFileSync(file, "utf8");

const pkg = JSON.parse(read("package.json"));
const app = read("js/app.js");
const shell = read("index.html");
const version = pkg.version;
const revision = (shell.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const generation = Number((revision.match(/-r(\d+)$/) || [])[1]);

A.ok(app.includes(`const APP_VERSION = "${version}";`), "APP_VERSION must match package identity.");
A.match(revision, new RegExp(`^${version.replace(/\./g, "\\.")}-r[1-9]\\d*$`), "Runtime revision must belong to the current application version.");

const releasePath = generation === 1 ? `RELEASE_V${version}.md` : `RELEASE_V${version}_R${generation}.md`;
const handoffPath = generation === 1
    ? `CAREER_MODE_SHOWDOWN_V${version}_MAINTENANCE_HANDOFF.md`
    : `CAREER_MODE_SHOWDOWN_V${version}_R${generation}_MAINTENANCE_HANDOFF.md`;
A.ok(fs.existsSync(releasePath), `${releasePath} must exist for the active runtime.`);
A.ok(fs.existsSync(handoffPath), `${handoffPath} must exist for the active runtime.`);

const release = read(releasePath);
const handoff = read(handoffPath);
const start = read("00_DEVELOPER_START_HERE.md");
const next = read("NEXT_TASK.md");
const readme = read("README.md");
const state = read("PROJECT_STATE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const changelog = read("CHANGELOG.md");
const candidate = /Status:\s*RELEASE CANDIDATE/i.test(release);
const previousRuntime = (release.match(/Previous known-good runtime:\s*`([^`]+)`/i) || [])[1];

A.ok(release.includes(`Runtime asset revision: \`${revision}\``), `${releasePath} has stale runtime identity.`);
A.ok(handoff.includes(revision), `${handoffPath} has stale runtime identity.`);
for(const [file, text] of [["NEXT_TASK.md", next], ["PROJECT_STATE.md", state]]){
    A.ok(text.includes(`v${version}`), `${file} must identify the current application version.`);
    A.ok(text.includes(revision), `${file} must identify the active runtime revision.`);
}

if(candidate){
    A.ok(previousRuntime, "A release candidate must name its previous known-good whole-runtime shell.");
    A.ok(readme.includes(previousRuntime) && /production-proven|production proven/i.test(readme), "Candidate README must retain previous production truth.");
    A.ok(changelog.includes(previousRuntime), "Candidate CHANGELOG must retain previous production runtime truth.");
}else{
    for(const [file, text] of [
        ["README.md", readme],
        ["PROJECT_STATE.md", state],
        ["NEXT_TASK.md", next],
        ["00_DEVELOPER_START_HERE.md", start],
        ["POST_V1_ROADMAP_EXECUTION.md", roadmap]
    ]){
        A.ok(text.includes(revision), `${file} must acknowledge promoted runtime ${revision}.`);
    }
    const changelogHead = changelog.slice(0, 1800);
    A.match(changelogHead, new RegExp(`##\\s+v${version.replace(/\./g, "\\.")}`), "CHANGELOG must identify the current promoted application near the top.");
    A.ok(changelogHead.includes(revision), "CHANGELOG must identify the current promoted runtime near the top.");
    if(generation > 1){
        A.match(changelogHead, new RegExp(`##\\s+v${version.replace(/\./g, "\\.")}\\s+runtime hotfix r${generation}\\s+—\\s+production`, "i"), "Runtime hotfix changelog heading must identify its generation and production status.");
        A.ok(previousRuntime && changelogHead.includes(previousRuntime), "Runtime hotfix changelog must preserve its immediate previous whole-shell recovery target.");
    }
}

for(const [file, text] of [
    ["00_DEVELOPER_START_HERE.md", start],
    ["NEXT_TASK.md", next],
    ["PROJECT_STATE.md", state],
    ["README.md", readme],
    [handoffPath, handoff]
]){
    A.ok(/transaction-owned|mutation-owned/i.test(text), `${file} must preserve rollback ownership semantics.`);
    A.ok(/strict exact raw|strict snapshot|exact raw snapshot/i.test(text), `${file} must preserve exact destructive snapshot authority.`);
    A.ok(/Installable Offline App|installed-app/i.test(text), `${file} must preserve the shipped installable/offline baseline.`);
    A.ok(!/roll(?:s|ed|ing)? every affected key/i.test(text), `${file} reintroduced the obsolete over-broad rollback model.`);
}

for(const [file, text] of [
    ["00_DEVELOPER_START_HERE.md", start],
    ["NEXT_TASK.md", next],
    ["PROJECT_STATE.md", state],
    ["README.md", readme],
    ["POST_V1_ROADMAP_EXECUTION.md", roadmap]
]){
    A.match(text, /v1\.3\.0\s+—?\s*Recovery & Device Resilience Hardening/i, `${file} must preserve the current v1.3 resilience milestone.`);
}

for(const stale of [
    "Current remaining nontechnical exit condition:",
    "Current substantive task — Candidate C",
    "Version identity deliberately remains v1.1.4"
]){
    for(const [file, text] of [["NEXT_TASK.md", next], ["PROJECT_STATE.md", state], ["README.md", readme], ["POST_V1_ROADMAP_EXECUTION.md", roadmap]]){
        A.ok(!text.includes(stale), `${file} contains stale current-facing authority: ${stale}`);
    }
}

A.match(roadmap, /v1\.1 Data Safety and Recovery is complete/i, "Roadmap must keep Data Safety and Recovery closed.");
A.match(roadmap, /Candidate A\/B\/C are protected systems, not the current feature task/i, "Roadmap must keep Candidate A/B/C protected without reopening them as the current feature milestone.");
A.match(roadmap, /Current milestone — v1\.3\.0 Recovery & Device Resilience Hardening/i, "Roadmap must preserve the v1.3 resilience milestone.");
A.match(roadmap, /Local Profiles and Save Library — completed dependency milestone, feature version unassigned/i, "Roadmap must record shipped Local Profiles/Save Library without inventing a release version.");
const resilienceIndex = roadmap.indexOf("Current milestone — v1.3.0 Recovery & Device Resilience Hardening");
const profilesIndex = roadmap.indexOf("Local Profiles and Save Library — completed dependency milestone, feature version unassigned");
const cloudIndex = roadmap.indexOf("Cloud Readiness");
const backupIndex = roadmap.indexOf("Cloud Backup");
A.ok(resilienceIndex >= 0 && profilesIndex > resilienceIndex && cloudIndex > profilesIndex && backupIndex > cloudIndex, "Roadmap must preserve resilience → completed local identity/save library → Cloud Readiness → Cloud Backup dependency order.");

for(const [file, text] of [
    ["00_DEVELOPER_START_HERE.md", start],
    ["NEXT_TASK.md", next],
    ["PROJECT_STATE.md", state],
    ["README.md", readme],
    ["POST_V1_ROADMAP_EXECUTION.md", roadmap]
]){
    A.match(text, /Local Profiles[\s\S]{0,80}Save Library|Save Library[\s\S]{0,80}Local Profiles/i, `${file} must acknowledge the shipped Local Profiles / Save Library dependency chain.`);
}
A.ok(readme.includes("careerModeShowdown.saveLibrary"), "README must describe post-cutover Save Library canonical authority.");
A.ok(/multiple local Showdown Saves|multi-save/i.test(readme), "README must describe the shipped multi-save product model.");
A.ok(!/one local browser\/device and one active Showdown/i.test(readme), "README must not revive the retired singleton-only product description.");

const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
for(const term of ["accountId", "profileId", "saveId", "deviceId", "installationId", "baseRevision", "tombstone", "compare-and-swap"]){
    A.ok(cloud.includes(term), `Cloud foundation lost future contract term: ${term}`);
}
A.match(cloud, /future architecture contract only/i, "Cloud foundation must remain non-runtime architecture at this milestone.");
A.match(cloud, /No future cloud module may call localStorage directly/i, "Future sync must remain behind canonical storage authority.");
A.match(cloud, /v1\.3\.0 Recovery & Device Resilience Hardening[\s\S]+Local Profiles\/Save Library[\s\S]+Cloud Readiness[\s\S]+opt-in Cloud Backup/i, "Cloud foundation must preserve semantic dependency order after v1.3 resequencing.");

A.ok(start.includes("00_HANDOFF_GOLDEN_RULE.md") && start.includes("NEXT_TASK.md"), "Developer bootstrap lost current handoff/task authority.");
A.ok(next.includes("14 permanent workflow families") && next.includes("27 protected"), "NEXT_TASK lost permanent validation topology counts.");
const temporaryHelpers = fs.readdirSync(".github/workflows").filter(name => /v115|temporary/i.test(name) && /\.ya?ml$/i.test(name));
A.deepEqual(temporaryHelpers, [], `Temporary workflow helpers must not enter release authority: ${temporaryHelpers.join(", ")}`);
const topology = read("tests/support/run-workflow-blocks.cjs");
A.ok(topology.includes('name.endsWith(".yml") && name !== "validate-stability-lane.yml"'), "Authoritative workflow topology scope changed unexpectedly.");
A.ok(topology.includes('assert.equal(executed, 27'), "Protected 27-block workflow invariant changed unexpectedly.");

process.stdout.write(`PASS release authority coherence for v${version}/${revision}; publication truth, recovery ownership, shipped Save Library boundary, cloud boundary and workflow topology agree.\n`);
