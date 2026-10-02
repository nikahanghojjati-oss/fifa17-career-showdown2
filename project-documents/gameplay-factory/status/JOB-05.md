# Status · JOB-05 · Active Showdown adapter (Rivalry, Continue, tiebreak, final state)

State: IN PROGRESS
Step: 4 of 7
Updated: 2026-10-02 19:36 UTC
Chat: Sol Work mode (job 5, 82817ee4c652)
Code branch: gameplay/job-05-active-adapter
Head commit: b268db8f9c15f7ced36272b195365dae0fde5c95
PR:
CI run:

## Notes
- Step 1: Job 3 merged (#316); code branch matches integration at 4491e36. npm ci exit 0; contracts PASS census 97/97; operations pass 73, fail 0. Node v24.19.0. Connector saves; CI will supply emulator proof.

- Step 2: Exact fixture copied; node tests/support/active-showdown-fixtures.cjs prints CLOSED 5 playerOne SHOWDOWN_COMPLETE.

- Step 3: All 18 cases saved with throwing stub; observed Error: 1. Left/right: not implemented. Tests-first commit 2db6265d720437d78caeea2f5f19578a01f552af.

- Step 4: All 18 contract cases PASS. Adapter verifies provider projections and close witnesses, maps fixed manager roles, hides unpublished rival inputs, and freezes owned copies without changing caller data.

## Self-check

## Blocked question
Lead question (continuing under job section 9): Case 8 forbids ids anywhere in aggregate output, but careerInput must retain P identity and P contains account/profile/save ids. Case 18 requires frozen outputs plus an unfrozen caller P with identical identity; freezing P is explicitly forbidden. Case 10 says model partial for unavailable classification, while section 4 requires indexStatus unavailable/showdowns [] and job 3 returns unavailable. Tests enforce no private fields in screen views, no unrevealed sentinel in any output, unchanged/unfrozen borrowed P, frozen owned outputs, and section 4's exact careerInput/model unavailable. Please confirm these interpretations; no dependency edits are made.
