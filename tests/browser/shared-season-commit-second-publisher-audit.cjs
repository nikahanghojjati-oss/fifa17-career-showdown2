const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

// r47 regression: the second manager to publish receives a RESULTS_READY publish
// projection that intentionally carries no opponent result (allResults:null,
// needsRefresh:true). If the follow-up authoritative Results read fails, the
// Results panel still says BOTH MANAGERS PUBLISHED. Before this fix the Results
// poller stopped on phase alone and the Commit adapter treated the incomplete
// projection as "not ready", so COMMIT SHARED SEASON vanished with no recovery.
const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('7'.repeat(64));
const sessionId='session_'+('6'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const resultOne={leaguePosition:1,leaguePoints:96,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const resultTwo={leaguePosition:3,leaguePoints:84,leagueGoals:79,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
    await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
    await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function'&&typeof window.navigateTo==='function',null,{timeout:12000});
    await page.evaluate(async({rivalryId,sessionId,canonicalKeys,resultOne,resultTwo})=>{
      await ensureGameplayModules();
      const role='playerTwo';
      currentShowdown={id:'shared_second_publisher',currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
      const setup={status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,deviceId:'device_'+'2'.repeat(32),managerRole:role,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo']}};
      const transfer={ok:true,revision:7,seasonNumber:1,managerRole:role,rivalryId,setup:setup.setup,state:{phase:'COMPLETED',revision:7,guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']}};
      const audit=window.__secondPublisherAudit={resultsReads:0,publishCalls:0,commitReads:0,commitWrites:0,failResultsRead:false,published:false};
      const waiting={ok:true,revision:1,state:{phase:'WAITING_FOR_RIVAL',revision:1,publishedRoles:['playerOne']},managerRole:role,seasonNumber:1,ownResult:null,opponentResult:null,allResults:null};
      const ready={ok:true,revision:2,state:{phase:'RESULTS_READY',revision:2,publishedRoles:['playerOne','playerTwo']},managerRole:role,seasonNumber:1,ownResult:resultTwo,opponentResult:resultOne,allResults:{playerOne:resultOne,playerTwo:resultTwo}};
      window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
      window.CareerModeProductionSharedTransferChallenge={getState:()=>transfer,refresh:async()=>transfer};
      window.CareerModeSparkSharedSeasonResults={
        read:async()=>{audit.resultsReads+=1;if(audit.failResultsRead)return {ok:false,code:'unavailable'};return audit.published?ready:waiting;},
        publishResult:async()=>{audit.publishCalls+=1;audit.published=true;audit.failResultsRead=true;return {ok:true,status:'accepted',replayed:false,revision:2,state:{phase:'RESULTS_READY',revision:2,publishedRoles:['playerOne','playerTwo']},managerRole:role,seasonNumber:1,ownResult:resultTwo,opponentResult:null,allResults:null,needsRefresh:true};}
      };
      window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'account_two'}},firestore:{},firestoreSdk:{}})};
      window.CareerModeSparkSharedSeasonCommit={
        read:async()=>{audit.commitReads+=1;return {ok:true,committed:false,ready:true,managerRole:role,seasonNumber:1,phase:'RESULTS_READY',revision:0,results:{playerOne:resultOne,playerTwo:resultTwo},coordinatorRole:'playerOne'};},
        commitSeason:async()=>{audit.commitWrites+=1;return {ok:false,code:'AUDIT_UNEXPECTED_WRITE'};},
        acknowledgeSeason:async()=>{audit.commitWrites+=1;return {ok:false,code:'AUDIT_UNEXPECTED_WRITE'};}
      };
      await loadRuntimeScript('ssjr-r47-audit-results','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
      CareerModeProductionSharedSeasonResults.install();
      await loadRuntimeScript('ssjr-r47-audit-commit','js/productionSharedSeasonCommit.js',()=>window.CareerModeProductionSharedSeasonCommit);
      CareerModeProductionSharedSeasonCommit.install();
      const opened=await CareerModeProductionSharedSeasonResults.open();if(!opened)throw new Error('Shared Season Results did not open.');
      audit.storageBefore=Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]));
      audit.storageAfter=()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]));
    },{rivalryId,sessionId,canonicalKeys,resultOne,resultTwo});
    await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
    await page.fill('#p2LeaguePosition','3');await page.fill('#p2LeaguePoints','84');await page.fill('#p2LeagueGoals','79');
    await page.check('#p2ChampionsLeague').catch(()=>{});await page.check('#p2TopAssist').catch(()=>{});
    await page.locator('#completeSeason').click();
    await page.locator('#confirmSeasonCompletion').waitFor({state:'visible',timeout:5000});
    await page.locator('#confirmSeasonCompletion').click();
    await page.waitForFunction(()=>document.getElementById('seasonReviewHeading')?.textContent==='BOTH MANAGERS PUBLISHED',null,{timeout:8000});
    await page.waitForFunction(()=>window.__secondPublisherAudit.publishCalls===1&&window.__secondPublisherAudit.resultsReads>=2,null,{timeout:8000});
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedSeasonResults.getState()?.allResults),null,'fixture must reproduce the incomplete second-publisher projection');
    // The physical failure: published heading, but the Commit control must not disappear.
    await page.waitForFunction(()=>{const node=document.getElementById('sharedSeasonCommitAction');return Boolean(node&&!node.classList.contains('hidden')&&/COMMIT CHECK|CHECK SHARED SEASON COMMIT/.test(node.textContent||''));},null,{timeout:8000});
    assert.equal(await page.locator('#sharedSeasonCommitAction').isVisible(),true,'published Results must never leave the Commit area without a visible action');
    assert.match(await page.locator('#sharedSeasonCommitStatus').textContent(),/YOUR PUBLISHED RESULTS ARE SAVED/);
    assert.equal(await page.evaluate(()=>window.__secondPublisherAudit.commitWrites),0,'recovery must never write Commit state');
    // While the authoritative Results read keeps failing, a check must fail visibly and stay read-only.
    await page.waitForFunction(()=>!document.getElementById('sharedSeasonCommitAction')?.disabled,null,{timeout:8000});
    await page.locator('#sharedSeasonCommitAction').click();
    await page.waitForFunction(()=>document.getElementById('sharedSeasonCommitAction')?.textContent==='RETRY COMMIT CHECK',null,{timeout:8000});
    assert.match(await page.locator('#sharedSeasonCommitStatus').textContent(),/CHECK FAILED · unavailable/,'the failing Results dependency code must be visible');
    assert.equal(await page.evaluate(()=>window.__secondPublisherAudit.publishCalls),1,'recovery must never republish results');
    assert.equal(await page.evaluate(()=>window.__secondPublisherAudit.commitWrites),0);
    // Provider recovers: one read-only retry heals Results and Commit together.
    await page.evaluate(()=>{window.__secondPublisherAudit.failResultsRead=false;});
    await page.waitForFunction(()=>!document.getElementById('sharedSeasonCommitAction')?.disabled,null,{timeout:8000});
    await page.locator('#sharedSeasonCommitAction').click();
    await page.waitForFunction(()=>document.getElementById('sharedSeasonCommitAction')?.textContent==='WAITING FOR COORDINATOR',null,{timeout:8000});
    assert.equal(await page.locator('#sharedSeasonCommitAction').isDisabled(),true,'the non-coordinator must never receive commit authority');
    assert.equal(await page.locator('#seasonReviewOne').isVisible(),true,'the healed Results read must reveal the rival result');
    assert.equal(await page.locator('#seasonReviewTwo').isVisible(),true);
    assert.equal(await page.locator('#seasonReviewError').textContent(),'','a healed authoritative Results read must clear the stale publish-refresh error');
    const audit=await page.evaluate(()=>({publishCalls:window.__secondPublisherAudit.publishCalls,commitWrites:window.__secondPublisherAudit.commitWrites,commitReads:window.__secondPublisherAudit.commitReads}));
    assert.equal(audit.publishCalls,1);assert.equal(audit.commitWrites,0);assert.ok(audit.commitReads>=1);
    assert.deepEqual(await page.evaluate(()=>window.__secondPublisherAudit.storageAfter()),await page.evaluate(()=>window.__secondPublisherAudit.storageBefore),'recovery must not mutate canonical local storage');
    assert.deepEqual(errors,[],'second-publisher audit emitted page errors');
    process.stdout.write('PASS Shared Season Commit second-publisher recovery: an incomplete RESULTS_READY publish projection with a failed follow-up read keeps a visible read-only Commit check, shows the failing code, never republishes or writes Commit, and one retry heals Results and restores the correct role action.\n');
  }finally{await context.close().catch(()=>{});await browser.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});
