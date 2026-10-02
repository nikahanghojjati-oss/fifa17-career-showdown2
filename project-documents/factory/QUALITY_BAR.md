# Quality bar: the Showdown scorecard

Nik wants AAA game menus. Think FIFA 17's Career Mode and The Journey: a dark stadium at night, gold light, the two managers standing in front of the menu like real people in a real place, and every panel, number and transition feeling expensive. Not a website with a background photo. A game.

Every build job checks itself against this page before it says "done". Every review job scores with it. Nobody passes a screen because "it works". It must **feel** like the mockup.

> This scorecard may be amended by Claude after the "How close to the mockups" research (for example a measured mockup-diff score and separate phone compositions). Always use the version on the branch when your job starts.

## How to score

Score each criterion 0–5. Write one sentence of evidence for every score (what you saw, in which screenshot).

| Score | Meaning |
| --- | --- |
| 5 | Indistinguishable from a shipped AAA menu. Nothing to fix. |
| 4 | Clearly premium. One or two small things a sharp eye would catch. |
| 3 | Good but noticeably "web". Fix list required. |
| 2 | Obvious problems a casual player would notice. |
| 1 | Broken look in places. |
| 0 | Missing or wrong. |

**Pass line (static review):** average ≥ 4.2 over criteria 1–7, 9 and 10, no criterion below 3, and every hard gate PASS.
**Pass line (motion and final review):** all 10 criteria, average ≥ 4.4, no criterion below 4 on criteria 1, 2, 3 and 9, every hard gate PASS.

## The ten criteria

### 1. Mockup fidelity
Same composition, same hierarchy, same feel as the mockup at 1366 × 768. Side-by-side with the mockup, a stranger would say "that's the same screen". Title position, panel proportions, where the eye goes first, how much stadium shows. Differences are allowed only where PRODUCT_TRUTH.md demands them.
- 5: overlay the mockup at 50 % and the big shapes line up within about 2 % of the width.
- 3: right pieces, wrong proportions or spacing.

### 2. Characters stand out of the menu
Nik and Daniel look like they are standing in the stadium **in front of** the UI, not pasted behind it.
- The depth sandwich is right: plate → panels → character cut-out → light and grade (see CRAFT_GUIDE.md §2). Where an arm or shoulder crosses a panel, the arm is on top.
- Rim light on the side facing the stadium lights, warm gold, 1–3 px soft. Grounded: a soft contact shadow where a body meets a panel edge.
- **No halos, no seams, no hard cut lines, no colour fringes** around hair, beard, suit edges at 100 % and 200 % zoom.
- Faces sharp and natural, same likeness as the plate. Faces never covered by UI on desktop.

### 3. Hands and contact
Hands are where AI and cheap compositing fail first. Check every hand.
- Five fingers, natural joints, no melted or extra fingers.
- **Contact is real**: a fingertip touching the League wheel actually touches it (the finger is over the rim, the shadow under it). A chin on a fist rests on it. Crossed arms overlap correctly. A pointing finger points at something meaningful.
- No UI element cuts through a hand.

### 4. Lighting and grade
- Gold-dominant grade, black depths, warm stadium bokeh. One light direction per scene (stadium lights high behind, warm key from the side the character faces).
- Panels pick up the scene light: a faint warm top edge, darker bottom.
- Scrims behind text are soft gradients, never a flat grey box.
- No blown whites on gold, no muddy brown gold. Gold is `--sd-gold-500` family from the shared tokens.

### 5. Typography and title treatment
- Screen title in the brush display style (Kaushan Script, gold metallic gradient, slight skew in the **image or title only**, never in form text), with the letter-spaced eyebrow "CAREER MODE SHOWDOWN 17" above and the tagline below.
- UI text: Barlow / Barlow Condensed, uppercase labels letter-spaced, numbers tabular.
- Numbers are the hero of data screens: big, gold or white, aligned.
- No text overflow, no ellipsis on important words, no orphan words in buttons.

### 6. Panel craft
- Gold-edged dark glass panels with the Showdown corner cut, consistent radius and edge width from the shared kit.
- Spacing on an 8 px grid. Columns align. Table rows are evenly spaced. Icons are the same visual weight.
- Primary button: solid gold, black text, one per screen. Secondary: dark with gold outline. Danger actions: hidden behind a menu and a confirm.

### 7. Information clarity and honesty
- A player understands the screen in two seconds: who leads, what to do next.
- Only real, recorded data (PRODUCT_TRUTH.md §3). Honest loading, empty, partial and unavailable states designed, not left blank.
- Daniel left, Nik right, everywhere.

### 8. Motion and feel (motion jobs and final review only)
- Entrance has choreography, like opening a pack: background settles, characters slide in with a light sweep, title brush-wipes on, panels rise in sequence (40–80 ms stagger), numbers count up, gold glint passes once.
- Total entrance ≤ 1.2 s; the screen is usable at 0.6 s. Hover and press feedback ≤ 120 ms. No layout shift.
- 60 fps: animate only transform and opacity (and filter on small elements).
- `prefers-reduced-motion` and the app's own reduced-motion setting: everything appears with a short fade only.

### 9. Phone composition
- 393 × 660 is a **designed** composition, not a squashed desktop: faces still visible (top band), title readable, data in tabs or a swipe row, primary action in thumb reach.
- No page scroll at 393 × 660 and 360 × 640. At 375 × 553 the primary action is visible.
- Touch targets ≥ 44 × 44 px. Inputs ≥ 16 px.

### 10. Polish and finish
- Crisp at DPR 2 and 3 (no blurry upscaled UI, plate at 2x).
- No console errors, no 404s, no layout jank, no flash of unstyled text.
- Consistent with its sibling screens (same kit, same title system, same buttons).
- Nothing looks unfinished: no placeholder text, no lorem, no debug outlines.

## Hard gates (each PASS or FAIL; any FAIL fails the review)

| # | Gate | How to check |
| --- | --- | --- |
| H1 | Daniel left, Nik right, never mirrored | look at every frame and phone layout |
| H2 | Rights: no real crests, league logos, trophies, players, EA/FIFA art; Reus only on Loading with credit | look; grep asset list |
| H3 | No live or private data baked into images | inspect every image asset |
| H4 | Product truth: only real buttons, real stats, computed score, correct scoring table | compare with the job's TRUTH.md / fixtures.json |
| H5 | Phone fit: no scroll at 393 × 660 and 360 × 640; primary visible at 375 × 553 | measured `scrollHeight <= innerHeight` and button rect inside viewport |
| H6 | Inputs ≥ 16 px; text contrast ≥ 4.5:1 for body text | measured |
| H7 | Reduced motion respected | emulate `prefers-reduced-motion: reduce` |
| H8 | Keyboard: every control reachable with Tab and has a visible focus ring | tab through |
| H9 | No console errors or failed requests | browser log |

## Review output format

Every review writes `visual-assets/v10_1/<screen>/review/REVIEW_<job>.md` with:
1. Verdict: **PASS** or **FAIL**.
2. The scorecard table (criterion, score, evidence sentence).
3. The hard-gate table.
4. The compare sheet: mockup and build side by side at 1366 × 768, and the 393 × 660 phone shot (file paths).
5. **Fix list**: numbered, each item one exact change (what, where, target value). The fix job does exactly this list, nothing more.
