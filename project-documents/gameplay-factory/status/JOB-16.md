# Status · JOB-16 · Two-manager browser journey (localhost-only emulator switch)

State: IN PROGRESS
Step: 1 of 9
Updated: 2026-10-03 13:27 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-16-browser-journey
Head commit: 843e64e27cac65822881db4d7302c64fd433ff4e
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37125870168

## Notes
- Step 1: JOB-02, JOB-07 and JOB-17 are DONE and merged; the provider journey exists on gameplay/recovery-v1. Recovery head 843e64e is green in Validate Gameplay Fast run 37125870168 (Gameplay contracts SUCCESS; Composed Rules on the emulator SUCCESS). Scanned all 117 js/*.js blobs on that exact tree: no connectAuthEmulator or connectFirestoreEmulator. validate-gameplay-fast.yml pins firebase@12.17.1; deploy-github-pages.yml copies only index/runtime files plus acceptance, assets, css, data and js, never tests/. The job branch was safely fast-forwarded from 889810f to current recovery 843e64e after JOB-08 merged; no force update and no product files changed.

## Self-check

## Blocked question
