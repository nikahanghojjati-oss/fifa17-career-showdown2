# Saved Showdowns that must still open (JOB-1841)

Each `*.json` file here is the real database content of one **finished 1-season Showdown**, played end to end in the browser by an
older release against the Firebase **emulator** (demo project, composed production Rules). They exist so every later release can prove
it still opens, and shows the same numbers for, a Showdown that an earlier release saved.

The check is `tests/firebase/saved-showdowns-still-open-emulator.cjs` (`npm run -s test:saved-showdowns-still-open`). It loads every
fixture into a fresh emulator with the composed production Rules, signs in as Daniel and as Nik, and runs the real code path
(`readCareerIndex` -> `readCompletedShowdown` -> `loadClosedShowdownCareer` -> `buildCareerModel`). It fails if a fixture is missing,
if a fixture has no expected values in the test, or if any value below changes. The expected values are written in the test by hand
(not read from the fixture), and they are the same as in this file.

## How they were made

* Releases: **r75** = `origin/main` before the r76 release (`3f6b1c97ec20bd74c74a8330c0222511ecc02f6f`, `service-worker.js`
  `RUNTIME_REVISION = "1.9.1-r75"`); **r76** = `origin/gameplay/clean-start` at `b15282daa4966279582ee2ae1491a2353d2d0739`
  (`RUNTIME_REVISION = "1.9.1-r76"`).
* Harness: the CE2PG browser journey (`tests/browser/ce2pg-journey.cjs` on branch `gameplay/ce2pg`, not committed). Two Chromium
  contexts (Daniel and Nik) play the real game on the Auth + Firestore emulators: pair, league and clubs, Transfer Challenge, typed
  season results, commit and acknowledge, Showdown Champion screen. Run once per fixture with a static server for that release's tree:
  * win: `CE2PG_SEASONS=1 CE2PG_RUN=1`
  * draw: `CE2PG_SEASONS=1 CE2PG_RUN=1 CE2PG_SCENARIO=draw`
  (The job asked for a 2-season Showdown; the game only supports 1, 3, 5 or 10 seasons, so each release has a 1-season win and a
  1-season draw.)
* Export: at the very end of each run (before the emulator stops) a local patch of the harness walked the whole emulator Firestore with
  the emulator's admin REST path (`GET .../documents` plus `:listCollectionIds`, recursively). Only these documents were kept:
  `rivalries/<id>` and everything under it, both managers' `accounts/<uid>` document (the Rules need an active account), and both
  managers' `accounts/<uid>/careerIndex/*` documents. Devices and pair links were dropped. `createTime` / `updateTime` were dropped.
  Values are kept in Firestore REST typed form, so timestamps keep their exact nanoseconds and the content hashes still verify.
* The fixtures hold emulator-only account ids and no auth tokens (the test also refuses a fixture that contains token-like keys).
* Known harness noise, unrelated to the saved data: `final.live.exitLabels.*` and the `ident.*.figures` checks; on r75 the Showdown
  Champion screen also fails the REVIEW SEASON, Rivalry Statistics and Trophy Room visible-details checks, which r76 fixed.

## Expected values

Scoring: Champions League 5, league title 3, domestic cup 1, 100 league points or 100 league goals 1, top scorer / top assist 1.
All four fixtures: status `completed`, 1 season, both managers see the same result, a signed-in stranger is denied.

### Win games (`r75-1season-win`, `r76-1season-win`): Daniel wins 6-5

| | Daniel | Nik |
| --- | --- | --- |
| League position / points / goals | 5th / 48 / 119 | 1st / 100 / 61 |
| Season score | 6 (Champions League 5 + 100 goals 1) | 5 (title 3 + cup 1 + 100 points 1) |
| Season result | win (no tie-break) | loss |
| Trophies (Champions League / league title / domestic cup / total) | 1 / 0 / 0 / 1 | 0 / 1 / 1 / 2 |
| Showdown totals | 6 | 5 |
| Showdown | winner **Daniel**, margin 1 (biggest Showdown win: Daniel, 1) | loss |

| Fixture | Release | Rivalry id | League | Clubs (Daniel v Nik) |
| --- | --- | --- | --- | --- |
| `r75-1season-win` | 1.9.1-r75 | `pair_15d7d6f518f46cd89984c0dcbb02f52c6312247ed665149d13a5bdc598ebefb7` | Bundesliga | Borussia Mönchengladbach v Hoffenheim |
| `r76-1season-win` | 1.9.1-r76 | `pair_183383e34b4ef70b1b5ab50928941c053810f77da4a1fb82d4fb5fa4793e4126` | Bundesliga | Eintracht Frankfurt v RB Leipzig |

### Draw games (`r75-1season-draw`, `r76-1season-draw`): 8-8, Showdown drawn

| | Daniel | Nik |
| --- | --- | --- |
| League position / points / goals | 9th / 53 / 135 | 8th / 102 / 45 |
| Season score | 8 (CL 5 + cup 1 + 100 goals 1 + top assist 1) | 8 (CL 5 + cup 1 + 100 points 1 + top scorer 1) |
| Season result | loss on the tie-break (league position) | win on the tie-break (league position 8th v 9th) |
| Trophies (Champions League / league title / domestic cup / total) | 1 / 0 / 1 / 2 | 1 / 0 / 1 / 2 |
| Showdown totals | 8 | 8 |
| Showdown | **draw** (margin 0, no biggest Showdown win) | **draw** |

| Fixture | Release | Rivalry id | League | Clubs (Daniel v Nik) |
| --- | --- | --- | --- | --- |
| `r75-1season-draw` | 1.9.1-r75 | `pair_1504f42b6ee8ba9beed8c7c0a740bea2e55dea5113c3b60a9b66a6119046837c` | La Liga | Leganés v Málaga |
| `r76-1season-draw` | 1.9.1-r76 | `pair_1b53464a1b6de121ab27d6d3e165f50ced72523dda5652faf4b1652fa91c9462` | Premier League | West Ham United v Watford |

### r79 (`r79-1season-win`, r80 Europa League PR 2)

Made the same way on **live main** (`d1888c339a62742bac66607e4c8004b0af64d74e`, `RUNTIME_REVISION = "1.9.3-r79"`, served from that
tree with that tree's composed Rules), driven by the r80 CE2PG harness (`tests/browser/ce2pg-journey.cjs` from `gameplay/r80` @ 854c797,
copied into the r79 tree with a local, uncommitted export patch): `CE2PG_PLAN=single CE2PG_SEASONS=1 CE2PG_RUN=1`. The game played
to the end and closed by itself; the harness's r80-only page checks (Standings opened first, Settings CURRENT SHOWDOWN/HISTORY)
fail on r79, which is the r79 behaviour r80 fixed, and is unrelated to the saved data.

| | Daniel | Nik |
| --- | --- | --- |
| League position / points / goals | 1st / 92 / 108 | 12th / 24 / 30 |
| Season score | 5 (title 3 + 100 goals 1 + top scorer 1) | 1 (cup 1) |
| Season result | win (no tie-break) | loss |
| Trophies (Champions League / Europa League / league title / domestic cup / total) | 0 / 0 / 1 / 0 / 1 | 0 / 0 / 0 / 1 / 1 |
| Showdown totals | 5 | 1 |
| Showdown | winner **Daniel**, margin 4 | loss |

| Fixture | Release | Rivalry id | League | Clubs (Daniel v Nik) |
| --- | --- | --- | --- | --- |
| `r79-1season-win` | 1.9.3-r79 | `pair_1191eebf4c20afaf3e82c25e4e543cf63aaacf844112f78cc665bead1288cbe2` | Ligue 1 | Paris Saint-Germain v Metz |

The r79 in-progress Showdown (`r79-3season-inprogress`, season 1 of 3 committed) lives in `../saved-showdowns-in-progress/`, because
this folder holds finished Showdowns only; `tests/firebase/r79-showdown-continues-emulator.cjs` continues it on the current code.

## Adding a fixture for a new release

Play the same two games (win, draw) on the new release with the CE2PG harness, export them as above into
`<release>-1season-win.json` / `<release>-1season-draw.json`, add the file names and their expected values to `EXPECTED` in the test,
and describe them here. Never regenerate an old fixture: it is the proof of what that old release saved.
