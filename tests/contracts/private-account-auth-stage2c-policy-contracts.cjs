const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2c = read("PRIVATE_ACCOUNT_AUTH_STAGE_2C.md");
const stage2b = read("PRIVATE_ACCOUNT_AUTH_STAGE_2B.md");
const next = read("NEXT_TASK.md");
const state = read("PROJECT_STATE.md");
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
assert.match(stage2c, /CURRENT BOUNDED CANDIDATE \/ POLICY-ONLY \/ PRODUCTION FIREBASE DISCONNECTED/i);
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

for (const [name, text] of [
  ["NEXT_TASK.md", next],
  ["PROJECT_STATE.md", state],
  ["POST_V1_ROADMAP_EXECUTION.md", roadmap],
  ["REMOTE_JOINING_EXECUTION_ROADMAP.md", remoteRoadmap],
  ["00_CURRENT_HANDOFF.md", currentHandoff],
  ["00_DEVELOPER_START_HERE.md", start]
]) {
  assert.match(text, /Stage 2B[\s\S]{0,260}DONE \/ MERGED \/ PROVEN/i, `${name} must close Stage 2B.`);
  assert.match(text, /Stage 2C[\s\S]{0,320}(CURRENT BOUNDED CANDIDATE|CURRENT AUTHORIZED PREREQUISITE)/i, `${name} must identify Stage 2C as current.`);
  assert.match(text, /production Firebase[\s\S]{0,180}(disconnected|NOT CONNECTED)/i, `${name} must keep production Firebase disconnected.`);
}

assert.match(next, /Current authorized prerequisite candidate[\s\S]+Stage 2C/i);
assert.match(next, /Authorized product candidate:\*\* none|Authorized product candidate:\s*none/i);
assert.match(state, /Current Stage 2C candidate/i);
assert.match(roadmap, /Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary[\s\S]+CURRENT BOUNDED CANDIDATE/i);
assert.match(remoteRoadmap, /Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary[\s\S]+CURRENT BOUNDED CANDIDATE/i);
assert.match(currentHandoff, /Current Stage 2C checkpoint/i);
assert.match(start, /Stage 2C[\s\S]+Production Authentication Policy/i);

assert.match(rules, /request\.auth\.uid/);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);
assert.match(rules, /match \/\{document=\*\*\}[\s\S]+allow read, write:\s*if false/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

assert.equal(pkg.version, "1.4.0", "Policy-only Stage 2C must not bump production application version.");
assert.match(index, /app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker, /RUNTIME_REVISION = "1\.4\.0-r1"/);
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|GoogleAuthProvider|signInWithPopup|browserSessionPersistence|firestore/i, "Stage 2C must not connect Firebase/Auth in the production shell.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|GoogleAuthProvider|signInWithPopup|browserSessionPersistence|firestore/i, "Stage 2C must not connect Firebase/Auth through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase\/auth|GoogleAuthProvider|signInWithPopup|browserSessionPersistence|firestore/i, "Stage 2C must not cache Firebase/Auth runtime in the production Service Worker.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
assert.doesNotMatch(lock.slice(0, 1600), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2C production authentication policy, static-host compatibility and production isolation contracts\n");
