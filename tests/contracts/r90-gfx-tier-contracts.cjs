#!/usr/bin/env node
'use strict';
// r90 one quality system for every 3D screen (js/gfxTier.js, Nik 2026-11-07: "If I'm running on a Chromebook, it should run
// great. If someone is on a high-end PC, it should be like much quality, 4K"). The module runs in a sandbox with a fake
// screen, GPU name, storage and clock:
//   G1 the auto level from the GPU name, held down by memory, cores and phone screens; software GL is level 0
//   G2 auto and the named levels never draw above devicePixelRatio; ultra draws native (4K/8K) and up to 2x within a 3840x2160
//      buffer; Settings: suggested(), choice(), setChoice();
//      the Settings key picks the level, anything unknown is auto, ?gfx=N forces one
//   G3 the governor steps down after a second of slow frames, never goes back to a step that ran slow (no see-saw), holds
//      still while held, steps up only after a timed frame shows room, and remembers where it settled
//   G4 calibrate moves auto at most one level and never moves a level the player picked
//   G5 the frame counter appears only with ?fps=1; the service worker precaches the module
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const SRC=fs.readFileSync(path.join(ROOT,'js/gfxTier.js'),'utf8');
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};

function sandbox({gpu='ANGLE (Intel, Mesa Intel(R) UHD Graphics 600 (GLK 2), OpenGL ES 3.2)',dpr=1,memory=4,cores=4,screen=[1366,768],search='',storage={}}={}){
  const clock={t:0};
  const store={...storage};
  const appended=[];
  const doc={
    createElement(tag){
      if(tag==='canvas')return {getContext:()=>({RENDERER:7937,getExtension:n=>n==='WEBGL_debug_renderer_info'?{UNMASKED_RENDERER_WEBGL:37446}:{loseContext(){}},getParameter:k=>k===37446||k===7937?gpu:null})};
      return {style:{},setAttribute(){},append(){},remove(){},get isConnected(){return true;},textContent:''};
    },
    body:{append:x=>appended.push(x)}
  };
  const ctx={document:doc,devicePixelRatio:dpr,navigator:{deviceMemory:memory,hardwareConcurrency:cores},screen:{width:screen[0],height:screen[1]},
    location:{search},readStorageValue:k=>k in store?store[k]:null,writeStorageValue:(k,v)=>{store[k]=String(v);return true;},
    performance:{now:()=>clock.t},setTimeout:(f)=>{f();return 0;},requestAnimationFrame:()=>1,cancelAnimationFrame(){},URLSearchParams};
  ctx.globalThis=ctx;ctx.parent=ctx;
  vm.createContext(ctx);vm.runInContext(SRC,ctx);
  return {G:ctx.CareerModeGfxTier,clock,store,appended};
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
    ['Adreno (TM) 740',{phone:true,memory:8,cores:8},1],
    ['Some New GPU 9000',{memory:16,cores:12},1],
    ['ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',{memory:2,cores:16},0]
  ];
  const {G}=sandbox();
  for(const [gpu,env,want] of cases)assert.equal(G.classify(gpu,{deviceMemory:env.memory,cores:env.cores,phone:env.phone}).level,want,`${gpu} ${JSON.stringify(env)}`);
  assert.equal(G.classify('SwiftShader',{}).software,true);
  ok('G1',`auto level from the GPU name, held down by memory, cores and phone screens (${cases.length} devices)`);
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
  assert.equal(sandbox({storage:{'careerModeShowdown.gfxQuality.v1':'light'}}).G.profile().level,0,'light can be picked');
  const sg=sandbox({gpu:strong,dpr:1,memory:32,cores:16,storage:{'careerModeShowdown.gfxQuality.v1':'light'}}).G;
  assert.deepEqual({...sg.suggested()},{level:3,name:'extra'},'Settings sees what Auto would pick');assert.equal(sg.choice(),'light');
  assert.equal(sg.setChoice('bogus'),'auto');assert.equal(sg.profile().level,3,'a new pick applies to the next screen');
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
    ok('G4','calibrate: auto moves at most one level, a picked level never moves');
    // G5
    const off=sandbox();const o=off.G.overlay(()=>({calls:1}));assert.equal(off.appended.length,0,'no counter without ?fps=1');o.stop();
    const on=sandbox({search:'?fps=1'});on.G.overlay(()=>({calls:1}));assert.equal(on.appended.length,1,'?fps=1 shows the counter');
    const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
    assert.ok(/"js\/gfxTier\.js"/.test(sw.match(/const SHELL_PATHS\s*=\s*Object\.freeze\(\[[\s\S]*?\]\);/)[0]),'the service worker precaches the module');
    assert.ok(!/\bimport\b|\bexport\b/.test(SRC.replace(/\/\/.*$/gm,'')),'a classic script (the roulette page loads it with a script tag)');
    assert.ok(!/\blocalStorage\b/.test(SRC)&&SRC.includes('gfxStore("readStorageValue")'),'saved through js/storage.js (its parent\'s in the roulette frame)');
    ok('G5','frame counter only with ?fps=1; precached; classic script');
    console.log(`PASS r90 gfx tier contracts (${checks} checks)`);
  })().catch(e=>{console.error(e);process.exitCode=1;});
}
