const assert = require("node:assert/strict");
const fs = require("node:fs");

const appCss = fs.readFileSync("css/app.css", "utf8");
const footballVisuals = fs.readFileSync("js/footballVisuals.js", "utf8");
const footballAudit = fs.readFileSync("tests/browser/football-visual-audit.cjs", "utf8");
const storage = fs.readFileSync("js/storage.js", "utf8");
const showdown = fs.readFileSync("js/showdown.js", "utf8");
const stabilityAudit = fs.readFileSync("tests/browser/stability-audit.cjs", "utf8");

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

assert.ok(storage.includes("function hasStoredActiveShowdownData()"), "Raw active-slot occupancy must remain separately detectable from valid Continue state.");
assert.ok(showdown.includes("const hasStoredActiveData = hasUsableActiveSave"), "New Showdown must distinguish valid active saves from occupied corrupt raw data.");
assert.ok(showdown.includes("replace the active save${existingName}"), "Destructive active-slot replacement must remain confirmation-gated.");
assert.ok(stabilityAudit.includes('page.waitForEvent("dialog", { timeout: 5000 })'), "Corrupt-save replacement regression must fail fast instead of hanging CI.");
console.log("Corrupt active-slot replacement protection is permanently gated.");
