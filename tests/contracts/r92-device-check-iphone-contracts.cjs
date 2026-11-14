"use strict";
// r92-08 Device check: one hitch must not fail a level, and a Light failure must not lower Auto (Nik 2026-11-14 09:09 UTC,
// live 2.4.0 on his iPhone 17: Auto read High from the Apple GPU; after the check, "Even Light was not smooth here
// (Special Player), so Auto is set to Light, the lightest level").
// Causes at ac0a1338 (2.4.0): a screen is smooth when it averages 57 fps and its worst 1% of frames stays above 45 fps.
// Over a 10 s run the worst 1% is about 6 frames, so one stall of about 0.1 s (or three missed refreshes) fails it, with no
// second try; and a check where even Light was not smooth still saved Light, which replaced the High guess for good.
// The page's own script runs here (device-check.html, in a sandbox with the real js/gfxTier.js), as in
// tests/contracts/r91-device-check-verdict-contracts.cjs.
//   D1 a screen that is not smooth once and smooth on its second try holds the level (2.4.0: the level failed)
//   D2 not smooth twice settles the level as before; the table shows both tries
//   D3 even Light not smooth twice saves nothing: Auto keeps its guess (High for an Apple GPU phone) or the last good result,
//      and the page says so in plain words (2.4.0 saved Light)
//   D4 a 2.4.0 result that saved Light "not held" is not read: Auto goes back to its guess without FORGET RESULT
//   D5 failed and not-verified answers are not tried again; a second try with no clean answer leaves the first one standing
//   D6 every timed screen reports its slowest frame, when it came and how many frames were late, and the table shows it
//   D7 the 57 fps average stays; the page says a screen gets a second try
//   D8 Nik's run 4 (09:20 UTC): Special Player at Light, 60 fps average, GPU 2 ms, 1% low 44.3 (a few missed refreshes) is
//      smooth now; stutter is more than 2 frames in 100 late (over 25 ms) or one frame over 100 ms. An older frame's answer
//      without those counts keeps the 1% low rule.
//   D9 Nik's run 3: the Safari tab closed while Chamber Men was opening at High. On a phone the 3D scenes load the phone file
//      set at High and above (textureLevel at most 1): Chamber Men at High loaded about 427 MB of textures on the iPhone
//      profile (tests/browser/device-lab.cjs, cpu mode), 164 MB with this; Extra 579 -> 189 MB. The 2D plates (assetLevel)
//      and computers are unchanged
//   D10 every Device check screen hands its GPU memory back when its frame is removed (Chamber Men's bench frame and the
//      Special Player page did not; Roulette already did)
//   D11 a phone's Special Player card art stops at 2x (Extra on the iPhone 17 profile: card faces 170 -> 109 MB, the whole
//      screen 327 -> 266 MB); computers keep 2.5x at Extra and above
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
  const gpu = o.gpu || "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)", big = o.gpu8k ? 16384 : 4096;
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
  const sandbox = {document: doc, location: {origin: "https://game.test", search: ""}, navigator: o.phone ? {hardwareConcurrency: 4, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1", maxTouchPoints: 5} : {deviceMemory: 32, hardwareConcurrency: 16}, screen: o.phone ? {width: 393, height: 852} : {width: 1920, height: 1080}, devicePixelRatio: o.phone ? 3 : 1, innerWidth: o.phone ? 393 : 1920, innerHeight: o.phone ? 852 : 1080, matchMedia: q => ({matches: Boolean(o.phone) && /pointer:\s*coarse|hover:\s*none/.test(q), addEventListener(){}, removeEventListener(){}}),
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
// Answers that change from one try to the next: tries[`${scene}@${level}`] is a list, one answer per try.
const scripted = tries => { const seen = {}; return (scene, level) => { const k = `${scene}@${level}`, list = tries[k]; if(!list) return allGood(scene, level);
  const i = seen[k] || 0; seen[k] = i + 1; return list[Math.min(i, list.length - 1)]; }; };
const hitch = (scene, level) => [started(scene, level), good(scene, level, {avg: 59.6, p1low: 31.2, slowest: [184.2, 8.1], late: 1})];
const heavy = (scene, level) => [started(scene, level), good(scene, level, {avg: 41.5, p1low: 22.4, slowest: [61.3, 3.2], late: 94})];
const IPHONE = {gpu: "Apple GPU", phone: true};

(async () => {
  // D1
  {
    const r = await run(scripted({"sp@0": [hitch("sp", 0), allGood("sp", 0)]}));
    assert.deepEqual(r.asked, [...order(0).slice(0, 3), "sp@0", ...order(4).slice(3)], "the Special Player reveal at Light is played twice, then the climb goes on");
    assert.equal(r.saved.level, 4, "one hitch at Light no longer fails Light (2.4.0 saved Light here)");
    assert.equal(r.saved.detail.held, true);
    assert.match(r.rows, /Second try\. First try: 59\.6 fps, 1% low 31\.2, slowest frame 184\.2 ms at 8\.1 s\./, "the table shows the first try");
    const high = await run(scripted({"rrr@2": [hitch("rrr", 2), allGood("rrr", 2)]}));
    assert.equal(high.saved.level, 4, "the same at any level");
    ok("D1", "a screen that is not smooth once and smooth on its second try holds the level");
  }
  // D2
  {
    const r = await run(scripted({"sp@2": [hitch("sp", 2), heavy("sp", 2)]}));
    assert.deepEqual(r.asked, [...order(2), "sp@2"], "two tries, then nothing above is tried");
    assert.equal(r.saved.level, 1, "not smooth twice: the level below is saved");
    assert.deepEqual(r.saved.detail.stop, {level: 2, scene: "sp", state: "slow"});
    assert.deepEqual(r.saved.detail.levels[2].sp, [41.5, 22.4, 1, 1920, 866], "the second try is the one saved");
    assert.match(r.status, /Check done\. High was not held: Special Player was not smooth there\./);
    assert.match(r.rows, /41\.5 fps/); assert.match(r.rows, /Second try\. First try: 59\.6 fps/);
    ok("D2", "not smooth twice settles the level as before; the table shows both tries");
  }
  // D3
  {
    const phone = await run(scripted({"sp@0": [hitch("sp", 0), hitch("sp", 0)]}), IPHONE);
    assert.equal(phone.tier.device().guessLevel, 2, "an Apple GPU phone starts at High");
    assert.equal(phone.saved, null, "nothing is saved (2.4.0 saved Light, which replaced High)");
    assert.equal(phone.changed, false);
    assert.equal(phone.tier.measured(), null);
    assert.equal(phone.tier.suggested().level, 2, "Auto stays on High");
    assert.equal(phone.status, "Light was not smooth on Special Player here, so Auto keeps High. Check again later.");
    assert.match(phone.result, /No result saved<small>Nothing changed\. Auto uses its starting guess until a check finishes\./);
    assert.doesNotMatch(phone.status + phone.result, /n't|Even Light|is set to Light|lightest level/, "plain words, no contractions, no Light verdict");
    const before = JSON.stringify({level: 3, at: 1700000000000, detail: {scenes: SCENES, held: true}});
    const kept = await run(scripted({"chamber-men@0": [heavy("chamber-men", 0)]}), {storage: {[KEY]: before}});
    assert.equal(kept.changed, false, "a good earlier result stays");
    assert.equal(kept.saved.level, 3);
    assert.equal(kept.status, "Light was not smooth on Chamber Men here, so Auto keeps Extra. Check again later.");
    assert.match(kept.result, /Auto here: Extra<small>Nothing changed\. Measured /);
    ok("D3", "even Light not smooth twice saves nothing: Auto keeps its guess or the last good result, and the page says so");
  }
  // D4
  {
    const old = JSON.stringify({level: 0, at: 1763110000000, detail: {scenes: SCENES, held: false, stop: {level: 0, scene: "sp", state: "slow"}}});
    const r = await run(() => "silent", {...IPHONE, storage: {[KEY]: old}});
    assert.equal(r.tier.measured(), null, "the 2.4.0 'even Light was not smooth' result is not read");
    assert.equal(r.tier.suggested().level, 2, "Auto is back on High without FORGET RESULT");
    assert.equal(r.tier.profile().level, 2);
    const fine = JSON.stringify({level: 0, at: 1763110000000, detail: {scenes: SCENES, held: true}});
    const f = await run(() => "silent", {...IPHONE, storage: {[KEY]: fine}});
    assert.equal(f.tier.measured().level, 0, "a Light that was held is still read");
    ok("D4", "a 2.4.0 result that saved Light 'not held' is not read: Auto goes back to its guess");
  }
  // D5
  {
    const failed = await run(scripted({"rrr@3": [[started("rrr", 3), good("rrr", 3, {level: 2, failed: "the GPU dropped the picture (context lost)", complete: false})]]}));
    assert.equal(failed.asked.filter(a => a === "rrr@3").length, 1, "a GPU failure is not tried again");
    assert.equal(failed.saved.level, 2);
    const unverified = await run(scripted({"rrr@1": ["silent"]}));
    assert.equal(unverified.asked.filter(a => a === "rrr@1").length, 1, "no answer is not tried again");
    assert.equal(unverified.saved, null);
    const lost = await run(scripted({"chamber-men@1": [heavy("chamber-men", 1), "hang"]}));
    assert.deepEqual(lost.asked, [...order(0), "chamber-men@1", "chamber-men@1"]);
    assert.equal(lost.saved.level, 0, "the first, clean slow try still settles Balanced");
    assert.match(lost.rows, /The second try gave no clean answer: The kick did not finish in 2 minutes\./);
    ok("D5", "failed and not-verified answers are not tried again; a second try with no clean answer leaves the first one");
  }
  // D6
  {
    const stats = (await run(() => "silent")).tier.benchStats;
    const dts = Array.from({length: 600}, () => 16.7); dts[480] = 104.2;
    const ats = dts.map((_, i) => 500 + i * 16.7);
    const s = stats(dts, ats);
    assert.equal(s.p1low < 45, true, "one 0.1 s stall in 10 s fails the 1% low (the reason for the second try)");
    assert.deepEqual([...s.slowest], [104.2, 8.5]); assert.equal(s.late, 1);
    const three = dts.slice(); three[480] = 16.7; [100, 300, 500].forEach(i => { three[i] = 33.4; });
    assert.equal(stats(three, ats).p1low < 45, true, "three missed refreshes in 10 s fail it too"); assert.equal(stats(three, ats).late, 3);
    assert.equal(stats(dts).slowest, undefined, "without times, the old answer");
    const tier = fs.readFileSync(path.join(ROOT, "js/gfxTier.js"), "utf8");
    assert.match(tier, /dts\.push\(dt\);ats\.push\(t-start\);/, "each timed frame records when it ended");
    assert.match(tier, /\.\.\.gfxBenchStats\(dts,ats\)/, "the posted result carries the slowest frame");
    const r = await run((scene, level) => [started(scene, level), good(scene, level, {slowest: [21.4, 3.6], late: 0})]);
    assert.match(r.rows, /slowest frame 21\.4 ms at 3\.6 s · 0 late frames/);
    ok("D6", "every timed screen reports its slowest frame, when it came and how many frames were late; the table shows it");
  }
  // D7
  {
    assert.ok(PAGE.includes("const SMOOTH_AVG=57,SMOOTH_LOW=45;"), "57 fps average; 45 for the 1% low of an older frame's answer");
    assert.match(PAGE, /A screen that is not smooth is played once more before it counts, and the check stops at the first level that is still not smooth\./);
    ok("D7", "the 57 fps average stays and the page says a screen gets a second try");
  }
  // D8
  {
    const run4 = {"chamber-men": {avg: 60, p1low: 54.7, late: 0, slowest: [19.2, 4.1]}, rrr: {avg: 60, p1low: 51.4, late: 1, slowest: [27.5, 2.2]},
      sp: {avg: 60, p1low: 44.3, ms: 16.67, drawMs: 2, late: 3, slowest: [36.1, 0.9]}};
    const r = await run((scene, level) => level === 0 ? [started(scene, level), good(scene, level, {...run4[scene], frames: 600})] : allGood(scene, level), IPHONE);
    assert.deepEqual(r.asked, order(4), "Light holds on the first try and the climb goes on (2.4.0 stopped here and saved Light)");
    assert.equal(r.saved.level, 4);
    const many = await run((scene, level) => level === 1 && scene === "sp" ? [started(scene, level), good(scene, level, {avg: 58.2, p1low: 30, late: 13, slowest: [34, 5], frames: 600})] : allGood(scene, level));
    assert.equal(many.saved.level, 0, "13 late frames in 600 (over 2 in 100) is stutter, twice");
    assert.deepEqual(many.asked.filter(a => a === "sp@1"), ["sp@1", "sp@1"]);
    const freeze = await run((scene, level) => level === 2 && scene === "rrr" ? [started(scene, level), good(scene, level, {avg: 59.8, p1low: 41, late: 1, slowest: [130, 6.2], frames: 600})] : allGood(scene, level));
    assert.equal(freeze.saved.level, 1, "one frame over 100 ms is a freeze a player sees, twice");
    const avg = await run((scene, level) => level === 1 && scene === "rrr" ? [good(scene, level, {avg: 55, p1low: 50, late: 0, slowest: [20, 1], frames: 550})] : allGood(scene, level));
    assert.equal(avg.saved.level, 0, "the 57 fps average still decides");
    const older = await run((scene, level) => level === 1 && scene === "rrr" ? [good(scene, level, {avg: 59.5, p1low: 38})] : allGood(scene, level));
    assert.equal(older.saved.level, 0, "an answer without the new counts keeps the 1% low rule");
    assert.match(PAGE, /const SMOOTH_LATE=\.02,SMOOTH_STALL_MS=100;/);
    ok("D8", "Nik's run 4 Light numbers are smooth; stutter is >2% late frames or a frame over 100 ms; older answers keep the 1% low");
  }
  // D9
  {
    const t = (await run(() => "silent", IPHONE)).tier;
    for(const [choice, level, assets, tex] of [["light", 0, 0, 0], ["medium", 1, 0, 0], ["high", 2, 2, 1], ["extra", 3, 3, 1], ["ultra", 4, 4, 1]]){
      t.setChoice(choice); const p = t.profile();
      assert.equal(p.phone, true); assert.equal(p.level, level, choice);
      assert.equal(p.assetLevel, assets, `${choice}: the 2D plates keep their size`);
      assert.equal(p.textureLevel, tex, `${choice}: the 3D scenes load the phone file set at most`);
    }
    t.setChoice("auto"); assert.equal(t.profile().level, 2, "an iPhone's Auto is still High"); assert.equal(t.profile().textureLevel, 1);
    const d = (await run(() => "silent")).tier;
    for(const [choice, tex] of [["high", 2], ["extra", 3], ["ultra", 4]]){ d.setChoice(choice); assert.equal(d.profile().textureLevel, tex, `computer ${choice} unchanged`); }
    const cm = fs.readFileSync(path.join(ROOT, "js/chamberMenScene3d.js"), "utf8");
    assert.match(cm, /const q=\{\.\.\.p,assets:\(p\.textureLevel\?\?p\.level\)<=1\?"phone":"desktop"\};/, "Chamber Men picks its file set from textureLevel");
    assert.match(TIER, /PHONE_MAX_PR=3,PHONE_TEX_MAX=1;/);
    ok("D9", "a phone's 3D scenes load the phone file set at High and above; 2D plates and computers unchanged");
  }
  // D10
  {
    const bench = fs.readFileSync(path.join(ROOT, "device-check-chamber.html"), "utf8");
    assert.match(bench, /addEventListener\("pagehide",e=>\{if\(e\.persisted\)return;try\{api\.dispose\(\);\}catch\(_error\)\{\}\}\);/);
    const sp = fs.readFileSync(path.join(ROOT, "visual-assets/v10_1/special-player/index.html"), "utf8");
    assert.match(sp, /addEventListener\("pagehide",e=>\{ if\(e\.persisted\) return; try\{ if\(gov\) gov\.end\(\); renderer\.dispose\(\); renderer\.forceContextLoss\(\); \}catch\(_e\)\{\} \}\);/,
      "the governor ends before the context is let go, so the loss is never read as a crash");
    const rr = fs.readFileSync(path.join(ROOT, "visual-assets/v10_1/roulette/index.html"), "utf8");
    assert.match(rr, /addEventListener\("pagehide",e=>\{ if\(e\.persisted\)\{ cancelAnimationFrame\(rafId\); rafId=0; return; \} disposeAll\(\); \}\);/);
    const cm = fs.readFileSync(path.join(ROOT, "js/chamberMenScene3d.js"), "utf8");
    assert.match(cm, /gov\?\.end\(\);fps\?\.stop\(\);[\s\S]{0,900}renderer\.dispose\(\);try\{renderer\.forceContextLoss\(\);\}catch\(_error\)\{\}/, "Chamber Men's dispose ends its governor first");
    ok("D10", "each Device check screen hands its GPU memory back when its frame is removed");
  }
  // D11
  {
    const sp = fs.readFileSync(path.join(ROOT, "visual-assets/v10_1/special-player/index.html"), "utf8");
    const m = /GQ=\{[^}]*cardMax:(GL_LVL>=3&&!\(GP&&GP\.phone\)\?2\.5:2) \}/.exec(sp);
    assert.ok(m, "the card art cap depends on the level and on the phone");
    const cardMax = (GL_LVL, GP) => Function("GL_LVL", "GP", `return ${m[1]};`)(GL_LVL, GP);
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(l => cardMax(l, {phone: true})), [2, 2, 2, 2, 2, 2], "a phone: 2x at every level");
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(l => cardMax(l, {phone: false})), [2, 2, 2, 2.5, 2.5, 2.5], "a computer: as in 2.4.0");
    assert.match(sp, /const cardScale=|function cardScale\(\)\{ const px=H\*Math\.max\(\.5,bandTop-bandBot\)\/2\*\.9\*DPR; return Math\.max\(1,Math\.min\(GQ\.cardMax,/);
    const t = (await run(() => "silent", IPHONE)).tier; assert.equal(t.profile().phone, true, "the profile the page reads says phone");
    ok("D11", "a phone's Special Player card art stops at 2x; computers keep 2.5x at Extra and above");
  }
  console.log(`PASS r92 device check iPhone contracts (${checks} checks)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
