#!/usr/bin/env node
'use strict';
// r89 Roster Russian Roulette scene polish (Nik 2026-11-04: "frame rate, easing, sound sync, and polish of RRR ... all camera movement
// should feel seamless, especially when the cylinder stops spinning, the camera settles into the shooter's perspective, and the shot
// happens"). The scene is visual-assets/v10_1/roulette/index.html.
//   P1 the settle curve: starts at rest with no jolt and no jerk, rises to exactly 1, its speed has one peak and only falls after it, and
//      it is still moving at the shot (the creep), so the camera never parks before the hammer falls;
//   P2 the drum run is the whole turns plus the true angle from where it rested to the planned chamber (no snap back onto the start hole),
//      the smooth spin table gives a share of the run, and reduced motion keeps the rest angle only;
//   P3 sound sync: cues go on the audio clock ahead of their beat (SFX.play(name, vol, delay) + cue()), drum ticks are solved to the instant a
//      chamber line is crossed, the crane-shut click lands when the crane seats, the shot and the splinter are scheduled cues, and the old
//      doubled heartbeat and the extra click after the crane shut are gone;
//   P4 the camera from the drum close-up to the shot is one branch on the settle clock (path, look and lens), the old three-piece glide is gone;
//   P5 frame rate (r90): one static shadow map, no bloom chain, standard materials, two point lights, no marble hall, quality and governor from
//      js/gfxTier.js (held during a turn), shaders and textures warmed before ready, baked props, the hit frame uploaded before the spin;
//   P7 no spoiler (r90): until the hit nothing names or points out the target;
//   P11 (r90 LOOK L27) no spin before the scene is ready; six spins in a row start and end with no page error;
//   P12 (r90 LOOK L10/L28) the board is the club's own (crest, no dead tabs, late kits redrawn); side walls with lamps from High up;
//   P13 (r90 LOOK L29) the revolver's steel reflects its own small studio at the room's size, satin drum with seven flutes;
//   P9 (r90 LOOK L08/L09) close rest shot on the revolver, words in the bottom strip, the gold button only when there is a tap;
//   P10 (r90 MOTION M8/M9/M13/M15/M30) local title fonts, Opus cues loaded at once with a WAV fallback, shaders built in batches that
//      report progress (and the step renews its wait on it), the drum/crane/hammer baked, faded flash sprites skipped, a lost context hands back;
//   P14 (r90 MOTION M31) ?showcase=1 plays the demo loop on the game's path; ?bench=1 (Device check) still plays it and times frames;
//   P15 (r90 LOOK L37) on a tall phone the rest picture is shifted down so both board faces clear the title;
//   P6 (real scene, software WebGL) one fired turn stepped on the scene's own clock: the camera never cuts (every tick's step is small),
//      from the crane shut to the shot its speed has one peak and then only falls, it is still creeping at the shot, and the drum stops on
//      the planned chamber. CMS_RRR_SCENE_SKIP_BROWSER=1 skips P6 (no Chromium).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const PAGE=path.join(ROOT,'visual-assets/v10_1/roulette/index.html');
const html=fs.readFileSync(PAGE,'utf8');
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r89 RRR scene polish contracts ended before their last check.');process.exitCode=1;}});
const has=(re,what)=>assert.ok(re.test(html),`index.html has ${what}`);
const lacks=(re,what)=>assert.ok(!re.test(html),`index.html no longer has ${what}`);

// P1 the settle curve, evaluated from the page's own definition.
{
  const m=/const SETTLE_A=([\d.]+), SETTLE_F=\(u\)=>\{ const x=SETTLE_A\*u; return 1-\(1\+x\+x\*x\/2\)\*Math\.exp\(-x\); \}, SETTLE_N=SETTLE_F\(1\), SETTLE=\(u\)=>SETTLE_F\(u\)\/SETTLE_N;/.exec(html);
  assert.ok(m,'the settle curve is the third-order damped step, normalised');
  const A=Number(m[1]);const F=u=>{const x=A*u;return 1-(1+x+x*x/2)*Math.exp(-x);};const K=u=>F(u)/F(1);
  assert.equal(K(0),0);assert.ok(Math.abs(K(1)-1)<1e-12,'reaches exactly 1');
  const n=2000,v=[];let prev=0;
  for(let i=1;i<=n;i+=1){const k=K(i/n);assert.ok(k>prev,'the settle only rises');v.push((k-prev)*n);prev=k;}
  assert.ok(v[0]<1e-3&&v[1]<1e-3,'no jolt: speed starts at zero');
  assert.ok(v[1]-v[0]<1e-3,'no jerk: acceleration starts at zero');
  const peak=v.indexOf(Math.max(...v));
  assert.ok(peak/n>.15&&peak/n<.4,`the speed peaks a third of the way in (at ${(peak/n).toFixed(2)})`);
  for(let i=peak+1;i<n;i+=1)assert.ok(v[i]<=v[i-1]+1e-9,'after its peak the speed only falls');
  assert.ok(v[n-1]>.01&&v[n-1]<.1*v[peak],`still creeping at the shot (${v[n-1].toFixed(3)} of the peak ${v[peak].toFixed(2)})`);
  ok('P1',`settle curve a=${A}: no jolt, no jerk, one speed peak at ${(peak/n).toFixed(2)}, falling after it, creeping at the end (${(100*v[n-1]/v[peak]).toFixed(1)}% of peak)`);
}

// P2 the drum run.
has(/const runDown=\(REDUCED\?0:SPIN\.T\)\+back;/,'runDown = whole turns + the angle from the rest position (reduced motion: that angle only)');
has(/let back=\(p\.cyl0-cylTarget\(\)\)%TAU; if\(back<0\) back\+=TAU;/,'the remaining angle from where the drum rested');
has(/return 1-c\/area; \} \}; \}\)\(\);/,'SPIN.rem gives the share of the run still to go');
has(/const r=SPIN\.rem\(q\)\*runDown/,'the drum angle scales the share by the whole run');
has(/let showExtra=tt<B\.close\?runDown:0/,'before the crane opens the drum sits where it rested');
has(/cyl0:cyl\.rotation\.z/,'the turn records the rest angle');
ok('P2','the drum runs SPIN.T whole turns plus the true angle to the planned stop, never a snap back to its start hole');

// P3 sound sync.
has(/const nowT=\(\)=>ctx\.currentTime\+lead;/,'the audio clock takes a lead');
has(/play\(name,vol,delay\)\{ if\(!on\|\|!ctx\) return; lead=delay>0\?delay:0;/,'SFX.play schedules a cue ahead by delay');
has(/const CUE_LA=\.06; function cue\(tt,t,k,name,vol\)\{ if\(tt>=t-CUE_LA&&!fired\[k\]\)\{ fired\[k\]=1; SFX\.play\(name,vol,Math\.max\(0,t-tt\)\); \} \}/,'cue() puts a beat on the audio clock CUE_LA early for its exact time');
has(/cue\(tt,B\.inside\+\.42,"craneShut","click",1\)/,'the crane-shut click lands when the crane seats');
has(/while\(p\.tickLine>=0&&angle\(kOf\(tt\+CUE_LA\)\)<p\.tickLine\*\(TAU\/7\)\+1e-6\)\{/,'drum ticks are solved ahead for each chamber line');
has(/for\(let i=0;i<14;i\+\+\)\{ const m=\(lo\+hi\)\/2; if\(angle\(kOf\(m\)\)>goal\) lo=m; else hi=m; \}/,'the crossing instant is found by bisection');
has(/SFX\.play\("click",\.22\+\.5\*Math\.max\(0,1-spinW\/14\),Math\.max\(0,hi-tt\)\)/,'each tick is scheduled at its crossing');
has(/cue\(tt,B\.fire,"shot",p\.fire\?"bang":"dry"\); if\(p\.fire\) cue\(tt,B\.impact,"splinterCue","splinter"\);/,'the shot and the splinter are scheduled cues');
has(/cue\(tt,B\.hand,"handUp","handUp"\); cue\(tt,B\.cock,"cock","cock"\); cue\(tt,B\.aim,"heart","heart"\);/,'hand, hammer and one heartbeat run are scheduled cues');
lacks(/heart2/,'the second heartbeat run over the bang');
lacks(/at\(tt,B\.turnC/,'the extra click after the crane shut');
lacks(/SFX\.play\("bang"\)|SFX\.play\("dry"\)|SFX\.play\("splinter"\)/,'frame-triggered shot sounds');
lacks(/at\(tt,B\.inside,"craneShut"/,'the crane-shut click at the start of the swing');
ok('P3','sound cues sit on the audio clock: ticks at the hop instants, the crane click at the seat, one heartbeat run, scheduled shot and splinter');

// P4 the camera.
has(/else if\(tt<B\.fire\+\.12\)\{ \/\* r89 polish \(Nik: "when the cylinder stops spinning/,'one camera branch from the drum close-up to the shot');
has(/const u=S\(GL0,B\.fire-GL0,tt\), K=SETTLE\(u\);/,'the branch runs on the settle clock');
has(/new T\.CatmullRomCurve3\(\[insidePos,mid,povPos,P3\],false,"centripetal"\)\.getPointAt\(K\)/,'the path is one smooth curve by arc length');
has(/fov=lerp\(insideFov,povFov-2,K\);/,'the lens shares the clock');
has(/const GL0=REDUCED\?B\.inside:B\.inside\+\.15;/,'the glide leaves while the crane shuts');
lacks(/else if\(tt<B\.hand\+1\.4\)/,'the old three-piece glide');
lacks(/else if\(tt<B\.fire\+\.25\)/,'the old creep branch');
has(/const e=1-Math\.pow\(1-k,2\); const prev=spin\.rotation\.y; spin\.rotation\.y=p\.yaw0\+total\*e;/,'the gun yaw runs down under constant friction');
lacks(/Math\.sin\(\(tt-B\.spinEnd\)\*14\)/,'the gun wobble after the stop');
ok('P4','drum close-up to shot is one motion on the settle clock; the gun yaw stops under plain friction with no wobble or snap');

// P5 frame rate (r90, Nik 2026-11-07: the first open crashed his Chromebook; choppy after). The page draws lean and never stalls mid-turn.
has(/renderer\.shadowMap\.autoUpdate=false;/,'the shadow map is not redrawn every frame');
has(/renderer\.setSize\(w,h,false\); renderer\.shadowMap\.needsUpdate=true; if\(GOV\) GOV\.resize\(\); fitUnderTitle\(\); \}/,'the one static shadow map is drawn when the room is laid out');
lacks(/shadowCool/,'the per-turn shadow redraw');
has(/gun\.traverse\(o=>\{ if\(o\.isMesh\)\{ o\.castShadow=false;/,'the moving revolver casts no map shadow (its contact shadow is a picture)');
lacks(/EffectComposer|UnrealBloomPass|OutputPass|makePost|INV_ACES/,'the bloom post chain and its tone-mapping workaround');
// r90 high quality: the second lobes (lacquer, glaze, velvet) exist only from High up; Light and Balanced keep one-lobe materials and plain three.js meshes.
assert.equal((html.match(/MeshPhysicalMaterial/g)||[]).length,1,'one place makes a two-lobe material');
has(/const HIGH_UP=GFX\.level>=2, EXTRA_UP=GFX\.level>=3, LIGHT=GFX\.level===0;[\s\S]{0,600}?\nfunction mat\(p,lobe2\)\{ return HIGH_UP&&lobe2\?new T\.MeshPhysicalMaterial\(Object\.assign\(\{map:WHITE1\},/,'and only from High up');
has(/return lv>=3\?2:lv>=2\?1\.5:1;/,'round parts get more segments only from High up');
has(/const T=SEGK===1\?THREE:/,'Light and Balanced build with plain three.js');
lacks(/new T\.MeshStandardMaterial\(\{[^}]*(clearcoat|sheen)/,'no clearcoat or sheen on a standard material');
// r90 (Nik 2026-11-08: "dark room for the lower quality, a proper background with tables for the higher, nothing excessive"): the room
// by level. Light and Balanced build and download nothing behind the table; High adds a dark far wall with glowing lamps (no lights);
// Extra, Ultra and 8K add the sharp café picture (Team V RR_ROOM_V2, 4K on Ultra up), the café tables and one room light.
has(/const HIGH_UP=GFX\.level>=2, EXTRA_UP=GFX\.level>=3, LIGHT=GFX\.level===0;/,'High and Extra are the two room steps');
has(/EXTRA_UP\?loadImg\(ROOM_BIG\?"assets\/RR_ROOM_V2_4K\.webp":"assets\/RR_ROOM_V2_1080\.webp"\):null/,'the café picture loads only on Extra up');
has(/const ROOM_BIG=\(GFX\.assetLevel\?\?GFX\.level\)>=3&&Math\.max\(screen\.width\|\|0,screen\.height\|\|0\)\*\(devicePixelRatio\|\|1\)>2560;/,'the 4K file only above 2560 device pixels');
has(/if\(HIGH_UP\)\{ const lampTex=lampGlassTex\(\)/,'the far wall and its lamps are built only from High up');
has(/if\(EXTRA_UP\)\{ const top=mat\(/,'the café tables only from Extra up');
has(/if\(hallLamps\) hallLamps\.visible=false; scene\.fog=null;/,'the picture replaces the far wall and lifts the fog');
lacks(/RR_ROOM\.jpg|RR_ROOM\.webp/,'the old café plates (the 523 KB jpg and the dimmed, faded WebP)');
assert.equal((html.match(/new T\.PointLight\(/g)||[]).length,3,'three point lights: the lantern, the one effects light and the room light');
has(/if\(EXTRA_UP\)\{ const roomLight=new T\.PointLight\(/,'the room light exists only on Extra up');
lacks(/backWall|wallLamp|chandelier|function dado/,'the 2.2.0 hall builders (balcony, ceiling, chandelier: ten lights)');
lacks(/const floorTex=woodTex\(2048/,'the unused 2048 px wood floor texture');
lacks(/for\(let i=0;i<d\.length;i\+=4\)\{ const n=\(Math\.random\(\)-\.5\)\*a;/,'the per-pixel grain loop');
lacks(/Math\.max\(devicePixelRatio\|\|1,1\.5\)/,'the forced 1.5x resolution');
has(/const GFXT=window\.CareerModeGfxTier;/,'quality comes from the shared js/gfxTier.js (no local stand-in)');
has(/<script src="\.\.\/\.\.\/\.\.\/js\/gfxTier\.js"><\/script>/,'gfxTier.js is a required script, so a missing file shows the error screen');
has(/new T\.WebGLRenderer\(\{antialias:GFX\.antialias,/,'antialiasing is the quality level\'s choice');
has(/renderer\.setPixelRatio\(GFX\.pixelRatio\);/,'the start resolution is the quality level\'s');
has(/GOV=GFXT\.governor\(renderer,\{key:"rrr",draw:/,'the shared governor keeps the frames smooth');
has(/if\(GOV\) GOV\.hold\(true\);/,'it holds during a turn');
has(/if\(GOV\) GOV\.hold\(false\);/,'and lets go between turns');
has(/await renderer\.compileAsync\(scene,camera\);/,'every shader compiles behind the loading screen');
has(/renderer\.initTexture\(t\)/,'every texture is on the GPU before the page is ready');
assert.ok(html.indexOf('await warmUp();')<html.indexOf('window.__rrReady=true;')&&html.indexOf('window.__rrReady=true;')<html.indexOf('toGame("cms-rr-ready")'),'ready is said only after the warm-up');
has(/function bake\(root,skip,alias\)/,'static props are baked into one mesh per material');
has(/bake\(table\);/,'the table and everything on it');
has(/bake\(gun,o=>o===crane\|\|o===hammer,LIGHT\?new Map\(\[\[GM\.gold,GM\.brass\]\]\):null\);/,'the revolver frame (the crane, drum and hammer still move)');
has(/function boardFrames\(key,pick,fire\)/,'the board\'s hit look is pre-rendered');
has(/frames=ready&&fire&&ready\.i===b\.bubbles\.indexOf\(pick\)\?ready:boardFrames\(who,pick,fire\); delete prepared\[turn\]; if\(frames&&b\.bubbles\[frames\.i\]\) pick=b\.bubbles\[frames\.i\];/,'pre-rendered before the spin starts (in the game already at setup)');
has(/function prepareHits\(\)\{ if\(!GAME\|\|turn>0\) return;/,'the game\'s planned shots are drawn while the screen is read');
has(/try\{ renderer\.initTexture\(c\.__tex\); \}catch\(e\)\{\} return \{i,plain,hit:c\}; \}/,'and sent to the GPU then, on its own texture');
has(/if\(p\.frames&&p\.frames\.hit&&p\.frames\.i===i\) showFrame\(p\.who,p\.frames\.hit,b\.userData\.hit\); else drawBoard/,'the hole and stamp are a texture swap');
has(/addEventListener\("pagehide",e=>\{ if\(e\.persisted\)\{ cancelAnimationFrame\(rafId\); rafId=0; return; \} disposeAll\(\); \}\);/,'leaving the page frees the GPU at once; a page kept in the back-forward cache only pauses');
has(/addEventListener\("pageshow",e=>\{ if\(e\.persisted&&window\.__rrReady&&!rafId\) rafId=requestAnimationFrame\(frame\); \}\);/,'and a page restored from that cache picks up its frame loop again');
has(/if\(manual===null&&playing&&last>0&&t-last>\.25\) playing\.t0\+=t-last-\.016;/,'with the turn clock moved past the pause, so the turn resumes where it stopped');
ok('P5','lean frame: static shadow, no bloom chain, standard materials, calm lights (the room light only on Extra up), the room by level, shared quality governor held during turns, warm-up before ready, baked props, pre-uploaded hit frame, dispose on exit');

// P7 no spoiler (r90, Nik 2026-11-07: "never reveal who the gun is aiming at while it is locking on; only say the target when hit/removed").
lacks(/"Aimed at "\+T/,'the status line naming the target before the shot');
has(/st:N\+" takes aim at the board"/,'the aim beat names the board only');
lacks(/at\(tt,B\.aim,"select"/,'the board marking the target before the shot');
lacks(/b\.sel===|\.sel=/,'any selected-player look on the board');
has(/const aim=boardAimWorld\(who\); const dir=aim\.clone\(\)\.sub\(spin\.position\); playing\.yawTarget=Math\.atan2\(dir\.x,dir\.z\);/,'the revolver on the felt stops on the middle of the board');
has(/handAimAt=aimAt;/,'the hand aims at the middle of the board');
has(/const tx=0, ty=0, hs=who==="D"\?-1:1;/,'the shooter\'s view frames the board, not the player');
{ const w=html.slice(html.indexOf('function beatWords(p)'),html.indexOf('.filter(([t,k])=>!(REDUCED'));
  const before=w.slice(0,w.indexOf('"wImpact"'));
  assert.ok(!/\bT\b(?!\.length)/.test(before.replace(/const N=NAME\[p\.who\], T=p\.target\.name/,'')),'no beat before the impact uses the target name'); }
ok('P7','until the hit no line, board look, barrel, hand or camera names or points out the target');

// P9 (r90 LOOK L08/L09): the rest shot opens close on the revolver with the words in the bottom strip, and the gold button shows only
// when there is a tap (one status line during the turn, no dead button repeating it).
has(/\.mid \{ position: absolute; left: 50%; bottom: calc\(env\(safe-area-inset-bottom, 0px\) \+ 110px\);/,'the status line and button in the bottom strip on a laptop');
lacks(/\.mid \{[^}]*top: 612px/,'the old status line in the middle of the screen, over the gun');
has(/\.cta:disabled \{ visibility: hidden; opacity: 0; \}/,'a button that cannot be tapped is not shown');
has(/function setBusy\(b\)\{ document\.body\.classList\.toggle\("turning",b\); if\(b\)\{ cta\.disabled=true; return; \}/,'the button is hidden for the whole turn');
{ const w=html.slice(html.indexOf('function beatWords(p)'),html.indexOf('.filter(([t,k])=>!(REDUCED'));
  assert.ok(!/\bcta:/.test(w),'no beat writes the button: the status line is said once'); }
lacks(/cta\.textContent=NAME\[who\]\+"'s turn…"/,'the button repeating the status line');
has(/fovIdle=PH\?54:60;/,'the rest shot has its own wide lens close in');
has(/d=Math\.min\(2\.3,Math\.max\(\.35,\(PH\?\.42:\.44\)\/hh\)\)/,'its distance comes from the lens and the window shape, so the gun keeps its share of the width');
has(/fov=lerp\(fovIdle,fovRest,k\); \}/,'the turn eases from the rest lens to its own lens on the crane up');
has(/spin\.rotation\.y=-2;/,'the revolver waits turned so barrel, drum and grip read');
ok('P9','the rest shot opens close on the revolver, words only in the bottom strip, the gold button only when there is a tap');
// P10 (r90 MOTION hunt M8/M9/M13/M15/M30)
{
  const step=fs.readFileSync(path.join(ROOT,'js/rosterRouletteStep.js'),'utf8');
  const pm=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-assets/v10_1/roulette/platemap.json'),'utf8'));
  const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
  // M8: every face is local, preloaded, and precached for offline
  assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/,'M8 no Google Fonts');
  for(const f of ['big-shoulders-display-latin-800-normal','big-shoulders-display-latin-900-normal','rye-latin-400-normal']){
    assert.ok(fs.existsSync(path.join(ROOT,`visual-assets/v10_1/shared/fonts/${f}.woff2`)),`M8 ${f} ships`);
    assert.ok(sw.split(`"visual-assets/v10_1/shared/fonts/${f}.woff2"`).length-1>=4,`M8 ${f} is in the shell, the offline pack, the unversioned list and the added list`);
  }
  // M13: Opus cues with a .wav fallback, loaded in parallel, room tone as soon as it lands
  for(const [name,src] of Object.entries(pm.sfx)){ assert.match(src,/^assets\/sfx\/[a-z_]+\.ogg$/,`M13 ${name} is Opus`); for(const ext of ['ogg','wav']) assert.ok(fs.existsSync(path.join(ROOT,'visual-assets/v10_1/roulette',src.replace(/\.ogg$/,'.'+ext))),`M13 ${name}.${ext} ships`); }
  const sfxBytes=Object.values(pm.sfx).reduce((n,src)=>n+fs.statSync(path.join(ROOT,'visual-assets/v10_1/roulette',src)).size,0);
  assert.ok(sfxBytes<400*1024,`M13 the cues weigh ${Math.round(sfxBytes/1024)} KB (limit 400 KB; the WAVs were 1.85 MB)`);
  has(/await Promise\.all\(Object\.entries\(map\)\.map\(async\(\[name,src\]\)=>/,'M13 every cue loads at once');
  has(/decode\(src\.replace\(\/\\\.ogg\$\/,"\.wav"\)\)/,'M13 an .ogg that does not decode falls back to its .wav');
  has(/if\(name==="roomTone"&&on\) roomTone\(true\);/,'M13 the room tone starts the moment it lands');
  assert.match(sw,/\|svg\|wav\|ogg\|glb\)\$\/i;/,'M13 the worker runtime-caches .ogg like the images');
  // M9: shaders in batches with progress, and the step renews its wait on progress
  has(/if\(!renderer\.extensions\.has\("KHR_parallel_shader_compile"\)\)\{/,'M9 batches only where the GPU cannot compile in the background');
  has(/for\(const b of batches\)\{ b\.forEach\(o=>renderer\.compile\(o,camera,scene\)\); toGame2\("cms-rr-loading"/,'M9 each batch compiles only its own objects (lights and environment from the whole scene) and reports progress');
  assert.doesNotMatch(html,/o\.visible=keep\.has\(o\)/,'M9 no visibility switching: compile() walks hidden objects too');
  assert.match(step,/if\(event\.data\.type==="cms-rr-loading"\)renew\(\);/,'M9 progress renews the start wait');
  // r90 Light (Nik 2026-11-08: "3D light for Chamber Men and RRR is a guarantee"): no 15 s / 20 s give-ups; 45 s of silence, a
  // 4-minute cap, one fresh rebuild before any card, and only a missing WebGL is remembered for the visit
  assert.match(step,/MAX_LOADING_MS=45000,COLD_LOADING_MS=240000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=45000,SCENE_TRIES=2;/,'Light: the start waits are long and a stuck page is built again once');
  assert.match(step,/for\(let attempt=1;attempt<=SCENE_TRIES;attempt\+\+\)\{\n\s*run=await rrsSceneTry\(ctx,plan\);\n\s*if\(!run\.failed\)break;\n\s*if\(run\.failed==="nowebgl"\)\{sceneFailedHere\.add\(rrsKey\(ctx\)\);return "skipped";\}/,'Light: a broken or slow page gets a fresh frame; only no-WebGL skips at once');
  assert.match(step,/const why=event\.data\.webgl===false\?"nowebgl":"error";/,'Light: the page says when WebGL itself is missing');
  assert.match(html,/message:"WebGL is not available",webgl:false\}/,'Light: the no-WebGL report is the only one marked webgl:false');
  assert.match(step,/function renew\(\)\{if\(armedWait\)\{armedWait\.renew\(\);return;\}/,'Light: progress pings keep the armed wait open too');
  assert.equal((step.match(/sceneFailedHere/g)||[]).length,4,'M9 the broken-page skip lives only in memory for this visit (never stored)');
  assert.match(step,/if\(!graced&&Date\.now\(\)-due>1000\)\{graced=true;arm\(2000\);return;\}/,'M9 a late timer (held main thread) looks again before failing');
  // M15: drum, crane and hammer baked; faded flash sprites not drawn
  has(/bake\(cyl,o=>o===cyl\.userData\.round\|\|o\.renderOrder>=2\); bake\(crane,o=>o===cyl\|\|o===cyl\.userData\.pointer\); bake\(hammer\);/,'M15 the moving gun parts are baked per piece');
  has(/applyFx\(\); fxIdle\.forEach\(fxVis\);/,'M15 faded flash sprites are skipped');
  // M30 + r90 Light: a lost context is rebuilt in place; only one that never comes back (20 s on screen) hands the game back
  has(/addEventListener\("webglcontextlost",e=>\{ e\.preventDefault\(\); if\(leaving\) return; cancelAnimationFrame\(rafId\); rafId=0; lostOn=true; lostLeft=20000; lostMark=0; lostClock\(\); \},false\);/,'Light: a lost context waits for the browser to give it back');
  has(/addEventListener\("webglcontextrestored",\(\)=>\{ clearTimeout\(lostTimer\); lostTimer=0; lostOn=false; if\(leaving\|\|lostSent\) return;\n\s*try\{ buildEnv\(\); \}catch\(e\)\{\} renderer\.shadowMap\.needsUpdate=true; if\(window\.__rrReady&&!rafId\) rafId=requestAnimationFrame\(frame\); \},false\);/,'Light: on restore the reflections and the shadow map are made again and the turn clock skips the gap (no last=now())');
  has(/if\(document\.visibilityState==="hidden"\)\{ if\(lostMark\)\{ lostLeft-=Date\.now\(\)-lostMark; lostMark=0; \} return; \}/,'Light: the 20 s give-up counts only on-screen time');
  has(/lostSent=true; if\(EMBED\) toGame\("cms-rr-error",\{message:"webgl context lost"\}\)/,'Light: only a context that never comes back hands the game back');
  has(/pm\.dispose\(\); if\(LOOK\.hdri\) LOOK\.hdri\.dispose\(\);   \/\*/,'Light: the EXR stays in memory so the reflections can be made again');
  has(/leaving=true; renderer\.dispose\(\); try\{ renderer\.forceContextLoss\(\); \}/,'M30 our own release on the way out is not a loss');
}
ok('P10','MOTION: local fonts, Opus cues in parallel with a WAV fallback, batched shader build with progress, baked gun parts; Light: no give-up timers, one rebuild, lost context rebuilt in place');
// P12 (r90 LOOK L10/L28): the squad board is the club's own (no dead menu tabs, the crest beside the name, the bench count line gone,
// the kits redrawn when they land late), and from High up the side walls with their lamps give the room depth
{
  assert.doesNotMatch(html,/"FORMATIONS"|"INSTRUCTIONS"|"TACTICS"|BENCH · /,'L10 no fake FIFA menu tabs and no bench count line on the board');
  has(/const crest=crestNow\(club\.club\)/,'L10 the board header draws the club crest');
  has(/Promise\.all\(\[KITS\.prepare\(\[d\.club,n\.club\]\),crestLoad\(d\.club\),crestLoad\(n\.club\)\]\)/,'L10 the boards are drawn again once kits and crests are ready');
  has(/const SHIRTS=new Map\(\);/,'L10 MOTION a board shirt is painted once per club, role, size, scale and shadow, then stamped');
  has(/SHIRTS\.clear\(\); drawBoard\("D",d\); drawBoard\("N",n\);/,'L10 MOTION the stamps are painted again once kits and crests are in');
  has(/if\(!KITS\) loads\.then\(done=>\{[^\n]*turn===0&&!playing\) setBoards\(d\.club,n\.club\);/,'L10 kits that land after the 6 s wait still reach the boards before the first turn');
  const hq=html.slice(html.indexOf('if(HIGH_UP){ const lampTex'),html.indexOf('if(EXTRA_UP){ const top=mat('));
  assert.match(hq,/const sides=new T\.Group\(\);[\s\S]*bake\(sides\); \}$/m,'L28 the side walls and their lamps are built from High up, baked');
  assert.doesNotMatch(html.slice(html.indexOf('if(EXTRA_UP){ const top=mat(')),/marblePanelTex\(\); sideT/,'L28 the café no longer builds its own side walls');
}
ok('P12','L10 board: crest header, no dead tabs, late kits redrawn; L28 side walls with lamps from High up');

// P13 (r90 LOOK L29): the gun lying on the felt mirrored the room's dark ceiling (black slab, black bar, chrome tube); it now reflects a
// small studio of its own, built once at the room's PMREM size so its shaders stay the same programs, and the drum carries seven flutes
{
  has(/function gunStudio\(pm\)\{[\s\S]{0,900}?pm\.fromScene\(s,\.04,\.1,20,\{size:128\}\)\.texture;/,'L29 the gun studio is one PMREM at the room size (512 px EXR / 4 = 128)');
  has(/\{ const st=gunStudio\(pm\); Object\.entries\(GUN_STEEL\)\.forEach\(\(\[k,v\]\)=>\{ GM\[k\]\.envMap=st;/,'L29 only the gun steel takes the studio');
  has(/o\.geometry\.dispose\(\); o\.material\.dispose\(\);/,'L29 the studio scene is freed after the bake');
  has(/const FW=\.24, FD=\.0026, flute=\[\]; for\(let i=0;i<224;i\+\+\)/,'L29 the drum outline is cut with flutes between the chambers');
  has(/const s=new T\.Shape\(flute\.map\(V2\)\);/,'L29 the drum is extruded from the fluted outline');
}
ok('P13','L29 revolver steel reflects its own studio; fluted drum');

// P14 (r90 MOTION M31): the demo loop has its own switch, so a measured run is the game's path; the Device check (?bench=1) still plays it
{
  has(/const SHOWCASE=qs\.get\("showcase"\)==="1"\|\|qs\.get\("bench"\)==="1";/,'M31 ?showcase=1 plays the loop without the gfxTier bench; ?bench=1 still does both');
  has(/if\(SHOWCASE&&!EMBED\)\{ let n=0;/,'M31 the loop never runs inside the game');
  assert.doesNotMatch(html,/qs\.get\("bench"\)==="1"&&!EMBED/,'M31 the loop no longer keys on bench alone');
}
ok('P14','M31 showcase loop on its own switch');
// P16 (r90 Light, Nik 2026-11-08: Light is built for his Chromebook): one key light and the hemisphere plus the shot flash, the lamp's
// light painted into the felt, no EXR at Light, particles batched, look-alike materials shared (≤40 draws, ≤12 programs measured)
{
  has(/LIGHT=GFX\.level===0;/,'Light flag from the shared quality system');
  has(/const lantern=LIGHT\?null:new T\.PointLight\(/,'Light: no lamp light; its pool is baked');
  has(/if\(LIGHT\)\{ const tex=M\.felt\.map, c=tex\.image, x=c\.getContext\("2d"\)/,'Light: the lamp pool is painted into the felt');
  has(/function loadLookEnv\(\)\{ if\(!T\.EXRLoader\|\|LIGHT\) return Promise\.resolve\(null\);/,'Light: no EXR');
  has(/scene\.environment=LIGHT\?loungeEnv\(pm\):pm\.fromEquirectangular\(LOOK\.hdri\)\.texture;/,'Light: a small lounge env of its own');
  has(/function fxBatch\(n,map,blending,order,fleck\)\{/,'Light: particles batched into one draw per kind');
  has(/const smokeFx=LIGHT\?fxBatch\(36,smokeT,T\.NormalBlending,25,false\):null;/,'Light: smoke batched');
  has(/const sparkFx=LIGHT\?fxBatch\(40,sparkMat\.map,T\.AdditiveBlending,28,false\):null;/,'Light: sparks batched');
  has(/const fleckFx=LIGHT\?fxBatch\(40,sparkTex\(\),T\.NormalBlending,26,true\):null;/,'Light: flecks batched');
  has(/camera\.updateMatrixWorld\(\); fxSync\(\); renderer\.render\(scene,camera\);/,'batches follow the camera every drawn frame');
  has(/if\(LIGHT\) mergeRounds\(\); \};/,'Light: every live round in one set of meshes');
  has(/if\(LIGHT\)\{ g\.remove\(easel\); inner\.add\(easel\); bake\(inner,o=>o===face\); \}/,'Light: the easel bakes with its board');
  has(/M\.glass\.forceSinglePass=true;/,'Light: lamp glass in one pass');
  has(/hand\.visible=handK>0;/,'the hidden hand is not drawn');
  has(/const twoSided=m=>LIGHT&&!m\.transparent&&\(m\.userData\.twoSided\|\|m\.side===T\.DoubleSide\);/,'Light: two-sided parts baked with both windings');
}
ok('P16','Light: one key light + hemisphere + shot flash, lamp light baked into the felt, no EXR, particles batched, shared look-alike materials');
// P17 (r90 LOOK L38/L39): before ready the page shows one calm status line, never the bare title over black; the pot stands back left
// and smaller, off both shooting lines; the dust is fewer, softer motes that live only in the lamp's light
{
  assert.match(html,/body:not\(\.ready\) \.top, body:not\(\.ready\) \.mid \{ opacity: 0; visibility: hidden; \}/,'L38 the title and the result line wait for the first frame');
  has(/<div class="boot" id="boot" role="status">Setting the table…<\/div>/,'L38 one status line while the table is set');
  has(/requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>document\.body\.classList\.add\("ready"\)\)\);/,'L38 the page shows itself after the first drawn frame');
  has(/pg\.position\.set\(-\.46,\.75,-\.5\); pg\.rotation\.y=\.6; pg\.scale\.setScalar\(\.62\);/,'L39 the pot back left, smaller');
  has(/const dust=\(\(\)=>\{ const n=160,/,'L39 fewer motes');
  has(/vertexColors:true/,'L39 motes fade away from the lamp');
}
ok('P17','L38 a status line before ready; L39 the pot back left and smaller, softer lamp-lit dust');

// P15 (r90 LOOK L37): at rest the picture is lens-shifted down just enough for each board face to clear the title (measured from the real
// title box); the shift eases out during a turn
{
  has(/function fitUnderTitle\(\)\{ restShift=0; const t=document\.querySelector\("\.title"\), r=t&&t\.getBoundingClientRect\(\);/,'L37 the clearance comes from the real title box');
  has(/need=Math\.max\(need,r\.bottom\+10-Math\.min\(q\[0\]\.y,q\[1\]\.y\)\); \}\);/,'L37 every board face that sits under the title clears it by 10 px');
  has(/const want=playing\?0:restShift;/,'L37 the shift is only for the rest shot');
  has(/camera\.setViewOffset\(innerWidth,innerHeight,0,-viewShift,innerWidth,innerHeight\)/,'L37 a lens shift: nothing in the scene moves');
  has(/camera\.updateProjectionMatrix\(\); \} applyViewShift\(dt\);/,'L37 applied every frame with the lens');
}
ok('P15','L37 the boards clear the title on a phone');

(async()=>{
  if(process.env.CMS_RRR_SCENE_SKIP_BROWSER==='1'){finished=true;console.log(`PASS r89 RRR scene polish contracts: ${checks} checks (browser part skipped).`);return;}
  // P6 the real scene.
  const {chromium}=require('playwright');
  const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');
  const freePort=()=>new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});
  const waitForServer=async port=>{for(let i=0;i<100;i+=1){const up=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(up)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');};
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{cwd:ROOT,stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    const args=runtime.args.filter(a=>a!=='--single-process'&&!/^--(disable-webgl|disable-gpu|use-gl|use-angle)/.test(a)).concat(['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-compositing','--disable-gpu-rasterization']);
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args});
    const base=`http://127.0.0.1:${port}/`;
    const context=await browser.newContext({viewport:{width:640,height:400},serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});   /* the Google title fonts are blocked here on purpose; the page falls back to local faces */
    await page.route(url=>!String(url).startsWith(base),route=>route.abort());
    await page.goto(`${base}visual-assets/v10_1/roulette/index.html?embed=1&seed=7&bloom=0`,{waitUntil:'commit'});
    await page.waitForFunction(()=>window.__rrReady,null,{timeout:180000});
    const out=await page.evaluate(()=>{
      const B={close:3.3,inside:11.4,fire:15.0,impact:17.4,end:22.0};
      __rr.clock();__rr.advance(1,false);
      const rest=__rr.state.cylZ;
      __rr.play({fire:true});
      const s0=__rr.state;const chamber=s0.chamber;
      const rows=[];
      for(let i=0;i<Math.round(B.end*30)+2;i+=1){__rr.advance(1/30,false);const st=__rr.state;rows.push({tt:(i+1)/30,cam:st.cam,fov:st.fov,cylZ:st.cylZ,playing:st.playing});if(!st.playing)break;}
      return {B,rest,chamber,rows,ended:!__rr.state.playing};
    }).catch(e=>{throw new Error(`${e.message} :: ${errors.slice(0,6).join(' | ')}`);});
    await context.close();
    // P8 (Codex P2 on #1261) Back/Forward cache: a turn paused in the cache for 30 s resumes where it stopped on the way back.
    // The page clock is skewed by 30 s while it sits in the cache (no frames run there); the turn must not count that time.
    const bfc=await browser.newContext({viewport:{width:640,height:400},serviceWorkers:'block'});
    const bp=await bfc.newPage();bp.on('pageerror',e=>errors.push(String(e)));
    await bp.route(url=>!String(url).startsWith(base),route=>route.abort());
    await bp.addInitScript(()=>{window.__skew=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+window.__skew;});
    await bp.goto(`${base}visual-assets/v10_1/roulette/index.html?seed=7`,{waitUntil:'commit'});
    // P11 (r90 LOOK L27): before the scene is ready there is no spin button to press (a press then found no board and blanked the scene)
    await bp.waitForSelector('#cta',{state:'attached',timeout:60000});
    const early=await bp.evaluate(()=>({ready:Boolean(window.__rrReady),disabled:document.getElementById('cta').disabled}));
    if(!early.ready) assert.equal(early.disabled,true,'L27 the spin button is off until the scene is ready');
    await bp.waitForFunction(()=>window.__rrReady,null,{timeout:180000});
    assert.equal(await bp.evaluate(()=>document.getElementById('cta').disabled),false,'L27 and on once it is ready');
    await bp.evaluate(()=>__rr.play({fire:true}));await bp.waitForTimeout(1500);
    const tt0=await bp.evaluate(()=>{const tt=__rr.state.tt;dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.__skew+=30000;return tt;});
    await bp.waitForTimeout(300);
    // Two animation frames after pageshow: the page's own frame (queued first) has run its tick on the way back.
    await bp.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    const back=await bp.evaluate(()=>({tt:__rr.state.tt,playing:__rr.state.playing}));
    // P11 (r90 LOOK L27): spin after spin, shots and clicks, on the scene's own clock: every turn starts, reaches its end and leaves no error
    const errs0=errors.length;
    const spins=await bp.evaluate(()=>{ __rr.clock(); __rr.advance(30,false); const out=[]; for(let k=0;k<6;k++){ const started=Boolean(__rr.play({fire:k%3!==1})); __rr.advance(30,false); out.push({started,ended:!__rr.state.playing}); } __rr.advance(.1,true); return out; });
    assert.equal(errors.length,errs0,`L27 no page error over six spins (${errors.slice(errs0).join(' | ')})`);
    assert.ok(spins.every(x=>x.started&&x.ended),`L27 every spin starts and ends (${JSON.stringify(spins)})`);
    await bfc.close();
    assert.ok(back.playing&&back.tt-tt0<5,`after 30 s in the back-forward cache the turn resumes where it stopped (turn time ${tt0.toFixed(2)} s -> ${back.tt==null?'ended':back.tt.toFixed(2)+' s'})`);
    ok('P11','L27: no spin button before the scene is ready; six spins in a row start, end and throw nothing');
    ok('P8',`back-forward cache: 30 s away, turn time ${tt0.toFixed(2)} s -> ${back.tt.toFixed(2)} s, still playing`);
    const {B,rows}=out;
    assert.ok(out.ended,'the turn ended');
    const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    const steps=rows.slice(1).map((r,i)=>({tt:r.tt,d:dist(r.cam,rows[i].cam)}));
    const worst=steps.reduce((m,s)=>s.d>m.d?s:m,{d:0}),worstLate=steps.filter(s=>s.tt>=3).reduce((m,s)=>s.d>m.d?s:m,{d:0});
    assert.ok(worst.d<.16,`no cut: the largest camera step in a tick is ${worst.d.toFixed(3)} m at ${worst.tt.toFixed(2)} s (the 1 s crane up to the top shot; limit .16)`);
    assert.ok(worstLate.d<.09,`no cut after the top shot: the largest step is ${worstLate.d.toFixed(3)} m at ${worstLate.tt.toFixed(2)} s (limit .09)`);
    // From the crane shut to the shot: one speed peak, then only falling (a little smoothing noise allowed), still moving at the shot.
    const win=steps.filter(s=>s.tt>=B.inside+.25&&s.tt<=B.fire-.05);
    const sm=win.map((s,i)=>{const a=win.slice(Math.max(0,i-2),i+3);return a.reduce((x,y)=>x+y.d,0)/a.length;});
    const peak=sm.indexOf(Math.max(...sm));
    assert.ok(win[peak].tt<B.inside+1.6,`the glide is fastest early (peak at ${win[peak].tt.toFixed(2)} s)`);
    let rises=0;for(let i=peak+1;i<sm.length;i+=1)if(sm[i]>sm[i-1]*1.05+1e-5)rises+=1;
    assert.equal(rises,0,'after its peak the camera speed never rises again before the shot');
    const atShot=sm[sm.length-1];
    assert.ok(atShot>0&&atShot<sm[peak]*.12,`still creeping at the shot (${(1000*atShot).toFixed(2)} mm/tick vs peak ${(1000*sm[peak]).toFixed(1)} mm/tick)`);
    // The drum stops on the planned chamber and started from where it rested.
    const TAU=Math.PI*2,same=(a,b)=>{const d=(((a-b)%TAU)+TAU)%TAU;return d<1e-3||TAU-d<1e-3;};
    assert.ok(same(rows[Math.round(.5*30)-1].cylZ,out.rest),'the drum starts from where it rested');
    const endRow=rows.find(r=>r.tt>=B.inside);
    assert.ok(same(endRow.cylZ,-out.chamber*TAU/7),`the drum stopped on chamber ${out.chamber}`);
    assert.equal(errors.length,0,`no page errors (${errors.join(' | ')})`);
    ok('P6',`real scene: largest tick step ${worst.d.toFixed(3)} m, glide peak at ${win[peak].tt.toFixed(2)} s then only slower, creeping ${(1000*atShot).toFixed(2)} mm/tick at the shot, drum on chamber ${out.chamber}`);
    finished=true;
    console.log(`PASS r89 RRR scene polish contracts: ${checks} checks.`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
