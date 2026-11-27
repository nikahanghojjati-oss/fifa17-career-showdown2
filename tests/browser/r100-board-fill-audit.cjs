"use strict";
// r100 H3 F1: the Champion (Final Winner) room and the Golden Showdown stage paint the board room across the whole window at
// every shape, with no flat side bands, no face cut or covered, and the result, plaque and buttons still clear.
// For each clubhouse x size x screen it opens the screen (the face-check audit's own seeds), takes the picture, then swaps
// every board-room plate for a flat magenta picture of the same 1536x864 shape (everything else hidden) and measures the
// columns at the window's left and right edges that the plate does not reach. It also runs the face check and the
// Final Winner / Golden button checks of tests/browser/phone-marble-facecheck-audit.cjs at that size.
// Usage: node tests/support/with-static-server.cjs "node tests/browser/r100-board-fill-audit.cjs"
//   BF_SIZES="1920x866,1920x1035,1366x768,390x844"  BF_THEMES="wooden,silver,ruby"  BF_SCREENS="FINAL_WINNER,GOLDEN"
//   BF_SHOTS=<dir> (pictures)  BF_REPORT=<file> (JSON)  BF_MEASURE_ONLY=1 (no face check)  BF_BAND_OK=<px> (default 0)
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const Face = require("./phone-marble-facecheck-audit.cjs");

const SIZES = (process.env.BF_SIZES || "1920x866,1920x1035,1366x768,390x844").split(",").map(s => s.split("x").map(Number));
const THEMES = (process.env.BF_THEMES || "wooden,silver,ruby").split(",").map(t => t.trim()).filter(Boolean);
const KEYS = (process.env.BF_SCREENS || "FINAL_WINNER,GOLDEN").split(",").map(k => k.trim()).filter(Boolean);
const shotDir = process.env.BF_SHOTS || "", reportFile = process.env.BF_REPORT || "";
const measureOnly = process.env.BF_MEASURE_ONLY === "1", BAND_OK = Number(process.env.BF_BAND_OK || 0);
const PLATE = /ENV_BOARD_PLATE_HC_V3/;
const touchSize = w => w < 1300;

// In the page: every element whose background draws the board plate gets a flat magenta 1536x864 picture in that layer
// (other layers none), everything else is hidden; returns how many were swapped.
function magentaPlates(re){
    const plate = new RegExp(re);
    const svg = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="864"><rect width="1536" height="864" fill="#ff00ff"/></svg>') + '")';
    const split = list => { const out = []; let depth = 0, cur = ""; for(const ch of list){ if(ch === "(") depth++; if(ch === ")") depth--; if(ch === "," && !depth){ out.push(cur.trim()); cur = ""; } else cur += ch; } if(cur.trim()) out.push(cur.trim()); return out; };
    const style = document.createElement("style"); style.id = "__bfHide";
    style.textContent = "*,*::before,*::after{visibility:hidden!important;transition:none!important;animation:none!important}.__bfPlate{visibility:visible!important;background-color:transparent!important}html,body{background:#000!important}";
    document.head.appendChild(style);
    let n = 0;
    for(const el of document.querySelectorAll("*")){
        const bg = getComputedStyle(el).backgroundImage;
        if(!plate.test(bg)) continue;
        el.dataset.bfOld = el.style.getPropertyValue("background-image") + "|" + el.style.getPropertyPriority("background-image");
        el.style.setProperty("background-image", split(bg).map(layer => plate.test(layer) ? svg : "none").join(", "), "important");
        el.classList.add("__bfPlate"); n++;
    }
    return n;
}
function unMagenta(){
    document.getElementById("__bfHide")?.remove();
    for(const el of document.querySelectorAll(".__bfPlate")){
        const [v, p] = (el.dataset.bfOld || "|").split("|");
        if(v) el.style.setProperty("background-image", v, p); else el.style.removeProperty("background-image");
        el.classList.remove("__bfPlate"); delete el.dataset.bfOld;
    }
}
// In the page: from a screenshot (base64), the unpainted columns at the left and right edge on three rows under the top bar.
async function bands(b64){
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const dpr = img.naturalWidth / innerWidth, bar = document.querySelector(".sd-nav-top"), top = bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
    const hit = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return d[0] > 200 && d[2] > 200 && d[1] < 90; };
    let left = 0, right = 0, rowsMissed = 0;
    for(const f of [.2, .5, .8]){
        const y = Math.round((top + (innerHeight - top) * f) * dpr);
        let l = 0; while(l < c.width && !hit(l, y)) l++;
        let r = 0; while(r < c.width && !hit(c.width - 1 - r, y)) r++;
        if(l >= c.width){ rowsMissed++; continue; }
        left = Math.max(left, l / dpr); right = Math.max(right, r / dpr);
    }
    return { left: Math.round(left), right: Math.round(right), rowsMissed };
}

if(require.main === module){
    (async () => {
        const started = Date.now(), report = [];
        const browser = await chromium.launch({ headless: true, ...await resolveChromiumRuntime() });
        const run = async (page, theme, key, w, h, dpr) => {
            const findings = [], phone = touchSize(w);
            await page.evaluate(() => { document.querySelector("#app main")?.scrollTo(0, 0); scrollTo(0, 0); });
            await page.waitForTimeout(250);
            if(shotDir){ fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `${theme}-${key}-${w}x${h}.png`) }); }
            // upright phones draw the board phone plate (an <img>, object-fit: cover) and are checked for faces only
            const swapped = phone ? 0 : await page.evaluate(magentaPlates, PLATE.source);
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
            const b = swapped ? await page.evaluate(bands, (await page.screenshot()).toString("base64")) : null;
            if(!phone) await page.evaluate(unMagenta);
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
            if(!phone && !swapped) findings.push("no board-room plate is drawn");
            else if(b && b.rowsMissed) findings.push(`the plate misses ${b.rowsMissed} of 3 sample rows`);
            else if(b && (b.left > BAND_OK || b.right > BAND_OK)) findings.push(`side bands: ${b.left}px left, ${b.right}px right`);
            if(!measureOnly){
                const res = await Face.checkFaces(page, key, w, h, dpr);
                for(const f of res.findings) findings.push(`face: ${f.what}`);
                if(key === "FINAL_WINNER") for(const what of await Face.finalWinnerResultClear(page)) findings.push(what);
                if(key === "GOLDEN") for(const what of await Face.goldenButtonClear(page)) findings.push(what);
            }
            report.push({ theme, screen: key, size: `${w}x${h}`, bands: b, findings });
            console.log(`${findings.length ? "FINDING" : "ok"} ${theme} ${key} ${w}x${h}${b ? ` (bands ${b.left}/${b.right})` : ""}${findings.map(f => "\n   " + f).join("")}`);
        };
        const ctx = async (theme, opts) => {
            const context = await browser.newContext(opts);
            if(theme !== "wooden") await context.addInitScript(t => { try{ localStorage.setItem("cmsClubhouseTheme", t); }catch(_error){} }, theme);
            await context.addInitScript(Face.specialPlayerFixture, Face.SP_FIXTURE);
            return context;
        };
        try{
            for(const theme of THEMES){
                const desk = SIZES.filter(([w]) => !touchSize(w)), touch = SIZES.filter(([w]) => touchSize(w));
                if(desk.length){
                    const context = await ctx(theme, { viewport: { width: desk[0][0], height: desk[0][1] }, deviceScaleFactor: 1 });
                    const page = await context.newPage();
                    for(const key of KEYS){
                        await page.setViewportSize({ width: desk[0][0], height: desk[0][1] });
                        await Face.openScreen(page, key);
                        for(const [w, h] of desk){ await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(600); await run(page, theme, key, w, h, 1); }
                    }
                    await context.close();
                }
                for(const [w, h] of touch){
                    const context = await ctx(theme, { viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
                    const page = await context.newPage();
                    for(const key of KEYS){ await Face.openScreen(page, key); await run(page, theme, key, w, h, 2); }
                    await context.close();
                }
            }
        } finally {
            await browser.close();
        }
        if(reportFile) fs.writeFileSync(reportFile, JSON.stringify(report, null, 1));
        const bad = report.filter(r => r.findings.length), secs = Math.round((Date.now() - started) / 1000);
        if(bad.length){ console.error(`FAIL r100 board fill: ${bad.length} of ${report.length} pictures have findings (${secs}s).`); process.exitCode = 1; }
        else console.log(`PASS r100 board fill: ${report.length} pictures (${THEMES.join(", ")} x ${KEYS.join(", ")} x ${SIZES.length} sizes) fill the window, faces and buttons clear (${secs}s).`);
    })().catch(error => { console.error(error); process.exitCode = 1; });
}

module.exports = { magentaPlates, unMagenta, bands };
