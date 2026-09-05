const A = require("node:assert/strict");
const F = require("node:fs");
const P = require("node:path");

const read = p => F.readFileSync(P.join(__dirname,"../..",p),"utf8");
const json = p => JSON.parse(read(p));
const pkg = json("package.json");
const index = read("index.html");
const worker = read("service-worker.js");
const readme = read("README.md");
const state = read("PROJECT_STATE.md");
const next = read("NEXT_TASK.md");
const start = read("00_DEVELOPER_START_HERE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const cloud = read("CLOUD_SYNC_FOUNDATION.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT.md");
const phase1e = read("CLOUD_SYNC_PHASE_1E_TWO_DEVICE_HARNESS.md");
const phase1eHarness = read("tests/support/cloudSyncTwoDeviceHarness.cjs");
const phase1eTest = read("tests/contracts/cloud-sync-two-device-harness-contracts.cjs");
const historicalNext = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const historicalR2Proof = read("PRODUCTION_V1_7_0_R2_PROOF_2026-08-27.md");
const analyticsHandoff = read("HANDOFF_CANDIDATE_C_ANALYTICS_CLOSED.md");
const handoffPath = "00_CURRENT_HANDOFF.md";
const handoff = read(handoffPath);
const currentHandoff = handoff;
const historicalR5Handoff = read("START_NEXT_SESSION_V1.4.37_PR187_R5_ONE_PASTE_RJR89.md");
const historicalR5Starter = read("START_NEXT_SESSION_V1.4.37_PR187_R5_ONE_PASTE_RJR89.md");
const changelog = read("CHANGELOG.md");

const version = pkg.version;
const revision = (index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision = (worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
A.ok(version && revision && workerRevision,"Release identity must be parseable.");
A.equal(workerRevision,revision,"Service worker and shell runtime revision must match.");
const revisionMatch=revision.match(/^(\d+\.\d+\.\d+)-r([1-9]\d*)$/);
A.ok(revisionMatch,"Runtime revision must be semver-rN.");
A.equal(revisionMatch[1],version,"Runtime revision must belong to package application version.");
const generation=Number(revisionMatch[2]);
const previousRuntime = generation>1 ? `${version}-r${generation-1}` : null;
const proofPath = `PRODUCTION_V${version.replace(/\./g,"_").toUpperCase()}_R${generation}_PROOF_${version==="1.9.1"?"2026-09-05":"2026-08-27"}.md`;
const proof = F.existsSync(P.join(__dirname,"../..",proofPath)) ? read(proofPath) : "";

// Current runtime identity and authority documents must remain coherent.
for(const [file,text] of [
    ["index.html",index],["service-worker.js",worker],["README.md",readme],
    ["PROJECT_STATE.md",state],["NEXT_TASK.md",next],["00_DEVELOPER_START_HERE.md",start],[handoffPath,handoff]
]){
    A.ok(text.includes(version),`${file} must acknowledge application ${version}.`);
}
for(const [file,text] of [
    ["README.md", readme], ["PROJECT_STATE.md", state], ["NEXT_TASK.md", next],
    ["00_DEVELOPER_START_HERE.md", start]
]) A.ok(text.includes(revision), `${file} must acknowledge promoted runtime ${revision}.`);
A.match(roadmap,/Current source, live GitHub\/provider\/deployment evidence, `NEXT_TASK\.md`, `PROJECT_STATE\.md`[\s\S]+override every retained historical roadmap body below/i,"Historical roadmap must explicitly defer live release authority to current source and authority documents.");
const changelogHead = changelog.slice(0, 1800);
A.match(changelogHead, new RegExp(`##\\s+v${version.replace(/\./g, "\\.")}`), "CHANGELOG must identify the current promoted application near the top.");
A.ok(changelogHead.includes(revision), "CHANGELOG must identify the current promoted runtime near the top.");
if(generation > 1){
    A.ok(previousRuntime && changelogHead.includes(previousRuntime), "Runtime maintenance changelog must preserve its previous whole-shell recovery target.");
    A.ok(proof, `${proofPath} must exist for promoted runtime maintenance.`);
    A.ok(proof.includes(revision) && proof.includes(previousRuntime), `${proofPath} must preserve current and previous whole-shell identity.`);
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
A.match(currentHandoff, /FIXED RJR-1 100\/100[\s\S]+PR #198[\s\S]+SSJR-1/i, "Current handoff must expose completed RJR100 / PR198 publication authority and route successor work to SSJR-1.");
A.match(currentHandoff, /Historical[\s\S]+PR191\/RJR91/i, "Current handoff must retain PR191/RJR91 only as immutable historical provenance.");
A.match(historicalR5Handoff, /PR #187[\s\S]+RJR89/i, "Immutable PR187 handoff must preserve the owner-accepted PR187/RJR89 evidence trail.");

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
A.ok(historicalR5Starter.includes("14 permanent") && historicalR5Starter.includes("workflow families"), "Immutable PR187 starter lost its exact-head validation family-count history.");
A.match(next,/every current permanent workflow family green on the same exact reviewed PR head/i,"NEXT_TASK must preserve dynamic exact-head publication discipline after workflow-family growth.");
const temporaryHelpers = F.readdirSync(P.join(__dirname,"../..",".github/workflows")).filter(name => /v115|temporary/i.test(name) && /\.ya?ml$/i.test(name));
A.deepEqual(temporaryHelpers, [], `Temporary workflow helpers must not enter release authority: ${temporaryHelpers.join(", ")}`);

process.stdout.write(`PASS release authority coherence: ${version}/${revision}, shipped recovery/offline/save-library baselines, immutable historical release proof, live RJR100/PR198 authority and SSJR successor routing remain coherent.\n`);
