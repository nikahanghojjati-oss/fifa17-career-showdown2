# Career Mode Showdown — Owner's Eagle Eye Golden Rule

Owner-mandated permanent repository rule, effective 2026-09-03 America/New_York.

## Authority

**Owner's Eagle Eye** is one of the project's highest operating principles and is also called the **Eagle Eye golden rule**. It supplements the existing handoff golden rule and Remote Joining readiness contract. Later explicit owner instructions override this file.

The purpose is simple: the owner must be able to see the project's real position frequently enough to catch drift, inflated readiness, hidden blockers, duplicated evidence or unnecessary owner work before those problems compound.

## Mandatory owner-facing runway report

While meaningful project development is underway, every substantive owner-facing checkpoint must prominently report a compact Owner's Eagle Eye snapshot. Report it more often than ordinary milestone-only status updates, especially after a scoreable evidence event, a failed/rejected evidence attempt, a major gate, a merge/deployment, a lane transition, discovery of a blocker, or a change to the estimated remaining work.

At minimum the snapshot must state:

- current fixed **RJR score / 100**;
- **RJR points remaining**;
- current scoreable capability gap or lane;
- estimated **concrete tasks remaining**;
- estimated **major stages remaining**;
- estimated **genuinely new evidence bundles remaining**;
- blocker status and whether **owner action is required now**;
- current **Handoff proximity: X%**.

When useful, also state the fixed-domain vector and the next evidence that could actually move RJR.

## Evidence and uncertainty rules

The Eagle Eye report must make the difference between fact and forecast unmistakable.

1. RJR score and domain values come from `REMOTE_JOINING_READINESS.json` after live verification. Never infer extra points from implementation, source volume, PR count, CI, review, merge, deployment, documentation, WEC, SLE or handoff work.
2. A point moves only when genuinely new evidence satisfies the fixed RJR model. Repeated or narrower proof of an already credited capability earns zero duplicate credit.
3. Runway counts for tasks, stages and evidence bundles are forecasts, not denominator math. Prefix or phrase them as estimates and revise them when live evidence changes the path.
4. If a score does not move, say why. This is an important Eagle Eye signal, not a failure to report progress.
5. Never hide a rejected proof, regression, stale-head invalidation, provider limitation, unresolved failure or owner-only boundary merely to make the runway look shorter.
6. Never manufacture a hidden account/model usage percentage. Handoff proximity remains governed by `00_HANDOFF_GOLDEN_RULE.md` and the WEC system.

## Owner-effort rule

Automate every evidence step that can be proved safely and faithfully through deterministic tests, browser automation, emulators, repository gates or provider/deployment evidence. Ask the owner for manual help only when the remaining capability genuinely depends on a physical device, independent network, private account action, provider console action or another boundary the development environment cannot perform.

Before asking the owner to act, complete all automatable prerequisites and reduce the request to the smallest safe acceptance step. Do not make the owner repeat already consumed evidence merely for confidence.

## Continuity and handoff

Every future SLE/SNS successor package and every fresh WEC must preserve this rule. Successor bootstrap material must make the owner-visible RJR runway easy to reconstruct from live repository state.

At `Handoff proximity: 100%`, obey the existing handoff golden rule: finish only the current safe bounded checkpoint, generate and publish the complete successor package/SNS, seal and archive the WEC, give the owner the concise repository-first continuation prompt, and stop before another substantial milestone.

This file is permanent project operating policy and should be read alongside `00_HANDOFF_GOLDEN_RULE.md`, `REMOTE_JOINING_READINESS.json`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `NEXT_TASK.md` and `PROJECT_STATE.md`.