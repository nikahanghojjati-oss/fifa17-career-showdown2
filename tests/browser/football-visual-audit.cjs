const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "football-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const manifest = JSON.parse(fs.readFileSync("assets/football/asset-manifest.json", "utf8"));
const expectedIds = new Set(manifest.assets.map(asset => asset.id));
const plans = [
    ["createShowdown", 1],
    ["leagueWheelScreen", 1],
    ["clubWheelScreen", 1],
    ["dashboard", 1],
    ["transferChallenge", 2],
    ["seasonEntry", 1],
    ["seasonSummary", 1],
    ["careerStatistics", 1],
    ["trophyRoom", 1],
    ["legacy", 1],
    ["ruleBook", 1]
];
const cases = [
    { name: "desktop", viewport: { width: 1366, height: 768 }, dpr: 1 },
    { name: "compact-desktop", viewport: { width: 1100, height: 720 }, dpr: 1 },
    { name: "windowed", viewport: { width: 940, height: 700 }, dpr: 1, reducedMotion: true },
    { name: "mobile-dpr2", viewport: { width: 390, height: 844 }, dpr: 2, mobile: true }
];
fs.mkdirSync(resultsDirectory, { recursive: true });

function isFootballRequest(url){
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
    await page.waitForFunction(() => {
        return typeof window.getFootballVisualDiagnostics === "function"
            && window.getFootballVisualDiagnostics().initialized === true;
    }, null, { timeout: 12000 });
}

async function ensureDynamicScreens(page){
    await page.evaluate(async () => {
        if(typeof window.ensureOptionalModule === "function"){
            for(const name of ["ruleBook", "careerStatistics", "trophyRoom", "legacy"]){
                await window.ensureOptionalModule(name);
            }
        }
        if(typeof window.createCareerStatisticsScreen === "function"){
            window.createCareerStatisticsScreen();
        }
        if(typeof window.createTrophyRoomScreen === "function"){
            window.createTrophyRoomScreen();
        }
        if(typeof window.createRuleBookScreen === "function"){
            window.createRuleBookScreen();
        }
    });
}

async function exposeScreenForAudit(page, screenName){
    await page.evaluate(name => {
        document.querySelectorAll("main .screen").forEach(screen => {
            screen.classList.add("hidden");
            screen.setAttribute("aria-hidden", "true");
        });
        const target = document.getElementById(name);
        if(!target){
            throw new Error(`Missing screen ${name}`);
        }
        if(typeof window.prepareFootballVisualScreen !== "function"
            || !window.prepareFootballVisualScreen(name)){
            throw new Error(`Could not mount football visual for ${name}`);
        }
        target.classList.remove("hidden");
        target.setAttribute("aria-hidden", "false");
        window.scrollTo(0, 0);
    }, screenName);
}

async function waitForVisual(page, screenName, expectedCount){
    await page.waitForFunction(({ screenName, expectedCount }) => {
        const host = document.querySelector(`[data-football-visual-screen="${screenName}"]`);
        if(!host){
            return false;
        }
        const panels = host.matches(".footballVisualPanel")
            ? [host]
            : [...host.querySelectorAll(".footballVisualPanel")];
        return panels.length === expectedCount && panels.every(panel => {
            const image = panel.querySelector(".footballVisualMedia");
            return image
                && image.complete
                && image.naturalWidth > 0
                && panel.classList.contains("imageLoaded")
                && Number.parseFloat(getComputedStyle(image).opacity) >= .999;
        });
    }, { screenName, expectedCount }, { timeout: 15000 });
    await page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
}

async function inspectScreen(page, screenName){
    return page.evaluate(name => {
        const screen = document.getElementById(name);
        const host = screen.querySelector(`[data-football-visual-screen="${name}"]`);
        const panels = host.matches(".footballVisualPanel")
            ? [host]
            : [...host.querySelectorAll(".footballVisualPanel")];
        return {
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            panels: panels.map(panel => {
                const frame = panel.querySelector(".footballVisualMediaFrame");
                const image = panel.querySelector(".footballVisualMedia");
                const copy = panel.querySelector(".footballVisualCopy");
                const p = panel.getBoundingClientRect();
                const f = frame.getBoundingClientRect();
                const c = copy.getBoundingClientRect();
                const accent = getComputedStyle(frame, "::after");
                return {
                    asset: panel.dataset.footballVisualAsset,
                    treatment: panel.dataset.photoTreatment,
                    panel: {
                        left: p.left,
                        right: p.right,
                        width: p.width,
                        height: p.height
                    },
                    frame: {
                        left: f.left,
                        right: f.right,
                        top: f.top,
                        bottom: f.bottom,
                        width: f.width,
                        height: f.height
                    },
                    copy: {
                        left: c.left,
                        right: c.right,
                        top: c.top,
                        bottom: c.bottom
                    },
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    objectFit: getComputedStyle(image).objectFit,
                    opacity: Number.parseFloat(getComputedStyle(image).opacity),
                    transitionDuration: getComputedStyle(image).transitionDuration,
                    transitionProperty: getComputedStyle(image).transitionProperty,
                    accentTop: Number.parseFloat(accent.top || "0") || 0
                };
            })
        };
    }, screenName);
}

function assertScreen(result, screenName, expectedCount, reducedMotion){
    assert.equal(result.scrollWidth, result.clientWidth, `${screenName}: horizontal overflow`);
    assert.equal(result.panels.length, expectedCount, `${screenName}: visual panel count`);
    result.panels.forEach(panel => {
        assert.ok(expectedIds.has(panel.asset), `${screenName}: unknown visual ${panel.asset}`);
        assert.equal(panel.objectFit, "contain", `${screenName}/${panel.asset}: blind crop is forbidden`);
        assert.ok(panel.opacity >= .999, `${screenName}/${panel.asset}: image did not settle`);
        assert.ok(panel.naturalWidth > 0 && panel.naturalHeight > 0,
            `${screenName}/${panel.asset}: decode failed`);
        assert.ok(panel.panel.width > 0 && panel.panel.height >= 160,
            `${screenName}/${panel.asset}: panel too small`);
        assert.ok(panel.frame.width >= 150 && panel.frame.height >= 120,
            `${screenName}/${panel.asset}: photo stage too small`);
        assert.ok(panel.panel.left >= -1 && panel.panel.right <= result.clientWidth + 1,
            `${screenName}/${panel.asset}: panel escapes viewport`);
        if(reducedMotion){
            const transitionDurations = panel.transitionDuration.split(",").map(value => {
                const normalized = value.trim();
                return normalized.endsWith("ms")
                    ? Number.parseFloat(normalized) / 1000
                    : Number.parseFloat(normalized);
            });
            assert.ok(
                panel.transitionProperty === "none"
                    && transitionDurations.every(value => Number.isFinite(value) && value <= .000001),
                `${screenName}/${panel.asset}: reduced-motion image transition remained active (${panel.transitionProperty} / ${panel.transitionDuration})`
            );
        }
        if(panel.treatment === "clean-anchor"){
            const horizontalGap = panel.copy.right <= panel.frame.left + 2
                || panel.copy.left >= panel.frame.right - 2;
            const verticalGap = panel.copy.bottom <= panel.frame.top + 2
                || panel.copy.top >= panel.frame.bottom - 2;
            assert.ok(horizontalGap || verticalGap,
                `${screenName}/${panel.asset}: copy overlaps protected photo anchor`);
            assert.ok(panel.accentTop >= panel.frame.height * .54,
                `${screenName}/${panel.asset}: accent reaches protected upper/face zone`);
        }
    });
}

async function run(config){
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({
        executablePath: runtime.executablePath,
        args: runtime.args,
        headless: true
    });
    try{
        const context = await browser.newContext({
            viewport: config.viewport,
            deviceScaleFactor: config.dpr,
            isMobile: Boolean(config.mobile),
            hasTouch: Boolean(config.mobile)
        });
        const page = await context.newPage();
        if(config.reducedMotion){
            await page.emulateMedia({ reducedMotion: "reduce" });
        }

        const errors = [];
        const failed = [];
        const footballRequests = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("requestfailed", request => {
            try{
                if(new URL(request.url()).origin === baseUrl.origin){
                    failed.push(request.url());
                }
            }catch{}
        });
        page.on("request", request => {
            if(isFootballRequest(request.url())){
                footballRequests.push(request.url());
            }
        });

        await waitForApp(page);
        await page.waitForTimeout(300);
        assert.equal(footballRequests.length, 0,
            `${config.name}: football archive must not preload on Home startup`);
        const startup = await page.evaluate(() => window.getFootballVisualDiagnostics());
        assert.equal(startup.preloadCount, 0,
            `${config.name}: football preload map must be empty at Home`);
        assert.equal(startup.assetCount, 12,
            `${config.name}: expected 12 licensed visual records`);

        await ensureDynamicScreens(page);
        const seenAssets = new Set();
        for(const [screenName, expectedCount] of plans){
            await exposeScreenForAudit(page, screenName);
            await waitForVisual(page, screenName, expectedCount);
            const result = await inspectScreen(page, screenName);
            // Preserve evidence even when a future assertion finds a regression.
            await page.screenshot({
                path: path.join(resultsDirectory, `${runLabel}-${screenName}-${config.name}.png`),
                fullPage: true
            });
            assertScreen(result, screenName, expectedCount, Boolean(config.reducedMotion));
            result.panels.forEach(panel => seenAssets.add(panel.asset));
        }

        assert.equal(seenAssets.size, 12,
            `${config.name}: all 12 active derivatives must be exercised`);
        const diagnostics = await page.evaluate(() => window.getFootballVisualDiagnostics());
        assert.equal(diagnostics.preloadCount, 12,
            `${config.name}: all assets should warm only after all 11 routes are explicitly exercised`);
        assert.deepEqual(errors, [], `${config.name}: page errors: ${errors.join(" | ")}`);
        assert.deepEqual(failed, [], `${config.name}: failed first-party requests: ${failed.join(" | ")}`);
        await context.close();
        process.stdout.write(`${config.name}: permanent 11-screen licensed visual audit passed.\n`);
    }finally{
        await browser.close();
    }
}

(async () => {
    assert.equal(expectedIds.size, 12, "Permanent visual audit requires exactly 12 active licensed derivatives.");
    for(const config of cases){
        await run(config);
    }
    process.stdout.write("Licensed football visual audit passed at desktop, compact desktop, reduced-motion windowed and mobile DPR2.\n");
})().catch(error => {
    console.error("LICENSED FOOTBALL VISUAL AUDIT FAILED");
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});
