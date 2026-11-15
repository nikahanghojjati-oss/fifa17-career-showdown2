#!/usr/bin/env node
'use strict';
// r93 R93-04 (Nik 2026-11-15): the Roster Russian Roulette hand reads as a real hand in a filmed shot, the same on every screen, and the table gets a
// whisky tumbler and a decanter that look real on every level without making Light or Balanced heavier. Study: gameplay/r93/threads/R93_04_RRR_STUDY.md
// (S1-S9, Part 4). Checks:
//   H1 one placement rule: the barrel's angle comes from the window shape (22° landscape, 72° portrait), closed form through the board's centre, the
//      muzzle kept off the board, the card sized so the sleeve's cut stays outside the frame; no clamp, no per-device constants
//   H2 the take: the revolver leaves the felt toward the shooter and is hidden only once it is out of the frame; the hand shows only after that
//   H3 the motion: raise about the elbow with the wrist trailing, the cock dip, the breathing sway, the recoil turns the muzzle UP, the hand is left in
//      the room when the bullet camera leaves; Reduce Motion drops the dip and the sway
//   H4 the hand takes the room's light (a colour uniform) and the plate is decoded at 1024 px on Light and Balanced; every plate number is data
//   W1 the whisky set: one painted mesh (the hand card's program) on every level, a crystal shell from High; shown from WHISKY_FROM (0 = Light)
//   B1 the real scene at 1920x866 and 390x844 on Light: barrel within 1° of its angle and within 4 px of the board's centre, muzzle off the board, the
//      sleeve's cut outside the frame from the raise to the exit (overshoot and recoil too), never the hand and the felt's revolver on screen together, recoil up; Light stays at 11 programs and one draw over 2.5.0 at rest (35 on the Chromebook, 36 on a phone)
const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(ROOT,'visual-assets/v10_1/roulette/index.html'),'utf8');
const plate=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-assets/v10_1/roulette/platemap.json'),'utf8'));
let checks=0;
const ok=(id,msg)=>{checks+=1;console.log(`ok ${id} ${msg}`);};
const has=(re,msg)=>assert.match(html,re,msg);
const lacks=(re,msg)=>assert.doesNotMatch(html,re,msg);

has(/const handShape=\(a\)=>\{ const k=clamp01\(\(a-\.8\)\/\.7\); return k\*k\*\(3-2\*k\); \};/,'the window shape alone picks the angle');
has(/th=\(72\+\(22-72\)\*sk\)\*DEG/,'22° on landscape, 72° on portrait');
has(/rot=Math\.atan2\(dy,dx\)-base/,'the turn is closed form through the aim point');
has(/D=Math\.max\(D,Math\.min\(tx,ty\)\)/,'the muzzle is moved off the board');
has(/ph=Math\.max\(ph,Math\.min\(a,b\)\)/,'each cut corner leaves by the nearer edge');
lacks(/AIM_MAX|AIM_SCALE|function handAim\(/,'the old clamped solver and its per-device constants');
lacks(/PH\?\.56:\.68/,'the phone and desktop card sizes');
ok('H1','one placement rule for every window');

has(/function takeGun\(p,tt\)\{/,'the take');
has(/takeOff\.set\(to\.x\*\.45\*e,\.05\*lift,to\.z\*\.45\*e\)/,'pulled 0.45 m toward the shooter, lifted 5 cm');
has(/if\(\(out&&tt>=B\.hand\+\(REDUCED\?\.15:\.30\)\)\|\|tt>=B\.hand\+\(REDUCED\?\.35:\.65\)\)\{ p\.gunGone=true;/,'hidden once out of the frame, with a cap');
has(/function untake\(\)\{/,'the take is laid on after the camera and taken off before the next frame, so the camera path never sees it');
has(/function stepTurn\(dt\)\{ untake\(\);/,'taken off first');
has(/camera\.lookAt\(camLook\); takeGun\(p,tt\); placeHand\(\);/,'laid on after the camera');
has(/function gunInHand\(\)\{ const gone=!!\(handHold&&playing&&playing\.gunGone\); gun\.visible=!gone; gunShadow\.visible=!gone; \}/,'the felt revolver hides only once it is gone');
has(/HP\.on=handHold&&!!p\.gunGone;/,'the hand shows only after that');
has(/if\(!handHold\)\{ p\.slideV\.copy\(flat\)/,'the hidden revolver no longer slides on the felt after the shot');
ok('H2','the take: the revolver leaves the felt toward the shooter, never two revolvers');

has(/R=RM\?ease\.out\(S\(r0,rd,tt\)\):backK\(S\(r0,rd,tt\),1\.2\)/,'the raise settles with a small overshoot');
has(/HP\.elbow=-38\*\(1-R\)\+3\*env/,'an arm swing about the elbow');
has(/lag=-\(RM\?4:9\)\*\(1-ease\.out\(S\(r0,rd\+\.15,tt\)\)\)/,'the wrist trails the arm');
has(/rec=11\*Math\.exp\(-7\.2\*u\)\*Math\.cos\(14\.3\*u\)/,'the recoil: a damped spring from +11°');
has(/turn\(W0,-handSide\*HP\.wrist\*DEG\)/,'elevation + is muzzle up for both hands');
lacks(/handSide\*rx\*\.16/,'the old recoil that turned the muzzle down');
has(/if\(p\.fire&&d>=\.12&&!HP\.detached&&HP\.on\)\{ camera\.updateMatrixWorld\(\); placeHand\(\); scene\.attach\(hand\); HP\.detached=true; \}/,'left in the room as the bullet camera leaves');
has(/function handHome\(\)\{ camera\.add\(hand\); hand\.quaternion\.identity\(\); HP\.detached=false; \}/,'and back on the camera, upright, at the end of the turn');
has(/let cock=0; if\(!RM\)\{/,'no cock dip under Reduce Motion');
has(/let sway=0, bob=0; if\(!RM\)\{/,'no sway under Reduce Motion');
has(/cue\(tt,B\.hand,"handUp","handUp"\); cue\(tt,B\.cock,"cock","cock"\); cue\(tt,B\.aim,"heart","heart"\);/,'beats and sounds unchanged');
ok('H3','the motion: raise, cock, sway, recoil up, exit');

has(/hand\.material\.color\.setRGB\(t\[0\]\*fk\*\(1\+1\.6\*F\),t\[1\]\*fk\*\(1\+1\.44\*F\),t\[2\]\*fk\*\(1\+1\.2\*F\)\)/,'the hand takes the lamp and the flash (a uniform)');
has(/lampFl=fl;/,'the lamp flicker is shared');
has(/const HAND_CAP=GFX\.level<=1\?1024:0;/,'the plate at 1024 px on its long side on Light and Balanced');
has(/const big=Math\.max\(im\.width,im\.height\); if\(maxW&&big>maxW\)\{/,'the cap is on the long side (the upright plate too)');
has(/const handPlateFor=\(\)=>handShape\(innerWidth\/innerHeight\)<\.5\?"P":"W";/,'the plate follows the window\'s shape, with the angle');
has(/loadHandPlate\(handPlateFor\(\)\)/,'only the plate this window needs is loaded at the start');
has(/addEventListener\("resize",\(\)=>handPlateWatch\(\)\);/,'and the other only when the window changes shape');
has(/const hp=PLATEMAP\.hand\|\|\{\}, img=hp\.file\?await loadImg\(hp\.file,HAND_CAP\):null;/,'the r87 plate is the fallback');
has(/uv\(HAND_MUZZLE,hp\.muzzle\); uv\(HAND_REAR,hp\.rear\); uv\(HAND_WRIST,hp\.wrist\); uv\(HAND_ELBOW,hp\.elbow\);/,'every plate number from platemap.json');
const plates=[['r87',plate.hand,13.3],['W',plate.hand.plates.W,22.5],['P',plate.hand.plates.P,72]];
for(const [name,pl,want] of plates){
  for(const k of ['muzzle','rear','wrist','elbow']) assert.ok(Array.isArray(pl[k])&&pl[k].length===2,`platemap ${name} ${k}`);
  assert.ok(Array.isArray(pl.cut)&&pl.cut.length>=2,`platemap ${name} cut`);
  assert.ok(fs.existsSync(path.join(ROOT,'visual-assets/v10_1/roulette',pl.file)),`${name}: ${pl.file} ships`);
  const [w,h]=pl.size||[1672,941], bore=Math.atan2(pl.muzzle[1]-pl.rear[1],(pl.rear[0]-pl.muzzle[0])*w/h)*180/Math.PI;
  assert.ok(Math.abs(bore-want)<.3,`${name} plate bore ${bore.toFixed(2)}° (want ${want}°)`); }
for(const k of ['W','P']){ const pl=plate.hand.plates[k]; assert.ok(pl.cut.every(c=>c[1]===0),`${k}: the sleeve leaves through the bottom edge`); assert.ok(Array.isArray(pl.fit)&&pl.fit[0]<pl.fit[1],`${k}: the card's height range`); }
ok('H4','the hand takes the room\'s light; the shooter\'s-eye plates W and P (HO-081) by window shape, the r87 plate as fallback; plate numbers are data');

has(/const WHISKY_FROM=0;/,'the whisky set shows on every level (Nik 2026-11-15)');
has(/const paint=new T\.MeshBasicMaterial\(\{map:tex, transparent:true, blending:5, blendEquation:100, blendSrc:201, blendDst:205, depthWrite:false, toneMapped:false\}\);/,'one painted material: whisky covers, glass adds');
has(/bg\.setAttribute\("normal",new T\.BufferAttribute\(N,3\)\)/,'with normals, so it shares the hand card\'s program');
has(/const crystal=new T\.MeshStandardMaterial\(\{color:0x000000, metalness:0, roughness:\.03, transparent:true, blending:T\.AdditiveBlending, depthWrite:false, envMapIntensity:5\}\);/,'the crystal shell from High: reflections only, front faces');
has(/if\(!hi\) add\(parts,vmap\(lathe\(o\.shell,SEG\)/,'painted glass highlights only below High');
has(/\{ const w=buildWhisky\(\); if\(w\)\{/,'built after the table is baked');
lacks(/new T\.PointLight\([^)]*\)[^;]*whisky/i,'no light of its own');
ok('W1','the whisky set: one painted draw on every level, the crystal from High, no light');

(async()=>{
  if(process.env.CMS_RRR_SCENE_SKIP_BROWSER==='1'){console.log(`PASS r93 RRR hand and props contracts: ${checks} checks (browser part skipped).`);return;}
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
    for(const [w,h] of [[1920,866],[390,844]]){
      const context=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.goto(`${base}visual-assets/v10_1/roulette/index.html?gfx=0&seed=7`,{waitUntil:'commit'});
      await page.waitForFunction(()=>window.__rrReady,null,{timeout:300000});
      const out=await page.evaluate(()=>{
        const deg=(a,b)=>Math.atan2(-(a[1]-b[1]),a[0]-b[0])*180/Math.PI;
        __rr.clock(); __rr.advance(1/30,true); const rest=__rr.state.calls;
        const turns=[];
        for(const fire of [true,false]){
          __rr.play({fire}); const t={fire,both:[],settled:null,recoil:null,shown:false,cutIn:[],mzOnBoard:false,detachedLeft:null};
          for(let i=0;i<800;i++){ __rr.advance(1/30,false); const st=__rr.state; if(!st.playing) break; const p=__rr.handPose, tt=st.tt;
            if(p.hand&&p.gun&&p.gunInFrame) t.both.push(+tt.toFixed(3));
            if(p.hand) t.shown=true;
            if(tt>=13.1&&p.hand&&!p.detached){ const inside=c=>c[0]>0&&c[0]<p.W&&c[1]>0&&c[1]<p.H; p.cut.forEach(c=>{ if(inside(c)) t.cutIn.push(+tt.toFixed(2)); }); const b=p.board, m=p.muzzle; if(m[0]>b[0]&&m[0]<b[2]&&m[1]>b[1]&&m[1]<b[3]) t.mzOnBoard=true; }
            if(!t.settled&&tt>=14.95){ const m=p.muzzle, r=p.rear, a=p.aim; const bx=m[0]-r[0], by=m[1]-r[1], bl=Math.hypot(bx,by); let e=deg(a,m)-deg(m,r); e=((e+540)%360)-180; const el=deg(m,r); t.settled={barrel:p.side<0?el:180-el, err:e, miss:Math.abs(((a[0]-m[0])*by-(a[1]-m[1])*bx)/bl), W:p.W, H:p.H}; }
            if(fire&&!t.recoil&&tt>=15.06){ const el=deg(p.muzzle,p.rear); t.recoil=(p.side<0?el:180-el)-t.settled.barrel; }
            if(fire&&tt>=15.55&&t.detachedLeft===null) t.detachedLeft=p.hand; }
          __rr.advance(1,false); turns.push(t); }
        __rr.advance(1/30,true);
        return {rest, programs:__rr.state.programs, plate:__rr.handPose.plate, turns}; });
      assert.deepEqual(errors,[],`no page errors at ${w}x${h}`);
      const want=w/h>=1.5?22:72;
      for(const t of out.turns){
        const tag=`${w}x${h} ${t.fire?'shot':'click'}`;
        assert.ok(t.shown,`${tag}: the hand shows`);
        assert.deepEqual(t.both,[],`${tag}: never the hand and the felt's revolver on screen together`);
        assert.ok(Math.abs(t.settled.barrel-want)<1,`${tag}: barrel ${t.settled.barrel.toFixed(2)}° (want ${want}°)`);
        assert.ok(t.settled.miss<=4,`${tag}: the barrel line passes ${t.settled.miss.toFixed(1)} px from the board's centre`);
        assert.equal(t.mzOnBoard,false,`${tag}: the muzzle stays off the board`);
        assert.deepEqual(t.cutIn,[],`${tag}: the sleeve's cut stays outside the frame`);
        if(t.fire){ assert.ok(t.recoil>3,`${tag}: the recoil turns the muzzle up (${t.recoil.toFixed(2)}°)`); assert.equal(t.detachedLeft,false,`${tag}: the hand is gone half a second after the shot`); } }
      assert.ok(out.programs<=11,`Light at ${w}x${h}: ${out.programs} shader programs (11 before the whisky set)`);
      const restMax=w>h?35:36;   /* 2.6.0 before the whisky set: 33 at 1920x866, 35 at 390x844; the set is one draw */
      assert.ok(out.rest<=restMax,`Light at ${w}x${h}: ${out.rest} draws at rest (≤ ${restMax})`);
      assert.equal(out.plate,w>h?'W':'P',`${w}x${h}: the ${w>h?'landscape':'upright'} plate`);
      ok('B1',`${w}x${h} Light, plate ${out.plate}: barrel ${out.turns.map(t=>t.settled.barrel.toFixed(1)).join('/')}°, miss ${out.turns.map(t=>t.settled.miss.toFixed(1)).join('/')} px, recoil +${out.turns[0].recoil.toFixed(1)}°, ${out.rest} draws, ${out.programs} programs`);
      await context.close(); }
    console.log(`PASS r93 RRR hand and props contracts: ${checks} checks.`);
  }finally{ if(browser) await browser.close().catch(()=>{}); server.kill(); }
})().catch(e=>{ console.error(e); process.exit(1); });
