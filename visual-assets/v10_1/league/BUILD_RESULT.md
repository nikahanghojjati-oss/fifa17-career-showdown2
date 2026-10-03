# LEAGUE-V1 · BUILD_RESULT

Task: `CLOUD-LEAGUE-V1` (brief `visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md` R3.4 on `claude-cloud/hlc-goals`, launched by `CC-002_league-build.md`)
Model: Opus 5.5 · Effort: High · Role: build + evidence only (no taste authority, no self-approval)
Start: 2026-10-01T21:51:07Z · End: 2026-10-01T22:27:04Z (wall clock 36 min of the 45 min STOP_BUDGET)
R2 (decisions LEAGUE-M1 / LEAGUE-M2 + 393×660 captures): 2026-10-01T22:29Z to 22:42Z
Branch: `claude-cloud/league-v1` · Head: see the push reply / `git log -1` (this file is committed in that head)

## R2 changes (2026-10-01, decisions relayed by Nik)
1. **LEAGUE-M1, approved.** The finger overlay now follows Daniel's hand/sleeve outline inside his hand box, so the wheel bezel no longer covers his sleeve. The overlay rect is `[440,410,560,500]`: `keep_rects[0]` `[440,425,560,480]` widened to the `hand_daniel` rows. The polygon is in `tools/make_finger_overlay.py` and still stops at Daniel's outline, so the old rim strip stays hidden.
2. **LEAGUE-M2.** At 375×553 only the primary action has to be in the first view; the page may scroll there.
   - The wheel no longer shrinks to 160 px. On short phones it is 228 px, at least the 360×640 size in every frame (224–227 px; 228 in L3).
   - The note overlaps the wheel's bottom rim below the labels, as on desktop, and the buttons follow. Spin stays in the first view; BACK sits below the fold.
   - Every league label must reach 4.5:1 whatever its size. Measured minimum: 6.02:1, so no label backing was needed.
3. **393×660, DPR 3 (Nik's iPhone in Safari).** Added for every frame: no page scroll, Spin visible, wheel 239–252 px.
4. **Overlay registration** is now gated on the device-pixel grid: 0 device px everywhere. The CSS-px residue (0.0208) is LayoutUnit rounding of top + height and is reported separately.

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
| W2 fingertip overlay | DONE (R2) | `tools/make_finger_overlay.py`. Hand-drawn polygon following Daniel's finger and sleeve outline inside the overlay rect `[440,410,560,500]` (keep rect widened to the hand-box rows, LEAGUE-M1), 1.5 px feather, `assets/OVL_DANIEL_FINGER_V1_{1X,2X}.png`. Registered through `plateToScreen`: 0 device px on every desktop shot (CSS-px residue 0.0208 = LayoutUnit rounding) |
| W3 desktop layout (L1) | DONE | C6 chrome, title block, slogans, buttons. The wheel sits exactly on the slot (`onSlot=true`, scale 1.000) at 1366×768, 1440×900 and 1920×1080 in all four frames. At 1366×640 the scale is 0.838 (L1/L2) and 0.824 (L3/L4) |
| checkpoint commit + push | DONE | `db45cb9`; R1 final `d5b8986` |
| W4 frames L2–L4 | DONE | L2 uses a static CSS motion-blur ring (no animation) |
| W5 phone | DONE (R2) | 360×640, 375×553 (scroll allowed, Spin in first view), 390×844, 393×660 and 430×932. See Known limits 2–4 |
| G gates | See table | `evidence/qa_report.json` |
| C9 deliverables | DONE | This file, `evidence/`, `preview.html`, `CLAUDE_LEAGUE-BUILD_HANDOFF_TO_SOL_2026-10-01.md` |

## Gate results (R2: 41 shots = 4 frames × 10 viewports + 1 grid; 40 gated)
Viewports: desktop 1366×768, 1440×900, 1920×1080, 1366×640, plus 1366×768 at DPR 2. Phone at DPR 2: 360×640, 375×553, 390×844, 430×932. **393×660 at DPR 3** (Nik's iPhone, Safari visible area).

| Gate | Result | Measured |
|---|---|---|
| G1 Strings | PASS 40/40 | 0 missing, 0 extra in every frame/viewport (decorative list per section S) |
| G2 IDs | PASS 40/40 | All section-S ids exactly once. Roles and aria match main. `.wheelContainer > .wheelPointer` and `#leagueWheel > .wheelTrack > 5 .wheelItem` in main's order |
| G3 No scroll | PASS 40/40 | No horizontal scroll anywhere. No vertical scroll anywhere except 375×553, where it is allowed by LEAGUE-M2: page height L1 561, L2 561, L3 600, L4 582 px vs 553. 360×640 and 393×660 have no scroll |
| G4 Primary action | PASS 40/40 | `#spinLeague` fully in the first view (scroll 0) and hit by `elementFromPoint` at its centre, at 375×553, 393×660 and 1366×640 too. At 375×553 Spin bottom is 493 (L1/L2), 532 (L3), 514 (L4) |
| G5 No clipping | PASS 40/40 | No scroll overflow on any text element and no ellipsis. Wheel labels fit their item boxes |
| G6 Sizes | PASS 40/40 | Phone controls 48 px tall, full width. Desktop controls 56 px. Smallest text 12 px. Phone note 14 px |
| G7 Contrast | PASS 40/40 | Every league label (`.wheelItem`) measured against 4.5:1 regardless of size; minimum 6.02:1, so no label backing needed. Other text: 4.5:1 normal / 3:1 large. The title is measured on its gradient body #F2C45B. Glyph box = line box minus half-leading; rotated labels are sampled inside their glyph quad. Brightest-pixel method for light text, darkest-pixel method for dark text |
| G8 Faces and hands | PASS 40/40 | Smallest clearance: face_daniel 8.0 px, face_nik 12.4 px, hand_daniel 49.6 px, hand_nik 62.6 px. Finger overlay registration 0 device px. Fingertip containment: see the next section |
| G9 Imagery | PASS | Loaded: plate webp 1X/2X, finger overlay 1X/2X, woff2 fonts, inline/data SVG (marks, pointer, icons), page files. 0 disallowed. Name grep in folder: 0 hits |
| G10 Sides | PASS 40/40 | Daniel's face and hand centre x < Nik's everywhere. All four plate SHA-256 equal `intake_report.md` |
| G11 Tab order | PASS 40/40 | SIGN IN -> spin (when enabled) -> BACK (when enabled) = visual reading order |
| G12 Clean run | PASS 40/40 | 0 console errors, 0 failed requests, 0 uncaught exceptions |
| G13 Chrome snapshot | Reported | `qa_report.json` -> results[].G13 (header 56/48 px, badge, control boxes, footer 28 px) |

### G8 fingertip containment (`evidence/g8_finger.json`, 1X plate px, wheel paint = rim r 240 + bezel to r 268)
Inside `hand_daniel` the wheel paint covers 5479 px. They break down as follows:
- **1255** are restored by the finger overlay alpha (≥ 0.5): Daniel's finger and sleeve.
- **2631** are old rim / old wheel remnant: goal pixels the intake hard-restore kept, differing from the plates-in edit by > 45 at x ≥ 506.
- **1571** are background glow that equals the edit, so there is no Daniel there in either image.
- **22** are unclassified (bbox 503–506 × 467–485). On a 2X crop they are the left edge of the old gold rim block, not Daniel's sleeve.

**Result: no Daniel pixel stays under the wheel paint inside the hand box.**

Remnant pixels outside the wheel paint: 0.

Outside the protected box, just below the hand box (y 500–520), 240 dark sleeve pixels sit under the bezel. That matches the goal composition, where Daniel's arm is behind the wheel below the fingertip. I report it and did not change it.

## Intake seams (owner follow-up: "intake darkened some plate zones")
Method: `tools/seam_audit.py` measures the step across each seam minus the step 3 px beside it, as RGB sum 0–765, with ≥ 12 counting as a visible line. It does this on the raw plate and on every L1/L3 render. The full table is `evidence/seam_report.json`. I also checked each edge by eye on before/after crops.

Hidden by the build:
- **Old rim strip by Daniel's fingertip.** The goal's gold wheel rim and blurred-logo patch (x ≈ 506–560, y 410–500) survived because the intake hard-restored `hand_daniel`. Measured steps: plate right edge 61.4, top 57.5, bottom 48.2; after render at 1366×768 (R2) they are −25.8, 1.6 and 2.8 (hidden). The wheel paint (rim r 240 plus a dark bezel to r 268) covers it, and the fingertip overlay polygon stops at Daniel's outline, so it never restores the strip. `g8_finger.json` (R2): 2631 remnant px, **0 visible outside the wheel paint**.
- **Slot circle edge (darkened disc r = 250).** On desktop the rim plus bezel covers it (render 8.6, below threshold). On phone and at 1366×640, where the wheel is off-slot or smaller, the slot veil (blur + darken ring) and the wheel cover it.
- **Footer zone top (y 812).** Strongest plate seam (110.4). Render −2.8 under the footer shade veil.
- **Slogan zone outlines** (left `36,642,290,774`, right `1248,642,1502,774`). The two slogan boxes cover them at the goal positions (+6 px). At 1366×640 the boxes move up to clear the footer and still cover the visible part.
- **Header zones (y 78 bottom edges).** Covered by the header plus the header shade veil.
- **Button zone (`498,740,1014,808`).** Under the buttons and the deck veil.

Still visible (listed as requested):
1. **Title zone right edge** (plate x = 1062, y ≈ 100–246, beside Nik's hair). The tone-match darkening made a faint vertical tonal boundary. The title veil softens it but cannot reach past x = 1072 without entering `face_nik` + 8 px. Faint on desktop; visible on close inspection at 1366×768 and 1440×900.
2. **Title zone left edge** (plate x = 470, y ≈ 100–246). Same cause, softened, fainter than the right edge. The veil stops at x = 440 (face_daniel + 8).
3. On phone (393×660 included) the same two title-zone edges sit inside the band, where they are about 1/3 scale and faint.
The step metric does not flag the darkening as a sharp line on the plate: the intake feathered it over 24 px, so it reads as a soft box rather than an edge. Items 1–2 come from my visual check, not from the metric.
Metric summary (`seam_report.json` → `plate_seams_still_visible_in_render`): of the plate seams that measure >= 12 on the raw plate (footer zone top 110.4, old wheel patch 61.4, old rim strip 57.5 / 48.2), only one measures >= 12 in a render: `hand_daniel right` at **L1 1366×640 = 16.7**. There the shrunk wheel's own gold rim edge falls on plate x = 560. On a 4× zoom crop no old rim or patch pixels are visible (L3 1366×640 = −47.5). I report it as a metric hit, not a visible seam. Steps >= 12 that appear only in renders are UI edges on a zone line (header hairline, kicker text, button borders), listed under `render_steps_ge_threshold_any_cause`.

## Known limits
1. **1366×640.** Title, wheel, note and buttons only fit with the wheel at 80–83 % (brief floor 80 %). The wheel then leaves the plate slot: the slot veil hides the slot edge and old rim strip, and Daniel's finger points at the wheel without touching the rim. The plate is biased down (`oy = −20.5`) so both faces stay ≥ 8 px below the header (C4b: the offsets follow).
2. **Phone band.** It shows plate y 70–400 (x 195–1280), which keeps both faces whole and ends above Daniel's hand box − 8 px. Below the 220–250 px wheel, the hand cannot stay clear of the wheel on 360–430 px wide phones once the L3 note is shown. So the hand is out of frame and the finger overlay is hidden on phone (W5 fallback). The band transform is `k = W/1085`, `ox = −195k`, `oy = bandTop − 70k`. The wheel is concentric with the slot and its bezel covers the slot dome.
3. **Phone wheel diameters (R2).** 360×640: 227 (L1/L2/L4) and 228 (L3). 375×553: 228 in every frame, with the page scrolling. 393×660: 252 (L1/L2/L4) and 239 (L3). 390×844: 250. 430×932: 281. On short phones (375×553, and L3 at 360×640) the note overlaps the wheel's bottom rim below the labels, as on desktop, and the buttons follow it. At 360×640 that still fits without scroll.
4. **Phone wheel labels** use 12 px minimum text (G6), which is larger than the 22/240 R ratio. All five league labels are ≥ 6.02:1 in every frame and viewport.
5. **375×553 scrolls** (allowed by LEAGUE-M2): 8 px (L1/L2), 47 px (L3) and 29 px (L4) of page scroll. BACK is fully in view in L1/L2 (only the 12 px bottom margin scrolls) and partly below the fold in L3/L4. `evidence/*_375x553.jpg` is the first view; `*_375x553_fullpage.jpg` is the whole page.
6. **L2 angle.** I used +8° instead of the brief's +31° sample. At +31° the Serie A and Bundesliga labels straddle the fixed wedge edge: half gold, half glass, measured 1.09:1 and 1.56:1. +8° is still a positive whole-turn-plus-offset angle in production's direction.
7. **The fixed wedge is counter-rotated** inside `.wheelTrack::before` with a `--rot` custom property. Production sets only `style.transform`, so a production port must also set `--rot`, or draw the wedge outside the track with the labels in a separate layer.
8. `data/leagues.js` was not touched. Its `logo` fields still point at non-existent real-logo files; that is flagged for Sol.
9. Static checkpoint: nothing animates.


## Job 37 polish · League: hands on the wheel

Final factory pass: 2026-10-03 UTC on `factory/v1-wtt5ye`.

- **Goal geometry:** `evidence/hands/MEASURE.md` records the 1536×864 goal at wheel centre (762.6, 495.0), radius 233.3 px, ≈10 px visible rim, and Daniel fingertip at ≈(532.5, 457.0).
- **Fingertip contact:** `evidence/hands/qa_job37.json` measures ≈3.00 px overlap in L1–L4 at 1366×768, 1920×1080 and 1366×640. Daniel's cut-out remains above the wheel with the soft contact shadow beneath it.
- **Short desktop:** L3/L4 at 1366×640 hold an 8 px note-to-wheel clearance with a 0.820 wheel scale and zero page scroll.
- **Phone:** 393×660, 360×640 and 375×553 all keep Daniel's fingertip/contact visible. The tested 393×660 and 360×640 layouts have zero scroll; 375×553 keeps the primary action in the first view and, in the final compact layout, also reports zero scroll.
- **Wheel polish:** shared `../shared/art/wheel/WHEEL_RIM_V1.webp` supplies the lit riveted outer rim over live DOM/SVG wedges. League marks remain live; L2 uses the final offset that keeps adjacent labels out of the gold-wedge contrast trap.
- **Title / controls:** the League-specific wordmark is still absent from the branch, so the required `TODO-WORDMARK` Kaushan/shared display-font fallback remains. Buttons and slogan cards use the shared Showdown kit language.
- **Factory QA:** `evidence/hands/factory-qa/qa_report.json` = **PASS**, no failing runs across L1–L4 and the factory viewport matrix.
- **Mockup fidelity (H10):** `evidence/hands/mockup-diff/scores.json` = **PASS**. Build SSIM 0.662, coarse SSIM 0.638, mean ΔE 8.8; protected-box SSIM: Daniel face 0.992, Nik face 0.994, Daniel hand 0.788, Nik hand 0.994. The compare sheet and 4× fingertip proof are in `evidence/hands/COMPARE_GOAL_BUILD.png` and `evidence/hands/FINGERTIP_4X.png`.
- The transient Job 37 QA workflow removed itself after committing the final evidence.
