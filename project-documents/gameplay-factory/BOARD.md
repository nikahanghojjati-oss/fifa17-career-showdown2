# Bug hunt board · Haiku G

**How to type.** Type just the number. GPT jobs in a new ChatGPT chat, Codex jobs in a new Codex task. One-time setup: [INSTRUCTIONS.md](queue/INSTRUCTIONS.md) and [CODEX_SETUP.md](queue/CODEX_SETUP.md). Tomorrow's order: [TOMORROW.md](queue/TOMORROW.md).

![Jobs live per release](history-chart.svg)

![Team G progress](board-chart.svg)

Updated Sat 10 Oct, 11:17 AM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views and the board artifact show this same board. History of every job and bug report: [Board history](BOARD_ARCHIVE.md) · hand-offs between teams: [relay](RELAY.md).

🌐 **Live: 1.9.1-r67** (main `f42dac2`, Fri 9 Oct 9:34 PM)

🩺 **All clear: every check has a machine.** · POS20 #304 6/16

## Jobs

### ▶️ Running now

**#1 · 1580** `G` Showdown Gate: run the L5 lane only when its inputs changed  
`██████░░░░` **60.0000 %**  
⚪ Team white · **Codex default coding model** · High effort · worker done, PR #457 open, CI failed · CI 13 of 14 passed · last move 2 min ago

**#2 · 1584** `G` Measure the transfer screens at ten window sizes (report only)  
`████░░░░░░` **40.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · worker working, draft PR #469 · CI 6 of 7 passed · last move 1 min ago

### 👉 Next for you, in this order

**#1 · 1585** `G` Measure the season-final screens at ten window sizes (report only)  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · Codex cloud, this repo

Paste this:

```text
Career Mode Showdown, job 1585. First run: git fetch origin factory/gameplay-v1
Then read: git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-1585.md
Do exactly what that file says. If the file does not exist, stop and tell me. Never push to main and never merge. Open any pull request as a draft; if you cannot choose the base branch, write RETARGET TO gameplay/bug-list-1 on the first line of the PR body.
```

**#2 · 1586** `G` Measure the club screens at ten window sizes (report only)  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · Codex cloud, this repo

Paste this:

```text
Career Mode Showdown, job 1586. First run: git fetch origin factory/gameplay-v1
Then read: git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-1586.md
Do exactly what that file says. If the file does not exist, stop and tell me. Never push to main and never merge. Open any pull request as a draft; if you cannot choose the base branch, write RETARGET TO gameplay/bug-list-1 on the first line of the PR body.
```

### ⏸ Waiting on something else

**#1 · 1581** `G` Showdown Gate: split the slowest lane and cache downloads  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · High effort · later: after 1580 merges

**#2 · 1582** `G` Showdown Gate: screen shots of changed screens as a run artifact  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · later: after 1581 merges

**Done, waiting for the next release:** 1059, 1060, 1579, 1583, 1587

**Done and live:** r67: 1044, 1045, 1048, 1049, 1050, 1051, 1052, 1053, 1055, 1058 · r66: 1041, 1042, 1043 · r65: 1011, 1028, 1037, 1038, 1039, 1040 · r63: 1001, 1003, 1004, 1005, 1009, 1010, 1014, 1015, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8

**Done, no game code** (factory or handoff documents): 1046, 1047, 1054, 1056, 1057

## Goals, in this order

**1. Finish the remaining bugs** `now`  
`█████████░` **93.1034 %**  
Numbered jobs: 53 done, 6 other open · Olympiad recheck: 23 of 23 settled, 0 still to fix · Sol's old leads: 0 open (0 real, 0 unsure)

**2. Visual fixes** `after stage 1`  
`█████░░░░░` **50.0000 %**  
Team V hand-offs: 11 of 22 done

**3. Match current desktop screens to the mockup** `after stage 2`  
`█░░░░░░░░░` **6.2500 %**  
Mockup Lab: 1 of 16 screens studied, 7 differences to fix

**4. Visual mockups for phone** `after stage 3`  
`░░░░░░░░░░` **0.0000 %**  
Not started

**5. Improved desktop versions** `after stage 4`  
`░░░░░░░░░░` **0.0000 %**  
Not started

## Claude lane (nothing to type)

The mega factory or the lead marks a job NEEDS CLAUDE with the reason; the lead moves it to this lane with a purple, brown or black team colour and runs it. Nothing for Nik to type.

Claude takes a job when:

- Rules, sign-in or Firebase work that the ChatGPT safety filter blocks (Codex can still take Rules code when it needs no live run)
- Work that needs the emulator, a browser run, the two-phone journey or a live check of the deployed game
- Cross-screen or multi-file logic bigger than one GPT turn (more than about 5 reads, 3 writes or 200 lines, or more than one decision)
- A job GPT failed twice (wrong fix, stalled chat or red Gate) after it was split once
- Release, merge, deploy and Gate-seal work (lead only)

| Job | Team | Model | State | Why Claude |
| --- | --- | --- | --- | --- |
| **G-F7** Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | 🟤 | Claude Sonnet | queued after the Olympiad bug jobs (stage 1) | needs the emulator: a 10-season run |
| **G-F11** Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | 🟤 | Claude Sonnet | ready (Sonnet audit, then Opus fix) | cross-screen CSS collisions across old and new screens |
| **G-F18** Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen  | 🟣 | Claude Opus | queued for stage 2 (visual fixes); the history screens now load online (r65), the old-design shell is what remains | cross-screen audit with emulator screenshots |
| **G-F5** QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | 🟤 | Claude Sonnet | queued after the bug jobs | Gate and main-PR guard work |
| **G-F17** Showdown Gate: replace POS20 with a faster check system built on Claude and GitHub, keeping every check (plan: /mnt/proj | 🟣 | Claude Opus | shadow: KEEP_SHADOW after the 9 Oct independent audit (71/100); fixes 1043, 1044 and 1045 merged; the owner card waits for a fresh exit report | Gate design (lead only) |

## Mega factory

One numbered queue: type a bare number in any GPT chat. Live from GitHub (queue/QUEUE_STATE.json).

Type now, in any GPT chat:

```text
19 23 24 25 26 27 28 29 30 31 32 33
```

Open code PRs: 0/8.

22 taken of 518.

| Stage | Items | Merged | Picked up |
| --- | --- | --- | --- |
| audits | 112 | 0/112 | 11/112 |
| screen fixes | 266 | 0/266 | 10/266 |
| mockup match | 14 | 0/14 | 0/14 |
| phone studies | 70 | 0/70 | 0/70 |
| desktop studies | 56 | 0/56 | 0/56 |

**Last taken numbers**

| # | Job | State | Title |
| --- | --- | --- | --- |
| 22 | 1477 | branch only | Audit all screens: hard-coded colours that should use the design tokens |
| 21 | 1091 | on_train | Connect Players (start and join): fix the 390x844 view |
| 20 | 1476 | PR open | Audit all screens: stacking order: dialogs above screens, toasts above dialogs |
| 18 | 1475 | PR open | Audit all screens: picture descriptions and screen reader labels |
| 17 | 1409 | on_train | Rule Book: fix the 360x640 view |
| 16 | 1474 | PR open | Audit all screens: fonts: fallback while loading, no jumps |
| 15 | 1322 | on_train | Trophy Room: fix the 360x640 view |
| 14 | 1473 | PR open | Audit all screens: text contrast on plates and badges |
| 13 | 1293 | on_train | Legacy: fix the 360x640 view |
| 12 | 1472 | PR open | Audit all screens: empty, loading and waiting messages read the same everywhere |
| 11 | 1206 | on_train | Season Results: fix the 360x640 view |
| 10 | 1471 | PR open | Audit all screens: keyboard focus rings and reduced motion |
| 9 | 1177 | on_train | Transfer challenge and Signing Entry: fix the 360x640 view |
| 8 | 1470 | PR open | Audit all screens: phone held sideways: nothing hidden or overlapping |
| 7 | 1148 | on_train | Club packs: fix the 360x640 view |
| 6 | 1469 | PR open | Audit all screens: phone notch and bottom bar safe areas |
| 5 | 1119 | on_train | Select League: fix the 360x640 view |
| 4 | 1468 | PR open | Audit all screens: long manager and club names never break a layout |
| 3 | 1090 | on_train | Connect Players (start and join): fix the 360x640 view |
| 2 | 1467 | PR open | Audit all screens: tap targets of at least 44 px on every team v screen |

## Mega tracker (live, free)

Live page: [mega/index.html](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/mega/index.html) · summary: [mega/MEGA_TRACKER.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/mega/MEGA_TRACKER.md) · rebuilt by the poller each round, updated 2026-10-10T15:17:12Z.

| Stage | Done (merged or live) | In progress | Waiting |
| --- | --- | --- | --- |
| Gameplay audits | 0 of 112 | 11 | 101 |
| Screen fixes | 0 of 266 | 10 | 256 |
| Match desktop to mockups | 0 of 14 | 0 | 14 |
| Phone mockup studies | 0 of 70 | 0 | 70 |
| Improved desktop studies | 0 of 56 | 0 | 56 |

**Open train PRs**

- none open right now

**Latest finished numbers (up to 20)**

- none finished yet

## Other asks

- Nothing else needs you right now.

## Other Team G work

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟪 Sonnet | **G-F11** | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | ready |
| 🟪 Sonnet | **G-F5** | QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | queued after the bug jobs |
| 🟧 Opus | **G-F17** | Showdown Gate: replace POS20 with a faster check system built on Claude and GitHub, keeping every check (plan: /mnt/project-files/check-system/SHOWDOWN_GATE_PLAN.md) | shadow: KEEP_SHADOW after the 9 Oct independent audit · after exit bar: 10 real PRs agree (2 full seals), 2 canaries fail, 1 simulated outage recovers; POS20 stays the merge authority until then |
| 🟧 Opus | **G-F18** | Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen in a browser against Team V's design and route all of them to the new design | queued for stage 2 · after stage 2 |
| 🟪 Sonnet | **G-F7** | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | queued after the Olympiad bug jobs |


## Other Team V work

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟧 Opus | **V-F2** | Design changes from Nik and Daniel's 2.0 play-through (only real design changes; bugs stay with G) | queued · after G-F1 |

