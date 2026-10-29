# Lead check · 1016 · Transfer War phone revamp

Merged #398 (d2b0cf19 -> 439f247a). Rendered F1 and G2 at 393x660, 360x640 and 375x553 after fonts and network settle: `lead_check_phone_sheet.jpg` (left to right F1 393/360/375, G2 393/360/375).
- Daniel's whole face shows, Daniel LEFT, Nik RIGHT, faces do not overlap. PASS
- Primary action on the plate directly above HOME / REFRESH, no page scroll at all three sizes. PASS
- Desktop 1440x900 pixel-identical before and after (worker's diff, evidence/1016/*_1440x900_*). PASS
Known leftover: F3 (LOCK MY SIGNINGS) at 375x553 still overlaps the sealed card (was already so; not in scope).
Next: Team G ports the plate.css phone block and the two cut-outs into main (HO-016).

## Port check · Team G PR #401 (job 1021 · G, head b89492f) · 2026-10-06 02:35 UTC
PASS. Rendered with the v10-transfer contract harness (stubbed provider state, no Firebase), window-open and guess-entry at 393x660, 360x640 and 375x553, plus desktop 1440x900 against base e7b556c: `port_check_pr401_sheet.jpg`.
- The V2 cut-outs load. Daniel's whole face shows LEFT and Nik is RIGHT, with no face overlap.
- The action sits 4-6px above HOME / REFRESH at every size. There is no page scroll, and the cards are clean panels.
- Desktop is pixel-identical to base in both states.
