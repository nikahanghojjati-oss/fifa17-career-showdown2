const assert=require("node:assert/strict");
const fs=require("node:fs");

const boundary=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_TRUSTED_CONNECTED_DATA_ACCOUNT_EXPORT.md","utf8");
const implementation=fs.readFileSync("js/trustedConnectedDataAccountExport.js","utf8");
const privacy=fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md","utf8");
const remote=fs.readFileSync("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md","utf8");
const stage2h=fs.readFileSync("PRIVATE_ACCOUNT_AUTH_STAGE_2H.md","utf8");
const nextTask=fs.readFileSync("NEXT_TASK.md","utf8");
const preR3NextTask=fs.readFileSync("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const production=JSON.parse(fs.readFileSync("firebase.production.environment.json","utf8"));
const rules=fs.readFileSync("firestore.rules","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");

assert.match(boundary,/Trusted Connected Data Account Export Execution Boundary/);
assert.match(boundary,/intentionally has no synthetic Stage 2J label/i);
assert.match(boundary,/connected-data account export is a different operation over future private provider-held application data/i);
assert.match(boundary,/verified Firebase UID/i);
assert.match(boundary,/operation-specific Career Mode Showdown authorization for connected-data account export/i);
assert.match(boundary,/Self-service connected-data export requires the current application account to be `active`/i);
assert.match(boundary,/A `disabled` application account is denied while disabled/i);
assert.match(boundary,/A `deletion-pending` account is denied/i);
assert.match(boundary,/The export operation is read-only/i);
assert.match(boundary,/requesting account's minimized application account metadata/i);
assert.match(boundary,/account-to-profile link records/i);
assert.match(boundary,/registered-device metadata/i);
assert.match(boundary,/currently holds `active` or `retained` entitlement/i);
assert.match(boundary,/another account's provider principal identifier is not needed/i);
assert.match(boundary,/does not emit raw `authorizedAccountIds`, peer Firebase UID\/accountId or `createdByAccountId`/i);
assert.match(boundary,/provider authentication credentials[\s\S]+raw device secrets[\s\S]+raw invite capabilities[\s\S]+idempotency[\s\S]+application security-event records[\s\S]+provider-controlled security\/audit logs/i);
assert.match(boundary,/fail-closed scope violation/i);
assert.match(boundary,/No export grants ownership transfer, deletion consent, restoration authority or shared mutation authority/i);
assert.match(boundary,/Every application-client Firestore create\/update\/delete remains denied/i);
assert.match(boundary,/Stage 2H's currently proven account-bootstrap runtime role remains exactly/i);
assert.match(boundary,/firebaseauth\.users\.get[\s\S]+datastore\.databases\.get[\s\S]+datastore\.entities\.get[\s\S]+datastore\.entities\.create/);
assert.match(boundary,/Do not add list\/query, account-update\/delete, provider-user-delete, shared-state mutation or broader Firebase\/Datastore permissions/i);
assert.match(boundary,/Production dormancy is sequencing for safety, not the final destination/i);
assert.match(boundary,/does not by itself complete Stage 2 or authorize Stage 3/i);
assert.match(boundary,/careerModeShowdown\.saveLibrary[\s\S]+careerModeShowdown\.legacyShowdowns[\s\S]+careerModeShowdown\.preferences/);
assert.match(boundary,/Candidate A remains non-mutating local formatVersion 2 export[\s\S]+Candidate B remains read-only import analysis[\s\S]+Candidate C remains the sole destructive import Apply authority/i);
assert.match(boundary,/Public discovery[\s\S]+global leaderboards[\s\S]+public rankings remain eliminated/i);

assert.match(privacy,/A future connected-data export must be explicit and private/i);
assert.match(privacy,/must not expose another account's authentication secrets, device secrets, security logs or invite tokens/i);
assert.match(privacy,/Remote enablement must never remove local export\/import portability/i);
assert.match(privacy,/Candidate A \/ formatVersion 2 export remains the primary local escape hatch and must stay available/i);
assert.match(remote,/preserves read\/export\/delete-consent entitlement for both/i);
assert.match(remote,/preserve the other owner's read\/export\/deletion entitlement/i);
assert.match(remote,/Disabling an account[\s\S]+other entitled owner retains authorized read\/export access/i);
assert.match(stage2h,/account lifecycle export\/deletion execution/i);
assert.match(stage2h,/If a later separately authorized Stage 2 operation requires[\s\S]+export[\s\S]+additional permission must be justified/i);

// Export remains completed historical proof. PR #125-era authority is immutable provenance;
// live authority may advance without rewriting the proof that established export/IAM/privacy locks.
assert.match(preR3NextTask,/CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME/i);
assert.match(preR3NextTask,/Current branch: `agent\/spark-production-account-runtime`/);
assert.match(preR3NextTask,/Current environment: `we-2026-08-21-spark-production-account-runtime`/);
assert.match(preR3NextTask,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i);
assert.match(preR3NextTask,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i);
assert.match(preR3NextTask,/Stage 3 Registered Devices \/ Private Pairing remains blocked/i);
assert.match(preR3NextTask,/Private Remote Joining remains PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i);
assert.match(preR3NextTask,/App Check enforcement(?: remains)?:? OFF/i);
assert.match(preR3NextTask,/currently published application-client Firestore create\/update\/delete boundary remains deny-all|browser Firestore (?:create\/update\/delete remains deny-all|writes deny-all)/i);
assert.match(preR3NextTask,/Stage 2H[\s\S]+firebaseauth\.users\.get[\s\S]+datastore\.entities\.create[\s\S]+Do not broaden/i);
assert.match(preR3NextTask,/Current production Installable Offline App runtime: `1\.4\.0-r2`/i);
assert.match(preR3NextTask,/Immediate candidate rollback\/recovery runtime: `1\.4\.0-r2`/i);
assert.match(preR3NextTask,/Finish only PR #125[\s\S]+source validation first/i);
assert.match(nextTask,/^# CURRENT OVERRIDE — PR #191 MERGED \/ STAGE 5F ACCEPTED \/ RJR91 \/ STAGE 5G NETWORK HARDENING — 2026-09-04 UTC$/im,"Live NEXT_TASK must identify the exact merged-PR191 / Stage 5F accepted / RJR91 / Stage 5G authority rather than revive historical export or prior transition lanes.");
assert.match(nextTask,/App Check enforcement remains OFF/i);
assert.match(nextTask,/Firestore(?: browser persistence)? remains memory-only/i);
assert.match(nextTask,/Candidate C remains the sole destructive (?=[^\n]*Apply authority)(?=[^\n]*remote-to-local)[^\n]+/i,"Live NEXT_TASK must preserve Candidate C as the sole destructive remote-to-local Apply authority without pinning one sentence order.");
assert.match(nextTask,/Remote Joining-specific[\s\S]+two-device\/two-network reconnect\/adverse-network hardening/i,"Live NEXT_TASK must route from accepted RJR91 to the genuinely uncredited Stage 5G gap.");
assert.match(nextTask,/do not repeat generic Connected Rivalry adverse-network proof/i,"Live NEXT_TASK must preserve consumed-proof discipline.");

assert.equal(production.activation.appCheckEnforcement,false);
assert.equal(production.activation.trustedRuntimeIam,"not-activated-yet");
assert.equal(production.securityLocks.applicationClientFirestoreWrites,"deny-all");
assert.deepEqual(production.securityLocks.stage2hIamPermissions,[
  "firebaseauth.users.get",
  "datastore.databases.get",
  "datastore.entities.get",
  "datastore.entities.create"
]);

assert.match(implementation,/productionRuntimeConnected:false/);
assert.match(implementation,/productionProvisioningAuthorized:false/);
assert.match(implementation,/trustedServerOnly:true/);
assert.match(implementation,/accountIdentitySource:"verified Firebase UID only"/);
assert.match(implementation,/exportRequiresActiveAccount:true/);
assert.match(implementation,/exportIsNonMutating:true/);
assert.match(implementation,/localCandidateAReplaced:false/);
assert.match(implementation,/peerAccountIdentifiersMinimized:true/);
assert.match(implementation,/peerSecretsExported:false/);
assert.match(implementation,/peerSecurityLogsExported:false/);
assert.match(implementation,/inviteCapabilitiesExported:false/);
assert.match(implementation,/ownershipTransferGranted:false/);
assert.match(implementation,/sharedMutationAuthorityGranted:false/);
assert.match(implementation,/ACCOUNT_EXPORT_ACCOUNT_DISABLED/);
assert.match(implementation,/ACCOUNT_EXPORT_DELETION_PENDING/);
assert.match(implementation,/ACCOUNT_EXPORT_RIVALRY_SCOPE_VIOLATION/);
assert.match(implementation,/CONNECTED_EXPORT_ALLOWED_INVENTORY_FIELDS/);
assert.match(rules,/match \/accounts\/\{accountId\}[\s\S]*allow list, create, update, delete: if false;/);
assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
assert.doesNotMatch(index,/trustedConnectedDataAccountExport\.js/);
assert.doesNotMatch(optional,/trustedConnectedDataAccountExport\.js/);
assert.doesNotMatch(worker,/trustedConnectedDataAccountExport\.js/);
const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while the dormant connected-data export boundary stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent.");
assert.equal(pkg.dependencies,undefined);

process.stdout.write("PASS trusted connected data account export boundary: private explicit portability, exact entitlement/read scope, peer-identity minimization, secret exclusion, dormant trusted-export isolation and unchanged IAM/browser-write locks remain protected under current Stage 5F/RJR91/Stage 5G authority.\n");
