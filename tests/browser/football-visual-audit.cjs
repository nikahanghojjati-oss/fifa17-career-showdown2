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

function footballVisualPanelSelector(screenName, loadedOnly = false){
    const state = loadedOnly ? ".imageLoaded" : "";
    const host = `[data-football-visual-screen="${screenName}"]`;
    return `${host}.footballVisualPanel${state}, ${host} .footballVisualPanel${state}`;
}

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

async function waitForVisual(page, screenName, expectedCount = 1){
    const selector = footballVisualPanelSelector(screenName, true);
    const locator = page.locator(selector);
    await locator.first().waitFor({ state: "attached", timeout: 12000 });
    await page.waitForFunction(
        ({ selector, expectedCount }) => {
            const panels = [...document.querySelectorAll(selector)];
            return panels.length === expectedCount && panels.every(panel => {
                const image = panel.querySelector(".footballVisualMedia");
                return image
                    && image.complete
                    && image.naturalWidth > 0
                    && Number.parseFloat(getComputedStyle(image).opacity) >= .9999;
            });
        },
        { selector, expectedCount },
        { timeout: 12000 }
    );
}

async function inspectVisibleVisual(page, screenName){
    return page.evaluate(screen => {
        const host = document.querySelector(`[data-football-visual-screen="${screen}"]`);
        if(!host){ throw new Error(`Missing football visual host for ${screen}.`); }
        const panels = host.matches(".footballVisualPanel")
            ? [host]
            : [...host.querySelectorAll(".footballVisualPanel")];
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
    assert.equal(result.documentWidth, result.clientWidth, `${screenName}: page has horizontal overflow.`);
    assert.ok(result.panels.length > 0, `${screenName}: no visual panels were rendered.`);
    result.panels.forEach(panel => {
        assert.ok(panel.naturalWidth >= 688, `${screenName}/${panel.asset}: source derivative is unexpectedly narrow.`);
        assert.ok(panel.naturalHeight >= 560, `${screenName}/${panel.asset}: source derivative is unexpectedly short.`);
        assert.ok(panel.renderedWidth >= 180, `${screenName}/${panel.asset}: rendered panel is too narrow.`);
        assert.ok(panel.renderedHeight >= 120, `${screenName}/${panel.asset}: rendered panel is too short.`);
        assert.ok(Number.parseFloat(panel.opacity) >= .9999, `${screenName}/${panel.asset}: photography did not finish at full opacity.`);
        assert.equal(panel.objectFit, "cover", `${screenName}/${panel.asset}: object-fit must remain cover.`);
        assert.ok(panel.imageRendering === "auto" || panel.imageRendering === "-webkit-optimize-contrast", `${screenName}/${panel.asset}: browser-native resampling is not active.`);
        assert.equal(panel.mixBlendMode, "normal", `${screenName}/${panel.asset}: blend mode must remain normal.`);
        assert.equal(panel.filter, "none", `${screenName}/${panel.asset}: photography must not use CSS colour filters.`);
    });
}

async function seedShowdown(page){
    await page.evaluate(() => {
        localStorage.removeItem("careerModeShowdown.current");
        localStorage.removeItem("careerModeShowdown.legacy");
    });
    await page.locator("#newShowdown").click();
    await page.locator("#createShowdown").waitFor({ state: "visible", timeout: 12000 });
}

async function runCase(config){
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({
        executablePath: runtime.executablePath,
        args: runtime.args,
        headless: true
    });

    try{
        const context = await browser.newContext({
            viewport: config.viewport,
            deviceScaleFactor: config.deviceScaleFactor,
            isMobile: Boolean(config.isMobile),
            hasTouch: Boolean(config.hasTouch)
        });
        const page = await context.newPage();
        const pageErrors = [];
        const consoleErrors = [];
        const failedFirstParty = [];
        const footballRequests = [];

        page.on("pageerror", error => pageErrors.push(error.message));
        page.on("console", message => {
            if(message.type() === "error"){ consoleErrors.push(message.text()); }
        });
        page.on("requestfailed", request => {
            try{
                const parsed = new URL(request.url());
                if(parsed.origin === baseUrl.origin){ failedFirstParty.push(`${request.method()} ${request.url()}`); }
            }catch{}
        });
        page.on("request", request => {
            if(firstPartyFootballRequest(request.url())){ footballRequests.push(request.url()); }
        });

        await waitForApp(page);
        assert.equal(footballRequests.length, 0, `${config.name}: licensed football imagery must not load on Home startup.`);

        await seedShowdown(page);
        await waitForVisual(page, "createShowdown", 1);
        const createResult = await inspectVisibleVisual(page, "createShowdown");
        assertRenderedVisual(createResult, "createShowdown");
        assert.ok(footballRequests.some(url => url.includes("james-rodriguez-real-madrid-2016.webp")), `${config.name}: James visual was not requested.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-create-${config.name}-${runLabel}.png`), fullPage: true });

        await page.locator("#showdownName").fill("Visual QA");
        await page.locator("#managerOne").fill("Manager One");
        await page.locator("#managerTwo").fill("Manager Two");
        await page.locator("#startShowdown").click();
        await page.locator("#leagueWheelScreen").waitFor({ state: "visible", timeout: 12000 });
        await page.evaluate(() => {
            currentShowdown.selectedLeague = { id: "premier-league", name: "Premier League" };
            currentShowdown.status = "League Confirmed";
            currentShowdown.clubs = { playerOne: "Arsenal", playerTwo: "Chelsea" };
            currentShowdown.status = "Ready";
            saveCurrentShowdown();
            updateShowdownUI();
            showScreen("dashboard", false);
        });
        await page.locator("#dashboard").waitFor({ state: "visible", timeout: 12000 });
        await page.evaluate(() => openTransferChallenge());
        await page.locator("#transferChallenge").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "transferChallenge", 2);
        const transferResult = await inspectVisibleVisual(page, "transferChallenge");
        assertRenderedVisual(transferResult, "transferChallenge");
        assert.ok(footballRequests.some(url => url.includes("marcus-rashford-september-2016-cropped.webp")), `${config.name}: Rashford visual was not requested.`);
        assert.ok(footballRequests.some(url => url.includes("anthony-martial-man-utd-2015.webp")), `${config.name}: Martial visual was not requested.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-transfer-${config.name}-${runLabel}.png`), fullPage: true });

        await page.locator("#transferChallenge [data-smart-back]").click();
        await page.locator("#dashboard").waitFor({ state: "visible", timeout: 12000 });
        await page.locator("#dashboard [data-smart-back]").click();
        await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 12000 });

        await page.locator("#careerStatisticsButton").click();
        await page.locator("#careerStatistics").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "careerStatistics", 1);
        const statsResult = await inspectVisibleVisual(page, "careerStatistics");
        assertRenderedVisual(statsResult, "careerStatistics");
        assert.ok(footballRequests.some(url => url.includes("lionel-messi-barcelona-2016.webp")), `${config.name}: Messi visual was not requested.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-career-stats-${config.name}-${runLabel}.png`), fullPage: true });

        await page.locator("#careerStatisticsTrophyButton").click();
        await page.locator("#trophyRoom").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "trophyRoom", 1);
        const trophyResult = await inspectVisibleVisual(page, "trophyRoom");
        assertRenderedVisual(trophyResult, "trophyRoom");
        assert.ok(footballRequests.some(url => url.includes("philipp-lahm-world-cup-2014.webp")), `${config.name}: Lahm visual was not requested.`);
        await page.screenshot({ path: path.join(resultsDirectory, `football-trophy-${config.name}-${runLabel}.png`), fullPage: true });

        const unexpectedFootballRequests = footballRequests.filter(url => ![...expectedAssets].some(file => url.includes(file)));
        assert.deepEqual(unexpectedFootballRequests, [], `${config.name}: unexpected football asset requests: ${unexpectedFootballRequests.join(", ")}`);
        assert.deepEqual(pageErrors, [], `${config.name}: page errors: ${pageErrors.join(" | ")}`);
        assert.deepEqual(consoleErrors, [], `${config.name}: console errors: ${consoleErrors.join(" | ")}`);
        assert.deepEqual(failedFirstParty, [], `${config.name}: failed first-party requests: ${failedFirstParty.join(" | ")}`);

        await context.close();
        process.stdout.write(
            `${config.name}: licensed visual journey passed (${footballRequests.length} football image requests; DPR ${config.deviceScaleFactor}).\n`
        );
    }finally{
        await browser.close();
    }
}

(async () => {
    for(const config of cases){
        await runCase(config);
    }
    process.stdout.write("Licensed football visual audit passed at desktop, near-breakpoint and mobile-reference viewports.\n");
})().catch(error => {
    console.error("FOOTBALL VISUAL AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});
