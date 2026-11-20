"use strict";
// r97 (Nik 2026-11-18, option A on the lead's card): when a 3D screen closes the tab or loses its picture in play, only that
// screen is held one level down; the other 3D screens and the 2D level keep their own (js/gfxTier.js gfxCapPut/gfxCap(scene)).
// The real module runs in a vm with a scripted tab, page load and frames (the harness of r91-gfx-tab-crash-contracts).
//   H1 a tab that died while Roulette opened holds Roulette only: Chamber Men, the pack, the Ball Game and 2D keep the level
//   H2 tabDied (the Device check saw a screen close the tab in play) holds that screen only; tabCrash() names each hold's level
//   H3 a lost context holds the screen that lost it; a page with no 3D screen named holds every screen, as before
//   H4 a cap saved before r97 (one object) with no screen holds every screen; one that names screens holds those
//   H5 each hold ends on its own: 7 days, 3 clean plays of its own screen (never a closed tab's), the next build; a pick in
//      Settings ends them all
//   H6 the Device check opens each screen up to its own hold (device-check.html capLevel), says which screen is held
//   H7 a Device check frame (?gfx=N&bench=1) measures the level it asks for over a graphics-error hold, and honours it once it
//      fails there itself (review on #1555)
//   H8 calibrating a held screen on Auto never moves the device's level or the other screens (review on #1555)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {deviceOf} = require("../support/device-lab-profiles.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SRC = read("js/gfxTier.js");
const BUILD = /const BUILD="([^"]+)";/.exec(SRC)[1];
const OPEN = "careerModeShowdown.gfxOpening.v1", CAP = "careerModeShowdown.gfxCap.v1", PICK = "careerModeShowdown.gfxQuality.v1";
const STRONG = "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)";
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

const j = v => JSON.stringify(v);

// One load of one page. store: the browser's storage (shared by every load); tab: that tab's sessionStorage (null: none);
// origin: when this load of the game's page began; framed: the page is a 3D screen's frame inside the game's page.
function load({store, tab = {}, origin = 1000, framed = false, pathname = "/visual-assets/v10_1/roulette/index.html", search = "", device = {gpu: STRONG, dpr: 1, memory: 16, cores: 16, screen: [1920, 1080], view: [1920, 1035]}, hidden = false, now = 0} = {}) {
  const clock = {t: now}, handlers = {win: {}, doc: {}};
  const doc = {visibilityState: hidden ? "hidden" : "visible",
    createElement: tag => tag === "canvas" ? {getContext: () => ({RENDERER: 7937, MAX_RENDERBUFFER_SIZE: 34024, MAX_TEXTURE_SIZE: 3379,
      getExtension: n => n === "WEBGL_debug_renderer_info" ? {UNMASKED_RENDERER_WEBGL: 37446} : {loseContext() {}},
      getParameter: k => k === 37446 || k === 7937 ? device.gpu : 16384})} : {style: {}, setAttribute() {}, append() {}, remove() {}},
    body: {append() {}}, documentElement: {dataset: {}}, addEventListener: (n, f) => { handlers.doc[n] = f; }};
  const helpers = {readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; }};
  const top = {performance: origin === null ? {} : {timeOrigin: origin}, ...helpers};
  const realNow = Date.now;
  const ctx = {document: doc, devicePixelRatio: device.dpr, navigator: {deviceMemory: device.memory, hardwareConcurrency: device.cores},
    screen: {width: device.screen[0], height: device.screen[1]}, innerWidth: device.view[0], innerHeight: device.view[1],
    location: {search, pathname, origin: "http://x"}, performance: {now: () => clock.t, ...(origin === null ? {} : {timeOrigin: framed ? origin + 500 : origin})},
    setTimeout: f => { f(); return 0; }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, URLSearchParams,
    addEventListener: (n, f) => { handlers.win[n] = f; },
    ...(tab ? {sessionStorage: {getItem: k => k in tab ? tab[k] : null, setItem: (k, v) => { tab[k] = String(v); }}} : {}),
    ...(framed ? {} : helpers)};
  ctx.globalThis = ctx; ctx.parent = framed ? top : ctx; ctx.top = framed ? top : ctx;
  if (!framed) ctx.performance = top.performance = {now: () => clock.t, ...(origin === null ? {} : {timeOrigin: origin})};
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  const marks = () => JSON.parse(store[OPEN] || "[]");
  const renderer = () => { const r = {pr: 1, domElement: {clientWidth: device.view[0], clientHeight: device.view[1], addEventListener() {}, removeEventListener() {}}, setPixelRatio(v) { r.pr = v; }, getPixelRatio: () => r.pr,
    getContext: () => ({RGBA: 1, UNSIGNED_BYTE: 1, readPixels() {}})}; return r; };
  const frames = (gov, total, ms = 16.7) => { const end = clock.t + total; while (clock.t < end) { clock.t += ms; gov.frame(clock.t); } };
  return {G: ctx.CareerModeGfxTier, ctx, clock, doc, marks, renderer, frames, pagehide: () => handlers.win.pagehide && handlers.win.pagehide(),
    hide: () => { doc.visibilityState = "hidden"; handlers.doc.visibilitychange && handlers.doc.visibilitychange(); }};
}
const pick = level => ({[PICK]: level});
const holds = store => { const v = JSON.parse(store[CAP] || "null"); return v && Array.isArray(v.caps) ? v.caps.map(e => [e.scene, e.level, Boolean(e.tab)]).sort() : v; };
const RR = "/visual-assets/v10_1/roulette/index.html", SP = "/visual-assets/v10_1/special-player/index.html";

// H1
{
  const store = pick("ultra"), tab = {};
  load({store, tab, framed: true, origin: 1, pathname: RR}).G.profile();// the tab dies while Roulette opens at Ultra
  const home = load({store, tab, origin: 2, pathname: "/index.html"});
  assert.deepEqual(holds(store), [["rrr", 3, true]], "one hold, on Roulette");
  assert.equal(home.G.profile().level, 4, "the device's level (2D, Settings) stays Ultra");
  assert.equal(home.ctx.document.documentElement.dataset.gfx, "4", "html[data-gfx] stays Ultra");
  assert.deepEqual(["chamber-men", "club-draw", "sp", "rrr"].map(k => home.G.profile(k).level), [4, 4, 4, 3], "only Roulette draws one down");
  const again = load({store, tab, framed: true, origin: 2, pathname: RR}).G.profile(); assert.deepEqual([again.level, again.fellBack.from], [3, 4], "Roulette opens at Extra, and says why");
  assert.equal(load({store, tab, framed: true, origin: 2, pathname: SP}).G.profile().level, 4, "the pack opens at Ultra");
  const cm = load({store, tab, origin: 2, pathname: "/index.html"}); cm.G.sceneOpening("chamber-men"); assert.equal(cm.G.profile().level, 4, "Chamber Men opens at Ultra");
  ok("H1", "a tab that died while Roulette opened holds Roulette only");
}
// H2
{
  const store = pick("ultra"), page = load({store, pathname: "/device-check.html"});
  assert.equal(page.G.tabDied(4, "rrr"), 3); assert.equal(page.G.tabDied(3, "sp"), 2);
  assert.deepEqual(holds(store), [["rrr", 3, true], ["sp", 2, true]]);
  const t = page.G.tabCrash(); assert.deepEqual([t.level, t.scene, j(t.scenes), j(t.levels)], [2, "sp", j(["rrr", "sp"]), j({rrr: 3, sp: 2})]);
  assert.equal(page.G.tabDied(3, "rrr"), 2, "a second death on the same screen goes one lower"); assert.equal(page.G.tabDied(4, "rrr"), 2, "never above the hold it has");
  assert.deepEqual(["chamber-men", "club-draw"].map(k => page.G.profile(k).level), [4, 4]);
  ok("H2", "tabDied holds that screen only; tabCrash() names each hold's level");
}
// H3
{
  const store = pick("ultra"), f = load({store, framed: true, pathname: SP}); f.G.profile(); f.G.governor(f.renderer(), {key: "sp", draw() {}});
  f.G.fallback("the GPU dropped the picture (context lost)");
  assert.deepEqual(holds(store), [["sp", 3, false]]); assert.equal(f.G.profile().level, 3, "the pack draws one down at once");
  const home = load({store, pathname: "/index.html"}); assert.deepEqual([home.G.profile().level, home.G.profile("rrr").level, home.G.profile("sp").level], [4, 4, 3]);
  const g = load({store, pathname: "/index.html"}); g.G.fallback("the GPU ran out of memory");
  assert.deepEqual(holds(store), [["", 3, false], ["sp", 3, false]], "no screen named: a hold on every screen");
  assert.deepEqual(["chamber-men", "rrr"].map(k => load({store, pathname: "/index.html"}).G.profile(k).level), [3, 3]);
  // The Ball Game on the game's own page: its governor names it.
  const s2 = pick("ultra"), b = load({store: s2, pathname: "/index.html"}); b.G.sceneOpening("club-draw"); b.G.governor(b.renderer(), {key: "club-draw", draw() {}}); b.G.fallback("context lost");
  assert.deepEqual(holds(s2), [["club-draw", 3, false]]);
  ok("H3", "a lost context holds the screen that lost it; a page with no screen named holds every screen");
}
// H4
{
  const old = {...pick("ultra"), [CAP]: j({level: 2, reason: "the GPU ran out of memory", at: Date.now(), build: BUILD})};
  assert.deepEqual(["chamber-men", "club-draw", "sp", "rrr", ""].map(k => load({store: old}).G.profile(k).level), [2, 2, 2, 2, 2], "an old cap with no screen holds every screen and the device");
  const named = {...pick("ultra"), [CAP]: j({level: 1, reason: "the tab closed while this 3D screen was playing", tab: true, from: 2, scene: "rrr", scenes: ["roulette/index.html", "sp"], bench: true, at: Date.now(), build: BUILD})};
  assert.deepEqual(["chamber-men", "club-draw", "sp", "rrr", ""].map(k => load({store: named}).G.profile(k).level), [4, 4, 1, 1, 4], "an old cap that names screens holds those");
  const t = load({store: named}).G.tabCrash(); assert.deepEqual(j(t.levels), j({rrr: 1, sp: 1}));
  const blind = {...pick("ultra"), [CAP]: j({level: 1, reason: "the tab closed while this 3D screen was opening", tab: true, from: 2, scene: "", at: Date.now(), build: BUILD})};
  assert.equal(load({store: blind}).G.profile("club-draw").level, 1, "a screen that could not be named holds every screen");
  assert.equal(old[CAP], j({level: 2, reason: "the GPU ran out of memory", at: Date.now() > 0 ? JSON.parse(old[CAP]).at : 0, build: BUILD}), "read as it is, not rewritten");
  ok("H4", "an old cap with no screen holds every screen; one that names screens holds those");
}
// H5
{
  const store = pick("ultra"), page = load({store, pathname: "/device-check.html"}); page.G.tabDied(4, "rrr");
  const sp = load({store, framed: true, pathname: SP}); sp.G.profile(); sp.G.governor(sp.renderer(), {key: "sp", draw() {}}); sp.G.fallback("context lost");
  // 7 days: only the hold that is that old goes.
  const v = JSON.parse(store[CAP]); v.caps.find(e => e.scene === "sp").at -= 8 * 864e5; store[CAP] = j(v);
  assert.deepEqual(holds(store).length, 2); load({store}).G.profile(); assert.deepEqual(holds(store), [["rrr", 3, true]], "the pack's 8-day-old hold is gone, Roulette's stays");
  // 3 clean plays of its own screen lift a graphics-failure hold; another screen's clean plays do not; a closed tab's hold stays.
  const s2 = pick("ultra"), f = load({store: s2, framed: true, pathname: SP}); f.G.profile(); f.G.governor(f.renderer(), {key: "sp", draw() {}}); f.G.fallback("context lost");
  const play = (pathname, key) => { const x = load({store: s2, framed: true, pathname, now: 0}); x.G.profile(); const gov = x.G.governor(x.renderer(), {key, draw() {}}); x.frames(gov, 30000); gov.end(); };
  for (let i = 0; i < 3; i += 1) play(RR, "rrr");
  assert.deepEqual(holds(s2), [["sp", 3, false]], "Roulette's clean plays leave the pack's hold");
  for (let i = 0; i < 3; i += 1) play(SP, "sp");
  assert.equal(s2[CAP], "null", "three clean plays of the pack lift its hold");
  const s3 = pick("ultra"); load({store: s3, pathname: "/device-check.html"}).G.tabDied(4, "rrr");
  for (let i = 0; i < 4; i += 1) { const x = load({store: s3, framed: true, pathname: RR}); x.G.profile(); const gov = x.G.governor(x.renderer(), {key: "rrr", draw() {}}); x.frames(gov, 30000); gov.end(); }
  assert.deepEqual(holds(s3), [["rrr", 3, true]], "a closed tab's hold never lifts after clean plays");
  // Another build's holds go; a pick in Settings ends them all.
  const s4 = {...pick("ultra"), [CAP]: j({caps: [{scene: "rrr", level: 1, reason: "x", tab: true, at: Date.now(), build: "2.8.0-r95"}, {scene: "sp", level: 2, reason: "y", at: Date.now(), build: BUILD}]})};
  assert.deepEqual([load({store: s4}).G.profile("rrr").level, load({store: s4}).G.profile("sp").level], [4, 2]); assert.deepEqual(holds(s4), [["sp", 2, false]]);
  load({store: s4}).G.setChoice("ultra"); assert.equal(s4[CAP], "null");
  ok("H5", "each hold ends on its own (7 days, 3 clean plays of its screen, a new build); a pick in Settings ends them all");
}
// H6
{
  const page = read("device-check.html");
  assert.match(page, /function capLevel\(tc,key\)\{if\(!tc\)return null;\n\s*if\(tc\.levels&&typeof tc\.levels==="object"\)\{const l=\[tc\.levels\[key\],tc\.levels\[""\]\]\.filter\(Number\.isInteger\);return l\.length\?Math\.min\(\.\.\.l\):null;\}\n\s*return capHolds\(tc,key\)\?tc\.level:null;\}/);
  assert.match(page, /const held=capLevel\(tc,scene\.key\);\n\s*if\(held!==null&&level>held\)got=\{crashed:true\};/);
  assert.match(page, /if\(!lv\|\|Number\.isInteger\(lv\[""\]\)\)return `\$\{every\?"every 3D screen":"the game"\} draws \$\{LEVELS\[tc\.level\]\}`;/);
  ok("H6", "the Device check opens each screen up to its own hold and says which screen is held (run in r92 D17, D20, D22)");
}
// H7
{
  const store = {...pick("ultra"), [CAP]: j({caps: [{scene: "sp", level: 2, reason: "context lost", at: Date.now(), build: BUILD}]})};
  const f = load({store, framed: true, pathname: SP, search: "?gfx=3&bench=1"});
  assert.deepEqual([f.G.profile().level, f.G.profile().asked], [3, 3], "the check measures High over the pack's hold");
  assert.equal(load({store, framed: true, pathname: SP, search: "?gfx=3"}).G.profile().level, 2, "without bench=1 the hold stands");
  assert.equal(load({store, framed: true, pathname: SP}).G.profile().level, 2, "and in play");
  f.G.governor(f.renderer(), {key: "sp", draw() {}}); f.G.fallback("context lost");
  assert.equal(f.G.profile().level, 2, "a failure in the check itself is honoured from then on");
  ok("H7", "a Device check frame measures the level it asks for over a hold, and honours one it makes");
}
// H8
(async () => {
  const MID = "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB (0x00001C03) Direct3D11 vs_5_0 ps_5_0, D3D11)";
  const device = {gpu: MID, dpr: 1, memory: 8, cores: 8, screen: [1920, 1080], view: [1920, 1035]};
  const store = {}, home = load({store, device, pathname: "/index.html"}), auto = home.G.profile().level;
  assert.ok(auto >= 1 && auto <= 3, `a mid device starts on Auto at Balanced..High (${auto})`);
  store[CAP] = j({caps: [{scene: "sp", level: auto - 1, reason: "context lost", at: Date.now(), build: BUILD}]});
  const f = load({store, device, framed: true, pathname: SP}); assert.equal(f.G.profile().level, auto - 1);
  const p = await f.G.calibrate(f.renderer(), () => {});
  assert.equal(p.level, auto - 1, "the pack stays at its hold after a fast calibration");
  assert.deepEqual(["rrr", "chamber-men", "club-draw"].map(k => f.G.profile(k).level), [auto, auto, auto], "the other screens keep the device's level");
  assert.equal(f.ctx.document.documentElement.dataset.gfx, String(auto - 1), "the pack's page marks what it draws");
  ok("H8", "calibrating a held screen never moves the device's level or the other screens");
  console.log(`PASS r97 gfx hold per screen contracts (${checks} checks)`);
})().catch(e => { console.error(e); process.exit(1); });
