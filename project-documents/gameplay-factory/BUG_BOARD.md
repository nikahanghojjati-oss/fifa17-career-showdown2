# Team G bug hunting factory board

1 open (0 top) · 5 closed · generated 2026-10-04 8:39 PM Boston time (EDT) · [job board](BOARD.md)

## Fix jobs running now

### 🟧 Opus

**Job 27 · Transfer War screens**  
🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️ 🥅 **42.86 %** (3 of 7 steps)  
Going on now: Fixing a failed two-manager play-through test: Home's styling leaks onto the Transfer War screen  
Still to do: All 16 checks green on the exact head → Bring in the latest test build once → Lead review (screenshots and diff) → Merged into the test build

**Job 29 · Season Results, Final Winner, Standings**  
🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️▫️ 🥅 **81.82 %** (9 of 11 steps)  
Going on now: Fix ready locally; waiting for job 33 to merge, then one push  
Still to do: Final sync with recovery after job 33 merges, plus the log fix; CI green → Lead merges into gameplay/recovery-v1

**Job 33 · Fewer taps**  
🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧⚽▫️▫️ 🥅 **85.71 %** (6 of 7 steps)  
Going on now: Lead reviewed; running the final checks on the head with the latest test build  
Still to do: Merged into the test build

### 🟪 Sonnet

**Job 28 · Rivalry Stats and Legacy**  
🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪🟪⚽▫️▫️▫️ 🥅 **80.00 %** (8 of 10 steps)  
Going on now: CI running on bdbf6a6  
Still to do: CI green on final head (Gameplay Fast + POS20) → Lead review and merge

## Open bugs

| ID | What happened | Where | Type | Lane | Status | Progress / note |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-1 | Raw error codes show in the Setup settle text | Setup | gameplay | unassigned | NEW | carried over from the 4 Oct bug hunt extras |

<details>
<summary><b>Closed: 5</b> (click to open)</summary>

| ID | What happened | Where | Type | Lane | Status | Progress / note |
| --- | --- | --- | --- | --- | --- | --- |
| BH-1 | Both managers tap at the same second and the slower one sees an error |  | gameplay | unassigned | LIVE | job 21, PR #344; live since r53 (2026-10-04) |
| BH-2 | A tied season is decided by league position |  | gameplay | unassigned | LIVE | Nik chose league position; docs fixed in PR #343 (merged) |
| BH-3 | Nobody cross-checks the two managers' season results |  | gameplay | unassigned | LIVE | PR #346; live since r53 (2026-10-04) |
| BH-4 | Lock buttons have no confirm |  | gameplay | unassigned | LIVE | PR #345 adds the "Lock N of 3?" confirm; live since r53 (2026-10-04) |
| BH-5 | The 4-hour private session ends long games |  | gameplay | unassigned | LIVE | job 31, PR #350 (recovery fb0dd02): one-tap reconnect after expiry; live at the next release |

</details>

Lane colors: 🟦 Sol chat · 🟩 Sol Work mode · ⬜ Codex · 🟧 Opus · 🟪 Sonnet · 🟨 Haiku. Percentages are finished steps / all steps from the job's progress block, never estimated.

Bug list lives in `BUGS.json` (kept by the Bug reports thread). This page rebuilds itself on GitHub with no Claude turn. Made by `tools/bug_board.py`.
