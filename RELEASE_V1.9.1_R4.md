# Career Mode Showdown v1.9.1-r4 Production Release

Status: RELEASE CANDIDATE / NOT YET PRODUCTION-PROVEN

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r4`

Previous known-good runtime: `1.9.1-r3`

## Production scope

This runtime revision adds a query-gated guided production acceptance recorder for the existing paired-first Shared Showdown Setup path. The recorder is acceptance tooling and evidence plumbing only; it does not change Shared Setup authority, Firestore Rules, account/session authorization, gameplay scoring, Candidate C authority, or the fixed SSJR score.

With `?ssjr-acceptance=1`, the recorder guides and privacy-safely observes the irreducible two-manager production acceptance through six positive checkpoints:

1. exact pairing plus exact ACTIVE private session before any Shared Setup mutation;
2. authoritative Shared Setup observed at revision 4 (`SEASON_LENGTH_COMMITTED`);
3. identical final Shared Setup observed at revision 6 (`SHOWDOWN_CONFIRMED`);
4. byte-identical canonical local gameplay storage before/after Shared Setup;
5. real browser reload and same-session resume without reset/redraw;
6. fresh ACTIVE private session for the same rivalry resuming the identical final setup without reset/redraw.

The recorder shows one next physical action at a time. It can open the existing Private Remote Joining and Shared Setup panels, arm a real reload proof, and export/download only a sanitized positive draft. It freezes the observed manager role, remote role, account fingerprint, registered-browser fingerprint and rivalry fingerprint for one recorder run and fails closed if those authorities change.

The recorder does not manufacture missing setup facts: the final observation must expose one authoritative league, two distinct clubs whose observed league identities match that league, one supported `1 / 3 / 5 / 10` season length, both distinct manager confirmations, `SHOWDOWN_CONFIRMED`, and exact revision 6.

## Recorder privacy and storage discipline

Raw account, device, rivalry and session authority values are never written to recorder storage or exported. Only SHA-256 fingerprints and Shared Setup facts survive the reload checkpoint.

The recorder does not directly read or write canonical gameplay `localStorage`. It obtains the exact three raw canonical snapshots only through the existing read-only storage authority `captureCareerModeRawBackupInputs()`, hashes the closed snapshot in memory, and persists only the resulting digest. The canonical gameplay keys remain exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Normal gameplay does not load or display the recorder. The recorder asset is requested only when the explicit `ssjr-acceptance=1` query is present.

## Installed-app / whole-shell discipline

`1.9.1-r4` is a new whole-shell runtime because executable browser behavior changed. Reusing the production-proven `1.9.1-r3` identity would permit stale Service Worker or browser-cache state to mix the old SSJR bootstrap with the new acceptance recorder.

The r4 Service Worker shell therefore includes `js/ssjrProductionAcceptanceRecorder.js` and retains the complete existing production Shared Journey dependency chain. `1.9.1-r3` remains the previous production-proven whole-shell recovery target. Never construct a mixed-version rollback.

The strict Shared Setup production evidence recorder and pair validator target exact runtime `1.9.1-r4`; evidence from older or invented runtime revisions is rejected.

## Test discipline

The permanent browser family includes an SSJR recorder audit that proves:

- normal production mode does not request, expose or load the recorder;
- acceptance mode records the positive checkpoints from the production Shared Setup state surface;
- a real browser reload is required for the reload proof;
- a fresh session fingerprint is required for fresh-session proof;
- raw private authority sentinels do not appear in the exported draft or sanitized session storage;
- canonical local gameplay bytes remain unchanged.

All existing permanent workflow families remain mandatory. The recorder earns zero SSJR credit by existing, passing CI, merging or deploying.

## SSJR evidence truth

Fixed `SSJR-1.1` remains `0/100` until genuine two-account production evidence satisfies the fixed readiness model and strict pair validator. The guided recorder is designed to reduce manual evidence work, not to lower or bypass the evidence bar.

The current guided recorder covers the positive Shared Setup journey. The eight required denial proofs per manager remain a separate strict production-evidence boundary until they are safely integrated/aggregated without weakening the validator.

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
- Google authentication remains popup-only with `browserSessionPersistence` and no additional scopes.

## Privacy and product locks

- Exactly two already-paired private managers.
- No public discovery, listing, lobby, matchmaking, community surface, rankings or global leaderboard.
- Shared Setup does not directly mutate the three canonical local gameplay storage keys merely by reading or operating the remote setup.
- Candidate A remains non-mutating, Candidate B remains read-only, and Candidate C remains the sole destructive remote-to-local gameplay Apply authority.

## Publication proof

This section remains intentionally unsealed while PR #212 is open. Production-proven status requires the final exact PR head to pass all 15 permanent workflow families, review threads to be resolved, expected-head merge protection, post-merge workflow proof, and deployed `1.9.1-r4` runtime evidence.

## Recovery

`1.9.1-r3` is the previous production-proven whole-shell recovery target until and after r4 publication. Recovery must use a complete verified shell and must not activate billing or broaden provider authority.