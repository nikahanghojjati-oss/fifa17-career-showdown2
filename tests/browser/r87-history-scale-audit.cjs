"use strict";
// r87 (Nik 2026-10-31: "moving through hundreds of Showdowns in History and career screens must be fast"):
// opens History on a career of CMS_HISTORY_COUNT (default 300) completed 10-season Showdowns at desktop and phone,
// with 4x CPU throttle, and measures: time to reveal, DOM size, and each page / card step. Read-only verified models,
// no Firebase, every request off the local origin is aborted.
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const History = require("../../js/sharedHistoryConvergence.js");
const Career = require("../../js/sharedCareerAnalytics.js");
const { score, winner, result, finalFor } = require("../support/career-fixture-helpers.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const COUNT = Number(process.env.CMS_HISTORY_COUNT || 300);
const CPU = Number(process.env.CMS_HISTORY_CPU || 4);
const LIMITS = { revealMs: Number(process.env.CMS_HISTORY_REVEAL_MS || 2000), stepMs: Number(process.env.CMS_HISTORY_STEP_MS || 250), nodes: 6000 };
const LEAGUES = ["premier_league", "laliga", "bundesliga", "serie_a", "ligue_1"];

function projection(i){
    const rivalryId = "pair_" + i.toString(16).padStart(64, "0");
    const hash = n => "sha256:" + String(n).padStart(64, "0");
    const seasons = Array.from({ length: 10 }, (_, s) => [
        result({ leaguePosition: 1 + ((i + s) % 4), leaguePoints: 70 + ((i * 7 + s) % 35), championsLeague: (i + s) % 5 === 0 }),
        result({ leaguePosition: 1 + ((i + 2 * s) % 4), leaguePoints: 72 + ((i * 3 + s) % 31), domesticCup: (i + s) % 3 === 0 })
    ]);
    return History.buildProjection({ rivalryId, setup: { phase: "SHOWDOWN_CONFIRMED", revision: 6, coordinatorRole: "playerOne", totalSeasons: 10, leagueId: LEAGUES[i % LEAGUES.length], clubs: { playerOne: "club_a", playerTwo: "club_b" } },
        managerSlots: [{ slotId: "playerOne", accountId: "acct_daniel", profileId: "profile_" + "a".repeat(24), saveId: "save_" + "a".repeat(24), entitlementState: "active" }, { slotId: "playerTwo", accountId: "acct_nik", profileId: "profile_" + "b".repeat(24), saveId: "save_" + "b".repeat(24), entitlementState: "active" }],
        seasons: seasons.map(([p1, p2], k) => { const n = k + 1, h = hash(n); return { commit: { ok: true, committed: true, phase: "ACKNOWLEDGED", revision: 3, resultsRevision: 2, resultsContentHash: h, seasonNumber: n, results: { playerOne: p1, playerTwo: p2 } }, scoring: { ok: true, authoritative: true, phase: "SCORING_RECONCILED", revision: 1, seasonCommitRevision: 3, resultsRevision: 2, resultsContentHash: h, seasonNumber: n, scoring: { playerOne: score(p1), playerTwo: score(p2) }, winner: winner(p1, p2) } }; }) });
}
const career = Career.buildCareerModel({ indexStatus: "ready", showdowns: Array.from({ length: COUNT }, (_, i) => { const p = projection(i + 1); return { rivalryId: p.rivalryId, classification: "completed", projection: p, final: finalFor(p) }; }) });

const SIZES = [
    { name: "desktop-1440x900", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    { name: "phone-390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
];

async function run(browser, size){
    const context = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, isMobile: size.isMobile, hasTouch: size.hasTouch, serviceWorkers: "block" });
    await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(baseUrl.href, { waitUntil: "load" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu"), null, { timeout: 30000 });
    // Warm the History files once (Team V CSS/JS/plates), so the measured open is a return visit like a real session.
    await page.evaluate(async model => {
        await window.ensureGameplayModules();
        await loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam));
        window.__cmsHistoryModel = model;
    }, career);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await page.evaluate(() => {
        window.__lt = [];
        try { new PerformanceObserver(list => { for(const e of list.getEntries()) window.__lt.push(e.duration); }).observe({ type: "longtask", buffered: false }); } catch(_){}
    });
    const reveal = await page.evaluate(async () => {
        const t0 = performance.now();
        await window.openOptionalModule("legacy");
        window.renderLegacy({ model: window.__cmsHistoryModel });
        await new Promise((resolve, reject) => {
            const end = performance.now() + 20000;
            const tick = () => {
                const host = document.getElementById("legacy");
                if(host && !host.hasAttribute("data-v10-pending") && window.CareerModeV10Screens.isMounted("legacy") && host.querySelector(".legacyCard")) return resolve();
                if(performance.now() > end) return reject(new Error("History did not reveal"));
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - t0);
    });
    const info = await page.evaluate(() => {
        const host = document.getElementById("legacy");
        return { nodes: host.querySelectorAll("*").length, cards: host.querySelectorAll(".legacyCard").length, svgs: host.querySelectorAll("svg").length, dots: host.querySelectorAll(".legacyPageDot").length, longTasks: window.__lt.map(Math.round), first: host.querySelector(".legacyCard")?.dataset.showdown };
    });
    // Step through 20 pages (desktop) / 20 cards (phone) with the pager's › arrow; each step is timed to the next frame.
    const steps = await page.evaluate(async () => {
        const out = [];
        for(let i = 0; i < 20; i++){
            let next = document.querySelector('#legacyPager [data-direction="1"]');
            if(!next || next.disabled) next = document.querySelector('#legacyPager [data-direction="-1"]');
            if(!next || next.disabled) break;
            const t0 = performance.now();
            next.click();
            await new Promise(r => requestAnimationFrame(() => r()));
            out.push(Math.round(performance.now() - t0));
            await new Promise(r => setTimeout(r, 30));
        }
        return out;
    });
    // Leave History for Home and time the return.
    const leave = await page.evaluate(async () => {
        const t0 = performance.now();
        await window.navigateTo("mainMenu");
        await new Promise(r => { const tick = () => { const h = document.getElementById("mainMenu"); if(h && !h.classList.contains("hidden") && !h.hasAttribute("data-v10-pending")) r(); else requestAnimationFrame(tick); }; tick(); });
        return Math.round(performance.now() - t0);
    });
    await context.close();
    const worstStep = steps.length ? Math.max(...steps) : 0;
    const problems = [];
    if(reveal > LIMITS.revealMs) problems.push(`History took ${reveal} ms to reveal (limit ${LIMITS.revealMs})`);
    if(info.nodes > LIMITS.nodes) problems.push(`History holds ${info.nodes} elements (limit ${LIMITS.nodes})`);
    if(worstStep > LIMITS.stepMs) problems.push(`slowest page step ${worstStep} ms (limit ${LIMITS.stepMs})`);
    if(errors.length) problems.push(`page errors: ${errors.join(" | ")}`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${size.name} ${COUNT} Showdowns: reveal=${reveal}ms nodes=${info.nodes} cards=${info.cards} svgs=${info.svgs} dots=${info.dots} first=#${info.first} longTasks=[${info.longTasks.join(",")}] steps=[${steps.join(",")}] leave=${leave}ms`);
    problems.forEach(p => console.log(`  - ${p}`));
    return problems.length;
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    let failed = 0;
    try { for(const size of SIZES) failed += await run(browser, size); }
    finally { await browser.close(); }
    console.log(`r87 History scale audit: ${failed ? "FAIL" : "PASS"}`);
    process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
