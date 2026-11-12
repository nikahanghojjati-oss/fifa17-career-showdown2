"use strict";
// r91 Special Player pack heavy-parts ladder (Sol 6.1 review of 2.3.0; Nik 2026-11-11 14:33 UTC: "heavy parts like crowd,
// shadows and glow are fixed when the scene loads, so a slow device keeps paying for them"). The pack scene offers its glow
// chain and edge smoothing to the shared governor (js/gfxTier.js, detail:{steps,apply}), which walks them only on Auto and
// only between reveals. In 2.3.0 the scene held the governor only inside the Device check, so in play the resolution could
// change in the middle of a reveal. The scene's own ladder code runs here, cut from the real page, against stand-ins:
//   P1 the ladder holds only parts the level has (Light has none), smallest loss first, and goes to the governor
//   P2 step 0 is the scene as built; every step's state; any step from any other lands where going there directly does
//   P3 edge smoothing: the level's own rule as built (8 up to a 1080p buffer, 4 past it), one step down at "edges", never under 2
//   P4 what was tuned for the blur chain follows what is drawn now (the pillar's strength, the sparkle count, the composite)
//   P5 every reveal is one held beat, in play as in the Device check; docs/QUALITY_LEVELS.md lists the ladder
//   P6 a step in play is a soft cut (js/gfxTier.js softCut, proven in r91-roulette-ladder-contracts R6): the stage is a
//      positioned box that holds only the canvas, under the whole HUD
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const results = []; const ok = (id, label) => { results.push(id); console.log(`ok ${results.length} ${id} ${label}`); };
const page = read("visual-assets/v10_1/special-player/index.html");
const cut = (src, from, to) => { const a = src.indexOf(from); assert.ok(a >= 0, `found: ${from.slice(0, 50)}`); assert.equal(src.indexOf(from, a + 1), -1, `once: ${from.slice(0, 50)}`);
  const b = src.indexOf(to, a); assert.ok(b > a, `found after it: ${to.slice(0, 50)}`); return src.slice(a, b); };
const LADDER_SRC = cut(page, "const HEAVY=!BLOOM?[]:", "function startGfx(){");
// level: 0 Light (no post chain), 1 Balanced (2 samples, quarter-size mips), 2 High (4, half-size), 3 Extra (8, half-size)
// offers: the sample counts the GPU lists (js/gfxTier.js samples(): the largest one not above what is asked, else none)
function mount(level, offers = [8, 4, 2]) {
  const BLOOM = level > 0, GQ = {samples: [2, 2, 4, 8, 8][level]}, BLOOM_D = level <= 1 ? 4 : 2, env = {resizes: 0};
  const fitSamples = want => offers.find(n => n <= want) ?? 0;
  const compMat = {uniforms: {bloomOn: {value: BLOOM ? 1 : 0}}};
  const m = new Function("BLOOM", "GQ", "BLOOM_D", "compMat", "env", "fitSamples", `let bloomLive=BLOOM, bloomDiv=BLOOM_D, edgesDown=false; const resize=()=>{env.resizes+=1;};
    ${LADDER_SRC}
    return {heavy,LADDER:HEAVY,state:()=>({at:detailAt,bloom:bloomLive,bloomDiv,edgesDown,uniform:compMat.uniforms.bloomOn.value})};`)(BLOOM, GQ, BLOOM_D, compMat, env, fitSamples);
  return {...m, env, BLOOM_D};
}

// P1
{
  assert.deepEqual(mount(0).LADDER, [], "Light draws straight to the screen: nothing to give up");
  assert.deepEqual(mount(1).LADDER, ["glow", "bloom"], "Balanced already draws 2 samples");
  assert.deepEqual(mount(2).LADDER, ["glow", "edges", "bloom"]);
  assert.deepEqual(mount(3).LADDER, ["glow", "edges", "bloom"]);
  // A GPU that does not offer the lower count (iOS and software GL list 4 only) has no edges step: 4 samples never become none.
  assert.deepEqual(mount(2, [4]).LADDER, ["glow", "bloom"], "High on a GPU that lists 4 only");
  assert.deepEqual(mount(3, [4]).LADDER, ["glow", "edges", "bloom"], "Extra asks 8, draws 4 there; the step would ask 4: still 4, so the scene keeps its edges (P3)");
  assert.deepEqual(mount(3, [8, 4]).LADDER, ["glow", "edges", "bloom"], "Extra on a GPU with 8 and 4");
  assert.ok(page.includes('gov=GFX.governor(renderer,{key:"sp",draw:render,beats:true,...(HEAVY.length?{detail:{steps:HEAVY.length,apply:heavy}}:{}),before:()=>GFX.softCut?.(renderer.domElement,render),onChange(p){ PR=p.pixelRatio; resize(); },info:()=>({bloom:BLOOM,direct:DIRECT,samples:sceneRT.samples|0})});'),
    "the governor gets the ladder; the Device check's record keeps its shape");
  assert.equal((page.match(/GFX\.governor\(/g) || []).length, 1, "one governor");
  // The page's own script parses: a name declared twice stops the whole pack from loading (the first draft named this
  // ladder LADDER, which the rating-ladder colours already use; only the browser look check caught it).
  const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(code => code.trim());
  assert.ok(scripts.length >= 1 && scripts.some(code => code.includes("const HEAVY=!BLOOM?[]:")));
  for (const code of scripts) assert.doesNotThrow(() => new vm.Script(code, {filename: "special-player/index.html"}), "every inline script on the page parses");
  assert.ok(page.includes("const BLOOM=!DIRECT&&!(GP&&GP.bloom===false), BLOOM_D=GL_LVL<=1?4:2;") && page.includes("let bloomLive=BLOOM, bloomDiv=BLOOM_D, edgesDown=false;"), "as built until a step is taken");
  ok("P1", "the ladder holds only parts the level has and goes to the shared governor");
}
// P2
{
  for (const level of [1, 2, 3]) {
    const base = mount(level), D = base.BLOOM_D, names = base.LADDER;
    const row = at => { const on = new Set(names.slice(0, at)); return {at, bloom: !on.has("bloom"), bloomDiv: D * (on.has("glow") ? 2 : 1), edgesDown: on.has("edges"), uniform: on.has("bloom") ? 0 : 1}; };
    assert.deepEqual(base.state(), row(0), "as built before any step"); assert.equal(base.env.resizes, 0);
    const n = names.length;
    for (let from = 0; from <= n; from += 1) for (let to = 0; to <= n; to += 1) {
      const m = mount(level); m.heavy(from, "start"); const before = m.env.resizes; m.heavy(to, to < from ? "restore" : "slow");
      assert.deepEqual(m.state(), row(to), `level ${level}: step ${from} to ${to}`);
      assert.equal(m.env.resizes - before, from === to ? 0 : 1, "one re-size of the targets per change, none when nothing changes");
    }
    const m = mount(level); m.heavy(99, "slow"); assert.equal(m.state().at, n); m.heavy(-1, "restore"); assert.deepEqual(m.state(), row(0));
  }
  const light = mount(0); light.heavy(1, "slow"); assert.deepEqual(light.state(), {at: 0, bloom: false, bloomDiv: 4, edgesDown: false, uniform: 0}, "Light has no step to take");
  ok("P2", "step 0 is the scene as built; every step is the same from any other step");
}
// P3
{
  const RULE = "const smpWant=pw*ph>1920*1080?Math.min(4,GQ.samples):GQ.samples, smpLow=edgesDown?fitSamples(Math.max(2,smpWant>>1)):0, smp=DIRECT?0:smpLow>=2?smpLow:fitSamples(smpWant), newSmp=";
  assert.ok(page.includes(RULE));
  // The rule itself, cut from the page, with the GPU's list of sample counts.
  const smp = (samples, px, down, offers = [8, 4, 2]) => new Function("pw", "ph", "GQ", "edgesDown", "fitSamples", "DIRECT",
    `${RULE.slice(0, RULE.lastIndexOf(", newSmp="))}; return smp;`)(px, 1, {samples}, down, want => offers.find(n => n <= want) ?? 0, false);
  assert.deepEqual([smp(8, 1920 * 866, false), smp(8, 1920 * 866, true)], [8, 4], "Extra on the Chromebook's window: 8, then 4");
  assert.deepEqual([smp(8, 3840 * 2160, false), smp(8, 3840 * 2160, true)], [4, 2], "past a 1080p buffer: 4, then 2");
  assert.deepEqual([smp(4, 1920 * 1035, false), smp(4, 1920 * 1035, true)], [4, 2], "High: 4, then 2");
  assert.equal(smp(2, 1920 * 866, true), 2, "never under 2");
  // A GPU that lists 4 only: the step never turns edge smoothing off.
  assert.deepEqual([smp(8, 1920 * 866, false, [4]), smp(8, 1920 * 866, true, [4])], [4, 4]);
  assert.deepEqual([smp(8, 3840 * 2160, false, [4]), smp(8, 3840 * 2160, true, [4])], [4, 4], "asked 2, offered none: it keeps 4");
  assert.deepEqual([smp(4, 1920 * 1035, false, [4]), smp(4, 1920 * 1035, true, [4])], [4, 4]);
  assert.ok(page.includes('const HEAVY=!BLOOM?[]:["glow",...(GQ.samples>=4&&fitSamples(Math.max(2,GQ.samples>>1))>=2?["edges"]:[]),"bloom"]; let detailAt=0;'));
  assert.ok(page.includes("if(BLOOM) for(let i=0;i<LV;i++){ const d=bloomDiv*Math.pow(2,i); mipA[i].setSize("), "the blur chain's size follows the ladder");
  ok("P3", "edge smoothing steps down once from the level's own rule, never under 2; the blur chain halves");
}
// P4
{
  assert.ok(page.includes("if(bloomLive){ brightMat.uniforms.tex.value=sceneRT.texture; pass(brightMat,mipA[0]);"), "no blur passes when the chain is off");
  assert.ok(page.includes("*(camera.aspect<1?.6:1)*(bloomLive?.42:1));"), "the pillar's strength follows the glow drawn now");
  assert.ok(page.includes("const n=Math.round((tt<4.5?8:4)*(bloomLive?1:.6));"), "so does the sparkle count");
  assert.ok(/if\(bloomOn>\.5\) b=texture2D\(b0,vUv\)[^\n]*else b=max\(c-vec3\(\.8\),vec3\(0\.\)\)\*1\.6;/.test(page), "the composite has the cheap in-place glow for when the chain is off");
  const code = LADDER_SRC.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const word of ["setPixelRatio", "castShadow", "shadow", "scene.add", "scene.remove", "requestAnimationFrame", "devicePixelRatio", "new T."]) assert.ok(!code.includes(word), `the ladder does not touch ${word}`);
  assert.equal((page.replace(/\/\*[\s\S]*?\*\//g, "").match(/heavy\(/g) || []).length, 1, "heavy() is declared once and nothing on the page calls it");
  assert.equal((page.match(/apply:heavy/g) || []).length, 1, "only the governor does");
  ok("P4", "what was tuned for the blur chain follows what is drawn; no shader is compiled in play");
}
// P5
{
  assert.ok(/function startPlayer\(i,bridge\)\{\n  if\(gov\) gov\.hold\(true\);/.test(page), "a reveal holds the governor from its first frame, in play too");
  assert.ok(page.includes("  if(gov) gov.hold(false); /* r91: the reveal is done; the handover and the settled card are between beats */\n  if(BENCH&&gov&&idx===1) later(replay,1500);"), "and lets go when the card has settled; only the Device check replays");
  assert.ok(!/BENCH&&gov\) gov\.hold/.test(page), "the hold is no longer the Device check's alone");
  assert.ok(page.includes("function skip(){ if(phase===\"run\") settle(); }") && page.includes("  if(REDUCED) settle();"), "a skipped reveal and Reduce Motion end through settle() too");
  const docs = read("docs/QUALITY_LEVELS.md");
  assert.match(docs, /Special Player[\s\S]{0,60}blur chain at half its size[\s\S]{0,160}edge smoothing one step down[\s\S]{0,260}no blur chain/);
  ok("P5", "every reveal is one held beat; docs/QUALITY_LEVELS.md lists the pack's ladder");
}
// P6
{
  assert.ok(/softCut:gfxSoftCut,/.test(read("js/gfxTier.js")), "the shared soft cut is on the tier's API");
  assert.ok(page.includes("#stage { position: fixed; inset: 0; touch-action: none; }") && page.includes("#stage canvas { display: block; width: 100%; height: 100%; }"), "the copy fills the stage as the canvas does");
  assert.ok(/<div id="stage"[^>]*><\/div>/.test(page), "the stage holds only what the scene appends to it");
  const body = page.slice(page.indexOf("</style>")), stageAt = body.indexOf('<div id="stage"');
  for (const id of ["top", "bottom"]) { const at = body.indexOf(`id="${id}"`); assert.ok(at > stageAt && stageAt >= 0, `#${id} comes after the stage on the page, so it is drawn over the scene and over the fading copy`); }
  assert.ok(page.includes("stage.appendChild(renderer.domElement);"));
  ok("P6", "a step in play is a soft cut inside the stage");
}
console.log(`PASS r91 special player ladder contracts (${results.length} checks)`);
