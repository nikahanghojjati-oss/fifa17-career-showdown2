# Status · JOB-03 · Pure shared career model + tests

State: BLOCKED
Step: 5 of 7
Updated: 2026-10-02 09:26 UTC
Chat: Sol Work mode (job 3, 7145c50ad396)
Code branch: gameplay/job-03-career-model
Head commit: 407e6d51d77e3cb039ff2c4b34b4443f1d4dbef5
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/316 (draft)
CI run: fast CI not yet on base

## Notes
- Step 1: Baseline at fb28e70: npm ci exit 0; PASS POS10 selected deterministic census (96/96 current blocking contracts: frozen POS10 floor + POS20 supplements). Job branch is untouched and will advance from the integration baseline containing Job 1 CI.
- Step 2: Exact helper copied; node tests/support/career-fixture-helpers.cjs prints 2 11 1 playerTwo. Connector write succeeded; code branch retains its original base (fast CI not yet on base).
- Step 3: All 16 required cases written before implementation; node contract exits 1 with Error: 1. Bonus caps: not implemented. Tests-first commit 5f8d2377bf3e26fef033e2d230434bcf6c97d8f1.
- Step 4: Implemented pure frozen career model and tiebreak API; all 16 cases pass, including browser/Node agreement, abandoned exclusion and integrity failures.
- Step 5: Added agreement case: both managers' 17 shared fields and careerPoints exactly match verified projection records; contract PASS (17/17 cases).
- Step 6 (unfinished): Required registry entry appended and pushed; contract model 17/17 PASS; full suite 96/97 and operations 72/73 due two inherited assertions incompatible with this job. Draft PR #316 is open. State BLOCKED; step 7 not started.

## Self-check
- PASS Tests first: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/commit/5f8d2377bf3e26fef033e2d230434bcf6c97d8f1 contains stub and all 16 cases; observed exit 1, Error: 1. Bonus caps: not implemented. Now the required 16 plus agreement pass (17/17).
- PASS Cases: all 16 required blocks and agreement test are present in tests/contracts/shared-career-analytics-contracts.cjs.
- FAIL Full contracts: 96 of 97 passed; statistics-architecture.cjs:64 rejects required sharedCareerAnalytics.js. First run also exposed helper-name collisions; those were fixed within the model, and static-app-release-contracts now passes. Repeated architecture failure is unchanged; no further correction attempted outside scope.
- FAIL Operations: 72 of 73 passed; tests/operations/pos20-control-plane.test.mjs:74 deepStrictEqual rejects the required supplemental registry entry.
- PASS CI availability recorded: fast CI not yet on base. Exact job branch lacks .github/workflows/validate-gameplay-fast.yml (connector 404). Job 1 is merged on integration but was not copied into the restricted branch.
- PASS Scope: PR #316 has exactly four changed files: js/sharedCareerAnalytics.js, tests/support/career-fixture-helpers.cjs, tests/contracts/shared-career-analytics-contracts.cjs, POS20_SUPPLEMENTAL_PRODUCT_TESTS.json. No screen, index.html, service worker or Rules file changed.
- PASS Purity: source token checks, unchanged caller input, fake local storage, deep freezing and browser/Node equivalence pass; manager keys are daniel and nik.
- PASS Review delivery: draft PR https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/316 targets gameplay/recovery-v1 at head 407e6d51d77e3cb039ff2c4b34b4443f1d4dbef5. Main untouched; nothing merged or deployed.

## Blocked question
Team G lead: may the scope include narrow compatibility updates to tests/contracts/statistics-architecture.cjs:64 (allow the required shared model alongside the existing local engine, preserving its screen and lazy-loading assertions) and tests/operations/pos20-control-plane.test.mjs:70-74 (add the required career contract to the exact expected registry list)? Alternatively, please apply those two changes on integration and refresh this job branch with Job 1 CI. Job 3 forbids editing either file or weakening existing tests, so the required 97/97 contracts and operations PASS cannot be achieved within its current four-file scope. No further unchanged-failure retries will be made.
