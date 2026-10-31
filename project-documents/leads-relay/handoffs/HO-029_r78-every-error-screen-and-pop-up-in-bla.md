# HO-029 · Team G → Team V · r78: every error screen and pop-up in black-and-gold marble

```ticket
{
 "id": "HO-029",
 "from": "G",
 "to": "V",
 "title": "r78: every error screen and pop-up in black-and-gold marble",
 "kind": "design",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "style picked", "done": true}, {"name": "pictures made", "done": true}, {"name": "code handed back", "done": true}],
 "evidence": ["project-documents/leads-relay/attachments/HO-029/ERROR_POPUP_SURFACES.md", "factory/v1-wtt5ye @ 00ef833b project-documents/factory/r78/HO-028_029 (type + marble kit, before/after shots); lead review: Rules/errors/modals/toasts pass, Settings desktop fix in progress", "factory/v1-wtt5ye @ 0cd17f09 project-documents/factory/r78/HO-028_029/ (README.md = wiring steps): r78-type.css (readable body text: Barlow 16px body / 15px secondary, ivory #F2EBDD 15.9:1, gold condensed headings, Rules first; Settings desktop zoom-compensated at 14/13/12px so all panels + Showdown Data with Delete fit 1280x720..2560x1440), r78-marble-surfaces.css + r78-marble-tile.webp (black-and-gold opaque marble for error screens, modals, confirm sheets, toasts, inline notes per ERROR_POPUP_SURFACES.md; no scrim/dim/blur behind pop-ups, HO-027 safe), preview.html, contrast.py, shots/ before/after desktop+phone. Lead review PASS. Notes: desktop Rules board now scrolls (bigger text); phone error-screen CSS points at ENV_SYS_PHONE_V1 until HO-026 V2 plates land; .sd-nav-toast and some tools surfaces not checked live, please eyeball."],
 "log": [{"at": "2026-10-17T03:38:24Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-17T03:39:22Z", "by": "V", "status": "RECEIVED", "note": "Team V lead received; work starts in the fresh Team V lead thread"}, {"at": "2026-10-17T03:44:12Z", "by": "G", "status": "RECEIVED", "note": "Team G: full list of error screens, notes, 13 native confirm() sites, modals and toasts (base gameplay/clean-start 614f999b). Native confirm() needs a custom modal; Team G will wire it."}, {"at": "2026-10-17T04:18:17Z", "by": "V", "status": "WORKING", "note": "Team V lead started. Steps: style picked, pictures made, code handed back"}, {"at": "2026-10-17T04:20:50Z", "by": "V", "status": "WORKING", "note": "Style picked: Barlow body 16px/1.55 ivory on opaque black-and-gold marble; Loading = real Reus photo graded black and gold (Nik)"}, {"at": "2026-10-17T04:54:38Z", "by": "V", "status": "WORKING", "note": ""}, {"at": "2026-10-17T05:21:30Z", "by": "V", "status": "DONE", "note": ""}]
}
```

## Nik's ask (2026-10-17 01:47 UTC): every error screen and pop-up in black-and-gold marble

Many error screens and pop-up messages still use the old layout's look, including the old white-and-blue messages. Nik wants every one of them in the black-and-gold marble look with readable premium fonts, unified with the current UI, on desktop and phone.

**Ask for r78:**
1. Design one marble treatment for: full-screen error states, inline error notes, confirm dialogs and toast/pop-up messages.
2. Team G will send the list of every error/pop-up surface in the code if you want it; say so on this ticket.
3. Return the CSS/components and pictures; Team G wires them in and keeps the wording and recovery buttons.

Rules: no dimming or dark overlay behind dialogs (HO-027); readable body type (sibling ticket); no flash.
