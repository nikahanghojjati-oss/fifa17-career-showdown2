# Final Winner · product truth

Job: JOB-007 · Truth sheet: Final Winner

This sheet records the behaviour on main. There is no standalone Final Winner route on main.

## Ids and routes

### Route truth

The shared end-of-Showdown result is shown inside the existing `seasonEntry` review surface. `productionSharedSeasonResultsRoute.js` opens `seasonEntry`; the post-results runtime then mounts Final Reconciliation and Terminal Close under `#seasonReviewPanel`.

For a completed local Showdown, `seasonEngine.js` changes `#nextSeasonAction` to `VIEW COMPLETED SHOWDOWN`; `handleSeasonSummaryAction()` calls `updateShowdownUI()` and opens `dashboard`. `screens.js` also resolves a completed Showdown canonically to `dashboard`.

Back is centralized by `navigateBackSmart()` in `screens.js`. `seasonSummary` may go back to `dashboard` or `mainMenu`; `dashboard` goes back to `mainMenu`. The completion hub's MAIN MENU action calls `navigateTo("mainMenu", { addToHistory: false })`.

### Final Reconciliation ids and classes

| Element | Id | Classes / attributes |
| --- | --- | --- |
| Parent review surface | `seasonReviewPanel` | `seasonReviewPanel hidden`; `aria-labelledby="seasonReviewHeading"` |
| Reconciliation panel | `sharedFinalReconciliationPanel` | `seasonReviewSummary sharedFinalReconciliationPanel hidden` |
| Heading | `sharedFinalReconciliationHeading` | `h3` |
| Season acceptance summary | `sharedFinalReconciliationSummary` | `p` |
| Totals / winner | `sharedFinalReconciliationWinner` | `p` |
| Read-only note | `sharedFinalReconciliationClose` | `p` |

The reconciliation panel is visible only when the current view is `FINAL_SEASON_RECONCILED` and `finalSeasonReconciled === true`.

### Terminal Close ids and classes

| Element | Id | Classes / attributes |
| --- | --- | --- |
| Panel | `sharedTerminalClosePanel` | `seasonReviewSummary sharedTerminalClosePanel hidden`; `data-shared-terminal-close="true"` |
| Heading | `sharedTerminalCloseHeading` | `h3` |
| Winner summary | `sharedTerminalCloseSummary` | `p` |
| Status | `sharedTerminalCloseStatus` | `stateNote`; `role="status"`; `aria-live="polite"` |
| Actions | `sharedTerminalCloseActions` | `seasonReviewActions` |
| Close button | `sharedTerminalCloseAction` | `menuButton` |
| Retry button | `sharedTerminalCloseRetry` | `compactButton hidden` |

The panel sets `data-terminal="true"` only for phase `CLOSED`.

### Completed dashboard ids and classes

| Element | Id | Classes |
| --- | --- | --- |
| Hub | `completedShowdownHub` | `completionHub hidden` |
| Title | `completedShowdownTitle` | `h3` |
| Result | `completedShowdownResult` | `p` |
| Meta | `completedShowdownMeta` | `p` |
| Actions wrapper | none | `completionHubActions` |
| Primary dashboard action | `seasonPrimaryAction` | existing `menuButton` |

The completion hub creates VIEW LEGACY, TROPHY ROOM, RIVALRY STATISTICS and NEW SHOWDOWN as `menuButton` controls and MAIN MENU as a `backButton`; those dynamic buttons have no ids.

### Season Summary handoff ids

`seasonSummary`, `seasonSummaryTitle`, `seasonSummaryResult`, `seasonSummaryOne`, `seasonSummaryTwo`, `seasonOverallScore`, `nextSeasonAction`. The SHOWDOWN HOME control is a `backButton` with `data-smart-back` and no id.
