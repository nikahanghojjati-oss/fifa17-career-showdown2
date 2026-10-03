# Status · JOB-16 · Two-manager browser journey (localhost-only emulator switch)

State: IN PROGRESS
Step: 2 of 9
Updated: 2026-10-03 13:32 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-16-browser-journey
Head commit: 2b0fe0de1a03452e578be52b84c3de39ef981cdb
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37126386490

## Notes
- Step 1: JOB-02, JOB-07 and JOB-17 are DONE and merged; the provider journey exists on gameplay/recovery-v1. Recovery head 843e64e is green in Validate Gameplay Fast run 37125870168 (Gameplay contracts SUCCESS; Composed Rules on the emulator SUCCESS). Scanned all 117 js/*.js blobs on that exact tree: no connectAuthEmulator or connectFirestoreEmulator. validate-gameplay-fast.yml pins firebase@12.17.1; deploy-github-pages.yml copies only index/runtime files plus acceptance, assets, css, data and js, never tests/. The job branch was safely fast-forwarded from 889810f to current recovery 843e64e after JOB-08 merged; no force update and no product files changed.

- Step 2: Added the Appendix B contract and re-appended its POS20 registry/operations entries last after JOB-08. Exact-head run 37126386490 produced the required tests-first failure: Gameplay contracts failed 1/104 because tests/browser/support/emulator-runtime-switch.js does not exist yet (MODULE_NOT_FOUND). The failure occurs after Node parsed the new contract; no production or emulator switch file exists at this step.

## Self-check

## Blocked question
