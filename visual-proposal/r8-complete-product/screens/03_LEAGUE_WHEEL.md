# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE r18 SCREEN CONTRACT — R8.35 OWNER-FEEDBACK REPLICA PASS BROWSER-PROVEN / OWNER FINAL REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Production source anchor: `10f75e872d246292bd5fbe55c6ae32a6370b5150` / runtime `1.9.1-r18`.

Current proposal consumer:

- `prototypes/03b-league-wheel-cinematic-reference-faithful-r8-33.html`
- `prototypes/r8-33-league-wheel-reference-faithful.css`
- shared presentation base: `prototypes/r8-33-home-reference-faithful.css`
- evidence: `evidence/LEAGUE_WHEEL_R8_35_OWNER_FEEDBACK_REPLICA_PASS_2026-09-11.md`

## Product authority

The visual track owns presentation only. The current production integration seam remains literal in proposal markup:

- `#leagueWheelScreen`
- `#leagueWheel.leagueWheel`
- `#leagueWheel .wheelTrack`
- exactly five `.wheelItem`
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague.menuButton`
- `.backButton[data-smart-back]`

Canonical league set remains Premier League, LaLiga, Bundesliga, Serie A and Ligue 1.

`js/leagueWheel.js` on current main remains the sole authority for the 4000 ms normal spin, 80 ms reduced-motion path, random league selection, race/timer cancellation, save/rollback, `League Selected` / `League Confirmed`, Club Assignment progression and locked-club permanence.

The proposal's state renderer is QA-only. It must never ship as a second selection or save engine.

## Owner visual target

The supplied 16:9 League Wheel reference is the composition target, subject to real-product and rights constraints. R8.35 specifically targets:

- cinematic stadium depth and warm ring lighting;
- Daniel large at left, Nik large at right;
- large lower-centered wheel rather than a small high-centered wheel;
- bright gold/black metallic wheel with reflective rim treatment;
- gold handwritten manager name/nickname treatment;
- compact condensed manager descriptors;
- lean/slanted split navigation rather than a full-width black slab;
- handwritten gold `More Than A Game` motto;
- lower quote plaques and compact footer;
- explicit ready `SPIN WHEEL` and post-selection Continue states.

The reference is `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY`; it is not a screenshot to bake into the app and cannot override current product logic.

## Wheel implementation

The wheel remains browser-owned UI, not raster art.

R8.35 uses:

- CSS circular geometry and conic segment fields;
- real DOM league names;
- five original inline SVG league-identity emblems instead of generic `PL / LL / BL / SA / L1` text;
- an original crown hub;
- a stable decorative outer rim / halo;
- real `.wheelTrack` as the rotating selection surface;
- stronger metallic bevel, reflection and glow treatment.

The current SVG marks are intentionally original and do not reproduce official league trademarks. If authorized logo assets are established later, they can replace these presentation marks without changing selection logic or DOM authority.

## State presentation

### Ready

- top visual state = `SPIN TO SELECT LEAGUE`;
- `#spinLeague` = `SPIN WHEEL`;
- Spin enabled;
- Back enabled.

### Spinning

- visual state communicates draw in progress;
- production owns animation duration and final selection;
- Spin disabled;
- Back disabled.

### Selected

- selected league is shown in the top visual-state area;
- primary action becomes `CONTINUE TO CLUB ASSIGNMENT`;
- production still owns `#selectedLeague` and `#leagueStateNote` live text and save state.

### Confirmed / Locked / Save failure

Presentation may style these states, but production state/rollback remains authoritative.

### Live-status placement correction

The owner rejected the prior small visible result/note block beneath the wheel. In R8.35, `#selectedLeague` and `#leagueStateNote` remain in the DOM for accessibility/runtime compatibility but are visually clipped. User-visible state is echoed into the top subtitle area by the proposal harness; production integration must provide an equivalent presentation adapter without deleting the live status nodes.

## Character policy

Manager 1 remains Daniel; Manager 2 remains Nik.

Current wide-desktop stand-ins:

- Daniel: A02 core pointing hero;
- Nik: A01 core thinking hero.

The owner has explicitly rejected A02 as the final League Wheel pose because it points toward the viewer instead of toward the wheel. A02 may remain only as an interim layout/lighting stand-in.

Final League Wheel Daniel requires a bounded isolated source-art candidate with his gesture directed laterally toward the stable exterior wheel rim. The character image must contain no wheel, text, controls or league marks. Any generated candidate remains `CANDIDATE` until composited into the real screen, browser-tested and owner-approved.

Nik's source can also receive a quality/lighting refinement pass if required, but no character pixel may carry product meaning or interaction authority.

Character layers remain `aria-hidden`, pointer-inert and unnecessary to operate the screen.

## Stadium / environment

R8.35 upgrades the procedural environment with roof beams, stadium ring lights, haze, stands, crowd texture, pitch edge, side banners and vignette. This is an improved real-layout approximation, not a claim that CSS alone has reached the cinematic source-art quality of the owner reference.

A future high-quality stadium-only source-art candidate is allowed and currently desirable. It must contain no baked navigation, manager labels, league marks, selected result, state message or controls. The real DOM remains overlaid above it.

## Typography

Manager name/nickname treatment prefers the handwritten `Yellowtail` family with script fallbacks. Small descriptor lines use the condensed `Barlow Condensed` family with local/system fallbacks.

No functionality may depend on remote font availability; fallback fonts must preserve readable geometry.

## Geometry / responsive contract

At 1366×768, the tested R8.35 wheel footprint is approximately `x=469..897`, `y=226..654`. Actions begin around `y=669`, preserving a clean wheel/control exclusion gap.

### `>=1280px`

Full two-manager cinematic composition. Characters frame the wheel; wheel remains centered and product-owned.

### `<=1279px`

Characters and quote plaques are removed before they can compress or overlap the wheel.

### `<=1179px`

Wheel/actions enter safe document flow. Vertical scrolling is allowed; horizontal overflow is forbidden.

### Mobile

Character-free. Wheel remains the hero; actions stack underneath it.

## R8.35 browser proof

Six product states × six viewport conditions = **36/36 PASS** after fixing an initial 10px phone overflow.

Validated conditions:

- 1440×900
- 1366×768
- 1280×720
- 1179×800
- 940×700 reduced motion
- 390×844 DPR2

Validation includes production selector presence, five league options, no horizontal overflow, wheel/action separation, correct character breakpoint behavior, and disabled state presentation.

## Practical-replica rules

Do not use the owner screenshot as a webpage background.

Do not bake league names, selected results, button labels, navigation, manager labels or live product state into background/character/stadium artwork.

Image generation, when used, is limited to isolated source art. The browser assembles the final screen.

## Production-integration gate

Production `main` remains untouched by this proposal.

Before any integration, re-read then-current `main`, `index.html`, `js/leagueWheel.js`, save/rollback behavior, reduced-motion authority, shared-session authority and relevant tests. Preserve the current game engine and wire presentation onto it; do not port the proposal QA harness as product logic.
