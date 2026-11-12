"use strict";
// r91 Russian Roulette heavy-parts ladder (Sol 6.1 review of 2.3.0; Nik 2026-11-11 14:33 UTC: "heavy parts like crowd, shadows
// and glow are fixed when the scene loads, so a slow device keeps paying for them"). The table scene offers what it can give
// up to the shared governor (js/gfxTier.js, detail:{steps,apply}), which walks it only on Auto and only between turns.
// The scene's own ladder code runs here, cut from the real page, against stand-ins:
//   R1 the ladder holds only parts the level has, smallest loss first, and goes to the governor as its detail ladder
//   R2 step 0 is the scene as built; every step's state; any step from any other lands where going there directly does
//   R3 smoke and sparks: every count the scene asks for is unchanged as built and halved (never to nothing) at "smoke"
//   R4 hidden dust is not moved either; the ladder changes no light, material or shadow map (nothing is compiled in play)
//   R5 a turn still holds the governor from startTurn to endTurn; docs/QUALITY_LEVELS.md lists the ladder
//   R6 a step in play is a soft cut (js/gfxTier.js softCut, given to the governor as before()): the frame as it stands is
//      copied over the canvas inside the stage and fades out; a plain cut under Reduce Motion; it never throws
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const results = []; const ok = (id, label) => { results.push(id); console.log(`ok ${results.length} ${id} ${label}`); };
const page = read("visual-assets/v10_1/roulette/index.html");
const cut = (src, from, to) => { const a = src.indexOf(from); assert.ok(a >= 0, `found: ${from.slice(0, 50)}`); assert.equal(src.indexOf(from, a + 1), -1, `once: ${from.slice(0, 50)}`);
  const b = src.indexOf(to, a); assert.ok(b > a, `found after it: ${to.slice(0, 50)}`); return src.slice(a, b); };
const LADDER_SRC = cut(page, 'const LADDER=["dust","smoke",', "window.__rr.ladder=");
function mount({cafe = false} = {}) {
  const dust = {p: {visible: true}}, cafeProps = cafe ? {visible: true} : null;
  return new Function("dust", "cafeProps", `let fxShare=1; ${LADDER_SRC}
    return {heavy,LADDER,state:()=>({at:detailAt,dust:dust.p.visible,fxShare,cafe:cafeProps?cafeProps.visible:null})};`)(dust, cafeProps);
}

// R1
{
  assert.deepEqual(mount().LADDER, ["dust", "smoke"], "Light to High: no café tables to give up");
  assert.deepEqual(mount({cafe: true}).LADDER, ["dust", "smoke", "cafe"], "Extra and up: the café tables go last");
  assert.ok(page.includes('GOV=GFXT.governor(renderer,{key:"rrr",draw:()=>renderer.render(scene,camera),beats:true,detail:{steps:LADDER.length,apply:heavy},before:()=>GFXT.softCut?.(renderer.domElement,()=>renderer.render(scene,camera))});'), "the governor gets the ladder and the soft cut; the scene plays in beats");
  assert.equal((page.match(/GFXT\.governor\(/g) || []).length, 1, "one governor");
  // The café tables exist from Extra up only, and the ladder holds the very group that was built.
  assert.ok(page.includes("const hall=new T.Group(); scene.add(hall); let hallLamps=null, cafeProps=null;"));
  assert.ok(/if\(EXTRA_UP\)\{ const top=mat\([^\n]*\n\s*const cafe=new T\.Group\(\); hall\.add\(cafe\); cafeProps=cafe;/.test(page));
  ok("R1", "the ladder holds only parts the level has and goes to the shared governor");
}
// R2
{
  for (const cafe of [false, true]) {
    const rows = [{at: 0, dust: true, fxShare: 1, cafe: cafe ? true : null}, {at: 1, dust: false, fxShare: 1, cafe: cafe ? true : null}, {at: 2, dust: false, fxShare: .5, cafe: cafe ? true : null}];
    if (cafe) rows.push({at: 3, dust: false, fxShare: .5, cafe: false});
    const n = rows.length - 1;
    assert.deepEqual(mount({cafe}).state(), rows[0], "as built before any step");
    for (let from = 0; from <= n; from += 1) for (let to = 0; to <= n; to += 1) {
      const m = mount({cafe}); m.heavy(from, "start"); m.heavy(to, to < from ? "restore" : "slow");
      assert.deepEqual(m.state(), rows[to], `step ${from} to ${to}`);
    }
    const m = mount({cafe}); m.heavy(99, "slow"); assert.equal(m.state().at, n); m.heavy(-2, "restore"); assert.deepEqual(m.state(), rows[0]);
  }
  ok("R2", "step 0 is the scene as built; every step is the same from any other step");
}
// R3
{
  assert.ok(page.includes("function puff(pos,dir,n,size,speed,life){ n=Math.max(1,Math.round(n*fxShare)); for(let i=0;i<n;i++){"));
  assert.ok(page.includes("function spray(pos,dir,n,speed){ n=Math.max(1,Math.round(n*fxShare)); for(let i=0;i<n;i++){"));
  assert.ok(/\nlet fxShare=1;\n/.test(page), "as built: every puff and spark");
  const count = (n, share) => Math.max(1, Math.round(n * share));
  // Every count the scene asks for: the click's 4 puffs; the shot's 14, 10 and 8 puffs and 34 sparks (10 under Reduce
  // Motion); the board hit's 5 puffs and 9 sparks (4 under Reduce Motion).
  const puffs = [...page.matchAll(/puff\([^;]*?,(\d+),[^,;]+,[^,;]+,[^,;]+\);/g)].map(m => Number(m[1]));
  const sprays = [...page.matchAll(/spray\([^;]*?,REDUCED\?(\d+):(\d+),[^,;]+\);/g)].flatMap(m => [Number(m[1]), Number(m[2])]);
  assert.deepEqual(puffs, [4, 14, 10, 8, 5]); assert.deepEqual(sprays, [10, 34, 4, 9]);
  const asked = puffs.concat(sprays);
  for (const n of asked) { assert.equal(count(n, 1), n, "unchanged as built"); assert.equal(count(n, .5), Math.round(n / 2)); assert.ok(count(n, .5) >= 1); }
  ok("R3", "smoke and sparks are unchanged as built and halved at the smoke step");
}
// R4
{
  assert.ok(page.includes("  if(dust.p.visible){ const a=dust.pos; for(let i=0;i<a.length/3;i++){"), "dust that is not drawn is not moved");
  const code = LADDER_SRC.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const word of ["shadow", "castShadow", ".material", "intensity", "scene.add", "scene.remove", "setPixelRatio", "requestAnimationFrame", "devicePixelRatio", "renderer."]) {
    assert.ok(!code.includes(word), `the ladder does not touch ${word}`);
  }
  assert.ok(page.includes("renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFShadowMap; renderer.shadowMap.autoUpdate=false;"), "the shadow map is drawn once, as before: nothing to step");
  assert.equal((page.replace(/\/\*[\s\S]*?\*\//g, "").match(/heavy\(/g) || []).length, 0, "nothing on the page calls heavy() itself");
  assert.equal((page.match(/apply:heavy/g) || []).length, 1, "only the governor does");
  ok("R4", "no light, material or shadow map changes in play");
}
// R5
{
  assert.ok(/playing=\{ who, t0:now\(\), fire, target:pick,[^\n]*\}; fired=\{\}; if\(GOV\) GOV\.hold\(true\);/.test(page), "a turn holds the governor from its start");
  assert.ok(page.includes("turn++; playing=null; if(GOV) GOV.hold(false);"), "to its end");
  const docs = read("docs/QUALITY_LEVELS.md");
  assert.match(docs, /Russian Roulette[\s\S]{0,60}dust motes[\s\S]{0,120}half its smoke puffs and sparks[\s\S]{0,160}café tables/);
  ok("R5", "a turn is one beat; docs/QUALITY_LEVELS.md lists Roulette's ladder");
}
// R6
{
  // The real js/gfxTier.js, with a stand-in page: a stage box holding the WebGL canvas.
  const mountTier = ({reduce = false, position = "fixed"} = {}) => {
    const log = [], timers = [], frames = [], kids = [];
    const win = {matchMedia: q => ({matches: reduce && /reduce/.test(q)}), getComputedStyle: () => ({position}),
      requestAnimationFrame: f => { frames.push(f); return frames.length; }, setTimeout: (f, ms) => { timers.push({f, ms}); return timers.length; }};
    const make = () => { const c = {width: 0, height: 0, style: {cssText: "", opacity: ""}, attrs: {}, setAttribute(k, v) { c.attrs[k] = v; },
      getContext: kind => ({drawImage: (src, x, y, w, h) => log.push(["copy", kind, src === canvas, x, y, w, h, drawn])}), remove() { kids.splice(kids.indexOf(c), 1); log.push(["removed"]); }}; return c; };
    const doc = {defaultView: win, createElement: tag => { assert.equal(tag, "canvas"); return make(); }, documentElement: {dataset: {}}, body: {append() {}}};
    const box = {appendChild: c => { kids.push(c); }, querySelectorAll: sel => { assert.equal(sel, "canvas[data-gfx-cut]"); return kids.slice(); }};
    let drawn = 0; const canvas = {width: 1920, height: 866, parentElement: box, ownerDocument: doc};
    const ctx = {document: {createElement: () => ({getContext: () => null, style: {}, setAttribute() {}, append() {}, remove() {}}), body: {append() {}}, documentElement: {dataset: {}}},
      devicePixelRatio: 1, navigator: {deviceMemory: 4, hardwareConcurrency: 2}, screen: {width: 1920, height: 1080}, location: {search: "", origin: "http://x"},
      readStorageValue: () => null, writeStorageValue: () => true, performance: {now: () => 0}, setTimeout: () => 0, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, URLSearchParams};
    ctx.globalThis = ctx; ctx.parent = ctx; vm.createContext(ctx); vm.runInContext(read("js/gfxTier.js"), ctx);
    return {G: ctx.CareerModeGfxTier, canvas, kids, log, timers, frames, draw: () => { drawn += 1; }, drawn: () => drawn};
  };
  const m = mountTier();
  assert.equal(typeof m.G.softCut, "function");
  assert.equal(m.G.softCut(m.canvas, m.draw), true);
  assert.equal(m.drawn(), 1, "the scene is drawn in the same task, so the canvas holds a frame to copy");
  assert.deepEqual(m.log, [["copy", "2d", true, 0, 0, 1920, 866, 1]], "the whole frame, after that draw");
  assert.equal(m.kids.length, 1, "the copy lies in the stage, over the canvas");
  const copy = m.kids[0];
  assert.equal(copy.attrs["aria-hidden"], "true"); assert.equal(copy.attrs["data-gfx-cut"], "1");
  assert.match(copy.style.cssText, /^position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:1;transition:opacity 420ms ease-out$/, "over the canvas only, takes no pointer, starts as the old frame");
  m.frames.shift()(); assert.equal(copy.style.opacity, "", "the fade starts once the copy has been shown"); m.frames.shift()(); assert.equal(copy.style.opacity, "0");
  assert.deepEqual(m.timers.map(t => t.ms), [720]); m.timers[0].f(); assert.equal(m.kids.length, 0, "and the copy is gone after the fade");
  // A second step before the first fade ends: one copy at a time.
  const twice = mountTier(); twice.G.softCut(twice.canvas, twice.draw); twice.G.softCut(twice.canvas, twice.draw); assert.equal(twice.kids.length, 1);
  // A 4K frame is copied at 2560 px on its long side at most.
  const big = mountTier(); big.canvas.width = 3840; big.canvas.height = 2160; big.G.softCut(big.canvas, big.draw);
  assert.deepEqual(big.log[0].slice(3), [0, 0, 2560, 1440, 1]); assert.deepEqual([big.kids[0].width, big.kids[0].height], [2560, 1440]);
  // Reduce Motion, a box that is not positioned, a canvas off the page, a draw that throws: a plain cut, nothing added, no throw.
  const still = mountTier({reduce: true}); assert.equal(still.G.softCut(still.canvas, still.draw), false); assert.deepEqual([still.kids.length, still.drawn()], [0, 0]);
  const flat = mountTier({position: "static"}); assert.equal(flat.G.softCut(flat.canvas, flat.draw), false); assert.equal(flat.kids.length, 0);
  const off = mountTier(); off.canvas.parentElement = null; assert.equal(off.G.softCut(off.canvas, off.draw), false);
  const bad = mountTier(); assert.equal(bad.G.softCut(bad.canvas, () => { throw new Error("lost"); }), false); assert.equal(bad.kids.length, 0);
  assert.equal(mountTier().G.softCut(null), false);
  // The stage is a positioned box that holds only the canvas, under the whole HUD.
  assert.ok(page.includes("#stage { position: fixed; inset: 0; }") && page.includes("#stage canvas { display: block; width: 100%; height: 100%; }"));
  assert.ok(page.includes('<body>\n<div id="stage" aria-hidden="true"></div>\n<div class="hud">'), "the stage comes first on the page: the HUD is drawn over it and over the fading copy");
  ok("R6", "a step in play is a soft cut inside the stage, a plain cut under Reduce Motion");
}
console.log(`PASS r91 roulette ladder contracts (${results.length} checks)`);
