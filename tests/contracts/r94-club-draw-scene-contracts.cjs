#!/usr/bin/env node
"use strict";
// R94-02 PR 2: the Club Assignment 3D scene (js/clubDrawScene3d.js) and its tuning page (tools/club-draw-tuning.html).
// Pure motion law in node (the stop integer, the rest pose, the grass friction, the luck Nik set), and static checks that
// the module only draws (no Firebase, no writes, no club decided), uses the ONE quality system, keeps Light light, and that
// the tuning page is never shipped. The wiring into the Club screen is PR 3.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..","..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const M=require(path.join(ROOT,"js","clubDrawScene3d.js"));
let passed=0;const pass=msg=>{passed+=1;process.stdout.write(`PASS ${msg}\n`);};

// 1. The stored stop: an integer 0..359 from the face in front and the grass; the third it points at is the club.
{
  let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let n=0;n<200000;n+=1){
    const front=rnd()*720-180,stop=M.drawStop(front,rnd());
    assert.ok(Number.isInteger(stop)&&stop>=0&&stop<=359,`stop ${stop}`);
    assert.equal(M.sectionOf(stop),Math.floor(stop/120));
  }
  const P=M.physics;
  assert.equal(M.drawStop(0,.5),P.D0%360);
  assert.equal(M.drawStop(359.99,.999999),Math.floor(M.mod360(359.99+P.D0+P.J*.999998))%360);
  pass("C1 drawStop: always one whole number 0..359; the club is its third (stop / 120)");
}
// 2. The rest pose: the same picture on both phones, inside the stop's own third, never a border facing the manager.
{
  for(let stop=0;stop<360;stop+=1){
    const a=M.poseOf(stop),again=M.poseOf(stop),sec=Math.floor(stop/120);
    assert.equal(a,again);
    assert.equal(Math.floor(M.mod360(a)/120),sec,`pose of ${stop} left its third`);
    const fromBorder=Math.min(a-sec*120,(sec+1)*120-a),fromMid=Math.abs(a-(sec*120+60));
    assert.ok(fromBorder>=23.5,`pose of ${stop} only ${fromBorder} deg from a border`);
    assert.ok(fromMid<=36,`pose of ${stop} ${fromMid} deg from the crest`);
  }
  pass("C2 poseOf: fixed by the stored integer, inside its own third, at least 23.5 deg from a border, crest within 36 deg");
}
// 3. Grass friction: lands exactly on the planned travel, speed falls without ever rising, zero at the end. Every re-aimed
//    ball (speedFor) stops within REPLAN_DUR seconds. R95-01: the own STOP travels D0 +- J from ANY speed of the Master spin
//    (168..422 deg/s) with stopPlan: it rolls on at its speed, then brakes firmly; never a 16 s crawl.
{
  const P=M.physics,check=(f,w,travel,maxDur)=>{
    assert.ok(Math.abs(f.at(f.dur)-travel)<.01,`travel ${f.at(f.dur)} vs ${travel}`);
    assert.ok(Math.abs(f.speed(0)-w)<.01);assert.equal(f.speed(f.dur),0);
    let prevS=Infinity,prevA=-1;for(let t=0;t<=f.dur;t+=f.dur/400){const s=f.speed(t),a=f.at(t);assert.ok(s<=prevS+1e-9&&a>=prevA-1e-9);prevS=s;prevA=a;}
    assert.ok(f.dur>.3&&f.dur<=maxDur+.01,`${w} deg/s over ${travel} deg: ${f.dur} s`);
  };
  for(const w0 of [85,150,180,300,434,470])for(const travel of [154,480,513,603,723,843]){const w=Math.max(w0,M.speedFor(travel,P.REPLAN_DUR));check(M.friction(w,travel),w,travel,P.REPLAN_DUR);}
  for(let w=168;w<=422;w+=6)for(const travel of [P.D0-P.J+P.A0,P.D0+P.A0,P.D0+P.J+P.A0]){const f=M.stopPlan(w,travel);check(f,w,travel,P.REPLAN_DUR+P.BRAKE);
    if(f.coast)assert.ok(f.dur-f.coast<=P.BRAKE+.01,"the brake itself lasts at most BRAKE seconds");}
  pass("C3 friction: exact travel, speed only falls and ends at zero; re-aims within 4.2 s; the own STOP from any spin speed within 7.2 s, braking at most 3 s");
}
// 4. R95-01 luck (Nik 2026-11-17, New STOP on Expert, locked 04:37 UTC): the crest facing the manager when he presses STOP is
//    his club, give or take J = 1.8 deg of grass (.03 of a 60 deg slice). A tap with the crest anywhere but the outer 1.8 deg
//    of its slice in front always lands it; a blind tap lands 1 in 6.
{
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const P=M.physics;assert.equal(P.J,1.8);assert.equal(P.D0,720);
  M.tune({SECTION:60});
  try{
    let timed=0,blind=0,edge=0;const N=300000;
    for(let n=0;n<N;n+=1){
      const aim=n%6,front=aim*60+P.J+rnd()*(60-2*P.J-1e-9);
      if(M.sectionOf(M.drawStop(front,rnd()))===aim)timed+=1;
      if(M.sectionOf(M.drawStop(rnd()*360,rnd()))===aim)blind+=1;
      if(M.sectionOf(M.drawStop(aim*60+rnd()*60,rnd()))===aim)edge+=1;
    }
    assert.equal(timed,N,"the crest in front (clear of the last 1.8 deg) is always the club");
    assert.ok(Math.abs(blind/N-1/6)<.005,`blind ${blind/N}`);
    assert.ok(edge/N>.96,`anywhere in its slice ${edge/N}`);
    pass(`C4 luck: J = 1.8 deg, D0 = 720; the crest in front lands 100% (clear of the edge), ${(100*edge/N).toFixed(1)}% anywhere in its slice, a blind tap ${(100*blind/N).toFixed(1)}%`);
  }finally{M.tune("reset");}
}
// 5. The module only draws: no Firebase, no storage, no network, no club decided by the scene, no timer that stops a ball.
{
  const src=read("js/clubDrawScene3d.js"),code=src.replace(/\/\/[^\n]*/g,"");
  for(const bad of [/firebase/i,/firestore/i,/setDoc|updateDoc|runTransaction|writeBatch/,/localStorage|sessionStorage|indexedDB/,/fetch\(/,/XMLHttpRequest/,/sharedSetup|sparkShared/])
    assert.ok(!bad.test(code),`scene code mentions ${bad}`);
  assert.ok(/ENGINE_PATH="visual-assets\/v10_1\/roulette\/vendor\/three-r187\.min\.js"/.test(src),"the vendored three r187");
  assert.ok(fs.existsSync(path.join(ROOT,"visual-assets/v10_1/roulette/vendor/three-r187.min.js")));
  for(const call of ["profile()","governor(renderer","calibrate(renderer","gov?.end()","sceneOpening","sceneOpened","forceContextLoss"])assert.ok(src.includes(call),`missing ${call}`);
  // No timer, no auto-stop (brief): a ball slows only from tap() or restOn(); setTimeout is used for sound notes only.
  const timers=code.match(/setTimeout\([^;]*/g)||[];assert.ok(timers.every(t=>/tone\(/.test(t)),`timers: ${timers.join(" | ")}`);
  assert.ok(!/setInterval/.test(code));
  // The ball rests only on a stop Firebase holds: an own tap waits for accept() before the last third.
  // (R95-01: written along the way the ball turns, sd = 1 always with the forward-only spin.)
  assert.ok(/if\(!b\.accepted&&sd\*\(b\.restA-b\.f\)\+PHYS\.A0<PHYS\.AWAIT_LEAD\)/.test(src));
  pass("C5 the scene only draws: no Firebase, storage or network; the vendored engine; ONE quality system; no auto-stop; rests only after accept()");
}
// 6. Light stays light: no blades, glow or confetti, 512 crests, at most 64x40 segments, 4 draws and 3 programs. R95-01
//    (quality raise): with the blur gone, every level, Light too, wears the stitched leather and the second highlight.
{
  const L=M.knobs(0);
  assert.deepEqual([L.gloss,L.detail,L.blades,L.bokeh,L.confetti,L.atlas],[true,true,0,false,false,512]);
  assert.ok(L.seg[0]*L.seg[1]<=64*40);
  for(let l=1;l<=5;l+=1){const k=M.knobs(l),p=M.knobs(l-1);assert.ok(k.atlas>=p.atlas&&k.seg[0]>=p.seg[0]&&k.blades>=p.blades&&(k.gloss||!p.gloss)&&(k.detail||!p.detail));}
  assert.equal(M.knobs(9).level,5);assert.equal(M.knobs(-3).level,0);assert.equal(M.knobs("x").level,0);
  pass("C6 levels: Light = stitched leather and gloss, no blades/glow/confetti (4 draws, 3 programs measured); each level only adds");
}
// 7. The tuning page is a tool: never staged for Pages, never precached, never linked from the game.
{
  const page=read("tools/club-draw-tuning.html"),deploy=read(".github/workflows/deploy-github-pages.yml"),sw=read("service-worker.js"),index=read("index.html");
  assert.ok(/<base href="\.\.\/">/.test(page)&&page.includes("js/clubDrawScene3d.js")&&page.includes("js/gfxTier.js"));
  assert.ok(!/cp[^\n]*\btools\b/.test(deploy),"tools/ staged for Pages");
  assert.ok(!sw.includes("club-draw-tuning"),"tuning page precached");
  assert.ok(!index.includes("club-draw-tuning"));
  pass("C7 tools/club-draw-tuning.html: not staged by the Pages deploy, not in service-worker.js, not linked from the game");
}
// 8. Tuning never leaks into a game: tune() changes only known motion numbers, never the 120-degree third, and resets.
{
  const before={...M.tune({})};
  M.tune({J:10,SECTION:90,nope:3,D0:"x"});assert.equal(M.tune({}).J,10);assert.equal(M.tune({}).SECTION,120);assert.equal(M.tune({}).D0,before.D0);assert.ok(!("nope" in M.tune({})));
  M.tune("reset");assert.deepEqual(M.tune({}),before);assert.deepEqual({...M.physics},before);assert.ok(Object.isFrozen(M.physics));
  const SRC=read("js/clubDrawScene3d.js");
  // Codex #1523: Reset on the tuning page keeps the mounted scene's slice (six clubs = 60 deg) until that scene is freed.
  assert.match(SRC,/if\(partial==="reset"\)\{Object\.assign\(PHYS,PHYS_DEFAULT\);if\(mountedSection\)PHYS\.SECTION=mountedSection;/);
  assert.match(SRC,/mountedSection=PHYS\.SECTION=360\/NS;/);assert.match(SRC,/disposed=true;if\(mountedSection===360\/NS\)mountedSection=0;/);
  pass("C8 tune(): known motion numbers only, the third stays 120 deg, reset restores the shipped values but keeps a mounted scene's slice");
}
// C9 (Nik 2026-11-16, gallery v1): the slow look shows every crest whole. All three are fully lit from its first frame,
// and the ball turns each crest in turn to the middle of its third (facing the camera) and holds it there before the kick.
{
  const SRC=read("js/clubDrawScene3d.js");
  for(const front of [0,35,59.9,215,359])for(let n=0,f=M.showTarget(front);n<3;n+=1,f+=120){
    assert.equal(M.mod360(f)%120,60,`front ${front}: stop ${n} is the middle of a third`);
    assert.ok(f-front>=20&&f-front<=140+240,`front ${front}: stops ahead of the ball`);
  }
  assert.equal(new Set([0,1,2].map(n=>M.sectionOf(M.mod360(M.showTarget(35)+n*120)))).size,3,"the three holds show the three crests");
  assert.match(SRC,/lit:\{value:allN\(1\)\}/,"the ball's first frame already wears all its clubs (Nik 22:17: no empty or half-drawn third)");
  assert.match(SRC,/state:"idle",t:0,lit:allN\(1\)/,"and so does the idle ball before the slow look");
  assert.match(SRC,/b\.state==="rest"\)\{if\(b\.t>PHYS\.REST0\)\{lightAll\(b\);/,"all crests lit before the slow look starts");
  assert.match(SRC,/else if\(b\.state==="show"\)\{[\s\S]{0,800}?lightAll\(b\);/,"and kept lit through it");
  assert.equal(/b\.lit\[i\]=v/.test(SRC),false,"no crest blooms in during the turn");
  assert.ok(M.physics.SHOW>=.8&&M.physics.SHOW<=1.2,"each crest is held facing the camera for about a second");
  pass("C9 the slow look: all three crests fully drawn from the first frame, each turned to face the camera and held about a second");
}
// C10 (Nik 2026-11-16, gallery): each club's third wears its own 2016-17 kit (js/kits17.js): colours and pattern, so two or
// three red clubs never look the same apart from the crest. All 98 clubs have a kit; within every league any two clubs (any
// two can share a ball) differ at a glance; the pattern is drawn in the ball's own program (no texture, Light budget kept).
{
  global.window=global;require(path.join(ROOT,"js","visualIdentity.js"));
  const K=require(path.join(ROOT,"js","kits17.js"));
  const {catalog}=require(path.join(ROOT,"js","sharedShowdownCatalog.js"));
  const all=Object.values(catalog).flat();
  assert.equal(new Set(all).size,98,"98 clubs");
  for(const club of all){const l=M.ballLook(K,club);assert.ok(l.known,`${club} has a 2016-17 kit`);assert.ok(l.pent,`${club} has pentagon colour`);
    assert.ok(K.deltaE(l.pent,l.body)>=18,`${club}: pentagons stand apart from the body`);}
  for(const [league,clubs] of Object.entries(catalog))for(let i=0;i<clubs.length;i+=1)for(let j=i+1;j<clubs.length;j+=1)
    assert.ok(M.looksApart(M.ballLook(K,clubs[i]),M.ballLook(K,clubs[j]),K.deltaE),`${league}: ${clubs[i]} and ${clubs[j]} would look alike`);
  // Gallery 23:06: plain shirts of one colour (Liverpool, United, Arsenal; the white and blue groups) must differ in at least
  // two big cues each: fabric, pentagons, shorts, sleeves.
  const cues=(a,b)=>[a.fabric!==b.fabric,K.deltaE(a.pent,b.pent)>25,Boolean(a.shorts)!==Boolean(b.shorts)||Boolean(a.shorts&&K.deltaE(a.shorts,b.shorts)>25),
    Boolean(a.sleeves)!==Boolean(b.sleeves)||Boolean(a.sleeves&&K.deltaE(a.sleeves,b.sleeves)>25)].filter(Boolean).length;
  for(const [league,clubs] of Object.entries(catalog)){const plain=clubs.map(c=>[c,M.ballLook(K,c)]).filter(([,l])=>l.pattern==="solid");
    for(let i=0;i<plain.length;i+=1)for(let j=i+1;j<plain.length;j+=1)if(K.deltaE(plain[i][1].body,plain[j][1].body)<25)
      assert.ok(cues(plain[i][1],plain[j][1])>=2,`${league}: ${plain[i][0]} and ${plain[j][0]} need two big cues apart`);}
  for(const name of Object.keys(M.BALL_VARIANT))assert.ok(all.includes(name),`ball variant ${name} is a club`);
  const SRC=read("js/clubDrawScene3d.js");
  assert.match(SRC,/vec3 kitAt\(float u,float sv,float lat,/,"the kit is drawn in the ball shader");
  assert.match(SRC,/vec3 club=mix\(kit,pk,pent\);/,"under the seams, the gold line and the crest (r95 look: no black panels, the kit everywhere)");
  assert.equal(/sampler2D (?!atlas)/.test(SRC.slice(SRC.indexOf("const BALL_FS"),SRC.indexOf("const PITCH_GLSL"))),false,"no new texture on the ball");
  assert.ok(M.ballLook(null,"Arsenal",{primary:"#cc0000",secondary:"#ffffff"}).known===false,"no kit table: the identity colours (never a blank ball)");
  pass("C10 every club's third wears its own kit; no two clubs of a league look alike; drawn in the ball's one program");
}
// C11 (R95-01, Nik 2026-11-17 04:37 UTC "1 ok"): the Master spin, smooth and one direction. Pinned numbers; the speed never
// goes negative or jumps; no feint, flip, surge, lab mode or blur left in the scene; six clubs a ball shown in the slow look.
{
  const P=M.physics,SRC=read("js/clubDrawScene3d.js"),code=SRC.replace(/\/\/[^\n]*/g,"");
  assert.deepEqual([P.W_FAST,P.RHY,P.RHY_T,P.RHY2,P.RHY_T2,P.RHY3,P.RHY_T3,P.J,P.D0,P.SHOW_N6,P.BRAKE],[295,.22,2.4,.13,1.55,.08,3.7,1.8,720,.55,3]);
  assert.ok(P.RHY+P.RHY2+P.RHY3<1,"the waves can never stop or reverse the ball");
  let seed=11,lo=Infinity,hi=-Infinity;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let n=0;n<2000;n+=1){const ph=[rnd()*6.2832,rnd()*6.2832,rnd()*6.2832];let prev=M.spinSpeed(0,ph);
    for(let t=0;t<=30;t+=1/60){const w=M.spinSpeed(t,ph);assert.ok(w>0,"w never negative");assert.ok(Math.abs(w-prev)<=400/60,"smooth: at most 400 deg/s per second of change, no jump");prev=w;lo=Math.min(lo,w);hi=Math.max(hi,w);}}
  assert.ok(lo>=P.W_FAST*(1-P.RHY-P.RHY2-P.RHY3)-1e-9&&hi<=P.W_FAST*(1+P.RHY+P.RHY2+P.RHY3)+1e-9&&lo<200&&hi>400,`speed ${lo}..${hi}`);
  for(const bad of [/\bMODE\b/,/\bFLIP_/,/\bSURGE/,/\bTELL\b/,/\bCHAOS\b/,/\bBLUR/,/\btrap\(/,/\btouch\(/,/\bstrike\(/,/\brollTo\(/,/"ready"/,/uniform float blur/,/uniform float spd/,/dirT|dirS|flipAt/])
    assert.ok(!bad.test(code),`scene still has ${bad}`);
  assert.match(code,/w=PHYS\.W_FAST\+\(spinSpeed\(b\.t,b\.ph\)-PHYS\.W_FAST\)\*fade;/,"the waves fade in from the kick's W_FAST (no jump at full speed)");
  assert.match(code,/if\(!b\.ph\)\{b\.ph=\[Math\.random\(\)\*6\.2832,Math\.random\(\)\*6\.2832,Math\.random\(\)\*6\.2832\];\}/,"fresh wave phases every spin");
  assert.match(code,/b\.sdir=b\.w<0\?-1:1;/,"a defensive guard keeps any stop on the way the ball turns");
  assert.match(code,/b\.plan=stopPlan\(Math\.max\(Math\.abs\(b\.w\),1\),Math\.abs\(travel\)\+PHYS\.A0\)/,"the own STOP brakes with stopPlan");
  assert.match(code,/" vec4 cr=crest\(d,k,0\.\);"/,"one sharp crest lookup per pixel");
  assert.match(code,/hold=NS===6\?PHYS\.SHOW_N6:PHYS\.SHOW/,"the slow look holds each of six crests SHOW_N6 s");
  assert.match(code,/canStop\(i\)\{const b=ballOf\(i\);return b\.stop===null&&b\.queued===null&&\(b\.state==="spin"\|\|b\.state==="spin-still"\);\}/,"STOP only at full speed");
  const before={...M.tune({})};M.tune({RHY:.6,RHY2:.3});assert.deepEqual([M.tune({}).RHY,M.tune({}).RHY2],[before.RHY,before.RHY2],"tune() refuses waves that could stop the ball");M.tune({W_FAST:-5});assert.equal(M.tune({}).W_FAST,before.W_FAST);M.tune("reset");
  pass(`C11 Master spin: W 295 x (1 + .22/2.4 s + .13/1.55 s + .08/3.7 s) = ${lo.toFixed(0)}-${hi.toFixed(0)} deg/s, never negative, no jump; no feint, surge, lab mode or blur; STOP only at full speed`);
}
process.stdout.write(`PASS R94-02 club draw scene: ${passed} checks.\n`);
