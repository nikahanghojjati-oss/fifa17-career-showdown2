# HO-049 · Team G → Team V · r87 start screens: season chips, LED words, no-dim CTA, Career Start options

```ticket
{
 "id": "HO-049",
 "from": "G",
 "to": "V",
 "title": "r87 start screens: season chips, LED words, no-dim CTA, Career Start options",
 "kind": "design",
 "priority": "normal",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-31T03:48:59Z", "by": "G", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q8SekYEo4yZo5Tik3P"
}
```

# r87 start-screen look items (from the Team G polish audit)

Source audit: /mnt/project-files/gameplay/r87/helpers/POLISH_START_SCREENS.md (shots in start-polish-shots/). Team G already fixed and merged into gameplay/r87 (#1096): phone seasons header/footer hide, Club lock note inside panel, SP pack under title at 1366, SP name plate, gold gradient on Connect + phone Continue, no-dimming on Continue Career, SP phone GPU caps. Please do NOT redo those.

Team V items (base: latest gameplay/r87; one PR into gameplay/r87, CSS/assets only unless noted):
1. **Setup / seasons screen:** replace the plain dropdown look with four gold marble chips (1 / 3 / 5 / 10 seasons). Keep the real <select> underneath as the value (Team G wiring stays). Add a brush NEW SHOWDOWN wordmark image like the other screens.
2. **Special Player LED board:** words split at the panel joins ("SPE|CIAL PLAYER", "FI|FA 17"). Fix the texture so no word crosses a join.
3. **Special Player Continue while disabled** turns grey/darker (.cta[disabled]) — against the no-dimming rule (HO-027). Give the waiting state a non-dimmed look (e.g. gold outline + "WAIT…" label), same size.
4. **Career Start** (needs Nik's pick, so send 2 options as a gallery, don't ship): make it its own marble stage instead of a box covering the wordmark and both faces; show each club crest beside the club (crest renderer already loaded).

Rules: premium black-and-gold marble, nothing covers anything at any size, no dimming, no flash. Desktop 1366x768 + 1920x1080 and phone 393x660 + 375x553 shots for each change. Wake the r87 lead (session_01GU43Q8SekYEo4yZo5Tik3P) when the PR is up.
