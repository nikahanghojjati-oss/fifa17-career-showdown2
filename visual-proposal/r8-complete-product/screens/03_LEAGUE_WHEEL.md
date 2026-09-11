# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE r18 SCREEN CONTRACT — R8.41 OWNER-FIDELITY BROWSER-PROVEN / OWNER REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Production source anchor re-resolved 2026-09-11: `3c5fb2589414f8f497d1f7cb174200ef84290431`. That main commit is accounting/provenance-only for the already-integrated r18 Terminal Close lifecycle; it does not authorize visual integration.

Current branch-backed consumer remains:

- `prototypes/03c-league-wheel-owner-fidelity-r8-39.html`
- `prototypes/r8-39-league-owner-fidelity.css`

Current R8.41 owner-review snapshot is persisted in the Showdown visual Library at `/Showdown visual/R8_41_League/league-r8-41c-polished.html`, with exact browser proof and source-art candidates alongside it. Evidence: `evidence/LEAGUE_WHEEL_R8_41_OWNER_FIDELITY_BROWSER_PROOF_2026-09-11.md`.

The R8.41 asset-bearing snapshot is deliberately kept proposal-only until owner visual review; production `main` is untouched.

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

The owner reference contains a larger global navigation/search/profile treatment that production does not currently own. The visual proposal does **not** invent that product layer.

Instead, R8.41 keeps the existing `#topHeader` authority and restyles it as a lean translucent cinematic header carrying CM17 identity, screen context and `#seasonIndicator`. It does not silently add Search/Profile/global-route behavior.

## Owner visual target

The supplied 16:9 League Wheel reference remains `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY`.

R8.41 targets:

- high-fidelity black/gold stadium with visible roof, warm floodlight arc, crowd depth, pitch edge and haze;
- lean translucent header and compact footer;
- gold rough/brush-directed `SELECT LEAGUE` DOM title with physical clearance from the header;
- Daniel large at left with a lateral gesture aimed at the wheel;
- Nik large at right with recovered negative space around the wheel;
- lower-centered high-reflectance gold/black wheel;
- gold handwritten manager identity treatment with condensed descriptors placed in stadium negative space;
- rich original league marks rather than initials or emoji;
- lower quote plaques;
- explicit ready `SPIN WHEEL` and production-compatible post-selection states.

The reference cannot override product logic or be baked into the app as a screenshot.

## Stadium source layer

The R8.41 browser assembly uses the already-generated clean stadium candidate persisted as `/Showdown visual/R8_41_League/LEAGUE_STADIUM_R8_41_CANDIDATE.webp`.

It contains only stadium architecture, crowd, warm floodlights, pitch edge, haze and black/gold atmosphere. It contains no managers, wheel, league identities, navigation, buttons, live state or product text.

The stadium is therefore valid source art rather than a generated whole-screen substitute. It remains `CANDIDATE` until owner approval.

## Character policy

Manager 1 = Daniel. Manager 2 = Nik.

R8.41 uses:

- Daniel: lateral wheel-pointing proposal candidate persisted as `/Showdown visual/R8_41_League/LEAGUE_DANIEL_LATERAL_POINT_R8_41_CANDIDATE.webp`;
- Nik: A01 core thinking hero.

Daniel’s layer is now in front of the decorative outer wheel rim so his fingertip no longer disappears underneath the wheel. The gesture may visually meet the stable decorative rim, but no character pixel carries wheel state, interaction or selection authority.

Warm stadium-derived edge light and contrast balancing are applied independently to Daniel and Nik so the characters sit in the same lighting environment as the stadium.

Characters remain `aria-hidden`, pointer-inert and unnecessary for operating the screen.

## League identity family

R8.41 replaces the previous cheap temporary marks in the actual browser assembly with a richer deterministic original SVG family inspired by the owner-approved visual direction:

- Premier direction: crowned-lion shield language;
- LaLiga direction: solar-football language;
- Bundesliga direction: dynamic-player + ball language;
- Serie A direction: angular-A + tricolor language;
- Ligue 1 direction: angular L/1 shield language.

These are original proposal identities, not reproductions of official competition trademarks. They are browser-owned SVG/component work, not crops from a generated logo board.

Reference composition order is now matched visually:

- Premier League — top;
- LaLiga — left;
- Bundesliga — right;
- Serie A — lower-left;
- Ligue 1 — lower-right.

## Wheel implementation

The wheel remains browser-owned UI, not raster art. It uses live DOM league names, real `.wheelItem` nodes and a real `.wheelTrack`.

R8.41 retunes material without changing product authority:

- brighter layered gold rim;
- reflective halo and pointer;
- metallic segment separators;
- subtle brushed texture;
- stronger gold/black contrast;
- real center hub;
- no baked selection state.

## Typography / labels

`SELECT LEAGUE` remains real DOM text. R8.41 uses a condensed italic display stack, gold material gradient, rough displacement and brush-streak underline to approach the owner reference without turning the title into raster art.

Manager names/nicknames remain browser text and are positioned in stadium negative space rather than on top of the wheel. Descriptor stacks remain separate condensed text.

Typography remains owner-reviewable; no font treatment is owner-final until explicitly approved.

## State presentation

QA states: `ready`, `spinning`, `selected`, `confirmed`, `locked`, `save-error`.

Production owns actual state transitions. In the proposal:

- Ready: Spin enabled; Back enabled.
- Spinning: Spin disabled; Back disabled.
- Selected / Confirmed: primary action presents Continue to Club Assignment.
- Locked: primary action disabled.
- Save error: user can retry; no false lock presentation.

`#selectedLeague` and `#leagueStateNote` remain in the DOM for runtime/accessibility compatibility even when the owner-facing composition presents visible status in the title/subtitle region.

## Responsive / geometry contract

Wide desktop retains the two-manager cinematic composition. At fallback/mobile sizes, character/label/quote layers fail closed before they can compress the live wheel.

R8.41 introduces explicit short-desktop and reduced-width wheel scaling after browser QA found real vertical collisions at 1280×720 and 940×700. Those defects were fixed before final proof.

R8.41 browser matrix: six states × six viewport conditions = **36/36 PASS**.

Validated:

- 1440×900 DPR1
- 1366×768 DPR1
- 1280×720 DPR1
- 1179×800 DPR1
- 940×700 DPR1 reduced motion
- 390×844 DPR2

Checks include no horizontal overflow, no title/header overlap, no wheel/action overlap, exactly five wheel items, manager-label/wheel exclusion, fallback character removal and expected disabled-state presentation.

## Image-generation execution rule

Whole-screen Select League generations remain `CONCEPT_ONLY / REJECTED_AS_IMPLEMENTATION`.

The current stadium and Daniel candidates have already been integrated into the real page. No further image-generation call is needed for this checkpoint. The browser render is the owner-review surface.

## Production-integration gate

Production `main` remains untouched by Visual.

Before integration, CM must re-read then-current production contracts and reconcile the presentation onto production state. Do not port the proposal QA harness as product logic. No merge or production swap occurs before owner review and CM reconciliation.
