const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('9'.repeat(64));
const sessionId='session_'+('8'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const server={revision:0,order:[],results:{},publishes:[]};

function otherRole(role){return role==='playerOne'?'playerTwo':'playerOne';}
function projection(role){
  const own=server.results[role]||null;
  const opponent=server.revision===2?server.results[otherRole(role)]||null:null;
  const state=server.revision===0?null:{phase:server.revision===2?'RESULTS_READY':'COLLECTING',revision:server.revision,publishedRoles:[...server.order]};
  const allResults=server.revision===2?{playerOne:server.results.playerOne,playerTwo:server.results.playerTwo}:null;
  return {ok:true,revision:server.revision,state,managerRole:role,seasonNumber:1,ownResult:own,opponentResult:opponent,allResults};
}
function publish({role,baseRevision,result,operationId}){
  if(baseRevision!==server.revision)return {ok:false,code:'SEASON_RESULTS_STALE_BASE_REVISION'};
  if(server.results[role])return {ok:false,code:'SEASON_RESULTS_ROLE_ALREADY_PUBLISHED'};
  server.results[role]=structuredClone(result);server.order.push(role);server.revision+=1;server.publishes.push({role,operationId,result:structuredClone(result)});return projection(role);
}

async function exposeServer(page){
  await page.exposeFunction('__ssjrResultsAuditRead',role=>projection(role));
  await page.exposeFunction('__ssjrResultsAuditPublish',payload=>publish(payload));
}

async function prepare(page,{role,saveId,entry}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function'&&typeof window.navigateTo==='function',null,{timeout:12000});
  await page.evaluate(async({role,saveId,entry,rivalryId,sessionId,canonicalKeys})=>{
    await ensureGameplayModules();
    await loadRuntimeScript('ssjr-results-audit-catalog','js/sharedShowdownCatalog.js',()=>window.CareerModeSharedShowdownCatalog);
    currentShowdown={
      id:saveId,currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},
      managers:{playerOne:'Nik',playerTwo:'Daniel'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},
      transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}
    };
    const setup={
      status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,
      deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,
      setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo']}
    };
    const transfer={ok:true,revision:7,seasonNumber:1,managerRole:role,rivalryId,setup:setup.setup,state:{phase:'COMPLETED',revision:7,guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']}};
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedTransferChallenge={getState:()=>transfer,refresh:async()=>transfer};
    window.CareerModeSparkSharedSeasonResults={
      read:async()=>window.__ssjrResultsAuditRead(role),
      publishResult:async options=>window.__ssjrResultsAuditPublish({role,baseRevision:options.baseRevision,operationId:options.operationId,result:options.result})
    };
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role==='playerOne'?'account_one':'account_two'}},firestore:{},firestoreSdk:{}})};
    await loadRuntimeScript('ssjr-results-audit-adapter','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    await loadRuntimeScript('ssjr-results-audit-route','js/productionSharedSeasonResultsRoute.js',()=>window.CareerModeProductionSharedSeasonResultsRoute);
    CareerModeProductionSharedSeasonResults.install();CareerModeProductionSharedSeasonResultsRoute.install();
    window.__ssjrResultsAudit={
      role,entry,
      storageBefore:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      localState:()=>({selectedLeague:currentShowdown.selectedLeague,clubs:structuredClone(currentShowdown.clubs),transferChallenges:structuredClone(currentShowdown.transferChallenges),rounds:structuredClone(currentShowdown.rounds),score:structuredClone(currentShowdown.score)}),
      canRoute:()=>CareerModeProductionSharedSeasonResults.canRoute(),
      routeCanRoute:()=>CareerModeProductionSharedSeasonResultsRoute.canRoute()
    };
    if(entry==='dashboard'){
      await navigateTo('dashboard',{addToHistory:false});
      CareerModeProductionSharedSeasonResultsRoute.decorate();
    }else{
      document.querySelectorAll('.screen').forEach(node=>node.classList.add('hidden'));
      const transferScreen=document.getElementById('transferChallenge');transferScreen.classList.remove('hidden');transferScreen.removeAttribute('data-shared-transfer-replay');
      CareerModeProductionSharedSeasonResultsRoute.decorate();
    }
  },{role,saveId,entry,rivalryId,sessionId,canonicalKeys});
}

async function enterResults(page,entry){
  const button=entry==='dashboard'?page.locator('#seasonPrimaryAction'):page.locator('#continueFromTransfers');
  await button.waitFor({state:'visible',timeout:5000});
  await button.click();
  await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
  assert.equal(await page.evaluate(()=>window.__ssjrResultsAudit.canRoute()),true,'refreshed shared authority must grant the Season Results route without local transfer completion');
}

async function fillOwnResult(page,role,result){
  const prefix=role==='playerOne'?'p1':'p2';
  await page.locator(`#${prefix}LeaguePosition`).fill(String(result.leaguePosition));
  await page.locator(`#${prefix}LeaguePoints`).fill(String(result.leaguePoints));
  await page.locator(`#${prefix}LeagueGoals`).fill(String(result.leagueGoals));
  for(const [suffix,key] of [['DomesticCup','domesticCup'],['ChampionsLeague','championsLeague'],['TopScorer','topScorer'],['TopAssist','topAssist']]){
    const checkbox=page.locator(`#${prefix}${suffix}`);if(result[key])await checkbox.check();else await checkbox.uncheck();
  }
}

async function assertPrivateEntry(page,role){
  const ownPrefix=role==='playerOne'?'p1':'p2',otherPrefix=role==='playerOne'?'p2':'p1';
  assert.equal(await page.locator(`#${ownPrefix}LeaguePosition`).isVisible(),true,'signed-in manager must receive their own seven-field form');
  assert.equal(await page.locator(`#${otherPrefix}LeaguePosition`).isVisible(),false,'opponent form must stay hidden before both publish');
  assert.match(await page.locator('#seasonEntry .seasonEntryHint').textContent(),/Enter only/);
  assert.deepEqual(await page.evaluate(()=>window.__ssjrResultsAudit.localState()),{selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}},'opening shared results must not fabricate local setup, transfer, rounds or scoring authority');
}

async function reviewTamperAndPublish(page,role,result){
  await fillOwnResult(page,role,result);
  await page.locator('#completeSeason').click();
  await page.locator('#seasonReviewPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('#seasonReviewHeading').textContent(),'REVIEW YOUR SEASON RESULT');
  const prefix=role==='playerOne'?'p1':'p2';
  await page.evaluate(({prefix,value})=>{document.getElementById(`${prefix}LeaguePoints`).value=String(value);},{prefix,value:result.leaguePoints+1});
  const before=server.publishes.length;
  await page.locator('#confirmSeasonCompletion').click();
  await page.waitForFunction(()=>/changed after review/i.test(document.getElementById('seasonReviewError')?.textContent||''),null,{timeout:4000});
  assert.equal(server.publishes.length,before,'review fingerprint mismatch must block provider publication');
  await page.locator('#editSeasonResults').click();
  await fillOwnResult(page,role,result);
  await page.locator('#completeSeason').click();
  await page.locator('#confirmSeasonCompletion').click();
  await page.waitForFunction(()=>/PUBLISHED|BOTH MANAGERS PUBLISHED/.test(document.getElementById('seasonReviewHeading')?.textContent||''),null,{timeout:5000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const host=await hostContext.newPage(),peer=await peerContext.newPage();
  const errors=[];host.on('pageerror',error=>errors.push(`host: ${error.message}`));peer.on('pageerror',error=>errors.push(`peer: ${error.message}`));
  await exposeServer(host);await exposeServer(peer);
  const resultOne={leaguePosition:1,leaguePoints:96,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
  const resultTwo={leaguePosition:3,leaguePoints:84,leagueGoals:79,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};
  try{
    await prepare(host,{role:'playerOne',saveId:'shared_results_host',entry:'verdict'});
    await enterResults(host,'verdict');
    await assertPrivateEntry(host,'playerOne');
    await reviewTamperAndPublish(host,'playerOne',resultOne);
    assert.equal(server.revision,1);assert.equal(server.publishes.length,1);assert.deepEqual(server.publishes[0].result,resultOne);
    assert.match(await host.locator('#seasonReviewStatusMeta').textContent(),/WAITING FOR YOUR RIVAL/);
    assert.equal(await host.locator('#seasonReviewTwo').isVisible(),false,'first publisher must not see opponent result');
    const back=host.locator('#seasonEntry .seasonEntryActions .backButton');assert.equal(await back.isVisible(),true,'waiting manager must retain a visible Showdown Home escape');await back.click();await host.locator('#dashboard').waitFor({state:'visible'});

    await prepare(peer,{role:'playerTwo',saveId:'shared_results_peer',entry:'dashboard'});
    await enterResults(peer,'dashboard');
    await assertPrivateEntry(peer,'playerTwo');
    await reviewTamperAndPublish(peer,'playerTwo',resultTwo);
    assert.equal(server.revision,2);assert.equal(server.publishes.length,2);assert.deepEqual(server.publishes[1].result,resultTwo);
    await peer.waitForFunction(()=>document.getElementById('seasonReviewHeading')?.textContent==='BOTH MANAGERS PUBLISHED',null,{timeout:5000});
    assert.equal(await peer.locator('#seasonReviewOne').isVisible(),true,'second publisher may see opponent only after RESULTS_READY');
    assert.equal(await peer.locator('#seasonReviewTwo').isVisible(),true);

    await host.locator('#seasonPrimaryAction').click();await host.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
    await host.waitForFunction(()=>document.getElementById('seasonReviewHeading')?.textContent==='BOTH MANAGERS PUBLISHED',null,{timeout:5000});
    assert.equal(await host.locator('#seasonReviewOne').isVisible(),true);assert.equal(await host.locator('#seasonReviewTwo').isVisible(),true,'first publisher must reveal opponent only after refreshing the completed two-role state');

    for(const page of [host,peer]){
      assert.deepEqual(await page.evaluate(()=>window.__ssjrResultsAudit.storageAfter()),await page.evaluate(()=>window.__ssjrResultsAudit.storageBefore),'shared publication must not mutate canonical local storage');
      assert.deepEqual(await page.evaluate(()=>window.__ssjrResultsAudit.localState()),{selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}},'shared publication must not mutate local setup, transfer, season history or scoring authority');
    }

    await host.evaluate(()=>{document.querySelectorAll('.screen').forEach(node=>node.classList.add('hidden'));const screen=document.getElementById('transferChallenge');screen.classList.remove('hidden');screen.dataset.sharedTransferReplay='WINDOW_OPEN';CareerModeProductionSharedSeasonResultsRoute.decorate();});
    assert.equal(await host.evaluate(()=>window.__ssjrResultsAudit.routeCanRoute()),false,'historical replay must disable live Shared Season Results routing');
    await host.locator('#continueFromTransfers').click({force:true});
    assert.equal(await host.locator('#seasonEntry').isVisible(),false,'replay continue must not enter live Season Results');
    assert.deepEqual(errors,[],'Shared Season Results browser audit emitted page errors.');
    process.stdout.write('PASS Shared Season Results desktop/mobile production flow: completed shared Transfer authority reaches Season Results without local completion markers; Player One enters from verdicts and Player Two from Showdown Home; each sees only their own seven-field form; review tampering is blocked; first publication stays private; both-publication reveals both sides; waiting users retain a dashboard escape; replay cannot enter live results; and canonical local storage/history/scoring remain untouched.\n');
  }finally{
    await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
