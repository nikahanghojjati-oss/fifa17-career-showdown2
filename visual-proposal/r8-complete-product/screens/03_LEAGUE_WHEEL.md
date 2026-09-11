# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE r18 SCREEN CONTRACT — R8.42 REFERENCE-GEOMETRY + LIGHTING BROWSER-PROVEN / OWNER REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Production source anchor re-resolved 2026-09-11: `3c5fb2589414f8f497d1f7cb174200ef84290431`. That commit is accounting/provenance-only for the already-integrated r18 Terminal Close lifecycle and does not authorize visual integration.

Branch-backed structural consumer remains:

- `prototypes/03c-league-wheel-owner-fidelity-r8-39.html`
- `prototypes/r8-39-league-owner-fidelity.css`

The exact asset-bearing R8.42 owner-review snapshot is persisted in the Showdown visual Library at `/Showdown visual/R8_42_League/league-r8-42c-reference-geometry.html` with source-art candidate, screenshots and browser QA beside it.

Evidence: `evidence/LEAGUE_WHEEL_R8_42_REFERENCE_GEOMETRY_LIGHTING_BROWSER_PROOF_2026-09-11.md`.

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

Canonical leagues remain Premier League, LaLiga, Bundesliga, Serie A and Ligue 1.

`js/leagueWheel.js` remains sole production authority for spin timing, reduced-motion timing, random selection, cancellation, save/rollback, confirmation, progression to Club Assignment and locked-club permanence. The proposal state renderer is QA-only and must never ship as a second game engine.

## Header / navigation rule

The owner reference contains global navigation/search/profile affordances that production does not currently own. The visual proposal does **not** invent that product layer.

R8.42 keeps the existing `#topHeader` authority and only restyles it as a lean translucent cinematic header carrying CM17 identity, screen context and `#seasonIndicator`.

## Owner visual target

The supplied 16:9 Select League reference remains `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY`.

R8.42 targets:

- premium black/gold stadium with visible roof, continuous warm floodlights, crowd depth, pitch edge and haze;
- lean translucent header and compact footer;
- gold rough/brush-directed `SELECT LEAGUE` DOM title with physical header clearance;
- Daniel left with the lateral wheel-pointing gesture from the reference;
- Nik right with reference-like face scale, height and wheel spacing;
- bright gold/black wheel with real DOM/SVG league items;
- handwritten manager identity treatment with separate condensed descriptors;
- deterministic premium original league marks rather than initials or emoji;
- explicit ready `SPIN WHEEL` and production-compatible post-selection states.

The reference cannot override product logic and cannot be baked into the app as a screenshot.

## Stadium source layer

The browser assembly uses the clean stadium source candidate persisted as `/Showdown visual/R8_41_League/LEAGUE_STADIUM_R8_41_CANDIDATE.webp`.

It contains stadium architecture, crowd, warm floodlights, pitch edge, haze and black/gold atmosphere only. It contains no managers, wheel, league identities, navigation, buttons, live state or product text.

The stadium therefore remains valid source art rather than a generated whole-screen substitute. It remains `CANDIDATE` until owner approval.

## Character policy

Manager 1 = Daniel. Manager 2 = Nik.

R8.42 wide-desktop owner-review sources:

- Daniel: `/Showdown visual/R8_42_League/LEAGUE_DANIEL_REFERENCE_EXTRACT_R8_42_CANDIDATE.png` — isolated from the owner-provided Select League reference by deterministic masking/alpha cleanup; no new image generation was used;
- Nik: A01 core thinking hero, repositioned/rescaled against the reference geometry.

Daniel's R8.41 synthetic CSS edge glow was removed. The R8.42 hand now approaches the outer decorative rim with controlled contact instead of covering a large wheel area. The character may visually meet the stable rim, but no character pixel carries wheel state, hit targets or selection authority.

Characters remain `aria-hidden`, pointer-inert and unnecessary for operating the screen.

## Geometry authority

R8.42 uses the owner reference as measurable composition evidence rather than adjusting placement by eye alone.

At 1366×768, a face-anchor comparison against the supplied 1536×864 reference scaled to the same viewport yielded approximately:

- Daniel target x≈233, y≈175, width≈138; R8.42 x≈238, y≈177, width≈131;
- Nik target x≈1030, y≈155, width≈158; R8.42 x≈1032, y≈157, width≈153.

These measurements are composition-only checks, not biometric identity authority.

The wheel is modestly reduced/offset relative to the centered title so manager/wheel spacing follows the asymmetric reference rather than a generic centered-card layout.

## League identity family

The real browser assembly uses a deterministic original SVG/component family:

- Premier direction: crowned-lion shield language;
- LaLiga direction: solar-football language;
- Bundesliga direction: dynamic-player + ball language;
- Serie A direction: angular-A + tricolor language;
- Ligue 1 direction: angular L/1 shield language.

These are original proposal identities, not reproductions of official competition trademarks. They are not crops from a generated logo-board screenshot.

Reference composition order:

- Premier League — top;
- LaLiga — left;
- Bundesliga — right;
- Serie A — lower-left;
- Ligue 1 — lower-right.

## Wheel implementation

The wheel remains browser-owned UI, not raster art. It uses live DOM league names, real `.wheelItem` nodes and a real `.wheelTrack`.

Presentation includes layered gold rim materials, reflective halo/pointer, metallic segment separators, subtle brushed texture, gold/black contrast and a real center hub. No selection state is baked into source imagery.

## Typography / labels

`SELECT LEAGUE` remains real DOM text. Manager names/nicknames remain browser text. Descriptor stacks remain separate condensed text.

Typography remains owner-reviewable; no font treatment is owner-final until explicitly approved.

## State presentation

QA states: `ready`, `spinning`, `selected`, `confirmed`, `locked`, `save-error`.

Production owns actual transitions. Proposal presentation:

- Ready: Spin enabled; Back enabled.
- Spinning: Spin disabled; Back disabled.
- Selected / Confirmed: primary action presents Continue to Club Assignment.
- Locked: primary action disabled.
- Save error: retry remains available with no false lock presentation.

`#selectedLeague` and `#leagueStateNote` remain in the DOM for runtime/accessibility compatibility even when visible status is presented in the title/subtitle region.

## Responsive / geometry contract

Wide desktop retains the two-manager cinematic composition. At fallback/mobile widths, character/label/quote layers fail closed before they can compress the live product surface.

R8.42 full browser matrix: six states × six viewport conditions = **36/36 PASS**.

Validated:

- 1440×900 DPR1
- 1366×768 DPR1
- 1280×720 DPR1
- 1179×800 DPR1
- 940×700 DPR1 reduced motion
- 390×844 DPR2

Checks include no horizontal overflow, no title/header overlap, no wheel/action overlap, exactly five wheel items, fallback character removal and expected disabled-state presentation.

## Image-generation execution rule

Whole-screen Select League generations remain `CONCEPT_ONLY / REJECTED_AS_IMPLEMENTATION`.

R8.42 used no new image-generation call. The browser render is the owner-review surface. The image-generation hard gate remains locked pending owner review.

## Production-integration gate

Production `main` remains untouched by Visual.

Before any integration, CM must re-read then-current production contracts and reconcile presentation onto production state. Do not port the proposal QA harness as product logic. No merge or production swap occurs before owner review and CM reconciliation.