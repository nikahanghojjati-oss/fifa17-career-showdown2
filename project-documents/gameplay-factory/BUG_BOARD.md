# 🐞 Team G bug hunting factory

> Updated **Sun 4 Oct, 9:00 PM Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)

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

### 🟧 Opus · 2 jobs

**[Job 27 · Transfer War screens](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/362)**  
🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️▫️▫️▫️ 🥅 **72.6488 %** · 4 of 7 steps · updated Sun 4 Oct, 8:57 PM

**Likely finish:** about 9:11 PM (likely 9:05 PM to 9:36 PM) Boston time

> **Going on now:** All 16 checks green on bd58e2ef. Now taking phone and desktop screenshots of Transfer War (waiting, guessing, verdict), then one push that brings in the latest test build (1e7775a4)  
> **Still to do:** Bring in the latest test build once → Lead review (screenshots and diff) → Merged into the test build

**[Job 29 · Season Results, Final Winner, Standings](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/357)**  
🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️▫️ 🥅 **83.9411 %** · 10 of 12 steps · updated Sun 4 Oct, 8:52 PM

**Likely finish:** about 9:00 PM (likely 8:56 PM to 9:07 PM) Boston time

> **Going on now:** Fixes committed locally; waiting for job 33 to merge, then one push  
> **Still to do:** Final sync with recovery after job 33 merges, plus the log fix; CI green → Lead merges into gameplay/recovery-v1

### 🟪 Sonnet · 1 job

**[Job 28 · Rivalry Stats and Legacy](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/352)**  
🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪⚽ 🥅 **95.2015 %** · 9 of 10 steps · updated Sun 4 Oct, 8:46 PM

**Likely finish:** about 8:48 PM (likely 8:47 PM to 9:06 PM) Boston time

> **Going on now:** CI green on bdbf6a6, waiting for lead review and merge  
> **Still to do:** Lead review and merge

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
