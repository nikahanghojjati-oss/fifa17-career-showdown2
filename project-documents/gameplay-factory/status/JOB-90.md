# Status · JOB-90 · Factory smoke test (Work lane)

State: IN PROGRESS
Step: 5 of 6
Updated: 2026-10-02 08:26 UTC
Chat: Sol Work mode
Code branch: gameplay/job-90-smoke-work
Head commit: 8df95d6c959080b3ed7cebf5805b2e0461fc8f5f
PR: none (test branch never merged)
CI run:

## Notes
- Step 1: Read BOARD.md using GitHub connector. First line: # Team G gameplay factory board. Status saved using GitHub connector.
- Step 2: Terminal clone YES (exit 0); local commit fd12d0a. Terminal git push NO: fatal: could not read Username for 'https://github.com': No such device or address (exit 128). Connector fallback YES: same one-line work-branch-test.md saved on gameplay/job-90-smoke-work, commit 8df95d6c959080b3ed7cebf5805b2e0461fc8f5f.
- Step 3: node --version = v24.19.0 (YES ≥24); npm --version = 11.9.0; java -version = openjdk version "17.0.20" 2026-07-21 (NO ≥21); git --version = git version 2.51.1. npm ci YES (exit 0): added 21 packages in 8s. Browser tool YES: mcp__cua_repl.js exposes cloud browser controls (present, not invoked).
- Step 4: npm run test:contracts exit 0 in 11.73 s; verification retry exit 0 in 11.50 s. Neither log contained the required PASS POS10 selected deterministic census (96/96 current blocking contracts: frozen POS10 floor + POS20 supplements). First last line: PASS Terminal Close provider: bounded staged terminal proof folds acknowledged seasons and canonical scores one exact path at a time, then atomically closes rivalry+session; replay/read, forged totals, fresh-session resurrection, active-session continuation beyond the old TTL, device denial, zero billing and zero canonical local mutation remain protected. Retry last line: PASS r18 Terminal Close production Rules: acknowledged seasons are folded into bounded monotonic terminalProgress, canonical scores remain Rules-authoritative, final close remains atomic, and production publication plus regression tests now share one deterministic zero-billing validator instead of reparsing shell grep syntax. Contract full-suite capability NO (required final census unproven despite exit 0); no third unchanged retry.
- Step 5: npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0 exit 0: added 260 packages, and changed 8 packages in 26s. Build scripts exit 0, in required order after contracts: BUILT firestore.spark.generated.rules 113958 bytes; INJECTED persistent Nik/Daniel pair authority 121476 bytes. Both npx --yes firebase-tools@15.28.1 emulators:exec commands (demo-cms-smoke and demo-cms-smoke-pair) exit 1: Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above to get a compatible runtime. Emulator start NO; pair proof NO (test never ran). Final git diff --name-only empty; generated Rules returned to original composed contents.

## Self-check

## Blocked question
