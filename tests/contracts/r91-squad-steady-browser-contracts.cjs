#!/usr/bin/env node
'use strict';
// r91 / 2.4.0 Squad LOCK "element is not stable" (Gate L6 job 132178074536, 2026-11-13, and run 43160602051 before it).
// Nik's LOCK on the 360x640 Squad screen sat at y 2045, then 2009, then 2045 again, frame after frame: Playwright waited for
// it to stand still for 150 s and never tapped. The cause: the mouse rested where the last tap (SPIN THE CYLINDER) left it,
// over the pitch. The player card above the pitch follows the mouse (mouseover); a kept signing's card is one row shorter
// (no nation, no shirt number), so the new card moved the pitch 36 px, the browser sent mouseover again for the player now
// under the resting mouse, his card moved the pitch back, and so on every frame. Chamber Men's stage, with its 3D goal still
// drawing, was also still up under the Squad screen.
// The real step (js/squadSheetStep.js with js/squadScreen.js and css/squadScreen.css) on the real app page, season 2 "pre",
// Arsenal with two kept signings, an in-memory store:
//   SS1 a mouse resting anywhere over the squad never moves LOCK: its box is the same over 12 frames at every point of a grid
//       over the screen (the old code moved it at some points), and the card shows one player the whole time;
//   SS2 LOCK takes a real Playwright tap at once with the mouse resting at the worst point, and the lock is written once;
//   SS3 the card still follows a mouse that moves (hover is kept, only the page moving under a still mouse is ignored);
//   SS4 Chamber Men's stage left up under the Squad screen is taken down in the same task the Squad stage goes in (never a
//       frame with neither), so its 3D goal stops drawing; the loading screen is never needed between them.
const assert=require('node:assert/strict');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(ok)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');}
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r91 squad steady contracts ended before their last check.');process.exitCode=1;}});

// Runs in the page: Chamber Men's stage as that step leaves it (SPIN THE CYLINDER pressed), then the Squad step's season 2
// "pre" screen for Nik (Arsenal) with two kept signings from season 1, on an in-memory store.
async function openSquad(){
  try{localStorage.clear();}catch(_error){}
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.head.append(s);});
  await load('js/chamberMen.js');await load('js/chamberMenStep.js');await load('js/squadSheetStep.js');
  const step=window.CareerModeSquadSheetStep;
  if(!await step.ensure())throw new Error('squad step did not load');
  // Chamber Men's stage, left up (as the step leaves it on SPIN THE CYLINDER) with a canvas standing in for its 3D goal.
  const cm=document.createElement('div');cm.id='cmStage';cm.style.cssText='position:fixed;inset:0;z-index:95;background:#050403';cm.append(document.createElement('canvas'));document.body.append(cm);
  const log=[];window.__stages=log;
  new MutationObserver(records=>{
    const batch={added:[],removed:[]};
    for(const r of records){for(const n of r.addedNodes)if(n.id)batch.added.push(n.id);for(const n of r.removedNodes)if(n.id)batch.removed.push(n.id);}
    if(batch.added.length||batch.removed.length)log.push(batch);
  }).observe(document.body,{childList:true});
  const writes=[];window.__writes=writes;
  const sdk={doc:(_fs,...parts)=>parts.join('/'),serverTimestamp:()=>'ts',
    runTransaction:async(_fs,fn)=>fn({get:async()=>({exists:()=>false,data:()=>null}),set:(ref,data)=>{writes.push({ref,data});}}),
    onSnapshot:()=>()=>{}};
  const rid=`pair_${'cd'.repeat(32)}`;
  const kept=[{name:'Zed Tester',release:false,overall:88,position:'ST'},{name:'Yan Tester',release:false,overall:86,position:'CM'}];
  const ctx={rivalryId:rid,managerRole:'playerTwo',season:2,stage:'pre',clubs:{playerOne:'Chelsea',playerTwo:'Arsenal'},special:null,seasons:3,
    verdicts:async()=>({ok:true,verdicts:{playerOne:[],playerTwo:kept},hits:{playerOne:{fired:false},playerTwo:{fired:false}}})};
  window.__run=step.run(ctx,{firestore:{},sdk,rivalryId:rid,sessionId:'s',deviceId:'d',now:()=>Date.now()});
  const until=Date.now()+20000;
  while(!document.querySelector('#sqStage .sqmBtn.is-primary')){if(Date.now()>until)throw new Error('the Squad screen did not open');await new Promise(r=>setTimeout(r,50));}
  await document.fonts?.ready;
  return {cm:Boolean(document.getElementById('cmStage')),stages:log};
}
// Runs in the page: LOCK's box top over 12 frames and the names the card showed.
function watch(){
  return new Promise(resolve=>{
    const tops=new Set(),names=new Set();let n=0;
    const frame=()=>{
      const b=document.querySelector('#sqStage .sqmBtn.is-primary');if(b)tops.add(Math.round(b.getBoundingClientRect().top));
      names.add(document.querySelector('#sqStage .sqmCardName')?.textContent||'');
      if(++n<12)requestAnimationFrame(frame);else resolve({tops:[...tops],names:[...names]});
    };
    requestAnimationFrame(()=>requestAnimationFrame(frame));
  });
}

(async()=>{
  const {chromium}=require('playwright');
  const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{cwd:ROOT,stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=='--single-process')});
    const base=`http://127.0.0.1:${port}/`;
    // A mouse, as in the Gate's journeys and on a Chromebook (a finger never hovers).
    const context=await browser.newContext({viewport:{width:360,height:640},serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route(url=>!String(url).startsWith(base),route=>route.abort());
    await page.goto(`${base}index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.loadRuntimeScript==='function',null,{timeout:20000});
    const opened=await page.evaluate(openSquad);

    // SS4: Chamber Men's stage went in the same task the Squad stage went in.
    assert.equal(opened.cm,false,'#cmStage is still up under the Squad screen (its 3D goal keeps drawing)');
    const at=opened.stages.findIndex(b=>b.added.includes('sqStage'));
    assert.ok(at>=0,'the Squad stage went in');
    const gone=opened.stages.findIndex(b=>b.removed.includes('cmStage'));
    assert.equal(gone,at,`Chamber Men's stage went in the same task as the Squad stage (batches ${JSON.stringify(opened.stages)})`);
    ok('SS4','Chamber Men\'s stage left up under the Squad screen goes in the same task the Squad stage goes in: its 3D goal stops drawing, and no frame shows neither');

    // SS1: a resting mouse anywhere over the screen never moves LOCK.
    const moving=[];let worst=null;
    for(let y=8;y<640;y+=12){
      for(const x of [60,100,140,180,220,260,300]){
        await page.mouse.move(x,y);
        const seen=await page.evaluate(watch);
        if(seen.tops.length>1||seen.names.length>1){moving.push(`${x},${y}: LOCK ${seen.tops.join('/')} card ${seen.names.join('/')}`);worst=worst||[x,y];}
      }
    }
    assert.deepEqual(moving,[],`a resting mouse moved LOCK (the card swaps players every frame) at ${moving.length} points: ${moving.slice(0,4).join(' | ')}`);
    ok('SS1','a mouse resting at any of 371 points over the 360x640 Squad screen leaves LOCK where it is and the card on one player for 12 frames');

    // SS2: LOCK takes a real tap at once, mouse resting where the old code looped worst (or the pitch's middle).
    const [rx,ry]=worst||[180,472];
    await page.mouse.move(rx,ry);await page.waitForTimeout(200);
    const t0=Date.now();
    await page.locator('#sqStage .sqmBtn.is-primary').click({timeout:5000});
    await page.waitForFunction(()=>window.__writes.length>0,null,{timeout:5000});
    const writes=await page.evaluate(()=>window.__writes.map(w=>w.ref));
    assert.deepEqual(writes,[`rivalries/pair_${'cd'.repeat(32)}/squadSheets/season_2_pre_playerTwo`],'one lock, written once');
    ok('SS2',`a real Playwright tap on LOCK lands at once (${Date.now()-t0} ms) with the mouse resting over the pitch, and the lock is written once`);

    // SS3: hover still works for a mouse that moves (a fresh screen: the lock above made this one read only).
    const page2=await context.newPage();
    await page2.route(url=>!String(url).startsWith(base),route=>route.abort());
    await page2.goto(`${base}index.html`,{waitUntil:'load'});
    await page2.waitForFunction(()=>typeof window.loadRuntimeScript==='function',null,{timeout:20000});
    await page2.evaluate(openSquad);
    const spots=await page2.evaluate(()=>{document.querySelector('#sqStage [data-zone="xi"]')?.scrollIntoView({block:'center'});return [...document.querySelectorAll('#sqStage [data-zone="xi"]')].map(n=>{const r=n.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,n.querySelector('.sqmChipName')?.textContent||''];}).filter(s=>s[1]>0&&s[1]<640);});
    assert.ok(spots.length>=2,'two starters on the first view');
    const shown=[];
    for(const [x,y] of spots.slice(-2)){await page2.mouse.move(x,y,{steps:4});await page2.waitForTimeout(100);shown.push(await page2.evaluate(()=>document.querySelector('#sqStage .sqmCardName')?.textContent||''));}
    assert.notEqual(shown[0],shown[1],`the card follows a moving mouse (${shown.join(' -> ')})`);
    ok('SS3',`the card still follows a mouse that moves (${shown.join(' -> ')})`);

    assert.deepEqual(errors,[],'no page errors');
    finished=true;
    console.log(`PASS r91 squad steady contracts: ${checks} checks.`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
