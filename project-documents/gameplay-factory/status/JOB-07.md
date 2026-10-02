# Status · JOB-07 · Career index Rules + client + emulator proofs

State: IN PROGRESS
Step: 2 of 9
Updated: 2026-10-02 23:44 UTC
Chat: Sol Work mode
Code branch: gameplay/job-07-career-index
Head commit:
PR:
CI run:

## Notes
- Lead: JOB-02 merged (4491e36). Code branch gameplay/job-07-career-index created from gameplay/recovery-v1. Ready to start.

- Step 1: Dependencies JOB-01 and JOB-02 are DONE and merged. Baseline recovery-v1 a11af482: npm ci succeeded; contracts 101/101; operations 73/73, fail 0; unchanged persistent-pair contract PASS. Exact baseline CI green: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37078432100. Terminal clone works; all writes use the connector per job.

- Step 2: Read job authority, data contract and all required sources. Persistent-pair fragment lines/markers and client seams match. Drift: journey witness begins 85 (was 84); now2/now3 use Date.now from JOB-02 fix. Registry/ops now include G-4/G-5/G-6 and season-race supplements; append career-index last, preserving those entries. Baseline contracts count 101 (rather than old expected 97). No budget-edge function changes planned.
