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
//   P9 (r90 LOOK L08/L09) close rest shot on the revolver, words in the bottom strip, the gold button only when there is a tap;
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
has(/renderer\.setSize\(w,h,false\); renderer\.shadowMap\.needsUpdate=true; if\(GOV\) GOV\.resize\(\); \}/,'the one static shadow map is drawn when the room is laid out');
lacks(/shadowCool/,'the per-turn shadow redraw');
has(/gun\.traverse\(o=>\{ if\(o\.isMesh\)\{ o\.castShadow=false;/,'the moving revolver casts no map shadow (its contact shadow is a picture)');
lacks(/EffectComposer|UnrealBloomPass|OutputPass|makePost|INV_ACES/,'the bloom post chain and its tone-mapping workaround');
// r90 high quality: the second lobes (lacquer, glaze, velvet) exist only from High up; Light and Medium keep one-lobe materials and plain three.js meshes.
assert.equal((html.match(/MeshPhysicalMaterial/g)||[]).length,1,'one place makes a two-lobe material');
has(/const HQ=GFX\.level>=2;\nfunction mat\(p,hq\)\{ return HQ&&hq\?new T\.MeshPhysicalMaterial\(/,'and only from High up');
has(/return lv>=3\?2:lv>=2\?1\.5:1;/,'round parts get more segments only from High up');
has(/const T=SEGK===1\?THREE:/,'Light and Medium build with plain three.js');
lacks(/new T\.MeshStandardMaterial\(\{[^}]*(clearcoat|sheen)/,'no clearcoat or sheen on a standard material');
// r90 (Nik 2026-11-08): the café room picture is back from High up only; Light and Balanced never download it and keep the dark room.
has(/\(GFX\.assetLevel\?\?GFX\.level\)>=2\?loadImg\("assets\/RR_ROOM\.webp"\):null/,'the room picture loads only from High up (and only on a download level that allows it)');
has(/fog:false, depthWrite:false\}\)\);/,'it sits behind the fogged 3D floor as one unlit plane');
lacks(/RR_ROOM\.jpg/,'the old 523 KB jpg');
assert.equal((html.match(/new T\.PointLight\(/g)||[]).length,2,'two point lights: the lantern and the one effects light');
lacks(/RR_ROOM\.jpg|backWall|wallLamp|chandelier|cafeTable|function dado/,'the marble hall');
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
has(/function bake\(root,skip\)/,'static props are baked into one mesh per material');
has(/bake\(table\);/,'the table and everything on it');
has(/bake\(gun,o=>o===crane\|\|o===hammer\);/,'the revolver frame (the crane, drum and hammer still move)');
has(/function boardFrames\(key,pick,fire\)/,'the board\'s hit look is pre-rendered');
has(/frames=ready&&fire&&ready\.i===b\.bubbles\.indexOf\(pick\)\?ready:boardFrames\(who,pick,fire\); delete prepared\[turn\]; if\(frames\) pick=b\.bubbles\[frames\.i\];/,'pre-rendered before the spin starts (in the game already at setup)');
has(/function prepareHits\(\)\{ if\(!GAME\|\|turn>0\) return;/,'the game\'s planned shots are drawn while the screen is read');
has(/try\{ renderer\.initTexture\(c\.__tex\); \}catch\(e\)\{\} return \{i,plain,hit:c\}; \}/,'and sent to the GPU then, on its own texture');
has(/if\(p\.frames&&p\.frames\.hit&&p\.frames\.i===i\) showFrame\(p\.who,p\.frames\.hit,b\.userData\.hit\); else drawBoard/,'the hole and stamp are a texture swap');
has(/addEventListener\("pagehide",e=>\{ if\(e\.persisted\)\{ cancelAnimationFrame\(rafId\); rafId=0; return; \} disposeAll\(\); \}\);/,'leaving the page frees the GPU at once; a page kept in the back-forward cache only pauses');
has(/addEventListener\("pageshow",e=>\{ if\(e\.persisted&&window\.__rrReady&&!rafId\) rafId=requestAnimationFrame\(frame\); \}\);/,'and a page restored from that cache picks up its frame loop again');
has(/if\(manual===null&&playing&&last>0&&t-last>\.25\) playing\.t0\+=t-last-\.016;/,'with the turn clock moved past the pause, so the turn resumes where it stopped');
ok('P5','lean frame: static shadow, no bloom chain, standard materials, two point lights, no hall, shared quality governor held during turns, warm-up before ready, baked props, pre-uploaded hit frame, dispose on exit');

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
    await bp.waitForFunction(()=>window.__rrReady,null,{timeout:180000});
    await bp.evaluate(()=>__rr.play({fire:true}));await bp.waitForTimeout(1500);
    const tt0=await bp.evaluate(()=>{const tt=__rr.state.tt;dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.__skew+=30000;return tt;});
    await bp.waitForTimeout(300);
    // Two animation frames after pageshow: the page's own frame (queued first) has run its tick on the way back.
    await bp.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    const back=await bp.evaluate(()=>({tt:__rr.state.tt,playing:__rr.state.playing}));
    await bfc.close();
    assert.ok(back.playing&&back.tt-tt0<5,`after 30 s in the back-forward cache the turn resumes where it stopped (turn time ${tt0.toFixed(2)} s -> ${back.tt==null?'ended':back.tt.toFixed(2)+' s'})`);
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
