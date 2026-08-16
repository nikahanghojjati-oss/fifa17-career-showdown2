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
const proofPath = generation === 1
    ? `V${version}_PRODUCTION_PROOF.md`
    : `V${version}_R${generation}_PRODUCTION_PROOF.md`;
A.ok(fs.existsSync(releasePath), `${releasePath} must exist for the active runtime.`);
A.ok(fs.existsSync(handoffPath), `${handoffPath} must exist for the active runtime.`);

const release = read(releasePath);
const handoff = read(handoffPath);
const proof = fs.existsSync(proofPath) ? read(proofPath) : "";
const start = read("00_DEVELOPER_START_HERE.md");
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const analyticsHandoff = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");
const next = read("NEXT_TASK.md");
const readme = read("README.md");
const state = read("PROJECT_STATE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const changelog = read("CHANGELOG.md");
const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
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
        A.match(changelogHead, new RegExp(`##\\s+v${version.replace(/\./g, "\\.")}\\s+runtime (?:maintenance|hotfix) r${generation}\\s+—\\s+production`, "i"), "Runtime maintenance changelog heading must identify its generation and production status.");
        A.ok(previousRuntime && changelogHead.includes(previousRuntime), "Runtime maintenance changelog must preserve its immediate previous whole-shell recovery target.");
        A.ok(proof, `${proofPath} must exist for promoted runtime maintenance.`);
        A.ok(proof.includes(revision) && proof.includes(previousRuntime), `${proofPath} must preserve current and previous whole-shell identity.`);
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
    A.match(text, /Local Profiles[\s\S]{0,120}Save Library|Save Library[\s\S]{0,120}Local Profiles/i, `${file} must acknowledge the shipped Local Profiles / Save Library dependency chain.`);
}
A.ok(readme.includes("careerModeShowdown.saveLibrary"), "README must describe post-cutover Save Library canonical authority.");
A.ok(/multiple local Showdown Saves|multi-save/i.test(readme), "README must describe the shipped multi-save product model.");
A.ok(!/one local browser\/device and one active Showdown/i.test(readme), "README must not revive the retired singleton-only product description.");

for(const term of ["accountId", "profileId", "saveId", "deviceId", "installationId", "baseRevision", "tombstone", "compare-and-swap"]){
    A.ok(cloud.includes(term), `Cloud foundation lost future contract term: ${term}`);
}
A.match(cloud, /future architecture contract only/i, "Cloud foundation must remain non-runtime architecture at this milestone.");
A.match(cloud, /No future cloud module may call localStorage directly/i, "Future sync must remain behind canonical storage authority.");
A.match(cloud, /v1\.3\.0 Recovery & Device Resilience Hardening[\s\S]+Local Profiles\/Save Library[\s\S]+Cloud Readiness[\s\S]+opt-in Cloud Backup/i, "Cloud foundation must preserve semantic dependency order after v1.3 resequencing.");
A.match(cloud, /Local Profiles\/Save Library is a completed production dependency milestone/i, "Cloud foundation must acknowledge the shipped Save Library dependency rather than narrating it as pending.");
A.ok(!/Local Profiles\/Save Library must follow before Cloud Readiness/i.test(cloud), "Cloud foundation contains stale current-facing pending-Save-Library authority.");
A.ok(!/Local Profiles\/Save Library remains the next approved structural direction after v1\.3/i.test(cloud), "Cloud foundation contains stale next-feature narration.");

A.match(start, /PROJECT_STATE\.md[^\n]+primary owner of current deployed product/i, "Developer bootstrap must identify PROJECT_STATE as the current-state owner.");
A.match(start, /NEXT_TASK\.md[^\n]+sole primary owner of the current implementation authorization boundary/i, "Developer bootstrap must identify NEXT_TASK as implementation authority.");
A.match(start, /POST_V1_ROADMAP_EXECUTION\.md[^\n]+dependency direction and current roadmap classification/i, "Developer bootstrap must keep roadmap ownership distinct from implementation authorization.");
A.match(start, /explicit cross-Save\/historical manager identity linkage foundation — PR #57/i, "Developer bootstrap must include the shipped fifth manager-identity layer.");
A.match(start, /identity-safe longitudinal Career Analytics \/ Trophy Room correction — PR #59/i, "Developer bootstrap must include the shipped Analytics layer rather than treating PR #59 as active branch work.");
A.match(start, /presentation-only Local Profile display-label editing — PR #61/i, "Developer bootstrap must include the shipped Local Profile label layer.");
A.match(currentHandoff, /concise rolling handoff/i, "Current handoff must remain a rolling evidence trail rather than another full project-state owner.");
A.match(currentHandoff, /A direct profile-ID key swap is not sufficiently correct/i, "Current production handoff must preserve the source-grounded Analytics identity finding that shaped the implementation.");
A.match(currentHandoff, /Failure 7[\s\S]+offscreen Trophy cabinet rendered-text assertion/i, "Current handoff must retain the final PR #59 validation failure and classification evidence.");

A.match(state, /Identity-Safe Career Analytics[\s\S]{0,120}(production-proven|merged, deployed)/i, "PROJECT_STATE must own current production Analytics truth after PR #59 proof.");
A.match(state, /Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`/i, "PROJECT_STATE must identify the exact multi-Save (PR #67) production runtime feature merge.");
A.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must retain the shipped explicit manager identity foundation.");
A.match(state, /unresolved historical roles remain excluded from identified longitudinal manager totals|unresolved historical manager roles remaining explicit/i, "PROJECT_STATE must retain unresolved historical identity semantics.");

A.match(next, /No product candidate is currently authorized for implementation/i, "NEXT_TASK must state that no product candidate is currently authorized after multi-Save closure.");
A.match(next, /IMMEDIATE NEXT TASK AFTER FULL STUDY/i, "NEXT_TASK must retain the permanent concrete handoff section.");
A.match(next, /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i, "NEXT_TASK must name formatVersion 2 multi-Save portability (PR #67) as closed / production-proven.");
A.match(next, /8fc671fc644e69b4fd405d7ebc28f961b2f3ae27/i, "NEXT_TASK must record the live main feature-merge SHA for PR #67.");
A.match(next, /Local Profile display-label editing[\s\S]+Identity-Safe Career Analytics[\s\S]+formatVersion 2 full multi-Save/i, "NEXT_TASK must close Local Profile display-label, Identity-Safe Analytics, and multi-Save as production-proven.");
A.match(next, /Current production Installable Offline App runtime: `1\.3\.0-r2`[\s\S]+Immediate previous known-good whole shell: `1\.3\.0-r1`/i, "NEXT_TASK must own coherent r2 production delivery identity and r1 recovery truth.");
A.match(next, /advance only a later explicit owner-authorized candidate|fresh explicit owner instruction selecting from the owner roadmap Phase B/i, "NEXT_TASK stop condition must require a later explicit owner instruction from Phase B onward.");

A.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must preserve unresolved historical identity as a valid state.");
A.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must keep the cross-Save manager identity prerequisite closed.");
A.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record the shipped Analytics state.");
A.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow identity layer without authorizing broad Analytics 2.0.");
A.match(roadmap, /Cloud Readiness \| FUTURE \/ NOT AUTHORIZED/i, "Analytics completion must not advance cloud authorization.");
A.match(roadmap, /Cloud Backup \| BLOCKED/i, "Analytics completion must not weaken Cloud Backup dependency gates.");
A.match(roadmap, /Backup\/import envelope portability \| AUTHORIZED AFTER PR #65/i, "Roadmap must classify bounded portability as authorized only after the infrastructure gate.");

A.match(proof, /Frozen candidate head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`/i, "R2 proof must retain the exact validated PR head.");
A.match(proof, /Runtime merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`/i, "R2 proof must retain the exact runtime merge.");
A.match(proof, /All 15 push\/deployment runs[\s\S]+deployed-site-smoke job `95036682319`/i, "R2 proof must retain exact production workflow and deployed smoke evidence.");
A.match(proof, /71 runtime files[\s\S]+byte for byte/i, "R2 proof must retain the complete runtime-file byte match.");
A.match(proof, /service-worker\.js[^\n]+exactly matches[\s\S]+manifest\.webmanifest[^\n]+exactly matches/i, "R2 proof must retain exact Service Worker and manifest deployment evidence.");
A.match(proof, /public browser journey[\s\S]+profile_\*[^\n]+unchanged[\s\S]+saved Showdown manager label remained unchanged/i, "R2 proof must retain the public profile-label identity/history boundary.");

A.match(analyticsHandoff, /Closed Candidate Handoff/i, "Analytics branch handoff must be explicitly closed after promotion.");
A.match(analyticsHandoff, /Exact branch base:[\s\S]+8c6fad42e38b4964d848128e40569442c3fa06d5/i, "Closed Analytics handoff must preserve its exact verified branch base.");
A.match(analyticsHandoff, /Exact validated PR head:[\s\S]+a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1/i, "Closed Analytics handoff must preserve its exact validated PR head.");
A.match(analyticsHandoff, /Exact runtime merge:[\s\S]+c5c7d50cc3a2d9003e057d1813744c877323c068/i, "Closed Analytics handoff must preserve its exact runtime merge.");
A.match(analyticsHandoff, /Failure 7[\s\S]+transient\/offscreen rendered-text assertion issue/i, "Closed Analytics handoff must preserve the final test classification without falsely claiming deterministic content-visibility behavior.");
A.match(analyticsHandoff, /deployed-site-smoke job `94855938131`[\s\S]+complete deployed production journey/i, "Closed Analytics handoff must retain deployed Pages proof.");

A.ok(start.includes("00_HANDOFF_GOLDEN_RULE.md") && start.includes("NEXT_TASK.md"), "Developer bootstrap lost current handoff/task authority.");
A.ok(next.includes("14 permanent workflow families") && next.includes("27 protected"), "NEXT_TASK lost permanent validation topology counts.");
const temporaryHelpers = fs.readdirSync(".github/workflows").filter(name => /v115|temporary/i.test(name) && /\.ya?ml$/i.test(name));
A.deepEqual(temporaryHelpers, [], `Temporary workflow helpers must not enter release authority: ${temporaryHelpers.join(", ")}`);
const topology = read("tests/support/run-workflow-blocks.cjs");
A.ok(topology.includes('name.endsWith(".yml") && name !== "validate-stability-lane.yml"'), "Authoritative workflow topology scope changed unexpectedly.");
A.ok(topology.includes('assert.equal(executed, 27'), "Protected 27-block workflow invariant changed unexpectedly.");

process.stdout.write(`PASS release authority coherence for v${version}/${revision}; r2 production proof, completed identity layers, recovery ownership, closed multi-Save (PR #67), clean-stop authorization, cloud boundary and workflow topology agree.\n`);
