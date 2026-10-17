/* Builds the League Marks V2 proof sheet (HTML + PNG at 1x and 3x).
   Usage: node visual-assets/league-marks-v2/build-proof.cjs
   Needs playwright (globally installed in the cloud image is fine). */
"use strict";

const fs = require("fs");
const path = require("path");
const marks = require("./leagueMarksV2.js");

const OUT_DIR = __dirname;
const GOLD = "#e2b84a";
const INK = "#121212";
const BLACK = "#0b0b0c";
const ORDER = ["premier_league", "laliga", "bundesliga", "serie_a", "ligue_1"];

function markSvg(id, option, tone, size){
    const mark = marks.getLeagueMarkV2(id, option, tone);
    return mark.svg.replace("<svg ", `<svg width="${size}" height="${size}" `);
}

function swatch(id, option, tone, size){
    const bg = tone === "gold" ? BLACK : GOLD;
    return `<div class="sw" style="background:${bg};width:${size + 16}px;height:${size + 16}px">${markSvg(id, option, tone, size)}</div>`;
}

function leagueRow(id){
    const league = marks.LEAGUE_MARK_V2_CANDIDATES[id];
    const cells = ["a", "b"].map((option) => {
        const opt = league.options[option];
        return `<div class="opt">
            <div class="optHead"><span class="tag">${option.toUpperCase()}</span><b>${opt.label}</b></div>
            <div class="sizes">
                ${swatch(id, option, "gold", 96)}${swatch(id, option, "ink", 96)}
                <div class="small">
                    <div class="pair">${swatch(id, option, "gold", 32)}${swatch(id, option, "ink", 32)}<i>32</i></div>
                    <div class="pair">${swatch(id, option, "gold", 20)}${swatch(id, option, "ink", 20)}<i>20</i></div>
                </div>
            </div>
            <p>${opt.note}</p>
        </div>`;
    }).join("");
    return `<section class="row"><h2>${league.name}</h2>${cells}</section>`;
}

function wheel(option, selectedIndex, size){
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = size / 2 - 14;
    const rInner = rOuter - 4;
    const n = ORDER.length;
    const step = 360 / n;
    const offset = -90 - step / 2;
    const polar = (r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
    let wedges = "";
    let icons = "";
    ORDER.forEach((id, index) => {
        const a0 = offset + index * step;
        const a1 = a0 + step;
        const [x0, y0] = polar(rInner, a0);
        const [x1, y1] = polar(rInner, a1);
        const selected = index === selectedIndex;
        const fill = selected ? "url(#wsel)" : (index % 2 ? "#141416" : "#1c1c1f");
        wedges += `<path d="M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${rInner} ${rInner} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${fill}" stroke="#7a5e1c" stroke-width="2"/>`;
        const mid = a0 + step / 2;
        const [ix, iy] = polar(rInner * 0.6, mid);
        const iconSize = rInner * 0.42;
        const mark = marks.getLeagueMarkV2(id, option, selected ? "ink" : "gold");
        const inner = mark.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
        icons += `<svg x="${(ix - iconSize / 2).toFixed(2)}" y="${(iy - iconSize / 2).toFixed(2)}" width="${iconSize.toFixed(2)}" height="${iconSize.toFixed(2)}" viewBox="0 0 100 100">${inner}</svg>`;
        const [tx, ty] = polar(rInner * 0.86, mid);
        icons += `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" transform="rotate(${(mid + 90).toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${(size / 34).toFixed(1)}" letter-spacing="1.5" fill="${selected ? INK : GOLD}">${marks.LEAGUE_MARK_V2_CANDIDATES[id].name.toUpperCase()}</text>`;
    });
    let studs = "";
    for(let index = 0; index < 30; index += 1){
        const [sx, sy] = polar(rOuter + 5, index * 12);
        studs += `<circle cx="${sx.toFixed(2)}" cy="${sy.toFixed(2)}" r="2.2" fill="#3b2c08"/>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
            <radialGradient id="wglow" cx="50%" cy="50%" r="50%"><stop offset=".82" stop-color="#e2b84a" stop-opacity=".0"/><stop offset=".93" stop-color="#e2b84a" stop-opacity=".45"/><stop offset="1" stop-color="#e2b84a" stop-opacity="0"/></radialGradient>
            <linearGradient id="wrim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc84"/><stop offset=".5" stop-color="#b8892a"/><stop offset="1" stop-color="#f1cf6b"/></linearGradient>
            <linearGradient id="wsel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d067"/><stop offset="1" stop-color="#d4a73a"/></linearGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="url(#wglow)"/>
        <circle cx="${cx}" cy="${cy}" r="${rOuter + 9}" fill="url(#wrim)"/>
        <circle cx="${cx}" cy="${cy}" r="${rOuter + 1}" fill="#0b0b0c"/>
        ${studs}
        ${wedges}
        ${icons}
        <circle cx="${cx}" cy="${cy}" r="${size * 0.07}" fill="url(#wrim)"/>
        <circle cx="${cx}" cy="${cy}" r="${size * 0.055}" fill="#0b0b0c"/>
        <path d="M${cx - 14} 4L${cx + 14} 4L${cx} 30Z" fill="url(#wrim)" stroke="#0b0b0c" stroke-width="2"/>
    </svg>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>League Marks V2 Proof</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#070708;color:#efe6cc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;width:1400px;padding:28px 32px 36px}
h1{margin:0 0 4px;font-size:26px;letter-spacing:.06em;color:${GOLD}}
.sub{margin:0 0 22px;color:#a99d7d;font-size:13px}
.row{display:grid;grid-template-columns:150px 1fr 1fr;gap:18px;align-items:center;padding:14px 0;border-top:1px solid #2a2418}
.row h2{margin:0;font-size:17px;color:#f0e2b4;letter-spacing:.04em}
.opt{background:#121112;border:1px solid #2e2717;border-radius:12px;padding:10px 12px}
.optHead{display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:14px}
.tag{background:${GOLD};color:${INK};font-weight:800;border-radius:4px;padding:1px 7px;font-size:12px}
.sizes{display:flex;gap:10px;align-items:center}
.sw{display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid #3a3020}
.small{display:flex;flex-direction:column;gap:8px;margin-left:6px}
.pair{display:flex;gap:6px;align-items:center}
.pair i{font-style:normal;color:#8d8167;font-size:11px;margin-left:2px}
.opt p{margin:8px 0 0;color:#a99d7d;font-size:12px}
.wheels{display:flex;gap:28px;justify-content:center;padding-top:22px;border-top:1px solid #2a2418;margin-top:6px}
.wheel{text-align:center}
.wheel h3{margin:0 0 10px;color:#f0e2b4;font-size:15px;letter-spacing:.08em}
.foot{margin-top:18px;color:#8d8167;font-size:12px}
</style></head><body>
<h1>LEAGUE MARKS V2 — CANDIDATES</h1>
<p class="sub">One bold original symbol per league, two options each. Every option shown as solid gold on black (unselected) and near-black on gold (selected) at 96, 32 and 20 px. Not wired into the app; live getLeagueMark is unchanged.</p>
${ORDER.map(leagueRow).join("")}
<div class="wheels">
  <div class="wheel"><h3>SET A ON THE WHEEL · PREMIER LEAGUE SELECTED</h3>${wheel("a", 0, 520)}</div>
  <div class="wheel"><h3>SET B ON THE WHEEL · SERIE A SELECTED</h3>${wheel("b", 3, 520)}</div>
</div>
<p class="foot">Source: visual-assets/league-marks-v2/leagueMarksV2.js · build: node visual-assets/league-marks-v2/build-proof.cjs</p>
</body></html>`;

async function main(){
    const htmlPath = path.join(OUT_DIR, "LEAGUE_MARKS_V2_PROOF.html");
    fs.writeFileSync(htmlPath, html);
    let chromium;
    try{ ({ chromium } = require("playwright")); }catch(error){ ({ chromium } = require(path.join(process.env.NODE_PATH || "/usr/local/lib/node_modules", "playwright"))); }
    const browser = await chromium.launch();
    for(const scale of [1, 3]){
        const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: scale });
        await page.goto(`file://${htmlPath}`);
        await page.screenshot({ path: path.join(OUT_DIR, `LEAGUE_MARKS_V2_PROOF@${scale}x.png`), fullPage: true });
        await page.close();
    }
    await browser.close();
    console.log("wrote", htmlPath);
}

main().catch((error) => { console.error(error); process.exit(1); });
