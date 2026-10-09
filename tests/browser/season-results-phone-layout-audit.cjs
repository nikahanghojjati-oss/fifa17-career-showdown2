const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

// Use the established season-commit browser fixture so the real live-node V10 adapter and
// provider-rendered action are measured together. No remote service or write is used.
const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('7'.repeat(64)),sessionId='session_'+('6'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const resultOne={leaguePosition:1,leaguePoints:96,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const resultTwo={leaguePosition:3,leaguePoints:84,leagueGoals:79,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};
async function prepare(page,{role,saveId,failInitialRead=false}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function'&&typeof window.navigateTo==='function',null,{timeout:12000});
  await page.evaluate(async({role,saveId,rivalryId,sessionId,canonicalKeys,resultOne,resultTwo,failInitialRead})=>{
    await ensureGameplayModules();
    currentShowdown={id:saveId,currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
    const setup={status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo']}};
    const transfer={ok:true,revision:7,seasonNumber:1,managerRole:role,rivalryId,setup:setup.setup,state:{phase:'COMPLETED',revision:7,guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']}};
    const readyResults={ok:true,revision:2,state:{phase:'RESULTS_READY',revision:2,publishedRoles:['playerOne','playerTwo']},managerRole:role,seasonNumber:1,ownResult:role==='playerOne'?resultOne:resultTwo,opponentResult:role==='playerOne'?resultTwo:resultOne,allResults:{playerOne:resultOne,playerTwo:resultTwo}};
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedTransferChallenge={getState:()=>transfer,refresh:async()=>transfer};
    window.CareerModeSparkSharedSeasonResults={read:async()=>readyResults,publishResult:async()=>({ok:false,code:'AUDIT_RESULTS_ALREADY_READY'})};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role==='playerOne'?'account_one':'account_two'}},firestore:{},firestoreSdk:{}})};
    await loadRuntimeScript('ssjr-r10-audit-results','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    CareerModeProductionSharedSeasonResults.install();
    const opened=await CareerModeProductionSharedSeasonResults.open();if(!opened)throw new Error('r9 Shared Season Results did not open for r10 audit.');
    window.__forceCommitReadFailure=failInitialRead;
    window.CareerModeSparkSharedSeasonCommit={
      read:async()=>window.__forceCommitReadFailure?{ok:false,code:'permission-denied'}:window.__ssjrCommitAuditRead(role),
      commitSeason:async options=>window.__ssjrCommitAuditMutate('commit',{role,baseRevision:options.baseRevision,operationId:options.operationId}),
      acknowledgeSeason:async options=>window.__ssjrCommitAuditMutate('acknowledge',{role,baseRevision:options.baseRevision,operationId:options.operationId})
    };
    await loadRuntimeScript('ssjr-r10-audit-adapter','js/productionSharedSeasonCommit.js',()=>window.CareerModeProductionSharedSeasonCommit);
    CareerModeProductionSharedSeasonCommit.install();await CareerModeProductionSharedSeasonCommit.refresh().catch(error=>{if(!failInitialRead)throw error;});
    window.__ssjrCommitAudit={storageBefore:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),localState:()=>({selectedLeague:currentShowdown.selectedLeague,clubs:structuredClone(currentShowdown.clubs),transferChallenges:structuredClone(currentShowdown.transferChallenges),rounds:structuredClone(currentShowdown.rounds),score:structuredClone(currentShowdown.score)}),refresh:()=>CareerModeProductionSharedSeasonCommit.refresh(),state:()=>CareerModeProductionSharedSeasonCommit.getState()};
  },{role,saveId,rivalryId,sessionId,canonicalKeys,resultOne,resultTwo,failInitialRead});
  await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
  await page.locator('#seasonReviewPanel').waitFor({state:'visible',timeout:5000});
  await page.locator('#sharedSeasonCommitAction').waitFor({state:'visible',timeout:5000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const screenshotDir=process.env.CMS_SEASON_RESULTS_SCREENSHOT_DIR;
  if(screenshotDir)fs.mkdirSync(screenshotDir,{recursive:true});
  try{
    for(const [width,height] of [[390,844],[430,932],[844,390],[932,430]]){
      for(const committed of [false,true]){
        const context=await browser.newContext({viewport:{width,height},isMobile:true});
        const page=await context.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        const role=committed?'playerTwo':'playerOne';
        await page.exposeFunction('__ssjrCommitAuditRead',()=>({ok:true,committed,ready:true,managerRole:role,seasonNumber:1,phase:committed?'COMMITTED':'RESULTS_READY',revision:committed?1:0,coordinatorRole:'playerOne',results:{playerOne:resultOne,playerTwo:resultTwo},ownAcknowledged:false,acknowledgedRoles:[],resultsRevision:2,resultsContentHash:'sha256:'+('a'.repeat(64))}));
        await page.exposeFunction('__ssjrCommitAuditMutate',()=>{throw new Error('Layout audit must not mutate a season');});
        await prepare(page,{role,saveId:'phone_layout_audit'});
        await page.waitForFunction(()=>document.querySelector('.v10SeasonStage')&&document.querySelector('.season-title-wordmark').complete);
        await page.waitForFunction(()=>!document.querySelector('.v10SeasonStage').classList.contains('sd-motion-ready')||document.querySelector('.v10SeasonStage #screen-title').classList.contains('sd-entered'));
        const action=page.locator('#sharedSeasonCommitAction');
        assert.equal(await action.textContent(),committed?'ACKNOWLEDGE SHARED SEASON':'COMMIT & ACKNOWLEDGE SHARED SEASON');
        const before=await page.evaluate(()=>{
          const main=document.querySelector('#app main'),stage=document.querySelector('.v10SeasonStage'),panel=document.querySelector('#seasonReviewPanel');
          const title=document.querySelector('.season-title-wordmark').getBoundingClientRect(),tabs=document.querySelector('.season-phone-toolbar').getBoundingClientRect();
          const photos=[...document.querySelectorAll('.season-phone-hero')].map(n=>{const r=n.getBoundingClientRect();return {x:r.x,width:r.width,height:r.height,visible:getComputedStyle(n).display!=='none'};});
          const scrollers=[...stage.querySelectorAll('*')].filter(n=>n.getClientRects().length&&n.scrollHeight>n.clientHeight+2&&/auto|scroll/.test(getComputedStyle(n).overflowY)).map(n=>n.id||n.className);
          return {titleBottom:title.bottom,tabsTop:tabs.top,photos,scrollers,mainHeight:main.clientHeight,mainWidth:main.clientWidth,scrollWidth:main.scrollWidth,stageOverflow:getComputedStyle(stage).overflowY,panelOverflow:getComputedStyle(panel).overflowY};
        });
        assert.equal(before.mainHeight,height,'page scroller fills the viewport');
        assert.ok(before.scrollWidth<=before.mainWidth+1,'no horizontal scroll');
        assert.equal(before.stageOverflow,'visible');assert.equal(before.panelOverflow,'visible');
        assert.deepEqual(before.scrollers,[],'no nested scrolling results box');
        assert.ok(before.titleBottom+4<=before.tabsTop,'title stays above the tabs');
        if(width<height){
          const [left,right]=before.photos;assert.ok(left.visible&&right.visible);
          assert.ok(Math.abs(left.width-right.width)<1);assert.ok(Math.abs(left.height-right.height)<1);
          assert.ok(Math.abs(left.x-(width-right.x-right.width))<1,'photos have mirrored horizontal placement');
        }else assert.ok(before.photos.every(p=>!p.visible),'photos step aside in short landscape');
        const stem=`${width}x${height}-${committed?'acknowledge':'commit'}`;
        if(screenshotDir&&committed)await page.screenshot({path:path.join(screenshotDir,`${stem}-top.png`)});
        await page.locator('#app main').hover({position:{x:width/2,y:height/2}});
        await page.mouse.wheel(0,height);
        await page.waitForTimeout(250);
        const reachable=await action.evaluate(n=>{
          const r=n.getBoundingClientRect(),main=document.querySelector('#app main');
          return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,scrollTop:main.scrollTop,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
        });
        assert.ok(reachable.scrollTop>0,'one page scroll moves the page');
        assert.ok(reachable.top>=0&&reachable.bottom<=height,'action is fully in view after one page scroll');
        assert.ok(reachable.height>=44&&reachable.width<=width,'action fits and keeps its touch target');
        assert.ok(reachable.hit,'action is not covered by another layer');
        await action.click({trial:true});
        if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,`${stem}-action.png`)});
        // Scoring remains an in-flow sheet on both phone widths, including 932px landscape.
        await page.evaluate(()=>{document.querySelector('#app main').scrollTop=0;});
        await page.locator('.season-phone-scoring-open').click();
        await page.locator('#scoring-panel').waitFor({state:'visible'});
        assert.equal(await page.locator('#scoring-panel').evaluate(n=>getComputedStyle(n).position),'relative');
        await page.locator('.season-phone-sheet-close').click();
        await page.locator('#scoring-panel').waitFor({state:'hidden'});
        assert.deepEqual(errors,[]);
        console.log(`PASS ${stem}: viewport page scroll; title clear; photos symmetric/hidden; action reachable and unobstructed`);
        await context.close();
      }
    }
    console.log('Season Results phone layout audit passed (4 viewports × 2 live action states).');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
