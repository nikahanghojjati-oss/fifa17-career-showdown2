"use strict";
// r96 font floor sweep (read-only). Opens every screen of tests/browser/r80-short-screens-audit.cjs (and each tab) at the window sizes
// given, finds every visible text under the floor (13px at 1024px wide and up, 12px below), and asks Chromium (CDP) which CSS rule
// WINS for that size, so the fix goes where the size is set. Prints JSON: one row per winning rule with the elements it hits.
// Usage: node tools/font-floor-sweep.cjs [SCREEN ...]   (CMS_BASE_URL, CMS_SWEEP_SIZES="1920x866,1366x768,1024x768", CMS_SWEEP_OUT=<file>)
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../tests/support/chromium-runtime.cjs");
const audit = require("../tests/browser/r80-short-screens-audit.cjs");
const { SCREENS, openScreen, tabsOf, TAB_SELECTOR } = audit;
const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const SIZES = (process.env.CMS_SWEEP_SIZES || "1920x866,1366x768,1024x768").split(",").map(s => s.split("x").map(Number));
const outFile = process.env.CMS_SWEEP_OUT || "";
const { sweepPage, rowsOf } = require("./font-floor-probe.cjs");
const extra = process.env.CMS_SWEEP_EXTRA ? require(require("node:path").resolve(process.env.CMS_SWEEP_EXTRA)) : {};

(async () => {
    const keys = process.argv.slice(2).length ? process.argv.slice(2) : [...Object.keys(SCREENS), ...Object.keys(extra)];
    const found = new Map();
    const browser = await chromium.launch({ headless: true, ...await resolveChromiumRuntime() });
    try{
        for(const [w, h] of SIZES){
            const floor = w >= 1024 ? 13 : 12;
            const context = await browser.newContext({ viewport: { width: w, height: h } });
            await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
            const page = await context.newPage();
            for(const key of keys){
                const spec = SCREENS[key] || extra[key];
                try{ if(SCREENS[key]) await openScreen(page, key); else await spec.open(page, { baseUrl }); }catch(error){ console.log(`${key} ${w}x${h}: not opened (${String(error.message).split("\n")[0]})`); continue; }
                const tabs = SCREENS[key] ? await tabsOf(page, spec.host) : [];
                for(const tab of [null, ...tabs]){
                    if(tab) await page.evaluate(({ host, i, sel }) => { const el = document.getElementById(host).querySelectorAll(sel)[i]; (el.labels && el.labels[0] || el).click(); }, { host: spec.host, i: tab.i, sel: TAB_SELECTOR });
                    if(tab) await page.waitForTimeout(150);
                    await sweepPage(page, spec.host, floor, found, `${key}${tab ? " [" + tab.text + "]" : ""} ${w}x${h}`);
                }
                console.log(`${key} ${w}x${h}: swept`);
            }
            await context.close();
        }
    }finally{ await browser.close(); }
    const rows = rowsOf(found);
    const text = JSON.stringify(rows, null, 1);
    if(outFile) fs.writeFileSync(outFile, text); else console.log(text);
    console.log(`${rows.length} winning rule(s) set a size under the floor`);
})().catch(error => { console.error(error); process.exit(1); });
