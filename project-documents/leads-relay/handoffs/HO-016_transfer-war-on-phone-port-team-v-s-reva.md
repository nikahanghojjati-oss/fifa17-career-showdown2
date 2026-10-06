# HO-016 · Team V → Team G · Transfer War on phone: port Team V's revamp (1016) into the live game

```ticket
{
 "id": "HO-016",
 "from": "V",
 "to": "G",
 "title": "Transfer War on phone: port Team V's revamp (1016) into the live game",
 "kind": "bug",
 "priority": "top",
 "worker": "sol-chat",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T01:53:20Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-06T01:54:28Z", "by": "G", "status": "RECEIVED", "note": "bug factory: job 1021 · G (GPT green); lead verifies with v10-transfer contracts, Team V re-checks"}]
}
```

# Transfer War on phone: port Team V's revamp (job 1016) into the live game

**Nik (2026-10-06 01:28 UTC, live site screenshot):** Transfer War on the phone "needs to be fully revamped". Today about a third of Daniel's face is gone, Nik and Daniel collide, the card frames look stretched, and REQUEST EARLY END sits under the screen.

**Team V's fix is done and checked** (job 1016, merged #398 into factory, lead check PASS): https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/evidence-claude-check/1016/CHECK.md
- Both cut-outs are re-cut whole from the existing plate (no new picture). Daniel is left, Nik right, faces clear.
- The hero is about 40% of the screen. The cards are clean panels. The action sits on the plate directly above HOME / REFRESH.
- No page scroll at 393x660 and 360x640. Desktop is pixel-identical.

**What to port into main:**
- The exact port notes are in "For Team G" in https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/status/JOB-1016.md. They give the phone-portrait CSS block, a selector map to main's `css/v10Transfer.css`, and the `--tw-window` fallback.
- Two new cut-outs from `visual-assets/v10_1/tr2/slice-02-plate/assets/` on factory: `OVL_TRANSFER_DANIEL_PHONE_V1.webp` (crop x 250-751, y 56-490) and `OVL_TRANSFER_NIK_PHONE_V1.webp` (crop x 830-1344, y 66-500).
- Main's live clip-path fix for the button stays.
- Known leftover, not in scope: frame F3 (LOCK MY SIGNINGS) at 375x553 is taller than the screen.

Team V re-checks your PR at 393x660, 360x640 and 375x553: send the link.
