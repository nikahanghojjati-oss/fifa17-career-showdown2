# Career Mode Showdown — Forward Progress / Anti-Loop Policy

Effective: 2026-08-19 ET

This policy exists because continuity, history and current-authority maintenance must protect engineering without becoming a self-perpetuating substitute for engineering.

Current verified source and later owner instructions always win.

## 1. Default direction

When a fresh environment has reconstructed live source, initialized its own WEC record and is permitted to continue, it must advance the current owner-prioritized engineering dependency. For the current project direction, that means the smallest safe prerequisite toward Private Remote Joining.

A continuity/history/documentation-only task may interrupt engineering only when an objective blocker exists: a failing permanent contract, contradictory current implementation authority, unsafe publication/recovery state, data-loss/security risk, or another demonstrated condition that prevents safe implementation or publication.

“It could be cleaner”, stale historical prose that cannot override current source, an unappended non-authoritative history payload, naming inconsistency, or a desire to make handoff documents prettier is not sufficient.

## 2. Successor authority activation is not a separate milestone

A fresh successor must never manufacture an authority-only PR merely because `NEXT_TASK.md` or `WORK_ENVIRONMENT_STATUS.json` still names the predecessor checkpoint.

After validating the predecessor and initializing a fresh WEC record, the successor may activate the newly selected owner-authorized engineering task atomically inside the same bounded engineering candidate that implements that task.

The predecessor transition decision applies only to the predecessor. It does not require a preliminary publication cycle before the successor can start a fresh task when current source, owner direction and the successor WEC permit that task.

If a current-authority assertion must change solely so permanent contracts follow the fresh successor, update that assertion in the real engineering candidate. Do not open a standalone continuity PR unless the stale assertion independently blocks safe work or publication.

## 3. History append cannot become a progress deadlock

`WORK_ENVIRONMENT_HISTORY.md` remains append-only. Preserve predecessor final facts safely.

If the current tool route cannot append to the canonical history file without risking rewrite/truncation, preserve the exact facts in a recovery-safe payload and continue the real engineering milestone when all of the following are true:

1. current implementation authority is unambiguous;
2. the payload is not itself implementation authority;
3. no permanent contract requires the canonical append before engineering;
4. security, recovery and publication remain safe.

The deferred append must not become a separate history-only milestone merely because it exists. Append it later through a naturally available safe route or when a concrete gate genuinely requires it.

## 4. Concurrent equivalent-work collapse rule

Before publication, re-fetch live `main`.

If live `main` advanced because another environment already merged work equivalent to or superseding the current candidate:

1. stop mutating the stale candidate;
2. compare the new main against the candidate's intended outcome;
3. close or abandon the duplicate candidate when the required outcome is already present;
4. adopt the new live main as source truth;
5. continue with the next real dependency if the fresh WEC permits it.

Do not create a reconciliation PR solely because the base SHA changed. A reconciliation PR is justified only when the concurrent merge leaves a concrete source contradiction or safety defect.

## 5. No history-of-history loops

After one required continuity closeout is coherent and green, do not proactively search for more historical inconsistencies.

Do not create:

- history of history repairs;
- continuity refinement milestones;
- handoff cleanup milestones;
- archival beautification milestones;
- generalized governance refactors;
- authority synchronization PRs that exist only because the previous authority synchronization produced new metadata.

Those items are deferred unless an objective blocker appears.

## 6. Interruption recovery must resume implementation

An interruption requires reconstructing branch HEAD, changed files, PR state, CI state and live main before another write. After reconstruction, resume from the last coherent engineering checkpoint.

Do not restart the entire repository study if the current environment already has a valid fresh WEC record and the exact source boundary is unchanged. Re-read only the sources necessary to classify the interrupted operation.

## 7. Remote Joining priority test

Before opening a substantial candidate, ask:

`Does this materially reduce a required dependency, security, recovery, production or validation risk on the path to a workable private Remote Joining session?`

If yes, and it is the smallest safe unblocked requirement, proceed.

If no, defer it while required Remote Joining work remains.

Never use this rule to skip a genuine prerequisite. Stability, security, deterministic synchronization, recovery, authorization and complete testing remain mandatory.

This policy never permits skipping a real security, recovery, dependency, testing, WEC or publication requirement.

## 8. Publication discipline

One bounded engineering milestone should normally produce one engineering PR. Current-authority synchronization, fresh WEC state and directly required permanent process guards should travel with that engineering PR when they are necessary for the milestone.

A separate preliminary authority/history PR is the exception, not the default.

This policy does not weaken exact-head CI, clean review/thread requirements, expected-head merge protection, interruption recovery, WEC decisions, Handoff proximity reporting, or source-first authority.