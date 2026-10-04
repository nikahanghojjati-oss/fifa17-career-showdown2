# Team V ↔ Team G binding map

Scope: JOB-104/214/215 binding tables (all nine data screens); JOB-216-218 swap the numbers; JOB-219 locks and renames; JOB-220 cross-screen check.

Authority: project-documents/factory/DATA_CONTRACT_V1.md v1.0 and Team G G-11 model-true fixtures.

Source (since 2026-10-04 18:10 UTC): Team G's G-11 fixtures are on this branch at `visual-assets/v10_1/shared/fixtures/data-contract-v1/` (copied from `gameplay/recovery-v1` @ `dc78ed7b`; `index.json` lists 14 scenarios plus `nav.json`). Every G-11 key below is a path inside one scenario file: `viewers.<viewer>.…` is the model one manager's device sees; `<manager>` is `daniel` or `nik`.

Which scenario feeds which preview frame is the `frame-map` block at the end of this file. `visual-assets/v10_1/shared/tools/check_binding.py` reads it and checks every key and frame against the scenario files.

## Binding rules

1. Daniel is playerOne / daniel and stays left. Nik is playerTwo / nik and stays right.
2. Preview fixtures keep the exact visible label Preview data.
3. The only interim label is Current Showdown only. Career history is not yet available.
4. UI copy, DOM ids, route descriptions, notes and art metadata are Team V-owned and are not model fields.
5. A display string may derive from model fields, but the adapter must retain the contract field as authority.
6. Rival unpublished Season Results never enter the view model before phase = results-ready.
7. Top-bar locking uses only nav.locked and nav.reason. Team V renders the lock copy Finish this step first.

## Home

G11 root: viewers.<viewer>.home

| Visual fixture field | DATA_CONTRACT_V1 field | G-11 key | Binding |
| --- | --- | --- | --- |
| frames.*.badge | viewerRole | viewers.<manager>.home.viewerRole | Derive DANIEL / NIK display copy; signed-out preview remains Team V-only. |
| frames.*.indicator | continue.state; continue.season; continue.totalSeasons | viewers.<manager>.home.continue.state / season / totalSeasons | Derive No Active Showdown, Season N / M or completed state. |
| frames.*.save.hasSave | continue.state | viewers.<manager>.home.continue.state | true only for a resumable/completed Showdown state. |
| frames.*.save.label | continue.state | viewers.<manager>.home.continue.state | Team V copy selected from model state. |
| frames.*.save.meta | continue.season; continue.totalSeasons | viewers.<manager>.home.continue.season / totalSeasons | Team V sentence derived from model values. |
| frames.*.newTile | viewerRole | viewers.<manager>.home.viewerRole | Daniel gets Start; Nik gets Join. |
| frames.*.primary | viewerRole; continue.state | viewers.<manager>.home.viewerRole / continue.state | Choose Continue versus Start / Join. |
| frames.*.tiles.history.available | tiles.history.available | BLOCKED (no G-11 home.tiles) | Direct. |
| frames.*.tiles.history.reason | tiles.history.reason | BLOCKED (no G-11 home.tiles) | Direct enum; Team V owns rendered words. |
| frames.*.tiles.statistics.available | tiles.statistics.available | BLOCKED (no G-11 home.tiles) | Direct. |
| frames.*.tiles.statistics.reason | tiles.statistics.reason | BLOCKED (no G-11 home.tiles) | Direct enum. |
| frames.*.tiles.trophyRoom.available | tiles.trophyRoom.available | BLOCKED (no G-11 home.tiles) | Direct. |
| frames.*.tiles.trophyRoom.reason | tiles.trophyRoom.reason | BLOCKED (no G-11 home.tiles) | Direct enum. |
| frames.*.tiles.rivalry.available | tiles.rivalry.available | BLOCKED (no G-11 home.tiles) | Direct. |
| frames.*.tiles.rivalry.reason | tiles.rivalry.reason | BLOCKED (no G-11 home.tiles) | Direct enum. |

Home fields the current preview fixture does not carry yet (JOB-216 adds them per frame from the frame map):

| Contract field | G-11 key | Scenario files |
| --- | --- | --- |
| viewerRole | viewers.<viewer>.home.viewerRole | every scenario |
| status | viewers.<viewer>.home.status | every scenario (`loading`, `unavailable`, otherwise `ready`) |
| continue.state | viewers.<viewer>.home.continue.state | every scenario (`paired`, `waiting`, `unpaired`, null while loading/unavailable) |
| continue.leagueId | viewers.<viewer>.home.continue.leagueId | active-*, completion-pending, multi-showdown-career |
| continue.clubs.<manager> | viewers.<viewer>.home.continue.clubs.<manager> | same; G-11 carries display names (`Arsenal`), Team V crests key by id (`arsenal`): see js changes |
| continue.season / continue.totalSeasons | viewers.<viewer>.home.continue.season / totalSeasons | same |
| continue.score.<manager> | viewers.<viewer>.home.continue.score.<manager> | active-*, completion-pending, finished-three-seasons, tiebreak-finish, equal-position-tiebreaks, multi-showdown-career |

- BLOCKED Home tiles.{history,statistics,trophyRoom,rivalry}.available and .reason: DATA_CONTRACT_V1 §1 names them (A, G-6) but no G-11 scenario carries `viewers.<viewer>.home.tiles`. Ask Team G. Until then Home keeps its preview tile values.

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

Start / Join `context.*` (season, totalSeasons, leagueId, clubs) has no §2 field. It binds to the same scenario's Home model: `viewers.<viewer>.home.continue.season / totalSeasons / leagueId / clubs` (null when unpaired; the screen then shows no context line).

G-11 gaps for Start / Join (found 2026-10-04, ask Team G; frames keep Team V preview values meanwhile):
- BLOCKED startJoin.status = partial: no scenario has it (SJ7).
- BLOCKED startJoin.status = empty: empty-career sends `ready` with pairing.state `none` (SJ1, SJ4 keep `empty`).
- BLOCKED pairing.state = waiting-for-nik: no scenario has it (the waiting host is `code-created` in pairing-code-created).
- BLOCKED session.state open / revoked / closed / expired: scenarios carry only `active` or null.
- Note: G-11 pairing.code is a full pair id (`CMS17-pair_5555…`, 75 chars). Team V shows a short code; the adapter must shorten it for display or Team G must name the display form.

## Season Results

G11 roots: viewers.<manager>.seasonResults and seasonResultsBySeason[]

| Visual fixture field | DATA_CONTRACT_V1 field | G-11 key | Binding |
| --- | --- | --- | --- |
| frames.*.status | §0 status | viewers.<viewer>.seasonResults.status | Direct. |
| frames.*.phase | phase | viewers.<viewer>.seasonResults.phase | Direct except SR2_REVIEW; see derived state below. |
| frames.*.managers.<manager>.leaguePosition | leaguePosition | viewers.<viewer>.seasonResults.inputs.<manager>.leaguePosition | Private until results-ready for the rival side. |
| frames.*.managers.<manager>.leaguePoints | leaguePoints | viewers.<viewer>.seasonResults.inputs.<manager>.leaguePoints | Same privacy rule. |
| frames.*.managers.<manager>.leagueGoals | leagueGoals | viewers.<viewer>.seasonResults.inputs.<manager>.leagueGoals | Same privacy rule. |
| frames.*.managers.<manager>.domesticCup | domesticCup | viewers.<viewer>.seasonResults.inputs.<manager>.domesticCup | Boolean. |
| frames.*.managers.<manager>.championsLeague | championsLeague | viewers.<viewer>.seasonResults.inputs.<manager>.championsLeague | Boolean. |
| frames.*.managers.<manager>.topScorer | topScorer | viewers.<viewer>.seasonResults.inputs.<manager>.topScorer | Boolean, not a player name. |
| frames.*.managers.<manager>.topAssist | topAssist | viewers.<viewer>.seasonResults.inputs.<manager>.topAssist | Boolean, not a player name. |
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

Season Results `context.*`:
- context.season → viewers.<viewer>.seasonResults.season.
- context.totalSeasons / leagueId / clubs → viewers.<viewer>.home.continue.totalSeasons / leagueId / clubs in the same scenario.

Renames for the js (JOB-219): the preview fixture's `managers.<manager>` is G-11's `inputs.<manager>`; G-11 sends the rival's inputs as null before results-ready (the preview omits the key). Committed seasons come from `viewers.<viewer>.seasonResultsBySeason[]` (breakdown, winner, tiebreak filled); the live season's breakdown is null until committed.
- Draft values while entering (SR1, SR2, SR2_REVIEW, SR6) are the manager's own typed input; G-11 sends `inputs` = null for an unpublished own season, so these frames keep Team V preview values inside the §0 bounds.

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

G-11 source: `nav.json` → `screens.<screenId>.{locked, reason}` and `lockText` ("Finish this step first"). Home = `screens.mainMenu`, Start / Join = `screens.createShowdown`, Season Results entry = `screens.seasonEntry`, Season Results summary = `screens.seasonSummary`. Nav reason is null (not "none") when unlocked.

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

## frame-map

Machine-read by check_binding.py. `viewer` "either" reads the daniel viewer. `gap` = the frame follows the scenario except the named difference. `teamV` true = no G-11 scenario matches this frame (signed out, draft input or a G-11 gap above); the frame keeps preview values and the reason says why.

```json
{
  "home": {
    "HM1": {"teamV": true, "reason": "signed out: no G-11 viewer exists before sign-in"},
    "HM2": {"scenario": "active-mid-season", "viewer": "nik"},
    "HM3": {"scenario": "completion-pending", "viewer": "daniel"},
    "S0": {"teamV": true, "reason": "plate only"}
  },
  "start-join": {
    "SJ1": {"scenario": "empty-career", "viewer": "daniel", "gap": "G-11 sends status ready with pairing.state none; the frame keeps status empty (§0 empty = new career, read succeeded). Ask Team G."},
    "SJ2": {"scenario": "pairing-code-created", "viewer": "daniel"},
    "SJ3": {"scenario": "pairing-code-created", "viewer": "nik"},
    "SJ4": {"scenario": "empty-career", "viewer": "nik", "gap": "same as SJ1"},
    "SJ5": {"scenario": "active-first-season", "viewer": "daniel"},
    "SJ6": {"scenario": "loading", "viewer": "daniel"},
    "SJ7": {"teamV": true, "reason": "BLOCKED: no G-11 partial Start / Join"},
    "SJ8": {"scenario": "unavailable", "viewer": "daniel"}
  },
  "season-results": {
    "SR1": {"scenario": "active-first-season", "viewer": "daniel", "draft": true},
    "SR2": {"scenario": "active-mid-season", "viewer": "nik", "draft": true},
    "SR2_REVIEW": {"scenario": "active-first-season", "viewer": "daniel", "draft": true},
    "SR3": {"scenario": "active-mid-season", "viewer": "daniel"},
    "SR4": {"scenario": "active-results-ready", "viewer": "daniel"},
    "SR5": {"scenario": "active-results-ready", "viewer": "daniel", "season": 1},
    "SR6": {"scenario": "active-first-season", "viewer": "daniel", "draft": true},
    "SR7": {"scenario": "loading", "viewer": "daniel"},
    "SR8": {"teamV": true, "reason": "G-11 has no empty Season Results (empty-career sends status loading)"},
    "SR9": {"teamV": true, "reason": "interim label frame; no G-11 partial Season Results"},
    "SR10": {"scenario": "unavailable", "viewer": "daniel"}
  }
}
```

`"season": N` = the frame shows committed season N from `seasonResultsBySeason[]` instead of the live `seasonResults`.
