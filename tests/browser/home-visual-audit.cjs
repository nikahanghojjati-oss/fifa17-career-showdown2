const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "home-visual";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const productionOrigin = "https://nikahanghojjati-oss.github.io";
const productionPathPrefix = "/fifa17-career-showdown2/";

// Continue Career shows Team V's number-17 player (owner, 2026-10-05); the old Reus cover is not shown on Home.
const cases = [
    { name: "windowed-near-breakpoint-dpr1", viewport: { width: 940, height: 700 }, deviceScaleFactor: 1 },
    { name: "windowed-desktop-dpr1", viewport: { width: 1100, height: 720 }, deviceScaleFactor: 1 },
    { name: "chromebook-dpr1", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
    { name: "desktop-1080p-dpr1", viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
    { name: "mobile-reference-dpr2", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, tiles: "portrait" },
    // G-F16: phone portrait, 360-430 wide. G-F15: phone landscape. These also run the tile checks below.
    ...[[360, 640], [375, 553], [393, 660], [393, 852], [412, 915], [430, 932]].map(([width, height]) => (
        { name: `phone-portrait-${width}x${height}`, viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, tiles: "portrait" }
    )),
    ...[[844, 390], [932, 430], [740, 360], [667, 375]].map(([width, height]) => (
        { name: `phone-landscape-${width}x${height}`, viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, tiles: "landscape" }
    ))
];
const tileIds = ["continueCareer", "newShowdown", "legacyButton", "careerStatisticsButton", "homeTrophyRoomButton", "ruleBookButton", "settingsButton"];

fs.mkdirSync(resultsDirectory, { recursive: true });

async function waitForHome(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#continueCareer .tileArt").waitFor({ state: "visible", timeout: 12000 });
    await page.waitForFunction(() => {
        const art = document.querySelector("#continueCareer .tileArt");
        return Boolean(art && art.complete && art.naturalWidth > 0);
    }, null, { timeout: 12000 });
}

function isExpectedProductionAppCheckConsoleNoise(message){
    if(baseUrl.origin !== productionOrigin || !baseUrl.pathname.startsWith(productionPathPrefix)){
        return false;
    }

    const text = message.text();
    if(/^Framing 'https:\/\/www\.google\.com\/' violates the following report-only Content Security Policy directive: "frame-ancestors 'self'"\./.test(text)){
        return true;
    }

    if(text === "requestStorageAccess: Permission denied."){
        const sourceUrl = message.location()?.url || "";
        return !sourceUrl || !sourceUrl.startsWith(baseUrl.origin);
    }

    return false;
}

async function inspectHome(page){
    return page.evaluate(() => {
        const art = document.querySelector("#continueCareer .tileArt");
        const tile = document.getElementById("continueCareer");
        const label = tile && tile.querySelector(".menuTileLabel");
        const reus = document.querySelector("#continueCareer .menuCoverAthlete");
        const credit = document.getElementById("menuAthleteCredit");
        if(!art || !tile || !label){
            throw new Error("Continue Career composition is incomplete.");
        }
        const artStyle = getComputedStyle(art);
        const artRect = art.getBoundingClientRect();
        const tileRect = tile.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        const shown = node => Boolean(node && node.getClientRects().length && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden");
        return {
            viewport: { width: innerWidth, height: innerHeight },
            dpr: devicePixelRatio,
            src: art.currentSrc || art.src,
            naturalWidth: art.naturalWidth,
            opacity: artStyle.opacity,
            filter: artStyle.filter,
            art: { left: artRect.left, right: artRect.right, top: artRect.top, width: artRect.width, height: artRect.height },
            tile: { left: tileRect.left, right: tileRect.right, top: tileRect.top, bottom: tileRect.bottom },
            labelRight: labelRect.right,
            reusShown: shown(reus),
            creditShown: shown(credit),
            documentWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth
        };
    });
}

// G-F15 / G-F16: where every tile's label, text lines and icon are, and what else is on the Home stage.
async function inspectTiles(page){
    return page.evaluate(ids => {
        const box = rect => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
        const textLines = node => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0).map(box);
        };
        const tiles = ids.map(id => {
            const tile = document.getElementById(id);
            if(!tile){
                return { id, missing: true };
            }
            const label = tile.querySelector(".menuTileLabel");
            const art = tile.querySelector(".tileArt");
            const tileRect = tile.getBoundingClientRect();
            const centre = document.elementFromPoint(tileRect.left + tileRect.width / 2, tileRect.top + tileRect.height / 2);
            return {
                id,
                tile: box(tileRect),
                label: box(label.getBoundingClientRect()),
                lines: textLines(label),
                labelScrollWidth: label.scrollWidth,
                labelClientWidth: label.clientWidth,
                art: art ? box(art.getBoundingClientRect()) : null,
                topmost: Boolean(centre && tile.contains(centre))
            };
        });
        const rectOf = selector => {
            const node = document.querySelector(selector);
            return node && node.getClientRects().length ? box(node.getBoundingClientRect()) : null;
        };
        return {
            viewport: { width: innerWidth, height: innerHeight },
            tiles,
            strip: rectOf("#mainMenu .menuMusicTile"),
            lockup: rectOf("#mainMenu .homeLockup"),
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
            bodyScrollHeight: document.body.scrollHeight
        };
    }, tileIds);
}

const touches = (a, b, slack = 0) => a.left < b.right - slack && b.left < a.right - slack && a.top < b.bottom - slack && b.top < a.bottom - slack;
const inside = (inner, outer, slack = 0.5) => inner.left >= outer.left - slack && inner.right <= outer.right + slack && inner.top >= outer.top - slack && inner.bottom <= outer.bottom + slack;

function assertTiles(result, label, mode){
    const { viewport } = result;
    assert.ok(result.scrollWidth <= viewport.width + 1, `${label}: Home must not scroll sideways (${result.scrollWidth} > ${viewport.width}).`);
    assert.ok(result.scrollHeight <= viewport.height + 1, `${label}: Home must not scroll vertically (${result.scrollHeight} > ${viewport.height}).`);
    assert.ok(result.bodyScrollHeight <= viewport.height + 1, `${label}: the page body must not scroll vertically.`);
    assert.equal(result.tiles.length, tileIds.length, `${label}: all seven Home tiles must be present.`);
    for(const tile of result.tiles){
        assert.ok(!tile.missing, `${label}: ${tile.id} is missing from Home.`);
        assert.ok(tile.tile.right > tile.tile.left && tile.tile.bottom > tile.tile.top, `${label}: ${tile.id} has no size.`);
        assert.ok(inside(tile.tile, { left: 0, top: 0, right: viewport.width, bottom: viewport.height }), `${label}: ${tile.id} must be fully on screen.`);
        assert.ok(tile.topmost, `${label}: ${tile.id} must not be covered by another element (soundtrack card, bar or logo).`);
        assert.ok(tile.lines.length > 0, `${label}: ${tile.id} label has no text.`);
        assert.ok(tile.lines.every(line => inside(line, tile.tile)), `${label}: ${tile.id} label text must stay inside its tile (not clipped).`);
        assert.ok(tile.labelScrollWidth <= tile.labelClientWidth + 1, `${label}: ${tile.id} label has a word wider than its box (${tile.labelScrollWidth} > ${tile.labelClientWidth}).`);
        if(tile.id === "continueCareer"){
            continue;
        }
        assert.ok(tile.art, `${label}: ${tile.id} has no icon.`);
        assert.ok(inside(tile.art, tile.tile), `${label}: ${tile.id} icon must sit fully inside its tile.`);
        assert.ok(Math.min(tile.art.right - tile.art.left, tile.art.bottom - tile.art.top) >= 30, `${label}: ${tile.id} icon must stay large (30px or more).`);
        assert.ok(!touches(tile.label, tile.art), `${label}: ${tile.id} label box must not touch its icon.`);
        for(const line of tile.lines){
            assert.ok(!touches(line, tile.art), `${label}: ${tile.id} label text must not touch its icon.`);
        }
    }
    if(mode === "landscape"){
        // G-F15: every tile, the soundtrack strip and the logo are on screen together and never overlap one another.
        assert.ok(result.strip, `${label}: the soundtrack strip must show on a landscape phone.`);
        assert.ok(inside(result.strip, { left: 0, top: 0, right: viewport.width, bottom: viewport.height }), `${label}: the soundtrack strip must be fully on screen.`);
        assert.ok(result.lockup, `${label}: the logo must show on a landscape phone.`);
        const strip = result.strip;
        for(const tile of result.tiles){
            assert.ok(!touches(tile.tile, strip), `${label}: ${tile.id} must not overlap the soundtrack strip.`);
            assert.ok(!touches(tile.tile, result.lockup), `${label}: ${tile.id} must not overlap the logo.`);
        }
        assert.ok(!touches(strip, result.lockup), `${label}: the soundtrack strip must not overlap the logo.`);
        for(let i = 0; i < result.tiles.length; i += 1){
            for(let j = i + 1; j < result.tiles.length; j += 1){
                assert.ok(!touches(result.tiles[i].tile, result.tiles[j].tile), `${label}: ${result.tiles[i].id} and ${result.tiles[j].id} overlap.`);
            }
        }
    }
}

function assertCommon(result, label){
    assert.match(result.src, /visual-assets\/v10_1\/shared\/art\/home-tiles\/TILE_CONTINUE_V1\.webp/, `${label}: Continue must use Team V's number-17 player.`);
    assert.ok(result.naturalWidth > 0, `${label}: Continue art did not decode.`);
    assert.equal(result.opacity, "1", `${label}: Continue art must render at full opacity.`);
    assert.doesNotMatch(result.filter, /brightness|grayscale|saturate/, `${label}: Continue art must not be dimmed or greyed.`);
    assert.ok(result.art.width >= 30 && result.art.height >= 60, `${label}: Continue art is too small to see.`);
    assert.ok(result.art.left >= result.tile.left && result.art.right <= result.tile.right + 1, `${label}: Continue art must sit inside its tile.`);
    assert.ok(result.art.top >= result.tile.top && result.art.top < result.tile.bottom - 40, `${label}: the player's head must be inside the tile.`);
    assert.ok(result.labelRight <= result.art.left + 1, `${label}: the Continue label must not run under the player.`);
    assert.equal(result.reusShown, false, `${label}: the old Reus cover must not show on Home.`);
    assert.equal(result.creditShown, false, `${label}: the old Reus credit must not show on Home.`);
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
    const externalConsoleNoise = [];
    const localFailures = [];

    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("console", message => {
        if(message.type() === "error" && !/^Failed to load resource/.test(message.text())){
            if(isExpectedProductionAppCheckConsoleNoise(message)){
                externalConsoleNoise.push(message.text());
            }else{
                consoleErrors.push(message.text());
            }
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
        if(config.tiles){
            assertTiles(await inspectTiles(page), config.name, config.tiles);
        }

        assert.deepEqual(pageErrors, [], `${config.name}: page errors detected.`);
        assert.deepEqual(consoleErrors, [], `${config.name}: unexpected console errors detected.`);
        assert.deepEqual(localFailures, [], `${config.name}: failed first-party requests detected.`);

        if(externalConsoleNoise.length){
            process.stdout.write(
                `INFO ${config.name} :: ignored ${externalConsoleNoise.length} expected external production App Check browser console message(s).\n`
            );
        }

        const screenshotPath = path.join(resultsDirectory, `home-${config.name}-${runLabel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        process.stdout.write(
            `PASS ${config.name} :: ${result.viewport.width}x${result.viewport.height} @${result.dpr}x :: ` +
            `Continue art ${Math.round(result.art.width)}x${Math.round(result.art.height)} CSS inside its tile :: filter=${result.filter}\n`
        );
    }finally{
        await context.close();
    }
}

function runInstalledPresentationCompanions(){
    const commonEnvironment = { ...process.env, CMS_BASE_URL: baseUrl.href, CMS_TEST_RESULTS: resultsDirectory };
    execFileSync(process.execPath, [path.join(__dirname, "loading-visual-audit.cjs")], {
        cwd: path.resolve(__dirname, "../.."),
        env: {
            ...commonEnvironment,
            CMS_CHROMIUM_MULTI_CONTEXT: "1",
            CMS_AUDIT_RUN: `${runLabel}-installed-loading`
        },
        stdio: "inherit"
    });
    execFileSync(process.execPath, [path.join(__dirname, "settings-install-audit.cjs")], {
        cwd: path.resolve(__dirname, "../.."),
        env: { ...commonEnvironment, CMS_AUDIT_RUN: `${runLabel}-settings-install` },
        stdio: "inherit"
    });
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

    runInstalledPresentationCompanions();
    process.stdout.write("Home + installed startup + Settings install visual suite passed.\n");
})().catch(error => {
    console.error("HOME VISUAL AUDIT FAILED");
    console.error(error.stack || error);
    process.exit(1);
});