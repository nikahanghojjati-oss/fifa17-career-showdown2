const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "r8-home";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const productionOrigin = "https://nikahanghojjati-oss.github.io";
const productionPathPrefix = "/fifa17-career-showdown2/";

const cases = [
    { name: "wide-desktop", viewport: { width: 1600, height: 900 }, dpr: 1, expectCharacters: true },
    { name: "reduced-wide-band", viewport: { width: 1220, height: 800 }, dpr: 1, expectCharacters: true, expectReducedBand: true },
    { name: "chromebook-1024", viewport: { width: 1024, height: 768 }, dpr: 1, expectCharacters: false, reducedMotion: true },
    { name: "mobile-reference", viewport: { width: 390, height: 844 }, dpr: 2, expectCharacters: false, mobile: true }
];

const buttonIds = [
    "continueCareer",
    "newShowdown",
    "legacyButton",
    "careerStatisticsButton",
    "ruleBookButton",
    "settingsButton"
];

const expectedAssets = Object.freeze({
    A01_NIK_CORE_THINKING_HERO: "17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219",
    A02_DANIEL_CORE_POINTING_HERO: "9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc"
});

fs.mkdirSync(resultsDirectory, { recursive: true });

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

async function waitForR8Home(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof window.CareerModeR8FinalArt === "object", null, { timeout: 12000 });
    await page.evaluate(() => window.CareerModeR8FinalArt.ready);
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
    await page.waitForFunction(() => {
        const diagnostics = window.CareerModeR8FinalArt?.getDiagnostics?.();
        return diagnostics
            && diagnostics.rootGate === "active"
            && diagnostics.stylesheetLoaded === true
            && diagnostics.homeLayerMounted === true
            && diagnostics.characters.length === 2
            && diagnostics.characters.every(character => character.loadState !== "pending");
    }, null, { timeout: 12000 });
}

async function inspect(page){
    return page.evaluate((ids) => {
        const root = document.documentElement;
        const layer = document.getElementById("r8HomeFinalArt");
        const shell = document.querySelector("#mainMenu .fifaMenuShell");
        const reus = document.querySelector("#mainMenu .menuCoverAthlete");
        const credit = document.getElementById("menuAthleteCredit");
        const startupReus = document.getElementById("startupAthlete");
        const visualFidelity = document.querySelector('link[data-visual-fidelity="reus-r3"]');
        const r8Stylesheet = document.querySelector('link[data-r8-presentation="r8-25-home-global"]');
        const links = Array.from(document.head.querySelectorAll("link[rel='stylesheet']"));
        const characters = Array.from(document.querySelectorAll("#r8HomeFinalArt .r8CharacterLayer"));
        const integrity = window.getMenuExperienceIntegrity?.() || null;

        return {
            rootGate: root.dataset.r8Visual || null,
            diagnostics: window.CareerModeR8FinalArt.getDiagnostics(),
            stylesheetOrder: {
                visualFidelity: links.indexOf(visualFidelity),
                r8: links.indexOf(r8Stylesheet)
            },
            layer: layer ? {
                ariaHidden: layer.getAttribute("aria-hidden"),
                pointerEvents: getComputedStyle(layer).pointerEvents,
                zIndex: Number.parseInt(getComputedStyle(layer).zIndex || "0", 10) || 0,
                focusables: layer.querySelectorAll("button,input,select,textarea,a[href],[tabindex]:not([tabindex='-1']),[contenteditable='true']").length
            } : null,
            shellZIndex: shell ? Number.parseInt(getComputedStyle(shell).zIndex || "0", 10) || 0 : 0,
            reusDisplay: reus ? getComputedStyle(reus).display : null,
            creditDisplay: credit ? getComputedStyle(credit).display : null,
            startupReus: startupReus ? {
                complete: startupReus.complete,
                naturalWidth: startupReus.naturalWidth,
                src: startupReus.getAttribute("src")
            } : null,
            characters: characters.map(character => {
                const image = character.querySelector("img");
                const style = getComputedStyle(character);
                return {
                    assetId: character.dataset.r8AssetId,
                    loadState: character.dataset.r8AssetLoad,
                    display: style.display,
                    width: Number.parseFloat(style.width || "0") || 0,
                    opacity: Number.parseFloat(style.opacity || "0") || 0,
                    imageNaturalWidth: image?.naturalWidth || 0,
                    imageNaturalHeight: image?.naturalHeight || 0,
                    expectedSha: image?.dataset.r8ExpectedSha256 || null,
                    imagePointerEvents: image ? getComputedStyle(image).pointerEvents : null
                };
            }),
            buttons: ids.map(id => {
                const button = document.getElementById(id);
                const rect = button?.getBoundingClientRect();
                return {
                    id,
                    exists: Boolean(button),
                    visible: Boolean(button && rect && rect.width > 0 && rect.height > 0),
                    disabled: Boolean(button?.disabled),
                    ariaDisabled: button?.getAttribute("aria-disabled") || null
                };
            }),
            integrity,
            documentWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            transitionDuration: getComputedStyle(document.querySelector("#mainMenu .menuTile")).transitionDuration
        };
    }, buttonIds);
}

async function inspectRuntimeNoticeFocus(page){
    return page.evaluate(() => {
        window.showAppNotice("R8 focus audit", "error", 0);
        const button = document.querySelector("#appRuntimeNotice button");
        if(!button){ throw new Error("Runtime notice dismiss button was not created."); }
        button.focus();
        const style = getComputedStyle(button);
        const result = {
            active: document.activeElement === button,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow
        };
        button.click();
        return result;
    });
}

async function assertReversible(page){
    const before = await page.evaluate(() => {
        window.CareerModeR8FinalArt.disable();
        const reus = document.querySelector("#mainMenu .menuCoverAthlete");
        return {
            rootGate: document.documentElement.dataset.r8Visual || null,
            layerPresent: Boolean(document.getElementById("r8HomeFinalArt")),
            reusDisplay: reus ? getComputedStyle(reus).display : null,
            integrity: window.getMenuExperienceIntegrity?.() || null
        };
    });
    assert.equal(before.rootGate, null, "R8 disable must remove the root gate.");
    assert.equal(before.layerPresent, false, "R8 disable must remove final art.");
    assert.notEqual(before.reusDisplay, "none", "R8 disable must restore the existing Home Reus presentation.");
    assert.deepEqual(before.integrity, {
        selectorReady: true,
        mediaChoicesReady: true,
        toggleBound: true,
        muteBound: true,
        feedbackBound: true
    }, "Menu behavior integrity changed when R8 was disabled.");

    await page.evaluate(() => window.CareerModeR8FinalArt.enable());
    await page.waitForFunction(() => document.documentElement.dataset.r8Visual === "active" && Boolean(document.getElementById("r8HomeFinalArt")));
}

function assertHome(result, config){
    assert.equal(result.rootGate, "active", `${config.name}: R8 root gate not active.`);
    assert.equal(result.diagnostics.writesStorage, false, `${config.name}: visual layer must not write storage.`);
    assert.equal(result.diagnostics.writesFirebase, false, `${config.name}: visual layer must not write Firebase.`);
    assert.equal(result.diagnostics.changesDomainAuthority, false, `${config.name}: visual layer must not own domain state.`);
    assert.ok(result.stylesheetOrder.visualFidelity >= 0, `${config.name}: protected visual-fidelity stylesheet missing.`);
    assert.ok(result.stylesheetOrder.r8 > result.stylesheetOrder.visualFidelity, `${config.name}: R8 stylesheet must load after visual fidelity.`);
    assert.ok(result.layer, `${config.name}: final-art layer missing.`);
    assert.equal(result.layer.ariaHidden, "true", `${config.name}: final art must be aria-hidden.`);
    assert.equal(result.layer.pointerEvents, "none", `${config.name}: final art must not hit-test.`);
    assert.equal(result.layer.focusables, 0, `${config.name}: decorative layer contains focusable descendants.`);
    assert.ok(result.shellZIndex > result.layer.zIndex, `${config.name}: live Home shell must stack above final art.`);
    assert.equal(result.reusDisplay, "none", `${config.name}: Home Reus should be suppressed only under R8 gate.`);
    assert.equal(result.creditDisplay, "none", `${config.name}: Home Reus credit should be suppressed with Home Reus under R8 gate.`);
    assert.ok(result.startupReus?.complete && result.startupReus.naturalWidth > 0, `${config.name}: protected loading Reus must still decode.`);
    assert.match(result.startupReus.src || "", /marco-reus-2015-cc-by\.webp/, `${config.name}: loading Reus source changed.`);
    assert.equal(result.characters.length, 2, `${config.name}: expected two frozen character layers.`);

    const byAsset = Object.fromEntries(result.characters.map(character => [character.assetId, character]));
    for(const [assetId, sha] of Object.entries(expectedAssets)){
        const character = byAsset[assetId];
        assert.ok(character, `${config.name}: missing ${assetId}.`);
        assert.equal(character.loadState, "loaded", `${config.name}: ${assetId} did not load.`);
        assert.equal(character.expectedSha, sha, `${config.name}: ${assetId} expected hash contract changed.`);
        assert.ok(character.imageNaturalWidth > 0 && character.imageNaturalHeight > 0, `${config.name}: ${assetId} did not decode.`);
        assert.equal(character.imagePointerEvents, "none", `${config.name}: ${assetId} image must not hit-test.`);
        if(config.expectCharacters){
            assert.notEqual(character.display, "none", `${config.name}: ${assetId} should be visible at this width.`);
            assert.ok(character.width > 0, `${config.name}: ${assetId} visible rail has zero width.`);
            if(config.expectReducedBand){
                assert.ok(character.opacity <= .81, `${config.name}: 1180-1279px band should reduce character opacity.`);
            }
        }else{
            assert.equal(character.display, "none", `${config.name}: ${assetId} must be omitted at this width.`);
        }
    }

    result.buttons.forEach(button => {
        assert.equal(button.exists, true, `${config.name}: missing Home control ${button.id}.`);
        assert.equal(button.visible, true, `${config.name}: Home control ${button.id} is not visible.`);
    });
    assert.equal(result.buttons.find(button => button.id === "continueCareer").ariaDisabled, String(result.buttons.find(button => button.id === "continueCareer").disabled), `${config.name}: Continue dynamic disabled semantics diverged.`);
    assert.deepEqual(result.integrity, {
        selectorReady: true,
        mediaChoicesReady: true,
        toggleBound: true,
        muteBound: true,
        feedbackBound: true
    }, `${config.name}: media/menu behavior integrity changed.`);
    assert.ok(result.documentWidth <= result.clientWidth + 1, `${config.name}: Home has horizontal overflow.`);
    if(config.reducedMotion){
        assert.match(result.transitionDuration, /^(0s(?:,\s*0s)*)$/, `${config.name}: R8 Home tile transition remains active under reduced motion.`);
    }
}

async function runCase(browser, config){
    const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: config.dpr,
        isMobile: Boolean(config.mobile),
        hasTouch: Boolean(config.mobile),
        locale: "en-US"
    });
    const page = await context.newPage();
    if(config.reducedMotion){
        await page.emulateMedia({ reducedMotion: "reduce" });
    }

    const pageErrors = [];
    const consoleErrors = [];
    const externalConsoleNoise = [];
    const localFailures = [];

    page.on("pageerror", error => pageErrors.push(error.stack || error.message));
    page.on("console", message => {
        if(message.type() === "error" && !/^Failed to load resource/.test(message.text())){
            if(isExpectedProductionAppCheckConsoleNoise(message)) externalConsoleNoise.push(message.text());
            else consoleErrors.push(message.text());
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
        await waitForR8Home(page);
        const result = await inspect(page);
        assertHome(result, config);
        const notice = await inspectRuntimeNoticeFocus(page);
        assert.equal(notice.active, true, `${config.name}: runtime notice dismiss did not receive focus.`);
        assert.notEqual(notice.outlineStyle, "none", `${config.name}: runtime notice dismiss lacks explicit focus outline.`);
        assert.notEqual(notice.outlineWidth, "0px", `${config.name}: runtime notice dismiss focus outline has zero width.`);
        assert.notEqual(notice.boxShadow, "none", `${config.name}: runtime notice dismiss lacks high-contrast focus ring.`);
        await assertReversible(page);

        assert.deepEqual(pageErrors, [], `${config.name}: page errors detected.`);
        assert.deepEqual(consoleErrors, [], `${config.name}: unexpected console errors detected.`);
        assert.deepEqual(localFailures, [], `${config.name}: failed first-party requests detected.`);

        if(externalConsoleNoise.length){
            process.stdout.write(`INFO ${config.name} :: ignored ${externalConsoleNoise.length} expected external production App Check browser console message(s).\n`);
        }

        const screenshotPath = path.join(resultsDirectory, `home-${config.name}-${runLabel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        process.stdout.write(`PASS ${config.name} :: R8 Home gate, frozen assets, behavior integrity, focus, responsive omission and reversibility verified.\n`);
    }finally{
        await context.close();
    }
}

function runInstalledPresentationCompanions(){
    const commonEnvironment = { ...process.env, CMS_BASE_URL: baseUrl.href, CMS_TEST_RESULTS: resultsDirectory };
    execFileSync(process.execPath, [path.join(__dirname, "loading-visual-audit.cjs")], {
        cwd: path.resolve(__dirname, "../.."),
        env: { ...commonEnvironment, CMS_CHROMIUM_MULTI_CONTEXT: "1", CMS_AUDIT_RUN: `${runLabel}-protected-loading` },
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
        const browser = await chromium.launch({ executablePath: runtime.executablePath, headless: true, args: runtime.args });
        if(!browserVersion){
            browserVersion = await browser.version();
            process.stdout.write(`Chromium ${browserVersion} · ${runLabel}\n`);
        }
        try{ await runCase(browser, config); }
        finally{ if(browser.isConnected()) await browser.close(); }
    }
    runInstalledPresentationCompanions();
    process.stdout.write("R8.25 Home + protected loading + Settings install visual suite passed.\n");
})().catch(error => {
    console.error("R8 HOME VISUAL AUDIT FAILED");
    console.error(error.stack || error);
    process.exit(1);
});
