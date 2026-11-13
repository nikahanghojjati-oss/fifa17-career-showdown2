"use strict";
// r90 one quality system for every screen (Nik 2026-11-08: "no screen should have a setting for a level that the other
// screen don't have ... we all should have one shared system"). docs/QUALITY_LEVELS.md is the written framework; this
// contract keeps every screen on it.
//   Q1 one list of six levels: the doc, js/gfxTier.js (names, labels, choices) and Settings agree.
//   Q2 every 3D page joins through CareerModeGfxTier: profile() before the renderer, its pixel ratio, its governor.
//   Q3 no screen picks its own level: no device signals, no per-page phone tier, no pixel ratio or URL switch of its own.
//   Q4 2D screens read html[data-gfx] (0..5) and html[data-assets] (0..4) only.
//   Q5 a player reads only the shared names: Settings, the Device check and the ?fps=1 overlay take them from gfxTier.labels.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
const walk=(dir,test,out=[])=>{for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const p=path.posix.join(dir,e.name);
  if(e.isDirectory()){if(!/^(node_modules|vendor|three)$/.test(e.name))walk(p,test,out);}else if(test(p))out.push(p);}return out;};
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/<!--[\s\S]*?-->/g,"").replace(/(^|[^:"'`\\])\/\/.*$/gm,"$1");

const LABELS=["Light","Balanced","High","Extra","Ultra (4K)","8K"];
const tier=read("js/gfxTier.js"),doc=read("docs/QUALITY_LEVELS.md"),settings=read("js/settings.js");

// Q1
{
  assert.ok(tier.includes(`const LABELS=${JSON.stringify(LABELS)};`),"gfxTier has the one label list");
  assert.ok(tier.includes('const NAMES=["light","medium","high","extra","ultra","8k"];')&&tier.includes('const CHOICES=["auto","light","medium","high","extra","ultra","8k"];'),"six levels, Auto plus each as a choice");
  assert.ok(/labels:LABELS\.slice\(\)/.test(tier)&&/label\(level\)\{return LABELS\[/.test(tier),"the labels are exported");
  const rows=[...doc.matchAll(/^\| (\d) \| ([^|]+?) \|/gm)].map(m=>[Number(m[1]),m[2]]);
  assert.deepEqual(rows,LABELS.map((l,i)=>[i,l]),"the doc's table names the same six levels in the same order");
  ok("Q1","one list of six levels: Light, Balanced, High, Extra, Ultra (4K), 8K (doc, module, choices)");
}

// Q2: every page that makes a WebGL renderer (the tools/ converters are offline helpers, not screens).
const SCREENS=walk(".",p=>/\.(js|html)$/.test(p)&&!/^(tools|tests|chronicle)\//.test(p)&&!p.startsWith("node_modules"))
  .filter(p=>p!=="js/gfxTier.js");
const GL=SCREENS.filter(p=>/new (T|THREE)\.WebGLRenderer\(/.test(read(p)));
{
  assert.deepEqual(GL.slice().sort(),["js/chamberMenScene3d.js","visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/special-player/index.html"],"the three 3D screens (a new one joins this list and the rules)");
  for(const p of GL){
    const s=strip(read(p));
    assert.ok(/CareerModeGfxTier/.test(s)&&/\.profile\(\)/.test(s),`${p}: reads CareerModeGfxTier.profile()`);
    assert.ok(/\.governor\(renderer/.test(s),`${p}: runs the shared governor`);
    for(const m of s.matchAll(/setPixelRatio\(([^)]*)\)/g))assert.ok(!/\d|devicePixelRatio/.test(m[1]),`${p}: no pixel ratio of its own (setPixelRatio(${m[1]}))`);
  }
  ok("Q2","every 3D screen joins through CareerModeGfxTier: profile, its pixel ratio, its governor");
}

// Q3
{
  // Density pickers for image-set() plates and a confetti canvas match what the browser draws; they pick no quality.
  // Prime Pack's stage picks its 4K-wide art only where the screen is that sharp and data-gfx is Extra or above; RRR's café
  // hall does the same for its 4K room art (Extra and above, and a screen over 2560 device pixels).
  const DENSITY_ONLY=new Set(["js/connectPlayersScreenV10.js","js/ssjr.js","js/v10Screens.js","visual-assets/v10_1/shared/motion.js","visual-assets/v10_1/icon-guess/index.html","visual-assets/v10_1/roulette/index.html"]);
  for(const p of SCREENS){
    const s=strip(read(p));
    if(/WEBGL_debug_renderer_info|\bhardwareConcurrency\b|\bdeviceMemory\b/.test(s))assert.fail(`${p}: reads a device signal to pick quality (gfxTier does that)`);
    if(/\bdevicePixelRatio\b/.test(s))assert.ok(DENSITY_ONLY.has(p),`${p}: reads devicePixelRatio (only gfxTier and the listed density pickers may)`);
    // Reading a quality switch is gfxTier's (the Device check only builds ?gfx=N URLs for gfxTier to read). A 2D frame
    // that mirrors its parent's html[data-gfx] may read the same ?gfx=0..5 when it runs on its own (a preview); no other name
    // or range.
    for(const line of s.split("\n"))if(/\.get\(\s*["'](gfx|quality|tier|level)["']\s*\)/.test(line)){
      assert.ok(/\.get\(\s*["']gfx["']\s*\)/.test(line)&&line.includes("/^[0-5]$/")&&/dataset\.gfx/.test(s),`${p}: a quality URL switch of its own (?gfx belongs to gfxTier)`);}
  }
  for(const p of GL){
    const s=strip(read(p));
    assert.ok(!/pointer:\s*coarse/.test(s)&&!/\bPHONE_GPU\b/.test(s),`${p}: no phone tier of its own (gfxTier's profile knows the phone)`);
  }
  ok("Q3","no screen picks its own level: no device signals, no phone tier, no URL switch of its own");
}

// Q4
{
  const css=walk(".",p=>/\.(css|html)$/.test(p)&&!/^(tools|tests|node_modules)\//.test(p));
  let seen=0;
  for(const p of css){
    const s=read(p);
    for(const m of s.matchAll(/data-gfx\s*(\^|\$|\*|~|\|)?=\s*["']?([^"'\]\s]*)/g)){seen+=1;assert.ok(!m[1]&&/^[0-5]$/.test(m[2]),`${p}: data-gfx="${m[2]}" (0..5 only)`);}
    for(const m of s.matchAll(/data-assets\s*(\^|\$|\*|~|\|)?=\s*["']?([^"'\]\s]*)/g)){seen+=1;assert.ok(!m[1]&&/^[0-4]$/.test(m[2]),`${p}: data-assets="${m[2]}" (0..4 only)`);}
  }
  assert.ok(tier.includes("if(el.dataset.gfx!==v)el.dataset.gfx=v;"),"gfxTier sets html[data-gfx]");
  ok("Q4",`2D screens read html[data-gfx] 0..5 and html[data-assets] 0..4 only (${seen} selectors today)`);
}

// Q5
{
  assert.ok(settings.includes('value === "auto" ? getSettingsGfxAutoLabel(tier) : tier.labels[index - 1]')&&settings.includes('const name = tier.label(tier.suggested().now);')&&settings.includes("tier.label(onAuto ? s.now : s.level)"),"Settings names levels from gfxTier.labels");
  assert.ok(!/SETTINGS_GFX_(CHOICES|NAMES)/.test(settings),"Settings keeps no list of its own");
  const dc=read("device-check.html");
  assert.ok(dc.includes("const LEVELS=window.CareerModeGfxTier.labels.slice();"),"the Device check names levels from gfxTier.labels (r91: all six, 8K where can8k())");
  assert.ok(tier.includes("`${LABELS[built]} (${p.auto?\"Auto\":\"picked\"}")&&tier.includes("fell back from ${LABELS[p.fellBack.from]} to ${LABELS[p.level]}"),"the ?fps=1 overlay names levels from the same list (r91: the level the scene was built at)");
  // No other list of level names anywhere a player could read it.
  const OLD=/\[\s*["'](Light|Low)["']\s*,\s*["'](Balanced|Medium)["']/;
  for(const p of SCREENS.concat(["device-check.html","device-check-chamber.html"]))assert.ok(!OLD.test(strip(read(p))),`${p}: a level-name list of its own`);
  for(const p of SCREENS){const s=strip(read(p));assert.ok(!/["'`](Extra high|Medium quality|Low quality|4K quality)["'`]/i.test(s),`${p}: an old level name a player could read`);}
  ok("Q5","a player reads only Light, Balanced, High, Extra, Ultra (4K) and 8K, from gfxTier.labels (Settings, Device check, ?fps=1)");
}
console.log(`PASS r90 quality levels contracts (${checks} checks)`);
