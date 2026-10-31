#!/usr/bin/env node
'use strict';
// r87 transitions (Nik 2026-10-31: "moving through hundreds of Showdowns in History and career screens must be fast").
// The real app over the local static server in the pinned Chromium; History is drawn from a verified career model of 300
// finished 10-season Showdowns (real History verifier + real career model), so no Firebase and no network.
//   S-01  History never copies the live frame into its hidden debug section (it built ~140k hidden elements)
//   S-02  phone History draws only the selected card and PHONE_CARD_WINDOW (3) on each side; the rest are hidden stand-ins
//   S-03  stepping through Showdowns on a phone always shows a real, selected card, and keeps the drawn set small
//   S-04  History with 300 Showdowns stays under 2,000 elements on desktop and on a phone
// tests/browser/r87-history-scale-audit.cjs is the timed version (reveal and step times at 4x CPU), run by hand.
const assert=require('node:assert/strict');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const History=require(path.join(ROOT,'js/sharedHistoryConvergence.js'));
const Career=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const {score,winner,result}=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));

const COUNT=300,WINDOW=3,LEAGUES=['premier_league','laliga','bundesliga','serie_a','ligue_1'];
const hash=n=>'sha256:'+String(n).padStart(64,'0');
function projection(i){
  const seasons=Array.from({length:10},(_,s)=>[
    result({leaguePosition:1+((i+s)%4),leaguePoints:70+((i*7+s)%35),championsLeague:(i+s)%5===0}),
    result({leaguePosition:1+((i+2*s)%4),leaguePoints:72+((i*3+s)%31),domesticCup:(i+s)%3===0})]);
  return History.buildProjection({rivalryId:'pair_'+i.toString(16).padStart(64,'0'),setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:10,leagueId:LEAGUES[i%LEAGUES.length],clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}},
    managerSlots:[{slotId:'playerOne',accountId:'acct_daniel',profileId:'profile_'+'a'.repeat(24),saveId:'save_'+'a'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:'acct_nik',profileId:'profile_'+'b'.repeat(24),saveId:'save_'+'b'.repeat(24),entitlementState:'active'}],
    seasons:seasons.map(([p1,p2],k)=>{const n=k+1,h=hash(n);return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
const finalFor=p=>{const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne:a,playerTwo:b},winner:a>b?'playerOne':b>a?'playerTwo':'draw'};};
const model=Career.buildCareerModel({indexStatus:'ready',showdowns:Array.from({length:COUNT},(_,i)=>{const p=projection(i+1);return {rivalryId:p.rivalryId,classification:'completed',projection:p,final:finalFor(p)};})});

function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,'127.0.0.1',()=>{socket.end();resolve(true);});socket.on('error',()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('static server did not start');}

async function openHistory(browser,base,[w,h]){
  const phone=w<900;
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce',hasTouch:phone,isMobile:phone});
  await context.route(url=>!url.href.startsWith(base),route=>route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>window.CareerModeV10Screens&&window.getActiveScreenName()==='mainMenu',null,{timeout:60000});
  await page.evaluate(async model=>{await window.ensureGameplayModules();await loadRuntimeScript('career-screen-seam','js/careerScreenSeam.js',()=>Boolean(window.CareerModeCareerScreenSeam));await window.openOptionalModule('legacy');window.renderLegacy({model});},model);
  await page.waitForFunction(()=>document.querySelector('#legacyCardGrid .legacyCard')&&!document.getElementById('legacy').hasAttribute('data-v10-pending')&&window.CareerModeV10Screens.isMounted('legacy'),null,{timeout:60000});
  return {context,page,errors};
}
const STATE=()=>{
  const host=document.getElementById('legacy'),cards=[...document.querySelectorAll('#legacyCardGrid .legacyCard')];
  const sel=cards.find(c=>c.dataset.selected==='true');
  return {elements:host.querySelectorAll('*').length,debug:(document.getElementById('fixtureValues')||{}).childElementCount||0,cards:cards.length,
    real:cards.filter(c=>c.dataset.standIn!=='true').map(c=>Number(c.dataset.showdown)),
    shownStandIns:cards.filter(c=>c.dataset.standIn==='true'&&c.getClientRects().length).length,
    selected:sel?Number(sel.dataset.showdown):null,selectedReal:Boolean(sel&&sel.dataset.standIn!=='true'&&sel.querySelector('.legacyCrest')),
    selectedShown:Boolean(sel&&sel.getClientRects().length)};
};

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
    // Desktop: S-01 and S-04.
    {
      const {context,page,errors}=await openHistory(browser,base,[1440,900]);
      const s=await page.evaluate(STATE);
      assert.equal(s.debug,0,'S-01 desktop: the live frame must not be copied into the hidden debug section');
      assert.ok(s.elements<2000,`S-04 desktop: History with ${COUNT} Showdowns holds ${s.elements} elements`);
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`ok   desktop 1440x900: ${s.elements} elements, ${s.cards} cards`);
    }
    // Phone: S-01 to S-04.
    {
      const {context,page,errors}=await openHistory(browser,base,[390,844]);
      let s=await page.evaluate(STATE);
      assert.equal(s.debug,0,'S-01 phone: the live frame must not be copied into the hidden debug section');
      assert.equal(s.cards,COUNT,'S-02 phone: every Showdown keeps its place in the list');
      assert.ok(s.real.length<=2*WINDOW+1,`S-02 phone: only cards near the selected one are drawn (drew ${s.real.length})`);
      assert.ok(s.selectedReal&&s.selectedShown,'S-02 phone: the selected card is drawn and shown');
      assert.equal(s.shownStandIns,0,'S-02 phone: a stand-in is never shown');
      assert.ok(s.elements<2000,`S-04 phone: History with ${COUNT} Showdowns holds ${s.elements} elements`);
      const first=s.selected;
      // S-03: ‹ ten times (History opens on the newest), then « to the oldest.
      for(let i=1;i<=10;i++){
        await page.locator('#legacyPager [data-direction="-1"]').click();
        s=await page.evaluate(STATE);
        assert.equal(s.selected,first-i,`S-03 phone: step ${i} selects the previous Showdown`);
        assert.ok(s.selectedReal&&s.selectedShown,`S-03 phone: step ${i} shows a real card`);
        assert.equal(s.shownStandIns,0,`S-03 phone: step ${i} shows no stand-in`);
      }
      const oldest=page.locator('#legacyPager [data-jump="oldest"]');
      if(await oldest.count()){
        await oldest.click();
        s=await page.evaluate(STATE);
        assert.equal(s.selected,1,'S-03 phone: « reaches the oldest Showdown');
        assert.ok(s.selectedReal&&s.selectedShown&&s.shownStandIns===0,'S-03 phone: the oldest Showdown is a real card');
      }
      assert.ok(s.real.length<=4*WINDOW+12,`S-03 phone: the drawn set stays small after stepping (drew ${s.real.length})`);
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`ok   phone 390x844: ${s.elements} elements, ${s.real.length} cards drawn of ${s.cards}`);
    }
    console.log('r87 History scale contracts: PASS');
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exit(1);});
