# Career Mode Showdown v1.8.1 — Runtime r2

Status: RELEASE CANDIDATE

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r2`
Previous known-good runtime: `1.8.1-r1`

## Scope

This bounded runtime hotfix improves recovery of an already-paired Connected Rivalry on mobile without changing pairing, Firestore authority, gameplay state, or local Save authority.

- a saved Connected Rivalry ID is now populated as the real input value rather than placeholder-only text;
- the complete durable rivalry ID is visibly rendered and wraps on narrow mobile screens;
- the ID remains selectable text;
- an explicit `COPY RIVALRY ID` control uses the Clipboard API with a selection/copy fallback;
- existing Attach / Refresh / Publish / Preview / Candidate C Apply semantics are unchanged.

## Identifier decision

The durable identifier remains exactly `pair_` plus 64 lowercase hexadecimal characters (256 random bits). It is not shortened by this hotfix. The established value is both the private pairing capability format and the durable Connected Rivalry identity used by Firestore documents, local pointers, authorization contracts, shared-state paths and prior production evidence. Shortening or migrating it inside this recovery hotfix would risk breaking an already-proven rivalry and would reduce or complicate capability security.

The UI may continue to show a short fingerprint where only recognition is needed; recovery surfaces now expose the complete exact ID and a copy action.

## Preserved boundaries

- Firebase Spark / zero billing remains unchanged.
- App Check enforcement remains OFF.
- Firestore remains memory-only.
- Google authentication remains popup-only with `browserSessionPersistence` and no extra scopes.
- Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.
- Candidate C remains the only destructive remote-to-local Apply authority.
- Remote Joining Stage 5 remains locked.
- No public discovery, matchmaking, community system, rankings or global leaderboard is introduced.
- This UX fix receives no RJR-1 points; readiness remains `78/100` until separate capability evidence is completed.
