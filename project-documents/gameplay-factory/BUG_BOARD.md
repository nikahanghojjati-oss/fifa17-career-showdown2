# 🐞 Team G bug hunting factory

> Updated **Mon 5 Oct, 2:11 PM Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)

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

<sub>Percent = finished steps weighted by typical step time; finish times are estimates ([how](ETA_STUDY.md)).</sub>

🏁 last running job likely done about 2:42 PM Boston time

### 🟧 Opus · 1 job

**[Job 36 · No old player photos + seven Home tiles (r60)](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/378) · 38.0678 %** · 3 of 5 steps · updated Mon 5 Oct, 2:10 PM  
🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️ 🥅  
🏁 **Likely finish:** about 2:42 PM (likely 2:27 PM to 3:05 PM) Boston time  
> **Now:** Gates running on the exact head  
> **Left:** All 16 checks green on the exact head → Merged into main and live

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
