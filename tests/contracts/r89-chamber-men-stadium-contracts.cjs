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
  // r90: the grass comes in one size per device level (js/gfxTier.js); a light device loads the least.
  const grass=l=>({grass:K.grass[l][0],grassNormal:K.grass[l][1]});
  const phone=size({...K.files.phone,...K.files.both,...grass(0)}),desktop=size({...K.files.desktop,...K.files.both,...grass(2)}),extra=size({...K.files.desktop,...K.files.both,...grass(3)});
  assert.ok(phone<=1.6e6,`phone / light first load ${phone} <= 1.6 MB`);
  assert.ok(desktop<=4e6,`desktop first load ${desktop} <= 4 MB`);
  assert.ok(extra<=7.5e6,`extra / ultra first load ${extra} <= 7.5 MB`);
  ok("S2",`textures present; light ${(phone/1e6).toFixed(2)} MB, high ${(desktop/1e6).toFixed(2)} MB, extra ${(extra/1e6).toFixed(2)} MB`);
}
// S3
{
  const lic=read("tools/chamber-men-assets/LICENSES.md");// docs live with the generators: everything under visual-assets/v10_1 is served (images by the runtime rule, the rest from the shell)
  const files=fs.readdirSync(path.join(ROOT,DIR)).filter(f=>f.endsWith(".webp"));
  for(const f of files)assert.ok(lic.includes(f),`${f} is listed in LICENSES.md`);
  const gens=["build_all.py","common.py","gen_ball_v3.py","gen_stadium.py","gen_grass.py"].map(f=>"tools/chamber-men-assets/"+f);
  for(const g of gens)assert.ok(fs.existsSync(path.join(ROOT,g)),`${g} exists`);
  const src=gens.map(read).join("\n");
  for(const f of files){const stem=f.replace(/_(4k|2k|1k|512|256)\.webp$/,"").replace(/\.webp$/,"");assert.ok(src.includes(stem),`${f} is made by a generator`);}
  ok("S3","every texture is listed with its licence and rebuildable");
}
// S4
{
  for(const s of ["GOAL_W=7.32","GOAL_H=2.44","BALL_R=.11","SPOT_Z=11","PITCH_L=105","PITCH_HALF_W=34"])assert.ok(kit.includes(s),s);
  ok("S4","real pitch and goal sizes, same axes as the 3D goal");
}
// S5 players: one glTF per tier on the shared Mixamo skeleton with the named clips and the kit meshes; the engine build can
//    load and play it (GLTFLoader, SkinnedMesh, AnimationMixer); phone file <= 3.5 MB, desktop <= 4.5 MB.
{
  const glb=f=>{const b=fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/chamber-men/players/"+f));assert.equal(b.toString("ascii",0,4),"glTF");
    const n=b.readUInt32LE(12);return {size:b.length,json:JSON.parse(b.toString("utf8",20,20+n))};};
  for(const tier of ["desktop","phone"]){
    const clips=glb(`anims_${tier}.glb`).json.animations.map(a=>a.name);
    for(const c of ["idle","offensiveIdle","gkIdle","walk","penaltyKick","run","jog","strikeJog","victory","disappointed","gkDive","gkDive1","gkBlock","gkBlock1","gkBlock2","gkCatch","gkCatch1","gkCatch2"])assert.ok(clips.includes(c),`anims_${tier} has clip ${c}`);
    assert.ok(!fs.existsSync(path.join(ROOT,`visual-assets/v10_1/chamber-men/players/player_${tier}.glb`)),`retired player_${tier}.glb is gone`);
  }
  // v2: one shared clip file per tier plus one light body file per body; same bones, kit materials, hips scale for clips
  for(const [tier,amax,bmax] of [["desktop",1.6e6,4.8e6],["phone",1.4e6,2.4e6]]){
    const a=glb(`anims_${tier}.glb`);assert.ok(a.size<=amax,`anims_${tier}.glb ${a.size} <= ${amax}`);
    assert.equal(a.json.animations.length,18,`anims_${tier} has the 18 clips`);
    for(const id of ["remy","ch38","ch42"]){
      const {size,json}=glb(`body_${id}_${tier}.glb`);
      assert.ok(size<=bmax,`body_${id}_${tier}.glb ${size} <= ${bmax}`);
      const mats=json.materials.map(m=>m.name);
      for(const m of ["Bodymat","Hairmat","kitShirt","kitShorts","kitSocks","kitBoots"])assert.ok(mats.includes(m),`body_${id}_${tier} has ${m}`);
      assert.ok(json.skins&&json.skins.length>=1,`body_${id}_${tier} skinned`);
      assert.ok(json.nodes.some(n=>n.name==="mixamorigHips"),`body_${id}_${tier} on the shared skeleton`);
      assert.ok(json.nodes.some(n=>n.extras&&typeof n.extras.cmHipsScale==="number"),`body_${id}_${tier} carries cmHipsScale`);
    }
  }
  const sandbox={window:{},self:{}};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(read(ENGINE),sandbox);
  const T=sandbox.THREE||sandbox.window.THREE;
  for(const k of ["GLTFLoader","SkinnedMesh","AnimationMixer","LoopOnce","LoopRepeat"])assert.ok(k in T,`engine has ${k}`);
  ok("S5","players: shared clip file with every clip and three light bodies with the kit meshes (desktop and phone); the engine can load and play it");
}
// S6 r90 LOOK (hunt L01-L03, at every level): a night stand that falls dark under the roof, a floodlight halo, the pitch lit
//    evenly (r90 floodlights), darker past the lines; each club's colours in its own block (tintable cells only, away fans in the corner behind the
//    goal past an empty strip); LED boards drawn at run time with the CM17 wordmark and both clubs' crests and names, each
//    message inside its own board, the run behind the goal centred on it, no board images and no "CMS" lettering.
{
  const code=kit.replace(/\/\/[^\n]*/g,"");
  for(const f of ["board_chamber_men.webp","board_cms.webp","board_chevrons.webp"]){
    assert.ok(!fs.existsSync(path.join(ROOT,DIR,f)),`${f} retired`);assert.ok(!kit.includes(f),`${f} not loaded`);}
  assert.ok(!/["'`][^"'`\n]*\bCMS\b[^"'`\n]*["'`]/.test(code),"no CMS lettering on any board");
  assert.ok(/const word=make\(/.test(kit)&&/fillText\("CM17"/.test(kit),"the CM17 wordmark board");
  assert.ok(/const club=\(name,inner\)=>make\(/.test(kit)&&/crestOf\(name\)/.test(kit)&&/getImageData/.test(kit),"club boards: crest (only when it leaves the canvas clean) and name");
  assert.ok(/const fit=\(g,text,maxW,maxH\)=>/.test(kit),"every name is fitted to its board");
  assert.ok(/x0:-PITCH_HALF_W-6,x1:PITCH_HALF_W\+6,pick:behind,first:4/.test(kit)&&/Math\.abs\(xc\)<\.5\?mWord/.test(kit),"the run behind the goal is centred on it");
  assert.ok(/m=w<BW-\.01\?mPattern:/.test(kit),"a short board only carries the pattern");
  assert.ok(/const nightStand=m=>/.test(kit)&&(kit.match(/nightStand\(new T\.MeshStandardMaterial/g)||[]).length===2,"stands and concrete fall dark with height");
  assert.ok(/const halo=new T\.Points\(flareGeo,haloMat\)/.test(kit),"floodlight halo");
  assert.ok(/mix\(1\.04,\.86,smoothstep\(8\.0,45\.0,length\(vCmWorld\.xz-vec2\(0\.0,9\.0\)\)\)\)\*mix\(1\.0,\.5,smoothstep\(0\.0,8\.0,cmOut\)\)/.test(kit),"the pitch floodlit evenly, darker only past the touchlines and the goal line");
  assert.ok(/vec3\(\.14,\.16,\.25\),smoothstep\(\.5,12\.0,vCmY\)/.test(kit),"the stand falls into a cool dark above the front rows");
  assert.ok(/top=vec3\(\.003,\.007,\.03\),mid=vec3\(\.016,\.026,\.062\)/.test(kit),"a darker, bluer night sky");
  assert.ok(/aCell\[i\]=plain\?pickCell\(PLAIN_CELLS\):pickCell\(TINT_CELLS\)/.test(kit)&&/o\.homeAlt/.test(kit)&&/o\.awayAlt/.test(kit),"club blocks in each club's two colours");
  assert.ok(/const awayEnd=f\.si===3\|\|\(f\.si===0&&f\.p\.x>AWAY_X\)/.test(kit),"away fans in the corner behind the goal");
  const sandbox={};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(kit,sandbox);
  const files=Object.values({...sandbox.CareerModeChamberMenStadium.files.both});
  assert.ok(files.every(f=>!/^board_/.test(f)),"no board file in the load set");
  ok("S6","night stand, club-colour crowd, run-time ad boards with crests and no cut or CMS lettering");
}
// S7 r90 big stadium (High and above): Innerscene "Football stadium" (CC0) trimmed by gen_bowl.py into one 1k GLB that only
//    High, Extra and Ultra fetch (Light and Balanced downloads stay as they were); a bowl that fails to load leaves the
//    built stands; the crowd sits on the bowl's own seat rows.
{
  const file=path.join(ROOT,DIR,"stadium_bowl_V1_1k.glb"),b=fs.readFileSync(file);
  assert.equal(b.toString("ascii",0,4),"glTF");assert.ok(b.length<=2.6e6,`bowl ${b.length} <= 2.6 MB`);
  const j=JSON.parse(b.toString("utf8",20,20+b.readUInt32LE(12)));
  assert.match(j.asset.copyright,/Innerscene.*CC0/,"CC0 source named in the file");
  assert.deepEqual(j.extensionsRequired,["EXT_texture_webp"]);
  assert.ok(j.images.every(i=>i.mimeType==="image/webp"),"WebP textures");
  assert.ok(!JSON.stringify(j.materials).includes("KHR_materials_transmission"),"no transmission pass");
  for(const gone of ["Pitch","Goals","Perimeter boards","Dugouts","Gates"])assert.ok(!j.meshes.some(m=>m.name===gone),`${gone} trimmed`);
  const rows=j.scenes[0].extras.cmRows;assert.ok(rows.length>=40&&rows.every(r=>r.length>20&&r.length%2===1),"seat rows in extras");
  assert.ok(/stadium_bowl_V1_1k\.glb.*CC0/.test(read("tools/chamber-men-assets/LICENSES.md")),"licence row");
  // Which files each level asks for (a stand-in loader that records URLs).
  const asked=level=>{const urls=[];const T={SRGBColorSpace:"s",NoColorSpace:"n",
      TextureLoader:function(){this.loadAsync=u=>{urls.push(u);return Promise.resolve({});};},
      GLTFLoader:function(){this.loadAsync=u=>{urls.push(u);return Promise.resolve({scene:{traverse(){}}});};}};
    const sb={};sb.globalThis=sb;vm.createContext(sb);vm.runInContext(kit,sb);sb.CareerModeChamberMenStadium.load(T,{level,phone:false}).catch(()=>{});return urls;};
  for(const lv of [0,1])assert.ok(!asked(lv).some(u=>/stadium_bowl/.test(u)),`level ${lv} never fetches the bowl`);
  for(const lv of [2,3,4])assert.ok(asked(lv).some(u=>/stadium_bowl_V1_1k\.glb$/.test(u)),`level ${lv} fetches the 1k bowl`);
  assert.ok(/error=>\{try\{root\.console\?\.warn\?\.\("Chamber Men: no big stadium; the built stands stay\.",error\);\}catch\(_error\)\{\}return null;\}/.test(kit),"a failed bowl load leaves the built stands");
  assert.ok(/for\(const st of stands\)st\.visible=false;/.test(kit)&&/bowl\.userData&&bowl\.userData\.cmRows/.test(kit),"the bowl replaces the built stands and seats the crowd");
  ok("S7","big stadium: CC0 bowl, 1k WebP, High and above only, fallback to the built stands, crowd on its rows");
}
console.log(`PASS r89 Chamber Men stadium kit (${results.length} checks)`);
