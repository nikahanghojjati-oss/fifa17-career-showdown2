'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../../../../..');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require(root+'/tests/support/chromium-runtime.cjs');
const original=path.resolve(root,'tests/browser/shared-season-results-audit.cjs');
let source=fs.readFileSync(original,'utf8');
source=source.slice(0,source.lastIndexOf('(async()=>{'));
source=source.replace('seasonNumber:1,ownResult:own','seasonNumber:server.seasonNumber||1,ownResult:own');
source=source.replace('window.CareerModeProductionSharedShowdownSetup={','window.__area09Fixture={setup,transfer};\n    window.CareerModeProductionSharedShowdownSetup={');
source=source.replace("managers:{playerOne:'Nik',playerTwo:'Daniel'}","managers:{playerOne:'Daniel',playerTwo:'Nik'}");
const helpers=new Function('require',source+'\nreturn {prepare,exposeServer,enterResults,server};')(createRequire(original));
const fields=['LeaguePosition','LeaguePoints','LeagueGoals','DomesticCup','ChampionsLeague','TopScorer','TopAssist'];
const perfect={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
const neutral={leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
(async()=>{
 const browser=await chromium.launch({...(await resolveChromiumRuntime()),headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await helpers.exposeServer(page);await helpers.prepare(page,{role:'playerOne',saveId:'area09_showdown',entry:'verdicts'});await helpers.enterResults(page,'verdicts');
  for(const [suffix,value] of [['LeaguePosition','1'],['LeaguePoints','100'],['LeagueGoals','100']])await page.locator('#p1'+suffix).fill(value);
  for(const suffix of fields.slice(3))await page.locator('#p1'+suffix).check();
  await page.locator('#completeSeason').click();await page.locator('#confirmSeasonCompletion').click();
  await page.waitForFunction(()=>CareerModeProductionSharedSeasonResults.getState()?.ownResult?.leaguePosition===1);
  assert.deepEqual(helpers.server.results.playerOne,perfect);
  // Nik publishes; the same real screen reveals both finished season results.
  helpers.server.results.playerTwo=neutral;helpers.server.order.push('playerTwo');helpers.server.revision=2;
  await page.evaluate(()=>CareerModeProductionSharedSeasonResults.refresh());
  assert.equal(await page.locator('#p1ChampionsLeague').isChecked(),true);
  // The next season is ready after the normal season cursor moves and transfers finish.
  helpers.server.results={};helpers.server.order=[];helpers.server.revision=0;helpers.server.seasonNumber=2;
  const opened=await page.evaluate(async()=>{
   currentShowdown.currentRound=2;
   window.__area09Fixture.transfer.seasonNumber=2;
   window.dispatchEvent(new CustomEvent('career-mode-shared-season-cursor-change',{detail:{previousSeason:1,activeSeason:2}}));
   return await CareerModeProductionSharedSeasonResults.open();
  });assert.equal(opened,true);
  await page.locator('#completeSeason').waitFor({state:'visible'});
  const actual=await page.evaluate(fields=>Object.fromEntries(fields.map(s=>{const e=document.getElementById('p1'+s);return [s,e.type==='checkbox'?e.checked:e.value];})),fields);
  const expected={LeaguePosition:'',LeaguePoints:'',LeagueGoals:'',DomesticCup:false,ChampionsLeague:false,TopScorer:false,TopAssist:false};
  console.log('SEASON 2 EXPECTED '+JSON.stringify(expected));console.log('SEASON 2 ACTUAL '+JSON.stringify(actual));
  // Prove this is usable entry data, not hidden old history: Review accepts it as season 2.
  await page.locator('#completeSeason').click();
  console.log('SEASON 2 REVIEW '+JSON.stringify(await page.locator('#seasonReviewOne').innerText()));
  if(process.env.CMS_AREA09_SCREENSHOT)await page.screenshot({path:process.env.CMS_AREA09_SCREENSHOT,fullPage:true});
  assert.deepEqual(actual,expected,'New season entry must not carry the previous season facts and trophies.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
