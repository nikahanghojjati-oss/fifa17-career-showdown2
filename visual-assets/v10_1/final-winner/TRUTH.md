# Final Winner · product truth

Job: JOB-007 · Truth sheet: Final Winner

This sheet records the behaviour on main. There is no standalone Final Winner route on main. JOB-134 selects one completed surface for the online reveal: the shared Terminal Close result (`state = completed`), headed `SHARED SHOWDOWN CLOSED`.

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

### Local completed dashboard reference only: ids and classes

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

### Local completed dashboard reference only: strings

Copied exactly from `showdownUI.js`. These are local-dashboard source notes. `SHOWDOWN COMPLETE` is not a second online reveal heading. Existing navigation labels may be reused only through their recorded route bindings; do not mount a second completion hub.

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


## States and preview frames

### State matrix

The Final Winner view has two independent state axes.

1. `status`, required by DATA_CONTRACT_V1 §0: `loading`, `empty`, `unavailable`, `partial`, `ready`.
2. `state`, required by §4 once a final result exists: `completion-pending` or `completed`.

Required treatment:

| Status / state | Visual truth |
| --- | --- |
| `loading` | Show the Final Winner shell in a neutral loading state. No scores, trophy counts or winner are replaced with zero. |
| `empty` | Read succeeded but there is no completed Showdown result. Do not render a winner. |
| `unavailable` | Read failed. Show a clear unavailable state; do not turn missing values into zero. |
| `partial` | Show only authoritative fields that were actually read, identify incomplete coverage, and never claim all-time/career coverage. |
| `ready` + `completion-pending` | Show the authoritative result and a visible `Completion pending` mark. Terminal Close is not yet verified. |
| `ready` + `completed` | Show the same authoritative result as final/closed. Terminal Close is verified. |

The nine named owner-preview frames below use fictional values and must display `Preview data`. They deliberately keep Daniel first/left and Nik second/right.

### FW1 · Daniel wins

- `previewLabel`: `Preview data`
- `status`: `ready`
- `state`: `completed`
- `totals`: Daniel 28, Nik 23
- `winner`: `daniel`
- `margin`: 5
- `seasonsPlayed`: 5
- Daniel trophies: Champions League 2, league titles 3, domestic cups 1, total 6
- Nik trophies: Champions League 1, league titles 2, domestic cups 2, total 5
- Online surface: `sharedTerminalClosePanel` · `SHARED SHOWDOWN CLOSED` · `completed`.


### FW2 · Nik wins

- `previewLabel`: `Preview data`
- `status`: `ready`
- `state`: `completed`
- `totals`: Daniel 21, Nik 27
- `winner`: `nik`
- `margin`: 6
- `seasonsPlayed`: 5
- Daniel trophies: Champions League 1, league titles 2, domestic cups 1, total 4
- Nik trophies: Champions League 2, league titles 3, domestic cups 0, total 5
- Online surface: `sharedTerminalClosePanel` · `SHARED SHOWDOWN CLOSED` · `completed`.


### FW3 · Draw

- `previewLabel`: `Preview data`
- `status`: `ready`
- `state`: `completed`
- `totals`: Daniel 24, Nik 24
- `winner`: `draw`
- `margin`: 0
- `seasonsPlayed`: 5
- Daniel trophies: Champions League 1, league titles 3, domestic cups 2, total 6
- Nik trophies: Champions League 2, league titles 2, domestic cups 0, total 4
- Online surface: `sharedTerminalClosePanel` · `SHARED SHOWDOWN CLOSED` · `completed`.


### FW4 · Result reconciled, completion pending

- `previewLabel`: `Preview data`
- `status`: `ready`
- `state`: `completion-pending`
- `totals`: Daniel 17, Nik 15
- `winner`: `daniel`
- `margin`: 2
- `seasonsPlayed`: 3
- Daniel trophies: Champions League 1, league titles 2, domestic cups 1, total 4
- Nik trophies: Champions League 2, league titles 1, domestic cups 0, total 3
- Required visible mark: `Completion pending`

### FW5 · Completed

FW5 intentionally uses the same sporting result as FW4 so the preview isolates the state transition caused by verified Terminal Close.

- `previewLabel`: `Preview data`
- `status`: `ready`
- `state`: `completed`
- `totals`: Daniel 17, Nik 15
- `winner`: `daniel`
- `margin`: 2
- `seasonsPlayed`: 3
- Daniel trophies: Champions League 1, league titles 2, domestic cups 1, total 4
- Nik trophies: Champions League 2, league titles 1, domestic cups 0, total 3
- Online surface: `sharedTerminalClosePanel` · `SHARED SHOWDOWN CLOSED` · `completed`.


### FW6–FW9 · Required read states

Every frame displays `Preview data`. New state words are stored as `{ "text": "…", "source": "new" }` in fixtures.json; existing product strings remain exact.

| Frame | Status | Heading (new copy) | Message (new copy) | Available facts |
| --- | --- | --- | --- | --- |
| FW6 | `loading` | Loading final result | Resolving the shared Showdown result. Scores and trophies will appear when confirmed. | No scores, winner, margin, seasons, completion assertion or trophy counts. Neutral shell; no crown. |
| FW7 | `empty` | No final result yet | No completed Showdown result is available to reveal. | Successful read with no result. No result facts or crown. |
| FW8 | `unavailable` | Final result unavailable | The shared Showdown result could not be read. Missing values are not zero. | Failed read. No invented zeroes, result facts or crown; no invented retry control. |
| FW9 | `partial` | Final result partially available | 1 of 2 indexed Showdowns is readable; the other indexed Showdown is unavailable. In this final result, Nik’s domestic cup count and trophy total are unavailable. | FW5 totals 17–15, winner Daniel, margin 2, 3 seasons and verified completion remain readable for the readable final result. Daniel trophies 1/2/1/4; Nik CL 2 and league titles 1 only. Nik domestic cups and total are omitted, never zero; one indexed Showdown is unreadable. |

FW9 has `coverage = {readable: 1, indexed: 2}`: one indexed Showdown is readable and one is unreadable. Its `missingFields` also names the two unreadable trophy fields in the readable final result. It never turns either unreadable Showdown data or unreadable fields into zero, and it never claims career or all-time coverage. Its winner is allowed only because both authoritative totals are available; if either total is missing, withhold winner, margin, crown and winner lighting. FW6–FW8 omit `state` because no final result exists to classify. Their empty actions lists prevent invented operations. All state messages describe only the read outcome, never the rival’s unpublished progress.

### Why these frames match the real product

Main decides the final winner from accumulated Showdown points only, so FW1–FW3 do not use season tie-breakers. FW4 reflects the real split between Final Reconciliation and Terminal Close: the result is already readable while completion is still pending. FW5 changes the normalized completion state, status copy and available actions after Terminal Close is verified; the sporting result is unchanged. The current product does not have a separate Final Winner route, so these frames are visual states of the product truth, not invented navigation.


## Mockup pass

There is no dedicated Final Winner mockup. `MOCKUP_SEASON_RESULTS.jpg` and `MOCKUP_TROPHY_ROOM.png` are styling references only. Product truth, the §4 data contract and live `main` behaviour decide what the Final Winner build may show.

| Mockup element | Product answer | Source | Live / preview / drop |
| --- | --- | --- | --- |
| Night stadium / gold-black ceremony composition | Reuse the premium ceremony mood, depth and gold/black hierarchy with original Showdown art. It is visual framing, not product data. | Season Results + Trophy Room mockups | preview |
| Daniel staged on the left | Keep Daniel first/left in every state. Use approved manager art only; never substitute a football player photo. | Both mockups + PRODUCT_TRUTH | live identity rule; preview art |
| Nik staged on the right | Keep Nik second/right in every state. Use approved manager art only. | Both mockups + PRODUCT_TRUTH | live identity rule; preview art |
| Manager names | Render Daniel and Nik as live DOM identity text. Do not bake names into a plate/background. | Both mockups + DATA_CONTRACT §0 | live |
| Top navigation | Use the shared product navigation, not either mockup's extra destinations. HOME / CAREER / STANDINGS / STATS / RULES plus settings. Final Winner has no ABOUT, search or profile destination. | PRODUCT_TRUTH + DATA_CONTRACT §10 | live |
| Phone bottom navigation on reveal | Hide it on the Final Winner reveal as required by product truth; this is a deliberate exception to the normal phone bar. | PRODUCT_TRUTH | live |
| Search icon | Do not carry it over. | Season Results mockup vs DATA_CONTRACT §10 | drop |
| Profile/person icon | Do not carry it over. | Season Results mockup vs DATA_CONTRACT §10 | drop |
| ABOUT tab | Do not carry it over. | Both mockup language / Trophy Room truth vs DATA_CONTRACT §10 | drop |
| Brush/ceremony title treatment | Reuse the visual treatment, but the visible product heading must come from the real state: `SHOWDOWN FINAL RECONCILED`, `FINAL RESULT READY FOR TERMINAL CLOSE`, `TERMINAL CLOSE OUTCOME PENDING`, `TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS`, `SHARED SHOWDOWN CLOSED` on the shared online route. `SHOWDOWN COMPLETE` is a local-dashboard note only, never an alternative online heading. Do not invent a static `FINAL WINNER` heading as product copy. | main Final Reconciliation / Terminal Close / Showdown UI | live text; preview styling |
| Winner hero line | Show only the contract winner derived from total Showdown points: Daniel, Nik or draw. Equal totals are a draw. | DATA_CONTRACT §4 + `frReconcile()` | live |
| Large manager score blocks | Change from per-season score to `totals.daniel` and `totals.nik` for the whole Showdown. They are read-only. | DATA_CONTRACT §4 | live |
| Winner margin | May be shown as the §4 `margin` value; it is the absolute Showdown-points difference and is 0 for a draw. | DATA_CONTRACT §4 | live |
| Season Results scoring-system panel | Do not transplant the five scoring-rule rows onto Final Winner. They belong to Season Results, not §4. | Season Results mockup vs DATA_CONTRACT §4 | drop |
| Season-entry inputs, checkboxes and dropdowns | Do not carry them over. Final Winner is read-only and has no per-season inputs. | Season Results mockup vs DATA_CONTRACT §4 | drop |
| Season-score tiles | Do not carry over as season scores. Replace with the two Showdown totals only. | Season Results mockup + DATA_CONTRACT §4 | live replacement |
| Central trophy illustration | If used decoratively, replace any real competition trophy with original Showdown trophy art. It must not imply a fourth counted trophy family. | rights rules + DATA_CONTRACT §4 | preview |
| Trophy Room cabinet/shelf material language | Reuse shelf/cabinet polish as a visual language for Final Winner trophy counts. | Trophy Room mockup | preview |
| Champions League trophy count | Show `trophies.{manager}.championsLeague` with original Champions League-style Showdown cup art, never the real UEFA trophy. | DATA_CONTRACT §4 + `hcBuild()` | live |
| League-title trophy count | Show `trophies.{manager}.leagueTitles` with original league-title art, never a real league trophy. | DATA_CONTRACT §4 + `hcBuild()` | live |
| Domestic-cup trophy count | Show `trophies.{manager}.domesticCups` with original domestic-cup art. | DATA_CONTRACT §4 + `hcBuild()` | live |
| Trophy total | Show `trophies.{manager}.total` only as the sum of those three §4 trophy families. | DATA_CONTRACT §4 + `hcFinalize()` | live |
| Showdown Champion trophy/category from Trophy Room | Do not add it to the §4 trophy object. The winner result already expresses the Showdown outcome. | Trophy Room mockup vs DATA_CONTRACT §4 | drop |
| Trophy Room category/filter bar (`ALL`, `SHOWDOWN`, `LEAGUE TITLES`, `DOMESTIC CUPS`, `CHAMPIONS LEAGUE`) | Do not copy the filter UI. Final Winner shows one Showdown's compact trophy attribution, not a career cabinet browser. | Trophy Room mockup vs DATA_CONTRACT §4 | drop |
| Trophy Room career standings | Do not carry them into Final Winner. | Trophy Room mockup vs DATA_CONTRACT §4 | drop |
| Trophy Room records / leaderboards | Do not carry them into Final Winner. | Trophy Room mockup vs DATA_CONTRACT §4 | drop |
| `ALL-TIME` / career language | Do not use it on this screen. This is per-Showdown truth. | DATA_CONTRACT §4 | drop |
| `Not won yet` zero-card treatment | Do not import Trophy Room empty-career wording. Final Winner may display the authoritative numeric count 0 for a trophy family when the result is ready. | Trophy Room mockup vs Final Winner §4 | drop wording; live zero |
| Completion status mark | Add the product-required visible `Completion pending` mark only when `state = completion-pending`. It is not a mockup invention; it is contract truth. | DATA_CONTRACT §4 / PRODUCT_TRUTH | live |
| Terminal Close action | When pending and actionable, use exact live button `CLOSE SHARED SHOWDOWN`. On uncertain acknowledgement use `RETRY SAME TERMINAL CLOSE`. | `productionSharedTerminalClose.js` | live |
| Completed navigation actions | Drop them from the online Final Winner reveal. The shared Terminal Close `CLOSED` surface renders no navigation buttons; only the shared top bar remains. The five completion-hub routes are local-dashboard reference only. | `productionSharedTerminalClose.js` + `showdownUI.js` | drop on online reveal; local reference only |
| Decorative slogans / crown motifs | Original crown art is a DOM-selected winner indicator only when an authoritative winner is Daniel or Nik. No crown, including the decorative eyebrow crown, on a draw or a state without a confirmed winner. Static non-data slogans may remain. | Both mockups + JOB-134 decision | preview art; live visibility |
| Baked score, trophy count, state, season count, winner or manager data | Never bake these into images. All values are live DOM text/state or labelled fixture data. | QUALITY_BAR + factory rules | drop |
| Real club crest, league logo, real competition trophy, real player photo or EA/FIFA artwork | Never use them. Use original code-drawn marks and original Showdown trophy/manager art. | PRODUCT_TRUTH + factory rules | drop |

The styling target is therefore a premium stadium ceremony with the two managers and trophy-cabinet polish, while the product content stays intentionally small: final totals, winner, margin, seasons played, per-Showdown trophy attribution, completion state and only the real actions for that state.


## Phone

The reveal fills the entire 393 × 660 visible Safari area with no page scroll. Hide the 56 px bottom navigation bar on this reveal; it reserves no space. Use `100svh` with a `100dvh` enhancement and include safe-area insets within the height budget. A later build must measure fit rather than simply clip overflow.

Winner first means the confirmed outcome leads the top band, before supporting totals and actions. It never means swapping managers: Daniel stays left and Nik right in the hero pair, score columns, trophy counts and reading order. A Nik win highlights the right-hand hero and announces Nik at the top. A draw announces `DRAW` / `The showdown finishes level`, has no crown and uses balanced lighting. Loading, empty and unavailable use neutral state copy; partial uses a winner only when both totals are confirmed.

At 393 × 660, budget roughly 360 px for the top band (brush heading, outcome and fully visible heads) and 300 px for the compact result/action band. Keep both totals side by side, supporting margin/seasons and the three trophy-family counts compact. Missing partial fields use the explicit availability message, never zeroes. Completed `CLOSED` reveals do not render the local completion-hub navigation actions; the shared top bar is the only navigation on that online result surface. Pending completion keeps `CLOSE SHARED SHOWDOWN` as the visible primary action. Do not invent a next-season control or a new detail route.

Safety fit is 360 × 640 with no scroll. At 375 × 553 the primary action must remain fully visible. Reduce hero height and decorative spacing before reducing body readability or touch targets; keep heads visible, body contrast at least 4.5:1, and live text at full opacity. Larger text settings and landscape may reflow as PRODUCT_TRUTH permits. These are build requirements, not claims that screenshots were measured in this truth-sheet job.

## Open questions

None blocking. JOB-134 resolves the presentation choices as follows.

- Draw: use the product headline `DRAW` and exact main result sentence `The showdown finishes level`. No crown anywhere on the draw frame, including the shared decorative title crown; neither manager gets winner lighting. Both remain at full opacity with balanced neutral light. Equal final totals alone decide the draw, regardless of league positions or season winners.
- Winner: keep Daniel left and Nik right. The winning manager gets a warm gold spotlight at full opacity; dim only the other manager’s character art to 70 % opacity. Do not dim their live text, score, controls or focus indicators, and do not move or mirror either manager. Original crown art may indicate the winner; its visibility is selected from live `winner`, never baked into the plate.
- Unconfirmed outcome: neutral light, full-opacity managers and no crown. Partial data allows winner presentation only when both final totals are authoritative; FW9 meets that condition.

- Completed online surface: FW1, FW2, FW3 and FW5 all use `#sharedTerminalClosePanel` in phase `CLOSED`, normalized `state = completed`, with heading `SHARED SHOWDOWN CLOSED` and status `TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY`. The winner summary remains `Daniel {danielTotal} · Nik {nikTotal} · {managerName} WINS` or `Daniel {danielTotal} · Nik {nikTotal} · DRAW`; the outcome line for a draw is `The showdown finishes level`. FW9 keeps its new partial-state heading plus the confirmed shared closed heading, because read coverage and terminal completion are independent. FW4 retains the shared pending heading/action. `SHOWDOWN COMPLETE` survives only as a local-dashboard source note. No duplicate online completed hub or extra route is introduced.
- Completed online navigation: FW1, FW2, FW3, FW5 and FW9 render no local completion-hub buttons. In Terminal Close phase `CLOSED`, main hides close/retry and exposes no result-surface navigation actions; the shared top bar remains available. `VIEW LEGACY`, `TROPHY ROOM`, `RIVALRY STATISTICS`, `NEW SHOWDOWN` and `MAIN MENU` remain documented only as local completed-dashboard routes and must not be mounted on the online Final Winner reveal.

The only contract field marked A is the normalized §4 `state` supplied by Team G's G-5 adapter. Main already exposes the underlying Final Reconciliation and Terminal Close evidence, so this is an implementation handoff rather than a product question. Exact motion, spacing, decorative stadium composition and original trophy-art placement remain visual implementation choices and may not change the truth above.

## Fixture arithmetic evidence (JOB-134)

`fixtures.json.fixtureEvidence.frames` contains fictional, already-revealed per-season inputs for FW1–FW5 and FW9. It is validator evidence only, never Final Winner UI data. The rendered view stays limited to contract §4 fields and universal status/coverage metadata. Do not render season breakdowns or infer unavailable FW9 values from this audit evidence. FW6–FW8 intentionally have no scoring evidence or result facts because their reads do not supply a result.

Each evidence row records valid league position/points/goals and four boolean inputs, computed breakdown/score, and season winner. League title is derived solely from position 1; both managers have distinct positions in each season. The independent Python check recomputes every component, both capped bonuses, each season score/winner, all displayed totals, final winner/margin and all available trophy counts. Equal final points remain a draw even if season winners differ. It also checks the five status states, copy provenance, online heading family, crown/lighting rules, phone requirements and missing-field honesty. Output is recorded in JOB-134 status notes.

## Self-check

- Exact-string spot check passed against main for: `SHOWDOWN FINAL RECONCILED`; `FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP`; `FINAL RESULT READY FOR TERMINAL CLOSE`; `CLOSE SHARED SHOWDOWN`; `SHOWDOWN COMPLETE`.
- Mockup reconciliation covers every Final Winner-relevant element borrowed from the two style references and gives it an explicit live, preview or drop answer. There is no dedicated Final Winner mockup.
- Final Winner data is limited to DATA_CONTRACT_V1 §4 plus universal §0 state metadata. Unrecorded/player/per-match statistics are explicitly DROP.
- FW1–FW9 are fictional and carry `Preview data`. Independent Python validation recomputes FW1–FW5/FW9 from published season evidence, including capped bonuses, valid bounds, distinct positions, totals, final winner/margin and available trophy counts. FW6–FW8 carry no invented result values; FW9 missing trophy fields remain absent.
- Daniel is first/left and Nik second/right in truth, ids and every fixture frame.
- No fixture frame references a real club crest, league logo, real competition trophy, player image or other image asset.
- Every JOB-007 commit changes only `visual-assets/v10_1/final-winner/TRUTH.md`, `visual-assets/v10_1/final-winner/fixtures.json`, or `project-documents/factory/status/JOB-007.md`.

