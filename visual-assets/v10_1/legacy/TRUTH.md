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

_To be completed in step 2._

## Data contract

_To be completed in step 3._

## Screen states and preview frames

_To be completed in step 4._

## Mockup element decisions

_To be completed in step 5._

## Open questions

_To be completed in step 7._
