# Layout auditor

Report-only tool. It walks every screen of the game that can be reached **without Google sign-in**, at five viewport sizes, measures DOM geometry and reports visual defects. It changes no game code and writes nothing outside its output folder.

## Run

```
# serve the repo (any static server; example uses http-server)
npx http-server -p 4391 -s -c-1 . &       # note the PID, kill that PID afterwards
CMS_BASE_URL=http://127.0.0.1:4391/ LAYOUT_AUDIT_OUT=/some/out/dir node tools/layout-audit/layout-audit.cjs
```

The repo's own server also works: `node tests/support/static-server.cjs` (port 4173, the default `CMS_BASE_URL`).
Chromium comes from `tests/support/chromium-runtime.cjs` (same as the browser audits; `CMS_CHROMIUM_PATH` overrides). A full run takes about 5 to 8 minutes.

Optional filters: `LAYOUT_AUDIT_SIZES=393x660,768x1024`, `LAYOUT_AUDIT_SCREENS=club-wheel,settings` (prefix match on screen ids; other screens are still walked so state is reached, but not measured).

Output in `LAYOUT_AUDIT_OUT`: `findings.json` (every finding with screen, size, rule, selector, rect, detail, screenshot), `SUMMARY.md` (screen x size table, per-rule table, top 30 in plain words, unreached screens), `top30.json`, `screenshots/<screen>__<size>.png` (viewport screenshot, one per screen x size).

## Sizes (run 3)

393x660, 375x553 (phone with Chrome bars), 360x560, 412x750 (phones, tap-target and bottom-edge rules on), 1440x900, 1366x650 (Chromebook with Chrome bars), 1280x620, 1536x730. Edit `SIZES` in `layout-audit.cjs` to change them.

## Sizes (earlier runs)

360x640, 393x660 (phones: touch + mobile, tap-target rule on), 768x1024, 1440x900, 1920x1080. Reduced motion is on so entrance animations are settled.

## Screens and fixtures

Every capture is the Team V (v10) screen a player sees, rendered by the real module; `findings.json` `captureMeta` and SUMMARY.md record per capture the route, module and DOM evidence. Old-design local routes are not captured.

Reusable fixtures live in `fixtures/` so other teams measure the same screens:
- `fixtures/data.cjs`: `build()` returns one filled showdown (Daniel playerOne vs Nik playerTwo, three accepted seasons with trophies on both sides, final reconciliation, terminal close, the career model from `tests/fixtures/data-contract-v1/finished-three-seasons.json`). `node fixtures/data.cjs` prints it as JSON.
- `fixtures/page-fixtures.js`: page-side installers on `window.__auditFixtures`: `installTransfer()` (real `productionSharedTransferChallenge.js` + `transferScreenV10.js`, fake Spark read, role playerOne, phases WINDOW_OPEN/GUESS_ENTRY/SIGNING_ENTRY/COMPLETED via `__auditTransfer`), `installFinalState(fx)`, `mountCareer(screen, model)` (Statistics, Trophy Room), `mountRivalryLegacy(screen, model)` (Rivalry Statistics, Legacy).

Plan (`walk()`): home-empty, rule-book, statistics-career and trophy-room (careerScreensV10 + fixture model), settings (overlay plus one capture per panel), create-showdown (and connect-players when the build opens it first), league wheel, club wheel, dashboard, transfer-war-window/guess/signing/completed, season-results-entry/review (seasonFinalV10 skin on productionSharedSeasonResults, shared marker on), final-winner (seasonFinalV10 final skin; route `seasonEntry`, season-results `canRoute` forced true), statistics-rivalry and legacy-history (rivalryLegacyV10 + fixtures), standings (`CareerModeV10Screens.navigate("standings")`).
Connect Players: `js/connectPlayersScreenV10.js` is only on branches that have it (not main r62); on main it is listed as unreached. Where it exists it is captured through the real route (New Showdown opens it).
A screen that cannot be reached is listed under `unreached` with the reason, active screens and an `UNREACHED-*.png` screenshot.
Destructive Settings actions (restore, reset) are never confirmed.

## Rules (measure.js, runs inside the page)

Only visible elements count: non-zero box, no `display:none`/`visibility:hidden`/`opacity:0` on itself or an ancestor, not a screen-reader-only helper (1px box, `clip: rect(0,0,0,0)`, `clip-path: inset(50%)`).

1. `text-clipped`: an element with its own text, overflow hidden/clip and scrollWidth/scrollHeight > client size + 1 (ellipsis and line-clamp included); plus text or controls whose real text line boxes (or control box) stick out of an overflow-hidden ancestor by more than 3px. Overshoot of 4px or less is tagged `minor`.
2. `overlap`: intersection over 8px2 between controls, headings, cards and images that are not ancestor/descendant (clipped to their visible area).
3. `off-screen`: controls partly outside the viewport on the left/right, or past top/bottom when neither the page nor a scroll container can reach them.
4. `page-scroll`: `document.scrollingElement` scrollHeight > innerHeight + 1 or scrollWidth > innerWidth + 1. Note this app scrolls inside `main`/screens on most screens, so vertical page scroll is rare; check the screenshot and the off-screen rule for hidden content.
5. `stretched-image`: `<img>` with `object-fit: fill` whose rendered ratio differs from natural by over 3%; CSS `background-size: 100% 100%` images measured against the real image ratio.
5a. `art-clipped`: share of a figure image's non-transparent pixels (alpha mask) cut off by the screen edge or an overflow-hidden parent; over 10% reported, under 25% marked minor, `object-fit: cover` plates skipped.
5b. figure/figure `overlap` is measured on real pixels (alpha mask), not boxes; under 8% of the smaller figure is minor. Also `border-image` frames whose corners scale unevenly (`stretched-image`).
3b. phones: a main action within 10px of the bottom edge is reported as `off-screen` (home-indicator zone), minor.
6. `tap-target` (phones only): visible controls under 32x32.

## Run 3 rule changes

- Figure/figure `overlap` is skipped when both images sit in the same `aria-hidden` art group (one composed hero). `art-clipped` now judges only the head band (top 40% of the figure's pixels) and only cuts by the screen edge; images inside buttons/links/tiles are marked `severity: ignored` (kept in findings.json, not counted).
- `duplicate-text`: same text twice in overlapping boxes, plus screen-reader-only text that is actually painted (missing visually-hidden CSS, the ghost title).
- `edge-gap`: measured on the screenshot pixels (built-in PNG decoder): a 4px or wider strip of body/main background colour along an edge that contrasts with the content beside it; edges covered by a fixed/sticky bar are skipped.
- Probable false positives still seen: wordmark-over-hero-figure overlaps on Home, Legacy and Standings (separate images, not in one aria-hidden group).

## Tuning and known false-positive patterns

Thresholds were tuned by reading screenshots of home, club wheel, rule book, settings and season screens at 393, 768 and 1440. Already filtered: screen-reader-only helpers (`sd-visually-hidden`), `position:fixed` elements (not clipped by ancestors), scrolling content passing under fixed/sticky or other non-scrolling chrome (bottom nav, settings footer), wrapped inline links, pure image-vs-card stacking (decorative art behind a panel), pointer-events:none layers, full-viewport backdrops, containers whose scrollWidth is inflated by decoration (only elements with their own text are tested for scroll overflow).

Still possible false positives:
- Brush/display fonts whose glyphs are taller than the font box; `minor` 2px clips such as `#clubNameOne` descenders are real but cosmetic.
- Deliberate bleed: hero art, sliding carousels or entrance-animated cards that are meant to extend past the edge of a clipping parent (the club-pack cards at tablet width look like this but are in fact cut at the screen edge).
- Overlaps where a control is intentionally stacked on an illustrated card, or two absolutely positioned decorative boxes (they are included if they are interactive/heading/card/image).
- Overlaps hidden on purpose: content scrolling under a sticky bar is skipped, so "last item hidden behind the footer" is NOT reported; look at screenshots.
- Tap targets that are inline text links styled as buttons, or controls that are enlarged by a parent label.
- The fixture-induced provider error toast is removed before measuring; real error toasts are not part of the audit.
- Below-the-fold content inside an inner scroller is measured, but the screenshot only shows the first viewport.
