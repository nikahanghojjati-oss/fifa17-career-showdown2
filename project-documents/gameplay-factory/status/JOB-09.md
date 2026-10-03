# Status · JOB-09 · Closed-Showdown adapter into the career model

State: IN PROGRESS
Step: 1 of 7
Updated: 2026-10-03 15:02 UTC
Chat: Sol Work mode (job 9, 04fd13bb5a42)
Code branch: gameplay/job-09-closed-adapter
Head commit: 372b3b75fd0cf36b88d8241674fd69d7c8196091
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37129924697 (baseline SUCCESS, exact recovery head 372b3b7)

## Notes
- Lead: JOB-03 (PR #316) and JOB-08 (PR #326, merge 843e64e) are merged; JOB-05 and JOB-07 too. Lead to create code branch gameplay/job-09-closed-adapter from gameplay/recovery-v1 at 843e64e before Nik starts the job. Lead reference run on 843e64e: new contract 22/22, contracts 104/104, ops 73/0, every rules-emulator step PASS including the new Closed-Showdown adapter journey (12 checks); only budget diagnostics are the two known career-index D13 denials. Jobs 11, 16 and 18 also append registry entries: whoever merges later re-appends last. Ready to start.

- Step 1: Dependencies JOB-03, JOB-08 and JOB-11 DONE and merged. Job branch fast-forwarded without merge/force to recovery-v1 372b3b75fd0cf36b88d8241674fd69d7c8196091, which includes JOB-11 merge 372b3b7 after JOB-08 843e64e. npm ci exit 0; Node v24.19.0; local contracts 104/104. Local ops exit 0 but no final census; exact-head baseline CI logs tests 73 / pass 73 / fail 0. Validate Gameplay Fast 37129924697 SUCCESS; every emulator step including Completed-only read matrix SUCCESS. Connector write access verified with fast-forward; no merge, deploy or main write.

- Step 2a checkpoint: Read DATA_CONTRACT_V1 sections 0/6/7/8 and career model, active adapter and completed reader. Required source lines verified: career verified 33 / uniqueEntries 50 / buildCareerModel 104 / interim option 105; active inspect 20 / career 130 / careerInput 146; reader state 42 / read 132 / not-closed 142 / abandoned 145 / API 178. JOB-11 changes active guard 48 only; no observed line drift. Adapter/loader absent; fixture smoke prints CLOSED 5 playerOne SHOWDOWN_COMPLETE. DEFAULT: split step 2 into saved parts to honor four-file read limit; step stays 1 until all required references are checked.

- Step 2b checkpoint: Checked persistent index client, active adapter contract and both unchanged fixture helpers. Index references match pairReadCareerIndexWith 64 / pairReadCareerIndex 66 / active replacement guard 126; reads head then sealed pages, returns pages before head in career order, rejects duplicate ids and never throws outward. Existing fixture helpers build verified projections and real Terminal Close intents; contract uses borrowed-projection freeze checks, immutable caller assertions and browser vm agreement. Still to read: emulator pairing/play/abandon patterns, ops registry lines, S2C-005R2 and lead handoff authority. No code changes; step 2 remains incomplete.

## Self-check

## Blocked question
