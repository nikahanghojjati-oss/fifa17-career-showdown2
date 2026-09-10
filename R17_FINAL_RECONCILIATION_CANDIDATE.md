# r17 Final Reconciliation candidate boundary

This document establishes the connector-authored candidate/publication boundary for frozen MDP capability `final-reconciliation`. It does not award MDP or SSJR credit.

Base accounting authority is exact main `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`, where MDP is `91.00/100` and SSJR-1.1 is `0/100`.

## Frozen behavior

r17 composes authoritative Shared Multi Season terminal state, Shared History Convergence and non-destructive Local Reconciliation into one read-only completed-Showdown projection. It requires an exact complete 1/3/5/10 season plan, contiguous accepted seasons, matching rivalry/revision key/league/fixed clubs, and an exact manager-local `managerRole + profileId + saveId` binding to the verified History Convergence slot/record. Candidate C remains the only destructive local Apply route.

The final winner is the existing accumulated canonical Showdown-points authority. Higher cumulative manager `totalPoints` wins; equal totals remain a draw. r17 creates no new cross-season tiebreaker. It exposes `nextSeason:null`, `extraSeasonAllowed:false` and `terminalCloseRequired:true`; Terminal Close remains a distinct later MDP capability.

r17 performs no canonical local Save mutation, automatic Candidate C Apply, provider write, broad list, new Firestore collection or Rules expansion. Firebase remains Spark-only, Billing permanently OFF, App Check enforcement OFF, and no Cloud Run/Functions dependency is introduced.

## Historical build/publication evidence

The initial guarded build caught a bad non-tie test fixture before product commit. A later guarded attempt passed product validation but refused self-clean. The final guarded build produced the validated r17 product. Original exact connector candidate `e78e2a63af59eb06e7e452fcbf4310c8a7d8bd0d` then passed complete POS20 #402, but was later superseded by Codex findings.

Publication attempt 1 (`522a879...`) was YAML-invalid before any job; attempt 2 (`45ad211...`) generated the shell but was stopped by the release-coherence contract because the release note omitted retained Remote Joining wording; attempt 3 passed guarded publication and pushed bot whole-shell r17 commit `6808d7d6dcc2622a060eb23a342402a919226ea8`. Connector publication boundary `0fefe2c2a7ee886bfcc2d6c3f96f266e1116576e` was superseded before merge. No MDP credit was awarded.

## Codex review round 1

Codex review of exact head `e78e2a63...` found two credible P1s:

1. Local Reconciliation safe phase was accepted without explicit equality of `managerRole/profileId/saveId` to the verified history slot/record.
2. Production dependency refreshes were asynchronous but active Showdown context was not revalidated after awaits, allowing stale A state to risk publication under B.

Connector hardening head `846a334032e1be496218595897b2d62b172f28f6` fixed both: it requires exact local manager binding and non-destructive safety flags, captures a save+rivalry context, uses returned dependency snapshots, checks context after each await and before publication, and uses context-aware in-flight dedup. Its focused tests added cross-manager binding and in-flight rivalry-switch coverage.

Fresh complete POS20 #413 (`34533978186`) passed every selected lane and exact-head cognitive seal on `846a3340...` only. That result is historical because review round 2 below found additional P1 defects before merge.

## Codex review round 2

Codex re-reviewed exact head `846a334032e1be496218595897b2d62b172f28f6` and found two further credible P1s:

3. `pfrRequest()` used retained legacy `currentShowdown.id`; canonical pairing/local binding uses `currentShowdown.identity.saveId`. Normal Save Library-backed refreshes would therefore reject their own valid local binding. The correction now reads only canonical `identity.saveId`, validates the stable `save_[0-9a-f]{24}` form, and keeps legacy `id` deliberately non-canonical in the browser proof so this cannot regress unnoticed.
4. Context-mismatch branches returned null without necessarily invalidating a previously published global `view`. A completed Showdown A could remain visible and be relabeled with Showdown B manager names. The correction scopes published view state by the exact canonical `saveId + rivalryId` key. `getState()` exposes a view only for the current key, render uses only the current-key view, starting a different context invalidates the old logical view, and stale old work may discard only a view that it owns so late A cannot erase valid B.

Connector head `0b2a429672e2aa725da8c118caa9e4a881790b69` implemented those corrections and entered fresh POS20 #409. Its green work is historical because review round 3 found the remaining rendered-panel invalidation gap before merge.

## Codex review round 3

Codex review of exact head `0b2a429672e2aa725da8c118caa9e4a881790b69` found one additional credible P1: Save Library `runtimeSwitchActiveSave()` replaces `currentShowdown` through `runtimeSetCurrentShowdownReference()` but emitted none of the events Final Reconciliation listened to. Logical `getState()` had become context-safe, yet the already-rendered A panel could remain onscreen until the 15-second poll; an A→B→A switch before that poll could also make retained A state accessible again.

The bounded correction is centralized in `js/saveLibraryRuntime.js`, not the UI button path. `runtimeSetCurrentShowdownReference()` now derives the previous/current canonical `identity.saveId` plus shared `rivalryId`, mutates the in-memory active Showdown, and synchronously dispatches `career-mode-active-save-changed` whenever that exact active context changes. The same central setter already owns active-save switch, active clear/delete, activation and other legitimate reference transitions, so the notification is authority-level rather than UI-specific.

`js/productionSharedFinalReconciliation.js` now subscribes to `career-mode-active-save-changed` in addition to its existing state-change events. Because browser event dispatch is synchronous, its wake path immediately clears/renders away an old-context view before starting the new asynchronous refresh; no polling delay is required. The production contract statically requires both the central Save Library dispatch and Final Reconciliation subscription, while the browser audit requires that the compositor actually registers the listener. Existing canonical save identity, exact manager binding, returned-snapshot checks, context-aware in-flight dedup, owned-view discard, no-extra-season and zero-write protections remain intact.

Guarded one-shot run `34535381957` applied that exact correction from superseded head `0b2a4296...`, then passed `npm run test:ssjr:final-reconciliation`, the aggregate `npm run test:ssjr`, `npm run test:ops`, static release contracts, release-shell coherence, offline-hotfix/service-worker contracts and `git diff --check` before self-cleaning. It pushed bot product commit `6bce558be80b5dcd2bb5ef9e9d88c4d9fb1f0e6a`. The temporary workflow is absent from the resulting product head.

## Sole eligible boundary

The connector commit containing this review-round-3 provenance is the sole r17 candidate eligible for fresh acceptance. POS20 #402, #413, #409/#410 activity, all prior publication staging heads, bot publication `6808d7d6...`, connector `0fefe2c2...`, connector `846a3340...`, connector `0b2a4296...`, workflow staging `b85b5ab0...`, and bot product head `6bce558b...` are historical/provenance only and must never be combined with the final candidate.

The corrected exact connector head must pass every selected normal PR POS20 lane and exact-head cognitive seal. Codex/review threads must then be rechecked; addressed threads may be replied to and resolved only after the corrected head's validation is complete. PR #248 may then be marked ready and squash-merged only with exact expected-head protection.

After merge, r17 still earns no MDP integration credit until exact main/deployment is verified, exact-main POS20 passes, and two independent Release Integration Burn-In journeys succeed. Only then may separate accounting raise MDP from `91.00/100` to `93.70/100`.
