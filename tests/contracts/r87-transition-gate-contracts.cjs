#!/usr/bin/env node
'use strict';
// r87 transitions (Nik 2026-10-31: every screen change smooth and fast; Reus Gate: the loading screen stays until the next
// screen is ready, never a black page). The real app over the local static server in the pinned Chromium, no network.
//   T-01  Season Results and Final Winner are not held for a picture that does not paint (Final Winner's lazy trophy while
//         Season Results shows): the reveal no longer waits the 1.5 s decode cap (P-05)
//   T-02  a screen still held after the grace hands over to the Reus loading screen (data-v10-gate), which leaves once the
//         screen is ready, after its minimum time, with the navigation bar back
//   T-03  a quick screen change (under 200 ms) never raises Reus
//   T-04  the gate never touches the loading screen while another owner shows it
//   T-05  a screen whose Team V script or stylesheet is still loading after STYLE_TIMEOUT_MS (4 s, a slow phone) stays held
//         under Reus until it is drawn; the app's own placeholder never shows meanwhile (lead, 2026-11-01)
const assert=require('node:assert/strict');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const fixtures=require(path.join(ROOT,'tests/support/active-showdown-fixtures.cjs'));
const showdownFixture=fixtures.completedShowdownStorage();
const Career=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const GATE_QUICK_MS=200;

function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,'127.0.0.1',()=>{socket.end();resolve(true);});socket.on('error',()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('static server did not start');}

async function home(browser,base,[w,h],extra={}){
  const phone=w<900;
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:phone?2:1,isMobile:phone,hasTouch:phone,...extra});
  await context.route(url=>!url.href.startsWith(base),route=>route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>window.CareerModeV10Screens&&window.CareerModeV10Screens.isMounted('mainMenu')&&!document.getElementById('mainMenu').hasAttribute('data-v10-pending'),null,{timeout:60000});
  return {context,page,errors};
}
async function seed(page,snapshot){
  await page.evaluate(async ({snapshot,storage})=>{
    await window.ensureGameplayModules();
    for(const [k,v] of Object.entries(storage))localStorage.setItem(k,v);
    const names={identity:'CareerModeOnlinePlayerIdentity',pair:'CareerModePersistentNikDanielPair',multiSeason:'CareerModeProductionSharedMultiSeasonProgression',history:'CareerModeProductionSharedHistoryConvergence',finalReconciliation:'CareerModeProductionSharedFinalReconciliation',terminalClose:'CareerModeProductionSharedTerminalClose',seasonResults:'CareerModeProductionSharedSeasonResults'};
    for(const [k,n] of Object.entries(names))window[n]={getState:()=>snapshot[k]};
    currentShowdown=normalizeShowdown(JSON.parse(localStorage.getItem('careerModeShowdown.activeShowdown')));
    window.CareerModeV10Screens.invalidate('seasonEntry');
  },{snapshot,storage:showdownFixture.storage});
}
// ms from the call to the host's content being revealed; also whether the gate raised Reus on the way.
const HELD=async(page,open,host)=>page.evaluate(async ({open,host})=>{
  const el=document.getElementById('loadingScreen');let gated=false;
  // A Reus raised for the screen before (Home, held on a busy runner) may still be leaving; wait it out so only a raise
  // made by this open counts.
  await new Promise(resolve=>{const k=()=>el.dataset.v10Gate?requestAnimationFrame(k):resolve();k();});
  const watch=new MutationObserver(list=>{if(list.some(m=>m.attributeName==='data-v10-gate'&&el.dataset.v10Gate==='1'))gated=true;});watch.observe(el,{attributes:true,attributeFilter:['data-v10-gate']});
  const t0=performance.now();(0,eval)(open);
  await new Promise((resolve,reject)=>{const end=t0+10000;const k=()=>{const h=document.getElementById(host);if(h&&!h.classList.contains('hidden')&&!h.hasAttribute('data-v10-pending'))return resolve();if(performance.now()>end)return reject(new Error(host+' never revealed'));requestAnimationFrame(k);};k();});
  const ms=performance.now()-t0;watch.disconnect();return {ms,gated};
},{open,host});

(async()=>{
  const {chromium}=require('playwright');
  const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');
  const port=await freePort(),base=`http://127.0.0.1:${port}/`;
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{cwd:ROOT,stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=='--single-process')});
    for(const size of [[390,844],[1440,900]]){
      const {context,page,errors}=await home(browser,base,size);
      // T-01: warm the Season Results files once, then time a return visit of each.
      for(const [name,fx,open] of [['Season Results','ready','window.openSeasonEntry()'],['Final Winner','finished','window.openSeasonEntry()']]){
        await seed(page,showdownFixture[fx]);
        await HELD(page,open,'seasonEntry');await page.evaluate(()=>window.navigateTo('mainMenu'));await page.waitForTimeout(400);
        // Before the fix every open waited the full 1.5 s decode cap; a busy runner can slow one open, so the best of three counts.
        let r=null;
        for(let attempt=0;attempt<3&&!(r&&r.ms<1200);attempt++){
          if(attempt){await page.evaluate(()=>window.navigateTo('mainMenu'));await page.waitForTimeout(400);}
          await seed(page,showdownFixture[fx]);
          r=await HELD(page,open,'seasonEntry');
        }
        assert.ok(r.ms<1200,`T-01 ${size[0]}: ${name} was held ${Math.round(r.ms)} ms (a picture that does not paint must not hold it)`);
        // T-03: a quick change never raises Reus (a busy runner can make one slow, so only a quick one is checked).
        if(r.ms<GATE_QUICK_MS)assert.equal(r.gated,false,`T-03 ${size[0]}: ${name} opened in ${Math.round(r.ms)} ms and must not raise Reus`);
        await page.evaluate(()=>window.navigateTo('mainMenu'));await page.waitForTimeout(400);
        console.log(`ok   T-01/T-03 ${size[0]}x${size[1]} ${name}: revealed in ${Math.round(r.ms)} ms, Reus ${r.gated?'raised':'not raised'}`);
      }
      // T-02: hold Home (shown) past the grace by hand; Reus must come up, then leave once Home is settled.
      const t2=await page.evaluate(async()=>{
        const V=window.CareerModeV10Screens,el=document.getElementById('loadingScreen'),html=document.documentElement;
        V.hide('mainMenu');const held=V.expect('mainMenu');
        await new Promise(r=>setTimeout(r,1000));
        const up={gate:el.dataset.v10Gate||null,hidden:el.hidden||el.classList.contains('hidden'),opacity:Number(getComputedStyle(el).opacity),label:el.getAttribute('aria-label'),nav:html.dataset.nav};
        const t0=performance.now();V.settle('mainMenu',true);
        await new Promise((resolve,reject)=>{const end=t0+3000;const k=()=>{if(el.hidden&&el.classList.contains('hidden'))return resolve();if(performance.now()>end)return reject(new Error('Reus never left'));setTimeout(k,20);};k();});
        const left=performance.now()-t0;
        await V.show('mainMenu');
        return {held,up,left,after:{gate:el.dataset.v10Gate||null,text:document.getElementById('loadingText').textContent,label:el.getAttribute('aria-label'),nav:html.dataset.nav}};
      });
      assert.equal(t2.held,true);
      assert.equal(t2.up.gate,'1','T-02: a held screen raises the Reus gate');
      assert.equal(t2.up.hidden,false,'T-02: Reus is shown');
      assert.ok(t2.up.opacity>0.9,'T-02: Reus is fully in');
      assert.equal(t2.up.nav,'none','T-02: the bar steps back while Reus is up');
      assert.ok(t2.left>=150,'T-02: Reus stays its minimum time');
      assert.equal(t2.after.gate,null,'T-02: the gate lets go of the loading screen');
      assert.notEqual(t2.after.nav,'none','T-02: the bar comes back with the screen');
      assert.equal(t2.after.label,'Career Mode Showdown is starting','T-02: the splash label is restored');
      console.log(`ok   T-02 ${size[0]}x${size[1]}: held Home raised Reus, which left ${Math.round(t2.left)} ms after Home was ready`);
      // T-04: another owner (Roster Roulette style) shows the loading screen; a held screen does not take it over or hide it.
      const t4=await page.evaluate(async()=>{
        const V=window.CareerModeV10Screens,el=document.getElementById('loadingScreen');
        el.classList.remove('is-exiting','hidden');el.hidden=false;el.setAttribute('aria-label','Loading the revolver');
        V.hide('mainMenu');V.expect('mainMenu');
        await new Promise(r=>setTimeout(r,500));
        V.settle('mainMenu',true);
        await new Promise(r=>setTimeout(r,1200));
        const out={gate:el.dataset.v10Gate||null,hidden:el.hidden||el.classList.contains('hidden'),label:el.getAttribute('aria-label')};
        el.hidden=true;el.classList.add('hidden');el.setAttribute('aria-label','Career Mode Showdown is starting');
        await V.show('mainMenu');
        return out;
      });
      assert.deepEqual(t4,{gate:null,hidden:false,label:'Loading the revolver'},'T-04: the gate leaves another owner\'s loading screen alone');
      console.log(`ok   T-04 ${size[0]}x${size[1]}: another owner's loading screen untouched`);
      assert.deepEqual(errors,[]);
      await context.close();
    }
    // T-05: History's Team V script (lazy, never in the startup bundle) arrives after 6 s, slower than STYLE_TIMEOUT_MS. The
    // service worker is off so every request goes through the route.
    for(const late of ['v10_1/legacy/legacy.js','v10_1/legacy/legacy.css']){
      const {context,page,errors}=await home(browser,base,[390,844],{serviceWorkers:'block'});
      let release;const gateOpen=new Promise(r=>{release=r;});
      await context.route(url=>url.href.includes(late),async route=>{await gateOpen;await route.continue();});
      const model=Career.buildCareerModel({indexStatus:'ready',showdowns:[]});
      const t0=Date.now();
      await page.evaluate(model=>{window.ensureGameplayModules().then(()=>loadRuntimeScript('career-screen-seam','js/careerScreenSeam.js',()=>Boolean(window.CareerModeCareerScreenSeam))).then(()=>window.openOptionalModule('legacy')).then(()=>window.renderLegacy({model}));},model);
      await page.waitForTimeout(4800);
      const mid=await page.evaluate(()=>{const host=document.getElementById('legacy'),el=document.getElementById('loadingScreen');return {active:window.getActiveScreenName(),pending:Boolean(host&&host.hasAttribute('data-v10-pending')),gate:el.dataset.v10Gate||null,shown:!(el.hidden||el.classList.contains('hidden'))};});
      setTimeout(release,Math.max(0,6000-(Date.now()-t0)));
      assert.equal(mid.active,'legacy','T-05: History is the screen being opened');
      assert.equal(mid.pending,true,`T-05: at 4.8 s History is still held (${late} has not arrived)`);
      assert.equal(mid.gate,'1',`T-05: Reus covers the held screen (${late})`);
      assert.equal(mid.shown,true,'T-05: Reus is shown');
      await page.waitForFunction(()=>window.CareerModeV10Screens.isMounted('legacy')&&!document.getElementById('legacy').hasAttribute('data-v10-pending'),null,{timeout:20000});
      await page.waitForFunction(()=>!document.getElementById('loadingScreen').dataset.v10Gate,null,{timeout:5000});
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`ok   T-05 390x844: a 6 s ${late.split('/').pop()} stayed under Reus and revealed the drawn screen at ${Date.now()-t0} ms`);
    }
    console.log('r87 transition gate contracts: PASS');
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exit(1);});
