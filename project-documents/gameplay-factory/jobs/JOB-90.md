# JOB-90 · Factory smoke test (Work lane)

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **work** (Sol Work mode, press Use Work, started with the starter line in RULES.md) | nothing | 6 | `gameplay/job-90-smoke-work` (test only, already created, never merged) | none | no |

## 1. Goal

Prove whether Sol Work mode can run Team G's real test tools: git, node 24, `npm ci`, Java, the Firebase emulator, an existing emulator proof and the contract suite. Jobs 1, 2 and 3 and every Rules job need this. If Work mode cannot, those jobs switch to the CI path (workers commit, GitHub runs the tests), so knowing early saves Nik's limited Work allowance.

## 2. Branches and files

- Status and results go to `factory/gameplay-v1`.
- Test code branch: `gameplay/job-90-smoke-work` (the lead already created it from `gameplay/recovery-v1`).
- Files you may create: `project-documents/gameplay-factory/smoke/CAPABILITIES_WORK.md` and `project-documents/gameplay-factory/status/JOB-90.md` on `factory/gameplay-v1`; on `gameplay/job-90-smoke-work` only `project-documents/gameplay-factory/smoke/work-branch-test.md`.

## 3. Rules that apply

- Never push to `main`, never merge, never force-push, never delete anything.
- Never deploy. Emulator project ids start with `demo-`. Never log in to Firebase or Google.
- Stay inside the files above.

## 4. Steps

After each step update `status/JOB-90.md` and save it to `factory/gameplay-v1` with the message `Job 90 step k/6: <step name>`. Record the exact command output (last lines) for every check.

1. **Repo read and write.** Read `project-documents/gameplay-factory/BOARD.md` on `factory/gameplay-v1` and copy its first line into the notes. Then save the status file. Record how you read and wrote (terminal `git`, or the GitHub connector).
2. **Clone and push.** In the terminal: `git clone --depth 1 --branch gameplay/job-90-smoke-work https://github.com/nikahanghojjati-oss/fifa17-career-showdown2.git cms && cd cms`. Add `project-documents/gameplay-factory/smoke/work-branch-test.md` (one line: "work branch test"), commit, and `git push origin gameplay/job-90-smoke-work`. Record YES/NO and the error if any. If the push fails but the connector can write, save the same file with the connector and record that.
3. **Runtimes.** Run and record: `node --version` (need 24 or newer), `npm --version`, `java -version` (need 21 or newer), `git --version`. Then run `npm ci` in the clone and record whether it reached the registry. Also record whether this chat has any web browser tool (expected: no).
4. **Contract suite.** Run `npm run test:contracts`. Passing output ends with `PASS POS10 selected deterministic census (96/96 current blocking contracts: frozen POS10 floor + POS20 supplements).` Record the last line and the time it took.
5. **Firebase emulator.** Run, in this order:
   ```
   npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0
   node scripts/build-production-firestore-rules.mjs
   node scripts/build-production-firestore-rules-with-persistent-pair.mjs
   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-smoke "node -e 'console.log(1)'"
   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-smoke-pair "node tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs"
   ```
   The last one passes with a line starting `PASS persistent pair Rules emulator:`. Record each result. (Run the two build scripts **after** `npm run test:contracts`, because the contracts rewrite the generated Rules file without the pairing rules.)
6. **Verdict.** Write `project-documents/gameplay-factory/smoke/CAPABILITIES_WORK.md`: a table with rows repo read, git push, connector write, node ≥ 24, npm registry, Java ≥ 21, contract suite, emulator start, pair emulator proof, browser; each YES or NO with the evidence line. On its first line write one verdict: **WORK RUNS EVERYTHING** (all YES except browser), **WORK NO EMULATOR** (contracts run, emulator does not), **WORK NO NPM** (cannot install; CI path for all code jobs), or **WORK NO PUSH** (runs tests but cannot save; zip or connector). Save, set State: DONE, finish with `Job 90 done: Factory smoke test (Work lane)`.

## 5. Tests first

None; this job makes no product change.

## 6. Done checklist (PASS/FAIL with evidence in the status file)

- [ ] Every capability row has YES/NO and the evidence line.
- [ ] Only the files in section 2 changed.
- [ ] Nothing pushed to `main`; nothing merged; nothing deployed; no Firebase login.
- [ ] Status file shows State: DONE with the verdict copied in.

## 7. When stuck

A missing tool is a result, not a blocker: record it and continue with the next step. Set BLOCKED only if you cannot read the repo at all.
