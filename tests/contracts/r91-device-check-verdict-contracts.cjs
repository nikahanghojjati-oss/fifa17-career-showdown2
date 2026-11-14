"use strict";
// r91 Device check verdicts (Sol 6.1 review of 2.3.0; Nik 2026-11-11: "auto check of device seems completely broken",
// and "Auto should allow all qualities based on device real test ... from light to 8k").
// In 2.3.0 the check ignored a scene that errored and never compared the level drawn with the level asked, so a Chamber
// Men failure plus a smooth Roulette saved Ultra, and Light results returned for every level also saved Ultra. The page's
// own script runs here (device-check.html, in a sandbox with the real js/gfxTier.js) against scripted scene frames:
//   V1 all three 3D screens are timed (Chamber Men, Russian Roulette, the Special Player pack), each level forced, in order
//   V2 a clean run saves the top level: Ultra on a GPU without an 8K buffer, 8K where it has one (never asked otherwise)
//   V3 Sol's first false pass: a screen that does not start leaves the level not verified; nothing is saved
//   V4 Sol's second false pass: a level drawn that is not the level asked is not verified; nothing is saved
//   V5 a screen that is not smooth settles its level: the level below is saved and nothing above is tried
//   V6 no answer, an answer that never finishes, a beat not played, the lighter stand-in files, an older screen's answer:
//      all not verified
//   V7 the GPU giving up at a level (a lost context, a refused 8K buffer) is as final as slow; at Light it proves nothing
//   V8 an unfinished check keeps the last good result and says so; a hidden tab stops the check
//   V9 what is saved: level, the three scenes, and per level what was drawn (frame rate, pixel ratio, buffer size)
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const PAGE = fs.readFileSync(path.join(ROOT, "device-check.html"), "utf8");
const TIER = fs.readFileSync(path.join(ROOT, "js/gfxTier.js"), "utf8");
const SCRIPT = /<script>\n([\s\S]*?)<\/script>\s*<\/body>/.exec(PAGE)[1];
const KEY = "careerModeShowdown.gfxMeasured.v2";
const LABELS = ["Light", "Balanced", "High", "Extra", "Ultra (4K)", "8K"];
const SCENES = ["chamber-men", "rrr", "sp"];
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

// A clean answer for (scene, level): the level asked, drawn, a whole beat, a full-size buffer, smooth frames.
const good = (scene, level, more) => ({type: "cms-gfx-bench", phase: "result", scene, asked: level, level, name: "x", label: LABELS[level], pixelRatio: 1, css: [1920, 866], size: [1920, 866],
  bufferOk: true, beats: 1, complete: true, failed: null, software: false, gpu: "test", frames: 630, avg: 59.9, p1low: 55.2, ms: 16.7, drawMs: 3.1, ...(more || {})});
const started = (scene, level) => ({type: "cms-gfx-bench", phase: "started", scene, asked: level, level});

// One run of the page. answer(scene, level) returns: a list of messages to post, "silent" (no answer at all), or
// "hang" (started, then nothing). Options: gpu8k, storage, hideAt ([scene, level]: the tab is hidden while that frame loads).
async function run(answer, opts){
  const o = opts || {}, store = {...(o.storage || {})}, asked = [];
  const els = {};
  const el = id => els[id] || (els[id] = {id, textContent: "", innerHTML: "", hidden: false, disabled: false, listeners: {},
    classList: {add(){}, remove(){}}, addEventListener(type, f){ this.listeners[type] = f; }, replaceChildren(){}, setAttribute(){}});
  const messageListeners = new Set(), docListeners = {};
  const timers = new Map(); let timerId = 0;
  const gpu = "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)", big = o.gpu8k ? 16384 : 4096;
  const deliver = (frame, data, source, origin) => { for(const f of [...messageListeners]) f({origin: origin || "https://game.test", source: source || frame.contentWindow, data}); };
  const doc = {
    visibilityState: "visible",
    getElementById: el,
    addEventListener(type, f){ docListeners[type] = f; },
    documentElement: {dataset: {}},
    createElement(tag){
      if(tag === "canvas") return {getContext: () => ({RENDERER: 7937, MAX_RENDERBUFFER_SIZE: 34024, MAX_TEXTURE_SIZE: 3379,
        getExtension: n => n === "WEBGL_debug_renderer_info" ? {UNMASKED_RENDERER_WEBGL: 37446} : {loseContext(){}},
        getParameter: k => k === 37446 || k === 7937 ? gpu : k === 34024 || k === 3379 ? big : null})};
      if(tag !== "iframe") return {className: "", textContent: "", setAttribute(){}};
      const frame = {title: "", contentWindow: {}, removed: false, setAttribute(){}, remove(){ this.removed = true; }};
      Object.defineProperty(frame, "src", {set(url){
        const m = /^(.+?)\?gfx=(\d)&bench=1$/.exec(url); assert.ok(m, `the frame is asked for one level in bench mode (${url})`);
        const scene = {"device-check-chamber.html": "chamber-men", "visual-assets/v10_1/roulette/index.html": "rrr", "visual-assets/v10_1/special-player/index.html": "sp"}[m[1]];
        assert.ok(scene, `a known 3D screen (${m[1]})`);
        const level = Number(m[2]); asked.push(`${scene}@${level}`);
        setImmediate(() => {
          if(o.hideAt && o.hideAt[0] === scene && o.hideAt[1] === level){ doc.visibilityState = "hidden"; docListeners.visibilitychange(); return; }
          // Noise that must never count: another window's message, another origin's, another scene's.
          deliver(frame, good(scene, level), {});
          deliver(frame, good(scene, level), null, "https://elsewhere.test");
          deliver(frame, good(scene === "sp" ? "rrr" : "sp", level));
          const a = answer(scene, level);
          const fire = () => { const last = [...timers.keys()].pop(); const f = timers.get(last); timers.delete(last); f(); };
          if(a === "silent"){ fire(); return; }
          if(a === "hang"){ deliver(frame, started(scene, level)); fire(); return; }
          for(const message of a) deliver(frame, message);
        });
      }});
      return frame;
    }
  };
  const sandbox = {document: doc, location: {origin: "https://game.test", search: ""}, navigator: {deviceMemory: 32, hardwareConcurrency: 16}, screen: {width: 1920, height: 1080}, devicePixelRatio: 1,
    readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; },
    performance: {now: () => 0}, URLSearchParams, CustomEvent: function(type, init){ this.type = type; this.detail = init && init.detail; }, dispatchEvent(){},
    addEventListener(type, f){ if(type === "message") messageListeners.add(f); }, removeEventListener(type, f){ if(type === "message") messageListeners.delete(f); },
    setTimeout(f){ timerId += 1; timers.set(timerId, f); return timerId; }, clearTimeout(id){ timers.delete(id); },
    requestAnimationFrame: () => 1, cancelAnimationFrame(){}, requestIdleCallback: () => 1, Date, Math, JSON, Object, Promise, Number, String, Boolean, Array, isFinite};
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.parent = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(TIER, sandbox, {filename: "js/gfxTier.js"});
  vm.runInContext(SCRIPT, sandbox, {filename: "device-check.html"});
  const before = store[KEY] || null;
  await el("start").listeners.click();
  const saved = store[KEY] && store[KEY] !== "null" ? JSON.parse(store[KEY]) : null;
  return {asked, saved, changed: (store[KEY] || null) !== before, status: el("status").textContent, result: el("result").innerHTML, rows: el("rows").innerHTML, store, tier: sandbox.CareerModeGfxTier};
}
const allGood = (scene, level) => [started(scene, level), good(scene, level)];
const order = top => Array.from({length: top + 1}, (_, level) => SCENES.map(s => `${s}@${level}`)).flat();

(async () => {
  // V1 + V2
  {
    const r = await run(allGood);
    assert.deepEqual(r.asked, order(4), "Chamber Men, Russian Roulette and the Special Player pack, each level from Light to Ultra, lightest first");
    assert.equal(r.saved.level, 4, "all three smooth at every level: Auto is Ultra (4K) (Nik 2026-11-11)");
    assert.match(r.status, /Every level up to Ultra \(4K\) was smooth/);
    assert.match(r.result, /Auto here: Ultra \(4K\)/);
    assert.equal(r.tier.profile().level, 4, "Auto plays the measured level");
    assert.ok(!r.asked.some(a => a.endsWith("@5")), "8K is never asked of a GPU without a 7680 px buffer");
    ok("V1", "all three 3D screens are timed at each level, lightest first, each level forced in bench mode");
    const k = await run(allGood, {gpu8k: true});
    assert.deepEqual(k.asked, order(5)); assert.equal(k.saved.level, 5, "a GPU with an 8K buffer that holds 8K in all three gets 8K on Auto");
    assert.equal(k.tier.profile().level, 5);
    // A crash cap from play outlives the check, finished or not (review on #1389): the frames ignore it while timed, the
    // result is saved, and Auto draws the lower of the two until the cap ends by its own rules. The page says so.
    const CAP = "careerModeShowdown.gfxCap.v1", cap = JSON.stringify({level: 1, reason: "the GPU ran out of memory", at: Date.now(), clean: 0});
    const capped = await run(allGood, {storage: {[CAP]: cap}});
    assert.deepEqual(capped.asked, order(4), "the check still plays every level");
    assert.equal(capped.saved.level, 4); assert.equal(capped.store[CAP], cap, "a finished check leaves the cap alone");
    assert.equal(capped.tier.profile().level, 1, "play stays at the capped level");
    assert.match(capped.result, /Auto here: Ultra \(4K\)/); assert.match(capped.result, /draws Balanced for now/);
    const kept = await run((scene, level) => level === 1 ? "silent" : allGood(scene, level), {storage: {[CAP]: cap}});
    assert.equal(kept.store[CAP], cap, "an unfinished check leaves the cap alone");
    ok("V2", "a clean run saves the top level: Ultra (4K), or 8K where the GPU has the buffer (never asked otherwise)");
  }
  // V3: Sol's first false pass. Chamber Men never starts; Roulette and the pack are smooth at every level.
  {
    const noChamber = (scene, level) => scene === "chamber-men" ? [{type: "cms-gfx-bench", phase: "result", scene, error: "The 3D scene did not start on this device (no WebGL2, or it loaded too slowly)."}] : allGood(scene, level);
    const r = await run(noChamber);
    assert.equal(r.saved, null, "2.3.0 saved Ultra here; a screen that never ran proves no level");
    assert.deepEqual(r.asked, ["chamber-men@0"], "the level is settled as not verified; nothing else is played for it or above it");
    assert.match(r.status, /Check not finished: Chamber Men at Light was not verified\. The 3D scene did not start/);
    assert.match(r.result, /No result saved/);
    assert.match(r.rows, /not verified/);
    ok("V3", "Sol's first false pass: a screen that does not start leaves the level not verified and nothing is saved");
  }
  // V4: Sol's second false pass. Every frame answers with a Light picture, whatever was asked.
  {
    const alwaysLight = (scene, level) => [started(scene, level), good(scene, level, {level: 0, label: "Light"})];
    const r = await run(alwaysLight);
    assert.equal(r.saved, null, "2.3.0 saved Ultra here; a Light picture says nothing about Balanced");
    assert.deepEqual(r.asked, [...order(0), "chamber-men@1"]);
    assert.match(r.status, /Chamber Men at Balanced was not verified\. It drew Light, not Balanced\./);
    assert.match(r.result, /nothing changed\. Light was smooth\./);
    // The same when the frame does not say what it was asked for (a screen from an older copy of the game).
    const old = await run((scene, level) => { const g = good(scene, level); delete g.asked; delete g.phase; delete g.beats; delete g.complete; return [g]; });
    assert.equal(old.saved, null); assert.match(old.status, /did not confirm the level it was asked for/);
    // A browser that gave a smaller picture than the level asks for.
    const small = await run((scene, level) => level === 2 ? [good(scene, level, {bufferOk: false})] : allGood(scene, level));
    assert.equal(small.saved, null); assert.match(small.status, /Chamber Men at High was not verified\. The browser gave a smaller picture/);
    ok("V4", "Sol's second false pass: a level drawn that is not the level asked (or not confirmed, or a smaller buffer) is not verified");
  }
  // V5
  {
    const spSlowAtHigh = (scene, level) => scene === "sp" && level === 2 ? [started(scene, level), good(scene, level, {avg: 48.3, p1low: 31})] : allGood(scene, level);
    const r = await run(spSlowAtHigh);
    assert.equal(r.saved.level, 1, "one screen not smooth at High: Auto is Balanced");
    assert.deepEqual(r.asked, [...order(2), "sp@2"], "nothing above the first level that is not smooth is tried (r92: the slow screen gets one second try)");
    assert.match(r.status, /High was not held: Special Player was not smooth there/);
    assert.deepEqual(r.saved.detail.stop, {level: 2, scene: "sp", state: "slow"});
    // The 1% low alone can fail a level; the first screen that is slow ends that level at once.
    const lows = await run((scene, level) => scene === "chamber-men" && level === 1 ? [good(scene, level, {avg: 59.5, p1low: 38})] : allGood(scene, level));
    assert.equal(lows.saved.level, 0); assert.deepEqual(lows.asked, [...order(0), "chamber-men@1", "chamber-men@1"]);
    // Even Light not smooth: r92 (Nik's iPhone 17) saves nothing; tests/contracts/r92-device-check-retry-contracts.cjs.
    const weak = await run((scene, level) => [good(scene, level, {avg: 24, p1low: 11})]);
    assert.equal(weak.saved, null); assert.deepEqual(weak.asked, ["chamber-men@0", "chamber-men@0"]);
    assert.match(weak.status, /Light was not smooth on Chamber Men here, so Auto keeps /);
    // Too slow to finish its beat in the time allowed: the frames it did draw settle it (never "not verified" for ever).
    const crawl = await run((scene, level) => level === 1 && scene === "rrr" ? [good(scene, level, {avg: 0.8, p1low: 0.3, beats: 0, complete: false})] : allGood(scene, level));
    assert.equal(crawl.saved.level, 0, "a turn too slow to finish is slow");
    ok("V5", "a screen that is not smooth settles its level: the level below is saved, nothing above is tried; even-Light-slow saves nothing (r92)");
  }
  // V6
  {
    for(const [name, bad, text] of [
      ["no answer at all", () => "silent", /It did not start in 3 minutes/],
      ["started, never finished", () => "hang", /The turn did not finish in 2 minutes/],
      ["smooth frames but the beat was not played", (scene, level) => [started(scene, level), good(scene, level, {beats: 0, complete: false})], /The turn did not finish in time/],
      ["the lighter stand-in files", (scene, level) => [good(scene, level, {info: {lite: true}})], /lighter stand-in files/],
      ["no frames", (scene, level) => [good(scene, level, {frames: 0, avg: 0, p1low: 0})], /No frames were timed/]
    ]){
      const r = await run((scene, level) => scene === "rrr" && level === 1 ? bad(scene, level) : allGood(scene, level));
      assert.equal(r.saved, null, `${name}: nothing saved`);
      assert.deepEqual(r.asked, [...order(0), "chamber-men@1", "rrr@1"], `${name}: the climb stops there`);
      assert.match(r.status, /Check not finished: Russian Roulette at Balanced was not verified/); assert.match(r.status, text, name);
    }
    ok("V6", "no answer, an answer that never finishes, a beat not played, stand-in files, no frames: all not verified, nothing saved");
  }
  // V7
  {
    const lostAtExtra = (scene, level) => scene === "rrr" && level === 3 ? [started(scene, level), good(scene, level, {level: 2, failed: "the GPU dropped the picture (context lost)", complete: false})] : allGood(scene, level);
    const r = await run(lostAtExtra);
    assert.equal(r.saved.level, 2, "the GPU gave up at Extra: Auto is High");
    assert.match(r.status, /Extra was not held: Russian Roulette failed there/);
    const lostAtLight = await run((scene, level) => [good(scene, level, {failed: "the GPU dropped the picture (context lost)", complete: false})]);
    assert.equal(lostAtLight.saved, null, "at Light there is no level below to fall to: not verified");
    const no8k = await run((scene, level) => level === 5 ? [started(scene, level), good(scene, level, {level: 4, bufferOk: false, failed: "the browser capped the 8K buffer", complete: false})] : allGood(scene, level), {gpu8k: true});
    assert.equal(no8k.saved.level, 4, "an 8K buffer the browser would not give: Auto is Ultra, the run still counts");
    ok("V7", "the GPU giving up at a level is as final as slow (a refused 8K buffer leaves Ultra); at Light it proves nothing");
  }
  // V8
  {
    const before = JSON.stringify({level: 2, at: 1700000000000, detail: {scenes: SCENES}});
    const r = await run((scene, level) => scene === "sp" && level === 1 ? "silent" : allGood(scene, level), {storage: {[KEY]: before}});
    assert.equal(r.changed, false, "an unfinished check changes nothing");
    assert.equal(r.saved.level, 2); assert.match(r.result, /Auto here: High/); assert.match(r.result, /The check did not finish, so nothing changed\. Light was smooth\./);
    const two = await run((scene, level) => scene === "sp" && level === 2 ? "silent" : allGood(scene, level));
    assert.match(two.result, /Balanced and below were smooth\./);
    const hidden = await run(allGood, {storage: {[KEY]: before}, hideAt: ["rrr", 1]});
    assert.equal(hidden.changed, false); assert.match(hidden.status, /The tab was hidden, so the check stopped/);
    assert.deepEqual(hidden.asked, [...order(0), "chamber-men@1", "rrr@1"]);
    // A finished check does replace it, down as well as up.
    const lower = await run((scene, level) => level === 1 ? [good(scene, level, {avg: 40, p1low: 20})] : allGood(scene, level), {storage: {[KEY]: before}});
    assert.equal(lower.saved.level, 0);
    // A 2.3.0 result (the old key) is never read: it came from the check that could save a level a scene never drew.
    const stale = await run(() => "silent", {storage: {"careerModeShowdown.gfxMeasured.v1": JSON.stringify({level: 4, at: 1})}});
    assert.equal(stale.tier.measured(), null); assert.ok(stale.tier.profile().level < 4, "Auto is back on its guess");
    ok("V8", "an unfinished or hidden check keeps the last good result and says so; a finished one replaces it; a 2.3.0 result is not read");
  }
  // V9
  {
    const r = await run((scene, level) => level === 3 && scene === "chamber-men" ? [good(scene, level, {avg: 51, p1low: 40, pixelRatio: 2, size: [3840, 1732]})] : [good(scene, level, {pixelRatio: level >= 2 ? 1.5 : 1, size: level >= 2 ? [2880, 1299] : [1920, 866]})]);
    assert.equal(r.saved.level, 2);
    assert.deepEqual(r.saved.detail.scenes, SCENES);
    assert.equal(r.saved.detail.held, true);
    assert.deepEqual(r.saved.detail.levels[2], {"chamber-men": [59.9, 55.2, 1.5, 2880, 1299], rrr: [59.9, 55.2, 1.5, 2880, 1299], sp: [59.9, 55.2, 1.5, 2880, 1299]});
    assert.deepEqual(r.saved.detail.levels[3], {"chamber-men": [51, 40, 2, 3840, 1732], rrr: null, sp: null}, "the level that was not held keeps its number; screens not played stay empty");
    assert.match(r.rows, /2880×1299 · ×1\.50/, "the table shows the buffer size and pixel ratio each level really drew");
    assert.match(r.rows, /not tried/);
    ok("V9", "saved: the level, the three scenes, and per level the frame rate, pixel ratio and buffer size each screen drew");
  }
  // The page itself.
  {
    const scripts = [...PAGE.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(scripts, ["js/storage.js", "js/gfxTier.js"], "the Device check loads only storage and the quality module");
    assert.ok(PAGE.includes("const SMOOTH_AVG=57,SMOOTH_LOW=45;"), "the 60 fps rule");
    assert.ok(/<th scope="col">Chamber Men<\/th><th scope="col">Russian Roulette<\/th><th scope="col">Special Player<\/th><th scope="col">Result<\/th>/.test(PAGE), "one column per 3D screen");
    assert.ok(!/font-size:\s*(?:[0-9]|1[01])px/.test(PAGE), "no text under 12 px");
    ok("V10", "the page: two scripts, the 60 fps rule, one column per 3D screen, 12 px floor");
  }
  // V11 (review on #1389): the timed frames play the whole beat under Reduce Motion too. It is a measurement of the
  // level, not the player's view: a cut reveal held and settled in one tick (no beat ever timed), a still Chamber Men
  // scene drew too few frames.
  {
    const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
    const sp = read("visual-assets/v10_1/special-player/index.html"), rr = read("visual-assets/v10_1/roulette/index.html"), cm = read("js/chamberMenScene3d.js");
    assert.match(sp, /const REDUCED = matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches && new URLSearchParams\(location\.search\)\.get\("bench"\)!=="1";/);
    assert.match(rr, /const REDUCED=matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches&&new URLSearchParams\(location\.search\)\.get\("bench"\)!=="1";/);
    assert.equal((sp.match(/prefers-reduced-motion: reduce\)"\)\.matches/g) || []).length, 1, "the pack reads the setting once");
    assert.equal((rr.match(/prefers-reduced-motion: reduce\)"\)\.matches/g) || []).length, 1, "Roulette reads the setting once");
    assert.match(cm, /let benchMount=false;\n  function reducedMotion\(\)\{if\(benchMount\)return false;/);
    assert.match(cm, /benchMount=Boolean\(opts&&opts\.fullFiles\);/);
    assert.equal((cm.match(/prefers-reduced-motion/g) || []).length, 1, "Chamber Men reads the setting in one place");
    ok("V11", "under Reduce Motion the timed frames still play the whole kick, turn and reveal; the game's own screens keep the setting");
  }
  // V12: a level that closed the tab while a 3D screen was opening (js/gfxTier.js tabCrash, from play or from an earlier
  // check) is not opened again while its cap lasts. It counts as failed: Auto is the level below, and the page says why.
  {
    const CAP = "careerModeShowdown.gfxCap.v1";
    const tabCap = JSON.stringify({level: 3, reason: "the tab closed while this 3D screen was opening", tab: true, from: 4, scene: "roulette/index.html", bench: false, at: Date.now()});
    const r = await run(allGood, {storage: {[CAP]: tabCap}});
    assert.deepEqual(r.asked, order(3), "no frame is opened at Ultra");
    assert.equal(r.saved.level, 3); assert.deepEqual(r.saved.detail.stop, {level: 4, scene: "chamber-men", state: "failed"});
    assert.match(r.status, /Ultra \(4K\) was not tried: the tab closed at that level last time\./);
    assert.match(r.rows, /The tab closed at this level last time, so it was not opened again\./);
    assert.equal(r.store[CAP], tabCap, "the cap stays");
    // On a GPU that could show 8K: 8K is not opened either (nothing above the first level that fails is tried).
    const k = await run(allGood, {gpu8k: true, storage: {[CAP]: tabCap}}); assert.deepEqual(k.asked, order(3)); assert.equal(k.saved.level, 3);
    // A cap from a graphics failure (not a dead tab) does not stop the check from playing the level: V2.
    ok("V12", "a level that closed the tab is not opened again by the check; it counts as failed and the page says why");
  }
  console.log(`PASS r91 device check verdict contracts (${checks} checks)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
