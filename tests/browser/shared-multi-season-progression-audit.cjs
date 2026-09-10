const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];

async function installHarness(page,{role,saveId,totalSeasons,rivalrySeed}){
  const rivalryId='pair_'+rivalrySeed.repeat(64);
  const sessionId='session_'+(role==='playerOne'?'a':'b').repeat(64);
  const deviceId='device_'+(role==='playerOne'?'1':'2').repeat(32);
  const accountId=role==='playerOne'?'account_one':'account_two';
  await page.addInitScript(()=>{
    // This audit owns only the r13 production adapter. Keep the app's unrelated idle
    // offline/SSJR bootstrap dormant; bootstrap ordering has its own contracts/audits.
    window.getOfflineAppDiagnostics=()=>({isolatedR13Audit:true});
  });
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:12000});
  return page.evaluate(async({role,saveId,totalSeasons,rivalryId,sessionId,deviceId,accountId,canonicalKeys})=>{
    await ensureGameplayModules();
    currentShowdown={
      id:saveId,currentRound:7,totalRounds:totalSeasons,status:'Ready',
      sharedJourney:{mode:'shared',rivalryId},
      managers:{playerOne:'Nik',playerTwo:'Daniel'},
      selectedLeague:null,clubs:{playerOne:null,playerTwo:null},
      transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}
    };
    const setup={status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,deviceId,accountId,managerRole:role,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons,confirmedRoles:['playerOne','playerTwo']}};
    window.__r13Accepted=0;
    window.__r13HistorySeason=0;
    window.__r13ProviderCalls=[];
    window.__r13CursorEvents=[];
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedHistoryConvergence={
      refresh:async()=>window.CareerModeProductionSharedHistoryConvergence.getState(),
      getState:()=>window.__r13HistorySeason>0?{authoritative:true,phase:'HISTORY_CONVERGED',throughSeason:window.__r13HistorySeason,projection:{acceptedSeasons:window.__r13HistorySeason,totalSeasons,leagueId:'premier_league',fixedClubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}}}:null
    };
    window.CareerModeSparkSharedMultiSeasonProgression={
      read:async options=>{
        window.__r13ProviderCalls.push({uid:options.user?.uid,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId});
        const accepted=window.__r13Accepted;
        return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r13',phase:accepted===totalSeasons?'SHOWDOWN_COMPLETE':'SEASON_READY',revision:accepted,rivalryId,managerRole:role,state:{runtimeRevision:'1.9.1-r13',rivalryId,totalSeasons,acceptedSeasons:accepted,completedSeason:accepted||null,activeSeason:accepted<totalSeasons?accepted+1:null,terminal:accepted===totalSeasons,fixedLeagueId:'premier_league',fixedClubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},acceptedRevisionKey:accepted?`accepted_${accepted}`:''}};
      }
    };
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk:{}})};
    const screen=document.getElementById('seasonEntry'),review=document.getElementById('seasonReviewPanel');
    screen?.classList.remove('hidden');review?.classList.remove('hidden');
    let historyPanel=document.getElementById('sharedHistoryConvergencePanel');
    if(!historyPanel){historyPanel=document.createElement('section');historyPanel.id='sharedHistoryConvergencePanel';review.appendChild(historyPanel);}
    historyPanel.classList.add('hidden');
    const preAuthorityLocalRound=currentShowdown.currentRound;
    const storageBefore=Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]));
    const loadCandidateScript=path=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.async=false;script.onload=()=>resolve(true);script.onerror=()=>reject(new Error(`Unable to load candidate ${path}.`));document.head.appendChild(script);});
    if(!window.CareerModeProductionSharedMultiSeasonProgression)await loadCandidateScript('js/productionSharedMultiSeasonProgression.js');
    CareerModeProductionSharedMultiSeasonProgression.install();
    const preAuthorityResolved=CareerModeProductionSharedMultiSeasonProgression.resolveSeason();
    if(preAuthorityResolved!==preAuthorityLocalRound)throw new Error(`pre-authority fallback changed: ${preAuthorityResolved} vs ${preAuthorityLocalRound}`);
    addEventListener('career-mode-shared-season-cursor-change',event=>window.__r13CursorEvents.push(event.detail));
    const first=await CareerModeProductionSharedMultiSeasonProgression.refresh();
    if(!first)throw new Error('r13 progression did not establish first authoritative view.');
    return {rivalryId,sessionId,deviceId,accountId,preAuthorityLocalRound,preAuthorityResolved,storageBefore};
  },{role,saveId,totalSeasons,rivalryId,sessionId,deviceId,accountId,canonicalKeys});
}

async function setAccepted(page,season){
  await page.evaluate(async season=>{
    window.__r13Accepted=season;
    window.__r13HistorySeason=season;
    document.getElementById('seasonEntry')?.classList.remove('hidden');
    document.getElementById('seasonReviewPanel')?.classList.remove('hidden');
    document.getElementById('sharedHistoryConvergencePanel')?.classList.remove('hidden');
    const result=await CareerModeProductionSharedMultiSeasonProgression.refresh();
    if(!result)throw new Error(`r13 progression refresh failed for accepted season ${season}.`);
  },season);
}

async function runPlan(page,{role,saveId,totalSeasons,rivalrySeed}){
  const meta=await installHarness(page,{role,saveId,totalSeasons,rivalrySeed});
  assert.equal(meta.preAuthorityResolved,7,'r13 must remain additive before provider authority and preserve legacy/local season fallback.');
  assert.equal(await page.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.resolveSeason()),1,'authoritative r13 must begin its witnessed cursor at Season 1 even when the local Save is on another round.');
  for(let season=1;season<=totalSeasons;season+=1){
    await setAccepted(page,season);
    assert.equal(await page.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.resolveSeason()),season,`resolved shared season must equal witnessed season ${season}.`);
    const action=page.locator('#sharedMultiSeasonContinueAction');
    await action.waitFor({state:'visible',timeout:5000});
    if(season<totalSeasons){
      assert.equal(await action.isEnabled(),true,`Season ${season} must allow exactly one witnessed advance.`);
      assert.equal(await action.textContent(),`CONTINUE TO SEASON ${season+1}`);
      await action.click();
      await page.waitForFunction(expected=>window.CareerModeProductionSharedMultiSeasonProgression.resolveSeason()===expected,season+1,{timeout:5000});
      assert.equal(await page.evaluate(()=>currentShowdown.currentRound),7,'shared progression must not mutate canonical local currentRound.');
      assert.equal(await page.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason()),false,'duplicate advance without the next visible accepted history must fail closed.');
    }else{
      assert.equal(await action.isDisabled(),true,'terminal plan must not expose another season.');
      assert.equal(await action.textContent(),'SEASON PLAN COMPLETE ✓');
    }
  }
  return page.evaluate(({canonicalKeys,totalSeasons})=>({
    resolved:CareerModeProductionSharedMultiSeasonProgression.resolveSeason(),
    currentRound:currentShowdown.currentRound,
    cursorEvents:window.__r13CursorEvents,
    providerCalls:window.__r13ProviderCalls,
    storageAfter:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
    fixedClubs:CareerModeProductionSharedMultiSeasonProgression.getState().state.fixedClubs,
    terminal:CareerModeProductionSharedMultiSeasonProgression.getState().state.terminal,
    totalSeasons
  }),{canonicalKeys,totalSeasons}).then(result=>({...result,storageBefore:meta.storageBefore,meta}));
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const host=await hostContext.newPage(),peer=await peerContext.newPage(),errors=[];
  host.on('pageerror',error=>errors.push(`host: ${error.message}`));peer.on('pageerror',error=>errors.push(`peer: ${error.message}`));
  try{
    for(const totalSeasons of [1,3,5,10]){
      const rivalrySeed=String(totalSeasons===10?'f':totalSeasons);
      const [hostResult,peerResult]=await Promise.all([
        runPlan(host,{role:'playerOne',saveId:`r13_host_${totalSeasons}`,totalSeasons,rivalrySeed}),
        runPlan(peer,{role:'playerTwo',saveId:`r13_peer_${totalSeasons}`,totalSeasons,rivalrySeed})
      ]);
      for(const result of [hostResult,peerResult]){
        assert.equal(result.resolved,totalSeasons);
        assert.equal(result.currentRound,7);
        assert.equal(result.terminal,true);
        assert.deepEqual(result.fixedClubs,{playerOne:'Arsenal',playerTwo:'Liverpool'});
        assert.deepEqual(result.storageAfter,result.storageBefore,'r13 progression must not mutate canonical storage.');
        assert.equal(result.cursorEvents.length,Math.max(0,totalSeasons-1),'exactly one cursor event is allowed per non-terminal accepted season.');
        assert.deepEqual(result.cursorEvents.map(event=>event.activeSeason),Array.from({length:Math.max(0,totalSeasons-1)},(_,index)=>index+2));
        assert.ok(result.providerCalls.length>=totalSeasons+1,'each accepted progression state must be provider refreshed.');
        assert.ok(result.providerCalls.every(call=>call.rivalryId===result.meta.rivalryId&&call.sessionId===result.meta.sessionId&&call.deviceId===result.meta.deviceId&&call.uid===result.meta.accountId),'provider reads must retain exact account/device/rivalry/session authority.');
      }
      assert.deepEqual(hostResult.cursorEvents.map(event=>event.activeSeason),peerResult.cursorEvents.map(event=>event.activeSeason),`both managers must converge on identical ${totalSeasons}-season progression.`);
    }
    assert.deepEqual(errors,[],'r13 Multi Season browser audit emitted page errors.');
    process.stdout.write('PASS Shared Multi Season desktop/mobile production flow: both isolated manager contexts complete 1/3/5/10 plans from Season 1, require a visible authoritative History Convergence witness before each exact-once advance, converge on identical next-season cursors, preserve fixed clubs, reject duplicate advances, close exactly at the configured final season, and leave local currentRound plus canonical storage unchanged.\n');
  }finally{
    await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
