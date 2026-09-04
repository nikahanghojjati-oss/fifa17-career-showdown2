# Production Stage 5F authenticated negatives acceptance — 2026-09-04 UTC

Status: **PASS**

Production identity:

- Application: `1.9.0`
- Runtime: `1.9.0-r5`
- Origin: `https://nikahanghojjati-oss.github.io`
- Firebase plan boundary: **Spark / zero billing**

This record preserves only sanitized/fingerprinted owner-supplied production evidence. No full rivalry, session, account, device, pairing or private capability value is retained here.

## Revoked-device protected-mutation denial

Owner production evidence generated at `2026-09-04T02:35:26.160Z` returned:

```json
{
  "schemaVersion": 1,
  "feature": "stage5f-production-authenticated-negatives",
  "generatedAt": "2026-09-04T02:35:26.160Z",
  "applicationVersion": "1.9.0",
  "runtimeRevision": "1.9.0-r5",
  "origin": "https://nikahanghojjati-oss.github.io",
  "result": "PASS",
  "ok": true,
  "code": "STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED",
  "probe": "revoked-device-provider-mutation-denial",
  "accountFingerprint": "sha256:f0297a1355a9336252bb36c929015c52898e41ecb2396567852667f3938786d5",
  "rivalryFingerprint": "sha256:8ed7ff9631ed49d94b8c3e15ebce2323fadf7a4c002b25a3ff060dbc941b4520",
  "actorDeviceFingerprint": "sha256:8dd45f04d7611fde0014ea05a41361d1f639ea561081acbc663ae83d8923dbda",
  "syntheticDeviceFingerprint": "sha256:323cca5cb99134ef973019254a4b1bf2a6ceda537a985e6d476378f9227894d6",
  "sessionFingerprint": "sha256:5ffcb60844248606a9f4e3d97e02e9a973510669f83a131a2b8725db7314bc61",
  "syntheticDeviceRegistered": true,
  "syntheticDeviceRevoked": true,
  "applicationAdapterDenied": true,
  "applicationAdapterCode": "PRIVATE_SESSION_DEVICE_REVOKED",
  "providerMutationDenied": true,
  "providerErrorCode": "permission-denied",
  "deniedMutationCommitted": false,
  "sessionUnchangedAfterDeniedMutation": true,
  "cleanupTerminal": true,
  "sacrificialDeviceRetainedRevoked": true,
  "localStorageUnchanged": true,
  "billingRequired": false,
  "blazeRequired": false,
  "firestoreCommittedWritesExpected": 4,
  "rjrEligibleEvidenceCandidate": true
}
```

Interpretation: a sacrificial registered device was terminally revoked; the normal application adapter rejected it; a protected raw production Firestore mutation carrying that revoked device metadata was denied by provider Rules with `permission-denied`; the rejected mutation did not commit; the short-lived test session remained unchanged and was terminally cleaned up. Neither legitimate manager device was revoked.

## Authenticated third-account exact-read denial

Owner production evidence generated at `2026-09-04T03:18:39.250Z` returned:

```json
{
  "schemaVersion": 1,
  "feature": "stage5f-production-authenticated-negatives",
  "generatedAt": "2026-09-04T03:18:39.250Z",
  "applicationVersion": "1.9.0",
  "runtimeRevision": "1.9.0-r5",
  "origin": "https://nikahanghojjati-oss.github.io",
  "result": "PASS",
  "ok": true,
  "code": "STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED",
  "probe": "any-authenticated-third-account-read-denial",
  "accountFingerprint": "sha256:32a943a2b9a5d9bf7f66376a6a9cdbf690cae8dbebfdbdf34f4f40f0248c6024",
  "rivalryFingerprint": "sha256:8ed7ff9631ed49d94b8c3e15ebce2323fadf7a4c002b25a3ff060dbc941b4520",
  "rivalryReadDenied": true,
  "rivalryReadErrorCode": "permission-denied",
  "authoritativeStateReadDenied": true,
  "authoritativeStateReadErrorCode": "permission-denied",
  "providerAuthorizationDenied": true,
  "existingPrivateAccountRequired": false,
  "accountBootstrapAttempted": false,
  "firestoreWritesRequested": 0,
  "localStorageUnchanged": true,
  "billingRequired": false,
  "blazeRequired": false,
  "rjrEligibleEvidenceCandidate": true
}
```

Interpretation: a legitimately authenticated Google/Firebase identity that was neither manager attempted only the two exact protected reads. Production Firestore denied both the rivalry document and authoritative-state document with `permission-denied`. The probe performed zero writes, did not bootstrap a Career Mode Showdown private account and left canonical local storage unchanged.

## RJR-1 recalculation

Previous fixed RJR-1: `89/100`.

Before this evidence, `identity-auth-trust` was `18/20`, and the authenticated non-participant / revoked-device production authorization boundaries remained explicitly uncredited. These two production observations close two distinct fixed-domain capabilities:

1. **+1** — authenticated non-participant exact private read denial.
2. **+1** — revoked-device protected mutation denial, including provider denial rather than only a client pre-write guard.

New `identity-auth-trust`: `20/20`.

New fixed RJR-1: **`91/100`**.

No RJR credit is awarded for the Stage 5F source, acceptance harness, account-chooser repair, PRs, CI, review, merges, Pages deployment, repeated revoked-device run, documentation, WEC, SLE or handoff work.

The `devices-pairing-connected-rivalry-remote-join` domain remains `22/30`; the current proof is not double-counted there. `real-device-hardening-release` remains `9/10`.

## Remaining capability boundary

The next genuinely uncredited critical path is Remote Joining-specific two-device/two-network reconnect and adverse-network hardening. Final stable Remote Joining release acceptance remains separate and uncredited.

Permanent locks remain unchanged: billing forbidden, Firebase Spark, App Check enforcement OFF, memory-only Firestore browser persistence, popup-only `browserSessionPersistence`, no extra Google scopes, Candidate C as sole destructive remote-to-local Apply authority, exactly two private managers, no public discovery/listing/lobby/matchmaking/community/rankings/leaderboards, and no durable retention of full private capabilities.
