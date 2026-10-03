# Status · JOB-12 · Composed production Rules regression

State: IN PROGRESS
Step: 1 of 8
Updated: 2026-10-03 17:20 UTC
Chat: Sol Work mode (job 12, 265263c2f906)
Code branch: gameplay/job-12-composed-rules-regression
Head commit: 854bd3f0774b407f7f43e76553b37e68e17a363e (baseline, no code changes)
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37139649960 (SUCCESS, exact recovery baseline 854bd3f)

## Notes
- Step 1: baseline PASS on recovery-v1 854bd3f0774b407f7f43e76553b37e68e17a363e; the pre-created job branch has the identical head. npm ci succeeded; npm run test:contracts ends PASS POS10 selected deterministic census (109/109 current blocking contracts: frozen POS10 floor + POS20 supplements); npm run test:ops reports tests 73, pass 73, fail 0. Exact-head Validate Gameplay Fast 37139649960 completed SUCCESS. Dependencies 7, 8 and 10 are DONE; PR #332 is merged. Worktree clean, no code or generated Rules/logs staged.
- Step 1 ordering: JOB-11 merged as 372b3b7, JOB-18 as f7d18a1, JOB-09 as 87f4f91, JOB-10 as 854bd3f; JOB-16 is still IN PROGRESS and absent from baseline. Current registry ends data-contract-v1-fixtures, pair-code-entry-race, closed-showdown-adapter, shared-journey-rivalry-lookup, shared-season-results-stale-retry, completed-transfer-history. rules-emulator now has ten emulator steps: additions since 843e64e are Closed-Showdown adapter journey and Completed transfer history matrix; both must be discovered by the G-12 runner. Next: step 2 map and re-base the reviewed delta.
- Lead: JOB-10 is merged (PR #332, merge 854bd3f). Code branch gameplay/job-12-composed-rules-regression was cut from gameplay/recovery-v1 at 854bd3f. JOB-16 has not merged yet: whichever job merges later re-appends its registry entry last. Codex is currently out of review quota. If it is still out at step 8, post the request once, record it, and mark DONE; the lead will review in its place. Ready to start.
- Lead: JOB-07 (PR #325) and JOB-08 (PR #326, merge 843e64e) are merged. Lead decision: G-12 runs after JOB-10 merges (depends_on 7, 8, 10) so the reviewed Rules delta is written once against the final pre-gate Rules; §4.7 re-bases the delta fixture on G-10. Lead to create code branch gameplay/job-12-composed-rules-regression from gameplay/recovery-v1 after JOB-10 merges. Lead reference run on 843e64e: new contract 10/10, contracts 104/104, ops 73/0; composed regression PASS 46 numbered checks (15 composed suites incl. lifecycle 5/10, 8 Phase B temp-copy runs, gap suite 69/69 in both phases) on sha256 cdae7f5d…b38ac141, git blob 2be6c0c5…62fb2b52f6; production main 2e0bd45 composes sha256 ce8abfe6…0426f6a78 (git blob 6fe04a8e…94c1cc65); delta 7 hunks, -6 +204 lines, all G-7/G-8; only budget diagnostics are the two known career-index D13 denials. Jobs 9, 10, 11, 16 and 18 also append registry entries or CI steps: whoever merges later re-appends last. Waits for job 10.

## Self-check
- PASS step 1 baseline: local contracts 109/109, operations 73 pass / 0 fail, npm ci successful, clean worktree, exact-head recovery CI SUCCESS at the URL above. No main writes, merges or deployment.

## Blocked question
