const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2c = read("PRIVATE_ACCOUNT_AUTH_STAGE_2C.md");
const stage2b = read("PRIVATE_ACCOUNT_AUTH_STAGE_2B.md");
const next = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const state = read("PROJECT_STATE.md");
const preR3State = read("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const currentHandoff = read("00_CURRENT_HANDOFF.md");
const start = read("00_DEVELOPER_START_HERE.md");
const rules = read("firestore.rules");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

assert.match(stage2c, /Production Authentication Policy & Static-Hosting Compatibility Boundary/i);
assert.match(stage2c, /DONE \/ MERGED \/ PROVEN \/ POLICY-ONLY \/ PRODUCTION FIREBASE DISCONNECTED/i);
assert.match(stage2c, /PR #85[\s\S]+48aa61a8d1b26f2c621cf7f0b410c68e0418257a[\s\S]+22566e1409cf53d728b38d0b5a19de478ae6761b/i);
assert.match(stage2c, /GoogleAuthProvider[\s\S]+Google federated sign-in only/i);
assert.match(stage2c, /signInWithPopup\(\)[\s\S]+explicit user gesture/i);
assert.match(stage2c, /signInWithRedirect\(\)[\s\S]+NOT authorized/i);
assert.match(stage2c, /browserSessionPersistence/i);
assert.match(stage2c, /browserLocalPersistence[\s\S]+NOT authorized/i);
assert.match(stage2c, /request no additional Google OAuth scopes/i);
assert.match(stage2c, /not deliberately retrieve, log, persist, transmit or place the Google OAuth access token/i);
assert.match(stage2c, /Firebase `uid` remains architecture `accountId`/i);
assert.match(stage2c, /application account status[\s\S]+separate from provider authentication/i);
assert.match(stage2c, /Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(stage2c, /production Firebase remains disconnected/i);
assert.match(stage2c, /Firebase Admin remains absent from the production dependency graph/i);
assert.match(stage2c, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2c, /careerModeShowdown\.saveLibrary[\s\S]+careerModeShowdown\.legacyShowdowns[\s\S]+careerModeShowdown\.preferences/i);
assert.match(stage2c, /Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i);
assert.match(stage2c, /Registered Devices \/ Private Pairing[\s\S]+BLOCKED/i);
assert.match(stage2c, /Connected Rivalry[\s\S]+BLOCKED/i);
assert.match(stage2c, /Private Remote Joining[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(stage2c, /verifyIdToken[\s\S]+checkRevoked=true/i);
assert.match(stage2c, /NOT implemented or authorized by Stage 2C/i);

assert.match(stage2b, /DONE \/ MERGED \/ PROVEN[\s\S]+PR #84/i);
assert.match(stage2b, /d6786d9d3f65a329aaf3607c3eb3d3d357983c5f/);
assert.match(stage2b, /c4feadb69fb5e26eba19fa520afa0a09baf1de03/);

const archivalSources = [
  ["authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md", historicalNext],
  ["POST_V1_ROADMAP_EXECUTION.md", roadmap],
  ["REMOTE_JOINING_EXECUTION_ROADMAP.md", remoteRoadmap],
  ["00_CURRENT_HANDOFF.md", currentHandoff],
  ["00_DEVELOPER_START_HERE.md", start]
];
for (const [name, text] of archivalSources) {
  assert.match(text, /Stage 2B[\s\S]{0,320}DONE \/ MERGED \/ PROVEN/i, `${name} must keep Stage 2B closed.`);
  assert.match(text, /Stage 2C[\s\S]{0,520}DONE \/ MERGED \/ PROVEN/i, `${name} must identify Stage 2C as completed.`);
  assert.match(text, /48aa61a8d1b26f2c621cf7f0b410c68e0418257a/i, `${name} must retain the exact validated Stage 2C head.`);
  assert.match(text, /22566e1409cf53d728b38d0b5a19de478ae6761b/i, `${name} must retain the Stage 2C squash-merge boundary.`);
  assert.match(text, /production Firebase[\s\S]{0,260}(disconnected|NOT CONNECTED)/i, `${name} must retain the historical disconnected-production boundary.`);
}

assert.match(historicalNext, /Completed Handoff Proximity governance synchronization[\s\S]{0,520}PR #86[\s\S]{0,520}DONE \/ MERGED \/ PROTECTED/i);
assert.match(historicalNext, /15cfa82d9aa74db1275968ed3bc1e42669ab23ec/);
assert.match(historicalNext, /1794f1f86968781b898d000360d1fb56234fb92f/);
assert.match(historicalNext, /Current authorized prerequisite candidate:[\s\S]{0,240}Stage 2D/i);
assert.match(historicalNext, /Historical post-PR #86 wording:[\s\S]{0,180}post-PR #86 current-authority reconciliation/i);
assert.match(historicalNext, /Remaining later Stage 2 concerns[\s\S]+not automatic implementation order|remaining Stage 2[\s\S]+not automatic/i);
assert.match(preR3Next,/CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i,"Immutable pre-r3 NEXT_TASK must preserve the PR #125 runtime authority.");
assert.match(preR3Next,/Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PR #115 PRODUCTION APP CHECK DEPLOYMENT PROOF VIA PR #116/i,"Immutable pre-r3 NEXT_TASK must preserve PR #115/#116 deployment-proof provenance.");
assert.match(preR3Next,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(preR3Next,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Immutable pre-r3 NEXT_TASK must preserve the bounded v1.5.0 / 1.5.0-r1 candidate provenance.");
assert.match(next,/CURRENT OVERRIDE — v1\.8\.1-r3 CONNECTED ACCOUNT RECOVERY HOTFIX/i,"Live NEXT_TASK must identify the current r3 Connected Account recovery authority.");
assert.match(next,/Do not enable App Check enforcement/i,"Live r3 authority must keep App Check enforcement off.");

for (const [name, text] of archivalSources) {
  assert.match(text, /PR #87[\s\S]{0,900}(DONE \/ MERGED \/ PROVEN|complete|completed)/i, `${name} must keep PR #87 closed.`);
  assert.match(text, /2415c156161b6244c75e49917bad28efed957adf/i, `${name} must retain PR #87 exact validated head.`);
  assert.match(text, /0accb827fa91f86fdd28e63590bd4843267546ae/i, `${name} must retain PR #87 squash-merge boundary.`);
  assert.match(text, /Stage 2D[\s\S]{0,900}(CURRENT|current)/i, `${name} must retain the historical Stage 2D-current transition evidence.`);
}

assert.match(preR3State, /PR #115 `Connect production App Check runtime safely` is DONE \/ MERGED AS SOURCE[\s\S]+Firebase App \+ App Check/i);
assert.match(preR3State, /PR #116 `Add controlled GitHub Pages App Check deployment`[\s\S]+current direct Remote Joining prerequisite/i);
assert.match(preR3State, /Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Immutable pre-r3 PROJECT_STATE must preserve completed Stage 2A-through-2I prerequisite authority.");
assert.match(preR3State, /Active release candidate[\s\S]+v1\.5\.0[\s\S]+NOT production/i,"Immutable pre-r3 PROJECT_STATE must preserve the v1.5.0 bounded candidate provenance.");
assert.match(state,/v1\.8\.1[\s\S]+1\.8\.1-r3/i,"Live PROJECT_STATE must identify the r3 recovery candidate.");
assert.match(state,/RJR-1[\s\S]{0,260}76\/100/i,"Live PROJECT_STATE must keep recovery readiness at 76 until owner production proof.");
assert.match(roadmap, /Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(roadmap, /Stage 2D — Production Firebase Environment & Configuration Preflight[\s\S]+CURRENT/i);
assert.match(remoteRoadmap, /Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(remoteRoadmap, /Stage 2D — Production Firebase Environment & Configuration Preflight[\s\S]+CURRENT/i);
assert.match(currentHandoff, /Post-PR #86 authority reconciliation — DONE \/ MERGED \/ PROVEN/i);
assert.match(currentHandoff, /Current Stage 2D bounded prerequisite/i);
assert.match(start, /Exact Stage 2C completion boundary/i);
assert.match(start, /Stage 2C[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(start, /Stage 2D — Production Firebase Environment & Configuration Preflight — is CURRENT/i);

assert.match(rules, /request\.auth\.uid/);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);
assert.match(rules, /match \/\{document=\*\*\}[\s\S]+allow read, write:\s*if false/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2C policy proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|GoogleAuthProvider|signInWithPopup|browserSessionPersistence|firestore/i, "Stage 2C must not itself connect Firebase Auth/Admin/Firestore directly in the production shell; later reviewed connected-account runtime remains lazy behind app.js.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|GoogleAuthProvider|signInWithPopup|browserSessionPersistence|firestore/i, "Stage 2C must not connect Firebase Auth/Admin/Firestore through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase-auth|firebase\/auth|GoogleAuthProvider|signInWithPopup|browserSessionPersistence|firestore|private-account-auth-stage2c/i, "Stage 2C Auth policy/runtime must remain absent from the production Service Worker even when later reviewed Firebase runtime assets are shell-cached indirectly.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
assert.doesNotMatch(lock.slice(0, 1600), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2C policy with historical Stage 2D transition preserved and current r3 recovery authority explicit\n");