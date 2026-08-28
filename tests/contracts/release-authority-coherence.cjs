const A = require("node:assert/strict");
const fs = require("node:fs");
const read = file => fs.readFileSync(file, "utf8");

const pkg = JSON.parse(read("package.json"));
const app = read("js/app.js");
const shell = read("index.html");
const worker = read("service-worker.js");
const version = pkg.version;
const revision = (shell.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const generation = Number((revision.match(/-r(\d+)$/) || [])[1]);

A.ok(app.includes(`const APP_VERSION = "${version}";`), "APP_VERSION must match package identity.");
A.match(revision, new RegExp(`^${version.replace(/\./g, "\\.")}-r[1-9]\\d*$`), "Runtime revision must belong to the current application version.");
A.ok(worker.includes(`const RUNTIME_REVISION = "${revision}";`), "Service Worker runtime identity must match the current shell.");

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
const state = read("PROJECT_STATE.md");
const readme = read("README.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const changelog = read("CHANGELOG.md");
const cloud = read("CLOUD_STORAGE_FOUNDATION.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");
const phase1e = read("CLOUD_SYNC_READINESS_PHASE_1E.md");
const phase1eHarness = read("js/cloudSyncTwoDeviceHarness.js");
const phase1eTest = read("tests/contracts/cloud-sync-two-device-harness-contracts.cjs");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const historicalR2Proof = read("V1.3.0_R2_PRODUCTION_PROOF.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const runtimeMerge = bootstrap.latestRuntimeMerge;
const candidateRecord = /Status:\s*RELEASE CANDIDATE/i.test(release);
const currentProductionProven = /Status:\s*DEPLOYED\s*\/\s*PRODUCTION-PROVEN/i.test(state) && state.includes(revision);
const previousRuntime = (release.match(/Previous known-good runtime:\s*`([^`]+)`/i) || [])[1];

A.ok(release.includes(`Runtime asset revision: \`${revision}\``), `${releasePath} has stale runtime identity.`);
A.ok(handoff.includes(revision), `${handoffPath} has stale runtime identity.`);
for(const [file, text] of [["NEXT_TASK.md", next], ["PROJECT_STATE.md", state]]){
    A.ok(text.includes(`v${version}`), `${file} must identify the current application version.`);
    A.ok(text.includes(revision), `${file} must identify the active runtime revision.`);
}

if(candidateRecord && currentProductionProven){
    // The runtime release note is an immutable candidate-era record. A later production proof may
    // supersede its candidate label without rewriting the original release-boundary evidence.
    A.ok(previousRuntime, "The retained candidate-era release record must name its previous known-good whole-runtime shell.");
    A.ok(readme.includes(previousRuntime) && /production-proven|production proven/i.test(readme), "README must retain previous production truth.");
    A.ok(changelog.includes(previousRuntime), "CHANGELOG must retain previous production runtime truth.");
    const currentState = state.slice(0, state.indexOf("## Historical pre-Stage3 authority") >= 0 ? state.indexOf("## Historical pre-Stage3 authority") : 5000);
    const currentNext = next.slice(0, next.indexOf("## Historical pre-Stage3 authority") >= 0 ? next.indexOf("## Historical pre-Stage3 authority") : 5000);
    A.match(currentState, /DEPLOYED\s*\/\s*PRODUCTION-PROVEN/i, "PROJECT_STATE must expose the later production-proven promotion.");
    A.ok(currentState.includes(`v${version}`) && currentState.includes(revision), "PROJECT_STATE current override must identify the promoted version and runtime.");
    A.equal(runtimeMerge.runtimeRevision, revision, "SESSION_BOOTSTRAP latest runtime merge must match the active shell revision.");
    A.ok(currentState.includes(runtimeMerge.mergeSha) && currentState.includes(`PR #${runtimeMerge.pullRequest}`), "PROJECT_STATE must retain the current production runtime lineage from SESSION_BOOTSTRAP.");
    A.match(currentNext, /DEPLOYED \/ PRODUCTION-PROVEN/i, "NEXT_TASK must expose the later production-proven promotion.");
    A.ok(currentNext.includes(`v${version}`) && currentNext.includes(revision), "NEXT_TASK current override must identify the promoted version and runtime.");
    A.ok(currentNext.includes(runtimeMerge.mergeSha) && currentNext.includes(`PR #${runtimeMerge.pullRequest}`), "NEXT_TASK must retain the current production runtime lineage from SESSION_BOOTSTRAP.");
    A.equal(bootstrap.remoteJoiningReadiness.score, readiness.currentScore, "Bootstrap and fixed RJR authority must agree.");
    A.ok(currentNext.includes("RJR-1") && currentNext.includes(`\`${readiness.currentScore}/100\``), "NEXT_TASK must retain the current evidence-backed Remote Joining readiness.");
    A.match(currentNext, /exact accepted-result idempotency replay[\s\S]+evidence-proven/i, "NEXT_TASK must preserve exact replay as a closed capability.");
    A.match(currentNext, /TOKEN-LIFECYCLE SAFETY PRODUCTION-PROVEN|stage4-token-lifecycle-contracts\.cjs/i, "NEXT_TASK must preserve the current token-lifecycle production boundary.");
    A.match(next, /IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+mandatory recursive SLE package[\s\S]+publish/i, "NEXT_TASK must route forward to the sealed transition publication rather than revive a completed product proof.");
}else if(candidateRecord){
    A.ok(previousRuntime, "A release candidate must name its previous known-good whole-runtime shell.");
    A.ok(readme.includes(previousRuntime) && /production-proven|production proven/i.test(readme), "Candidate README must retain previous production truth.");
    A.ok(changelog.includes(previousRuntime), "Candidate CHANGELOG must retain previous production runtime truth.");
    const currentState = state.slice(0, state.indexOf("## Historical pre-Stage3 authority") >= 0 ? state.indexOf("## Historical pre-Stage3 authority") : 5000);
    const currentNext = next.slice(0, next.indexOf("## Historical pre-Stage3 authority") >= 0 ? next.indexOf("## Historical pre-Stage3 authority") : 5000);
    A.match(currentState, /RELEASE CANDIDATE/i, "PROJECT_STATE must identify a release candidate.");
    A.match(currentState, /NOT PRODUCTION(?:-PROVEN)?/i, "PROJECT_STATE must explicitly deny production promotion for the candidate.");
    A.ok(currentState.includes(`v${version}`) && currentState.includes(revision), "PROJECT_STATE current override must identify the candidate version and runtime.");
    A.match(currentNext, /Authorized (?:release|product) candidate:/i, "NEXT_TASK current override must identify the authorized candidate.");
    A.ok(currentNext.includes(`v${version}`) && currentNext.includes(revision), "NEXT_TASK current override must identify the candidate version and runtime.");
    A.ok(currentState.includes(previousRuntime) && currentNext.includes(previousRuntime), "Candidate authority must preserve the immediate production/recovery runtime.");
}else{
    for(const [file, text] of [
        ["README.md", readme], ["PROJECT_STATE.md", state], ["NEXT_TASK.md", next],
        ["00_DEVELOPER_START_HERE.md", start], ["POST_V1_ROADMAP_EXECUTION.md", roadmap]
    ]) A.ok(text.includes(revision), `${file} must acknowledge promoted runtime ${revision}.`);
    const changelogHead = changelog.slice(0, 1800);
    A.match(changelogHead, new RegExp(`##\\s+v${version.replace(/\./g, "\\.")}`), "CHANGELOG must identify the current promoted application near the top.");
    A.ok(changelogHead.includes(revision), "CHANGELOG must identify the current promoted runtime near the top.");
    if(generation > 1){
        A.ok(previousRuntime && changelogHead.includes(previousRuntime), "Runtime maintenance changelog must preserve its previous whole-shell recovery target.");
        A.ok(proof, `${proofPath} must exist for promoted runtime maintenance.`);
        A.ok(proof.includes(revision) && proof.includes(previousRuntime), `${proofPath} must preserve current and previous whole-shell identity.`);
    }
}

for(const [file, text] of [
    ["00_DEVELOPER_START_HERE.md", start], ["NEXT_TASK.md", next], ["PROJECT_STATE.md", state],
    ["README.md", readme], [handoffPath, handoff]
]){
    A.ok(/transaction-owned|mutation-owned/i.test(text), `${file} must preserve rollback ownership semantics.`);
    A.ok(/strict exact raw|strict snapshot|exact raw snapshot/i.test(text), `${file} must preserve exact destructive snapshot authority.`);
    A.ok(/Installable Offline App|installed-app/i.test(text), `${file} must preserve the shipped installable/offline baseline.`);
    A.ok(!/roll(?:s|ed|ing)? every affected key/i.test(text), `${file} reintroduced the obsolete over-broad rollback model.`);
}

for(const [file, text] of [
    ["00_DEVELOPER_START_HERE.md", start], ["NEXT_TASK.md", next], ["PROJECT_STATE.md", state],
    ["README.md", readme], ["POST_V1_ROADMAP_EXECUTION.md", roadmap]
]){
    A.match(text, /v1\.3\.0[^\n]{0,90}Recovery & Device Resilience(?: Hardening| baseline)/i, `${file} must preserve the v1.3 resilience baseline.`);
    A.match(text, /Local Profiles[\s\S]{0,140}Save Library|Save Library[\s\S]{0,140}Local Profiles/i, `${file} must acknowledge the shipped Local Profiles / Save Library chain.`);
}

A.ok(readme.includes("careerModeShowdown.saveLibrary"), "README must describe Save Library canonical authority.");
A.ok(/multiple local Showdown Saves|multi-save/i.test(readme), "README must describe the multi-save model.");
A.ok(!/one local browser\/device and one active Showdown/i.test(readme), "README must not revive singleton-only product wording.");

A.match(roadmap, /v1\.1 Data Safety and Recovery is complete/i, "Roadmap must keep Data Safety and Recovery closed.");
A.match(roadmap, /Candidate A\/B\/C are protected systems, not the current feature task/i, "Roadmap must not reopen Candidate A/B/C as current feature work.");
A.match(roadmap, /Completed resilience baseline — v1\.3\.0 Recovery & Device Resilience Hardening/i, "Roadmap must preserve v1.3 resilience.");
A.match(roadmap, /Local Profiles and Save Library — completed dependency milestone/i, "Roadmap must preserve the completed local identity/save milestone.");
A.match(roadmap, /Public\/community\/rankings \| ELIMINATED/i, "Roadmap must keep public community/rankings eliminated.");
A.match(roadmap, /Private Remote Joining \| PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET AUTHORIZED/i, "Roadmap must preserve the private Remote Joining destination and gates.");

for(const term of ["accountId", "profileId", "saveId", "deviceId", "installationId", "baseRevision", "tombstone", "compare-and-swap"]){
    A.ok(cloud.includes(term), `Cloud foundation lost future contract term: ${term}`);
}
A.match(cloud, /future architecture contract only/i, "Cloud foundation must preserve its original historical non-runtime boundary.");
A.match(cloud, /No future cloud module may call localStorage directly/i, "Future sync must remain behind canonical storage authority.");
A.match(cloud, /Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i, "Cloud foundation must preserve the Remote Joining prerequisite path.");
A.match(cloud, /only after these gates pass may a bounded Remote Joining UX\/runtime candidate be authorized/i, "Cloud foundation must keep actual Remote Joining gated.");

A.match(remotePriority, /Supersedes:[\s\S]+earlier classification of private remote joining as `BLOCKED`/i, "Remote Joining amendment must preserve its superseding decision.");
A.match(remotePriority, /PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i, "Remote Joining amendment must preserve the owner-selected classification.");
A.match(remotePriority, /next safe prerequisite[\s\S]+preferred over unrelated optional expansion/i, "Remote Joining amendment must preserve anti-sidequest ordering.");

A.match(phase1e, /Phase 1E[\s\S]+provider-neutral/i, "Phase 1E authority must retain provider-neutral synchronization proof.");
A.match(phase1e, /recursively frozen/i, "Phase 1E must retain offline/retry intent immutability.");
A.ok(!/\bfetch\s*\(|\blocalStorage\b|firebase|firestore/i.test(phase1eHarness), "Phase 1E harness must remain provider/network/browser-storage neutral.");
A.match(phase1eTest, /Object\.isFrozen\(a1\.intent\.content\)/, "Phase 1E test must prove payload immutability.");
A.match(phase1eTest, /relationship-old[\s\S]+revoked-read-only[\s\S]+relationship-revoked/i, "Phase 1E test must prove revocation invalidates stale authority.");

// Immutable historical evidence remains pinned to the releases that produced it.
A.match(historicalNext, /Cloud\/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22`[\s\S]+Cloud\/Sync Readiness Phase 1E[\s\S]+Cloud\/Sync Readiness Phase 1F/i, "Archived NEXT_TASK must retain Phase 1D → 1E → 1F authorization history.");
A.match(historicalR2Proof, /Frozen candidate head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`/i, "R2 proof must retain its validated PR head.");
A.match(historicalR2Proof, /Runtime merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`/i, "R2 proof must retain its runtime merge.");
A.match(historicalR2Proof, /All 15 push\/deployment runs[\s\S]+deployed-site-smoke job `95036682319`/i, "R2 proof must retain exact workflow evidence.");
A.match(historicalR2Proof, /71 runtime files[\s\S]+byte for byte/i, "R2 proof must retain runtime byte-match evidence.");
A.match(analyticsHandoff, /Closed Candidate Handoff/i, "Analytics branch handoff must remain closed.");
A.match(analyticsHandoff, /Exact validated PR head:[\s\S]+a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1/i, "Analytics handoff must retain its validated PR head.");
A.match(analyticsHandoff, /Exact runtime merge:[\s\S]+c5c7d50cc3a2d9003e057d1813744c877323c068/i, "Analytics handoff must retain its runtime merge.");
A.match(currentHandoff, /rolling handoff/i, "Current handoff must remain a rolling evidence trail.");

// Current Stage 3 authority must be explicit in the current override, while old milestone text may remain historical below it.
if(version === "1.6.0"){
    const stateCurrent = state.slice(0, state.indexOf("## Historical pre-Stage3 authority"));
    const nextCurrent = next.slice(0, next.indexOf("## Historical pre-Stage3 authority"));
    for(const [file,text] of [["PROJECT_STATE.md",stateCurrent],["NEXT_TASK.md",nextCurrent]]){
        A.match(text,/Stage 3[\s\S]+Registered Devices[\s\S]+Private Pairing/i,`${file} must own current Stage 3 authority.`);
        A.ok(text.includes("1.6.0-r1"),`${file} must identify the Stage 3 runtime.`);
        A.ok(text.includes("1.5.0-r2"),`${file} must preserve the production rollback runtime.`);
        A.match(text,/63\/100/,`${file} must preserve RJR-1 current score until production Stage 3 proof.`);
        A.match(text,/App Check enforcement (?:remains )?OFF|APP CHECK ENFORCEMENT OFF/i,`${file} must keep App Check enforcement off.`);
        A.match(text,/zero billing|ZERO BILLING/i,`${file} must preserve Spark zero billing.`);
    }
    A.match(nextCurrent,/Do not repeat completed Firebase provider setup|do not repeat/i,"Stage 3 current authority must prohibit repeating completed Stage 2 provider setup.");
    A.match(nextCurrent,/publish exactly the reviewed Stage 3 `firestore\.spark\.rules`/i,"Stage 3 current authority must keep exact Rules publication after source proof.");
    A.match(nextCurrent,/do not implement Stage 4 Connected Rivalry|Stage 4 Connected Rivalry[\s\S]+not implementation-authorized/i,"Stage 3 must not silently absorb Connected Rivalry.");
    A.match(handoff,/Stage 3 Registered Devices \/ Private Pairing/i,"v1.6 maintenance handoff must preserve Stage 3 scope.");
}

A.ok(start.includes("00_HANDOFF_GOLDEN_RULE.md") && start.includes("NEXT_TASK.md"), "Developer bootstrap lost handoff/task authority.");
A.ok(next.includes("14 permanent workflow families"), "NEXT_TASK lost permanent validation family-count history.");
const temporaryHelpers = fs.readdirSync(".github/workflows").filter(name => /v115|temporary/i.test(name) && /\.ya?ml$/i.test(name));
A.deepEqual(temporaryHelpers, [], `Temporary workflow helpers must not enter release authority: ${temporaryHelpers.join(", ")}`);
const topology = read("tests/support/run-workflow-blocks.cjs");
A.ok(topology.includes('name.endsWith(".yml") && name !== "validate-stability-lane.yml"'), "Authoritative workflow topology scope changed unexpectedly.");
A.ok(topology.includes('assert.equal(executed, 30'), "Protected 30-block workflow invariant changed unexpectedly.");
A.ok(read(".github/workflows/validate-static-app.yml").includes("validate-stage3-private-pairing.yml"), "Static topology must explicitly require the permanent Stage 3 workflow.");

process.stdout.write(`PASS release authority coherence for v${version}/${revision}; current release authority, immutable historical evidence, recovery semantics, Remote Joining locks and workflow topology agree.\n`);