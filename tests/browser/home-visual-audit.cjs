const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "home-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");

const cases = [
    {
        name: "windowed-near-breakpoint-dpr1",
        viewport: { width: 940, height: 700 },
        deviceScaleFactor: 1,
        mobileReference: false,
        minimumPhysicalWidth: 360
    },
    {
        name: "windowed-desktop-dpr1",
        viewport: { width: 1100, height: 720 },
        deviceScaleFactor: 1,
        mobileReference: false
    },
    {
        name: "chromebook-dpr1",
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
        mobileReference: false
    },
    {
        name: "mobile-reference-dpr2",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        mobileReference: true
    }
];

fs.mkdirSync(resultsDirectory, { recursive: true });

async function waitForHome(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator(".menuCoverAthlete.imageLoaded img").waitFor({ state: "visible", timeout: 12000 });
}

async function inspectHome(page){
    return page.evaluate(() => {
        const image = document.querySelector(".menuCoverAthlete.imageLoaded img");
        const container = document.querySelector(".menuCoverAthlete");
        const tile = document.querySelector(".menuTilePrimary");
        if(!image || !container || !tile){
            throw new Error("Reus Home composition is incomplete.");
        }

        const imageStyle = getComputedStyle(image);
        const containerStyle = getComputedStyle(container);
        const imageRect = image.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const tileRect = tile.getBoundingClientRect();

        return {
            viewport: { width: innerWidth, height: innerHeight },
            dpr: devicePixelRatio,
            image: {
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                renderedWidth: imageRect.width,
                renderedHeight: imageRect.height,
                opacity: imageStyle.opacity,
                filter: imageStyle.filter,
                objectFit: imageStyle.objectFit,
                objectPosition: imageStyle.objectPosition,
                imageRendering: imageStyle.imageRendering,
                mixBlendMode: imageStyle.mixBlendMode
            },
            container: {
                width: containerRect.width,
                height: containerRect.height,
                clipPath: containerStyle.clipPath,
                tileFraction: tileRect.width ? containerRect.width / tileRect.width : 0
            },
            documentWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        };
    });
}

function assertCommon(result, label){
    assert.equal(result.image.opacity, "1", `${label}: Reus must render at full opacity.`);
    assert.equal(result.image.objectFit, "cover", `${label}: Reus must preserve cover framing.`);
    assert.equal(result.image.mixBlendMode, "normal", `${label}: Reus must use normal photo compositing.`);
    assert.equal(result.image.imageRendering, "auto", `${label}: browser-native photographic resampling must remain enabled.`);
    assert.ok(result.image.naturalWidth > 0 && result.image.naturalHeight > 0, `${label}: Reus source did not decode.`);
    assert.ok(
        result.image.naturalWidth >= result.image.renderedWidth,
        `${label}: Reus must never be horizontally upscaled beyond its source pixels.`
    );
    assert.ok(
        result.container.tileFraction >= 0.39 && result.container.tileFraction <= 0.51,
        `${label}: Reus container no longer fits the intended hero-tile proportion.`
    );
    assert.ok(result.container.clipPath !== "none", `${label}: FIFA-style diagonal photo geometry is missing.`);
    assert.ok(result.documentWidth <= result.clientWidth + 1, `${label}: Home has horizontal document overflow.`);
}

async function runCase(browser, config){
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
    page.on("response", response => {
        if(response.url().startsWith(baseUrl.href) && response.status() >= 400){
            localFailures.push(`${response.status()} ${response.url()}`);
        }
    });

    try{
        await waitForHome(page);
        const result = await inspectHome(page);
        assertCommon(result, config.name);

        if(config.mobileReference){
            assert.notEqual(
                result.image.filter,
                "none",
                `${config.name}: the owner-accepted mobile treatment must remain intentionally unchanged.`
            );
            assert.match(result.image.objectPosition, /^50%\s+7%$/, `${config.name}: mobile Reus crop changed unexpectedly.`);
        }else{
            assert.equal(
                result.image.filter,
                "none",
                `${config.name}: desktop Reus must avoid the CSS filter raster/compositing path.`
            );
            assert.match(
                result.image.objectPosition,
                /^53%\s+(15|18)%$/,
                `${config.name}: desktop Reus crop is outside the accepted natural-framing range.`
            );
        }

        const physicalWidth = result.image.renderedWidth * result.dpr;
        if(config.minimumPhysicalWidth){
            assert.ok(
                physicalWidth >= config.minimumPhysicalWidth,
                `${config.name}: Reus physical raster width ${physicalWidth.toFixed(1)}px is below the ${config.minimumPhysicalWidth}px windowed-desktop quality floor.`
            );
        }

        assert.deepEqual(pageErrors, [], `${config.name}: page errors detected.`);
        assert.deepEqual(consoleErrors, [], `${config.name}: unexpected console errors detected.`);
        assert.deepEqual(localFailures, [], `${config.name}: failed first-party requests detected.`);

        const screenshotPath = path.join(resultsDirectory, `home-${config.name}-${runLabel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        process.stdout.write(
            `PASS ${config.name} :: ${result.viewport.width}x${result.viewport.height} @${result.dpr}x :: ` +
            `Reus ${Math.round(result.image.renderedWidth)}x${Math.round(result.image.renderedHeight)} CSS / ` +
            `${Math.round(physicalWidth)}px physical width :: filter=${result.image.filter} :: crop=${result.image.objectPosition}\n`
        );
    }finally{
        await context.close();
    }
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    let browserVersion = "";

    for(const config of cases){
        const browser = await chromium.launch({
            executablePath: runtime.executablePath,
            headless: true,
            args: runtime.args
        });

        if(!browserVersion){
            browserVersion = await browser.version();
            process.stdout.write(`Chromium ${browserVersion} · ${runLabel}\n`);
        }

        try{
            await runCase(browser, config);
        }finally{
            if(browser.isConnected()){
                await browser.close();
            }
        }
    }
})().catch(error => {
    console.error("HOME VISUAL AUDIT FAILED");
    console.error(error.stack || error);
    process.exit(1);
});
