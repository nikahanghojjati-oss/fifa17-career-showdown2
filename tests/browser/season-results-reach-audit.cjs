"use strict";
// r100 B7 (Verify F1 on #1625, lead 2026-11-25): in short desktop windows (a Chromebook window dragged short, 900-1366 wide x
// 340-520 tall) the Season Results entry rows were squeezed into a fixed box: the inputs overlapped, the labels printed over each
// other, the cards slid over the scoring panel, and some inputs could not be clicked at all (base 1100x340: League Position sat
// under the trophies column). The fix lets `main` scroll and keeps every row at its full height. This audit drags one mouse window
// through every short size in every clubhouse and fails when:
//   R1 an input or button of Season Results cannot be clicked after it is scrolled into view (the point at its centre belongs to
//      something else; a checkbox drawn as a label tab is tested on that label);
//   R2 two label texts inside one card print over each other;
//   R3 a manager card is drawn over the scoring panel;
//   R4 a row sticks out of its card;
//   R5 a score box runs into the trophies column or over another row's words;
//   R6 the two cards are not centred under the scoring panel.
// Usage: node tests/browser/season-results-reach-audit.cjs
//   CMS_BASE_URL (default http://127.0.0.1:4173/), CMS_REACH_SIZES="1100x340,901x520" (overrides the grid),
//   CMS_REACH_CLUBHOUSES="wooden,silver" (default all four).
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");
const { openScreen } = require("./r91-old-art-audit.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const WIDTHS = [900, 901, 1011, 1100, 1280, 1366];
const HEIGHTS = [340, 380, 420, 460, 520];
const SIZES = process.env.CMS_REACH_SIZES
    ? process.env.CMS_REACH_SIZES.split(",").map(s => s.split("x").map(Number))
    : WIDTHS.flatMap(w => HEIGHTS.map(h => [w, h]));
const CLUBHOUSES = (process.env.CMS_REACH_CLUBHOUSES || "wooden,silver,black,matte").split(",");

// runs in the page: every finding at the current window size
async function reachFindings(){
    const out = [];
    const se = document.querySelector("#seasonEntry");
    if(!se || se.classList.contains("hidden")) return ["R0 Season Results is not open"];
    const shown = el => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden" && !el.closest(".hidden");
    const meet = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const name = el => el.id || el.getAttribute("aria-label") || el.textContent.trim().replace(/\s+/g, " ").slice(0, 24);
    const cards = [...se.querySelectorAll(".seasonResultCard")].filter(shown);
    const panel = se.querySelector(".scoring-panel");
    if(panel && shown(panel)) for(const c of cards) if(meet(c.getBoundingClientRect(), panel.getBoundingClientRect())) out.push(`R3 card ${c.id} is drawn over the scoring panel`);
    for(const c of cards){
        const cr = c.getBoundingClientRect();
        const labels = [...c.querySelectorAll(":scope>label, .achievementChecks label")].filter(shown);
        const texts = labels.map(l => {
            const t = [...l.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()) || l.querySelector("span");
            if(!t) return null;
            const range = document.createRange(); range.selectNodeContents(t);
            return { l, r: range.getBoundingClientRect() };
        }).filter(Boolean);
        for(let i = 0; i < texts.length; i++) for(let j = i + 1; j < texts.length; j++) if(meet(texts[i].r, texts[j].r)) out.push(`R2 "${name(texts[i].l)}" prints over "${name(texts[j].l)}" in ${c.id}`);
        for(const l of labels){ const lr = l.getBoundingClientRect(); if(lr.bottom > cr.bottom + 1 || lr.top < cr.top - 1 || lr.right > cr.right + 1 || lr.left < cr.left - 1) out.push(`R4 "${name(l)}" sticks out of ${c.id}`); }
        const checks = c.querySelector(".achievementChecks");
        for(const input of [...c.querySelectorAll("input[type=number]")].filter(shown)){
            const ir = input.getBoundingClientRect();
            if(checks && shown(checks) && meet(ir, checks.getBoundingClientRect())) out.push(`R5 ${input.id} runs into the trophies column of ${c.id}`);
            for(const t of texts) if(!t.l.contains(input) && meet(ir, t.r)) out.push(`R5 ${input.id} is drawn over "${name(t.l)}" in ${c.id}`);
        }
    }
    const grid = se.querySelector(".seasonEntryGrid");
    if(grid && panel && shown(grid) && shown(panel)){
        const g = grid.getBoundingClientRect(), pr = panel.getBoundingClientRect();
        const off = (g.left + g.right) / 2 - (pr.left + pr.right) / 2;
        if(Math.abs(off) > 2) out.push(`R6 the cards are ${Math.round(off)}px off centre under the scoring panel`);
    }
    const controls = [...se.querySelectorAll("input:not([type=hidden]), select, textarea, button")].filter(shown);
    for(const el of controls){
        let target = el;
        const box = el.getBoundingClientRect();
        if(box.width <= 2 || box.height <= 2){ // a visually hidden checkbox; people tap its label
            const tab = el.id && se.querySelector(`label[for="${el.id}"]`);
            if(!tab || !shown(tab)) continue;
            target = tab;
        }
        target.scrollIntoView({ block: "center", inline: "center" });
        await frame();
        const q = target.getBoundingClientRect();
        if(q.bottom <= 0 || q.top >= innerHeight || q.right <= 0 || q.left >= innerWidth){ out.push(`R1 ${name(el)} stays off screen after scrolling (${Math.round(q.left)},${Math.round(q.top)})`); continue; }
        const x = Math.min(innerWidth - 1, Math.max(0, q.left + q.width / 2)), y = Math.min(innerHeight - 1, Math.max(0, q.top + q.height / 2));
        const hit = document.elementFromPoint(x, y);
        const own = el.closest("label") || (el.id && se.querySelector(`label[for="${el.id}"]`));
        if(!(hit && (hit === el || target.contains(hit) || el.contains(hit) || (own && own.contains(hit))))){
            const by = hit ? `${hit.tagName.toLowerCase()}${hit.id ? "#" + hit.id : ""}${hit.className && typeof hit.className === "string" ? "." + hit.className.trim().split(/\s+/)[0] : ""}` : "nothing";
            out.push(`R1 ${name(el)} cannot be clicked: its centre (${Math.round(x)},${Math.round(y)}) is covered by ${by}`);
        }
    }
    const main = document.querySelector("#app main");
    if(main) main.scrollTop = 0;
    return out;
}

if(require.main === module){
    (async () => {
        const started = Date.now();
        const report = [];
        const browser = await chromium.launch({ headless: true, ...await resolveChromiumRuntime() });
        try{
            for(const club of CLUBHOUSES){
                const theme = club === "wooden" ? "" : club;
                const context = await browser.newContext({ viewport: { width: SIZES[0][0], height: SIZES[0][1] }, serviceWorkers: "block", reducedMotion: "reduce" });
                await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
                if(theme) await context.addInitScript(t => { try{ localStorage.setItem("cmsClubhouseTheme", t); }catch(_error){} }, theme);
                const page = await context.newPage();
                await openScreen(page, "SEASON_ENTRY");
                for(const [w, h] of SIZES){
                    await page.setViewportSize({ width: w, height: h });
                    await page.waitForTimeout(250);
                    const findings = [...new Set(await page.evaluate(reachFindings))];
                    for(const what of findings) report.push({ club, size: `${w}x${h}`, what });
                    console.log(`${findings.length ? "FINDING" : "ok"} ${club} ${w}x${h}${findings.map(f => "\n   " + f).join("")}`);
                }
                await context.close();
            }
        } finally {
            await browser.close();
        }
        const secs = Math.round((Date.now() - started) / 1000);
        if(report.length){ console.error(`FAIL Season Results reach: ${report.length} finding(s) across ${CLUBHOUSES.length} clubhouses x ${SIZES.length} short windows (${secs}s).`); process.exitCode = 1; }
        else console.log(`PASS Season Results reach: every input and button can be clicked, ${CLUBHOUSES.length} clubhouses x ${SIZES.length} short windows (${secs}s).`);
    })().catch(error => { console.error(error); process.exitCode = 1; });
}

module.exports = { reachFindings, SIZES, CLUBHOUSES };
