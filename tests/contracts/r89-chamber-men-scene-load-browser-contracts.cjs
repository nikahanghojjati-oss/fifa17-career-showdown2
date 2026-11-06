#!/usr/bin/env node
'use strict';
// r89 Codex C2 (#1244 at 07629515): the 3D scene loads under the loading screen; two ways that load could hurt a kick.
// The real step (js/chamberMenStep.js) on the real app page, fed an in-memory record, with a stand-in 3D scene whose mount
// is held back (as on a slow phone or throttled network):
//   SL1 the rival has locked in, so the 10 s pick clock runs while the scene is still loading (mount held 8 s): the stage
//       shows at once with the SVG goal and the full shared clock (never "0:05" on first paint); the late scene is thrown
//       away (disposed, never mounted over the SVG);
//   SL2 this manager has locked in, the rival locks in while the scene loads (mount held 2.5 s), so the kick is revealed on
//       the SVG first: when the scene mounts it takes that kick's lineup (the shooter's club takes it, the rival's keeps)
//       and that kick's shot, dive and result at its end pose (animate false), matching the words on screen.
const assert=require('node:assert/strict');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(ok)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');}
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r89 Chamber Men scene-load contracts ended before their last check.');process.exitCode=1;}});

// Runs in the page.
async function run({mode}){
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.head.append(s);});
  // The stand-in scene: mount resolves after `hold` ms and records what the step asks of it.
  const hold=mode==='clock'?8000:2500,calls={lineups:[],kicks:[],resets:0,disposed:false,mountedAt:null};
  window.__calls=calls;
  window.CareerModeChamberMen3d={mount:(svg)=>new Promise(resolve=>setTimeout(()=>{calls.mountedAt=performance.now();resolve({mode:'broadcast',runUpMs:2150,
    reset(){calls.resets+=1;},lineup(k){calls.lineups.push(k);},kick(k){calls.kicks.push(k);},dispose(){calls.disposed=true;}});},hold))};
  await load('js/chamberMen.js');await load('js/chamberMenStep.js');
  const step=window.CareerModeChamberMenStep,CM=window.CareerModeChamberMen;
  try{localStorage.clear();}catch(_error){}
  if(!await step.ensure())throw new Error('step did not load');
  const rid=`pair_${'ab'.repeat(32)}`,clubs={playerOne:'Barcelona',playerTwo:'Chelsea'};
  // clock: kick 7, Daniel (playerOne) shoots and Nik has locked in his dive just now, so the clock runs.
  // reveal: kick 8, Daniel has locked in his dive, Nik (the shooter) locks in 1.2 s after the screen opens.
  const kicks=mode==='clock'?{playerOne:'LRMMRL',playerTwo:'RLLMRRM'}:{playerOne:'LRMMRLML',playerTwo:'RLLMRRM'};
  let doc={schemaVersion:2,objectType:'sharedChamberMenRound',rivalryId:rid,seasonNumber:2,kicks,revision:13,updatedAt:{seconds:Date.now()/1000,nanoseconds:0}};
  let push=null;
  const sdk={doc:()=>({}),serverTimestamp:()=>'ts',
    runTransaction:async(_f,fn)=>fn({get:async()=>({exists:()=>true,data:()=>doc}),set(){},update(){}}),
    onSnapshot:(_r,_o,cb)=>{push=d=>cb({metadata:{},exists:()=>true,data:()=>d});setTimeout(()=>push(doc),50);return ()=>{};}};
  const t0=performance.now();
  void step.run({rivalryId:rid,managerRole:'playerOne',season:2,confirmedAtMs:CM.fromMs,clubs},{firestore:{},sdk,rivalryId:rid,sessionId:'s',deviceId:'d',now:()=>Date.now()});
  if(mode==='reveal')setTimeout(()=>{doc={...doc,kicks:{playerOne:'LRMMRLML',playerTwo:'RLLMRRMR'},revision:14,updatedAt:{seconds:Date.now()/1000,nanoseconds:0}};push(doc);},1200);
  const stage=await new Promise((resolve,reject)=>{const tick=()=>{const s=document.getElementById('cmStage');if(s&&s.style.visibility==='visible')return resolve(s);if(performance.now()-t0>15000)return reject(new Error('stage never showed'));setTimeout(tick,25);};tick();});
  const out={shownAfter:Math.round(performance.now()-t0),firstClock:stage.querySelector('.cmClock').textContent,svg3d:stage.querySelector('svg')?.classList.contains('cm3d-on')||false};
  await new Promise(r=>setTimeout(r,mode==='clock'?8600-(performance.now()-t0):Math.max(0,3200-(performance.now()-t0))));
  out.calls=JSON.parse(JSON.stringify(calls));out.mountedAfter=calls.mountedAt?Math.round(calls.mountedAt-t0):null;
  out.status=stage.querySelector('.cmStatus').textContent;
  const record={playerOne:'LRMMRLML',playerTwo:'RLLMRRMR'},k8=(CM.kicksOf(CM.record(record))||[])[7];
  out.expect=k8?{taker:clubs[k8.shooter],keeper:clubs[k8.keeper],shot:k8.shotSide===CM.timeout?null:k8.shotSide,dive:CM.dive(k8.dive),goal:Boolean(k8.goal),round:k8.kick}:null;
  return out;
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
    const go=async mode=>{
      const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'});
      const page=await context.newPage();
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.goto(`${base}index.html`,{waitUntil:'load'});
      await page.waitForFunction(()=>typeof window.loadRuntimeScript==='function',null,{timeout:20000});
      const out=await page.evaluate(run,{mode});
      await context.close();
      return out;
    };
    const a=await go('clock');
    assert.ok(a.shownAfter<2000,`the stage shows at once while the scene loads (${a.shownAfter} ms)`);
    assert.match(a.firstClock,/^0:(09|10)$/,`the first paint shows the full shared clock, not what is left after the load (${a.firstClock})`);
    assert.equal(a.svg3d,false,'the SVG goal plays');
    assert.equal(a.calls.disposed,true,'the late scene is thrown away');
    assert.deepEqual([a.calls.lineups.length,a.calls.kicks.length],[0,0],'and never driven');
    ok('SL1',`a running pick clock never waits on the scene: stage after ${a.shownAfter} ms with ${a.firstClock}, late scene disposed`);
    const b=await go('reveal');
    assert.ok(b.expect,'kick 8 is complete in the record');
    assert.equal(b.calls.disposed,false,'the scene mounts');
    assert.ok(b.mountedAfter>1200,'it mounts after the kick was revealed on the SVG');
    const lastLineup=b.calls.lineups[b.calls.lineups.length-1],lastKick=b.calls.kicks[b.calls.kicks.length-1];
    assert.deepEqual(lastLineup&&{taker:lastLineup.taker,keeper:lastLineup.keeper},{taker:b.expect.taker,keeper:b.expect.keeper},'the shooter\'s club takes it, the rival\'s keeps');
    assert.deepEqual(lastKick,{shot:b.expect.shot,dive:b.expect.dive,goal:b.expect.goal,round:b.expect.round,animate:false},'the revealed kick at its end pose');
    assert.ok(b.status.includes(b.expect.goal?'Goal':'Saved'),`the words say the same (${b.status})`);
    ok('SL2',`a scene that mounts mid-reveal shows the recorded kick: ${b.expect.taker} takes, ${b.expect.keeper} keeps, shot ${b.expect.shot}, dive ${b.expect.dive}, ${b.expect.goal?'goal':'saved'}`);
    finished=true;
    console.log(`PASS r89 Chamber Men scene-load browser contracts (${checks} checks)`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
