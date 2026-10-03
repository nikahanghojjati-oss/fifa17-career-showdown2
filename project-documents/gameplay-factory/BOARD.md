# Team G gameplay factory board

**Sol Work mode starter line.** Copy it, change both `NN` to the job number, and paste it as the first message:

```
Gameplay factory job NN. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then read WORKER_HANDBOOK.md next to it and do job NN (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

Branch `factory/gameplay-v1` · code PRs into `gameplay/recovery-v1` · generated 2026-10-03 11:15 AM Boston time (EDT)

**Overall:** ███████░░░ 72 % · 13 of 20 jobs done

**Start now in a normal chat (press Stay in Chat):** -

**Start now in Sol Work mode (press Use Work, paste the starter line from RULES.md):** -

**Working:** 9, 10 · **Blocked:** 16

## Team V relay

**Live** on branch `leads/relay` (12 messages, [feed](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/FEED.md)).

- Latest from Team G: **G2V-008** · Sat 3 Oct 10:55 AM Boston time · Fixture update: after a Showdown closes, Daniel gets CREATE and Nik gets JOIN (model bug fixed, 5 files regenerated)
- Latest from Team V: **V2G-005** · Sat 3 Oct 10:25 AM Boston time · Sol capacity lessons: 2 steps per turn, saved steps, no Actions polling, no worker QA, text-only uploads; please apply to Team G jobs

Waiting on: nobody (no reply owed)

## Jobs

| # | G id | Job | Phase | Type | Lane | Depends on | Codex | Progress | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | G-0 | [Factory smoke test (chat lane)](jobs/JOB-00.md) | 0 Setup | test | chat | - |  | ██████████ 100 % | DONE |
| 90 | G-0W | [Factory smoke test (Work lane)](jobs/JOB-90.md) | 0 Setup | test | work | - |  | ██████████ 100 % | DONE |
| 1 | G-1 | [Fast regression CI on every gameplay push](jobs/JOB-01.md) | 0 Setup | build | work | - |  | ██████████ 100 % | DONE |
| 2 | G-2 | [Two-manager journey on the emulator (provider level)](jobs/JOB-02.md) | 1 Safety net | test | chat | 1 |  | ██████████ 100 % | DONE |
| 17 | G-2c | [Simultaneous result taps: loser gets stale, not denied](jobs/JOB-17.md) | 1 Safety net | fix | chat | 2 |  | ██████████ 100 % | DONE |
| 16 | G-2b | [Two-manager browser journey (localhost-only emulator switch)](jobs/JOB-16.md) | 1 Safety net | test | chat | 2, 7, 17 |  | ███████░░░ 77 % | BLOCKED |
| 12 | G-12 | [Composed production Rules regression](jobs/JOB-12.md) | 1 Safety net | test | work | 7, 8, 10 | yes | ░░░░░░░░░░ 0 % | NOT STARTED |
| 3 | G-3 | [Pure shared career model + tests](jobs/JOB-03.md) | 2 Career model | build | work | - |  | ██████████ 100 % | DONE |
| 5 | G-5 | [Active Showdown adapter (Rivalry, Continue, tiebreak, final state)](jobs/JOB-05.md) | 2 Career model | build | work | 3 |  | ██████████ 100 % | DONE |
| 4 | G-4 | [Renderer seams: screens take a model, never the local path](jobs/JOB-04.md) | 2 Career model | build | work | 3 |  | ██████████ 100 % | DONE |
| 6 | G-6 | [Start/Join view model + nav.locked](jobs/JOB-06.md) | 2 Career model | build | chat | - |  | ██████████ 100 % | DONE |
| 11 | G-11 | [Contract fixtures generated from the real model](jobs/JOB-11.md) | 2 Career model | test | work | 3, 5 |  | ██████████ 100 % | DONE |
| 7 | G-7 | [Career index Rules + client + emulator proofs](jobs/JOB-07.md) | 3 Career history | rules | work | 1, 2 | yes | ██████████ 100 % | DONE |
| 8 | G-8 | [Completed-only read grant + session-free reader](jobs/JOB-08.md) | 3 Career history | rules | work | 7 | yes | ██████████ 100 % | DONE |
| 9 | G-9 | [Closed-Showdown adapter into the career model](jobs/JOB-09.md) | 3 Career history | build | work | 3, 8 |  | ███████░░░ 71 % | IN PROGRESS |
| 10 | G-10 | [Transfer history, completed only](jobs/JOB-10.md) | 3 Career history | rules | work | 8 | yes | ░░░░░░░░░░ 0 % | IN PROGRESS |
| 13 | G-13 | Remove the r43 containment, bind #trophyRoomButton | 4 Ship | build | work | 4, 5, 6, 9; approved Team V visual package |  | ░░░░░░░░░░ 0 % | NOT WRITTEN |
| 14 | G-14 | Acceptance: directive §12 and Sol's 8 proofs on the emulator | 4 Ship | test | work | 13 |  | ░░░░░░░░░░ 0 % | NOT WRITTEN |
| 15 | G-15 | One real two-device run with Nik | 4 Ship | nik | nik | 14 |  | ░░░░░░░░░░ 0 % | NOT WRITTEN |
| 18 | G-2d | [Nik's pair code survives the pair-panel re-render](jobs/JOB-18.md) | 1 Safety net | build | chat | - |  | ██████████ 100 % | DONE |

Lanes: **chat** = normal GPT-5.6 Sol chat (text and PRs only: no npm, no screenshots); **work** = Sol Work mode (terminal and npm; emulator proofs run on GitHub CI); **nik** = Nik on his real devices. NOT WRITTEN = the lead has not written the job file yet; never start it.

Capacity: 2 normal chats and 1 Work-mode chat at once for Team G.

This page rebuilds itself on GitHub every time a job moves (workflow `gameplay-factory-board.yml`), so it is always current. Generated by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json` and `status/`. Workers never edit this file.
