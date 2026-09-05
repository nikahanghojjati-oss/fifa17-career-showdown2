# Career Mode Showdown v1.9.1-r2 Release Candidate

Status: **RELEASE CANDIDATE — NOT PRODUCTION-PROVEN**

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r2`

Previous known-good runtime: `1.9.1-r1`

## Candidate scope

This runtime-only candidate adds the Stage 5I privacy-safe physical Remote Joining acceptance recorder. The normal application remains unchanged unless the owner explicitly opens the site with `?rjr-acceptance=1`.

The acceptance mode is designed to minimize the final unavoidable two-physical-device / two-network evidence burden:

- the recorder is not loaded in ordinary production navigation;
- evidence exists only in page memory until the owner explicitly copies or downloads it;
- the recorder performs no Firestore writes, recorder network uploads, or localStorage writes;
- raw private session capability, account ID, registered device ID, and rivalry ID are excluded from exported evidence;
- the exact private session is correlated between physical devices only by a SHA-256 fingerprint of the 256-bit capability;
- real browser online/offline transitions, sanitized Remote Joining state, role, revision, pending action, and owner-entered device/network labels are captured;
- canonical gameplay storage remains limited to the three existing Career Mode Showdown keys.

## Publication boundary

`1.9.1-r1` remains the production-proven runtime and rollback authority until this exact `1.9.1-r2` candidate passes exact-head CI/review, merges with expected-head protection, deploys through GitHub Pages, and passes the full deployed-site smoke.

Publication, CI, merge, deployment, documentation, or repeated automated proof alone do **not** earn Remote Joining Readiness credit. Any RJR change remains subject to the fixed RJR-1 ledger and genuinely new accepted capability evidence.

## Permanent zero-billing locks

- Firebase remains on Spark.
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

If `1.9.1-r2` fails any publication or live acceptance gate, retain or restore the reviewed `1.9.1-r1` whole-shell runtime. No billing change is authorized as part of recovery.
