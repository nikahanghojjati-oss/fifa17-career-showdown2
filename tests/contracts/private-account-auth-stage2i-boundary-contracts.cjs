const assert=require("node:assert/strict");
const fs=require("node:fs");

const boundary=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2I.md","utf8");
const stage2h=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
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

assert.match(boundary,/Stage 2I — Production App Attestation & Trusted Endpoint Abuse-Resistance Boundary/);
assert.match(boundary,/Status: AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED \/ DORMANT POLICY PROOF \/ NON-PROVISIONING \/ PRODUCTION FIREBASE DISCONNECTED/);
assert.match(boundary,/Starting verified live-main boundary: `f85d692384cba0b343a9634a5a7b1d56f0b0cc4b`/);
assert.match(boundary,/Stage 2H[\s\S]+DONE \/ MERGED \/ PROVEN through PR #93/);
assert.match(boundary,/reCAPTCHA Enterprise provider for the future production web app/i);
assert.match(boundary,/default risk threshold of `0\.5`/);
assert.match(boundary,/default token TTL of one hour/i);
assert.match(boundary,/`localhost` must not be added to the production key/i);
assert.match(boundary,/Debug App Check providers\/tokens belong only to explicit development, emulator or CI environments/i);
assert.match(boundary,/App Check is not authentication or application authorization/i);
assert.match(boundary,/`X-Firebase-AppCheck` header/);
assert.match(boundary,/decoded App Check `app_id`[\s\S]+single expected registered production Career Mode Showdown Firebase Web App identity/i);
assert.match(boundary,/verifyIdToken\(idToken, true\)/);
assert.match(boundary,/App Check token is transient/i);
assert.match(boundary,/fail closed/i);
assert.match(boundary,/does not make that beta feature a correctness dependency/i);
assert.match(boundary,/`firebaseappcheck\.appCheckTokens\.verify`[\s\S]+not silently added to the Stage 2H four-permission runtime role/i);
assert.match(boundary,/Cloud Run scaling is defense in depth, not rate authorization/i);
assert.match(boundary,/Every application-client Firestore create, update and delete remains denied/i);
assert.match(boundary,/App Check does not repair the Phase 1D \/ Phase 1F shared-state idempotency-receipt schema finding/i);
assert.match(boundary,/must not create, enable, deploy or connect:[\s\S]+production reCAPTCHA Enterprise key[\s\S]+App Check registration or enforcement[\s\S]+production Cloud Run service[\s\S]+Blaze billing/i);
assert.match(boundary,/Candidate A remains non-mutating export[\s\S]+Candidate B remains strictly read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
assert.match(boundary,/global leaderboards and public rankings remain eliminated/i);
assert.match(boundary,/Stage 3 Registered Devices \/ Private Pairing remains BLOCKED/i);
assert.match(boundary,/Private Remote Joining[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(boundary,/current reconciliation environment must publish the Stage 2H closure plus this Stage 2I boundary and stop before implementing Stage 2I/i);

assert.match(stage2h,/Stage 2H — Production Trusted Execution Runtime & Least-Privilege IAM Boundary/);
assert.match(stage2h,/DONE \/ MERGED \/ PROVEN/);
assert.match(stage2h,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(stage2h,/Every application-client Firestore create, update and delete remains denied/i);

for(const [name,text] of [["NEXT_TASK.md",nextTask],["PROJECT_STATE.md",projectState],["00_CURRENT_HANDOFF.md",handoff],["00_DEVELOPER_START_HERE.md",developerStart],["REMOTE_JOINING_EXECUTION_ROADMAP.md",roadmap]]){
  assert.match(text,/Stage 2H[\s\S]+DONE \/ MERGED \/ PROVEN/,`${name} must classify Stage 2H complete.`);
  assert.match(text,/Stage 2I[\s\S]+Production App Attestation & Trusted Endpoint Abuse-Resistance Boundary/,`${name} must identify Stage 2I.`);
  assert.match(text,/AUTHORIZED NEXT PREREQUISITE/,`${name} must keep Stage 2I as authorization-only next prerequisite.`);
}

assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.doesNotMatch(index,/firebase\/app-check|ReCaptchaEnterpriseProvider|X-Firebase-AppCheck/i);
assert.doesNotMatch(optional,/firebase\/app-check|ReCaptchaEnterpriseProvider|X-Firebase-AppCheck/i);
assert.doesNotMatch(worker,/firebase\/app-check|ReCaptchaEnterpriseProvider|X-Firebase-AppCheck/i);
assert.equal(pkg.version,"1.4.0");
assert.equal(pkg.dependencies,undefined,"Stage 2I boundary must not add production dependencies.");
assert.match(index,/app-asset-revision" content="1\.4\.0-r1"/);
assert.match(worker,/RUNTIME_REVISION = "1\.4\.0-r1"/);

process.stdout.write("PASS Stage 2I production app-attestation authorization boundary contracts\n");
