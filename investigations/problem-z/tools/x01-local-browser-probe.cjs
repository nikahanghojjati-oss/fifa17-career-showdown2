"use strict";
// Studio Z research-only X-01 browser probe. NOT a game fix or a production test.
// Prepared 2026-10-08 for Team G Lead; intentionally NOT EXECUTED by the author.
// Run ONLY against a locally served, disposable, unchanged repository checkout.
// Terminal 1: npm run serve:test
// Terminal 2: CMS_CHROMIUM_MULTI_CONTEXT=1 node investigations/problem-z/tools/x01-local-browser-probe.cjs
// Prerequisites: Node >=24, npm dev dependencies installed, permitted local Chromium.
// Outputs synthetic/non-sensitive startup flags only. No OAuth, Firebase or external requests.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../../../tests/support/chromium-runtime.cjs");

const source = process.env.CMS_BASE_URL || "http://127.0.0.1:4173/";
const base = new URL(source);
const permittedHost = base.hostname === "127.0.0.1" || base.hostname === "localhost";
if (base.protocol !== "http:" || !permittedHost || base.pathname !== "/" ||
    base.username || base.password || base.search || base.hash) {
    throw new Error("X-01 refuses non-loopback, non-root or authenticated URLs.");
}
const delayMs = 400;
const scenarios = [
    { id: "baseline", target: null },
    { id: "delay-optional-module", target: "/js/optionalModules.js" },
    { id: "delay-unrelated-app-script", target: "/js/app.js" }
];
const output = process.env.CMS_Z_X01_OUTPUT ||
    path.join(os.tmpdir(), "studio-z-x01-" + Date.now() + ".json");

async function sample(page) {
    return page.evaluate(() => {
        const identity = window.CareerModeOnlinePlayerIdentity;
        let state = null;
        try { state = identity && identity.getState && identity.getState(); }
        catch (_) { /* Preserve only the fact that identity state is unavailable. */ }
        const relevant = performance.getEntriesByType("resource")
            .filter(e => /\/js\/(showdown|optionalModules|app|onlinePlayerIdentity)\.js/.test(e.name))
            .map(e => ({
                path: new URL(e.name).pathname,
                fetchStartMs: Math.round(e.fetchStart),
                responseEndMs: Math.round(e.responseEnd),
                durationMs: Math.round(e.duration)
            }));
        return {
            clockMs: Math.round(performance.now()),
            readyState: document.readyState,
            startupLatch: window.__cmsOnlinePlayerEntryBootstrap === true,
            loaderDefined: typeof window.loadRuntimeScript === "function",
            identityModuleAvailable: Boolean(identity),
            identityInitialized: state ? state.initialized === true : null,
            identityStatus: state ? String(state.status || "unknown") : null,
            identityBadgePresent: Boolean(document.getElementById("onlinePlayerIdentityBadge")),
            identityOverlayPresent: Boolean(document.getElementById("onlinePlayerIdentityOverlay")),
            currentScreen: typeof window.getActiveScreenName === "function"
                ? String(window.getActiveScreenName() || "") : null,
            resources: relevant
        };
    });
}

async function runOne(browser, scenario) {
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 },
        serviceWorkers: "block",
        acceptDownloads: false
    });
    const entry = {
        id: scenario.id,
        delayTarget: scenario.target,
        delayMs: scenario.target ? delayMs : 0,
        sameOriginOnly: true,
        blockedExternalRequestCount: 0,
        expectedDelayIntercepts: 0,
        pageErrorCount: 0,
        checkpoints: [],
        navigationError: null
    };
    try {
        await context.route("**/*", async route => {
            let u;
            try { u = new URL(route.request().url()); }
            catch (_) { return route.abort(); }
            if (u.origin !== base.origin) {
                entry.blockedExternalRequestCount += 1;
                return route.abort();
            }
            if (scenario.target && u.pathname === scenario.target) {
                entry.expectedDelayIntercepts += 1;
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            return route.continue();
        });
        const page = await context.newPage();
        page.on("pageerror", () => { entry.pageErrorCount += 1; });
        await page.addInitScript(() => {
            window.__studioZReadinessTrace = [];
            const trace = label => window.__studioZReadinessTrace.push({
                event: label,
                atMs: Math.round(performance.now()),
                readyState: document.readyState,
                loaderDefined: typeof window.loadRuntimeScript === "function",
                latch: window.__cmsOnlinePlayerEntryBootstrap === true
            });
            document.addEventListener("readystatechange", () => trace("readystatechange"));
            document.addEventListener("DOMContentLoaded", () => trace("domcontentloaded"));
        });
        await page.goto(base.href, { waitUntil: "domcontentloaded", timeout: 25000 });
        entry.checkpoints.push(await sample(page));
        await page.waitForTimeout(200);
        entry.checkpoints.push(await sample(page));
        await page.waitForTimeout(1400);
        entry.checkpoints.push(await sample(page));
        entry.lifecycle = await page.evaluate(() => window.__studioZReadinessTrace || []);
    } catch (error) {
        entry.navigationError = error && error.name ? String(error.name) : "UnknownError";
        entry.navigationFailed = true;
    } finally {
        await context.close();
    }
    return entry;
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({
        executablePath: runtime.executablePath,
        headless: true,
        args: runtime.args
    });
    const results = [];
    try {
        for (const scenario of scenarios) results.push(await runOne(browser, scenario));
    } finally {
        await browser.close();
    }
    const report = {
        title: "Studio Z X-01 three-condition LOCAL startup timing observation",
        testExecutionOwner: "Team G operator, not the research author",
        executedAt: new Date().toISOString(),
        fixedDelayMs: delayMs,
        localOrigin: base.origin,
        pinnedSourceVerification: "OPERATOR MUST SUPPLY exact current git SHA separately",
        interpretationLimit: "External runtime resources intentionally blocked; no OAuth/provider/physical device proof.",
        cases: results
    };
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    process.stdout.write("X-01 observational report saved: " + output + "\n");
    for (const item of results) process.stdout.write(item.id + ": " +
        (item.navigationError || "observations captured") + "\n");
    if (results.some(item => item.navigationError)) process.exitCode = 2;
})().catch(error => {
    console.error("X-01 local probe could not execute:", error && error.name || "Error");
    process.exitCode = 1;
});
