# CC-006 build result: every unrun factory job sized for a GPT-5.6 Sol chat

| Field | Value |
| --- | --- |
| Brief | `project-documents/factory/handoffs/CC-006_FABLE_SOL_JOB_AUDIT.md` |
| Branch | `factory/v1-wtt5ye` |
| Date | 2026-10-03 |
| Commits | `bdfa351` generator helpers and desktop builds · `940877a` phone jobs · `d6f447a` review jobs · `f948424` fix rounds and motion jobs · `0eb1850` integration, top bar and phone art · `36895d4` Job 32 workflow CI fix · this file |

## What was audited

Every job whose status said `State: NOT STARTED` on 2026-10-03 14:30 UTC, minus lane `team-g` (98–102) and lane `fresh chat (image)` (115–121): **70 jobs**. Each was re-checked right before the commits; none had started meanwhile. Job 108 is lane `codex`; it was rewritten with the same file-naming rules but keeps its five steps and a DEFAULT that lets Codex carry Claude's measurements when it has no browser.

## What changed in the generator (`project-documents/factory/tools/jobgen/gen_jobs.py`)

- **Sol-sized helpers (v2)** next to the old ones: `screen_build_steps_v2`, `phone_steps_v2`, `review_steps_v2`, `fix_steps_v2`, `motion_steps_v2`, `fixmotion_steps_v2`. Every step is written by one formatter `S(name, read, write, body, done)`, so each step says exactly which files to read (paths), which files to write (paths), what to do, the DEFAULT where a choice is needed, and what done looks like.
- **Frozen jobs keep v1.** `FROZEN_V1 = {TR_build, CS_build, RV_build, ld_review, ld_fix}` are DONE jobs that used the shared helpers; their job files and step totals are unchanged.
- **No browser in any step.** factory-qa, screenshots, mockup-diff, recordings, smoke-clicking and "measure with factory-qa" are gone from the 70 jobs. They became "check by reading" plus a height budget by arithmetic, and the gates a browser needs (H5, H6 contrast, H7–H11) are marked "Claude measures" in the review, build and phone steps and self-checks.
- **No binaries from workers.** Cut-outs, phone proofs, title crops and preview.html are recipes: polygons in `platemap.json` / `phonemap.json` and the exact commands in `tools/MAKE_ASSETS.md` in the screen folder; `build_preview.py` is copied but not run.
- **Placeholders.** `{n}` (three-digit job number), `{N}` (plain number) and `{job:key}` (another job's number) are substituted at render time, so a step can name `status/JOB-062.md` as the intake note to read, and the finish line names the real commit message.
- **Hub reserve folded in.** The old post-processing step "Reserve the bottom bar space..." (inserted into six phone jobs) is now part of the phone jobs' "Controls and the pinned action" step for hub screens.
- **Path fix.** The generator had `/home/claude/fifa17-career-showdown2/` hardcoded for its "does the phone background exist" check; it now derives the repo root from its own location, so any session can run it.

## Per job

| Job | Title | Old steps | New steps | What changed |
| --- | --- | --- | --- | --- |
| 33 | Home: phone with seven destinations | 7 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action with the bottom bar reserved inside the step, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 34 | Home: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 35 | Home: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 36 | Home: motion pass | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 39 | League: phone with the hand in frame | 6 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 40 | League: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 41 | League: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 42 | League: spin feel | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 45 | Club: phone | 6 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 46 | Club: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 47 | Club: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 48 | Club: the pack rip | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 50 | Transfer War: phone polish | 6 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 51 | Transfer War: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 52 | Transfer War: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 53 | Transfer War: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 58 | Trophy Room: phone | 7 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action with the bottom bar reserved inside the step, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 59 | Trophy Room: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 60 | Trophy Room: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 61 | Trophy Room: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 63 | Career Statistics: phone | 7 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action with the bottom bar reserved inside the step, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 64 | Career Statistics: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 65 | Career Statistics: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 66 | Career Statistics: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 68 | Rivalry Statistics: phone | 7 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action with the bottom bar reserved inside the step, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 69 | Rivalry Statistics: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 70 | Rivalry Statistics: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 71 | Rivalry Statistics: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 72 | Legacy (History): build (desktop) | 9 | 11 | Scaffold, stage, title and layout skeleton as four small steps; the heavy element step split into groups A, B and C; cut-outs and preview.html become a recipe in tools/MAKE_ASSETS.md; check by reading replaces factory-qa and the mockup-diff; every step names its files and its done check. |
| 73 | Legacy (History): phone | 7 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action with the bottom bar reserved inside the step, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 74 | Legacy (History): review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 75 | Legacy (History): fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 76 | Legacy (History): motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 77 | Season Results: build (desktop) | 9 | 11 | Scaffold, stage, title and layout skeleton as four small steps; the heavy element step split into groups A, B and C; cut-outs and preview.html become a recipe in tools/MAKE_ASSETS.md; check by reading replaces factory-qa and the mockup-diff; every step names its files and its done check. |
| 78 | Season Results: phone | 6 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 79 | Season Results: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 80 | Season Results: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 81 | Season Results: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 82 | Final Winner: build (desktop) | 9 | 11 | Scaffold, stage, title and layout skeleton as four small steps; the heavy element step split into groups A, B and C; cut-outs and preview.html become a recipe in tools/MAKE_ASSETS.md; check by reading replaces factory-qa and the mockup-diff; every step names its files and its done check. |
| 83 | Final Winner: phone | 6 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 84 | Final Winner: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 85 | Final Winner: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 86 | Final Winner: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 87 | Start / Join: build (desktop) | 9 | 11 | Scaffold, stage, title and layout skeleton as four small steps; the heavy element step split into groups A, B and C; cut-outs and preview.html become a recipe in tools/MAKE_ASSETS.md; check by reading replaces factory-qa and the mockup-diff; every step names its files and its done check. |
| 88 | Start / Join: phone | 7 | 6 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action with the bottom bar reserved inside the step, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 89 | Start / Join: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 90 | Start / Join: fix round | 5 | 4 | Fix list copied as a checklist (or SKIPPED), one item per saved part reading only the item's files, check by reading, Fix round section; no screenshots or browser QA. |
| 91 | Start / Join: motion | 7 | 5 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 92 | Rule Book: build (desktop and phone) | 10 | 12 | Same build shape as the new screens (no cut-out step, system plate); the phone step that ran factory-qa became a phone layout step plus a height budget by arithmetic. |
| 93 | Rule Book: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 94 | Rule Book: fix round and motion | 5 | 5 | Never-skip read step, one fix item per saved part with only its files, check by reading, entrance motion with its files named, Fix round and Motion sections; no recordings. |
| 95 | Settings: build (desktop and phone) | 10 | 12 | Same build shape as the new screens (no cut-out step, system plate); the phone step that ran factory-qa became a phone layout step plus a height budget by arithmetic. |
| 96 | Settings: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 97 | Settings: fix round and motion | 5 | 5 | Never-skip read step, one fix item per saved part with only its files, check by reading, entrance motion with its files named, Fix round and Motion sections; no recordings. |
| 103 | Showcase: every screen in one place | 4 | 4 | Hub page in three screen groups, router with a routes.json table, phone toggle, link check by reading instead of smoke-clicking. |
| 104 | Showcase: screens read Team G's model-true fixtures | 4 | 4 | Binding table and sample-number swaps one screen per saved part, lock binding by reading, a Python consistency check (check_binding.py) instead of an unspecified test. |
| 105 | Full phone pass | 4 | 4 | Phone plan, one heavy layout step (alone in its turn), heroes from the phone art (missing cut-outs become a MAKE_ASSETS recipe), controls and pinned action, height budget by arithmetic, Phone section; Claude measures H5 in a browser. |
| 106 | Full phone pass: fixes | 3 | 3 | One item per saved part, check by reading with redone height arithmetic, Fix round; no re-shoots or factory-qa. |
| 107 | Motion and sound consistency pass | 4 | 4 | Motion plan, entrance wiring, one signature moment per saved part, interaction feel and both reduced-motion paths, timeline table and criterion 8 in BUILD_RESULT.md; frame strips are recorded by Claude. |
| 108 | Final package review (Codex) | 5 | 5 | Codex lane: every step names its files; DEFAULT carries Claude's committed measurements and compare sheets unless Codex has a browser; never waits on Actions. |
| 109 | Final fixes | 3 | 3 | One item per saved part, check by reading, Fix round; no re-shoots or factory-qa. |
| 110 | Package for Nik and handoff to GPT-5.6 Sol | 3 | 3 | Approval page links Claude's committed shots by path (never makes images), SHA-256 copied from intake files, handoff; one screen group per part. |
| 111 | Phone art: Home | 6 | 6 | Count kept (fix round pending); steps 1, 5 and 6 rewritten as recipes: polygons plus cutout.py lines in MAKE_ASSETS.md, phone_frame proof data, weight budget; steps 2–4 stay done by Claude. |
| 112 | Phone art: League | 6 | 6 | Count kept (status already says 4 of 6); steps 1, 5 and 6 rewritten as recipes (polygons plus cutout.py lines, phone_frame proof data, weight budget); steps 2–4 stay done by Claude. |
| 113 | Phone art: Club Assignment | 6 | 6 | Count kept (status already says 4 of 6); steps 1, 5 and 6 rewritten as recipes; steps 2–4 stay done by Claude. |
| 114 | Phone art: Transfer War | 6 | 6 | Count kept (status already says 4 of 6); steps 1, 5 and 6 rewritten as recipes; steps 2–4 stay done by Claude. |
| 125 | Top bar and phone bottom bar | 5 | 6 | Contract, desktop markup and CSS, behaviour (lock toast, aria-current), phone bottom bar, proof by text with Home's height arithmetic (Claude runs factory-qa and the Home gate), README. |
| 127 | Standings: build (desktop and phone) | 6 | 10 | Scaffold, stage, title, scoreboard, toggle and career view, depth recipe, states, phone layout, height budget by arithmetic, check by reading plus BUILD_RESULT; factory-qa removed. |
| 128 | Standings: review | 8 | 7 | REVIEW.md skeleton first; Claude's measurements carried from the build and phone intake notes (H5–H11 marked Claude measures, NOT MEASURED never FAIL); mockup compare and code audit by reading; gates, scores, verdict and fix list each one step. No QA run, no compare sheet. |
| 129 | Standings: fix round and motion | 5 | 5 | Never-skip read step, one fix item per saved part with only its files, check by reading, entrance motion with its files named, Fix round and Motion sections; no recordings. |

## Jobs not changed and why

- 98–102: lane `team-g` (tracking lines; 99–102 are WAITING ON TEAM G). Out of scope by the brief.
- 115–121: lane `fresh chat (image)`; they run from tickets. Out of scope by the brief.
- Every DONE, IN PROGRESS, BLOCKED or WAITING job: untouched, including the three desktop builds (57, 62, 67) and the two Loading jobs (55, 56) that share helpers with the audited jobs.
- 111–114 kept their step count of 6 because the status files of 112–114 already record `Step: 4 of 6` (steps 2–4 done by Claude) and 111 has a pending fix round against the same numbering.

## Spot-checks (read end to end as a Sol chat would)

- **Build, job 72 (Legacy desktop):** 11 steps, each at most 3 writes and 4 reads; the heavy element step is now three steps with "split into 5a/5b" written in; the only binaries are recipes. Found and fixed: the status-file reference read awkwardly, and the finish line said `Job N done` instead of the real number.
- **Phone, job 58 (Trophy Room):** 6 steps; the layout step is marked heavy (alone in its turn); the phone art files are referenced with a DEFAULT recipe when missing; the bar reserve is inside step 4; H5 is arithmetic plus Claude's measurement.
- **Review, job 64 (Career Statistics):** 7 steps; step 2 names the two intake notes (`status/JOB-062.md`, `status/JOB-063.md`) and the two evidence files to read; H5–H11 are copied, never measured; found and fixed: screens without a mockup path (Rule Book, Settings, Standings) now read "the reference: ..." instead of a broken "the mockup `...`" phrase.

## Checks

- `python3 project-documents/factory/tools/jobgen/gen_jobs.py` reproduces every job file; `python3 project-documents/factory/tools/board.py` regenerated the board (run with `FEED_MD` pointing at `leads/relay`'s FEED.md so the relay section stayed).
- `git diff --stat` against `1f28ca7`: only `jobs/` (70 files, all NOT STARTED project or codex lane), `BOARD.json`, `BOARD.md`, the `Step: 0 of n` totals of 50 NOT STARTED status files, and the generator. No other board field changed (verified field by field).
- Product rules unchanged: Daniel LEFT / Nik RIGHT, no real crests or players, no live data in images, billing off. No model names in commits or files.

## Found on the way (outside the brief)

- PR [nikahanghojjati-oss/fifa17-career-showdown2#311](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/311) (the branch tracker) was red on the head before this work: `POS20 selected deterministic census` failed in `tests/contracts/stability-contracts.cjs`, which forbids `actions/checkout@v4` and `actions/setup-node@v4` in any workflow; the worker-added `.github/workflows/job32-proof.yml` was the only file on v4. Commit `36895d4` bumps both to v5 (every other workflow already uses v5); the contract passes locally. That workflow triggers on changes to itself, so this push also re-runs the Job 32 Home QA, which commits refreshed evidence to the branch.
- The Sol worker relief brief's other two tasks (upload clean-up in the handbook and generator; the Team G rules file on `leads/relay`) were not part of CC-006 and were not done here.
