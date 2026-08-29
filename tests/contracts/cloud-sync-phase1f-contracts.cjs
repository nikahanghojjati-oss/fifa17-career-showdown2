const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const firebaseRc = JSON.parse(read(".firebaserc"));
const firebaseConfig = JSON.parse(read("firebase.json"));
const rules = read("firestore.rules");
const phase1f = read("CLOUD_SYNC_READINESS_PHASE_1F.md");
const phase1e = read("CLOUD_SYNC_READINESS_PHASE_1E.md");
const next = read("NEXT_TASK.md");
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const workflow = read(".github/workflows/validate-static-app.yml");
const emulatorTest = read("tests/firebase/cloud-sync-phase1f-emulator.cjs");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");
const r5Production = bootstrap.runtime?.productionRuntimeRevision === "1.8.1-r5" && !bootstrap.runtime?.candidateRuntimeRevision;

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

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while emulator-only historical Phase 1F stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /firebase|firestore/i, "Phase 1F must not itself connect Firebase directly in the production shell.");
assert.doesNotMatch(optional, /firebase|firestore/i, "Phase 1F must not connect Firebase through optional production modules.");
assert.doesNotMatch(worker, /cloud-sync-phase1f|firebase-firestore|firebase-auth|firestore/i, "Phase 1F emulator/Firestore runtime must remain absent from the production Service Worker even when a later reviewed App Check runtime is shell-cached.");
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "@firebase/rules-unit-testing"), false);
assert.equal(Object.prototype.hasOwnProperty.call(pkg.devDependencies || {}, "firebase-tools"), false);
assert.doesNotMatch(lock.slice(0, 1200), /"firebase"|"@firebase\/rules-unit-testing"|"firebase-tools"/);

assert.match(phase1e, /DONE \/ MERGED \/ PROTECTED/i);
assert.match(phase1e, /PR #80/);

// Phase 1F and PR #125 are immutable provenance. Current execution authority has advanced
// through production-proven r5, consumed rollback/restoration, provider-proven strengthened Rules and PR #171 / RJR86.
assert.match(next, /CURRENT OVERRIDE[\s\S]+PR #171[\s\S]+PROVIDER RULES PROVEN[\s\S]+RJR86[\s\S]+PROVIDER ABUSE ACCEPTANCE/i,"Current NEXT_TASK must identify the actual PR #171 provider-proven Rules / RJR86 / provider-abuse acceptance authority.");
assert.equal(r5Production,true,"Current transition authority must remain on restored production r5 with no phantom candidate runtime.");
assert.match(next, /Status:[\s\S]+production remains `v1\.8\.1 \/ 1\.8\.1-r5`[\s\S]+DEPLOYED \/ PRODUCTION-PROVEN/i,"Current NEXT_TASK must expose restored r5 production truth.");
assert.match(next, /Production rollback proof:[\s\S]+PRODUCTION_PAGES_ROLLBACK_PROOF_2026-08-28\.md[\s\S]+33190961085[\s\S]+SUCCESS \/ CONSUMED/i,"Current NEXT_TASK must retain exact consumed rollback proof provenance.");
assert.match(next, /Strengthened Rules provider proof:[\s\S]+PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29\.md[\s\S]+Published production Rules source:[\s\S]+firestore\.spark\.rules/i,"Current NEXT_TASK must retain provider-proven strengthened Rules provenance.");
assert.match(next, /IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+finish PR #171 only[\s\S]+all 14 permanent workflow families[\s\S]+merge\/deploy under standing authorization/i,"Current NEXT_TASK must route the closing environment through PR #171 publication only.");
assert.match(next, /App Check enforcement remains OFF/i,"Current NEXT_TASK must preserve the App Check enforcement-off lock after the historical Phase 1F boundary.");
assert.match(next, /Firebase remains Spark \/ zero billing/i,"Current NEXT_TASK must preserve the Spark zero-billing lock after the historical Phase 1F boundary.");
assert.match(next, /Firestore remains memory-only/i,"Current NEXT_TASK must preserve the memory-only Firestore lock after the historical Phase 1F boundary.");
assert.match(next, /consumed owner\/device\/destructive\/replay\/adverse-provider\/token-lifecycle\/structural-abuse\/sustained-rate-limit\/production-rollback proof/i,"Current NEXT_TASK must preserve completed remote proof as consumed rather than revive historical Phase 1F work.");
assert.match(next, /Production-provider publication[\s\S]+firestore\.spark\.rules[\s\S]+provider-verified/i,"Current NEXT_TASK must record the direct provider-publication evidence boundary.");
assert.match(next, /STAGE 5 REMAINS LOCKED[\s\S]+provider-abuse result/i,"Current NEXT_TASK must keep Stage 5 locked until the bounded provider-abuse result is assessed.");
assert.match(preR3Next, /CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i,"Lossless pre-r3 authority must preserve the completed PR #125 Connected Account milestone.");
assert.match(preR3Next, /Historical gateway heading retained only as provenance: CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY/i,"Lossless pre-r3 authority must preserve the trusted gateway heading as provenance.");
assert.match(historicalNext, /Phase 1E[\s\S]+DONE \/ PR #80[\s\S]+Phase 1F[\s\S]+CURRENT BOUNDED CANDIDATE/i,"Exact archived predecessor authority must retain the historical Phase 1E → Phase 1F implementation transition.");
assert.match(preR3Next, /Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Lossless pre-r3 authority must preserve the historical bounded v1.5.0 / 1.5.0-r1 candidate.");
assert.match(preR3Next, /Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Lossless pre-r3 authority must preserve the historical Phase 1F provider-runtime prohibition.");
assert.match(historicalNext, /Cloud\/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Archived Phase 1F-era authority must retain the exact production-runtime prohibition that applied during that prerequisite.");

process.stdout.write("PASS Phase 1F Firebase emulator, deny-by-default Security Rules and provider-boundary contracts; immutable archives preserve historical Phase 1F/PR125 provenance while current PR #171 provider-proven Rules / RJR86 / provider-abuse acceptance authority remains explicit\n");