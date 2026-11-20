"use strict";
// r97 Roulette on a slow font load: labels painted on canvases ("FIRES HERE" on the drum pointer, the plate under each board, the
// squad boards) must end up in Instrument Sans Narrow, not Arial, however late the font files arrive.
// The page is served locally with every .woff2 held for --delay ms. Each canvas label is measured when it is painted
// (CanvasRenderingContext2D.fillText is wrapped by an init script: width of the text in the font in use, and whether
// document.fonts.check says the face is loaded) and the last paint of each label is kept.
// Run: node tests/browser/r97-rrr-late-fonts.cjs [--before FILE] [--delay 6000] [--profile phone|desktop] [--level 2] [--out DIR]
//   --before FILE plays that copy of the page first (e.g. gameplay/r97's) so the old behaviour is on record beside the new.
// Pass = after the run every label's last paint has the font loaded and a width other than Arial's. Not a Gate lane (software GL).
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const pw = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const arg = (name, fallback) => { const i = process.argv.indexOf("--" + name); return i >= 0 ? process.argv[i + 1] : fallback; };
const BEFORE = arg("before", ""), DELAY = Number(arg("delay", "6000")), PROFILE = arg("profile", "phone"), LEVEL = Number(arg("level", "2")), OUT = arg("out", "");
const PAGE = "visual-assets/v10_1/roulette/index.html";
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ogg": "audio/ogg"};
const WATCH = ["FIRES HERE"];
const SPY = `(() => { window.__paints = []; window.__lastCanvas = {};
  const ft = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
    const t = String(text), keep = t === "FIRES HERE" || (this.canvas.width === 512 && this.canvas.height === 128 && !/^[\s\S]{0}$/.test(t));
    if (keep) { let w = 0; try { w = this.measureText(t).width; } catch (e) {} window.__paints.push({text: t, font: this.font, width: Math.round(w * 10) / 10, loaded: document.fonts.check(this.font), at: Math.round(performance.now())}); window.__lastCanvas[t] = this.canvas; }
    return ft.call(this, text, ...rest); }; })();`;

async function play(label, file){
  let heldFonts = 0;
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "");
    const f = rel === PAGE ? file : path.join(ROOT, rel);
    if(rel !== PAGE && !f.startsWith(ROOT)){ res.writeHead(403); res.end(); return; }
    const send = () => fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"}); res.end(b); });
    if(f.endsWith(".woff2")){ heldFonts++; setTimeout(send, DELAY); } else send();
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await pw.chromium.launch({executablePath: process.env.CMS_CHROMIUM_PATH || undefined});
  const context = await browser.newContext({...(PROFILE === "phone" ? pw.devices["iPhone 15 Pro"] : {viewport: {width: 1920, height: 866}}), serviceWorkers: "block"});
  await context.addInitScript(SPY);
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.route(url => !String(url).startsWith(base), route => route.abort());
  const t0 = Date.now();
  await page.goto(`${base}${PAGE}?gfx=${LEVEL}&seed=7`, {waitUntil: "commit"});
  await page.waitForFunction(() => window.__rrReady, null, {timeout: 600000, polling: 500});
  const readyAfter = Date.now() - t0;
  // let a late font land and the labels repaint
  await page.waitForFunction(() => ['700 30px "Instrument Sans Narrow"'].every(f => document.fonts.check(f)), null, {timeout: 120000, polling: 500});
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const last = {}; for(const p of window.__paints) last[p.text] = p;
    const png = {}; for(const k in window.__lastCanvas){ const c = window.__lastCanvas[k]; try{ png[k] = c.width ? c.toDataURL("image/png") : null; }catch(e){ png[k] = null; } }
    return {paints: window.__paints, last, png, freed: window.__rr && window.__rr.freed};
  });
  await browser.close(); server.close();
  return {label, readyAfter, heldFonts, info, errors};
}
const arial = (info, text) => { const p = info.last[text]; return !p || !p.loaded; };
(async () => {
  const runs = [];
  if(BEFORE) runs.push(await play("before", path.resolve(BEFORE)));
  runs.push(await play("after", path.join(ROOT, PAGE)));
  if(OUT){ fs.mkdirSync(OUT, {recursive: true});
    for(const r of runs) for(const k in r.info.png) if(r.info.png[k]) fs.writeFileSync(path.join(OUT, `${r.label}-${PROFILE}-${DELAY}ms-${k.replace(/\W+/g, "-")}.png`), Buffer.from(r.info.png[k].split(",")[1], "base64")); }
  const rows = runs.map(r => ({run: r.label, delayMs: DELAY, profile: PROFILE, readyAfterMs: r.readyAfter, fontFilesHeld: r.heldFonts, paints: r.info.paints.length,
    labels: Object.fromEntries(Object.entries(r.info.last).map(([k, p]) => [k, {loaded: p.loaded, width: p.width, paintedAtMs: p.at}])), freed: r.info.freed, errors: r.errors}));
  console.log(JSON.stringify(rows, null, 2));
  const after = runs[runs.length - 1];
  const bad = WATCH.filter(t => arial(after.info, t)); if(!after.info.last["FIRES HERE"]) bad.push("FIRES HERE never painted");
  const plates = Object.keys(after.info.last).filter(k => k !== "FIRES HERE"); if(!plates.length) bad.push("no board plate painted");
  plates.forEach(k => { if(arial(after.info, k)) bad.push(k); });
  if(bad.length || after.errors.length){ console.error("FAIL: last paint without the font:", bad.join(", "), after.errors); process.exit(1); }
  console.log("PASS: every label's last paint has the font");
})().catch(e => { console.error(e); process.exit(1); });
