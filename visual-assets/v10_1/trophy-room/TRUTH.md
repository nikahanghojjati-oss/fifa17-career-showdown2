# Trophy Room · product truth

Source of live behaviour: `main` @ `2de237391e17c7de2c6deb606b102b68ee640212` (read only).
Factory authority: `PRODUCT_TRUTH.md`, `DATA_CONTRACT_V1.md`, and JOB-002. Where the legacy live screen exposes fields outside the agreed contract, the contract wins for the future build.

## Ids and routes

### Renderer and screen creation

- `createTrophyRoomScreen()` in `js/trophyRoom.js` creates the screen lazily. It exits if `#trophyRoom` already exists.
- `renderTrophyRoom(force = false)` is the live renderer. It reads `buildCareerAnalytics()`, builds a fragment, and replaces `#trophyRoomContent`.
- `openTrophyRoom()` creates the screen, renders it, then calls `showScreen("trophyRoom")`.
- `window.renderTrophyRoom` and `window.openTrophyRoom` are the exported screen APIs.
- `getTrophyRoomRenderKey()` shares `getCareerAnalyticsRevisionKey()` when available; the browser identity audit verifies that the Trophy Room refreshes when career identity mapping changes.

### Open route

Current live route on `main`:

1. Career Statistics renders `#careerStatisticsTrophyButton` with the visible text `OPEN TROPHY ROOM`.
2. Clicking it calls `window.openOptionalModule("trophyRoom")`.
3. `js/optionalModules.js` runs `ensureTrophyRoomModule()`: loads `css/analytics.css`, the shared football visual experience, `js/analytics.js`, `js/statistics.js`, then `js/trophyRoom.js`.
4. `openOptionalModule("trophyRoom")` calls `window.openTrophyRoom()`.
5. `openTrophyRoom()` calls `showScreen("trophyRoom")`.

The current architecture contract explicitly requires no competing `#trophyRoomButton` on Home. This differs from the new factory `PRODUCT_TRUTH.md §5`, which makes Trophy Room a Home destination for the rebuilt navigation. JOB-002 records the live route; later navigation work owns the new Home/top-bar route.

### Back route

- The Trophy Room Back control is a button with class `.backButton`; it has no bespoke click handler.
- `initializeSmartBackDelegation()` in `js/screens.js` captures `.backButton` clicks and calls `navigateBackSmart()`.
- `SAFE_BACK_TARGETS.trophyRoom` is exactly `["dashboard", "careerStatistics", "mainMenu"]`.
- Smart Back first uses the most recent legal entry in `screenHistory`. If no legal history entry exists, it tries the safe targets in the order above, then the canonical route, then `mainMenu`.
- `trophyRoom` is registered in the central `screens` array and is not a `GAMEPLAY_SCREENS` route.

### IDs

| ID | Owner | Dependency / meaning |
| --- | --- | --- |
| `trophyRoom` | `createTrophyRoomScreen` | Screen route target; `showScreen`, navigation tests and browser audits depend on it. |
| `trophyRoomContent` | `createTrophyRoomScreen` | Renderer host replaced by `renderTrophyRoom`. |
| `trophyRoomScreenTitle` | `prepareScreenAccessibility` | Assigned lazily to the screen's `h2`; becomes the section's `aria-labelledby` target and focus target after navigation. |
| `careerStatisticsTrophyButton` | `createCareerStatisticsScreen` | Current live entry point; optional-module busy state and the browser identity audit depend on it. |

### Classes and data attributes used by live code/tests

The lazy Trophy Room DOM currently emits these structural classes. They are part of the live selectors/styling surface and must not be silently renamed by a replacement build without updating its integration:

- Screen shell: `.screen`, `.hidden`, `.analyticsScreen`, `.analyticsContent`, `.analyticsActions`, `.backButton`.
- Summary/table: `.analyticsStatsGrid`, `.trophyRoomSummary`, `.analyticsSectionHeading`, `.careerStandings`, `.careerStandingsRow`, `.header`.
- Cabinets: `.managerCabinetList`, `.managerCabinet`, `.managerCabinetHeader`, `.managerRank`, `.managerCareerPoints`, `.trophyShelf`, `.trophyCount`, `.trophyGlyph`, `.cabinetSupportingStats`, `.cabinetAchievementStrip`.
- Records/states: `.recordsGrid`, `.recordCard`, `.analyticsEmpty`, `.analyticsIdentityNotice`.
- Live data attributes: `data-profile-id` on manager rows/cabinets and `data-unresolved-roles` on the identity notice.
- The browser audit directly selects `#trophyRoom .managerCabinet[data-profile-id]` and `#trophyRoom .analyticsIdentityNotice`.
