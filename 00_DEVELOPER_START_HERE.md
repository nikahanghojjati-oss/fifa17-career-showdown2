# DEVELOPER START HERE — POS v2

This is the current low-context entrypoint for Career Mode Showdown.

Do not preload historical handoffs, old START_NEXT_SESSION files, old RJR milestone records or the entire continuity archive. Current verified source and later owner instructions win.

## Minimum startup set

Read only these first:

1. `AGENTS.md`
2. `PROJECT_OPERATING_SYSTEM_V2.md`
3. `CURRENT_PRODUCT_GUARDS.json`
4. `NEXT_TASK.md`
5. `SHARED_SHOWDOWN_JOURNEY_READINESS.json` and `MILESTONE_DELIVERY_PROGRESS.json`

Then independently resolve live `main`, the active PR/branch/head, relevant current checks, and deployed/provider state only when the current task needs it.

Load another file only because the current task, a concrete failure, or a safety question requires it. Historical handoffs and authority-history remain available as evidence but are not default startup context.

## Current product direction

RJR-1 is complete/frozen 100/100 historical evidence. The active milestone is Shared Showdown Journey.

SSJR answers whether the two-manager journey is genuinely evidence-proven.

MDP answers how far the current milestone capabilities have moved through design, implementation, automated verification, defect resolution, regression retest and product integration.

Continue the exact current dependency in `NEXT_TASK.md`; do not create a documentation, continuity, wording or archive milestone while safe product work is available.

## Current test lanes

`npm run test:contracts` is the blocking current product suite.

`npm run test:ops` is the POS/continuity tooling self-test and is used when those tools change.

`npm run test:legacy-provenance` is a manual historical audit. It is not a normal product-release gate.

Do not require exact workflow counts or old milestone wording. A failure blocks only when it protects meaningful current/future product behavior, security, privacy, data/storage, synchronization, recovery, provider/billing safety, UI/UX, executable authority, evidence validity or release correctness.

## Session quality

Use `npm run work:health` for POS-2 session health. ADB-1 dynamically chooses a failed correction/validation allowance from 2 to 20 based on the specific environment. Two failures alone do not require transfer.

Legacy SHP and HTR percentage commands remain compatibility tools, not normal project metrics.

If a real handoff becomes necessary, run `npm run work:handoff-checklist`. Satisfy the five useful transfer facts and produce one compact current successor snapshot. Do not generate repetitive SNS/VTLS artifacts during ordinary progress.

## Permanent safety

`CURRENT_PRODUCT_GUARDS.json` is the compact authority. Billing remains OFF, Firebase remains Spark, exactly two private managers are allowed, pairing plus exact ACTIVE precedes league/clubs, Candidate C remains the only destructive remote-to-local Apply authority, the three canonical local storage keys remain fixed, public discovery/matchmaking/community/rankings remain forbidden, and `SSJR-DUAL-FULL-SCREEN-1` remains required.

## Rule of thumb

If something is only useful to explain how the project got here, keep it as history.

If it prevents a current or future product defect, security/privacy problem, data loss, recovery failure, provider risk, broken user journey or invalid release, keep it active.

If it helps developers work safely but does not protect the product itself, keep it in the operations lane.
