const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2a = read("PRIVATE_ACCOUNT_AUTH_STAGE_2A.md");
const next = read("NEXT_TASK.md");
const state = read("PROJECT_STATE.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const phase1f = read("CLOUD_SYNC_READINESS_PHASE_1F.md");
const rules = read("firestore.rules");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));

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
assert.match(phase1f, /idempotency-key hash[\s\S]+matching sibling idempotency receipt/i);

assert.match(next, /Current authorized prerequisite candidate[\s\S]+Private Account \/ Authentication Stage 2A/i);
assert.match(next, /Authorized product candidate:[\s\S]{0,40}none/i);
assert.match(state, /Phase 1F[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+PR #81/i);
assert.match(state, /Private Account \/ Authentication Stage 2A/i);
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E DONE \/ 1F DONE/i);
assert.match(roadmap, /Private Identity \/ Account Layer \| STAGE 2 ACTIVE \/ 2A AUTHORIZED NEXT/i);
assert.match(remoteRoadmap, /Stage 1 — Cloud \/ Sync Readiness[\s\S]+DONE \/ MERGED \/ PROTECTED through Phase 1F/i);
assert.match(remoteRoadmap, /Stage 2A — Firebase Auth Emulator Identity Boundary[\s\S]+AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED/i);
assert.match(remoteRoadmap, /Stage 3[\s\S]+BLOCKED until Stage 2 is proven/i);

assert.match(rules, /request\.auth\.uid/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);

assert.equal(pkg.version, "1.4.0", "Stage 2A scope/authority checkpoint must not bump production application version.");
assert.match(index, /app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker, /RUNTIME_REVISION = "1\.4\.0-r1"/);
assert.doesNotMatch(index, /firebase|firestore/i, "Stage 2A boundary must not connect Firebase in the production shell.");
assert.doesNotMatch(optional, /firebase|firestore/i, "Stage 2A boundary must not connect Firebase through production optional modules.");
assert.doesNotMatch(worker, /firebase|firestore/i, "Stage 2A boundary must not cache Firebase runtime in the production Service Worker.");

process.stdout.write("PASS Private Account/Auth Stage 2A emulator-only identity boundary and Phase 1F completion authority\n");
