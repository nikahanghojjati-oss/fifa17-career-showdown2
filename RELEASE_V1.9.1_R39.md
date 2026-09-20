# Career Mode Showdown v1.9.1 — Runtime r39

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r39`
Previous known-good runtime: `1.9.1-r38`

Physical iPhone + Chromebook testing reached an existing Season 1 Shared Transfer Challenge at `00:00` under a freshly reconnected private session, but the timeout transition was rejected with `permission-denied`. A new production-Rules emulator added during the r38 investigation reproduced that denial before r38 was accepted for another physical attempt.

r39 fixes the remaining provider/Rules mismatch by making the timeout transition entirely server-authoritative:
- Firestore Rules still require the server request time to be at least 15 minutes after the exact stored `startedAt`;
- the provider preserves the exact stored `startedAt` across the fresh-session mutation;
- once the 15-minute gate is satisfied, `endedAt` is the Firestore server `request.time`, avoiding client reconstruction of a Rules-sensitive timestamp;
- the new exact private session may take over `activeSessionId` without resetting or duplicating the Transfer Challenge;
- the resulting phase is `GUESS_ENTRY`.

The r38 lazy-load repair for Multi Season / Journey Reconnect remains included, so an unavailable-at-module-load History Convergence provider is no longer permanently frozen before Season 1 is accepted.

The four-hour exact private-session lifetime remains unchanged. Existing rivalry, league, permanent clubs, Career Start acknowledgements and the already-started Transfer Challenge are preserved. Remote Joining stays exact/private with no public discovery.

Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. SSJR-1.1 remains exactly `0/100`; physical acceptance credit still requires successful completion on the real iPhone + Chromebook journey.
