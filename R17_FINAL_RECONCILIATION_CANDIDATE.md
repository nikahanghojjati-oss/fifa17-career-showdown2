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

The bounded correction is centralized in `js/saveLibraryRuntime.js`, not the UI button path. `runtimeSetCurrentShowdownReference()` now derives previous/current canonical `identity.saveId` plus shared `rivalryId`, mutates the in-memory active Showdown, and synchronously dispatches `career-mode-active-save-changed` whenever that active context changes. `js/productionSharedFinalReconciliation.js` subscribes to that event, so an old-context view is invalidated immediately rather than waiting for polling.

Guarded one-shot run `34535381957` passed focused Final Reconciliation, aggregate SSJR, operations, release-shell/offline checks and `git diff --check` before self-cleaning. Its resulting product was later superseded by review round 4.

## Codex review round 4

Codex re-reviewed exact head `58fc71702eb0bc4590586ac4c81ac732f9a3125c` and found one credible P1 in manager-profile rebinding. `assignSaveManagerProfile()` can replace `currentShowdown.identity.managerProfileIds` while canonical `saveId` and `rivalryId` remain unchanged. The round-3 event comparison therefore suppressed notification, and the Final Reconciliation view key also lacked the active profile mapping. An already-published result could remain associated with an old local profile.

The corrected Save Library active context now includes `playerOneProfileId` and `playerTwoProfileId`, and `runtimeSetCurrentShowdownReference()` synchronously dispatches `career-mode-active-save-changed` whenever either active profile binding changes even if save/rivalry IDs remain constant. Production Final Reconciliation captures both stable active profile IDs in its exact request key, so `getState()` immediately hides a view after profile rebinding. Before reconciliation and publication, `pfrSnapshotsMatch()` requires the current Save Library profile for `localState.binding.managerRole` to equal `localState.binding.profileId`; a retained Local Reconciliation binding for the previous profile therefore fails closed.

The two-context browser audit carries canonical Save Library manager-profile IDs, explicitly changes only the active `playerOne` profile while keeping save+rivalry IDs fixed, proves the old view becomes inaccessible, proves stale Local Reconciliation cannot reconcile under the rebound profile, and proves exact recovery only after the canonical profile mapping is restored.

The first round-4 helper run `34536427820` failed before product mutation because a whitespace-exact fixture guard matched zero times. The second workflow revision was YAML-invalid before a job existed. Neither is product evidence. Corrected guarded run `34536616335` passed focused deterministic + production Final Reconciliation contracts, the two-context browser audit, aggregate `npm run test:ssjr`, `npm run test:ops`, and `git diff --check` before committing product head `5a743e3efe6663542fdedf3d32e0bb7e9ec0d1ad` and self-cleaning to `d62c17b379c5b22d987a990d69da0ca653f97b9b`.

Exact connector candidate `7bf25525c0fe9ff5186275f92dda2e926c9e99d6` then passed full POS20 #416 (`34536774195`) on that exact head, but that green result is historical because review round 5 found another P1 before merge.

## Codex review round 5

Codex review of exact head `7bf25525c0fe9ff5186275f92dda2e926c9e99d6` found a credible live-authority invalidation gap. A published Final Reconciliation view was context-bound by save/rivalry/profile, but if Local Reconciliation changed from a safe phase (`REMOTE_OBSERVED`, `PREVIEW_READY`, `APPLIED`) to blocked/offline/revoked authority without changing those identity fields, the old result could remain exposed while sequential network refreshes ran or stalled.

The correction introduces one production predicate, `pfrLocalAuthorityMatches()`, that requires the latest Local Reconciliation state itself to remain in a safe phase, preserve the non-destructive/Candidate-C safety flags, and match exact save + active role/profile binding. `pfrCurrentView()` now checks the latest Local Reconciliation state before exposing an already-published view. On `career-mode-shared-local-reconciliation-state-change`, `pfrWake(event)` checks the new local authority before any asynchronous dependency refresh and synchronously discards the owned final view when authority is unsafe. The normal snapshot publication path reuses the same predicate, preventing divergent definitions of safe local authority.

The first round-5 guarded run `34537381468` applied the production correction in its ephemeral runner and passed the deterministic/production contracts, but its new event test failed because the dedicated race test context had never called `install()` and therefore had no event listener. No product commit was produced. The fixture was corrected to install the compositor. Guarded run `34537481053` then passed focused deterministic + production contracts, the strengthened browser audit, aggregate `npm run test:ssjr`, `npm run test:ops`, and `git diff --check`; it committed product correction `fddf22e7cb55f4df3e940c3f0f4ddf1c1c27ad13` and self-cleaned to `79177f981135b806a818ec7b2717a7691a4112f3`.

The strengthened browser proof now demonstrates both failure modes independently: an already-unsafe latest Local Reconciliation state makes `getState()` immediately return null, and a blocked Local Reconciliation event synchronously destroys the stored view before asynchronous network work can stall. Fresh safe authority may republish only after exact reconciliation runs again.

## Sole eligible boundary

The connector commit containing this review-round-5 provenance is the sole r17 candidate eligible for fresh acceptance. Every earlier r17 candidate, POS20 run, publication staging head, helper workflow head, bot product head, connector boundary or Codex-reviewed head is historical/provenance only and must never be combined with the final candidate.

The corrected exact connector head must pass every selected normal PR POS20 lane and exact-head cognitive seal. Codex/review threads must then be rechecked; addressed threads may be replied to and resolved only after the corrected head's validation is complete. PR #248 may then be marked ready and squash-merged only with exact expected-head protection.

After merge, r17 still earns no MDP integration credit until exact main/deployment is verified, exact-main POS20 passes, and two independent Release Integration Burn-In journeys succeed. Only then may separate accounting raise MDP from `91.00/100` to `93.70/100`. SSJR remains exactly `0/100` until genuine production-two-account acceptance is separately earned.