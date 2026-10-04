# Status · JOB-28 · G-13 part 2e: Rivalry Statistics and Legacy (History)

State: IN PROGRESS
Step: 3 of 5
Updated: 2026-10-04 22:40 UTC
Chat: Sol Work mode
Code branch: gameplay/job-28-v10-history
Head commit: 07e4026605a02abd59a6e81be8e179e7cae5149c
PR: none yet
CI run: pending implementation

## Notes
- Step 1: Source audit: rules, handbook, COMMON, pinned truth/build notes, NAV/data contract and job 24 API.
- Step 2: Saved and registered failing tests first.
- Step 3: Pure mappings saved; RL1–RL7 pass.
- Step 4a: Pinned renderer CSS/JS, live boot hooks, strings-only dictionaries, plate maps and referenced existing WebP objects saved. Text precached; images use foundation runtime cache. Binding follows in 4b.
- DEFAULT: Semantic rivalryStatistics registers on existing statistics route. Preserve data-src1x/data-src2x actually read by stage.js.

## Self-check
- Renderer JS syntax checks pass; mapping RL1–RL7 pass.

## Model gaps
- No transfer summary in the career model; show Unavailable.

## Blocked question
