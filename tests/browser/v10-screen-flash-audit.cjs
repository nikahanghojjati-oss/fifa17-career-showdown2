// JOB-1635: guard against old-design flashes and half-loaded artwork on every screen change.
// Records every requestAnimationFrame during Home -> screen -> Home (plus the Setup flow and the Settings overlay)
// at phone portrait, phone landscape and desktop with 4x CPU throttle, and fails on any frame that shows:
//   - the old light page (#a8bdc5), the old white header or the old footer gradient on a Team V screen
//   - a Team V screen shown without html[data-v10-screen] naming it
//   - a Team V sheet that is enabled but has no CSSStyleSheet yet (Chromium refetch after link.disabled: C-1)
//   - a visible <img> inside the shown screen that is not yet complete/decoded (half-loaded picture)
// A reduced-motion pass (prefers-reduced-motion: reduce, Motion = FOLLOW DEVICE) asserts no animation or transition
// over 100 ms on the shown screen. A double tap on a Home tile must start one navigation, not two.
// Completed-showdown journeys use read-only provider snapshots and seeded browser storage.
// Tap feedback is reported separately until it becomes a blocking Gate requirement.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");
const activeAdapter = require("../../js/sharedActiveShowdownAdapter.js");
const showdownFixture = fixtures.completedShowdownStorage();

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const runLabel = process.env.CMS_AUDIT_RUN || "v10-screen-flash";
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || "test-results");
const CPU_THROTTLE = Number(process.env.CMS_FLASH_CPU_THROTTLE || 4);
const SETTLE_MS = 450;
const SHOW_TIMEOUT_MS = 8000;
const OLD_PAGE = "rgb(168, 189, 197)";

const viewports = [
    { name: "phone-portrait-390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: "phone-landscape-844x390", viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: "desktop-1920x910", viewport: { width: 1920, height: 910 }, deviceScaleFactor: 1 }
];

// Home -> screen -> Home. `open` runs in the page; `host` is the element whose look must settle.
const journeys = [
    { name: "legacy", host: "legacy", open: "window.openOptionalModule('legacy')" },
    { name: "careerStatistics", host: "careerStatistics", open: "window.openOptionalModule('careerStatistics')" },
    { name: "trophyRoom", host: "trophyRoom", open: "window.openOptionalModule('trophyRoom')" },
    { name: "ruleBook", host: "ruleBook", open: "window.openOptionalModule('ruleBook')" },
    { name: "setup", host: "createShowdown", open: "window.navigateTo('createShowdown')" },
    { name: "settings", host: "settingsOverlay", overlay: true, open: "document.getElementById('settingsButton').click()", close: "window.closeSettings()" },
    { name: "seasonResults", host: "seasonEntry", fixture: "ready", required: true, content: ".v10SeasonStage:not([hidden]) #seasonReviewPanel", open: "window.__cmsOpenReadyResults()" },
    { name: "finalWinner", host: "seasonEntry", fixture: "finished", required: true, content: ".v10FinalStage", open: "window.openSeasonEntry()" },
    { name: "rivalry", host: "statistics", fixture: "finished", required: true, content: ".rv-stage", open: "window.openRivalryStatistics({ model: window.__cmsRivalryFixture })" }
];
const skipped = [];

fs.mkdirSync(resultsDirectory, { recursive: true });

const RECORDER = `(() => {
    if(window.__cmsFlashRecorder) return;
    const rec = { frames: [], events: [], running: false, raf: 0, loadedSheets: new Set() };
    document.addEventListener("career-mode-screen-shown", e => { if(rec.running) rec.events.push({ t: performance.now(), screen: e.detail && e.detail.screen }); });
    const rgbOld = ${JSON.stringify(OLD_PAGE)};
    const visible = el => { if(!el) return false; const r = el.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.02 && !/inset\\(50%\\)/.test(s.clipPath); };
    const sample = () => {
        const html = document.documentElement, body = document.body;
        const screen = typeof getActiveScreenName === "function" ? getActiveScreenName() : null;
        const V = window.CareerModeV10Screens;
        const overlay = document.getElementById("settingsOverlay");
        const overlayShown = Boolean(overlay && !overlay.classList.contains("hidden") && visible(overlay));
        const host = overlayShown ? overlay : (screen ? document.getElementById(screen) : null);
        const header = document.getElementById("topHeader"), footer = document.querySelector("#app > footer");
        const hs = header ? getComputedStyle(header) : null, fs = footer ? getComputedStyle(footer) : null;
        // A sheet that had its CSSStyleSheet earlier and now has none while enabled is being fetched again (C-1: link.disabled
        // toggling). A sheet on its first load is not a flash by itself (the screen's content is held until it has loaded).
        const links = [...document.querySelectorAll("link[data-v10-style]")];
        for(const l of links) if(l.sheet) rec.loadedSheets.add(l.getAttribute("data-v10-style"));
        const sheetsMissing = links.filter(l => !l.disabled && l.sheet === null && rec.loadedSheets.has(l.getAttribute("data-v10-style"))).map(l => l.getAttribute("data-v10-style"));
        let imgsNotReady = [];
        if(host && !host.hasAttribute("data-v10-pending")){
            imgsNotReady = [...host.querySelectorAll("img")].filter(img => visible(img) && !(img.complete && img.naturalWidth > 0)).map(img => (img.currentSrc || img.src || "").split("/").slice(-2).join("/")).slice(0, 6);
        }
        rec.frames.push({
            t: performance.now(), screen, overlay: overlayShown,
            v10: html.dataset.v10Screen || null,
            mounted: Boolean(V && screen && V.isMounted(screen)),
            pending: Boolean(host && host.hasAttribute("data-v10-pending")),
            htmlBg: getComputedStyle(html).backgroundColor, bodyBg: getComputedStyle(body).backgroundColor,
            lightPage: getComputedStyle(html).backgroundColor === rgbOld || getComputedStyle(body).backgroundColor === rgbOld,
            oldHeader: Boolean(hs && visible(header) && /249, 251, 251/.test(hs.backgroundImage)),
            oldFooter: Boolean(fs && visible(footer) && /37, 46, 53/.test(fs.backgroundImage)),
            bodyFont: getComputedStyle(body).fontFamily,
            sheetsMissing, imgsNotReady
        });
        if(rec.running) rec.raf = requestAnimationFrame(sample);
    };
    rec.start = () => { rec.frames = []; rec.events = []; rec.running = true; rec.raf = requestAnimationFrame(sample); };
    rec.stop = () => { rec.running = false; cancelAnimationFrame(rec.raf); return { frames: rec.frames, events: rec.events }; };
    window.__cmsFlashRecorder = rec;
})();`;

function analyse(recording, teamV, label){
    const problems = [];
    const seen = new Set();
    const add = (frame, reason) => {
        const key = `${frame.screen}|${reason}`;
        if(seen.has(key)) return;
        seen.add(key);
        problems.push({ label, screen: frame.screen, at: Math.round(frame.t), reason });
    };
    for(const frame of recording.frames){
        const onTeamV = teamV.has(frame.screen) || frame.overlay;
        if(frame.lightPage && onTeamV) add(frame, `old light page ${OLD_PAGE} painted (${frame.htmlBg} / ${frame.bodyBg})`);
        if(frame.oldHeader && onTeamV) add(frame, "old white header painted");
        if(frame.oldFooter && onTeamV && frame.screen !== "mainMenu") add(frame, "old footer gradient painted");
        if(teamV.has(frame.screen) && frame.v10 !== frame.screen) add(frame, `Team V screen shown without html[data-v10-screen="${frame.screen}"] (had ${frame.v10})`);
        // A sheet on its first load while the screen's content is still held invisible (pending) is not a flash; an enabled
        // sheet without its CSSStyleSheet on a screen that is already revealed is (C-1: Chromium refetch after link.disabled).
        if(onTeamV && !frame.pending && frame.sheetsMissing.length) add(frame, `Team V sheet enabled but not loaded (refetch): ${frame.sheetsMissing.join(", ")}`);
        if(frame.imgsNotReady.length && !frame.pending) add(frame, `picture painted before decode: ${frame.imgsNotReady.join(", ")}`);
    }
    return problems;
}

function durations(list){
    return String(list || "").split(",").map(part => part.trim()).filter(Boolean).map(part => part.endsWith("ms") ? parseFloat(part) : parseFloat(part) * 1000);
}

async function waitForHome(page){
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 20000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu") && typeof window.getActiveScreenName === "function" && window.getActiveScreenName() === "mainMenu", null, { timeout: 20000 });
    await page.waitForFunction(() => [...document.querySelectorAll("#mainMenu img")].every(img => img.complete), null, { timeout: 20000 });
}

async function waitShown(page, host, overlay){
    try{
        await page.waitForFunction(({ host, overlay }) => {
            const el = document.getElementById(host);
            if(!el || el.classList.contains("hidden")) return false;
            if(!overlay && window.getActiveScreenName() !== host) return false;
            return !el.hasAttribute("data-v10-pending");
        }, { host, overlay }, { timeout: SHOW_TIMEOUT_MS });
        return true;
    }catch(error){ return false; }
}

async function runJourney(page, journey, viewportName){
    await prepareJourney(page, journey);
    const teamV = new Set(["mainMenu"]);
    const recordings = [];
    const start = () => page.evaluate(() => window.__cmsFlashRecorder.start());
    const stop = async () => { await page.waitForTimeout(SETTLE_MS); return page.evaluate(() => window.__cmsFlashRecorder.stop()); };

    await start();
    await page.evaluate(journey.open);
    const shown = await waitShown(page, journey.host, journey.overlay === true);
    const out = await stop();
    if(!shown){
        assert.equal(journey.required, undefined, `${viewportName} ${journey.name}: required fixture journey did not open`);
        return { skipped: `${viewportName} ${journey.name}: ${journey.host} did not open headless within ${SHOW_TIMEOUT_MS} ms` };
    }
    if(journey.required){
        assert.equal(await page.evaluate(host => window.CareerModeV10Screens.isMounted(host), journey.host), true, `${journey.name}: Team V must mount`);
        await page.locator(`#${journey.host} ${journey.content}`).waitFor({ state: "visible", timeout: SHOW_TIMEOUT_MS });
    }
    const mountedOut = await page.evaluate(host => Boolean(window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted(host)), journey.host);
    if(mountedOut) teamV.add(journey.host);
    recordings.push({ label: `${viewportName} Home→${journey.name}`, out });
    // JOB-1657: the flash guard (html[data-v10-screen] body / #background = #060709) must not hide a setup skin's stadium plate.
    const plateProblem = await page.evaluate(() => {
        const skin = document.documentElement.dataset.v10Setup;
        if(!skin) return null;
        const bg = getComputedStyle(document.getElementById("background")).backgroundImage;
        const body = getComputedStyle(document.body).backgroundColor;
        if(bg === "none") return `setup skin "${skin}" lost its stadium plate (#background background-image: none)`;
        if(body !== "rgba(0, 0, 0, 0)") return `setup skin "${skin}" body is opaque (${body}) and hides the plate`;
        return null;
    });

    await start();
    if(journey.close) await page.evaluate(journey.close);
    else await page.evaluate(() => window.navigateTo("mainMenu"));
    await waitShown(page, "mainMenu", false);
    recordings.push({ label: `${viewportName} ${journey.name}→Home`, out: await stop() });
    await waitForHome(page);

    const problems = [];
    for(const rec of recordings){
        problems.push(...analyse(rec.out, teamV, rec.label));
    }
    if(plateProblem) problems.push({ label: `${viewportName} Home→${journey.name}`, screen: journey.host, at: 0, reason: plateProblem });
    // Compact frame strip for the report (before/after evidence): one line per frame, relative time in ms.
    const strips = recordings.map(rec => {
        const t0 = rec.out.frames.length ? rec.out.frames[0].t : 0;
        return { label: rec.label, frames: rec.out.frames.map(f => `${String(Math.round(f.t - t0)).padStart(4)}ms ${f.overlay ? "settingsOverlay" : f.screen}${f.pending ? "(pending)" : ""} v10=${f.v10} bg=${f.htmlBg}${f.lightPage ? " LIGHT-PAGE" : ""}${f.oldHeader ? " OLD-HEADER" : ""}${f.oldFooter ? " OLD-FOOTER" : ""}${f.sheetsMissing.length && !f.pending ? " SHEET-MISSING" : ""}${f.imgsNotReady.length && !f.pending ? " IMG-NOT-DECODED" : ""}`) };
    });
    // Count affected frames by reusing the unchanged detector, including overlapping reasons.
    const flashFrames = recordings.map(rec => ({ label: rec.label, frames: rec.out.frames.length, affectedFrames: rec.out.frames.filter(frame => analyse({ frames: [frame] }, teamV, rec.label).length > 0).length }));
    return { problems, frames: recordings.reduce((n, r) => n + r.out.frames.length, 0), strips, flashFrames };
}

async function prepareJourney(page, journey){
    if(!journey.fixture) return;
    const snapshot = showdownFixture[journey.fixture];
    await page.evaluate(async ({ snapshot, rivalry }) => {
        await window.ensureGameplayModules();
        // Only substitute reads. Navigation, live form nodes, CSS loading and rendering remain real.
        const names = { identity: "CareerModeOnlinePlayerIdentity", pair: "CareerModePersistentNikDanielPair", multiSeason: "CareerModeProductionSharedMultiSeasonProgression", history: "CareerModeProductionSharedHistoryConvergence", finalReconciliation: "CareerModeProductionSharedFinalReconciliation", terminalClose: "CareerModeProductionSharedTerminalClose", seasonResults: "CareerModeProductionSharedSeasonResults" };
        for(const [key, name] of Object.entries(names)) window[name] = { getState: () => snapshot[key] };
        currentShowdown = normalizeShowdown(JSON.parse(localStorage.getItem("careerModeShowdown.activeShowdown")));
        if(currentShowdown.integrityWarnings.length) throw new Error(`Invalid flash storage fixture: ${currentShowdown.integrityWarnings.join("; ")}`);
        window.__cmsRivalryFixture = rivalry;
        window.__cmsOpenReadyResults = () => {
            window.openSeasonEntry();
            for(const [prefix, result] of [["p1", snapshot.seasonResults.ownResult], ["p2", snapshot.seasonResults.opponentResult]]){
                for(const [field, value] of Object.entries(result)){
                    const input = document.getElementById(prefix + field[0].toUpperCase() + field.slice(1));
                    if(!input) throw new Error(`Missing real results field: ${prefix} ${field}`);
                    if(input.type === "checkbox") input.checked = value;
                    else input.value = String(value);
                }
            }
            // Render the real review of these finished-season inputs without confirming/saving it.
            window.completeCurrentSeason();
        };
        window.CareerModeV10Screens.invalidate("seasonEntry");
    }, { snapshot, rivalry: activeAdapter.rivalryView(snapshot) });
}

async function tapFeedback(page, viewport){
    const tile = page.locator("#ruleBookButton");
    await tile.scrollIntoViewIfNeeded();
    const box = await tile.boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    if(!viewport.hasTouch){ await page.mouse.move(x, y); await page.waitForTimeout(150); }
    await page.evaluate(() => {
        const tile = document.getElementById("ruleBookButton");
        const look = () => { const s = getComputedStyle(tile); return [s.transform, s.backgroundColor, s.boxShadow, s.borderColor, s.opacity, s.filter].join("|"); };
        const geometry = () => [...document.querySelectorAll("#mainMenu .menuTile")].map(el => [el.id, el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight]);
        const rec = { baseline: look(), geometry: JSON.stringify(geometry()), down: null, navigationAt: null, pressedAt: null, layoutChanged: false, shifts: [], samples: [], running: true };
        const observer = new PerformanceObserver(list => rec.shifts.push(...list.getEntries().map(e => ({ value: e.value, hadRecentInput: e.hadRecentInput, at: e.startTime }))));
        observer.observe({ type: "layout-shift", buffered: false });
        tile.addEventListener("pointerdown", () => { rec.down = performance.now(); }, { once: true });
        const navigated = event => { if(event.detail?.screen !== "mainMenu") rec.navigationAt ??= performance.now(); };
        document.addEventListener("career-mode-screen-shown", navigated);
        const sample = () => {
            if(rec.down !== null && rec.navigationAt === null){
                const at = performance.now() - rec.down, style = look();
                rec.samples.push({ at, active: tile.matches(":active"), style });
                if(tile.matches(":active") && style !== rec.baseline && rec.pressedAt === null) rec.pressedAt = at;
                if(JSON.stringify(geometry()) !== rec.geometry) rec.layoutChanged = true;
            }
            if(rec.running) rec.raf = requestAnimationFrame(sample);
        };
        rec.raf = requestAnimationFrame(sample);
        rec.stop = () => { rec.running = false; cancelAnimationFrame(rec.raf); rec.shifts.push(...observer.takeRecords().map(e => ({ value: e.value, hadRecentInput: e.hadRecentInput, at: e.startTime }))); observer.disconnect(); document.removeEventListener("career-mode-screen-shown", navigated); return { pressedAt: rec.pressedAt, pointerdownObserved: rec.down !== null, layoutChanged: rec.layoutChanged, shifts: rec.shifts.filter(e => e.at >= rec.down && (rec.navigationAt === null || e.at < rec.navigationAt)), samples: rec.samples }; };
        window.__cmsTapRecorder = rec;
    });
    const cdp = viewport.hasTouch ? await page.context().newCDPSession(page) : null;
    if(cdp) await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    else await page.mouse.down();
    await page.waitForTimeout(30);
    if(cdp){ await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); }
    else await page.mouse.up();
    await page.waitForTimeout(180);
    const result = await page.evaluate(() => window.__cmsTapRecorder.stop());
    assert.equal(result.pointerdownObserved, true, `${viewport.name}: real tile press must be observed`);
    result.passed = result.pressedAt !== null && result.pressedAt <= 100 && !result.layoutChanged && result.shifts.length === 0;
    console.log(`${result.passed ? "ok  " : "FINDING"} ${viewport.name} tap feedback: pressed=${result.pressedAt === null ? "not painted" : result.pressedAt.toFixed(1) + " ms"}, layout changed=${result.layoutChanged}, layout-shift entries=${result.shifts.length} (report only)`);
    await waitShown(page, "ruleBook", false);
    await page.evaluate(() => window.navigateTo("mainMenu"));
    await waitForHome(page);
    return result;
}

async function doubleTap(page, viewportName){
    await page.evaluate(() => window.__cmsFlashRecorder.start());
    const problems = [];
    // Two taps on the same Home tile, 30 ms apart (the tile is the Team V hit target, so the taps go through its handler).
    await page.evaluate(() => { const tile = document.getElementById("ruleBookButton"); tile.click(); return new Promise(r => setTimeout(() => { tile.click(); r(); }, 30)); });
    await waitShown(page, "ruleBook", false);
    let out = await page.evaluate(() => window.__cmsFlashRecorder.stop());
    let shows = out.events.filter(e => e.screen === "ruleBook").length;
    if(shows > 1) problems.push({ label: `${viewportName} double tap`, screen: "ruleBook", at: 0, reason: `two tile taps started ${shows} navigations to ruleBook (expected 1)` });
    await page.evaluate(() => window.navigateTo("mainMenu"));
    await waitForHome(page);
    // JOB-1658: a second tap delivered late (a throttled CPU can run the 30 ms timer after the 350 ms debounce, and the tile can be
    // hidden by then) must still not start another navigation, whatever the timing.
    await page.evaluate(() => window.__cmsFlashRecorder.start());
    await page.evaluate(() => { const tile = document.getElementById("ruleBookButton"); tile.click(); return new Promise(r => setTimeout(() => { tile.click(); r(); }, 450)); });
    await waitShown(page, "ruleBook", false);
    await page.waitForTimeout(SETTLE_MS);
    out = await page.evaluate(() => window.__cmsFlashRecorder.stop());
    shows = out.events.filter(e => e.screen === "ruleBook").length;
    if(shows > 1) problems.push({ label: `${viewportName} late double tap`, screen: "ruleBook", at: 0, reason: `a tile tap 450 ms after the first started ${shows} navigations to ruleBook (expected 1)` });
    await page.evaluate(() => window.navigateTo("mainMenu"));
    await waitForHome(page);
    // Two navigation requests for the same screen in one tick (the bar and a tile share window.navigateTo).
    await page.evaluate(() => window.__cmsFlashRecorder.start());
    await page.evaluate(() => { window.navigateTo("createShowdown"); window.navigateTo("createShowdown"); });
    await waitShown(page, "createShowdown", false);
    out = await page.evaluate(() => window.__cmsFlashRecorder.stop());
    shows = out.events.filter(e => e.screen === "createShowdown").length;
    if(shows > 1) problems.push({ label: `${viewportName} double navigate`, screen: "createShowdown", at: 0, reason: `two navigateTo calls showed createShowdown ${shows} times (expected 1)` });
    await page.evaluate(() => window.navigateTo("mainMenu"));
    await waitForHome(page);
    return problems;
}

async function reducedMotionPass(page, viewportName){
    const problems = [];
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.documentElement.dataset.motionReduced === "true", null, { timeout: 5000 }).catch(() => {});
    const follows = await page.evaluate(() => document.documentElement.dataset.motionReduced === "true" && document.documentElement.dataset.motionPreference === "system");
    if(!follows) problems.push({ label: `${viewportName} reduced-motion`, screen: "mainMenu", at: 0, reason: "FOLLOW DEVICE did not follow prefers-reduced-motion: reduce live (html[data-motion-reduced] stayed false)" });
    for(const journey of journeys){
        await prepareJourney(page, journey);
        await page.evaluate(journey.open);
        const shown = await waitShown(page, journey.host, journey.overlay === true);
        if(shown){
            if(journey.required) await page.locator(`#${journey.host} ${journey.content}`).waitFor({ state: "visible", timeout: SHOW_TIMEOUT_MS });
            await page.waitForTimeout(80);
            const long = await page.evaluate(host => {
                const root = document.getElementById(host);
                const hits = [];
                const parse = list => String(list || "").split(",").map(p => p.trim()).filter(Boolean).map(p => p.endsWith("ms") ? parseFloat(p) : parseFloat(p) * 1000);
                for(const el of [root, ...root.querySelectorAll("*")]){
                    const s = getComputedStyle(el);
                    const anim = s.animationName !== "none" && parse(s.animationDuration).some(d => d > 100);
                    const trans = parse(s.transitionDuration).some(d => d > 100) && /transform|opacity|all/.test(s.transitionProperty);
                    if(anim || trans) hits.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} ${anim ? "animation " + s.animationDuration : "transition " + s.transitionDuration}`);
                    if(hits.length >= 5) break;
                }
                return hits;
            }, journey.host);
            if(long.length) problems.push({ label: `${viewportName} reduced-motion ${journey.name}`, screen: journey.host, at: 0, reason: `motion over 100 ms with prefers-reduced-motion: ${long.join("; ")}` });
        }else{
            assert.equal(journey.required, undefined, `${viewportName} reduced-motion ${journey.name}: required fixture journey did not open`);
            console.log(`SKIP ${viewportName} reduced-motion ${journey.name}: ${journey.host} did not open headless`);
        }
        if(journey.close) await page.evaluate(journey.close);
        else await page.evaluate(() => window.navigateTo("mainMenu"));
        await waitForHome(page);
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    return problems;
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    const report = { runLabel, baseUrl: baseUrl.href, cpuThrottle: CPU_THROTTLE, viewports: [], skipped: skipped.map(([name, reason]) => ({ name, reason })), problems: [] };
    const pageErrors = [];
    try{
        for(const vp of viewports){
            const context = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile === true, hasTouch: vp.hasTouch === true, reducedMotion: "no-preference" });
            const page = await context.newPage();
            page.on("pageerror", error => pageErrors.push(`${vp.name}: ${error.message}`));
            await page.addInitScript(RECORDER);
            await page.addInitScript(storage => { for(const [key, value] of Object.entries(storage)) localStorage.setItem(key, value); }, showdownFixture.storage);
            const cdp = await context.newCDPSession(page);
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
            await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
            await waitForHome(page);
            const summary = { name: vp.name, journeys: [] };
            summary.tapFeedback = await tapFeedback(page, vp);
            for(const journey of journeys){
                const result = await runJourney(page, journey, vp.name);
                if(result.skipped){
                    console.log(`SKIP ${result.skipped}`);
                    summary.journeys.push({ name: journey.name, skipped: result.skipped });
                    report.skipped.push({ name: `${vp.name} ${journey.name}`, reason: result.skipped });
                    continue;
                }
                summary.journeys.push({ name: journey.name, frames: result.frames, problems: result.problems.length, strips: result.strips, flashFrames: result.flashFrames });
                report.problems.push(...result.problems);
                console.log(`${result.problems.length ? "FAIL" : "ok  "} ${vp.name} ${journey.name}: ${result.frames} frames, ${result.problems.length} problem(s)`);
                for(const p of result.problems) console.log(`      ${p.label} @${p.at}ms [${p.screen}]: ${p.reason}`);
            }
            const dbl = await doubleTap(page, vp.name);
            report.problems.push(...dbl);
            console.log(`${dbl.length ? "FAIL" : "ok  "} ${vp.name} double tap: ${dbl.length ? dbl.map(p => p.reason).join("; ") : "one navigation each"}`);
            const reduced = await reducedMotionPass(page, vp.name);
            report.problems.push(...reduced);
            console.log(`${reduced.length ? "FAIL" : "ok  "} ${vp.name} reduced-motion pass: ${reduced.length} problem(s)`);
            for(const p of reduced) console.log(`      ${p.label}: ${p.reason}`);
            report.viewports.push(summary);
            await context.close();
        }
    }finally{
        await browser.close();
    }
    for(const s of skipped) console.log(`SKIP ${s[0]}: ${s[1]}`);
    const reportPath = path.join(resultsDirectory, `${runLabel}-report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report: ${reportPath}`);
    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(" | ")}`);
    assert.equal(report.problems.length, 0, `${report.problems.length} flash problem(s):\n${report.problems.map(p => `- ${p.label} [${p.screen}]: ${p.reason}`).join("\n")}`);
    console.log("v10 screen flash audit: PASS");
})().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
});
