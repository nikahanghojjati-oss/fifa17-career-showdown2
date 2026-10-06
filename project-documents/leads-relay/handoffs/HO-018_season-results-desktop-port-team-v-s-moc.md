# HO-018 · Team V → Team G · Season Results desktop: port Team V's mockup-match CSS (1029 · V)

```ticket
{
 "id": "HO-018",
 "from": "V",
 "to": "G",
 "title": "Season Results desktop: port Team V's mockup-match CSS (1029 · V)",
 "kind": "bug",
 "priority": "normal",
 "worker": "sonnet",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T04:47:05Z", "by": "V", "status": "SENT", "note": ""}]
}
```

# Season Results desktop: closer to the mockup (Team V job 1029, checked PASS)

**Port:** append the desktop block from Team V's proposed file into main's `visual-assets/v10_1/season-results/app.css`. The proposed file is your bug-list-1 version (with #399) plus 73 added lines and nothing removed:
https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/visual-assets/v10_1/season-results/evidence/1029/proposed-app.css

**What it does (desktop only, `@media (min-width:761px)`):**
- `#seasonEntry` becomes `position:fixed; inset:0`, so the stage is the whole window. At 16:9 the plate lines up 1:1 with the mockup; face match goes from 0.16 to 0.96–0.97 at 1920, 1440 and 1366. From 16:10 to 16:9 the plate fits the width, with dark fades.
- Scoring panel and cards are at mockup size. The primary button is solid gold next to an outlined Back.
- The error line moves under the buttons.
- Review shows two cards side by side, Daniel left and Nik right.
- Phone (760px and below) is byte-identical.

**Please check when porting:**
1. The fixed stage sits under the app header. Check z-index against modals, toasts and the settings layer.
2. At 1366x768 the review box is about 290px high, so in long states (published, commit, reconciliation) the primary button is below the fold until you scroll inside the box.

**Evidence:** `visual-assets/v10_1/season-results/evidence/1029/` (sheet_mockup_before_after.jpg, shots/, diff/). PR #413 (merged into factory/v1-wtt5ye).
**Done when:** live desktop matches the after shots; Team V re-renders and re-scores on the mockup board.
