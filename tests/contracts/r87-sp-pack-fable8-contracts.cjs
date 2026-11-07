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


// r90 pack smooth (Nik 2026-11-07: the Special Player pack and the Prime Pack were choppy on his Chromebook)
ok("R90-PS1 no beat redraws or re-uploads a card face: every face, coin and flag is prepared once, before the page is shown",()=>{
  assert.ok(!/(?:front|back|coinTex|f\.tex)\.tx\.needsUpdate=true/.test(page),"no per-beat canvas re-upload");
  assert.ok(!/drawCard(?:Back|Front)\(back\.ctx|drawCardFront\(front\.ctx|drawScoutBack\(back\.ctx/.test(page),"the card is never redrawn mid-reveal");
  assert.match(page,/function prepareCards\(\)\{[\s\S]*renderer\.initTexture\(tx\)/,"prepared faces are uploaded up front");
  assert.match(page,/resize\(\); prepareCards\(\); buildEnv\(\);[^\n]*warmTextures\(\); warmDraw\(\); startPlayer\(0\);/,"prepared and warmed before the first frame the game shows");
  for(const beat of ["pos","nat","club"])assert.match(page,new RegExp(`at\\(tt,[0-9.]+,"${beat}",\\(\\)=>\\{ clueMaps\\(`),`${beat} clue only swaps a texture`);
});
ok("R90-PS2 the baked soft stadium photos replace the full-size ones, and only the two shown card tiers are fetched",()=>{
  for(const f of ["stadium","stand","stand_left","stand_right"]){
    assert.ok(!fs.existsSync(path.join(ROOT,`visual-assets/v10_1/special-player/assets/${f}.jpg`)),`${f}.jpg is gone`);
    assert.ok(fs.statSync(path.join(ROOT,`visual-assets/v10_1/special-player/assets/${f}_soft_V1.jpg`)).size<200000,`${f}_soft_V1.jpg is small`);
    assert.ok(page.includes(`assets/${f}_soft_V1.jpg`));
  }
  assert.ok(!/softImage\(/.test(page),"no shrinking at load");
  assert.match(page,/function loadCardArt\(\)\{ const want=new Set\(Object\.values\(pair\)\.map\(p=>p\.tier\)\);/);
});
ok("R90-PS3 quality follows the device: a frame governor under the screen's own pixel ratio, ?fps=1 counter, real-time timeline",()=>{
  assert.match(page,/const DPR=Math\.min\(devicePixelRatio\|\|1, PHONE_GPU\?2:3\);/,"never above the device pixel ratio");
  assert.match(page,/const RS_STEPS=\[\.5,\.625,\.75,\.875,1\]; let rsI=2,/,"starts light, steps up while smooth");
  assert.match(page,/function frame\(\)\{ if\(manual===null\)\{ tick\(true\); govern\(\); \}/);
  assert.match(page,/dt=Math\.min\(\.1,gap\);/,"the timeline keeps real time on a slow device");
  assert.match(reveal,/\[\?&\]fps=1/,"the game passes ?fps=1 to the page");
});
ok("R90-PS4 Prime Pack: art decoded before ready, the pack and the card on their own layers, the shadow off the sheen's layer",()=>{
  const ig=read("visual-assets/v10_1/icon-guess/index.html");
  assert.match(ig,/\.pack, \.card \{ will-change: transform, opacity; \}/);
  assert.match(ig,/\.card::before \{[^}]*filter: drop-shadow/);
  assert.ok(!/\.card \.face \{[^}]*filter:/.test(ig),"no blur on the face the sheen sweeps");
  assert.match(ig,/artReady\.then\(\(\)=>\{ if\(EMBED\) toGame\("cms-ig-ready"/,"ready only after the art is decoded");
});
ok("R90-PS5 Codex P2 #1259: the next player's flag only shows at his nation clue, never during the handover",()=>{
  const start=page.slice(page.indexOf("function startPlayer("),page.indexOf("function settle("));
  assert.ok(!/setFlagTex\(/.test(start),"startPlayer never swaps the flags (Daniel's are still rolling up)");
  assert.match(page,/at\(tt,5\.8,"nat",\(\)=>\{ clueMaps\(2\); setFlagTex\(prep\(\)\.flag\);/,"the flag swaps at the nation clue");
});
console.log(`PASS r87 Special Player pack (Fable job 8) contracts: ${n} checks.`);
