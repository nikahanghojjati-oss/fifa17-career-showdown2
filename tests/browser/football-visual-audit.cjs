const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "football-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const manifest = JSON.parse(fs.readFileSync(path.resolve("assets/football/asset-manifest.json"), "utf8"));
const MAX_PHYSICAL_SCALE = 1.02;
const MIN_SUBJECT_SAFE_FRAME_COVERAGE = 0.60;
const MAX_PORTRAIT_ASPECT_FOR_COVER = 0.92;
const MIN_WIDE_FRAME_ASPECT = 1.55;
const CROP_TOLERANCE = 0.015;

const cases = [
    { name: "desktop", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
    { name: "windowed-near-breakpoint", viewport: { width: 940, height: 700 }, deviceScaleFactor: 1 },
    { name: "mobile-reference", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
];

const expectedAssets = new Set(manifest.assets.map(item => item.output));
const rejectedR3Assets = new Set([
    "james-rodriguez-real-madrid-2016.webp",
    "marcus-rashford-man-utd-2016.webp",
    "anthony-martial-man-utd-2017.webp",
    "lionel-messi-barcelona-2016.webp"
]);
const requiredCleanAnchorAssets = new Set([
    "james-rodriguez-real-madrid-2019-smart-r5",
    "marcus-rashford-man-utd-2017-smart-r5",
    "anthony-martial-man-utd-2016-smart-r5"
]);
fs.mkdirSync(resultsDirectory, { recursive: true });

rejectedR3Assets.forEach(file => {
    assert.ok(!expectedAssets.has(file), `Rejected r3 football photograph remains in active manifest: ${file}`);
});

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

async function waitForRequiredFootballWarmup(page){
    await page.waitForFunction(
        expectedCount => {
            if(typeof window.getFootballVisualDiagnostics !== "function"){
                return false;
            }
            const diagnostics = window.getFootballVisualDiagnostics();
            return diagnostics.initialized === true
                && diagnostics.assetCount === expectedCount
                && diagnostics.preloadCount === expectedCount;
        },
        expectedAssets.size,
        { timeout: 15000 }
    );
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
    await page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
}

async function inspectVisibleVisual(page, screenName){
    return page.evaluate(screen => {
        const host = document.querySelector(`[data-football-visual-screen="${screen}"]`);
        if(!host){ throw new Error(`Missing football visual host for ${screen}.`); }
        const panels = host.matches(".footballVisualPanel")
            ? [host]
            : [...host.querySelectorAll(".footballVisualPanel")];
        return {
            deviceScaleFactor: window.devicePixelRatio || 1,
            hostRect: host.getBoundingClientRect().toJSON(),
            panels: panels.map(panel => {
                const image = panel.querySelector(".footballVisualMedia");
                const frame = panel.querySelector(".footballVisualMediaFrame");
                const imageStyle = getComputedStyle(image);
                const frameStyle = getComputedStyle(frame);
                const frameAccentStyle = getComputedStyle(frame, "::after");
                const beforeStyle = getComputedStyle(panel, "::before");
                const afterStyle = getComputedStyle(panel, "::after");
                const copy = panel.querySelector(".footballVisualCopy");
                const imageRect = image.getBoundingClientRect();
                const frameRect = frame.getBoundingClientRect();
                const copyRect = copy.getBoundingClientRect();
                const panelRect = panel.getBoundingClientRect();
                return {
                    asset: panel.dataset.footballVisualAsset,
                    framingMode: panel.dataset.framingMode || "",
                    photoTreatment: panel.dataset.photoTreatment || "",
                    maxCropFraction: Number.parseFloat(panel.dataset.maxCropFraction || "0"),
                    rejectPortraitCover: panel.dataset.rejectPortraitCover === "true",
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    imageBoxWidth: imageRect.width,
                    imageBoxHeight: imageRect.height,
                    frameWidth: frameRect.width,
                    frameHeight: frameRect.height,
                    panelWidth: panelRect.width,
                    panelHeight: panelRect.height,
                    opacity: imageStyle.opacity,
                    objectFit: imageStyle.objectFit,
                    objectPosition: imageStyle.objectPosition,
                    imageRendering: imageStyle.imageRendering,
                    mixBlendMode: imageStyle.mixBlendMode,
                    filter: imageStyle.filter,
                    frameZIndex: Number.parseInt(frameStyle.zIndex || "0", 10) || 0,
                    accentContent: frameAccentStyle.content,
                    accentTop: Number.parseFloat(frameAccentStyle.top || "0") || 0,
                    accentHeight: Number.parseFloat(frameAccentStyle.height || "0") || 0,
                    accentZIndex: Number.parseInt(frameAccentStyle.zIndex || "0", 10) || 0,
                    beforeZIndex: Number.parseInt(beforeStyle.zIndex || "0", 10) || 0,
                    afterZIndex: Number.parseInt(afterStyle.zIndex || "0", 10) || 0,
                    copyLeft: copyRect.left,
                    copyRight: copyRect.right,
                    copyTop: copyRect.top,
                    copyBottom: copyRect.bottom,
                    frameLeft: frameRect.left,
                    frameRight: frameRect.right,
                    frameTop: frameRect.top,
                    frameBottom: frameRect.bottom
                };
            }),
            documentWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        };
    }, screenName);
}

function getObjectFitMetrics(panel, dpr){
    const sourceWidth = panel.naturalWidth;
    const sourceHeight = panel.naturalHeight;
    const physicalFrameWidth = panel.frameWidth * dpr;
    const physicalFrameHeight = panel.frameHeight * dpr;
    const widthScale = physicalFrameWidth / sourceWidth;
    const heightScale = physicalFrameHeight / sourceHeight;
    const objectScale = panel.objectFit === "contain"
        ? Math.min(widthScale, heightScale)
        : Math.max(widthScale, heightScale);

    const contentWidth = sourceWidth * objectScale;
    const contentHeight = sourceHeight * objectScale;
    const visibleWidth = Math.min(contentWidth, physicalFrameWidth);
    const visibleHeight = Math.min(contentHeight, physicalFrameHeight);
    const frameCoverage = (visibleWidth * visibleHeight) / (physicalFrameWidth * physicalFrameHeight);

    const visibleSourceWidth = Math.min(sourceWidth, physicalFrameWidth / objectScale);
    const visibleSourceHeight = Math.min(sourceHeight, physicalFrameHeight / objectScale);
    const visibleSourceFraction = (visibleSourceWidth * visibleSourceHeight) / (sourceWidth * sourceHeight);

    return {
        objectScale,
        frameCoverage,
        visibleSourceFraction,
        cropFraction: 1 - visibleSourceFraction,
        sourceAspect: sourceWidth / sourceHeight,
        frameAspect: physicalFrameWidth / physicalFrameHeight,
        physicalFrameWidth,
        physicalFrameHeight
    };
}

function assertRenderedVisual(result, screenName){
    assert.ok(result.hostRect.width > 0 && result.hostRect.height > 0, `${screenName}: visual host has no rendered area.`);
    assert.ok(result.hostRect.left >= -1, `${screenName}: visual escapes left viewport edge.`);
    assert.ok(result.hostRect.right <= result.clientWidth + 1, `${screenName}: visual escapes right viewport edge.`);
    assert.equal(result.documentWidth, result.clientWidth, `${screenName}: page has horizontal overflow.`);
    assert.ok(result.panels.length > 0, `${screenName}: no visual panels were rendered.`);

    result.panels.forEach(panel => {
        assert.ok(panel.naturalWidth > 0 && panel.naturalHeight > 0, `${screenName}/${panel.asset}: photograph did not decode.`);
        assert.ok(panel.frameWidth >= 150, `${screenName}/${panel.asset}: photographic frame is too narrow.`);
        assert.ok(panel.frameHeight >= 120, `${screenName}/${panel.asset}: photographic frame is too short.`);
        assert.ok(panel.frameWidth <= panel.panelWidth + 1, `${screenName}/${panel.asset}: photographic frame exceeds its panel.`);
        assert.ok(panel.frameHeight <= panel.panelHeight + 1, `${screenName}/${panel.asset}: photographic frame exceeds its panel.`);

        const metrics = getObjectFitMetrics(panel, result.deviceScaleFactor);
        assert.ok(
            metrics.objectScale <= MAX_PHYSICAL_SCALE,
            `${screenName}/${panel.asset}: photograph would be materially upscaled at ${metrics.objectScale.toFixed(3)}x ` +
            `(${Math.round(metrics.physicalFrameWidth)}x${Math.round(metrics.physicalFrameHeight)} physical frame px from ${panel.naturalWidth}x${panel.naturalHeight}).`
        );

        assert.ok(Number.parseFloat(panel.opacity) >= .9999, `${screenName}/${panel.asset}: photography did not finish at full opacity.`);
        assert.ok(panel.objectFit === "contain" || panel.objectFit === "cover", `${screenName}/${panel.asset}: unsupported object-fit ${panel.objectFit}.`);
        assert.ok(panel.imageRendering === "auto" || panel.imageRendering === "-webkit-optimize-contrast", `${screenName}/${panel.asset}: browser-native resampling is not active.`);
        assert.equal(panel.mixBlendMode, "normal", `${screenName}/${panel.asset}: blend mode must remain normal.`);
        assert.equal(panel.filter, "none", `${screenName}/${panel.asset}: photography must not use CSS colour filters.`);

        if(requiredCleanAnchorAssets.has(panel.asset)){
            assert.equal(panel.photoTreatment, "clean-anchor", `${screenName}/${panel.asset}: owner-rejected photo must stay on the clean-anchor treatment.`);
            assert.ok(
                panel.frameZIndex > panel.beforeZIndex && panel.frameZIndex > panel.afterZIndex,
                `${screenName}/${panel.asset}: broad decorative geometry is painted above the photograph; face-safe layering regressed.`
            );
            assert.notEqual(panel.accentContent, "none", `${screenName}/${panel.asset}: owner-requested FIFA diagonal accent rail is missing.`);
            assert.ok(panel.accentHeight > 0, `${screenName}/${panel.asset}: accent rail has no rendered height.`);
            assert.ok(
                panel.accentTop >= panel.frameHeight * .54,
                `${screenName}/${panel.asset}: accent rail enters the protected head/face zone.`
            );
            assert.ok(panel.accentZIndex >= 3, `${screenName}/${panel.asset}: accent rail is not rendered as the intended bounded photo accent.`);
            const horizontallySeparated = panel.copyRight <= panel.frameLeft + 2 || panel.copyLeft >= panel.frameRight - 2;
            const verticallySeparated = panel.copyBottom <= panel.frameTop + 2 || panel.copyTop >= panel.frameBottom - 2;
            assert.ok(
                horizontallySeparated || verticallySeparated,
                `${screenName}/${panel.asset}: text/caption intrudes into the clean photographic anchor.`
            );
        }

        const maxCrop = Number.isFinite(panel.maxCropFraction) ? panel.maxCropFraction : 0;
        assert.ok(
            metrics.cropFraction <= maxCrop + CROP_TOLERANCE,
            `${screenName}/${panel.asset}: crop removes ${(metrics.cropFraction * 100).toFixed(1)}% of the source, exceeding declared ${(maxCrop * 100).toFixed(1)}% budget.`
        );

        if(panel.framingMode === "subject-safe"){
            assert.equal(panel.objectFit, "contain", `${screenName}/${panel.asset}: subject-safe photography must use contain, never blind cover.`);
            assert.ok(
                metrics.visibleSourceFraction >= 0.985,
                `${screenName}/${panel.asset}: subject-safe frame must preserve essentially the full photograph.`
            );
            assert.ok(
                metrics.frameCoverage >= MIN_SUBJECT_SAFE_FRAME_COVERAGE,
                `${screenName}/${panel.asset}: photograph occupies only ${(metrics.frameCoverage * 100).toFixed(1)}% of its frame; art direction would look like a tiny inset.`
            );
        }

        if(panel.rejectPortraitCover && panel.objectFit === "cover"){
            assert.ok(
                !(metrics.sourceAspect < MAX_PORTRAIT_ASPECT_FOR_COVER && metrics.frameAspect > MIN_WIDE_FRAME_ASPECT),
                `${screenName}/${panel.asset}: portrait-to-wide cover crop is forbidden; this is the exact class of regression that produced the rejected Rashford/James banners.`
            );
        }
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
        await waitForRequiredFootballWarmup(page);

        expectedAssets.forEach(file => {
            assert.ok(
                footballRequests.some(url => url.includes(file)),
                `${config.name}: required football photograph was not proactively warmed on startup: ${file}`
            );
        });

        await seedShowdown(page);
        await waitForVisual(page, "createShowdown", 1);
        const createResult = await inspectVisibleVisual(page, "createShowdown");
        assertRenderedVisual(createResult, "createShowdown");
        await page.screenshot({ path: path.join(resultsDirectory, `football-create-${config.name}-${runLabel}.png`), fullPage: true });

        await page.locator("#showdownName").fill("Visual QA");
        await page.locator("#managerOne").fill("Manager One");
        await page.locator("#managerTwo").fill("Manager Two");
        await page.locator("#startShowdown").click();
        await page.locator("#leagueWheelScreen").waitFor({ state: "visible", timeout: 12000 });
        await page.evaluate(() => {
            currentShowdown.selectedLeague = { id: "premier_league", name: "Premier League" };
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
        await page.screenshot({ path: path.join(resultsDirectory, `football-career-stats-${config.name}-${runLabel}.png`), fullPage: true });

        await page.locator("#careerStatisticsTrophyButton").click();
        await page.locator("#trophyRoom").waitFor({ state: "visible", timeout: 12000 });
        await waitForVisual(page, "trophyRoom", 1);
        const trophyResult = await inspectVisibleVisual(page, "trophyRoom");
        assertRenderedVisual(trophyResult, "trophyRoom");
        await page.screenshot({ path: path.join(resultsDirectory, `football-trophy-${config.name}-${runLabel}.png`), fullPage: true });

        const unexpectedFootballRequests = footballRequests.filter(url => ![...expectedAssets].some(file => url.includes(file)));
        assert.deepEqual(unexpectedFootballRequests, [], `${config.name}: unexpected football asset requests: ${unexpectedFootballRequests.join(", ")}`);
        assert.deepEqual(pageErrors, [], `${config.name}: page errors: ${pageErrors.join(" | ")}`);
        assert.deepEqual(consoleErrors, [], `${config.name}: console errors: ${consoleErrors.join(" | ")}`);
        assert.deepEqual(failedFirstParty, [], `${config.name}: failed first-party requests: ${failedFirstParty.join(" | ")}`);

        await context.close();
        process.stdout.write(
            `${config.name}: crop-safe required visual journey passed (${footballRequests.length} image requests; DPR ${config.deviceScaleFactor}).\n`
        );
    }finally{
        await browser.close();
    }
}

(async () => {
    for(const config of cases){
        await runCase(config);
    }
    process.stdout.write("Crop-safe football visual audit passed at desktop, near-breakpoint and mobile-reference viewports.\n");
})().catch(error => {
    console.error("FOOTBALL VISUAL AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});
