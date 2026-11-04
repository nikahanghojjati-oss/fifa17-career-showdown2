#!/usr/bin/env node
'use strict';
// r88 CONTINUE CAREER (2.1.0): a manager who leaves a season step must reach Showdown Home, where the yellow CONTINUE CAREER
// tile brings him back, and nothing may cover a button on the way. The real steps on the real app page:
//   CC1 (A) Chamber Men: BACK TO SHOWDOWN HOME ends the step (false) and opens Showdown Home (mainMenu). Before, it only closed
//       the stage, leaving season 1 on Club Assignment with HOME locked.
//   CC2 (C) Prime Pack mid-round: BACK TO SHOWDOWN HOME shows (it was hidden once both managers had arrived, so the only exit
//       was a reload), it is what a tap at its centre hits, it covers no control of the Prime Pack page, and it ends the step
//       and opens Showdown Home. Its class stays rrStepBack (the app's smart-back delegation leaves .backButton clicks alone
//       only for the app's own buttons: PR #1206).
//   CC3 (B) Club Assignment, packs revealed: CONTINUE TO CAREER START and BACK are both wholly on screen, neither covers the
//       other, and each is what a tap at its centre and near its ends hits, at 360x640, 393x852, 1280x800, 1366x768 and
//       1920x1080; no sideways scroll.
//   CC4 (E) the disabled CONTINUE CAREER subtitle names the Home tile that starts (Daniel) or joins (Nik) a Showdown
//       ("No Showdown live · START A SHOWDOWN"), never "tap to start" on a tile that cannot be tapped. Kept short: the
//       startup gzip budget (tests/contracts/v10-club-contracts.cjs) has 0 bytes to spare.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(ok)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');}
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r88 continue-career contracts ended before their last check.');process.exitCode=1;}});

// ---------- in the page ----------
async function chamberBack(){
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.head.append(s);});
  await load('js/chamberMen.js');await load('js/chamberMenStep.js');
  const step=window.CareerModeChamberMenStep,CM=window.CareerModeChamberMen;
  try{localStorage.clear();}catch(_error){}
  if(!await step.ensure())throw new Error('step did not load');
  const navigated=[];window.navigateTo=screen=>{navigated.push(screen);};
  const rid=`pair_${'ab'.repeat(32)}`;
  const doc={schemaVersion:1,objectType:'sharedChamberMenRound',rivalryId:rid,seasonNumber:1,kicks:{playerOne:'LRMMRL',playerTwo:'RLLMRR'},revision:3};
  const sdk={doc:()=>({}),serverTimestamp:()=>'ts',runTransaction:async(_f,fn)=>fn({get:async()=>({exists:()=>true,data:()=>doc}),set(){},update(){}}),
    onSnapshot:(_r,_o,cb)=>{setTimeout(()=>cb({metadata:{},exists:()=>true,data:()=>doc}),50);return ()=>{};}};
  const run=step.run({rivalryId:rid,managerRole:'playerOne',season:1,confirmedAtMs:CM.fromMs},{firestore:{},sdk,rivalryId:rid,sessionId:'s',deviceId:'d',now:()=>Date.now()});
  const back=await new Promise((resolve,reject)=>{const t0=Date.now();const tick=()=>{const s=document.getElementById('cmStage');const b=s&&[...s.querySelectorAll('button')].find(x=>x.textContent.trim()==='BACK TO SHOWDOWN HOME'&&x.getClientRects().length);if(b&&s.style.visibility!=='hidden')return resolve(b);if(Date.now()-t0>8000)return reject(new Error('Chamber Men BACK did not show'));setTimeout(tick,50);};tick();});
  back.click();
  const go=await Promise.race([run,new Promise(r=>setTimeout(()=>r('timeout'),5000))]);
  return {go,wentHome:step.wentHome(),navigated,stage:Boolean(document.getElementById('cmStage'))};
}
async function primeBack(){
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.head.append(s);});
  await load('js/iconGuessStep.js');
  const step=window.CareerModeIconGuessStep;
  try{localStorage.clear();}catch(_error){}
  if(!await step.ensure())throw new Error('Prime Pack did not load');
  const navigated=[];window.navigateTo=screen=>{navigated.push(screen);};
  const rid=`pair_${'cd'.repeat(32)}`,at=Date.now()-1500,ts=ms=>({toMillis:()=>ms});
  const data={schemaVersion:1,objectType:'sharedPrimePackRound',rivalryId:rid,seasonNumber:2,arrived:{playerOne:ts(at),playerTwo:ts(at)},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:2,updatedAt:ts(at)};
  const sdk={doc:()=>({}),serverTimestamp:()=>ts(Date.now()),runTransaction:async(_f,fn)=>fn({get:async()=>({exists:()=>true,data:()=>data}),set(){},update(){}}),
    onSnapshot:(_r,_o,cb)=>{setTimeout(()=>cb({metadata:{},exists:()=>true,data:()=>data}),50);return ()=>{};}};
  const run=step.run({rivalryId:rid,managerRole:'playerTwo',season:2,confirmedAtMs:window.CareerModeIconGuess.fromMs},{firestore:{},sdk,rivalryId:rid,sessionId:'s',deviceId:'d',now:()=>Date.now()});
  const frame=await new Promise((resolve,reject)=>{const t0=Date.now();const tick=()=>{const f=document.querySelector('#igStage iframe');let st=null;try{st=f&&f.contentWindow.__ig&&f.contentWindow.__ig.state();}catch(_e){}if(st&&st.stage)return resolve(f);if(Date.now()-t0>15000)return reject(new Error('Prime Pack round did not start'));setTimeout(tick,100);};tick();});
  await new Promise(r=>setTimeout(r,600));
  const back=[...document.querySelectorAll('#igStage > button')].find(b=>b.textContent==='BACK TO SHOWDOWN HOME');
  const r=back.getBoundingClientRect(),hitEl=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  const fr=frame.getBoundingClientRect();
  const controls=[...frame.contentDocument.querySelectorAll('button,input,a,[role=button]')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).map(e=>{const q=e.getBoundingClientRect();return {id:e.id||e.tagName,left:q.left+fr.left,top:q.top+fr.top,right:q.right+fr.left,bottom:q.bottom+fr.top};}).filter(q=>q.right>q.left&&q.bottom>q.top);
  const out={hidden:back.hidden,className:back.className,onScreen:r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth&&r.width>0,hit:Boolean(hitEl&&back.contains(hitEl)),
    covers:controls.filter(c=>c.left<r.right&&r.left<c.right&&c.top<r.bottom&&r.top<c.bottom).map(c=>c.id),controls:controls.length,stage:frame.contentWindow.__ig.state().stage};
  back.click();
  out.go=await Promise.race([run,new Promise(res=>setTimeout(()=>res('timeout'),5000))]);
  out.wentHome=step.wentHome();out.navigated=navigated;out.stageLeft=Boolean(document.getElementById('igStage'));
  return out;
}
async function clubButtons(){
  window.setApplicationReducedMotionPreference?.(true);
  await window.ensureGameplayModules();await window.CareerModeClubScreenV10.install();
  currentShowdown={id:'cc-b',name:'Daniel vs Nik',managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:{id:'ligue_1',name:'Ligue 1'},clubs:{playerOne:null,playerTwo:null},totalRounds:3,currentRound:1,status:'League Confirmed',rounds:[],transferChallenges:[]};
  initializeClubAssignment();showScreen('clubWheelScreen');populateClubAssignmentBase();renderReadyAssignmentState();
  currentShowdown.clubs={playerOne:'Lille',playerTwo:'Toulouse'};renderClubConfirmationState();
  const t0=Date.now();while(!(window.CareerModeClubScreenV10.isMounted()&&!document.getElementById('clubWheelScreen').hasAttribute('data-v10-pending'))){if(Date.now()-t0>20000)throw new Error('club screen did not mount');await new Promise(r=>setTimeout(r,100));}
  await new Promise(r=>setTimeout(r,1200));
  // The Shared Career Start state after both reveals: OPEN CLUB PACKS gone, CONTINUE TO CAREER START and BACK shown.
  const open=document.getElementById('openClubPack'),cont=document.getElementById('continueClubAssignment'),back=document.getElementById('clubAssignmentBack');
  open.classList.add('hidden');open.disabled=true;cont.classList.remove('hidden');cont.disabled=false;cont.textContent='CONTINUE TO CAREER START';back.classList.remove('hidden');back.disabled=false;
  await new Promise(r=>setTimeout(r,600));
  const measure=el=>{el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();
    const pts=[[.06,.5],[.5,.5],[.94,.5]].map(([fx,fy])=>{const at=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);return Boolean(at&&el.contains(at));});
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,onScreen:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.width>0,hits:pts,clipped:el.scrollWidth>el.clientWidth+1};};
  return {cont:measure(cont),back:measure(back),hscroll:document.scrollingElement.scrollWidth>innerWidth};
}

(async()=>{
  // CC4 needs no browser.
  const menu=read('js/menuExperience.js'),fn=menu.slice(menu.indexOf('function noLiveShowdownMeta'),menu.indexOf('function getSavedShowdownMenuMeta'));
  assert.ok(fn.length>0,'noLiveShowdownMeta is there');
  assert.ok(!/tap to (start|join)/i.test(fn),'the disabled tile never says "tap to start" or "tap to join"');
  assert.match(fn,/"No Showdown live" \+ \(id === "daniel" \? " · START A SHOWDOWN" : id === "nik" \? " · JOIN DANIEL'S SHOWDOWN"/);
  assert.match(read('index.html'),/<span class="menuTileLabel">START A SHOWDOWN<\/span>/,'Daniel\'s START tile is called START A SHOWDOWN');
  assert.match(read('js/onlinePlayerIdentity.js'),/\["JOIN","JOIN DANIEL'S SHOWDOWN","Paste Daniel's code"\]/,'Nik\'s JOIN tile is called JOIN DANIEL\'S SHOWDOWN');
  ok('CC4','the disabled CONTINUE CAREER subtitle names START A SHOWDOWN (Daniel) and JOIN DANIEL\'S SHOWDOWN (Nik)');

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
    const open=async([width,height])=>{
      const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<900,isMobile:width<900});
      const page=await context.newPage();
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.goto(`${base}index.html`,{waitUntil:'load'});
      await page.waitForFunction(()=>typeof window.loadRuntimeScript==='function'&&typeof window.ensureGameplayModules==='function',null,{timeout:30000});
      await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:30000}).catch(()=>{});
      await page.evaluate(()=>document.getElementById('onlinePlayerIdentityOverlay')?.remove());
      return {context,page};
    };

    {const {context,page}=await open([1366,768]);const m=await page.evaluate(chamberBack);await context.close();
      assert.equal(m.go,false,'Chamber Men BACK ends the step (false)');
      assert.equal(m.wentHome,true,'it is a choice, not a fault');
      assert.deepEqual(m.navigated,['mainMenu'],'Chamber Men BACK TO SHOWDOWN HOME opens Showdown Home');
      assert.equal(m.stage,false,'the stage is gone');
      ok('CC1','Chamber Men BACK TO SHOWDOWN HOME opens Showdown Home');}

    for(const size of [[1366,768],[393,852],[360,640]]){
      const {context,page}=await open(size);const m=await page.evaluate(primeBack);await context.close();const at=size.join('x');
      assert.ok(m.stage>=1,`${at}: the round is running (stage ${m.stage})`);
      assert.equal(m.hidden,false,`${at}: Prime Pack BACK TO SHOWDOWN HOME shows during the round`);
      assert.equal(m.className,'compactButton rrStepBack',`${at}: the step's own button (no .backButton, PR #1206)`);
      assert.ok(m.onScreen&&m.hit,`${at}: BACK is on screen and a tap at its centre hits it`);
      assert.ok(m.controls>0,`${at}: the Prime Pack page's controls were measured`);
      assert.deepEqual(m.covers,[],`${at}: BACK covers no control of the Prime Pack page`);
      assert.equal(m.go,false,`${at}: BACK ends the step (false)`);
      assert.equal(m.wentHome,true,`${at}: it is a choice, not a fault`);
      assert.deepEqual(m.navigated,['mainMenu'],`${at}: Prime Pack BACK TO SHOWDOWN HOME opens Showdown Home`);
      assert.equal(m.stageLeft,false,`${at}: the stage is gone`);
    }
    ok('CC2','Prime Pack BACK TO SHOWDOWN HOME shows mid-round, covers nothing, and opens Showdown Home (1366x768, 393x852, 360x640)');

    const rows=[];
    for(const size of [[360,640],[393,852],[1280,800],[1366,768],[1920,1080]]){
      const {context,page}=await open(size);const m=await page.evaluate(clubButtons);await context.close();const at=size.join('x');
      const overlap=m.cont.left<m.back.right&&m.back.left<m.cont.right&&m.cont.top<m.back.bottom&&m.back.top<m.cont.bottom;
      assert.equal(overlap,false,`${at}: BACK does not cover CONTINUE TO CAREER START (${JSON.stringify(m)})`);
      for(const k of ['cont','back']){
        assert.ok(m[k].onScreen,`${at}: ${k} is wholly on screen`);
        assert.deepEqual(m[k].hits,[true,true,true],`${at}: a tap anywhere along ${k} hits it`);
        assert.equal(m[k].clipped,false,`${at}: ${k} text is not cut`);
      }
      assert.equal(m.hscroll,false,`${at}: no sideways scroll`);
      rows.push(`${at} (CONTINUE ${Math.round(m.cont.left)}-${Math.round(m.cont.right)}, BACK ${Math.round(m.back.left)}-${Math.round(m.back.right)})`);
    }
    ok('CC3',`Club Assignment: CONTINUE TO CAREER START and BACK both whole and tappable at ${rows.join(', ')}`);
    finished=true;
    console.log(`PASS r88 continue-career contracts: ${checks} checks.`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
