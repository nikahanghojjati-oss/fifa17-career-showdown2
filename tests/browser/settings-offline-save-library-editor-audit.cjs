const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const libraryKey='careerModeShowdown.saveLibrary';

async function createLocalShowdown(page){
  await page.locator('#newShowdown').click();
  await page.locator('#createShowdown').waitFor({state:'visible',timeout:10000});
  await page.locator('#showdownName').fill('Offline Editor Regression');
  await page.locator('#managerOne').fill('Manager One');
  await page.locator('#managerTwo').fill('Manager Two');
  await page.locator('#roundAmount').selectOption('3');
  await page.locator('#startShowdown').click();
  await page.locator('#leagueWheelScreen').waitFor({state:'visible',timeout:12000});
  await page.evaluate(()=>window.showScreen('mainMenu',false,{manageFocus:false}));
  await page.locator('#mainMenu').waitFor({state:'visible',timeout:5000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:1100,height:760}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
    await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
    await page.locator('#settingsButton').waitFor({state:'visible',timeout:10000});
    await createLocalShowdown(page);

    await page.locator('#settingsButton').click();
    await page.locator('#settingsOverlay').waitFor({state:'visible',timeout:10000});
    await page.locator('#saveLibraryProductPanel').waitFor({state:'visible',timeout:10000});
    await page.waitForFunction(()=>document.querySelectorAll('#saveLibraryProductPanel .saveLibraryProfileCard').length===2,null,{timeout:10000});

    const card=page.locator('#saveLibraryProductPanel .saveLibraryProfileCard').first();
    await card.locator('.saveLibraryProfileEditButton').click();
    const input=card.locator('.saveLibraryProfileNameInput');
    const form=card.locator('.saveLibraryProfileEditForm');
    const cancel=card.locator('.saveLibraryProfileCancelButton');
    await form.waitFor({state:'visible',timeout:5000});
    await input.fill('UNSAVED OFFLINE EVENT DRAFT');
    const canonicalBefore=await page.evaluate(key=>localStorage.getItem(key),libraryKey);

    const result=await page.evaluate(()=>{
      const panel=document.getElementById('saveLibraryProductPanel');
      const card=panel.querySelector('.saveLibraryProfileCard');
      const input=card.querySelector('.saveLibraryProfileNameInput');
      const form=card.querySelector('.saveLibraryProfileEditForm');
      const cancel=card.querySelector('.saveLibraryProfileCancelButton');
      const offline=document.querySelector('.settingsOfflinePanel');
      const originalState=window.getOfflineAppSettingsState;
      window.getOfflineAppSettingsState=()=>({
        supported:true,standalone:false,connectivity:'offline',connectivityVerified:true,connectivityLabel:'Offline',
        offlineReady:true,offlineRecoveryReady:true,shellLabel:'Offline ready',waitingUpdate:false,
        installPromptAvailable:false,installationLabel:'Browser launch',installActionLabel:'INSTALL HELP',
        installActionDisabled:false,updateActionLabel:'APPLY READY UPDATE',installGuidance:'Synthetic regression state.'
      });
      window.dispatchEvent(new CustomEvent('career-mode-offline-state-change'));
      const nextPanel=document.getElementById('saveLibraryProductPanel');
      const nextOffline=document.querySelector('.settingsOfflinePanel');
      const currentCard=nextPanel.querySelector('.saveLibraryProfileCard');
      const currentInput=currentCard.querySelector('.saveLibraryProfileNameInput');
      const currentForm=currentCard.querySelector('.saveLibraryProfileEditForm');
      const currentCancel=currentCard.querySelector('.saveLibraryProfileCancelButton');
      window.getOfflineAppSettingsState=originalState;
      return {
        samePanel:nextPanel===panel,
        sameCard:currentCard===card,
        sameInput:currentInput===input,
        sameCancel:currentCancel===cancel,
        offlinePanelRefreshed:nextOffline!==offline,
        formStillOpen:currentForm===form&&!currentForm.hidden,
        draft:currentInput.value,
        connectivity:nextOffline.querySelector('.settingsOfflineInfo')?.textContent||''
      };
    });

    assert.equal(result.samePanel,true,'offline-state refresh must preserve the mounted Save Library subtree');
    assert.equal(result.sameCard,true,'offline-state refresh must preserve the exact Local Profile editor card');
    assert.equal(result.sameInput,true,'offline-state refresh must preserve the exact in-progress profile input node');
    assert.equal(result.sameCancel,true,'offline-state refresh must preserve the exact CANCEL control');
    assert.equal(result.offlinePanelRefreshed,true,'offline-state refresh must still replace the Offline App panel');
    assert.equal(result.formStillOpen,true,'offline-state refresh must not close an in-progress Local Profile editor');
    assert.equal(result.draft,'UNSAVED OFFLINE EVENT DRAFT','offline-state refresh must preserve unsaved profile-label text');
    assert.match(result.connectivity,/Offline/,'targeted refresh must publish the new connectivity state');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),libraryKey),canonicalBefore,'offline-state presentation refresh must not mutate canonical Save Library bytes');
    await cancel.click();
    assert.equal(await form.isHidden(),true,'preserved editor CANCEL control must remain operable after offline-state refresh');
    assert.deepEqual(errors,[],'offline Save Library editor regression audit emitted page errors');
    process.stdout.write('PASS Settings offline-state regression: targeted Offline App refresh preserves the exact Save Library profile editor, unsaved draft and CANCEL control while updating connectivity presentation without canonical storage mutation.\n');
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
