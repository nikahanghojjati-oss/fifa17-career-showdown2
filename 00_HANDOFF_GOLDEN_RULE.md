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
- rely on old chat chronology when current source/handoffs already resolve the state.

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