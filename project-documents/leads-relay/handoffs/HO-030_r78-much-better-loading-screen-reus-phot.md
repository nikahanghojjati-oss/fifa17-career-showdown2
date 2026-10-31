# HO-030 · Team G → Team V · r78: much better loading screen (Reus photo and BVB crest stay, edited into marble)

```ticket
{
 "id": "HO-030",
 "from": "G",
 "to": "V",
 "title": "r78: much better loading screen (Reus photo and BVB crest stay, edited into marble)",
 "kind": "design",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "style picked", "done": true}, {"name": "pictures made", "done": true}, {"name": "code handed back", "done": true}],
 "evidence": ["factory/v1-wtt5ye @ 8c916268 project-documents/factory/r78/HO-030/ (README.md = wiring steps). Real Reus photo cut out at 1:1 (face + kit logos untouched), graded black and gold, standing in the approved marble tunnel ENV_LOADING_PHONE_V2; LOADING_REUS_DESKTOP.webp 1920x1080 118 KB, LOADING_REUS_PHONE.webp 1179x2096 130 KB; loading-r78.min.css (paste into css/app.css) + loading-r78.html (same ids/classes); credit 'Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped and edited for display'; no overlay/filter/blur, only motion = gold line transform, stops under reduced motion. Lead review PASS (shots/ before/after at 1440x900, 1366x768, 393x852, 360x640, 852x393 + 13 sizes). DECISION FOR TEAM G: startup gzip 38,013 vs limit 37,495 (+518 B); raise to ~38,100 with Nik's OK or save 0.6 KB elsewhere. loading-visual-audit needs mobile anchor 54% 0 -> 50% 0. First paint shows text + marble colours; photo is high-priority preloaded."],
 "log": [{"at": "2026-10-17T03:38:24Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-17T03:39:22Z", "by": "V", "status": "RECEIVED", "note": "Team V lead received; work starts in the fresh Team V lead thread"}, {"at": "2026-10-17T04:18:17Z", "by": "V", "status": "WORKING", "note": "Team V lead started. Steps: style picked, pictures made, code handed back"}, {"at": "2026-10-17T04:20:50Z", "by": "V", "status": "WORKING", "note": "Style picked: Barlow body 16px/1.55 ivory on opaque black-and-gold marble; Loading = real Reus photo graded black and gold (Nik)"}, {"at": "2026-10-17T05:00:28Z", "by": "V", "status": "DONE", "note": ""}]
}
```

## Nik's ask (2026-10-17 01:46-01:51 UTC): a much better loading screen

The current loading screen looks washed out. Nik wants a big quality upgrade.
- **The Marco Reus photo STAYS** (Nik 01:50 UTC), edited into the premium FIFA 17 marble look. Nik said "black and white marble"; the earlier note read black-and-gold, so confirm the colour with Nik on the picture.
- **Keep the Borussia Dortmund crest** (Nik 01:51 UTC).
- Keep the photo credit (Tim Reckmann, CC BY 2.0) and add "edited", as the licence requires.

**Ask for r78:** the edited image (desktop and phone crops) and the loading-screen layout. Team G keeps the Reus Gate behaviour: the loading screen stays until the next screen is truly ready, with zero flashes.
