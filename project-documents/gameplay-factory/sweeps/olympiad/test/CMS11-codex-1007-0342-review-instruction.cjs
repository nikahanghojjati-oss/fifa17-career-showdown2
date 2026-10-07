process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../../../../../tests/support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('9'.repeat(64));
const sessionId='session_'+('8'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const server={revision:0,order:[],results:{},publishes:[],loseAckFor:null};

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
  server.results[role]=structuredClone(result);server.order.push(role);server.revision+=1;server.publishes.push({role,operationId,result:structuredClone(result)});
  return server.loseAckFor===role?{ok:false,code:'SIMULATED_RESPONSE_LOST_AFTER_ACCEPTANCE'}:projection(role);
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
    const appErrors=[];
    const originalReport=window.reportApplicationError;
    window.reportApplicationError=(context,error)=>{
      appErrors.push({context:String(context||''),message:error?.message||String(error||'')});
      if(typeof originalReport==='function')originalReport(context,error);
    };
    currentShowdown={
      id:saveId,currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},
      managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},
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
    window.__postResultsInstalls=[];
    window.CareerModeSparkSharedSeasonCommit={
      read:async()=>{
        const results=await window.__ssjrResultsAuditRead(role);
        const ready=results?.state?.phase==='RESULTS_READY'&&results?.revision===2&&results?.allResults?.playerOne&&results?.allResults?.playerTwo;
        return {ok:true,committed:false,ready:Boolean(ready),coordinatorRole:'playerOne',seasonNumber:1,phase:ready?'RESULTS_READY':'COLLECTING',revision:0,results:ready?results.allResults:null,managerRole:role,ownAcknowledged:false,acknowledgedRoles:[]};
      },
      commitSeason:async()=>({ok:false,code:'AUDIT_COMMIT_MUTATION_NOT_EXPECTED'}),
      acknowledgeSeason:async()=>({ok:false,code:'AUDIT_ACK_MUTATION_NOT_EXPECTED'})
    };
    window.CareerModeSharedLocalReconciliation={contractVersion:1};
    window.CareerModeProductionSharedMultiSeasonProgression={
      install(){window.__postResultsInstalls.push('CareerModeProductionSharedMultiSeasonProgression');return true;},
      resolveSeason:fallback=>Number(fallback)||1,
      getState:()=>null,
      refresh:async()=>null
    };
    for(const name of [
      'CareerModeProductionSharedJourneyReconnect',
      'CareerModeProductionSharedLocalReconciliation',
      'CareerModeProductionSharedFinalReconciliation',
      'CareerModeProductionSharedTerminalClose'
    ])window[name]={install(){window.__postResultsInstalls.push(name);return true;},getState:()=>null,refresh:async()=>null};
    await loadRuntimeScript('ssjr-results-audit-adapter','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    await loadRuntimeScript('ssjr-results-audit-route','js/productionSharedSeasonResultsRoute.js',()=>window.CareerModeProductionSharedSeasonResultsRoute);
    CareerModeProductionSharedSeasonResults.install();CareerModeProductionSharedSeasonResultsRoute.install();
    window.__ssjrResultsAudit={
      role,entry,
      storageBefore:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      localState:()=>({selectedLeague:currentShowdown.selectedLeague,clubs:structuredClone(currentShowdown.clubs),transferChallenges:structuredClone(currentShowdown.transferChallenges),rounds:structuredClone(currentShowdown.rounds),score:structuredClone(currentShowdown.score)}),
      canRoute:()=>CareerModeProductionSharedSeasonResults.canRoute(),
      routeCanRoute:()=>CareerModeProductionSharedSeasonResultsRoute.canRoute(),
      refreshResults:()=>CareerModeProductionSharedSeasonResults.refresh(),
      postResultsInstalls:()=>[...window.__postResultsInstalls],
      postResultsReady:()=>({
        commit:typeof window.CareerModeProductionSharedSeasonCommit?.refresh==='function',
        scoring:typeof window.CareerModeProductionSharedCanonicalScoring?.refresh==='function',
        history:typeof window.CareerModeProductionSharedHistoryConvergence?.refresh==='function',
        multi:typeof window.CareerModeProductionSharedMultiSeasonProgression?.install==='function',
        reconnect:typeof window.CareerModeProductionSharedJourneyReconnect?.install==='function',
        local:typeof window.CareerModeProductionSharedLocalReconciliation?.install==='function',
        final:typeof window.CareerModeProductionSharedFinalReconciliation?.install==='function',
        terminal:typeof window.CareerModeProductionSharedTerminalClose?.install==='function'
      }),
      diagnostics:()=>({
        routeReady:CareerModeProductionSharedSeasonResultsRoute.canRoute(),
        adapterCanRoute:CareerModeProductionSharedSeasonResults.canRoute(),
        adapterState:CareerModeProductionSharedSeasonResults.getState(),
        // Optional screens (job 29 Standings) may wrap the core router and tag the wrapper .original; the core hook must still be the innermost function.
        routerOwnsResults:(()=>{let fn=window.isRouteStateValid;for(let hops=0;hops<5&&typeof fn?.original==='function';hops+=1)fn=fn.original;return String(fn||'').includes('CareerModeProductionSharedSeasonResults');})(),
        activeScreen:typeof window.getActiveScreenName==='function'?window.getActiveScreenName():null,
        navigation:typeof window.getNavigationDiagnostics==='function'?window.getNavigationDiagnostics():null,
        seasonHidden:Boolean(document.getElementById('seasonEntry')?.classList.contains('hidden')),
        appErrors:structuredClone(appErrors)
      })
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
  const before=await page.evaluate(()=>window.__ssjrResultsAudit.diagnostics());
  assert.equal(before.routeReady,true,`${entry} entry must be eligible before capture. Diagnostics: ${JSON.stringify(before)}`);
  assert.equal(before.routerOwnsResults,true,`live browser must execute the r9 core Season Results route hook. Diagnostics: ${JSON.stringify(before)}`);
  await button.click();
  try{
    await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
  }catch(error){
    const after=await page.evaluate(()=>window.__ssjrResultsAudit.diagnostics());
    throw new Error(`Shared Season Results ${entry} entry stayed hidden. Before=${JSON.stringify(before)} After=${JSON.stringify(after)} Original=${error.message}`);
  }
  const after=await page.evaluate(()=>window.__ssjrResultsAudit.diagnostics());
  assert.equal(after.adapterCanRoute,true,`refreshed shared authority must grant the Season Results route without local transfer completion. Diagnostics: ${JSON.stringify(after)}`);
  await page.waitForFunction(()=>Object.values(window.__ssjrResultsAudit.postResultsReady()).every(Boolean),null,{timeout:8000});
  assert.deepEqual(await page.evaluate(()=>window.__ssjrResultsAudit.postResultsReady()),{
    commit:true,scoring:true,history:true,multi:true,reconnect:true,local:true,final:true,terminal:true
  },'real Shared Season Results route must expose the complete post-results production chain');
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


// The ready game fixture isolates the normal season-review screen from setup.
(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    const daniel=await (await browser.newContext({viewport:{width:393,height:660},isMobile:true})).newPage();
    const nik=await (await browser.newContext({viewport:{width:360,height:640},isMobile:true})).newPage();
    for(const [page,role] of [[daniel,'playerOne'],[nik,'playerTwo']]){await exposeServer(page);await prepare(page,{role,saveId:'sweep_review_'+role,entry:'verdict'});await enterResults(page,'verdict');}
    const result={leaguePosition:2,leaguePoints:70,leagueGoals:66,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
    for(const [page,role] of [[daniel,'playerOne'],[nik,'playerTwo']]){
      await fillOwnResult(page,role,{...result,leaguePosition:role==='playerOne'?2:4});
      await page.locator('#completeSeason').click();await page.locator('#confirmSeasonCompletion').click();
    }
    await daniel.evaluate(()=>CareerModeProductionSharedSeasonResults.refresh());
    await daniel.waitForFunction(()=>document.getElementById('seasonReviewHeading')?.textContent==='BOTH MANAGERS PUBLISHED');
    const intro=daniel.locator('#seasonReviewPanel .seasonReviewIntro');await intro.waitFor({state:'visible'});
    const text=await intro.innerText();
    assert.equal(server.revision,2,'both ordinary season results really were published');
    assert.equal(await daniel.locator('#editSeasonResults').isVisible(),false,'the published result is already final');
    assert.equal(await daniel.locator('#confirmSeasonCompletion').isVisible(),false,'the old save control is absent');
    console.log('Both players published. The results are final and the old save button is absent.');
    console.log('Visible instruction: '+text);
    require('node:fs').mkdirSync('work/codex-1007-0342',{recursive:true});
    await daniel.screenshot({path:'work/codex-1007-0342/stale-review-instruction.png',fullPage:true});
    assert.doesNotMatch(text,/Nothing becomes permanent until Confirm & Save Season is pressed/i,'published season results must not claim they remain unsaved until an absent save button is pressed');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
