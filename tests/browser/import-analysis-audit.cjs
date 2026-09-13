const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const axePath = require.resolve("axe-core/axe.min.js");
const runLabel = process.env.CMS_AUDIT_RUN || "import-analysis";
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
    // Candidate B/C are recovery/data-integrity subsystems. Their audit intentionally bypasses
    // the normal-play online identity gate without changing product code or provider authority.
    await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&window.CareerModeOnlinePlayerIdentity.getState().initialized===true,null,{timeout:12000}).catch(()=>{});
    await page.evaluate(()=>document.getElementById("onlinePlayerIdentityOverlay")?.remove());
}

async function openDataManagement(page){
    const opened = await page.evaluate(async () => window.openOptionalModule("legacy"));
    assert.equal(opened, true);
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    const candidateB = page.locator("#legacyImportAnalysis");
    await candidateB.waitFor({ state: "visible", timeout: 5000 });
    await page.locator("#careerModeRestorePanel").waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await candidateB.getByRole("button", { name: "ANALYZE BACKUP" }).isEnabled(), false);
    assert.equal(
        await candidateB.getByRole("button", { name: /restore|apply import/i }).count(),
        0,
        "Candidate B analysis panel must remain read-only even when Candidate C exists beside it."
    );
    assert.equal(await page.locator("#careerModeRestorePanel .careerRestoreApply").count(), 0, "Candidate C Apply must not exist before a restore file has been reviewed.");
}

async function seedSourceAndCreateEnvelope(page){
    return page.evaluate(async ({ keys }) => {
        const active = {
            id: "source-active",
            name: "Schema One Source",
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
        const legacy = [{ ...active, schemaVersion: 2, integrityWarnings: [], id: "shared-legacy", name: "Shared Legacy", status: "Completed", updatedAt: "2026-08-10T11:00:00.000Z", completedAt: "2026-08-10T11:00:00.000Z" }];
        localStorage.setItem(keys.active, JSON.stringify(active));
        localStorage.setItem(keys.legacy, JSON.stringify(legacy));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 1, reducedMotion: true }));
        currentShowdown = null;
        return window.createCareerModeBackupEnvelope();
    }, { keys });
}

async function seedTarget(page){
    await page.evaluate(({ keys }) => {
        const current = {
            schemaVersion: 2,
            id: "target-active",
            name: "Current Active",
            managers: { playerOne: "Alex", playerTwo: "Jordan" },
            totalRounds: 1,
            currentRound: 1,
            status: "Created",
            selectedLeague: null,
            clubs: { playerOne: null, playerTwo: null },
            score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [],
            rounds: [],
            createdAt: "2026-08-11T10:00:00.000Z",
            updatedAt: "2026-08-11T10:00:00.000Z",
            completedAt: null,
            archivedAt: null
        };
        localStorage.setItem(keys.active, JSON.stringify(current));
        localStorage.setItem(keys.legacy, JSON.stringify([{ ...current, id: "target-legacy", status: "Completed", completedAt: "2026-08-11T11:00:00.000Z" }]));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 1, reducedMotion: false }));
        currentShowdown = null;
    }, { keys });
}

async function storageSnapshot(page){
    return page.evaluate(keys => Object.fromEntries(Object.values(keys).map(key => [key, localStorage.getItem(key)])), keys);
}

async function installWriteAudit(page){
    await page.evaluate(() => {
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        window.__importWriteAudit = { set: 0, remove: 0 };
        Storage.prototype.setItem = function(key, value){ window.__importWriteAudit.set += 1; return originalSet.call(this, key, value); };
        Storage.prototype.removeItem = function(key){ window.__importWriteAudit.remove += 1; return originalRemove.call(this, key); };
        window.__restoreImportWriteAudit = () => {
            Storage.prototype.setItem = originalSet;
            Storage.prototype.removeItem = originalRemove;
        };
    });
}

async function runAxe(page, label){
    await page.addScriptTag({ path: axePath });
    const results = await page.evaluate(async () => axe.run(document, { rules: { region: { enabled: false } } }));
    const serious = results.violations.filter(item => ["serious", "critical"].includes(item.impact));
    assert.deepEqual(serious, [], `${label} has serious/critical accessibility violations: ${JSON.stringify(serious)}`);
}

async function assertDesktopMatrix(browser){
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
    try{
        await waitForApp(page);
        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const envelope = await seedSourceAndCreateEnvelope(page);
        await seedTarget(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&window.CareerModeOnlinePlayerIdentity.getState().initialized===true,null,{timeout:12000}).catch(()=>{});
        await page.evaluate(()=>document.getElementById("onlinePlayerIdentityOverlay")?.remove());
        await openDataManagement(page);
        await runAxe(page, "desktop");
        const before = await storageSnapshot(page);
        await installWriteAudit(page);

        const candidateB = page.locator("#legacyImportAnalysis");
        const fileInput = page.locator("#careerModeImportFile");
        const analyze = candidateB.getByRole("button", { name: "ANALYZE BACKUP" });
        await fileInput.setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(envelope)) });
        assert.equal(await analyze.isEnabled(), true);
        await analyze.click();
        await page.locator(".legacyImportVerdict.ready").waitFor({ state: "visible", timeout: 8000 });
        assert.deepEqual(await storageSnapshot(page), before);
        assert.deepEqual(await page.evaluate(() => ({ ...window.__importWriteAudit })), { set: 0, remove: 0 });

        await fileInput.setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("not json") });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await candidateB.innerText(), /could not be parsed|invalid json/i);
        assert.deepEqual(await storageSnapshot(page), before);

        const wrongSchema={...envelope,schemaVersion:99};
        await fileInput.setInputFiles({name:"wrong-schema.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(wrongSchema))});
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({state:"visible",timeout:8000});
        assert.match(await candidateB.innerText(),/schema/i);
        assert.deepEqual(await storageSnapshot(page),before);

        const tooLarge=Buffer.alloc(5*1024*1024+1,0x61);
        await fileInput.setInputFiles({ name: "oversized.json", mimeType: "application/json", buffer: tooLarge });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /too large/i);
        assert.deepEqual(await storageSnapshot(page), before);

        await page.evaluate(() => window.__restoreImportWriteAudit());
        assert.deepEqual(pageErrors, [], "Candidate B desktop audit emitted page errors.");
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-b-import-desktop-${runLabel}.png`), fullPage: true });
    }finally{
        await context.close();
    }
}

async function assertDropAndMobile(browser){
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        reducedMotion: "reduce"
    });
    const page = await context.newPage();
    try{
        await waitForApp(page);
        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const envelope = await seedSourceAndCreateEnvelope(page);
        await seedTarget(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&window.CareerModeOnlinePlayerIdentity.getState().initialized===true,null,{timeout:12000}).catch(()=>{});
        await page.evaluate(()=>document.getElementById("onlinePlayerIdentityOverlay")?.remove());
        await openDataManagement(page);
        await runAxe(page, "mobile reduced-motion");
        const before = await storageSnapshot(page);
        await installWriteAudit(page);

        await page.evaluate(serialized => {
            const file = new File([serialized], "dropped-backup.json", { type: "application/json" });
            const transfer = new DataTransfer();
            transfer.items.add(file);
            document.querySelector(".legacyImportDropZone").dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
        }, JSON.stringify(envelope));
        const analyze = page.getByRole("button", { name: "ANALYZE BACKUP" });
        await analyze.tap();
        await page.locator(".legacyImportVerdict.ready").waitFor({ state: "visible", timeout: 8000 });
        assert.deepEqual(await storageSnapshot(page), before);
        const audit = await page.evaluate(() => ({ ...window.__importWriteAudit }));
        assert.deepEqual(audit, { set: 0, remove: 0 });

        for(const selector of [".legacyImportDropZone", ".legacyImportActions .primaryDataButton", ".legacyImportActions .compactButton:last-child", "#careerModeRestorePanel .careerRestoreReviewButton"]){
            const box = await page.locator(selector).boundingBox();
            assert.ok(box && box.height >= 44, `${selector} must retain a >=44px mobile interaction height; got ${box?.height}.`);
        }
        await page.evaluate(() => window.__restoreImportWriteAudit());
        await page.screenshot({ path: path.join(resultsDirectory, `candidate-b-import-mobile-${runLabel}.png`), fullPage: true });
    }finally{
        await context.close();
    }
}

(async () => {
    await fs.mkdir(resultsDirectory, { recursive: true });
    const runtime = await resolveChromiumRuntime();
    for(const scenario of [assertDesktopMatrix, assertDropAndMobile]){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{ await scenario(browser); }
        finally{ if(browser.isConnected()){ await browser.close(); } }
    }
    process.stdout.write("PASS  Candidate B read-only import-analysis browser audit with Candidate C coexistence\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});