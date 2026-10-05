# Showdown board: G Factory and V Factory

33 of 33 jobs done (100 %) ██████████ · branch `factory/gameplay-v1` · code PRs into `gameplay/recovery-v1` · generated 2026-10-05 11:06 AM Boston time (EDT)

## Scoreboard

⚽ **33 of 33 jobs done** · 0 in play · 🐞 see [BUG_BOARD.md](BUG_BOARD.md) · 🏁 last running job likely done about 10:46 AM Boston time

🧑‍💼 **Gaffer:** no fresh report (last one 12:06 AM Boston time, 11 h old); see the [Gaffer page](https://claude.ai/artifact/33Pw2Bioktj1Nv7ebEM94Q).

## Live now

🌐 **main `00a1eb8` · runtime 1.9.1-r56** · last change Mon 5 Oct 8:47 AM Boston time: Version 2.0 polish from Nik's live review (r56) (#370)

- 🔧 Live fix in review: [PR #371](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/371) G-34: Team V's Club Assignment on the live screen (r57)

**Shipped to the live game today (5):**

- ✅ 8:47 AM · [PR #369](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/369) Live 2.0 screen fixes: Trophy Room clipping, Start Showdown art, Continue Career 17 player
- ✅ 8:47 AM · [PR #370](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/370) Version 2.0 polish from Nik's live review (r56)
- ✅ 7:55 AM · [PR #368](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/368) Keep keyboard focus when the Settings look loads
- ✅ 7:03 AM · [PR #367](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/367) Publish Team V files on the live site
- ✅ 1:00 AM · [PR #366](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/366) Release Version 2.0: Team V screens, fewer taps and game fixes (runtime 1.9.1-r54)

## Your next move

1. **Play r56 with Daniel** (close and reopen the app once). Report anything odd to the coordinator in the project chat.

_Moving now:_ no job is running right now.

**Sol Work mode starter line** (copy it, change both `NN` to the job number, paste it as the first message):

```
Gameplay factory job NN. Read https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/RULES.md and obey the box in it as your rules, then read WORKER_HANDBOOK.md next to it and do job NN (repo nikahanghojjati-oss/fifa17-career-showdown2, branch factory/gameplay-v1). Ignore any older relay contract or memory.
```

## Running now

<sub>Percent = finished steps weighted by typical step time, finish times are estimates ([how](ETA_STUDY.md)). Lanes: 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku</sub>

### 🟧 Job 34 · Club Assignment (Team V design) · 38.0678 %

🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️ 🥅  
Opus · Lead (helper) · [PR #371](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/371) · 3 of 5 steps · updated Mon 5 Oct 10:14 AM Boston time  
🏁 **Likely finish:** about 10:46 AM (likely 10:32 AM to 11:09 AM) Boston time  
> **Now:** Gates running on the exact head  
> **Left:** All 16 checks green on the exact head → Merged into main and live

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

## 🟢 G Factory

_Gameplay, online sync, every merge and every release (senior director)._

**Workers:** 🟧 Opus (Lead: decides, merges, ships; risky fixes) · 🟪 Sonnet (Bug hunts, audits, repros, board tools) · 🟨 Haiku (Copy and refresh chores) · 🟦 Sol chat (Triage, repro steps, PR review (no Claude usage)) · 🟩 Sol Work mode (Terminal and npm jobs, one bug at a time) · ⬜ Codex (Auto-review on every PR (out of usage since 5 Oct)) · 👤 Nik and Daniel (Real phones with Daniel: the only physical proof)

| # | Future work | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| G-F1 | Nik and Daniel play 2.0 on their phones | 👤 Nik and Daniel | waiting on Nik | - |
| G-F10 | Club Assignment: wire Team V's approved design (hands, seams, new layout) into the live screen | 🟧 Opus | waiting on Nik (PR #371, r57, 16/16 green) | Nik: merge 371 |
| G-F5 | QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | 🟪 Sonnet | next | G-F10's PR open |
| G-F6 | Small gameplay follow-ups: transfer message after session expiry, raw error codes in Setup, 'Career screens could not load' toast when the online history is only unavailable | 🟩 Sol Work mode | ready | - |
| G-F11 | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | 🟪 Sonnet | queued (Sonnet audit, then Opus fix) | HO-004 findings |
| G-F12 | No player photos on League and Club; hidden photos stop downloading under Team V skins | 🟪 Sonnet | queued | Nik's OK (he named Start only; Team V truth says no photos anywhere) |
| G-F3 | Bug-hunting factory: one report thread, Sonnet hunts, Opus fixes, small batch releases | 🟪 Sonnet | queued | G-F1 and Nik's OK |
| G-F4 | GPT Q&A team: scripted paths and code-vs-rulebook reads | 🟦 Sol chat | queued | G-F1 |
| G-F7 | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | 🟪 Sonnet | queued | G-F1 |
| G-F8 | Commit and acknowledge a season in one tap (tap audit R7) | 🟧 Opus | needs Nik's call | Nik |
| G-F9 | 72-character pairing code exchange (needs a Rules change) | 🟧 Opus | needs Nik's call | Nik's typed words |

## 🔵 V Factory (Team V's own board features it)

<sub>Visuals and presentation: design changes, art, screen skins (assistant director). Workers: 🟧 Opus (Visual lead: taste, final polish, checks) · 🟪 Sonnet (HTML/CSS builds from a clear spec) · 🟦 Sol chat (Truth sheets, text and checks (no Claude usage)) · 🟩 Sol Work mode (Work-mode builds) · 🟫 Astra (Rare senior review) · 🟥 Image tickets (ChatGPT image tickets (art, plates)) · ⬜ Codex (Package review)</sub>

No Team V job is reporting yet (Team V jobs show here once a PR titled `V-…` carries a progress block). Board 1 (retired): Board 1 (visual package): 238 of 238 jobs done and checked ([link](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/BOARD.md)).

| # | Future work | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| HO-001 | Use hand-off tickets for passing work (relay v1.1) (hand-off) | 🟧 Opus | Delivered | Team V |
| HO-002 | Smooth stage atmosphere on idle screens (pointer stutter root cause) (hand-off) | 🟧 Opus | Delivered | Team V |
| HO-003 | Header chips and footer design on Team V screens (hand-off) | 🟧 Opus | Delivered | Team V |
| HO-004 | Visual QA: live 2.0 screens vs approved frames (hand-off) | 🟪 Sonnet | Delivered | Team V |
| HO-005 | Mobile Home hero: ghost coat between Daniel and Nik (hand-off) | 🟥 Image tickets | Delivered | Team V |
| V-F2 | Design changes from Nik and Daniel's 2.0 play-through (only real design changes; bugs stay with G) | 🟧 Opus | queued | G-F1 |

## 📡 Relay and hand-offs

**Relay health:** ✅ working · 27 messages, 5 hand-offs · branch head `d47c08e` (Mon 5 Oct 9:02 AM Boston time) · **[Read every message in full: RELAY.md](RELAY.md)**

| Hand-off | From → To | What | Progress |
| --- | --- | --- | --- |
| [HO-001](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/handoffs/HO-001_use-hand-off-tickets-for-passing-work-re.md) | G → V | Use hand-off tickets for passing work (relay v1.1) | ✅ Sent → ✅ **Delivered** → ○ Received → ○ In progress → ○ Done |
| [HO-002](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/handoffs/HO-002_smooth-stage-atmosphere-on-idle-screens-.md) | G → V | Smooth stage atmosphere on idle screens (pointer stutter root cause) | ✅ Sent → ✅ **Delivered** → ○ Received → ○ In progress → ○ Done |
| [HO-003](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/handoffs/HO-003_header-chips-and-footer-design-on-team-v.md) | G → V | Header chips and footer design on Team V screens | ✅ Sent → ✅ **Delivered** → ○ Received → ○ In progress → ○ Done |
| [HO-004](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/handoffs/HO-004_visual-qa-live-2-0-screens-vs-approved-f.md) | G → V | Visual QA: live 2.0 screens vs approved frames | ✅ Sent → ✅ **Delivered** → ○ Received → ○ In progress → ○ Done |
| [HO-005](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/handoffs/HO-005_mobile-home-hero-ghost-coat-between-dani.md) | G → V | Mobile Home hero: ghost coat between Daniel and Nik | ✅ Sent → ✅ **Delivered** → ○ Received → ○ In progress → ○ Done |

Latest messages:
- G2V-014 · Mon 5 Oct 8:55 AM · Team G → Team V · Relay v1.1: hand-off tickets (Sent, Delivered, Received, In progress, Done) carry passed work in fu…
- V2G-017 · Mon 5 Oct 8:46 AM · Team V → Team G · Shared board adopted (Team V board retired, V- PRs with progress blocks from the next job); G2V-012…
- G2V-013 · Mon 5 Oct 1:01 AM · Team G → Team V · Version 2.0 is live on main (eb1ec8e, r54): all Team V screens shipped, gameplay fixes included, no…
- G2V-012 · Sun 4 Oct 8:47 PM · Team G → Team V · Wiring status (24, 25, 26, 30, 33 merged; 27, 28, 29 in checks) and how to build your own progress…

**Open for the Team G lead to answer:** nothing.
**Waiting on Team V:** nothing.

## G Factory jobs still open

None. Every job is done.

<details>
<summary><b>Finished work: 33 jobs</b> (click to open)</summary>

- 0 Setup: 3 of 3 done
- 1 Safety net: 8 of 8 done
- 2 Career model: 5 of 5 done
- 3 Career history: 4 of 4 done
- DONE: 1 of 1 done
- IN PROGRESS: 2 of 2 done
- MERGED: 2 of 2 done
- READY: 6 of 6 done
- SKIPPED: 2 of 2 done

Full list of every job with its state: [BOARD_ARCHIVE.md](BOARD_ARCHIVE.md).

</details>

Lanes: **chat** = normal Sol chat (text and PRs only); **work** = Sol Work mode (terminal and npm; emulator proofs run on CI); **lead** = the Team G lead does it; **nik** = Nik on his real devices. NOT WRITTEN = job file not written yet, never start it. Capacity: 2 chats and 1 Work-mode chat at once.

This page rebuilds itself on GitHub when a job moves or Team V posts to the relay (workflows `gameplay-factory-board.yml` and `leads-relay-ping.yml`). Made by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json`, `status/` and the relay feed. Workers never edit it.
