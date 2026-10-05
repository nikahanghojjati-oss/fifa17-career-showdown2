# 🐞 Team G bug hunting factory

> Updated **Mon 5 Oct, 5:43 PM Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)

| 🔓 Open | 🔴 Top priority | 🔧 Fixing or waiting for release | ✅ Fixed and live |
| :---: | :---: | :---: | :---: |
| **3** | **1** | **2** | **5** |

**Lanes:** 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku

## 🔧 Open bugs

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-6** | 🔴 **top** · Audit every still-open item from the 4 Oct bug hunt and Team G notes | Two-writer ledgers, Setup read, J10 final:null, Terminal Close retry, R1-to-R2 restart, mid-game service worker update | 🎮 gameplay | 🟪 Sonnet | 🔍 TRIAGED | triaging; report goes to /mnt/project-files/bug-hunt/OPEN_ITEMS_AUDIT_2026-10-05.md, and each item still open becomes its own BH job |
| **BUG-1** | Raw error codes show in the Setup settle text | Setup | 🎮 gameplay | 🟪 Sonnet | 🔧 FIXING | branch bugfix/bug-batch-1, ships in r62; same batch: neutral Manager 1/2 fallbacks instead of hard-coded Daniel/Nik, 80-character limit on transfer signing names |
| **G-F6** | Flaky v10-transfer contract (WINDOW_OPEN 390: refresh not clickable) | Transfer Window tests | 🎮 gameplay | 🟧 Opus | 🔧 FIXING | root cause hunt on branch bugfix/g-f6-transfer-flake, ships in r62 |

## ⚽ Jobs running now

<sub>Percent = finished steps weighted by typical step time; finish times are estimates ([how](ETA_STUDY.md)).</sub>

> [!NOTE]
> No job is reporting progress right now. A job shows here once its PR description carries a progress block.

<details>
<summary><b>✅ Closed: 5</b> (5 live in the game) · click to open</summary>

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-1** | Both managers tap at the same second and the slower one sees an error | — | 🎮 gameplay | — | ✅ LIVE | job 21, PR #344; live since r53 (2026-10-04) |
| **BH-2** | A tied season is decided by league position | — | 🎮 gameplay | — | ✅ LIVE | Nik chose league position; docs fixed in PR #343 (merged) |
| **BH-3** | Nobody cross-checks the two managers' season results | — | 🎮 gameplay | — | ✅ LIVE | PR #346; live since r53 (2026-10-04) |
| **BH-4** | Lock buttons have no confirm | — | 🎮 gameplay | — | ✅ LIVE | PR #345 adds the "Lock N of 3?" confirm; live since r53 (2026-10-04) |
| **BH-5** | The 4-hour private session ends long games | — | 🎮 gameplay | — | ✅ LIVE | job 31, PR #350 (fb0dd02): one-tap reconnect after expiry; live since 2.0 (r54) |

</details>

---

<sub>Bug list: `BUGS.json` (kept by the Bug reports thread). Progress: the ```` ```progress ```` block in each job's PR description. Statuses: 🆕 NEW · 🔍 TRIAGED · 🔧 FIXING · 👀 REVIEW · 🔀 MERGED · ✅ LIVE · ♻️ DUPLICATE · 🚫 NOT A BUG. Made by `tools/bug_board.py`.</sub>
