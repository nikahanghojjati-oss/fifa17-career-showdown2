# Career Mode Showdown v1.9.1-r2 Production Release

Status: DEPLOYED / PRODUCTION-PROVEN

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r2`

Previous known-good runtime: `1.9.1-r1`

## Production scope

This runtime-only release adds the Stage 5I privacy-safe physical Remote Joining acceptance recorder. The normal application remains unchanged unless the owner explicitly opens the site with `?rjr-acceptance=1`.

The acceptance mode minimizes the final unavoidable two-physical-device / two-network evidence burden:

- the recorder is not loaded in ordinary production navigation;
- evidence exists only in page memory until the owner explicitly copies or downloads it;
- the recorder performs no Firestore writes, recorder network uploads, or localStorage writes;
- raw private session capability, account ID, registered device ID, and rivalry ID are excluded from exported evidence;
- the exact private session is correlated between physical devices only by a SHA-256 fingerprint of the 256-bit capability;
- real browser online/offline transitions, sanitized Remote Joining state, role, revision, pending action, and owner-entered device/network labels are captured;
- canonical gameplay storage remains limited to the three existing Career Mode Showdown keys.

## Production proof

PR #194 exact reviewed head `42f91df5ec1d5a576f0907836fa03f5994d7646b` passed all 15 permanent pull-request workflow families. It merged to `main` with merge SHA `11bb681527a9b78884baf0c384350c90493dc9bd`. The resulting main push produced 15 permanent workflow runs, all successful, including Stability run `33947112190`. The canonical proof is `V1.9.1_R2_PRODUCTION_PROOF.md`.

Publication, CI, merge, deployment, documentation, or repeated automated proof alone do **not** earn Remote Joining Readiness credit. Fixed `RJR-1` remains `91/100`; any later increase requires genuinely new accepted capability evidence.

## Permanent zero-billing locks

- Firebase remains on Spark.
- Billing must never be activated.
- Cloud Billing must remain disabled and no payment method may be attached for this project.
- Blaze must not be enabled.
- Cloud Run must not be enabled.
- Cloud Functions must not be enabled.
- No billing-required provider or service may be introduced.
- App Check enforcement remains OFF.
- Firestore browser persistence remains memory-only.

## Privacy and product locks

- Exactly two already-paired private managers.
- No public discovery, listing, lobby, matchmaking, community surface, rankings, or global leaderboard.
- Full private pairing/session capabilities are never durably logged or persisted by the acceptance recorder.
- Candidate A remains non-mutating, Candidate B remains read-only, and Candidate C remains the sole destructive remote-to-local gameplay Apply authority.

## Recovery

`1.9.1-r1` remains the previous production-proven whole-shell recovery target. Never construct a mixed-version rollback. No billing change is authorized as part of recovery.
