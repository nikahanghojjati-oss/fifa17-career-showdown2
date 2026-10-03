# Status · JOB-12 · Composed production Rules regression

State: NOT STARTED
Step: 0 of 8
Updated: 2026-10-03 14:40 UTC
Chat:
Code branch: gameplay/job-12-composed-rules-regression
Head commit:
PR:
CI run:

## Notes
- Lead: JOB-07 (PR #325) and JOB-08 (PR #326, merge 843e64e) are merged. Lead decision: G-12 runs after JOB-10 merges (depends_on 7, 8, 10) so the reviewed Rules delta is written once against the final pre-gate Rules; §4.7 re-bases the delta fixture on G-10. Lead to create code branch gameplay/job-12-composed-rules-regression from gameplay/recovery-v1 after JOB-10 merges. Lead reference run on 843e64e: new contract 10/10, contracts 104/104, ops 73/0; composed regression PASS 46 numbered checks (15 composed suites incl. lifecycle 5/10, 8 Phase B temp-copy runs, gap suite 69/69 in both phases) on sha256 cdae7f5d…b38ac141, git blob 2be6c0c5…62fb2b52f6; production main 2e0bd45 composes sha256 ce8abfe6…0426f6a78 (git blob 6fe04a8e…94c1cc65); delta 7 hunks, -6 +204 lines, all G-7/G-8; only budget diagnostics are the two known career-index D13 denials. Jobs 9, 10, 11, 16 and 18 also append registry entries or CI steps: whoever merges later re-appends last. Waits for job 10.

## Self-check

## Blocked question
