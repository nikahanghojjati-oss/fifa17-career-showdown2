# Handoff Proximity — Deterministic Transfer Readiness HTR-1

Owner direction: 2026-09-06.

This file replaces every earlier visible-percentage interpretation of `Handoff proximity` wherever older continuity prose conflicts with it. Handoff proximity now measures only successor transfer readiness.

## Definition

`Handoff proximity` measures how completely the current Work environment has been converted into durable, independently recoverable successor authority.

It is not product completion, roadmap completion, CI progress, PR publication progress, SSJR progress, or an estimate of how long the current environment can continue.

The metric is intentionally stable. It is computed from five repository-verifiable transfer pillars worth exactly 20 points each. A pillar is earned only when its evidence exists durably in repository state. Once earned during one handoff cycle, a pillar is append-only and must not be removed merely because later engineering work discovers a test failure, review finding, deployment problem, or new blocker. Those facts change the recorded work status and blocker; they do not erase already-established transfer recoverability.

## HTR-1 pillars

1. `durable-state` — 20 points
   - All substantive current work is committed or otherwise durably checkpointed.
   - No material implementation decision exists only in chat.

2. `authority-snapshot` — 20 points
   - Current live main, active branch/PR/head, runtime/deployment authority, readiness authority, and current lane are recorded with exact identifiers where available.

3. `open-work-classified` — 20 points
   - Every known unresolved failure, blocker, rejected approach, or unfinished operation is explicitly classified.
   - A known technical failure is compatible with this pillar when the failure is durably named with a safe next action. Hidden or unclassified failure is not.

4. `successor-execution-contract` — 20 points
   - The immediate next task, permanent locks, predecessor non-inheritance rule, first safe action, and scope stop are explicit enough for a fresh environment to resume without asking the owner to reconstruct context.

5. `sealed-transfer-package` — 20 points
   - The WEC/archive, current pointers, canonical starter/deep handoff, and owner-facing SNS are coherent at one exact boundary.
   - The WEC is `transition-prepared` or `closed`, `handoffCompleteness` is 100, `unrecordedDecisions` is 0, and `atomicOperation` is false.

`Handoff proximity = 20 × number of earned HTR-1 pillars`.

Only these values are valid: `0`, `20`, `40`, `60`, `80`, `100`.

## Monotonicity rule

Within one handoff cycle, Handoff proximity is monotonic. Previously earned pillars remain earned. New engineering evidence can create a blocker that must be recorded, prevent the final transfer-package pillar until the package is coherent, or require a new successor task. It must not make the visible Handoff proximity bounce backward after transfer evidence already exists.

If a previously claimed pillar was factually false, correct the repository record and explicitly classify that as a metric-recording defect. Do not silently rewrite the percentage.

## Meaning of 100%

`Handoff proximity: 100%` means one thing only:

> A fresh environment can resume immediately and safely from durable repository authority with no hidden chat-only dependency and no atomic operation abandoned in flight.

It does not mean the current PR is merged, all tests are green, the product is complete, or SSJR is 100. An open PR or known failing check may be handed off at 100 when its exact state and safe next action are fully classified and the transfer package itself is sealed.

At 100%, automatically provide the current repository-first SNS and stop before beginning another substantial milestone.

## Reporting rule

Every substantive project progress response keeps the owner’s standard line:

`Handoff proximity: X%`

The percentage must come from HTR-1 repository transfer state. Report engineering health separately through `Current lane`, `Next unlock`, and `Blocker`; never encode those changing technical conditions by arbitrarily moving Handoff proximity backward.

No resource-budget, allowance, elapsed-session, context-budget, or similar capacity signal is an HTR-1 input. The visible percentage is derived exclusively from durable repository transfer evidence.

## Tooling authority

`scripts/handoff-proximity-stage.mjs` is the deterministic executable authority for HTR-1. `npm run work:proximity` reads `WORK_ENVIRONMENT_STATUS.json` and computes the score from its append-only `handoffTransferReadiness.earnedPillars` array.

`npm run test:handoff-preflight` must remain green before claiming a newly sealed transfer package when the environment can run it. If a validation failure is the reason for handoff, record the exact failure and safe next action; do not disguise it as transfer unreadiness after the first four pillars have already been earned.

This policy is recursive. Every successor environment inherits HTR-1 unless the owner explicitly replaces it with a later deterministic repository-state model.
