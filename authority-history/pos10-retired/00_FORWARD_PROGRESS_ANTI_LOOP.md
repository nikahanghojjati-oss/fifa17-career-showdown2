# Career Mode Showdown — Forward Progress / Anti-Loop Policy

Effective: 2026-08-19 ET
Owner amendment: 2026-09-07 ET — meaningful-failure classification, adaptive anti-spiral budget, and legacy gate retirement.

This policy exists because continuity, history and current-authority maintenance must protect engineering without becoming a self-perpetuating substitute for engineering.

Current verified source and later owner instructions always win.

## 1. Default direction

When a fresh environment has reconstructed live source, initialized its own WEC record and is permitted to continue, it must advance the current owner-prioritized engineering dependency.

A continuity/history/documentation-only task may interrupt engineering only when an objective blocker exists: failing current product behavior, a real security/privacy/data-integrity defect, contradictory current executable authority, unsafe publication/recovery state, or another demonstrated condition that prevents safe implementation or publication.

“It could be cleaner”, stale historical prose that cannot override current source, exact old PR wording, report-format literals, archival presentation, naming inconsistency or a desire to make handoff documents prettier is not sufficient.

## 2. Meaningful gate rule

A blocking test or gate must protect at least one meaningful current property:

1. executable runtime behavior;
2. infrastructure or deployment correctness;
3. security, authentication or authorization;
4. privacy or data retention safety;
5. storage, recovery, synchronization or transaction integrity;
6. UI or UX behavior that users actually experience;
7. a current API, schema, machine-readable authority or evidence validator input;
8. current milestone capability behavior or required acceptance evidence;
9. release correctness or a future-development invariant whose loss can create a real defect.

If changing only prose causes no change to any property above, that prose must not block current product development. Preserve the historical test or record in an archival/provenance audit lane instead of repeatedly editing current authority documents to satisfy old wording.

This is not permission to weaken a real invariant. Wording remains blocking when the wording itself is executable, user-visible, schema/API authority, security policy, evidence input, or otherwise meaningfully changes behavior or future safety.

## 3. Retired milestone gate handling

Completed milestones such as frozen RJR evidence remain immutable history, but their publication phrases and exact continuity wording do not remain permanent blockers for later SSJR/product work.

Retirement means:

* keep the historical files;
* keep useful tests available through an explicit legacy/provenance audit;
* remove purely historical or presentation-only checks from the default blocking suite;
* preserve still-relevant runtime/security/data invariants even if they were first created during the retired milestone;
* never delete proof merely to make CI green.

A retired milestone test returns to blocking status only if it detects a present regression in a still-shipped capability or permanent safety invariant.

## 4. Adaptive anti-spiral behavior

The anti-spiral mechanism remains mandatory. The fixed two-failure transfer cutoff is retired.

`SHP-2` uses `ADB-1`, a dynamic environment-specific debug budget from 2 through 20 attempts. Focused low-damage sessions with narrow failures may receive a large budget; broad failure sets, context damage, hard reconstruction, long sessions and unresolved-state growth reduce the budget.

A nonfunctional wording-only mismatch that has been correctly classified into the archival lane does not consume the product-debug budget.

The circuit breaker still exists to prevent degraded-context loops. Once the adaptive budget is exhausted, or context damage materially reduces the safe budget, finish or safely revert the current atomic operation, seal exact state and transfer. Never use the larger possible budget as permission to keep guessing after evidence shows quality is degrading.

## 5. Successor authority activation is not a separate milestone

A fresh successor must never manufacture an authority-only PR merely because `NEXT_TASK.md` or `WORK_ENVIRONMENT_STATUS.json` still names the predecessor checkpoint.

After validating the predecessor and initializing a fresh WEC record, the successor may activate the newly selected owner-authorized engineering task atomically inside the same bounded engineering candidate that implements that task.

The predecessor transition decision applies only to the predecessor. It does not require a preliminary publication cycle before the successor can start a fresh task when current source, owner direction and the successor WEC permit that task.

If a current-authority assertion must change solely so permanent contracts follow the fresh successor, update that assertion in the real engineering candidate. Do not open a standalone continuity PR unless the stale assertion independently blocks safe work or publication.

## 6. History append cannot become a progress deadlock

`WORK_ENVIRONMENT_HISTORY.md` remains append-only. Preserve predecessor final facts safely.

If the current tool route cannot append to the canonical history file without risking rewrite/truncation, preserve the exact facts in a recovery-safe payload and continue the real engineering milestone when current implementation authority is unambiguous and no genuine safety gate requires the append first.

The deferred append must not become a separate history-only milestone merely because it exists.

## 7. Concurrent equivalent-work collapse rule

Before publication, re-fetch live `main`.

If live `main` advanced because another environment already merged work equivalent to or superseding the current candidate, stop mutating the stale candidate, compare the new main against the intended outcome, abandon duplicate work when appropriate, adopt live main, and continue the next real dependency.

Do not create a reconciliation PR solely because the base SHA changed.

## 8. No history-of-history loops

After one required continuity closeout is coherent, do not proactively search for more historical inconsistencies.

Do not create history-of-history repairs, continuity refinement milestones, handoff cleanup milestones, archival beautification milestones, generalized governance refactors, or authority synchronization PRs that exist only because previous synchronization created new metadata.

## 9. Interruption recovery must resume implementation

An interruption requires reconstructing branch HEAD, changed files, PR state, CI state and live main before another write. After reconstruction, resume from the last coherent engineering checkpoint.

Do not restart the entire repository study if the current environment already has a valid fresh WEC and source boundary.

## 10. Product priority test

Before opening a substantial candidate, ask:

`Does this materially reduce a required capability, security, recovery, production or validation risk on the path to the current owner milestone?`

If yes, and it is the smallest safe unblocked requirement, proceed. If no, defer it while required product work remains.

Never use this rule to skip a genuine prerequisite. Stability, security, deterministic synchronization, recovery, authorization and meaningful testing remain mandatory.

## 11. Publication discipline

One bounded engineering milestone should normally produce one engineering PR. Current-authority synchronization, fresh WEC state and directly required permanent process guards should travel with that engineering PR when necessary.

A separate preliminary authority/history PR is the exception, not the default.

This policy does not weaken exact-head CI, clean review/thread requirements, expected-head merge protection, interruption recovery, WEC decisions, Session handoff proximity reporting, zero-billing controls or source-first authority. It removes only gates whose failure cannot affect a meaningful product or safety property.
