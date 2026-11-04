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
//   P5 frame rate: the shadow map is drawn only while the gun moves, the board's later looks are pre-rendered before the spin and swapped in
//      (select, hit, deselect), and the resolution governor works in half-second windows from 2.5 s after load, both ways, with a see-saw lock;
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

// P5 frame rate.
has(/renderer\.shadowMap\.autoUpdate=false;/,'the shadow map is not redrawn every frame');
has(/renderer\.shadowMap\.needsUpdate=!!playing\|\|shadowCool>0; shadowCool=Math\.max\(0,shadowCool-dt\);/,'the shadow map is drawn while the gun moves and for a moment after');
has(/function boardFrames\(key,pick,fire\)/,'the board\'s later looks are pre-rendered');
has(/const frames=boardFrames\(who,pick,fire\); if\(frames\) pick=b\.bubbles\[frames\.i\];/,'pre-rendered before the spin starts');
has(/if\(p\.frames&&p\.frames\.i===i\) showFrame\(p\.who,p\.frames\.sel,i,bu\.hit\); else drawBoard/,'the marked player is a swap');
has(/if\(p\.frames&&p\.frames\.hit&&p\.frames\.i===i\) showFrame\(p\.who,p\.frames\.hit,i,b\.userData\.hit\); else drawBoard/,'the hole and stamp are a swap');
has(/if\(p\.frames\) showFrame\(p\.who,p\.frames\.plain,null,bu\.hit\); else drawBoard/,'the deselect is a swap');
has(/if\(pt-fpsT>500\)\{/,'half-second governor windows');
has(/if\(pt>2500&&!document\.hidden&&pt-fpsT<900\)\{ if\(fps<50&&prNow>PR_FLOOR\(\)\+\.01\)/,'the governor steps down from 2.5 s after load');
has(/else if\(!playing&&!govLock&&fps>=58&&pt-govAt>6000&&prNow<prCap-\.01\)/,'and steps back up only between turns, after 6 s, unless locked');
has(/if\(govUpAt>=0&&pt-govUpAt<3000\) govLock=true;/,'a step up undone within 3 s locks the governor');
ok('P5','shadow pass only while the gun moves; board looks pre-rendered and swapped; two-way governor with a see-saw lock');

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
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
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
    const {B,rows}=out;
    assert.ok(out.ended,'the turn ended');
    const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    const steps=rows.slice(1).map((r,i)=>({tt:r.tt,d:dist(r.cam,rows[i].cam)}));
    const worst=steps.reduce((m,s)=>s.d>m.d?s:m,{d:0});
    assert.ok(worst.d<.09,`no cut: the largest camera step in a tick is ${worst.d.toFixed(3)} m at ${worst.tt.toFixed(2)} s (limit .09)`);
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
