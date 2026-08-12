const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const axePath = require.resolve("axe-core/axe.min.js");
const runLabel = process.env.CMS_AUDIT_RUN || "candidate-c";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const keys = {
    active: "careerModeShowdown.activeShowdown",
    legacy: "careerModeShowdown.legacyShowdowns",
    preferences: "careerModeShowdown.preferences"
};

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

async function openDataManagement(page){
    const opened = await page.evaluate(async () => window.openOptionalModule("legacy"));
    assert.equal(opened, true, "Legacy/Data Management must open through the existing optional-module authority.");
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    await page.locator("#careerModeRestorePanel").waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await page.locator("#legacyImportAnalysis .careerRestoreApply").count(), 0, "Candidate B must remain separate from Candidate C Apply.");
}

function baseShowdown(id, name, schemaVersion = 2){
    return {
        ...(schemaVersion === 2 ? { schemaVersion: 2, integrityWarnings: [] } : {}),
        id,
        name,
        managers: { playerOne: "Alex", playerTwo: "Jordan" },
        totalRounds: 1,
        currentRound: 1,
        status: "Created",
        selectedLeague: null,
        clubs: { playerOne: null, playerTwo: null },
        score: { playerOne: 0, playerTwo: 0 },
        transferChallenges: [],
        rounds: [],
        createdAt: "2026-08-10T10:00:00.000Z",
        updatedAt: "2026-08-10T10:00:00.000Z",
        completedAt: null,
        archivedAt: null
    };
}

async function seedSourceAndCreateEnvelope(page){
    return page.evaluate(async ({ keys }) => {
        const base = (id, name, schemaVersion = 2) => ({
            ...(schemaVersion === 2 ? { schemaVersion: 2, integrityWarnings: [] } : {}),
            id, name,
            managers: { playerOne: "Alex", playerTwo: "Jordan" },
            totalRounds: 1, currentRound: 1, status: "Created", selectedLeague: null,
            clubs: { playerOne: null, playerTwo: null }, score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [], rounds: [],
            createdAt: "2026-08-10T10:00:00.000Z", updatedAt: "2026-08-10T10:00:00.000Z",
            completedAt: null, archivedAt: null
        });
        const active = base("source-active", "Restored Active", 1);
        const exact = { ...base("exact", "Exact History"), status: "Completed", completedAt: "2026-08-10T12:00:00.000Z", updatedAt: "2026-08-10T12:00:00.000Z" };
        const conflict = { ...base("conflict", "Backup Conflict"), status: "Completed", completedAt: "2026-08-10T13:00:00.000Z", updatedAt: "2026-08-10T13:00:00.000Z" };
        const backupOnly = { ...base("backup-only", "Backup Only"), status: "Completed", completedAt: "2026-08-10T14:00:00.000Z", updatedAt: "2026-08-10T14:00:00.000Z" };
        localStorage.setItem(keys.active, JSON.stringify(active));
        localStorage.setItem(keys.legacy, JSON.stringify([exact, conflict, backupOnly]));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 1, reducedMotion: true }));
        currentShowdown = null;
        return window.createCareerModeBackupEnvelope();
    }, { keys });
}

async function seedTarget(page){
    await page.evaluate(({ keys }) => {
        const base = (id, name) => ({
            schemaVersion: 2, id, name,
            managers: { playerOne: "Alex", playerTwo: "Jordan" },
            totalRounds: 1, currentRound: 1, status: "Created", selectedLeague: null,
            clubs: { playerOne: null, playerTwo: null }, score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [], rounds: [], integrityWarnings: [],
            createdAt: "2026-08-10T10:00:00.000Z", updatedAt: "2026-08-10T10:00:00.000Z",
            completedAt: null, archivedAt: null
        });
        const active = { ...base("target-active", "Current Active"), createdAt: "2026-08-11T10:00:00.000Z", updatedAt: "2026-08-11T10:00:00.000Z" };
        const localOnly = { ...base("local-only", "Local Only"), status: "Completed", completedAt: "2026-08-11T11:00:00.000Z", updatedAt: "2026-08-11T11:00:00.000Z" };
        const exact = { ...base("exact", "Exact History"), status: "Completed", completedAt: "2026-08-10T12:00:00.000Z", updatedAt: "2026-08-10T12:00:00.000Z" };
        const conflict = { ...base("conflict", "Local Conflict"), status: "Completed", completedAt: "2026-08-11T13:00:00.000Z", updatedAt: "2026-08-11T13:00:00.000Z" };
        localStorage.setItem(keys.active, JSON.stringify(active));
        localStorage.setItem(keys.legacy, JSON.stringify([localOnly, exact, conflict]));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: false }));
        currentShowdown = null;
    }, { keys });
}

async function prepareScenario(page){
    await waitForApp(page);
    await openDataManagement(page);
    const envelope = await seedSourceAndCreateEnvelope(page);
    await seedTarget(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await openDataManagement(page);
    return envelope;
}

async function snapshot(page){
    return page.evaluate(({ keys }) => ({
        active: localStorage.getItem(keys.active),
        legacy: localStorage.getItem(keys.legacy),
        preferences: localStorage.getItem(keys.preferences)
    }), { keys });
}

async function reviewBackup(page, envelope){
    const before = await snapshot(page);
    await page.locator("#careerModeRestorePanel input[type=file]").setInputFiles({
        name: "candidate-c-backup.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(envelope, null, 2))
    });
    const review = page.getByRole("button", { name: "REVIEW RESTORE" });
    assert.ok(await review.isEnabled());
    await review.click();
    await page.locator("#careerModeRestorePanel .careerRestoreSnapshot").waitFor({ state: "visible", timeout: 8000 });
    assert.deepEqual(await snapshot(page), before, "Read-only restore review must not change canonical storage.");
    return before;
}

async function chooseMergeRestore(page, conflictChoice = "use-backup"){
    await page.locator('select[name="restore-active"]').selectOption("use-backup");
    await page.locator('select[name="restore-legacy"]').selectOption("merge");
    await page.locator('select[name="restore-preferences"]').selectOption("use-backup");
    await page.locator("#careerModeRestorePanel .careerRestoreConflict").waitFor({ state: "visible", timeout: 3000 });
    const conflicts = page.locator("#careerModeRestorePanel .careerRestoreConflict .careerRestoreSelect");
    assert.ok(await conflicts.count() >= 1, "Merge must surface same-ID/different-content conflicts.");
    await conflicts.first().selectOption(conflictChoice);
    await page.locator("#careerModeRestorePanel .careerRestorePlan.ready").waitFor({ state: "visible", timeout: 3000 });
    assert.ok(await page.locator("#careerModeRestorePanel .careerRestoreApply").isEnabled());
}

async function installWriteAudit(page){
    await page.evaluate(() => {
        window.__restoreWriteAudit = { set: 0, remove: 0 };
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        Storage.prototype.setItem = function(key, value){ window.__restoreWriteAudit.set += 1; return originalSet.call(this, key, value); };
        Storage.prototype.removeItem = function(key){ window.__restoreWriteAudit.remove += 1; return originalRemove.call(this, key); };
        window.__releaseRestorePatch = () => { Storage.prototype.setItem = originalSet; Storage.prototype.removeItem = originalRemove; };
    });
}

async function installCommitFailure(page, { critical = false } = {}){
    await page.evaluate(({ keys, critical }) => {
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        const originalActive = localStorage.getItem(keys.active);
        let commitFailed = false;
        let rollbackFailureInjected = false;
        Storage.prototype.setItem = function(key, value){
            if(!commitFailed && key === keys.legacy){
                commitFailed = true;
                const error = new Error("Injected middle-key quota failure");
                error.name = "QuotaExceededError";
                throw error;
            }
            if(critical && commitFailed && !rollbackFailureInjected && key === keys.active && String(value) === String(originalActive)){
                rollbackFailureInjected = true;
                const error = new Error("Injected active rollback failure");
                error.name = "QuotaExceededError";
                throw error;
            }
            return originalSet.call(this, key, value);
        };
        window.__releaseRestorePatch = () => { Storage.prototype.setItem = originalSet; Storage.prototype.removeItem = originalRemove; };
    }, { keys, critical });
}

function acceptNextConfirm(page){ page.once("dialog", dialog => dialog.accept()); }

async function runAxeAndOverflow(page, rootSelector, label){
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async selector => {
        const result = await window.axe.run(document.querySelector(selector), { resultTypes: ["violations"], rules: { region: { enabled: false } } });
        return result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
    }, rootSelector);
    assert.deepEqual(violations, [], `${label}: accessibility violations.`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${label}: horizontal overflow ${overflow}px.`);
}

async function assertFooterSafe(page, selector, label){
    const target = page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const boxes = await page.evaluate(selector => {
        const target = document.querySelector(selector);
        const footer = document.querySelector("footer");
        if(!target || !footer) return null;
        const a = target.getBoundingClientRect();
        const b = footer.getBoundingClientRect();
        return { targetTop: a.top, targetBottom: a.bottom, footerTop: b.top, viewport: window.innerHeight };
    }, selector);
    assert.ok(boxes, `${label}: target/footer geometry unavailable.`);
    assert.ok(boxes.targetTop >= 0, `${label}: target scrolled above viewport.`);
    assert.ok(boxes.targetBottom <= boxes.footerTop + 1, `${label}: target is obscured by the fixed footer (${boxes.targetBottom} > ${boxes.footerTop}).`);
}

async function successfulRestoreAndIdempotence(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try{
        const envelope = await prepareScenario(page);
        const before = await reviewBackup(page, envelope);
        await chooseMergeRestore(page, "use-backup");
        await runAxeAndOverflow(page, "#careerModeRestorePanel", "desktop ready plan");
        await assertFooterSafe(page, "#careerModeRestorePanel .careerRestoreApply", "desktop Apply");
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-ready-${runLabel}.png`), fullPage: true });
        acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        await page.locator("#leagueWheelScreen").waitFor({ state: "visible", timeout: 15000 });
        const after = await snapshot(page);
        const active = JSON.parse(after.active);
        const legacy = JSON.parse(after.legacy);
        const preferences = JSON.parse(after.preferences);
        assert.equal(active.id, "source-active");
        assert.equal(active.schemaVersion, 2, "Apply must commit the freshly migrated active record.");
        assert.equal(active.name, "Restored Active");
        assert.deepEqual(legacy.map(item => item.id), ["local-only", "exact", "conflict", "backup-only"]);
        assert.equal(legacy.filter(item => item.id === "exact").length, 1, "Exact Legacy duplicate must not multiply.");
        assert.equal(legacy.filter(item => item.id === "conflict").length, 1);
        assert.equal(legacy.find(item => item.id === "conflict").name, "Backup Conflict");
        assert.equal(preferences.schemaVersion, 2);
        assert.equal(preferences.reducedMotion, true);
        assert.equal(preferences.menuFeedback, true);
        assert.notDeepEqual(after, before);

        await page.evaluate(async () => window.openOptionalModule("legacy"));
        await page.locator("#careerModeRestorePanel").waitFor({ state: "visible", timeout: 8000 });
        await page.locator("#careerModeRestorePanel input[type=file]").setInputFiles({ name: "candidate-c-repeat.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(envelope)) });
        await page.getByRole("button", { name: "REVIEW RESTORE" }).click();
        await page.locator("#careerModeRestorePanel .careerRestoreSnapshot").waitFor({ state: "visible", timeout: 8000 });
        await page.locator('select[name="restore-active"]').selectOption("use-backup");
        await page.locator('select[name="restore-legacy"]').selectOption("merge");
        await page.locator('select[name="restore-preferences"]').selectOption("use-backup");
        await page.locator("#careerModeRestorePanel .careerRestorePlan.ready").waitFor({ state: "visible", timeout: 3000 });
        assert.equal(await page.locator("#careerModeRestorePanel .careerRestoreConflict").count(), 0);
        const repeatedBefore = await snapshot(page);
        await installWriteAudit(page);
        acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        await page.locator("#leagueWheelScreen").waitFor({ state: "visible", timeout: 15000 });
        assert.deepEqual(await page.evaluate(() => ({ ...window.__restoreWriteAudit })), { set: 0, remove: 0 }, "Repeated identical restore must be a zero-write transaction.");
        assert.deepEqual(await snapshot(page), repeatedBefore, "Repeated restore must preserve exact raw bytes.");
        await page.evaluate(() => window.__releaseRestorePatch());
        assert.deepEqual(errors, [], "Successful Candidate C journey emitted page errors.");
    }finally{ await context.close(); }
}

async function stalePreviewBlocks(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        await reviewBackup(page, envelope);
        await chooseMergeRestore(page, "use-backup");
        await page.evaluate(({ keys }) => {
            const legacy = JSON.parse(localStorage.getItem(keys.legacy));
            legacy.push({
                schemaVersion: 2, id: "backup-only", name: "Changed After Review",
                managers: { playerOne: "Alex", playerTwo: "Jordan" }, totalRounds: 1, currentRound: 1,
                status: "Completed", selectedLeague: null, clubs: { playerOne: null, playerTwo: null },
                score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [], integrityWarnings: [],
                createdAt: "2026-08-12T12:00:00.000Z", updatedAt: "2026-08-12T12:00:00.000Z", completedAt: "2026-08-12T12:00:00.000Z", archivedAt: null
            });
            localStorage.setItem(keys.legacy, JSON.stringify(legacy));
        }, { keys });
        const changed = await snapshot(page);
        await installWriteAudit(page);
        acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        const live = page.locator("#careerModeRestorePanel .careerRestoreStatus");
        await live.filter({ hasText: /changed after review/i }).waitFor({ state: "visible", timeout: 8000 });
        assert.deepEqual(await snapshot(page), changed);
        assert.deepEqual(await page.evaluate(() => ({ ...window.__restoreWriteAudit })), { set: 0, remove: 0 }, "Stale-state block must perform zero writes/removals.");
        assert.equal(await page.locator('select[name="restore-active"]').inputValue(), "", "Stale-state block must discard old choices.");
        assert.ok(await page.locator("#legacy").isVisible());
        await page.evaluate(() => window.__releaseRestorePatch());
    }finally{ await context.close(); }
}

async function safeRollback(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        const before = await reviewBackup(page, envelope);
        await chooseMergeRestore(page, "use-backup");
        await installCommitFailure(page, { critical: false });
        acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        const recovery = page.locator("#careerModeRestorePanel .careerRestoreRecovery").filter({ hasText: "RESTORE ROLLED BACK" });
        await recovery.waitFor({ state: "visible", timeout: 8000 });
        assert.deepEqual(await snapshot(page), before, "Middle-key failure must restore all pre-transaction raw bytes exactly.");
        assert.equal(await page.locator("#careerModeRestorePanel").getAttribute("data-critical-recovery"), null);
        assert.ok(await page.locator("#careerModeRestorePanel .careerRestoreApply").isEnabled(), "Verified rollback must allow a deliberate retry.");
        await assertFooterSafe(page, "#careerModeRestorePanel .careerRestoreRecovery", "desktop verified rollback");
        assert.ok(await page.locator("#legacy").isVisible());
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-rolled-back-${runLabel}.png`), fullPage: true });
        await page.evaluate(() => window.__releaseRestorePatch());
    }finally{ await context.close(); }
}

async function criticalRollback(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        const before = await reviewBackup(page, envelope);
        await chooseMergeRestore(page, "use-backup");
        await installCommitFailure(page, { critical: true });
        acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        const recovery = page.locator("#careerModeRestorePanel .careerRestoreRecovery.critical");
        await recovery.waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#careerModeRestorePanel").innerText(), /CRITICAL RECOVERY STATE/);
        const state = await snapshot(page);
        assert.notEqual(state.active, before.active, "Critical rollback failure must not be falsely reported as exact recovery.");
        assert.equal(state.legacy, before.legacy, "Rollback must keep attempting later keys after one rollback write fails.");
        assert.equal(state.preferences, before.preferences);
        assert.equal(await page.locator("#careerModeRestorePanel").getAttribute("data-critical-recovery"), "true");
        const enabledControls = await page.locator("#careerModeRestorePanel input:not(:disabled),#careerModeRestorePanel select:not(:disabled),#careerModeRestorePanel button:not(:disabled)").count();
        assert.equal(enabledControls, 0, "Critical recovery must lock every Candidate C interactive control until refresh.");
        await assertFooterSafe(page, "#careerModeRestorePanel .careerRestoreRecovery.critical", "desktop critical recovery");
        assert.ok(await page.locator("#legacy").isVisible(), "Critical recovery must not navigate.");
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-critical-${runLabel}.png`), fullPage: true });
        await page.evaluate(() => window.__releaseRestorePatch());
    }finally{ await context.close(); }
}

async function corruptLegacyRequiresReplace(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        await page.evaluate(({ keys }) => localStorage.setItem(keys.legacy, "{broken-legacy"), { keys });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        await openDataManagement(page);
        const corruptBefore = await reviewBackup(page, envelope);
        assert.equal(corruptBefore.legacy, "{broken-legacy");
        await page.locator('select[name="restore-active"]').selectOption("keep-current");
        await page.locator('select[name="restore-legacy"]').selectOption("merge");
        await page.locator('select[name="restore-preferences"]').selectOption("keep-current");
        const blocked = page.locator("#careerModeRestorePanel .careerRestorePlan.blocked");
        await blocked.waitFor({ state: "visible", timeout: 3000 });
        assert.match(await blocked.innerText(), /unreadable/i, "Corrupt current Legacy bytes must block merge.");
        assert.equal(await page.locator("#careerModeRestorePanel .careerRestoreApply").isEnabled(), false);
        await page.locator('select[name="restore-legacy"]').selectOption("replace-with-backup");
        await page.locator("#careerModeRestorePanel .careerRestorePlan.ready").waitFor({ state: "visible", timeout: 3000 });
        assert.ok(await page.locator("#careerModeRestorePanel .careerRestoreApply").isEnabled(), "Explicit replacement is the legal recovery choice for corrupt Legacy bytes.");
        assert.equal((await snapshot(page)).legacy, "{broken-legacy", "Planning explicit replacement must still preserve corrupt raw bytes until Apply.");
    }finally{ await context.close(); }
}

async function doubleApplyLock(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        const result = await page.evaluate(async serialized => {
            const file = new File([serialized], "double-apply.json", { type: "application/json" });
            const raw = window.captureCareerModeRawBackupInputs();
            const originalAnalyze = window.analyzeCareerModeBackupFile;
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            let analysisCalls = 0;
            window.analyzeCareerModeBackupFile = async selected => {
                analysisCalls += 1;
                await gate;
                return originalAnalyze(selected);
            };
            const choices = { active: "keep-current", legacy: "keep-current", preferences: "keep-current", legacyConflicts: {} };
            const firstPromise = window.applyCareerModeRestore(file, choices, { expectedRaw: raw });
            await Promise.resolve();
            const second = await window.applyCareerModeRestore(file, choices, { expectedRaw: raw });
            release();
            const first = await firstPromise;
            window.analyzeCareerModeBackupFile = originalAnalyze;
            return { first: { ok: first.ok, status: first.status }, second: { ok: second.ok, status: second.status }, analysisCalls };
        }, JSON.stringify(envelope));
        assert.equal(result.first.ok, true);
        assert.equal(result.second.ok, false);
        assert.equal(result.second.status, "busy", "Rapid second Apply must be rejected while the first is in flight.");
        assert.equal(result.analysisCalls, 1, "Double Apply must not start a second fresh analysis.");
    }finally{ await context.close(); }
}

async function lifecycleInterruptionBeforeCommit(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        const before = await snapshot(page);
        await page.evaluate(serialized => {
            const file = new File([serialized], "interrupted.json", { type: "application/json" });
            const raw = window.captureCareerModeRawBackupInputs();
            window.analyzeCareerModeBackupFile = () => new Promise(() => {});
            window.__interruptedRestore = window.applyCareerModeRestore(
                file,
                { active: "use-backup", legacy: "replace-with-backup", preferences: "use-backup", legacyConflicts: {} },
                { expectedRaw: raw }
            );
        }, JSON.stringify(envelope));
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        assert.deepEqual(await snapshot(page), before, "Lifecycle interruption while fresh analysis is pending must leave all canonical raw bytes untouched.");
    }finally{ await context.close(); }
}

async function mobileReducedMotion(browser){
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    try{
        const envelope = await prepareScenario(page);
        await reviewBackup(page, envelope);
        await page.locator('select[name="restore-active"]').selectOption("keep-current");
        await page.locator('select[name="restore-legacy"]').selectOption("keep-current");
        await page.locator('select[name="restore-preferences"]').selectOption("keep-current");
        await page.locator("#careerModeRestorePanel .careerRestorePlan.ready").waitFor({ state: "visible", timeout: 3000 });
        await runAxeAndOverflow(page, "#careerModeRestorePanel", "mobile reduced-motion");
        for(const selector of ["#careerModeRestorePanel input[type=file]", "#careerModeRestorePanel .careerRestoreReviewButton", "#careerModeRestorePanel .careerRestoreSelect", "#careerModeRestorePanel .careerRestoreApply"]){
            const box = await page.locator(selector).first().boundingBox();
            assert.ok(box && box.height >= 44, `${selector} must retain a >=44px touch height; got ${box?.height}.`);
        }
        await assertFooterSafe(page, "#careerModeRestorePanel .careerRestoreApply", "mobile Apply");
        await page.locator('select[name="restore-active"]').focus();
        assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.name), "restore-active", "Restore choices must remain keyboard-focusable.");
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-mobile-${runLabel}.png`), fullPage: true });
    }finally{ await context.close(); }
}

(async () => {
    await fs.mkdir(resultsDirectory, { recursive: true });
    const runtime = await resolveChromiumRuntime();
    const scenarios = [
        successfulRestoreAndIdempotence,
        stalePreviewBlocks,
        safeRollback,
        criticalRollback,
        corruptLegacyRequiresReplace,
        doubleApplyLock,
        lifecycleInterruptionBeforeCommit,
        mobileReducedMotion
    ];
    for(const scenario of scenarios){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{ await scenario(browser); }
        finally{ if(browser.isConnected()) await browser.close(); }
    }
    process.stdout.write("PASS  Candidate C atomic restore, stale-state, rollback recovery, corrupt-data choice, double-Apply, lifecycle and responsive browser audit\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
