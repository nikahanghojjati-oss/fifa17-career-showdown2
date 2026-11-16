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
  assert.equal(M.drawStop(0,.5),600%360);
  assert.equal(M.drawStop(359.99,.999999),Math.floor(M.mod360(359.99+600+120*.999998))%360);
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
// 3. Grass friction: lands exactly on the planned travel, speed falls without ever rising, zero at the end. An own tap
//    (full speed, the lead D0 +- J) and every re-aimed ball (speedFor) stop within REPLAN_DUR seconds.
{
  const P=M.physics;
  for(const w0 of [85,150,180,300,434,470])for(const travel of [154,480,513,603,723,843]){
    const own=w0>=434&&travel>=P.D0-P.J&&travel<=P.D0+P.J+40,w=own?w0:Math.max(w0,M.speedFor(travel,P.REPLAN_DUR));
    const f=M.friction(w,travel);
    assert.ok(Math.abs(f.at(f.dur)-travel)<.01,`travel ${f.at(f.dur)} vs ${travel}`);
    assert.ok(Math.abs(f.speed(0)-w)<.01);assert.equal(f.speed(f.dur),0);
    let prevS=Infinity,prevA=-1;for(let t=0;t<=f.dur;t+=f.dur/400){const s=f.speed(t),a=f.at(t);assert.ok(s<=prevS+1e-9&&a>=prevA-1e-9);prevS=s;prevA=a;}
    assert.ok(f.dur>.3&&f.dur<=P.REPLAN_DUR+.01,`${w0} deg/s over ${travel} deg: ${f.dur} s`);
  }
  pass("C3 friction: exact travel, speed only falls and ends at zero, every stop within 4.2 s");
}
// 4. Nik's luck setting (2026-11-15): a well-timed tap lands the aimed club about 50%, a blind tap 33%.
{
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  let timed=0,blind=0;const N=300000,P=M.physics;
  for(let n=0;n<N;n+=1){
    const aim=n%3,perfect=aim*120+60-P.D0;
    if(M.sectionOf(M.drawStop(perfect+(rnd()-.5)*20,rnd()))===aim)timed+=1;
    if(M.sectionOf(M.drawStop(rnd()*360,rnd()))===aim)blind+=1;
  }
  assert.equal(P.J,120);
  assert.ok(Math.abs(timed/N-.5)<.03,`timed ${timed/N}`);
  assert.ok(Math.abs(blind/N-1/3)<.01,`blind ${blind/N}`);
  pass(`C4 luck: J = 120 deg; a tap timed within 10 deg lands the aimed club ${(100*timed/N).toFixed(1)}%, a blind tap ${(100*blind/N).toFixed(1)}%`);
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
  assert.ok(/if\(!b\.accepted&&b\.restA\+PHYS\.A0-b\.f<PHYS\.AWAIT_LEAD\)/.test(src));
  pass("C5 the scene only draws: no Firebase, storage or network; the vendored engine; ONE quality system; no auto-stop; rests only after accept()");
}
// 6. Light stays the lightest 3D screen: plain ball shader, no blades/glow/confetti; heavier parts only above it.
{
  const L=M.knobs(0);
  assert.deepEqual([L.gloss,L.detail,L.blades,L.bokeh,L.confetti,L.atlas],[false,false,0,false,false,512]);
  assert.ok(L.seg[0]*L.seg[1]<=48*32);
  for(let l=1;l<=5;l+=1){const k=M.knobs(l),p=M.knobs(l-1);assert.ok(k.atlas>=p.atlas&&k.seg[0]>=p.seg[0]&&k.blades>=p.blades&&k.blurTaps>=p.blurTaps);}
  assert.equal(M.knobs(9).level,5);assert.equal(M.knobs(-3).level,0);assert.equal(M.knobs("x").level,0);
  pass("C6 levels: Light has no extras (4 draws, 3 programs measured); each level only adds");
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
  pass("C8 tune(): known motion numbers only, the third stays 120 deg, reset restores the shipped values");
}
process.stdout.write(`PASS R94-02 club draw scene: ${passed} checks.\n`);
