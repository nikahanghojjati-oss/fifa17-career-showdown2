"use strict";
// r91 old art (Sol's r90 review, Nik 2026-11-11): at some window shapes a screen fell back to a retired picture (Legacy and
// Trophy Room showed the old floodlit room at 1363x936). Every screen's scenery must be the current handcrafted room
// (visual-assets/v10_1/plates-hc/) at every window shape: desktop, tall windows, tablets both ways, phones both ways.
// This audit opens each screen and lists every scenery picture actually drawn on screen (backgrounds of every visible element
// and its ::before/::after, and every visible <img>), then fails when:
//   A1 a scenery picture (ENV_*, OVL_*, *_PLATE_*, PACK_* under visual-assets/) that is not a current room is drawn;
//   A2 the screen's own room is not drawn at all (a blank or missing backdrop).
// A screen still waiting for Team V art is LISTED below with its ticket; the list may only shrink.
// Retired files the page downloads without drawing are printed as notes (wasted bytes, not old art on screen).
// Window shapes: every size below. Touch sizes (narrower than 900 or shorter than 500) open fresh in a phone context, as a
// real phone or tablet lays the page out (js/onlinePlayerIdentity.js narrows the viewport of big tablets); desktop sizes open
// once per screen and the window is resized through them, as a person drags a desktop window.
// Usage: node tests/browser/r91-old-art-audit.cjs [SCREEN ...]
//   CMS_BASE_URL (default http://127.0.0.1:4173/), CMS_OLD_ART_GROUP = desk | touch-up | touch-side | full (default desk),
//   CMS_OLD_ART_SIZES="1363x936,390x844" (overrides the group), CMS_OLD_ART_SHOTS=<dir>, CMS_OLD_ART_REPORT=<file>.
// The Gate runs desk, touch-up and touch-side (one test:browser audit each, inside the per-audit time limit);
// `npm run test:old-art` is the full grid (the lead's 39 named sizes plus the aspect sweep 0.40-2.60 in 0.05 steps at 900px
// tall and 1.40-2.60 at 400px tall), run by hand.
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const Short = require("./r80-short-screens-audit.cjs");
const Face = require("./phone-marble-facecheck-audit.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const shotDir = process.env.CMS_OLD_ART_SHOTS || "";
const reportFile = process.env.CMS_OLD_ART_REPORT || "";
const touchSize = (w, h) => w < 900 || h < 500;

// ---------- window shapes ----------
const NAMED = {
    desktop: ["1920x866", "1920x1035", "1363x936", "1366x768", "1366x640", "1440x900", "1440x1000", "1536x864", "1280x800", "1280x1024", "1680x1050", "2560x1440", "2560x1080", "3440x1440", "3840x2160"],
    tablet: ["820x1180", "1180x820", "834x1194", "1194x834", "1024x1366", "1366x1024", "744x1133", "1133x744", "800x1280", "1280x800", "912x1368", "1368x912", "1024x768", "768x1024"],
    phoneUp: ["390x844", "393x852", "430x932", "360x640", "360x800", "412x915"],
    phoneSide: ["844x390", "852x393", "932x430", "640x360", "800x360", "915x412"],
    // windows between the bands: a small desktop window, a square one, a portrait monitor
    between: ["900x900", "900x700", "800x600", "1080x1920", "1440x2560"]
};
const sweep = (h, from, to, step) => { const out = []; for(let a = from; a <= to + 1e-9; a += step) out.push(`${Math.round(h * a)}x${h}`); return out; };
const GROUPS = {
    // the Gate's groups (each one test:browser audit inside the per-audit time limit): both Chromebook windows, Sol's
    // 1363x936, a 4:3 and a 5:4 window, an ultrawide, a portrait monitor and a small window under 900 wide
    desk: ["1920x866", "1920x1035", "1363x936", "1024x768", "1280x1024", "3440x1440", "1080x1920", "900x700"],
    "touch-up": ["390x844", "820x1180"],
    "touch-side": ["844x390", "640x360"],
    full: [...new Set([...Object.values(NAMED).flat(), ...sweep(900, 0.4, 2.6, 0.05), ...sweep(400, 1.4, 2.6, 0.1)])]
};
const group = process.env.CMS_OLD_ART_GROUP || "desk";
if(!process.env.CMS_OLD_ART_SIZES && !GROUPS[group]) throw new Error(`Unknown CMS_OLD_ART_GROUP ${group}`);
const SIZES = [...new Set(process.env.CMS_OLD_ART_SIZES ? process.env.CMS_OLD_ART_SIZES.split(",") : GROUPS[group])].map(s => s.split("x").map(Number));

// ---------- screens ----------
const onHome = async page => {
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 30000 });
    await page.evaluate(() => window.CareerModeSharedJourneyReady?.());
    await page.waitForFunction(() => window.getActiveScreenName && window.getActiveScreenName() === "mainMenu", null, { timeout: 30000 });
};
const settle = async (page, host) => {
    await page.waitForFunction(id => { const el = document.getElementById(id); return el && !el.classList.contains("hidden") && !el.hasAttribute("data-v10-pending"); }, host, { timeout: 20000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(2500);
};
const EXTRA = {
    START: { host: "createShowdown", open: page => page.evaluate(() => window.navigateTo("createShowdown")) },
    LEAGUE: Face.SCREENS.LEAGUE,
    CLUB: { host: "clubWheelScreen", open: page => page.evaluate(async () => {
        await window.ensureGameplayModules();
        if(window.CareerModeClubScreenV10) await window.CareerModeClubScreenV10.install();
        currentShowdown = { id: "old-art-club", name: "Daniel vs Nik", managers: { playerOne: "Daniel", playerTwo: "Nik" }, selectedLeague: { id: "premier_league", name: "Premier League" }, clubs: { playerOne: null, playerTwo: null }, totalRounds: 3, status: "League Confirmed", rounds: [] };
        initializeClubAssignment(); showScreen("clubWheelScreen"); populateClubAssignmentBase(); renderReadyAssignmentState();
    }) },
    TRANSFER: Face.SCREENS.TRANSFER
};
const SCREENS = { ...Short.SCREENS, ...EXTRA };
delete SCREENS.HISTORY; // History is a view of Legacy: same room
async function openScreen(page, key){
    if(!EXTRA[key]) return Short.openScreen(page, key);
    await onHome(page); await EXTRA[key].open(page); await settle(page, EXTRA[key].host);
}

// Each screen's own room (HO-068, Nik's picks). A screen may also show Home's room behind an overlay.
const ROOM = {
    HOME: "HOME", SETTINGS: "SLAB|HOME", RULE_BOOK: "SLAB|HOME", CONNECT_PLAYERS: "TUNNEL", LEGACY: "ARCHIVE", CAREER_STATISTICS: "BOARD", TROPHY_ROOM: "ARCHIVE",
    RIVALRY: "TUNNEL", STANDINGS: "TUNNEL", FINAL_WINNER: "BOARD", SEASON_ENTRY: "BOARD", SEASON_REVIEW: "BOARD", START: null, LEAGUE: "BOX", CLUB: "BOX", TRANSFER: "OFFICE"
};
// LISTED: screens still waiting for new Team V art. May only shrink.
const LISTED = {
    START: { ticket: "HO-069 (Nik 2026-11-11: a new Team V room for the season-count screen)", allow: /visual-assets\/v10_1\/start-join\/assets\// }
};

// KNOWN_SHAPES: window shapes still waiting for a layout of their own. Findings there are printed as KNOWN and do not fail;
// the list may only shrink. No phone or tablet has these shapes (phones are under 500 tall sideways, tablets are 1024+ wide
// sideways); only a desktop window dragged under 901 wide but kept over 500 tall reaches them. Team V's screens use their
// phone and tablet layouts there while the art follows the portrait or desktop rules.
const KNOWN_SHAPES = [
    { name: "small landscape window (under 901 wide, over 500 tall)", match: (w, h) => w <= 900 && w > h && h > 500, follow: "r91 old-art follow-up: one layout and room per screen for this band" }
];
const SCENERY = /(ENV_|OVL_|_PLATE_|PACK_)/;
const CURRENT = /visual-assets\/v10_1\/plates-hc\//;
function drawnPictures(){
    const vw = innerWidth, vh = innerHeight, out = [];
    const urls = s => [...String(s || "").matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
    const name = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
    for(const el of document.querySelectorAll("body, body *")){
        if(!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
        const r = el.getBoundingClientRect();
        if(!(r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw)) continue;
        for(const pseudo of [null, "::before", "::after"]){
            const s = getComputedStyle(el, pseudo);
            if(pseudo && (s.content === "none" || s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0)) continue;
            for(const u of urls(s.backgroundImage)) out.push({ el: name(el) + (pseudo || ""), url: u.replace(location.origin + "/", "") });
            for(const u of urls(s.maskImage || s.webkitMaskImage)) out.push({ el: name(el) + (pseudo || "") + " mask", url: u.replace(location.origin + "/", "") });
        }
        if(el.tagName === "IMG" && (el.currentSrc || el.src)) out.push({ el: name(el), url: (el.currentSrc || el.src).replace(location.origin + "/", "") });
    }
    return out;
}
function judge(key, drawn){
    const scenery = drawn.filter(d => /visual-assets\//.test(d.url) && SCENERY.test(d.url));
    const listed = LISTED[key];
    const old = scenery.filter(d => !CURRENT.test(d.url) && !(listed && listed.allow.test(d.url)));
    const findings = old.map(d => `A1 old picture ${d.url.replace(/^.*visual-assets\/v10_1\//, "")} on ${d.el}`);
    const room = ROOM[key];
    if(room && !scenery.some(d => CURRENT.test(d.url) && new RegExp(`ENV_(${room})_`).test(d.url))) findings.push(`A2 the ${room.replace("|", " or ")} room is not drawn`);
    return [...new Set(findings)];
}

module.exports = { NAMED, GROUPS, SCREENS, ROOM, LISTED, KNOWN_SHAPES, drawnPictures, judge, openScreen };

if(require.main === module){
    (async () => {
        const started = Date.now();
        const report = [], notes = new Map();
        const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCREENS);
        for(const key of keys) if(!SCREENS[key]) throw new Error(`Unknown screen ${key}`);
        const browser = await chromium.launch({ headless: true, ...await resolveChromiumRuntime() });
        const check = async (page, key, w, h, requested) => {
            const drawn = await page.evaluate(drawnPictures);
            const findings = judge(key, drawn), known = KNOWN_SHAPES.find(k => k.match(w, h));
            if(known && findings.length){ console.log(`KNOWN ${key} ${w}x${h} (${known.name}; ${known.follow})${findings.map(f => "\n   " + f).join("")}`); return; }
            for(const what of findings) report.push({ screen: key, size: `${w}x${h}`, what });
            if(requested) for(const u of requested){ const shortName = u.replace(/^.*visual-assets\/v10_1\//, ""); if(SCENERY.test(u) && !CURRENT.test(u) && !(LISTED[key] && LISTED[key].allow.test(u)) && !drawn.some(d => d.url === u)) notes.set(`${key} ${shortName}`, (notes.get(`${key} ${shortName}`) || 0) + 1); }
            if(shotDir){ fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `${key}-${w}x${h}.png`) }); }
            console.log(`${findings.length ? "FINDING" : "ok"} ${key} ${w}x${h}${findings.map(f => "\n   " + f).join("")}`);
        };
        const watch = page => { const seen = new Set(); page.on("request", r => { const u = r.url(); if(u.startsWith(baseUrl.origin) && /\.(webp|png|jpe?g|avif)(\?|$)/.test(u)) seen.add(u.replace(baseUrl.origin + "/", "").replace(/\?.*$/, "")); }); return seen; };
        try{
            const desk = SIZES.filter(([w, h]) => !touchSize(w, h)), touch = SIZES.filter(([w, h]) => touchSize(w, h));
            // desktop: open once per screen, then drag the window through every desktop size
            if(desk.length){
                const context = await browser.newContext({ viewport: { width: desk[0][0], height: desk[0][1] }, serviceWorkers: "block" });
                await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
                const page = await context.newPage(); const seen = watch(page);
                for(const key of keys){
                    await page.setViewportSize({ width: desk[0][0], height: desk[0][1] }); seen.clear();
                    await openScreen(page, key);
                    for(const [w, h] of desk){ await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(300); await check(page, key, w, h, seen); }
                }
                await context.close();
            }
            // touch: a fresh phone or tablet context per size
            for(const [w, h] of touch){
                const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
                await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
                const page = await context.newPage(); const seen = watch(page);
                for(const key of keys){ seen.clear(); await openScreen(page, key); await check(page, key, w, h, seen); }
                await context.close();
            }
        } finally {
            await browser.close();
        }
        if(notes.size) console.log(`NOTE retired pictures downloaded but not drawn (wasted bytes, not old art on screen):\n${[...notes].map(([k, n]) => `   ${k} (${n} sizes)`).join("\n")}`);
        if(reportFile) fs.writeFileSync(reportFile, JSON.stringify({ report, notes: Object.fromEntries(notes) }, null, 1));
        const secs = Math.round((Date.now() - started) / 1000);
        if(report.length){ console.error(`FAIL r91 old art: ${report.length} finding(s) across ${keys.length} screens x ${SIZES.length} sizes (${secs}s).`); process.exitCode = 1; }
        else console.log(`PASS r91 old art: ${keys.length} screens x ${SIZES.length} sizes draw only current rooms (${secs}s).`);
    })().catch(error => { console.error(error); process.exitCode = 1; });
}
