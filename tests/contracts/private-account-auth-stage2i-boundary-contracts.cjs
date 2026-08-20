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

function currentOverride(text){
  return text.split(/\n---\n/)[0];
}

const currentBoundary=currentOverride(boundary);
assert.match(currentBoundary,/Stage 2I — Production App Attestation & Trusted Endpoint Abuse-Resistance Boundary/);
assert.match(currentBoundary,/Status: DONE \/ MERGED \/ PROVEN \/ PRODUCTION DORMANT \/ NON-PROVISIONING \/ PRODUCTION FIREBASE DISCONNECTED/);
assert.match(currentBoundary,/PR #95[\s\S]+9a553318791d40afa8c573acf4922ee710284ef2[\s\S]+264e53dd56e088262c2f17fc10e36617dfef6c5d/);
assert.match(currentBoundary,/all 13 normal pull-request workflow families succeeded/i);
assert.match(currentBoundary,/submitted reviews and inline review threads were both empty/i);
assert.match(currentBoundary,/Do not repeat Stage 2I implementation/i);
assert.match(currentBoundary,/`js\/trustedAppAttestationRequest\.js`/);
assert.match(currentBoundary,/`tests\/contracts\/private-account-auth-stage2i-contracts\.cjs`/);
assert.match(currentBoundary,/exact decoded `app_id` \/ `sub` equality/i);
assert.match(currentBoundary,/exactly two audience entries/i);
assert.match(currentBoundary,/verifyIdToken\(idToken, true\)/);
assert.match(currentBoundary,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(currentBoundary,/`firebaseappcheck\.appCheckTokens\.verify`[\s\S]+not part of the Stage 2H four-permission role/i);
assert.match(currentBoundary,/Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(currentBoundary,/Production remains application\/package `1\.4\.0`[\s\S]+runtime `1\.4\.0-r1`/i);
assert.match(currentBoundary,/This closure selects no new Stage 2 implementation prerequisite/i);
assert.match(currentBoundary,/Stage 3 Registered Devices \/ Private Pairing remains BLOCKED/i);
assert.match(currentBoundary,/global leaderboards and public rankings remain eliminated/i);

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
assert.match(boundary,/Conditions 1 through 15 are the implementation target[\s\S]+Conditions 16 and 17 remain publication gates/i);

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

// Stage 2I is historical proof. It must protect the trust locks without freezing whichever later Stage 2 prerequisite is CURRENT.
const currentNextTask=currentOverride(nextTask);
assert.match(currentNextTask,/CURRENT IMPLEMENTATION AUTHORITY —/);
assert.match(currentNextTask,/Status: CURRENT IMPLEMENTATION PREREQUISITE[\s\S]+NON-PROVISIONING \/ PRODUCTION FIREBASE DISCONNECTED \/ REMOTE JOINING PRIORITY ACTIVE/);
assert.match(currentNextTask,/Current branch: `agent\//);
assert.match(currentNextTask,/Current environment: `we-/);
assert.match(currentNextTask,/Starting independently verified live main: `[0-9a-f]{40}`/i);
assert.match(currentNextTask,/PR #105[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(currentNextTask,/PR #106[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(currentNextTask,/PR #107[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(currentNextTask,/Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/);
assert.match(currentNextTask,/intentionally has no synthetic `Stage 2J` label/i);
assert.match(currentNextTask,/Fresh (?:startup )?WEC decision: `CONTINUE`/);
assert.match(currentNextTask,/Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(currentNextTask,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(currentNextTask,/Candidate A remains non-mutating export[\s\S]+Candidate B remains read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
assert.match(currentNextTask,/global leaderboards and public rankings remain eliminated/i);
assert.match(currentNextTask,/Stage 3 Registered Devices \/ Private Pairing remains BLOCKED/i);
assert.match(currentNextTask,/Private Remote Joining remains PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(nextTask,/RETAINED HISTORICAL AUTHORITY — TRUSTED ACCOUNT DELETION EXECUTION/i);
assert.match(nextTask,/PRIVATE_ACCOUNT_AUTH_TRUSTED_ACCOUNT_DELETION_EXECUTION\.md/);
assert.match(nextTask,/js\/trustedAccountDeletionExecution\.js/);

const environmentMatch=currentNextTask.match(/Current environment: `([^`]+)`/);
const mainMatch=currentNextTask.match(/Starting independently verified live main: `([0-9a-f]{40})`/i);
assert.ok(environmentMatch,"NEXT_TASK.md must expose the most recently published WEC environment ID.");
assert.ok(mainMatch,"NEXT_TASK.md must expose the most recently published starting live-main SHA.");
if(status.environmentId!==environmentMatch[1] || status.repository.startingMainSha!==mainMatch[1]){
  assert.ok(["active","transition-prepared"].includes(status.lifecycle),"A new successor may move beyond historical Stage 2I/NEXT_TASK publication authority only with an active fresh WEC or a legitimately transition-prepared completed handoff.");
  assert.match(status.continuity.currentTask,/production[\s\S]{0,120}(Firebase|Firestore)|Firestore Security Rules/i,"A fresh successor must name the concrete production Firebase/Firestore provider-activation lane rather than freeze the predecessor task.");
  assert.ok(status.continuity.lastSafeCheckpoint.includes(status.repository.startingMainSha),"A fresh successor must preserve its independently verified predecessor publication boundary from repository.startingMainSha.");
  const inheritedDecisionRecord=[...(status.continuity.evidenceNotes||[]),...(status.continuity.knownHazards||[])].join("\n");
  assert.match(inheritedDecisionRecord,/inherited predecessor[\s\S]{0,160}HANDOFF_AT_CHECKPOINT/i,"A fresh successor must preserve the predecessor transition decision only as inherited history.");
  if(status.lifecycle==="transition-prepared"){
    assert.equal(status.signals.handoffCompleteness,100,"A divergent successor may transition only after the successor handoff package is complete.");
  }
}else{
  assert.equal(status.environmentId,environmentMatch[1],"Published authority and WEC identity must agree when no active successor divergence exists.");
  assert.equal(status.repository.startingMainSha,mainMatch[1],"Published authority and WEC starting main must agree when no active successor divergence exists.");
}
assert.equal(status.signals.usageRemainingPercent,null);
assert.equal(status.signals.usageSource,"unavailable");
assert.doesNotMatch(status.continuity.currentTask,/Publish only PR #100/i);

assert.match(preGatewayNextTask,/CURRENT SUCCESSOR AUTHORITY — POST-PR #99 REMOTE JOINING RESTART/);
assert.match(preGatewayNextTask,/agent\/post-pr99-remote-joining-restart/);
assert.match(preGatewayNextTask,/we-2026-08-19-post-pr99-remote-joining-restart/);
assert.match(preGatewayNextTask,/0f61225b267e8334467a6d868d36c7ce58dd54a0/);

assert.match(archivedNextTask,/CURRENT SUCCESSOR OVERRIDE — POST-PR #96 TRANSITION CHECKPOINT/);
assert.match(archivedNextTask,/we-2026-08-19-post-pr96-stage2-selection/);
assert.match(archivedNextTask,/e52968632d9938f17e7e1680c455437d23eb628b/);

for(const [name,text] of [["PROJECT_STATE.md",projectState],["00_CURRENT_HANDOFF.md",handoff],["00_DEVELOPER_START_HERE.md",developerStart],["REMOTE_JOINING_EXECUTION_ROADMAP.md",roadmap],["POST_V1_ROADMAP_EXECUTION.md",postV1]]){
  const current=currentOverride(text);
  assert.match(current,/Stage 2I[\s\S]+DONE \/ MERGED \/ PROVEN/,`${name} current override must classify Stage 2I complete.`);
  assert.match(current,/Stage 3[\s\S]+BLOCKED/i,`${name} current override must keep Stage 3 blocked.`);
  assert.doesNotMatch(current,/Stage 3[\s\S]+CURRENT \/ IMPLEMENTATION-AUTHORIZED/,`${name} must not authorize Stage 3.`);
}

assert.match(currentOverride(projectState),/Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/);
assert.match(currentOverride(roadmap),/Stages 2A through 2I — DONE \/ MERGED \/ PROVEN/);
assert.match(currentOverride(postV1),/Stages 2A–2I — DONE \/ MERGED \/ PROVEN/);
assert.match(currentOverride(handoff),/No later Stage 2 implementation prerequisite is selected here/i);
assert.match(currentOverride(developerStart),/Private Remote Joining remains prioritized long term \/ dependency gated \/ not yet implementation authorized/i);

assert.match(history,/Closure addendum — `we-2026-08-19-post-stage2i-closure-reconcile`/);
assert.match(history,/PR #96[\s\S]+3d2ebad38d85e07f774360fcb7d210b9dd096fa4[\s\S]+e52968632d9938f17e7e1680c455437d23eb628b/);
assert.match(history,/Successor activation — `we-2026-08-19-post-pr96-stage2-selection`/);
assert.match(history,/predecessor `HANDOFF_AT_CHECKPOINT`[\s\S]+not inherited/i);
assert.match(history,/PR #97 post-seal publication facts pending canonical history append/i);

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
const dormantTrustedModules=/trustedAppAttestationRequest\.js|trustedSharedMutationGateway\.js|trustedAccountDeletionExecution\.js|trustedConnectedDataAccountExport\.js|firebase\/app-check|ReCaptchaEnterpriseProvider|X-Firebase-AppCheck/i;
assert.doesNotMatch(index,dormantTrustedModules);
assert.doesNotMatch(optional,dormantTrustedModules);
assert.doesNotMatch(worker,dormantTrustedModules);
assert.equal(pkg.version,"1.4.0");
assert.equal(pkg.dependencies,undefined,"Dormant trusted Stage 2 proofs must not add production dependencies.");
assert.match(index,/app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker,/RUNTIME_REVISION = "1\.4\.0-r1"/);

process.stdout.write("PASS Stage 2I locks remain historically protected without freezing later Stage 2 current-task authority; fresh WEC identity, legitimate transition-prepared closure and predecessor archives remain coherent.\n");