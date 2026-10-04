# Team G gameplay board

19 of 22 jobs done (86 %) ████████░░ · branch `factory/gameplay-v1` · code PRs into `gameplay/recovery-v1` · generated 2026-10-04 12:27 PM Boston time (EDT)

## Your next move

1. **Nothing for you to start right now.**

_Moving now:_ bug hunt 1 (job 21, PR #344: retry once quietly). _Next up:_ G-13 Remove the r43 containment, bind #trophyRoomButton, waits on approved Team V visual package.

**Sol Work mode starter line** (copy it, change both `NN` to the job number, paste it as the first message):

```
Gameplay factory job NN. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then read WORKER_HANDBOOK.md next to it and do job NN (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

## Live fixes and bug hunt

From the read-only bug hunt on r52 (4 Oct; [report](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md)). Most likely to hit a real game first.

| # | Problem in plain words | How likely | Status | Who |
| --- | --- | --- | --- | --- |
| 1 | **Both managers tap at the same second and the slower one sees an error.** Hits Career Start, the Transfer Challenge locks and timer, and Setup confirm. Nothing is corrupted, but the loser must tap again. | likely | IN PROGRESS · job 21, PR #344: retry once quietly | lead |
| 2 | **A tied season is decided by league position.** Code and old notes disagree on equal non-zero scores. | likely | DECIDED · Nik chose league position; fix the notes and docs that say draw | lead |
| 3 | **Nobody cross-checks the two managers' season results.** Both can publish position 1 or both tick Champions League, and a published result cannot be corrected. | medium | TO PLAN WITH LEAD | lead |
| 4 | **Lock buttons have no confirm.** One stray tap on LOCK MY GUESSES or LOCK MY SIGNINGS locks an empty list for the season; the helpful error text is hidden behind a code. | medium-low | TO PLAN WITH LEAD | lead |
| 5 | **The 4-hour private session ends long games.** A 5 or 10 season game outlives one session, so both managers must open a fresh one. Needs one retest mid-season. | low | TO PLAN WITH LEAD | lead |

Small extras (cheap, optional): stale 'scoring remains locked' text after season commit; hard-coded Daniel/Nik name fallbacks; raw error codes in the Setup settle text.

## Team V relay

15 messages in the [feed](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/FEED.md) · relay branch head `a9771b9`, last push Sun 4 Oct 12:25 PM Boston time · synced.

- **Latest from Team G:** G2V-009 · Sat 3 Oct 7:55 PM Boston time · Gameplay done before G-13; when is the visual package ready? G-10 transfer fields
- **Latest from Team V:** V2G-010 · Sun 4 Oct 12:16 PM Boston time · Nik's shared goal: both boards at 100 % = Nik and Daniel play the live game with the new visual pack start to finish, b…

**Open for the Team G lead to answer:**
- V2G-009 · Sat 3 Oct 11:24 PM · Visual package ready for Nik's review ~Wed 7 Oct; wire Trophy Room + Career Statistics fi… (reply only if: wiring those two first does not work)
- V2G-010 · Sun 4 Oct 12:16 PM · Nik's shared goal: both boards at 100 % = Nik and Daniel play the live game with the new… (reply only if: your end differs or you see a gap)

Waiting on Team V: nothing.

## Jobs still open

| Job | What | Lane | Waits on | State |
| --- | --- | --- | --- | --- |
| G-13 | Remove the r43 containment, bind #trophyRoomButton | work | approved Team V visual package | NOT WRITTEN |
| G-14 | Acceptance: directive §12 and Sol's 8 proofs on the emulator | work | job 13 | NOT WRITTEN |
| G-15 | One real two-device run with Nik | nik | job 14 | NOT WRITTEN |

<details>
<summary><b>Finished work: 19 jobs</b> (click to open)</summary>

- 0 Setup: 3 of 3 done
- 1 Safety net: 7 of 7 done
- 2 Career model: 5 of 5 done
- 3 Career history: 4 of 4 done

Full list of every job with its state: [BOARD_ARCHIVE.md](BOARD_ARCHIVE.md).

</details>

Lanes: **chat** = normal Sol chat (text and PRs only); **work** = Sol Work mode (terminal and npm; emulator proofs run on CI); **lead** = the Team G lead does it; **nik** = Nik on his real devices. NOT WRITTEN = job file not written yet, never start it. Capacity: 2 chats and 1 Work-mode chat at once.

This page rebuilds itself on GitHub when a job moves or Team V posts to the relay (workflows `gameplay-factory-board.yml` and `leads-relay-ping.yml`). Made by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json`, `status/` and the relay feed. Workers never edit it.
