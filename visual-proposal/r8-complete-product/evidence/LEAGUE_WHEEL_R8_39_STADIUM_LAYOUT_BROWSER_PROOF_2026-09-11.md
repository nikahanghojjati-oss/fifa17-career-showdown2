# League Wheel R8.39 — Stadium + Layout Browser Proof

Status: `ASSEMBLED_PROPOSAL` / owner final visual approval pending / production integration not authorized.

## Scope

R8.39 continues Screen 03 only. It does not modify production `main`, Firebase, Firestore Rules, save authority, random selection, timers, shared-session logic, or production routing.

The browser assembly is:

- `prototypes/03c-league-wheel-owner-fidelity-r8-39.html`
- `prototypes/r8-39-league-owner-fidelity.css`
- `assets/procedural/league-stadium-r8-38.svg`

The stadium source layer is an original deterministic SVG with no manager pixels, wheel, button, league name, selection state, or product UI baked into it. Live presentation remains DOM-owned.

## Production seams retained

The assembly preserves:

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

The local six-state renderer is QA-only and must not replace `js/leagueWheel.js` in production.

## Owner-feedback corrections represented

- `SELECT LEAGUE` is physically separated from the lean header.
- The top header is translucent and restyles existing header authority rather than inventing Search/Profile/global navigation.
- Footer is reduced to a thin translucent strip.
- Stadium is now a separate reusable source layer instead of CSS dots or a whole-screen generated image.
- Manager labels are moved outward from faces/clothing and use a cleaner local script treatment.
- Five temporary text/emoji league marks were replaced with original inline SVG identities: crowned-league mark, interlocking double-L direction, kick/player mark, angular A, and Ligue-1 ring/one mark.
- Wheel rim, halo, reflections and metallic bevel remain browser-built.
- Character art remains decorative and pointer-inert.

## Chromium matrix

Six states were checked at each viewport: `ready`, `spinning`, `selected`, `confirmed`, `locked`, `save-error`.

Validated viewport conditions:

- 1366×768 DPR1
- 1440×900 DPR1
- 1280×720 DPR1
- 1179×800 DPR1
- 940×700 DPR1 with reduced motion
- 390×844 DPR2

Result: **36 / 36 PASS** after correcting initial short-height wheel/action collisions at 1280×720 and 940×700.

Checks include:

- no horizontal overflow;
- no title/header collision;
- no wheel/action collision;
- exactly five wheel items;
- characters/manager labels absent at `<=1179px`;
- Spin disabled only for `spinning` and `locked` QA states;
- Back disabled only for `spinning` QA state.

Measured ready-state clearances after the fix:

- 1366×768: wheel-to-actions ≈ 27 px; title-to-header ≈ 21 px.
- 1440×900: wheel-to-actions ≈ 159 px; title-to-header ≈ 21 px.
- 1280×720: wheel-to-actions ≈ 62 px; title-to-header ≈ 11 px.
- 1179×800: wheel-to-actions ≈ 40 px; title-to-header ≈ 29 px.
- 940×700: wheel-to-actions ≈ 68 px; title-to-header ≈ 13 px.
- 390×844 DPR2: wheel-to-actions ≈ 172 px; title-to-header ≈ 13 px.

## Still open before owner-final League approval

1. Daniel's current A02 source master points toward the viewer. It remains only a layout stand-in. The required League-specific source asset is Daniel in the same identity/suit with a lateral gesture toward the wheel, isolated on transparency with no wheel/UI/background baked into the image.
2. Nik may receive a bounded lighting-quality refinement only if needed after Daniel is replaced.
3. Final optical color/lighting balance should be judged after the lateral Daniel source is composited.
4. Owner must review the real Chromium render; no whole-screen image-generation output can satisfy this gate.
