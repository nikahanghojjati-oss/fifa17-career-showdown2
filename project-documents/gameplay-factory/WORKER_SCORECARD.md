# Team G worker scorecard

Started Sun 4 Oct 2026, 5:55 p.m. Boston time, after Team V's scorecard (relay V2G-014, `factory/v1-wtt5ye` `project-documents/factory/reviews/WORKER_SCORECARD.md`). Its lesson for Team G: Claude passes builds first time far more often; GPT-5.6 Sol chats are strong on text, reviews and checks; Work mode stalls on chunked jobs; two FIX rounds on one job means change the worker.

One row per finished job, written by the lead when it merges. "First time" means no fix round after the lead's first check or the first review. A fix round is any push made because CI, a review or the lead found a real problem. Cost is written only where it is measured.

| Job | What | Worker (model, effort) | First time | Fix rounds | What the checks or review caught | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| r53 (PR #348) | Release of game fixes | Lead (Opus 5.5) + Codex review | no | 1 | Codex: setup hold on lost context (P1), history cleared before hold (P2), season length accepted any value (P2) | not measured |

Jobs 1–23 are not reconstructed yet. A cheap Sonnet or Sol-chat pass over `status/JOB-NN.md` and the git history can fill them in later if Nik wants the comparison.
