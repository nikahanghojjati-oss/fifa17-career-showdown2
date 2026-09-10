# r17 Final Reconciliation candidate boundary

This document establishes the connector-authored candidate and publication boundaries for the frozen MDP `final-reconciliation` capability. It does not award MDP or SSJR credit.

Base authority is exact accounting main `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`, where MDP is `91.00/100` and SSJR-1.1 remains `0/100`.

## Candidate behavior

r17 composes the already-integrated Shared Multi Season terminal state, Shared History Convergence projection, and Local Reconciliation safety state into one read-only terminal Shared Showdown projection. It requires the exact configured 1/3/5/10 season plan to be complete, all accepted seasons to be contiguous, History Convergence to verify the same rivalry/revision key/league/fixed clubs, and Local Reconciliation to be in a non-destructive ready state.

The final winner reuses the existing accumulated Showdown-points authority: compare cumulative canonical manager `totalPoints`; equal totals remain a draw. r17 deliberately introduces no new cross-season tiebreaker. The projection has `nextSeason:null`, `extraSeasonAllowed:false`, and `terminalCloseRequired:true`, so no additional season can be created and Terminal Close remains a separate later MDP capability.

r17 performs no canonical local Save mutation, no automatic Candidate C Apply, no provider write, no broad list, and no new Firestore collection or Rules surface. Firebase remains Spark-only, Billing remains OFF, App Check enforcement remains OFF, and no Cloud Run/Cloud Functions dependency is introduced.

The two r17 runtime assets are included in the service-worker shell before release publication to prevent the reload/cache defect class previously discovered during r14.

## Guarded build evidence

The first guarded build attempt failed before any product commit because the deterministic test fixture accidentally produced equal cumulative totals while expecting `playerOne`; product logic correctly returned `draw`. The fixture was corrected only to create the intended non-tie case, while a separate explicit equal-total test remains to prove that Final Reconciliation does not invent a tiebreaker.

The second guarded attempt passed all substantive product validation but refused final self-clean because the temporary builder script had been intentionally modified by the bounded fixture correction and plain `git rm` rejected deletion. No product commit was pushed from that failed attempt.

The third guarded build passed end-to-end. On the exact generated product bytes it passed focused r17 deterministic/production/two-context browser audits, the complete aggregate `npm run test:ssjr` contract floor, all 73 POS20 operations tests, dynamic static-release contracts, offline-hotfix/service-worker contracts, `git diff --check`, and the exact 10-file r17 product-diff allowlist.

The validated product commit is `32b3d398df53b7e5ba1130a9b0ee6448d1f852fa`; the self-clean commit is `8edfe423605d5f6f0705c27e4fb3dc2adc848e07`. The first connector-authored candidate boundary was exact head `e78e2a63af59eb06e7e452fcbf4310c8a7d8bd0d`.

Normal PR POS20 run #402 passed every selected lane and the exact-head cognitive seal on that exact `e78e2a63...` pre-publication candidate. No evidence from other heads is combined with that result.

## Publication evidence

Publication attempt 1 at workflow-staging head `522a879a681859799ba6f0358f9c2b831d78c0a5` failed before any job existed because an embedded multiline release-note string broke YAML parsing. It changed no release bytes and is historical mechanics evidence only.

Publication attempt 2 at workflow head `45ad211618bf7fe6930661a29df572bcd40497fa` successfully generated the r17 shell in its runner and passed focused r17 proofs plus the dynamic static-release contract, but `release-shell-coherence-contracts.cjs` correctly rejected the release note because it omitted the retained `Remote Joining` statement required of every promoted whole shell. Commit/self-clean was skipped, so no release bytes were pushed. That head and its incidental PR POS20 activity are historical only.

Publication attempt 3 changed only the release-note construction to truthfully retain the existing Private Remote Joining foundation and exact `App Check enforcement remains OFF` statement. Guarded publication run `34532329066` passed its candidate-ancestor check, coherent r17 shell generation, focused Final Reconciliation tests, production runtime contract, static release contract, release-shell coherence contract, offline-hotfix contract, all POS20 operations tests and `git diff --check`, then self-cleaned and pushed bot publication commit `6808d7d6dcc2622a060eb23a342402a919226ea8`.

The published whole shell is `1.9.1-r17`; its previous known-good recovery runtime is `1.9.1-r16`. `RELEASE_V1.9.1_R17.md` truthfully retains Private Remote Joining, Firebase Spark-only, permanent Billing OFF and App Check enforcement OFF. No new provider/list/Firestore authority is introduced.

The first connector-authored final publication boundary was `0fefe2c2a7ee886bfcc2d6c3f96f266e1116576e`.

## Codex P1 hardening boundary

The requested Codex review of exact pre-publication code `e78e2a63af59eb06e7e452fcbf4310c8a7d8bd0d` returned two credible P1 findings after publication had already been staged. Both findings supersede merge eligibility of `0fefe2c2...` and any POS20 activity on it; no MDP credit was awarded.

P1-1: Final Reconciliation accepted a safe Local Reconciliation phase without explicitly matching its `managerRole`, `profileId`, and `saveId` to the corresponding verified History Convergence manager slot. The corrected protocol now requires the local state to preserve all non-destructive safety flags and to match both the verified `managerSlots` entry and the corresponding manager record before a completed Showdown can be projected. A stale or tampered local binding from another manager/save is rejected.

P1-2: the production compositor originally checked the active Showdown only before awaited dependency refreshes and then read dependency caches. The corrected compositor captures an exact `saveId + rivalryId` request, uses the actual returned refresh snapshots, checks current context after each await, requires Multi Season and History snapshots to match the same rivalry plus Local Reconciliation to match the same local save, checks again immediately before publication, and uses context-aware in-flight dedup. A different save/rivalry may start its own refresh instead of waiting behind stale work, and old in-flight work is discarded rather than rendered with the new manager names.

The focused deterministic contract now rejects mismatched save binding and unsafe automatic-Apply flags while proving either manager can converge when its own exact slot binding is valid. The two-context browser audit now also holds one manager refresh in flight, switches to a different save/rivalry, proves the new context is not deduplicated behind the old request, proves both stale results are suppressed, and proves the original context can recover on a new exact refresh with zero storage writes.

The connector commit containing this hardening document and code is the only r17 head eligible for fresh validation. Earlier #402 evidence, publication staging heads, bot-only publication commit `6808d7d6...`, and superseded connector head `0fefe2c2...` are historical only and must never be combined with the corrected candidate.

## Final acceptance boundary

A fresh normal PR POS20 must pass every selected lane and the exact-head cognitive seal on the exact connector-authored P1-hardening head. If it passes, review threads must be rechecked and resolved only after the code addresses them; then PR #248 may be marked ready and merged only with expected-head protection.

r17 still earns no product-integration credit until the merged exact main is coherently deployed, exact-main POS20 passes, and two independent Release Integration Burn-In journeys pass. Only after those proofs may a separate accounting authority move Final Reconciliation from design-only to fully integrated and raise MDP from `91.00/100` to `93.70/100`.
