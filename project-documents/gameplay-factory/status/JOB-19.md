# Status · JOB-19 · Resume a Shared Showdown after reload; closed Showdowns stay on Home

State: DONE
Step: 3 of 3
Updated: 2026-10-04 00:57 UTC
Chat: lead (no worker chat)
Code branch: gameplay/job-19-reload-resume
Head commit: 36b5a07a2c66695ad8c45b29ca722ba5d168fffa
PR: #340
CI run: 16/16 checks green on 36b5a07

## Notes
- Step 1: Lead reproduced the bug and wrote the fix plus tests in a throwaway worktree on gameplay/recovery-v1 @ 0e11422.
- Step 2: Lead pushed gameplay/job-19-reload-resume and opened PR #340 into gameplay/recovery-v1. Waiting for exact-head Validate Gameplay Fast.
- Refresh: merged recovery (job 20) into the branch at 600c513; reload-resume contract kept last; contracts 113/113, ops 73/0. Waiting for exact-head CI.
- CI on 600c513: 34/34 journey checks passed but JZ failed on one self-retrying Reconnect warning (permission-denied on a progression read for one poll). Fix e6c9856: Reconnect reports that failure only if it repeats on the next poll; contract check F. Then 36b5a07 recorded the job 20 merge so the PR was clean.
- Step 3: All 16 exact-head checks green on 36b5a07 (browser journey with real J9 and strict J12). Lead merged PR #340 into gameplay/recovery-v1 at 3bff139.

## Self-check

## Blocked question
