# Milestone Delivery Progress — MDP-1

Owner direction: 2026-09-07.

`MDP-1` means Milestone Delivery Progress. It is the project's engineering-delivery meter for the currently active milestone. It replaces the visible `Estimated focused sessions to genuine SSJR100` forecast, but it does not replace SSJR readiness.

## Why MDP exists

SSJR is intentionally evidence-gated. A feature can be carefully designed, fully implemented, heavily automated, corrected after review, re-tested and even integrated before the fixed SSJR evidence model is allowed to award a point. That makes SSJR the right acceptance/readiness meter but a poor day-to-day view of engineering progress.

MDP measures the different question the owner asked: how much of the current milestone's actual feature work has moved through the complete engineering lifecycle?

The current owner-facing pair is therefore:

```text
Shared Showdown Journey readiness: Y/100
Milestone Delivery Progress: NN.NN/100
```

SSJR remains the stricter fixed evidence score. MDP is the continuously recalculated delivery-maturity score. Neither score is derived from the other.

## Lifecycle scored by MDP-1

Each current-milestone feature progresses through six ordered stages:

1. Design and contract — 10%
2. Implementation — 30%
3. Primary automated verification — 20%
4. Defect and review resolution — 15%
5. Regression re-test — 15%
6. Product integration — 10%

A stage earns its weight only when its exit rule is complete. `in_progress` earns zero for that stage. This keeps the meter conservative while still allowing meaningful movement before human evidence exists.

A feature does not need an invented bug to complete defect resolution. If targeted testing and objective review find no qualifying defect, that triage can close the stage. If defects are found, they must be fixed before the stage closes. Regression re-test then requires the corrected/reviewed candidate to pass its coherent-head gates.

Product integration is deliberately last. Candidate-branch work can reach 90% lifecycle maturity, but runtime behavior does not earn the final 10% until the feature is part of the authoritative product and, when deployment applies, the coherent deployed shell is proven.

## Formula

For each feature:

`feature lifecycle % = sum(completed lifecycle-stage weights)`

`feature MDP contribution = milestone feature weight × feature lifecycle % / 100`

`Milestone Delivery Progress = sum(all feature contributions)`

The result is reported to two decimal places on a 0.00–100.00 scale.

For the current SSJR-1.1 milestone, MDP reuses the exact 20 frozen SSJR capability IDs and exact SSJR weights. It does not modify `SHARED_SHOWDOWN_JOURNEY_MODEL.json`, its dependencies, acceptance scope, evidence layers or credit rules.

For a future milestone, MDP-1 must bind to that milestone's explicit weighted feature map. If no such map exists, define and review it before reporting a score; never invent a denominator opportunistically.

## Current baseline — 39.00/100

The 2026-09-07 baseline was reconstructed from live `main`, PR214/r6, the fixed SSJR-1.1 roadmap, current source modules, browser/contracts, production provenance and the existing SSJR candidate-evidence ledger.

Current classification:

- 2 of 20 capabilities are fully lifecycle-delivered and integrated: `entry-binding`, `entry-before-draw`.
- 4 of 20 are pre-integration complete at 90% lifecycle maturity: `setup-league`, `setup-clubs`, `setup-length`, `setup-confirmation`. PR214/r6 has their design, implementation, automated coverage, reviewed corrections and coherent-head re-test; their final integration stage remains open until r6 is merged and the deployed coherent shell is proven.
- 14 of 20 are design-defined only for MDP purposes. The repository contains substantial reusable local gameplay, Remote Joining, reconnect/conflict, statistics/scoring and Candidate C reconciliation foundations, but those foundations are not counted as completed SSJR-specific implementation until they are wired end to end into the corresponding Shared Journey feature.

Weighted result:

- Shared entry: 10.00 / 10
- Shared setup: 22.50 / 25
- Season lifecycle/results: 2.00 / 20
- Scoring/progression: 2.00 / 20
- Recovery/conflicts: 1.50 / 15
- Completion: 0.50 / 5
- Full-journey release: 0.50 / 5
- Total MDP-1: 39.00 / 100

If PR214's four setup capabilities pass final publication, merge and deployed r6 product proof without invalidating regression findings, each moves from 90% to 100% and MDP rises by 2.50 points to 41.50/100. This change would still grant zero SSJR credit by itself.

## Relationship to SSJR

MDP and SSJR intentionally answer different questions.

MDP answers: how much of the milestone's engineering lifecycle is actually delivered?

SSJR answers: how much of the fixed Shared Showdown Journey acceptance model is supported by all required evidence layers?

MDP commonly leads SSJR because source, tests and integration can exist before unavoidable real-account/physical evidence. There is no hard rule that MDP must always be higher. A regression can reduce MDP; accepted evidence or milestone-specific circumstances can cause the meters to converge differently.

MDP must never be cited as SSJR evidence, never consume SSJR evidence, never lower an SSJR acceptance requirement and never award partial SSJR credit.

## Anti-inflation rules

1. Reusable predecessor code is valuable but does not complete an implementation stage until the current milestone feature is wired end to end.
2. Documentation alone cannot complete implementation, test, re-test or integration stages.
3. A PR, green CI run or merge is not automatically a complete feature; the lifecycle exit rule must actually be satisfied.
4. Candidate work may advance MDP before merge, but it cannot earn product-integration credit.
5. A proven regression invalidates any lifecycle stages it makes untrue; MDP can decrease.
6. Do not create tests or bugs merely to move MDP. Tests protect real feature behavior; bug correction follows actual findings.
7. Human/physical acceptance remains where SSJR requires it. MDP cannot substitute for that evidence.

## Repository authorities

- Tracker definition: `MILESTONE_DELIVERY_PROGRESS_MODEL.json`
- Current ledger: `MILESTONE_DELIVERY_PROGRESS.json`
- Deterministic assessor: `scripts/assess-milestone-delivery-progress.mjs`
- Contract: `tests/contracts/milestone-delivery-progress-contracts.cjs`
- Current SSJR readiness remains: `SHARED_SHOWDOWN_JOURNEY_READINESS.json`
- Current SSJR model remains frozen: `SHARED_SHOWDOWN_JOURNEY_MODEL.json`

Run `npm run mdp:assess` for the deterministic current score. Every substantive owner-facing development update and every successor handoff must report both SSJR and MDP, followed separately by Session Handoff Proximity.
