# Status · JOB-16 · Two-manager browser journey (localhost-only emulator switch)

State: IN PROGRESS
Step: 5 of 9
Updated: 2026-10-03 13:47 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-16-browser-journey
Head commit: 5bf7830678976c814df121f9e5bd79233fa8e8b6
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37127199873

## Notes
- Step 1: JOB-02, JOB-07 and JOB-17 are DONE and merged; the provider journey exists on gameplay/recovery-v1. Recovery head 843e64e is green in Validate Gameplay Fast run 37125870168 (Gameplay contracts SUCCESS; Composed Rules on the emulator SUCCESS). Scanned all 117 js/*.js blobs on that exact tree: no connectAuthEmulator or connectFirestoreEmulator. validate-gameplay-fast.yml pins firebase@12.17.1; deploy-github-pages.yml copies only index/runtime files plus acceptance, assets, css, data and js, never tests/. The job branch was safely fast-forwarded from 889810f to current recovery 843e64e after JOB-08 merged; no force update and no product files changed.

- Step 2: Added the Appendix B contract and re-appended its POS20 registry/operations entries last after JOB-08. Exact-head run 37126386490 produced the required tests-first failure: Gameplay contracts failed 1/104 because tests/browser/support/emulator-runtime-switch.js does not exist yet (MODULE_NOT_FOUND). The failure occurs after Node parsed the new contract; no production or emulator switch file exists at this step.

- Step 3: Added Appendix A emulator-runtime-switch.js and Appendix D emulator config exactly. Exact-head run 37126548611: Gameplay contracts SUCCESS, 104/104 current blocking contracts; Operations audit pass 73 / fail 0. New contract PASS line: `PASS browser journey emulator switch contracts: localhost+flag only, production runtime untouched, Pages excludes tests/, startup gzip 37493/37500, services parity.` No production file references the switch.

- Step 4: Added Appendix C J0-J3 journey and appended the separate `browser-journey` CI job. Exact-head browser job SUCCESS. Last line: `PASS two-manager browser journey: 8 numbered checks (J0-J3 so far) on the Auth + Firestore emulators, composed production Rules, 3-season Showdown.` Artifact `browser-journey-screens` uploaded as artifact 11274672527. Gameplay contracts also SUCCESS on the same head.

- Step 5 / J4 checkpoint: Shared Setup is green on exact head 5bf7830 in browser run 37127199873. J4.1-J4.4 all passed: peer draw controls locked, same league, same distinct clubs, Daniel LEFT, both identical confirmations. One navigation behavior is being preserved as a non-blocking UI bug per §6: Nik receives the host league automatically but the presentation stays on the league screen until the non-authoritative `CONTINUE TO CLUB PACKS` navigation button is pressed.

## Self-check

## Blocked question
