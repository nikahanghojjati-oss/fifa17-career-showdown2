# League Wheel R8.35 — Owner Feedback Replica Pass

Artifact status: `ASSEMBLED_PROPOSAL`
Owner visual approval: `PENDING`
Production integration authorization: `NOT AUTHORIZED`
Production main anchor: `10f75e872d246292bd5fbe55c6ae32a6370b5150` (`1.9.1-r18`)

## Why this pass exists

The owner rated the prior League Wheel presentation 5/10 and identified concrete fidelity gaps: manager placement, stadium depth, lighting/contrast, wheel scale/metallic finish, manager typography, top-bar proportions, generic league initials, state placement, banner quality, and Daniel's pose.

R8.35 responds to those points without changing the game engine or creating a parallel selection/save path.

## Product authority preserved

The proposal keeps the current production integration seam:

- `#leagueWheelScreen`
- `#leagueWheel.leagueWheel`
- `#leagueWheel .wheelTrack`
- exactly five `.wheelItem` league options
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague.menuButton`
- `.backButton[data-smart-back]`

The QA-only state presenter does not randomize a league, persist state, access Firebase, mutate save data, or replace `js/leagueWheel.js`.

## R8.35 visual changes

- Rebuilt the desktop composition against the owner's 16:9 League Wheel reference rather than the earlier generic black/gold layout.
- Increased and lowered the wheel so its desktop footprint more closely follows the reference composition.
- Rebuilt the wheel with a brighter multi-ring metallic treatment, stronger highlight/reflection layers, brighter selected wedge, upgraded pointer and crown hub.
- Replaced the generic `PL / LL / BL / SA / L1` display glyphs with five original inline SVG league-identity marks while retaining the canonical league names as real DOM text.
- Kept those marks original instead of copying official league trademarks; they can be swapped for licensed/authorized marks later without changing wheel logic.
- Moved visible selection/state messaging into the title/subtitle area. `#selectedLeague` and `#leagueStateNote` remain live accessible DOM surfaces but are visually clipped in this presentation.
- Restored an explicit ready-state `SPIN WHEEL` presentation as well as the post-selection `CONTINUE TO CLUB ASSIGNMENT` state.
- Rebuilt manager labels into handwritten-style gold name/nickname treatment plus compact condensed descriptor lines.
- Reworked desktop navigation into a lean split/slanted bar and applied handwritten gold styling to `More Than A Game`.
- Added a more detailed procedural stadium: roof structure, light rings, haze, stands, crowd texture, pitch edge, side banners and vignette.
- Rebalanced manager scale/position and added warm stadium-side rim glow / contrast treatment.

## Browser QA

The local Chromium matrix exercised six product states across six viewport conditions: 36 cases total.

States:

- ready
- spinning
- selected
- confirmed
- locked
- save-error

Viewport conditions:

- 1440×900
- 1366×768
- 1280×720
- 1179×800
- 940×700 with reduced motion
- 390×844 DPR2

Result: **36/36 PASS** after correcting a 10px mobile horizontal-overflow defect.

Checks included:

- no horizontal overflow
- wheel/action rectangles remain disjoint
- desktop character breakpoint behavior
- current production selector seam exists
- disabled Spin/Back presentation follows state
- mobile remains character-free and operable

At 1366×768 ready state, the final tested wheel footprint was approximately `x=469..897`, `y=226..654`, with actions at approximately `y=669..720`, leaving a clean gap between the rotating wheel and controls.

## Remaining source-art gates

R8.35 is not owner-final. Two source-art gaps remain explicit rather than being hidden by CSS:

1. **Daniel pose** — current A02 points toward the viewer. The owner rejected that pose for this screen. A final League Wheel candidate needs Daniel pointing laterally toward the stable wheel rim. A02 is now only an interim layout/lighting stand-in.
2. **Stadium fidelity** — the new procedural stadium is a stronger geometry/lighting approximation, but the reference target has photographic/cinematic depth that CSS alone may not reach. A future stadium-only source-art candidate may replace the procedural background, provided it contains no baked UI, league names, controls, manager labels or state.

Character or stadium generation must remain isolated source-art work. A generated full-page screenshot is not an implementation artifact.

## Owner-review interpretation

This pass should be reviewed for composition direction, wheel treatment, typography, league-mark direction, responsive behavior and state placement. It must not be interpreted as approval of the current Daniel source pose or as final approval of the stadium source layer.
