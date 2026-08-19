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
const historicalR2Proof = read("V1.3.0_R2_PRODUCTION_PROOF.md");
const start = read("00_DEVELOPER_START_HERE.md");
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const analyticsHandoff = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");
const next = read("NEXT_TASK.md");
const archivedNext = read("authority-history/NEXT_TASK_POST_PR100_REMOTE_JOINING_RESTART_FULL.md");
const readme = read("README.md");
const state = read("PROJECT_STATE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const changelog = read("CHANGELOG.md");
const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");
const phase1e = read("CLOUD_SYNC_READINESS_PHASE_1E.md");
const phase1eHarness = read("js/cloudSyncTwoDeviceHarness.js");
const phase1eTest = read("tests/contracts/cloud-sync-two-device-harness-contracts.cjs");
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
    A.match(text, /v1\.3\.0\s+—?\s*Recovery & Device Resilience Hardening/i, `${file} must preserve the v1.3 resilience baseline beneath Product Deepening.`);
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
A.match(roadmap, /Completed resilience baseline — v1\.3\.0 Recovery & Device Resilience Hardening/i, "Roadmap must preserve v1.3 as the completed protected resilience baseline.");
A.match(roadmap, /Local Profiles and Save Library — completed dependency milestone/i, "Roadmap must record shipped Local Profiles/Save Library as a completed dependency milestone.");
const resilienceIndex = roadmap.indexOf("v1.3.0 Recovery & Device Resilience Hardening");
const profilesIndex = roadmap.indexOf("Local Profiles and Save Library");
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
A.match(cloud, /Local Profiles\/Save Library[\s\S]{0,180}(completed local dependencies|completed production dependency milestone|already shipped)/i, "Cloud foundation must acknowledge the shipped Save Library dependency rather than narrating it as pending.");
A.ok(!/Local Profiles\/Save Library must follow before Cloud Readiness/i.test(cloud), "Cloud foundation contains stale current-facing pending-Save-Library authority.");
A.ok(!/Local Profiles\/Save Library remains the next approved structural direction after v1\.3/i.test(cloud), "Cloud foundation contains stale next-feature narration.");
A.match(cloud, /Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i, "Cloud foundation must encode the prioritized Remote Joining prerequisite path.");
A.match(cloud, /only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i, "Cloud foundation must keep Remote Joining gated behind proven prerequisites.");

A.match(start, /PROJECT_STATE\.md[^\n]+primary owner of current deployed product/i, "Developer bootstrap must identify PROJECT_STATE as the current-state owner.");
A.match(start, /NEXT_TASK\.md[^\n]+sole primary owner of the current implementation authorization boundary/i, "Developer bootstrap must identify NEXT_TASK as implementation authority.");
A.match(start, /POST_V1_ROADMAP_EXECUTION\.md[^\n]+dependency direction and current roadmap classification/i, "Developer bootstrap must keep roadmap ownership distinct from implementation authorization.");
A.match(start, /explicit cross-Save\/historical manager identity linkage foundation — PR #57/i, "Developer bootstrap must include the shipped fifth manager-identity layer.");
A.match(start, /identity-safe longitudinal Career Analytics \/ Trophy Room correction — PR #59/i, "Developer bootstrap must include the shipped Analytics layer rather than treating PR #59 as active branch work.");
A.match(start, /presentation-only Local Profile display-label editing — PR #61/i, "Developer bootstrap must include the shipped Local Profile label layer.");
A.match(start, /formatVersion 2 full multi-Save backup\/import portability — PR #67/i, "Developer bootstrap must include the completed multi-Save portability layer.");
A.match(start, /Phase B Save Library \/ Local Profile Experience 2\.0 first slice — PR #70/i, "Developer bootstrap must include the shipped Phase B first slice.");
A.match(start, /Phase C Showdown Home & Season Experience first slice — PR #73/i, "Developer bootstrap must include the shipped Phase C first slice.");
A.match(start, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i, "Developer bootstrap must preserve the owner-prioritized but gated Remote Joining direction.");
A.match(currentHandoff, /concise rolling handoff/i, "Current handoff must remain a rolling evidence trail rather than another full project-state owner.");
A.match(currentHandoff, /A direct profile-ID key swap is not sufficiently correct/i, "Current production handoff must preserve the source-grounded Analytics identity finding that shaped the implementation.");
A.match(currentHandoff, /Failure 7[\s\S]+offscreen Trophy cabinet rendered-text assertion/i, "Current production handoff must retain the final PR #59 validation failure and classification evidence.");

A.match(state, /Application milestone:\s*\*\*v1\.4\.0 — Product Deepening\*\*/i, "PROJECT_STATE must own the visible v1.4.0 Product Deepening milestone.");
A.match(state, /Identity-Safe Career Analytics[\s\S]{0,300}(production-proven|merged, deployed)/i, "PROJECT_STATE must own current production Analytics truth after PR #59 proof.");
A.match(state, /Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`/i, "PROJECT_STATE must identify the exact multi-Save (PR #67) production runtime feature merge.");
A.match(state, /Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`/i, "PROJECT_STATE must identify the exact Phase B first-slice (PR #70) production merge.");
A.match(state, /Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6`/i, "PROJECT_STATE must identify the exact Phase C first-slice (PR #73) production merge.");
A.match(state, /explicit cross-Save\/historical manager identity linkage foundation/i, "PROJECT_STATE must retain the shipped explicit manager identity foundation.");
A.match(state, /unresolved historical roles remain excluded from identified longitudinal manager totals|unresolved historical manager roles remaining explicit/i, "PROJECT_STATE must retain unresolved historical identity semantics.");
A.match(state, /No product candidate is currently authorized/i, "PROJECT_STATE must keep user-facing product runtime gated while prerequisite work advances.");
A.match(state, /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i, "PROJECT_STATE must retain the private-only product lock.");
A.match(state, /Private Remote Joining[\s\S]{0,260}\*\*PRIORITIZED LONG-TERM\*\*[\s\S]{0,260}\*\*DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED\*\*/i, "PROJECT_STATE must preserve Remote Joining as prioritized long-term while retaining prerequisite and authorization gates.");
A.match(state, /Cloud\/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`/i, "PROJECT_STATE must record the exact merged Phase 1D boundary.");
A.match(state, /Phase 1D — exact provider-compatible remote schema and API\/authorization contract:\s*\*\*DONE \/ MERGED \/ PROTECTED\*\*[\s\S]+Phase 1E — deterministic two-device\/offline\/reconnect synchronization harness:\s*\*\*CURRENT BOUNDED CANDIDATE\*\*/i, "PROJECT_STATE must close Phase 1D and identify Phase 1E as the current deterministic prerequisite.");
A.match(state, /Phase 1F[\s\S]+NEXT AFTER PHASE 1E MERGES \/ BLOCKED/i, "PROJECT_STATE must block Phase 1F until Phase 1E merges and is proven.");

A.match(next, /Authorized product candidate:\*\* none|Authorized product candidate:\s*none/i, "NEXT_TASK must authorize no product candidate after the v1.4.0 seal.");
A.match(archivedNext, /Phase B first slice — Save Library \/ Local Profile Experience 2\.0 \(PR #70/i, "Archived NEXT_TASK must retain Phase B first slice (PR #70) production provenance.");
A.match(archivedNext, /Phase C first slice — Showdown Home & Season Experience deepening \(PR #73/i, "Archived NEXT_TASK must retain Phase C first slice (PR #73) production provenance.");
A.match(archivedNext, /65b6c9db0a070b6e5e992a39dffeee23df0c6f08/i, "Archived NEXT_TASK must retain the PR #70 feature-merge SHA.");
A.match(archivedNext, /dec1d3ba8182c3f62019974dd1704c7c9124def6/i, "Archived NEXT_TASK must retain the PR #73 feature-merge SHA.");
A.match(next, /IMMEDIATE NEXT TASK AFTER FULL STUDY/i, "NEXT_TASK must retain the permanent concrete handoff section.");
A.match(archivedNext, /formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i, "Archived NEXT_TASK must retain multi-Save portability (PR #67) provenance.");
A.match(archivedNext, /8fc671fc644e69b4fd405d7ebc28f961b2f3ae27/i, "Archived NEXT_TASK must retain the PR #67 feature-merge SHA.");
A.match(archivedNext, /Local Profile display-label editing[\s\S]+Identity-Safe Career Analytics[\s\S]+formatVersion 2 full multi-Save/i, "Archived NEXT_TASK must retain completed profile-label, analytics and multi-Save provenance.");
A.match(next, /Production application milestone remains `v1\.4\.0`[\s\S]+Installable Offline App runtime remains `1\.4\.0-r1`[\s\S]+previous whole shell remains `1\.3\.0-r2`/i, "NEXT_TASK must own coherent v1.4.0-r1 production delivery identity and v1.3.0-r2 recovery truth.");
A.match(archivedNext, /Cloud\/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`[\s\S]+No product candidate is currently authorized[\s\S]+Current authorized prerequisite candidate[\s\S]+Cloud\/Sync Readiness Phase 1E[\s\S]+Next prerequisite after Phase 1E merges[\s\S]+Cloud\/Sync Readiness Phase 1F/i, "Archived NEXT_TASK must retain the historical Phase 1D → Phase 1E → Phase 1F transition provenance.");
A.match(archivedNext, /former clean-stop wording[\s\S]+satisfied[\s\S]+Do not revive/i, "Archived NEXT_TASK must retain the satisfied historical wait boundary.");
A.match(next, /Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i, "NEXT_TASK must preserve Remote Joining priority without silently authorizing runtime work.");

A.match(roadmap, /Historical profile identity mapping \| FOUNDATION DONE \/ UNRESOLVED RECORDS PERMITTED/i, "Roadmap must preserve unresolved historical identity as a valid state.");
A.match(roadmap, /Cross-Save manager\/profile linkage semantics \| DONE/i, "Roadmap must keep the cross-Save manager identity prerequisite closed.");
A.match(roadmap, /Current production derived Analytics \| IDENTITY-SAFE \/ PRODUCTION-PROVEN/i, "Roadmap must record the shipped Analytics state.");
A.match(roadmap, /Identity-safe longitudinal Analytics \/ Analytics 2\.0 \| NARROW IDENTITY-SAFE LAYER DONE/i, "Roadmap must close the narrow identity layer without authorizing broad Analytics 2.0.");
A.match(roadmap, /Backup\/import envelope portability \| DONE \/ PRODUCTION-PROVEN/i, "Roadmap must keep full multi-Save portability closed and production-proven.");
A.match(roadmap, /Showdown Home & Season Experience \| FIRST SLICE DONE \/ PRODUCTION-PROVEN/i, "Roadmap must keep Phase C first slice closed and production-proven.");
A.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E CURRENT \/ 1F NEXT/i, "Roadmap must reflect merged Phase 1D, current Phase 1E and blocked-next Phase 1F without authorizing provider runtime.");
A.match(roadmap, /Cloud Backup \| BLOCKED/i, "Product Deepening completion must not weaken Cloud Backup dependency gates.");
A.match(roadmap, /Public\/community\/rankings \| ELIMINATED/i, "Roadmap must keep public community and global rankings eliminated.");
A.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i, "Roadmap must preserve Private Remote Joining as the prioritized strategic destination while retaining strict prerequisite gates.");
A.match(roadmap, /Authorized product candidate: none/i, "Roadmap must keep user-facing product runtime gated while prerequisite work advances.");

A.match(remotePriority, /Supersedes:[\s\S]+earlier classification of private remote joining as `BLOCKED`/i, "Remote Joining amendment must explicitly supersede the former BLOCKED classification only.");
A.match(remotePriority, /PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i, "Remote Joining amendment must preserve the owner-selected long-term classification.");
A.match(remotePriority, /next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i, "Remote Joining amendment must preserve the long-term prerequisite prioritization rule.");
A.match(phase1e, /Phase 1E[\s\S]+provider-neutral/i, "Phase 1E authority must identify the current provider-neutral synchronization proof.");
A.match(phase1e, /recursively frozen/i, "Phase 1E authority must make complete offline/retry intent immutability explicit.");
A.match(phase1e, /Phase 1F remains blocked/i, "Phase 1E authority must keep provider connection blocked until the deterministic proof is merged.");
A.ok(!/\bfetch\s*\(|\blocalStorage\b|firebase|firestore/i.test(phase1eHarness), "Phase 1E harness must remain provider/network/browser-storage neutral.");
A.match(phase1eTest, /Object\.isFrozen\(a1\.intent\.content\)/, "Phase 1E permanent test must prove payload immutability, not just baseRevision equality.");
A.match(phase1eTest, /relationship-old[\s\S]+revoked-read-only[\s\S]+relationship-revoked/i, "Phase 1E permanent test must prove relationship revocation invalidates stale cached mutation authority.");

A.match(historicalR2Proof, /Frozen candidate head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`/i, "R2 proof must retain the exact validated PR head.");
A.match(historicalR2Proof, /Runtime merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`/i, "R2 proof must retain the exact runtime merge.");
A.match(historicalR2Proof, /All 15 push\/deployment runs[\s\S]+deployed-site-smoke job `95036682319`/i, "R2 proof must retain exact production workflow and deployed smoke evidence.");
A.match(historicalR2Proof, /71 runtime files[\s\S]+byte for byte/i, "R2 proof must retain the complete runtime-file byte match.");
A.match(historicalR2Proof, /service-worker\.js[^\n]+exactly matches[\s\S]+manifest\.webmanifest[^\n]+exactly matches/i, "R2 proof must retain exact Service Worker and manifest deployment evidence.");
A.match(historicalR2Proof, /public browser journey[\s\S]+profile_\*[^\n]+unchanged[\s\S]+saved Showdown manager label remained unchanged/i, "R2 proof must retain the public profile-label identity/history boundary.");

A.match(analyticsHandoff, /Closed Candidate Handoff/i, "Analytics branch handoff must be explicitly closed after promotion.");
A.match(analyticsHandoff, /Exact branch base:[\s\S]+8c6fad42e38b4964d848128e40569442c3fa06d5/i, "Closed Analytics handoff must preserve its exact verified branch base.");
A.match(analyticsHandoff, /Exact validated PR head:[\s\S]+a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1/i, "Closed Analytics handoff must preserve its exact validated PR head.");
A.match(analyticsHandoff, /Exact runtime merge:[\s\S]+c5c7d50cc3a2d9003e057d1813744c877323c068/i, "Closed Analytics handoff must preserve its exact runtime merge.");
A.match(analyticsHandoff, /Failure 7[\s\S]+transient\/offscreen rendered-text assertion issue/i, "Closed Analytics handoff must preserve the final test classification without falsely claiming deterministic content-visibility behavior.");
A.match(analyticsHandoff, /deployed-site-smoke job `94855938131`[\s\S]+complete deployed production journey/i, "Closed Analytics handoff must retain deployed Pages proof.");

A.ok(start.includes("00_HANDOFF_GOLDEN_RULE.md") && start.includes("NEXT_TASK.md"), "Developer bootstrap lost current handoff/task authority.");
A.match(archivedNext, /14 permanent workflow families[\s\S]+27 protected/i, "Archived authority must retain the historical validation-topology narration.");
const temporaryHelpers = fs.readdirSync(".github/workflows").filter(name => /v115|temporary/i.test(name) && /\.ya?ml$/i.test(name));
A.deepEqual(temporaryHelpers, [], `Temporary workflow helpers must not enter release authority: ${temporaryHelpers.join(", ")}`);
const topology = read("tests/support/run-workflow-blocks.cjs");
A.ok(topology.includes('name.endsWith(".yml") && name !== "validate-stability-lane.yml"'), "Authoritative workflow topology scope changed unexpectedly.");
A.ok(topology.includes('assert.equal(executed, 27'), "Protected 27-block workflow invariant changed unexpectedly.");

process.stdout.write(`PASS release authority coherence for v${version}/${revision}; current production identity, shipped recovery baselines, archived historical release/Cloud provenance, prioritized dependency-gated Remote Joining, private product locks, cloud boundary and workflow topology agree.\n`);