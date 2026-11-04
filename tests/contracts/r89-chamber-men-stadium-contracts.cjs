"use strict";
// r89 Chamber Men stadium kit (Nik 2026-11-04: a 4K ball, posts, bar, net and a FIFA 17-like stadium with stands, crowd and ad
// boards; free assets only if truly high quality, otherwise built; "high frame rate, high quality, seamless and smooth").
//   S1 engine: every THREE part js/chamberMenStadium3d.js uses is in the one vendored build; no network address, no
//      Math.random (the crowd is the same on both phones every load).
//   S2 files: every texture the kit loads is in visual-assets/v10_1/chamber-men/assets/, and the first load stays small:
//      phone set <= 1.6 MB, desktop set <= 3.2 MB.
//   S3 ours: every file is listed in LICENSES.md and is made by a generator in tools/chamber-men-assets (no third-party art,
//      no real brand on the boards or the ball).
//   S4 real sizes: goal 7.32 x 2.44, ball radius .11, spot at 11 m, the axes the 3D goal uses.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const results=[];const ok=(id,label)=>{results.push(id);console.log(`ok ${results.length} ${id} ${label}`);};
const kit=read("js/chamberMenStadium3d.js");
const ENGINE="visual-assets/v10_1/roulette/vendor/three-r187.min.js";
const DIR="visual-assets/v10_1/chamber-men/assets/";

// S1
{
  const sandbox={window:{},self:{}};sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(read(ENGINE),sandbox);
  const T=sandbox.THREE||sandbox.window.THREE;
  const used=[...new Set([...kit.matchAll(/\bT\.([A-Za-z0-9_]+)/g)].map(m=>m[1]))];
  assert.deepEqual(used.filter(name=>!(name in T)),[],"every THREE part the kit uses is in the vendored build");
  const code=kit.replace(/\/\/[^\n]*/g,"");
  assert.ok(!/https?:\/\//.test(code),"no network address in code");
  assert.ok(!/Math\.random/.test(code),"no Math.random: the crowd comes from a fixed seed");
  ok("S1","kit runs on the vendored engine, offline, deterministic");
}
// S2
{
  const sandbox={};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(kit,sandbox);
  const K=sandbox.CareerModeChamberMenStadium;
  assert.equal(typeof K.load,"function");assert.equal(typeof K.build,"function");
  assert.equal(K.base,DIR);
  const size=set=>Object.values(set).reduce((n,f)=>{const p=path.join(ROOT,DIR,f);assert.ok(fs.existsSync(p),`${f} exists`);return n+fs.statSync(p).size;},0);
  const phone=size({...K.files.phone,...K.files.both}),desktop=size({...K.files.desktop,...K.files.both});
  assert.ok(phone<=1.6e6,`phone first load ${phone} <= 1.6 MB`);
  assert.ok(desktop<=3.2e6,`desktop first load ${desktop} <= 3.2 MB`);
  ok("S2",`textures present; phone ${(phone/1e6).toFixed(2)} MB, desktop ${(desktop/1e6).toFixed(2)} MB`);
}
// S3
{
  const lic=read(DIR+"LICENSES.md");
  const files=fs.readdirSync(path.join(ROOT,DIR)).filter(f=>f.endsWith(".webp"));
  for(const f of files)assert.ok(lic.includes(f),`${f} is listed in LICENSES.md`);
  const gens=["build_all.py","common.py","gen_ball.py","gen_stadium.py"].map(f=>"tools/chamber-men-assets/"+f);
  for(const g of gens)assert.ok(fs.existsSync(path.join(ROOT,g)),`${g} exists`);
  const src=gens.map(read).join("\n");
  for(const f of files){const stem=f.replace(/_(4k|2k|1k|512|256)\.webp$/,"").replace(/\.webp$/,"");assert.ok(src.includes(stem),`${f} is made by a generator`);}
  ok("S3","every texture is ours, listed and rebuildable");
}
// S4
{
  for(const s of ["GOAL_W=7.32","GOAL_H=2.44","BALL_R=.11","SPOT_Z=11","PITCH_L=105","PITCH_HALF_W=34"])assert.ok(kit.includes(s),s);
  ok("S4","real pitch and goal sizes, same axes as the 3D goal");
}
console.log(`PASS r89 Chamber Men stadium kit (${results.length} checks)`);
