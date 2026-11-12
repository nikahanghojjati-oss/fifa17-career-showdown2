"use strict";
// r91 layout hunt (art state captures, Legacy with a 10-season Showdown at 1920x866): the season-by-season pane ended 24 px
// below the gold archive frame at every desktop size, so the last seasons ran past the frame and under VIEW SEASON HISTORY /
// BACK TO HOME. Pinned here (the geometry itself is measured in a browser; this guards the rules that make it):
//   H1 from 1700px wide the pane's max-height leaves it 12 px inside the frame (calc(100% - 60px)); the short screens keep 24 px (no inner scroller at 1100x600)
//   H2 on wide desktops the Europa League line sits beside the league line, so ten seasons fit the pane without scrolling
//   H3 the pane still scrolls inside itself when a Showdown is longer than it can show (never cut text)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const css = fs.readFileSync(path.resolve(__dirname, "../../css/rivalryLegacyV10.css"), "utf8");
const PANE = "#app #legacy[data-rivalry-legacy-v10] .legacySeasonHistory:not([hidden])";
assert.ok(/@media \(min-width:1700px\) \{[^@]*?\.legacySeasonHistory:not\(\[hidden\]\) \{ max-height:calc\(100% - 60px\); \}/.test(css), "H1 on the wide desktops the pane ends 12px inside the frame");
assert.ok(css.includes("bottom:auto; height:max-content; max-height:calc(100% - 24px);"), "H1 the short screens keep the 24px cap, so no inner scroller appears there (r80 short-screens audit)");
assert.match(css, new RegExp(`@media \\(min-width:1700px\\) \\{[^@]*?${PANE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\.legacyHistoryTable \\.legacyHistoryEuropa \\{ display:inline-block;`), "H2 the Europa League line is inline on wide desktops");
assert.match(css, /\.legacySeasonHistory:not\(\[hidden\]\) \{\s*position:absolute;[^}]*overflow:auto;/, "H3 the pane scrolls inside itself");
console.log("r91 legacy long history contracts passed (3 checks)");
