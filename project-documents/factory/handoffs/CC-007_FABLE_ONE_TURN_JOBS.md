# CC-007 · Claude Code cloud brief: one number = one finished job (no Continue, no new chat, no "take over")

| Field | Value |
| --- | --- |
| Model | Fable 5.1 (`claude-fable-5-1`) |
| Effort | High |
| STOP_BUDGET | **$15 hard cap.** At $12 stop adding scope: regenerate, commit what is done, write the result file. At $15 stop. |
| Repository | `nikahanghojjati-oss/fifa17-career-showdown2` |
| Branch | `factory/v1-wtt5ye` only. Fetch with an explicit refspec: `git fetch origin +refs/heads/factory/v1-wtt5ye:refs/remotes/origin/factory/v1-wtt5ye`. Never `main`, never force-push, never delete branches. |
| Result file | `project-documents/factory/handoffs/CC-007_BUILD_RESULT.md` |
| Written by | Team V lead (Claude), 2026-10-04 |
| Billing | Nik's Claude Code cloud credit. Fable costs about 2.5x Opus per token, so read narrowly: grep and `sed -n` ranges, never whole large files twice. |

## The problem (Nik's words, shortened)

Nik types a job number into a GPT-5.6 Sol chat (High, normal chat in the ChatGPT project "Showdown visual"). Today one job is 4 to 11 steps and the handbook allows two steps per turn, so every job needs Continue 3 to 10 times; chats also stall, error out and need "type N in a new chat" or "take over". In Sol **Work mode** it is far worse: Continue every 10 to 20 seconds, 20 to 50 times per job.

**Goal:** Nik types a number once, the chat does the whole job in **one turn**, saves, and ends with one line. If the job is too big for one turn, it becomes **several jobs**, each with its own number. More numbers is fine. Continue is never needed.

## The new rule: one job = one Sol turn

A job is right-sized when one normal Sol chat turn can do all of it:

| Limit | Value |
| --- | --- |
| Reads | the job file and status file, plus **at most 5** other files (only the sections named) |
| Writes | **at most 3** work files plus the status file, saved **last** |
| Size | about **200 changed lines** in total |
| Decisions | **one** (the job names the DEFAULT for anything else) |
| Heavy work | one layout pass, one long CSS pass, or one element group is a whole job on its own |
| Ending | one line: `Job N done: <what>. Next: <numbers it unlocks>.` Never "type continue". |

Default surface: **normal chat in the ChatGPT project "Showdown visual" at High, one new chat per number.** Work mode is used only for the jobs the Work mode section below picks. Opening a new chat for each number is the normal flow, not a recovery step. Up to 5 chats can run at once when their dependencies allow.

Write guard (handbook pace rule 9): fewer writes per chat already makes refusals rarer. Keep the rule that a refused save ends the turn with `Job N paused: GitHub refused a save. Type N in a new chat.`, and make every job **idempotent**: a new chat on the same number checks the branch for `Job N` commits, keeps saved files, writes only what is missing, saves the status last. That replaces "take over".

## Work mode: study it and use it where it pays (Nik, 04 Oct 00:59 UTC)

Team G is idle until the visual package is ready, so Nik wants all his ChatGPT capacity used. Facts:
- Normal chats in the project (GPT-5.6 Sol, High) do **not** use any usage meter. They can read the repo, save text through the GitHub connector, run Python, browse and make images; they cannot save images to GitHub.
- **Work mode** (GPT-6.1 Sol by default; another ChatGPT model if you judge it better) **does** use a meter. Nik has **two ChatGPT accounts, each with about 70-80 % Work mode usage left, plus one extra reset on one of them.**
- Work mode's limits seen so far: it asked for Continue every 10-20 seconds, 20-50 times per job; job 1 (2026-10-02) found it had **no browser**, while normal chats had Chromium; it is good at terminal-style work (run scripts, check many files, mechanical edits across a folder).

Study the remaining work (read `WORKER_HANDBOOK.md` §"which chat" table near line 230, `status/JOB-000.md` / `CAPABILITIES.md` from job 0 and job 1 notes, and 2-3 status files of jobs that ran in Work mode, by grep) and decide:
1. Which job types or parts suit Work mode better than a normal chat (likely candidates: integration 103-107 and 109-110, the full phone pass, cross-screen consistency checks, mechanical multi-file fixes), and which never do.
2. How a Work mode job must be shaped so it does **not** need Continue: the same one-turn limits, or a different size if your evidence says Work mode turns are shorter. Give the limits in the result file.
3. Which model to pick inside ChatGPT for those jobs, and what effort.
4. A rough usage plan: how many Work mode jobs fit in 2 accounts × ~75 % + 1 reset, and the order to run them so the visual package finishes soonest. Work mode jobs must never block normal-chat jobs that could run in parallel.

Put the choice into the generator: a job's lane is `project (type number)` for normal chats, or a Work mode lane with its own starter line (the handbook's starter-line pattern) and the model named. The board shows the two lanes separately ("Start now (Sol Work mode, press Use Work)" already exists in board.py). If the evidence says Work mode cannot avoid the Continue problem, say so in the result file and keep every job in normal chats.

## How many jobs (Claude's estimate; you fix the exact count)

45 jobs are NOT STARTED with about 236 steps. Under the one-turn rule they become **about 120 numbers: the 43 reshapable jobs keep their number as part 1 and about 76 new numbers are added (140 to about 215).** Rough shape:

| Job type | Jobs | Today | One-turn parts |
| --- | --- | --- | --- |
| Review (51 64 69 74 79 89 128) | 7 | 7 steps | 4: skeleton + carry Claude's measurements · mockup compare · code audit · gates + scores + verdict + fix list (reads only REVIEW.md) |
| Fix round (52 65 70 75 80 85 90) | 7 | 4 | 3: items 1-3 · items 4-6 · items 7-9 + Fix round section. A part with no items left sets DONE in one line. Reviews cap the fix list at 9 items, highest impact first. |
| Motion (53 66 71 76 81 86 91) | 7 | 5 | 3 |
| Phone (68 73 78 88) | 4 | 6 | 3, the layout pass alone in its own part |
| Phone art (117 119 120) | 3 | 6 | 3 |
| Top bar 125, Settings 97, Standings 129 | 3 | 5-6 | 3 each |
| Standings build 127 | 1 | 10 | 5 |
| Integration 103 104 105 107 / 106 109 110 | 7 | 3-4 | 2 each |

Do not reshape: **50 and 61** (being worked on), **99-102** (Team G tracking), **108** (Codex lane), **118** (image ticket), and every DONE job.

## Read first (narrowly)

1. `project-documents/factory/handoffs/CC-006_FABLE_SOL_JOB_AUDIT.md` and the top of `CC-006_BUILD_RESULT.md` (what the v2 step helpers are).
2. `project-documents/factory/tools/jobgen/README.md`, then `gen_jobs.py`: the `job()` signature (line ~19), the v2 helpers (`S(...)`, `screen_build_steps_v2`, `phone_steps_v2`, `review_steps_v2`, `fix_steps_v2`, `motion_steps_v2`), the `SOL_SHOTS` / `WORK` worker strings (lines 13-14), the lane function (~line 1419), and the numbering/writing section at the end.
3. `project-documents/factory/tools/board.py`: the hard-coded `SCREENS` number lists (~line 110) and how "Type next", "Working" and the done count are built.
4. `project-documents/factory/tools/check.py` and `.github/workflows/factory-board.yml`, only to confirm numbers above 139 and new status files work.
5. `project-documents/factory/WORKER_HANDBOOK.md`: Pace rules (top), §0, §5b, §6.

## Task

1. **Live state first.** List every `status/JOB-NNN.md` with `State: NOT STARTED`. Re-check right before each commit and leave alone any job that has started meanwhile (the factory thread runs intake and workers keep working while you run).
2. **Splitting mechanism in the generator.** Job numbers come from the order of `job()` calls, so never remove or reorder existing calls. Default design (use a lettered suffix instead only if the generator, board, check.py and the workflow all support it more cleanly):
   - The original number keeps part 1. Its title gets ` (part 1 of k)`.
   - Parts 2..k are new `job()` calls **appended after the last existing call** (so they number 140+), key `<key>_p2` etc., titled `<title> (part i of k)`, each depending on the previous part.
   - **Rewire dependencies:** every job that depended on the original number now depends on its **last** part (for example 103's long list, and each screen's next job).
   - The generator creates the new status files; check that it does.
3. **Rewrite the steps** of each reshapable job into one-turn parts using the limits table. Reuse and extend the v2 helpers (one helper per job type returns a list of parts) instead of editing jobs one by one. Every part keeps the CC-006 qualities: named read paths, named write paths, a DEFAULT, a Done line, no browser, no screenshots, no Actions polling, text files only, product-truth lines and hard gates intact. Each part's job file states its size limit and its single ending line, and says: "Do the whole job in this turn. Never ask the user to type continue."
4. **Lanes.** In the remaining jobs replace the old `SOL_SHOTS` wording ("Work mode if job 0 found...") with an explicit lane: normal chat, or the Work mode lane you chose in the Work mode section. No normal-chat job may need a terminal.
5. **Handbook and fix rounds.** Rewrite the Pace rules box and §0 for one-turn jobs (rules 1-3 change: no "two steps per turn", no "type continue"; keep 4-9). In §5b: a `N (fix)` chat does all listed items in one turn; Claude keeps each fix list to **at most 3 items per pass**, and longer lists become pass 2 after a recheck. Update `check.py` for that only if it is small; otherwise handbook text only. Keep the handbook shorter than it is now. If `FACTORY_RULES.md`'s BOOT box conflicts with one-turn jobs, update it and say in the result file that Nik must re-paste it into the project's Instructions (give the GitHub link).
6. **Board.** Add the new part numbers to `board.py` `SCREENS` under the right screen (and integration/top bar groups). Run `python3 project-documents/factory/tools/jobgen/gen_jobs.py` then `python3 project-documents/factory/tools/board.py`. "Type next" must list part 1 numbers only when ready and later parts only when the earlier part is done. `git diff --stat`: only the generator, board.py (and check.py if changed), handbook, FACTORY_RULES.md, jobs/, new status files, status step totals of NOT STARTED jobs, BOARD.json and BOARD.md.
7. **Spot-check three parts** as a Sol chat would (one review part, one phone layout part, one fix part): from the number alone, in one turn, under the limits, no Continue. Fix anything that fails.
8. **Commit small and often** (`Factory one-turn jobs: <what>`). Before every commit: `git fetch` with the refspec above and `git pull --rebase origin factory/v1-wtt5ye` (a GitHub Action and the factory thread also commit here). Never overwrite another session's change to a status file.
9. **Result file** `project-documents/factory/handoffs/CC-007_BUILD_RESULT.md`: final number count; a table per original job (old steps → parts, the new numbers, what each part does); the **new screen-to-number map** (the lead keeps one in its notes); **a where-to-run list: for every number, normal Sol chat or Work mode (with the model and effort)**, plus the Work mode usage plan; anything left undone and why; whether Nik must re-paste the BOOT box. Commit and push it.

## Hard rules

- Never add jobs in the middle, remove or reorder `job()` calls; append only.
- Never change jobs that are IN PROGRESS, BLOCKED, DONE, SKIPPED or WAITING ON TEAM G, or their status files (beyond the step total the generator syncs for NOT STARTED jobs).
- Do not touch `visual-assets/`, `main`, the leads/relay branch, or the board workflow file.
- Do not start, run or finish any factory job yourself.
- Product rules stay: Daniel always LEFT, Nik RIGHT; no real crests, logos, trophies or players (the Loading Reus photo with its OWNER-4 credit is the only exception); never bake live data into images; billing stays off.
- No model names in commits or files.

## Done when

Every reshapable job is one-turn sized, the generator reproduces the files, the board shows the new numbers correctly, the result file is pushed to `factory/v1-wtt5ye`. Reply with the last commit id, the new total number of jobs, how many go to Work mode, and the result file link:
https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/handoffs/CC-007_BUILD_RESULT.md
