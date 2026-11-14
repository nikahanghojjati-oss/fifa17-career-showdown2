# JOB-13 · Part 1: Trophy Room and Career Statistics on the real career model

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm, node and contract runs; browser and emulator results come from GitHub CI) | nothing open: jobs 4, 5, 6, 9 and 11 are merged into `gameplay/recovery-v1` | 7 | `gameplay/job-13-career-screens` | `gameplay/recovery-v1` | no |

**Pace:** at most two steps (or one heavy step) per turn. Save after every step. Never poll CI inside a turn: push, save, stop, and read the result once next turn. No screenshots. Take the DEFAULT instead of stopping. Text only. See WORKER_HANDBOOK "Pace rules".

## 1. Goal

In r43 the online app hid `#careerStatisticsButton`, `#legacyButton` and `#rivalryStatisticsButton` with one injected stylesheet (`js/onlinePlayerIdentity.js:24`, style id `onlineInternalSurfaceContainment`), because those screens read old browser-local data. Trophy Room was nested under Statistics, so it became unreachable too. Jobs 3 to 11 built the real career model: `js/sharedCareerAnalytics.js` (`buildCareerModel`, `trophyRoom`), the active and closed Showdown adapters, the closed-Showdown loader, and `js/careerScreenSeam.js`, which renders the five honest states `loading`, `empty`, `unavailable`, `partial` and `ready`. Team V has finished and checked the new Trophy Room and Career Statistics screens (relay V2G-009) and cleared Team G to wire these two screens now.

This job (G-13 part 1):

1. Un-hides **Career Statistics** online and adds a reachable **Trophy Room** entry (`#trophyRoomButton`).
2. Shows Team V's two screens, fed by the **real career model** and never by fixtures.
3. Keeps **Legacy** and **Rivalry Statistics** hidden. Part 2 wires them, plus the rest of Team V's package, once Nik approves it.

Plain words: on the gameplay branch, Daniel and Nik can open Career Statistics and the Trophy Room and see their own real career numbers, drawn in Team V's new style. If there is no history yet, the screen says so honestly. Nothing changes in the live app until Nik approves Team V's whole visual package.

## 2. Branches and files

- The lead created `gameplay/job-13-career-screens` from `gameplay/recovery-v1`. If it is missing, create it yourself from `gameplay/recovery-v1`.
- **Screen source, pinned:** branch `factory/v1-wtt5ye` at commit `f4da9a3f32e3f90673e3d7ef8112c0f9522f03f4`. Copy from that exact commit, never from the moving branch tip. If Team V names a newer commit in the relay, the lead will update this line.
- Copy to the same paths in the code branch, so relative references keep working:
  - `visual-assets/v10_1/trophy-room/`: `trophy-room.css`, `trophy-room.js`, `assets/` (only files the CSS or JS reference, including `assets/platemap.json` if present)
  - `visual-assets/v10_1/career-statistics/`: `career-statistics.css`, `career-statistics.js`, `assets/` (only referenced files)
  - `visual-assets/v10_1/shared/`: `showdown-tokens.css`, `showdown-type.css`, `showdown-ui.css`, `stage.css`, `stage.js`, `motion.css`, `motion.js`, `fonts/` (only referenced fonts), `trophies/*_512.webp`
- **Do not copy** `index.html`, `preview.html`, `fixtures.json`, `evidence/`, `review/`, `tools/`, `*.md`, `*_SRC.png`, `GUIDE_*`, `PHONE_PROOF*` or any `.png` that a `.webp` already covers.
- Create:
  - `js/careerScreensV10.js`: the lazy binder (§4).
  - `tests/contracts/career-screens-v10-contracts.cjs` (§6).
- Edit (minimal):
  - `js/onlinePlayerIdentity.js`: remove only `#careerStatisticsButton:not([data-test-surface='internal-audit'])` from the containment selector list. `#legacyButton` and `#rivalryStatisticsButton` stay hidden.
  - The existing lazy loader that opens Statistics or Trophy Room screens (find it from `js/statistics.js`, `js/trophyRoom.js` and `js/careerScreenSeam.js` callers), so it loads `js/careerScreensV10.js` on demand.
  - `service-worker.js` shell list: add every new file the screens load, exactly as the existing contracts require for lazy files. **Do not** change `RUNTIME_REVISION`; the lead bumps it at the main release.
  - The contract registry, `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and `tests/operations/pos20-control-plane.test.mjs` `expectedSupplementalContracts`, the same way job 21 registered `shared-tap-race-contracts.cjs`.

## 3. Rules that apply

- **Startup budget.** The startup gzip is 37495 of 37500 bytes. `index.html` and every startup script must not grow. Add the `#trophyRoomButton` element from lazy JS (or put it inside an existing lazily rendered container), not in `index.html`. `npm run test:contracts` prints `startup N/37495`; N must not go up.
- **Truth.** Never show a number the model does not have. `loading`, `empty`, `unavailable` and `partial` use the model's status and the `careerScreenSeam.js` `TEXT` strings (or Team V's copy for the same state, if the meaning is identical). Never show zeros for `unavailable` or `loading`. `partial` shows the `{readable} of {indexed}` line.
- **Exactly two managers.** Daniel is Player One (left), Nik is Player Two (right), in every row and image, whoever leads.
- **No preview chip.** Team V's "Preview data" chip must not appear with real data.
- **Scoring, Rules and providers unchanged.** This job reads the model only: no Firestore writes, no Rules files, no change to `sharedCareerAnalytics.js` numbers. If the model lacks a field a screen needs, show that tile as unavailable and list the field under "Model gaps" in the status file. Do not invent it.
- **No `main`.** Nothing goes to `main`; nothing visual reaches the live app before Nik approves Team V's full package.

## 4. What to build

`js/careerScreensV10.js`, lazily loaded:

1. `openCareerStatistics()` and `openTrophyRoom()`: show the screen's section and render it.
2. Get the model the same way the existing Career Statistics and Trophy Room code paths do through `careerScreenSeam.js` (the seam already accepts a model and a status). Map it to the frame shape Team V's `career-statistics.js` and `trophy-room.js` read (`frame.managers.daniel/nik`, `frame.showdowns.daniel/nik`, the status, the career-table rows). Keep the mapping in one pure function, `toV10Frame(model, screen)`, so the contract can test it without a browser.
3. Team V's renderers fetch `fixtures.json` and `assets/platemap.json` at start-up. Change only their **data entry point**: production passes the frame from `toV10Frame`. Keep `platemap.json` loading if the layout needs it. Keep every visual, motion and copy rule as Team V built it. Record each change to Team V's files in the PR body as "file: line: why".
4. Back buttons return to where the user came from (Statistics hub or home), the same way the old screens did.

## 5. Steps

1. Read this job, `js/careerScreenSeam.js`, `js/sharedCareerAnalytics.js`, `js/statistics.js`, `js/trophyRoom.js`, `js/onlinePlayerIdentity.js:24`, `tests/fixtures/data-contract-v1/` and, on the pinned commit, Team V's `career-statistics.js`, `trophy-room.js`, both `TRUTH.md` files and both `fixtures.json` files (to learn the frame shape). Write the field map (Team V frame field ← model field) into the status file. Save.
2. **Tests first:** write `tests/contracts/career-screens-v10-contracts.cjs` (§6) and register it. Run it: it must fail on the missing module. Record the failure line. Save.
3. Copy the pinned Team V files (§2). Save.
4. Write `js/careerScreensV10.js` with `toV10Frame`, and the data-entry change in Team V's two renderers. Run the new contract until it passes. Save.
5. Wire it in: containment edit, lazy loading, `#trophyRoomButton` created from lazy JS, back navigation and service-worker shell list. Run `npm run test:contracts` and `npm run test:ops`. Save.
6. Push. Open the PR into `gameplay/recovery-v1`. Read "Validate Gameplay Fast" and "Validate POS20" on your exact head commit once, next turn. Fix and repeat until green.
7. Fill in the done checklist and set State: DONE.

## 6. Tests first

`tests/contracts/career-screens-v10-contracts.cjs` (numbered checks, `ok N ...` lines). It must at least cover:

- **V1 to V6, mapping.** For each data-contract-v1 fixture (`empty-career`, `loading`, `unavailable`, `partial-career`, `finished-three-seasons`, `multi-showdown-career`, `tiebreak-finish`), `toV10Frame` returns the right status. For `ready` and `partial` it returns exactly the model's numbers: each manager's league titles, domestic cups, Champions Leagues, Showdown wins, season W-D-L and career points. Daniel comes first and Nik second in every row, including when Nik leads (`multi-showdown-career` or a fixture where Nik leads).
- **V7, honesty.** For `loading` and `unavailable`, the frame has no numeric career facts. The rendered HTML string from Team V's renderer, run on a minimal DOM stub or by checking the frame, contains no "Preview data".
- **V8, containment.** The containment selector in `js/onlinePlayerIdentity.js` still hides `#legacyButton` and `#rivalryStatisticsButton`, and no longer hides `#careerStatisticsButton`.
- **V9, budget and shell.** `index.html` has no `trophyRoomButton` and no `careerScreensV10` script tag. `service-worker.js` lists every new lazy file. `RUNTIME_REVISION` is unchanged.
- **V10, no fixtures in production.** `js/careerScreensV10.js` never references `fixtures.json`.

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Field map recorded (step 1); "Model gaps" listed, or "none".
- [ ] Tests-first evidence: the contract failing on the missing module (step 2).
- [ ] `node tests/contracts/career-screens-v10-contracts.cjs` PASS; `npm run test:contracts` all pass with `startup N/37495` not higher than before; `npm run test:ops` 0 failures.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), including `Two-manager browser journey`; "Validate POS20" green on the PR head.
- [ ] Only the §2 files changed; Team V files copied from `f4da9a3f` (list them in the PR body), with data-entry edits only; `index.html` unchanged; `RUNTIME_REVISION` unchanged; Legacy and Rivalry Statistics still hidden.
- [ ] PR open into `gameplay/recovery-v1` with the field map and the "Team V file edits" list. State: DONE. The lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, save, and reply `Job 13 is blocked: <one line>`.

Known traps:

- `npm run test:contracts` rewrites `firestore.spark.generated.rules`. It is not tracked; never commit it.
- The startup budget fails if you add the button or a script tag to `index.html`. Create the button from lazy JS.
- A pinned Team V file references an asset you did not copy, so the screen shows a broken image. Copy only what is referenced, but copy all of it.
- `Two-manager browser journey` fails its final console-error check if your new code logs an error while the career model is still loading. Treat `loading` as a normal state, not an error.
