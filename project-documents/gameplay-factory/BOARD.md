# Bug hunt board

Updated Fri 9 Oct, 1:46 AM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).

🌐 **Live: 1.9.1-r64** (main `963a9791`, Fri 9 Oct 1:44 AM)

🐕 **Barking: POS20 on #424 has waited 22 min for a machine; POS20 has waited 1 min for a machine; Gameplay Fast has waited 1 min for a machine.** · POS20 #304 6/16

## Jobs

**Running now**

- **1011** Plain-words sweep: jargon on game screens · worker done, lead checking

**Waiting on something else**

- **1041** Season Results on phone: ACKNOWLEDGE reachable, no inner scroll box, title clear, photos aligned · waiting on r64

**Done, in the next release:** 1001, 1003, 1004, 1005, 1009, 1014, 1015, 1020, 1021, 1028, 1037, 1038, 1039, 1040, Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8

## Goals for Thursday

- 🐞 Bug-free game: 30.8709 % · 11 of 11 areas studied · open S1 12, S2 19 · fixed 0 of 38 findings · weakest: area 03 and 07
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

## Shipped today

- 1:44 AM · #429 Release r64: Forget device sign-back-in, phone LOCK MY SIGNINGS
- 1:20 AM · #435 Re-pin the composed Rules check to production main r63

