"use strict";
// r87 transitions (Nik 2026-10-31: every screen change smooth and fast, no flash; Reus Gate: the loading screen stays until
// the next screen is ready). The flash audit checks what each frame is made of; this audit looks at the pixels. For every
// journey it records the real screen through a CDP screencast at 4x CPU and measures, per screen change:
//   ready    ms from the tap to the screen's content being revealed (data-v10-pending cleared)
//   dark     the longest stretch of near-black frames (mean luma < DARK_LUMA) while the Reus loading screen is NOT up
//   reus     how long the Reus loading screen showed for this change (0 when the screen was ready quickly)
// It fails when a dark stretch is longer than CMS_DARK_MS (default 600 ms at 4x CPU): a held screen must hand over to Reus instead.
// Usage: CMS_BASE_URL=http://127.0.0.1:<port>/ node tests/browser/r87-transition-speed-audit.cjs [journey ...]
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");
const activeAdapter = require("../../js/sharedActiveShowdownAdapter.js");
const showdownFixture = fixtures.completedShowdownStorage();

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const CPU = Number(process.env.CMS_FLASH_CPU_THROTTLE || 4);
const DARK_LUMA = 14;
const DARK_MS = Number(process.env.CMS_DARK_MS || 600);
const SETTLE_MS = 1200;
const report = process.env.CMS_TRANSITION_REPORT || "";
const only = process.argv.slice(2);

const viewports = [
    { name: "phone-390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: "desktop-1440x900", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
];
const journeys = [
    { name: "legacy", host: "legacy", open: "window.openOptionalModule('legacy')" },
    { name: "careerStatistics", host: "careerStatistics", open: "window.openOptionalModule('careerStatistics')" },
    { name: "trophyRoom", host: "trophyRoom", open: "window.openOptionalModule('trophyRoom')" },
    { name: "ruleBook", host: "ruleBook", open: "window.openOptionalModule('ruleBook')" },
    { name: "setup", host: "createShowdown", open: "window.navigateTo('createShowdown')" },
    { name: "seasonResults", host: "seasonEntry", fixture: "ready", open: "window.__cmsOpenReadyResults()" },
    { name: "finalWinner", host: "seasonEntry", fixture: "finished", open: "window.openSeasonEntry()" },
    { name: "rivalry", host: "statistics", fixture: "finished", open: "window.openRivalryStatistics({ model: window.__cmsRivalryFixture })" },
    { name: "standings", host: "standings", fixture: "finished", open: "window.CareerModeV10Screens.navigate('standings')" }
].filter(j => !only.length || only.includes(j.name));

// Per animation frame: is the Reus loading screen up, and is the target host still held (pending)?
const RECORDER = `(() => {
    if(window.__cmsTransitionRecorder) return;
    const rec = { frames: [], running: false, raf: 0, host: null };
    const up = () => { const el = document.getElementById("loadingScreen"); if(!el || el.hidden || el.classList.contains("hidden")) return false; return Number(getComputedStyle(el).opacity) > 0.5; };
    const sample = () => {
        const host = rec.host && document.getElementById(rec.host);
        rec.frames.push({ t: performance.timeOrigin + performance.now(), reus: up(), pending: Boolean(host && host.hasAttribute("data-v10-pending")), shown: Boolean(host && !host.classList.contains("hidden")) });
        if(rec.running) rec.raf = requestAnimationFrame(sample);
    };
    rec.start = host => { rec.host = host; rec.frames = []; rec.running = true; rec.t0 = performance.timeOrigin + performance.now(); rec.raf = requestAnimationFrame(sample); return rec.t0; };
    rec.stop = () => { rec.running = false; cancelAnimationFrame(rec.raf); return rec.frames; };
    window.__cmsTransitionRecorder = rec;
})();`;

async function prepareJourney(page, journey){
    if(!journey.fixture) return;
    const snapshot = showdownFixture[journey.fixture];
    await page.evaluate(async ({ snapshot, rivalry, storage }) => {
        await window.ensureGameplayModules();
        const names0 = ["CareerModeOnlinePlayerIdentity", "CareerModePersistentNikDanielPair", "CareerModeProductionSharedMultiSeasonProgression", "CareerModeProductionSharedHistoryConvergence", "CareerModeProductionSharedFinalReconciliation", "CareerModeProductionSharedTerminalClose", "CareerModeProductionSharedSeasonResults"];
        if(!window.__cmsFixtureSaved){
            window.__cmsFixtureSaved = { globals: names0.map(name => [name, name in window, window[name]]), storage: Object.keys(storage).map(key => [key, localStorage.getItem(key)]), showdown: currentShowdown };
        }
        for(const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        const names = { identity: "CareerModeOnlinePlayerIdentity", pair: "CareerModePersistentNikDanielPair", multiSeason: "CareerModeProductionSharedMultiSeasonProgression", history: "CareerModeProductionSharedHistoryConvergence", finalReconciliation: "CareerModeProductionSharedFinalReconciliation", terminalClose: "CareerModeProductionSharedTerminalClose", seasonResults: "CareerModeProductionSharedSeasonResults" };
        for(const [key, name] of Object.entries(names)) window[name] = { getState: () => snapshot[key] };
        currentShowdown = normalizeShowdown(JSON.parse(localStorage.getItem("careerModeShowdown.activeShowdown")));
        window.__cmsRivalryFixture = rivalry;
        window.__cmsOpenReadyResults = () => {
            window.openSeasonEntry();
            for(const [prefix, result] of [["p1", snapshot.seasonResults.ownResult], ["p2", snapshot.seasonResults.opponentResult]]){
                for(const [field, value] of Object.entries(result)){
                    const input = document.getElementById(prefix + field[0].toUpperCase() + field.slice(1));
                    if(!input) throw new Error(`Missing real results field: ${prefix} ${field}`);
                    if(input.type === "checkbox") input.checked = value; else input.value = String(value);
                }
            }
            window.completeCurrentSeason();
        };
        window.CareerModeV10Screens.invalidate("seasonEntry");
    }, { snapshot, rivalry: activeAdapter.rivalryView(snapshot), storage: showdownFixture.storage });
}
async function releaseJourney(page, journey){
    if(!journey.fixture) return;
    await page.evaluate(() => {
        const saved = window.__cmsFixtureSaved;
        if(!saved) return;
        for(const [name, had, value] of saved.globals){ if(had) window[name] = value; else delete window[name]; }
        for(const [key, value] of saved.storage){ if(value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); }
        currentShowdown = saved.showdown;
        delete window.__cmsFixtureSaved; delete window.__cmsRivalryFixture; delete window.__cmsOpenReadyResults;
        window.CareerModeV10Screens.invalidate("seasonEntry");
    });
}
async function waitForHome(page){
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu") && window.getActiveScreenName() === "mainMenu" && !document.getElementById("mainMenu").hasAttribute("data-v10-pending"), null, { timeout: 30000 });
    await page.waitForTimeout(400);
}

// Mean luma (0-255) of each screencast frame, decoded in a scratch page (no image library needed).
async function lumas(decoder, frames){
    return decoder.evaluate(async list => Promise.all(list.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = () => { const c = document.createElement("canvas"); c.width = 48; c.height = 48; const g = c.getContext("2d"); g.drawImage(img, 0, 0, 48, 48); const d = g.getImageData(0, 0, 48, 48).data; let s = 0; for(let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; resolve(s / (d.length / 4)); };
        img.onerror = () => resolve(-1);
        img.src = "data:image/jpeg;base64," + src;
    }))), frames);
}

async function measure(page, cdp, decoder, host, run){
    const shots = [];
    const onFrame = async ({ data, metadata, sessionId }) => { shots.push({ t: metadata.timestamp * 1000, data }); try{ await cdp.send("Page.screencastFrameAck", { sessionId }); }catch(_){} };
    cdp.on("Page.screencastFrame", onFrame);
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 30, maxWidth: 360, maxHeight: 360, everyNthFrame: 1 });
    await page.waitForTimeout(150);
    const t0 = await page.evaluate(h => window.__cmsTransitionRecorder.start(h), host);
    await run();
    await page.waitForFunction(h => { const el = document.getElementById(h); return el && !el.classList.contains("hidden") && !el.hasAttribute("data-v10-pending"); }, host, { timeout: 20000 }).catch(() => null);
    await page.waitForTimeout(SETTLE_MS);
    const frames = await page.evaluate(() => window.__cmsTransitionRecorder.stop());
    await cdp.send("Page.stopScreencast");
    cdp.off("Page.screencastFrame", onFrame);
    const lum = await lumas(decoder, shots.map(s => s.data));
    const at = t => { let f = null; for(const x of frames){ if(x.t <= t) f = x; else break; } return f; };
    const timeline = shots.map((s, i) => ({ t: s.t - t0, luma: lum[i], reus: Boolean(at(s.t)?.reus) })).filter(s => s.t >= 0);
    const ready = (() => { const f = frames.find(x => x.shown && !x.pending); return f ? Math.round(f.t - t0) : null; })();
    // Longest stretch of near-black frames with Reus not up. A stretch ends at the next frame that is not dark.
    let dark = 0, start = null;
    for(const s of timeline){
        const isDark = s.luma >= 0 && s.luma < DARK_LUMA && !s.reus;
        if(isDark && start === null) start = s.t;
        if(!isDark && start !== null){ dark = Math.max(dark, s.t - start); start = null; }
    }
    if(start !== null && timeline.length) dark = Math.max(dark, timeline[timeline.length - 1].t - start);
    const reusFrames = frames.filter(x => x.reus);
    const reus = reusFrames.length ? Math.round(reusFrames[reusFrames.length - 1].t - reusFrames[0].t) : 0;
    const strip = timeline.map(s => `${Math.round(s.t)}:${Math.round(s.luma)}${s.reus ? "R" : ""}`).join(" ");
    return { ready, dark: Math.round(dark), reus, strip };
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    const decoderContext = await browser.newContext();
    const decoder = await decoderContext.newPage();
    const out = [];
    let failed = 0;
    try{
        for(const vp of viewports){
            const context = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile === true, hasTouch: vp.hasTouch === true, reducedMotion: "no-preference" });
            await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", error => errors.push(error.message));
            await page.addInitScript(RECORDER);
            const cdp = await context.newCDPSession(page);
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
            await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
            await waitForHome(page);
            for(const journey of journeys){
                // First visit (files cold) and a return visit (files warm), each followed by the way back Home.
                for(const visit of ["first", "again"]){
                    await prepareJourney(page, journey);
                    const go = await measure(page, cdp, decoder, journey.host, () => page.evaluate(journey.open));
                    const back = await measure(page, cdp, decoder, "mainMenu", () => page.evaluate(() => window.navigateTo("mainMenu")));
                    await releaseJourney(page, journey);
                    await waitForHome(page);
                    for(const [dir, m] of [["Home→" + journey.name, go], [journey.name + "→Home", back]]){
                        const bad = m.dark > DARK_MS;
                        if(bad) failed++;
                        out.push({ viewport: vp.name, visit, change: dir, ...m });
                        console.log(`${bad ? "FAIL" : "ok  "} ${vp.name.padEnd(16)} ${visit.padEnd(5)} ${dir.padEnd(26)} ready=${String(m.ready).padStart(5)}ms dark=${String(m.dark).padStart(4)}ms reus=${String(m.reus).padStart(4)}ms`);
                        if(bad || process.env.CMS_TRANSITION_STRIPS) console.log(`      ${m.strip}`);
                    }
                }
            }
            if(errors.length){ failed++; console.log(`FAIL ${vp.name} page errors: ${errors.join(" | ")}`); }
            await context.close();
        }
    }finally{
        await browser.close();
    }
    if(report) fs.writeFileSync(path.resolve(report), JSON.stringify({ baseUrl: baseUrl.href, cpu: CPU, darkMs: DARK_MS, results: out }, null, 2));
    console.log(`r87 transition speed audit: ${failed ? "FAIL" : "PASS"}`);
    process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
