const assert=require("node:assert/strict");
const fs=require("node:fs");

const boundary=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
const stage2g=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2G.md","utf8");
const nextTask=fs.readFileSync("NEXT_TASK.md","utf8");
const projectState=fs.readFileSync("PROJECT_STATE.md","utf8");
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

assert.match(nextTask,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(nextTask,/Stage 2H[\s\S]+Production Trusted Execution Runtime & Least-Privilege IAM Boundary/);
assert.match(nextTask,/AUTHORIZED NEXT PREREQUISITE/);
assert.match(nextTask,/Do not provision production Cloud Run|do not provision production Cloud Run/i);
assert.match(projectState,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(projectState,/Stage 2H[\s\S]+AUTHORIZED NEXT PREREQUISITE/);
assert.match(handoff,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(handoff,/Stage 2H[\s\S]+AUTHORIZED NEXT PREREQUISITE/);
assert.match(developerStart,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(developerStart,/Stage 2H[\s\S]+AUTHORIZED NEXT PREREQUISITE/);
assert.match(roadmap,/Stage 2G[\s\S]+DONE \/ MERGED \/ PROVEN/);
assert.match(roadmap,/Stage 2H[\s\S]+AUTHORIZED NEXT PREREQUISITE/);

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.doesNotMatch(index,/firebase-admin|firebase\/firestore|trustedAccountBootstrapExecution\.js/i);
assert.doesNotMatch(optional,/firebase-admin|firebase\/firestore|trustedAccountBootstrapExecution\.js/i);
assert.doesNotMatch(worker,/firebase-admin|firebase\/firestore|trustedAccountBootstrapExecution\.js/i);
assert.equal(pkg.version,"1.4.0");
assert.equal(pkg.dependencies,undefined,"Stage 2H authorization boundary must not add production dependencies.");
assert.match(index,/app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker,/RUNTIME_REVISION = "1\.4\.0-r1"/);

process.stdout.write("PASS Stage 2H trusted production execution/IAM authorization boundary contracts\n");
