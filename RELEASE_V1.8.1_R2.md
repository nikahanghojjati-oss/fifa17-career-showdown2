# Career Mode Showdown v1.8.1 — Runtime r2

Status: RELEASED — PRODUCTION DEPLOYED AND ARTIFACT-PROVEN

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

## Production promotion evidence

Release PR: `#144`
Final exact PR head: `bc93407decbc5b8300013f1e23b558d686174566`
All permanent PR workflow families green: `14/14`
Unresolved review threads at merge: `0`
Squash merge/live runtime main: `f3d26f5f9b8cee8996ecff296d6ca9bcc2c3fb18`
Merge tree: `e0ddc2e360a345705957bb535fd57fbfec3843a3`
GitHub Pages run: `32863192183` — success
Generated Pages artifact: `9569006078` / `sha256:5f00a4e07cd803d2e16b1d59d3cd46063923e96e53bd388469b1e8c0996409f0`

The deployment artifact was opened and targeted runtime identity/edge-case checks passed: r2 shell identity, r1 declared previous revision, immutable full-ID clipboard source/fallback, complete manual selection fallback, and skipped-release recovery helpers. Durable-ID shortening remains rejected. This release does not change Firestore Rules or provider/security locks and earns zero RJR points.
