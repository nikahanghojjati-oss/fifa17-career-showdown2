# LEAGUE-V1 · BUILD_RESULT

Task: `CLOUD-LEAGUE-V1` (brief `visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md` R3.4 on `claude-cloud/hlc-goals`, launched by `CC-002_league-build.md`)
Model: Opus 5.5 · Effort: High · Role: build + evidence only (no taste authority, no self-approval)
Start: 2026-10-01T21:51:07Z · End: 2026-10-01T22:27:04Z (wall clock 36 min of the 45 min STOP_BUDGET)
Branch: `claude-cloud/league-v1` · Head: see the push reply / `git log -1` (this file is committed in that head)

## Source and base
- Plate G base (C1b): `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (the branch was cut there by the HLC intake session; intake commit `7ecb0b7`).
- Precondition (CC-002): `claude-cloud/league-v1` exists with intake assets, and `assets/ENV_LEAGUE_PLATE_V1_1X.webp` is present. The plate SHA-256s match `assets/intake_report.md`, and G10 re-checks them at load.
- Crest merge: `ACCEPTED_CREST_SHA=f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` exists (`git cat-file -e`). It was merged with `git merge --no-edit <sha>` (merge commit `021a383`, no rebase, not the floating branch head). `js/visualIdentity.js` exports `window.getLeagueMark` and `window.applyLeagueMark`.
- `SOURCE_DRIFT: none`. `origin/main` = `2de237391e17c7de2c6deb606b102b68ee640212` = the approved anchor.
- Owner wordmark `LOGO_CM17_WORDMARK_V1.png` was not used. The League brief has no wordmark step, and G9 allows it on Home only.

## How to run
```
cd <repo root> && python3 -m http.server 8765
open http://127.0.0.1:8765/visual-assets/v10_1/league/index.html?frame=L1     # L1 | L2 | L3 | L4, add &grid=1 for platemap boxes
cd visual-assets/v10_1/league
NODE_PATH=$(npm root -g) node tools/render-qa.cjs          # gates G1-G13 -> evidence/qa_report.json + screenshots
python3 tools/seam_audit.py <plates-in/ENV_LEAGUE_PLATE_V1.png>   # seams + fingertip containment -> evidence/seam_report.json, g8_finger.json
NODE_PATH=$(npm root -g) node tools/render-qa.cjs          # second run folds the seam/G8 files into qa_report.json
python3 tools/make_finger_overlay.py                        # rebuilds OVL_DANIEL_FINGER_V1_{1X,2X}.png
python3 tools/build_preview.py <commit>                     # preview.html (single file, plate as 1X data URI)
NODE_PATH=$(npm root -g) node tools/mark_sheet.cjs          # evidence/W1_league_marks_1x.png
```

## Frames
| Frame | State | `#selectedLeague` | `#spinLeague` | note | BACK | track rotation |
|---|---|---|---|---|---|---|
| L1 | ready | Spin to select league | SPIN WHEEL | hidden | enabled | 0° |
| L2 | spinning | SPINNING... | SPINNING..., disabled | hidden | disabled, aria-disabled=true | 512° = 2×360 − 3×72 + 8 |
| L3 | selected (Bundesliga) | Bundesliga | CONTINUE TO CLUB ASSIGNMENT | "Bundesliga has been selected and locked. Press Continue to confirm the league and open Club Assignment." | enabled | −144° |
| L4 | clubs locked (Bundesliga) | Bundesliga | LEAGUE LOCKED, disabled | "League and clubs are permanent for this showdown." (locked) | enabled | −144° |

All strings come from `origin/main:js/leagueWheel.js`. The BACK disabled state comes from `setLeagueWheelBusy`. The fixture records each source in `fixtures.json`.

## Item status (PRIORITY_ORDER)
| Item | Status | Notes |
|---|---|---|
| W0 source check + crest merge | DONE | No drift, pinned SHA merged, `fixtures.json` built from main |
| W1 wheel + crest-v1 league marks | DONE | Rim 18 px gold ring with 20 studs and an inner dark ring. Five 72° dark-glass segments with 2 px gold spokes. A fixed gold wedge at 85 % sits under a chevron+crown pointer. 22 % hub with crown. Marks come only from `applyLeagueMark` (pinned SHA) and get a CSS-only monochrome treatment (pale gold on glass, near-black on gold). Main's order and the rotation contract are kept: item i sits at +i×72°, `.wheelTrack` gets `rotate(getLeagueRotation)`. Evidence: `evidence/W1_league_marks_1x.png` |
| W2 fingertip overlay | DONE | `tools/make_finger_overlay.py`, hand-drawn polygon inside `keep_rects[0]` with a 1.5 px feather, `assets/OVL_DANIEL_FINGER_V1_{1X,2X}.png`. Registered through `plateToScreen`; error 0.0156 CSS px = one Chromium LayoutUnit (1/64 px), so 0 device px |
| W3 desktop layout (L1) | DONE | C6 chrome, title block, slogans, buttons. The wheel sits exactly on the slot (`onSlot=true`, scale 1.000) at 1366×768, 1440×900 and 1920×1080 in all four frames. At 1366×640 the scale is 0.838 (L1/L2) and 0.824 (L3/L4) |
| checkpoint commit + push | DONE | `db45cb9` |
| W4 frames L2–L4 | DONE | L2 uses a static CSS motion-blur ring (no animation) |
| W5 phone | DONE, with limits | See Known limits 2–4 |
| G gates | See table | `evidence/qa_report.json` |
| C9 deliverables | DONE | This file, `evidence/`, `preview.html`, `CLAUDE_LEAGUE-BUILD_HANDOFF_TO_SOL_2026-10-01.md` |

## Gate results (37 shots: 4 frames × 9 viewports + 1 grid)
| Gate | Result | Measured |
|---|---|---|
| G1 Strings | PASS 36/36 | 0 missing, 0 extra in every frame/viewport (decorative list per section S) |
| G2 IDs | PASS 36/36 | All section-S ids exactly once; roles/aria match main; `.wheelContainer > .wheelPointer`, `#leagueWheel > .wheelTrack > 5 .wheelItem` in main's order |
| G3 No scroll | PASS 36/36 | html/body scroll size <= viewport + 1 everywhere, 375x553 included |
| G4 Primary action | PASS 36/36 | `#spinLeague` fully in view and hit by `elementFromPoint` at its centre (also at 375x553 and 1366x640) |
| G5 No clipping | PASS 36/36 | No scroll overflow on any text element and no ellipsis; wheel labels fit their item boxes |
| G6 Sizes | PASS 36/36 | Phone controls 48 px tall, full width; desktop 56 px; smallest text 12 px; phone note 14 px |
| G7 Contrast | 35/36; **BLOCKED** at L3 375x553 | Failing: Premier League 1.44:1 (need 4.5). Wheel diameter there is 160 px and the 2-line label's glyph quad touches a spoke or the mark. Two fixes tried (quad sampling, phone label geometry), so no third attempt per C8. The title is measured on its gradient body colour #F2C45B. All text is sampled in its glyph box (line box minus half-leading) |
| G8 Faces and hands | PASS 36/36 (live UI) · see note | Smallest clearance: face_daniel 8.0 px, face_nik 12.4 px, hand_daniel 49.6 px, hand_nik 62.9 px. Finger overlay registration 0.0156 CSS px = 1 LayoutUnit = 0 device px at 1X. Fingertip containment (`evidence/g8_finger.json`): 1264 Daniel pixels under the wheel paint, 1038 restored by the overlay alpha, **226 sleeve-edge pixels (plate 494-506 x 421-500) outside `keep_rects[0]` stay under the dark bezel**; open question 1 in the handoff |
| G9 Imagery | PASS | Loaded: plate webp 1X/2X, finger overlay 1X/2X, woff2 fonts, inline/data SVG (marks, pointer, icons), page files. 0 disallowed. Name grep in folder: 0 hits |
| G10 Sides | PASS 36/36 | Daniel face/hand centre x < Nik's everywhere; all four plate SHA-256 equal `intake_report.md` |
| G11 Tab order | PASS 36/36 | SIGN IN -> spin (when enabled) -> BACK (when enabled) = visual reading order |
| G12 Clean run | PASS 36/36 | 0 console errors, 0 failed requests, 0 uncaught exceptions |
| G13 Chrome snapshot | Reported | `qa_report.json` -> results[].G13 (header 56/48 px, badge, control boxes, footer 28 px) |


## Intake seams (owner follow-up: "intake darkened some plate zones")
Method: `tools/seam_audit.py` measures the step across each seam minus the step 3 px beside it, as RGB sum 0–765, with ≥ 12 counting as a visible line. It does this on the raw plate and on every L1/L3 render. The full table is `evidence/seam_report.json`. I also checked each edge by eye on before/after crops.

Hidden by the build:
- **Old rim strip by Daniel's fingertip.** The goal's gold wheel rim and blurred-logo patch (x ≈ 506–560, y 410–500) survived because the intake hard-restored `hand_daniel`. Measured steps: plate right edge 61.4, top 57.5, bottom 48.2; after render at 1366×768 they are −25.8, −0.7 and −3.0 (hidden). The wheel paint (rim r 240 plus a dark bezel to r 268) covers it, and the fingertip overlay polygon stops at Daniel's outline, so it never restores the strip. `g8_finger.json`: 2644 remnant px, **1 visible outside the wheel paint** (plate 506,414: one sub-threshold pixel at the bezel fade). The script's `old_rim_remnant_restored_by_overlay` = 232 counts fingertip pixels at x >= 506: the edit input regenerated the finger, so goal and edit differ there. Those pixels are the finger, not rim (checked on 2X zoom crops).
- **Slot circle edge (darkened disc r = 250).** On desktop the rim plus bezel covers it (render 8.1, below threshold). On phone and at 1366×640, where the wheel is off-slot or smaller, the slot veil (blur + darken ring) and the wheel cover it.
- **Footer zone top (y 812).** Strongest plate seam (110.4). Render −2.6 under the footer shade veil.
- **Slogan zone outlines** (left `36,642,290,774`, right `1248,642,1502,774`). The two slogan boxes cover them at the goal positions (+6 px). At 1366×640 the boxes move up to clear the footer and still cover the visible part.
- **Header zones (y 78 bottom edges).** Covered by the header plus the header shade veil.
- **Button zone (`498,740,1014,808`).** Under the buttons and the deck veil.

Still visible (listed as requested):
1. **Title zone right edge** (plate x = 1062, y ≈ 100–246, beside Nik's hair). The tone-match darkening made a faint vertical tonal boundary. The title veil softens it but cannot reach past x = 1072 without entering `face_nik` + 8 px. Faint on desktop; visible on close inspection at 1366×768 and 1440×900.
2. **Title zone left edge** (plate x = 470, y ≈ 100–246). Same cause, softened, fainter than the right edge. The veil stops at x = 440 (face_daniel + 8).
3. On phone the same two title-zone edges sit inside the band, where they are about 1/3 scale and faint.
The step metric does not flag the darkening as a sharp line on the plate: the intake feathered it over 24 px, so it reads as a soft box rather than an edge. Items 1–2 come from my visual check, not from the metric.
Metric summary (`seam_report.json` → `plate_seams_still_visible_in_render`): of the plate seams that measure >= 12 on the raw plate (footer zone top 110.4, old wheel patch 61.4, old rim strip 57.5 / 48.2), only one measures >= 12 in a render: `hand_daniel right` at **L1 1366×640 = 16.7**. There the shrunk wheel's own gold rim edge falls on plate x = 560. On a 4× zoom crop no old rim or patch pixels are visible (L3 1366×640 = −47.5). I report it as a metric hit, not a visible seam. Steps >= 12 that appear only in renders are UI edges on a zone line (header hairline, kicker text, button borders), listed under `render_steps_ge_threshold_any_cause`.

## Known limits
1. **1366×640.** Title, wheel, note and buttons only fit with the wheel at 80–83 % (brief floor 80 %). The wheel then leaves the plate slot: the slot veil hides the slot edge and old rim strip, and Daniel's finger points at the wheel without touching the rim. The plate is biased down (`oy = −20.5`) so both faces stay ≥ 8 px below the header (C4b: the offsets follow).
2. **Phone band.** It shows plate y 70–400 (x 195–1280), which keeps both faces whole and ends above Daniel's hand box − 8 px. Below the 220–250 px wheel, the hand cannot stay clear of the wheel on 360–430 px wide phones once the L3 note is shown. So the hand is out of frame and the finger overlay is hidden on phone (W5 fallback). The band transform is `k = W/1085`, `ox = −195k`, `oy = bandTop − 70k`. The wheel is concentric with the slot and its bezel covers the slot dome.
3. **Phone wheel diameters.** 360×640: 224–227 px. 390×844: 250 px. 430×932: 281 px. 375×553: 222 px (L1), 188 px (L2/L4) and 160 px (L3). It is below the brief's 220–250 range only where the note and the two 48 px buttons must fit without scroll.
4. **Phone wheel labels** use 12 px minimum text (G6), which is larger than the 22/240 R ratio. "PREMIER LEAGUE" wraps to two lines on the smallest wheels.
5. **L2 angle.** I used +8° instead of the brief's +31° sample. At +31° the Serie A and Bundesliga labels straddle the fixed wedge edge: half gold, half glass, measured 1.09:1 and 1.56:1. +8° is still a positive whole-turn-plus-offset angle in production's direction.
6. **The fixed wedge is counter-rotated** inside `.wheelTrack::before` with a `--rot` custom property. Production sets only `style.transform`, so a production port must also set `--rot`, or draw the wedge outside the track with the labels in a separate layer.
7. `data/leagues.js` was not touched. Its `logo` fields still point at non-existent real-logo files; that is flagged for Sol.
8. Static checkpoint: nothing animates.
