# Bug hunt board

Updated Mon 5 Oct, 9:25 PM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).

🌐 **Live: 1.9.1-r62** (main `bc77a0b`, Mon 5 Oct 9:18 PM)

🐕 **Barking: POS20 on #312 has waited 6 min for a machine; Showdown Gate on #396 has waited 5 min for a machine; POS20 on #396 has waited 5 min for a machine; POS20 on #395 has waited 5 min for a machine; POS20 has waited 3 min for a machine.** · Gate #395: L1✗ L2… L3… L4… L5… L6… · seal pending · POS20 #395 2/16

## Needs you

- **r62 is live.** On the laptop, close every game tab in Chrome and reopen the game; if Settings still looks clipped, do it once more.
- **G-F1** Play a game of the live version (r62) with Daniel on two phones and send what goes wrong to the bug factory thread.
- **G-F22** Five pairing choices. The lead brings them to you on one card; nothing to do until then.
- **1009** Showdown Champion: dark oval over the losing manager. Type 1009 in the gameplay project to start it.
- **1010** 10-season sweep: scoring, history and final math. Type 1010 in the gameplay project (Work mode) to start it.
- **1011** Plain-words sweep: jargon on game screens. Type 1011 in the gameplay project (Work mode) to start it.
- **V-1006** Final Winner: last season's score block. Type 1006 in a new Showdown visual chat to start it.
- **V-1007** Transfer War phone: early-end button visible. Type 1007 in a new Showdown visual chat to start it.

## Team G

**Fixing now**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟧 Team G lead | [PR #396](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/396) | INFRA SIM: L5 setup dies on attempt 1 for the Showdown Gate shadow (never merge) | 🔴 3 passed, 13 running, 1 failed |
| 🟧 Team G lead | [PR #395](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/395) | CANARY: planted failing tests for the Showdown Gate shadow (never merge) | 🔴 2 passed, 14 running, 1 failed |
| 🟧 Opus | **G-F17** | Showdown Gate: replace POS20 with a faster check system built on Claude and GitHub, keeping every check (plan: /mnt/project-files/check-system/SHOWDOWN_GATE_PLAN.md) | building shadow |
| 🟧 Opus | **G-F18** | Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen in a browser against Team V's design and route all of them to the new design | in progress |
| 🟦 Sol chat | **1001** | Home desktop tile icons: bigger, inside the tile, never on the text | in release |
| 🟦 Sol chat | **1003** | Transfer War: main's copy of Team V's early-end string matches (HO-010) | in release |
| 🟦 Sol chat | **1004** | Rule Book: remove the useless 01-06 side number rail (desktop and phone) | with worker |

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟪 Sonnet | **G-F5** | QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | next |
| 🟪 Sonnet | **G-F11** | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | ready |
| 🟦 Sol chat | **G-F4** | GPT Q&A team: scripted paths and code-vs-rulebook reads | queued · after G-F1 |
| 🟪 Sonnet | **G-F7** | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | queued · after G-F1 |
| 🟩 Sol Work mode | **1005** | Last season's score is skipped before the Final Winner | ready · after Team V designs the combined screen (HO-011) |


## Team V

**Fixing now**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟦 Sol chat | [V-1006](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/393) | Final Winner: last season's score block | waiting for Nik to type 1006 in a new Showdown visual chat · 25 % (1 of 4 steps) |
| 🟦 Sol chat | [V-1007](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/394) | Transfer War phone: early-end button visible | waiting for Nik to type 1007 in a new Showdown visual chat · 33 % (1 of 3 steps) |

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟧 Opus | **V-F2** | Design changes from Nik and Daniel's 2.0 play-through (only real design changes; bugs stay with G) | queued · after G-F1 |

## Shipped today

- 9:18 PM · #386 Showdown Gate (shadow): six-lane check beside POS20, not required yet
- 8:35 PM · #390 Release r62: bug-hunt fixes (errors, reconnect, auto final winner, desktop Settings, phone Home)
- 7:37 PM · #387 Physio: a watched workflow that isn't on main no longer fails the sweep
- 7:18 PM · #385 Physio: re-run checks GitHub gave no machine, pause helpers while checks wait
- 5:37 PM · #383 Release r61: phone track list stops below the logo and scrolls
- 2:51 PM · #378 G-36: No old player photos + seven Home tiles (r60)
- 1:55 PM · #377 G-35: Team V screen fixes HO-003 + HO-004 (r59, includes r58)
- 11:47 AM · #371 G-34: Team V's Club Assignment on the live screen (r57)
- 8:47 AM · #369 Live 2.0 screen fixes: Trophy Room clipping, Start Showdown art, Continue Career 17 player
- 8:47 AM · #370 Version 2.0 polish from Nik's live review (r56)
- 7:55 AM · #368 Keep keyboard focus when the Settings look loads
- 7:03 AM · #367 Publish Team V files on the live site
- 1:00 AM · #366 Release Version 2.0: Team V screens, fewer taps and game fixes (runtime 1.9.1-r54)

