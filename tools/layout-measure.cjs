"use strict";
// r95 layout measure (read-only). Opens every screen (and every tab of it) of the real app the way the r80 short-screens audit does,
// at each window size below, records the box of every visible text, control and image, and flags:
//   EDGE     gap to the window edge under the gutter scale (content 16px, 12px under 380px wide; corner controls 12px; tab bar 8px);
//   SIBLING  gaps between neighbouring siblings that differ by more than 2px (needs three or more in a row or column);
//   ALIGN    siblings in a column whose left edges, or centres, differ by 1-3px (almost lined up, not quite);
//   OVERLAP  two text or control boxes that intersect;
//   FONT     text under 12px on phones or 13px on desktop;
//   TAP      tap target under 44px on phones (an invisible ::after hit area counts);
//   CLIP     text cut by its own box or by a clipping ancestor.
// It changes nothing: no clicks except opening tabs, no storage writes beyond the audit's own fixtures, nothing leaves the local origin.
// Usage: node tools/layout-measure.cjs [SCREEN ...]
//   CMS_BASE_URL (default http://127.0.0.1:4173/), CMS_MEASURE_SIZES="402x874,1920x866" (default: the six sizes below),
//   CMS_MEASURE_OUT=<file> (default gameplay/r95/audit/LAYOUT_MEASURE.md under /mnt/project-files when it exists, else the repo),
//   CMS_MEASURE_ROWS=<n> (rows kept per table, default 20).
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../tests/support/chromium-runtime.cjs");
const audit = require("../tests/browser/r80-short-screens-audit.cjs");
const { SCREENS, openScreen, tabsOf, TAB_SELECTOR } = audit;

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const SIZES = (process.env.CMS_MEASURE_SIZES || "1920x866,1920x1035,1920x1080,1366x768,402x874,874x402").split(",").map(s => s.split("x").map(Number));
const ROWS = Number(process.env.CMS_MEASURE_ROWS || 20);
const projectOut = "/mnt/project-files/gameplay/r95/audit";
const outFile = process.env.CMS_MEASURE_OUT || path.join(fs.existsSync(projectOut) ? projectOut : path.join(__dirname, "..", "gameplay", "r95", "audit"), "LAYOUT_MEASURE.md");
const touchSize = (w, h) => w < 900 || h < 500;

// ---------- runs in the page ----------
function measure({ host, phone }){
    const vw = innerWidth, vh = innerHeight, rows = [];
    const root = document.getElementById(host) || document.body;
    const gutter = vw < 380 ? 12 : 16, minFont = phone ? 12 : 13;
    const round = n => Math.round(n * 10) / 10;
    const name = el => { const id = el.id ? "#" + el.id : ""; const c = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""; return el.tagName.toLowerCase() + id + c; };
    const text = el => (el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("alt") || "").replace(/\s+/g, " ").trim().slice(0, 28);
    const label = el => `${name(el)}${text(el) ? ` "${text(el)}"` : ""}`;
    const shown = el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getClientRects().length > 0;
    const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    const isControl = el => el.matches("button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],summary,label[for]");
    const box = el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height }; };
    const add = (check, score, el, detail) => rows.push({ check, score: round(score), el: label(el), detail });
    // visible elements that carry text, are controls, or are images: the things a person sees
    const all = [...root.querySelectorAll("*")].filter(el => shown(el) && !el.closest("svg, script, style, [aria-hidden=true] .sr-only"));
    const things = all.filter(el => {
        if(el.matches("svg *")) return false;
        const b = box(el); if(b.w < 2 || b.h < 2) return false;
        if(getComputedStyle(el).position === "fixed" && b.w >= vw - 1 && b.h >= vh - 1) return false;
        return ownText(el) || isControl(el) || el.matches("img,svg,canvas,video");
    });
    // zone of an element: a tab bar sits 8px in, a corner control 12px, everything else on the gutter scale
    const zone = el => el.closest(".sd-nav-bottom, .sd-nav-rail") ? 8 : el.closest(".sd-nav-corner, #topHeader, #onlinePlayerIdentityBadge, .sd-nav-gear, .legacyBack, #legacyBack") ? 12 : gutter;
    // EDGE
    for(const el of things){
        const b = box(el);
        if(b.right < 0 || b.left > vw) continue;                       // off canvas (scrolled sheets, hidden panels)
        const need = zone(el);
        if(el.closest(".sd-nav-bottom") && !el.matches("button,a")) continue;
        const l = b.left, r = vw - b.right;
        if(l < need - 0.5 || r < need - 0.5) {
            // a box that spans the whole window is a background band, not content
            if(b.w >= vw - 1 && !ownText(el)) continue;
            add("EDGE", need - Math.min(l, r), el, `left ${round(l)}px, right ${round(r)}px, scale ${need}px`);
        }
    }
    // FONT
    for(const el of things){
        if(!ownText(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if(fs < minFont - 0.01) add("FONT", minFont - fs, el, `${round(fs)}px, minimum ${minFont}px`);
    }
    // TAP (phones)
    if(phone) for(const el of things){
        if(!isControl(el) || el.matches("input[type=hidden],label[for]") && !el.control) continue;
        if(el.matches("input[type=checkbox],input[type=radio]") && el.labels && el.labels.length) continue;       // its label is the target
        if(el.closest(".sr-only, [hidden]")) continue;
        const b = box(el); let w = b.w, h = b.h;
        const ps = getComputedStyle(el, "::after");
        if(ps && ps.content !== "none" && ps.position === "absolute"){ w = Math.max(w, parseFloat(ps.width) || 0); h = Math.max(h, parseFloat(ps.height) || 0); }
        if(el.tagName === "A" && getComputedStyle(el).display === "inline"){ h = Math.max(h, parseFloat(getComputedStyle(el).paddingTop) * 2 + b.h); }
        if(w < 43.5 || h < 43.5) add("TAP", 44 - Math.min(w, h), el, `${round(w)}x${round(h)}px, minimum 44px`);
    }
    // OVERLAP
    // decorative art (absolute/fixed images, empty alt, aria-hidden, window-sized) and sticky or fixed bars (the r80 audit's S5 covers those) are not overlap candidates
    const decorative = el => el.matches("img,svg,canvas,video") && (/^(absolute|fixed)$/.test(getComputedStyle(el).position) || el.getAttribute("alt") === "" || el.closest("[aria-hidden=true]") || box(el).w * box(el).h > vw * vh * 0.3);
    const barred = el => { for(let a = el; a && a !== document.body; a = a.parentElement) if(/^(fixed|sticky)$/.test(getComputedStyle(a).position)) return true; return false; };
    const leaf = things.filter(el => (!isControl(el) || !el.querySelector("button,a[href],input")) && !decorative(el) && !barred(el));
    for(let i = 0; i < leaf.length; i++) for(let j = i + 1; j < leaf.length; j++){
        const a = leaf[i], c = leaf[j];
        if(a.contains(c) || c.contains(a)) continue;
        if(a.closest("button,a,label,summary") && a.closest("button,a,label,summary") === c.closest("button,a,label,summary")) continue;
        const A = box(a), B = box(c);
        const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
        if(w > 1 && h > 1) add("OVERLAP", Math.min(w, h), a, `with ${label(c)} by ${round(w)}x${round(h)}px`);
    }
    // SIBLING gaps and ALIGN
    for(const parent of new Set(things.map(el => el.parentElement).filter(Boolean))){
        const kids = [...parent.children].filter(k => shown(k) && getComputedStyle(k).position !== "absolute" && getComputedStyle(k).position !== "fixed" && box(k).w > 2 && box(k).h > 2 && (things.includes(k) || k.querySelector("*")));
        if(kids.length < 3 || parent.matches("table,thead,tbody,tr")) continue;
        const bs = kids.map(box);
        const overlapY = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1, overlapX = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1;
        const column = bs.every((b, i) => i === 0 || overlapX(b, bs[0])), row = bs.every((b, i) => i === 0 || overlapY(b, bs[0]));
        if(column === row) continue;
        const order = kids.map((k, i) => i).sort((x, y) => column ? bs[x].top - bs[y].top : bs[x].left - bs[y].left);
        const gaps = [];
        for(let i = 1; i < order.length; i++){ const p = bs[order[i - 1]], n = bs[order[i]]; gaps.push(column ? n.top - p.bottom : n.left - p.right); }
        if(gaps.some(g => g < -0.5)) continue;
        const spread = Math.max(...gaps) - Math.min(...gaps);
        if(spread > 2.01) add("SIBLING", spread - 2, parent, `${column ? "column" : "row"} of ${kids.length}: gaps ${gaps.map(round).join(", ")}px`);
        if(column) for(const edge of ["left", "centre"]){
            const v = order.map(i => edge === "left" ? bs[i].left : (bs[i].left + bs[i].right) / 2);
            // compare each pair: 1-3px apart means almost aligned
            for(let i = 0; i < v.length; i++) for(let j = i + 1; j < v.length; j++){
                const d = Math.abs(v[i] - v[j]);
                if(d >= 1 && d <= 3) add("ALIGN", 3 - d + 0.5, kids[order[i]], `${edge} edge ${round(d)}px off ${label(kids[order[j]])}`);
            }
        }
    }
    // CLIP
    const scroller = root.querySelector("main") || document.querySelector("main");
    for(const el of things){
        const cs = getComputedStyle(el);
        if(ownText(el) && /(hidden|clip)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== "ellipsis" || ownText(el) && cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1)
            add("CLIP", el.scrollWidth - el.clientWidth, el, `text ${el.scrollWidth}px in a ${el.clientWidth}px box`);
        else if(ownText(el)){
            const b = box(el);
            for(let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement){
                if(a === scroller) break;
                const as = getComputedStyle(a); if(!/(hidden|clip)/.test(as.overflowX + as.overflowY)) continue;
                const r = box(a), cut = Math.max(r.left - b.left, b.right - r.right, as.overflowY === "visible" ? 0 : Math.max(r.top - b.top, b.bottom - r.bottom));
                if(cut > 1 && r.w > 0 && r.h > 0 && b.right > 0 && b.left < vw) { add("CLIP", cut, el, `cut ${round(cut)}px by ${name(a)}`); break; }
            }
        }
    }
    // dedupe identical rows
    const seen = new Set();
    return rows.filter(r => { const k = r.check + r.el + r.detail; if(seen.has(k)) return false; seen.add(k); return true; });
}

// ---------- the run ----------
const CHECKS = ["EDGE", "SIBLING", "ALIGN", "OVERLAP", "FONT", "TAP", "CLIP"];
(async () => {
    const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCREENS);
    const tables = [];
    const browser = await chromium.launch({ headless: true, ...await resolveChromiumRuntime() });
    try{
        for(const [w, h] of SIZES){
            const touch = touchSize(w, h);
            const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch });
            await context.route("**/*", route => new URL(route.request().url()).origin === baseUrl.origin ? route.continue() : route.abort());
            const page = await context.newPage();
            for(const key of keys){
                try{ await openScreen(page, key); }catch(error){ tables.push({ view: key, size: `${w}x${h}`, error: String(error.message).split("\n")[0], rows: [] }); continue; }
                for(const tab of [null, ...await tabsOf(page, SCREENS[key].host)]){
                    const view = tab ? `${key} [${tab.text}]` : key;
                    if(tab){ await page.evaluate(({ host, i, sel }) => { const el = document.getElementById(host).querySelectorAll(sel)[i]; (el.labels && el.labels[0] || el).click(); }, { host: SCREENS[key].host, i: tab.i, sel: TAB_SELECTOR }); await page.waitForTimeout(900); }
                    const rows = await page.evaluate(measure, { host: SCREENS[key].host, phone: touch });
                    tables.push({ view, size: `${w}x${h}`, rows });
                    console.log(`${view} ${w}x${h}: ${rows.length} flag(s)`);
                }
            }
            await context.close();
        }
    }finally{ await browser.close(); }

    // ---------- the report ----------
    const esc = s => String(s).replace(/\|/g, "/");
    const out = ["# Layout measure", "",
        `Generated by \`tools/layout-measure.cjs\` (read-only). Sizes: ${SIZES.map(s => s.join("x")).join(", ")}. Phones are 402x874 and 874x402 (touch).`, "",
        "Scale checked: content 16px from the window edge (12px under 380px wide), corner controls 12px, tab bar 8px; sibling gaps within 2px of each other; type 12px phone / 13px desktop; tap targets 44px on phones. Higher score = worse. Each table keeps the worst " + ROWS + " rows.", "",
        "## Summary", "", "| Screen / state | Size | " + CHECKS.join(" | ") + " | Total |", "|---|---|" + CHECKS.map(() => "--:").join("|") + "|--:|"];
    for(const t of tables){
        if(t.error){ out.push(`| ${esc(t.view)} | ${t.size} | not measured: ${esc(t.error)} |${CHECKS.map(() => "").join("|")}| |`); continue; }
        const n = c => t.rows.filter(r => r.check === c).length;
        out.push(`| ${esc(t.view)} | ${t.size} | ${CHECKS.map(n).join(" | ")} | ${t.rows.length} |`);
    }
    const totals = Object.fromEntries(CHECKS.map(c => [c, tables.reduce((s, t) => s + t.rows.filter(r => r.check === c).length, 0)]));
    out.push("", "Totals: " + CHECKS.map(c => `${c} ${totals[c]}`).join(", "), "");
    for(const t of tables.filter(t => t.rows.length)){
        const sorted = [...t.rows].sort((a, b) => b.score - a.score);
        out.push(`## ${t.view} at ${t.size}`, "", `${t.rows.length} flag(s)${sorted.length > ROWS ? `, worst ${ROWS} shown` : ""}.`, "", "| Check | Score | Element | Detail |", "|---|--:|---|---|");
        for(const r of sorted.slice(0, ROWS)) out.push(`| ${r.check} | ${r.score} | ${esc(r.el)} | ${esc(r.detail)} |`);
        out.push("");
    }
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, out.join("\n"));
    console.log(`layout measure: ${tables.reduce((s, t) => s + t.rows.length, 0)} flag(s) in ${tables.length} view(s) -> ${outFile}`);
})().catch(error => { console.error(error); process.exit(1); });
