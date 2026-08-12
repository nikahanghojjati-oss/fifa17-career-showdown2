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
}

async function openDataManagement(page){
    const opened = await page.evaluate(async () => window.openOptionalModule("legacy"));
    assert.equal(opened, true);
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    await page.locator("#legacyImportAnalysis").waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await page.getByRole("button", { name: "ANALYZE BACKUP" }).isEnabled(), false);
    assert.equal(await page.getByRole("button", { name: /restore|apply import/i }).count(), 0, "Candidate B must expose no restore/apply action.");
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
            integrityWarnings: [],
            createdAt: "2026-08-11T10:00:00.000Z",
            updatedAt: "2026-08-11T10:00:00.000Z",
            completedAt: null,
            archivedAt: null
        };
        const shared = { ...current, id: "shared-legacy", name: "Shared Legacy", status: "Completed", updatedAt: "2026-08-10T11:00:00.000Z", completedAt: "2026-08-10T11:00:00.000Z" };
        localStorage.setItem(keys.active, JSON.stringify(current));
        localStorage.setItem(keys.legacy, JSON.stringify([shared]));
        localStorage.setItem(keys.preferences, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true }));
        currentShowdown = null;
    }, { keys });
}

async function installWriteAudit(page){
    await page.evaluate(() => {
        window.__importWriteAudit = { set: 0, remove: 0 };
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        Storage.prototype.setItem = function(key, value){ window.__importWriteAudit.set += 1; return originalSet.call(this, key, value); };
        Storage.prototype.removeItem = function(key){ window.__importWriteAudit.remove += 1; return originalRemove.call(this, key); };
        window.__restoreImportWriteAudit = () => {
            Storage.prototype.setItem = originalSet;
            Storage.prototype.removeItem = originalRemove;
        };
    });
}

async function storageSnapshot(page){
    return page.evaluate(({ keys }) => ({
        active: localStorage.getItem(keys.active),
        legacy: localStorage.getItem(keys.legacy),
        preferences: localStorage.getItem(keys.preferences)
    }), { keys });
}

async function runAxe(page, label){
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document.getElementById("legacy"), { resultTypes: ["violations"], rules: { region: { enabled: false } } });
        return result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
    });
    assert.deepEqual(violations, [], `${label}: Candidate B Data Management accessibility violations.`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${label}: Candidate B introduced horizontal overflow (${overflow}px).`);
}

async function assertDesktopMatrix(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    try{
        await waitForApp(page);
        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const envelope = await seedSourceAndCreateEnvelope(page);
        await seedTarget(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        await openDataManagement(page);
        await runAxe(page, "desktop");

        const before = await storageSnapshot(page);
        await installWriteAudit(page);
        await page.locator("#careerModeImportFile").setInputFiles({ name: "candidate-b-valid.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(envelope, null, 2)) });
        const analyze = page.getByRole("button", { name: "ANALYZE BACKUP" });
        assert.ok(await analyze.isEnabled());
        await analyze.focus();
        await page.keyboard.press("Enter");
        await page.locator(".legacyImportVerdict.ready").waitFor({ state: "visible", timeout: 8000 });
        const after = await storageSnapshot(page);
        const audit = await page.evaluate(() => ({ ...window.__importWriteAudit }));
        assert.deepEqual(after, before, "Candidate B preview must leave all three canonical storage values byte-for-byte unchanged.");
        assert.equal(audit.set, 0, "Candidate B preview UI must perform zero localStorage writes.");
        assert.equal(audit.remove, 0, "Candidate B preview UI must perform zero localStorage removals.");

        const resultText = await page.locator("#legacyImportAnalysis").innerText();
        assert.match(resultText, /PREVIEW READY/);
        assert.match(resultText, /REPLACE/);
        assert.match(resultText, /MIGRATION PREVIEW/);
        assert.match(resultText, /EXACT/);
        assert.match(resultText, /Candidate C restore remains unavailable/i);

        const tampered = structuredClone(envelope);
        tampered.payload.activeShowdown.name = "Tampered after checksum";
        await page.locator("#careerModeImportFile").setInputFiles({ name: "checksum-mismatch.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(tampered)) });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /checksum does not match/i);
        assert.deepEqual(await storageSnapshot(page), before);

        await page.locator("#careerModeImportFile").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{broken-json") });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /not valid JSON/i);

        const future = structuredClone(envelope);
        future.formatVersion = 2;
        await page.locator("#careerModeImportFile").setInputFiles({ name: "future-format.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(future)) });
        await analyze.click();
        await page.locator(".legacyImportVerdict.blocked").waitFor({ state: "visible", timeout: 8000 });
        assert.match(await page.locator("#legacyImportAnalysis").innerText(), /newer than this app supports/i);

        const tooLarge = Buffer.alloc((5 * 1024 * 1024) + 64, 0x20);
        await page.locator("#careerModeImportFile").setInputFiles({ name: "oversized.json", mimeType: "application/json", buffer: tooLarge });
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

        for(const selector of [".legacyImportDropZone", ".legacyImportActions .primaryDataButton", ".legacyImportActions .compactButton:last-child"]){
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
    process.stdout.write("PASS  Candidate B import-analysis browser audit on v1.1.3\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
