const assert=require("node:assert/strict");
const fs=require("node:fs");

const read=path=>fs.readFileSync(path,"utf8");
const readiness=JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const proof=read("PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md");
const next=read("NEXT_TASK.md");
const state=read("PROJECT_STATE.md");
const schema=read("REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md");
const rules=read("firestore.spark.rules");
const stage4=read("js/sparkConnectedRivalry.js");
const stage5aProof=read("STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md");
const stage5aRules=read("firestore.stage5a.rules");
const stage5bProof=read("STAGE5B_DEVICE_CREDENTIAL_FOUNDATION_PROOF_2026-08-31.md");
const stage5bClient=read("js/sparkDeviceCredential.js");
const stage5bIssuer=read("js/trustedDeviceCredentialIssuance.js");
const stage5cProof=read("STAGE5C_ZERO_BILLING_STANDARD_AUTH_SESSION_ADAPTER_PROOF_2026-09-01.md");
const stage5cClient=read("js/sparkStandardAuthPrivateSession.js");
const stage5cRules=read("firestore.stage5c.rules");
const zeroBillingAuth=read("00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md");
const zeroBillingDecision=read("ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md");

assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,89);
assert.equal(readiness.domains.reduce((sum,domain)=>sum+domain.earned,0),89);
assert.deepEqual(
  readiness.domains.map(domain=>[domain.id,domain.earned,domain.weight]),
  [
    ["deterministic-sync-recovery",20,20],
    ["identity-auth-trust",18,20],
    ["production-cloud-security",20,20],
    ["devices-pairing-connected-rivalry-remote-join",22,30],
    ["real-device-hardening-release",9,10]
  ]
);

const r5Convergence=readiness.evidenceHistory.find(entry=>entry.eventId==="production-r5-one-paste-zero-manual-reattach-convergence");
const stage5eLifecycle=readiness.evidenceHistory.find(entry=>entry.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
const latestStage5c=readiness.evidenceHistory.find(entry=>entry.eventId==="stage5c-zero-billing-standard-auth-session-adapter-proof");
const latestDecision=readiness.evidenceHistory.find(entry=>entry.eventId==="stage5b-rules-correction-zero-billing-architecture-decision");
const latestCandidate=readiness.evidenceHistory.find(entry=>entry.eventId==="stage5b-device-credential-foundation-proof");
const stage5aCandidate=readiness.evidenceHistory.find(entry=>entry.eventId==="stage5a-private-session-candidate-emulator-proof");
const latestCredited=readiness.evidenceHistory.find(entry=>entry.eventId==="production-provider-abuse-authenticated-enumeration-denial");
assert.equal(r5Convergence?.score,89);
assert.equal(r5Convergence?.delta,1);
assert.equal(r5Convergence?.domainId,"devices-pairing-connected-rivalry-remote-join");
assert.match(r5Convergence?.reason||"",/ONE PASTE CONFIRMED/i);
assert.match(r5Convergence?.reason||"",/zero manual Connected Rivalry Verify\/Reattach/i);
assert.match(r5Convergence?.reason||"",/No credit is awarded for PR #187[\s\S]+CI[\s\S]+deployment[\s\S]+handoff work/i);
assert.equal(stage5eLifecycle?.score,88);
assert.equal(stage5eLifecycle?.delta,1);
assert.equal(stage5eLifecycle?.domainId,"devices-pairing-connected-rivalry-remote-join");
assert.match(stage5eLifecycle?.reason||"",/actual Remote Joining session capability end to end/i);
assert.match(stage5eLifecycle?.reason||"",/zero credit[\s\S]+zero-manual-reattach/i);
assert.equal(latestStage5c.eventId,"stage5c-zero-billing-standard-auth-session-adapter-proof");
assert.equal(latestStage5c.score,87);
assert.equal(latestStage5c.delta,0);
assert.match(latestStage5c.reason,/ordinary Firebase uid authority[\s\S]+no custom device claims/i);
assert.match(latestStage5c.reason,/provider-live playable host\/join evidence is still required/i);
assert.equal(latestDecision.eventId,"stage5b-rules-correction-zero-billing-architecture-decision");
assert.equal(latestDecision.score,87);
assert.equal(latestDecision.delta,0);
assert.match(latestDecision.reason,/wrong-key[\s\S]+wrong-version/i);
assert.match(latestDecision.reason,/billing[\s\S]+Cloud Run\/Blaze are excluded[\s\S]+standard Google Auth/i);
assert.equal(latestCandidate.eventId,"stage5b-device-credential-foundation-proof");
assert.equal(latestCandidate.score,87);
assert.equal(latestCandidate.delta,0);
assert.match(latestCandidate.reason,/non-extractable P-256/i);
assert.match(latestCandidate.reason,/per-sign-in device_id[\s\S]+device_key_sha256/i);
assert.match(latestCandidate.reason,/Cloud Run is unavailable on the current Spark plan/i);
assert.match(latestCandidate.reason,/zero production capability credit/i);
assert.equal(stage5aCandidate.eventId,"stage5a-private-session-candidate-emulator-proof");
assert.equal(stage5aCandidate.score,87);
assert.equal(stage5aCandidate.delta,0);
assert.equal(latestCredited.eventId,"production-provider-abuse-authenticated-enumeration-denial");
assert.equal(latestCredited.score,87);
assert.equal(latestCredited.delta,1);
assert.equal(latestCredited.domainId,"real-device-hardening-release");
assert.match(latestCredited.reason,/PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED/);
assert.match(latestCredited.reason,/zero Firestore writes/i);
assert.match(latestCredited.reason,/localStorage remained unchanged/i);
assert.match(latestCredited.reason,/production-cloud-security remains capped at 20\/20/i);

for(const invariant of [
  /PASS \/ PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED/,
  /authenticatedAccountStable[^\n]+true/,
  /authenticationControlsLockedDuringQuery[^\n]+true/,
  /queryLimit[^\n]+1/,
  /rivalryListDenied[^\n]+true/,
  /providerErrorCode[^\n]+permission-denied/,
  /firestoreWritesRequested[^\n]+0/,
  /localStorageUnchanged[^\n]+true/,
  /providerAbuseAcceptanceCandidate[^\n]+true/,
  /rjrEligibleEvidenceCandidate[^\n]+true/
]) assert.match(proof,invariant);
assert.doesNotMatch(proof,/accountIdFingerprint|accountFingerprint|sha256:[0-9a-f]{64}/i,"Durable proof must omit the account fingerprint.");
assert.match(proof,/did not create or mutate an account, registered device, pairing capability, rivalry, shared gameplay state, session, or revocation state/i);
assert.match(proof,/86\/100 -> 87\/100/);

// Historical Stage 5A/5B/5C transition details are asserted from the immutable
// proof, rules and client artifacts below. Live NEXT_TASK/PROJECT_STATE must
// instead track the current owner-accepted r5 / fixed-RJR89 successor boundary.
assert.match(next,/^# CURRENT OVERRIDE — PR #187[\s\S]+RJR89/im,"Live NEXT_TASK must identify PR187/r5/RJR89 successor authority.");
assert.match(next,/authenticated third-account \/ revoked-device production negatives/i,"Live NEXT_TASK must expose the smallest preferred uncredited fixed-domain gap.");
assert.match(next,/Remote Joining-specific two-device\/two-network reconnect\/adverse-network hardening/i,"Live NEXT_TASK must preserve the next hardening option after authenticated negatives.");
assert.match(next,/final stable Remote Joining release acceptance/i,"Live NEXT_TASK must preserve final stable-release acceptance as a remaining capability gap.");
assert.match(next,/Do not repeat consumed r5 one-paste convergence[\s\S]+provider-Rules[\s\S]+provider-abuse proof/i,"Live NEXT_TASK must preserve consumed-proof discipline.");
assert.match(next,/Billing must never be activated[\s\S]{0,120}Firebase remains Spark/i,"Live NEXT_TASK must preserve the permanent zero-billing Spark boundary.");
assert.match(next,/App Check enforcement remains OFF/i,"Live NEXT_TASK must keep App Check enforcement off.");
assert.match(state,/CURRENT OVERRIDE[\s\S]+PR #187[\s\S]+RJR89/i,"Live PROJECT_STATE must identify current PR187/r5/RJR89 authority.");
assert.match(state,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i,"Live PROJECT_STATE must preserve local-first recovery authority.");
assert.match(state,/Candidate C remains the sole destructive remote-to-local(?: gameplay)? Apply authority/i,"Live PROJECT_STATE must preserve Candidate C destructive Apply authority.");

assert.match(stage5aProof,/candidate protocol and emulator boundary proven; production publication deliberately excluded/i);
assert.match(stage5aProof,/Fixed Remote Joining readiness: `87\/100` unchanged/i);
assert.match(stage5aRules,/STAGE5A_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+STAGE5A_CANDIDATE_SESSION_FUNCTIONS_END/);
assert.match(stage5aRules,/STAGE5A_CANDIDATE_SESSION_MATCH_BEGIN[\s\S]+STAGE5A_CANDIDATE_SESSION_MATCH_END/);
assert.match(stage5aRules,/request\.auth\.token\.device_id[\s\S]+activeDevice\(deviceId\)/);
assert.match(stage5aRules,/(?=[\s\S]*device_credential_version)(?=[\s\S]*device_key_sha256)(?=[\s\S]*deviceCredentials)(?=[\s\S]*credential\.data\.data\.publicKeyFingerprint == request\.auth\.token\.device_key_sha256)/);
assert.match(stage5aRules,/root\.updatedByDeviceId == request\.auth\.token\.device_id/);
assert.match(stage5bProof,/(?=[\s\S]*non-extractable P-256)(?=[\s\S]*per-sign-in custom-token claims)(?=[\s\S]*Two simultaneous custom-auth sessions for the same)/i);
assert.match(stage5bProof,/Cloud Run[\s\S]+Spark[\s\S]+iam\.serviceAccounts\.signBlob[\s\S]+datastore\.entities\.update/i);
assert.match(stage5bClient,/indexedDB[\s\S]+extractable:\s*false[\s\S]+ECDSA/i);
assert.match(stage5bIssuer,/(?=[\s\S]*device_key_sha256)(?=[\s\S]*iam\.serviceAccounts\.signBlob)(?=[\s\S]*datastore\.entities\.update)/i);
assert.match(stage5cProof,/(?=[\s\S]*standard Firebase authenticated `uid`)(?=[\s\S]*device IDs are not authentication)(?=[\s\S]*Fixed RJR-1 remains exactly `87\/100`)/i);
assert.match(stage5cClient,/(?=[\s\S]*standard-firebase-request-auth-uid)(?=[\s\S]*account-owned-registered-device-mutation-metadata)(?=[\s\S]*billingUpgradeAllowed:false)/i);
assert.match(stage5cRules,/STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+registeredSessionDeviceMetadata[\s\S]+STAGE5C_CANDIDATE_SESSION_FUNCTIONS_END/);
assert.doesNotMatch(stage5cRules,/request\.auth\.token\.device_|deviceCredentials/);
assert.match(zeroBillingAuth,/allNonBilling|every engineering|every remaining[\s\S]+except billing/i);
assert.match(zeroBillingAuth,/Cloud Run is therefore excluded/i);
assert.match(zeroBillingDecision,/(?=[\s\S]*stage5c-zero-billing-standard-auth-session-adapter)(?=[\s\S]*request\.auth\.uid)/i);

assert.match(schema,/Private session membership/i);
for(const field of [
  "rivalryId",
  "hostAccountId",
  "memberAccountIds",
  "state",
  "createdAt",
  "expiresAt",
  "lastActivityAt",
  "revokedAt"
]) assert.match(schema,new RegExp("^"+field+"\\s+","m"),"Reserved session schema must preserve "+field+".");
assert.match(schema,/"open" \| "active" \| "revoked" \| "expired" \| "closed"/);
assert.match(schema,/every client operation rechecks current account state, selected account-owned device metadata and current rivalry entitlement/i);
assert.match(schema,/exact gets require the opaque capability and current two-account entitlement/i);
assert.match(schema,/every mutation additionally rechecks the named active device document under that authenticated account/i);
assert.match(schema,/device ID remains attribution\/revocation metadata and is never authentication/i);

assert.equal(rules,stage5cRules,"Stage 5D production Rules source must remain byte-identical to the already proven Stage 5C Rules source.");
assert.match(rules,/STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+registeredSessionDeviceMetadata[\s\S]+validOpenSessionCreate[\s\S]+validSessionUpdate[\s\S]+STAGE5C_CANDIDATE_SESSION_FUNCTIONS_END/);
assert.match(rules,/match \/sessions\/\{sessionId\}[\s\S]+allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]+allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]+allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]+allow list, delete: if false;/);
assert.doesNotMatch(stage4,/sessions\/|sessionId|private-session/,"Stage 5 must remain separate from the protected Stage 4 Connected Rivalry module.");

process.stdout.write("PASS Stage 5 activation authority: historical provider-abuse advances fixed RJR 86 to 87 once; the production-live Stage 5E Remote Joining lifecycle advances 87 to 88 once; owner-proven r5 automatic one-paste exact-rivalry convergence advances 88 to 89 once; source, CI, merge, deployment and repeated substeps earn zero duplicate credit; historical Stage 5A/5B/5C proof remains immutable while live authority routes from PR187/RJR89.\n");
