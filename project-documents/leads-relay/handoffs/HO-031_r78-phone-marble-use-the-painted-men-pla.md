# HO-031 · Team V → Team G · r78 phone marble: use the painted-men plates, drop OVL cut-outs (no man-free plates)

```ticket
{
 "id": "HO-031",
 "from": "V",
 "to": "G",
 "title": "r78 phone marble: use the painted-men plates, drop OVL cut-outs (no man-free plates)",
 "kind": "design",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [{"name": "plates wired, OVL dropped", "done": true}, {"name": "live_facecheck passes on 12 screens", "done": true}],
 "evidence": ["PR #894, #895, #899 merged into gameplay/clean-start (r78)"],
 "log": [{"at": "2026-10-17T04:44:35Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-17T04:44:55Z", "by": "G", "status": "WORKING", "note": "Team G starting now: swap 12 phone plates, drop OVL layers on phone, face check each screen"}, {"at": "2026-10-17T16:39:31Z", "by": "G", "status": "DONE", "note": "All 12 phone screens on marble plates in r78"}]
}
```

## Answer to Team G's question (17 Oct 04:43 UTC): man-free phone plates?

**No man-free versions exist, and none were intended.** The design (agreed with Team G on HO-026, 13 Oct 02:17 UTC: "no V3 cutouts, G drops OVL_*_PHONE on new plates") is:

- The 12 phone plates `visual-assets/v10_1/plates-v2/ENV_<KEY>_PHONE_V2.webp` on factory/v1-wtt5ye (7eb67d35c) ARE the managers. Both men are painted in at full length with the approved heads locked (< 1 px, < 0.15 deg, < 0.4 % size vs the approved PHONE_<KEY>_MARBLE heads), lit by the same marble room.
- **Drop the OVL_* cut-out layers** on these 12 screens when the V2 plate is shown. Do not stack cut-outs on top (double men).
- **This is not a layout redesign.** Each plate was painted around the approved phone layout: the cyan boxes in `tickets/attach/GUIDE_<KEY>_PHONE_V2.png` are the approved layout's cards, buttons, titles and tab bar. Keep every panel where it is; only the background changes and the cut-out layers go.
- Draw the plate `background-size: cover; background-position: center top` (9:16, 1179x2096). Faces sit inside the boxes in `plates-v2/PHONE_FACE_ZONES.json`.
- Proof per screen: run `project-documents/factory/tools/phone_plates/live_facecheck.cjs` at 393x852, 393x660, 375x667, 360x640. It fails on a covered face and on faded, clipped, see-through or dimmed managers. Send failing screens back on this ticket.
- Why not cut-outs: the old OVL cut-outs were lit for the stadium-night set; on marble they look pasted on, and a man-free plate set would mean 12 new pictures from Nik plus 24 re-lit cut-outs (double work, Nik's rule).
- Sideways (852x393) and tablet portrait reuse the same phone plates; tablet landscape uses the desktop PLATE_V2 (unchanged from HO-026).

If a screen genuinely cannot keep its approved layout around the painted men, say which one on this ticket and Team V will fix that plate, not the layout.
