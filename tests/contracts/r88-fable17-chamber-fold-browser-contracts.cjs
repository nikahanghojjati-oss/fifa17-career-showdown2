#!/usr/bin/env node
'use strict';
// r88 Fable F17-07: the Chamber Men 10-second clock and LOCK IN were below the fold on a laptop (clock top 812 px at 1280x800
// and 1366x768). The real step (js/chamberMenStep.js, css/chamberMen.css) on the real app page, fed an in-memory record at
// round 4 (the clock running), at 1366x768, 1280x800 and 393x852:
//   FD1 the clock and LOCK IN are wholly on screen on the first view (no scrolling), and each is the element a tap there hits
//       (nothing over it, no scrim);
//   FD2 neither covers the score board (faces of the cylinders) or the goal art; no sideways scroll; the stage is the only box
//       that may scroll;
//   FD3 a lock-in that fails keeps "The pick did not go through" on screen past several 200 ms ticks (F17-02).
//   FD4 turn by turn (Nik 2026-11-03): mounted at kick 7 (Daniel shoots, Nik has locked in his dive) Daniel sees YOU SHOOT,
//       Nik's name and only the "Pick your shot" row; mounted at kick 8 (Nik shoots, Nik has locked in) Daniel sees YOU KEEP
//       and only "Pick your dive"; both with the clock and LOCK IN on the first view (FD1/FD2 hold for both).
//   FD5 the 10 s clock runs out with nothing picked: the phone sends its own "-" once (a shot misses, a dive stays middle).
const assert=require('node:assert/strict');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(ok)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');}
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r88 Fable 17 Chamber Men fold contracts ended before their last check.');process.exitCode=1;}});
const SIZES=[[1366,768],[1280,800],[393,852]];

// Runs in the page: mounts the step mid-shootout (round 4, the rival locked in, so the clock runs) and measures it.
async function mount({fail,keeper,timeout}){
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.head.append(s);});
  await load('js/chamberMen.js');await load('js/chamberMenStep.js');
  const step=window.CareerModeChamberMenStep,CM=window.CareerModeChamberMen;
  try{localStorage.clear();}catch(_error){}
  if(!await step.ensure())throw new Error('step did not load');
  const rid=`pair_${'ab'.repeat(32)}`;
  const doc={schemaVersion:2,objectType:'sharedChamberMenRound',rivalryId:rid,seasonNumber:2,kicks:keeper?{playerOne:'LRMMRLM',playerTwo:'RLLMRRML'}:{playerOne:'LRMMRL',playerTwo:'RLLMRRM'},revision:13};
  const sdk={doc:()=>({}),serverTimestamp:()=>'ts',
    runTransaction:async(_f,fn)=>window.__failSend?Promise.reject(Object.assign(new Error('offline'),{code:'unavailable'})):fn({get:async()=>({exists:()=>true,data:()=>doc}),set(){},update(_r,d){(window.__writes=window.__writes||[]).push(d);}}),
    onSnapshot:(_r,_o,cb)=>{setTimeout(()=>cb({metadata:{},exists:()=>true,data:()=>doc}),50);return ()=>{};}};
  void step.run({rivalryId:rid,managerRole:'playerOne',season:2,confirmedAtMs:CM.fromMs},{firestore:{},sdk,rivalryId:rid,sessionId:'s',deviceId:'d',now:()=>Date.now()});
  const stage=await new Promise((resolve,reject)=>{const t0=Date.now();const tick=()=>{const s=document.getElementById('cmStage');if(s&&s.style.visibility!=='hidden'&&s.querySelector('.cmClock').textContent)return resolve(s);if(Date.now()-t0>8000)return reject(new Error('stage did not show'));setTimeout(tick,50);};tick();});
  const rect=sel=>{const r=stage.querySelector(sel).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
  const hit=sel=>{const el=stage.querySelector(sel),r=el.getBoundingClientRect(),at=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return Boolean(at&&(at===el||el.contains(at)));};
  const scrollers=[...document.querySelectorAll('*')].filter(el=>{const cs=getComputedStyle(el);return el.id!=='cmStage'&&/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)&&el.getClientRects().length&&stage.contains(el);}).map(el=>el.className||el.tagName);
  const out={vw:innerWidth,vh:innerHeight,stageTop:stage.scrollTop,clock:rect('.cmClock'),lock:rect('.cmLock'),board:rect('.cmBoard'),goal:rect('.cmGoal'),clockHit:hit('.cmClock'),lockHit:hit('.cmLock'),
    hscroll:document.documentElement.scrollWidth>innerWidth||stage.scrollWidth>stage.clientWidth,scrollers,clockText:stage.querySelector('.cmClock').textContent,
    keeper,turn:stage.querySelector('.cmTurnHead').textContent,sub:stage.querySelector('.cmTurnSub').textContent,count:stage.querySelector('.cmRound').textContent,rows:[...stage.querySelectorAll('.cmRow')].filter(r=>r.getClientRects().length).map(r=>r.querySelector('.cmRowLabel').textContent),turnBox:rect('.cmTurn')};
  if(fail){
    window.__failSend=true;
    stage.querySelector('.cmChoice[data-kind="shot"]').click();stage.querySelector('.cmLock').click();
    await new Promise(r=>setTimeout(r,900));
    out.failStatus=stage.querySelector('.cmStatus').textContent;
  }
  if(timeout){
    // Nothing picked: the clock runs out and this phone sends its own "-" (a shot misses, a dive stays in the middle).
    await new Promise(r=>setTimeout(r,11500));
    out.timeoutWrites=(window.__writes||[]).map(d=>d['kicks.playerOne']);
  }
  return out;
}
const inside=(r,vw,vh)=>r.top>=0&&r.left>=0&&r.bottom<=vh&&r.right<=vw&&r.bottom>r.top;
const overlaps=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;

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
    const results=[];
    for(const [width,height] of SIZES){
      const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<900,isMobile:width<900});
      const page=await context.newPage();
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.goto(`${base}index.html`,{waitUntil:'load'});
      await page.waitForFunction(()=>typeof window.loadRuntimeScript==='function',null,{timeout:20000});
      results.push({size:`${width}x${height}`,...await page.evaluate(mount,{fail:width===1280,keeper:false,timeout:width===393})});
      await context.close();
      const context2=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<900,isMobile:width<900});
      const page2=await context2.newPage();
      await page2.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page2.goto(`${base}index.html`,{waitUntil:'load'});
      await page2.waitForFunction(()=>typeof window.loadRuntimeScript==='function',null,{timeout:20000});
      results.push({size:`${width}x${height} keeper`,...await page2.evaluate(mount,{fail:false,keeper:true,timeout:width===1366})});
      await context2.close();
    }
    for(const m of results){
      assert.match(m.clockText,/^0:\d\d$/,`${m.size}: the clock runs`);
      assert.equal(m.stageTop,0,`${m.size}: first view, not scrolled`);
      assert.ok(inside(m.clock,m.vw,m.vh),`${m.size}: the clock is on screen (${JSON.stringify(m.clock)})`);
      assert.ok(inside(m.lock,m.vw,m.vh),`${m.size}: LOCK IN is on screen (${JSON.stringify(m.lock)})`);
      assert.ok(m.clockHit&&m.lockHit,`${m.size}: nothing lies over the clock or LOCK IN`);
    }
    ok('FD1',`the clock and LOCK IN show on the first view at ${results.map(m=>`${m.size} (clock ${Math.round(m.clock.top)}, LOCK IN ${Math.round(m.lock.bottom)})`).join(', ')}`);
    for(const m of results){
      for(const part of ['clock','lock','turnBox'])for(const art of ['board','goal'])assert.ok(!overlaps(m[part],m[art]),`${m.size}: ${part} does not cover the ${art}`);
      assert.equal(m.hscroll,false,`${m.size}: no sideways scroll`);
      assert.deepEqual(m.scrollers,[],`${m.size}: nothing inside the stage scrolls on its own`);
    }
    ok('FD2','neither covers the score board or the goal; no sideways scroll; only the stage scrolls');
    const failed=results.find(m=>m.failStatus!==undefined);
    assert.equal(failed.failStatus,'The pick did not go through. Tap LOCK IN again.');
    ok('FD3','a failed lock-in keeps its notice on screen past the next ticks');
    for(const m of results){
      if(m.keeper){assert.equal(m.turn,'YOU KEEP',m.size);assert.equal(m.sub,'Nik shoots at you');assert.deepEqual(m.rows,['Pick your dive'],`${m.size}: only the dive row`);assert.equal(m.count,'Round 4 of 7 · Nik shoots');}
      else{assert.equal(m.turn,'YOU SHOOT',m.size);assert.equal(m.sub,'Nik is in goal');assert.deepEqual(m.rows,['Pick your shot'],`${m.size}: only the shot row`);assert.equal(m.count,'Round 4 of 7 · Daniel shoots');}
    }
    const shotOut=results.find(m=>m.size==='393x852'),diveOut=results.find(m=>m.size==='1366x768 keeper');
    assert.deepEqual(shotOut.timeoutWrites,['LRMMRL-'],'a shot out of time is sent as "-" (a miss), once');
    assert.deepEqual(diveOut.timeoutWrites,['LRMMRLM-'],'a dive out of time is sent as "-" (stays in the middle), once');
    ok('FD5','out of time with nothing picked, this phone sends its own "-" for the kick, once (shot = miss, dive = middle)');
    ok('FD4','turn by turn: YOU SHOOT with only the shot row, YOU KEEP with only the dive row, the kick named, at every size');
    finished=true;
    console.log(`PASS r88 Fable 17 Chamber Men fold contracts: ${checks} checks.`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
