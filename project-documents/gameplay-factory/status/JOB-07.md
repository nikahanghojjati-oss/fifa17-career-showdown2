# Status · JOB-07 · Career index Rules + client + emulator proofs

State: IN PROGRESS
Step: 6 of 9
Updated: 2026-10-03 00:00 UTC
Chat: Sol Work mode
Code branch: gameplay/job-07-career-index
Head commit:
PR:
CI run:

## Notes
- Lead: JOB-02 merged (4491e36). Code branch gameplay/job-07-career-index created from gameplay/recovery-v1. Ready to start.

- Step 1: Dependencies JOB-01 and JOB-02 are DONE and merged. Baseline recovery-v1 a11af482: npm ci succeeded; contracts 101/101; operations 73/73, fail 0; unchanged persistent-pair contract PASS. Exact baseline CI green: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37078432100. Terminal clone works; all writes use the connector per job.

- Step 2: Read job authority, data contract and all required sources. Persistent-pair fragment lines/markers and client seams match. Drift: journey witness begins 85 (was 84); now2/now3 use Date.now from JOB-02 fix. Registry/ops now include G-4/G-5/G-6 and season-race supplements; append career-index last, preserving those entries. Baseline contracts count 101 (rather than old expected 97). No budget-edge function changes planned.

- Step 3: Added both Appendix C/D tests, registry/ops registration and last CI step. node --check passed both. Local new contract failed undefined !== 500 as required. Exact-head tests-first CI 37079063991 is red: contract 1/102 fails for missing capacity export, and Career index matrix fails I0 (missing composed index match); earlier emulator groups passed. Baseline CI logs confirm 101/101 and ops 73 pass, 0 fail.

- Step 4: Applied Appendix A and injector Appendix F unchanged. Both builds PASS; exact index match count 1, composed size 128924 bytes (uncommitted). CI 37079315422 passed Setup, Transfer, Lifecycle and Terminal Close; pair fixture creation is denied as expected without its index write. Important CI sequencing observation: failed pair step skips Journey and Career index matrix, so the job's expected intermediate A-H/P1 output cannot appear until fixtures/client are implemented. Preserved the workflow as instructed; full matrix will be proved in step 7.

- Step 5: Applied Appendix E and G fixture updates; kept Date.now() in G hunks to preserve JOB-02's approved clock fix. Both node --check PASS. Exact-head CI 37079528608: Persistent Nik and Daniel pair matrix SUCCESS; Two-manager journey fails on missing createDurableCreationWitness export as expected before step 6, so Career matrix is skipped. All previous assertions preserved except the chartered KNOWN GAP 2 replacement.

- Step 6: Applied Appendix B unchanged: pure append/rollover plan, exact read-only memory index, reads-before-writes witnesses and exports, contractVersion 4. node --check client PASS; career-index contract PASS locally; unchanged persistent-pair contract PASS locally. Client saved on 524020edf2bce953127093ff8dc4a61929dadd90; full CI pending.

- Step 7 first full proof: CI 37079798528 at 524020e passed 102/102 contracts, 73 operations (0 fail), all emulator steps and 58 index checks. Log budget gate FAILED: D13 stranger index forgery was denied, but its missing pair document caused eager .data.data evaluation and a maximum-of-1000 diagnostic. Scope-local correction: cmsCareerIndexAppendEligible now gets the pair resource, rejects null/non-map before accessing pair.data.data; no rivalry or budget-edge function change. Both standalone local contracts still PASS. Full proof re-run pending on 65a53ff692e789ffa1d3025b6e7efa1adc56bf00.
