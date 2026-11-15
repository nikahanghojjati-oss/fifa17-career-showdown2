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
//   H5 upright windows (lead's review, Nik's rule "nothing covers anything"): the glove is kept clear of the status line and the bottom bar at every
//      beat: a search in the shooter's-eye frame for the largest card and the spot along the board's foot that fit, the hand slides in from its side,
//      a shot fades it where it is
//   B1 the real scene at 1920x866, 390x844 and 393x660 on Light: barrel within 1° of its angle and within 4 px of the board's centre, muzzle off the board, the
//      sleeve's cut outside the frame from the raise to the exit (overshoot and recoil too), never the hand and the felt's revolver on screen together, recoil up; Light stays at 11 programs and one draw over 2.5.0 at rest (35 on the Chromebook, 36 on a phone)
//   B2 the game's own view (?embed=1 in a full-window frame, set up by a parent message as js/rosterRouletteStep.js does) at 390x844 and 360x640, Light:
//      the upright placement is in use, the glove is never under the caption from the take to the exit and is at least 100 px wide at the aim, the
//      muzzle stays off the board; on a tall phone (390x844) the caption takes the hidden Spin button's room for the turn (R93-04, Nik 2026-11-15:
//      a bigger phone glove) and goes back after it; on a short phone (360x640) it stays where it was
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
has(/if\(p\.fire&&d>=\.12&&!HP\.detached&&HP\.on&&!clr\)\{ camera\.updateMatrixWorld\(\); placeHand\(\); scene\.attach\(hand\); HP\.detached=true; \}/,'left in the room as the bullet camera leaves');
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
has(/return \(sk<\.5&&handClear\(fw,fh,ax,ay\)\)\|\|L0; \}/,'upright windows use the clear placement when it fits');
has(/function handClearSearch\(key,base\)\{/,'searched once per turn and window');
has(/cam\.position\.copy\(p\.pov\); cam\.fov=p\.povFov; cam\.updateProjectionMatrix\(\); cam\.lookAt\(p\.povLook\);/,'in the frame the camera settles into');
has(/N\+" takes the revolver","Hammer cocked",N\+" takes aim at the board","Bang!",`Click\. \$\{N\} is safe\.`\]/,'against the widest status line shown while the hand is up');
has(/if\(L\.clear\) px\+=handSide\*L\.inX\*\(1-Math\.min\(1,HP\.R\)\);/,'the hand slides in from its own side');
has(/if\(p\.fire&&d>=\.12&&!HP\.detached&&HP\.on&&!clr\)/,'and a shot fades it where it is');
assert.ok(Array.isArray(plate.hand.plates.P.glove)&&plate.hand.plates.P.glove.length===4,'platemap P glove box');
ok('H5','upright windows: the glove clear of the status line and the bottom bar');

ok('W1','the whisky set: one painted draw on every level, the crystal from High, no light');

has(/@media \(max-width: 599px\) and \(orientation: portrait\) and \(min-height: 780px\) \{ body\.embed\.turning \.mid \{ bottom: calc\(env\(safe-area-inset-bottom, 0px\) \+ 42px\); \} body\.embed\.turning \.cta \{ position: absolute; visibility: hidden; opacity: 0; transition: none; \} \}/,'H6: on a tall upright phone in the game the caption takes the hidden Spin button\'s room for the turn');
has(/function handKeepOuts\(\)\{ const W=innerWidth, H=innerHeight, key=[^;]*document\.body\.className; if\(key===handKeepKey\) return handKeep; handKeepKey=key;/,'H6: the glove\'s keep-outs are measured again when the caption moves (body class in the key)');
ok('H6','on a tall upright phone in the game the caption drops into the Spin button\'s room for the turn, and the glove is placed against it there');

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
    for(const [w,h] of [[1920,866],[390,844],[393,660]]){
      const context=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.goto(`${base}visual-assets/v10_1/roulette/index.html?gfx=0&seed=7`,{waitUntil:'commit'});
      await page.waitForFunction(()=>window.__rrReady,null,{timeout:300000});
      const out=await page.evaluate(()=>{
        const deg=(a,b)=>Math.atan2(-(a[1]-b[1]),a[0]-b[0])*180/Math.PI;
        const keepNow=()=>{ const out=[], e=document.getElementById('result'), rg=document.createRange(); rg.selectNodeContents(e); const b=rg.getBoundingClientRect(); if(b.width>0) out.push(['the status line',b.left,b.top,b.right,b.bottom]);
          for(const sel of ['.phonebar','.bottom']){ const el=document.querySelector(sel); if(!el) continue; const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden') continue; const r=el.getBoundingClientRect(); if(r.width>0) out.push([sel,r.left,r.top,r.right,r.bottom]); } return out; };
        const glovePts=g=>{ const c=[g[0],g[3],g[12],g[15]], o=[]; for(let i=0;i<8;i++) for(let j=0;j<8;j++){ const a=i/7, b=j/7; o.push([0,1].map(k=>(1-a)*(1-b)*c[0][k]+(1-a)*b*c[1][k]+a*(1-b)*c[2][k]+a*b*c[3][k])); } return o; };
        __rr.clock(); __rr.advance(1/30,true); const rest=__rr.state.calls;
        const turns=[];
        for(const fire of [true,false]){
          __rr.play({fire}); const t={fire,both:[],settled:null,recoil:null,shown:false,cutIn:[],mzOnBoard:false,detachedLeft:null,covered:[],clear:null};
          for(let i=0;i<800;i++){ __rr.advance(1/30,false); const st=__rr.state; if(!st.playing) break; const p=__rr.handPose, tt=st.tt;
            if(p.hand&&p.gun&&p.gunInFrame) t.both.push(+tt.toFixed(3));
            if(p.hand) t.shown=true;
            if(innerWidth<innerHeight&&p.hand&&p.glove&&!p.detached){ const K=keepNow(); for(const q of glovePts(p.glove)) for(const r of K) if(q[0]>r[1]&&q[0]<r[3]&&q[1]>r[2]&&q[1]<r[4]){ t.covered.push(r[0]+' at '+tt.toFixed(2)); break; } }
            if(tt>=13.1&&p.hand&&!p.detached){ const inside=c=>c[0]>0&&c[0]<p.W&&c[1]>0&&c[1]<p.H; const covers=keepNow().filter(r=>r[0]!=='the status line'), under=c=>covers.some(r=>(r[1]>0?c[0]>r[1]+4:true)&&(r[3]<p.W?c[0]<r[3]-4:true)&&c[1]>r[2]+4&&(r[4]<p.H?c[1]<r[4]-4:true));
              const cs=p.cut, pts=cs.concat(cs.slice(1).flatMap((c,i)=>[.25,.5,.75].map(f=>[cs[i][0]+(c[0]-cs[i][0])*f,cs[i][1]+(c[1]-cs[i][1])*f])));
              pts.forEach(c=>{ if(inside(c)&&!under(c)) t.cutIn.push(+tt.toFixed(2)); });   /* off screen, or under the opaque bottom bar */ const b=p.board, m=p.muzzle; if(m[0]>b[0]&&m[0]<b[2]&&m[1]>b[1]&&m[1]<b[3]) t.mzOnBoard=true; }
            if(!t.settled&&tt>=14.95){ const m=p.muzzle, r=p.rear, a=p.aim; const bx=m[0]-r[0], by=m[1]-r[1], bl=Math.hypot(bx,by); let e=deg(a,m)-deg(m,r); e=((e+540)%360)-180; const el=deg(m,r); t.clear=p.clear; t.settled={barrel:p.side<0?el:180-el, err:e, miss:Math.abs(((a[0]-m[0])*by-(a[1]-m[1])*bx)/bl), W:p.W, H:p.H}; }
            if(fire&&!t.recoil&&tt>=15.06){ const el=deg(p.muzzle,p.rear); t.recoil=(p.side<0?el:180-el)-t.settled.barrel; }
            if(fire&&tt>=15.55&&t.detachedLeft===null) t.detachedLeft=p.hand; }
          __rr.advance(1,false); turns.push(t); }
        __rr.advance(1/30,true);
        return {rest, programs:__rr.state.programs, plate:__rr.handPose.plate, turns}; });
      assert.deepEqual(errors,[],`no page errors at ${w}x${h}`);
      const want=w/h>=1.5?22:null;   /* upright: the angle follows from where the glove fits (below) */
      for(const t of out.turns){
        const tag=`${w}x${h} ${t.fire?'shot':'click'}`;
        assert.ok(t.shown,`${tag}: the hand shows`);
        assert.deepEqual(t.both,[],`${tag}: never the hand and the felt's revolver on screen together`);
        if(want!==null) assert.ok(Math.abs(t.settled.barrel-want)<1,`${tag}: barrel ${t.settled.barrel.toFixed(2)}° (want ${want}°)`);
        else{ assert.equal(t.clear,true,`${tag}: the upright placement that keeps the glove clear is in use`); assert.ok(t.settled.barrel>45&&t.settled.barrel<80,`${tag}: barrel ${t.settled.barrel.toFixed(2)}° rises steeply to the board`); assert.deepEqual([...new Set(t.covered)].slice(0,5),[],`${tag}: the glove is never under the status line or the bottom bar`); }
        assert.ok(t.settled.miss<=4,`${tag}: the barrel line passes ${t.settled.miss.toFixed(1)} px from the board's centre`);
        assert.equal(t.mzOnBoard,false,`${tag}: the muzzle stays off the board`);
        assert.deepEqual(t.cutIn,[],`${tag}: the sleeve's cut stays outside the frame`);
        if(t.fire){ assert.ok(t.recoil>3,`${tag}: the recoil turns the muzzle up (${t.recoil.toFixed(2)}°)`); assert.equal(t.detachedLeft,false,`${tag}: the hand is gone half a second after the shot`); } }
      assert.ok(out.programs<=11,`Light at ${w}x${h}: ${out.programs} shader programs (11 before the whisky set)`);
      const restMax=w>h?35:36; const big=Math.max(...out.turns.map(t=>t.settled.miss));   /* 2.6.0 before the whisky set: 33 at 1920x866, 35 at 390x844; the set is one draw */
      assert.ok(out.rest<=restMax,`Light at ${w}x${h}: ${out.rest} draws at rest (≤ ${restMax})`);
      assert.equal(out.plate,w>h?'W':'P',`${w}x${h}: the ${w>h?'landscape':'upright'} plate`);
      ok('B1',`${w}x${h} Light, plate ${out.plate}${w<h?', glove clear of the status line and the bar at every frame':''}: barrel ${out.turns.map(t=>t.settled.barrel.toFixed(1)).join('/')}°, miss ${out.turns.map(t=>t.settled.miss.toFixed(1)).join('/')} px, recoil +${out.turns[0].recoil.toFixed(1)}°, ${out.rest} draws, ${out.programs} programs`);
      await context.close(); }
    const SQ=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-assets/v10_1/roulette/assets/squads.json'),'utf8'));
    const rows=c=>{ const x=SQ.clubs.find(q=>q.club===c); return [...x.xi,...x.subs].map(r=>({pos:r[0],position:r[0],name:r[1],rating:r[2],special:false,number:null})); };
    for(const [w,h] of [[390,844],[360,640]]){
      const context=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.route('**/roulette/__r93_embed.html',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#050403"><div style="position:fixed;inset:0"><iframe id="f" src="index.html?embed=1&gfx=0&d=Manchester%20United&n=Real%20Madrid" style="display:block;width:100%;height:100%;border:0"></iframe></div><script>window.msgs=[];addEventListener('message',e=>window.msgs.push(e.data&&e.data.type));</script>`}));
      await page.goto(`${base}visual-assets/v10_1/roulette/__r93_embed.html`,{waitUntil:'commit'});
      await page.waitForFunction(()=>window.msgs&&window.msgs.includes('cms-rr-ready'),null,{timeout:300000,polling:250});
      await page.evaluate(({D,N})=>document.getElementById('f').contentWindow.postMessage({type:'cms-rr-setup',d:'Manchester United',n:'Real Madrid',boards:{D,N},formations:{D:null,N:null},seed:7,sound:false,
        turns:[{fire:true,target:'C. Smalling',bulletChamber:2,stopChamber:2,hitSlot:null,aimSlot:null,loadedChambers:[2,5]},{fire:false,target:'Isco',bulletChamber:3,stopChamber:5,hitSlot:null,aimSlot:null,loadedChambers:[3]}]},location.origin),{D:rows('Manchester United'),N:rows('Real Madrid')});
      await page.waitForFunction(()=>window.msgs.includes('cms-rr-armed'),null,{timeout:60000,polling:200});
      const fr=page.frames().find(f=>f.url().includes('embed=1'));
      await fr.evaluate(()=>{ __rr.clock(); __rr.advance(1/30,true); });
      const turns=[];
      for(let ti=0;ti<2;ti++){
        const before=await fr.evaluate(()=>document.getElementById('result').getBoundingClientRect().bottom);
        await fr.evaluate(()=>document.getElementById('cta').click());
        turns.push(await fr.evaluate(before=>{ const t={before,during:null,ctaShown:false,clear:new Set(),covered:[],gw:null,mzOnBoard:false,shown:false};
          const capBox=()=>{ const e=document.getElementById('result'), rg=document.createRange(); rg.selectNodeContents(e); return rg.getBoundingClientRect(); };
          for(let i=0;i<800;i++){ __rr.advance(1/30,false); const st=__rr.state; if(!st.playing) break; const p=__rr.handPose, tt=st.tt;
            if(t.during===null&&tt>=1) t.during=document.getElementById('result').getBoundingClientRect().bottom;
            if(tt>=1&&getComputedStyle(document.getElementById('cta')).visibility!=='hidden') t.ctaShown=true;
            if(p.hand&&p.glove&&!p.detached&&tt>=12.9){ t.shown=true; t.clear.add(p.clear); const c=capBox(); for(const q of p.glove) if(q[0]>c.left&&q[0]<c.right&&q[1]>c.top&&q[1]<c.bottom){ t.covered.push(tt.toFixed(2)); break; }
              if(t.gw===null&&tt>=14.95){ const xs=p.glove.map(q=>q[0]); t.gw=Math.max(...xs)-Math.min(...xs); }
              const b=p.board, m=p.muzzle; if(m[0]>b[0]&&m[0]<b[2]&&m[1]>b[1]&&m[1]<b[3]) t.mzOnBoard=true; } }
          __rr.advance(1,false); t.after=document.getElementById('result').getBoundingClientRect().bottom; t.clear=[...t.clear]; return t; },before)); }
      assert.deepEqual(errors,[],`no page errors in the game view at ${w}x${h}`);
      const tall=h>=780;
      for(const [i,t] of turns.entries()){ const tag=`game view ${w}x${h} turn ${i+1}`;
        assert.ok(t.shown,`${tag}: the hand shows`);
        assert.deepEqual(t.clear,[true],`${tag}: the upright placement that keeps the glove clear is in use`);
        assert.deepEqual(t.covered.slice(0,5),[],`${tag}: the glove is never under the caption`);
        assert.ok(t.gw>=100,`${tag}: the glove is ${Math.round(t.gw)} px wide at the aim (at least 100)`);
        assert.equal(t.mzOnBoard,false,`${tag}: the muzzle stays off the board`);
        if(tall){ assert.equal(t.ctaShown,false,`${tag}: the Spin button is gone at once (the caption stands in its room)`); assert.ok(t.during>=h-46&&t.during<=h-38,`${tag}: the caption stands in the Spin button's room (bottom ${t.during} px)`); assert.ok(Math.abs(t.after-t.before)<1,`${tag}: the caption goes back after the turn`); }
        else assert.ok(Math.abs(t.during-t.before)<1,`${tag}: on a short phone the caption stays where it was`); }
      ok('B2',`game view ${w}x${h} Light: glove ${turns.map(t=>Math.round(t.gw)).join('/')} px, clear of the caption at every frame, caption ${tall?'in the Spin button\'s room for the turn':'where it was'}`);
      await context.close(); }
    console.log(`PASS r93 RRR hand and props contracts: ${checks} checks.`);
  }finally{ if(browser) await browser.close().catch(()=>{}); server.kill(); }
})().catch(e=>{ console.error(e); process.exit(1); });
