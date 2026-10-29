# Visual bug hunt, live game (main e849e0ff), 29 Oct 2026

Thread: "Hunt and fix visual bugs" (Team V). Live main served locally (the live site is not reachable from the cloud).
Every screen of the game was opened the way the Gate opens it (tests/browser/r80-short-screens-audit.cjs and
phone-marble-facecheck-audit.cjs, read-only verified models), at five window sizes: 1920x1080, 1366x768 (desktop),
393x660 (Nik's iPhone in Safari), 360x640 (no-scroll floor), 375x553 (primary-action floor). 232 pictures; the contact
sheets are in this folder (SHEET_<size>_a/b.jpg). Compared against the approved pictures in
project-documents/factory/mockups/ (NEXT_* desktop, PHONE_*_MARBLE phone). The League wheel spin was left out (thread
"Polish league wheel spin" owns it).

## Result: the game is in good shape

Owner rules, all pass on every screen and size:
- No dim filters, grey or dark overlays, blur or see-through panels on any manager or screen (HO-027).
- Faces never covered: phone face check PASS on all 12 manager screens at 393x852, 393x660, 375x667, 360x640.
- Daniel always left, Nik right.
- Phones no scroll at 393x660 and 360x640 on every screen and tab (r80 audit: 0 findings at both sizes).
- Primary action visible at 375x553 on every screen.
- SIGN IN on Home (desktop and phone).
- Desktop 1366x768 and 1920x1080: 0 findings beyond the 6 listed design items the r80 audit already knows (Home foot
  strips under the footer, soundtrack credit ending in ...).

## Bugs found

### 1. Select League: a box drawn round the title (FIX READY, HO-044)
`#leagueWheelScreenScreenTitle` is the brush wordmark picture (TITLE_LEAGUE_V1). The route gives it keyboard focus, and
the JOB-1132 keyboard ring (`html[data-v10-setup="league"] #app :is(... [tabindex]):focus-visible`, 3px cream outline +
gold box-shadow) matches the h2 too, so a black box with a gold edge is drawn round the lettering on desktop and phone
whenever the screen opens without a tap first (reload, resume, keyboard, every automated picture). After a tap the box
goes, but a thin 1px ring (`v26Skin > h2:focus`) still shows round the picture on every open.
Fix (5 lines, css/v10Setup.css, after line 107): no ring on `:focus`, the thin ring only on `:focus-visible`, like Club
(css/v10Club.css:114-115). Patch: HO-044_v10Setup.css.patch. Before/after: LEAGUE_BEFORE_AFTER_393x660.jpg,
LEAGUE_BEFORE_AFTER_1366x768.jpg. Checked: SPIN WHEEL and BACK keep their keyboard rings; face check PASS at 4 sizes.

### 2. Career Statistics at 375x553: the picked panel is 66px tall (NOTE, no change proposed)
At the primary-action floor the hub starts under the faces (face zone ends at 169px) and the actions take the bottom, so
the Table / Compare / Leaders panel gets 66px and scrolls inside itself (Team G's intended fallback for short phones,
js/careerScreensV10.js "max-height:700px" block). At 393x660 and 360x640 the panel is fine. Picture:
CAREER_STATISTICS_375x553.jpg. Only a layout redesign would change it; not worth it for a floor size.

### 3. Club Assignment: "LEAGUE CONFIRMED" said twice (WORDING NOTE for Team G)
The header shows "✓ LEAGUE CONFIRMED  Premier League" and right under it the status line "LEAGUE CONFIRMED · TWO SEALED
CLUB PACKS READY" (#clubPackStatus). Desktop and phone. The approved picture has one line. Product copy, Team G's call.
Picture: CLUB_PHONE_LEAGUE_CONFIRMED_TWICE.jpg.

### 4. League phone header: brand missing on the left (NOTE)
PHONE_LEAGUE_MARBLE shows "CAREER MODE SHOWDOWN // 17" top-left with the player and season chips right. Live keeps
the chips (SIGN IN / NO ACTIVE SHOWDOWN when signed out) but the brand is collapsed to 1x1 px, so the left is empty.

### 5. Transfer desktop: title and timer sign smaller than the approved picture (DESIGN NOTE)
NEXT_TRANSFER has a big TRANSFER WAR wordmark and a large TRANSFER WINDOW sign with the clock; live draws the wordmark
at 327x68 px and the sign at 150x54 px (the clock icon pokes 15px out of its box). Readable, no rule broken.

## Audit noise (not bugs)
Club "CLUB ASSIGNMENT" fallback cut / "SHOWDOWN CLUB DRAW" 1px spans: screen-reader and hidden fallbacks behind the
picture title. Transfer "15:00 under img": the plate picture wins the hit test under a 3D transform, the timer paints
on top.
