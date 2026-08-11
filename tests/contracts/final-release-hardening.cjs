const assert = require("node:assert/strict");
const fs = require("node:fs");

const appCss = fs.readFileSync("css/app.css", "utf8");
const footballVisuals = fs.readFileSync("js/footballVisuals.js", "utf8");
const footballAudit = fs.readFileSync("tests/browser/football-visual-audit.cjs", "utf8");

assert.ok(
    appCss.includes('.backButton,.compactButton{min-height:44px;'),
    "Shared compact/back controls must meet the 44px touch-target floor."
);
assert.ok(
    !appCss.includes('.backButton,.compactButton{min-height:42px;'),
    "The obsolete 42px compact/back control floor must not return."
);

assert.ok(
    footballVisuals.includes("function settleFootballVisualPaint(panel, image)"),
    "Football visual runtime must keep the decoded-paint settlement helper."
);
assert.ok(
    footballVisuals.includes('typeof image.decode === "function"'),
    "Football visual runtime must use HTMLImageElement.decode when available."
);
assert.ok(
    footballVisuals.includes('schedule(() => schedule(() => {'),
    "Football visual loaded state must settle across two paint frames."
);
assert.ok(
    footballVisuals.includes("settleFootballVisualPaint(panel, image);"),
    "Football visual load paths must use the paint-settlement helper."
);
assert.ok(
    footballAudit.includes("requestAnimationFrame(() => requestAnimationFrame(resolve))"),
    "Visual evidence capture must wait across two paint frames."
);

console.log("v1.1 final hardening contracts passed: 44px controls and decoded football-photo paint settlement are protected.");
