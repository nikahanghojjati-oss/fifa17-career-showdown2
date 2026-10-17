// HO-031 (r78 phone marble): the 12 manager screens draw Team V's ENV_<KEY>_PHONE_V2 plates (both managers painted in)
// below the desktop picture range. This opens each screen the way the other tests/browser audits do (most screens have
// no URL of their own, so Team V's live_facecheck.cjs can only reach Home) and runs the same face check as
// project-documents/factory/tools/phone_plates/live_facecheck.cjs (factory/v1-wtt5ye): at 393x852, 393x660, 375x667 and
// 360x640 no visible button, card, title or tab may cover a face zone from PHONE_FACE_ZONES.json, and no manager layer
// may be faded, clipped or filtered. The gate uses the plate as the screens draw it (cover, centre top, as HO-031 asks);
// the tool's own model (cover, centre) is also run and any extra overlap it finds is printed as a note. It also checks
// that the screen really shows the V2 plate and no OVL_*_PHONE cut-out.
// With no KEY it runs the 8 screens that draw the V2 plate. LEAGUE, STANDINGS, RIVALRY and TROPHY_ROOM stay on the old
// look (a panel would cover a face without a layout move); run them by name with CMS_FACECHECK_PREDICT=1 to see the
// overlap the plate would have (cut-outs hidden, art check skipped).
// Usage: node tests/browser/phone-marble-facecheck-audit.cjs [KEY ...]   (CMS_BASE_URL, CMS_FACECHECK_SHOTS optional)
"use strict";
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1"; // one context per size
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");
const activeAdapter = require("../../js/sharedActiveShowdownAdapter.js");
const { prepareClub } = require("../support/v10-club-motion.cjs");

const ZONES = require("../fixtures/team-v/PHONE_FACE_ZONES.json").zones;
const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const shotDir = process.env.CMS_FACECHECK_SHOTS || "";
// CMS_FACECHECK_PREDICT=1 (for a build before the swap): hide the cut-outs and skip the plate check, to see which UI
// would cover the painted faces.
const predict = process.env.CMS_FACECHECK_PREDICT === "1";
const SIZES = [[393, 852], [393, 660], [375, 667], [360, 640]];
const IW = 1179, IH = 2096;
const showdown = fixtures.completedShowdownStorage();
// A three-season completed career (same shape as phone-trophy-room-data-audit), so the career screens show real data.
const { projection, result, finalFor } = require("../support/career-fixture-helpers.cjs");
const Career = require("../../js/sharedCareerAnalytics.js");
const career = (() => {
    const p = projection({ totalSeasons: 3, seasons: [
        [result({ leaguePosition: 1, leaguePoints: 101, leagueGoals: 102, championsLeague: true, domesticCup: true, topScorer: true }), result()],
        [result(), result({ leaguePosition: 1, leaguePoints: 94, leagueGoals: 105, championsLeague: true })],
        [result({ leaguePosition: 1, leaguePoints: 98, domesticCup: true }), result({ leaguePosition: 2, leaguePoints: 86 })]
    ] });
    return Career.buildCareerModel({ indexStatus: "ready", showdowns: [{ rivalryId: p.rivalryId, classification: "completed", projection: p, final: finalFor(p) }] });
})();
const careerOpen = (module, render) => page => page.evaluate(async ({ module, render, model }) => {
    await window.ensureGameplayModules();
    await loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam));
    await window.openOptionalModule(module);
    window[render]({ model });
}, { module, render, model: career });

async function waitForHome(page){
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.waitForFunction(() => window.CareerModeV10Screens && window.CareerModeV10Screens.isMounted("mainMenu") && window.getActiveScreenName() === "mainMenu", null, { timeout: 30000 });
}

async function seed(page, name){
    const snapshot = showdown[name];
    await page.evaluate(async ({ snapshot, rivalry, storage }) => {
        await window.ensureGameplayModules();
        for(const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        const names = { identity: "CareerModeOnlinePlayerIdentity", pair: "CareerModePersistentNikDanielPair", multiSeason: "CareerModeProductionSharedMultiSeasonProgression", history: "CareerModeProductionSharedHistoryConvergence", finalReconciliation: "CareerModeProductionSharedFinalReconciliation", terminalClose: "CareerModeProductionSharedTerminalClose", seasonResults: "CareerModeProductionSharedSeasonResults" };
        for(const [key, n] of Object.entries(names)) window[n] = { getState: () => snapshot[key] };
        currentShowdown = normalizeShowdown(JSON.parse(localStorage.getItem("careerModeShowdown.activeShowdown")));
        window.__cmsRivalryFixture = rivalry;
        window.__cmsSnapshot = snapshot;
        window.CareerModeV10Screens.invalidate("seasonEntry");
    }, { snapshot, rivalry: activeAdapter.rivalryView(snapshot), storage: showdown.storage });
}

const waitScreen = (page, id) => page.waitForFunction(id => { const el = document.getElementById(id); return el && !el.classList.contains("hidden") && !el.hasAttribute("data-v10-pending") && window.getActiveScreenName() === id; }, id, { timeout: 20000 });

// Each opener starts on a freshly loaded Home and leaves the named screen shown.
const SCREENS = {
    HOME: { host: "mainMenu", open: async () => {} },
    LEGACY: { host: "legacy", open: careerOpen("legacy", "renderLegacy") },
    STATISTICS: { host: "careerStatistics", open: careerOpen("careerStatistics", "openCareerStatistics") },
    TROPHY_ROOM: { host: "trophyRoom", open: careerOpen("trophyRoom", "openTrophyRoom") },
    SEASON_RESULTS: { host: "seasonEntry", open: async page => { await seed(page, "ready"); await page.evaluate(() => {
        window.openSeasonEntry();
        const s = window.__cmsSnapshot.seasonResults;
        for(const [prefix, result] of [["p1", s.ownResult], ["p2", s.opponentResult]]) for(const [field, value] of Object.entries(result)){
            const input = document.getElementById(prefix + field[0].toUpperCase() + field.slice(1));
            if(input){ if(input.type === "checkbox") input.checked = value; else input.value = String(value); }
        }
        window.completeCurrentSeason();
    }); } },
    FINAL_WINNER: { host: "seasonEntry", open: async page => { await seed(page, "finished"); await page.evaluate(() => window.openSeasonEntry()); } },
    RIVALRY: { host: "statistics", open: async page => { await seed(page, "finished"); await page.evaluate(async () => { await ensureOptionalModule("statistics"); window.openRivalryStatistics({ model: window.__cmsRivalryFixture }); }); } },
    STANDINGS: { host: "standings", open: async page => { await seed(page, "finished"); await page.evaluate(() => window.CareerModeV10Screens.navigate("standings")); } },
    CLUB: { host: "clubWheelScreen", open: page => prepareClub(page, false) },
    LEAGUE: { host: "leagueWheelScreen", open: page => page.evaluate(async () => {
        await window.ensureGameplayModules();
        const now = new Date().toISOString();
        currentShowdown = normalizeShowdown({ schemaVersion: 2, id: "phone-marble-league", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, totalRounds: 3, currentRound: 1, status: "Created", selectedLeague: null, clubs: { playerOne: null, playerTwo: null }, score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [], integrityWarnings: [], createdAt: now, updatedAt: now, completedAt: null, archivedAt: null });
        showScreen("leagueWheelScreen");
    }) },
    TRANSFER: { host: "transferChallenge", open: page => page.evaluate(async () => {
        await window.ensureGameplayModules();
        const now = new Date().toISOString();
        currentShowdown = normalizeShowdown({ schemaVersion: 2, id: "phone-marble-transfer", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, totalRounds: 3, currentRound: 1, status: "Ready", selectedLeague: { id: "premier_league", name: "Premier League" }, clubs: { playerOne: "Arsenal", playerTwo: "Liverpool" }, score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [], integrityWarnings: [], createdAt: now, updatedAt: now, completedAt: null, archivedAt: null });
        currentShowdown.transferChallenges.push(createTransferChallenge(1)); // read-only: the audit never saves
        await loadRuntimeScript("v10-transfer", "js/transferScreenV10.js", () => Boolean(window.CareerModeTransferScreenV10));
        // Team V's Transfer War skin draws only for a shared challenge: substitute a read-only provider view (an open window).
        window.CareerModeProductionSharedTransferChallenge = { isActive: () => true, canRoute: () => true, getState: () => ({ managerRole: "playerOne", seasonNumber: 1, state: { phase: "WINDOW_OPEN" } }) };
        await window.CareerModeTransferScreenV10.install();
        window.openTransferChallenge();
    }) },
    CONNECT_PLAYERS: { host: "connectPlayersScreen", open: page => page.evaluate(async () => {
        if(!window.CareerModeConnectPlayersScreenV10) await loadRuntimeScript("layout-connect", "js/connectPlayersScreenV10.js", () => Boolean(window.CareerModeConnectPlayersScreenV10));
        await CareerModeConnectPlayersScreenV10.open({ sync: false });
    }), visible: true }
};

async function openScreen(page, key){
    const s = SCREENS[key];
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await waitForHome(page);
    await s.open(page);
    if(s.visible) await page.locator("#" + s.host).waitFor({ state: "visible", timeout: 20000 });
    else if(key !== "HOME") await waitScreen(page, s.host);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(3500);
}

// Same element walks as live_facecheck.cjs (factory/v1-wtt5ye). One change in the fade walk: a UI card (.sd-panel) is not a
// manager even when its size class is sd-panel--hero (its corner-cut clip-path is the card's shape).
function faceHits({ faces, w, h }){
    const out = [];
    const visible = el => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05; };
    const drawsSomething = el => { const cs = getComputedStyle(el);
        const bg = cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor);
        const bgImg = cs.backgroundImage && cs.backgroundImage !== "none";
        const border = parseFloat(cs.borderTopWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.borderTopColor);
        const text = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        return bg || bgImg || border || text || /^(IMG|SVG|CANVAS|BUTTON|INPUT|VIDEO)$/.test(el.tagName.toUpperCase()); };
    const cls = el => String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "");
    for(const el of document.querySelectorAll("body *")){
        const r = el.getBoundingClientRect();
        if(r.width < 2 || r.height < 2 || r.width * r.height > 0.6 * w * h) continue;
        if(!visible(el) || !drawsSomething(el)) continue;
        if(/cutout|manager|portrait|plate|backdrop|stage-art|background/i.test(cls(el))) continue;
        faces.forEach((f, i) => {
            const ix = Math.min(r.right, f[2]) - Math.max(r.left, f[0]), iy = Math.min(r.bottom, f[3]) - Math.max(r.top, f[1]);
            const onTop = () => { const cx = (Math.max(r.left, f[0]) + Math.min(r.right, f[2])) / 2, cy = (Math.max(r.top, f[1]) + Math.min(r.bottom, f[3])) / 2;
                const t = document.elementFromPoint(cx, cy); return t && (t === el || el.contains(t) || t.contains(el)); };
            if(ix > 2 && iy > 2 && onTop()) out.push({ face: i % 2 ? "Nik" : "Daniel", tag: el.tagName.toLowerCase(), id: el.id, cls: cls(el).slice(0, 60), text: (el.innerText || "").trim().slice(0, 40), pct: Math.round(100 * ix * iy / ((f[2] - f[0]) * (f[3] - f[1]))) });
        });
    }
    return out;
}

function fadedManagers(){
    const out = [], who = /^(.*hero.*|.*cutout.*|manager.*|.*daniel.*|nik|nik[-_].*|.*[-_]nik|.*portrait.*|ovl_.*)$/i;
    for(const el of document.querySelectorAll("body *")){
        const name = (el.id || "") + " " + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "");
        let src = ""; if(el.tagName === "IMG") src = el.currentSrc || el.src || "";
        if(/^(BUTTON|A|INPUT|LABEL)$/.test(el.tagName)) continue;
        if(/(^|\s)sd-panel(\s|$)/.test(name)) continue;   // a UI card (sd-panel--hero is the large card size, not a manager)
        if(!(name + " " + src.split("/").pop()).split(/\s+/).some(t => who.test(t))) continue;
        const r = el.getBoundingClientRect(); if(r.width < 20 || r.height < 20) continue;
        const cs = getComputedStyle(el); if(cs.display === "none" || cs.visibility === "hidden") continue;
        const why = [];
        const mask = cs.maskImage || cs.webkitMaskImage || ""; if(/gradient/.test(mask)) why.push("fade mask " + mask.slice(0, 70));
        if(cs.clipPath && cs.clipPath !== "none") why.push("clip-path " + cs.clipPath.slice(0, 50));
        if(parseFloat(cs.opacity) < 0.99) why.push("opacity " + cs.opacity);
        if(/blur|grayscale|sepia|brightness\(0?\.[0-8]/.test(cs.filter || "")) why.push("filter " + cs.filter);
        if(why.length) out.push(`<${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} class="${name.trim().slice(0, 50)}"> ${why.join("; ")}`);
    }
    return out;
}

// Which phone pictures are actually painted: the V2 plate must be the background, no old phone plate may be, and no
// OVL_*_PHONE cut-out may be painted anywhere.
function paintedArt(key){
    const seen = new Set(), backdrops = new Set();
    const vis = el => { for(let n = el; n && n.nodeType === 1; n = n.parentElement){ const cs = getComputedStyle(n); if(cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false; } const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
    for(const el of document.querySelectorAll("body *")){
        if(!vis(el)) continue;
        // A picture over at least 60% of the screen is a background (a card may keep an old plate as its texture).
        const r = el.getBoundingClientRect(), big = r.width * r.height >= 0.6 * innerWidth * innerHeight;
        const add = name => { name = name.split(/[?#]/)[0]; seen.add(name); if(big) backdrops.add(name); };
        if(el.tagName === "IMG" && el.currentSrc) add(el.currentSrc.split("/").pop());
        const bg = getComputedStyle(el).backgroundImage;
        for(const m of (bg || "").matchAll(/url\("?([^")]+)"?\)/g)) add(m[1].split("/").pop());
    }
    const list = [...seen];
    return { plate: [...backdrops].includes(`ENV_${key}_PHONE_V2.webp`), cutouts: list.filter(n => /^OVL_.*PHONE/i.test(n)), phoneV1: [...backdrops].filter(n => /^ENV_.*PHONE_V1/i.test(n)) };
}

const OLD_LOOK = ["LEAGUE", "STANDINGS", "RIVALRY", "TROPHY_ROOM"];
module.exports = { SCREENS, OLD_LOOK, openScreen };
if(require.main === module) (async () => {
    const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCREENS).filter(key => !OLD_LOOK.includes(key));
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    const results = {};
    try{
        for(const key of keys){
            if(!SCREENS[key]) throw new Error("unknown screen " + key);
            results[key] = { ok: true, lines: [] };
            for(const [w, h] of SIZES){
                const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
                const page = await context.newPage();
                const errors = [];
                page.on("pageerror", e => errors.push(e.message));
                await openScreen(page, key);
                const s = Math.max(w / IW, h / IH), ox = (w - IW * s) / 2;
                // drawn: the screens draw the plate cover + centre top (Team V's HO-031 instruction). tool: live_facecheck.cjs
                // places it cover + centred. Both agree whenever the screen is 9:16 or taller (393x852, 375x667, 360x640).
                const zonesAt = oy => ZONES[key].map(([a, c, d, e]) => [ox + a * IW * s, oy + c * IH * s, ox + d * IW * s, oy + e * IH * s]);
                const faces = zonesAt(0), toolFaces = zonesAt((h - IH * s) / 2);
                if(predict) await page.evaluate(() => { for(const el of document.querySelectorAll("body *")){ const src = (el.tagName === "IMG" ? el.currentSrc || "" : "") + " " + getComputedStyle(el).backgroundImage; if(/OVL_[A-Z_]*PHONE/.test(src)) el.style.setProperty("visibility", "hidden", "important"); } });
                const hits = await page.evaluate(faceHits, { faces, w, h });
                const toolHits = await page.evaluate(faceHits, { faces: toolFaces, w, h });
                const fades = await page.evaluate(fadedManagers);
                const art = await page.evaluate(paintedArt, key);
                const worst = {};
                hits.forEach(x => { const k = x.face + " " + x.tag + (x.id ? "#" + x.id : "") + " " + x.text; if(!worst[k] || worst[k].pct < x.pct) worst[k] = x; });
                const list = Object.values(worst).sort((a, b) => b.pct - a.pct);
                const artBad = !predict && (!art.plate || art.cutouts.length || art.phoneV1.length);
                const bad = list.length || fades.length || artBad || errors.length;
                if(bad) results[key].ok = false;
                let line = `${key} ${w}x${h}: ${bad ? "FAIL" : "OK"}`;
                line += list.slice(0, 8).map(x => `\n  - ${x.face}'s face ${x.pct}% under <${x.tag}${x.id ? "#" + x.id : ""} class="${x.cls}"> ${x.text ? JSON.stringify(x.text) : ""}`).join("");
                line += fades.map(f => `\n  - FADED/CUT manager: ${f}`).join("");
                if(!predict && !art.plate) line += `\n  - ENV_${key}_PHONE_V2 is not painted`;
                if(!predict && art.cutouts.length) line += `\n  - cut-outs still painted: ${art.cutouts.join(", ")}`;
                if(!predict && art.phoneV1.length) line += `\n  - old phone plate still painted: ${art.phoneV1.join(", ")}`;
                if(errors.length) line += `\n  - page errors: ${errors.join(" | ")}`;
                const toolOnly = toolHits.filter(t => !hits.some(x => x.face === t.face && x.tag === t.tag && x.cls === t.cls && x.text === t.text));
                if(toolOnly.length) line += `\n  note: with the tool's centred placement (not how the plate is drawn) also ` + [...new Set(toolOnly.map(x => `${x.face} ${x.pct}% under <${x.tag} class="${x.cls}">`))].join("; ");
                console.log(line);
                results[key].lines.push(line);
                if(shotDir){
                    fs.mkdirSync(shotDir, { recursive: true });
                    await page.evaluate(fs => fs.forEach(f => { const d = document.createElement("div");
                        Object.assign(d.style, { position: "fixed", left: f[0] + "px", top: f[1] + "px", width: (f[2] - f[0]) + "px", height: (f[3] - f[1]) + "px", outline: "3px solid #0ff", zIndex: 2147483647, pointerEvents: "none" });
                        document.body.appendChild(d); }), faces);
                    await page.screenshot({ path: path.join(shotDir, `FACECHECK_${key}_${w}x${h}.png`) });
                }
                await context.close();
            }
        }
    }finally{
        await browser.close();
    }
    const failed = Object.keys(results).filter(k => !results[k].ok);
    console.log(failed.length ? `phone marble face check: FAIL (${failed.join(", ")})` : `phone marble face check: PASS (${keys.join(", ")})`);
    process.exit(failed.length ? 1 : 0);
})().catch(error => { console.error(error && error.stack || error); process.exit(2); });
