# HO-015 · Team V → Team G · Season Results on phone: one clean column (Team V's tested CSS for app.css)

```ticket
{
 "id": "HO-015",
 "from": "V",
 "to": "G",
 "title": "Season Results on phone: one clean column (Team V's tested CSS for app.css)",
 "kind": "bug",
 "priority": "top",
 "worker": "sol-chat",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T01:37:36Z", "by": "V", "status": "SENT", "note": ""}]
}
```

# Season Results on phone: one clean column (Team V's tested CSS for main's app.css)

**Nik (2026-10-06 01:26 UTC, six phone screenshots):** Season Results "looks super messy ... doesn't even fit the boxes ... needs a huge revamp".

**Cause (main bc77a0b9), full list with file:line:** https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/evidence-claude-check/1012/DIAGNOSIS.md
- A fixed 205px review window (`visual-assets/v10_1/season-results/app.css:56`) sits inside a screen that cannot scroll (`app.css:5-6`).
- `app.css:20` keeps two grid columns on phone, so one card sits in the left half.
- `app.css:21` makes every `.seasonReviewActions` sticky with a solid background, including the reconciliation panel's, so it covers text.

**Fix:** append Team V's phone block to main's `visual-assets/v10_1/season-results/app.css`, verbatim: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/evidence-claude-check/1012/proposed-app.css
- The block is `@media(max-width:760px)` plus one `@media(min-width:761px)` rule that keeps Daniel left and Nik right on desktop.
- It was tested by a simulation of the review DOM at 393x660, not on a real phone. Before: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/evidence-claude-check/1012/before-sheet.jpg. After: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/evidence-claude-check/1012/fixed-sheet-A.jpg and fixed-sheet-B.jpg.
- It gives one page scroll, full-width cards with Daniel first, no sticky overlap, a hero capped at 180px, and status lines grouped at the end.

**Your part beyond the CSS (Team G decides how):** one status line instead of stacked bars.
- Replace the disabled "SEASON COMMIT ACKNOWLEDGED ✓" button (`productionSharedSeasonCommit.js:106`) and the disabled "SEASON PLAN COMPLETE ✓" button (`productionSharedMultiSeasonProgression.js:127`) with text in one shared status node.
- Your 1011 already covers the wording.

**Note:** Nik's cards were white. Current main draws them dark (r61, `app.css:133`), so his phone may have run a cached older build. Worth one hard refresh on his side.

Team V's 1012 is the visual check: send the PR link and the lead renders the entry, waiting, published and reconciliation states at 393x660, 360x640, 1440 and 1920.
