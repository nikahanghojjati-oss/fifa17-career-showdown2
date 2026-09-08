const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseConfig = JSON.parse(read("firebase.json"));
const rules = read("firestore.rules");
const workflow = read(".github/workflows/validate-static-app.yml");
const emulatorTest = read("tests/firebase/cloud-sync-phase1f-emulator.cjs");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));

// Emulator isolation and deny-by-default Rules are active safety properties.
assert.equal(firebaseRc.projects.default, "demo-career-mode-showdown-phase1f");
assert.match(firebaseRc.projects.default, /^demo-/);
assert.equal(firebaseConfig.firestore.rules, "firestore.rules");
assert.equal(firebaseConfig.emulators.firestore.host, "127.0.0.1");
assert.equal(firebaseConfig.emulators.firestore.port, 8080);
assert.equal(firebaseConfig.emulators.ui.enabled, false);
assert.equal(firebaseConfig.emulators.singleProjectMode, true);

assert.match(rules, /rules_version\s*=\s*['"]2['"]/);
assert.match(rules, /request\.auth\.uid/);
assert.match(rules, /allow get:/);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);
assert.match(rules, /match \/\{document=\*\*\}[\s\S]+allow read, write:\s*if false/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);
assert.doesNotMatch(rules, /allow\s+list[^\n]*if\s+true/i);
assert.match(rules, /resource\.data\.data\.expiresAt\s*>\s*request\.time/);
assert.match(rules, /resource\.data\.data\.actorAccountId\s*==\s*request\.auth\.uid/);

// The emulator proof must continue to exercise auth, transactions, retries,
// tombstones, idempotency and two-owner governance rather than merely exist.
for (const pattern of [
  /initializeTestEnvironment/,
  /authenticatedContext\("acct_a"\)/,
  /unauthenticatedContext\(\)/,
  /withSecurityRulesDisabled/,
  /runTransaction/,
  /originalBaseRevision/,
  /attempts >= 2/,
  /idempotency-conflict/,
  /tombstone-restore-required/,
  /REQUIRED_ACCOUNT_NOT_ACTIVE/,
  /RIVALRY_MUTATION_FROZEN/,
  /Raw invite capability/,
  /Raw idempotency key/
]) assert.match(emulatorTest, pattern);

// Static CI must keep the pinned, isolated emulator execution path.
assert.match(workflow, /actions\/setup-java@v5/);
assert.match(workflow, /java-version:\s*['"]21['"]/);
assert.match(workflow, /firebase@12\.17\.1/);
assert.match(workflow, /@firebase\/rules-unit-testing@5\.0\.1/);
assert.match(workflow, /firebase-tools@15\.27\.0/);
assert.match(workflow, /--no-save/);
assert.match(workflow, /--package-lock=false/);
assert.match(workflow, /emulators:exec[\s\S]+--project demo-career-mode-showdown-phase1f[\s\S]+--only auth,firestore/);
assert.match(workflow, /cloud-sync-phase1f-emulator\.cjs/);

// Historical emulator tooling must not leak into the shipped browser shell.
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version);
assert.equal(workerRevision,indexRevision);
assert.doesNotMatch(index, /firebase|firestore/i, "The Phase 1F emulator boundary must not itself connect Firebase directly in the production shell.");
assert.doesNotMatch(optional, /firebase|firestore/i, "The Phase 1F emulator boundary must not connect Firebase through optional production modules.");
assert.doesNotMatch(worker, /cloud-sync-phase1f|firebase-firestore|firebase-auth|firestore/i, "Emulator/Firestore test runtime must remain absent from the production Service Worker.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "@firebase/rules-unit-testing"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-tools"), false);
assert.doesNotMatch(lock.slice(0, 1200), /"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

// Current permanent control-plane locks remain blocking because changing them
// would alter security, cost, persistence or authentication behavior.
assert.equal(bootstrap.liveRuntime?.appCheckEnforcement,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.firebasePlanMustRemain,"Spark");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudBillingAccountMayBeLinked,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.blazeMayBeEnabled,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudRunAllowed,false);
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudFunctionsAllowed,false);
assert.equal(bootstrap.liveRuntime?.firestorePersistence,"memory-only");
assert.equal(bootstrap.liveRuntime?.googleAuthPersistence,"browserSessionPersistence-popup-only-no-extra-scopes");

process.stdout.write("PASS active Phase 1F safety boundary: isolated emulator, deny-by-default Rules, transactional/adversarial proof, shipped-runtime separation, Spark zero-billing and current auth/persistence locks remain protected without historical PR or NEXT_TASK wording requirements.\n");