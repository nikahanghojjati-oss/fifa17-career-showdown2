# Bug hunt board

Updated Tue 6 Oct, 1:36 AM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).

🌐 **Live: 1.9.1-r62** (main `bc77a0b`, Mon 5 Oct 9:18 PM)

🩺 **All clear: every check has a machine.** · POS20 #304 6/16

## Jobs

**Next for you, in this order**

1. **1011** Plain-words sweep: jargon on game screens: type **1011** in the gameplay project (normal chat), new chat · 1014, 1015 and 1020 are merged
2. **1028** Statistics shows an abandoned-only career (hunt 1019 H5): GPT chat (normal mode), gameplay project: type 1028 · one-file fix, exact change in the ticket
3. **1006** Final Winner: last season's score block: type **1006** in a new Showdown visual chat

**Waiting on something else**

- **1005** Last season's score is skipped before the Final Winner · after Team V designs the combined screen (HO-011)

**Done, in the next release:** 1001, 1003, 1004, 1009, 1014, 1015, 1020, 1021

## Goals for Thursday

- 🐞 Bug-free game: 25.7882 % · 6 of 11 areas studied · open S1 3, S2 1 · fixed 0 of 4 findings · weakest: area 01 and 02
- 🎨 Mockup match: 1 of 16 screens studied · 7 differences from the mockups to fix

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

