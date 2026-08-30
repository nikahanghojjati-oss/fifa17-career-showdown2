const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2a = read("PRIVATE_ACCOUNT_AUTH_STAGE_2A.md");
const next = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const state = read("PROJECT_STATE.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const preR3State = read("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const phase1f = read("CLOUD_SYNC_READINESS_PHASE_1F.md");
const rules = read("firestore.rules");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const r5Production = bootstrap.runtime?.productionRuntimeRevision === "1.8.1-r5" && !bootstrap.runtime?.candidateRuntimeRevision;

assert.match(stage2a, /AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED/i);
assert.match(stage2a, /demo-career-mode-showdown-phase1f/);
assert.match(stage2a, /Authentication Emulator[\s\S]+9099/i);
assert.match(stage2a, /Firestore[\s\S]+8080/i);
assert.match(stage2a, /Firebase Auth `uid`[\s\S]+`accountId`/i);
assert.match(stage2a, /accountId[\s\S]+profileId[\s\S]+saveId[\s\S]+seasonId[\s\S]+deviceId[\s\S]+installationId[\s\S]+rivalryId[\s\S]+sessionId/i);
assert.match(stage2a, /synthetic email\/password users[\s\S]+test mechanism only/i);
assert.match(stage2a, /in-memory/i);
assert.match(stage2a, /wrong-account/i);
assert.match(stage2a, /Signing out removes authenticated Firestore access/i);
assert.match(stage2a, /Every application-client Firestore create, update and delete remains denied|all application-client Firestore writes remain denied/i);
assert.match(stage2a, /raw password[\s\S]+ID token[\s\S]+refresh token[\s\S]+not/i);
assert.match(stage2a, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2a, /careerModeShowdown\.saveLibrary[\s\S]+careerModeShowdown\.legacyShowdowns[\s\S]+careerModeShowdown\.preferences/i);
assert.match(stage2a, /production accounts[\s\S]+NOT CREATED/i);
assert.match(stage2a, /Pairing \/ Connected Rivalry \/ Remote Joining:\s*NOT AUTHORIZED/i);
assert.match(stage2a, /public discovery[\s\S]+global leaderboard\/rankings remain eliminated/i);

assert.match(phase1f, /DONE \/ MERGED \/ PROTECTED[\s\S]+PR #81/i);
assert.match(phase1f, /0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d/);
assert.match(phase1f, /231556d86a93535fa90e173577c1159de4f40be0/);
assert.match(phase1f, /every application-client (?:Firestore )?write(?: path)? remains denied/i);
assert.match(phase1f, /idempotencyKeyHash[\s\S]+sibling[\s\S]+idempotency receipt/i);

// Stage 2A is immutable prerequisite provenance, not current execution authority.
assert.match(historicalNext, /Current authorized prerequisite candidate[\s\S]+Private Account \/ Authentication Stage 2A/i,"Archived predecessor authority must preserve the historical Stage 2A selection boundary.");
assert.match(preR3Next,/Historical gateway heading retained only as provenance: CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY/i,"Lossless pre-r3 authority must retain the completed gateway prerequisite as historical provenance.");
assert.match(preR3Next,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Lossless pre-r3 authority must preserve Stage 2A through 2I completion.");
assert.match(preR3Next, /Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Lossless pre-r3 authority must preserve the historical bounded v1.5.0/r1 candidate.");
assert.match(preR3State, /Phase 1F[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+PR #81/i);
assert.match(preR3State, /Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Lossless pre-r3 PROJECT_STATE must preserve Stage 2A completion inside the Stage 2A-through-2I authority.");
assert.match(next,/CURRENT OVERRIDE[\s\S]+PR #171 MERGED[\s\S]+RJR87[\s\S]+STAGE 5A/i,"Current NEXT_TASK must identify PR #171 closure / RJR87 / Stage 5A activation rather than revive Stage 2A.");
assert.match(state,/CURRENT OVERRIDE[\s\S]+PR #171 MERGED[\s\S]+PRODUCTION PROVIDER-ABUSE PASS[\s\S]+RJR87[\s\S]+STAGE 5A/i,"Current PROJECT_STATE must identify PR #171 closure / RJR87 / Stage 5A activation rather than revive Stage 2A.");
assert.equal(r5Production,true,"Current transition authority must remain on restored production r5.");
assert.match(next,/Status:[\s\S]+production remains `v1\.8\.1 \/ 1\.8\.1-r5`[\s\S]+DEPLOYED \/ PRODUCTION-PROVEN/i,"Current NEXT_TASK must expose restored r5 production truth.");
assert.match(state,/Status:[\s\S]+PRODUCTION-PROVEN[\s\S]+v1\.8\.1 \/ 1\.8\.1-r5/i,"Current PROJECT_STATE must expose restored r5 production truth.");
assert.match(state,/Immediate known-good rollback runtime:\s*`1\.8\.1-r4`/i,"Current PROJECT_STATE must retain r4 as the proven rollback target.");
assert.match(state,/Rollback proof workflow:\s*`33190961085` — SUCCESS \/ consumed/i,"Current PROJECT_STATE must retain exact production rollback proof provenance.");
assert.match(state,/PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29\.md[\s\S]+firestore\.spark\.rules/i,"Current PROJECT_STATE must retain direct provider Rules provenance.");
assert.equal(readiness.modelVersion,"RJR-1","Stage 2A current-state checks must use the fixed RJR-1 model.");
assert.match(state,new RegExp("Remote Joining readiness:\\s*`"+readiness.currentScore+"\\/100` under fixed RJR-1","i"),"Current PROJECT_STATE must report the live fixed RJR score.");
assert.equal(readiness.currentScore,87,"Stage 2A current-state checks must preserve the fixed RJR87 provider-abuse checkpoint.");
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E DONE \/ 1F DONE/i);
assert.match(roadmap, /Private Identity \/ Account Layer \| STAGE 2 ACTIVE \/ 2A AUTHORIZED NEXT/i);
assert.match(remoteRoadmap, /Stage 1 — Cloud \/ Sync Readiness[\s\S]+DONE \/ MERGED \/ PROTECTED through Phase 1F/i);
assert.match(remoteRoadmap, /Stage 2A — Firebase Auth Emulator Identity Boundary[\s\S]+AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED/i);
assert.match(remoteRoadmap, /Stage 3[\s\S]+BLOCKED until Stage 2 is proven/i);

assert.match(rules, /request\.auth\.uid/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while emulator-only historical Stage 2A stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|firestore/i, "Stage 2A boundary must not itself connect Firebase Auth/Admin/Firestore directly in the production shell; later reviewed connected-account runtime remains lazy behind app.js.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|firestore/i, "Stage 2A boundary must not connect Firebase Auth/Admin/Firestore through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase-auth|firebase\/auth|firestore|private-account-auth-stage2a/i, "Stage 2A Auth/emulator runtime must remain absent from the production Service Worker even when later reviewed Firebase runtime assets are shell-cached indirectly.");

process.stdout.write("PASS Private Account/Auth Stage 2A emulator-only identity boundary with immutable historical selection/completion preserved and current PR #171 closure / RJR87 / Stage 5A activation authority explicit\n");
