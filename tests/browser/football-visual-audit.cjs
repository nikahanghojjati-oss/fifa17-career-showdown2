const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "football-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const manifest = JSON.parse(fs.readFileSync(path.resolve("assets/football/asset-manifest.json"), "utf8"));

const cases = [
    { name: "desktop", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
    { name: "windowed-near-breakpoint", viewport: { width: 940, height: 700 }, deviceScaleFactor: 1 },
    { name: "mobile-reference", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
];

const expectedAssets = new Set(manifest.assets.map(item => item.output));
fs.mkdirSync(resultsDirectory, { recursive: true });

function firstPartyFootballRequest(url){
    try{
        const parsed = new URL(url);
        return parsed.origin === baseUrl.origin && parsed.pathname.includes("/assets/football/");
    }catch{
        return false;
    }
}

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

async function waitForVisual(page, screenName, expectedCount = 1){
    const locator = page.locator(`[data-football-visual-screen="${screenName}"] .footballVisualPanel.imageLoaded`);
    await locator.first().waitFor({ state: "attached", timeout: 12000 });
    await page.waitForFunction(
        ({ screenName, expectedCount }) => {
            const panels = [...document.querySelectorAll(
                `[data-football-visual-screen="${screenName}"] .footballVisualPanel.imageLoaded`
            )];
            return panels.length === expectedCount && panels.every(panel => {
                const image = panel.querySelector(".footballVisualMedia");
                return image
                    && image.complete
                    && image.naturalWidth > 0
                    && Number.parseFloat(getComputedStyle(image).opacity) >= .995;
            });
        },
        { screenName, expectedCount },
        { timeout: 12000 }
    );
}

async function inspectVisibleVisual(page, screenName){
    return page.evaluate(screen => {
        const host = document.querySelector(`[data-football-visual-screen="${screen}"]`);
        if(!host){ throw new Error(`Missing football visual host for ${screen}.`); }
        const panels = [...host.querySelectorAll(".footballVisualPanel")];
        return {
            hostRect: host.getBoundingClientRect().toJSON(),
            panels: panels.map(panel => {
                const image = panel.querySelector(".footballVisualMedia");
                const rect = image.getBoundingClientRect();
                const style = getComputedStyle(image);
                return {
                    asset: panel.dataset.footballVisualAsset,
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    renderedWidth: rect.width,
                    renderedHeight: rect.height,
                    opacity: style.opacity,
                    objectFit: style.objectFit,
                    imageRendering: style.imageRendering,
                    mixBlendMode: style.mixBlendMode,
                    filter: style.filter
                };
            }),
            documentWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        };
    }, screenName);
}

function assertRenderedVisual(result, screenName){
    assert.ok(result.hostRect.width > 0 && result.hostRect.height > 0, `${screenName}: visual host has no rendered area.`);
    assert.ok(result.hostRect.left >= -1, `${screenName}: visual escapes left viewport edge.`);
    assert.ok(result.hostRect.right <= result.clientWidth + 1, `${screenName}: visual escapes right viewport edge.`);
    assert.ok(result.documentWidth <= result.clientWidth + 1, `${screenName}: document has horizontal overflow.`);
    result.panels.forEach(panel => {
        assert.ok(panel.naturalWidth > 0 && panel.naturalHeight > 0, `${screenName}: ${panel.asset} did not decode.`);
        assert.ok(Number.parseFloat(panel.opacity) >= .995, `${screenName}: ${panel.asset} must finish fully opaque.`);
        assert.equal(panel.objectFit, "cover", `${screenName}: ${panel.asset} must preserve photographic cover framing.`);
        assert.equal(panel.imageRendering, "auto", `${screenName}: ${panel.asset} must use browser photographic resampling.`);
        assert.equal(panel.mixBlendMode, "normal", `${screenName}: ${panel.asset} must use normal compositing.`);
        assert.equal(panel.filter, "none", `${screenName}: ${panel.asset} must avoid CSS colour-filter rasterization.`);
        assert.ok(
            panel.naturalWidth >= panel.renderedWidth * .94,
            `${screenName}: ${panel.asset} is being materially upscaled horizontally (${panel.naturalWidth} natural vs ${panel.renderedWidth.toFixed(1)} rendered).`
        );
    });
}

async function runCase(runtime, config){
    const browser = await chromium.launch({
        executablePath: runtime.executablePath,
        headless: true,
        args: runtime.args
    });
    const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: config.deviceScaleFactor,
        isMobile: Boolean(config.isMobile),
        hasTouch: Boolean(config.hasTouch),
        locale: "en-US"
    });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const localFailures = [];
    const footballRequests = [];

    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("console", message => {
        if(message.type() === "error" && !/^Failed to load resource/.test(message.text())){
            consoleErrors.push(message.text());
        }
    });
    page.on("request", request => {
        if(firstPartyFootballRequest(request.url())){
            footballRequests.push(request.url());
        }
    });
    page.on("requestfailed", request => {
        if(request.url().startsWith(baseUrl.href)){
            localFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
        }
    });
    page.on("response", response => {
        if(response.url().startsWith(baseUrl.href) && response.status() >= 400){
            localFailures.push(`${response.status()} ${response.url()}`);
        }
    });

    try{
        await waitForApp(page);
        assert.deepEqual(footballRequests, [], `${config.name}: licensed screen photography loaded eagerly on Home.`);

        await page.locator("#newShowdown").click();
        await page.locator("#createShowdown").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "createShowdown", 1);
        const createResult = await inspectVisibleVisual(page, "createShowdown");
        assertRenderedVisual(createResult, "createShowdown");
        assert.ok(footballRequests.some(url => url.includes("james-rodriguez-real-madrid-2016.webp")), `${config.name}: James visual was not requested.`);
        assert.ok(!footballRequests.some(url => /rashford|martial|messi|lahm/.test(url)), `${config.name}: unrelated football photography loaded with Create Showdown.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-create-${config.name}-${runLabel}.png`), fullPage: true });

        await page.evaluate(async () => {
            await window.ensureGameplayModules();
            window.prepareFootballVisualScreen("transferChallenge");
        });
        await waitForVisual(page, "transferChallenge", 2);
        const transferNatural = await page.evaluate(() => [...document.querySelectorAll(
            '[data-football-visual-screen="transferChallenge"] .footballVisualMedia'
        )].map(image => ({ width: image.naturalWidth, height: image.naturalHeight })));
        assert.equal(transferNatural.length, 2, `${config.name}: Transfer visual pair is incomplete.`);
        transferNatural.forEach(size => assert.ok(size.width > 0 && size.height > 0, `${config.name}: a Transfer visual failed to decode.`));
        assert.ok(footballRequests.some(url => url.includes("marcus-rashford-man-utd-2016.webp")), `${config.name}: Rashford visual was not requested.`);
        assert.ok(footballRequests.some(url => url.includes("anthony-martial-man-utd-2015.webp")), `${config.name}: Martial visual was not requested.`);

        await page.locator("#createShowdown .backButton").click();
        await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });

        await page.locator("#careerStatisticsButton").click();
        await page.locator("#careerStatistics").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "careerStatistics", 1);
        const statsResult = await inspectVisibleVisual(page, "careerStatistics");
        assertRenderedVisual(statsResult, "careerStatistics");
        assert.ok(footballRequests.some(url => url.includes("lionel-messi-barcelona-2016.webp")), `${config.name}: Messi visual was not requested.`);
        assert.ok(!footballRequests.some(url => url.includes("philipp-lahm-world-cup-2014.webp")), `${config.name}: Lahm visual loaded before Trophy Room was opened.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-stats-${config.name}-${runLabel}.png`), fullPage: true });

        await page.locator("#careerStatisticsTrophyButton").click();
        await page.locator("#trophyRoom").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "trophyRoom", 1);
        const trophyResult = await inspectVisibleVisual(page, "trophyRoom");
        assertRenderedVisual(trophyResult, "trophyRoom");
        assert.ok(footballRequests.some(url => url.includes("philipp-lahm-world-cup-2014.webp")), `${config.name}: Lahm visual was not requested.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-trophy-${config.name}-${runLabel}.png`), fullPage: true });

        const requestedNames = new Set(footballRequests.map(url => decodeURIComponent(new URL(url).pathname.split("/").pop())));
        expectedAssets.forEach(asset => assert.ok(requestedNames.has(asset), `${config.name}: expected licensed asset was never exercised: ${asset}`));
        assert.deepEqual(pageErrors, [], `${config.name}: page errors detected.`);
        assert.deepEqual(consoleErrors, [], `${config.name}: unexpected console errors detected.`);
        assert.deepEqual(localFailures, [], `${config.name}: failed first-party requests detected.`);

        process.stdout.write(
            `PASS ${config.name} :: ${config.viewport.width}x${config.viewport.height} @${config.deviceScaleFactor}x :: ` +
            `${requestedNames.size} licensed visuals exercised lazily\n`
        );
    }finally{
        await context.close();
        if(browser.isConnected()) await browser.close();
    }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    for(const config of cases){
        await runCase(runtime, config);
    }
})().catch(error => {
    console.error("FOOTBALL VISUAL AUDIT FAILED");
    console.error(error.stack || error);
    process.exit(1);
});
