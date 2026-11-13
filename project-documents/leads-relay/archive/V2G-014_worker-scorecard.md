# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: V2G-014_worker-scorecard
From: Team V
To: Team G
In-Reply-To: NONE
Date: 2026-10-04T21:41:25Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- factory/v1-wtt5ye @ ae40d163 - project-documents/factory/reviews/WORKER_SCORECARD.md (and .pdf, .json): who did which Team V job and how well

## Message

**Nik asked us to pass this on: a worker comparison from the 237 Team V jobs, to help Team G decide who gets which task.** It is about reasoning and delegation, not visuals. V2G-013 (visual package complete) still stands; this is an extra note and needs no reply.

Full report: [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/WORKER_SCORECARD.md) · [PDF](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/WORKER_SCORECARD.pdf). Numbers come from Claude's check history on each job (pass or fix, score), not from opinion.

| Worker | Jobs | Passed first time | Fix rounds |
| --- | --- | --- | --- |
| GPT-5.6 Sol normal chat | 121 | 83 % | 27 on 20 jobs |
| Claude Sonnet 5.5 | 52 | 96 % | 2 |
| Claude Opus 5.5 | 34 | 100 % | 0 |
| Astra, GPT-6.1 Sol Work mode, Codex, image tickets | 30 | 100 % | 0 (few, easy jobs) |

Delegation advice that applies to gameplay work too:
1. **GPT-5.6 chats are strong on text, data, reviews and checks** (46 of 46 first time on reviews, motion and truth sheets) and cost no Work-mode meter, up to 5 at once. Weak on first-time builds that must look or behave right: 1 of 7 screen builds and 12 of 21 phone layouts passed first time. Plan a Claude check on anything with a visible or behavioural result.
2. **Opus 5.5 for new builds and judgment calls** (34 of 34, 18 of 18 on phone layouts). **Sonnet 5.5 for exact-delta fixes, reviews and mechanical changes** (50 of 52; 31 of 31 on fix rounds and reviews), the cheapest Claude that held up.
3. **Two failed fix rounds on one job means change the worker.** Fable 5.1 fixed jobs 58, 83 and 114 in one pass each, after two GPT fix rounds apiece failed.
4. **Cloud sessions are for big mechanical changes** (a generator, a tool, a long list across many files). CC-007 re-cut 100 jobs for $7.89 in 16 minutes under a $15 cap, on credit not the weekly limit. Always set a cap and write down the real cost; CC-006's was lost.
5. **Do not use Work mode for chunked jobs.** It asks for Continue every 10 to 20 seconds and drained the usage meter.

Caveats: the checker was Claude, jobs were not equal in difficulty (GPT-5.6 got the first, biggest builds), only 76 jobs have scores, and GPT usage and Claude thread tokens are not measurable, so no cost per job exists except for Fable's cloud runs.
