#!/usr/bin/env node
'use strict';
// r90 one quality system for every 3D screen (js/gfxTier.js, Nik 2026-11-07: "If I'm running on a Chromebook, it should run
// great. If someone is on a high-end PC, it should be like much quality, 4K"). The module runs in a sandbox with a fake
// screen, GPU name, storage and clock:
//   G1 the auto level from the GPU name, held down by memory, cores and phone screens; software GL is level 0
//   G2 auto and the named levels never draw above devicePixelRatio; ultra starts and stays at native on any screen (4K/8K, 3x
//      phones) and draws up to 2x within a 3840x2160
//      buffer; Settings: suggested(), choice(), setChoice();
//      the Settings key picks the level, anything unknown is auto, ?gfx=N forces one
//   G3 the governor steps down after a second of slow frames, never goes back to a step that ran slow (no see-saw), holds
//      still while held, steps up only after a timed frame shows room, and remembers where it settled
//   G4 calibrate moves auto at most one level and never moves a level the player picked
//   G5 the frame counter appears only with ?fps=1; the service worker precaches the module
//   G6 Settings: one 3D QUALITY pick (Auto names its suggestion), saved through the module, from the next 3D screen; 8K
//      only where the GPU can hold it
//   G7 Device check page: bench frames, best 60 fps level saved as Auto, the device class line
//   G8 8K (Nik 2026-11-07): picked only, a GPU with a 7680 px buffer and texture, never a phone or software GL; up to
//      7680x4320; a lost context or refused buffer falls back to Ultra (said in the overlay) until 8K is picked again;
//      MSAA from the sample counts both formats support, an incomplete target steps 8 -> 4 -> 0
//   G10 html[data-gfx] carries the resolved level for 2D screens: on load, on a pick, after calibrate, on an 8K fallback
//   G11 never crash first: a lost context or out-of-memory error drops any level one step, remembered until a new pick,
//      7 days or 3 clean scenes; Mali-G7x starts Balanced; samples() never above the wish;
//      the download level also follows Save-Data and 2g/3g (html[data-assets])
//   G9 phones (Nik 2026-11-07, iPhone 17 at the best it can hold): strong phone GPUs start High, weak ones Light, calibrate
//      runs, at most 3x CSS and a 4K buffer, textures one size down below High
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const SRC=fs.readFileSync(path.join(ROOT,'js/gfxTier.js'),'utf8');
const CHOICES_FROM_SRC=()=>JSON.parse(/const CHOICES=(\[[^\]]*\])/.exec(SRC)[1]);
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};

function sandbox({gpu='ANGLE (Intel, Mesa Intel(R) UHD Graphics 600 (GLK 2), OpenGL ES 3.2)',dpr=1,memory=4,cores=4,screen=[1366,768],search='',storage={},maxBuffer=16384,maxTexture=16384,connection=null,view=null}={}){
  const clock={t:0};
  const store={...storage};
  const appended=[],counts={canvas:0};
  const doc={
    createElement(tag){
      if(tag==='canvas')counts.canvas+=1;
      if(tag==='canvas')return {getContext:()=>({RENDERER:7937,MAX_RENDERBUFFER_SIZE:34024,MAX_TEXTURE_SIZE:3379,
        getExtension:n=>n==='WEBGL_debug_renderer_info'?{UNMASKED_RENDERER_WEBGL:37446}:{loseContext(){}},
        getParameter:k=>k===37446||k===7937?gpu:k===34024?maxBuffer:k===3379?maxTexture:null})};
      return {style:{},setAttribute(){},append(){},remove(){},get isConnected(){return true;},textContent:''};
    },
    body:{append:x=>appended.push(x)},
    documentElement:{dataset:{}}
  };
  const ctx={document:doc,devicePixelRatio:dpr,navigator:{deviceMemory:memory,hardwareConcurrency:cores,...(connection?{connection}:{})},screen:{width:screen[0],height:screen[1]},
    location:{search},readStorageValue:k=>k in store?store[k]:null,writeStorageValue:(k,v)=>{store[k]=String(v);return true;},
    performance:{now:()=>clock.t},setTimeout:(f)=>{f();return 0;},requestAnimationFrame:()=>1,cancelAnimationFrame(){},URLSearchParams};
  if(view){ctx.innerWidth=view[0];ctx.innerHeight=view[1];}
  ctx.globalThis=ctx;ctx.parent=ctx;
  vm.createContext(ctx);vm.runInContext(SRC,ctx);
  return {G:ctx.CareerModeGfxTier,clock,store,appended,ctx,counts};
}
// A renderer stand-in: records the pixel ratio; a draw costs `cost(pr)` ms on the fake clock.
function fakeRenderer(clock,cost,css=[1280,720]){
  const r={pr:1,calls:[],domElement:{clientWidth:css[0],clientHeight:css[1]},
    setPixelRatio(v){r.pr=v;r.calls.push(v);},getContext:()=>({RGBA:1,UNSIGNED_BYTE:1,readPixels(){clock.t+=cost(r.pr);}})};
  return r;
}

// G1
{
  const cases=[
    ['ANGLE (Intel, Mesa Intel(R) UHD Graphics 600 (GLK 2), OpenGL ES 3.2)',{},0],
    ['ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:8,cores:8},0],
    ['ANGLE (ARM, Mali-G72, OpenGL ES 3.2)',{memory:4,cores:8},0],
    ['ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',{memory:8,cores:8},0],
    ['ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:16,cores:8},1],
    ['ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:16,cores:8},2],
    ['ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:32,cores:16},3],
    ['ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:4,cores:16},1],
    ['ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:16,cores:12},3],
    ['Apple M1',{memory:8,cores:8},2],
    ['Apple M2 Max',{memory:32,cores:12},3],
    ['Apple GPU',{phone:true,memory:6,cores:6},2],
    ['Apple GPU',{phone:true,cores:4},2],
    ['Adreno (TM) 740',{phone:true,memory:8,cores:8},2],
    ['ANGLE (Qualcomm, Adreno (TM) 830, OpenGL ES 3.2)',{phone:true,memory:8,cores:8},2],
    ['ANGLE (ARM, Mali-G715, OpenGL ES 3.2)',{phone:true,memory:8,cores:8},2],
    ['ANGLE (ARM, Immortalis-G720, OpenGL ES 3.2)',{phone:true,memory:8,cores:8},2],
    ['Adreno (TM) 650',{phone:true,memory:8,cores:8},1],
    ['Adreno (TM) 530',{phone:true,memory:4,cores:4},0],
    ['ANGLE (ARM, Mali-G57, OpenGL ES 3.2)',{phone:true,memory:4,cores:8},0],
    ['PowerVR Rogue GE8320',{phone:true,memory:2,cores:8},0],
    ['Adreno (TM) 740',{phone:true,memory:4,cores:8},1],
    ['Some New GPU 9000',{memory:16,cores:12},1],
    ['ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:2,cores:16},0]
  ];
  const {G}=sandbox();
  for(const [gpu,env,want] of cases)assert.equal(G.classify(gpu,{deviceMemory:env.memory,cores:env.cores,phone:env.phone}).level,want,`${gpu} ${JSON.stringify(env)}`);
  assert.equal(G.classify('SwiftShader',{}).software,true);
  ok('G1',`auto level from the GPU name, held down by memory and cores; strong phone GPUs start High (${cases.length} devices)`);
}
// G2
{
  const strong='ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
  for(const dpr of [1,1.25,1.5,2,3]){
    for(const c of ['auto','medium','high','extra']){
      const {G}=sandbox({gpu:strong,dpr,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':c}});
      const p=G.profile();
      assert.ok(p.maxPixelRatio<=dpr+1e-9&&p.pixelRatio<=p.maxPixelRatio&&p.minPixelRatio<=p.pixelRatio,`${c} at dpr ${dpr} stays at or under the screen (${JSON.stringify(p)})`);
    }
    const {G}=sandbox({gpu:strong,dpr,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'ultra'}});
    const u=G.profile();assert.equal(u.level,4);assert.ok(u.maxPixelRatio<=2*dpr&&u.maxPixelRatio>=Math.min(4,dpr),`ultra at dpr ${dpr} may draw up to 2x`);
  }
  assert.equal(sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'high'}}).G.profile().level,2,'the Settings key picks the level');
  assert.equal(sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'HIGH'}}).G.profile().level,2,'case does not matter');
  const junk=sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'8k please'}}).G.profile();assert.equal(junk.choice,'auto');assert.equal(junk.auto,true);
  assert.equal(sandbox({search:'?gfx=3'}).G.profile().level,3,'?gfx=3 forces a level for proofs');
  const cb=sandbox().G.profile();
  assert.deepEqual([cb.level,cb.name,cb.pixelRatio,cb.antialias,cb.bloom],[0,'light',1,true,false],'a Chromebook (UHD 600, 4 GB) starts light at its own ratio');
  assert.equal(sandbox({gpu:'SwiftShader'}).G.profile().antialias,false,'software GL draws without MSAA');
  // Ultra on a 1080p screen: the buffer stays at or under 3840x2160.
  const s=sandbox({gpu:strong,dpr:1,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'ultra'}});
  const r=fakeRenderer(s.clock,()=>1,[1920,1080]);const gov=s.G.governor(r,{});
  assert.ok(gov.pixelRatio()*gov.pixelRatio()*1920*1080<=3840*2160+1,`ultra buffer cap (${gov.pixelRatio()})`);
  // Ultra on an 8K screen (2x over 3840x2160 css): native size, never held under the screen.
  const s8=sandbox({gpu:strong,dpr:2,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'ultra'}});
  const g8=s8.G.governor(fakeRenderer(s8.clock,()=>1,[3840,2160]),{});assert.ok(g8.pixelRatio()>=2,`8K screens draw native (${g8.pixelRatio()})`);
  // Codex on #1260: a picked level never adapts, so on a screen above 2x Ultra must start at native, not at 2.
  for(const [dpr,css] of [[2.5,[1536,864]],[3,[1280,720]],[3,[430,932]],[4,[1920,1080]]]){
    const su=sandbox({gpu:strong,dpr,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'ultra'}});
    assert.ok(su.G.profile().pixelRatio>=dpr,`ultra at dpr ${dpr} starts native (${su.G.profile().pixelRatio})`);
    const gu=su.G.governor(fakeRenderer(su.clock,()=>1,css),{});
    assert.ok(gu.pixelRatio()>=dpr,`ultra at dpr ${dpr} on ${css.join('x')} draws native (${gu.pixelRatio()})`);
    const past=gu.pixelRatio()>dpr+1e-9;assert.ok(!past||gu.pixelRatio()**2*css[0]*css[1]<=3840*2160+1,'past native only within the 4K buffer');
  }
  assert.equal(sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'light'}}).G.profile().level,0,'light can be picked');
  const sg=sandbox({gpu:strong,dpr:1,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'light'}}).G;
  assert.deepEqual({...sg.suggested()},{level:3,name:'extra',measured:false,now:3,nowName:'extra',lowered:false},'Settings sees what Auto would pick');assert.equal(sg.choice(),'light');
  assert.equal(sg.setChoice('bogus'),'auto');assert.equal(sg.profile().level,3,'a new pick applies to the next screen');
  // Codex on #1284: a crash cap or Device check saved by the roulette/SP frame's own copy shows in Settings without a reload.
  {const sx=sandbox({gpu:strong,dpr:1,memory:32,cores:16});sx.G.profile();
   sx.store['careerModeShowdown.gfxCap.v1']=JSON.stringify({level:1,reason:'frame',at:Date.now()});
   assert.deepEqual([sx.G.suggested().now,sx.G.suggested().lowered],[1,true],'a cap saved elsewhere lowers the Auto line');
   sx.store['careerModeShowdown.gfxCap.v1']='null';sx.store['careerModeShowdown.gfxMeasured.v2']=JSON.stringify({level:2,at:Date.now()});
   assert.deepEqual([sx.G.suggested().now,sx.G.suggested().measured],[2,true],'a Device check saved elsewhere shows as measured');}
  ok('G2','auto and named levels never above devicePixelRatio; ultra up to 2x within a 4K buffer; Settings key, unknown is auto, ?gfx forces');
}
// G3
{
  const s=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8});
  let cost=4;const r=fakeRenderer(s.clock,()=>cost);const changes=[];
  const gov=s.G.governor(r,{key:'chamber',draw(){},onChange:p=>changes.push(p.pixelRatio)});
  const start=gov.pixelRatio();assert.equal(start,1.5,'high starts at 1.5 on a 2x screen');
  let t=0;const run=(ms,frame)=>{const end=t+ms;while(t<end){t+=frame;s.clock.t=t;gov.frame(t);}};
  run(1500,30);
  const down=gov.pixelRatio();assert.ok(down<start,'a second of slow frames steps down');
  // Smooth again and cheap: the step that ran slow is never tried again.
  cost=1;run(12000,16.7);
  assert.ok(gov.pixelRatio()<=down+1e-9,`never back to the slow step (${changes.join(' ')})`);
  // Held: slow frames change nothing.
  gov.hold(true);const heldAt=gov.pixelRatio();run(3000,40);assert.equal(gov.pixelRatio(),heldAt,'held: no change mid-shot');gov.hold(false);
  gov.end();
  assert.equal(Number(s.store['careerModeShowdown.gfxSettled.v1.chamber']),gov.pixelRatio(),'it remembers where it settled');
  // Step up: a fresh screen starting low with lots of room.
  const s2=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8,storage:{'careerModeShowdown.gfxSettled.v1.rrr':'1'}});
  const r2=fakeRenderer(s2.clock,()=>1);const g2=s2.G.governor(r2,{key:'rrr',draw(){}});
  assert.equal(g2.pixelRatio(),1,'the next visit starts where the last one settled');
  let t2=0;const end2=12000;while(t2<end2){t2+=16.7;s2.clock.t=t2;g2.frame(t2);}
  assert.ok(g2.pixelRatio()>1&&g2.pixelRatio()<=2,`room to spare steps up, never past the screen (${g2.pixelRatio()})`);
  // A step up that would be too dear is refused and never tried again.
  const s3=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8,storage:{'careerModeShowdown.gfxSettled.v1.x':'1'}});
  const r3=fakeRenderer(s3.clock,()=>12);const g3=s3.G.governor(r3,{key:'x',draw(){}});
  let t3=0;while(t3<15000){t3+=16.7;s3.clock.t=t3;g3.frame(t3);}
  assert.equal(g3.pixelRatio(),1,'a frame without room keeps the step');
  // A level the player picked is held as picked: slow frames change nothing.
  const s5=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8,storage:{'careerModeShowdown.gfxQuality.v1':'extra'}});
  const g5=s5.G.governor(fakeRenderer(s5.clock,()=>30),{key:'z',draw(){}});const p5=g5.pixelRatio();let t5=0;while(t5<5000){t5+=40;s5.clock.t=t5;g5.frame(t5);}
  assert.equal(g5.pixelRatio(),p5,'a picked level never steps');
  // Without draw, the governor only steps down.
  const s4=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8,storage:{'careerModeShowdown.gfxSettled.v1.y':'1'}});
  const g4=s4.G.governor(fakeRenderer(s4.clock,()=>1),{key:'y'});let t4=0;while(t4<15000){t4+=16.7;g4.frame(t4);}
  assert.equal(g4.pixelRatio(),1);
  ok('G3','governor: down after 1 s slow, no see-saw, still while held, up only after a timed frame shows room, remembers where it settled');
}
// G4
{
  const mk=(cost,storage)=>{const s=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8,storage});return {s,r:fakeRenderer(s.clock,()=>cost)};};
  const run=async(cost,storage)=>{const {s,r}=mk(cost,storage);const before=s.G.profile().level;const p=await s.G.calibrate(r,()=>{});return {before,after:p.level,pr:r.pr,ms:p.calibratedMs};};
  (async()=>{
    const slow=await run(20);assert.deepEqual([slow.before,slow.after],[2,1],'slow frames: one level down');assert.equal(slow.pr,1.25);
    const fast=await run(2);assert.deepEqual([fast.before,fast.after],[2,3],'lots of room: one level up');
    const mid=await run(8);assert.equal(mid.after,mid.before,'in between: stays');
    const picked=await run(40,{'careerModeShowdown.gfxQuality.v1':'extra'});assert.deepEqual([picked.before,picked.after],[3,3],'a picked level never moves');
    const cbs=sandbox();const cbr=fakeRenderer(cbs.clock,()=>1);const cb=await cbs.G.calibrate(cbr,()=>{});assert.equal(cb.level,1,'a fast Chromebook may go one up');
    const sws=sandbox({gpu:'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'});let swDraws=0;
    const sw0=await sws.G.calibrate(fakeRenderer(sws.clock,()=>1),()=>{swDraws+=1;});assert.deepEqual([sw0.level,swDraws],[0,0],'software GL: no timed frames, stays light');
    const cb2s=sandbox();const cb2=await cb2s.G.calibrate(fakeRenderer(cb2s.clock,()=>1),()=>{});assert.ok(cb2.level<=1,'never more than one above what its GPU name allows');
    // Codex on #1263: a governor made before calibrate() follows the new level (a step down never raises the ratio).
    for(const [cost,dir] of [[20,'down'],[2,'up']]){
      const {s:sg,r:rg}=mk(cost);const gov=sg.G.governor(rg,{key:'order'});const before=gov.pixelRatio();
      const after=await sg.G.calibrate(rg,()=>{});
      assert.deepEqual([gov.level(),sg.G.builtLevel(rg),after.level],[2,2,dir==='down'?1:3],`r91: the governor keeps the level the scene was built at; calibrate moved ${dir} for what comes next`);assert.equal(gov.pixelRatio(),rg.pr,'governor and renderer agree on the pixel ratio calibrate moved to');
      assert.ok(dir==='down'?gov.pixelRatio()<before:gov.pixelRatio()>before,`${dir}: ${before} -> ${gov.pixelRatio()}`);
      let t=0;while(t<6000){t+=16.7;sg.clock.t=t;gov.frame(t);}
      assert.ok(gov.pixelRatio()<=after.maxPixelRatio+1e-9,'never past the new level');
    }
    ok('G4','calibrate: auto moves at most one level, a picked level never moves; a governor made first follows it');
    // G5
    const off=sandbox();const o=off.G.overlay(()=>({calls:1}));assert.equal(off.appended.length,0,'no counter without ?fps=1');o.stop();
    const on=sandbox({search:'?fps=1'});on.G.overlay(()=>({calls:1}));assert.equal(on.appended.length,1,'?fps=1 shows the counter');
    const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
    assert.ok(/"js\/gfxTier\.js"/.test(sw.match(/const SHELL_PATHS\s*=\s*Object\.freeze\(\[[\s\S]*?\]\);/)[0]),'the service worker precaches the module');
    assert.ok(!/\bimport\b|\bexport\b/.test(SRC.replace(/\/\/.*$/gm,'')),'a classic script (the roulette page loads it with a script tag)');
    assert.ok(!/\blocalStorage\b/.test(SRC)&&SRC.includes('gfxStore("readStorageValue")'),'saved through js/storage.js (its parent\'s in the roulette frame)');
    ok('G5','frame counter only with ?fps=1; precached; classic script');
    // G6 Settings (lead 2026-11-07): one 3D QUALITY pick in MOTION & FEEDBACK: Auto (its pick in a line under the name) / Light / Balanced /
    // High / Extra / Ultra, saved through the module, applying from the next 3D screen; on landscape desktops it shares the
    // MENU CLICK FEEDBACK line (the plate has no height to spare at 1366x640; browser sweep on the PR).
    const set=fs.readFileSync(path.join(ROOT,'js/settings.js'),'utf8'),css=fs.readFileSync(path.join(ROOT,'css/r78-type.css'),'utf8');
    // r90 one framework (docs/QUALITY_LEVELS.md): the choices and their names come from the module (choices, labels).
    assert.ok(set.includes('const option = createSettingsElement("option", "", value === "auto" ? getSettingsGfxAutoLabel(tier) : tier.labels[index - 1]);')&&!/SETTINGS_GFX_(CHOICES|NAMES)/.test(set),'the choices, in order, by the shared names');
    assert.ok(set.includes('try{ can8k = Boolean(tier.can8k && tier.can8k()); }catch(_error){ can8k = false; }')&&set.includes('if(value === "8k" && !can8k && tier.choice() !== "8k"){ return; }'),'8K is offered only where the GPU can hold it');
    // r90 (Nik 2026-11-08): what Auto chose is one quiet line under 3D QUALITY, read from the saved state (Device check, crash cap).
    assert.ok(set.includes('return `Auto would pick ${name} here.${drawn}${getSettingsGfxCheckText(tier)}`;')&&set.includes('if(p && p.fellBack){ drawn = ` ${tier.label(p.level)} is drawn for now (lowered after a graphics error).`; }')&&set.includes('const from = s.lowered ? "Lowered after a graphics error." : s.measured && s.now === s.level ? "Measured by the Device check." : "";')&&set.includes('return name ? `Auto · ${name}` : "Auto";'),'the Auto entry names what Auto draws here (r91: "Auto · Light"); the line adds where it came from');
    assert.ok(set.includes('window.addEventListener("cms-gfx-level", onLevel);')&&SRC.includes('new root.CustomEvent("cms-gfx-level"'),'the line follows a level change while Settings is open');
    assert.ok(/settingsGfxAuto \{ display: block;/.test(css),'the line shows at every width');
    assert.ok(set.includes('window.location.assign("device-check.html");')&&set.includes('"Device check…"'),'the last entry opens the Device check');
    assert.ok(set.includes('const saved = tier.setChoice(select.value);')&&set.includes('"Applies from the next 3D screen."'),'saved through the module, applies next screen');
    assert.ok(set.includes('window.loadRuntimeScript("gfx-tier", "js/gfxTier.js", ready)'),'Settings loads the module on demand, under the scene\'s key');
    assert.ok(set.includes('panel.append(summary, choices, createMenuFeedbackControl(), createGfxQualityControl());'),'in MOTION & FEEDBACK, under the menu click');
    assert.ok(set.includes('select.setAttribute("aria-labelledby", "settingsGfxLabel");'),'the select has its label');
    assert.ok(!/localStorage/.test(set.slice(set.indexOf('const SETTINGS_GFX_CHECK'),set.indexOf('function createGfxQualityControl'))),'no storage of its own');
    assert.ok(css.includes('@media (min-width: 1200px) and (orientation: landscape) {\n  :root body #settingsOverlay.v10Settings #settingsDialog #settingsContent > .settingsPanel--motion:has(> .settingsGfxRow) { flex-flow: row wrap;'),'one shared line on landscape desktops');
    const names=CHOICES_FROM_SRC();assert.deepEqual(names,['auto','light','medium','high','extra','ultra','8k'],'Settings values match the module (8K added when capable)');
    // G7 Device check (lead, from Nik 2026-11-07): device-check.html times each scene's ?gfx=N&bench=1 frame for 10 s and saves
    // the best level that holds 60 fps as this device's Auto; it loads no game, no sign-in and no Firestore.
    const dc=fs.readFileSync(path.join(ROOT,'device-check.html'),'utf8'),bench=fs.readFileSync(path.join(ROOT,'device-check-chamber.html'),'utf8');
    const scripts=html=>[...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(scripts(dc),['js/storage.js','js/gfxTier.js'],'the Device check loads only storage and the quality module');
    assert.deepEqual(scripts(bench),['js/chamberMenScene3d.js'],'the Chamber Men frame loads only the scene');
    assert.ok(!/firebase|firestore|onlineSync|app\.js/i.test((dc+bench).replace(/<!--[\s\S]*?-->/g,'')),'no game, sign-in or Firestore');
    assert.ok(dc.includes('const SMOOTH_AVG=57,SMOOTH_LOW=45')&&dc.includes('T.setMeasured(level,'),'60 fps rule, saved as Auto');
    assert.ok(dc.includes('visual-assets/v10_1/roulette/index.html')&&dc.includes('visual-assets/v10_1/special-player/index.html')&&dc.includes('device-check-chamber.html')&&dc.includes('frame.src=`${scene.path}?gfx=${level}&bench=1`;'),'all three scenes (r91), each level forced, bench mode');
    assert.ok(dc.includes('e.origin!==location.origin||e.source!==frame.contentWindow'),'only its own frame\'s message counts');
    // Codex on #1266: timed at the game's own size (the stage fills the window; the Chamber Men goal uses the game's clamps),
    // and a hidden tab ends the measurement under way at once.
    assert.ok(dc.includes('#stage.live{position:fixed;inset:0;')&&dc.includes('stage.classList.add("live");'),'each level runs full window');
    assert.ok(bench.includes('.cmGoal{display:block;width:100%;height:clamp(180px,calc(100dvh - 430px),66.7cqw)}')&&bench.includes('@media (min-width:900px){.cmGoalBox{width:calc(min(1180px,100%) - 32px);margin-top:14px}.cmGoal{height:clamp(260px,calc(100dvh - 300px),56.25cqw)}}'),'the goal at its game size');
    assert.ok(dc.includes('cancelWait=()=>finish({aborted:true});')&&dc.includes('if(cancelWait)cancelWait();')&&dc.includes('if(got&&got.aborted)break;'),'a hidden tab stops the measurement at once');
    // The recorder: forced level, no adapting. r91: "started" first, then one result that says what was asked and drawn, and it
    // waits for one whole beat (a hold that lasted) before it ends; without a beat it ends as not complete after 60 s more.
    {const s7=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:1,memory:16,cores:8,search:'?gfx=2&bench=1'});
     const posted=[];s7.ctx.parent={postMessage:m=>posted.push(m),location:{search:''}};s7.ctx.location.origin='http://x';
     const r7=fakeRenderer(s7.clock,()=>3);const g7=s7.G.governor(r7,{key:'chamber-men',draw(){},info:()=>({crowd:1})});
     assert.deepEqual(posted.map(m=>[m.type,m.phase,m.scene,m.asked,m.level]),[['cms-gfx-bench','started','chamber-men',2,2]],'started, with the level asked');
     let t=0;const pr0=g7.pixelRatio();const step=()=>{t+=t<6000?16.7:40;s7.clock.t=t;g7.frame(t);};
     while(t<1000)step();g7.hold(true);while(t<4000)step();g7.hold(false);while(t<12000)step();
     assert.equal(posted.length,2,'one result');const m=posted[1];
     assert.deepEqual([m.type,m.phase,m.scene,m.asked,m.level,m.name,m.beats,m.complete,m.failed],['cms-gfx-bench','result','chamber-men',2,2,'high',1,true,null]);assert.equal(g7.pixelRatio(),pr0,'no adapting in bench mode');
     assert.equal(JSON.stringify([m.css,m.bufferOk,m.info]),'[[1280,720],true,{"crowd":1}]','what was drawn');
     assert.ok(m.avg>25&&m.avg<60&&m.p1low<=26&&m.ms>16&&m.frames>200&&m.drawMs===3,`stats ${JSON.stringify(m)}`);
     const st=s7.G.benchStats([10,10,10,10,50]);assert.deepEqual([st.frames,st.avg,st.p1low],[5,55.6,20]);
     // No beat played: not complete, only after the long wait.
     const s7b=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:1,memory:16,cores:8,search:'?gfx=1&bench=1'});
     const postedB=[];s7b.ctx.parent={postMessage:m=>postedB.push(m),location:{search:''}};s7b.ctx.location.origin='http://x';
     const gb=s7b.G.governor(fakeRenderer(s7b.clock,()=>3),{key:'rrr',draw(){}});let tb=0;
     while(tb<30000){tb+=16.7;s7b.clock.t=tb;gb.frame(tb);}assert.equal(postedB.length,1,'no beat yet: it keeps timing');
     while(tb<61000){tb+=16.7;s7b.clock.t=tb;gb.frame(tb);}assert.deepEqual([postedB.length,postedB[1].complete,postedB[1].beats],[2,false,0],'no beat in 60 s: a result marked not complete');
     // An older crash cap does not lower the level the check asked for (the answer would be a lower level's); a failure
     // during the check does lower it, and the result says so.
     const cap={'careerModeShowdown.gfxCap.v1':JSON.stringify({level:0,reason:'the GPU ran out of memory',at:Date.now(),clean:0})};
     const s7c=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:1,memory:16,cores:8,search:'?gfx=2&bench=1',storage:cap});
     assert.deepEqual([s7c.G.profile().level,s7c.G.profile().asked],[2,2],'bench: the level asked, whatever an old cap says');
     assert.equal(sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:1,memory:16,cores:8,search:'?gfx=2',storage:cap}).G.profile().level<2,true,'outside the check a forced level still obeys the cap');
     const postedC=[];s7c.ctx.parent={postMessage:m=>postedC.push(m),location:{search:''}};s7c.ctx.location.origin='http://x';
     const gc=s7c.G.governor(fakeRenderer(s7c.clock,()=>3),{key:'sp',draw(){}});gc.frame(16);gc.frame(32);s7c.G.fallback('the GPU dropped the picture (context lost)');gc.frame(48);
     const mc=postedC[postedC.length-1];assert.deepEqual([mc.phase,mc.asked,mc.level<2,mc.complete,mc.failed],['result',2,true,false,'the GPU dropped the picture (context lost)'],'a failure during the check is the result');}
    {const s8=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:1,memory:16,cores:8});
     assert.equal(s8.G.profile().level,2);s8.G.setMeasured(0);assert.deepEqual([s8.G.profile().level,s8.G.suggested().measured],[0,true],'a measured level is Auto');
     s8.G.setChoice('ultra');assert.equal(s8.G.profile().level,4,'a picked level still wins');s8.G.setChoice('auto');
     s8.G.clearMeasured();assert.equal(s8.G.profile().level,2,'forgetting goes back to the guess');}
    assert.ok(dc.includes('$("yoursTitle").innerHTML=`Your device <span>· ${esc(kind)}</span>`;'),'the Device check names the device class (r91: on the Your device card)');
    {const d=sandbox({gpu:'Apple GPU',dpr:3,memory:null,cores:6,screen:[402,874]}).G.device();
     assert.deepEqual([d.phone,d.strongPhone,d.guessName,d.can8k],[true,true,'high',false],'an iPhone 17 reads as a strong phone that starts High');}
    ok('G7','Device check: bench frames record a forced level, one result each; best 60 fps level saved as Auto; a pick still wins');
    ok('G6','Settings: 3D QUALITY with Auto (named under the row) and five levels, saved through the module, next 3D screen');
    g8();await g9();await g10();await g11();g12();
    console.log(`PASS r90 gfx tier contracts (${checks} checks)`);
  })().catch(e=>{console.error(e);process.exitCode=1;});
}

function g8(){
  const strong='ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',pick={'careerModeShowdown.gfxQuality.v1':'8k'};
  const s=sandbox({gpu:strong,dpr:1,memory:32,cores:16,screen:[1920,1080],storage:pick});
  const p=s.G.profile();assert.deepEqual([p.level,p.name,p.can8k,p.bufferCap],[5,'8k',true,7680*4320],'8K when picked on a capable GPU');
  assert.ok(p.pixelRatio===4&&p.maxPixelRatio===4,`8K on 1080p starts at 4x (${p.pixelRatio}/${p.maxPixelRatio})`);
  // r91 (device lab 2026-11-11): the first buffer a scene sizes (window x profile.pixelRatio, before any governor) stays
  // within the level's buffer on every screen. 2.3.0: 8K on a 4K monitor 15360x8640, on an 8K screen 30720x17280; Ultra on a
  // 4K monitor 7680x4320.
  {const first=(o,view)=>{const q=sandbox({gpu:strong,memory:32,cores:16,...o,view}).G.profile();return [Math.round(view[0]*q.pixelRatio),Math.round(view[1]*q.pixelRatio)];};
   const k8={'careerModeShowdown.gfxQuality.v1':'8k'},ul={'careerModeShowdown.gfxQuality.v1':'ultra'};
   assert.deepEqual(first({dpr:1,screen:[1920,1080],storage:k8},[1920,1080]),[7680,4320],'8K on a 1080p monitor: 4x, the full 8K buffer');
   assert.deepEqual(first({dpr:1,screen:[1920,1080],storage:k8},[1920,866]),[7680,3464],'8K in the Chromebook-size window: still 4x, under the cap');
   assert.deepEqual(first({dpr:1,screen:[3840,2160],storage:k8},[3840,2160]),[7680,4320],'8K on a 4K monitor: 2x, not 4x');
   assert.deepEqual(first({dpr:2,screen:[3840,2160],storage:k8},[3840,2160]),[7680,4320],'8K on an 8K screen at 2x: native');
   assert.deepEqual(first({dpr:1,screen:[7680,4320],storage:k8},[7680,4320]),[7680,4320],'8K on an 8K screen at 1x: native');
   assert.deepEqual(first({dpr:1,screen:[1920,1080],storage:ul},[1920,1080]),[3840,2160],'Ultra on a 1080p monitor: 2x, the full 4K buffer');
   assert.deepEqual(first({dpr:1,screen:[3840,2160],storage:ul},[3840,2160]),[3840,2160],'Ultra on a 4K monitor: native, not 2x');
   assert.deepEqual(first({dpr:2,screen:[3840,2160],storage:ul},[3840,2160]),[7680,4320],'Ultra on an 8K screen: native, as before (never held under the screen)');
   assert.deepEqual(first({dpr:1.5,screen:[2560,1440],storage:ul},[2560,1440]),[3840,2160],'Ultra on a 1440p screen at 1.5x: native');
   // The governor then agrees with that first size (no second, larger allocation when it starts).
   for(const [o,view] of [[{dpr:1,screen:[3840,2160],storage:k8},[3840,2160]],[{dpr:1,screen:[3840,2160],storage:ul},[3840,2160]],[{dpr:1,screen:[1920,1080],storage:k8},[1920,866]]]){
     const q=sandbox({gpu:strong,memory:32,cores:16,...o,view});const g=q.G.governor(fakeRenderer(q.clock,()=>1,view),{});
     assert.equal(g.pixelRatio(),q.G.profile().pixelRatio,`governor and first buffer agree (${JSON.stringify(view)})`);}
   // A phone: within a 4K buffer at any level from the start (iPhone 17: 402x874 at 3x is native and fits).
   const ph=sandbox({gpu:'Apple GPU',dpr:3,memory:null,cores:6,screen:[402,874],view:[402,874],storage:ul}).G.profile();assert.equal(ph.pixelRatio,3);
   const tab=sandbox({gpu:'Apple GPU',dpr:3,memory:null,cores:6,screen:[600,960],view:[1400,1000],storage:ul}).G.profile();
   assert.ok(tab.pixelRatio**2*1400*1000<=3840*2160+1,`a phone-class screen with a large page stays under 4K from the start (${tab.pixelRatio})`);
   // Named levels and Auto are untouched by this (they never draw past the screen's own ratio).
   for(const c of ['auto','light','medium','high','extra']){const a0=sandbox({gpu:strong,dpr:2,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':c}}).G.profile(),a1=sandbox({gpu:strong,dpr:2,memory:32,cores:16,view:[1920,1080],storage:{'careerModeShowdown.gfxQuality.v1':c}}).G.profile();
     assert.deepEqual([a1.pixelRatio,a1.maxPixelRatio,a1.minPixelRatio],[a0.pixelRatio,a0.maxPixelRatio,a0.minPixelRatio],c);}
   // A page with no size yet (a frame built before it is shown) counts as large as the screen, the most it can become
   // (review on #1399: 2.3.0's uncapped start must not come back through this door). Neither known: native.
   assert.equal(sandbox({gpu:strong,dpr:1,memory:32,cores:16,screen:[3840,2160],storage:k8}).G.profile().pixelRatio,2,'8K, no page size, 4K screen: 2x');
   assert.equal(sandbox({gpu:strong,dpr:1,memory:32,cores:16,screen:[3840,2160],storage:ul}).G.profile().pixelRatio,1,'Ultra, no page size, 4K screen: native');
   assert.equal(sandbox({gpu:strong,dpr:1,memory:32,cores:16,screen:[1920,1080],storage:k8}).G.profile().pixelRatio,4,'8K, no page size, 1080p screen: 4x, the full buffer');
   assert.equal(sandbox({gpu:strong,dpr:1,memory:32,cores:16,screen:[0,0],storage:k8}).G.profile().pixelRatio,1,'8K, nothing known: native');
   assert.equal(sandbox({gpu:strong,dpr:1,memory:32,cores:16,screen:[0,0],storage:ul}).G.profile().pixelRatio,1,'Ultra, nothing known: native');}
  // The device lab's own target devices (tests/browser/device-lab.cjs PROFILES, read by tests/support/device-lab-profiles.cjs):
  // on each of them, at Ultra and at 8K, shown or built before it has a size, the first buffer is within the level's
  // buffer (or native, where the screen itself is larger), and a phone is within 3840x2160.
  {const {PROFILES,deviceOf}=require('../support/device-lab-profiles.cjs');
   assert.deepEqual(Object.keys(PROFILES).sort(),['chromebook1035','chromebook866','iphone17','pc4k','pc8k'],'the lab profiles this contract was written against');
   for(const key of Object.keys(PROFILES)){const d=deviceOf(key);
     for(const c of ['ultra','8k'])for(const hidden of [false,true]){
       const q=sandbox({...d,view:hidden?null:d.view,storage:{'careerModeShowdown.gfxQuality.v1':c}}).G.profile();
       const [w,h]=hidden?d.screen:d.view,px=w*h*q.pixelRatio*q.pixelRatio,native=w*h*d.dpr*d.dpr;
       const limit=q.phone?3840*2160:Math.max(q.level===5?7680*4320:3840*2160,native);
       assert.ok(px<=limit+1,`${key} at ${c}${hidden?' (no size yet)':''}: first buffer ${Math.round(px/1e6)} Mpx is within ${Math.round(limit/1e6)} Mpx (x${q.pixelRatio})`);
       assert.ok(q.pixelRatio>=Math.min(1,d.dpr),`${key} at ${c}: never under the floor`);}}
   // The lab's finding, by its numbers: the 4K PC at 8K asked for 15360x8000 in 2.3.0 (4x), the 8K PC for 30720x16640.
   const at=(key,c)=>{const d=deviceOf(key),q=sandbox({...d,storage:{'careerModeShowdown.gfxQuality.v1':c}}).G.profile();return Math.round(d.view[0]*q.pixelRatio);};
   // (The lab's windows are a little shorter than the screen, so the buffer's width may pass 7680 or 3840 by the few
   // percent that keep the pixel count within the cap.)
   assert.ok(at('pc4k','8k')>=7680&&at('pc4k','8k')<=7990,`4K PC at 8K: ${at('pc4k','8k')} px wide, not 15360`);
   assert.ok(at('pc8k','8k')>=7680&&at('pc8k','8k')<=7830,`8K PC at 8K: ${at('pc8k','8k')} px wide, not 30720`);
   assert.ok(at('pc4k','ultra')>=3840&&at('pc4k','ultra')<=3995,`4K PC at Ultra: ${at('pc4k','ultra')} px wide, not 7680`);assert.equal(at('pc8k','ultra'),7680);
   // The Chromebook (2 threads, 4 GB) may pick Ultra only once its Device check has passed it (r91 gate): then 2x of 1920,
   // the 4K buffer; until then a saved Ultra pick draws Extra at the screen's own size.
   assert.equal(at('chromebook866','ultra'),1920,'the Chromebook at Ultra with no passed check: Extra, native');
   {const d=deviceOf('chromebook866'),q=sandbox({...d,storage:{'careerModeShowdown.gfxQuality.v1':'ultra','careerModeShowdown.gfxMeasured.v2':JSON.stringify({level:4,at:Date.now()})}}).G.profile();
    assert.deepEqual([q.level,Math.round(d.view[0]*q.pixelRatio)],[4,3840],'the Chromebook at Ultra after a passed check: 2x of 1920, the 4K buffer');}}
  const lost=[];const r={...fakeRenderer(s.clock,()=>1,[1920,1080])};r.domElement.addEventListener=(n,f)=>lost.push([n,f]);r.domElement.removeEventListener=()=>{};
  const gov=s.G.governor(r,{key:'chamber'});
  assert.equal(gov.pixelRatio(),4,'a 1080p canvas draws a 7680x4320 buffer');
  {const w=sandbox({gpu:strong,dpr:1,memory:32,cores:16,storage:pick});const gw=w.G.governor(fakeRenderer(w.clock,()=>1,[2560,1440]),{});
   assert.ok(gw.pixelRatio()**2*2560*1440<=7680*4320+1&&gw.pixelRatio()>=2.75,`a 1440p canvas stays within 7680x4320 (${gw.pixelRatio()})`);gw.end();}
  // A lost context sends it back to Ultra, says so, and moves the live governor.
  assert.equal(lost[0][0],'webglcontextlost');lost[0][1]();
  const f=s.G.profile();assert.deepEqual([f.level,f.name],[4,'ultra'],'context lost: Ultra');assert.ok(/context lost/.test(f.fellBack.reason));
  assert.ok(gov.pixelRatio()**2*1920*1080<=3840*2160+1,`the governor moved back under the 4K buffer (${gov.pixelRatio()})`);gov.end();
  assert.ok(SRC.includes('...(p.fellBack?[`fell back from ${LABELS[p.fellBack.from]} to ${LABELS[p.level]}: ${p.fellBack.reason}`]:[]),'),'the ?fps=1 overlay says so');assert.equal(f.fellBack.from,5);
  assert.equal(s.G.profile().level,4,'stays Ultra on the next screen');s.G.setChoice('8k');assert.equal(s.G.profile().level,5,'picking 8K again tries again');
  // Never offered: a GPU under 7680, a phone, software GL; Auto never picks it (a measured result tops out at Ultra).
  for(const [why,o] of [['small buffer',{maxBuffer:4096}],['small texture',{maxTexture:4096}],['phone',{screen:[402,874],dpr:3}],['software',{gpu:'SwiftShader'}]]){
    const n=sandbox({gpu:strong,dpr:1,memory:32,cores:16,storage:pick,...o}).G;assert.equal(n.can8k(),false,why);assert.ok(n.profile().level<=4,`${why}: 8K pick plays Ultra`);
  }
  const a=sandbox({gpu:strong,dpr:1,memory:32,cores:16}).G;assert.ok(a.profile().level<4,'Auto never Ultra or 8K');a.setMeasured(5);assert.equal(a.measured().level,5,'r91 (Nik 2026-11-11): a measured 8K is Auto where the GPU has the buffer');assert.equal(a.profile().level,5);
  {const b=sandbox({gpu:strong,dpr:1,memory:32,cores:16,maxBuffer:4096}).G;b.setMeasured(5);assert.equal(b.measured().level,4,'without an 8K buffer a measured level stops at Ultra');}
  assert.equal(sandbox({gpu:strong,dpr:1,memory:32,cores:16,search:'?gfx=5'}).G.profile().level,5,'?gfx=5 forces 8K for proofs');
  // MSAA: the highest count both RGBA16F (or RGBA8) and DEPTH_COMPONENT24 support, at or under the wish.
  const gl={RENDERBUFFER:1,SAMPLES:2,RGBA16F:3,RGBA8:4,DEPTH_COMPONENT24:5,FRAMEBUFFER:6,FRAMEBUFFER_COMPLETE:7,
    getInternalformatParameter:(_t,f)=>f===3?[8,4,2]:f===4?[16,8,4,2]:[8,4,2],checkFramebufferStatus:()=>gl.status()};
  const R={getContext:()=>gl,setRenderTarget(t){R.bound=t;}};
  assert.deepEqual([s.G.samples(R,16,false),s.G.samples(R,4,true),s.G.samples(R,3,true),s.G.samples(R,0,true)],[8,4,2,0]);
  const none={getContext:()=>({getInternalformatParameter(){throw new Error('no');}})};assert.equal(s.G.samples(none,8,true),4,'no query: 4');
  gl.status=()=>R.bound&&R.bound.samples===0?7:0;const t={samples:8,dispose(){}};
  assert.equal(s.G.checkTarget(R,t),true);assert.equal(t.samples,0,'an incomplete target steps 8 -> 4 -> 0');
  const scene=fs.readFileSync(path.join(ROOT,'js/chamberMenScene3d.js'),'utf8');
  // r90 Light: the Chamber Men dissolve copies the screen (no render target, so no MSAA to pick); the helper serves the others.
  assert.ok(scene.includes('renderer.copyFramebufferToTexture(snap)')&&!scene.includes('HalfFloatType,samples'),'the Chamber Men dissolve copies the screen');
  ok('G8','8K: picked only, capable GPU, never phone/software, 7680x4320 cap, falls back to Ultra and says so; shared MSAA helper');
}
function g9(){
  // iPhone 17 class: Apple GPU, 3x, no deviceMemory (Safari), 6 cores.
  const s=sandbox({gpu:'Apple GPU',dpr:3,memory:null,cores:6,screen:[402,874]});
  const p=s.G.profile();assert.deepEqual([p.level,p.phone,p.textureLevel],[2,true,2],'an iPhone starts High with full textures');
  assert.ok(p.maxPixelRatio<=3,'never past 3x');
  const cal=sandbox({gpu:'Apple GPU',dpr:3,memory:null,cores:6,screen:[402,874]});
  const rc=fakeRenderer(cal.clock,()=>2,[402,874]);return cal.G.calibrate(rc,()=>{}).then(n=>{
    assert.equal(n.level,3,'calibrate runs on phones and steps up when there is room');
    const u=sandbox({gpu:'Apple GPU',dpr:3,memory:null,cores:6,screen:[440,956],storage:{'careerModeShowdown.gfxQuality.v1':'ultra'}});
    const pu=u.G.profile();assert.ok(pu.maxPixelRatio<=3,`a phone on Ultra stays at 3x (${pu.maxPixelRatio})`);
    const gu=u.G.governor(fakeRenderer(u.clock,()=>1,[1400,1000]),{});assert.ok(gu.pixelRatio()**2*1400*1000<=3840*2160+1,`under the 4K buffer (${gu.pixelRatio()})`);
    const w=sandbox({gpu:'ANGLE (ARM, Mali-G57, OpenGL ES 3.2)',dpr:2.6,memory:4,cores:8,screen:[393,851]}).G.profile();
    assert.deepEqual([w.level,w.textureLevel],[0,0],'a weak phone starts Light');
    const m=sandbox({gpu:'Adreno (TM) 650',dpr:2.6,memory:8,cores:8,screen:[393,851]}).G.profile();assert.deepEqual([m.level,m.textureLevel],[1,0],'a phone below High: one texture size down');
    const d=sandbox({gpu:'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',memory:16,cores:8}).G.profile();assert.deepEqual([d.level,d.textureLevel],[1,1],'a computer keeps its level');
    const scene=fs.readFileSync(path.join(ROOT,'js/chamberMenScene3d.js'),'utf8');
    assert.ok(scene.includes('const q={...p,assets:(p.textureLevel??p.level)<=1?"phone":"desktop"};')&&!scene.includes('phoneScreen'),'Chamber Men assets follow the texture level');
    ok('G9','phones: strong GPUs start High, weak Light; calibrate runs; at most 3x and a 4K buffer; textures one size down below High');
  });
}

async function g10(){
  const html=sb=>sb.ctx.document.documentElement.dataset.gfx;
  const strong='ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
  assert.equal(html(sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'high'}})),'2','a picked level is marked on load');
  assert.equal(html(sandbox({storage:{'careerModeShowdown.gfxMeasured.v2':JSON.stringify({level:1,at:1})}})),'1','a measured Auto is marked on load');
  assert.equal(html(sandbox()),'0','a Chromebook reads Light once the profile runs');
  const s=sandbox({gpu:strong,dpr:1,memory:32,cores:16});assert.equal(html(s),'3');
  s.G.setChoice('light');assert.equal(html(s),'0','a new pick moves it at once');
  s.G.setChoice('8k');assert.equal(html(s),'5');s.G.fallback8k('test');assert.equal(html(s),'4','an 8K fallback reads Ultra');
  s.G.setChoice('auto');const n=await s.G.calibrate(fakeRenderer(s.clock,()=>15),()=>{});assert.equal(html(s),String(n.level),'calibrate marks the level it settles on');
  assert.ok(n.level===2,'calibrate stepped down one');
  {const sl=sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'high'},connection:{saveData:true}});assert.deepEqual([html(sl),sl.ctx.document.documentElement.dataset.assets],['2','1'],'data-assets on load follows the connection');}
  const ssjr=fs.readFileSync(path.join(ROOT,'js/ssjr.js'),'utf8');
  assert.ok(ssjr.includes('const gfxTier=()=>load("gfx-tier","js/gfxTier.js",()=>root.CareerModeGfxTier).catch(()=>null);')&&ssjr.includes('root.requestIdleCallback(()=>home.then(gfxTier),{timeout:3000})'),'loaded once Home is up, when the page is idle (never on the first-load path)');
  ok('G10','html[data-gfx] carries the resolved level for 2D screens: on load, on a pick, after calibrate, on an 8K fallback');
}

async function g11(){
  const strong='ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',html=sb=>sb.ctx.document.documentElement.dataset;
  // A lost context at High (Auto) drops to Balanced and stays there on the next screen; a pick clears it.
  const s=sandbox({gpu:'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',dpr:2,memory:16,cores:8});
  const lost=[];const r=fakeRenderer(s.clock,()=>2);r.domElement.addEventListener=(n,f)=>lost.push(f);r.domElement.removeEventListener=()=>{};
  const gov=s.G.governor(r,{key:'chamber'});assert.equal(s.G.profile().level,2);lost[0]();
  assert.deepEqual([s.G.profile().level,s.G.profile().fellBack.from,html(s).gfx],[1,2,'1'],'context lost: one level down, marked');
  s.G.reset();assert.equal(s.G.profile().level,1,'remembered on this device');
  lost[0]();assert.equal(s.G.profile().level,0,'a second loss goes down again');gov.end();
  s.G.setChoice('auto');assert.equal(s.G.profile().level,2,'a new pick in Settings tries again');
  // A picked level is held down too (never crash first); the page being hidden is the browser reclaiming, not a failure.
  const p=sandbox({gpu:strong,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'ultra'}});p.G.fallback('test');assert.equal(p.G.profile().level,3);
  const h=sandbox({gpu:strong,memory:32,cores:16});h.ctx.document.visibilityState='hidden';h.G.fallback('hidden');h.ctx.document.visibilityState='visible';h.G.reset();assert.equal(h.G.profile().level,3,'hidden: not counted');
  // gov.end() first: a scene's own dispose never counts.
  const e=sandbox({gpu:strong,memory:32,cores:16});const le=[];const re=fakeRenderer(e.clock,()=>1);re.domElement.addEventListener=(n,f)=>le.push(f);re.domElement.removeEventListener=()=>{};
  const ge=e.G.governor(re,{});ge.end();le[0]();e.G.reset();assert.equal(e.G.profile().level,3,'after end(), a context loss is the scene\'s own');
  // Out of memory while calibrating: one level down.
  const o=sandbox({gpu:strong,memory:32,cores:16});const ro=fakeRenderer(o.clock,()=>8);const gl=ro.getContext();ro.getContext=()=>({...gl,OUT_OF_MEMORY:1285,getError:()=>1285});
  await o.G.calibrate(ro,()=>{});o.G.reset();assert.equal(o.G.profile().level,2,'OUT_OF_MEMORY: one level down');
  // Memory: 4 GB or less is at most Balanced (also on a phone); the connection moves only the download size.
  assert.equal(sandbox({gpu:'Apple GPU',memory:4,cores:6,screen:[402,874],dpr:3}).G.profile().level,1,'a 4 GB phone is at most Balanced');
  for(const [c,slow] of [[{saveData:true,effectiveType:'4g'},true],[{effectiveType:'3g'},true],[{effectiveType:'2g'},true],[{effectiveType:'4g'},false]]){
    const n=sandbox({gpu:strong,memory:32,cores:16,connection:c});const q=n.G.profile();
    assert.deepEqual([q.level,q.assetLevel,q.slowNet,html(n).assets],[3,slow?2:3,slow,String(slow?2:3)],JSON.stringify(c));
  }
  assert.equal(sandbox({connection:{saveData:true}}).G.profile().assetLevel,0,'never below 0');
  // Lead review on #1271: the cap is not for ever. 7 days, or 3 clean scenes of 20 s at the capped level, clear it.
  {const c=sandbox({gpu:strong,memory:32,cores:16});c.G.fallback('x');assert.equal(c.G.profile().level,2);
   const old=JSON.parse(c.store['careerModeShowdown.gfxCap.v1']);old.at-=8*864e5;c.store['careerModeShowdown.gfxCap.v1']=JSON.stringify(old);c.G.reset();
   assert.equal(c.G.profile().level,3,'a cap older than 7 days is gone');
   c.G.fallback('y');assert.equal(c.G.profile().level,2);
   for(let i=0;i<3;i+=1){c.G.reset();const g=c.G.governor(fakeRenderer(c.clock,()=>1),{});c.clock.t+=i===0?5000:21000;g.end();}
   c.G.reset();assert.equal(c.G.profile().level,2,'a short scene does not count');
   const g=c.G.governor(fakeRenderer(c.clock,()=>1),{});c.clock.t+=21000;g.end();c.G.reset();assert.equal(c.G.profile().level,3,'3 clean scenes clear it');}
  // Mali-G76/G77/G78 and G610 start Balanced (two-digit names), and calibrate can lift them to High.
  for(const gpu of ['ANGLE (ARM, Mali-G78, OpenGL ES 3.2)','Mali-G76','ANGLE (ARM, Mali-G610, OpenGL ES 3.2)'])assert.equal(sandbox().G.classify(gpu,{phone:true,deviceMemory:8,cores:8}).level,1,gpu);
  {const m=sandbox({gpu:'ANGLE (ARM, Mali-G78, OpenGL ES 3.2)',dpr:2.6,memory:8,cores:8,screen:[393,851]});const n=await m.G.calibrate(fakeRenderer(m.clock,()=>2),()=>{});assert.equal(n.level,2,'calibrate lifts a G78 with room');}
  // samples() never returns more than asked.
  {const gl={RENDERBUFFER:1,SAMPLES:2,RGBA16F:3,RGBA8:4,DEPTH_COMPONENT24:5,getInternalformatParameter:()=>[8]};assert.equal(sandbox().G.samples({getContext:()=>gl},4,true),0,'only 8 listed, 4 asked: none');}
  ok('G11','never crash first: a lost context or out-of-memory drops one level, remembered until a new pick; downloads follow Save-Data and 2g/3g');
}

// G12 r90 MOTION round 2: the first WebGL context of a page is the startup stall (735-887 ms on a Chromebook), so the GPU
//     answer is kept per browser; a later open probes nothing and Auto picks the same level; another browser probes again.
function g12(){
  const gpu='ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)';
  const first=sandbox({gpu,memory:16,cores:12});const a=first.G.profile();
  assert.equal(first.counts.canvas,1,'the first open probes once');assert.ok(first.store['careerModeShowdown.gfxGpu.v1'],'the answer is kept');
  const again=sandbox({gpu:'never read',memory:16,cores:12,storage:{...first.store}});const b=again.G.profile();
  assert.equal(again.counts.canvas,0,'a later open makes no context');assert.deepEqual([b.level,b.gpu,b.can8k],[a.level,a.gpu,a.can8k],'and Auto picks the same');
  const kept=JSON.parse(first.store['careerModeShowdown.gfxGpu.v1']);kept.ua='another browser';
  const other=sandbox({gpu:'Apple GPU',memory:8,cores:8,storage:{'careerModeShowdown.gfxGpu.v1':JSON.stringify(kept)}});
  assert.deepEqual([other.G.profile().gpu,other.counts.canvas],['Apple GPU',1],'another browser probes again');
  const src=fs.readFileSync(path.join(__dirname,'../../js/gfxTier.js'),'utf8');
  assert.ok(src.includes('const gfxIdle=f=>(root.requestIdleCallback||(g=>root.setTimeout(g,200)))(f,{timeout:10000});'),'the first probe waits for a truly idle moment');
  // M32: with no kept answer it also waits for the loading screen to hand over to Home (bounded at 30 s).
  assert.ok(src.includes('if(gfxKept())gfxIdle(()=>gfxRemark());')&&src.includes('if(gfxHandedOver()||++n>120)gfxIdle(()=>gfxRemark());else root.setTimeout(wait,250);')&&src.includes('return !root.careerModeHomeHold&&(!el||el.hidden||el.classList?.contains("hidden"));'),'M32: the first probe never runs under the loading screen');
  ok('G12','the GPU probe runs once per browser (kept answer, same Auto pick); the first one waits for the loading screen to go and an idle moment');
}
