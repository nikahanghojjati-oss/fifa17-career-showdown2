# HO-005 · Team G → Team V · Mobile Home hero: ghost coat between Daniel and Nik

```ticket
{
 "id": "HO-005",
 "from": "G",
 "to": "V",
 "title": "Mobile Home hero: ghost coat between Daniel and Nik",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T13:02:33Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-05T15:46:05Z", "by": "V", "status": "RECEIVED", "note": "top priority; V2 phone overlays, each manager only"}]
}
```

## What
Fix the mobile Home hero so the area between Daniel's and Nik's coats has no blurred ghost coat. Nik (2026-10-05, iPhone): "On mobile the area between our coats has shadow of extra layer of blurred coat that looks messy and bad, it needs fix."

## Why (Team G checked; this is in the art, not the wiring)
- The phone hero is Team V's `ENV_HOME_PHONE_V1.webp` plate with two overlays stacked on it: `OVL_HOME_DANIEL_PHONE_V1.webp` and `OVL_HOME_NIK_PHONE_V1.webp`, in `visual-assets/v10_1/home/assets/`.
- Each overlay carries a feathered, semi-transparent piece of the OTHER manager:
  - Daniel's overlay has a piece of Nik's coat sleeve along its right edge.
  - Nik's overlay has a piece of Daniel's shirt and coat along its left edge.
- When both overlays stack, those leftovers sit on top of the real coats and read as a blurred double coat between the two men. See `raw-*-overlay-on-magenta.png`: each overlay is drawn on magenta so the leftovers show.
- Nik's overlay also has a thin horizontal line across his jacket, at about 52% of the overlay's height. It is visible on the live hero.
- Still present on r56 (main 00a1eb8): `r56-coat-area-crop.png` was rendered at 390x844 DPR3 from main.
- Nik's photo is from an older runtime. It also shows a teal smudge, the Reus photo credit and the old Continue tile. Those come from his phone not having r56 yet (r56 hides them); they are not part of this ticket. Team G will confirm on his phone after he reopens the app.

## Where
- `visual-assets/v10_1/home/assets/OVL_HOME_DANIEL_PHONE_V1.webp`, `OVL_HOME_NIK_PHONE_V1.webp` (and `ENV_HOME_PHONE_V1.webp` if the plate changes).
- Placement CSS: `visual-assets/v10_1/home/home.css` and Team G's `css/homeV10.css` (phone rules).
- Screenshots: `attachments/HO-005/` on leads/relay.

## Done when
- New phone overlays (V2 names) where each overlay contains only its own manager, cut cleanly at the overlap so the two coats meet with one natural shadow, and the line on Nik's jacket is gone.
- Checked at 390x844 and 430x932 (DPR 3) on the live layout. Team G can render it if Team V sends a branch.
- Team G copies the files, pins their hashes in the foundation contract and ships them in the next release.
