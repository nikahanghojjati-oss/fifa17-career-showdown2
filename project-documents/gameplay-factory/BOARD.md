# Bug hunt board

Updated Mon 5 Oct, 11:08 PM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).

🌐 **Live: 1.9.1-r62** (main `bc77a0b`, Mon 5 Oct 9:18 PM)

🩺 **All clear: every check has a machine.** · POS20 #304 6/16

## Jobs

**Running now**

- **1025** Terminal close recovery and closed-frame trophies (hunt 1017 H1-H3) · with the lead
- **1026** New shared season clears last season's result fields (hunt 1017 H4) · with the lead
- **1027** Restore keeps and checks the Save Library; career cache race (hunt 1019 H1, H2, H4) · with the lead

**Next for you, in this order**

1. **1011** Plain-words sweep: jargon on game screens: type **1011** in the gameplay project (normal chat), new chat · 1014, 1015 and 1020 are merged
2. **1006** Final Winner: last season's score block: type **1006** in a new Showdown visual chat

**Waiting on something else**

- **1028** Statistics shows an abandoned-only career (hunt 1019 H5) · after 
- **1005** Last season's score is skipped before the Final Winner · after Team V designs the combined screen (HO-011)
- **1023** Session code replacement: double tap and lost join watcher · after 
- **1024** Reconnect keeps stale authority after sign-out, offline or expiry · after 

**Done, in the next release:** 1001, 1003, 1004, 1009, 1014, 1015, 1020, 1021

## Other asks

- **r62 is live.** On the laptop, close every game tab in Chrome and reopen the game; if Settings still looks clipped, do it once more.
- **G-F1** Play a game of the live version (r62) with Daniel on two phones and send what goes wrong to the bug factory thread.
- **G-F22** Five pairing choices. The lead brings them to you on one card; nothing to do until then.

## Other Team G work

**Fixing now**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟧 Opus | **G-F17** | Showdown Gate: replace POS20 with a faster check system built on Claude and GitHub, keeping every check (plan: /mnt/project-files/check-system/SHOWDOWN_GATE_PLAN.md) | building shadow |
| 🟧 Opus | **G-F18** | Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen in a browser against Team V's design and route all of them to the new design | in progress |

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟪 Sonnet | **G-F5** | QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | next |
| 🟪 Sonnet | **G-F11** | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | ready |
| 🟦 Sol chat | **G-F4** | GPT Q&A team: scripted paths and code-vs-rulebook reads | queued · after G-F1 |
| 🟪 Sonnet | **G-F7** | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | queued · after G-F1 |


## Other Team V work

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

