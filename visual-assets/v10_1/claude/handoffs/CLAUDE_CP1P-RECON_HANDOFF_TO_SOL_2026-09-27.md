# CLAUDE -> SOL HANDOFF - CP1P-RECON
Premium north-star reconciliation of the frozen CP1 candidate; the CP1R brief is replaced by CP1P (final)

## Header

| Field | Value |
| --- | --- |
| Task ID | CP1P-RECON (owner visual-calibration interrupt, routing V3.2 §5b) |
| Claude model | Opus 5.5 (Claude Project chat) |
| Role | Lead Visual Producer: visual reconciliation and replacement brief |
| Date | 2026-09-27 |
| Source anchor | `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`, re-resolved live. SOURCE_DRIFT: **no** |
| Candidate | `claude-cloud/transfer-tr2-slice-01 @ 646e227aa71cd5d712c791e6436ece103a2e2dfd` (tip re-resolved: identical) |
| Visual branch | `visual/cinematic-system-v10 @ 0fdb7333a36b75232e056d152a6d4cd0f4db8da4` (contains the north star, the CP1R pause and V10_NEXT routing) |
| Write operations | none to the repo, images or implementation. Producer-only CSS mock rendered locally (below). |
| Verdict status | **REPLACE CP1R WITH CP1P** (pending Sol product-truth sign-off) |

Files reviewed:
- `coordination/OWNER_VISUAL_NORTH_STAR_PREMIUM_TRANSFER_V1.md`
- `claude/handoffs/CLAUDE_CP1-REVIEW_HANDOFF_TO_SOL_2026-09-27.md`
- `tr2/CP1R_CLOUD_REVISE_BRIEF_TR2_SLICE01.md`
- `tr2/CP1_CLOUD_BUILD_BRIEF_TR2_SLICE01.md`
- `tr2/CP1R_TRANSFER_PACKAGE_DELTA.md`
- `coordination/SOL_RECONCILIATION_CP1R_PRECLOUD_2026-09-27.md`
- `coordination/STUDIO_WORKFLOW_AND_ROUTING_V3.md`
- `coordination/SOLWORK_CP1R_GATE_PRECHECK_TASK_CARD.md`
- `V10_STATE.md`, `V10_NEXT.md`
- On `646e227`: `styles.css`, `frames.js`, `fixtures.json`, `ENV_TR2_WARROOM_PLATEMAP_V1.json`, `render_qa_report.json`
- Captures on `646e227`: F1/F2/F3 at 1366×768 DPR 1; F4 and F5 at 390×844; E8 F2 blur; S2 at 1366×768
- Owner reference image (1536×864); used as the north star only, not as an asset

Producer mock: I re-rendered CP1 F1/F2/F3 locally at 1366×768 with injected CSS and DOM that implement the CP1P grammar. It is **not a candidate**. It proves that the brief's values fit the geometry and read as intended. `CP1P_PRODUCER_MOCK_COMPARISON.jpg` pairs CP1 (left) with the mock (right), plus the F2 8 px blur.

## 1. Verdict

**REPLACE CP1R WITH CP1P.** CP1R's mechanical findings are all still valid, but its visual refinements (R4 motto strip, R5 dossier polish) would polish the box language the owner has rejected. CP1P keeps every mechanical fix verbatim and swaps the surface grammar: smoked glass that stands on the desk, recessed wells, desk plaques and a sealed folio object. Product behaviour is unchanged.

Honest ceiling: a CSS and SVG pass closes the grammar gap (boxes, grounding, material and the sealed metaphor). The reference's physical density comes partly from painted assets and from managers touching the surfaces, and CP1P cannot close that part (see gap G6 and questions CP1P-N1/N2).

## 2. Sol decision table

| ID | Finding | Severity | Product-truth risk | Resolver | Confidence | Sol decision |
| --- | --- | --- | --- | --- | --- | --- |
| CP1P-G1…G9 | Gap analysis, CP1 vs north star (§3) | Direction | NONE | Claude | High | |
| CP1P-K1 | Keep unchanged: CP1R M1.2, M1.3, M2, M3, M4, R1, R2, R3; decisions D1–D3; notes N1–N4 | Keep | NONE | Cloud | High | |
| CP1P-K2 | CP1R M1.1 spacing values are reused inside the new workstation; its gate is unchanged | Modify | NONE | Cloud | High | |
| CP1P-X1…X8 | Treatments to **replace** rather than polish (§4) | MUST | LOW (presentation only) | Cloud | High | |
| CP1P-M5 | **New mechanical fail missed at CP1 review:** mobile ghost chips measure 40 px tall against the 48 px mobile target (B5) | MUST | NONE | Cloud | High | |
| CP1P-PT1 | Padlock glyph on the rival's dossier and on the mobile bar could imply the rival's **lock state**. Replace it with a wax seal only; keep `SEALED` | MUST | **MEDIUM** (implied state) | Sol | High | |
| CP1P-PT2 | F5: remove the separate `DANIEL · SEALED` bar row and move the tag into the scene strip (changes CP1 B6 order; presentation only) | Decision | LOW | Sol | High | |
| CP1P-PT3 | The rival folio shows 3 constant tabs, fixed by the rules (3 opponent guesses), never by state; enforced by a markup-equality assertion | Decision | LOW | Sol | High | |
| CP1P-PT4 | The viewer's nameplate becomes a tab on his own pane; the rival's becomes a desk plaque in front of the folio. Tags `YOU`, `SEALED` and `PRIVATE` are unchanged | Decision | NONE | Sol | High | |
| CP1P-G | Anti-box and privacy acceptance gates AB1–AB4 and PV1–PV4 (§5) | Gate | NONE | Sol Work (SW1) | High | |
| CP1P-R | Routing: Part A Opus 5.5 · Medium, 15 min / $3; Part B Opus 5.5 · High, 45 min / $10 (§6) | Routing | NONE | Nik confirms | High | |
| CP1P-N1 | If the CSS folio or workstation reads flat at review, approve one image ticket per object (a prop with no text and no data)? | Taste | NONE | Nik | Medium | |
| CP1P-N2 | Rule exception: allow **vertical** table reflections of poses (not left-right mirroring) in CP2? | Rule | NONE | Nik | Medium | |

## 3. Visual gaps: frozen CP1 vs owner north star (CP1P-G*)

- **G1 · Box grammar.** Most surfaces are complete brass-outlined rectangles with the same radius and weight. Measured on `646e227` at runtime, the counts of elements with a ≥ 1 px border on all four sides are: F1 6, **F2 21, F3 21**, F4 4, F5 14. They include the panel, 3 numeral squares, 3 selects, 3 inputs, the PRIVATE pill, 2 nameplates, the SEALED pill, the dossier, its lock ring, 3 dossier slots and 2 top chips. The reference defines surfaces by light, material edges, seams and partial frames.
- **G2 · Floating, ungrounded surfaces.** The Guess panel (x 782–1342, y 330–801) hangs over Nik's chest and stops mid-table. It has no base, no contact light and no relationship to the desk. The dossier is a frosted rectangle standing in air. In the reference, every screen stands on or rises from the desk, with base glow and occlusion.
- **G3 · Rival state is a blank card.** A dim frame holds three empty input-shaped rectangles. It reads like a disabled form, and it nearly vanishes in the 8 px blur (E8). Its padlock also implies a lock state (PT1).
- **G4 · Uniform opacity, no glass physics.** CP1 uses one tint (`rgba(10,12,16,.74)`) everywhere, with no transparency gradient, no specular reflection and no dissolving edges. It reads as dark boxes, not smoked glass.
- **G5 · Symmetric, centred F1.** The brief box sits dead centre like a modal. The reference is asymmetric: each manager owns a surface zone, and the centre is the shared table. (F1's centring is defensible because the Window is shared, so CP1P grounds it rather than moving it.)
- **G6 · Weak manager–task–light relationship.** The poses are pasted: no cast shadow or contact on the table, and no light exchange with the surfaces. In the reference, hands touch the screens and faces are lit by the displays. Part of this is **asset-bound**: the Guess poses show pen-to-chin and stylus-on-tablet, not touching a desk screen. CP2's world-anchoring (N1) and possible new poses are the real fix. CP1P adds forward cast shadows and light pools only.
- **G7 · No premium micro-detail.** There are no seams, dividers, ticks, bevels or engraving. Hierarchy comes from boxes, not light.
- **G8 · Mobile is a stack of bordered boxes** (chips, then bar, then panel) under the strip, with no material continuity between the scene and the task.
- **G9 · Labels float as boxes.** The nameplates hang above the panels as separate outlined boxes.

Already aligned with the reference (keep): the gold, graphite and black grade; the war-room plate with the stadium; the managers flanking a shared table; the hanging clock sign; the brush lockup; the gold LOCK bar as the hierarchy anchor; the rail.

**Do not copy from the reference:** it shows both managers' target lists side by side, with names and fees. Showdown must never do that in Guess Entry. The sealed folio is our translation.

## 4. What stays, what changes, what gets replaced

### 4a. Remains valid unchanged (CP1P-K1)
- CP1R **M1.2** (never clip; stage scrolls below 768).
- CP1R **M1.3** assertions (a), (b) and (c).
- CP1R **M2** (48 px mobile controls).
- CP1R **M3** (360 px top bar).
- CP1R **M4** (sign text behind the poses; 12 px hair clearance; F1 clock ≥ 8 px from heads).
- CP1R **R2** (Nik denoise ships) and **R1** (one-pass Guess-pose hair rim). Both move to Part A.
- CP1R **R3** (rail scrim and contrast).
- Decisions **D1–D3**, including the B3-3 amendment, and notes **N1–N4**.
- All CP1 Appendix C/D product truth, strings, IDs, font sizes, control heights, tab order, camera, poses and cues.

### 4b. Modified (CP1P-K2)
CP1R **M1.1**: its spacing values are reused, but they are applied to the new stripped panel (content left 790 / 24, width 552, top 324). The gate stays: every descendant ≤ 756. Mock measurement: bottom **742.7**.

### 4c. Replace, don't polish (CP1P-X*)

| ID | CP1 treatment | Replaced by |
| --- | --- | --- |
| X1 | `.glass-panel` Guess panel: 4-sided border, 2 px rails, chamfer, uniform tint | Scouting workstation: glass rising to the frame bottom, lit top seam, graphite post on the outer side, inner edge dissolved by mask, specular band, light pool on the table (P1) |
| X2 | Bordered select/input boxes and bordered numeral squares | Recessed wells with one lit bottom rule; engraved numerals with a brass tick; hairline row dividers (P1) |
| X3 | Sealed Dossier card with 3 empty rectangles and a padlock; also supersedes CP1R **R5** | Closed graphite folio lying on the table in perspective, with brass band, CM17 wax seal, 3 identical blank tabs, contact shadow, and a desk plaque in front (P2) |
| X4 | Outlined `.nameplate` boxes; also supersedes CP1R **R4** | Bevelled desk plaques with engraved brass type. F1 mottos sit on the plaque. The viewer's plaque is a tab on his pane (P3) |
| X5 | F1 Window brief box | Table console in the same grammar: centre-weighted seam, both edges dissolve, rises from the foreground (P4) |
| X6 | Mobile bordered bar, then bordered panel | Strip fades into a full-bleed console; sealed tag inside the strip; no bordered rows (P5) |
| X7 | PRIVATE and SEALED pill chips | Engraved tags with a leading brass rule (YOU keeps its gold fill as the identity cue) |
| X8 | Outlined ghost chips; the bordered `REQUEST EARLY END` | Borderless chips with a brass underline; a raised graphite key with a brass top edge |

## 5. Acceptance gates against a generic-box regression (CP1P-G)

Automated (hard fail in `render_qa_report.json`):
- **AB1 (the anti-box gate):** zero rendered elements in F1–F5 have a ≥ 1 px border on all four sides at alpha ≥ .25. The CP1 baseline is 6 / 21 / 21 / 4 / 14. Any future revision that brings one back fails.
- **AB2:** the task glass is masked (at least one dissolving edge) and has no border.
- **AB3:** LOCK is the brightest UI region in F2/F3, so hierarchy comes from light, not frames.
- **PV1–PV4:**
  - no rival guess IDs in the DOM;
  - the folio carries no text apart from the SVG `CM17`, with exactly 3 identical tabs;
  - the folio markup is identical between F2 and F3, which proves it is state-independent;
  - no padlock glyph on rival elements;
  - tab order unchanged; zero console errors.

Measured and judged at producer review (Claude, Opus 5.5 · High). These are the owner's seven north-star questions:
- **AB4:** in the 8 px blur, the reading order is faces, then LOCK, then the folio band, then the environment. There is no grid of rectangles, and the folio's band-to-body luminance ratio is ≥ 1.5.
- Every world object shows a grounding cue: it bleeds off frame, casts a shadow, or pools light on the table.
- No two task surfaces share an identical frame signature (the workstation, console, plaque and folio are each a different material).

My answers to the owner's seven north-star questions for this brief, judged on the mock:
1. Premium football world before the copy is read: **yes**. The mock reads as a room with objects.
2. Managers and task physically related: **partially**. Grounding is there; hand-to-surface contact is asset-bound (G6).
3. Box repetition materially reduced: **yes**. AB1 target is 0 (from 21).
4. Live task obvious and accessible: **yes**. Fonts, heights, IDs and tab order are fixed; the contrast gates stay.
5. Premium sealed-rival metaphor with no invented data: **yes**. The folio is constant, and markup equality is asserted.
6. Works with local opacity raised: **yes**. The material read comes from the seam, post, dissolve and base, not the tint. The scrim escalation path is per text block.
7. The 8 px blur shows faces, task and environment: **yes** on the mock (comparison sheet, bottom row).

## 6. Routing and budgets (CP1P-R)

| Step | Surface | Model · effort | Budget |
| --- | --- | --- | --- |
| Part A: asset pass (R2, R1) | Cloud | Opus 5.5 · **Medium** | **15 min / $3** |
| Part B: presentation build (B0, M2–M5, P1–P6, R3) | Cloud, new session from Part A's head | Opus 5.5 · **High** (the builder must fit the perspective and the contrast escalations; routing V3 §2 "static checkpoint build") | **45 min / $10** |

The split follows routing V3 §4 (one kind of work per session). Combined, that is 60 min / $13. CP1R was scoped at 30 min / $6, but it would have produced a direction the owner has rejected. The CP1 baseline was ≈ 50 min / $15.

## 7. Asset fit and blockers
Blockers: NONE. No new images are required for CP1P, since everything is CSS and inline SVG. Forbidden baked content is unchanged. Possible later image tickets (N1): a sealed-folio prop and a desk-console hardware base, both without text or data, gated per `LIKENESS_IMAGE_WORKFLOW_V1` if they include faces (they won't).

## 8. Conflicts found
- **North star vs CP1 brief B4-11** ("brass lock at top centre" on the dossier): the lock conflicts with the owner's "no lock state" rule, so PT1 removes it. The CP1 brief is historical; flagged rather than silently changed.
- **North star vs CP1 brief B6** (F5 order strip → rival bar → panel): superseded by PT2 if Sol signs.
- **"Never mirror or flip any image" vs premium table reflections:** CP1P adds no reflections (see N2).
- **CP1 brief B5 mobile targets (≥ 48) vs CP1 build (chips 40):** fixed by M5. My CP1 review missed this.
- **Routing §5a (Medium verify after an all-PASS SW1) vs this checkpoint:** the CP1P review is a taste review of a new direction, so it runs at High. Flagged for Sol.

## 9. Questions for Astra
NONE

## 10. Questions for Nik
- **CP1P-N0:** approve Part A (Opus 5.5 · Medium, 15 min / $3) and Part B (Opus 5.5 · High, 45 min / $10)?
- **CP1P-N1:** if the CSS/SVG folio or workstation reads flat at review, may I write image tickets for those props?
- **CP1P-N2:** may CP2 use vertical table reflections of the poses (never left-right)?

## 11. Evidence appendix
- AB1 baseline was measured at runtime on `646e227` with Playwright (preinstalled Chromium) by walking all elements and testing four-side border width ≥ 1 and alpha. Counts: F1 6, F2 21, F3 21, F4 4, F5 14. The same run measured mobile ghost chips at **40 px** tall (F4/F5), and F5 select/input at 23 / 21 px (confirming CP1R M2).
- Mock measurements, 1366×768, KA-P:
  - panel descendants' max bottom **742.67** (F2 and F3);
  - folio bbox F2 `x 79.0–378.3, y 555.5–676.8`; F3 `x 987.7–1287.0, y 555.5–676.8`, with `perspective(900px) rotateX(50deg) rotateZ(∓4deg)`, 300×200;
  - F3 glass right edge 606, against an E7 gaze point of x 668.9.
- Plate map: horizon v 0.531; table far-edge polyline v 0.666–0.693; standing columns u 0.221–0.419 (Daniel) and 0.586–0.783 (Nik).
- CSS cited on `646e227`: `.glass-panel` lines 293–313; `.guess-viewer-panel` 389–396; slot fields 447–461; `.sealed-dossier` 588–632; `.mobile-layout .ghost-chip { min-height:40px }` line 208; `.nameplate` 539–562.

## 12. Recommended Sol next actions
1. Product-truth check `CP1P_CLOUD_REVISE_BRIEF_TR2_SLICE01.md`; decide PT1–PT4; sign the header.
2. Commit to `visual/cinematic-system-v10`:
   - the brief to `visual-assets/v10_1/tr2/`;
   - this handoff to `visual-assets/v10_1/claude/handoffs/`;
   - `SOLWORK_CP1P_GATE_PRECHECK_TASK_CARD.md` to `coordination/`;
   - the mock sheet to `visual-assets/v10_1/claude/handoffs/assets/` (optional).
3. Mark the CP1R brief and the CP1R SW1 card `SUPERSEDED BY CP1P` (keep the files). Update `V10_STATE.md` and `V10_NEXT.md`.
4. Record CP1P-M5 in the package delta. Record AB1 as a standing Tier S gate for every Transfer screen.
5. After Nik confirms N0: hand Part A to Cloud, then Part B in a fresh session. Then run branch safety and product truth, then SW1 in Sol Work.

## 13. What to send back to Claude for the next task
A new Claude Project chat (Opus 5.5 · High) with:
- `claude-cloud/transfer-tr2-slice-01 @ <Part B head SHA>`;
- both `CLOUD_BUILD_RESULT_CP1P_*.md` files;
- Sol's check and the SW1 CP1P pre-check report.

The review covers the north-star questions, AB4, the folio and workstation read, the mobile recomposition, the R1 hair and the R2 skin.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION
