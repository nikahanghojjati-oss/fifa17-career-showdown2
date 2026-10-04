# Team V ↔ Team G binding map

Scope: JOB-104 part 1 of 8 · Home, Start / Join, Season Results.

Authority: project-documents/factory/DATA_CONTRACT_V1.md v1.0 and Team G G-11 model-true fixtures.

DEFAULT: tests/fixtures/data-contract-v1/index.json is not present on factory/v1-wtt5ye. JOB-102 records the G-11 delivery there, and the delivered file is recoverable at Team G commit 4f81385d9a3c0d4c3e0ccf65173d781f45c83afc. This part therefore uses that pinned G-11 manifest plus DATA_CONTRACT_V1 exact field names. The manifest declares:
- Home root: viewers.<manager>.home
- Start / Join root: viewers.<manager>.startJoin
- Season Results roots: viewers.<manager>.seasonResults and seasonResultsBySeason[]
- Nav source: tests/fixtures/data-contract-v1/nav.json

The G-11 scenario payload files named by the manifest are not copied onto the factory branch yet. Exact scenario-file attribution is marked BLOCKED below; the model field names are not invented.

## Binding rules

1. Daniel is playerOne / daniel and stays left. Nik is playerTwo / nik and stays right.
2. Preview fixtures keep the exact visible label Preview data.
3. The only interim label is Current Showdown only. Career history is not yet available.
4. UI copy, DOM ids, route descriptions, notes and art metadata are Team V-owned and are not model fields.
5. A display string may derive from model fields, but the adapter must retain the contract field as authority.
6. Rival unpublished Season Results never enter the view model before phase = results-ready.
7. Top-bar locking uses only nav.locked and nav.reason. Team V renders the lock copy Finish this step first.

## Home

G11 root: viewers.<manager>.home

| Visual fixture field | DATA_CONTRACT_V1 field | G-11 key | Binding |
| --- | --- | --- | --- |
| frames.*.badge | viewerRole | viewers.<manager>.home.viewerRole | Derive DANIEL / NIK display copy; signed-out preview remains Team V-only. |
| frames.*.indicator | continue.state; continue.season; continue.totalSeasons | viewers.<manager>.home.continue.state / season / totalSeasons | Derive No Active Showdown, Season N / M or completed state. |
| frames.*.save.hasSave | continue.state | viewers.<manager>.home.continue.state | true only for a resumable/completed Showdown state. |
| frames.*.save.label | continue.state | viewers.<manager>.home.continue.state | Team V copy selected from model state. |
| frames.*.save.meta | continue.season; continue.totalSeasons | viewers.<manager>.home.continue.season / totalSeasons | Team V sentence derived from model values. |
| frames.*.newTile | viewerRole | viewers.<manager>.home.viewerRole | Daniel gets Start; Nik gets Join. |
| frames.*.primary | viewerRole; continue.state | viewers.<manager>.home.viewerRole / continue.state | Choose Continue versus Start / Join. |
| frames.*.tiles.history.available | tiles.history.available | viewers.<manager>.home.tiles.history.available | Direct. |
| frames.*.tiles.history.reason | tiles.history.reason | viewers.<manager>.home.tiles.history.reason | Direct enum; Team V owns rendered words. |
| frames.*.tiles.statistics.available | tiles.statistics.available | viewers.<manager>.home.tiles.statistics.available | Direct. |
| frames.*.tiles.statistics.reason | tiles.statistics.reason | viewers.<manager>.home.tiles.statistics.reason | Direct enum. |
| frames.*.tiles.trophyRoom.available | tiles.trophyRoom.available | viewers.<manager>.home.tiles.trophyRoom.available | Direct. |
| frames.*.tiles.trophyRoom.reason | tiles.trophyRoom.reason | viewers.<manager>.home.tiles.trophyRoom.reason | Direct enum. |
| frames.*.tiles.rivalry.available | tiles.rivalry.available | viewers.<manager>.home.tiles.rivalry.available | Direct. |
| frames.*.tiles.rivalry.reason | tiles.rivalry.reason | viewers.<manager>.home.tiles.rivalry.reason | Direct enum. |

Contract fields Home needs but the current Team V preview fixture does not carry canonically:
- BLOCKED Home viewerRole: frames use badge/newTile rather than an explicit viewerRole field.
- BLOCKED Home continue.state.
- BLOCKED Home continue.leagueId.
- BLOCKED Home continue.clubs.daniel.
- BLOCKED Home continue.clubs.nik.
- BLOCKED Home continue.season.
- BLOCKED Home continue.totalSeasons.
- BLOCKED Home continue.score.daniel.
- BLOCKED Home continue.score.nik.

Home fixture namespaces that are not Team G model data:
- version, authority: fixture provenance.
- strings, decorative, availabilityMessages: Team V copy.
- frames.*.tier, frames.*.note, frames.S0.plateOnly: showcase/review metadata.
- ownerChange: owner-note metadata.
- routes, destinations: Team V navigation documentation and layout.

Home reason copy owned by Team V:
- loading → Loading…
- reconnecting → Reconnecting…
- not-paired → Pair with your rival first
- unavailable → Not available right now

## Start / Join

G11 root: viewers.<manager>.startJoin

| Visual fixture field | DATA_CONTRACT_V1 field / action | G-11 key | Binding |
| --- | --- | --- | --- |
| frames.*.status | §0 status | viewers.<manager>.startJoin.status | Direct: loading / empty / unavailable / partial / ready. |
| frames.*.viewer | viewer selector, not a contract payload field | outer viewers.<manager> key | Select the correct viewer model; never infer from account/save id. |
| frames.*.pairing.state | pairing.state | viewers.<manager>.startJoin.pairing.state | Direct enum. |
| frames.*.pairing.code | pairing.code | viewers.<manager>.startJoin.pairing.code | Host/Daniel only after creation; never expose to an unrelated viewer. |
| frames.*.session.state | session.state | viewers.<manager>.startJoin.session.state | Direct enum. |
| actions / action labels | createCode, join, copyCode, newCode, checkStatus, retry | model capabilities/actions | Team V owns the visible button strings. |
| remote session actions | host, join, refresh, revoke, close, forget | model capabilities/actions | Revoke / Close / Forget live in More and require confirmation. |
| abandon control | abandonShowdown | model capability/action | Confirmation required. |
| forget-device control | forgetThisDevice | model capability/action | Confirmation required. |

Display-only or preview-only fields:
- managerOrder must always be [daniel, nik].
- joinDraft is transient DOM input and never a Team G canonical field.
- statusText, message, error, more labels and all strings are Team V copy.
- validationOnly.render is false; validationOnly is arithmetic evidence only and must never bind into Start / Join.
- session.availability in SJ7 is a Team V preview helper. Contract authority is the screen §0 status plus session.state; do not send availability as a model field.
- context is setup/showcase context, not a §2 field.

Contract mismatch to remove during model binding:
- SR-style visual helpers are not allowed to extend pairing.state or session.state enums.
- pairing.state uses only none / code-created / waiting-for-nik / paired.
- session.state uses only open / active / revoked / closed / expired.

Fields shown by Start / Join but lacking an exact §2 contract name:
- BLOCKED Start / Join context.totalSeasons: shown in setup previews, but DATA_CONTRACT_V1 §2 does not name a totalSeasons field.
- BLOCKED Start / Join context.season / leagueId / clubs: preview-only today; do not promote them into the model without a contract field.

## Season Results

G11 roots: viewers.<manager>.seasonResults and seasonResultsBySeason[]

| Visual fixture field | DATA_CONTRACT_V1 field | G-11 key | Binding |
| --- | --- | --- | --- |
| frames.*.status | §0 status | viewers.<viewer>.seasonResults.status | Direct. |
| frames.*.phase | phase | viewers.<viewer>.seasonResults.phase | Direct except SR2_REVIEW; see derived state below. |
| frames.*.managers.<manager>.leaguePosition | leaguePosition | viewers.<viewer>.seasonResults.managers.<manager>.leaguePosition | Private until results-ready for the rival side. |
| frames.*.managers.<manager>.leaguePoints | leaguePoints | viewers.<viewer>.seasonResults.managers.<manager>.leaguePoints | Same privacy rule. |
| frames.*.managers.<manager>.leagueGoals | leagueGoals | viewers.<viewer>.seasonResults.managers.<manager>.leagueGoals | Same privacy rule. |
| frames.*.managers.<manager>.domesticCup | domesticCup | viewers.<viewer>.seasonResults.managers.<manager>.domesticCup | Boolean. |
| frames.*.managers.<manager>.championsLeague | championsLeague | viewers.<viewer>.seasonResults.managers.<manager>.championsLeague | Boolean. |
| frames.*.managers.<manager>.topScorer | topScorer | viewers.<viewer>.seasonResults.managers.<manager>.topScorer | Boolean, not a player name. |
| frames.*.managers.<manager>.topAssist | topAssist | viewers.<viewer>.seasonResults.managers.<manager>.topAssist | Boolean, not a player name. |
| frames.*.breakdown.<manager>.championsLeague | breakdown.championsLeague | viewers.<viewer>.seasonResults.breakdown.<manager>.championsLeague | App-computed. |
| frames.*.breakdown.<manager>.leagueTitle | breakdown.leagueTitle | viewers.<viewer>.seasonResults.breakdown.<manager>.leagueTitle | App-computed. |
| frames.*.breakdown.<manager>.domesticCup | breakdown.domesticCup | viewers.<viewer>.seasonResults.breakdown.<manager>.domesticCup | App-computed. |
| frames.*.breakdown.<manager>.performanceBonus | breakdown.performanceBonus | viewers.<viewer>.seasonResults.breakdown.<manager>.performanceBonus | App-computed, max one point. |
| frames.*.breakdown.<manager>.awardsBonus | breakdown.awardsBonus | viewers.<viewer>.seasonResults.breakdown.<manager>.awardsBonus | Adapter name; provider individualAwardsBonus. |
| frames.*.breakdown.<manager>.total | total | viewers.<viewer>.seasonResults.breakdown.<manager>.total | App-computed, max 11. |
| frames.*.winner | winner | viewers.<viewer>.seasonResults.winner | daniel / nik / draw. |
| frames.*.tiebreak | tiebreak | viewers.<viewer>.seasonResults.tiebreak | none / league-position / league-points / draw. |
| frames.SR9.interimLabel | §0 interimLabel | careerInterim.interimLabel | Exact text only; never launch state. |

Derived/display-only Season Results fields:
- frames.*.viewer selects the outer viewers.<manager> model and is not a payload field.
- managerOrder is always [daniel, nik].
- sealed is derived from viewer + phase. It enforces privacy; it is not a substitute for omitting the rival payload.
- SR2_REVIEW phase = unpublished-review is Team V display state only. Contract phase remains entering; the local reviewed flag chooses the review composition.
- actionLabels, error, previewLabel and launchState are Team V UI/review fields.
- strings, ids and routes are Team V copy / DOM / navigation metadata.

Season Results fields visible in the current fixture but without an exact §3 contract field name:
- BLOCKED Season Results context.season.
- BLOCKED Season Results context.totalSeasons.
- BLOCKED Season Results context.leagueId.
- BLOCKED Season Results context.clubs.daniel.
- BLOCKED Season Results context.clubs.nik.

## Top-bar nav lock

Contract fields:
- nav.locked: boolean.
- nav.reason: transfer-window / season-entry / setup.
- Team V lock copy: Finish this step first.

Expected screen behavior for this part:
| Screen | nav.locked | nav.reason |
| --- | --- | --- |
| Home | false | none |
| Start / Join | false | none |
| Season Results / seasonEntry | true | season-entry |

G-11 manifest names tests/fixtures/data-contract-v1/nav.json, but that payload is not on the factory branch.
- BLOCKED exact G-11 nav.json selector/key for Home.
- BLOCKED exact G-11 nav.json selector/key for Start / Join.
- BLOCKED exact G-11 nav.json selector/key for Season Results.

## Team V strings that the model may cause to be shown

These strings stay Team V-owned even when a Team G field selects them.

### Home
Tile/action copy: CONTINUE CAREER; VIEW COMPLETED SHOWDOWN; START A SHOWDOWN; JOIN DANIEL'S SHOWDOWN; LEGACY; STATISTICS; TROPHY ROOM; RULE BOOK; SETTINGS.
Availability copy: Loading…; Reconnecting…; Pair with your rival first; Not available right now.

### Start / Join
Preview/interim: Preview data; Current Showdown only. Career history is not yet available.
State copy: Checking your connection…; No Showdown connection yet. Daniel starts a Showdown, then Nik joins with Daniel's code.; Some connection details are unavailable. Your known connection is kept; try again to refresh the missing details.; Connection details are unavailable right now. Try again without deleting your saved career.
Primary/action copy: START A SHOWDOWN; CREATE CODE FOR NIK; JOIN DANIEL'S SHOWDOWN; COPY CODE; CHECK STATUS; NEW CODE; CONTINUE CAREER; START CAREER; RETRY CONNECTION; HOST PRIVATE SESSION; JOIN PRIVATE SESSION; REFRESH / READ; REVOKE OPEN SESSION; CLOSE SESSION; FORGET CODE; BACK.
Live status copy: Getting your Showdown ready…; Daniel and Nik need to connect before the first Showdown.; Send this code to Nik. It is needed only once.; Nik joined Daniel's Showdown. Continue Career when both players are ready.; Career ready.; Daniel's connection code is invalid.; Joining Daniel's Showdown…; Preparing your Showdown…
Privacy/menu copy: Only someone with this code can join.; More.

### Season Results
Preview/interim/lock: Preview data; Current Showdown only. Career history is not yet available.; Finish this step first.
Title/entry: SEASON {SEASON_NUMBER} SHARED RESULTS; Enter only {MANAGER}'s FIFA 17 season result. Your rival enters their own result privately on their device. Nothing on this screen writes to the canonical local Save.
Field copy: LEAGUE POSITION; LEAGUE POINTS; LEAGUE GOALS; Domestic Cup Winner; Champions League Winner; Top Scorer; Top Assist; Domestic Cup; Champions League.
Review copy: FINAL CHECK; REVIEW YOUR SEASON RESULT; NOT PUBLISHED YET; Check your seven season facts carefully. Publishing is immutable for this manager and season.; YOUR RESULT IS PUBLISHED; PUBLISHED · WAITING FOR YOUR RIVAL; Your rival cannot see this result until they publish their own. This screen refreshes automatically.; BOTH MANAGERS PUBLISHED; RESULTS READY · BOTH PRIVATE SIDES REVEALED; Both managers published their reviewed FIFA 17 season results. Continue with the Shared Season Commit below.
Review warnings: PUBLISHING IS FINAL FOR YOUR MANAGER · CANONICAL LOCAL SAVE IS NOT MODIFIED; RESULT PUBLICATION COMPLETE · SHARED SEASON COMMIT IS READY.
Buttons: REVIEW MY SEASON RESULT; PUBLISH MY SEASON RESULT; PUBLISHED ✓; EDIT MY RESULT; BACK TO SHOWDOWN HOME; CHECK SHARED SEASON COMMIT; RETRY COMMIT CHECK; COMMIT SHARED SEASON; WAITING FOR COORDINATOR; ACKNOWLEDGE SHARED SEASON; ACKNOWLEDGED ✓ · WAITING FOR RIVAL; SEASON COMMIT ACKNOWLEDGED ✓.
Commit status copy: CHECKING SHARED SEASON COMMIT · YOUR PUBLISHED RESULTS ARE SAVED; SHARED SEASON COMMIT CHECK FAILED · {ERROR_CODE} · YOUR PUBLISHED RESULTS ARE SAVED; BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT; BOTH RESULTS ARE READY · WAITING FOR {COORDINATOR} TO COMMIT THE SHARED SEASON; THE SHARED RESULT SNAPSHOT IS COMMITTED · BOTH MANAGERS MUST ACKNOWLEDGE BEFORE SCORING CAN BEGIN; YOU ACKNOWLEDGED THIS SHARED SEASON · WAITING FOR YOUR RIVAL; SHARED SEASON COMMIT ACKNOWLEDGED BY BOTH MANAGERS · SCORING REMAINS LOCKED FOR THE NEXT CAPABILITY.
Canonical score copy: SHARED CANONICAL SCORE; {DANIEL}: {DANIEL_TOTAL} · {NIK}: {NIK_TOTAL}; Champions League {D_CL}–{N_CL} · League Title {D_LEAGUE}–{N_LEAGUE} · Domestic Cup {D_CUP}–{N_CUP} · Performance Bonus {D_PERFORMANCE}–{N_PERFORMANCE} · Awards Bonus {D_AWARDS}–{N_AWARDS}; Season result: Draw; Season winner: {MANAGER}; Authoritative scoring reconciled.; CANONICAL SCORE.
Scoring rules: Scoring: Champions League +5, league title +3, domestic cup +1. 100 league points and/or 100 league goals share one +1 performance bonus. Top Scorer and/or Top Assist share one +1 awards bonus. Maximum season score: 11.
Route/status copy: CONTINUE TO SHARED SEASON RESULTS; ENTER SHARED SEASON RESULTS; VIEW MY PUBLISHED RESULT; VIEW SHARED SEASON RESULTS; OPENING SEASON RESULTS…; Shared transfer challenge: complete · season results ready; Shared season results: waiting for rival; Shared season results: both published.
Validation/error copy remains exactly the strings object in visual-assets/v10_1/season-results/fixtures.json; Team G supplies state/error codes, not replacement prose.
Sealed copy template: Waiting for {MANAGER}.

## G-11 source gap for Claude relay

BLOCKED exact scenario payload file for each binding row: the G-11 index on Team G commit 4f81385d9a3c0d4c3e0ccf65173d781f45c83afc names scenario JSON files, but those payload files are not present on factory/v1-wtt5ye. Claude should ask Team G to copy the G-11 fixture set (including nav.json) onto the factory branch or provide a pinned fixture commit accepted for Team V integration.

Until that lands, adapters must use the contract keys above and must not invent substitutes.
