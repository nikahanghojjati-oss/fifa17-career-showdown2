# Showdown board: G Factory and V Factory

🌐 **Live: runtime 1.9.1-r61** (main `84a04d8`) · 🔄 **16 moving** · ⏭ 2 up next · 👤 6 waiting on Nik · 🗂 4 later · updated 2026-10-05 8:07 PM Boston time (EDT)

🩺 **All clear: every check has a machine.** · POS20 #390 13/16

## Your next move

1. **Nothing waits on you right now.** r62 (PR #390) is in checks; after it ships, press Update once on the laptop.

## 🔄 Moving now

| Release / fix | Checks on the latest commit | Updated |
| --- | --- | --- |
| [PR #390](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/390) Release r62: bug-hunt fixes (errors, reconnect, auto final winner, desktop Settings, phon… | 🔴 13 passed, 3 failed | 8:00 PM |
| [PR #386](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/386) Showdown Gate (shadow): six-lane check beside POS20, not required yet | 🟢 23 passed | 7:38 PM |
| [PR #384](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/384) Every screen in Team V's look: signed-out career screens, Showdown Home, season review, L… | 🟢 12 passed | 6:29 PM |

| Team | Job | What | Worker | Where it is | Details |
| --- | --- | --- | --- | --- | --- |
| G | G-F6 | Transfer screen race (was the flaky v10-transfer test): a slow load raised a red error toast over REFRESH on phones, and the desktop window button sat below the screen | 🟧 Opus | in r62 (PR #390, head bb827862) | 0 failures in 66 runs, was about 1 in 7 |
| G | G-F6b | Same ResizeObserver fix on the Club screen; the harmless browser "ResizeObserver loop" warning never shows players an error toast | 🟪 Sonnet | in r62 (PR #390, head bb827862) | r62 merge to main |
| G | G-F17 | Showdown Gate: replace POS20 with a faster check system built on Claude and GitHub, keeping every check (plan: /mnt/project-files/check-system/SHOWDOWN_GATE_PLAN.md) | 🟧 Opus | building shadow; then ~10-PR shadow (3-5 days), then archive POS20 | Nik 6:02 PM Boston time: gradual replacement; POS20 is archived to authority-history/pos20-archive/, not deleted |
| G | G-F18 | Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen in a browser against Team V's design and route all of them to the new design | 🟧 Opus | in progress (thread "Old-design screen audit", Nik asked at 5:16 PM Boston time) | overlaps G-F11 (old CSS collisions) |
| G | G-F15 | Landscape phone Home layout (844x390): title sits on the wordmark, soundtrack card covers the right tiles (already in r59) | 🟧 Opus | in r62 (PR #390, head bb827862) | before/after screenshots in /mnt/project-files/gameplay/r62/ |
| G | G-F16 | Phone Home nit from Team V (HO-006): second line of START A SHOWDOWN touches the clipboard icon at 393px | 🟧 Opus | in r62 (PR #390, head bb827862) | before/after screenshots in /mnt/project-files/gameplay/r62/ |
| G | G-F19 | BH-8: show the final winner and Close on both phones automatically, with no PREVIEW tap (Nik chose this at 5:56 PM Boston time); applying to the local save stays a tap | 🟧 Opus | in r62 (PR #390, head bb827862) | journey 36/36 twice |
| G | G-F20 | BH-7 transient hardening: Setup read, Terminal Close retry, simultaneous CLOSE re-read, stale transfer status line | 🟧 Opus | in r62 (PR #390, head bb827862) | two-manager journey 36/36 |
| G | G-F21 | BH-11 pairing and reconnect fixes from the pairing audit (7 findings, one high: a reload mid-game strands the reconnect) | 🟧 Opus | in r62 (PR #390, head bb827862) | r62 merge to main |
| G | G-F23 | Desktop Settings cards clipped; Update button hidden (Nik's Chrome stuck on r54) | 🟧 Opus | in r62 (PR #390, head bb827862) | branch bugfix/settings-desktop-update 1d264f7e; after r62 Nik presses Update once on the laptop |
| G | BUG-1 | Raw error codes in the Setup settle text; neutral Manager 1/2 fallbacks; 80-character transfer names | 🟪 Sonnet | in r62 (PR #390, head bb827862) | bugfix/bug-batch-1 9e012fd |
| G | 1001 | 🐞 Bug list 1: 1001 · G Home desktop tile icons: bigger, inside the tile, never on the text | 🟦 Sol chat | in release (merged into gameplay/bug-list-1, 215e34a) | Bug list 1 items L1-01..06. CSS only in css/homeV10.css desktop blocks. Job file jobs/JOB-1001.md. Lead checks screenshots at 1920/1440/1280/1100/1000 wide. |

| Hand-off | From → To | What | Progress |
| --- | --- | --- | --- |
| [HO-010](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/handoffs/HO-010_sync-main-s-copy-of-transfer-war-f1actio.md) | V → G | Sync main's copy of Transfer War f1Action to REQUEST EARLY END (1002 · V) | ✅ Sent → ✅ Delivered → ✅ **Received** → ○ In progress → ○ Done |

## 🟢 G Factory

_Gameplay, online sync, every merge and every release (senior director)._ Workers: 🟧 Opus · 🟪 Sonnet · 🟨 Haiku · 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 👤 Nik and Daniel

**⏭ Up next**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| G-F5 | QA packet adoptions: truth line, wrong-target guard on main PRs, PR title rule | 🟪 Sonnet | next | - |
| G-F11 | Old-design CSS collisions: scope old rulebook/settings/analytics/app CSS off Team V markup (about 70 shared class names) | 🟪 Sonnet | ready (Sonnet audit, then Opus fix) | - |

**👤 Waiting on Nik**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| G-F1 | Nik and Daniel play 2.0 on their phones | 👤 Nik and Daniel | waiting on Nik | - |
| G-F8 | Commit and acknowledge a season in one tap (tap audit R7) | 🟧 Opus | needs Nik's call | Nik |
| G-F9 | 72-character pairing code exchange (needs a Rules change) | 🟧 Opus | needs Nik's call | Nik's typed words |
| G-F22 | BH-12 pairing product calls: RESTORE BACKUP first, CANCEL CODE with expiry, masked email before JOIN, revoke mine and join, clearer same-account message | 👤 Nik and Daniel | later: Nik decides after his two current calls | the lead asks Nik next |

**🗂 Later**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| G-F3 | Bug-hunting factory: one report thread, Sonnet hunts, Opus fixes, small batch releases | 🟪 Sonnet | queued | G-F1 and Nik's OK |
| G-F4 | GPT Q&A team: scripted paths and code-vs-rulebook reads | 🟦 Sol chat | queued | G-F1 |
| G-F7 | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | 🟪 Sonnet | queued | G-F1 |

### 🐞 Bug list 1

**👤 Waiting on Nik**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| 1003 | 1003 · G Transfer War: main's copy of Team V's early-end string matches (HO-010) — Low priority, no live impact. js/transferScreenV10.js lines 26 and 30. Job file jobs/JOB-1003.md. | 🟦 Sol chat | ready | Nik types 1003 in the gameplay GPT project (normal chat) |
| 1004 | 1004 · G Rule Book: remove the useless 01-06 side number rail (desktop and phone) — js/rulesSettingsV10.js only: stop building #ruleBookIndex. Per-rule number badges stay. | 🟦 Sol chat | ready | Nik types 1004 in the gameplay GPT project (normal chat) |

## 🔵 V Factory

_Visuals and presentation: design changes, art, screen skins (assistant director)._ Workers: 🟧 Opus · 🟪 Sonnet · 🟦 Sol chat · 🟩 Sol Work mode · 🟫 Astra · 🟥 Image tickets · ⬜ Codex

**🗂 Later**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| V-F2 | Design changes from Nik and Daniel's 2.0 play-through (only real design changes; bugs stay with G) | 🟧 Opus | queued | G-F1 |

## 📡 Relay

**Health:** ✅ working · direct wake: Team G ✅, Team V ✅ · 29 messages · 1 open hand-offs, 9 done · **[every message in full: RELAY.md](RELAY.md)**

Replies owed: Team G none · Team V G2V-015, G2V-016.

Latest:
- G2V-016 · Mon 5 Oct 11:53 AM · Team G → Team V · Correction: PR #312 comments do wake a subscribed thread (2 s); subscribe your relay thread to PR #…
- G2V-015 · Mon 5 Oct 11:52 AM · Team G → Team V · Relay v1.2 direct wake: register your session in INBOX.json; senders wake the other team with send_…
- G2V-014 · Mon 5 Oct 8:55 AM · Team G → Team V · Relay v1.1: hand-off tickets (Sent, Delivered, Received, In progress, Done) carry passed work in fu…

## ✅ Finished

**Shipped to the live game today (11):** [#387](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/387) Physio: a watched workflow that isn't on main no longer fai… · [#385](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/385) Physio: re-run checks GitHub gave no machine, pause helpers… · [#383](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/383) Release r61: phone track list stops below the logo and scro… · [#378](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/378) G-36: No old player photos + seven Home tiles (r60) · and 7 more

<details>
<summary>Done jobs (7 future-list rows, 1 Team V jobs, 9 hand-offs, 33 factory jobs)</summary>

- G G-F10: Club Assignment: wire Team V's approved design (hands, seams, new layout) into the live screen (done (live in r57, PR #371))
- G G-F12: G-36: no old player photos on any screen, and all 7 Home tiles (done (live in r60, d8e6c44))
- G G-F13: Home soundtrack: 11 Audius tracks, Nasty first, Shelter remix and High And Low cover (done (live in r60, d8e6c44))
- G G-F14: r61: phone track list stops below the logo and scrolls, and Next To You plays first (done: live in r61 (5:37 PM Boston time))
- G G-F2: Live 2.0 fixes from Nik's review: r55 and r56 shipped today (list in Live now) (done for r56)
- V V-F1: Team V jobs on this board: V- PR titles with a progress block; old board retired (done (V2G-017))
- V V-F3: Visual check of live 2.0 against the approved package 5e05a1f (done (sent as HO-004))
- V V-247: Phone Home tile icons like GOAL_HOME ([PR #381](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/381))
- HO-001 (G → V): Use hand-off tickets for passing work (relay v1.1)
- HO-002 (G → V): Smooth stage atmosphere on idle screens (pointer stutter root cause)
- HO-003 (G → V): Header chips and footer design on Team V screens
- HO-004 (G → V): Visual QA: live 2.0 screens vs approved frames
- HO-005 (G → V): Mobile Home hero: ghost coat between Daniel and Nik
- HO-006 (V → G): Wire V-247: phone Home tile icons large and centred
- HO-007 (G → V): Shared job numbers for both teams, from 1001
- HO-008 (G → V): Bug factory mode for Team V: GPT blue and green lanes, escalation ladder
- HO-009 (V → G): GPT workers: CI gates and the Physio are expected, never removed
- Bug hunt on r52: 5 of 5 fixed ([report](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md))
- The first factory plan: 33 of 33 jobs finished ([every job](BOARD_ARCHIVE.md))

</details>

<sub>Made by `tools/board.py` from `BOARD.json` (the lead's job list), PR progress blocks, open PRs into main and the relay. It rebuilds itself on GitHub; nobody edits it by hand.</sub>
