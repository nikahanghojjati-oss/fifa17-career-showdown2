# 🐞 Team G bug hunting factory

> Updated **Mon 5 Oct, 6:10 PM Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)

| 🔓 Open | 🔴 Top priority | 🔧 Fixing or waiting for release | ✅ Fixed and live |
| :---: | :---: | :---: | :---: |
| **8** | **3** | **6** | **5** |

**Lanes:** 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku

## 🔧 Open bugs

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-11** | 🔴 **top** · Pairing and reconnect fixes: a reload mid-game strands the reconnect (high), durable storage and an explicit confirm before closing the shared career, a lost join reply shows "code already used", startup retry with plain text, a stray local copy after a failed join, wording and a phone clock hint, a pasted code with extra text is rejected | Pairing, reconnect | 🎮 gameplay | 🟧 Opus | 🔧 FIXING | branch bugfix/bh-11-pairing-reconnect, rides r62 |
| **BH-8** | 🔴 **top** · Final winner only appears after tapping PREVIEW LOCAL RECONCILIATION (likely the old J10 flake) | Final Winner | 🎮 gameplay | 🟧 Opus | 🔧 FIXING | Nik chose show automatically (5:56 PM Boston time); branch bugfix/bh-8-auto-final, rides r62; the final winner and Close appear on both phones with no PREVIEW tap, applying to the local save stays a tap |
| **BH-7** | 🔴 **top** · Transient hardening: Setup survives one failed read, throttled Terminal Close retry, quiet re-read for the phone that loses a simultaneous CLOSE, one stale transfer status line | Setup, Terminal Close, Transfer Window | 🎮 gameplay | 🟧 Opus | 🔀 MERGED | fixed on de4c352 and in the r62 batch (gameplay/release-r62); two-manager journey 36/36 locally |
| **G-F6b** | Same ResizeObserver fix on the Club screen, and the harmless browser "ResizeObserver loop" warning never shows players an error toast | Club screen, error toasts | 🎮 gameplay | 🟪 Sonnet | 🔧 FIXING | branch bugfix/g-f6b-observer-toast, rides r62 |
| **BUG-1** | Raw error codes show in the Setup settle text | Setup | 🎮 gameplay | 🟪 Sonnet | 👀 REVIEW | fixed on bugfix/bug-batch-1 (9e012fd), rides r62; same batch: neutral Manager 1/2 fallbacks, 80-character limit on transfer signing names |
| **BH-12** | Pairing product calls: RESTORE BACKUP as the main button instead of DELETE, a CANCEL CODE button with visible expiry, show the masked linked email and confirm before JOIN, "revoke mine and join" when both phones host, a clearer same-account message | Pairing | 🎮 gameplay | — | 🆕 NEW | waiting on Nik later; the lead asks once his two current cards are answered |
| **BH-10** | Later, low: a full 3-of-3 lock asks no confirm (Nik decides later); session-expiry reconnect is still host, code, join rather than one tap; no release-version handshake between the two phones | Locks, reconnect, versions | 🎮 gameplay | — | 🆕 NEW | parked as low priority |
| **G-F6** | Transfer screen race: a slow load raised a 10-second red ResizeObserver toast over REFRESH on phones, and the desktop window button landed below the screen | Transfer Window tests | 🎮 gameplay | 🟧 Opus | 🔀 MERGED | real product race, not a flaky test; fixed on 6fcda70b and in the r62 batch (gameplay/release-r62); failures went from about 1 in 7 runs to 0 of 66 |

## ⚽ Jobs running now

<sub>Percent = finished steps weighted by typical step time; finish times are estimates ([how](ETA_STUDY.md)).</sub>

> [!NOTE]
> No job is reporting progress right now. A job shows here once its PR description carries a progress block.

<details>
<summary><b>✅ Closed: 7</b> (5 live in the game) · click to open</summary>

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-1** | Both managers tap at the same second and the slower one sees an error | — | 🎮 gameplay | — | ✅ LIVE | job 21, PR #344; live since r53 (2026-10-04) |
| **BH-2** | A tied season is decided by league position | — | 🎮 gameplay | — | ✅ LIVE | Nik chose league position; docs fixed in PR #343 (merged) |
| **BH-3** | Nobody cross-checks the two managers' season results | — | 🎮 gameplay | — | ✅ LIVE | PR #346; live since r53 (2026-10-04) |
| **BH-4** | Lock buttons have no confirm | — | 🎮 gameplay | — | ✅ LIVE | PR #345 adds the "Lock N of 3?" confirm; live since r53 (2026-10-04) |
| **BH-5** | The 4-hour private session ends long games | — | 🎮 gameplay | — | ✅ LIVE | job 31, PR #350 (fb0dd02): one-tap reconnect after expiry; live since 2.0 (r54) |
| **BH-6** | 🔴 **top** · Audit every still-open item from the 4 Oct bug hunt and Team G notes | Two-writer ledgers, Setup read, J10 final:null, Terminal Close retry, R1-to-R2 restart, mid-game service worker update | 🎮 gameplay | 🟪 Sonnet | ☑️ DONE | report /mnt/project-files/bug-hunt/OPEN_ITEMS_AUDIT_2026-10-05.md; confirmed fixed: lost races on every ledger, season-results race, clash warning, stale scoring-locked text, session-expiry resume; new items became BH-7, BH-8 and BH-9 |
| **BH-9** | 🔴 **top** · Audit of pairing and the persistent pair | Pairing | 🎮 gameplay | 🟪 Sonnet | ☑️ DONE | report /mnt/project-files/bug-hunt/PAIRING_AUDIT_2026-10-05.md; 11 findings, no way for a third account to get in without the code; fixes are BH-11, product calls are BH-12 |

</details>

---

<sub>Bug list: `BUGS.json` (kept by the Bug reports thread). Progress: the ```` ```progress ```` block in each job's PR description. Statuses: 🆕 NEW · 🔍 TRIAGED · 🔧 FIXING · 👀 REVIEW · 🔀 MERGED · ✅ LIVE · ☑️ DONE · ♻️ DUPLICATE · 🚫 NOT A BUG. Made by `tools/bug_board.py`.</sub>
