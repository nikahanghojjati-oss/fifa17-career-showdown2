# SSJR-2.0 two-device run — Daniel and Nik

This single run is the SSJR test. After a clean one-season run, and once Claude records it with Nik's signed statement, SSJR-2.0 moves from 0 to 82/100.
- The remaining 18 points are multi-season 8, final reconciliation 3, terminal close 2, physical journey 3 and stable release 2. They need a future recorder upgrade that logs every season, followed by a run of two or more seasons. Today's recorder captures one-season plans only.
- Rejection proof comes from the automated Rules and provider tests. No third account, extra rejection taps or 4-hour wait are needed.

Only start once Claude confirms that production is on the expected runtime. The runtime is stamped into each export automatically.

## Before you start (both devices)
1. **Open the acceptance link** on each device: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/?ssjr-acceptance=1&ssjr-physical=1`
   - Keep that same tab for the whole run.
   - If Home shows `UPDATE TO LATEST VERSION`, press it first.
2. **Use only the gold `MDP PHYSICAL JOURNEY` panel.** Ignore any older Shared Setup evidence panel or its buttons.
3. **Reset once if needed.** If the gold panel shows evidence from an earlier attempt, press its `RESET` button once.
4. **Save labels** by typing them and pressing `SAVE LABELS`:
   - Daniel: device `Chromebook host`, network `Home Wi-Fi`.
   - Nik: device `iPhone peer`, network `Cellular`, with iPhone Wi-Fi off.
   - Use different device names and different networks.
5. **Sign in.** Daniel signs in and chooses **Daniel**. Nik signs in and chooses **Nik**.

## Play the Showdown (normal game)
1. **Daniel starts it.** Daniel presses `START A SHOWDOWN`, chooses **1 Season**, presses `START A SHOWDOWN`, then `CONNECT PLAYERS` → `CREATE CODE FOR NIK`, and sends the code to Nik.
2. **Nik joins.** Nik presses `JOIN DANIEL'S SHOWDOWN`, enters the code, and presses `JOIN DANIEL'S SHOWDOWN`.
3. **Both open the private session.** Both press `CONTINUE CAREER` if asked, then `CONTINUE` on `GET READY`. Daniel presses `HOST PRIVATE SESSION` and sends the new session code. Nik enters it and presses `JOIN PRIVATE SESSION`.
4. **Start the career.** Once both show the same ACTIVE session, both press `START CAREER`.
5. **Setup.** Daniel spins the league wheel and opens both club packs. Both then press `CONFIRM SHARED SHOWDOWN`.
6. **Career start and transfers.** Both acknowledge Career Start, then complete the Transfer Challenge.
7. **Results.** Each manager enters and reviews their own result, waits at least 35 seconds on the review screen, then presses `PUBLISH MY SEASON RESULT`.
8. **Commit.**
   - Daniel should see `COMMIT SHARED SEASON`. If he sees `CHECK SHARED SEASON COMMIT` or `RETRY COMMIT CHECK`, he presses it once; it only reads.
   - Daniel presses `COMMIT SHARED SEASON`.
   - Both press `ACKNOWLEDGE SHARED SEASON`.
9. **Scoring and history.** Wait until scoring and Shared History appear on both devices.

## Recovery steps (after Shared History is showing)
10. **Go offline once on each device.** Use airplane mode or Wi-Fi off, wait about 10 seconds, then reconnect. Wait until the gold panel shows OFFLINE RECOVERY complete.
11. **Reload once on each device**, in the same tab. Wait for RELOAD complete. Continue the same Showdown.
12. **Preview reconciliation.** Press `PREVIEW LOCAL RECONCILIATION` once and wait for `PREVIEW READY`. Never apply Candidate C.
13. **Finish.** Complete Final Reconciliation, then Terminal Close. The panel must show CLOSED.
14. **Reload once more** on each device. The panel must show CLOSED AFTER RELOAD.

## Send the evidence
15. **Export** on each device with `DOWNLOAD JSON`, or `COPY EVIDENCE` and paste it into a file. Send both exports to Claude without editing them.
16. **Confirm Claude's statement.**
    - Claude prepares the owner attestation from those exact files:
      ```
      node scripts/ssjr2-physical-run-credit.mjs --draft-attestation <daniel.json> <nik.json>
      ```
      It contains the fingerprint (SHA-256) of both exports, the runtime and the device labels.
    - Nik reads it and confirms it to Claude, setting `stableReleaseAccepted` to `true` only if he is accepting the release as stable.
    - Nobody edits the statement text.

Claude then assesses the run:
```
node scripts/ssjr2-physical-run-credit.mjs <daniel.json> <nik.json> <attestation.json>
```
It prints exactly which capabilities the run proves and what blocks the rest.

Claude then records it:
```
node scripts/ssjr2-physical-run-credit.mjs <daniel.json> <nik.json> <attestation.json> --record --main-sha <production-main-sha>
```
Before writing the ledger, this verifies the following against GitHub:
- the SHA is live `main`;
- every check on it passed, including the POS20 seal, the 1/3/5/10 lifecycle, the Pages deploy and the deployed-site smoke;
- the latest zero-billing Firestore Rules deployment succeeded;
- production's runtime equals the exports' runtime.

Nothing is credited from CI, emulators, two tabs, Incognito windows or simulated browsers.

## If something goes wrong
- Take a screenshot of both devices, including any status line or error code.
- Note the step number and time.
- Do not republish, and do not use `CONFIRM & SAVE SEASON`.
