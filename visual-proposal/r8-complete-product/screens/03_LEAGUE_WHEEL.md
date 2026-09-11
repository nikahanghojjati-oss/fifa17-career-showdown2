# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE r18 SCREEN CONTRACT — R8.34 REFERENCE-FAITHFUL CONSUMER + PRODUCTION SELECTOR BRIDGE BROWSER-PROVEN / OWNER FINAL REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Production source anchor: `10f75e872d246292bd5fbe55c6ae32a6370b5150` / runtime `1.9.1-r18`.

Current proposal consumer:

- `prototypes/03b-league-wheel-cinematic-reference-faithful-r8-33.html`
- `prototypes/r8-33-league-wheel-reference-faithful.css`
- shared presentation base: `prototypes/r8-33-home-reference-faithful.css`
- R8.34 production-selector/responsive proof: `evidence/LEAGUE_WHEEL_R8_34_PRODUCTION_SELECTOR_AND_RESPONSIVE_PROOF_2026-09-11.md`

The predecessor `prototypes/03-league-wheel-reference.html` remains historical reference material only.

## Purpose

League Wheel is a high-drama selection stage. The wheel should feel like a central football-game ceremony while the product-owned selection/save/race-safety logic remains the only authority.

The owner reference is the practical composition target: large centered black/gold wheel, Daniel/Nik framing, handwritten labels, warm stadium depth, strong gold title, gold Spin action, compact Back action and the same CM17 application shell used by Home.

## Exact current product authority

R8.34 now mirrors the current production integration seam directly in proposal markup:

- `#leagueWheelScreen`
- wheel pointer presentation;
- `#leagueWheel.leagueWheel`;
- `#leagueWheel .wheelTrack` interaction/rotation surface;
- exactly five `.wheelItem` league options;
- `#selectedLeague` live status;
- `#leagueStateNote` live state note;
- `#spinLeague.menuButton`;
- `.backButton[data-smart-back]`.

The current five canonical league options remain:

1. Premier League
2. LaLiga
3. Bundesliga
4. Serie A
5. Ligue 1

R8 does not add rerolls, extra leagues, alternate randomization or a second selection clock.

## Current r18 state contract

`js/leagueWheel.js` was independently re-read from exact current `main` after the r18 advance. The r18 ops commit does not change this product contract.

Production owns:

- normal spin timing: `4000 ms`;
- reduced-motion spin timing: `80 ms`;
- operation IDs and timer cancellation;
- random league selection;
- save success/failure;
- `League Selected` / `League Confirmed` state transition;
- Club Assignment progression;
- locked-club permanence.

### Ready

No selected league:

- result = `Spin to select league`;
- button = `SPIN WHEEL`;
- note hidden;
- Spin enabled;
- Back enabled.

### Spinning

- result = `SPINNING...`;
- button = `SPINNING...`;
- Spin disabled;
- Back disabled;
- production wheel rotation/timing remains authoritative.

### Selected

After a successful saved draw:

- product status = `League Selected`;
- selected league is shown in live DOM;
- button = `CONTINUE TO CLUB ASSIGNMENT`;
- state note explains that the selection is locked and must be confirmed to proceed.

### Confirmed

Continue changes status to `League Confirmed`, saves, then opens Club Assignment.

### Locked

If club assignment already exists:

- button = `LEAGUE LOCKED`;
- button disabled;
- note = `League and clubs are permanent for this showdown.`

### Save failure

The product restores the previous selected league/status and raises an error notice. R8 may style this error but must not mask or replace rollback behavior.

## Owner visual target

The owner reference family is the wide-desktop visual target:

- large central metallic black/gold wheel;
- prominent triangular pointer;
- central original crown hub;
- five clearly separated live league segments;
- Daniel large at left;
- Nik large at right;
- handwritten-style manager labels and descriptors;
- `CAREER MODE · SHOWDOWN 17` kicker;
- large gold `SELECT LEAGUE` title;
- `SPIN TO SELECT LEAGUE` subtitle;
- lower quote plaques;
- status/results directly below wheel;
- gold primary action and black Back action;
- compact footer identity.

The reference remains `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY`, not product truth. Official-looking marks, accidental overlaps and impossible anatomy do not become implementation requirements.

## Wheel implementation rule

The wheel itself remains browser-owned UI, not a raster image.

R8.34 uses:

- CSS circular geometry;
- conic-gradient segment fields;
- real DOM league labels;
- original textual segment glyphs (`PL`, `LL`, `BL`, `SA`, `L1`);
- original SVG crown hub;
- separate stable exterior rim/halo;
- product-state classes/data attributes for visual styling only.

Do not copy official league logos or proprietary wheel artwork.

The production implementation must retain the actual `.wheelTrack` as the rotating selection surface so current product logic can continue setting transforms directly.

## Character policy

Wide desktop uses the frozen masters:

- Manager 1 = A02 Daniel core pointing hero;
- Manager 2 = A01 Nik core thinking hero.

Character layers remain:

- decorative;
- `aria-hidden`;
- `pointer-events:none`;
- behind the real wheel/status/actions;
- unnecessary to understand or operate the screen.

No League Wheel-specific generation is accepted yet. The existing Daniel pointing pose is a safe approximation. A future wheel-specific presentation pose may be generated only as a bounded isolated `CANDIDATE` asset.

### Contact rule

The owner reference visually suggests Daniel pointing at/toward the wheel.

A future final character hand may visually approach or touch only the **stable exterior decorative rim**. It must never track, overlap or determine the rotating `.wheelTrack`, league segment selection or pointer result.

If stable rim contact cannot survive the wide-desktop browser matrix, use an air gap.

## Button / wheel exclusion rule

The wheel and action group must have disjoint bounding rectangles.

This protects against the historical visual failure where the wheel bottom could sit behind the button area. Short-desktop geometry reduces and repositions the wheel before controls are allowed to collide.

## Selected / focus hierarchy

When actionable:

- Spin/Continue uses dominant warm-gold treatment;
- Back remains black metallic;
- disabled/locked Spin becomes charcoal and visibly disabled;
- selected result is live DOM text and cannot rely on the gold wedge alone.

Focus remains explicitly visible with a high-contrast outline.

## Stadium / environment

The League Wheel reuses the Home procedural stadium system so both screens share one visual world:

- light arcs;
- crowd texture;
- stands depth;
- grass/pitch edge;
- side banners;
- vignette.

A later original stadium-only source-art replacement is allowed if it contains no baked navigation, manager labels, league marks, live status or controls.

## Responsive contract

### `>=1280px`

Full two-manager cinematic composition. Wheel remains centered and independent. At short desktop heights, wheel size/title spacing reduce before control overlap occurs.

### `<=1279px`

Daniel/Nik and decorative quote plaques are removed. Wheel remains the hero.

### `<=1179px`

Wheel/status/actions move into safe document flow. Vertical scrolling is allowed. Horizontal overflow is forbidden.

### Mobile

Character-free. The wheel remains large relative to phone width; status and actions stack beneath it. Do not force a tiny wheel beside text or characters.

## R8.34 browser proof

Six visual product states × six viewport conditions = **36/36 pass**.

Validated conditions:

- 1440×900 — wide characters visible;
- 1366×768 — wide characters visible;
- 1280×720 — wide characters visible;
- 1179×800 — character-free fallback;
- 940×700 reduced motion — character-free fallback;
- 390×844 DPR2 — character-free mobile.

Every case passed:

- exactly five league segments;
- no horizontal overflow;
- wheel/actions disjoint;
- status/actions disjoint;
- exact production Spin and Back selectors present;
- character `aria-hidden`;
- character `pointer-events:none`;
- correct character breakpoint;
- correct disabled Spin for spinning/locked;
- disabled Back while spinning;
- explicit status text.

## Practical-replica rules

Do not use the owner League Wheel screenshot as the webpage background.

Do not bake:

- league names;
- selected result;
- Spin/Continue text;
- state note;
- navigation labels;
- manager names

into wheel or stadium art.

Image generation remains limited to bounded source art. The real wheel, labels, actions and state remain HTML/CSS/JS/SVG.

## Accessibility / input

- `#selectedLeague` remains a live status surface;
- `#leagueStateNote` remains explicit text;
- decorative halo/rim receives no pointer authority;
- characters receive no pointer/focus authority;
- disabled states are semantic and visual;
- reduced motion preserves product-owned rapid completion rather than creating a separate result path;
- state meaning never depends only on color.

## CM integration notes

The visual track owns presentation only.

Before production integration, CM must re-read then-current:

- `#leagueWheelScreen` / `#leagueWheel` / `.wheelTrack` DOM;
- `js/leagueWheel.js`;
- save rollback behavior;
- reduced-motion authority;
- shared-session wheel authority if then present;
- Club Assignment transition;
- relevant browser/contract tests.

The proposal's `window.cm17LeagueProposal.renderState(...)` harness is QA-only and must not ship as an alternate selection engine.

No Firebase Rule, provider, storage or backend change is required by this visual contract.

Production `main` remains untouched by R8.34 proposal work.
