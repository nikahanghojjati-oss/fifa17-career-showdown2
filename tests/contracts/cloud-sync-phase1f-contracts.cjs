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
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const workflow = read(".github/workflows/validate-static-app.yml");
const emulatorTest = read("tests/firebase/cloud-sync-phase1f-emulator.cjs");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");
const currentProduction = bootstrap.runtime?.productionRuntimeRevision === "1.9.1-r3"
  && bootstrap.latestRuntimeMerge?.pullRequest === 203
  && bootstrap.latestRuntimeMerge?.runtimeRevision === "1.9.1-r3"
  && bootstrap.lastProductionProvenRuntime?.pullRequest === 203
  && bootstrap.lastProductionProvenRuntime?.runtimeRevision === "1.9.1-r3";

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

// Phase 1F and PR #125 remain immutable historical architecture provenance. Live runtime authority
// is PR #203 / v1.9.1-r3; PR #194 / r2 is the whole-shell rollback and PR #187 / r5 remains consumed historical provenance.
assert.equal(currentProduction,true,"Production runtime authority must identify PR #203 / v1.9.1-r3 while preserving historical PR194/r2 rollback and PR187/r5 provenance.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.pullRequest,187,"Historical PR187 capability provenance must remain explicit.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.runtimeRevision,"1.9.0-r5","Historical PR187 runtime provenance must remain 1.9.0-r5.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509","Historical PR187 merge provenance must remain immutable.");
assert.equal(bootstrap.previousProductionProvenRuntime?.runtimeRevision,"1.9.1-r2","Current rollback whole-shell authority must remain the prior production-proven r2 shell.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,100,"Current bootstrap must expose evidence-accepted fixed RJR100 while publication work itself remains uncredited.");
assert.equal(bootstrap.remoteJoiningReadiness?.remaining,0);
assert.equal(readiness.currentScore,100,"Live RJR authority must include the accepted physical two-device/two-network and final stable-release evidence without crediting publication mechanics.");
const physicalAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-physical-two-device-two-network-acceptance");
const stableReleaseAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-final-stable-release-acceptance");
assert.equal(physicalAcceptance?.score,99);assert.equal(physicalAcceptance?.delta,8);
assert.equal(stableReleaseAcceptance?.score,100);assert.equal(stableReleaseAcceptance?.delta,1);
assert.match(next, /100\/100/i,"Current NEXT_TASK must expose evidence-accepted RJR100 rather than revive a consumed Phase 1F, Stage5G or physical-acceptance lane.");
assert.match(next, /PR #198/i,"Current NEXT_TASK must preserve the PR198 publication checkpoint.");
assert.match(next, /physical proof used a Chromebook[\s\S]+iPhone|Chromebook[\s\S]+cellular/i,"Current NEXT_TASK must retain the class of genuine two-device/two-network evidence already accepted.");
assert.equal(bootstrap.runtime?.appCheckEnforcement,false,"Current authority must preserve the App Check enforcement-off lock after the historical Phase 1F boundary.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.firebasePlanMustRemain,"Spark","Current authority must preserve the Spark zero-billing lock after the historical Phase 1F boundary.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudBillingAccountMayBeLinked,false,"Cloud Billing linkage must remain forbidden.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.blazeMayBeEnabled,false,"Blaze must remain forbidden.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudRunAllowed,false,"Cloud Run must remain forbidden under the zero-billing architecture.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudFunctionsAllowed,false,"Cloud Functions must remain forbidden under the zero-billing architecture.");
assert.equal(bootstrap.runtime?.firestorePersistence,"memory-only","Current authority must preserve memory-only Firestore after the historical Phase 1F boundary.");
assert.equal(bootstrap.runtime?.googleAuthPersistence,"browserSessionPersistence-popup-only-no-extra-scopes","Current authority must preserve popup-only browser-session Auth with no extra scopes.");
assert.match(next, /evidence\/continuity publication only[\s\S]+zero RJR credit|earns zero RJR credit/i,"Current NEXT_TASK must preserve evidence-only RJR movement and forbid process credit.");
assert.match(next, /Shared Showdown Journey Readiness|SSJR-1/i,"Current NEXT_TASK must route beyond completed RJR-1 only after clean publication and handoff.");

assert.match(preR3Next, /CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i,"Lossless pre-r3 authority must preserve the completed PR #125 Connected Account milestone.");
assert.match(preR3Next, /Historical gateway heading retained only as provenance: CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY/i,"Lossless pre-r3 authority must preserve the trusted gateway heading as provenance.");
assert.match(historicalNext, /Phase 1E[\s\S]+DONE \/ PR #80[\s\S]+Phase 1F[\s\S]+CURRENT BOUNDED CANDIDATE/i,"Exact archived predecessor authority must retain the historical Phase 1E → Phase 1F implementation transition.");
assert.match(preR3Next, /Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Lossless pre-r3 authority must preserve the historical bounded v1.5.0 / 1.5.0-r1 candidate.");
assert.match(preR3Next, /Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Lossless pre-r3 authority must preserve the historical Phase 1F provider-runtime prohibition.");
assert.match(historicalNext, /Cloud\/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Archived Phase 1F-era authority must retain the exact production-runtime prohibition that applied during that prerequisite.");

process.stdout.write("PASS Phase 1F Firebase emulator, deny-by-default Security Rules and provider-boundary contracts; immutable archives preserve historical Phase 1F/PR125/PR187 provenance while live PR203/r3 production, r2 rollback, evidence-accepted RJR100 and PR198-to-SSJR authority remain explicit\n");