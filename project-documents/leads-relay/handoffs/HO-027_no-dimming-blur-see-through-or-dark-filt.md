# HO-027 · Team V → Team G · No dimming, blur, see-through or dark filters on managers or screens (Nik rule, r76)

```ticket
{
 "id": "HO-027",
 "from": "V",
 "to": "G",
 "title": "No dimming, blur, see-through or dark filters on managers or screens (Nik rule, r76)",
 "kind": "bug",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["gameplay/clean-start @ 426245d8 - no dimming merged"],
 "log": [{"at": "2026-10-13T00:43:33Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-13T00:44:10Z", "by": "G", "status": "RECEIVED", "note": ""}, {"at": "2026-10-17T04:20:17Z", "by": "G", "status": "DONE", "note": "r78: 26 state-dimming spots removed (PR #890, merged into gameplay/clean-start 426245d8); ships in 1.9.2-r78"}]
}
```

## Owner rule (Nik, 12 Oct 2026, 8:42 p.m. Eastern): no filters on managers or screens

Nik's words, in short: on some desktop and phone screens the game puts a filter on a manager (the one who lost, or someone not signed in): see-through, dimmed, greyed, blurred, or a dark shadow over part of a face or the screen. He has seen it on screens such as Legacy, Career and Settings when not signed in. He does not like any of it. This is a very important rule from now on.

**Rule (applies to every screen, desktop, sideways, tablet and phone):**
- Never make a manager transparent, dimmed, greyed, desaturated or blurred, whether they lost, are not signed in, are waiting, or anything else.
- Never lay a dark, grey or shadow overlay over a manager's face or body, or over the screen, because of a state (signed out, not ready, loser, locked, empty).
- A signed-out or empty state shows the normal screen at full brightness. Show the state with words and buttons (for example SIGN IN WITH GOOGLE, Not selected), never by darkening the picture.
- The loser in a result looks exactly like the winner: same brightness, colour and sharpness. The words say who won.
- Normal design shading baked into the approved plates (the room's own lighting) stays. This rule is about filters added by code for a state.

**Ask for r76:**
1. Find every place the code adds opacity, filter (grayscale, brightness, blur), mix-blend dimming, or a dark overlay on manager images, cutouts or screen plates for a state, and remove it.
2. Check Legacy, Career/Statistics, Settings, Season Results, Final Winner, Rivalry, Standings, Club and League in the signed-out and loser states, on desktop and phone.
3. Reply with the list of what was removed and screenshots.


**Clarification (Nik, 12 Oct 8:48 p.m. Eastern):** this is NOT a brightness boost. The good signed-in look, with its natural, realistic lighting on the managers' skin and clothes matching the room, is the target and must not change. Only the extra state filters (dim, grey, blur, see-through, dark overlay) are removed, so every state looks like that good version. Remove them safely: no change to motion settings, no new flash on load, nothing else touched.

Team V adds the same rule to PRODUCT_TRUTH.md and to every picture ticket.
