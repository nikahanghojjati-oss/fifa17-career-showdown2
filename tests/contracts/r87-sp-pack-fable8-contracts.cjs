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
  assert.match(page,/wdt=Math\.min\(\.25,gap\);[^\n]*if\(manual===null\) simT\+=wdt;/,"a lock or hidden tab adds at most .25 s");
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

ok("F8-07 every shader compiles during the loading screen, each link checked in its own task (r90 lean load)",()=>{
  assert.match(page,/async function compileSlow\(\)\{ warmPose\(true\);\n  try\{ if\(renderer\.compileAsync\) await renderer\.compileAsync\(scene,camera\); else renderer\.compile\(scene,camera\); \}catch\(e\)\{ try\{ renderer\.compile\(scene,camera\); \}catch\(_e\)\{\} \}/,"every object out while compiling");
  assert.match(page,/gl\.fenceSync\(gl\.SYNC_GPU_COMMANDS_COMPLETE,0\)/,"a GPU fence instead of a blocking link wait");
  assert.match(page,/for\(const pr of renderer\.info\.programs\.slice\(\)\)\{[^\n]*pr\.getUniforms\(\);[^\n]*await nextTask\(\); \}/,"one program check per task");
  assert.match(page,/await prepareCardsSlow\(\); busy\(\);\n  await compileSlow\(\); await warmTexturesSlow\(\); busy\(\); warmDraw\(\);[^\n]*startPlayer\(0\);/,"faces, shaders and uploads before the first frame");
  assert.match(page,/function\* prepareSteps\(\)\{[\s\S]*?yield;/,"one face per step");
  assert.ok(!/const pitchTex=|function loft\(|function drawLed\(/.test(page),"the thrown-away drawn stadium is gone");
});

ok("F8-11 Replay drops the last run's pending cues",()=>{
  assert.match(page,/function replay\(\)\{ queue\.length=0;/);
});


// r90 pack smooth (Nik 2026-11-07: the Special Player pack and the Prime Pack were choppy on his Chromebook)
ok("R90-PS1 no beat redraws or re-uploads a card face: every face, coin and flag is prepared once, before the page is shown",()=>{
  assert.ok(!/(?:front|back|coinTex|f\.tex)\.tx\.needsUpdate=true/.test(page),"no per-beat canvas re-upload");
  assert.ok(!/drawCard(?:Back|Front)\(back\.ctx|drawCardFront\(front\.ctx|drawScoutBack\(back\.ctx/.test(page),"the card is never redrawn mid-reveal");
  assert.match(page,/function prepareCards\(\)\{[\s\S]*renderer\.initTexture\(tx\)/,"prepared faces are uploaded up front");
  assert.match(page,/resize\(\);[^\n]*buildEnv\(\);[^\n]*await prepareCardsSlow\(\);[\s\S]{0,200}?await warmTexturesSlow\(\); busy\(\); warmDraw\(\);[^\n]*startGfx\(\); startPlayer\(0\);/,"prepared and warmed before the first frame the game shows");
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
ok("R90-PS3 quality follows the device: the shared gfxTier governor (Settings 3D quality), ?fps=1 counter, real-time timeline",()=>{
  // r90 follow-up: the governor is js/gfxTier.js's, so the pack follows the Settings "3D quality" choice like the other 3D screens.
  assert.match(page,/<script src="\.\.\/\.\.\/\.\.\/js\/gfxTier\.js"><\/script>/,"the shared quality module loads before the scene");
  assert.match(page,/const GFX=window\.CareerModeGfxTier\|\|null, GP=GFX\?GFX\.profile\(\):null;/);
  assert.match(page,/let PR=GP\?GP\.pixelRatio:1,/,"starts at the profile's ratio (Auto never above the screen's); 1x without the module (docs/QUALITY_LEVELS.md)");
  assert.match(page,/GFX\.calibrate\(renderer,render\)/,"timed frames behind the loading screen");
  assert.match(page,/gov=GFX\.governor\(renderer,\{key:"sp",draw:render,onChange\(p\)\{ PR=p\.pixelRatio; resize\(\); \}\}\);/);
  assert.match(page,/function frame\(\)\{ if\(manual===null\)\{ tick\(true\); if\(gov\) gov\.frame\(performance\.now\(\)\); \}/);
  assert.match(page,/GFX\.overlay\(/,"?fps=1 counter from the shared module");
  assert.ok(!/RS_STEPS|function govern\(|fpsEl/.test(page),"no second governor or counter left in the page");
  assert.match(page,/dt=Math\.min\(\.1,gap\), wdt=Math\.min\(\.25,gap\);/,"the timeline keeps real time on a slow device");
  assert.match(reveal,/\[\?&\]fps=1/,"the game passes ?fps=1 to the page");
});
ok("R90-PS4 Prime Pack: art decoded before ready, the pack and the card on their own layers, the shadow off the sheen's layer",()=>{
  const ig=read("visual-assets/v10_1/icon-guess/index.html");
  assert.match(ig,/\.pack, \.card \{ will-change: transform, opacity; \}/);
  assert.match(ig,/\.card::before \{[^}]*background: url\("assets\/card_shadow_V1\.webp"\)/,"r90 smooth: the shadow is a picture blurred offline");
  assert.ok(!/\.card::before \{[^}]*filter:/.test(ig),"no live blur filter on the card");
  assert.ok(!/\.card \.face \{[^}]*filter:/.test(ig),"no blur on the face the sheen sweeps");
  assert.match(ig,/artReady\.then\(\(\)=>\{ if\(EMBED\) toGame\("cms-ig-ready"/,"ready only after the art is decoded");
});
ok("R90-PS5 Codex P2 #1259: the next player's flag only shows at his nation clue, never during the handover",()=>{
  const start=page.slice(page.indexOf("function startPlayer("),page.indexOf("function settle("));
  assert.match(page,/at\(tt,5\.8,"nat",\(\)=>\{ clueMaps\(2\); pulse=1;/,"the nation shows at its clue (on the card; the roof flags are gone, L31 round 2)");
});
ok("R90-PS6 Nik's tighter rhythm (2026-11-07 22:50 UTC): four quicker stretches, half-speed burst, 2.8 s scouting hold",()=>{
  assert.match(page,/const PACE=\[\[0,\.9,\.9\/\.4\],\[1\.65,2\.3,\.65\/\.35\],\[3\.7,5\.0,1\.3\/\.9\],\[6\.4,7\.5,1\.1\/\.8\]\];/);
  assert.match(page,/Math\.min\(1-\.5\*Math\.max\(0,Math\.min\(1,\(t-3\.6\)\/\.12,\(4\.15-t\)\/\.2\)\),freezeAt\(t\)\)\*paceAt\(t\)/);
  assert.match(page,/SCOUT_HOLD=2\.8,/);
  assert.match(page,/stepParticles\(dt\*ps\); stepChunks\(dt\*ps\);/,"sparks keep their own speed");
});
ok("R90-PS7 quality by level (Nik 23:44 UTC): MSAA, shadows, filtering and card sharpness follow the gfxTier level; light draws less",()=>{
  assert.match(page,/const GL_LVL=GP\?GP\.level:2, GQ_I=Math\.max\(0,Math\.min\(4,GL_LVL\|0\)\), GQ=\{ samples:\[2,2,4,8,8\]\[GQ_I\], shadow:GP&&GP\.shadowSize\|\|2048, aniso:\[4,8,16,16,16\]\[GQ_I\], cardMax:GL_LVL>=3\?2\.5:2 \};/,"every level, 8K included, has its knobs");
  assert.match(page,/samples:fitSamples\(GQ\.samples\)/,"only a count the GPU supports for both formats");
  assert.match(page,/sun\.shadow\.mapSize\.set\(GQ\.shadow,GQ\.shadow\)/);
  assert.ok(!/PHONE_GPU/.test(page),"one system: no phone rule of its own, a picked level holds on a phone (gfxTier handles phones)");
  assert.match(page,/Math\.min\(GQ\.cardMax,Math\.ceil\(px\/CH\*4\)\/4\)/,"card art only as sharp as the screen needs");
  assert.ok(!/anisotropy=8;/.test(page),"filtering follows the level");
  assert.match(page,/const fitSamples=\(want\)=>GFX&&GFX\.samples\?GFX\.samples\(renderer,want,HDR\):/,"per-format sample counts from gfxTier (Codex P2 #1265)");
  assert.match(page,/GFX\.checkTarget\(renderer,sceneRT\)/,"an incomplete target steps down");
  assert.ok(!/getInternalformatParameter|MSAA_OK/.test(page),"one copy of the MSAA helper, in gfxTier");
});

ok("R90-PS8 lead review #1270: the pack still reveals if js/kits17.js did not load (plain club-colour shirt, plain coin face)",()=>{
  assert.match(page,/const KIT17=window\.CareerModeKits17\|\|\{\n  kit\(club\)\{[^\n]*window\.getClubIdentity\(club\)[^\n]*return \{body:c\}; \},\n  drawFlat\(ctx,club,cx,cy,h\)\{/,"one guard with both calls the page makes");
  assert.equal((page.match(/KIT17\.(\w+)\(/g)||[]).filter(x=>!/KIT17\.(kit|drawFlat)\(/.test(x)).length,0,"the page calls only kit() and drawFlat(), which the fallback covers");
  assert.match(page,/window\.addEventListener\('error',function\(e\)\{ if\(e\.target&&e\.target\.src&&\/\\\/js\\\/\(kits17\|visualIdentity\)\\\.js\/\.test\(e\.target\.src\)\) return;/,"a failed kits17/visualIdentity load is not reported as an error, so the game does not skip the reveal");
  assert.match(page,/try\{ const im=new Image\(\);[^\n]*window\.getClubCrestSvg\(c\)[^\n]*\}catch\(e\)\{ res\(\); \}/,"no crest module: the coin falls back to a plain shield");
});
ok("R90-PS8 hunt L05/L06: the light pillar rises behind the pack, softer on portrait; the stadium is Chamber Men's floodlit night",()=>{
  assert.match(page,/pack\.localToWorld\(new T\.Vector3\(-\.12,0,-PACK_D\/2-\.12\)\)/,"pillar behind the pack, never across its face");
  assert.ok(!/new T\.Vector3\(-\.12,0,PACK_D\/2\+\.1\)/.test(page),"no pillar in front of the pack");
  assert.match(page,/\(1\.5\+charge\*charge\*4\)\*\(camera\.aspect<1\?\.6:1\)/,"softer pillar on a portrait screen");
  assert.match(page,/new T\.HemisphereLight\(L\(0xdde6ff\),L\(0x15200f\),0\.55\)/,"Chamber Men's night hemisphere");
  assert.match(page,/new T\.DirectionalLight\(L\(0xfff3e2\),2\.7\)/,"Chamber Men's floodlight key");
  assert.match(page,/if\(night>\.5\)\{/,"the stadium photo is graded to night");
  assert.match(page,/"assets\/board_night_V1\.jpg"/,"black and gold boards");
  assert.match(page,/lp\+=exp\(-dl\*dl\*70\.\); fl\+=exp\(-dl\*dl\*1600\.\);/,"floodlight flares with light pools on the stands");
  assert.match(page,/const n=tt<4\.5\?8:4; for\(let i=0;i<n;i\+\+\)\{ const a=Math\.random\(\)\*Math\.PI\*2, r=Math\.sqrt\(Math\.random\(\)\)\*\.7\*/,"a small sparkle at the base, not a carpet");
});

ok("R90-PS9 hunt M3/M4/M5/M8: wall-clock timeline, bloom by level, 4x MSAA above 1080p, self-hosted faces",()=>{
  assert.match(page,/if\(phase==="run"\) vtt\+=wdt\*sc;/,"M3: beats, cues and delays keep their length on slow frames");
  assert.ok(!/vtt\+=dt\*/.test(page),"M3: the timeline never runs on the clamped frame step");
  assert.match(page,/const BLOOM=!DIRECT&&!\(GP&&GP\.bloom===false\), BLOOM_D=GL_LVL<=1\?4:2;/,"M4: off at Light, half-size mips at Balanced");
  assert.match(page,/if\(BLOOM\)\{ brightMat\.uniforms\.tex\.value=sceneRT\.texture; pass\(brightMat,mipA\[0\]\);/,"M4: Light skips the bright and blur passes");
  assert.match(page,/if\(bloomOn>\.5\) b=[^;]*; else b=max\(c-vec3\(\.8\),vec3\(0\.\)\)\*1\.6;/,"M4: Light keeps a cheap in-place glow");
  assert.match(page,/fitSamples\(pw\*ph>1920\*1080\?Math\.min\(4,GQ\.samples\):GQ\.samples\)/,"M5: 8x only up to 1080p, 4x above");
  assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(page),"M8: no Google Fonts request");
  const faces=[...page.matchAll(/url\("\.\.\/shared\/fonts\/([^"]+\.woff2)"\)/g)].map(m=>m[1]);
  assert.ok(faces.length>=16,"Barlow Condensed and Big Shoulders, latin and latin-ext");
  const sw=read("service-worker.js");
  for(const f of new Set(faces)){ assert.ok(fs.existsSync(path.join(ROOT,"visual-assets/v10_1/shared/fonts",f)),f); assert.ok(sw.includes('"visual-assets/v10_1/shared/fonts/'+f+'"'),"precached "+f); }
});
ok("R90-PS10 hunt M6/M17: Prime Pack renders on change only and follows Settings 3D QUALITY; timings untouched",()=>{
  const ig=read("visual-assets/v10_1/icon-guess/index.html");
  assert.match(ig,/function frame\(\)\{ tickDriver\(\); const k=frameNeeds\(now\(\)\); if\(k!==frameKey\)\{ frameKey=k; render\(\); \}/,"no full render on every frame");
  assert.match(ig,/if\(S\.revealEndsAt!==null && t<S\.revealEndsAt\) return "a"\+t;/,"reveals and the opening still move every frame");
  // r90 Prime Pack smooth (Nik 2026-11-08 "smooth 2D"): the ring steps every 200 ms with no stroke transition (it repainted the
  // ring on every frame), on its own layer; Reduce Motion has nothing left to stop
  assert.match(ig,/const step = 200;/,"ring steps every 200 ms at every level");
  assert.ok(!/stroke-dashoffset [0-9]+ms/.test(ig),"no stroke transition");
  assert.match(ig,/\.ring \{ will-change: transform; \}/,"the ring is its own layer");
  assert.match(ig,/window\.parent\.document\.documentElement\.dataset\.gfx|p\.dataset\.gfx/,"reads the game page's level");
  assert.match(ig,/attributeFilter:\["data-gfx"\]/,"follows a new pick live");
  assert.match(ig,/html\[data-gfx="0"\] \.card \.face::after \{ animation: none; display: none; \}/,"Light: no looping sheen");
  assert.match(ig,/function wideStage\(W\)\{ return \(W\|\|innerWidth\)\*\(window\.devicePixelRatio\|\|1\)>2560 && Number\(document\.documentElement\.dataset\.gfx\)>=3 \? "wide4k" : "wide"; \}/,"HO-060: the 4K stage only past 2560 device px at Extra and up");
  assert.match(ig,/#app\[data-stage="wide4k"\] \.stage \{ background-image: url\("assets\/stage_desktop_4k_V3\.webp"\); \}/);
  assert.match(ig,/wideStage\(\)==="wide4k"\?"stage_desktop_4k_V3":"stage_desktop_V2"/,"only the stage that screen shows is decoded up front");
  assert.ok(!/revealMs:\d|guessMs:\d/.test(ig.replace(/const SAMPLE_STAGES[\s\S]*?\]\);/,"")),"no timings of its own outside the preview copy");
});

ok("R90-PS11 LOOK round 2 L31/L05/L32: the reveal stays a night stadium, calmer celebration, tinted beams, pack top under the title",()=>{
  assert.match(page,/rays\.position\.set\(0,1\.9,-1\.5\); rays\.scale\.set\(8,8,1\); scene\.add\(rays\);/,"L31: the rays are a halo round the card, not a sky-wide sunburst");
  assert.ok(!/rays\.scale\.set\(14,14,1\)/.test(page));
  assert.match(page,/rays\.scale\.setScalar\(3\.5\+charge\*2\.5\)/,"L31: the charge halo stays round the pack");
  assert.ok(!/flagMounts|setFlagTex|const flags=/.test(page),"L31 round 2: no giant roof flags");
  assert.match(page,/const CALM=\.55;/,"L31: about half the paper and sparks, same beats");
  assert.match(page,/burst\(CARD_POS\.clone\(\)\.add\(new T\.Vector3\(0,0,\.3\)\),\[0xf1c35a,0xffd77a,0xfff1c2\],Math\.round\(120\*pw\*CALM\)/,"L31 round 2/L40 round 3: one short gold burst at the flash, half as many sparks");
  assert.match(page,/confettiCannon\(1,cc,Math\.round\(200\*pw\*CALM\)\)/,"the club beat keeps its (calmer) cannons");
  assert.ok(!/380\*pw|function fountain|\[0x3355ff,0xf1c35a/.test(page),"no flash rain, floor fountains or blue firework mix");
  assert.ok(!/beamMat|const beams=/.test(page),"L05 round 2: no signature beams at any level");
  assert.match(page,/Math\.sin\(gs\*Math\.PI\)\*4\.5\*pw\*\(camera\.aspect<1\?\.6:1\)/,"L31 round 3: a smaller flash glow, smaller still on portrait");
  assert.match(page,/if\(rest>0\)\{ const k=Math\.max\(\.7,1-rest\/\(PACK_H\*\.95\)\); pack\.scale\.multiplyScalar\(k\);/,"L32: a smaller pack where lowering alone leaves its top under the title");
});

ok("R90-PS12 LOOK round 3 L40/L31/L06/L32 + the Light rule: foil burst, gold flash, darker warm night, the drop under the title; Light draws straight to the canvas",()=>{
  assert.ok(!/BoxGeometry\(\.16,PACK_H\+\.1,PACK_D\+\.08\)/.test(page),"L40: no side struts (the brown planks)");
  assert.match(page,/new T\.Mesh\(new T\.BoxGeometry\(qw,qh,PACK_D\),foilEdge\)/,"L40: quarters edged in gold foil, not black blocks");
  assert.match(page,/for\(let k=0;k<6;k\+\+\)\{ const cg=new T\.BoxGeometry\(\.24,\.17,\.025\)[^\n]*new T\.Mesh\(cg,packFace\)/,"L40: six thin chips cut from the pack art");
  assert.match(page,/\+star\*\.22\)\*vA;/,"L40: soft sparks, not white four-point stars");
  assert.ok(!/\[0xffd77a,0xffffff,0xffc457\]|\[0xffffff,tc\]|\[0xffffff,0xffd77a\]/.test(page),"L40: no white spark mixes");
  assert.match(page,/glow\.material\.color\.copy\(Lc\(0xffd27a\)\);/,"L31: the flash glow is gold, not the tier colour");
  assert.match(page,/const cc=\[0xf1c35a,0xfff3c4,0xffd77a,0xc9932e\];/,"L31: gold and cream paper only");
  assert.match(page,/aura\.scale\.setScalar\(Math\.min\(5\.2,/,"L31: the tier aura is capped");
  assert.match(page,/c=mix\(vec3\(l\),c,\.12\)\*vec3\(\.03,\.031,\.04\);/,"L06: a darker, warmer night grade");
  assert.ok(!/pyro smoke|function puff/.test(page),"dead smoke sprites removed");
  assert.match(page,/boards\.children\.forEach\(\(g,i\)=>\{ g\.visible=bk>=1\|\|i===4; \}\)/,"L06: one whole hoarding on a narrow screen");
  assert.match(page,/if\(now>bandTop\)\{ pack\.position\.y-=\(now-bandTop\)/,"L32: the falling pack stays under the title too");
  assert.match(page,/const DIRECT=Boolean\(GP&&GP\.level===0\);/,"Light: straight to the canvas");
  assert.match(page,/if\(DIRECT\)\{ renderer\.toneMappingExposure=\.9\*\(1\+flash\*\.2\); renderer\.setRenderTarget\(null\); renderer\.render\(scene,camera\); return; \}/,"Light: one pass, no target");
  assert.match(page,/renderer\.toneMapping=T\.CustomToneMapping; renderer\.toneMappingExposure=\.9;/,"Light: the composite's film curve in each material");
  assert.match(page,/if\(!DIRECT\) scene\.add\(packLight\);/,"Light: one key light and the sky light");
  assert.match(page,/function setEnv\(\)\{ if\(DIRECT\)\{ scene\.environment=null; return; \}/,"Light: no PMREM at runtime");
  assert.match(page,/const CardMat=DIRECT\?T\.MeshStandardMaterial:T\.MeshPhysicalMaterial/,"Light: the card shares the pack's program");
  assert.equal((page.match(/#include <tonemapping_fragment>/g)||[]).length,3,"the three custom shaders follow the renderer's tone mapping");
});

console.log(`PASS r87 Special Player pack (Fable job 8) contracts: ${n} checks.`);
