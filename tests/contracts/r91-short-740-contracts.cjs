"use strict";
// r91 layout hunt (art phone audit, 740x360; the browser side is tests/browser/r80-short-screens-audit.cjs at 740x360):
//   S1 Season Review: in the 640-880 x 340-410 landscape window both result cards sit in grid column 1 (the one column that
//      window uses); the app.css landscape rule that puts Nik in column 2 opened a second content-sized track, squeezed
//      Daniel's card to 87px and ran its trophy chips under the CONFIRM bar.
//   T1 Trophy Room: in the same window the manager names keep their column (no gap, tighter tracking), type stays at the 12px floor.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const season = fs.readFileSync(path.join(root, "js/seasonFinalV10.js"), "utf8");
const career = fs.readFileSync(path.join(root, "js/careerScreensV10.js"), "utf8");
const WIN = "@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {";
const start = season.indexOf(WIN);
assert.ok(start >= 0, "S1 the 740x360 window block exists");
const end = season.indexOf("\n}", start);
const block = season.slice(start, end);
assert.ok(/\.seasonReviewGrid > :is\(#seasonReviewOne,#seasonReviewTwo\) \{\s*grid-column:1;/.test(block), "S1 both result cards go to column 1 inside the 740x360 window block");
assert.ok(/\.seasonReviewGrid \{\s*min-width:0; grid-template-columns:minmax\(0,1fr\);/.test(block), "S1 the grid in that window is the one column the card fix goes with");
const t = career.indexOf(WIN, career.indexOf("TROPHY_SIDEWAYS_1730_CSS"));
assert.ok(t >= 0, "T1 the Trophy Room has its own 740x360 window block");
const tb = career.slice(t, career.indexOf("\n}", t));
assert.ok(/\.managerCounts \{ gap:0; \}/.test(tb) && /\.managerCounts span \{ letter-spacing:\.02em; \}/.test(tb), "T1 names have no gap and tight tracking");
assert.ok(!/font-size/.test(tb), "T1 the type size is untouched (12px floor)");
console.log("r91 short 740 contracts passed (4 checks)");
