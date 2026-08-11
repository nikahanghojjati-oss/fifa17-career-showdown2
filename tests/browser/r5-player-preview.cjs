const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const runLabel = process.env.CMS_AUDIT_RUN || "r5-player-preview";
const cases = [
    { name: "desktop", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
    { name: "windowed", viewport: { width: 940, height: 700 }, deviceScaleFactor: 1 },
    { name: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
];

fs.mkdirSync(resultsDirectory, { recursive: true });

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
    await page.waitForFunction(() => {
        if(typeof window.getFootballVisualDiagnostics !== "function") return false;
        const state = window.getFootballVisualDiagnostics();
        return state.initialized && state.preloadCount === state.assetCount && state.assetCount === 5;
    }, { timeout: 15000 });
}

async function waitForPanels(page, screenName, count){
    await page.waitForFunction(({ screenName, count }) => {
        const root = document.querySelector(`[data-football-visual-screen="${screenName}"]`);
        if(!root) return false;
        const panels = root.classList.contains("footballVisualPanel") ? [root] : [...root.querySelectorAll(".footballVisualPanel")];
        return panels.length === count && panels.every(panel => {
            const image = panel.querySelector(".footballVisualMedia");
            return panel.classList.contains("imageLoaded") && image && image.complete && image.naturalWidth > 0;
        });
    }, { screenName, count }, { timeout: 12000 });
}

async function assertNoSecondaryCrop(page, screenName, expectedCount){
    const metrics = await page.evaluate(({ screenName }) => {
        const root = document.querySelector(`[data-football-visual-screen="${screenName}"]`);
        const panels = root && root.classList.contains("footballVisualPanel") ? [root] : root ? [...root.querySelectorAll(".footballVisualPanel")] : [];
        return panels.map(panel => {
            const image = panel.querySelector(".footballVisualMedia");
            const frame = panel.querySelector(".footballVisualMediaFrame");
            const imageRect = image.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            const style = getComputedStyle(image);
            return {
                id: panel.dataset.footballVisualAsset,
                fit: style.objectFit,
                natural: [image.naturalWidth, image.naturalHeight],
                image: [imageRect.width, imageRect.height],
                frame: [frameRect.width, frameRect.height],
                opacity: Number(style.opacity)
            };
        });
    }, { screenName });
    assert.equal(metrics.length, expectedCount, `${screenName}: wrong number of visual panels`);
    for(const metric of metrics){
        assert.equal(metric.fit, "contain", `${metric.id}: runtime must preserve the authored derivative with contain`);
        assert.ok(metric.opacity >= .99, `${metric.id}: image is not fully visible`);
        assert.ok(metric.natural[0] > 0 && metric.natural[1] > 0, `${metric.id}: invalid source dimensions`);
    }
    return metrics;
}

async function showCreate(page){
    await page.click("#newShowdown");
    await page.locator("#createShowdown").waitFor({ state: "visible", timeout: 5000 });
    await waitForPanels(page, "createShowdown", 1);
    return assertNoSecondaryCrop(page, "createShowdown", 1);
}

async function showTransfer(page){
    const state = await page.evaluate(async () => {
        if(typeof window.ensureGameplayModules === "function") await window.ensureGameplayModules();
        if(typeof initializeTransferChallenge === "function") initializeTransferChallenge();
        const now = new Date().toISOString();
        currentShowdown = normalizeShowdown({
            schemaVersion: 2,
            id: 1700000000000,
            name: "R5 Player Preview",
            managers: { playerOne: "Manager One", playerTwo: "Manager Two" },
            totalRounds: 1,
            currentRound: 1,
            status: "Ready",
            selectedLeague: { id: "premier_league", name: "Premier League", country: "England", logo: "assets/logos/premierleague.png" },
            clubs: { playerOne: "Manchester United", playerTwo: "Chelsea" },
            score: { playerOne: 0, playerTwo: 0 },
            transferChallenges: [],
            rounds: [],
            integrityWarnings: [],
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            archivedAt: null
        });
        saveCurrentShowdown();
        openTransferChallenge();
        return {
            active: typeof getActiveScreenName === "function" ? getActiveScreenName() : null,
            status: currentShowdown && currentShowdown.status,
            clubs: currentShowdown && currentShowdown.clubs
        };
    });
    assert.equal(state.active, "transferChallenge", `Transfer preview did not open: ${JSON.stringify(state)}`);
    await page.locator("#transferChallenge").waitFor({ state: "visible", timeout: 5000 });
    await waitForPanels(page, "transferChallenge", 2);
    return assertNoSecondaryCrop(page, "transferChallenge", 2);
}

(async () => {
    const runtime = resolveChromiumRuntime();
    const browser = await chromium.launch(runtime.launchOptions);
    const evidence = [];
    try{
        for(const testCase of cases){
            const context = await browser.newContext({
                viewport: testCase.viewport,
                deviceScaleFactor: testCase.deviceScaleFactor,
                isMobile: Boolean(testCase.isMobile),
                hasTouch: Boolean(testCase.hasTouch),
                reducedMotion: "reduce"
            });
            const page = await context.newPage();
            await waitForApp(page);

            const createMetrics = await showCreate(page);
            const createPath = path.join(resultsDirectory, `r5-james-${testCase.name}-${runLabel}.png`);
            await page.locator("#createShowdown").screenshot({ path: createPath });

            const transferMetrics = await showTransfer(page);
            const transferPath = path.join(resultsDirectory, `r5-rashford-martial-${testCase.name}-${runLabel}.png`);
            await page.locator("#transferChallenge").screenshot({ path: transferPath });

            evidence.push({ case: testCase.name, createMetrics, transferMetrics });
            await context.close();
        }
    } finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(resultsDirectory, `r5-player-preview-metrics-${runLabel}.json`), JSON.stringify(evidence, null, 2));
    console.log("R5 focused James/Rashford/Martial preview completed across all three viewports.");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
