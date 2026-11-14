"use strict";
// Device lab (r91, Nik 2026-11-11: "speed on real devices is unproven"). A three-layer emulation of three target devices.
// Nothing here changes game code; it spoofs what the page can read and measures what this container can honestly measure.
//
//   DEVLAB_MODE=decision  Layer 1 (exact): what js/gfxTier.js decides per profile. Spoofs the WebGL UNMASKED_RENDERER, the largest
//                         buffer/texture, deviceMemory, hardwareConcurrency, DPR, screen, viewport and UA, then records what Auto
//                         picks, what Settings > 3D QUALITY offers (the real Settings dialog is opened) and what each level builds.
//   DEVLAB_MODE=cpu       Layer 2 (a real measurement, relative): main-thread ms per frame and long tasks for Chamber Men, RRR and
//                         the Special Player pack at each level, with a per-profile CPU throttle (CDP) and core pinning
//                         (run under `taskset -c 0,1` for 2 cores; see DEVLAB_CORES). The same run counts draw calls, triangles,
//                         render passes and pixels per pass, and GPU memory allocations (input of Layer 3).
//   Layer 3 (a model, not proof) is computed from the cpu mode's counters by tests/browser/support/device-lab-model.cjs.
//
// Usage: node tests/browser/device-lab.cjs [--profiles a,b] [--scenes chamber,rrr,sp] [--levels 0,1,2,3,4,5] [--out file.json]
//   env: DEVLAB_MODE (decision|cpu, default decision) DEVLAB_MEASURE_MS (default 8000) DEVLAB_LOAD_MAX_MS (default 90000)
//        CMS_CHROMIUM_PATH (a Chromium binary), CMS_TEST_PORT (static server port, default 4412), DEVLAB_CORES (informational)
// Recipe (2 cores, Chromebook proxy): DEVLAB_MODE=cpu CMS_CHROMIUM_PATH=/opt/pw-browsers/chromium taskset -c 0,1 node tests/browser/device-lab.cjs --profiles chromebook866 --levels 0,1,2,3,4
//   RRR needs DEVLAB_LOAD_MAX_MS=420000 (software shader compile takes 4+ minutes at 4x). Not a Gate test: run by hand.
// Limits: the GPU is SwiftShader (software), so frame rate and GPU time are meaningless here; only main-thread cost, call counts
// and sizes are used. Chromium is not WebKit (iPhone). Test database only: no Firebase, every off-site request is aborted.
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const PORT = Number(process.env.CMS_TEST_PORT || 4412);
const MODE = process.env.DEVLAB_MODE || "decision";
const MEASURE_MS = Number(process.env.DEVLAB_MEASURE_MS || 8000);
const LOAD_MAX_MS = Number(process.env.DEVLAB_LOAD_MAX_MS || 90000);

// Each profile is what the page can read plus how slow its CPU is relative to the host.
const PROFILES = {
    iphone17: {
        label: "iPhone 17 (Safari, Apple A19)", viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 }, dpr: 3, mobile: true,
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
        renderer: "Apple GPU", vendor: "Apple Inc.", memory: 8, memorySafari: undefined, cores: 6, maxBuffer: 16384, maxTexture: 16384, cpuRate: 1.5
    },
    chromebook866: {
        label: "Chromebook, window 1920x866 (Intel UHD JSL, 4 GB, 2 threads)", viewport: { width: 1920, height: 866 }, screen: { width: 1920, height: 1080 }, dpr: 1, mobile: false,
        ua: "Mozilla/5.0 (X11; CrOS x86_64 16836.30.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
        renderer: "ANGLE (Intel, Vulkan 1.3.0 (Intel(R) UHD Graphics (JSL) (0x00004E55)), Mesa 25.0.7)", vendor: "Google Inc. (Intel)", memory: 4, cores: 2, maxBuffer: 16384, maxTexture: 16384, cpuRate: 4
    },
    chromebook1035: {
        label: "Chromebook, full screen 1920x1035 (Intel UHD JSL, 4 GB, 2 threads)", viewport: { width: 1920, height: 1035 }, screen: { width: 1920, height: 1080 }, dpr: 1, mobile: false,
        ua: "Mozilla/5.0 (X11; CrOS x86_64 16836.30.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
        renderer: "ANGLE (Intel, Vulkan 1.3.0 (Intel(R) UHD Graphics (JSL) (0x00004E55)), Mesa 25.0.7)", vendor: "Google Inc. (Intel)", memory: 4, cores: 2, maxBuffer: 16384, maxTexture: 16384, cpuRate: 4
    },
    pc4k: {
        label: "Gaming PC, 4K screen 3840x2160 (RTX 4090)", viewport: { width: 3840, height: 2000 }, screen: { width: 3840, height: 2160 }, dpr: 1, mobile: false,
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
        renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)", vendor: "Google Inc. (NVIDIA)", memory: 8, cores: 16, maxBuffer: 16384, maxTexture: 16384, cpuRate: 1
    },
    pc8k: {
        label: "Gaming PC, 8K screen 7680x4320 (RTX 4090)", viewport: { width: 7680, height: 4160 }, screen: { width: 7680, height: 4320 }, dpr: 1, mobile: false,
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
        renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)", vendor: "Google Inc. (NVIDIA)", memory: 8, cores: 16, maxBuffer: 16384, maxTexture: 16384, cpuRate: 1
    }
};
// DEVLAB_TOP=1 (r92, tests/browser/phone-memory-budget.cjs): each level starts at its top pixel ratio (?gfxpr=top), the most
// the governor may reach in play, so the memory measured is the most that level can hold.
const TOP = process.env.DEVLAB_TOP === "1" ? "&gfxpr=top" : "";
const SCENES = {
    chamber: { name: "Chamber Men", url: l => `device-check-chamber.html?gfx=${l}${TOP}` },
    rrr: { name: "RRR", url: l => `visual-assets/v10_1/roulette/index.html?showcase=1&gfx=${l}${TOP}` },
    sp: { name: "SP pack", url: l => `visual-assets/v10_1/special-player/index.html?gfx=${l}${TOP}` }
};
const LEVEL_NAMES = ["Light", "Balanced", "High", "Extra", "Ultra (4K)", "8K"];

function arg(name, fallback){ const i = process.argv.indexOf("--" + name); return i >= 0 ? process.argv[i + 1] : fallback; }

// What the page can read, spoofed before any page script runs.
function spoofScript(p, opts){
    return `(() => {
        const P = ${JSON.stringify({ renderer: p.renderer, vendor: p.vendor, memory: opts.memory, cores: p.cores, maxBuffer: p.maxBuffer, maxTexture: p.maxTexture, screen: p.screen })};
        const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch (e) {} };
        if (P.memory === undefined) { try { delete Navigator.prototype.deviceMemory; } catch (e) {} def(Navigator.prototype, "deviceMemory", undefined); } else def(Navigator.prototype, "deviceMemory", P.memory);
        def(Navigator.prototype, "hardwareConcurrency", P.cores);
        def(Screen.prototype, "width", P.screen.width); def(Screen.prototype, "height", P.screen.height);
        def(Screen.prototype, "availWidth", P.screen.width); def(Screen.prototype, "availHeight", P.screen.height);
        const fix = (proto) => {
            if (!proto || proto.__labSpoofed) return; proto.__labSpoofed = true;
            const getParameter = proto.getParameter, getExtension = proto.getExtension;
            proto.getParameter = function (pn) {
                if (pn === 37446) return P.renderer;
                if (pn === 37445) return P.vendor;
                if (pn === 0x84E8 || pn === 0x0D33) { const real = getParameter.call(this, pn); return Math.max(real, pn === 0x84E8 ? P.maxBuffer : P.maxTexture); }
                return getParameter.call(this, pn);
            };
            proto.getExtension = function (name) {
                if (name === "WEBGL_debug_renderer_info") return { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
                return getExtension.call(this, name);
            };
        };
        fix(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
        fix(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
    })();`;
}

// Layer 2/3 counters: draw calls, triangles, passes, pixels per pass, allocations, per-frame main-thread time.
function instrumentScript(){
    return `(() => {
        const L = window.__lab = { go: false, frames: [], long: [], allocMB: { tex: 0, rb: 0 }, attrs: null, buf: null, passList: [], t0: 0 };
        try { new PerformanceObserver(l => { for (const e of l.getEntries()) L.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true }); } catch (e) {}
        let cur = null;
        let lastVp = [0, 0]; /* three.js sets the viewport only when it changes, so it must persist across frames */
        const newFrame = () => ({ calls: 0, tris: 0, passes: 0, passPx: 0, fbo: 0, vp: lastVp.slice(), lastKey: "" });
        const BPP = { 6408: 4, 6407: 3, 6403: 1, 33319: 2, 34836: 16, 34842: 8, 35898: 4, 32856: 4, 32849: 3, 33321: 1, 33323: 2, 35056: 4, 33190: 3, 33189: 2, 36012: 4, 36013: 5, 34041: 4, 35050: 2, 36194: 2, 32854: 2, 32855: 2 };
        const bytes = (fmt) => BPP[fmt] || 4;
        const patch = (proto) => {
            if (!proto || proto.__labPatched) return; proto.__labPatched = true;
            const count = (self, mode, n, inst) => {
                if (!cur) return;
                cur.calls++; const k = n * (inst || 1);
                cur.tris += mode === 4 ? k / 3 : (mode === 5 || mode === 6) ? Math.max(0, k - 2) : 0;
                const key = (self.__labFbo || 0) + ":" + cur.vp[0] + "x" + cur.vp[1];
                if (key !== cur.lastKey) { cur.lastKey = key; cur.passes++; cur.passPx += cur.vp[0] * cur.vp[1]; }
            };
            for (const [name, hasInst, idx] of [["drawElements", false], ["drawArrays", false], ["drawElementsInstanced", true], ["drawArraysInstanced", true], ["drawRangeElements", false]]) {
                const orig = proto[name]; if (!orig) continue;
                proto[name] = function () {
                    const a = arguments;
                    if (name === "drawElements") count(this, a[0], a[1]);
                    else if (name === "drawArrays") count(this, a[0], a[2]);
                    else if (name === "drawElementsInstanced") count(this, a[0], a[1], a[4]);
                    else if (name === "drawArraysInstanced") count(this, a[0], a[2], a[3]);
                    else count(this, a[0], a[3]);
                    return orig.apply(this, a);
                };
            }
            const vp = proto.viewport; proto.viewport = function (x, y, w, h) { lastVp = [w, h]; if (cur) { cur.vp = [w, h]; } return vp.apply(this, arguments); };
            const bf = proto.bindFramebuffer; proto.bindFramebuffer = function (t, f) { this.__labFbo = f ? 1 : 0; if (f && f.__labSize) { if (cur) cur.vp = f.__labSize; } return bf.apply(this, arguments); };
            const ts2 = proto.texStorage2D; if (ts2) proto.texStorage2D = function (t, levels, fmt, w, h) { L.allocMB.tex += w * h * 4 * (levels > 1 ? 1.33 : 1) / 1048576; return ts2.apply(this, arguments); };
            const ti = proto.texImage2D; proto.texImage2D = function (t, lv, ifmt, w, h) { if (lv === 0 && typeof w === "number" && typeof h === "number" && arguments.length >= 9) L.allocMB.tex += w * h * bytes(ifmt) * 1.33 / 1048576; else if (lv === 0 && arguments.length <= 6) { const s = arguments[arguments.length - 1]; const ww = (s && (s.videoWidth || s.naturalWidth || s.width)) || 0, hh = (s && (s.videoHeight || s.naturalHeight || s.height)) || 0; L.allocMB.tex += ww * hh * 4 * 1.33 / 1048576; } return ti.apply(this, arguments); };
            const rbs = proto.renderbufferStorage; proto.renderbufferStorage = function (t, fmt, w, h) { L.allocMB.rb += w * h * bytes(fmt) / 1048576; return rbs.apply(this, arguments); };
            const rbm = proto.renderbufferStorageMultisample; if (rbm) proto.renderbufferStorageMultisample = function (t, s, fmt, w, h) { L.allocMB.rb += s * w * h * bytes(fmt) / 1048576; return rbm.apply(this, arguments); };
        };
        patch(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype); patch(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
        const gc = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, o) { const g = gc.apply(this, arguments); if (g && /webgl/.test(type) && !this.__labSeen) { this.__labSeen = true; try { const a = g.getContextAttributes(); L.attrs = a; L.mainCanvas = this; } catch (e) {} } return g; };
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (fn) => raf((t) => {
            if (!L.go) return fn(t);
            cur = newFrame(); const s = performance.now();
            try { return fn(t); } finally { const d = performance.now() - s; L.frames.push({ ms: d, at: s, calls: cur.calls, tris: cur.tris, passes: cur.passes, passPx: cur.passPx }); cur = null; }
        });
    })();`;
}

function percentile(a, p){ if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }
const r1 = v => v === null || v === undefined ? null : Math.round(v * 10) / 10;

async function startServer(){
    const server = spawn(process.execPath, [path.join(ROOT, "tests/support/static-server.cjs")], { stdio: "ignore", env: { ...process.env, CMS_TEST_PORT: String(PORT) } });
    await new Promise(r => setTimeout(r, 800));
    return server;
}
async function newContext(browser, p, opts){
    const context = await browser.newContext({ viewport: p.viewport, screen: p.screen, deviceScaleFactor: p.dpr, isMobile: p.mobile, hasTouch: p.mobile, userAgent: p.ua, serviceWorkers: "block" });
    await context.route(/^https?:\/\//, route => route.request().url().startsWith(`http://127.0.0.1:${PORT}/`) ? route.continue() : route.abort());
    await context.addInitScript(spoofScript(p, opts));
    if(opts.instrument) await context.addInitScript(instrumentScript());
    return context;
}

// ---- Layer 1 ----
async function decision(browser, key, p, memoryVariant){
    const opts = { memory: memoryVariant === "safari" ? p.memorySafari : p.memory };
    const context = await newContext(browser, p, opts);
    const page = await context.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e.message)));
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.careerModeHomeHold === 0 && document.getElementById("loadingScreen")?.hidden === true, null, { timeout: 60000 });
    await page.waitForFunction(() => window.CareerModeGfxTier, null, { timeout: 30000 });
    const out = await page.evaluate(() => {
        const T = window.CareerModeGfxTier; T.reset();
        const pick = q => ({ level: q.level, label: T.label(q.level), pixelRatio: q.pixelRatio, maxPixelRatio: q.maxPixelRatio, bufferCap: q.bufferCap, assetLevel: q.assetLevel, antialias: q.antialias, shadowSize: q.shadowSize, density: q.density, bloom: q.bloom, fellBack: q.fellBack ? q.fellBack.reason : null });
        const auto = T.profile();
        const base = { device: T.device(), suggested: T.suggested(), can8k: T.can8k(), auto: pick(auto), autoGpu: auto.gpu, dpr: auto.dpr, phone: auto.phone, nav: { deviceMemory: navigator.deviceMemory ?? null, cores: navigator.hardwareConcurrency, screen: [screen.width, screen.height], dpr: devicePixelRatio, inner: [innerWidth, innerHeight], ua: navigator.userAgent.slice(0, 60) } };
        const levels = {};
        for (const c of T.choices.slice(1)) { T.setChoice(c); T.reset(); levels[c] = pick(T.profile()); }
        T.setChoice("auto"); T.reset();
        return { ...base, levels };
    });
    // The real Settings dialog: what 3D QUALITY offers and says.
    await page.evaluate(() => document.getElementById("settingsButton")?.click());
    await page.waitForSelector(".settingsGfxSelect option", { state: "attached", timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(600);
    out.settings = await page.evaluate(() => ({ options: [...document.querySelectorAll(".settingsGfxSelect option")].map(o => o.textContent.trim()), note: (document.querySelector(".settingsGfxAuto")?.textContent || "").trim() }));
    await context.close();
    return { profile: key, label: p.label, memoryVariant: memoryVariant || "spec", errors, ...out };
}

// ---- Layer 2 ----
async function cpuRun(browser, key, p, sceneKey, level){
    const scene = SCENES[sceneKey];
    const context = await newContext(browser, p, { memory: p.memory, instrument: true });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e.message).slice(0, 160)));
    const cdp = await context.newCDPSession(page);
    const t0 = Date.now();
    try{
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpuRate });
        await page.goto(`http://127.0.0.1:${PORT}/${scene.url(level)}`, { waitUntil: "commit", timeout: LOAD_MAX_MS });
        // Loaded = the scene has run frames and the main thread has been quiet (no task over 150 ms) for 3 s.
        const deadline = Date.now() + LOAD_MAX_MS; let ready = false;
        await page.evaluate(() => { window.__lab.go = true; window.__lab.frames.length = 0; });
        while(Date.now() < deadline){
            await page.waitForTimeout(1000);
            const s = await page.evaluate(() => { const L = window.__lab, now = performance.now(); return { frames: L.frames.length, lastLong: L.long.filter(l => l[1] > 150).map(l => l[0] + l[1]).pop() || 0, now }; }).catch(() => null);
            if(s && s.frames > 12 && s.now - s.lastLong > 3000 && s.now > 4000){ ready = true; break; }
        }
        const loadMs = Date.now() - t0;
        await page.evaluate(() => { window.__lab.frames.length = 0; window.__lab.measureFrom = performance.now(); window.__lab.long.length = 0; });
        await page.waitForTimeout(MEASURE_MS);
        const data = await page.evaluate(() => {
            const L = window.__lab, c = L.mainCanvas || document.querySelector("canvas"), T = window.CareerModeGfxTier;
            const prof = T ? T.profile() : null;
            return { frames: L.frames.map(f => [f.ms, f.calls, f.tris, f.passes, f.passPx]), long: L.long, allocMB: L.allocMB, attrs: L.attrs, canvas: c ? { w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight } : null,
                gfx: prof ? { level: prof.level, pixelRatio: prof.pixelRatio, assetLevel: prof.assetLevel, shadowSize: prof.shadowSize, density: prof.density, bloom: prof.bloom, antialias: prof.antialias, fellBack: prof.fellBack ? prof.fellBack.reason : null } : null,
                spMem: window.__mq && window.__mq.mem ? window.__mq.mem() : null, spGq: window.__mq && window.__mq.gq ? window.__mq.gq : null, measureMs: performance.now() - L.measureFrom };
        });
        const ms = data.frames.map(f => f[0]);
        const pick = i => data.frames.map(f => f[i]).filter(v => v > 0);
        const longs = data.long;
        await context.close();
        return {
            profile: key, scene: sceneKey, level, levelName: LEVEL_NAMES[level], ready, loadMs, errors, rafFrames: data.frames.length, framesPerSec: r1(data.frames.length / (data.measureMs / 1000)),
            jsMsMedian: r1(percentile(ms, .5)), jsMsP95: r1(percentile(ms, .95)), jsMsMax: r1(Math.max(0, ...ms)),
            callsMedian: percentile(pick(1), .5), trisMedian: percentile(pick(2), .5), passesMedian: percentile(pick(3), .5), passPxMedian: percentile(pick(4), .5),
            longTasks: longs.length, longMs: longs.reduce((s, l) => s + l[1], 0), longMax: Math.max(0, ...longs.map(l => l[1])),
            allocTexMB: r1(data.allocMB.tex), allocRbMB: r1(data.allocMB.rb), msaa: data.attrs ? Boolean(data.attrs.antialias) : null, canvas: data.canvas, gfx: data.gfx, spMem: data.spMem
        };
    }catch(error){
        await context.close().catch(() => null);
        return { profile: key, scene: sceneKey, level, levelName: LEVEL_NAMES[level], error: String(error.message).slice(0, 200), loadMs: Date.now() - t0 };
    }
}

(async () => {
    const profiles = (arg("profiles", "iphone17,chromebook866,chromebook1035,pc4k,pc8k")).split(",").filter(k => PROFILES[k]);
    const scenes = (arg("scenes", "chamber,rrr,sp")).split(",").filter(k => SCENES[k]);
    const levels = (arg("levels", "0,1,2,3,4,5")).split(",").map(Number).filter(n => n >= 0 && n <= 5);
    const out = arg("out", path.join(ROOT, "test-results", `device-lab-${MODE}.json`));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const server = await startServer();
    const browser = await chromium.launch({ executablePath: process.env.CMS_CHROMIUM_PATH || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync"] });
    const results = [];
    try{
        for(const key of profiles){
            const p = PROFILES[key];
            if(MODE === "decision"){
                results.push(await decision(browser, key, p, "spec"));
                if(key === "iphone17") results.push(await decision(browser, key, p, "safari"));
                console.log(`decision ${key}: auto ${results[results.length - 1].auto.label}`);
            }else{
                for(const sceneKey of scenes) for(const level of levels){
                    if(level === 5 && p.mobile) continue;
                    const r = await cpuRun(browser, key, p, sceneKey, level);
                    results.push(r);
                    console.log(`${key} ${sceneKey} L${level}: ${r.error ? "ERROR " + r.error : `js ${r.jsMsMedian}/${r.jsMsP95} ms/frame, ${r.rafFrames} frames, calls ${r.callsMedian}, tris ${r.trisMedian}, canvas ${r.canvas && r.canvas.w}x${r.canvas && r.canvas.h}, long ${r.longTasks}/${r.longMs} ms`}`);
                    fs.writeFileSync(out, JSON.stringify({ mode: MODE, at: new Date().toISOString(), measureMs: MEASURE_MS, results }, null, 1));
                }
            }
        }
    }finally{ await browser.close(); server.kill(); }
    fs.writeFileSync(out, JSON.stringify({ mode: MODE, at: new Date().toISOString(), measureMs: MEASURE_MS, results }, null, 1));
    console.log("wrote " + out);
})().catch(e => { console.error(e); process.exit(1); });
