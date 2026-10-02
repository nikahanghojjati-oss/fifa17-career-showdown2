# Rivalry Statistics · product truth

Authority: `main` product code plus `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`.
This sheet describes the build target for factory jobs. Where the current `main` renderer exposes fields outside DATA_CONTRACT_V1 §5, the contract wins for the factory screen.

## Ids and routes

### Screen creation and render

Source: `main/js/statistics.js`.

- `createStatisticsScreen()` lazily creates `section#statistics.screen.hidden.analyticsScreen`.
- The screen heading is `RIVALRY STATISTICS`.
- `div#rivalryStatisticsContent.analyticsContent` is the render mount used by `renderRivalryStatistics()`.
- `openRivalryStatistics()` requires `currentShowdown`, creates the screen, renders it, then calls `showScreen("statistics")`.
- `getRivalryStatisticsRenderKey()` keys rerenders from `currentShowdown.id`, `updatedAt`, `status`, and the rounds length.

### Inbound routes

Source: `main/js/optionalModules.js`, `main/js/statistics.js`, and `main/js/showdownUI.js`.

- Active Showdown / dashboard: `ensureStatisticsDashboardButtonShell()` creates `button#rivalryStatisticsButton.menuButton` labelled `RIVALRY STATISTICS`; `initializeOptionalModules()` binds it to `openOptionalModule("statistics")`, which lazy-loads and calls `openRivalryStatistics()`.
- Career Statistics: `button#careerStatisticsRivalryButton.menuButton` is labelled `CURRENT RIVALRY STATISTICS` and calls `openRivalryStatistics()` when `currentShowdown` exists.
- Completed Showdown hub: the `RIVALRY STATISTICS` completion action calls `openOptionalModule("statistics")`.

### Back route

Source: `main/js/statistics.js` and `main/js/screens.js`.

- The screen creates a class-only `button.backButton` with visible text `BACK TO SHOWDOWN HOME`; it has no dedicated id.
- `initializeSmartBackDelegation()` captures clicks on `.backButton` and calls `navigateBackSmart()`.
- `SAFE_BACK_TARGETS.statistics` is `["dashboard", "mainMenu"]`. Screen history is preferred when legal; otherwise the first legal valid fallback is used.
- `statistics` itself is route-valid only when a Showdown exists.

### Stable ids and classes used by product code / styling

Ids:
- `statistics`
- `rivalryStatisticsContent`
- inbound `rivalryStatisticsButton`
- inbound `careerStatisticsRivalryButton`

Classes created or consumed by the live Rivalry Statistics renderer:
- `screen hidden analyticsScreen`
- `analyticsContent`
- `analyticsActions`
- `backButton`
- `rivalryStatisticsHero`
- `rivalryStatisticsOverview`
- `rivalryStatisticsMatchup`
- `rivalryManagerHero`
- `analyticsClubName`
- `rivalryHeroScore`
- `analyticsSectionHeading`
- `analyticsStatsGrid`
- `analyticsStatCard`
- `comparisonTable`
- `comparisonRow`
- `comparisonLeader`
- `seasonProgressionList`
- `seasonProgressionRow`
- `seasonProgressionLabel`
- `seasonStatSide` and modifier `right`
- `seasonStatTop`
- `seasonPointTrack`
- `seasonPointFill`
- `analyticsEmpty`

The factory build may restyle these, but must preserve route and test-critical ids and equivalent semantics.


## Buttons and visible strings on `main`

Source: `main/js/statistics.js`, `main/js/screens.js`, and the lazy-entry notice in `main/js/optionalModules.js`.

### Buttons

| Control | Exact visible text | Behaviour |
| --- | --- | --- |
| Screen Back button | `BACK TO SHOWDOWN HOME` | Class `.backButton`; smart Back resolves to the active Showdown dashboard when valid, otherwise Main Menu. |

There are no other module-local buttons created inside `#statistics` on `main`. The shared factory top bar is a separate component (job 125), not a string invented by this screen.

### Static strings copied exactly from live code

- `RIVALRY STATISTICS`
- `BACK TO SHOWDOWN HOME`
- `SHOWDOWN POINTS`
- `RIVALRY TOTALS`
- `SEASONS COMPLETED`
- `TROPHIES WON`
- `TRANSFER SIGNINGS`
- `RELEASED SIGNINGS`
- `PERFECT SEASONS`
- `11-point seasons`
- `HEAD-TO-HEAD`
- `Showdown Points`
- `Season Wins`
- `Season Draws`
- `Total Trophies`
- `Champions Leagues`
- `League Titles`
- `Domestic Cups`
- `Performance Bonuses`
- `Awards Bonuses`
- `100-Point Seasons`
- `100-Goal Seasons`
- `Top Scorer Seasons`
- `Top Assist Seasons`
- `Perfect 11-Point Seasons`
- `Average Season Score`
- `Best Season Score`
- `Best League Points`
- `Best League Goals`
- `Transfer Signings`
- `Signings Released`
- `SEASON-BY-SEASON`
- `No season has been completed yet. Statistics will build automatically as seasons are finished.`
- `No active showdown is available.`
- `League not selected`
- `Club`
- `Draw`

The lazy-entry guard outside the screen can show the exact notice `No active showdown is available for Rivalry Statistics.` when a Rivalry Statistics route is requested without an active Showdown.

### State-dependent / templated live strings

- Showdown title: `analytics.showdown.name`.
- Overview meta: `{league name} · {showdown status}`; league fallback is exactly `League not selected`.
- Manager names, current club names and Showdown point totals are live values.
- Rivalry total progress subtext: `of {totalRounds}`.
- Season label: `SEASON {season}`.
- Season winner text: `{manager name} won`, or exactly `Draw`.
- Season point values are live computed scores; the bar width is score / 11.

### Accessibility text

`prepareScreenAccessibility("statistics", ...)` assigns the heading id `statisticsScreenTitle`, gives it `tabindex="-1"`, and sets `#statistics[aria-labelledby="statisticsScreenTitle"]`. The Back button has no separate `aria-label`; its accessible name is its visible text. The live Rivalry Statistics renderer defines no other module-specific aria-label strings.

### Important live-versus-contract note

This section records what `main` currently writes. DATA_CONTRACT_V1 §5 is stricter. Step 3 below defines the factory field set and therefore which of these live stat labels survive the new screen.


## Data contract

Binding source: `project-documents/factory/DATA_CONTRACT_V1.md` §0 and §5 (agreed with Team G). Manager roles map `playerOne → daniel` and `playerTwo → nik`; Daniel is always first/left.

E = exists on `main` now. A = Team G / integration work still has to add or wire it.

| Contract field | E/A | Source on `main` | Level | Factory use |
| --- | --- | --- | --- | --- |
| `status` | contract state | DATA_CONTRACT_V1 §0; adapter state around provider/current data | screen read | One of `loading`, `empty`, `unavailable`, `partial`, `ready`. |
| `coverage` | contract state support | DATA_CONTRACT_V1 §0 | screen read | Required when `status="partial"`; never call partial data all-time/career-complete. |
| `interimLabel` | contract state support | DATA_CONTRACT_V1 §0 | screen read | Exact interim copy: `Current Showdown only. Career history is not yet available.` |
| `leagueId` | E | current Showdown/shared setup; `js/sharedHistoryConvergence.js` `hcBuild()` returns projection `leagueId` | per Showdown | League identity; fixture values only from the five contract ids. |
| `clubs.daniel`, `clubs.nik` | E | current `showdown.clubs.playerOne/playerTwo`; `buildRivalryManagerStats()` in `js/analytics.js` also attaches the manager club | per Showdown | Text club names plus our original code-drawn crests. |
| `season` | E | current round / shared multi-season cursor on `main` | per Showdown current state | Current season number. |
| `totalSeasons` | E | shared setup `totalSeasons`; `js/sharedHistoryConvergence.js` `hcBuild()` | per Showdown | Only 1, 3, 5 or 10. |
| `score.daniel`, `score.nik` | E | accumulated canonical season scores; `js/sharedHistoryConvergence.js` `hcAccumulate()` → `managerRecords.*.totalPoints`; legacy renderer also derives totals through `buildRivalryManagerStats()` | per Showdown | Current Showdown point totals. |
| `managerRecords.daniel.seasonWins` / `.nik...` | E | `js/sharedHistoryConvergence.js` `hcAccumulate()` | per Showdown aggregate | Head-to-head manager record. |
| `managerRecords.*.seasonDraws` | E | same | per Showdown aggregate | Head-to-head manager record. |
| `managerRecords.*.seasonLosses` | E | same | per Showdown aggregate | Head-to-head manager record. |
| `managerRecords.*.championsLeagues` | E | same | per Showdown aggregate | Trophy count. |
| `managerRecords.*.leagueTitles` | E | same | per Showdown aggregate | Trophy count. |
| `managerRecords.*.domesticCups` | E | same | per Showdown aggregate | Trophy count. |
| `managerRecords.*.totalTrophies` | E | `js/sharedHistoryConvergence.js` `hcFinalize()` | per Showdown aggregate | Sum of the three recorded trophy wins. |
| `managerRecords.*.hundredPointSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Recorded threshold occurrence count. |
| `managerRecords.*.hundredGoalSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Recorded threshold occurrence count. |
| `managerRecords.*.topScorerSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Yes/no per season accumulated to a count; no player name. |
| `managerRecords.*.topAssistSeasons` | E | `hcAccumulate()` | per Showdown aggregate | Yes/no per season accumulated to a count; no player name. |
| `managerRecords.*.perfectSeasons` | E | `hcAccumulate()` when canonical season score is 11 | per Showdown aggregate | Perfect-season count. |
| `managerRecords.*.bestSeasonScore` | E | `hcAccumulate()` | per Showdown aggregate | Best canonical season score. |
| `seasons[].season` | E | `seasonHistory[].roundNumber` from `js/sharedHistoryConvergence.js` `hcBuild()`; legacy `buildRivalryAnalytics()` maps `round.roundNumber` | per season | Display season number. |
| `seasons[].score.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.scoring.total`; legacy `getAnalyticsScoring()` | per season | Canonical computed score, max 11. |
| `seasons[].winner` | E | canonical `seasonHistory[].winner` from `hcScoring()` / `hcBuild()` | per season | Adapter maps `playerOne` → `daniel`, `playerTwo` → `nik`, `draw` → draw. |
| `seasons[].leaguePosition.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.leaguePosition` | per season | Position within league team count. |
| `seasons[].leaguePoints.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.leaguePoints` | per season | 0..(teams−1)×6. |
| `seasons[].leagueGoals.daniel`, `.nik` | E | `seasonHistory[].playerOne/playerTwo.leagueGoals` | per season | 0..300. |
| `transfers.status` | A (G-10) | no model-true Rivalry Statistics adapter yet | transfer read | Same five-state vocabulary; transfer failure must not zero or block non-transfer stats. |
| per-season transfer guess/signing summary | A (G-10) | Transfer War data exists elsewhere on `main`, but the agreed history projection/adapter is not yet delivered | per season | Show only when transfer history is actually available. |
| provider-state adapter for this screen | A (G-5) | `js/productionSharedHistoryConvergence.js` already reads provider-backed converged history and exposes `getState()`; Rivalry Statistics still renders from local `currentShowdown` | screen adapter | Job 104 later replaces sample fixtures with model-true fixtures / provider view-model data. |

### Contract states

The factory build must design exactly these five top-level read states:

1. `loading`
2. `empty` — a successful read for a new career / nothing recorded yet
3. `unavailable` — the read failed; never represent it as empty or all-zero
4. `partial` — some Showdowns/read segments are unavailable; show `coverage`
5. `ready`

Transfers independently carry `transfers.status` using the same five values. A transfer read failure never blocks the points, season or trophy sections and never renders transfer signings as zero.

Before provider career history is real, owner-review previews may carry only this exact interim label:

`Current Showdown only. Career history is not yet available.`

### Contract-enforced drops from the current `main` renderer

DATA_CONTRACT_V1 says anything not listed for this screen is dropped. Therefore the factory screen must not preserve these current `main` rows/tiles as standalone stats:

- `Performance Bonuses`
- `Awards Bonuses`
- `Average Season Score`
- `Best League Points`
- `Best League Goals`
- `Signings Released` / `RELEASED SIGNINGS`

`Transfer Signings` survives only through the contract transfer summary and only when `transfers.status` makes that history available.

DATA_CONTRACT_V1 §9 also forbids clean sheets, biggest single-match win, non-Champions-League European wins, player names, player-based leaders/photos, match-by-match results, possession and any per-match stat. Top scorer and top assist are boolean season achievements, never player names.


## Screen states and preview frames

### State model

There are two independent axes.

Top-level data-read state (binding DATA_CONTRACT_V1 §0):
- `loading`: request in flight; no stale values presented as current.
- `empty`: successful read with no recorded rivalry seasons yet.
- `unavailable`: read failed. This is the contract's error state; do not invent a sixth `error` status.
- `partial`: some readable data exists and some is missing; show `coverage`.
- `ready`: all data required for the current view was read successfully.

Transfer-history state:
- `transfers.status` independently uses `loading | empty | unavailable | partial | ready`.
- Transfer unavailable/partial never suppresses non-transfer points, season history or trophies.
- Transfer unavailable is labelled unavailable, never rendered as 0 signings.

Showdown lifecycle (orthogonal to read status):
- active / in progress: `season` is within the configured Showdown and fewer than `totalSeasons` seasons may be completed.
- completed: all configured seasons are closed; scores and manager records are final for that Showdown.
- first season / nothing played: valid successful `empty` state for rivalry results while league, clubs and season plan may already exist.

Viewer role:
- The screen can be opened by Daniel or Nik, but the content order does not change with viewer role.
- Daniel is always first/left and Nik second/right. No private inputs are revealed and no role-specific rivalry stat row is hidden.
- Therefore preview frames do not need mirrored Daniel-view and Nik-view duplicates; the same frame is valid for both viewers.

### Required preview frames

| Frame | Product situation | Top-level status | Transfer status | What the preview must prove |
| --- | --- | --- | --- | --- |
| RV1 | Active Showdown mid-way | `ready` | `ready` | Current season/total, Daniel-left/Nik-right score, completed season rows, recorded manager totals and available transfer summary. Fictional preview data only. |
| RV2 | Completed Showdown | `ready` | `ready` | Final score, all configured seasons present, final manager record/trophy counts, a level-score season won on league position. No drawn season: a draw needs equal league positions, which two managers in one league cannot have (review 2026-10-02). Fictional preview data only. |
| RV3 | First season, nothing played yet | `empty` | `empty` | League/clubs/season plan may exist, but no completed season row. Use honest empty copy rather than fabricated career history. Fictional preview setup only. |
| RV4 | Rivalry data readable, transfer history unavailable | `ready` | `unavailable` | All non-transfer stats remain visible; transfer area explicitly says unavailable and never shows 0 signings. Fictional preview data only. |

Additional designed states not assigned a dedicated numbered frame in this truth job:
- top-level `loading`
- top-level `unavailable` (the read-error presentation)
- top-level `partial` with a visible `coverage` value
- independent transfer `loading` and `partial`

Reason for adjustment from the job's wording: `error` is not a sixth contract status. DATA_CONTRACT_V1 defines a failed read as `unavailable`; the build should still have explicit error copy/presentation, but its machine state remains `unavailable`.

Every owner-review preview carries `previewLabel: "Preview data"`. Until model-true provider history replaces the samples, the preview view model also uses the exact interim label `Current Showdown only. Career history is not yet available.`


## Mockup → product reconciliation

Mockup authority for composition: `project-documents/factory/mockups/MOCKUP_RIVALRY_STATISTICS.png`.
The later plate/build specifications describe its concrete anatomy: Daniel left pointing; Nik right with arms crossed; a tall seven-row comparison panel; three bottom panels (Head-to-Head, Season-by-Season, Trophy Cabinet); one Back button; top navigation, title block, footer and the decorative caption `RIVALS BUILD LEGACIES`.

| Mockup element | Product answer | Binding reason / implementation note |
| --- | --- | --- |
| Night stadium, crowd bokeh, banners, floodlights, warm-gold atmosphere | KEEP AS IS | Pure scene art; keep exact mockup registration on desktop. No real league/club marks may appear in any banner. |
| Daniel on the left, pointing toward viewer/panel | KEEP AS IS | Daniel is always LEFT. His face, hair and pointing hand are likeness-locked. The pointing hand is the signature depth moment and must sit over the panel edge where they overlap. |
| Nik on the right, arms crossed | KEEP AS IS | Nik is always RIGHT. Never mirror him. Preserve likeness and crossed-arm pose. |
| Daniel / Nik handwritten decorative tags | KEEP AS IS | PRODUCT_TRUTH explicitly permits these decorative brand tags. They are art, not live/private data. |
| Mockup top navigation bar | CHANGE TO shared product navigation | Desktop shell is the 52 px shared top bar: HOME / CAREER / STANDINGS / STATS / RULES plus the settings icon. No ABOUT, search or profile item. Job 125 owns the shared bar. |
| Mockup title block | KEEP WITH PRODUCT WORDING | Fixed screen title is exactly `RIVALRY STATISTICS`; render it as the approved gold brush wordmark image with visually-hidden real text. Keep the shared eyebrow/tagline hierarchy; no cover box behind it unless the reference visibly has one. |
| Tall central comparison panel | KEEP AS IS structurally | Keep the mockup's tall centred comparison-panel composition and gold-edged dark-glass craft. All numbers, names, clubs and state are live DOM from the view model / fixture, never baked into the plate. |
| Daniel header crest in comparison panel | CHANGE TO original code-drawn crest | Real club crest in the reference is rights-ineligible. Use the app's original generated club identity / crest for Daniel's current club. |
| Daniel header name and club name | KEEP WITH LIVE PRODUCT DATA | Daniel remains the left header. Manager and club strings come from the view model. |
| Nik header crest in comparison panel | CHANGE TO original code-drawn crest | Same rights rule as Daniel; use the app's original generated club identity / crest. |
| Nik header name and club name | KEEP WITH LIVE PRODUCT DATA | Nik remains the right header. |
| Seven comparison rows: overall structure (large number left · gold icon/label · large number right) | KEEP AS IS structurally | Preserve seven-row hierarchy and leader emphasis, but only contract-supported values may occupy the rows. |
| Comparison row 1 | CHANGE TO `Showdown Points` | Contract field `score.{daniel,nik}`; exact live label already exists on `main`. |
| Comparison row 2 | CHANGE TO `Season Wins` | Contract field `managerRecords.*.seasonWins`; exact live label exists. |
| Comparison row 3 | CHANGE TO `Total Trophies` | Contract field `managerRecords.*.totalTrophies`; exact live label exists. This count is league + domestic cup + Champions League wins and does not include a Showdown Champion display token. |
| Comparison row 4 | CHANGE TO `Champions Leagues` | Contract field `managerRecords.*.championsLeagues`; exact live label exists. |
| Comparison row 5 | CHANGE TO `League Titles` | Contract field `managerRecords.*.leagueTitles`; exact live label exists. |
| Comparison row 6 | CHANGE TO `Domestic Cups` | Contract field `managerRecords.*.domesticCups`; exact live label exists. |
| Comparison row 7 | CHANGE TO `Transfer Signings` when available; otherwise `Unavailable` | Transfer summary is G-10. Never turn an unavailable transfer read into zero. The row remains present so the seven-row mockup rhythm is stable. |
| Any mockup comparison row for clean sheets, biggest win, non-CL European wins, match stats, player names/photos, possession, averages or other uncontracted stats | DROP | DATA_CONTRACT_V1 §5/§9 and PRODUCT_TRUTH §3. These values are not recorded or are outside this screen contract. |
| Gold icon in each comparison row | KEEP CONCEPT, CHANGE ART AS NEEDED | Use original/generic stat iconography only. No real competition, league, club or trophy logo. Icons are decorative; labels carry meaning. |
| Leader number highlighted gold, other number white | KEEP AS IS | This is presentation only and does not alter scoring. Equal values receive no false leader. |
| Bottom panel: `HEAD-TO-HEAD` | KEEP WITH PRODUCT DATA | Show Daniel season wins, Nik season wins and season draws as the three giant numerals from `managerRecords`. Because this is a two-manager rivalry, each manager's season losses are the rival's wins; do not invent another match-result stat. |
| Bottom panel: `SEASON-BY-SEASON` | KEEP WITH PRODUCT DATA | Each row uses contract `seasons[].season`, canonical `score.daniel`, `score.nik`, and `winner`. Position/points/goals remain available in the view model but are not added to this compact mockup panel unless a later approved interaction needs them. |
| Season winner icon in Season-by-Season panel | CHANGE TO original winner crest / draw treatment | Winner uses that manager's original code-drawn crest. A draw uses a gold dash plus exact text `Draw`. |
| Bottom panel: `TROPHY CABINET` | KEEP, CHANGE ALL TROPHY ART | Use only original trophy art from jobs 19–22. League Title, Domestic Cup and Champions League counts come from `managerRecords`. The Showdown Champion trophy may show a winner token only when the current Showdown is completed and the final point total has a winner; it is not added into `managerRecords.totalTrophies`. Active/undecided state shows no fabricated win. |
| Any real-looking trophy art in the mockup | CHANGE TO factory trophy assets | PRODUCT_TRUTH rights gate. Never trace or ship the reference trophies. |
| One button: `BACK TO SHOWDOWN HOME` | KEEP AS IS | Exact live product button and smart-back behaviour from `main`. It is the screen's only module-local button. |
| Mockup footer bar | DROP as screen-local decoration | Global navigation is supplied by the shared top bar on desktop and shared bottom bar on phone. Do not duplicate navigation chrome. |
| Small caption `RIVALS BUILD LEGACIES` | DROP | It is not a live product string and the later build specification does not require it. Removing it avoids inventing persistent product copy. |
| Any names, club names, scores, counts, season rows or transfer values baked into the mockup | CHANGE TO live DOM | H3: no live/private data in images. The clean plate contains only scene/people/decorative art. |
| Any real club crests / league logos present in reference pixels | DROP / REPLACE | H2 rights gate. Club identity is original code-drawn art; league identity uses the factory league marks when needed. |
| Any player photo or player-based leader in the reference | DROP | Players are not a recorded Rivalry Statistics entity; PRODUCT_TRUTH forbids player photos/names as stats. |

### Head-to-head block (reused by Standings, job 126)

DATA_CONTRACT_V1 §10: Standings shows this block with its own layout. Exact fields:

- `score.daniel`, `score.nik`: Showdown points (sum of `seasons[].score`).
- `managerRecords.daniel.seasonWins` / `.seasonDraws` / `.seasonLosses` and the same three for `nik`.
- Invariants: `daniel.seasonWins = nik.seasonLosses`, `nik.seasonWins = daniel.seasonLosses`, `daniel.seasonDraws = nik.seasonDraws`, wins + draws + losses = number of completed seasons.
- On `main`, `HEAD-TO-HEAD` is the heading of the comparison table (`js/statistics.js`), not a W/D/L block; the W/D/L panel layout comes from the mockup.

### Contract fields intentionally available but not promoted into the seven primary rows

The adapter still carries `seasonDraws`, `seasonLosses`, `hundredPointSeasons`, `hundredGoalSeasons`, `topScorerSeasons`, `topAssistSeasons`, `perfectSeasons`, `bestSeasonScore`, and per-season league position/points/goals. They remain model truth for state/details and future approved UI, but the desktop mockup's fixed seven-row comparison rhythm is not expanded to cram them in. Head-to-Head already surfaces draws, and Season-by-Season owns the canonical season sequence.
