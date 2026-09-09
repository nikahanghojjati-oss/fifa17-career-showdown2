const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryA='pair_'+('a'.repeat(64));
const rivalryB='pair_'+('b'.repeat(64));
const sessionId='session_'+('c'.repeat(64));

async function prepare(page,{managerRole,saveId}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:12000});
  await page.evaluate(async({managerRole,saveId,rivalryA,rivalryB,sessionId})=>{
    await ensureGameplayModules();
    const roleOther=managerRole==='playerOne'?'playerTwo':'playerOne';
    const managers={playerOne:'Nik',playerTwo:'Daniel'};
    const clubs={playerOne:'Arsenal',playerTwo:'Liverpool'};
    currentShowdown={id:saveId,currentRound:1,status:'Ready',selectedLeague:{id:'premier_league',name:'Premier League'},sharedJourney:{mode:'shared',rivalryId:rivalryA},managers,clubs};

    let activeRivalry=rivalryA;
    let serverPhase='COMPLETED';
    let reads=0;
    let mutations=0;
    let raceMode=false;
    let raceStage=0;
    let releaseRaceA=null;
    let releaseRaceB=null;
    const setupValue=()=>({
      status:'ready',ready:true,open:false,busy:false,revision:6,phase:'SHOWDOWN_CONFIRMED',
      rivalryId:activeRivalry,sessionId,deviceId:'device_'+(managerRole==='playerOne'?'1':'2').repeat(32),managerRole,
      setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],clubs}
    });
    window.CareerModeProductionSharedShowdownSetup={getState:setupValue,refresh:async()=>({ok:true})};
    window.CareerModeProductionSharedCareerStart={getState:()=>({state:{phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']}}),refresh:async()=>({ok:true})};
    window.CareerModeSharedTransferChallenge={runtimeRevision:'1.9.1-r8'};
    const completedInputs=role=>({
      guesses:[{slot:1,type:'league',valueId:'england-premier-league'}],
      signings:[{slot:1,name:role==='playerOne'?'Player A':'Player B',leagueId:'spain-primera-division',nationalityId:'england'}]
    });
    const makeView=()=>{
      if(serverPhase==='WINDOW_OPEN')return {ok:true,revision:1,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'WINDOW_OPEN',revision:1,startedAtEpochMs:Date.now(),endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]},ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null};
      return {ok:true,revision:7,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'COMPLETED',revision:7,startedAtEpochMs:Date.now()-900000,endedAtEpochMs:Date.now()-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']},ownInputs:completedInputs(managerRole),opponentInputs:completedInputs(roleOther),verdicts:{playerOne:[],playerTwo:[]}};
    };
    const rejectMutation=async()=>{mutations+=1;return {ok:false,code:'AUDIT_MUTATION_FORBIDDEN'};};
    window.CareerModeSparkSharedTransferChallenge={
      read:async()=>{
        reads+=1;
        const snapshot=makeView();
        if(raceMode){
          raceStage+=1;
          if(raceStage===1)await new Promise(resolve=>{releaseRaceA=resolve;});
          else if(raceStage===2)await new Promise(resolve=>{releaseRaceB=resolve;});
        }
        return snapshot;
      },
      startWindow:rejectMutation,requestEndWindow:rejectMutation,advanceExpiredWindow:rejectMutation,lockGuesses:rejectMutation,lockSignings:rejectMutation
    };
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:managerRole==='playerOne'?'account_one':'account_two'}},firestore:{},firestoreSdk:{}})};

    await loadRuntimeScript('ssjr-transfer-replay-audit','js/productionSharedTransferChallenge.js',()=>window.CareerModeProductionSharedTransferChallenge);
    CareerModeProductionSharedTransferChallenge.install();
    const switchSave=()=>{
      activeRivalry=rivalryB;serverPhase='WINDOW_OPEN';
      currentShowdown={...currentShowdown,id:`${saveId}_switched`,currentRound:1,sharedJourney:{mode:'shared',rivalryId:rivalryB}};
    };
    window.__transferAudit={
      counts:()=>({reads,mutations}),
      switchSave,
      beginRaceA(){raceMode=true;raceStage=0;releaseRaceA=null;releaseRaceB=null;window.__raceA=CareerModeProductionSharedTransferChallenge.refresh();},
      switchAndBeginRaceB(){switchSave();window.__raceB=CareerModeProductionSharedTransferChallenge.refresh();},
      raceStatus:()=>({raceStage,hasReleaseA:typeof releaseRaceA==='function',hasReleaseB:typeof releaseRaceB==='function'}),
      releaseA(){if(releaseRaceA){const release=releaseRaceA;releaseRaceA=null;release();}},
      releaseB(){if(releaseRaceB){const release=releaseRaceB;releaseRaceB=null;release();}},
      async finishRace(){const results=await Promise.all([window.__raceA,window.__raceB]);raceMode=false;return results.map(Boolean);},
      rivalryB
    };
    await CareerModeProductionSharedTransferChallenge.open();
  },{managerRole,saveId,rivalryA,rivalryB,sessionId});
}

async function assertReplay(page,roleLabel){
  await page.locator('#transferChallenge').waitFor({state:'visible',timeout:5000});
  const baseline=await page.evaluate(()=>window.__transferAudit.counts());
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'),'WINDOW_OPEN',`${roleLabel} must replay the missed transfer window first.`);
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-transfer-phase'),'window');
  assert.match(await page.locator('#transferPhaseStatus').textContent(),/HISTORICAL REPLAY/);
  assert.equal(await page.locator('#transferTimerDisplay').textContent(),'REPLAY','historical window must never look like a live timer');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#transferChallenge input,#transferChallenge select')].every(node=>node.disabled)),true,'historical replay inputs must remain read-only');

  await page.locator('#continueFromTransfers').click();
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'),'GUESS_ENTRY',`${roleLabel} must replay private Guess Entry second.`);
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-transfer-phase'),'guess_entry');
  assert.equal(await page.locator('#transferChallenge .transferGuessCard:not(.hidden)').count(),1,'replay must not expose both guess cards before the real completed stage is rendered');

  await page.locator('#continueFromTransfers').click();
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'),'SIGNING_ENTRY',`${roleLabel} must replay private Signing Entry third.`);
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-transfer-phase'),'signing_entry');
  assert.equal(await page.locator('#transferChallenge .transferManagerCard:not(.hidden)').count(),1,'replay must keep the rival signing card hidden until actual completion');

  await page.locator('#continueFromTransfers').click();
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'),null,`${roleLabel} must leave replay only after every earlier canonical phase was witnessed.`);
  assert.equal(await page.locator('#transferChallenge').getAttribute('data-transfer-phase'),'completed');
  assert.equal(await page.locator('#continueFromTransfers').textContent(),'SHARED SEASON RESULTS COMING NEXT');
  assert.equal(await page.locator('#continueFromTransfers').isDisabled(),true);
  const after=await page.evaluate(()=>window.__transferAudit.counts());
  assert.equal(after.mutations,0,'ordered replay must never invoke a provider mutation');
  assert.equal(after.reads,baseline.reads,'replay-next actions must not make provider reads');
}

async function assertCrossSaveRace(page){
  const before=await page.evaluate(()=>window.__transferAudit.counts().reads);
  await page.evaluate(()=>window.__transferAudit.beginRaceA());
  await page.waitForFunction(()=>window.__transferAudit.raceStatus().raceStage===1&&window.__transferAudit.raceStatus().hasReleaseA,null,{timeout:5000});
  await page.evaluate(()=>window.__transferAudit.switchAndBeginRaceB());
  assert.equal(await page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge.getState()),null,'starting the new Save refresh must clear the prior completed cache immediately');
  await page.evaluate(()=>window.__transferAudit.releaseA());
  await page.waitForFunction(()=>window.__transferAudit.raceStatus().raceStage===2&&window.__transferAudit.raceStatus().hasReleaseB,null,{timeout:5000});
  assert.equal(await page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge.getState()),null,'stale Save A completion must be discarded while Save B read is still pending');
  await page.evaluate(()=>window.__transferAudit.releaseB());
  assert.deepEqual(await page.evaluate(()=>window.__transferAudit.finishRace()),[false,true],'stale A refresh must resolve without binding while B refresh succeeds');
  const expected=await page.evaluate(()=>window.__transferAudit.rivalryB);
  await page.waitForFunction(rivalry=>window.CareerModeProductionSharedTransferChallenge.getState()?.rivalryId===rivalry,expected,{timeout:5000});
  assert.equal(await page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge.getState()?.state?.phase),'WINDOW_OPEN','only the new Save B provider state may bind after the overlap');
  assert.equal(await page.evaluate(()=>window.__transferAudit.counts().reads),before+2,'the overlap must issue one context-specific read for A and one for B');
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const host=await hostContext.newPage();
  const peer=await peerContext.newPage();
  const errors=[];host.on('pageerror',error=>errors.push(`host: ${error.message}`));peer.on('pageerror',error=>errors.push(`peer: ${error.message}`));
  try{
    await prepare(host,{managerRole:'playerOne',saveId:'shared_save_host'});
    await assertReplay(host,'Player One desktop');
    await assertCrossSaveRace(host);

    await prepare(peer,{managerRole:'playerTwo',saveId:'shared_save_peer'});
    await assertReplay(peer,'Player Two mobile');
    const beforeSwitch=await peer.evaluate(()=>window.__transferAudit.counts().reads);
    await peer.evaluate(()=>window.__transferAudit.switchSave());
    await peer.waitForFunction(before=>window.__transferAudit.counts().reads>before,beforeSwitch,{timeout:20000});
    await peer.waitForFunction(expected=>window.CareerModeProductionSharedTransferChallenge.getState()?.rivalryId===expected,await peer.evaluate(()=>window.__transferAudit.rivalryB),{timeout:5000});
    assert.equal(await peer.locator('#transferChallenge').getAttribute('data-transfer-phase'),'window','switching away from a completed shared Save must refresh and render the new Save context on the real automatic poll');

    assert.deepEqual(errors,[],'Shared Transfer Challenge replay audit emitted page errors.');
    process.stdout.write('PASS Shared Transfer Challenge ordered full-screen replay and Save isolation: Player One desktop and Player Two mobile each replay missed WINDOW_OPEN -> GUESS_ENTRY -> SIGNING_ENTRY before actual COMPLETED; replay stays read-only/private with zero provider mutations or replay reads; an in-flight Save A read is discarded when Save B becomes active; and the real 15-second automatic poll detects a completed-Save context switch.\n');
  }finally{
    await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
