"use strict";
// r96 quality (Nik 2026-11-17). Two changes to the one quality system (js/gfxTier.js), proved with the real module in a
// sandbox and a fake clock (headless Chromium is software GL, so frame rates there mean nothing):
//   Part 1, card 21:44 UTC "Step down when slow, back up": a hand-picked level is the CEILING. A laptop sat at 24 fps on a
//   hand-picked Ultra in Chamber Men (2.8.0 held a pick as picked, no governor). Now the shared governor walks a pick's
//   ladder as it walks Auto's: down between beats when slow, back toward the pick when smooth, never past it. The level, its
//   files and Settings stay the pick. ?gfx=N (tests, the memory proof) and the Device check stay exactly as forced.
//   Part 2, 21:43 UTC "lighter screens ... quality can be higher": the Device check saved ONE level (the lowest screen's), so
//   the heaviest screen held the lighter ones back. Now it saves each screen's own best too, and on Auto each 3D screen
//   draws the level it passed itself. The Ball Game (the lightest screen) is timed as well.
//   P1 a pick steps down only between beats when slow, never mid-beat; climbs back after smooth time and a timed frame; never
//      above the pick; the level, its files and the saved pick stay
//   P2 a pick keeps its own memory (never Auto's), for its own level; Auto's memory is untouched
//   P3 ?gfx=N and the Device check never step; the never-crash cap and the weak-device Ultra/8K gate still hold a pick
//   P4 Auto after a check: each screen draws its own level (profile(scene), the governor's key, a framed page by its path);
//      the device's level (2D, Settings, html[data-gfx]) stays the lowest; the screen ends and the page is back on it
//   P5 an old (2.8.0) result applies to every screen; junk or a screen below the record's level reads as the record's level
//   P6 the crash cap still holds every screen; a failure on a screen caps one below that screen's level; calibrate never
//      moves a measured screen
//   P7 the Device check: every screen climbs on its own (the Ball Game too), saves its own best, and the lowest is the
//      device's level (run in tests/contracts/r91-device-check-verdict-contracts.cjs V5/V9 and r92 D2/D12); its Ball Game
//      frame and the files it needs are published
//   P8 every screen steps softly (Ball Game now fades too), and Chamber Men's warm-up and mount load the same level
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const SRC = read("js/gfxTier.js");
const RTX = "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)";   // a laptop GPU that starts at Extra
const UHD = "ANGLE (Intel, Vulkan 1.3.0 (Intel(R) UHD Graphics (JSL) (0x00004E55)), Mesa 25.0.7)"; // Nik's Chromebook
// A laptop whose chip starts at Light (so a check result from Light up is read) but is not a weak device (16 GB, 8 threads).
const LAPTOP = {gpu: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)", memory: 16, cores: 8};
const QKEY = "careerModeShowdown.gfxQuality.v1", MKEY = "careerModeShowdown.gfxMeasured.v2", CAP = "careerModeShowdown.gfxCap.v1";
const BUILD = /const BUILD="([^"]+)";/.exec(SRC)[1];
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

function sandbox({gpu = RTX, dpr = 1.25, memory = 16, cores = 8, search = "", storage = {}, pathname = "/", parent = null} = {}) {
  const clock = {t: 0}, store = {...storage};
  const doc = {
    createElement: tag => tag === "canvas" ? {getContext: () => ({RENDERER: 7937, MAX_RENDERBUFFER_SIZE: 34024, MAX_TEXTURE_SIZE: 3379,
      getExtension: n => n === "WEBGL_debug_renderer_info" ? {UNMASKED_RENDERER_WEBGL: 37446} : {loseContext() {}},
      getParameter: k => k === 37446 || k === 7937 ? gpu : 16384})} : {style: {}, setAttribute() {}, append() {}, remove() {}},
    body: {append() {}}, documentElement: {dataset: {}}, visibilityState: "visible"
  };
  const ctx = {document: doc, devicePixelRatio: dpr, navigator: {deviceMemory: memory, hardwareConcurrency: cores}, screen: {width: 1920, height: 1080},
    innerWidth: 1920, innerHeight: 1080, location: {search, pathname, origin: "http://x"},
    readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; },
    performance: {now: () => clock.t, timeOrigin: 1}, setTimeout: f => { f(); return 0; }, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    URLSearchParams, CustomEvent: function(type, init){ this.type = type; this.detail = init && init.detail; }, dispatchEvent() {}};
  ctx.globalThis = ctx; ctx.parent = parent || ctx;
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return {G: ctx.CareerModeGfxTier, clock, store, ctx};
}
// A renderer stand-in: a timed draw costs cost() ms on the fake clock.
function fakeRenderer(clock, cost) {
  const r = {pr: 1, domElement: {clientWidth: 1536, clientHeight: 864, addEventListener() {}, removeEventListener() {}}, setPixelRatio(v) { r.pr = v; }, getPixelRatio: () => r.pr,
    getContext: () => ({RGBA: 1, UNSIGNED_BYTE: 1, readPixels() { clock.t += cost(); }})};
  return r;
}
function run(s, gov, total, ms) { const end = s.clock.t + total; while (s.clock.t < end) { s.clock.t += ms; gov.frame(s.clock.t); } }
const DETAIL = (steps, log) => ({steps, apply(step, why) { log.push([step, why]); }});
const measured = (level, scenes) => JSON.stringify({level, at: Date.now(), ...(scenes ? {scenes} : {}), detail: {held: true}});

// P1
{
  // A laptop (dpr 1.25, 1536x864 canvas) that picked Ultra: it starts at its ceiling (2x within 4K), as in 2.8.0.
  const s = sandbox({storage: {[QKEY]: "ultra"}}), cost = {ms: 30}, r = fakeRenderer(s.clock, () => cost.ms), log = [];
  const gov = s.G.governor(r, {key: "chamber-men", draw() {}, beats: true, detail: DETAIL(3, log)});
  const top = gov.pixelRatio();
  assert.equal(s.G.profile().level, 4); assert.ok(top >= 2, `Ultra starts at its ceiling (${top})`);
  run(s, gov, 600, 16.7);
  gov.hold(true); run(s, gov, 3000, 42);                     // a kick at 24 fps
  assert.equal(gov.pixelRatio(), top, "never mid-kick");
  gov.hold(false); run(s, gov, 50, 16.7);
  assert.ok(gov.pixelRatio() < top, `the kick ran slow: one step down when it ended (${top} -> ${gov.pixelRatio()})`);
  // Still slow between kicks: more steps, pixel ratio first, then the heavy parts.
  for (let i = 0; i < 12; i += 1) { gov.hold(true); run(s, gov, 2000, 42); gov.hold(false); run(s, gov, 1500, 42); }
  assert.ok(gov.pixelRatio() <= 1 + 1e-9 && gov.detail() > 0, `down to the floor, then the heavy parts (${gov.pixelRatio()}, detail ${gov.detail()})`);
  assert.deepEqual([gov.level(), s.G.profile().level, s.G.choice()], [4, 4, "ultra"], "the picked level, its files and the saved pick stay Ultra");
  // Smooth again within the visit: a step that ran slow is never tried again in that visit (Auto's no see-saw rule).
  cost.ms = 1; const low = [gov.pixelRatio(), gov.detail()];
  run(s, gov, 20000, 16.7); assert.deepEqual([gov.pixelRatio(), gov.detail()], low, "no see-saw: nothing that ran slow comes back in the same visit");
  gov.end();
  // The next visit (a cooler laptop, a lighter moment): it starts where it settled, and after a smooth beat climbs back,
  // heavy parts first, then the pixel ratio, up to the pick and never past it.
  const n = sandbox({storage: s.store}), rn = fakeRenderer(n.clock, () => 1), logN = [];
  const gn = n.G.governor(rn, {key: "chamber-men", draw() {}, beats: true, detail: DETAIL(3, logN)});
  assert.deepEqual([gn.pixelRatio(), gn.detail()], low, "starts where the last visit settled");
  for (let i = 0; i < 40; i += 1) { gn.hold(true); run(n, gn, 1500, 16.7); gn.hold(false); run(n, gn, 7000, 16.7); }
  assert.equal(gn.detail(), 0, "the heavy parts come back");
  assert.equal(gn.pixelRatio(), top, `climbs back to the pick (${gn.pixelRatio()})`);
  run(n, gn, 20000, 16.7); assert.equal(gn.pixelRatio(), top, "and never past it");
  assert.deepEqual([gn.level(), n.G.choice()], [4, "ultra"]);
  ok("P1", "a pick is a ceiling: down between beats when slow (never mid-kick), back up when smooth (no see-saw in one visit), never past it; the pick stays");
}

// P2
{
  const autoMem = {"careerModeShowdown.gfxSettled.v1.chamber-men": "1", "careerModeShowdown.gfxDetail.v1.chamber-men": JSON.stringify({level: 4, at: 2, floor: 0, t: Date.now()})};
  const s = sandbox({storage: {...autoMem, [QKEY]: "ultra"}}), r = fakeRenderer(s.clock, () => 30);
  const gov = s.G.governor(r, {key: "chamber-men", draw() {}, beats: true, detail: DETAIL(3, [])});
  assert.ok(gov.pixelRatio() >= 2 && gov.detail() === 0, "a pick starts at its own top, not where Auto settled");
  gov.hold(true); run(s, gov, 2000, 42); gov.hold(false); run(s, gov, 3000, 42); const settled = gov.pixelRatio(); gov.end();
  assert.equal(s.store["careerModeShowdown.gfxSettled.v1.chamber-men"], "1", "Auto's memory is untouched");
  assert.deepEqual(JSON.parse(s.store["careerModeShowdown.gfxSettled.v1.chamber-men.pick"]), {pr: settled, level: 4}, "the pick keeps its own, with its level");
  // The next visit with the same pick starts where it settled; another pick starts at its own top.
  const n = sandbox({storage: s.store}), gn = n.G.governor(fakeRenderer(n.clock, () => 1), {key: "chamber-men", draw() {}, beats: true});
  assert.equal(gn.pixelRatio(), settled, "the same pick: where it settled");
  const x = sandbox({storage: {...s.store, [QKEY]: "extra"}}), gx = x.G.governor(fakeRenderer(x.clock, () => 1), {key: "chamber-men", draw() {}});
  assert.equal(gx.pixelRatio(), x.G.profile().pixelRatio, "another pick: as built");
  ok("P2", "a pick keeps its own memory for its own level; Auto's is left alone");
}

// P3
{
  for (const search of ["?gfx=4", "?gfx=4&bench=1"]) {
    const s = sandbox({search, storage: {[QKEY]: "ultra"}}); if (search.includes("bench")) s.ctx.parent = {postMessage() {}, location: {search: ""}};
    const gov = s.G.governor(fakeRenderer(s.clock, () => 30), {key: "chamber-men", draw() {}, detail: DETAIL(3, [])}), p0 = gov.pixelRatio();
    run(s, gov, 5000, 42); assert.deepEqual([gov.pixelRatio(), gov.detail()], [p0, 0], `${search}: as forced, no steps`);
  }
  // The never-crash cap: a picked Ultra that lost its context draws Extra until a new pick; the governor's ceiling is Extra's.
  const c = sandbox({storage: {[QKEY]: "ultra", [CAP]: JSON.stringify({level: 3, reason: "context lost", at: Date.now(), build: BUILD})}});
  const gc = c.G.governor(fakeRenderer(c.clock, () => 1), {key: "rrr", draw() {}});
  assert.equal(c.G.profile().level, 3); run(c, gc, 20000, 16.7); assert.ok(gc.pixelRatio() <= c.G.profile().maxPixelRatio + 1e-9, "never past the capped level");
  // The weak-device gate (Nik 2026-11-12): the Chromebook's saved Ultra pick draws Extra until a check passes Ultra.
  const w = sandbox({gpu: UHD, dpr: 1, memory: 4, cores: 2, storage: {[QKEY]: "ultra"}});
  assert.deepEqual([w.G.profile().level, w.G.profile().gated], [3, 4]);
  const gw = w.G.governor(fakeRenderer(w.clock, () => 30), {key: "chamber-men", draw() {}, detail: DETAIL(2, [])});
  w.clock.t = 0; gw.hold(true); run(w, gw, 2000, 42); gw.hold(false); run(w, gw, 2000, 42); assert.ok(gw.detail() > 0, "at 1x the gated pick steps its heavy parts");
  ok("P3", "?gfx=N and the Device check never step; the crash cap and the weak-device gate still hold a pick");
}

// P4
{
  const scenes = {"chamber-men": 1, rrr: 2, sp: 1, "club-draw": 4};
  const s = sandbox({...LAPTOP, storage: {[MKEY]: measured(1, scenes)}});
  assert.deepEqual([s.G.profile().level, s.G.suggested().level], [1, 1], "the device's level is the lowest screen's");
  assert.equal(s.ctx.document.documentElement.dataset.gfx, "1");
  assert.deepEqual(["chamber-men", "rrr", "sp", "club-draw"].map(k => s.G.profile(k).level), [1, 2, 1, 4], "each screen: its own level");
  assert.equal(s.G.profile().level, 1, "naming a screen to read its profile does not make it the page's screen");
  assert.deepEqual({...s.G.measuredScenes()}, scenes);
  // The Ball Game opens: its governor (and sceneOpening) make it the page's screen; it ends: back on the device's level.
  s.G.sceneOpening("club-draw"); const r = fakeRenderer(s.clock, () => 1);
  const gov = s.G.governor(r, {key: "club-draw", draw() {}, beats: true});
  assert.deepEqual([gov.level(), s.G.builtLevel(r), s.G.profile().level, s.G.profile().auto], [4, 4, 4, true], "the Ball Game draws Ultra on Auto");
  assert.ok(r.pr > 1.25 + 1e-9, `Ultra's ratio, past the screen's own (${r.pr})`);
  assert.equal(s.ctx.document.documentElement.dataset.gfx, "1", "2D screens keep the device's level");
  gov.end(); assert.equal(s.G.profile().level, 1, "the screen is over: the device's level again");
  // A framed screen knows itself by its page (Roulette, the Special Player pack).
  const parentDoc = {documentElement: {dataset: {}}}, f = sandbox({...LAPTOP, pathname: "/visual-assets/v10_1/roulette/index.html", storage: {[MKEY]: measured(1, scenes)}, parent: {document: parentDoc, location: {search: ""}}});
  assert.equal(f.G.profile().level, 2, "Roulette's frame draws Roulette's level");
  assert.equal(parentDoc.documentElement.dataset.gfx, "1", "and leaves the game page on the device's level");
  const sp = sandbox({...LAPTOP, pathname: "/visual-assets/v10_1/special-player/index.html", storage: {[MKEY]: measured(1, scenes)}, parent: {document: {documentElement: {dataset: {}}}, location: {search: ""}}});
  assert.equal(sp.G.profile().level, 1);
  // Only Auto differs by screen: a pick is one level everywhere.
  const pk = sandbox({...LAPTOP, storage: {[MKEY]: measured(1, scenes), [QKEY]: "high"}});
  assert.deepEqual(["chamber-men", "club-draw"].map(k => pk.G.profile(k).level), [2, 2]);
  ok("P4", "Auto after a check: each screen draws its own level; the device's level stays the lowest for 2D and Settings");
}

// P5
{
  const old = sandbox({...LAPTOP, storage: {[MKEY]: JSON.stringify({level: 2, at: 1, detail: {scenes: ["chamber-men", "rrr", "sp"], held: true}})}});
  assert.deepEqual(["chamber-men", "rrr", "sp", "club-draw"].map(k => old.G.profile(k).level), [3, 3, 3, 3].map(() => old.G.profile().level), "a 2.8.0 result: one level for every screen");
  const junk = sandbox({gpu: UHD, dpr: 1, memory: 4, cores: 2, storage: {[MKEY]: measured(1, {"chamber-men": 0, rrr: "x", sp: 9, "club-draw": 2.5})}});
  assert.deepEqual(["chamber-men", "rrr", "sp", "club-draw"].map(k => junk.G.profile(k).level), [1, 1, 1, 1], "below the record, junk or out of range: the record's level");
  // setMeasured keeps each screen at or above the record's level and within what the GPU can hold.
  const w = sandbox({gpu: UHD, dpr: 1, memory: 4, cores: 2});
  w.G.setMeasured(1, {held: true}, {"chamber-men": 0, rrr: 2, sp: 9, "club-draw": 3, other: 4});
  assert.deepEqual({...JSON.parse(w.store[MKEY]).scenes}, {"chamber-men": 1, rrr: 2, sp: 5, "club-draw": 3}, "held to the top this GPU can hold (8K here: a 16384 px buffer, as on the Chromebook)");
  ok("P5", "an old result applies to every screen; a screen never reads below the record's level");
}

// P6
{
  const scenes = {"chamber-men": 1, rrr: 1, sp: 1, "club-draw": 4};
  const capped = sandbox({...LAPTOP, storage: {[MKEY]: measured(1, scenes), [CAP]: JSON.stringify({level: 2, reason: "context lost", at: Date.now(), build: BUILD})}});
  const pb = capped.G.profile("club-draw"); assert.deepEqual([pb.level, pb.fellBack && pb.fellBack.from], [2, 4], "the crash cap holds a screen's own level");
  const s = sandbox({...LAPTOP, storage: {[MKEY]: measured(1, scenes)}}); s.G.sceneOpening("club-draw");
  s.G.governor(fakeRenderer(s.clock, () => 1), {key: "club-draw", draw() {}});
  s.G.fallback("the GPU dropped the picture (context lost)");
  assert.equal(JSON.parse(s.store[CAP]).level, 3, "a failure at the Ball Game's Ultra caps one below it, not below the device's level");
  assert.deepEqual([s.G.profile("club-draw").level, s.G.profile("chamber-men").level], [3, 1]);
  // calibrate never second-guesses a measured screen.
  (async () => {
    const m = sandbox({...LAPTOP, storage: {[MKEY]: measured(1, scenes)}}), r = fakeRenderer(m.clock, () => 20); m.G.sceneOpening("club-draw");
    m.G.governor(r, {key: "club-draw", draw() {}}); const p = await m.G.calibrate(r, () => {});
    assert.equal(p.level, 4, "calibrate leaves the Ball Game's measured Ultra");
    ok("P6", "the crash cap holds every screen; a failure caps one below that screen's level; calibrate leaves a measured screen");
    rest();
  })().catch(error => { console.error(error); process.exitCode = 1; });
}

function rest(){
  // P7
  {
    const page = read("device-check.html");
    assert.match(page, /\{key:"club-draw",name:"Ball Game",beat:"spin",path:"device-check-ball\.html"\}/, "the Ball Game is timed");
    assert.match(page, /else if\(j\.state!=="smooth"\)st\.stops\[scene\.key\]=\{level,state:j\.state\};/, "a screen stops on its own");
    assert.match(page, /T\.setMeasured\(level,\{[\s\S]*?\},own\);/, "each screen's own best is saved");
    const bench = read("device-check-ball.html");
    assert.match(bench, /window\.CareerModeClubDraw3d\.mount\(stage,\{balls:BALLS,me:0,sound:\(\)=>false,reducedMotion:false\}\)/, "the real scene, a spin even under Reduce Motion");
    assert.match(bench, /addEventListener\("pagehide",e=>\{if\(e\.persisted\)return;try\{api\.dispose\(\);\}catch\(_error\)\{\}\}\);/, "its GPU memory is handed back with the frame");
    assert.doesNotMatch(bench.replace(/<!--[\s\S]*?-->/g, ""), /firebase|firestore|productionShared/i, "no game state, no Firestore");
    assert.match(read(".github/workflows/deploy-github-pages.yml"), /cp device-check\.html device-check-chamber\.html device-check-ball\.html \.pages-artifact\//);
    assert.match(read("service-worker.js"), /"device-check-chamber\.html",\n[^\n]*\n\s*"device-check-ball\.html"\n\]\);/);
    assert.match(read("tests/browser/device-lab.cjs"), /ball: \{ name: "Ball Game", url: l => `device-check-ball\.html\?gfx=\$\{l\}\$\{TOP\}` \}/);
    ok("P7", "the Device check times the Ball Game too and saves each screen's best (verdict V5/V9, iPhone D2/D12); its frame is published");
  }
  // P8
  {
    const cm = read("js/chamberMenScene3d.js"), cd = read("js/clubDrawScene3d.js"), rr = read("visual-assets/v10_1/roulette/index.html"), sp = read("visual-assets/v10_1/special-player/index.html");
    assert.match(cm, /p=root\.CareerModeGfxTier\.profile\("chamber-men"\);/, "Chamber Men reads its own level");
    assert.equal((cm.match(/cm3Quality\(/g) || []).length, 3, "one place decides the level for the season page's warm-up and the mount (the same files, pre-parsed once)");
    assert.match(cm, /governor\(renderer,\{key:"chamber-men",[^\n]{0,160}before:fadeFrom/, "Chamber Men fades a step in play");
    assert.match(cd, /return root\.CareerModeGfxTier\.profile\("club-draw"\);/, "the Ball Game reads its own level");
    assert.match(cd, /before:\(\)=>GFX\.softCut\?\.\(canvas,timed\)/, "the Ball Game fades a step in play (r96)");
    assert.match(rr, /key:"rrr"[^;]*before:\(\)=>GFXT\.softCut/); assert.match(sp, /key:"sp"[^;]*before:\(\)=>GFX\.softCut/);
    ok("P8", "every 3D screen steps softly between beats, Ball Game included; Chamber Men's warm-up and mount load one level");
  }
  console.log(`PASS r96 quality per screen contracts (${checks} checks)`);
}
