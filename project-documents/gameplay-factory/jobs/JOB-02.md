# JOB-02 · Two-manager journey on the emulator (provider level)

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Work mode from step 6 on, since Nik lost the step 1-5 chat on 2026-10-02; every emulator run still happens on GitHub CI, see below) | JOB-01 merged into `gameplay/recovery-v1` | 8 | `gameplay/job-02-two-manager-journey` | `gameplay/recovery-v1` | no |

## 1. Goal

Write one automated test where Daniel and Nik play a whole Shared Showdown against the real composed production Firestore Rules on the local emulator, with a third stranger account and privacy checks at every step, then start a second Showdown. It replaces Nik's manual smoke tests at the provider level, and its baseline report tells the lead exactly which known gaps exist today (for example, closed Showdowns are unreadable) so each one becomes a tracked job instead of a surprise on Nik's phone.

## 2. Branches and files

- The lead creates `gameplay/job-02-two-manager-journey` from `gameplay/recovery-v1` right after merging Job 1; if it is missing, create it yourself from `gameplay/recovery-v1`, but only once Job 1 is merged (check that `.github/workflows/validate-gameplay-fast.yml` exists on `gameplay/recovery-v1`; if not, reply "Job 2 waits for job 1.").
- **Lane decision (lead, 2026-10-02):** neither lane can run the Firebase emulator locally (smoke jobs 0 and 90), so this job runs in a normal chat on the CI path in WORKER_HANDBOOK.md §7. Every "Run" below means: save the files to the code branch, then read the "Validate Gameplay Fast" run on your exact head commit (both jobs must be green; the log of the `Two-manager journey` step is your test output). Before each save, run `node --check tests/firebase/two-manager-journey-emulator.cjs` in your sandbox. Add the step-7 CI step **in step 2**, so CI runs your test from the first save. Step 1's baseline is the green job-1 run already on `gameplay/recovery-v1` (record its URL); do not install anything.
- Create: `tests/firebase/two-manager-journey-emulator.cjs`.
- Edit: `.github/workflows/validate-gameplay-fast.yml`, adding one step at the end of the `rules-emulator` job (step 7 below).
- On `factory/gameplay-v1`: `project-documents/gameplay-factory/reports/JOB-02-baseline.md` and `status/JOB-02.md`.
- Change nothing else. **Never edit app code (`js/`) or Rules files in this job**, even if you find a bug. Bugs go in the baseline report.
- **Lead override (2026-10-02):** one Rules change is approved. In `firestore.shared-setup-production.fragment.rules`, change both `.toHexString()` calls to `.toHexString().lower()`, in its own commit. See "Lead answer" in `status/JOB-02.md`. The same fix is going to main as PR #317. Nothing else in `js/` or the Rules may change.

Read first (on `gameplay/recovery-v1`), in this order:

1. `tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs` (285 lines). **This is your template.** It already plays setup → career start → transfer window → results → commit → scoring → history → multi-season → final reconciliation for accounts `A` and `B`, seeding the paired rivalry directly with `env.withSecurityRulesDisabled`. Copy its helpers (`account`, `device`, `slots`, `rivalry`, `session`, `op`, `base`, `resultFor`) rather than reinventing them.
2. `tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs`: how Daniel creates a pair code and Nik redeems it through `js/persistentNikDanielPair.js` and `js/sparkPrivatePairing.js`.
3. `tests/firebase/shared-terminal-close-production-provider-emulator.cjs`: how Terminal Close is reached through `js/sparkTerminalClose.js`.
4. Rules you will exercise (generated into `firestore.spark.generated.rules` by the two build scripts): `firestore.spark.rules` lines 447-464 (`activePairedRivalry`), the private-read conditions `managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED'` (transfers) and `managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY'` (season results).

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete anything. Never deploy. Emulator project ids start with `demo-`.
- Daniel = `playerOne` (account `A` in the template), Nik = `playerTwo` (account `B`). Add a stranger account `C` that is never in the rivalry.
- Scoring never changes: CL 5, league title 3, domestic cup 1, performance bonus 1 (100+ league points or 100+ league goals), awards bonus 1 (top scorer or top assist). Season max 11.
- Privacy: neither manager may read the other's unfinished transfer guesses/signings or unpublished season inputs.
- Do not weaken, skip or delete any existing test.

## 4. What the test must prove

Use the composed rules file exactly as the template does: `const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8")`. Use `CMS_SHOWDOWN_LENGTH` (default 3) like the template.

**A. Main journey (Showdown 1).** Daniel and Nik play every season to the final result and Terminal Close. After each phase assert both managers read the same shared state (the template's `deepEqual` checks are the model).

**B. Stranger denied everywhere.** At three moments (after setup is confirmed, after season 1 commit, after Terminal Close) the stranger `C` gets `assertFails` on `getDoc` of: the rivalry root, `sharedSetup/authoritative`, `seasonCommits/season_1`, `seasonResults/season_1` and its `roles/playerOne`, the season-1 transfer challenge (`transferChallenges/{transferId}`) and its private `roles/playerOne` and `roles/playerTwo` docs, and `accounts/A/pairLinks/current`. Also assert a `getDocs` list query on `rivalries/{R}/seasonCommits` fails for everyone, including Daniel.

**C. Privacy.** Before Nik publishes season-1 results, Nik's `getDoc` of `seasonResults/season_1/roles/playerOne` fails; after both publish (phase `RESULTS_READY`) it succeeds. Before the season-1 transfer challenge is `COMPLETED`, Nik cannot read Daniel's `transferChallenges/{transferId}/roles/playerOne`; after `COMPLETED` he can. Check the same in the other direction.

**D. Idempotent retries.** Repeat Daniel's `commitSeason` call for season 1 with the same `operationId` and `baseRevision`; assert it does not create a second commit, does not change the stored commit, and the history still has exactly one season 1.

**E. Simultaneous taps.** For one season, run both managers' `publishResult` calls with `Promise.all`. Assert the final stored state is the same as the sequential case: both roles published once, phase `RESULTS_READY`, no duplicate.

**F. Second Showdown.** After Showdown 1 is closed, pair again (Daniel creates, Nik redeems) into a new rivalry id and play season 1. Assert the new rivalry works. Then record today's known gap: Daniel's and Nik's `getDoc` of Showdown 1's `sharedSetup/authoritative` and `seasonCommits/season_1` **fail** now that it is closed. Write that assertion with the label `KNOWN GAP 1 (fixed by G-8)` so the lead can flip it later. Also record that `accounts/A/pairLinks/current` now names only the new rivalry: `KNOWN GAP 2 (fixed by G-7)`.

**G. Abandon variant.** In a fresh rivalry, play season 1, then abandon through the persistent pair provider's abandon path (`pairAbandonCurrentShowdown` in `js/persistentNikDanielPair.js` lines 67-97; the rules check is `cmsPersistentPairAbandonValid`). Assert the rivalry root is closed **without** a `terminalClose` witness, and that further season writes are denied.

If chaining real pairing (F, G) into the gameplay providers needs more than the template's seeding, seed the paired state exactly as the template does for those sections and prove the pairing itself with the pair provider in a separate block. Write in the status file which path you took and why.

## 5. Steps

After each step update `status/JOB-02.md` and push it to `factory/gameplay-v1` with `Job 2 step k/8: <step name>`. Push code to `gameplay/job-02-two-manager-journey` as you go.

1. **Baseline.** Clone, check out `gameplay/recovery-v1`, `npm ci`, install the pinned emulator deps (`npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0`), build the composed rules (`node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs`), and run the template: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-two-manager-journey "CMS_SHOWDOWN_LENGTH=3 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"`. Record the last lines. It must pass before you start.
2. **Skeleton + section A.** Create `tests/firebase/two-manager-journey-emulator.cjs` from the template with the main journey through Terminal Close. Run it. Commit.
3. **Section B (stranger).** Add the stranger checks. Run. Commit.
4. **Section C (privacy).** Add. Run. Commit.
5. **Sections D and E (retries, simultaneous taps).** Add. Run. Commit.
6. **Sections F and G (second Showdown, abandon).** Add, with the `KNOWN GAP` labels. Run. Commit.
7. **CI.** Add one step at the end of the `rules-emulator` job in `.github/workflows/validate-gameplay-fast.yml`:
   ```yaml
         - name: Two-manager journey
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-journey "CMS_SHOWDOWN_LENGTH=3 node tests/firebase/two-manager-journey-emulator.cjs"
   ```
   Run `npm run test:contracts` and `npm run test:ops` locally. Push. Wait for "Validate Gameplay Fast" on your exact head; record the run URL. Open the PR into `gameplay/recovery-v1` titled `Job 2: two-manager journey on the emulator`.
8. **Baseline report.** Write `project-documents/gameplay-factory/reports/JOB-02-baseline.md` on `factory/gameplay-v1`: one table row per check in sections A to G with PASS, FAIL or KNOWN GAP, and one line of evidence. Under "Bugs found", list every check that failed for a reason that is **not** a known gap: what you did, what you expected, what happened, the file and line where you think it comes from. Do not fix them. Fill the Done checklist, set State: DONE, push `Job 2 done: Two-manager journey on the emulator`.

> **Trap (checked by the lead):** `npm run test:contracts` rewrites `firestore.spark.generated.rules` **without** the persistent-pair fragment. Always rebuild with both build scripts after running the contracts and before any emulator run, or the pair tests fail with `PERMISSION_DENIED … false for 'create' @ L2428`. In CI the jobs are separate, so this only bites locally.

## 6. Tests first

This job is the test. A check that fails because the app has a real bug stays in the test as a failing assertion only if it would make CI red; instead, mark it in the test with `// BUG: see JOB-02-baseline.md` and assert today's behaviour, so CI stays green and the bug is visible. The lead turns each one into a job with the failing assertion restored.

## 7. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] The new test passes locally with `CMS_SHOWDOWN_LENGTH=3` and `CMS_SHOWDOWN_LENGTH=1`.
- [ ] "Validate Gameplay Fast" is green on the exact head SHA, including the new step (run URL).
- [ ] Sections A to G are all present; known gaps carry their labels.
- [ ] Stranger, privacy and list-denial checks use `assertFails` against the composed production rules.
- [ ] No file in `js/` changed, no existing test changed, and the only `*.rules` change is the approved `.toHexString().lower()` fix (two lines, own commit).
- [ ] Baseline report pushed, with a "Bugs found" section (it may say "none").
- [ ] PR open into `gameplay/recovery-v1`; nothing pushed to `main`; nothing deployed.

## 8. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing assertion and the last 30 log lines into the status file, push, and reply "Job 2 is blocked: <one line>".
