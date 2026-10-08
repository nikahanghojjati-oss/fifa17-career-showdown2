"use strict";
// Studio Z research-only X-01 browser probe. NOT a game fix or a production test.
// Prepared 2026-10-08 for Team G Lead; intentionally NOT EXECUTED by the author.
// Run ONLY against a locally served, disposable, unchanged repository checkout.
// Terminal 1: npm run serve:test
// Terminal 2: CMS_CHROMIUM_MULTI_CONTEXT=1 node investigations/problem-z/tools/x01-local-browser-probe.cjs
// Prerequisites: Node >=24, npm dev dependencies installed, permitted local Chromium.
// Outputs synthetic/non-sensitive startup flags only. No OAuth, Firebase or external requests.
// Third condition delays ONLY a fixture-local inert fetch (not an app dependency).
// This is an IO-latency negative control, not a perfect matched asset delay.
const { createHash } = require("node:crypto");
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
// Fail closed on a mixed/new source revision, rather than misattributing timing to pinned main.
// Git blob SHA-1 is computed from actual working-tree bytes; no repo mutation is required.
const root = path.resolve(__dirname, "../../..");
const expectedBlobs = Object.freeze({
    "index.html": "85bcd2f1d7677f5c1979940e426e741a4ed5821b",
    "js/showdown.js": "b1a09367635c0d9a5b72db8e4e312f83ba6ed26f",
    "js/optionalModules.js": "f3fc6c751ef2c4c3a779682c05b3c23c458ffe08",
    "js/app.js": "5b3627d2a1727cf1c621fbcdf9ea98718cea7952",
    "js/onlinePlayerIdentity.js": "24f57222575b3bf9018ad795d9dabcf6003717eb"
});
const blobDigests = {};
for (const [relative, expected] of Object.entries(expectedBlobs)) {
    const bytes = fs.readFileSync(path.join(root, relative));
    const sha = createHash("sha1")
        .update(Buffer.from("blob " + bytes.length + "\0")).update(bytes).digest("hex");
    if (sha !== expected) throw new Error(
        "X-01 source pin mismatch for " + relative + " (operator must re-resolve source; no test run)."
    );
    blobDigests[relative] = sha;
}
const delayMs = 400;
const scenarios = [
    { id: "baseline", target: null },
    { id: "delay-optional-module", target: "/js/optionalModules.js" },
    { id: "delay-independent-local-fetch", target: "/__studio_z_latency_control__" }
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
        controlFetchIntercepts: 0,
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
            // Independently requested by the research fixture in ALL cases.
            // It is not an app script, stylesheet or production data endpoint.
            if (u.pathname === "/__studio_z_latency_control__") {
                entry.controlFetchIntercepts += 1;
                if (scenario.target === u.pathname) {
                    entry.expectedDelayIntercepts += 1;
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
                return route.fulfill({ status: 204, headers: { "cache-control": "no-store" }, body: "" });
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
            // Control-only inert local fetch. No game state is accessed and no
            // app resource is delayed in the negative-control case.
            void fetch("/__studio_z_latency_control__").catch(() => {});
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
        pinnedMainRevision: "bc77a0b934c3d43279f27f73a72db21c2db2b4f2",
        checkedWorkingTreeSourceBlobs: blobDigests,
        pinnedSourceVerification: "Five source blob hashes checked on execution; operator must also record git HEAD and clean-tree status separately",
        interpretationLimit: "External runtime resources intentionally blocked; the control delays an independent fixture-local fetch, not an app asset or OAuth/provider/physical-device journey.",
        cases: results
    };
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    process.stdout.write("X-01 observational report saved: " + output + "\n");
    for (const item of results) process.stdout.write(item.id + ": " +
        (item.navigationError || "observations captured") +
        "; delayedHits=" + item.expectedDelayIntercepts +
        "; controlFetchHits=" + item.controlFetchIntercepts + "\n");
    // A missed targeted intercept makes comparison invalid, not a pass.
    if (results.some(item => item.navigationError ||
        item.controlFetchIntercepts !== 1 ||
        (item.delayTarget && item.expectedDelayIntercepts !== 1) ||
        (!item.delayTarget && item.expectedDelayIntercepts !== 0))) {
        process.exitCode = 2;
    }
})().catch(error => {
    console.error("X-01 local probe could not execute:", error && error.name || "Error");
    process.exitCode = 1;
});
