"use strict";
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=process.cwd(),{chromium}=require(path.join(root,'node_modules/playwright'));
const {resolveChromiumRuntime}=require(path.join(root,'tests/support/chromium-runtime.cjs'));
const base=process.env.CMS_BASE_URL||'http://127.0.0.1:4194/';
(async()=>{
 const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({...runtime,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>{window.getOfflineAppDiagnostics=()=>({qaEdges:true});});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#loadingScreen').waitFor({state:'hidden'});
  await page.evaluate(async()=>{await ensureGameplayModules();await loadRuntimeScript('qa-v10-screens','js/v10Screens.js',()=>Boolean(window.CareerModeV10Screens));await loadRuntimeScript('qa-season-final','js/seasonFinalV10.js',()=>Boolean(window.CareerModeSeasonFinalV10));});
  for(const [total,seasons] of [[0,10],[3,3]]){
   await page.evaluate(async({total,seasons})=>{
    const final={phase:'FINAL_SEASON_RECONCILED',finalSeasonReconciled:true,winner:'draw',managerTotals:{playerOne:total,playerTwo:total},acceptedSeasons:seasons,totalSeasons:seasons,rivalryId:'pair_'+'a'.repeat(64)};
    window.CareerModeProductionSharedFinalReconciliation={getState:()=>final};
    window.CareerModeProductionSharedTerminalClose={getState:()=>null};
    window.CareerModeProductionSharedHistoryConvergence={getState:()=>null};
    document.querySelectorAll('.screen').forEach(el=>el.classList.add('hidden'));document.getElementById('seasonEntry').classList.remove('hidden');
    window.getActiveScreenName=()=> 'seasonEntry';
    await CareerModeSeasonFinalV10.install();CareerModeV10Screens.invalidate('seasonEntry');await CareerModeV10Screens.show('seasonEntry');
   },{total,seasons});
   const stage=page.locator('.v10FinalStage');await stage.waitFor({state:'visible',timeout:15000});
   assert.equal(await stage.locator('#outcomeHeadline').textContent(),'DRAW');
   assert.equal(await stage.locator('#danielTotal').textContent(),String(total));assert.equal(await stage.locator('#nikTotal').textContent(),String(total));
   console.log(`PASS real final-screen renderer: ${seasons} seasons, ${total}-${total}, DRAW`);
  }
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#loadingScreen').waitFor({state:'hidden'});
  const career=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/data-contract-v1/multi-showdown-career.json'))).career;
  career.managers.nik.showdowns={completed:4,wins:2,draws:1,losses:1};
  await page.evaluate(async model=>{
   await loadRuntimeScript('qa-statistics','js/statistics.js',()=>typeof window.renderCareerStatistics==='function');
   await loadRuntimeScript('qa-seam','js/careerScreenSeam.js',()=>Boolean(window.CareerModeCareerScreenSeam));
   await loadRuntimeScript('qa-career-screens','js/careerScreensV10.js',()=>Boolean(window.CareerModeCareerScreensV10));
   createCareerStatisticsScreen();renderCareerStatistics({model});
   document.querySelectorAll('.screen').forEach(el=>el.classList.add('hidden'));document.getElementById('careerStatistics').classList.remove('hidden');
   window.getActiveScreenName=()=> 'careerStatistics';await CareerModeCareerScreensV10.mount('careerStatistics',()=>model);
  },career);
  const table=page.locator('#careerTablePanel table');await table.waitFor({state:'visible',timeout:15000});
  const nik=table.locator('tbody tr').filter({hasText:'Nik'});
  assert.equal(await table.locator('thead th').nth(2).textContent(),'Showdowns');assert.equal(await nik.locator('td').nth(2).textContent(),'4');
  console.log('PASS chat-1006-0534-1 disproof: current Career Table shows Showdowns = 4 for Nik, not 2-1-1');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
