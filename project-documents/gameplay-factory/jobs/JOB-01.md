# JOB-01 · Fast regression CI on every gameplay push

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode: terminal) | nothing | 6 | `gameplay/job-01-fast-ci` | `gameplay/recovery-v1` | no |

## 1. Goal

Add one GitHub Actions workflow that runs on every push to a `gameplay/**` branch and proves, in a few minutes, that the contract suites pass and the composed production Firestore Rules still behave on the emulator. Today almost every workflow runs only on `main` or on pull requests, so a worker can push broken gameplay code and nobody sees it until much later; this job makes every later job prove itself on its own push, which is what replaces Nik's manual smoke tests.

## 2. Branches and files

- Code branch `gameplay/job-01-fast-ci` already exists (the lead cut it from `gameplay/recovery-v1`). Push code there. Open a PR into `gameplay/recovery-v1` titled `Job 1: fast gameplay CI`.
- If job 90 found that Work mode cannot run a command this job needs (see `smoke/CAPABILITIES_WORK.md`), use the CI path in WORKER_HANDBOOK.md §7: commit to the code branch and read the "Validate Gameplay Fast" result on your exact head commit instead.
- Status file: `project-documents/gameplay-factory/status/JOB-01.md` on `factory/gameplay-v1`.
- The only file you create: `.github/workflows/validate-gameplay-fast.yml`. Change nothing else.

Read first (on `gameplay/recovery-v1`):

- `.github/workflows/validate-pos10.yml` lines 108-135: the existing emulator job you are copying the shape of.
- `.github/workflows/deploy-firestore-rules-zero-billing.yml` lines 134-176: the full list of emulator proofs. **You copy only the proof commands, never the deploy or auth steps.**
- `package.json` `scripts`: `test:contracts` and `test:ops`.
- `tests/contracts/stability-contracts.cjs` line 133 and `tests/contracts/offline-shell-contracts.cjs` lines 103-110: contracts that read every workflow file. They require `actions/checkout@v5` and `actions/setup-node@v5` (never v4), and they forbid new workflows from naming the offline browser audits.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete anything.
- The workflow must never deploy, never authenticate to Google or Firebase, never read a secret, and never touch production. Emulator project ids must start with `demo-` (a `demo-` project needs no billing and cannot reach production).
- Firebase stays on Spark; no billing, no Cloud Functions, no App Check changes.
- `permissions: contents: read` only.

## 4. Steps

After each step update `status/JOB-01.md` and push it to `factory/gameplay-v1` with `Job 1 step k/6: <step name>`.

1. **Baseline.** Clone, `git checkout gameplay/recovery-v1`, `npm ci`, `npm run test:contracts`, `npm run test:ops`. Record the last line of each. Expected: `PASS POS10 selected deterministic census (96/96 …)` and `# fail 0` for ops.
2. **Write the workflow.** Create `.github/workflows/validate-gameplay-fast.yml` with this content (adjust only if a step fails for a reason you record):

   ```yaml
   name: Validate Gameplay Fast

   on:
     push:
       branches:
         - 'gameplay/**'
     workflow_dispatch:

   permissions:
     contents: read

   concurrency:
     group: gameplay-fast-${{ github.ref_name }}
     cancel-in-progress: true

   jobs:
     contracts:
       name: Gameplay contracts
       runs-on: ubuntu-latest
       timeout-minutes: 10
       steps:
         - uses: actions/checkout@v5
           with:
             fetch-depth: 1
         - uses: actions/setup-node@v5
           with:
             node-version: 24
             cache: npm
         - run: npm ci
         - name: Product contracts
           run: npm run test:contracts
         - name: Operations audit
           run: npm run test:ops

     rules-emulator:
       name: Composed Rules on the emulator
       runs-on: ubuntu-latest
       timeout-minutes: 20
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
         - name: Shared Setup provider matrix
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-setup "node tests/firebase/shared-showdown-setup-production-provider-emulator.cjs"
         - name: Transfer fresh-session recovery
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-transfer "node tests/firebase/shared-transfer-challenge-fresh-session-emulator.cjs"
         - name: Gameplay lifecycle (1 and 3 seasons)
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-lifecycle "CMS_SHOWDOWN_LENGTH=1 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs && CMS_SHOWDOWN_LENGTH=3 node tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs"
         - name: Terminal Close matrix
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal "node tests/firebase/shared-terminal-close-production-provider-emulator.cjs"
         - name: Persistent Nik and Daniel pair matrix
           run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-pair "node tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs"
   ```

   Job 2 will later add the two-manager journey as one more step in `rules-emulator`.
3. **Prove it locally.** Run `npm run test:contracts` and `npm run test:ops` again with the new file present (some contracts read every workflow file). Then, if Java 21+ and the emulator CLI work in your terminal, run the "Build the composed production Rules" commands and at least the lifecycle and pair emulator commands exactly as written. Record the last lines.
4. **Safety grep.** Run `grep -nE "deploy|secrets\.|google-github-actions|firebase-tools.*--project [^d]|branches: *\[?main" .github/workflows/validate-gameplay-fast.yml`. It must print nothing. Record that.
5. **Push and prove on GitHub.** Push `gameplay/job-01-fast-ci`. The push itself triggers the new workflow. Wait for "Validate Gameplay Fast" to finish on your exact head commit. Record the run URL, the head SHA and each job's result. If a job fails, read its log, fix the cause (never by skipping or deleting a check), push again, and record both runs. Then open the PR into `gameplay/recovery-v1`.
6. **Finish.** Fill the Done checklist in the status file, set State: DONE with the branch, head SHA, PR link and the green run URL, push `Job 1 done: Fast gameplay CI`.

> **Trap (checked by the lead):** `npm run test:contracts` rewrites `firestore.spark.generated.rules` **without** the persistent-pair fragment. Always rebuild with both build scripts after running the contracts and before any emulator run, or the pair tests fail with `PERMISSION_DENIED … false for 'create' @ L2428`. In CI the jobs are separate, so this only bites locally.

## 5. Tests first

The workflow is the test. Step 5's green run on your exact head is the proof. Do not edit any existing test to make it pass.

## 6. Done checklist (PASS/FAIL with one line of evidence each, in the status file)

- [ ] "Validate Gameplay Fast" is green on the exact head SHA of `gameplay/job-01-fast-ci` (run URL).
- [ ] `npm run test:contracts` and `npm run test:ops` pass locally with the new file.
- [ ] Safety grep printed nothing: no deploy, no secrets, no Google auth, only `demo-` projects, not triggered on `main`.
- [ ] Only `.github/workflows/validate-gameplay-fast.yml` changed on the code branch.
- [ ] PR open into `gameplay/recovery-v1` (not `main`); nothing merged; nothing pushed to `main`.
- [ ] No Firebase billing, settings or SDK scopes touched.

## 7. When stuck

If the same step fails twice for the same reason, stop. Set State: BLOCKED, paste the failing log lines and what you tried into the status file, push, and reply "Job 1 is blocked: <one line>". If you cannot push, give Nik `JOB-01.zip` as the factory rules say.
