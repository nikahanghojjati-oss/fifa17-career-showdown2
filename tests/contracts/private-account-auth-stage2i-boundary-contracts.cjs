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
const production=JSON.parse(fs.readFileSync("firebase.production.environment.json","utf8"));
const readiness=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));
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

// Preserve the dormant trusted-request design. The later production browser integration connects Firebase App + App Check only; it does not activate this trusted endpoint or broaden IAM.
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

// Current authority is the post-PR121 production-proof/RJR reconciliation. Historical PR #115/#116 wording may remain only as explicitly marked provenance.
assert.match(nextTask,/CURRENT IMPLEMENTATION AUTHORITY — POST-PR121 PRODUCTION AUTHORITY \/ RJR RECONCILIATION/i);
assert.match(nextTask,/Current branch: `agent\/post-pr121-production-rjr-reconciliation`/);
assert.match(nextTask,/Current environment: `we-2026-08-20-post-pr121-production-rjr-reconciliation`/);
assert.match(nextTask,/Starting independently verified live main: `ab48ecec7f9560378f79eee30150d39a90834c35`/);
assert.match(nextTask,/Fresh Work Environment Continuity \(WEC\) decision: `CONTINUE`/);
assert.match(nextTask,/production Firebase App Check runtime\/deployment chain through PRs #115, #116, #117, #118 and #119 is DONE \/ MERGED \/ PROVEN/i);
assert.match(nextTask,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(nextTask,/application-client Firestore create\/update\/delete remains deny-all/i);
assert.match(nextTask,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(nextTask,/Candidate A remains non-mutating export[\s\S]+Candidate B remains read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
assert.match(nextTask,/Public community features and global leaderboard\/rankings are \*\*ELIMINATED\*\*/i);
assert.match(nextTask,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);
assert.match(nextTask,/Private Remote Joining remains PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(nextTask,/App Check enforcement(?: remains)?:? OFF/i);
assert.match(nextTask,/Stage 2H[\s\S]+firebaseauth\.users\.get[\s\S]+datastore\.entities\.create[\s\S]+Do not broaden/i);
assert.match(nextTask,/Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PR #115 PRODUCTION APP CHECK DEPLOYMENT PROOF VIA PR #116/i);

assert.match(projectState,/PR #115 `Connect production App Check runtime safely` is DONE \/ MERGED AS SOURCE[\s\S]+Firebase App \+ App Check/i);
assert.match(projectState,/PR #116 `Add controlled GitHub Pages App Check deployment`[\s\S]+current direct Remote Joining prerequisite/i);
assert.match(projectState,/Stage 2 private account\/authentication\/authorization dormant boundaries[\s\S]+completed at their proven boundaries/i);
assert.match(projectState,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);
assert.match(projectState,/Private Remote Joining[\s\S]+DEPENDENCY-GATED/i);
assert.match(projectState,/Current production Installable Offline App runtime: `1\.4\.0-r2`/i);
assert.match(projectState,/Known-good fallback\/recovery runtime: `1\.4\.0-r1`/i);

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

// The fresh post-PR121 successor owns its own WEC. It must not inherit the earlier PR #115/PR #116 transition decision.
assert.equal(status.environmentId,"we-2026-08-20-post-pr121-production-rjr-reconciliation");
assert.equal(status.repository.startingMainSha,"ab48ecec7f9560378f79eee30150d39a90834c35");
assert.ok(["active","transition-prepared"].includes(status.lifecycle));
assert.equal(status.signals.usageRemainingPercent,null);
assert.equal(status.signals.usageSource,"unavailable");
assert.match(status.continuity.currentTask,/post-PR121[\s\S]+production-authority[\s\S]+RJR/i);
assert.match(status.continuity.currentTask,/1\.4\.0-r2[\s\S]+App Check/i);
assert.match(status.continuity.lastSafeCheckpoint,/ab48ecec7f9560378f79eee30150d39a90834c35/);
const currentLocks=[...(status.continuity.knownHazards||[]),...(status.continuity.evidenceNotes||[])].join("\n");
assert.match(currentLocks,/Stage 2H IAM remains exactly[\s\S]+firebaseauth\.users\.get[\s\S]+datastore\.entities\.create/i);
assert.match(currentLocks,/App Check enforcement remains OFF/i);
if(status.lifecycle==="transition-prepared"){
  assert.equal(status.signals.handoffCompleteness,100);
  assert.equal(status.signals.unrecordedDecisions,0);
  assert.equal(status.signals.atomicOperation,false);
  assert.match(status.continuity.nextSafeAction,/exact-head|final sealed|merge|publication|production|successor/i);
}

// Permanent production evidence may prove browser App Check traffic without activating the Stage 2I trusted endpoint.
assert.equal(production.productionRuntime.runtimeRevision,"1.4.0-r2");
assert.equal(production.productionRuntime.status,"production-proven");
assert.equal(production.activation.appCheckRuntimeBootstrapConnected,true);
assert.equal(production.activation.appCheckLegitimateProductionTrafficProven,true);
assert.equal(production.activation.appCheckEnforcement,false);
assert.equal(production.activation.trustedRuntimeIam,"not-activated-yet");
assert.deepEqual(production.securityLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,61);

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

process.stdout.write("PASS Stage 2I historical locks remain protected while current authority reconciles the proven 1.4.0-r2 production App Check boundary; trusted runtime/IAM remains unactivated and Stage 3 stays blocked.\n");
