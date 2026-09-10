# r17 Final Reconciliation candidate boundary

This document establishes the connector-authored candidate boundary for the frozen MDP `final-reconciliation` capability. It does not award MDP or SSJR credit.

Base authority is exact accounting main `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`, where MDP is `91.00/100` and SSJR-1.1 remains `0/100`.

## Candidate behavior

r17 composes the already-integrated Shared Multi Season terminal state, Shared History Convergence projection, and Local Reconciliation safety state into one read-only terminal Shared Showdown projection. It requires the exact configured 1/3/5/10 season plan to be complete, all accepted seasons to be contiguous, History Convergence to verify the same rivalry/revision key/league/fixed clubs, and Local Reconciliation to be in a non-destructive ready state.

The final winner reuses the existing accumulated Showdown-points authority: compare cumulative canonical manager `totalPoints`; equal totals remain a draw. r17 deliberately introduces no new cross-season tiebreaker. The projection has `nextSeason:null`, `extraSeasonAllowed:false`, and `terminalCloseRequired:true`, so no additional season can be created and Terminal Close remains a separate later MDP capability.

r17 performs no canonical local Save mutation, no automatic Candidate C Apply, no provider write, no broad list, and no new Firestore collection or Rules surface. Firebase remains Spark-only, Billing remains OFF, App Check enforcement remains OFF, and no Cloud Run/Cloud Functions dependency is introduced.

The two r17 runtime assets are included in the existing service-worker shell before release publication to prevent the reload/cache defect class previously discovered during r14.

## Guarded build evidence

The first guarded build attempt failed before any product commit because the deterministic test fixture accidentally produced equal cumulative totals while expecting `playerOne`; product logic correctly returned `draw`. The fixture was corrected only to create the intended non-tie case, while a separate explicit equal-total test remains to prove that Final Reconciliation does not invent a tiebreaker.

The second guarded attempt passed all substantive product validation but refused final self-clean because the temporary builder script had been intentionally modified by the bounded fixture correction and plain `git rm` rejected deletion. No product commit was pushed from that failed attempt.

The third guarded run passed end-to-end. On the exact generated product bytes it passed:
- focused r17 deterministic, production and two-context browser audits;
- the complete aggregate `npm run test:ssjr` contract floor;
- all 73 POS20 operations tests;
- dynamic static-release contracts;
- offline-hotfix/service-worker contracts;
- `git diff --check`;
- the exact 10-file r17 product-diff allowlist.

The validated product commit is `32b3d398df53b7e5ba1130a9b0ee6448d1f852fa`; the self-clean commit is `8edfe423605d5f6f0705c27e4fb3dc2adc848e07`. Temporary builder/workflow files are absent from the net product diff.

## Acceptance boundary

The connector commit containing this document is the only r17 candidate head eligible for normal PR POS20. The branch must remain frozen while that exact head validates. Failed, bot-only or superseded heads are historical evidence only and must never be combined with the final candidate.

If exact-head candidate POS20 passes, r17 still earns no product-integration credit yet. Publication must coherently advance the whole shell from `1.9.1-r16` to `1.9.1-r17`, retain r16 as the previous known-good runtime, receive a fresh final publication-head POS20, merge with expected-head protection, deploy coherently, pass exact-main POS20 and two independent Release Integration Burn-In journeys. Only then may separate accounting move Final Reconciliation from design-only to fully integrated and raise MDP from `91.00/100` to `93.70/100`.
