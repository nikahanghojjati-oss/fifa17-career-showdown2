# League Wheel Reference-Faithful Consumer — R8.33 Browser Proof

Status: `ASSEMBLED_PROPOSAL / OWNER-TARGET REPLICA DIRECTION / 36-STATE-VIEWPORT BROWSER-PROVEN / PRODUCTION INTEGRATION NOT AUTHORIZED`

Production anchor: `e624d19e04c0ca56f33fa7f0d25fdcc42eb99eda`

Proposal files:

- `prototypes/03b-league-wheel-cinematic-reference-faithful-r8-33.html`
- `prototypes/r8-33-league-wheel-reference-faithful.css`
- shared presentation base: `prototypes/r8-33-home-reference-faithful.css`

## Owner reference correction absorbed

The owner supplied the cinematic Select League reference as a practical visual target and asked for a close replication where feasible, while correcting impossible or product-inaccurate details rather than flattening the reference into a screenshot.

R8.33 therefore implements the reference language as real browser UI:

- slanted black CM17 navigation shell with gold Career state;
- centered `SELECT LEAGUE` gold hero title;
- warm stadium bowl/light/crowd presentation inherited from the R8.33 Home system;
- large Daniel/Nik staging on wide desktop using the frozen A02/A01 masters;
- handwritten manager labels/descriptors;
- a large circular five-segment wheel with metallic black/gold rim, pointer and crown hub;
- gold selected wedge treatment;
- reference-like lower-left/lower-right rivalry quote plaques;
- explicit live selected-league/status band;
- dominant gold Spin/Continue action and black Back action;
- narrow CM17 footer.

No whole-screen generated image is used.

## Production contract reconciliation

Current r17 product authority remains `js/leagueWheel.js`.

Important current behavior preserved in the proposal state map:

- normal spin timing: 4000 ms;
- reduced-motion spin timing: 80 ms;
- no selected league -> result `Spin to select league`, button `SPIN WHEEL`, state note hidden;
- explicit spin -> result/button `SPINNING...`, Spin disabled, Back disabled;
- after a successful saved selection -> status `League Selected`, button `CONTINUE TO CLUB ASSIGNMENT`;
- Continue changes status to `League Confirmed`, saves, then opens Club Assignment;
- if clubs are already assigned -> button `LEAGUE LOCKED`, disabled, note explains league/clubs are permanent;
- save failure restores the prior selection/status and surfaces an error notice;
- operation IDs/timers remain product-owned race-safety authority.

The isolated proposal does **not** generate randomness, save a selected league, run the production timer, call Firebase, or navigate to Club Assignment. `window.cm17LeagueProposal.renderState(...)` is a deterministic visual QA adapter only.

## Practical-replica boundary

The owner reference contains official-looking league marks. R8.33 intentionally replaces those with original textual league glyphs (`PL`, `LL`, `BL`, `SA`, `L1`) while keeping the five canonical league names in live DOM.

The wheel is not a raster asset. The wheel surface, segments, pointer, result text, actions and state note are real HTML/CSS/SVG so CM can bind them to the current production wheel authority.

Daniel/Nik do not intercept interaction. The rotating/selectable wheel remains independent of character pixels.

## Character source authority

Wide desktop reuses the exact frozen Home masters:

- Manager 1 / Daniel = A02 core pointing hero;
- Manager 2 / Nik = A01 core thinking hero.

No League Wheel-specific character generation was performed. The pointing pose is treated as a currently acceptable presentation approximation; a future wheel-specific hand/rim pose would be a separate bounded `CANDIDATE` source-art ticket and must never require moving the real wheel hit area.

At widths below 1280px the characters and quote plaques are removed.

## Safe contact direction

The owner reference suggests Daniel physically presenting/pointing toward the wheel. Future final art may visually approach or meet the **stable exterior rim only**.

The production-owned rotating `.wheelTrack`, segment selection, pointer result and hit area must remain independent. If reliable exterior-rim contact cannot be maintained across the wide-desktop matrix, use visible air gap rather than forcing the wheel geometry toward the hand.

## Browser state matrix

Chromium exercised six deterministic visual states at six viewport conditions: **36/36 combinations passed**.

Visual states:

1. `ready`
2. `spinning`
3. `selected`
4. `confirmed`
5. `locked`
6. `save-error`

Viewport conditions:

| Viewport | Character treatment | Result |
| --- | --- | --- |
| 1440×900 | A02 Daniel + A01 Nik visible | PASS |
| 1366×768 | A02 Daniel + A01 Nik visible | PASS |
| 1280×720 | A02 Daniel + A01 Nik visible | PASS |
| 1179×800 | character-free responsive presentation | PASS |
| 940×700 reduced motion | character-free responsive presentation | PASS |
| 390×844 DPR2 | character-free stacked/mobile presentation | PASS |

Every state/viewport combination additionally proved:

- exactly five league segments are present;
- no horizontal document overflow;
- the wheel bounding box remains disjoint from the Spin/Continue/Back action group;
- the previous wheel-bottom/button collision does not recur;
- character images are `aria-hidden`;
- character images use `pointer-events:none`;
- character breakpoint behavior is deterministic;
- Spin disabled state is correct for `spinning` and `locked`;
- Back is disabled in the `spinning` visual state;
- state text and action labels update without depending on color alone.

The first internal geometry pass detected a real wheel/action overlap at 1366×768 and 1280×720. That was corrected with short-desktop wheel sizing/position rules. The entire 36-combination matrix was then rerun and passed.

## Responsive behavior

### Wide desktop

The cinematic two-manager composition surrounds a central wheel. The wheel remains the interaction hero and no character layer overlaps it.

### Short desktop / Chromebook

At 1366×768 and 1280×720 the wheel, halo and typography reduce before the controls are allowed to collide. The control rail remains visibly below the wheel.

### Tablet

Characters are removed. The real wheel remains centered and status/actions move into normal document flow where needed.

### Mobile

Characters and rivalry quote plaques are removed. The wheel is enlarged relative to phone width instead of being squeezed beside other surfaces. Selected league and actions stack below. Vertical scrolling is acceptable; horizontal overflow is forbidden.

## Remaining fidelity gaps

This consumer is materially closer to the owner target, but it is not claimed to be pixel-identical.

Remaining bounded refinements:

- the wheel rim can gain more original mechanical detail/fasteners without introducing proprietary marks;
- a future wheel-specific Daniel presentation pose may improve the hand-to-rim relationship;
- the procedural stadium and browser-font brush approximation remain lower-frequency than the reference artwork.

Those are refinement/source-art tasks. They do not justify replacing the wheel with a generated screenshot.

## CM integration notes

CM remains owner of:

- the real `#leagueWheel` / `.wheelTrack` DOM binding;
- `getRandomLeague()` selection;
- 4000 ms / 80 ms timing;
- operation ID and cancellation safety;
- save success/failure behavior;
- `League Selected` / `League Confirmed` state transitions;
- Club Assignment progression;
- locked-club permanence;
- shared-session authority if/when the wheel is presented in shared setup.

Visual implementation owns only composition, styling, decorative art slots and responsive state presentation.

Production `main` was not modified by this work.
