# Status · JOB-09 · Closed-Showdown adapter into the career model

State: IN PROGRESS
Step: 1 of 7
Updated: 2026-10-03 14:50 UTC
Chat: Sol Work mode (job 9, 04fd13bb5a42)
Code branch: gameplay/job-09-closed-adapter
Head commit: 372b3b75fd0cf36b88d8241674fd69d7c8196091
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37129924697 (baseline SUCCESS, exact recovery head 372b3b7)

## Notes
- Lead: JOB-03 (PR #316) and JOB-08 (PR #326, merge 843e64e) are merged; JOB-05 and JOB-07 too. Lead to create code branch gameplay/job-09-closed-adapter from gameplay/recovery-v1 at 843e64e before Nik starts the job. Lead reference run on 843e64e: new contract 22/22, contracts 104/104, ops 73/0, every rules-emulator step PASS including the new Closed-Showdown adapter journey (12 checks); only budget diagnostics are the two known career-index D13 denials. Jobs 11, 16 and 18 also append registry entries: whoever merges later re-appends last. Ready to start.

- Step 1: Dependencies JOB-03, JOB-08 and JOB-11 DONE and merged. Job branch fast-forwarded without merge/force to recovery-v1 372b3b75fd0cf36b88d8241674fd69d7c8196091, which includes JOB-11 merge 372b3b7 after JOB-08 843e64e. npm ci exit 0; Node v24.19.0; local contracts 104/104. Local ops exit 0 but no final census; exact-head baseline CI logs tests 73 / pass 73 / fail 0. Validate Gameplay Fast 37129924697 SUCCESS; every emulator step including Completed-only read matrix SUCCESS. Connector write access verified with fast-forward; no merge, deploy or main write.

## Self-check

## Blocked question
