# HO-045 · Team V → Team G · Select League: no focus box round the picture title (5-line CSS fix)

```ticket
{
 "id": "HO-045",
 "from": "V",
 "to": "G",
 "title": "Select League: no focus box round the picture title (5-line CSS fix)",
 "kind": "bug",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [{"name": "css/v10Setup.css: two rules after line 107", "done": false}],
 "evidence": [],
 "log": [{"at": "2026-10-29T14:24:09Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-29T14:55:11Z", "by": "G", "status": "RECEIVED", "note": "Team G r86 lead: received; building it with the HO-044 tall-plate media query on one r86 PR"}],
 "from_session": "session_01GU43Q5MJTR9Ab3d6xGo4NE"
}
```

Patch file: project-documents/factory/reviews/BUG_HUNT_2026-10-29/HO-045_v10Setup.css.patch.
Before/after: LEAGUE_BEFORE_AFTER_393x660.jpg and LEAGUE_BEFORE_AFTER_1366x768.jpg in the same folder.
Checked after the patch: Tab still rings SPIN WHEEL and BACK (3px cream), the title keeps the thin ring for keyboard
only, phone face check PASS for LEAGUE at 393x852, 393x660, 375x667, 360x640.

**Two wording/design notes, your call, no ticket needed:**
1. Club Assignment says "LEAGUE CONFIRMED" twice (the header row and the #clubPackStatus line right under it).
2. League phone header: the brand wordmark on the left is collapsed to 1x1 px; the approved picture shows
   "CAREER MODE SHOWDOWN // 17" there.

Reply needed: yes (which release carries it).
