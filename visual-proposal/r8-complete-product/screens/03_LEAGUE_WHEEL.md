# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE r17 SCREEN CONTRACT — R8.33 REFERENCE-FAITHFUL CONSUMER BROWSER-PROVEN / OWNER FINAL REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Production source anchor: `e624d19e04c0ca56f33fa7f0d25fdcc42eb99eda` / runtime `1.9.1-r17`.

Current proposal consumer:

- `prototypes/03b-league-wheel-cinematic-reference-faithful-r8-33.html`
- `prototypes/r8-33-league-wheel-reference-faithful.css`
- shared presentation base: `prototypes/r8-33-home-reference-faithful.css`
- browser proof: `evidence/LEAGUE_WHEEL_REFERENCE_FAITHFUL_R8_33_BROWSER_PROOF_2026-09-10.md`

The predecessor `prototypes/03-league-wheel-reference.html` remains historical reference material only.

## Purpose

League Wheel is a high-drama selection stage. The wheel must feel like a central football-game ceremony while the product-owned selection/save/race-safety logic remains the only authority.

The owner reference is now the practical composition target: large centered black/gold wheel, Daniel/Nik framing, handwritten labels, warm stadium depth, strong gold title, gold Spin action, compact Back action and the same CM17 application shell used by Home.

## Exact current product authority

Preserve the real production DOM/state roles:

- screen heading `SELECT LEAGUE`;
- wheel pointer;
- `#leagueWheel`;
- `.wheelTrack`;
- the five canonical league options;
- `#selectedLeague` live status;
- `#leagueStateNote` live state note;
- `#spinLeague`;
- Back.

The current five canonical league options remain:

1. Premier League
2. LaLiga
3. Bundesliga
4. Serie A
5. Ligue 1

R8 does not add rerolls, extra leagues, alternate randomization or a second selection clock.

## Current r17 state contract

Current `js/leagueWheel.js` owns:

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

The product restores the previous selected league/status and raises an error notice. R8 may style this error but must not mask or replace the rollback behavior.

## Owner visual target — R8.33 correction

The prior screen contract was intentionally conservative and said omission of characters was preferred. That produced safe geometry but does not match the owner's approved visual ambition.

The corrected wide-desktop target is the owner reference family:

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

R8.33 uses:

- CSS circular geometry;
- conic-gradient segment fields;
- real DOM league labels;
- original textual segment glyphs (`PL`, `LL`, `BL`, `SA`, `L1`);
- original SVG crown hub;
- separate stable exterior rim/halo;
- product-state classes/data attributes for visual styling only.

Do not copy official league logos or proprietary wheel artwork.

The final production implementation must keep the actual `.wheelTrack` as the rotating selection surface so the current product logic can continue setting transforms directly.

## Character policy

Wide desktop may use the frozen masters:

- Manager 1 = A02 Daniel core pointing hero;
- Manager 2 = A01 Nik core thinking hero.

This is now the preferred wide-desktop composition, not an optional afterthought.

Character layers remain:

- decorative;
- `aria-hidden`;
- `pointer-events:none`;
- behind the real wheel/status/actions;
- unnecessary to understand or operate the screen.

No League Wheel-specific generation has yet been accepted. The existing Daniel pointing pose is a safe approximation. A future wheel-specific presentation pose may be generated only as a bounded isolated `CANDIDATE` asset.

### Contact rule

The owner reference visually suggests Daniel pointing at/toward the wheel.

A future final character hand may visually approach or touch only the **stable exterior decorative rim**. It must never track, overlap or determine the rotating `.wheelTrack`, league segment selection or pointer result.

If stable rim contact cannot survive the wide-desktop browser matrix, use an air gap.

## Button / wheel exclusion rule

The wheel and the action group must have disjoint bounding rectangles.

This directly protects against the prior visual failure where the wheel bottom could sit behind the button area.

R8.33 short-desktop rules reduce and reposition the wheel before allowing the controls to collide.

The browser proof initially detected a real collision at 1366×768 and 1280×720. The short-desktop geometry was corrected and the full matrix rerun successfully.

## Selected / focus hierarchy

When actionable:

- Spin/Continue uses the dominant warm-gold treatment;
- Back remains black metallic;
- disabled/locked Spin becomes charcoal and visibly disabled;
- selected result is live DOM text and cannot rely on the gold wedge alone.

Focus remains explicitly visible with a high-contrast outline.

## Stadium / environment

R8.33 reuses the Home procedural stadium system so Home and League Wheel share one visual world:

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

Wheel/status/actions move into safer document flow. Vertical scrolling is allowed. Horizontal overflow is forbidden.

### Mobile

Character-free. The wheel remains large relative to phone width; status and actions stack beneath it. Do not force a tiny wheel beside text or characters.

## R8.33 browser proof

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

into the wheel or stadium art.

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

- `#leagueWheel` / `.wheelTrack` DOM;
- `js/leagueWheel.js`;
- save rollback behavior;
- reduced-motion authority;
- shared-session wheel authority if then present;
- Club Assignment transition;
- relevant browser/contract tests.

The proposal's `window.cm17LeagueProposal.renderState(...)` harness is QA-only and must not ship as an alternate selection engine.

Production `main` remains untouched by R8.33 proposal work.
