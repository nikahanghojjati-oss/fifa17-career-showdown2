# Career Mode Showdown v1.9.1 — Runtime r39

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r39`
Previous known-good runtime: `1.9.1-r38`

Physical iPhone + Chromebook testing showed that the existing Season 1 Shared Transfer Challenge could correctly resume at `00:00` under a fresh Remote Joining session but the timeout transition itself was still rejected by production Firestore Rules with `permission-denied`.

The r38 production emulator reproduced that exact failure, so r39 changes the timeout contract at the provider/Rules boundary rather than masking it in the UI.

The authoritative rule is now:
- the Transfer Window may advance only when Firestore `request.time` is at least 15 minutes after the immutable stored `startedAt`;
- the transition to `GUESS_ENTRY` records `endedAt == request.time`, using the same Firestore server timestamp already used by other accepted shared mutations;
- `startedAt` remains immutable and exact;
- the challenge's existing revision/history, rivalry, season, coordinator and role state remain unchanged;
- a fresh exact private session may take over `activeSessionId` without redrawing or restarting the Transfer Challenge.

This removes the fragile requirement that the browser synthesize a timestamp exactly equal to `startedAt + 15 minutes` while still preventing any early timeout transition. The four-hour exact private-session lifetime remains unchanged.

r38's second fix is retained: Multi Season Progression resolves History Convergence lazily at call time, preventing the browser load-order race that produced `JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE` before Season 1 had been accepted.

A production-Rules emulator gates the physical recovery case before deployment: an old-session `WINDOW_OPEN` already beyond 15 minutes must advance under a fresh ACTIVE session, preserve the exact original `startedAt`, migrate authority to the fresh session, record server-time completion, and reach `GUESS_ENTRY` without reset.

Remote Joining remains private and exact-path only. Existing rivalry, Bundesliga/club setup, Career Start acknowledgements and Transfer Challenge state are preserved. Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. SSJR-1.1 remains exactly `0/100`; physical acceptance credit still requires successful completion on the real two-device journey.
