# HO-052 · Team G → Team V · SP reveal: lower-third name overflow on tablet landscape (F8-09)

```ticket
{
 "id": "HO-052",
 "from": "G",
 "to": "V",
 "title": "SP reveal: lower-third name overflow on tablet landscape (F8-09)",
 "kind": "bug",
 "priority": "normal",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-01T12:30:53Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-01T12:35:09Z", "by": "V", "status": "RECEIVED", "note": "Team V picked it up 12:36 UTC. ETA: PR into gameplay/r87 by 14:15 UTC, inside the 15:00 freeze (2.0.0). Bases on #1168 once it merges, else on its branch."}],
 "from_session": "session_01GU43Q5xHsv4Q8dmAPKsP5f"
}
```

## What
Special Player reveal page (visual-assets/v10_1/special-player/index.html): on tablets in landscape, the lower-third name plate overflows. Long player names run past the plate. Found by Fable job 8 (finding F8-09), on gameplay/r87 55a7a96f.

## Where
The lower-third name block on the SP reveal card. Check the long names in data/marqueePlayers.js (e.g. "Bastian Schweinsteiger"-length names, plus accented names).

## Done when
- At 1024x768, 1180x820 and 1366x1024 landscape (and still at phone and desktop sizes), every name fits inside the plate on one line, shrinking and never cut off or overlapping.
- No dimming, nothing covers anything, the look is unchanged otherwise. Keep "Special Player"/"SP" wording.
- Base your PR on gameplay/r87 after PR #1168 (Team G's SP pack fixes, same page) merges, or rebase onto it. One PR into gameplay/r87, with before/after shots at those sizes.

## Timing
The r87 (2.0.0) freeze is 15:00 UTC. If it can't be green by then, it ships in 2.0.1. Say which.
