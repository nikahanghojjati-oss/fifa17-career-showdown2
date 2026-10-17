# CC-006 · Claude Code cloud brief: make every unrun factory job finishable by GPT-5.6 Sol from its number

| Field | Value |
| --- | --- |
| Model | Fable 5.1 (`claude-fable-5-1`) |
| Effort | High |
| STOP_BUDGET | $25 or 60 minutes, whichever comes first. At the budget, stop, commit what is done, write BUILD_RESULT.md. |
| Repository | `nikahanghojjati-oss/fifa17-career-showdown2` |
| Branch | `factory/v1-wtt5ye` (work and push here only; never `main`, never force-push, never delete branches) |
| Written by | Team V lead (Claude), 2026-10-03 |
| Billing | Nik's Claude Code cloud credit. No other paid services. |

## Why

The factory runs about 140 numbered jobs. Nik types a job number into a GPT-5.6 Sol chat (ChatGPT project "Showdown visual") and the chat does the job. Many chats stall in "thinking" and Nik has to press Stop and then Continue up to eight times. Today the Team V lead added rules so a chat finishes cleanly. You now apply those rules to every job that has not run yet. A Sol chat must be able to finish any job from just its number, with no babysitting.

## Read first (in this order)

1. `project-documents/factory/WORKER_HANDBOOK.md`: the "Pace rules" at the top (two steps per turn, every step saved, Sol capacity, never poll Actions, no worker browser QA, DEFAULT instead of BLOCKED) and §7 (text only; scriptable binaries become a recipe in `tools/MAKE_ASSETS.md`).
2. `project-documents/factory/tools/jobgen/README.md` and `gen_jobs.py` + `screens.py`. This generator is the source of truth for `jobs/*.md` and `BOARD.json`. **Edit the generator, then run it.** Never hand-edit `jobs/*.md`, because the next run would wipe the edit.
3. `project-documents/factory/QUALITY_BAR.md` (hard gates H1-H11) and `PRODUCT_TRUTH.md`, only as far as you need them to keep the job text correct.
4. Two finished examples of what Sol chats produced and what went wrong: `project-documents/factory/status/JOB-062.md` and `JOB-067.md` (Claude intake notes at the bottom).

## Sol capacity rule (the size of one step)

One step reads at most 4 files (only the sections it needs), writes or edits at most 3 files and about 150 lines, and makes ONE decision. A worker does at most two steps per turn, or one heavy step.

## Task

1. List the jobs to audit: every job whose `status/JOB-NNN.md` says `State: NOT STARTED` (77 jobs at writing time). Re-check each status right before you commit and skip any job that has started meanwhile. Skip lane `team-g` and image-ticket jobs (lane `fresh chat (image)`; those run from tickets, not in project chats).
2. For each job, check every step against the Sol capacity rule and the Pace rules. Fix the generator so that:
   - A step that is too big is split into smaller steps. You may change the step count, but only for NOT STARTED jobs.
   - No step asks the worker to run browser QA, take screenshots, run Playwright/factory-qa/mockup_diff, record motion, poll or wait on GitHub Actions, or make, upload or zip images. Replace these with "check by reading" plus a recipe line in `tools/MAKE_ASSETS.md`, and leave the visual checks to Claude at intake.
   - Each step says exactly which files to read (paths), which files to write (paths), and what "done" looks like for that step, in plain words a Sol chat can follow without guessing.
   - Where a step needs a choice, the job names the default to pick.
   - The job text still keeps every product-truth line, every hard gate the job owns (now marked "Claude measures" where a browser is needed), and every deliverable.
3. Run `python3 project-documents/factory/tools/jobgen/gen_jobs.py`, then `python3 project-documents/factory/tools/board.py`. Check with `git diff --stat` that only `jobs/`, `BOARD.json`, `BOARD.md`, status step totals of NOT STARTED jobs and the generator changed.
4. Spot-check three rewritten jobs end to end (one build, one phone, one review) by reading them as a Sol chat would: could it finish from the number alone, two steps per turn, never needing a browser? Fix anything that fails.
5. Commit in small commits (`Factory audit: <screen or job type>`), push to `factory/v1-wtt5ye` (pull --rebase first; a GitHub Action also commits BOARD.md there).
6. Write `project-documents/factory/handoffs/CC-006_BUILD_RESULT.md`: per job number, old step count, new step count, and one line on what changed. List any job you could not fix and why. Commit and push it.

## Hard rules

- **Never add, remove or reorder `job(...)` calls.** Job numbers come from their order, so that would renumber everything.
- Never change step counts of jobs that are IN PROGRESS, BLOCKED, DONE or SKIPPED.
- Do not touch `status/*.md` except the `Step: k of n` total that the generator syncs, `visual-assets/`, the board workflow, `main`, or the leads/relay branch.
- Do not start, run or finish any factory job yourself.
- Product rules stay: Daniel always LEFT, Nik RIGHT; no real crests, logos, trophies or players (the only exception is the Loading screen's Reus photo with its OWNER-4 credit); never bake live data into images; billing stays off.
- No model names in commits or files.

## Done when

All NOT STARTED jobs (minus team-g and image tickets) pass the Sol capacity rule, the generator reproduces them, `CC-006_BUILD_RESULT.md` is committed, and the last push is on `factory/v1-wtt5ye`. Reply with the last commit id and the BUILD_RESULT link.
