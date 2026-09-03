const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2b = read("PRIVATE_ACCOUNT_AUTH_STAGE_2B.md");
const stage2a = read("PRIVATE_ACCOUNT_AUTH_STAGE_2A.md");
const stage2c = read("PRIVATE_ACCOUNT_AUTH_STAGE_2C.md");
const next = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const state = read("PROJECT_STATE.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const preR3State = read("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const emulatorTest = read("tests/firebase/private-account-auth-stage2b-lifecycle-emulator.cjs");
const workflow = read(".github/workflows/validate-static-app.yml");
const rules = read("firestore.rules");
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseConfig = JSON.parse(read("firebase.json"));
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

assert.match(stage2b, /Provider Session Lifecycle & Revocation Boundary/i);
assert.match(stage2b, /Status: DONE \/ MERGED \/ PROVEN through PR #84/i);
assert.match(stage2b, /d6786d9d3f65a329aaf3607c3eb3d3d357983c5f/);
assert.match(stage2b, /c4feadb69fb5e26eba19fa520afa0a09baf1de03/);
assert.match(stage2b, /Stage 2A is DONE \/ MERGED \/ PROVEN[\s\S]+PR #83/i);
assert.match(stage2b, /a4022d6f316622f73ead9aacde812b545b8dcf78/);
assert.match(stage2b, /e39c1b0689598ac922569ff839ca30a1d5dee5fa/);
assert.match(stage2b, /Firebase Admin user-management APIs are elevated operations intended for a secure server environment/i);
assert.match(stage2b, /Refresh-token revocation is an Admin SDK operation/i);
assert.match(stage2b, /FIREBASE_AUTH_EMULATOR_HOST/);
assert.match(stage2b, /does not claim production proof of every in-flight token invalidation timing detail/i);
assert.match(stage2b, /Application account status remains the immediate fail-closed boundary for connected Firestore authorization/i);
assert.match(stage2b, /Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(stage2b, /production Auth persistence/i);
assert.match(stage2b, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2b, /public profiles[\s\S]+global leaderboard\/rankings remain eliminated/i);
assert.match(stage2b, /Registered devices\/private pairing remain blocked/i);
assert.match(stage2b, /current bounded prerequisite is Stage 2C/i);

assert.match(stage2a, /Stage 2A[\s\S]+PR #83/i);
assert.match(stage2c, /DONE \/ MERGED \/ PROVEN/i);
assert.match(stage2c, /PR #85[\s\S]+48aa61a8d1b26f2c621cf7f0b410c68e0418257a[\s\S]+22566e1409cf53d728b38d0b5a19de478ae6761b/i);

assert.match(historicalNext, /Stage 2B[\s\S]{0,260}DONE \/ MERGED \/ PROVEN/i);
assert.match(historicalNext, /Completed Handoff Proximity governance synchronization[\s\S]{0,520}PR #86[\s\S]{0,520}DONE \/ MERGED \/ PROTECTED/i);
assert.match(historicalNext, /Current authorized prerequisite candidate[\s\S]{0,520}Stage 2D/i);
assert.match(historicalNext, /Completed post-PR #86 authority reconciliation[\s\S]{0,520}PR #87[\s\S]{0,520}DONE \/ MERGED \/ PROVEN/i);
assert.match(preR3Next,/CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i,"Immutable pre-r3 authority must preserve the PR #125 Connected Account runtime milestone.");
assert.match(preR3Next,/Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PR #115 PRODUCTION APP CHECK DEPLOYMENT PROOF VIA PR #116/i,"Immutable pre-r3 authority must preserve PR #115/#116 deployment-proof provenance.");
assert.match(preR3Next,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(preR3Next,/currently published application-client Firestore create\/update\/delete boundary remains deny-all|browser Firestore (?:create\/update\/delete remains deny-all|writes deny-all)/i,"Immutable pre-r3 authority must preserve the deployed deny-all Firestore boundary that applied to the PR #125 candidate.");

// Stage 2B is immutable lifecycle/revocation provenance. The current live transition is the
// production-proven PR187 / v1.9.0-r5 / RJR89 successor boundary.
assert.match(next,/CURRENT OVERRIDE[\s\S]+PR #187[\s\S]+RJR89/i,"Live NEXT_TASK must identify the current PR #187 / RJR89 authority.");
assert.match(next,/App Check enforcement remains OFF/i,"Current transition authority must keep App Check enforcement off.");
assert.match(next,/(?:Billing must never be activated[\s\S]{0,120}Firebase remains Spark|Firebase remains Spark \/ zero billing)/i,"Current transition authority must preserve Spark zero billing.");

assert.match(preR3State, /PR #115[\s\S]+Firebase App \+ App Check/i);
assert.match(preR3State, /Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Immutable pre-r3 PROJECT_STATE must preserve the dormant Stage 2A-2I prerequisite boundaries at their proven boundaries.");
assert.match(preR3State, /Active release candidate[\s\S]+v1\.5\.0[\s\S]+NOT production/i,"Immutable pre-r3 PROJECT_STATE must preserve the bounded v1.5.0 candidate provenance.");
assert.match(state,/CURRENT OVERRIDE[\s\S]+PR #187[\s\S]+v1\.9\.0-r5[\s\S]+RJR89/i,"Live PROJECT_STATE must expose current PR187/r5/RJR89 authority rather than stale Stage 2B-era runtime state.");
assert.match(state,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i,"Live PROJECT_STATE must preserve the local-first recovery baseline.");
assert.equal(readiness.modelVersion,"RJR-1","Stage 2B current-state checks must use the fixed RJR-1 model.");
assert.equal(readiness.currentScore,89,"Stage 2B current-state checks must expose the fixed RJR89 boundary.");
const stage5eRjrEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
assert.equal(stage5eRjrEvidence?.score,88,"Stage 2B current-state checks must preserve the evidence-only Stage 5E provider-live lifecycle transition to RJR88.");
assert.equal(stage5eRjrEvidence?.delta,1,"Stage 2B current-state checks must preserve one bounded capability credit for the Stage 5E provider-live lifecycle.");
assert.match(state,new RegExp("Fixed RJR-1 is \\*\\*"+readiness.currentScore+"\\/100\\*\\*|RJR"+readiness.currentScore,"i"),"Live PROJECT_STATE must report the current evidence-backed readiness score from the fixed RJR ledger rather than a stale reconciliation-only literal.");
assert.match(roadmap, /Stage 2B — Provider Session Lifecycle & Revocation Boundary[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(roadmap, /Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(roadmap, /Stage 2D — Production Firebase Environment & Configuration Preflight[\s\S]+CURRENT/i);
assert.match(remoteRoadmap, /Stage 2B — Provider Session Lifecycle & Revocation Boundary[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(remoteRoadmap, /Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(remoteRoadmap, /Stage 2D — Production Firebase Environment & Configuration Preflight[\s\S]+CURRENT/i);
assert.match(remoteRoadmap, /Stage 3[\s\S]+BLOCKED until Stage 2 is proven/i);
assert.match(currentHandoff, /PR #187[\s\S]+1\.9\.0-r5[\s\S]+89\/100/i,"Rolling handoff must expose current PR187/r5/RJR89 transition authority.");
assert.match(currentHandoff, /HANDOFF_AT_CHECKPOINT[\s\S]+handoff completeness `100`/i,"Rolling handoff must expose the current complete transition boundary rather than a historical checkpoint.");
assert.match(currentHandoff, /one[- ]paste[\s\S]+zero manual Connected Rivalry Verify\/Reattach/i,"Rolling handoff must preserve the owner-accepted production capability that moved RJR88 to RJR89.");

assert.equal(firebaseRc.projects.default, "demo-career-mode-showdown-phase1f");
assert.equal(firebaseConfig.emulators.auth.host, "127.0.0.1");
assert.equal(firebaseConfig.emulators.auth.port, 9099);
assert.equal(firebaseConfig.emulators.firestore.host, "127.0.0.1");
assert.equal(firebaseConfig.emulators.firestore.port, 8080);

assert.match(emulatorTest, /FIREBASE_AUTH_EMULATOR_HOST\s*=\s*"127\.0\.0\.1:9099"/);
assert.doesNotMatch(emulatorTest, /FIREBASE_AUTH_EMULATOR_HOST\s*=\s*"https?:\/\//);
assert.match(emulatorTest, /initializeAdminApp\(\{\s*projectId:\s*PROJECT_ID\s*\}/);
assert.match(emulatorTest, /getAdminAuth\(adminApp\)/);
assert.match(emulatorTest, /updateUser\(accountIdA,\s*\{\s*disabled:\s*true\s*\}\)/);
assert.match(emulatorTest, /auth\/user-disabled/);
assert.match(emulatorTest, /updateUser\(accountIdA,\s*\{\s*disabled:\s*false\s*\}\)/);
assert.match(emulatorTest, /revokeRefreshTokens\(accountIdA\)/);
assert.match(emulatorTest, /accountEnvelope\(accountIdA,\s*"disabled"\)/);
assert.match(emulatorTest, /accountEnvelope\(accountIdA,\s*"active"\)/);
assert.match(emulatorTest, /assertFails\(updateDoc/);
assert.match(emulatorTest, /initializeAuth\(app,\s*\{\s*persistence:\s*inMemoryPersistence\s*\}\)/);
assert.doesNotMatch(emulatorTest, /getIdToken|getIdTokenResult|verifyIdToken|refreshToken/);
assert.doesNotMatch(emulatorTest, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(emulatorTest, /console\.(?:log|info|debug)|URLSearchParams/);
assert.doesNotMatch(emulatorTest, /credential\s*:|cert\(|serviceAccount|private_key|privateKey/);

assert.match(rules, /request\.auth\.uid/);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);
assert.match(rules, /match \/\{document=\*\*\}[\s\S]+allow read, write:\s*if false/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

assert.match(workflow, /firebase@12\.17\.1/);
assert.match(workflow, /@firebase\/rules-unit-testing@5\.0\.1/);
assert.match(workflow, /firebase-admin@14\.2\.0/);
assert.match(workflow, /firebase-tools@15\.27\.0/);
assert.match(workflow, /--no-save/);
assert.match(workflow, /--package-lock=false/);
assert.match(workflow, /emulators:exec[\s\S]+--project demo-career-mode-showdown-phase1f[\s\S]+--only auth,firestore/);
assert.match(workflow, /private-account-auth-stage2a-emulator\.cjs/);
assert.match(workflow, /private-account-auth-stage2b-lifecycle-emulator\.cjs/);

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2B emulator proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|firestore/i, "Stage 2B must not itself connect Firebase Auth/Admin/Firestore directly in the production shell; later reviewed connected-account runtime remains lazy behind app.js.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|firestore/i, "Stage 2B must not connect Firebase Auth/Admin/Firestore through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase-auth|firebase\/auth|firestore|private-account-auth-stage2b/i, "Stage 2B Auth/Admin emulator runtime must remain absent from the production Service Worker even when later reviewed Firebase runtime assets are shell-cached indirectly.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.doesNotMatch(lock.slice(0, 1600), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2B provider lifecycle/revocation proof with immutable historical successor checkpoints preserved and current PR187/r5/RJR89 transition authority explicit\n");