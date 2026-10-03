# Foundation review · JOB-018

Verdict: **PASS after one-line repair**

Foundation score: **22 / 25 = 4.4 / 5.0**

Hard gates checked by this job: **H6 PASS · H7 PASS · H8 PASS**

The shared foundation is ready for screen builds. It carries the intended Showdown language — black stadium depth, controlled gold, brush titles, cut-corner glass, semantic controls, registered character overlap and short pack-rip choreography — without depending on forbidden real club/league/player/trophy art.

## Repair made during this review

The first 400% stage check found a real compositor defect: the cropped League finger overlay has an artificial straight closure at its left crop boundary, and the demo panel at `left: 28.5vw` began underneath that closure. The closure therefore became visible as a straight seam across opaque UI even though camera registration itself was correct.

JOB-018 changed one value in `visual-assets/v10_1/shared/stage-demo.html`:

- **Selector:** `.demo-panel`
- **Value:** `left: 28.5vw` → `left: 31.5vw`

The re-render keeps the panel under Daniel's hand/finger and keeps the contact shadow on the panel, but moves the artificial closure back over the same registered plate. The phone layout is unchanged because its portrait media rule already resets `left:auto`.

## Evidence reviewed

- `specimen.html`: branch desktop/393×660 evidence plus `evidence/verification.json`.
- `kit.html`: fresh 1366×768 and 393×660 review renders, shared component CSS, and independent comparisons against `MOCKUP_CAREER_STATISTICS.png`, `MOCKUP_RIVALRY_STATISTICS.png` and `MOCKUP_SEASON_RESULTS.jpeg`.
- `stage-demo.html`: fresh desktop/phone renders before and after the repair, 400% contact crops, stage source, JOB-015 registration measurements, and `evidence/cutout_test.png`.
- `motion-demo.html`: fresh desktop/phone layout renders, standard/reduced strips, motion source, and JOB-016 timing/frame evidence.

Fresh local review renders used the project goal plates only as render-time surrogates where branch binary assets could not be materialized into the sandbox. The visual decisions above were cross-checked against the branch-native evidence and source; no surrogate asset was committed.

## QUALITY_BAR scores

| Criterion | Score | Evidence |
| --- | ---: | --- |
| **4. Lighting and grade** | **4 / 5** | Shared tokens and specimen/kit renders keep black depths, warm stadium bokeh and the approved gold family. Panels use soft glass gradients, restrained warm top/edge light and black falloff rather than flat grey boxes. Stage atmosphere adds vignette/flare/contact light without baking gold into character pixels. |
| **5. Typography and title treatment** | **5 / 5** | The specimen uses approved transparent brush wordmark images with visually-hidden real text, plus the eyebrow/tagline hierarchy. UI uses Barlow / Barlow Condensed, uppercase letter-spaced labels and tabular figures. The branch specimen visually reads as the same brush-title system as the mockups rather than a block-font substitute. |
| **6. Panel craft** | **4 / 5** | Career, rivalry and season-result comparisons preserve the reusable mockup grammar: thin gold perimeter lines, dark glass, corner cuts, aligned columns/rows, dominant numbers and one solid-gold primary action. The shared demo glyphs are intentionally simpler than final illustrated screen objects, which remain screen-job assets. |
| **8. Motion and feel** | **5 / 5** | Standard evidence shows scene settle → manager entry → title wipe/glint → staggered panels → count/reward reveal. The primary action is usable by 0.6 s, cleanup finishes by 1.2 s, panel stagger is 60 ms, and the warmed JOB-016 trace reported 16.8 ms worst frame spacing with zero samples above 25 ms. Reduced mode is a short fade only. |
| **10. Polish and finish** | **4 / 5** | The repaired stage overlap is clean at the UI contact, phone/desktop review renders fit without page scroll, specimen verification reports no errors/overflow, and the kit uses consistent tokens/focus treatment throughout. One small demo-only 404 remains: `motion-demo.html` has no data favicon declaration. |

## Hard gates

### H6 · PASS — Inputs ≥ 16 px; body contrast ≥ 4.5:1

- `showdown-ui.css` sets `.sd-input, .sd-select` to **16 px** body text; the phone specimen preserves that size.
- `verification.json` measures conservative worst-case contrast through the 78% shared glass at **9.09:1** for primary body text and **4.91:1** for secondary body text.
- Fresh phone review confirmed the Season Entry input/select remain readable and unclipped.

### H7 · PASS — Reduced motion respected

- Shared tokens collapse scene, character, title, panel, number and entrance timing to **150 ms** with zero stagger.
- `motion.css` replaces choreography with `sd-reduced-fade` under both OS and product reduced-motion paths and disables title/glint/reveal flash effects.
- `stage.css` removes the animated atmosphere under reduced motion.
- The committed reduced strip is fully settled after the short fade rather than replaying the pack-rip transforms.

### H8 · PASS — Keyboard reachability and visible focus

- `showdown-ui.css` gives buttons, icon buttons, chips, tabs, inputs, selects, toggles and checks a visible **2 px gold** `:focus-visible` treatment with a black separation ring.
- Fresh Tab traversal reached **30 visible desktop controls** and **10 visible phone controls** in the kit. Native checkbox/toggle inputs transfer focus indication to their visible proxy boxes/tracks.
- The confirm primitive traps Tab inside the modal, supports Escape and restores focus to its opener.

## 400% cut-out check

**PASS after the repair.** Registration is accurate; JOB-015 measured a worst error of **0.0417 device px** across its tested viewports. The shared `cutout_test.png` shows no added bright/dark matte ring or colour speckling over black, neutral-light and warm-glass backgrounds. The stage demo's cropped legacy overlay still has an artificial closure by construction, but after the `31.5vw` panel shift that closure no longer crosses opaque UI.

## Mockup comparison

The shared kit is intentionally a primitive system, not a finished Career/Rivalry/Season screen. Against all three mockups, it retains the parts that should be shared: dark glass, gold edges, condensed uppercase hierarchy, tabular numbers, left/right manager comparison grammar, compact fields/checks and solid-gold primary actions. Product-truth differences in recorded stats, columns and values correctly override the mockups.

Final screen jobs must provide their own approved original illustrated objects. Do not ship the kit demo's simple Unicode/glyph icons as substitutes for trophy, tile, pack or other screen art.

## Numbered fix list

1. **File:** `visual-assets/v10_1/shared/motion-demo.html`  
   **Selector/location:** `head`, immediately after `<title>Showdown Motion Kit Demo</title>`  
   **Value:** add exactly `<link rel="icon" href="data:,">` so the served demo makes no `/favicon.ico` request.  
   **Owner:** Claude/follow-up. This review does not apply it because JOB-018 only self-fixes one-line **value changes**; this is an element insertion.

No other foundation blocker remains after the stage-demo placement repair.
