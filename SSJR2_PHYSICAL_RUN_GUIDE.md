# SSJR test: one 3-season game, Daniel and Nik (r85, SSJR-2.2)

One clean **3-season** game earns SSJR **100/100**. A gold **SSJR TEST** strip at the top of the game does the recording and tells you what to do next. Nothing to type.

**Link (both):** `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/?ssjr=1`

1. **Open the link** in one tab on each device and keep that tab until the end. Daniel: Chromebook on home Wi-Fi. Nik: iPhone with **Wi-Fi off** (mobile data only). On the strip, tap **WI-FI** or **MOBILE DATA**.
2. **Play** a 3-season Showdown as normal. Daniel starts it and picks **3 Seasons**.
3. **When the strip asks** (in season 2), on each device: turn the internet off for 15 seconds, then back on (Nik: Airplane Mode on, then off). Then **reload the page once** when the strip says so.
4. **Finish season 3.** The Showdown saves itself. When the strip says so, **reload once more**.
5. When the strip says **Done**, tap **SAVE RESULT FILE** and send the file to Claude. Claude sends a short statement; Nik replies "confirmed" and says whether he accepts this version as stable (without that, the score is 98).

If anything looks wrong, screenshot both screens and send them to Claude. Most problems can be continued from where you stopped.

## For Claude
- The recorder (`js/ssjrPhysicalJourneyAcceptance.js`) keeps only sanitized fingerprints in `sessionStorage`, never writes to Firebase, and makes one read-only check (career index plus the completed-Showdown reader) to confirm the closed Showdown after the last reload.
- Validate with `node scripts/validate-ssjr-physical-journey-evidence.mjs <daniel.json> <nik.json>`, then credit with `scripts/ssjr2-physical-run-credit.mjs` (owner attestation from `acceptance/SSJR2_OWNER_ATTESTATION_TEMPLATE.json`).
- SSJR-2.2 evidence rules (owner request 2026-10-26, see `authority-history/OWNER_SSJR22_SIMPLE_SSJR_TEST_2026-10-26.md`): offline, reconnect and reload checks during the game (after the career starts, before the automatic close); the close confirmed after a later reload; Local and Final Reconciliation proven on at least one device of the pair. Capabilities, weights and dependencies are unchanged from SSJR-2.1.
