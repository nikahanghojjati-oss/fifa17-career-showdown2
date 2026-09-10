const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('8'.repeat(64));
const sessionId='session_'+('9'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const resultOne={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
const resultTwo={leaguePosition:4,leaguePoints:83,leagueGoals:74,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const scoreOne={championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,total:11,triggers:{hundredLeaguePoints:true,hundredLeagueGoals:true,topScorer:true,topAssist:true}};
const scoreTwo={championsLeague:0,leagueTitle:0,domesticCup:0,performanceBonus:0,individualAwardsBonus:0,total:0,triggers:{hundredLeaguePoints:false,hundredLeagueGoals:false,topScorer:false,topAssist:false}};

async function prepare(page,{role,saveId}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function'&&typeof window.navigateTo==='function',null,{timeout:12000});
  await page.evaluate(async({role,saveId,rivalryId,sessionId,canonicalKeys,resultOne,resultTwo})=>{
    await ensureGameplayModules();
    currentShowdown={id:saveId,currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Nik',playerTwo:'Daniel'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
    const setup={status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo']}};
    const transfer={ok:true,revision:7,seasonNumber:1,managerRole:role,rivalryId,setup:setup.setup,state:{phase:'COMPLETED',revision:7,guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']}};
    const readyResults={ok:true,revision:2,state:{phase:'RESULTS_READY',revision:2,publishedRoles:['playerOne','playerTwo']},managerRole:role,seasonNumber:1,ownResult:role==='playerOne'?resultOne:resultTwo,opponentResult:role==='playerOne'?resultTwo:resultOne,allResults:{playerOne:resultOne,playerTwo:resultTwo}};
    const acknowledgedCommit={ok:true,committed:true,ready:true,coordinatorRole:'playerOne',schemaVersion:1,runtimeRevision:'1.9.1-r10',seasonNumber:1,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:'sha256:'+('a'.repeat(64)),results:{playerOne:resultOne,playerTwo:resultTwo},managerRole:role,ownAcknowledged:true,acknowledgedRoles:['playerOne','playerTwo']};
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedTransferChallenge={getState:()=>transfer,refresh:async()=>transfer};
    window.CareerModeSparkSharedSeasonResults={read:async()=>readyResults,publishResult:async()=>({ok:false,code:'AUDIT_RESULTS_ALREADY_READY'})};
    window.CareerModeSparkSharedSeasonCommit={read:async()=>acknowledgedCommit,commitSeason:async()=>({ok:false,code:'AUDIT_COMMIT_ALREADY_ACKNOWLEDGED'}),acknowledgeSeason:async()=>({ok:false,code:'AUDIT_COMMIT_ALREADY_ACKNOWLEDGED'})};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role==='playerOne'?'account_one':'account_two'}},firestore:{},firestoreSdk:{}})};
    await loadRuntimeScript('ssjr-r11-audit-results','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    CareerModeProductionSharedSeasonResults.install();
    const opened=await CareerModeProductionSharedSeasonResults.open();
    if(!opened)throw new Error('r9 Shared Season Results did not open for r11 scoring audit.');
    await loadRuntimeScript('ssjr-r11-audit-commit','js/productionSharedSeasonCommit.js',()=>window.CareerModeProductionSharedSeasonCommit);
    CareerModeProductionSharedSeasonCommit.install();
    await CareerModeProductionSharedSeasonCommit.refresh();
    window.__ssjrScoringAuditBase={
      role,setup,
      storageBefore:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      localState:()=>({selectedLeague:currentShowdown.selectedLeague,clubs:structuredClone(currentShowdown.clubs),transferChallenges:structuredClone(currentShowdown.transferChallenges),rounds:structuredClone(currentShowdown.rounds),score:structuredClone(currentShowdown.score)})
    };
  },{role,saveId,rivalryId,sessionId,canonicalKeys,resultOne,resultTwo});

  await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
  await page.locator('#seasonReviewPanel').waitFor({state:'visible',timeout:5000});
  await page.locator('#sharedSeasonCommitAction').waitFor({state:'visible',timeout:5000});
  assert.equal(await page.locator('#seasonReviewHeading').textContent(),'BOTH MANAGERS PUBLISHED','r11 scoring must attach only after the complete r9 shared Season Review is rendered.');
  assert.equal(await page.locator('#sharedSeasonCommitAction').textContent(),'SEASON COMMIT ACKNOWLEDGED ✓','r11 scoring must attach only after the real r10 production adapter verifies terminal acknowledgement.');

  await page.evaluate(async({role,scoreOne,scoreTwo})=>{
    const bounded=(promise,label,timeoutMs=8000)=>Promise.race([Promise.resolve(promise),new Promise((_,reject)=>setTimeout(()=>reject(new Error(`r11 scoring audit timed out during ${label}`)),timeoutMs))]);
    const loadCandidateScript=path=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.async=false;script.onload=()=>resolve(true);script.onerror=()=>reject(new Error(`Unable to load unpublished candidate ${path}.`));document.head.appendChild(script);});
    const providerCalls=[];
    window.CareerModeSparkSharedCanonicalScoring={read:async options=>{providerCalls.push({uid:options.user?.uid,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,seasonNumber:options.seasonNumber,teamCount:options.teamCount});return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r11',phase:'SCORING_RECONCILED',revision:1,seasonNumber:1,managerRole:role,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:'sha256:'+('a'.repeat(64)),scoring:{playerOne:scoreOne,playerTwo:scoreTwo},winner:'playerOne'};}};
    // r11 is deliberately not yet part of the r10 service-worker shell. Load the exact
    // candidate files without a ?v= query so the r10 worker passes the request through
    // to the test server. Whole-shell r11 publication is a separate required gate.
    await bounded(loadCandidateScript('js/sharedCanonicalScoring.js'),'candidate scoring core load');
    await bounded(loadCandidateScript('js/productionSharedCanonicalScoring.js'),'candidate production scoring load');
    CareerModeProductionSharedCanonicalScoring.install();
    await bounded(CareerModeProductionSharedCanonicalScoring.refresh(),'canonical scoring refresh');
    const base=window.__ssjrScoringAuditBase;
    window.__ssjrScoringAudit={providerCalls,storageBefore:base.storageBefore,storageAfter:base.storageAfter,localState:base.localState,state:()=>CareerModeProductionSharedCanonicalScoring.getState()};
  },{role,scoreOne,scoreTwo});

  await page.locator('#sharedCanonicalScoringPanel').waitFor({state:'visible',timeout:5000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}}),peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});const host=await hostContext.newPage(),peer=await peerContext.newPage(),errors=[];host.on('pageerror',error=>errors.push(`host: ${error.message}`));peer.on('pageerror',error=>errors.push(`peer: ${error.message}`));
  try{
    await prepare(host,{role:'playerOne',saveId:'shared_scoring_host'});await prepare(peer,{role:'playerTwo',saveId:'shared_scoring_peer'});
    for(const page of [host,peer]){
      assert.equal(await page.locator('#sharedCanonicalScoringHeading').textContent(),'SHARED CANONICAL SCORE');assert.equal(await page.locator('#sharedCanonicalScoringTotals').textContent(),'Nik: 11 · Daniel: 0');
      const breakdown=await page.locator('#sharedCanonicalScoringBreakdown').textContent();for(const expected of ['Champions League 5–0','League Title 3–0','Domestic Cup 1–0','Performance Bonus 1–0','Awards Bonus 1–0'])assert.match(breakdown,new RegExp(expected));
      assert.equal(await page.locator('#sharedCanonicalScoringWinner').textContent(),'Season winner: Nik');
      const state=await page.evaluate(()=>window.__ssjrScoringAudit.state());assert.equal(state.authoritative,true);assert.equal(state.phase,'SCORING_RECONCILED');assert.equal(state.seasonCommitRevision,3);assert.equal(state.scoring.playerOne.total,11);assert.equal(state.scoring.playerTwo.total,0);assert.equal(state.winner,'playerOne');
      assert.deepEqual(await page.evaluate(()=>window.__ssjrScoringAudit.storageAfter()),await page.evaluate(()=>window.__ssjrScoringAudit.storageBefore),'r11 scoring must not mutate canonical local storage');assert.deepEqual(await page.evaluate(()=>window.__ssjrScoringAudit.localState()),{selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}},'r11 scoring must not mutate local setup, transfer, history or score authority');
    }
    const hostCall=(await host.evaluate(()=>window.__ssjrScoringAudit.providerCalls))[0],peerCall=(await peer.evaluate(()=>window.__ssjrScoringAudit.providerCalls))[0];assert.deepEqual(hostCall,{uid:'account_one',rivalryId,sessionId,deviceId:'device_'+('1'.repeat(32)),seasonNumber:1,teamCount:20});assert.deepEqual(peerCall,{uid:'account_two',rivalryId,sessionId,deviceId:'device_'+('2'.repeat(32)),seasonNumber:1,teamCount:20});
    assert.deepEqual(errors,[],'Shared Canonical Scoring browser audit emitted page errors.');
    process.stdout.write('PASS Shared Canonical Scoring desktop/mobile production flow: both managers traverse the real r9 results and r10 commit adapters, see the same provider-authoritative 11–0 canonical score and five-part breakdown only after r10 ACKNOWLEDGED, exact account/device/rivalry/session context is forwarded for provider enforcement, and canonical local storage/history/scoring remain untouched.\n');
  }finally{await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});