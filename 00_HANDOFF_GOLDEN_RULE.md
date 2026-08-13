# Career Mode Showdown — Handoff Golden Rule

Owner-mandated permanent repository rule.

## Rule

Every developer or ChatGPT session that performs meaningful project work must maintain a current public Markdown handoff in this repository continuously while the work is happening.

The reason is operational continuity: a development session can be interrupted, hit a context limit, lose tool availability, or be replaced by another developer without warning. The repository handoff must therefore be sufficient for the next developer to continue from the exact current state without reconstructing the project from chat memory.

## Required behavior

Before meaningful implementation:

1. fetch current `main` and record its exact SHA;
2. read `00_DEVELOPER_START_HERE.md` and `NEXT_TASK.md`;
3. identify or create the active public handoff;
4. record the owner instruction and current branch/base authority.

During implementation, update the handoff at meaningful checkpoints. Record:

- exact owner instructions/corrections that affect scope;
- branch/base/runtime version authority;
- architectural and data-model decisions and their reasoning;
- important source/asset/provenance decisions;
- implementation steps future developers would otherwise need to rediscover;
- experiments and failed approaches;
- every meaningful CI/test failure with exact failure classification;
- corrective changes and why they are safe;
- thresholds/budgets that were deliberately preserved;
- any evidence rejected as flaky/infrastructure rather than silently counting it;
- frozen candidate SHA;
- PR number and exact PR head;
- gate/workflow evidence;
- expected-head merge SHA;
- deployment ID/SHA/status;
- public Pages verification;
- owner acceptance/rejection state separately from automated/developer QA;
- exact next legal roadmap action.

## Session quality and mandatory handoff threshold

Every development chat must actively judge whether its own engineering reliability is beginning to degrade. Do not try to guess a hidden model limit or wait for a hard failure. Use observable warning signs, including repeated tool-routing or command mistakes, increasing contradiction or repetition, uncertainty about facts already verified earlier in the session, loss of dependency or branch-state tracking, context saturation, or reduced confidence that a change can be completed and validated coherently.

When degradation is reasonably suspected:

1. stop starting new implementation or investigation work;
2. identify the nearest safe coherent repository boundary;
3. finish or safely revert only work required to reach that boundary;
4. update the public repository handoff with exact current authority, unfinished work, mistakes/blocked operations and the next legal action;
5. provide the owner a ready-to-paste continuation prompt for a fresh developer/chat;
6. stop the session rather than continuing merely to use remaining context.

Exception: do not stop in the middle of a critical atomic stage when stopping itself would harm the project, such as leaving a mixed runtime identity, a partially applied destructive transition, an incoherent branch/ref update, or another state that cannot safely be treated as authority. In that situation, complete the minimum required operation or revert to the last known-good coherent state first, document it, then hand off immediately. This exception is for restoring safety and coherence only, not for beginning additional work.

A developer who notices repeated mistakes must treat that observation as evidence for handoff, not as a reason to push deeper into the project.

## Deep historical context

The normal bootstrap should stay concise and source-first. A developer does not need to reread every historical chat before ordinary work.

When historical intent, superseded decisions, roadmap rationale or prior failure classes matter, read:

1. `00_MASTER_DEVELOPER_CONTEXT.md`;
2. `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md`.

That master handoff was created after a targeted review of the owner’s official ChatGPT account export plus repository-native r4/r5 and later release records. It exists so future developers can recover the reasons behind current rules without depending on inaccessible chat memory.

Historical context never overrides newer verified source or a later owner correction.

## Never do this

Do not:

- wait until the end of a long build to create the handoff;
- hide failed tests, failed experiments, permission incidents, flaky infrastructure or rejected evidence;
- claim CI/developer visual approval equals owner approval;
- rewrite history to make the path look cleaner than it was;
- leave the handoff pointing at a superseded SHA or completed task;
- ask the owner to repeat information that a current repository handoff should contain;
- rely on old chat chronology when current source/handoffs already resolve the state;
- continue starting new engineering work after observable session-quality degradation has begun.

## Completion rule

A build is not considered completely handed off until the public handoff states:

- what is implemented;
- what is intentionally excluded;
- the exact runtime/source authority;
- all meaningful validation evidence and failures;
- deployment status;
- whether owner acceptance is still pending;
- the exact next action.

This file is permanent project operating policy and should be read before development alongside `00_DEVELOPER_START_HERE.md`.