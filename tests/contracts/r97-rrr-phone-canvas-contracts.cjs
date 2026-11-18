"use strict";
// r97 Roulette on phones lets its painted 2D canvases go once they are on the GPU (Nik's iPhone 17 closed the Device check on
// this screen at High, 2026-11-18). Chromium, iPhone profile: 2D canvases 78 MB at Balanced and 128 MB at High stayed alive beside
// 123 / 214 MB of GPU textures, and the phone memory budget counted only the GPU half.
//   C1 phones only, at warm-up, after every texture is uploaded; a canvas goes only when every texture drawn from it is on the GPU
//   C2 the boards' canvases (painted again in play: canvas, first, spare, anything boardTex marked __tex) are kept
//   C3 a lost context that comes back after canvases went cannot rebuild the scene: the turn goes on as after a context that
//      never comes back (EMBED: cms-rr-error, the game's result card; else a reload), never a black scene
//   C4 window.__rr.freed says what went, and counts any freed texture uploaded again (tests/browser/r97-rrr-phone-canvas-compare.cjs
//      plays the same frames before/after and fails on any changed pixel or re-upload)
//   C5 the phone memory budget counts live 2D canvases beside the GPU memory (tests/browser/device-lab.cjs canvas2dMB)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const RR = fs.readFileSync(path.join(ROOT, "visual-assets/v10_1/roulette/index.html"), "utf8");
const BUDGET = fs.readFileSync(path.join(ROOT, "tests/browser/phone-memory-budget.cjs"), "utf8");
const LAB = fs.readFileSync(path.join(ROOT, "tests/browser/device-lab.cjs"), "utf8");
let n = 0; const ok = (id, t) => { n += 1; console.log(`ok ${n} ${id} ${t}`); };
for (const m of RR.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
const warm = RR.slice(RR.indexOf("async function warmUp(){"), RR.indexOf('toGame2("cms-rr-loading",{stage:"compile"});'));
assert.match(warm, /all\.forEach\(t=>\{ try\{ renderer\.initTexture\(t\); \}catch\(e\)\{\} \}\);\n  if\(GFX\.phone\) freeCanvases\(all\);\n/, "phones only, right after every texture is uploaded");
const free = RR.slice(RR.indexOf("function freeCanvases(all){"), RR.indexOf("async function warmUp(){"));
assert.match(free, /if\(!ts\.every\(t=>\{ const p=renderer\.properties\.get\(t\); return p&&p\.__webglTexture; \}\)\) return;/, "only when every texture drawn from it is on the GPU");
assert.match(free, /c\.width=c\.height=0;/);
ok("C1", "phones let a painted canvas go at warm-up, only once every texture drawn from it is on the GPU");
assert.match(free, /\["D","N"\]\.forEach\(k=>\{ const b=boards\[k\]\.userData; \[b\.canvas,b\.first,b\.spare\]\.forEach\(c=>\{ if\(c\) keep\.add\(c\); \}\); \}\);/);
assert.match(free, /keep\.has\(c\)\|\|c\.__tex\) return;/);
assert.match(RR, /function boardTex\(c\)\{ const t=new T\.CanvasTexture\(c\);[^\n]*c\.__tex=t; return t; \}/, "boardTex marks the boards' canvases");
assert.match(RR, /b\.canvas\.__tex\.needsUpdate=true;/, "the boards are painted again in play");
ok("C2", "the boards' canvases, painted again in play, are kept");
assert.match(RR, /webglcontextrestored",\(\)=>\{ clearTimeout\(lostTimer\); lostTimer=0; lostOn=false; if\(leaving\|\|lostSent\) return;\n[^\n]*\n  if\(FREED&&FREED\.canvases\)\{ lostSent=true; if\(EMBED\) toGame\("cms-rr-error",\{message:"webgl context lost"\}\); else location\.reload\(\); return; \}/);
ok("C3", "a context that comes back after canvases went hands the turn on (result card or reload), never a black scene");
assert.match(RR, /get freed\(\)\{ return FREED\?\{\.\.\.FREED\}:null; \}/); assert.match(free, /t\.onUpdate=\(\)=>\{ out\.reuploads\+=1; \};/);
assert.ok(fs.existsSync(path.join(ROOT, "tests/browser/r97-rrr-phone-canvas-compare.cjs")));
ok("C4", "__rr.freed says what went and counts any re-upload; the before/after pixel replay exists");
assert.match(BUDGET, /const total = Math\.round\(\(r\.allocTexMB \+ r\.allocRbMB \+ r\.canvas2dMB\) \* 10\) \/ 10;/);
assert.match(LAB, /canvas2dMB: data\.canvas2dMB == null \? null : r1\(data\.canvas2dMB\)/);
ok("C5", "the phone memory budget counts live 2D canvases beside the GPU memory");
console.log(`PASS r97 Roulette phone canvas contracts (${n} checks)`);
