const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('8'.repeat(64));
const sessionId='session_'+('9'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const resultA1={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
const resultB1={leaguePosition:4,leaguePoints:83,leagueGoals:74,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const resultA2={leaguePosition:2,leaguePoints:88,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const resultB2={leaguePosition:1,leaguePoints:101,leagueGoals:95,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false};
const scoreA1={championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,total:11};
const scoreB1={championsLeague:0,leagueTitle:0,domesticCup:0,performanceBonus:0,individualAwardsBonus:0,total:0};
const scoreA2={championsLeague:0,leagueTitle:0,domesticCup:0,performanceBonus:0,individualAwardsBonus:0,total:0};
const scoreB2={championsLeague:0,leagueTitle:3,domesticCup:0,performanceBonus:1,individualAwardsBonus:1,total:5};

async function prepare(page,{role,saveId}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:12000});
  await page.evaluate(async({role,saveId,rivalryId,sessionId,canonicalKeys,resultA1,resultB1,resultA2,resultB2,scoreA1,scoreB1,scoreA2,scoreB2})=>{
    await ensureGameplayModules();
    currentShowdown={id:saveId,currentRound:2,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Nik',playerTwo:'Daniel'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
    const managerSlots=[
      {slotId:'playerOne',accountId:'account_one',profileId:'profile_'+('a'.repeat(24)),saveId:'save_'+('a'.repeat(24)),entitlementState:'active'},
      {slotId:'playerTwo',accountId:'account_two',profileId:'profile_'+('b'.repeat(24)),saveId:'save_'+('b'.repeat(24)),entitlementState:'active'}
    ];
    const setupLedger={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3};
    const commitFor=(seasonNumber,results,hash)=>({ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,results});
    const scoringFor=(seasonNumber,scoring,winner,hash)=>({ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,scoring,winner});
    const seasonOne={commit:commitFor(1,{playerOne:resultA1,playerTwo:resultB1},'sha256:'+('1'.repeat(64))),scoring:scoringFor(1,{playerOne:scoreA1,playerTwo:scoreB1},'playerOne','sha256:'+('1'.repeat(64)))};
    const seasonTwo={commit:commitFor(2,{playerOne:resultA2,playerTwo:resultB2},'sha256:'+('2'.repeat(64))),scoring:scoringFor(2,{playerOne:scoreA2,playerTwo:scoreB2},'playerTwo','sha256:'+('2'.repeat(64)))};
    const loadCandidate=path=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error(`Unable to load ${path}`));document.head.appendChild(script);});
    if(!window.CareerModeSharedHistoryConvergence)await loadCandidate('js/sharedHistoryConvergence.js');
    const projection=CareerModeSharedHistoryConvergence.buildProjection({rivalryId,setup:setupLedger,managerSlots,seasons:[seasonOne,seasonTwo]});
    const setupState={status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,accountId:role==='playerOne'?'account_one':'account_two',deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,setup:setupLedger};
    const currentCommit={...seasonTwo.commit,rivalryId,managerRole:role,coordinatorRole:'playerOne',ownAcknowledged:true,acknowledgedRoles:['playerOne','playerTwo']};
    const currentScoring={...seasonTwo.scoring,rivalryId,managerRole:role};
    window.__historyAuditMode='success';window.__historyProviderCalls=[];
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setupState,refresh:async()=>setupState};
    window.CareerModeProductionSharedSeasonCommit={getState:()=>window.__historyAuditCommitOverride===undefined?currentCommit:window.__historyAuditCommitOverride,refresh:async()=>window.CareerModeProductionSharedSeasonCommit.getState()};
    window.CareerModeProductionSharedCanonicalScoring={getState:()=>window.__historyAuditScoringOverride===undefined?currentScoring:window.__historyAuditScoringOverride,refresh:async()=>window.CareerModeProductionSharedCanonicalScoring.getState()};
    window.CareerModeSparkSharedSeasonCommit={read:async()=>({ok:false,code:'AUDIT_DIRECT_R10_READ_FORBIDDEN'})};
    window.CareerModeSharedCanonicalScoring=window.CareerModeSharedCanonicalScoring||{};
    window.CareerModeSparkSharedCanonicalScoring={read:async()=>({ok:false,code:'AUDIT_DIRECT_R11_READ_FORBIDDEN'})};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:setupState.accountId}},firestore:{},firestoreSdk:{}})};
    window.CareerModeSparkSharedHistoryConvergence={read:async options=>{
      window.__historyProviderCalls.push({uid:options.user?.uid,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,throughSeason:options.throughSeason});
      if(window.__historyAuditMode==='deny')return {ok:false,code:'HISTORY_CONVERGENCE_AUDIT_DENIED'};
      if(window.__historyAuditMode==='wrong-season')return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r12',phase:'HISTORY_CONVERGED',revision:1,rivalryId,managerRole:role,throughSeason:1,acceptedRevisionKey:projection.acceptedRevisionKey,projection};
      return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r12',phase:'HISTORY_CONVERGED',revision:1,rivalryId,managerRole:role,throughSeason:2,acceptedRevisionKey:projection.acceptedRevisionKey,projection};
    }};
    let review=document.getElementById('seasonReviewPanel');
    if(!review){review=document.createElement('section');review.id='seasonReviewPanel';document.body.appendChild(review);}review.classList.remove('hidden');
    let scoringPanel=document.getElementById('sharedCanonicalScoringPanel');if(!scoringPanel){scoringPanel=document.createElement('section');scoringPanel.id='sharedCanonicalScoringPanel';review.appendChild(scoringPanel);}scoringPanel.classList.remove('hidden');
    const storageBefore=Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]));
    if(!window.CareerModeProductionSharedHistoryConvergence)await loadCandidate('js/productionSharedHistoryConvergence.js');
    CareerModeProductionSharedHistoryConvergence.install();
    const refreshed=await CareerModeProductionSharedHistoryConvergence.refresh();if(!refreshed)throw new Error('r12 History Convergence did not activate.');
    window.__historyAudit={projection,storageBefore,storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),state:()=>CareerModeProductionSharedHistoryConvergence.getState(),refresh:()=>CareerModeProductionSharedHistoryConvergence.refresh(),currentCommit,currentScoring};
  },{role,saveId,rivalryId,sessionId,canonicalKeys,resultA1,resultB1,resultA2,resultB2,scoreA1,scoreB1,scoreA2,scoreB2});
  await page.locator('#sharedHistoryConvergencePanel').waitFor({state:'visible',timeout:5000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}}),peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});const host=await hostContext.newPage(),peer=await peerContext.newPage(),errors=[];host.on('pageerror',error=>errors.push(`host: ${error.message}`));peer.on('pageerror',error=>errors.push(`peer: ${error.message}`));
  try{
    await prepare(host,{role:'playerOne',saveId:'shared_history_host'});await prepare(peer,{role:'playerTwo',saveId:'shared_history_peer'});
    const rendered=[];
    for(const page of [host,peer]){
      assert.equal(await page.locator('#sharedHistoryConvergenceHeading').textContent(),'SHARED HISTORY CONVERGED');
      assert.equal(await page.locator('#sharedHistoryConvergenceSummary').textContent(),'2 of 3 seasons accepted · PREMIER LEAGUE');
      const records=await page.locator('#sharedHistoryConvergenceRecords').textContent();assert.match(records,/Nik · Arsenal · 1W 0D 1L · 11 showdown pts/);assert.match(records,/Daniel · Liverpool · 1W 0D 1L · 5 showdown pts/);
      const trophies=await page.locator('#sharedHistoryConvergenceTrophies').textContent();assert.match(trophies,/Nik 3 trophies \(1 league, 1 cup, 1 Champions League\)/);assert.match(trophies,/Daniel 1 trophies \(1 league, 0 cup, 0 Champions League\)/);
      rendered.push({summary:await page.locator('#sharedHistoryConvergenceSummary').textContent(),records,trophies});
      const state=await page.evaluate(()=>window.__historyAudit.state());assert.equal(state.authoritative,true);assert.equal(state.phase,'HISTORY_CONVERGED');assert.equal(state.throughSeason,2);assert.equal(state.projection.acceptedSeasons,2);assert.equal(state.projection.managerRecords.playerOne.profileId,'profile_'+('a'.repeat(24)));assert.equal(state.projection.managerRecords.playerTwo.profileId,'profile_'+('b'.repeat(24)));
      assert.deepEqual(await page.evaluate(()=>window.__historyAudit.storageAfter()),await page.evaluate(()=>window.__historyAudit.storageBefore),'r12 history convergence must not mutate canonical local storage');
    }
    assert.deepEqual(rendered[0],rendered[1],'both manager contexts must render the identical accepted shared-history projection');
    assert.deepEqual((await host.evaluate(()=>window.__historyProviderCalls))[0],{uid:'account_one',rivalryId,sessionId,deviceId:'device_'+('1'.repeat(32)),throughSeason:2});
    assert.deepEqual((await peer.evaluate(()=>window.__historyProviderCalls))[0],{uid:'account_two',rivalryId,sessionId,deviceId:'device_'+('2'.repeat(32)),throughSeason:2});
    const callsBefore=await host.evaluate(()=>window.__historyProviderCalls.length);
    await host.evaluate(async()=>{window.__historyAuditScoringOverride={...window.__historyAudit.currentScoring,resultsContentHash:'sha256:'+('f'.repeat(64))};await window.__historyAudit.refresh();});
    assert.equal(await host.locator('#sharedHistoryConvergencePanel').isHidden(),true,'stale r11 hash authority must hide r12 projection');assert.equal(await host.evaluate(()=>window.__historyProviderCalls.length),callsBefore,'cached r10/r11 mismatch must fail before provider read');
    await host.evaluate(async()=>{window.__historyAuditScoringOverride=undefined;window.__historyAuditMode='deny';await window.__historyAudit.refresh();});
    assert.equal(await host.locator('#sharedHistoryConvergencePanel').isHidden(),true,'provider/session denial must fail closed');
    await host.evaluate(async()=>{window.__historyAuditMode='success';await window.__historyAudit.refresh();currentShowdown.currentRound=3;await window.__historyAudit.refresh();});
    assert.equal(await host.locator('#sharedHistoryConvergencePanel').isHidden(),true,'an incomplete next season must not project stale history as current-season authority');
    assert.deepEqual(await host.evaluate(()=>window.__historyAudit.storageAfter()),await host.evaluate(()=>window.__historyAudit.storageBefore),'adversarial r12 paths must keep canonical local storage byte-for-byte unchanged');
    assert.deepEqual(errors,[],'Shared History Convergence browser audit emitted page errors.');
    process.stdout.write('PASS Shared History Convergence desktop/mobile production audit: both isolated manager contexts render the same two-season provider-authoritative history, manager records and trophy attribution with exact account/device/rivalry/session forwarding; stale r10/r11 hashes, provider denial and an incomplete next season fail closed; canonical local storage remains byte-for-byte unchanged.\n');
  }finally{await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});
