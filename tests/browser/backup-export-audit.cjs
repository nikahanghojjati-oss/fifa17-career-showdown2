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
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
    const opened = await page.evaluate(async () => window.openOptionalModule("legacy"));
    assert.equal(opened, true, "Legacy/Data Management must open from a stable Home route.");
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

async function seedFullBackup(page){
    await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => {
        const completed = {
            id: 1700000000000,
            name: "Browser Backup",
            status: "Completed",
            totalRounds: 1,
            currentRound: 1,
            managers: { playerOne: "Alex", playerTwo: "Jordan" },
            selectedLeague: { id: "premier-league", name: "Premier League" },
            clubs: { playerOne: "Arsenal", playerTwo: "Chelsea" },
            score: { playerOne: 6, playerTwo: 5 },
            transferChallenges: [],
            rounds: [],
            updatedAt: "2026-08-11T12:00:00.000Z",
            completedAt: "2026-08-11T12:00:00.000Z"
        };
        localStorage.setItem(activeKey, JSON.stringify(completed));
        localStorage.setItem(legacyKey, JSON.stringify([completed]));
        localStorage.setItem(preferencesKey, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true }));
    }, { activeKey, legacyKey, preferencesKey });
}

async function assertEnvelopeAndCorruptRecovery(page){
    const envelopeCheck = await page.evaluate(async () => {
        const envelope = await window.createCareerModeBackupEnvelope();
        const valid = await window.verifyCareerModeBackupEnvelopeChecksum(envelope);
        const mutated = structuredClone(envelope);
        mutated.payload.activeShowdown.name = "Changed after checksum";
        const mutatedValid = await window.verifyCareerModeBackupEnvelopeChecksum(mutated);
        return {
            valid,
            mutatedValid,
            relationship: envelope.relationships.completedActiveMatchesLegacy,
            formatted: window.serializeCareerModeBackupEnvelope(envelope).includes('\n  "formatId"')
        };
    });
    assert.equal(envelopeCheck.valid, true);
    assert.equal(envelopeCheck.mutatedValid, false);
    assert.equal(envelopeCheck.relationship, true, "Matching completed active/Legacy identity must be explicit.");
    assert.equal(envelopeCheck.formatted, true, "Backup JSON must be human-readable.");

    await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => {
        localStorage.setItem(activeKey, "{broken-active");
        localStorage.setItem(legacyKey, JSON.stringify({ wrong: "shape" }));
        localStorage.setItem(preferencesKey, "{broken-preferences");
        currentShowdown = null;
    }, { activeKey, legacyKey, preferencesKey });
    const corrupt = await page.evaluate(async () => {
        const before = [localStorage.getItem("careerModeShowdown.activeShowdown"), localStorage.getItem("careerModeShowdown.legacyShowdowns"), localStorage.getItem("careerModeShowdown.preferences")];
        const envelope = await window.createCareerModeBackupEnvelope();
        const after = [localStorage.getItem("careerModeShowdown.activeShowdown"), localStorage.getItem("careerModeShowdown.legacyShowdowns"), localStorage.getItem("careerModeShowdown.preferences")];
        return { warnings: envelope.warnings.length, recovery: Object.keys(envelope.recovery || {}).sort(), before, after };
    });
    assert.equal(corrupt.warnings, 3);
    assert.deepEqual(corrupt.recovery, ["activeShowdown", "legacyShowdowns", "preferences"]);
    assert.deepEqual(corrupt.after, corrupt.before, "Corrupt raw bytes must remain byte-for-byte unchanged by backup analysis.");
}

async function assertDesktopScenario(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    try{
        await waitForApp(page);
        await seedFullBackup(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        const exportButton = await openLegacy(page);
        await page.addScriptTag({ path: axePath });
        await assertLegacyAccessibility(page, "desktop");

        await installWriteAudit(page);
        await page.evaluate(() => {
            const button = [...document.querySelectorAll("button")].find(item => item.textContent.trim() === "EXPORT BACKUP");
            button.click();
            button.click();
        });
        await page.waitForFunction(() => window.__backupAudit.downloads === 1, null, { timeout: 5000 });
        await page.waitForFunction(() => [...document.querySelectorAll("button")].some(item => item.textContent.trim() === "EXPORT BACKUP" && !item.disabled), null, { timeout: 5000 });
        const audit = await page.evaluate(() => ({ ...window.__backupAudit }));
        assert.equal(audit.set, 0, "Export UI must not write localStorage.");
        assert.equal(audit.remove, 0, "Export UI must not remove localStorage data.");
        assert.equal(audit.downloads, 1, "Rapid double activation must create one backup download.");

        await page.evaluate(() => window.__restoreBackupAudit());
        await assertEnvelopeAndCorruptRecovery(page);
        assert.deepEqual(pageErrors, [], "Backup browser audit emitted page errors.");

        const screenshotPath = path.join(resultsDirectory, `backup-data-management-desktop-${runLabel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        assert.ok(await exportButton.isEnabled());
    }finally{
        await context.close();
    }
}

async function assertRealKeyboardDownload(browser){
    const context = await browser.newContext({ viewport: { width: 940, height: 700 }, acceptDownloads: true });
    const page = await context.newPage();
    try{
        await waitForApp(page);
        await seedFullBackup(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        const exportButton = await openLegacy(page);
        await exportButton.focus();
        const downloadPromise = page.waitForEvent("download");
        await page.keyboard.press("Enter");
        const download = await downloadPromise;
        assert.match(download.suggestedFilename(), /^career-mode-showdown-backup-.*\.json$/);
        const outputPath = await download.path();
        assert.ok(outputPath, "Keyboard-triggered export must create a downloadable file.");
        const parsed = JSON.parse(await fs.readFile(outputPath, "utf8"));
        assert.equal(parsed.formatId, "career-mode-showdown-backup");
        assert.equal(await page.evaluate(async envelope => window.verifyCareerModeBackupEnvelopeChecksum(envelope), parsed), true);
    }finally{
        await context.close();
    }
}

async function assertMobileReducedMotion(browser){
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
        await page.evaluate(({ legacyKey, preferencesKey }) => {
            localStorage.setItem(legacyKey, JSON.stringify([]));
            localStorage.setItem(preferencesKey, JSON.stringify({ schemaVersion: 2, reducedMotion: true, menuFeedback: false }));
        }, { legacyKey, preferencesKey });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
        const exportButton = await openLegacy(page);
        await page.addScriptTag({ path: axePath });
        await assertLegacyAccessibility(page, "mobile reduced-motion");
        const tapBox = await exportButton.boundingBox();
        assert.ok(tapBox && tapBox.width >= 44 && tapBox.height >= 44, `Mobile Export Backup touch target is too small: ${tapBox?.width}×${tapBox?.height}.`);
        const screenshotPath = path.join(resultsDirectory, `backup-data-management-mobile-${runLabel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
    }finally{
        await context.close();
    }
}

(async () => {
    await fs.mkdir(resultsDirectory, { recursive: true });
    const runtime = await resolveChromiumRuntime();
    for(const scenario of [assertDesktopScenario, assertRealKeyboardDownload, assertMobileReducedMotion]){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{
            await scenario(browser);
        }finally{
            if(browser.isConnected()){
                await browser.close();
            }
        }
    }
    process.stdout.write("PASS  v1.1.0 Candidate A browser backup audit\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});