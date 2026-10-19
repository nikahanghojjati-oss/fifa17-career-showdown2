# SSJR test: one 3-season game, Daniel and Nik (SSJR-2.1, runtime r51)

One clean **3-season** game is the whole SSJR test. Once Claude records it with Nik's signed statement, SSJR goes from 0 to **100/100**.
- The last 2 points are "stable release". They count only if Nik says he accepts this version as stable when he confirms the statement. Otherwise the score is 98.
- A 1-season game still works but earns only 82, because it cannot prove multi-season play.
- No third account, extra rejection taps or 4-hour wait are needed. Rejection proof comes from the automated tests.

Only start once Claude confirms that production is on the expected runtime. The runtime is stamped into each export automatically.

## Before you start (both devices, about 5 minutes)
- **Networks:** Daniel uses his Chromebook on home Wi-Fi. Nik uses his iPhone with **Wi-Fi off**, on cellular only, for the whole game.
- **Open the link:** both open it and keep that one tab open until the end. Don't close it or open a new tab.
  `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/?ssjr-acceptance=1&ssjr-physical=1`
- **Update:** if Home shows `UPDATE TO LATEST VERSION`, tap it.
- **Gold panel:** use the gold `MDP PHYSICAL JOURNEY` panel. If it shows anything from an earlier try, tap `RESET RECORDER` once.
- **Labels:** type these, then tap `SAVE LABELS`:
  - Daniel: `Chromebook host` and `Home Wi-Fi`
  - Nik: `iPhone peer` and `Cellular`
- **Sign in:** Daniel signs in and picks **Daniel**. Nik signs in and picks **Nik**.
- **Time:** allow about 2–3 hours. Use `REQUEST EARLY END` in each transfer window to save time.

## Part 1: Connect (once)
1. **Daniel:** `START A SHOWDOWN` → pick **3 Seasons** → `START A SHOWDOWN` → `CONNECT PLAYERS` → `CREATE CODE FOR NIK`. Text Nik the code.
2. **Nik:** `JOIN DANIEL'S SHOWDOWN` → enter the code → `JOIN DANIEL'S SHOWDOWN`. If Daniel's screen still says it's waiting, he taps `CHECK STATUS` once.
3. **Both:** `CONTINUE CAREER` if you see it, then `CONTINUE` on GET READY.
   - **Daniel:** `HOST PRIVATE SESSION`, then text Nik the new code (a different code).
   - **Nik:** enter it → `JOIN PRIVATE SESSION`.
4. When both screens show ACTIVE, both tap `START CAREER`.

## Part 2: League, clubs and Career Start (once)
5. **Daniel** spins the league wheel. Then both tap `CONTINUE TO CLUB PACKS`.
6. **Daniel** taps `OPEN SHOWDOWN PACKS`. Both watch the packs open.
7. **Both:** `CONFIRM SHARED SHOWDOWN`. Whoever confirmed first taps `CONTINUE TO CAREER START` when it appears.
8. **Both:** `I STARTED AT <your club>`. When both are done, tap `CONTINUE TO TRANSFER CHALLENGE`.

## Part 3: Play each season (do this 3 times: seasons 1, 2 and 3)
9. **Transfers.**
   - If you're on Home, tap `START SEASON N SHARED TRANSFER CHALLENGE`.
   - **Daniel:** `START SHARED 15-MINUTE WINDOW`. To skip the wait, both tap `REQUEST EARLY END`.
   - **Both:** enter guesses → `LOCK MY GUESSES`, then enter signings → `LOCK MY SIGNINGS`.
   - View the verdicts, then tap `CONTINUE TO SHARED SEASON RESULTS`.
10. **Results.** Each of you enters your own season result → `REVIEW MY SEASON RESULT`. **Wait 35 seconds** on the review screen, then tap `PUBLISH MY SEASON RESULT`.
11. **Commit.**
    - **Daniel:** `COMMIT SHARED SEASON`. If he sees `CHECK SHARED SEASON COMMIT` or `RETRY COMMIT CHECK` instead, he taps it once first; it only checks.
    - **Both:** `ACKNOWLEDGE SHARED SEASON`. Wait until both screens show the scores and Shared History.
12. **Next season.** After seasons 1 and 2 only, both tap `CONTINUE TO SEASON 2` (then `CONTINUE TO SEASON 3`) on the same screen, then go back to step 9.
    - After season 3, the button says `SEASON PLAN COMPLETE ✓`, and the gold panel shows **✓ SEASONS 3/3**.

## Part 4: Recovery checks (only after season 3's Shared History)
Start only when the gold panel shows **✓ SEASONS 3/3**. If it still shows 2/3 or an empty circle, wait a few seconds or tap `CHECK NOW`. Going offline earlier doesn't count and doesn't spoil anything.

13. **Go offline once each** for about 15 seconds, then reconnect:
    - Nik: Airplane Mode on, then off, keeping Wi-Fi off.
    - Daniel: Wi-Fi off, then on.

    Wait for **OFFLINE RECOVERY** ✓ in the gold panel.
14. **Reload once each**, in the same tab. Wait for **RELOAD** ✓. If asked, `CONTINUE CAREER` for this same game.
15. **Both:** tap `PREVIEW LOCAL RECONCILIATION` once → wait for `PREVIEW READY ✓`. Never tap any Apply or restore option in Settings.

## Part 5: Finish
16. Wait for `SHOWDOWN FINAL RECONCILED`. **Daniel:** `CLOSE SHARED SHOWDOWN`. Both should show `SHARED SHOWDOWN CLOSED`.
    - If Nik's screen doesn't within a minute, he taps `CHECK NOW` in the gold panel.
    - If Nik still sees `CLOSE SHARED SHOWDOWN`, he may tap it too. It can't close twice.
17. **Reload once more each.** The gold panel should show **CLOSED AFTER RELOAD** ✓ and `READY TO EXPORT`.
18. **Each:** `DOWNLOAD JSON` (or `COPY EVIDENCE` and paste into a note). Send both files to Claude, unedited.
19. Claude sends a short statement. Nik reads it and replies "confirmed", saying whether he accepts this version as stable. Claude records the score.

## If something goes wrong
- **Private session expires** (a session or reconnect message after about 4 hours):
  - **Daniel:** `HOST PRIVATE SESSION` again and text Nik the new code.
  - **Nik:** joins it.
  - Then carry on where you were. This does not spoil the run.
- **Anything else:** screenshot both screens, including any error code, note the step and season number, and send them to Claude. Most problems can be fixed and continued from where you stopped.
- **Don't:**
  - close the tab, or reload except at steps 14 and 17;
  - turn on the iPhone's Wi-Fi;
  - republish a result, or tap `CONFIRM & SAVE SEASON`;
  - start a new game halfway through;
  - tap `PREVIEW LOCAL RECONCILIATION` before season 3 is finished.

## For Claude: recording the run
```
node scripts/ssjr2-physical-run-credit.mjs --draft-attestation <daniel.json> <nik.json>
node scripts/ssjr2-physical-run-credit.mjs <daniel.json> <nik.json> <attestation.json>
node scripts/ssjr2-physical-run-credit.mjs <daniel.json> <nik.json> <attestation.json> --record --main-sha <production-main-sha>
```
- **Draft.** It binds the SHA-256 of both exports, the runtime and the device labels. Nik confirms it without editing the statement; only `stableReleaseAccepted` reflects his answer.
- **Assess.** It prints the capabilities the run proves and what blocks the rest.
- **Record.** It verifies against GitHub before writing the ledger:
  - the SHA is live `main`;
  - every check on it passed, including the POS20 seal, the 1/3/5/10 lifecycle, the Pages deploy and the deployed-site smoke;
  - the latest zero-billing Firestore Rules deployment succeeded and still applies to that SHA. If not, run `deploy-firestore-rules-zero-billing.yml` on `main` once and record again;
  - production's runtime equals the exports' runtime.

Nothing is credited from CI, emulators, two tabs, Incognito windows or simulated browsers.
