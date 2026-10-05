# 🐞 Team G bug hunting factory

> Updated **Sun 4 Oct, 11:35 PM Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)

| 🔓 Open | 🔴 Top priority | 🔧 Fixing or waiting for release | ✅ Fixed and live |
| :---: | :---: | :---: | :---: |
| **2** | **0** | **1** | **4** |

**Lanes:** 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku

## 🔧 Open bugs

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BUG-1** | Raw error codes show in the Setup settle text | Setup | 🎮 gameplay | — | 🆕 NEW | carried over from the 4 Oct bug hunt extras |
| **BH-5** | The 4-hour private session ends long games | — | 🎮 gameplay | — | 🔀 MERGED | job 31, PR #350 (recovery fb0dd02): one-tap reconnect after expiry; live at the next release |

## ⚽ Jobs running now

Bars show the share of each job done, to four decimals (finished steps weighted by how long that kind of step usually takes, see [ETA_STUDY.md](ETA_STUDY.md)). Finish times are estimates.

🏁 no finish time yet (not enough data)

### 🟧 Opus · 1 job

**[Job 27 · Transfer War screens](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/362)**  
🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️ 🥅 **87.5240 %** · 6 of 7 steps · updated Sun 4 Oct, 9:06 PM

**Likely finish:** past the estimate; the next report will move it

> **Going on now:** Lead reviewed; final checks running on the head with the latest test build  
> **Still to do:** Merged into the test build

### 🟪 Sonnet · 1 job

**[Job 28 · Rivalry Stats and Legacy](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/352)**  
🟪🟪🟪🟪🟪🟪🟪🟪🟪⚽▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️ 🥅 **49.9040 %** · 9 of 11 steps · updated Sun 4 Oct, 9:17 PM

**Likely finish:** past the estimate; the next report will move it

> **Going on now:** Paused for usage reset; all my work is pushed, waiting on the lead's J10 fix then merge  
> **Still to do:** CI green on final head (waits on the J10 fix on recovery) → Lead review and merge

<details>
<summary><b>✅ Closed: 4</b> (4 live in the game) · click to open</summary>

| Bug | What happened | Where | Type | Lane | Status | Progress / note |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **BH-1** | Both managers tap at the same second and the slower one sees an error | — | 🎮 gameplay | — | ✅ LIVE | job 21, PR #344; live since r53 (2026-10-04) |
| **BH-2** | A tied season is decided by league position | — | 🎮 gameplay | — | ✅ LIVE | Nik chose league position; docs fixed in PR #343 (merged) |
| **BH-3** | Nobody cross-checks the two managers' season results | — | 🎮 gameplay | — | ✅ LIVE | PR #346; live since r53 (2026-10-04) |
| **BH-4** | Lock buttons have no confirm | — | 🎮 gameplay | — | ✅ LIVE | PR #345 adds the "Lock N of 3?" confirm; live since r53 (2026-10-04) |

</details>

---

<sub>Bug list: `BUGS.json` (kept by the Bug reports thread). Progress: the ```` ```progress ```` block in each job's PR description. Statuses: 🆕 NEW · 🔍 TRIAGED · 🔧 FIXING · 👀 REVIEW · 🔀 MERGED · ✅ LIVE · ♻️ DUPLICATE · 🚫 NOT A BUG. Made by `tools/bug_board.py`.</sub>
