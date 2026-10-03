# Status · JOB-08 · Completed-only read grant + session-free reader

State: IN PROGRESS
Step: 4 of 8
Updated: 2026-10-03 13:05 UTC
Chat: Sol Work mode
Code branch: gameplay/job-08-completed-read
Head commit: e827ace71bae43dc5f3cd41f5dfa9ddb20ed9a81
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37124801380

## Notes
- Lead: JOB-07 merged (PR #325, merge 889810f). Lead to create code branch gameplay/job-08-completed-read from gameplay/recovery-v1 at 889810f before Nik starts the job. Lead reference run on 889810f: contracts 103/103, ops 73/0, every rules-emulator step PASS including Completed-only read 56 checks; only budget diagnostics are the two known career-index D13 denials. Ready to start.

- Step 1: JOB-07 is DONE and merged; job branch and recovery head both 889810f9e77efc09c79318cebe70d3d7f30676c9. npm ci PASS; local contracts 102/102; operations 73 pass / 0 fail. Exact baseline Validate Gameplay Fast 37122294996 SUCCESS; Career index matrix SUCCESS. All writes use the GitHub connector as instructed.

- Step 2: Read all required sources, S2C-005R2 D2 ruling, lead handoff D2 and DATA_CONTRACT sections 6/8. Read-first line observations match current 889810f (no drift). Composed baseline builds PASS: role get seam count 1, setup/results/commit seams 3; both KNOWN GAP 1 assertions present. Composed artifact 129241 bytes; not committed.

- Step 2: Step 3 tests-first files saved on 0108614dd8c3f9d949b20fbac6722ccfa7401a4f. Appendix C/D/E applied verbatim; node --check both new tests PASS. Local contract fails MODULE_NOT_FOUND for js/sparkCompletedShowdownReader.js as required. Waiting for exact-head red CI evidence before completing step 3.

- Step 3: Tests-first exact-head CI https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37124538984 on 0108614dd8c3f9d949b20fbac6722ccfa7401a4f: contract fails only missing reader (1/103); every existing emulator step SUCCESS; Completed-only read matrix fails at I0, 0 !== 1 (no grant). No existing assertion changed.

- Step 3: Step 4 client saved verbatim from Appendix B on e827ace71bae43dc5f3cd41f5dfa9ddb20ed9a81. node --check PASS; local contract passes K1-K6 and fails K7: data.connectionState == 'closed', as required before Rules grant. Waiting for its exact-head emulator I0 failure before completing step 4.

- Step 4: Appendix B reader saved on e827ace71bae43dc5f3cd41f5dfa9ddb20ed9a81. node --check PASS; local and CI contract pass K1-K6 and fail K7 at data.connectionState == 'closed'. CI 37124801380: every prior emulator step PASS, Completed-only read matrix still fails I0 0 !== 1, as expected before Rules.

## Self-check

## Blocked question
