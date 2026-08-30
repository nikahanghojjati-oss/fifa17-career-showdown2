const assert=require("node:assert/strict");
const fs=require("node:fs");

const boundary=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
const stage2g=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2G.md","utf8");
const historicalNextTask=fs.readFileSync("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md","utf8");
const liveNextTask=fs.readFileSync("NEXT_TASK.md","utf8");
const historicalProjectState=fs.readFileSync("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const liveProjectState=fs.readFileSync("PROJECT_STATE.md","utf8");
const handoff=fs.readFileSync("00_CURRENT_HANDOFF.md","utf8");
const developerStart=fs.readFileSync("00_DEVELOPER_START_HERE.md","utf8");
const roadmap=fs.readFileSync("REMOTE_JOINING_EXECUTION_ROADMAP.md","utf8");
const rules=fs.readFileSync("firestore.rules","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.match(boundary,/Stage 2H — Production Trusted Execution Runtime & Least-Privilege IAM Boundary/);
assert.match(boundary,/Status: AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED \/ NON-PROVISIONING \/ PRODUCTION FIREBASE DISCONNECTED/);
assert.match(boundary,/Starting verified live-main boundary: `f97024cf4be3e76cf25c510fb364675b8e747762`/);
assert.match(boundary,/Stage 2G — Trusted Account Bootstrap Execution Boundary — is DONE \/ MERGED \/ PROVEN through PR #91/);
assert.match(boundary,/dedicated Google Cloud Run HTTPS service as the future trusted execution runtime/i);
assert.match(boundary,/dedicated user-managed service account/i);
assert.match(boundary,/Application Default Credentials/i);
assert.match(boundary,/Do not grant primitive `Owner`, `Editor` or `Viewer` roles/i);
assert.match(boundary,/minimum Firestore permissions/i);
assert.match(boundary,/Authorization: Bearer/);
assert.match(boundary,/verifyIdToken\(idToken, true\)/);
assert.match(boundary,/network reachability grants zero application authority/i);
assert.match(boundary,/application authorization remains an independent code-level gate/i);
assert.match(boundary,/server libraries bypass Firestore Security Rules/i);
assert.match(boundary,/Every application-client Firestore create, update and delete remains denied/i);
assert.match(boundary,/Stage 2G's `updatedByDeviceId: null` exception remains limited to revision-0 self-bootstrap/i);
assert.match(boundary,/must not create or activate:[\s\S]+production Cloud Run service[\s\S]+production service account[\s\S]+IAM binding[\s\S]+Blaze billing/i);
assert.match(boundary,/Candidate A remains non-mutating export[\s\S]+Candidate B remains strictly read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
assert.match(boundary,/global leaderboards and public rankings remain eliminated/i);
assert.match(boundary,/Stage 3 Registered Devices \/ Private Pairing remains BLOCKED/i);
assert.match(boundary,/Private Remote Joining[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(boundary,/current handoff-bound environment must publish this boundary and stop before implementing Stage 2H/i);

assert.match(stage2g,/Trusted Account Bootstrap Execution Boundary/);
assert.match(stage2g,/Every application-client Firestore create, update and delete remains denied/i);
assert.match(stage2g,/account-bootstrap-only/);

// Immutable historical sources retain the original Stage 2G -> 2H selection boundary.
assert.match(historicalNextTask,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(historicalNextTask,/Stage 2H[\s\S]+Production Trusted Execution Runtime & Least-Privilege IAM Boundary/);
assert.match(historicalNextTask,/AUTHORIZED NEXT PREREQUISITE/);
assert.match(historicalNextTask,/Do not provision production Cloud Run|do not provision production Cloud Run/i);
assert.match(historicalProjectState,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(historicalProjectState,/Stage 2H[\s\S]+AUTHORIZED NEXT PREREQUISITE/);

// Live authority has advanced through production-proven r5 and provider-proven strengthened Rules.
assert.match(liveNextTask,/CURRENT OVERRIDE[\s\S]+PR #171 MERGED[\s\S]+RJR87[\s\S]+STAGE 5A/i,"Live NEXT_TASK must expose current PR #171 closure / RJR87 authority rather than revive Stage 2H.");
assert.match(liveNextTask,/App Check enforcement remains OFF/i);
assert.match(liveNextTask,/STAGE 5A IS AUTHORIZED NEXT[\s\S]+runtime implementation has not started/i);
assert.match(liveProjectState,/Production runtime:\s*`1\.8\.1-r5`[\s\S]+Immediate known-good rollback runtime:\s*`1\.8\.1-r4`/i,"Live PROJECT_STATE must identify production r5 and r4 recovery.");
assert.match(liveProjectState,/PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29\.md[\s\S]+firestore\.spark\.rules/i,"Live PROJECT_STATE must preserve direct strengthened Rules provider proof.");
assert.match(handoff,/PR #172[\s\S]+1\.8\.1-r5[\s\S]+87\/100/i,"Rolling handoff must expose current PR #172/r5/RJR87 authority.");
assert.match(handoff,/provider-abuse proof[\s\S]+Stage 5A is authorized next/i,"Rolling handoff must preserve provider-abuse acceptance before Stage 5 reassessment.");
assert.match(developerStart,/PR #172[\s\S]+1\.8\.1-r5[\s\S]+87\/100/i,"Developer start must expose current PR #172/r5/RJR87 authority.");
assert.match(roadmap,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(roadmap,/Stage 2H[\s\S]+AUTHORIZED NEXT PREREQUISITE/);

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.doesNotMatch(index,/firebase-admin|firebase\/firestore|trustedAccountBootstrapExecution\.js/i);
assert.doesNotMatch(optional,/firebase-admin|firebase\/firestore|trustedAccountBootstrapExecution\.js/i);
assert.doesNotMatch(worker,/firebase-admin|firebase\/firestore|trustedAccountBootstrapExecution\.js/i);
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while historical Stage 2H proof stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.equal(pkg.dependencies,undefined,"Historical Stage 2H authorization boundary must not add production dependencies.");

process.stdout.write("PASS Stage 2H trusted production execution/IAM authorization boundary contracts: immutable historical selection is preserved while current PR #171 closure / RJR87 production authority remains explicit\n");
