# Bug hunt board · Haiku G

![Team G progress](board-chart.svg)

Updated Fri 9 Oct, 9:49 PM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views and the board artifact show this same board. History of every job and bug report: [Board history](BOARD_ARCHIVE.md) · hand-offs between teams: [relay](RELAY.md).

🌐 **Live: 1.9.1-r67** (main `f42dac2`, Fri 9 Oct 9:34 PM)

🩺 **All clear: every check has a machine.** · POS20 #304 6/16

## Jobs

**Done, waiting for the next release:** 1059, 1060

**Done and live:** r67: 1044, 1045, 1048, 1049, 1050, 1051, 1052, 1053, 1055, 1058 · r66: 1041, 1042, 1043 · r65: 1011, 1028, 1037, 1038, 1039, 1040 · r63: 1001, 1003, 1004, 1005, 1009, 1010, 1014, 1015, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8

**Done, no game code** (factory or handoff documents): 1046, 1047, 1054, 1056, 1057

## Goals, in this order

**1. Finish the remaining bugs** `now`  
`██████████` **96.1538 %**  
Numbered jobs: 50 done, 0 other open · Olympiad recheck: 23 of 23 settled, 0 still to fix · Sol's old leads: 3 open (0 real, 3 unsure)

**2. Visual fixes** `after stage 1`  
`█████░░░░░` **52.3810 %**  
Team V hand-offs: 11 of 21 done

**3. Match current desktop screens to the mockup** `after stage 2`  
`█░░░░░░░░░` **6.2500 %**  
Mockup Lab: 1 of 16 screens studied, 7 differences to fix

**4. Visual mockups for phone** `after stage 3`  
`░░░░░░░░░░` **0.0000 %**  
Not started

**5. Improved desktop versions** `after stage 4`  
`░░░░░░░░░░` **0.0000 %**  
Not started

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

## Shipped today

- 9:34 PM · #450 Release r67: Olympiad fixes and private transfer locks
- 12:04 PM · #440 Release r66: Season Results on phones, closed Final Winner on both phones
- 2:48 AM · #436 Release r65: career history fixes, auto close, plain words
- 1:44 AM · #429 Release r64: Forget device sign-back-in, phone LOCK MY SIGNINGS
- 1:20 AM · #435 Re-pin the composed Rules check to production main r63

