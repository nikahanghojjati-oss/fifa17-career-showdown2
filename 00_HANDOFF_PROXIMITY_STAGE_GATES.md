# HANDOFF PROXIMITY STAGE GATES — OWNER OVERRIDE V2

Owner direction: 2026-09-06.

This file replaces the old heuristic interpretation of `Handoff proximity` wherever older continuity prose conflicts with it. WEC still owns transition urgency and may require an earlier handoff. This file owns the visible percentage reported to the owner.

## Why this change exists

The previous percentage could race into the high 90s while broad contracts, review, merge or post-merge validation could still uncover entire classes of work. In practice, `99%` sometimes meant hours of unknown cleanup. That made the number misleading and encouraged maintenance loops.

`Handoff proximity` now means clean-stop readiness: how close this environment is to a bounded, evidence-complete repository state from which the successor handoff/SNS can be generated immediately. Raw context pressure is not folded into this percentage. WEC reports transition pressure separately.

The percentage may decrease when a newly discovered blocker invalidates a later stage. It must not hover at 99% while unresolved failures, unknown broad gates or repository mutations remain.

## Canonical stage gates

Use `npm run work:proximity -- --stage <stage>` when a local shell is available. In connector-only environments, use the same stage table directly and cite the live evidence that justifies the stage.

| Stage | Canonical proximity | Required meaning |
|---|---:|---|
| `active-work` | 45% | Product/engineering work is still materially in progress. |
| `targeted-validation` | 60% | The implementation batch exists and targeted validation/corrections are underway. |
| `terminal-validation-pending` | 70% | The final local/contract preflight for the bounded batch has not yet reached terminal green. |
| `terminal-validation-green` | 80% | The bounded batch passes its terminal local/contract preflight; publication-grade CI has not yet completed. |
| `publication-gate-pending` | 85% | The exact publication candidate is frozen and the full required gate is running/pending. |
| `publication-gate-green` | 90% | Every required publication workflow family is green on the same exact candidate head. |
| `review-merge-ready` | 93% | Review is clean/resolved and expected-head protection has been reverified. |
| `merged-main-verified` | 96% | Merge/publication completed and exact live main is independently verified. |
| `post-publication-gate-pending` | 97% | Required post-publication/post-merge verification is running. |
| `post-publication-green` | 98% | Required post-publication/post-merge verification is fully green. |
| `handoff-package-sealed` | 99% | WEC/archive/SLE handoff package is fully sealed, no branch mutation remains, and only final owner-facing SNS emission/clean stop remains. |
| `handoff-ready` | 100% | All repository work for the environment is complete and coherent; generate SNS immediately and stop. |

A task that does not require PR/merge/deployment may skip inapplicable publication stages, but it may not claim a later stage until all evidence applicable to that task is complete.

## Hard caps and anti-99 rules

1. Any unresolved meaningful failure caps Handoff proximity at 70%.
2. Any atomic/unsafe-to-interrupt mutation caps it at 60%.
3. Any unrecorded material decision caps it at 80%.
4. Handoff recording below 90% completeness caps it at 85%.
5. `99%` requires a `transition-prepared` or `closed` WEC, `handoffCompleteness: 100`, zero unresolved failures, zero unrecorded decisions and no atomic operation.
6. `100%` has the same requirements as 99% plus live evidence that every applicable publication/post-publication gate is already complete. At 100%, generate the complete SNS immediately and stop before new product work.
7. Never report 99% because “only CI remains” when CI can still reveal unclassified failures. Pending broad CI is 85% or 97% depending on whether it is pre-merge or post-merge.
8. Never keep 99% unchanged after discovering a new blocker. Move back to the stage supported by current evidence.

## CI and wording-loop prevention

The project must not spend hours discovering one historical wording mismatch per full workflow fanout.

1. Before opening a PR for an ordinary implementation batch, run the smallest targeted tests and `npm run test:handoff-preflight` when authority/handoff files changed. Open the PR only after that fast preflight is green when the environment has a usable local shell.
2. In connector-only environments, inspect the whole failing assertion class before the next write and batch all coherent file changes into one Git tree/commit when the connector supports it. Do not create one commit per wording correction.
3. Once a PR exists, stale workflow runs from prior heads are diagnostic history only. Publication authority comes only from the latest exact head.
4. Do not run or wait for the entire permanent matrix after each tiny correction. Use targeted/preflight evidence to build the final candidate, then require the complete matrix once at the publication boundary.
5. The final transition-prepared WEC seal remains the last branch mutation. If a later mutation occurs, the seal is invalid and must be regenerated.

## Product-work priority

This stage model works together with `00_BUILD_FIRST_PRODUCT_POLICY.md`. A normal focused session should spend roughly 75% of its effort building the playable product and 25% validating/maintaining it. The purpose of validation is to protect product work and make future building faster, not to become the dominant project activity.

For the current SSJR roadmap, once genuine production two-account Shared Setup evidence is accepted, move directly into the next authorized transfer/results/scoring product capability rather than extending the proof lane.
