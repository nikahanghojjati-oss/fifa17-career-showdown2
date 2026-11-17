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
//   D12 the check only ever raises Auto (Nik 2026-11-14 09:48 UTC, "Go" on the simple plan): Auto is the higher of the check's
//      result and the chip's level. A result below the chip's level is not saved, an earlier one is let go, and one saved by
//      2.4.0 below it is not read; the page says so
//   D13 a phone never asks for more than 4 MSAA samples (Special Player's half-float target at Extra: ~146 -> ~78 MB)
//   D14 the phone memory budget runs in every release: tests/browser/phone-memory-budget.cjs measures each 3D screen at High
//      and Extra on the iPhone 17 profile at the level's top pixel ratio (?gfxpr=top) and fails over 300 MB of textures +
//      render buffers; .github/workflows/phone-memory-budget.yml runs it on pushes to the release branches
//   D15 at Extra a phone's sharpness stops at 2.25x (Special Player at 3x on the iPhone 17 profile: 370 MB; at 2.25x: 263 MB);
//      High and computers are unchanged (the cap is behind phone&&level===3)
//   D11 a phone's Special Player card art stops at 2x (Extra on the iPhone 17 profile: card faces 170 -> 109 MB, the whole
//      screen 327 -> 266 MB); computers keep 2.5x at Extra and above
//   D16 r93 (Nik's iPhone 17 on 2.5.0, 2026-11-15 05:27 UTC): "We suggest High", then High "failed: The tab closed at this
//      level last time, so it was not opened again". The cap was 2.4.0's (the tab closed at High on 14 November), and 2.5.0
//      had fixed that memory fault. Every crash cap and opening mark now carries the build (js/gfxTier.js BUILD, the
//      service worker's RUNTIME_REVISION). A cap or mark from an older build is dropped on load, so the check opens High
//      again and Auto draws it. A cap from this build still keeps the level shut
//   D17 a cap from this build is said on the Device check's top card, with the day it ends, and Settings reads the same
//      level ("Auto · Balanced"), even after the browser's Back
//   D18 a pick in Settings still clears a cap from this build; a crash in this build writes a fresh cap, so a level gets
//      one fresh try per build and never a retry loop
//   D19 r93 (Nik's iPhone 17 on 2.5.0, 05:35 UTC: the tab closed opening Chamber Men at Balanced after the three Light
//      screens, a level that passed in the run before): one 3D screen in memory at a time. The page saves the run in this
//      tab's sessionStorage and reloads itself before each screen (a second try too), so every screen opens in a fresh page;
//      the climb and the result are the same as in one page
//   D20 the tab dies while a screen plays (Nik: "now the result is empty"): the next load keeps the rows already done,
//      marks that screen, says where the check stopped and what the game draws now; that level is held below for now
//      (the same cap as a death while opening), and the top card and Settings say the same level
//   D21 a death at Light saves nothing and lowers nothing: the check is not finished, and the Light rows done are kept
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const PAGE = fs.readFileSync(path.join(ROOT, "device-check.html"), "utf8");
const TIER = fs.readFileSync(path.join(ROOT, "js/gfxTier.js"), "utf8");
const SCRIPT = /<script>\n([\s\S]*?)<\/script>\s*<\/body>/.exec(PAGE)[1];
const KEY = "careerModeShowdown.gfxMeasured.v2", RUN = "careerModeShowdown.deviceCheckRun.v1";
const LABELS = ["Light", "Balanced", "High", "Extra", "Ultra (4K)", "8K"];
// r96: the Ball Game (club-draw) is timed too, after the other three at each level.
const SCENES = ["chamber-men", "rrr", "sp", "club-draw"];
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

// A clean answer for (scene, level): the level asked, drawn, a whole beat, a full-size buffer, smooth frames.
const good = (scene, level, more) => ({type: "cms-gfx-bench", phase: "result", scene, asked: level, level, name: "x", label: LABELS[level], pixelRatio: 1, css: [1920, 866], size: [1920, 866],
  bufferOk: true, beats: 1, complete: true, failed: null, software: false, gpu: "test", frames: 630, avg: 59.9, p1low: 55.2, ms: 16.7, drawMs: 3.1, ...(more || {})});
const started = (scene, level) => ({type: "cms-gfx-bench", phase: "started", scene, asked: level, level});

// One run of the page. answer(scene, level) returns: a list of messages to post, "silent" (no answer at all), or
// "hang" (started, then nothing). Options: gpu8k, storage, hideAt ([scene, level]: the tab is hidden while that frame loads).
// r93: with opts.session (this tab's sessionStorage) the page saves the run and reloads itself before each 3D screen; each
// reload is a fresh page (fresh sandbox, same storage). opts.dieAt [scene, level]: the tab dies while that frame plays (no
// answer; the next load finds the screen still open).
async function run(answer, opts){
  const o = opts || {}, store = {...(o.storage || {})}, asked = [];
  let wake = null, loads = 0;
  const signal = kind => { const w = wake; wake = null; if(w) w(kind); };
  const nextSignal = () => new Promise(r => { wake = r; });
  const boot = () => {
  loads += 1;
  const els = {};
  const el = id => els[id] || (els[id] = {id, textContent: "", innerHTML: "", hidden: false, disabled: false, listeners: {},
    classList: {add(){}, remove(){}}, addEventListener(type, f){ this.listeners[type] = f; }, replaceChildren(){}, setAttribute(){}});
  const messageListeners = new Set(), docListeners = {};
  const timers = new Map(); let timerId = 0;
  const gpu = o.gpu || "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)", big = o.gpu8k ? 16384 : 4096;
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
        const scene = {"device-check-chamber.html": "chamber-men", "visual-assets/v10_1/roulette/index.html": "rrr", "visual-assets/v10_1/special-player/index.html": "sp", "device-check-ball.html": "club-draw"}[m[1]];
        assert.ok(scene, `a known 3D screen (${m[1]})`);
        const level = Number(m[2]); asked.push(`${scene}@${level}`);
        if(o.dieAt && o.dieAt[0] === scene && o.dieAt[1] === level){ setImmediate(() => signal("die")); return; }
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
  const sandbox = {document: doc, location: {origin: "https://game.test", search: "", reload(){ setImmediate(() => signal("reload")); }}, navigator: o.phone ? {hardwareConcurrency: 4, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1", maxTouchPoints: 5} : {deviceMemory: 32, hardwareConcurrency: 16}, screen: o.phone ? {width: 393, height: 852} : {width: 1920, height: 1080}, devicePixelRatio: o.phone ? 3 : 1, innerWidth: o.phone ? 393 : 1920, innerHeight: o.phone ? 852 : 1080, matchMedia: q => ({matches: Boolean(o.phone) && /pointer:\s*coarse|hover:\s*none/.test(q), addEventListener(){}, removeEventListener(){}}),
    readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; },
    performance: {now: () => 0, timeOrigin: o.timeOrigin}, URLSearchParams,
    sessionStorage: o.session ? {getItem: k => k in o.session ? o.session[k] : null, setItem: (k, v) => { o.session[k] = String(v); },
      removeItem: k => { const was = o.session[k]; delete o.session[k]; if(k === RUN && was && was !== "probe") setImmediate(() => signal("end")); }} : undefined, CustomEvent: function(type, init){ this.type = type; this.detail = init && init.detail; }, dispatchEvent(){},
    addEventListener(type, f){ if(type === "message") messageListeners.add(f); }, removeEventListener(type, f){ if(type === "message") messageListeners.delete(f); },
    setTimeout(f){ timerId += 1; timers.set(timerId, f); return timerId; }, clearTimeout(id){ timers.delete(id); },
    requestAnimationFrame: () => 1, cancelAnimationFrame(){}, requestIdleCallback: () => 1, Date, Math, JSON, Object, Promise, Number, String, Boolean, Array, isFinite};
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.parent = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(TIER, sandbox, {filename: "js/gfxTier.js"});
  vm.runInContext(SCRIPT, sandbox, {filename: "device-check.html"});
  return {el, sandbox};
  };
  const before = store[KEY] || null;
  let page = boot(), sig = nextSignal();
  // noStart: the page is only loaded (a saved run goes on by itself); settle: nothing is expected to run, wait a tick.
  const click = o.noStart ? null : page.el("start").listeners.click();
  if(o.settle) await new Promise(r => setImmediate(r));
  else if(!o.session) await click;
  else for(let n = 0; n < 60; n += 1){
    const kind = await sig;
    if(kind === "end"){ await new Promise(r => setImmediate(r)); break; }
    sig = nextSignal(); page = boot();
  }
  const el = page.el, sandbox = page.sandbox;
  const saved = store[KEY] && store[KEY] !== "null" ? JSON.parse(store[KEY]) : null;
  return {asked, saved, changed: (store[KEY] || null) !== before, status: el("status").textContent, result: el("result").innerHTML, suggest: el("suggest").innerHTML, rows: el("rows").innerHTML, store, tier: sandbox.CareerModeGfxTier, loads, session: o.session};
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
    // r96: only that screen stops; the others climb on (each screen keeps its own best level).
    const rest = l => SCENES.filter(sc => sc !== "sp").map(sc => `${sc}@${l}`);
    assert.deepEqual(r.asked, [...order(1), "chamber-men@2", "rrr@2", "sp@2", "sp@2", "club-draw@2", ...rest(3), ...rest(4)], "two tries, then nothing above is tried on that screen");
    assert.equal(r.saved.scenes.sp, 1);
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
    const f = await run(() => "silent", {storage: {[KEY]: fine}});
    assert.equal(f.tier.measured().level, 0, "a Light that was held is still read on a chip that starts at Light");
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
    assert.deepEqual(lost.asked.slice(0, 6), [...order(0), "chamber-men@1", "chamber-men@1"]);
    assert.equal(lost.saved.level, 0, "the first, clean slow try still settles Balanced");
    assert.equal(lost.saved.scenes["chamber-men"], 0, "for Chamber Men; the other screens climb on (r96)");
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
    assert.match(PAGE, /A screen that is not smooth is played once more before it counts, and stops climbing at the first level that is still not smooth\./);
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
    assert.match(TIER, /PHONE_MAX_PR=3,PHONE_TEX_MAX=1,PHONE_MSAA_MAX=4,PHONE_EXTRA_PR=2\.25;/);
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
  // D12
  {
    const spSlowHigh = scripted({"sp@2": [heavy("sp", 2), heavy("sp", 2)]});
    // r96: per screen. Special Player's Balanced is below the iPhone's High, so it draws High; the screens the check passed
    // higher draw their own level, up to Extra on a phone (PHONE_SCENE_TOP). Nothing below the chip's level is ever saved for a screen.
    const r = await run(spSlowHigh, IPHONE);
    assert.equal(r.saved.level, 2, "Balanced is below the iPhone's High: the device's level stays High (2.4.0 saved Balanced)");
    assert.deepEqual({...r.saved.scenes}, {"chamber-men": 3, rrr: 3, sp: 2, "club-draw": 3}, "Special Player draws High; the others what they held, up to Extra on a phone (the phone memory budget)");
    assert.equal(r.tier.suggested().level, 2, "Auto stays on High for the device");
    assert.equal(r.tier.profile("sp").level, 2); assert.equal(r.tier.profile("club-draw").level, 3);
    assert.equal(r.status, "Check done. High was not held: Special Player was not smooth there. Chamber Men, Russian Roulette, Ball Game were smooth up to Ultra (4K).");
    // Every screen below the chip's level, none above it: nothing is saved, and an earlier result is let go (r92).
    const allSlowHigh = (scene, level) => level >= 2 ? [started(scene, level), ...heavy(scene, level).slice(1)] : allGood(scene, level);
    const none = await run(allSlowHigh, IPHONE);
    assert.equal(none.saved, null, "Balanced on every screen is below the iPhone's High: nothing is saved");
    assert.equal(none.status, "Check done. High was not held: Chamber Men was not smooth there. High was not held: Russian Roulette was not smooth there. High was not held: Special Player was not smooth there. High was not held: Ball Game was not smooth there. Auto stays on High, the level your graphics chip starts at. The check only ever raises Auto.");
    const before = JSON.stringify({level: 3, at: 1700000000000, detail: {scenes: SCENES, held: true}});
    const let_go = await run(allSlowHigh, {...IPHONE, storage: {[KEY]: before}});
    assert.equal(let_go.saved, null, "an earlier Extra is let go: Auto is the higher of this result and the chip's level");
    assert.equal(let_go.tier.suggested().level, 2);
    const up = await run(scripted({"sp@4": [heavy("sp", 4), heavy("sp", 4)]}), IPHONE);
    assert.equal(up.saved.level, 3, "a result above the chip's level is saved: Extra");
    assert.equal(up.tier.suggested().level, 3);
    const same = await run(scripted({"chamber-men@3": [heavy("chamber-men", 3), heavy("chamber-men", 3)]}), IPHONE);
    assert.equal(same.saved.level, 2, "the chip's own level, measured, is saved (it holds 60 fps there)");
    const old = JSON.stringify({level: 1, at: 1763110000000, detail: {scenes: SCENES, held: true}});
    const o = await run(() => "silent", {...IPHONE, storage: {[KEY]: old}});
    assert.equal(o.tier.measured(), null, "a 2.4.0 Balanced on an iPhone is not read");
    assert.equal(o.tier.profile().level, 2, "Auto is High");
    const rtx = await run((scene, level) => level >= 3 ? [started(scene, level), ...heavy(scene, level).slice(1)] : allGood(scene, level), {gpu: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)"});
    assert.equal(rtx.tier.device().guessLevel, 3); assert.equal(rtx.saved, null, "High is below an RTX 4080's Extra");
    assert.match(rtx.status, /Auto stays on Extra, the level your graphics chip starts at\. The check only ever raises Auto\./);
    const rtxOne = await run(scripted({"rrr@3": [heavy("rrr", 3), heavy("rrr", 3)]}), {gpu: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)"});
    assert.deepEqual([rtxOne.saved.level, rtxOne.saved.scenes.rrr, rtxOne.saved.scenes.sp], [3, 3, 4], "Roulette's High is raised to the chip's Extra; the others keep Ultra");
    assert.match(PAGE, /It only ever raises Auto above the level your graphics chip starts at\./);
    ok("D12", "the check only ever raises Auto above the chip's level; lower results are not saved or read; the page says so");
  }
  // D13
  {
    const phone = (await run(() => "silent", IPHONE)).tier, pc = (await run(() => "silent")).tier;
    const fake = list => ({getContext: () => ({RGBA16F: 1, RGBA8: 2, DEPTH_COMPONENT24: 3, RENDERBUFFER: 4, SAMPLES: 5, getInternalformatParameter: () => list})});
    assert.equal(phone.samples(fake([8, 4, 2]), 8, true), 4, "a phone: 4 samples where the chip lists 8");
    assert.equal(phone.samples(fake([8, 4, 2]), 2, true), 2, "never more than asked");
    assert.equal(pc.samples(fake([8, 4, 2]), 8, true), 8, "a computer: as in 2.4.0");
    assert.match(TIER, /PHONE_TEX_MAX=1,PHONE_MSAA_MAX=4,/);
    ok("D13", "a phone never asks for more than 4 MSAA samples; computers unchanged");
  }
  // D14
  {
    const budget = fs.readFileSync(path.join(ROOT, "tests/browser/phone-memory-budget.cjs"), "utf8");
    assert.match(budget, /const PHONE_BUDGET_MB = 300;/);
    assert.match(budget, /const LEVELS = \[2, 3\];/); assert.match(budget, /const SCENES = \["chamber", "rrr", "sp", "ball"\];/);
    assert.match(budget, /"--profiles", "iphone17"/); assert.match(budget, /DEVLAB_MODE: "cpu", DEVLAB_TOP: "1"/);
    assert.match(budget, /const total = Math\.round\(\(r\.allocTexMB \+ r\.allocRbMB\) \* 10\) \/ 10;/, "textures plus render buffers");
    assert.match(budget, /if \(total > PHONE_BUDGET_MB\) failures\.push/);
    for (const need of [/!r\.ready && "never finished loading"/, /\(r\.errors \|\| \[\]\)\.length && `page errors/, /!\(r\.rafFrames > 0 && r\.callsMedian > 0\) && "drew nothing"/,
        /!\(r\.gfx && r\.gfx\.level === level\)/, /!\(r\.allocTexMB > 0\) && "uploaded no textures"/]) assert.match(budget, need, "an unloaded or broken screen is a failure, not 0 MB");
    const lab = fs.readFileSync(path.join(ROOT, "tests/browser/device-lab.cjs"), "utf8");
    assert.match(lab, /const TOP = process\.env\.DEVLAB_TOP === "1" \? "&gfxpr=top" : "";/);
    assert.equal((lab.match(/\$\{TOP\}`/g) || []).length, 4, "every screen (r96: the Ball Game too)");
    assert.match(TIER, /top=forcedLevel!==null&&gfxQuery\("gfxpr"\)==="top"/, "only with a forced level (the lab), never in play");
    assert.match(TIER, /if\(base\.top\)start=Math\.max\(start,Math\.min\(max,phone&&view\?Math\.sqrt\(BUFFER_CAP\/view\):max\)\);/);
    const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/phone-memory-budget.yml"), "utf8");
    assert.match(wf, /branches: \['gameplay\/r\[0-9\]\*'\]/); assert.doesNotMatch(wf, /^\s*pull_request\s*:/m, "never a pull_request workflow: Showdown Gate stays the only one");
    assert.match(wf, /run: node tests\/browser\/phone-memory-budget\.cjs/);
    for (const f of ["js/gfxTier.js", "js/chamberMenScene3d.js", "visual-assets/v10_1/special-player/\\*\\*", "visual-assets/v10_1/roulette/\\*\\*"]) assert.match(wf, new RegExp(`- '${f}'`), f);
    // In play the start ratio is never the top one unless the scene asks (the profile with no ?gfxpr is as before).
    const t = (await run(() => "silent", IPHONE)).tier; t.setChoice("high"); const p = t.profile(); assert.ok(p.pixelRatio <= p.maxPixelRatio);
    ok("D14", "the phone memory budget (300 MB, textures + buffers, top pixel ratio, High and Extra) runs on every release push");
  }
  // D15
  {
    const t = (await run(() => "silent", IPHONE)).tier;
    t.setChoice("extra"); const pe = t.profile(); assert.equal(pe.level, 3); assert.equal(pe.maxPixelRatio, 2.25, "a phone at Extra stops at 2.25x");
    t.setChoice("high"); assert.equal(t.profile().maxPixelRatio, 2, "a phone at High is as in 2.4.0");
    assert.match(TIER, /if\(phone&&level===3\)max=Math\.min\(max,PHONE_EXTRA_PR\);/);
    ok("D15", "at Extra a phone's sharpness stops at 2.25x so every 3D screen fits the phone memory budget");
  }
  // D16-D18 (r93): crash caps carry their build.
  const CAP = "careerModeShowdown.gfxCap.v1", OPEN = "careerModeShowdown.gfxOpening.v1", TAB = "careerModeShowdown.gfxTab.v1";
  const BUILD = /const BUILD="([^"]+)";/.exec(TIER)[1];
  const SW = fs.readFileSync(path.join(ROOT, "service-worker.js"), "utf8");
  // Nik's cap, as 2.4.0 and 2.5.0 wrote it: the tab closed while Chamber Men opened at High in a Device check, 20 hours ago.
  const nikCap = extra => JSON.stringify({level: 1, reason: "the tab closed while this 3D screen was opening", tab: true, from: 2, scene: "chamber-men", bench: true, at: Date.now() - 20 * 36e5, ...(extra || {})});
  // D16
  {
    assert.equal(BUILD, /const RUNTIME_REVISION = "([^"]+)";/.exec(SW)[1], "js/gfxTier.js BUILD is the service worker's RUNTIME_REVISION (the release bump moves both)");
    for (const old of [{}, {build: "2.4.0-r91"}]) {
      const r = await run(allGood, {...IPHONE, storage: {[CAP]: nikCap(old)}});
      assert.deepEqual(r.asked, order(4), "the check opens High and every level above it again");
      assert.equal(r.saved.level, 4, "and saves what held");
      assert.equal(r.store[CAP], "null", "the older build's cap is gone");
      assert.doesNotMatch(r.rows, /tab closed/);
      assert.equal(r.tier.suggested().now, 4);
    }
    // An opening mark left by an older build's page that died is not a death of this build: no cap is written.
    const mark = extra => JSON.stringify([{id: "m1", tab: "T1", top: "111", level: 2, scene: "chamber-men", bench: true, at: Date.now() - 6e4, ...(extra || {})}]);
    const oldMark = await run(allGood, {...IPHONE, storage: {[OPEN]: mark()}, session: {[TAB]: "T1"}, timeOrigin: 222});
    assert.deepEqual(oldMark.asked, order(4), "an older build's opening mark does not cap High");
    assert.equal(oldMark.store[OPEN], "[]", "the older mark is cleared");
    const sameMark = await run(allGood, {...IPHONE, storage: {[OPEN]: mark({build: BUILD})}, session: {[TAB]: "T1"}, timeOrigin: 222});
    assert.deepEqual(sameMark.asked, order(1), "this build's mark is a death: High is not opened");
    assert.equal(JSON.parse(sameMark.store[CAP]).build, BUILD, "the cap it writes carries this build");
    // The same cap from this build still keeps High shut, as before.
    const same = await run(allGood, {...IPHONE, storage: {[CAP]: nikCap({build: BUILD})}});
    assert.deepEqual(same.asked, order(1), "a cap from this build keeps High shut");
    assert.match(same.status, /High was not tried: the tab closed at that level last time/);
    assert.match(same.rows, /The tab closed at this level last time, so it was not opened again\./);
    for (const write of [/gfxWrite\(CAP_KEY,JSON\.stringify\(\{level,reason:TAB_CRASH,[^\n]*?,at:Date\.now\(\),build:BUILD\}\)\)/, /gfxWrite\(CAP_KEY,JSON\.stringify\(\{level,reason:String\(reason\|\|"failed"\),at:Date\.now\(\),build:BUILD\}\)\)/])
      assert.match(TIER, write, "every cap the module writes carries the build");
    ok("D16", "a crash cap or opening mark from an older build is dropped, so an update gives the level a fresh try; this build's cap still blocks");
  }
  // D17
  {
    const same = await run(allGood, {...IPHONE, storage: {[CAP]: nikCap({build: BUILD})}});
    const day = new Date(Date.now() - 20 * 36e5 + 7 * 864e5).toLocaleDateString(undefined, {day: "numeric", month: "long"});
    assert.match(same.suggest, /We suggest <b>High<\/b>/, "the chip's level is still named");
    assert.ok(same.suggest.includes(`<small class="shut">Last time the tab closed at High, so the game draws Balanced at most until ${day}, or until you pick a level in Settings or the game updates. This check stops below High until then.</small>`), same.suggest);
    const free = await run(allGood, IPHONE);
    assert.doesNotMatch(free.suggest, /class="shut"/, "no line without a cap");
    assert.equal(same.tier.suggested().now, 1, "Auto draws Balanced while the cap lasts");
    assert.equal(same.tier.label(same.tier.suggested().now), "Balanced", "Settings reads Auto · Balanced, the level the check stops below High at");
    const settings = fs.readFileSync(path.join(ROOT, "js/settings.js"), "utf8");
    assert.match(settings, /const name = tier\.label\(tier\.suggested\(\)\.now\);/, "the Auto label is the level Auto draws now (the cap counted)");
    assert.match(settings, /window\.addEventListener\("pageshow", onLevel\);\n\s*window\.addEventListener\("storage", onLevel\);/, "the row reads the saved state again after Back and after another tab saves");
    ok("D17", "the Device check's top card says when a tab-crash cap keeps a level shut, and Settings names the same level");
  }
  // D18
  {
    const r = await run(allGood, {...IPHONE, storage: {[CAP]: nikCap({build: BUILD})}});
    assert.ok(r.tier.tabCrash(), "the cap stands");
    r.tier.setChoice("auto");
    assert.equal(r.store[CAP], "null", "a pick in Settings clears it");
    assert.equal(r.tier.tabCrash(), null);
    assert.equal(r.tier.suggested().now, 2, "Auto is High again");
    // A failure in this build writes a fresh cap with this build (one try per build, then shut again).
    r.tier.setChoice("high"); r.tier.fallback("test: out of memory");
    const fresh = JSON.parse(r.store[CAP]);
    assert.equal(fresh.build, BUILD); assert.equal(fresh.level, 1);
    assert.equal(r.tier.profile().level, 1, "and the level is lowered at once");
    ok("D18", "a pick in Settings still clears a cap; a failure in this build writes a fresh one");
  }
  // D19
  {
    const one = await run(allGood, {});
    const r = await run(allGood, {session: {}});
    assert.deepEqual(r.asked, one.asked, "the same screens in the same order as in one page");
    assert.equal(r.loads, r.asked.length, "each screen opened in a page of its own (one reload before every screen after the first)");
    assert.equal(r.saved.level, one.saved.level, "and the same result");
    assert.equal(r.session[RUN], undefined, "a finished run leaves nothing behind");
    assert.equal(r.status, one.status);
    const retry = await run(scripted({"sp@0": [hitch("sp", 0), allGood("sp", 0)]}), {session: {}});
    assert.equal(retry.loads, retry.asked.length, "a second try opens in a fresh page too");
    assert.match(retry.rows, /Second try\. First try: 59\.6 fps/, "the first try is kept across the reload");
    assert.equal(retry.saved.level, 4);
    assert.match(PAGE, /if\(keep&&st\.played\)\{st\.played=false;if\(runSave\(st\)\)\{reloading=true;location\.reload\(\);return;\}\}/);
    assert.match(PAGE, /if\(running&&!reloading&&document\.visibilityState==="hidden"\)/, "its own reload never reads as a hidden tab");
    ok("D19", "the Device check holds one 3D screen at a time: each screen opens in a fresh page, with the same climb and result");
  }
  // D20
  {
    const r = await run(allGood, {...IPHONE, session: {}, dieAt: ["chamber-men", 1]});
    assert.deepEqual(r.asked, [...order(0), "chamber-men@1"], "Light's three screens, then Balanced Chamber Men, which closed the tab");
    assert.equal((r.rows.match(/59\.9 fps/g) || []).length, 4, "the four Light rows (r96: the Ball Game too) are kept after the tab closed");
    assert.match(r.rows, /<span class="no">failed<\/span><small>The tab closed while this screen was playing, so the check stopped here\.<\/small>/);
    assert.match(r.status, /^Check stopped\. The tab closed while Chamber Men was playing at Balanced\. Light was smooth\. Auto stays on High, the level your graphics chip starts at\. The check only ever raises Auto\. For now the game draws Light at most, because the tab closed at Balanced\.$/, r.status);
    assert.equal(r.saved, null, "nothing saved below the chip's level");
    const tc = r.tier.tabCrash(); assert.equal(tc.level, 0); assert.equal(tc.from, 1);
    assert.equal(JSON.parse(r.store[CAP]).build, BUILD);
    assert.match(r.suggest, /<small class="shut">Last time the tab closed at Balanced, so the game draws Light at most until /, "the top card says it");
    assert.equal(r.tier.label(r.tier.suggested().now), "Light", "and Settings reads Auto · Light");
    assert.equal(r.session[RUN], undefined);
    // Codex on #1473: a run saved by another build (the game updated before the tab came back) is let go, with no cap.
    const st = {v: 1, build: "2.4.0-r91", at: Date.now(), results: [{}, {}, {}, {}, {}], level: 1, scene: 0, first: null, ended: null, open: {level: 1, scene: 0}, played: false};
    const old = await run(allGood, {...IPHONE, session: {[RUN]: JSON.stringify(st)}, noStart: true, settle: true});
    assert.equal(old.tier.tabCrash(), null, "an older build's saved run writes no cap");
    assert.equal(old.session[RUN], undefined, "and is let go");
    assert.deepEqual(old.asked, [], "nothing opens by itself");
    ok("D20", "a tab that dies mid-check keeps the rows done, marks the screen, says where it stopped, and the game holds below that level for now");
  }
  // D21
  {
    const r = await run(allGood, {...IPHONE, session: {}, dieAt: ["rrr", 0]});
    assert.equal((r.rows.match(/59\.9 fps/g) || []).length, 1, "Light Chamber Men is kept");
    assert.match(r.status, /^Check not finished: Russian Roulette at Light was not verified\. The tab closed while this screen was playing\.$/);
    assert.equal(r.saved, null); assert.equal(r.tier.tabCrash(), null, "nothing below Light to hold");
    ok("D21", "a tab that dies at Light saves and lowers nothing, and keeps the Light rows done");
  }
  console.log(`PASS r92 device check iPhone contracts (${checks} checks)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
