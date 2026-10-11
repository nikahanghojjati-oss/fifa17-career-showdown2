# Bug hunt board · Haiku G

**How to type.** Type just the number. GPT jobs in a new ChatGPT chat, Codex jobs in a new Codex task. One-time setup: [INSTRUCTIONS.md](queue/INSTRUCTIONS.md) and [CODEX_SETUP.md](queue/CODEX_SETUP.md). Tomorrow's order: [TOMORROW.md](queue/TOMORROW.md).

![Jobs live per release](history-chart.svg)

![Team G progress](board-chart.svg)

Updated Sun 11 Oct, 3:01 AM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views and the board artifact show this same board. History of every job and bug report: [Board history](BOARD_ARCHIVE.md) · hand-offs between teams: [relay](RELAY.md).

🌐 **Live: 1.9.1-r70** (main `c8810b8`, Sun 11 Oct 12:28 AM)

🩺 **All clear: every check has a machine.** · POS20 #304 6/16

## Jobs

### ▶️ Running now

**#1 · 1005** `G` Last season's score is skipped before the Final Winner  
`█████░░░░░` **50.0000 %**  
🟢 Team green · model not set · worker says done, no PR yet

**#2 · 1581** `G` Showdown Gate: split the slowest lane and cache downloads  
`██████░░░░` **60.0000 %**  
⚪ Team white · **Codex default coding model** · High effort · worker done, PR #618 open, CI failed · CI 7 of 8 passed · last move 17 min ago

**#3 · 1592** `G` Wire Team V study 1110: Connect Players phone  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #667 · CI 6 of 7 passed · last move 6 min ago

**#4 · 1593** `G` Wire Team V study 1372: Rivalry Statistics phone  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #668 · CI 6 of 7 passed · last move 90 min ago

**#5 · 1594** `G` Wire Team V study 1169: Club Assignment (redo train)  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #669 · CI 6 of 7 passed · last move 70 min ago

**#6 · 1595** `G` Wire Team V study 1171: Club Assignment (redo train)  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #669 · CI 6 of 7 passed · last move 70 min ago

**#7 · 1596** `G` Wire Team V study 1172: Club Assignment (redo train)  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #669 · CI 6 of 7 passed · last move 70 min ago

**#8 · 1600** `G` Wire Team V study 1374: Rivalry Statistics sideways  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #668 · CI 6 of 7 passed · last move 90 min ago

**#9 · 1601** `G` Wire Team V study 1375: Rivalry Statistics tablet  
`████░░░░░░` **40.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · worker working, draft PR #668 · CI 6 of 7 passed · last move 90 min ago

**#10 · 1606** `G` Fix (verify first) audit 88: failed refresh shown as publish failure (Season Results)  
`██████░░░░` **60.0000 %**  
🔵 Team blue · **GPT-6 Sol** · High effort · worker done, PR #662 open, CI failed · CI 13 of 14 passed · last move 14 min ago

**#11 · 1607** `G` Fix (verify first) audit 92: failed refresh shown as commit failure (Season Commit)  
`██████░░░░` **60.0000 %**  
🔵 Team blue · **GPT-6 Sol** · High effort · worker done, PR #663 open, CI failed · CI 13 of 14 passed · last move 12 min ago

**#12 · 1608** `G` Fix (verify first) audit 116: background read disables Shared Setup buttons  
`██████░░░░` **60.0000 %**  
🔵 Team blue · **GPT-6 Sol** · High effort · worker done, PR #665 open, CI failed · CI 13 of 14 passed · last move 13 min ago

### 👉 Next for you, in this order

**#1 · 1589** `G` Browser test that catches the old-design flash on screen changes (tests only)  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · Codex cloud, this repo

Paste this:

```text
Career Mode Showdown, job 1589. First run: git fetch origin factory/gameplay-v1
Then read: git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-1589.md
Do exactly what that file says. If the file does not exist, stop and tell me. Never push to main and never merge. Open any pull request as a draft; if you cannot choose the base branch, write RETARGET TO gameplay/bug-list-1 on the first line of the PR body.
```

**#2 · 1590** `G` Audit: which screens have no Team V look yet (read only)  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT-6 Sol** · High effort · ChatGPT project "Career Mode Showdown", normal chat

Paste this:

```text
1590
```

**#3 · 1602** `G` Wire Team V study 1402: Career Statistics  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1602
```

**#4 · 1603** `G` Wire Team V study 1403: Career Statistics  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1603
```

**#5 · 1604** `G` Wire Team V study 1404: Career Statistics  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1604
```

**#6 · 1605** `G` Trophy Room picked-tab: 1536 art, lazy, toward PHONE_TROPHY_ROOM_SINGLE  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1605
```

**#7 · 1609** `G` Transfer phone study D faithful to PHONE_TRANSFER  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT-6 Sol** · High effort · ChatGPT project "Career Mode Showdown", normal chat

Paste this:

```text
1609
```

**#8 · 1612** `G` Wire Team V study 1284: Final Winner  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1612
```

**#9 · 1613** `G` Wire Team V study 1287: Final Winner  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1613
```

**#10 · 1614** `G` Wire Team V study 1288: Final Winner  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1614
```

**#11 · 1615** `G` Wire Team V study 1313: Legacy  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1615
```

**#12 · 1616** `G` Wire Team V study 1316: Legacy  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1616
```

**#13 · 1617** `G` Wire Team V study 1342: Trophy Room  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1617
```

**#14 · 1618** `G` Wire Team V study 1346: Trophy Room  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1618
```

**#15 · 1619** `G` Wire Team V study 1460: Settings  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1619
```

**#16 · 1620** `G` Wire Team V study 1461: Settings  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1620
```

**#17 · 1621** `G` Wire Team V study 1462: Settings  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1621
```

**#18 · 1622** `G` Study re-run (1139): Select League phone mockup, version A (faithful)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1622
```

**#19 · 1623** `G` Study re-run (1140): Select League phone mockup, version B (bold hierarchy)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1623
```

**#20 · 1624** `G` Study re-run (1141): Select League phone mockup, version C (compact)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1624
```

**#21 · 1625** `G` Study re-run (1142): Select League sideways phone study  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1625
```

**#22 · 1626** `G` Study re-run (1143): Select League upright tablet study  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1626
```

**#23 · 1627** `G` Study re-run (1082): Home phone mockup, version B (bold hierarchy)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1627
```

**#24 · 1628** `G` Study re-run (1083): Home phone mockup, version C (compact)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1628
```

**#25 · 1629** `G` Study re-run (1084): Home sideways phone study  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1629
```

**#26 · 1630** `G` Wire Team V study 1622: Select League (phone)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1630
```

**#27 · 1631** `G` Wire Team V study 1625: Select League (sideways)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1631
```

**#28 · 1632** `G` Wire Team V study 1626: Select League (tablet)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1632
```

**#29 · 1633** `G` Wire Team V study 1627: Home (phone)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1633
```

**#30 · 1634** `G` Wire Team V study 1629: Home (sideways)  
`░░░░░░░░░░` **0.0000 %**  
🟢 Team green · **GPT Sol 6.1** · High effort · ChatGPT Work mode (Sol 6.1), type one number at a time, in order

Paste this:

```text
1634
```

**#31 · 1637** `G` Polish wave: Home  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1637
```

**#32 · 1638** `G` Polish wave: Start and Join  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1638
```

**#33 · 1639** `G` Polish wave: Select League  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1639
```

**#34 · 1640** `G` Polish wave: Club Assignment  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1640
```

**#35 · 1641** `G` Polish wave: Transfer  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1641
```

**#36 · 1642** `G` Polish wave: Season and Final Winner  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1642
```

**#37 · 1643** `G` Polish wave: Rivalry and Legacy  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1643
```

**#38 · 1644** `G` Polish wave: Career screens  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1644
```

**#39 · 1645** `G` Polish wave: Rules and Settings  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT Sol (chat)** · ChatGPT chat (GPT-6 Sol, GitHub connector), type the number

Paste this:

```text
1645
```

**#40 · 1591** `G` Home soundtrack: swap to Nik's Audius top 10  
`░░░░░░░░░░` **0.0000 %**  
🟣 Team purple · model not set · Claude lane: Opus Medium for the change, Sonnet for the live listen and browser check: type 'Job 1591'

Type this in Claude lane: Opus Medium for the change, Sonnet for the live listen and browser check:

```text
Job 1591
```

**#41 · 1635** `G` Smooth screen transitions, and nothing from the old game ever flashes  
`░░░░░░░░░░` **0.0000 %**  
worker not set · model not set · Nik, in a claude.ai/code **cloud session** on repo `nikahanghojjati-oss/fifa17-career-showdown2`: type 'Job 1635'

Type this in Nik, in a claude.ai/code **cloud session** on repo `nikahanghojjati-oss/fifa17-career-showdown2`:

```text
Job 1635
```

### ⏸ Waiting on something else

**#1 · 1582** `G` Showdown Gate: screen shots of changed screens as a run artifact  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · later: after 1581 merges

**#2 · 1597** `G` Wire Team V study 1226: Season Results  
`░░░░░░░░░░` **0.0000 %**  
🟣 Team purple · **Claude Opus** · High effort · Claude lane: Opus fixing #666 after two failed browser checks

**#3 · 1598** `G` Wire Team V study 1229: Season Results  
`░░░░░░░░░░` **0.0000 %**  
🟣 Team purple · **Claude Opus** · High effort · Claude lane: Opus fixing #666 after two failed browser checks

**#4 · 1599** `G` Wire Team V study 1230: Season Results  
`░░░░░░░░░░` **0.0000 %**  
🟣 Team purple · **Claude Opus** · High effort · Claude lane: Opus fixing #666 after two failed browser checks

**Done, waiting for the next release:** 1583, 1584, 1585, 1586

**Done and live:** r68: 1059, 1060, 1579, 1580, 1587 · r67: 1044, 1045, 1048, 1049, 1050, 1051, 1052, 1053, 1055, 1058 · r66: 1041, 1042, 1043 · r65: 1011, 1028, 1037, 1038, 1039, 1040 · r63: 1001, 1003, 1004, 1009, 1010, 1014, 1015, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8

**Done, no game code** (factory or handoff documents): 1046, 1047, 1054, 1056, 1057

## Goals, in this order

**1. Finish the remaining bugs** `now`  
`██████░░░░` **59.5745 %**  
Numbered jobs: 56 done, 57 other open · Olympiad recheck: 23 of 23 settled, 0 still to fix · Sol's old leads: 0 open (0 real, 0 unsure)

**2. Visual fixes** `after stage 1`  
`██████░░░░` **56.0000 %**  
Team V hand-offs: 14 of 25 done

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
| **G-F24** Team V sheet loader: toggle link.sheet.disabled instead of link.disabled so Chromium stops refetching Team V sheets on e | 🟤 | Claude Sonnet | ready (PR #485 merged into gameplay/bug-list-1, 111b6a3) | browser-visible loader timing plus three contracts; needs a browser repro |
| **G-F25** Shared session expiry: the Spark providers clamp expiresAtEpochMs to now+1 (Math.max(epochMs+1, expiresAt)), so the prot | 🟣 | Claude Opus | ready | sign-in/session area the ChatGPT filter blocks, and the same pattern in several providers (setup, season results and others) |

## Mega factory

One numbered queue: type a bare number in any GPT chat. Live from GitHub (queue/QUEUE_STATE.json).

Type now, in any GPT chat:

```text
127 131 133 147 159 173 179 189 400 411 428 456
```

Open code PRs: 0/8.

403 taken of 518.

| Stage | Items | Merged | Picked up |
| --- | --- | --- | --- |
| audits | 112 | 112/112 | 112/112 |
| screen fixes | 266 | 25/266 | 90/266 |
| mockup match | 14 | 0/14 | 1/14 |
| phone studies | 70 | 23/70 | 60/70 |
| desktop studies | 56 | 0/56 | 1/56 |

**Last taken numbers**

| # | Job | State | Title |
| --- | --- | --- | --- |
| 403 | 1356 | on_train | Rivalry Statistics: fix the 768x1024 view |
| 395 | 1355 | closed | Rivalry Statistics: fix the 932x430 view |
| 387 | 1354 | closed | Rivalry Statistics: fix the 844x390 view |
| 379 | 1353 | closed | Rivalry Statistics: fix the 430x932 view |
| 372 | 1086 | PR open | Home: improved desktop, version A (polish) |
| 371 | 1352 | closed | Rivalry Statistics: fix the 390x844 view |
| 364 | 1346 | merged | Trophy Room: upright tablet study |
| 363 | 1351 | closed | Rivalry Statistics: fix the 360x640 view |
| 362 | 1201 | closed | Transfer challenge and Signing Entry: upright tablet study |
| 360 | 1114 | closed | Connect Players (start and join): upright tablet study |
| 356 | 1462 | merged | Settings: upright tablet study |
| 355 | 1312 | closed | Legacy: hover-only effects |
| 354 | 1230 | merged | Season Results: upright tablet study |
| 350 | 1375 | merged | Rivalry Statistics: upright tablet study |
| 348 | 1317 | closed | Legacy: upright tablet study |
| 346 | 1143 | closed | Select League: upright tablet study |
| 344 | 1085 | closed | Home: upright tablet study |
| 342 | 1288 | merged | Final Winner (Showdown Champion): upright tablet study |
| 340 | 1172 | merged | Club packs: upright tablet study |
| 338 | 1404 | merged | Career Statistics: upright tablet study |

## Mega tracker (live, free)

Live page: [mega/index.html](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/mega/index.html) · summary: [mega/MEGA_TRACKER.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/mega/MEGA_TRACKER.md) · rebuilt by the poller each round, updated 0.

| Stage | Done (merged or live) | In progress | Waiting |
| --- | --- | --- | --- |
| Gameplay audits | 112 of 112 | 0 | 0 |
| Screen fixes | 25 of 266 | 65 | 176 |
| Match desktop to mockups | 0 of 14 | 1 | 13 |
| Phone mockup studies | 23 of 70 | 37 | 10 |
| Improved desktop studies | 0 of 56 | 1 | 55 |

**Open train PRs**

- 661

**Latest finished numbers (up to 20)**

- #1578 · Audit js/v10Screens.js for gameplay bugs (second half) · merged
- #1577 · Audit js/v10Screens.js for gameplay bugs (first half) · merged
- #1576 · Audit js/homeScreensV10.js for gameplay bugs (second half) · merged
- #1575 · Audit js/homeScreensV10.js for gameplay bugs (first half) · merged
- #1574 · Audit js/seasonFinalV10.js for gameplay bugs (second half) · merged
- #1573 · Audit js/seasonFinalV10.js for gameplay bugs (first half) · merged
- #1572 · Audit js/clubScreenV10.js for gameplay bugs (second half) · merged
- #1571 · Audit js/clubScreenV10.js for gameplay bugs (first half) · merged
- #1570 · Audit js/transferScreenV10.js for gameplay bugs (second half) · merged
- #1569 · Audit js/transferScreenV10.js for gameplay bugs (first half) · merged
- #1568 · Audit js/rivalryLegacyV10.js for gameplay bugs (second half) · merged
- #1567 · Audit js/rivalryLegacyV10.js for gameplay bugs (first half) · merged
- #1566 · Audit js/careerScreensV10.js for gameplay bugs (second half) · merged
- #1565 · Audit js/careerScreensV10.js for gameplay bugs (first half) · merged
- #1564 · Audit js/sparkCompletedTransferHistoryReader.js for gameplay bugs (second half) · merged
- #1563 · Audit js/sparkCompletedTransferHistoryReader.js for gameplay bugs (first half) · merged
- #1562 · Audit js/sparkCompletedShowdownReader.js for gameplay bugs (second half) · merged
- #1561 · Audit js/sparkCompletedShowdownReader.js for gameplay bugs (first half) · merged
- #1560 · Audit js/offlineApp.js for gameplay bugs (second half) · merged
- #1559 · Audit js/offlineApp.js for gameplay bugs (first half) · merged

## Other asks

- Nothing else needs you right now.

## Other Team G work

**Up next**

| Lane | Item | What | State |
| --- | --- | --- | --- |
| 🟪 Sonnet | **G-F11** | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names); then archive old-design CSS no Team V screen needs into archive/old-design/ (C-2 from the old-design flash fix, after the GPT-B audit; archive, don't delete) | ready |
| 🟪 Sonnet | **G-F24** | Team V sheet loader: toggle link.sheet.disabled instead of link.disabled so Chromium stops refetching Team V sheets on each screen change (labels blank ~100 ms returning Home); update contracts F3, F3b and HO-020 with it (C-1) | ready |
| 🟧 Opus | **G-F25** | Shared session expiry: the Spark providers clamp expiresAtEpochMs to now+1 (Math.max(epochMs+1, expiresAt)), so the protocol's expiry check can never fail. Decide whether this is a deliberate clock-skew guard (Rules check request.time) or a bug; fix across the providers or document it, with contracts (audit items 118, 78, 84, 94) | ready |
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

- 12:28 AM · #639 Release r70: soundtrack top 10 and phone fixes (1.9.1-r70)

