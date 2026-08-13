const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "loading-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1";

const cases = [
    {
        name: "desktop",
        viewport: { width: 1366, height: 768 },
        dpr: 1,
        mobile: false
    },
    {
        name: "windowed-desktop",
        viewport: { width: 940, height: 700 },
        dpr: 1,
        mobile: false
    },
    {
        name: "mobile-browser-height",
        viewport: { width: 390, height: 720 },
        dpr: 3,
        mobile: true,
        standalone: false
    },
    {
        name: "ios-standalone-height",
        viewport: { width: 390, height: 844 },
        dpr: 3,
        mobile: true,
        standalone: true
    }
];

fs.mkdirSync(resultsDirectory, { recursive: true });

function assertNear(actual, expected, tolerance, message){
    assert.ok(
        Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
        `${message}: expected ${expected} ± ${tolerance}, got ${actual}`
    );
}

async function prepareStartup(page, config){
    if(config.standalone){
        await page.addInitScript(() => {
            try{
                Object.defineProperty(navigator, "standalone", {
                    configurable: true,
                    get: () => true
                });
            }catch(error){
                /* Geometry is still exercised by the standalone-height viewport. */
            }
        });
    }

    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
        const image = document.getElementById("startupAthlete");
        return image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    }, null, { timeout: 12000 });

    if(config.mobile){
        await page.waitForFunction(() => {
            const image = document.getElementById("startupAthlete");
            return image
                && getComputedStyle(image).objectFit === "cover"
                && Boolean(document.querySelector('link[data-offline-app-style]'));
        }, null, { timeout: 12000 });
    }

    // Make the composition inspectable deterministically even after the normal
    // 2.7s splash hold has elapsed. This does not alter any computed geometry.
    await page.evaluate(() => {
        const loading = document.getElementById("loadingScreen");
        const app = document.getElementById("app");
        if(loading){
            loading.hidden = false;
            loading.classList.remove("hidden", "is-exiting");
            loading.style.opacity = "1";
            loading.style.transform = "none";
        }
        if(app){ app.style.visibility = "hidden"; }
        window.scrollTo(0, 0);
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function inspectStartup(page){
    return page.evaluate(() => {
        const loading = document.getElementById("loadingScreen");
        const frame = document.querySelector(".startupAthleteFrame");
        const image = document.getElementById("startupAthlete");
        const identity = document.querySelector(".startupIdentity");
        const heading = document.querySelector(".startupIdentity h1");
        const status = document.querySelector(".startupStatus");
        const saveNote = document.querySelector(".startupSaveNote");
        const credit = document.querySelector(".startupPhotoCredit");
        if(!loading || !frame || !image || !identity || !heading || !status || !saveNote || !credit){
            throw new Error("Startup composition is incomplete.");
        }

        const rect = element => {
            const value = element.getBoundingClientRect();
            return {
                left: value.left,
                right: value.right,
                top: value.top,
                bottom: value.bottom,
                width: value.width,
                height: value.height
            };
        };
        const loadingRect = rect(loading);
        const frameRect = rect(frame);
        const imageRect = rect(image);
        const imageStyle = getComputedStyle(image);
        const loadingStyle = getComputedStyle(loading);
        const scale = imageStyle.objectFit === "cover"
            ? Math.max(imageRect.width / image.naturalWidth, imageRect.height / image.naturalHeight)
            : Math.min(imageRect.width / image.naturalWidth, imageRect.height / image.naturalHeight);
        const visibleSourceWidth = scale > 0 ? Math.min(image.naturalWidth, imageRect.width / scale) : 0;
        const visibleSourceHeight = scale > 0 ? Math.min(image.naturalHeight, imageRect.height / scale) : 0;

        return {
            viewport: { width: innerWidth, height: innerHeight },
            dpr: devicePixelRatio,
            standalone: navigator.standalone === true || matchMedia("(display-mode: standalone)").matches,
            loading: loadingRect,
            frame: frameRect,
            image: {
                ...imageRect,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                objectFit: imageStyle.objectFit,
                objectPosition: imageStyle.objectPosition,
                position: imageStyle.position,
                visibleSourceWidthRatio: image.naturalWidth ? visibleSourceWidth / image.naturalWidth : 0,
                visibleSourceHeightRatio: image.naturalHeight ? visibleSourceHeight / image.naturalHeight : 0
            },
            topBand: imageRect.top - frameRect.top,
            topBandVariable: Number.parseFloat(loadingStyle.getPropertyValue("--startup-mobile-top-band")) || 0,
            identity: rect(identity),
            heading: rect(heading),
            status: rect(status),
            saveNote: rect(saveNote),
            credit: rect(credit),
            documentWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        };
    });
}

function assertCommon(result, config){
    assert.ok(result.image.naturalWidth > 0 && result.image.naturalHeight > 0,
        `${config.name}: Reus source did not decode.`);
    assert.equal(result.documentWidth, result.clientWidth,
        `${config.name}: startup composition has horizontal overflow.`);
    assertNear(result.loading.left, 0, 1, `${config.name}: loading stage left edge`);
    assertNear(result.loading.top, 0, 1, `${config.name}: loading stage top edge`);
    assertNear(result.loading.width, result.viewport.width, 1, `${config.name}: loading stage width`);
    assertNear(result.loading.height, result.viewport.height, 1, `${config.name}: loading stage height`);

    for(const [name, rect] of [
        ["identity", result.identity],
        ["heading", result.heading],
        ["status", result.status],
        ["save note", result.saveNote],
        ["credit", result.credit]
    ]){
        assert.ok(rect.left >= -1 && rect.right <= result.viewport.width + 1,
            `${config.name}: ${name} escapes the horizontal viewport.`);
        assert.ok(rect.top >= -1 && rect.bottom <= result.viewport.height + 1,
            `${config.name}: ${name} escapes the vertical viewport.`);
    }
}

function assertMobile(result, config){
    assert.equal(result.image.objectFit, "cover",
        `${config.name}: installed/mobile startup must use the stable photo-box cover treatment.`);
    assert.match(result.image.objectPosition, /^54%\s+50%$/,
        `${config.name}: mobile Reus crop anchor changed.`);
    assert.equal(result.image.position, "absolute",
        `${config.name}: mobile Reus must be anchored independently of normal flow.`);
    assert.ok(result.topBand >= 44 && result.topBand <= 56,
        `${config.name}: top art band ${result.topBand.toFixed(1)}px is no longer width-bounded.`);
    assertNear(result.topBand, result.topBandVariable, 1.25,
        `${config.name}: photo top must track the explicit mobile art-band variable`);
    assertNear(result.image.bottom, result.frame.bottom, 1.25,
        `${config.name}: Reus photo must stay anchored to the stage bottom`);
    assert.ok(result.image.visibleSourceHeightRatio >= 0.985,
        `${config.name}: less than 98.5% of Reus source height remains visible (${(result.image.visibleSourceHeightRatio * 100).toFixed(1)}%).`);
    assert.ok(result.image.visibleSourceWidthRatio >= 0.72,
        `${config.name}: mobile crop discards too much horizontal source (${(result.image.visibleSourceWidthRatio * 100).toFixed(1)}% visible).`);
    assert.ok(result.identity.top <= result.viewport.height * 0.36,
        `${config.name}: startup identity drifted too far down the installed/mobile stage.`);
    assert.ok(result.status.bottom <= result.viewport.height - 48,
        `${config.name}: loading status entered the protected bottom save/credit zone.`);
    assert.ok(result.saveNote.bottom < result.credit.top - 4,
        `${config.name}: save note overlaps the attribution line.`);
}

async function runCase(browser, config){
    const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: config.dpr,
        isMobile: Boolean(config.mobile),
        hasTouch: Boolean(config.mobile),
        userAgent: config.mobile ? IOS_UA : undefined,
        locale: "en-US"
    });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const localFailures = [];
    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("console", message => {
        if(message.type() === "error" && !/^Failed to load resource/.test(message.text())){
            consoleErrors.push(message.text());
        }
    });
    page.on("requestfailed", request => {
        if(request.url().startsWith(baseUrl.href)){
            localFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
        }
    });

    try{
        await prepareStartup(page, config);
        const result = await inspectStartup(page);
        assertCommon(result, config);
        if(config.mobile){ assertMobile(result, config); }
        else{
            assert.equal(result.image.objectFit, "contain",
                `${config.name}: protected desktop loading treatment changed unexpectedly.`);
        }

        const screenshotPath = path.join(resultsDirectory, `loading-${config.name}-${runLabel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        assert.deepEqual(pageErrors, [], `${config.name}: page errors detected.`);
        assert.deepEqual(consoleErrors, [], `${config.name}: unexpected console errors detected.`);
        assert.deepEqual(localFailures, [], `${config.name}: failed first-party requests detected.`);

        process.stdout.write(
            `PASS ${config.name} :: ${result.viewport.width}x${result.viewport.height} @${result.dpr}x :: ` +
            `fit=${result.image.objectFit} crop=${result.image.objectPosition} topBand=${result.topBand.toFixed(1)}px :: ` +
            `visible source ${(result.image.visibleSourceWidthRatio * 100).toFixed(1)}%w / ${(result.image.visibleSourceHeightRatio * 100).toFixed(1)}%h\n`
        );
        return result;
    }finally{
        await context.close();
    }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, headless: true, args: runtime.args });
    try{
        process.stdout.write(`Chromium ${await browser.version()} · ${runLabel}\n`);
        const results = new Map();
        for(const config of cases){
            results.set(config.name, await runCase(browser, config));
        }

        const browserMobile = results.get("mobile-browser-height");
        const standalone = results.get("ios-standalone-height");
        assertNear(
            standalone.topBand,
            browserMobile.topBand,
            2,
            "same-width browser/standalone mobile top-band stability"
        );
        assert.equal(standalone.image.objectPosition, browserMobile.image.objectPosition,
            "same-width browser and installed-app Reus anchor must match.");
        assert.ok(
            Math.abs(standalone.identity.top - browserMobile.identity.top) <= 62,
            `startup identity moved ${Math.abs(standalone.identity.top - browserMobile.identity.top).toFixed(1)}px between browser-height and standalone-height mobile layouts.`
        );
        assert.ok(
            standalone.image.visibleSourceHeightRatio >= browserMobile.image.visibleSourceHeightRatio - 0.015,
            "installed-app height must not lose materially more Reus source height than browser-height mobile."
        );
        process.stdout.write("Standalone/mobile startup composition regression audit passed.\n");
    }finally{
        await browser.close();
    }
})().catch(error => {
    console.error("LOADING VISUAL AUDIT FAILED");
    console.error(error.stack || error);
    process.exit(1);
});
