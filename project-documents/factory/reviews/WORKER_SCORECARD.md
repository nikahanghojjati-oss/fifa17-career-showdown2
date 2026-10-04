# Who did the factory work, and how well

Team V factory · all 238 jobs done · written Sun 4 Oct 2026, 5:45 p.m. Eastern · for Nik

Source: the status file of every job, the full git history of branch `factory/v1-wtt5ye` (Claude's PASS and FIX checks are overwritten in the file, so the history is the only record of fix rounds), the CC-006/007/008 cloud briefs and the job threads in this project. Numbers come from `tools/scorecard.py` and can be re-run.

## The short answer

- **GPT-5.6 Sol chats did half of everything (121 of 237 jobs) and needed almost all the repairs.** 20 of its jobs went back for a fix, 27 fix rounds in total. All 6 jobs that needed 2 or more rounds were GPT-5.6 jobs.
- **Claude Opus 5.5 passed 34 of 34 jobs first time, Claude Sonnet 5.5 passed 50 of 52.** Opus scored best (4.32 average).
- **Screen builds are where GPT-5.6 struggled: only 1 of 7 builds and 12 of 21 phone layouts passed first time.** On reviews, motion and truth sheets it passed 46 of 46.
- **Fable 5.1 was used as a rescue and it worked:** jobs 58, 83 and 114 had each failed two GPT fix rounds. Fable fixed all three in one pass, in about 13 minutes (scores 4.3, 4.3, 4.2).
- **Astra, GPT-6.1 Sol Work mode, Codex and the image tickets were all 100 % first time**, but they did few and easy jobs (30 in total) and Work mode drained your usage meter.
- **Cost is only known for Fable's cloud runs.** GPT usage and Claude thread tokens are not recorded anywhere, so I did not guess them.

## Scoreboard

| Worker | Jobs | Passed first time | Fix rounds | Average score, first scored check | Average score, final |
| --- | --- | --- | --- | --- | --- |
| GPT-5.6 Sol (normal chat) | 121 | 101 (83 %) | 27 on 20 jobs | 4.01 (48 scored) | 4.24 |
| Claude Sonnet 5.5 | 52 | 50 (96 %) | 2 | 4.22 (11 scored) | 4.25 |
| Claude Opus 5.5 | 34 | 34 (100 %) | 0 | 4.32 (13 scored) | 4.32 |
| Astra (Work mode) | 9 | 9 (100 %) | 0 | 4.3 (1 scored) | 4.3 |
| Image tickets (ChatGPT) | 8 | 8 (100 %) | 0 | no scores | no scores |
| Codex | 7 | 7 (100 %) | 0 | no scores | no scores |
| GPT-6.1 Sol (Work mode) | 6 | 6 (100 %) | 0 | 4.3 (3 scored) | 4.3 |

"Passed first time" means Claude's first check on the job was PASS, with no FIX round. A score is only written on the last part of a screen job, so many jobs have no score. A PASS needs 4.2 or more, so final scores all land between 4.2 and 4.4 and cannot tell workers apart. The first check score (before any repair) is the useful one: **4.01 for GPT-5.6 against 4.22 for Sonnet and 4.32 for Opus.**

Not in the table: Fable 5.1 fixed jobs 58, 83 and 114 (counted under GPT-5.6 because GPT built them), and 6 Team G tracking or pre-board jobs are left out.

## What kind of job, by worker

First-time passes / jobs of that kind:

| Kind of job | GPT-5.6 Sol chat | Claude Sonnet 5.5 | Claude Opus 5.5 |
| --- | --- | --- | --- |
| Screen build | **1 / 7** | none | none |
| Phone layout | **12 / 21** | 10 / 12 | 18 / 18 |
| Fix round | 18 / 21 | 16 / 16 | 13 / 13 |
| Review | 19 / 19 | 15 / 15 | 1 / 1 |
| Motion | 17 / 17 | 6 / 6 | none |
| Truth sheet or data | 10 / 10 | none | none |
| Other | 24 / 26 | 3 / 3 | 2 / 2 |

This is the most useful table. GPT-5.6 is excellent at reading, writing and checking text and data and weak at getting a screen to look right on the first try. The six jobs that needed two or more rounds (39, 58, 77, 83, 95, 114) were all screen or phone layout jobs, first scores 3.0 to 3.4.

## Fix rounds in detail

- 20 GPT-5.6 jobs got a FIX, 27 rounds in total. Typical first-check score on those: 3.0 to 4.0 (the bar is 4.2).
- Job 77 needed 3 rounds; 39, 58, 83, 95 and 114 needed 2. Fable closed 58, 83 and 114 in one pass each.
- Sonnet: 2 FIX rounds (jobs 68 and 204, both scored 4.1, just under the bar, both phone layouts). Opus: none.

## Cost and usage: what is known

| Worker | What we know | What we do not know |
| --- | --- | --- |
| GPT-5.6 Sol chats | Normal chats do not use the Work-mode meter. Up to 5 can run at once. The board estimates about 31 minutes between steps (includes waiting). | Tokens and cost. Not visible to us. |
| GPT-6.1 Sol and Astra Work mode | 15 jobs in total. They stopped for Continue every 10 to 20 seconds, the two Sol bundles drained the meter to about 1 %, and two bundles stopped on save collisions (HTTP 422, 409). | Exact meter use per job. |
| Codex | 7 jobs (truth sheets and fix rounds). The final package review, job 108, was done by an Opus thread instead. | Cost, time. |
| Claude threads (Opus, Sonnet) | Count against your weekly limit (resets Thu 8 Oct 8:00 p.m. Eastern). The hard-jobs Opus thread finished 8 parts in about 15 minutes (figure from LANES.json). | Tokens per thread. Not recorded. |
| Fable 5.1 in cloud sessions | **CC-007: $7.89 and 16 minutes** (cap was $15) and it re-cut 100 jobs. CC-006: cap $25 or 60 minutes, **real cost not written down**. The 3-job rescue was done in a project thread, about 13 minutes (Sat 9:19 to 9:32 p.m. Eastern), cost not recorded. | CC-006 real cost. CC-008 (final polish, cap $15) was still running when this was written. |

## How far to trust this

- **The jobs were not equal.** GPT-5.6 got the first, largest screen builds. The Claude threads mostly took the later one-turn pieces after CC-007 split the jobs smaller, and many were fix rounds and reviews. So Claude's higher pass rate is partly an easier mix. That is why the table by job kind matters: even on phone layouts, Opus (18 of 18) beat GPT-5.6 (12 of 21).
- **The checker is Claude.** Claude scored Claude's own work; scores for Opus and Sonnet may be a little kind. Pass or fix is still hard evidence, because a FIX round really happened.
- **Few jobs have scores** (76 of 237), so the average-score column is a hint, not a result. Pass rate and fix rounds are complete.
- **Workers who saw the screen:** the Claude threads rendered screenshots before finishing. That probably explains part of the phone-layout gap, but it is not proven.

## Advice: who gets which task

| Task | Send it to | Why |
| --- | --- | --- |
| Truth sheets, data, reviews, motion notes, doc housekeeping | GPT-5.6 Sol normal chat, up to 5 at once | 46 of 46 first time, no meter use, runs while you sleep |
| First build of a new screen, phone layout, anything that must look right | Claude Opus 5.5 (Medium or High) in a thread; Sonnet 5.5 if it is a small exact change | GPT-5.6 got 1 of 7 builds and 12 of 21 phone layouts right first time; Opus 18 of 18 on phone |
| Exact-delta fixes from a written list, reviews with measurements | Claude Sonnet 5.5 | 31 of 31 on fix rounds and reviews, cheapest Claude |
| A job that failed its second fix round | Fable 5.1 | 3 of 3 fixed in one pass after 2 GPT failures each. Stop asking GPT-5.6 for a third round |
| Changing a generator or tool, re-cutting dozens of jobs, a long polish list across many screens | Claude Code cloud session, Fable 5.1 or Opus 5.5 with a cap ($10 to $15) | CC-007 did 100 jobs for $7.89 in 16 minutes; billed to credit, not your weekly limit |
| Chunked jobs that need long uninterrupted runs | Not Work mode | It asks for Continue every 10 to 20 seconds and eats the meter |
| Final review of a package | An Opus thread (as with job 108) or Codex with measurements attached | Both passed; Opus had the screenshots |

Three simple rules:

1. **Two FIX rounds on one job means change the worker**, not a third round.
2. **Anything with pixels goes to a model that renders and looks**, or gets a Claude check before it counts.
3. **Write down cost for every cloud session** (the CC-006 number was lost) and note which model did each fix, so the next scorecard can include cost per job.

## What this report itself cost (estimate)

Built by one Claude Sonnet 5.5 thread, about 45 tool calls, no sub-agents, covering the report, the PDF, the board table, the scorecard script and the Team G note. A thread cannot read its own bill, so this is **my estimate from the work done, not a measured number.**

- Prices used (Sonnet 5.5 API, from the claude-api reference, cached 25 Sep 2026): $2 per million input tokens, $10 per million output tokens, cache reads $0.20, cache writes about $2.50 (1.25 times input; that last rate is the standard multiplier, not listed there).
- Rough usage: about 170,000 new tokens added to the conversation (files, command output, my writing), about 20,000 of them output; the growing conversation was re-read from cache on each of about 45 calls, roughly 4.5 million cache-read tokens in total.
- Estimate: output about $0.20, cache reads about $0.90, cache writes about $0.45, so **about $1.50 in API terms (plausible range $1 to $2.50).**
- Against Nik's limit: his Claude plan limit is not shown in dollars, so how much of it this used **cannot be measured from here.** It ran on Sonnet, the cheapest Claude model offered here, and a one-off report this size is small next to the Opus and cloud sessions on the board.
- Not included: the coordinator thread's own routing, and the GPT side (unmeasurable).
