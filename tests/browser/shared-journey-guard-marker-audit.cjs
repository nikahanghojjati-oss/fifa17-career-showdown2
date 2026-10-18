const assert=require('node:assert/strict');
const {answerNextMarbleConfirm}=require("./support/marble-confirm.cjs");
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=process.env.CMS_BASE_URL||'http://127.0.0.1:4173/';
const saveKey='careerModeShowdown.saveLibrary';

async function prepareShared(page){
  await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
  await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyEntry,null,{timeout:15000});
  // Provider-neutral pre-pair setup: real entry and local storage, no Firebase account.
  await page.evaluate(()=>{
    const state={status:'unpaired',initialized:true,busy:false,rivalryId:null,connectionState:null};
    window.__markerAuditCodes=0;
    window.CareerModePersistentNikDanielPair={initialize:async()=>state,getState:()=>state,render:()=>null,startPairing:async()=>{window.__markerAuditCodes+=1;return state;}};
    window.CareerModeOnlinePlayerIdentity={
      getState:()=>({status:'ready',initialized:true,online:true,accountId:'account_marker_audit',managerId:'daniel',managerLabel:'Daniel',deviceId:'device_marker_audit',registered:true}),
      syncPair:async()=>state,openGate:()=>false
    };
    window.CareerModeProductionFirebaseRuntime={};
    window.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:false})};
  });
  // r79: Daniel's Home START goes straight to the seasons screen (no Connect Players hop).
  await page.locator('#newShowdown').click();
  await page.locator('#createShowdown').waitFor({state:'visible'});
  await page.locator('#roundAmount').selectOption('3');
  await page.locator('#startShowdown').click();
  await page.waitForFunction(key=>{
    const library=JSON.parse(localStorage.getItem(key)||'null');
    return library?.saves.find(entry=>entry.saveId===library.activeSaveId)?.showdown.sharedJourney?.setupPending===true;
  },saveKey,{timeout:15000});
  // r79: START opens WAITING (Connect Players over the locked league wheel) and makes the code once; no GET READY.
  await page.locator('#connectPlayersScreen').waitFor({state:'visible'});
  await page.waitForFunction(()=>window.__markerAuditCodes===1,null,{timeout:15000});
  await page.evaluate(()=>CareerModeConnectPlayersScreenV10.close({restoreFocus:false}));
}

async function savedDraw(page){
  return page.evaluate(key=>{
    const library=JSON.parse(localStorage.getItem(key));
    const showdown=library.saves.find(entry=>entry.saveId===library.activeSaveId)?.showdown;
    return {pending:showdown?.sharedJourney?.setupPending===true,league:showdown?.selectedLeague,clubs:showdown?.clubs};
  },saveKey);
}

(async()=>{
  process.env.CMS_CHROMIUM_MULTI_CONTEXT='1';
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({headless:true,...runtime});
  const failures=[];
  try{
    for(const [name,audit] of [
      ['same-tab deletion then local SPIN LEAGUE',async page=>{
        await prepareShared(page);
        await page.evaluate(()=>showScreen('mainMenu',false));
        await page.locator('#settingsButton').click();
        await page.locator('#settingsOverlay').waitFor({state:'visible'});
        await answerNextMarbleConfirm(page);
        await page.locator('.settingsDeleteCurrentShowdown').click();
        await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).activeSaveId===null,saveKey);
        await page.locator('#settingsOverlay').waitFor({state:'hidden'});
        // r75's visible Start always creates shared setup. Exercise the existing local
        // createShowdown authority directly, without replacing any draw/guard handler.
        assert.equal(await page.evaluate(()=>createShowdown()),true);
        const before=await savedDraw(page);
        assert.equal(before.pending,false);
        assert.equal(before.league,null);
        const spin=page.locator('#spinLeague');
        await spin.waitFor({state:'visible'});
        const guard=await page.evaluate(()=>({guard:CareerModeProductionSharedJourneyGuard.isSharedJourneyPending(),entry:CareerModeProductionSharedJourneyEntry.isPending()}));
        console.log('OBSERVED after deletion/local creation:',JSON.stringify({...guard,disabled:await spin.isDisabled(),...before}));
        assert.equal(await spin.isEnabled(),true,'Deleted shared setup must not leave the local SPIN LEAGUE button locked');
        await spin.click();
        await page.waitForFunction(key=>{
          const library=JSON.parse(localStorage.getItem(key));
          return Boolean(library.saves.find(entry=>entry.saveId===library.activeSaveId)?.showdown.selectedLeague);
        },saveKey,{timeout:10000});
        assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyGuard.isSharedJourneyPending()),false);
        console.log('OBSERVED local draw:',JSON.stringify(await savedDraw(page)));
      }],
      ['reload earliest draw stays blocked',async page=>{
        await prepareShared(page);
        let release;
        const held=new Promise(resolve=>{release=resolve;});
        let requested=false;
        await page.route('**/js/saveLibraryRuntime.js*',async route=>{requested=true;await held;await route.continue();});
        try{
          await page.reload({waitUntil:'domcontentloaded'});
          await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
          // Restore synthetic identity only; retain the real saved-shell resume,
          // gameplay loaders, draw controls and guard through the reload.
          await page.evaluate(async()=>{
            window.CareerModeOnlinePlayerIdentity={getState:()=>({status:'ready',managerId:'daniel',registered:true})};
            await resumeSavedShowdown();
          });
          await page.locator('#leagueWheelScreen').waitFor({state:'visible',timeout:15000});
          assert.equal(await page.evaluate(()=>Boolean(window.CareerModeSaveLibraryRuntime?.isReady?.())),false);
          const spin=page.locator('#spinLeague');
          if(await spin.isEnabled())await spin.click();
          else await spin.evaluate(button=>button.click());
          assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyGuard.isSharedJourneyPending()),true);
          assert.equal(await page.evaluate(()=>spinLeagueWheel()),false);
          assert.equal(await page.evaluate(()=>currentShowdown.selectedLeague),null);
          console.log('OBSERVED reload before Save Library ready:',JSON.stringify({disabled:await spin.isDisabled(),guard:true,league:null}));
        }finally{release();}
        await page.evaluate(async()=>{
          await loadRuntimeScript('save-library-cutover','js/saveLibraryCutover.js',()=>typeof window.ensureSaveLibraryRuntimeAuthority==='function');
          await ensureSaveLibraryRuntimeAuthority();
        });
        await page.waitForFunction(()=>window.CareerModeSaveLibraryRuntime?.isReady?.(),null,{timeout:15000});
        assert.equal(requested,true,'Reload audit must actually delay Save Library loading');
        await page.evaluate(()=>CareerModeProductionSharedJourneyEntry?.closePanel());
        await page.locator('#leagueWheelScreen').waitFor({state:'visible',timeout:15000});
        const spin=page.locator('#spinLeague');
        // A disabled native button cannot dispatch a player click. If it is enabled,
        // click immediately; the capture gate must still prevent a local draw.
        if(await spin.isEnabled())await spin.click();
        else await spin.evaluate(button=>button.click());
        assert.equal(await page.evaluate(()=>CareerModeProductionSharedJourneyGuard.isSharedJourneyPending()),true);
        assert.equal(await page.evaluate(()=>spinLeagueWheel()),false);
        assert.equal(await page.evaluate(()=>assignClubs()),false);
        const after=await savedDraw(page);
        assert.equal(after.pending,true);
        assert.equal(after.league,null);
        assert.deepEqual(after.clubs,{playerOne:null,playerTwo:null});
        console.log('OBSERVED reload draw:',JSON.stringify({...after,disabled:await spin.isDisabled()}));
      }]
    ]){
      const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      // Keep this local browser audit away from production provider endpoints.
      await context.route(/https:\/\/.*(?:googleapis\.com|gstatic\.com)\//,route=>route.abort());
      try{await audit(page);assert.deepEqual(errors,[]);console.log(`PASS ${name}`);}
      catch(error){failures.push({name,error});console.error(`FAIL ${name}: ${error.stack}`);}
      finally{await context.close();}
    }
  }finally{await browser.close();}
  assert.equal(failures.length,0,`${failures.length} shared-journey marker audit case(s) failed`);
  console.log('PASS shared-journey guard marker audit: same-tab shared deletion permits a local draw; reload cannot draw before storage readiness or bypass persisted shared authority. Provider-neutral browser proof; SSJR credit 0.');
})().catch(error=>{console.error(error);process.exitCode=1;});
