# Foundation review · JOB-018

Verdict: **PASS**

Foundation score: **22 / 25 = 4.4 / 5.0**

Hard gates checked by this job: **H6 PASS · H7 PASS · H8 PASS**

The shared foundation is strong enough to build the screen wave on. The visual language reads as Showdown rather than generic web UI: black stadium depth, controlled gold metal, brush-title support, cut-corner glass, live semantic controls, registered character overlap and short pack-rip choreography. One technical polish item remains in the motion demo and is listed below.

## Evidence reviewed

- Shared specimen: desktop screenshot, responsive source, verification.json, tokens and type CSS.
- Shared kit: desktop screenshot, responsive source, component CSS and the committed Career Statistics compare sheet.
- Stage: stage-demo.html, stage CSS/JS, CUTOUT_STANDARD.md, the 400% cutout_test.png diagnostic, and the stage registration measurements recorded by JOB-015.
- Motion: motion-demo.html, motion CSS/JS, standard and reduced-motion strips, and JOB-016 timing/frame measurements.
- Mockups: MOCKUP_CAREER_STATISTICS.png, MOCKUP_RIVALRY_STATISTICS.png, MOCKUP_SEASON_RESULTS.jpeg.

Evidence limitation: the connector exposes the exact 393×660 specimen/kit and stage PNGs on the branch but cannot hand off the larger PNG bytes for direct image inspection in this chat. The responsive source and committed measurements were therefore used for those frames. JOB-016 did not leave a standalone 393×660 motion-demo capture; its responsive source and reduced-motion evidence were inspected instead. This is an evidence gap, not a fabricated pass.

## QUALITY_BAR scores

| Criterion | Score | Evidence |
| --- | ---: | --- |
| **4. Lighting and grade** | **4 / 5** | The specimen and kit hold black depths with warm stadium bokeh and the shared gold family; glass panels have restrained warm edges instead of flat grey fills. Stage lighting adds contact shadow, vignette, flare and a separately tintable rim without baking gold into the cut-out. |
| **5. Typography and title treatment** | **5 / 5** | The specimen uses brush wordmark image assets for the screen titles with visually-hidden real text, the eyebrow/tagline hierarchy is present, and UI text uses Barlow / Barlow Condensed with tabular numeric emphasis. No important title is represented as a plain block-font substitute in the title system. |
| **6. Panel craft** | **4 / 5** | Shared panels, tables, tabs, buttons, checks and toggles use consistent cut corners, gold edges, dark glass, aligned rows and one clear solid-gold primary action. Against the three mockups the hierarchy and spacing transfer well; the kit demo's generic glyphs are intentionally flatter than the final screen art and must not be mistaken for shippable illustrated objects. |
| **8. Motion and feel** | **5 / 5** | The standard strip shows scene settle → manager entry → title wipe → staggered panels → count-up/reward reveal, with the primary action usable by 0.6 s and cleanup by 1.2 s. Shared motion uses transform/opacity, a 60 ms panel stagger, and the JOB-016 warmed trace reported 16.8 ms worst-frame spacing with zero samples above 25 ms. |
| **10. Polish and finish** | **4 / 5** | Shared typography, kit and stage evidence are crisp and consistent, specimen verification reports no errors and full asset loads, and controls use the same tokens throughout. Deduction: the motion demo is known to request a missing favicon, producing one 404, and it lacks a standalone committed 393×660 evidence capture. |

## Hard gates

### H6 · PASS — Inputs ≥ 16 px; body contrast ≥ 4.5:1

- showdown-ui.css sets .sd-input, .sd-select to font: 400 16px/1.2 var(--sd-font-body).
- kit.html repeats font-size: 16px for phone inputs/selects.
- verification.json measures primary body text at **9.09:1** and secondary body text at **4.91:1** on the shared glass.

### H7 · PASS — Reduced motion respected

- Shared tokens collapse scene, character, title, panel, number and entrance timing to **150 ms** with zero stagger.
- motion.css replaces choreography with sd-reduced-fade under both OS and product reduced-motion paths.
- stage.css disables dust/flare animation for prefers-reduced-motion and hides the atmosphere layer for the product reduced-motion data attributes.
- The reduced-motion strip is fully settled after the short fade rather than replaying the pack-rip transforms.

### H8 · PASS — Keyboard reachability and visible focus

- Shared buttons, icon buttons, chips, tabs, inputs, selects, toggles and checks all have :focus-visible treatment.
- The focus style is a visible **2 px gold outline** with a black separation ring.
- Specimen keyboard verification measured a focused tab with a solid 2 px outline; the kit's confirm primitive enumerates focusable controls for its focus trap.

## 400% cut-out check

**PASS.** cutout_test.png shows the refined League finger at 400% logical zoom over black, neutral-light and warm-glass backgrounds. The new edge is intentionally softer, but it does not add a bright/dark matte ring, colour speckling or a hard registration seam. The stage demo uses the same registered wrapper for plate and cut-out; JOB-015 measured a worst registration error of **0.0417 device px** across its tested viewports.

## Mockup comparison

The shared kit keeps the mockups' strongest reusable grammar: thin gold perimeter lines, black glass, condensed uppercase labels, dominant tabular numbers, manager comparison rows and compact Season-style fields/checks. The committed Career Statistics compare sheet shows that the component proportions are close enough to transfer into screen builds.

The screen jobs still need their own illustrated objects. The mockups use trophy, ball, bar and cabinet art with more physical depth than the kit demo glyphs; those objects should come from each screen's approved art assets rather than by making the shared kit more pictographic.

## Numbered fix list

1. **File:** visual-assets/v10_1/shared/motion-demo.html  
   **Selector/location:** head  
   **Value:** add exactly '<link rel="icon" href="data:,">' after the title element so the demo makes no favicon request and Criterion 10 reaches the "no 404s" target.  
   **Owner:** Claude/follow-up. JOB-018 does not apply it because the review job only self-fixes one-line **value changes**; this is a new element insertion.

## Screen-build note

Do not ship the kit demo's simple Unicode/glyph icons as final illustrated objects. Final screen jobs must use their own approved original art while preserving these shared panel and interaction primitives.
