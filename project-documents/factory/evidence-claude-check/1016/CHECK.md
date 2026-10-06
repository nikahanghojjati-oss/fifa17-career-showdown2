# Lead check · 1016 · Transfer War phone revamp

Merged #398 (d2b0cf19 -> 439f247a). Rendered F1 and G2 at 393x660, 360x640 and 375x553 after fonts and network settle: `lead_check_phone_sheet.jpg` (left to right F1 393/360/375, G2 393/360/375).
- Daniel's whole face shows, Daniel LEFT, Nik RIGHT, faces do not overlap. PASS
- Primary action on the plate directly above HOME / REFRESH, no page scroll at all three sizes. PASS
- Desktop 1440x900 pixel-identical before and after (worker's diff, evidence/1016/*_1440x900_*). PASS
Known leftover: F3 (LOCK MY SIGNINGS) at 375x553 still overlaps the sealed card (was already so; not in scope).
Next: Team G ports the plate.css phone block and the two cut-outs into main (HO-016).
