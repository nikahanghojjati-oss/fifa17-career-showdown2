"use strict";
// r91 governor: heavy parts step between beats (Sol 6.1 review of 2.3.0, section 3; Nik 2026-11-11 14:33 UTC: "heavy parts
// like crowd, shadows and glow are fixed when the scene loads, so a slow device keeps paying for them").
// In 2.3.0 the governor moved the pixel ratio only, forgot every slow frame seen during a beat (hold(false) cleared them, and
// Roulette holds for its whole turn), had no step below 1x, and a warm-up level change left the built costs in place.
// The real js/gfxTier.js runs here in a sandbox with a fake clock:
//   B1 a beat that ran slow steps down when it ends, never inside it; a short stutter does not
//   B2 the ladder: pixel ratio first, then the scene's heavy parts (detail steps), one at a time, only between beats
//   B3 a 1x screen at Light has lower steps now (the detail ladder); without a ladder nothing changes, as before
//   B4 a heavy part taken off stays off for that visit; on a later visit it may come back after a smooth beat, 6 s smooth
//      and a timed frame with room; one that then runs slow goes off again and stays off for a week of visits
//   B5 a visit starts where the last one settled (same built level only); a picked level and the Device check never adapt
//   B6 a screen that simply runs under 60 Hz (cheap frames at a steady 30 or 50 fps) steps as 2.3.0 did, then ends where it began;
//      a busy frame callback or a dear timed draw is
//   B7 calibrate: the level the scene was built at stays what the governor reports; a slow warm-up starts the heavy parts
//      one step down (at Light too); a level found slow is not tried again on the page; a framed scene marks its own page only
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
// Light: the Chromebook, as the device lab describes it (tests/browser/device-lab.cjs PROFILES: Intel UHD JSL, 4 GB, 2 threads,
// a 1920x1080 screen at 1x). The sandbox's defaults below are that device.
const {PROFILES: LAB} = require("../support/device-lab-profiles.cjs");
const CHROMEBOOK = LAB.chromebook866, UHD = CHROMEBOOK.renderer;
assert.deepEqual([CHROMEBOOK.dpr, CHROMEBOOK.memory, CHROMEBOOK.cores, CHROMEBOOK.screen.width, CHROMEBOOK.screen.height, CHROMEBOOK.viewport.width, CHROMEBOOK.viewport.height],
  [1, 4, 2, 1920, 1080, 1920, 866], "the lab's Chromebook is the device this contract's defaults stand for");

const ROOT = path.resolve(__dirname, "../..");
const SRC = fs.readFileSync(path.join(ROOT, "js/gfxTier.js"), "utf8");
const GTX = "ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)";       // High
const IRIS = "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)";  // Balanced
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

function sandbox({gpu = UHD, dpr = 1, memory = 4, cores = 2, search = "", storage = {}, timeline = false, parent = null} = {}) {
  const clock = {t: 0, frame: 0}, store = {...storage};
  const doc = {
    createElement: tag => tag === "canvas" ? {getContext: () => ({RENDERER: 7937, MAX_RENDERBUFFER_SIZE: 34024, MAX_TEXTURE_SIZE: 3379,
      getExtension: n => n === "WEBGL_debug_renderer_info" ? {UNMASKED_RENDERER_WEBGL: 37446} : {loseContext() {}},
      getParameter: k => k === 37446 || k === 7937 ? gpu : 16384})} : {style: {}, setAttribute() {}, append() {}, remove() {}},
    body: {append() {}}, documentElement: {dataset: {}},
    ...(timeline ? {timeline: {get currentTime() { return clock.frame; }}} : {})
  };
  const ctx = {document: doc, devicePixelRatio: dpr, navigator: {deviceMemory: memory, hardwareConcurrency: cores}, screen: {width: 1920, height: 1080},
    location: {search, origin: "http://x"}, readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; },
    performance: {now: () => clock.t}, setTimeout: f => { f(); return 0; }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, URLSearchParams};
  ctx.globalThis = ctx; ctx.parent = parent || ctx;
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return {G: ctx.CareerModeGfxTier, clock, store, ctx};
}
// A renderer stand-in: a timed draw costs cost() ms on the fake clock.
function fakeRenderer(clock, cost) {
  const r = {pr: 1, domElement: {clientWidth: 1920, clientHeight: 866}, setPixelRatio(v) { r.pr = v; }, getPixelRatio: () => r.pr,
    getContext: () => ({RGBA: 1, UNSIGNED_BYTE: 1, readPixels() { clock.t += cost(); }})};
  return r;
}
// Frames of `ms` each for `total` ms. work: how long the frame callback keeps the main thread (needs timeline: true).
async function run(s, gov, total, ms, work) {
  const end = s.clock.t + total;
  while (s.clock.t < end) {
    const start = s.clock.t + ms; s.clock.frame = start; s.clock.t = start; gov.frame(start);
    if (work !== undefined) { s.clock.t = start + work; await null; s.clock.t = start; }
  }
}
const DETAIL = (steps, log) => ({steps, apply(step, why) { log.push([step, why]); }});
const j = v => JSON.stringify(v);

(async () => {
  // B1
  {
    const s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8}), r = fakeRenderer(s.clock, () => 12);
    const gov = s.G.governor(r, {key: "b1", draw() {}});
    assert.equal(gov.pixelRatio(), 1.5, "High starts at 1.5 on a 2x screen");
    await run(s, gov, 1000, 16.7);                       // the calm scene
    gov.hold(true); await run(s, gov, 2500, 30);          // a kick at 33 fps
    assert.equal(gov.pixelRatio(), 1.5, "held: nothing changes inside the beat");
    gov.hold(false); assert.equal(gov.pixelRatio(), 1.5, "hold(false) itself draws nothing new");
    await run(s, gov, 34, 16.7);
    assert.equal(gov.pixelRatio(), 1.25, "2.3.0 forgot the beat; now the step is taken as it ends");
    // The next beat is smooth: no further step. A short stutter in a beat is not a reason either.
    await run(s, gov, 1000, 16.7); gov.hold(true); await run(s, gov, 2500, 16.7); gov.hold(false); await run(s, gov, 500, 16.7);
    assert.equal(gov.pixelRatio(), 1.25);
    gov.hold(true); await run(s, gov, 1000, 16.7); await run(s, gov, 300, 45); await run(s, gov, 1500, 16.7); gov.hold(false); await run(s, gov, 500, 16.7);
    assert.equal(gov.pixelRatio(), 1.25, "a 0.3 s stutter in a 2.8 s beat changes nothing");
    // A beat with no calm scene seen before it: the step waits to see the calm scene is not as slow as the beat.
    const s2 = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8}), g2 = s2.G.governor(fakeRenderer(s2.clock, () => 12), {key: "b1b", draw() {}});
    g2.hold(true); await run(s2, g2, 2000, 30); g2.hold(false); await run(s2, g2, 100, 16.7);
    assert.equal(g2.pixelRatio(), 1.5, "the first calm frames are still read as slow (the average follows)");
    await run(s2, g2, 600, 16.7); assert.equal(g2.pixelRatio(), 1.25, "calm scene fine, beat slow: one step");
    ok("B1", "a beat that ran slow steps down when it ends, never inside it; a short stutter does not");
  }
  // B2 + B3
  {
    const log = [], s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8}), r = fakeRenderer(s.clock, () => 12);
    const gov = s.G.governor(r, {key: "b2", draw() {}, beats: true, detail: DETAIL(2, log)});
    const seen = [];
    for (let i = 0; i < 6; i += 1) { await run(s, gov, 800, 16.7); gov.hold(true); await run(s, gov, 2000, 30); assert.equal(seen.length ? seen[seen.length - 1] : "1.5/0", `${gov.pixelRatio()}/${gov.detail()}`, "nothing moves inside a beat"); gov.hold(false); await run(s, gov, 50, 16.7); seen.push(`${gov.pixelRatio()}/${gov.detail()}`); }
    assert.deepEqual(seen, ["1.25/0", "1/0", "1/1", "1/2", "1/2", "1/2"], "pixel ratio down to the floor, then the heavy parts, one step per slow beat, then nothing left");
    assert.equal(j(log), j([[1, "slow"], [2, "slow"]]));
    // Nik's Chromebook: Light on a 1x screen has one pixel ratio. 2.3.0 had no lower step; the ladder is the lower step.
    const logC = [], c = sandbox(), gc = c.G.governor(fakeRenderer(c.clock, () => 14), {key: "b3", draw() {}, detail: DETAIL(3, logC)});
    assert.deepEqual([c.G.profile().level, gc.pixelRatio()], [0, 1]);
    await run(c, gc, 1200, 30); assert.equal(j(logC), j([[1, "slow"]]), "a second of slow calm frames: the first heavy part goes");
    gc.hold(true); await run(c, gc, 3000, 30); assert.equal(logC.length, 1, "none inside a beat"); gc.hold(false); await run(c, gc, 50, 30);
    assert.equal(j(logC), j([[1, "slow"], [2, "slow"]]));
    // No ladder offered: exactly as before (nothing lower than 1x).
    const n = sandbox(), gn = n.G.governor(fakeRenderer(n.clock, () => 14), {key: "b3n", draw() {}}); await run(n, gn, 5000, 30);
    assert.deepEqual([gn.pixelRatio(), gn.detail()], [1, 0]);
    // A ladder that is not one (no steps, no apply) is ignored.
    for (const bad of [{steps: 0, apply() {}}, {steps: 2}, {steps: 1.5, apply() {}}, null]) { const b = sandbox(); const gb = b.G.governor(fakeRenderer(b.clock, () => 14), {key: "x", draw() {}, detail: bad}); await run(b, gb, 3000, 30); assert.equal(gb.detail(), 0); }
    // A scene's apply() that throws never stops the governor.
    const t = sandbox(), gt = t.G.governor(fakeRenderer(t.clock, () => 14), {key: "t", draw() {}, detail: {steps: 2, apply() { throw new Error("scene bug"); }}});
    await run(t, gt, 3000, 30); assert.equal(gt.detail(), 2);
    ok("B2", "the ladder: pixel ratio first, then the scene's heavy parts, one step at a time, only between beats");
    ok("B3", "a 1x screen at Light has lower steps now; without a ladder nothing changes");
  }
  // B4
  {
    // Visit 1: two slow beats take both heavy parts. Nothing comes back on this visit, however calm it gets.
    const log = [], s = sandbox(), r = fakeRenderer(s.clock, () => 14), gov = s.G.governor(r, {key: "b4", draw() {}, beats: true, detail: DETAIL(2, log)});
    await run(s, gov, 600, 16.7); gov.hold(true); await run(s, gov, 2000, 30); gov.hold(false); await run(s, gov, 50, 16.7);
    await run(s, gov, 600, 16.7); gov.hold(true); await run(s, gov, 2000, 30); gov.hold(false); await run(s, gov, 50, 16.7);
    assert.equal(gov.detail(), 2);
    r.getContext = fakeRenderer(s.clock, () => 3).getContext;
    gov.hold(true); await run(s, gov, 2000, 16.7); gov.hold(false); await run(s, gov, 20000, 16.7);
    assert.equal(gov.detail(), 2, "never back to a step that ran slow on this visit");
    gov.end();
    assert.deepEqual(JSON.parse(s.store["careerModeShowdown.gfxDetail.v1.b4"], (k, v) => k === "t" ? undefined : v), {level: 0, at: 2, floor: 0});
    // Visit 2 starts there. Calm and cheap for a long time: still nothing comes back before a beat has run smooth.
    const log2 = [], v = sandbox({storage: s.store}), gv = v.G.governor(fakeRenderer(v.clock, () => 3), {key: "b4", draw() {}, beats: true, detail: DETAIL(2, log2)});
    assert.equal(j(log2), j([[2, "start"]]));
    await run(v, gv, 20000, 16.7); assert.equal(gv.detail(), 2, "a calm table is no proof the shot will hold");
    gv.hold(true); await run(v, gv, 2000, 16.7); gv.hold(false);
    await run(v, gv, 5000, 16.7); assert.equal(gv.detail(), 2, "6 s smooth are asked for");
    await run(v, gv, 1500, 16.7); assert.equal(gv.detail(), 1, "smooth beat, 6 s smooth, a timed frame with room: the last part taken comes back");
    assert.equal(j(log2[log2.length - 1]), j([1, "smooth"]));
    // It runs slow again in the next beat: off again, and it stays off.
    gv.hold(true); await run(v, gv, 2000, 30); gv.hold(false); await run(v, gv, 50, 16.7); assert.equal(gv.detail(), 2);
    gv.hold(true); await run(v, gv, 2000, 16.7); gv.hold(false); await run(v, gv, 20000, 16.7); assert.equal(gv.detail(), 2);
    gv.end();
    const saved = JSON.parse(v.store["careerModeShowdown.gfxDetail.v1.b4"]);
    assert.deepEqual([saved.level, saved.at, saved.floor], [0, 2, 2], "what settled, and that step 1 was tried and ran slow");
    // Visit 3 and later leave step 1 alone for a week.
    const w3 = sandbox({storage: v.store}), g3 = w3.G.governor(fakeRenderer(w3.clock, () => 3), {key: "b4", draw() {}, beats: true, detail: DETAIL(2, [])});
    g3.hold(true); await run(w3, g3, 2000, 16.7); g3.hold(false); await run(w3, g3, 20000, 16.7); assert.equal(g3.detail(), 2, "the step that failed stays off for a week of visits");
    const old = {...v.store, "careerModeShowdown.gfxDetail.v1.b4": JSON.stringify({...saved, t: Date.now() - 8 * 864e5})};
    const w = sandbox({storage: old}), gw = w.G.governor(fakeRenderer(w.clock, () => 3), {key: "b4", draw() {}, beats: true, detail: DETAIL(2, [])});
    gw.hold(true); await run(w, gw, 2000, 16.7); gw.hold(false); await run(w, gw, 7000, 16.7); assert.equal(gw.detail(), 1, "after a week it may be tried again");
    const d = sandbox({storage: {"careerModeShowdown.gfxDetail.v1.b4": JSON.stringify({level: 0, at: 1, floor: 0, t: Date.now()})}}), gd = d.G.governor(fakeRenderer(d.clock, () => 9), {key: "b4", draw() {}, detail: DETAIL(2, [])});
    await run(d, gd, 30000, 16.7); assert.equal(gd.detail(), 1, "a timed frame over 40% of the budget brings nothing back");
    ok("B4", "heavy parts come back on a later visit only: after a smooth beat, 6 s smooth and a timed frame with room; one that runs slow again stays off");
  }
  // B5
  {
    const mem = {"careerModeShowdown.gfxDetail.v1.k": JSON.stringify({level: 0, at: 2, floor: 0, t: Date.now()})};
    const log = [], s = sandbox({storage: mem}), g = s.G.governor(fakeRenderer(s.clock, () => 3), {key: "k", draw() {}, detail: DETAIL(3, log)});
    assert.deepEqual([g.detail(), j(log)], [2, j([[2, "start"]])], "the visit starts where the last one settled, before its first frame");
    // Built at another level now (a Device check since): the memory is for another picture, so it starts as built.
    const other = sandbox({gpu: IRIS, memory: 16, cores: 8, storage: mem}), go = other.G.governor(fakeRenderer(other.clock, () => 3), {key: "k", draw() {}, detail: DETAIL(3, [])});
    assert.deepEqual([other.G.profile().level, go.detail()], [1, 0]);
    // A memory beyond the ladder the scene offers now is held to it.
    const short = sandbox({storage: mem}), gs = short.G.governor(fakeRenderer(short.clock, () => 3), {key: "k", draw() {}, detail: DETAIL(1, [])}); assert.equal(gs.detail(), 1);
    // A picked level is held as picked: no memory, no steps, nothing saved.
    const logP = [], pk = sandbox({storage: {...mem, "careerModeShowdown.gfxQuality.v1": "light"}}), gp = pk.G.governor(fakeRenderer(pk.clock, () => 14), {key: "k", draw() {}, detail: DETAIL(3, logP)});
    await run(pk, gp, 4000, 30); gp.hold(true); await run(pk, gp, 3000, 30); gp.hold(false); await run(pk, gp, 4000, 30); gp.end();
    assert.deepEqual([gp.detail(), logP.length, pk.store["careerModeShowdown.gfxDetail.v1.k"]], [0, 0, mem["careerModeShowdown.gfxDetail.v1.k"]], "a picked level never adapts");
    // The Device check times the level as built.
    const logB = [], bn = sandbox({search: "?gfx=0&bench=1", storage: mem}); bn.ctx.parent = {postMessage() {}, location: {search: ""}};
    const gb = bn.G.governor(fakeRenderer(bn.clock, () => 14), {key: "k", draw() {}, detail: DETAIL(3, logB)}); await run(bn, gb, 4000, 30);
    assert.deepEqual([gb.detail(), logB.length], [0, 0], "bench: as built");
    ok("B5", "a visit starts where the last one settled (same built level only); a picked level and the Device check never adapt");
  }
  // B6
  {
    // A phone in a 30 fps power mode, a 50 Hz screen: steady frames, the callback idle, the draw cheap. The governor steps
    // down as 2.3.0 did, sees the steps buy nothing, and puts them back: the picture ends where it began.
    for (const ms of [33.3, 25]) {
      const log = [], s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8, timeline: true}), r = fakeRenderer(s.clock, () => 3);
      const gov = s.G.governor(r, {key: "p" + ms, draw() {}, detail: DETAIL(2, log)}), first = gov.pixelRatio();
      await run(s, gov, 1200, ms, 2); assert.ok(gov.pixelRatio() < first, `${ms} ms frames for a second: a step, as in 2.3.0`);
      await run(s, gov, 20000, ms, 2);
      assert.ok(gov.pixelRatio() === first && gov.detail() === 0, `${ms} ms frames with a 3 ms draw and a 2 ms callback: two steps bought nothing, so they are undone`);
      assert.equal(log.length, 0, "the heavy parts were never touched");
      // Step-ups keep 2.3.0's absolute bar (frames under 17.6 ms): at this pace the screen never climbs above its start
      // (review on #1398: it went from 1.5x to the level's 2x on a 30 fps phone).
      assert.ok(first < s.G.profile().maxPixelRatio, "the level has room above the start, so a climb would show");
      await run(s, gov, 40000, ms, 2);
      assert.ok(gov.pixelRatio() === first && gov.detail() === 0, "40 s more at the screen's own pace: no step either way");
      const before = gov.pixelRatio();
      gov.hold(true); await run(s, gov, 3000, ms, 2); gov.hold(false); await run(s, gov, 10000, ms, 2);
      assert.ok(gov.pixelRatio() === before && gov.detail() === 0, "a beat at the screen's own pace is not slow, and no step up follows it");
      // From that pace, real slowness still counts.
      const top = gov.pixelRatio(); await run(s, gov, 2500, ms * 1.6, 2 + ms); assert.ok(gov.pixelRatio() < top, "frames well under the screen's pace with a busy callback: a step");
    }
    // A visit that ends while steps are on probe remembers where the probe began, not the probe.
    {
      const s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8, timeline: true}), gov = s.G.governor(fakeRenderer(s.clock, () => 3), {key: "pe", draw() {}});
      const first = gov.pixelRatio(); await run(s, gov, 1200, 33.3, 2); assert.ok(gov.pixelRatio() < first); gov.end();
      assert.equal(Number(s.store["careerModeShowdown.gfxSettled.v1.pe"]), first);
    }
    // A power mode that ends: the pace taken at 30 fps is dropped once the screen shows 60 again, and 25 fps is slow again.
    {
      const s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8, timeline: true}), gov = s.G.governor(fakeRenderer(s.clock, () => 3), {key: "pm", draw() {}});
      await run(s, gov, 8000, 33.3, 2); await run(s, gov, 4000, 16.7, 2); const top = gov.pixelRatio();
      await run(s, gov, 3000, 40, 30); assert.ok(gov.pixelRatio() < top, "back at 60 Hz, a busy 25 fps is slow again");
      // Beats back to back with no calm scene between them: the busy callback is proof enough.
      const b2 = sandbox({timeline: true}), log = [], g2 = b2.G.governor(fakeRenderer(b2.clock, () => 3), {key: "b2b", draw() {}, detail: DETAIL(2, log)});
      g2.hold(true); await run(b2, g2, 2000, 30, 22); g2.hold(false); await run(b2, g2, 34, 30, 22); g2.hold(true);
      assert.equal(j(log), j([[1, "slow"]]), "the step is taken in the gap, before the next beat");
    }
    // The callback itself is the cost (a 2-thread Chromebook: skinning, animation, draw submission), the timed draw cheap.
    const b = sandbox({timeline: true}), logB = [], gb = b.G.governor(fakeRenderer(b.clock, () => 3), {key: "busy", draw() {}, detail: DETAIL(2, logB)});
    await run(b, gb, 1500, 30, 22); assert.equal(gb.detail(), 1, "a busy frame callback is the scene's cost");
    // The GPU is the cost: an idle callback, a dear timed draw.
    const g = sandbox({timeline: true}), gg = g.G.governor(fakeRenderer(g.clock, () => 20), {key: "gpu", draw() {}, detail: DETAIL(2, [])});
    await run(g, gg, 1500, 30, 1); assert.equal(gg.detail(), 1, "a dear timed draw is the scene's cost");
    // Without a way to time the callback (no document.timeline), slow frames count as they always did.
    const o = sandbox(), go = o.G.governor(fakeRenderer(o.clock, () => 3), {key: "old", draw() {}, detail: DETAIL(2, [])});
    await run(o, go, 1500, 30); assert.equal(go.detail(), 1);
    ok("B6", "a screen that simply runs under 60 Hz ends where it began; a busy callback or a dear timed draw steps and stays");
  }
  // B9 (review on #1398): the cost that neither the callback nor a timed draw shows. A weak GPU spends its frame putting
  // the canvas on the page; fewer pixels help, and nothing the scene can time says so. 2.3.0 stepped down on slow frames
  // alone, and that must still happen and must stay.
  {
    // Frame time follows the picture's size: 14 ms of scene and page at 1x, falling with the pixel count; callback 2 ms, timed draw 3 ms.
    const s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8, timeline: true}), r = fakeRenderer(s.clock, () => 3);
    const log = [], gov = s.G.governor(r, {key: "comp", draw() {}, detail: DETAIL(2, log)}), first = gov.pixelRatio();
    const frameMs = () => 6 + 9.5 * gov.pixelRatio() * gov.pixelRatio() - 3 * gov.detail();
    const play = async total => { const end = s.clock.t + total; while (s.clock.t < end) await run(s, gov, 1, frameMs(), 2); };
    assert.ok(frameMs() > 25, "starts well under 60 fps");
    await play(1300); assert.ok(gov.pixelRatio() < first, "slow for a second with an idle callback and a cheap timed draw: still a step down");
    await play(15000);
    assert.ok(frameMs() <= 20.5, `the steps went on until the frames held (${gov.pixelRatio()}x, detail ${gov.detail()}, ${frameMs().toFixed(1)} ms)`);
    const settled = [gov.pixelRatio(), gov.detail()];
    await play(1500); assert.deepEqual([gov.pixelRatio(), gov.detail()], settled, "and they stay: steps that bought frame time are not undone");
    assert.ok(!log.some(e => e[1] === "restore"));
    // Light on a 1x Chromebook: no pixel-ratio step exists. The heavy parts are the ladder, and they are probed the same way.
    const c = sandbox({timeline: true}), logC = [], gc = c.G.governor(fakeRenderer(c.clock, () => 3), {key: "comp1", draw() {}, detail: DETAIL(3, logC)});
    const msC = () => 24 - 3 * gc.detail(), playC = async total => { const end = c.clock.t + total; while (c.clock.t < end) await run(c, gc, 1, msC(), 2); };
    await playC(6000); assert.equal(gc.detail(), 2, "heavy parts step until the frames hold (18 ms), and stay");
    // The same device where nothing helps: the steps are undone, the heavy parts come back.
    const n = sandbox({timeline: true}), logN = [], gn = n.G.governor(fakeRenderer(n.clock, () => 3), {key: "comp0", draw() {}, detail: DETAIL(3, logN)});
    await run(n, gn, 8000, 24, 2); assert.equal(gn.detail(), 0); assert.equal(j(logN), j([[1, "slow"], [2, "slow"], [0, "restore"]]));
    ok("B9", "slow frames step down even when the scene does not look like the cost (2.3.0); steps that buy frame time stay, steps that buy nothing are undone");
  }
  // B7
  {
    // Chamber Men's order: governor first, calibrate after. High, slow warm-up.
    const log = [], s = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8}), r = fakeRenderer(s.clock, () => 20);
    const gov = s.G.governor(r, {key: "c", draw() {}, detail: DETAIL(2, log)});
    const after = await s.G.calibrate(r, () => {});
    assert.deepEqual([after.level, gov.level(), gov.name(), s.G.builtLevel(r)], [1, 2, "high", 2], "the next scene is Balanced; this one is still the High scene it was built as, and says so");
    assert.equal(j(log), j([[1, "start"]]), "and its heavy parts start one step down, behind the loading screen");
    assert.equal(gov.pixelRatio(), 1.25, "the pixel ratio follows the level calibrate moved to, as before");
    // Roulette's and the pack's order: calibrate first, governor after.
    const log2 = [], s2 = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8}), r2 = fakeRenderer(s2.clock, () => 20);
    await s2.G.calibrate(r2, () => {}); const g2 = s2.G.governor(r2, {key: "c2", draw() {}, detail: DETAIL(2, log2)});
    assert.deepEqual([g2.level(), j(log2), s2.G.profile().level], [2, j([[1, "start"]]), 1]);
    // Light has no level below: the heavy parts are the whole answer.
    const logL = [], l = sandbox(), rl = fakeRenderer(l.clock, () => 15), gl = l.G.governor(rl, {key: "l", draw() {}, detail: DETAIL(2, logL)});
    const al = await l.G.calibrate(rl, () => {}); assert.deepEqual([al.level, gl.level(), j(logL)], [0, 0, j([[1, "start"]])]);
    // A fast warm-up still lifts the level for what comes next (and this scene's pixel ratio); the scene stays as built.
    const f = sandbox({gpu: GTX, dpr: 2, memory: 16, cores: 8}), rf = fakeRenderer(f.clock, () => 2), gf = f.G.governor(rf, {key: "f", draw() {}, detail: DETAIL(2, [])});
    const af = await f.G.calibrate(rf, () => {}); assert.deepEqual([af.level, gf.level(), gf.detail(), gf.pixelRatio()], [3, 2, 0, 2]);
    // One page, season after season: Balanced found slow is not tried again (2.3.0 could go Light, Balanced, Light, ...).
    const page = sandbox(), levels = [];
    for (const cost of [2, 15, 2, 2]) { const rr = fakeRenderer(page.clock, () => cost); levels.push(page.G.profile().level); await page.G.calibrate(rr, () => {}); }
    levels.push(page.G.profile().level);
    assert.deepEqual(levels, [0, 1, 0, 0, 0], "Light, lifted to Balanced, Balanced slow, then Light for the rest of the page");
    // A scene in a frame marks its own page only.
    const parentDoc = {documentElement: {dataset: {gfx: "0", assets: "0"}}}, fr = sandbox({parent: {document: parentDoc, location: {search: ""}}});
    assert.equal(parentDoc.documentElement.dataset.gfx, "0");
    await fr.G.calibrate(fakeRenderer(fr.clock, () => 2), () => {});
    assert.deepEqual([fr.ctx.document.documentElement.dataset.gfx, parentDoc.documentElement.dataset.gfx], ["1", "0"], "the game page's html[data-gfx] keeps the game page's own level");
    // A level measured by the Device check is not moved by five frames, and a picked level never.
    const m = sandbox({storage: {"careerModeShowdown.gfxMeasured.v2": JSON.stringify({level: 1, at: Date.now()})}}), rm = fakeRenderer(m.clock, () => 20);
    const am = await m.G.calibrate(rm, () => {}); assert.deepEqual([am.level, am.calSlow], [1, undefined]);
    ok("B7", "calibrate: the scene stays the level it was built at; a slow warm-up starts its heavy parts a step down; no see-saw on one page; a frame marks its own page only");
  }
  // The module's own words stay true.
  {
    assert.ok(/detail:\{steps:N, apply\(step,why\)\}/.test(SRC) && /builtLevel:gfxBuiltLevel/.test(SRC), "the detail ladder and builtLevel are part of the module");
    const doc = fs.readFileSync(path.join(ROOT, "docs/QUALITY_LEVELS.md"), "utf8");
    assert.ok(/`detail: \{steps, apply\}`/.test(doc) && /Steps are taken between beats only/.test(doc) && !/it only moves the pixel ratio/.test(doc), "docs/QUALITY_LEVELS.md describes the ladder");
    ok("B8", "the module and docs/QUALITY_LEVELS.md describe the same governor");
  }
  console.log(`PASS r91 governor beats contracts (${checks} checks)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
