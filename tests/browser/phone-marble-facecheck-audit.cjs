// Face check (HO-031, r78 phone marble; moved to Team V's handcrafted HC V3 rooms in r91; widened in r91 "art to 100" from
// upright phones to every window: Nik 2026-11-12 "no touching faces" on phones, tablets and desktop alike).
// Every manager screen draws a room with both managers painted in (visual-assets/v10_1/plates-hc/ENV_<ROOM>_{PLATE,PHONE}_HC_V3).
// This opens each screen the way the other tests/browser audits do and fails when, at any size below:
//   F1 1% or more of a manager's face is painted over (measured two ways, see "How a face is measured");
//   F2 a face is not on screen, or no HC V3 room is drawn;
//   F3 a manager layer is faded, clipped or filtered; on upright phones also: the room is not the backdrop, an OVL_*_PHONE
//      cut-out or a V1 phone plate is painted, or something opaque sits between the room and the player at a face.
// Where the faces are: each drawn room is swapped for a same-size marker picture with a red (Daniel) and blue (Nik) box on
// each face (tests/fixtures/team-v/HC_FACE_ZONES.json), everything else is hidden for one screenshot, and the marker boxes
// are read back from that screenshot. So the faces are placed exactly as the screen draws the room (any size, position,
// crop or scroll), with no copy of the layout in this file.
// How a face is measured: (a) pixels: the face is photographed as the player sees it and again with everything but the room
// hidden; every patch that differs (by more than INK levels) is paint on the face, whatever drew it (a letter, a picture, a
// shadow, a ::before, a dimming layer). (b) boxes: a solid element (a filled panel, a button) covers its whole box, even
// where its colour happens to match the face. Either one at 1% of the face fails.
//   F4 Final Winner only (bug hunt F1, r91): with both Special Player chips shown, as every Showdown since r86 shows them
//      (the seeded one carries none), a total or a chip runs off the screen, lies under something, the two chips cross, or
//      the totals stand less than 6px above the summary panel under them. See finalWinnerResultClear.
//   F5 League wheel only (Nik 2026-11-13: the league marks are back, and "league words should fit within each slice of
//      pie neatly while steady and spinning"): every name and mark is fixed to its slice (it turns with the wheel, so
//      what fits at rest fits at every angle of the spin), stays 3px or more inside the slice's two dividers and off the
//      hub, and ends before the rim art; every slice shows its mark, 10px or larger. See leagueWheelSlicesClear.
//   F6 every screen with Special Player chips (r91): the audit gives both managers a Special Player (one short name, one of
//      the longest), so every chip screen is drawn as a real Showdown since r86 draws it; the seeded data alone carries
//      none, which is how the first phone and tablet recheck missed them. A chip then fails when it runs off the side of
//      the screen, lies under something, crosses another chip, lies on other words, has any part set under 12px, has
//      its name cut short (no ellipsis: where a name cannot fit, the chip is the short "SP · surname"), or (Rivalry
//      Statistics) its manager's block leaves its panel or reaches the rows under it. Season Results draws its chips
//      from the live Showdown, which the seeded page has none of, so seasonResultsChips places them as the app does.
//      See specialPlayerFixture, seasonResultsChips and specialPlayerChipsClear.
// Sizes (CMS_FACECHECK_GROUP; desk-short = three short desktop windows, CMS_FACECHECK_DESKTOP=1 opens any sizes as a desktop window): touch-up = phone and tablet upright; touch-side = phone and tablet sideways; desk = both
// Chromebook windows (1920x866 windowed, 1920x1035 full screen); more = a small and a large upright phone; phone = Team V's
// four upright phones; full (default) = all of them. The Gate runs touch-up, touch-side and desk (one test:browser audit
// each, inside the per-audit time limit); `npm run test:faces` is the full grid, run by hand.
// CMS_FACECHECK_SIZES="430x932,1366x768" overrides the group. Sizes under 1300 wide open as a phone or tablet (touch, 2x),
// one fresh context per size; wider ones open once per screen in a desktop window that is then resized.
// KNOWN lists face rows that wait for a change in another thread, each with its owner; WAITING lists screens that wait for
// Team V art. Both may only shrink. CMS_FACECHECK_PREDICT=1 hides the cut-outs and skips the art check.
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

const HC_ZONES = require("../fixtures/team-v/HC_FACE_ZONES.json").plates;
const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const shotDir = process.env.CMS_FACECHECK_SHOTS || "";
// CMS_FACECHECK_PREDICT=1 (for a build before the swap): hide the cut-outs and skip the plate check, to see which UI
// would cover the painted faces.
const predict = process.env.CMS_FACECHECK_PREDICT === "1";
const GROUPS = {
    "touch-up": ["390x844", "820x1180"],                    // phone and tablet, upright
    "touch-side": ["844x390", "1180x820"],                  // phone and tablet, sideways
    desk: ["1920x866", "1920x1035"],                        // Nik's Chromebook: windowed and full screen
    more: ["360x640", "430x932"],                           // a small and a large upright phone
    phone: ["393x852", "393x660", "375x667", "360x640"]     // Team V's four upright phones (HO-031)
};
GROUPS.full = [...new Set(Object.values(GROUPS).flat())];
GROUPS["desk-short"] = ["1200x499", "1366x480", "1600x480"]; // desktop windows, no touch, wide and under 500 px tall (after full; the desk group also runs Final Winner at these three)
const group = process.env.CMS_FACECHECK_GROUP || "full";
if(!process.env.CMS_FACECHECK_SIZES && !GROUPS[group]) throw new Error(`Unknown CMS_FACECHECK_GROUP ${group}`);
const SIZES = (process.env.CMS_FACECHECK_SIZES ? process.env.CMS_FACECHECK_SIZES.split(",") : GROUPS[group]).map(s => s.split("x").map(Number));
// desk-short (r92-04): a desktop window, no touch, wide and under 500 px tall (the Final Winner short form); the 1200 and 1366 widths
// would otherwise open as a tablet.
const DESK_ONLY = process.env.CMS_FACECHECK_DESKTOP === "1" || (!process.env.CMS_FACECHECK_SIZES && group === "desk-short");
const touchSize = w => !DESK_ONLY && w < 1300;
const uprightPhone = (w, h) => w < 600 && h > w;
// F1: the share of a face that may be painted over, and how far a pixel must move (0-255, any channel) to count as paint.
// 16 levels keeps the shared film grain (sd-stage__grain, about 4 levels) out and still sees dark type on a dark jacket.
const FACE_LIMIT_PCT = 1, INK = Number(process.env.CMS_FACECHECK_INK) || 16;
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
        // The fixtures below replace the game's own Shared Journey modules on window. The page loads those files in the background
        // (js/ssjr.js); one replaced before it installed it counts as a lost game file, and since R92-05 that sends the page back to
        // Home (cmsBootFail), so the screen under test never draws. Wait until the modules have loaded and installed, then replace.
        const lazy = ["CareerModeProductionSharedMultiSeasonProgression", "CareerModeProductionSharedHistoryConvergence", "CareerModeProductionSharedFinalReconciliation", "CareerModeProductionSharedTerminalClose", "CareerModeProductionSharedSeasonResults"];
        const loadedBy = Date.now() + 20000;
        while(lazy.some(n => !(window[n] && typeof window[n].install === "function")) && Date.now() < loadedBy) await new Promise(r => setTimeout(r, 50));
        await new Promise(r => setTimeout(r, 400));
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
    // r90 W8 (js/ssjr.js): the shared chain, the real transfer module included, can load after Home; let it land before the stand-in below (#1336).
    TRANSFER: { host: "transferChallenge", open: async page => { await page.evaluate(()=>window.CareerModeSharedJourneyReady?.());await page.waitForFunction(()=>Boolean(window.CareerModeProductionSharedTransferChallenge),null,{timeout:30000}); return page.evaluate(async () => {
        await window.ensureGameplayModules();
        const now = new Date().toISOString();
        currentShowdown = normalizeShowdown({ schemaVersion: 2, id: "phone-marble-transfer", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, totalRounds: 3, currentRound: 1, status: "Ready", selectedLeague: { id: "premier_league", name: "Premier League" }, clubs: { playerOne: "Arsenal", playerTwo: "Liverpool" }, score: { playerOne: 0, playerTwo: 0 }, transferChallenges: [], rounds: [], integrityWarnings: [], createdAt: now, updatedAt: now, completedAt: null, archivedAt: null });
        currentShowdown.transferChallenges.push(createTransferChallenge(1)); // read-only: the audit never saves
        await loadRuntimeScript("v10-transfer", "js/transferScreenV10.js", () => Boolean(window.CareerModeTransferScreenV10));
        // Team V's Transfer War skin draws only for a shared challenge: substitute a read-only provider view (an open window).
        window.CareerModeProductionSharedTransferChallenge = { isActive: () => true, canRoute: () => true, getState: () => ({ managerRole: "playerOne", seasonNumber: 1, state: { phase: "WINDOW_OPEN" } }) };
        await window.CareerModeTransferScreenV10.install();
        window.openTransferChallenge();
    }); } },
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

// Same element walks as live_facecheck.cjs (factory/v1-wtt5ye). Two changes in the fade walk: a UI card (.sd-panel) is not
// a manager even when its size class is sd-panel--hero (its corner-cut clip-path is the card's shape), and an element
// that paints no picture (no img, no url() background, no img inside) is not a manager layer.
function faceHits({ faces, names, w, h }){
    const out = [];
    const visible = el => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05; };
    const drawsSomething = el => { const cs = getComputedStyle(el);
        const bg = cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor);
        const bgImg = cs.backgroundImage && cs.backgroundImage !== "none";
        const border = parseFloat(cs.borderTopWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.borderTopColor);
        const text = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        return bg || bgImg || border || text || /^(IMG|SVG|CANVAS|BUTTON|INPUT|VIDEO)$/.test(el.tagName.toUpperCase()); };
    const cls = el => String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "");
    // Solid: the element fills its box (a colour at half strength or more, a control, a canvas), so its box is what covers.
    // Anything else covers only where its ink falls, which the pixel measure reads: bare type, a hairline border, a
    // see-through tint or gradient (Legacy's legacyPhoneFaceBand), and a picture, which can be see-through or sit smaller
    // than its box (a title <img> with object-fit: scale-down).
    const solid = el => { const cs = getComputedStyle(el);
        const a = (/rgba?\(([^)]+)\)/.exec(cs.backgroundColor || "") || [, "0,0,0,0"])[1].split(",").map(Number);
        return (a.length < 4 ? 1 : a[3]) >= 0.5 || /^(CANVAS|BUTTON|INPUT|VIDEO|SELECT|TEXTAREA)$/.test(el.tagName.toUpperCase()); };
    // The one narrow exception to the box test (the League wheel): a true circle is tested as its disc, not its square box.
    // A true circle is a near-square border box (offsetWidth / offsetHeight within 2% of each other) whose four corner
    // radii are all at least half its side (border-radius: 50%). A pill or capsule (border-radius: 999px on a wide box),
    // an ellipse, a corner-cut card and anything else keep the box test. The disc is centred on the painted rect, its
    // radius is half the longer side, and a 2D transform scales it (rotation does not move a circle).
    const round = (el, r) => { if(!(el instanceof HTMLElement)) return null;
        const cs = getComputedStyle(el), w = el.offsetWidth, h = el.offsetHeight; if(!(w > 0 && h > 0)) return null;
        if(Math.abs(w - h) > .02 * Math.max(w, h)) return null;
        const half = v => { const [a, b = a] = v.split(" "); const px = (t, d) => t.endsWith("%") ? parseFloat(t) / 100 * d : parseFloat(t); return px(a, w) >= w / 2 - .01 && px(b, h) >= h / 2 - .01; };
        if(![cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].every(half)) return null;
        let k = 1;
        if(cs.transform && cs.transform !== "none"){
            const m = /^matrix\(([^)]+)\)$/.exec(cs.transform); if(!m) return null;
            const [a, b, c, d] = m[1].split(",").map(Number); k = Math.sqrt(Math.abs(a * d - b * c));
        }
        const rad = Math.max(w, h) / 2 * k;
        return { cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, rx: rad, ry: rad }; };
    // A label that paints only its text (no fill, picture or border) covers only its glyphs, not its line box: its rect is
    // the union of its own text runs (r91: the League's "SPIN TO PICK THE LEAGUE" line box ends inside the hair above Nik's
    // face while the letters stay clear of it).
    const textOnly = el => { const cs = getComputedStyle(el);
        return !/^(IMG|SVG|CANVAS|BUTTON|INPUT|VIDEO|SELECT|TEXTAREA)$/.test(el.tagName.toUpperCase()) && (!cs.backgroundColor || /rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor))
            && (!cs.backgroundImage || cs.backgroundImage === "none") && !(parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderRightWidth) > 0)
            && (!cs.boxShadow || cs.boxShadow === "none") && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && ![...el.children].length; };
    const glyphRect = el => { const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect(); range.detach(); return r; };
    const room = document.querySelector("[data-hc-face-room]");
    // Decorative layers and most rooms are pointer-events: none, which hides them from elementsFromPoint.
    const probe = room ? document.createElement("style") : null; if(probe){ probe.textContent = "*{pointer-events:auto!important}"; document.head.appendChild(probe); }
    for(const el of document.querySelectorAll("body *")){
        const r = textOnly(el) ? glyphRect(el) : el.getBoundingClientRect();
        if(r.width < 2 || r.height < 2 || r.width * r.height > 0.6 * w * h) continue;
        if(!visible(el) || !drawsSomething(el)) continue;
        if(/cutout|manager|portrait|plate|backdrop|stage-art|background/i.test(cls(el))) continue;
        const disc = round(el, r);
        faces.forEach((f, i) => {
            let ix = Math.min(r.right, f[2]) - Math.max(r.left, f[0]), iy = Math.min(r.bottom, f[3]) - Math.max(r.top, f[1]);
            let cx = (Math.max(r.left, f[0]) + Math.min(r.right, f[2])) / 2, cy = (Math.max(r.top, f[1]) + Math.min(r.bottom, f[3])) / 2, area = ix * iy;
            if(disc && ix > 2 && iy > 2){
                // A round element covers only its disc: the overlap is the part of the zone inside the ellipse, sampled every
                // half pixel, with the same > 2px rule on its extent; the hit test probes the overlap's centroid.
                const x0 = Math.max(r.left, f[0]), y0 = Math.max(r.top, f[1]), x1 = Math.min(r.right, f[2]), y1 = Math.min(r.bottom, f[3]);
                let n = 0, sx = 0, sy = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                for(let y = y0 + .25; y < y1; y += .5) for(let x = x0 + .25; x < x1; x += .5){
                    if(((x - disc.cx) / disc.rx) ** 2 + ((y - disc.cy) / disc.ry) ** 2 > 1) continue;
                    n++; sx += x; sy += y; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                }
                ix = n ? maxX - minX + .5 : 0; iy = n ? maxY - minY + .5 : 0; area = n * .25;
                if(n){ cx = sx / n; cy = sy / n; }
            }
            // On top: with a room on screen, the element (or something inside it) must be painted above the room at the
            // overlap; a box that holds the room, or lies under it (the scene's own frame, <main> behind a fixed room), covers
            // nothing. With no room (the self-test) the old rule stands: it is the top element there.
            const onTop = () => { const st = document.elementsFromPoint(cx, cy); if(!st.length) return false;
                if(!room) return st[0] === el || el.contains(st[0]) || st[0].contains(el);
                if(el === room || el.contains(room)) return false;
                const ri = st.indexOf(room), ei = st.findIndex(t => t === el || el.contains(t));
                return ei >= 0 && (ri < 0 || ei < ri); };
            if(ix > 2 && iy > 2 && onTop()) out.push({ face: (names && names[i]) || (i % 2 ? "Nik" : "Daniel"), tag: el.tagName.toLowerCase(), id: el.id, cls: cls(el).slice(0, 60), text: (el.innerText || "").trim().slice(0, 40),
                share: 100 * area / ((f[2] - f[0]) * (f[3] - f[1])), pct: Math.round(100 * area / ((f[2] - f[0]) * (f[3] - f[1]))), solid: solid(el) });
        });
    }
    if(probe) probe.remove();
    return out;
}

// The plate must really show at each face: at the centre of every zone, the stacked elements above the one that paints
// the plate may not paint an opaque colour, another picture or an image (a full-screen layer with a solid background
// would hide the managers while the plate is still "painted").
function plateCovered({ faces, names, plateName }){
    const out = [];
    // Decorative layers are pointer-events:none, which hides them from elementsFromPoint; let every element be hit for
    // the duration of this check.
    const probe = document.createElement("style"); probe.textContent = "*{pointer-events:auto!important}"; document.head.appendChild(probe);
    const paintsPlate = el => { const src = (el.tagName === "IMG" ? el.currentSrc || el.src || "" : "") + " " + (getComputedStyle(el).backgroundImage || "");
        return src.split(/[?#")\s]/).some(part => /^ENV_/.test(part.split("/").pop()) && part.split("/").pop().replace(/_590W(?=\.webp$)/, "").replace(/\.webp$/, "") === plateName); };
    faces.forEach((f, i) => {
        const cx = (f[0] + f[2]) / 2, cy = (f[1] + f[3]) / 2;
        for(const el of document.elementsFromPoint(cx, cy)){
            if(paintsPlate(el)) return;
            const cs = getComputedStyle(el), a = (/rgba?\(([^)]+)\)/.exec(cs.backgroundColor) || [, "0,0,0,0"])[1].split(",").map(Number);
            const opaque = (a.length < 4 ? 1 : a[3]) >= 0.5;
            if(parseFloat(cs.opacity) < 0.5) continue;   // a faint texture (the shared sd-stage__grain) does not hide the men
            if(opaque || /url\(/.test(cs.backgroundImage || "") || el.tagName === "IMG"){
                out.push(`${(names && names[i]) || (i % 2 ? "Nik" : "Daniel")}: plate hidden by <${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} class="${String(el.className).slice(0, 50)}">`);
                return;
            }
        }
        out.push(`${(names && names[i]) || (i % 2 ? "Nik" : "Daniel")}: no plate under the face`);
    });
    probe.remove();
    return out;
}

function fadedManagers(){
    const out = [], who = /^(.*hero.*|.*cutout.*|manager.*|.*daniel.*|nik|nik[-_].*|.*[-_]nik|.*portrait.*|ovl_.*)$/i;
    for(const el of document.querySelectorAll("body *")){
        const name = (el.id || "") + " " + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "");
        let src = ""; if(el.tagName === "IMG") src = el.currentSrc || el.src || "";
        if(/^(BUTTON|A|INPUT|LABEL)$/.test(el.tagName)) continue;
        if(/(^|\s)sd-panel(\s|$)/.test(name)) continue;   // a UI card (sd-panel--hero is the large card size, not a manager)
        // A manager layer paints a picture. A glow with "hero" in its name (Trophy Room's heroSpotlight: a gradient and
        // no image) is lighting, not a manager.
        if(el.tagName !== "IMG" && !/url\(/.test(getComputedStyle(el).backgroundImage || "") && !el.querySelector("img")) continue;
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

// Which phone pictures are actually painted: the HC V3 room must be the background, no old phone plate may be, and no
// OVL_*_PHONE cut-out may be painted anywhere.
function paintedArt(plateName){
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
    return { plate: [...backdrops].some(n => n.replace(/_590W(?=\.webp$)/, "").replace(/\.webp$/, "") === plateName), cutouts: list.filter(n => /^OVL_.*PHONE/i.test(n)), phoneV1: [...backdrops].filter(n => /^ENV_.*PHONE_V1/i.test(n)) };
}

// Self-test of the box / circle rule on a blank page, before any screen is checked. A face zone sits at 20,20-80,80 of
// a 400x400 page. A 999px-radius pill whose box corner overlaps the zone must still be a hit (it is not a circle; as an
// ellipse it would miss); an ellipse likewise; a 50% circle
// whose square box covers the zone's corner but whose disc does not reach the zone must not be; the same circle moved
// onto the zone must be a hit again.
async function selfTest(browser){
    const context = await browser.newContext({ viewport: { width: 400, height: 400 } });
    const page = await context.newPage();
    const run = async html => { await page.setContent(`<body style="margin:0;background:#000">${html}</body>`); return page.evaluate(faceHits, { faces: [[20, 20, 80, 80]], w: 400, h: 400 }); };
    const box = "position:absolute;background:#c90;";
    const cases = [
        ["pill (border-radius 999px) whose box corner overlaps the face", `<div style="${box}left:75px;top:75px;width:200px;height:40px;border-radius:999px"></div>`, true],
        ["circle whose box corner (not disc) overlaps the face", `<div style="${box}left:70px;top:70px;width:120px;height:120px;border-radius:50%"></div>`, false],
        ["circle whose disc overlaps the face", `<div style="${box}left:40px;top:40px;width:120px;height:120px;border-radius:50%"></div>`, true],
        ["ellipse (not a circle) whose box corner overlaps the face", `<div style="${box}left:70px;top:70px;width:200px;height:120px;border-radius:50%"></div>`, true]
    ];
    const bad = [];
    for(const [name, html, expectHit] of cases) if((await run(html)).length > 0 !== expectHit) bad.push(`${name}: expected ${expectHit ? "a hit" : "no hit"}`);
    await context.close();
    if(bad.length) throw new Error("face check self-test failed: " + bad.join("; "));
    console.log(`face check self-test: PASS (${cases.length} cases)`);
}

// The marker swap (see the header). Runs in the page: markPlates(zones) swaps every visible HC room for its marker picture,
// hides everything else and returns the drawn room keys; unmarkPlates() undoes it. readMarkers() finds the red and blue boxes
// in a screenshot (decoded by the page itself) and returns them in CSS px.
function markPlates({ zones, swap }){
    const urlsOf = v => [...String(v || "").matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
    const keyOf = u => { const m = /plates-hc\/(ENV_[A-Z]+_(?:PLATE|PHONE)_HC_V3(?:_TALL)?)/.exec(u || ""); return m && m[1]; };
    // A room is a big picture: a small crop of a room (the 36x52 manager portraits in Career Statistics' leader cards are
    // cut from the board room) is not scenery. Where two rooms are stacked (Home stays under Connect Players), the one the
    // player sees is the room: the candidate that comes first in the paint stack at most of a grid of points.
    const all = [], vw = innerWidth, vh = innerHeight;
    for(const el of document.querySelectorAll("body *")){
        if(!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
        const bg = urlsOf(getComputedStyle(el).backgroundImage).map(keyOf).find(Boolean);
        const im = el.tagName === "IMG" ? keyOf(el.currentSrc || el.src) : null;
        if(!(bg || im)) continue;
        const r = el.getBoundingClientRect(), on = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        if(on >= 0.15 * vw * vh) all.push({ el, key: bg || im, kind: bg ? "bg" : "img", votes: 0 });
    }
    if(all.length > 1){
        const probe = document.createElement("style"); probe.textContent = "*{pointer-events:auto!important}"; document.head.appendChild(probe);
        for(let gy = 1; gy <= 5; gy++) for(let gx = 1; gx <= 5; gx++){
            const top = document.elementsFromPoint(vw * gx / 6, vh * gy / 6).map(el => all.find(p => p.el === el)).find(Boolean);
            if(top) top.votes++;
        }
        probe.remove();
        all.sort((a, b) => b.votes - a.votes);
    }
    const plates = all.slice(0, 1);
    for(const el of document.querySelectorAll("[data-hc-face-room]")) el.removeAttribute("data-hc-face-room");
    if(plates[0]) plates[0].el.setAttribute("data-hc-face-room", "");   // read by faceHits; cleared by unfreeze
    const svg = z => "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${z.w}" height="${z.h}" viewBox="0 0 ${z.w} ${z.h}"><rect width="100%" height="100%" fill="#000"/>` +
        z.faces.map((f, i) => `<rect x="${f[0] * z.w / 100}" y="${f[1] * z.h / 100}" width="${(f[2] - f[0]) * z.w / 100}" height="${(f[3] - f[1]) * z.h / 100}" fill="${i ? "#0000ff" : "#ff0000"}"/>`).join("") + "</svg>");
    const undo = window.__hcFaceUndo = [];
    for(const p of plates){
        const z = zones[p.key]; if(!z) continue; const u = svg(z);
        p.el.classList.add("__hcFaceKeep"); undo.push(() => p.el.classList.remove("__hcFaceKeep"));
        if(!swap) continue;
        if(p.kind === "bg"){ const old = p.el.style.getPropertyValue("background-image"), pr = p.el.style.getPropertyPriority("background-image");
            p.el.style.setProperty("background-image", `url("${u}")`, "important"); undo.push(() => p.el.style.setProperty("background-image", old, pr)); }
        else { const pic = p.el.parentElement && p.el.parentElement.tagName === "PICTURE" ? p.el.parentElement : null, srcs = pic ? [...pic.querySelectorAll("source")] : [];
            srcs.forEach(n => n.remove()); const os = p.el.getAttribute("src"), oss = p.el.getAttribute("srcset"); p.el.removeAttribute("srcset"); p.el.src = u;
            undo.push(() => { if(oss !== null) p.el.setAttribute("srcset", oss); if(os !== null) p.el.setAttribute("src", os); srcs.forEach(n => pic.insertBefore(n, p.el)); }); }
    }
    // The room keeps its place and its picture; its own type, borders, shadows and ::before/::after are hidden with the rest.
    const st = document.createElement("style");
    st.textContent = "body *, body *::before, body *::after { visibility: hidden !important } " +
        ".__hcFaceKeep { visibility: visible !important; color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; box-shadow: none !important; border-color: transparent !important; outline-color: transparent !important }";
    document.head.append(st); undo.push(() => st.remove());
    return [...new Set(plates.map(p => p.key))];
}
// The room the player sees at the faces: the first element at a face centre that paints an HC V3 room (a screen can keep
// another room under it, e.g. Home under Connect Players).
function topRoom(points){
    const keyOf = u => { const m = /plates-hc\/(ENV_[A-Z]+_(?:PLATE|PHONE)_HC_V3(?:_TALL)?)/.exec(u || ""); return m && m[1]; };
    const probe = document.createElement("style"); probe.textContent = "*{pointer-events:auto!important}"; document.head.appendChild(probe);
    try{
        for(const [x, y] of points) for(const el of document.elementsFromPoint(x, y)){
            const k = (el.tagName === "IMG" ? keyOf(el.currentSrc || el.src) : null) || keyOf(getComputedStyle(el).backgroundImage);
            if(k) return k;
        }
        return "";
    }finally{ probe.remove(); }
}
function unmarkPlates(){ const undo = window.__hcFaceUndo || []; while(undo.length) undo.pop()(); }
async function readMarkers({ b64 }){
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, box = [null, null];
    for(let y = 0; y < c.height; y++) for(let x = 0; x < c.width; x++){
        const i = (y * c.width + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2];
        const k = r > 200 && gg < 60 && b < 60 ? 0 : b > 200 && r < 60 && gg < 60 ? 1 : -1; if(k < 0) continue;
        const o = box[k] || (box[k] = [x, y, x, y]); o[0] = Math.min(o[0], x); o[1] = Math.min(o[1], y); o[2] = Math.max(o[2], x + 1); o[3] = Math.max(o[3], y + 1);
    }
    const k = c.width / innerWidth;   // screenshot px per CSS px (a big tablet's page narrows its own viewport, so not always the context's 2)
    return box.map(o => o && o.map(v => v / k));
}
// Stop everything that moves for the length of one check, where it stands, so the two photographs of a face differ only by
// what is painted on it (CSS animations and transitions paused, script-driven animations paused).
function freeze(){
    const st = document.createElement("style"); st.id = "__hcFaceFreeze";
    st.textContent = "*, *::before, *::after { animation-play-state: paused !important; transition: none !important; caret-color: transparent !important }";
    document.head.append(st);
    window.__hcFacePaused = [];
    for(const a of document.getAnimations ? document.getAnimations() : []) try{ if(a.playState === "running"){ a.pause(); window.__hcFacePaused.push(a); } }catch(e){}
}
function unfreeze(){
    for(const st of document.querySelectorAll("#__hcFaceFreeze")) st.remove();
    for(const el of document.querySelectorAll("[data-hc-face-room]")) el.removeAttribute("data-hc-face-room");
    for(const a of window.__hcFacePaused || []) try{ a.play(); }catch(e){}
    window.__hcFacePaused = [];
}
// F1 (a): compare the two photographs of each face. In the page, so no image library is needed. Returns, per face, the share
// of pixels that differ and who painted them (the top elements at a sample of those pixels).
async function paintedOver({ shots, ink }){
    const load = async b64 => { const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height); };
    const name = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
    const draws = el => { const cs = getComputedStyle(el);
        return (cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor)) || (cs.backgroundImage && cs.backgroundImage !== "none") || parseFloat(cs.borderTopWidth) > 0
            || [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || /^(IMG|SVG|CANVAS|BUTTON|INPUT|VIDEO)$/.test(el.tagName.toUpperCase()); };
    const probe = document.createElement("style"); probe.textContent = "*{pointer-events:auto!important}"; document.head.appendChild(probe);
    const out = [];
    try{
        for(const { who, box, seen, bare } of shots){
            const a = await load(seen), b = await load(bare), n = Math.min(a.data.length, b.data.length) / 4, w = a.width, dpr = a.width / Math.max(1, box[2]), pts = [];
            // A pixel is paint when it and at least five of its eight neighbours moved: a letter, a box or a shade is a patch,
            // while the browser resampling the same picture a hair differently in the two photographs leaves single-pixel
            // specks along sharp edges (hair against the wall), which are not paint.
            const hgt = Math.floor(n / w), moved = new Uint8Array(n);
            for(let i = 0; i < n; i++) moved[i] = Math.max(Math.abs(a.data[i * 4] - b.data[i * 4]), Math.abs(a.data[i * 4 + 1] - b.data[i * 4 + 1]), Math.abs(a.data[i * 4 + 2] - b.data[i * 4 + 2])) > ink ? 1 : 0;
            let count = 0;
            for(let y = 1; y < hgt - 1; y++) for(let x = 1; x < w - 1; x++){
                const i = y * w + x; if(!moved[i]) continue;
                const near = moved[i - w - 1] + moved[i - w] + moved[i - w + 1] + moved[i - 1] + moved[i + 1] + moved[i + w - 1] + moved[i + w] + moved[i + w + 1];
                if(near >= 5){ if(count++ % 37 === 0 && pts.length < 400) pts.push([box[0] + x / dpr, box[1] + y / dpr]); }
            }
            const by = new Map();
            for(const [x, y] of pts){
                const stack = document.elementsFromPoint(x, y).filter(el => !el.classList.contains("__hcFaceKeep") && el !== document.body && el !== document.documentElement);
                const el = stack.find(draws) || stack[0];
                const label = el ? `<${name(el)}>${(el.innerText || "").trim() ? " " + JSON.stringify((el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 32)) : ""}` : "a shadow, glow or ::before of a neighbour";
                by.set(label, (by.get(label) || 0) + 1);
            }
            out.push({ who, pct: 100 * count / Math.max(1, n), by: [...by].sort((x, y) => y[1] - x[1]).slice(0, 3).map(x => x[0]) });
        }
    }finally{ probe.remove(); }
    return out;
}

// KNOWN: face rows that wait for a change owned by another thread (measured 2026-11-12 on gameplay/r91). A finding on a
// listed screen, size and face whose text matches the row's "what" is printed as KNOWN and does not fail. A listed row that no longer fails is printed as a
// reminder to delete it. May only shrink: fix the screen, then delete its row; never add a row to get a pull request green.
// (r91 phone-faces PR: rows L1, L2, L3 and L5 are fixed and gone; the list is empty.)
const KNOWN = [
];
// WAITING: screens whose room is still on its way from Team V. Their findings are printed, not failed. May only shrink.
const WAITING = {
};
SCREENS.SEASON_ENTRY = { host: "seasonEntry", open: null };   // opened by the short-screens audit's opener (its own fixture)
SCREENS.START = { host: "createShowdown", open: page => page.evaluate(() => window.navigateTo("createShowdown")) };
const baseOpenScreen = openScreen;
async function openAny(page, key){
    if(key === "SEASON_ENTRY") return require("./r80-short-screens-audit.cjs").openScreen(page, key);
    return baseOpenScreen(page, key);
}
const twoFrames = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const pad = (f, w, h) => { const x0 = Math.max(0, Math.floor(f[0])), y0 = Math.max(0, Math.floor(f[1])), x1 = Math.min(w, Math.ceil(f[2])), y1 = Math.min(h, Math.ceil(f[3])); return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) }; };

// One screen at one size on an open page: returns { room, faces, findings: [{ face, what }], notes: [] }.
async function checkFaces(page, key, w, h, dpr){
    const findings = [], notes = [];
    if(predict) await page.evaluate(() => { for(const el of document.querySelectorAll("body *")){ const src = (el.tagName === "IMG" ? el.currentSrc || "" : "") + " " + getComputedStyle(el).backgroundImage; if(/OVL_[A-Z_]*PHONE/.test(src)) el.style.setProperty("visibility", "hidden", "important"); } });
    await page.evaluate(freeze); await twoFrames(page);
    // where the faces are
    const rooms = await page.evaluate(markPlates, { zones: HC_ZONES, swap: true });
    await twoFrames(page); await page.waitForTimeout(150);
    const marked = await page.screenshot();
    await page.evaluate(unmarkPlates); await twoFrames(page);
    const found = await page.evaluate(readMarkers, { b64: marked.toString("base64") });
    const named = found.map((f, i) => f && { box: f, who: i ? "Nik" : "Daniel" }).filter(Boolean);
    const faces = named.map(f => f.box), names = named.map(f => f.who);
    const room = rooms.length ? await page.evaluate(topRoom, named.map(f => [(f.box[0] + f.box[2]) / 2, (f.box[1] + f.box[3]) / 2])) || rooms[0] : "";
    if(!room) findings.push({ face: "", what: "no HC V3 room is drawn" });
    ["Daniel", "Nik"].forEach((n, i) => { if(room && !found[i]) findings.push({ face: n, what: `${n}'s face is not on screen` }); });
    // F1 (a) pixels: each face as the player sees it, then with everything but the rooms hidden
    const { vw, vh } = await page.evaluate(() => ({ vw: innerWidth, vh: innerHeight }));   // the page's own viewport (760 wide on an 820 tablet)
    const clips = named.map(f => ({ ...f, clip: pad(f.box, vw, vh) }));
    const seen = []; for(const f of clips) seen.push((await page.screenshot({ clip: f.clip })).toString("base64"));
    await page.evaluate(markPlates, { zones: HC_ZONES, swap: false }); await twoFrames(page); await page.waitForTimeout(100);
    const bare = []; for(const f of clips) bare.push((await page.screenshot({ clip: f.clip })).toString("base64"));
    await page.evaluate(unmarkPlates); await twoFrames(page);
    const painted = await page.evaluate(paintedOver, { shots: clips.map((f, i) => ({ who: f.who, box: [f.clip.x, f.clip.y, f.clip.width], seen: seen[i], bare: bare[i] })), ink: INK });
    for(const p of painted) if(p.pct >= FACE_LIMIT_PCT) findings.push({ face: p.who, what: `${p.who}'s face is ${p.pct.toFixed(1)}% painted over${p.by.length ? " by " + p.by.join(", ") : ""}` });
    // F1 (b) boxes: solid elements over a face
    const hits = await page.evaluate(faceHits, { faces, names, w: vw, h: vh });
    const worst = {};
    hits.forEach(x => { const k = x.face + " " + x.tag + (x.id ? "#" + x.id : "") + " " + x.text; if(!worst[k] || worst[k].share < x.share) worst[k] = x; });
    for(const x of Object.values(worst).sort((a, b) => b.share - a.share)){
        const what = `${x.face}'s face ${x.share.toFixed(1)}% under <${x.tag}${x.id ? "#" + x.id : ""} class="${x.cls}">${x.text ? " " + JSON.stringify(x.text) : ""}`;
        if(x.solid && x.share >= FACE_LIMIT_PCT) findings.push({ face: x.face, what });
        else notes.push(`${what} (${x.solid ? "under 1%" : "type only: judged by its ink"})`);
    }
    // F3
    for(const f of await page.evaluate(fadedManagers)) findings.push({ face: "", what: `FADED/CUT manager: ${f}` });
    if(room && !predict && uprightPhone(w, h)){
        const art = await page.evaluate(paintedArt, room);
        if(!art.plate) findings.push({ face: "", what: `${room} is not painted as the screen's backdrop` });
        if(art.cutouts.length) findings.push({ face: "", what: `cut-outs still painted: ${art.cutouts.join(", ")}` });
        if(art.phoneV1.length) findings.push({ face: "", what: `old phone plate still painted: ${art.phoneV1.join(", ")}` });
        const covered = await page.evaluate(plateCovered, { faces, names, plateName: room });
        for(const c of covered) findings.push({ face: c.split(":")[0], what: c });
    }
    await page.evaluate(unfreeze);
    return { room, faces, painted, findings, notes };
}

const OLD_LOOK = [];   // every manager screen now draws its plate on upright phones
// F6 fixture. Runs before the page's own scripts: when js/specialPlayerChip.js sets its api, the five lookups the screens
// use answer with these two players, whatever the seeded Showdown holds. Everything else (the chip's element, its styles,
// each screen's own placing) is the page's own code. Both are real entries of data/marqueePlayers.js: Nik's is the longest
// name and the longest surname of the 305, with the widest badge; Daniel's is a long one-word surname of the usual kind.
const SP_FIXTURE = { daniel: { name: "R. Lewandowski", club: "FC Bayern München", rank: 15, tier: "gold", badge: "#15 TOP 20" }, nik: { name: "A. Oxlade-Chamberlain", club: "Arsenal", rank: 181, tier: "bronze", badge: "#181 TOP 300" } };
function specialPlayerFixture(sp){
    let api;
    const both = () => sp;
    Object.defineProperty(window, "CareerModeSpecialPlayerChip", { configurable: true, get: () => api, set: real => { api = Object.freeze({ ...real, live: both, liveFor: both, forShowdown: both, forRow: both, latest: both }); } });
}
// F6, Season Results. The app draws these two chips from the live Showdown (js/productionSharedSeasonResults.js
// pssrSpecialPlayerSlot for the review cards, js/seasonFinalV10.js sfSeasonChips for the entry cards). The seeded page has
// no live Showdown, so the same slot is placed here: a span.seasonSpecialPlayer holding the chip, right after the name.
async function seasonResultsChips(page){
    return page.evaluate(async fixture => {
        const api = window.CareerModeSpecialPlayerChip; if(!api) return;
        if(api.ensure) await api.ensure();
        for(const [sel, sp] of [["#daniel-entry-panel .seasonManagerHeader h3", fixture.daniel], ["#nik-entry-panel .seasonManagerHeader h3", fixture.nik], ["#seasonReviewOne h3", fixture.daniel], ["#seasonReviewTwo h3", fixture.nik]]){
            const name = document.querySelector("#seasonEntry " + sel); if(!name) continue;
            name.parentNode.querySelectorAll(".seasonSpecialPlayer").forEach(node => node.remove());
            const slot = document.createElement("span"); slot.className = "seasonSpecialPlayer"; slot.appendChild(api.element(document, sp)); name.after(slot);
        }
        await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
    }, SP_FIXTURE);
}
// F6. Every chip on the open screen, as it is drawn. Positions are taken with the page scrolled to its top and again with
// each chip scrolled into view (for the "lies under" test, nine points a chip).
async function specialPlayerChipsClear(page){
    return page.evaluate(async () => {
        const out = [], main = document.querySelector("#app main"), vw = innerWidth;
        const frames = () => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
        const shown = el => { if(el.closest(".hidden, [hidden]")) return false; const cs = getComputedStyle(el), b = el.getBoundingClientRect(); return cs.display !== "none" && cs.visibility !== "hidden" && b.width > 0 && b.height > 0; };
        const label = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "");
        const chips = [...document.querySelectorAll("#app .spChip")].filter(shown);
        const said = new Set(), say = line => { if(!said.has(line)){ said.add(line); out.push(line); } };
        const where = chip => `the Special Player chip ${JSON.stringify(chip.textContent.replace(/\s+/g, " ").trim().slice(0, 28))}`;
        // other words on the screen: every shown text node outside the chips
        const words = [];
        if(chips.length){
            const host = chips[0].closest("#app > main > section, #app main > *") || document.querySelector("#app"), walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
            for(let node = walk.nextNode(); node; node = walk.nextNode()){
                if(!node.textContent.trim() || node.parentElement.closest(".spChip") || !shown(node.parentElement)) continue;
                const range = document.createRange(); range.selectNodeContents(node);
                for(const r of range.getClientRects()) if(r.width > 1 && r.height > 1) words.push({ text: node.textContent.trim().slice(0, 24), r, el: node.parentElement });
            }
        }
        const boxes = chips.map(chip => chip.getBoundingClientRect());
        chips.forEach((chip, i) => {
            const b = boxes[i];
            if(b.left < -.5 || b.right > vw + .5) say(`${where(chip)} runs off the side of the screen (${Math.round(b.left)} to ${Math.round(b.right)} of ${vw})`);
            // 12px is the least for any shown part, and no part is cut: a name that cannot fit takes the short form instead
            for(const part of [chip, ...chip.querySelectorAll("span, bdi")].filter(shown)){
                const cs = getComputedStyle(part), size = parseFloat(cs.fontSize);
                if(size < 11.95) say(`${where(chip)} is set at ${Math.round(size * 10) / 10}px (${label(part)}; 12px is the least)`);
                if(part.scrollWidth > part.clientWidth + 1 && cs.overflowX !== "visible") say(`${where(chip)} is cut short (${label(part)} shows ${part.clientWidth} of ${part.scrollWidth}px)`);
            }
            // Rivalry Statistics: the name, the chip and the club are one block, inside the totals panel and above its rows
            const block = chip.closest(".rv-manager"), panel = block && block.closest("#rvPanelTotals"), rows = panel && panel.querySelector(".rv-rows");
            if(panel){
                const m = block.getBoundingClientRect(), pr = panel.getBoundingClientRect(), kids = [...block.querySelectorAll("strong, .spChip, [id^='rvClub'], img")].filter(shown).map(el => el.getBoundingClientRect());
                const top = Math.min(m.top, ...kids.map(k => k.top)), bottom = Math.max(m.bottom, ...kids.map(k => k.bottom)), left = Math.min(...kids.map(k => k.left)), right = Math.max(...kids.map(k => k.right));
                if(top < pr.top - .5 || left < pr.left - .5 || right > pr.right + .5) say(`${where(chip)}: its manager's block leaves the totals panel (${Math.round(left)},${Math.round(top)} to ${Math.round(right)},${Math.round(bottom)}; the panel is ${Math.round(pr.left)},${Math.round(pr.top)} to ${Math.round(pr.right)},${Math.round(pr.bottom)})`);
                if(rows && shown(rows) && bottom > rows.getBoundingClientRect().top + .5) say(`${where(chip)}: its manager's block reaches ${Math.round(bottom - rows.getBoundingClientRect().top)}px into the rows under it`);
            }
            for(let j = i + 1; j < chips.length; j++){ const c = boxes[j]; if(b.right - c.left > .5 && c.right - b.left > .5 && b.bottom - c.top > .5 && c.bottom - b.top > .5) say(`${where(chip)} lies across ${where(chips[j])}`); }
            for(const w of words){
                // a word's ink is narrower than its line box: a quarter of the line's height is taken off above and below
                const lead = w.r.height * .22;
                if(b.right - w.r.left > .5 && w.r.right - b.left > .5 && b.bottom - (w.r.top + lead) > .5 && (w.r.bottom - lead) - b.top > .5) say(`${where(chip)} lies on the words ${JSON.stringify(w.text)} (${label(w.el)})`);
            }
        });
        for(const chip of chips){
            chip.scrollIntoView({ block: "center", inline: "nearest" }); await frames();
            const r = chip.getBoundingClientRect(), over = new Set();
            for(const fx of [.12, .5, .88]) for(const fy of [.2, .5, .8]){ const top = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if(top && top !== chip && !chip.contains(top) && !top.contains(chip)) over.add(label(top)); }
            if(over.size) say(`${where(chip)} lies under ${[...over].join(", ")}`);
        }
        if(main) main.scrollTop = 0;
        await frames();
        return out;
    });
}
// F4. The chips are put in exactly as Team V's final-winner.js builds them (a .fwSpecialPlayer slot after each name, the
// chip from js/specialPlayerChip.js): one short name and the longest kind, so the row is as wide as it gets.
async function finalWinnerResultClear(page){
    return page.evaluate(async fixture => {
        const root = document.querySelector("#seasonEntry"), api = window.CareerModeSpecialPlayerChip;
        if(!root || !api || !root.querySelector("#danielTotal")) return ["Final Winner: the result or the Special Player chip code is missing, so F4 could not be checked"];
        for(const [sel, sp] of [["#danielName", fixture.daniel], ["#nikName", fixture.nik]]){
            const name = root.querySelector(sel); name.parentNode.querySelectorAll(".fwSpecialPlayer").forEach(node => node.remove());
            const slot = document.createElement("span"); slot.className = "fwSpecialPlayer"; slot.appendChild(api.element(document, sp)); name.after(slot);
        }
        await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
        const out = [], screen = root.getBoundingClientRect(), main = document.querySelector("#app main");
        const label = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "");
        const parts = [["Daniel's total", "#danielTotal"], ["Nik's total", "#nikTotal"], ["Daniel's Special Player chip", ".finalWinnerManager--daniel .fwSpecialPlayer .spChip"], ["Nik's Special Player chip", ".finalWinnerManager--nik .fwSpecialPlayer .spChip"]];
        const boxes = [];
        for(const [what, sel] of parts){
            const el = root.querySelector(sel); let r = el.getBoundingClientRect(); boxes.push(r);
            if(r.left < screen.left - .5 || r.right > screen.right + .5 || r.top < screen.top - .5 || r.bottom > screen.bottom + .5){ out.push(`${what} runs off the screen (${Math.round(r.left)},${Math.round(r.top)} to ${Math.round(r.right)},${Math.round(r.bottom)}; the screen ends at ${Math.round(screen.right)},${Math.round(screen.bottom)})`); continue; }
            el.scrollIntoView({ block: "nearest" }); r = el.getBoundingClientRect();
            const over = new Set();
            for(const fx of [.2, .5, .8]) for(const fy of [.15, .5, .85]){ const top = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if(top && top !== el && !el.contains(top) && !top.contains(el)) over.add(label(top)); }
            if(over.size) out.push(`${what} lies under ${[...over].join(", ")}`);
            if(main) main.scrollTop = 0;
        }
        const [dTotal, nTotal, dChip, nChip] = boxes;
        if(dChip.right > nChip.left && nChip.right > dChip.left && dChip.bottom > nChip.top && nChip.bottom > dChip.top) out.push("the two Special Player chips lie across each other");
        const panel = root.querySelector(".finalWinnerResultsPanel"), pr = panel && panel.getBoundingClientRect();
        for(const [what, r] of [["Daniel's total", dTotal], ["Nik's total", nTotal]]) if(pr && pr.width && pr.left < r.right && pr.right > r.left && pr.bottom > r.bottom && pr.top - r.bottom < 6) out.push(`${what} stands ${Math.round(pr.top - r.bottom)}px above the summary panel (6px is the least)`);
        return out;
    }, SP_FIXTURE);
}

// F5 (see the header). Each slice in turn is turned to the top with the wheel's own track, where its name and mark stand
// upright and their boxes are exact; the track is then put back. A name's box is its ink: its lines without the leading
// above the capitals and under the baseline (the names are set in capitals). Distances: HUB is the hub art's edge and RIM
// the start of the rim art's solid band, both as shares of the wheel's radius; a wheel under SMALL px across draws its
// hub at HUB_SMALL of its size (css/v10Setup.css; contract M32 keeps these numbers and the sheet's together).
async function leagueWheelSlicesClear(page){
    return page.evaluate(async () => {
        const HUB = .235, HUB_SMALL = .66, SMALL = 300, RIM = .72, CLEAR = 3, MARK_LEAST = 10;
        const wheel = document.getElementById("leagueWheel"), track = wheel && wheel.querySelector(".wheelTrack");
        const items = track ? [...track.querySelectorAll(".wheelItem")] : [];
        if(items.length !== 5) return [`League wheel: ${items.length} slices found (5 expected), so F5 could not be checked`];
        const out = [], step = 360 / items.length, half = step / 2, old = [track.style.transition, track.style.transform];
        const frames = () => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
        try{
            for(let i = 0; i < items.length; i++){
                const el = items[i], cs = getComputedStyle(el), name = el.textContent.trim() || `slice ${i + 1}`;
                // fixed to its slice: the item's own turn is its slice's angle and nothing else
                const m = /^matrix\(([^)]+)\)$/.exec(cs.transform), turn = m ? (Math.atan2(Number(m[1].split(",")[1]), Number(m[1].split(",")[0])) * 180 / Math.PI + 360) % 360 : NaN;
                const off = Math.abs(((turn - i * step) % 360 + 540) % 360 - 180);
                if(!(off < .5)){ out.push(`${name}: the name is not fixed to its slice (it is turned ${Math.round(turn)}deg, its slice ${i * step}deg), so it swings across the dividers when the wheel turns`); continue; }
                track.style.transition = "none"; track.style.transform = `rotate(${-i * step}deg)`; await frames();
                const wb = wheel.getBoundingClientRect(), cx = wb.left + wb.width / 2, cy = wb.top + wb.height / 2, R = wb.width / 2, hub = R * HUB * (wb.width < SMALL ? HUB_SMALL : 1);
                const text = [...el.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
                if(!text){ out.push(`slice ${i + 1}: no league name`); continue; }
                const range = document.createRange(); range.selectNodeContents(text);
                const box = range.getBoundingClientRect(), line = range.getClientRects()[0], lead = Math.max(0, ((line ? line.height : box.height) - parseFloat(cs.fontSize) * .72) / 2);
                const parts = [["name", { left: box.left, right: box.right, top: box.top + lead, bottom: box.bottom - lead }]];
                const before = getComputedStyle(el, "::before"), mw = before.display === "none" ? 0 : parseFloat(before.width) || 0, mh = before.display === "none" ? 0 : parseFloat(before.height) || 0;
                const drawn = mw >= 1 && mh >= 1 && /url\(/.test(before.maskImage || before.webkitMaskImage || "") && !/rgba\(.*,\s*0\)$|transparent/.test(before.backgroundColor);
                if(drawn){
                    // the mark is the last thing in the item's column, centred: its box follows from the item's own box
                    const eb = el.getBoundingClientRect(), mid = eb.left + eb.width / 2;
                    if(mw < MARK_LEAST) out.push(`${name}: the league mark is only ${mw.toFixed(1)}px (${MARK_LEAST}px is the least)`);
                    parts.push(["mark", { left: mid - mw / 2, right: mid + mw / 2, top: eb.bottom - mh, bottom: eb.bottom }]);
                    if(eb.bottom - mh < box.bottom - lead) out.push(`${name}: the league mark lies on the name`);
                }else out.push(`${name}: no league mark is drawn`);
                for(const [what, b] of parts){
                    const corners = [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]].map(([x, y]) => [x - cx, cy - y]);
                    const far = Math.max(...corners.map(([x, y]) => Math.hypot(x, y))), near = Math.min(...corners.map(([, y]) => y));
                    const side = Math.min(...corners.map(([x, y]) => Math.hypot(x, y) * Math.sin((half - Math.atan2(Math.abs(x), y) * 180 / Math.PI) * Math.PI / 180)));
                    if(side < CLEAR) out.push(`${name}: the ${what} ${side < 0 ? "crosses" : "comes within " + side.toFixed(1) + "px of"} its slice's divider (${CLEAR}px is the least)`);
                    if(near - hub < CLEAR) out.push(`${name}: the ${what} ${near < hub ? "lies on" : "comes within " + (near - hub).toFixed(1) + "px of"} the hub (${CLEAR}px is the least)`);
                    if(far > R * RIM) out.push(`${name}: the ${what} runs ${(far - R * RIM).toFixed(1)}px onto the rim`);
                }
            }
        }finally{ track.style.transform = old[1]; await frames(); track.style.transition = old[0]; }
        return out;
    });
}

module.exports = { SCREENS, OLD_LOOK, openScreen, GROUPS, KNOWN, WAITING, checkFaces, finalWinnerResultClear, SP_FIXTURE, specialPlayerFixture, seasonResultsChips, specialPlayerChipsClear, leagueWheelSlicesClear };
if(require.main === module) (async () => {
    const started = Date.now();
    const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCREENS).filter(key => !OLD_LOOK.includes(key));
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    const failed = new Set(), usedKnown = new Set();
    let checked = 0;
    try{
        await selfTest(browser);
        for(const key of keys) if(!SCREENS[key]) throw new Error("unknown screen " + key);
        const report = async (page, key, w, h, dpr, errors) => {
            if(key === "SEASON_RESULTS") await seasonResultsChips(page);
            const res = await checkFaces(page, key, w, h, dpr);
            if(key === "FINAL_WINNER") for(const what of await finalWinnerResultClear(page)) res.findings.push({ face: "", what });
            for(const what of await specialPlayerChipsClear(page)) res.findings.push({ face: "", what });
            if(key === "LEAGUE") for(const what of await leagueWheelSlicesClear(page)) res.findings.push({ face: "", what });
            checked++;
            const size = `${w}x${h}`, real = [], known = [];
            for(const f of res.findings){
                const row = KNOWN.find(k => k.screen === key && k.size === size && (!k.face || k.face === f.face) && k.what.test(f.what));
                if(row){ known.push(`${f.what} [KNOWN ${row.row}, ${row.owner}: ${row.why}]`); usedKnown.add(row); } else real.push(f.what);
            }
            for(const e of errors) real.push(`page error: ${e}`);
            const waiting = WAITING[key];
            const bad = real.length && !waiting;
            if(bad) failed.add(key);
            let line = `${key} ${size} ${res.room || "no HC room"}: ${bad ? "FAIL" : waiting && real.length ? "WAITING" : known.length ? "KNOWN" : "OK"}`;
            line += `  (${res.painted.map(p => `${p.who} ${p.pct.toFixed(1)}%`).join(", ") || "no face found"})`;
            line += real.map(x => `\n  - ${x}`).join("") + known.map(x => `\n  ~ ${x}`).join("");
            if(waiting && real.length) line += `\n  (waiting: ${waiting})`;
            if(process.env.CMS_FACECHECK_NOTES === "1") line += res.notes.map(x => `\n  note: ${x}`).join("");
            console.log(line);
            if(shotDir){
                fs.mkdirSync(shotDir, { recursive: true });
                await page.evaluate(fs => fs.forEach(f => { const d = document.createElement("div"); d.className = "__hcFaceBox";
                    Object.assign(d.style, { position: "fixed", left: f[0] + "px", top: f[1] + "px", width: (f[2] - f[0]) + "px", height: (f[3] - f[1]) + "px", outline: "3px solid #0ff", zIndex: 2147483647, pointerEvents: "none" });
                    document.body.appendChild(d); }), res.faces);
                await page.screenshot({ path: path.join(shotDir, `FACECHECK_${key}_${w}x${h}.png`) });
                await page.evaluate(() => document.querySelectorAll(".__hcFaceBox").forEach(n => n.remove()));
            }
        };
        const desk = SIZES.filter(([w]) => !touchSize(w)), touch = SIZES.filter(([w]) => touchSize(w));
        // touch: a fresh phone or tablet context per size (the page sets its own viewport on big tablets)
        for(const [w, h] of touch){
            const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
            await context.addInitScript(specialPlayerFixture, SP_FIXTURE);
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", e => errors.push(e.message));
            for(const key of keys){ errors.length = 0; await openAny(page, key); await report(page, key, w, h, 2, errors); }
            await context.close();
        }
        // desktop: open once per screen, then drag the window through every desktop size
        const deskRun = async (sizes, screens) => {
            const context = await browser.newContext({ viewport: { width: sizes[0][0], height: sizes[0][1] }, deviceScaleFactor: 1 });
            await context.addInitScript(specialPlayerFixture, SP_FIXTURE);
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", e => errors.push(e.message));
            for(const key of screens){
                errors.length = 0;
                await page.setViewportSize({ width: sizes[0][0], height: sizes[0][1] });
                await openAny(page, key);
                for(const [w, h] of sizes){ await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(600); await report(page, key, w, h, 1, errors); }
            }
            await context.close();
        };
        if(desk.length) await deskRun(desk, keys);
        // r92-04: the Gate's desk run also draws Final Winner in the three short desktop windows (no touch), about 15 s
        if(group === "desk" && !process.env.CMS_FACECHECK_SIZES && keys.includes("FINAL_WINNER")) await deskRun(GROUPS["desk-short"].map(x => x.split("x").map(Number)), ["FINAL_WINNER"]);
    }finally{
        await browser.close();
    }
    // a KNOWN row whose screen and size were checked but which no longer fails
    for(const row of KNOWN) if(!usedKnown.has(row) && keys.includes(row.screen) && SIZES.some(([w, h]) => `${w}x${h}` === row.size)) console.log(`NOTE the KNOWN row ${row.row} (${row.screen} ${row.size}${row.face ? " " + row.face : ""}) no longer fails: delete it from KNOWN.`);
    const secs = Math.round((Date.now() - started) / 1000);
    console.log(failed.size ? `face check: FAIL (${[...failed].join(", ")}) ${checked} screen-sizes, ${secs}s` : `face check: PASS (${keys.length} screens x ${SIZES.length} sizes, ${secs}s)`);
    process.exit(failed.size ? 1 : 0);
})().catch(error => { console.error(error && error.stack || error); process.exit(2); });
