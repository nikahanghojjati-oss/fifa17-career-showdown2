"use strict";
// Phoenix 3.0 pre-freeze hunt H1 (B3, 2026-11-27). Nik: History never looks stuck, broken or stale; it shows the current truth
// or an honest loading state. In a real browser (phone 390x844 and desktop 1920x866), with the career read slowed:
//   F1 right after a page load, opening History never puts "Career history is unavailable right now ..." on the History
//      screen while the career is still being read (H1 saw it in view for the length of the read, ~150-770 ms; here it is on
//      the shown screen, a role="status" message a screen reader announces, under the loading cover).
//   F2 the first History open after a Showdown ends never shows the frame drawn before the close ("No finished Showdowns yet")
//      in view; it shows loading (or stays covered) until the read lands, then the finished Showdown.
//   HL4 a Team V History file that hangs never leaves History on loading for good: unavailable after the 15 s deadline, and
//      History still draws once the file arrives.
//   HL5 a slow cold career that keeps progressing past 15 s: once Team V's History takes the screen it is never replaced by
//      "unavailable", and it ends on the career.
// The account, pair and career reader are page stubs (no Firebase; every request off the local origin is aborted); History's
// own code (js/legacy.js, js/rivalryLegacyV10.js, js/v10Screens.js, Team V's frame) runs for real. "In view" = #legacy shown,
// not pending (js/v10Screens.js data-v10-pending hides it) and the loading cover (#loadingScreen) down. Sampled every frame.
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const History = require("../../js/sharedHistoryConvergence.js");
const Career = require("../../js/sharedCareerAnalytics.js");
const { score, winner, result, finalFor } = require("../support/career-fixture-helpers.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const READ_MS = Number(process.env.CMS_HISTORY_READ_MS || 900);
const R = "pair_" + "1".padStart(64, "0");

function projection(rivalryId){
    const hash = n => "sha256:" + String(n).padStart(64, "0");
    const seasons = [0, 1, 2].map(s => [result({ leaguePosition: 1 + s, leaguePoints: 80 - s }), result({ leaguePosition: 2, leaguePoints: 74 + s, domesticCup: s === 1 })]);
    return History.buildProjection({ rivalryId, setup: { phase: "SHOWDOWN_CONFIRMED", revision: 6, coordinatorRole: "playerOne", totalSeasons: 3, leagueId: "premier_league", clubs: { playerOne: "club_a", playerTwo: "club_b" } },
        managerSlots: [{ slotId: "playerOne", accountId: "acct_daniel", profileId: "profile_" + "a".repeat(24), saveId: "save_" + "a".repeat(24), entitlementState: "active" }, { slotId: "playerTwo", accountId: "acct_nik", profileId: "profile_" + "b".repeat(24), saveId: "save_" + "b".repeat(24), entitlementState: "active" }],
        seasons: seasons.map(([p1, p2], k) => { const n = k + 1, h = hash(n); return { commit: { ok: true, committed: true, phase: "ACKNOWLEDGED", revision: 3, resultsRevision: 2, resultsContentHash: h, seasonNumber: n, results: { playerOne: p1, playerTwo: p2 } }, scoring: { ok: true, authoritative: true, phase: "SCORING_RECONCILED", revision: 1, seasonCommitRevision: 3, resultsRevision: 2, resultsContentHash: h, seasonNumber: n, scoring: { playerOne: score(p1), playerTwo: score(p2) }, winner: winner(p1, p2) } }; }) });
}
const p = projection(R);
const FINISHED = Career.buildCareerModel({ indexStatus: "ready", showdowns: [{ rivalryId: R, classification: "completed", projection: p, final: finalFor(p) }] });
const EMPTY = Career.buildCareerModel({ indexStatus: "ready", showdowns: [] });

const SIZES = [
    { name: "phone-390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
    { name: "desktop-1920x866", viewport: { width: 1920, height: 866 }, deviceScaleFactor: 1 }
];

// Page stubs: a signed-in Nik whose pair names Showdown R live (before) or closed (after); the career reader answers after READ_MS.
function installStubs({ empty, finished, readMs, rivalryId }){
    const w = window;
    w.__h1 = { phase: "live", reads: 0, model: empty, frames: [] };
    const freeze = Object.freeze;
    w.CareerModeSparkConnectedAccount = freeze({ getState: () => freeze({ connected: true, accountId: "acct_nik" }), subscribe: () => () => {} });
    w.CareerModeOnlinePlayerIdentity = freeze({ getState: () => freeze({ registered: true, managerId: "nik", status: "online" }), subscribe: () => () => {} });
    w.CareerModePersistentNikDanielPair = freeze({ getState: () => w.__h1.phase === "live" ? freeze({ status: "paired", rivalryId, connectionState: "active", closedRivalryId: null }) : freeze({ status: "unpaired", rivalryId: null, connectionState: null, closedRivalryId: rivalryId }), subscribe: () => () => {} });
    w.CareerModeProductionFirebaseRuntime = freeze({ ensureAccountServices: async () => ({ ok: true, auth: { currentUser: { uid: "acct_nik" } }, firestore: {}, firestoreSdk: { getDoc: async () => null } }), firebaseFirestoreModule: "about:blank" });
    w.CareerModeCareerStartMarker = freeze({ epoch: () => 0, readMarker: async () => ({ status: "ready" }), careerHiddenRivalryIds: async () => [], hiddenRivalryIds: () => [] });
    w.CareerModeSparkClosedShowdownCareerLoader = freeze({ forgetUnavailableShowdown(){},
        loadClosedShowdownCareer: async (args = {}) => { w.__h1.reads += 1;
            // HL5: a long cold career that keeps progressing (one Showdown read every stepMs), as the real reader reports it.
            const slow = w.__h1.slowRead;
            if(slow){ for(let done = 1; done <= slow.total; done++){ await new Promise(r => setTimeout(r, slow.stepMs)); args.onProgress?.({ done, total: slow.total }); } }
            else await new Promise(r => setTimeout(r, readMs));
            return { model: w.__h1.phase === "live" ? empty : finished, careerInput: { indexStatus: "ready", showdowns: [] } }; } });
}
// Every frame while History is open: what is in view.
function startSampler(){
    const w = window, out = w.__h1.frames = [];
    let stop = false; w.__h1.stop = () => { stop = true; };
    const tick = () => {
        if(stop) return;
        const host = document.getElementById("legacy"), gate = document.getElementById("loadingScreen");
        const gateUp = Boolean(gate && !gate.hidden && !gate.classList.contains("hidden") && getComputedStyle(gate).display !== "none");
        const shown = Boolean(host && !host.hidden && !host.classList.contains("hidden") && getComputedStyle(host).display !== "none" && getComputedStyle(host).visibility !== "hidden");
        const pending = Boolean(host && host.hasAttribute("data-v10-pending"));
        const text = shown ? (host.innerText || "").replace(/\s+/g, " ").trim() : "";
        const teamV = Boolean(host && host.dataset.rivalryLegacyV10 === "1" && host.querySelector(".legacyV10Screen"));
        out.push({ t: Math.round(performance.now()), shown, teamV, inView: shown && !pending && !gateUp, text: text.slice(0, 240) });
        requestAnimationFrame(tick);
    };
    tick();
}

const LATENCY_MS = Number(process.env.CMS_HISTORY_LATENCY_MS || 600);
async function run(browser, size){
    const context = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, isMobile: size.isMobile, hasTouch: size.hasTouch, serviceWorkers: "block" });
    await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(baseUrl.href, { waitUntil: "load" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu"), null, { timeout: 30000 });
    await page.evaluate(installStubs, { empty: EMPTY, finished: FINISHED, readMs: READ_MS, rivalryId: R });
    // A slow link (as in the H1 long games, 600 ms a request) while History opens: its own files arrive late too.
    const cdp = await context.newCDPSession(page);
    const slow = on => cdp.send("Network.emulateNetworkConditions", { offline: false, latency: on ? LATENCY_MS : 0, downloadThroughput: -1, uploadThroughput: -1 });
    await cdp.send("Network.enable");await slow(true);
    const problems = [];
    const openHistory = async (label, done) => {
        await page.evaluate(startSampler);
        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.waitForFunction(done, null, { timeout: 25000 }).catch(() => problems.push(`${label}: History never showed its career`));
        await page.waitForTimeout(400);
        const frames = await page.evaluate(() => { window.__h1.stop(); return window.__h1.frames; });
        const reads = await page.evaluate(() => window.__h1.reads);
        return { frames, reads };
    };
    // F1: the first open after the page load (Showdown R live, no finished Showdown yet).
    const first = await openHistory("first open", () => { const h = document.getElementById("legacy"); return h && !h.hasAttribute("data-v10-pending") && window.CareerModeV10Screens.isMounted("legacy") && /No finished Showdowns yet/.test(h.innerText); });
    // F1 counts the screen shown at all, covered or not: the seam's message is a role="status" live region, so a screen
    // reader announces "unavailable" even under the loading cover, and on a slow link the cover can end first (H1 saw it).
    const unavailable = first.frames.filter(f => f.shown && /Career history is unavailable|could not be loaded/i.test(f.text));
    if(unavailable.length) problems.push(`F1: "unavailable" on the History screen for ${unavailable.length} frame(s) (${unavailable.filter(f => f.inView).length} in view) while the career was read: "${unavailable[0].text.slice(0, 120)}"`);
    const firstFinal = first.frames.filter(f => f.inView).at(-1);
    if(!firstFinal || !/No finished Showdowns yet/.test(firstFinal.text)) problems.push(`first open did not end on "No finished Showdowns yet": ${JSON.stringify(firstFinal)}`);
    const readsFirst = first.reads;
    // Home, then the Showdown ends (the pair now names R closed), then History again.
    await slow(false);
    await page.evaluate(async () => { await window.navigateTo("mainMenu"); window.__h1.phase = "closed"; });
    await page.waitForFunction(() => { const h = document.getElementById("mainMenu"); return h && !h.classList.contains("hidden") && !h.hasAttribute("data-v10-pending"); }, null, { timeout: 15000 });
    const after = await openHistory("open after the close", () => { const h = document.getElementById("legacy"); return h && !h.hasAttribute("data-v10-pending") && window.CareerModeV10Screens.isMounted("legacy") && Boolean(h.querySelector(".legacyCard")); });
    const stale = after.frames.filter(f => f.inView && /No finished Showdowns yet/.test(f.text));
    if(stale.length) problems.push(`F2: the frame from before the close ("No finished Showdowns yet") in view for ${stale.length} frame(s) after the Showdown ended`);
    const afterUnavailable = after.frames.filter(f => f.inView && /Career history is unavailable|could not be loaded/i.test(f.text));
    if(afterUnavailable.length) problems.push(`F2: "unavailable" in view for ${afterUnavailable.length} frame(s) after the close`);
    const afterFinal = after.frames.filter(f => f.inView).at(-1);
    const cards = await page.evaluate(() => document.querySelectorAll("#legacy .legacyCard").length);
    if(!cards) problems.push(`after the close History never listed the finished Showdown: ${JSON.stringify(afterFinal)}`);
    // Reads: one career read per open, as before (none added).
    if(readsFirst !== 1 || after.reads - readsFirst !== 1) problems.push(`career reads: ${readsFirst} on the first open, ${after.reads - readsFirst} after the close (want 1 and 1)`);
    if(errors.length) problems.push(`page errors: ${errors.join(" | ")}`);
    const seen = frames => [...new Set(frames.filter(f => f.inView).map(f => f.text.replace(/\d+/g, "#").slice(0, 60)))].join(" -> ");
    console.log(`${problems.length ? "FAIL" : "ok  "} ${size.name}: first open [${seen(first.frames)}]; after the close [${seen(after.frames)}]; reads ${readsFirst}+${after.reads - readsFirst}`);
    problems.forEach(x => console.log(`  - ${x}`));
    await context.close();
    return problems.length;
}

// Verify follow-up (HL4): Team V History's own file fetch hangs (a half-up link; prepare's fetch has no deadline), so the hand-over
// never settles. History must not say loading for good: past its 15 s deadline the shown screen says unavailable, and once the
// file arrives after all, History still draws. One size is enough (the deadline is not about layout).
const HANG_FILE = /\/visual-assets\/v10_1\/legacy\/strings\.json(\?|$)/;
async function runHang(browser, size){
    const context = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, isMobile: size.isMobile, hasTouch: size.hasTouch, serviceWorkers: "block" });
    const held = [];
    await context.route("**/*", route => {
        const url = new URL(route.request().url());
        if(url.origin !== baseUrl.origin) return route.abort();
        if(HANG_FILE.test(url.pathname + url.search) && !context.__released){ held.push(route); return; }
        return route.continue();
    });
    const page = await context.newPage(), errors = [], problems = [];
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(baseUrl.href, { waitUntil: "load" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu"), null, { timeout: 30000 });
    await page.evaluate(installStubs, { empty: EMPTY, finished: FINISHED, readMs: READ_MS, rivalryId: R });
    await page.evaluate(startSampler);
    const opened = await page.evaluate(() => { window.openOptionalModule("legacy"); return performance.now(); });
    await page.waitForTimeout(HANG_WAIT_MS);
    const frames = await page.evaluate(() => { window.__h1.stop(); return window.__h1.frames; });
    if(!held.length) problems.push("the History file was never asked for (the hang was not set up)");
    const early = frames.filter(f => f.shown && f.t - opened < 14000 && /Career history is unavailable|could not be loaded/i.test(f.text));
    if(early.length) problems.push(`"unavailable" before History's deadline for ${early.length} frame(s)`);
    const last = frames.filter(f => f.shown).at(-1);
    if(!last || !/Career history is unavailable/i.test(last.text)) problems.push(`HL4: ${HANG_WAIT_MS / 1000} s into a hung hand-over the History screen still says "${last ? last.text.slice(0, 80) : "(not shown)"}", not unavailable (loading for good)`);
    // The file arrives after all: History still draws.
    context.__released = true; held.splice(0).forEach(route => route.continue().catch(() => {}));
    await page.waitForFunction(() => { const h = document.getElementById("legacy"); return h && window.CareerModeV10Screens.isMounted("legacy") && /No finished Showdowns yet/.test(h.innerText); }, null, { timeout: 20000 })
        .catch(() => problems.push("HL4: after the file arrived late, History never drew"));
    if(errors.length) problems.push(`page errors: ${errors.join(" | ")}`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${size.name} hung History file: at ${HANG_WAIT_MS / 1000} s "${last ? last.text.slice(0, 60) : ""}"; late file -> History drew: ${!problems.some(x => /never drew/.test(x))}`);
    problems.forEach(x => console.log(`  - ${x}`));
    await context.close();
    return problems.length;
}
const HANG_WAIT_MS = 17000;

// HL5 (Codex P2 on 3b4f2aff): a slow cold career that keeps progressing past 15 s. Team V's History takes the screen (its loading
// frame with "n of N") and must never be replaced by History's own box saying unavailable; it ends on the career.
const SLOW_READ = { total: 12, stepMs: 2000 };
async function runSlowRead(browser, size){
    const context = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, isMobile: size.isMobile, hasTouch: size.hasTouch, serviceWorkers: "block" });
    await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [], problems = [];
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(baseUrl.href, { waitUntil: "load" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu"), null, { timeout: 30000 });
    await page.evaluate(installStubs, { empty: EMPTY, finished: FINISHED, readMs: READ_MS, rivalryId: R });
    await page.evaluate(slow => { window.__h1.slowRead = slow; }, SLOW_READ);
    await page.evaluate(startSampler);
    const opened = await page.evaluate(() => { window.openOptionalModule("legacy"); return performance.now(); });
    const readMs = SLOW_READ.total * SLOW_READ.stepMs;
    await page.waitForFunction(() => { const h = document.getElementById("legacy"); return h && !h.hasAttribute("data-v10-pending") && window.CareerModeV10Screens.isMounted("legacy") && /No finished Showdowns yet/.test(h.innerText); }, null, { timeout: readMs + 15000 })
        .catch(() => problems.push(`HL5: History never drew its career after a ${readMs / 1000} s read that kept progressing`));
    await page.waitForTimeout(400);
    const frames = await page.evaluate(() => { window.__h1.stop(); return window.__h1.frames; });
    const reads = await page.evaluate(() => window.__h1.reads);
    const unavailable = frames.filter(f => f.shown && /Career history is unavailable|could not be loaded/i.test(f.text));
    if(unavailable.length) problems.push(`HL5: "unavailable" on the History screen for ${unavailable.length} frame(s) (first at ${Math.round((unavailable[0].t - opened) / 100) / 10} s) while the read kept progressing`);
    const firstTeamV = frames.findIndex(f => f.teamV);
    const replaced = firstTeamV < 0 ? [] : frames.slice(firstTeamV).filter(f => f.shown && !f.teamV);
    if(firstTeamV < 0) problems.push("HL5: Team V's History never took the screen");
    if(replaced.length) problems.push(`HL5: Team V's History was replaced for ${replaced.length} frame(s) after it drew`);
    const longest = frames.filter(f => f.shown).at(-1);
    if(reads !== 1) problems.push(`HL5: ${reads} career reads (want 1)`);
    if(errors.length) problems.push(`page errors: ${errors.join(" | ")}`);
    const tv = firstTeamV < 0 ? null : Math.round((frames[firstTeamV].t - opened) / 100) / 10;
    console.log(`${problems.length ? "FAIL" : "ok  "} ${size.name} slow read ${readMs / 1000} s with progress: Team V drew at ${tv} s, ended "${longest ? longest.text.replace(/\d+/g, "#").slice(0, 60) : ""}"; reads ${reads}`);
    problems.forEach(x => console.log(`  - ${x}`));
    await context.close();
    return problems.length;
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    let failed = 0;
    try { for(const size of SIZES) failed += await run(browser, size); failed += await runHang(browser, SIZES[0]); failed += await runSlowRead(browser, SIZES[0]); }
    finally { await browser.close(); }
    console.log(`History honest loading audit: ${failed ? "FAIL" : "PASS"}`);
    process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
