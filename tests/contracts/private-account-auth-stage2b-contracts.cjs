const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2b = read("PRIVATE_ACCOUNT_AUTH_STAGE_2B.md");
const stage2a = read("PRIVATE_ACCOUNT_AUTH_STAGE_2A.md");
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
assert.match(stage2b, /CURRENT BOUNDED CANDIDATE \/ EMULATOR-ONLY IMPLEMENTATION/i);
assert.match(stage2b, /Stage 2A is DONE \/ MERGED \/ PROVEN[\s\S]+PR #83/i);
assert.match(stage2b, /a4022d6f316622f73ead9aacde812b545b8dcf78/);
assert.match(stage2b, /e39c1b0689598ac922569ff839ca30a1d5dee5fa/);
assert.match(stage2b, /Admin user-management APIs are elevated operations intended for a secure server environment/i);
assert.match(stage2b, /refresh-token revocation is an Admin SDK operation/i);
assert.match(stage2b, /FIREBASE_AUTH_EMULATOR_HOST/);
assert.match(stage2b, /does not claim production proof of every in-flight token invalidation timing detail/i);
assert.match(stage2b, /application account status[\s\S]+separate fail-closed authorization layer/i);
assert.match(stage2b, /Every application-client Firestore create\/update\/delete remains denied|every application-client Firestore create\/update\/delete remains denied/i);
assert.match(stage2b, /production Auth persistence choice/i);
assert.match(stage2b, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2b, /public profiles[\s\S]+global leaderboard\/rankings remain eliminated/i);
assert.match(stage2b, /registered devices\/private pairing[\s\S]+remain blocked/i);

assert.match(stage2a, /Stage 2A[\s\S]+PR #83/i);
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

assert.equal(pkg.version, "1.4.0", "Stage 2B emulator-only proof must not bump production application version.");
assert.match(index, /app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker, /RUNTIME_REVISION = "1\.4\.0-r1"/);
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|firestore/i, "Stage 2B must not connect Firebase/Admin in the production shell.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|firestore/i, "Stage 2B must not connect Firebase/Admin through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase\/auth|firestore/i, "Stage 2B must not cache Firebase/Admin runtime in the production Service Worker.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-admin"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.dependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.doesNotMatch(lock.slice(0, 1600), /"firebase-admin"|"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2B provider lifecycle, revocation and production-isolation contracts\n");
