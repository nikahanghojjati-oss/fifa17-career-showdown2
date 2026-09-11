# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE r18 SCREEN CONTRACT — R8.39 STADIUM + LAYOUT BROWSER-PROVEN / DANIEL LEAGUE-SPECIFIC SOURCE ART OPEN / OWNER FINAL REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Production source anchor re-resolved 2026-09-11: `3c5fb2589414f8f497d1f7cb174200ef84290431`. That main commit is accounting/provenance-only for the already-integrated r18 Terminal Close lifecycle; it does not authorize any visual integration.

Current proposal consumer:

- `prototypes/03c-league-wheel-owner-fidelity-r8-39.html`
- `prototypes/r8-39-league-owner-fidelity.css`
- stadium source: `assets/procedural/league-stadium-r8-38.svg`
- browser proof: `evidence/LEAGUE_WHEEL_R8_39_STADIUM_LAYOUT_BROWSER_PROOF_2026-09-11.md`

## Product authority

Visual owns presentation only. Production keeps all game authority. The proposal preserves these literal integration seams:

- `#topHeader`
- `#seasonIndicator`
- `#leagueWheelScreen`
- `#leagueWheel.leagueWheel`
- `.wheelTrack`
- exactly five `.wheelItem`
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague.menuButton`
- `.backButton[data-smart-back]`

The canonical league set remains Premier League, LaLiga, Bundesliga, Serie A and Ligue 1.

`js/leagueWheel.js` remains the sole production authority for spin timing, reduced-motion timing, random selection, cancellation, save/rollback, confirmation, progression to Club Assignment and locked-club permanence. The local state renderer in the proposal is QA-only and must never ship as a second game engine.

## Header / navigation rule

The owner reference contains a larger global navigation/search/profile treatment that production does not currently own. R8.39 does **not** invent that product layer.

Instead, the proposal restyles the existing `#topHeader` presentation into a lean translucent cinematic header while retaining existing header/state authority. It may display screen context and `#seasonIndicator`; it must not silently create Search/Profile/global-route product behavior.

## Owner visual target

The supplied 16:9 League Wheel reference remains `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY`.

R8.39 targets:

- black/gold cinematic stadium atmosphere with visible roof and floodlight structure;
- lean translucent header and compact footer;
- gold brush-like `SELECT LEAGUE` title with physical clearance from the header;
- Daniel large on the left and Nik large on the right;
- lower-centered high-reflectance gold/black wheel;
- gold handwritten manager identity treatment with condensed descriptors;
- meaningful original league marks rather than text initials/emoji;
- side stadium banners and lower quote plaques;
- explicit ready `SPIN WHEEL` and production-compatible post-selection states.

The reference cannot override product logic or be baked into the app as a screenshot.

## Stadium source layer

`assets/procedural/league-stadium-r8-38.svg` is an original deterministic source layer. It contains roof structure, floodlight arcs, haze, crowd tiers, pitch, blank banner cloth and vignette. It contains no managers, wheel, controls, league names, selected state or live UI.

Static banner wording is overlaid by the browser presentation, not baked into the source layer.

A later higher-fidelity stadium asset may replace this layer only if it obeys the same clean-background contract.

## Wheel implementation

The wheel is browser-owned UI, not raster art. It uses live DOM league names and a real `.wheelTrack` with CSS/SVG presentation around it.

R8.39 replaces temporary text/emoji marks with original inline SVG identities:

- crowned-league mark for Premier League direction;
- interlocking double-L for LaLiga direction;
- generic player/kick + ball mark for Bundesliga direction;
- angular A for Serie A direction;
- ring/one mark for Ligue 1 direction.

These are proposal identities, not reproductions of official competition trademarks. They may later be replaced by legally/operationally approved logo assets without changing selection logic.

## State presentation

QA states: `ready`, `spinning`, `selected`, `confirmed`, `locked`, `save-error`.

Production owns actual state transitions. In the proposal:

- Ready: Spin enabled; Back enabled.
- Spinning: Spin disabled; Back disabled.
- Selected / Confirmed: primary action presents Continue to Club Assignment.
- Locked: primary action disabled.
- Save error: user can retry; no false lock presentation.

`#selectedLeague` and `#leagueStateNote` remain in the DOM for runtime/accessibility compatibility even when the owner-facing composition presents visible status in the title/subtitle region.

## Character policy

Manager 1 = Daniel. Manager 2 = Nik.

Current temporary wide-desktop sources:

- Daniel: A02 core pointing hero.
- Nik: A01 core thinking hero.

A02 is **not owner-final for League Wheel** because it points toward the viewer. It is a layout/lighting stand-in only.

Required next character source: Daniel with the same approved identity and dark suit, isolated on transparency, arm/hand directed laterally toward the wheel, with warm stadium rim light. The image must contain no wheel, league mark, text, button, background or product state. Any generated result remains `CANDIDATE` until inserted into this real browser assembly, re-tested and owner-reviewed.

Characters remain `aria-hidden`, pointer-inert and unnecessary for operating the screen.

## Responsive / geometry contract

Wide desktop retains the two-manager cinematic composition. At `<=1179px`, characters, labels and quote plaques are removed before they can compress the product surface. Mobile keeps the wheel and live actions as the hero composition.

R8.39 browser matrix: six states × six viewports = **36/36 PASS**.

Validated:

- 1366×768 DPR1
- 1440×900 DPR1
- 1280×720 DPR1
- 1179×800 DPR1
- 940×700 DPR1 reduced motion
- 390×844 DPR2

Checks include no horizontal overflow, no title/header overlap, no wheel/action overlap, exactly five wheel items, correct fallback character removal, and expected QA disabled states.

## Production-integration gate

Production `main` remains untouched by Visual.

Before integration, CM must re-read then-current production contracts and reconcile the presentation onto production state. Do not port the proposal QA harness as product logic. No merge or production swap occurs before owner review and CM reconciliation.
