# HO-006 · Team V → Team G · Wire V-247: phone Home tile icons large and centred

```ticket
{
 "id": "HO-006",
 "from": "V",
 "to": "G",
 "title": "Wire V-247: phone Home tile icons large and centred",
 "kind": "design",
 "priority": "top",
 "worker": "codex",
 "parent": null,
 "job": "378",
 "status": "WORKING",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T18:32:15Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-05T18:40:48Z", "by": "G", "status": "RECEIVED", "note": "Team G lead picked it up"}, {"at": "2026-10-05T18:40:48Z", "by": "G", "status": "WORKING", "note": "Folded into r60 (PR #378, commit d0d0cbc8). V-247 block appended to main's home.css as is; on the 7-tile phone grid (3 per row) the label keeps the top and the icon fills the lower right at up to 62% of tile height, never clipped. Checked 390x844, 393x660, 360x640, 375x553."}]
}
```

## What
Wire V-247 on main: the phone Home tile icons (Start a Showdown, Rule Book, Settings; also Legacy, Statistics, Trophy Room when shown) become large, vertically centred on the right side and fully inside each tile, as in GOAL_HOME. Nik (2026-10-05, iPhone): the icons sit tiny and out of place in the bottom corner; make them sit in the tile like the mockup.

## Why
On main the phone rules give the icons 38px (Rule Book, Settings) and 62px (Start a Showdown), anchored at the bottom-right with negative offsets, so the tile edge and the cut corner clip them.

## Where (two files on main)
1. `visual-assets/v10_1/home/home.css`: copy the new block at the end of the file from factory/v1-wtt5ye (V-247, PR #381, commit 3b8cb664, headed "V-247 · Nik's phone review"). It is the only change to that file; the rest of main's home.css already matches factory apart from the font paths, which stay as main has them.
2. `css/homeV10.css`: delete this line in the phone portrait block (otherwise it wins over the new rule for Start a Showdown):
   `#mainMenu.v10Home #newShowdown .tileArt { width: 62px; height: 62px; right: 0; bottom: -8px; }`
Exact diff against main 02080325: `project-documents/factory/reviews/V-247/TEAM_G_MAIN.patch` on factory/v1-wtt5ye (applies with `git apply`).

## Done when
- At 393x660, 360x640 and 375x553 (portrait): each icon about 92% of tile height, centred vertically, right gap 14px, full opacity, nothing clipped; no page scroll; bottom bar clear.
- Desktop unchanged (the block is phone-portrait only; `translate` keeps the hover tilt).
- Team V already rendered main 02080325 + the patch at those three sizes: `project-documents/factory/reviews/V-247/after-*.jpg`, before/after `BEFORE_AFTER_393.jpg`. Measured at 393x660: Start a Showdown icon 59px in a 66px tile, Rule Book/Settings 59px in 66px; scrollHeight = 660.
- Service worker cache version bumped as your release does for any CSS change.
