# Status · JOB-09 · Closed-Showdown adapter into the career model

State: IN PROGRESS
Step: 2 of 7
Updated: 2026-10-03 15:05 UTC
Chat: Sol Work mode (job 9, 04fd13bb5a42)
Code branch: gameplay/job-09-closed-adapter
Head commit: 37d7d543a6a00712e3a8ae8e016ea5a4e8bcdbd1
PR:
CI run: CI pending on 37d7d543a6a00712e3a8ae8e016ea5a4e8bcdbd1 (step 3a test files saved; registry and CI step follow in step 3b)

## Notes
- Lead: JOB-03 (PR #316) and JOB-08 (PR #326, merge 843e64e) are merged; JOB-05 and JOB-07 too. Lead to create code branch gameplay/job-09-closed-adapter from gameplay/recovery-v1 at 843e64e before Nik starts the job. Lead reference run on 843e64e: new contract 22/22, contracts 104/104, ops 73/0, every rules-emulator step PASS including the new Closed-Showdown adapter journey (12 checks); only budget diagnostics are the two known career-index D13 denials. Jobs 11, 16 and 18 also append registry entries: whoever merges later re-appends last. Ready to start.

- Step 1: Dependencies JOB-03, JOB-08 and JOB-11 DONE and merged. Job branch fast-forwarded without merge/force to recovery-v1 372b3b75fd0cf36b88d8241674fd69d7c8196091, which includes JOB-11 merge 372b3b7 after JOB-08 843e64e. npm ci exit 0; Node v24.19.0; local contracts 104/104. Local ops exit 0 but no final census; exact-head baseline CI logs tests 73 / pass 73 / fail 0. Validate Gameplay Fast 37129924697 SUCCESS; every emulator step including Completed-only read matrix SUCCESS. Connector write access verified with fast-forward; no merge, deploy or main write.

- Step 2a checkpoint: Read DATA_CONTRACT_V1 sections 0/6/7/8 and career model, active adapter and completed reader. Required source lines verified: career verified 33 / uniqueEntries 50 / buildCareerModel 104 / interim option 105; active inspect 20 / career 130 / careerInput 146; reader state 42 / read 132 / not-closed 142 / abandoned 145 / API 178. JOB-11 changes active guard 48 only; no observed line drift. Adapter/loader absent; fixture smoke prints CLOSED 5 playerOne SHOWDOWN_COMPLETE. DEFAULT: split step 2 into saved parts to honor four-file read limit; step stays 1 until all required references are checked.

- Step 2b checkpoint: Checked persistent index client, active adapter contract and both unchanged fixture helpers. Index references match pairReadCareerIndexWith 64 / pairReadCareerIndex 66 / active replacement guard 126; reads head then sealed pages, returns pages before head in career order, rejects duplicate ids and never throws outward. Existing fixture helpers build verified projections and real Terminal Close intents; contract uses borrowed-projection freeze checks, immutable caller assertions and browser vm agreement. Still to read: emulator pairing/play/abandon patterns, ops registry lines, S2C-005R2 and lead handoff authority. No code changes; step 2 remains incomplete.

- Step 2: All read-first references checked. Journey lines 99/127/206 match; ops completedShowdownReadContract stays 72 and expectedSupplementalContracts moved 76 -> 77 because JOB-11 appended its entry. Read lead handoff sections 3/5 and S2C-005R2 sections 2/5. DEFAULT: ruling is absent on leads/relay (404); used the exact visual/cinematic-system-v10 archive path linked by the handoff, solely for the job-required authority. Counting, no backfill, account-scoped memory cache and no new read paths confirmed. Fixture smoke PASS CLOSED 5 playerOne SHOWDOWN_COMPLETE; both new modules remain absent. Step 2 complete.

- Step 3a checkpoint: Copied Appendix C contract (313 lines) and Appendix D emulator journey (246 lines) verbatim; node --check both PASS. Local contract fails exactly MODULE_NOT_FOUND: Cannot find module /workspace/scratch/04fd13bb5a42/job9/js/sharedClosedShowdownAdapter.js. Both text files saved through connector. Step 3 still incomplete: Appendix E registry/ops/workflow changes and tests-first exact-head CI evidence are next. Implementation files remain absent; no existing assertion changed.

## Self-check

## Blocked question
