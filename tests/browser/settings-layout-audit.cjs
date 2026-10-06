const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

// Nik 2026-10-05: on desktop the Settings cards were clipped (overflow:hidden on content-capped grid rows), which hid
// UPDATE TO LATEST VERSION and half of Showdown Data, and the update status box was an unreadable light box.
// Contract checks use a fake DOM and Playwright clicks scroll clipped controls into view, so only a real layout
// measurement catches this. Every Settings card must show its whole content, and the update result must land in
// the status box under the button.
const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const DEFAULT_STATUS = "Updates keep your current Showdown and player identity.";
const cases = [
    { name: "desktop-1920x910", viewport: { width: 1920, height: 910 } },
    { name: "desktop-1920x1080", viewport: { width: 1920, height: 1080 } },
    { name: "chromebook-1366x640", viewport: { width: 1366, height: 640 } },
    { name: "phone-390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: "phone-landscape-844x390", viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
];

async function openSettings(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 15000 });
    // Home tile reachability is Home's own audit (landscape phone tiles: G-F15); this audit is about Settings itself.
    await page.locator("#settingsButton").evaluate(button => button.click());
    await page.waitForFunction(() => {
        const overlay = document.getElementById("settingsOverlay");
        return overlay?.classList.contains("v10Settings") && document.querySelector(".settingsPanel--data");
    }, null, { timeout: 15000 });
    await page.waitForTimeout(600);
}

async function auditCase(browser, testCase){
    const context = await browser.newContext(testCase);
    const page = await context.newPage();
    try{
        await openSettings(page);
        const clipped = await page.evaluate(() => [...document.querySelectorAll("#settingsContent > .settingsPanel")]
            .filter(panel => panel.offsetHeight > 0 && getComputedStyle(panel).visibility !== "hidden")
            .filter(panel => panel.scrollHeight > panel.clientHeight + 2)
            .map(panel => `${panel.querySelector("h3")?.textContent || panel.className}: ${panel.clientHeight}/${panel.scrollHeight}`));
        assert.deepEqual(clipped, [], `${testCase.name}: Settings cards are cut off`);

        const update = page.locator(".settingsApplicationUpdateButton");
        await update.scrollIntoViewIfNeeded();
        const reachable = await update.evaluate(button => {
            const rect = button.getBoundingClientRect();
            const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            return Boolean(hit && (hit === button || button.contains(hit)));
        });
        assert.ok(reachable, `${testCase.name}: UPDATE TO LATEST VERSION is covered or outside the screen`);

        const status = page.locator(".settingsApplicationUpdateStatus");
        const paint = await status.evaluate(node => {
            const channel = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
            const luminance = rgb => rgb.reduce((sum, value) => sum + value, 0) / 3;
            const style = getComputedStyle(node);
            return { text: luminance(channel(style.color)), background: luminance(channel(style.backgroundColor)) };
        });
        assert.ok(paint.background < 90 && paint.text > 150, `${testCase.name}: update status box is not readable (${JSON.stringify(paint)})`);

        await update.click();
        await page.waitForFunction(expected => {
            const text = document.querySelector(".settingsApplicationUpdateStatus")?.textContent?.trim();
            return text && text !== expected;
        }, DEFAULT_STATUS, { timeout: 15000 });
        const message = (await status.textContent()).trim();
        assert.ok(message.length > 10, `${testCase.name}: update status box stayed empty`);
        console.log(`PASS ${testCase.name}: cards whole, update reachable, status "${message}"`);
    }finally{
        await context.close();
    }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
    try{
        for(const testCase of cases){
            await auditCase(browser, testCase);
        }
    }finally{
        await browser.close();
    }
    console.log(`PASS Settings layout audit: ${cases.length} viewports.`);
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
