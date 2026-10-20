# HO-028 · Team G → Team V · r78: readable premium body text on every screen (Rules first; titles stay)

```ticket
{
 "id": "HO-028",
 "from": "G",
 "to": "V",
 "title": "r78: readable premium body text on every screen (Rules first; titles stay)",
 "kind": "design",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "style picked", "done": true}, {"name": "pictures made", "done": true}, {"name": "code handed back", "done": true}],
 "evidence": ["factory/v1-wtt5ye @ 00ef833b project-documents/factory/r78/HO-028_029 (type + marble kit, before/after shots); lead review: Rules/errors/modals/toasts pass, Settings desktop fix in progress", "factory/v1-wtt5ye @ 0cd17f09 project-documents/factory/r78/HO-028_029/ (README.md = wiring steps): r78-type.css (readable body text: Barlow 16px body / 15px secondary, ivory #F2EBDD 15.9:1, gold condensed headings, Rules first; Settings desktop zoom-compensated at 14/13/12px so all panels + Showdown Data with Delete fit 1280x720..2560x1440), r78-marble-surfaces.css + r78-marble-tile.webp (black-and-gold opaque marble for error screens, modals, confirm sheets, toasts, inline notes per ERROR_POPUP_SURFACES.md; no scrim/dim/blur behind pop-ups, HO-027 safe), preview.html, contrast.py, shots/ before/after desktop+phone. Lead review PASS. Notes: desktop Rules board now scrolls (bigger text); phone error-screen CSS points at ENV_SYS_PHONE_V1 until HO-026 V2 plates land; .sd-nav-toast and some tools surfaces not checked live, please eyeball."],
 "log": [{"at": "2026-10-17T03:38:24Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-17T03:39:22Z", "by": "V", "status": "RECEIVED", "note": "Team V lead received; work starts in the fresh Team V lead thread"}, {"at": "2026-10-17T04:18:17Z", "by": "V", "status": "WORKING", "note": "Team V lead started. Steps: style picked, pictures made, code handed back"}, {"at": "2026-10-17T04:20:50Z", "by": "V", "status": "WORKING", "note": "Style picked: Barlow body 16px/1.55 ivory on opaque black-and-gold marble; Loading = real Reus photo graded black and gold (Nik)"}, {"at": "2026-10-17T04:54:38Z", "by": "V", "status": "WORKING", "note": ""}, {"at": "2026-10-17T05:21:30Z", "by": "V", "status": "DONE", "note": ""}]
}
```

## Nik's ask (2026-10-17 01:46 UTC): readable premium body text on every screen

Body text on many screens is hard to read, worst on the Rules screen (too many fonts and too many lines). **Title fonts stay as they are.**

**Ask for r78 (1.9.2-r78):**
1. Pick one premium, readable body type treatment (font, size, weight, line height, contrast on marble) for desktop and phone.
2. Apply it first to the Rules screen (Rule Book), then every other screen's body text.
3. Return the type tokens/CSS for Team G to fit in, plus before/after pictures of Rules on desktop and phone.

Rules that apply: one unified marble look; no dimming or see-through text panels (HO-027); nothing covers anything at any size; no flash on load. Backend and game rules unchanged.
