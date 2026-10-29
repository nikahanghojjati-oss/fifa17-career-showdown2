// HO-031 v3 swap check. Opens LEAGUE / STANDINGS / RIVALRY / TROPHY_ROOM exactly as Team G's
// tests/browser/phone-marble-facecheck-audit.cjs does (its exported openScreen), hides the screen's old phone art
// (ENV_RV_PHONE / ENV_TR_PHONE / *_PHONE_V1 pictures and OVL_*_PHONE cut-outs), draws a plate the way the r78 screens draw
// the V2 plates (cover, centre top, behind the screen's UI), and runs the audit's own faceHits / fadedManagers walks
// (copied verbatim from the audit file at run time) against the given zone file. Nothing is written to the app tree:
// the plate is served through a Playwright route.
// Usage (from the gameplay worktree root):
//   node swapcheck.cjs <plate dir> <V2|V3> <zones.json> [shot dir] [KEY ...]
"use strict";
process.env.CMS_CHROMIUM_MULTI_CONTEXT = process.env.CMS_CHROMIUM_MULTI_CONTEXT || "1";
const fs = require("node:fs");
const path = require("node:path");
const ROOT = process.cwd();
const AUDIT = path.join(ROOT, "tests/browser/phone-marble-facecheck-audit.cjs");
const { chromium } = require(require.resolve("playwright", { paths: [ROOT] }));
const { resolveChromiumRuntime } = require(path.join(ROOT, "tests/support/chromium-runtime.cjs"));
const { openScreen } = require(AUDIT);
const src = fs.readFileSync(AUDIT, "utf8");
const grab = name => { const i = src.indexOf(`function ${name}(`); const j = src.indexOf("\nfunction ", i + 10); const body = src.slice(i, j); return body.slice(0, body.lastIndexOf("}") + 1); };
const faceHitsSrc = grab("faceHits"), fadedSrc = grab("fadedManagers");
const [plateDir, ver, zonesFile, shotDir, ...rest] = process.argv.slice(2);
const KEYS = rest.length ? rest : ["LEAGUE", "STANDINGS", "RIVALRY", "TROPHY_ROOM"];
const ZONES = JSON.parse(fs.readFileSync(zonesFile, "utf8")).zones;
const SIZES = (process.env.H31_SIZES || "412x915,384x854,360x800,340x960").split(",").map(x => x.split("x").map(Number));
const IW = 1179, IH = parseInt(process.env.H31_IH || "2096", 10);
const HOSTS = { LEAGUE: "leagueWheelScreen", STANDINGS: "standings", RIVALRY: "statistics", TROPHY_ROOM: "trophyRoom" };

async function diffZones(page, a, b, faces){
    return page.evaluate(async ({ a, b, faces }) => {
        const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + src; });
        const [A, B] = await Promise.all([load(a), load(b)]);
        const c = document.createElement("canvas"); c.width = A.width; c.height = A.height; const g = c.getContext("2d");
        const k = A.width / innerWidth;
        const get = img => { g.clearRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
        const da = get(A), db = get(B);
        return faces.map(f => { let changed = 0, max = 0;
            for(let y = Math.ceil(f[1] * k); y < Math.floor(f[3] * k); y++) for(let x = Math.max(0, Math.ceil(f[0] * k)); x < Math.min(c.width, Math.floor(f[2] * k)); x++){
                const o = (y * c.width + x) * 4; const d = Math.max(Math.abs(da[o] - db[o]), Math.abs(da[o + 1] - db[o + 1]), Math.abs(da[o + 2] - db[o + 2]));
                if(d > max) max = d; if(d > 6) changed++; }
            return { changed, max }; });
    }, { a: a.toString("base64"), b: b.toString("base64"), faces });
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    const report = {};
    let failed = 0;
    try{
        for(const key of KEYS){
            report[key] = {};
            for(const [w, h] of SIZES){
                const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
                const page = await context.newPage();
                const errors = []; page.on("pageerror", e => errors.push(e.message));
                await page.route("**/__h31plate/*", route => {
                    const f = path.join(plateDir, path.basename(new URL(route.request().url()).pathname));
                    route.fulfill({ status: 200, contentType: "image/webp", body: fs.readFileSync(f) });
                });
                await openScreen(page, key);
                const hidden = await page.evaluate(({ host, url }) => {
                    const old = /OVL_[A-Z_]*PHONE|ENV_RV_PHONE|ENV_TR_PHONE|_PHONE_V1|PHONE_V1/;
                    const out = [];
                    for(const el of document.querySelectorAll("body *")){
                        const s = (el.tagName === "IMG" ? (el.currentSrc || el.src || "") : "") + " " + getComputedStyle(el).backgroundImage;
                        if(old.test(s)){ el.style.setProperty("visibility", "hidden", "important"); el.dataset.h31Old = "1"; out.push(el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0]); }
                    }
                    const hostEl = document.getElementById(host);
                    hostEl.style.setProperty("isolation", "isolate", "important");
                    const img = document.createElement("img");
                    img.className = "h31-plate"; img.alt = ""; img.src = url;
                    Object.assign(img.style, { position: "fixed", left: "0", top: "0", width: "100vw", height: "100vh", objectFit: "cover", objectPosition: "center top", zIndex: "-1", pointerEvents: "none" });
                    hostEl.insertBefore(img, hostEl.firstChild);
                    // full-screen stage layers of the old look paint an opaque backdrop over the plate: make those
                    // backdrops transparent (only elements covering >= 45% of the screen; cards keep their fills)
                    const cleared = new Set();
                    for(let gy = 0.05; gy < 1; gy += 0.1) for(let gx = 0.1; gx < 1; gx += 0.2){
                        for(const el of document.elementsFromPoint(gx * innerWidth, gy * innerHeight)){
                            if(el === img || el === document.body || el === document.documentElement) break;
                            const r = el.getBoundingClientRect();
                            if(r.width * r.height >= 0.45 * innerWidth * innerHeight && !cleared.has(el)){
                                el.style.setProperty("background", "transparent", "important"); cleared.add(el); }
                        }
                    }
                    out.push(...[...cleared].map(el => "backdrop:" + el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + "." + String(el.className).split(" ")[0]));
                    return out;
                }, { host: HOSTS[key], url: `/__h31plate/ENV_${key}_PHONE_${ver}.webp` });
                await page.waitForFunction(() => { const i = document.querySelector("img.h31-plate"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 });
                // HO-032 emulation (H31_WHEEL_SCALE=0.85): Team G's phone wheel 15% smaller about its own centre
                const wheelScale = parseFloat(process.env.H31_WHEEL_SCALE || "1");
                if(key === "LEAGUE" && wheelScale !== 1) await page.addStyleTag({ content: `#leagueWheel{transform:scale(${wheelScale})!important}` });
                // a transformed screen host makes position:fixed relative to the host: shift the plate back onto the viewport
                const plateRect = await page.evaluate(() => { const i = document.querySelector("img.h31-plate"); let r = i.getBoundingClientRect();
                    i.style.left = (-r.left) + "px"; i.style.top = (-r.top) + "px"; r = i.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10); });
                await page.waitForTimeout(1500);
                const s = Math.max(w / IW, h / IH), ox = (w - IW * s) / 2;
                const faces = ZONES[key].map(([a, c, d, e]) => [ox + a * IW * s, c * IH * s, ox + d * IW * s, e * IH * s]);
                const hits = await page.evaluate(`(${faceHitsSrc})(${JSON.stringify({ faces, w, h })})`);
                const fades = await page.evaluate(`(${fadedSrc})()`);
                const worst = {};
                hits.forEach(x => { const k = x.face + " " + x.tag + (x.id ? "#" + x.id : "") + " " + x.cls; if(!worst[k] || worst[k].pct < x.pct) worst[k] = x; });
                const list = Object.values(worst).sort((a, b) => b.pct - a.pct);
                // the false positive the audit already flags on the old look: the Trophy Room spotlight glow is a
                // blurred light, not a manager (its name only matches the audit's "hero" pattern)
                const realFades = fades.filter(f => !/heroSpotlight/.test(f));
                // pixel truth: the screen as shown vs the plate alone (every UI element hidden); any UI paint over a
                // face zone (card, wheel disc, shadow ring, glow, text) shows up as a pixel difference inside the zone.
                const shotA = await page.screenshot();
                if(shotDir){ fs.mkdirSync(shotDir, { recursive: true }); fs.writeFileSync(path.join(shotDir, `${ver}_${key}_${w}x${h}_clean.png`), shotA); }
                const probeHits = await page.evaluate(faces => faces.map(f => {
                    const cx = (f[0] + f[2]) / 2, cy = (f[1] + f[3]) / 2, t = document.elementFromPoint(cx, cy);
                    return t ? (t.tagName.toLowerCase() + (t.id ? "#" + t.id : "") + "." + String(t.className).split(" ")[0]) : null; }), faces);
                await page.evaluate(() => { for(const el of document.querySelectorAll("body *")) el.style.setProperty("visibility", "hidden", "important");
                    const i = document.querySelector("img.h31-plate"); i.style.setProperty("visibility", "visible", "important"); });
                await page.waitForTimeout(150);
                const shotB = await page.screenshot();
                await page.evaluate(() => { for(const el of document.querySelectorAll("body *")) if(!el.dataset.h31Old) el.style.removeProperty("visibility"); });
                if(shotDir){ fs.mkdirSync(shotDir, { recursive: true }); fs.writeFileSync(path.join(shotDir, `${ver}_${key}_${w}x${h}_plateonly.png`), shotB); }
                const pix = await diffZones(page, shotA, shotB, faces);
                // circle mode for the round wheel: distance from each face zone to the wheel disc (negative = inside)
                const circle = key !== "LEAGUE" ? null : await page.evaluate(faces => { const w = document.getElementById("leagueWheel"); const r = w.getBoundingClientRect();
                    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, R = r.width / 2;
                    return { diameter: Math.round(r.width * 10) / 10, centre: [cx, cy].map(v => Math.round(v * 10) / 10), margins: faces.map(f => { const nx = Math.min(Math.max(cx, f[0]), f[2]), ny = Math.min(Math.max(cy, f[1]), f[3]);
                        return Math.round((Math.hypot(nx - cx, ny - cy) - R) * 10) / 10; }) }; }, faces);
                const ok = !list.length && !realFades.length && !errors.length;
                if(!ok) failed++;
                let line = `${key} ${w}x${h} [${ver}]: ${ok ? "OK" : "FAIL"}` + list.map(x => `\n  - ${x.face}'s face ${x.pct}% under <${x.tag}${x.id ? "#" + x.id : ""} class="${x.cls}">`).join("")
                    + realFades.map(f => `\n  - FADED/CUT manager: ${f}`).join("") + (fades.length > realFades.length ? `\n  note: ${fades.length - realFades.length} audit name-match on div.heroSpotlight (spotlight glow, not a manager)` : "")
                    + (errors.length ? `\n  - page errors: ${errors.join(" | ")}` : "");
                console.log(line);
                if(circle) console.log(`  wheel as a circle (diameter ${circle.diameter}px): margin Daniel ${circle.margins[0]} px, Nik ${circle.margins[1]} px` + (circle.margins.some(m => m < -2) ? " (OVERLAP)" : ""));
                line += "\n  pixels over faces: " + pix.map((p, i) => `${i ? "Nik" : "Daniel"} ${p.changed} px changed (max diff ${p.max})`).join(", ");
                console.log(line.split("\n").slice(-1)[0]);
                report[key][`${w}x${h}`] = { ok, circle, plateRect, pixelsOverFace: pix, hitAtZoneCentre: probeHits, hits: list.map(x => ({ face: x.face, pct: x.pct, el: `${x.tag}${x.id ? "#" + x.id : ""}.${x.cls}` })), hiddenOldArt: hidden, notes: fades.filter(f => /heroSpotlight/.test(f)) };
                if(shotDir){
                    fs.mkdirSync(shotDir, { recursive: true });
                    await page.evaluate(fs => fs.forEach(f => { const d = document.createElement("div");
                        Object.assign(d.style, { position: "fixed", left: f[0] + "px", top: f[1] + "px", width: (f[2] - f[0]) + "px", height: (f[3] - f[1]) + "px", outline: "3px solid #0ff", zIndex: 2147483647, pointerEvents: "none" });
                        document.body.appendChild(d); }), faces);
                    await page.screenshot({ path: path.join(shotDir, `${ver}_${key}_${w}x${h}.png`) });
                }
                await context.close();
            }
        }
    }finally{ await browser.close(); }
    if(shotDir) fs.writeFileSync(path.join(shotDir, `swapcheck_${ver}.json`), JSON.stringify(report, null, 1));
    console.log(failed ? `swap check ${ver}: FAIL (${failed} screen-size runs)` : `swap check ${ver}: PASS (${KEYS.join(", ")} at 4 sizes)`);
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(2); });
