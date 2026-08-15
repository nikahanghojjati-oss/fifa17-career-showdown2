# Career Mode Showdown — Work Environment Continuity Protocol

Last updated: 2026-08-15 ET

This protocol turns the permanent quality-first handoff rule into a repeatable, repository-owned assessment. Its purpose is to alert the owner before a development environment becomes less effective than a fresh environment with a complete handoff.

It is development-process infrastructure only. It does not run in the website, collect product analytics, send network telemetry or authorize runtime work.

## Authority and files

- `00_HANDOFF_GOLDEN_RULE.md` owns the normative safety and handoff policy.
- This file owns the measurement model, checkpoints and operating procedure.
- `WORK_ENVIRONMENT_STATUS.json` owns the current environment's machine-readable observations and continuation state.
- `WORK_ENVIRONMENT_HISTORY.md` is the append-only record of completed environments and transition decisions.
- `scripts/work-environment-continuity.mjs` validates the record, observes local Git state, calculates the recommendation and generates the ready-to-paste prompt.
- `AGENTS.md` makes the loop discoverable to every repository-aware coding environment.
- `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md` and `NEXT_TASK.md` continue to own project evidence, deployed state and implementation authorization respectively.

Current source always wins. A score is a decision aid, not permission to skip source reconstruction, tests, review or the safe-boundary rules.

## What the system can and cannot know

The repository can track observable complexity, reliability signals, handoff quality and Git state. It cannot read a hidden exact model context-token count or account allowance.

Only these sources may populate `usageRemainingPercent`:

1. the product usage dashboard;
2. CLI `/status`;
3. an explicit owner report.

Otherwise the value must be `null` and `usageSource` must be `unavailable`. Do not derive a fake percentage from message count, file count or intuition. An explicit product warning may set `usageWarning: true` even when no percentage is exposed.

## Required lifecycle

### 1. Start or resume

Before substantial work:

1. fetch live GitHub and reconstruct current production authority;
2. read the files listed in `AGENTS.md`;
3. run `npm run work:continuity:validate` against the inherited record before changing it;
4. if the current status belongs to an earlier environment, append its final facts to history, then replace it with a new unique environment ID and current observations;
5. reset every per-environment signal rather than carrying the predecessor's counters or usage observations forward;
6. set `repository.startingMainSha` to the full live `main` SHA observed at entry;
7. record the bounded owner-authorized task, last safe checkpoint, next safe action, unfinished work and hazards;
8. only after the current environment owns the fresh status record, run `npm run work:assess` and obey that assessment before implementation.

A `closed` or `transition-prepared` record can correctly stop the environment that owns it. It must not prevent a successor from archiving that record, initializing fresh observations and obtaining its own assessment. Never use the predecessor's transition decision as the successor's starting decision.

Suggested environment ID format: `we-YYYY-MM-DD-short-purpose`.

Per-environment counters reset when a new environment starts. Historical evidence stays in the append-only history and project handoffs.

### 2. Reassess at meaningful checkpoints

Update the status and run `npm run work:assess`:

- after live-state reconstruction;
- after a scope or authority change;
- after each major implementation, investigation, review, validation, publication or deployment phase;
- after an important architectural decision;
- after every meaningful failure, correction, stale-fact discovery or tool-routing error;
- after a commit, PR freeze, CI gate, merge or production verification;
- before beginning a distinct milestone or investigation;
- whenever the product reports a context or usage warning;
- whenever reliability feels less certain than at the prior checkpoint.

Do not lower counters to make a recommendation more convenient. Correct factual mistakes transparently and explain the correction in `continuity.evidenceNotes` or the rolling handoff.

### 3. Alert and transition

The command prints one of five decisions. When it prints anything other than `CONTINUE`, tell the owner promptly and state the required action. A transition recommendation never permits abandoning an atomic mutation or leaving the repository incoherent.

Before a handoff:

1. complete or safely revert only the minimum bounded operation required for a coherent state;
2. verify live `main`, branch, exact HEAD, PR and last meaningful green evidence;
3. update the rolling handoff and current status;
4. set `handoffCompleteness` honestly and set `unrecordedDecisions` to zero only when every material decision is recorded;
5. run `npm run work:continuity:validate`, `npm run work:assess` and `npm run work:handoff`;
6. append the closed environment record to history when the transition boundary is final;
7. give the owner the complete generated prompt and stop before another substantial task.

## Signal rubric

All counters describe only the current development environment.

| Signal | Meaning |
|---|---|
| `contextComplexity` | `low`: one narrow task and little evidence; `moderate`: several files or one validation phase; `high`: multiple interacting phases, branches or dense evidence; `very-high`: compaction, extensive reconstruction/publication evidence or several completed major phases. |
| `projectComplexity` | Ramp-up cost for a fresh environment: `low`, `moderate`, `high` or `very-high`. This reflects the active project's architecture and authority surface, not chat length. |
| `compactionCount` | Observed automatic or explicit conversation compactions in this environment. |
| `majorPhasesCompleted` | Count of materially distinct completed phases such as reconstruction, implementation, full validation, publication or production proof. |
| `largeEvidenceEvents` | Dense evidence ingestions such as large test output, broad source reviews, CI matrices or deployment proofs. |
| `toolRoutingErrors` | Wrong tool, malformed call, wrong helper path or recoverable orchestration mistake. |
| `correctedFailures` | Meaningful implementation, documentation or validation defects found and corrected in this environment. |
| `repeatedMistakes` | A materially similar mistake repeated after its correction was known. This is a stronger reliability signal. |
| `staleFactCorrections` | Instances where work relied on a fact later proved stale by current source. |
| `unresolvedFailures` | Meaningful failures still lacking a source-grounded classification or correction. |
| `newMilestoneNext` | Whether the next substantial action is a distinct milestone or investigation rather than completion of the current bounded checkpoint. |
| `usageRemainingPercent` | Exact reported remaining allowance from an approved source, or `null`. |
| `usageSource` | `usage-dashboard`, `cli-status`, `user-reported` or `unavailable`. |
| `usageWarning` | Whether an explicit product warning was observed. |
| `handoffCompleteness` | 0–100 estimate of how fully exact state, decisions, failures, tests, PR/deploy evidence, hazards and next action are recorded. |
| `unrecordedDecisions` | Material decisions or discoveries still present only in chat/working memory. |
| `atomicOperation` | `true` while interruption would leave a destructive, mixed, partially applied or otherwise incoherent state. |

## Deterministic model

The evaluator clamps all component scores to 0–100.

Context pressure:

```text
complexity baseline: low 15, moderate 35, high 60, very-high 80
+ min(20, compactionCount × 12)
+ min(15, max(0, majorPhasesCompleted − 1) × 4)
+ min(10, largeEvidenceEvents × 2)
```

Quality risk:

```text
toolRoutingErrors × 6
+ correctedFailures × 4
+ repeatedMistakes × 18
+ staleFactCorrections × 12
+ unresolvedFailures × 8
```

Next-task separation is 80 when `newMilestoneNext` is true and 20 otherwise. Usage risk is `100 − usageRemainingPercent`; an explicit warning raises it to at least 90. Unknown usage is omitted from the weighted mean rather than estimated.

Handoff readiness:

```text
handoffCompleteness
− min(40, unrecordedDecisions × 12)
− 25 when required continuity files are missing
```

Continuation risk is the normalized weighted mean of context pressure 35%, quality risk 30%, next-task separation 15% and known usage risk 20%.

Transition cost models the understanding lost when moving to a fresh environment:

```text
(100 − handoff readiness) × 45%
+ unrecorded knowledge × 25%
+ project complexity × 15%
+ atomic-operation risk × 15%
```

`unrecorded knowledge` is `unrecordedDecisions × 20`, capped at 100. Project-complexity scores are 25, 50, 75 and 90. Atomic risk is 100 during an atomic operation, 35 for an otherwise dirty working tree and 0 for a clean tree.

Transition advantage is continuation risk minus transition cost.

## Decision thresholds

| Decision | Trigger | Required behavior |
|---|---|---|
| `HANDOFF_NOW` | explicit usage warning, reported usage remaining at or below 10%, or quality risk at least 80 | Start no more work. Seal and transition from the nearest coherent boundary. |
| `FINISH_SAFE_BOUNDARY` | a transition is recommended while `atomicOperation` is true | Complete or safely revert only the minimum operation needed for coherence, then hand off immediately. |
| `HANDOFF_AT_CHECKPOINT` | continuation risk at least 70, or transition advantage at least 25 | Finish the current bounded checkpoint, freeze evidence and transition before another substantial task. |
| `PREPARE_HANDOFF` | continuation risk at least 50, or transition advantage at least 10 | Strengthen records and reassess before another milestone. |
| `CONTINUE` | none of the above | Continue only the current authorized bounded task. |

Hard warnings take priority except that an unsafe atomic operation must first be restored to a coherent boundary.

## Commands

```sh
npm run work:continuity:validate
npm run work:assess
npm run work:assess -- --json
npm run work:assess -- --usage-remaining 42 --usage-source cli-status
npm run work:assess -- --usage-warning
npm run work:handoff
```

Command-line usage observations affect only that invocation. Persist a verified value in `WORK_ENVIRONMENT_STATUS.json` if it must survive the current shell.

## History record minimum

Every closed record must preserve:

- environment ID and timestamps;
- starting live-main SHA and final exact repository boundary;
- owner-authorized bounded task;
- final observable signals and decision;
- important decisions, failures, corrections and unresolved hazards;
- tests, PR, merge, workflow, deployment and public-site proof when applicable;
- the exact next safe action;
- whether technical proof and owner acceptance are complete or pending.

Never rewrite a prior history record to make the path look cleaner. Add a dated correction that points to the superseded fact.

## Calibration rule

The initial weights are intentionally conservative and deterministic. Change them only in a separately reviewed repository update with scenario tests showing why the prior model alerted too early or too late. Never tune a threshold merely to avoid a handoff already recommended by current evidence.
