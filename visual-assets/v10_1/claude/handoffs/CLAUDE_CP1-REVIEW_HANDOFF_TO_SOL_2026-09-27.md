# CLAUDE -> SOL HANDOFF - CP1-REVIEW
Producer verdict on frozen CP1 candidate `claude-cloud/transfer-tr2-slice-01 @ 646e227` (final)

## Header

| Field | Value |
| --- | --- |
| Task ID | CP1-REVIEW (CLOUD-TR2-01-CP1) |
| Claude model | Opus 5.5 (Claude Project chat) |
| Role | Lead Visual Producer — checkpoint verdict |
| Date | 2026-09-27 |
| Source anchor | `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`, re-resolved live. SOURCE_DRIFT: **no** |
| Candidate | `claude-cloud/transfer-tr2-slice-01 @ 646e227aa71cd5d712c791e6436ece103a2e2dfd` (branch tip re-resolved: identical). Git SHA is the authoritative fingerprint (accepting SOL-CP1-E2). |
| Visual branch | `visual/cinematic-system-v10 @ 95f7dd68c285707d3dd35377bb3dba34c62a89f6` (contains `SOL_CP1_BUILD_CHECK_2026-09-27.md`) |
| Write operations | none to repo, images or implementation |
| Verdict status | **REVISE** |

Files reviewed: `SOL_CP1_BUILD_CHECK_2026-09-27.md`; `tr2/CP1_CLOUD_BUILD_BRIEF_TR2_SLICE01.md`; `slice-01/CLOUD_BUILD_RESULT.md`; `evidence/render_qa_report.json`; `styles.css`; `frames.js` (camera/placement); `fixtures.json`; posemap for file 5; images: `F1/F2/F3_1366x768_dpr1` and `_dpr2` (1366×768 / 2732×1536), `F2_1366x640_dpr1_spotcheck` (1366×640), `F4_390x844_dpr1` (390×844), `F5_390x844_dpr1`/`_dpr2` (390×980 / 780×1960), `F5_360x780_dpr1_spotcheck` (360×998), `E3_pose_edges.jpg`, `E4_nik_skin_denoise.jpg`, `E7_F3_eyeline.png`, `E8_F2_blur8px`/`_grayscale`, plus 1:1 crops of `POSE_TR2_NIK_WINDOW_POINT_V1_INTAKE.png` vs `_DENOISE_CANDIDATE.png`. Not re-inspected: E1, E2, E5, E6, S1/S2 (no open question on them).

## 1. Verdict

**REVISE**

The direction is working. F1 is close to owner-ready: clock on the sign, managers flanking, the brief panel centred, and Daniel's sheet/open hand and Nik's finger/tablet are all clear. F3's privacy staging is right. But SOL-CP1-E1 is a real failure, and worse than the 768 measurement shows: the desktop stage clips instead of scrolling, so on a real 1366×768 laptop (browser inner height ≈ 620–660 px) slot 3 and `LOCK MY GUESSES` are cut off and unreachable. Mobile guess controls render at ≈ 22 px instead of 48 px. At 360 px the top bar overlaps the rail. And `WINDOW CLOSED` is drawn in front of both managers' hair.

Path to ready: one bounded Cloud revision with exact deltas (M1–M4, then R1–R5), capped at 30 min / $6, followed by a verify-only producer pass.

## 2. Sol decision table

| ID | Finding | Severity | Product-truth risk | Resolver | Confidence | Sol decision |
| --- | --- | --- | --- | --- | --- | --- |
| CP1-M1 | SOL-CP1-E1 confirmed: Guess panel overflows 1366×768 by 33 px and the stage clips (no scroll); at 1366×640 LOCK is unreachable | MUST | LOW (a reachability fix; no behaviour change) | Cloud | High | |
| CP1-M2 | Mobile select/input render ≈ 21–23 px tall, not 48 px | MUST | NONE | Cloud | High | |
| CP1-M3 | CP1-K2: at 360 px the REFRESH chip overlaps the rail text, a collision rather than just a wrap | MUST | NONE | Cloud | High | |
| CP1-M4 | `WINDOW CLOSED` sign text drawn over both managers' hair in F2/F3 | MUST | NONE | Cloud | High | |
| CP1-D1 | CP1-K1 decision: Window-pose rim accepted; Guess poses get one fixed attenuation pass (R1) | Decision | NONE | Claude | Medium | |
| CP1-D2 | Nik skin: **denoise candidate** chosen for file 5 (R2) | Decision | NONE (likeness preserved) | Claude | High | |
| CP1-D3 | F2: Nik's own panel covers his stylus hand. B3-3 bend accepted; rule amended | Decision | NONE | Claude | High | |
| CP1-R1 | Guess-pose hair rim attenuation, one pass | SHOULD | NONE | Cloud | Medium | |
| CP1-R2 | Ship the Nik denoise candidate in F1/F4 | SHOULD | NONE | Cloud | High | |
| CP1-R3 | Rail upcoming steps illegible over bright glass (F1) | SHOULD | NONE | Cloud | High | |
| CP1-R4 | F1 mottos low-contrast, crossed by the table's gold line | SHOULD | NONE | Cloud | High | |
| CP1-R5 | Sealed Dossier reads as an empty UI card and disappears in the squint test; it also carries extra inner text | SHOULD | NONE (privacy PASS) | Cloud | High | |
| CP1-N1 | Poses pinned to screen targets, not world standing spots; KA-P toward Nik vs Daniel barely differs | CP2 note | NONE | Claude (CP2 brief) | High | |
| CP1-N2 | Accept SOL-CP1-E2: the Git SHA is the fingerprint; drop the combined hash from future briefs | Process | NONE | Sol | High | |
| CP1-N3 | CP1-A-UPSCALE fallback accepted; no further upscaler install attempts | Process | NONE | — | High | |
| CP1-N4 | Mobile rail clips "SIGNING E…" and 04 needs a sideways scroll; acceptable for CP1, revisit in the HUD kit | Later | NONE | Claude | Medium | |
| CP1-P1 | Routing revision: Sonnet 5 removed; Opus 5.5 at Medium/High/Extra high; stop budgets | Policy | NONE | Sol commits | High | |

## 3. MUST FIX

### CP1-M1 — Guess panel below the fold, and clipped rather than scrollable (SOL-CP1-E1)
- **Observation:** at 1366×768 the F2/F3 panel runs from 330 to 800.67 px. At 768 the controls and copy happen to be visible: the LOCK bottom is ≈ 738 and the privacy note's last line ≈ 752. But the panel's bottom padding, bottom frame and the reserved `#transferChallengeError` line fall below the fold. The frame looks cut off, and any error text would be invisible. `.scene-stage { height:100vh; overflow:hidden }` and `#stage-root { overflow:hidden }` make that area **unreachable**, not just scrolled away. At 1366×640 (`F2_1366x640_dpr1_spotcheck.png`), slot 3, the privacy note and `LOCK MY GUESSES` are cut off with no way to reach them. A real 1366×768 laptop has a browser inner height of about 620–660 px, so this is the everyday case.
- **Verdict:** a real CP1 failure against B3-2 and against B5 (zoom reflow requires page scroll to work).
- **Delta (exact):**
  1. Compress the panel with spacing only. No font size, control height (select/input 44 px), button height (54 px) or copy changes:
     `.guess-viewer-panel` padding `16px 20px 18px` → `14px 20px 14px`; `.guess-viewer-panel .phase-intro` margin-top `8px` → `6px`; `.guess-heading` margin `10px 0 2px` → `6px 0 2px`; `.guess-viewer-panel .rule-note` margin-bottom `12px` → `8px`; `.scouting-slot` height `58px` → `52px`; `.scouting-slots` gap `8px` → `6px`, margin-bottom `14px` → `10px`; panel `top` `330px` → `324px` (both sides; nameplates follow at top − 34). Expected height ≈ 429 px (estimate) and bottom ≈ 753.
     **Gate:** panel bottom ≤ 756 at 1366×768. If it is still above 756, lower `top` toward a floor of 318 px. Nothing else.
  2. Never clip: desktop frames get `.scene-stage { height: max(100vh, 768px) }` (min 768), and vertical `overflow:hidden` is removed from `html`, `body`, `#stage-root` and `.scene-stage`; keep `overflow-x:hidden`. All scene-fit math reads the stage box, not `window.innerHeight`. Result: no scroll at ≥ 768 tall; below that the page scrolls and nothing is cut off.
  3. QA assertions in `tools/render-and-qa.cjs` (hard fail):
     - (a) F2 and F3 at 1366×768: every descendant of `.guess-viewer-panel` has `bottom ≤ 756`, and `scrollHeight ≤ 768`.
     - (b) F2 at 1366×640: after `scrollIntoView()` on `#completeTransferChallenge`, `elementFromPoint` at the button's centre returns the button.
     - (c) F2 at 1366×768: inject the QA-only text `QA ERROR LINE` into `#transferChallengeError` at runtime (never in fixtures or captures). It must be reachable by the same `elementFromPoint` test.
- **Product-truth impact:** LOW (layout only; strings, IDs and order unchanged).
- **Resolver:** Cloud · **Confidence:** High

### CP1-M2 — Mobile controls are ≈ 22 px tall, not 48 px
- **Observation:** in `F5_390x844_dpr2.png` the selects measure ≈ 46 device px (≈ 23 CSS px) and the value inputs ≈ 42 device px (≈ 21 CSS px). The 16 px text is cramped and its descenders are clipped. `CLOUD_BUILD_RESULT.md` claims 48 px; that claim was not measured.
- **Cause:** `.slot-fields select, .slot-fields input { flex: 1 }` (flex-basis 0%) overrides `height: 48px` once `.mobile-layout .slot-fields` switches to `flex-direction: column`.
- **Delta:** `.mobile-layout .slot-fields select, .mobile-layout .slot-fields input { flex: 0 0 auto; height: 48px; min-height: 48px; }`. Assertion: each select/input measures ≥ 48 CSS px tall at 390×844 and 360×780, and ≥ 44 on desktop.
- **Impact:** NONE · **Resolver:** Cloud · **Confidence:** High

### CP1-M3 — 360×780 top-bar collision (CP1-K2 upgraded)
- **Observation:** in `F5_360x780_dpr1_spotcheck.png` the `REFRESH SHARED CHALLENGE` chip wraps and sits on top of the rail's `01 ✓ TRANSFER WINDOW` text, because `.mobile-layout .top-bar { height:48px }` is fixed while `flex-wrap: wrap` is on. 360 px is a common Android width, so fix it now.
- **Delta:** `.mobile-layout .top-bar { height:auto; min-height:48px; padding:4px 12px; column-gap:8px; row-gap:6px; }`, and at `max-width:380px`: `.mobile-layout .ghost-chip { padding:6px 10px; letter-spacing:.02em; font-size:12px; }` (12 px is inside the brief's 12–13 px range). Strings stay verbatim. Target: both chips on one row at 360. If they still wrap, the bar grows and nothing overlaps. Assertion: no bounding-box intersection among the top-bar chips, the title and the rail items at 360×780 and 390×844.
- **Impact:** NONE · **Resolver:** Cloud · **Confidence:** High

### CP1-M4 — `WINDOW CLOSED` drawn in front of both managers' heads (F2/F3)
- **Observation:** in F2 at 1366×768 the text spans x ≈ 473–863, y ≈ 58–108 (estimate). Daniel's hair reaches x ≈ 530 in that band and Nik's hair starts at x ≈ 845, and the text is painted over both. F3 is the same (x ≈ 485–876). The sign physically hangs behind the managers, so the depth reads wrong. Root cause: my brief put the sign-face text in L5, above the poses. That's the producer's error, not Cloud's.
- **Delta:**
  1. Move the sign-face text element into the camera container between L1 (cues) and L2 (poses), so the poses occlude it. Keep the id `transferTimerDisplay`. F1 keeps `role="timer"` and `aria-live="off"`. F2/F3 keep no digits.
  2. F2/F3 only: fit `WINDOW CLOSED` to ≤ 80% of the measured sign-face width, **and** keep its text box ≥ 12 px clear of both hair silhouettes at 1366×768. Measure the font size; don't guess it (estimate ≈ 44–48 px, down from ≈ 62). Keep the 70% dim.
  3. F1: the clock is unchanged; assert ≥ 8 px from both heads. F4 mobile clock plate: unchanged.
- **Impact:** NONE (a presentation label) · **Resolver:** Cloud · **Confidence:** High

## 4. SHOULD REFINE (in the same revision, after M1–M4)

### CP1-D1 / CP1-R1 — K1 hair rim
- **Decision:** Window poses (files 4 and 5, F1/F4): **accept** the warm rim. Against the lifted, warm-lit glass under CUE-WINDOW it reads as motivated backlight. Guess poses (files 2 and 3, F2/F3/F5): against the glass darkened by CUE-PRIVATE, the rim reads as a sticker outline, most visibly on Nik's crown at DPR 2. Halo ratios after intake: 2.99 and 2.66, the highest of the four.
- **Delta (one pass, fixed parameters, no tuning loop):** on the derived `_INTAKE` copies of files 2 and 3 only (originals untouched), in the hair band only (rows from the POSEMAP `crown_y` down to `min(eye y) − 20 px`), for pixels 0–8 px inside the alpha edge:
  - multiply L\* by 0.80 at the edge, rising linearly to 1.00 at 8 px;
  - reduce the b\* excess over the local interior mean by 60%.
  Re-export WebP/AVIF, update the manifest, and report halo ratios before and after. Evidence E3-R: files 2 and 3, at 2× on #3C3C3C and on the plate under CUE-PRIVATE. If the result looks dull, the producer reverts to the current intake at review. **No second pass in Cloud.**

### CP1-D2 / CP1-R2 — Nik skin: DENOISE CANDIDATE
- **Evidence:** at 2× the 1:1 source crops show a crackled, reptile-like texture artifact across the forehead and cheeks in the plain intake. The candidate (h=3, hColor=3, 7/21, 60% blend, feathered mask) removes most of it while eyes, brows, nose shape, beard and hair stay identical. The difference is invisible at DPR 1 and visible at DPR 2. Likeness is unchanged.
- **Delta:** export WebP/AVIF from `POSE_TR2_NIK_WINDOW_POINT_V1_DENOISE_CANDIDATE.png` with the Q7 settings, point F1/F4 at it, and give it the shipping role in the manifest. Keep the non-denoised intake in `derived/` for provenance.

### CP1-D3 — F2 stylus hand (B3-3 bend, accepted)
- **Observation:** in F2, Nik's stylus hand (x ≈ 880–1005, y ≈ 318–392; stylus tip ≈ (1000, 382)) and his whole tablet sit under his own panel (top 330). F3 shows the same pose unobstructed. CLOUD_BUILD_RESULT's CP1-K3 statement that the protected contacts held is inaccurate for F2.
- **Decision:** no build change. By feel, F2 reads correctly: Nik looks down into his own private panel. Clearing the hand would need a panel top ≥ 404, and the panel can't fit below that.
- **Rule amendment (Sol to commit into the Transfer package):** "B3-3: the viewer's own panel may cover the viewer's own hands and props. The viewer's face may never be covered, and the **rival's** protected contacts must stay visible (≥ 12 px)." F2 and F3 both pass the amended rule (Daniel's pen-to-chin hand is clear in F2; Nik's stylus hand is clear in F3).

### CP1-R3 — Rail legibility (desktop, all frames)
- **Observation:** in F1 the upcoming steps (opacity .55) sit over bright glass and pillar light, and `04 VERDICTS` is crossed by a light streak. Rail contrast was never measured.
- **Delta:** an L4 left-column scrim behind the lockup and rail: x 0–300, y 56–280, black 55%, feathered 32 px (the same scrim system as the panels). Measure contrast with the brightest-pixel method: active/done ≥ 4.5, upcoming ≥ 3.0. Raise the upcoming opacity from .55 toward .70 only if needed to pass.

### CP1-R4 — F1 mottos
- **Observation:** `Skill. Vision. Magic.` and `Tactics. Discipline. Progress.` sit over the bright table lines, and the gold field line crosses "Discipline".
- **Delta:** a backing strip continuous with each nameplate: nameplate width, black 70%, feathered 12 px; motto colour brass at 90%. They stay decorative (`aria-hidden`).

### CP1-R5 — Sealed Dossier object read (privacy: PASS)
- **Observation:** exactly 3 identical blank plates and no rival data: privacy staging is correct. But in `E8_F2_blur8px` the dossier nearly vanishes. The lock and CM17 seal are small and dim, so it reads as an empty UI card rather than a sealed object on the table. It also shows an inner label `DANIEL · SEALED` / `NIK · SEALED`, while the brief says "no text other than its nameplate".
- **Delta (fixed values):**
  - frame: 2 px brushed brass (linear gradient `#8A6A2E → #C99B45 → #8A6A2E`) at 100%;
  - lock glyph: 28 px, brass at 95%;
  - seal emblem: 56 px, brass fill at 85% with a darker emboss stroke;
  - slot plates: identical size, 1 px brass outline at 45%, fill `rgba(255,255,255,.04)`;
  - contact shadow: `0 18px 24px -8px rgba(0,0,0,.7)` plus a 6 px-tall soft ellipse at the base on the table;
  - remove the inner `… · SEALED` text on desktop. The nameplate's `SEALED` chip stays, and the mobile F5 bar `DANIEL · SEALED` stays as specified.

## 5. Already strong (keep)
- F1 composition and hierarchy: clock centred on the sign face; Daniel's sheet and open palm, and Nik's index finger and tablet top edge, all well clear of the panel; nameplates flank the panel.
- F3 privacy gaze: E7 shows Nik's eyeline landing at ≈ (669, 384), right of Daniel's panel edge at 606. Pass.
- Product truth: all ten Appendix C items per Sol's check; no rival DOM; exact strings.
- F2 squint hierarchy: `LOCK MY GUESSES` is the strongest gold block (mean luminance 182 vs tactics-surface mean 62 at DPR 1); faces read first.
- Mobile F4 recomposition: clock between the heads, heads ≥ 64 px, panel full width. F5 order: strip, then the sealed bar, then the panel, with LOCK in flow and the page ending 33 px after it.
- Layer DOM structure is ready for CP2. Page weight: 0.999 MB desktop / 0.964 MB mobile.

## 6. Asset fit and blockers
NONE blocking. Asset notes: file 5 ships the denoise candidate (R2); files 2 and 3 get the R1 hair pass on derived copies only; plate upscale fallback accepted (CP1-A-UPSCALE).

## 7. Conflicts found
- My CP1 brief conflicted with itself in two places: (a) the F2 panel target zone (top ≈ 330) against B3-3 for file 3, now resolved by the CP1-D3 amendment; (b) the layer stack put sign-face text in L5, above the poses, now resolved by CP1-M4. No product-truth conflicts.

## 8. Questions for Astra
NONE

## 9. Questions for Nik
- CP1-N5: approve the Cloud revise run on **Opus 5.5 · Medium**, with a stop budget of **30 min / $6**? (Sonnet 5 is removed per your instruction; see P1.)

## 10. Evidence appendix
- F2/F3 panel rect: `{x:782|46, y:330, w:560, h:470.671875, bottom:800.671875}` (`render_qa_report.json.measurements`).
- E7: `eye (928.9,184.2) → gaze (668.9,384.2)`, `panelRight 606`.
- F2/F3 `poseLeftRect` and `poseRightRect` are identical to within 0.01 px, and the plate shifts ≈ 12 px between them. That shift is `transform-origin` focus × (1 − 1.1) × 1366 ≈ 12 px (CP1-N1).
- CSS cited: `styles.css` lines 105–110 (`.scene-stage`), 81–86 (`#stage-root`), 188/225 (mobile top bar), 447–458 and 500–501 (slot fields), 389–396 (panel).
- F2 luminance at DPR 1: LOCK button region [690:735, 1085:1318] mean 181.9; tactics surface [560:760, 420:780] mean 62.4, p99 217.
- Screen coordinates marked "≈" were read from the committed captures by crop inspection (±5 px).

## 11. Recommended Sol next actions
1. Commit this handoff and `CP1R_CLOUD_REVISE_BRIEF_TR2_SLICE01.md` to `visual/cinematic-system-v10` under `visual-assets/v10_1/claude/handoffs/` and `visual-assets/v10_1/tr2/`.
2. Product-truth-check the revise brief and sign it in its header.
3. Commit `STUDIO_WORKFLOW_AND_ROUTING_V3.md` (supersedes V2's routing tables) and update `V10_STATE.md`: Sonnet 5 removed; CP1 = REVISE.
4. Commit the CP1-D3 B3-3 rule amendment into the Transfer package delta.
5. Carry CP1-N1 (world-anchored poses) into the CP2 Stage Engine prerequisites.
6. After Nik approves CP1-N5, hand the revise brief to Cloud on Opus 5.5 · Medium, then run the branch-safety and product-truth check on the result.

## 12. What to send back to Claude for the next task
A new Claude Project chat (Opus 5.5 · High): `claude-cloud/transfer-tr2-slice-01 @ <revise head SHA>`, `CP1R` `CLOUD_BUILD_RESULT.md`, and Sol's check. The review is verify-only: M1–M4 gates, the R1 before/after, the R2 swap and the R3–R5 captures.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION