# Career Mode Showdown v1.9.1 — Runtime r38

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r38`
Previous known-good runtime: `1.9.1-r37`

Physical iPhone + Chromebook testing exposed two production-only failures after a fresh private session resumed an already-running Transfer Challenge.

Observed:
- both devices reached the existing Season 1 Shared Transfer Challenge at `00:00`;
- the automatic timeout transition was rejected with `permission-denied`, so neither device could advance to Guess Entry;
- Journey Reconnect simultaneously reported `JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE` and left the stale `FRESH PRIVATE SESSION REQUIRED` banner visible even after a fresh session had been established.

r38 fixes both root causes.

1. Transfer Challenge timestamps are now preserved as exact Firestore Timestamp values across mutations. Previously the provider converted server-owned timestamps to milliseconds and rebuilt them on the next write. Firestore Rules require `startedAt` and prior lock timestamps to remain exactly unchanged and require timeout `endedAt` to equal the exact server `startedAt + 15 minutes`. Reconstructing those timestamps could lose sub-millisecond precision and cause the real provider write to be denied. Timeout advancement now preserves the exact stored `startedAt`, derives `endedAt` from that exact timestamp, and preserves prior private lock timestamps unchanged.

2. Multi Season Progression no longer freezes the History Convergence provider at browser module-evaluation time. The history provider is now resolved only when an accepted season actually requires it. This removes the browser-only lazy-load race that caused Journey Reconnect to report `PROGRESSION_NOT_AUTHORITATIVE` before Season 1 had even been accepted.

A production-Rules emulator regression now proves the exact physical recovery case: an old-session `WINDOW_OPEN` challenge already beyond 15 minutes advances under a fresh ACTIVE session, migrates its `activeSessionId` without resetting the challenge, preserves exact server timestamp precision, and reaches `GUESS_ENTRY`.

The four-hour exact private-session lifetime from r37 remains unchanged. Existing rivalry, Bundesliga/club setup, Career Start acknowledgements and Transfer Challenge state are preserved. Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. SSJR-1.1 remains exactly `0/100`; physical acceptance credit still requires successful completion on the real two-device journey.
