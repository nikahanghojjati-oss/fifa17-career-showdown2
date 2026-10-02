# Legacy (History) product truth

Authority: live product on `main` (read only) plus `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`. Product behaviour on `main` wins when it conflicts with older presentation text. The old model relay is intentionally not used by this factory project.

## Ids and routes

### Screen shell and stable hooks

| Hook | Live source | Dependency / meaning |
| --- | --- | --- |
| `#legacy` | `index.html` | Screen id used by `screens.js`, optional-module routing and CSS. |
| `#legacy .legacyBox` | `index.html`, `js/legacy.js`, `css/legacy.css` | Render target replaced by `renderLegacy()`. |
| `#legacyButton` | `index.html`, `js/screens.js`, `js/optionalModules.js` | Home HISTORY / LEGACY tile that opens the lazy Legacy module. |
| `.backButton[data-smart-back]` | `index.html`, `js/screens.js` | Screen Back control. The visible live label is `BACK TO MAIN MENU`, but routing is centralized by `navigateBackSmart()`. |
| `.screen.hidden` | `index.html`, `js/screens.js` | Shared screen visibility contract. |

### Classes created by the live Legacy renderer and consumed by Legacy CSS

`legacyStatsGrid`, `legacyStat`, `legacySectionHeading`, `legacyEmpty`, `legacyList`, `legacyShowdownCard`, `legacyCardTop`, `legacyCardTitle`, `legacyMatchup`, `legacyWinner`, `legacyCardMeta`, `legacyDetails`, `legacySeasonList`, `legacySeasonRow`, `legacySeasonNumber`, `legacySeasonManager` (plus modifier `right`), `legacySeasonScore`, `legacySeasonHonours`, `legacyCardActions`, `compactButton`, `dangerButton`, `legacyDataControls`, `legacyBackupSummary`, `legacyControlButtons`, `primaryDataButton`, and `legacyDataStatus`.

The legacy stylesheet also contains import-analysis classes (`legacyImportAnalysis`, `legacyImportEyebrow`, `legacyImportDropZone`, `legacyImportNativeInput`, `legacyImportFileState`, `legacyImportStatus`, `legacyImportActions`, `legacyImportResult`, `legacyImportVerdict`, `legacyImportPreviewGrid`, `legacyImportPreviewCard`, `legacyImportMigrationSummary`, `legacyImportConflictList`, `legacyImportMessages`). Those belong to the current local backup/import tooling, not to the online Legacy archive surface; the factory screen does not reproduce them.

### Open route

1. Home `#legacyButton` is bound to `openLegacy()` in `js/screens.js`.
2. `openLegacy()` calls `window.openOptionalModule("legacy")`.
3. `js/optionalModules.js` lazy-loads the Legacy module, calls `showScreen("legacy")`, and may mount the local restore panel on the current product.
4. `showScreen("legacy")` calls `window.renderLegacy()` before entry.
5. `legacy` is always a valid optional route in `isRouteStateValid()`.

### Back route

`SAFE_BACK_TARGETS.legacy` is `["dashboard", "mainMenu"]`. A click on any non-danger `.backButton` is intercepted by the centralized smart-back delegation. It first uses a legal prior screen from navigation history; otherwise it falls back through Dashboard then Home. Therefore the factory build must preserve the Back semantic hook, not hard-code a separate history stack.

## Buttons and strings

All strings below are copied from live `main`. Dynamic values are shown as code templates rather than rewritten prose.

### Core Legacy actions

| Control | Exact live label | Live behaviour | Factory answer |
| --- | --- | --- | --- |
| Home tile | `LEGACY` (code `HISTORY`; meta `Completed rivalries and season history`) | Opens the optional Legacy module. | Route authority. |
| Back | `BACK TO MAIN MENU` | `.backButton[data-smart-back]` delegates to smart Back; legal targets are Dashboard then Home. | Keep Back semantics; presentation may be supplied by shared nav. |
| Per-card disclosure | `VIEW SEASON HISTORY` | Opens that archived Showdown's season rows lazily. | KEEP; this is the one Legacy primary action required by product truth. |
| Per-card destructive action | `DELETE SHOWDOWN` | Confirms, then deletes the local archived copy and possibly its matching completed active copy. | Live on `main`; DROP from the factory online Legacy surface. |
| Local data action | `EXPORT BACKUP` | Exports local backup; busy label `BUILDING BACKUP…`. | DROP from online Legacy. |
| Local data action | `DELETE ALL LEGACY HISTORY` | Destructive local-history clear behind confirm. | DROP from online Legacy. |
| Local data action | `RESET ALL SHOWDOWN DATA` | Destructive local reset behind confirm. | DROP from online Legacy. |
| Import preview | `ANALYZE BACKUP` | Read-only local backup analysis; busy label `ANALYZING…`. | DROP from online Legacy. |
| Import preview | `CLEAR PREVIEW` | Clears selected import preview. | DROP from online Legacy. |
| Restore | `REVIEW RESTORE` | Verifies a selected local backup; busy label `VERIFYING…`. | DROP from online Legacy. |
| Restore | `APPLY RESTORE` | Applies an explicitly reviewed local restore; busy label `REVALIDATING & APPLYING…`. | DROP from online Legacy. |

### Core Legacy visible copy

Screen shell:
- `LEGACY`
- Initial HTML placeholders before `renderLegacy()`: `Showdowns Played`, `Trophies Won`, `Total Points`.
- Rendered stat labels: `SHOWDOWNS PLAYED`, `TROPHIES WON`, `TOTAL POINTS`.
- Section heading: `COMPLETED RIVALRIES`.
- Empty state: `No completed showdowns yet. Finish a rivalry and it will be archived here automatically.`
- Date fallback: `Date unavailable`.
- League fallback: `League unavailable`.

Card templates:
- Subtitle: `{leagueName} · {N} season` / `{leagueName} · {N} seasons · completed {formattedDate}`.
- Daniel-side live template today is `{playerOneManager} · {playerOneClub}`.
- Score: `{playerOneShowdownPoints} - {playerTwoShowdownPoints}`.
- Nik-side live template today is `{playerTwoClub} · {playerTwoManager}`.
- Winner: `{playerOneManager} wins the showdown` / `{playerTwoManager} wins the showdown` / `Showdown finishes level`.
- Meta line 1: `{N} trophies won`.
- Meta line 2: `{N} total showdown points`.
- Season heading: `SEASON {roundNumber}`.
- Per-manager season line: `{managerName}: #{leaguePosition} · {leaguePoints} league pts · {leagueGoals} goals`.
- Season score: `{danielSeasonScore} - {nikSeasonScore}`.
- Honours tokens are exactly `Champions League`, `League`, `Domestic Cup`, `Performance Bonus`, `Awards Bonus`; fallback `No honours`; tokens are joined with ` · `.
- Transfer-release suffix on current local history: ` · {N} transfer release` / ` · {N} transfer releases`. This is not a contracted online Legacy field and is dropped unless a future contract explicitly adds it.

### Core Legacy local data-management copy on main

These strings are live today because `renderLegacy()` appends `createLegacyDataControls()`. They are documented here so the new screen does not accidentally preserve them.

- `DATA MANAGEMENT`
- `Download a checksum-protected local backup before destructive maintenance. Export is read-only: it does not change your active Showdown, Legacy history or application preferences.`
- `LOCAL BACKUP`
- `Human-readable JSON · format v1 · SHA-256 corruption check · malformed current bytes preserved in recovery data`
- `Backup export is ready.`
- `Backup export is unavailable in this browser session.`
- `Building a read-only backup and verifying its checksum…`
- `Backup downloaded with {N} recovery warning. Your stored bytes were not changed.`
- `Backup downloaded with {N} recovery warnings. Your stored bytes were not changed.`
- `Backup downloaded successfully. Your stored bytes were not changed.`
- `Backup could not be created: {error}`
- `The Legacy showdown could not be deleted from browser storage.`
- `The active completed copy could not be removed, so the Legacy deletion was rolled back.`
- `The active completed copy could not be removed and the Legacy rollback also failed. Refresh before making more data changes.`
- `Deleted "{showdown.name}" from local Legacy history.`
- `Legacy history could not be cleared from browser storage.`
- `The completed active copy could not be removed, so Legacy history was restored.`
- `Legacy was cleared but the active completed copy could not be removed, and rollback failed. Refresh before continuing.`
- `Legacy history was deleted successfully.`
- `The full reset did not complete. The interface has reloaded the data that is still available; refresh before trying again.`
- `All active and Legacy Showdown data was reset successfully. Application preferences were kept.`

Exact confirms:
- `Delete "{showdown.name}" from Legacy and remove its active completed copy? This cannot be undone.`
- `Delete "{showdown.name}" from Legacy? This cannot be undone.`
- `Delete every archived showdown from Legacy? The active copy of the completed showdown will also be removed so it cannot immediately re-archive. Unfinished active saves are not affected. This cannot be undone.`
- `Delete every archived showdown from Legacy? Your unfinished active showdown, if any, will remain. This cannot be undone.`
- `Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone.`

### Import-analysis panel mounted on the live Legacy screen

Static copy:
- `PREVIEW ONLY · NO RESTORE WRITES`
- `IMPORT ANALYSIS & MIGRATION PREVIEW`
- `Choose a Career Mode Showdown backup to verify its checksum, validate supported schemas, preview historical migrations and classify conflicts. Candidate B never changes active data, Legacy history or preferences.`
- `DROP BACKUP JSON HERE`
- `or press Enter / Space to choose a file`
- `ANALYZE BACKUP`
- `CLEAR PREVIEW`
- `Analysis is read-only. Restore is intentionally unavailable in Candidate B.`
- `PREVIEW READY` / `ANALYSIS BLOCKED`
- `Backup passed Candidate B analysis. Nothing has been restored or written.`
- `The file cannot advance to a later restore stage until the listed problems are resolved.`
- Result labels: `CHECKSUM`, `ACTIVE SHOWDOWN`, `LEGACY`, `PREFERENCES`, `MIGRATION PREVIEW`, `LEGACY RECORD PREVIEW`, `BLOCKING PROBLEMS`, `WARNINGS / REVIEW NOTES`.
- Checksum values: `VERIFIED`, `FAILED`, fallback `Unavailable`.

State templates:
- `No file selected · maximum {size}`
- `{filename} · {size}`
- `This file exceeds the safe analysis limit and will be rejected before its contents are read.`
- `File selected. Press Analyze Backup to run checksum, schema, migration and conflict preview.`
- `Analyzing in memory. Browser storage will not be changed.`
- `Preview complete. No browser data was changed. Candidate C restore remains unavailable.`
- `Preview found blocking problems. No browser data was changed.`
- `Analysis failed safely. No browser data was changed.`
- `Preview cleared. Browser storage was not changed.`
- Legacy preview value: `{newRecords} NEW · {exactDuplicates} EXACT`; detail `{sameEffectiveRevision} same-revision · {differentRevision} different-revision · {malformedUnresolvable} unresolved`.
- Migration line: `{path}: schema {sourceVersion} → {targetVersion} · {steps}`; overflow `+ {N} additional migration record(s)`.
- Record line: `{nameOrRecord} · ID {idOrUnresolved} · {category}`; overflow `Preview limited to 10 notable records; totals above include all {N}.`
- Message overflow: `+ {N} additional message(s)`.

ARIA on this panel:
- `Choose or drop a Career Mode Showdown JSON backup`
- `Career Mode Showdown backup JSON file`
- The file state, status and result containers use live-region semantics (`role="status"` / `aria-live="polite"` as applicable).

### Atomic restore panel mounted on the live Legacy screen

Static copy:
- `CANDIDATE C · VERIFIED APPLY`
- `ATOMIC RESTORE & RECOVERY`
- `Choose a backup to review restore choices. Apply locks the exact confirmed file and choices, revalidates browser state, snapshots exact raw bytes, verifies the complete commit and rolls back only transaction-owned mutations if any write or verification fails.`
- `Choose…`
- `BACKUP ACTIVE`, `BACKUP LEGACY`, `BACKUP PREFERENCES`
- `Backup active slot is empty`
- `Merge preserves local-only history; replace matches the backup archive.`
- `Available`, `Empty`, `Reduced motion on`, `System motion`, `Menu feedback off`, `Menu feedback on`, `Backup has no saved preferences`
- Choice labels `ACTIVE SHOWDOWN`, `LEGACY HISTORY`, `PREFERENCES`, `SAVE LIBRARY`
- Choice values `Keep current active state`, `Use backup active Showdown`, `Match backup: remove current active Showdown`, `Keep current Legacy only`, `Merge backup into current Legacy`, `Replace current Legacy with backup`, `Keep current preferences`, `Use backup preferences`, `Match backup: remove saved preferences`, `Keep current Save Library`, `Replace entire Save Library with backup`
- `LEGACY CONFLICT CHOICES REQUIRED`, `Choose conflict result…`, `Keep local record`, `Use backup record`
- `EXACT STORAGE SNAPSHOT UNAVAILABLE`
- `Browser storage could not be read without ambiguity. Nothing can be applied until a complete exact snapshot succeeds.`
- `RESTORE PLAN READY`, `RESTORE PLAN INCOMPLETE`, `RECOVERY CHECKPOINT`
- `Use Export Backup above first if you want an extra copy of the current browser data before applying replacement choices.`
- `BACKUP BLOCKED`; fallback `Backup analysis failed.`
- Recovery headings `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, `CRITICAL RECOVERY STATE`.

Restore state/templates include:
- `No active Showdown in backup`
- `{N} record` / `{N} records`
- `Showdown ID {id}`
- `Local: {localName} · Backup: {backupName}`
- `Analysis is read-only. Use Atomic Restore & Recovery below when you are ready to choose and apply a restore plan.`
- `Preview complete. No browser data was changed. Use Atomic Restore & Recovery below when you are ready to choose and apply a restore plan.`
- `Verifying checksum, schemas, migrations and an exact current-state snapshot in memory. Nothing is being changed.`
- `{filename} selected. Review is read-only until Apply.`
- `No restore file selected.`
- `{filename} remains selected. Review again before applying.`
- `No restore file selected. Export Backup above first if you want an extra recovery copy.`
- `Backup verified against an exact browser-state snapshot. Choose how each data area should be resolved.`
- `Backup verified, but exact browser storage could not be snapshotted safely. Nothing can be applied until Review succeeds with a complete snapshot.`
- `Backup cannot be restored because verification found blocking problems.`
- `Restore review failed safely: {error}`
- `Confirmed choices are locked. Revalidating the exact selected file and browser bytes before any write…`
- `Restore committed and verified. Refreshing the application from canonical state…`
- `Backup restore completed and verified successfully.`
- `Current data changed after review ({keys}). Nothing unverified was kept. Recheck the refreshed state and make new restore choices.`
- `Exact browser storage could not be read safely. Nothing was written. Review again after storage access is available.`
- `Current data changed or a conflict needs an explicit choice. Nothing was written. Review the refreshed plan and apply again.`
- `Fresh verification found blocking problems. Nothing was written. Review the selected backup again before trying another restore.`
- `Restore could not start writing. Existing browser data was left unchanged.`
- `Restore failed safely and transaction-owned browser changes were verified restored.`
- `Critical recovery state: canonical bytes are uncertain and restore controls are locked until refresh.`
- `Restore verification was blocked before a verified commit. {reason}`
- `Restore failed safely: {error}`

Exact restore confirm:
- `Apply this exact restore plan? The selected file and browser data will be verified again before any write. Export Backup above now if you want an extra current-state recovery copy.`

ARIA:
- Restore file input: `Backup file for restore`.
- Restore status uses `role="status"` and `aria-live="polite"`.

Factory conclusion for step 2: all local backup, delete, import, restore and reset copy is historical evidence of what `main` currently shows, but the online Legacy build must not expose those controls because `DATA_CONTRACT_V1.md §8` explicitly says there are no delete, backup, export or reset controls on the online route.

## Data contract

Authority: `project-documents/factory/DATA_CONTRACT_V1.md`, especially §0 (all-screen states and bounds), §6 (what counts), §8 (History / Legacy) and §9 (dropped data). E/A below uses that contract's legend: E = exists on `main` as the provider-ready field; A = Team G must add it. Legacy history fields are A even where a local-storage analogue exists today.

Managers are keyed by role, never account identity: `playerOne → daniel` and `playerTwo → nik`. Daniel is always rendered first/left.

### Screen-level fields

| Contract field | E/A | Source on `main` / adapter evidence | Level | Legacy use |
| --- | --- | --- | --- | --- |
| `status` = `loading | empty | unavailable | partial | ready` | A | No equivalent honest five-state model exists in `js/legacy.js`; `loadLegacyShowdowns()` in `js/storage.js` currently collapses a parse failure to `[]`. Team G/provider adapter must supply the state. | Screen | Drives the whole view. Never translate a failed read into empty/zero. |
| `interimLabel` | A | Not present in the live Legacy renderer; supplied by the interim adapter under contract §0. | Screen | Exact value when used: `Current Showdown only. Career history is not yet available.` This is owner-review only, never a launch state. |

Contract §0 requires a partial state to show coverage. §8 does not define a History-specific structured `coverage.*` field, so this truth sheet does not invent one. The visual may show the provider's supplied readable/indexed coverage once Team G exposes it; until then fixtures label partiality without fabricating counts.

### `showdowns[]` fields from contract §8

| Exact contract field | E/A | Local `main` analogue / source function | Level | Display rule |
| --- | --- | --- | --- | --- |
| `showdowns[].number` | A | Current local cards use `showdown.name` in `createLegacyShowdownCard()`, `js/legacy.js`; no provider History number exists yet. | Per Showdown | Card identifier, displayed as `Showdown #{number}` in the factory mockup language. |
| `showdowns[].status` | A | Local Legacy archives only completed saves through `archiveShowdown()` in `js/storage.js`; richer statuses are absent. | Per Showdown | Closed set: `completed`, `in-progress`, `completion-pending`, `abandoned`, `unavailable`. Abandoned is status-only, no score or seasons. |
| `showdowns[].leagueId` | A | Local completed save carries `showdown.selectedLeague.id`; `createLegacyShowdownCard()` currently renders `selectedLeague.name`. | Per Showdown | Use our original league mark/name mapping; never a real league logo. |
| `showdowns[].clubs.daniel` | A | Local `showdown.clubs.playerOne` rendered by `createLegacyShowdownCard()`. | Per Showdown | Daniel side, always first/left; use original code-drawn crest. |
| `showdowns[].clubs.nik` | A | Local `showdown.clubs.playerTwo` rendered by `createLegacyShowdownCard()`. | Per Showdown | Nik side, always second/right; use original code-drawn crest. |
| `showdowns[].seasonsPlayed` | A | Local card derives `rounds.length` in `createLegacyShowdownCard()`. | Per Showdown | Number of accepted/countable seasons available for that history row. |
| `showdowns[].totalSeasons` | A | Local save schema carries the configured total as `totalRounds`; current Legacy card does not expose the contract name. | Per Showdown | Must be one of 1, 3, 5 or 10. |
| `showdowns[].totals.daniel` | A | Local `showdown.score.playerOne`, read by `getArchivedShowdownWinner()` and `createLegacyShowdownCard()`. | Per Showdown | Card score left value: total Showdown points, not wins/trophies. |
| `showdowns[].totals.nik` | A | Local `showdown.score.playerTwo`, same functions. | Per Showdown | Card score right value: total Showdown points. |
| `showdowns[].winner` | A | Local winner derived by `getArchivedShowdownWinner()`, `js/legacy.js`, from the two Showdown point totals. | Per Showdown | `daniel`, `nik` or `draw`; final winner uses total points only. |
| `showdowns[].seasons[]` | A | Local archived `showdown.rounds[]`; rendered lazily by `populateLegacySeasonHistory()` / `createLegacySeasonRow()`. | Per Showdown collection | Expanded by VIEW SEASON HISTORY only when the Showdown status permits season detail. |

### `showdowns[].seasons[]` fields, shape from contract §5

| Exact contract field | E/A in History | Local `main` analogue / source function | Level | Display rule |
| --- | --- | --- | --- | --- |
| `season` | A | `round.roundNumber` in `createLegacySeasonRow()`, `js/legacy.js`. | Per season | Season number. |
| `score.daniel` | A | `getLegacyScoring(round.playerOne).total` in `createLegacySeasonRow()`. | Per season | Computed season score, max 11. |
| `score.nik` | A | `getLegacyScoring(round.playerTwo).total`. | Per season | Computed season score, max 11. |
| `winner` | A | Local `round.winner`; also read by `buildRivalryAnalytics()` / season analytics in `js/analytics.js`. | Per season | `daniel`, `nik` or `draw`. |
| `leaguePosition.daniel` | A | `round.playerOne.leaguePosition` in `createSeasonManagerCell()`. | Per season | 1..league team count. |
| `leaguePosition.nik` | A | `round.playerTwo.leaguePosition`. | Per season | Same bound. |
| `leaguePoints.daniel` | A | `round.playerOne.leaguePoints` in `createSeasonManagerCell()`. | Per season | 0..(`teams − 1`) × 6. |
| `leaguePoints.nik` | A | `round.playerTwo.leaguePoints`. | Per season | Same bound. |
| `leagueGoals.daniel` | A | `round.playerOne.leagueGoals` in `createSeasonManagerCell()`. | Per season | 0..300. |
| `leagueGoals.nik` | A | `round.playerTwo.leagueGoals`. | Per season | Same bound. |

### What counts, contract §6

- Pending pairing: no seasons and no Showdown outcome count.
- Active: accepted/acknowledged seasons count toward career totals; no Showdown outcome yet.
- Final result reconciled with Terminal Close pending: all accepted seasons count; no completed Showdown outcome yet; show `completion-pending`.
- Closed with verified Terminal Close: all accepted seasons count and exactly one Showdown outcome counts.
- Abandoned (closed without Terminal Close): no seasons count, even seasons previously shown; no outcome counts; History may show only the status row.
- Unreadable: invent nothing; the screen becomes `partial`.

### Bounds and IDs, contract §0

- `totalSeasons`: 1, 3, 5 or 10.
- `leagueId`: `premier_league`, `laliga`, `bundesliga`, `serie_a`, `ligue_1`.
- League sizes: 20 except Bundesliga 18.
- `leaguePosition`: 1..teams.
- `leaguePoints`: 0..(`teams − 1`) × 6.
- `leagueGoals`: 0..300.

### Explicitly dropped, contract §9

Do not show clean sheets, biggest single-match win, European wins other than Champions League, player names, player-based leaders/photos, match-by-match results, possession or any per-match stat. `topScorer` and `topAssist` are yes/no season facts, not player names. The current local Legacy's transfer-release suffix is also excluded from this screen because §8 does not list transfer history in the History view model; transfer availability belongs to its own contract path.

## Screen states and preview frames

_To be completed in step 4._

## Mockup element decisions

_To be completed in step 5._

## Open questions

_To be completed in step 7._
