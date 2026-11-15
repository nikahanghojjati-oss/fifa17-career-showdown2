"use strict";
// r93 Device check sequence memory (Nik's iPhone 17 on 2.5.0, 2026-11-15 05:35 UTC: Light passed on all three screens, then
// the tab closed while Chamber Men opened at Balanced, a level that had passed cleanly in the run before). The check plays
// every screen in one tab, one frame after another. This harness plays the same sequence the page plays (Light: Chamber Men,
// Roulette, Special Player; then Balanced; then High) on the iPhone 17 profile, each frame created and removed exactly as
// device-check.html does, and after each removal reports what is still held:
//   - GPU memory of every WebGL context ever created (textures + render buffers + buffers, as uploaded, minus deletions),
//     split into contexts that are lost or collected and contexts still alive;
//   - the JS heap of the tab (all same-origin frames share it), before and after a forced garbage collection;
//   - the RSS of Chromium's renderer and GPU processes.
// Run: CMS_CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/browser/device-check-sequence-memory.cjs [--levels 0,1,2] [--out f.json]
// Limits: Chromium with software GL, not WebKit; a real iPhone frees memory on its own schedule. Not a Gate lane.
// First runs (2026-11-15, gameplay/r93, Light and Balanced, iPhone 17 profile): every screen's WebGL context is lost when
// its frame is removed (0 live contexts after each screen; 65 to 121 MB of GPU memory while one is open). In one page the
// removed frames' documents stay behind, even after a forced garbage collection (15 documents after six screens); with a
// reload before each screen they do not (5 or 6). The JS heap and the renderer's memory are about the same either way in
// Chromium; how long Safari keeps a removed frame cannot be measured here.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, execSync } = require("node:child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const PORT = Number(process.env.CMS_TEST_PORT || 4419);
const BASE = `http://127.0.0.1:${PORT}/`;
const arg = (name, fallback) => { const i = process.argv.indexOf("--" + name); return i >= 0 ? process.argv[i + 1] : fallback; };
const LEVELS = arg("levels", "0,1,2").split(",").map(Number);
const OUT = arg("out", path.join(os.tmpdir(), `device-check-sequence-${process.pid}.json`));
const WAIT_MS = Number(process.env.SEQ_WAIT_MS || 150000);
const SETTLE_MS = Number(process.env.SEQ_SETTLE_MS || 1500);
// --reload: the host page reloads before each screen, as device-check.html does from r93 (one screen in memory at a time).
const RELOAD = process.argv.includes("--reload");
const NAMES = ["Light", "Balanced", "High", "Extra", "Ultra (4K)"];
const SCENES = [
  { key: "chamber-men", path: "device-check-chamber.html" },
  { key: "rrr", path: "visual-assets/v10_1/roulette/index.html" },
  { key: "sp", path: "visual-assets/v10_1/special-player/index.html" }
];
const IPHONE = { viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1" };

// Spoof the Apple GPU (as tests/browser/device-lab.cjs does) and keep a live tally of every WebGL context's memory in the top
// window. The tally holds numbers and a WeakRef to the context only, so it never keeps a removed frame alive.
function initScript(){
  return `(() => {
    const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch (e) {} };
    try { delete Navigator.prototype.deviceMemory; } catch (e) {} def(Navigator.prototype, "deviceMemory", undefined);
    def(Navigator.prototype, "hardwareConcurrency", 6);
    // The tally lives in the top window and its objects are made there: an object made in a frame keeps that frame's
    // realm (and document) alive, which would itself look like a leak.
    if (window.top === window) { window.__seqReg = []; window.__seqMake = (page, at, gl) => { const e = { page, at, tex: 0, rb: 0, buf: 0, lost: false, ref: new WeakRef(gl) }; window.__seqReg.push(e); return e; }; }
    const make = (page, at, gl) => { try { return window.top.__seqMake(page, at, gl); } catch (e) { return { page, at, tex: 0, rb: 0, buf: 0, lost: false, ref: new WeakRef(gl) }; } };
    const BPP = { 6408: 4, 6407: 3, 6403: 1, 33319: 2, 34836: 16, 34842: 8, 35898: 4, 32856: 4, 32849: 3, 33321: 1, 33323: 2, 35056: 4, 33190: 3, 33189: 2, 36012: 4, 36013: 5, 34041: 4, 35050: 2, 36194: 2, 32854: 2, 32855: 2, 34843: 6, 34837: 12, 33326: 4, 33325: 2, 33328: 8, 33327: 4 };
    const bpp = f => BPP[f] || 4;
    const entry = gl => { if (gl.__seq) return gl.__seq; const e = make(location.pathname.split("/").slice(-2).join("/") + location.search, performance.timeOrigin + performance.now(), gl); gl.__seq = e; gl.__texB = new Map(); gl.__rbB = new Map(); gl.__bufB = new Map(); gl.__bound = {}; return e; };
    const set = (gl, map, kind, obj, bytes) => { if (!obj) return; const e = entry(gl), old = map.get(obj) || 0; map.set(obj, bytes); e[kind] += bytes - old; };
    const add = (gl, map, kind, obj, bytes) => { if (!obj) return; const e = entry(gl); map.set(obj, (map.get(obj) || 0) + bytes); e[kind] += bytes; };
    const drop = (gl, map, kind, obj) => { if (!obj || !gl.__seq) return; const b = map.get(obj) || 0; map.delete(obj); gl.__seq[kind] -= b; };
    const patch = proto => {
      if (!proto || proto.__seqPatched) return; proto.__seqPatched = true;
      const gp = proto.getParameter, ge = proto.getExtension;
      proto.getParameter = function (p) { if (p === 37446) return "Apple GPU"; if (p === 37445) return "Apple Inc."; if (p === 0x84E8 || p === 0x0D33) return Math.max(gp.call(this, p), 16384); return gp.call(this, p); };
      proto.getExtension = function (n) {
        if (n === "WEBGL_debug_renderer_info") return { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
        const x = ge.call(this, n);
        if (n === "WEBGL_lose_context" && x && !x.__seqPatched) { const gl = this, lc = x.loseContext; x.__seqPatched = true; x.loseContext = function () { if (gl.__seq) gl.__seq.lost = true; return lc.apply(this, arguments); }; }
        return x;
      };
      const bt = proto.bindTexture; proto.bindTexture = function (t, tex) { entry(this).ref; this.__bound["t" + t] = tex; return bt.apply(this, arguments); };
      const boundTex = (gl, t) => gl.__bound["t" + (t >= 34069 && t <= 34074 ? 34067 : t)];
      const ti = proto.texImage2D; proto.texImage2D = function (t, lv, f, w, h) {
        if (lv === 0) { let W = w, H = h; if (arguments.length <= 6) { const s = arguments[arguments.length - 1]; W = s && (s.width || s.videoWidth || s.naturalWidth) || 0; H = s && (s.height || s.videoHeight || s.naturalHeight) || 0; }
          const bytes = W * H * bpp(f) * 1.33, tex = boundTex(this, t); if (t >= 34069 && t <= 34074) add(this, this.__texB || entry(this) && this.__texB, "tex", tex, bytes); else set(this, this.__texB || entry(this) && this.__texB, "tex", tex, bytes); }
        return ti.apply(this, arguments); };
      const ts = proto.texStorage2D; if (ts) proto.texStorage2D = function (t, levels, f, w, h) { entry(this); set(this, this.__texB, "tex", boundTex(this, t), w * h * bpp(f) * (levels > 1 ? 1.33 : 1) * (t === 34067 ? 6 : 1)); return ts.apply(this, arguments); };
      const ts3 = proto.texStorage3D; if (ts3) proto.texStorage3D = function (t, levels, f, w, h, d) { entry(this); set(this, this.__texB, "tex", boundTex(this, t), w * h * d * bpp(f) * (levels > 1 ? 1.33 : 1)); return ts3.apply(this, arguments); };
      const ct = proto.compressedTexImage2D; if (ct) proto.compressedTexImage2D = function (t, lv, f, w, h, b, data) { if (lv === 0) { entry(this); set(this, this.__texB, "tex", boundTex(this, t), (data && data.byteLength || 0) * 1.33); } return ct.apply(this, arguments); };
      const dt = proto.deleteTexture; proto.deleteTexture = function (tex) { drop(this, this.__texB || new Map(), "tex", tex); return dt.apply(this, arguments); };
      const br = proto.bindRenderbuffer; proto.bindRenderbuffer = function (t, rb) { entry(this); this.__bound.rb = rb; return br.apply(this, arguments); };
      const rs = proto.renderbufferStorage; proto.renderbufferStorage = function (t, f, w, h) { entry(this); set(this, this.__rbB, "rb", this.__bound.rb, w * h * bpp(f)); return rs.apply(this, arguments); };
      const rm = proto.renderbufferStorageMultisample; if (rm) proto.renderbufferStorageMultisample = function (t, s, f, w, h) { entry(this); set(this, this.__rbB, "rb", this.__bound.rb, Math.max(1, s) * w * h * bpp(f)); return rm.apply(this, arguments); };
      const dr = proto.deleteRenderbuffer; proto.deleteRenderbuffer = function (rb) { drop(this, this.__rbB || new Map(), "rb", rb); return dr.apply(this, arguments); };
      const bb = proto.bindBuffer; proto.bindBuffer = function (t, b) { entry(this); this.__bound["b" + t] = b; return bb.apply(this, arguments); };
      const bd = proto.bufferData; proto.bufferData = function (t, d) { entry(this); set(this, this.__bufB, "buf", this.__bound["b" + t], typeof d === "number" ? d : d && d.byteLength || 0); return bd.apply(this, arguments); };
      const db = proto.deleteBuffer; proto.deleteBuffer = function (b) { drop(this, this.__bufB || new Map(), "buf", b); return db.apply(this, arguments); };
    };
    patch(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
    patch(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) { const g = gc.apply(this, arguments); if (g && /webgl/.test(type)) { const e = entry(g); this.addEventListener("webglcontextlost", () => { e.lost = true; }); } return g; };
  })();`;
}

function rss(){
  // Sum of the renderer and GPU processes' resident memory (MB), from /proc.
  const out = { renderer: 0, gpu: 0 };
  try {
    const lines = execSync("ps -eo pid,rss,args --no-headers", { encoding: "utf8", maxBuffer: 1 << 24 }).split("\n");
    for (const l of lines) { const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(l); if (!m || !/chrom/i.test(m[3])) continue;
      if (/--type=renderer/.test(m[3])) out.renderer += Number(m[2]) / 1024; else if (/--type=gpu-process/.test(m[3])) out.gpu += Number(m[2]) / 1024; }
  } catch (_error) {}
  return { renderer: Math.round(out.renderer), gpu: Math.round(out.gpu) };
}
const mb = b => Math.round(b / 1048576 * 10) / 10;

(async () => {
  const server = spawn(process.execPath, [path.join(ROOT, "tests/support/static-server.cjs")], { stdio: "ignore", env: { ...process.env, CMS_TEST_PORT: String(PORT) } });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch({ executablePath: process.env.CMS_CHROMIUM_PATH || undefined,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync", "--js-flags=--expose-gc"] });
  const rows = [];
  try {
    const context = await browser.newContext({ ...IPHONE, serviceWorkers: "block" });
    await context.route(/^https?:\/\//, route => route.request().url().startsWith(BASE) ? route.continue() : route.abort());
    await context.addInitScript(initScript());
    const page = await context.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e.message).slice(0, 160)));
    await page.goto(BASE + "device-check.html", { waitUntil: "load" });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    const heap = async () => { const m = (await cdp.send("Performance.getMetrics")).metrics; const v = n => (m.find(x => x.name === n) || {}).value || 0; return { used: mb(v("JSHeapUsedSize")), total: mb(v("JSHeapTotalSize")), frames: v("Frames"), docs: v("Documents") }; };
    const tally = () => page.evaluate(() => {
      const reg = window.__seqReg || [], live = { n: 0, tex: 0, rb: 0, buf: 0, pages: [] }, gone = { n: 0, tex: 0, rb: 0, buf: 0 };
      for (const e of reg) { const gl = e.ref.deref(); const dead = e.lost || !gl || gl.isContextLost(); const t = dead ? gone : live; t.n += 1; t.tex += e.tex; t.rb += e.rb; t.buf += e.buf; if (!dead) live.pages.push(e.page); }
      return { live, gone, contexts: reg.length };
    });
    const sample = async (label) => {
      const t = await tally(), h = await heap(), r = rss();
      await page.evaluate(() => { if (typeof gc === "function") gc(); });
      await page.waitForTimeout(300);
      const h2 = await heap(), t2 = await tally(), r2 = rss();
      const row = { label, liveContexts: t.live.n, livePages: t.live.pages, liveGpuMB: mb(t.live.tex + t.live.rb + t.live.buf), freedGpuMB: mb(t.gone.tex + t.gone.rb + t.gone.buf),
        heapMB: h.used, heapAfterGcMB: h2.used, documents: h.docs, documentsAfterGc: h2.docs, liveContextsAfterGc: t2.live.n, liveGpuAfterGcMB: mb(t2.live.tex + t2.live.rb + t2.live.buf),
        rendererMB: r.renderer, gpuProcessMB: r.gpu, rendererAfterGcMB: r2.renderer, gpuProcessAfterGcMB: r2.gpu };
      rows.push(row);
      console.log(`${label.padEnd(30)} live contexts ${row.liveContexts} (${row.liveGpuMB} MB GPU), after GC ${row.liveContextsAfterGc} (${row.liveGpuAfterGcMB} MB) · JS heap ${row.heapMB} -> ${row.heapAfterGcMB} MB · documents ${row.documents} -> ${row.documentsAfterGc} · renderer ${row.rendererMB} MB, GPU process ${row.gpuProcessMB} MB`);
      return row;
    };
    console.log(RELOAD ? "mode: the page reloads before each screen (r93)" : "mode: every screen in one page (2.5.0)");
    await sample("device-check.html loaded");
    let first = true;
    for (const level of LEVELS) for (const scene of SCENES) {
      if (RELOAD && !first) { await page.reload({ waitUntil: "load" }); await page.waitForTimeout(SETTLE_MS); }
      first = false;
      // As device-check.html wait(): one iframe in #stage, ?gfx=N&bench=1, removed once its answer arrives.
      const got = await page.evaluate(({ scene, level, waitMs }) => new Promise(resolve => {
        const stage = document.getElementById("stage"), frame = document.createElement("iframe");
        frame.title = `${scene.key} at ${level}`; frame.setAttribute("tabindex", "-1");
        let done = false, timer = 0, peak = 0;
        const liveNow = () => { let n = 0, b = 0; for (const e of window.__seqReg || []) { const gl = e.ref.deref(); if (e.lost || !gl || gl.isContextLost()) continue; n += 1; b += e.tex + e.rb + e.buf; } return { n, mb: Math.round(b / 104857.6) / 10 }; };
        const finish = r => { if (done) return; done = true; r.openLive = liveNow(); window.removeEventListener("message", on); clearTimeout(timer); frame.remove(); stage.classList.remove("live"); resolve(r); };
        const on = e => { if (e.origin !== location.origin || e.source !== frame.contentWindow) return; const d = e.data; if (!d || d.type !== "cms-gfx-bench" || d.scene !== scene.key) return;
          if (d.phase === "started") return; finish({ avg: d.avg, level: d.level, error: d.error || null, failed: d.failed || null }); };
        timer = setTimeout(() => finish({ error: "timeout" }), waitMs);
        window.addEventListener("message", on);
        stage.replaceChildren(frame); stage.classList.add("live");
        frame.src = `${scene.path}?gfx=${level}&bench=1`;
      }), { scene, level, waitMs: WAIT_MS });
      // Peak while it was open is not observable after removal; report what stays.
      await page.waitForTimeout(SETTLE_MS);
      const row = await sample(`${NAMES[level]} ${scene.key} removed`);
      row.answer = got;
      console.log(`${"".padEnd(30)} while open: ${got.openLive.n} live contexts, ${got.openLive.mb} MB GPU · answer ${got.error || got.failed || `${got.avg} fps at level ${got.level}`}`);
    }
    rows.push({ errors });
    await context.close();
  } finally { await browser.close(); server.kill(); }
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
  console.log("wrote " + OUT);
})().catch(e => { console.error(e); process.exit(1); });
