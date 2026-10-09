# Bug hunt board

Updated Fri 9 Oct, 6:54 PM Boston time. Bug hunting only, no new features until further notice. The Team G and Team V Custom views and the board artifact show this same board. History of every job and bug report: [Board history](BOARD_ARCHIVE.md) · hand-offs between teams: [relay](RELAY.md).

🌐 **Live: 1.9.1-r66** (main `8e1a583`, Fri 9 Oct 12:04 PM)

🩺 **All clear: every check has a machine.** · POS20 #304 6/16

## Jobs

### ▶️ Running now

**#1 · 1049** `G` Club reveal stops spoiling the sealed club (Olympiad V3)  
`██████████` **100.0000 %** worker's part done  
🔵 Team blue · **GPT-6 Sol** · High effort · worker done, lead checking

**#2 · 1051** `G` Transfer ledger hash no longer reveals locked guesses (Olympiad V6)  
`░░░░░░░░░░` **0.0000 %**  
🟤 Team brown · **Claude Sonnet 5.5** · Medium effort · with the worker

**#3 · 1052** `G` Transfer Rules reject option ids the game cannot read (Olympiad V7)  
`░░░░░░░░░░` **0.0000 %**  
🟤 Team brown · **Claude Sonnet 5.5** · Medium effort · with the worker

### 👉 Next for you, in this order

**#1 · 1050** `G` Unfinished Signing Entry rows survive a refresh (Olympiad V4)  
`░░░░░░░░░░` **0.0000 %**  
🟡 Team yellow · **GPT Luna (Work mode); if it fails, Sol 6.1 Work mode** · High effort · ChatGPT project "Career Mode Showdown", new chat switched to Work mode

Paste this:

```text
Job 1050. Read the ticket at https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/jobs/JOB-1050.md and the worker handbook it links, then do the whole job in one run without stopping to ask. Start from branch gameplay/bug-list-1, run node and the checks the ticket names, push branch gameplay/job-1050-signing-draft, open the PR into gameplay/bug-list-1, and end with 'Job 1050 done, PR <link>.'
```

**#2 · 1045** `G` Showdown Gate: pin actions and tool installs (audit F4)  
`░░░░░░░░░░` **0.0000 %**  
⚪ Team white · **Codex default coding model** · Medium effort · Codex cloud, this repo, branch gameplay/bug-list-1

Paste this:

```text
Job 1045 for this repo. First read the ticket: run `git fetch origin factory/gameplay-v1` then `git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-1045.md` (or open https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/jobs/JOB-1045.md). Do exactly what it says. Ignore copies of job files on any other branch. Create your branch from origin/gameplay/bug-list-1 and open the PR into gameplay/bug-list-1. Never push to main.
```

### ⏸ Waiting on something else

**#1 · 1053** `G` Restore on an empty device respects Keep current (Olympiad V5)  
`░░░░░░░░░░` **0.0000 %**  
🔵 Team blue · **GPT-6 Sol** · High effort · waits: held: worker done

**Done, in the next release:** 1001, 1003, 1004, 1005, 1009, 1010, 1011, 1014, 1015, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1046, 1047, 1048, 1054, Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8

## Goals, in this order

**1. Finish the remaining bugs** `now`  
`████████░░` **83.5821 %**  
Numbered jobs: 38 done, 1 other open · Olympiad recheck: 18 of 23 settled, 5 still to fix · Sol's old leads: 5 open (1 confirmed, the rest to recheck on live)

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

- 12:04 PM · #440 Release r66: Season Results on phones, closed Final Winner on both phones
- 2:48 AM · #436 Release r65: career history fixes, auto close, plain words
- 1:44 AM · #429 Release r64: Forget device sign-back-in, phone LOCK MY SIGNINGS
- 1:20 AM · #435 Re-pin the composed Rules check to production main r63

