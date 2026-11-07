const S = "/tmp/claude-0/-home-claude-fifa17-career-showdown2/7a7e8a39-a0e1-56bd-bcc0-a5ef7b6559ea/scratchpad";
const WT = S + "/rel75";
const { chromium } = require(S + "/r65/node_modules/playwright");
const fixtures = require(WT + "/tests/support/active-showdown-fixtures.cjs");
const activeAdapter = require(WT + "/js/sharedActiveShowdownAdapter.js");
const showdownFixture = fixtures.completedShowdownStorage();
const { prepare: prepareTransfer } = require("./transferPrep.cjs");
const PORT = process.env.GAL_PORT || "4391";
const BASE = `http://127.0.0.1:${PORT}/`;

const SIZES = {
    "desktop-1920x1080": { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, label: "Desktop 1920x1080" },
    "desktop-1280x650": { viewport: { width: 1280, height: 650 }, deviceScaleFactor: 1, label: "Desktop 1280x650" },
    "phone-393x660": { viewport: { width: 393, height: 660 }, deviceScaleFactor: Number(process.env.GAL_PHONE_DSF || 2), isMobile: true, hasTouch: true, label: "Phone 393x660" },
    "phone-844x390": { viewport: { width: 844, height: 390 }, deviceScaleFactor: Number(process.env.GAL_LAND_DSF || 1), isMobile: true, hasTouch: true, label: "Phone sideways 844x390" }
};

async function launch() {
    return chromium.launch({ headless: true, executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
}

async function newPage(browser, sizeKey, log, opts = {}) {
    const size = SIZES[sizeKey];
    const context = await browser.newContext({
        viewport: size.viewport, deviceScaleFactor: size.deviceScaleFactor, isMobile: !!size.isMobile, hasTouch: !!size.hasTouch,
        serviceWorkers: "block", locale: "en-US", reducedMotion: "no-preference"
    });
    // Offline: only the local build is reachable (no CDN / provider traffic).
    await context.route("**/*", route => {
        const url = new URL(route.request().url());
        // The app's one external stylesheet (Google Fonts, Barlow Condensed) was fetched once with curl and is served locally.
        if (url.hostname === "fonts.googleapis.com") return route.fulfill({ contentType: "text/css", body: require("fs").readFileSync(__dirname + "/fonts/barlow.css", "utf8").replace(/https:\/\/fonts\.gstatic\.com\/s\/barlowcondensed\/v13\//g, "https://fonts.gstatic.com/") });
        if (url.hostname === "fonts.gstatic.com") { const f = __dirname + "/fonts/" + url.pathname.split("/").pop(); if (require("fs").existsSync(f)) return route.fulfill({ contentType: "font/woff2", headers: { "access-control-allow-origin": "*" }, body: require("fs").readFileSync(f) }); }
        if (url.origin !== new URL(BASE).origin) return route.abort();
        if (url.pathname === "/js/offlineApp.js") return route.fulfill({ contentType: "application/javascript", body: "window.getOfflineAppDiagnostics=()=>({isolatedGalleryShot:true});" });
        return route.continue();
    });
    await context.routeWebSocket(/.*/, socket => socket.close());
    const page = await context.newPage();
    page.on("pageerror", e => log.push("pageerror: " + e.message));
    page.on("console", m => { if (m.type() === "error") log.push("console.error: " + m.text().slice(0, 200)); });
    page.on("requestfailed", r => log.push("requestfailed: " + r.url().slice(0, 100)));
    page.on("response", r => { if (r.status() >= 400) log.push(`http ${r.status()}: ${r.url().replace(BASE, "")}`); });
    if (opts.raw) return { page, context };
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu") && typeof window.getActiveScreenName === "function" && window.getActiveScreenName() === "mainMenu", null, { timeout: 30000 });
    await page.waitForFunction(() => [...document.querySelectorAll("#mainMenu img")].every(img => img.complete), null, { timeout: 30000 });
    return { page, context };
}

// Seeds the harness fixture exactly as v10-screen-flash-audit prepareJourney does.
async function seedFixture(page, fixtureName) {
    const snapshot = showdownFixture[fixtureName];
    await page.evaluate(async ({ snapshot, rivalry, storage }) => {
        await window.ensureGameplayModules();
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        const names = { identity: "CareerModeOnlinePlayerIdentity", pair: "CareerModePersistentNikDanielPair", multiSeason: "CareerModeProductionSharedMultiSeasonProgression", history: "CareerModeProductionSharedHistoryConvergence", finalReconciliation: "CareerModeProductionSharedFinalReconciliation", terminalClose: "CareerModeProductionSharedTerminalClose", seasonResults: "CareerModeProductionSharedSeasonResults" };
        for (const [key, name] of Object.entries(names)) window[name] = { getState: () => snapshot[key] };
        currentShowdown = normalizeShowdown(JSON.parse(localStorage.getItem("careerModeShowdown.activeShowdown")));
        if (currentShowdown.integrityWarnings.length) throw new Error(`Invalid storage fixture: ${currentShowdown.integrityWarnings.join("; ")}`);
        window.__cmsRivalryFixture = rivalry;
        window.__cmsOpenReadyResults = () => {
            window.openSeasonEntry();
            for (const [prefix, result] of [["p1", snapshot.seasonResults.ownResult], ["p2", snapshot.seasonResults.opponentResult]]) {
                for (const [field, value] of Object.entries(result)) {
                    const input = document.getElementById(prefix + field[0].toUpperCase() + field.slice(1));
                    if (!input) throw new Error(`Missing real results field: ${prefix} ${field}`);
                    if (input.type === "checkbox") input.checked = value; else input.value = String(value);
                }
            }
            window.completeCurrentSeason();
        };
        window.CareerModeV10Screens.invalidate("seasonEntry");
    }, { snapshot, rivalry: activeAdapter.rivalryView(snapshot), storage: showdownFixture.storage });
}

async function seedClub(page) {
    const { STAGES, prepareClub } = require(WT + "/tests/support/v10-club-motion.cjs");
    await prepareClub(page, false);
}

// Wait: html[data-v10-screen] set, pending cleared, images decoded, then 600 ms.
async function settle(page, host, { expectV10 = true, requireContent } = {}) {
    await page.waitForFunction(({ host, expectV10 }) => {
        const el = document.getElementById(host);
        if (!el || el.classList.contains("hidden")) return false;
        if (expectV10 && !document.documentElement.dataset.v10Screen) return false;
        return !el.hasAttribute("data-v10-pending") && !document.querySelector("[data-v10-pending]");
    }, { host, expectV10 }, { timeout: 20000 });
    if (requireContent) await page.locator(`#${host} ${requireContent}`).first().waitFor({ state: "visible", timeout: 15000 });
    await page.evaluate(async host => {
        await document.fonts.ready;
        const el = document.getElementById(host);
        const imgs = [...el.querySelectorAll("img")].filter(img => { const r = img.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
        for (const img of imgs) if (img.loading === "lazy") img.loading = "eager";
        await Promise.race([Promise.all(imgs.map(img => img.decode().catch(() => { }))), new Promise(r => setTimeout(r, 6000))]);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, host);
    await page.waitForTimeout(600);
}

async function diagnose(page, host) {
    return page.evaluate(host => {
        const vw = innerWidth, vh = innerHeight;
        const root = document.getElementById(host) || document.body;
        const de = document.documentElement;
        const out = {
            v10: de.dataset.v10Screen || null, active: typeof getActiveScreenName === "function" ? getActiveScreenName() : null,
            viewport: [vw, vh],
            docScroll: [de.scrollWidth, de.scrollHeight, de.clientWidth, de.clientHeight],
            bodyScroll: [document.body.scrollWidth, document.body.scrollHeight],
            hOverflowPage: de.scrollWidth > vw + 1 || document.body.scrollWidth > vw + 1,
            docVerticalScroll: de.scrollHeight > vh + 2,
            scrollers: [], brokenImgs: [], offscreen: [], clipped: [], textCount: 0
        };
        const sel = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
        const visible = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.02; };
        for (const el of document.querySelectorAll("body *")) {
            const s = getComputedStyle(el);
            if (!visible(el)) continue;
            if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) out.scrollers.push(`${sel(el)} y ${el.scrollHeight}/${el.clientHeight}`);
            if (/(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) out.scrollers.push(`${sel(el)} x ${el.scrollWidth}/${el.clientWidth}`);
        }
        for (const el of [root, ...root.querySelectorAll("*")]) {
            const s = getComputedStyle(el);
            if (!visible(el) && el !== root) continue;
            if (el.tagName === "IMG" && el.complete && el.naturalWidth === 0) out.brokenImgs.push(el.getAttribute("src"));
            const r = el.getBoundingClientRect();
            const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
            if (hasText) {
                out.textCount++;
                if (r.right > vw + 2 || r.left < -2) out.offscreen.push(`${sel(el)} [${Math.round(r.left)},${Math.round(r.right)}] "${el.textContent.trim().slice(0, 30)}"`);
                if ((s.overflow === "hidden" || s.overflowX === "hidden") && el.scrollWidth > el.clientWidth + 2 && s.textOverflow !== "ellipsis" && el.clientWidth > 4) out.clipped.push(`${sel(el)} ${el.scrollWidth}/${el.clientWidth} "${el.textContent.trim().slice(0, 30)}"`);
            }
        }
        for (const k of ["scrollers", "offscreen", "clipped", "brokenImgs"]) out[k] = out[k].slice(0, 8);
        return out;
    }, host);
}

module.exports = { S, WT, BASE, SIZES, launch, newPage, seedFixture, seedClub, settle, diagnose, prepareTransfer, showdownFixture };
