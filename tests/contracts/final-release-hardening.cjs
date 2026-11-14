const assert = require("node:assert/strict");
const fs = require("node:fs");

const appCss = fs.readFileSync("css/app.css", "utf8");
const footballVisuals = fs.readFileSync("js/footballVisuals.js", "utf8");
const footballAudit = fs.readFileSync("tests/browser/football-visual-audit.cjs", "utf8");
const storage = fs.readFileSync("js/storage.js", "utf8");
const storageTransaction = fs.readFileSync("js/storageTransaction.js", "utf8");
const showdown = fs.readFileSync("js/showdown.js", "utf8");
const saveLibraryRuntime = fs.readFileSync("js/saveLibraryRuntime.js", "utf8");
const stabilityAudit = fs.readFileSync("tests/browser/stability-audit.cjs", "utf8");
const burninScript = fs.readFileSync("tests/support/run-release-burnin-pass.sh", "utf8");

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
assert.ok(!showdown.includes("replace the active save"), "New Showdown must not resurrect the retired destructive singleton-replacement product model.");
assert.ok(
    saveLibraryRuntime.includes("function runtimeAppendSaveEntry")
        && saveLibraryRuntime.includes("saves:[...library.saves.map(runtimeCloneValue),runtimeCloneValue(newEntry)]")
        && saveLibraryRuntime.includes("profiles:runtimeMergeProfiles(library.profiles,newProfiles)"),
    "New Showdown must append a stable Save while retaining every existing Save and stable Local Profile identity."
);
assert.ok(
    stabilityAudit.includes("Corrupt singleton bytes fail closed at canonical Start"),
    "Unreadable historical singleton bytes must remain fail-closed behind canonical Start."
);
assert.ok(
    stabilityAudit.includes("Unreadable legacy singleton bytes must remain byte-for-byte untouched when canonical Start fails closed."),
    "Corrupt historical singleton failure must preserve the original bytes rather than silently migrating or replacing them."
);
assert.ok(
    stabilityAudit.includes("Corrupt singleton failure must not fabricate Save Library authority."),
    "Corrupt historical singleton failure must not fabricate internal storage authority."
);
assert.ok(
    stabilityAudit.includes("saveLibraryStorageKey") && stabilityAudit.includes("Failed Save Library write must roll back without accepting authority."),
    "Quota rollback evidence must target the current internal storage writer rather than the retired singleton writer."
);
console.log("Canonical Start remains fail-closed for unreadable historical bytes while internal Save creation stays additive and identity-preserving.");

const hasSavedSection = storage.match(/function hasSavedShowdown\(\)\{[\s\S]*?function invalidateLegacyCache/)?.[0] || "";
assert.ok(hasSavedSection, "hasSavedShowdown validity probe is missing.");
assert.ok(!hasSavedSection.includes("reportStorageError"), "Expected corrupt active-save validity probes must not emit runtime console errors.");
console.log("Corrupt active-save validity probing remains silent; canonical Start crosses the strict storage boundary before additive creation.");

assert.ok(
    storage.includes("function captureCareerModeRawRestoreSnapshot()")
        && storage.includes("failedKeys")
        && storage.includes("applyCareerModeRawStorageTransaction(plan,expectedRaw=null)"),
    "Destructive restore must retain strict raw snapshots and an explicit transaction precondition boundary."
);
assert.ok(
    storageTransaction.includes('readValue(io,name,"prewrite")')
        && storageTransaction.includes("committedKeys")
        && storageTransaction.includes("rollbackOwnershipConflicts")
        && storageTransaction.includes("committedKeys.slice().reverse()"),
    "Restore must preserve last-moment byte preconditions, mutation ownership, reverse rollback order and anti-clobber ownership conflicts."
);
assert.ok(
    !burninScript.includes('npm run test:restore-browser') && burninScript.includes('npm run test:browser'),
    "Burn-In must repeat the complete stateful integration journey without duplicating Candidate C's dedicated proof."
);
console.log("Storage hardening stays permanent: strict snapshots, byte preconditions, ownership-scoped rollback, and non-duplicative integration Burn-In are protected (r91: the restore UI and its dedicated browser gate were cut).");