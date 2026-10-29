# HO-043 · Team V → Team G · Select League: no focus box round the picture title (5-line CSS fix)

```ticket
{
 "id": "HO-043",
 "from": "V",
 "to": "G",
 "title": "Select League: no focus box round the picture title (5-line CSS fix)",
 "kind": "bug",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [{"name": "css/v10Setup.css: two rules after line 107", "done": false}],
 "evidence": [],
 "log": [],
 "from_session": ""
}
```

# Select League title: a box is drawn round the brush lettering

Team V swept live main (e849e0ff) screen by screen on desktop and phone (report with 232 pictures:
project-documents/factory/reviews/BUG_HUNT_2026-10-29/REPORT.md on factory/v1-wtt5ye). Every owner rule passes on every
screen. One real bug, with the fix ready:

**What shows.** `#leagueWheelScreenScreenTitle` is the TITLE_LEAGUE_V1 wordmark picture. The route focuses it, and the
JOB-1132 keyboard ring (`html[data-v10-setup="league"] #app :is(... [tabindex]):focus-visible`, css/v10Setup.css ~1023)
matches the h2 as well, so a black box with a gold edge is drawn round the lettering on desktop and phone whenever the
screen opens without a tap first (reload, resume, keyboard, every automated picture). After a tap the box goes, but the
1px ring from `v26Skin > h2[data-route-focus-target]:focus` (line 107) still shows round the picture on every open.

**Fix (css/v10Setup.css, add right after line 107), already checked on a patched main:**

```css
/* HO-043: the Select League title is a picture (TITLE_LEAGUE_V1), so a route focus draws no ring round it: the JOB-1132
   keyboard ring (3px cream outline + gold box-shadow) boxed the wordmark after a reload or keyboard route, and the 1px
   :focus ring showed on every open. Keyboard users keep the thin ring, like Club (css/v10Club.css:114-115). */
html[data-v10-setup="league"] #app #leagueWheelScreen.v26Skin > h2[data-route-focus-target="true"]:focus { outline: none; box-shadow: none; }
html[data-v10-setup="league"] #app #leagueWheelScreen.v26Skin > h2[data-route-focus-target="true"]:focus-visible { outline: 1px solid rgba(242, 196, 91, .5); outline-offset: 4px; box-shadow: none; }
```

Patch file: project-documents/factory/reviews/BUG_HUNT_2026-10-29/HO-043_v10Setup.css.patch.
Before/after: LEAGUE_BEFORE_AFTER_393x660.jpg and LEAGUE_BEFORE_AFTER_1366x768.jpg in the same folder.
Checked after the patch: Tab still rings SPIN WHEEL and BACK (3px cream), the title keeps the thin ring for keyboard
only, phone face check PASS for LEAGUE at 393x852, 393x660, 375x667, 360x640.

**Two wording/design notes, your call, no ticket needed:**
1. Club Assignment says "LEAGUE CONFIRMED" twice (the header row and the #clubPackStatus line right under it).
2. League phone header: the brand wordmark on the left is collapsed to 1x1 px; the approved picture shows
   "CAREER MODE SHOWDOWN // 17" there.

Reply needed: yes (which release carries it).
