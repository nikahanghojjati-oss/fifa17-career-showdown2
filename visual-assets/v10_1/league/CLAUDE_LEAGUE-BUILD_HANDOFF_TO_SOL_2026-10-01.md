# Claude → GPT-5.6 Sol · LEAGUE-V1 build handoff · 2026-10-01

From: Claude Code Cloud session (Opus 5.5, effort High), implementation worker for `CLOUD-LEAGUE-V1`
To: GPT-5.6 Sol (via Nik); copy to Claude in the project chat
Branch: `claude-cloud/league-v1` · base `claude-cloud/transfer-tr2-plate-g@8fbda03` → intake `7ecb0b7` → crest merge `021a383` (pinned `f1cfff4`) → checkpoint `db45cb9` → final head (in the reply)
Role: build + evidence. No taste authority and no self-approval. Every look question below is for you and Nik.

## R2 update (2026-10-01): decisions applied
Decisions relayed by Nik, applied and re-verified:
- **LEAGUE-M1 (approved: overlay follows Daniel's hand/sleeve outline inside his hand box).**
  - The overlay rect is `[440,410,560,500]` (`keep_rects[0]` widened to the `hand_daniel` rows) and the polygon follows the sleeve outline.
  - Inside `hand_daniel` the wheel paint covers 5479 px: 1255 restored by the overlay, 2631 old-rim remnant, 1571 background glow, and 22 old-rim edge pixels (2X crop).
  - No Daniel pixel stays under the wheel in the hand box. Old rim remnant visible: 0 px.
  - Registration: 0 device px.
- **LEAGUE-M2 (375×553: only Spin must be in the first view).**
  - The wheel stays at 228 px there, at least the 360×640 size (224–227/228).
  - The note overlaps the bottom rim below the labels and the buttons follow. Spin is in the first view (bottom at 493/493/532/514 px); the page scrolls 8–47 px.
  - Every league label is gated at 4.5:1 and measures at least 6.02:1, so no backing was needed.
- **393×660 at DPR 3 (Nik's iPhone, Safari).** Added for L1–L4: no page scroll, Spin visible, wheel 239–252 px.
- **QA R2:** 41 shots (40 gated + 1 grid). **All gates G1–G12 pass on all 40 gated shots.** G13 reported.
- Open questions 1 and 4 below are resolved by these decisions; 2, 3 and 5 remain.

## What was built
A static checkpoint prototype in `visual-assets/v10_1/league/`: `index.html`, `league.css`, `league.js`, `fixtures.json`, plus tools, evidence, and the single-file `preview.html`.
- **Wheel.** Live DOM + CSS/SVG, centred on the plate slot (762, 496) with a 240 px rim radius × k. It keeps main's DOM: `.wheelContainer > .wheelPointer` and `#leagueWheel.leagueWheel > .wheelTrack > 5 × .wheelItem` in main's order. Main's rotation contract holds: `.wheelTrack` gets `rotate(getLeagueRotation(id))`.
- **Marks.** Only `applyLeagueMark` from the pinned crest SHA, with no redraw. The wheel applies a CSS-only monochrome treatment: `grayscale(1) sepia(.32) brightness(1.32)` on glass, and `grayscale(1) brightness(.62) contrast(1.75)` on the gold wedge. Marks outside the wheel are not restyled.
- **Fingertip overlay** `OVL_DANIEL_FINGER_V1_{1X,2X}.png`. Cut from our own plate with a hand-drawn polygon and 1.5 px feather, and layered above the wheel through `plateToScreen`. R2: the overlay rect is `[440,410,560,500]` and the polygon follows Daniel's finger and sleeve outline inside his hand box.
- **Seam treatment.** The owner asked for this after intake. All of it is decorative and `aria-hidden`:
  - a dark wheel bezel out to r 268 that covers the old rim strip;
  - a slot veil, used when the wheel is off-slot;
  - four seam-heal veils: header, title, button deck, footer.

## Gate results
See `BUILD_RESULT.md` § Gate results and `evidence/qa_report.json`. Summary (R2): G1–G12 PASS on all 40 gated shots. That covers 4 frames × 10 viewports, including 393×660 at DPR 3. 375×553 scrolls vertically, as LEAGUE-M2 allows, with Spin in the first view. G13 reported. (R1 had G7 BLOCKED at L3 375×553 and 226 sleeve px under the bezel. Both are resolved.)

## Where the goal image and the product disagree, and what I did
1. **Real league logos on the goal's wheel.** Not used. The marks are the crest-v1 originals in a monochrome treatment.
2. **Segment order.** The goal has PL top, Bundesliga right, Ligue 1 lower right, Serie A lower left, LaLiga left. Main's order wins: PL, LaLiga, Bundesliga, Serie A, Ligue 1 clockwise at 72° steps.
3. **Navigation tabs and the search, settings and profile icons in the goal header.** Omitted per C6. The header carries `#onlinePlayerIdentityBadge` (fixture `SIGN IN`) and `#seasonIndicator` (fixture `Season 1 / 5`, main's format `Season n / total`).
4. **Wheel hub.** The goal has a crown; main's `.leagueWheel::before` says `CMS 17`. Replaced by an `aria-hidden` crown roundel, as the brief says.
5. **Goal subtitle `SPIN TO SELECT LEAGUE`.** This is `#selectedLeague` with main's text `Spin to select league`. CSS uppercases it and the DOM text is unchanged.
6. **L3/L4 note.** The goal has no note; main shows `#leagueStateNote` in L3/L4. It is a one-line dark-glass strip above the buttons on desktop and up to 3 lines on phone.
7. **L2 mid-spin angle** is +8°, not the sample +31° (512° = 2×360 − 216 + 8). At +31° two labels straddle the fixed wedge edge and fail G7 (1.09:1 and 1.56:1). The brief allows another positive whole-turn-plus-offset angle; please confirm.
8. **BACK `aria-disabled`.** The fixture mirrors `setLeagueWheelBusy`: L2 is `true` and L3 (after a spin) is `false`. L1 and L4 have no attribute, because main sets one only through `setLeagueWheelBusy`.

## Open questions for Sol
1. **[RESOLVED in R2: option (a) approved and applied]** **G8 fingertip containment, strict reading.** The wheel paint must reach r ≈ 263–268 to hide the goal's old rim strip and blurred-logo patch that the intake hard-restore kept inside `hand_daniel`. That paint also covers **226 px of Daniel's sleeve edge** (bbox plate 494–506 × 421–500). Those pixels sit inside `hand_daniel` but outside `keep_rects[0]`, and the brief confines the overlay to the keep rect, so they are not restored. It is a dark bezel over a dark sleeve and the fingertip itself is fully restored, but by the letter of G8 this is "wheel over hand box without overlay". Options:
   - (a) Allow the overlay polygon to extend outside `keep_rects[0]` within `hand_daniel`. That restores the sleeve exactly, and I can do it in one pass.
   - (b) Shrink the bezel. That re-exposes part of the old rim strip, which the owner asked to hide.
   - (c) Accept as is.
   I recommend (a).
2. **Title-zone tone boundaries.** The left (x 470) and right (x 1062) edges of the darkened title zone stay faintly visible. The right edge sits 18 px from Nik's face box, so the veil cannot reach past it. A fix at intake level would be better: a wider feather or a smaller ratio target for `rect[470,88,1062,246]`. Is that the owner's call?
3. **Phone composition.** The hand is out of frame and the overlay is hidden on all phone sizes (W5 fallback). Do you want a tall-phone variant (390×844, 430×932) that keeps the finger pointing at a slot-registered wheel? That wheel would be about 190 px, below the 220–250 spec.
4. **[RESOLVED in R2: wheel 228 px, page scroll allowed, Spin in first view, labels ≥ 6.02:1]** **375×553 L3/L4.** The wheel is 160 px so that everything fits without scroll. One label measures low on G7 there; see BUILD_RESULT. Should I accept, or drop the band on short phones instead?
5. **Production port of the wedge.** It is counter-rotated through `--rot`, but production sets only `style.transform`. Is a one-line `--rot` set in `leagueWheel.js` acceptable later, or should the wedge and label layer be restructured?

## What Nik should look at
- `preview.html` (single file): L1–L4, desktop and phone.
- R2: `evidence/L1_393x660.jpg` … `L4_393x660.jpg` (Nik's iPhone), `evidence/L3_375x553.jpg` (first view) and `L3_375x553_fullpage.jpg`, and `evidence/L1_1366x768@2x.jpg` (sleeve now above the bezel).
- `evidence/L1_1366x768.jpg` (Tier S) and `evidence/L1_1366x768@2x.jpg`. Zoom on the fingertip to see the finger in front of the rim with no old rim strip.
- `evidence/W1_league_marks_1x.png`: the monochrome mark treatment. Do the selected (near-black) marks read well enough?
- `evidence/L3_1366x768.jpg`: the note strip over the bottom rim.
- `evidence/L1_360x640.jpg` and `evidence/L3_375x553.jpg`: the phone compositions.
- The title-zone edges beside both heads (open question 2).
