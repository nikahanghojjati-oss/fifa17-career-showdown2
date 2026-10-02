# Status · JOB-04 · Renderer seams: screens take a model, never the local path

State: IN PROGRESS
Step: 4 of 7
Updated: 2026-10-02 22:04 UTC
Chat: Sol Work mode (2230aaf674be)
Code branch: gameplay/job-04-renderer-seams
Head commit: 01a0407cf72a3fe804679d7e4e17c4196ba7527e
PR:
CI run:

## Notes
- Step 1: Job 3 model exists on gameplay/recovery-v1; baseline cfffd4a7d6ce9420262c55aa0484ba0f12a4e069. npm ci exit 0; contracts 100/100; operations 73/73, fail 0. Later merged jobs increased the baseline census above the job's original 97. Public git clone/read works; saving uses the GitHub connector as instructed.

- Step 2: Exact fake DOM helper copied; smoke command prints ok 1.

- Step 3: All 17 prescribed test blocks written before implementation; throwing seam stub gives exit 1: Error: 1. Request normalising: not implemented. Tests-first commit db7adf3b18ed44bfc9145c429c4de2671296b547.

- Step 4: Implemented frozen pure seam, exact text and row mappings, manager order, safe malformed-model handling and text-only DOM painting. Cases 1-10 and 17 PASS (11/11).

## Self-check

## Blocked question
