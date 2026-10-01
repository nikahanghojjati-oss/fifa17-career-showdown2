# FOR SOL 5.6 · HLC R3.2 final check · 2026-10-01

Merges SOL_HLC_R3_QUICK_CHECK_VERDICT_2026-10-01 (verdict A, R3.1-1..5, applied at `faa2c099b93d3a5937f997eb4e77e364f2854440`) with SOL_HLC_R3_QUICK_CHECK_VERDICT_B_2026-10-01 (verdict B, D9-D11). Documents only: no intake run, no build.
R3.2 patch commit: `7342e5565405eaf3b668d30bc3e541c1134110d6` on `claude-cloud/hlc-goals` (parent `c9a1bb1`).
Files edited in place (R3.2 keeps the `_R3` filenames): `CLOUD_BRIEF_HOME_V1_R3.md`, `CLOUD_BRIEF_LEAGUE_V1_R3.md`, `CLOUD_BRIEF_CLUB_V1_R3.md`, `CLOUD_HLC_INTAKE_V1_R3.md`. Each gets the changelog entry `R3.2 2026-10-01: Sol verdict B D9–D11 merged with R3.1`.

## Precedence
- D9 supersedes the R3.1-5 fingertip wording (G8 exception 1, G8 League report sentence, W2 trailing sentence). The R3.1-5 C5.7 sentence stays, with the D9 exception appended.
- D10 supersedes R3.1-4 and the earlier CSS `mask-image`/`currentColor` hint.
- D11-2 was already satisfied by R3.1-2. No change.
- Kept unchanged: R3.1-1, R3.1-2, R3.1-3, D1-D8, blank `ACCEPTED_CREST_SHA`.

## Verdict A items (state after R3.2)
| Item | File | Text | R3.2 status |
|---|---|---|---|
| R3.1-1 C5.1 | Home, League, Club | "Every live product string ... unless that screen's section S explicitly declares a Sol/owner-approved exception. Home's Audius soundtrack content is the current explicit exception. ..." | unchanged |
| R3.1-2 Branches | Intake | adds `assets/`, `evidence/` (`intake_*`), `tools/intake_hlc.py`, `intake_report.md` inside `assets/` | unchanged (covers D11-2) |
| R3.1-3 H3 chips | Home | "each at least 40 px tall on desktop" | unchanged |
| R3.1-4 League W1 | League | "Do not redraw league-mark geometry ... unless separately approved." | **superseded by D10-2** |
| R3.1-5 C5.7 | Home, League, Club | "(the only such cases are the two bounded runtime exceptions in G8: League-only fingertip/hand layering and Club-only pack reveal)" | kept, D9-1 text appended |
| R3.1-5 G8 exc. 1 + report | Home, League, Club | "in League, the decorative wheel rim/background may pass beneath ..." / "For League QA, report separately: (a)...(d)..." | **superseded by D9-2, D9-3** |

## Verdict B items
### D9 (Home, League, Club common blocks; League W2)
1. C5.7 rule 7. OLD: `... (the only such cases are the two bounded runtime exceptions in G8: League-only fingertip/hand layering and Club-only pack reveal).`
   NEW: same, then appended: `League-only fingertip layering exception: on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered OVL_DANIEL_FINGER_V1_* overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule.`
2. G8 exception 1. OLD: `**1. League-only fingertip/hand layering:** in League, the decorative wheel rim/background may pass beneath Daniel's original hand/fingertip overlay required by W2. No live text, wheel-item label, button, status line, or other control may enter the hand protected box. The overlay remains exactly registered through `plateToScreen`. Face boxes remain fully protected.`
   NEW: `**1. League-only fingertip layering:** on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered OVL_DANIEL_FINGER_V1_* overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule. Face boxes remain fully protected.` Exception 2 (Club pack reveal, D7) verbatim.
3. G8 report. OLD: `For League QA, report separately: (a) face clearance; (b) live-text/control clearance from Daniel's hand box; (c) fingertip overlay registration error; (d) confirmation that only decorative wheel geometry is beneath the hand.`
   NEW: `For League, report the wheel/hand overlap region, verify that it is fully contained by the finger-overlay alpha coverage, and verify 0 px overlay registration error. Live text/control/panel intersection with the hand box remains zero. Also report face clearance.`
4. League W2. OLD: `... 0 px offset at 1X, measured. G8 exception: the wheel may sit under this hand; no live text may be under it.`
   NEW: `... 0 px offset at 1X, measured. Governed by the League-only fingertip layering exception in C5.7/G8; QA per G8 (overlap contained by overlay alpha, 0 px registration).`
5. Home and Club carry the identical C5.7 and G8 text (no W2 there).

### D10 (League only)
1. W1 "Wheel colour language". Deleted: `Implementation: render `getLeagueMark(id).svg` monochrome via CSS `mask-image` with `background: currentColor` (or strip its fills to `currentColor`), and set `color` per state (pale on dark, near-black on the selected gold wedge).` State rules (unselected: dark wedge, off-white / faded pale gold ~`#EFE6CF`; selected: gold wedge, near-black ~`#0B0D10`) and "The marks' own colours (`primary`) may still be used elsewhere, never on the wheel." kept.
2. "League marks come only from the crest build". OLD (R3.1-4): `Do not redraw league-mark geometry, alter the source recipes, or invent replacement marks. The OWNER-2 wheel-only monochrome presentation transform defined above is explicitly allowed and required. Outside the wheel, do not restyle the crest-build marks unless separately approved.`
   NEW: `League marks must come only from getLeagueMark(id) / applyLeagueMark at the pinned ACCEPTED_CREST_SHA. Preserve the exact source geometry and do not redraw, substitute, or invent any mark. The wheel is allowed and required to apply a presentation-only monochrome treatment. Preserve internal tonal separation so the mark motif and country code remain legible. Preferred methods are a deterministic CSS grayscale/tint/brightness/contrast treatment on the returned mark image, or a deterministic paint mapping of the returned SVG that maps its existing fills/strokes into tonal values inside the target monochrome family. Do not use a whole-mark alpha mask or one-flat-color fill replacement unless a visual assertion proves the internal mark remains legible. Outside the wheel, marks stay unrestyled.` Kept: `data/leagues.js` untouched; missing mark -> name only + handoff.
3. New W1 bullet: `**W1 QA (also in the league-mark handoff/QA list).** Assertion: all five marks retain recognizable internal motif separation and legible country code after the monochrome treatment, in both unselected and selected states (crop evidence at 1X).` (The League brief had no separate W1 QA list, so the assertion sits as the last W1 bullet and names the handoff/QA list.)

### D11 (Intake)
1. Step 6. OLD: `6. Copy the original as `REF_GOAL_<SCREEN>.jpg` (League: the blurred one).`
   NEW: `6. Export the untouched goal reference as REF_GOAL_<SCREEN>.jpg. If the source is already JPEG, copy or losslessly re-encode as appropriate. For Home, convert GOAL_HOME.png to a real JPEG file; do not rename PNG bytes to .jpg. This reference is evidence/composition-only and must not be shipped as product art. (League: the blurred one.)`
   Step 3 gate list, new assertion: `REF_GOAL_*.jpg starts with bytes FF D8 FF (real JPEG).`
2. Branches paragraph already lists `visual-assets/v10_1/<screen>/assets/` (with `intake_report.md`), `visual-assets/v10_1/<screen>/evidence/` (`intake_*`) and `visual-assets/v10_1/<screen>/tools/intake_hlc.py` (R3.1-2). No change.

## Self-check (grep results after the patch)
- R3.1-1 C5.1 exception text ("explicitly declares a Sol/owner-approved exception"): Home 1, League 1, Club 1. PASS
- `PLATE_G_SOURCE_DRIFT`: Home/League/Club/Intake 1/1/1/1. `8fbda036`: 1/1/1/1. PASS
- R3.1-3 40 px chips ("at least 40 px tall"): Home 1. PASS
- D5 Audius four tracks: Home "four Audius track titles/artists" present (Audius ×9). PASS
- D1/C4b `plateToScreen` cover-fit: Home 2, League 3, Club 2 (`cover`-fit C4b block present in all three). PASS
- D6 whole-turn-plus-offset L2: League 1. PASS
- D7 pack-box exception (`pack_daniel`): G8 exception 2 verbatim in all three. PASS
- 12 px floor: present in Home, League, Club, Intake. PASS
- `grep -c "mask-image" CLOUD_BRIEF_LEAGUE_V1_R3.md` = 0; `currentColor` = 0. PASS
- `ACCEPTED_CREST_SHA=<full 40-char SHA, filled in by Nik or Claude before launch>` (blank placeholder): League line 6, Club line 6. PASS
- C5.7 rule 7 + G8 row identical across Home/League/Club: md5 `9f3886af14cc4ad26422290d9c1c7fb1` for all three. PASS
- Exactly two G8 exceptions: "exactly two bounded runtime exceptions" ×1 per brief; numbered exceptions `**1. League-only fingertip layering:**`, `**2. Club-only pack reveal (D7):**` only. PASS
- `R3.2 2026-10-01` changelog: 1 in each of the four files. `FF D8 FF`: Intake 1. PASS

## Diffstat (`git diff --stat 7342e55~1 7342e55`)
```
 visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md   |  6 +++---
 visual-assets/goals/CLOUD_BRIEF_HOME_V1_R3.md   |  6 +++---
 visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md | 12 +++++++-----
 visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md   |  7 ++++---
 4 files changed, 17 insertions(+), 14 deletions(-)
```

## Ask
Final quick mechanical check of R3.2. On OK, Part B (HLC intake) runs per `CLOUD_HLC_INTAKE_V1_R3.md`. League and Club builds stay blocked until `ACCEPTED_CREST_SHA` is frozen. No main merge.
