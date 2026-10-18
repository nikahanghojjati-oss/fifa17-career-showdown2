# JOB-16 · Two-manager browser journey (localhost-only emulator switch)

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **chat** (normal chat; node 22 and Java 21 but no npm registry, so every Firebase emulator and browser run happens on GitHub CI, see §2) | JOB-02 merged into `gameplay/recovery-v1` (JOB-07 and JOB-17 are also merged; this test relies on both) | 9 | `gameplay/job-16-browser-journey` | `gameplay/recovery-v1` | no |

**Pace:** at most two steps (or one heavy step) per turn, save after every step, never poll CI inside a turn (push, save, stop, read once next turn), no screenshots, DEFAULT instead of stopping, text only. See WORKER_HANDBOOK "Pace rules".

## 1. Goal

JOB-02 proved the whole two-manager Showdown at the provider level (node calls into `js/` against the composed Rules). Nobody has yet proved it through **the real app screens**: the Google sign-in gate, "Who are you?", Start / Join with the pair code, Remote Joining, the setup wheels, the transfer window, season entry, commit, the final winner and Terminal Close, clicked in a real browser by two managers at once. That is what Nik still tests by hand.

This job builds one automated browser test: Daniel and Nik in two Chromium contexts (phone sizes 393×660 and 360×640), driving `index.html` against the **Auth + Firestore emulators** loaded with the **composed production Rules**, plus a stranger. Test database only (`demo-cms-browser-journey`).

To get the real app to talk to the emulator without touching production, the job adds a **test-only emulator switch**: one file under `tests/browser/support/` that the test injects into the page. It activates only on `http://localhost` or `http://127.0.0.1` with `?cmsEmulator=1`. **No file in `js/`, `index.html`, `service-worker.js` or the Pages artifact changes.** The startup bundle stays byte-identical (37,493 / 37,500 gzip bytes). A new contract test proves the switch can never reach production.

The lead prototyped the risky part on `gameplay/recovery-v1` @ `889810f` (Appendix C runs green, 4 consecutive runs, about 30 s each, with Chromium from `@sparticuz/chromium`, the same browser CI uses). Proven: the switch, Auth emulator sign-in through the real "SIGN IN WITH GOOGLE" button, choosing the player, device registration, Daniel's pair code, Nik's join, both career indexes `[R1]`, the Remote Joining session, and both managers reaching the league wheel, with no production Firebase host ever contacted. **Not yet proven** (your steps 5-8): setup wheels, career start, transfers, season entry, commit, multi-season, reload, final, Terminal Close, stranger and second Showdown through the UI.

## 2. Branches and files

- The lead creates `gameplay/job-16-browser-journey` from `gameplay/recovery-v1`. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if `tests/firebase/two-manager-journey-emulator.cjs` exists there; if not, reply `Job 16 waits for job 2.` and stop.
- **Lane and CI path.** A normal chat has node 22 and Java 21 but **no npm registry**, so you cannot install Playwright, firebase-tools or the Firebase SDK. Locally you run only: `node --check` on every file you write, and `node tests/contracts/browser-journey-emulator-switch-contracts.cjs` (it needs no npm packages). Save files through the GitHub connector (WORKER_HANDBOOK §7 Path A). Read every browser and emulator result from the "Validate Gameplay Fast" run on your **exact head commit**: job `Two-manager browser journey`, step `Two-manager browser journey` (its log is your test output), plus job `Gameplay contracts`. Add the CI job in **step 4**, so CI runs the journey from its first save.
- **Screenshots.** CI uploads them as the artifact `browser-journey-screens` (step 4 adds this). You do not need local screenshots. If you try local Chromium for anything and it hangs (D-Bus), retry once with `--headless=new --no-sandbox`; if it still hangs, write `NO SCREENSHOTS (local Chromium hangs)` in the status Notes and continue. Never block on screenshots.

Create:

| File | What |
| --- | --- |
| `tests/browser/support/emulator-runtime-switch.js` | the test-only switch (Appendix A, full file) |
| `tests/browser/support/firebase.browser-journey.json` | emulator config: auth 9199, firestore 8181, hub 4411, logging 4511, UI off (Appendix D) |
| `tests/contracts/browser-journey-emulator-switch-contracts.cjs` | contract: the switch can never reach production (Appendix B, full file) |
| `tests/browser/two-manager-browser-journey.cjs` | the journey (Appendix C is J0-J3, proven; you add J4-J12) |

Edit (and only these):

| File | Change |
| --- | --- |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended at the end (Appendix E) |
| `tests/operations/pos20-control-plane.test.mjs` | one const + append it last to `expectedSupplementalContracts` (Appendix E) |
| `.github/workflows/validate-gameplay-fast.yml` | one new job `browser-journey` at the end (Appendix F); existing jobs untouched |
| `project-documents/gameplay-factory/status/JOB-16.md` on `factory/gameplay-v1` | status file |
| `project-documents/gameplay-factory/reports/JOB-16-browser-journey.md` on `factory/gameplay-v1` | the report (step 9) |

**Change nothing else.** In particular: no file in `js/`, `css/`, `data/`, `assets/`, no `index.html`, `service-worker.js`, `manifest.webmanifest`, `firebase.json`, `firebase.runtime-config.json`, no `*.rules`, no build script, no deploy workflow, no existing test, no `package.json` / `package-lock.json`. If the UI has a bug, it goes in the report, not in a fix (§6).

Read first (on `gameplay/recovery-v1`; line numbers are observations at `889810f`, re-check them):

1. `js/productionFirebaseRuntime.js` (446 lines): `classifyRuntimeContext` 59-64 (only `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/` is eligible, so on localhost production Firebase never starts), `loadAccountFirebaseSdk` 200-219, `ensureSparkAccountServices` 289-345 (the services object every provider uses), export object 413-445. **Read only.** The switch mirrors this API exactly.
2. `js/onlinePlayerIdentity.js`: `loadOnlineDependency` and `resolveOnlineDependencies` (they load `js/productionFirebaseRuntime.js` only if `window.CareerModeProductionFirebaseRuntime` is not already defined; that is the seam the switch uses), the sign-in gate ("SIGN IN WITH GOOGLE", "DANIEL · PLAYER ONE", "NIK · PLAYER TWO"), the Home tile texts ("START A SHOWDOWN", "JOIN DANIEL'S SHOWDOWN").
3. `js/sparkConnectedAccount.js` 155-190: `setPersistence(browserSessionPersistence)` then `signInWithPopup(auth, new GoogleAuthProvider())`.
4. `js/persistentNikDanielPair.js` `pairRender` (about line 257): "CREATE CODE FOR NIK", the `code` element, `#persistentNikDanielPairCode`, "JOIN DANIEL'S SHOWDOWN", "CHECK STATUS", "CAREER READY", "CONTINUE CAREER".
5. `js/sparkRemoteJoining.js` 255-270: "HOST PRIVATE SESSION", the input labelled "Exact private session code", "JOIN PRIVATE SESSION", "REFRESH / READ".
6. Selectors for the later screens, copy them from the existing browser audits (they use a fake provider; you use the real one): `tests/browser/production-shared-setup-overlay-audit.cjs` (`#productionSharedSetupOverlay`), `tests/browser/shared-career-start-r33-audit.cjs` (`#productionSharedCareerStartOverlay`, "I STARTED AT …", "MY CAREER STARTED ✓", "CONTINUE TO TRANSFER CHALLENGE"), `tests/browser/shared-transfer-challenge-replay-audit.cjs` (`#transferChallenge`, `#transferTimerDisplay`, `#transferPhaseStatus`, `#continueFromTransfers`; `js/productionSharedTransferChallenge.js` line 12 lists `startTransferTimer`, `endTransferTimer`, `completeTransferChallenge`, and the "REQUEST EARLY END" label), `tests/browser/shared-season-results-audit.cjs` and `shared-season-commit-audit.cjs` (`#seasonEntry`, `#p1LeaguePosition` … `#p2TopAssist`, `#p1Signing1Name`, `#completeSeason`, `#confirmSeasonCompletion`, `#seasonReviewOne`, `#seasonReviewTwo`, `#sharedSeasonCommitAction`, `#sharedSeasonCommitStatus`), `tests/browser/shared-multi-season-progression-audit.cjs` (`#sharedMultiSeasonContinueAction`, `#dashboardScoreOne`, `#dashboardScoreTwo`, `#seasonIndicator`), `tests/browser/shared-final-reconciliation-audit.cjs`, `tests/browser/shared-terminal-close-audit.cjs`.
7. `tests/firebase/two-manager-journey-emulator.cjs` (JOB-02): the same journey at provider level; use it to know what each phase must end in.
8. `tests/support/chromium-runtime.cjs` (Chromium for CI) and `tests/support/static-server.cjs` (serves the repo on `127.0.0.1:4173`).
9. Authority: `project-documents/leads/DATA_CONTRACT_V1.md` on `leads/relay` (§0 rules, §3 season phases, §4 final winner), lead handoff §6.5 (`GAMEPLAY_LEAD_FACTORY_HANDOFF_2026-10-02.md` on `leads/relay`).

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. Never deploy. Emulator project id is `demo-cms-browser-journey` (starts with `demo-`).
- **The switch must be impossible in production.** It lives only in `tests/`, which the Pages deploy never copies (`deploy-github-pages.yml` copies `index.html`, `manifest.webmanifest`, `service-worker.js`, `firebase.runtime-config.json`, `acceptance/`, `assets/`, `css/`, `data/`, `js/`). No production file may reference it. It activates only when **all** hold: protocol `http:`, hostname exactly `localhost` or `127.0.0.1`, `cmsEmulator=1`, `cmsEmulatorUser` in `daniel | nik | stranger`. The emulator host is hard-coded `127.0.0.1`. Do not change these conditions.
- **Production auth is unchanged:** Google popup only, `browserSessionPersistence`, no extra scopes. Inside the test, the switch's `signInWithPopup` stand-in signs in to the **Auth emulator** with a `google.com` credential, refuses any provider that is not `GoogleAuthProvider`, and refuses any scope beyond the default (`profile`). The app still calls `setPersistence(browserSessionPersistence)` itself.
- **Services parity.** The switch hands the app exactly the production services keys (`firestoreSdk` = `Timestamp`, `serverTimestamp`, `doc`, `runTransaction`; `authSdk` = the six production members). Never add SDK helpers (for example `getDoc`) to make a screen pass: that would hide a real production bug. The contract test checks this.
- Spark only, billing off, no Cloud Functions, no Cloud Run, App Check enforcement off, Firestore memory cache. The emulator config starts **only** `auth` and `firestore` (no functions, hosting, storage, database).
- Exactly two managers. Daniel = `playerOne`, LEFT, viewport 393×660. Nik = `playerTwo`, viewport 360×640. Stranger = third account, never in the rivalry.
- **Scoring never changes:** CL 5, league title 3, domestic cup 1, performance bonus 1 (100+ league points OR 100+ league goals, never 2), awards bonus 1 (top scorer OR top assist, never 2). Season max 11. Season tie: league position, then league points, else draw. Final: total points, equal = draw.
- **Privacy on screen:** before the transfer challenge is `COMPLETED`, neither page may show the rival's signings or guesses; before `RESULTS_READY`, neither page may show the rival's season inputs. The test asserts this on the rendered page (§4 J6, J7).
- Never click with `{force:true}`: a button the manager cannot reach at phone size is a finding.
- Never weaken, skip or delete an existing test. Do not touch SSJR/MDP ledgers. POS20 process work earns no SSJR or MDP credit, and this test earns none either.

## 4. What the test must prove

One file, `tests/browser/two-manager-browser-journey.cjs`. Output: one `ok <n> <id> <label>` line per check, then `PASS two-manager browser journey: <N> numbered checks (J0-J12) …`. `CMS_SHOWDOWN_LENGTH` (default 3) sets the seasons Daniel picks on the create screen (`#roundAmount`). CI runs `3`.

Fixed season results (enter them through `#p1…`/`#p2…` on each manager's own page; every value is within the bounds in DATA_CONTRACT_V1 §0 for every league the wheel can land on):

| Season | Daniel (pos, pts, goals, cup, CL, top scorer, top assist) | Daniel score | Nik (pos, pts, goals, cup, CL, top scorer, top assist) | Nik score | Season winner |
| --- | --- | --- | --- | --- | --- |
| 1 | 1, 87, 93, no, yes, yes, no | 5+3+0+0+1 = **9** | 2, 84, 101, yes, no, no, yes | 0+0+1+1+1 = **3** | Daniel |
| 2 | 3, 70, 66, no, no, no, no | **0** | 1, 100, 80, yes, yes, yes, yes | 5+3+1+1+1 = **11** | Nik |
| 3 | 2, 78, 70, yes, no, no, no | **1** | 4, 65, 60, yes, no, no, no | **1** | Daniel (tie, league position) |

Final after 3 seasons: Daniel **10**, Nik **15**, Nik wins by 5. With `CMS_SHOWDOWN_LENGTH=1`: Daniel 9, Nik 3, Daniel wins by 6.

Distinctive private tokens (signing names, free text): Daniel season 1 `QWX Daniel Signing`, Nik season 1 `ZPV Nik Signing`. Use different tokens per season (`QWX2 …`, `ZPV2 …`).

| Id | Section | Must prove |
| --- | --- | --- |
| J0 | Preflight (**given**, Appendix C) | composed Rules uploaded and active (open read 404 becomes 403); SDK pin = switch pin; switch active in both contexts |
| J1 | Sign-in (**given**) | both sign in with the real "SIGN IN WITH GOOGLE" button and choose their player; badges `DANIEL` / `NIK`; accounts bootstrapped |
| J2 | Pairing (**given**) | Daniel picks the seasons, START A SHOWDOWN, CONNECT PLAYERS, CREATE CODE FOR NIK; Nik pastes it, JOIN DANIEL'S SHOWDOWN; both CAREER READY; pair links `playerOne` / `playerTwo` on the same R1; both career indexes `[R1]` |
| J3 | Private session (**given**) | Daniel HOST PRIVATE SESSION, Nik JOIN PRIVATE SESSION with the code, both START CAREER and see `#leagueWheelScreen` |
| J4 | Shared setup | through the real wheel screens Daniel (host) completes league and club selection; Nik's page follows by itself (no click needed, "Waiting for the host"); both pages show the same league and the same two clubs; Daniel's club is in the LEFT slot (`#clubCardOne` / `#clubNameOne`) on **both** pages |
| J5 | Career start | each confirms their own start ("I STARTED AT <club>", then "MY CAREER STARTED ✓"); both reach `#transferChallenge` with "CONTINUE TO TRANSFER CHALLENGE" |
| J6 | Season-1 transfers + privacy | both start the window, enter guesses and signings (Daniel's signing name `QWX Daniel Signing`, Nik's `ZPV Nik Signing`) and lock them; **before COMPLETED**: Nik's page text and every input value never contain `QWX`, Daniel's never contain `ZPV`; both press "REQUEST EARLY END" (the window is 15 minutes otherwise; never wait it out); **after COMPLETED**: each page shows the reveal and both pages agree |
| J7 | Season-1 results + privacy + scoring | Daniel enters and publishes his row first; **before Nik publishes**: on Nik's page `#seasonReviewOne` and the `#p1…` fields do not show Daniel's 87 / 93 / position 1 (assert each value); Nik publishes; **after RESULTS_READY**: both pages show Daniel 9, Nik 3, Daniel wins the season; the numbers on Daniel's page equal the numbers on Nik's page |
| J8 | Commit + seasons 2..N | both commit (`#sharedSeasonCommitAction`); dashboard on both shows `9`-`3` and "Season 2 of 3"; seasons 2 and 3 repeat J6-J7 with the table values; in season 2 both managers press their publish button **at the same moment** (`Promise.all` of the two clicks): both pages converge to RESULTS_READY with no error banner (JOB-17 made the loser "stale, refresh", not "denied"); season 3 shows the league-position tiebreak won by Daniel |
| J9 | Reload | after season-2 transfers complete, `page.reload()` both pages (keep the URL; the switch re-installs and the session survives because `browserSessionPersistence` keeps it for the tab); both land back on the same step with their own unfinished inputs still private, and the journey continues from there |
| J10 | Final winner + Terminal Close | after the last commit both pages show the final: Daniel 10, Nik 15, Nik wins by 5 (or the 1-season numbers); then Terminal Close completes through the UI; an admin read shows the rivalry root closed **with** a `terminalClose` witness |
| J11 | Stranger | a third context `stranger` signs in, chooses "NIK · PLAYER TWO" on its own device, pastes Daniel's already-redeemed R1 code and presses JOIN: the page never shows CAREER READY; an admin read shows the stranger has no pair link and no career index naming R1; the stranger's page text never contains R1, `QWX` or `ZPV` |
| J12 | Second Showdown | Daniel starts a new Showdown from Home after the close, creates a new code, Nik joins; both reach `#leagueWheelScreen` for R2 (R2 ≠ R1); admin reads: both career indexes are `[R1, R2]` |
| JZ | Hygiene (**given**, keep it last) | in every context: no request to `firestore`/`identitytoolkit`/`securetoken`/`firebaseinstallations`/`firebaseappcheck` `.googleapis.com`, no load of `js/productionFirebaseRuntime.js` or `firebase.runtime-config.json`, no page errors |

Admin reads use the emulator REST API with `Authorization: Bearer owner` (helper `admin()` in Appendix C). They are read-only checks; **never write** through admin, never seed state, never disable Rules. Every state change in J1-J12 comes from a click or a typed value on a page.

If a section cannot be reached through the UI because of an app bug, do **not** seed around it. Follow §6.

## 5. Steps

After each step update `status/JOB-16.md` on `factory/gameplay-v1` with `Job 16 step k/9: <step name>`. Save code to `gameplay/job-16-browser-journey` as you go.

1. **Baseline.** Confirm JOB-02 is DONE and merged (its status file) and `tests/firebase/two-manager-journey-emulator.cjs` exists on `gameplay/recovery-v1`. Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1`; if it is red, set BLOCKED: `Job 16 is blocked: recovery-v1 CI is red before any change.` Confirm, by reading the files: no `connectAuthEmulator` / `connectFirestoreEmulator` anywhere in `js/`; `validate-gameplay-fast.yml` installs `firebase@12.17.1`; `deploy-github-pages.yml` copies the folder list in §3. Write any drift in the Notes.
2. **Tests first.** Create `tests/contracts/browser-journey-emulator-switch-contracts.cjs` (Appendix B). Apply Appendix E (registry entry last, ops const last). `node --check` all three files. Run `node tests/contracts/browser-journey-emulator-switch-contracts.cjs`: it must **fail** with `Cannot find module …emulator-runtime-switch.js`. Save. Record the red CI run on your head: `Gameplay contracts` fails on this contract. This red run is your tests-first evidence; link it.
3. **Switch + emulator config.** Create `tests/browser/support/emulator-runtime-switch.js` (Appendix A) and `tests/browser/support/firebase.browser-journey.json` (Appendix D) exactly. `node --check` the switch. Run the contract locally: `PASS browser journey emulator switch contracts: … startup gzip 37493/37500, services parity.` Save. CI: `Gameplay contracts` green (`N+1` contracts; the lead measured `103/103` at `889810f`), `Operations audit` green.
4. **Journey J0-J3 + CI job.** Create `tests/browser/two-manager-browser-journey.cjs` from Appendix C exactly, and add the `browser-journey` job (Appendix F) at the end of `validate-gameplay-fast.yml`. `node --check` the journey. Save. CI on your exact head: job `Two-manager browser journey` green; paste its last line (`PASS two-manager browser journey: 8 numbered checks (J0-J3 so far) …`) and the artifact name. If it fails, read §8 before changing anything.
5. **J4-J5 (setup, career start).** Add both sections before the `// J4..J12` marker, with one `ok` line per check. Save after J4 and again after J5; read CI each time.
6. **J6-J7 (season 1: transfers, results, privacy, scoring).** Add. Save. CI green.
7. **J8-J9 (commit, seasons 2..N, simultaneous publish, reload).** Add. Save. CI green.
8. **J10-J12 (final, Terminal Close, stranger, second Showdown).** Add. Update the PASS line to say `(J0-J12)`. Save. CI green.
9. **Full proof, report, PR.** On your exact head: both jobs and every step of "Validate Gameplay Fast" green; paste the journey's last line and the run URL. Compare your branch with `gameplay/recovery-v1` (GitHub compare): exactly the seven code files in §2, nothing in `js/`, no `index.html`, no generated Rules, no `firestore-debug.log`. Write `reports/JOB-16-browser-journey.md` on `factory/gameplay-v1`: one table row per check id (J0.1 … JZ.1) with PASS / BUG / KNOWN GAP and one line of evidence, then "Bugs found" (§6; it may say "none"), then "Not covered by G-2b" (copy §9). Open the PR into `gameplay/recovery-v1` titled `Job 16: two-manager browser journey (localhost-only emulator switch)`; body: the §4 table, the file list, the run URL, and the line "No production file changes; the switch lives in tests/ and is never deployed." Fill the Done checklist, set `State: DONE`, save `Job 16 done: Two-manager browser journey (localhost-only emulator switch)`. **You never merge.**

## 6. Tests first

Step 2's contract is the failing test, saved before the switch exists. The journey itself is the test for the UI.

When the journey finds a real app bug:

- **Privacy leak** (a rival's unfinished signing, guess or season input visible on the other page) or **scoring mismatch** (any number in §4 differs on screen): stop. Set `State: BLOCKED`, put the failing assertion, the page description the test prints (`--- daniel: …` / `--- nik: …`) and the last 30 log lines in the status file. Never mark these as today's behaviour.
- **Any other bug** (a button that does nothing, a screen that never updates, an error banner on a valid action): keep the assertion that proves it, mark it in the test with `// BUG: see JOB-16-browser-journey.md`, assert today's behaviour so CI stays green, and describe it in the report under "Bugs found": what you clicked, what you expected, what happened, which file and line you think it comes from. If the bug blocks every later section, set BLOCKED with the same evidence instead. The lead turns each bug into a job.
- Never seed Firestore, never call a provider from `page.evaluate`, never use `{force:true}`, never add SDK members to the switch to get past a bug.

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: the red CI run from step 2 (URL), failing on the new contract.
- [ ] `node tests/contracts/browser-journey-emulator-switch-contracts.cjs` PASS locally, printing `startup gzip 37493/37500`; CI `Gameplay contracts` is `(N+1)/(N+1)`; `Operations audit` 0 failures.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), including job `Two-manager browser journey` with the PASS line for J0-J12 and the `browser-journey-screens` artifact.
- [ ] J6 and J7 privacy assertions run on the rendered pages and pass; J7, J8 and J10 show exactly the §4 numbers on both pages.
- [ ] J10 Terminal Close witness, J11 stranger denial and J12 career indexes `[R1, R2]` are asserted by read-only admin reads; no admin write anywhere in the file.
- [ ] JZ: no production Firebase host contacted, production runtime/config never loaded, no page errors.
- [ ] Compare lists exactly the seven §2 code files; no file in `js/`, no `index.html`, `service-worker.js`, `firebase.json`, `*.rules`, `package*.json` change; no generated Rules or `firestore-debug.log` committed.
- [ ] Report pushed with one row per check id, "Bugs found" and "Not covered by G-2b".
- [ ] PR open into `gameplay/recovery-v1`; nothing pushed to `main`; nothing deployed. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion, the `--- daniel:` / `--- nik:` description lines and the last 30 log lines into the status file, save, and reply `Job 16 is blocked: <one line>`.

Known traps (each one cost the lead a run in the prototype):

- **"Daniel's connection code is invalid." although the code is right.** The pair panel re-renders (`replaceChildren`) while Nik's join sidecar syncs; a code typed before it settles goes into an input that is thrown away. Wait for `CareerModePersistentNikDanielPair.getState()` to be `busy:false, status:"unpaired"` before filling (Appendix C does this). The same pattern applies to every panel that re-renders: wait for the state, not for a fixed time.
- **Remote Joining overlay vanishes before you read its text.** Once the session is active the overlay can close by itself. Wait for the next real control (GET READY's "START CAREER") instead of a status sentence.
- **`Extra Google scopes are not allowed.`** `new GoogleAuthProvider()` already carries the default `profile` scope. The switch compares against a fresh provider's scopes; do not change that check.
- **Two Firebase app instances / "No Firebase App".** The npm `firebase@12.17.1` CDN files import `https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js`. The switch must import the same version (`SDK_VERSION`), and the test serves every `firebasejs/<version>/firebase-*.js` from `node_modules/firebase`. J0 fails fast if the pin and the installed package differ.
- **Rules not active.** Without a rules file the Firestore emulator allows everything. The config deliberately has no rules entry (the CLI refuses a rules path outside the config folder); the test uploads `firestore.spark.generated.rules` and J0 proves reads went from 404 to 403. Never remove that check.
- **A fixed-position overlay looks invisible to `offsetParent`.** Use computed style (Appendix C `describe`).
- **Transfer window is 15 minutes.** Both managers press "REQUEST EARLY END"; never sleep.
- **Fonts request fails** (`fonts.googleapis.com … ERR_CERT_AUTHORITY_INVALID` in some sandboxes): harmless; the test ignores `Failed to load resource` console lines.
- `firestore-debug.log` appears after emulator runs. Never commit it.

## 8a. Lead decisions (2026-10-03)

- Lead answers (2026-10-03): depends_on [2, 7, 17] is right. The scope in section 9 is accepted. A separate `browser-journey` CI job is right; do not touch the `rules-emulator` job's time limit. If JOB-08 merges first, re-append this job's registry entry and `browserJourneySwitchContract` LAST again (keep both jobs' entries). The pair-panel re-render race (a code typed while Nik's join syncs is discarded) is recorded as a separate lead bug job; here the test waits for the pairing state to settle, as written, and notes it in the report with a `// BUG` marker.

- No production hook. The switch is injected by the test with Playwright `addInitScript`; nothing in `js/` loads it. This keeps the startup budget (37,493 / 37,500) and production behaviour byte-identical. A hook inside `js/` was rejected: it would cost startup bytes and put an emulator path into the deployed app.
- The switch replaces only `window.CareerModeProductionFirebaseRuntime`. Every provider, screen and Rule above it is the production code.
- Auth: Auth emulator with a `google.com` credential, behind the same `GoogleAuthProvider` + `signInWithPopup` interface. No emulator popup widget (brittle in headless CI).
- Separate CI job `browser-journey` (25 minutes) so the `rules-emulator` job's 20-minute budget is untouched and both run in parallel.
- Career totals screens do not exist yet (G-13). This job checks the dashboard, the final screen and the career index instead.

## 9. Not covered by G-2b (the lead decides follow-ups)

Abandon through the UI, network drop and reconnect (`context.setOffline`), 5- and 10-season lengths, Career Statistics / History / Trophy Room screens (wait for G-13), closed-Showdown reads (G-8).

## Appendices (lead reference implementation)

The lead built Appendices A-F in a throwaway worktree on `gameplay/recovery-v1` at `889810f` and ran them: the contract passes (`startup gzip 37493/37500`), `npm run test:contracts` is `103/103`, `npm run test:ops` is pass 73 / fail 0, and Appendix C passed 4 consecutive runs (1 and 3 seasons) against firebase-tools 15.28.1 emulators on these ports with `@sparticuz/chromium` (`CMS_CHROMIUM_MULTI_CONTEXT=1`). Apply them exactly; if a hunk does not apply because the branch moved, re-apply by hand and say so in the Notes.

### Appendix A. `tests/browser/support/emulator-runtime-switch.js` (full file)

```js
// TEST-ONLY. Never deployed (GitHub Pages copies index.html, js/, css/, data/, assets/, acceptance/ only).
// Never referenced by any production file. Injected by tests/browser/two-manager-browser-journey.cjs
// through Playwright addInitScript. It activates ONLY when ALL of these hold:
//   location.protocol is http:, location.hostname is exactly "localhost" or "127.0.0.1",
//   query cmsEmulator=1 and cmsEmulatorUser is daniel | nik | stranger.
// Otherwise it does nothing at all, and the production runtime loads as usual.
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const ALLOWED_HOSTS=Object.freeze(["localhost","127.0.0.1"]);
  const EMULATOR_HOST="127.0.0.1";
  const PROJECT_ID="demo-cms-browser-journey";
  const SDK_VERSION="12.17.1";
  const SDK_BASE=`https://www.gstatic.com/firebasejs/${SDK_VERSION}/`;
  const USERS=Object.freeze({
    daniel:Object.freeze({sub:"browser-journey-daniel",email:"daniel@example.test",name:"Daniel"}),
    nik:Object.freeze({sub:"browser-journey-nik",email:"nik@example.test",name:"Nik"}),
    stranger:Object.freeze({sub:"browser-journey-stranger",email:"stranger@example.test",name:"Stranger"})
  });
  const BROWSER_FIRESTORE_WRITE_SCOPE="spark-private-account-device-pairing-connected-rivalry-state";

  function port(value,fallback){const n=Number(value);return Number.isInteger(n)&&n>=1024&&n<=65535?n:fallback;}

  function decide(location){
    if(!location)return Object.freeze({active:false,reason:"no-location"});
    if(location.protocol!=="http:")return Object.freeze({active:false,reason:"protocol"});
    if(!ALLOWED_HOSTS.includes(location.hostname))return Object.freeze({active:false,reason:"host"});
    let params;
    try{params=new URLSearchParams(location.search||"");}catch(_){return Object.freeze({active:false,reason:"query"});}
    if(params.get("cmsEmulator")!=="1")return Object.freeze({active:false,reason:"flag"});
    const user=params.get("cmsEmulatorUser");
    if(!Object.prototype.hasOwnProperty.call(USERS,user))return Object.freeze({active:false,reason:"user"});
    return Object.freeze({active:true,reason:"localhost-emulator",user,
      authPort:port(params.get("cmsAuthPort"),9099),firestorePort:port(params.get("cmsFirestorePort"),8080)});
  }

  function createRuntime(decision,importImpl){
    let services=null,servicesPromise=null;
    let state=Object.freeze({status:"ready",attempted:true,connected:true,emulator:true,authInitialized:false,firestoreInitialized:false,appCheckDisabled:true});
    async function ensureAccountServices(){
      if(services)return services;
      if(servicesPromise)return servicesPromise;
      servicesPromise=(async()=>{
        const [appModule,authModule,firestoreModule]=await Promise.all([
          importImpl(`${SDK_BASE}firebase-app.js`),importImpl(`${SDK_BASE}firebase-auth.js`),importImpl(`${SDK_BASE}firebase-firestore.js`)]);
        const app=appModule.initializeApp({apiKey:"demo-api-key",authDomain:`${PROJECT_ID}.firebaseapp.com`,projectId:PROJECT_ID,appId:"demo-app"},`cms-emulator-${decision.user}`);
        const auth=authModule.getAuth(app);
        authModule.connectAuthEmulator(auth,`http://${EMULATOR_HOST}:${decision.authPort}`,{disableWarnings:true});
        const firestore=firestoreModule.initializeFirestore(app,{localCache:firestoreModule.memoryLocalCache()});
        firestoreModule.connectFirestoreEmulator(firestore,EMULATOR_HOST,decision.firestorePort);
        const identity=USERS[decision.user];
        // Test-only stand-in for the Google popup: same provider class, no extra scopes, a google.com credential
        // that only the Auth emulator accepts. Production keeps the real signInWithPopup.
        async function signInWithPopup(authInstance,provider){
          if(!(provider instanceof authModule.GoogleAuthProvider))throw Object.assign(new Error("Google provider required."),{code:"auth/argument-error"});
          const defaultScopes=JSON.stringify(new authModule.GoogleAuthProvider().getScopes());
          if(JSON.stringify(provider.getScopes())!==defaultScopes)throw Object.assign(new Error("Extra Google scopes are not allowed."),{code:"auth/argument-error"});
          const credential=authModule.GoogleAuthProvider.credential(JSON.stringify({sub:identity.sub,email:identity.email,email_verified:true,name:identity.name}));
          return authModule.signInWithCredential(authInstance,credential);
        }
        services=Object.freeze({
          ok:true,auth,firestore,
          authSdk:Object.freeze({GoogleAuthProvider:authModule.GoogleAuthProvider,signInWithPopup,signOut:authModule.signOut,onAuthStateChanged:authModule.onAuthStateChanged,setPersistence:authModule.setPersistence,browserSessionPersistence:authModule.browserSessionPersistence}),
          firestoreSdk:Object.freeze({Timestamp:firestoreModule.Timestamp,serverTimestamp:firestoreModule.serverTimestamp,doc:firestoreModule.doc,runTransaction:firestoreModule.runTransaction}),
          billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
          persistentFirestoreCache:false,authPersistence:"browserSessionPersistence",provider:"google",signInFlow:"popup",
          additionalGoogleScopes:0,writeScope:BROWSER_FIRESTORE_WRITE_SCOPE
        });
        state=Object.freeze({...state,authInitialized:true,firestoreInitialized:true});
        return services;
      })().finally(()=>{servicesPromise=null;});
      return servicesPromise;
    }
    return Object.freeze({
      contractVersion:2,emulatorSwitch:true,emulatorProjectId:PROJECT_ID,
      enforcementEnabled:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
      persistentFirestoreCache:false,authPersistence:"browserSessionPersistence",provider:"google",signInFlow:"popup",additionalGoogleScopes:0,
      browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE,
      classifyContext:()=>"eligible",
      initialize:async()=>state,
      refreshAppCheckToken:async()=>Object.freeze({ok:false,code:"app-check-disabled",state}),
      ensureAccountServices,
      loadConnectedAccount:async()=>root.CareerModeSparkConnectedAccount||null,
      diagnostics:()=>state
    });
  }

  function install(location=root.location,importImpl=url=>import(url)){
    const decision=decide(location);
    if(!decision.active)return decision;
    if(root.CareerModeProductionFirebaseRuntime)return Object.freeze({active:false,reason:"runtime-already-present"});
    Object.defineProperty(root,"CareerModeProductionFirebaseRuntime",{value:createRuntime(decision,importImpl),writable:false,configurable:false});
    root.__cmsEmulatorSwitch=decision;
    return decision;
  }

  return Object.freeze({decide,install,createRuntime,projectId:PROJECT_ID,sdkVersion:SDK_VERSION,allowedHosts:ALLOWED_HOSTS});
});
```

### Appendix B. `tests/contracts/browser-journey-emulator-switch-contracts.cjs` (full file)

Blocks: 1 `decide()` truth table (13 denied URLs including github.io, https localhost, `localhost.evil.test`, `127.0.0.2`, `[::1]`, missing or wrong flag, unknown user, flag in the hash); 2 install is a no-op off localhost, `demo-` project, fixed host, never names the production project; 3 no emulator hook in any `js/` file, `index.html`, `service-worker.js`, `manifest.webmanifest`, production runtime gates unchanged; 4 Pages deploy never copies `tests/`; 5 startup bundle (same calculation as `static-app-release-contracts.cjs`) ≤ 37,500 and contains no test file; 7 emulator config; 6 services parity against the real production runtime built with a fake SDK.

```js
"use strict";
// G-2b contract: the localhost-only emulator switch can never reach production.
// No Firebase, no emulator, no browser. Runs in npm run test:contracts through the POS20 registry entry.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const zlib=require("node:zlib");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const SWITCH_PATH="tests/browser/support/emulator-runtime-switch.js";
const Switch=require(path.join(root,SWITCH_PATH));
const loc=(href)=>{const u=new URL(href);return {protocol:u.protocol,hostname:u.hostname,search:u.search};};

// 1. decide(): active only for http + exact localhost/127.0.0.1 + cmsEmulator=1 + a known test user.
const ON="?cmsEmulator=1&cmsEmulatorUser=daniel&cmsAuthPort=9199&cmsFirestorePort=8181";
assert.equal(Switch.decide(loc(`http://127.0.0.1:4173/${ON}`)).active,true,"1a localhost IP with flag activates");
assert.equal(Switch.decide(loc(`http://localhost:4173/${ON}`)).active,true,"1b localhost with flag activates");
const denied=[
  `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/${ON}`,
  `http://nikahanghojjati-oss.github.io/fifa17-career-showdown2/${ON}`,
  `https://localhost:4173/${ON}`,
  `http://localhost.evil.test/${ON}`,
  `http://127.0.0.2:4173/${ON}`,
  `http://[::1]:4173/${ON}`,
  `http://0.0.0.0:4173/${ON}`,
  "http://127.0.0.1:4173/",
  "http://127.0.0.1:4173/?cmsEmulator=1",
  "http://127.0.0.1:4173/?cmsEmulator=true&cmsEmulatorUser=daniel",
  "http://127.0.0.1:4173/?cmsEmulator=1&cmsEmulatorUser=admin",
  "http://127.0.0.1:4173/?cmsEmulatorUser=daniel",
  `http://127.0.0.1:4173/#${ON.slice(1)}`
];
for(const href of denied)assert.equal(Switch.decide(loc(href)).active,false,`1c denied: ${href}`);
assert.equal(Switch.decide(null).active,false,"1d no location");
const ports=Switch.decide(loc("http://127.0.0.1:4173/?cmsEmulator=1&cmsEmulatorUser=nik&cmsAuthPort=80&cmsFirestorePort=abc"));
assert.deepEqual([ports.authPort,ports.firestorePort],[9099,8080],"1e invalid ports fall back to emulator defaults");

// 2. install(): no-op when inactive; never replaces an existing runtime; installs a demo- project runtime when active.
{const r=Switch.install(loc("https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/"+ON));assert.equal(r.active,false);assert.equal(globalThis.CareerModeProductionFirebaseRuntime,undefined,"2a production origin installs nothing");}
assert.match(Switch.projectId,/^demo-/,"2b emulator project id starts with demo-");
const src=read(SWITCH_PATH);
assert.ok(src.includes('const EMULATOR_HOST="127.0.0.1"'),"2c emulator host is fixed to 127.0.0.1, never configurable");
assert.ok(!/fifa17-career-showdown-prod/.test(src),"2d the switch never names the production project");

// 3. The production runtime is untouched: no emulator hook anywhere in js/ or index.html, and no file references the switch.
const jsFiles=fs.readdirSync(path.join(root,"js")).filter(f=>f.endsWith(".js"));
for(const f of jsFiles){
  const text=read(`js/${f}`);
  assert.ok(!/connect(Auth|Firestore)Emulator|cmsEmulator|emulator-runtime-switch/.test(text),`3a js/${f} has no emulator hook`);
}
for(const f of ["index.html","service-worker.js","manifest.webmanifest"]){
  if(fs.existsSync(path.join(root,f)))assert.ok(!/cmsEmulator|emulator-runtime-switch|connect(Auth|Firestore)Emulator/.test(read(f)),`3b ${f} has no emulator hook`);
}
const runtime=read("js/productionFirebaseRuntime.js");
assert.ok(runtime.includes('const PRODUCTION_ORIGIN="https://nikahanghojjati-oss.github.io"'),"3c production origin gate unchanged");
assert.ok(runtime.includes("signInWithPopup:sdk.signInWithPopup")&&runtime.includes("browserSessionPersistence:sdk.browserSessionPersistence"),"3d production keeps Google popup + session persistence");
assert.ok(runtime.includes("additionalGoogleScopes:0")&&runtime.includes("enforcement:false"),"3e no extra scopes, App Check enforcement off");

// 4. The Pages artifact never contains tests/ (deploy copies an explicit list).
const deploy=read(".github/workflows/deploy-github-pages.yml");
assert.ok(/cp -R acceptance assets css data js \.pages-artifact\//.test(deploy),"4a deploy copies an explicit folder list");
assert.ok(!/cp[^\n]*\btests\b/.test(deploy),"4b deploy never copies tests/");

// 5. The startup bundle is unchanged in size class: the seven startup scripts still fit 37,500 gzip bytes.
const html=read("index.html");
const startup=[...html.matchAll(/<script defer src="(js\/[^"?]+)/g)].map(m=>m[1]);
assert.equal(startup.length,7,"5a seven startup scripts");
assert.ok(!startup.some(p=>/emulator|test/i.test(p)),"5b no test file in the startup bundle");
const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)/g)].map(m=>m[1]);
const gz=refs.reduce((n,p)=>n+zlib.gzipSync(fs.readFileSync(path.join(root,p)),{level:9}).length,0);
assert.ok(gz<=37500,`5c startup gzip ${gz} <= 37500`);

// 7. Emulator config: loopback only, alternate ports, UI off, no rules file (the harness uploads the composed Rules and proves they are active).
const cfg=JSON.parse(read("tests/browser/support/firebase.browser-journey.json"));
assert.equal(cfg.firestore,undefined,"7a no rules entry; the harness uploads firestore.spark.generated.rules");
assert.deepEqual(Object.keys(cfg.emulators).sort(),["auth","firestore","hub","logging","singleProjectMode","ui"],"7b only auth + firestore (+hub, logging)");
for(const [k,p] of [["auth",9199],["firestore",8181],["hub",4411],["logging",4511]]){assert.equal(cfg.emulators[k].host,"127.0.0.1",`7c ${k} loopback`);assert.equal(cfg.emulators[k].port,p,`7d ${k} port ${p}`);}
assert.equal(cfg.emulators.ui.enabled,false,"7e emulator UI off");
assert.ok(!/functions|hosting|storage|database|pubsub|eventarc/.test(JSON.stringify(cfg)),"7f no Functions/Hosting/other emulators");

// 6. Services shape parity: the switch hands the app exactly the production services keys (no extra SDK helpers that could mask a production bug).
(async()=>{
  const prodApi=require(path.join(root,"js/productionFirebaseRuntime.js"));
  const fakeFn=()=>({});
  const accountSdk={getAuth:fakeFn,GoogleAuthProvider:function(){},signInWithPopup:fakeFn,signOut:fakeFn,onAuthStateChanged:fakeFn,setPersistence:fakeFn,browserSessionPersistence:{},initializeFirestore:fakeFn,memoryLocalCache:fakeFn,Timestamp:{},serverTimestamp:fakeFn,doc:fakeFn,runTransaction:fakeFn};
  const context={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
  const prod=await prodApi.ensureAccountServices({context,accountSdk,baseRuntimeOptions:{context,runtimeConfig:{schemaVersion:1,configured:true,firebaseConfig:{projectId:"fifa17-career-showdown-prod"}},firebaseSdk:{initializeApp:()=>({})}}});
  assert.equal(prod.ok,true,"6a production services build with a fake SDK");
  const fakeModule={initializeApp:fakeFn,getAuth:fakeFn,connectAuthEmulator:fakeFn,GoogleAuthProvider:function(){},signInWithCredential:fakeFn,signOut:fakeFn,onAuthStateChanged:fakeFn,setPersistence:fakeFn,browserSessionPersistence:{},initializeFirestore:fakeFn,memoryLocalCache:fakeFn,connectFirestoreEmulator:fakeFn,Timestamp:{},serverTimestamp:fakeFn,doc:fakeFn,runTransaction:fakeFn};
  const shim=Switch.createRuntime(Switch.decide(loc(`http://127.0.0.1:4173/${ON}`)),async()=>fakeModule);
  const test=await shim.ensureAccountServices();
  assert.deepEqual(Object.keys(test).sort(),Object.keys(prod).sort(),"6b same top-level services keys");
  assert.deepEqual(Object.keys(test.authSdk).sort(),Object.keys(prod.authSdk).sort(),"6c same authSdk keys");
  assert.deepEqual(Object.keys(test.firestoreSdk).sort(),Object.keys(prod.firestoreSdk).sort(),"6d same firestoreSdk keys");
  for(const k of ["persistentFirestoreCache","authPersistence","provider","signInFlow","additionalGoogleScopes","writeScope","billingRequired","cloudFunctionsRequired"])assert.equal(test[k],prod[k],`6e ${k} matches production`);
  const apiKeys=Object.keys(prodApi).filter(k=>typeof prodApi[k]==="function");
  for(const k of ["initialize","ensureAccountServices","diagnostics","classifyContext","refreshAppCheckToken","loadConnectedAccount"])assert.ok(apiKeys.includes(k)&&typeof shim[k]==="function",`6f runtime method ${k} present on both`);
  console.log(`PASS browser journey emulator switch contracts: localhost+flag only, production runtime untouched, Pages excludes tests/, startup gzip ${gz}/37500, services parity.`);
})().catch(error=>{console.error(error);process.exit(1);});
```

### Appendix C. `tests/browser/two-manager-browser-journey.cjs` (J0-J3, proven; you add J4-J12 at the marker)

```js
"use strict";
// G-2b: Daniel and Nik play through the real app screens in two Chromium contexts against the
// Auth + Firestore emulators (composed production Rules). Test database only; project demo-cms-browser-journey.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/two-manager-browser-journey.cjs"
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const ROOT=path.resolve(__dirname,"../..");
const PROJECT="demo-cms-browser-journey";
const FIRESTORE="http://127.0.0.1:8181",AUTH_PORT=9199,FIRESTORE_PORT=8181;
const APP_PORT=Number(process.env.CMS_TEST_PORT||4173);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const ARTIFACTS=process.env.CMS_BROWSER_JOURNEY_ARTIFACTS||path.join(os.tmpdir(),"cms-browser-journey");
const LENGTH=Number(process.env.CMS_SHOWDOWN_LENGTH||3);
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
const ids=arr=>(arr&&arr.arrayValue&&arr.arrayValue.values||[]).map(v=>v.stringValue);

async function loadComposedRules(){
  const probe=docUrl("rivalries/probe");
  const before=await fetch(probe);
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  const after=await fetch(probe);
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal(after.status,403,`composed Rules active (open emulator read was ${before.status}, now ${after.status})`);
}

async function openManager(browser,user,viewport){
  const context=await browser.newContext({viewport});
  const log={errors:[],forbidden:[],productionRuntime:0};
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))log.productionRuntime+=1;});
  page.on("pageerror",error=>log.errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource/.test(message.text()))log.errors.push(message.text().slice(0,300));});
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {user,context,page,log};
}

async function shot(m,name){
  try{fs.mkdirSync(ARTIFACTS,{recursive:true});await m.page.screenshot({path:path.join(ARTIFACTS,`${name}-${m.user}.png`),timeout:15000});}
  catch(error){console.log(`screenshot skipped ${name}-${m.user}: ${error.message.split("\n")[0]}`);}
}
async function describe(m){
  return m.page.evaluate(()=>{
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",");
    const overlays=[...document.querySelectorAll("[id$='Overlay']")].filter(o=>{const st=getComputedStyle(o);return !o.classList.contains("hidden")&&st.display!=="none"&&st.visibility!=="hidden";}).map(o=>`${o.id}: ${o.innerText.replace(/\s+/g," ").slice(0,400)}`);
    const panel=(document.getElementById("persistentNikDanielPairPanel")?.innerText||"").replace(/\s+/g," ");
    return `screens=${screens} | badge=${document.getElementById("onlinePlayerIdentityBadge")?.textContent||""} | panel=${panel} | overlays=${overlays.join(" ## ")}`;
  });
}
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const entry=m=>m.page.locator("#productionSharedJourneyEntryOverlay");
const remote=m=>m.page.locator("#sparkRemoteJoiningOverlay, #remoteJoiningOverlay").filter({hasText:"REMOTE JOINING"}).first();
const pairPanel=m=>m.page.locator("#persistentNikDanielPairPanel");

// J1: sign in through the real gate and choose the player.
async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
}

async function main(){
  // J0 preflight
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"J0 SDK pin matches the switch");
  await loadComposedRules();ok("J0.1","composed production Rules active on the emulator (open read 404 -> 403)");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(resolve=>setTimeout(resolve,800));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[];
  try{
    const daniel=await openManager(browser,"daniel",{width:393,height:660});managers.push(daniel);
    const nik=await openManager(browser,"nik",{width:360,height:640});managers.push(nik);
    for(const m of [daniel,nik]){const s=await m.page.evaluate(()=>window.__cmsEmulatorSwitch||null);assert.equal(s&&s.active,true,`${m.user} switch active`);}
    ok("J0.2","emulator switch active only via localhost + cmsEmulator=1 in both contexts");

    // J1
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    const uidD=await accountId(daniel),uidN=await accountId(nik);
    assert.ok(uidD&&uidN&&uidD!==uidN,"two distinct accounts");
    ok("J1.1","Daniel and Nik signed in through SIGN IN WITH GOOGLE and chose their players");
    for(const uid of [uidD,uidN])assert.ok(await admin(`accounts/${uid}`),`account ${uid} bootstrapped`);
    ok("J1.2","both accounts bootstrapped and devices registered through the composed Rules");

    // J2 pairing (seasons chosen on the real create screen)
    await daniel.page.locator("#newShowdown").click();
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption(String(LENGTH));
    await daniel.page.locator("#startShowdown").click();
    await entry(daniel).getByRole("button",{name:"CONNECT PLAYERS"}).click({timeout:30000});
    await pairPanel(daniel).getByRole("button",{name:"CREATE CODE FOR NIK"}).click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const pairCode=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(pairCode,/^CMS17-pair_/,"pair code shape");
    ok("J2.1","Daniel created the pair code on the real Start screen");
    await nik.page.locator("#newShowdown").click();
    // Trap: the pair panel re-renders (replaceChildren) while the join sidecar syncs; a code typed before it settles is lost.
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(pairCode);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    for(const m of [nik,daniel]){
      if(m===daniel)await pairPanel(daniel).getByRole("button",{name:"CHECK STATUS"}).click().catch(()=>{});
      await m.page.waitForFunction(()=>/CAREER READY/.test(document.getElementById("persistentNikDanielPairPanel")?.innerText||""),null,{timeout:30000});
    }
    const linkD=await admin(`accounts/${uidD}/pairLinks/current`),linkN=await admin(`accounts/${uidN}/pairLinks/current`);
    assert.equal(field(linkD,"data","managerRole").stringValue,"playerOne","Daniel is playerOne");
    assert.equal(field(linkN,"data","managerRole").stringValue,"playerTwo","Nik is playerTwo");
    const R1=field(linkD,"data","rivalryId").stringValue;
    assert.equal(field(linkN,"data","rivalryId").stringValue,R1,"same rivalry");
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[R1],"Daniel career index [R1]");
    assert.deepEqual(ids(field(await admin(`accounts/${uidN}/careerIndex/current`),"data","rivalryIds")),[R1],"Nik career index [R1]");
    ok("J2.2","Nik joined with the code; Daniel=playerOne, Nik=playerTwo, both career indexes [R1]");
    await shot(daniel,"j2-paired");await shot(nik,"j2-paired");

    // J3 private session through the real Remote Joining surface, then START CAREER
    for(const m of [daniel,nik]){
      await pairPanel(m).getByRole("button",{name:"CONTINUE CAREER"}).first().click();
      await entry(m).filter({hasText:"CONNECTED"}).getByRole("button",{name:"CONTINUE",exact:true}).click({timeout:30000});
      await remote(m).waitFor({state:"visible",timeout:30000});
    }
    await remote(daniel).getByRole("button",{name:"HOST PRIVATE SESSION"}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>/session_[A-Za-z0-9_-]{16,}/.test(document.body.innerText),null,{timeout:30000});
    const sessionCode=await daniel.page.evaluate(()=>document.body.innerText.match(/session_[A-Za-z0-9_-]{16,}/)[0]);
    await remote(nik).getByRole("textbox",{name:"Exact private session code"}).fill(sessionCode);
    await remote(nik).getByRole("button",{name:"JOIN PRIVATE SESSION"}).click();
    // The Remote Joining overlay may close by itself once the session is active; wait for GET READY's START CAREER instead of its text.
    await entry(nik).getByRole("button",{name:"START CAREER"}).waitFor({state:"visible",timeout:30000});
    if(await remote(daniel).isVisible())await remote(daniel).getByRole("button",{name:"REFRESH / READ"}).click();
    for(const m of [daniel,nik]){
      await entry(m).getByRole("button",{name:"START CAREER"}).click({timeout:30000});
      await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
    }
    ok("J3.1","private session hosted by Daniel, joined by Nik; both reached the league wheel");
    await shot(daniel,"j3-setup");await shot(nik,"j3-setup");

    // J4..J12: added by the worker, one section per step (JOB-16 §4).

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.equal(m.log.productionRuntime,0,`${m.user} never loaded the production Firebase runtime or config`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("JZ.1","no production Firebase host, no production runtime/config load, no page errors in either context");
    console.log(`PASS two-manager browser journey: ${checks} numbered checks (J0-J3 so far) on the Auth + Firestore emulators, composed production Rules, ${LENGTH}-season Showdown.`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.user}: ${await describe(m).catch(e=>e.message)}`);console.log(`--- ${m.user} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);await shot(m,"failure");}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});
```

### Appendix D. `tests/browser/support/firebase.browser-journey.json` (full file)

```json
{
  "emulators": {
    "auth": {
      "host": "127.0.0.1",
      "port": 9199
    },
    "firestore": {
      "host": "127.0.0.1",
      "port": 8181
    },
    "hub": {
      "host": "127.0.0.1",
      "port": 4411
    },
    "logging": {
      "host": "127.0.0.1",
      "port": 4511
    },
    "ui": {
      "enabled": false
    },
    "singleProjectMode": true
  }
}
```

### Appendix E. Registry and ops test

```diff
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 14f0d17..b830894 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -532,6 +532,20 @@
         "^tests/contracts/career-index-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/browser-journey-emulator-switch-contracts.cjs",
+      "patterns": [
+        "^tests/browser/support/emulator-runtime-switch\\.js$",
+        "^tests/browser/support/firebase\\.browser-journey\\.json$",
+        "^js/[^/]+\\.js$",
+        "^index\\.html$",
+        "^service-worker\\.js$",
+        "^manifest\\.webmanifest$",
+        "^\\.github/workflows/deploy-github-pages\\.yml$",
+        "^tests/contracts/browser-journey-emulator-switch-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 346eed4..867b522 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -69,10 +69,11 @@ const sharedActiveShowdownAdapterContract='tests/contracts/shared-active-showdow
 const startJoinViewModelContract='tests/contracts/start-join-view-model-contracts.cjs';
 const sharedSeasonResultsRaceContract='tests/contracts/shared-season-results-race-contracts.cjs';
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
+const browserJourneySwitchContract='tests/contracts/browser-journey-emulator-switch-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,browserJourneySwitchContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
```

In the JSON file every regex dot is written `\\.` (one escaped backslash, as above), never `\\\\.`. The patterns are compiled with `new RegExp(...)`.

### Appendix F. CI job (append at the end of `.github/workflows/validate-gameplay-fast.yml`, under `jobs:`, after `rules-emulator`)

```yaml
  browser-journey:
    name: Two-manager browser journey
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 1
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - uses: actions/setup-java@v5
        with:
          distribution: temurin
          java-version: '21'
      - run: npm ci
      - name: Install pinned Firebase emulator test dependencies
        run: npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0
      - name: Build the composed production Rules
        run: |
          node scripts/build-production-firestore-rules.mjs
          node scripts/build-production-firestore-rules-with-persistent-pair.mjs
          node scripts/assert-firestore-zero-billing-boundary.mjs
      - name: Two-manager browser journey
        env:
          CMS_CHROMIUM_MULTI_CONTEXT: '1'
          CMS_BROWSER_JOURNEY_ARTIFACTS: ${{ runner.temp }}/browser-journey
        run: npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json --only auth,firestore --project demo-cms-browser-journey "CMS_SHOWDOWN_LENGTH=3 node tests/browser/two-manager-browser-journey.cjs"
      - name: Upload journey screenshots
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: browser-journey-screens
          path: ${{ runner.temp }}/browser-journey
          if-no-files-found: ignore
          retention-days: 7
```
