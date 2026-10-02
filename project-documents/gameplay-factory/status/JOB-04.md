# Status · JOB-04 · Renderer seams: screens take a model, never the local path

State: IN PROGRESS
Step: 5 of 7
Updated: 2026-10-02 22:06 UTC
Chat: Sol Work mode (2230aaf674be)
Code branch: gameplay/job-04-renderer-seams
Head commit: bd62944969195fd0b0954ef97cd57cbfc7ecb415
PR:
CI run:

## Notes
- Step 1: Job 3 model exists on gameplay/recovery-v1; baseline cfffd4a7d6ce9420262c55aa0484ba0f12a4e069. npm ci exit 0; contracts 100/100; operations 73/73, fail 0. Later merged jobs increased the baseline census above the job's original 97. Public git clone/read works; saving uses the GitHub connector as instructed.

- Step 2: Exact fake DOM helper copied; smoke command prints ok 1.

- Step 3: All 17 prescribed test blocks written before implementation; throwing seam stub gives exit 1: Error: 1. Request normalising: not implemented. Tests-first commit db7adf3b18ed44bfc9145c429c4de2671296b547.

- Step 4: Implemented frozen pure seam, exact text and row mappings, manager order, safe malformed-model handling and text-only DOM painting. Cases 1-10 and 17 PASS (11/11).

- Step 5: Renderer edits and open-function forwarding saved at bd62944969195fd0b0954ef97cd57cbfc7ecb415; all 17 seam cases pass locally. GitHub Gameplay contracts job 111048865553 ran npm run test:contracts (99/99) and npm run test:ops (73/73, fail 0) successfully on this exact head. Local long-suite captures ended without the final census; CI is the complete proof. Only the prescribed lazy renderer and cache lines changed.

## Self-check

## Blocked question
