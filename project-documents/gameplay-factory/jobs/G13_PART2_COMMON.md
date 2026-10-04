# G-13 part 2 · common rules for jobs 24 to 30 (wire Team V's visual package)

Every job 24–30 starts by reading this file and its own job file. If they disagree, the job file wins.

## Goal

Team V's package is finished (relay V2G-013: 238/238 jobs, 15 screens). Part 1 (job 13, PR #347) already wired Trophy Room and Career Statistics. Part 2 wires the other 13 screens, so that Nik and Daniel can play the live game start to finish in Team V's style, bug-free (shared goal, V2G-010).

**Nik's top rule (2026-10-04, after a real two-phone season on r52): the game must stay as smooth as it is now.** The visuals change how screens look, not how the game works.

## Sources (pinned)

- Team V screens: branch `factory/v1-wtt5ye` at commit **`bde2172`** (`bde2172a…`). Copy from that commit with `git show bde2172:<path>`, never from the moving tip. Team V's polish pass CC-008 will land later; the lead brings those changes in afterwards. Do not wait for it.
- Read first on that commit: `project-documents/factory/PACKAGE.md`, `project-documents/factory/HANDOFF_TO_SOL.md`, `visual-assets/v10_1/shared/navbar/NAV_CONTRACT.md`, and your screen's `TRUTH.md` and `BUILD_RESULT.md` (where they exist).
- Data shape: `project-documents/leads/DATA_CONTRACT_V1.md` (branch `leads/relay`), and the fixtures in `tests/fixtures/data-contract-v1/` on `gameplay/recovery-v1`.
- Pattern to copy: job 13's `js/careerScreensV10.js` and `tests/contracts/career-screens-v10-contracts.cjs` on `gameplay/recovery-v1`, plus job 24's foundation once it is merged.

## Hard rules

1. **Skin, don't rewire.** On gameplay screens (Start/Join, League, Club, Transfer War, Season Results, Final Winner), keep every existing element id, button, `data-*` hook and button text that product code or tests use. Team V's `TRUTH.md` lists the ids that must survive. Team V's layout, art and motion go around and on top of those elements. Gameplay modules (`productionShared*.js`, `spark*.js`, `persistentNikDanielPair.js`) are not edited, except a one-line hook that the job file names.
2. **Two-manager browser journey stays green.** `tests/browser/two-manager-browser-journey.cjs` (in CI job "Two-manager browser journey") clicks real buttons by id and text. If your change breaks it, fix your change, never the test. Only add a test step for a new visual element.
3. **Startup budget.** The startup gzip is 37495 of 37500. `index.html` and startup scripts must not grow. All visual code and CSS load lazily, per screen, through job 24's loader (`js/v10Screens.js`).
4. **Truth.** Real data only. Never show fixtures, "Preview data" chips or invented numbers in the app. A field the model lacks shows the screen's honest unavailable state, and you list it under "Model gaps" in the status file.
5. **Exactly two managers.** Daniel is Player One (left), Nik is Player Two (right), everywhere.
6. **Guards.** Billing off, Firebase Spark only, no new Firestore paths, no Rules change, no scoring change, no new storage keys except UI-only preferences that job 24 defines. The only new network host allowed is Audius, for Nik's music (job 25).
7. **No `main`.** PRs go into `gameplay/recovery-v1`. Do not change `RUNTIME_REVISION`; the lead bumps it at release. Nothing reaches the live app before Nik approves Team V's package.
8. **Team V files.** Copy them unchanged, except the data entry point (pass a frame instead of fetching `fixtures.json`), asset base paths and a boot hook, as job 13 did. List every edit in the PR body as "file: line: why".
9. **Tests first.** Each job adds a numbered contract (`ok N ...`) under `tests/contracts/`, registered in `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` and in `expectedSupplementalContracts` in `tests/operations/pos20-control-plane.test.mjs`.

## Checks before DONE

- `npm run test:contracts` exits 0, and the line `startup N/37495` shows N no higher than before.
- `npm run test:ops` has 0 failures.
- On your exact head commit: "Validate Gameplay Fast" is green (all four jobs, including "Two-manager browser journey"), and on the PR "Validate POS20" is green.
- The PR body has "Before:", "After:", "How", the Team V file edits list, and "Model gaps" (or "none").

## Pace (Sol lanes)

At most two steps per turn, save after each, never poll CI inside a turn, no screenshots, take the DEFAULT instead of stopping. Cloud and Codex lanes may run the whole job in one go but must stop at the budget named in the job.

## Workers and reviews (from Team V's scorecard, V2G-014)

- Screen builds 25–30 go to **Codex** (Nik, 2026-10-04: put the usage on Codex). Nik pastes the lead's box into the Codex app until a Codex cloud environment exists; then the lead tags `@codex` on GitHub. The lead opens every screen in a browser at phone and desktop size before merging. If Codex fails the same job twice, a Claude helper (Opus 5.5 Medium) takes it over.
- **Codex reviews every visual PR.** The helper posts `@codex review` on the PR once checks are green and fixes or answers every finding before the lead merges.
- GPT-5.6 Sol normal chats take text work only: truth checks (every id in the screen's `TRUTH.md` still exists after the PR), data-contract checks, review notes.
- **Two FIX rounds on one job means change the worker**, not a third round: Sonnet to Opus, Opus Medium to Opus High, then the lead.
- Log each finished job in `WORKER_SCORECARD.md` (worker, first-time pass, fix rounds, what the review caught).

## When stuck

If the same step fails twice for the same reason, stop. Set `State: BLOCKED` in your status file, paste the failing assertion and the last 30 log lines, and reply `Job NN is blocked: <one line>`.
