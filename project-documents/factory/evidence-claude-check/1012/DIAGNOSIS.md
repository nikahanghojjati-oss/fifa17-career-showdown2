# 1012 · Season Results on phone: why it looks broken (main bc77a0b9)

- The screen is the game's season form moved into Team V's shell by `js/seasonFinalV10.js:49-65`; phone layout comes from `visual-assets/v10_1/season-results/app.css` (the game adapter, main only) on top of `season-results.css`.
- **Clipped frame and double scroll:** the screen cannot scroll (`app.css:5-6`); the review panel is a fixed absolute window (`app.css:56`, top 54%, bottom 74px, about 205px tall at 393x660) holding 880-1090px of content; the entry card scrolls too (`app.css:12`).
- **Half-width card:** `app.css:20` sets `.seasonReviewGrid{grid-template-columns:1fr 1fr}` with no phone rule, and the rival's card stays hidden until both publish (`js/productionSharedSeasonResults.js:113-115`), so one card sits in the left half.
- **White cards:** current main draws them dark (`app.css:133`, r61); white is the pre-r61 look (`css/app.css:181`), so the phone may have run an older cached build.
- **Stacked bars:** each module adds its own warning line and button (`js/seasonEngine.js:75-77`, `productionSharedSeasonResults.js:116`, `productionSharedSeasonCommit.js:73/106`, `productionSharedMultiSeasonProgression.js:119/127`); "ACKNOWLEDGED ✓" and "PLAN COMPLETE ✓" are disabled buttons used as status.
- **Button over the reconciliation text and cut-off line:** `app.css:21` makes every `.seasonReviewActions` sticky with a solid background, including the reconciliation panel's (`productionSharedLocalReconciliation.js:25`), inside the 205px window.

Fix (tested by simulation, not on a real phone): `proposed-app.css` appended to main's `app.css`. Before: `before-sheet.jpg`; after: `fixed-sheet-A.jpg`, `fixed-sheet-B.jpg`.
