# r87 leftover proofreading

Reviewed from `f4efa199`, rebased through `e6a80ca2` and onto `18802b939c654c7cef826ad79a0ba53133dd6e49`. Incoming size, career-truth and Gazette-filter fixes are preserved.

The user excludes every file changed by #1118, #1122, #1126, #1137 and #1149. A final live check found #1149 had expanded to 214 files. All overlapping edits were removed before publication. The final file lists are in [excluded-pr-files.json](excluded-pr-files.json); the PR diff must have zero intersection with their union, including merged PRs.

## Applied fixes

| Surface | Correction |
| --- | --- |
| Backup Trophy Room records | `1 pts`, `1 goals` → `1 pt`, `1 goal`; biggest Showdown margin also says `1 pt` |
| Completion hub | `MAIN MENU` → `HOME`, matching the destination used elsewhere; the existing navigation callback is unchanged |
| Dashboard | All five transfer status labels and the next-season action consistently say **Transfer War**, the name chosen by the owner |
| Transfer screen | Title, progress accessibility label and phone region label say **Transfer War**, matching the gold title artwork |
| Backup import errors | Invalid transfer history/record errors say **Transfer War** |
| Gazette | Four advertising metaphors use `billboard` instead of the banned word `marquee`; result facts and the advertising metaphor stay the same |

No CSS, images, button nodes, control order, layout rules, scoring or gameplay transitions changed. Special Player / SP remains the feature name. Internal module/API/storage identifiers are unchanged.

## Deferred fixes in protected files

These are deliberately **not applied here**. They must be listed in the PR body, not silently omitted:

| Protected file | Follow-up |
| --- | --- |
| `js/careerScreenSeam.js` | Coverage `0 of 1 Showdowns` → `0 of 1 Showdown`; noun follows the indexed count |
| `js/legacy.js` | History facts `1 league pts` / `1 goals` → `1 league pt` / `1 goal`; card `1 trophies won` → `1 trophy won` |
| `js/productionSharedJourneyReconnect.js` | `ALL 1 SEASONS COMPLETE` → `1 SEASON COMPLETE`; leave 3/5/10 plural |
| `js/rosterRouletteStep.js` | Named signings: `shot a J. Milner` → `shot J. Milner`, `a A. Newman was guessed` → `A. Newman was guessed`; preserve the reasons. Use **Transfer War** in recovery/board-building messages |
| `visual-assets/v10_1/legacy/legacy.js`, `strings.json` | `1 / 1 Seasons` → `1 / 1 Season`; `1 league pts` / `1 goals` → singular; indexed coverage `1 Showdowns` → `1 Showdown` |
| `visual-assets/v10_1/career-statistics/career-statistics.js` | Indexed coverage `1 Showdowns` → `1 Showdown` |
| `visual-assets/v10_1/trophy-room/trophy-room.js` | Singular indexed coverage in both the partial message and bold readable-count label |
| `visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js` | `1 / 1 SEASONS COMPLETED` → `1 / 1 SEASON COMPLETED`; singular indexed coverage for both the shipped `Showdowns` template and fallback `recorded seasons` template |
| `data/commentaryLines.js` | Capitalize the feature name `special player(s)` as `Special Player(s)` throughout reveal commentary; leave `{mpName}` and other placeholder keys unchanged |
| `index.html` | Initial dashboard status, Start, transfer title, lock-results and next-season labels: **Transfer War** / **TRANSFER WAR** |
| `js/rivalryLegacyV10.js` | Back-button accessibility label `Back to main menu` → `Back to Home` |
| `js/app.js` | Startup failure `Main Menu could not be opened.` → `Home could not be opened.` if exposed |
| `js/ruleBook.js` | Card 03 heading: **TRANSFER WAR** |
| `js/productionSharedCareerStart.js` | Continue button/status and surfaced errors: **Transfer War** |
| `js/productionSharedTransferChallenge.js` | Rendered title, completion status, refresh/dashboard/lock labels and player-facing setup/clock/load/refresh/update errors: **Transfer War** |
| `js/transferChallenge.js` | Progress accessibility text, rendered headings/statuses, completion notices and surfaced errors: **Transfer War**. Preserve persisted `Transfer Challenge Recording` and API identifiers |
| `js/seasonEngine.js` | Transfer-completion validation messages and next-season action: **Transfer War** |
| `js/productionSharedSeasonResults.js` | `Finish the Transfer War before publishing Season Results.` |
| `js/productionSharedSeasonResultsRoute.js` | `Transfer War complete` |
| `js/diagnostics.js` | If shown, `outside Transfer Challenge` → `outside Transfer War` |
| Protected browser harnesses `two-manager-browser-journey.cjs`, `studio-z-reload-probe.cjs` | Removed-tap list: `CONTINUE TO TRANSFER WAR`; dashboard-ready regex accepts `TRANSFER WAR`; retain timing and behavior assertions |
| Protected roulette assertion `tests/contracts/r87-roulette-hits-contracts.cjs` | When its named-signing copy fix is made, update the exact `shot a J. Milner` expectation |

## Audit evidence

[source-inventory.json](source-inventory.json) fingerprints all 193 JS/data/visual text sources in the source sweep, including protected sources inspected read-only. Source review covers setup, league wheel, club packs, Special Player reveal, Career Start, roulette, Transfer War phases, recovery/confirmation/error/offline notices, rules, settings, history/backup/restore, statistics, standings and finals. Names, numeric facts and gameplay rules are preserved. CSS-generated captions were checked too: `CMS 17`, `CLUB PACK`, `CM17`, `HOME` and `REFRESH` need no correction.

[screen-text.json](screen-text.json) records 58 rendered views at 1920×1080 and 393×852: Home, Settings, Rule Book, Connect Players, Legacy, season History, Career Statistics, Trophy Room, Rivalry, Standings, Final Winner, Season Entry and Season Review, including visible tabs. `capture.cjs` repeats this read-only fixture tour after `node tests/support/static-server.cjs`. These are fixtures, not production two-account evidence. Setup/reveal/error variants are reviewed in source and existing suites, not represented as invented live captures.

## Validation

Run `node tests/contracts/r87-words-fixes-contracts.cjs` explicitly. The registry is protected, so this PR does not register the file there or edit package.json. Six contracts cover every remaining applied fix, singular/plural record units, canonical display names and the strict exclusion list. The Gazette data checksum is updated for exactly the four reviewed copy edits; its behavior assertions remain intact.

The new test fails on the base (`1 pts` versus `1 pt`) and passes after the fixes. Final validation results are in the PR body. Protected follow-ups necessarily leave the listed wording on the base until their owners apply it.
