const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseConfig = JSON.parse(read("firebase.json"));
const rules = read("firestore.rules");
const phase1f = read("CLOUD_SYNC_READINESS_PHASE_1F.md");
const phase1e = read("CLOUD_SYNC_READINESS_PHASE_1E.md");
const next = read("NEXT_TASK.md");
const workflow = read(".github/workflows/validate-static-app.yml");
const emulatorTest = read("tests/firebase/cloud-sync-phase1f-emulator.cjs");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");

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

assert.match(phase1f, /CURRENT BOUNDED CANDIDATE/i);
assert.match(phase1f, /demo-career-mode-showdown-phase1f/);
assert.match(phase1f, /deny application-client remote writes/i);
assert.match(phase1f, /Security Rule evaluating a direct shared-state write does not know which sibling `idempotency\/\{idempotencyKeyHash\}` path/i);
assert.match(phase1f, /getAfter\(\)/);
assert.match(phase1f, /does not authorize Cloud Functions, Admin SDK runtime, Blaze billing or server deployment/i);
assert.match(phase1f, /request\.auth\.uid[\s\S]+authenticated `accountId`/i);
assert.match(phase1f, /persistent offline cache remains disabled/i);
assert.match(phase1f, /original client request remains outside provider retry authority/i);
assert.match(phase1f, /Candidate A non-mutating export[\s\S]+Candidate B read-only analysis[\s\S]+Candidate C/i);
assert.match(phase1f, /Save Library, Legacy and preferences/i);
assert.match(phase1f, /raw invite capability[\s\S]+never duplicated/i);
assert.match(phase1f, /raw idempotency key[\s\S]+never stored/i);
assert.match(phase1f, /production remains:[\s\S]+v1\.4\.0[\s\S]+1\.4\.0-r1/i);
assert.match(phase1f, /public\/global leaderboards or rankings/i);

assert.match(emulatorTest, /initializeTestEnvironment/);
assert.match(emulatorTest, /authenticatedContext\("acct_a"\)/);
assert.match(emulatorTest, /unauthenticatedContext\(\)/);
assert.match(emulatorTest, /withSecurityRulesDisabled/);
assert.match(emulatorTest, /runTransaction/);
assert.match(emulatorTest, /originalBaseRevision/);
assert.match(emulatorTest, /attempts >= 2/);
assert.match(emulatorTest, /idempotency-conflict/);
assert.match(emulatorTest, /tombstone-restore-required/);
assert.match(emulatorTest, /REQUIRED_ACCOUNT_NOT_ACTIVE/);
assert.match(emulatorTest, /RIVALRY_MUTATION_FROZEN/);
assert.match(emulatorTest, /Raw invite capability/);
assert.match(emulatorTest, /Raw idempotency key/);

assert.match(workflow, /actions\/setup-java@v5/);
assert.match(workflow, /java-version:\s*['"]21['"]/);
assert.match(workflow, /firebase@12\.17\.1/);
assert.match(workflow, /@firebase\/rules-unit-testing@5\.0\.1/);
assert.match(workflow, /firebase-tools@15\.27\.0/);
assert.match(workflow, /--no-save/);
assert.match(workflow, /--package-lock=false/);
assert.match(workflow, /emulators:exec[\s\S]+--project demo-career-mode-showdown-phase1f[\s\S]+--only auth,firestore/);
assert.match(workflow, /cloud-sync-phase1f-emulator\.cjs/);

assert.equal(pkg.version, "1.4.0", "Emulator-only Phase 1F proof must not bump production application version.");
assert.match(index, /app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker, /RUNTIME_REVISION = "1\.4\.0-r1"/);
assert.doesNotMatch(index, /firebase|firestore/i, "Phase 1F must not connect Firebase in the production shell.");
assert.doesNotMatch(optional, /firebase|firestore/i, "Phase 1F must not connect Firebase through optional production modules.");
assert.doesNotMatch(worker, /firebase|firestore/i, "Phase 1F must not cache Firebase runtime in the production Service Worker.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "@firebase/rules-unit-testing"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-tools"), false);
assert.doesNotMatch(lock.slice(0, 1200), /"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

assert.match(phase1e, /DONE \/ MERGED \/ PROTECTED/i);
assert.match(phase1e, /PR #80/);
assert.match(next, /Phase 1E[\s\S]+DONE \/ PR #80[\s\S]+Phase 1F[\s\S]+CURRENT BOUNDED CANDIDATE/i);
assert.match(next, /Authorized product candidate:\*\* none|Authorized product candidate:\s*none/i);
assert.match(next, /Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(next, /Cloud\/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i);

process.stdout.write("PASS Phase 1F Firebase emulator, deny-by-default Security Rules and provider-boundary contracts\n");
