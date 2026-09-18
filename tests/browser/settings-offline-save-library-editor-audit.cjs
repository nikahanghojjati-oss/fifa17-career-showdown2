const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const libraryKey='careerModeShowdown.saveLibrary';

async function createLocalShowdown(page){
  await page.evaluate(async()=>{
    await loadRuntimeScript('save-library-cutover','js/saveLibraryCutover.js',()=>typeof window.ensureSaveLibraryRuntimeAuthority==='function');
    await ensureSaveLibraryRuntimeAuthority();
    const now=new Date().toISOString();
    const created=await CareerModeSaveLibraryRuntime.createShowdown({
      schemaVersion:2,
      integrityWarnings:[],
      id:'offline-editor-regression',
      name:'Offline Editor Regression',
      managers:{playerOne:'Manager One',playerTwo:'Manager Two'},
      totalRounds:3,
      currentRound:1,
      status:'Created',
      selectedLeague:null,
      clubs:{playerOne:null,playerTwo:null},
      score:{playerOne:0,playerTwo:0},
      transferChallenges:[],
      rounds:[],
      createdAt:now,
      updatedAt:now,
      completedAt:null,
      archivedAt:null
    });
    if(!created?.identity?.saveId)throw new Error('Save Library fixture did not receive stable identity.');
  });
}

async function revealInternalSaveLibraryForAudit(page){
  const panel=page.locator('#saveLibraryProductPanel');
  await panel.waitFor({state:'attached',timeout:10000});
  await page.waitForTimeout(900);
  await panel.evaluate(element=>{
    element.dataset.testSurface='internal-audit';
    element.hidden=false;
  });
  await panel.waitFor({state:'visible',timeout:5000});
  return panel;
}

async function restoreInternalSaveLibraryContainment(page){
  await page.evaluate(()=>{
    const panel=document.getElementById('saveLibraryProductPanel');
    if(!panel)return;
    panel.hidden=true;
    delete panel.dataset.testSurface;
  });
  await page.waitForFunction(()=>{
    const panel=document.getElementById('saveLibraryProductPanel');
    return Boolean(panel&&panel.hidden&&getComputedStyle(panel).display==='none'&&panel.dataset.productSurface==='internal');
  },null,{timeout:5000});
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
    const panel=await revealInternalSaveLibraryForAudit(page);
    assert.equal(await panel.getAttribute('data-product-surface'),'internal','Save Library editor audit must operate only on the internal recovery surface.');
    await page.waitForFunction(()=>document.querySelectorAll('#saveLibraryProductPanel .saveLibraryProfileCard').length===2,null,{timeout:10000});

    const card=panel.locator('.saveLibraryProfileCard').first();
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
        installActionDisabled:false,updateActionLabel:'UPDATE TO LATEST VERSION',updateActionDisabled:false,
        installGuidance:'Synthetic regression state.'
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
        connectivity:nextOffline.querySelector('.settingsOfflineInfo')?.textContent||'',
        updateButtonCount:nextOffline.querySelectorAll('.settingsOfflineUpdateButton').length,
        updateButtonLabel:nextOffline.querySelector('.settingsOfflineUpdateButton')?.textContent||'',
        updateButtonDisabled:Boolean(nextOffline.querySelector('.settingsOfflineUpdateButton')?.disabled)
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
    assert.equal(result.updateButtonCount,1,'Settings must always render exactly one update-to-latest control even when no worker is already waiting');
    assert.equal(result.updateButtonLabel,'UPDATE TO LATEST VERSION','non-waiting state must expose the explicit latest-version check instead of hiding the update control');
    assert.equal(result.updateButtonDisabled,false,'online supported state must keep the persistent update-to-latest control actionable');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),libraryKey),canonicalBefore,'offline-state presentation refresh must not mutate canonical Save Library bytes');
    await page.evaluate(()=>document.querySelector('#saveLibraryProductPanel .saveLibraryProfileCancelButton')?.click());
    assert.equal(await form.isHidden(),true,'preserved editor CANCEL control must remain operable after offline-state refresh');
    await restoreInternalSaveLibraryContainment(page);
    assert.deepEqual(errors,[],'offline Save Library editor regression audit emitted page errors');
    process.stdout.write('PASS Settings offline-state regression: explicit internal recovery audit preserves the exact Save Library profile editor, unsaved draft and CANCEL control while updating connectivity presentation without canonical storage mutation, then restores hidden containment.\n');
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});