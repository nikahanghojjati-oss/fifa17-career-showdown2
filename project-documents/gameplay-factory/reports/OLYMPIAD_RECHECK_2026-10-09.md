# Bug Olympiad recheck · 2026-10-09

Every Olympiad finding on `qa/bug-olympiad` (`project-documents/gameplay-factory/sweeps/olympiad/findings/*.json`, 38 files) was rechecked against the current `gameplay/bug-list-1` tip **97274bb4** (live r65 + JOB-1041). The Olympiad ran on main `bc77a0b9`.

How each finding was checked:
- Code reading of the cited files on 97274bb4, plus the commit or job that changed them since bc77a0b9.
- The 14 Olympiad browser repros in `sweeps/olympiad/test/` were re-run on 97274bb4 (local static server, Chromium 1194). Their results are quoted below.
- The earlier Olympiad checker verdicts in `sweeps/olympiad/checked/` were reused where nothing changed since.

Nothing was fixed in this pass. Physical acceptance is not claimed for anything here.

## Count

| Result | Findings | Distinct bugs |
|---|---|---|
| Fixed since the Olympiad | 13 | 8 |
| Not real, outdated or irrelevant | 15 | 8 |
| Still valid | 10 | 7 |
| **Total** | **38** | **23** |

None of the still-valid bugs duplicates an open job (1042 closed Final Winner, 1043-1045 Showdown Gate).

## Still valid (to package as jobs)

| # | Bug | Findings | Severity | Where | Evidence on 97274bb4 | Suggested lane |
|---|---|---|---|---|---|---|
| V1 | The Rule Book leaves out three real rules: both managers can agree to end the transfer window early; the Showdown winner is the higher points total across all seasons and a tied total is a DRAW; a season with equal points, league position and league points is a draw. | CMS08-codex-1006-1303-window-rule, CMS08-codex-1006-1303-final-rule, area08-exact-season-tie-undefined (chat-1006-1346-1) | S2/S3 | `js/ruleBook.js:51` and `:57-62` (text only) | Both CMS08 repros still fail: the Rule Book still says only "lasts 15 minutes" and has no final-total rule. The rules themselves are already decided (memory: a tied Showdown total shows DRAW; tied seasons go to league position). | GPT chat (text only) |
| V2 | After both results are published, the season review still says "Nothing becomes permanent until Confirm & Save Season is pressed", and that button is not shown. | CMS11-codex-1007-0342-review-instruction | S3 | `js/seasonEngine.js:47`, `js/productionSharedSeasonResults.js` (review render) | Repro still fails with the same sentence. | GPT chat |
| V3 | At the club-pack reveal, the rivalry summary already names Nik's club while his pack is still sealed, which spoils the reveal. | CMS01-codex-1006-2349-sealed-club | S3 | `js/productionSharedShowdownPresentation.js` `ssjpFillConfirmation` / `ssjpAnimatePacks` | Repro still fails: at stage `manager-one` the packs show `["West Ham United","?"]` but the visible summary shows `["West Ham United","Southampton"]`. | Codex |
| V4 | Refreshing halfway through Signing Entry clears unfinished signing rows (name, league, nationality). Locked signings and verdicts survive. | CMS03-codex-1006-2238-draft-reload | S3 | `js/productionSharedTransferChallenge.js` `pstcResetForContext`, no draft storage | Repro still fails: name comes back `''` instead of `Paulo Dybala`. Any fix must keep drafts on the player's own device only, keyed by rivalry, season and role, cleared on lock; it must not touch Remote Joining's no-sessionStorage rule. | Codex |
| V5 | Backup restore on an **empty** device brings a backup career back even when every choice says Keep current. (The non-empty case is fixed, see F4.) | A07-RESTORE-KEEP-LIBRARY-IGNORED (chat-1006-1335-1), codex-1006-1312-keep-empty | S2 | `js/restore.js` `createCareerModeRestorePlan`, `destinationIsClean` branch (~line 158) | Repro still fails: `{"gamesRestored":1}` after an all-Keep-current apply. Reachable from Settings > Data Management. Low impact: online history lives in Firestore. | Codex |
| V6 | During the transfer challenge the public ledger stores a hash of each locked guess list whose other inputs are all public, so a rival with browser tools could work out the opponent's guesses before signings are locked. | chat-1006-0441-1 | S2 (privacy; needs dev tools) | `js/sparkSharedTransferChallenge.js:149` (`stspMutate` operationHash), `stspPublicLedger` | Code unchanged since the Olympiad: `operationHash=stspHash({actorRole,type,operationId,baseRevision,...normalizedPayload})` and every non-guess input is in the rival-readable public doc. | Claude Sonnet (security wording trips the GPT filter) |
| V7 | Firestore Rules accept transfer option ids and signing names that the game's reader rejects, so a hand-made write could leave a completed challenge unreadable for both players. | chat-1006-0503-1 | S3 (not reachable from the game UI) | `firestore.transfer-challenge-production.fragment.rules:5`, `:212-222` vs `js/sparkSharedTransferChallenge.js:51-55` | Rules still allow any 2-80 char id. Needs a Rules change, a composed-Rules re-pin and a Rules deploy. Lowest priority. | Claude Sonnet |

## Fixed since the Olympiad

| # | Bug | Findings | Fixed by | Proof on 97274bb4 |
|---|---|---|---|---|
| F1 | Sign-in starter race: identity startup could run before its loader, so a phone skipped the sign-in gate. | codex-1006-1957-1, codex-1006-2237-1, codex-1006-2308-1 | Studio Z Z1 (f71bb5f7, r63): start waits for DOMContentLoaded and retries 4 times | `js/showdown.js:6`; Studio Z journey 38/38 incl. J1.1 |
| F2 | Reload after season-2 transfers lost the identity and stalled at CAREER READY. | codex-1006-2237-2, codex-1006-2308-2 | Studio Z Z1 + Z3 refresh rejoin (f71bb5f7, r63) | Studio Z journey J9.1 refresh rejoin passes |
| F3 | A new season opened with last season's results and trophies filled in. | codex-1006-1251-stale-season-results, codex-1006-1301-01 | JOB-1026 (344fb654, r63) | Both repros pass: season 2 fields are empty |
| F4 | Restore with Keep current replaced the existing career. | codex-1006-1312-keep-current, CMS07-codex-1007-0355-keep-career | JOB-1027 (90040c22, r63): apply plans from the same complete snapshot as the preview | keep-current repro passes; CMS07 shows `KEEP_ALL same:true, 7999 → 7999` (its later step fails only because it expected the old wrong result) |
| F5 | Career Statistics said "history unavailable" for a career whose only Showdown was ended early. | OLY-06-EMPTY-AFTER-RESTART | JOB-1028 (22f93aa8, r65): shows zeros | Repro now reads `ready` instead of unavailable (it hoped for `empty`; zeros was the chosen behaviour) |
| F6 | The finished Final Winner lost trophy counts after reload. | CMS05-codex-1006-1939-closed-honours | JOB-1025 H1017-3 (13dfe6f9, r63) and JOB-1038 (83824fba, r65) | Repro passes: trophies kept after finishing |
| F7 | Typing "Primera División" silently picked Argentina. | CMS03-codex-1006-2238-ambiguous-league | Studio Z Z8 (7f805d14, r63) | Lock is now refused until a country is chosen from the list |
| F8 | The phone footer covered the previous-league list. | CMS03-codex-1006-2238-phone-league-pick | Phone Transfer War rework, JOB-1021 (b89492f1) and JOB-1031 (b152f64a, 6e74cdbe) | Repro passes: the Spain option is tappable |

## Not real, outdated or irrelevant

| # | Finding | Findings | Verdict | Why |
|---|---|---|---|---|
| N1 | League and club taps not routed to the shared dispatcher | chat-1006-0418-1 | Not real | `js/productionSharedJourneyGuard.js:66-90` captures them (Olympiad checker, unchanged) |
| N2 | Career Table "Showdowns" column shows W-D-L | chat-1006-0534-1, chat-1007-0052-1 | Irrelevant (old offline screen) | Old `createCareerStandingsTable` is no longer rendered; the online Career Statistics shows a count |
| N3 | Rule Book markup missing from index.html | chat-1006-1331-1, chat-1007-0103-1 | Not real | `js/ruleBook.js:7-18` builds `#ruleBook` |
| N4 | Legacy shows stale history after archive | chat-1006-1333-1, chat-1006-1355-1 | Not real | The storage transaction already invalidates the cache (Olympiad checker) |
| N5 | Guesses can lock with fewer than 3 | chat-1006-1334-1, chat-1006-1336-1, chat-1006-1342-1 | Not a bug | Up to three guesses is the rule; a "Lock N of 3?" confirm exists (BH-4) |
| N6 | Tied career shows one manager as #2 | chat-1006-1345-1 | Irrelevant (old offline screen) | Same retired helper as N2 |
| N7 | League points above the league maximum accepted | chat-1007-0439-1, chat-1007-0443-1 | Irrelevant (old offline entry) | The online entry already caps points at (teams-1)×6: `js/productionSharedSeasonResults.js:90-92` |
| N8 | Local transfer timer stops after the tab is hidden | chat-1007-0447-1, chat-1007-0451-1 | Irrelevant (old offline engine) | The online Transfer War re-ticks on visibility: `pstcVisibilityChange` in `js/productionSharedTransferChallenge.js` |

## Next

The Team G lead packages V1-V7 as factory jobs (cheapest lane first) after 1043, 1044 and 1045. V6 and V7 stay off the GPT lanes because of the cyber-safety filter. The BOARD.json bug-free meter still counts these Olympiad findings as open; the lead owns that update.
