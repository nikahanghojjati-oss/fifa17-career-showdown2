"use strict";
// r97 Roulette on phones lets its painted 2D canvases go once they are on the GPU (visual-assets/v10_1/roulette/index.html
// freeCanvases). This proves the picture does not change: it plays the same Roulette frames twice on the iPhone 15 Pro profile
// at one level, once with the page as it is and once with another copy of it (--before FILE, e.g. gameplay/r97's), with the
// same random numbers (Math.random seeded before any script) and the frame clock stepped by hand (window.__rr.clock/advance).
// At each moment (rest, the spin, the aim, the shot, the result) it compares the WebGL canvas pixel for pixel
// (canvas.toDataURL right after the draw) and the whole page screenshot, and saves both screenshots.
// Run: node tests/browser/r97-rrr-phone-canvas-compare.cjs --before FILE [--level 2] [--out DIR] [--same]
//   --same plays this page twice (no copy): proof that the replay itself repeats exactly.
// Limits: Chromium with software GL, not WebKit or an iPhone GPU. Not a Gate lane (a High load takes minutes in software GL).
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const pw = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const arg = (name, fallback) => { const i = process.argv.indexOf("--" + name); return i >= 0 ? process.argv[i + 1] : fallback; };
const BEFORE = arg("before", ""), SAME = process.argv.includes("--same"), LEVEL = Number(arg("level", "2")), OUT = arg("out", "");
if(!BEFORE){ console.error("--before FILE is required (the page to compare with)"); process.exit(2); }
const PAGE = "visual-assets/v10_1/roulette/index.html";
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ogg": "audio/ogg"};
// The same random numbers in both runs, from the first script on.
// The page paints its labels once its fonts load or after 3 s (fontsReady). In software GL a load can pass 3 s, and one run
// would paint them in the fallback font: here the page waits for the fonts in both runs (this test only).
const SEEDED = `(() => { let s = 20261118 >>> 0; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const st = window.setTimeout; window.setTimeout = (f, ms, ...a) => st(f, ms === 3000 && !window.__rrReady ? 600000 : ms, ...a); })();`;
const hash = b => crypto.createHash("sha256").update(b).digest("hex").slice(0, 16);

async function play(which){
  const file = which === "before" && !SAME ? path.resolve(BEFORE) : path.join(ROOT, PAGE);
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "");
    const f = rel === PAGE ? file : path.join(ROOT, rel);
    if(rel !== PAGE && !f.startsWith(ROOT)){ res.writeHead(403); res.end(); return; }
    fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"}); res.end(b); });
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await pw.chromium.launch({executablePath: process.env.CMS_CHROMIUM_PATH || undefined});
  const context = await browser.newContext({...pw.devices["iPhone 15 Pro"], serviceWorkers: "block"});
  await context.addInitScript(SEEDED);
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.route(url => !String(url).startsWith(base), route => route.abort());
  await page.goto(`${base}${PAGE}?gfx=${LEVEL}&seed=7`, {waitUntil: "commit"});
  await page.waitForFunction(() => window.__rrReady, null, {timeout: 600000, polling: 1000});
  const shots = [];
  const grab = async name => {
    const gl = await page.evaluate(() => { __rr.advance(1 / 30, true); return document.querySelector("#stage canvas").toDataURL("image/png"); });
    const png = await page.screenshot();
    shots.push({name, gl: hash(gl), page: hash(png), png, glPng: Buffer.from(gl.split(",")[1], "base64")});
  };
  // The turn's clock starts at the same time and the random numbers start again from one seed in both runs (loading may
  // have drawn a different count of them).
  await page.evaluate(() => { let q = 7 >>> 0; Math.random = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
    const pn = performance.now; performance.now = () => 5000; try { __rr.clock(); } finally { performance.now = pn; }
    // From here only __rr.advance draws: the page's own frame loop would add frames as fast as the machine allows.
    window.requestAnimationFrame = () => 0; });
  // Two seconds at rest first: the camera still eases toward its rest pose from where loading left it.
  await page.evaluate(() => { __rr.advance(2, false); });
  await grab("rest");
  await page.evaluate(() => { __rr.play({fire: true}); });
  for(const [name, sec] of [["spin", 2], ["aim", 6], ["shot", 7.5], ["result", 6]]){ await page.evaluate(s => { __rr.advance(s, false); }, sec); await grab(name); }
  const info = await page.evaluate(() => ({fonts: ['700 30px "Instrument Sans Narrow"', '400 40px "Rye"'].every(f => document.fonts.check(f)), freed: __rr.freed, state: {level: __rr.state.level, calls: __rr.state.calls}, gfx: (() => { const p = window.CareerModeGfxTier.profile(); return {level: p.level, phone: p.phone, pixelRatio: p.pixelRatio}; })()}));
  await browser.close(); server.close();
  return {which, shots, info, errors};
}

(async () => {
  const before = await play("before"), after = await play("after");
  const rows = before.shots.map((b, i) => { const a = after.shots[i]; return {moment: b.name, glSame: b.gl === a.gl, pageSame: b.page === a.page, before: b.gl, after: a.gl}; });
  if(OUT){ fs.mkdirSync(OUT, {recursive: true});
    for(const r of [before, after]) for(const s of r.shots){ fs.writeFileSync(path.join(OUT, `${r.which}-${s.name}.png`), s.png); fs.writeFileSync(path.join(OUT, `${r.which}-${s.name}-webgl.png`), s.glPng); } }
  const report = {level: LEVEL, rows, before: before.info, after: after.info, errors: {before: before.errors, after: after.errors}};
  console.log(JSON.stringify(report, null, 2));
  const bad = rows.filter(r => !r.glSame || !r.pageSame);
  if(bad.length || !(after.info.freed && after.info.freed.canvases > 0) || after.info.freed.reuploads || after.errors.length){
    console.error(`FAIL Roulette phone canvases: ${bad.length ? `pictures differ at ${bad.map(r => r.moment).join(", ")}` : after.info.freed && after.info.freed.reuploads ? "a freed canvas was uploaded again" : after.errors.length ? "page errors" : "nothing was freed"}`);
    process.exit(1);
  }
  console.log(`PASS Roulette phone canvases at level ${LEVEL}: the same picture at every moment, ${after.info.freed.canvases} canvases (${after.info.freed.mb} MB) let go`);
})().catch(error => { console.error(error); process.exit(1); });
