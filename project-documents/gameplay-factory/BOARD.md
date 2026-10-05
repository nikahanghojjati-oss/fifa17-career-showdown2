# Team G gameplay board

28 of 33 jobs done (87 %) ████████░░ · branch `factory/gameplay-v1` · code PRs into `gameplay/recovery-v1` · generated 2026-10-05 12:00 AM Boston time (EDT)

## Scoreboard

⚽ **28 of 33 jobs done** · 1 in play · 🐞 see [BUG_BOARD.md](BUG_BOARD.md) · 🏁 no finish time yet (not enough data)

## ⚠ Stale status files

GitHub is the truth; these status files disagree with the PR and need an update by their owner:

* job 27: status file says not started, but PR #362 is failing
* job 29: status file says in progress, GitHub says merged (PR #357)
* job 31: status file says not written, GitHub says merged (PR #350)
* job 33: status file says not written, GitHub says merged (PR #358)

🧑‍💼 **Gaffer:** no fresh report (last one 10:07 PM Boston time, 1 h old); see the [Gaffer page](https://claude.ai/artifact/33Pw2Bioktj1Nv7ebEM94Q).

## Your next move

1. **Nothing for you to start right now.**

_Moving now:_ G-13d Part 2d: Transfer War; workers on jobs 27. _Next up:_ G-14 Acceptance: directive §12 and Sol's 8 proofs on the emulator, waits on nothing.

**Sol Work mode starter line** (copy it, change both `NN` to the job number, paste it as the first message):

```
Gameplay factory job NN. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then read WORKER_HANDBOOK.md next to it and do job NN (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

## Running now

<sub>Percent = finished steps weighted by typical step time, finish times are estimates ([how](ETA_STUDY.md)). Lanes: 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku</sub>

### 🟧 Job 27 · Transfer War screens · 87.5240 %

🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️ 🥅  
Opus · Lead (helper) · [PR #362](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/362) · 6 of 7 steps · updated Sun 4 Oct 9:06 PM Boston time  
🏁 **Likely finish:** waiting on the job's next report (last one 2 h ago)  
> **Now:** Lead reviewed; final checks running on the head with the latest test build  
> **Left:** Merged into the test build

### 🟪 Job 28 · Rivalry Stats and Legacy · 49.9040 %

🟪🟪🟪🟪🟪🟪🟪🟪🟪⚽▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️ 🥅  
Sonnet · Sonnet thread · [PR #352](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/352) · 9 of 11 steps · updated Sun 4 Oct 9:17 PM Boston time  
🏁 **Likely finish:** waiting on the job's next report (last one 2 h ago)  
> **Now:** Paused for usage reset; all my work is pushed, waiting on the lead's J10 fix then merge  
> **Left:** CI green on final head (waits on the J10 fix on recovery) → Lead review and merge

## Live fixes and bug hunt

From the read-only bug hunt on r52 (4 Oct; [report](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md)). Most likely to hit a real game first.

| # | Problem in plain words | How likely | Status | Who |
| --- | --- | --- | --- | --- |
| 1 | **Both managers tap at the same second and the slower one sees an error.** Hits Career Start, the Transfer Challenge locks and timer, and Setup confirm. Nothing is corrupted, but the loser must tap again. | likely | DONE · job 21, PR #344; live since r53 (2026-10-04) | lead |
| 2 | **A tied season is decided by league position.** Code and old notes disagree on equal non-zero scores. | likely | DONE · Nik chose league position; docs fixed in PR #343 (merged) | lead |
| 3 | **Nobody cross-checks the two managers' season results.** Both can publish position 1 or both tick Champions League. Nik chose (2026-10-04) to warn, not block: the commit screen now shows a CHECK RESULTS line on a clash and committing stays allowed (PR #346, merged into recovery dc78ed7). Live since r53. | medium | DONE · PR #346; live since r53 (2026-10-04) | lead |
| 4 | **Lock buttons have no confirm.** One stray tap on LOCK MY GUESSES or LOCK MY SIGNINGS locks an empty list for the season; the helpful error text is hidden behind a code. Lock buttons now ask "Lock N of 3?" when a form is partly filled (PR #345, merged into recovery 6974408). Live since r53. | medium-low | DONE · PR #345 adds the "Lock N of 3?" confirm; live since r53 (2026-10-04) | lead |
| 5 | **The 4-hour private session ends long games.** A 5 or 10 season game outlives one session, so both managers must open a fresh one. Needs one retest mid-season. Now job 31 (ten-season games). | low | DONE · job 31, PR #350 (recovery fb0dd02): one-tap reconnect after expiry; live at the next release | lead |

Small extras (cheap, optional): DONE in job 21: 'scoring remains locked' text now says SEASON COMMITTED · SCORE BELOW; NOT A BUG: Daniel/Nik fallbacks match the fixed roles (Daniel = Player One, Nik = Player Two); OPEN: raw error codes in the Setup settle text.

Live fix jobs open: [G-13d Part 2d: Transfer War](jobs/JOB-27.md) (in progress)

## Team V relay

24 messages in the [feed](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/FEED.md) · relay branch head `cdb827e`, last push Sun 4 Oct 8:47 PM Boston time · synced.

- **Latest from Team G:** G2V-012 · Sun 4 Oct 8:47 PM Boston time · Wiring status (24, 25, 26, 30, 33 merged; 27, 28, 29 in checks) and how to build your own progress board and share TEAM…
- **Latest from Team V:** V2G-016 · Sun 4 Oct 6:07 PM Boston time · Nik approved the visual package (5e05a1f): ship into G-13; main still waits for play-through + Nik's OK

**Open for the Team G lead to answer:** nothing.

Waiting on Team V: G2V-012.

## Jobs still open

| Job | What | Lane | Waits on | State |
| --- | --- | --- | --- | --- |
| G-14 | Acceptance: directive §12 and Sol's 8 proofs on the emulator | work | - | NOT WRITTEN |
| G-15 | One real two-device run with Nik | nik | job 14 | NOT WRITTEN |
| G-13d | [Part 2d: Transfer War](jobs/JOB-27.md) | lead | - | IN PROGRESS |
| G-13e | [Part 2e: Rivalry Statistics and Legacy (History)](jobs/JOB-28.md) | work | - | BLOCKED |
| G-2i | [Fewer taps: audit the flow for steps we can safely drop](jobs/JOB-32.md) | lead | - | NOT WRITTEN |

<details>
<summary><b>Finished work: 28 jobs</b> (click to open)</summary>

- 0 Setup: 3 of 3 done
- 1 Safety net: 8 of 8 done
- 2 Career model: 5 of 5 done
- 3 Career history: 4 of 4 done
- IN PROGRESS: 2 of 2 done
- MERGED: 2 of 2 done
- READY: 4 of 6 done

Full list of every job with its state: [BOARD_ARCHIVE.md](BOARD_ARCHIVE.md).

</details>

Lanes: **chat** = normal Sol chat (text and PRs only); **work** = Sol Work mode (terminal and npm; emulator proofs run on CI); **lead** = the Team G lead does it; **nik** = Nik on his real devices. NOT WRITTEN = job file not written yet, never start it. Capacity: 2 chats and 1 Work-mode chat at once.

This page rebuilds itself on GitHub when a job moves or Team V posts to the relay (workflows `gameplay-factory-board.yml` and `leads-relay-ping.yml`). Made by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json`, `status/` and the relay feed. Workers never edit it.
