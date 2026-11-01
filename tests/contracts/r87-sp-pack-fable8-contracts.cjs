"use strict";
// r87 Fable job 8 (Special Player pack hunt): the fixes the hunt proved, pinned so they cannot slip back.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const page=read("visual-assets/v10_1/special-player/index.html");
const reveal=read("js/specialPlayerReveal.js");
let n=0;const ok=(label,fn)=>{fn();n+=1;console.log(`ok ${n} ${label}`);};

ok("F8-01 reduced motion: Daniel's card holds its tiered time and the scouting card shows (cut, no turn)",()=>{
  assert.match(page,/if\(idx===0&&k>SCOUT_END\+\.15\) startHandover\(\);/,"one hand-over time for every motion setting");
  assert.ok(!/REDUCED\?\.2:/.test(page),"the .2 s reduced-motion hand-over is gone");
  assert.match(page,/\(REDUCED\?scoutCut\(k\):scoutFlip\(k\)\)/,"reduced motion cuts to the scouting card");
  assert.match(page,/function scoutCut\(k\)\{[^\n]*SCOUT_IN[^\n]*SCOUT_END[^\n]*Math\.PI/,"the cut holds the scouting side between the flip times");
});

ok("F8-02 phase timers use a simulated clock that stops while the page is hidden",()=>{
  assert.match(page,/const clock=\(\)=>manual!==null\?manual:simT;/);
  assert.match(page,/if\(manual===null\) simT\+=Math\.min\(\.25,gap\);/,"a lock or hidden tab adds at most .25 s");
  assert.ok(!/const clock=\(\)=>manual!==null\?manual:performance\.now\(\)/.test(page),"no wall-clock phase timers");
  // A 15 s lock during the hold: the next frame moves the simulated clock by .25 s only.
  let simT=100,last=100;const step=to=>{const gap=Math.max(0,to-last);last=to;simT+=Math.min(.25,gap);return simT;};
  step(100.016);const before=simT;step(115.016);assert.ok(simT-before<=.25+1e-9);
});

ok("F8-03 a font that fails to load never stops the page",()=>{
  assert.match(page,/\.map\(f=>document\.fonts\.load\(f\)\)\)\.catch\(\(\)=>null\)/);
});


ok("F8-05 half-float targets only where the GPU can render to them",()=>{
  assert.match(page,/RT_TYPE=HDR\?T\.HalfFloatType:T\.UnsignedByteType/);
  assert.ok(!/type:T\.HalfFloatType/.test(page),"no render target hard-codes half-float");
  assert.match(page,/thr:\{value:HDR\?1\.5:\.8\}/);
});

ok("F8-06 sound unlocks on the end of a touch too, and a refused resume is ignored",()=>{
  assert.match(page,/addEventListener\("pointerup",unlockSound,true\); addEventListener\("touchend",unlockSound,true\);/);
  assert.match(page,/Promise\.resolve\(ctx\.resume\(\)\)\.catch\(\(\)=>\{\}\)/);
});

ok("F8-07 every shader compiles during the loading screen",()=>{
  assert.match(page,/buildEnv\(\); try\{ renderer\.compile\(scene,camera\); \}catch\(e\)\{\}[^\n]*startPlayer\(0\);/);
});

ok("F8-11 Replay drops the last run's pending cues",()=>{
  assert.match(page,/function replay\(\)\{ queue\.length=0;/);
});


console.log(`PASS r87 Special Player pack (Fable job 8) contracts: ${n} checks.`);
