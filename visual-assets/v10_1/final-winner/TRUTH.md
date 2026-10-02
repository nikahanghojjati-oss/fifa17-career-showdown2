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


## Data contract

Authority: `project-documents/factory/DATA_CONTRACT_V1.md`, especially §0 Rules for every screen and §4 Final winner. Contract names below are the build names. Manager keys are always `daniel` first and `nik` second; main's `playerOne` maps to `daniel`, and `playerTwo` maps to `nik`.

| Contract field | E/A | Source on main | Level | Final Winner use |
| --- | --- | --- | --- | --- |
| `status` | A view-model wrapper | §0 requires the normalized five-state screen wrapper; current final adapters expose protocol phases rather than this field | per screen read | Exactly one of `loading`, `empty`, `unavailable`, `partial`, `ready`. |
| `totals.daniel` | E | `frReconcile()`, `js/sharedFinalReconciliation.js`: `managerTotals.playerOne` from converged `managerRecords.playerOne.totalPoints` | per Showdown | Daniel's total Showdown points. |
| `totals.nik` | E | `frReconcile()`, `js/sharedFinalReconciliation.js`: `managerTotals.playerTwo` from converged `managerRecords.playerTwo.totalPoints` | per Showdown | Nik's total Showdown points. |
| `winner` | E | `frReconcile()`, `js/sharedFinalReconciliation.js` compares the two manager totals only | per Showdown | `daniel`, `nik`, or `draw`; equal totals are a draw. |
| `margin` | E | totals from `frReconcile()`; `phcRender()` in `js/productionSharedHistoryConvergence.js` already derives the lead as the points difference | per Showdown | Absolute points difference; `0` for a draw. |
| `seasonsPlayed` | E | `frReconcile()` exposes accepted/total seasons after complete convergence; `renderCompletionHub()` in `js/showdownUI.js` also uses `currentShowdown.rounds.length` | per Showdown | Number of completed seasons; valid Showdown lengths are 1, 3, 5 or 10. |
| `state` | A (G-5) | underlying evidence exists in `pfrRender()`, `js/productionSharedFinalReconciliation.js`, and `ptcRender()`, `js/productionSharedTerminalClose.js`; Team G supplies the normalized contract field | per Showdown | `completion-pending` when reconciled but Terminal Close is not verified; `completed` after verified Terminal Close. |
| `trophies.daniel.championsLeague` | E | `hcAccumulate()` / `hcBuild()`, `js/sharedHistoryConvergence.js`: playerOne `championsLeagues` / `trophyAttribution` | per Showdown | Count of Champions League wins. |
| `trophies.daniel.leagueTitles` | E | `hcAccumulate()` / `hcBuild()`, `js/sharedHistoryConvergence.js`: playerOne `leagueTitles` | per Showdown | Count of league titles. |
| `trophies.daniel.domesticCups` | E | `hcAccumulate()` / `hcBuild()`, `js/sharedHistoryConvergence.js`: playerOne `domesticCups` | per Showdown | Count of domestic cup wins. |
| `trophies.daniel.total` | E | `hcFinalize()`, `js/sharedHistoryConvergence.js`: playerOne `totalTrophies` | per Showdown | Sum of the three trophy counts. |
| `trophies.nik.championsLeague` | E | same functions, playerTwo `championsLeagues` / `trophyAttribution` | per Showdown | Count of Champions League wins. |
| `trophies.nik.leagueTitles` | E | same functions, playerTwo `leagueTitles` | per Showdown | Count of league titles. |
| `trophies.nik.domesticCups` | E | same functions, playerTwo `domesticCups` | per Showdown | Count of domestic cup wins. |
| `trophies.nik.total` | E | `hcFinalize()`, playerTwo `totalTrophies` | per Showdown | Sum of the three trophy counts. |

Main's history projection uses `championsLeagues` and `totalTrophies`; the Final Winner adapter must expose the contract's exact names `championsLeague` and `total`. This is an adapter rename, not a new statistic.

### Required five screen states

These are the exact §0 state names and must have designed frames/variants even though the current main adapters mostly hide until their protocol state is ready.

| `status` | Product meaning on Final Winner |
| --- | --- |
| `loading` | Final-result data is being resolved. Do not show zeroes as facts. |
| `empty` | The read succeeded but there is no completed Showdown result to display. |
| `unavailable` | The read failed. Preserve the failure state; never render missing data as zero. |
| `partial` | Only available authoritative fields are shown. Missing coverage is identified; never label it all-time or career. A winner is shown only if authoritative final totals are available. |
| `ready` | All §4 fields required for the Final Winner view are available. |

`state` is separate from `status`. A `ready` result can still be `completion-pending`; the result remains visible and must carry the visible mark `Completion pending`. After Terminal Close is verified, `state` becomes `completed`.

The exact interim label required by §0 is:

`Current Showdown only. Career history is not yet available.`

It may appear only on labelled owner-review/current-Showdown previews before career history is real. It is not a launch-state replacement for missing provider history.

### Contract exclusions

The Final Winner build uses only §4 fields plus universal §0 state/coverage metadata. These values may exist elsewhere on main but are not Final Winner fields and are dropped here: club names, league id/name, league position, league points, league goals, season W/D/L, individual season scoring breakdowns, performance-bonus trigger detail, awards-bonus trigger detail, transfer facts, best/average statistics and career totals.

DATA_CONTRACT_V1 §9 also permanently drops clean sheets, biggest single-match win, European wins other than Champions League, player names, player-based leaders or photos, match-by-match results, possession and all per-match stats. Top scorer and top assist remain yes/no per-season inputs elsewhere; they are not player-name statistics and are not Final Winner fields.
