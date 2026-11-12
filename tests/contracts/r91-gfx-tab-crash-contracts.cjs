"use strict";
// r91 tab-crash guard (js/gfxTier.js). A tab the browser kills while a 3D screen opens (out of memory), or one the player has
// to reload because it hung, leaves no WebGL "context lost" behind: in 2.3.0 the level stayed and the next open died the same
// way. Now a scene leaves a mark while it opens; a mark still there when the same tab loads the game again caps the level
// one down. The real module runs in a vm with a scripted tab (sessionStorage), page load (performance.timeOrigin) and frames.
//   T1 a framed 3D screen marks itself when its profile is first built; the game's own page marks at governor(); Light never
//   T2 the mark goes once the scene is running (20 s of frames, or its first beat played), at end(), and when the page is
//      hidden or left; a hidden page leaves none
//   T3 same tab, a new load, the mark still there: the level is capped one down before the scene opens again
//   T4 no false alarm: another tab's mark, a live frame on the same load, a clean reload, a tab that cannot be told apart
//   T5 the cap does not lift after clean scenes; it ends after 7 days or with a pick in Settings; a Device check leaves it
//   T6 Settings and the docs say what happened
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {deviceOf} = require("../support/device-lab-profiles.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SRC = read("js/gfxTier.js");
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
const cap = store => JSON.parse(store[CAP] || "null");

// T1
{
  const store = pick("extra"), tab = {};
  const f = load({store, tab, framed: true});
  const p = f.G.profile(); assert.equal(p.level, 3);
  const [m] = f.marks(); assert.equal(f.marks().length, 1, "a framed 3D screen marks itself as its profile is built");
  assert.deepEqual([m.level, m.scene, m.bench, m.tab, m.top], [3, "roulette/index.html", false, tab["careerModeShowdown.gfxTab.v1"], "1000"]);
  assert.ok(m.tab && m.tab.length >= 8, "the tab has an id of its own, kept in sessionStorage");
  f.G.profile(); f.G.reset(); f.G.profile(); assert.equal(f.marks().length, 1, "once per page");
  // The game's own page: Settings and Home read the profile and mark nothing; Chamber Men marks when its governor is made.
  const s2 = pick("high"), g = load({store: s2, pathname: "/index.html"});
  g.G.profile(); g.G.suggested(); assert.deepEqual(g.marks(), []);
  const gov = g.G.governor(g.renderer(), {key: "chamber-men", draw() {}});
  assert.deepEqual(g.marks().map(x => [x.level, x.scene]), [[2, "chamber-men"]]); gov.end();
  // The Device check's frames say so in the mark.
  const b = load({store: {}, framed: true, pathname: "/device-check-chamber.html", search: "?gfx=4&bench=1"}); b.G.profile();
  assert.deepEqual(b.marks().map(x => [x.level, x.bench]), [[4, true]]);
  // Light has no level below it: no mark, on the lab's Chromebook or anywhere.
  const cb = load({store: {}, framed: true, device: deviceOf("chromebook866")}); assert.equal(cb.G.profile().level, 0); assert.deepEqual(cb.marks(), []);
  ok("T1", "a framed 3D screen marks itself when its profile is first built; the game's page marks at governor(); Light never");
}
// T2
{
  const open = extra => { const store = pick("extra"), f = load({store, framed: true, ...extra}); f.G.profile(); return {store, f, gov: f.G.governor(f.renderer(), {key: "rrr", draw() {}})}; };
  let a = open(); assert.equal(a.f.marks().length, 1); a.f.frames(a.gov, 19000); assert.equal(a.f.marks().length, 1, "19 s of frames: still opening");
  a.f.frames(a.gov, 1500); assert.deepEqual(a.f.marks(), [], "20 s of frames: the scene is open");
  a = open(); a.gov.hold(true); a.f.frames(a.gov, 3000); assert.equal(a.f.marks().length, 1, "inside its first beat: still opening");
  a.gov.hold(false); assert.deepEqual(a.f.marks(), [], "its first beat played to the end");
  a = open(); a.gov.end(); assert.deepEqual(a.f.marks(), [], "end()");
  a = open(); a.f.pagehide(); assert.deepEqual(a.f.marks(), [], "the page is left (a reload, a closed tab, a removed frame)");
  a = open(); a.f.hide(); assert.deepEqual(a.f.marks(), [], "the page is hidden (a hidden tab may be discarded; that is not the scene's doing)");
  const h = load({store: pick("extra"), framed: true, hidden: true}); h.G.profile(); assert.deepEqual(h.marks(), [], "a hidden page leaves no mark");
  // Another scene's mark is left alone when this one goes.
  const store = pick("extra"), tab = {}, one = load({store, tab, framed: true}); one.G.profile();
  const two = load({store, tab, framed: true, pathname: "/visual-assets/v10_1/special-player/index.html"}); two.G.profile();
  assert.equal(two.marks().length, 2); two.pagehide(); assert.deepEqual(two.marks().map(x => x.scene), ["roulette/index.html"]);
  ok("T2", "the mark goes once the scene runs (20 s of frames or its first beat), at end(), and when the page is hidden or left");
}
// T3
{
  // Ultra picked on a device that cannot hold it: the tab dies while Roulette opens (no pagehide, nothing runs).
  const store = pick("ultra"), tab = {};
  const dead = load({store, tab, framed: true, origin: 1000}); assert.equal(dead.G.profile().level, 4); assert.equal(dead.marks().length, 1);
  // The player reloads. The game's page loads the module: the mark is this tab's, from an earlier load.
  const home = load({store, tab, origin: 5000, pathname: "/index.html"});
  const c = cap(store); assert.deepEqual([c.level, c.tab, c.from, c.scene, c.bench], [3, true, 4, "roulette/index.html", false]);
  assert.match(c.reason, /the tab closed while this 3D screen was opening/);
  assert.deepEqual(home.marks(), [], "the mark is spent");
  assert.deepEqual(j(home.G.tabCrash()), j({level: 3, from: 4, scene: "roulette/index.html", bench: false, at: c.at}));
  // Roulette opens again, one level down, and that is the level it marks.
  const again = load({store, tab, framed: true, origin: 5000}); const p = again.G.profile();
  assert.equal(p.level, 3); assert.equal(p.fellBack.from, 4); assert.deepEqual(again.marks().map(x => x.level), [3]);
  // It dies again at Extra: one more level. A third time from High: Balanced.
  load({store, tab, origin: 9000, pathname: "/index.html"}); assert.equal(cap(store).level, 2);
  // Straight into the scene's frame (no game page first): the frame's own copy of the module reads the mark before it builds.
  const s2 = pick("high"), t2 = {}; load({store: s2, tab: t2, framed: true, origin: 1}).G.profile();
  const direct = load({store: s2, tab: t2, framed: true, origin: 2}); assert.equal(direct.G.profile().level, 1, "the scene that opens next already has the lower level");
  // 8K falls to Ultra. An older, lower cap is kept. Auto is capped the same way.
  const s3 = {...pick("8k")}, t3 = {}; assert.equal(load({store: s3, tab: t3, framed: true, origin: 1}).G.profile().level, 5); load({store: s3, tab: t3, origin: 2}); assert.equal(cap(s3).level, 4);
  const s4 = {...pick("ultra"), [CAP]: j({level: 1, reason: "the GPU ran out of memory", at: Date.now()})}, t4 = {};
  const low = load({store: s4, tab: t4, framed: true, origin: 1}); assert.equal(low.G.profile().level, 1); load({store: s4, tab: t4, origin: 2}); assert.equal(cap(s4).level, 0, "one below what was opening, never above an older cap");
  const s5 = {"careerModeShowdown.gfxMeasured.v2": j({level: 3, at: Date.now()})}, t5 = {};
  assert.equal(load({store: s5, tab: t5, framed: true, origin: 1}).G.profile().level, 3); const auto = load({store: s5, tab: t5, origin: 2, pathname: "/index.html"});
  assert.deepEqual([auto.G.suggested().now, auto.G.suggested().lowered], [2, true], "Settings reads Auto as lowered");
  ok("T3", "same tab, a new load, the mark still there: the level is capped one down before the scene opens again");
}
// T4
{
  // Another tab's mark proves nothing (that tab may be alive, or may have been closed): no cap, and the mark stays.
  const store = pick("ultra"); load({store, tab: {}, framed: true, origin: 1000}).G.profile();
  const other = load({store, tab: {}, origin: 5000, pathname: "/index.html"}); other.G.profile();
  assert.equal(cap(store), null); assert.equal(other.marks().length, 1);
  // ...until it is a day old, then it goes, still without a cap.
  const old = JSON.parse(store[OPEN]); old[0].at = Date.now() - 25 * 3600e3; store[OPEN] = j(old);
  const later = load({store, tab: {}, origin: 6000, pathname: "/index.html"}); assert.deepEqual(later.marks(), []); assert.equal(cap(store), null);
  // A frame alive on this very load of the game's page (Roulette still opening while the pack is made): not a death.
  const s2 = pick("ultra"), t2 = {}; load({store: s2, tab: t2, framed: true, origin: 1000}).G.profile();
  const sibling = load({store: s2, tab: t2, framed: true, origin: 1000, pathname: "/visual-assets/v10_1/special-player/index.html"});
  assert.equal(cap(s2), null); assert.equal(sibling.G.profile().level, 4);
  // A clean reload while the scene was opening: the page said goodbye, so there is nothing to find.
  const s3 = pick("ultra"), t3 = {}; const first = load({store: s3, tab: t3, framed: true, origin: 1000}); first.G.profile(); first.pagehide();
  load({store: s3, tab: t3, origin: 2000, pathname: "/index.html"}); assert.equal(cap(s3), null);
  // A browser where the tab or the load cannot be told apart: no mark is ever written, so nothing can be misread.
  const s4 = pick("ultra"); load({store: s4, tab: null, framed: true}).G.profile(); assert.equal(s4[OPEN], undefined);
  const s5 = pick("ultra"); load({store: s5, tab: {}, framed: true, origin: null}).G.profile(); assert.equal(s5[OPEN], undefined);
  ok("T4", "no false alarm: another tab's mark, a live frame on the same load, a clean reload, a tab that cannot be told apart");
}
// T5
{
  const store = pick("ultra"), tab = {}; load({store, tab, framed: true, origin: 1}).G.profile(); load({store, tab, origin: 2});
  assert.equal(cap(store).level, 3);
  // Three clean scenes of 30 s at the capped level: a GPU-failure cap would lift here; this one stays.
  for (let i = 0; i < 4; i += 1) { const f = load({store, tab, framed: true, origin: 2, now: i * 1e5}); f.G.profile(); const gov = f.G.governor(f.renderer(), {key: "rrr", draw() {}}); f.frames(gov, 30000); gov.end(); }
  assert.equal(cap(store).level, 3, "clean scenes at the lower level do not put the level that closed the tab back");
  assert.match(SRC, /function gfxCapClean\(level\)\{const v=gfxCap\(\);if\(!v\|\|v\.level!==level\|\|v\.tab\)return;/);
  // (The same three scenes do lift a GPU-failure cap, as before.)
  const g = {...pick("ultra"), [CAP]: j({level: 3, reason: "the GPU ran out of memory", at: Date.now()})};
  for (let i = 0; i < 3; i += 1) { const f = load({store: g, framed: true, origin: 2}); f.G.profile(); const gov = f.G.governor(f.renderer(), {key: "rrr", draw() {}}); f.frames(gov, 30000); gov.end(); }
  assert.equal(cap(g), null);
  // A finished Device check leaves it; a pick in Settings ends it; so do 7 days.
  const page = load({store, tab, origin: 3, pathname: "/index.html"}); page.G.setMeasured(4, {}); assert.equal(cap(store).level, 3);
  page.G.setChoice("ultra"); assert.equal(cap(store), null); assert.equal(page.G.tabCrash(), null);
  const s2 = {...pick("ultra"), [CAP]: j({level: 3, reason: "the tab closed while this 3D screen was opening", tab: true, from: 4, at: Date.now() - 8 * 864e5})};
  assert.equal(load({store: s2, origin: 4, pathname: "/index.html"}).G.profile().level, 4, "after 7 days the level is tried again");
  ok("T5", "the cap does not lift after clean scenes; it ends after 7 days or with a pick in Settings; a Device check leaves it");
}
// T6
{
  const settings = read("js/settings.js"), docs = read("docs/QUALITY_LEVELS.md");
  assert.ok(settings.includes("if(p && p.fellBack){ drawn = ` ${tier.label(p.level)} is drawn for now (lowered after a graphics error).`; }"), "Settings says what a picked level is drawn at while a cap holds");
  assert.match(docs, /A tab that dies while a 3D screen opens/);
  assert.match(docs, /careerModeShowdown\.gfxOpening\.v1/);
  for (const k of ["careerModeShowdown.gfxOpening.v1", "careerModeShowdown.gfxTab.v1", "OPEN_RUN_MS=20000", "OPEN_STALE_MS=864e5"]) assert.ok(SRC.includes(k), k);
  ok("T6", "Settings and docs/QUALITY_LEVELS.md say what happened");
}
console.log(`PASS r91 gfx tab-crash contracts (${checks} checks)`);
