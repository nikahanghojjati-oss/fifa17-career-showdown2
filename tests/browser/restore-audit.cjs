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

async function seedSourceAndCreateEnvelope(page){
    return page.evaluate(async ({ keys }) => {
        const base = (id, name, schemaVersion = 2) => ({
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

async function seedTarget(page, extraConflict = false){
    await page.evaluate(({ keys, extraConflict }) => {
        const base = (id, name) => ({
            schemaVersion: 2,
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
            integrityWarnings: [],
            createdAt: "2026-08-10T10:00:00.000Z",
            updatedAt: "2026-08-10T10:00:00.000Z",
            completedAt: null,
            archivedAt: null
        });
        const active = { ...base("target-active", "Current Active"), createdAt: "2026-08-11T10:00:00.000Z", updatedAt: "2026-08-11T10:00:00.000Z" };
        const localOnly = { ...base("local-only", "Local Only"), status: "Completed", completedAt: "2026-08-11T11:00:00.000Z", updatedAt: "2026-08-11T11:00:00.000Z" };
        const exact = { ...base("exact", "Exact History"), status: "Completed", completedAt: "2026-08-10T12:00:00.000Z", updatedAt: "2026-08-10T12:00:00.000Z" };
        const conflict = { ...base("conflict", "Local Conflict"), status: "Completed", completedAt: "2026-08-11T13:00:00.000Z", updatedAt: "2026-08-11T13:00:00.000Z" };
        const legacy = [localOnly, exact, conflict];
        if(extraConflict){
            legacy.push({ ...base("backup-only", "Local Version Of Backup Only"), status: "Completed", completedAt: "2026-08-11T14:00:00.000Z", updatedAt: "2026-08-11T14:00:00.000Z" });
        }
        localStorage.setItem(keys.active, JSON.stringify(active));
        localStorage.setItem(keys.legacy, JSON.stringify(legacy));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: false }));
        currentShowdown = null;
    }, { keys, extraConflict });
}

async function prepareScenario(page, { extraConflict = false } = {}){
    await waitForApp(page);
    await openDataManagement(page);
    const envelope = await seedSourceAndCreateEnvelope(page);
    await seedTarget(page, extraConflict);
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
    const conflictSelects = page.locator("#careerModeRestorePanel .careerRestoreConflict .careerRestoreSelect");
    assert.ok(await conflictSelects.count() >= 1, "Merge must surface the same-ID/different-content conflict.");
    await conflictSelects.first().selectOption(conflictChoice);
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

async function acceptNextConfirm(page){
    page.once("dialog", dialog => dialog.accept());
}

async function runAxeAndOverflow(page, label){
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document.getElementById("careerModeRestorePanel"), { resultTypes: ["violations"], rules: { region: { enabled: false } } });
        return result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
    });
    assert.deepEqual(violations, [], `${label}: Candidate C restore accessibility violations.`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${label}: Candidate C introduced horizontal overflow (${overflow}px).`);
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
        await runAxeAndOverflow(page, "desktop ready plan");
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-ready-${runLabel}.png`), fullPage: true });
        await acceptNextConfirm(page);
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
        assert.equal(legacy.find(item => item.id === "conflict").name, "Backup Conflict", "Explicit use-backup conflict choice must win only for that ID.");
        assert.equal(preferences.schemaVersion, 2);
        assert.equal(preferences.reducedMotion, true);
        assert.equal(preferences.menuFeedback, true);
        assert.notDeepEqual(after, before, "Successful restore must materially replace the selected canonical data.");

        await page.evaluate(async () => window.openOptionalModule("legacy"));
        await page.locator("#careerModeRestorePanel").waitFor({ state: "visible", timeout: 8000 });
        await page.locator("#careerModeRestorePanel input[type=file]").setInputFiles({ name: "candidate-c-repeat.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(envelope)) });
        await page.getByRole("button", { name: "REVIEW RESTORE" }).click();
        await page.locator("#careerModeRestorePanel .careerRestoreSnapshot").waitFor({ state: "visible", timeout: 8000 });
        await page.locator('select[name="restore-active"]').selectOption("use-backup");
        await page.locator('select[name="restore-legacy"]').selectOption("merge");
        await page.locator('select[name="restore-preferences"]').selectOption("use-backup");
        await page.locator("#careerModeRestorePanel .careerRestorePlan.ready").waitFor({ state: "visible", timeout: 3000 });
        assert.equal(await page.locator("#careerModeRestorePanel .careerRestoreConflict").count(), 0, "Repeat import should have no remaining Legacy conflict.");
        const repeatedBefore = await snapshot(page);
        await installWriteAudit(page);
        await acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        await page.locator("#leagueWheelScreen").waitFor({ state: "visible", timeout: 15000 });
        const audit = await page.evaluate(() => ({ ...window.__restoreWriteAudit }));
        assert.deepEqual(audit, { set: 0, remove: 0 }, "Repeated identical restore must become a zero-write transaction.");
        assert.deepEqual(await snapshot(page), repeatedBefore, "Repeated restore must preserve exact existing raw bytes.");
        await page.evaluate(() => window.__releaseRestorePatch());
        assert.deepEqual(errors, [], "Successful Candidate C browser journey emitted page errors.");
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
                schemaVersion: 2, id: "backup-only", name: "Changed After Preview",
                managers: { playerOne: "Alex", playerTwo: "Jordan" }, totalRounds: 1, currentRound: 1,
                status: "Completed", selectedLeague: null, clubs: { playerOne: null, playerTwo: null },
                score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [], integrityWarnings: [],
                createdAt: "2026-08-12T12:00:00.000Z", updatedAt: "2026-08-12T12:00:00.000Z", completedAt: "2026-08-12T12:00:00.000Z", archivedAt: null
            });
            localStorage.setItem(keys.legacy, JSON.stringify(legacy));
        }, { keys });
        const changedBeforeApply = await snapshot(page);
        await installWriteAudit(page);
        await acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        await page.locator("#careerModeRestorePanel .careerRestoreConflict").filter({ hasText: "backup-only" }).waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
        await page.locator("#careerModeRestorePanel .careerRestoreStatus").filter({ hasText: /Current data changed|conflict needs an explicit choice/i }).waitFor({ state: "visible", timeout: 8000 });
        assert.deepEqual(await snapshot(page), changedBeforeApply, "Fresh Apply-time analysis must block stale-plan writes when local state changed.");
        assert.deepEqual(await page.evaluate(() => ({ ...window.__restoreWriteAudit })), { set: 0, remove: 0 }, "Stale-preview blocking must perform no Candidate C writes.");
        assert.ok(await page.locator("#legacy").isVisible(), "Stale preview must stay in Data Management rather than navigate.");
        await page.evaluate(() => window.__releaseRestorePatch());
    }finally{ await context.close(); }
}

async function rollbackFailureMatrix(browser){
    for(const critical of [false, true]){
        const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
        const page = await context.newPage();
        try{
            const envelope = await prepareScenario(page);
            const before = await reviewBackup(page, envelope);
            await chooseMergeRestore(page, "use-backup");
            await installCommitFailure(page, { critical });
            await acceptNextConfirm(page);
            await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
            if(critical){
                await page.locator("#careerModeRestorePanel .careerRestoreRecovery.critical").waitFor({ state: "visible", timeout: 8000 });
                assert.match(await page.locator("#careerModeRestorePanel").innerText(), /CRITICAL RECOVERY STATE/);
                const state = await snapshot(page);
                assert.notEqual(state.active, before.active, "Injected rollback failure should leave visible evidence that exact recovery could not be proven.");
                assert.equal(state.legacy, before.legacy, "Rollback must continue attempting later keys after one rollback failure.");
                assert.equal(state.preferences, before.preferences);
                await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-critical-${runLabel}.png`), fullPage: true });
            }else{
                await page.locator("#careerModeRestorePanel .careerRestoreRecovery").filter({ hasText: "RESTORE ROLLED BACK" }).waitFor({ state: "visible", timeout: 8000 });
                assert.deepEqual(await snapshot(page), before, "Injected middle-key failure must restore all pre-transaction raw bytes exactly.");
                await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-rolled-back-${runLabel}.png`), fullPage: true });
            }
            assert.ok(await page.locator("#legacy").isVisible(), "Failed restore must never navigate away from recovery UX.");
            await page.evaluate(() => window.__releaseRestorePatch());
        }finally{ await context.close(); }
    }
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
        await runAxeAndOverflow(page, "mobile reduced-motion");
        for(const selector of ["#careerModeRestorePanel input[type=file]", "#careerModeRestorePanel .careerRestoreReviewButton", "#careerModeRestorePanel .careerRestoreSelect", "#careerModeRestorePanel .careerRestoreApply"]){
            const locator = page.locator(selector).first();
            const box = await locator.boundingBox();
            assert.ok(box && box.height >= 44, `${selector} must retain a >=44px touch height; got ${box?.height}.`);
        }
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-c-restore-mobile-${runLabel}.png`), fullPage: true });
    }finally{ await context.close(); }
}

(async () => {
    await fs.mkdir(resultsDirectory, { recursive: true });
    const runtime = await resolveChromiumRuntime();
    for(const scenario of [successfulRestoreAndIdempotence, stalePreviewBlocks, rollbackFailureMatrix, mobileReducedMotion]){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{ await scenario(browser); }
        finally{ if(browser.isConnected()) await browser.close(); }
    }
    process.stdout.write("PASS  Candidate C atomic restore, recovery, stale-state, idempotence and responsive browser audit\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
