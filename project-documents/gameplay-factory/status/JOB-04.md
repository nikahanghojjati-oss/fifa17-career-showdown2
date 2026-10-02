# Status · JOB-04 · Renderer seams: screens take a model, never the local path

State: DONE
Step: 7 of 7
Updated: 2026-10-02 23:33 UTC
Chat: Sol Work mode (2230aaf674be)
Code branch: gameplay/job-04-renderer-seams
Head commit: 8986bae0e9229b918b3ea988a0045868d2450e50
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/322 (merged into gameplay/recovery-v1 as a11af48)
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37077871820 (success, exact head 8986bae0e9229b918b3ea988a0045868d2450e50); POS20 https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37077875338 (in progress)

## Notes
- Step 1: Job 3 model exists on gameplay/recovery-v1; baseline cfffd4a7d6ce9420262c55aa0484ba0f12a4e069. npm ci exit 0; contracts 100/100; operations 73/73, fail 0. Later merged jobs increased the baseline census above the job's original 97. Public git clone/read works; saving uses the GitHub connector as instructed.

- Step 2: Exact fake DOM helper copied; smoke command prints ok 1.

- Step 3: All 17 prescribed test blocks written before implementation; throwing seam stub gives exit 1: Error: 1. Request normalising: not implemented. Tests-first commit db7adf3b18ed44bfc9145c429c4de2671296b547.

- Step 4: Implemented frozen pure seam, exact text and row mappings, manager order, safe malformed-model handling and text-only DOM painting. Cases 1-10 and 17 PASS (11/11).

- Step 5: Renderer edits and open-function forwarding saved at bd62944969195fd0b0954ef97cd57cbfc7ecb415; all 17 seam cases pass locally. GitHub Gameplay contracts job 111048865553 ran npm run test:contracts (99/99) and npm run test:ops (73/73, fail 0) successfully on this exact head. Local long-suite captures ended without the final census; CI is the complete proof. Only the prescribed lazy renderer and cache lines changed.


- Step 6: Registered seam contract with exactly the prescribed registry entry and two operations edits. Final-head seam 17/17, contracts 100/100, operations 73/73, all emulator matrices PASS; CI https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37070727744. PR #322 open into gameplay/recovery-v1. Completion is BLOCKED on integration conflicts; step 7 not started.

- Step 6 resumed: Lead integration refresh 8986bae0e9229b918b3ea988a0045868d2450e50 preserves all seven seam/renderer/test/cache files byte-for-byte. Seam 17/17 PASS locally; exact-head Gameplay Fast PASS with contracts 101/101 and operations 73/73 plus all composed Rules emulator matrices. PR #322 now mergeable:true. POS20 is green except FULL and REMOTE still running; step 7 waits for those final checks.

## Self-check
- PASS Tests first: throwing stub and all required cases saved at https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/commit/db7adf3b18ed44bfc9145c429c4de2671296b547; observed exit 1, Error: 1. Request normalising: not implemented. Final contract PASS (17/17).
- PASS Full suites: exact-head GitHub job 111049892098 logs PASS POS10 selected deterministic census (100/100); operations tests 73, pass 73, fail 0. The job branch already includes jobs 5 and 6, so its census exceeds the original job's 98/99.
- PASS Validate Gameplay Fast: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37070727744 success on 11867307325a6ad24093c3c4c6e098fd7e8cea1c; Gameplay contracts and Composed Rules on the emulator both completed successfully, including two-manager journey. Demo project IDs only.
- PASS Scope: PR #322 lists exactly the nine files in section 2. Existing containment, analytics, startup scripts, index.html, CSS and Rules unchanged. The operations file has only one added constant and one appended array item; service-worker.js has only one cache line.
- PASS Online isolation: case 11 gives zero local analytics/archive/save/import spy calls for both managers and offline identity; a throwing currentShowdown getter proves renderers do not read it. Legacy creates no legacyDataControls.
- PASS Empty and manager order: case 4 restricts empty text to empty model status; case 6 validates all comparison mappings and painted DANIEL / NIK headers. Cases 7-10 verify abandoned and unavailable status-only rows, one-Showdown rivalry, identity-free screen text and malformed-model denial.
- PASS PR boundary: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/322 is open into gameplay/recovery-v1. No main write, merge, force push, deletion or deployment.
- PASS (lead) Merge readiness: after the lead refresh 8986bae, PR #322 was clean; Validate Gameplay Fast and Validate POS20 green on the exact head. Earlier note: GitHub live PR response is mergeable:false, mergeable_state:dirty at base cfffd4a7d6ce9420262c55aa0484ba0f12a4e069. New integration Job 12 and this job append to the same two registry files. Lead integration refresh is required; exact-head CI must be verified again after refresh before DONE.

## Blocked question
Team G lead: please refresh gameplay/job-04-renderer-seams with gameplay/recovery-v1 at cfffd4a7d6ce9420262c55aa0484ba0f12a4e069 (or the current integration head), preserving the nine Job 4 files and both jobs' registry entries. PR #322 is mergeable:false, mergeable_state:dirty. Job 12 landed after this job branch was cut and appends to the same supplemental registry and operations expected-contract array. The worker is forbidden to merge, and importing Job 12's new test/implementation lies outside Job 4's exact nine-file scope. Please apply the integration refresh; then this worker can re-read the head, verify green CI on the refreshed exact head and finish step 7. Do not change main or deploy.

### Lead answer (2026-10-02 22:30 UTC)
Done. The lead merged gameplay/recovery-v1 (cfffd4a, job 17) into gameplay/job-04-renderer-seams as commit 8986bae. Both registry entries and both expected contracts are kept (order: ...startJoinViewModel, careerScreenSeam, sharedSeasonResultsRace). The lead also corrected job 17's double-escaped registry patterns in that merge. Local checks on 8986bae: all contracts PASS 101/101, operations 73/73, career-screen-seam 17/17.
Next: re-read the branch head, wait for Validate Gameplay Fast and POS20 checks green on the exact new head, confirm PR #322 is mergeable, then finish step 7 and mark DONE. Your nine-file scope is unchanged; the extra files in the merge come from the integration branch.

### Lead close (2026-10-02 7:40 PM Boston time)
The lead finished step 7: all checks green on 8986bae, merged PR #322. Job 4 is DONE; this chat can stop.
