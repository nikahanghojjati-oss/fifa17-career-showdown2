# R8.10 Package 1 + 2 Exact DOM Presentation Specification

Status: IMPLEMENTATION-READY VISUAL SPEC / PROPOSAL ONLY / NO LIVE ACTIVATION

Runtime authority at specification seal:

- `main`: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4`
- asset revision: `1.9.1-r10`
- canonical DOM: current `index.html`
- current CSS base: `css/app.css`

This specification does not redesign runtime behavior. It defines how a later implementation can apply the approved R8.5 black/gold visual system to the exact live DOM while preserving all real controls and state semantics.

## 1. Layering contract

The visual implementation should remain additive and easy for the master developer to review.

Recommended load/order:

1. existing `css/app.css`
2. proposed `css/r8-black-gold-presentation.css`
3. proposed `css/r8-final-art-layer.css`
4. existing runtime scripts
5. optional visual-only `js/r8-final-art-layer.js`

The final-art layer must never own routing, storage, Firebase, scoring, save mutation, pairing or results state.

Decorative layers must use `pointer-events:none`.

Real buttons, inputs, selects, status text, timers and cards must remain actual DOM elements above artwork.

## 2. Proposed free design tokens

Do not replace existing functional variables inside `app.css`. Add R8 presentation tokens in the proposal layer and map existing components into them.

```css
:root{
  --r8-black:#080b0e;
  --r8-ink:#10151a;
  --r8-panel:rgba(10,14,18,.90);
  --r8-panel-soft:rgba(18,22,26,.82);
  --r8-gold:#f3cc4f;
  --r8-gold-deep:#b98216;
  --r8-gold-line:rgba(243,204,79,.56);
  --r8-cream:#f5f0e4;
  --r8-muted:#bdb49a;
  --r8-success:#7fd77a;
  --r8-warning:#f0bd45;
  --r8-danger:#dc6f6f;
  --r8-shadow:0 16px 40px rgba(0,0,0,.42);
  --r8-glow:0 0 24px rgba(243,204,79,.18);
  --r8-display:"Barlow Condensed","Arial Narrow","Segoe UI",sans-serif;
  --r8-ui:"Segoe UI","Helvetica Neue",Arial,sans-serif;
}
```

Zero-dollar rule: use the already loaded Barlow Condensed and system fonts. No paid font, stock art or paid icon dependency is introduced by this proposal.

## 3. Global shell

Authority: `#app`, `#topHeader`, `.brand`, `.seasonIndicator`, `main`, `.screen`, `footer`.

Target behavior:

- keep the current full-height app structure and scroll containment
- convert light silver header to dark metallic black/charcoal
- use a thin gold selected rail rather than large decorative header art
- maintain the season indicator as high-contrast status, not an ornamental plaque
- footer remains compact and secondary
- route focus target outline remains visible and must not be replaced by glow-only styling

Recommended visual mapping:

- `#topHeader`: `linear-gradient(180deg,#11171c,#090d10)` with bottom gold hairline
- `.brand h1`: warm cream/white; `.brand p`: gold
- `.seasonIndicator`: dark panel, gold left rail, cream text
- `.screen>h2`: remove white paper block; use transparent/dark presentation with gold rail and cream title while retaining DOM size/readability
- `.menuButton`: primary actions use gold fill only for the single strongest action on a screen; secondary actions stay dark with gold/cyan-neutral border treatment
- `.backButton`: dark/transparent secondary style with visible focus state

Do not recolor validation/error/success states into generic gold. State color semantics remain distinct.

## 4. Responsive composition zones

These zones govern character/final art and are not new DOM columns.

Desktop wide, approximately >= 1180px:

- left art zone: 0% to 24% viewport width
- primary content safe zone: 26% to 74%
- right art zone: 76% to 100%
- bottom CTA/status safe zone: final 18% of viewport height should remain substantially unobstructed when a screen places primary actions there

Desktop compact/tablet landscape, approximately 760px to 1179px:

- side art can overlap background atmosphere but should not cross into the central 58% content zone
- character opacity may fall to 70-85%
- crop at shoulders/torso before shrinking primary controls
- preserve at least 24px visible separation between face/hand silhouettes and focused controls

Mobile/portrait below approximately 760px:

- full-height character art is optional and normally omitted
- use small deterministic identity crop only when it improves orientation
- never force two large portraits around narrow forms or wheels
- retain black/gold atmosphere, crown/brush accents and identity through CSS instead

If a character asset conflicts with a control at any breakpoint, the character fades/crops/disappears. The control never moves solely to preserve artwork.

## 5. S01 Startup / Loading

Authority selectors: `#loadingScreen`, `.startupScene`, `.startupAthleteFrame`, `#startupAthlete`, `.startupIdentity`, `.startupStatus`, `#loadingText`, `.startupSaveNote`, `.startupPhotoCredit`.

Runtime facts that must remain visible:

- Career Mode Showdown identity
- loading/progress status
- local-save note
- photo credit if the licensed Reus image remains

Presentation plan:

- replace the current blue/silver atmosphere with black/gold stadium-light treatment using CSS first
- preserve `#startupAthlete` until the master developer explicitly chooses whether to keep licensed Reus or substitute reusable approved manager art
- do not generate a new loading-only manager pose
- `startupIdentity` should remain in a content-safe region and not be baked into background art
- gold motion rails and diagonal geometry may be CSS pseudo-elements
- loading pulse may use gold but must retain reduced-motion compatibility in implementation

Generation decision now: CLOSED. No new startup-specific image is justified.

## 6. S02 Home / Main Menu

Authority selectors: `#mainMenu`, `.fifaMenuShell`, `.fifaMenuHeading`, `.fifaMenuGrid`, `.menuTile*`, `.menuMusicTile`, `.menuBottomStrip`.

Real controls that must stay untouched semantically:

- `#continueCareer`
- `#newShowdown`
- `#legacyButton`
- `#careerStatisticsButton`
- `#ruleBookButton`
- `#settingsButton`
- media controls inside `.menuMusicTile`

Layout intent:

- keep existing 12-column DOM grid rather than painting fake menu cards into a background image
- establish one dominant primary tile and five supporting tiles through CSS size, luminance and border hierarchy
- preserve text labels from DOM
- use black glass/metal panels with warm gold strokes and low-opacity stadium atmosphere behind them
- `.menuBottomStrip` stays a small product identity/status rail

Character composition:

- Daniel: left/background zone, maximum visual intrusion approximately 22% of viewport width
- Nik: right/background zone, maximum visual intrusion approximately 22% of viewport width
- faces should sit above/beside the tile field, not under tile text
- hands may enter atmospheric negative space but not clickable cards
- on tablet crop both portraits aggressively; on mobile omit large portraits and use CSS identity only

Asset decision now: test existing approved core Nik/Daniel references through deterministic placement before any regeneration. A01/A02 generation gate remains CLOSED until this composition test says the existing approved material cannot produce a clean isolated master.

## 7. S03 Create Showdown

Authority selectors: `#createShowdown`, `.setupBox`, `#showdownName`, `#managerOne`, `#managerTwo`, `#roundAmount`, `#startShowdown`, `[data-smart-back]`.

Primary content safe zone on desktop: central approximately 34% to 66% of viewport.

Presentation plan:

- center `.setupBox` as a dark metallic card with one gold perimeter accent
- use large editorial heading above, but leave all labels/inputs as DOM text
- selected season/round control should have a strong gold active state and clear keyboard focus
- keep Start Showdown as the single filled gold CTA
- keep Back visually secondary

Character use:

- reusable A01/A02 or their deterministic crops may occupy left/right rails only
- no new Create-specific pose
- no generated UI panel or form background with embedded text

Generation decision now: CLOSED.

## 8. S04 Private Remote Joining

Authority: `#sparkRemoteJoiningOverlay` and its runtime-generated controls/status.

Presentation plan:

- treat as a product modal, not a cinematic splash page
- maintain a single clear task per state: sign in, create, join, wait, reconnect, or return
- use compact manager identity chips only after pairing identity exists
- use status icons and semantic colors for connected/waiting/error states
- zero-dollar / local-save messaging must remain readable and should not be hidden in decorative text

Character use: optional deterministic head crops only.

Generation decision now: CLOSED.

## 9. S05 Shared Career Length

Authority: Shared Showdown setup presentation.

Presentation plan:

- four explicit choices: 1, 3, 5, 10 seasons
- use one dark horizontal segmented control/card group on desktop, stacked choice buttons on narrow screens
- selected choice uses gold border/fill and text contrast
- do not invent a wheel for season length

Character use: none required; optional tiny identity chips.

Generation decision now: CLOSED.

## 10. S06 Shared Review / Confirm

Authority: production Shared Showdown confirmation state.

Presentation plan:

- two manager confirmation cards arranged left/right around a central rivalry status rail
- each card must show pending/confirmed distinctly
- Start Career remains locked until runtime says both confirmations are authoritative
- coordinator/rival role can be communicated by a small label, not by changing the underlying flow

Character use: compact deterministic A01/A02 crops if useful.

Generation decision now: CLOSED.

## 11. S07 League Wheel

Authority selectors: `#leagueWheelScreen`, `.wheelContainer`, `.wheelPointer`, `#leagueWheel`, `.wheelTrack`, `.wheelItem`, `#selectedLeague`, `#leagueStateNote`, `#spinLeague`, back control. Shared presentation may decorate this same DOM.

Absolute control rule: `#spinLeague` remains below the wheel and visually unobstructed.

Desktop zones:

- wheel content safe zone: approximately 31% to 69% viewport width
- left character zone: 0% to 23%
- right character zone: 77% to 100%
- button band below wheel must remain free of character hands/torso

Presentation plan:

- wheel ring: layered CSS gold/black metal with restrained glow
- canonical five league labels remain live DOM; do not rasterize league names into an image
- selected league gets controlled gold emphasis, not a full-screen flash
- shared waiting/host/locked state goes into `#leagueStateNote` or adjacent status decoration without creating a second screen
- spin motion must respect reduced-motion behavior later in QA

Character use:

- Daniel pointing reference is compositionally justified on the left because the gesture can direct attention toward the wheel
- Nik thinking reference is justified on the right as a counterbalance
- these are reusable core poses, not League-only assets

Generation decision now: CLOSED pending deterministic core-master extraction/placement test.

## 12. S08 Club Assignment

Authority selectors: `#clubWheelScreen`, `.clubAssignmentShell`, `#clubAssignmentLeague`, `#clubPackStatus`, `.clubRevealProgress`, `.clubRevealArena`, `#clubCardOne`, `#clubCardTwo`, `#clubRivalryConfirmation`, `#openClubPack`, `#continueClubAssignment`, `#clubAssignmentBack`.

The live progression must remain clear:

`01 DRAW -> 02 PACK 1 -> 03 PACK 2 -> 04 VS -> 05 LOCK`

Central safe zone on desktop: approximately 24% to 76% viewport width because two reveal cards and VS occupy more width than the League Wheel.

Presentation plan:

- preserve real pack doors/cards; style them with original black/gold procedural frame
- no official club crest art is introduced by this visual proposal
- reveal progress uses DOM labels and state styling
- permanent-club lock note remains textual DOM evidence
- `#openClubPack` and `#continueClubAssignment` must never be covered by manager art
- confirmation state can increase gold prestige but should not reposition core controls unexpectedly

Character use:

- first implementation attempt uses A01/A02 at far edges with low visual intrusion
- C01/C02 pack-interaction poses remain CONDITIONAL
- only generate C01/C02 if a real browser composition proves the core poses look disconnected or cannot frame the pack experience while preserving safe zones

Generation decision now: CLOSED.

## 13. S09 Shared Career Start

Authority: `#productionSharedCareerStartOverlay`.

Presentation plan:

- dark confirmation modal with own club, rival club, league, Showdown length and acknowledgement state
- use two compact club/manager columns and one status/action footer
- own acknowledgement and rival acknowledgement remain separate runtime facts
- waiting state must remain visibly different from both-ready

Character use: no full figures; optional A01/A02 identity crops only.

Generation decision now: CLOSED.

## 14. Accessibility and interaction guardrails for Packages 1 + 2

- preserve visible `:focus-visible` indication on every actionable element
- do not rely on gold alone for pending/confirmed/error semantics
- maintain readable contrast over stadium backgrounds using opaque/blurred dark panels
- generated or decorative art receives empty alt / presentation treatment if implementation uses `<img>`
- no decorative layer enters tab order
- no hover-only information
- reduced-motion mode should disable large scale/parallax/spin flourish while preserving state change clarity
- text must remain actual DOM text for localization/readability/searchability

## 15. Asset decision after exact DOM specification

The Package 1/2 spec does not prove a new raster image is needed yet.

Next implementation/prototype step is a deterministic safe-zone composition using existing approved identity material or neutral placeholders. Its purpose is to answer two questions:

1. Can A01/A02 be extracted/isolated from the already-approved visual truth without regeneration while maintaining sufficient quality?
2. Can those core poses fit Home + League + Club without obstructing live controls?

Only if answer 1 is no should new A01/A02 generation become justified.

Only if answer 2 is no specifically on Club Assignment should C01/C02 become justified.

This is the reasoning checkpoint before any image-engine call.