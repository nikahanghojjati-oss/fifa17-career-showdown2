# Status · JOB-16 · Two-manager browser journey (localhost-only emulator switch)

State: IN PROGRESS
Step: 6 of 9
Updated: 2026-10-03 14:16 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-16-browser-journey
Head commit: b8f45d5d6d9f24f9a06516f97eee7c87b3e7681d
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37128820835

## Notes
- Step 1: JOB-02, JOB-07 and JOB-17 are DONE and merged; the provider journey exists on gameplay/recovery-v1. Recovery head 843e64e is green in Validate Gameplay Fast run 37125870168 (Gameplay contracts SUCCESS; Composed Rules on the emulator SUCCESS). Scanned all 117 js/*.js blobs on that exact tree: no connectAuthEmulator or connectFirestoreEmulator. validate-gameplay-fast.yml pins firebase@12.17.1; deploy-github-pages.yml copies only index/runtime files plus acceptance, assets, css, data and js, never tests/. The job branch was safely fast-forwarded from 889810f to current recovery 843e64e after JOB-08 merged; no force update and no product files changed.

- Step 2: Added the Appendix B contract and re-appended its POS20 registry/operations entries last after JOB-08. Exact-head run 37126386490 produced the required tests-first failure: Gameplay contracts failed 1/104 because tests/browser/support/emulator-runtime-switch.js does not exist yet (MODULE_NOT_FOUND). The failure occurs after Node parsed the new contract; no production or emulator switch file exists at this step.

- Step 3: Added Appendix A emulator-runtime-switch.js and Appendix D emulator config exactly. Exact-head run 37126548611: Gameplay contracts SUCCESS, 104/104 current blocking contracts; Operations audit pass 73 / fail 0. New contract PASS line: `PASS browser journey emulator switch contracts: localhost+flag only, production runtime untouched, Pages excludes tests/, startup gzip 37493/37500, services parity.` No production file references the switch.

- Step 4: Added Appendix C J0-J3 journey and appended the separate `browser-journey` CI job. Exact-head browser job SUCCESS. Last line: `PASS two-manager browser journey: 8 numbered checks (J0-J3 so far) on the Auth + Firestore emulators, composed production Rules, 3-season Showdown.` Artifact `browser-journey-screens` uploaded as artifact 11274672527. Gameplay contracts also SUCCESS on the same head.

- Step 5 / J4 checkpoint: Shared Setup is green on exact head 5bf7830 in browser run 37127199873. J4.1-J4.4 all passed: peer draw controls locked, same league, same distinct clubs, Daniel LEFT, both identical confirmations. One navigation behavior is being preserved as a non-blocking UI bug per §6: Nik receives the host league automatically but the presentation stays on the league screen until the non-authoritative `CONTINUE TO CLUB PACKS` navigation button is pressed.

- Step 5 / J5 checkpoint: Career Start is green on exact head e6e982d in browser run 37127516841. J5.1-J5.3 passed: each manager saw only their assigned club acknowledgement, both acknowledgements converged, and both reached the real Shared Transfer Challenge. Browser PASS currently has 15 numbered checks through J5 plus JZ; artifact `browser-journey-screens` uploaded as 11275108038.

- Step 5: J4 and J5 pass on the exact repaired head. J4 proves one authoritative league and two distinct clubs converge on both phone contexts with Daniel fixed in the LEFT/playerOne slot. A real presentation bug was captured without product code changes: after Daniel advances to the club screen, Nik's provider authority follows but Nik remains on the league screen until a navigation-only `CONTINUE TO CLUB PACKS` tap; the test marks this `// BUG` for the report. J5 proves each manager sees and acknowledges only their assigned Career Start club, both acknowledgements converge, and both reach the real Shared Transfer Challenge. Exact-head run 37127516841: Gameplay contracts SUCCESS, Composed Rules emulator SUCCESS, Two-manager browser journey SUCCESS; browser PASS line has 15 numbered checks and artifact `browser-journey-screens` 11275108038.

- Step 6 / J6-J7 checkpoint: exact head b8f45d5 is fully green in run 37128820835. J6.1-J6.5 passed including rendered-page privacy for unfinished rival guesses/signings and identical reveal only after COMPLETED. J7.1-J7.2 passed: Daniel's 1/87/93 result stayed absent from Nik before Nik published; after RESULTS_READY both review cards converged with identical raw facts. Canonical scoring remains intentionally locked until Shared Season Commit acknowledgement, so exact 9-3 scoring is proved immediately after the UI commit in J8. Browser PASS: 22 numbered checks through J7 plus JZ; artifact 11276550184. Non-blocking bugs carried forward: Nik setup presentation needs a navigation-only club-screen tap after authority follows, and the shared early-end control can show stale legacy `END WINDOW EARLY` copy while shared WINDOW_OPEN authority remains active.

## Self-check

## Blocked question
