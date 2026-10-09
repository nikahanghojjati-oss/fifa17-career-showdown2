# Bug hunt board

Updated Fri 9 Oct, 6:46 PM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).

🌐 **Live: 1.9.1-r66** (main `8e1a583`, Fri 9 Oct 12:04 PM)

🐕 **Barking: Gameplay Fast on #444 has waited 4 min for a machine; POS20 on #444 has waited 4 min for a machine; POS20 has waited 3 min for a machine.** · POS20 #304 6/16

## Jobs

**Running now**

- **1048** (G) Rule Book: three missing rules, and the season review stops pointing at a missing button (Olympiad V1, V2) · worker done, lead checking · Sol chat · not started
- **1049** (G) Club reveal stops spoiling the sealed club (Olympiad V3) · worker done, lead checking · Sol chat · not started
- **1051** (G) Transfer ledger hash no longer reveals locked guesses (Olympiad V6) · with the worker · Sonnet · not started
- **1052** (G) Transfer Rules reject option ids the game cannot read (Olympiad V7) · with the worker · Sonnet · not started

**Next for you, in this order**

1. **1053** (G, Sol chat) Restore on an empty device respects Keep current (Olympiad V5): type **1053** ChatGPT project "Career Mode Showdown", new normal chat · split out of 1049 to keep each chat job one turn; ticket jobs/JOB-1053.md
2. **1050** (G, Sol Work mode) Unfinished Signing Entry rows survive a refresh (Olympiad V4): type **1050** ChatGPT project "Career Mode Showdown", new chat switched to Work mode · must run code (node checks), so Work mode; Luna is the cheapest Work mode model, first Luna run; ticket jobs/JOB-1050.md
3. **1045** (G, Codex) Showdown Gate: pin actions and tool installs (audit F4): type **1045** Codex cloud, this repo, branch gameplay/bug-list-1 · ticket jobs/JOB-1045.md; stays Codex: it must read GitHub Actions release tags, which chat and Claude lanes cannot

**Done, in the next release:** 1001, 1003, 1004, 1005, 1009, 1010, 1011, 1014, 1015, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1046, 1047, 1054, Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8

## Goals, in this order

1. **Finish the remaining bugs** (now) · 80.3030 % · Numbered jobs: 37 done, 1 other open · Olympiad recheck: 16 of 23 settled, 7 still to fix · Sol's old leads: 5 open (1 confirmed, the rest to recheck on live)
2. **Visual fixes** (later) · 52.3810 % · Team V hand-offs: 11 of 21 done
3. **Match current desktop screens to the mockup** (later) · 6.2500 % · Mockup Lab: 1 of 16 screens studied, 7 differences to fix
4. **Visual mockups for phone** (later) · 0.0000 % · Not started
5. **Improved desktop versions** (later) · 0.0000 % · Not started

## Other asks

- **r62 is live.** On the laptop, close every game tab in Chrome and reopen the game; if Settings still looks clipped, do it once more.
- **G-F1** Play a game of the live version (r62) with Daniel on two phones and send what goes wrong to the bug factory thread.
- **G-F22** Five pairing choices. The lead brings them to you on one card; nothing to do until then.

## Other Team G work

**Fixing now**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟧 Opus | **G-F18** | Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen in a browser against Team V's design and route all of them to the new design | in progress |

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟪 Sonnet | **G-F5** | QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | next |
| 🟪 Sonnet | **G-F11** | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | ready |
| 🟧 Opus | **G-F17** | Showdown Gate: replace POS20 with a faster check system built on Claude and GitHub, keeping every check (plan: /mnt/project-files/check-system/SHOWDOWN_GATE_PLAN.md) | shadow: KEEP_SHADOW after the 9 Oct independent audit · after exit bar: 10 real PRs agree (2 full seals), 2 canaries fail, 1 simulated outage recovers; POS20 stays the merge authority until then |
| 🟦 Sol chat | **G-F4** | GPT Q&A team: scripted paths and code-vs-rulebook reads | queued · after G-F1 |
| 🟪 Sonnet | **G-F7** | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | queued · after G-F1 |


## Other Team V work

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟧 Opus | **V-F2** | Design changes from Nik and Daniel's 2.0 play-through (only real design changes; bugs stay with G) | queued · after G-F1 |

## Shipped today

- 12:04 PM · #440 Release r66: Season Results on phones, closed Final Winner on both phones
- 2:48 AM · #436 Release r65: career history fixes, auto close, plain words
- 1:44 AM · #429 Release r64: Forget device sign-back-in, phone LOCK MY SIGNINGS
- 1:20 AM · #435 Re-pin the composed Rules check to production main r63

