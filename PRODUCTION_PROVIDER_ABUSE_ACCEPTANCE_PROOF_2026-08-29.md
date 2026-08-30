# Production provider-abuse acceptance proof — 2026-08-29

Status: PRODUCTION-PROVEN / CONSUMED

Production site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Application/runtime: `v1.8.1 / 1.8.1-r5`
Acceptance surface: `production-authorization-acceptance.html`
Probe: `PROBE ENUMERATION DENIAL`
Observed at: `2026-08-29T18:22:57.861Z`
Result: `PASS / PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED`

## Production-authoritative result

The deployed acceptance surface was opened in an authenticated browser and used one legitimate existing active Connected Account. The bounded probe completed with the following sanitized evidence:

```json
{
  "schemaVersion": 1,
  "feature": "production-provider-abuse-acceptance",
  "applicationVersion": "1.8.1",
  "runtimeRevision": "1.8.1-r5",
  "result": "PASS",
  "ok": true,
  "code": "PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED",
  "probe": "authenticated-rivalry-list-denial",
  "providerBoundary": "rivalries-collection-list",
  "authenticatedAccountRequired": true,
  "authenticatedAccountStable": true,
  "authenticationControlsLockedDuringQuery": true,
  "queryLimit": 1,
  "rivalryListDenied": true,
  "providerErrorCode": "permission-denied",
  "firestoreWritesRequested": 0,
  "localStorageUnchanged": true,
  "providerAbuseAcceptanceCandidate": true,
  "rjrEligibleEvidenceCandidate": true
}
```

The result is provider-authoritative for this exact bounded behavior: the production Firestore service denied authenticated rivalry collection enumeration while the same account remained stable and the shared authentication-control lock remained held throughout the asynchronous query. The probe requested no Firestore write and left browser local storage unchanged.

The acceptance output also contained the expected SHA-256 account fingerprint. It is intentionally omitted from this durable proof because the bounded result above is sufficient and no account identifier is needed for later verification.

## Fixed RJR reconciliation

This production result closes exactly one previously explicit uncredited capability: production provider-abuse acceptance. Under fixed RJR-1, `real-device-hardening-release` moves `8/10 -> 9/10` and the total moves `86/100 -> 87/100`.

The credit is limited to the authenticated production enumeration-denial capability. The PR that implemented the probe, its tests, CI, merge, deployment, service-worker repairs, documentation, browser sign-in process, and repeated subfields receive zero duplicate credit. `production-cloud-security` remains capped at `20/20`.

## Scope and nonclaims

The probe did not create or mutate an account, registered device, pairing capability, rivalry, shared gameplay state, session, or revocation state. It did not read or emit a rivalry identifier or rivalry payload. It did not touch the protected historical rivalry `pair_a07108...756fb`.

This proof does not establish a third-account denial, a revoked-device provider mutation denial, a two-network Remote Joining session, Remote Joining-specific reconnect/token behavior, or final stable release acceptance. Those remain separately uncredited and must not be fabricated.

## Stage 5 reassessment

The provider-abuse result closes the last explicit non-state-dependent Stage 4 / production-security prerequisite named by current authority. The remaining third-account and revoked-device negatives are state-dependent evidence opportunities, not mandatory synthetic blockers. Stages 1 through 4 are production-proven at the bounded capability level required to begin the next private session slice.

Stage 5 is therefore authorized for the smallest real engineering slice only: define and contract-test the private session protocol and deterministic host/join lifecycle in a new Stage 5 module, backed by a candidate emulator Rules boundary. The existing production Rules remain unchanged at this checkpoint. Their current `/rivalries/{rivalryId}/sessions/{sessionId}` boundary permits entitled exact reads but denies list/create/update/delete; any later production session mutation authority requires a separately reviewed minimum Rules publication after the protocol and emulator proof are clean.

## Permanent locks preserved

Exactly two private managers remain required. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. Candidate A remains non-mutating, Candidate B read-only, and Candidate C remains the sole destructive remote-to-local Apply authority with transaction-owned strict exact raw snapshot rollback.

Firebase remains Spark / zero billing. Firestore client persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated and unbroadened. Public discovery, community, matchmaking, global rankings, and session listing remain prohibited.
