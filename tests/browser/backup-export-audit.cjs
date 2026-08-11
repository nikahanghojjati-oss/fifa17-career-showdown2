const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const activeKey = "careerModeShowdown.activeShowdown";
const legacyKey = "careerModeShowdown.legacyShowdowns";
const preferencesKey = "careerModeShowdown.preferences";

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
    try{
        const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
        const page = await context.newPage();
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

        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const exportButton = page.getByRole("button", { name: "EXPORT BACKUP" });
        await exportButton.waitFor({ state: "visible" });
        assert.ok(await exportButton.isEnabled(), "Export Backup must be keyboard/touch/mouse available.");

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

        // Bug 5: two rapid activations must still produce exactly one download.
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
            window.__restoreBackupAudit();
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
        assert.deepEqual(pageErrors, [], "Backup browser audit emitted page errors.");

        process.stdout.write("PASS  v1.1.0 Candidate A browser backup audit\n");
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
