# Team G gameplay board

20 of 23 jobs done (91 %) █████████░ · branch `factory/gameplay-v1` · code PRs into `gameplay/recovery-v1` · generated 2026-10-04 4:23 PM Boston time (EDT)

## Your next move

1. **Nothing for you to start right now.**

_Moving now:_ no job is running right now. _Next up:_ G-13 Part 1: Trophy Room and Career Statistics on the real career model, waits on nothing.

**Sol Work mode starter line** (copy it, change both `NN` to the job number, paste it as the first message):

```
Gameplay factory job NN. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then read WORKER_HANDBOOK.md next to it and do job NN (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

## Live fixes and bug hunt

From the read-only bug hunt on r52 (4 Oct; [report](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md)). Most likely to hit a real game first.

| # | Problem in plain words | How likely | Status | Who |
| --- | --- | --- | --- | --- |
| 1 | **Both managers tap at the same second and the slower one sees an error.** Hits Career Start, the Transfer Challenge locks and timer, and Setup confirm. Nothing is corrupted, but the loser must tap again. | likely | DONE · job 21, PR #344 merged into the gameplay branch; reaches the live app at the next release | lead |
| 2 | **A tied season is decided by league position.** Code and old notes disagree on equal non-zero scores. | likely | DONE · Nik chose league position; docs fixed in PR #343 (merged) | lead |
| 3 | **Nobody cross-checks the two managers' season results.** Both can publish position 1 or both tick Champions League. Nik chose (2026-10-04) to warn, not block: the commit screen now shows a CHECK RESULTS line on a clash and committing stays allowed (PR #346, merged into recovery dc78ed7). Live after the next release. | medium | DONE | lead |
| 4 | **Lock buttons have no confirm.** One stray tap on LOCK MY GUESSES or LOCK MY SIGNINGS locks an empty list for the season; the helpful error text is hidden behind a code. Lock buttons now ask "Lock N of 3?" when a form is partly filled (PR #345, merged into recovery 6974408). Live after the next release. | medium-low | DONE · job 21 shows the helpful error text and caps names at 80; the confirm step is still to plan | lead |
| 5 | **The 4-hour private session ends long games.** A 5 or 10 season game outlives one session, so both managers must open a fresh one. Needs one retest mid-season. | low | TO PLAN WITH LEAD | lead |

Small extras (cheap, optional): DONE in job 21: 'scoring remains locked' text now says SEASON COMMITTED · SCORE BELOW; NOT A BUG: Daniel/Nik fallbacks match the fixed roles (Daniel = Player One, Nik = Player Two); OPEN: raw error codes in the Setup settle text.

## Team V relay

19 messages in the [feed](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/FEED.md) · relay branch head `8029dac`, last push Sun 4 Oct 4:22 PM Boston time · synced.

- **Latest from Team G:** G2V-010 · Sun 4 Oct 12:40 PM Boston time · Same end as your board; gameplay gaps from the bug hunt (items 3-5, tie rule) are ours; G-13 part 1 = Trophy Room + Car…
- **Latest from Team V:** V2G-013 · Sun 4 Oct 4:22 PM Boston time · Visual package complete (238/238): G-13 can wire all 15 screens; Audius music across screens; CC-008 polish pass to fol…

**Open for the Team G lead to answer:**
- V2G-011 · Sun 4 Oct 12:42 PM · Start G-13 now on all built screens (Legacy later today); job 102 read as delivered; full… (reply only if: 102 is wrong or on the tie question)

Waiting on Team V: nothing.

## Jobs still open

| Job | What | Lane | Waits on | State |
| --- | --- | --- | --- | --- |
| G-13 | [Part 1: Trophy Room and Career Statistics on the real career model](jobs/JOB-13.md) | work | - | MERGED |
| G-14 | Acceptance: directive §12 and Sol's 8 proofs on the emulator | work | job 13 | NOT WRITTEN |
| G-15 | One real two-device run with Nik | nik | job 14 | NOT WRITTEN |

<details>
<summary><b>Finished work: 20 jobs</b> (click to open)</summary>

- 0 Setup: 3 of 3 done
- 1 Safety net: 8 of 8 done
- 2 Career model: 5 of 5 done
- 3 Career history: 4 of 4 done

Full list of every job with its state: [BOARD_ARCHIVE.md](BOARD_ARCHIVE.md).

</details>

Lanes: **chat** = normal Sol chat (text and PRs only); **work** = Sol Work mode (terminal and npm; emulator proofs run on CI); **lead** = the Team G lead does it; **nik** = Nik on his real devices. NOT WRITTEN = job file not written yet, never start it. Capacity: 2 chats and 1 Work-mode chat at once.

This page rebuilds itself on GitHub when a job moves or Team V posts to the relay (workflows `gameplay-factory-board.yml` and `leads-relay-ping.yml`). Made by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json`, `status/` and the relay feed. Workers never edit it.
