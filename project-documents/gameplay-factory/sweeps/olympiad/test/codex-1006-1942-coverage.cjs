// Area 04: normal season progression, scores, and a real page reload.
// Browser setup is copied from the repository's focused progression audit.
// Reads return checked game history; no live game or saved career is touched.
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../../../../..');
const {projection,result}=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));
const Multi=require(path.join(ROOT,'js/sharedMultiSeasonProgression.js'));
const Final=require(path.join(ROOT,'js/sharedFinalReconciliation.js'));
const protocol=Multi.createProtocol();
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require(path.join(ROOT,'tests/support/chromium-runtime.cjs'));

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
      managers:{playerOne:'Daniel',playerTwo:'Nik'},
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
        const dashboard={acceptedSeasons:accepted,managerTotals:{playerOne:accepted*3,playerTwo:accepted},lastSeason:accepted?{seasonNumber:accepted,winner:'playerOne',playerOne:{leaguePosition:1,score:3},playerTwo:{leaguePosition:3,score:1}}:null};
        return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r13',phase:accepted===totalSeasons?'SHOWDOWN_COMPLETE':'SEASON_READY',revision:accepted,rivalryId,managerRole:role,state:{runtimeRevision:'1.9.1-r13',rivalryId,totalSeasons,acceptedSeasons:accepted,completedSeason:accepted||null,activeSeason:accepted<totalSeasons?accepted+1:null,terminal:accepted===totalSeasons,fixedLeagueId:'premier_league',fixedClubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},acceptedRevisionKey:accepted?`accepted_${accepted}`:''},dashboard};
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


function frames(totalSeasons,seed){
  const seasons=[];const output=[];
  const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,leagueId:'premier_league',totalSeasons,clubs:{playerOne:'club_a',playerTwo:'club_b'}};
  let previous=protocol.derive({rivalryId:'pair_'+seed.repeat(64),setup});
  output.push({state:previous,dashboard:{acceptedSeasons:0,managerTotals:{playerOne:0,playerTwo:0},lastSeason:null},history:null});
  for(let n=1;n<=totalSeasons;n++){
    // Different league finishes make Daniel win every zero-score season by the season tie-break;
    // equal Showdown totals must still produce a final DRAW.
    seasons.push(n===1?[result({domesticCup:true}),result({leaguePosition:6})]:n===2?[result(),result({leaguePosition:6,domesticCup:true})]:[result({leaguePosition:2,leaguePoints:0,leagueGoals:0}),result({leaguePosition:3,leaguePoints:0,leagueGoals:0})]);
    const p=projection({seed,totalSeasons,seasons});
    const state=protocol.observe({previous,rivalryId:p.rivalryId,setup,history:p});
    assert.equal(state.completedSeason,n);assert.equal(state.activeSeason,n===totalSeasons?null:n+1);
    assert.deepEqual(state.fixedClubs,setup.clubs);
    const last=p.seasonHistory.at(-1);
    output.push({state,history:p,dashboard:{acceptedSeasons:n,managerTotals:{playerOne:p.managerRecords.playerOne.totalPoints,playerTwo:p.managerRecords.playerTwo.totalPoints},lastSeason:{seasonNumber:n,winner:last.winner,playerOne:{leaguePosition:last.playerOne.leaguePosition,score:last.playerOne.scoring.total},playerTwo:{leaguePosition:last.playerTwo.leaguePosition,score:last.playerTwo.scoring.total}}}});
    previous=state;
  }
  const f=output.at(-1),slot=f.history.managerSlots[0];
  const final=Final.reconcile({sharedActive:true,multiSeason:{ok:true,authoritative:true,phase:f.state.phase,rivalryId:f.state.rivalryId,state:f.state},history:{authoritative:true,phase:'HISTORY_CONVERGED',rivalryId:f.state.rivalryId,projection:f.history},localReconciliation:{phase:'REMOTE_OBSERVED',canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:'playerOne'}}});
  assert.equal(final.winner,'draw');assert.deepEqual(final.managerTotals,{playerOne:1,playerTwo:1});
  return output;
}
async function setFrame(page,frame,review=false){
  return page.evaluate(async({frame,review})=>{
    window.__area04Frame=frame;
    const s=CareerModeProductionSharedShowdownSetup.getState();s.setup.clubs={playerOne:'club_a',playerTwo:'club_b'};
    window.CareerModeSparkSharedMultiSeasonProgression.read=async()=>({ok:true,authoritative:true,runtimeRevision:'1.9.1-r13',phase:window.__area04Frame.state.phase,revision:window.__area04Frame.state.revision,rivalryId:window.__area04Frame.state.rivalryId,managerRole:s.managerRole,state:window.__area04Frame.state,dashboard:window.__area04Frame.dashboard});
    window.CareerModeProductionSharedHistoryConvergence.getState=()=>window.__area04Frame.history?{authoritative:true,phase:'HISTORY_CONVERGED',rivalryId:s.rivalryId,throughSeason:window.__area04Frame.history.acceptedSeasons,projection:window.__area04Frame.history}:null;
    document.querySelectorAll('.screen').forEach(n=>n.classList.add('hidden'));
    document.getElementById(review?'seasonEntry':'dashboard').classList.remove('hidden');
    document.getElementById('seasonReviewPanel').classList.toggle('hidden',!review);
    document.getElementById('sharedHistoryConvergencePanel').classList.toggle('hidden',!review);
    await CareerModeProductionSharedMultiSeasonProgression.refresh();
    return CareerModeProductionSharedMultiSeasonProgression.resolveSeason();
  },{frame,review});
}

async function installNextTransfer(page){
  await page.evaluate(async()=>{
    const setup=CareerModeProductionSharedShowdownSetup.getState();
    window.__area04TransferReads=[];
    window.CareerModeProductionSharedCareerStart={getState:()=>({state:{phase:'CAREER_START_READY',revision:2}}),refresh:async()=>({ok:true})};
    const forbidden=async()=>{throw Error('Coverage run cannot write a transfer');};
    window.CareerModeSparkSharedTransferChallenge={read:async options=>{
      window.__area04TransferReads.push(options.seasonNumber);
      return {ok:true,revision:0,seasonNumber:options.seasonNumber,rivalryId:setup.rivalryId,managerRole:setup.managerRole,state:null,ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null};
    },startWindow:forbidden,requestEndWindow:forbidden,advanceExpiredWindow:forbidden,lockGuesses:forbidden,lockSignings:forbidden};
    window.CareerModeProductionFirebaseRuntime.ensureAccountServices=async()=>({ok:true,auth:{currentUser:{uid:setup.accountId,getIdTokenResult:async()=>({issuedAtTime:new Date().toISOString()})}},firestore:{},firestoreSdk:{}});
    await loadRuntimeScript('area04-real-transfer','js/productionSharedTransferChallenge.js',()=>window.CareerModeProductionSharedTransferChallenge);
    CareerModeProductionSharedTransferChallenge.install();
  });
}

(async()=>{
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({headless:true,executablePath:runtime.executablePath,args:runtime.args});
  try{
    for(const totalSeasons of [3,10])for(const role of ['playerOne','playerTwo']){
      const context=await browser.newContext({viewport:role==='playerOne'?{width:1280,height:800}:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const seed=totalSeasons===3?'3':'a';const data=frames(totalSeasons,seed);const options={role,saveId:'area04_'+role+'_'+totalSeasons,totalSeasons,rivalrySeed:seed};
      await installHarness(page,options);await setFrame(page,data[0]);await installNextTransfer(page);
      assert.equal(await page.locator('#dashboardRound').textContent(),'Season 1 of '+totalSeasons);
      for(let n=1;n<=totalSeasons;n++){
        await setFrame(page,data[n],true);
        const button=page.locator('#sharedMultiSeasonContinueAction');await button.waitFor({state:'visible'});
        if(n<totalSeasons){
          assert.equal(await button.isEnabled(),true);assert.equal(await button.textContent(),'CONTINUE TO SEASON '+(n+1));await button.click();
          await page.waitForFunction(expected=>CareerModeProductionSharedMultiSeasonProgression.resolveSeason()===expected,n+1);
          assert.equal(await page.locator('#dashboardRound').textContent(),'Season '+(n+1)+' of '+totalSeasons);
          assert.equal(await page.locator('#dashboardScoreOne').textContent(),String(data[n].dashboard.managerTotals.playerOne));
          assert.equal(await page.locator('#dashboardScoreTwo').textContent(),String(data[n].dashboard.managerTotals.playerTwo));
          assert.equal(await page.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason()),false);
          await page.waitForFunction(expected=>CareerModeProductionSharedTransferChallenge.getState()?.seasonNumber===expected,n+1);
          await page.locator('#transferChallenge').waitFor({state:'visible'});
          assert.equal(await page.locator('#transferChallengeTitle').textContent(),'SEASON '+(n+1)+' SHARED TRANSFER CHALLENGE');
          assert.equal(await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'),null);
          if(n===Math.floor(totalSeasons/2)){
            await page.screenshot({path:'/tmp/area04-'+totalSeasons+'-'+role+'-before-reload.png'});
            await page.reload({waitUntil:'domcontentloaded'});await installHarness(page,options);await setFrame(page,data[n]);await installNextTransfer(page);
            const resumed=await page.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.resumeFromAuthority());
            assert.equal(resumed.season,n+1);assert.equal(resumed.acceptedSeasons,n);
            assert.equal(await page.locator('#dashboardRound').textContent(),'Season '+(n+1)+' of '+totalSeasons);
            console.log('PASS '+role+' '+totalSeasons+' seasons: real page reload resumes Season '+(n+1)+' with '+n+' saved seasons');
          }
        }else{
          assert.equal(await button.isDisabled(),true);assert.equal(await button.textContent(),'SEASON PLAN COMPLETE ✓');
          assert.equal(await page.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason()),false);
          assert.equal(await page.locator('#dashboardScoreOne').textContent(),'1');assert.equal(await page.locator('#dashboardScoreTwo').textContent(),'1');
          assert.equal(await page.locator('#dashboardSeriesStatus').textContent(),'LEVEL');
          assert.equal(data[n].dashboard.lastSeason.playerOne.score,0);assert.equal(data[n].dashboard.lastSeason.playerTwo.score,0);
          assert.equal(data[n].history.seasonHistory.at(-1).winner,'playerOne');
          await page.screenshot({path:'/tmp/area04-'+totalSeasons+'-'+role+'-final.png'});
          console.log('PASS '+role+' '+totalSeasons+' seasons: final 0-0 season, season tie-break, tied 1-1 total, final DRAW, no extra season');
        }
      }
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('PASS area 04: each next-season button opens the fresh next-season real Transfer Challenge screen; seasons 1-3 and 1-10 on both screens; fixed clubs; cumulative scores; exact-once advance; real halfway reload; 0-0 season; tied final total and DRAW. Checked game history supplied by the Node harness, with no live saves changed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
