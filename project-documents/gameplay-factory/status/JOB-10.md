# Status · JOB-10 · Transfer history, completed only

State: IN PROGRESS
Step: 1 of 8
Updated: 2026-10-03 15:17 UTC
Chat: Sol Work mode
Code branch: gameplay/job-10-transfer-history
Head commit: e44b6959310cfddf4bc1b4bd6275256f3e61ad41
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37130995554

## Notes
- Lead: JOB-08 (PR #326, merge 843e64e) is merged. Lead to create code branch gameplay/job-10-transfer-history from gameplay/recovery-v1 at 843e64e before Nik starts the job. Lead reference run on 843e64e: new contract PASS, contracts 104/104, ops 73/0, every rules-emulator step PASS including the new Completed transfer history matrix (73 checks) and Completed-only read 56 with B8/B9 flipped; only budget diagnostics are the two known career-index D13 denials. Jobs 9, 11, 16 and 18 also append registry entries (9 also a rules-emulator step, 16 a CI job): whoever merges later re-appends last. Ready to start.

- Step 1 started: JOB-08 DONE and merged. Code branch and current recovery-v1 both e44b6959310cfddf4bc1b4bd6275256f3e61ad41. Baseline CI 37130995554 is green, including Completed-only read matrix. JOB-11 and fresh-start fix PR #328 merged since 843e64e; JOB-09/16/18 not merged. Local isolated checkout prepared; npm ci and baseline suites next. DEFAULT: use current updated baseline; retain JOB-11 registry ordering.

- Step 1 complete: npm ci PASS (21 packages); baseline npm run test:contracts PASS 104/104; npm run test:ops PASS 73 / fail 0 on isolated e44b6959310cfddf4bc1b4bd6275256f3e61ad41 checkout. Baseline Validate Gameplay Fast 37130995554 SUCCESS; both jobs and Completed-only read matrix SUCCESS. No code files changed. Next: step 2 read-first mapping, split into small saved parts as needed.

- Step 2a saved (Rules map): four read-first files checked on e44b695; no line drift. Transfer season/public keys/private keys/private-readable at 6/37/238/305, match/roles at 313/319; season-results transfer helper 14 and completed + both lock lists 43-58; completed witness/season helpers 314/344, end marker 349; injector season-commit seam 53, required list 54, exact-count gate 105. DEFAULT: preserve existing active-transfer read rule and all writes; closed roles will use the stricter COMPLETED + both-role lock predicate in Appendix A. Remaining step 2: provider/protocol/reader, JOB-08 tests, ops and authority mapping; composed seam build.

## Self-check
- PASS baseline: exact current recovery head e44b6959310cfddf4bc1b4bd6275256f3e61ad41; contracts 104/104 (JOB-11 adds one), operations 73/0; CI https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37130995554 green including Completed-only read matrix. After adding G-10 expected contracts 105/105 unless another job merges.

## Blocked question
