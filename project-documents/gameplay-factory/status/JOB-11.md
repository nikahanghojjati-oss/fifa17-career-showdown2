# Status · JOB-11 · Contract fixtures generated from the real model

State: IN PROGRESS
Step: 6 of 8
Updated: 2026-10-03 14:17 UTC
Chat: Sol Work mode (job 11, 83d4f3e64efe)
Code branch: gameplay/job-11-contract-fixtures
Head commit: 554c5b6cafd3362143f7363b75f842bca09e4c45
PR: 
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37128651006

## Notes
- Step 1: Dependencies JOB-03 and JOB-05 DONE and merged. Branch starts at recovery-v1 843e64e27cac65822881db4d7302c64fd433ff4e (JOB-08 included). npm ci exit 0; Node v24.19.0; baseline contracts 103/103, operations 73 pass / 0 fail. Baseline exact-head Validate Gameplay Fast green: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37125870168 . Connector writes available.
- Step 2: Read DATA_CONTRACT_V1, G2V-005 and Team V JOB-104. Rechecked all listed modules, helpers, clubs and persistent provider. All referenced line numbers match: adapter inspect 20, guard 48, career 130, builder 141, results 147; career 104/seasonRow 66; startJoin 101/nav 139/text 17; seam 104; persistent unpaired shape 148. Bug reproduction prints unavailable for signed-in Daniel with real null managerRole/managerId pair state. No source drift beyond the already-recorded JOB-08 registry append.
- Step 3: Appendix B contract and Appendix D registry/ops append saved at a1d3df6a2ee1f1715ec74d09e97d2a67e37197b7. node --check PASS, local K1 red (+ unavailable / - none), ops 73/0. Exact-head CI https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37128651006 fails only the new contract at K1 (1/104 failed); Composed Rules on the emulator SUCCESS. Tests-first proof complete.
- Step 4: Applied Appendix C's one condition only. Syntax PASS. Existing adapter contract PASS (19/19 cases). Step 2 reproduction now prints none. New contract reaches the expected MODULE_NOT_FOUND: Cannot find module '/workspace/scratch/83d4f3e64efe/job11/tests/support/data-contract-v1-fixtures.cjs'. Saved fcfed2edff5c2e9cfe0d51d0fdbf2c6fdd53dd5f.
- Step 4 CI: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37128872589 on fcfed2edff5c2e9cfe0d51d0fdbf2c6fdd53dd5f reproduces only the expected missing-generator failure (1/104 failed).
- Step 5: Appendix A generator copied exactly; node --check PASS. Contract reaches FAIL K2 committed fixtures equal a fresh run of the generator: fixtures drifted from the model. Generator --check reports DRIFT missing index.json plus nav and 14 scenarios (all 16 absent, as intended). Saved generator head d959605adeb2ebe6f8a1ff13b4be9e55849eb2c4.
- Step 5 CI: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37128943248 on d959605adeb2ebe6f8a1ff13b4be9e55849eb2c4 fails only the expected K2 missing-fixtures assertion (1/104 failed).
- Step 6: --write WROTE 16 fixture files. --check OK 16 fixture files match the model. Contract PASS (31 checks, 14 scenarios + nav). index.json and all 15 SHA256 rows exactly match Appendix E despite JOB-08 base. Saved 15 scenario/nav files byte-exact through connector blobs, then index.json last. Generated head 554c5b6cafd3362143f7363b75f842bca09e4c45. No fixture hand edits.

## Self-check


## Blocked question

