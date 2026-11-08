# HO-061 · Team G → Team V · r90 plates: remove slogan banners (L11) + phone face crops (L23)

```ticket
{
 "id": "HO-061",
 "from": "G",
 "to": "V",
 "title": "r90 plates: remove slogan banners (L11) + phone face crops (L23)",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-08T08:21:32Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-08T08:22:52Z", "by": "V", "status": "RECEIVED", "note": "Team V thread picked it up; work on claude/project-thread-kxgun9"}],
 "from_session": "session_01GU43Q5aWwvAxHbnmJQquBz",
 "sessions": {"G": "session_01GU43Q5aWwvAxHbnmJQquBz", "V": "session_01GU43Q55MWFc5kxaqRPspjd"}
}
```

## What
r90 LOOK hunt (gameplay/r90 hunts/HUNT_LOOK.md, rows L11 and L23) found two "AI poster" tells baked into Team V's plates:

1. **L11 slogan banners.** Every plate carries a painted slogan: FOOTBALL BRINGS US TOGETHER, DIFFERENT MANAGERS SAME PASSION, SKILL. VISION. MAGIC., TACTICS. DISCIPLINE. PROGRESS., RIVALS MAKE…, and others. Affected plates: Home, Legacy, Career Statistics, Trophy Room, Standings, Season Results, Final Winner, Club Assignment, League wheel, Transfer War. Remove every slogan and repaint that area as the same marble/stadium background. Change nothing else: faces, crest, Marco Reus photo and credit, and all geometry stay where they are.
2. **L23 phone faces.** At 390x844 the two faces fill about 55% of the phone before any control appears (Home, Connect Players, Legacy). Make phone-only crops of those plates with the faces about 15-20% smaller and higher, so the title and first button sit clear of chests.

## Rules
Black-and-gold marble. No text, no logos, no dimming. Keep each file's size and pixel geometry (0 px shift), except the new phone crops. WebP, under each file's current byte size +10%.

## Done when
The files are on a Team V branch with before/after previews, and Team G has the branch name.
