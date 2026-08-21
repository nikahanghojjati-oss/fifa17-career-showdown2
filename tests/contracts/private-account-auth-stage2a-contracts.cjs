const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseConfig = JSON.parse(read("firebase.json"));
const rules = read("firestore.rules");
const stage2a = read("PRIVATE_ACCOUNT_AUTH_STAGE_2A.md");
const emulatorTest = read("tests/firebase/private-account-auth-stage2a-emulator.cjs");
const workflow = read(".github/workflows/validate-static-app.yml");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

assert.equal(firebaseRc.projects.default, "demo-career-mode-showdown-phase1f");
assert.match(firebaseRc.projects.default, /^demo-/);
assert.equal(firebaseConfig.firestore.rules, "firestore.rules");
assert.equal(firebaseConfig.emulators.auth.host, "127.0.0.1");
assert.equal(firebaseConfig.emulators.auth.port, 9099);
assert.equal(firebaseConfig.emulators.firestore.host, "127.0.0.1");
assert.equal(firebaseConfig.emulators.firestore.port, 8080);
assert.equal(firebaseConfig.emulators.ui.enabled, false);
assert.equal(firebaseConfig.emulators.singleProjectMode, true);

assert.match(emulatorTest, /PROJECT_ID\s*=\s*"demo-career-mode-showdown-phase1f"/);
assert.match(emulatorTest, /AUTH_EMULATOR_URL\s*=\s*"http:\/\/127\.0\.0\.1:9099"/);
assert.match(emulatorTest, /FIRESTORE_EMULATOR_HOST\s*=\s*"127\.0\.0\.1"/);
assert.match(emulatorTest, /FIRESTORE_EMULATOR_PORT\s*=\s*8080/);
assert.match(emulatorTest, /initializeAuth\(app,\s*\{\s*persistence:\s*inMemoryPersistence\s*\}\)/);
assert.match(emulatorTest, /connectAuthEmulator\(auth,\s*AUTH_EMULATOR_URL/);
assert.match(emulatorTest, /connectFirestoreEmulator\(db,\s*FIRESTORE_EMULATOR_HOST,\s*FIRESTORE_EMULATOR_PORT\)/);
assert.match(emulatorTest, /createUserWithEmailAndPassword/);
assert.match(emulatorTest, /assert\.notEqual\(accountIdA,\s*accountIdB/);
assert.match(emulatorTest, /clientA\.auth\.currentUser\.uid,\s*accountIdA/);
assert.match(emulatorTest, /getDocFromServer\(doc\(clientA\.db,\s*"accounts",\s*accountIdA\)\)/);
assert.match(emulatorTest, /getDocFromServer\(doc\(clientA\.db,\s*"accounts",\s*accountIdB\)\)/);
assert.match(emulatorTest, /anonymousClient\.db/);
assert.match(emulatorTest, /clientSuppliedIdentity/);
assert.match(emulatorTest, /setDoc[\s\S]+assertFails/);
assert.match(emulatorTest, /assertFails\(updateDoc/);
assert.match(emulatorTest, /assertFails\(deleteDoc/);
assert.match(emulatorTest, /accountEnvelope\(accountIdB,\s*"disabled"\)/);
assert.match(emulatorTest, /signOut\(clientA\.auth\)/);
assert.match(emulatorTest, /Failed sign-in must not fabricate authenticated application state/);
assert.match(emulatorTest, /same synthetic Auth account must retain its stable Firebase uid/i);
assert.match(emulatorTest, /deleteUser\(clientA\.auth\.currentUser\)/);
assert.match(emulatorTest, /crypto\.randomBytes/);
assert.doesNotMatch(emulatorTest, /getIdToken|getIdTokenResult|refreshToken/);
assert.doesNotMatch(emulatorTest, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(emulatorTest, /console\.(?:log|info|debug)|URLSearchParams/);

assert.match(rules, /request\.auth\.uid/);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);
assert.match(rules, /match \/\{document=\*\*\}[\s\S]+allow read, write:\s*if false/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);

assert.match(workflow, /firebase@12\.17\.1/);
assert.match(workflow, /@firebase\/rules-unit-testing@5\.0\.1/);
assert.match(workflow, /firebase-tools@15\.27\.0/);
assert.match(workflow, /--no-save/);
assert.match(workflow, /--package-lock=false/);
assert.match(workflow, /emulators:exec[\s\S]+--project demo-career-mode-showdown-phase1f[\s\S]+--only auth,firestore/);
assert.match(workflow, /cloud-sync-phase1f-emulator\.cjs/);
assert.match(workflow, /private-account-auth-stage2a-emulator\.cjs/);

assert.match(stage2a, /Firebase Auth `uid`[\s\S]+`accountId`/i);
assert.match(stage2a, /in-memory/i);
assert.match(stage2a, /wrong-account/i);
assert.match(stage2a, /Signing out removes authenticated Firestore access/i);
assert.match(stage2a, /all application-client Firestore writes remain denied|Every application-client Firestore create, update and delete remains denied/i);
assert.match(stage2a, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2a, /public discovery[\s\S]+global leaderboard\/rankings remain eliminated/i);

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2A emulator proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|firestore/i, "Stage 2A must not itself connect Firebase Auth/Admin/Firestore directly in the production shell; later reviewed connected-account runtime remains lazy behind app.js.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|firestore/i, "Stage 2A must not connect Firebase Auth/Admin/Firestore through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase-auth|firebase\/auth|firestore|private-account-auth-stage2a/i, "Stage 2A Auth/emulator runtime must remain absent from the production Service Worker even when later reviewed Firebase runtime assets are shell-cached indirectly.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "@firebase/rules-unit-testing"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-tools"), false);
assert.doesNotMatch(lock.slice(0, 1200), /"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

process.stdout.write("PASS Private Account/Auth Stage 2A real Auth Emulator identity and production-isolation contracts; historical emulator proof remains version-neutral while current release identity stays coherent\n");