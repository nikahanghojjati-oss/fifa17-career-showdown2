"use strict";
// r91 Ultra/8K gate (js/gfxTier.js, js/settings.js). The device lab found Settings offering Ultra (4K) and 8K on a 2-thread
// 4 GB Chromebook. Nik, 2026-11-12: on a weak device those two appear only after the Device check has passed them there;
// stronger devices keep the full list. The devices are the lab's own (tests/browser/device-lab.cjs PROFILES).
//   W1 weak means 2 processor threads or fewer, or 4 GB or less, as the browser reports them
//   W2 a weak device with no passed check is offered Auto to Extra, and is told which levels wait for the check
//   W3 the Device check passing Ultra (or 8K) there brings it into the list; forgetting the result takes it out again
//   W4 every other device is offered what it was offered before
//   W5 a pick saved earlier that the device may not pick now draws the highest level it may; Auto and the Device check's
//      own frames are never gated
//   W6 Settings hides the two rows and says why; the docs say the same
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {PROFILES, deviceOf} = require("../support/device-lab-profiles.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SRC = read("js/gfxTier.js");
const PICK = "careerModeShowdown.gfxQuality.v1", MEASURED = "careerModeShowdown.gfxMeasured.v2";
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

function page(device, storage = {}, search = "") {
  const store = {...storage}, clock = {t: 0};
  const doc = {visibilityState: "visible", addEventListener() {},
    createElement: tag => tag === "canvas" ? {getContext: () => ({RENDERER: 7937, MAX_RENDERBUFFER_SIZE: 34024, MAX_TEXTURE_SIZE: 3379,
      getExtension: n => n === "WEBGL_debug_renderer_info" ? {UNMASKED_RENDERER_WEBGL: 37446} : {loseContext() {}},
      getParameter: k => k === 37446 || k === 7937 ? device.gpu : k === 34024 ? device.maxBuffer : k === 3379 ? device.maxTexture : 16384})} : {style: {}, setAttribute() {}, append() {}, remove() {}},
    body: {append() {}}, documentElement: {dataset: {}}};
  const ctx = {document: doc, devicePixelRatio: device.dpr, navigator: {...(device.memory == null ? {} : {deviceMemory: device.memory}), hardwareConcurrency: device.cores},
    screen: {width: device.screen[0], height: device.screen[1]}, innerWidth: device.view[0], innerHeight: device.view[1],
    location: {search, pathname: "/index.html", origin: "http://x"}, readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; },
    performance: {now: () => clock.t}, setTimeout: f => { f(); return 0; }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {}, URLSearchParams};
  ctx.globalThis = ctx; ctx.parent = ctx; ctx.top = ctx;
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return {G: ctx.CareerModeGfxTier, store};
}
const measured = level => ({[MEASURED]: JSON.stringify({level, at: Date.now()})});
const offered = G => Array.from(G.choices).filter(c => G.offers(c));
const ALL = ["auto", "light", "medium", "high", "extra", "ultra", "8k"], TO_EXTRA = ALL.slice(0, 5);
const chromebook = deviceOf("chromebook866"), strong = deviceOf("pc4k");

// W1
{
  const weak = Object.fromEntries(Object.keys(PROFILES).map(k => [k, !page(deviceOf(k)).G.offers("ultra")]));
  assert.deepEqual(weak, {iphone17: false, chromebook866: true, chromebook1035: true, pc4k: false, pc8k: false}, "of the lab's devices, the Chromebook (2 threads, 4 GB) is the weak one");
  const at = (cores, memory) => offered(page({...strong, cores, memory}).G).includes("ultra");
  assert.deepEqual([at(2, 8), at(1, 16), at(4, 4), at(8, 2), at(16, 4)], [false, false, false, false, false], "2 threads or fewer, or 4 GB or less: weak");
  assert.deepEqual([at(4, 8), at(8, 8), at(3, 8)], [true, true, true], "more than 2 threads and more than 4 GB: not weak");
  // A browser that reports no memory (Safari, Firefox) is judged by its threads; one that reports neither is not held back.
  assert.deepEqual([at(8, null), at(4, null), at(2, null)], [true, true, false]);
  assert.equal(offered(page({...strong, cores: undefined, memory: null}).G).includes("ultra"), true);
  assert.match(SRC, /return \(Number\.isFinite\(c\)&&c>0&&c<=2\)\|\|\(Number\.isFinite\(m\)&&m>0&&m<=4\);/);
  ok("W1", "weak means 2 processor threads or fewer, or 4 GB or less, as the browser reports them");
}
// W2
{
  for (const key of ["chromebook866", "chromebook1035"]) {
    const {G} = page(deviceOf(key));
    assert.equal(G.can8k(), true, "the lab's Chromebook reports a 16384 px buffer, which is why 2.3.0 offered it 8K");
    assert.deepEqual(offered(G), TO_EXTRA, `${key}: Auto to Extra`);
    assert.deepEqual([...G.needsCheck()], ["Ultra (4K)", "8K"]);
  }
  // A check that held less than Ultra changes nothing; a GPU that cannot hold 8K is only told about Ultra.
  for (const level of [0, 1, 2, 3]) assert.deepEqual(offered(page(chromebook, measured(level)).G), TO_EXTRA, `measured ${level}`);
  assert.deepEqual([...page({...chromebook, maxBuffer: 4096, maxTexture: 4096}).G.needsCheck()], ["Ultra (4K)"]);
  ok("W2", "a weak device with no passed check is offered Auto to Extra, and is told which levels wait for the check");
}
// W3
{
  const u = page(chromebook, measured(4));
  assert.deepEqual(offered(u.G), [...TO_EXTRA, "ultra"]); assert.deepEqual([...u.G.needsCheck()], ["8K"]);
  const k = page(chromebook, measured(5));
  assert.deepEqual(offered(k.G), ALL); assert.deepEqual([...k.G.needsCheck()], []);
  // The check itself saves it (setMeasured), and Forget result takes it away again.
  const live = page(chromebook); assert.equal(live.G.offers("ultra"), false);
  live.G.setMeasured(4, {}); assert.equal(live.G.offers("ultra"), true); assert.equal(live.G.offers("8k"), false);
  live.G.clearMeasured(); assert.equal(live.G.offers("ultra"), false);
  ok("W3", "the Device check passing Ultra (or 8K) on a weak device brings it into the list; forgetting the result takes it out again");
}
// W4
{
  for (const key of ["pc4k", "pc8k"]) { const {G} = page(deviceOf(key)); assert.deepEqual(offered(G), ALL, key); assert.deepEqual([...G.needsCheck()], []); }
  // The iPhone: Ultra as before, never 8K (a phone), nothing waiting on a check.
  const phone = page(deviceOf("iphone17")).G; assert.deepEqual(offered(phone), [...TO_EXTRA, "ultra"]); assert.deepEqual([...phone.needsCheck()], []);
  // A strong PC whose GPU cannot hold 8K: Ultra, no 8K, as before.
  const mid = page({...strong, maxBuffer: 4096, maxTexture: 4096}).G; assert.deepEqual(offered(mid), [...TO_EXTRA, "ultra"]); assert.deepEqual([...mid.needsCheck()], []);
  assert.equal(page(strong).G.offers("nonsense"), false);
  ok("W4", "every other device is offered what it was offered before");
}
// W5
{
  const draw = (storage, search) => { const p = page(chromebook, storage, search).G.profile(); return [p.level, p.gated, p.choice]; };
  assert.deepEqual(draw({[PICK]: "ultra"}), [3, 4, "ultra"], "Ultra saved before the gate: Extra is drawn, the pick stays saved");
  assert.deepEqual(draw({[PICK]: "8k"}), [3, 5, "8k"]);
  assert.deepEqual(draw({[PICK]: "8k", ...measured(4)}), [4, 5, "8k"], "8K saved, the check passed Ultra: Ultra is drawn");
  assert.deepEqual(draw({[PICK]: "ultra", ...measured(4)}), [4, null, "ultra"], "passed: drawn as picked");
  assert.deepEqual(draw({[PICK]: "8k", ...measured(5)}), [5, null, "8k"]);
  for (const c of ["light", "medium", "high", "extra"]) assert.equal(draw({[PICK]: c})[1], null, c);
  // Auto draws what the check measured, on any device. The Device check's own frames (?gfx=N&bench=1) are never gated:
  // that is how a weak device passes.
  assert.deepEqual(draw(measured(4)).slice(0, 2), [4, null]); assert.deepEqual(draw({}).slice(0, 2), [0, null]);
  assert.deepEqual(draw({}, "?gfx=4&bench=1").slice(0, 2), [4, null]); assert.deepEqual(draw({}, "?gfx=5&bench=1").slice(0, 2), [5, null]);
  // A strong device is never gated; 8K picked where the GPU cannot hold it draws Ultra as it always did (not the gate).
  const s = page(strong, {[PICK]: "8k"}).G.profile(); assert.deepEqual([s.level, s.gated], [5, null]);
  const m = page({...strong, maxBuffer: 4096, maxTexture: 4096}, {[PICK]: "8k"}).G.profile(); assert.deepEqual([m.level, m.gated], [4, null]);
  ok("W5", "a pick saved earlier that the device may not pick now draws the highest level it may; Auto and the Device check's frames are never gated");
}
// W6
{
  const settings = read("js/settings.js"), docs = read("docs/QUALITY_LEVELS.md");
  assert.ok(settings.includes('if((value === "ultra" || value === "8k") && tier.offers && !tier.offers(value) && tier.choice() !== value){ return; }'), "Settings leaves the two rows out (a saved pick stays listed)");
  assert.ok(settings.includes('return ` ${held.join(" and ")} ${held.length > 1 ? "need" : "needs"} a passed Device check.${drawn}`;'));
  assert.ok(settings.includes("const drawn = p && Number.isInteger(p.gated) ? ` ${tier.label(p.level)} is drawn until then.` : \"\";"));
  assert.equal((settings.match(/getSettingsGfxCheckText\(tier\)\}/g) || []).length, 2, "the sentence follows the Auto line in both of its forms (Auto on; a level picked)");
  // The longer line must not squeeze MENU CLICK FEEDBACK on the shared desktop line (seen at 1920x1035): the row shrinks,
  // its words wrap, and it never takes more than 58% of the line.
  const css = read("css/r78-type.css");
  assert.ok(css.includes("> .settingsPanel--motion > .settingsGfxRow { flex: 0 1 auto; max-width: 58%; margin-top: auto; gap: 12px; }"));
  assert.ok(css.includes("> .settingsPanel--motion > .settingsGfxRow .settingsAudioCopy { flex: 1 1 auto; min-width: 0; gap: 1px; }"));
  assert.match(docs, /2 processor threads or fewer, or 4 GB of memory or less/);
  assert.match(docs, /only once the Device check has passed/);
  ok("W6", "Settings hides the two rows and says why; docs/QUALITY_LEVELS.md says the same");
}
console.log(`PASS r91 gfx weak-device gate contracts (${checks} checks)`);
