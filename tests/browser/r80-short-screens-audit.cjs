"use strict";
// r80 short screens: Nik's rule is that nothing on any screen may be jammed, clipped or covered at any window size, every
// button must be reachable, and `main` is the only scroller. This audit opens each screen r80 changed with a Europa League
// career on it (Daniel and Nik both win the Champions League and the Europa League across three seasons) and checks, at
// every listed window size:
//   S1 no sideways scroll (the page and `main` are never wider than the window);
//   S2 no text runs into other text (text boxes of two different elements never intersect);
//   S3 no text is cut by its own box or by a clipping ancestor;
//   S4 every visible button, tab and link is hit by elementFromPoint at its centre once `main` scrolls it into view;
//   S5 nothing is hidden under a sticky or fixed bar: every text and button can be scrolled clear of them, and a sticky
//      bar never covers a panel when `main` is scrolled to its end.
// Any finding fails the run (exit 1) unless it is one of the LISTED design items below, each named with its reason.
// Screens open the way tests/browser/phone-marble-facecheck-audit.cjs opens them: the real renderers on the real app,
// fed read-only verified models (no Firebase service, no account; every request off the local origin is aborted).
// The Gate runs every screen at 1366x768, 1100x600, 1024x768, 844x390 and 393x660 (one test:browser audit per size, each
// inside the bundle's per-audit time limit); `npm run test:short-screens` is the full 13-size sweep, run by hand.
// Usage: node tests/browser/r80-short-screens-audit.cjs [SCREEN ...]
//   CMS_BASE_URL (default http://127.0.0.1:4173/), CMS_SHORT_SIZES="1100x600,393x660" (default: every size below),
//   CMS_SHORT_SHOTS=<dir> (one png per screen and size), CMS_SHORT_REPORT=<file> (JSON of every finding).
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const fixtures = require("../support/active-showdown-fixtures.cjs");
const { projection, result, finalFor } = require("../support/career-fixture-helpers.cjs");
const Career = require("../../js/sharedCareerAnalytics.js");
const activeAdapter = require("../../js/sharedActiveShowdownAdapter.js");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const shotDir = process.env.CMS_SHORT_SHOTS || "";
const reportFile = process.env.CMS_SHORT_REPORT || "";
const ALL_SIZES = ["1920x1080", "1536x864", "1366x768", "1366x640", "1280x650", "1100x600", "1024x768", "1024x600",
    "820x1180", "844x390", "393x660", "390x844", "360x740"];
const SIZES = (process.env.CMS_SHORT_SIZES ? process.env.CMS_SHORT_SIZES.split(",") : ALL_SIZES).map(s => s.split("x").map(Number));
const touchSize = (w, h) => w < 900 || h < 500;

// ---------- a Europa League career (three seasons, both managers win the CL and the EL) ----------
const SEASONS = [
    [result({ leaguePosition: 1, leaguePoints: 101, leagueGoals: 102, championsLeague: true, domesticCup: true, topScorer: true }), result({ leaguePosition: 3, leaguePoints: 80, europaLeague: true })],
    [result({ leaguePosition: 2, leaguePoints: 88, europaLeague: true }), result({ leaguePosition: 1, leaguePoints: 94, leagueGoals: 105, championsLeague: true })],
    [result({ leaguePosition: 1, leaguePoints: 98, domesticCup: true }), result({ leaguePosition: 2, leaguePoints: 86, europaLeague: true, topAssist: true })]
];
const fullCareer = projection({ seed: "e", totalSeasons: 3, seasons: SEASONS });
const career = Career.buildCareerModel({ indexStatus: "ready", showdowns: [{ rivalryId: fullCareer.rivalryId, classification: "completed", projection: fullCareer, final: finalFor(fullCareer) }] });

function showdownStorage(){
    const p = fullCareer, before = projection({ seed: "e", totalSeasons: 3, seasons: SEASONS.slice(0, 2) });
    const [own, opponent] = SEASONS[2];
    const at = "2026-10-01T12:00:00.000Z";
    const base = { schemaVersion: 2, integrityWarnings: [], name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, totalRounds: 3,
        selectedLeague: { id: "premier_league", name: "Premier League" }, clubs: { playerOne: "Arsenal", playerTwo: "Liverpool" },
        transferChallenges: [1, 2, 3].map(seasonNumber => ({ seasonNumber, status: "completed", signings: { playerOne: [], playerTwo: [] }, guesses: { againstPlayerOne: [], againstPlayerTwo: [] } })),
        createdAt: at, updatedAt: at };
    const completed = { ...base, id: "short-screens-completed", currentRound: 3, status: "Completed", score: { playerOne: p.managerRecords.playerOne.totalPoints, playerTwo: p.managerRecords.playerTwo.totalPoints },
        rounds: JSON.parse(JSON.stringify(p.seasonHistory)), completedAt: at, archivedAt: at };
    const active = { ...base, id: "short-screens-season-3", currentRound: 3, status: "Ready", score: { playerOne: before.managerRecords.playerOne.totalPoints, playerTwo: before.managerRecords.playerTwo.totalPoints },
        rounds: JSON.parse(JSON.stringify(before.seasonHistory)), completedAt: null, archivedAt: null };
    const common = { identity: fixtures.identity(), pair: fixtures.pair(p.rivalryId), multiSeason: fixtures.multiFor(before), history: fixtures.history(before), finalReconciliation: null, terminalClose: null };
    const entry = { ...common, seasonResults: fixtures.seasonResults({ rivalryId: p.rivalryId, seasonNumber: 3 }) };
    const ready = { ...common, seasonResults: fixtures.seasonResults({ rivalryId: p.rivalryId, seasonNumber: 3, phase: "RESULTS_READY", published: ["playerOne", "playerTwo"], own, opponent }) };
    const finished = { ...ready, pair: fixtures.pair(p.rivalryId, { status: "waiting", connectionState: "closed" }), multiSeason: fixtures.multiFor(p), history: fixtures.history(p),
        finalReconciliation: fixtures.finalReconciliation(p), terminalClose: fixtures.closed(p) };
    return { storage: { "careerModeShowdown.activeShowdown": JSON.stringify(active), "careerModeShowdown.legacyShowdowns": JSON.stringify([completed]) }, finishedStorage: { "careerModeShowdown.activeShowdown": JSON.stringify(active), "careerModeShowdown.legacyShowdowns": JSON.stringify([completed]) }, entry, ready, finished };
}
const showdown = showdownStorage();

// ---------- openers (each starts on a freshly loaded Home and leaves its screen shown) ----------
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
const careerOpen = (module, render) => page => page.evaluate(async ({ module, render, model }) => {
    await window.ensureGameplayModules();
    await loadRuntimeScript("career-screen-seam", "js/careerScreenSeam.js", () => Boolean(window.CareerModeCareerScreenSeam));
    await window.openOptionalModule(module);
    window[render]({ model });
}, { module, render, model: career });
const fillSeason = page => page.evaluate(() => {
    const s = window.__cmsSnapshot.seasonResults;
    for(const [prefix, r] of [["p1", s.ownResult], ["p2", s.opponentResult]]) for(const [field, value] of Object.entries(r || {})){
        const input = document.getElementById(prefix + field[0].toUpperCase() + field.slice(1));
        if(input){ if(input.type === "checkbox") input.checked = value; else input.value = String(value); }
    }
});

const SCREENS = {
    HOME: { host: "mainMenu", open: async () => {} },
    SETTINGS: { host: "settingsOverlay", visible: true, open: page => page.evaluate(() => window.openOptionalModule("settings")) },
    RULE_BOOK: { host: "ruleBook", open: page => page.evaluate(() => window.openOptionalModule("ruleBook")) },
    CONNECT_PLAYERS: { host: "connectPlayersScreen", visible: true, open: page => page.evaluate(async () => {
        if(!window.CareerModeConnectPlayersScreenV10) await loadRuntimeScript("layout-connect", "js/connectPlayersScreenV10.js", () => Boolean(window.CareerModeConnectPlayersScreenV10));
        await CareerModeConnectPlayersScreenV10.open({ sync: false });
    }) },
    LEGACY: { host: "legacy", open: careerOpen("legacy", "renderLegacy") },
    HISTORY: { host: "legacy", open: async page => { await careerOpen("legacy", "renderLegacy")(page); await page.waitForTimeout(1500); await page.getByRole("button", { name: /VIEW SEASON HISTORY/i }).first().click(); } },
    CAREER_STATISTICS: { host: "careerStatistics", open: careerOpen("careerStatistics", "openCareerStatistics") },
    TROPHY_ROOM: { host: "trophyRoom", open: careerOpen("trophyRoom", "openTrophyRoom") },
    RIVALRY: { host: "statistics", open: async page => { await seed(page, "finished"); await page.evaluate(async () => { await ensureOptionalModule("statistics"); window.openRivalryStatistics({ model: window.__cmsRivalryFixture }); }); } },
    STANDINGS: { host: "standings", open: async page => { await seed(page, "finished"); await page.evaluate(() => window.CareerModeV10Screens.navigate("standings")); } },
    FINAL_WINNER: { host: "seasonEntry", open: async page => { await seed(page, "finished"); await page.evaluate(() => window.openSeasonEntry()); } },
    SEASON_ENTRY: { host: "seasonEntry", open: async page => { await seed(page, "entry"); await page.evaluate(() => window.openSeasonEntry()); } },
    SEASON_REVIEW: { host: "seasonEntry", open: async page => { await seed(page, "ready"); await page.evaluate(() => window.openSeasonEntry()); await fillSeason(page); await page.evaluate(() => window.completeCurrentSeason()); } }
};

// Tabs: every tab of a screen is opened in turn (Trophy Room's six, the phone tabs of Career Statistics, Rivalry, Final
// Winner, Season Results and Connect Players, Standings' two views).
const TAB_SELECTOR = ".trophyTab,#sdgViewShowdown,#sdgViewCareer,[id^=rvTab],input.phoneTabControl,input.finalWinnerTabInput,input.season-phone-tab-input,input#connectPlayersDanielTab,input#connectPlayersNikTab,input#connectPlayersConnectionTab";
const tabsOf = (page, host) => page.evaluate(({ host, sel }) => [...document.getElementById(host).querySelectorAll(sel)].map((el, i) => ({ i, el, text: (el.innerText || (el.labels && el.labels[0] && el.labels[0].innerText) || el.id).trim().replace(/\s+/g, " ") }))
    .filter(t => { const target = t.el.labels && t.el.labels[0] || t.el; return target.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && target.getBoundingClientRect().width > 2; }).map(({ i, text }) => ({ i, text })), { host, sel: TAB_SELECTOR });

async function openScreen(page, key){
    const s = SCREENS[key];
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await waitForHome(page);
    await s.open(page);
    if(s.visible) await page.locator("#" + s.host).waitFor({ state: "visible", timeout: 20000 });
    else if(key !== "HOME") await page.waitForFunction(id => { const el = document.getElementById(id); return el && !el.classList.contains("hidden") && !el.hasAttribute("data-v10-pending") && window.getActiveScreenName() === id; }, s.host, { timeout: 20000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(2500);
}


// ---------- the checks (run in the page) ----------
function pageDiag({ host, touch }){
    const vw = innerWidth, vh = innerHeight, out = { hscroll: [], textOverlap: [], clipped: [], unreachable: [], covered: [], underBar: [], barOverPanel: [], scrollers: [] };
    const root = document.getElementById(host) || document.body;
    const name = el => { const id = el.id ? "#" + el.id : ""; const c = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""; return el.tagName.toLowerCase() + id + c; };
    const label = el => `${name(el)} "${(el.innerText || el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 40)}"`;
    const shown = el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getClientRects().length > 0;
    const inter = (a, b) => ({ w: Math.min(a.right, b.right) - Math.max(a.left, b.left), h: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) });
    const hits = (a, b, t = 1) => { const i = inter(a, b); return i.w > t && i.h > t; };
    const related = (a, b) => a === b || a.contains(b) || b.contains(a);
    const srOnly = el => { const r = el.getBoundingClientRect(); return r.width <= 2 || r.height <= 2; };
    // The screen's scroller: `main` (Settings is a dialog with its own <main>).
    const main = root.querySelector("main") || document.querySelector("#app > main") || document.querySelector("main");
    // S1 sideways scroll
    const de = document.documentElement;
    if(de.scrollWidth > vw + 1) out.hscroll.push(`page ${de.scrollWidth}px wide in ${vw}px`);
    // (a screen wider than `main` is clipped by it and cannot be scrolled sideways: off-canvas sheets are not a page scroll)
    for(const el of [main]) if(el && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "hidden" && getComputedStyle(el).overflowX !== "clip") out.hscroll.push(`${name(el)} ${el.scrollWidth}px wide in ${el.clientWidth}px`);
    // other scrollers inside the screen (main is the only scroller)
    for(const el of root.querySelectorAll("*")){ const cs = getComputedStyle(el); if(el.tagName !== "MAIN" && /(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && shown(el)) out.scrollers.push(`${name(el)} ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`); }
    // bars: visible fixed or sticky boxes that are not the screen or a full-window layer
    const all = [...document.querySelectorAll("body *")].filter(shown);
    const bars = all.filter(el => { const cs = getComputedStyle(el); if(!/^(fixed|sticky)$/.test(cs.position) || cs.pointerEvents === "none") return false; const r = el.getBoundingClientRect(); return r.width * r.height < vw * vh * 0.5 && r.width > 0 && r.height > 0 && !el.contains(root) && el.innerText && el.innerText.trim(); })
        .filter((el, _i, list) => !list.some(o => o !== el && o.contains(el)))
        .filter(el => { const r = el.getBoundingClientRect(); const x = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(vh - 1, Math.max(0, r.top + r.height / 2)); const hit = document.elementFromPoint(x, y); return hit && el.contains(hit); });
    const inBar = el => bars.some(b => b.contains(el));
    // text: every element with its own words
    const texts = [];
    for(const el of root.querySelectorAll("*")){
        // (decorative words marked aria-hidden still show on screen, so they count too)
        if(!shown(el) || srOnly(el)) continue;
        const nodes = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
        if(!nodes.length) continue;
        const rects = nodes.flatMap(n => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()]; }).filter(r => r.width > 1 && r.height > 1);
        if(rects.length) texts.push({ el, rects });
    }
    const clipBoxes = el => { const boxes = []; for(let a = el.parentElement; a && a !== document.body; a = a.parentElement){ const cs = getComputedStyle(a); if(/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) continue; if(cs.overflowX !== "visible" || cs.overflowY !== "visible" || cs.contain.includes("paint")) boxes.push({ el: a, r: a.getBoundingClientRect(), x: cs.overflowX !== "visible", y: cs.overflowY !== "visible" }); } return boxes; };
    const ink = (el, r) => { const fs = parseFloat(getComputedStyle(el).fontSize) || 12; const inset = Math.max(0, (r.height - fs * 0.75) / 2); return { left: r.left, right: r.right, top: r.top + inset, bottom: r.bottom - inset, width: r.width, height: r.height - 2 * inset }; };
    const scrollTo = el => el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    // the nearest scrolling box around an element (main, or a dialog's own main), and a rect cut to what that box shows
    const scrollerOf = el => { for(let a = el.parentElement; a && a !== document.body; a = a.parentElement){ const cs = getComputedStyle(a); if(/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) return a; } return null; };
    const shownPart = (el, r) => { const sc = scrollerOf(el); if(!sc) return r; const b = sc.getBoundingClientRect(); const left = Math.max(r.left, b.left), right = Math.min(r.right, b.right), top = Math.max(r.top, b.top), bottom = Math.min(r.bottom, b.bottom); return { left, right, top, bottom, width: right - left, height: bottom - top }; };
    // (sample points stay 2px inside the box, so an icon's transparent edge touching a 4px letter is not a cover)
    const freeOf = (el, rect, textOnly = false) => { const pts = [[0.5, 0.5], [0.15, 0.5], [0.85, 0.5]]; for(const [fx, fy] of pts){ const x = rect.left + Math.min(Math.max(rect.width * fx, Math.min(2, rect.width / 2)), rect.width - Math.min(2, rect.width / 2)), y = rect.top + rect.height * fy; if(x < 0 || y < 0 || x >= vw || y >= vh) return `off-window at ${Math.round(x)},${Math.round(y)}`; const hit = document.elementFromPoint(x, y); if(hit && !related(hit, el) && !(hit.closest("label") && hit.closest("label").control === el) && ![...(hit.labels || [])].some(l => l.contains(el)) && (!textOnly || paintsOver(hit, el, x, y))) return `under ${label(hit)}`; } return ""; };
    // whether a same-origin picture paints at a window point (object-fit fill, contain, cover and object-position as
    // percentages); undefined when it cannot tell (then the picture counts as painting)
    const imgOpaqueAt = (img, x, y) => { try{
        const nw = img.naturalWidth, nh = img.naturalHeight; if(!nw || !nh) return undefined;
        const cs = getComputedStyle(img), r = img.getBoundingClientRect(); const bw = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth), bh = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
        const left = r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), top = r.top + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth);
        let sx = bw / nw, sy = bh / nh; if(cs.objectFit === "contain" || cs.objectFit === "scale-down") sx = sy = Math.min(sx, sy); else if(cs.objectFit === "cover") sx = sy = Math.max(sx, sy); else if(cs.objectFit === "none") sx = sy = 1;
        const pos = cs.objectPosition.split(" ").map(v => v.endsWith("%") ? parseFloat(v) / 100 : NaN); if(pos.some(Number.isNaN)) return undefined;
        const ox = left + (bw - nw * sx) * pos[0], oy = top + (bh - nh * sy) * pos[1];
        const px = Math.floor((x - ox) / sx), py = Math.floor((y - oy) / sy); if(px < 0 || py < 0 || px >= nw || py >= nh) return false;
        const c = document.createElement("canvas"); c.width = 1; c.height = 1; const g = c.getContext("2d"); g.drawImage(img, px, py, 1, 1, 0, 0, 1, 1); return g.getImageData(0, 0, 1, 1).data[3] > 24;
    }catch(_e){ return undefined; } };
    // For text, a box above it counts only when it paints (a fill, a picture or a border) or carries words of its own there.
    const paintsOver = (hit, el, x, y) => { const stop = [...(function*(){ for(let a = el; a; a = a.parentElement) yield a; })()].find(a => a.contains(hit)) || document.body;
        for(let a = hit; a && a !== stop; a = a.parentElement){ const cs = getComputedStyle(a); const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); const alpha = m ? (m[1].split(",")[3] === undefined ? 1 : parseFloat(m[1].split(",")[3])) : 0;
            // (a picture counts where it is opaque: icons and trophies keep a transparent margin round their boxes)
            if(a.tagName === "IMG"){ const op = imgOpaqueAt(a, x, y); if(op !== false) return true; continue; }
            // (inside an svg the hit is the shape that paints there; the svg element itself is hit only where no shape is)
            if(a.ownerSVGElement && a === hit) return true;
            if(a.tagName === "svg"){ if(a === hit && !(alpha > 0.15 || cs.backgroundImage !== "none")) continue; return true; }
            if(/^(CANVAS|VIDEO)$/.test(a.tagName)){ const i = inter(a.getBoundingClientRect(), el.getBoundingClientRect()); if(i.w >= 3 && i.h >= 3) return true; continue; }
            if(alpha > 0.15 || cs.backgroundImage !== "none") return true;
            for(const n of a.childNodes){ if(n.nodeType !== 3 || !n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); for(const q of r.getClientRects()){ const k = ink(a, q); if(x >= k.left && x <= k.right && y >= k.top && y <= k.bottom) return true; } } }
        return false; };
    const contentTexts = texts.filter(t => !inBar(t.el));
    const top0 = main ? main.scrollTop : 0;
    if(main) main.scrollTop = 0; scrollTo(root); if(main) main.scrollTop = 0;
    // S2 text into text (layout, not scroll, decides this; bars are left to S5)
    for(let i = 0; i < texts.length; i++) for(let j = i + 1; j < texts.length; j++){
        const a = texts[i], b = texts[j]; if(related(a.el, b.el) || inBar(a.el) !== inBar(b.el)) continue;
        for(const ra of a.el.getClientRects().length ? [...(() => { const out = []; for(const n of a.el.childNodes) if(n.nodeType === 3 && n.textContent.trim()){ const r = document.createRange(); r.selectNodeContents(n); out.push(...r.getClientRects()); } return out; })()] : []){
            let hit = false;
            for(const n of b.el.childNodes){ if(n.nodeType !== 3 || !n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); for(const rb of r.getClientRects()){ let ka = ink(a.el, ra), kb = ink(b.el, rb);
                // words in two different scrolling boxes only meet where both boxes show them
                if(scrollerOf(a.el) !== scrollerOf(b.el)){ ka = shownPart(a.el, ka); kb = shownPart(b.el, kb); if(ka.width <= 0 || ka.height <= 0 || kb.width <= 0 || kb.height <= 0) continue; }
                if(hits(ka, kb, 1)){ hit = true; break; } } if(hit) break; }
            if(hit){ out.textOverlap.push(`${label(a.el)} x ${label(b.el)}`); break; }
        }
    }
    // S3 clipped text (words that `main` has scrolled out of view are first scrolled back into it)
    for(const t of texts){
        const cs = getComputedStyle(t.el);
        { const sc = scrollerOf(t.el); if(sc){ const r = t.el.getBoundingClientRect(), b = sc.getBoundingClientRect(); if(r.top < b.top || r.bottom > b.bottom) scrollTo(t.el); } }
        if(cs.textOverflow === "ellipsis" && t.el.scrollWidth > t.el.clientWidth + 1){ out.clipped.push(`${label(t.el)} ends in ... (${t.el.scrollWidth}>${t.el.clientWidth})`); continue; }
        let box = t.el; while(box.parentElement && getComputedStyle(box).display === "inline") box = box.parentElement;
        { const r = document.createRange(); r.selectNodeContents(t.el); const tr = ink(t.el, r.getBoundingClientRect()), br = box.getBoundingClientRect();
          if(tr.left < br.left - 1 || tr.right > br.right + 1) out.clipped.push(`${label(t.el)} runs out of ${name(box)} (${Math.round(tr.left)}-${Math.round(tr.right)} in ${Math.round(br.left)}-${Math.round(br.right)})`); }
        const boxes = clipBoxes(t.el); if(!boxes.length) continue;
        const r = document.createRange(); r.selectNodeContents(t.el); const tr = r.getBoundingClientRect();
        for(const b of boxes){ const fully = (b.x ? tr.left < b.r.left - 1 || tr.right > b.r.right + 1 : false) || (b.y ? tr.top < b.r.top - 3 || tr.bottom > b.r.bottom + 3 : false); const seen = inter(tr, b.r); if(fully && seen.w > 0 && seen.h > 0){ out.clipped.push(`${label(t.el)} cut by ${name(b.el)}`); break; } }
    }
    // S4 + S5: every control and text scrolled into view is hit at its centre and clear of the bars
    const controls = [...root.querySelectorAll("button,[role=tab],[role=button],a[href],select,input:not([type=hidden]),textarea,label[for],label.trophyPhoneMoreButton")].filter(el => shown(el) && !srOnly(el));
    for(const el of controls){
        scrollTo(el); const r = el.getBoundingClientRect(); const why = freeOf(el, r);
        if(why) out.unreachable.push(`${label(el)} ${why}`);
        else if(!inBar(el)) for(const b of bars) if(!related(b, el) && hits(r, b.getBoundingClientRect(), 1)){ out.underBar.push(`${label(el)} under ${label(b)}`); break; }
    }
    for(const t of contentTexts){
        scrollTo(t.el); const r = document.createRange(); r.selectNodeContents(t.el); const tr = r.getBoundingClientRect(); if(tr.width < 2 || tr.height < 2) continue;
        for(const b of bars) if(!related(b, t.el) && hits(tr, b.getBoundingClientRect(), 1)){ out.underBar.push(`${label(t.el)} under ${label(b)}`); break; }
        // (decorative words that let taps through are hit-tested for the check, so a layer under them is not taken for one above)
        if(t.rects.length){ const passThrough = getComputedStyle(t.el).pointerEvents === "none", inline = t.el.style.getPropertyValue("pointer-events"), prio = t.el.style.getPropertyPriority("pointer-events");
            if(passThrough) t.el.style.setProperty("pointer-events", "auto", "important");
            const why = freeOf(t.el, ink(t.el, tr), true);
            if(passThrough){ if(inline) t.el.style.setProperty("pointer-events", inline, prio); else t.el.style.removeProperty("pointer-events"); }
            if(why && !why.startsWith("off-window")) out.covered.push(`${label(t.el)} ${why}`); }
    }
    // S5 at the top and at the end of main: a docked bar never sits on a panel
    // A bar docked at the top is checked with main at its top; a bar docked at the bottom with main at its end and, on a
    // desktop window (a one-window layout), also at its top.
    if(main) for(const where of ["top", "end"]){
        main.scrollTop = where === "top" ? 0 : main.scrollHeight;
        const docked = b => { const r = b.getBoundingClientRect(); return r.top + r.height / 2 < vh / 2 ? "top" : "bottom"; };
        const panels = [...root.querySelectorAll("*")].filter(el => { if(!shown(el) || inBar(el) || getComputedStyle(el).pointerEvents === "none") return false; const cs = getComputedStyle(el); const paints = (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== "none"; const r = el.getBoundingClientRect(); const words = (el.innerText || "").trim();
            // a picture backdrop (no words, the picture fills the box) is scenery the bars are drawn over, not a panel
            const backdrop = !words && (/^(PICTURE|IMG)$/.test(el.tagName) || [...el.querySelectorAll("img,picture")].some(pic => { const q = pic.getBoundingClientRect(); return q.width * q.height >= r.width * r.height * 0.9; }));
            return paints && r.width * r.height < vw * vh * 0.6 && r.width > 40 && r.height > 24 && (words || el.querySelector("img")) && !backdrop; });
        // A docked band (an opaque strip as wide as its panel, as Settings DONE and the 1920x1080 review actions) is the approved
        // way to keep actions in reach on a page that scrolls: content passes under it while main scrolls, and S5 above
        // proves every line can be scrolled clear of it. A floating button docked on a one-window desktop layout is not a band.
        const band = b => { const cs = getComputedStyle(b), r = b.getBoundingClientRect(), pr = b.parentElement.getBoundingClientRect(); return (cs.backgroundImage !== "none" || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) && r.width >= pr.width * 0.9 - 24; };
        // A bar that paints nothing itself (a clear strip holding chips or buttons) covers a panel only where its painted
        // parts are.
        const paintsBox = el => { const cs = getComputedStyle(el); return cs.backgroundImage !== "none" || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0 || /^(IMG|svg|CANVAS|VIDEO)$/.test(el.tagName); };
        const barParts = b => paintsBox(b) ? [b] : [...b.querySelectorAll("*")].filter(el => shown(el) && paintsBox(el));
        for(const b of bars){ const side = docked(b); if(where === "top" ? side === "bottom" && (touch || band(b)) : side === "top") continue; const parts = barParts(b); const br = b.getBoundingClientRect(); for(const p of panels) if(!related(p, b) && !bars.some(o => related(o, p)) && parts.some(part => hits(part.getBoundingClientRect(), p.getBoundingClientRect(), 2))){ out.barOverPanel.push(`${where}: ${label(b)} over ${label(p)} (${Math.round(inter(br, p.getBoundingClientRect()).h)}px)`); } }
    }
    if(main) main.scrollTop = top0;
    for(const k of Object.keys(out)) out[k] = [...new Set(out[k])];
    return out;
}

// Findings that need a design change rather than a fix (listed in the r80 short-screens PR, not built). Each item names the
// screen, the window sizes and the exact finding it covers; anything else fails the audit.
const desktop = f => Number(f.size.split("x")[0]) >= 901;
const LISTED = [
    { why: "Home: Team V's two decorative foot strips (01 TWO MANAGER CAREER COMPETITION · 02 FIFA 17 ERA RULESET · READY, and " +
           "FOOTBALL BRINGS US TOGETHER) sit wholly under the app's opaque version footer on desktop windows, so they have never " +
           "shown in the approved look; showing them means moving the footer or the strips (a design change)",
      test: f => f.view === "HOME" && desktop(f) && f.kind === "covered" && /^(span "0[12] |b "0[12]"|strong "READY"|span "FOOTBALL BRINGS US TOGETHER")/.test(f.what) && /under footer "Career Mode Showdown/.test(f.what) },
    { why: "Home: the soundtrack artist credit ends in … on one line, the approved short-desktop look (1280x650, 1366x768) that " +
           "r80 also uses where the credit ran into the status line and PLAY TRACK (1024x768, 1100x600, 1024x600, 1366x640)",
      test: f => f.view === "HOME" && desktop(f) && f.kind === "clipped" && /^p\.menuMusicArtist "Behzad Leito/.test(f.what) && / ends in \.\.\. /.test(f.what) },
    { why: "Rule Book on sideways phones (844x390): JOB-1731's adopted one-viewport study shows one section card at a time and " +
           "only the inside of that card scrolls; making main the only scroller there means redesigning that layout",
      test: f => f.view.startsWith("RULE_BOOK") && f.size === "844x390" && ((f.kind === "scrollers" && /^article\.ruleSection\.sd-panel /.test(f.what)) || (f.kind === "clipped" && / cut by div#ruleBookSections\.ruleBookGrid$/.test(f.what))) }
];

module.exports = { LISTED, pageDiag, SCREENS, SIZES, openScreen, showdown, career };

if(require.main === module){
    (async () => {
        const report = [];
        const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCREENS);
        const browser = await chromium.launch({ headless: true, ...await resolveChromiumRuntime() });
        try{
            for(const [w, h] of SIZES){
                const touch = touchSize(w, h);
                const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch });
                await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
                const page = await context.newPage();
                const errors = []; page.on("pageerror", e => errors.push(e.message));
                for(const key of keys){
                    await openScreen(page, key);
                    for(const tab of [null, ...await tabsOf(page, SCREENS[key].host)]){
                    const view = tab ? `${key}[${tab.text}]` : key;
                    if(tab){ await page.evaluate(({ host, i, sel }) => { const el = document.getElementById(host).querySelectorAll(sel)[i]; (el.labels && el.labels[0] || el).click(); }, { host: SCREENS[key].host, i: tab.i, sel: TAB_SELECTOR }); await page.waitForTimeout(900); }
                    if(shotDir){ fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `${view.replace(/[^A-Z0-9_-]+/gi, "_")}-${w}x${h}.png`) }); }
                    const d = await page.evaluate(pageDiag, { host: SCREENS[key].host, touch });
                    if(errors.length) d.pageErrors = errors.splice(0);
                    const bad = Object.entries(d).filter(([k, v]) => v.length);
                    for(const [kind, list] of bad) for(const what of list) report.push({ view, size: `${w}x${h}`, kind, what });
                    console.log(`${bad.length ? "FINDING" : "ok"} ${view} ${w}x${h}${bad.map(([k, v]) => `\n   ${k}: ${v.join("\n      ")}`).join("")}`);
                    }
                }
                await context.close();
            }
        }finally{ await browser.close(); }
        const listed = report.filter(f => LISTED.some(item => item.test(f))), open = report.filter(f => !LISTED.some(item => item.test(f)));
        if(reportFile) fs.writeFileSync(reportFile, JSON.stringify({ open, listed: listed.map(f => ({ ...f, why: LISTED.find(item => item.test(f)).why })) }, null, 2));
        for(const f of open) console.log(`OPEN ${f.view} ${f.size} ${f.kind}: ${f.what}`);
        console.log(`r80 short screens: ${open.length} finding(s), ${listed.length} listed design item(s)`);
        if(open.length) process.exitCode = 1;
    })().catch(error => { console.error(error); process.exit(1); });
}
