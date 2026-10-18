# Status · JOB-03 · Pure shared career model + tests

State: DONE
Step: 7 of 7
Updated: 2026-10-02 09:35 UTC
Chat: Sol Work mode (job 3, 7145c50ad396)
Code branch: gameplay/job-03-career-model
Head commit: b63ba1887b44d66300e03ec312a0701353cb2d91
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/316 (ready for review)
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/36990198831 (success, exact head b63ba1887b44d66300e03ec312a0701353cb2d91)

## Notes
- Step 1: Baseline at fb28e70: npm ci exit 0; PASS POS10 selected deterministic census (96/96 current blocking contracts: frozen POS10 floor + POS20 supplements). Integration baseline contains Job 1 CI; the pre-created job branch retains its earlier base.
- Step 2: Exact helper copied; node tests/support/career-fixture-helpers.cjs prints 2 11 1 playerTwo. Connector write succeeded; code branch retains its original base (fast CI not yet on base).
- Step 3: All 16 required cases written before implementation; node contract exits 1 with Error: 1. Bonus caps: not implemented. Tests-first commit 5f8d2377bf3e26fef033e2d230434bcf6c97d8f1.
- Step 4: Implemented pure frozen career model and tiebreak API; all 16 cases pass, including browser/Node agreement, abandoned exclusion and integrity failures.
- Step 5: Added agreement case: both managers' 17 shared fields and careerPoints exactly match verified projection records; contract PASS (17/17 cases).
- Step 6 (unfinished): Required registry entry appended and pushed; contract model 17/17 PASS; full suite 96/97 and operations 72/73 due two inherited assertions incompatible with this job. Draft PR #316 is open. State BLOCKED; step 7 not started.

- Step 6 resumed: Lead-authorized two exact registry updates saved at b63ba1887b44d66300e03ec312a0701353cb2d91; local operations PASS (73/73); full contracts and exact-head CI under verification. Prior failure notes above are historical.

- Step 6: Both lead-approved updates complete; exact-head Validate Gameplay Fast is green, including 97/97 contracts, 73/73 operations and every composed Rules emulator matrix. PR #316 contains the expected six files.

- Step 7: Done checklist completed; all required checks green on b63ba1887b44d66300e03ec312a0701353cb2d91; PR #316 ready for Team G lead review. Nothing merged or deployed.

## Self-check
- PASS Tests first: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/commit/5f8d2377bf3e26fef033e2d230434bcf6c97d8f1 has the 16-case contract and throwing stub; observed Error: 1. Bonus caps: not implemented. All 17 cases now pass.
- PASS Cases: all 16 required blocks plus both-manager agreement against verified Shared History managerRecords are present and pass (17/17).
- PASS Full contracts: exact-head GitHub job 110784366560 logs PASS POS10 selected deterministic census (97/97 current blocking contracts: frozen POS10 floor + POS20 supplements).
- PASS Operations: exact-head GitHub job 110784366560 logs tests 73, pass 73, fail 0. Local operations also passed 73/73.
- PASS CI: Validate Gameplay Fast completed successfully on b63ba1887b44d66300e03ec312a0701353cb2d91; https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/36990198831 . Product contracts, operations and all composed Rules matrices are green; demo project ids only.
- PASS Scope: exactly six PR files (four original job files plus two narrowly authorized test compatibility edits). Lead approval below explicitly permits these edits. statistics-architecture.cjs changes only its expected list/message; pos20-control-plane.test.mjs adds one constant and its final expected-list entry. No screen, index.html, service worker or Rules edit.
- PASS Purity: source forbidden-token checks, unchanged caller input, fake local storage isolation, nested freezing and browser/Node equivalence pass; model managers are daniel and nik.
- PASS PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/316 is open and ready for review into gameplay/recovery-v1 at b63ba1887b44d66300e03ec312a0701353cb2d91. Main untouched; nothing merged or deployed.

## Blocked question
None outstanding. The two inherited test blockers are resolved by the lead's authorization below; the original question and answer are retained as history.

Team G lead: may the scope include narrow compatibility updates to tests/contracts/statistics-architecture.cjs:64 (allow the required shared model alongside the existing local engine, preserving its screen and lazy-loading assertions) and tests/operations/pos20-control-plane.test.mjs:70-74 (add the required career contract to the exact expected registry list)? Alternatively, please apply those two changes on integration and refresh this job branch with Job 1 CI. Job 3 forbids editing either file or weakening existing tests, so the required 97/97 contracts and operations PASS cannot be achieved within its current four-file scope. No further unchanged-failure retries will be made.

Lead answer (2026-10-02 09:32 UTC): Yes, both edits are in scope. They are registry updates the lead missed in the job file, not weakened tests:
1. `tests/contracts/statistics-architecture.cjs:64`: change the expected list to `['analytics.js', 'sharedCareerAnalytics.js']` and the message to `'Only the local analytics engine and the shared career model may exist.'`. Change nothing else in that file.
2. `tests/operations/pos20-control-plane.test.mjs`: add `const sharedCareerAnalyticsContract='tests/contracts/shared-career-analytics-contracts.cjs';` next to the other constants and append it as the last item of `expectedSupplementalContracts`. Change nothing else.
The lead also merged gameplay/recovery-v1 into gameplay/job-03-career-model (39d0d48), so "Validate Gameplay Fast" now runs on your pushes. Pull the branch head before your next save. Then finish step 6 (97/97, ops fail 0, green fast CI on your exact head) and step 7; PR #316 then lists six files, which is expected.
