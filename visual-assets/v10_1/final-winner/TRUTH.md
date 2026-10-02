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


## Buttons and visible strings

The Final Winner build must not invent controls. The live product has these final-state controls.

### Buttons

| Control | Exact label | When visible | Behaviour |
| --- | --- | --- | --- |
| Terminal Close | `CLOSE SHARED SHOWDOWN` | Terminal Close phase READY | Calls the shared Terminal Close operation for the exact rivalry/session. |
| Terminal Close retry | `RETRY SAME TERMINAL CLOSE` | phase RECOVERY_PENDING | Retries the same retained terminal witness; it does not create a replacement session. |
| Completed hub | `VIEW LEGACY` | completed dashboard | Opens optional module `legacy`. |
| Completed hub | `TROPHY ROOM` | completed dashboard | Opens optional module `trophyRoom`. |
| Completed hub | `RIVALRY STATISTICS` | completed dashboard | Opens optional module `statistics`. |
| Completed hub | `NEW SHOWDOWN` | completed dashboard | `navigateTo("createShowdown")`. |
| Completed hub | `MAIN MENU` | completed dashboard | Returns to `mainMenu`; the control uses class `backButton`. |
| Handoff into completed view | `VIEW COMPLETED SHOWDOWN` | final Season Summary and completed dashboard primary action | Opens/represents the completed Showdown dashboard. It is an upstream handoff, not an extra Final Winner action. |

The shared Season Results, Season Commit, canonical scoring, history and local-reconciliation buttons are upstream workflow controls. They are not Final Winner buttons and are not carried into this screen merely because their modules share `#seasonReviewPanel`.

### Final Reconciliation strings

These are copied exactly from `productionSharedFinalReconciliation.js`.

- `SHOWDOWN FINAL RECONCILED`
- `{acceptedSeasons} OF {totalSeasons} SEASONS ACCEPTED · NO ADDITIONAL SEASON`
- `{Daniel} {danielTotal} · {Nik} {nikTotal} · {winner}`, where `{winner}` is exactly `DRAW` or `{managerName} WINS`
- `FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP`

There is no dedicated loading, empty or error copy in this adapter. Before the reconciled view exists, the panel is hidden. The contract states for the visual build are defined in the Data contract section below rather than invented from this adapter.

### Terminal Close strings by state

Copied exactly from `productionSharedTerminalClose.js`.

| State | Exact visible copy |
| --- | --- |
| READY heading | `FINAL RESULT READY FOR TERMINAL CLOSE` |
| READY status | `This permanently closes the shared rivalry and exact active private session. Final results remain readable; another season or replacement session cannot resurrect this Showdown.` |
| READY button | `CLOSE SHARED SHOWDOWN` |
| RECOVERY_PENDING heading | `TERMINAL CLOSE OUTCOME PENDING` |
| RECOVERY_PENDING fallback status | `Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability.` |
| RECOVERY_PENDING button | `RETRY SAME TERMINAL CLOSE` |
| BLOCKED heading | `TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS` |
| BLOCKED fallback status | `Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close.` |
| CLOSED heading | `SHARED SHOWDOWN CLOSED` |
| CLOSED status | `TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY` |

All four terminal states use the same winner summary shape: `{Daniel} {danielTotal} · {Nik} {nikTotal} · DRAW` or `{Daniel} {danielTotal} · {Nik} {nikTotal} · {managerName} WINS`.

When current-state messages replace the fallback status, main can surface these exact messages:

- `Final results are preserved, but Terminal Close requires one exact ACTIVE private session for this rivalry.`
- `Terminal Close acknowledgement was not received. The exact same terminal witness is retained in page memory for deterministic retry; no replacement session or local-save mutation will be generated.`
- `Terminal Close was rejected without changing the completed Showdown.`
- `Terminal Close acknowledgement was not received. Retry is bound to the exact same witness and session capability.`
- `The same Terminal Close retry was rejected; the exact witness remains held for inspection.`

Authority/dependency failures originate with these exact messages in the Terminal Close adapter:

- `Reconnect the exact private account before closing this Shared Showdown.`
- `This browser must remain an active registered device.`
- `Attach the exact completed Connected Rivalry before Terminal Close.`
- `Private Firebase services are unavailable. No terminal state was changed.`

### Completed Showdown hub strings

Copied exactly from `showdownUI.js`.

- `SHOWDOWN COMPLETE`
- Daniel win: `{Daniel} wins the showdown`
- Nik win: `{Nik} wins the showdown`
- Draw: `The showdown finishes level`
- Archive state: `Saved to Legacy`
- Pending archive state: `Active save retained · Legacy sync pending`
- Meta: `{seasons} season completed · Final score {danielTotal} - {nikTotal} · {archiveState}` or `{seasons} seasons completed · Final score {danielTotal} - {nikTotal} · {archiveState}`
- `VIEW LEGACY`
- `TROPHY ROOM`
- `RIVALRY STATISTICS`
- `NEW SHOWDOWN`
- `MAIN MENU`
- `VIEW COMPLETED SHOWDOWN`

### Accessibility text and live regions

Main defines no Final Winner-specific `aria-label` string on the final buttons. Native button text supplies their accessible names.

- `#seasonReviewPanel` uses `aria-labelledby="seasonReviewHeading"`.
- `#sharedTerminalCloseStatus` uses `role="status"` and `aria-live="polite"`.
- `#seasonReviewError` uses `aria-live="assertive"`, but there is no fixed final-specific error string on that node.
