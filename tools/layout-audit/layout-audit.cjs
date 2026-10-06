#!/usr/bin/env node
"use strict";
// Layout auditor: walks every screen reachable WITHOUT Google sign-in at 5 viewport sizes and reports visual defects
// from DOM geometry. Report-only: it never changes game code. See README.md.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../../tests/support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const outDir = path.resolve(process.env.LAYOUT_AUDIT_OUT || "layout-audit-out");
const onlySizes = (process.env.LAYOUT_AUDIT_SIZES || "").split(",").filter(Boolean);
const onlyScreens = (process.env.LAYOUT_AUDIT_SCREENS || "").split(",").filter(Boolean);
const measureSource = fs.readFileSync(path.join(__dirname, "measure.js"), "utf8").trim().replace(/;$/, "");

const SIZES = [
    { name: "360x640", width: 360, height: 640, phone: true },
    { name: "393x660", width: 393, height: 660, phone: true },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1440x900", width: 1440, height: 900 },
    { name: "1920x1080", width: 1920, height: 1080 }
].filter(size => !onlySizes.length || onlySizes.includes(size.name));

const fixtures = require("./fixtures/data.cjs");
const nodeFixtures = fixtures.build();
// Which module renders each capture (reported next to the evidence found in the DOM).
const MODULES = {
    "home-empty": "js/homeScreensV10.js (Team V home)", "rule-book": "js/rulesSettingsV10.js (Rule Book)", "statistics-career": "js/careerScreensV10.js mount('careerStatistics', fixture model)",
    "trophy-room": "js/careerScreensV10.js mount('trophyRoom', fixture model)", "legacy-history": "js/rivalryLegacyV10.js (Legacy)", "settings": "js/rulesSettingsV10.js (Settings)",
    "create-showdown": "js/v10Setup.js (Start/Join)", "league-wheel": "js/v10Setup.js (league wheel)", "club-wheel": "js/clubScreenV10.js (Club Assignment)",
    "dashboard": "app dashboard screen (js/screens.js route 'dashboard', v10 shell styling)", "statistics-rivalry": "js/rivalryLegacyV10.js (Rivalry Statistics)",
    "transfer-war": "js/transferScreenV10.js skin on js/productionSharedTransferChallenge.js (real module, fake Spark provider)",
    "season-results": "js/seasonFinalV10.js season-results skin on js/productionSharedSeasonResults.js (shared marker on)",
    "final-winner": "js/seasonFinalV10.js final-winner skin on route 'seasonEntry' (fixture reconciliation + terminal close)",
    "standings": "js/seasonFinalV10.js standings skin (route 'standings')", "connect-players": "js/connectPlayersScreenV10.js open()"
};
const moduleFor = id => Object.entries(MODULES).find(([k]) => id.startsWith(k))?.[1] || "";
const activeStorageKey = "careerModeShowdown.activeShowdown";
const libraryKey = "careerModeShowdown.saveLibrary";

// ---------- app helpers (copied in spirit from tests/browser/stability-audit.cjs; no game code is modified) ----------
async function openApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 15000 });
    await page.locator("#newShowdown").waitFor({ state: "visible", timeout: 15000 });
}
async function installIdentity(page){
    await page.waitForFunction(() => typeof window.loadRuntimeScript === "function", null, { timeout: 12000 });
    await page.evaluate(async () => {
        if(!window.CareerModeOnlinePlayerIdentity?.initialize) await window.loadRuntimeScript("audit-online-player-identity", "js/onlinePlayerIdentity.js", () => window.CareerModeOnlinePlayerIdentity);
        const accountId = "account_audit_fixture", deviceId = "device_audit_fixture";
        window.CareerModeProductionFirebaseRuntime = window.CareerModeProductionFirebaseRuntime || {};
        window.CareerModeSparkConnectedAccount = { initialize: async () => ({ connected: true, accountId }), getState: () => ({ connected: true, accountId }), signIn: async () => ({ connected: true, accountId }), signOut: async () => ({ connected: false, accountId: null }) };
        window.CareerModeSparkPrivatePairing = { initialize: async () => ({ registered: true, deviceId }), getState: () => ({ registered: true, deviceId, message: "Ready" }), getOrCreateDeviceIdentity: async () => ({ deviceId }) };
        window.CareerModePersistentNikDanielPair = { initialize: async () => ({ accountId, managerId: "daniel", connectionState: "idle", rivalryId: null }), render: () => null };
        const identity = window.CareerModeOnlinePlayerIdentity;
        let state = await identity.initialize(true);
        if(state?.status === "choose-manager") state = await identity.chooseManager("daniel");
        document.getElementById("onlinePlayerIdentityOverlay")?.remove();
    });
}
async function releasePairedGate(page){
    await page.waitForFunction(() => window.CareerModeProductionSharedJourneyEntry?.isPending?.() === true, null, { timeout: 12000 });
    await page.evaluate(({ pendingKey }) => {
        currentShowdown.sharedJourney = { contractVersion: 1, mode: "shared", setupPending: false };
        window.CareerModeSaveLibraryRuntime.saveCurrentShowdown();
        sessionStorage.removeItem(pendingKey);
        document.getElementById("productionSharedJourneyEntryOverlay")?.classList.add("hidden");
        for(const id of ["spinLeague", "openClubPack"]){ const b = document.getElementById(id); if(b){ b.disabled = false; b.removeAttribute("aria-disabled"); delete b.dataset.sharedJourneyLocked; b.removeAttribute("title"); } }
        document.getElementById("continueSharedSetupGate")?.remove(); document.getElementById("sharedJourneyLeagueLockNote")?.remove();
    }, { pendingKey: "careerModeShowdown.sharedJourneyPending.v1" });
}
const settle = (page, ms = 700) => page.waitForTimeout(ms);
// Waits until button/heading/image boxes stop moving (entrance animations), so we never measure a half-animated screen.
async function waitStable(page, maxMs = 4000){
    const sample = () => page.evaluate(() => [...document.querySelectorAll("button,a,h1,h2,h3,img,input")].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.left) + "," + Math.round(r.top) + "," + Math.round(r.width) + "," + Math.round(r.height); }).join(";"));
    let previous = await sample();
    for(let waited = 0; waited < maxMs; waited += 200){
        await page.waitForTimeout(200);
        const next = await sample();
        if(next === previous) return true;
        previous = next;
    }
    return false;
}
async function activeScreenIds(page){ return page.locator(".screen:not(.hidden)").evaluateAll(els => els.map(e => e.id)); }
async function waitScreen(page, id){ await page.locator("#" + id).waitFor({ state: "visible", timeout: 12000 }); await settle(page, 600); }
async function clickJs(page, sel){ await page.evaluate(s => document.querySelector(s).click(), sel); }

// ---------- the reach plan: ordered steps that leave the app on a screen/overlay, then ask for a capture ----------
// Each capture: { id, root } where root is the CSS selector of the thing being audited.
async function walk(page, cap, unreached){
    const tryStep = async (id, fn) => { if(onlyScreens.length && !onlyScreens.some(s => id.startsWith(s))) { try{ await fn(true); }catch(e){} return; } try{ await fn(false); }catch(error){
            let state = "";
            try{ state = await page.evaluate(() => " | visible screens: " + [...document.querySelectorAll(".screen:not(.hidden)")].map(e => e.id).join(",") + "; overlays: " + [...document.querySelectorAll("[id*=verlay],[role=dialog]")].filter(e => e.offsetHeight > 0 && !e.classList.contains("hidden")).map(e => e.id).join(",")); await page.screenshot({ path: path.join(outDir, "screenshots", `UNREACHED-${id}__${page.viewportSize().width}x${page.viewportSize().height}.png`) }); }catch(e){}
            unreached.push({ screen: id, why: String(error.message || error).split("\n")[0].slice(0, 200) + state });
        } };

    await openApp(page);
    await page.addScriptTag({ path: fixtures.pageFixturesPath });
    await tryStep("home-empty", async skip => { if(!skip) await cap("home-empty", "#mainMenu"); });

    // Static destinations that need no showdown
    for(const [id, button, screen] of [["rule-book", "#ruleBookButton", "ruleBook"]]){
        await tryStep(id, async skip => {
            await clickJs(page, button); await waitScreen(page, screen);
            if(!skip) await cap(id, "#" + screen);
            await page.evaluate(s => document.querySelector(`#${s} .backButton, #${s} [data-smart-back]`)?.click(), screen);
            await waitScreen(page, "mainMenu");
        });
    }
    // Career Statistics / Trophy Room: open the route, then mount Team V's screen with the contract fixture career model (the way the app does after a loaded career).
    for(const [id, button, screen] of [["statistics-career", "#careerStatisticsButton", "careerStatistics"], ["trophy-room", null, "trophyRoom"]]){
        await tryStep(id, async skip => {
            if(!nodeFixtures.careerModel) throw new Error("career fixture unavailable: " + nodeFixtures.careerError);
            if(button) await clickJs(page, button);
            else await page.evaluate(async () => { await window.ensureOptionalModule?.("trophyRoom"); window.createTrophyRoomScreen?.(); await window.navigateTo("trophyRoom", { addToHistory: false }); });
            await waitScreen(page, screen);
            await page.evaluate(({ screen, model }) => window.__auditFixtures.mountCareer(screen, model), { screen, model: nodeFixtures.careerModel });
            await settle(page, 1500);
            if(!skip) await cap(id, "#" + screen);
            await page.evaluate(() => window.navigateTo("mainMenu", { addToHistory: false })); await waitScreen(page, "mainMenu");
        });
    }

    // Settings and its panels
    await tryStep("settings", async skip => {
        await clickJs(page, "#settingsButton");
        await page.waitForFunction(() => document.getElementById("settingsOverlay")?.classList.contains("v10Settings") && document.querySelector(".settingsPanel--data"), null, { timeout: 15000 });
        await settle(page, 800);
        if(!skip) await cap("settings", "#settingsOverlay");
        // each settings panel on its own: scroll it into view and capture the overlay again with the panel's own name
        const panels = await page.evaluate(() => [...document.querySelectorAll("#settingsContent > .settingsPanel")].filter(p => p.offsetHeight > 0).map((p, i) => ({ i, title: (p.querySelector("h3")?.textContent || p.className).trim().slice(0, 30) })));
        if(!skip) for(const p of panels){
            await page.evaluate(i => document.querySelectorAll("#settingsContent > .settingsPanel")[i]?.scrollIntoView({ block: "start" }), p.i);
            await settle(page, 200);
            await cap("settings-panel-" + p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), "#settingsOverlay", { panelIndex: p.i });
        }
        // backup / restore / reset: click the data-panel buttons that open sub-panels (never confirm anything destructive)
        const dataButtons = await page.evaluate(() => [...document.querySelectorAll(".settingsPanel--data button, #settingsContent button")].filter(b => b.offsetHeight > 0 && /backup|export|restore|import|reset|clear|delete/i.test(b.textContent)).map(b => ({ text: b.textContent.trim().slice(0, 40), id: b.id })));
        if(!skip) report.settingsButtonsSeen = dataButtons;
        await page.evaluate(() => document.getElementById("settingsClose")?.click()); await settle(page, 300);
    });

    // New Showdown flow
    let haveShowdown = false;
    let connectCaptured = false;
    await tryStep("create-showdown", async skip => {
        await installIdentity(page);
        await page.locator("#newShowdown").click();
        // Newer builds open Connect Players first (js/connectPlayersScreenV10.js); older ones go straight to Create Showdown.
        await page.waitForFunction(() => document.getElementById("createShowdown") && !document.getElementById("createShowdown").classList.contains("hidden") || document.querySelector("#connectPlayersScreen:not(.hidden)"), null, { timeout: 12000 });
        if(await page.evaluate(() => Boolean(document.querySelector("#connectPlayersScreen:not(.hidden)")))){
            await settle(page, 1500);
            if(!skip){ await cap("connect-players", "#connectPlayersScreen"); connectCaptured = true; }
            await page.evaluate(() => window.CareerModeConnectPlayersScreenV10?.close?.()); await settle(page, 400);
            await page.evaluate(() => window.navigateTo("createShowdown", { addToHistory: false }));
        }
        await waitScreen(page, "createShowdown");
        if(!skip) await cap("create-showdown", "#createShowdown");
        await page.locator("#roundAmount").selectOption("1");
        await page.locator("#startShowdown").click(); await waitScreen(page, "leagueWheelScreen");
        haveShowdown = true;
    });
    await tryStep("league-wheel-locked", async skip => { if(!haveShowdown) throw new Error("no showdown"); if(!skip) await cap("league-wheel-locked", "#leagueWheelScreen"); });
    await tryStep("league-wheel-selected", async skip => {
        if(!haveShowdown) throw new Error("no showdown");
        await releasePairedGate(page);
        await page.locator("#spinLeague").click();
        await page.locator("#spinLeague").filter({ hasText: /CONTINUE TO CLUB ASSIGNMENT/i }).waitFor({ state: "visible", timeout: 10000 });
        await settle(page, 800);
        if(!skip) await cap("league-wheel-selected", "#leagueWheelScreen");
    });
    await tryStep("club-wheel", async skip => {
        await page.locator("#spinLeague").click(); await waitScreen(page, "clubWheelScreen");
        if(!skip) await cap("club-wheel", "#clubWheelScreen");
    });
    await tryStep("club-wheel-revealed", async skip => {
        await page.locator("#openClubPack").click(); await page.locator("#continueClubAssignment").waitFor({ state: "visible", timeout: 8000 }); await settle(page, 1000);
        if(!skip) await cap("club-wheel-revealed", "#clubWheelScreen");
    });
    await tryStep("dashboard", async skip => {
        await page.locator("#continueClubAssignment").click(); await waitScreen(page, "dashboard");
        if(!skip) await cap("dashboard", "#dashboard");
    });
    // Provider-owned screens, rendered by the REAL production modules with a fake in-page provider (no network, no auth).
    await tryStep("connect-players", async skip => {
        if(connectCaptured) return;
        const ok = await page.evaluate(async () => { try{ await window.loadRuntimeScript("audit-connect-players", "js/connectPlayersScreenV10.js", () => window.CareerModeConnectPlayersScreenV10); }catch(e){ return false; } return Boolean(window.CareerModeConnectPlayersScreenV10); });
        if(!ok) throw new Error("js/connectPlayersScreenV10.js does not exist on this branch (not on main)");
        await page.evaluate(() => window.CareerModeConnectPlayersScreenV10.open()); await settle(page, 1500);
        if(!skip) await cap("connect-players", "#connectPlayersScreen");
        await page.evaluate(() => window.CareerModeConnectPlayersScreenV10.close?.()); await settle(page, 300);
    });
    let transferReady = false;
    await tryStep("transfer-war-window", async skip => {
        await page.evaluate(() => window.__auditFixtures.installTransfer());
        await page.evaluate(() => window.__auditTransfer.open("WINDOW_OPEN")); await page.locator("#transferChallenge").waitFor({ state: "visible", timeout: 12000 }); await settle(page, 2500);
        transferReady = true;
        if(!skip) await cap("transfer-war-window", "#transferChallenge");
    });
    for(const [id, phase] of [["transfer-war-guess", "GUESS_ENTRY"], ["transfer-war-signing", "SIGNING_ENTRY"], ["transfer-war-completed", "COMPLETED"]]){
        await tryStep(id, async skip => {
            if(!transferReady) throw new Error("transfer fixture did not open");
            await page.evaluate(p => window.__auditTransfer.setPhase(p), phase); await settle(page, 2500);
            if(!skip) await cap(id, "#transferChallenge");
        });
    }
    await tryStep("season-results-entry", async skip => {
        await installSharedFixture(page, "pending");
        await page.evaluate(async () => { await window.CareerModeProductionSharedSeasonResults?.refresh?.(); await window.navigateTo("seasonEntry", { addToHistory: false }); }); await waitScreen(page, "seasonEntry"); await settle(page, 1500);
        if(!skip) await cap("season-results-entry", "#seasonEntry");
    });
    await tryStep("season-results-review", async skip => {
        await installSharedFixture(page, "ready");
        await page.evaluate(async () => { await window.CareerModeProductionSharedSeasonResults?.refresh?.(); await window.navigateTo("seasonEntry", { addToHistory: false }); });
        await settle(page, 1500);
        if(!skip) await cap("season-results-review", "#seasonEntry");
    });
    await tryStep("final-winner", async skip => {
        if(nodeFixtures.error) throw new Error("fixtures unavailable: " + nodeFixtures.error);
        await page.evaluate(async fx => {
            await window.__auditFixtures.installFinalState(fx);
            await loadRuntimeScript("audit-final-v10", "js/seasonFinalV10.js", () => window.CareerModeSeasonFinalV10); await window.CareerModeSeasonFinalV10.install();
            // Fixture: the season-results route is open (the provider adapter is faked), so Final Winner can show on 'seasonEntry'.
            if(window.CareerModeProductionSharedSeasonResults) window.CareerModeProductionSharedSeasonResults = { ...window.CareerModeProductionSharedSeasonResults, canRoute: () => true };
            window.CareerModeV10Screens.invalidate("seasonEntry");
            await window.navigateTo("dashboard", { addToHistory: false }); await window.navigateTo("seasonEntry", { addToHistory: false });
        }, nodeFixtures);
        await settle(page, 3000);
        const finalMounted = await page.evaluate(() => Boolean(document.querySelector(".v10FinalStage")));
        if(!finalMounted){
            const dbg = await page.evaluate(fx => { const f = window.CareerModeSeasonFinalV10.finalFrame(fx.finalReconciliation, fx.closed, fx.history); return JSON.stringify({ status: f.status, state: f.state, winner: f.winner, screens: [...document.querySelectorAll(".screen:not(.hidden)")].map(e => e.id), seasonHost: document.getElementById("seasonEntry")?.className, canRoute: window.CareerModeProductionSharedSeasonResults?.canRoute?.() }); }, nodeFixtures);
            throw new Error("Final Winner skin did not mount (.v10FinalStage absent) " + dbg);
        }
        if(!skip) await cap("final-winner", "#seasonEntry");
    });
    await tryStep("statistics-rivalry", async skip => {
        await page.evaluate(async () => { await window.navigateTo("dashboard", { addToHistory: false }); document.getElementById("rivalryStatisticsButton").click(); });
        await waitScreen(page, "statistics");
        await page.evaluate(() => window.__auditFixtures.mountRivalryLegacy("rivalryStatistics")); await settle(page, 2000);
        if(!skip) await cap("statistics-rivalry", "#statistics");
    });
    await tryStep("legacy-history", async skip => {
        await page.evaluate(async () => { await ensureOptionalModule?.("legacy"); await window.navigateTo("legacy", { addToHistory: false }); });
        await waitScreen(page, "legacy");
        await page.evaluate(model => window.__auditFixtures.mountRivalryLegacy("legacy", model), nodeFixtures.careerModel); await settle(page, 2000);
        if(!skip) await cap("legacy-history", "#legacy");
    });
    await tryStep("standings", async skip => {
        await page.evaluate(async () => { await window.CareerModeV10Screens.navigate("standings"); }); await waitScreen(page, "standings"); await settle(page, 2000);
        if(!skip) await cap("standings", "#standings");
    });
}

// Real js/productionSharedTransferChallenge.js with a fake Spark provider read (same fixture shape as tests/browser/shared-transfer-challenge-replay-audit.cjs).
// Installs fake provider adapters so the provider-gated Transfer/Season Results routes open (no network, no auth).
async function installSharedFixture(page, mode){
    await page.evaluate(async ({ mode }) => {
        await ensureGameplayModules?.();
        await loadRuntimeScript("audit-catalog", "js/sharedShowdownCatalog.js", () => window.CareerModeSharedShowdownCatalog);
        const rivalryId = "pair_" + "9".repeat(64), sessionId = "session_" + "8".repeat(64), role = "playerOne";
        currentShowdown.sharedJourney = { mode: "shared", rivalryId, setupPending: false };
        const setupBody = { phase: "SHOWDOWN_CONFIRMED", revision: 6, coordinatorRole: "playerOne", leagueId: "premier_league", clubs: { playerOne: "Arsenal", playerTwo: "Liverpool" }, totalSeasons: 3, confirmedRoles: ["playerOne", "playerTwo"] };
        const setup = { status: "ready", ready: true, revision: 6, phase: "SHOWDOWN_CONFIRMED", rivalryId, sessionId, deviceId: "device_" + "1".repeat(32), managerRole: role, setup: setupBody };
        const transfer = { ok: true, revision: 7, seasonNumber: 1, managerRole: role, rivalryId, setup: setupBody, state: { phase: "COMPLETED", revision: 7, guessLockedRoles: ["playerOne", "playerTwo"], signingLockedRoles: ["playerOne", "playerTwo"] } };
        window.CareerModeProductionSharedShowdownSetup = { getState: () => setup, refresh: async () => setup };
        window.CareerModeProductionSharedTransferChallenge = { getState: () => transfer, refresh: async () => transfer, canRoute: () => true };
        const res = (n) => ({ ok: true });
        window.CareerModeSparkSharedSeasonResults = window.CareerModeSparkSharedSeasonResults || { read: async () => ({ ok: true, revision: 0, state: null, managerRole: role, seasonNumber: 1, ownResult: null, opponentResult: null, allResults: null }), publishResult: async () => ({ ok: false, code: "AUDIT_NO_WRITE" }) };
        window.CareerModeProductionFirebaseRuntime = { ensureAccountServices: async () => ({ ok: true, auth: { currentUser: { uid: "account_one" } }, firestore: {}, firestoreSdk: {} }) };
        await loadRuntimeScript("audit-season-results", "js/productionSharedSeasonResults.js", () => window.CareerModeProductionSharedSeasonResults);
        await loadRuntimeScript("audit-season-results-route", "js/productionSharedSeasonResultsRoute.js", () => window.CareerModeProductionSharedSeasonResultsRoute);
        window.CareerModeProductionSharedSeasonResults.install?.(); window.CareerModeProductionSharedSeasonResultsRoute.install?.();
        window.__auditSeasonRoute = true;
    }, { mode });
}

// ---------- measuring ----------
const report = { tool: "layout-audit", baseUrl: baseUrl.href, sizes: SIZES.map(s => s.name), generatedAt: new Date().toISOString(), settingsButtonsSeen: [] };
const findings = [];
const captured = []; // {screen,size}
const unreachedBySize = {};
const captureMeta = {};

async function run(){
    fs.mkdirSync(path.join(outDir, "screenshots"), { recursive: true });
    const runtime = await resolveChromiumRuntime();
    // One browser per size: the bundled chromium runs --single-process, so closing a context would kill a shared browser.
    for(const size of SIZES){
        const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
        try{
            const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, isMobile: Boolean(size.phone), hasTouch: Boolean(size.phone), reducedMotion: "reduce", locale: "en-US" });
            const page = await context.newPage();
            const unreached = [], dedupe = new Set(); // settings panel re-captures only report what the first Settings capture did not
            const cap = async (screen, rootSel, extra = {}) => {
                await settle(page, 250);
                await waitStable(page);
                await page.evaluate(() => document.getElementById("appRuntimeNotice")?.remove()); // fixture-induced provider error toast, not part of the screen
                const results = await page.evaluate(`(${measureSource})(${JSON.stringify(rootSel)}, ${JSON.stringify({ phone: Boolean(size.phone), artMin: process.env.LAYOUT_AUDIT_ART_MIN ? Number(process.env.LAYOUT_AUDIT_ART_MIN) : undefined })})`);
                const where = await page.evaluate(() => ({ route: typeof window.getActiveScreenName === "function" ? window.getActiveScreenName() : null, evidence: [".sd-stage", ".v10SeasonStage", ".v10FinalStage", ".standingsScreenV10", ".seasonScreenV10", "#connectPlayersScreen:not(.hidden)", ".v10Settings", ".v10Home", "[data-v10-screen]", ".transferScreenV10", ".tw-root", ".footballVisualPanel"].filter(q => document.querySelector(q)), transferMounted: window.CareerModeTransferScreenV10?.isMounted?.() ?? null }));
                captureMeta[screen + "|" + size.name] = { module: moduleFor(screen), ...where };
                if(process.env.LAYOUT_AUDIT_DUMP && screen.startsWith(process.env.LAYOUT_AUDIT_DUMP)){
                    const inv = await page.evaluate(rootSel => [...document.querySelector(rootSel).querySelectorAll("*")].map(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); const anc = []; for(let n = e.parentElement; n && n !== document.body; n = n.parentElement){ const o = getComputedStyle(n); if(/hidden|clip/.test(o.overflow + o.overflowX + o.overflowY)) anc.push((n.id || n.className || n.tagName).toString().slice(0, 30)); } return { t: e.tagName, c: (e.id || e.className || "").toString().slice(0, 40), r: [r.left, r.top, r.width, r.height].map(Math.round), img: e.tagName === "IMG" ? { src: e.currentSrc.split("/").pop(), nat: [e.naturalWidth, e.naturalHeight], fit: s.objectFit } : undefined, bg: s.backgroundImage !== "none" ? s.backgroundImage.slice(0, 80) + " | " + s.backgroundSize + " | " + s.backgroundPosition : undefined, bi: s.borderImageSource !== "none" ? s.borderImageSource.slice(0, 60) : undefined, pos: s.position, clip: anc.slice(0, 3).join(">") }; }).filter(x => x.img || x.bg || x.bi || x.t === "BUTTON"), rootSel);
                    fs.writeFileSync(path.join(outDir, `dump-${screen}__${size.name}.json`), JSON.stringify(inv, null, 1));
                }
                const file = `${screen}__${size.name}.png`;
                await page.screenshot({ path: path.join(outDir, "screenshots", file) });
                captured.push({ screen, size: size.name });
                for(const f of results){ const key = [size.name, rootSel, f.rule, f.selector, f.detail].join("|"); if(extra.panelIndex !== undefined && dedupe.has(key)) continue; dedupe.add(key); findings.push({ screen, size: size.name, ...f, screenshot: "screenshots/" + file }); }
            };
            try{ await walk(page, cap, unreached); }
            catch(error){ unreached.push({ screen: "(walk aborted)", why: String(error.message || error).split("\n")[0] }); }
            unreachedBySize[size.name] = unreached;
            console.log(`size ${size.name}: ${captured.filter(c => c.size === size.name).length} captures, ${findings.filter(f => f.size === size.name).length} findings, ${unreached.length} unreached`);
        }catch(error){ console.error(`size ${size.name} failed: ${error.message}`); }
        finally{ try{ await browser.close(); }catch(e){} }
    }
    fs.writeFileSync(path.join(outDir, "findings.json"), JSON.stringify({ ...report, captureMeta, captured, unreached: unreachedBySize, findings }, null, 1));
}
run().then(() => require("./summarize.cjs")).catch(error => { console.error(error); process.exitCode = 1; });
