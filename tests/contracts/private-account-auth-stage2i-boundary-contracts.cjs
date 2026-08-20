const assert=require("node:assert/strict");
const fs=require("node:fs");

const boundary=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2I.md","utf8");
const implementation=fs.readFileSync("js/trustedAppAttestationRequest.js","utf8");
const stage2h=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
const nextTask=fs.readFileSync("NEXT_TASK.md","utf8");
const preGatewayNextTask=fs.readFileSync("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md","utf8");
const archivedNextTask=fs.readFileSync("authority-history/NEXT_TASK_PRE_PR98_TRANSITION_FULL.md","utf8");
const projectState=fs.readFileSync("PROJECT_STATE.md","utf8");
const handoff=fs.readFileSync("00_CURRENT_HANDOFF.md","utf8");
const developerStart=fs.readFileSync("00_DEVELOPER_START_HERE.md","utf8");
const roadmap=fs.readFileSync("REMOTE_JOINING_EXECUTION_ROADMAP.md","utf8");
const postV1=fs.readFileSync("POST_V1_ROADMAP_EXECUTION.md","utf8");
const history=fs.readFileSync("WORK_ENVIRONMENT_HISTORY.md","utf8");
const status=JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json","utf8"));
const rules=fs.readFileSync("firestore.rules","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

function firstSection(text){return text.split(/\n---\n/)[0];}

// Preserve the exact historical Stage 2I publication proof.
const historicalBoundary=firstSection(boundary);
assert.match(historicalBoundary,/Stage 2I — Production App Attestation & Trusted Endpoint Abuse-Resistance Boundary/);
assert.match(historicalBoundary,/Status: DONE \/ MERGED \/ PROVEN \/ PRODUCTION DORMANT \/ NON-PROVISIONING \/ PRODUCTION FIREBASE DISCONNECTED/);
assert.match(historicalBoundary,/PR #95[\s\S]+9a553318791d40afa8c573acf4922ee710284ef2[\s\S]+264e53dd56e088262c2f17fc10e36617dfef6c5d/);
assert.match(historicalBoundary,/all 13 normal pull-request workflow families succeeded/i);
assert.match(historicalBoundary,/submitted reviews and inline review threads were both empty/i);
assert.match(historicalBoundary,/Do not repeat Stage 2I implementation/i);
assert.match(historicalBoundary,/exact decoded `app_id` \/ `sub` equality/i);
assert.match(historicalBoundary,/exactly two audience entries/i);
assert.match(historicalBoundary,/verifyIdToken\(idToken, true\)/);
assert.match(historicalBoundary,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(historicalBoundary,/`firebaseappcheck\.appCheckTokens\.verify`[\s\S]+not part of the Stage 2H four-permission role/i);
assert.match(historicalBoundary,/Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(historicalBoundary,/Production remains application\/package `1\.4\.0`[\s\S]+runtime `1\.4\.0-r1`/i);
assert.match(historicalBoundary,/Stage 3 Registered Devices \/ Private Pairing remains BLOCKED/i);
assert.match(historicalBoundary,/global leaderboards and public rankings remain eliminated/i);

assert.match(boundary,/reCAPTCHA Enterprise provider for the future production web app/i);
assert.match(boundary,/default risk threshold of `0\.5`/);
assert.match(boundary,/default token TTL of one hour/i);
assert.match(boundary,/`localhost` must not be added to the production key/i);
assert.match(boundary,/Debug App Check providers\/tokens belong only to explicit development, emulator or CI environments/i);
assert.match(boundary,/App Check is not authentication or application authorization/i);
assert.match(boundary,/`X-Firebase-AppCheck`/);
assert.match(boundary,/App Check token is transient/i);
assert.match(boundary,/does not make that beta feature a correctness dependency/i);
assert.match(boundary,/Cloud Run scaling is defense in depth, not rate authorization/i);
assert.match(boundary,/App Check does not repair the Phase 1D \/ Phase 1F shared-state idempotency-receipt schema finding/i);
assert.match(boundary,/Candidate A remains non-mutating export[\s\S]+Candidate B remains strictly read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);

// Preserve the dormant protected-request design. Current PR #115 connects only browser App + App Check, not this trusted endpoint.
assert.match(implementation,/stage:"2I"/);
assert.match(implementation,/verifyAppCheckToken\(appCheckToken\)/);
assert.match(implementation,/decoded\.aud\.length!==2/);
assert.match(implementation,/verifyTrustedRequestPrincipal[\s\S]+authorizeApplicationOperation[\s\S]+executeTrustedOperation/);
assert.match(implementation,/STAGE2I_TRANSIENT_CREDENTIAL_FORWARDING_FORBIDDEN/);
assert.match(implementation,/limitedUseTokenConsumptionRequired:false/);
assert.match(implementation,/browserFirestoreWrites:"deny-all"/);

assert.match(stage2h,/Stage 2H — Production Trusted Execution Runtime & Least-Privilege IAM Boundary/);
assert.match(stage2h,/DONE \/ MERGED \/ PROVEN/);
assert.match(stage2h,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(stage2h,/Every application-client Firestore create, update and delete remains denied/i);

// Current authority must now point to the real post-PR #114 production App Check runtime milestone, not a frozen post-Stage-2I checkpoint.
assert.match(nextTask,/CURRENT IMPLEMENTATION AUTHORITY — PRODUCTION APP CHECK RUNTIME INTEGRATION/i);
assert.match(nextTask,/Current branch: `agent\/production-app-check-runtime`/);
assert.match(nextTask,/Current pull request: #115/);
assert.match(nextTask,/Current environment: `we-2026-08-20-production-app-check-runtime`/);
assert.match(nextTask,/Starting independently verified live main: `7944b87a20cf793c659077d7518c4446f178e32c`/);
assert.match(nextTask,/Fresh WEC decision: `PREPARE_HANDOFF`/);
assert.match(nextTask,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(nextTask,/Every application-client Firestore create\/update\/delete remains deny-all/i);
assert.match(nextTask,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(nextTask,/Candidate A remains non-mutating export[\s\S]+Candidate B remains read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
assert.match(nextTask,/Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i);
assert.match(nextTask,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);
assert.match(nextTask,/Private Remote Joining remains PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(nextTask,/App Check enforcement remains OFF/i);
assert.match(nextTask,/PR #115 adds no IAM permission and no trusted mutation authority/i);

assert.match(projectState,/PR #115[\s\S]+production App Check runtime/i);
assert.match(projectState,/Stage 2 private account\/authentication\/authorization dormant boundaries[\s\S]+completed at their proven boundaries/i);
assert.match(projectState,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);
assert.match(projectState,/Private Remote Joining[\s\S]+DEPENDENCY-GATED/i);

// Historical authority remains immutable provenance and must not be mistaken for current implementation authority.
assert.match(preGatewayNextTask,/CURRENT SUCCESSOR AUTHORITY — POST-PR #99 REMOTE JOINING RESTART/);
assert.match(preGatewayNextTask,/agent\/post-pr99-remote-joining-restart/);
assert.match(preGatewayNextTask,/0f61225b267e8334467a6d868d36c7ce58dd54a0/);
assert.match(archivedNextTask,/CURRENT SUCCESSOR OVERRIDE — POST-PR #96 TRANSITION CHECKPOINT/);
assert.match(archivedNextTask,/e52968632d9938f17e7e1680c455437d23eb628b/);
assert.match(handoff,/Stage 2I remains DONE \/ MERGED \/ PROVEN/);
assert.match(developerStart,/Stage 2I[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(roadmap,/Stage 2I[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(postV1,/Stage 2I[\s\S]+DONE \/ MERGED \/ PROVEN/i);
assert.match(history,/Closure addendum — `we-2026-08-19-post-stage2i-closure-reconcile`/);
assert.match(history,/PR #96[\s\S]+3d2ebad38d85e07f774360fcb7d210b9dd096fa4[\s\S]+e52968632d9938f17e7e1680c455437d23eb628b/);

// Fresh WEC identity must be honest and independent of the historical Stage 2I environment.
assert.equal(status.environmentId,"we-2026-08-20-production-app-check-runtime");
assert.equal(status.lifecycle,"active");
assert.equal(status.repository.startingMainSha,"7944b87a20cf793c659077d7518c4446f178e32c");
assert.equal(status.signals.usageRemainingPercent,null);
assert.equal(status.signals.usageSource,"unavailable");
assert.match(status.continuity.currentTask,/App Check[\s\S]+runtime/i);
assert.match(status.continuity.lastSafeCheckpoint,/7944b87a20cf793c659077d7518c4446f178e32c/);
assert.match((status.continuity.knownHazards||[]).join("\n"),/Stage 2H least-privilege trusted-runtime IAM remains unactivated/i);

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
const dormantTrustedModules=/trustedAppAttestationRequest\.js|trustedSharedMutationGateway\.js|trustedAccountDeletionExecution\.js|trustedConnectedDataAccountExport\.js|firebase\/app-check|ReCaptchaEnterpriseProvider|X-Firebase-AppCheck/i;
assert.doesNotMatch(index,dormantTrustedModules);
assert.doesNotMatch(optional,dormantTrustedModules);
assert.doesNotMatch(worker,dormantTrustedModules);
assert.equal(pkg.version,"1.4.0");
assert.equal(pkg.dependencies,undefined,"Dormant trusted Stage 2 proofs must not add production package dependencies.");
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
assert.match(indexRevision,/^1\.4\.0-r[1-9]\d*$/,"Historical Stage 2I proof must not freeze later legitimate v1.4.0 runtime revisions.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");

process.stdout.write("PASS Stage 2I locks remain historically protected while current authority advances to the bounded production App Check runtime milestone.\n");