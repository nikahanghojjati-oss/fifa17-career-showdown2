# Career Mode Showdown v1.9.1 — Runtime r41

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r41`
Previous known-good runtime: `1.9.1-r40`

r41 is the final pre-physical-acceptance identity and season-summary hardening release.

The player-facing account flow now supports safe reuse of the same Google account during testing without permanently pinning that account to Daniel or Nik. `FORGET THIS DEVICE` still revokes the registered browser, clears the browser's selected player identity, and signs the account out. After the previous Showdown has been provider-confirmed closed, the same Google account may sign in again and choose either canonical manager for a new Showdown. Active Showdowns and live pending pairings remain protected from role switching.

Firestore Rules enforce the same boundary: a pair link may change its Daniel/Nik role only when the prior rivalry is closed and the account is actually entitled to the requested canonical role in the new rivalry. An active rivalry cannot be replaced, and expired pending-pair replacement remains same-manager only.

Shared History now makes the cumulative competition state explicit after every accepted season. In addition to the season-specific canonical score, both managers see the accepted-season count, cumulative Showdown points, current leader and point gap, manager records, and trophy attribution.

The four-hour private-session lifetime remains unchanged. A private session is a temporary access capability, not the durable career. When it expires, Daniel and Nik open/join a fresh ACTIVE private session for the same rivalry and resume the already committed league, permanent clubs, season cursor, results, score and history. The Showdown is not redrawn or reset.

The generated production lifecycle remains defined for 1, 3, 5 and 10 seasons. The 10-season path includes expiry of the original private session after Season 5 followed by continuation on a fresh four-hour session.

Firebase remains Spark-only. Billing remains permanently OFF. Cloud Run and Cloud Functions remain unused. App Check enforcement remains OFF. No public discovery, lobby, matchmaking or rankings are introduced.

Physical iPhone + Chromebook acceptance remains the final human gate.
