# Old CSS liveness · JOB-1648

Audited source checkout: `94adc63a88b8d399fbb96def800fc11e63965fe4`.

Regenerate: `node scripts/old-css-liveness.mjs`. The script starts the existing static-site server automatically; `CMS_BASE_URL` can select an already served copy of the same checkout. This project ships index.html and runtime files directly; there is no build step.

Headless Chromium 149.0.7827.0; viewports **393×660** and **1280×800**. 56 screen/state observations; no skipped routes.

## Method and limits

- Counts are unique, comma-separated selector branches per sheet; duplicate appearances across conditional blocks count once. All branches are inventoried below, including nonmatching branches. Keyframe steps and font-face descriptors are not DOM selectors.
- CSSOM parses each source in a detached stylesheet, recursively including @media and @supports. Sheets are never force-loaded into the app for measurement. Conditional rules are included regardless of whether the condition currently applies.
- A live match belongs to the active screen/overlay subtree or shared page chrome. Hidden descendants of that active subtree count conservatively (they can be revealed by UI controls); hidden *other* screens do not count. The hidden-only inventory separately lists selectors that match elsewhere in the document but never in an active surface.
- Pseudo-elements are tested against their originating elements, with the original selector preserved. Interaction pseudo-classes such as :hover, :active and :focus remain intact; only naturally occurring focus/hover states are measured. Nonmatches are observations, not universal proof of deletion safety.
- Matching markup does not prove that a declaration wins the cascade, paints visible pixels, or that its sheet was enabled. DEAD means zero active-surface matches in this tour, not authorization to archive a sheet. Media, account/error/recovery states and interaction states beyond this matrix still need targeted review before removal.
- Gameplay uses tests/support/active-showdown-fixtures.cjs for paired identity, active history/progression, results, final reconciliation and CLOSED terminal witness. Provider responses are in-memory fixtures; no remote write, sign-in, audio play or reconciliation Apply is performed. Transfer samples supply each phase to the production view getter and phase attribute used by the real V10 mount. Season Results opens through its real production adapter with fixture reads. Season Summary uses its real renderer with a local round record. Rivalry, Career Statistics, Trophy Room and Legacy are sampled both before and after supplying populated fixture models through their existing V10 mount APIs; Standings receives that same career model.

## Startup and loader inventory

F10 in `tests/contracts/v10-foundation-contracts.cjs` pins `index.html` byte-for-byte to the current release, **r71 (1.9.1-r71)** (read from the `app-asset-revision` meta in `index.html`), and caps startup gzip at **37495 bytes** (read from the F10 contract). These guards are unchanged.

`index.html` loads `css/app.css` directly, plus the external Google Fonts Barlow Condensed sheet. The other audited sheets are runtime-loaded. `loadRuntimeStyle` is defined by optionalModules.js, but not every call originates there:

| Sheet | Direct index.html | Loaded by optionalModules.js | Other source references (including comments/guards) |
| --- | --- | --- | --- |
| `css/app.css` | yes | no | `js/diagnostics.js` |
| `css/analytics.css` | no | yes | — |
| `css/legacy.css` | no | yes | — |
| `css/rulebook.css` | no | yes | `js/rulesSettingsV10.js` |
| `css/settings.css` | no | yes | `js/rulesSettingsV10.js` |
| `css/season.css` | no | yes | — |
| `css/transfer.css` | no | yes | — |
| `css/restore.css` | no | yes | — |
| `css/offline.css` | no | no | `js/offlineApp.js` |
| `css/saveLibrary.css` | no | no | `js/saveLibraryCutover.js` |
| `css/remoteJoining.css` | no | no | `js/productionSharedCareerStart.js`, `js/productionSharedJourneyEntry.js`, `js/remoteJoiningAcceptance.js`, `js/ssjrProductionAcceptanceRecorder.js` |
| `css/footballVisuals-v113.css` | no | yes | — |
| `css/footballVisuals.css` | no | yes | — |
| `css/visual-fidelity-r3.css` | no | no | `js/app.js` |

`offline.css` is loaded by offlineApp.js; `saveLibrary.css` by saveLibraryCutover.js; `remoteJoining.css` by its remote/acceptance loaders; `visual-fidelity-r3.css` by app.js. Their loader provenance must not be mistaken for direct index.html loading.

## Coverage

| Screen/state | 393×660 | 1280×800 |
| --- | --- | --- |
| `loadingScreen` | visited | visited |
| `mainMenu-empty` | visited | visited |
| `connectPlayersScreen` | visited | visited |
| `mainMenu` | visited | visited |
| `createShowdown` | visited | visited |
| `leagueWheelScreen` | visited | visited |
| `clubWheelScreen` | visited | visited |
| `dashboard` | visited | visited |
| `transferChallenge-WINDOW_OPEN` | visited | visited |
| `transferChallenge-GUESS_ENTRY` | visited | visited |
| `transferChallenge-SIGNING_ENTRY` | visited | visited |
| `transferChallenge-COMPLETED` | visited | visited |
| `seasonEntry` | visited | visited |
| `finalWinner` | visited | visited |
| `seasonSummary` | visited | visited |
| `statistics` | visited | visited |
| `statistics-ready` | visited | visited |
| `careerStatistics` | visited | visited |
| `careerStatistics-ready` | visited | visited |
| `trophyRoom` | visited | visited |
| `trophyRoom-ready` | visited | visited |
| `legacy` | visited | visited |
| `legacy-ready` | visited | visited |
| `ruleBook` | visited | visited |
| `standings` | visited | visited |
| `settingsOverlay` | visited | visited |
| `legacy-data-tools` | visited | visited |
| `remoteJoiningOverlay` | visited | visited |

Final Winner is mounted within seasonEntry; Rivalry is the statistics route. Settings and Connect Players are overlays. Standings is registered dynamically. Legacy data tools and Remote Joining are supplemental surfaces, not extra canonical routes.

## Per-sheet totals

| Sheet | Unique selectors | Branch occurrences | Active matches | Hidden-only matches | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| `app.css` | 359 | 561 | 283 | 5 | **PARTLY LIVE** |
| `analytics.css` | 76 | 118 | 5 | 1 | **PARTLY LIVE** |
| `legacy.css` | 94 | 120 | 41 | 0 | **PARTLY LIVE** |
| `rulebook.css` | 35 | 56 | 35 | 0 | **LIVE** |
| `settings.css` | 65 | 99 | 50 | 0 | **PARTLY LIVE** |
| `season.css` | 28 | 46 | 21 | 0 | **PARTLY LIVE** |
| `transfer.css` | 49 | 69 | 30 | 0 | **PARTLY LIVE** |
| `restore.css` | 37 | 46 | 9 | 0 | **PARTLY LIVE** |
| `offline.css` | 0 | 0 | 0 | 0 | **DEAD** |
| `saveLibrary.css` | 93 | 113 | 8 | 0 | **PARTLY LIVE** |
| `remoteJoining.css` | 29 | 36 | 25 | 0 | **PARTLY LIVE** |
| `footballVisuals-v113.css` | 23 | 57 | 0 | 0 | **DEAD** |
| `footballVisuals.css` | 64 | 114 | 0 | 0 | **DEAD** |
| `visual-fidelity-r3.css` | 29 | 57 | 26 | 0 | **PARTLY LIVE** |

## app.css

**PARTLY LIVE** — 283/359 unique selectors matched active markup; 561 branch occurrences; 6 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### loadingScreen

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `#loadingScreen` | 393x660, 1280x800 |
| `#loadingScreen::before` | 393x660, 1280x800 |
| `#loadingScreen::after` | 393x660, 1280x800 |
| `.startupScene` | 393x660, 1280x800 |
| `.startupAthleteFrame` | 393x660, 1280x800 |
| `.startupAthleteFrame::after` | 393x660, 1280x800 |
| `#startupAthlete` | 393x660, 1280x800 |
| `.startupShard` | 393x660, 1280x800 |
| `.startupGrid` | 393x660, 1280x800 |
| `.startupIdentity` | 393x660, 1280x800 |
| `.startupRoundel` | 393x660, 1280x800 |
| `.startupRoundel strong` | 393x660, 1280x800 |
| `.startupKicker` | 393x660, 1280x800 |
| `.startupIdentity h1` | 393x660, 1280x800 |
| `.startupIdentity h1 span` | 393x660, 1280x800 |
| `.startupIdentity h1 strong` | 393x660, 1280x800 |
| `.startupEdition` | 393x660, 1280x800 |
| `.startupStatus` | 393x660, 1280x800 |
| `.startupPulse` | 393x660, 1280x800 |
| `.startupPulse i` | 393x660, 1280x800 |
| `.startupPulse i:nth-child(1)` | 393x660, 1280x800 |
| `.startupPulse i:nth-child(2)` | 393x660, 1280x800 |
| `.startupPulse i:nth-child(3)` | 393x660, 1280x800 |
| `.startupPulse i:nth-child(4)` | 393x660, 1280x800 |
| `#loadingText` | 393x660, 1280x800 |
| `.startupSaveNote` | 393x660, 1280x800 |
| `.startupPhotoCredit` | 393x660, 1280x800 |
| `#loadingScreen *` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### mainMenu-empty

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.menuTileLabel` | 393x660, 1280x800 |
| `.menuMusicHeader strong` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuMusicControl` | 393x660, 1280x800 |
| `.menuMediaChoice` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `#mainMenu` | 393x660, 1280x800 |
| `.fifaMenuShell` | 393x660, 1280x800 |
| `.fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuEyebrow` | 393x660, 1280x800 |
| `.fifaMenuHeading h2` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta span` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTile::before` | 393x660, 1280x800 |
| `.menuTile::after` | 393x660, 1280x800 |
| `.menuTile:disabled` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileRules .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileCode` | 393x660, 1280x800 |
| `.menuTileNew .menuTileCode` | 393x660, 1280x800 |
| `.menuTileRules .menuTileCode` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileCode` | 393x660, 1280x800 |
| `.menuTileMeta` | 393x660, 1280x800 |
| `.menuTileNew .menuTileMeta` | 393x660, 1280x800 |
| `.menuTileRules .menuTileMeta` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuCoverTag small` | 393x660, 1280x800 |
| `.menuAthleteCredit` | 393x660, 1280x800 |
| `.menuAthleteCredit a` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuBottomStrip b` | 393x660, 1280x800 |
| `.menuBottomStrip strong` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |
| `.menuMusicHeader` | 393x660, 1280x800 |
| `.menuMusicHeader span` | 393x660, 1280x800 |
| `.menuMusicArtist` | 393x660, 1280x800 |
| `.menuMusicSource` | 393x660, 1280x800 |
| `.menuMediaSelector` | 393x660, 1280x800 |
| `.menuMediaChoice strong` | 393x660, 1280x800 |
| `.menuMediaChoice small` | 393x660, 1280x800 |
| `.menuMediaChoice.selected` | 393x660, 1280x800 |
| `.menuMediaChoice.selected small` | 393x660, 1280x800 |
| `.menuMusicControls` | 393x660, 1280x800 |
| `.menuMusicControl:disabled` | 393x660, 1280x800 |
| `.menuMusicStatus` | 393x660, 1280x800 |
| `.menuMusicPlayer` | 393x660, 1280x800 |
| `.menuMusicPlaceholder` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `.menuBottomStrip span:nth-child(2)` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |
| `#newShowdown` | 393x660, 1280x800 |
| `#ruleBookButton` | 393x660, 1280x800 |
| `#settingsButton` | 393x660, 1280x800 |

#### connectPlayersScreen

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.menuTileLabel` | 393x660, 1280x800 |
| `.menuMusicHeader strong` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.menuMusicControl` | 393x660, 1280x800 |
| `.menuMediaChoice` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `#mainMenu` | 393x660, 1280x800 |
| `.fifaMenuShell` | 393x660, 1280x800 |
| `.fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuEyebrow` | 393x660, 1280x800 |
| `.fifaMenuHeading h2` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta span` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTile::before` | 393x660, 1280x800 |
| `.menuTile::after` | 393x660, 1280x800 |
| `.menuTile:disabled` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileRules .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileCode` | 393x660, 1280x800 |
| `.menuTileNew .menuTileCode` | 393x660, 1280x800 |
| `.menuTileRules .menuTileCode` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileCode` | 393x660, 1280x800 |
| `.menuTileMeta` | 393x660, 1280x800 |
| `.menuTileNew .menuTileMeta` | 393x660, 1280x800 |
| `.menuTileRules .menuTileMeta` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuCoverTag small` | 393x660, 1280x800 |
| `.menuAthleteCredit` | 393x660, 1280x800 |
| `.menuAthleteCredit a` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuBottomStrip b` | 393x660, 1280x800 |
| `.menuBottomStrip strong` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |
| `.menuMusicHeader` | 393x660, 1280x800 |
| `.menuMusicHeader span` | 393x660, 1280x800 |
| `.menuMusicArtist` | 393x660, 1280x800 |
| `.menuMusicSource` | 393x660, 1280x800 |
| `.menuMediaSelector` | 393x660, 1280x800 |
| `.menuMediaChoice strong` | 393x660, 1280x800 |
| `.menuMediaChoice small` | 393x660, 1280x800 |
| `.menuMediaChoice.selected` | 393x660, 1280x800 |
| `.menuMediaChoice.selected small` | 393x660, 1280x800 |
| `.menuMusicControls` | 393x660, 1280x800 |
| `.menuMusicControl:disabled` | 393x660, 1280x800 |
| `.menuMusicStatus` | 393x660, 1280x800 |
| `.menuMusicPlayer` | 393x660, 1280x800 |
| `.menuMusicPlaceholder` | 393x660, 1280x800 |
| `.stateNote` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `.menuBottomStrip span:nth-child(2)` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |
| `#newShowdown` | 393x660, 1280x800 |
| `#ruleBookButton` | 393x660, 1280x800 |
| `#settingsButton` | 393x660, 1280x800 |

#### mainMenu

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.menuTileLabel` | 393x660, 1280x800 |
| `.menuMusicHeader strong` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuMusicControl` | 393x660, 1280x800 |
| `.menuMediaChoice` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `#mainMenu` | 393x660, 1280x800 |
| `.fifaMenuShell` | 393x660, 1280x800 |
| `.fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuEyebrow` | 393x660, 1280x800 |
| `.fifaMenuHeading h2` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta span` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTile::before` | 393x660, 1280x800 |
| `.menuTile::after` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileRules .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileCode` | 393x660, 1280x800 |
| `.menuTileNew .menuTileCode` | 393x660, 1280x800 |
| `.menuTileRules .menuTileCode` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileCode` | 393x660, 1280x800 |
| `.menuTileMeta` | 393x660, 1280x800 |
| `.menuTileNew .menuTileMeta` | 393x660, 1280x800 |
| `.menuTileRules .menuTileMeta` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuCoverTag small` | 393x660, 1280x800 |
| `.menuAthleteCredit` | 393x660, 1280x800 |
| `.menuAthleteCredit a` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuBottomStrip b` | 393x660, 1280x800 |
| `.menuBottomStrip strong` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |
| `.menuMusicHeader` | 393x660, 1280x800 |
| `.menuMusicHeader span` | 393x660, 1280x800 |
| `.menuMusicArtist` | 393x660, 1280x800 |
| `.menuMusicSource` | 393x660, 1280x800 |
| `.menuMediaSelector` | 393x660, 1280x800 |
| `.menuMediaChoice strong` | 393x660, 1280x800 |
| `.menuMediaChoice small` | 393x660, 1280x800 |
| `.menuMediaChoice.selected` | 393x660, 1280x800 |
| `.menuMediaChoice.selected small` | 393x660, 1280x800 |
| `.menuMusicControls` | 393x660, 1280x800 |
| `.menuMusicControl:disabled` | 393x660, 1280x800 |
| `.menuMusicStatus` | 393x660, 1280x800 |
| `.menuMusicPlayer` | 393x660, 1280x800 |
| `.menuMusicPlaceholder` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `.menuBottomStrip span:nth-child(2)` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |
| `#newShowdown` | 393x660, 1280x800 |
| `#ruleBookButton` | 393x660, 1280x800 |
| `#settingsButton` | 393x660, 1280x800 |

#### createShowdown

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `select` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `select option` | 393x660, 1280x800 |
| `.setupBox` | 393x660, 1280x800 |
| `.setupBox label` | 393x660, 1280x800 |
| `.setupBox input` | 393x660, 1280x800 |
| `.setupBox select` | 393x660, 1280x800 |
| `.setupBox .menuButton` | 393x660, 1280x800 |
| `.setupBox .backButton` | 393x660, 1280x800 |
| `.stateNote` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### leagueWheelScreen

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.wheelContainer` | 393x660, 1280x800 |
| `.leagueWheel` | 393x660, 1280x800 |
| `.wheelTrack` | 393x660, 1280x800 |
| `.wheelItem` | 393x660, 1280x800 |
| `.wheelItem:nth-child(1)` | 393x660, 1280x800 |
| `.wheelItem:nth-child(2)` | 393x660, 1280x800 |
| `.wheelItem:nth-child(3)` | 393x660, 1280x800 |
| `.wheelItem:nth-child(4)` | 393x660, 1280x800 |
| `.wheelItem:nth-child(5)` | 393x660, 1280x800 |
| `.leagueWheel::before` | 393x660, 1280x800 |
| `.wheelPointer` | 393x660, 1280x800 |
| `#selectedLeague` | 393x660, 1280x800 |
| `.wheelContainer .menuButton` | 393x660, 1280x800 |
| `.wheelContainer .backButton` | 393x660, 1280x800 |
| `.stateNote` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### clubWheelScreen

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.menuButton:disabled` | 393x660, 1280x800 |
| `.clubAssignmentShell` | 393x660, 1280x800 |
| `.clubAssignmentHeader` | 393x660, 1280x800 |
| `.clubAssignmentEyebrow` | 393x660, 1280x800 |
| `#clubAssignmentLeague` | 393x660, 1280x800 |
| `#clubPackStatus` | 393x660, 1280x800 |
| `.clubRevealProgress` | 393x660, 1280x800 |
| `.clubRevealProgress span` | 393x660, 1280x800 |
| `.clubRevealArena` | 393x660, 1280x800 |
| `.clubRevealArea` | 393x660, 1280x800 |
| `.clubRevealCard` | 393x660, 1280x800 |
| `.clubRevealIndex` | 393x660, 1280x800 |
| `.clubManager` | 393x660, 1280x800 |
| `.clubPackStage` | 393x660, 1280x800 |
| `.clubPackDoor` | 393x660, 1280x800 |
| `.clubPackDoor::before` | 393x660, 1280x800 |
| `.clubPackDoor::after` | 393x660, 1280x800 |
| `.clubPackBrand` | 393x660, 1280x800 |
| `.clubPackBrand small` | 393x660, 1280x800 |
| `.clubPackSeal` | 393x660, 1280x800 |
| `.clubPackSerial` | 393x660, 1280x800 |
| `.clubCardFace` | 393x660, 1280x800 |
| `.clubCardFace::after` | 393x660, 1280x800 |
| `.clubCardEyebrow` | 393x660, 1280x800 |
| `.clubCardLabel` | 393x660, 1280x800 |
| `.clubCardState` | 393x660, 1280x800 |
| `.clubCardFace strong` | 393x660, 1280x800 |
| `.clubVs` | 393x660, 1280x800 |
| `.clubVs span` | 393x660, 1280x800 |
| `.clubVs strong` | 393x660, 1280x800 |
| `.clubRivalryConfirmation` | 393x660, 1280x800 |
| `.clubRivalryHeadline` | 393x660, 1280x800 |
| `.clubRivalryHeadline > span` | 393x660, 1280x800 |
| `.clubRivalryHeadline > strong` | 393x660, 1280x800 |
| `.clubRivalryHeadline > small` | 393x660, 1280x800 |
| `.clubRivalryMatchup` | 393x660, 1280x800 |
| `.clubConfirmationSide` | 393x660, 1280x800 |
| `.clubConfirmationSide:last-child` | 393x660, 1280x800 |
| `.clubConfirmationSide span` | 393x660, 1280x800 |
| `.clubConfirmationSide strong` | 393x660, 1280x800 |
| `.clubConfirmationVs` | 393x660, 1280x800 |
| `.clubRivalryLockNote` | 393x660, 1280x800 |
| `.clubAssignmentShell > .menuButton` | 393x660, 1280x800 |
| `.clubAssignmentShell > .backButton` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `#clubWheelScreen` | 393x660, 1280x800 |
| `#clubWheelScreen > h2` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### dashboard

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.dangerButton` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.showdownOverview` | 393x660, 1280x800 |
| `.overviewName` | 393x660, 1280x800 |
| `.overviewStatus` | 393x660, 1280x800 |
| `.transferOverviewStatus` | 393x660, 1280x800 |
| `.showdownScoreboard` | 393x660, 1280x800 |
| `.showdownScoreboard div:not(.scoreDivider)` | 393x660, 1280x800 |
| `.showdownScoreboard span` | 393x660, 1280x800 |
| `.showdownScoreboard small` | 393x660, 1280x800 |
| `.scoreDivider` | 393x660, 1280x800 |
| `.playerCards` | 393x660, 1280x800 |
| `.playerCard` | 393x660, 1280x800 |
| `.playerCard:nth-child(2)` | 393x660, 1280x800 |
| `.playerCard h3` | 393x660, 1280x800 |
| `.playerCard p` | 393x660, 1280x800 |
| `.playerCard .clubName` | 393x660, 1280x800 |
| `.dashboardActions` | 393x660, 1280x800 |
| `.stateNote` | 393x660, 1280x800 |
| `.completionHub` | 393x660, 1280x800 |
| `.completionHub h3` | 393x660, 1280x800 |
| `.completionHub p` | 393x660, 1280x800 |
| `.completionHubActions` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |
| `#rivalryStatisticsButton:not([data-test-surface="internal-audit"])` | 393x660, 1280x800 |

#### transferChallenge-WINDOW_OPEN

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `select` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `select option` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.transferHero` | 393x660, 1280x800 |
| `.transferRulesLine` | 393x660, 1280x800 |
| `#transferPhaseStatus` | 393x660, 1280x800 |
| `.transferTimer` | 393x660, 1280x800 |
| `.transferRuleNote` | 393x660, 1280x800 |
| `.transferTimerActions` | 393x660, 1280x800 |
| `.transferManagersGrid` | 393x660, 1280x800 |
| `.transferGuessesGrid` | 393x660, 1280x800 |
| `.transferResultsGrid` | 393x660, 1280x800 |
| `.transferManagerCard` | 393x660, 1280x800 |
| `.transferGuessCard` | 393x660, 1280x800 |
| `.transferResultsCard` | 393x660, 1280x800 |
| `.transferManagerCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferGuessCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferResultsCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferSectionLabel` | 393x660, 1280x800 |
| `.signingRows` | 393x660, 1280x800 |
| `.guessRows` | 393x660, 1280x800 |
| `.signingRow` | 393x660, 1280x800 |
| `.guessRow` | 393x660, 1280x800 |
| `.signingRow > span` | 393x660, 1280x800 |
| `.guessRow > span` | 393x660, 1280x800 |
| `.signingRow input` | 393x660, 1280x800 |
| `.guessRow input` | 393x660, 1280x800 |
| `.guessRow select` | 393x660, 1280x800 |
| `.transferGuessCard h3` | 393x660, 1280x800 |
| `.transferChallengeResults > h3` | 393x660, 1280x800 |
| `.transferChallengeResults` | 393x660, 1280x800 |
| `#completeTransferChallenge` | 393x660, 1280x800 |
| `.seasonManagerHeader` | 393x660, 1280x800 |
| `.seasonManagerHeader h3` | 393x660, 1280x800 |
| `.seasonManagerHeader p` | 393x660, 1280x800 |
| `.formError` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### transferChallenge-GUESS_ENTRY

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `select` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `select option` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.transferHero` | 393x660, 1280x800 |
| `.transferRulesLine` | 393x660, 1280x800 |
| `#transferPhaseStatus` | 393x660, 1280x800 |
| `.transferTimer` | 393x660, 1280x800 |
| `.transferRuleNote` | 393x660, 1280x800 |
| `.transferTimerActions` | 393x660, 1280x800 |
| `.transferManagersGrid` | 393x660, 1280x800 |
| `.transferGuessesGrid` | 393x660, 1280x800 |
| `.transferResultsGrid` | 393x660, 1280x800 |
| `.transferManagerCard` | 393x660, 1280x800 |
| `.transferGuessCard` | 393x660, 1280x800 |
| `.transferResultsCard` | 393x660, 1280x800 |
| `.transferManagerCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferResultsCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferSectionLabel` | 393x660, 1280x800 |
| `.signingRows` | 393x660, 1280x800 |
| `.guessRows` | 393x660, 1280x800 |
| `.signingRow` | 393x660, 1280x800 |
| `.guessRow` | 393x660, 1280x800 |
| `.signingRow > span` | 393x660, 1280x800 |
| `.guessRow > span` | 393x660, 1280x800 |
| `.signingRow input` | 393x660, 1280x800 |
| `.guessRow input` | 393x660, 1280x800 |
| `.guessRow select` | 393x660, 1280x800 |
| `.transferGuessCard h3` | 393x660, 1280x800 |
| `.transferChallengeResults > h3` | 393x660, 1280x800 |
| `.transferChallengeResults` | 393x660, 1280x800 |
| `#completeTransferChallenge` | 393x660, 1280x800 |
| `.seasonManagerHeader` | 393x660, 1280x800 |
| `.seasonManagerHeader h3` | 393x660, 1280x800 |
| `.seasonManagerHeader p` | 393x660, 1280x800 |
| `.formError` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### transferChallenge-SIGNING_ENTRY

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `select` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `select option` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.transferHero` | 393x660, 1280x800 |
| `.transferRulesLine` | 393x660, 1280x800 |
| `#transferPhaseStatus` | 393x660, 1280x800 |
| `.transferTimer` | 393x660, 1280x800 |
| `.transferRuleNote` | 393x660, 1280x800 |
| `.transferTimerActions` | 393x660, 1280x800 |
| `.transferManagersGrid` | 393x660, 1280x800 |
| `.transferGuessesGrid` | 393x660, 1280x800 |
| `.transferResultsGrid` | 393x660, 1280x800 |
| `.transferManagerCard` | 393x660, 1280x800 |
| `.transferGuessCard` | 393x660, 1280x800 |
| `.transferResultsCard` | 393x660, 1280x800 |
| `.transferManagerCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferGuessCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferResultsCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferSectionLabel` | 393x660, 1280x800 |
| `.signingRows` | 393x660, 1280x800 |
| `.guessRows` | 393x660, 1280x800 |
| `.signingRow` | 393x660, 1280x800 |
| `.guessRow` | 393x660, 1280x800 |
| `.signingRow > span` | 393x660, 1280x800 |
| `.guessRow > span` | 393x660, 1280x800 |
| `.signingRow input` | 393x660, 1280x800 |
| `.guessRow input` | 393x660, 1280x800 |
| `.guessRow select` | 393x660, 1280x800 |
| `.transferGuessCard h3` | 393x660, 1280x800 |
| `.transferChallengeResults > h3` | 393x660, 1280x800 |
| `.transferChallengeResults` | 393x660, 1280x800 |
| `#completeTransferChallenge` | 393x660, 1280x800 |
| `.seasonManagerHeader` | 393x660, 1280x800 |
| `.seasonManagerHeader h3` | 393x660, 1280x800 |
| `.seasonManagerHeader p` | 393x660, 1280x800 |
| `.formError` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### transferChallenge-COMPLETED

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `select` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `select option` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.transferHero` | 393x660, 1280x800 |
| `.transferRulesLine` | 393x660, 1280x800 |
| `#transferPhaseStatus` | 393x660, 1280x800 |
| `.transferTimer` | 393x660, 1280x800 |
| `.transferRuleNote` | 393x660, 1280x800 |
| `.transferTimerActions` | 393x660, 1280x800 |
| `.transferManagersGrid` | 393x660, 1280x800 |
| `.transferGuessesGrid` | 393x660, 1280x800 |
| `.transferResultsGrid` | 393x660, 1280x800 |
| `.transferManagerCard` | 393x660, 1280x800 |
| `.transferGuessCard` | 393x660, 1280x800 |
| `.transferResultsCard` | 393x660, 1280x800 |
| `.transferManagerCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferGuessCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferResultsCard:nth-child(2)` | 393x660, 1280x800 |
| `.transferSectionLabel` | 393x660, 1280x800 |
| `.signingRows` | 393x660, 1280x800 |
| `.guessRows` | 393x660, 1280x800 |
| `.signingRow` | 393x660, 1280x800 |
| `.guessRow` | 393x660, 1280x800 |
| `.signingRow > span` | 393x660, 1280x800 |
| `.guessRow > span` | 393x660, 1280x800 |
| `.signingRow input` | 393x660, 1280x800 |
| `.guessRow input` | 393x660, 1280x800 |
| `.guessRow select` | 393x660, 1280x800 |
| `.transferGuessCard h3` | 393x660, 1280x800 |
| `.transferChallengeResults > h3` | 393x660, 1280x800 |
| `.transferChallengeResults` | 393x660, 1280x800 |
| `#completeTransferChallenge` | 393x660, 1280x800 |
| `.seasonManagerHeader` | 393x660, 1280x800 |
| `.seasonManagerHeader h3` | 393x660, 1280x800 |
| `.seasonManagerHeader p` | 393x660, 1280x800 |
| `.formError` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### seasonEntry

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.compactButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.seasonEntryHint` | 393x660, 1280x800 |
| `.seasonEntryGrid` | 393x660, 1280x800 |
| `.seasonSummaryGrid` | 393x660, 1280x800 |
| `.seasonResultCard` | 393x660, 1280x800 |
| `.seasonSummaryCard` | 393x660, 1280x800 |
| `.seasonResultCard:nth-child(2)` | 393x660, 1280x800 |
| `.seasonSummaryCard:nth-child(2)` | 393x660, 1280x800 |
| `.seasonManagerHeader` | 393x660, 1280x800 |
| `.seasonManagerHeader h3` | 393x660, 1280x800 |
| `.seasonSummaryCard h3` | 393x660, 1280x800 |
| `.seasonManagerHeader p` | 393x660, 1280x800 |
| `.summaryClub` | 393x660, 1280x800 |
| `.seasonResultCard > label` | 393x660, 1280x800 |
| `.seasonResultCard input[type="number"]` | 393x660, 1280x800 |
| `.achievementChecks` | 393x660, 1280x800 |
| `.achievementChecks label` | 393x660, 1280x800 |
| `.achievementChecks input` | 393x660, 1280x800 |
| `.formError` | 393x660, 1280x800 |
| `.summaryResult` | 393x660, 1280x800 |
| `.summaryLine` | 393x660, 1280x800 |
| `.summaryLine strong` | 393x660, 1280x800 |
| `.overallScoreBox` | 393x660, 1280x800 |
| `.overallScoreBox span` | 393x660, 1280x800 |
| `.overallScoreBox strong` | 393x660, 1280x800 |
| `#appRuntimeNotice` | 393x660, 1280x800 |
| `#appRuntimeNotice.error` | 393x660, 1280x800 |
| `#appRuntimeNotice button` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### finalWinner

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.compactButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.seasonEntryHint` | 393x660, 1280x800 |
| `.seasonEntryGrid` | 393x660, 1280x800 |
| `.seasonSummaryGrid` | 393x660, 1280x800 |
| `.seasonResultCard` | 393x660, 1280x800 |
| `.seasonSummaryCard` | 393x660, 1280x800 |
| `.seasonResultCard:nth-child(2)` | 393x660, 1280x800 |
| `.seasonSummaryCard:nth-child(2)` | 393x660, 1280x800 |
| `.seasonManagerHeader` | 393x660, 1280x800 |
| `.seasonManagerHeader h3` | 393x660, 1280x800 |
| `.seasonSummaryCard h3` | 393x660, 1280x800 |
| `.seasonManagerHeader p` | 393x660, 1280x800 |
| `.summaryClub` | 393x660, 1280x800 |
| `.seasonResultCard > label` | 393x660, 1280x800 |
| `.seasonResultCard input[type="number"]` | 393x660, 1280x800 |
| `.achievementChecks` | 393x660, 1280x800 |
| `.achievementChecks label` | 393x660, 1280x800 |
| `.achievementChecks input` | 393x660, 1280x800 |
| `.formError` | 393x660, 1280x800 |
| `.summaryResult` | 393x660, 1280x800 |
| `.summaryLine` | 393x660, 1280x800 |
| `.summaryLine strong` | 393x660, 1280x800 |
| `.overallScoreBox` | 393x660, 1280x800 |
| `.overallScoreBox span` | 393x660, 1280x800 |
| `.overallScoreBox strong` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### seasonSummary

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `[data-club-identity="true"]` | 393x660, 1280x800 |
| `[data-club-identity="true"]::before` | 393x660, 1280x800 |
| `.seasonEntryActions` | 393x660, 1280x800 |
| `.seasonSummaryGrid` | 393x660, 1280x800 |
| `.seasonSummaryCard` | 393x660, 1280x800 |
| `.seasonSummaryCard:nth-child(2)` | 393x660, 1280x800 |
| `.seasonSummaryCard h3` | 393x660, 1280x800 |
| `.summaryClub` | 393x660, 1280x800 |
| `.summaryResult` | 393x660, 1280x800 |
| `.summaryLine` | 393x660, 1280x800 |
| `.summaryLine strong` | 393x660, 1280x800 |
| `.summaryTotal` | 393x660, 1280x800 |
| `.overallScoreBox` | 393x660, 1280x800 |
| `.overallScoreBox span` | 393x660, 1280x800 |
| `.overallScoreBox strong` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### statistics

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.analyticsScreen` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### statistics-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.analyticsScreen` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### careerStatistics

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `.analyticsScreen` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### careerStatistics-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `.hidden` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `.analyticsScreen` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### trophyRoom

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `.analyticsScreen` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### trophyRoom-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `.analyticsScreen` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### legacy

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `#legacy` | 393x660, 1280x800 |
| `.legacyBox` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### legacy-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `#legacy` | 393x660, 1280x800 |
| `.legacyBox` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### ruleBook

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.ruleBookScreen` | 393x660, 1280x800 |
| `.ruleSection` | 393x660, 1280x800 |
| `.ruleBookHero` | 393x660, 1280x800 |
| `.ruleBookHero strong` | 393x660, 1280x800 |
| `.ruleBookHero p` | 393x660, 1280x800 |
| `.ruleBookHero > span` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### standings

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### settingsOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.menuTileLabel` | 393x660, 1280x800 |
| `.menuMusicHeader strong` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.menuMusicControl` | 393x660, 1280x800 |
| `.menuMediaChoice` | 393x660, 1280x800 |
| `.dangerButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `#mainMenu` | 393x660, 1280x800 |
| `.fifaMenuShell` | 393x660, 1280x800 |
| `.fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuEyebrow` | 393x660, 1280x800 |
| `.fifaMenuHeading h2` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta` | 393x660, 1280x800 |
| `.fifaMenuHeadingMeta span` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTile::before` | 393x660, 1280x800 |
| `.menuTile::after` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileRules .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileLabel` | 393x660, 1280x800 |
| `.menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTileTrophy .menuTileCode` | 393x660, 1280x800 |
| `.menuTileNew .menuTileCode` | 393x660, 1280x800 |
| `.menuTileRules .menuTileCode` | 393x660, 1280x800 |
| `.menuTileSettings .menuTileCode` | 393x660, 1280x800 |
| `.menuTileMeta` | 393x660, 1280x800 |
| `.menuTileNew .menuTileMeta` | 393x660, 1280x800 |
| `.menuTileRules .menuTileMeta` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuCoverTag small` | 393x660, 1280x800 |
| `.menuAthleteCredit` | 393x660, 1280x800 |
| `.menuAthleteCredit a` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuBottomStrip b` | 393x660, 1280x800 |
| `.menuBottomStrip strong` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |
| `.menuMusicHeader` | 393x660, 1280x800 |
| `.menuMusicHeader span` | 393x660, 1280x800 |
| `.menuMusicArtist` | 393x660, 1280x800 |
| `.menuMusicSource` | 393x660, 1280x800 |
| `.menuMediaSelector` | 393x660, 1280x800 |
| `.menuMediaChoice strong` | 393x660, 1280x800 |
| `.menuMediaChoice small` | 393x660, 1280x800 |
| `.menuMediaChoice.selected` | 393x660, 1280x800 |
| `.menuMediaChoice.selected small` | 393x660, 1280x800 |
| `.menuMusicControls` | 393x660, 1280x800 |
| `.menuMusicControl:disabled` | 393x660, 1280x800 |
| `.menuMusicStatus` | 393x660, 1280x800 |
| `.menuMusicPlayer` | 393x660, 1280x800 |
| `.menuMusicPlaceholder` | 393x660, 1280x800 |
| `.menuBottomStrip span:nth-child(2)` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |
| `#newShowdown` | 393x660, 1280x800 |
| `#ruleBookButton` | 393x660, 1280x800 |
| `#settingsButton` | 393x660, 1280x800 |

#### legacy-data-tools

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `.screen [data-route-focus-target="true"]:focus` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.compactButton` | 393x660, 1280x800 |
| `.compactButton:disabled` | 393x660, 1280x800 |
| `.dangerButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `#legacy` | 393x660, 1280x800 |
| `.legacyBox` | 393x660, 1280x800 |
| `.legacyStat` | 393x660, 1280x800 |
| `.legacyDataControls` | 393x660, 1280x800 |
| `.legacyStat span` | 393x660, 1280x800 |
| `.legacyStat strong` | 393x660, 1280x800 |
| `.legacySectionHeading` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

#### remoteJoiningOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `:root` | 393x660, 1280x800 |
| `*` | 393x660, 1280x800 |
| `html` | 393x660, 1280x800 |
| `body` | 393x660, 1280x800 |
| `button` | 393x660, 1280x800 |
| `input` | 393x660, 1280x800 |
| `#app` | 393x660, 1280x800 |
| `#topHeader` | 393x660, 1280x800 |
| `.brand` | 393x660, 1280x800 |
| `.brand h1` | 393x660, 1280x800 |
| `.brand p` | 393x660, 1280x800 |
| `.screen > h2` | 393x660, 1280x800 |
| `.seasonIndicator` | 393x660, 1280x800 |
| `main` | 393x660, 1280x800 |
| `.screen` | 393x660, 1280x800 |
| `footer` | 393x660, 1280x800 |
| `.menuButton` | 393x660, 1280x800 |
| `.backButton` | 393x660, 1280x800 |
| `.compactButton` | 393x660, 1280x800 |
| `.compactButton:disabled` | 393x660, 1280x800 |
| `.dangerButton` | 393x660, 1280x800 |
| `input::placeholder` | 393x660, 1280x800 |
| `#legacy` | 393x660, 1280x800 |
| `.legacyBox` | 393x660, 1280x800 |
| `.legacyStat` | 393x660, 1280x800 |
| `.legacyDataControls` | 393x660, 1280x800 |
| `.legacyStat span` | 393x660, 1280x800 |
| `.legacyStat strong` | 393x660, 1280x800 |
| `.legacySectionHeading` | 393x660, 1280x800 |
| `::before` | 393x660, 1280x800 |
| `::after` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

- `#background`
- `#overlay`
- `#loadingScreen.is-exiting`
- `.clubCardFace [data-club-identity="true"]::before`
- `.clubConfirmationSide [data-club-identity="true"]::before`

### Selectors with no match anywhere in the sampled document

- `textarea`
- `.loadingContent h1`
- `.loadingContent h2`
- `.screen[data-route-state="entering"]`
- `.screen[data-route-state="entering"][data-route-direction="back"]`
- `.screen[data-route-state="entering"]::after`
- `html[data-motion-reduced="true"] #loadingScreen *`
- `html[data-motion-reduced="true"] #loadingScreen::after`
- `.menuButton:hover:not(:disabled)`
- `.menuButton:focus-visible`
- `.backButton:disabled`
- `.menuButton.isBusy`
- `.backButton:hover:not(:disabled)`
- `.compactButton:hover:not(:disabled)`
- `.backButton:focus-visible`
- `.compactButton:focus-visible`
- `.dangerButton:hover:not(:disabled)`
- `input:focus`
- `select:focus`
- `.menuTile:hover:not(:disabled)`
- `.menuTile:focus-visible`
- `.menuCoverAthlete.imageFailed`
- `.menuMusicTile[data-media-kind="video"]`
- `.menuMusicTile[data-media-loaded="true"]`
- `.menuMediaChoice:hover`
- `.menuMediaChoice:focus-visible`
- `.menuMusicControl:hover:not(:disabled)`
- `.menuMusicControl:focus-visible`
- `.menuMusicTile[data-media-loaded="true"] .menuMusicPlayer`
- `.menuMusicPlayer iframe`
- `.clubRevealProgress span.done`
- `.clubRevealProgress span.active`
- `.clubRevealCard.is-revealed`
- `.clubRevealCard.is-revealed .clubPackDoor`
- `#clubWheelScreen[data-club-reveal-stage="opening"] .clubPackDoor`
- `.clubRevealCard.is-revealed .clubCardFace`
- `#clubWheelScreen[data-club-reveal-stage="versus"] .clubVs strong`
- `#clubWheelScreen[data-club-reveal-stage="confirmation"] .clubVs strong`
- `.stateNote.locked`
- `.signingRow input:disabled`
- `.guessRow input:disabled`
- `.guessRow select:disabled`
- `.transferResultsCard > h3`
- `.transferResultRow`
- `.transferResultRow > div`
- `.transferResultRow span`
- `.transferResultRow.safe`
- `.transferResultRow.safe b`
- `.transferResultRow.release`
- `.transferResultRow.release b`
- `.transferEmpty`
- `.achievementChecks label:has(input:checked)`
- `.formError:not(:empty)`
- `.legacyShowdownCard`
- `.analyticsStatCard`
- `.managerCabinet`
- `.recordCard`
- `.careerStandings`
- `.comparisonTable`
- `.seasonProgressionRow`
- `.analyticsStatCard span`
- `.recordCard span`
- `.analyticsStatCard strong`
- `.recordCard strong`
- `.analyticsSectionHeading`
- `#appRuntimeNotice.success`
- `html[data-motion-reduced="true"] *`
- `html[data-motion-reduced="true"] ::before`
- `html[data-motion-reduced="true"] ::after`
- `html[data-motion-reduced="true"] .screen[data-route-state="entering"]`
- `html[data-motion-reduced="true"] .screen[data-route-state="entering"]::after`


## analytics.css

**PARTLY LIVE** — 5/76 unique selectors matched active markup; 118 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### statistics

| Selector | Matching viewport(s) |
| --- | --- |
| `.analyticsScreen` | 393x660, 1280x800 |
| `.analyticsContent` | 393x660, 1280x800 |
| `.analyticsActions` | 393x660, 1280x800 |
| `.analyticsActions .backButton` | 393x660, 1280x800 |

#### statistics-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `.analyticsScreen` | 393x660, 1280x800 |
| `.analyticsContent` | 393x660, 1280x800 |
| `.analyticsActions` | 393x660, 1280x800 |
| `.analyticsActions .backButton` | 393x660, 1280x800 |

#### careerStatistics

| Selector | Matching viewport(s) |
| --- | --- |
| `.analyticsScreen` | 393x660, 1280x800 |

#### careerStatistics-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `.analyticsScreen` | 393x660, 1280x800 |

#### trophyRoom

| Selector | Matching viewport(s) |
| --- | --- |
| `.analyticsScreen` | 393x660, 1280x800 |
| `.trophyShelf` | 393x660, 1280x800 |

#### trophyRoom-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `.analyticsScreen` | 393x660, 1280x800 |
| `.trophyShelf` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

- `.analyticsEmpty`

### Selectors with no match anywhere in the sampled document

- `.analyticsSectionHeading`
- `.analyticsStatsGrid`
- `.analyticsStatCard`
- `.analyticsStatCard:nth-child(2n)`
- `.analyticsStatCard span`
- `.analyticsStatCard strong`
- `.analyticsStatCard small`
- `.rivalryStatisticsHero`
- `.rivalryStatisticsOverview`
- `.rivalryStatisticsOverview strong`
- `.rivalryStatisticsOverview span`
- `.rivalryStatisticsMatchup`
- `.rivalryManagerHero`
- `.rivalryManagerHero + .rivalryManagerHero`
- `.rivalryManagerHero h3`
- `.analyticsClubName`
- `.rivalryHeroScore`
- `.rivalryManagerHero > span`
- `.comparisonTable`
- `.comparisonRow`
- `.comparisonRow:last-child`
- `.comparisonRow > span`
- `.comparisonRow > strong`
- `.comparisonRow > strong:first-child`
- `.comparisonRow > strong:last-child`
- `.comparisonRow .comparisonLeader`
- `.seasonProgressionList`
- `.seasonProgressionRow`
- `.seasonProgressionLabel`
- `.seasonProgressionLabel strong`
- `.seasonProgressionLabel span`
- `.seasonStatSide`
- `.seasonStatTop`
- `.seasonStatTop strong`
- `.seasonStatSide.right .seasonStatTop`
- `.seasonPointTrack`
- `.seasonStatSide.right .seasonPointTrack`
- `.seasonPointFill`
- `.trophyRoomSummary`
- `.careerStandings`
- `.careerStandingsRow`
- `.careerStandingsRow:last-child`
- `.careerStandingsRow.header`
- `.careerStandingsRow strong`
- `.careerStandingsRow:not(.header) span`
- `.managerCabinetList`
- `.managerCabinet`
- `.managerCabinetHeader`
- `.managerRank`
- `.managerCabinetHeader h3`
- `.managerCabinetHeader p`
- `.managerCareerPoints`
- `.managerCareerPoints strong`
- `.managerCareerPoints span`
- `.trophyCount`
- `.trophyGlyph`
- `.trophyCount strong`
- `.trophyCount span`
- `.cabinetSupportingStats`
- `.cabinetSupportingStats .analyticsStatCard`
- `.cabinetSupportingStats .analyticsStatCard strong`
- `.cabinetAchievementStrip`
- `.recordsGrid`
- `.recordCard`
- `.recordCard > span`
- `.recordCard > strong`
- `.recordCard > small`
- `.careerStandingsRow > :nth-child(4)`
- `.careerStandingsRow > :nth-child(6)`
- `.seasonStatSide.right`


## legacy.css

**PARTLY LIVE** — 41/94 unique selectors matched active markup; 120 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### dashboard

| Selector | Matching viewport(s) |
| --- | --- |
| `.dangerButton` | 393x660, 1280x800 |
| `#deleteActiveShowdown` | 393x660, 1280x800 |

#### seasonEntry

| Selector | Matching viewport(s) |
| --- | --- |
| `.compactButton` | 393x660, 1280x800 |

#### finalWinner

| Selector | Matching viewport(s) |
| --- | --- |
| `.compactButton` | 393x660, 1280x800 |

#### legacy

| Selector | Matching viewport(s) |
| --- | --- |
| `#legacy` | 393x660, 1280x800 |
| `#legacy .legacyBox` | 393x660, 1280x800 |

#### legacy-ready

| Selector | Matching viewport(s) |
| --- | --- |
| `#legacy` | 393x660, 1280x800 |
| `#legacy .legacyBox` | 393x660, 1280x800 |
| `.legacyCardTitle` | 393x660, 1280x800 |
| `.legacyWinner` | 393x660, 1280x800 |

#### settingsOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `.dangerButton` | 393x660, 1280x800 |

#### legacy-data-tools

| Selector | Matching viewport(s) |
| --- | --- |
| `#legacy` | 393x660, 1280x800 |
| `#legacy .legacyBox` | 393x660, 1280x800 |
| `.legacyStatsGrid` | 393x660, 1280x800 |
| `.legacyStat` | 393x660, 1280x800 |
| `.legacyStat:nth-child(2)` | 393x660, 1280x800 |
| `.legacyStat:nth-child(3)` | 393x660, 1280x800 |
| `.legacyStat span` | 393x660, 1280x800 |
| `.legacyStat strong` | 393x660, 1280x800 |
| `.legacySectionHeading` | 393x660, 1280x800 |
| `.legacyEmpty` | 393x660, 1280x800 |
| `.compactButton` | 393x660, 1280x800 |
| `.dangerButton` | 393x660, 1280x800 |
| `.legacyDataControls` | 393x660, 1280x800 |
| `.legacyDataControls h3` | 393x660, 1280x800 |
| `.legacyDataControls p` | 393x660, 1280x800 |
| `.legacyControlButtons` | 393x660, 1280x800 |
| `.legacyControlButtons .compactButton` | 393x660, 1280x800 |
| `.legacyBackupSummary` | 393x660, 1280x800 |
| `.legacyBackupSummary strong` | 393x660, 1280x800 |
| `.legacyBackupSummary span` | 393x660, 1280x800 |
| `.primaryDataButton` | 393x660, 1280x800 |
| `.primaryDataButton:disabled` | 393x660, 1280x800 |
| `.legacyDataStatus` | 393x660, 1280x800 |
| `.legacyControlButtons .dangerButton` | 393x660, 1280x800 |
| `.legacyControlButtons .primaryDataButton` | 393x660, 1280x800 |
| `.legacyImportAnalysis` | 393x660, 1280x800 |
| `.legacyImportEyebrow` | 393x660, 1280x800 |
| `.legacyImportAnalysis h4` | 393x660, 1280x800 |
| `.legacyImportAnalysis > p` | 393x660, 1280x800 |
| `.legacyImportDropZone` | 393x660, 1280x800 |
| `.legacyImportDropZone strong` | 393x660, 1280x800 |
| `.legacyImportDropZone span` | 393x660, 1280x800 |
| `.legacyImportNativeInput` | 393x660, 1280x800 |
| `.legacyImportFileState` | 393x660, 1280x800 |
| `.legacyImportStatus` | 393x660, 1280x800 |
| `.legacyImportActions` | 393x660, 1280x800 |
| `.legacyImportActions .compactButton` | 393x660, 1280x800 |
| `.legacyImportResult` | 393x660, 1280x800 |

#### remoteJoiningOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `#legacy` | 393x660, 1280x800 |
| `#legacy .legacyBox` | 393x660, 1280x800 |
| `.legacyStatsGrid` | 393x660, 1280x800 |
| `.legacyStat` | 393x660, 1280x800 |
| `.legacyStat:nth-child(2)` | 393x660, 1280x800 |
| `.legacyStat:nth-child(3)` | 393x660, 1280x800 |
| `.legacyStat span` | 393x660, 1280x800 |
| `.legacyStat strong` | 393x660, 1280x800 |
| `.legacySectionHeading` | 393x660, 1280x800 |
| `.legacyEmpty` | 393x660, 1280x800 |
| `.compactButton` | 393x660, 1280x800 |
| `.dangerButton` | 393x660, 1280x800 |
| `.legacyDataControls` | 393x660, 1280x800 |
| `.legacyDataControls h3` | 393x660, 1280x800 |
| `.legacyDataControls p` | 393x660, 1280x800 |
| `.legacyControlButtons` | 393x660, 1280x800 |
| `.legacyControlButtons .compactButton` | 393x660, 1280x800 |
| `.legacyBackupSummary` | 393x660, 1280x800 |
| `.legacyBackupSummary strong` | 393x660, 1280x800 |
| `.legacyBackupSummary span` | 393x660, 1280x800 |
| `.primaryDataButton` | 393x660, 1280x800 |
| `.primaryDataButton:disabled` | 393x660, 1280x800 |
| `.legacyDataStatus` | 393x660, 1280x800 |
| `.legacyControlButtons .dangerButton` | 393x660, 1280x800 |
| `.legacyControlButtons .primaryDataButton` | 393x660, 1280x800 |
| `.legacyImportAnalysis` | 393x660, 1280x800 |
| `.legacyImportEyebrow` | 393x660, 1280x800 |
| `.legacyImportAnalysis h4` | 393x660, 1280x800 |
| `.legacyImportAnalysis > p` | 393x660, 1280x800 |
| `.legacyImportDropZone` | 393x660, 1280x800 |
| `.legacyImportDropZone strong` | 393x660, 1280x800 |
| `.legacyImportDropZone span` | 393x660, 1280x800 |
| `.legacyImportNativeInput` | 393x660, 1280x800 |
| `.legacyImportFileState` | 393x660, 1280x800 |
| `.legacyImportStatus` | 393x660, 1280x800 |
| `.legacyImportActions` | 393x660, 1280x800 |
| `.legacyImportActions .compactButton` | 393x660, 1280x800 |
| `.legacyImportResult` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.legacyList`
- `.legacyShowdownCard`
- `.legacyCardTop`
- `.legacyCardTitle h3`
- `.legacyCardTitle p`
- `.legacyCardMeta`
- `.legacyMatchup`
- `.legacyMatchup strong`
- `.legacyMatchup span`
- `.legacyDetails`
- `.legacyDetails summary`
- `.legacyDetails summary:hover`
- `.legacyDetails summary:focus-visible`
- `.legacySeasonList`
- `.legacySeasonRow`
- `.legacySeasonNumber`
- `.legacySeasonManager`
- `.legacySeasonManager.right`
- `.legacySeasonScore`
- `.legacySeasonHonours`
- `.legacyCardActions`
- `.compactButton:hover`
- `.compactButton:focus-visible`
- `.dangerButton:hover`
- `.dangerButton:focus-visible`
- `.primaryDataButton:hover`
- `.primaryDataButton:focus-visible`
- `.primaryDataButton[aria-busy="true"]`
- `.legacyImportDropZone.dragActive`
- `.legacyImportDropZone:focus-visible`
- `.legacyImportVerdict`
- `.legacyImportVerdict.ready`
- `.legacyImportVerdict.blocked`
- `.legacyImportVerdict strong`
- `.legacyImportVerdict.ready strong`
- `.legacyImportVerdict.blocked strong`
- `.legacyImportVerdict span`
- `.legacyImportPreviewGrid`
- `.legacyImportPreviewCard`
- `.legacyImportPreviewCard span`
- `.legacyImportPreviewCard small`
- `.legacyImportPreviewCard strong`
- `.legacyImportMigrationSummary`
- `.legacyImportConflictList`
- `.legacyImportMessages`
- `.legacyImportMigrationSummary strong`
- `.legacyImportConflictList strong`
- `.legacyImportMessages strong`
- `.legacyImportMigrationSummary span`
- `.legacyImportConflictList span`
- `.legacyImportMessages.errors`
- `.legacyImportMessages.warnings`
- `.legacyImportMessages ul`


## rulebook.css

**LIVE** — 35/35 unique selectors matched active markup; 56 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### ruleBook

| Selector | Matching viewport(s) |
| --- | --- |
| `.ruleBookScreen` | 393x660, 1280x800 |
| `.ruleBookHero` | 393x660, 1280x800 |
| `.ruleBookHero > span` | 393x660, 1280x800 |
| `.ruleBookHero > strong` | 393x660, 1280x800 |
| `.ruleBookHero > p` | 393x660, 1280x800 |
| `.ruleBookGrid` | 393x660, 1280x800 |
| `.ruleSection` | 393x660, 1280x800 |
| `.ruleSection::before` | 393x660, 1280x800 |
| `.ruleSection:nth-child(1)` | 393x660, 1280x800 |
| `.ruleSection:nth-child(2)` | 393x660, 1280x800 |
| `.ruleSection:nth-child(3)` | 393x660, 1280x800 |
| `.ruleSection:nth-child(4)` | 393x660, 1280x800 |
| `.ruleSection:nth-child(5)` | 393x660, 1280x800 |
| `.ruleSection:nth-child(6)` | 393x660, 1280x800 |
| `.ruleSectionHeader` | 393x660, 1280x800 |
| `.ruleSectionHeader > span` | 393x660, 1280x800 |
| `.ruleSectionHeader h3` | 393x660, 1280x800 |
| `.ruleSection ul` | 393x660, 1280x800 |
| `.ruleSection li` | 393x660, 1280x800 |
| `.ruleSection li::before` | 393x660, 1280x800 |
| `.scoringRuleSection` | 393x660, 1280x800 |
| `.ruleScoreTable` | 393x660, 1280x800 |
| `.ruleScoreTable > div` | 393x660, 1280x800 |
| `.ruleScoreTable > div:nth-child(1)` | 393x660, 1280x800 |
| `.ruleScoreTable > div:nth-child(2)` | 393x660, 1280x800 |
| `.ruleScoreTable > div:nth-child(3)` | 393x660, 1280x800 |
| `.ruleScoreTable > div:nth-child(4)` | 393x660, 1280x800 |
| `.ruleScoreTable > div:nth-child(5)` | 393x660, 1280x800 |
| `.ruleScoreTable span` | 393x660, 1280x800 |
| `.ruleScoreTable strong` | 393x660, 1280x800 |
| `.ruleScoreMaximum` | 393x660, 1280x800 |
| `.ruleScoreMaximum span` | 393x660, 1280x800 |
| `.ruleScoreMaximum strong` | 393x660, 1280x800 |
| `.ruleBookActions` | 393x660, 1280x800 |
| `.ruleBookActions .backButton` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

None.


## settings.css

**PARTLY LIVE** — 50/65 unique selectors matched active markup; 99 branch occurrences; 1 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### settingsOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `.settingsOverlay` | 393x660, 1280x800 |
| `.settingsDialog` | 393x660, 1280x800 |
| `.settingsHeader` | 393x660, 1280x800 |
| `.settingsHeading` | 393x660, 1280x800 |
| `.settingsEyebrow` | 393x660, 1280x800 |
| `.settingsHeading h2` | 393x660, 1280x800 |
| `.settingsClose` | 393x660, 1280x800 |
| `.settingsContent` | 393x660, 1280x800 |
| `.settingsPanel` | 393x660, 1280x800 |
| `.settingsPanel:first-child` | 393x660, 1280x800 |
| `.settingsDataPanel` | 393x660, 1280x800 |
| `.settingsOfflinePanel` | 393x660, 1280x800 |
| `.settingsPanelHeading` | 393x660, 1280x800 |
| `.settingsPanelEyebrow` | 393x660, 1280x800 |
| `.settingsPanelHeading h3` | 393x660, 1280x800 |
| `.settingsPanelHeading p` | 393x660, 1280x800 |
| `.settingsInfoGrid` | 393x660, 1280x800 |
| `.settingsInfoRow` | 393x660, 1280x800 |
| `.settingsInfoRow span` | 393x660, 1280x800 |
| `.settingsInfoRow strong` | 393x660, 1280x800 |
| `.settingsMotionSummary` | 393x660, 1280x800 |
| `.settingsStatus` | 393x660, 1280x800 |
| `.settingsStatus.standard` | 393x660, 1280x800 |
| `.settingsMotionChoices` | 393x660, 1280x800 |
| `.settingsMotionChoice` | 393x660, 1280x800 |
| `.settingsMotionChoice.selected` | 393x660, 1280x800 |
| `.settingsMotionMarker` | 393x660, 1280x800 |
| `.settingsMotionChoice.selected .settingsMotionMarker` | 393x660, 1280x800 |
| `.settingsMotionCopy` | 393x660, 1280x800 |
| `.settingsMotionCopy strong` | 393x660, 1280x800 |
| `.settingsMotionCopy small` | 393x660, 1280x800 |
| `.settingsAudioRow` | 393x660, 1280x800 |
| `.settingsAudioCopy` | 393x660, 1280x800 |
| `.settingsAudioCopy strong` | 393x660, 1280x800 |
| `.settingsAudioCopy small` | 393x660, 1280x800 |
| `.settingsAudioToggle` | 393x660, 1280x800 |
| `.settingsAudioToggle.enabled` | 393x660, 1280x800 |
| `.settingsAudioToggleTrack` | 393x660, 1280x800 |
| `.settingsAudioToggle strong` | 393x660, 1280x800 |
| `.settingsOfflineInfo` | 393x660, 1280x800 |
| `.settingsOfflineInfo .settingsInfoRow` | 393x660, 1280x800 |
| `.settingsOfflineActions` | 393x660, 1280x800 |
| `.settingsOfflineActions:has(.settingsOfflineUpdateButton)` | 393x660, 1280x800 |
| `.settingsOfflineInstallButton` | 393x660, 1280x800 |
| `.settingsOfflineUpdateButton` | 393x660, 1280x800 |
| `.settingsOfflineNote` | 393x660, 1280x800 |
| `.settingsDataButton` | 393x660, 1280x800 |
| `.settingsDataNote` | 393x660, 1280x800 |
| `.settingsFooter` | 393x660, 1280x800 |
| `.settingsFooter .menuButton` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.settingsClose:hover`
- `.settingsClose:focus-visible`
- `.settingsStatus.reduced`
- `.settingsMotionChoice:hover`
- `.settingsMotionChoice:focus-visible`
- `.settingsAudioToggle:hover`
- `.settingsAudioToggle:focus-visible`
- `.settingsOfflineInstallButton:disabled`
- `.settingsConnectedRivalryConfirmation`
- `.settingsConnectedRivalryPreviewSummary`
- `.settingsConnectedRivalryConfirmLabel`
- `.settingsConnectedRivalryConfirmInput`
- `.settingsConnectedRivalryApply`
- `.settingsConnectedRivalryApply:disabled`
- `html[data-motion-reduced="true"] .settingsDialog`


## season.css

**PARTLY LIVE** — 21/28 unique selectors matched active markup; 46 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### seasonEntry

| Selector | Matching viewport(s) |
| --- | --- |
| `.seasonReviewPanel` | 393x660, 1280x800 |
| `.seasonReviewStatus` | 393x660, 1280x800 |
| `.seasonReviewStatus span` | 393x660, 1280x800 |
| `.seasonReviewStatus strong` | 393x660, 1280x800 |
| `.seasonReviewPanel > h3` | 393x660, 1280x800 |
| `.seasonReviewIntro` | 393x660, 1280x800 |
| `.seasonReviewResult` | 393x660, 1280x800 |
| `.seasonReviewGrid` | 393x660, 1280x800 |
| `.seasonReviewCard` | 393x660, 1280x800 |
| `.seasonReviewCard::before` | 393x660, 1280x800 |
| `.seasonReviewCard:nth-child(2)::before` | 393x660, 1280x800 |
| `.seasonReviewAchievements` | 393x660, 1280x800 |
| `.seasonReviewAchievements span` | 393x660, 1280x800 |
| `.seasonReviewAchievements .isNotEarned` | 393x660, 1280x800 |
| `.seasonReviewOverall` | 393x660, 1280x800 |
| `.seasonReviewWarning` | 393x660, 1280x800 |
| `.seasonReviewError` | 393x660, 1280x800 |
| `.seasonReviewActions` | 393x660, 1280x800 |
| `.seasonReviewActions .menuButton` | 393x660, 1280x800 |
| `.seasonReviewActions .compactButton` | 393x660, 1280x800 |
| `.seasonReviewPanel *` | 393x660, 1280x800 |

#### finalWinner

| Selector | Matching viewport(s) |
| --- | --- |
| `.seasonReviewPanel` | 393x660, 1280x800 |
| `.seasonReviewStatus` | 393x660, 1280x800 |
| `.seasonReviewStatus span` | 393x660, 1280x800 |
| `.seasonReviewStatus strong` | 393x660, 1280x800 |
| `.seasonReviewPanel > h3` | 393x660, 1280x800 |
| `.seasonReviewIntro` | 393x660, 1280x800 |
| `.seasonReviewResult` | 393x660, 1280x800 |
| `.seasonReviewGrid` | 393x660, 1280x800 |
| `.seasonReviewCard` | 393x660, 1280x800 |
| `.seasonReviewCard::before` | 393x660, 1280x800 |
| `.seasonReviewCard:nth-child(2)::before` | 393x660, 1280x800 |
| `.seasonReviewAchievements` | 393x660, 1280x800 |
| `.seasonReviewAchievements span` | 393x660, 1280x800 |
| `.seasonReviewAchievements .isNotEarned` | 393x660, 1280x800 |
| `.seasonReviewOverall` | 393x660, 1280x800 |
| `.seasonReviewWarning` | 393x660, 1280x800 |
| `.seasonReviewError` | 393x660, 1280x800 |
| `.seasonReviewActions` | 393x660, 1280x800 |
| `.seasonReviewActions .menuButton` | 393x660, 1280x800 |
| `.seasonReviewActions .compactButton` | 393x660, 1280x800 |
| `.seasonReviewPanel *` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.seasonReviewPanel > h3:focus`
- `.seasonReviewLine.isZero`
- `.seasonReviewLine.isScoring strong`
- `.seasonReviewAchievements .isEarned`
- `.seasonReviewScoreHeading`
- `.seasonReviewTotal`
- `html[data-motion-reduced="true"] .seasonReviewPanel *`


## transfer.css

**PARTLY LIVE** — 30/49 unique selectors matched active markup; 69 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### transferChallenge-WINDOW_OPEN

| Selector | Matching viewport(s) |
| --- | --- |
| `#transferChallenge` | 393x660, 1280x800 |
| `.transferPhaseNavigator` | 393x660, 1280x800 |
| `.transferPhaseStep` | 393x660, 1280x800 |
| `.transferPhaseStep b` | 393x660, 1280x800 |
| `.transferPhaseStep span` | 393x660, 1280x800 |
| `.transferPhaseIntro` | 393x660, 1280x800 |
| `.transferPhaseLockSummary` | 393x660, 1280x800 |
| `#transferChallenge .transferManagersGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessesGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferChallengeResults` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard::before` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard::before` | 393x660, 1280x800 |
| `.transferPhaseActionBar` | 393x660, 1280x800 |
| `.transferPhaseActionBar .menuButton` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote strong` | 393x660, 1280x800 |
| `.transferCombobox` | 393x660, 1280x800 |
| `.transferCombobox > input` | 393x660, 1280x800 |
| `.transferComboboxList` | 393x660, 1280x800 |
| `.guessRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow > .transferCombobox` | 393x660, 1280x800 |
| `#transferChallenge .transferResultsGrid` | 393x660, 1280x800 |

#### transferChallenge-GUESS_ENTRY

| Selector | Matching viewport(s) |
| --- | --- |
| `#transferChallenge` | 393x660, 1280x800 |
| `#transferChallenge[data-transfer-phase="guess_entry"]` | 393x660, 1280x800 |
| `#transferChallenge:not([data-transfer-phase="window"]) .transferHero` | 393x660, 1280x800 |
| `#transferChallenge:not([data-transfer-phase="window"]) .transferTimerActions` | 393x660, 1280x800 |
| `.transferPhaseNavigator` | 393x660, 1280x800 |
| `.transferPhaseStep` | 393x660, 1280x800 |
| `.transferPhaseStep b` | 393x660, 1280x800 |
| `.transferPhaseStep span` | 393x660, 1280x800 |
| `.transferPhaseIntro` | 393x660, 1280x800 |
| `.transferPhaseLockSummary` | 393x660, 1280x800 |
| `#transferChallenge .transferManagersGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessesGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferChallengeResults` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard::before` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard::before` | 393x660, 1280x800 |
| `.transferPhaseActionBar` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote strong` | 393x660, 1280x800 |
| `.transferCombobox` | 393x660, 1280x800 |
| `.transferCombobox > input` | 393x660, 1280x800 |
| `.transferComboboxList` | 393x660, 1280x800 |
| `.guessRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow > .transferCombobox` | 393x660, 1280x800 |
| `#transferChallenge .transferResultsGrid` | 393x660, 1280x800 |

#### transferChallenge-SIGNING_ENTRY

| Selector | Matching viewport(s) |
| --- | --- |
| `#transferChallenge` | 393x660, 1280x800 |
| `#transferChallenge[data-transfer-phase="signing_entry"]` | 393x660, 1280x800 |
| `#transferChallenge:not([data-transfer-phase="window"]) .transferHero` | 393x660, 1280x800 |
| `#transferChallenge:not([data-transfer-phase="window"]) .transferTimerActions` | 393x660, 1280x800 |
| `.transferPhaseNavigator` | 393x660, 1280x800 |
| `.transferPhaseStep` | 393x660, 1280x800 |
| `.transferPhaseStep b` | 393x660, 1280x800 |
| `.transferPhaseStep span` | 393x660, 1280x800 |
| `.transferPhaseIntro` | 393x660, 1280x800 |
| `.transferPhaseLockSummary` | 393x660, 1280x800 |
| `#transferChallenge .transferManagersGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessesGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferChallengeResults` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard::before` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard::before` | 393x660, 1280x800 |
| `.transferPhaseActionBar` | 393x660, 1280x800 |
| `.transferPhaseActionBar .menuButton` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote strong` | 393x660, 1280x800 |
| `.transferCombobox` | 393x660, 1280x800 |
| `.transferCombobox > input` | 393x660, 1280x800 |
| `.transferComboboxList` | 393x660, 1280x800 |
| `.guessRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow > .transferCombobox` | 393x660, 1280x800 |
| `#transferChallenge .transferResultsGrid` | 393x660, 1280x800 |

#### transferChallenge-COMPLETED

| Selector | Matching viewport(s) |
| --- | --- |
| `#transferChallenge` | 393x660, 1280x800 |
| `#transferChallenge[data-transfer-phase="completed"]` | 393x660, 1280x800 |
| `#transferChallenge:not([data-transfer-phase="window"]) .transferHero` | 393x660, 1280x800 |
| `#transferChallenge:not([data-transfer-phase="window"]) .transferTimerActions` | 393x660, 1280x800 |
| `.transferPhaseNavigator` | 393x660, 1280x800 |
| `.transferPhaseStep` | 393x660, 1280x800 |
| `.transferPhaseStep b` | 393x660, 1280x800 |
| `.transferPhaseStep span` | 393x660, 1280x800 |
| `.transferPhaseIntro` | 393x660, 1280x800 |
| `.transferPhaseLockSummary` | 393x660, 1280x800 |
| `#transferChallenge .transferManagersGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessesGrid` | 393x660, 1280x800 |
| `#transferChallenge .transferChallengeResults` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard` | 393x660, 1280x800 |
| `#transferChallenge .transferManagerCard::before` | 393x660, 1280x800 |
| `#transferChallenge .transferGuessCard::before` | 393x660, 1280x800 |
| `.transferPhaseActionBar` | 393x660, 1280x800 |
| `.transferPhaseActionBar .menuButton` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote` | 393x660, 1280x800 |
| `.transferGuessPrivacyNote strong` | 393x660, 1280x800 |
| `.transferCombobox` | 393x660, 1280x800 |
| `.transferCombobox > input` | 393x660, 1280x800 |
| `.transferComboboxList` | 393x660, 1280x800 |
| `.guessRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow .transferCombobox` | 393x660, 1280x800 |
| `.signingRow > .transferCombobox` | 393x660, 1280x800 |
| `#transferChallenge .transferResultsGrid` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.transferPhaseStep.done`
- `.transferPhaseStep.done b`
- `.transferPhaseStep.active`
- `.transferPhaseStep.active b`
- `.transferPhaseIntro strong`
- `.transferPhaseIntro span`
- `.transferPhaseLockSummary strong`
- `.transferComboboxOption`
- `.transferComboboxOption strong`
- `.transferComboboxOption span`
- `.transferComboboxOption.active`
- `.transferComboboxOption:hover`
- `.transferComboboxOption.active span`
- `.transferComboboxOption:hover span`
- `.transferComboboxEmpty`
- `.transferCombobox > input[aria-expanded="true"]`
- `.transferCombobox > input:focus-visible`
- `.transferLockedField`
- `.transferPhaseBadge`


## restore.css

**PARTLY LIVE** — 9/37 unique selectors matched active markup; 46 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### legacy-data-tools

| Selector | Matching viewport(s) |
| --- | --- |
| `.careerRestorePanel` | 393x660, 1280x800 |
| `.careerRestorePanel h4` | 393x660, 1280x800 |
| `.careerRestoreEyebrow` | 393x660, 1280x800 |
| `.careerRestoreIntro` | 393x660, 1280x800 |
| `.careerRestoreStatus` | 393x660, 1280x800 |
| `.careerRestorePicker` | 393x660, 1280x800 |
| `.careerRestorePicker input[type="file"]` | 393x660, 1280x800 |
| `.careerRestoreReview` | 393x660, 1280x800 |
| `.careerRestorePanel *` | 393x660, 1280x800 |

#### remoteJoiningOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `.careerRestorePanel` | 393x660, 1280x800 |
| `.careerRestorePanel h4` | 393x660, 1280x800 |
| `.careerRestoreEyebrow` | 393x660, 1280x800 |
| `.careerRestoreIntro` | 393x660, 1280x800 |
| `.careerRestoreStatus` | 393x660, 1280x800 |
| `.careerRestorePicker` | 393x660, 1280x800 |
| `.careerRestorePicker input[type="file"]` | 393x660, 1280x800 |
| `.careerRestoreReview` | 393x660, 1280x800 |
| `.careerRestorePanel *` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.careerRestoreSnapshot`
- `.careerRestoreSnapshot article`
- `.careerRestoreSnapshot span`
- `.careerRestoreSnapshot small`
- `.careerRestoreSnapshot strong`
- `.careerRestoreChoices`
- `.careerRestoreChoiceGroup`
- `.careerRestoreLabel`
- `.careerRestoreSelect`
- `.careerRestoreSelect:focus-visible`
- `.careerRestorePicker input[type="file"]:focus-visible`
- `.careerRestorePlan`
- `.careerRestoreConflicts`
- `.careerRestoreRecovery`
- `.careerRestorePlan.ready`
- `.careerRestorePlan.blocked`
- `.careerRestorePlan strong`
- `.careerRestoreConflicts > strong`
- `.careerRestoreRecovery strong`
- `.careerRestorePlan span`
- `.careerRestoreRecovery span`
- `.careerRestoreConflict`
- `.careerRestoreConflict h5`
- `.careerRestoreConflict p`
- `.careerRestoreRecovery.critical`
- `.careerRestoreActions`
- `.careerRestoreActions .compactButton`
- `.careerRestoreApply[aria-busy="true"]`


## offline.css

**DEAD** — 0/0 unique selectors matched active markup; 0 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

None.

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

None.


## saveLibrary.css

**PARTLY LIVE** — 8/93 unique selectors matched active markup; 113 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### settingsOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `.saveLibraryProductPanel` | 393x660, 1280x800 |
| `.saveLibraryHeading` | 393x660, 1280x800 |
| `.saveLibraryHeading::after` | 393x660, 1280x800 |
| `.saveLibraryEmptyState` | 393x660, 1280x800 |
| `.saveLibraryEmptyState > strong` | 393x660, 1280x800 |
| `.saveLibraryEmptyState p` | 393x660, 1280x800 |
| `.saveLibraryEmptyState .menuButton` | 393x660, 1280x800 |
| `.saveLibraryProductPanel *` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.saveLibrarySummary`
- `.saveLibrarySummaryItem`
- `.saveLibrarySummaryItem.active`
- `.saveLibraryPrimaryActions`
- `.saveLibraryGrid`
- `.saveLibraryCard`
- `.saveLibraryCard.isActive`
- `.saveLibraryCardTop`
- `.saveLibraryIdentity`
- `.saveLibraryProfileIdentity`
- `.saveLibraryState`
- `.saveLibraryState.active`
- `.saveLibraryState.blocked`
- `.saveLibraryCard h4`
- `.saveLibraryManagers`
- `.saveLibraryFacts`
- `.saveLibraryFact`
- `.saveLibraryFact span`
- `.saveLibraryFact strong`
- `.saveLibraryActions`
- `.saveLibraryActions .menuButton`
- `.saveLibraryActions .compactButton`
- `.saveLibraryProfiles`
- `.saveLibraryIdentityLinks`
- `.saveLibrarySubheading`
- `.saveLibrarySubheading span`
- `.saveLibrarySubheading h4`
- `.saveLibraryProfileNote`
- `.saveLibraryProfileGrid`
- `.saveLibraryProfileCard`
- `.saveLibraryProfileCard:nth-child(2n)`
- `.saveLibraryProfileCard strong`
- `.saveLibraryProfileCard small`
- `.saveLibraryProfileEditor`
- `.saveLibraryProfileEditButton`
- `.saveLibraryProfileEditForm`
- `.saveLibraryProfileEditForm[hidden]`
- `.saveLibraryProfileEditForm label`
- `.saveLibraryProfileNameInput`
- `.saveLibraryProfileEditHelp`
- `.saveLibraryProfileEditActions`
- `.saveLibraryProfileEditActions .compactButton`
- `.saveLibraryIdentityGroupHeading`
- `.saveLibraryIdentityGroup`
- `.saveLibraryIdentitySource`
- `.saveLibraryIdentitySource.historical`
- `.saveLibraryIdentitySource > strong`
- `.saveLibraryIdentitySource > small`
- `.saveLibraryIdentityLinkRow`
- `.saveLibraryIdentityLinkContext`
- `.saveLibraryIdentityLinkContext strong`
- `.saveLibraryIdentityLinkContext small`
- `.saveLibraryIdentitySelect`
- `.saveLibraryIdentityApply`
- `.saveLibraryIdentityUnavailable`
- `.saveLibraryCompatibilityState`
- `.saveLibraryBlockedState`
- `.saveLibraryCompatibilityState > strong`
- `.saveLibraryBlockedState > strong`
- `.saveLibraryCompatibilityState p`
- `.saveLibraryBlockedState p`
- `.saveLibraryEmptyCopy`
- `.saveLibraryCompatibilityState .menuButton`
- `.saveLibraryStatusRow`
- `.saveLibraryStatusChip`
- `.saveLibraryStatusChip.status-completed`
- `.saveLibraryStatusChip.status-in-progress`
- `.saveLibraryStatusChip.status-not-started`
- `.saveLibraryProgressWrap`
- `.saveLibraryProgressLabel`
- `.saveLibraryProgressTrack`
- `.saveLibraryProgressFill`
- `.saveLibraryCard.isActive .saveLibraryProgressFill`
- `.saveLibrarySortBar`
- `.saveLibrarySortLabel`
- `.saveLibrarySortGroup`
- `.saveLibrarySortButton`
- `.saveLibrarySortButton.isActive`
- `.saveLibrarySortButton:focus-visible`
- `.saveLibraryProfileMeta`
- `.saveLibraryProfileLinkBadge`
- `.saveLibraryProfileLinkBadge.linked`
- `.saveLibraryProfileCard.isLinked`
- `.saveLibraryProfileCard.isOrphan`
- `.saveLibraryProfileLinkDetail`


## remoteJoining.css

**PARTLY LIVE** — 25/29 unique selectors matched active markup; 36 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### remoteJoiningOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `.remoteJoiningOverlay` | 393x660, 1280x800 |
| `.remoteJoiningShell` | 393x660, 1280x800 |
| `.remoteJoiningHeader` | 393x660, 1280x800 |
| `.remoteJoiningDismiss` | 393x660, 1280x800 |
| `.remoteJoiningDismiss:focus-visible` | 393x660, 1280x800 |
| `.remoteJoiningBody` | 393x660, 1280x800 |
| `.remoteJoiningIntro` | 393x660, 1280x800 |
| `.remoteJoiningEyebrow` | 393x660, 1280x800 |
| `.remoteJoiningStep` | 393x660, 1280x800 |
| `.remoteJoiningIntro h2` | 393x660, 1280x800 |
| `.remoteJoiningIntro p` | 393x660, 1280x800 |
| `.remoteJoiningCard p` | 393x660, 1280x800 |
| `.remoteJoiningMeta` | 393x660, 1280x800 |
| `.remoteJoiningEmpty` | 393x660, 1280x800 |
| `.remoteJoiningStatus` | 393x660, 1280x800 |
| `.remoteJoiningGrid` | 393x660, 1280x800 |
| `.remoteJoiningCard` | 393x660, 1280x800 |
| `.remoteJoiningCard:first-child` | 393x660, 1280x800 |
| `.remoteJoiningCard h3` | 393x660, 1280x800 |
| `.remoteJoiningCard .menuButton` | 393x660, 1280x800 |
| `.remoteJoiningInput` | 393x660, 1280x800 |
| `.remoteJoiningCurrent` | 393x660, 1280x800 |
| `.remoteJoiningCurrent .remoteJoiningEyebrow` | 393x660, 1280x800 |
| `.remoteJoiningCurrent .remoteJoiningMeta` | 393x660, 1280x800 |
| `.remoteJoiningCurrent .remoteJoiningEmpty` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.remoteJoiningState`
- `.remoteJoiningCode`
- `.remoteJoiningActions`
- `.remoteJoiningActions .compactButton`


## footballVisuals-v113.css

**DEAD** — 0/23 unique selectors matched active markup; 57 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

None.

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.footballVisualCinematicBand`
- `.footballVisualCinematicBand[data-tone="blue"]`
- `.footballVisualCinematicBand[data-tone="light"]`
- `.footballVisualCinematicBand[data-photo-treatment="clean-anchor"]::after`
- `.footballVisualCinematicBand[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame`
- `.footballVisualCinematicBand[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after`
- `.footballVisualCinematicBand[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `.footballVisualCinematicBand .footballVisualName`
- `.footballVisualCinematicBand .footballVisualContext`
- `.footballVisualHeroSetup[data-football-visual-asset="james-rodriguez-world-cup-2014-v113"] .footballVisualMediaFrame`
- `.footballVisualHeroSetup[data-football-visual-asset="james-rodriguez-world-cup-2014-v113"] .footballVisualMedia`
- `.footballVisualHeroTransfer .footballVisualPanel[data-football-visual-asset="marcus-rashford-chelsea-2017-v113"] .footballVisualMediaFrame`
- `.footballVisualHeroTransfer .footballVisualPanel[data-football-visual-asset="anthony-martial-cska-2017-v113"] .footballVisualMediaFrame`
- `.footballVisualHeroTransfer .footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `#leagueWheelScreen .footballVisualCinematicBand .footballVisualMediaFrame`
- `#dashboard .footballVisualCinematicBand .footballVisualMediaFrame`
- `#legacy .footballVisualCinematicBand .footballVisualMediaFrame`
- `#clubWheelScreen .footballVisualCinematicBand .footballVisualMediaFrame`
- `#seasonEntry .footballVisualCinematicBand .footballVisualMediaFrame`
- `#seasonSummary .footballVisualCinematicBand .footballVisualMediaFrame`
- `#ruleBook .footballVisualCinematicBand .footballVisualMediaFrame`
- `html[data-motion-reduced="true"] .footballVisualMedia`
- `.footballVisualMedia`


## footballVisuals.css

**DEAD** — 0/64 unique selectors matched active markup; 114 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

None.

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.footballVisualStage`
- `#createShowdown.hasFootballVisual .footballVisualStage`
- `#createShowdown.hasFootballVisual .setupBox`
- `.footballVisualPanel`
- `.footballVisualPanel::before`
- `.footballVisualPanel::after`
- `.footballVisualPanel[data-tone="light"]`
- `.footballVisualPanel[data-tone="light"]::before`
- `.footballVisualPanel[data-tone="blue"]`
- `.footballVisualMediaFrame`
- `.footballVisualMedia`
- `.footballVisualPanel.imageLoaded .footballVisualMedia`
- `.footballVisualPanel.imageFailed .footballVisualMedia`
- `.footballVisualPanel.imageFailed`
- `.footballVisualCopy`
- `.footballVisualIdentity`
- `[data-tone="light"] .footballVisualIdentity`
- `.footballVisualKicker`
- `[data-tone="light"] .footballVisualKicker`
- `.footballVisualName`
- `.footballVisualContext`
- `.footballVisualCredit`
- `[data-tone="light"] .footballVisualCredit`
- `.footballVisualCredit a`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"]`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"][data-tone="light"]`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"]::before`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"][data-tone="light"]::before`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"]::after`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"][data-tone="light"] .footballVisualMediaFrame`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after`
- `.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after`
- `.footballVisualHeroTransfer .footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualIdentity`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualCredit`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"][data-tone="light"] .footballVisualCredit`
- `.footballVisualPanel[data-photo-treatment="clean-anchor"].imageFailed::before`
- `.footballVisualHeroSetup`
- `.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame`
- `.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualName`
- `.footballVisualHeroTransfer`
- `.footballVisualHeroTransfer .footballVisualPanel`
- `.footballVisualHeroTransfer .footballVisualPanel:first-child`
- `.footballVisualHeroTransfer .footballVisualMediaFrame`
- `.footballVisualHeroTransfer .footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame`
- `.footballVisualHeroTransfer .footballVisualPanel[data-football-visual-asset="marcus-rashford-man-utd-2017-smart-r5"] .footballVisualMediaFrame`
- `.footballVisualHeroTransfer .footballVisualPanel[data-football-visual-asset="anthony-martial-man-utd-2016-smart-r5"] .footballVisualMediaFrame`
- `.footballVisualHeroTransfer .footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `.footballVisualHeroTransfer .footballVisualPanel:first-child[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `.footballVisualHeroTransfer .footballVisualPanel:last-child[data-photo-treatment="clean-anchor"] .footballVisualCopy`
- `.footballVisualHeroTransfer .footballVisualName`
- `.footballVisualAnalytics`
- `.footballVisualAnalytics .footballVisualMediaFrame`
- `.footballVisualAnalytics .footballVisualCopy`
- `.footballVisualAnalytics::before`
- `.footballVisualTrophy`
- `.footballVisualTrophy .footballVisualMediaFrame`
- `.footballVisualTrophy .footballVisualCopy`
- `.footballVisualTrophy .footballVisualName`
- `.footballVisualTrophy::before`
- `html[data-motion-reduced="true"] .footballVisualMedia`


## visual-fidelity-r3.css

**PARTLY LIVE** — 26/29 unique selectors matched active markup; 57 branch occurrences; 0 excluded keyframe blocks.

### Matching selectors, grouped by screen/state

#### mainMenu-empty

| Selector | Matching viewport(s) |
| --- | --- |
| `#mainMenu .fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTilePrimary::before` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileLabel` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileMeta` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled .menuTileLabel` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled .menuTileMeta` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled .menuTileCode` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::before` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |

#### connectPlayersScreen

| Selector | Matching viewport(s) |
| --- | --- |
| `#mainMenu .fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTilePrimary::before` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileLabel` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileMeta` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled .menuTileLabel` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled .menuTileMeta` | 393x660, 1280x800 |
| `.menuTilePrimary:disabled .menuTileCode` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::before` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |

#### mainMenu

| Selector | Matching viewport(s) |
| --- | --- |
| `#mainMenu .fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTilePrimary::before` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileLabel` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileMeta` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::before` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |

#### settingsOverlay

| Selector | Matching viewport(s) |
| --- | --- |
| `#mainMenu .fifaMenuHeading` | 393x660, 1280x800 |
| `.fifaMenuGrid` | 393x660, 1280x800 |
| `.menuTile` | 393x660, 1280x800 |
| `.menuTilePrimary` | 393x660, 1280x800 |
| `.menuTilePrimary::before` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileCode` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileLabel` | 393x660, 1280x800 |
| `.menuTilePrimary .menuTileMeta` | 393x660, 1280x800 |
| `.menuCoverAthlete` | 393x660, 1280x800 |
| `.menuCoverAthlete::before` | 393x660, 1280x800 |
| `.menuCoverAthlete::after` | 393x660, 1280x800 |
| `.menuCoverAthlete img` | 393x660, 1280x800 |
| `.menuCoverAthlete.imageLoaded img` | 393x660, 1280x800 |
| `.menuCoverNumber` | 393x660, 1280x800 |
| `.menuCoverTag` | 393x660, 1280x800 |
| `.menuTileNew` | 393x660, 1280x800 |
| `.menuTileLegacy` | 393x660, 1280x800 |
| `.menuTileTrophy` | 393x660, 1280x800 |
| `.menuTileRules` | 393x660, 1280x800 |
| `.menuTileSettings` | 393x660, 1280x800 |
| `.menuBottomStrip` | 393x660, 1280x800 |
| `.menuMusicTile` | 393x660, 1280x800 |

### Hidden-document-only selectors (never an active match)

None.

### Selectors with no match anywhere in the sampled document

- `.menuTile:hover:not(:disabled)`
- `.menuTile:focus-visible`
- `.menuCoverAthlete.imageFailed`

## Resource observations

First-party failed HTTP responses: none. Page errors: 0. External hosts were blocked by the audit to keep fixture execution local; external font availability is not CSS-selector evidence.
