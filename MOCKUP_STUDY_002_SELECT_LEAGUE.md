# Mockup Lab Study 002 — Select League

Date: 2026-10-06
Mode: chat
Branch: `study/mockup-lab`
Scope: study only. No game code changed.
Screen: Select League
Status: COMPLETE

## Source authority

Primary goal image: `visual-assets/goals/GOAL_LEAGUE_LOGOS_BLURRED.jpg` on `claude-cloud/hlc-goals`
Goal dimensions: 1536 × 864
Goal blob SHA: `fb17b6bfa523a9b7eddf5583a2978e3352bb8855`

The later HLC League brief explicitly identifies this image as Nik's goal for composition and provides exact plate geometry, so it is the strongest Select League composition authority found in this pass. The curated Mockup Lab inventory also contains three earlier Select League concepts, all 1672 × 941:
- `Career Mode Showdown: Select League.png`
- `CM 17 Select League Showdown.png`
- `Gold-Black Career Mode League Selector.png`

Latest desktop implementation candidate available in the project library: `R8_43_DESKTOP_1366_READY.png`
Candidate dimensions: 1366 × 768
Candidate status from the preserved handoff: `ASSEMBLED_PROPOSAL / BROWSER_PROVEN / OWNER REVIEW PENDING`, not production authority.

Available phone implementation capture: `R8_42_MOBILE_390_READY.png`
Stored pixels: 780 × 1688, representing a 390 × 844 CSS viewport at DPR 2.

Current production source checked:
- `main@index.html` `#leagueWheelScreen`
- `main@js/leagueWheel.js`
- `main@css/app.css`
- current main head observed during this study: `bc77a0b934c3d43279f27f73a72db21c2db2b4f2`

Python measurement was successfully run on the R8.43 desktop capture. The goal image was inspected directly from the GitHub connector but was not copied into the Python container, so goal anchors use the exact HLC brief geometry rather than pretending Python measured the goal pixels.

## Step 1 — Identify the visual target and product truth

The target is a cinematic league-draw event inside a night stadium. Daniel is on the left pointing directly into a large gold-rimmed wheel, Nik is on the right with his hand on his chin, the title is a rough gold brush treatment above the wheel, and the primary/secondary actions sit immediately below the wheel.

The screen is not supposed to feel like a web form or a card containing a spinner. The wheel is the event stage and the two managers make the draw feel like part of the rivalry.

Product truth overrides literal goal-image details in four important places:

1. Current main league order is `Premier League → LaLiga → Bundesliga → Serie A → Ligue 1`. The goal's apparent segment order is not authoritative.
2. The goal originally used real league-logo imagery. The current visual contract instead requires the project's original league marks from `js/visualIdentity.js`.
3. The newer owner direction requires one monochrome wheel language: pale/off-white marks on dark wedges and near-black marks on the selected gold wedge. The multicolour marks in R8.43 are therefore no longer the target.
4. The goal's old HOME / CAREER / STANDINGS / STATS / RULES / ABOUT navigation and utility icons are visual-history material, not current product navigation. Current product IDs, strings, state behavior and shared chrome win.

## Step 2 — Read the hierarchy

Primary read order:

1. `SELECT LEAGUE` event title.
2. The league wheel and fixed pointer.
3. The two rivalry managers framing the wheel.
4. Current wheel state: ready, spinning, selected or locked.
5. Primary action: `SPIN WHEEL`, then Continue or Locked depending on state.
6. BACK.
7. Slogan/world dressing and footer.

The goal succeeds because the eye moves from title into the pointer and selected wedge, then outward to Daniel and Nik, then down to the action. The wheel is not surrounded by a conventional panel boundary.

## Step 3 — Establish canvas and macro composition

Goal canvas: 1536 × 864, aspect ratio 16:9.

Exact target wheel anchor from the HLC brief:
- centre: (762, 496) plate px
- outer rim radius: 240 plate px
- wheel bounds: x 522–1002, y 256–736
- wheel diameter: 480 px
- normalized centre: x 49.61%, y 57.41%
- normalized diameter: 31.25% of canvas width, 55.56% of canvas height

Title block target:
- centred above wheel
- approximately y 10%–28%
- kicker above the title
- state line between two thin gold rules below the title

Action target:
- buttons under the wheel at approximately y 86%–93%
- primary width 300 px at the 1366 Tier-S desktop
- BACK width 200 px
- 16 px gap

Daniel's fingertip has a protected keep rectangle in target plate coordinates:
- x 440–560, y 425–480
- the fingertip must read in front of the wheel rim

The macro silhouette is therefore: dark stadium world, two full manager masses, a central wheel occupying more than half the image height, strong title above it, and a compact two-button action strip below it.

## Step 4 — Measure the major UI zones

Using the brief's `cover` plate mapping from 1536 × 864 to the 1366 × 768 Tier-S viewport:

- target scale k ≈ 0.8893
- target wheel centre ≈ (677.6, 440.9)
- target wheel radius ≈ 213.4 px
- target wheel bounds ≈ x 464.2–891.1, y 227.5–654.3

Python/Hough measurement of `R8_43_DESKTOP_1366_READY.png`:
- measured wheel centre ≈ (658.2, 431.4)
- measured outer radius ≈ 226.3 px
- measured candidate bounds ≈ x 431.9–884.5, y 205.1–657.7

Candidate-to-target wheel delta:
- centre ≈ 19.4 px too far left
- centre ≈ 9.5 px too high
- radius ≈ 12.9 px too large
- candidate diameter is roughly 6% larger than the mapped target diameter

Python colour-component measurement of the R8.43 primary gold button:
- candidate primary button ≈ x 434–737, y 684–733
- measured size ≈ 303 × 49 px

The HLC target at 1366 calls for:
- width ≈ 300 px
- height 56 px
- vertical action band y 86%–93% ≈ 660–714 px

So the R8.43 primary width is essentially correct, but the button is roughly 24 px too low at its top edge and about 7 px too short.

The target's central wheel anchor is more important than tiny local spacing because it establishes the relationship between Daniel's fingertip, the title, Nik's face and the action strip.

## Step 5 — Typography and graphic language

Target:
- small widely tracked `CAREER MODE SHOWDOWN 17` kicker
- large rough brush-style gold `SELECT LEAGUE`
- spaced uppercase state line
- condensed game-UI text for league names and actions
- handwritten gold manager labels and stadium notes as environmental flavor

R8.43:
- preserves the large gold title hierarchy, but the title is a smooth/bevelled italic 3D treatment rather than the rough brush lettering of the goal
- feels more like a polished broadcast/game logo than painted FIFA-era title art
- manager script labels are close to the intended environmental language

Current production main is much farther away:
- `SELECT LEAGUE` is a normal screen `<h2>`
- the wheel lives inside a conventional panel
- the wheel labels are rectangular white text plates
- the hub says `CMS 17` through CSS rather than using the cinematic crown roundel

Typography is therefore a high-severity production gap and a medium/high candidate gap.

## Step 6 — Color, light, material, and depth

Target palette and material:
- deep ink/charcoal stage
- warm metallic gold rim and selected wedge
- pale/off-white typography
- dark smoked-glass wedges
- stadium floodlights creating edge/rim light on both managers
- gold atmosphere concentrated around the draw rather than coating the whole image

Target depth order:
1. dark sky and roof
2. floodlights/crowd
3. banners and environmental notes
4. Daniel and Nik
5. wheel
6. Daniel fingertip overlay in front of the rim
7. title/state text
8. buttons and footer

R8.43 is already close in world lighting and depth, but it is more uniformly gold and bright than the goal and uses multicolour league marks. The later owner direction specifically removes those multicolour marks.

Production main is structurally different: light panel material, a bright conic-gradient wheel, flat white label boxes and no stadium/managers. It reads as a functional widget rather than a cinematic event.

## Step 7 — Character and asset staging

Daniel:
- left of wheel
- full rivalry presence, not a decorative portrait
- pointing hand must visually cross in front of the wheel rim
- face and pointing hand are protected landmarks

Nik:
- right of wheel
- hand-on-chin pose
- face and hand remain unobstructed
- should balance Daniel's mass without pushing the wheel off centre

The goal allows the managers to extend almost the full usable stage height, especially below the wheel line.

R8.43 has the correct people, poses and general left/right relationship, but the Python wheel result shows the wheel itself has drifted left toward Daniel and slightly upward. Visually, both managers also read a little more compressed than in the goal, reducing the feeling that the wheel is suspended between two full-size rivals.

Production main has no manager staging at all, so this remains a critical live-production gap.

## Step 8 — Responsive and interaction implications

The correct phone strategy is recomposition, not desktop shrink.

The newer League brief allows either:
- both manager faces kept whole in a cropped plate band, or
- managers fully out of frame

It does not allow awkwardly cut faces.

Phone target guidance:
- wheel diameter 220–250 CSS px at 360 px width
- title around 40 px
- state below title
- primary and BACK full width, about 48–52 px high
- primary fully visible at 375 × 553
- no page scroll at 360 × 640
- slogan boxes hidden

The available R8.42 mobile capture is 390 × 844 CSS px at DPR 2 and intentionally removes both managers, which is allowed in principle. However, its wheel is approximately 355 CSS px wide by visual/pixel inspection, far above the later 220–250 px target, and the whole composition relies on an 844 px-tall viewport. The title and wheel consume too much vertical space for the later 360 × 640 no-scroll requirement.

So mobile needs a real compression/recomposition pass even though its visual language is strong.

Interaction/product behavior from `js/leagueWheel.js` must remain authoritative:
- 4-second normal spin and reduced-motion path
- BACK disabled while spinning
- main's exact selected/confirmed/locked strings
- selected league rotation normalized after spin
- selected league persists before opening Club Assignment
- locked clubs make the league permanently locked

None of those behaviors should be changed merely to imitate the mockup.

## Step 9 — Current-game gap against the goal

No fresh user-pasted live screenshot was present in this turn. This study therefore keeps two clearly separated baselines:

A. Current production `main` source.
B. Latest preserved visual candidate `R8_43_DESKTOP_1366_READY.png`.

This distinction matters because R8.43 is a browser-proven proposal, not evidence that its visual treatment is currently shipped.

| Area | Goal | Current production main | Latest R8.43 candidate | Priority |
| --- | --- | --- | --- | --- |
| World/stage | Night stadium, full-screen cinematic | Generic screen/panel | Stadium world present | Critical on production |
| Managers | Daniel pointing left, Nik thinking right | Absent | Present and recognizable | Critical on production; low/medium candidate |
| Wheel geometry | centre (762,496), r 240 on 1536 plate | Generic 390 px-class wheel in panel | ≈19 px left, 10 px high, radius ≈13 px large at 1366 mapping | High candidate |
| Wheel material | dark glass, metallic gold, fixed gold selected wedge | bright multicolour conic wheel + white label cards | close dark/gold construction | Critical production; low candidate |
| League marks | original marks, monochrome pale/black-gold state language | text labels only in current markup | original-looking but multicolour marks | High candidate |
| Title | rough gold brush `SELECT LEAGUE` | generic H2 | large gold bevelled/italic title, not brush | High |
| State line | narrow spaced line under title | result below wheel inside panel | positioned under title | Production high; candidate low |
| Buttons | compact side-by-side under wheel | stacked full-width panel buttons | side-by-side; primary ≈24 px too low and 7 px short | Medium candidate |
| Daniel finger/rim | fingertip in front of rim | not applicable | relationship present but wheel drift changes exact registration | High precision item |
| Header | current shared chrome, not old goal nav | current app chrome | older visual proposal chrome | Do not copy stale goal nav |
| Phone | compressed 220–250 px wheel, no-scroll at 360×640 | generic responsive production | visually strong but wheel ≈355 CSS px and depends on 844 px height | High |
| Product behavior | current main strings/order/state machine | authoritative | proposal approximates it | Preserve main |

### Product-truth conflicts to preserve

1. Do not reproduce the goal's old global nav tabs or search/settings/profile icons.
2. Do not restore real league logos from the historical goal.
3. Do not use the goal's apparent league segment order when it differs from current main.
4. Use the project's original league marks and the later monochrome owner direction.
5. Keep the existing race-safe wheel behavior, accessibility roles, BACK lockout and selected/locked persistence.

### Recommended fidelity order for a future implementation pass

1. Bring the current production screen onto the cinematic stadium/manager stage rather than styling the existing flat panel in place.
2. Pin the wheel to the target plate anchor and correct R8.43's ≈19 px left / ≈10 px up / ≈6% oversize drift at the 1366 Tier-S viewport.
3. Replace multicolour wheel marks with the required monochrome pale-on-dark / near-black-on-gold language.
4. Restore the rough brush title character while keeping current semantic DOM text.
5. Register Daniel's fingertip overlay precisely above the rim.
6. Move the desktop action strip upward into the target band and restore the intended 56 px control height.
7. Use current shared chrome instead of the historical goal navigation.
8. Recompose phone around a 220–250 CSS px wheel and prove the primary action remains visible at 375 × 553 and the page does not scroll at 360 × 640.

Study conclusion: Select League has two very different fidelity states. The preserved R8.43 proposal is already close to the cinematic goal and mainly needs precision, title-language, monochrome-mark and mobile corrections. Current production `main`, however, is still fundamentally the old flat spinner/panel composition, so the live-production fidelity gap remains critical.
