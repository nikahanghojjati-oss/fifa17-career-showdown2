# R8.18 Package 1/2 Frozen-Master Placement Contract

Status: ACTIVE VISUAL IMPLEMENTATION SPEC / NO NEW IMAGE GENERATION AUTHORIZED

Controller: `00_VISUAL_REASONING_CONTROLLER_CONTRACT.md`

Current frozen masters:

- A01 Nik Core Thinking Hero, 1086x1448, owner-approved frozen
- A02 Daniel Core Pointing Hero, 1086x1448, owner-approved frozen

Live source authority:

- `main`: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4`
- runtime asset revision: `1.9.1-r10`
- DOM/CSS authority remains current production `index.html` + `css/app.css`

This contract converts the R8.11 abstract safe-zone proof into deterministic placement rules using the now-frozen A01/A02 masters. It does not authorize replacement mock screens or new page-specific character art.

## Universal character-layer rules

1. Use the frozen masters only.
2. Characters live in a non-interactive final-art layer with `pointer-events:none`.
3. The layer sits below all real buttons, inputs, wheel labels, pack cards, status messages and focus outlines.
4. Never rasterize live DOM text or controls into the artwork.
5. Preserve each master’s full hair silhouette when uncropped.
6. When crop is required, crop torso/outer sleeve before hair, face, pointing fingertip or thinking hand.
7. Prefer CSS `object-fit:contain` and `object-position` or equivalent deterministic transforms. Do not repaint or regenerate.
8. Mirror only when later composition proves it necessary and identity/gesture meaning is preserved. Default uses the approved original orientation.
9. Tablet may reduce scale/opacity or crop shoulders. Mobile omits large characters.
10. If a character conflicts with UI, character treatment loses immediately.

## P01 Home / Main Menu

Owner direction reference:

`HOME_APPROVED_COMPOSITION_REFERENCE_R8_17_V1.png`

This is visual composition evidence only, not a shipping background screenshot.

Live DOM authority:

- `#mainMenu`
- `.fifaMenuHeading`
- `.fifaMenuGrid`
- six real `.menuTile` controls
- `.menuMusicTile`
- `.menuBottomStrip`

### Desktop wide >=1180px

Daniel:

- side: left
- pose: original A02 pointing pose
- target visual width: approximately 21-24vw, capped before the central tile/content band
- vertical anchor: upper/mid shell so face and pointing hand read above the tile row
- gesture direction: toward the central product title/content zone, never into a clickable tile label
- lower body may disappear behind the real tile field

Nik:

- side: right
- pose: original A01 thinking pose
- target visual width: approximately 21-24vw
- face/hand remain in upper right atmospheric zone
- lower body may disappear behind real tiles/music shell

Hard no-overlap regions:

- `#continueCareer`
- `#newShowdown`
- `#legacyButton`
- `#careerStatisticsButton`
- `#ruleBookButton`
- `#settingsButton`
- all media controls

### Tablet 760-1179px

- crop both to head/shoulder emphasis
- reduce opacity before moving UI
- preserve at least 24px visible separation from focused controls
- if two portraits create crowding, omit the less useful portrait before shrinking the menu grid

### Mobile <760px

- omit both large figures
- retain identity through typography, CSS atmosphere and optional deterministic compact avatar chips only

### Validation state

Owner has approved the visual direction. Exact live-DOM obstruction validation remains required before implementation credit.

## P02 Create Showdown

Live DOM authority:

- `#createShowdown`
- `.setupBox`
- `#showdownName`
- `#managerOne`
- `#managerTwo`
- `#roundAmount`
- `#startShowdown`
- Back

R8.11 proves the central proposal card can reach 620px and still leave strong outer rails.

### Desktop wide >=1180px

Daniel:

- left outer rail
- A02 pointing gesture may aim inward toward the form title/upper card edge
- fingertip must remain outside `.setupBox`
- maximum intrusion should stop before the central content-safe zone

Nik:

- right outer rail
- A01 thinking pose balances Daniel without reaching toward form controls
- thinking hand remains outside form card bounds

Form card:

- always above art layer
- no character body, finger, face or glow may cross an input label, field, season-length choice, validation text or Start Showdown button

### Tablet

- shoulder/head crops or one-side omission
- form remains full readability priority

### Mobile

- no large character figures

### Generation decision

CLOSED. A01/A02 are sufficient. Create-specific character art is prohibited.

## P03 League Wheel

Live DOM authority:

- `#leagueWheelScreen`
- `.wheelContainer`
- `.wheelPointer`
- `#leagueWheel`
- `.wheelTrack`
- five live `.wheelItem` labels
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague`
- Back

### Desktop wide >=1180px

Daniel:

- left outer rail
- original A02 pointing pose is specifically useful here
- fingertip may visually direct attention toward the wheel but must terminate outside `.wheelContainer`
- do not cover canonical league labels or pointer

Nik:

- right outer rail
- original A01 thinking pose
- face/hand stay above or beside the wheel band

Absolute free zone:

- `#spinLeague` CTA and its lower action band must remain free of character hands/torso
- `#leagueStateNote` shared/waiting/locked messaging remains fully readable

### Tablet

- crop/omit art before reducing wheel clarity

### Mobile

- no full figures

### Generation decision

CLOSED. No League-specific pose is allowed.

## P04 Club Assignment

Live DOM authority:

- `#clubWheelScreen`
- `.clubAssignmentShell`
- `#clubAssignmentLeague`
- `#clubPackStatus`
- `.clubRevealProgress`
- `#clubCardOne`
- `#clubCardTwo`
- `.clubVs`
- `#clubRivalryConfirmation`
- `#openClubPack`
- `#continueClubAssignment`
- `#clubAssignmentBack`

### Desktop wide >=1180px

This is the most constrained Package 1/2 character surface.

Daniel:

- extreme left edge only
- head/shoulder or narrow upper-body crop preferred
- pointing hand may be cropped out entirely if it approaches the 980px pack shell

Nik:

- extreme right edge only
- head/shoulder or narrow upper-body crop preferred
- thinking hand may remain only if fully outside the real pack shell

Pack UI:

- real pack cards, reveal progression, versus state, confirmation, status and CTA own the screen
- no character reaches into or touches a pack

C01/C02 club-pack interaction characters remain permanently CANCELLED.

### Tablet and mobile

- omit large characters before compressing the pack shell

### Generation decision

CLOSED.

## Owner-approved Home reference usage

The Home reference proves the preferred visual rhythm:

- black/gold stadium atmosphere
- Daniel left, Nik right
- strong editorial identity above a real navigational tile field
- character faces readable without becoming button surfaces
- primary navigation remains visually stronger than decorative character lower bodies

Do not copy inaccurate text, navigation labels, fake controls or generated iconography from the reference into production. The real DOM always wins.

## QA matrix required before Package 3

For each Home/Create/League/Club composition, validate at minimum:

- desktop 1600x900
- compact desktop / tablet landscape around 1024x768
- mobile portrait around 390x844
- default and reduced-motion preference where motion is present
- focus-visible state on every primary control near artwork
- no character hit-testing (`pointer-events:none`)
- no clipped hair/face at intended desktop placement
- no pointer/hand overlap with active control labels
- no hidden validation/status text
- no horizontal overflow introduced by art layer

Pass rule: artwork changes or disappears before any functional UI compromise.

## Current asset-generation state

CLOSED.

No new raster asset is justified by this placement-validation stage.

## Exact next task

Build a proposal-only deterministic placement proof using the exact current live DOM geometry for Home, Create Showdown, League Wheel and Club Assignment, with A01/A02 represented as the frozen masters or dimensionally accurate placeholders. Validate the QA matrix. Do not generate A03/A04 yet.

After all four pass, continue Package 3 exact-DOM reconciliation and only then evaluate whether A03/A04 have a genuine mapped need.
