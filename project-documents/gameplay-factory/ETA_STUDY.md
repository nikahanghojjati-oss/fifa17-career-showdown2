# How the four-decimal percentage and finish time work

Written Sun 4 Oct 2026, evening Boston time. Rebuild the numbers with `python3 tools/eta_study.py project-documents/gameplay-factory` (needs `gh`); it writes `ETA_MODEL.json`.

## What was measured

* **CI:** 126 pull-request runs since 3 Oct. One run takes a median **7.0 min** (typical range 6.5 to 8.0).
* **Finished Claude-lane PRs** (merge-time minus open-time, minus CI, minus the wait for the lead): 8 feature/screen jobs and 7 small live fixes.

| | Whole PR | CI total (reruns included) | Wait for lead merge | Work left over |
| --- | --- | --- | --- | --- |
| Fix PR (n=7) | 10 min (9 to 22) | 6.5 | 3.4 | 1 |
| Job PR (n=8) | 60 min (42 to 87) | 24 | 2.5 | 26 |

(Median, with the typical range in brackets.)

## What could not be used

* **Jobs 1 to 23 (Sol chat and Work mode):** the PR was opened when the work was already finished (8 to 20 minutes of PR life), and no start time was kept. They show no usable duration.
* **Team V's jobs:** relay V2G-014 and the scorecard count passes and fix rounds, with no start and finish times, so they cannot feed a time model.
* **Sol, Codex and Haiku live jobs:** no finished job to learn from. They get the exact percentage (finished steps over all steps) and the words "not enough data" in place of a finish time. Opus and Sonnet are pooled; only Opus has a long record.

## How the numbers are made

1. Each step in a job's progress block is sorted by its name into **CI**, **review/merge**, **sync** or **work**.
2. Each type gets minutes from the table above, split across the steps of that type. CI steps use the CI total, review/merge steps the lead wait, and work and sync steps share the rest.
3. **Percent** = minutes of finished steps over minutes of all steps, printed to four decimals. A job with a long CI step moves less when a short step finishes, which is what really happens.
4. **Finish time** = the time of the last finished step (`done_at`, or the report time) plus the minutes of the steps left. The range uses the fast (25th percentile) and slow (75th percentile) minutes, with the slow lead wait set to 20 minutes because jobs have waited that long behind other merges.
5. If at least two work steps carry `done_at`, the job's **own measured minutes per work step** replace the history for its work steps.
6. The estimate depends only on what the job reported, never on the clock, so the 3-minute poller only commits when a job reports. If the slow end has passed, the board says "past the estimate; the next report will move it".

## Backtest (leave one out, on the 15 finished Claude-lane PRs)

* **At the moment a job opens, predicting the whole lifetime:** median error **54 %**, and the real time landed inside the stated range 8 times out of 15. Job length varies too much (a job's fix rounds and waiting behind other merges) for a start-of-job estimate to be good. Treat it as rough.
* **After the last code push, predicting the merge** (CI plus lead wait, about 10 min, range 7.5 to 20): median error **9 min**, inside the range **9 of 15** times. All six misses were jobs that sat 22 to 54 minutes waiting for other merges or a re-sync. When nothing is queued, it is within 1 to 2 minutes.

So the finish time is trustworthy in the last stretch (CI and merge), and loose earlier. It improves as jobs report `done_at` on each step.

## Rule for job threads

Add `"done_at":"<ISO time>"` to every step you finish in the progress block, and keep step names plain (say "CI green", "Lead review and merge", "Merge recovery").
