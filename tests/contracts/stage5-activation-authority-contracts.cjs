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

assert.equal(readiness.modelVersion,"RJR-1");
assert.equal(readiness.denominator,100);
assert.equal(readiness.currentScore,87);
assert.equal(readiness.domains.reduce((sum,domain)=>sum+domain.earned,0),87);
assert.deepEqual(
  readiness.domains.map(domain=>[domain.id,domain.earned,domain.weight]),
  [
    ["deterministic-sync-recovery",20,20],
    ["identity-auth-trust",18,20],
    ["production-cloud-security",20,20],
    ["devices-pairing-connected-rivalry-remote-join",20,30],
    ["real-device-hardening-release",9,10]
  ]
);

const latestCandidate=readiness.evidenceHistory.at(-1);
const latestCredited=readiness.evidenceHistory.at(-2);
assert.equal(latestCandidate.eventId,"stage5a-private-session-candidate-emulator-proof");
assert.equal(latestCandidate.score,87);
assert.equal(latestCandidate.delta,0);
assert.match(latestCandidate.reason,/isolated candidate Rules/i);
assert.match(latestCandidate.reason,/zero production capability credit/i);
assert.match(latestCandidate.reason,/provider-live device credential\/session authority[\s\S]+uncredited/i);
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

assert.match(next,/STAGE 5A IS AUTHORIZED NEXT/i);
assert.match(next,/new module/i);
assert.match(next,/candidate emulator Rules boundary/i);
assert.match(next,/no production Rules publication/i);
assert.match(next,/host-only[^\n]+open[^\n]+creation/i);
assert.match(next,/peer-only[^\n]+open -> active[^\n]+join/i);
assert.match(next,/no collection listing/i);
assert.match(next,/add no localStorage key/i);
assert.match(next,/Do not change or publish production Rules in this closing checkpoint/i);
assert.match(state,/Stage 5 is no longer locked/i);
assert.match(state,/rivalries\/\{rivalryId\}\/sessions\/\{sessionId\}/);
assert.match(next,/PR #173 STAGE 5A CANDIDATE PROVEN[\s\S]+PROVIDER DEVICE CREDENTIAL NEXT/i);
assert.match(next,/provider-verifiable current-device credential issuance, refresh and revocation boundary/i);
assert.match(next,/do not publish production session Rules in the credential-foundation slice/i);
assert.match(stage5aProof,/candidate protocol and emulator boundary proven; production publication deliberately excluded/i);
assert.match(stage5aProof,/Fixed Remote Joining readiness: `87\/100` unchanged/i);
assert.match(stage5aRules,/STAGE5A_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+STAGE5A_CANDIDATE_SESSION_FUNCTIONS_END/);
assert.match(stage5aRules,/STAGE5A_CANDIDATE_SESSION_MATCH_BEGIN[\s\S]+STAGE5A_CANDIDATE_SESSION_MATCH_END/);
assert.match(stage5aRules,/request\.auth\.token\.device_id[\s\S]+activeDevice\(request\.auth\.token\.device_id\)/);
assert.match(stage5aRules,/root\.updatedByDeviceId == request\.auth\.token\.device_id/);

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
assert.match(schema,/every session operation rechecks current account state, current device state and current rivalry entitlement/i);

assert.match(rules,/match \/sessions\/\{sessionId\}[\s\S]+allow get:[\s\S]+memberAccountIds[\s\S]+allow list, create, update, delete: if false;/);
assert.doesNotMatch(stage4,/sessions\/|sessionId|private-session/,"Stage 5 must remain separate from the protected Stage 4 Connected Rivalry module.");

process.stdout.write("PASS Stage 5 activation authority: production provider-abuse advances fixed RJR 86 to 87 once; the separate Stage 5A candidate/emulator proof earns zero duplicate credit and routes provider-verifiable device credentials next.\n");
