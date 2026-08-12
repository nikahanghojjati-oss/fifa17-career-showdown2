const assert = require("node:assert/strict");
const fs = require("node:fs");

const appCss = fs.readFileSync("css/app.css", "utf8");
const footballVisuals = fs.readFileSync("js/footballVisuals.js", "utf8");
const footballAudit = fs.readFileSync("tests/browser/football-visual-audit.cjs", "utf8");
const storage = fs.readFileSync("js/storage.js", "utf8");
const storageTransaction = fs.readFileSync("js/storageTransaction.js", "utf8");
const showdown = fs.readFileSync("js/showdown.js", "utf8");
const stabilityAudit = fs.readFileSync("tests/browser/stability-audit.cjs", "utf8");
const restoreUi = fs.readFileSync("js/restoreUI.js", "utf8");
const restoreCss = fs.readFileSync("css/restore.css", "utf8");
const restoreAudit = fs.readFileSync("tests/browser/restore-audit.cjs", "utf8");
const maintenanceAudit = fs.readFileSync("tests/browser/restore-maintenance-audit.cjs", "utf8");
const stabilityWorkflow = fs.readFileSync(".github/workflows/validate-stability-lane.yml", "utf8");
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
const compactShowdown = showdown.replace(/\s+/g, "");
assert.ok(
    compactShowdown.includes("hasStoredActiveData=hasUsableActiveSave||hasStoredActiveShowdownData()"),
    "New Showdown must distinguish valid active saves from occupied corrupt raw data."
);
assert.ok(showdown.includes("replace the active save${existingName}"), "Destructive active-slot replacement must remain confirmation-gated.");
assert.ok(stabilityAudit.includes('page.waitForEvent("dialog", { timeout: 5000 })'), "Corrupt-save replacement regression must fail fast instead of hanging CI.");
assert.ok(stabilityAudit.includes("const dismissedClick = page.locator(\"#startShowdown\").click()") && stabilityAudit.includes("await dismissedClick"), "Dialog audit must resolve the modal concurrently with the triggering click.");
console.log("Corrupt active-slot replacement protection is permanently gated.");

const hasSavedSection = storage.match(/function hasSavedShowdown\(\)\{[\s\S]*?function invalidateLegacyCache/)?.[0] || "";
assert.ok(hasSavedSection, "hasSavedShowdown validity probe is missing.");
assert.ok(!hasSavedSection.includes("reportStorageError"), "Expected corrupt active-save validity probes must not emit runtime console errors.");
console.log("Corrupt active-save validity probing is silent while replacement protection remains active.");

assert.ok(
    restoreUi.includes("window.createCareerModeRestorePlan(analysis,confirmedRaw,confirmedChoices)"),
    "Apply must validate the immutable confirmed choices against the exact confirmed reviewed raw snapshot before confirmation."
);
assert.ok(
    restoreUi.includes("window.applyCareerModeRestore(confirmedFile,confirmedChoices,{expectedRaw:confirmedRaw})"),
    "User-facing Apply must carry the exact confirmed file/choices/raw bytes into the post-flush stale-state guard."
);
assert.ok(
    restoreUi.includes("setRestoreControlsLocked(root,true)")
        && restoreUi.includes("confirmedGeneration!==fileGeneration||confirmedFile!==file"),
    "Confirmed restore intent must remain locked and bound to the exact selected file while asynchronous revalidation runs."
);
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
    restoreUi.includes('result.status==="stale-state"') && restoreUi.includes("resetChoices();"),
    "Stale reviewed/transaction state must force fresh restore choices instead of silently reusing old decisions."
);
assert.ok(
    restoreUi.includes("function lockCriticalRecoveryState(root)")
        && restoreUi.includes('root.dataset.criticalRecovery="true"')
        && restoreUi.includes('root.querySelectorAll("input,select,button")'),
    "Unverified rollback must visibly lock every Candidate C control until refresh."
);
assert.ok(
    restoreUi.includes('if(result.status==="write-failed-clean")')
        && restoreUi.includes("RESTORE NOT STARTED")
        && restoreUi.includes('if(result.status==="rolled-back")')
        && restoreUi.includes("RESTORE ROLLED BACK"),
    "Recovery UX must distinguish a zero-mutation first-write failure from a verified rollback."
);
assert.ok(
    restoreUi.includes('if(result.status==="rolled-back")')
        && restoreUi.includes("preserveRecovery=true")
        && restoreUi.includes('if(preserveRecovery)button.disabled=false'),
    "Verified rollback evidence must persist while still allowing a deliberate retry."
);
assert.ok(
    /careerRestorePicker input\[type=file\]\{[^}]*min-height:44px/.test(restoreCss),
    "Candidate C file selection must preserve the 44px mobile touch-target floor."
);
assert.ok(
    [
        "successfulRestoreAndIdempotence",
        "stalePreviewBlocks",
        "safeRollback",
        "criticalRollback",
        "corruptLegacyRequiresReplace",
        "doubleApplyLock",
        "lifecycleInterruptionBeforeCommit",
        "mobileReducedMotion",
        "assertFooterSafe"
    ].every(name => restoreAudit.includes(name)),
    "Candidate C browser audit must keep success, stale-state, rollback, corrupt-data, concurrency, lifecycle, mobile and footer-visibility scenarios."
);
assert.ok(
    maintenanceAudit.includes("confirmedIntentCannotRace")
        && maintenanceAudit.includes("firstWriteFailureIsClean")
        && maintenanceAudit.includes("isCareerModeRestoreInFlight"),
    "v1.1.5 browser audit must permanently protect immutable confirmed intent and zero-rollback first-write failure semantics."
);
assert.ok(
    stabilityWorkflow.includes('npm run test:restore-browser'),
    "Candidate C destructive browser recovery proof must remain inside the permanent Stability Lane."
);
assert.ok(
    burninScript.includes('npm run test:restore-browser'),
    "Every release Burn-In pass must exercise Candidate C restore/recovery."
);
console.log("Candidate C hardening is permanent: immutable confirmed intent, strict snapshots, byte preconditions, ownership-scoped rollback, differentiated recovery UX, 44px file input, deep browser scenarios, Stability and Burn-In coverage are protected.");
