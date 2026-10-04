# Status · JOB-30 · G-13 part 2g: Rule Book and Settings

State: IN PROGRESS
Step: 3 of 6
Updated: 2026-10-04 23:02 UTC
Chat: Sol Work mode
Code branch: gameplay/job-30-v10-rules-settings
Head commit: fe741a6231ca17da1e172d61275d9aaa19f99b33
PR: none yet
CI run: pending on 32617fdc50b853270290467b76a0fef2d069c61e

## Notes
- Step 1: Read current boot, handbook, job, COMMON, pinned package/truth/build sources, data contract and foundation PR #349 API.
- DEFAULT: JOB-30 explicitly allows starting from job 24 while its PR is open; fast-forwarded job branch to latest foundation 7c1e284.
- Step 2: Added 12 numbered contracts and POS20 registration before implementation; red output: MODULE_NOT_FOUND js/rulesSettingsV10.js.
- Rule wording differences: none. Pinned Team V fixtures match all six app sections and scoring rows; implementation retains original nodes and text.
- OBSERVE: main 8abc561; recovery fb0dd02; foundation POS20 run 37240965858 success. Old POS20 recorded heads are stale; this work is only the authorized job branch. No SSJR/MDP credit.

- Step 3a: Binder skins original app nodes; all controls, hidden recovery panels and handlers stay with their existing owners. Credits use required text/links. Lazy hooks only.

- Step 3b: Native modal registrations use overlay:true; screen and modal CSS stay enabled together, close disables only modal styles. Real loader contracts pass; no duplicate mounts after async close.

## Self-check
- Tests-first red assertion saved.

## Model gaps
- None; Settings remains its native modal with live controls.

## Blocked question
