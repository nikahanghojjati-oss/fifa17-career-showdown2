# JOB-12 · Composed production Rules regression

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode for npm, node and contract runs; every Firebase emulator run happens on GitHub CI, see §2) | JOB-07 (PR #325) and JOB-08 (PR #326, merge `843e64e`) merged into `gameplay/recovery-v1`; **and JOB-10 merged** (lead decision §8a: run G-12 after G-10) | 8 | `gameplay/job-12-composed-rules-regression` | `gameplay/recovery-v1` | **yes** (you request it yourself in step 8) |

**Pace:** at most two steps (or one heavy step) per turn, save after every step, never poll CI inside a turn (push, save, stop, read once next turn), no screenshots, DEFAULT instead of stopping, text only. See WORKER_HANDBOOK "Pace rules".

## 1. Goal

Before anything reaches `main`, the lead needs one test that answers: "Are the exact Rules we will deploy, built the exact way the deploy workflow builds them, still keeping every Rule promise, and is the only difference from what production runs today the career-data changes we reviewed?" Today the answer is scattered over ten CI steps, two workflows and several heavy proofs, each of which reads whatever `firestore.spark.generated.rules` happens to be on disk at that moment (and `npm run test:contracts` silently rewrites that file). Nothing checks that what the suites test is byte-for-byte what `deploy-firestore-rules-zero-billing.yml` will publish, and nothing shows the main gate the Rules delta.

This job adds tests only:

1. **The artifact.** Compose the production Rules in a temp dir with the deploy workflow's own two build commands, and replay the deploy path in the checkout (build, pair build, the deploy's 47-line refusal gate, the deploy's 12 Rules contracts in deploy order). Both must give the same bytes (sha256 and the git blob hash the publish helper prints as `PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS`).
2. **The delta.** A reviewed allowlist fixture: the composed artifact minus the reviewed hunks must hash to what production `main` composes today (`2e0bd45`, sha256 `ce8abfe6…`). CI also composes `origin/main` with main's own scripts and checks the pin. The main gate then sees exactly the G-7, G-8 (and, after your rebase, G-10) lines and nothing else.
3. **The matrix.** One runner, inside one `emulators:exec`, runs every composed-Rules emulator suite that fast CI and the deploy workflow run (union, deduplicated: includes lifecycle 5 and 10, which only the deploy runs), two base-Rules suites redirected to the composed artifact, and a new gap suite (list and delete sweeps, private scope, pairing plus exact ACTIVE before league/club authority). It re-runs the Phase-B-ready suites on a temp copy with `cmsCareerIndexEnforced()` flipped to `true`, applies the qualified 1,000-expression gate mechanically to every log, and prints a numbered promise matrix (M1-M12).

Plain words: one test checks the exact Rules we will deploy, as built for production, against every Rule promise at once, so nothing slips at the main gate.

This job changes **no Rules behaviour, no client code, no startup file, no `index.html`, no service worker, no deploy workflow**. It does not deploy anything.

## 2. Branches and files

- The lead creates `gameplay/job-12-composed-rules-regression` from `gameplay/recovery-v1` after JOB-10 merges. If it is missing, create it yourself from `gameplay/recovery-v1`, but only if JOB-10's status is DONE and its PR is merged; if not, reply `Job 12 waits for job 10.` and stop.
- **Lane and CI path.** Work mode has Java 17 and cannot run the Firestore emulator (needs Java 21) and cannot `git push` (smoke `CAPABILITIES_WORK.md`); it does have `git` and network for `npm ci`. So: run `npm ci`, `node --check`, `npm run test:contracts`, `npm run test:ops`, `node tests/contracts/composed-production-rules-contracts.cjs` and the delta tool (`node tests/support/composed-production-rules.cjs --print-main-delta origin/main`, after `git fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main` in your clone) locally; save files through the connector (WORKER_HANDBOOK §7 Path A); read every emulator result from the "Validate Gameplay Fast" run on your **exact head commit**, job **`Composed production Rules regression`** (new in step 5; its single step's log is your test output).

Create:

- `tests/support/composed-production-rules.cjs` (Appendix A): workflow parser, temp composition, hashes, line diff, delta reverse-apply, static scans.
- `tests/contracts/composed-production-rules-contracts.cjs` (Appendix B): offline contract, registered in POS20.
- `tests/firebase/composed-rules-gap-emulator.cjs` (Appendix C): the missing emulator checks (69 numbered).
- `tests/firebase/composed-production-rules-regression.cjs` (Appendix D): the runner.
- `tests/fixtures/composed-production-rules/main-delta.json` (Appendix E): the reviewed allowlist (regenerated in step 2 after the G-10 rebase, §4.7).

Edit (and only these):

| File | Change |
| --- | --- |
| `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json` | one entry appended **last** in `tests` (Appendix F) |
| `tests/operations/pos20-control-plane.test.mjs` | one const after the last contract const, and the same name appended **last** to `expectedSupplementalContracts` (Appendix F) |
| `.github/workflows/validate-gameplay-fast.yml` | one new job `composed-rules-regression` appended at the end of the file, under `jobs:` (Appendix F). Existing jobs and steps untouched |
| `project-documents/gameplay-factory/status/JOB-12.md` on `factory/gameplay-v1` | status file |

That is eight code files. `git diff --stat origin/gameplay/recovery-v1` must list exactly these eight.

**Registry and CI ordering with jobs in flight.** Jobs 9, 10, 11, 16 and 18 also append one registry entry and one ops const; jobs 9 and 10 add a step to `rules-emulator`; job 16 adds a job at the end of the workflow. Order follows merge order: whoever merges later re-appends its own registry entry and ops const **last**, keeping every entry already there (registry order = `expectedSupplementalContracts` order; the ops test is an ordered `deepEqual`). Your CI job goes after whatever job is last when you save; job order has no meaning. Do **not** copy other jobs' steps into yours: the runner discovers every `emulators:exec` step of `rules-emulator` and of the deploy workflow by itself, so a G-9 or G-10 step merged before you is included automatically (expect one more `S` line each).

JSON registry patterns are strings compiled with `new RegExp`: a literal dot is `\\.` in the file text (one escaped backslash), never `\\\\.`.

Read first (on `gameplay/recovery-v1`; line numbers are observations at `843e64e`, re-check them):

1. `.github/workflows/deploy-firestore-rules-zero-billing.yml` (identical on `main` `2e0bd45`): `paths:` trigger list 13-28, `env:` 37-41, the 18 steps; "Build reviewed Shared Journey Rules source" 82, "Add bounded persistent pair Rules authority" 85, "Refuse generated Rules that weaken the permanent Spark boundary" 88-140 (47 `grep -Fq` lines + `assert-firestore-zero-billing-boundary.mjs`), "Prove reviewed production Rules contracts" 148-161, five emulator steps 163-177, publish 196. **Read only.**
2. `scripts/build-production-firestore-rules.mjs` (shared-only composition, writes `firestore.spark.generated.rules`), `scripts/build-production-firestore-rules-with-persistent-pair.mjs` (re-runs the first, then injects), `scripts/inject-persistent-pair-rules.mjs` (pair fragment + G-7/G-8 seams), `scripts/publish-firestore-rules-zero-billing.mjs` (publishes `FIREBASE_RULES_FILE`, prints the git blob sha1 at line 77), `scripts/assert-firestore-zero-billing-boundary.mjs`. **Read only.**
3. `.github/workflows/validate-gameplay-fast.yml` (`rules-emulator` builds both, then 8 emulator steps) and `.github/workflows/validate-pos10.yml` + `scripts/pos10-proof-runner.mjs` (POS20 heavy proofs: lifecycle 1/3/5/10 on the composed Rules; stage3/4/5 and the Rules diagnostics on other Rules files). **Read only.**
4. Every composed suite listed in §4.3, and `tests/firebase/shared-showdown-setup-production-provider-emulator.cjs` (the reviewed "redirect a suite to the composed Rules" pattern the runner's `--base-suite` mode copies). **Read only.**
5. JOB-07 §8a, JOB-08 §8a ("G-12 decides …"), lead handoff §5 G-12 row ("every denied path in C2S-005R2 §2.1 stays denied") on `leads/relay`, C2S-005R2 §2.1 on `visual/cinematic-system-v10`.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete a branch. **Never deploy Rules or Pages.** Emulator project ids start with `demo-`. The runner reads `origin/main` with `git show` only.
- Billing permanently OFF: Spark only. No Cloud Functions, no Cloud Run, no Blaze, no scheduled jobs, no server code. App Check enforcement stays off. The new contract greps the composed artifact and the deploy path for billing-dependent features; do not weaken its patterns.
- **Tests only.** Do not edit `firestore.spark.rules`, any `*.fragment.rules`, any `scripts/` file, `firebase*.json`, any `js/` file, `index.html`, `service-worker.js`, `.github/workflows/deploy-*.yml`, `validate-pos10.yml`, `CURRENT_PRODUCT_TEST_MANIFEST.json`, POS10 kernel files, SSJR/MDP ledgers, or any existing test. The only existing files you touch are the three in §2.
- **Never write the checkout's artifact by hand.** The contract composes in temp dirs only and asserts it left `firestore.spark.generated.rules` untouched. The runner's deploy-path replay (T3) is the one place that rebuilds it, with the deploy workflow's own commands. Phase B lives only in a temp copy; the checkout's artifact must stay Phase A (the runner asserts it).
- **The delta fixture is reviewed authority.** Never hand-edit hunk lines. Regenerate with the tool (§4.7), then add `owner` and `why` per hunk. A hunk owner must be one of `allowedOwners`. The contract forbids hunks that remove a non-`get` rule, add a list/delete/read/write grant that is not `if false`, add a create/update rule outside a G-7 hunk, or add any billing token.
- **Expression budget.** Firestore evaluates at most 1,000 expressions per request. The qualified gate (§7) applies to every log the runner collects; the runner enforces it as check `E1` with an explicit allowlist (career index `D13` only). Never widen `BUDGET_ALLOWED` to get green.
- Exactly two private managers: Daniel = `playerOne`, Nik = `playerTwo`. Pairing plus exact ACTIVE before league/club authority. Private scope. These are what the matrix proves; never relax a check.
- Never weaken, skip or delete an existing assertion. Nothing is skipped in the runner: a missing `origin/main`, an unparsed workflow step or a missing suite is a failure, not a skip.
- POS20 process work earns no SSJR or MDP credit. Do not touch SSJR/MDP ledgers.

## 4. What to build

### 4.1 Where the deployed bytes come from (what the lead found)

| Fact (at `843e64e`; `main` `2e0bd45` is identical for every Rules input except the pair fragment and the injector) | Consequence for this job |
| --- | --- |
| `firebase.production.rules.json` names `firestore.spark.rules`, but the deploy publishes `FIREBASE_RULES_FILE=firestore.spark.generated.rules`; the config is only checked. | Test the generated file, and pin both env names (T1, T5). |
| Deploy composition = `node scripts/build-production-firestore-rules.mjs` then `node scripts/build-production-firestore-rules-with-persistent-pair.mjs` (the second re-runs the first, then injects). | T2 composes in a temp dir with exactly the two `run:` lines parsed from the deploy workflow. |
| The deploy's "Prove reviewed production Rules contracts" step runs 12 contracts **after** the build. `shared-showdown-production-runtime-contracts.cjs` rewrites the artifact to the shared-only build (113,974 bytes); the last one, `persistent-nik-daniel-pair-contracts.cjs`, restores the full composition (131,462 bytes). The published bytes therefore depend on contract order. | T3 replays the build, gate and contract steps in deploy order and requires the byte-identical artifact. Lead probe: appending one shared-only contract after the pair contract makes T3 fail while the offline contract still passes, which is why T3 runs in CI. |
| `data/transferOptions.js` is read by the shared build but is not a deploy trigger. It only validates the catalog shape; output does not depend on it. | Copied into the temp composition (`EXTRA_COMPOSITION_INPUTS`); no action. |
| Composed artifact today: 131,462 bytes, sha256 `cdae7f5d…b38ac141`, git blob `2be6c0c5…62fb2b52f6`. Production main composes 121,492 bytes, sha256 `ce8abfe6…0426f6a78`, git blob `6fe04a8e…94c1cc65`. Shared-only builds are identical on both. | Delta = 7 hunks, -6 +204 lines, all G-7/G-8 (Appendix E). |
| The fast CI and the deploy run different emulator sets: fast CI has journey, career index A/B, completed-read; the deploy has lifecycle 5 and 10, not the newer suites. | The runner runs the union on the deploy artifact (15 suites at `843e64e`). |
| `stage3-private-pairing`, `stage4-connected-rivalry`, `stage4-idempotency-replay`, `stage4-abuse-hardening` (base Rules) **fail** on the composed artifact: their positive cases pair through `sparkPrivatePairing.createPairing` without the persistent-pair witness, which the composed Rules deny by design (`evaluation error at L2666` = rivalry create). `spark-account-bootstrap` and `stage4-mutation-rate-limit` pass unchanged. | Reuse the two that hold (`--base-suite` mode); the gap suite re-proves the stage3/4 denials (list, delete, private scope, exact ACTIVE). |
| `shared-season-commit-rules-diagnostic-emulator.cjs` prints `ACTUAL commit=FAIL:permission-denied` on both the shared-only and the full composition and exits 0; the three Rules diagnostics are non-asserting probes. | Not part of the matrix (they prove nothing either way). Reported to the lead as a pre-existing observation; do not touch them. |
| Every composed suite also passes with `cmsCareerIndexEnforced()` returning `true` (temp copy). | Phase B readiness rows B1-B8. |

### 4.2 Requirements and proofs

| # | Requirement | How | Proved by |
| --- | --- | --- | --- |
| R1 | The tested artifact is byte-identical to what the deploy would publish | temp composition with the deploy's own `run:` lines (twice, deterministic); deploy-path replay in the checkout; hash before and after every suite | T1, T2, T3, every S line (`ARTIFACT CHANGED` fails it) |
| R2 | The deploy path's own refusal gate holds | all 47 `grep -Fq` needles parsed from the workflow and checked on the artifact; count must equal the number of `grep -Fq` lines | T4 |
| R3 | No billing-dependent feature; Spark-only deploy path | deploy validators on fragments and on the whole artifact; billing-token census (only `billingRequired`, never `== true`); publish helper hosts ⊆ OAuth + `firebaserules`; production config firestore-only; deploy workflow has no functions/run/billing/`firebase deploy`/`gcloud` | T5 |
| R4 | No list, no delete, nothing unconditional | static scan of every `allow` statement; deny-all closes the file; list sweep (22) and delete sweep (19 + survival) on the emulator | T6, L1-L22, X1-X20 |
| R5 | Career index Phase A shipped, Phase B ready | exactly one constant returning `false`; Phase B differs only by the constant; suites green on a Phase B temp copy | T7, S8, S9, B1-B8 |
| R6 | Completed-only grant is get-only, on exactly four lines | counts 3/4; every `allow` mentioning `cmsCompleted…` is `get` only | T8, S10, S7 |
| R7 | Main gate sees exactly the reviewed delta | candidate minus fixture hunks == pinned main hash; live `origin/main` composition (main's own scripts) == pin and live diff == fixture; hunk semantics | T8, T9, T10 |
| R8 | Exactly two managers and roles | pair matrix, setup matrix, Terminal Close matrix, gap P6 | M1 |
| R9 | Private scope | gap V1-V17, account bootstrap, pair, career index, lifecycle, journey, completed-read | M2 |
| R10 | Pairing plus exact ACTIVE before league/club authority | gap P1-P10: the real setup provider behind a client that lies about the root; only the real root differs (pending-pair, closed/abandoned, `'ACTIVE'`, tombstoned, three accounts, rival inactive, session revoked, slot entitlement pending); control allowed | M3 |
| R11 | Abandoned, stranger, forged denials | completed-read B/D/E, pair matrix, Terminal Close, journey, gap V10-V14 | M7 |
| R12 | Terminal Close | Terminal Close matrix, lifecycle 1/3/5/10, journey | M8 |
| R13 | 1,000-expression budget, qualified | every log scanned; each occurrence must precede an allowlisted denial case | E1, M9 |
| R14 | Everything at once, nothing skipped | one runner, one `emulators:exec`, one PASS line; missing evidence fails the promise row | M1-M12, final PASS |

### 4.3 The runner's suite list (discovered, not hard-coded)

The runner parses every `emulators:exec … "<cmd>"` step of the `rules-emulator` job in `validate-gameplay-fast.yml` and of the deploy job, splits each `<cmd>` on `&&`, and deduplicates by `env + file`. At `843e64e` that is, in order:

| Id | Suite | Source |
| --- | --- | --- |
| S1 | `shared-showdown-setup-production-provider-emulator.cjs` | fast CI + deploy |
| S2 | `shared-transfer-challenge-fresh-session-emulator.cjs` | fast CI + deploy |
| S3, S4 | `shared-gameplay-provider-lifecycle-emulator.cjs` length 1, 3 | fast CI + deploy |
| S5 | `shared-terminal-close-production-provider-emulator.cjs` | fast CI + deploy |
| S6 | `persistent-nik-daniel-pair-provider-emulator.cjs` | fast CI + deploy |
| S7 | `two-manager-journey-emulator.cjs` length 3 | fast CI |
| S8, S9 | `career-index-emulator.cjs` Phase A, Phase B (`CMS_CAREER_INDEX_ENFORCED=1`, in-memory flip) | fast CI |
| S10 | `completed-showdown-read-emulator.cjs` | fast CI |
| S11, S12 | lifecycle length 5, 10 | deploy only |
| S13 | `spark-account-bootstrap-emulator.cjs` redirected to the composed artifact | G-12 base suite |
| S14 | `stage4-mutation-rate-limit-emulator.cjs` redirected to the composed artifact | G-12 base suite |
| S15 | `composed-rules-gap-emulator.cjs` | G-12 gap suite |

Phase B (temp copy, constant flipped): B1 setup, B2 transfer, B3 lifecycle 1, B4 Terminal Close, B5 pair, B6 journey, B7 completed-read, B8 gap. A suite file the runner has no label for still runs and is reported in a `NOTE` line (add its label and promise mapping, as §4.7 says for G-10).

### 4.4 Output

One `ok <n> <id> <label> :: <detail>` line per check, in this order: T1-T10, S1-S15, B1-B8, E1, M1-M12, then `LOGS <dir>` and `PASS composed production Rules regression: 46 numbered checks (T artifact identity and provenance, S 15 composed suites on the deploy artifact, B Phase B readiness, E qualified expression budget, M 12 promises) on sha256 <artifact sha256>.` (counts at `843e64e`; after your rebase onto G-10 expect at least one more S line, and more if G-9 merged first). Any failure prints `not ok …` with the last 30 log lines and ends `FAIL composed production Rules regression: k of n numbered checks failed: …`, exit 1.

### 4.5 Existing tests: what must stay untouched

Every existing test, workflow step and job stays byte-identical, including both build scripts, the injector, every fragment, the deploy workflow and every suite the runner calls. The runner only reads them. The two base suites are redirected in memory (their single `fs.readFileSync("firestore.spark.rules","utf8")` seam), exactly like the existing setup-production wrapper; the files are not edited.

### 4.6 The generated-rules trap

`npm run test:contracts` may leave `firestore.spark.generated.rules` as the shared-only build (whichever contract ran last). The new contract never reads or writes that file (it composes in temp dirs and asserts the checkout file is unchanged). The runner does not need a prebuilt artifact: T3 rebuilds it with the deploy workflow's own steps before any suite runs, and the S lines fail with `ARTIFACT CHANGED` if anything rewrites it mid-run. Never commit `firestore.spark.generated.rules`, `firestore-debug.log` or `firebase-debug.log` (the last two are not git-ignored).

### 4.7 Rebasing onto G-10 (the delta fixture and labels)

Appendix E was generated on `843e64e`, before G-10. G-10 adds a completed-only transfer read grant, so the composed artifact changes and T8 fails with `composed artifact changed since the delta was reviewed`. In step 2:

1. `git fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main`, then `node tests/support/composed-production-rules.cjs --print-main-delta origin/main > /tmp/delta.json`.
2. Build `main-delta.json` from it: keep `schemaVersion`, `purpose`, `productionMain` (from the tool, plus `"ref":"main"`), `candidate` (from the tool, `base` = `gameplay/recovery-v1 @ <head sha> (JOB-07 + JOB-08 + JOB-10 merged)`), set `allowedOwners` to `["G-7","G-8","G-7+G-8","G-10"]` (add combined owners such as `"G-8+G-10"` only if a tool hunk really mixes them), and for every tool hunk copy `mainLine`, `candidateLine`, `removed`, `added` **unchanged** and add `owner` and a one-line `why`. Hunks identical to Appendix E keep Appendix E's owner and why.
3. In the runner, add G-10's emulator suite `tests/firebase/completed-transfer-history-emulator.cjs` (JOB-10 draft name; use the merged name) to `LABELS` (`"Completed transfer history matrix (G-10)"`), to the evidence of `M6` and `M7`, and to `PHASE_B_FILES` (it must pass in Phase B; if not, BLOCKED with the log). G-10's new grant is get-only on the two transfer `allow get` lines, so T6 and the T8 hunk semantics need no change; T8's `3`/`4` counts mirror the injector's own exact-count check for `cmsCompletedShowdownReadable(rivalryId)` / `cmsCompletedSeasonReadable(rivalryId, seasonId)` and stay as they are unless the merged injector changed those two numbers (then mirror the injector and say so in the Notes).
4. In the Notes, list every new hunk with its owner, and paste the tool's `productionMain` and `candidate` lines. The lead and Codex review exactly these hunks.

If `origin/main` is no longer `2e0bd45` and composes differently (`productionMain.sha256` is not `ce8abfe6…`), stop: BLOCKED, `Job 12 is blocked: production main Rules moved to <sha>; the reviewed delta must be re-based by the lead.`

## 5. Steps

After each step update `status/JOB-12.md` on `factory/gameplay-v1` with `Job 12 step k/8: <step name>`. Save code to `gameplay/job-12-composed-rules-regression` as you go.

1. **Baseline.** Check out `gameplay/recovery-v1` (with JOB-10 merged), `npm ci`. Run `npm run test:contracts` (record `N/N`; `103/103` at `843e64e` plus one per contract merged since, e.g. G-10's) and `npm run test:ops` (record pass/fail, expected 0 failures). Record the URL of the latest green "Validate Gameplay Fast" run on `gameplay/recovery-v1`. If it is not green, set BLOCKED: `Job 12 is blocked: recovery-v1 CI is red before any change.` Write down which of jobs 9, 11, 16, 18 are merged (registry order) and whether `rules-emulator` has new steps since `843e64e`.
2. **Map and re-base the delta.** Confirm the §2 "Read first" facts and the §4.1 table on the current head (deploy step names, 47 `grep -Fq` lines, both build commands); write drift in the Notes. Create `tests/support/composed-production-rules.cjs` (Appendix A) and run §4.7 steps 1-2 to produce `tests/fixtures/composed-production-rules/main-delta.json` (Appendix E is the `843e64e` version; your hunks are Appendix E's seven plus G-10's). Record both identities (sha256, git blob, bytes) and the hunk count. If main moved (§4.7), stop.
3. **Tests first.** Create `tests/contracts/composed-production-rules-contracts.cjs` (Appendix B) and apply the registry and ops parts of Appendix F (entry last, const last). `node --check` both new files. Run the contract locally: T1-T8 and C1 pass, then it must **fail** with `AssertionError … validate-gameplay-fast.yml needs the composed-rules-regression job` (no CI job yet). Save. On CI, on your head: `Gameplay contracts` fails only on the new contract (same message); `rules-emulator` stays fully green. This red run is your tests-first evidence; link it.
4. **Emulator files.** Create `tests/firebase/composed-rules-gap-emulator.cjs` (Appendix C) and `tests/firebase/composed-production-rules-regression.cjs` (Appendix D); apply §4.7 step 3 (G-10 label and evidence). `node --check` both. Save. (The contract still fails at C2 until step 5.)
5. **CI job.** Append the `composed-rules-regression` job (Appendix F) at the end of `.github/workflows/validate-gameplay-fast.yml`. Run the contract locally: `PASS composed production Rules contracts: 10 numbered checks …`. Save. CI on your head: all three jobs green; the new job's log ends with the `PASS composed production Rules regression: …` line. If it is not green, go to §8.
6. **Full proof.** Locally: the contract PASS; `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures; `git diff --stat origin/gameplay/recovery-v1` lists exactly the eight §2 files; no generated Rules or debug logs staged. On CI, on your exact head: paste from the new job the T2, T3, T8, T9 and E1 lines, every `not ok` (there must be none), any `NOTE` line, and the final PASS line; and from `rules-emulator` the last lines of `Career index matrix` (Phase A 56, Phase B 58) and `Completed-only read matrix` (56). Then run the qualified expression-budget gate (§7) on the new job's log and record the case names.
7. **PR.** Open the PR into `gameplay/recovery-v1` titled `Job 12: composed production Rules regression`. Body: the §4.2 table, the delta summary (hunk owners and line counts, `productionMain` and `candidate` identities), the eight files, the CI run URL on the exact head, and the line "Tests only. No Rules, client, startup, index.html, service-worker or deploy-workflow change. Nothing is deployed by this PR."
8. **Codex review.** After CI is green on the exact head and the PR is open, post one PR comment that says exactly `@codex review`. Set `State: WAITING ON CODEX` in the status file and save it. When the review arrives, this is your one fix round: fix every finding that is a real bug (push, wait for green CI on the new exact head) and reply on each finding thread in one line: `fixed in <commit>` or why not. A fix that touches the runner, the support module or the fixture re-runs step 6 in full. Then fill the Done checklist and set `State: DONE`, save `Job 12 done: Composed production Rules regression`. If Codex does not answer, write that in the status file and set DONE; the lead decides. **You never merge.** The lead merges after checking the exact head (WORKER_HANDBOOK §7a).

## 6. Tests first

### 6.1 Contract test (`tests/contracts/composed-production-rules-contracts.cjs`, Appendix B)

No Firebase, no emulator, no network, no write to the checkout. Runs in `npm run test:contracts` through the registry entry. Exports `staticChecks()` so the runner prints the same T4-T8 checks.

| Id | Proves |
| --- | --- |
| T1 | deploy job has exactly the 18 reviewed step names in order; `FIREBASE_RULES_FILE` and `FIREBASE_CONFIG_FILE`; the two build `run:` lines; the publish step runs the zero-billing helper |
| T2 | composing twice in temp dirs with the deploy's own commands gives identical bytes; the checkout artifact is untouched |
| T4 | every one of the deploy gate's `grep -Fq` needles (47) is in the artifact; parsed count equals the step's `grep -Fq` count |
| T5 | deploy zero-billing validators pass on the fragments, on the whole artifact (terminal validator) and on the pair fragment (strict); only `billingRequired` tokens, never `== true`; publish hosts are OAuth/`firebaserules` only; production config is firestore-only; deploy workflow has no functions/run/billing API/`firebase deploy`/`gcloud` |
| T6 | every list/delete/read/write grant is `if false`; no unconditional grant; deny-all catch-all closes the file |
| T7 | exactly one `cmsCareerIndexEnforced()` returning `false`; the Phase B copy differs only by that constant |
| T8 | completed grant on exactly 3 + 4 call sites, get-only; career-index grants get/create/update only; artifact identity == fixture `candidate`; candidate minus hunks == fixture `productionMain` (sha256, git blob, bytes); hunk semantics (owners, why, order, no non-get removal, no non-false list/delete, create/update only in G-7, no billing) |
| C1 | `rules-emulator` builds with exactly the deploy's two commands before its first emulator step |
| C2 | job `composed-rules-regression` exists, fetches `main`, runs the runner in exactly one `emulators:exec` |
| C3 | the runner's discovered suites include every deploy and fast-CI emulator invocation, the gap suite and both base suites (each with exactly one base-Rules seam); `BUDGET_ALLOWED` is exactly career index `D13` |

### 6.2 Gap emulator test (`tests/firebase/composed-rules-gap-emulator.cjs`, Appendix C)

Composed production Rules, project `demo-cms-composed-rules-gap`. Accounts: Daniel `acct_daniel` (`playerOne`), Nik `acct_nik` (`playerTwo`), `acct_stranger`, `acct_inactive` (`deletion-requested`). Sweep rivalry `R` (active, both managers, one active session) with one seeded document of every type the Rules name (seeded with Rules disabled; denials do not depend on shape). P rivalries each differ from the control `RA` in exactly one fact. Output: one `ok <n> <id> <label>` line per check, then `PASS composed Rules gap emulator: 69 numbered checks …`.

| Ids | Check | Expect |
| --- | --- | --- |
| L1-L22 | Daniel lists: `accounts`, his `devices`, `profileLinks`, `securityEvents`, `pairLinks`, `careerIndex`; `rivalries`; `rivalries` where `authorizedAccountIds` contains him; R `sessions`, `invites`, `state`, `idempotency`, `sharedSetup`, `careerStart`, `transferChallenges`, transfer `roles`, `seasonResults`, result `roles`, `seasonCommits`; collection groups `roles`, `pairLinks`, `careerIndex` | deny |
| X1-X19 | Daniel deletes his account, device, profileLink, securityEvent, `pairLinks/current`, `careerIndex/current`; the rivalry root, session, invite, `state/authoritative`, idempotency receipt, setup, leagueProjection, careerStart, transfer, his transfer role, season results, his result role, season commit | deny |
| X20 | every swept document still exists (Rules disabled read) | assert |
| V1-V4 | Daniel gets his own account, `pairLinks/current`, `careerIndex/current`, device (controls) | allow |
| V5-V8 | Nik gets Daniel's account, `pairLinks/current`, `careerIndex/current`, device | deny |
| V9 | Daniel gets his own `pairLinks/previous` (only `current` is readable) | deny |
| V10-V14 | stranger gets R root, session, setup, a transfer role; unauthenticated gets R root | deny |
| V15-V17 | Daniel overwrites Nik's `careerIndex/current`; Daniel writes the stranger's pair link; stranger gets Nik's `pairLinks/current` | deny |
| P1 | control: paired ACTIVE root, active session; the lying client opens Shared Setup | allow (`SHARED_SETUP_OPEN`) |
| P2-P9 | same client; root `pending-pair`, `closed` without witness, `'ACTIVE'`, `tombstoned`, three authorized accounts, rival account inactive, session `revoked`, rival slot entitlement `pending` | deny (`permission-denied`) |
| P10 | no setup ledger exists on any denied root; the control has one | assert |

Lead mutation probes (temp copies of the composed artifact, not part of the job): seasonCommits `allow list, delete: if signedIn()` fails L19, X19, X20; removing the two `connectionState == active` checks fails P2, P3, P4, P10; `accounts` get for any signed-in user fails V5. The checks are not vacuous.

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] Tests-first evidence: the red CI run from step 3 (URL), `Gameplay contracts` failing only on the new contract with `validate-gameplay-fast.yml needs the composed-rules-regression job`, `rules-emulator` green.
- [ ] Delta re-based on G-10 (§4.7): hunk list with owners in the Notes; `productionMain` sha256 `ce8abfe6…` (or BLOCKED); `candidate` identity recorded.
- [ ] `node tests/contracts/composed-production-rules-contracts.cjs` PASS locally (10 numbered checks); `npm run test:contracts` is `(N+1)/(N+1)`; `npm run test:ops` 0 failures.
- [ ] "Validate Gameplay Fast" green on the exact head SHA (URL), all three jobs; the new job ends with `PASS composed production Rules regression: <n> numbered checks …` with no `not ok`; T3 git blob equals T2 git blob; T9 shows `origin/main` and the pinned sha.
- [ ] Qualified expression-budget gate (lead wording from JOB-07, unchanged): every emulator case that expects success passes; the phrase `maximum of 1000 expressions` may appear only on the log lines of cases that expect PERMISSION_DENIED. Check it mechanically: for each occurrence, the next `ok N <case>` line must be a denial case. Today the only expected occurrences are career-index `D13` (stranger cannot create an index naming a rivalry they are not in), once in Phase A and once in Phase B. Record the case name(s). If the phrase ever appears next to a case that expects success (any completed-read A/F/P allow, journey, creation, redemption, rollover or append case), that is a FAIL and BLOCKED. Do not edit any assertion to hide it. (The runner's `E1` line performs this check over every suite log, including the Phase B copies; at `843e64e` it reads `2 occurrence(s): S8/D13, S9/D13`. Paste it, and confirm it by reading the logs if `E1` ever fails.)
- [ ] No Rules, fragment, build script, injector, `js/`, `index.html`, `service-worker.js`, `firebase*.json`, deploy workflow or existing test changed; `git diff --stat` lists only the eight §2 files; no generated Rules, `firestore-debug.log` or `firebase-debug.log` committed.
- [ ] No deploy, nothing pushed to `main`, nothing written to production; the runner only reads `origin/main`.
- [ ] PR open into `gameplay/recovery-v1` with the §4.2 table, the delta summary and the tests-only line.
- [ ] Codex: `@codex review` posted after green CI; State was WAITING ON CODEX; every finding thread answered in one line (`fixed in <commit>` or why not); CI green again on the final exact head; or "Codex did not answer" recorded. State: DONE. Lead merges; you did not merge.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, save, and reply `Job 12 is blocked: <one line>`.

Known traps:

- **T8 `composed artifact changed since the delta was reviewed`.** Expected before §4.7 (G-10 changed the Rules). After §4.7 it means the fixture's `candidate` block or a hunk was copied wrong: re-run the tool and copy its hunks unchanged.
- **T8 `delta adds a list/delete grant` or `only the reviewed G-7 career index block may add write rules`.** A merged job added a Rules line outside the reviewed shape. Do not relax the contract: BLOCKED with the hunk.
- **T9 `origin/main missing`.** Locally: `git fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main`. On CI: the fetch step is missing or ran after checkout was replaced; restore Appendix F order.
- **T3 `deploy step "…" failed`.** The replay runs the deploy steps in the checkout with the workflow `env:`. Usually a missing `npm ci`. If `Prove reviewed production Rules contracts` fails there, the same contract fails in the deploy: BLOCKED.
- **T3 `the deploy path published bytes differ`.** A deploy-step contract now leaves a different artifact (§4.1 row 3). This is a real main-gate finding: BLOCKED, do not change the deploy workflow.
- **An S line fails with `ARTIFACT CHANGED`.** A suite rewrote `firestore.spark.generated.rules`. Name the suite in BLOCKED; never reorder suites to hide it.
- **P1 fails (control denied).** The seeded session or slots drifted from what `ssjrWriteAuthorityValid` requires; compare with `tests/firebase/shared-showdown-setup-provider-emulator.cjs` `seed()`. Do not change P2-P9 expectations.
- **`NOTE unmapped composed suites`.** A job merged a new `rules-emulator` step. It still ran; add its label (and promise evidence if it is G-10's).
- **C2 passes locally but CI shows no new job.** The YAML job is indented wrong (it must be two spaces under `jobs:`). The contract's parser and GitHub must agree; compare with Appendix F.
- `firestore-debug.log` and `firebase-debug.log` appear after local emulator runs. Never commit them.

### Deploy order (for the lead, not this job)

Nothing to deploy. At the main gate the lead uses this job's CI on the exact head of `gameplay/recovery-v1` as the Rules evidence, and the delta fixture as the reviewed list of Rules lines that `main` will gain. After the gated PR merges into `main`, production main composes the candidate, so T9 fails on every gameplay branch until the lead re-bases the fixture: run the tool against the new `origin/main` (expected: zero hunks, `productionMain` = `candidate`) and commit that as the new reviewed baseline in the same post-merge sync.

## 8a. Lead decisions (2026-10-03)

- **Lead confirms (2026-10-03):** this job runs after JOB-10 merges (Work lane order 11, 9, 10, 12); the lead cuts `gameplay/job-12-composed-rules-regression` from `gameplay/recovery-v1` only after JOB-10 is merged, so do not start before the board lists this job under Start now. The zero-billing deploy workflow stays unchanged in this job; the lead adds the regression step to it in the gated main PR. After the main-gate merge the lead re-bases `main-delta.json` (expected zero hunks). The extra ~4-5 min parallel CI job is accepted.
- **G-12 runs after G-10** (`depends_on: [7, 8, 10]`). Reason: the delta fixture pins the exact Rules lines `main` will gain. G-10 adds a transfer read grant; if G-12 merged first, G-10's own CI would go red on T8/T9 and G-10 would have to regenerate and get this fixture re-reviewed, coupling two Rules jobs and spending a second Codex review on the same delta. Running after G-10 writes and reviews the final pre-gate delta once. If the lead ever starts G-12 before G-10, G-10's job file must then include §4.7 (regenerate the fixture, owner `G-10`) and its Codex review covers the new hunks.
- **The deploy workflow is not edited here.** JOB-07 and JOB-08 left "does the proof join `deploy-firestore-rules-zero-billing.yml`" to G-12. Decision: not in this job (a worker never edits the production deploy path). The lead proposes, in the one gated PR into `main`, one extra deploy step that runs this runner before publishing; that PR must update `DEPLOY_STEP_NAMES` in Appendix A in the same commit (T1 pins the step list), and the runner already filters itself out of suite discovery. Until then, the regression is enforced before merge by "Validate Gameplay Fast" on the exact head.
- **Base suites:** reuse `spark-account-bootstrap` and `stage4-mutation-rate-limit` on the composed artifact; do not try to make stage3/stage4 pairing suites pass there (they assert witness-less pairing, which is correctly denied).
- **Rules diagnostics** (transfer, season results, season commit) are not in the matrix; the season-commit diagnostic's `ACTUAL=FAIL` is pre-existing on both compositions and is the lead's to investigate separately.
- **Phase B** is proved only on a temp copy. Flipping the shipped constant remains the separate later phase-B change after both managers have the new shell.
- Codex: one review, one fix round (RULES.md). After the fix round the lead decides.

## Appendices (lead reference implementation)

The lead built and ran everything below in a throwaway worktree on `gameplay/recovery-v1` at `843e64e` (Java 21, firebase-tools 15.28.1, firebase 12.17.1, @firebase/rules-unit-testing 5.0.1, firebase-admin 14.2.0, node 22; emulator on alternate ports through `firebase --config`). Results: `node tests/contracts/composed-production-rules-contracts.cjs` PASS 10 numbered checks (before the CI job existed it failed at C2 as step 3 expects); `npm run test:contracts` `104/104` (`startup 162809/37493`); `npm run test:ops` 73 pass / 0 fail; the runner inside one `emulators:exec` PASS `46 numbered checks` in 3 min 25 s on sha256 `cdae7f5def3ab133a1fe833447617b12ef94356d7e3f3cd7d1d98333b38ac141` (git blob `2be6c0c5ae10b20f2f09d253b34cd262fb2b52f6`, 131,462 bytes); T9 `origin/main 2e0bd45 sha256 ce8abfe62069 gitBlob 6fe04a8e5211629919d29a5f2940274794c1cc65`; gap suite 69/69 in Phase A and Phase B; E1 `2 occurrence(s): S8/D13, S9/D13`; no budget phrase in any other log (including all B logs). The runner also passed when started with no generated file at all. Provenance probes (temp copies): a renamed deploy step fails T1; a comment added to the pair fragment fails T8 and T9; one shared-only contract appended after the pair contract in the deploy step passes the offline contract but fails T3. Not run by the lead: GitHub CI itself (your step 3-6 runs are the first), Codex, anything after G-10 (§4.7 is yours). Apply the appendices as given; if a hunk does not apply because the branch moved, re-apply by hand and say so in the status Notes.

### Appendix A. New support module: `tests/support/composed-production-rules.cjs` (full file)

````js
'use strict';
// JOB-12 (G-12): shared helpers for the composed production Rules regression.
// Read-only: every composition here happens in a fresh temporary directory, never in the checkout.
// Used by tests/contracts/composed-production-rules-contracts.cjs (offline) and
// tests/firebase/composed-production-rules-regression.cjs (emulator matrix + deploy-path replay).
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');

const ROOT=path.resolve(__dirname,'../..');
const DEPLOY_WORKFLOW='.github/workflows/deploy-firestore-rules-zero-billing.yml';
const FAST_WORKFLOW='.github/workflows/validate-gameplay-fast.yml';
const ARTIFACT='firestore.spark.generated.rules';
const DELTA_FIXTURE='tests/fixtures/composed-production-rules/main-delta.json';
const PAIR_FRAGMENT='firestore.persistent-pair-production.fragment.rules';
// Read by build-production-firestore-rules.mjs but (correctly) not a deploy trigger: it only validates the catalog shape.
const EXTRA_COMPOSITION_INPUTS=Object.freeze(['data/transferOptions.js']);
// The deploy job's steps, in order. Any inserted, removed or reordered step must be reviewed here first,
// because a step between the build and the publish could change the bytes that reach the provider.
const DEPLOY_STEP_NAMES=Object.freeze([
  'Check out exact main source',
  'Set up Node.js 24',
  'Set up Java 21 for local Firestore emulator proof',
  'Assert permanent zero-billing deployment boundary',
  'Build reviewed Shared Journey Rules source',
  'Add bounded persistent pair Rules authority',
  'Refuse generated Rules that weaken the permanent Spark boundary',
  'Install locked repository dependencies',
  'Install pinned Firebase emulator test dependencies',
  'Prove reviewed production Rules contracts',
  'Reprove generated production Shared Setup Rules with adversarial provider matrix',
  'Prove Shared Transfer fresh-session timeout recovery',
  'Prove full shared gameplay provider lifecycle',
  'Prove r18 Terminal Close Rules with adversarial provider matrix',
  'Prove persistent Nik and Daniel pair Rules with adversarial provider matrix',
  'Authenticate permanent Firebase Rules service account',
  'Refuse missing permanent ADC credential file',
  'Compile, publish and independently read back exact Firestore Rules source'
]);
const BUILD_STEPS=Object.freeze(['Build reviewed Shared Journey Rules source','Add bounded persistent pair Rules authority']);
const GATE_STEP='Refuse generated Rules that weaken the permanent Spark boundary';
const CONTRACT_STEP='Prove reviewed production Rules contracts';
const PUBLISH_STEP='Compile, publish and independently read back exact Firestore Rules source';
// Steps the deploy-path replay executes in the checkout (environment installs and provider steps excluded).
const REPLAY_STEPS=Object.freeze([...BUILD_STEPS,GATE_STEP,CONTRACT_STEP]);

function readRepo(relative){return fs.readFileSync(path.join(ROOT,relative),'utf8');}
function sha256(text){return crypto.createHash('sha256').update(Buffer.from(text,'utf8')).digest('hex');}
// Same blob hash the publish helper prints as PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS.
function gitBlobSha1(text){
  const bytes=Buffer.from(text,'utf8');
  return crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`,'utf8')).update(bytes).digest('hex');
}
function identity(text){return {sha256:sha256(text),gitBlobSha1:gitBlobSha1(text),bytes:Buffer.byteLength(text,'utf8')};}

// Minimal parser for the two workflow files this job reads (GitHub Actions YAML subset: top-level env,
// on.push.paths, jobs.<id>.steps with name/run/uses). It throws on anything it does not understand.
function parseWorkflow(text,label){
  const lines=text.replace(/\r\n/g,'\n').split('\n');
  const result={env:{},paths:[],jobs:{}};
  let section=null,job=null,inSteps=false,stepIndent=-1,step=null,inPaths=false;
  const finishStep=()=>{if(step){job.steps.push(step);step=null;}};
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(/^\s*(#.*)?$/.test(line))continue;
    const indent=line.match(/^ */)[0].length;
    if(indent===0){finishStep();section=line.replace(/:.*$/,'').trim();job=null;inSteps=false;inPaths=false;continue;}
    if(section==='env'&&indent===2){const m=line.match(/^  ([A-Z0-9_]+):\s*(.*)$/);if(!m)throw new Error(`${label}: unparsed env line ${i+1}`);result.env[m[1]]=m[2].trim();continue;}
    if(section==='on'){
      if(/^\s+paths:\s*$/.test(line)){inPaths=true;continue;}
      if(inPaths){const m=line.match(/^\s+-\s+(.+)$/);if(m){result.paths.push(m[1].trim().replace(/^['"]|['"]$/g,''));continue;}inPaths=false;}
      continue;
    }
    if(section!=='jobs')continue;
    if(indent===2){finishStep();const m=line.match(/^  ([A-Za-z0-9_-]+):\s*$/);if(!m)throw new Error(`${label}: unparsed job line ${i+1}`);job={id:m[1],steps:[]};result.jobs[m[1]]=job;inSteps=false;continue;}
    if(!job)continue;
    if(indent===4){finishStep();inSteps=/^    steps:\s*$/.test(line);stepIndent=-1;continue;}
    if(!inSteps)continue;
    const dash=line.match(/^( *)- (.*)$/);
    if(dash&&(stepIndent<0||dash[1].length===stepIndent)){
      finishStep();stepIndent=dash[1].length;step={name:null,run:null,uses:null,line:i+1};
      i=readStepKey(lines,i,stepIndent+2,dash[2],step,label);continue;
    }
    if(step&&indent===stepIndent+2){i=readStepKey(lines,i,stepIndent+2,line.slice(indent),step,label);continue;}
    if(step&&indent>stepIndent+2)continue; // nested with:/env: values
    throw new Error(`${label}: unparsed step line ${i+1}: ${line}`);
  }
  finishStep();
  return result;
}
function readStepKey(lines,i,keyIndent,text,step,label){
  const m=text.match(/^([A-Za-z_-]+):\s*(.*)$/);
  if(!m)throw new Error(`${label}: unparsed step key at line ${i+1}`);
  const [,key,rest]=m;
  if(key==='run'&&/^[|>][-+]?\s*$/.test(rest)){
    const block=[];let j=i+1;
    for(;j<lines.length;j++){
      const l=lines[j];
      if(l.trim()===''){block.push('');continue;}
      if(l.match(/^ */)[0].length<=keyIndent)break;
      block.push(l);
    }
    const strip=Math.min(...block.filter(Boolean).map(l=>l.match(/^ */)[0].length));
    step.run=block.map(l=>l.slice(strip)).join('\n').replace(/\n+$/,'');
    return j-1;
  }
  const value=rest.trim().replace(/^(['"])(.*)\1$/,'$2');
  if(key==='name')step.name=value;
  else if(key==='run')step.run=value;
  else if(key==='uses')step.uses=value;
  return i;
}
function stepByName(job,name,label){
  const found=job.steps.filter(s=>s.name===name);
  if(found.length!==1)throw new Error(`${label}: expected exactly one step named "${name}", found ${found.length}`);
  return found[0];
}
function deployModel(text=readRepo(DEPLOY_WORKFLOW)){
  const wf=parseWorkflow(text,DEPLOY_WORKFLOW);
  const job=wf.jobs['deploy-firestore-rules'];
  if(!job)throw new Error('deploy workflow: job deploy-firestore-rules missing');
  const buildCommands=BUILD_STEPS.map(name=>{
    const run=stepByName(job,name,DEPLOY_WORKFLOW).run;
    const m=String(run).match(/^node (scripts\/[a-z0-9-]+\.mjs)$/);
    if(!m)throw new Error(`deploy workflow: build step "${name}" must be one node command, got: ${run}`);
    return m[1];
  });
  return {workflow:wf,job,buildCommands};
}

// Copy the Rules inputs (deploy trigger paths that exist + the catalog) from a source reader into a fresh
// temp dir and run the given build scripts there. Returns the artifact text. Throws if any input is missing.
function composeInTemp({readFile,inputs,buildCommands,label}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cms-g12-compose-'));
  try{
    for(const rel of inputs){
      const text=readFile(rel);
      if(text===null)continue;
      fs.mkdirSync(path.dirname(path.join(dir,rel)),{recursive:true});
      fs.writeFileSync(path.join(dir,rel),text);
    }
    if(fs.existsSync(path.join(dir,ARTIFACT)))throw new Error(`${label}: artifact must not pre-exist in the temp composition`);
    for(const script of buildCommands){
      const r=spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8'});
      if(r.status!==0)throw new Error(`${label}: ${script} failed (${r.status}): ${r.stderr||r.stdout}`);
    }
    return fs.readFileSync(path.join(dir,ARTIFACT),'utf8');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
function compositionInputs(deployPaths){
  const inputs=[...new Set([...deployPaths.filter(p=>!p.startsWith('ops/')),...EXTRA_COMPOSITION_INPUTS])];
  for(const required of ['firestore.spark.rules',PAIR_FRAGMENT,'scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs','scripts/inject-persistent-pair-rules.mjs']){
    if(!inputs.includes(required))throw new Error(`deploy trigger paths no longer include ${required}`);
  }
  return inputs;
}
function workingTreeReader(rel){const p=path.join(ROOT,rel);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;}
function gitRefReader(ref){
  return rel=>{
    const r=spawnSync('git',['show',`${ref}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
    return r.status===0?r.stdout:null;
  };
}
function gitRefExists(ref){return spawnSync('git',['rev-parse','--verify','--quiet',`${ref}^{commit}`],{cwd:ROOT,encoding:'utf8'}).status===0;}
function gitRefCommit(ref){const r=spawnSync('git',['rev-parse',`${ref}^{commit}`],{cwd:ROOT,encoding:'utf8'});return r.status===0?r.stdout.trim():null;}

// Compose the candidate exactly as the deploy workflow in this checkout would, in a temp dir.
function composeCandidate(){
  const {workflow,buildCommands}=deployModel();
  return composeInTemp({readFile:workingTreeReader,inputs:compositionInputs(workflow.paths),buildCommands,label:'candidate'});
}
// Compose production main with main's own deploy workflow, scripts and Rules sources.
function composeFromRef(ref){
  const read=gitRefReader(ref);
  const deployText=read(DEPLOY_WORKFLOW);
  if(deployText===null)throw new Error(`${ref}: deploy workflow not readable`);
  const {workflow,buildCommands}=deployModel(deployText);
  return composeInTemp({readFile:read,inputs:compositionInputs(workflow.paths),buildCommands,label:ref});
}

// The deploy job's "Refuse generated Rules..." gate, applied to an artifact: every grep -Fq "<needle>" line.
function deployGateNeedles(model=deployModel()){
  const run=stepByName(model.job,GATE_STEP,DEPLOY_WORKFLOW).run;
  const needles=[];
  for(const line of run.split('\n')){
    const m=line.match(/^grep -Fq "(.*)" "\$\{FIREBASE_RULES_FILE\}"$/);
    if(m)needles.push(m[1].replace(/\\(["\\$`])/g,'$1'));
  }
  return needles;
}

// Line diff (common prefix/suffix trimmed, LCS on the middle). Hunks are 1-based line numbers.
function diffLines(aText,bText){
  const a=aText.split('\n'),b=bText.split('\n');
  let start=0;while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  let endA=a.length,endB=b.length;while(endA>start&&endB>start&&a[endA-1]===b[endB-1]){endA--;endB--;}
  const A=a.slice(start,endA),B=b.slice(start,endB),n=A.length,m=B.length;
  if(n*m>40000000)throw new Error('diff too large to review: the composed Rules changed far beyond the allowlist');
  const L=new Uint32Array((n+1)*(m+1)),w=m+1;
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i*w+j]=A[i]===B[j]?L[(i+1)*w+j+1]+1:Math.max(L[(i+1)*w+j],L[i*w+j+1]);
  const hunks=[];let i=0,j=0,cur=null;
  const flush=()=>{if(cur){hunks.push(cur);cur=null;}};
  while(i<n||j<m){
    if(i<n&&j<m&&A[i]===B[j]){flush();i++;j++;continue;}
    if(!cur)cur={mainLine:start+i+1,candidateLine:start+j+1,removed:[],added:[]};
    if(j<m&&(i>=n||L[i*w+j+1]>=L[(i+1)*w+j])){cur.added.push(B[j]);j++;}
    else{cur.removed.push(A[i]);i++;}
  }
  flush();
  return hunks;
}
// Undo the reviewed delta on the candidate. Throws if any hunk does not match the candidate exactly.
function reverseApply(candidateText,hunks){
  const lines=candidateText.split('\n');
  for(const h of [...hunks].sort((x,y)=>y.candidateLine-x.candidateLine)){
    const at=h.candidateLine-1;
    const actual=lines.slice(at,at+h.added.length);
    if(actual.length!==h.added.length||actual.some((l,k)=>l!==h.added[k]))throw new Error(`reviewed delta hunk at candidate line ${h.candidateLine} (${h.owner}) does not match the composed artifact`);
    lines.splice(at,h.added.length,...h.removed);
  }
  return lines.join('\n');
}
function loadDelta(){return JSON.parse(readRepo(DELTA_FIXTURE));}
function sameHunks(x,y){
  if(x.length!==y.length)return false;
  return x.every((h,k)=>h.mainLine===y[k].mainLine&&h.candidateLine===y[k].candidateLine&&JSON.stringify(h.removed)===JSON.stringify(y[k].removed)&&JSON.stringify(h.added)===JSON.stringify(y[k].added));
}

// Static checks on one artifact. Returns an array of [id,label] that passed; throws on the first failure.
const BILLING_STRICT=[['Cloud Run',/cloud[\s_-]*run/i],['Cloud Functions',/cloud[\s_-]*functions/i],['Cloud Billing',/cloud[\s_-]*billing/i],['Blaze',/blaze/i],['payment',/payment/i],['purchased credits',/purchased[\s_-]*credits/i]];
function allowStatements(text){
  const out=[];const re=/allow\s+([a-z, ]+?)\s*:\s*if\s+([\s\S]*?);/g;let m;
  while((m=re.exec(text)))out.push({methods:m[1].split(',').map(s=>s.trim()),condition:m[2].replace(/\s+/g,' ').trim(),index:m.index});
  return out;
}
function assertNoBroadGrants(text,label){
  const statements=allowStatements(text);
  if(statements.length<40)throw new Error(`${label}: only ${statements.length} allow statements parsed`);
  for(const s of statements){
    if(s.methods.some(x=>['list','delete','read','write'].includes(x))&&s.condition!=='false')throw new Error(`${label}: broad or list/delete grant "${s.methods.join(', ')}: if ${s.condition}"`);
    if(/^true\b|\|\|\s*true\b/.test(s.condition))throw new Error(`${label}: unconditional grant "${s.methods.join(', ')}"`);
  }
  const last=statements[statements.length-1];
  if(!(last.methods.join(',')==='read,write'&&last.condition==='false'))throw new Error(`${label}: the last statement must be the deny-all catch-all`);
  if(!/match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}\s*\}\s*\}\s*$/.test(text))throw new Error(`${label}: catch-all deny must close the Rules`);
  return statements.length;
}
function careerIndexPhase(text){
  const off=(text.match(/function cmsCareerIndexEnforced\(\) \{\s*return false;\s*\}/g)||[]).length;
  const on=(text.match(/function cmsCareerIndexEnforced\(\) \{\s*return true;\s*\}/g)||[]).length;
  const any=(text.match(/function cmsCareerIndexEnforced\(\)/g)||[]).length;
  if(any!==1)throw new Error(`expected exactly one cmsCareerIndexEnforced(), found ${any}`);
  return off===1?'A':on===1?'B':'unknown';
}
function flipToPhaseB(text){
  const re=/function cmsCareerIndexEnforced\(\) \{\s*return false;\s*\}/g;
  if((text.match(re)||[]).length!==1)throw new Error('Phase B flip needs exactly one shipped Phase A constant');
  return text.replace(re,'function cmsCareerIndexEnforced() { return true; }');
}

module.exports=Object.freeze({
  ROOT,DEPLOY_WORKFLOW,FAST_WORKFLOW,ARTIFACT,DELTA_FIXTURE,PAIR_FRAGMENT,DEPLOY_STEP_NAMES,BUILD_STEPS,GATE_STEP,CONTRACT_STEP,PUBLISH_STEP,REPLAY_STEPS,BILLING_STRICT,
  readRepo,sha256,gitBlobSha1,identity,parseWorkflow,stepByName,deployModel,composeInTemp,compositionInputs,workingTreeReader,gitRefReader,gitRefExists,gitRefCommit,
  composeCandidate,composeFromRef,deployGateNeedles,diffLines,reverseApply,loadDelta,sameHunks,allowStatements,assertNoBroadGrants,careerIndexPhase,flipToPhaseB
});

// Lead/worker tool: node tests/support/composed-production-rules.cjs --print-main-delta <ref>
// prints the delta between <ref>'s composition and this checkout's, for review before updating the fixture.
if(require.main===module){
  const [flag,ref]=process.argv.slice(2);
  if(flag!=='--print-main-delta'||!ref){console.error('usage: --print-main-delta <git ref of production main>');process.exit(2);}
  const main=composeFromRef(ref),cand=composeCandidate();
  process.stdout.write(JSON.stringify({productionMain:{commit:gitRefCommit(ref),...identity(main)},candidate:identity(cand),hunks:diffLines(main,cand)},null,2)+'\n');
}
````

### Appendix B. New contract test: `tests/contracts/composed-production-rules-contracts.cjs` (full file; ids in §6.1)

````js
'use strict';
// JOB-12 (G-12): offline contract for the composed production Rules. No Firebase, no emulator, no network,
// no write to the checkout (every composition runs in a temp dir). The emulator half is
// tests/firebase/composed-production-rules-regression.cjs, which reuses staticChecks() below.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const h=require('../support/composed-production-rules.cjs');
const zeroBilling=import('../../scripts/assert-firestore-zero-billing-boundary.mjs');

const RUNNER='tests/firebase/composed-production-rules-regression.cjs';
const GAP='tests/firebase/composed-rules-gap-emulator.cjs';
const ALLOWED_HOSTS=new Set(['https://oauth2.googleapis.com','https://www.googleapis.com','https://firebaserules.googleapis.com']);

function staticChecks(getCandidate){
  const artifact=()=>{const c=getCandidate();assert.ok(c,'candidate artifact missing');return c;};
  return [
    ['T4','the deploy gate ("Refuse generated Rules ...", every grep -Fq line) holds on the artifact',()=>{
      const m=h.deployModel();
      const needles=h.deployGateNeedles(m);
      const greps=(h.stepByName(m.job,h.GATE_STEP,'deploy').run.match(/^grep -Fq /gm)||[]).length;
      assert.equal(needles.length,greps,'every grep -Fq line must be parsed');
      assert.ok(needles.length>=40,`only ${needles.length} gate needles`);
      const text=artifact();
      for(const needle of needles)assert.ok(text.includes(needle),`deploy gate needle missing: ${needle}`);
      return `${needles.length} needles`;
    }],
    ['T5','zero billing and a Spark-only deploy path (deploy validators, billing-token census, publish hosts, config)',async()=>{
      const zb=await zeroBilling;
      const text=artifact();
      zb.assertRepositoryZeroBillingBoundary({root:h.ROOT});
      zb.assertTerminalCloseZeroBillingSource(text,'composed artifact');
      zb.assertStrictZeroBillingSource(h.readRepo(h.PAIR_FRAGMENT),h.PAIR_FRAGMENT);
      for(const [name,re] of h.BILLING_STRICT)assert.ok(!re.test(text),`artifact mentions ${name}`);
      const tokens=text.match(/[A-Za-z_]*billing[A-Za-z_]*/gi)||[];
      assert.ok(tokens.length>0&&tokens.every(t=>t==='billingRequired'),`billing tokens other than billingRequired: ${tokens.join(', ')}`);
      assert.ok(!/billingRequired\s*==\s*true/.test(text),'billingRequired == true');
      const hosts=new Set(h.readRepo('scripts/publish-firestore-rules-zero-billing.mjs').match(/https:\/\/[a-z0-9.-]+/g));
      for(const host of hosts)assert.ok(ALLOWED_HOSTS.has(host),`publish helper calls ${host}`);
      const cfg=JSON.parse(h.readRepo('firebase.production.rules.json'));
      assert.deepEqual(Object.keys(cfg).filter(k=>k!=='$schema'),['firestore']);
      assert.deepEqual(cfg.firestore,{rules:'firestore.spark.rules'});
      const deployText=h.readRepo(h.DEPLOY_WORKFLOW).split('\n').filter(l=>!/^\s*#/.test(l)).join('\n');
      for(const re of [/cloudfunctions/i,/run\.googleapis/i,/cloudbilling/i,/firebase deploy/i,/gcloud /i,/functions:/i])assert.ok(!re.test(deployText),`deploy workflow uses ${re}`);
      return `${tokens.length} billingRequired token(s), hosts ${[...hosts].join(' ')}`;
    }],
    ['T6','no broad grant: every list/delete/read/write is "if false", nothing is unconditional, deny-all closes the Rules',()=>`${h.assertNoBroadGrants(artifact(),'composed artifact')} allow statements`],
    ['T7','career index Phase A is shipped; Phase B is exactly a one-line constant flip',()=>{
      const text=artifact();
      assert.equal(h.careerIndexPhase(text),'A');
      const b=h.flipToPhaseB(text);
      assert.equal(h.careerIndexPhase(b),'B');
      const mark='/*CMS_CAREER_INDEX_ENFORCED*/';
      assert.equal(text.replace(/function cmsCareerIndexEnforced\(\) \{\s*return false;\s*\}/,mark),b.replace('function cmsCareerIndexEnforced() { return true; }',mark),'Phase B differs from Phase A only in the constant');
      return 'Phase A';
    }],
    ['T8','completed-only grant is get-only on exactly four lines, and candidate minus the reviewed delta is production main',()=>{
      const text=artifact();
      assert.equal((text.match(/cmsCompletedShowdownReadable\(rivalryId\)/g)||[]).length,3);
      assert.equal((text.match(/cmsCompletedSeasonReadable\(rivalryId, seasonId\)/g)||[]).length,4);
      for(const s of h.allowStatements(text)){
        if(/cmsCompleted/.test(s.condition))assert.deepEqual(s.methods,['get'],`completed grant on ${s.methods.join(',')}`);
        if(/cmsCareerIndex/.test(s.condition))assert.ok(s.methods.every(x=>['get','create','update'].includes(x)),`career index grant on ${s.methods.join(',')}`);
      }
      const delta=h.loadDelta();
      assert.equal(delta.schemaVersion,1);
      const cand=h.identity(text);
      assert.equal(cand.sha256,delta.candidate.sha256,'composed artifact changed since the delta was reviewed: regenerate with --print-main-delta and review');
      const main=h.identity(h.reverseApply(text,delta.hunks));
      assert.deepEqual({sha256:main.sha256,gitBlobSha1:main.gitBlobSha1,bytes:main.bytes},{sha256:delta.productionMain.sha256,gitBlobSha1:delta.productionMain.gitBlobSha1,bytes:delta.productionMain.bytes});
      let last=0;
      for(const hunk of delta.hunks){
        assert.ok(delta.allowedOwners.includes(hunk.owner),`hunk owner ${hunk.owner}`);
        assert.ok(typeof hunk.why==='string'&&hunk.why.length>20,'every hunk says why');
        assert.ok(hunk.candidateLine>last,'hunks ascend');last=hunk.candidateLine+hunk.added.length-1;
        for(const line of hunk.removed)assert.ok(!/allow\s+(create|update|list|delete|read|write)/.test(line),`delta removes a non-get rule: ${line}`);
        for(const line of hunk.added){
          for(const [name,re] of h.BILLING_STRICT)assert.ok(!re.test(line),`delta adds ${name}`);
          assert.ok(!/billing/i.test(line),'delta adds a billing token');
          const m=line.match(/allow\s+([a-z, ]+?)\s*:/);
          if(!m)continue;
          const methods=m[1].split(',').map(x=>x.trim());
          if(methods.some(x=>['list','delete','read','write'].includes(x)))assert.ok(/:\s*if false;\s*$/.test(line),`delta adds a list/delete grant: ${line}`);
          if(methods.some(x=>['create','update'].includes(x)))assert.ok(hunk.owner.split('+').includes('G-7'),`only the reviewed G-7 career index block may add write rules: ${line}`);
        }
      }
      return `${delta.hunks.length} hunks, -${delta.hunks.reduce((a,x)=>a+x.removed.length,0)} +${delta.hunks.reduce((a,x)=>a+x.added.length,0)} lines vs main ${delta.productionMain.commit.slice(0,7)}`;
    }]
  ];
}
module.exports=Object.freeze({staticChecks});

async function run(){
  let n=0;
  const ok=(id,label,detail)=>{n+=1;process.stdout.write(`ok ${n} ${id} ${label}${detail?` :: ${detail}`:''}\n`);};
  let candidate=null;
  const m=h.deployModel();
  assert.deepEqual(m.job.steps.map(s=>s.name),[...h.DEPLOY_STEP_NAMES],'deploy workflow steps changed: review before updating DEPLOY_STEP_NAMES');
  assert.equal(m.workflow.env.FIREBASE_RULES_FILE,h.ARTIFACT);
  assert.equal(m.workflow.env.FIREBASE_CONFIG_FILE,'firebase.production.rules.json');
  assert.deepEqual(m.buildCommands,['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']);
  assert.equal(h.stepByName(m.job,h.PUBLISH_STEP,'deploy').run,'node scripts/publish-firestore-rules-zero-billing.mjs');
  ok('T1','deploy workflow steps, env and build commands are the reviewed ones',`${m.job.steps.length} steps`);
  const before=fs.existsSync(path.join(h.ROOT,h.ARTIFACT))?fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),'utf8'):null;
  const a=h.composeCandidate(),b=h.composeCandidate();
  assert.equal(a,b,'composition must be deterministic');
  const after=fs.existsSync(path.join(h.ROOT,h.ARTIFACT))?fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),'utf8'):null;
  assert.equal(after,before,'the contract must not touch the checkout artifact');
  candidate=a;
  const id=h.identity(a);
  ok('T2','temp composition with the deploy workflow\'s own build commands is deterministic',`sha256 ${id.sha256} gitBlob ${id.gitBlobSha1} ${id.bytes} bytes`);
  for(const [cid,label,fn] of staticChecks(()=>candidate))ok(cid,label,await fn());

  const fast=h.parseWorkflow(h.readRepo(h.FAST_WORKFLOW),h.FAST_WORKFLOW);
  const rules=fast.jobs['rules-emulator'];
  assert.ok(rules,'rules-emulator job');
  const buildIdx=rules.steps.findIndex(s=>s.name==='Build the composed production Rules');
  const firstEmu=rules.steps.findIndex(s=>/emulators:exec/.test(s.run||''));
  assert.ok(buildIdx>=0&&buildIdx<firstEmu,'rules-emulator builds before its first emulator step');
  assert.deepEqual(rules.steps[buildIdx].run.split('\n').filter(l=>/^node scripts\/build-/.test(l)),m.buildCommands.map(c=>`node ${c}`));
  ok('C1','fast CI rules-emulator composes with exactly the deploy workflow\'s build commands before any emulator step');

  const job=fast.jobs['composed-rules-regression'];
  assert.ok(job,'validate-gameplay-fast.yml needs the composed-rules-regression job');
  const runs=job.steps.map(s=>s.run||'').join('\n');
  assert.ok(/git fetch --no-tags --depth=1 origin \+refs\/heads\/main:refs\/remotes\/origin\/main/.test(runs),'job fetches production main');
  const emu=job.steps.filter(s=>/emulators:exec/.test(s.run||''));
  assert.equal(emu.length,1,'one emulators:exec runs the whole matrix');
  assert.ok(emu[0].run.endsWith(`"node ${RUNNER}"`),`the step runs ${RUNNER}`);
  ok('C2','fast CI has one composed-rules-regression job: fetch main, run the whole matrix in one emulators:exec');

  const runner=require(`../../${RUNNER}`);
  const suites=runner.discoverSuites();
  const files=new Set(suites.map(s=>`${s.envs} ${s.file}`.trim()));
  const deploySuites=runner.suitesFromSteps(m.job.steps,'deploy');
  const fastSuites=runner.suitesFromSteps(rules.steps,'fast CI');
  assert.ok(deploySuites.length>=5&&fastSuites.length>=8,'suite discovery parsed the workflows');
  for(const s of [...deploySuites,...fastSuites])assert.ok(files.has(`${s.envs} ${s.file}`.trim()),`regression must run ${s.envs} ${s.file}`);
  assert.ok(suites.some(s=>s.file===GAP),'gap suite runs');
  for(const base of runner.BASE_SUITES){
    const src=h.readRepo(base);
    assert.equal((src.match(/fs\.readFileSync\(["']firestore\.spark\.rules["'],\s*["']utf8["']\)/g)||[]).length,1,`${base} exposes one base-Rules seam`);
  }
  assert.deepEqual(runner.BUDGET_ALLOWED.map(x=>`${x.file}#${x.caseId}`),['tests/firebase/career-index-emulator.cjs#D13']);
  ok('C3','the regression runs every deploy and fast-CI emulator proof, both base suites and the gap suite',`${suites.length} suites`);

  process.stdout.write(`PASS composed production Rules contracts: ${n} numbered checks (deploy workflow, deterministic composition ${id.sha256.slice(0,12)}, deploy gate, zero billing, no broad grants, career index Phase A, reviewed delta from production main, CI wiring).\n`);
}
if(require.main===module)run().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
````

### Appendix C. New gap emulator test: `tests/firebase/composed-rules-gap-emulator.cjs` (full file; ids in §6.2)

````js
"use strict";
// JOB-12 (G-12): the composed-Rules checks no existing suite makes against the COMPOSED production Rules
// (firestore.spark.generated.rules built by BOTH scripts). One `ok <n> <id> <label>` line per check.
//   L  list/query denial sweep over every collection the Rules name
//   X  delete denial sweep over every document type the Rules name
//   V  private scope: own-account documents, rival and stranger denials
//   P  pairing plus exact ACTIVE before league/club authority (a modified client that lies about the root)
// Run by tests/firebase/composed-production-rules-regression.cjs, or alone inside emulators:exec.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,deleteDoc,getDocs,collection,collectionGroup,query,where,limit,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.localStorage={getItem(){throw new Error("no localStorage");},setItem(){throw new Error("no localStorage");},removeItem(){throw new Error("no localStorage");}};
const setupProvider=require("../../js/sparkSharedShowdownSetup.js");

const PROJECT_ID=process.env.CMS_GAP_PROJECT_ID||"demo-cms-composed-rules-gap";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
assert.ok(RULES.includes("match /accounts/{accountId}/pairLinks/{pairId}")&&RULES.includes("match /accounts/{accountId}/careerIndex/{indexId}"),"composed Rules must carry the persistent pair and career index authority (rebuild BOTH scripts)");

const D="acct_daniel",N="acct_nik",X="acct_stranger",I="acct_inactive";
const DD=`device_${"d".repeat(32)}`,DN=`device_${"e".repeat(32)}`,DX=`device_${"f".repeat(32)}`;
const PD=`profile_${"1".repeat(24)}`,PN=`profile_${"2".repeat(24)}`,SD=`save_${"1".repeat(24)}`,SN=`save_${"2".repeat(24)}`;
const rid=c=>`pair_${c.repeat(64)}`;
const S=`session_${"5".repeat(64)}`;
const R=rid("a");                       // sweep rivalry (active, Daniel + Nik)
const RA=rid("b"),RP=rid("c"),RC=rid("d"),RU=rid("e"),RT=rid("f"),RX=rid("1"),RI=rid("2"),RS=rid("3"),RE=rid("4");
const T="season_1";

function account(id,status="active"){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status}};}
function device(id,state="active"){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state}};}
function slot(role,accountId,entitlementState="active"){return {slotId:role,accountId,profileId:role==="playerOne"?PD:PN,saveId:role==="playerOne"?SD:SN,entitlementState};}
function rivalry(id,{connectionState="active",lifecycleState="live",authorized=[D,N],slots=[slot("playerOne",D),slot("playerTwo",N)]}={}){
  return {objectType:"rivalry",objectId:id,lifecycleState,data:{connectionState,authorizedAccountIds:authorized,managerSlots:slots}};
}
function session(id,rivalryId,{state="active",members=[D,N],host=D,expiresAtMs}){
  const expiresAt=Timestamp.fromMillis(expiresAtMs);
  return {schemaVersion:1,objectType:"session",objectId:id,revision:1,parentRevision:0,lifecycleState:"live",
    contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,
    updatedAt:Timestamp.fromMillis(expiresAtMs-60000),updatedByAccountId:host,updatedByDeviceId:host===D?DD:DN,
    data:{rivalryId,state,hostAccountId:host,memberAccountIds:members,createdAt:Timestamp.fromMillis(expiresAtMs-300000),expiresAt,lastActivityAt:Timestamp.fromMillis(expiresAtMs-60000),revokedAt:null},tombstone:null};
}
const plain=label=>({objectType:"g12",label});

let n=0;
const failures=[];
async function check(id,label,promise){
  n+=1;
  try{await promise;process.stdout.write(`ok ${n} ${id} ${label}\n`);}
  catch(error){failures.push(id);process.stdout.write(`not ok ${n} ${id} ${label}: ${String(error&&error.message||error).split("\n")[0]}\n`);}
}

// A modified client: the real setup provider, but every transaction read of the root, the actor's account and
// the session is rewritten to look like a healthy paired ACTIVE Showdown. Only Rules can still say no.
function lyingSdk(){
  const patch=(path,value)=>{
    if(!value)return value;
    if(/^rivalries\/[^/]+$/.test(path))return {...value,lifecycleState:"live",data:{...value.data,connectionState:"active",authorizedAccountIds:[D,N],managerSlots:[slot("playerOne",D),slot("playerTwo",N)]}};
    if(/^rivalries\/[^/]+\/sessions\/[^/]+$/.test(path))return {...value,data:{...value.data,state:"active",memberAccountIds:[D,N]}};
    return value;
  };
  return {
    Timestamp,doc,serverTimestamp,
    runTransaction:(db,fn)=>firestoreSdk.runTransaction(db,tx=>fn({
      get:async ref=>{const snap=await tx.get(ref);if(!snap.exists())return snap;const data=patch(ref.path,snap.data());return {id:snap.id,ref:snap.ref,exists:()=>true,data:()=>data};},
      set:(...a)=>tx.set(...a),update:(...a)=>tx.update(...a),delete:(...a)=>tx.delete(...a)
    }))
  };
}
let opSeed=0;
async function openSetup(db,rivalryId,now){
  opSeed+=1;
  return setupProvider.mutate({user:{uid:D},firestore:db,firebaseSdk:lyingSdk(),deviceId:DD,rivalryId,sessionId:S,nowEpochMs:now,type:"open",baseRevision:0,
    operationId:`setup_op_${String(opSeed).repeat(32).slice(0,32)}`,cryptoImpl:crypto.webcrypto});
}
async function expectOpen(db,rivalryId,now,allowed){
  const result=await openSetup(db,rivalryId,now);
  if(allowed){assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.state.phase,"SHARED_SETUP_OPEN");}
  else{assert.equal(result.ok,false,"Rules must deny the forged open");assert.equal(result.code,"permission-denied",JSON.stringify(result));}
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    const now=Date.now();
    const future=now+10*60*1000;
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      for(const id of [D,N,X])await setDoc(doc(db,"accounts",id),account(id));
      await setDoc(doc(db,"accounts",I),account(I,"deletion-requested"));
      await setDoc(doc(db,"accounts",D,"devices",DD),device(DD));
      await setDoc(doc(db,"accounts",N,"devices",DN),device(DN));
      await setDoc(doc(db,"accounts",X,"devices",DX),device(DX));
      await setDoc(doc(db,"accounts",D,"profileLinks",PD),plain("profileLink"));
      await setDoc(doc(db,"accounts",D,"securityEvents","event_1"),plain("securityEvent"));
      await setDoc(doc(db,"accounts",D,"pairLinks","current"),plain("pairLink"));
      await setDoc(doc(db,"accounts",D,"pairLinks","previous"),plain("pairLink-not-current"));
      await setDoc(doc(db,"accounts",D,"careerIndex","current"),plain("careerIndex"));
      await setDoc(doc(db,"accounts",N,"pairLinks","current"),plain("pairLink"));
      await setDoc(doc(db,"accounts",N,"careerIndex","current"),plain("careerIndex"));
      await setDoc(doc(db,"rivalries",R),rivalry(R));
      await setDoc(doc(db,"rivalries",R,"sessions",S),session(S,R,{expiresAtMs:future}));
      await setDoc(doc(db,"rivalries",R,"invites",R),plain("invite"));
      await setDoc(doc(db,"rivalries",R,"state","authoritative"),plain("state"));
      await setDoc(doc(db,"rivalries",R,"state","authoritative","idempotency","k_1"),plain("idempotency"));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","authoritative"),plain("setup"));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","leagueProjection"),plain("leagueProjection"));
      await setDoc(doc(db,"rivalries",R,"careerStart","authoritative"),plain("careerStart"));
      await setDoc(doc(db,"rivalries",R,"transferChallenges",T),plain("transfer"));
      await setDoc(doc(db,"rivalries",R,"transferChallenges",T,"roles","playerOne"),plain("transferRole"));
      await setDoc(doc(db,"rivalries",R,"seasonResults",T),plain("results"));
      await setDoc(doc(db,"rivalries",R,"seasonResults",T,"roles","playerOne"),plain("resultsRole"));
      await setDoc(doc(db,"rivalries",R,"seasonCommits",T),plain("commit"));
      // P rivalries: each differs from the RA control in exactly one fact.
      const p=[[RA,{}],[RP,{connectionState:"pending-pair"}],[RC,{connectionState:"closed"}],[RU,{connectionState:"ACTIVE"}],[RT,{lifecycleState:"tombstoned"}],
        [RX,{authorized:[D,N,X]}],[RI,{authorized:[D,I],slots:[slot("playerOne",D),slot("playerTwo",I)]}],[RS,{}],[RE,{slots:[slot("playerOne",D),slot("playerTwo",N,"pending")]}]];
      for(const [id,shape] of p){
        await setDoc(doc(db,"rivalries",id),rivalry(id,shape));
        const members=id===RI?[D,I]:[D,N];
        await setDoc(doc(db,"rivalries",id,"sessions",S),session(S,id,{expiresAtMs:future,members,state:id===RS?"revoked":"active"}));
      }
    });
    const dbD=env.authenticatedContext(D).firestore();
    const dbN=env.authenticatedContext(N).firestore();
    const dbX=env.authenticatedContext(X).firestore();
    const dbU=env.unauthenticatedContext().firestore();
    const r=(...p)=>doc(dbD,"rivalries",R,...p);

    // L: list and query denial for Daniel (owner of his account, member of the active rivalry R).
    const lists=[
      ["L1","accounts",collection(dbD,"accounts")],
      ["L2","own devices",collection(dbD,"accounts",D,"devices")],
      ["L3","own profileLinks",collection(dbD,"accounts",D,"profileLinks")],
      ["L4","own securityEvents",collection(dbD,"accounts",D,"securityEvents")],
      ["L5","own pairLinks",collection(dbD,"accounts",D,"pairLinks")],
      ["L6","own careerIndex",collection(dbD,"accounts",D,"careerIndex")],
      ["L7","rivalries",collection(dbD,"rivalries")],
      ["L8","rivalries where authorizedAccountIds contains Daniel",query(collection(dbD,"rivalries"),where("data.authorizedAccountIds","array-contains",D),limit(5))],
      ["L9","R sessions",collection(dbD,"rivalries",R,"sessions")],
      ["L10","R invites",collection(dbD,"rivalries",R,"invites")],
      ["L11","R state",collection(dbD,"rivalries",R,"state")],
      ["L12","R idempotency",collection(dbD,"rivalries",R,"state","authoritative","idempotency")],
      ["L13","R sharedSetup",collection(dbD,"rivalries",R,"sharedSetup")],
      ["L14","R careerStart",collection(dbD,"rivalries",R,"careerStart")],
      ["L15","R transferChallenges",collection(dbD,"rivalries",R,"transferChallenges")],
      ["L16","R transfer roles",collection(dbD,"rivalries",R,"transferChallenges",T,"roles")],
      ["L17","R seasonResults",collection(dbD,"rivalries",R,"seasonResults")],
      ["L18","R result roles",collection(dbD,"rivalries",R,"seasonResults",T,"roles")],
      ["L19","R seasonCommits",collection(dbD,"rivalries",R,"seasonCommits")],
      ["L20","collection group roles",collectionGroup(dbD,"roles")],
      ["L21","collection group pairLinks",collectionGroup(dbD,"pairLinks")],
      ["L22","collection group careerIndex",collectionGroup(dbD,"careerIndex")]
    ];
    for(const [id,label,ref] of lists)await check(id,`Daniel cannot list ${label}`,assertFails(getDocs(ref)));

    // X: delete denial for the owner/member on every document type, then prove nothing was removed.
    const deletes=[
      ["X1","his account",doc(dbD,"accounts",D)],["X2","his device",doc(dbD,"accounts",D,"devices",DD)],
      ["X3","his profileLink",doc(dbD,"accounts",D,"profileLinks",PD)],["X4","his securityEvent",doc(dbD,"accounts",D,"securityEvents","event_1")],
      ["X5","his pairLinks/current",doc(dbD,"accounts",D,"pairLinks","current")],["X6","his careerIndex/current",doc(dbD,"accounts",D,"careerIndex","current")],
      ["X7","the rivalry root",r()],["X8","the session",r("sessions",S)],["X9","the invite",r("invites",R)],
      ["X10","state/authoritative",r("state","authoritative")],["X11","an idempotency receipt",r("state","authoritative","idempotency","k_1")],
      ["X12","sharedSetup/authoritative",r("sharedSetup","authoritative")],["X13","sharedSetup/leagueProjection",r("sharedSetup","leagueProjection")],
      ["X14","careerStart/authoritative",r("careerStart","authoritative")],["X15","the transfer challenge",r("transferChallenges",T)],
      ["X16","his transfer role",r("transferChallenges",T,"roles","playerOne")],["X17","season results",r("seasonResults",T)],
      ["X18","his result role",r("seasonResults",T,"roles","playerOne")],["X19","the season commit",r("seasonCommits",T)]
    ];
    for(const [id,label,ref] of deletes)await check(id,`Daniel cannot delete ${label}`,assertFails(deleteDoc(ref)));
    await check("X20","every swept document still exists (read with Rules disabled)",env.withSecurityRulesDisabled(async context=>{
      for(const [,,ref] of deletes){const snap=await getDoc(doc(context.firestore(),ref.path));assert.ok(snap.exists(),`${ref.path} was deleted`);}
    }));

    // V: private scope.
    await check("V1","Daniel gets his own account (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D))));
    await check("V2","Daniel gets his own pairLinks/current (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D,"pairLinks","current"))));
    await check("V3","Daniel gets his own careerIndex/current (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D,"careerIndex","current"))));
    await check("V4","Daniel gets his own device (control)",assertSucceeds(getDoc(doc(dbD,"accounts",D,"devices",DD))));
    await check("V5","Nik cannot get Daniel's account",assertFails(getDoc(doc(dbN,"accounts",D))));
    await check("V6","Nik cannot get Daniel's pairLinks/current",assertFails(getDoc(doc(dbN,"accounts",D,"pairLinks","current"))));
    await check("V7","Nik cannot get Daniel's careerIndex/current",assertFails(getDoc(doc(dbN,"accounts",D,"careerIndex","current"))));
    await check("V8","Nik cannot get Daniel's device",assertFails(getDoc(doc(dbN,"accounts",D,"devices",DD))));
    await check("V9","Daniel cannot get his own pairLinks/previous (only current is readable)",assertFails(getDoc(doc(dbD,"accounts",D,"pairLinks","previous"))));
    await check("V10","stranger cannot get the rivalry root",assertFails(getDoc(doc(dbX,"rivalries",R))));
    await check("V11","stranger cannot get the session",assertFails(getDoc(doc(dbX,"rivalries",R,"sessions",S))));
    await check("V12","stranger cannot get sharedSetup/authoritative",assertFails(getDoc(doc(dbX,"rivalries",R,"sharedSetup","authoritative"))));
    await check("V13","stranger cannot get a transfer role",assertFails(getDoc(doc(dbX,"rivalries",R,"transferChallenges",T,"roles","playerOne"))));
    await check("V14","unauthenticated cannot get the rivalry root",assertFails(getDoc(doc(dbU,"rivalries",R))));
    await check("V15","Daniel cannot overwrite Nik's careerIndex/current",assertFails(setDoc(doc(dbD,"accounts",N,"careerIndex","current"),plain("forged"))));
    await check("V16","Daniel cannot write a pair link for the stranger",assertFails(setDoc(doc(dbD,"accounts",X,"pairLinks","current"),plain("forged"))));
    await check("V17","stranger cannot get Nik's pairLinks/current",assertFails(getDoc(doc(dbX,"accounts",N,"pairLinks","current"))));

    // P: pairing plus exact ACTIVE before league/club authority. Same modified client every time; only the real root differs.
    await check("P1","control: paired ACTIVE root, active session: the forged-client open is accepted",expectOpen(dbD,RA,now,true));
    await check("P2","root still pending-pair: open denied",expectOpen(dbD,RP,now,false));
    await check("P3","root closed without a witness (abandoned): open denied",expectOpen(dbD,RC,now,false));
    await check("P4","root connectionState 'ACTIVE' (not exact): open denied",expectOpen(dbD,RU,now,false));
    await check("P5","root lifecycleState tombstoned: open denied",expectOpen(dbD,RT,now,false));
    await check("P6","three authorized accounts: open denied",expectOpen(dbD,RX,now,false));
    await check("P7","rival account not active: open denied",expectOpen(dbD,RI,now,false));
    await check("P8","session revoked: open denied",expectOpen(dbD,RS,now,false));
    await check("P9","rival slot entitlement not active: open denied",expectOpen(dbD,RE,now,false));
    await check("P10","no setup ledger exists on any denied root (Rules disabled read)",env.withSecurityRulesDisabled(async context=>{
      for(const id of [RP,RC,RU,RT,RX,RI,RS,RE])assert.equal((await getDoc(doc(context.firestore(),"rivalries",id,"sharedSetup","authoritative"))).exists(),false,id);
      assert.equal((await getDoc(doc(context.firestore(),"rivalries",RA,"sharedSetup","authoritative"))).exists(),true,"control ledger");
    }));
  }finally{await env.cleanup();}
  if(failures.length){process.stdout.write(`FAIL composed Rules gap emulator: ${failures.length} of ${n} checks failed: ${failures.join(", ")}\n`);process.exit(1);}
  process.stdout.write(`PASS composed Rules gap emulator: ${n} numbered checks (L list sweep, X delete sweep, V private scope, P pairing plus exact ACTIVE before league/club authority).\n`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
````

### Appendix D. New runner: `tests/firebase/composed-production-rules-regression.cjs` (full file; output in §4.4)

````js
"use strict";
// JOB-12 (G-12): composed production Rules regression. Run inside ONE emulators:exec (firestore only):
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-composed \
//     "node tests/firebase/composed-production-rules-regression.cjs"
// It (T) proves the artifact every suite reads is byte-identical to what the deploy workflow would publish and
// differs from production main only by the reviewed delta, (S) runs every composed-Rules emulator suite that CI
// and the deploy workflow run, plus two base-Rules suites redirected to the composed artifact and the G-12 gap
// suite, (B) re-runs the Phase-B-ready suites on a temp copy with the career index enforced, (E) applies the
// qualified 1,000-expression gate to every log, and (M) prints the promise matrix. One `ok <n> <id> <label>`
// line per check. Exit 1 on any failure; nothing is skipped.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const Module=require("node:module");
const {spawnSync}=require("node:child_process");
const h=require("../support/composed-production-rules.cjs");

const GAP_SUITE="tests/firebase/composed-rules-gap-emulator.cjs";
const SELF="tests/firebase/composed-production-rules-regression.cjs";
// Base-Rules suites (they read firestore.spark.rules) that hold on the composed artifact unchanged.
// stage3/stage4 pairing suites cannot: their positive cases pair without the persistent-pair witness, which the
// composed Rules deny by design (persistent pair matrix "witness-less create/redeem denial"); the gap suite
// re-proves their denials instead.
const BASE_SUITES=Object.freeze(["tests/firebase/spark-account-bootstrap-emulator.cjs","tests/firebase/stage4-mutation-rate-limit-emulator.cjs"]);
// Suites that must also pass with cmsCareerIndexEnforced() flipped to true in a temp copy (Phase B readiness).
// The career index suite flips in memory itself (CMS_CAREER_INDEX_ENFORCED=1) and is not repeated here.
const PHASE_B_FILES=Object.freeze(new Set([
  "tests/firebase/shared-showdown-setup-production-provider-emulator.cjs",
  "tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs",
  "tests/firebase/shared-terminal-close-production-provider-emulator.cjs",
  "tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs",
  "tests/firebase/two-manager-journey-emulator.cjs",
  "tests/firebase/completed-showdown-read-emulator.cjs",
  GAP_SUITE
]));
const PHASE_B_LIFECYCLE="CMS_SHOWDOWN_LENGTH=1";
// Qualified expression-budget gate: the phrase may appear only right before these denial cases.
const BUDGET_ALLOWED=Object.freeze([{file:"tests/firebase/career-index-emulator.cjs",caseId:"D13",why:"stranger cannot create an index naming a rivalry they are not in (expected denial)"}]);
const LABELS=Object.freeze({
  "tests/firebase/shared-showdown-setup-production-provider-emulator.cjs":"Shared Setup provider matrix",
  "tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs":"Transfer fresh-session recovery",
  "tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs":"Gameplay lifecycle",
  "tests/firebase/shared-terminal-close-production-provider-emulator.cjs":"Terminal Close matrix",
  "tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs":"Persistent Nik and Daniel pair matrix",
  "tests/firebase/two-manager-journey-emulator.cjs":"Two-manager journey",
  "tests/firebase/career-index-emulator.cjs":"Career index matrix",
  "tests/firebase/completed-showdown-read-emulator.cjs":"Completed-only read matrix",
  "tests/firebase/closed-showdown-adapter-emulator.cjs":"Closed-Showdown adapter journey (G-9, when merged)",
  "tests/firebase/spark-account-bootstrap-emulator.cjs":"Spark account bootstrap (base suite on composed Rules)",
  "tests/firebase/stage4-mutation-rate-limit-emulator.cjs":"Stage 4 mutation rate limit (base suite on composed Rules)",
  [GAP_SUITE]:"G-12 gap suite (list/delete sweep, private scope, exact ACTIVE)"
});
// Promise matrix: each promise passes only if every evidence item passed. Evidence: suite file (any run of it)
// or a T/B/E check id from this runner.
const PROMISES=Object.freeze([
  ["M1","exactly two managers, Daniel = playerOne, Nik = playerTwo",["tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/shared-showdown-setup-production-provider-emulator.cjs","tests/firebase/shared-terminal-close-production-provider-emulator.cjs",GAP_SUITE]],
  ["M2","private scope: own-account documents, rival's unfinished inputs hidden",[GAP_SUITE,"tests/firebase/spark-account-bootstrap-emulator.cjs","tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/career-index-emulator.cjs","tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs","tests/firebase/completed-showdown-read-emulator.cjs"]],
  ["M3","pairing plus exact ACTIVE before league/club authority",[GAP_SUITE,"tests/firebase/shared-showdown-setup-production-provider-emulator.cjs","tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs"]],
  ["M4","no list, no delete",["T6",GAP_SUITE,"tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/career-index-emulator.cjs","tests/firebase/completed-showdown-read-emulator.cjs"]],
  ["M5","career index: Phase A shipped, Phase B ready",["T7","tests/firebase/career-index-emulator.cjs","B*"]],
  ["M6","completed-only reads",["T8","tests/firebase/completed-showdown-read-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs"]],
  ["M7","abandoned, stranger and forged denials",["tests/firebase/completed-showdown-read-emulator.cjs","tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs","tests/firebase/shared-terminal-close-production-provider-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs",GAP_SUITE]],
  ["M8","Terminal Close",["tests/firebase/shared-terminal-close-production-provider-emulator.cjs","tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs","tests/firebase/two-manager-journey-emulator.cjs"]],
  ["M9","1,000-expression budget (qualified gate)",["E1","tests/firebase/shared-terminal-close-production-provider-emulator.cjs","tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"]],
  ["M10","write abuse limits and idempotency",["tests/firebase/stage4-mutation-rate-limit-emulator.cjs","tests/firebase/shared-showdown-setup-production-provider-emulator.cjs","tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs"]],
  ["M11","zero billing, Spark-only deploy path",["T5"]],
  ["M12","exact deploy artifact, reviewed delta from production main",["T1","T2","T3","T4","T8","T9","T10"]]
]);

// Parse every `emulators:exec ... "<cmd>"` in a job's steps into individual {envs, file} node invocations.
function suitesFromSteps(steps,label){
  const out=[];
  for(const step of steps){
    if(!step.run||!/emulators:exec\b/.test(step.run))continue;
    const m=step.run.match(/emulators:exec\b.*?"([^"]+)"\s*$/);
    if(!m)throw new Error(`${label}: cannot parse emulator step "${step.name}"`);
    for(const part of m[1].split("&&").map(s=>s.trim())){
      const p=part.match(/^((?:[A-Z_]+=[^\s]+\s+)*)node (tests\/firebase\/[a-z0-9-]+\.cjs)$/);
      if(!p)throw new Error(`${label}: cannot parse emulator command "${part}" in step "${step.name}"`);
      out.push({envs:p[1].trim(),file:p[2],source:`${label}: ${step.name}`});
    }
  }
  return out;
}
function discoverSuites(){
  const fast=h.parseWorkflow(h.readRepo(h.FAST_WORKFLOW),h.FAST_WORKFLOW);
  if(!fast.jobs["rules-emulator"])throw new Error("validate-gameplay-fast.yml: rules-emulator job missing");
  const deploy=h.deployModel();
  const all=[...suitesFromSteps(fast.jobs["rules-emulator"].steps,"fast CI"),...suitesFromSteps(deploy.job.steps,"deploy")];
  for(const file of BASE_SUITES)all.push({envs:"",file,source:"G-12 base suite on composed Rules",base:true});
  all.push({envs:"",file:GAP_SUITE,source:"G-12 gap suite"});
  const seen=new Map();
  for(const s of all){const key=`${s.envs} ${s.file}`;if(!seen.has(key))seen.set(key,s);}
  // A future deploy step may run this runner; it never runs itself.
  return [...seen.values()].filter(s=>s.file!==SELF);
}

function bash(script,{cwd,env,logFd}){
  return spawnSync("bash",["-e","-o","pipefail","-c",script],{cwd,env,stdio:["ignore",logFd,logFd]});
}
function runSuite(suite,{cwd,logPath}){
  const fd=fs.openSync(logPath,"w");
  const env={...process.env};
  for(const pair of suite.envs.split(/\s+/).filter(Boolean)){const [k,v]=pair.split("=");env[k]=v;}
  const args=suite.base?[path.join(cwd,SELF),"--base-suite",suite.file]:[path.join(cwd,suite.file)];
  const r=spawnSync(process.execPath,args,{cwd,env,stdio:["ignore",fd,fd],timeout:15*60*1000});
  fs.closeSync(fd);
  const text=fs.readFileSync(logPath,"utf8");
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  const pass=[...lines].reverse().find(l=>/^PASS\b/.test(l)||/proof passed/.test(l))||"";
  return {status:r.status,error:r.error,text,pass};
}
function tail(text,count=30){return text.split("\n").slice(-count).join("\n");}

// Qualified gate: every "maximum of 1000 expressions" must be followed (before the next case line) by an
// allowed denial case of the same suite. Suites without numbered cases may never show the phrase.
function budgetFindings(file,text){
  const lines=text.split("\n"),found=[];
  for(let i=0;i<lines.length;i++){
    if(!lines[i].includes("maximum of 1000 expressions"))continue;
    let caseId=null;
    for(let j=i+1;j<lines.length;j++){const m=lines[j].match(/^(?:not )?ok \d+ (\S+)/);if(m){caseId=m[1];break;}}
    const allowed=BUDGET_ALLOWED.some(a=>a.file===file&&a.caseId===caseId);
    found.push({file,caseId,allowed});
  }
  return found;
}

function baseSuiteMode(file){
  const absolute=path.resolve(file);
  const source=fs.readFileSync(absolute,"utf8");
  const seam=/fs\.readFileSync\(["']firestore\.spark\.rules["'],\s*["']utf8["']\)/g;
  assert.equal((source.match(seam)||[]).length,1,`${file} must expose exactly one base-Rules source seam`);
  assert.ok(fs.existsSync(h.ARTIFACT),"composed Rules must exist");
  const child=new Module(absolute,module);
  child.filename=absolute;
  child.paths=Module._nodeModulePaths(path.dirname(absolute));
  child._compile(source.replace(seam,`fs.readFileSync(${JSON.stringify(h.ARTIFACT)},"utf8")`),absolute);
}

async function main(){
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error("run inside firebase emulators:exec --only firestore");
  const mainRef=process.env.CMS_PRODUCTION_MAIN_REF||"origin/main";
  const logDir=fs.mkdtempSync(path.join(os.tmpdir(),"cms-g12-logs-"));
  let n=0;const failures=[];const passed=new Set();const runs=[];
  const emit=(id,label,ok,detail)=>{n+=1;process.stdout.write(`${ok?"ok":"not ok"} ${n} ${id} ${label}${detail?` :: ${detail}`:""}\n`);if(ok)passed.add(id);else failures.push(id);};
  const tcheck=async(id,label,fn)=>{try{const d=await fn();emit(id,label,true,d);}catch(e){emit(id,label,false,String(e&&e.message||e).split("\n")[0]);}};

  // T: artifact identity and provenance.
  let candidate=null;
  await tcheck("T1","deploy workflow steps, env and build commands are the reviewed ones",()=>{
    const m=h.deployModel();
    assert.deepEqual(m.job.steps.map(s=>s.name),[...h.DEPLOY_STEP_NAMES]);
    assert.equal(m.workflow.env.FIREBASE_RULES_FILE,h.ARTIFACT);
    assert.equal(m.workflow.env.FIREBASE_CONFIG_FILE,"firebase.production.rules.json");
    assert.deepEqual(m.buildCommands,["scripts/build-production-firestore-rules.mjs","scripts/build-production-firestore-rules-with-persistent-pair.mjs"]);
    assert.equal(h.stepByName(m.job,h.PUBLISH_STEP,"deploy").run,"node scripts/publish-firestore-rules-zero-billing.mjs");
    return `${m.job.steps.length} steps`;
  });
  await tcheck("T2","temp composition with the deploy workflow's own build commands is deterministic",()=>{
    const a=h.composeCandidate(),b=h.composeCandidate();
    assert.equal(a,b);candidate=a;const id=h.identity(a);
    return `sha256 ${id.sha256} gitBlob ${id.gitBlobSha1} ${id.bytes} bytes`;
  });
  await tcheck("T3","deploy-path replay in this checkout (build, pair build, gate, deploy contracts) leaves the byte-identical artifact",()=>{
    assert.ok(candidate,"T2 must pass first");
    const m=h.deployModel();
    const env={...process.env,...m.workflow.env};
    for(const name of h.REPLAY_STEPS){
      const logPath=path.join(logDir,`replay-${name.replace(/[^a-z0-9]+/gi,"-")}.log`);
      const fd=fs.openSync(logPath,"w");const r=bash(h.stepByName(m.job,name,"deploy").run,{cwd:h.ROOT,env,logFd:fd});fs.closeSync(fd);
      if(r.status!==0)throw new Error(`deploy step "${name}" failed (${r.status}); log ${logPath}:\n${tail(fs.readFileSync(logPath,"utf8"),15)}`);
    }
    const replayed=fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8");
    assert.equal(h.sha256(replayed),h.sha256(candidate),"the deploy path published bytes differ from the fresh composition");
    return `gitBlob ${h.gitBlobSha1(replayed)} (= PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS value at the next deploy)`;
  });
  for(const [id,label,fn] of staticChecksFor(()=>candidate))await tcheck(id,label,fn);
  await tcheck("T9","production main composed with main's own deploy workflow and scripts equals the reviewed pin",()=>{
    assert.ok(candidate,"T2 must pass first");
    if(!h.gitRefExists(mainRef))throw new Error(`${mainRef} missing: git fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main`);
    const delta=h.loadDelta();
    const mainText=h.composeFromRef(mainRef);
    const id=h.identity(mainText);
    assert.equal(id.sha256,delta.productionMain.sha256,`${mainRef} (${h.gitRefCommit(mainRef)}) now composes different Rules than the reviewed pin ${delta.productionMain.commit}: re-review the delta`);
    assert.ok(h.sameHunks(h.diffLines(mainText,candidate),delta.hunks),"live diff from production main differs from the reviewed delta");
    return `${mainRef} ${h.gitRefCommit(mainRef).slice(0,7)} sha256 ${id.sha256.slice(0,12)} gitBlob ${id.gitBlobSha1}`;
  });
  await tcheck("T10","production main's deploy workflow is the one this checkout reviewed (same steps and build commands)",()=>{
    const mainDeploy=h.gitRefReader(mainRef)(h.DEPLOY_WORKFLOW);
    assert.ok(mainDeploy!==null,`${mainRef} deploy workflow unreadable`);
    const m=h.deployModel(mainDeploy);
    assert.deepEqual(m.job.steps.map(s=>s.name),[...h.DEPLOY_STEP_NAMES]);
    assert.deepEqual(m.buildCommands,h.deployModel().buildCommands);
    return mainDeploy===h.readRepo(h.DEPLOY_WORKFLOW)?"byte-identical":"same steps (text differs)";
  });
  if(!candidate){process.stdout.write("FAIL composed production Rules regression: no candidate artifact\n");process.exit(1);}

  // S: every composed suite on the deploy artifact (Phase A, as shipped).
  const suites=discoverSuites();
  let k=0;
  for(const suite of suites){
    k+=1;const id=`S${k}`;
    const label=`${LABELS[suite.file]||`unmapped composed suite ${suite.file}`}${suite.envs?` (${suite.envs})`:""}`;
    const before=h.sha256(fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8"));
    const result=runSuite(suite,{cwd:h.ROOT,logPath:path.join(logDir,`${id}.log`)});
    const after=h.sha256(fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8"));
    const ok=result.status===0&&!result.error&&before===h.sha256(candidate)&&after===before;
    runs.push({id,file:suite.file,phase:"A",ok,text:result.text});
    emit(id,label,ok,ok?result.pass.slice(0,160):`exit ${result.status}${before!==h.sha256(candidate)||after!==before?" ARTIFACT CHANGED":""}\n${tail(result.text)}`);
  }

  // B: Phase B readiness on a temp copy (never the checkout's artifact).
  const copy=fs.mkdtempSync(path.join(os.tmpdir(),"cms-g12-phase-b-"));
  try{
    fs.cpSync(h.ROOT,copy,{recursive:true,filter:src=>!/[\\/](node_modules|\.git)$/.test(src)});
    fs.symlinkSync(path.join(h.ROOT,"node_modules"),path.join(copy,"node_modules"),"dir");
    fs.writeFileSync(path.join(copy,h.ARTIFACT),h.flipToPhaseB(candidate));
    assert.equal(h.careerIndexPhase(fs.readFileSync(path.join(h.ROOT,h.ARTIFACT),"utf8")),"A","checkout artifact must stay Phase A");
    let b=0;
    for(const suite of suites.filter(s=>PHASE_B_FILES.has(s.file)||(s.file==="tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"&&s.envs===PHASE_B_LIFECYCLE))){
      b+=1;const id=`B${b}`;
      const result=runSuite(suite,{cwd:copy,logPath:path.join(logDir,`${id}.log`)});
      const ok=result.status===0&&!result.error;
      runs.push({id,file:suite.file,phase:"B",ok,text:result.text});
      emit(id,`Phase B (cmsCareerIndexEnforced() true, temp copy): ${LABELS[suite.file]||suite.file}${suite.envs?` (${suite.envs})`:""}`,ok,ok?result.pass.slice(0,120):`exit ${result.status}\n${tail(result.text)}`);
    }
  }finally{fs.rmSync(copy,{recursive:true,force:true});}

  // E: qualified expression-budget gate over every suite log.
  const findings=runs.flatMap(r=>budgetFindings(r.file,r.text).map(f=>({...f,run:r.id})));
  const bad=findings.filter(f=>!f.allowed);
  emit("E1","qualified 1,000-expression gate: the phrase appears only before allowed denial cases",bad.length===0,
    `${findings.length} occurrence(s): ${findings.map(f=>`${f.run}/${f.caseId||"no-case"}${f.allowed?"":" NOT ALLOWED"}`).join(", ")||"none"}`);

  // M: promise matrix.
  for(const [id,label,evidence] of PROMISES){
    const missing=[];
    for(const e of evidence){
      if(e==="B*"){if(!runs.some(r=>r.phase==="B")||runs.some(r=>r.phase==="B"&&!r.ok))missing.push("B*");continue;}
      if(/^[TE]\d+$/.test(e)){if(!passed.has(e))missing.push(e);continue;}
      const mine=runs.filter(r=>r.file===e);
      if(!mine.length||mine.some(r=>!r.ok))missing.push(path.basename(e));
    }
    emit(id,label,missing.length===0,missing.length?`failed or missing evidence: ${missing.join(", ")}`:`${evidence.length} evidence item(s)`);
  }
  const unmapped=suites.filter(s=>!LABELS[s.file]);
  if(unmapped.length)process.stdout.write(`NOTE unmapped composed suites ran and passed or failed above (add them to LABELS/PROMISES): ${unmapped.map(s=>s.file).join(", ")}\n`);
  process.stdout.write(`LOGS ${logDir}\n`);
  if(failures.length){process.stdout.write(`FAIL composed production Rules regression: ${failures.length} of ${n} numbered checks failed: ${failures.join(", ")}\n`);process.exit(1);}
  process.stdout.write(`PASS composed production Rules regression: ${n} numbered checks (T artifact identity and provenance, S ${suites.length} composed suites on the deploy artifact, B Phase B readiness, E qualified expression budget, M ${PROMISES.length} promises) on sha256 ${h.sha256(candidate)}.\n`);
}

// T4-T8: the offline checks, shared with tests/contracts/composed-production-rules-contracts.cjs.
function staticChecksFor(getCandidate){return require("../contracts/composed-production-rules-contracts.cjs").staticChecks(getCandidate);}

module.exports=Object.freeze({discoverSuites,suitesFromSteps,budgetFindings,BUDGET_ALLOWED,BASE_SUITES,PHASE_B_FILES,PROMISES,LABELS});
if(require.main===module){
  if(process.argv[2]==="--base-suite"){baseSuiteMode(process.argv[3]);}
  else main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
}
````

### Appendix E. Reviewed delta fixture at `843e64e`: `tests/fixtures/composed-production-rules/main-delta.json` (full file; re-base it on G-10 with §4.7)

The hunk lines are tool output (`node tests/support/composed-production-rules.cjs --print-main-delta origin/main` on `843e64e`); only `owner`, `why`, `purpose`, `allowedOwners`, `ref` and `candidate.base` were written by the lead. The contract compares parsed JSON, so indentation does not matter, but every hunk line must be byte-exact.

````json
{
  "schemaVersion": 1,
  "purpose": "Reviewed allowlist of every line by which the composed production Firestore Rules on gameplay/recovery-v1 differ from what production main deploys. The main gate must see exactly these changes and nothing else. Regenerate only with node tests/support/composed-production-rules.cjs --print-main-delta origin/main, then review every hunk.",
  "productionMain": {
    "ref": "main",
    "commit": "2e0bd45f52372e0d4d20c53dc1e22cf1d7fb4d81",
    "sha256": "ce8abfe620696db7f8d8c3d20dcc35550901c7c3af082f2e1f775db0426f6a78",
    "gitBlobSha1": "6fe04a8e5211629919d29a5f2940274794c1cc65",
    "bytes": 121492
  },
  "candidate": {
    "base": "gameplay/recovery-v1 @ 843e64e (JOB-07 + JOB-08 merged)",
    "sha256": "cdae7f5def3ab133a1fe833447617b12ef94356d7e3f3cd7d1d98333b38ac141",
    "gitBlobSha1": "2be6c0c5ae10b20f2f09d253b34cd262fb2b52f6",
    "bytes": 131462
  },
  "allowedOwners": [
    "G-7",
    "G-8",
    "G-7+G-8"
  ],
  "hunks": [
    {
      "owner": "G-7",
      "why": "G-7 (PR #325): pair-link create also requires the career index coupling, staged behind cmsCareerIndexEnforced() (Phase A: false).",
      "mainLine": 2408,
      "candidateLine": 2408,
      "removed": [
        "        && cmsPersistentPairDataValid(accountId, root.data);"
      ],
      "added": [
        "        && cmsPersistentPairDataValid(accountId, root.data)",
        "        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId));"
      ]
    },
    {
      "owner": "G-7+G-8",
      "why": "G-7 (PR #325): pair-link update coupling, then the CMS_CAREER_INDEX functions; G-8 (PR #326): the CMS_COMPLETED_READ functions cmsCompletedShowdownReadable / cmsCompletedSeasonReadable.",
      "mainLine": 2421,
      "candidateLine": 2422,
      "removed": [
        "        && cmsPersistentPairCanReplace(before, after);"
      ],
      "added": [
        "        && cmsPersistentPairCanReplace(before, after)",
        "        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, after.data.rivalryId));",
        "    }",
        "    // CMS_CAREER_INDEX (D1, JOB-07): own-account, append-only, forward-only career index.",
        "    function cmsCareerIndexPageCapacity() {",
        "      return 500;",
        "    }",
        "",
        "    // Phase A admits legacy clients. Enable only after both managers receive the new shell.",
        "    function cmsCareerIndexEnforced() {",
        "      return false;",
        "    }",
        "",
        "    function cmsCareerIndexRecordsNewRivalry(accountId, rivalryId) {",
        "      let ids = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data.data.rivalryIds;",
        "      return ids is list",
        "        && ids.size() >= 1",
        "        && ids[ids.size() - 1] == rivalryId;",
        "    }",
        "",
        "    // Pair-link coupling (first creation AND replacement): when this commit makes the account a member of",
        "    // the linked rivalry (creation by Daniel, redemption by Nik), the same commit must end the account's",
        "    // career index with that rivalry. A link to a rivalry the account already belonged to before this",
        "    // commit (reconfirm, Continue, recovery of a pre-deployment link) needs no index write and can never",
        "    // add one.",
        "    function cmsCareerIndexPairLinkCoupled(accountId, rivalryId) {",
        "      let rivalryPath = /databases/$(database)/documents/rivalries/$(rivalryId);",
        "      return (exists(rivalryPath) && accountId in get(rivalryPath).data.data.authorizedAccountIds)",
        "        || cmsCareerIndexRecordsNewRivalry(accountId, rivalryId);",
        "    }",
        "",
        "    function cmsCareerIndexHeadDataValid(data) {",
        "      return data.keys().hasOnly(['rivalryIds', 'sealedPageCount'])",
        "        && data.keys().hasAll(['rivalryIds', 'sealedPageCount'])",
        "        && data.rivalryIds is list",
        "        && data.rivalryIds.size() >= 1",
        "        && data.rivalryIds.size() <= cmsCareerIndexPageCapacity()",
        "        && data.sealedPageCount is int",
        "        && data.sealedPageCount >= 0;",
        "    }",
        "",
        "    function cmsCareerIndexCreationEligible(accountId, rivalryId) {",
        "      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;",
        "      return !exists(/databases/$(database)/documents/rivalries/$(rivalryId))",
        "        && after.connectionState == 'pending-pair'",
        "        && after.createdByAccountId == accountId",
        "        && after.authorizedAccountIds == [accountId];",
        "    }",
        "",
        "    function cmsCareerIndexRedemptionEligible(accountId, rivalryId) {",
        "      let before = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;",
        "      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;",
        "      return before.connectionState == 'pending-pair'",
        "        && after.connectionState == 'active'",
        "        && before.authorizedAccountIds.size() == 1",
        "        && !(accountId in before.authorizedAccountIds)",
        "        && after.authorizedAccountIds == [before.createdByAccountId, accountId]",
        "        && rivalryId in get(/databases/$(database)/documents/accounts/$(before.createdByAccountId)/careerIndex/current).data.data.rivalryIds;",
        "    }",
        "",
        "    function cmsCareerIndexAppendEligible(accountId, rivalryId) {",
        "      let pair = getAfter(/databases/$(database)/documents/accounts/$(accountId)/pairLinks/current);",
        "      return rivalryId is string",
        "        && rivalryId.matches('^pair_[0-9a-f]{64}$')",
        "        && pair != null",
        "        && pair.data is map",
        "        && pair.data.data is map",
        "        && pair.data.data.rivalryId == rivalryId",
        "        && cmsPersistentPairManagerValid(pair.data.data.managerRole, pair.data.data.managerId)",
        "        && cmsPersistentPairRivalryMembership(accountId, rivalryId, pair.data.data.managerRole)",
        "        && (",
        "          cmsCareerIndexCreationEligible(accountId, rivalryId)",
        "          || (",
        "            exists(/databases/$(database)/documents/rivalries/$(rivalryId))",
        "            && cmsCareerIndexRedemptionEligible(accountId, rivalryId)",
        "          )",
        "        );",
        "    }",
        "",
        "    function cmsCareerIndexPageSealedFrom(accountId, pageNumber, ids) {",
        "      let page = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/$('page_' + string(pageNumber))).data;",
        "      return page.objectType == 'careerIndexPage'",
        "        && page.data.pageNumber == pageNumber",
        "        && page.data.rivalryIds == ids;",
        "    }",
        "",
        "    function cmsCareerIndexHeadCreateValid(accountId) {",
        "      let root = request.resource.data;",
        "      return signedIn()",
        "        && request.auth.uid == accountId",
        "        && activeDevice(root.updatedByDeviceId)",
        "        && validCreateEnvelope(root, 'careerIndex', 'current')",
        "        && root.updatedByAccountId == accountId",
        "        && cmsCareerIndexHeadDataValid(root.data)",
        "        && root.data.sealedPageCount == 0",
        "        && root.data.rivalryIds.size() == 1",
        "        && cmsCareerIndexAppendEligible(accountId, root.data.rivalryIds[0]);",
        "    }",
        "",
        "    function cmsCareerIndexHeadUpdateValid(accountId) {",
        "      let before = resource.data;",
        "      let after = request.resource.data;",
        "      let prior = before.data.rivalryIds;",
        "      let next = after.data.rivalryIds;",
        "      return signedIn()",
        "        && request.auth.uid == accountId",
        "        && activeDevice(after.updatedByDeviceId)",
        "        && validCasEnvelope(before, after, 'careerIndex', 'current')",
        "        && after.updatedByAccountId == accountId",
        "        && cmsCareerIndexHeadDataValid(after.data)",
        "        && (",
        "          (",
        "            prior.size() < cmsCareerIndexPageCapacity()",
        "            && after.data.sealedPageCount == before.data.sealedPageCount",
        "            && next.size() == prior.size() + 1",
        "            && next[0:prior.size()] == prior",
        "            && !(next[prior.size()] in prior)",
        "            && cmsCareerIndexAppendEligible(accountId, next[prior.size()])",
        "          )",
        "          ||",
        "          (",
        "            prior.size() == cmsCareerIndexPageCapacity()",
        "            && after.data.sealedPageCount == before.data.sealedPageCount + 1",
        "            && next.size() == 1",
        "            && !(next[0] in prior)",
        "            && cmsCareerIndexPageSealedFrom(accountId, after.data.sealedPageCount, prior)",
        "            && cmsCareerIndexAppendEligible(accountId, next[0])",
        "          )",
        "        );",
        "    }",
        "",
        "    function cmsCareerIndexPageCreateValid(accountId, pageId) {",
        "      let root = request.resource.data;",
        "      let headBefore = get(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;",
        "      let headAfter = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;",
        "      return signedIn()",
        "        && request.auth.uid == accountId",
        "        && activeDevice(root.updatedByDeviceId)",
        "        && validCreateEnvelope(root, 'careerIndexPage', pageId)",
        "        && root.updatedByAccountId == accountId",
        "        && root.data.keys().hasOnly(['pageNumber', 'rivalryIds'])",
        "        && root.data.keys().hasAll(['pageNumber', 'rivalryIds'])",
        "        && root.data.pageNumber is int",
        "        && root.data.pageNumber == headBefore.data.sealedPageCount + 1",
        "        && pageId == 'page_' + string(root.data.pageNumber)",
        "        && headBefore.data.rivalryIds.size() == cmsCareerIndexPageCapacity()",
        "        && root.data.rivalryIds == headBefore.data.rivalryIds",
        "        && headAfter.revision == headBefore.revision + 1",
        "        && headAfter.data.sealedPageCount == root.data.pageNumber;",
        "    }",
        "",
        "    // CMS_COMPLETED_READ (D2, JOB-08): read-only grant for a Showdown closed by a verified",
        "    // Terminal Close. Get only; no write, list or delete rule refers to these functions.",
        "    function cmsCompletedShowdownReadable(rivalryId) {",
        "      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;",
        "      let data = root.data;",
        "      let slots = data.managerSlots;",
        "      let progress = data.terminalProgress;",
        "      return signedIn()",
        "        && rivalryId.matches('^pair_[0-9a-f]{64}$')",
        "        && root.objectType == 'rivalry'",
        "        && root.objectId == rivalryId",
        "        && root.lifecycleState == 'live'",
        "        && data.connectionState == 'closed'",
        "        && data.authorizedAccountIds is list",
        "        && data.authorizedAccountIds.size() == 2",
        "        && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]",
        "        && request.auth.uid in data.authorizedAccountIds",
        "        && slots is list",
        "        && slots.size() == 2",
        "        && slots[0].slotId == 'playerOne'",
        "        && slots[1].slotId == 'playerTwo'",
        "        && (slots[0].accountId == request.auth.uid || slots[1].accountId == request.auth.uid)",
        "        && activeAccount(request.auth.uid)",
        "        && 'terminalClose' in data",
        "        && ssjrTerminalValidIntent(rivalryId, data.terminalClose)",
        "        && ssjrTerminalProgressShape(progress)",
        "        && progress.acceptedThroughSeason == progress.totalSeasons",
        "        && progress.closedSessionRevision is int",
        "        && data.terminalClose.totalSeasons == progress.totalSeasons",
        "        && data.terminalClose.managerTotals == progress.managerTotals;",
        "    }",
        "",
        "    function cmsCompletedSeasonReadable(rivalryId, seasonId) {",
        "      let total = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.terminalProgress.totalSeasons;",
        "      return cmsCompletedShowdownReadable(rivalryId)",
        "        && seasonId in ['season_1','season_2','season_3','season_4','season_5','season_6','season_7','season_8','season_9','season_10'][0:total];"
      ]
    },
    {
      "owner": "G-7",
      "why": "G-7 (PR #325): match /accounts/{accountId}/careerIndex/{indexId}: own-account get, append-only create/update, list and delete false.",
      "mainLine": 2465,
      "candidateLine": 2652,
      "removed": [],
      "added": [
        "",
        "    match /accounts/{accountId}/careerIndex/{indexId} {",
        "      allow get: if signedIn()",
        "        && request.auth.uid == accountId",
        "        && (indexId == 'current' || indexId.matches('^page_[1-9][0-9]*$'));",
        "      allow create: if (indexId == 'current' && cmsCareerIndexHeadCreateValid(accountId))",
        "        || (indexId.matches('^page_[1-9][0-9]*$') && cmsCareerIndexPageCreateValid(accountId, indexId));",
        "      allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId);",
        "      allow list, delete: if false;",
        "    }"
      ]
    },
    {
      "owner": "G-8",
      "why": "G-8 (PR #326): completed-only get grant on sharedSetup/authoritative.",
      "mainLine": 2526,
      "candidateLine": 2723,
      "removed": [
        "        allow get: if ssjrEntitled(rivalryId);"
      ],
      "added": [
        "        allow get: if ssjrEntitled(rivalryId) || cmsCompletedShowdownReadable(rivalryId);"
      ]
    },
    {
      "owner": "G-8",
      "why": "G-8 (PR #326): completed-only get grant on seasonResults/{seasonId} (season_1..season_N only).",
      "mainLine": 2569,
      "candidateLine": 2766,
      "removed": [
        "        allow get: if ssjrEntitled(rivalryId);"
      ],
      "added": [
        "        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);"
      ]
    },
    {
      "owner": "G-8",
      "why": "G-8 (PR #326): completed-only get grant on seasonResults/{seasonId}/roles/{playerOne|playerTwo}.",
      "mainLine": 2575,
      "candidateLine": 2772,
      "removed": [
        "          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);"
      ],
      "added": [
        "          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole)",
        "            || (managerRole in ['playerOne', 'playerTwo'] && cmsCompletedSeasonReadable(rivalryId, seasonId));"
      ]
    },
    {
      "owner": "G-8",
      "why": "G-8 (PR #326): completed-only get grant on seasonCommits/{seasonId}.",
      "mainLine": 2585,
      "candidateLine": 2783,
      "removed": [
        "        allow get: if ssjrEntitled(rivalryId);"
      ],
      "added": [
        "        allow get: if ssjrEntitled(rivalryId) || cmsCompletedSeasonReadable(rivalryId, seasonId);"
      ]
    }
  ]
}
````

### Appendix F. Registry, ops test and CI job (against `843e64e`)

Registry patterns are JSON strings compiled with `new RegExp`: a literal dot is `\\.` in the JSON source (one escaped backslash), never `\\\\.`. If other jobs merged first, keep their entries and consts and put this entry and const **last**; put the CI job after whatever job is last.

````diff
diff --git a/.github/workflows/validate-gameplay-fast.yml b/.github/workflows/validate-gameplay-fast.yml
index fa2ca59..a800d87 100644
--- a/.github/workflows/validate-gameplay-fast.yml
+++ b/.github/workflows/validate-gameplay-fast.yml
@@ -72,3 +72,27 @@ jobs:
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-career-index "node tests/firebase/career-index-emulator.cjs && CMS_CAREER_INDEX_ENFORCED=1 node tests/firebase/career-index-emulator.cjs"
       - name: Completed-only read matrix
         run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-completed-read "node tests/firebase/completed-showdown-read-emulator.cjs"
+
+  composed-rules-regression:
+    name: Composed production Rules regression
+    runs-on: ubuntu-latest
+    timeout-minutes: 30
+    steps:
+      - uses: actions/checkout@v5
+        with:
+          fetch-depth: 1
+      - name: Fetch production main for the reviewed Rules delta
+        run: git fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main
+      - uses: actions/setup-node@v5
+        with:
+          node-version: 24
+          cache: npm
+      - uses: actions/setup-java@v5
+        with:
+          distribution: temurin
+          java-version: '21'
+      - run: npm ci
+      - name: Install pinned Firebase emulator test dependencies
+        run: npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0
+      - name: Composed production Rules regression matrix
+        run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-composed "node tests/firebase/composed-production-rules-regression.cjs"
diff --git a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
index 3323da0..5e64be2 100644
--- a/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
+++ b/POS20_SUPPLEMENTAL_PRODUCT_TESTS.json
@@ -547,6 +547,26 @@
         "^tests/contracts/completed-showdown-read-contracts\\.cjs$",
         "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
       ]
+    },
+    {
+      "path": "tests/contracts/composed-production-rules-contracts.cjs",
+      "patterns": [
+        "^firestore\\.spark\\.rules$",
+        "^firestore\\.[a-z-]+-production\\.fragment\\.rules$",
+        "^scripts/build-production-firestore-rules(-with-persistent-pair)?\\.mjs$",
+        "^scripts/inject-persistent-pair-rules\\.mjs$",
+        "^scripts/assert-firestore-zero-billing-boundary\\.mjs$",
+        "^scripts/publish-firestore-rules-zero-billing\\.mjs$",
+        "^firebase\\.production\\.rules\\.json$",
+        "^data/transferOptions\\.js$",
+        "^\\.github/workflows/(deploy-firestore-rules-zero-billing|validate-gameplay-fast)\\.yml$",
+        "^tests/support/composed-production-rules\\.cjs$",
+        "^tests/fixtures/composed-production-rules/main-delta\\.json$",
+        "^tests/firebase/composed-production-rules-regression\\.cjs$",
+        "^tests/firebase/composed-rules-gap-emulator\\.cjs$",
+        "^tests/contracts/composed-production-rules-contracts\\.cjs$",
+        "^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"
+      ]
     }
   ]
 }
diff --git a/tests/operations/pos20-control-plane.test.mjs b/tests/operations/pos20-control-plane.test.mjs
index 353b654..97febb0 100644
--- a/tests/operations/pos20-control-plane.test.mjs
+++ b/tests/operations/pos20-control-plane.test.mjs
@@ -70,10 +70,11 @@ const startJoinViewModelContract='tests/contracts/start-join-view-model-contract
 const sharedSeasonResultsRaceContract='tests/contracts/shared-season-results-race-contracts.cjs';
 const careerIndexContract='tests/contracts/career-index-contracts.cjs';
 const completedShowdownReadContract='tests/contracts/completed-showdown-read-contracts.cjs';
+const composedProductionRulesContract='tests/contracts/composed-production-rules-contracts.cjs';
 const supplementalRegistry=JSON.parse(fs.readFileSync('POS20_SUPPLEMENTAL_PRODUCT_TESTS.json','utf8'));
 const frozenProductManifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
 const supplementalPaths=supplementalRegistry.tests.map(entry=>entry.path);
-const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract];
+const expectedSupplementalContracts=[safeEvidenceContract,actorEvidenceContract,careerStartContract,transferChallengeContract,seasonResultsContract,seasonResultsProviderContract,seasonResultsRulesContract,seasonResultsProductionContract,seasonCommitContract,seasonCommitProviderContract,seasonCommitRulesContract,seasonCommitProductionContract,canonicalScoringContract,canonicalScoringProviderContract,canonicalScoringProductionContract,historyConvergenceContract,historyConvergenceProductionContract,multiSeasonContract,multiSeasonProviderContract,multiSeasonProductionContract,journeyReconnectContract,journeyReconnectProductionContract,journeyConflictsContract,journeyConflictsProductionContract,localReconciliationContract,localReconciliationProductionContract,finalReconciliationContract,finalReconciliationProductionContract,terminalCloseContract,terminalCloseProviderContract,terminalCloseRulesContract,terminalCloseProductionContract,physicalJourneyAcceptanceContract,physicalJourneyPublicationContract,ssjr2PhysicalRunCreditContract,setupNoDroppedTapsContract,sharedCareerAnalyticsContract,sharedActiveShowdownAdapterContract,startJoinViewModelContract,careerScreenSeamContract,sharedSeasonResultsRaceContract,careerIndexContract,completedShowdownReadContract,composedProductionRulesContract];
 const expectedFullTestCount=new Set([...frozenProductManifest.tests,...supplementalPaths]).size;
 
 test('POS20 accepts low-risk inherited routing without reducing it',()=>{const r=routePos20(['README.md']);assert.equal(r.model,'POS20');assert.equal(r.profile,'POS20_DOC_ONLY');assert.equal(r.cognitiveEscalation,false);});
````
