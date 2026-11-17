# HO-032 · Team V → Team G · r78 phone League: smaller wheel so both faces show

```ticket
{
 "id": "HO-032",
 "from": "V",
 "to": "G",
 "title": "r78 phone League: smaller wheel so both faces show",
 "kind": "build",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "wheel shrunk on phone", "done": true}, {"name": "facecheck passes on League", "done": true}],
 "evidence": ["V4 plate factory/v1-wtt5ye @ 3a41831f (visual-assets/v10_1/plates-v4/ENV_LEAGUE_PHONE_V4.webp + project-documents/factory/r78/HO-032_V4/PHONE_FACE_ZONES_V4.json); zone-to-rim +19.6 px at 393x852 (emulated 0.85 wheel, circle mode)", "V5 plate replaces V4: factory/v1-wtt5ye @ 0c2c6465 (visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_V5.webp + project-documents/factory/r78/HO-032_V5/PHONE_FACE_ZONES_V5.json); men identical to V4, clean stadium from Nik's ticket 1846; zone-to-rim +18.3/+19.6 px at 393x852 (circle mode, wheel 0.85)"],
 "log": [{"at": "2026-10-17T14:19:31Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-17T14:20:29Z", "by": "G", "status": "RECEIVED", "note": "Team G starting now: phone wheel ~15% smaller on ENV_LEAGUE_PHONE_V2; per-size numbers come back here if faces still overlap"}, {"at": "2026-10-17T14:28:11Z", "by": "G", "status": "WORKING", "note": "V2 + wheel 15% smaller (254px at 393x852, centre and buttons unchanged; audit now tests the wheel as a circle). Face check, Daniel/Nik under #leagueWheel/.wheelTrack: 393x852 FAIL 2%/1% (gold rim 12.6px into Daniel's zone at chin/shoulder, 8.9px into Nik's at his hand, inner bottom corner); 393x660, 375x667, 360x640 OK (faint shadow only). V2 would need ~23% shrink to clear the rim, ~28% to clear the outer ring. Please make the V4 plate: men up or outward at 393x852 by ~13px (Daniel) / ~9px (Nik) plus margin. Daniel's and Nik's zones also touch the screen edges at 393x852 (hair crop). Team G's wiring is ready locally and ships as soon as V4 lands."}, {"at": "2026-10-17T14:41:11Z", "by": "V", "status": "WORKING", "note": ""}, {"at": "2026-10-17T15:04:13Z", "by": "V", "status": "WORKING", "note": ""}, {"at": "2026-10-17T16:39:20Z", "by": "G", "status": "DONE", "note": "Merged into r78 work branch (#899, 2b78d5d2): V5 plate, wheel 15% smaller, ratio >= 59/128; taller phones keep old League art"}]
}
```

# Phone League: smaller wheel so both faces show (Nik's pick, 17 Oct 10:18 a.m. Eastern)

Nik chose "Smaller wheel" on Team V's decision card: on phone Select League the wheel covers both managers' chins (HO-031 follow-up; your facecheck: Daniel 63/36/33/24%, Nik 44/25/24/17% at 393x852/393x660/375x667/360x640 on ENV_LEAGUE_PHONE_V2).

Ask (phone and sideways only, desktop unchanged):
- Make the phone wheel about 15% smaller (diameter), centred as now. Keep the title, SPIN WHEEL and BACK in their places; no scroll at 393x660 and 360x640.
- Keep the plate ENV_LEAGUE_PHONE_V2 (do NOT use the V3 League plate).
- If the faces still touch the wheel box after the shrink, tell Team V the remaining overlap per size: Team V then nudges both men outward in a League V4 plate (geometric edit of V2, same method as the Standings/Rivalry v3 plates) and sends new face zones.
- Prove it with phone-marble-facecheck-audit at the four sizes. Fine to test the wheel as a circle if that is what is drawn; say which you used.
