#!/usr/bin/env node
'use strict';
// r88 step panel buttons (2.0.1; found while building Chamber Men). js/screens.js smart back takes every .backButton click in
// the capture phase and stops it, so a step panel's own non-primary buttons (BACK TO SHOWDOWN HOME, CONTINUE WITH X'S SAVED
// SPIN) never ran their handlers: the step's promise hung and the panel could stay. Step buttons now use their own class
// (.compactButton.rrStepBack, the same look as .backButton in css/app.css); real back buttons keep smart back.
//   SB1 the roulette's "Loading the roulette" panel: BACK TO SHOWDOWN HOME ends the step (false) on the real app page
//   SB2 the Prime Pack's "Prime Pack could not load" panel: BACK TO SHOWDOWN HOME ends the step (false)
//   SB3 no step builds a .backButton; the roulette panel styles its own back class; smart back still owns .backButton
const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(ok)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');}
const RID=`pair_${'ab'.repeat(32)}`;
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r88 step panel buttons contracts ended before their last check.');process.exitCode=1;}});

// SB3 (source), run after the two browser checks.
function sourceChecks(){
  // js/chamberMenStep.js joins the list once r88 Chamber Men (PR #1205) is in.
  for(const file of ['js/rosterRouletteStep.js','js/iconGuessStep.js','js/chamberMenStep.js'].filter(f=>fs.existsSync(path.join(ROOT,f)))){
    const source=read(file);
    assert.ok(!/(?:className=|rrsButton\([^)]*,|(?:igs|cms)El\("button",)[^;]*"[^"]*\bbackButton\b/.test(source),`${file} builds no .backButton (smart back would take its clicks)`);
  }
  assert.match(read('js/rosterRouletteStep.js'),/b\.primary\?"menuButton rrStepPrimary":"compactButton rrStepBack"/);
  assert.match(read('js/iconGuessStep.js'),/b\.primary\?"menuButton rrStepPrimary":"compactButton rrStepBack"/);
  assert.match(read('js/iconGuessStep.js'),/back\.className="compactButton rrStepBack";back\.textContent="BACK TO SHOWDOWN HOME"/);
  const css=read('css/v10Roulette.css');
  assert.ok(!/#rrStepPanel[^{]*button\.backButton/.test(css),'the roulette panel no longer styles .backButton');
  assert.match(css,/#rrStepPanel \.rrStepActions > button\.rrStepBack \{/);
  assert.match(read('css/app.css'),/\.backButton,\.compactButton\{min-height:44px;padding:8px 16px;/,'.compactButton keeps the .backButton look');
  assert.match(read('js/screens.js'),/event\.target\.closest\("\.backButton"\)/,'smart back still owns real back buttons');
  ok('SB3','no step builds a .backButton; the step buttons keep the same look under their own class');
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
    const open=async block=>{
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
      const page=await context.newPage();
      if(block)await page.route(block,route=>route.abort());
      await page.goto(`${base}index.html`,{waitUntil:'load'});
      await page.waitForFunction(()=>typeof window.navigateTo==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:20000});
      return {context,page};
    };
    const load=(page,src)=>page.evaluate(src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(src));document.head.append(s);}),src);
    // A real tap on the panel's BACK TO SHOWDOWN HOME; the step must answer within 3 s.
    const tapBack=async(page,panel)=>{
      const button=page.locator(`#${panel} button`,{hasText:'BACK TO SHOWDOWN HOME'});
      await button.waitFor({state:'visible',timeout:20000});
      await button.click({timeout:5000});
      return page.evaluate(()=>Promise.race([window.__stepRun,new Promise(resolve=>setTimeout(()=>resolve('HUNG'),3000))]));
    };

    // SB1 roulette: its engine data cannot load, so the "Loading the roulette" panel shows TRY AGAIN and BACK.
    {
      const {context,page}=await open('**/data/fifa17Players.js');
      try{
        await load(page,'js/rosterRouletteStep.js');
        await page.evaluate(rid=>{
          const step=window.CareerModeRosterRouletteStep;
          window.__stepRun=step.runBeforeTransfers({rivalryId:rid,managerRole:'playerTwo',season:1,clubs:{playerOne:'Arsenal',playerTwo:'Chelsea'},confirmedAtMs:Date.now(),phase:'NOT_STARTED',marks:null,windowStarted:false,remember(){},refreshMarks:async()=>null,verdicts:async()=>null,primePackNext:()=>false,passed:false,chamberMen:null});
        },RID);
        const result=await tapBack(page,'rrStepPanel');
        assert.equal(result,false,'the roulette step ends (false) when BACK TO SHOWDOWN HOME is tapped');
        ok('SB1','the roulette panel\'s BACK TO SHOWDOWN HOME ends the step');
      }finally{await context.close();}
    }

    // SB2 Prime Pack: the arrival write fails, so the "Prime Pack could not load" panel shows TRY AGAIN and BACK.
    {
      const {context,page}=await open(null);
      try{
        // The caller (the Transfer War) has the rules file loaded before it asks whether the step applies.
        await load(page,'js/iconGuess.js');await load(page,'js/iconGuessStep.js');
        await page.evaluate(rid=>{
          const fail=()=>Promise.reject(Object.assign(new Error('offline'),{code:'unavailable'}));
          const sdk={doc:()=>({}),serverTimestamp:()=>null,runTransaction:fail,onSnapshot:(ref,opts,next,error)=>{setTimeout(()=>error&&error(Object.assign(new Error('offline'),{code:'unavailable'})),0);return()=>{};}};
          const io={firestore:{},sdk,rivalryId:rid,sessionId:'s',deviceId:'d',now:()=>Date.now()};
          window.__stepRun=window.CareerModeIconGuessStep.run({rivalryId:rid,managerRole:'playerTwo',season:1,confirmedAtMs:Date.now()},io);
        },RID);
        const result=await tapBack(page,'igStepPanel');
        assert.equal(result,false,'the Prime Pack step ends (false) when BACK TO SHOWDOWN HOME is tapped');
        ok('SB2','the Prime Pack panel\'s BACK TO SHOWDOWN HOME ends the step');
      }finally{await context.close();}
    }
    sourceChecks();
    finished=true;
    console.log(`PASS r88 step panel buttons browser contracts: ${checks} checks.`);
  }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
