const assert=require("node:assert/strict");
const fs=require("node:fs");

const boundary=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2I.md","utf8");
const implementation=fs.readFileSync("js/trustedAppAttestationRequest.js","utf8");
const stage2h=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
const nextTask=fs.readFileSync("NEXT_TASK.md","utf8");
const preR3NextTask=fs.readFileSync("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const preGatewayNextTask=fs.readFileSync("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md","utf8");
const archivedNextTask=fs.readFileSync("authority-history/NEXT_TASK_PRE_PR98_TRANSITION_FULL.md","utf8");
const projectState=fs.readFileSync("PROJECT_STATE.md","utf8");
const preR3ProjectState=fs.readFileSync("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const handoff=fs.readFileSync("00_CURRENT_HANDOFF.md","utf8");
const historicalR5Handoff=fs.readFileSync("SUCCESSOR_HANDOFF_PR187_R5_OWNER_ACCEPTED_SLE_2026-09-03.md","utf8");
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
assert.match(historicalBoundary,/global leaderboards and public rankings remain eliminated/i);

for(const pattern of [
  /reCAPTCHA Enterprise provider for the future production web app/i,
  /default risk threshold of `0\.5`/,
  /default token TTL of one hour/i,
  /`localhost` must not be added to the production key/i,
  /Debug App Check providers\/tokens belong only to explicit development, emulator or CI environments/i,
  /App Check is not authentication or application authorization/i,
  /`X-Firebase-AppCheck`/,
  /App Check token is transient/i,
  /Cloud Run scaling is defense in depth, not rate authorization/i,
  /Candidate A remains non-mutating export[\s\S]+Candidate B remains strictly read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i
])assert.match(boundary,pattern);

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

assert.match(preGatewayNextTask,/CURRENT SUCCESSOR AUTHORITY — POST-PR #99 REMOTE JOINING RESTART/);
assert.match(preGatewayNextTask,/agent\/post-pr99-remote-joining-restart/);
assert.match(preGatewayNextTask,/0f61225b267e8334467a6d868d36c7ce58dd54a0/);
assert.match(archivedNextTask,/CURRENT SUCCESSOR OVERRIDE — POST-PR #96 TRANSITION CHECKPOINT/);
assert.match(archivedNextTask,/e52968632d9938f17e7e1680c455437d23eb628b/);
assert.match(history,/Closure addendum — `we-2026-08-19-post-stage2i-closure-reconcile`/);
assert.match(history,/PR #96[\s\S]+3d2ebad38d85e07f774360fcb7d210b9dd096fa4[\s\S]+e52968632d9938f17e7e1680c455437d23eb628b/);

for(const document of [preR3NextTask,preR3ProjectState,roadmap,postV1]){
  assert.match(document,/Stage 2I[\s\S]+DONE \/ MERGED \/ PROVEN|Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
}
assert.match(`${preR3NextTask}\n${preR3ProjectState}`,/App Check enforcement(?: remains)?:? OFF/i);
assert.match(`${preR3NextTask}\n${preR3ProjectState}`,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/i);

// Historical Stage 2I security/provenance stays immutable; live authority is production-proven PR194/r2 with evidence-accepted RJR100, published by PR198 before SSJR-1 begins.
assert.match(nextTask,/^# CURRENT TASK — PUBLISH ACCEPTED RJR100 THEN GENERATE SNS$/im,"Live NEXT_TASK must identify accepted RJR100 / PR198 publication authority.");
assert.match(nextTask,/100\/100[\s\S]+PR #198/i);
assert.match(nextTask,/App Check enforcement remains OFF/i);
assert.match(nextTask,/physical Chromebook[\s\S]+iPhone|Chromebook[\s\S]+cellular/i,"Live authority must retain the genuine physical evidence class already accepted.");
assert.match(nextTask,/Shared Showdown Journey Readiness|SSJR-1/i,"Live authority must route the successor to SSJR-1 instead of reviving Stage 2I-era work.");
assert.match(`${nextTask}\n${projectState}`,/Public community|public discovery|global leaderboard|global ranking|No public discovery/i);
assert.match(projectState,/RJR-1 COMPLETE 100\/100|RJR100/i,"Live PROJECT_STATE must identify completed RJR100 authority.");
assert.match(projectState,/v1\.9\.1[\s\S]+1\.9\.1-r2[\s\S]+PR #198/i,"Live PROJECT_STATE must preserve r2 runtime identity and PR198 publication authority.");
assert.match(projectState,/Installable Offline App[\s\S]+(?:local-first startup(?:\/| and )recovery baseline|v1\.3\.0 Recovery & Device Resilience baseline)/i,"Live PROJECT_STATE must preserve local-first recovery authority.");
assert.match(handoff,/RJR-1[^\n]{0,100}100\/100|RJR100/i,"Rolling handoff must expose current RJR100 authority.");
assert.match(handoff,/v1\.9\.1[\s\S]+1\.9\.1-r2[\s\S]+PR #198/i,"Rolling handoff must preserve r2 runtime identity and PR198 publication authority.");
assert.match(handoff,/Shared Showdown Journey Readiness|SSJR-1/i,"Rolling handoff must route successor work to SSJR-1.");
assert.match(historicalR5Handoff,/PR #187[\s\S]+89\/100/i,"Immutable PR187 handoff must preserve fixed RJR89 provenance.");
assert.match(historicalR5Handoff,/one[- ]paste[\s\S]+zero manual Connected Rivalry Verify\/Reattach|zero manual Connected Rivalry Verify\/Reattach[\s\S]+one[- ]paste/i,"Immutable PR187 handoff must preserve the capability that moved RJR88 to RJR89.");
assert.match(developerStart,/RJR-1[\s\S]+100\/100|RJR100/i,"Developer start must expose completed RJR100 authority.");
assert.match(developerStart,/Shared Showdown Journey Readiness|SSJR-1/i,"Developer start must route to SSJR-1 rather than consumed physical acceptance.");
assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.currentScore,100,"STAGE2I-BOUNDARY live readiness must expose fixed RJR100.");
const stage5eRjrEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
assert.equal(stage5eRjrEvidence?.score,88,"STAGE2I-BOUNDARY must preserve the evidence-only Stage 5E provider-live lifecycle transition to RJR88.");
assert.equal(stage5eRjrEvidence?.delta,1,"STAGE2I-BOUNDARY must preserve one bounded capability credit for the Stage 5E provider-live lifecycle.");
const physicalAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-physical-two-device-two-network-acceptance");
const stableReleaseAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-final-stable-release-acceptance");
assert.equal(physicalAcceptance?.score,99);assert.equal(physicalAcceptance?.delta,8);
assert.equal(stableReleaseAcceptance?.score,100);assert.equal(stableReleaseAcceptance?.delta,1);
assert.match(projectState,new RegExp("RJR-1[^\\n]{0,80}"+readiness.currentScore+"\\/100|RJR"+readiness.currentScore,"i"),"Live PROJECT_STATE must carry the current fixed-RJR authority.");

assert.match(status.environmentId,/^we-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/);
assert.match(status.repository.startingMainSha,/^[0-9a-f]{40}$/i);
assert.ok(["active","transition-prepared","closed"].includes(status.lifecycle));
const currentUsageRemaining=status.signals.usageRemainingPercent;
const currentUsageSource=status.signals.usageSource;
if(currentUsageRemaining===null){
  assert.equal(currentUsageSource,"unavailable");
}else{
  assert.ok(Number.isInteger(currentUsageRemaining)&&currentUsageRemaining>=0&&currentUsageRemaining<=100);
  assert.ok(["usage-dashboard","cli-status","user-reported"].includes(currentUsageSource));
}
assert.equal(typeof status.continuity.currentTask,"string");
assert.ok(status.continuity.currentTask.trim().length>0);
assert.equal(typeof status.continuity.nextSafeAction,"string");
assert.ok(status.continuity.nextSafeAction.trim().length>0);
const currentLocks=[...(status.continuity.knownHazards||[]),...(status.continuity.evidenceNotes||[])].join("\n");
assert.match(currentLocks,/App Check enforcement(?: remains)? OFF/i);
assert.match(currentLocks,/Spark|zero billing/i);
if(["transition-prepared","closed"].includes(status.lifecycle)){
  assert.equal(status.signals.handoffCompleteness,100);
  assert.equal(status.signals.unrecordedDecisions,0);
  assert.equal(status.signals.atomicOperation,false);
}

assert.equal(production.productionRuntime.runtimeRevision,"1.4.0-r2");
assert.equal(production.productionRuntime.status,"production-proven");
assert.equal(production.activation.appCheckLegitimateProductionTrafficProven,true);
assert.equal(production.activation.appCheckEnforcement,false);
assert.equal(production.activation.trustedRuntimeIam,"not-activated-yet");
assert.deepEqual(production.securityLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);
assert.ok(Number.isInteger(readiness.currentScore)&&readiness.currentScore>=61&&readiness.currentScore<=100);
assert.ok(readiness.evidenceHistory.some(event=>event.eventId==="production-app-check-runtime-proof"&&event.score===61),"Historical 61-point App Check production proof must remain preserved while later evidence may increase RJR.");

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
const dormantTrustedModules=/trustedAppAttestationRequest\.js|trustedSharedMutationGateway\.js|trustedAccountDeletionExecution\.js|trustedConnectedDataAccountExport\.js|firebase\/app-check|ReCaptchaEnterpriseProvider|X-Firebase-AppCheck/i;
assert.doesNotMatch(index,dormantTrustedModules);
assert.doesNotMatch(optional,dormantTrustedModules);
assert.doesNotMatch(worker,dormantTrustedModules);
assert.equal(pkg.dependencies,undefined,"Dormant trusted Stage 2 proofs must not add production package dependencies.");
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2I proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");

process.stdout.write("PASS Stage 2I historical security plus PR187/RJR89 provenance locks remain protected while current PR194/r2 production, evidence-accepted RJR100 and PR198-to-SSJR successor authority is source-driven.\n");