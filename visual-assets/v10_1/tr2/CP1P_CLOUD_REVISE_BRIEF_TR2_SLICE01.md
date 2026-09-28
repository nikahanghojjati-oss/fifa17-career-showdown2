Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, hosted Cloud session
Model: **Opus 5.5**. Part A at **Medium**, Part B at **High**, as two separate sessions. Sonnet 5 is not permitted. If Opus 5.5 is not offered, STOP and tell Nik.
Branch: `claude-cloud/transfer-tr2-slice-01`. Part A starts from `646e227aa71cd5d712c791e6436ece103a2e2dfd`; Part B starts from Part A's pushed head.
Role: apply this brief and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik)
Supersedes: `tr2/CP1R_CLOUD_REVISE_BRIEF_TR2_SLICE01.md` (never run; paused by the owner's north star).

# CLOUD REVISE BRIEF · CP1P · Transfer War premium integration

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-27
Product-truth sign-off: `PENDING · GPT-5.6 Sol`

## 0. Intent (read once)
CP1 reads as a web dashboard over a photo: 21 elements with complete four-sided borders in F2, a large floating form, and a blank card for the rival. CP1P keeps every product behaviour and every CP1R mechanical fix, and replaces the surface treatment with one physical grammar:
- **Glass stands on the desk.** A task surface is a smoked-glass pane rising out of the foreground desk (its glass runs to the frame bottom). It has a lit top seam, one graphite frame post on its outer side, and an inner edge that dissolves into the room. No four-sided borders anywhere.
- **Controls are recessed wells**: dark inset fill and one lit bottom rule.
- **Labels are desk plaques**: bevelled graphite with engraved brass type.
- **The rival's side is an object**: a closed graphite folio lying on the table in perspective, with a brass band, a wax seal and three identical blank tabs. It carries no text and no padlock.
Live text and controls stay flat, screen-aligned, semantic DOM. Perspective is allowed only on `aria-hidden` objects that carry no live text.

## Fixed (unchanged from CP1; do not touch)
Strings, IDs, aria attributes, DOM order and tab order (CP1 Appendix C/D). Font sizes: status 15, heading 26, notes 14, inputs 18 desktop / 16 mobile. Heights: select/input 44 desktop and 48 mobile, LOCK 54, `REQUEST EARLY END` 52. Also unchanged: `LOCK MY GUESSES` styling; camera presets; pose placement; cues; sign position; lockup; S1/S2. No rival DOM. Nothing animates. No raster generation; CSS and inline SVG only.

---
## PART A · Asset pass (session 1 · Opus 5.5 · Medium)
```
TASK_ID: CLOUD-TR2-01-CP1P-A
STOP_BUDGET: 15 min wall-clock / $3 credit
PRIORITY_ORDER: A1 > A2 > evidence
SCOPE: assets/derived/, assets/manifest.json, the F1/F4 pose pointer in frames.js or fixtures.json. Nothing else.
```
- **A1 (= CP1R R2, verbatim):** export WebP (q ≥ 90, alpha) and AVIF (alpha) from `assets/derived/POSE_TR2_NIK_WINDOW_POINT_V1_DENOISE_CANDIDATE.png`. Point F1/F4 at them. In the manifest, give the candidate the shipping role and keep the non-denoised intake for provenance.
- **A2 (= CP1R R1, verbatim, ONE pass, no tuning):** files 2 and 3, derived `_INTAKE` copies only. Work in the hair band only (rows from POSEMAP `crown_y` to `min(eye y) − 20`), on pixels 0–8 px inside the alpha edge. Multiply L\* by 0.80 at the edge, rising linearly to 1.00 at 8 px. Then cut the b\* excess over the local interior mean by 60%. Re-export WebP/AVIF, update the manifest, and record halo ratios before and after.
- Evidence: `E3R_guess_hair.jpg` (files 2 and 3, hair at 2×, before and after, on #3C3C3C and on the plate under CUE-PRIVATE, ratios printed); `F1_1366x768_dpr2.png`.
- Return `CLOUD_BUILD_RESULT_CP1P_A.md` (model, effort, times, head SHA, A1/A2 status, hashes). Commit, push, stop.

---
## PART B · Presentation build (session 2 · Opus 5.5 · High)
```
TASK_ID: CLOUD-TR2-01-CP1P-B
STOP_BUDGET: 45 min wall-clock / $10 credit (Nik watches credit; you watch `date`)
PRIORITY_ORDER: B0 > M2 > M3 > M4 > P1 > P2 > P3 > P4 > P5 > R3 > P6 > evidence
SCOPE: visual-assets/v10_1/tr2/slice-01/ only. main, production files, PRs, merges untouched.
```
**Cost rules:** record `date` at start. Commit and push after M4 (checkpoint) and at the end. At 36 min, stop adding scope: finish the current item, capture evidence for done items, commit, and mark the rest `NOT DONE`. At 45 min, stop. No installs beyond `npm ci`. An item that fails its gate twice is `BLOCKED` with measured values; there is no third attempt.

### MUST (mechanical; CP1R, restated)
- **B0 · Never clip (CP1R M1.2 + M1.3):** desktop `.scene-stage { height: max(100vh, 768px) }`. Remove vertical `overflow:hidden` from `html`, `body`, `#stage-root` and `.scene-stage`; keep `overflow-x:hidden`. Fit and camera math read the stage box, not `innerHeight`. Assertions (hard fail):
  - (a) F2/F3 at 1366×768: every descendant of `.guess-viewer-panel` has bottom ≤ 756, and `scrollHeight ≤ 768`;
  - (b) F2 at 1366×640: after `scrollIntoView()`, `elementFromPoint` at the centre of `#completeTransferChallenge` returns it;
  - (c) F2 at 1366×768: runtime-inject `QA ERROR LINE` into `#transferChallengeError` (never in fixtures or captures); it passes the same test.
- **M2:** `.mobile-layout .slot-fields select, .mobile-layout .slot-fields input { flex:0 0 auto; height:48px; min-height:48px }`. Assert ≥ 48 at 390×844 and 360×780, and ≥ 44 on desktop.
- **M3 (+M5):** `.mobile-layout .top-bar { height:auto; min-height:48px; padding:4px 12px; column-gap:8px; row-gap:6px }`. `@media (max-width:380px) { .mobile-layout .ghost-chip { padding:6px 10px; letter-spacing:.02em; font-size:12px } }`. **New M5:** `.mobile-layout .ghost-chip { min-height:48px }` (was 40, below the 48 px mobile target). Assert no box intersection among the chips, title and rail items at 360×780 and 390×844, and chip height ≥ 48.
- **M4:** move the sign-face text into the camera container between L1 and L2 so the poses occlude it. Keep id `transferTimerDisplay`; F1 keeps `role="timer"` and `aria-live="off"`. F2/F3: fit `WINDOW CLOSED` to ≤ 80% of the sign-face width, with its box ≥ 12 px clear of both hair silhouettes (measured from the rendered pose alpha); 70% dim, no digits. F1: assert the clock box is ≥ 8 px from both heads.

### P1 · Scouting workstation (F2/F3): replaces the `.guess-viewer-panel` surface
Keep the panel element, its children, order and IDs. Strip its surface: no background, border, rails, chamfer, clip-path or backdrop filter. Padding `14px 20px 14px`. Spacing: `.phase-intro` margin-top 6; `.guess-heading` margin `6px 0 2px`; `.rule-note` margin-bottom 8; `.scouting-slot` height 52 (`position:relative`); `.scouting-slots` gap 6, margin-bottom 10.
Add `aria-hidden` decorative siblings. Values are for 1366×768; F3 mirrors F2 by x′ = 1366 − x:

| Part | F2 (Nik viewer) | F3 (Daniel viewer) |
| --- | --- | --- |
| panel (content) | left 790, width 552, top 324, z 65 | left 24, width 552, top 324 |
| `.ws-glass`, z 50 | x 760–1342, y 324 → stage bottom | x 24–606 |
| `.ws-post`, z 66 | x 1342–1350, y 310 → stage bottom | x 16–24 |
| `.ws-seam`, z 51 | y 323, h 2, x 888–1342 | x 24–478 |
| `.ws-tab` (viewer plaque, P3 style) | right edge 1342, top 292 | left edge 24 |
| `.ws-pool` (in L4) | ellipse 240×90 centred (760, 600) | centred (606, 600) |

- `.ws-glass`: `background: linear-gradient(to bottom, rgba(8,10,13,.74) 0, rgba(8,10,13,.80) 120px, rgba(8,10,13,.80) calc(100% - 24px), rgba(8,10,13,.62) 100%)`; `backdrop-filter: blur(16px) saturate(1.1)`. `mask-image: linear-gradient(to right, transparent 0, #000 36px)` (F3: `to left`). An 18 px chamfer at the top corner on the post side (clip-path). `::after` specular: `linear-gradient(105deg, transparent 30%, rgba(255,236,200,.05) 38%, transparent 46%)`. No border, radius or shadow.
- `.ws-seam`: `linear-gradient(to left, #F2D48A 0, #C99B45 30%, rgba(201,155,69,0) 100%)` (F3: `to right`), with `box-shadow: 0 0 12px 1px rgba(242,196,91,.35)`.
- `.ws-post`: `linear-gradient(to right, #0B0D10, #1E232A 45%, #0E1115)`, `border-top: 2px solid #C99B45`, and a 1 px inner-face highlight `rgba(230,194,122,.55)` via inset shadow on the side facing the glass.
- `.ws-pool`: `radial-gradient(closest-side, rgba(242,196,91,.14), transparent)`, `mix-blend-mode: screen`.
- `.ws-tab` carries `MANAGER 2 · NIK` + `YOU` (F3: `MANAGER 1 · DANIEL` + `YOU`). It replaces the floating own-nameplate.
- Header: `.guess-header { padding-bottom:6px; border-bottom:1px solid rgba(201,155,69,.22) }`. `.chip-private`: no border, no pill; brass 11 px, letter-spacing .12em, left padding 14 px; `::before` is an 8×1 px brass rule.
- **Wells:** on `.slot-fields select, .slot-fields input` set `border:0; border-bottom:1px solid rgba(201,155,69,.75); border-radius:2px 2px 0 0; background:rgba(4,5,7,.92); box-shadow: inset 0 2px 6px rgba(0,0,0,.65), inset 0 1px 0 rgba(0,0,0,.9)`. `input:disabled` bottom rule at `.40`; select `:hover` bottom rule `#F2C45B`. The focus ring is unchanged.
- **Numerals:** `.slot-num` loses its box. 30 px column; Condensed 700 22 px, `rgba(201,155,69,.85)`; left padding 6. `::before` is a 2×18 px brass tick at left 0, top 6.
- **Row dividers:** `.scouting-slot + .scouting-slot::before`, absolute, top −3 px, left 40, right 0, height 1 px, `rgba(201,155,69,.18)`.
- L4 scrim: keep the CP1 mechanism under the panel footprint, set to `rgba(0,0,0,.60)` with `blur(32px)`.
- **Gates:** B0(a) holds. Face clearance ≥ 8 px for every P1 part. F3: `.ws-glass` right ≤ 640, and the E7 gaze point lies outside every viewer-UI rect. Contrast is measured with the brightest-pixel method: notes ≥ 4.5, heading ≥ 3.0, select text on the well ≥ 4.5, and the well's bottom rule ≥ 3:1 against the well fill. If text fails, first add a per-block L4 scrim behind that block, raising it by .05 up to .85. Only then raise the `.ws-glass` stops, to at most .86.

### P2 · Sealed folio (F2/F3 rival): replaces `.sealed-dossier`
Delete `.sealed-dossier`, its scrim, the inner `… · SEALED` text and the padlock. Build `.folio` (`aria-hidden`, in L5 above L3; CSS + inline SVG; no raster):
- Size and pose: 300×200 **screen** px (divide by the camera scale in world units). `transform-origin: 50% 100%`, `transform: perspective(900px) rotateX(50deg) rotateZ(-4deg)` (F3: `4deg`). **Target bbox:** F2 about x 79–378, y 555–677; gate: inside x 60–400, y 540–690. F3: inside x 966–1306, y 540–690. Adjust only left/top. If it can't fit, scale in 10% steps down to 80%.
- Body: radius 6; background `repeating-linear-gradient(90deg, rgba(255,255,255,.010) 0 1px, transparent 1px 4px), linear-gradient(160deg,#221F1B 0%,#141310 55%,#0B0A09 100%)`; `box-shadow: inset 0 1px 0 rgba(255,230,170,.18), inset 0 -2px 0 rgba(0,0,0,.6), 0 6px 0 #2B2822`; `filter: drop-shadow(0 12px 10px rgba(0,0,0,.65))`. `::after` sheen: `linear-gradient(115deg, transparent 40%, rgba(255,220,150,.07) 50%, transparent 60%)`.
- Band: full width, top 91, height 18, `linear-gradient(to right,#8A6A2E,#C99B45 50%,#8A6A2E)`.
- Seal: 64 px SVG at left 118, top 68. Outer circle r 21, fill `rgba(201,155,69,.85)`, stroke `#6E5222` 1.5. Inner ring r 16, stroke `#6E5222` 1. Text `CM17`, Condensed 700 14, fill `#3A2A10`.
- Tabs: exactly **3 identical** 64×14 tabs, top −10, centred at 20% / 50% / 80%; `#1C1A17`, `inset 0 1px 0 rgba(201,155,69,.45)`, radius `2px 2px 0 0`. No text, no numbers, no state variation.
- **Rival plaque** (P3 style, screen-aligned, real text): `MANAGER 1 · DANIEL` + `SEALED` tag (F3: `MANAGER 2 · NIK`), with top = folio bbox bottom + 8 and left = folio bbox left + 20.
- **Gates:** folio text is empty apart from the SVG `CM17`. `.folio-tab` count = 3, with identical computed size. Folio `outerHTML` is identical in F2 and F3 once side classes and inline position/rotation are stripped. No U+1F512 inside any rival element. The rival's protected contacts are ≥ 12 px clear.

### P3 · Plaques: replace `.nameplate` boxes and CP1R R4
- Plaque: no border. `background: linear-gradient(to bottom,#24221E,#141310)`. `box-shadow: inset 0 1px 0 rgba(255,236,190,.22), inset 0 -1px 0 rgba(0,0,0,.7), 0 6px 10px -4px rgba(0,0,0,.7)`. Radius 2; padding `6px 12px`. Type: Condensed 600 14 px, `#D9B26A`, `text-shadow: 0 1px 0 rgba(0,0,0,.8)`.
- `YOU`: the gold tag, unchanged. `SEALED`: no pill; brass 10 px, letter-spacing .12em, with a leading 8×1 px rule.
- F1: each plaque has two lines, the name plus tag, then the motto (Barlow italic 13 px, `rgba(201,155,69,.9)`, `aria-hidden`). Daniel's plaque right edge = `.con-glass` left − 16; Nik's plaque left edge = `.con-glass` right + 16; top 600.

### P4 · Window console (F1): replaces the `.window-brief-panel` surface
- The panel content box is unchanged (500 wide, centred, top 460, z 55). Strip its surface as in P1.
- `.con-glass` (z 50): x 409–957, y 460 → stage bottom; `linear-gradient(to bottom, rgba(8,10,13,.74) 0, rgba(8,10,13,.80) 120px, rgba(8,10,13,.80) 228px, rgba(8,10,13,.50) 100%)`, with the P1 blur and specular. Mask: `linear-gradient(to right, transparent 0, #000 28px, #000 calc(100% - 28px), transparent 100%)`.
- `.con-seam`: y 459, x 433–933, h 2, `linear-gradient(to right, transparent, #C99B45 20%, #F2D48A 50%, #C99B45 80%, transparent)`, with the P1 glow. No post.
- `#endTransferTimer`: `border:0; background: linear-gradient(to bottom,#2A313B,#1A1F26); box-shadow: inset 0 1px 0 rgba(201,155,69,.6), inset 0 -1px 0 rgba(0,0,0,.8)`.
- Gates: F1 protected contacts ≥ 12 px; contrast as in P1.

### P5 · Mobile (F4/F5): recompose, don't stack boxes
- Strip: add a 28 px bottom overlay, `transparent → rgba(8,10,13,.86)`. The console or workstation starts flush below it (0 gap), full-bleed (margin 0), padding 16. Surface `rgba(8,10,13,.86)`, no border. Top seam 2 px over 70% of the width from the viewer's side (F5: from the right; F4: centred, as in P4). Wells as in P1 at 48 px.
- F5: delete the `.mobile-dossier-bar` row. Put a sealed tag **inside the strip**, absolute at left 12, bottom 10, in P3 plaque style: a 16 px seal SVG (no padlock), then `DANIEL · SEALED` (real text), then three identical 10×4 brass bars (`aria-hidden`). Gate: ≥ 8 px from both face boxes; heads stay ≥ 64 px.
- F4: the nameplate and motto rows stay text-only, with no boxes.
- Unchanged: LOCK full width and in flow; the page ends ≤ 48 px after LOCK; 360×780 stacks.
- Desktop and mobile ghost chips: `border:0; background: rgba(7,9,12,.35); box-shadow: inset 0 -1px 0 rgba(201,155,69,.55); border-radius:0`.

### R3 · Rail scrim (CP1R R3, verbatim)
L4 scrim at x 0–300, y 56–280, black 55%, feathered 32 px. Contrast: active/done ≥ 4.5, upcoming ≥ 3.0. Raise `.phase-rail li` opacity from .55 toward .70 only if needed to pass.

### P6 · Contact shadows (desktop; lowest priority; REPORT only)
Inside the camera container, above L3: per pose, one ellipse at plate u 0.32 (Daniel) and 0.685 (Nik), top at the far-edge polyline v − 0.005, width 0.19 u, height 0.073 v, `radial-gradient(ellipse at 50% 0%, rgba(0,0,0,.45), transparent 70%)`.

### Anti-box and privacy assertions (hard fail unless marked)
- **AB1:** in F1–F5, zero rendered elements have a ≥ 1 px border on all four sides with border alpha ≥ .25 (focus outlines excluded). CP1 counts: F1 6 · F2 21 · F3 21 · F4 4 · F5 14.
- **AB2:** `.ws-glass` and `.con-glass` have a computed `mask-image` other than `none`, and no border.
- **AB3:** in F2/F3 at DPR 1, LOCK's mean luminance is higher than that of any other UI element region.
- **AB4 (REPORT):** in the F2 8 px blur, band-plus-seal mean luminance ÷ folio-body mean; target ≥ 1.5.
- **PV1:** no `[id^=p2Guess]` in F2 or F5; no `[id^=p1Guess]` in F3.
- **PV2:** P2 gates.
- **PV3:** tab order is unchanged.
- **PV4:** zero console errors and zero failed requests.

### Evidence (PNG; overwrite the same names in `evidence/raw/`)
- F1, F2, F3 at 1366×768, DPR 1 and 2.
- F2 at 1366×640, full page.
- F4 at 390×844, DPR 1.
- F5 at 390×844, DPR 1 and DPR 2, full page; F5 at 360×780, full page.
- `E8_{F1,F2,F3}_blur8px.png` and `_grayscale.png`.
- `E11_F2_folio_2x.png`: folio and plaque, 2× crop.
- `E12_F2_workstation_2x.png`: seam, post, tab and slot 1, 2× crop.
- `render_qa_report.json` with every assertion above.

### Return (`CLOUD_BUILD_RESULT_CP1P_B.md`, also pasted as the final message)
1. Model and effort.
2. Start and end time, and elapsed minutes.
3. Head SHA.
4. Each item B0–P6 as DONE / NOT DONE / BLOCKED, with measured values.
5. AB1 counts per frame.
6. Changed files.
7. Evidence paths.
8. A statement that `main` and production files are untouched.

Stop. No motion, no Stage Engine, no PR, no merge.
