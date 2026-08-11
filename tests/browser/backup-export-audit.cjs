const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const axePath = require.resolve("axe-core/axe.min.js");
const runLabel = process.env.CMS_AUDIT_RUN || "backup-export";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const activeKey = "careerModeShowdown.activeShowdown";
const legacyKey = "careerModeShowdown.legacyShowdowns";
const preferencesKey = "careerModeShowdown.preferences";

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

async function openLegacy(page){
    await page.evaluate(async () => {
        await window.openOptionalModule("legacy");
        showScreen("legacy", false);
    });
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    const exportButton = page.getByRole("button", { name: "EXPORT BACKUP" });
    await exportButton.waitFor({ state: "visible" });
    assert.ok(await exportButton.isEnabled(), "Export Backup must be available to keyboard, mouse and touch users.");
    return exportButton;
}

async function assertLegacyAccessibility(page, label){
    const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document.getElementById("legacy"), {
            resultTypes: ["violations"],
            rules: { region: { enabled: false } }
        });
        return result.violations.map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
    });
    assert.deepEqual(violations, [], `${label} Data Management has automated accessibility violations.`);

    const layout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        statusRole: document.querySelector(".legacyDataStatus")?.getAttribute("role"),
        live: document.querySelector(".legacyDataStatus")?.getAttribute("aria-live")
    }));
    assert.ok(layout.documentWidth <= layout.clientWidth + 1, `${label} Data Management has horizontal overflow.`);
    assert.equal(layout.statusRole, "status");
    assert.equal(layout.live, "polite");
}

async function installWriteAudit(page){
    await page.evaluate(() => {
        window.__backupAudit = { set: 0, remove: 0, downloads: 0 };
        const originalSet = Storage.prototype.setItem;
        const originalRemove = Storage.prototype.removeItem;
        const originalClick = HTMLAnchorElement.prototype.click;
        Storage.prototype.setItem = function(key, value){ window.__backupAudit.set += 1; return originalSet.call(this, key, value); };
        Storage.prototype.removeItem = function(key){ window.__backupAudit.remove += 1; return originalRemove.call(this, key); };
        HTMLAnchorElement.prototype.click = function(){ window.__backupAudit.downloads += 1; };
        window.__restoreBackupAudit = () => {
            Storage.prototype.setItem = originalSet;
            Storage.prototype.removeItem = originalRemove;
            HTMLAnchorElement.prototype.click = originalClick;
        };
    });
}

(async () => {
    await fs.mkdir(resultsDirectory, { recursive: true });
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });

    try{
        // Desktop/windowed Chromebook path: real JSON download + keyboard + single-flight + corruption recovery.
        const desktopContext = await browser.newContext({ viewport: { width: 940, height: 700 }, acceptDownloads: true });
        const page = await desktopContext.newPage();
        await page.addInitScript({ path: axePath });
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        await waitForApp(page);
        await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => {
            localStorage.setItem(activeKey, JSON.stringify({
                id: 1700000000000,
                name: "Browser Backup",
                status: "Completed",
                updatedAt: "2026-08-11T12:00:00.000Z",
                completedAt: "2026-08-11T12:00:00.000Z"
            }));
            localStorage.setItem(legacyKey, JSON.stringify([{
                id: 1700000000000,
                name: "Browser Backup",
                status: "Completed",
                updatedAt: "2026-08-11T12:00:00.000Z",
                completedAt: "2026-08-11T12:00:00.000Z"
            }]));
            localStorage.setItem(preferencesKey, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true }));
        }, { activeKey, legacyKey, preferencesKey });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        const exportButton = await openLegacy(page);
        await assertLegacyAccessibility(page, "desktop");
        await page.screenshot({ path: path.join(resultsDirectory, `backup-data-management-desktop-${runLabel}.png`), fullPage: true });

        const rawBeforeDownload = await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => [
            localStorage.getItem(activeKey),
            localStorage.getItem(legacyKey),
            localStorage.getItem(preferencesKey)
        ], { activeKey, legacyKey, preferencesKey });

        const downloadPromise = page.waitForEvent("download", { timeout: 7000 });
        await exportButton.focus();
        await page.keyboard.press("Enter");
        const download = await downloadPromise;
        const downloadPath = await download.path();
        assert.ok(downloadPath, "Keyboard activation must produce a real local JSON download.");
        assert.match(download.suggestedFilename(), /^career-mode-showdown-backup-.*\.json$/);
        const downloadedText = await fs.readFile(downloadPath, "utf8");
        const downloadedEnvelope = JSON.parse(downloadedText);
        assert.equal(downloadedEnvelope.formatId, "career-mode-showdown-backup");
        assert.equal(downloadedEnvelope.formatVersion, 1);
        assert.ok(/^[a-f0-9]{64}$/.test(downloadedEnvelope.checksum));
        assert.equal(downloadedEnvelope.relationships.completedActiveMatchesLegacy, true);
        const rawAfterDownload = await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => [
            localStorage.getItem(activeKey),
            localStorage.getItem(legacyKey),
            localStorage.getItem(preferencesKey)
        ], { activeKey, legacyKey, preferencesKey });
        assert.deepEqual(rawAfterDownload, rawBeforeDownload, "A real backup download must not mutate canonical localStorage bytes.");
        await page.waitForFunction(() => document.querySelector(".legacyDataStatus")?.textContent.includes("downloaded successfully"), null, { timeout: 5000 });

        await installWriteAudit(page);
        await page.evaluate(() => {
            const button = [...document.querySelectorAll("button")].find(item => item.textContent.trim() === "EXPORT BACKUP");
            button.click();
            button.click();
        });
        await page.waitForFunction(() => window.__backupAudit.downloads === 1, null, { timeout: 5000 });
        await page.waitForFunction(() => [...document.querySelectorAll("button")].some(item => item.textContent.trim() === "EXPORT BACKUP" && !item.disabled), null, { timeout: 5000 });
        const rapidAudit = await page.evaluate(() => ({ ...window.__backupAudit }));
        assert.equal(rapidAudit.set, 0, "Rapid export must not write localStorage.");
        assert.equal(rapidAudit.remove, 0, "Rapid export must not remove localStorage data.");
        assert.equal(rapidAudit.downloads, 1, "Rapid double activation must produce exactly one download attempt.");

        const envelopeCheck = await page.evaluate(async () => {
            const envelope = await window.createCareerModeBackupEnvelope();
            const valid = await window.verifyCareerModeBackupEnvelopeChecksum(envelope);
            const mutated = structuredClone(envelope);
            mutated.payload.activeShowdown.name = "Changed after checksum";
            return {
                valid,
                mutatedValid: await window.verifyCareerModeBackupEnvelopeChecksum(mutated),
                formatted: window.serializeCareerModeBackupEnvelope(envelope).includes('\n  "formatId"')
            };
        });
        assert.equal(envelopeCheck.valid, true);
        assert.equal(envelopeCheck.mutatedValid, false);
        assert.equal(envelopeCheck.formatted, true);

        await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => {
            window.__restoreBackupAudit();
            localStorage.setItem(activeKey, "{broken-active");
            localStorage.setItem(legacyKey, JSON.stringify({ wrong: "shape" }));
            localStorage.setItem(preferencesKey, "{broken-preferences");
            currentShowdown = null;
        }, { activeKey, legacyKey, preferencesKey });
        const corrupt = await page.evaluate(async () => {
            const keys = ["careerModeShowdown.activeShowdown", "careerModeShowdown.legacyShowdowns", "careerModeShowdown.preferences"];
            const before = keys.map(key => localStorage.getItem(key));
            const envelope = await window.createCareerModeBackupEnvelope();
            const after = keys.map(key => localStorage.getItem(key));
            return { warnings: envelope.warnings.length, recovery: Object.keys(envelope.recovery || {}).sort(), before, after };
        });
        assert.equal(corrupt.warnings, 3);
        assert.deepEqual(corrupt.recovery, ["activeShowdown", "legacyShowdowns", "preferences"]);
        assert.deepEqual(corrupt.after, corrupt.before, "Corrupt raw bytes must remain byte-for-byte unchanged by backup analysis.");
        assert.deepEqual(pageErrors, [], "Desktop backup browser audit emitted page errors.");
        await desktopContext.close();

        // Mobile + touch + reduced-motion path.
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            reducedMotion: "reduce"
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.addInitScript({ path: axePath });
        const mobileErrors = [];
        mobilePage.on("pageerror", error => mobileErrors.push(error.message));
        await waitForApp(mobilePage);
        const mobileExport = await openLegacy(mobilePage);
        await assertLegacyAccessibility(mobilePage, "mobile/reduced-motion");
        await mobilePage.screenshot({ path: path.join(resultsDirectory, `backup-data-management-mobile-${runLabel}.png`), fullPage: true });
        await installWriteAudit(mobilePage);
        await mobileExport.tap();
        await mobilePage.waitForFunction(() => window.__backupAudit.downloads === 1, null, { timeout: 5000 });
        const mobileAudit = await mobilePage.evaluate(() => ({ ...window.__backupAudit }));
        assert.equal(mobileAudit.set, 0);
        assert.equal(mobileAudit.remove, 0);
        assert.equal(mobileAudit.downloads, 1, "Touch activation must create one backup download attempt.");
        assert.deepEqual(mobileErrors, [], "Mobile backup browser audit emitted page errors.");
        await mobileContext.close();

        process.stdout.write("PASS  v1.1.0 Candidate A browser backup audit\n");
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
