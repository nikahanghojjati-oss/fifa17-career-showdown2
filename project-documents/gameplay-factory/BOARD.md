# Showdown board: G Factory and V Factory

🌐 **Live: runtime 1.9.1-r60** (main `d8e6c44`) · 🔄 **5 moving** · ⏭ 2 up next · 👤 3 waiting on Nik · 🗂 6 later · updated 2026-10-05 5:37 PM Boston time (EDT)

## Your next move

1. **r61 is in its final checks:** the phone song list stops below the logo and scrolls, and Next To You plays first. It goes live as soon as the checks pass. Nothing for you to do.

## 🔄 Moving now

| Release / fix | Checks on the latest commit | Updated |
| --- | --- | --- |
| [PR #383](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/383) Release r61: phone track list stops below the logo and scrolls | 🟢 16 passed | 5:24 PM |

| Team | Job | What | Worker | Where it is | Details |
| --- | --- | --- | --- | --- | --- |
| G | G-F6 | Small gameplay follow-ups: transfer message after session expiry, the 'Career screens could not load' toast when online history is only unavailable, and the flaky v10-transfer contract ('WINDOW_OPEN 390: refresh not clickable'). Raw Setup error codes moved to BUG-1 | 🟧 Opus | in progress: flaky transfer test (branch bugfix/g-f6-transfer-flake) | the lead batches it into r62 |
| G | G-F14 | r61: phone track list stops below the logo and scrolls, and Next To You plays first | 🟧 Opus | in final checks (PR #383) | GitHub had no free test machines at 4 PM; the checks are re-running |
| G | G-F17 | Replace POS20 with a faster check system built on Claude and GitHub, keeping every check | 🟧 Opus | in progress: the lead is designing it | the lead's plan |
| G | G-F18 | Old-design screen audit: Legacy, Career Statistics and Trophy Room still open in the old shell; drive every live screen in a browser against Team V's design and route all of them to the new design | 🟧 Opus | in progress (thread "Old-design screen audit", Nik asked at 5:16 PM Boston time) | overlaps G-F11 (old CSS collisions) |

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

**🗂 Later**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| G-F15 | Landscape phone Home layout (844x390): title sits on the wordmark, soundtrack card covers the right tiles (already in r59) | 🟧 Opus | queued for r62 | - |
| G-F16 | Phone Home nit from Team V (HO-006): second line of START A SHOWDOWN touches the clipboard icon at 393px | 🟧 Opus | queued for r62 | - |
| G-F3 | Bug-hunting factory: one report thread, Sonnet hunts, Opus fixes, small batch releases | 🟪 Sonnet | queued | G-F1 and Nik's OK |
| G-F4 | GPT Q&A team: scripted paths and code-vs-rulebook reads | 🟦 Sol chat | queued | G-F1 |
| G-F7 | Ten-season smoothness run on live 2.0 (emulator, 10 seasons with a mid-game expiry) | 🟪 Sonnet | queued | G-F1 |

## 🔵 V Factory

_Visuals and presentation: design changes, art, screen skins (assistant director)._ Workers: 🟧 Opus · 🟪 Sonnet · 🟦 Sol chat · 🟩 Sol Work mode · 🟫 Astra · 🟥 Image tickets · ⬜ Codex

**🗂 Later**

| Job | What | Worker | State | Waits on |
| --- | --- | --- | --- | --- |
| V-F2 | Design changes from Nik and Daniel's 2.0 play-through (only real design changes; bugs stay with G) | 🟧 Opus | queued | G-F1 |

## 📡 Relay

**Health:** ✅ working · direct wake: Team G ✅, Team V ✅ · 29 messages · 0 open hand-offs, 6 done · **[every message in full: RELAY.md](RELAY.md)**

Replies owed: Team G none · Team V G2V-015, G2V-016.

Latest:
- G2V-016 · Mon 5 Oct 11:53 AM · Team G → Team V · Correction: PR #312 comments do wake a subscribed thread (2 s); subscribe your relay thread to PR #…
- G2V-015 · Mon 5 Oct 11:52 AM · Team G → Team V · Relay v1.2 direct wake: register your session in INBOX.json; senders wake the other team with send_…
- G2V-014 · Mon 5 Oct 8:55 AM · Team G → Team V · Relay v1.1: hand-off tickets (Sent, Delivered, Received, In progress, Done) carry passed work in fu…

## ✅ Finished

**Shipped to the live game today (8):** [#378](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/378) G-36: No old player photos + seven Home tiles (r60) · [#377](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/377) G-35: Team V screen fixes HO-003 + HO-004 (r59, includes r5… · [#371](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/371) G-34: Team V's Club Assignment on the live screen (r57) · [#369](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/369) Live 2.0 screen fixes: Trophy Room clipping, Start Showdown… · and 4 more

<details>
<summary>Done jobs (6 future-list rows, 1 Team V jobs, 6 hand-offs, 33 factory jobs)</summary>

- G G-F10: Club Assignment: wire Team V's approved design (hands, seams, new layout) into the live screen (done (live in r57, PR #371))
- G G-F12: G-36: no old player photos on any screen, and all 7 Home tiles (done (live in r60, d8e6c44))
- G G-F13: Home soundtrack: 11 Audius tracks, Nasty first, Shelter remix and High And Low cover (done (live in r60, d8e6c44))
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
- Bug hunt on r52: 5 of 5 fixed ([report](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md))
- The first factory plan: 33 of 33 jobs finished ([every job](BOARD_ARCHIVE.md))

</details>

<sub>Made by `tools/board.py` from `BOARD.json` (the lead's job list), PR progress blocks, open PRs into main and the relay. It rebuilds itself on GitHub; nobody edits it by hand.</sub>
