# Bug hunt board

Updated Thu 8 Oct, 10:09 PM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).

🌐 **Live: 1.9.1-r62** (main `bc77a0b`, Mon 5 Oct 9:18 PM)

🩺 **All clear: every check has a machine.** · Gate #427: L1✓ L2… L3… L4… L5✓ L6✓ · seal pending · POS20 #427 10/16

## Jobs

🚨 **Studio Z first: emergency fixes from Nik and Daniel's live test** · connectivity, sign-in, continuing after a refresh, old-build modules coming back, Transfer layout

**Running now**

- **Z1** Studio Z: sign-in starter race · worker done, in r63 PR #427, CI running
- **Z2** Studio Z: one-strike offline lock · worker done, in r63 PR #427, CI running
- **Z3** Studio Z: refresh resume · worker done, in r63 PR #427, CI running
- **Z4** Studio Z: automatic session handoff · worker done, in r63 PR #427, CI running
- **Z5** Studio Z: auto-apply updates · worker done, in r63 PR #427, CI running
- **Z6** Studio Z: stuck Google sign-in · worker done, in r63 PR #427, CI running
- **Z7** Studio Z: upright tablet layout · worker done, in r63 PR #427, CI running
- **Z8** Studio Z: typed league ambiguity · worker done, in r63 PR #427, CI running
- **1011** Plain-words sweep: jargon on game screens · worker done, lead checking
- **1028** Statistics shows an abandoned-only career (hunt 1019 H5) · worker done, lead checking

**Done, in the next release:** 1001, 1003, 1004, 1005, 1009, 1014, 1015, 1020, 1021

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
| 🟧 Team G lead | [PR #427](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/427) | Release r63: Studio Z fixes from the physical test, plus the waiting factory jobs | ⏳ 18 passed, 1 running |
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

