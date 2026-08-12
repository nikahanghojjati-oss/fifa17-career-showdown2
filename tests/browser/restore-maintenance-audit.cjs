const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
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
    assert.equal(opened, true);
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    await page.locator("#careerModeRestorePanel").waitFor({ state: "visible", timeout: 5000 });
}
function showdown(id, name){
    return {
        schemaVersion: 2, integrityWarnings: [], id, name,
        managers: { playerOne: "Alex", playerTwo: "Jordan" },
        totalRounds: 1, currentRound: 1, status: "Created", selectedLeague: null,
        clubs: { playerOne: null, playerTwo: null }, score: { playerOne: 0, playerTwo: 0 },
        transferChallenges: [], rounds: [], createdAt: "2026-08-12T12:00:00.000Z",
        updatedAt: "2026-08-12T12:00:00.000Z", completedAt: null, archivedAt: null
    };
}
async function prepare(page){
    await waitForApp(page);
    await openDataManagement(page);
    const envelope = await page.evaluate(async ({ keys }) => {
        const source = {
            schemaVersion: 2, integrityWarnings: [], id: "maintenance-backup", name: "Confirmed Backup",
            managers: { playerOne: "Alex", playerTwo: "Jordan" }, totalRounds: 1, currentRound: 1,
            status: "Created", selectedLeague: null, clubs: { playerOne: null, playerTwo: null },
            score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [],
            createdAt: "2026-08-12T12:00:00.000Z", updatedAt: "2026-08-12T12:00:00.000Z",
            completedAt: null, archivedAt: null
        };
        localStorage.setItem(keys.active, JSON.stringify(source));
        localStorage.setItem(keys.legacy, "[]");
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true }));
        currentShowdown = null;
        const result = await window.createCareerModeBackupEnvelope();
        localStorage.setItem(keys.active, JSON.stringify({ ...source, id: "maintenance-local", name: "Current Local" }));
        currentShowdown = null;
        return result;
    }, { keys });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await openDataManagement(page);
    return envelope;
}
async function review(page, envelope){
    await page.locator("#careerModeRestorePanel input[type=file]").setInputFiles({
        name: "maintenance-backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(envelope))
    });
    await page.getByRole("button", { name: "REVIEW RESTORE" }).click();
    await page.locator("#careerModeRestorePanel .careerRestoreSnapshot").waitFor({ state: "visible", timeout: 8000 });
    await page.locator('select[name="restore-active"]').selectOption("use-backup");
    await page.locator('select[name="restore-legacy"]').selectOption("keep-current");
    await page.locator('select[name="restore-preferences"]').selectOption("keep-current");
    await page.locator("#careerModeRestorePanel .careerRestorePlan.ready").waitFor({ state: "visible", timeout: 3000 });
}
function acceptNextConfirm(page){ page.once("dialog", dialog => dialog.accept()); }

async function confirmedIntentCannotRace(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepare(page);
        await review(page, envelope);
        await page.evaluate(() => {
            const original = window.analyzeCareerModeBackupFile;
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            window.__maintenanceReleaseAnalysis = release;
            window.__maintenanceOriginalAnalyze = original;
            window.analyzeCareerModeBackupFile = async file => { await gate; return original(file); };
        });
        acceptNextConfirm(page);
        const apply = page.locator("#careerModeRestorePanel .careerRestoreApply");
        await apply.click({ noWaitAfter: true });
        await page.waitForFunction(() => window.isCareerModeRestoreInFlight && window.isCareerModeRestoreInFlight());

        for(const selector of [
            "#careerModeRestorePanel input[type=file]",
            "#careerModeRestorePanel .careerRestoreReviewButton",
            '#careerModeRestorePanel select[name="restore-active"]',
            '#careerModeRestorePanel select[name="restore-legacy"]',
            '#careerModeRestorePanel select[name="restore-preferences"]',
            "#careerModeRestorePanel .careerRestoreApply"
        ]) assert.equal(await page.locator(selector).isDisabled(), true, `${selector} must lock while the confirmed transaction is being revalidated.`);

        await page.evaluate(() => {
            const active = document.querySelector('select[name="restore-active"]');
            active.value = "keep-current";
            active.dispatchEvent(new Event("change", { bubbles: true }));
            window.__maintenanceReleaseAnalysis();
        });
        await page.waitForFunction(() => !(window.isCareerModeRestoreInFlight && window.isCareerModeRestoreInFlight()), null, { timeout: 12000 });
        const activeRaw = await page.evaluate(({ keys }) => localStorage.getItem(keys.active), { keys });
        assert.equal(JSON.parse(activeRaw).id, "maintenance-backup", "Programmatic decision mutation during revalidation must not change the confirmed restore intent.");
        await page.evaluate(() => { window.analyzeCareerModeBackupFile = window.__maintenanceOriginalAnalyze; });
    }finally{ await context.close(); }
}

async function firstWriteFailureIsClean(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    try{
        const envelope = await prepare(page);
        await review(page, envelope);
        const before = await page.evaluate(({ keys }) => localStorage.getItem(keys.active), { keys });
        await page.evaluate(({ keys }) => {
            const originalSet = Storage.prototype.setItem;
            const originalRemove = Storage.prototype.removeItem;
            let failed = false;
            window.__maintenanceWriteAttempts = [];
            Storage.prototype.setItem = function(key, value){
                if(key === keys.active) window.__maintenanceWriteAttempts.push({ type: "set", value: String(value) });
                if(!failed && key === keys.active && String(value).includes("maintenance-backup")){
                    failed = true;
                    const error = new Error("Injected first-write failure");
                    error.name = "QuotaExceededError";
                    throw error;
                }
                return originalSet.call(this, key, value);
            };
            Storage.prototype.removeItem = function(key){
                if(key === keys.active) window.__maintenanceWriteAttempts.push({ type: "remove", value: null });
                return originalRemove.call(this, key);
            };
            window.__releaseMaintenanceStoragePatch = () => { Storage.prototype.setItem = originalSet; Storage.prototype.removeItem = originalRemove; };
        }, { keys });
        acceptNextConfirm(page);
        await page.locator("#careerModeRestorePanel .careerRestoreApply").click();
        await page.getByText("RESTORE NOT STARTED", { exact: true }).waitFor({ state: "visible", timeout: 8000 });
        const after = await page.evaluate(({ keys }) => localStorage.getItem(keys.active), { keys });
        const attempts = await page.evaluate(() => window.__maintenanceWriteAttempts.slice());
        assert.equal(after, before, "A first-write failure must preserve the exact original active bytes.");
        assert.equal(attempts.length, 1, "A failed first commit owns no mutation and must not perform a rollback rewrite.");
        assert.equal(await page.locator("#careerModeRestorePanel").getAttribute("data-critical-recovery"), null, "Clean first-write failure must not be escalated into critical recovery.");
        assert.match(await page.locator("#careerModeRestorePanel .careerRestoreStatus").innerText(), /left unchanged/i);
        await page.evaluate(() => window.__releaseMaintenanceStoragePatch());
    }finally{ await context.close(); }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    for(const scenario of [confirmedIntentCannotRace, firstWriteFailureIsClean]){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{ await scenario(browser); }
        finally{ if(browser.isConnected()) await browser.close(); }
    }
    process.stdout.write("PASS  v1.1.5 confirmed-intent race and clean first-write recovery browser audit\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
