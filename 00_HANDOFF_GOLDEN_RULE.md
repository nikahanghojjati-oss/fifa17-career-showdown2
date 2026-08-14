# Career Mode Showdown — Handoff Golden Rule

Owner-mandated permanent repository rule.

## Rule

Every developer or ChatGPT session that performs meaningful project work must maintain a current public Markdown handoff in this repository continuously while the work is happening.

The reason is operational continuity: a development session can be interrupted, hit a context limit, lose tool availability, or be replaced by another developer without warning. The repository handoff must therefore be sufficient for the next developer to continue from the exact current state without reconstructing the project from chat memory.

The owner's highest operating priority is preservation of engineering quality, correctness and continuity. Maximizing the amount of work completed inside one chat is never a goal by itself. A fresh developer/chat with a complete repository-native handoff is preferred whenever continuing the current session would create meaningfully more context risk than benefit.

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
- exact next legal roadmap action;
- the exact immediate next task or ordered task sequence the next developer must begin after completing the required repository study/bootstrap.

## Mandatory immediate-next-task handoff rule

Every handoff written from now on must contain a prominent section named exactly or substantially equivalent to:

`IMMEDIATE NEXT TASK AFTER FULL STUDY`

This section is mandatory even when the rest of the handoff already contains roadmap direction, a stop condition, a continuation prompt or a generic "next legal action" list.

The purpose is to prevent a fresh developer from becoming fully caught up and then having to infer what to actually work on.

The section must clearly separate two phases:

1. bootstrap/study — what repository state, authority documents, branch/PR state and source must be verified first;
2. execution — the first concrete engineering task or ordered set of tasks to begin immediately after that study is complete.

The execution portion must be specific enough that a capable fresh developer can start work without asking the owner what to do next. It must state, when applicable:

- the exact bug, candidate, review, fix, validation or promotion task;
- the specific branch/PR or exact-SHA boundary involved;
- the primary files, tests, workflows or product surfaces that require attention;
- whether the task is investigation, implementation, source review, regression testing, PR validation, merge promotion, production proof or documentation sealing;
- the expected success condition or gate for moving to the following step;
- what must not be started or broadened while performing that task.

Do not substitute vague instructions such as "continue the roadmap," "keep testing," "finish the work," "review the project," "proceed with next steps" or "work on Analytics." Name the actual next work.

If several actions are required, order them explicitly and identify which one is first after study. Distinguish required sequential gates from optional follow-up ideas.

If no runtime/product work is currently authorized, say that explicitly and make the immediate next task the precise permitted action, for example validation, evidence review, documentation sealing, owner review or stopping for a new instruction. Never invent a feature merely to populate this section.

If a handoff is created because a session is degrading or interrupted, this immediate-next-task section must additionally explain exactly where the prior developer stopped, what remains unproven or unfinished, and the first safe operation the next developer should perform after reconstructing authority.

This requirement is recursive and permanent: every future developer/chat that creates, updates or seals a handoff inherits the obligation to leave the next developer an equally explicit immediate-next-task section.

## Quality-first proactive handoff rule

Do not wait for a hard context limit or obvious mistakes before considering a fresh session. Every developer must actively look for clean handoff opportunities.

A proactive handoff should be preferred when all of the following are true:

1. the repository is at a coherent boundary, such as a merged release, completed fix, completed investigation, green PR checkpoint, documentation seal or other state that can be named by an exact SHA;
2. no critical atomic mutation, destructive transition, mixed runtime identity or partially applied repository operation is in progress;
3. the current chat has become long, tool-heavy, multi-branch, evidence-dense or otherwise expensive to keep perfectly loaded in working context, or the next task is a distinct new milestone/investigation;
4. the repository handoff is strong enough that a fresh developer can recover the exact state without relying on chat memory.

Use this decision test: if a fresh developer who first verifies GitHub and reads the current handoff would have an equal or better chance of completing the next substantial task correctly, hand off now rather than starting that task in the current chat.

This rule applies even when the current developer still feels capable of continuing and even when unused context remains. Do not start another major engineering task merely because the session technically can continue.

Before a proactive quality handoff, the developer must:

1. finish or revert only the minimum necessary work needed to leave a coherent repository boundary;
2. verify current `main`, active branch/PR state and the last meaningful green validation authority;
3. update the public handoff so it names exact SHAs, versions, open/closed PRs, unfinished work, known hazards, blocked operations and the next legal action;
4. include the mandatory `IMMEDIATE NEXT TASK AFTER FULL STUDY` section with the first concrete post-bootstrap action and ordered follow-on gates;
5. distinguish technical/automated proof from owner visual or product acceptance;
6. provide the owner a complete ready-to-paste continuation prompt that tells the next developer to independently verify repository authority rather than blindly trusting the prompt;
7. stop before beginning the next substantial task.

The next developer inherits the same obligation. This makes quality-first handoff behavior recursive and permanent across every future development session.

## Session quality and mandatory handoff threshold

Every development chat must actively judge whether its own engineering reliability is beginning to degrade. Do not try to guess a hidden model limit or wait for a hard failure. Use observable warning signs, including repeated tool-routing or command mistakes, increasing contradiction or repetition, uncertainty about facts already verified earlier in the session, loss of dependency or branch-state tracking, context saturation, or reduced confidence that a change can be completed and validated coherently.

When degradation is reasonably suspected:

1. stop starting new implementation or investigation work;
2. identify the nearest safe coherent repository boundary;
3. finish or safely revert only work required to reach that boundary;
4. update the public repository handoff with exact current authority, unfinished work, mistakes/blocked operations and the next legal action;
5. write the mandatory `IMMEDIATE NEXT TASK AFTER FULL STUDY` section so the next developer knows the first safe post-bootstrap operation rather than merely the broad roadmap direction;
6. provide the owner a ready-to-paste continuation prompt for a fresh developer/chat;
7. stop the session rather than continuing merely to use remaining context.

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
- leave a handoff with only broad roadmap language and no concrete first task after bootstrap;
- make the next developer infer whether they should investigate, code, test, open a PR, validate, merge or seal documentation;
- ask the owner to repeat information that a current repository handoff should contain;
- rely on old chat chronology when current source/handoffs already resolve the state;
- continue starting new engineering work after observable session-quality degradation has begun;
- postpone a clean quality-first handoff only to squeeze one more substantial task into the same chat.

## Completion rule

A build is not considered completely handed off until the public handoff states:

- what is implemented;
- what is intentionally excluded;
- the exact runtime/source authority;
- all meaningful validation evidence and failures;
- deployment status;
- whether owner acceptance is still pending;
- the exact next legal action;
- a prominent `IMMEDIATE NEXT TASK AFTER FULL STUDY` section that names the first concrete post-bootstrap task, its ordered gates and its scope limits.

A session-level handoff is not complete until the owner also has a ready-to-paste continuation prompt for the next chat when a fresh session is being recommended.

This file is permanent project operating policy and should be read before development alongside `00_DEVELOPER_START_HERE.md`.