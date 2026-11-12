"use strict";
// r91 level guide (js/gfxTier.js guide(), device-check.html, js/settings.js). Nik, 2026-11-12: "based on your graphic
// card, this is what we suggest, or based on your CPU ... so everyone can look at that table and understand what is
// recommended for them"; "the link to that page ... very visible in the 3D menu"; "the auto pick ... very visible";
// and a real picture of each 3D screen at each level. The devices are the lab's own (tests/support/device-lab-profiles.cjs).
//   G1 the guide's rows say what Auto's guess does: named chips land on the row that names them, none on Ultra or 8K
//   G2 memory and processor threads hold a device as the guide's own sentence says; the level is the lowest of the three
//   G3 the lab's devices: the Chromebook reads Light (chip Light, 2 threads and 4 GB each "no higher than Balanced",
//      Ultra and 8K waiting for its check); one row is marked, the measured level once a check is saved
//   G4 a chip's name is shown as a person reads it
//   G5 the guide promises no frame rate; the page says "holds 60 fps" only for a finished check that held its level
//   G6 the Device check page draws the card and the table from guide(), with no chip or level names of its own
//   G7 Settings: a visible link to the page under 3D QUALITY, "Auto · <level>" in the list, the old last entry kept
//   G8 the pictures: each 3D screen at each level, small WebP, lazy on the Device check page only, never in the
//      worker's install list, never on the game page
//   G9 the docs say the same
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {deviceOf} = require("../support/device-lab-profiles.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const SRC = read("js/gfxTier.js"), PAGE = read("device-check.html"), SETTINGS = read("js/settings.js"), CSS = read("css/r78-type.css");
const MEASURED = "careerModeShowdown.gfxMeasured.v2";
let checks = 0;
const ok = (id, text) => { checks += 1; console.log(`ok ${checks} ${id} ${text}`); };

function page(device, storage = {}) {
  const store = {...storage};
  const doc = {visibilityState: "visible", addEventListener() {},
    createElement: tag => tag === "canvas" ? {getContext: () => ({RENDERER: 7937, MAX_RENDERBUFFER_SIZE: 34024, MAX_TEXTURE_SIZE: 3379,
      getExtension: n => n === "WEBGL_debug_renderer_info" ? {UNMASKED_RENDERER_WEBGL: 37446} : {loseContext() {}},
      getParameter: k => k === 37446 || k === 7937 ? device.gpu : k === 34024 ? device.maxBuffer : k === 3379 ? device.maxTexture : 16384})} : {style: {}, setAttribute() {}, append() {}, remove() {}},
    body: {append() {}}, documentElement: {dataset: {}}};
  const ctx = {document: doc, devicePixelRatio: device.dpr, navigator: {...(device.memory == null ? {} : {deviceMemory: device.memory}), hardwareConcurrency: device.cores},
    screen: {width: device.screen[0], height: device.screen[1]}, innerWidth: device.view[0], innerHeight: device.view[1],
    location: {search: "", pathname: "/device-check.html", origin: "http://x"}, readStorageValue: k => k in store ? store[k] : null, writeStorageValue: (k, v) => { store[k] = String(v); return true; },
    performance: {now: () => 0}, setTimeout: f => { f(); return 0; }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, addEventListener() {}, URLSearchParams};
  ctx.globalThis = ctx; ctx.parent = ctx; ctx.top = ctx;
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return ctx.CareerModeGfxTier;
}
const chromebook = deviceOf("chromebook866"), strong = deviceOf("pc4k"), phone = deviceOf("iphone17");
// A strong computer (or phone) with this chip: memory and threads hold nothing, so the level is the chip's own.
const chipLevel = (gpu, base = strong) => page({...base, gpu, memory: 16, cores: 16}).guide().device.chip;
const plain = G => JSON.parse(JSON.stringify(G.guide()));

// G1
{
  // Each row: chips that must land on it, and the words of the row that name their family.
  const ROWS = [
    {chips: ["ANGLE (Intel, Intel(R) UHD Graphics 600 (0x00003185) Direct3D11 vs_5_0 ps_5_0, D3D11)", "Intel(R) HD Graphics 520", "Intel(R) UHD Graphics 770", "Mali-G52", "Mali-G72", "PowerVR Rogue GE8320", "Adreno (TM) 506", "Apple A11 GPU",
      "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)"],
      words: ["Intel HD and UHD Graphics", "Mali", "PowerVR", "Adreno 5xx and below", "Apple A9 to A12", "no graphics chip"]},
    {chips: ["ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)", "AMD Radeon(TM) Graphics", "Adreno (TM) 650", "Mali-G76", "Mali-G78", "Mali-G610", "Mali-G615", "Some Chip Nobody Named 9000"],
      words: ["Intel Iris", "Built-in AMD Radeon", "Adreno 6xx", "Mali-G76 to G78", "G610", "G615", "Any chip this table does not name"]},
    {chips: ["NVIDIA GeForce GTX 1650", "NVIDIA GeForce RTX 3050", "AMD Radeon RX 580", "AMD Radeon Pro 5500M", "Apple M1", "Apple M3", "Apple GPU", "Adreno (TM) 740", "Adreno (TM) 830", "Mali-G715", "Immortalis-G720"],
      words: ["GeForce GTX and RTX", "Radeon RX and Radeon Pro", "Apple M1 and later", "iPhone and iPad", "Adreno 7xx and up", "Mali-G7xx", "Immortalis"]},
    {chips: ["NVIDIA GeForce RTX 2060", "NVIDIA GeForce RTX 2080 Ti", "NVIDIA GeForce RTX 3070", "NVIDIA GeForce RTX 3090", "NVIDIA GeForce RTX 4050", "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)", "NVIDIA GeForce RTX 5080",
      "AMD Radeon RX 6600", "AMD Radeon RX 7900 XT", "Apple M1 Pro", "Apple M2 Max", "Apple M2 Ultra"],
      words: ["RTX 2060 to 2090", "3060 to 3090", "every RTX 40 or later", "Radeon RX 6000 and later", "Apple M Pro, Max and Ultra"]}
  ];
  const guide = plain(page(strong));
  assert.equal(guide.rows.length, 6);
  assert.deepEqual(guide.rows.map(r => r.label), Array.from(page(strong).labels), "the six shared level names, in order");
  ROWS.forEach((row, level) => {
    for (const chip of row.chips) assert.equal(chipLevel(chip), level, `${chip} starts at ${guide.rows[level].label}`);
    for (const words of row.words) assert.ok(guide.rows[level].who.includes(words), `the ${guide.rows[level].label} row names "${words}"`);
  });
  // A strong phone chip is judged the same on a phone.
  for (const chip of ROWS[2].chips.slice(6)) assert.equal(chipLevel(chip, phone), 2);
  // No chip starts at Ultra (4K) or 8K: only the Device check gives them, and the rows say so.
  assert.equal(Math.max(...ROWS.flatMap(r => r.chips).map(c => chipLevel(c))), 3);
  assert.match(guide.rows[4].who, /^No chip starts here\. The Device check gives it/);
  assert.match(guide.rows[5].who, /7680 px picture\. Never a phone\.$/);
  ok("G1", "the guide's rows say what Auto's guess does: named chips land on the row that names them, none on Ultra or 8K");
}
// G2
{
  const at = (gpu, memory, cores, base = strong) => plain(page({...base, gpu, memory, cores})).device;
  const rtx = "NVIDIA GeForce RTX 4090";
  assert.deepEqual([at(rtx, 16, 16).level, at(rtx, 2, 16).level, at(rtx, 1, 16).level, at(rtx, 4, 16).level, at(rtx, 8, 4).level, at(rtx, 8, 6).level], [3, 0, 0, 1, 1, 3]);
  assert.deepEqual([at(rtx, 2, 16).memoryCap, at(rtx, 4, 16).memoryCap, at(rtx, 8, 16).memoryCap, at(rtx, null, 16).memoryCap], [0, 1, null, null], "2 GB or less: Light; 4 GB or less: no higher than Balanced");
  assert.deepEqual([at(rtx, 16, 2).threadCap, at(rtx, 16, 4).threadCap, at(rtx, 16, 5).threadCap, at(rtx, 16, undefined).threadCap], [1, 1, null, null], "a computer with 4 threads or fewer: no higher than Balanced");
  // Threads are not counted on a phone.
  assert.deepEqual([at("Apple GPU", null, 4, phone).threadCap, at("Apple GPU", null, 4, phone).level], [null, 2]);
  const limits = page(strong).guide().limits;
  for (const words of ["2 GB of memory or less starts at Light", "4 GB or less, or a computer with 4 processor threads or fewer, starts no higher than Balanced", "Threads are not counted on a phone"]) assert.ok(limits.includes(words), `the guide says: ${words}`);
  // The level Auto starts at is the lowest of what the chip, the memory and the threads say, on every mix.
  for (const gpu of ["Intel(R) UHD Graphics 600", "Intel(R) Iris(R) Xe Graphics", "NVIDIA GeForce GTX 1650", rtx, "Apple GPU", "Mali-G52"]) for (const memory of [null, 1, 2, 4, 8]) for (const cores of [undefined, 2, 4, 8]) for (const base of [strong, phone]) {
    const G = page({...base, gpu, memory, cores}), d = G.guide().device;
    assert.equal(d.level, Math.min(d.chip, d.memoryCap ?? 9, d.threadCap ?? 9), `${gpu} / ${memory} GB / ${cores} threads / ${base === phone ? "phone" : "computer"}`);
    assert.equal(d.level, G.device().guessLevel);
    assert.equal(G.guide().rows.filter(r => r.mine).length, 1);
  }
  ok("G2", "memory and processor threads hold a device as the guide's own sentence says; the level is the lowest of the three");
}
// G3
{
  for (const key of ["chromebook866", "chromebook1035"]) {
    const G = page(deviceOf(key)), g = plain(G);
    assert.deepEqual(g.device, {phone: false, software: false, chipName: "Intel UHD Graphics (JSL)", chip: 0, memory: 4, memoryCap: 1, threads: 2, threadCap: 1, level: 0, measured: null, weak: true, can8k: g.device.can8k});
    assert.deepEqual(g.rows.filter(r => r.mine).map(r => r.label), ["Light"], `${key}: Light is this device's row`);
    assert.deepEqual(Array.from(G.needsCheck()), ["Ultra (4K)", "8K"].slice(0, g.device.can8k ? 2 : 1), "Ultra (4K) and 8K wait for its Device check");
    assert.equal(G.suggested().name, "light");
  }
  assert.deepEqual(plain(page(strong)).rows.filter(r => r.mine).map(r => r.label), ["Extra"]);
  assert.deepEqual(plain(page(phone)).rows.filter(r => r.mine).map(r => r.label), ["High"]);
  // A saved check moves the marked row to the measured level, on any device.
  const passed = plain(page(chromebook, {[MEASURED]: JSON.stringify({level: 1, at: 1, detail: {held: true}})}));
  assert.deepEqual([passed.device.measured, passed.device.level, passed.rows.filter(r => r.mine).map(r => r.label).join()], [1, 0, "Balanced"]);
  const top = plain(page(strong, {[MEASURED]: JSON.stringify({level: 4, at: 1, detail: {held: true}})}));
  assert.deepEqual([top.device.measured, top.rows.filter(r => r.mine).map(r => r.label).join()], [4, "Ultra (4K)"]);
  ok("G3", "the lab's devices: the Chromebook reads Light with Ultra and 8K waiting for its check; the marked row follows a saved check");
}
// G4
{
  const name = gpu => page({...strong, gpu}).guide().device.chipName;
  assert.deepEqual([
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 (0x00002684) Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "ANGLE (Intel, Vulkan 1.3.0 (Intel(R) UHD Graphics (JSL) (0x00004E55)), Mesa 25.0.7)",
    "ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)",
    "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1650/PCIe/SSE2, OpenGL 4.5.0)",
    "Apple GPU", "Adreno (TM) 740", "Mali-G52 MC2", ""].map(name),
  ["NVIDIA GeForce RTX 4090", "Intel UHD Graphics (JSL)", "Apple M1 Pro", "Intel Iris Xe Graphics", "NVIDIA GeForce GTX 1650", "Apple GPU", "Adreno 740", "Mali-G52 MC2", ""]);
  assert.ok(name(`ANGLE (X, ${"Very Long Chip Name ".repeat(8)}, D3D11)`).length <= 64, "a long name is cut, not left to run across the card");
  ok("G4", "a chip's name is shown as a person reads it");
}
// G5
{
  const g = plain(page(strong));
  for (const r of g.rows) assert.doesNotMatch(`${r.who} ${r.draws}`, /fps|frames? per second|\b60\b|guarantee|will run/i, `${r.label}: no frame rate is promised`);
  assert.doesNotMatch(g.limits, /fps|\b60\b/i);
  // The page's one "holds 60 fps" sentence is for a saved check that held its level; a check where even Light was not
  // smooth says so; before a check it is "Auto starts there".
  assert.match(PAGE, /const held60=m&&m\.detail&&typeof m\.detail\.held==="boolean"\?m\.detail\.held:null;/);
  assert.match(PAGE, /const why=!m\?`Auto starts there on a device like this\. Run the check to measure yours: Auto then uses the best level it kept smooth\.`\s*:held60===false\?`Measured on this device: even \$\{LEVELS\[0\]\} was not smooth, so Auto stays on \$\{LEVELS\[0\]\}, the lightest level\.`\s*:held60\?`Measured on this device: it holds 60 fps at \$\{name\} on all three 3D screens\. Auto uses it\.`\s*:`The check measured \$\{name\} on this device\. Auto uses it\.`;/);
  assert.equal((PAGE.match(/holds 60 fps/g) || []).length, 1);
  assert.match(PAGE, /These are starting points, not promises\. Only the check on this page measures a device/);
  ok("G5", "the guide promises no frame rate; the page says \"holds 60 fps\" only for a finished check that held its level");
}
// G6
{
  assert.match(PAGE, /<section class="card" id="yours" aria-labelledby="yoursTitle" hidden>\s*<h2 id="yoursTitle">Your device<\/h2>\s*<dl id="parts" class="parts"><\/dl>\s*<p id="suggest" class="suggest"><\/p>/);
  assert.match(PAGE, /<section class="card" id="guide" aria-labelledby="guideTitle" hidden>\s*<h2 id="guideTitle">Level guide<\/h2>/);
  // The card comes before the Start button, the table after the results: the check stays in the first screen.
  const order = ['id="yours"', 'id="start"', 'id="stage"', 'id="rows"', 'id="guide"'].map(s => PAGE.indexOf(s));
  assert.deepEqual(order, [...order].sort((a, b) => a - b)); assert.ok(order.every(i => i > 0));
  assert.match(PAGE, /let g=null;try\{g=T&&T\.guide\(\);\}catch\(_error\)\{g=null;\}\s*\$\("yours"\)\.hidden=\$\("guide"\)\.hidden=!g;if\(!g\)return;/, "without the module the two sections stay hidden");
  assert.match(PAGE, /\["Graphics chip",d\.chipName\|\|"Not named by this browser"/); assert.match(PAGE, /\["Processor",d\.threads\?/); assert.match(PAGE, /\["Memory",d\.memory\?\(d\.memory>=8\?"8 GB or more"/);
  assert.match(PAGE, /\$\("limits"\)\.textContent=g\.limits;/);
  assert.match(PAGE, /function showSaved\(note\)\{\s*showGuide\(\);/, "a finished or forgotten check redraws the card and the marked row");
  // One source: the page names no chip and no level of its own.
  const script = PAGE.slice(PAGE.indexOf("<script>"));
  assert.doesNotMatch(PAGE, /RTX|GeForce|Radeon|UHD|Adreno|Mali|Iris/, "chips are named in js/gfxTier.js only");
  assert.doesNotMatch(script.replace(/Device check|\/\/[^\n]*/g, ""), /["'`>](Light|Balanced|High|Extra|Ultra \(4K\)|8K)\b/, "level names come from the shared list");
  // The weak-device line (Nik's Chromebook): which levels wait for the check, from the module's own answer.
  assert.match(PAGE, /held=T\.needsCheck\?T\.needsCheck\(\):\[\];/); assert.match(PAGE, /offered here only after the check passes/);
  // Quiet type: no box around the two titles, nothing under 12 px, no glow.
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.match(style, /\nh2\{margin:0 0 12px;font:800 15px\/1\.2 system-ui,sans-serif;letter-spacing:\.12em;text-transform:uppercase;color:var\(--gold\);text-align:center\}/);
  assert.doesNotMatch(style, /h2[^{]*\{[^}]*(border|background|box-shadow)/);
  assert.doesNotMatch(style, /text-shadow|filter:|drop-shadow/);
  for (const m of style.matchAll(/font(?:-size)?:[^;}]*?(\d+(?:\.\d+)?)px/g)) assert.ok(Number(m[1]) >= 12, `no type under 12 px (${m[0]})`);
  ok("G6", "the Device check page draws the card and the table from guide(), with no chip or level names of its own");
}
// G7
{
  assert.match(SETTINGS, /const guideLine = createSettingsElement\("small", "settingsGfxGuideLine"\);\s*const guide = createSettingsElement\("a", "settingsGfxGuide", "Device check and guide ›"\);\s*guide\.href = "device-check\.html";\s*guideLine\.append\(guide\);\s*copy\.append\(guideLine\);/);
  assert.match(SETTINGS, /function getSettingsGfxAutoLabel\(tier\)\{\s*try\{\s*const name = tier\.label\(tier\.suggested\(\)\.now\);\s*return name \? `Auto · \$\{name\}` : "Auto";/);
  assert.match(SETTINGS, /createSettingsElement\("option", "", value === "auto" \? getSettingsGfxAutoLabel\(tier\) : tier\.labels\[index - 1\]\)/);
  assert.match(SETTINGS, /const auto = select\.querySelector\('option\[value="auto"\]'\);\s*if\(auto\)\{ auto\.textContent = getSettingsGfxAutoLabel\(window\.CareerModeGfxTier\); \}/, "a Device check result or a lowered level renames the entry while Settings is open");
  // The list's last entry still opens the page (the path 2.3.0 players know).
  assert.match(SETTINGS, /createSettingsElement\("option", "", "Device check…"\)/); assert.match(SETTINGS, /window\.location\.assign\("device-check\.html"\);/);
  // The link shows at every width (the landscape plate hides the row's other small line, not this one), in the row's own
  // small type, gold, no box and no glow; a finger's height on touch widths.
  assert.match(CSS, /\.settingsGfxRow \.settingsAudioCopy small:not\(\.settingsGfxAuto\):not\(\.settingsGfxGuideLine\) \{ display: none; \}/);
  const link = CSS.match(/\.settingsGfxRow \.settingsGfxGuide \{\s*([^}]*)\}/);
  assert.ok(link); assert.match(link[1], /color: var\(--sd-gold-500, #f5c518\); font-weight: 700;/); assert.doesNotMatch(link[1], /border|background|shadow|font-size/);
  assert.match(CSS, /@media \(max-width: 1199px\) \{[^@]*\.settingsGfxRow \.settingsGfxGuide \{ display: inline-flex; align-items: center; min-height: 44px; \}/);
  ok("G7", "Settings: a visible link to the page under 3D QUALITY, \"Auto · <level>\" in the list, the old last entry kept");
}
// G8
{
  const SCENES = ["chamber-men", "rrr", "sp"], NAMES = Array.from(page(strong).names);
  assert.deepEqual(NAMES, ["light", "medium", "high", "extra", "ultra", "8k"]);
  const dir = "assets/level-guide";
  const webp = f => { const b = fs.readFileSync(path.join(ROOT, f)); assert.equal(b.subarray(0, 4).toString("latin1") + b.subarray(8, 12).toString("latin1"), "RIFFWEBP", `${f} is a WebP file`); return b.length; };
  let small = 0, large = 0;
  for (const s of SCENES) for (const n of NAMES) {
    const a = webp(`${dir}/${s}-${n}-s.webp`), b = webp(`${dir}/${s}-${n}.webp`);
    assert.ok(a <= 45 * 1024, `${s}-${n}-s.webp is small (${a} bytes)`); assert.ok(b <= 260 * 1024, `${s}-${n}.webp stays light (${b} bytes)`);
    small += a; large += b;
  }
  assert.deepEqual(fs.readdirSync(path.join(ROOT, dir)).sort(), SCENES.flatMap(s => NAMES.flatMap(n => [`${s}-${n}-s.webp`, `${s}-${n}.webp`])).sort(), "nothing else in the folder");
  assert.ok(small <= 520 * 1024, `the 18 small pictures together stay under 520 KB (${small})`);
  // The page builds the names from its own scene list and the module's level names, lazily, with their size set.
  assert.match(PAGE, /<img loading="lazy" decoding="async" width="\$\{LOOK\[0\]\}" height="\$\{LOOK\[1\]\}" src="assets\/level-guide\/\$\{s\.key\}-\$\{T\.names\[r\.level\]\}-s\.webp" alt="\$\{esc\(s\.name\)\} at \$\{esc\(r\.label\)\}">/);
  assert.match(PAGE, /How it looks: the same moment of each 3D screen at every level\. The pictures say nothing about speed\./);
  // On demand only: never in the worker's install list or any other file of the game.
  for (const f of ["service-worker.js", "index.html", "js/settings.js", "js/gfxTier.js", "js/offlineApp.js"]) assert.ok(!read(f).includes("level-guide"), `${f} never names the guide's pictures`);
  ok("G8", `the pictures: each 3D screen at each level, WebP, lazy on the Device check page only (${Math.round(small / 1024)} KB small, ${Math.round(large / 1024)} KB large)`);
}
// G9
{
  const docs = read("docs/QUALITY_LEVELS.md");
  assert.match(docs, /## The level guide/);
  assert.match(docs, /`CareerModeGfxTier\.guide\(\)`/); assert.match(docs, /Auto · Light/); assert.match(docs, /assets\/level-guide\//);
  assert.match(docs, /tests\/contracts\/r91-level-guide-contracts\.cjs/);
  ok("G9", "the docs say the same");
}
console.log(`PASS r91 level guide contracts (${checks} checks)`);
